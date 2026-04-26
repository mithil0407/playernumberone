// API Route: Iconik Club Subscription

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { saveSubscription, saveCustomer, getCustomerByEmail } from '@/lib/supabase';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';

const ICONIK_CLUB_PLANS = {
    monthly:   { id: process.env.ICONIK_CLUB_PLAN_MONTHLY!,   amount: 69900  }, // ₹699
    quarterly: { id: process.env.ICONIK_CLUB_PLAN_QUARTERLY!, amount: 239900 }, // ₹2,399
    yearly:    { id: process.env.ICONIK_CLUB_PLAN_YEARLY!,    amount: 718800 }, // ₹7,188
};

const TOTAL_COUNTS = {
    monthly:   12,
    quarterly: 12,
    yearly:    12,
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan_type, customer_name, customer_email, customer_phone, original_order_id } = body;
        const incomingAttribution = attributionToColumns(body.attribution);

        if (!plan_type || !customer_email || !customer_phone) {
            return NextResponse.json(
                { error: 'Missing required fields: plan_type, customer_email, customer_phone' },
                { status: 400 }
            );
        }

        if (!['monthly', 'quarterly', 'yearly'].includes(plan_type)) {
            return NextResponse.json(
                { error: 'Invalid plan_type. Must be "monthly", "quarterly", or "yearly"' },
                { status: 400 }
            );
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json(
                { success: false, error: 'Payment gateway not configured.' },
                { status: 500 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const plan = ICONIK_CLUB_PLANS[plan_type as keyof typeof ICONIK_CLUB_PLANS];
        const resolvedName = customer_name || customer_email.split('@')[0];

        const subscription = await razorpay.subscriptions.create({
            plan_id: plan.id,
            total_count: TOTAL_COUNTS[plan_type as keyof typeof TOTAL_COUNTS],
            quantity: 1,
            customer_notify: 1 as const,
            notes: {
                customer_name:     resolvedName,
                customer_email:    customer_email,
                customer_phone:    customer_phone,
                plan_type:         plan_type,
                product:           'Iconik Club',
                original_order_id: original_order_id || '',
                utm_source: incomingAttribution.utm_source || '',
                utm_medium: incomingAttribution.utm_medium || '',
                utm_campaign: incomingAttribution.utm_campaign || '',
                landing_page: incomingAttribution.landing_page || '',
            },
        });

        if (!subscription?.id) {
            throw new Error('Failed to create Razorpay subscription');
        }

        // Save to DB (non-blocking — Razorpay is source of truth)
        try {
            const existingCustomer = await getCustomerByEmail(customer_email);
            let dbCustomerId = existingCustomer?.id;

            if (!dbCustomerId) {
                const newCustomer = await saveCustomer({
                    name:  resolvedName,
                    email: customer_email,
                    phone: customer_phone,
                    ...incomingAttribution,
                });
                dbCustomerId = newCustomer.id;
            }
            const subscriptionAttribution = firstTouchAttribution(existingCustomer, incomingAttribution);

            await saveSubscription({
                customer_id:              dbCustomerId,
                customer_email:           customer_email,
                customer_phone:           customer_phone,
                customer_name:            resolvedName,
                plan_type:                plan_type as 'monthly' | 'quarterly' | 'yearly',
                plan_id:                  plan.id,
                razorpay_subscription_id: subscription.id,
                amount:                   plan.amount,
                currency:                 'INR',
                status:                   'pending',
                original_order_id:        original_order_id || undefined,
                notes:                    'Iconik Club subscription',
                ...subscriptionAttribution,
            });
        } catch (dbError) {
            console.error('DB save failed (non-fatal):', dbError);
        }

        return NextResponse.json({
            success:         true,
            subscription_id: subscription.id,
            short_url:       subscription.short_url,
            plan_type,
            amount:          plan.amount,
            key:             process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Subscription API error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
