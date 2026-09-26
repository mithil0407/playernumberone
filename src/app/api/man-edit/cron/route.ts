// GET /api/man-edit/cron?key=CRON_SECRET — daily sweep, run by freecronjob.
//
// Backstop for the payment webhook: starts a draft for every active subscriber
// who has paid for more issues than they've received, and restarts drafts
// whose pipeline died. Drafts only — nothing is sent without stylist review.
// Idempotent: issue numbers are unique per subscription, and a subscriber
// with an unsent draft never gets a second one.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createEditIssueDraft,
  getEditEntitlement,
  isEditPipelineStalled,
  runEditIssuePipeline,
  type EditSubscriptionRow,
} from '@/lib/manEditIssues';

export const maxDuration = 300;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`
    || request.nextUrl.searchParams.get('key') === secret;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 });
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: subscriptions, error } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .select('id, customer_email, customer_name, customer_phone, status, report_id, razorpay_payment_id, created_at')
    .eq('status', 'active');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const started: string[] = [];
  const resumed: string[] = [];
  const skipped: Array<{ subscription: string; reason: string }> = [];

  for (const sub of (subscriptions ?? []) as EditSubscriptionRow[]) {
    const entitlement = await getEditEntitlement(sub);
    const open = entitlement.issues.find(issue => issue.status !== 'sent');

    if (open) {
      if (isEditPipelineStalled(open)) resumed.push(open.id);
      continue;
    }
    if (entitlement.blockedReason || entitlement.owed <= 0) {
      if (entitlement.blockedReason) skipped.push({ subscription: sub.id, reason: entitlement.blockedReason });
      continue;
    }

    const result = await createEditIssueDraft(sub.id);
    if (result.ok && result.created) started.push(result.reportId);
    else if (!result.ok) skipped.push({ subscription: sub.id, reason: result.reason });
  }

  // Pipelines outlive the response: free schedulers time out long before six
  // outfit renders finish. They run side by side because the whole batch
  // shares one function lifetime; anything cut off resumes on the next sweep.
  const toRun = [...started, ...resumed];
  if (toRun.length) {
    after(async () => {
      await Promise.allSettled(toRun.map(reportId => runEditIssuePipeline(reportId)));
    });
  }

  return NextResponse.json({ started, resumed, skipped });
}
