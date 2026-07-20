import { NextRequest, NextResponse } from 'next/server';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { supabaseAdmin } from '@/lib/supabase';
import { generateStylistBlueprintSilhouetteProofImages } from '@/lib/stylistBlueprintImageGenerator';
import {
  attachSilhouetteRuleOutfitExamples,
  getStylistBlueprintRulesStartPage,
  isVersionedStylistBlueprintReportData,
  type BlueprintBlock,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import type { StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';

function countSilhouetteExamples(reportData: StylistBlueprintReportData) {
  const rulesPageNumber = getStylistBlueprintRulesStartPage(reportData);
  const rulesPage = reportData.pages.find(page => page.page_number === rulesPageNumber);
  if (!rulesPage) return 0;

  let count = 0;
  let seenCards = 0;
  const inspect = (candidate: unknown) => {
    if (seenCards >= 4) return;
    seenCards += 1;
    if (candidate && typeof candidate === 'object' && (candidate as Record<string, unknown>).example_outfit) {
      count += 1;
    }
  };

  for (const block of rulesPage.blocks as BlueprintBlock[]) {
    if (seenCards >= 4) break;
    if (Array.isArray(block.items) && block.items.length) {
      for (const item of block.items) inspect(item);
    } else {
      inspect(block);
    }
  }

  return count;
}

function clearSilhouetteProofImageSlots(paths: StylistBlueprintImagePaths | null | undefined): StylistBlueprintImagePaths {
  return {
    ...(paths ?? {}),
    application: {
      ...(paths?.application ?? {}),
      silhouetteProofs: [null, null, null, null],
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const dryRun = Boolean(body.dry_run);
  const generateImages = Boolean(body.generate_images);

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, image_urls, share_token, submission_id, progress_stage')
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
    return NextResponse.json({ error: 'A v1 Blueprint report is required.' }, { status: 400 });
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

  const reportData = report.report_data as StylistBlueprintReportData;
  const beforeCount = countSilhouetteExamples(reportData);
  const nextReportData = await attachSilhouetteRuleOutfitExamples(reportData, resolvedSubmission);
  const afterCount = countSilhouetteExamples(nextReportData);

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      beforeCount,
      afterCount,
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({
      report_data: nextReportData,
      image_urls: clearSilhouetteProofImageSlots(report.image_urls as StylistBlueprintImagePaths | null),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', reportId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);

  let imagesGenerated = false;
  if (generateImages) {
    await generateStylistBlueprintSilhouetteProofImages(reportId, nextReportData, report.share_token ?? null, {
      force: true,
      submission: resolvedSubmission,
    });
    imagesGenerated = true;
  }

  return NextResponse.json({
    success: true,
    beforeCount,
    afterCount,
    imagesGenerated,
  });
}
