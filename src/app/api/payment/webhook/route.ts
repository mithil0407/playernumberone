import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrder } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const body = await request.text();
    
    // Get Razorpay signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.log('No Razorpay signature found in headers');
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

    // Parse the webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.log('Failed to parse webhook body:', error);
      return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Received Razorpay webhook:', webhookData.event);

    // Handle different webhook events
    const { event, payload } = webhookData;
    
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload.order.entity, payload.payment.entity);
        break;
        
      default:
        console.log(`Unhandled Razorpay webhook event: ${event}`);
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
    
    // Update order status in database
    await saveOrder({
      razorpay_order_id: order_id,
      razorpay_payment_id: payment.id,
      status: 'completed',
      payment_method: method,
      amount: amount / 100, // Convert from paise to rupees
    });

    console.log(`Order ${order_id} marked as completed`);
    
    // Here you can add additional logic like:
    // - Send confirmation email
    // - Trigger fulfillment process
    // - Update customer records
    
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: RazorpayPayment) {
  try {
    console.log('Payment failed:', payment.id);
    
    const { order_id, error_code, error_description } = payment;
    
    // Update order status in database
    await saveOrder({
      razorpay_order_id: order_id,
      razorpay_payment_id: payment.id,
      status: 'failed',
      error_code,
      error_description,
    });

    console.log(`Order ${order_id} marked as failed`);
    
    // Here you can add additional logic like:
    // - Send failure notification email
    // - Log for analytics
    // - Trigger retry mechanisms
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleOrderPaid(order: RazorpayOrder, payment: RazorpayPayment) {
  try {
    console.log('Order paid:', order.id);
    
    // Update order status in database
    await saveOrder({
      razorpay_order_id: order.id,
      razorpay_payment_id: payment.id,
      status: 'paid',
      payment_method: payment.method,
      amount: order.amount / 100, // Convert from paise to rupees
    });

    console.log(`Order ${order.id} marked as paid`);
    
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

// GET endpoint for webhook verification/testing
export async function GET() {
  return NextResponse.json({ 
    status: 'active', 
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}