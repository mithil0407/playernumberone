import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  getCompletedStylistBlueprintTextActs,
  getNextStylistBlueprintTextProgressStage,
} from '@/lib/stylistBlueprintTextPipeline';
import { enqueueStylistReportGeneration, runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';
import {
  isVersionedStylistBlueprintReportData,
  validateStylistBlueprintReport,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';

export const maxDuration = 300;

const STALE_MS = 10 * 60 * 1000;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, progress_stage, report_data, submission_id, updated_at, share_token')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = isVersionedStylistBlueprintReportData(report.report_data)
    ? report.report_data as StylistBlueprintReportData
    : null;
  const completedActs = getCompletedStylistBlueprintTextActs(reportData);
  const nextStage = getNextStylistBlueprintTextProgressStage(reportData);
  const ageMs = report.updated_at
    ? Date.now() - new Date(report.updated_at).getTime()
    : Infinity;

  if ((report.status === 'generating' || report.progress_stage) && ageMs < STALE_MS) {
    return NextResponse.json({
      status: 'already_running',
      reportId,
      progressStage: report.progress_stage ?? nextStage ?? 'classifying',
      resumed: true,
      completedActs,
    });
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('*')
    .eq('id', report.submission_id)
    .single();

  if (submissionError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (!nextStage && reportData) {
    try {
      validateStylistBlueprintReport(reportData);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Report validation failed' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        status: 'draft_ready',
        progress_stage: null,
        error_message: null,
        generated_at: now,
        updated_at: now,
      })
      .eq('id', reportId);
    if (error) return NextResponse.json({ error: 'Could not finish report recovery' }, { status: 500 });
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      status: 'completed',
      reportId,
      progressStage: null,
      resumed: true,
      completedActs,
    });
  }

  const { data: lease, error: leaseError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({
      status: 'generating',
      progress_stage: nextStage ?? 'classifying',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('updated_at', report.updated_at)
    .select('id')
    .maybeSingle();

  if (leaseError) {
    return NextResponse.json({ error: leaseError.message }, { status: 500 });
  }
  if (!lease) return NextResponse.json({ error: 'The report changed. Reload before resuming.' }, { status: 409 });

  await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

  try {
    await enqueueStylistReportGeneration({ reportId, submission: submission as StylistIntakeSubmission });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not queue generation';
    await supabaseAdmin.from('stylist_blueprint_reports').update({ status: 'error', progress_stage: null, error_message: message }).eq('id', reportId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  after(async () => { await runClaimedStylistWorkspaceJobs(1); });

  return NextResponse.json({
    status: 'started',
    reportId,
    progressStage: nextStage ?? 'classifying',
    resumed: true,
    completedActs,
  });
}
