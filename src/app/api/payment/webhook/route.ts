import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, saveSubscription } from '@/lib/supabase';
import { addCustomerToSheet } from '@/lib/googleSheets';
import { syncToCrm } from '@/lib/crmSupabase';
import Razorpay from 'razorpay';

// Helper function to extract add-ons from Razorpay order notes
async function getAddOnsFromRazorpayOrder(razorpayOrderId: string): Promise<string> {
  try {
    // Check if Razorpay credentials are available
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('Razorpay credentials not configured for fetching order notes');
      return 'Unable to fetch add-ons';
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const orderDetails = await razorpay.orders.fetch(razorpayOrderId);
    const notes = orderDetails.notes || {};

    console.log('Razorpay order notes:', JSON.stringify(notes, null, 2));

    // Build add-ons string from actual selection
    // Check both current naming (wardrobe_detox_addon) and legacy naming patterns
    const addOns: string[] = [];

    // Wardrobe Detox (replaces old Diva Diet Plan)
    if (notes.wardrobe_detox_addon === 'true' || notes.wardrobe_detox === 'true' || notes.diva_diet_plan_addon === 'true') {
      addOns.push('Wardrobe Detox');
    }

    // Smart Shopper's Guide
    if (notes.smart_shoppers_guide_addon === 'true' || notes.smart_shoppers_guide === 'true') {
      addOns.push("Smart Shopper's Guide");
    }

    // Outfit Preview
    if (notes.outfit_preview_addon === 'true' || notes.outfit_preview === 'true') {
      addOns.push('Outfit Preview on You');
    }

    console.log('Extracted add-ons:', addOns);
    return addOns.length > 0 ? addOns.join(', ') : 'None';
  } catch (error) {
    console.error('Error fetching Razorpay order notes:', error);
    return 'Error fetching add-ons';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const body = await request.text();

    // Log all headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('Webhook headers:', headers);
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);

    // Get Razorpay signature from headers
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.log('No Razorpay signature found in headers');
      console.log('Available headers:', Object.keys(headers));
      console.log('This might be a test request or wrong webhook URL');
      return NextResponse.json({ status: 'error', message: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('Razorpay webhook secret not configured');
      return NextResponse.json({ status: 'error', message: 'Webhook not configured' }, { status: 500 });
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('Invalid Razorpay webhook signature');
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }

    // Log the raw body for debugging
    console.log('Webhook raw body:', body);

    // Parse the webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.log('Failed to parse webhook body:', error);
      return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Received Razorpay webhook event:', webhookData.event);
    console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));

    // Handle different webhook events
    const { event, payload } = webhookData;

    console.log(`Processing webhook event: ${event}`);

    switch (event) {
      case 'payment.captured':
        console.log('Handling payment.captured event');
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        console.log('Handling payment.failed event');
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'order.paid':
        console.log('Handling order.paid event');
        await handleOrderPaid(payload.order.entity, payload.payment.entity);
        break;

      case 'payment.authorized':
        console.log('Handling payment.authorized event (test mode)');
        await handlePaymentAuthorized(payload.payment.entity);
        break;

      // Subscription Events
      case 'subscription.activated':
        console.log('Handling subscription.activated event');
        await handleSubscriptionActivated(payload.subscription.entity);
        break;

      case 'subscription.charged':
        console.log('Handling subscription.charged event');
        await handleSubscriptionCharged(payload.subscription.entity, payload.payment?.entity);
        break;

      case 'subscription.cancelled':
        console.log('Handling subscription.cancelled event');
        await handleSubscriptionCancelled(payload.subscription.entity);
        break;

      case 'subscription.paused':
        console.log('Handling subscription.paused event');
        await handleSubscriptionPaused(payload.subscription.entity);
        break;

      case 'subscription.resumed':
        console.log('Handling subscription.resumed event');
        await handleSubscriptionResumed(payload.subscription.entity);
        break;

      case 'subscription.completed':
        console.log('Handling subscription.completed event');
        await handleSubscriptionCompleted(payload.subscription.entity);
        break;

      default:
        console.log(`Unhandled Razorpay webhook event: ${event}`);
        console.log('Event payload:', payload);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    // Always return 200 to prevent Razorpay from retrying
    return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 200 });
  }
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  method: string;
  error_code?: string;
  error_description?: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
}

async function handlePaymentCaptured(payment: RazorpayPayment) {
  try {
    console.log('Payment captured:', payment.id);

    const { order_id, amount, method } = payment;

    // First try to find the order by razorpay_order_id
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('razorpay_order_id', order_id)
      .single();

    if (existingOrder) {
      // Fetch actual add-ons from Razorpay order notes
      const addOnsString = await getAddOnsFromRazorpayOrder(order_id);

      // Update existing order - match your actual schema
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          razorpay_payment_id: payment.id,
          payment_method: method,
          amount: Math.round(amount / 100), // Convert to integer as per your schema
          add_ons: addOnsString,
          product_type: 'consultation'
        })
        .eq('razorpay_order_id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log(`Order ${order_id} marked as completed`);

        // Add customer data to Google Sheets (only after successful payment)
        try {
          // Fetch actual add-ons from Razorpay order notes
          const addOnsString = await getAddOnsFromRazorpayOrder(order_id);

          await addCustomerToSheet({
            customer_name: existingOrder.customers.name,
            customer_email: existingOrder.customers.email,
            customer_phone: existingOrder.customers.phone,
            order_amount: existingOrder.amount,
            order_id: existingOrder.id,
            customer_id: existingOrder.customer_id,
            payment_status: 'completed',
            add_ons: addOnsString,
            service_type: 'ICONIK Style Consultation'
          });
          console.log('Add-ons saved to Supabase and Google Sheets:', addOnsString);
          console.log('Customer data added to Google Sheets after successful payment');

          // Sync to CRM database
          try {
            const crmResult = await syncToCrm({
              customer_name: existingOrder.customers.name,
              customer_phone: existingOrder.customers.phone,
              add_ons: addOnsString,
              order_amount: existingOrder.amount,
            });
            if (crmResult.success) {
              console.log('Customer synced to CRM:', crmResult.consultation_id);
            } else {
              console.log('CRM sync skipped or failed:', crmResult.error);
            }
          } catch (crmError) {
            console.log('CRM sync error:', crmError);
          }
        } catch (sheetError) {
          console.log('Failed to add customer to Google Sheets:', sheetError);
        }
      }
    } else {
      console.log(`Order with razorpay_order_id ${order_id} not found`);
    }

  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
  try {
    console.log('Payment failed:', payment.id);

    const { order_id, error_code, error_description } = payment;

    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        razorpay_payment_id: payment.id,
        error_code,
        error_description
      })
      .eq('razorpay_order_id', order_id);

    if (updateError) {
      console.error('Error updating failed order:', updateError);
    } else {
      console.log(`Order ${order_id} marked as failed`);
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentAuthorized(payment: RazorpayPayment) {
  try {
    console.log('Payment authorized (test mode):', payment.id);

    const { order_id, amount, method } = payment;

    // Fetch actual add-ons from Razorpay order notes
    const addOnsString = await getAddOnsFromRazorpayOrder(order_id);

    // Update order status in database for test mode
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        razorpay_payment_id: payment.id,
        payment_method: method,
        amount: Math.round(amount / 100), // Convert to integer as per your schema
        add_ons: addOnsString,
        product_type: 'consultation'
      })
      .eq('razorpay_order_id', order_id);

    if (updateError) {
      console.error('Error updating test payment order:', updateError);
    } else {
      console.log(`Test payment ${payment.id} marked as completed`);

      // Add customer data to Google Sheets for test payments too
      try {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('*, customers(*)')
          .eq('razorpay_order_id', order_id)
          .single();

        if (existingOrder) {
          await addCustomerToSheet({
            customer_name: existingOrder.customers.name,
            customer_email: existingOrder.customers.email,
            customer_phone: existingOrder.customers.phone,
            order_amount: existingOrder.amount,
            order_id: existingOrder.id,
            customer_id: existingOrder.customer_id,
            payment_status: 'completed',
            add_ons: addOnsString,
            service_type: 'ICONIK Style Consultation'
          });
          console.log('Test customer data added to Google Sheets');

          // Sync to CRM database
          try {
            const crmResult = await syncToCrm({
              customer_name: existingOrder.customers.name,
              customer_phone: existingOrder.customers.phone,
              add_ons: addOnsString,
              order_amount: existingOrder.amount,
            });
            if (crmResult.success) {
              console.log('Test customer synced to CRM:', crmResult.consultation_id);
            }
          } catch (crmError) {
            console.log('CRM sync error:', crmError);
          }
        }
      } catch (sheetError) {
        console.log('Failed to add test customer to Google Sheets:', sheetError);
      }
    }

  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

async function handleOrderPaid(order: RazorpayOrder, payment: RazorpayPayment) {
  try {
    console.log('Order paid:', order.id);

    // First try to find the order by razorpay_order_id
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('razorpay_order_id', order.id)
      .single();

    if (existingOrder) {
      // Fetch actual add-ons from Razorpay order notes
      const addOnsString = await getAddOnsFromRazorpayOrder(order.id);

      // Update order status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: payment.id,
          payment_method: payment.method,
          amount: Math.round(order.amount / 100), // Convert to integer as per your schema
          add_ons: addOnsString,
          product_type: 'consultation'
        })
        .eq('razorpay_order_id', order.id);

      if (updateError) {
        console.error('Error updating paid order:', updateError);
      } else {
        console.log(`Order ${order.id} marked as paid`);

        // Add customer data to Google Sheets
        try {
          await addCustomerToSheet({
            customer_name: existingOrder.customers.name,
            customer_email: existingOrder.customers.email,
            customer_phone: existingOrder.customers.phone,
            order_amount: existingOrder.amount,
            order_id: existingOrder.id,
            customer_id: existingOrder.customer_id,
            payment_status: 'paid',
            add_ons: addOnsString,
            service_type: 'ICONIK Style Consultation'
          });
          console.log('Customer data added to Google Sheets after order.paid event');

          // Sync to CRM database
          try {
            const crmResult = await syncToCrm({
              customer_name: existingOrder.customers.name,
              customer_phone: existingOrder.customers.phone,
              add_ons: addOnsString,
              order_amount: existingOrder.amount,
            });
            if (crmResult.success) {
              console.log('Customer synced to CRM:', crmResult.consultation_id);
            }
          } catch (crmError) {
            console.log('CRM sync error:', crmError);
          }
        } catch (sheetError) {
          console.log('Failed to add customer to Google Sheets:', sheetError);
        }
      }
    } else {
      console.log(`Order with razorpay_order_id ${order.id} not found in database`);
    }

  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// ============ SUBSCRIPTION WEBHOOK HANDLERS ============

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  charge_at?: number;
  start_at?: number;
  end_at?: number;
  paid_count?: number;
  customer_notify?: number;
  quantity?: number;
  notes?: {
    customer_email?: string;
    customer_phone?: string;
    customer_name?: string;
    plan_type?: string;
    [key: string]: unknown;
  };
}

async function handleSubscriptionActivated(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription activated:', subscription.id);

    // Update subscription status to active
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: subscription.start_at
          ? new Date(subscription.start_at * 1000).toISOString()
          : new Date().toISOString(),
        next_billing_date: subscription.charge_at
          ? new Date(subscription.charge_at * 1000).toISOString()
          : null
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription to active:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} marked as active`);
    }

  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

async function handleSubscriptionCharged(subscription: RazorpaySubscription, payment?: RazorpayPayment) {
  try {
    console.log('Subscription charged:', subscription.id);
    console.log('Payment details:', payment?.id);

    // Update subscription billing info and ensure status is active
    const updateData: Record<string, unknown> = {
      status: 'active',
      next_billing_date: subscription.charge_at
        ? new Date(subscription.charge_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    };

    // If this is the first charge, set start_date
    if (subscription.paid_count === 1 && subscription.current_start) {
      updateData.start_date = new Date(subscription.current_start * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription after charge:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} charged successfully, next billing: ${updateData.next_billing_date}`);
    }

  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

async function handleSubscriptionCancelled(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription cancelled:', subscription.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        end_date: subscription.ended_at
          ? new Date(subscription.ended_at * 1000).toISOString()
          : new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating cancelled subscription:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} marked as cancelled`);
    }

  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionPaused(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription paused:', subscription.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused'
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating paused subscription:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} marked as paused`);
    }

  } catch (error) {
    console.error('Error handling subscription paused:', error);
  }
}

async function handleSubscriptionResumed(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription resumed:', subscription.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_billing_date: subscription.charge_at
          ? new Date(subscription.charge_at * 1000).toISOString()
          : null
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating resumed subscription:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} resumed and marked as active`);
    }

  } catch (error) {
    console.error('Error handling subscription resumed:', error);
  }
}

async function handleSubscriptionCompleted(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription completed:', subscription.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        end_date: subscription.ended_at
          ? new Date(subscription.ended_at * 1000).toISOString()
          : new Date().toISOString()
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating completed subscription:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} marked as expired (completed)`);
    }

  } catch (error) {
    console.error('Error handling subscription completed:', error);
  }
}

// GET endpoint for webhook verification/testing
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webhook_secret_configured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    instructions: [
      '1. Configure webhook in Razorpay dashboard',
      '2. Set webhook URL to: https://yourdomain.com/api/payment/webhook',
      '3. Select payment events: payment.captured, payment.failed, order.paid, payment.authorized',
      '4. Select subscription events: subscription.activated, subscription.charged, subscription.cancelled, subscription.paused, subscription.resumed, subscription.completed',
      '5. Test with test mode payments first',
      '6. Check Vercel logs for webhook debugging'
    ]
  });
}