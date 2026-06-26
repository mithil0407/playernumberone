import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder, supabaseAdmin, getCustomerByEmail } from '@/lib/supabase';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, amount, currency = 'INR', base_product, add_ons, total_base_price, diva_diet_plan_price, smart_shoppers_guide_price, outfit_preview_price, checkout_source } = body;
    const incomingAttribution = attributionToColumns(body.attribution);

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

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Save customer to database
    let customerId = 'mock-customer-id';
    let dbOrderId = 'mock-order-id';

    try {
      // OPTIMIZATION #2: Single UPSERT query (was SELECT + INSERT)
      const existingCustomer = await getCustomerByEmail(customer_email);
      const customerAttribution = firstTouchAttribution(existingCustomer, incomingAttribution);
      const customer = await saveCustomer({
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
        ...customerAttribution,
      });

      customerId = customer.id!;
      const orderAttribution = firstTouchAttribution(customer, incomingAttribution);

      // Save order to database with temporary ID first
      const order = await saveOrder({
        customer_id: customer.id!,
        amount,
        add_on: add_ons.presence_guide || add_ons.magnetism_playbook, // Check if any add-ons are selected
        status: 'pending',
        razorpay_order_id: orderId,
        ...orderAttribution,
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
        amount: amountInSmallestUnit,
        currency: currency || 'INR',
        receipt: orderId,
        notes: {
          customer_name: customer_name,
          customer_email: customer_email,
          customer_phone: customer_phone,
          base_product: base_product,
          checkout_source: checkout_source || '',
          wardrobe_detox_addon: add_ons.wardrobe_detox ? 'true' : 'false',
          diva_diet_plan_addon: add_ons.diva_diet_plan ? 'true' : 'false',
          smart_shoppers_guide_addon: add_ons.smart_shoppers_guide ? 'true' : 'false',
          outfit_preview_addon: add_ons.outfit_preview ? 'true' : 'false',
          iconik_edit_subscription: add_ons.iconik_edit_subscription ? 'true' : 'false',
          total_base_price: total_base_price,
          diva_diet_plan_price: diva_diet_plan_price,
          smart_shoppers_guide_price: smart_shoppers_guide_price,
          outfit_preview_price: outfit_preview_price,
          service: 'ICONIK Style Guide',
          db_order_id: dbOrderId,
          customer_id: customerId,
          utm_source: incomingAttribution.utm_source || '',
          utm_medium: incomingAttribution.utm_medium || '',
          utm_campaign: incomingAttribution.utm_campaign || '',
          landing_page: incomingAttribution.landing_page || '',
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderRequest);

      if (!razorpayOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Update order with real Razorpay ID — MUST complete before webhook arrives
      // (was fire-and-forget which caused a race condition: webhook couldn't find the order)
      const { error: updateIdError } = await supabaseAdmin
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', dbOrderId);

      if (updateIdError) {
        console.error('Failed to update order with Razorpay ID:', updateIdError);
      }

      // OPTIMIZATION #3: Return minimal payload - only what frontend needs
      return NextResponse.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInSmallestUnit,
        currency: currency || 'INR',
        customer_id: customerId,
        order_id: orderId,
        db_order_id: dbOrderId,
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
