import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder, supabase } from '@/lib/supabase';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, amount, base_product, add_ons, total_base_price, presence_guide_price, magnetism_playbook_price } = body;

    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !amount) {
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
      // OPTIMIZATION #2: Single UPSERT query (was SELECT + INSERT)
      const customer = await saveCustomer({
        name: customer_name,
        email: customer_email,
        phone: customer_phone
      });
      
      customerId = customer.id!;

      // Save order to database with temporary ID first
      const order = await saveOrder({
        customer_id: customer.id!,
        amount,
        add_on: add_ons.presence_guide || add_ons.magnetism_playbook, // Check if any add-ons are selected
        status: 'pending',
        razorpay_order_id: orderId
      });
      dbOrderId = order.id!;
      
      // Note: Google Sheets integration moved to webhook - only add data after payment completion
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
          customer_name: customer_name,
          customer_email: customer_email,
          customer_phone: customer_phone,
          base_product: base_product,
          presence_guide_addon: add_ons.presence_guide ? 'true' : 'false',
          magnetism_playbook_addon: add_ons.magnetism_playbook ? 'true' : 'false',
          total_base_price: total_base_price,
          presence_guide_price: presence_guide_price,
          magnetism_playbook_price: magnetism_playbook_price,
          service: 'ICONIK Style Guide',
          db_order_id: dbOrderId,
          customer_id: customerId
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderRequest);
      
      if (!razorpayOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // OPTIMIZATION #3: Defer non-critical database update (don't block response)
      // Update order with Razorpay ID asynchronously - don't await
      supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', dbOrderId)
        .then(({ error }) => {
          if (error) console.log('Failed to update order with Razorpay ID:', error);
        })
        .catch(err => console.log('Error updating order:', err));

      // OPTIMIZATION #3: Return minimal payload - only what frontend needs
      return NextResponse.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        customer_id: customerId,
        order_id: orderId,
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