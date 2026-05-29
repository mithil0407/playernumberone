import { NextRequest, NextResponse } from 'next/server';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { sendStylistOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';

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
            lead_id,
            edit_selected,
        } = await request.json();

        if (!razorpay_payment_id) {
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        let updatedOrder: Record<string, unknown> | null = null;

        if (db_order_id && db_order_id !== 'mock-order-id') {
            const { data, error } = await supabaseStyleScan
                .from('stylist_orders')
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
            const { data, error } = await supabaseStyleScan
                .from('stylist_orders')
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
                console.error('Stylist confirm payment error:', error);
                return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
            }
            updatedOrder = data;
        }

        // Mark lead as purchased
        if (lead_id) {
            await supabaseStyleScan
                .from('style_scan_leads')
                .update({ purchased: true })
                .eq('id', lead_id);
        }

        // Revenue event
        if (updatedOrder) {
            await recordRevenueEvent({
                eventKey: `stylist_orders:${db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id}:payment:${razorpay_payment_id}`,
                sourceMarket: 'stylist',
                sourceTable: 'stylist_orders',
                sourceId: db_order_id !== 'mock-order-id' ? db_order_id : razorpay_order_id,
                revenueKind: 'one_time',
                eventType: 'one_time_payment',
                productType: 'stylist_blueprint',
                customerEmail: customer_email || String(updatedOrder.customer_email ?? ''),
                customerName: customer_name || String(updatedOrder.customer_name ?? ''),
                customerPhone: customer_phone || String(updatedOrder.customer_phone ?? ''),
                amountMinor: toMinorUnits(amount ?? Number(updatedOrder.amount ?? 0)),
                currency: 'USD',
                status: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                attribution: attributionFromRow(updatedOrder),
                metadata: { source: 'stylist-confirm-payment', lead_id, edit_selected: Boolean(edit_selected) },
            });
        }

        // Confirmation email
        const emailTo = customer_email || String(updatedOrder?.customer_email ?? '');
        if (emailTo) {
            const name = customer_name || String(updatedOrder?.customer_name ?? '') || emailTo.split('@')[0];
            const phone = customer_phone || String(updatedOrder?.customer_phone ?? '');
            const orderAmount = amount ?? Number(updatedOrder?.amount ?? 0);

            try {
                await sendStylistOrderConfirmationEmail({
                    customer_name: name,
                    customer_email: emailTo,
                    customer_phone: phone,
                    order_amount: orderAmount,
                    payment_id: razorpay_payment_id,
                    has_edit_addon: Boolean(edit_selected),
                    edit_authorization_pending: Boolean(edit_selected),
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
