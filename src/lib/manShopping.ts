// Shared types + pure helpers for the man report shopping-links feature.
//
// Shopping state lives in man_reports.shopping_data (sibling of report_data so
// concurrent stylist edits that rewrite report_data wholesale can never clobber
// pipeline writes). A slot's links are valid only while its descriptorHash still
// matches the hash of the currently parsed Section 4 text — staleness is checked
// at read time, so outfit edits never have to write into shopping state.

import { parseManOutfitsFromSection, stripOutfitHex, type ParsedManOutfit } from './manOutfitSection';
import { hasPlaceholderOutfitValue } from './manOutfitPlaceholders';

export type ManShoppingSlotName = 'top' | 'bottom' | 'layer' | 'footwear';

// Accessories are excluded: descriptors are multi-item ("brown belt + steel watch")
// and low purchase-intent, so links there are noise for cost.
export const MAN_SHOPPING_SLOT_NAMES: ManShoppingSlotName[] = ['top', 'bottom', 'layer', 'footwear'];

export type ManShoppingSlotKey = `${number}:${ManShoppingSlotName}`;

export type ManShoppingSlotStatus =
  | 'ready'
  | 'low_confidence'
  | 'no_results'
  | 'manual'
  | 'skipped'
  | 'stale';

export interface ManProductLink {
  title: string;
  merchant: string;
  url: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  source: 'apify' | 'cache' | 'manual' | 'fallback_search';
  confidence?: number;
}

export interface ManShoppingSlot {
  descriptor: string;
  descriptorHash: string;
  query: string;
  candidates: ManProductLink[];
  selected: ManProductLink[];
  status: ManShoppingSlotStatus;
}

export type ManShoppingPipelineStatus = 'idle' | 'fetching' | 'ranking' | 'ready' | 'error';

export interface ManShoppingState {
  version: 1;
  status: ManShoppingPipelineStatus;
  apifyRunId?: string;
  apifyDatasetId?: string;
  // hash → query for the in-flight Apify run, so a resumed invocation can demux
  // dataset items (keyed by query string) back to garment hashes.
  pendingQueries?: Record<string, string>;
  startedAt?: string;
  updatedAt: string;
  error?: string;
  slots: Partial<Record<ManShoppingSlotKey, ManShoppingSlot>>;
}

export interface ManGarmentSlot {
  key: ManShoppingSlotKey;
  outfitNumber: number;
  slot: ManShoppingSlotName;
  descriptor: string;
  normalized: string;
  hash: string;
  context: string;
  shoppingTranslation: string;
  acceptableSubstitutes: string;
}

// A 'fetching' state older than this is treated as dead and may be restarted
// (same convention as the text pipeline's stale-generating window).
export const MAN_SHOPPING_STALE_FETCH_MS = 10 * 60 * 1000;

export const MAN_SHOPPING_MAX_SELECTED = 3;

export function createEmptyShoppingState(): ManShoppingState {
  return { version: 1, status: 'idle', updatedAt: new Date().toISOString(), slots: {} };
}

export function buildShoppingSlotKey(outfitNumber: number, slot: ManShoppingSlotName): ManShoppingSlotKey {
  return `${outfitNumber}:${slot}`;
}

function isShoppableValue(value: string): boolean {
  if (!value || hasPlaceholderOutfitValue(value)) return false;
  return !/^(?:none|no\s+layer|optional)\b\.?$/i.test(value.trim());
}

// Descriptors follow "[colour + fabric + garment type — fit — styling]".
// Keep the garment and fit segments (they define what to buy), drop trailing
// styling clauses ("tucked", "sleeves rolled") so cosmetic edits neither change
// the cache key nor invalidate fetched links.
export function normalizeDescriptor(descriptor: string): string {
  const segments = stripOutfitHex(descriptor)
    .replace(/\*+/g, '')
    .split(/\s+[—–]\s+|\s+-\s+/)
    .map(segment => segment.trim())
    .filter(Boolean);

  return segments
    .slice(0, 2)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function descriptorHash(normalized: string): string {
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function collectGarmentSlots(s4Text: string): ManGarmentSlot[] {
  const slots: ManGarmentSlot[] = [];
  const seenOutfitNumbers = new Set<number>();

  for (const outfit of parseManOutfitsFromSection(s4Text)) {
    // Duplicate-numbered outfits are unaddressable by number-keyed slot keys;
    // skip repeats (mirrors the per-outfit action guards in the review UI).
    if (seenOutfitNumbers.has(outfit.number)) continue;
    seenOutfitNumbers.add(outfit.number);

    for (const slot of MAN_SHOPPING_SLOT_NAMES) {
      const descriptor = outfit[slot];
      if (!isShoppableValue(descriptor)) continue;

      const normalized = normalizeDescriptor(descriptor);
      if (!normalized) continue;

      slots.push({
        key: buildShoppingSlotKey(outfit.number, slot),
        outfitNumber: outfit.number,
        slot,
        descriptor,
        normalized,
        hash: descriptorHash(normalized),
        context: outfit.context,
        shoppingTranslation: cleanOutfitField(outfit.shoppingTranslation),
        acceptableSubstitutes: cleanOutfitField(outfit.acceptableSubstitutes),
      });
    }
  }

  return slots;
}

function cleanOutfitField(value: string): string {
  return hasPlaceholderOutfitValue(value) ? '' : value;
}

// Zero-cost degradation: a pre-built Google Shopping search the client can open
// when we have no product links for a slot.
export function buildFallbackSearchUrl(queryOrDescriptor: string): string {
  const base = normalizeDescriptor(queryOrDescriptor) || queryOrDescriptor.toLowerCase().trim();
  const query = /\bmen\b/.test(base) ? base : `${base} men`;
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&gl=in`;
}

export interface ManTrustedBrandSearch {
  category: string;
  brands: readonly string[];
  categorySpecialists: readonly string[];
  popularBrands: readonly string[];
  url: string;
}

interface ManTrustedBrandRule {
  category: string;
  pattern: RegExp;
  brands: readonly string[];
}

const GENERAL_POPULAR_MAN_BRANDS = ['H&M', 'Zara', 'Westside'] as const;

function withPopularBrands(...categorySpecialists: string[]): readonly string[] {
  return [...categorySpecialists, ...GENERAL_POPULAR_MAN_BRANDS];
}

// Ordered from specific to broad so, for example, a leather sneaker is treated
// as a sneaker rather than generic footwear. These are deliberately compact
// shortlists: three category specialists are balanced with three popular,
// accessible brands that give clients more choice without becoming exhaustive.
const MAN_TRUSTED_BRAND_RULES: readonly ManTrustedBrandRule[] = [
  {
    category: 'Sneakers',
    pattern: /\b(?:sneakers?|trainers?|running shoes?|court shoes?)\b/,
    brands: withPopularBrands('Adidas', 'Puma', 'New Balance'),
  },
  {
    category: 'Formal footwear',
    pattern: /\b(?:derbys?|derbies|oxfords?|brogues?|loafers?|monk straps?|formal shoes?|dress shoes?|chelsea boots?)\b/,
    brands: withPopularBrands('Clarks', 'Hush Puppies', 'Ruosh'),
  },
  {
    category: 'Denim',
    pattern: /\b(?:denim|jean|jeans)\b/,
    brands: withPopularBrands("Levi's", 'Lee', 'Wrangler'),
  },
  {
    category: 'Tailoring',
    pattern: /\b(?:blazers?|suits?|tuxedos?|dress shirts?|formal shirts?|formal trousers?|tailored trousers?|pleated trousers?)\b/,
    brands: withPopularBrands('Louis Philippe', 'Blackberrys', 'Van Heusen'),
  },
  {
    category: 'Knitwear & polos',
    pattern: /\b(?:knitwear|knits?|sweaters?|jumpers?|cardigans?|half[ -]?zips?|quarter[ -]?zips?|polos?|rugby shirts?|henleys?)\b/,
    brands: withPopularBrands('Marks & Spencer', 'Uniqlo', 'U.S. Polo Assn.'),
  },
  {
    category: 'Outerwear',
    pattern: /\b(?:jackets?|overshirts?|shackets?|coats?|parkas?|bombers?|windbreakers?)\b/,
    brands: withPopularBrands('Marks & Spencer', 'Uniqlo', 'Jack & Jones'),
  },
  {
    category: 'Activewear',
    pattern: /\b(?:joggers?|track pants?|track trousers?|sweatshirts?|hoodies?|performance tees?|gym)\b/,
    brands: withPopularBrands('Nike', 'Adidas', 'Puma'),
  },
  {
    category: 'Smart casual',
    pattern: /\b(?:shirts?|chinos?|trousers?|t-shirts?|tees?|shorts?)\b/,
    brands: withPopularBrands('Marks & Spencer', 'Uniqlo', 'Selected Homme'),
  },
];

const DEFAULT_MAN_TRUSTED_BRANDS = {
  category: 'Menswear',
  brands: withPopularBrands('Marks & Spencer', 'Uniqlo', 'Selected Homme'),
} as const;

export function buildTrustedBrandSearch(queryOrDescriptor: string): ManTrustedBrandSearch {
  const normalized = normalizeDescriptor(queryOrDescriptor) || queryOrDescriptor.toLowerCase().trim();
  const match = MAN_TRUSTED_BRAND_RULES.find(rule => rule.pattern.test(normalized))
    ?? DEFAULT_MAN_TRUSTED_BRANDS;
  const base = /\bmen\b/.test(normalized) ? normalized : `${normalized} men`;
  const brandFilter = match.brands.map(brand => `"${brand}"`).join(' OR ');
  const query = `${base} (${brandFilter})`;

  return {
    category: match.category,
    brands: match.brands,
    categorySpecialists: match.brands.slice(0, 3),
    popularBrands: GENERAL_POPULAR_MAN_BRANDS,
    url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&gl=in`,
  };
}

export function isShoppingSlotCurrent(slot: ManShoppingSlot | undefined, currentHash: string): boolean {
  return !!slot && slot.descriptorHash === currentHash && slot.status !== 'stale';
}

// Slot keys that need (re)fetching: present in the current Section 4 text but
// missing from state or fetched against different descriptor text.
export function diffStaleSlotKeys(state: ManShoppingState | null | undefined, s4Text: string): ManShoppingSlotKey[] {
  return collectGarmentSlots(s4Text)
    .filter(garment => !isShoppingSlotCurrent(state?.slots?.[garment.key], garment.hash))
    .map(garment => garment.key);
}

// Pure staleness stamping (DB write happens in the pipeline lib): marks slots
// whose stored hash no longer matches the new Section 4 text.
export function applyStaleMarks(
  state: ManShoppingState,
  newS4Text: string,
): { next: ManShoppingState; changed: boolean } {
  const currentHashes = new Map(collectGarmentSlots(newS4Text).map(garment => [garment.key, garment.hash]));
  let changed = false;
  const slots: ManShoppingState['slots'] = {};

  for (const [key, slot] of Object.entries(state.slots) as Array<[ManShoppingSlotKey, ManShoppingSlot]>) {
    const currentHash = currentHashes.get(key);
    if (slot.status !== 'stale' && currentHash !== undefined && currentHash !== slot.descriptorHash) {
      slots[key] = { ...slot, status: 'stale' };
      changed = true;
    } else {
      slots[key] = slot;
    }
  }

  if (!changed) return { next: state, changed: false };
  return { next: { ...state, slots, updatedAt: new Date().toISOString() }, changed: true };
}

export function isShoppingFetchInFlight(state: ManShoppingState | null | undefined): boolean {
  if (!state || (state.status !== 'fetching' && state.status !== 'ranking')) return false;
  const startedAt = state.startedAt ? new Date(state.startedAt).getTime() : 0;
  return Date.now() - startedAt < MAN_SHOPPING_STALE_FETCH_MS;
}

export function shoppingNeedsFetch(state: ManShoppingState | null | undefined, s4Text: string): boolean {
  if (isShoppingFetchInFlight(state)) return false;
  return diffStaleSlotKeys(state, s4Text).length > 0;
}

export type { ParsedManOutfit };
