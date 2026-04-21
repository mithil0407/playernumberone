// Globe Quiz Reminder Cron
// Called by a cron job (e.g. cron-job.org) via GET request.
// Finds paid globe_orders with no intake submission (30–90 min window) and sends a reminder.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { sendGlobeQuizReminderEmail } from '@/lib/email';

async function handleReminder(request: NextRequest) {
    // ── Auth: verify cron secret (optional — skip if not set) ──────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 90 * 60 * 1000); // 90 min ago
        const windowEnd = new Date(now.getTime() - 30 * 60 * 1000);   // 30 min ago

        // ── Find paid globe orders in the 30–90 min window ──────────────────
        const { data: orders, error: ordersError } = await supabaseGlobe
            .from('globe_orders')
            .select('id, customer_email, customer_name, customer_phone, amount, created_at')
            .eq('status', 'paid')
            .or('quiz_reminder_sent.is.null,quiz_reminder_sent.eq.false')
            .gte('created_at', windowStart.toISOString())
            .lte('created_at', windowEnd.toISOString());

        if (ordersError) {
            console.error('Globe quiz reminder — orders query error:', ordersError);
            return NextResponse.json({ error: 'Failed to query orders' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: 'No eligible orders found' });
        }

        console.log(`Globe quiz reminder: found ${orders.length} eligible order(s)`);

        let reminded = 0;
        let skipped = 0;

        for (const order of orders) {
            const email = order.customer_email;
            if (!email) {
                skipped++;
                continue;
            }

            // ── Check if this customer has already submitted intake ──────────
            const { data: intake } = await supabaseGlobe
                .from('globe_intake_submissions')
                .select('id')
                .eq('customer_email', email)
                .maybeSingle();

            if (intake) {
                // Intake submitted — mark reminder sent to stop future checks
                await supabaseGlobe
                    .from('globe_orders')
                    .update({ quiz_reminder_sent: true })
                    .eq('id', order.id);
                skipped++;
                continue;
            }

            // ── Send the reminder email ────────────────────────────────────
            const name = order.customer_name || email.split('@')[0];
            const phone = order.customer_phone || '';
            const intakeLink = `https://www.iconik.pro/globe/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

            const result = await sendGlobeQuizReminderEmail({
                customer_name: name,
                customer_email: email,
                intake_link: intakeLink,
                delivery_hours: 72,
            });

            // Mark reminder sent regardless of email outcome (avoid duplicate sends)
            await supabaseGlobe
                .from('globe_orders')
                .update({ quiz_reminder_sent: true })
                .eq('id', order.id);

            if (result.success) {
                reminded++;
                console.log(`Globe quiz reminder sent to ${email}`);
            } else {
                console.error(`Globe quiz reminder failed for ${email}:`, result.error);
            }
        }

        return NextResponse.json({
            success: true,
            processed: orders.length,
            reminded,
            skipped,
        });

    } catch (error) {
        console.error('Globe quiz reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Support both GET and POST so free cron services work regardless of method
export async function GET(request: NextRequest) {
    return handleReminder(request);
}

export async function POST(request: NextRequest) {
    return handleReminder(request);
}
