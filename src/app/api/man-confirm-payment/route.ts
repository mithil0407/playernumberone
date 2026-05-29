import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendManConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { MAN_BLUEPRINT_PRODUCT_ID, MAN_OUTFIT_PREVIEW_PRODUCT_ID } from '@/lib/metaPixel';
import { sendMetaPurchaseEvent } from '@/lib/metaConversionsApi';

type CustomerRelation =
  | { name?: string | null; email?: string | null; phone?: string | null }
  | { name?: string | null; email?: string | null; phone?: string | null }[]
  | null
  | undefined;

function firstCustomer(customers: CustomerRelation) {
  return Array.isArray(customers) ? customers[0] : customers;
}

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

    let updatedOrder: Record<string, unknown> | null = null;

    // Mark as paid (but NOT email_sent yet — we set that only after the email succeeds)
    if (db_order_id && db_order_id !== 'mock-order-id') {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', razorpay_payment_id })
        .eq('id', db_order_id)
        .select('*, customers(name,email,phone)')
        .single();

      if (!error) updatedOrder = data;
    }

    if (!updatedOrder && razorpay_order_id) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', razorpay_payment_id })
        .eq('razorpay_order_id', razorpay_order_id)
        .select('*, customers(name,email,phone)')
        .single();

      if (error) {
        console.error('Man confirm payment (intl) DB error:', error);
        // Non-fatal — still attempt to send the email below
      } else {
        updatedOrder = data;
      }
    }

    const relatedCustomer = firstCustomer(updatedOrder?.customers as CustomerRelation);
    const orderAttribution = attributionFromRow(updatedOrder);
    const emailForTracking = customer_email || String(updatedOrder?.customer_email ?? relatedCustomer?.email ?? '');
    const phoneForTracking = customer_phone || String(updatedOrder?.customer_phone ?? relatedCustomer?.phone ?? '');

    if (updatedOrder && (db_order_id || razorpay_order_id)) {
      await recordRevenueEvent({
        eventKey: `orders:${String(updatedOrder.id ?? (db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id))}:payment:${razorpay_payment_id}`,
        sourceMarket: 'india',
        sourceTable: 'orders',
        sourceId: String(updatedOrder.id ?? (db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id)),
        revenueKind: 'one_time',
        eventType: 'one_time_payment',
        productType: 'man_blueprint_intl',
        customerEmail: emailForTracking,
        customerName: relatedCustomer?.name ?? null,
        customerPhone: phoneForTracking,
        amountMinor: toMinorUnits(amount ?? Number(updatedOrder.amount ?? 0)),
        currency: 'USD',
        status: 'paid',
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        attribution: orderAttribution,
        metadata: { source: 'man-confirm-payment' },
      });

      const contentIds = [MAN_BLUEPRINT_PRODUCT_ID, ...(has_outfit_preview ? [MAN_OUTFIT_PREVIEW_PRODUCT_ID] : [])];
      await sendMetaPurchaseEvent({
        eventId: razorpay_payment_id,
        eventSourceUrl: orderAttribution.landing_page || 'https://www.iconik.pro/man/checkout',
        customerEmail: emailForTracking,
        customerPhone: phoneForTracking,
        amount: Number(amount ?? updatedOrder.amount ?? 0),
        currency: 'USD',
        contentName: 'ICONIK Man Complete Package',
        contentIds,
        numItems: contentIds.length,
        attribution: orderAttribution,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
      });
    }

    // Send confirmation email with USD symbol
    const emailTo = emailForTracking;
    if (emailTo) {
      const phone = customer_phone || String(updatedOrder?.customer_phone ?? relatedCustomer?.phone ?? '');
      const orderAmount = amount ?? Number(updatedOrder?.amount ?? 0);
      const addOns = has_outfit_preview ? 'Outfit Preview on You' : String(updatedOrder?.add_ons ?? '');
      const customerName = String(relatedCustomer?.name ?? emailTo.split('@')[0]);

      try {
        const result = await sendManConfirmationEmail({
          customer_name: customerName,
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
          // Only mark email_sent after the email actually succeeds
          const idCol = db_order_id && db_order_id !== 'mock-order-id' ? 'id' : 'razorpay_order_id';
          const idVal = idCol === 'id' ? db_order_id : razorpay_order_id;
          if (idVal) {
            await supabaseAdmin.from('orders').update({ email_sent: true }).eq(idCol, idVal);
          }
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
