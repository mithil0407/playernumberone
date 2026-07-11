// Gemini intelligence for the shopping-links pipeline: exactly two batched
// Flash calls per report — one to turn every unique garment descriptor into a
// high-precision Google Shopping query, one to re-rank fetched candidates.
//
// Both calls are best-effort: any failure degrades to a deterministic fallback
// (normalized descriptor as query / Apify position order at 0.5 confidence).
// The pipeline never dies because of this module.

import { GoogleGenAI } from '@google/genai';
import type { ApifyShoppingItem } from './apifyShoppingClient';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const SHOPPING_TEXT_MODEL = process.env.GEMINI_MAN_TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

export const MAN_SHOPPING_LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface ShoppingQueryInput {
  hash: string;
  slot: string;
  descriptor: string;
  normalized: string;
  shoppingTranslation: string;
  acceptableSubstitutes: string;
}

export interface RerankInput {
  hash: string;
  descriptor: string;
  candidates: ApifyShoppingItem[];
}

export interface RerankPick {
  index: number;
  confidence: number;
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 4_000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const isTransient =
        err instanceof SyntaxError ||
        msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') ||
        msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') ||
        msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('overloaded');
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[manShoppingIntelligence] attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${delayMs / 1000}s`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function cleanJson(text: string): string {
  const stripped = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first !== -1 && last > first) return stripped.slice(first, last + 1);
  return stripped;
}

async function callGeminiJSON(prompt: string): Promise<unknown> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: SHOPPING_TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return JSON.parse(cleanJson(response.text ?? ''));
  });
}

function fallbackQuery(garment: Pick<ShoppingQueryInput, 'normalized'>): string {
  return /\bmen\b/.test(garment.normalized) ? garment.normalized : `${garment.normalized} men`;
}

const QUERY_GEN_PROMPT = `You convert stylist garment descriptions into Google Shopping search queries for INDIAN online retail (Myntra, Amazon.in, Ajio, Tata CLiQ, Flipkart).

Rules for each query:
- Keep colour, fabric and garment type. Keep the fit only when it matters for purchase (slim / relaxed / tapered).
- Drop styling instructions (tucked, sleeves rolled, layered open) and stylist prose.
- Translate stylist vocabulary into retailer vocabulary a shopper would type (use the SHOPPING TRANSLATION hint when given).
- Always include the word "men".
- 4–8 words, lowercase, no punctuation.

Return ONLY JSON: {"queries":[{"hash":"<hash>","query":"<query>"}]} with exactly one entry per input garment, using each garment's hash verbatim.`;

// ONE batched call for all unique garments in the report. On failure every
// garment falls back to its normalized descriptor + "men".
export async function generateShoppingQueries(
  garments: ShoppingQueryInput[],
): Promise<Map<string, string>> {
  const queries = new Map<string, string>(garments.map(g => [g.hash, fallbackQuery(g)]));
  if (garments.length === 0) return queries;

  const payload = garments.map(g => ({
    hash: g.hash,
    slot: g.slot,
    garment: g.descriptor,
    shoppingTranslation: g.shoppingTranslation || undefined,
    acceptableSubstitutes: g.acceptableSubstitutes || undefined,
  }));

  try {
    const raw = await callGeminiJSON(`${QUERY_GEN_PROMPT}\n\nGARMENTS:\n${JSON.stringify(payload, null, 1)}`);
    const entries = (raw as { queries?: Array<{ hash?: unknown; query?: unknown }> })?.queries;
    if (!Array.isArray(entries)) throw new Error('missing queries array');

    for (const entry of entries) {
      const hash = typeof entry.hash === 'string' ? entry.hash : '';
      const query = typeof entry.query === 'string' ? entry.query.trim().toLowerCase() : '';
      if (hash && queries.has(hash) && query.length >= 3) {
        queries.set(hash, /\bmen\b/.test(query) ? query : `${query} men`);
      }
    }
  } catch (err) {
    console.warn(`[manShoppingIntelligence] query generation failed, using fallback queries: ${err instanceof Error ? err.message : String(err)}`);
  }

  return queries;
}

const RERANK_PROMPT = `You are matching real e-commerce products to a stylist's garment specification for an Indian male client.

For each garment, pick the up-to-3 BEST matching candidates by index. Judge:
- Garment type must match (a polo is not an oxford shirt; sneakers are not loafers).
- Colour must match or be a very close neighbour.
- Fabric should match when the title states it.
- Must be a men's product.
- Price should be sane for the garment type in INR (reject ₹150 "leather" shoes and absurd outliers).

Give each pick a confidence 0.0–1.0 (1.0 = certain exact match). If no candidate is acceptable, return an empty picks array for that garment.

Return ONLY JSON: {"rankings":[{"hash":"<hash>","picks":[{"i":<candidateIndex>,"confidence":<0-1>}]}]} with one entry per garment, hashes verbatim.`;

function fallbackPicks(candidates: ApifyShoppingItem[], maxPicks: number): RerankPick[] {
  return candidates.slice(0, maxPicks).map((_, index) => ({ index, confidence: 0.5 }));
}

// ONE batched call re-ranking every unique garment's candidates. Candidates are
// trimmed to title/merchant/price to keep tokens flat. Falls back to Apify
// position order at 0.5 confidence on any failure.
export async function rerankShoppingCandidates(
  garments: RerankInput[],
  maxPicks = 3,
): Promise<Map<string, RerankPick[]>> {
  const picks = new Map<string, RerankPick[]>(
    garments.map(g => [g.hash, fallbackPicks(g.candidates, maxPicks)]),
  );
  const rankable = garments.filter(g => g.candidates.length > 0);
  if (rankable.length === 0) return picks;

  const payload = rankable.map(g => ({
    hash: g.hash,
    garment: g.descriptor,
    candidates: g.candidates.map((c, i) => ({
      i,
      title: c.title.slice(0, 120),
      merchant: c.merchant,
      price: c.priceNumeric,
    })),
  }));

  try {
    const raw = await callGeminiJSON(`${RERANK_PROMPT}\n\nGARMENTS:\n${JSON.stringify(payload, null, 1)}`);
    const entries = (raw as { rankings?: Array<{ hash?: unknown; picks?: unknown }> })?.rankings;
    if (!Array.isArray(entries)) throw new Error('missing rankings array');

    for (const entry of entries) {
      const hash = typeof entry.hash === 'string' ? entry.hash : '';
      const garment = rankable.find(g => g.hash === hash);
      if (!garment || !Array.isArray(entry.picks)) continue;

      const seen = new Set<number>();
      const validated: RerankPick[] = [];
      for (const pick of entry.picks as Array<{ i?: unknown; confidence?: unknown }>) {
        const index = typeof pick.i === 'number' ? Math.floor(pick.i) : -1;
        if (index < 0 || index >= garment.candidates.length || seen.has(index)) continue;
        seen.add(index);
        const confidence = typeof pick.confidence === 'number'
          ? Math.min(Math.max(pick.confidence, 0), 1)
          : 0.5;
        validated.push({ index, confidence });
        if (validated.length >= maxPicks) break;
      }
      // An explicit empty picks array is a real signal ("nothing matches"),
      // distinct from a parse failure — keep it.
      picks.set(hash, validated);
    }
  } catch (err) {
    console.warn(`[manShoppingIntelligence] re-rank failed, using position order: ${err instanceof Error ? err.message : String(err)}`);
  }

  return picks;
}
