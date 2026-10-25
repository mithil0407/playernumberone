import { verifyRazorpayOrderPayment } from '@/lib/razorpayPaymentVerification';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { sendStylistOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { sendMetaPurchaseEvent } from '@/lib/metaConversionsApi';

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
        const { data: savedOrder, error: lookupError } = await supabaseStyleScan
            .from('stylist_orders').select('*').eq('razorpay_order_id', razorpay_order_id).maybeSingle();
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
        const { data: paidOrder, error: updateError } = await supabaseStyleScan.from('stylist_orders')
            .update({ status: 'paid', razorpay_payment_id })
            .eq('id', savedOrder.id).eq('razorpay_order_id', razorpay_order_id)
            .eq('status', 'pending').select('*').maybeSingle();
        if (updateError) return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        if (!paidOrder) return NextResponse.json({ success: true, already_confirmed: true });
        updatedOrder = paidOrder;

        // Mark lead as purchased
        if (savedOrder.lead_id) {
            await supabaseStyleScan
                .from('style_scan_leads')
                .update({ purchased: true })
                .eq('id', savedOrder.lead_id);
        }

        // Revenue event
        if (updatedOrder) {
            const orderAttribution = attributionFromRow(updatedOrder);
            const orderAmount = Number(updatedOrder.amount ?? 0);
            const emailForTracking = String(updatedOrder.customer_email ?? '');
            const phoneForTracking = String(updatedOrder.customer_phone ?? '');

            await recordRevenueEvent({
                eventKey: `stylist_orders:${String(updatedOrder.id)}:payment:${razorpay_payment_id}`,
                sourceMarket: 'stylist',
                sourceTable: 'stylist_orders',
                sourceId: String(updatedOrder.id),
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'stylist_blueprint',
                customerEmail: String(updatedOrder.customer_email ?? ''),
                customerName: String(updatedOrder.customer_name ?? ''),
                customerPhone: String(updatedOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(Number(updatedOrder.amount ?? 0)),
                currency: 'USD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: orderAttribution,
                metadata: { source: 'stylist-confirm-payment', lead_id: savedOrder.lead_id, edit_selected: Number(updatedOrder.amount) === 110 },
            });

            await sendMetaPurchaseEvent({
                eventId: razorpay_payment_id,
                eventSourceUrl: 'https://www.iconik.pro/stylist/checkout',
                customerEmail: emailForTracking,
                customerName: String(updatedOrder.customer_name ?? ''),
                customerPhone: phoneForTracking,
                amount: orderAmount,
                currency: 'USD',
                contentName: 'ICONIK Style Blueprint',
                contentIds: ['iconik_style_blueprint'],
                numItems: 1,
                contentCategory: 'style_scan',
                attribution: orderAttribution,
                userAgent: request.headers.get('user-agent'),
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
            });
        }

        // Confirmation email
        const emailTo = String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = String(updatedOrder?.customer_phone ?? '');
            const orderAmount = Number(updatedOrder?.amount ?? 0);

            try {
                await sendStylistOrderConfirmationEmail({
                    customer_name: name,
                    customer_email: emailTo,
                    customer_phone: phone,
                    order_amount: orderAmount,
                    payment_id: razorpay_payment_id,
                    has_edit_addon: Number(savedOrder.amount) === 110,
                    edit_authorization_pending: false,
                    delivery_hours: 72,
                });
            } catch (emailErr) {
                console.error('Stylist confirmation email threw:', emailErr);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Stylist confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
