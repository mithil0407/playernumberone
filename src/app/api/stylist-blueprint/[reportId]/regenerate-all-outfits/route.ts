import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  generateStylistBlueprintReplacementOutfits,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import {
  regenerateStylistBlueprintImageSlot,
  type StylistBlueprintImageSlotKey,
  type StylistBlueprintImagePaths,
} from '@/lib/stylistBlueprintImageGenerator';

export const maxDuration = 300;

function clearOutfitImageSlots(paths: StylistBlueprintImagePaths | null | undefined, outfitCount: number): StylistBlueprintImagePaths {
  return {
    ...(paths ?? {}),
    application: {
      ...(paths?.application ?? {}),
      capsuleCovers: [null, null, null, null],
      outfitFlatlays: Array.from({ length: outfitCount }, () => null),
      outfitDetails: Array.from({ length: outfitCount }, () => null),
    },
  };
}

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
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, image_urls, share_token, submission_id, section_approvals, progress_stage')
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
    return NextResponse.json({ error: 'A v1 Blueprint report is required to replace all outfits' }, { status: 400 });
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
        progress_stage: 'regenerating_all_outfit_text',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    const reportData = report.report_data as StylistBlueprintReportData;
    const replacementPages = await generateStylistBlueprintReplacementOutfits(
      submission as StylistIntakeSubmission,
      reportData,
      reason,
    );
    const replacementByNumber = new Map(replacementPages.map(page => [page.page_number, page]));
    const outfitStart = getStylistBlueprintOutfitStartPage();
    const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
    const outfitCount = getStylistBlueprintOutfitCount(reportData);

    const nextReportData: StylistBlueprintReportData = {
      ...reportData,
      generated_at: new Date().toISOString(),
      pages: reportData.pages.map(page => replacementByNumber.get(page.page_number) ?? page),
    };
    const nextApprovals = {
      ...((report.section_approvals as Record<string, boolean> | null) ?? {}),
      p13: false,
      ...Object.fromEntries(
        Array.from({ length: outfitEnd - outfitStart + 1 }, (_, index) => [`p${outfitStart + index}`, false]),
      ),
    };
    const clearedImagePaths = clearOutfitImageSlots(report.image_urls as StylistBlueprintImagePaths | null, outfitCount);

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        report_data: nextReportData,
        image_urls: clearedImagePaths,
        section_approvals: nextApprovals,
        progress_stage: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

    let imageUrls: unknown = null;
    for (let index = 0; index < outfitCount; index++) {
      const slotKey = `application.outfitFlatlays.${index}` as StylistBlueprintImageSlotKey;
      const result = await regenerateStylistBlueprintImageSlot(
        reportId,
        nextReportData,
        slotKey,
        {
          shareToken: report.share_token ?? null,
          submission: submission as StylistIntakeSubmission,
          progressStage: `regenerating_all_outfit_image_${index + 1}_of_${outfitCount}`,
        },
      );
      imageUrls = result.imageUrls;
    }

    const { data: freshReport } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, error_message, report_data, image_urls, section_approvals, updated_at')
      .eq('id', reportId)
      .single();

    return NextResponse.json({
      success: true,
      report: freshReport,
      imageUrls,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'All outfit replacement failed';
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
