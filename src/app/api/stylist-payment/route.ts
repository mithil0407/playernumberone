import { NextRequest, NextResponse } from 'next/server';
import { saveStyleScanLead, saveStylistOrder, supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import Razorpay from 'razorpay';

function isInvalidLeadForeignKeyError(error: unknown) {
    return Boolean(
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === '23503' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string' &&
        (error as { message: string }).message.includes('stylist_orders_lead_id_fkey')
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_name, customer_email, customer_phone, amount } = body;
        let { lead_id } = body;
        const incomingAttribution = attributionToColumns(body.attribution);

        if (!customer_email || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ success: false, error: 'Payment gateway not configured.' }, { status: 500 });
        }

        const orderId = `stylist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const amountInCents = Math.round(amount * 100);

        let dbOrderId = 'mock-order-id';

        try {
            let existingLead = null as Record<string, unknown> | null;

            if (!lead_id && body.scan_payload?.email) {
                const scan = body.scan_payload;
                const leadAttribution = firstTouchAttribution(null, incomingAttribution);
                const lead = await saveStyleScanLead({
                    email: scan.email,
                    first_name: scan.firstName,
                    style_struggle: scan.struggle,
                    body_shape: scan.bodyShape,
                    undertone: scan.undertone,
                    aesthetic: scan.aesthetic,
                    dressing_context: scan.dressingContext,
                    photo_url: scan.photoUrl,
                    style_score: Number.isFinite(Number(scan.styleScore)) ? Number(scan.styleScore) : undefined,
                    colour_direction: scan.colourDirection,
                    silhouette_direction: scan.silhouetteDirection,
                    mood_keywords: Array.isArray(scan.moodKeywords) ? scan.moodKeywords.join(',') : scan.moodKeywords,
                    mood_colours: Array.isArray(scan.moodColours) ? scan.moodColours.join(',') : scan.moodColours,
                    whats_missing: scan.whatsMissing,
                    season_name: scan.seasonName,
                    diagnosis_answers: {
                        temperatureSwatch: scan.temperatureSwatch,
                        metalTest: scan.metalTest,
                        whiteTest: scan.whiteTest,
                        naturalDepth: scan.naturalDepth,
                        claritySwatch: scan.claritySwatch,
                        styleGoal: scan.styleGoal,
                    },
                    betrayer_colours: Array.isArray(scan.betrayerColours) ? JSON.stringify(scan.betrayerColours) : scan.betrayerColours,
                    power_palette: Array.isArray(scan.powerPalette) ? JSON.stringify(scan.powerPalette) : scan.powerPalette,
                    source: scan.source || 'color_mirror_checkout_fallback',
                    ...leadAttribution,
                });

                if (lead?.id) {
                    lead_id = lead.id;
                    existingLead = lead;
                }
            }

            // Fetch existing lead for first-touch attribution
            if (!existingLead) {
                const { data } = lead_id
                ? await supabaseStyleScan.from('style_scan_leads').select('*').eq('id', lead_id).single()
                : { data: null };
                existingLead = data;
            }

            const orderAttribution = firstTouchAttribution(existingLead, incomingAttribution);

            const orderPayload = {
                lead_id: lead_id || null,
                customer_email,
                customer_name,
                customer_phone,
                amount,
                currency: 'USD',
                status: 'pending',
                razorpay_order_id: orderId,
                ...orderAttribution,
            } as const;

            let order;
            try {
                order = await saveStylistOrder(orderPayload);
            } catch (orderErr) {
                if (!isInvalidLeadForeignKeyError(orderErr)) throw orderErr;
                console.warn('Ignoring stale style_scan_lead_id for stylist checkout:', lead_id);
                lead_id = null;
                order = await saveStylistOrder({
                    ...orderPayload,
                    lead_id: null,
                });
            }
            dbOrderId = order.id!;

            // Mark lead as checkout_started
            if (lead_id) {
                await supabaseStyleScan
                    .from('style_scan_leads')
                    .update({ checkout_started: true })
                    .eq('id', lead_id);
            }
        } catch (err) {
            console.log('Stylist payment Supabase error, using mock IDs:', err);
        }

        try {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            const razorpayOrder = await razorpay.orders.create({
                amount: amountInCents,
                currency: 'USD',
                receipt: orderId,
                notes: {
                    customer_name: customer_name || '',
                    customer_email,
                    customer_phone: customer_phone || '',
                    base_product: 'ICONIK Style Blueprint',
                    service: 'ICONIK Stylist Blueprint',
                    db_order_id: dbOrderId,
                    lead_id: lead_id || '',
                    utm_source: incomingAttribution.utm_source || '',
                    utm_medium: incomingAttribution.utm_medium || '',
                    utm_campaign: incomingAttribution.utm_campaign || '',
                    landing_page: incomingAttribution.landing_page || '',
                },
            });

            if (!razorpayOrder?.id) throw new Error('Failed to create Razorpay order');

            await supabaseStyleScan
                .from('stylist_orders')
                .update({ razorpay_order_id: razorpayOrder.id })
                .eq('id', dbOrderId);

            return NextResponse.json({
                success: true,
                key: process.env.RAZORPAY_KEY_ID,
                razorpay_order_id: razorpayOrder.id,
                amount: amountInCents,
                currency: 'USD',
                db_order_id: dbOrderId,
            });

        } catch (razorpayError) {
            console.error('Razorpay stylist error:', razorpayError);
            return NextResponse.json({ success: false, error: 'Payment processing failed. Please try again.' }, { status: 500 });
        }

    } catch (error) {
        console.error('Stylist Payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
