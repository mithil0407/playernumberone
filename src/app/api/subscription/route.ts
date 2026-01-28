// API Route for Razorpay Subscription

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Subscription plan IDs
const SUBSCRIPTION_PLANS = {
    monthly: 'plan_S8aBI9ZDFJZd9u',        // Original monthly plan (consultation upsell)
    yearly: 'plan_S8aDhd2Wtvl16A',          // Original yearly plan (consultation upsell)
    'iconik-monthly': 'plan_S99gOCaBnHybc7',    // Iconik Closet monthly plan
    quarterly: 'plan_S99mi4mzryqODa'        // Iconik Closet quarterly plan
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
        if (!['monthly', 'yearly', 'quarterly'].includes(plan_type)) {
            return NextResponse.json(
                { error: 'Invalid plan_type. Must be "monthly", "yearly", or "quarterly"' },
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
        // For Iconik Closet, use the new plan IDs
        let planId: string;
        if (plan_type === 'monthly') {
            // Check if this is from Iconik Closet or consultation upsell
            // If no customer_id/order_id, it's from Iconik Closet direct
            planId = (!customer_id && !order_id) ? SUBSCRIPTION_PLANS['iconik-monthly'] : SUBSCRIPTION_PLANS.monthly;
        } else {
            planId = SUBSCRIPTION_PLANS[plan_type as keyof typeof SUBSCRIPTION_PLANS];
        }

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

        // Determine amount based on plan type
        let amount: number;
        if (plan_type === 'yearly') {
            amount = 718800; // ₹7,188 in paise (yearly plan from consultation upsell)
        } else if (plan_type === 'quarterly') {
            amount = 459900; // ₹4,599 in paise (quarterly plan for Iconik Closet)
        } else {
            // Monthly plan - determine which one
            amount = (!customer_id && !order_id) ? 169900 : 69900; // ₹1,699 or ₹699 in paise
        }

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            plan_id: planId,
            plan_type: plan_type,
            amount: amount,
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
