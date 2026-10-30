import { verifyRazorpayOrderPayment } from '@/lib/razorpayPaymentVerification';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAU } from '@/lib/supabaseAU';
import { sendAUOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';

export async function POST(request: NextRequest) {
    try {
        const {
            db_order_id,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            // Customer details — passed from checkout handler for email
        } = await request.json();

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment proof' }, { status: 400 });
        }
        const { data: savedOrder, error: lookupError } = await supabaseAU
            .from('au_orders').select('*').eq('razorpay_order_id', razorpay_order_id).maybeSingle();
        if (lookupError || !savedOrder || (db_order_id && db_order_id !== 'mock-order-id' && savedOrder.id !== db_order_id)) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const verified = await verifyRazorpayOrderPayment({
            paymentId: razorpay_payment_id, orderId: razorpay_order_id,
            signature: razorpay_signature, order: savedOrder,
        });
        if (!verified) return NextResponse.json({ error: 'Payment could not be verified' }, { status: 403 });
        if (savedOrder.status === 'paid') {
            return NextResponse.json({ success: true, already_confirmed: true });
        }
        if (savedOrder.status !== 'pending') {
            return NextResponse.json({ error: 'Order is not pending' }, { status: 409 });
        }

        let updatedOrder: Record<string, unknown> | null = null;
        const { data: paidOrder, error: updateError } = await supabaseAU.from('au_orders')
            .update({ status: 'paid', razorpay_payment_id })
            .eq('id', savedOrder.id).eq('razorpay_order_id', razorpay_order_id)
            .eq('status', 'pending').select('*').maybeSingle();
        if (updateError) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        if (!paidOrder) return NextResponse.json({ success: true, already_confirmed: true });
        updatedOrder = paidOrder;

if (updatedOrder && (db_order_id || razorpay_order_id)) {
            await recordRevenueEvent({
                eventKey: `au_orders:${String(updatedOrder.id)}:payment:${razorpay_payment_id}`,
                sourceMarket: 'au',
                sourceTable: 'au_orders',
                sourceId: String(updatedOrder.id),
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'au_blueprint',
                customerEmail: String(updatedOrder.customer_email ?? ''),
                customerName: String(updatedOrder.customer_name ?? ''),
                customerPhone: String(updatedOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(Number(updatedOrder.amount ?? 0)),
                currency: 'AUD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: attributionFromRow(updatedOrder),
                metadata: { source: 'au-confirm-payment' },
            });
        }

        // ── Send order confirmation email (fire-and-forget) ─────────────────
        const emailTo = String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = String(updatedOrder?.customer_phone ?? '');
            const orderAmount = Number(updatedOrder?.amount ?? 0);
            const editAddon = Boolean(updatedOrder?.iconik_edit_addon);

            sendAUOrderConfirmationEmail({
                customer_name: name,
                customer_email: emailTo,
                customer_phone: phone,
                order_amount: orderAmount,
                payment_id: razorpay_payment_id,
                has_edit_addon: editAddon,
            }).then((result) => {
                if (!result.success) {
                    console.error('AU order confirmation email failed:', result.error);
                }
            }).catch((err) => {
                console.error('AU order confirmation email threw:', err);
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('AU confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
