// POST /api/man-report/[reportId]/generate-images
//
// Triggers image generation for a report that already has text (draft_ready / in_review).
// Runs via Next.js after() so it returns immediately.
// Progress is tracked via progress_stage on the report row.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { generateHairstyleImages, generateEyewearImages, generateAllOutfitImages } from '@/lib/manImageGenerator';
import type { ClassificationResult, ReportData } from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';

const ALLOWED_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];

async function runImagePipeline(
  reportId: string,
  submission: ManIntakeSubmission,
  classification: ClassificationResult,
  sections: ReportData['sections'],
  imageModel: string,
) {
  try {
    await supabaseAdmin
      .from('man_reports')
      .update({ progress_stage: 'generating_base_model', updated_at: new Date().toISOString() })
      .eq('id', reportId);

    const [hairstylePaths, eyewearPaths] = await Promise.all([
      generateHairstyleImages(reportId, submission, classification, imageModel),
      generateEyewearImages(reportId, submission, classification, imageModel),
    ]);

    // Persist hairstyle + eyewear immediately so partial progress is visible
    await supabaseAdmin
      .from('man_reports')
      .update({
        image_urls:     { hairstyleCards: hairstylePaths, eyewearCards: eyewearPaths, outfitCards: [] },
        progress_stage: 'generating_outfit_images',
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    const fullBodyUrl = submission.photo_fullbody_url;
    if (!fullBodyUrl) throw new Error('No photo_fullbody_url on submission — cannot generate outfit images');

    const outfitPaths = await generateAllOutfitImages(
      reportId, fullBodyUrl, classification, sections, hairstylePaths, eyewearPaths, imageModel
    );

    await supabaseAdmin
      .from('man_reports')
      .update({
        image_urls:     { hairstyleCards: hairstylePaths, eyewearCards: eyewearPaths, outfitCards: outfitPaths },
        progress_stage: null,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    console.log(`[generate-images] Done for reportId=${reportId} — ${hairstylePaths.filter(Boolean).length}/2 hairstyles, ${eyewearPaths.filter(Boolean).length}/2 eyewear, ${outfitPaths.filter(Boolean).length}/16 outfits`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[generate-images] Failed for reportId=${reportId}:`, message);
    await supabaseAdmin
      .from('man_reports')
      .update({
        progress_stage: null,
        error_message:  `Image generation failed: ${message}`,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);
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

  // Fetch the report to get classification + sections + submission_id
  const { data: report, error: reportErr } = await supabaseAdmin
    .from('man_reports')
    .select('status, progress_stage, report_data, submission_id')
    .eq('id', reportId)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (!report.report_data) {
    return NextResponse.json({ error: 'Report has no text yet — run text generation first' }, { status: 400 });
  }

  if (report.progress_stage) {
    return NextResponse.json({ error: 'Image generation already in progress', progress_stage: report.progress_stage }, { status: 409 });
  }

  // Fetch the submission for photo URLs + client details
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('*')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData;

  after(async () => {
    await runImagePipeline(
      reportId,
      submission as ManIntakeSubmission,
      reportData.classification,
      reportData.sections,
      imageModel,
    );
  });

  return NextResponse.json({ status: 'generating_images' });
}
