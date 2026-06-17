import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  currentMonthStart,
  generateManEditMonthlyDraft,
  loadManEditReportContext,
  rebuildManEditProfile,
} from '@/lib/manEdit';

export const maxDuration = 300;

async function generateForSubscription(subscription: Record<string, unknown>, monthStart: string) {
  const reportId = typeof subscription.report_id === 'string' ? subscription.report_id : '';
  if (!reportId) throw new Error('No report linked yet');

  const { data: report } = await supabaseAdmin
    .from('man_reports')
    .select('share_token')
    .eq('id', reportId)
    .maybeSingle();

  if (!report?.share_token) throw new Error('Report share token not found');

  const context = await loadManEditReportContext(report.share_token, true);
  if (!context?.subscription) throw new Error('Active subscription context not found');

  await rebuildManEditProfile(context);

  const { count } = await supabaseAdmin
    .from('man_edit_monthly_recommendations')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_id', subscription.id);
  const issueNumber = (count ?? 0) + 1;
  const pageData = await generateManEditMonthlyDraft(context, issueNumber);

  const { data, error } = await supabaseAdmin
    .from('man_edit_monthly_recommendations')
    .upsert({
      report_id: context.report.id,
      subscription_id: context.subscription.id,
      customer_email: context.subscription.customer_email,
      month_start: monthStart,
      issue_number: issueNumber,
      status: 'draft_ready',
      page_data: pageData,
      error_message: null,
    }, { onConflict: 'subscription_id,month_start' })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message || 'Monthly recommendation save failed');
  return data.id as string;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const monthStart = typeof body.month_start === 'string' ? body.month_start : currentMonthStart();
  const subscriptionId = typeof body.subscription_id === 'string' ? body.subscription_id : '';

  let query = supabaseAdmin
    .from('man_edit_subscriptions')
    .select('*')
    .eq('status', 'active')
    .not('report_id', 'is', null)
    .limit(100);

  if (subscriptionId) query = query.eq('id', subscriptionId);

  const { data: subscriptions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const runNow = body.generate !== false;
  const created: string[] = [];
  const skipped: Array<{ subscriptionId: string; reason: string }> = [];

  const run = async () => {
    for (const subscription of subscriptions ?? []) {
      try {
        const id = await generateForSubscription(subscription as Record<string, unknown>, monthStart);
        created.push(id);
      } catch (err) {
        skipped.push({
          subscriptionId: String(subscription.id),
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  };

  if (runNow) {
    await run();
  } else {
    after(run);
  }

  return NextResponse.json({ monthStart, created, skipped });
}
