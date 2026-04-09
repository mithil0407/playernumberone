// Man Intake Notification
// Called client-side after a successful intake submission.
// Sends an internal email to help.iconikfashion@gmail.com with all form details + photo links.

import { NextRequest, NextResponse } from 'next/server';
import { sendManIntakeNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        const result = await sendManIntakeNotificationEmail(body);

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
