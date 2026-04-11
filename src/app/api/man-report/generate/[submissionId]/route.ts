// POST /api/man-report/generate/[submissionId]
//
// Creates a man_reports row and fires the four-phase Gemini pipeline:
//   Phase 1 — Classification JSON          (analysing_face)
//   Phase 2 — Report copy (6 sections)     (generating_outfits)
//   Phase 3 — Base model image             (generating_images)
//   Phase 4 — 16 outfit images             (generating_images)
//
// Returns { reportId } immediately; pipeline runs via Next.js `after()`.
// Admin dashboard polls /api/man-report/status/[reportId] for progress.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { runClassification, runSection1, runSection2, runSection3, runSection4, runSection5, runSection6, type ReportData, type ClassificationResult } from '@/lib/manReportGenerator';
import { generateBaseModel, generateAllOutfitImages, type ManReportImagePaths } from '@/lib/manImageGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';

// Vercel Hobby plan cap is 300s. Text pipeline (~60s) + base model (~20s) + 16 images
// at concurrency 4 (~80s) fits comfortably within this limit.
export const maxDuration = 300;

// ── Helper: update report progress stage ──────────────────────────────────

async function updateStage(reportId: string, stage: string) {
  await supabaseAdmin
    .from('man_reports')
    .update({ progress_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', reportId);
}

// ── Pipeline: runs after response is sent ─────────────────────────────────

async function writePartialData(
  reportId: string,
  classification: ClassificationResult,
  sections: Record<string, string>,
  nextStage: string
) {
  await supabaseAdmin
    .from('man_reports')
    .update({
      report_data:    { classification, sections: { ...sections }, generated_at: new Date().toISOString() },
      progress_stage: nextStage,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', reportId);
}

async function runPipeline(reportId: string, submission: ManIntakeSubmission) {
  try {
    // Phase 1 — Classification
    await updateStage(reportId, 'classifying');
    const classification = await runClassification(submission);

    // Write classification to DB so admin can navigate to review page immediately
    const sections: Record<string, string> = {};
    await writePartialData(reportId, classification, sections, 'generating_s1');

    // Phase 2 — Sections (one Gemini call per section, DB write after each)
    sections.s1_face = await runSection1(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_s2');

    sections.s2_body = await runSection2(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_s3');

    sections.s3_colour = await runSection3(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_s4');

    sections.s4_outfits = await runSection4(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_s5');

    sections.s5_rules = await runSection5(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_s6');

    sections.s6_identity = await runSection6(classification, submission);
    await writePartialData(reportId, classification, sections, 'generating_images');

    // Phase 3+4 — Image generation (non-fatal — text report is complete regardless)
    let imageUrls: ManReportImagePaths | null = null;
    try {
      const baseModelPath = await generateBaseModel(reportId, submission, classification);
      const outfitPaths   = await generateAllOutfitImages(
        reportId, baseModelPath, classification, sections as unknown as ReportData['sections']
      );
      imageUrls = { baseModel: baseModelPath, outfitCards: outfitPaths };
      console.log(`[man-report] Images generated for reportId=${reportId} — base + ${outfitPaths.filter(Boolean).length}/16 outfits`);
    } catch (imgErr) {
      console.error(`[man-report] Image generation failed for reportId=${reportId}:`, imgErr instanceof Error ? imgErr.message : imgErr);
    }

    // Finalise
    await updateStage(reportId, 'finalising');
    await supabaseAdmin
      .from('man_reports')
      .update({
        status:         'draft_ready',
        progress_stage: null,
        report_data:    { classification, sections, generated_at: new Date().toISOString() } as ReportData,
        image_urls:     imageUrls,
        generated_at:   new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    console.log(`[man-report] Pipeline complete for reportId=${reportId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[man-report] Pipeline failed for reportId=${reportId}:`, message);

    await supabaseAdmin
      .from('man_reports')
      .update({
        status:         'error',
        progress_stage: null,
        error_message:  message,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submissionId } = await params;

  // 1. Fetch submission
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // 2. Check if there is already an active generation for this submission
  const { data: existingReports } = await supabaseAdmin
    .from('man_reports')
    .select('id, status')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(1);

  const latest = existingReports?.[0];
  if (latest?.status === 'generating') {
    return NextResponse.json({ reportId: latest.id, status: 'generating', alreadyRunning: true });
  }

  // 3. Create a new report row with 'generating' status
  const { data: report, error: reportErr } = await supabaseAdmin
    .from('man_reports')
    .insert({
      submission_id:     submissionId,
      status:            'generating',
      progress_stage:    'classifying',
      section_approvals: { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false },
    })
    .select('id')
    .single();

  if (reportErr || !report) {
    console.error('[man-report] Failed to create report row:', reportErr);
    return NextResponse.json({ error: 'Failed to start report generation' }, { status: 500 });
  }

  const reportId = report.id;

  // 4. Schedule the pipeline to run after this response is sent
  after(async () => {
    await runPipeline(reportId, submission as ManIntakeSubmission);
  });

  // 5. Return immediately — admin dashboard starts polling
  return NextResponse.json({ reportId, status: 'generating' });
}
