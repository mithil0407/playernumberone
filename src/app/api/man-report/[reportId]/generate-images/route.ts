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
  regenerateMissingFaceSlots,
  generateAllOutfitImages,
  generateComboGridImages,
  generateManBlueprintV2Images,
  getStoredManReportImagePaths,
  mergeManReportImagePathsForReport,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import { buildManBlueprintV2StructuredData, generateSection4AtQualityFloor, MAN_BLUEPRINT_V2_VERSION, type ClassificationResult, type ReportData } from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { withManReportSection4Qa } from '@/lib/manReportQa';
import { normaliseSequentialManOutfitNumbers } from '@/lib/manOutfitSection';

const ALLOWED_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
const STALE_MS = 10 * 60 * 1000; // 10 minutes — if pipeline hasn't written in this long, it's dead
const INITIAL_PROGRESS_STAGE = 'generating_images';
const REPAIR_PROGRESS_STAGE = 'repairing_section4';

export const maxDuration = 300;

function missingPhotoError(submission: Pick<ManIntakeSubmission, 'photo_fullbody_url' | 'photo_headshot_url'>) {
  const missing = [
    submission.photo_fullbody_url ? null : 'full body photo',
    submission.photo_headshot_url ? null : 'headshot photo',
  ].filter(Boolean);

  return missing.length ? `Cannot generate images until ${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} uploaded.` : null;
}

function getImageCounts(paths: ManReportImagePaths | null | undefined) {
  return {
    hairstyleDone: paths?.hairstyleCards?.[0] ? 1 : 0,
    beardDone:     paths?.beardCards?.[0] ? 1 : 0,
    eyewearDone:   paths?.eyewearCards?.[0] ? 1 : 0,
    outfitDone:    (paths?.outfitCards    ?? []).filter(Boolean).length,
    comboGridDone: Object.values(paths?.comboGridCards ?? {}).filter(Boolean).length,
    diagnosticDone: Object.values(paths?.diagnostic ?? {}).filter(Boolean).length,
    deliverableDone: [
      paths?.deliverables?.beforeImage,
      paths?.deliverables?.afterImage,
      paths?.deliverables?.linkedinHeadshot,
      ...(paths?.deliverables?.datingProfileShots ?? []),
    ].filter(Boolean).length,
  };
}

function getMissingImageSummary(paths: ManReportImagePaths, expectedOutfitCount: number, requireV2Assets: boolean): string | null {
  const missingHairstyle = paths.hairstyleCards?.[0] ? 0 : 1;
  const missingBeard = paths.beardCards?.[0] ? 0 : 1;
  const missingEyewear = paths.eyewearCards?.[0] ? 0 : 1;
  const missingOutfits   = Math.max(0, expectedOutfitCount - paths.outfitCards.filter(Boolean).length);
  const missingComboGrids = Math.max(0, 3 - Object.values(paths.comboGridCards ?? {}).filter(Boolean).length);
  const missingDiagnostics = requireV2Assets ? Math.max(0, 3 - [
    paths.diagnostic?.faceGeometry,
    paths.diagnostic?.frameFront,
    paths.diagnostic?.colourDrape,
  ].filter(Boolean).length) : 0;
  const missingDeliverables = requireV2Assets ? Math.max(0, 6 - [
    paths.deliverables?.beforeImage,
    paths.deliverables?.afterImage,
    paths.deliverables?.linkedinHeadshot,
    ...(paths.deliverables?.datingProfileShots ?? []),
  ].filter(Boolean).length) : 0;

  if (missingHairstyle === 0 && missingBeard === 0 && missingEyewear === 0 && missingOutfits === 0 && missingComboGrids === 0 && missingDiagnostics === 0 && missingDeliverables === 0) return null;

  const parts = [
    missingHairstyle ? `${missingHairstyle} hairstyle grid` : null,
    missingBeard ? `${missingBeard} beard grid` : null,
    missingEyewear ? `${missingEyewear} eyewear grid` : null,
    missingOutfits ? `${missingOutfits} outfit` : null,
    missingComboGrids ? `${missingComboGrids} combo grid` : null,
    missingDiagnostics ? `${missingDiagnostics} diagnostic` : null,
    missingDeliverables ? `${missingDeliverables} deliverable` : null,
  ].filter(Boolean);

  return `Image generation incomplete: ${parts.join(', ')} image${parts.length === 1 ? '' : 's'} still missing. Retry missing images when Gemini capacity is available.`;
}

async function runImagePipeline(
  reportId:       string,
  shareToken:     string | null,
  submission:     ManIntakeSubmission,
  classification: ClassificationResult,
  sections:       ReportData['sections'],
  imageModel:     string,
  existingImageUrls: ManReportImagePaths | null,
  generateV2Assets: boolean,
) {
  try {
    const softDeadlineMs = Date.now() + 260_000;
    const latestImageUrls = (await getStoredManReportImagePaths(reportId)) ?? existingImageUrls ?? null;

    // ── Hairstyle + eyewear ───────────────────────────────────────────────────
    // Resume per-slot: regenerate any face slot that's currently null.
    // (Old logic only regenerated when ALL hairstyle OR ALL eyewear slots were
    //  empty — partial failures from a previous run were never picked up.)
    let hairstylePaths = [...(latestImageUrls?.hairstyleCards ?? [])];
    let beardPaths     = [...(latestImageUrls?.beardCards     ?? [])];
    let eyewearPaths   = [...(latestImageUrls?.eyewearCards   ?? [])];
    const missingHairstyle = hairstylePaths[0] ? [] : [1];
    const missingBeard     = beardPaths[0] ? [] : [1];
    const missingEyewear   = eyewearPaths[0] ? [] : [1];
    const needsHeadshots   = missingHairstyle.length > 0 || missingBeard.length > 0 || missingEyewear.length > 0;

    if (needsHeadshots) {
      await supabaseAdmin
        .from('man_reports')
        .update({ progress_stage: 'generating_base_model', error_message: null, updated_at: new Date().toISOString() })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, shareToken);

      const [newHairstyle, newBeard, newEyewear] = await Promise.all([
        regenerateMissingFaceSlots(reportId, submission, classification, 'hairstyle', missingHairstyle, imageModel),
        regenerateMissingFaceSlots(reportId, submission, classification, 'beard',     missingBeard,     imageModel),
        regenerateMissingFaceSlots(reportId, submission, classification, 'eyewear',   missingEyewear,   imageModel),
      ]);

      // Merge regenerated grid slots back into index 0 without clobbering existing successes.
      if (missingHairstyle.length) hairstylePaths[0] = newHairstyle[0];
      if (missingBeard.length) beardPaths[0] = newBeard[0];
      if (missingEyewear.length) eyewearPaths[0] = newEyewear[0];

      // Persist immediately before starting outfit images
      await mergeManReportImagePathsForReport(
        reportId,
        { hairstyleCards: hairstylePaths, beardCards: beardPaths, eyewearCards: eyewearPaths },
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
    const headshotUrl = submission.photo_headshot_url;
    if (!fullBodyUrl || !headshotUrl) {
      throw new Error(missingPhotoError(submission) ?? 'Both source photos are required before image generation');
    }

    const currentBeforeOutfits = await getStoredManReportImagePaths(reportId);
    const existingOutfitPaths = currentBeforeOutfits?.outfitCards ?? [];
    hairstylePaths = currentBeforeOutfits?.hairstyleCards ?? hairstylePaths;
    beardPaths = currentBeforeOutfits?.beardCards ?? beardPaths;
    eyewearPaths = currentBeforeOutfits?.eyewearCards ?? eyewearPaths;
    const originalHeadshotUrl = headshotUrl;

    const outfitPaths = await generateAllOutfitImages(
      reportId, fullBodyUrl, classification, sections,
      originalHeadshotUrl, eyewearPaths, imageModel,
      existingOutfitPaths,
      softDeadlineMs,
    );

    const currentBeforeComboGrids = await getStoredManReportImagePaths(reportId);
    const comboGridPaths = await generateComboGridImages(
      reportId,
      fullBodyUrl,
      classification,
      sections,
      originalHeadshotUrl,
      imageModel,
      currentBeforeComboGrids?.comboGridCards ?? {},
    );

    const currentBeforeV2Images = await getStoredManReportImagePaths(reportId);
    const v2ImagePaths = generateV2Assets
      ? await generateManBlueprintV2Images(
          reportId,
          submission,
          classification,
          sections,
          imageModel,
          currentBeforeV2Images,
          softDeadlineMs,
        )
      : {
          diagnostic: currentBeforeV2Images?.diagnostic,
          deliverables: currentBeforeV2Images?.deliverables,
        };

    // ── Done ──────────────────────────────────────────────────────────────────
    const mergedImagePaths = await mergeManReportImagePathsForReport(
      reportId,
      {
        hairstyleCards: hairstylePaths,
        beardCards: beardPaths,
        eyewearCards: eyewearPaths,
        outfitCards: outfitPaths,
        comboGridCards: comboGridPaths,
        diagnostic: v2ImagePaths.diagnostic,
        deliverables: v2ImagePaths.deliverables,
      },
      {
        progress_stage: null,
        error_message: getMissingImageSummary(
          {
            hairstyleCards: hairstylePaths,
            beardCards: beardPaths,
            eyewearCards: eyewearPaths,
            outfitCards: outfitPaths,
            comboGridCards: comboGridPaths,
            diagnostic: v2ImagePaths.diagnostic,
            deliverables: v2ImagePaths.deliverables,
          },
          classification.outfit_split?.total ?? outfitPaths.length,
          generateV2Assets,
        ),
      },
    );

    const doneOutfits = mergedImagePaths.outfitCards.filter(Boolean).length;
    const doneGrooming = mergedImagePaths.hairstyleCards.filter(Boolean).length;
    const doneComboGrids = Object.values(mergedImagePaths.comboGridCards ?? {}).filter(Boolean).length;
    console.log(`[generate-images] Done for ${reportId} — ${doneGrooming}/1 hairstyle grid, ${mergedImagePaths.beardCards.filter(Boolean).length}/1 beard grid, ${mergedImagePaths.eyewearCards.filter(Boolean).length}/1 eyewear grid, ${doneOutfits}/${mergedImagePaths.outfitCards.length} outfits, ${doneComboGrids}/3 grids`);
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
      return NextResponse.json({
        status: 'already_running',
        progressStage: report.progress_stage,
        imageCounts: getImageCounts(report.image_urls as ManReportImagePaths | null),
      });
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

  const photoError = missingPhotoError(submission as ManIntakeSubmission);
  if (photoError) {
    return NextResponse.json({ error: photoError }, { status: 400 });
  }

  const reportData       = report.report_data as ReportData;
  const existingImageUrls = report.image_urls as ManReportImagePaths | null;
  let reportDataWithQa = withManReportSection4Qa({
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_outfits: normaliseSequentialManOutfitNumbers(reportData.sections?.s4_outfits ?? ''),
    },
  });
  let blockingQaIssues = reportDataWithQa.qa?.section4?.issues.filter(issue => issue.severity === 'error') ?? [];

  if (blockingQaIssues.length > 0) {
    const { data: repairLease, error: repairLeaseErr } = await supabaseAdmin
      .from('man_reports')
      .update({
        progress_stage: REPAIR_PROGRESS_STAGE,
        error_message: null,
        report_data: reportDataWithQa,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .is('progress_stage', null)
      .select('image_urls, share_token')
      .maybeSingle();

    if (repairLeaseErr) {
      return NextResponse.json({ error: repairLeaseErr.message }, { status: 500 });
    }

    if (!repairLease) {
      const { data: current } = await supabaseAdmin
        .from('man_reports')
        .select('progress_stage, image_urls')
        .eq('id', reportId)
        .single();

      return NextResponse.json({
        status: 'already_running',
        progressStage: current?.progress_stage ?? REPAIR_PROGRESS_STAGE,
        imageCounts: getImageCounts(current?.image_urls as ManReportImagePaths | null),
      });
    }

    await revalidateManReportCache(reportId, repairLease.share_token ?? report.share_token ?? null);

    try {
      const repaired = await generateSection4AtQualityFloor(
        reportDataWithQa.classification,
        submission as ManIntakeSubmission,
        reportDataWithQa.sections.s4_outfits ?? '',
        reportDataWithQa.outfit_library?.selectionProfile?.selectionSalt ?? '',
      );

      reportDataWithQa = withManReportSection4Qa({
        ...reportDataWithQa,
        ...buildManBlueprintV2StructuredData(reportDataWithQa.classification, repaired.selectionSalt),
        sections: {
          ...reportDataWithQa.sections,
          s4_outfits: normaliseSequentialManOutfitNumbers(repaired.section4),
        },
      });
      blockingQaIssues = reportDataWithQa.qa?.section4?.issues.filter(issue => issue.severity === 'error') ?? [];
    } catch (repairErr) {
      const message = repairErr instanceof Error ? repairErr.message : String(repairErr);
      await supabaseAdmin
        .from('man_reports')
        .update({
          progress_stage: null,
          error_message: `Section 4 repair failed before images: ${message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, report.share_token ?? null);

      return NextResponse.json({
        error: 'Section 4 repair failed before image generation.',
        issues: blockingQaIssues,
      }, { status: 400 });
    }

    if (blockingQaIssues.length === 0) {
      await supabaseAdmin
        .from('man_reports')
        .update({
          progress_stage: INITIAL_PROGRESS_STAGE,
          error_message: null,
          report_data: reportDataWithQa,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, report.share_token ?? null);

      after(async () => {
        await runImagePipeline(
          reportId,
          report.share_token ?? null,
          submission as ManIntakeSubmission,
          reportDataWithQa.classification,
          reportDataWithQa.sections,
          imageModel,
          existingImageUrls,
          reportDataWithQa.report_version === MAN_BLUEPRINT_V2_VERSION,
        );
      });

      return NextResponse.json({
        status: 'started',
        progressStage: INITIAL_PROGRESS_STAGE,
        repairedSection4: true,
        imageCounts: getImageCounts(existingImageUrls),
      });
    }

    await supabaseAdmin
      .from('man_reports')
      .update({
        progress_stage: null,
        report_data: reportDataWithQa,
        error_message: `Fix Section 4 before images: ${blockingQaIssues[0].message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      error: 'Section 4 has blocking QA issues. Fix the outfit text before generating images.',
      issues: blockingQaIssues,
    }, { status: 400 });
  }

  const { data: lease, error: leaseErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      progress_stage: INITIAL_PROGRESS_STAGE,
      error_message: null,
      report_data: reportDataWithQa,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .is('progress_stage', null)
    .select('image_urls, share_token')
    .maybeSingle();

  if (leaseErr) {
    return NextResponse.json({ error: leaseErr.message }, { status: 500 });
  }

  if (!lease) {
    const { data: current } = await supabaseAdmin
      .from('man_reports')
      .select('progress_stage, image_urls')
      .eq('id', reportId)
      .single();

    return NextResponse.json({
      status: 'already_running',
      progressStage: current?.progress_stage ?? INITIAL_PROGRESS_STAGE,
      imageCounts: getImageCounts(current?.image_urls as ManReportImagePaths | null),
    });
  }

  await revalidateManReportCache(reportId, lease.share_token ?? report.share_token ?? null);

  after(async () => {
    await runImagePipeline(
      reportId,
      report.share_token ?? null,
      submission as ManIntakeSubmission,
      reportDataWithQa.classification,
      reportDataWithQa.sections,
      imageModel,
      existingImageUrls,
      reportDataWithQa.report_version === MAN_BLUEPRINT_V2_VERSION,
    );
  });

  return NextResponse.json({
    status: 'started',
    progressStage: INITIAL_PROGRESS_STAGE,
    imageCounts: getImageCounts(existingImageUrls),
  });
}
