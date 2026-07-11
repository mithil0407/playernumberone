import { readFileSync } from 'fs';
import { join } from 'path';
import type { ClassificationResult } from './manReportGenerator';

export type ManOutfitLibraryContext =
  | 'Office / Formal'
  | 'Smart Casual'
  | 'Evening Wear'
  | 'Relaxed Casual';

export const MAN_OUTFIT_LIBRARY_VERSION = 'v2-9plus' as const;

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
  | 'urban-travel';

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
const PATTERNED_TOP_PATTERN = /\b(stripe|striped|gingham|check|checked|houndstooth|prince of wales|glen check)\b/i;
const ANY_PATTERN_PATTERN = /\b(stripe|striped|gingham|check|checked|houndstooth|prince of wales|glen check|pinstripe|chalk-stripe|jacquard|paisley|geometric|print|pattern)\b/i;
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

function readLibraryFile(): string {
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
  if (/check|gingham|houndstooth|prince of wales|glen check/i.test(text)) return 'check';
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

export function parseManOutfitLibrary(raw: string): ManOutfitLibraryEntry[] {
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
  if (!cachedLibrary) cachedLibrary = parseManOutfitLibrary(readLibraryFile());
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

interface ReferenceSlot {
  context: ManOutfitLibraryContext;
  archetype: ManOutfitArchetype;
  requirePattern?: boolean;
  requireFootwearType?: string;
  requireLayerType?: string;
}

function referenceSlots(climate: ManReportClimateProfile, suppressPatterns: boolean, suitWaiver: boolean): ReferenceSlot[] {
  const patterned = (slot: ReferenceSlot): ReferenceSlot => suppressPatterns ? slot : { ...slot, requirePattern: true };
  const evening: ReferenceSlot[] = climate.mode === 'hot' || climate.mode === 'monsoon'
    ? [
        { context: 'Evening Wear', archetype: 'statement-outerwear' },
        { context: 'Evening Wear', archetype: 'tailored-dinner' },
        suppressPatterns
          ? { context: 'Evening Wear', archetype: 'tailored-dinner' }
          : patterned({ context: 'Evening Wear', archetype: 'patterned-textured' }),
        { context: 'Evening Wear', archetype: 'resort-evening' },
        { context: 'Evening Wear', archetype: 'refined-denim-knit' },
      ]
    : [
        { context: 'Evening Wear', archetype: 'statement-outerwear' },
        { context: 'Evening Wear', archetype: 'statement-outerwear' },
        { context: 'Evening Wear', archetype: 'tailored-dinner' },
        suppressPatterns
          ? { context: 'Evening Wear', archetype: 'tailored-dinner' }
          : patterned({ context: 'Evening Wear', archetype: 'patterned-textured' }),
        { context: 'Evening Wear', archetype: 'refined-denim-knit' },
      ];

  const formal: ReferenceSlot[] = suitWaiver
    ? [
        { context: 'Office / Formal', archetype: 'climate-formal-layer', requireFootwearType: 'oxford' },
        patterned({ context: 'Office / Formal', archetype: 'climate-formal-layer', requireFootwearType: 'derby' }),
      ]
    : [
        { context: 'Office / Formal', archetype: 'corporate-suit', requireFootwearType: 'oxford' },
        patterned({ context: 'Office / Formal', archetype: 'corporate-suit', requireFootwearType: 'derby' }),
      ];
  return [
    ...formal,
    { context: 'Office / Formal', archetype: 'corporate-separates' },
    { context: 'Office / Formal', archetype: 'corporate-separates' },
    { context: 'Office / Formal', archetype: 'shirt-tie-formal' },
    { context: 'Office / Formal', archetype: 'shirt-tie-formal' },
    { context: 'Smart Casual', archetype: 'tailored-polo' },
    { context: 'Smart Casual', archetype: 'shirt-chino' },
    { context: 'Smart Casual', archetype: 'layered-smart' },
    patterned({ context: 'Smart Casual', archetype: 'expressive-smart' }),
    ...evening,
    patterned({ context: 'Relaxed Casual', archetype: 'resort-riviera', requireFootwearType: 'espadrille' }),
    patterned({ context: 'Relaxed Casual', archetype: 'resort-riviera', requireFootwearType: 'sandal' }),
    { context: 'Relaxed Casual', archetype: 'daily-old-money' },
    { context: 'Relaxed Casual', archetype: 'daily-old-money', requireLayerType: 'knit' },
    { context: 'Relaxed Casual', archetype: 'urban-travel', requireFootwearType: 'sneaker', requireLayerType: 'utility' },
  ];
}

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

function validateSelectedReferencePortfolio(selected: ManOutfitLibraryEntry[], suppressPatterns: boolean, suitWaiver: boolean): string[] {
  const issues: string[] = [];
  const byContext = (context: ManOutfitLibraryContext) => selected.filter(entry => entry.context === context);
  const formal = byContext('Office / Formal');
  const evening = byContext('Evening Wear');
  const relaxed = byContext('Relaxed Casual');
  if (!suitWaiver && formal.filter(entry => entry.archetype === 'corporate-suit').length !== 2) issues.push('Formal must contain exactly two matched suits.');
  if (suitWaiver && formal.filter(entry => entry.archetype === 'climate-formal-layer').length !== 2) issues.push('Suit-waived Formal must contain exactly two climate-formal layers.');
  if (formal.filter(entry => entry.archetype === 'corporate-separates').length !== 2) issues.push('Formal must contain exactly two blazer separates.');
  if (formal.filter(entry => entry.archetype === 'shirt-tie-formal').length !== 2) issues.push('Formal must contain exactly two shirt-and-tie looks.');
  if (formal.filter(entry => /\btie\b/i.test(entry.accessories)).length < 3) issues.push('Formal must contain ties in at least three references.');
  if (relaxed.filter(entry => entry.archetype === 'resort-riviera').length !== 2 || relaxed.filter(entry => entry.archetype === 'daily-old-money').length !== 2 || relaxed.filter(entry => entry.archetype === 'urban-travel').length !== 1) issues.push('Relaxed Casual must use the 2 resort / 2 old-money / 1 urban-travel split.');
  if (evening.filter(entry => entry.archetype === 'statement-outerwear').length < 1) issues.push('Evening must contain statement outerwear.');
  for (const context of Object.keys(HEADER_CONTEXTS).map(key => HEADER_CONTEXTS[key]!)) {
    const counts = new Map<string, number>();
    for (const entry of byContext(context)) counts.set(entry.silhouetteFamily, (counts.get(entry.silhouetteFamily) ?? 0) + 1);
    if ([...counts.values()].some(count => count > 2)) issues.push(`${context} repeats a silhouette family more than twice.`);
  }
  const globalSilhouettes = new Map<string, number>();
  for (const entry of selected) globalSilhouettes.set(entry.silhouetteFamily, (globalSilhouettes.get(entry.silhouetteFamily) ?? 0) + 1);
  if ([...globalSilhouettes.values()].some(count => count > 3)) issues.push('A silhouette family appears more than three times across the portfolio.');
  const patterned = selected.filter(entry => entry.patternFamily !== 'solid').length;
  if (!suppressPatterns && (patterned < 5 || patterned > 7)) issues.push(`Portfolio needs 5-7 patterned pieces; found ${patterned}.`);
  if (new Set(selected.map(footwearType)).size < 6) issues.push('Portfolio needs at least six footwear types.');
  if (new Set(selected.map(layerType).filter(Boolean)).size < 4) issues.push('Portfolio needs at least four layer types.');
  return issues;
}

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
  const suitWaiver = waivers.includes('suits');
  const selected: ManOutfitLibraryEntry[] = [];
  let previousTopColourFamily: string | null = null;
  let previousLayerColourFamily: string | null = null;

  for (const slot of referenceSlots(climate, suppressPatterns, suitWaiver)) {
    const contextSilhouettes = new Map<string, number>();
    for (const entry of selected.filter(candidate => candidate.context === slot.context)) {
      contextSilhouettes.set(entry.silhouetteFamily, (contextSilhouettes.get(entry.silhouetteFamily) ?? 0) + 1);
    }
    const ranked = library
      .filter(entry => entry.context === slot.context)
      .filter(entry => entry.archetype === slot.archetype)
      .filter(entry => entry.climateModes.includes(climate.mode))
      .filter(entry => !antiPreferenceConflict(entry, classification))
      .filter(entry => !slot.requirePattern || entry.patternFamily !== 'solid')
      .filter(entry => slot.requirePattern || entry.patternFamily === 'solid')
      .filter(entry => !slot.requireFootwearType || footwearType(entry) === slot.requireFootwearType)
      .filter(entry => !slot.requireLayerType || layerType(entry) === slot.requireLayerType)
      .filter(entry => !selected.some(chosen => chosen.id === entry.id))
      .filter(entry => (contextSilhouettes.get(entry.silhouetteFamily) ?? 0) < 2)
      .sort((a, b) => semanticReferenceScore(b, classification, fingerprint) - semanticReferenceScore(a, classification, fingerprint) || a.id - b.id);
    const next = ranked.find(entry => {
      const topFamily = getManOutfitPrimaryColourFamily(entry.top);
      const layerFamily = /^no layer$/i.test(entry.layer) ? null : getManOutfitPrimaryColourFamily(entry.layer);
      return topFamily !== previousTopColourFamily && (!layerFamily || layerFamily !== previousLayerColourFamily);
    }) ?? ranked.find(entry => getManOutfitPrimaryColourFamily(entry.top) !== previousTopColourFamily) ?? ranked[0];
    if (!next) {
      throw new Error(`ICONIK v2 library cannot satisfy ${slot.context} / ${slot.archetype}${slot.requirePattern ? ' patterned' : ''} for ${climate.label}.`);
    }
    selected.push(next);
    previousTopColourFamily = getManOutfitPrimaryColourFamily(next.top);
    previousLayerColourFamily = /^no layer$/i.test(next.layer) ? null : getManOutfitPrimaryColourFamily(next.layer);
  }

  const portfolioIssues = validateSelectedReferencePortfolio(selected, suppressPatterns, suitWaiver);
  if (portfolioIssues.length) throw new Error(`ICONIK v2 portfolio selection failed: ${portfolioIssues.join(' ')}`);
  return selected;
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
ACCESSORY: ${entry.accessories}`).join('\n\n');

  return `# ICONIK MEN'S REFERENCE OUTFIT LIBRARY

The following client-tested library looks are mandatory one-to-one sources for this Section 4 generation. They are private prompt references, never client-facing citations.

REFERENCE LOCK — non-negotiable:
- Final Outfit 1 must be adapted from Mandatory Source 1, Final Outfit 2 from Mandatory Source 2, continuing in order through Final Outfit 20. Do not choose another formula or invent an unrelated look.
- Preserve the assigned source look's core top, layer/no-layer decision, bottom silhouette, footwear category, and accessory/styling architecture. The source must remain visibly recognisable after adaptation.
- Make only the client-specific tweaks required by the classification: colour season and undertone, climate, body geometry, fit directive, formality, anti-preferences, and explicit client notes. If a required tweak changes a garment, use the nearest real-garment equivalent — do not redesign the outfit.
- This reference lock overrides any tendency to generate a generic outfit from the rules alone. The v6.1 rules still decide whether a source detail must be adapted or removed for safety.
- Footwear category lock: keep every source's footwear category (Oxford, Derby, loafer, boot, chukka, sneaker, espadrille, sandal) exactly — the portfolio's minimum of 6 footwear types is deterministic and mandatory. Adapt the material, colour, or sole for climate within the category; never substitute a different category.
- Layer lock: never delete a source layer. If a source layer is unsafe for the climate or the client's anti-preferences, replace it with a permitted equivalent layer of similar formality. Only sources whose LAYER reads "No layer" may be layerless — Evening has a hard maximum of 2 no-layer looks.
- Never introduce satin, silk, or any shiny fabric anywhere, including ties, pocket squares, and linings. Ties must read grenadine, knitted, or matte woven.
- Consecutive visual variation is mandatory: Final Outfits 1–20 must not repeat the same or a near-identical primary top colour family in adjacent slots. Treat white, ecru, ivory, cream, off-white, chalk, and bone as one light-neutral family; stone, oatmeal, sand, and beige as one pale-earth family. Apply the same no-repeat principle to consecutive visible layers.
- When the client's palette forces a recolour, the new top or layer colour must still land in a different colour family from both the previous and the next outfit's final top/layer. Check every recolour against each source's TOP COLOUR FAMILY line before finalising; do not default multiple adjacent tops into blue or another single family.

Library version: ${MAN_OUTFIT_LIBRARY_VERSION}. The source library is Warm Autumn-led. Never copy its colours blindly: the client's classification always wins near the face and across the outfit. Current climate mode: ${climate.label} (${climate.mode.toUpperCase()}). ${climate.promptGuidance} Do not mention library look numbers, source references, or adaptation in the visible report.

The required 6/4/5/5 context split is already mapped below. Preserve the assigned archetype and silhouette family as well as the core garments. Formal must remain strict corporate formal; Evening must read unmistakably night-out; Relaxed Casual must preserve its exact 2 Resort/Riviera + 2 Daily Old-Money + 1 Urban/Travel portfolio. Across the final 20 use 5-7 patterned pieces unless the client explicitly rejects patterns, at least 6 footwear types, and no silhouette family more than twice inside one context or three times overall. Keep all v6.1 diversity, garment-reality, climate, and QA rules.

## SELECTED REFERENCES

${references}`;
}
