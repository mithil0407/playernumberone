import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { addCustomerToSheet } from '@/lib/googleSheets';
import { syncToCrm } from '@/lib/crmSupabase';
import { sendConfirmationEmail, sendManConfirmationEmail, sendIconikClubWelcomeEmail } from '@/lib/email';
import { recordRevenueEvent } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { MAN_BLUEPRINT_PRODUCT_ID, MAN_OUTFIT_PREVIEW_PRODUCT_ID } from '@/lib/metaPixel';
import { sendMetaPurchaseEvent } from '@/lib/metaConversionsApi';
import {
  INDIA_BLUEPRINT_CONTENT_NAME,
  INDIA_BLUEPRINT_CHECKOUT_URL,
  INDIA_ROOT_BLUEPRINT_CHECKOUT_URL,
  MAN_EDIT_CHECKOUT_URL,
  MAN_EDIT_CONTENT_NAME,
  MAN_EDIT_FUNNEL_CATEGORY,
  MAN_EDIT_PRODUCT_ID,
  buildIndiaBlueprintContentIds,
  indiaFunnelCategoryFromEntry,
} from '@/lib/metaTrackingContract';
import Razorpay from 'razorpay';
import {
  getManEditSubscriptionByRazorpayId,
  loadManEditReportContext,
  rebuildManEditProfile,
  updateManEditSubscriptionFromWebhook,
} from '@/lib/manEdit';

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

    if (notes.iconik_edit_subscription === 'true' || notes.man_edit_subscription === 'true') {
      addOns.push('Iconik Edit subscription');
    }

    console.log('Extracted add-ons:', addOns);
    return addOns.length > 0 ? addOns.join(', ') : 'None';
  } catch (error) {
    console.error('Error fetching Razorpay order notes:', error);
    return 'Error fetching add-ons';
  }
}

async function getBaseProductFromRazorpayOrder(razorpayOrderId: string): Promise<string> {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return '';
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const orderDetails = await razorpay.orders.fetch(razorpayOrderId);
    return (orderDetails.notes as Record<string, string>)?.base_product || '';
  } catch {
    return '';
  }
}

function mapProductType(baseProduct: string): string {
  if (baseProduct === 'Iconik Man Style Blueprint') return 'man_blueprint';
  if (baseProduct === 'Iconik Man Style Blueprint INTL') return 'man_blueprint_intl';
  return 'consultation';
}

async function fetchRazorpayOrderNotes(razorpayOrderId: string): Promise<Record<string, string>> {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return {};
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const orderDetails = await razorpay.orders.fetch(razorpayOrderId);
    return (orderDetails.notes as Record<string, string>) || {};
  } catch {
    return {};
  }
}

/**
 * Builds the server-side Purchase payload for an order.paid event.
 *
 * Every product sold through /api/payment gets server coverage — a browser
 * Purchase can always be lost to a closed tab, a UPI app-switch that never
 * returns, or a blocked SDK, and the Signals Gateway can only relay events the
 * browser actually fired. The payload deliberately mirrors what the checkout
 * page sends: both events carry the Razorpay payment ID as their event ID, so
 * Meta collapses them into one and whichever arrives first must not disagree.
 *
 * Returns null for products that have their own dedicated CAPI route.
 */
function buildMetaPurchasePayloadForOrder(input: {
  baseProduct: string;
  addOnsString: string;
  notes: Record<string, string>;
}) {
  const { baseProduct, addOnsString, notes } = input;
  const isMan = baseProduct === 'Iconik Man Style Blueprint' || baseProduct === 'Iconik Man Style Blueprint INTL';

  if (isMan) {
    const hasOutfitPreview = addOnsString.includes('Outfit Preview on You');
    const contentIds = [MAN_BLUEPRINT_PRODUCT_ID, ...(hasOutfitPreview ? [MAN_OUTFIT_PREVIEW_PRODUCT_ID] : [])];
    return {
      contentName: 'ICONIK Man Complete Package',
      contentIds,
      numItems: contentIds.length,
      contentCategory: 'Man Funnel',
      currency: baseProduct === 'Iconik Man Style Blueprint INTL' ? ('USD' as const) : ('INR' as const),
      eventSourceUrl: 'https://www.iconik.pro/man/checkout',
    };
  }

  if (baseProduct === 'Iconik Style Consultation') {
    const contentIds = buildIndiaBlueprintContentIds({
      wardrobeDetox: addOnsString.includes('Wardrobe Detox'),
      smartShopper: addOnsString.includes("Smart Shopper's Guide"),
      outfitPreview: addOnsString.includes('Outfit Preview on You'),
    });
    return {
      contentName: INDIA_BLUEPRINT_CONTENT_NAME,
      contentIds,
      numItems: contentIds.length,
      // The checkout writes the browser's content_category into the order notes
      // so the deduplicated pair cannot disagree about the funnel entry point.
      contentCategory: notes.funnel_entry || indiaFunnelCategoryFromEntry(null),
      currency: 'INR' as const,
      eventSourceUrl: notes.checkout_source === 'root_checkout'
        ? INDIA_ROOT_BLUEPRINT_CHECKOUT_URL
        : INDIA_BLUEPRINT_CHECKOUT_URL,
    };
  }

  return null;
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
    let { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('razorpay_order_id', order_id)
      .single();

    if (!existingOrder) {
      console.log(`Order with razorpay_order_id ${order_id} not found. Trying fallback via order notes...`);
      // Fallback: Get db_order_id from Razorpay notes
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const orderDetails = await razorpay.orders.fetch(order_id);
        const dbOrderId = orderDetails.notes?.db_order_id;

        if (dbOrderId && dbOrderId !== 'mock-order-id') {
          console.log(`Found db_order_id ${dbOrderId} in notes. Looking up order...`);
          const { data: fallbackOrder } = await supabaseAdmin
            .from('orders')
            .select('*, customers(*)')
            .eq('id', dbOrderId)
            .single();

          existingOrder = fallbackOrder;
        }
      } catch (fallbackErr) {
        console.error('Error during fallback order lookup:', fallbackErr);
      }
    }

    if (existingOrder) {
      // Fetch actual add-ons and base product from Razorpay order notes
      const [addOnsString, baseProduct] = await Promise.all([
        getAddOnsFromRazorpayOrder(order_id),
        getBaseProductFromRazorpayOrder(order_id),
      ]);

      // Update existing order - match your actual schema
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'completed',
          razorpay_payment_id: payment.id,
          payment_method: method,
          amount: Math.round(amount / 100), // Convert to integer as per your schema
          add_ons: addOnsString,
          product_type: mapProductType(baseProduct),
        })
        .eq('razorpay_order_id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log(`Order ${order_id} marked as completed`);

        await recordRevenueEvent({
          eventKey: `orders:${existingOrder.id}:payment:${payment.id}`,
          sourceMarket: 'india',
          sourceTable: 'orders',
          sourceId: existingOrder.id,
          revenueKind: 'one_time',
          eventType: 'one_time_payment',
          productType: mapProductType(baseProduct),
          customerEmail: existingOrder.customers?.email,
          customerName: existingOrder.customers?.name,
          customerPhone: existingOrder.customers?.phone,
          amountMinor: amount,
          currency: baseProduct === 'Iconik Man Style Blueprint INTL' ? 'USD' : 'INR',
          status: 'paid',
          paymentId: payment.id,
          razorpayOrderId: order_id,
          attribution: attributionFromRow(existingOrder),
          metadata: { webhook_event: 'payment.captured' },
        });

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

          // NOTE: Confirmation email is sent by handleOrderPaid (order.paid event)
          // to avoid duplicates — both payment.captured and order.paid fire for every payment.

          // Sync to CRM database
          try {
            const crmResult = await syncToCrm({
              customer_name: existingOrder.customers.name,
              customer_phone: existingOrder.customers.phone,
              add_ons: addOnsString,
              order_amount: existingOrder.amount,
              scan_lead_id: existingOrder.scan_lead_id,
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
    const { error: updateError } = await supabaseAdmin
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

      const { data: failedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, customers(name,email,phone)')
        .eq('razorpay_order_id', order_id)
        .maybeSingle();

      if (failedOrder) {
        const failedCustomer = Array.isArray(failedOrder.customers)
          ? failedOrder.customers[0]
          : failedOrder.customers;

        await recordRevenueEvent({
          eventKey: `orders:${failedOrder.id}:failed:${payment.id}`,
          sourceMarket: 'india',
          sourceTable: 'orders',
          sourceId: failedOrder.id,
          revenueKind: 'one_time',
          eventType: 'payment_failed',
          productType: failedOrder.product_type ?? 'consultation',
          customerEmail: failedOrder.customer_email ?? failedCustomer?.email,
          customerName: failedCustomer?.name,
          customerPhone: failedCustomer?.phone,
          amountMinor: payment.amount,
          currency: failedOrder.product_type === 'man_blueprint_intl' ? 'USD' : 'INR',
          status: 'failed',
          paymentId: payment.id,
          razorpayOrderId: order_id,
          attribution: attributionFromRow(failedOrder),
          metadata: { error_code, error_description, webhook_event: 'payment.failed' },
        });
      }
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentAuthorized(payment: RazorpayPayment) {
  try {
    console.log('Payment authorized (test mode):', payment.id);

    const { order_id, amount, method } = payment;

    // Fetch actual add-ons and base product from Razorpay order notes
    const [addOnsString, baseProduct] = await Promise.all([
      getAddOnsFromRazorpayOrder(order_id),
      getBaseProductFromRazorpayOrder(order_id),
    ]);

    // Update order status in database for test mode
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        razorpay_payment_id: payment.id,
        payment_method: method,
        amount: Math.round(amount / 100), // Convert to integer as per your schema
        add_ons: addOnsString,
        product_type: mapProductType(baseProduct),
      })
      .eq('razorpay_order_id', order_id);

    if (updateError) {
      console.error('Error updating test payment order:', updateError);
    } else {
      console.log(`Test payment ${payment.id} marked as completed`);

      // Add customer data to Google Sheets for test payments too
      try {
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('*, customers(*)')
          .eq('razorpay_order_id', order_id)
          .single();

        if (existingOrder) {
          await recordRevenueEvent({
            eventKey: `orders:${existingOrder.id}:payment:${payment.id}`,
            sourceMarket: 'india',
            sourceTable: 'orders',
            sourceId: existingOrder.id,
            revenueKind: 'one_time',
            eventType: 'one_time_payment',
            productType: mapProductType(baseProduct),
            customerEmail: existingOrder.customers?.email,
            customerName: existingOrder.customers?.name,
            customerPhone: existingOrder.customers?.phone,
            amountMinor: amount,
            currency: baseProduct === 'Iconik Man Style Blueprint INTL' ? 'USD' : 'INR',
            status: 'paid',
            paymentId: payment.id,
            razorpayOrderId: order_id,
            attribution: attributionFromRow(existingOrder),
            metadata: { webhook_event: 'payment.authorized' },
          });

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
              scan_lead_id: existingOrder.scan_lead_id,
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
    let { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('razorpay_order_id', order.id)
      .single();

    if (!existingOrder) {
      console.log(`Order with razorpay_order_id ${order.id} not found. Trying fallback via order notes...`);
      // Fallback: Get db_order_id from Razorpay notes
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const orderDetails = await razorpay.orders.fetch(order.id);
        const dbOrderId = orderDetails.notes?.db_order_id;

        if (dbOrderId && dbOrderId !== 'mock-order-id') {
          console.log(`Found db_order_id ${dbOrderId} in notes. Looking up order...`);
          const { data: fallbackOrder } = await supabaseAdmin
            .from('orders')
            .select('*, customers(*)')
            .eq('id', dbOrderId)
            .single();

          existingOrder = fallbackOrder;
        }
      } catch (fallbackErr) {
        console.error('Error during fallback order lookup:', fallbackErr);
      }
    }

    if (existingOrder) {
      // Fetch actual add-ons from Razorpay order notes
      const [addOnsString, baseProduct, orderNotes] = await Promise.all([
        getAddOnsFromRazorpayOrder(order.id),
        getBaseProductFromRazorpayOrder(order.id),
        fetchRazorpayOrderNotes(order.id),
      ]);

      // Update order status in database
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: payment.id,
          payment_method: payment.method,
          amount: Math.round(order.amount / 100), // Convert to integer as per your schema
          add_ons: addOnsString,
          product_type: mapProductType(baseProduct),
        })
        .eq('razorpay_order_id', order.id);

      if (updateError) {
        console.error('Error updating paid order:', updateError);
      } else {
        console.log(`Order ${order.id} marked as paid`);

        await recordRevenueEvent({
          eventKey: `orders:${existingOrder.id}:payment:${payment.id}`,
          sourceMarket: 'india',
          sourceTable: 'orders',
          sourceId: existingOrder.id,
          revenueKind: 'one_time',
          eventType: 'one_time_payment',
          productType: mapProductType(baseProduct),
          customerEmail: existingOrder.customers?.email,
          customerName: existingOrder.customers?.name,
          customerPhone: existingOrder.customers?.phone,
          amountMinor: order.amount,
          currency: baseProduct === 'Iconik Man Style Blueprint INTL' ? 'USD' : 'INR',
          status: 'paid',
          paymentId: payment.id,
          razorpayOrderId: order.id,
          attribution: attributionFromRow(existingOrder),
          metadata: { webhook_event: 'order.paid' },
        });

        const metaPurchase = buildMetaPurchasePayloadForOrder({ baseProduct, addOnsString, notes: orderNotes });
        if (metaPurchase) {
          await sendMetaPurchaseEvent({
            eventId: payment.id,
            eventSourceUrl: metaPurchase.eventSourceUrl,
            externalId: String(existingOrder.id),
            customerEmail: existingOrder.customers?.email,
            customerName: existingOrder.customers?.name,
            customerPhone: existingOrder.customers?.phone,
            // Razorpay reports the minor unit. Do not round: USD cents are
            // significant, and the browser Purchase this deduplicates against
            // sends the exact amount.
            amount: order.amount / 100,
            currency: metaPurchase.currency,
            // INR orders on this account are the Indian funnels; the phone is
            // collected in 10-digit national format and needs its country code
            // to match, exactly as the browser side now sends it.
            countryCode: metaPurchase.currency === 'INR' ? 'in' : undefined,
            phoneCountryCode: metaPurchase.currency === 'INR' ? '91' : undefined,
            contentName: metaPurchase.contentName,
            contentIds: metaPurchase.contentIds,
            numItems: metaPurchase.numItems,
            contentCategory: metaPurchase.contentCategory,
            attribution: attributionFromRow(existingOrder),
          });
        }

        // 1. Add customer data to Google Sheets (independent — failure does NOT block email)
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
        } catch (sheetError) {
          console.log('Failed to add customer to Google Sheets (email will still be sent):', sheetError);
        }

        // 2. Send confirmation email (with deduplication guard)
        if (existingOrder.email_sent) {
          console.log('Confirmation email already sent for order:', order.id, '— skipping duplicate');
        } else {
          try {
            const isMenOrder = baseProduct === 'Iconik Man Style Blueprint' || baseProduct === 'Iconik Man Style Blueprint INTL';
            const isIntl = baseProduct === 'Iconik Man Style Blueprint INTL';
            const emailFn = isMenOrder ? sendManConfirmationEmail : sendConfirmationEmail;

            const emailResult = await emailFn({
              customer_name: existingOrder.customers.name,
              customer_email: existingOrder.customers.email,
              customer_phone: existingOrder.customers.phone,
              order_amount: existingOrder.amount,
              add_ons: addOnsString,
              payment_id: payment.id,
              ...(isIntl ? { currency_symbol: '$' } : {}),
            });
            if (emailResult.success) {
              console.log('Confirmation email sent to:', existingOrder.customers.email);
              // Mark email as sent to prevent duplicates on webhook retries
              await supabaseAdmin
                .from('orders')
                .update({ email_sent: true })
                .eq('razorpay_order_id', order.id);
            } else {
              console.log('Confirmation email failed:', emailResult.error);
            }
          } catch (emailError) {
            console.log('Error sending confirmation email:', emailError);
          }
        }

        // 3. Sync to CRM database (independent)
        try {
          const crmResult = await syncToCrm({
            customer_name: existingOrder.customers.name,
            customer_phone: existingOrder.customers.phone,
            add_ons: addOnsString,
            order_amount: existingOrder.amount,
            scan_lead_id: existingOrder.scan_lead_id,
          });
          if (crmResult.success) {
            console.log('Customer synced to CRM:', crmResult.consultation_id);
          }
        } catch (crmError) {
          console.log('CRM sync error:', crmError);
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

function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function handleManEditSubscriptionEvent(
  event: string,
  subscription: RazorpaySubscription,
  payment?: RazorpayPayment,
) {
  const dbSub = await getManEditSubscriptionByRazorpayId(subscription.id);
  if (!dbSub) return false;

  const nextStatus =
    event === 'subscription.cancelled' ? 'cancelled' :
      event === 'subscription.completed' ? 'completed' :
        event === 'subscription.paused' ? 'paused' :
          event === 'subscription.activated' || event === 'subscription.charged' || event === 'subscription.resumed' ? 'active' :
            dbSub.status;

  const updated = await updateManEditSubscriptionFromWebhook({
    subscriptionId: subscription.id,
    status: nextStatus,
    paymentId: payment?.id ?? null,
    currentStart: subscription.current_start ?? subscription.start_at,
    chargeAt: subscription.charge_at ?? subscription.current_end,
    endedAt: subscription.ended_at ?? subscription.end_at,
  });

  if (event === 'subscription.charged') {
    const eventSuffix = payment?.id || `${subscription.paid_count ?? 'unknown'}:${subscription.current_start ?? Date.now()}`;

    // Only the first charge is a Purchase. Sending one for every monthly renewal
    // would keep crediting the original ad and inflate its ROAS indefinitely.
    if (payment?.id && subscription.paid_count === 1 && Number.isFinite(payment.amount)) {
      await sendMetaPurchaseEvent({
        eventId: payment.id,
        eventSourceUrl: MAN_EDIT_CHECKOUT_URL,
        externalId: String(dbSub.id),
        customerEmail: dbSub.customer_email,
        customerName: dbSub.customer_name,
        customerPhone: dbSub.customer_phone,
        countryCode: 'in',
        phoneCountryCode: '91',
        amount: payment.amount / 100,
        currency: 'INR',
        contentName: MAN_EDIT_CONTENT_NAME,
        contentIds: [MAN_EDIT_PRODUCT_ID],
        numItems: 1,
        contentCategory: MAN_EDIT_FUNNEL_CATEGORY,
        attribution: attributionFromRow(dbSub),
      });
    }

    await recordRevenueEvent({
      eventKey: `man_edit_subscriptions:${dbSub.id}:charge:${eventSuffix}`,
      sourceMarket: 'india',
      sourceTable: 'man_edit_subscriptions',
      sourceId: dbSub.id,
      revenueKind: 'subscription',
      eventType: subscription.paid_count === 1 ? 'subscription_initial' : 'subscription_charge',
      productType: 'man_edit',
      customerEmail: dbSub.customer_email,
      customerName: dbSub.customer_name,
      customerPhone: dbSub.customer_phone,
      amountMinor: payment?.amount ?? dbSub.amount,
      currency: dbSub.currency ?? 'INR',
      status: 'paid',
      paymentId: payment?.id,
      razorpaySubscriptionId: subscription.id,
      planType: dbSub.plan_type,
      occurredAt: subscription.current_start
        ? new Date(subscription.current_start * 1000).toISOString()
        : new Date().toISOString(),
      attribution: attributionFromRow(dbSub),
      metadata: { webhook_event: event, paid_count: subscription.paid_count },
    });
  }

  if (updated?.report_id && (event === 'subscription.activated' || event === 'subscription.charged')) {
    const { data: report } = await supabaseAdmin
      .from('man_reports')
      .select('share_token')
      .eq('id', updated.report_id)
      .maybeSingle();
    if (report?.share_token) {
      const context = await loadManEditReportContext(report.share_token, true);
      if (context?.subscription) {
        await rebuildManEditProfile(context).catch(error => {
          console.warn('Man Edit profile rebuild failed from webhook:', error);
        });
      }
    }
  }

  console.log(`Man Edit subscription ${subscription.id} handled for ${event}`);
  return true;
}

async function handleSubscriptionActivated(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription activated:', subscription.id);

    if (await handleManEditSubscriptionEvent('subscription.activated', subscription)) {
      return;
    }

    // 1. Update subscription status to active
    const { error: updateError } = await supabaseAdmin
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

    // 2. Fetch the subscription row to get customer details + DB id
    const { data: dbSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, customer_email, customer_name, customer_phone')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    // Fallback to Razorpay notes if DB row not found
    const customerEmail = dbSub?.customer_email ?? subscription.notes?.customer_email as string;
    const customerName  = dbSub?.customer_name  ?? subscription.notes?.customer_name  as string ?? customerEmail?.split('@')[0];
    const customerPhone = dbSub?.customer_phone ?? subscription.notes?.customer_phone as string ?? '';
    const subscriptionDbId = dbSub?.id;

    if (!customerEmail) {
      console.error('No customer email found for subscription:', subscription.id);
      return;
    }

    // 3. Idempotency guard — skip if client_profile already exists for this email
    const { data: existingProfile } = await supabaseAdmin
      .from('client_profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (existingProfile) {
      console.log(`Client profile already exists for ${customerEmail}, skipping account creation`);
      return;
    }

    // 4. Create Supabase auth user with a temp password
    const tempPassword = generateTempPassword();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email:         customerEmail,
      password:      tempPassword,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      console.error('Error creating auth user for Iconik Club:', authError);
      return;
    }

    const userId = authData.user.id;
    console.log(`Auth user created for ${customerEmail}: ${userId}`);

    // 5. Create client_profile row
    const { error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .insert({
        user_id:             userId,
        name:                customerName,
        email:               customerEmail,
        phone:               customerPhone,
        subscription_id:     subscriptionDbId ?? null,
        onboarding_complete: false,
      });

    if (profileError) {
      console.error('Error creating client_profile:', profileError);
    } else {
      console.log(`Client profile created for ${customerEmail}`);
    }

    // 6. Send welcome email with credentials
    await sendIconikClubWelcomeEmail(customerName, customerEmail, tempPassword);

  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

async function handleSubscriptionCharged(subscription: RazorpaySubscription, payment?: RazorpayPayment) {
  try {
    console.log('Subscription charged:', subscription.id);
    console.log('Payment details:', payment?.id);

    if (await handleManEditSubscriptionEvent('subscription.charged', subscription, payment)) {
      return;
    }

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

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription after charge:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} charged successfully, next billing: ${updateData.next_billing_date}`);

      const { data: dbSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', subscription.id)
        .maybeSingle();

      if (dbSub) {
        const eventSuffix = payment?.id || `${subscription.paid_count ?? 'unknown'}:${subscription.current_start ?? Date.now()}`;
        await recordRevenueEvent({
          eventKey: `subscriptions:${dbSub.id}:charge:${eventSuffix}`,
          sourceMarket: 'india',
          sourceTable: 'subscriptions',
          sourceId: dbSub.id,
          revenueKind: 'subscription',
          eventType: subscription.paid_count === 1 ? 'subscription_initial' : 'subscription_charge',
          productType: 'subscription',
          customerEmail: dbSub.customer_email,
          customerName: dbSub.customer_name,
          customerPhone: dbSub.customer_phone,
          amountMinor: payment?.amount ?? dbSub.amount,
          currency: dbSub.currency === 'USD' || dbSub.currency === 'AUD' ? dbSub.currency : 'INR',
          status: 'paid',
          paymentId: payment?.id,
          razorpaySubscriptionId: subscription.id,
          planType: dbSub.plan_type,
          occurredAt: subscription.current_start
            ? new Date(subscription.current_start * 1000).toISOString()
            : new Date().toISOString(),
          attribution: attributionFromRow(dbSub),
          metadata: { webhook_event: 'subscription.charged', paid_count: subscription.paid_count },
        });
      }
    }

  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

async function handleSubscriptionCancelled(subscription: RazorpaySubscription) {
  try {
    console.log('Subscription cancelled:', subscription.id);

    if (await handleManEditSubscriptionEvent('subscription.cancelled', subscription)) {
      return;
    }

    const { error: updateError } = await supabaseAdmin
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

    if (await handleManEditSubscriptionEvent('subscription.paused', subscription)) {
      return;
    }

    const { error: updateError } = await supabaseAdmin
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

    if (await handleManEditSubscriptionEvent('subscription.resumed', subscription)) {
      return;
    }

    const { error: updateError } = await supabaseAdmin
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

    if (await handleManEditSubscriptionEvent('subscription.completed', subscription)) {
      return;
    }

    const { error: updateError } = await supabaseAdmin
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
