import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { getEditEntitlement, isEditPipelineStalled, type EditSubscriptionRow } from '@/lib/manEditIssues';
import type { ReportData } from '@/lib/manReportGenerator';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
  const status = request.nextUrl.searchParams.get('status')?.trim() ?? '';

  let query = supabaseAdmin
    .from('man_edit_subscriptions')
    .select('id, customer_email, customer_name, customer_phone, status, report_id, razorpay_payment_id, next_billing_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) query = query.ilike('customer_email', `%${search}%`);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Entitlement is only meaningful for paying subscribers; pending rows are
  // abandoned second checkouts and never owe an issue.
  const subscriptions = await Promise.all((data ?? []).map(async row => {
    if (row.status !== 'active') return { ...row, entitlement: null };
    const entitlement = await getEditEntitlement(row as EditSubscriptionRow);

    const issueIds = entitlement.issues.map(issue => issue.id);
    const { data: titles } = issueIds.length
      ? await supabaseAdmin.from('man_reports').select('id, report_data').in('id', issueIds)
      : { data: [] };
    const titleById = new Map((titles ?? []).map(item => [
      item.id as string,
      (item.report_data as ReportData | null)?.edit,
    ]));

    return {
      ...row,
      entitlement: {
        blueprint: entitlement.blueprint
          ? { id: entitlement.blueprint.id, share_token: entitlement.blueprint.share_token, sent_at: entitlement.blueprint.sent_at }
          : null,
        paidCharges: entitlement.paidCharges,
        owed: entitlement.owed,
        nextIssueNumber: entitlement.nextIssueNumber,
        blockedReason: entitlement.blockedReason,
        issues: entitlement.issues.map(issue => ({
          ...issue,
          stalled: isEditPipelineStalled(issue),
          title: titleById.get(issue.id)?.title ?? null,
          periodLabel: titleById.get(issue.id)?.periodLabel ?? null,
        })),
      },
    };
  }));

  return NextResponse.json({ subscriptions });
}
