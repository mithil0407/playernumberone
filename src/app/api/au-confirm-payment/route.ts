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
            // Customer details — passed from checkout handler for email
            customer_name,
            customer_email,
            customer_phone,
            amount,
            has_edit_addon,
        } = await request.json();

        if (!razorpay_payment_id) {
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        let updatedOrder: Record<string, unknown> | null = null;

        // Update by db_order_id if available, otherwise fall back to razorpay_order_id
        if (db_order_id && db_order_id !== 'mock-order-id') {
            const { data, error } = await supabaseAU
                .from('au_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                    // Persist customer details so the cron can access them later
                    ...(customer_name && { customer_name }),
                    ...(customer_phone && { customer_phone }),
                })
                .eq('id', db_order_id)
                .select()
                .single();

            if (error) {
                console.error('AU confirm payment error (by db_order_id):', error);
                // Fall through to razorpay_order_id fallback
            } else {
                updatedOrder = data;
            }
        }

        if (!updatedOrder && razorpay_order_id) {
            const { data, error } = await supabaseAU
                .from('au_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                    ...(customer_name && { customer_name }),
                    ...(customer_phone && { customer_phone }),
                })
                .eq('razorpay_order_id', razorpay_order_id)
                .select()
                .single();

            if (error) {
                console.error('AU confirm payment error (by razorpay_order_id):', error);
                return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
            }

            updatedOrder = data;
        }

        if (updatedOrder && (db_order_id || razorpay_order_id)) {
            await recordRevenueEvent({
                eventKey: `au_orders:${db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id}:payment:${razorpay_payment_id}`,
                sourceMarket: 'au',
                sourceTable: 'au_orders',
                sourceId: db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id,
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'au_blueprint',
                customerEmail: customer_email || String(updatedOrder.customer_email ?? ''),
                customerName: customer_name || String(updatedOrder.customer_name ?? ''),
                customerPhone: customer_phone || String(updatedOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(amount ?? Number(updatedOrder.amount ?? 0)),
                currency: 'AUD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: attributionFromRow(updatedOrder),
                metadata: { source: 'au-confirm-payment' },
            });
        }

        // ── Send order confirmation email (fire-and-forget) ─────────────────
        const emailTo = customer_email || String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = customer_name || String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = customer_phone || String(updatedOrder?.customer_phone ?? '');
            const orderAmount = amount ?? Number(updatedOrder?.amount ?? 0);
            const editAddon = has_edit_addon ?? Boolean(updatedOrder?.iconik_edit_addon);

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
