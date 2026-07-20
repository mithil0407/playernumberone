import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  getCompletedStylistBlueprintTextActs,
  getNextStylistBlueprintTextProgressStage,
  runStylistBlueprintTextPipeline,
} from '@/lib/stylistBlueprintTextPipeline';
import {
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';

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
  const resolvedSubmission = await resolveConsultationIntakePhotos(submission as StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null });

  if (!nextStage && reportData) {
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        status: 'draft_ready',
        progress_stage: null,
        error_message: null,
        generated_at: now,
        updated_at: now,
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      status: 'completed',
      reportId,
      progressStage: null,
      resumed: true,
      completedActs,
    });
  }

  const { error: leaseError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({
      status: 'generating',
      progress_stage: nextStage ?? 'classifying',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (leaseError) {
    return NextResponse.json({ error: leaseError.message }, { status: 500 });
  }

  await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

  after(async () => {
    await runStylistBlueprintTextPipeline(
      reportId,
      resolvedSubmission,
      report.share_token ?? null,
      reportData,
    );
  });

  return NextResponse.json({
    status: 'started',
    reportId,
    progressStage: nextStage ?? 'classifying',
    resumed: true,
    completedActs,
  });
}
