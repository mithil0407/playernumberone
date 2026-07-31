import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { recordRevenueEvent } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';
import { sendMetaPurchaseEvent } from '@/lib/metaConversionsApi';

interface RazorpayPayment {
    id: string;
    amount: number;
    status?: string;
}

interface RazorpaySubscription {
    id: string;
    status: string;
    charge_at?: number;
    current_start?: number;
    ended_at?: number;
    paid_count?: number;
}

function timestampFromSeconds(value?: number) {
    return value ? new Date(value * 1000).toISOString() : undefined;
}

async function handleStyleEditSubscriptionEvent(event: string, subscription: RazorpaySubscription, payment?: RazorpayPayment) {
    const status =
        event === 'subscription.cancelled' ? 'cancelled' :
            event === 'subscription.completed' ? 'completed' :
                event === 'subscription.halted' ? 'halted' :
                    event === 'subscription.paused' ? 'cancelled' :
                        event === 'subscription.activated' || event === 'subscription.charged' || event === 'subscription.resumed' ? 'active' :
                            undefined;

    const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        ...(status && { status }),
        ...(payment?.id && { razorpay_payment_id: payment.id }),
        ...(timestampFromSeconds(subscription.current_start) && { start_at: timestampFromSeconds(subscription.current_start) }),
        ...(timestampFromSeconds(subscription.ended_at) && { notes: `Ended at ${timestampFromSeconds(subscription.ended_at)}` }),
    };

    const { data: dbSub, error } = await supabaseStyleScan
        .from('style_edit_subscriptions')
        .update(updatePayload)
        .eq('razorpay_subscription_id', subscription.id)
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Stylist Edit subscription webhook update failed:', error);
        return;
    }

    if (!dbSub) {
        console.warn(`Stylist Edit subscription not found for ${subscription.id}`);
        return;
    }

    if (event !== 'subscription.charged') return;

    const eventSuffix = payment?.id || `${subscription.paid_count ?? 'unknown'}:${subscription.current_start ?? Date.now()}`;
    await recordRevenueEvent({
        eventKey: `style_edit_subscriptions:${dbSub.id}:charge:${eventSuffix}`,
        sourceMarket: 'stylist',
        sourceTable: 'style_edit_subscriptions',
        sourceId: dbSub.id,
        revenueKind: 'subscription',
        eventType: subscription.paid_count === 1 ? 'subscription_initial' : 'subscription_charge',
        productType: 'stylist_edit',
        customerEmail: dbSub.customer_email,
        customerName: dbSub.customer_name,
        customerPhone: dbSub.customer_phone,
        amountMinor: payment?.amount ?? Number(dbSub.amount ?? 0),
        currency: 'USD',
        status: 'paid',
        paymentId: payment?.id,
        razorpaySubscriptionId: subscription.id,
        planType: dbSub.plan_type,
        occurredAt: timestampFromSeconds(subscription.current_start) ?? new Date().toISOString(),
        attribution: attributionFromRow(dbSub),
        metadata: { source: 'stylist-webhook', webhook_event: event, paid_count: subscription.paid_count },
    });

    if (payment?.id && Number.isFinite(payment.amount)) {
        await sendMetaPurchaseEvent({
            eventId: payment.id,
            eventSourceUrl: 'https://www.iconik.pro/stylist/checkout/success',
            customerEmail: dbSub.customer_email,
            customerName: dbSub.customer_name,
            customerPhone: dbSub.customer_phone,
            amount: payment.amount / 100,
            currency: 'USD',
            contentName: 'THE ICONIK EDIT',
            contentIds: ['iconik_edit_subscription'],
            numItems: 1,
            contentCategory: 'style_scan_edit',
            attribution: attributionFromRow(dbSub),
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ status: 'error', message: 'No signature' }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return NextResponse.json({ status: 'error', message: 'Webhook not configured' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
        }

        let webhookData: { event?: string; payload?: Record<string, unknown> } = {};
        try {
            webhookData = JSON.parse(body);
        } catch {
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        const event = webhookData.event || '';
        const payload = webhookData.payload || {};

        if (event.startsWith('subscription.')) {
            const subscription = (payload as { subscription?: { entity?: RazorpaySubscription } }).subscription?.entity;
            const payment = (payload as { payment?: { entity?: RazorpayPayment } }).payment?.entity;
            if (subscription?.id) {
                await handleStyleEditSubscriptionEvent(event, subscription, payment);
            }
        } else {
            console.log(`Unhandled stylist webhook event: ${event}`);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Stylist webhook error:', error);
        return NextResponse.json({ status: 'error', message: 'Webhook processing failed' }, { status: 500 });
    }
}
