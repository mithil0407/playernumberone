// Shopping-links pipeline for man reports.
//
// Fired when the stylist approves Section 4 (and never earlier, so regenerated
// or swapped outfits cost nothing). Flow: collect garment slots → dedupe by
// normalized-descriptor hash → product_search_cache lookup → Gemini query-gen
// for misses → ONE batched Apify run → poll → cache upsert → Gemini re-rank →
// write per-slot candidates/selections into man_reports.shopping_data.
//
// Cost levers, in order of leverage: approval-gated trigger, cross-report
// cache, within-report dedupe, SHOPPING_MAX_RESULTS_PER_QUERY cap, delta
// refetch (only hash-changed slots), single batched run per report.
//
// Failure model: errors land in shopping_data.status='error' only — the report
// lifecycle (man_reports.status) is never touched and sending is never blocked.
// If the serverless window closes while the Apify run is still going, state is
// left as 'fetching' with the runId; the next invocation resumes the finished
// run and pays nothing extra.

import { supabaseAdmin } from '@/lib/supabase';
import { revalidateManReportCache } from '@/lib/manReportCache';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  applyStaleMarks,
  buildFallbackSearchUrl,
  collectGarmentSlots,
  createEmptyShoppingState,
  diffStaleSlotKeys,
  isShoppingFetchInFlight,
  MAN_SHOPPING_MAX_SELECTED,
  type ManGarmentSlot,
  type ManProductLink,
  type ManShoppingSlot,
  type ManShoppingSlotKey,
  type ManShoppingState,
} from '@/lib/manShopping';
import {
  fetchShoppingItems,
  getShoppingMaxResultsPerQuery,
  getShoppingRunStatus,
  startShoppingRun,
  type ApifyShoppingItem,
} from '@/lib/apifyShoppingClient';
import {
  generateShoppingQueries,
  MAN_SHOPPING_LOW_CONFIDENCE_THRESHOLD,
  rerankShoppingCandidates,
} from '@/lib/manShoppingIntelligence';

const SHOPPING_COUNTRY = 'in';
const POLL_INTERVAL_MS = 8_000;
// Leave headroom inside the 300s serverless window for re-rank + writes.
const POLL_BUDGET_MS = 200_000;

function getCacheTtlMs(): number {
  const days = Number(process.env.SHOPPING_CACHE_TTL_DAYS);
  return (Number.isFinite(days) && days > 0 ? days : 21) * 24 * 60 * 60 * 1000;
}

interface LoadedReport {
  s4Text: string;
  state: ManShoppingState;
  shareToken: string | null;
}

async function loadReport(reportId: string): Promise<LoadedReport | null> {
  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, report_data, shopping_data, share_token')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;

  return {
    s4Text: (data.report_data as ReportData | null)?.sections?.s4_outfits ?? '',
    state: (data.shopping_data as ManShoppingState | null) ?? createEmptyShoppingState(),
    shareToken: (data.share_token as string | null) ?? null,
  };
}

// Persist by merging over a fresh read of shopping_data so stylist selections
// made while the pipeline runs (via the select route) are never clobbered:
// slots the stylist has since set to manual/skipped keep their decision.
async function persistState(
  reportId: string,
  shareToken: string | null,
  next: ManShoppingState,
): Promise<void> {
  const { data } = await supabaseAdmin
    .from('man_reports')
    .select('shopping_data')
    .eq('id', reportId)
    .single();

  const current = (data?.shopping_data as ManShoppingState | null) ?? null;
  const merged: ManShoppingState = { ...next, updatedAt: new Date().toISOString() };

  if (current) {
    for (const [key, slot] of Object.entries(current.slots) as Array<[ManShoppingSlotKey, ManShoppingSlot]>) {
      const incoming = merged.slots[key];
      const stylistDecided = slot.status === 'manual' || slot.status === 'skipped';
      if (stylistDecided && (!incoming || incoming.descriptorHash === slot.descriptorHash)) {
        merged.slots[key] = slot;
      }
    }
  }

  await supabaseAdmin
    .from('man_reports')
    .update({ shopping_data: merged, updated_at: new Date().toISOString() })
    .eq('id', reportId);

  await revalidateManReportCache(reportId, shareToken);
}

interface CacheRow {
  query_hash: string;
  normalized_query: string;
  results: ApifyShoppingItem[];
  fetched_at: string;
}

async function lookupCache(hashes: string[]): Promise<Map<string, CacheRow>> {
  if (hashes.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('product_search_cache')
    .select('query_hash, normalized_query, results, fetched_at')
    .in('query_hash', hashes)
    .eq('country', SHOPPING_COUNTRY);

  if (error || !data) {
    if (error) console.warn(`[manShoppingPipeline] cache lookup failed (continuing uncached): ${error.message}`);
    return new Map();
  }

  const freshAfter = Date.now() - getCacheTtlMs();
  const rows = new Map<string, CacheRow>();
  for (const row of data as CacheRow[]) {
    // Empty results may reflect a blocked/broken actor rather than genuine
    // product absence. Never let them suppress a later retry with a healthy
    // actor for the full cache TTL.
    if (new Date(row.fetched_at).getTime() >= freshAfter && row.results.length > 0) {
      rows.set(row.query_hash, row);
    }
  }
  return rows;
}

async function upsertCache(entries: Array<{ hash: string; query: string; items: ApifyShoppingItem[] }>): Promise<void> {
  if (entries.length === 0) return;

  const { error } = await supabaseAdmin
    .from('product_search_cache')
    .upsert(
      entries.map(entry => ({
        query_hash: entry.hash,
        normalized_query: entry.query,
        country: SHOPPING_COUNTRY,
        results: entry.items,
        result_count: entry.items.length,
        fetched_at: new Date().toISOString(),
      })),
      { onConflict: 'query_hash,country' },
    );

  if (error) console.warn(`[manShoppingPipeline] cache upsert failed (results still used): ${error.message}`);
}

function toProductLink(item: ApifyShoppingItem, source: 'apify' | 'cache', confidence?: number): ManProductLink {
  return {
    title: item.title,
    merchant: item.merchant,
    url: item.productUrl,
    imageUrl: item.imageUrl,
    price: item.priceNumeric,
    currency: item.currency,
    rating: item.rating,
    reviewCount: item.reviewCount,
    source,
    confidence,
  };
}

async function waitForRun(runId: string, deadlineMs: number): Promise<'succeeded' | 'partial' | 'running' | 'failed'> {
  for (;;) {
    const status = await getShoppingRunStatus(runId);
    if (status === 'SUCCEEDED') return 'succeeded';
    // Google Shopping actors can hit their time limit after already writing a
    // useful partial dataset. Let the pipeline consume those rows instead of
    // discarding paid results and launching the same searches again.
    if (
      status === 'TIMED-OUT'
      || status === 'TIMING-OUT'
      || status === 'ABORTED'
      || status === 'ABORTING'
    ) return 'partial';
    if (status === 'FAILED') return 'failed';
    if (Date.now() >= deadlineMs) return 'running';
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

export async function runManShoppingPipeline(
  reportId: string,
  opts: { onlySlotKeys?: ManShoppingSlotKey[] } = {},
): Promise<void> {
  const startedAt = Date.now();

  try {
    const loaded = await loadReport(reportId);
    if (!loaded) return;
    const { s4Text, shareToken } = loaded;
    let state = loaded.state;

    const allGarments = collectGarmentSlots(s4Text);
    const targetKeys = new Set(opts.onlySlotKeys ?? diffStaleSlotKeys(state, s4Text));
    const targets = allGarments.filter(garment => targetKeys.has(garment.key));

    if (targets.length === 0) {
      if (state.status !== 'ready' || state.apifyRunId) {
        await persistState(reportId, shareToken, {
          ...state,
          status: 'ready',
          apifyRunId: undefined,
          apifyDatasetId: undefined,
          pendingQueries: undefined,
          error: undefined,
        });
      }
      return;
    }

    // Unique garments by descriptor hash — one query serves every slot that
    // shares it, within this report and (via the cache) across reports.
    const uniqueByHash = new Map<string, ManGarmentSlot>();
    for (const garment of targets) {
      if (!uniqueByHash.has(garment.hash)) uniqueByHash.set(garment.hash, garment);
    }

    const itemsByHash = new Map<string, ApifyShoppingItem[]>();
    const queryByHash = new Map<string, string>();

    // Resume a still-pending Apify run before considering new spend: if the
    // previous invocation died while the run was going, its dataset is free.
    if (state.status === 'fetching' && state.apifyRunId && state.apifyDatasetId && state.pendingQueries) {
      const runStatus = await getShoppingRunStatus(state.apifyRunId).catch(() => 'FAILED' as const);
      if (
        runStatus === 'SUCCEEDED'
        || runStatus === 'TIMED-OUT'
        || runStatus === 'TIMING-OUT'
        || runStatus === 'ABORTED'
        || runStatus === 'ABORTING'
        || (runStatus === 'RUNNING' && isShoppingFetchInFlight(state))
      ) {
        const outcome = runStatus === 'SUCCEEDED'
          ? 'succeeded'
          : runStatus === 'TIMED-OUT'
            || runStatus === 'TIMING-OUT'
            || runStatus === 'ABORTED'
            || runStatus === 'ABORTING'
            ? 'partial'
            : await waitForRun(state.apifyRunId, startedAt + POLL_BUDGET_MS);
        if (outcome === 'running') return; // still going; a later invocation resumes
        if (outcome === 'succeeded' || outcome === 'partial') {
          const items = await fetchShoppingItems(state.apifyDatasetId);
          const grouped = groupItemsByQuery(items);
          const cacheEntries: Array<{ hash: string; query: string; items: ApifyShoppingItem[] }> = [];
          for (const [hash, query] of Object.entries(state.pendingQueries)) {
            const queryItems = grouped.get(query) ?? [];
            itemsByHash.set(hash, queryItems);
            queryByHash.set(hash, query);
            cacheEntries.push({ hash, query, items: queryItems });
          }
          await upsertCache(cacheEntries);
        }
        // 'failed' falls through to a fresh fetch below.
      }
    }

    // Cache lookup for everything still unresolved.
    const unresolved = [...uniqueByHash.keys()].filter(hash => !itemsByHash.has(hash));
    const cacheRows = await lookupCache(unresolved);
    for (const [hash, row] of cacheRows) {
      itemsByHash.set(hash, row.results);
      queryByHash.set(hash, row.normalized_query);
    }

    const misses = unresolved.filter(hash => !itemsByHash.has(hash)).map(hash => uniqueByHash.get(hash)!);

    if (misses.length > 0) {
      const queries = await generateShoppingQueries(misses.map(garment => ({
        hash: garment.hash,
        slot: garment.slot,
        descriptor: garment.descriptor,
        normalized: garment.normalized,
        shoppingTranslation: garment.shoppingTranslation,
        acceptableSubstitutes: garment.acceptableSubstitutes,
      })));

      const pendingQueries: Record<string, string> = {};
      for (const garment of misses) {
        pendingQueries[garment.hash] = queries.get(garment.hash)!;
      }

      const run = await startShoppingRun([...new Set(Object.values(pendingQueries))], {
        maxResults: getShoppingMaxResultsPerQuery(),
        country: SHOPPING_COUNTRY,
      });

      state = {
        ...state,
        status: 'fetching',
        apifyRunId: run.runId,
        apifyDatasetId: run.datasetId,
        pendingQueries,
        startedAt: new Date().toISOString(),
        error: undefined,
      };
      await persistState(reportId, shareToken, state);

      const outcome = await waitForRun(run.runId, startedAt + POLL_BUDGET_MS);
      if (outcome === 'running') return; // resume later, run keeps going on Apify's side
      if (outcome === 'failed') throw new Error('Apify shopping run failed');

      const items = await fetchShoppingItems(run.datasetId);
      const grouped = groupItemsByQuery(items);
      const cacheEntries: Array<{ hash: string; query: string; items: ApifyShoppingItem[] }> = [];
      for (const [hash, query] of Object.entries(pendingQueries)) {
        const queryItems = grouped.get(query) ?? [];
        itemsByHash.set(hash, queryItems);
        queryByHash.set(hash, query);
        cacheEntries.push({ hash, query, items: queryItems });
      }
      await upsertCache(cacheEntries);
    }

    // Re-rank once for all unique garments (cache hits included — ranking is
    // per descriptor, and cached raw results still need match filtering).
    await persistState(reportId, shareToken, { ...state, status: 'ranking' });

    const cachedHashes = new Set(cacheRows.keys());
    const picksByHash = await rerankShoppingCandidates(
      [...uniqueByHash.values()].map(garment => ({
        hash: garment.hash,
        descriptor: garment.descriptor,
        candidates: itemsByHash.get(garment.hash) ?? [],
      })),
      MAN_SHOPPING_MAX_SELECTED,
    );

    const nextSlots: ManShoppingState['slots'] = { ...state.slots };
    for (const garment of targets) {
      const items = itemsByHash.get(garment.hash) ?? [];
      const source = cachedHashes.has(garment.hash) ? 'cache' as const : 'apify' as const;
      const candidates = items.map(item => toProductLink(item, source));
      const picks = picksByHash.get(garment.hash) ?? [];
      const selected = picks.map(pick => ({ ...candidates[pick.index], confidence: pick.confidence }));
      const bestConfidence = picks[0]?.confidence ?? 0;

      nextSlots[garment.key] = {
        descriptor: garment.descriptor,
        descriptorHash: garment.hash,
        query: queryByHash.get(garment.hash) ?? garment.normalized,
        candidates,
        selected,
        status: candidates.length === 0
          ? 'no_results'
          : selected.length === 0 || bestConfidence < MAN_SHOPPING_LOW_CONFIDENCE_THRESHOLD
            ? 'low_confidence'
            : 'ready',
      };
    }

    await persistState(reportId, shareToken, {
      ...state,
      status: 'ready',
      apifyRunId: undefined,
      apifyDatasetId: undefined,
      pendingQueries: undefined,
      startedAt: undefined,
      error: undefined,
      slots: nextSlots,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[manShoppingPipeline] report ${reportId} failed: ${message}`);
    const loaded = await loadReport(reportId);
    if (loaded) {
      await persistState(reportId, loaded.shareToken, {
        ...loaded.state,
        status: 'error',
        apifyRunId: undefined,
        apifyDatasetId: undefined,
        pendingQueries: undefined,
        startedAt: undefined,
        error: message,
      });
    }
  }
}

function groupItemsByQuery(items: ApifyShoppingItem[]): Map<string, ApifyShoppingItem[]> {
  const grouped = new Map<string, ApifyShoppingItem[]>();
  for (const item of items) {
    const list = grouped.get(item.query);
    if (list) list.push(item);
    else grouped.set(item.query, [item]);
  }
  return grouped;
}

// Stamps slots whose descriptor hash no longer matches the new Section 4 text
// as 'stale' (UI signal only — the refetch happens when the stylist re-approves
// Section 4). Called by the outfit-edit routes after they write report_data.
export async function markStaleShoppingSlots(reportId: string, newS4Text: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from('man_reports')
    .select('shopping_data, share_token')
    .eq('id', reportId)
    .single();

  const state = (data?.shopping_data as ManShoppingState | null) ?? null;
  if (!state) return;

  const { next, changed } = applyStaleMarks(state, newS4Text);
  if (!changed) return;

  await supabaseAdmin
    .from('man_reports')
    .update({ shopping_data: next, updated_at: new Date().toISOString() })
    .eq('id', reportId);

  await revalidateManReportCache(reportId, (data?.share_token as string | null) ?? null);
}

export { buildFallbackSearchUrl };
