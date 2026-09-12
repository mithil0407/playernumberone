import { NextRequest, NextResponse } from 'next/server';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { findPaidGlobeOrderByEmail, mirrorPaidGlobeOrderToStylist } from '@/lib/globeStylistMirror';
import { sendStylistIntakeNotificationEmail, sendStylistIntakeReceivedEmail } from '@/lib/email';

function cleanEmail(value: string | null) {
    return value?.trim().toLowerCase() || '';
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function hasPhotoUrl(photos: Record<string, unknown>, key: string) {
    return typeof photos[key] === 'string' && Boolean((photos[key] as string).trim());
}

function missingRequiredPhotoLabels(photos: Record<string, unknown>) {
    const required = [
        ['headshot', 'Headshot / selfie'],
        ['full_body_front', 'Full body front'],
        ['full_body_side', 'Full body side profile'],
    ] as const;
    return required.filter(([key]) => !hasPhotoUrl(photos, key)).map(([, label]) => label);
}

function errorSummary(error: unknown) {
    if (!error || typeof error !== 'object') {
        return { message: String(error ?? 'Unknown error') };
    }

    const record = error as Record<string, unknown>;
    return {
        code: typeof record.code === 'string' ? record.code : undefined,
        message: typeof record.message === 'string' ? record.message : String(error),
        details: typeof record.details === 'string' ? record.details : undefined,
        hint: typeof record.hint === 'string' ? record.hint : undefined,
        name: typeof record.name === 'string' ? record.name : undefined,
    };
}

async function findPaidOrder(email: string) {
    const { data, error } = await supabaseStyleScan
        .from('stylist_orders')
        .select('*')
        .ilike('customer_email', email)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const globeOrder = await findPaidGlobeOrderByEmail(email);
    if (!globeOrder) return null;

    return mirrorPaidGlobeOrderToStylist({
        globeOrder,
        customerEmail: email,
    });
}

export async function GET(request: NextRequest) {
    const email = cleanEmail(request.nextUrl.searchParams.get('email'));
    try {
        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
        }

        const order = await findPaidOrder(email);
        if (!order) {
            return NextResponse.json({ success: false, error: 'No paid Stylist Blueprint order found for this email.' }, { status: 403 });
        }

        const { data: existingIntake } = await supabaseStyleScan
            .from('stylist_intake_responses')
            .select([
                'id',
                'completed_at',
                'completion_percentage',
                'customer_phone',
                'full_name',
                'age_range',
                'country',
                'primary_language',
                'body_measurements',
                'photo_urls',
                'focus_areas',
                'coverage_requirements',
                'lifestyle_context',
                'piece_preferences',
                'selected_moodboard_id',
                'selected_moodboard_label',
                'secondary_moodboard_elements',
                'hair_context',
                'shopping_relationship',
                'prior_styling_experience',
                'one_outfit_image_url',
            ].join(', '))
            .eq('order_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return NextResponse.json({ success: true, order, existingIntake });
    } catch (error) {
        console.error('Stylist intake access error:', {
            email,
            error: errorSummary(error),
        });
        return NextResponse.json({ success: false, error: 'Unable to verify purchase' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const logContext: {
        email?: string;
        orderId?: unknown;
        photoUrlKeys?: string[];
        completionPercentage?: number;
    } = {};

    try {
        const body = await request.json();
        const email = cleanEmail(body.customer_email);
        logContext.email = email;
        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing customer_email' }, { status: 400 });
        }

        const order = await findPaidOrder(email);
        if (!order) {
            return NextResponse.json({ success: false, error: 'No paid Stylist Blueprint order found for this email.' }, { status: 403 });
        }
        logContext.orderId = order.id;

        const photoUrls = asRecord(body.photo_urls);
        logContext.photoUrlKeys = Object.keys(photoUrls);
        const missingPhotos = missingRequiredPhotoLabels(photoUrls);
        if (missingPhotos.length) {
            return NextResponse.json({
                success: false,
                error: `Missing required intake photo(s): ${missingPhotos.join(', ')}`,
            }, { status: 400 });
        }

        const completionPercentage = Math.max(0, Math.min(100, Math.round(Number(body.completion_percentage ?? 0))));
        logContext.completionPercentage = completionPercentage;
        const now = new Date().toISOString();
        const payload = {
            order_id: order.id,
            lead_id: order.lead_id ?? body.lead_id ?? null,
            customer_email: email,
            customer_phone: body.customer_phone || order.customer_phone || null,
            full_name: body.full_name || order.customer_name || null,
            age_range: body.age_range || null,
            country: body.country || null,
            primary_language: body.primary_language || null,
            body_measurements: body.body_measurements || {},
            photo_urls: photoUrls,
            focus_areas: Array.isArray(body.focus_areas) ? body.focus_areas : [],
            coverage_requirements: body.coverage_requirements || {},
            lifestyle_context: body.lifestyle_context || {},
            piece_preferences: body.piece_preferences || {},
            selected_moodboard_id: body.selected_moodboard_id || null,
            selected_moodboard_label: body.selected_moodboard_label || null,
            secondary_moodboard_elements: Array.isArray(body.secondary_moodboard_elements) ? body.secondary_moodboard_elements : [],
            hair_context: body.hair_context || {},
            skin_tone_self_description: body.skin_tone_self_description || null,
            shopping_relationship: body.shopping_relationship || null,
            prior_styling_experience: body.prior_styling_experience || {},
            one_outfit_description: body.one_outfit_description || null,
            one_outfit_image_url: body.one_outfit_image_url || null,
            completion_percentage: completionPercentage,
            completed_at: completionPercentage >= 90 ? now : null,
            updated_at: now,
        };

        const { data: existingIntake, error: existingIntakeError } = await supabaseStyleScan
            .from('stylist_intake_responses')
            .select('id, completed_at')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingIntakeError) throw existingIntakeError;

        // If a browser loses the HTTP response after the database commit, its retry must
        // update the same order's intake instead of creating a duplicate submission.
        const write = existingIntake
            ? supabaseStyleScan
                .from('stylist_intake_responses')
                .update(payload)
                .eq('id', existingIntake.id)
                .select()
                .single()
            : supabaseStyleScan
                .from('stylist_intake_responses')
                .insert([payload])
                .select()
                .single();

        const { data, error } = await write;

        if (error) throw error;

        const emailStatus: { internal: 'skipped' | 'sent' | 'failed'; client: 'skipped' | 'sent' | 'failed' } = {
            internal: 'skipped',
            client: 'skipped',
        };

        if (completionPercentage >= 90) {
            await supabaseStyleScan
                .from('stylist_orders')
                .update({ intake_completed: true, intake_completed_at: now })
                .eq('id', order.id);

            const shouldSendConfirmation = !order.intake_completed;
            const [internalResult, clientResult] = shouldSendConfirmation
                ? await Promise.allSettled([
                    sendStylistIntakeNotificationEmail(payload),
                    sendStylistIntakeReceivedEmail({
                        customer_email: email,
                        customer_phone: payload.customer_phone || '',
                    }),
                ])
                : [null, null];

            if (!internalResult) {
                emailStatus.internal = 'skipped';
            } else if (internalResult.status === 'rejected') {
                emailStatus.internal = 'failed';
                console.error('Stylist internal intake notification threw:', internalResult.reason);
            } else if (!internalResult.value.success) {
                emailStatus.internal = 'failed';
                console.error('Stylist internal intake notification failed:', internalResult.value.error);
            } else {
                emailStatus.internal = 'sent';
            }

            if (!clientResult) {
                emailStatus.client = 'skipped';
            } else if (clientResult.status === 'rejected') {
                emailStatus.client = 'failed';
                console.error('Stylist client intake confirmation threw:', clientResult.reason);
            } else if (!clientResult.value.success) {
                emailStatus.client = 'failed';
                console.error('Stylist client intake confirmation failed:', clientResult.value.error);
            } else {
                emailStatus.client = 'sent';
            }
        }

        return NextResponse.json({ success: true, intake: data, email_status: emailStatus });
    } catch (error) {
        console.error('Stylist intake submit error:', {
            ...logContext,
            error: errorSummary(error),
        });
        return NextResponse.json({
            success: false,
            error: 'We could not save your intake. Please refresh the page and try again, or contact ICONIK support if this repeats.',
        }, { status: 500 });
    }
}
