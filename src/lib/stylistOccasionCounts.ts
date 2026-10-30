/**
 * The occasions a women's Blueprint groups its outfits by, and how many
 * outfits each one gets.
 *
 * The occasions match what clients tick on the consultation form. The split is
 * suggested from her answers (what she ticked, her job, upcoming events) and the
 * stylist can change it before generating; the stylist's numbers are saved in
 * the intake's workspace_overrides.outfit_occasion_counts.
 *
 * Pure: used by the outfit engine and by the stylist's client page.
 */

export const OUTFIT_OCCASIONS = ['Work', 'Everyday', 'Party', 'Festive', 'Travel', 'Date'] as const;
export type OutfitOccasion = typeof OUTFIT_OCCASIONS[number];
export type OccasionCounts = Record<OutfitOccasion, number>;

export const OCCASION_LABELS: Record<OutfitOccasion, string> = {
  Work: 'Work',
  Everyday: 'Everyday',
  Party: 'Party & evening',
  Festive: 'Festive & weddings',
  Travel: 'Travel & vacation',
  Date: 'Date & dinner',
};

/** The tag each occasion matches in outfitlibrarytags.json. */
export const OCCASION_TAG: Record<OutfitOccasion, 'work' | 'everyday' | 'party' | 'festive' | 'travel' | 'date'> = {
  Work: 'work',
  Everyday: 'everyday',
  Party: 'party',
  Festive: 'festive',
  Travel: 'travel',
  Date: 'date',
};

/** Older reports filed outfits under four capsules. */
export function toOutfitOccasion(value: unknown): OutfitOccasion {
  const text = String(value ?? '').trim().toLowerCase();
  const direct = OUTFIT_OCCASIONS.find(occasion => occasion.toLowerCase() === text || OCCASION_LABELS[occasion].toLowerCase() === text);
  if (direct) return direct;
  if (/professional|work|office/.test(text)) return 'Work';
  if (/social|party|evening/.test(text)) return 'Party';
  if (/occasion|festive|wedding|function/.test(text)) return 'Festive';
  if (/travel|vacation|holiday/.test(text)) return 'Travel';
  if (/date|dinner/.test(text)) return 'Date';
  return 'Everyday';
}

/** How much of a set each occasion gets when she ticks it. */
const WEIGHT: OccasionCounts = { Work: 7, Everyday: 6, Party: 3, Festive: 3, Travel: 2, Date: 2 };
const MIN_PER_OCCASION = 2;

interface OccasionSource {
  lifestyle_context?: Record<string, unknown> | null;
  raw_consultation_notes?: string | null;
}

function textOf(value: unknown): string {
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(textOf).join(' ');
  return typeof value === 'string' ? value : '';
}

/** The occasions her form points to, from the ticked boxes and her upcoming events. */
export function occasionsFromForm(source: OccasionSource): OutfitOccasion[] {
  const life = (source.lifestyle_context ?? {}) as Record<string, unknown>;
  const ticked = textOf(life.occasions).toLowerCase();
  const events = `${textOf(life.upcoming_events)} ${textOf(life.consultation_reason)}`.toLowerCase();
  const occupation = textOf(life.occupation).toLowerCase();
  const found = new Set<OutfitOccasion>();
  if (/work|office/.test(ticked)) found.add('Work');
  if (/daily|everyday|casual/.test(ticked)) found.add('Everyday');
  if (/party|event/.test(ticked)) found.add('Party');
  if (/festive|wedding|function/.test(ticked)) found.add('Festive');
  if (/travel|vacation/.test(ticked)) found.add('Travel');
  if (/date|dinner/.test(ticked)) found.add('Date');
  // An upcoming event she named is an occasion even if the box was not ticked.
  if (/wedding|shaadi|sangeet|mehendi|mehndi|haldi|reception|diwali|puja|pooja|navratri|dandiya|garba|festival|festive|function|karva|eid|engagement/.test(events)) found.add('Festive');
  if (/vacation|holiday|trip|travel|honeymoon|tour/.test(events)) found.add('Travel');
  if (/conference|interview|presentation|office|meeting|work/.test(events) && !/homemaker|housewife|stay at home/.test(occupation)) found.add('Work');
  if (/birthday|party|anniversary|cocktail|celebration/.test(events)) found.add('Party');
  if (/\bdate\b|dinner/.test(events)) found.add('Date');
  if (!found.size) {
    if (!/homemaker|housewife|retired|student/.test(occupation)) found.add('Work');
    found.add('Everyday');
    found.add('Party');
  }
  found.add('Everyday');
  return OUTFIT_OCCASIONS.filter(occasion => found.has(occasion));
}

function emptyCounts(): OccasionCounts {
  return { Work: 0, Everyday: 0, Party: 0, Festive: 0, Travel: 0, Date: 0 };
}

/** The suggested split for her form, adding up to the outfit count. */
export function suggestOccasionCounts(source: OccasionSource, outfitCount: number): OccasionCounts {
  const occasions = occasionsFromForm(source);
  const counts = emptyCounts();
  const totalWeight = occasions.reduce((sum, occasion) => sum + WEIGHT[occasion], 0);
  const exact = occasions.map(occasion => ({ occasion, value: (outfitCount * WEIGHT[occasion]) / totalWeight }));
  for (const { occasion, value } of exact) counts[occasion] = Math.max(MIN_PER_OCCASION, Math.floor(value));
  // Largest remainders take the outfits left; minimums are paid for by the biggest.
  let left = outfitCount - occasions.reduce((sum, occasion) => sum + counts[occasion], 0);
  const byRemainder = [...exact].sort((a, b) => (b.value % 1) - (a.value % 1) || WEIGHT[b.occasion] - WEIGHT[a.occasion]);
  for (let index = 0; left > 0; index += 1) { counts[byRemainder[index % byRemainder.length].occasion] += 1; left -= 1; }
  while (left < 0) {
    const biggest = [...occasions].sort((a, b) => counts[b] - counts[a])[0];
    if (counts[biggest] <= MIN_PER_OCCASION) break;
    counts[biggest] -= 1;
    left += 1;
  }
  return counts;
}

/** A stylist's saved split, if it is valid for this outfit count. */
export function parseOccasionCounts(value: unknown, outfitCount: number): OccasionCounts | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const counts = emptyCounts();
  for (const occasion of OUTFIT_OCCASIONS) {
    const raw = Number(record[occasion] ?? 0);
    if (!Number.isInteger(raw) || raw < 0 || raw > outfitCount) return null;
    counts[occasion] = raw;
  }
  const total = OUTFIT_OCCASIONS.reduce((sum, occasion) => sum + counts[occasion], 0);
  return total === outfitCount ? counts : null;
}

/** The stylist's split when she set one, otherwise the suggestion from the form. */
export function occasionCountsFor(
  source: OccasionSource & { workspace_overrides?: unknown },
  outfitCount: number,
): { counts: OccasionCounts; setByStylist: boolean } {
  const overrides = (source.workspace_overrides && typeof source.workspace_overrides === 'object' ? source.workspace_overrides : {}) as Record<string, unknown>;
  const saved = parseOccasionCounts(overrides.outfit_occasion_counts, outfitCount);
  return saved ? { counts: saved, setByStylist: true } : { counts: suggestOccasionCounts(source, outfitCount), setByStylist: false };
}
