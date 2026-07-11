import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildManBlueprintV2StructuredData,
  generateSection4AtQualityFloor,
  runSection5,
  type ReportData,
} from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import type { ManReportImagePaths } from '@/lib/manImageGenerator';
import { normaliseSequentialManOutfitNumbers } from '@/lib/manOutfitSection';
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

export async function POST(
  _request: NextRequest,
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
  const classification = reportData?.classification;
  if (!reportData || !classification) {
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

  let repaired;
  let comboGridText = reportData.sections?.s4_combo_grids ?? '';
  try {
    repaired = await generateSection4AtQualityFloor(classification, submission as ManIntakeSubmission);
    comboGridText = await runSection5(classification, submission as ManIntakeSubmission);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Outfit regeneration failed: ${message}` }, { status: 500 });
  }

  const newS4 = normaliseSequentialManOutfitNumbers(repaired.section4);
  const structured = buildManBlueprintV2StructuredData(classification, repaired.selectionSalt);
  const nextReportData: ReportData = {
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

  const outfitCount = classification.outfit_split?.total ?? 20;
  const clearedImagePaths = clearOutfitDependentImages(
    report.image_urls as ManReportImagePaths | null,
    outfitCount,
  );

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
