import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';
import {
  getStylistBlueprintHairColourPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintTransformationPage,
  isManualStylistBlueprintSubmission,
  isVersionedStylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';

const STALE_PROGRESS_MS = 6 * 60 * 1000;

function readReport(reportId: string) {
  return supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, progress_stage, error_message, generated_at, share_token, updated_at, report_data, image_urls, stylist_intake_responses(photo_urls, source_photo_paths, one_outfit_image_url, intake_source)')
    .eq('id', reportId)
    .single();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The dashboard polls this every few seconds while a long generation runs, so a
  // single transient Supabase "fetch failed" must not look like a deleted report.
  // Retry once, and only report 404 when the row is genuinely absent (PGRST116).
  let data: Awaited<ReturnType<typeof readReport>>['data'] = null;
  let error: Awaited<ReturnType<typeof readReport>>['error'] = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      ({ data, error } = await readReport(reportId));
    } catch (err) {
      // A thrown network error (undici "fetch failed") — treat as transient.
      error = { name: 'NetworkError', code: 'NETWORK', message: err instanceof Error ? err.message : String(err), details: '', hint: '' };
    }
    if (!error || error.code === 'PGRST116') break;
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 600));
  }

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Status temporarily unavailable' }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  const intake = Array.isArray(data.stylist_intake_responses)
    ? data.stylist_intake_responses[0]
    : data.stylist_intake_responses;
  const photoUrls = (intake?.photo_urls ?? {}) as Record<string, string | null | undefined>;
  const sourcePaths = (intake?.source_photo_paths ?? {}) as Record<string, string | null | undefined>;
  const hasFrontPhoto = Boolean(photoUrls.full_body_front || sourcePaths.full_body_front);
  const hasSidePhoto = Boolean(photoUrls.full_body_side || sourcePaths.full_body_side);
  const hasHeadshot = Boolean(photoUrls.headshot || sourcePaths.headshot);
  const hasClientPhoto = Boolean(hasFrontPhoto || hasSidePhoto || hasHeadshot || photoUrls.one_outfit || sourcePaths.one_outfit || intake?.one_outfit_image_url);
  const includeClosingEditTeaser = !isManualStylistBlueprintSubmission(intake);
  const outfitCount = isVersionedStylistBlueprintReportData(data.report_data)
    ? getStylistBlueprintOutfitCount(data.report_data)
    : 12;
  const includeTransformationPreview = isVersionedStylistBlueprintReportData(data.report_data)
    ? Boolean(getStylistBlueprintTransformationPage(data.report_data))
    : false;
  const includeBeautyPages = isVersionedStylistBlueprintReportData(data.report_data)
    ? Boolean(getStylistBlueprintHairColourPage(data.report_data))
    : false;

  const imageCounts = getStylistBlueprintImageCounts(data.image_urls as StylistBlueprintImagePaths | null, {
    hasFrontPhoto,
    hasSidePhoto,
    hasHeadshot,
    hasClientPhoto,
    outfitCount,
    includeClosingEditTeaser,
    includeTransformationPreview,
    includeBeautyPages,
  });
  const imagesComplete = Object.values(imageCounts).every(group => group.done >= group.total);
  let progressStage = data.progress_stage;
  let updatedAt = data.updated_at;
  const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : 0;
  const progressIsStale = Boolean(progressStage && Date.now() - updatedAtMs > STALE_PROGRESS_MS);

  if (imagesComplete && progressStage?.startsWith('generating_images')) {
    updatedAt = new Date().toISOString();
    progressStage = null;
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ progress_stage: null, updated_at: updatedAt })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, data.share_token);
  }

  if (progressStage?.startsWith('regenerating_image_') && progressIsStale) {
    updatedAt = new Date().toISOString();
    progressStage = null;
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        progress_stage: null,
        error_message: 'Previous image regeneration timed out. The admin dashboard unlocked the report; retry the image or outfit action if needed.',
        updated_at: updatedAt,
      })
      .eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, data.share_token);
  }

  return NextResponse.json({
    reportId: data.id,
    status: data.status,
    progressStage,
    errorMessage: data.error_message,
    generatedAt: data.generated_at,
    shareToken: data.share_token,
    updatedAt,
    imageCounts,
  });
}
