import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { saveStyleEditSubscription, supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';

// Requires ICONIK_EDIT_PLAN_ID_USD env var — create a $39/month USD plan in the Razorpay dashboard
const EDIT_PLAN_ID = process.env.ICONIK_EDIT_PLAN_ID_USD;
const EDIT_AMOUNT_CENTS = 3900; // $39.00

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_email, customer_phone, customer_name, lead_id, order_id, source } = body;
        const incomingAttribution = attributionToColumns(body.attribution);

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ success: false, error: 'Payment gateway not configured.' }, { status: 500 });
        }

        if (!EDIT_PLAN_ID) {
            return NextResponse.json({ success: false, error: 'Edit plan not configured. Add ICONIK_EDIT_PLAN_ID_USD to env.' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // First billing fires 4 days from now — Blueprint delivered in 72h, 1 day buffer
        const startAt = Math.floor((Date.now() + 4 * 24 * 3600 * 1000) / 1000);
        const name = customer_name || customer_email.split('@')[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = await (razorpay.subscriptions.create as any)({
            plan_id: EDIT_PLAN_ID,
            total_count: 120,
            quantity: 1,
            customer_notify: 1,
            start_at: startAt,
            notes: {
                customer_name: name,
                customer_email,
                customer_phone: customer_phone || '',
                product: 'ICONIK Edit',
                source: source || 'checkout',
                lead_id: lead_id || '',
                order_id: order_id || '',
                utm_source: incomingAttribution.utm_source || '',
                utm_medium: incomingAttribution.utm_medium || '',
                utm_campaign: incomingAttribution.utm_campaign || '',
                landing_page: incomingAttribution.landing_page || '',
            },
        }) as { id: string };

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
                plan_id: EDIT_PLAN_ID,
                razorpay_subscription_id: subscription.id,
                amount: EDIT_AMOUNT_CENTS,
                currency: 'USD',
                status: 'pending',
                source: source || 'checkout',
                start_at: new Date(startAt * 1000).toISOString(),
                ...attribution,
            });
        } catch (dbErr) {
            console.warn('Edit subscription DB save failed (non-fatal):', dbErr);
        }

        return NextResponse.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            subscription_id: subscription.id,
            amount: EDIT_AMOUNT_CENTS,
            currency: 'USD',
            start_at: startAt,
        });

    } catch (error) {
        console.error('Edit subscribe API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
