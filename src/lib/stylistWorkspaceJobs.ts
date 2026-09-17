import 'server-only';

import { supabaseAdmin } from './supabase';
import {
  getNextStylistBlueprintTextProgressStage,
  getStylistBlueprintTextProgress,
  isStylistBlueprintTextStage,
  runStylistBlueprintTextPipeline,
  stylistBlueprintTextStageLabel,
} from './stylistBlueprintTextPipeline';
import { isVersionedStylistBlueprintReportData, validateStylistBlueprintReport, type StylistBlueprintReportData, type StylistIntakeSubmission } from './stylistBlueprintGenerator';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
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
/** Every route that runs jobs allows 300s; keep well inside it so a slice is never cut off mid-page. */
const SLICE_BUDGET_MS = 230_000;
/** A running job heartbeats every 30s, so two minutes of silence means its function has died. */
const HEARTBEAT_STALE_MS = 2 * 60_000;
/** One-off image and outfit actions run inside a single 300s request. */
const ACTION_STALE_MS = 6 * 60_000;

type JobOutcome = 'completed' | 'requeued' | 'failed';

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('stylist_report_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) throw new Error(`Could not save generation job: ${error.message}`);
}

async function processJob(job: StylistWorkspaceJob): Promise<JobOutcome> {
  const startedAt = Date.now();
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

    const submission = await resolveConsultationIntakePhotos(rawSubmission);
    await logStylistReportActivity({
      action: 'generation_started',
      reportId: report.id,
      consultationId: job.consultation_id,
      stylistId: job.stylist_id,
      metadata: { attempt: job.attempt_count },
    });

    // Work through as many checkpoints as fit in this invocation. Each unit
    // saves its pages before the next begins, so stopping between units never
    // loses work; running one unit per invocation made a report wait for a
    // scheduler between every section.
    let reportData = report.report_data as StylistBlueprintReportData | null;
    let slowestUnitMs = 0;
    for (;;) {
      const unitStartedAt = Date.now();
      const next = await runStylistBlueprintTextPipeline(report.id, submission, report.share_token ?? null, reportData, { maxWorkUnits: 1 });
      if (!next) {
        // The pipeline already wrote the stage and the underlying cause to the
        // report before returning null. Carry that forward rather than a generic sentence.
        const { data: failed } = await supabaseAdmin
          .from('stylist_blueprint_reports')
          .select('error_message')
          .eq('id', report.id)
          .maybeSingle();
        throw new Error(failed?.error_message || 'Blueprint text generation did not complete');
      }
      reportData = next;
      slowestUnitMs = Math.max(slowestUnitMs, Date.now() - unitStartedAt);
      if (!getNextStylistBlueprintTextProgressStage(reportData)) break;

      const elapsed = Date.now() - startedAt;
      if (elapsed + Math.max(slowestUnitMs * 1.5, 60_000) > SLICE_BUDGET_MS) {
        // Successful work does not consume the retry budget.
        await updateJob(job.id, {
          status: 'queued', attempt_count: 0, next_run_at: new Date().toISOString(),
          heartbeat_at: null, locked_at: null, last_error: null,
        });
        return 'requeued';
      }
      await updateJob(job.id, { heartbeat_at: new Date().toISOString(), attempt_count: 1 });
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
      metadata: { image_workflow: 'manual_prompt_and_upload', duration_ms: Date.now() - startedAt },
    });
    return 'completed';
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
    return 'failed';
  } finally {
    clearInterval(heartbeat);
  }
}

async function hasDueJobs() {
  const { count } = await supabaseAdmin
    .from('stylist_report_jobs')
    .select('id', { count: 'exact', head: true })
    .in('status', ['queued', 'retry_wait'])
    .lte('next_run_at', new Date().toISOString());
  return Boolean(count);
}

/**
 * Starts a fresh worker invocation without waiting for it. Production has no
 * reliable scheduler, so the queue keeps itself moving: each invocation hands
 * over to the next while work remains. The external cron stays a fallback.
 */
async function dispatchNextWorker() {
  const base = process.env.STYLIST_WORKER_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return;
  try {
    await fetch(new URL('/api/stylist-workspace/worker', base), {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      cache: 'no-store',
      // The worker runs for minutes; only the hand-off needs to land.
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    if (!(error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))) {
      console.error('[stylist-workspace] could not dispatch next worker', error);
    }
  }
}

export async function runClaimedStylistWorkspaceJobs(limit = 2) {
  let processed = 0;
  let moreWork = false;
  // Local development has no deployment to call back into, so it drains the queue in place.
  do {
    const { data, error } = await supabaseAdmin.rpc('claim_stylist_report_jobs', { _limit: limit });
    if (error) throw new Error(error.message);
    const jobs = (data ?? []) as StylistWorkspaceJob[];
    if (!jobs.length) break;
    const outcomes = await Promise.all(jobs.map(processJob));
    processed += jobs.length;
    moreWork = outcomes.includes('requeued') || await hasDueJobs();
  } while (process.env.NODE_ENV === 'development' && moreWork);

  if (process.env.NODE_ENV !== 'development' && moreWork) await dispatchNextWorker();
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

type ActiveJob = { id: string; status: string; heartbeat_at: string | null; locked_at: string | null; next_run_at: string; last_error: string | null; attempt_count: number };

async function latestJob(reportId: string) {
  const { data } = await supabaseAdmin
    .from('stylist_report_jobs')
    .select('id, status, heartbeat_at, locked_at, next_run_at, last_error, attempt_count')
    .eq('report_id', reportId)
    .eq('job_type', 'full_report')
    .order('created_at', { ascending: false })
    .limit(5);
  const jobs = (data ?? []) as ActiveJob[];
  return {
    active: jobs.find(job => ['queued', 'running', 'retry_wait'].includes(job.status)) ?? null,
    latest: jobs[0] ?? null,
  };
}

function isAlive(job: ActiveJob | null) {
  const beat = job?.heartbeat_at ?? job?.locked_at;
  return Boolean(job?.status === 'running' && beat && Date.now() - Date.parse(beat) < HEARTBEAT_STALE_MS);
}

export type StylistGenerationState = 'working' | 'waiting' | 'paused' | 'failed' | 'busy' | 'complete';

/** What the editor shows about text generation, read without side effects. */
export async function getStylistReportGenerationSnapshot(report: {
  id: string; status: string; progress_stage: string | null; updated_at: string | null; error_message: string | null; report_data: unknown;
}) {
  const reportData = isVersionedStylistBlueprintReportData(report.report_data) ? report.report_data : null;
  const progress = getStylistBlueprintTextProgress(reportData);
  const nextStage = getNextStylistBlueprintTextProgressStage(reportData);
  const actionStage = report.progress_stage && !isStylistBlueprintTextStage(report.progress_stage) ? report.progress_stage : null;
  const textInFlight = report.status === 'generating' || Boolean(report.progress_stage && !actionStage);
  if (actionStage) {
    const stale = !report.updated_at || Date.now() - Date.parse(report.updated_at) > ACTION_STALE_MS;
    return { state: (stale ? 'paused' : 'busy') as StylistGenerationState, label: 'Finishing an image or outfit change', progress, nextStage, message: stale ? 'An image or outfit change stopped before finishing.' : null, kickWorker: false };
  }
  if (!textInFlight && report.status !== 'error') {
    return { state: 'complete' as StylistGenerationState, label: null, progress, nextStage, message: null, kickWorker: false };
  }
  const { active, latest } = await latestJob(report.id);
  const label = stylistBlueprintTextStageLabel(report.progress_stage ?? nextStage);
  if (isAlive(active)) return { state: 'working' as StylistGenerationState, label, progress, nextStage, message: null, kickWorker: false };
  if (active && (active.status === 'queued' || active.status === 'retry_wait') && Date.parse(active.next_run_at) > Date.now()) {
    return { state: 'waiting' as StylistGenerationState, label, progress, nextStage, message: active.last_error ? `Retrying shortly: ${active.last_error}` : null, kickWorker: false };
  }
  if (active) {
    // Due or abandoned: whoever is looking at the report nudges the queue along.
    return { state: 'waiting' as StylistGenerationState, label, progress, nextStage, message: null, kickWorker: true };
  }
  const failedMessage = report.error_message || latest?.last_error || null;
  return { state: (report.status === 'error' || latest?.status === 'failed' ? 'failed' : 'paused') as StylistGenerationState, label, progress, nextStage, message: failedMessage, kickWorker: false };
}

/**
 * The single "Continue generating" action. Safe to press at any time: it never
 * starts a second copy of a live job, finishes a report whose pages are all
 * written, clears an abandoned image or outfit action, and otherwise puts the
 * report's job back at the front of the queue so it resumes from the last
 * saved page.
 */
export async function resumeStylistReportGeneration(reportId: string, actor: { stylistId?: string | null } = {}) {
  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, progress_stage, report_data, submission_id, updated_at, share_token, stylist_intake_responses(consultation_id)')
    .eq('id', reportId)
    .single();
  if (error || !report) return { ok: false as const, status: 404, error: 'Report not found' };

  const relation = Array.isArray(report.stylist_intake_responses) ? report.stylist_intake_responses[0] : report.stylist_intake_responses;
  const consultationId = (relation as { consultation_id?: string | null } | null)?.consultation_id ?? null;
  const now = new Date().toISOString();

  if (report.progress_stage && !isStylistBlueprintTextStage(report.progress_stage)) {
    const age = report.updated_at ? Date.now() - Date.parse(report.updated_at) : Infinity;
    if (age < ACTION_STALE_MS) return { ok: true as const, state: 'busy' as const, message: 'An image or outfit change is still finishing. Try again in a few minutes.' };
    await supabaseAdmin.from('stylist_blueprint_reports').update({ progress_stage: null, updated_at: now }).eq('id', reportId);
  }

  const reportData = isVersionedStylistBlueprintReportData(report.report_data) ? report.report_data as StylistBlueprintReportData : null;
  const nextStage = getNextStylistBlueprintTextProgressStage(reportData);
  const { active } = await latestJob(reportId);

  if (!nextStage && reportData) {
    try {
      validateStylistBlueprintReport(reportData);
    } catch (caught) {
      return { ok: false as const, status: 400, error: caught instanceof Error ? caught.message : 'Report validation failed' };
    }
    if (active) await updateJob(active.id, { status: 'completed', locked_at: null, heartbeat_at: null, last_error: null });
    const finished = ['generating', 'error'].includes(report.status) ? { status: 'draft_ready', generated_at: now } : {};
    await supabaseAdmin.from('stylist_blueprint_reports').update({ ...finished, progress_stage: null, error_message: null, updated_at: now }).eq('id', reportId);
    await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);
    return { ok: true as const, state: 'complete' as const, message: 'All pages are written.' };
  }

  if (isAlive(active)) return { ok: true as const, state: 'working' as const, message: 'Already writing this report.' };

  if (active) {
    await updateJob(active.id, { status: 'queued', attempt_count: 0, next_run_at: now, locked_at: null, heartbeat_at: null, last_error: null });
  } else {
    const { data: submission } = await supabaseAdmin.from('stylist_intake_responses').select('*').eq('id', report.submission_id).single();
    if (!submission) return { ok: false as const, status: 404, error: 'The client’s intake could not be found.' };
    await enqueueStylistReportGeneration({ reportId, submission: submission as StylistIntakeSubmission });
  }

  await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({ status: 'generating', progress_stage: nextStage ?? 'classifying', error_message: null, updated_at: now })
    .eq('id', reportId);
  if (consultationId) {
    await supabaseAdmin.from('consultations').update({ status: 'in_progress', updated_at: now }).eq('id', consultationId);
  }
  await revalidateStylistBlueprintCache(reportId, report.share_token ?? null);
  await logStylistReportActivity({ action: 'generation_resumed', reportId, consultationId, stylistId: actor.stylistId ?? null, metadata: { from_stage: nextStage } });
  return { ok: true as const, state: 'started' as const, progressStage: nextStage ?? 'classifying', message: 'Continuing from the last saved page.' };
}
