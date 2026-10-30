import { verifyRazorpayOrderPayment } from '@/lib/razorpayPaymentVerification';
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
      razorpay_signature,
    } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment proof' }, { status: 400 });
    }
    const { data: savedOrder, error: lookupError } = await supabaseAdmin
        .from('orders').select('*').eq('razorpay_order_id', razorpay_order_id).maybeSingle();
    if (lookupError || !savedOrder || (db_order_id && db_order_id !== 'mock-order-id' && savedOrder.id !== db_order_id)) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const verified = await verifyRazorpayOrderPayment({
        paymentId: razorpay_payment_id, orderId: razorpay_order_id,
        signature: razorpay_signature, order: savedOrder, expectedCurrency: 'USD',
    });
    if (!verified) return NextResponse.json({ error: 'Payment could not be verified' }, { status: 403 });
    if (savedOrder.product_type !== 'man_blueprint_intl') return NextResponse.json({ error: 'Wrong checkout' }, { status: 403 });
    if (savedOrder.status === 'paid' || savedOrder.status === 'completed') {
        return NextResponse.json({ success: true, already_confirmed: true });
    }
    if (savedOrder.status !== 'pending') {
        return NextResponse.json({ error: 'Order is not pending' }, { status: 409 });
    }

    let updatedOrder: Record<string, unknown> | null = null;
    const { data: paidOrder, error: updateError } = await supabaseAdmin.from('orders')
        .update({ status: 'paid', razorpay_payment_id })
        .eq('id', savedOrder.id).eq('razorpay_order_id', razorpay_order_id)
        .eq('status', 'pending').select('*, customers(name,email,phone)').maybeSingle();
    if (updateError) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    if (!paidOrder) return NextResponse.json({ success: true, already_confirmed: true });
    updatedOrder = paidOrder;

    const relatedCustomer = firstCustomer(updatedOrder?.customers as CustomerRelation);
    const orderAttribution = attributionFromRow(updatedOrder);
    const emailForTracking = String(relatedCustomer?.email ?? updatedOrder?.customer_email ?? '');
    const phoneForTracking = String(relatedCustomer?.phone ?? updatedOrder?.customer_phone ?? '');

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
        amountMinor: toMinorUnits(Number(updatedOrder.amount ?? 0)),
        currency: 'USD',
        status: 'paid',
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        attribution: orderAttribution,
        metadata: { source: 'man-confirm-payment' },
      });

      const contentIds = [MAN_BLUEPRINT_PRODUCT_ID, ...(String(updatedOrder.add_ons ?? '').includes('Outfit Preview') ? [MAN_OUTFIT_PREVIEW_PRODUCT_ID] : [])];
      await sendMetaPurchaseEvent({
        eventId: razorpay_payment_id,
        eventSourceUrl: 'https://www.iconik.pro/man/checkout',
        customerEmail: emailForTracking,
        customerPhone: phoneForTracking,
        amount: Number(updatedOrder.amount ?? 0),
        currency: 'USD',
        contentName: 'ICONIK Man Complete Package',
        contentIds,
        numItems: contentIds.length,
        contentCategory: 'Man Funnel',
        attribution: orderAttribution,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
      });
    }

    // Send confirmation email with USD symbol
    const emailTo = emailForTracking;
    if (emailTo) {
      const phone = phoneForTracking;
      const orderAmount = Number(updatedOrder?.amount ?? 0);
      const addOns = String(updatedOrder?.add_ons ?? '');
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
