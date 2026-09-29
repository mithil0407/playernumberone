import 'server-only';
import { supabaseAdmin } from './supabase';
import { dedupeWorkspaceQueueItems, workspaceQueueItem, type QueueRow, type WorkspaceQueueItem } from './stylistWorkspaceQueueModel';

// Report headlines only, never report bodies: this loads every client a stylist
// has. The revision embed carries the checklist, whose labels are what a card
// shows, rather than the full message the client sent.
export const WORKSPACE_QUEUE_SELECT = `
  id, stylist_id, client_name, client_phone, consultation_date, images_received_at,
  report_due_at, delivered_at, status, created_at, updated_at,
  form_occupation:client_data->>occupation, form_body_shape:client_data->>bodyShape, form_reason:client_data->>consultationReason,
  consultation_upload_links(submitted_at, photo_paths, measurements),
  stylist_intake_responses(id, stylist_blueprint_reports(id, status, progress_stage, error_message, published_at, delivered_at, created_at, updated_at,
    stylist_report_revisions(id, status, due_at, created_at, scope)))
`;

/** The same query for a database that has not run the revisions migration. */
const WORKSPACE_QUEUE_SELECT_WITHOUT_REVISIONS = `
  id, stylist_id, client_name, client_phone, consultation_date, images_received_at,
  report_due_at, delivered_at, status, created_at, updated_at,
  form_occupation:client_data->>occupation, form_body_shape:client_data->>bodyShape, form_reason:client_data->>consultationReason,
  consultation_upload_links(submitted_at, photo_paths, measurements),
  stylist_intake_responses(id, stylist_blueprint_reports(id, status, progress_stage, error_message, published_at, delivered_at, created_at, updated_at))
`;

function missingRevisionsTable(error: { code?: string; message?: string; details?: string; hint?: string }) {
  const text = [error.code, error.message, error.details, error.hint].filter(Boolean).join(' ');
  return /stylist_report_revisions/i.test(text);
}

// Auth is checked by the caller before accessing this cache. Each stylist has an
// isolated key; only the admin endpoint is allowed to request the all-client key.
// The short TTL also picks up form submissions from the separate intake app.
const cache = new Map<string, { expiresAt: number; promise: Promise<WorkspaceQueueItem[]> }>();

export async function loadWorkspaceQueue(stylistId?: string, fresh = false) {
  const key = stylistId || 'admin:all';
  const cached = cache.get(key);
  if (!fresh && cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = (async () => {
    const items: WorkspaceQueueItem[] = [];
    for (let from = 0; ; from += 500) {
      const page = (select: string) => {
        const query = supabaseAdmin.from('consultations').select(select)
          .order('created_at', { ascending: false }).order('id').range(from, from + 499);
        return stylistId ? query.eq('stylist_id', stylistId) : query;
      };
      let { data, error } = await page(WORKSPACE_QUEUE_SELECT);
      // Every stylist's home screen lives on this query, so a database that has
      // not run the revisions migration yet loses the revision embed, not the
      // whole dashboard.
      if (error && missingRevisionsTable(error)) {
        ({ data, error } = await page(WORKSPACE_QUEUE_SELECT_WITHOUT_REVISIONS));
      }
      if (error) throw new Error(error.message);
      items.push(...((data ?? []) as unknown as QueueRow[]).map(workspaceQueueItem));
      if ((data?.length ?? 0) < 500) break;
    }
    return dedupeWorkspaceQueueItems(items);
  })();
  for (const [cachedKey, entry] of cache) if (entry.expiresAt <= Date.now()) cache.delete(cachedKey);
  if (cache.size >= 50) cache.delete(cache.keys().next().value!);
  cache.set(key, { expiresAt: Date.now() + 20_000, promise });
  promise.catch(() => { if (cache.get(key)?.promise === promise) cache.delete(key); });
  return promise;
}

export function clearWorkspaceQueueCache(stylistId?: string | null) {
  cache.delete('admin:all');
  if (stylistId) cache.delete(stylistId);
}
