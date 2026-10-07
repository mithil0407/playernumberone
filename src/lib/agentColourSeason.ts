// The colour season is decided here, from what the model measured in the selfie
// (undertone, depth, contrast, chroma), not picked by the model. Left to itself
// the model called 39 of the first 42 people "Deep Autumn": almost every Indian
// selfie has dark hair and warm light, and it read that as "deep, warm, high
// contrast" every time. Pure, so it can be tested.

export type Undertone = 'warm' | 'cool' | 'neutral' | 'olive';
export type Depth = 'light' | 'medium' | 'deep';
export type Contrast = 'low' | 'medium' | 'high';
export type Chroma = 'muted' | 'clear';

export const SEASONS = [
  'Light Spring', 'Warm Spring', 'Bright Spring',
  'Light Summer', 'Cool Summer', 'Soft Summer',
  'Soft Autumn', 'Warm Autumn', 'Deep Autumn',
  'Deep Winter', 'Cool Winter', 'Bright Winter',
] as const;
export type Season = typeof SEASONS[number];

export interface SeasonInputs {
  undertone: Undertone;
  depth: Depth;
  contrast: Contrast;
  chroma: Chroma;
}

/**
 * The 12-season map, led by the strongest trait:
 * - deep skin: Deep Autumn (warm/olive) or Deep Winter (cool, or neutral with clear high contrast);
 * - light skin: Light Spring (warm) or Light Summer (cool/olive), unless the contrast is high and clear;
 * - medium skin: muted → Soft Autumn / Soft Summer; clear + high contrast → Bright Spring / Bright Winter;
 *   otherwise by temperature: Warm Autumn / Warm Spring, Cool Summer / Cool Winter.
 */
export function seasonFor(inputs: SeasonInputs): Season {
  const { undertone, depth, contrast, chroma } = inputs;
  const warm = undertone === 'warm';
  const cool = undertone === 'cool';
  const clearHigh = chroma === 'clear' && contrast === 'high';

  if (depth === 'deep') {
    if (cool) return 'Deep Winter';
    if (undertone === 'neutral' && clearHigh) return 'Deep Winter';
    return 'Deep Autumn';
  }
  if (depth === 'light') {
    if (clearHigh) return cool ? 'Bright Winter' : 'Bright Spring';
    if (warm) return 'Light Spring';
    if (cool) return 'Light Summer';
    return chroma === 'muted' ? 'Soft Summer' : 'Light Spring';
  }
  // Medium depth: the most common in India, and where the old reading collapsed.
  if (chroma === 'muted') return cool ? 'Soft Summer' : 'Soft Autumn';
  if (clearHigh) return cool || undertone === 'neutral' ? 'Bright Winter' : 'Bright Spring';
  if (warm) return chroma === 'clear' ? 'Warm Spring' : 'Warm Autumn';
  if (cool) return contrast === 'high' ? 'Cool Winter' : 'Cool Summer';
  if (undertone === 'olive') return contrast === 'low' ? 'Soft Autumn' : 'Warm Autumn';
  return contrast === 'low' ? 'Soft Summer' : 'Soft Autumn';
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : null;
}

function level(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 10 ? number : null;
}

/** What the model saw, on 1-10 scales (skin on the Monk Skin Tone scale; hair and eyes 10 = black). */
export interface ColourObservations {
  undertone: Undertone;
  skin: number;
  hair: number;
  eyes: number;
  chroma: Chroma;
}

export function parseColourObservations(raw: Record<string, unknown>): ColourObservations | null {
  const undertone = pick(raw.undertone, ['warm', 'cool', 'neutral', 'olive'] as const);
  const chroma = pick(raw.chroma, ['muted', 'clear'] as const);
  const skin = level(raw.skin_depth);
  const hair = level(raw.hair_depth);
  const eyes = level(raw.eye_depth);
  return undertone && chroma && skin && hair && eyes ? { undertone, chroma, skin, hair, eyes } : null;
}

/**
 * Depth and contrast are worked out here rather than picked by the model, which
 * chose the middle option every time. Depth is the overall value, led by the
 * skin; contrast is how far the hair and eyes stand from the skin — so black
 * hair on fair skin is high, on deep skin low.
 */
export function readingsFrom(observations: ColourObservations): SeasonInputs {
  const features = (observations.hair + observations.eyes) / 2;
  const overall = 0.6 * observations.skin + 0.4 * features;
  const depth: Depth = overall <= 4.5 ? 'light' : overall >= 7 ? 'deep' : 'medium';
  const gap = Math.max(observations.hair, observations.eyes) - observations.skin;
  const contrast: Contrast = gap >= 5 ? 'high' : gap >= 3 ? 'medium' : 'low';
  return { undertone: observations.undertone, depth, contrast, chroma: observations.chroma };
}

/** Other names for the same season: True Autumn is Warm Autumn, Dark is Deep, Clear is Bright. */
function canonicalSeason(name: string) {
  const value = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return value
    .replace(/^true (autumn|spring)$/, 'warm $1')
    .replace(/^true (summer|winter)$/, 'cool $1')
    .replace(/^dark /, 'deep ')
    .replace(/^clear /, 'bright ');
}

export function sameSeason(a: string, b: string) {
  return canonicalSeason(a) === canonicalSeason(b);
}

/** How to read the selfie, given to the model with the send_colour_card tool. */
export const READING_GUIDE = `How to read the selfie — look, don't assume:
- skin_depth: the Monk Skin Tone scale, 1 (very fair) to 10 (deepest). Judge the jaw and neck, not a highlighted cheek. Indian skin spans roughly 3 to 9 — use the whole range; most people are NOT a 5 or 6 by default.
- hair_depth and eye_depth: 1 (light/blonde/grey) to 10 (jet black). Dark brown hair is 7-8, black 9-10; light brown or hazel eyes 5-6, dark brown 8-9.
- undertone: golden/yellow-peach = warm; pink/rosy/bluish = cool; greenish-grey or khaki = olive; can't tell = neutral. Warm indoor light makes everyone look warm: if the whole photo is yellow, judge from the whites of the eyes and teeth, and lean neutral.
- chroma: clear = bright, defined features — crisp whites of the eyes, a sharp iris against the white, skin that looks luminous; saturated colour near the face looks natural on them. muted = soft features, eyes that blend into the skin, a soft or matte look; bright colour looks loud on them.
Depth, contrast and the season are worked out from these numbers; describe what you actually see.`;
