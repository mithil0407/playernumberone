import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  generateStylistBlueprintReplacementPalette,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPalettePage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
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
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id, section_approvals, progress_stage')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.progress_stage) {
    return NextResponse.json(
      { error: 'Report generation already in progress', progressStage: report.progress_stage },
      { status: 409 },
    );
  }

  if (!isVersionedStylistBlueprintReportData(report.report_data)) {
    return NextResponse.json({ error: 'A v1 Blueprint report is required to regenerate palette' }, { status: 400 });
  }

  try {
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('stylist_intake_responses')
      .select('*')
      .eq('id', report.submission_id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const resolvedSubmission = await resolveConsultationIntakePhotos(submission as StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null });

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        progress_stage: 'regenerating_colour_palette',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    const reportData = report.report_data as StylistBlueprintReportData;
    const nextReportData = await generateStylistBlueprintReplacementPalette(
      resolvedSubmission,
      reportData,
      reason,
    );

    const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
    const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
    const nextApprovals = {
      ...((report.section_approvals as Record<string, boolean> | null) ?? {}),
      [`p${getStylistBlueprintPalettePage(reportData)}`]: false,
      ...Object.fromEntries(
        Array.from({ length: outfitEnd - outfitStart + 1 }, (_, index) => [`p${outfitStart + index}`, false]),
      ),
    };

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        report_data: nextReportData,
        section_approvals: nextApprovals,
        status: 'in_review',
        published_at: null,
        delivered_at: null,
        progress_stage: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select('id, status, progress_stage, error_message, report_data, image_urls, section_approvals, updated_at')
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || 'Failed to save regenerated palette');
    }

    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);
    return NextResponse.json({ success: true, report: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Palette regeneration failed';
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        progress_stage: null,
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
