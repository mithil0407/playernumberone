import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder, supabaseAdmin, getCustomerByEmail } from '@/lib/supabase';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import Razorpay from 'razorpay';

// Handles USD payment order creation for the /man funnel (international users).
// Mirrors the pattern of /api/globe-payment but saves to the main orders table
// with product_type 'man_blueprint_intl' so the webhook skips it
// (confirmation is handled client-side via /api/man-confirm-payment).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_email,
      customer_phone,
      amount,
      outfit_preview_addon = false,
    } = body;
    const incomingAttribution = attributionToColumns(body.attribution);

    if (!customer_email || !customer_phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const orderId = `man_intl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Razorpay uses smallest currency unit: cents for USD
    const amountInCents = Math.round(amount * 100);

    let customerId = 'mock-customer-id';
    let dbOrderId = 'mock-order-id';

    try {
      const existingCustomer = await getCustomerByEmail(customer_email);
      const customerAttribution = firstTouchAttribution(existingCustomer, incomingAttribution);
      const customer = await saveCustomer({
        name: customer_email.split('@')[0],
        email: customer_email,
        phone: customer_phone,
        ...customerAttribution,
      });
      customerId = customer.id!;
      const orderAttribution = firstTouchAttribution(customer, incomingAttribution);

      const order = await saveOrder({
        customer_id: customer.id!,
        customer_email,
        amount,
        product_type: 'man_blueprint_intl',
        status: 'pending',
        razorpay_order_id: orderId,
        add_ons: outfit_preview_addon ? 'Outfit Preview on You' : '',
        ...orderAttribution,
      });
      dbOrderId = order.id!;
    } catch (err) {
      console.log('Man INTL Supabase error, using mock IDs:', err);
    }

    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInCents,
        currency: 'USD',
        receipt: orderId,
        notes: {
          customer_email,
          customer_phone,
          // Distinct from 'Iconik Men Style Blueprint' so the INR webhook skips it
          base_product: 'Iconik Man Style Blueprint INTL',
          outfit_preview_addon: outfit_preview_addon ? 'true' : 'false',
          db_order_id: dbOrderId,
          customer_id: customerId,
          utm_source: incomingAttribution.utm_source || '',
          utm_medium: incomingAttribution.utm_medium || '',
          utm_campaign: incomingAttribution.utm_campaign || '',
          landing_page: incomingAttribution.landing_page || '',
        },
      });

      if (!razorpayOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Update order with the real Razorpay order ID before the webhook can arrive
      if (dbOrderId !== 'mock-order-id') {
        const { error: updateIdError } = await supabaseAdmin
          .from('orders')
          .update({ razorpay_order_id: razorpayOrder.id })
          .eq('id', dbOrderId);

        if (updateIdError) {
          console.error('Failed to update man INTL order with Razorpay ID:', updateIdError);
        }
      }

      return NextResponse.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInCents,
        currency: 'USD',
        customer_id: customerId,
        db_order_id: dbOrderId,
      });
    } catch (razorpayError) {
      console.error('Razorpay Man INTL error:', razorpayError);
      return NextResponse.json(
        { success: false, error: 'Payment processing failed. Please try again or contact support.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Man INTL Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
