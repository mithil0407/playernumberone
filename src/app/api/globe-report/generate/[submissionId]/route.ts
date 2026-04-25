// POST /api/globe-report/generate/[submissionId]
//
// Creates a globe_reports row and fires the two-phase text pipeline:
//   Phase 1 — Classification JSON          (classifying)
//   Phase 2 — Report copy (6 sections)     (generating_s1 … generating_s6)
//
// Image generation is intentionally decoupled. Once text is draft_ready,
// trigger POST /api/globe-report/[reportId]/generate-images separately.
//
// Returns { reportId } immediately; pipeline runs via Next.js `after()`.
// Admin dashboard polls /api/globe-report/status/[reportId] for progress.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseGlobeServer } from '@/lib/serverSupabaseGlobe';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { runClassification, runSection1, runSection2, runSection3, runSection4, runSection5, runSection6, type ReportData, type ClassificationResult } from '@/lib/globeReportGenerator';
import type { GlobeIntakeSubmission } from '@/lib/supabaseGlobe';
import { revalidateGlobeReportCache } from '@/lib/globeReportCache';

// Vercel Hobby plan cap is 300s. Text pipeline (~60s) + base model (~20s) + 16 images
// at concurrency 4 (~80s) fits comfortably within this limit.
export const maxDuration = 300;

// ── Helper: update report progress stage ──────────────────────────────────

async function updateStage(reportId: string, stage: string, shareToken: string | null) {
  await supabaseGlobeServer
    .from('globe_reports')
    .update({ progress_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', reportId);

  await revalidateGlobeReportCache(reportId, shareToken);
}

// ── Pipeline: runs after response is sent ─────────────────────────────────

async function writePartialData(
  reportId: string,
  shareToken: string | null,
  classification: ClassificationResult,
  sections: Record<string, string>,
  nextStage: string
) {
  await supabaseGlobeServer
    .from('globe_reports')
    .update({
      report_data:    { classification, sections: { ...sections }, generated_at: new Date().toISOString() },
      progress_stage: nextStage,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', reportId);

  await revalidateGlobeReportCache(reportId, shareToken);
}

async function runPipeline(reportId: string, submission: GlobeIntakeSubmission, shareToken: string | null) {
  try {
    // Phase 1 — Classification
    await updateStage(reportId, 'classifying', shareToken);
    const classification = await runClassification(submission);

    // Write classification to DB so admin can navigate to review page immediately
    const sections: Record<string, string> = {};
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s1');

    // Phase 2 — Sections (one Gemini call per section, DB write after each)
    sections.s1_face = await runSection1(classification, submission);
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s2');

    sections.s2_body = await runSection2(classification, submission);
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s3');

    sections.s3_colour = await runSection3(classification, submission);
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s4');

    sections.s4_outfits = await runSection4(classification, submission);
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s5');

    sections.s5_rules = await runSection5(classification, submission);
    await writePartialData(reportId, shareToken, classification, sections, 'generating_s6');

    sections.s6_identity = await runSection6(classification, submission);

    // Text pipeline complete — mark draft_ready immediately.
    // Images are generated separately via POST /api/globe-report/[reportId]/generate-images.
    await supabaseGlobeServer
      .from('globe_reports')
      .update({
        status:         'draft_ready',
        progress_stage: null,
        report_data:    { classification, sections, generated_at: new Date().toISOString() } as unknown as ReportData,
        generated_at:   new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateGlobeReportCache(reportId, shareToken);

    console.log(`[globe-report] Pipeline complete for reportId=${reportId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[globe-report] Pipeline failed for reportId=${reportId}:`, message);

    await supabaseGlobeServer
      .from('globe_reports')
      .update({
        status:         'error',
        progress_stage: null,
        error_message:  message,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateGlobeReportCache(reportId, shareToken);
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
  const { data: submission, error: subErr } = await supabaseGlobeServer
    .from('globe_intake_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // 2. Check if there is already an active generation for this submission
  const { data: existingReports } = await supabaseGlobeServer
    .from('globe_reports')
    .select('id, status')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(1);

  const latest = existingReports?.[0];
  if (latest?.status === 'generating') {
    // Only treat it as still-running if it was created within the last 10 minutes.
    // Beyond that, the pipeline is considered dead (Vercel killed the after() callback).
    const { data: latestFull } = await supabaseGlobeServer
      .from('globe_reports')
      .select('created_at')
      .eq('id', latest.id)
      .single();
    const ageMs = latestFull?.created_at
      ? Date.now() - new Date(latestFull.created_at).getTime()
      : Infinity;
    if (ageMs < 10 * 60 * 1000) {
      return NextResponse.json({ reportId: latest.id, status: 'generating', alreadyRunning: true });
    }
    // Stale — mark the dead row as errored so it doesn't keep blocking
    await supabaseGlobeServer
      .from('globe_reports')
      .update({ status: 'error', progress_stage: null, error_message: 'Generation timed out — restarted', updated_at: new Date().toISOString() })
      .eq('id', latest.id);
  }

  // 3. Create a new report row with 'generating' status
  const { data: report, error: reportErr } = await supabaseGlobeServer
    .from('globe_reports')
    .insert({
      submission_id:     submissionId,
      status:            'generating',
      progress_stage:    'classifying',
      section_approvals: { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false },
    })
    .select('id, share_token')
    .single();

  if (reportErr || !report) {
    console.error('[globe-report] Failed to create report row:', reportErr);
    return NextResponse.json({ error: 'Failed to start report generation' }, { status: 500 });
  }

  const reportId = report.id;

  // 4. Schedule the pipeline to run after this response is sent
  after(async () => {
    await runPipeline(reportId, submission as GlobeIntakeSubmission, report.share_token ?? null);
  });

  // 5. Return immediately — admin dashboard starts polling
  return NextResponse.json({ reportId, status: 'generating' });
}
