import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

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
      .select('*')
      .eq('razorpay_order_id', order_id)
      .single();

    if (existingOrder) {
      // Update existing order - match your actual schema
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          razorpay_payment_id: payment.id,
          payment_method: method,
          amount: Math.round(amount / 100) // Convert to integer as per your schema
        })
        .eq('razorpay_order_id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log(`Order ${order_id} marked as completed`);
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
    
    // Update order status in database for test mode
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        razorpay_payment_id: payment.id,
        payment_method: method,
        amount: Math.round(amount / 100) // Convert to integer as per your schema
      })
      .eq('razorpay_order_id', order_id);

    if (updateError) {
      console.error('Error updating test payment order:', updateError);
    } else {
      console.log(`Test payment ${payment.id} marked as completed`);
    }
    
  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

async function handleOrderPaid(order: RazorpayOrder, payment: RazorpayPayment) {
  try {
    console.log('Order paid:', order.id);
    
    // Update order status in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id: payment.id,
        payment_method: payment.method,
        amount: Math.round(order.amount / 100) // Convert to integer as per your schema
      })
      .eq('razorpay_order_id', order.id);

    if (updateError) {
      console.error('Error updating paid order:', updateError);
    } else {
      console.log(`Order ${order.id} marked as paid`);
    }
    
  } catch (error) {
    console.error('Error handling order paid:', error);
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
      '3. Select events: payment.captured, payment.failed, order.paid, payment.authorized',
      '4. Test with test mode payments first',
      '5. Check Vercel logs for webhook debugging'
    ]
  });
}