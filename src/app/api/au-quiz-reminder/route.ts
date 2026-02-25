// AU Quiz Reminder Cron
// Called by Vercel Cron every 10 minutes.
// Finds paid orders with no intake submission (30–90 min window) and sends a reminder.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAU } from '@/lib/supabaseAU';
import { sendAUQuizReminderEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
    // ── Auth: verify Vercel Cron secret ─────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 90 * 60 * 1000); // 90 min ago
        const windowEnd = new Date(now.getTime() - 30 * 60 * 1000);   // 30 min ago

        // ── Find paid orders in the 30–90 min window ────────────────────────
        const { data: orders, error: ordersError } = await supabaseAU
            .from('au_orders')
            .select('id, customer_email, customer_name, customer_phone, amount, created_at')
            .eq('status', 'paid')
            .or('quiz_reminder_sent.is.null,quiz_reminder_sent.eq.false')
            .gte('created_at', windowStart.toISOString())
            .lte('created_at', windowEnd.toISOString());

        if (ordersError) {
            console.error('AU quiz reminder — orders query error:', ordersError);
            return NextResponse.json({ error: 'Failed to query orders' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: 'No eligible orders found' });
        }

        console.log(`AU quiz reminder: found ${orders.length} eligible order(s)`);

        let reminded = 0;
        let skipped = 0;

        for (const order of orders) {
            const email = order.customer_email;
            if (!email) {
                skipped++;
                continue;
            }

            // ── Check if this customer has submitted intake ──────────────────
            const { data: intake } = await supabaseAU
                .from('au_intake_submissions')
                .select('id')
                .eq('customer_email', email)
                .maybeSingle();

            if (intake) {
                // Intake already submitted — mark reminder sent to stop future checks
                await supabaseAU
                    .from('au_orders')
                    .update({ quiz_reminder_sent: true })
                    .eq('id', order.id);
                skipped++;
                continue;
            }

            // ── Send the reminder ────────────────────────────────────────────
            const name = order.customer_name || email.split('@')[0];
            const phone = order.customer_phone || '';
            const intakeLink = `https://playernumberone.com/au/intake?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

            const result = await sendAUQuizReminderEmail({
                customer_name: name,
                customer_email: email,
                intake_link: intakeLink,
            });

            // Mark reminder sent regardless of email success (avoid repeat sends)
            await supabaseAU
                .from('au_orders')
                .update({ quiz_reminder_sent: true })
                .eq('id', order.id);

            if (result.success) {
                reminded++;
                console.log(`AU quiz reminder sent to ${email}`);
            } else {
                console.error(`AU quiz reminder failed for ${email}:`, result.error);
            }
        }

        return NextResponse.json({
            success: true,
            processed: orders.length,
            reminded,
            skipped,
        });

    } catch (error) {
        console.error('AU quiz reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
