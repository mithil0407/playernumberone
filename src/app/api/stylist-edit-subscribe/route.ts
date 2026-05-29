import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { saveStyleEditSubscription, supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';

const MONTHLY_PLAN_ID = process.env.ICONIK_EDIT_MONTHLY_PLAN_ID_USD || '';
const ANNUAL_PLAN_ID = process.env.ICONIK_EDIT_ANNUAL_PLAN_ID_USD || '';

const EDIT_PLANS = {
    monthly: { planId: MONTHLY_PLAN_ID, amountCents: 3900, totalCount: 120 },
    annual: { planId: ANNUAL_PLAN_ID, amountCents: 29900, totalCount: 10 },
} as const;

function isInvalidRazorpayPlanError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const razorpayError = error as {
        statusCode?: number;
        error?: { code?: string; description?: string };
    };
    return razorpayError.statusCode === 400 &&
        razorpayError.error?.code === 'BAD_REQUEST_ERROR' &&
        typeof razorpayError.error.description === 'string' &&
        razorpayError.error.description.toLowerCase().includes('id provided is invalid');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_email, customer_phone, customer_name, lead_id, order_id, source } = body;
        const planType = body.plan_type === 'annual' ? 'annual' : 'monthly';
        const selectedPlan = EDIT_PLANS[planType];
        const incomingAttribution = attributionToColumns(body.attribution);

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ success: false, error: 'Payment gateway not configured.' }, { status: 500 });
        }

        if (!selectedPlan.planId) {
            const envName = planType === 'annual' ? 'ICONIK_EDIT_ANNUAL_PLAN_ID_USD' : 'ICONIK_EDIT_MONTHLY_PLAN_ID_USD';
            return NextResponse.json({
                success: false,
                error_code: 'plan_not_configured',
                error: `Edit ${planType} plan not configured. Add ${envName} to env.`,
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const name = customer_name || customer_email.split('@')[0];

        let subscription: { id: string };
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscription = await (razorpay.subscriptions.create as any)({
                plan_id: selectedPlan.planId,
                total_count: selectedPlan.totalCount,
                quantity: 1,
                customer_notify: 1,
                notes: {
                    customer_name: name,
                    customer_email,
                    customer_phone: customer_phone || '',
                    product: 'ICONIK Edit',
                    plan_type: planType,
                    source: source || 'checkout',
                    lead_id: lead_id || '',
                    order_id: order_id || '',
                    utm_source: incomingAttribution.utm_source || '',
                    utm_medium: incomingAttribution.utm_medium || '',
                    utm_campaign: incomingAttribution.utm_campaign || '',
                    landing_page: incomingAttribution.landing_page || '',
                },
            }) as { id: string };
        } catch (razorpayError) {
            if (isInvalidRazorpayPlanError(razorpayError)) {
                console.error('Edit subscription Razorpay plan invalid:', {
                    plan_type: planType,
                    plan_id: selectedPlan.planId,
                });
                return NextResponse.json({
                    success: false,
                    error_code: 'razorpay_plan_invalid',
                    error: `The configured Edit ${planType} Razorpay plan could not be found for this account or mode.`,
                }, { status: 500 });
            }
            throw razorpayError;
        }

        if (!subscription?.id) {
            throw new Error('Failed to create Edit subscription');
        }

        try {
            const { data: existingLead } = lead_id
                ? await supabaseStyleScan.from('style_scan_leads').select('*').eq('id', lead_id).single()
                : { data: null };
            const attribution = firstTouchAttribution(existingLead, incomingAttribution);

            await saveStyleEditSubscription({
                lead_id: lead_id || null,
                order_id: order_id || null,
                customer_email,
                customer_name: name,
                customer_phone: customer_phone || '',
                plan_type: planType,
                plan_id: selectedPlan.planId,
                razorpay_subscription_id: subscription.id,
                amount: selectedPlan.amountCents,
                currency: 'USD',
                status: 'pending',
                source: source || 'checkout',
                ...attribution,
            });
        } catch (dbErr) {
            console.warn('Edit subscription DB save failed (non-fatal):', dbErr);
        }

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            plan_type: planType,
            amount: selectedPlan.amountCents,
            currency: 'USD',
        });

    } catch (error) {
        console.error('Edit subscribe API error:', error);
        return NextResponse.json({
            success: false,
            error_code: 'subscription_setup_failed',
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
