import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { loadStyleEditIssueById } from '@/lib/styleEditLoader';
import { logStyleEditEvent } from '@/lib/styleEditProfile';

function authed(cookieValue: string | undefined) {
  return isAdminAuthenticatedFromCookieValue(cookieValue);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { issueId } = await params;
  const issue = await loadStyleEditIssueById(issueId);
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  return NextResponse.json({ issue });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { issueId } = await params;
  const body = await request.json();
  const allowedStatuses = new Set(['pending_profile', 'topic_ready', 'generating', 'draft_ready', 'in_review', 'approved', 'scheduled', 'sending', 'sent', 'error', 'skipped']);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) {
    if (!allowedStatuses.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    patch.status = body.status;
    if (body.status === 'approved') patch.approved_at = new Date().toISOString();
    if (body.status === 'sent') patch.sent_at = new Date().toISOString();
  }
  if (body.topic_plan) patch.topic_plan = body.topic_plan;
  if (body.page_data) patch.page_data = body.page_data;
  if (body.approval_state) patch.approval_state = body.approval_state;
  if (body.scheduled_for !== undefined) patch.scheduled_for = body.scheduled_for || null;
  if (body.error_message !== undefined) patch.error_message = body.error_message;

  const { data, error } = await supabaseAdmin
    .from('style_edit_issues')
    .update(patch)
    .eq('id', issueId)
    .select('id, profile_id, subscription_id, status')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }

  await logStyleEditEvent({
    issueId,
    profileId: data.profile_id,
    subscriptionId: data.subscription_id,
    eventType: 'issue_updated',
    status: data.status,
    metadata: { patchKeys: Object.keys(patch) },
  });

  const issue = await loadStyleEditIssueById(issueId);
  return NextResponse.json({ issue });
}
