import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { sendGlobeOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';

export async function POST(request: NextRequest) {
    try {
        const {
            db_order_id,
            razorpay_payment_id,
            razorpay_order_id,
            customer_name,
            customer_email,
            customer_phone,
            amount,
            has_edit_addon,
        } = await request.json();

        if (!razorpay_payment_id) {
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        let updatedOrder: { customer_email?: string; customer_name?: string; customer_phone?: string; amount?: number; iconik_edit_addon?: boolean } | null = null;

        if (db_order_id && db_order_id !== 'mock-order-id') {
            const { data, error } = await supabaseGlobe
                .from('globe_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
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
                    ...(customer_name && { customer_name }),
                    ...(customer_phone && { customer_phone }),
                })
                .eq('razorpay_order_id', razorpay_order_id)
                .select()
                .single();

            if (error) {
                console.error('Global confirm payment error:', error);
                return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
            }
            updatedOrder = data;
        }

        if (updatedOrder && (db_order_id || razorpay_order_id)) {
            await recordRevenueEvent({
                eventKey: `globe_orders:${db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id}:payment:${razorpay_payment_id}`,
                sourceMarket: 'global',
                sourceTable: 'globe_orders',
                sourceId: db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id,
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'global_blueprint',
                customerEmail: customer_email || updatedOrder.customer_email,
                customerName: customer_name || updatedOrder.customer_name,
                customerPhone: customer_phone || updatedOrder.customer_phone,
                amountMinor: toMinorUnits(amount ?? updatedOrder.amount ?? 0),
                currency: 'USD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                metadata: { source: 'global-confirm-payment' },
            });
        }

        // Send confirmation email
        const emailTo = customer_email || updatedOrder?.customer_email;
        if (emailTo) {
            const name = customer_name || updatedOrder?.customer_name || emailTo.split('@')[0];
            const phone = customer_phone || updatedOrder?.customer_phone || '';
            const orderAmount = amount ?? updatedOrder?.amount ?? 0;
            const editAddon = has_edit_addon ?? updatedOrder?.iconik_edit_addon ?? false;

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

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Global confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
