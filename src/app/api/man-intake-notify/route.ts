// Man Intake Notification
// Called client-side after a successful intake submission.
// Sends an internal email to help.iconikfashion@gmail.com with all form details + photo links.

import { NextRequest, NextResponse } from 'next/server';
import { sendManIntakeNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            customer_email,
            customer_phone,
            photo_fullbody_url,
            photo_headshot_url,
            frustrations,
            frustrations_custom,
            situations,
            body_concerns,
            wardrobe_type,
            colour_preference,
            style_aesthetics,
            style_outcome,
            hair_type,
        } = body;

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        const result = await sendManIntakeNotificationEmail({
            customer_email,
            customer_phone: customer_phone || '',
            photo_fullbody_url,
            photo_headshot_url,
            frustrations,
            frustrations_custom,
            situations,
            body_concerns,
            wardrobe_type,
            colour_preference,
            style_aesthetics,
            style_outcome,
            hair_type,
        });

        if (!result.success) {
            console.error('Man intake notification failed:', result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Man intake notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
