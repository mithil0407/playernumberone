// POST /api/man-report/generate/[submissionId]
//
// Creates a man_reports row and fires the two-prompt Gemini pipeline.
// Returns { reportId } immediately; pipeline runs via Next.js `after()`.
// Admin dashboard polls /api/man-report/status/[reportId] for progress.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { runClassification, runReportGeneration, type ReportData } from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';

// Allow up to 5 minutes — Gemini classification + full report generation
export const maxDuration = 300;

// ── Helper: update report progress stage ──────────────────────────────────

async function updateStage(reportId: string, stage: string) {
  await supabaseAdmin
    .from('man_reports')
    .update({ progress_stage: stage, updated_at: new Date().toISOString() })
    .eq('id', reportId);
}

// ── Pipeline: runs after response is sent ─────────────────────────────────

async function runPipeline(reportId: string, submission: ManIntakeSubmission) {
  try {
    // Stage 1 — Classification (Prompt 1)
    await updateStage(reportId, 'analysing_face');
    const classification = await runClassification(submission);

    // Stage 2 — Report generation (Prompt 2)
    await updateStage(reportId, 'generating_outfits');
    const sections = await runReportGeneration(classification, submission);

    // Stage 3 — Finalising
    await updateStage(reportId, 'finalising');

    const reportData: ReportData = {
      classification,
      sections,
      generated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('man_reports')
      .update({
        status:         'draft_ready',
        progress_stage: null,
        report_data:    reportData,
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

// ── Route handler ─────────────────────────────────────────────────────────

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
    // Already running — return the existing reportId so admin can poll it
    return NextResponse.json({ reportId: latest.id, status: 'generating', alreadyRunning: true });
  }

  // 3. Create a new report row with 'generating' status
  const { data: report, error: reportErr } = await supabaseAdmin
    .from('man_reports')
    .insert({
      submission_id:     submissionId,
      status:            'generating',
      progress_stage:    'analysing_face',
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
