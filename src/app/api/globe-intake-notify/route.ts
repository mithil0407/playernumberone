// Globe Intake Notification
// Called client-side after a successful intake submission.
// Sends an internal email to help.iconikfashion@gmail.com with all form details + photo links.

import { NextRequest, NextResponse } from 'next/server';
import { sendGlobeIntakeNotificationEmail } from '@/lib/email';

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
            visual_style_reference,
            free_text_note,
        } = body;

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        const result = await sendGlobeIntakeNotificationEmail({
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
            visual_style_reference,
            free_text_note,
        });

        if (!result.success) {
            console.error('Globe intake notification failed:', result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Globe intake notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
