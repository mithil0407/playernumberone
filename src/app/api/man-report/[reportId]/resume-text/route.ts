// POST /api/man-report/[reportId]/resume-text
//
// Resumes the men text pipeline in the same man_reports row, skipping any
// already-persisted classification/sections in report_data.

import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import type { ReportData } from '@/lib/manReportGenerator';
import { revalidateManReportCache } from '@/lib/manReportCache';
import {
  getCompletedManReportTextSections,
  getNextManReportTextProgressStage,
  runManReportTextPipeline,
} from '@/lib/manReportTextPipeline';

export const maxDuration = 300;

const STALE_MS = 10 * 60 * 1000;

function missingPhotoError(submission: Pick<ManIntakeSubmission, 'photo_fullbody_url' | 'photo_headshot_url'>) {
  const missing = [
    submission.photo_fullbody_url ? null : 'full body photo',
    submission.photo_headshot_url ? null : 'headshot photo',
  ].filter(Boolean);

  return missing.length ? `Cannot resume report until ${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} uploaded.` : null;
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

  const { data: report, error: reportErr } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, progress_stage, report_data, submission_id, updated_at, share_token')
    .eq('id', reportId)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData | null;
  const completedSections = getCompletedManReportTextSections(reportData);
  const nextStage = getNextManReportTextProgressStage(reportData);

  if (report.status === 'generating') {
    const ageMs = report.updated_at
      ? Date.now() - new Date(report.updated_at).getTime()
      : Infinity;

    if (ageMs < STALE_MS) {
      return NextResponse.json({
        status: 'already_running',
        reportId,
        progressStage: report.progress_stage ?? nextStage ?? 'classifying',
        resumed: true,
        completedSections,
      });
    }
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

  if (!nextStage) {
    await supabaseAdmin
      .from('man_reports')
      .update({
        status: 'draft_ready',
        progress_stage: null,
        error_message: null,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      status: 'completed',
      reportId,
      progressStage: null,
      resumed: true,
      completedSections,
    });
  }

  const { error: leaseErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      status: 'generating',
      progress_stage: nextStage,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (leaseErr) {
    return NextResponse.json({ error: leaseErr.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  after(async () => {
    await runManReportTextPipeline(
      reportId,
      submission as ManIntakeSubmission,
      report.share_token ?? null,
      reportData,
    );
  });

  return NextResponse.json({
    status: 'started',
    reportId,
    progressStage: nextStage,
    resumed: true,
    completedSections,
  });
}
