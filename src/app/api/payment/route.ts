import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder, supabase } from '@/lib/supabase';
import { addCustomerToSheet } from '@/lib/googleSheets';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, amount, base_product, add_ons, total_base_price, shopping_guide_price, wellness_plan_price } = body;

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
        add_on: add_ons.shopping_guide || add_ons.wellness_plan, // Check if any add-ons are selected
        status: 'pending',
        razorpay_order_id: orderId
      });
      dbOrderId = order.id!;
      
      // Add customer data to Google Sheets
      try {
        const addOnsString = [
          add_ons.shopping_guide ? 'Shopping Guide' : '',
          add_ons.wellness_plan ? 'Wellness Plan' : ''
        ].filter(Boolean).join(', ');
        
        await addCustomerToSheet({
          timestamp: new Date().toISOString(),
          customer_name: customer_name,
          customer_email: customer_email,
          customer_phone: customer_phone,
          order_amount: amount,
          order_id: dbOrderId,
          customer_id: customerId,
          payment_status: 'pending',
          add_ons: addOnsString,
          service_type: 'IconOne Style Consultation'
        });
        console.log('Customer data added to Google Sheets successfully');
      } catch (sheetError) {
        console.log('Failed to add customer to Google Sheets:', sheetError);
      }
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
          shopping_guide_addon: add_ons.shopping_guide ? 'true' : 'false',
          wellness_plan_addon: add_ons.wellness_plan ? 'true' : 'false',
          total_base_price: total_base_price,
          shopping_guide_price: shopping_guide_price,
          wellness_plan_price: wellness_plan_price,
          service: 'Alpha1 Grooming Guide',
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
        const { error: updateError } = await supabase
          .from('orders')
          .update({ razorpay_order_id: razorpayOrder.id })
          .eq('id', dbOrderId);
        
        if (updateError) {
          console.log('Failed to update order with Razorpay ID:', updateError);
        }
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
          id: customerId,
          name: customer_name,
          email: customer_email,
          contact: customer_phone,
        },
        order: {
          id: dbOrderId,
          amount,
          add_on: add_ons.consultation || add_ons.dating_guide,
          status: 'pending'
        },
        notes: {
          service: 'Alpha1 Grooming Guide',
          base_product: base_product,
          consultation_addon: add_ons.consultation,
          dating_guide_addon: add_ons.dating_guide,
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