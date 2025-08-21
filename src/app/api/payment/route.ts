import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder } from '@/lib/supabase';
import Razorpay from 'razorpay';

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

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'Payment gateway not configured. Please contact support.'
      }, { status: 500 });
    }

    // Generate unique order ID
    const orderId = `alpha1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

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
        razorpay_order_id: orderId
      });
      dbOrderId = order.id!;
    } catch (error) {
      console.log('Supabase not configured, using mock IDs:', error);
    }

    try {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      // Create Razorpay order
      const orderRequest = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: {
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          add_on: addOn ? 'true' : 'false',
          service: 'Alpha1 Transformation Program',
          db_order_id: dbOrderId,
          customer_id: customerId
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderRequest);
      
      if (!razorpayOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Update database with Razorpay order ID
      try {
        await saveOrder({
          customer_id: customerId,
          amount,
          add_on: addOn,
          status: 'pending',
          razorpay_order_id: razorpayOrder.id
        });
      } catch (error) {
        console.log('Failed to update order with Razorpay ID:', error);
      }

      // Return order details for frontend Razorpay integration
      return NextResponse.json({
        success: true,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        customer: {
          name,
          email,
          contact: phone,
        },
        notes: {
          service: 'Alpha1 Transformation Program',
          add_on: addOn,
        },
        customer_id: customerId,
        db_order_id: dbOrderId
      });

    } catch (razorpayError) {
      console.error('Razorpay integration error:', razorpayError);
      
      return NextResponse.json({
        success: false,
        error: 'Payment processing failed. Please try again or contact support.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}