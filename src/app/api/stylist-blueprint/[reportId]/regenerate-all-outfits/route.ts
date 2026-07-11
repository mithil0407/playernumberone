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
  getStylistBlueprintOutfitSystemPage,
  getStylistOutfitCulturalMode,
  isVersionedStylistBlueprintReportData,
  validateStylistBlueprintReport,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import {
  type StylistBlueprintImagePaths,
} from '@/lib/stylistBlueprintImageGenerator';
import {
  generateStylistOutfitScienceApplication,
  isScienceBlueprintReport,
  isStylistOutfitScienceHarnessEnabled,
} from '@/lib/stylistOutfitScience';

export const maxDuration = 300;

// A live regeneration touches updated_at as it persists each step. If progress_stage
// is set but updated_at is older than this, a previous run almost certainly died
// (e.g. a serverless timeout, which skips the catch block and leaves progress_stage
// stuck). In that case we let a new request recover instead of returning 409 forever.
const STALE_PROGRESS_MS = 6 * 60 * 1000;

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
    .select('id, report_data, image_urls, share_token, submission_id, section_approvals, progress_stage, updated_at')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.progress_stage) {
    const updatedAtMs = report.updated_at ? new Date(report.updated_at).getTime() : 0;
    const isStale = Date.now() - updatedAtMs > STALE_PROGRESS_MS;
    if (!isStale) {
      return NextResponse.json(
        { error: 'Report generation already in progress', progressStage: report.progress_stage },
        { status: 409 },
      );
    }
    // Otherwise the previous run is stale/dead — fall through and recover.
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
    const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
    const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
    const outfitCount = getStylistBlueprintOutfitCount(reportData);
    const culturalMode = getStylistOutfitCulturalMode(submission as StylistIntakeSubmission);
    let nextReportData: StylistBlueprintReportData | null = null;
    let lastValidationError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const scienceEnabled = isScienceBlueprintReport(reportData) || isStylistOutfitScienceHarnessEnabled();
      const scienceResult = scienceEnabled
        ? await generateStylistOutfitScienceApplication(submission as StylistIntakeSubmission, reportData)
        : null;
      const replacementPages = scienceResult?.pages ?? await generateStylistBlueprintReplacementOutfits(
        submission as StylistIntakeSubmission,
        reportData,
        attempt === 0 ? reason : `${reason || 'Admin requested replacement outfits.'}\n\nPrevious validation failed: ${lastValidationError instanceof Error ? lastValidationError.message : String(lastValidationError)}. Regenerate the outfit set and fix that issue.`,
      );
      const replacementByNumber = new Map(replacementPages.map(page => [page.page_number, page]));
      const candidateReportData: StylistBlueprintReportData = {
        ...reportData,
        generated_at: new Date().toISOString(),
        pages: reportData.pages.map(page => replacementByNumber.get(page.page_number) ?? page),
        outfit_engine: scienceResult?.outfit_engine ?? reportData.outfit_engine,
      };
      try {
        validateStylistBlueprintReport(candidateReportData, {
          culturalMode,
          validateStaticPageDensity: false,
        });
        nextReportData = candidateReportData;
        break;
      } catch (error) {
        lastValidationError = error;
      }
    }
    if (!nextReportData) throw lastValidationError instanceof Error ? lastValidationError : new Error('Replacement outfits failed validation');
    const nextApprovals = {
      ...((report.section_approvals as Record<string, boolean> | null) ?? {}),
      [`p${getStylistBlueprintOutfitSystemPage(reportData)}`]: false,
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

    // Image generation is intentionally NOT done here: regenerating all 20 outfit
    // images in one request blows past maxDuration and gets killed mid-loop (leaving
    // half the images missing and progress_stage stuck). The client drives image
    // generation afterwards, one capsule group at a time, via /generate-images —
    // that path is resumable and each group fits comfortably within maxDuration.
    const { data: freshReport } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, error_message, report_data, image_urls, section_approvals, updated_at')
      .eq('id', reportId)
      .single();

    return NextResponse.json({
      success: true,
      report: freshReport,
      imageUrls: freshReport?.image_urls ?? clearedImagePaths,
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
