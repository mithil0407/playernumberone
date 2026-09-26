import { requiresIndianCasual } from './manOutfitConsistency';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ClassificationResult } from './manReportGenerator';

export type ManOutfitLibraryContext =
  | 'Office / Formal'
  | 'Smart Casual'
  | 'Evening Wear'
  | 'Relaxed Casual';

// v3: the Iconik board looks are picked first and the core 100 fill any gap;
// the fixed suit/tie/resort/old-money quotas are gone.
export const MAN_OUTFIT_LIBRARY_VERSION = 'v3-board-first' as const;

/** Silhouette families assigned to board looks by the conversion rules (see the board file header). */
export type ManBoardSilhouette =
  | 'suit'
  | 'blazer-separates'
  | 'blazer-denim'
  | 'shirt-trousers'
  | 'shirt-denim'
  | 'shirt-layered'
  | 'tee-layered'
  | 'knit-layered'
  | 'knit'
  | 'polo'
  | 'tee'
  | 'tee-denim'
  | 'shorts-set'
  | 'statement-jacket'
  | 'indian-formal';

/** Library versions whose reports go through the outfit portfolio quality gate (v2 reports are still stored). */
export const MAN_LIBRARY_PORTFOLIO_VERSIONS = ['v2-9plus', MAN_OUTFIT_LIBRARY_VERSION] as const;
export function usesManLibraryPortfolio(version: string | null | undefined): boolean {
  return (MAN_LIBRARY_PORTFOLIO_VERSIONS as readonly string[]).includes(version ?? '');
}

/** Board looks are ranked ahead of the core library. */
export type ManOutfitLibraryTier = 'board' | 'core';

export type ManOutfitArchetype =
  | 'corporate-suit'
  | 'corporate-separates'
  | 'shirt-tie-formal'
  | 'climate-formal-layer'
  | 'tailored-polo'
  | 'shirt-chino'
  | 'layered-smart'
  | 'expressive-smart'
  | 'statement-outerwear'
  | 'tailored-dinner'
  | 'patterned-textured'
  | 'resort-evening'
  | 'refined-denim-knit'
  | 'resort-riviera'
  | 'daily-old-money'
  | 'urban-travel'
  | 'indian-casual'
  | ManBoardSilhouette;

export type ManOutfitPatternFamily = 'solid' | 'stripe' | 'check' | 'jacquard' | 'print';

export interface ManOutfitLibraryEntry {
  id: number;
  context: ManOutfitLibraryContext;
  top: string;
  bottom: string;
  layer: string;
  footwear: string;
  accessories: string;
  archetype: ManOutfitArchetype;
  climateModes: ManReportClimateMode[];
  silhouetteFamily: string;
  bodyFit: string[];
  patternFamily: ManOutfitPatternFamily;
  tags: string[];
  tier: ManOutfitLibraryTier;
  /** Board looks only: styling notes (tuck, sleeves) and the pin they came from. */
  styling?: string;
  source?: string;
}

export interface ManOutfitLibraryAssignment {
  outfitNumber: number;
  context: ManOutfitLibraryContext;
  libraryLookId: number;
  archetype?: ManOutfitArchetype;
  silhouetteFamily?: string;
}

const HEADER_CONTEXTS: Record<string, ManOutfitLibraryContext> = {
  'OFFICE / FORMAL': 'Office / Formal',
  'SMART CASUAL': 'Smart Casual',
  'EVENING WEAR': 'Evening Wear',
  'RELAXED CASUAL': 'Relaxed Casual',
};

const HOT_CLIMATE_RESTRICTED_PATTERN = /\b(turtleneck|roll[-\s]?neck|wool(?:-blend|\s+blend)?|flannel|heavy\s+knit|merino|corduroy|overcoat|puffer|scarf|thick\s+tweed|velvet)\b/i;
const MONSOON_RESTRICTED_PATTERN = /\b(suede|nubuck|turtleneck|roll[-\s]?neck|wool(?:-blend|\s+blend)?|flannel|heavy\s+knit|merino|corduroy|overcoat|puffer|scarf|thick\s+tweed|velvet)\b/i;
const PATTERNED_TOP_PATTERN = /\b(stripe|striped|gingham|check|checked|plaid|tartan|houndstooth|prince of wales|glen check)\b/i;
const ANY_PATTERN_PATTERN = /\b(stripe|striped|gingham|check|checked|plaid|tartan|houndstooth|prince of wales|glen check|pinstripe|chalk-stripe|jacquard|paisley|geometric|print|pattern)\b/i;
const FOOTWEAR_TYPE_RULES: Array<[string, RegExp]> = [
  ['oxford', /\boxford\b/i],
  ['derby', /\bderby\b/i],
  ['loafer', /\bloafer\b/i],
  ['chelsea-boot', /\bchelsea\b/i],
  ['lace-up-boot', /\b(?:lace-up|plain-toe|dress)\s+boots?\b/i],
  ['chukka', /\bchukka\b/i],
  ['sneaker', /\bsneakers?\b/i],
  ['espadrille', /\bespadrilles?\b/i],
  ['sandal', /\bsandals?\b/i],
];
const COLOUR_FAMILY_RULES: Array<[string, RegExp]> = [
  ['light-neutral', /\b(warm\s+white|white|ecru|ivory|cream|off-white|chalk|bone)\b/i],
  ['pale-earth', /\b(stone|oatmeal|sand|beige)\b/i],
  ['brown', /\b(espresso|chocolate|mocha|tobacco|brown|camel|tan|cognac|taupe)\b/i],
  ['blue', /\b(navy|blue|indigo|denim|cobalt|chambray|teal)\b/i],
  ['green', /\b(olive|sage|forest|green)\b/i],
  ['grey', /\b(charcoal|grey|gray|slate)\b/i],
  ['black', /\bblack\b/i],
  ['red', /\b(burgundy|wine|rust|terracotta|red)\b/i],
  ['pink', /\b(blush|pink)\b/i],
  ['yellow', /\b(butter\s+yellow|yellow)\b/i],
];

export type ManReportClimateMode = 'hot' | 'monsoon' | 'mild' | 'temperate' | 'cool';

export interface ManReportClimateProfile {
  mode: ManReportClimateMode;
  label: string;
  promptGuidance: string;
}

// Literal paths so Vercel's file tracer bundles both files.
function readBoardLibraryFile(): string {
  return readFileSync(join(process.cwd(), 'src/lib/ICONIK_Mens_Library_Board.md'), 'utf-8');
}

function readCoreLibraryFile(): string {
  return readFileSync(join(process.cwd(), 'src/lib/ICONIK_Mens_Library_100.md'), 'utf-8');
}

function getField(block: string, label: string): string {
  return block.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))?.[1]?.trim() ?? '';
}

function archetypeForEntry(id: number, context: ManOutfitLibraryContext): ManOutfitArchetype {
  if (context === 'Office / Formal') {
    if (id <= 8) return 'corporate-suit';
    if (id <= 15) return 'corporate-separates';
    if (id <= 21) return 'shirt-tie-formal';
    return 'climate-formal-layer';
  }
  if (context === 'Smart Casual') {
    if ([26, 31, 36, 38, 42, 45].includes(id)) return 'tailored-polo';
    if ([30, 34, 40, 48].includes(id)) return 'shirt-chino';
    if ([28, 29, 32, 33, 35, 37, 41, 43, 46, 50].includes(id)) return 'layered-smart';
    return 'expressive-smart';
  }
  if (context === 'Evening Wear') {
    if (id <= 56) return 'statement-outerwear';
    if (id <= 61) return 'tailored-dinner';
    if (id <= 66) return 'patterned-textured';
    if (id <= 70) return 'resort-evening';
    return 'refined-denim-knit';
  }
  if (id <= 85) return 'resort-riviera';
  if (id <= 95) return 'daily-old-money';
  return 'urban-travel';
}

function patternFamilyForText(text: string): ManOutfitPatternFamily {
  if (/jacquard|paisley|geometric/i.test(text)) return 'jacquard';
  if (/print|abstract/i.test(text)) return 'print';
  if (/check|gingham|plaid|tartan|houndstooth|prince of wales|glen check/i.test(text)) return 'check';
  if (/stripe|pinstripe|chalk-stripe/i.test(text)) return 'stripe';
  return 'solid';
}

function silhouetteFamilyForEntry(entry: Pick<ManOutfitLibraryEntry, 'top' | 'bottom' | 'layer' | 'archetype'>): string {
  return entry.archetype;
}

function climateModesForText(text: string): ManReportClimateMode[] {
  const all: ManReportClimateMode[] = ['hot', 'monsoon', 'mild', 'temperate', 'cool'];
  const leatherOuterwear = /\bleather\b.*\b(?:jacket|bomber|blouson|racer)\b/i.test(text);
  return all.filter(mode => {
    if (mode === 'hot') return !leatherOuterwear && !HOT_CLIMATE_RESTRICTED_PATTERN.test(text);
    if (mode === 'monsoon') return !leatherOuterwear && !MONSOON_RESTRICTED_PATTERN.test(text);
    return true;
  });
}

function tagsForEntry(entry: Pick<ManOutfitLibraryEntry, 'top' | 'bottom' | 'layer' | 'footwear' | 'accessories' | 'archetype'>): string[] {
  const text = `${entry.top} ${entry.bottom} ${entry.layer} ${entry.footwear} ${entry.accessories}`.toLowerCase();
  const tags = new Set<string>([entry.archetype]);
  const rules: Array<[string, RegExp]> = [
    ['old-money', /pleated|penny loafer|rugby|cable-knit|draped over shoulders|horsebit/],
    ['resort', /linen|camp-collar|espadrille|sandals|drawstring|terry-cloth/],
    ['urban', /leather|varsity|bomber|harrington|denim|sneaker|utility|trucker/],
    ['corporate', /suit|blazer|tie|oxford|derby|folio/],
    ['patterned', ANY_PATTERN_PATTERN],
    ['leather-jacket', /leather.*(?:jacket|bomber|blouson|racer)/],
    ['varsity-jacket', /varsity|letterman/],
    ['statement-jacket', /leather|suede.*(?:bomber|blouson|jacket)|varsity|harrington|matte.*bomber/],
    ['relaxed-tailoring', /pleated|wide-leg|relaxed straight|fluid drape/],
  ];
  for (const [tag, pattern] of rules) if (pattern.test(text)) tags.add(tag);
  return [...tags];
}

function parseMetadataList(block: string, label: string): string[] {
  return getField(block, label).split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
}

export function parseManOutfitLibrary(raw: string, tier: ManOutfitLibraryTier = 'core'): ManOutfitLibraryEntry[] {
  const matches = Array.from(raw.matchAll(/^\*\*OUTFIT\s+(\d+)\s+—\s+([^*\n]+)\*\*$/gim));

  return matches.flatMap((match, index) => {
    const id = Number(match[1]);
    const context = HEADER_CONTEXTS[match[2].trim().toUpperCase()];
    if (!Number.isInteger(id) || !context) return [];

    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? raw.length;
    const block = raw.slice(start, end);
    const entry: ManOutfitLibraryEntry = {
      id,
      context,
      top: getField(block, 'TOP'),
      bottom: getField(block, 'BOTTOM'),
      layer: getField(block, 'LAYER'),
      footwear: getField(block, 'FOOTWEAR'),
      accessories: getField(block, 'ACCESSORIES'),
      archetype: (getField(block, 'ARCHETYPE') || archetypeForEntry(id, context)) as ManOutfitArchetype,
      climateModes: [],
      silhouetteFamily: '',
      bodyFit: parseMetadataList(block, 'BODY_FIT'),
      patternFamily: 'solid',
      tags: parseMetadataList(block, 'TAGS'),
      tier: getField(block, 'PRIORITY').toLowerCase() === 'board' ? 'board' : tier,
      styling: getField(block, 'STYLING') || undefined,
      source: getField(block, 'SOURCE') || undefined,
    };

    const reference = referenceText(entry);
    entry.climateModes = (parseMetadataList(block, 'CLIMATES') as ManReportClimateMode[]).length
      ? parseMetadataList(block, 'CLIMATES') as ManReportClimateMode[]
      : climateModesForText(reference);
    entry.silhouetteFamily = getField(block, 'SILHOUETTE_FAMILY') || silhouetteFamilyForEntry(entry);
    entry.bodyFit = entry.bodyFit.length ? entry.bodyFit : ['all'];
    entry.patternFamily = (getField(block, 'PATTERN_FAMILY') as ManOutfitPatternFamily) || patternFamilyForText(reference);
    entry.tags = entry.tags.length ? entry.tags : tagsForEntry(entry);

    return entry.top && entry.bottom && entry.layer && entry.footwear && entry.accessories
      ? [entry]
      : [];
  });
}

let cachedLibrary: ManOutfitLibraryEntry[] | null = null;

export function getManOutfitLibrary(): ManOutfitLibraryEntry[] {
  if (!cachedLibrary) {
    cachedLibrary = [
      ...parseManOutfitLibrary(readBoardLibraryFile(), 'board'),
      ...parseManOutfitLibrary(readCoreLibraryFile(), 'core'),
    ];
  }
  return cachedLibrary;
}

export function getManReportClimateProfile(
  classification: Pick<ClassificationResult, 'client'>,
  now = new Date(),
): ManReportClimateProfile {
  const location = (classification.client.location_region ?? '').toLowerCase();
  const month = now.getUTCMonth() + 1;
  const isIndia = /india|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/.test(location);
  const isUae = /uae|middle\s*east|dubai/.test(location);
  const isNorthernTemperate = /united kingdom|\buk\b|canada|usa|united states|europe/.test(location);

  if (isIndia) {
    if (month >= 6 && month <= 9) {
      return {
        mode: 'monsoon',
        label: 'Indian monsoon',
        promptGuidance: 'Use rain-aware, breathable outfits: cotton, cotton-linen blends, lightweight technical layers, and weather-sensible footwear materials (leather, rubber soles). Avoid suede/nubuck, leather outerwear, heavy winter fabrics, overcoats, puffers, scarves, and delicate rain-unfriendly materials. Never change an outfit’s footwear category for the weather — keep the assigned category and choose its most rain-practical leather or rubber-soled version. A lightweight weather-resistant cotton layer is allowed when the occasion needs it; do not treat monsoon as peak summer.',
      };
    }
    if (month >= 3 && month <= 5) {
      return {
        mode: 'hot',
        label: 'Indian summer',
        promptGuidance: 'Use hot-weather dressing: lightweight cotton, linen-cotton, breathable knits, and restrained layering. Do not use leather outerwear, turtlenecks, wool, flannel, merino, corduroy, overcoats, puffers, scarves, thick tweed, or velvet.',
      };
    }
    return {
      mode: 'mild',
      label: 'Indian transitional / winter season',
      promptGuidance: 'Use transitional dressing. Lightweight layers and fine knits are available when useful, but keep warmth proportionate to the setting; do not default to peak-summer or heavy-winter uniforms.',
    };
  }

  if (isUae) {
    if (month >= 5 && month <= 9) {
      return {
        mode: 'hot',
        label: 'Gulf summer',
        promptGuidance: 'Use hot-weather dressing: lightweight cotton, linen-cotton, breathable knits, and restrained layering. Do not use leather outerwear, turtlenecks, wool, flannel, merino, corduroy, overcoats, puffers, scarves, thick tweed, or velvet.',
      };
    }
    return {
      mode: 'mild',
      label: 'Gulf mild season',
      promptGuidance: 'Use light transitional layers and breathable fabrics. Keep the outfit polished but do not treat this as a cold winter climate.',
    };
  }

  if (isNorthernTemperate) {
    if (month === 12 || month <= 2) {
      return {
        mode: 'cool',
        label: 'temperate winter',
        promptGuidance: 'Use seasonally appropriate knitwear, outerwear, and substantial footwear when the occasion benefits from them. Keep layers proportionate and polished.',
      };
    }
    if (month >= 6 && month <= 8) {
      return {
        mode: 'temperate',
        label: 'temperate summer',
        promptGuidance: 'Use light shirts, breathable knitwear, and optional unlined layers. Avoid both peak-summer tropical assumptions and heavy winter layering.',
      };
    }
    return {
      mode: 'mild',
      label: 'temperate transitional season',
      promptGuidance: 'Use flexible transitional layers, refined knits, and weather-appropriate footwear without over-layering.',
    };
  }

  return {
    mode: 'temperate',
    label: 'temperate climate',
    promptGuidance: 'Use balanced, seasonally proportionate fabrics and layers. Do not assume tropical heat or deep winter without a client-specific signal.',
  };
}

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function referenceText(entry: ManOutfitLibraryEntry): string {
  return [entry.top, entry.bottom, entry.layer, entry.footwear, entry.accessories].join(' ');
}

export function getManOutfitPrimaryColourFamily(text: string): string | null {
  const family = COLOUR_FAMILY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
  if (!family) return null;
  return PATTERNED_TOP_PATTERN.test(text) ? `patterned-${family}` : family;
}

function clientFingerprint(classification: ClassificationResult): string {
  return [
    classification.client.location_region,
    classification.body.silhouette_type,
    classification.body.fit_directive,
    classification.colour.season,
    classification.colour.undertone,
    classification.style_brief.primary_brief,
    classification.style_brief.anti_preferences,
  ].join('|').toLowerCase();
}

// Outfits per occasion, in report order (Outfit 1-6 Office, 7-10 Smart, 11-15 Evening, 16-20 Relaxed).
const CONTEXT_SPLIT: Array<[ManOutfitLibraryContext, number]> = [
  ['Office / Formal', 6],
  ['Smart Casual', 4],
  ['Evening Wear', 5],
  ['Relaxed Casual', 5],
];
const INDIAN_ARCHETYPES = new Set<ManOutfitArchetype>(['indian-casual', 'indian-formal']);
/** Patterned looks are welcome but optional; past this many the portfolio gets busy. */
const MAX_PATTERNED = 7;

function explicitPatternAversion(classification: ClassificationResult): boolean {
  return /\b(no|avoid|dislike|hate)\b.{0,24}\b(pattern|print|stripe|check)/i.test(
    `${classification.style_brief.anti_preferences} ${classification.colour.pattern_guidance}`,
  );
}

export function getManOutfitSelectionWaivers(classification: ClassificationResult): string[] {
  const anti = classification.style_brief.anti_preferences;
  return [
    explicitPatternAversion(classification) ? 'patterns' : null,
    /\b(no|avoid|dislike|hate)\b.{0,18}\bsuits?\b/i.test(anti) ? 'suits' : null,
    /\b(no|avoid|dislike|hate)\b.{0,18}\bties?\b/i.test(anti) ? 'ties' : null,
  ].filter(Boolean) as string[];
}

function antiPreferenceConflict(entry: ManOutfitLibraryEntry, classification: ClassificationResult): boolean {
  const anti = classification.style_brief.anti_preferences.toLowerCase();
  if (!anti.trim()) return false;
  const text = referenceText(entry).toLowerCase();
  const garmentRules: Array<[RegExp, RegExp]> = [
    [/\b(no|avoid|dislike|hate)\b.{0,18}\bsuits?\b/, /\bsuit\b/],
    [/\b(no|avoid|dislike|hate)\b.{0,18}\bleather\s+(?:jackets?|outerwear)\b/, /\bleather\b.*\b(?:jacket|bomber|blouson|racer)\b/],
    [/\b(no|avoid|dislike|hate)\b.{0,18}\bdenim|jeans?\b/, /\bdenim|jeans?\b/],
    [/\b(no|avoid|dislike|hate)\b.{0,18}\bshorts?\b/, /\bshorts?\b/],
    [/\b(no|avoid|dislike|hate)\b.{0,18}\bpatterns?|prints?\b/, ANY_PATTERN_PATTERN],
  ];
  return garmentRules.some(([antiPattern, garmentPattern]) => antiPattern.test(anti) && garmentPattern.test(text));
}

function bodyCompatibilityScore(entry: ManOutfitLibraryEntry, classification: ClassificationResult): number {
  const body = classification.body.silhouette_type.toLowerCase();
  if (entry.bodyFit.includes('all') || entry.bodyFit.some(value => body.includes(value))) return 1;
  if (body.includes('oval') && /open|longer|past the hip|below the hip/i.test(entry.layer)) return 0.9;
  return 0.6;
}

function semanticReferenceScore(entry: ManOutfitLibraryEntry, classification: ClassificationResult, fingerprint: string): number {
  const styleText = [
    classification.style_brief.primary_brief,
    classification.style_brief.aesthetic_direction,
    classification.style_brief.tribes.join(' '),
    classification.style_brief.register,
    classification.style_brief.expression,
    classification.style_brief.key_aspiration,
  ].join(' ').toLowerCase();
  const preferenceText = `${styleText} ${classification.client.primary_goal}`.toLowerCase();
  const styleMatches = entry.tags.filter(tag => preferenceText.includes(tag.replace(/-/g, ' '))).length;
  const garmentMatches = entry.tags.filter(tag => /leather|varsity|resort|old-money|urban|corporate/.test(tag) && preferenceText.includes(tag.replace(/-/g, ' '))).length;
  const patternAffinity = explicitPatternAversion(classification)
    ? (entry.patternFamily === 'solid' ? 1 : 0)
    : (entry.patternFamily === 'solid' ? 0.65 : 1);
  const tieBreak = stableHash(`${fingerprint}|${entry.context}|${entry.id}`) / 0xffffffff;
  return (Math.min(1, styleMatches / 2) * 0.4)
    + (bodyCompatibilityScore(entry, classification) * 0.25)
    + (Math.min(1, garmentMatches) * 0.2)
    + (patternAffinity * 0.1)
    + (tieBreak * 0.05);
}

function footwearType(entry: ManOutfitLibraryEntry): string {
  return FOOTWEAR_TYPE_RULES.find(([, pattern]) => pattern.test(entry.footwear))?.[0] ?? 'other';
}

function layerType(entry: ManOutfitLibraryEntry): string | null {
  if (/^no layer$/i.test(entry.layer)) return null;
  const rules: Array<[string, RegExp]> = [
    ['suit-or-blazer', /suit jacket|blazer/i],
    ['statement-jacket', /varsity|bomber|blouson|harrington|leather.*jacket|café racer|cafe racer/i],
    ['overshirt', /overshirt|open shirt/i],
    ['coat', /coat/i],
    ['knit', /sweater|quarter-zip|half-zip|cardigan|knit/i],
    ['utility', /chore|utility|trucker/i],
  ];
  const rule = rules.find(([, pattern]) => pattern.test(entry.layer));
  return rule?.[0] ?? 'other';
}

function validateSelectedReferencePortfolio(selected: ManOutfitLibraryEntry[]): string[] {
  const issues: string[] = [];
  for (const [context, count] of CONTEXT_SPLIT) {
    const local = selected.filter(entry => entry.context === context);
    if (local.length !== count) issues.push(`${context} needs ${count} looks; found ${local.length}.`);
    const counts = new Map<string, number>();
    for (const entry of local) counts.set(entry.silhouetteFamily, (counts.get(entry.silhouetteFamily) ?? 0) + 1);
    if ([...counts.values()].some(value => value > 2)) issues.push(`${context} repeats a silhouette family more than twice.`);
  }
  const global = new Map<string, number>();
  for (const entry of selected) global.set(entry.silhouetteFamily, (global.get(entry.silhouetteFamily) ?? 0) + 1);
  if ([...global.values()].some(value => value > 3)) issues.push('A silhouette family appears more than three times across the portfolio.');
  return issues;
}

/** Nudges toward variety without forcing any garment: a new footwear or layer type, and a pattern or two. */
function varietyBonus(entry: ManOutfitLibraryEntry, selected: ManOutfitLibraryEntry[], suppressPatterns: boolean): number {
  let bonus = 0;
  if (!selected.some(chosen => footwearType(chosen) === footwearType(entry))) bonus += 0.15;
  const layer = layerType(entry);
  if (layer && !selected.some(chosen => layerType(chosen) === layer)) bonus += 0.1;
  const patterned = selected.filter(chosen => chosen.patternFamily !== 'solid').length;
  if (!suppressPatterns && entry.patternFamily !== 'solid' && patterned < 3) bonus += 0.1;
  return bonus;
}

function indianCasualFallback(source: ManOutfitLibraryEntry, first: boolean, suppressPatterns: boolean): ManOutfitLibraryEntry {
  return {
    ...source,
    id: first ? 101 : 102,
    archetype: 'indian-casual', silhouetteFamily: 'indian-casual',
    top: first
      ? `Warm ivory cotton short kurta — band collar — straight hem at upper thigh — side slits — full sleeves${suppressPatterns ? '' : ' — fine olive vertical stripes'}`
      : `Muted rust cotton knee-length kurta — band collar — straight cut — side slits — full sleeves${suppressPatterns ? '' : ' — subtle tonal geometric print'}`,
    bottom: first
      ? 'Deep olive cotton straight-leg trousers — mid-rise — ankle length'
      : 'Warm stone cotton straight-leg trousers — mid-rise — ankle length',
    layer: 'No layer',
    tags: [...source.tags, 'indian-casual', 'kurta'],
  };
}

/**
 * Picks the 20 source looks, one per report outfit, in report order.
 *
 * Board looks come first: a slot only reaches the core 100-look library when no
 * board look fits it. Within a tier, looks are ranked by the client's style
 * brief and body, with a small nudge toward new footwear, layers and a pattern
 * or two. Hard limits: climate, anti-preferences, no silhouette family more
 * than twice per occasion or three times overall, at most 7 patterned looks,
 * and no two neighbouring looks in the same top or layer colour family where
 * avoidable. Indian looks are used only for clients who asked for Indian casual.
 */
export function selectManOutfitLibraryReferences(
  classification: ClassificationResult,
  library = getManOutfitLibrary(),
  now = new Date(),
  selectionSalt = '',
): ManOutfitLibraryEntry[] {
  const fingerprint = `${clientFingerprint(classification)}|${selectionSalt}`;
  const climate = getManReportClimateProfile(classification, now);
  const suppressPatterns = explicitPatternAversion(classification);
  const waivers = getManOutfitSelectionWaivers(classification);
  const wantsIndianCasual = requiresIndianCasual(classification);
  const selected: ManOutfitLibraryEntry[] = [];
  let previousTopColourFamily: string | null = null;
  let previousLayerColourFamily: string | null = null;

  for (const [context, count] of CONTEXT_SPLIT) {
    for (let slot = 0; slot < count; slot += 1) {
      const indianSlot = wantsIndianCasual && context === 'Relaxed Casual' && slot < 2;
      const silhouetteCount = (family: string, scope: ManOutfitLibraryEntry[]) => scope.filter(entry => entry.silhouetteFamily === family).length;
      const inContext = selected.filter(entry => entry.context === context);
      const patternedSoFar = selected.filter(entry => entry.patternFamily !== 'solid').length;
      const eligible = library
        .filter(entry => entry.context === context)
        .filter(entry => indianSlot ? entry.archetype === 'indian-casual' : !INDIAN_ARCHETYPES.has(entry.archetype))
        .filter(entry => entry.climateModes.includes(climate.mode))
        .filter(entry => !antiPreferenceConflict(entry, classification))
        .filter(entry => !waivers.includes('ties') || !/\btie\b/i.test(entry.accessories))
        .filter(entry => !waivers.includes('suits') || entry.silhouetteFamily !== 'suit')
        .filter(entry => entry.patternFamily === 'solid' || (!suppressPatterns && patternedSoFar < MAX_PATTERNED))
        .filter(entry => !selected.some(chosen => chosen.id === entry.id))
        .filter(entry => silhouetteCount(entry.silhouetteFamily, inContext) < 2)
        .filter(entry => silhouetteCount(entry.silhouetteFamily, selected) < 3);
      // The board is the primary source; the core library only fills a slot the board cannot.
      const tier = eligible.some(entry => entry.tier === 'board') ? eligible.filter(entry => entry.tier === 'board') : eligible;
      const score = (entry: ManOutfitLibraryEntry) => semanticReferenceScore(entry, classification, fingerprint) + varietyBonus(entry, selected, suppressPatterns);
      const ranked = tier.sort((a, b) => score(b) - score(a) || a.id - b.id);
      const next = ranked.find(entry => {
        const topFamily = getManOutfitPrimaryColourFamily(entry.top);
        const layerFamily = /^no layer$/i.test(entry.layer) ? null : getManOutfitPrimaryColourFamily(entry.layer);
        return topFamily !== previousTopColourFamily && (!layerFamily || layerFamily !== previousLayerColourFamily);
      }) ?? ranked.find(entry => getManOutfitPrimaryColourFamily(entry.top) !== previousTopColourFamily) ?? ranked[0];

      let chosen = next;
      if (!chosen && indianSlot) {
        // No library kurta fits (climate or anti-preferences): adapt the best Relaxed look instead.
        const base = library.find(entry => entry.context === 'Relaxed Casual' && !INDIAN_ARCHETYPES.has(entry.archetype) && !selected.some(item => item.id === entry.id));
        if (base) chosen = indianCasualFallback(base, slot === 0, suppressPatterns);
      }
      if (!chosen) throw new Error(`ICONIK library cannot fill a ${context} look for ${climate.label}.`);
      selected.push(chosen);
      previousTopColourFamily = getManOutfitPrimaryColourFamily(chosen.top);
      previousLayerColourFamily = /^no layer$/i.test(chosen.layer) ? null : getManOutfitPrimaryColourFamily(chosen.layer);
    }
  }

  const portfolioIssues = validateSelectedReferencePortfolio(selected);
  if (portfolioIssues.length) throw new Error(`ICONIK portfolio selection failed: ${portfolioIssues.join(' ')}`);
  return selected;
}

/** How many board looks each occasion offers the monthly Edit writer (it picks 6). */
const EDIT_SOURCES_PER_CONTEXT: Array<[ManOutfitLibraryContext, number]> = [
  ['Office / Formal', 3],
  ['Smart Casual', 4],
  ['Evening Wear', 3],
  ['Relaxed Casual', 4],
];

/**
 * Board looks for a monthly Edit: suited to the client and the month's climate,
 * and never one his Blueprint or an earlier issue already used (`exclude`).
 * Same filters and ranking as the Blueprint; at most one look per silhouette
 * family per occasion, so the writer gets a real choice.
 */
export function selectManEditBoardSources(
  classification: ClassificationResult,
  options: { now?: Date; exclude?: number[]; salt?: string } = {},
  library = getManOutfitLibrary(),
): ManOutfitLibraryEntry[] {
  const now = options.now ?? new Date();
  const exclude = new Set(options.exclude ?? []);
  const fingerprint = `${clientFingerprint(classification)}|edit|${options.salt ?? now.toISOString().slice(0, 7)}`;
  const climate = getManReportClimateProfile(classification, now);
  const suppressPatterns = explicitPatternAversion(classification);
  const waivers = getManOutfitSelectionWaivers(classification);
  const wantsIndianCasual = requiresIndianCasual(classification);
  const chosen: ManOutfitLibraryEntry[] = [];
  for (const [context, count] of EDIT_SOURCES_PER_CONTEXT) {
    const ranked = library
      .filter(entry => entry.tier === 'board' && entry.context === context && !exclude.has(entry.id))
      .filter(entry => wantsIndianCasual || !INDIAN_ARCHETYPES.has(entry.archetype))
      .filter(entry => entry.climateModes.includes(climate.mode))
      .filter(entry => !antiPreferenceConflict(entry, classification))
      .filter(entry => !waivers.includes('ties') || !/\btie\b/i.test(entry.accessories))
      .filter(entry => !waivers.includes('suits') || entry.silhouetteFamily !== 'suit')
      .filter(entry => !suppressPatterns || entry.patternFamily === 'solid')
      .sort((a, b) => semanticReferenceScore(b, classification, fingerprint) - semanticReferenceScore(a, classification, fingerprint) || a.id - b.id);
    const local: ManOutfitLibraryEntry[] = [];
    for (const entry of ranked) {
      if (local.length >= count) break;
      if (!local.some(item => item.silhouetteFamily === entry.silhouetteFamily)) local.push(entry);
    }
    // Too few distinct families: top up with the next-best looks regardless.
    for (const entry of ranked) {
      if (local.length >= count) break;
      if (!local.includes(entry)) local.push(entry);
    }
    chosen.push(...local);
  }
  return chosen;
}

export function getManOutfitLibraryAssignments(
  classification: ClassificationResult,
  library = getManOutfitLibrary(),
  now = new Date(),
  selectionSalt = '',
): ManOutfitLibraryAssignment[] {
  return selectManOutfitLibraryReferences(classification, library, now, selectionSalt).map((entry, index) => ({
    outfitNumber: index + 1,
    context: entry.context,
    libraryLookId: entry.id,
    archetype: entry.archetype,
    silhouetteFamily: entry.silhouetteFamily,
  }));
}

export function formatManOutfitLibraryForPrompt(
  classification: ClassificationResult,
  library = getManOutfitLibrary(),
  now = new Date(),
  selectionSalt = '',
): string {
  const climate = getManReportClimateProfile(classification, now);
  const selected = selectManOutfitLibraryReferences(classification, library, now, selectionSalt);
  const references = selected.map((entry, index) => `### MANDATORY SOURCE FOR FINAL OUTFIT ${index + 1}: LIBRARY LOOK ${entry.id} — ${entry.context.toUpperCase()}
ARCHETYPE: ${entry.archetype}
SILHOUETTE FAMILY: ${entry.silhouetteFamily}
PATTERN FAMILY: ${entry.patternFamily}
TOP COLOUR FAMILY: ${getManOutfitPrimaryColourFamily(entry.top) ?? 'unspecified'} (final top must stay outside the neighbouring outfits' top-colour families)
STYLE TAGS: ${entry.tags.join(', ')}
TOP: ${entry.top}
LAYER: ${entry.layer}
BOTTOM: ${entry.bottom}
FOOTWEAR: ${entry.footwear}
ACCESSORY: ${entry.accessories}${entry.styling ? `
STYLING: ${entry.styling}` : ''}`).join('\n\n');

  return `# ICONIK MEN'S REFERENCE OUTFIT LIBRARY

The following client-tested library looks are mandatory one-to-one sources for this Section 4 generation. They are private prompt references, never client-facing citations.

REFERENCE LOCK — non-negotiable:
- Final Outfit 1 must be adapted from Mandatory Source 1, Final Outfit 2 from Mandatory Source 2, continuing in order through Final Outfit 20. Do not choose another formula or invent an unrelated look.
- Preserve the assigned source look's core top, layer/no-layer decision, bottom silhouette, footwear category, and accessory/styling architecture. The source must remain visibly recognisable after adaptation.
- Make only the client-specific tweaks required by the classification: colour season and undertone, climate, body geometry, fit directive, formality, anti-preferences, and explicit client notes. If a required tweak changes a garment, use the nearest real-garment equivalent — do not redesign the outfit.
- This reference lock overrides any tendency to generate a generic outfit from the rules alone. The v6.1 rules still decide whether a source detail must be adapted or removed for safety.
- Footwear category lock: keep every source's footwear category (Oxford, Derby, loafer, boot, chukka, sneaker, espadrille, sandal) exactly. Adapt the material, colour, or sole for climate within the category; never substitute a different category.
- Where a source has a STYLING line (tucked or untucked, sleeves rolled, collar open, worn open), keep that styling.
- Layer lock: never delete a source layer. If a source layer is unsafe for the climate or the client's anti-preferences, replace it with a permitted equivalent layer of similar formality. Only sources whose LAYER reads "No layer" may be layerless.
- Never introduce satin, silk, or any shiny fabric anywhere, including ties, pocket squares, and linings. Ties are optional: add one only where the source has one or the client asks for ties, and then grenadine, knitted, or matte woven.
- Consecutive visual variation is mandatory: Final Outfits 1–20 must not repeat the same or a near-identical primary top colour family in adjacent slots. Treat white, ecru, ivory, cream, off-white, chalk, and bone as one light-neutral family; stone, oatmeal, sand, and beige as one pale-earth family. Apply the same no-repeat principle to consecutive visible layers.
- When the client's palette forces a recolour, the new top or layer colour must still land in a different colour family from both the previous and the next outfit's final top/layer. Check every recolour against each source's TOP COLOUR FAMILY line before finalising; do not default multiple adjacent tops into blue or another single family.

Library version: ${MAN_OUTFIT_LIBRARY_VERSION}. Most sources come from the Iconik board of real, current looks; keep their modern, relaxed proportions rather than making them older or more formal. The core library is Warm Autumn-led. Never copy its colours blindly: the client's classification always wins near the face and across the outfit. Current climate mode: ${climate.label} (${climate.mode.toUpperCase()}). ${climate.promptGuidance} Do not mention library look numbers, source references, or adaptation in the visible report.

The 6/4/5/5 context split is already mapped below. Preserve each source's silhouette family as well as its core garments. Office / Formal stays office-appropriate (no tees, polos, denim or sneakers); suits and ties are not required. Evening must read night-out. ${requiresIndianCasual(classification) ? 'CLIENT PREFERENCE OVERRIDE: the first 2 Relaxed Casual sources are everyday kurta looks and must stay kurtas; wedding sherwanis or a Western shirt renamed Indian do not qualify.' : 'Relaxed Casual follows its sources; there is no fixed resort or old-money split.'} Patterns are optional: use at most 7 patterned pieces${explicitPatternAversion(classification) ? ', and none for this client' : ''}. No silhouette family more than twice inside one context or three times overall. Keep all v6.1 garment-reality, climate, and QA rules.

## SELECTED REFERENCES

${references}`;
}
