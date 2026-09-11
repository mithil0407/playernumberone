import 'server-only';

import { supabaseAdmin } from './supabase';
import { getNextStylistBlueprintTextProgressStage, runStylistBlueprintTextPipeline } from './stylistBlueprintTextPipeline';
import type { StylistBlueprintReportData, StylistIntakeSubmission } from './stylistBlueprintGenerator';
import { resolveConsultationIntakePhotos } from './stylistConsultationWorkspace';
import { logStylistReportActivity } from './stylistWorkspaceAuth';

export interface StylistWorkspaceJob {
  id: string;
  report_id: string;
  consultation_id: string | null;
  stylist_id: string | null;
  attempt_count: number;
  max_attempts: number;
  job_type: string;
  target: string;
  intake_snapshot?: (StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null }) | null;
}

const RETRY_MINUTES = [1, 5, 15];

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('stylist_report_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) throw new Error(`Could not save generation job: ${error.message}`);
}

async function processJob(job: StylistWorkspaceJob) {
  const heartbeat = setInterval(() => {
    void updateJob(job.id, { heartbeat_at: new Date().toISOString() }).catch(error => console.error('[stylist-job heartbeat]', error));
  }, 30_000);

  try {
    const { data: report, error: reportError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, submission_id, report_data, share_token')
      .eq('id', job.report_id)
      .single();
    if (reportError || !report) throw new Error('Report not found');

    let rawSubmission = job.intake_snapshot ?? null;
    if (!rawSubmission) {
      const { data, error: submissionError } = await supabaseAdmin
        .from('stylist_intake_responses')
        .select('*')
        .eq('id', report.submission_id)
        .single();
      if (submissionError || !data) throw new Error('Consultation intake not found');
      rawSubmission = data as StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null };
    }

    const submission = await resolveConsultationIntakePhotos(
      rawSubmission,
    );
    await logStylistReportActivity({
      action: 'generation_started',
      reportId: report.id,
      consultationId: job.consultation_id,
      stylistId: job.stylist_id,
      metadata: { attempt: job.attempt_count },
    });

    const reportData = await runStylistBlueprintTextPipeline(
      report.id,
      submission,
      report.share_token ?? null,
      report.report_data as StylistBlueprintReportData | null,
      { maxWorkUnits: 1 },
    );
    if (!reportData) {
      // The pipeline already wrote the stage and the underlying cause to the
      // report before returning null. Carry that forward: overwriting it with
      // this generic sentence is what left "Blueprint text generation did not
      // complete" as the only trace of a failure, with nothing to act on.
      const { data: failed } = await supabaseAdmin
        .from('stylist_blueprint_reports')
        .select('error_message')
        .eq('id', report.id)
        .maybeSingle();
      throw new Error(failed?.error_message || 'Blueprint text generation did not complete');
    }

    const nextStage = getNextStylistBlueprintTextProgressStage(reportData);
    if (nextStage) {
      // Yield at a persisted checkpoint instead of exceeding a serverless
      // request's lifetime. Successful work does not consume the retry budget.
      await updateJob(job.id, {
        status: 'queued', attempt_count: 0, next_run_at: new Date().toISOString(),
        heartbeat_at: null, locked_at: null, last_error: null,
      });
      return;
    }

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'draft_ready', progress_stage: null, error_message: null, updated_at: new Date().toISOString() })
      .eq('id', report.id);
    if (job.consultation_id) {
      await supabaseAdmin
        .from('consultations')
        .update({ status: 'review', updated_at: new Date().toISOString() })
        .eq('id', job.consultation_id);
    }
    await updateJob(job.id, {
      status: 'completed',
      heartbeat_at: new Date().toISOString(),
      last_error: null,
    });
    await logStylistReportActivity({
      action: 'generation_completed',
      reportId: report.id,
      consultationId: job.consultation_id,
      stylistId: job.stylist_id,
      metadata: { image_workflow: 'manual_prompt_and_upload' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    const exhausted = job.attempt_count >= job.max_attempts;
    const retryIndex = Math.min(Math.max(job.attempt_count - 1, 0), RETRY_MINUTES.length - 1);
    await updateJob(job.id, exhausted ? {
      status: 'failed',
      heartbeat_at: null,
      last_error: message,
    } : {
      status: 'retry_wait',
      heartbeat_at: null,
      locked_at: null,
      next_run_at: new Date(Date.now() + RETRY_MINUTES[retryIndex] * 60_000).toISOString(),
      last_error: message,
    });
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({
        status: exhausted ? 'error' : 'generating',
        progress_stage: null,
        error_message: exhausted ? message : `Retry scheduled: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.report_id);
    if (exhausted && job.consultation_id) {
      await supabaseAdmin
        .from('consultations')
        .update({ status: 'stalled', updated_at: new Date().toISOString() })
        .eq('id', job.consultation_id);
    }
    await logStylistReportActivity({
      action: exhausted ? 'generation_failed' : 'generation_retry_scheduled',
      reportId: job.report_id,
      consultationId: job.consultation_id,
      stylistId: job.stylist_id,
      metadata: { error: message.slice(0, 500), attempt: job.attempt_count },
    });
  } finally {
    clearInterval(heartbeat);
  }
}

export async function runClaimedStylistWorkspaceJobs(limit = 2) {
  let processed = 0;
  // Production uses a durable cron invocation for each bounded slice. Local
  // development has no cron daemon, so drain immediately available slices.
  do {
    const { data, error } = await supabaseAdmin.rpc('claim_stylist_report_jobs', { _limit: limit });
    if (error) throw new Error(error.message);
    const jobs = (data ?? []) as StylistWorkspaceJob[];
    if (!jobs.length) break;
    await Promise.all(jobs.map(processJob));
    processed += jobs.length;
  } while (process.env.NODE_ENV === 'development');
  return processed;
}

export async function enqueueStylistReportGeneration(input: {
  reportId: string;
  submission: StylistIntakeSubmission & { consultation_id?: string | null; assigned_stylist_id?: string | null; source_photo_paths?: Record<string, string> | null };
}) {
  const { error } = await supabaseAdmin.from('stylist_report_jobs').insert({
    report_id: input.reportId,
    consultation_id: input.submission.consultation_id ?? null,
    stylist_id: input.submission.assigned_stylist_id ?? null,
    job_type: 'full_report', target: 'all', intake_snapshot: input.submission,
  });
  if (error && error.code !== '23505') throw new Error(`Could not queue report generation: ${error.message}`);
}
