import { NextRequest, NextResponse } from 'next/server';
import { saveStylistOrder, supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_name, customer_email, customer_phone, amount, lead_id } = body;
        const incomingAttribution = attributionToColumns(body.attribution);

        if (!customer_email || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ success: false, error: 'Payment gateway not configured.' }, { status: 500 });
        }

        const orderId = `stylist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const amountInCents = Math.round(amount * 100);

        let dbOrderId = 'mock-order-id';

        try {
            // Fetch existing lead for first-touch attribution
            const { data: existingLead } = lead_id
                ? await supabaseStyleScan.from('style_scan_leads').select('*').eq('id', lead_id).single()
                : { data: null };

            const orderAttribution = firstTouchAttribution(existingLead, incomingAttribution);

            const order = await saveStylistOrder({
                lead_id: lead_id || null,
                customer_email,
                customer_name,
                customer_phone,
                amount,
                currency: 'USD',
                status: 'pending',
                razorpay_order_id: orderId,
                ...orderAttribution,
            });
            dbOrderId = order.id!;

            // Mark lead as checkout_started
            if (lead_id) {
                await supabaseStyleScan
                    .from('style_scan_leads')
                    .update({ checkout_started: true })
                    .eq('id', lead_id);
            }
        } catch (err) {
            console.log('Stylist payment Supabase error, using mock IDs:', err);
        }

        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            const razorpayOrder = await razorpay.orders.create({
                amount: amountInCents,
                currency: 'USD',
                receipt: orderId,
                notes: {
                    customer_name: customer_name || '',
                    customer_email,
                    customer_phone: customer_phone || '',
                    base_product: 'ICONIK Style Blueprint',
                    service: 'ICONIK Stylist Blueprint',
                    db_order_id: dbOrderId,
                    lead_id: lead_id || '',
                    utm_source: incomingAttribution.utm_source || '',
                    utm_medium: incomingAttribution.utm_medium || '',
                    utm_campaign: incomingAttribution.utm_campaign || '',
                    landing_page: incomingAttribution.landing_page || '',
                },
            });

            if (!razorpayOrder?.id) throw new Error('Failed to create Razorpay order');

            await supabaseStyleScan
                .from('stylist_orders')
                .update({ razorpay_order_id: razorpayOrder.id })
                .eq('id', dbOrderId);

            return NextResponse.json({
                success: true,
                key: process.env.RAZORPAY_KEY_ID,
                razorpay_order_id: razorpayOrder.id,
                amount: amountInCents,
                currency: 'USD',
                db_order_id: dbOrderId,
            });

        } catch (razorpayError) {
            console.error('Razorpay stylist error:', razorpayError);
            return NextResponse.json({ success: false, error: 'Payment processing failed. Please try again.' }, { status: 500 });
        }

    } catch (error) {
        console.error('Stylist Payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
