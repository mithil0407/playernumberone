import { verifyRazorpayOrderPayment } from '@/lib/razorpayPaymentVerification';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { sendGlobeOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { cleanCustomerEmail, mirrorPaidGlobeOrderToStylist } from '@/lib/globeStylistMirror';

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
        const { data: savedOrder, error: lookupError } = await supabaseGlobe
            .from('globe_orders').select('*').eq('razorpay_order_id', razorpay_order_id).maybeSingle();
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
        let mirroredStylistOrder: Record<string, unknown> | null = null;
        const normalizedEmail = cleanCustomerEmail(String(savedOrder.customer_email ?? ''));
        const { data: paidOrder, error: updateError } = await supabaseGlobe.from('globe_orders')
            .update({ status: 'paid', razorpay_payment_id })
            .eq('id', savedOrder.id).eq('razorpay_order_id', razorpay_order_id)
            .eq('status', 'pending').select('*').maybeSingle();
        if (updateError) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        if (!paidOrder) return NextResponse.json({ success: true, already_confirmed: true });
        updatedOrder = paidOrder;

        try {
            mirroredStylistOrder = await mirrorPaidGlobeOrderToStylist({
                globeOrder: updatedOrder,
                globeOrderId: db_order_id,
                stylistOrderId: null,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                customerEmail: normalizedEmail,
                customerName: String(paidOrder.customer_name ?? ''),
                customerPhone: String(paidOrder.customer_phone ?? ''),
                amount: Number(paidOrder.amount ?? 0),
            });
        } catch (stylistOrderErr) {
            console.error('Failed to mirror global order into stylist orders:', stylistOrderErr);
            return NextResponse.json({ error: 'Failed to unlock stylist intake' }, { status: 500 });
        }

        if (updatedOrder && (db_order_id || razorpay_order_id)) {
            await recordRevenueEvent({
                eventKey: `globe_orders:${String(updatedOrder.id)}:payment:${razorpay_payment_id}`,
                sourceMarket: 'global',
                sourceTable: 'globe_orders',
                sourceId: String(updatedOrder.id),
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'global_blueprint',
                customerEmail: String(updatedOrder.customer_email ?? ''),
                customerName: String(paidOrder.customer_name ?? ''),
                customerPhone: String(paidOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(Number(updatedOrder.amount ?? 0)),
                currency: 'USD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: attributionFromRow(updatedOrder),
                metadata: { source: 'global-confirm-payment' },
            });
        }

        // Send confirmation email
        const emailTo = String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = String(updatedOrder?.customer_phone ?? '');
            const orderAmount = Number(updatedOrder?.amount ?? 0);
            const editAddon = Boolean(updatedOrder?.iconik_edit_addon);

            try {
                const result = await sendGlobeOrderConfirmationEmail({
                    customer_name: name,
                    customer_email: emailTo,
                    customer_phone: phone,
                    order_amount: orderAmount,
                    payment_id: razorpay_payment_id,
                    has_edit_addon: editAddon,
                });
                if (!result.success) {
                    console.error('Global confirmation email failed:', result.error);
                } else {
                    console.log(`Global confirmation email sent to ${emailTo}`);
                }
            } catch (emailErr) {
                console.error('Global confirmation email threw:', emailErr);
            }
        }

        return NextResponse.json({ success: true, stylist_order_id: mirroredStylistOrder?.id ?? null });

    } catch (error) {
        console.error('Global confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
