// Globe Intake Notification
// Called client-side after a successful intake submission.
// Sends internal and client confirmation emails after intake submission.

import { NextRequest, NextResponse } from 'next/server';
import { sendGlobeIntakeNotificationEmail, sendGlobeIntakeReceivedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            customer_email,
            customer_phone,
            photo_fullbody_url,
            photo_headshot_url,
            primary_goal,
            style_relationship,
            dressing_context,
            location_tier,
            height_category,
            body_shape,
            fat_storage_zone,
            highlight_zone,
            minimise_zone,
            fit_preference,
            modesty_level,
            wardrobe_composition,
            skin_tone,
            vein_undertone,
            white_test,
            hair_colour,
            eye_colour,
            derived_colour_season,
            face_shape,
            facial_feature_type,
            style_goal,
            primary_style_goal,
            branch_sub_goal,
            branch_blocker,
            branch_reference,
            style_pole_structure,
            style_pole_expression,
            style_pole_tone,
            style_pole_register,
            style_blocker,
            style_anti_pref,
            style_anti_pref_note,
            visual_style_reference,
            free_text_note,
        } = body;

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        const notificationPayload = {
            customer_email,
            customer_phone: customer_phone || '',
            photo_fullbody_url,
            photo_headshot_url,
            primary_goal,
            style_relationship,
            dressing_context,
            location_tier,
            height_category,
            body_shape,
            fat_storage_zone,
            highlight_zone,
            minimise_zone,
            fit_preference,
            modesty_level,
            wardrobe_composition,
            skin_tone,
            vein_undertone,
            white_test,
            hair_colour,
            eye_colour,
            derived_colour_season,
            face_shape,
            facial_feature_type,
            style_goal,
            primary_style_goal,
            branch_sub_goal,
            branch_blocker,
            branch_reference,
            style_pole_structure,
            style_pole_expression,
            style_pole_tone,
            style_pole_register,
            style_blocker,
            style_anti_pref,
            style_anti_pref_note,
            visual_style_reference,
            free_text_note,
        };

        const [internalResult, clientResult] = await Promise.allSettled([
            sendGlobeIntakeNotificationEmail(notificationPayload),
            sendGlobeIntakeReceivedEmail({
                customer_email,
                customer_phone: customer_phone || '',
            }),
        ]);

        if (internalResult.status === 'rejected') {
            console.error('Globe internal intake notification threw:', internalResult.reason);
        } else if (!internalResult.value.success) {
            console.error('Globe internal intake notification failed:', internalResult.value.error);
        }

        if (clientResult.status === 'rejected') {
            console.error('Globe client intake confirmation threw:', clientResult.reason);
            return NextResponse.json({ success: false, error: 'Client confirmation email failed' }, { status: 500 });
        }

        if (!clientResult.value.success) {
            console.error('Globe client intake confirmation failed:', clientResult.value.error);
            return NextResponse.json({ success: false, error: clientResult.value.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Globe intake notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
