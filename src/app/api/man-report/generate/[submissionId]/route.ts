// POST /api/man-report/generate/[submissionId]
//
// Creates a man_reports row and fires the two-phase text pipeline:
//   Phase 1 — Classification JSON          (classifying)
//   Phase 2 — Report copy (6 sections)     (generating_s1 … generating_s6)
//
// Image generation is intentionally decoupled. Once text is draft_ready,
// trigger POST /api/man-report/[reportId]/generate-images separately.
//
// Returns { reportId } immediately; pipeline runs via Next.js `after()`.
// Admin dashboard polls /api/man-report/status/[reportId] for progress.

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import { runManReportTextPipeline } from '@/lib/manReportTextPipeline';

// Vercel Hobby plan cap is 300s. Text pipeline (~60s) + base model (~20s) + 16 images
// at concurrency 4 (~80s) fits comfortably within this limit.
export const maxDuration = 300;

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
    // Only treat it as still-running if it was created within the last 10 minutes.
    // Beyond that, the pipeline is considered dead (Vercel killed the after() callback).
    const { data: latestFull } = await supabaseAdmin
      .from('man_reports')
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
    await supabaseAdmin
      .from('man_reports')
      .update({ status: 'error', progress_stage: null, error_message: 'Generation timed out — restarted', updated_at: new Date().toISOString() })
      .eq('id', latest.id);
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
    .select('id, share_token')
    .single();

  if (reportErr || !report) {
    console.error('[man-report] Failed to create report row:', reportErr);
    return NextResponse.json({ error: 'Failed to start report generation' }, { status: 500 });
  }

  const reportId = report.id;

  // 4. Schedule the pipeline to run after this response is sent
  after(async () => {
    await runManReportTextPipeline(reportId, submission as ManIntakeSubmission, report.share_token ?? null, null);
  });

  // 5. Return immediately — admin dashboard starts polling
  return NextResponse.json({ reportId, status: 'generating' });
}
