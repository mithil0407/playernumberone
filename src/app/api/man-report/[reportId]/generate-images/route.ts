// POST /api/man-report/[reportId]/generate-images
//
// Triggers image generation for a report that already has text.
// Safe to call repeatedly — resumes from wherever it left off:
//   • Skips hairstyle/eyewear if already in image_urls
//   • Skips outfit slots that already have a stored path
//   • Clears stale progress_stage if updated_at is >10 min old (pipeline died)
//
// Runs via Next.js after() so it returns immediately.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import {
  generateHairstyleImages,
  generateEyewearImages,
  generateAllOutfitImages,
  getStoredManReportImagePaths,
  mergeManReportImagePathsForReport,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import type { ClassificationResult, ReportData } from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import { revalidateManReportCache } from '@/lib/manReportCache';

const ALLOWED_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
const STALE_MS = 10 * 60 * 1000; // 10 minutes — if pipeline hasn't written in this long, it's dead

async function runImagePipeline(
  reportId:       string,
  shareToken:     string | null,
  submission:     ManIntakeSubmission,
  classification: ClassificationResult,
  sections:       ReportData['sections'],
  imageModel:     string,
  existingImageUrls: ManReportImagePaths | null,
) {
  try {
    const latestImageUrls = (await getStoredManReportImagePaths(reportId)) ?? existingImageUrls ?? null;

    // ── Hairstyle + eyewear ───────────────────────────────────────────────────
    // Skip if already generated
    let hairstylePaths = latestImageUrls?.hairstyleCards ?? [];
    let eyewearPaths   = latestImageUrls?.eyewearCards   ?? [];

    const needsHeadshots = hairstylePaths.every(p => !p) || eyewearPaths.every(p => !p);

    if (needsHeadshots) {
      await supabaseAdmin
        .from('man_reports')
        .update({ progress_stage: 'generating_base_model', error_message: null, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, shareToken);

      [hairstylePaths, eyewearPaths] = await Promise.all([
        generateHairstyleImages(reportId, submission, classification, imageModel),
        generateEyewearImages(reportId, submission, classification, imageModel),
      ]);

      // Persist immediately before starting outfit images
      await mergeManReportImagePathsForReport(
        reportId,
        { hairstyleCards: hairstylePaths, eyewearCards: eyewearPaths },
        { progress_stage: 'generating_outfit_images' },
      );
    } else {
      // Headshots already done — jump straight to outfit images
      await supabaseAdmin
        .from('man_reports')
        .update({ progress_stage: 'generating_outfit_images', error_message: null, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, shareToken);
    }

    // ── Outfit images (resume from existing partial paths) ────────────────────
    const fullBodyUrl = submission.photo_fullbody_url;
    if (!fullBodyUrl) throw new Error('No photo_fullbody_url on submission — cannot generate outfit images');

    const currentBeforeOutfits = await getStoredManReportImagePaths(reportId);
    const existingOutfitPaths = currentBeforeOutfits?.outfitCards ?? [];
    hairstylePaths = currentBeforeOutfits?.hairstyleCards ?? hairstylePaths;
    eyewearPaths = currentBeforeOutfits?.eyewearCards ?? eyewearPaths;

    const outfitPaths = await generateAllOutfitImages(
      reportId, fullBodyUrl, classification, sections,
      hairstylePaths, eyewearPaths, imageModel,
      existingOutfitPaths,
    );

    // ── Done ──────────────────────────────────────────────────────────────────
    const mergedImagePaths = await mergeManReportImagePathsForReport(
      reportId,
      { hairstyleCards: hairstylePaths, eyewearCards: eyewearPaths, outfitCards: outfitPaths },
      { progress_stage: null, error_message: null },
    );

    const doneOutfits = mergedImagePaths.outfitCards.filter(Boolean).length;
    console.log(`[generate-images] Done for ${reportId} — ${mergedImagePaths.hairstyleCards.filter(Boolean).length}/2 hairstyles, ${mergedImagePaths.eyewearCards.filter(Boolean).length}/2 eyewear, ${doneOutfits}/${mergedImagePaths.outfitCards.length} outfits`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[generate-images] Pipeline failed for ${reportId}:`, message);
    await supabaseAdmin
      .from('man_reports')
      .update({
        progress_stage: null,
        error_message:  `Image generation failed: ${message}`,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, shareToken);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const imageModel = ALLOWED_IMAGE_MODELS.includes(body?.imageModel)
    ? body.imageModel
    : 'gemini-3.1-flash-image-preview';

  const { data: report, error: reportErr } = await supabaseAdmin
    .from('man_reports')
    .select('status, progress_stage, report_data, submission_id, image_urls, updated_at, share_token')
    .eq('id', reportId)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (!report.report_data) {
    return NextResponse.json({ error: 'Report has no text yet — run text generation first' }, { status: 400 });
  }

  // If progress_stage is set, only block if it's genuinely recent (pipeline alive).
  // If it's stale (>10 min since last DB write), the pipeline died — auto-clear and proceed.
  if (report.progress_stage) {
    const ageMs = report.updated_at
      ? Date.now() - new Date(report.updated_at).getTime()
      : Infinity;

    if (ageMs < STALE_MS) {
      return NextResponse.json(
        { error: 'Image generation already in progress', progress_stage: report.progress_stage },
        { status: 409 }
      );
    }

    console.log(`[generate-images] Stale progress_stage "${report.progress_stage}" detected (${Math.round(ageMs / 60000)}m old) — clearing and restarting`);
    await supabaseAdmin
      .from('man_reports')
      .update({ progress_stage: null, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);
  }

  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('*')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const reportData       = report.report_data as ReportData;
  const existingImageUrls = report.image_urls as ManReportImagePaths | null;

  const initialProgressStage = 'generating_images';

  await supabaseAdmin
    .from('man_reports')
    .update({
      progress_stage: initialProgressStage,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  await revalidateManReportCache(reportId, report.share_token ?? null);

  after(async () => {
    await runImagePipeline(
      reportId,
      report.share_token ?? null,
      submission as ManIntakeSubmission,
      reportData.classification,
      reportData.sections,
      imageModel,
      existingImageUrls,
    );
  });

  return NextResponse.json({ status: 'generating_images', progressStage: initialProgressStage });
}
