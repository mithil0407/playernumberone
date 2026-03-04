// Global Subscription API — ICONIK Style Feed OTO (USD)

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { saveGlobeSubscription, saveGlobeCustomer, supabaseGlobe } from '@/lib/supabaseGlobe';

// Globe Style Feed plan IDs (Razorpay — USD) — shared with /globe
const GLOBAL_STYLE_FEED_PLANS = {
    monthly: 'plan_SL2xA4EzLOvyR1',  // USD $19/month
    annual: 'plan_SL2y152SKsukWW',    // USD $168/year
};

const GLOBAL_PLAN_AMOUNTS = {
    monthly: 1900,   // $19.00 in cents
    annual: 16800,   // $168.00 in cents
};

interface RazorpaySubscription {
    id: string;
    plan_id: string;
    status: string;
    short_url: string;
    [key: string]: unknown;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            plan_type,
            customer_email,
            customer_phone,
            customer_name,
        } = body;

        if (!plan_type || !customer_email) {
            return NextResponse.json(
                { error: 'Missing required fields: plan_type, customer_email' },
                { status: 400 }
            );
        }

        if (!['monthly', 'annual'].includes(plan_type)) {
            return NextResponse.json(
                { error: 'Invalid plan_type. Must be "monthly" or "annual"' },
                { status: 400 }
            );
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({
                success: false,
                error: 'Payment gateway not configured. Please contact support.',
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const planId = GLOBAL_STYLE_FEED_PLANS[plan_type as keyof typeof GLOBAL_STYLE_FEED_PLANS];
        const amount = GLOBAL_PLAN_AMOUNTS[plan_type as keyof typeof GLOBAL_PLAN_AMOUNTS];
        const name = customer_name || customer_email.split('@')[0];

        const subscriptionRequest = {
            plan_id: planId,
            total_count: 12,
            quantity: 1,
            customer_notify: 1 as const,
            notes: {
                customer_name: name,
                customer_email,
                customer_phone: customer_phone || '',
                plan_type,
                product: 'ICONIK Style Feed — Global',
                region: 'Global',
            },
        };

        const subscription = await razorpay.subscriptions.create(subscriptionRequest) as unknown as RazorpaySubscription;

        if (!subscription?.id) {
            throw new Error('Failed to create Razorpay subscription');
        }

        // Persist to Supabase (fire-and-forget)
        try {
            const customer = await saveGlobeCustomer({
                name,
                email: customer_email,
                phone: customer_phone || '',
            });

            const customerId: string | undefined = customer?.id;

            const { data: existingSub } = await supabaseGlobe
                .from('globe_subscriptions')
                .select('id')
                .eq('customer_email', customer_email)
                .eq('plan_type', plan_type)
                .eq('status', 'active')
                .single();

            if (!existingSub) {
                await saveGlobeSubscription({
                    customer_id: customerId,
                    customer_email,
                    customer_phone: customer_phone || '',
                    customer_name: name,
                    plan_type: plan_type as 'monthly' | 'annual',
                    plan_id: planId,
                    razorpay_subscription_id: subscription.id,
                    amount,
                    currency: 'USD',
                    status: 'pending',
                    source: 'global_oto',
                    notes: `Global OTO — ${plan_type} plan created at ${new Date().toISOString()}`,
                });
            }
        } catch (dbError) {
            console.error('Failed to save Global subscription to Supabase:', dbError);
        }

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            plan_id: planId,
            plan_type,
            amount,
            currency: 'USD',
        });

    } catch (error) {
        console.error('Global subscription API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
