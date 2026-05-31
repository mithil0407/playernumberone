import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { sendStyleEditIssueEmail } from '@/lib/email';
import { logStyleEditEvent } from '@/lib/styleEditProfile';
import type { StyleEditPageData } from '@/lib/styleEditTypes';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { issueId } = await params;
  const { data: issue, error } = await supabaseAdmin
    .from('style_edit_issues')
    .select('*, style_edit_client_profiles(customer_email, customer_name)')
    .eq('id', issueId)
    .single();

  if (error || !issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  if (!['approved', 'scheduled', 'sent'].includes(issue.status)) {
    return NextResponse.json({ error: 'Issue must be approved before send' }, { status: 400 });
  }
  if (!issue.page_data) {
    return NextResponse.json({ error: 'Issue page data not found' }, { status: 400 });
  }

  const profile = Array.isArray(issue.style_edit_client_profiles)
    ? issue.style_edit_client_profiles[0]
    : issue.style_edit_client_profiles;
  const pageData = issue.page_data as StyleEditPageData;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const issueUrl = `${origin.replace(/\/$/, '')}/stylist/edit/${issue.share_token}`;

  await supabaseAdmin
    .from('style_edit_issues')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', issueId);

  const result = await sendStyleEditIssueEmail({
    customer_name: profile?.customer_name || pageData.clientName || profile?.customer_email || 'there',
    customer_email: profile?.customer_email,
    issue_url: issueUrl,
    issue_title: pageData.issueTitle,
    subtitle: pageData.subtitle,
    week_label: pageData.weekLabel,
  });

  if (!result.success) {
    await supabaseAdmin
      .from('style_edit_issues')
      .update({ status: 'error', error_message: result.error, updated_at: new Date().toISOString() })
      .eq('id', issueId);
    await logStyleEditEvent({ issueId, profileId: issue.profile_id, subscriptionId: issue.subscription_id, eventType: 'send_failed', status: 'error', message: result.error });
    return NextResponse.json({ error: result.error || 'Email send failed' }, { status: 500 });
  }

  const sentAt = new Date().toISOString();
  await supabaseAdmin
    .from('style_edit_issues')
    .update({ status: 'sent', sent_at: sentAt, error_message: null, updated_at: sentAt })
    .eq('id', issueId);
  await logStyleEditEvent({
    issueId,
    profileId: issue.profile_id,
    subscriptionId: issue.subscription_id,
    eventType: 'issue_sent',
    status: 'sent',
    metadata: { messageId: result.messageId, issueUrl },
  });

  return NextResponse.json({ success: true, sent_at: sentAt, issueUrl });
}
