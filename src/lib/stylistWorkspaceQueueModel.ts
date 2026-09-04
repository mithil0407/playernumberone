import { consultationReadiness, type ConsultationReadiness } from './stylistConsultationReadiness.ts';

export type WorkspaceView = 'recent' | 'all' | 'forms' | 'photos' | 'reports' | 'ready' | 'today' | 'needs_inputs' | 'generating' | 'needs_review' | 'ready_to_deliver' | 'delivered' | 'needs_attention';
export const WORKSPACE_VIEWS: Array<{ key: WorkspaceView; label: string }> = [
  { key: 'reports', label: 'All report stages' },
  { key: 'recent', label: 'Recent consultations' }, { key: 'photos', label: 'Photos received' },
  { key: 'forms', label: 'Forms filled' }, { key: 'ready', label: 'Ready to generate' },
  { key: 'all', label: 'All clients' }, { key: 'today', label: 'Due today' },
  { key: 'needs_inputs', label: 'Awaiting inputs' }, { key: 'generating', label: 'Generating' },
  { key: 'needs_review', label: 'Needs review' }, { key: 'ready_to_deliver', label: 'Ready to deliver' },
  { key: 'delivered', label: 'Delivered' }, { key: 'needs_attention', label: 'Needs attention' },
];

export const WORKSPACE_CATEGORIES: Array<{ key: WorkspaceView; label: string; description: string; views: WorkspaceView[] }> = [
  { key: 'all', label: 'All clients', description: 'Browse your clients, or narrow the list by consultations, forms, photos or due date.', views: ['all', 'recent', 'forms', 'photos', 'today'] },
  { key: 'needs_inputs', label: 'Awaiting inputs', description: 'Clients who still need to provide photos or measurements before their report can begin.', views: ['needs_inputs'] },
  { key: 'reports', label: 'Reports to do', description: 'Reports ready to start, being generated, awaiting review or delivery, and any needing attention.', views: ['reports', 'ready', 'generating', 'needs_review', 'ready_to_deliver', 'needs_attention'] },
  { key: 'delivered', label: 'Delivered', description: 'Completed reports, including those delivered outside the studio.', views: ['delivered'] },
];

export interface QueueReport {
  id: string; status: string; progress_stage: string | null; error_message: string | null;
  published_at: string | null; delivered_at: string | null; created_at: string; updated_at: string;
}
export interface QueueRow {
  id: string; stylist_id: string | null; client_name: string; client_phone: string;
  consultation_date: string | null; images_received_at: string | null;
  report_due_at: string | null; delivered_at: string | null; status: string; created_at: string; updated_at: string;
  form_occupation: string | null; form_body_shape: string | null; form_reason: string | null;
  consultation_upload_links: { submitted_at: string | null; photo_paths: Record<string, string> | null; measurements: Record<string, unknown> | null } | null;
  stylist_intake_responses: Array<{ id: string; stylist_blueprint_reports: QueueReport[] }>;
}

export function workspaceBucket(input: { consultationStatus: string; readiness: ConsultationReadiness; reportStatus?: string | null; reportProgress?: string | null }) {
  if (input.reportStatus === 'error' || input.consultationStatus === 'stalled') return 'needs_attention';
  if (input.reportStatus === 'delivered' || input.reportStatus === 'sent') return 'delivered';
  if (input.reportStatus === 'approved') return 'ready_to_deliver';
  if (input.reportStatus === 'draft_ready' || input.reportStatus === 'in_review') return 'needs_review';
  if (input.reportStatus === 'generating' || input.reportProgress) return 'generating';
  if (input.consultationStatus === 'delivered') return 'delivered';
  return input.readiness.ready ? 'ready' : 'needs_inputs';
}

export function workspaceQueueItem(row: QueueRow) {
  const upload = row.consultation_upload_links;
  const report = [...(row.stylist_intake_responses?.[0]?.stylist_blueprint_reports ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  const readiness = consultationReadiness({ upload: upload ? { photo_paths: upload.photo_paths ?? {}, measurements: upload.measurements ?? {} } : null });
  // These keys are written by the consultation form. Imported order placeholders
  // only have source/order metadata and must not be labelled as filled forms.
  const formCompleted = [row.form_occupation, row.form_body_shape, row.form_reason].some(value => value != null);
  const photoCount = Object.values(readiness.photos).filter(Boolean).length;
  return {
    id: row.id, stylistId: row.stylist_id, clientName: row.client_name, clientPhone: row.client_phone,
    consultationDate: row.consultation_date, createdAt: row.created_at, reportDueAt: row.report_due_at,
    deliveredAt: row.delivered_at, consultationStatus: row.status, formCompleted,
    updatedAt: report?.updated_at ?? row.updated_at, photosSubmitted: photoCount > 0, photoCount,
    uploadSubmittedAt: upload?.submitted_at ?? null, readiness,
    bucket: workspaceBucket({ consultationStatus: row.status, readiness, reportStatus: report?.status, reportProgress: report?.progress_stage }),
    report: report ? { id: report.id, status: report.status, progressStage: report.progress_stage, errorMessage: report.error_message, publishedAt: report.published_at, deliveredAt: report.delivered_at } : null,
  };
}
export type WorkspaceQueueItem = ReturnType<typeof workspaceQueueItem>;

function normalizedClientPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function consultationMoment(value: string | null, fallback: string) {
  const timestamp = value || fallback;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, value ? 16 : 10) : timestamp.slice(0, value ? 16 : 10);
}

export function workspaceClientCardKey(item: WorkspaceQueueItem) {
  const phone = normalizedClientPhone(item.clientPhone);
  const client = phone || item.clientName.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${client}|${consultationMoment(item.consultationDate, item.createdAt)}`;
}

function queueItemCompleteness(item: WorkspaceQueueItem) {
  const reportWeight: Record<string, number> = {
    delivered: 90, sent: 85, approved: 80, in_review: 75, draft_ready: 70, generating: 60, pending: 50, error: 40,
  };
  return (item.report ? 500 + (reportWeight[item.report.status] ?? 0) : 0)
    + (item.formCompleted ? 200 : 0)
    + item.photoCount * 25
    + (item.uploadSubmittedAt ? 30 : 0)
    + (item.stylistId ? 20 : 0);
}

/**
 * One booking can be written more than once by retried checkout webhooks. Keep
 * the richest row for the same client and consultation time while preserving
 * legitimate repeat bookings on different dates.
 */
export function dedupeWorkspaceQueueItems(items: WorkspaceQueueItem[]) {
  const unique = new Map<string, WorkspaceQueueItem>();
  for (const item of items) {
    const key = workspaceClientCardKey(item);
    const current = unique.get(key);
    if (!current) {
      unique.set(key, item);
      continue;
    }
    const itemScore = queueItemCompleteness(item);
    const currentScore = queueItemCompleteness(current);
    if (itemScore > currentScore || (itemScore === currentScore && item.createdAt.localeCompare(current.createdAt) < 0)) {
      unique.set(key, item);
    }
  }
  return [...unique.values()];
}

export function indiaDayEnd(now: number) {
  const offset = 330 * 60_000;
  return Math.floor((now + offset) / 86_400_000) * 86_400_000 + 86_400_000 - offset - 1;
}

export function matchesWorkspaceView(item: WorkspaceQueueItem, view: string, now = Date.now()) {
  if (view === 'recent') return item.formCompleted && Boolean(item.consultationDate) && Date.parse(item.consultationDate!) <= now;
  if (!view || view === 'all') return true;
  if (view === 'forms') return item.formCompleted;
  if (view === 'photos') return item.photosSubmitted;
  if (view === 'reports') return ['ready', 'generating', 'needs_review', 'ready_to_deliver', 'needs_attention'].includes(item.bucket);
  if (view !== 'today') return item.bucket === view;
  return item.bucket !== 'delivered' && Boolean(item.reportDueAt) && Date.parse(item.reportDueAt!) <= indiaDayEnd(now);
}

export function workspaceCounts(items: WorkspaceQueueItem[], now = Date.now()) {
  return Object.fromEntries(WORKSPACE_VIEWS.map(({ key }) => [key, items.filter(item => matchesWorkspaceView(item, key, now)).length]));
}

export function queryWorkspaceItems(items: WorkspaceQueueItem[], options: { view?: string; search?: string; stylistId?: string; due?: string }, now = Date.now()) {
  const search = options.search?.trim().toLowerCase() || '';
  return items.filter(item => !options.stylistId || (options.stylistId === 'unassigned' ? !item.stylistId : item.stylistId === options.stylistId))
    .filter(item => matchesWorkspaceView(item, options.view || 'recent', now))
    .filter(item => !search || item.clientName?.toLowerCase().includes(search) || item.clientPhone?.toLowerCase().includes(search))
    .filter(item => {
      if (!options.due) return true;
      const due = item.reportDueAt ? Date.parse(item.reportDueAt) : null;
      if (options.due === 'none') return due === null;
      if (due === null) return false;
      if (options.due === 'overdue') return due < now;
      if (options.due === 'today') return due >= now && due <= indiaDayEnd(now);
      if (options.due === 'week') return due >= now && due <= now + 7 * 86_400_000;
      return true;
    })
    .sort((a, b) => {
      if (options.view === 'today') return Date.parse(a.reportDueAt!) - Date.parse(b.reportDueAt!);
      const date = (item: WorkspaceQueueItem) => options.view === 'photos'
        ? item.uploadSubmittedAt || item.updatedAt
        : options.view === 'recent' ? item.consultationDate || item.createdAt : item.createdAt;
      return Date.parse(date(b)) - Date.parse(date(a)) || a.id.localeCompare(b.id);
    });
}

export function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 ? Math.min(maximum, Math.floor(number)) : fallback;
}
