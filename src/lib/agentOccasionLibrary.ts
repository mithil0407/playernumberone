// The hand-picked outfit library behind occasion looks (ICONIK_Mens_Library_Diwali.md):
// parse it, then rank the looks for one man from his report — his colours near
// the face, his style, his height — so the designer chooses between real,
// buyable outfits instead of inventing one.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findManColourMentions,
  readManClientColouring,
  scoreManColourAwayFromFace,
  scoreManColourNearFace,
  type ManClientColouring,
} from './manOutfitColour.ts';

export interface OccasionOutfit {
  id: number;
  setting: string;
  top: string;
  bottom: string;
  layer: string | null;
  footwear: string;
  accessories: string | null;
  styling: string;
  family: string;
  vibe: 'traditional' | 'modern' | 'fusion';
  boldness: number;
}

type AnyRecord = Record<string, unknown>;

const LIBRARY_FILES: Record<string, string> = {
  diwali: 'src/lib/ICONIK_Mens_Library_Diwali.md',
};

function field(block: string, label: string) {
  return block.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))?.[1]?.trim() ?? '';
}

export function parseOccasionLibrary(raw: string): OccasionOutfit[] {
  const headers = Array.from(raw.matchAll(/^\*\*OUTFIT\s+(\d+)\s+—\s+[A-Z]+\s+([^*\n]+)\*\*$/gm));
  return headers.flatMap((header, index) => {
    const block = raw.slice(header.index ?? 0, headers[index + 1]?.index ?? raw.length);
    const layer = field(block, 'LAYER');
    const accessories = field(block, 'ACCESSORIES');
    const vibe = field(block, 'VIBE').toLowerCase();
    const outfit: OccasionOutfit = {
      id: Number(header[1]),
      setting: header[2].trim(),
      top: field(block, 'TOP'),
      bottom: field(block, 'BOTTOM'),
      layer: /^no layer$/i.test(layer) || !layer ? null : layer,
      footwear: field(block, 'FOOTWEAR'),
      accessories: /^none$/i.test(accessories) || !accessories ? null : accessories,
      styling: field(block, 'STYLING'),
      family: field(block, 'SILHOUETTE_FAMILY'),
      vibe: vibe === 'modern' || vibe === 'fusion' ? vibe : 'traditional',
      boldness: Math.min(5, Math.max(1, Number(field(block, 'BOLDNESS')) || 3)),
    };
    return outfit.top && outfit.bottom && outfit.footwear && outfit.family ? [outfit] : [];
  });
}

const cache = new Map<string, OccasionOutfit[]>();

export function loadOccasionLibrary(key: string): OccasionOutfit[] {
  const file = LIBRARY_FILES[key];
  if (!file) throw new Error(`No outfit library for ${key}`);
  if (!cache.has(key)) cache.set(key, parseOccasionLibrary(readFileSync(join(process.cwd(), file), 'utf-8')));
  return cache.get(key)!;
}

/** The look as one line, piece by piece: what the image and the product search work from. */
export function occasionOutfitText(outfit: OccasionOutfit) {
  return [outfit.top, outfit.layer, outfit.bottom, outfit.footwear, outfit.accessories].filter(Boolean).join('; ');
}

function names(value: unknown): Array<{ name: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === 'string') return [{ name: item }];
    const name = item && typeof item === 'object' ? (item as AnyRecord).name : null;
    return typeof name === 'string' ? [{ name }] : [];
  });
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase();
  if (Array.isArray(value)) return value.map(text).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(text).join(' ');
  return '';
}

function record(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

/** His colouring, read from the Style Passport profile (manPassportProfile). */
export function colouringFromProfile(profile: AnyRecord): ManClientColouring {
  const colour = record(profile.colour);
  return readManClientColouring({
    season: typeof colour.season === 'string' ? colour.season : undefined,
    undertone: typeof colour.undertone === 'string' ? colour.undertone : undefined,
    skin_tone_depth: typeof colour.skin_tone_depth === 'string' ? colour.skin_tone_depth : undefined,
    primary_palette: names(colour.primary_palette),
    neutral_base_colours: names(colour.neutral_base_colours),
    accent_colours: names(colour.accent_colours),
    colours_to_avoid: names(colour.colours_to_avoid),
  });
}

function leadColour(piece: string | null) {
  return piece ? findManColourMentions(piece)[0]?.info ?? null : null;
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

/**
 * How well a look suits him, or null when it puts a colour he should avoid near
 * his face. Colour near the face counts most; then his style and height. A small
 * per-client jitter keeps men with the same palette from all getting one look.
 */
export function scoreOccasionOutfit(outfit: OccasionOutfit, profile: AnyRecord, colouring: ManClientColouring, seed = ''): number | null {
  // A jacket or stole sits closest to the face; the kurta or shirt shows too.
  const nearFace = [leadColour(outfit.layer), leadColour(outfit.top)].filter((info): info is NonNullable<typeof info> => Boolean(info));
  if (!nearFace.length) return null;
  const faceScores = nearFace.map(info => scoreManColourNearFace(info, colouring));
  if (faceScores.some(score => score <= -1)) return null;
  const bottom = leadColour(outfit.bottom);
  let score = faceScores[0] * 0.6 + (faceScores[1] ?? faceScores[0]) * 0.4;
  if (bottom) score += scoreManColourAwayFromFace(bottom, colouring);

  const style = record(profile.style);
  const tribes = text(style.tribes);
  const register = `${text(style.register)} ${text(style.expression)} ${text(style.aesthetic_direction)} ${text(style.primary_brief)}`;
  if (/urban|off_duty|new_boardroom|minimal|modern|contemporary/.test(`${tribes} ${register}`) && outfit.vibe !== 'traditional') score += 0.3;
  if (/indo_authority|royal_edit|regal/.test(tribes) && /bandhgala|achkan|kurta-bundi/.test(outfit.family)) score += 0.3;
  if (/indian_casual|traditional|ethnic/.test(`${tribes} ${register}`) && outfit.vibe === 'traditional') score += 0.2;
  if (/quiet_luxury|old_money|understated|minimal|subtle|quiet|classic|simple/.test(`${tribes} ${register}`)) {
    if (outfit.boldness >= 4) score -= 0.4;
    if (outfit.boldness <= 2) score += 0.1;
  }
  if (/bold|expressive|statement|stand out|standout|flamboyant/.test(register) && outfit.boldness >= 3) score += 0.2;

  // Things he said he doesn't wear.
  const anti = `${text(style.anti_preferences)} ${text(style.style_blocker)}`;
  const look = occasionOutfitText(outfit).toLowerCase();
  for (const word of anti.match(/[a-z]{5,}/g) ?? []) {
    if (['never', 'avoid', 'doesn', 'anything', 'something', 'clothes', 'looks', 'wearing', 'colours', 'colors'].includes(word)) continue;
    if (look.includes(word.slice(0, 6))) score -= 0.5;
  }

  // Long hems and long jackets shorten a shorter man.
  const height = text(record(profile.client).height_category);
  if (/short|petite|below/.test(height)) {
    if (/knee length|knee-length|long jacket/.test(look) || outfit.family === 'achkan' || outfit.family === 'jacket-set') score -= 0.3;
    if (outfit.family === 'short-kurta' || outfit.family === 'bandhgala') score += 0.1;
  }

  return score + stableHash(`${seed}:${outfit.id}`) * 0.15;
}

/**
 * The best looks for him, at most `perFamily` of each shape, so the designer
 * (and "Show me another") has real variety to choose from.
 */
export function shortlistOccasionOutfits(
  outfits: OccasionOutfit[],
  profile: AnyRecord,
  options: { count?: number; perFamily?: number; exclude?: string[]; avoidFamilies?: string[]; seed?: string } = {},
) {
  const colouring = colouringFromProfile(profile);
  const excluded = new Set((options.exclude ?? []).map(value => value.toLowerCase()));
  const ranked = outfits
    .filter(outfit => !excluded.has(occasionOutfitText(outfit).toLowerCase()))
    .map(outfit => ({ outfit, score: scoreOccasionOutfit(outfit, profile, colouring, options.seed) }))
    .filter((item): item is { outfit: OccasionOutfit; score: number } => item.score !== null)
    .sort((a, b) => b.score - a.score);
  const perFamily = options.perFamily ?? 2;
  const avoid = new Set(options.avoidFamilies ?? []);
  const counts = new Map<string, number>();
  const picked: OccasionOutfit[] = [];
  for (const { outfit } of ranked) {
    if (avoid.has(outfit.family)) continue;
    const used = counts.get(outfit.family) ?? 0;
    if (used >= perFamily) continue;
    counts.set(outfit.family, used + 1);
    picked.push(outfit);
    if (picked.length >= (options.count ?? 10)) break;
  }
  return picked;
}

/** The library look behind a line of outfit text, if it came from the library. */
export function findOccasionOutfit(outfits: OccasionOutfit[], outfitText: string) {
  const wanted = outfitText.trim().toLowerCase();
  return outfits.find(outfit => occasionOutfitText(outfit).toLowerCase() === wanted) ?? null;
}
