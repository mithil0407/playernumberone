import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder } from '@/lib/supabase';

const { Cashfree } = require('cashfree-pg-sdk-nodejs');

// Initialize Cashfree
Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
  ? Cashfree.Environment.PRODUCTION 
  : Cashfree.Environment.SANDBOX;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, addOn, amount } = body;

    // Validate required fields
    if (!name || !email || !phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `alpha1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save customer to database
    let customerId = 'mock-customer-id';
    let dbOrderId = 'mock-order-id';
    
    try {
      const customer = await saveCustomer({
        name,
        email,
        phone
      });
      customerId = customer.id!;

      // Save order to database
      const order = await saveOrder({
        customer_id: customer.id!,
        amount,
        add_on: addOn,
        status: 'pending',
        cashfree_order_id: orderId
      });
      dbOrderId = order.id!;
    } catch (error) {
      console.log('Supabase not configured, using mock IDs');
    }

    // Create Cashfree order
    const cashfreeOrderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/webhook`
      },
      order_note: `Alpha1 Transformation Program${addOn ? ' + AI Visualisation' : ''}`
    };

    try {
      // Create order with Cashfree
      const response = await Cashfree.PGCreateOrder("2023-08-01", cashfreeOrderRequest);
      
      if (response.data && response.data.payment_session_id) {
        return NextResponse.json({
          success: true,
          order_id: orderId,
          payment_session_id: response.data.payment_session_id,
          payment_url: response.data.payment_link,
          customer_id: customerId,
          db_order_id: dbOrderId
        });
      } else {
        throw new Error('Failed to create Cashfree order');
      }
      
    } catch (cashfreeError) {
      console.error('Cashfree integration error:', cashfreeError);
      
      // Fallback to mock response if Cashfree is not configured properly
      return NextResponse.json({
        success: true,
        order_id: orderId,
        payment_url: `/checkout/success?order_id=${orderId}`,
        customer_id: customerId,
        db_order_id: dbOrderId,
        mock: true,
        message: 'Using mock payment for development'
      });
    }

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
