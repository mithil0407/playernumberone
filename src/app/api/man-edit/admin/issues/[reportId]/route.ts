// POST   /api/man-edit/admin/issues/[reportId] — resume a stalled or partly
//        rendered draft (writes missing text, renders missing outfit photos).
// DELETE /api/man-edit/admin/issues/[reportId] — discard an unsent draft so the
//        issue can be written again from scratch.

import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { isEditPipelineStalled, runEditIssuePipeline } from '@/lib/manEditIssues';

export const maxDuration = 300;

async function isAdmin() {
  const cookieStore = await cookies();
  return isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value);
}

async function loadIssue(reportId: string) {
  const { data } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, progress_stage, updated_at, share_token')
    .eq('id', reportId)
    .eq('report_kind', 'edit')
    .maybeSingle();
  return data;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportId } = await params;
  const issue = await loadIssue(reportId);
  if (!issue) return NextResponse.json({ error: 'Edit issue not found' }, { status: 404 });
  if (issue.status === 'sent') return NextResponse.json({ error: 'This issue has already been sent' }, { status: 409 });

  const running = Boolean(issue.progress_stage) && !isEditPipelineStalled(issue);
  if (running) return NextResponse.json({ status: 'already_running', progressStage: issue.progress_stage });

  await supabaseAdmin
    .from('man_reports')
    .update({ progress_stage: 'resuming', error_message: null, updated_at: new Date().toISOString() })
    .eq('id', reportId);
  await revalidateManReportCache(reportId, issue.share_token ?? null);

  after(() => runEditIssuePipeline(reportId));
  return NextResponse.json({ status: 'started' });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportId } = await params;
  const issue = await loadIssue(reportId);
  if (!issue) return NextResponse.json({ error: 'Edit issue not found' }, { status: 404 });
  if (issue.status === 'sent') return NextResponse.json({ error: 'A sent issue cannot be discarded' }, { status: 409 });

  const { error } = await supabaseAdmin.from('man_reports').delete().eq('id', reportId).eq('report_kind', 'edit');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await revalidateManReportCache(reportId, issue.share_token ?? null);

  return NextResponse.json({ deleted: true });
}
