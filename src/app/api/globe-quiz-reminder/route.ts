// Globe Quiz Reminder Cron
// Called by a cron job (e.g. cron-job.org) via GET request.
// Finds paid globe_orders with no intake submission and sends a reminder.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
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
        const reminderDelayMinutes = 30;
        const lookbackHours = Number(process.env.GLOBE_QUIZ_REMINDER_LOOKBACK_HOURS || 24);
        const maxOrdersPerRun = Number(process.env.GLOBE_QUIZ_REMINDER_BATCH_SIZE || 50);
        const windowStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() - reminderDelayMinutes * 60 * 1000);

        // ── Find paid globe orders old enough for a reminder ────────────────
        const { data: orders, error: ordersError } = await supabaseGlobe
            .from('globe_orders')
            .select('id, customer_email, customer_name, customer_phone, amount, created_at')
            .eq('status', 'paid')
            .or('quiz_reminder_sent.is.null,quiz_reminder_sent.eq.false')
            .gte('created_at', windowStart.toISOString())
            .lte('created_at', windowEnd.toISOString())
            .order('created_at', { ascending: true })
            .limit(maxOrdersPerRun);

        if (ordersError) {
            console.error('Globe quiz reminder — orders query error:', ordersError);
            return NextResponse.json({ error: 'Failed to query orders' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: 'No eligible orders found' });
        }

        console.log(`Globe quiz reminder: found ${orders.length} eligible order(s)`);

        const emails = Array.from(new Set(
            orders
                .map((order) => order.customer_email)
                .filter((email): email is string => Boolean(email))
        ));

        const [stylistOrdersRes, stylistIntakesRes] = emails.length > 0
            ? await Promise.all([
                supabaseStyleScan
                    .from('stylist_orders')
                    .select('customer_email')
                    .in('customer_email', emails)
                    .eq('status', 'paid')
                    .eq('intake_completed', true),
                supabaseStyleScan
                    .from('stylist_intake_responses')
                    .select('customer_email')
                    .in('customer_email', emails)
                    .not('completed_at', 'is', null),
            ])
            : [
                { data: [], error: null },
                { data: [], error: null },
            ];

        if (stylistOrdersRes.error || stylistIntakesRes.error) {
            console.error('Globe quiz reminder — stylist intake query error:', stylistOrdersRes.error || stylistIntakesRes.error);
            return NextResponse.json({ error: 'Failed to query stylist intakes' }, { status: 500 });
        }

        const submittedEmails = new Set([
            ...(stylistOrdersRes.data || []).map((order) => order.customer_email),
            ...(stylistIntakesRes.data || []).map((intake) => intake.customer_email),
        ]);

        let reminded = 0;
        let skipped = 0;

        for (const order of orders) {
            const email = order.customer_email;
            if (!email) {
                skipped++;
                continue;
            }

            // ── Check if this customer has already submitted intake ──────────
            if (submittedEmails.has(email)) {
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
            const intakeLink = `https://www.iconik.pro/stylist/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

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
