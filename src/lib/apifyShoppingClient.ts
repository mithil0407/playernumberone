// Thin wrapper around the Apify Google Shopping scraper actor.
//
// All actor I/O is isolated here so a third-party schema change or an actor
// swap (APIFY_SHOPPING_ACTOR) never leaks past this module. Runs are started
// async (not run-sync) so the runId/datasetId can be persisted into
// shopping_data and resumed by a later invocation without re-spending.
//
// APIFY_MOCK=1 short-circuits everything with deterministic synthetic items so
// the whole shopping flow is exercisable end-to-end for free.

import { ApifyClient } from 'apify-client';
import { descriptorHash } from './manShopping';

export interface ApifyShoppingItem {
  title: string;
  merchant: string;
  productUrl: string;
  imageUrl?: string;
  priceNumeric?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  position?: number;
  query: string;
}

export type ApifyRunStatus =
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMING-OUT'
  | 'TIMED-OUT'
  | 'ABORTING'
  | 'ABORTED';

export interface ShoppingRunOptions {
  maxResults?: number;
  country?: string;
  language?: string;
}

const DEFAULT_ACTOR = 'automation-lab~google-shopping-scraper';
const MOCK_PREFIX = 'mock:';

export function getShoppingMaxResultsPerQuery(): number {
  const parsed = Number(process.env.SHOPPING_MAX_RESULTS_PER_QUERY);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(Math.floor(parsed), 50) : 8;
}

function isMockMode(): boolean {
  return process.env.APIFY_MOCK === '1';
}

function getClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN is not configured');
  return new ApifyClient({ token });
}

function getActorId(): string {
  return process.env.APIFY_SHOPPING_ACTOR || DEFAULT_ACTOR;
}

export async function startShoppingRun(
  queries: string[],
  opts: ShoppingRunOptions = {},
): Promise<{ runId: string; datasetId: string }> {
  if (queries.length === 0) throw new Error('startShoppingRun called with no queries');

  if (isMockMode()) {
    const payload = `${MOCK_PREFIX}${encodeURIComponent(JSON.stringify(queries))}`;
    return { runId: payload, datasetId: payload };
  }

  const run = await getClient().actor(getActorId()).start({
    queries,
    maxResults: opts.maxResults ?? getShoppingMaxResultsPerQuery(),
    country: opts.country ?? 'in',
    language: opts.language ?? 'en',
  });

  return { runId: run.id, datasetId: run.defaultDatasetId };
}

export async function getShoppingRunStatus(runId: string): Promise<ApifyRunStatus> {
  if (runId.startsWith(MOCK_PREFIX)) return 'SUCCEEDED';
  const run = await getClient().run(runId).get();
  if (!run) throw new Error(`Apify run ${runId} not found`);
  return run.status as ApifyRunStatus;
}

export async function fetchShoppingItems(datasetId: string): Promise<ApifyShoppingItem[]> {
  if (datasetId.startsWith(MOCK_PREFIX)) {
    const queries = JSON.parse(decodeURIComponent(datasetId.slice(MOCK_PREFIX.length))) as string[];
    return queries.flatMap(buildMockItems);
  }

  const { items } = await getClient().dataset(datasetId).listItems({ clean: true, limit: 10_000 });
  return items
    .map(normalizeItem)
    .filter((item): item is ApifyShoppingItem => item !== null);
}

// Actor output fields are third-party controlled — map defensively and drop
// anything without the essentials (title + direct merchant URL + source query).
function normalizeItem(raw: Record<string, unknown>): ApifyShoppingItem | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const productUrl = typeof raw.productUrl === 'string' ? raw.productUrl.trim() : '';
  const query = typeof raw.query === 'string' ? raw.query.trim() : '';
  if (!title || !productUrl || !query || !/^https?:\/\//i.test(productUrl)) return null;

  const priceNumeric = typeof raw.priceNumeric === 'number' && Number.isFinite(raw.priceNumeric)
    ? raw.priceNumeric
    : undefined;

  return {
    title,
    query,
    productUrl,
    merchant: typeof raw.merchant === 'string' && raw.merchant.trim()
      ? raw.merchant.trim()
      : safeHostname(productUrl),
    imageUrl: typeof raw.imageUrl === 'string' && raw.imageUrl ? raw.imageUrl : undefined,
    priceNumeric,
    currency: typeof raw.currency === 'string' && raw.currency ? raw.currency : undefined,
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : undefined,
    position: typeof raw.position === 'number' ? raw.position : undefined,
  };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

const MOCK_MERCHANTS = ['Myntra', 'Amazon.in', 'Tata CLiQ', 'Ajio', 'Flipkart'];

function buildMockItems(query: string): ApifyShoppingItem[] {
  const count = Math.min(getShoppingMaxResultsPerQuery(), 5);
  return Array.from({ length: count }, (_, i) => {
    const seed = parseInt(descriptorHash(`${query}#${i}`), 16);
    const merchant = MOCK_MERCHANTS[seed % MOCK_MERCHANTS.length];
    const slug = query.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return {
      title: `${query.replace(/\b\w/g, c => c.toUpperCase())} — Option ${i + 1}`,
      merchant,
      productUrl: `https://mock.${merchant.toLowerCase().replace(/[^a-z]/g, '')}.example/${slug}/${i + 1}`,
      imageUrl: undefined,
      priceNumeric: 799 + (seed % 4200),
      currency: 'INR',
      rating: 3.5 + ((seed >> 4) % 15) / 10,
      reviewCount: 20 + (seed % 900),
      position: i + 1,
      query,
    };
  });
}
