// AU Subscription API — ICONIK Style Feed OTO

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// AU Style Feed plan IDs (Razorpay)
const AU_STYLE_FEED_PLANS = {
    monthly: 'plan_SKSBZeiSVbFWdP',  // AUD $19/month
    annual: 'plan_SKSRwRMROQgjSO',  // AUD $168/year
};

// Amounts in smallest currency unit (paise not applicable for AUD — Razorpay uses cents)
const AU_PLAN_AMOUNTS = {
    monthly: 1900,   // AUD $19.00
    annual: 16800,  // AUD $168.00
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

        // Validate required fields
        if (!plan_type || !customer_email) {
            return NextResponse.json(
                { error: 'Missing required fields: plan_type, customer_email' },
                { status: 400 }
            );
        }

        // Validate plan type
        if (!['monthly', 'annual'].includes(plan_type)) {
            return NextResponse.json(
                { error: 'Invalid plan_type. Must be "monthly" or "annual"' },
                { status: 400 }
            );
        }

        // Check Razorpay credentials
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay credentials not configured');
            return NextResponse.json({
                success: false,
                error: 'Payment gateway not configured. Please contact support.',
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const planId = AU_STYLE_FEED_PLANS[plan_type as keyof typeof AU_STYLE_FEED_PLANS];
        const amount = AU_PLAN_AMOUNTS[plan_type as keyof typeof AU_PLAN_AMOUNTS];

        const subscriptionRequest = {
            plan_id: planId,
            total_count: 12, // 12 billing cycles
            quantity: 1,
            customer_notify: 1 as const,
            notes: {
                customer_name: customer_name || customer_email.split('@')[0],
                customer_email,
                customer_phone: customer_phone || '',
                plan_type,
                product: 'ICONIK Style Feed — AU',
                region: 'AU',
            },
        };

        const subscription = await razorpay.subscriptions.create(subscriptionRequest) as unknown as RazorpaySubscription;

        if (!subscription?.id) {
            throw new Error('Failed to create Razorpay subscription');
        }

        console.log('AU Style Feed subscription created:', subscription.id);

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            plan_id: planId,
            plan_type,
            amount,
            currency: 'AUD',
        });

    } catch (error) {
        console.error('AU subscription API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 }
        );
    }
}
