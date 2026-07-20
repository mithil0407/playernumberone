import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { runStylistBlueprintRepairPipeline } from '@/lib/stylistBlueprintTextPipeline';
import { generateStylistBlueprintImages } from '@/lib/stylistBlueprintImageGenerator';
import { isVersionedStylistBlueprintReportData, type StylistIntakeSubmission } from '@/lib/stylistBlueprintGenerator';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (body.mode && body.mode !== 'rebalance') {
    return NextResponse.json({ error: 'Unsupported repair mode' }, { status: 400 });
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id, section_approvals, progress_stage')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.progress_stage) {
    return NextResponse.json(
      { error: 'Report generation already in progress', progressStage: report.progress_stage },
      { status: 409 },
    );
  }

  if (!isVersionedStylistBlueprintReportData(report.report_data)) {
    return NextResponse.json({ error: 'A v1 Blueprint report is required for repair' }, { status: 400 });
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

  const repaired = await runStylistBlueprintRepairPipeline(
    reportId,
    resolvedSubmission,
    report.share_token ?? null,
    report.report_data,
    report.section_approvals as Record<string, unknown> | null,
  );

  if (!repaired) {
    return NextResponse.json({ error: 'Blueprint repair failed' }, { status: 500 });
  }

  const imageGroups = ['capsule_1', 'capsule_2', 'capsule_3', 'capsule_4'] as const;
  try {
    for (const group of imageGroups) {
      await generateStylistBlueprintImages(reportId, repaired, report.share_token ?? null, {
        group,
        force: true,
        submission: resolvedSubmission,
      });
    }
    return NextResponse.json({ success: true, reportData: repaired, imagesRegenerated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Outfit image regeneration failed';
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        status: 'draft_ready',
        progress_stage: null,
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    return NextResponse.json({
      success: true,
      reportData: repaired,
      imagesRegenerated: false,
      imageError: message,
    });
  }
}
