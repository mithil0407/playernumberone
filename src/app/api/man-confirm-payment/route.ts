import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendManConfirmationEmail } from '@/lib/email';

// Called client-side after Razorpay's handler fires for international USD /man payments.
// Updates the order status and sends the confirmation email with USD currency symbol.
// Mirrors the pattern of /api/globe-confirm-payment.
export async function POST(request: NextRequest) {
  try {
    const {
      db_order_id,
      razorpay_payment_id,
      razorpay_order_id,
      customer_email,
      customer_phone,
      amount,
      has_outfit_preview,
    } = await request.json();

    if (!razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    let updatedOrder: { customer_email?: string; customer_phone?: string; amount?: number; add_ons?: string } | null = null;

    if (db_order_id && db_order_id !== 'mock-order-id') {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id,
          email_sent: true,
        })
        .eq('id', db_order_id)
        .select()
        .single();

      if (!error) updatedOrder = data;
    }

    if (!updatedOrder && razorpay_order_id) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id,
          email_sent: true,
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .select()
        .single();

      if (error) {
        console.error('Man confirm payment (intl) error:', error);
        // Non-fatal — still send the email below
      } else {
        updatedOrder = data;
      }
    }

    // Send confirmation email with USD symbol
    const emailTo = customer_email || updatedOrder?.customer_email;
    if (emailTo) {
      const phone = customer_phone || updatedOrder?.customer_phone || '';
      const orderAmount = amount ?? updatedOrder?.amount ?? 0;
      const addOns = has_outfit_preview ? 'Outfit Preview on You' : (updatedOrder?.add_ons || '');

      try {
        const result = await sendManConfirmationEmail({
          customer_name: emailTo.split('@')[0],
          customer_email: emailTo,
          customer_phone: phone,
          order_amount: orderAmount,
          add_ons: addOns,
          payment_id: razorpay_payment_id,
          currency_symbol: '$',
        });

        if (!result.success) {
          console.error('Man INTL confirmation email failed:', result.error);
        } else {
          console.log(`Man INTL confirmation email sent to ${emailTo}`);
        }
      } catch (emailErr) {
        console.error('Man INTL confirmation email threw:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Man confirm payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
