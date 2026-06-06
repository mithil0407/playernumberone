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
            stylist_order_id,
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
        let mirroredStylistOrder: Record<string, unknown> | null = null;
        const normalizedEmail = cleanCustomerEmail(customer_email);

        if (db_order_id && db_order_id !== 'mock-order-id') {
            const { data, error } = await supabaseGlobe
                .from('globe_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                    ...(normalizedEmail && { customer_email: normalizedEmail }),
                    ...(customer_name && { customer_name }),
                    ...(customer_phone && { customer_phone }),
                })
                .eq('id', db_order_id)
                .select()
                .single();

            if (!error) updatedOrder = data;
        }

        if (!updatedOrder && razorpay_order_id) {
            const { data, error } = await supabaseGlobe
                .from('globe_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                    ...(normalizedEmail && { customer_email: normalizedEmail }),
                    ...(customer_name && { customer_name }),
                    ...(customer_phone && { customer_phone }),
                })
                .eq('razorpay_order_id', razorpay_order_id)
                .select()
                .single();

            if (error) {
                console.error('Globe confirm payment error:', error);
                return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
            }
            updatedOrder = data;
        }

        try {
            mirroredStylistOrder = await mirrorPaidGlobeOrderToStylist({
                globeOrder: updatedOrder,
                globeOrderId: db_order_id,
                stylistOrderId: stylist_order_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                customerEmail: normalizedEmail || customer_email,
                customerName: customer_name,
                customerPhone: customer_phone,
                amount,
            });
        } catch (stylistOrderErr) {
            console.error('Failed to mirror globe order into stylist orders:', stylistOrderErr);
            return NextResponse.json({ error: 'Failed to unlock stylist intake' }, { status: 500 });
        }

        if (updatedOrder && (db_order_id || razorpay_order_id)) {
            await recordRevenueEvent({
                eventKey: `globe_orders:${db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id}:payment:${razorpay_payment_id}`,
                sourceMarket: 'globe',
                sourceTable: 'globe_orders',
                sourceId: db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id,
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'globe_blueprint',
                customerEmail: normalizedEmail || String(updatedOrder.customer_email ?? ''),
                customerName: customer_name || String(updatedOrder.customer_name ?? ''),
                customerPhone: customer_phone || String(updatedOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(amount ?? Number(updatedOrder.amount ?? 0)),
                currency: 'USD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: attributionFromRow(updatedOrder),
                metadata: { source: 'globe-confirm-payment' },
            });
        }

        // Send confirmation email — awaited so Vercel doesn't kill it before it completes
        const emailTo = normalizedEmail || String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = customer_name || String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = customer_phone || String(updatedOrder?.customer_phone ?? '');
            const orderAmount = amount ?? Number(updatedOrder?.amount ?? 0);
            const editAddon = has_edit_addon ?? Boolean(updatedOrder?.iconik_edit_addon);

            try {
                const result = await sendGlobeOrderConfirmationEmail({
                    customer_name: name,
                    customer_email: emailTo,
                    customer_phone: phone,
                    order_amount: orderAmount,
                    payment_id: razorpay_payment_id,
                    has_edit_addon: editAddon,
                    delivery_hours: 72,
                });
                if (!result.success) {
                    console.error('Globe confirmation email failed:', result.error);
                } else {
                    console.log(`Globe confirmation email sent to ${emailTo}`);
                }
            } catch (emailErr) {
                console.error('Globe confirmation email threw:', emailErr);
            }
        }

        return NextResponse.json({ success: true, stylist_order_id: mirroredStylistOrder?.id ?? stylist_order_id ?? null });


    } catch (error) {
        console.error('Globe confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
