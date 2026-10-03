import 'server-only';

// Fast product discovery for the agent: a web search restricted to trusted
// retailers. Results are candidates only — the agent may put them on a Look
// page, and the browser verifier then confirms stock, size and price on the
// retailer's real page before the client is told they are good to buy.

import type { Response as OpenAIResponse } from 'openai/resources/responses/responses';
import type { AgentLine } from '@/lib/agentClients';
import { AGENT_TEXT_MODEL, agentOpenAI } from '@/lib/agentLlm';
import { isSafeRetailUrl } from '@/lib/agentLookLinks';

export interface AgentRetailer {
  name: string;
  domain: string;
  lines: readonly AgentLine[];
  sports?: boolean;
  /**
   * The store blocks headless browsers, so its products cannot be checked unless
   * AGENT_BROWSER_WS_ENDPOINT points at a hosted browser. Ranked after checkable stores.
   * Tested 3 Oct 2026 from a residential connection.
   */
  blocksBrowser?: boolean;
}

export const AGENT_RETAILERS: readonly AgentRetailer[] = [
  { name: 'Myntra', domain: 'myntra.com', lines: ['man', 'woman'] },
  { name: 'AJIO', domain: 'ajio.com', lines: ['man', 'woman'], blocksBrowser: true },
  { name: 'Zara', domain: 'zara.com', lines: ['man', 'woman'] },
  { name: 'H&M', domain: 'hm.com', lines: ['man', 'woman'] },
  { name: 'Uniqlo', domain: 'uniqlo.com', lines: ['man', 'woman'], blocksBrowser: true },
  { name: 'Westside', domain: 'westside.com', lines: ['man', 'woman'] },
  { name: 'Marks & Spencer', domain: 'marksandspencer.in', lines: ['man', 'woman'] },
  { name: 'Tata CLiQ', domain: 'tatacliq.com', lines: ['man', 'woman'], blocksBrowser: true },
  { name: 'Fabindia', domain: 'fabindia.com', lines: ['man', 'woman'] },
  { name: 'Mango', domain: 'mango.com', lines: ['man', 'woman'] },
  { name: 'Nykaa Fashion', domain: 'nykaafashion.com', lines: ['woman'] },
  { name: 'W', domain: 'wforwoman.com', lines: ['woman'] },
  { name: 'Libas', domain: 'libas.in', lines: ['woman'] },
  { name: 'Biba', domain: 'biba.in', lines: ['woman'] },
  { name: 'Snitch', domain: 'snitch.com', lines: ['man'] },
  { name: 'Rare Rabbit', domain: 'thehouseofrare.com', lines: ['man'] },
  { name: 'Nike', domain: 'nike.com', lines: ['man', 'woman'], sports: true },
  { name: 'Adidas', domain: 'adidas.co.in', lines: ['man', 'woman'], sports: true },
  { name: 'Puma', domain: 'puma.com', lines: ['man', 'woman'], sports: true },
  { name: 'Decathlon', domain: 'decathlon.in', lines: ['man', 'woman'], sports: true },
];

export interface ProductCandidate {
  id: string;
  title: string;
  retailer: string;
  domain: string;
  url: string;
  priceInr: number | null;
  colour: string | null;
  imageUrl: string | null;
  note: string | null;
  /** The URL appeared as a citation in the search results, not only in model text. */
  cited: boolean;
}

export function retailerForUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AGENT_RETAILERS.find(retailer => host === retailer.domain || host.endsWith(`.${retailer.domain}`)) ?? null;
  } catch {
    return null;
  }
}

/** Rejects search, listing and category pages; only product detail pages are useful. */
export function looksLikeProductPage(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase();
    if (/\/(search|searchresults|catalogsearch|collections?|category|categories|shop-all|sale)(\/|$)/.test(path)) return false;
    if (['q', 'query', 'search', 'searchterm', 'rawquery'].some(key => url.searchParams.has(key))) return false;
    return path.split('/').filter(Boolean).length >= 1 && path !== '/';
  } catch {
    return false;
  }
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_|^gclid$|^fbclid$/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}

function citedUrls(response: OpenAIResponse) {
  const urls = new Set<string>();
  for (const output of response.output) {
    if (output.type !== 'message') continue;
    for (const content of output.content) {
      if (content.type !== 'output_text') continue;
      for (const annotation of content.annotations) {
        if (annotation.type === 'url_citation') urls.add(canonicalUrl(annotation.url));
      }
    }
  }
  return urls;
}

function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function searchProducts(input: {
  line: AgentLine;
  query: string;
  colours?: string[];
  budgetMaxInr?: number | null;
  retailerNames?: string[];
  sports?: boolean;
  idPrefix: string;
  limit?: number;
}): Promise<ProductCandidate[]> {
  const requested = (input.retailerNames ?? []).map(name => name.toLowerCase());
  const retailers = AGENT_RETAILERS.filter(retailer => (
    retailer.lines.includes(input.line)
    && (requested.length
      ? requested.some(name => retailer.name.toLowerCase().includes(name) || retailer.domain.includes(name))
      : Boolean(retailer.sports) === Boolean(input.sports))
  ));
  if (!retailers.length) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 5, 8));
  const department = input.line === 'man' ? 'menswear' : 'womenswear';

  const response = await agentOpenAI().responses.create({
    model: AGENT_TEXT_MODEL,
    input: `Find up to ${limit} specific ${department} products currently sold online in India that match this request.

REQUEST: ${input.query}
COLOURS: ${input.colours?.length ? input.colours.join(', ') : 'any that fit the request'}
BUDGET: ${input.budgetMaxInr ? `up to ₹${input.budgetMaxInr}` : 'not specified'}
STORES: ${retailers.map(retailer => retailer.name).join(', ')}

Only individual product pages (never search, category or listing pages). Reject wrong department, wrong garment type, and wrong colour.
Return ONLY a JSON array, no prose:
[{"title": "exact product name", "url": "product page URL", "price_inr": number or null, "colour": "colour as listed", "note": "why it fits, max 12 words"}]
Return [] if nothing is a strong match.`,
    tools: [{
      type: 'web_search',
      filters: { allowed_domains: retailers.map(retailer => retailer.domain) },
      search_context_size: 'medium',
      user_location: { type: 'approximate', country: 'IN', timezone: 'Asia/Kolkata' },
    }],
    tool_choice: 'required',
    reasoning: { effort: 'low' },
    max_output_tokens: 2_000,
    store: false,
    metadata: { workload: 'iconik_agent_product_search' },
  });

  const cited = citedUrls(response);
  const seen = new Set<string>();
  const candidates: ProductCandidate[] = [];
  for (const raw of extractJsonArray(response.output_text)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const url = typeof item.url === 'string' ? canonicalUrl(item.url.trim()) : '';
    const retailer = retailerForUrl(url);
    if (!retailer || !isSafeRetailUrl(url) || !looksLikeProductPage(url) || seen.has(url)) continue;
    seen.add(url);
    const price = typeof item.price_inr === 'number' && item.price_inr > 0 ? item.price_inr : null;
    if (input.budgetMaxInr && price && price > input.budgetMaxInr * 1.15) continue;
    candidates.push({
      id: `${input.idPrefix}${candidates.length + 1}`,
      title: typeof item.title === 'string' ? item.title.trim().slice(0, 160) : 'Product',
      retailer: retailer.name,
      domain: retailer.domain,
      url,
      priceInr: price,
      colour: typeof item.colour === 'string' ? item.colour.trim().slice(0, 60) : null,
      imageUrl: null,
      note: typeof item.note === 'string' ? item.note.trim().slice(0, 120) : null,
      cited: cited.has(url),
    });
    if (candidates.length >= limit) break;
  }
  // Cited URLs first (they came from the search results, not the model's memory),
  // then stores whose pages the browser can actually verify.
  const checkable = (candidate: ProductCandidate) => (
    process.env.AGENT_BROWSER_WS_ENDPOINT || !retailerForUrl(candidate.url)?.blocksBrowser ? 1 : 0
  );
  return candidates.sort((a, b) => (Number(b.cited) - Number(a.cited)) || (checkable(b) - checkable(a)));
}
