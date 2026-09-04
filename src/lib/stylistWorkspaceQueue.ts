import 'server-only';
import { supabaseAdmin } from './supabase';
import { dedupeWorkspaceQueueItems, workspaceQueueItem, type QueueRow, type WorkspaceQueueItem } from './stylistWorkspaceQueueModel';

export const WORKSPACE_QUEUE_SELECT = `
  id, stylist_id, client_name, client_phone, consultation_date, images_received_at,
  report_due_at, delivered_at, status, created_at, updated_at,
  form_occupation:client_data->>occupation, form_body_shape:client_data->>bodyShape, form_reason:client_data->>consultationReason,
  consultation_upload_links(submitted_at, photo_paths, measurements),
  stylist_intake_responses(id, stylist_blueprint_reports(id, status, progress_stage, error_message, published_at, delivered_at, created_at, updated_at))
`;

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
      let query = supabaseAdmin.from('consultations').select(WORKSPACE_QUEUE_SELECT)
        .order('created_at', { ascending: false }).order('id').range(from, from + 499);
      if (stylistId) query = query.eq('stylist_id', stylistId);
      const { data, error } = await query;
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
