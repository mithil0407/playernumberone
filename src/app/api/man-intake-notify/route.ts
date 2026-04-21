// Man Intake Notification
// Called client-side after a successful intake submission.
// Sends internal and client confirmation emails after intake submission.

import { NextRequest, NextResponse } from 'next/server';
import { sendManIntakeNotificationEmail, sendManIntakeReceivedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        const [internalResult, clientResult] = await Promise.allSettled([
            sendManIntakeNotificationEmail(body),
            sendManIntakeReceivedEmail({
                customer_email: body.customer_email,
                customer_phone: body.customer_phone || '',
            }),
        ]);

        if (internalResult.status === 'rejected') {
            console.error('Man internal intake notification threw:', internalResult.reason);
        } else if (!internalResult.value.success) {
            console.error('Man internal intake notification failed:', internalResult.value.error);
        }

        if (clientResult.status === 'rejected') {
            console.error('Man client intake confirmation threw:', clientResult.reason);
            return NextResponse.json({ success: false, error: 'Client confirmation email failed' }, { status: 500 });
        }

        if (!clientResult.value.success) {
            console.error('Man client intake confirmation failed:', clientResult.value.error);
            return NextResponse.json({ success: false, error: clientResult.value.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Man intake notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
