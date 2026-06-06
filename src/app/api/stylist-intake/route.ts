import { NextRequest, NextResponse } from 'next/server';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { findPaidGlobeOrderByEmail, mirrorPaidGlobeOrderToStylist } from '@/lib/globeStylistMirror';

function cleanEmail(value: string | null) {
    return value?.trim().toLowerCase() || '';
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
    try {
        const email = cleanEmail(request.nextUrl.searchParams.get('email'));
        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
        }

        const order = await findPaidOrder(email);
        if (!order) {
            return NextResponse.json({ success: false, error: 'No paid Stylist Blueprint order found for this email.' }, { status: 403 });
        }

        const { data: existingIntake } = await supabaseStyleScan
            .from('stylist_intake_responses')
            .select('id, completed_at, completion_percentage')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return NextResponse.json({ success: true, order, existingIntake });
    } catch (error) {
        console.error('Stylist intake access error:', error);
        return NextResponse.json({ success: false, error: 'Unable to verify purchase' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = cleanEmail(body.customer_email);
        if (!email) {
            return NextResponse.json({ success: false, error: 'Missing customer_email' }, { status: 400 });
        }

        const order = await findPaidOrder(email);
        if (!order) {
            return NextResponse.json({ success: false, error: 'No paid Stylist Blueprint order found for this email.' }, { status: 403 });
        }

        const completionPercentage = Math.max(0, Math.min(100, Math.round(Number(body.completion_percentage ?? 0))));
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
            photo_urls: body.photo_urls || {},
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

        const { data, error } = await supabaseStyleScan
            .from('stylist_intake_responses')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        if (completionPercentage >= 90) {
            await supabaseStyleScan
                .from('stylist_orders')
                .update({ intake_completed: true, intake_completed_at: now })
                .eq('id', order.id);
        }

        return NextResponse.json({ success: true, intake: data });
    } catch (error) {
        console.error('Stylist intake submit error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unable to save intake',
        }, { status: 500 });
    }
}
