import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildManBlueprintV2StructuredData,
  generateSection4AtQualityFloor,
  runSection5,
  withManRecommendationProfile,
  type ReportData,
} from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import type { ManReportImagePaths } from '@/lib/manImageGenerator';
import { extractOutfitBlock, normaliseSequentialManOutfitNumbers, replaceOutfitBlock } from '@/lib/manOutfitSection';
import { invalidateChangedOutfitImages } from '@/lib/manOutfitConsistency';
import { usesManColourLock, type ManOutfitSelectionOverrides } from '@/lib/manOutfitLibrary';
import { withManReportSection4Qa } from '@/lib/manReportQa';
import { downvotedOutfitNumbers, loadManLookFeedbackTotals, loadManReportOutfitFeedback } from '@/lib/manOutfitFeedback';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { markStaleShoppingSlots } from '@/lib/manShoppingPipeline';

export const maxDuration = 300;

function clearOutfitDependentImages(
  paths: ManReportImagePaths | null,
  outfitCount: number,
): ManReportImagePaths {
  const datingProfileCount = Math.max(paths?.deliverables?.datingProfileShots?.length ?? 0, 3);

  return {
    hairstyleCards: [...(paths?.hairstyleCards ?? [])],
    beardCards: [...(paths?.beardCards ?? [])],
    eyewearCards: [...(paths?.eyewearCards ?? [])],
    outfitCards: Array.from({ length: outfitCount }, () => null),
    diagnostic: { ...(paths?.diagnostic ?? {}) },
    comboGridCards: {
      office: null,
      evening: null,
      relaxed: null,
    },
    deliverables: {
      beforeImage: null,
      afterImage: null,
      beforeAfter: null,
      linkedinHeadshot: paths?.deliverables?.linkedinHeadshot ?? null,
      datingProfileShots: Array.from({ length: datingProfileCount }, () => null),
    },
    ...(paths?.baseModel ? { baseModel: paths.baseModel } : {}),
  };
}

/**
 * Rewrites Section 4 with the current picker.
 *
 * body.mode = 'all' (default) re-picks every outfit; 'downvoted' keeps every
 * outfit the stylist didn't 👎 (text and image untouched) and re-picks only
 * the 👎 slots. Either way, 👎 looks are never picked again for this client.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('status, report_data, image_urls, submission_id, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData | null;
  const storedClassification = reportData?.classification;
  if (!reportData || !storedClassification) {
    return NextResponse.json({ error: 'No report classification data found' }, { status: 400 });
  }

  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('*')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  let mode: 'all' | 'downvoted' = 'all';
  try {
    const body = await request.json() as { mode?: string };
    if (body?.mode === 'downvoted') mode = 'downvoted';
  } catch { /* no body: rewrite everything */ }

  // Refresh the recommendation profile so older reports move onto the v4
  // picker and every report sees the latest 👍/👎 totals.
  const [lookFeedback, reportFeedback] = await Promise.all([
    loadManLookFeedbackTotals(),
    loadManReportOutfitFeedback(reportId),
  ]);
  const classification = withManRecommendationProfile(storedClassification, submission as ManIntakeSubmission, lookFeedback);
  const assignments = reportData.outfit_library?.assignments ?? [];
  const downvoted = downvotedOutfitNumbers(reportFeedback.rows);
  const downvotedLooks = assignments.filter(item => downvoted.includes(item.outfitNumber)).map(item => item.libraryLookId);
  const previousOverrides = reportData.outfit_library?.selectionProfile?.overrides ?? {};
  const excluded = [...new Set([...(previousOverrides.excluded ?? []), ...downvotedLooks])];

  let pinned: Record<string, number> = {};
  if (mode === 'downvoted') {
    if (!usesManColourLock(reportData.outfit_library?.version)) {
      return NextResponse.json({ error: 'This report was built with the old outfit system. Use "Rewrite all outfits" once; after that you can replace only the 👎 outfits.' }, { status: 409 });
    }
    if (!downvoted.length) {
      return NextResponse.json({ error: 'No outfits are marked 👎 yet.' }, { status: 400 });
    }
    pinned = Object.fromEntries(assignments
      .filter(item => !downvoted.includes(item.outfitNumber))
      .map(item => [String(item.outfitNumber), item.libraryLookId]));
  }
  const overrides: ManOutfitSelectionOverrides = { excluded, ...(Object.keys(pinned).length ? { pinned } : {}) };
  const selectionSalt = mode === 'downvoted' ? reportData.outfit_library?.selectionProfile?.selectionSalt ?? '' : '';

  let repaired;
  let comboGridText = reportData.sections?.s4_combo_grids ?? '';
  try {
    repaired = await generateSection4AtQualityFloor(classification, submission as ManIntakeSubmission, '', selectionSalt, overrides);
    comboGridText = await runSection5(classification, submission as ManIntakeSubmission);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Outfit regeneration failed: ${message}` }, { status: 500 });
  }

  let newS4 = normaliseSequentialManOutfitNumbers(repaired.section4);
  if (mode === 'downvoted') {
    // Kept outfits keep their exact text (including any hand edits) and images.
    const previousS4 = reportData.sections?.s4_outfits ?? '';
    for (const outfitNumber of Object.keys(pinned).map(Number)) {
      const keptBlock = extractOutfitBlock(previousS4, outfitNumber);
      if (keptBlock) newS4 = replaceOutfitBlock(newS4, outfitNumber, keptBlock) ?? newS4;
    }
  }
  // Stored so later steps (images, QA) see the same picks. The next "rewrite
  // all" drops the pins but keeps the 👎 exclusions.
  const structured = buildManBlueprintV2StructuredData(classification, repaired.selectionSalt, overrides);
  const draftReportData: ReportData = {
    ...reportData,
    ...structured,
    classification,
    sections: {
      ...reportData.sections,
      s4_outfits: newS4,
      s4_combo_grids: comboGridText,
    },
    generated_at: new Date().toISOString(),
    qa: {
      ...reportData.qa,
      section4: repaired.qa,
    },
  };
  // Spliced-in kept outfits were never in the generator's QA pass, so re-check the whole section.
  const nextReportData = mode === 'downvoted' ? withManReportSection4Qa(draftReportData) : draftReportData;

  const outfitCount = 20;
  const clearedImagePaths = mode === 'downvoted'
    ? invalidateChangedOutfitImages(report.image_urls as ManReportImagePaths | null, reportData.sections?.s4_outfits ?? '', newS4)
    : clearOutfitDependentImages(report.image_urls as ManReportImagePaths | null, outfitCount);

  const nextStatus = report.status === 'sent' ? 'in_review' : report.status;
  const updatedAt = new Date().toISOString();
  const { error: saveErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      image_urls: clearedImagePaths,
      status: nextStatus,
      progress_stage: null,
      error_message: null,
      updated_at: updatedAt,
    })
    .eq('id', reportId);

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  // Full portfolio regen: garments whose text survived unchanged keep their
  // links (no refetch cost); everything else is flagged stale until the
  // stylist re-approves Section 4.
  await markStaleShoppingSlots(reportId, newS4);

  return NextResponse.json({
    updatedS4Outfits: newS4,
    updatedComboGridText: comboGridText,
    qa: nextReportData.qa,
    status: nextStatus,
    updatedAt,
    clearedImageUrls: {
      outfitCards: clearedImagePaths.outfitCards,
      comboGridCards: clearedImagePaths.comboGridCards,
      deliverables: clearedImagePaths.deliverables,
    },
  });
}
