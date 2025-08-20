import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Cashfree } = require('cashfree-pg-sdk-nodejs');

// Initialize Cashfree conditionally
if (Cashfree && typeof Cashfree === 'object') {
  Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
  Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
  Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
    ? Cashfree.Environment.PRODUCTION 
    : Cashfree.Environment.SANDBOX;
}

export async function POST(request: NextRequest) {
  try {
    // Handle Cashfree webhook test
    const userAgent = request.headers.get('user-agent');
    
    // Check if this is a Cashfree test webhook
    if (userAgent && userAgent.includes('Cashfree')) {
      console.log('Cashfree webhook test received');
      return NextResponse.json({ 
        status: 'success',
        message: 'Webhook endpoint is working correctly'
      }, { status: 200 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      // Handle text/plain or other content types for test webhooks
      const textBody = await request.text();
      console.log('Webhook test received:', textBody);
      return NextResponse.json({ 
        status: 'success',
        message: 'Webhook endpoint is active'
      }, { status: 200 });
    }
    
    // Log the webhook for debugging
    console.log('Cashfree Webhook received:', body);
    
    // Extract payment details
    const { 
      type, 
      order_id
    } = body.data || body;

    // Handle different webhook types
    switch (type || body.type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        console.log(`Payment successful for order: ${order_id}`);
        
        // Here you would update your database
        // For example: updateOrderStatus(order_id, 'completed')
        
        // You could also trigger other actions like:
        // - Send confirmation email
        // - Create calendar appointment
        // - Send WhatsApp message
        
        break;
        
      case 'PAYMENT_FAILED_WEBHOOK':
        console.log(`Payment failed for order: ${order_id}`);
        
        // Update order status to failed
        // Send failure notification
        
        break;
        
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        console.log(`Payment dropped by user for order: ${order_id}`);
        
        // Handle user abandonment
        // Maybe trigger retargeting campaign
        
        break;
        
      default:
        console.log(`Webhook received - type: ${type || body.type || 'unknown'}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ 
      status: 'success', 
      message: 'Webhook processed successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return 200 even on error to prevent retries for malformed requests
    return NextResponse.json({ 
      status: 'success', 
      message: 'Webhook endpoint is active' 
    }, { status: 200 });
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'Alpha1 Cashfree Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }, { status: 200 });
}
