import { after, NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity || !(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: report } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, submission_id, stylist_intake_responses(consultation_id)')
    .eq('id', reportId)
    .single();
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const relation = Array.isArray(report.stylist_intake_responses)
    ? report.stylist_intake_responses[0]
    : report.stylist_intake_responses;
  const consultationId = relation?.consultation_id ?? null;

  const { data: failedJob } = await supabaseAdmin
    .from('stylist_report_jobs')
    .select('id')
    .eq('report_id', reportId)
    .in('status', ['failed', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!failedJob) return NextResponse.json({ error: 'No failed durable job is available to retry' }, { status: 409 });

  const now = new Date().toISOString();
  const { error: retryError } = await supabaseAdmin
    .from('stylist_report_jobs')
    .update({
      status: 'queued',
      attempt_count: 0,
      max_attempts: 4,
      next_run_at: now,
      locked_at: null,
      heartbeat_at: null,
      last_error: null,
      updated_at: now,
    })
    .eq('id', failedJob.id);
  if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 });

  await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({ status: 'generating', progress_stage: 'queued', error_message: null, updated_at: now })
    .eq('id', reportId);
  if (consultationId) {
    await supabaseAdmin
      .from('consultations')
      .update({ status: 'in_progress', updated_at: now })
      .eq('id', consultationId)
      .eq('stylist_id', identity.stylistId);
  }
  await logStylistReportActivity({
    action: 'generation_manual_retry', reportId, consultationId, stylistId: identity.stylistId,
  });
  after(async () => {
    try { await runClaimedStylistWorkspaceJobs(1); } catch (error) { console.error('[stylist-workspace] retry dispatch failed', error); }
  });
  return NextResponse.json({ success: true, status: 'generating', progressStage: 'queued' });
}
