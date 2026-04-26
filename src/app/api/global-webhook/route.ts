import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { sendGlobeOrderConfirmationEmail } from '@/lib/email';
import { recordRevenueEvent, toMinorUnits } from '@/lib/revenueEvents';
import { attributionFromRow } from '@/lib/attribution';

interface RazorpayPayment {
    id: string;
    order_id: string;
    amount: number;
    status: string;
    method?: string;
}

type RazorpayNotes = Record<string, string | number | null | undefined>;

interface RazorpayOrder {
    id: string;
    amount: number | string;
    notes?: RazorpayNotes;
}

interface RazorpaySubscription {
    id: string;
    status: string;
    charge_at?: number;
    current_start?: number;
    ended_at?: number;
    paid_count?: number;
}

async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.log('Razorpay credentials not configured for fetching order');
            return null;
        }
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        const order = await razorpay.orders.fetch(orderId);
        const normalized: RazorpayOrder = {
            id: order.id,
            amount: order.amount,
            notes: (order.notes || {}) as RazorpayNotes,
        };
        return normalized;
    } catch (err) {
        console.error('Error fetching Razorpay order:', err);
        return null;
    }
}

async function handleGlobalPaid(orderId: string, payment?: RazorpayPayment) {
    const orderDetails = await fetchRazorpayOrder(orderId);
    const notes = orderDetails?.notes || {};
    const dbOrderId = notes.db_order_id;

    let existingOrder = null as null | {
        id: string;
        customer_email: string | null;
        customer_name: string | null;
        customer_phone: string | null;
        amount: number | null;
        iconik_edit_addon: boolean | null;
        status: string | null;
        razorpay_payment_id: string | null;
        [key: string]: unknown;
    };

    if (dbOrderId && dbOrderId !== 'mock-order-id') {
        const { data } = await supabaseGlobe
            .from('globe_orders')
            .select('*')
            .eq('id', dbOrderId)
            .single();
        existingOrder = data;
    }

    if (!existingOrder) {
        const { data } = await supabaseGlobe
            .from('globe_orders')
            .select('*')
            .eq('razorpay_order_id', orderId)
            .single();
        existingOrder = data;
    }

    if (!existingOrder) {
        console.log(`Global order not found for razorpay_order_id ${orderId}`);
        return;
    }

    const customerEmail = existingOrder.customer_email || String(notes.customer_email || '');
    const customerName = existingOrder.customer_name || String(notes.customer_name || (customerEmail ? customerEmail.split('@')[0] : 'there'));
    const customerPhone = existingOrder.customer_phone || String(notes.customer_phone || '');
    const rawAmount = orderDetails?.amount;
    const normalizedAmount =
        typeof rawAmount === 'string'
            ? Math.round(Number(rawAmount) / 100)
            : rawAmount
                ? Math.round(rawAmount / 100)
                : 0;
    const orderAmount = existingOrder.amount ?? normalizedAmount;
    const editAddon =
        existingOrder.iconik_edit_addon ??
        (String(notes.iconik_edit_addon || '') === 'true' ? true : String(notes.iconik_edit_addon || '') === 'false' ? false : false);

    const alreadyPaid = existingOrder.status === 'paid' && !!existingOrder.razorpay_payment_id;

    const updatePayload: Record<string, unknown> = {
        status: 'paid',
        ...(payment?.id && { razorpay_payment_id: payment.id }),
        ...(existingOrder.customer_name ? {} : { customer_name: customerName }),
        ...(existingOrder.customer_phone ? {} : { customer_phone: customerPhone }),
        ...(existingOrder.customer_email ? {} : { customer_email: customerEmail }),
        ...(existingOrder.amount != null ? {} : { amount: orderAmount }),
        ...(existingOrder.iconik_edit_addon != null ? {} : { iconik_edit_addon: editAddon }),
    };

    const { error: updateError } = await supabaseGlobe
        .from('globe_orders')
        .update(updatePayload)
        .eq('id', existingOrder.id);

    if (updateError) {
        console.error('Global order update failed:', updateError);
        return;
    }

    if (payment?.id) {
        await recordRevenueEvent({
            eventKey: `globe_orders:${existingOrder.id}:payment:${payment.id}`,
            sourceMarket: 'global',
            sourceTable: 'globe_orders',
            sourceId: existingOrder.id,
            revenueKind: 'one_time',
            eventType: 'one_time_payment',
            productType: 'global_blueprint',
            customerEmail,
            customerName,
            customerPhone,
            amountMinor: payment.amount || toMinorUnits(orderAmount),
            currency: 'USD',
            status: 'paid',
            paymentId: payment.id,
            razorpayOrderId: orderId,
            attribution: attributionFromRow(existingOrder),
            metadata: { source: 'global-webhook' },
        });
    }

    if (!alreadyPaid && customerEmail) {
        try {
            const result = await sendGlobeOrderConfirmationEmail({
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                order_amount: orderAmount,
                payment_id: payment?.id || '',
                has_edit_addon: editAddon,
            });
            if (!result.success) {
                console.error('Global confirmation email failed:', result.error);
            } else {
                console.log(`Global confirmation email sent to ${customerEmail}`);
            }
        } catch (emailErr) {
            console.error('Global confirmation email threw:', emailErr);
        }
    } else {
        console.log('Global confirmation email skipped (already paid or missing email)');
    }
}

async function handleGlobalSubscriptionEvent(event: string, subscription: RazorpaySubscription, payment?: RazorpayPayment) {
    const status =
        event === 'subscription.cancelled' ? 'cancelled' :
            event === 'subscription.completed' ? 'expired' :
                event === 'subscription.paused' ? 'cancelled' :
                    'active';

    const updatePayload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (event === 'subscription.charged' || event === 'subscription.activated' || event === 'subscription.resumed') {
        updatePayload.status = 'active';
    }

    const { data: dbSub, error } = await supabaseGlobe
        .from('globe_subscriptions')
        .update(updatePayload)
        .eq('razorpay_subscription_id', subscription.id)
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Global subscription webhook update failed:', error);
        return;
    }

    if (event !== 'subscription.charged' || !dbSub) return;

    const eventSuffix = payment?.id || `${subscription.paid_count ?? 'unknown'}:${subscription.current_start ?? Date.now()}`;
    await recordRevenueEvent({
        eventKey: `globe_subscriptions:${dbSub.id}:charge:${eventSuffix}`,
        sourceMarket: 'global',
        sourceTable: 'globe_subscriptions',
        sourceId: dbSub.id,
        revenueKind: 'subscription',
        eventType: subscription.paid_count === 1 ? 'subscription_initial' : 'subscription_charge',
        productType: 'subscription',
        customerEmail: dbSub.customer_email,
        customerName: dbSub.customer_name,
        customerPhone: dbSub.customer_phone,
        amountMinor: payment?.amount ?? dbSub.amount,
        currency: 'USD',
        status: 'paid',
        paymentId: payment?.id,
        razorpaySubscriptionId: subscription.id,
        planType: dbSub.plan_type,
        occurredAt: subscription.current_start
            ? new Date(subscription.current_start * 1000).toISOString()
            : new Date().toISOString(),
        attribution: attributionFromRow(dbSub),
        metadata: { source: 'global-webhook', webhook_event: event, paid_count: subscription.paid_count },
    });
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
        } catch (error) {
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        const event = webhookData.event || '';
        const payload = webhookData.payload || {};

        if (event === 'payment.captured' || event === 'payment.authorized') {
            const payment = (payload as { payment?: { entity?: RazorpayPayment } }).payment?.entity;
            if (payment?.order_id) {
                await handleGlobalPaid(payment.order_id, payment);
            }
        } else if (event === 'order.paid') {
            const order = (payload as { order?: { entity?: RazorpayOrder } }).order?.entity;
            const payment = (payload as { payment?: { entity?: RazorpayPayment } }).payment?.entity;
            if (order?.id) {
                await handleGlobalPaid(order.id, payment);
            }
        } else if (event.startsWith('subscription.')) {
            const subscription = (payload as { subscription?: { entity?: RazorpaySubscription } }).subscription?.entity;
            const payment = (payload as { payment?: { entity?: RazorpayPayment } }).payment?.entity;
            if (subscription?.id) {
                await handleGlobalSubscriptionEvent(event, subscription, payment);
            }
        } else {
            console.log(`Unhandled global webhook event: ${event}`);
        }

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('Global webhook error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 200 });
    }
}
