import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  generateStylistBlueprintReplacementOutfit,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import {
  regenerateStylistBlueprintImageSlot,
  type StylistBlueprintImageSlotKey,
} from '@/lib/stylistBlueprintImageGenerator';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const pageNumber = Number(body.pageNumber);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, image_urls, share_token, submission_id, section_approvals, status, progress_stage')
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
    return NextResponse.json({ error: 'A v1 Blueprint report is required to replace outfits' }, { status: 400 });
  }

  const reportData = report.report_data as StylistBlueprintReportData;
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (!Number.isInteger(pageNumber) || pageNumber < outfitStart || pageNumber > outfitEnd) {
    return NextResponse.json({ error: 'Invalid outfit page number' }, { status: 400 });
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

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        progress_stage: `regenerating_outfit_text_p${pageNumber}`,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    const replacementPage = await generateStylistBlueprintReplacementOutfit(
      submission as StylistIntakeSubmission,
      reportData,
      pageNumber,
      reason,
    );

    const nextReportData: StylistBlueprintReportData = {
      ...reportData,
      generated_at: new Date().toISOString(),
      pages: reportData.pages.map(page => page.page_number === pageNumber ? replacementPage : page),
    };
    const nextApprovals = {
      ...((report.section_approvals as Record<string, boolean> | null) ?? {}),
      [`p${pageNumber}`]: false,
    };

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        report_data: nextReportData,
        section_approvals: nextApprovals,
        progress_stage: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    const imageSlot = `application.outfitFlatlays.${pageNumber - outfitStart}` as StylistBlueprintImageSlotKey;
    const imageResult = await regenerateStylistBlueprintImageSlot(
      reportId,
      nextReportData,
      imageSlot,
      { shareToken: report.share_token ?? null, submission: submission as StylistIntakeSubmission },
    );

    const { data: freshReport } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, error_message, report_data, image_urls, section_approvals, updated_at')
      .eq('id', reportId)
      .single();

    return NextResponse.json({
      success: true,
      page: replacementPage,
      report: freshReport,
      imageUrls: imageResult.imageUrls,
      imageUrl: imageResult.imageUrl,
      slotKey: imageSlot,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outfit replacement failed';
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
