'use server';

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Subscription plan IDs
const SUBSCRIPTION_PLANS = {
    monthly: 'plan_S8aBI9ZDFJZd9u',
    yearly: 'plan_S8aDhd2Wtvl16A'
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
            customer_id,
            order_id
        } = body;

        // Validate required fields
        if (!plan_type || !customer_email || !customer_phone) {
            return NextResponse.json(
                { error: 'Missing required fields: plan_type, customer_email, customer_phone' },
                { status: 400 }
            );
        }

        // Validate plan type
        if (!['monthly', 'yearly'].includes(plan_type)) {
            return NextResponse.json(
                { error: 'Invalid plan_type. Must be "monthly" or "yearly"' },
                { status: 400 }
            );
        }

        // Check if Razorpay credentials are configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay credentials not configured');
            return NextResponse.json({
                success: false,
                error: 'Payment gateway not configured. Please contact support.'
            }, { status: 500 });
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Get the plan ID based on type
        const planId = SUBSCRIPTION_PLANS[plan_type as keyof typeof SUBSCRIPTION_PLANS];

        // Create subscription
        const subscriptionRequest = {
            plan_id: planId,
            total_count: plan_type === 'yearly' ? 12 : 12, // 12 billing cycles for both
            quantity: 1,
            customer_notify: 1 as const,
            notes: {
                customer_name: customer_name || customer_email.split('@')[0],
                customer_email: customer_email,
                customer_phone: customer_phone,
                plan_type: plan_type,
                original_customer_id: customer_id || '',
                original_order_id: order_id || '',
                product: 'Iconik Closet Subscription'
            }
        };

        const subscription = await razorpay.subscriptions.create(subscriptionRequest) as unknown as RazorpaySubscription;

        if (!subscription?.id) {
            throw new Error('Failed to create Razorpay subscription');
        }

        console.log('Subscription created:', subscription.id);

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            plan_id: planId,
            plan_type: plan_type,
            amount: plan_type === 'yearly' ? 718800 : 69900, // Amount in paise
            currency: 'INR'
        });

    } catch (error) {
        console.error('Subscription API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
