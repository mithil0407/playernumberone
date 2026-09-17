import { consultationReadiness, type ConsultationReadiness } from './stylistConsultationReadiness.ts';

export type WorkspaceView = 'recent' | 'all' | 'forms' | 'photos' | 'reports' | 'ready' | 'today' | 'needs_inputs' | 'waiting' | 'stale' | 'generating' | 'needs_review' | 'ready_to_deliver' | 'delivered' | 'needs_attention';
export const WORKSPACE_VIEWS: Array<{ key: WorkspaceView; label: string }> = [
  { key: 'reports', label: 'To do' },
  { key: 'recent', label: 'Recent consultations' }, { key: 'photos', label: 'Photos received' },
  { key: 'forms', label: 'Forms filled' }, { key: 'ready', label: 'Ready to start' },
  { key: 'all', label: 'All clients' }, { key: 'today', label: 'Due today' },
  { key: 'needs_inputs', label: 'Waiting on client' }, { key: 'waiting', label: 'Waiting on client' },
  { key: 'stale', label: 'Older than 30 days' }, { key: 'generating', label: 'Generating' },
  { key: 'needs_review', label: 'In review' }, { key: 'ready_to_deliver', label: 'Ready to deliver' },
  { key: 'delivered', label: 'Delivered' }, { key: 'needs_attention', label: 'Needs attention' },
];

/** The four tabs a stylist sees. Every view key resolves to exactly one tab. */
export const WORKSPACE_CATEGORIES: Array<{ key: WorkspaceView; label: string; views: WorkspaceView[] }> = [
  { key: 'reports', label: 'To do', views: ['reports', 'ready', 'generating', 'needs_review', 'ready_to_deliver', 'needs_attention'] },
  { key: 'waiting', label: 'Waiting on client', views: ['waiting', 'stale', 'needs_inputs'] },
  { key: 'delivered', label: 'Delivered', views: ['delivered'] },
  { key: 'all', label: 'All clients', views: ['all', 'recent', 'forms', 'photos', 'today'] },
];

/** One vocabulary for a client's stage, used on every card, row and tab. */
export const WORKSPACE_STAGE_LABELS: Record<string, string> = {
  ready: 'Ready to start', generating: 'Generating', needs_review: 'In review', ready_to_deliver: 'Ready to deliver',
  needs_attention: 'Needs attention', needs_inputs: 'Waiting on client', delivered: 'Delivered',
};

/** Clients who have not sent inputs this long after their consultation are unlikely to be active work. */
export const STALE_INPUT_DAYS = 30;

export function isStaleWaiting(item: WorkspaceQueueItem, now = Date.now()) {
  if (item.bucket !== 'needs_inputs') return false;
  const since = Date.parse(item.consultationDate || item.createdAt);
  return Number.isFinite(since) && since < now - STALE_INPUT_DAYS * 86_400_000;
}

export function isOverdue(item: WorkspaceQueueItem, now = Date.now()) {
  return item.bucket !== 'delivered' && Boolean(item.reportDueAt && Date.parse(item.reportDueAt) < now);
}

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
  if (input.reportStatus === 'generating' || input.reportProgress) return 'generating';
  if (input.reportStatus === 'delivered' || input.reportStatus === 'sent') return 'delivered';
  if (input.reportStatus === 'approved') return 'ready_to_deliver';
  if (input.reportStatus === 'draft_ready' || input.reportStatus === 'in_review') return 'needs_review';
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

export function workspaceNextAction(item: WorkspaceQueueItem) {
  switch (item.bucket) {
    case 'needs_review': return { label: 'Continue report', hint: 'Review the advice, finish outfit images, and approve each page.', target: 'report' as const, step: 2 };
    case 'ready_to_deliver': return { label: 'Deliver report', hint: 'Your reviewed report is ready for the client.', target: 'report' as const, step: 3 };
    case 'needs_attention': return { label: item.report ? 'Fix report' : 'Review client', hint: 'Resolve the issue to keep this report moving.', target: item.report ? 'report' as const : 'client' as const, step: 1 };
    case 'generating': return { label: 'View progress', hint: 'The report is being prepared. You can work on another client.', target: 'report' as const, step: 1 };
    case 'delivered': return { label: item.report ? 'View report' : 'View client', hint: 'Delivered to the client.', target: item.report ? 'report' as const : 'client' as const, step: 4 };
    case 'ready': return { label: 'Create report', hint: 'Check the client inputs, then create their first draft.', target: 'client' as const, step: 1 };
    default: return { label: 'Complete inputs', hint: 'Add the missing photos and measurements.', target: 'client' as const, step: 0 };
  }
}

function normalizedClientPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function consultationDay(value: string | null, fallback: string) {
  const timestamp = value || fallback;
  const parsed = Date.parse(timestamp);
  // Match the calendar day shown in the India-based admin workspace. Retried
  // syncs can stamp the same booking a few minutes apart, but they still
  // represent one client card for that consultation day.
  return Number.isFinite(parsed) ? new Date(parsed + 330 * 60_000).toISOString().slice(0, 10) : timestamp.slice(0, 10);
}

export function workspaceClientCardKey(item: WorkspaceQueueItem) {
  const phone = normalizedClientPhone(item.clientPhone);
  const client = phone || item.clientName.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${client}|${consultationDay(item.consultationDate, item.createdAt)}`;
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
  if (view === 'waiting') return item.bucket === 'needs_inputs' && !isStaleWaiting(item, now);
  if (view === 'stale') return isStaleWaiting(item, now);
  if (view !== 'today') return item.bucket === view;
  return item.bucket !== 'delivered' && Boolean(item.reportDueAt) && Date.parse(item.reportDueAt!) <= indiaDayEnd(now);
}

export function workspaceCounts(items: WorkspaceQueueItem[], now = Date.now()) {
  const counts: Record<string, number> = Object.fromEntries(WORKSPACE_VIEWS.map(({ key }) => [key, items.filter(item => matchesWorkspaceView(item, key, now)).length]));
  counts.overdue = items.filter(item => matchesWorkspaceView(item, 'reports', now) && isOverdue(item, now)).length;
  return counts;
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
      if (options.view === 'reports') {
        const overdue = (item: WorkspaceQueueItem) => Boolean(item.reportDueAt && Date.parse(item.reportDueAt) <= now);
        if (overdue(a) !== overdue(b)) return overdue(a) ? -1 : 1;
        const priority: Record<string, number> = { needs_attention: 0, ready_to_deliver: 1, needs_review: 2, ready: 3, generating: 4 };
        const difference = (priority[a.bucket] ?? 5) - (priority[b.bucket] ?? 5);
        if (difference) return difference;
        if (a.reportDueAt && b.reportDueAt && a.reportDueAt !== b.reportDueAt) return Date.parse(a.reportDueAt) - Date.parse(b.reportDueAt);
      }
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
