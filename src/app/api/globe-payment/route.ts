import { NextRequest, NextResponse } from 'next/server';
import { saveGlobeCustomer, saveGlobeOrder, supabaseGlobe } from '@/lib/supabaseGlobe';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            customer_name,
            customer_email,
            customer_phone,
            amount,
            iconik_edit_addon = false,
        } = body;

        if (!customer_name || !customer_email || !customer_phone || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay credentials not configured');
            return NextResponse.json({
                success: false,
                error: 'Payment gateway not configured. Please contact support.'
            }, { status: 500 });
        }

        const orderId = `globe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // Razorpay uses smallest currency unit: cents for USD
        const amountInCents = Math.round(amount * 100);

        let customerId = 'mock-customer-id';
        let dbOrderId = 'mock-order-id';

        try {
            const customer = await saveGlobeCustomer({
                name: customer_name,
                email: customer_email,
                phone: customer_phone,
            });
            customerId = customer.id!;

            const order = await saveGlobeOrder({
                customer_id: customer.id!,
                customer_email,
                amount,
                currency: 'USD',
                iconik_edit_addon,
                status: 'pending',
                razorpay_order_id: orderId,
            });
            dbOrderId = order.id!;
        } catch (err) {
            console.log('Globe Supabase error, using mock IDs:', err);
        }

        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            const orderRequest = {
                amount: amountInCents,
                currency: 'USD',
                receipt: orderId,
                notes: {
                    customer_name,
                    customer_email,
                    customer_phone,
                    base_product: 'ICONIK Blueprint Globe',
                    iconik_edit_addon: iconik_edit_addon ? 'true' : 'false',
                    service: 'ICONIK Globe Blueprint',
                    db_order_id: dbOrderId,
                    customer_id: customerId,
                },
            };

            const razorpayOrder = await razorpay.orders.create(orderRequest);

            if (!razorpayOrder?.id) {
                throw new Error('Failed to create Razorpay order');
            }

            // Defer Supabase update
            supabaseGlobe
                .from('globe_orders')
                .update({ razorpay_order_id: razorpayOrder.id })
                .eq('id', dbOrderId)
                .then(({ error }) => {
                    if (error) console.log('Failed to update globe order with Razorpay ID:', error);
                });

            return NextResponse.json({
                success: true,
                key: process.env.RAZORPAY_KEY_ID,
                razorpay_order_id: razorpayOrder.id,
                amount: amountInCents,
                currency: 'USD',
                customer_id: customerId,
                db_order_id: dbOrderId,
            });

        } catch (razorpayError) {
            console.error('Razorpay Globe error:', razorpayError);
            return NextResponse.json({
                success: false,
                error: 'Payment processing failed. Please try again or contact support.'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Globe Payment API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
