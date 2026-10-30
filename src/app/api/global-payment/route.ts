import { priceForDedicatedCheckout } from '@/lib/checkoutPricing';
import { NextRequest, NextResponse } from 'next/server';
import { saveGlobeCustomer, saveGlobeOrder, supabaseGlobe } from '@/lib/supabaseGlobe';
import { saveStylistOrder, supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import { cleanCustomerEmail } from '@/lib/globeStylistMirror';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            customer_name,
            customer_email,
            customer_phone,
            amount,
        } = body;
        if (body.iconik_edit_addon != null && typeof body.iconik_edit_addon !== 'boolean') {
            return NextResponse.json({ error: 'Invalid add-on selection.' }, { status: 400 });
        }
        const iconik_edit_addon = body.iconik_edit_addon === true;
        const expectedPrice = priceForDedicatedCheckout('global', iconik_edit_addon);
        if (Number(amount) !== expectedPrice.amount) return NextResponse.json({ error: 'The checkout price changed. Please refresh and try again.' }, { status: 400 });
        const incomingAttribution = attributionToColumns(body.attribution);

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

        const orderId = `global_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // Razorpay uses smallest currency unit: cents for USD
        const amountInCents = Math.round(amount * 100);
        const normalizedEmail = cleanCustomerEmail(customer_email);

        let customerId = 'mock-customer-id';
        let dbOrderId = 'mock-order-id';
        let stylistOrderId = 'mock-stylist-order-id';

        try {
            const { data: existingCustomer } = await supabaseGlobe
                .from('globe_customers')
                .select('*')
                .eq('email', normalizedEmail)
                .single();
            const customerAttribution = firstTouchAttribution(existingCustomer, incomingAttribution);
            const customer = await saveGlobeCustomer({
                name: customer_name,
                email: normalizedEmail,
                phone: customer_phone,
                ...customerAttribution,
            });
            customerId = customer.id!;
            const orderAttribution = firstTouchAttribution(customer, incomingAttribution);

            const order = await saveGlobeOrder({
                customer_id: customer.id!,
                customer_email: normalizedEmail,
                customer_name,
                customer_phone,
                amount,
                currency: 'USD',
                iconik_edit_addon,
                status: 'pending',
                razorpay_order_id: orderId,
                ...orderAttribution,
            });
            dbOrderId = order.id!;

            const stylistOrder = await saveStylistOrder({
                lead_id: null,
                customer_email: normalizedEmail,
                customer_name,
                customer_phone,
                amount,
                currency: 'USD',
                status: 'pending',
                razorpay_order_id: orderId,
                ...orderAttribution,
            });
            stylistOrderId = stylistOrder.id!;
        } catch (err) {
            console.error('Global payment order save failed:', err);
            return NextResponse.json({ error: 'Could not create your order. Please try again.' }, { status: 500 });
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
                    customer_email: normalizedEmail,
                    customer_phone,
                    base_product: 'ICONIK Blueprint Global',
                    iconik_edit_addon: iconik_edit_addon ? 'true' : 'false',
                    service: 'ICONIK Global Blueprint',
                    db_order_id: dbOrderId,
                    stylist_order_id: stylistOrderId,
                    customer_id: customerId,
                    utm_source: incomingAttribution.utm_source || '',
                    utm_medium: incomingAttribution.utm_medium || '',
                    utm_campaign: incomingAttribution.utm_campaign || '',
                    landing_page: incomingAttribution.landing_page || '',
                },
            };

            const razorpayOrder = await razorpay.orders.create(orderRequest);

            if (!razorpayOrder?.id) {
                throw new Error('Failed to create Razorpay order');
            }

            // Update order with real Razorpay ID — MUST complete before webhook arrives
            const { error: updateIdError } = await supabaseGlobe
                .from('globe_orders')
                .update({ razorpay_order_id: razorpayOrder.id })
                .eq('id', dbOrderId);

            if (updateIdError) {
                throw updateIdError;
            }

            if (stylistOrderId !== 'mock-stylist-order-id') {
                const { error: updateStylistIdError } = await supabaseStyleScan
                    .from('stylist_orders')
                    .update({ razorpay_order_id: razorpayOrder.id })
                    .eq('id', stylistOrderId);

                if (updateStylistIdError) {
                    throw updateStylistIdError;
                }
            }

            return NextResponse.json({
                success: true,
                key: process.env.RAZORPAY_KEY_ID,
                razorpay_order_id: razorpayOrder.id,
                amount: amountInCents,
                currency: 'USD',
                customer_id: customerId,
                db_order_id: dbOrderId,
                stylist_order_id: stylistOrderId,
            });

        } catch (razorpayError) {
            console.error('Razorpay Global error:', razorpayError);
            return NextResponse.json({
                success: false,
                error: 'Payment processing failed. Please try again or contact support.'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Global Payment API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
