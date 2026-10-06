import { requiresIndianCasual } from './manOutfitConsistency';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ClassificationResult } from './manReportGenerator';
import {
  findManColourMentions,
  readManClientColouring,
  scoreManColourAwayFromFace,
  scoreManColourNearFace,
  type ManClientColouring,
} from './manOutfitColour';
import {
  buildManOutfitLadder,
  computeManContextSplit,
  manComfortBoldness,
  manPieceMatches,
  isManWeddingContext,
  type ManOutfitContext,
  type ManOutfitLadderStep,
  type ManRecommendationProfile,
} from './manRecommendationProfile';

export type ManOutfitLibraryContext = ManOutfitContext;

// v3: the Iconik board looks are picked first and the core 100 fill any gap;
// the fixed suit/tie/resort/old-money quotas are gone.
export const MAN_OUTFIT_LIBRARY_LEGACY_VERSION = 'v3-board-first' as const;
// v4: picks follow the client's recommendation profile (style tribes, boldness
// ladder, occasion split, taste test, palette fit) and keep each look's colours.
export const MAN_OUTFIT_LIBRARY_VERSION = 'v4-taste-led' as const;
export type ManOutfitLibraryVersion = typeof MAN_OUTFIT_LIBRARY_VERSION | typeof MAN_OUTFIT_LIBRARY_LEGACY_VERSION;

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
export const MAN_LIBRARY_PORTFOLIO_VERSIONS = ['v2-9plus', MAN_OUTFIT_LIBRARY_LEGACY_VERSION, MAN_OUTFIT_LIBRARY_VERSION] as const;
/** Reports whose outfits keep their board look's colours (v4 onwards). */
export function usesManColourLock(version: string | null | undefined): boolean {
  return version === MAN_OUTFIT_LIBRARY_VERSION;
}
export function getManOutfitLibraryVersion(classification: Pick<ClassificationResult, 'recommendation_profile'>): ManOutfitLibraryVersion {
  return classification.recommendation_profile ? MAN_OUTFIT_LIBRARY_VERSION : MAN_OUTFIT_LIBRARY_LEGACY_VERSION;
}
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
  | 'indian-occasion'
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
  /** Intake style tribes this look belongs to (old_money, urban_wear …). */
  tribes: string[];
  /** 1 (plain classic) … 5 (fashion-forward). Rule-based; a BOLDNESS line in the library file overrides it. */
  boldness: number;
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
  /** v4 picks only: where the look sits on the client's boldness ladder and why it was chosen. */
  ladder?: ManOutfitLadderStep;
  boldness?: number;
  targetBoldness?: number;
  tribes?: string[];
  /** 0-1: how well the colours near his face suit his colouring. */
  paletteFit?: number;
  /** 0-1: overlap with his style tribes and style poles. */
  styleMatch?: number;
}

/** Transient pick instructions from the admin: keep these looks in these slots, never use those. */
export interface ManOutfitSelectionOverrides {
  /** Outfit number (as a string key) → library look id to keep in that slot. */
  pinned?: Record<string, number>;
  /** Library look ids never to pick for this client. */
  excluded?: number[];
}

const HEADER_CONTEXTS: Record<string, ManOutfitLibraryContext> = {
  'OFFICE / FORMAL': 'Office / Formal',
  'SMART CASUAL': 'Smart Casual',
  'EVENING WEAR': 'Evening Wear',
  'RELAXED CASUAL': 'Relaxed Casual',
  HALDI: 'Haldi',
  MEHENDI: 'Mehendi',
  SANGEET: 'Sangeet',
  'WEDDING CEREMONY': 'Wedding Ceremony',
  RECEPTION: 'Reception',
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

function readOccasionLibraryFile(): string {
  return readFileSync(join(process.cwd(), 'src/lib/ICONIK_Mens_Library_Occasion.md'), 'utf-8');
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
    // "Leather loafers" is not streetwear: only leather outerwear counts.
    ['urban', /leather(?:-look)?\s+(?:jacket|bomber|blouson)|varsity|bomber|harrington|denim|jeans|sneaker|utility|trucker|cargo/],
    ['corporate', /\bsuit\b|blazer|\btie\b|oxford shoes?|derby|folio/],
    ['patterned', ANY_PATTERN_PATTERN],
    ['leather-jacket', /leather.*(?:jacket|bomber|blouson|racer)/],
    ['varsity-jacket', /varsity|letterman/],
    ['statement-jacket', /(?:leather|suede)(?:-look)?[^,;|]*\b(?:jacket|bomber|blouson)\b|varsity|harrington|bomber/],
    ['relaxed-tailoring', /pleated|wide-leg|relaxed straight|fluid drape/],
  ];
  for (const [tag, pattern] of rules) if (pattern.test(text)) tags.add(tag);
  return [...tags];
}

type GarmentText = Pick<ManOutfitLibraryEntry, 'top' | 'bottom' | 'layer' | 'footwear' | 'accessories' | 'context'>;

/** Garment text joined with " | " so a rule can tell the top from the trousers. */
export function manLookPieceText(entry: Pick<ManOutfitLibraryEntry, 'top' | 'bottom' | 'layer' | 'footwear' | 'accessories'>): string {
  const layer = /^(none|no layer)\b/i.test(entry.layer.trim()) ? '' : entry.layer;
  return [entry.top, layer, entry.bottom, entry.footwear, entry.accessories].join(' | ');
}

const NEUTRAL_FAMILIES = new Set(['white', 'cream', 'beige', 'tan', 'brown', 'grey', 'charcoal', 'black', 'navy', 'light-blue', 'denim']);

/**
 * Intake style tribes a look belongs to. Visible rules over the garment text; a
 * TRIBES line in the library file replaces them for one look.
 */
function tribesForEntry(entry: GarmentText): string[] {
  const top = entry.top.toLowerCase();
  const layer = /^(none|no layer)\b/i.test(entry.layer.trim()) ? '' : entry.layer.toLowerCase();
  const bottom = entry.bottom.toLowerCase();
  const shoes = entry.footwear.toLowerCase();
  const extras = entry.accessories.toLowerCase();
  const all = `${top} ${layer} ${bottom} ${shoes} ${extras}`;
  const colours = [top, layer, bottom].flatMap(text => findManColourMentions(text).map(mention => mention.info));
  const allNeutral = colours.length > 0 && colours.every(info => NEUTRAL_FAMILIES.has(info.family));
  const darkPieces = [top, layer, bottom].filter(text => text && /\b(black|charcoal|burgundy|maroon|dark|navy|deep)\b/.test(text)).length;
  const lightBottom = /\b(cream|ivory|white|beige|tan|taupe|khaki|camel|stone|sand)\b/.test(bottom);
  const tribes = new Set<string>();

  if (/kurta/.test(top)) tribes.add('indian_casual');
  if (/bandhgala|nehru|jodhpuri/.test(all)) { tribes.add('indo_authority'); tribes.add('royal_edit'); }
  if (/sherwani|velvet|brocade/.test(all)) tribes.add('royal_edit');
  if (/tuxedo|dinner jacket|bow tie|velvet blazer/.test(all)) tribes.add('classic_evening');

  if (/\bsuit\b|suit jacket|\btie\b|briefcase/.test(all)) tribes.add('power_classic');
  if (/blazer/.test(layer) && !/\btie\b/.test(all)) tribes.add('new_boardroom');
  if (/(shirt|turtleneck|high-neck|pullover|knit)/.test(top) && /tailored|trousers/.test(bottom) && !/jeans|shorts|cargo/.test(bottom)
      && /loafer|dress shoe|leather shoe|derby|oxford|chelsea/.test(shoes) && !/\btie\b/.test(all) && !/polo/.test(top)) {
    tribes.add('new_boardroom');
  }

  if ((/loafer/.test(shoes) && lightBottom && !/jeans|cargo/.test(bottom))
      || /draped|over the shoulders|cable|rugby|pleated|quilted|tweed|cardigan|sweater vest|knit polo|ribbed .*polo/.test(all)
      || (/striped|stripe/.test(top) && /shirt/.test(top) && lightBottom)) {
    tribes.add('old_money');
  }
  if (allNeutral && !/stripe|check|plaid|print|graphic/.test(all) && !/sneaker/.test(shoes) && /knit|polo|sweater|suede|cashmere|merino|turtleneck|high-neck|overshirt|tailored/.test(all)) {
    tribes.add('quiet_luxury');
  }

  if (/leather(?:-look)? jacket|bomber|varsity|utility|cargo|black jeans|grey jeans|graphic|\bcap\b|plaid overshirt|loose .*trousers|relaxed .*trousers/.test(all)
      || (/\b(tee|t-shirt)\b/.test(top) && /jacket/.test(layer))
      || (/black/.test(top) && /black/.test(bottom))) {
    tribes.add('urban_wear');
  }
  if ((/\b(tee|t-shirt|sweatshirt|polo|short-sleeve)\b/.test(top) && /jeans|chinos|shorts|relaxed|trousers/.test(bottom) && /sneaker|slip-on|loafer|flip-flop|sandal|golf/.test(shoes))
      || /denim jacket|overshirt|chore|shorts|sweatshirt|hoodie/.test(all)) {
    tribes.add('off_duty');
  }
  if (darkPieces >= 2 && /chelsea|boots|leather(?:-look)? jacket|turtleneck|high-neck|pendant|necklace|black|burgundy|maroon/.test(all)) {
    tribes.add('dark_romantic');
  }
  if ((entry.context === 'Evening Wear' && !/shorts|sneaker/.test(`${bottom} ${shoes}`))
      || ((/black|charcoal|navy|burgundy|dark/.test(top) || /bomber|suede|leather/.test(layer)) && /chelsea|loafer|dress shoe/.test(shoes) && !/jeans|shorts/.test(bottom))) {
    tribes.add('sharp_evening');
  }
  if (entry.context === 'Evening Wear' && /sweater|knit/.test(top) && /collar|shirt/.test(layer) && /dress shoe|leather shoe|derby|oxford/.test(shoes)) {
    tribes.add('classic_evening');
  }

  if (!tribes.size) {
    tribes.add(entry.context === 'Office / Formal' ? 'new_boardroom' : entry.context === 'Evening Wear' ? 'sharp_evening' : 'off_duty');
  }
  return [...tribes];
}

/**
 * 1 (plain classic) … 5 (fashion-forward), counted from visible features:
 * colour near the face, pattern, statement outerwear, an unusual silhouette or
 * styling move, and jewellery or bags. A BOLDNESS line in the library file wins.
 */
function boldnessForEntry(entry: GarmentText): number {
  const layer = /^(none|no layer)\b/i.test(entry.layer.trim()) ? '' : entry.layer;
  const nearFace = [entry.top, layer].flatMap(text => findManColourMentions(text).map(mention => mention.info));
  const bottomColours = findManColourMentions(entry.bottom).map(mention => mention.info);
  const all = `${entry.top} ${layer} ${entry.bottom} ${entry.footwear} ${entry.accessories}`.toLowerCase();
  const loudest = nearFace.reduce((max, info) => Math.max(max, info.loudness), 0);
  let score = 1;
  score += loudest === 2 ? 2 : loudest;
  if (bottomColours.some(info => info.loudness >= 1 || ['white'].includes(info.family)) && !/shorts/.test(entry.bottom.toLowerCase())) score += 1;
  if (/stripe|striped|check|checked|plaid|gingham|graphic|print/.test(`${entry.top} ${layer}`.toLowerCase())) score += 1;
  const layerColours = findManColourMentions(layer).map(mention => mention.info);
  if (/leather(?:-look)? jacket|suede(?:-look)? jacket|bomber|varsity|double-breasted|quilted|sweater vest|bandhgala/.test(all)
      || (/blazer/.test(layer.toLowerCase()) && layerColours.some(info => info.loudness >= 1 || info.family === 'white' || info.family === 'cream'))) score += 1;
  const topFamily = findManColourMentions(entry.top)[0]?.info.family;
  const tonal = Boolean(topFamily) && topFamily === bottomColours[0]?.family
    && (!layerColours.length || layerColours[0].family === topFamily);
  if (tonal || /draped|over the shoulders|turtleneck|high-neck|pleated|cargo|loose|relaxed .*trousers|wide|carried over/.test(all)
      || (/\b(tee|t-shirt)\b/.test(entry.top.toLowerCase()) && /shirt, worn open|overshirt/.test(layer.toLowerCase()))) score += 1;
  if (/pendant|necklace|bracelet|chain|scarf|tote|crossbody|\bcap\b/.test(all)) score += 1;
  return Math.max(1, Math.min(5, score));
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
      tribes: parseMetadataList(block, 'TRIBES'),
      boldness: Number(getField(block, 'BOLDNESS')) || 0,
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
    entry.tribes = entry.tribes.length ? entry.tribes : tribesForEntry(entry);
    entry.boldness = entry.boldness >= 1 && entry.boldness <= 5 ? Math.round(entry.boldness) : boldnessForEntry(entry);

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
      ...parseManOutfitLibrary(readOccasionLibraryFile(), 'board'),
      ...parseManOutfitLibrary(readCoreLibraryFile(), 'core'),
    ];
  }
  return cachedLibrary;
}

const INDIAN_PLACES = /india|mumbai|bombay|delhi|gurgaon|gurugram|noida|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|ahmedabad|surat|jaipur|lucknow|chandigarh|kochi|cochin|goa|indore|bhopal|nagpur|coimbatore|vizag|visakhapatnam|mysore|mysuru|vadodara|nashik|thane|ludhiana|amritsar|kanpur|patna|bhubaneswar|guwahati|dehradun|raipur|ranchi|trivandrum|thiruvananthapuram|mangalore|madurai/;
const GULF_PLACES = /uae|middle\s*east|dubai|abu dhabi|sharjah|doha|qatar|riyadh|jeddah|saudi|muscat|oman|kuwait|bahrain|manama/;
const TROPICAL_PLACES = /singapore|kuala lumpur|malaysia|bangkok|thailand|jakarta|indonesia|manila|philippines|colombo|sri lanka|dhaka|bangladesh|lagos|nairobi|mauritius|maldives|ho chi minh|vietnam/;
const SOUTHERN_TEMPERATE_PLACES = /australia|sydney|melbourne|brisbane|perth|adelaide|new zealand|auckland|wellington|south africa|cape town|johannesburg/;
const NORTHERN_TEMPERATE_PLACES = /united kingdom|\buk\b|england|scotland|london|manchester|birmingham|edinburgh|canada|toronto|vancouver|montreal|calgary|usa|united states|new york|chicago|boston|seattle|san francisco|los angeles|texas|houston|dallas|new jersey|europe|germany|berlin|munich|frankfurt|france|paris|netherlands|amsterdam|ireland|dublin|switzerland|zurich|sweden|norway|denmark|italy|milan|spain|madrid|japan|tokyo|korea|seoul|hong kong/;

export function getManReportClimateProfile(
  classification: Pick<ClassificationResult, 'client'> & { recommendation_profile?: { city?: string } | null },
  now = new Date(),
): ManReportClimateProfile {
  // The city answer is more precise than the region tier ("Other" says nothing about weather).
  const location = `${classification.recommendation_profile?.city ?? ''} ${classification.client.location_region ?? ''}`.toLowerCase();
  const month = now.getUTCMonth() + 1;
  const isIndia = INDIAN_PLACES.test(location);
  const isUae = !isIndia && GULF_PLACES.test(location);
  const isTropical = !isIndia && !isUae && TROPICAL_PLACES.test(location);
  const isSouthernTemperate = SOUTHERN_TEMPERATE_PLACES.test(location);
  const isNorthernTemperate = !isSouthernTemperate && NORTHERN_TEMPERATE_PLACES.test(location);

  if (isTropical) {
    return {
      mode: 'hot',
      label: 'tropical climate',
      promptGuidance: 'Use hot-weather dressing: lightweight cotton, linen-cotton, breathable knits, and restrained layering. Do not use leather outerwear, turtlenecks, wool, flannel, merino, corduroy, overcoats, puffers, scarves, thick tweed, or velvet.',
    };
  }

  if (isSouthernTemperate) {
    // Seasons are flipped south of the equator.
    const southernMonth = ((month + 5) % 12) + 1;
    if (southernMonth === 12 || southernMonth <= 2) {
      return { mode: 'cool', label: 'southern-hemisphere winter', promptGuidance: 'Use seasonally appropriate knitwear, outerwear, and substantial footwear when the occasion benefits from them. Keep layers proportionate and polished.' };
    }
    if (southernMonth >= 6 && southernMonth <= 8) {
      return { mode: 'temperate', label: 'southern-hemisphere summer', promptGuidance: 'Use light shirts, breathable knitwear, and optional unlined layers. Avoid both peak-summer tropical assumptions and heavy winter layering.' };
    }
    return { mode: 'mild', label: 'southern-hemisphere transitional season', promptGuidance: 'Use flexible transitional layers, refined knits, and weather-appropriate footwear without over-layering.' };
  }

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

// v3 outfits per occasion, in report order (Outfit 1-6 Office, 7-10 Smart, 11-15 Evening, 16-20 Relaxed).
// v4 reports use computeManContextSplit instead.
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
  return Boolean(classification.recommendation_profile?.never_pieces.includes('patterns'))
    || /\b(no|avoid|dislike|hate)\b.{0,24}\b(pattern|print|stripe|check)/i.test(
      `${classification.style_brief.anti_preferences} ${classification.colour.pattern_guidance} ${classification.recommendation_profile?.anti_pref_note ?? ''}`,
    );
}

/** Workplaces where a suit or tie would look out of place. */
const NO_SUIT_DRESS_CODES = new Set(['business_casual', 'casual', 'no_office']);

export function getManOutfitSelectionWaivers(classification: ClassificationResult): string[] {
  const profile = classification.recommendation_profile;
  const anti = `${classification.style_brief.anti_preferences} ${profile?.anti_pref_note ?? ''}`;
  const relaxedWorkplace = Boolean(profile && NO_SUIT_DRESS_CODES.has(profile.dress_code));
  return [
    explicitPatternAversion(classification) ? 'patterns' : null,
    relaxedWorkplace || profile?.never_pieces.includes('suit') || /\b(no|avoid|dislike|hate)\b.{0,18}\bsuits?\b/i.test(anti) ? 'suits' : null,
    relaxedWorkplace || profile?.never_pieces.includes('tie') || /\b(no|avoid|dislike|hate)\b.{0,18}\bties?\b/i.test(anti) ? 'ties' : null,
  ].filter(Boolean) as string[];
}

const OFFICE_UNSAFE = /\b(tee|t-shirt|polo|denim|jeans|sneakers?|drawstring|cargo|camp[-\s]?collar|overshirt|rugby|henley|shorts|sweatshirt|hoodie|flip-flops?|sandals?|cap|draped|carried)\b|worn open|over the shoulders/i;

/** A smart-casual look that would pass in a business-casual office. */
function isOfficeSafe(entry: ManOutfitLibraryEntry): boolean {
  const garments = `${entry.top} ${/^(none|no layer)\b/i.test(entry.layer) ? '' : entry.layer} ${entry.bottom} ${entry.footwear}`;
  return !OFFICE_UNSAFE.test(garments) && /trousers|chinos/i.test(entry.bottom) && /loafer|shoe|boot|derby|oxford/i.test(entry.footwear);
}

function hasTie(entry: ManOutfitLibraryEntry): boolean {
  return /\btie\b/i.test(`${entry.top} ${entry.accessories}`);
}

function isSuit(entry: ManOutfitLibraryEntry): boolean {
  return entry.silhouetteFamily === 'suit' || entry.archetype === 'corporate-suit' || /suit jacket|\bsuit\b/i.test(`${entry.layer} ${entry.bottom}`);
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

function validateSelectedReferencePortfolio(
  selected: ManOutfitLibraryEntry[],
  split: Array<[ManOutfitLibraryContext, number]> = CONTEXT_SPLIT,
): string[] {
  const issues: string[] = [];
  for (const [context, count] of split) {
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
  overrides: ManOutfitSelectionOverrides = {},
): ManOutfitLibraryEntry[] {
  return selectManOutfitLibraryPicks(classification, library, now, selectionSalt, overrides).map(pick => pick.entry);
}

export interface ManOutfitLibraryPick {
  entry: ManOutfitLibraryEntry;
  ladder?: ManOutfitLadderStep;
  targetBoldness?: number;
  paletteFit?: number;
  styleMatch?: number;
}

/** The 20 source looks with the reasons they were chosen. v4 when the classification carries a recommendation profile. */
export function selectManOutfitLibraryPicks(
  classification: ClassificationResult,
  library = getManOutfitLibrary(),
  now = new Date(),
  selectionSalt = '',
  overrides: ManOutfitSelectionOverrides = {},
): ManOutfitLibraryPick[] {
  if (classification.recommendation_profile) {
    return selectTasteLedPicks(classification, classification.recommendation_profile, library, now, selectionSalt, overrides);
  }
  return selectLegacyReferences(classification, library, now, selectionSalt).map(entry => ({ entry }));
}

// ── v4: taste-led selection ─────────────────────────────────────────────────

/** Tribes that sit next to each other, so a near miss still scores. */
const RELATED_TRIBES: Record<string, string[]> = {
  old_money: ['quiet_luxury', 'new_boardroom'],
  off_duty: ['urban_wear'],
  urban_wear: ['off_duty', 'dark_romantic'],
  indian_casual: ['indo_authority'],
  power_classic: ['new_boardroom', 'classic_evening'],
  new_boardroom: ['power_classic', 'quiet_luxury', 'sharp_evening'],
  dark_romantic: ['sharp_evening', 'urban_wear'],
  indo_authority: ['royal_edit', 'indian_casual'],
  quiet_luxury: ['old_money', 'new_boardroom'],
  sharp_evening: ['dark_romantic', 'classic_evening', 'new_boardroom'],
  royal_edit: ['indo_authority'],
  classic_evening: ['sharp_evening', 'power_classic'],
};

/** Most outfits that may lead with a black top or layer; past this the report reads as one black uniform. */
const MAX_BLACK_LED = 4;
/** v4 lets a silhouette he likes appear four times across the 20 (still at most twice per occasion). */
const MAX_FAMILY_TASTE_LED = 4;
const MAX_WHITE_SNEAKERS = 5;

function nearFaceColours(entry: ManOutfitLibraryEntry) {
  const layer = /^(none|no layer)\b/i.test(entry.layer.trim()) ? '' : entry.layer;
  return {
    top: findManColourMentions(entry.top).map(mention => mention.info),
    layer: findManColourMentions(layer).map(mention => mention.info),
  };
}

function isBlackLed(entry: ManOutfitLibraryEntry): boolean {
  const { top, layer } = nearFaceColours(entry);
  return top[0]?.family === 'black' || layer[0]?.family === 'black';
}

function hasWhiteSneakers(entry: ManOutfitLibraryEntry): boolean {
  return /\bwhite\b[^,;|]*sneakers?/i.test(entry.footwear);
}

/** 0-1: how well the colours near his face (and, lightly, the rest) suit his colouring. */
export function manLookPaletteFit(entry: ManOutfitLibraryEntry, colouring: ManClientColouring): number {
  const { top, layer } = nearFaceColours(entry);
  const score = (infos: typeof top) => infos.length
    ? Math.min(...infos.map(info => scoreManColourNearFace(info, colouring))) * 0.6
      + Math.max(...infos.map(info => scoreManColourNearFace(info, colouring))) * 0.4
    : 0.1;
  const nearFace = layer.length ? score(top) * 0.5 + score(layer) * 0.5 : score(top);
  const away = [entry.bottom, entry.footwear]
    .flatMap(text => findManColourMentions(text).map(mention => scoreManColourAwayFromFace(mention.info, colouring)))
    .reduce((sum, value) => sum + value, 0);
  return Math.max(0, Math.min(1, (nearFace + 1) / 2 + away * 0.15));
}

function poleFit(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile): number {
  const text = manLookPieceText(entry).toLowerCase();
  const tailored = /blazer|suit|tailored/.test(text);
  const loud = [...nearFaceColours(entry).top, ...nearFaceColours(entry).layer].some(info => info.loudness >= 1);
  let fit = 0;
  if (profile.poles.structure === 'structured') fit += tailored ? 0.4 : -0.1;
  if (profile.poles.structure === 'fluid') fit += tailored && /blazer|suit/.test(text) ? -0.2 : 0.2;
  const busy = /graphic|\bcap\b|crossbody|pendant|necklace|bracelet|chain/.test(text);
  if (profile.poles.expression === 'minimal') fit += entry.patternFamily !== 'solid' || /graphic/.test(text) ? -0.2 : busy ? -0.15 : 0.2;
  if (profile.poles.expression === 'expressive') fit += entry.patternFamily !== 'solid' || loud ? 0.3 : -0.1;
  if (profile.poles.tone === 'classic') {
    fit += entry.tribes.some(tribe => ['old_money', 'quiet_luxury', 'new_boardroom', 'power_classic', 'classic_evening'].includes(tribe)) ? 0.2 : 0;
    if (/graphic|\bcap\b|crossbody|\bshorts\b/.test(text)) fit -= 0.3;
  }
  if (profile.poles.tone === 'current') fit += entry.tribes.some(tribe => ['urban_wear', 'dark_romantic', 'off_duty'].includes(tribe)) || entry.boldness >= 3 ? 0.3 : -0.1;
  if (profile.poles.register === 'dressed_down') fit += hasTie(entry) || isSuit(entry) ? -0.4 : 0.1;
  if (profile.poles.register === 'dressed_up') fit += tailored ? 0.2 : 0;
  return Math.max(-1, Math.min(1, fit));
}

/** 0-1: overlap with his chosen tribes, softened by related tribes and his style poles. */
export function manLookStyleMatch(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile): number {
  const wanted = profile.tribes;
  let tribeScore = 0.5;
  if (wanted.length) {
    const direct = wanted.filter(tribe => entry.tribes.includes(tribe)).length;
    const related = wanted.filter(tribe => (RELATED_TRIBES[tribe] ?? []).some(other => entry.tribes.includes(other))).length;
    tribeScore = direct ? Math.min(1, 0.75 + 0.25 * (direct - 1) + 0.1 * related) : related ? 0.45 : 0.1;
  }
  return Math.max(0, Math.min(1, tribeScore * 0.75 + ((poleFit(entry, profile) + 1) / 2) * 0.25));
}

function lookSimilarity(a: ManOutfitLibraryEntry, b: ManOutfitLibraryEntry): number {
  const union = new Set([...a.tribes, ...b.tribes]).size || 1;
  const shared = a.tribes.filter(tribe => b.tribes.includes(tribe)).length;
  return 0.5 * (shared / union)
    + 0.3 * (a.silhouetteFamily === b.silhouetteFamily ? 1 : 0)
    + 0.2 * (1 - Math.abs(a.boldness - b.boldness) / 4);
}

interface TasteLookups {
  loved: ManOutfitLibraryEntry[];
  tried: ManOutfitLibraryEntry[];
  rejected: ManOutfitLibraryEntry[];
}

function readTaste(profile: ManRecommendationProfile, library: ManOutfitLibraryEntry[]): TasteLookups {
  const find = (verdict: string) => Object.entries(profile.taste)
    .filter(([, value]) => value === verdict)
    .map(([id]) => library.find(entry => entry.id === Number(id)))
    .filter((entry): entry is ManOutfitLibraryEntry => Boolean(entry));
  return { loved: find('love'), tried: find('try'), rejected: find('never') };
}

function tasteAffinity(entry: ManOutfitLibraryEntry, taste: TasteLookups): number {
  const best = (list: ManOutfitLibraryEntry[]) => list.reduce((max, other) => Math.max(max, lookSimilarity(entry, other)), 0);
  let score = 0.35 * best(taste.loved) + 0.15 * best(taste.tried) - 0.35 * best(taste.rejected);
  if (taste.loved.some(other => other.id === entry.id)) score += 0.25;
  if (taste.tried.some(other => other.id === entry.id)) score += 0.1;
  return score;
}

/** His comfort boldness, nudged toward the looks he loved in the taste test. */
export function manClientComfortBoldness(profile: ManRecommendationProfile, library = getManOutfitLibrary()): number {
  const base = manComfortBoldness(profile);
  const taste = readTaste(profile, library);
  const liked = [...taste.loved, ...taste.loved, ...taste.tried];
  if (!liked.length) return base;
  const tasteLevel = liked.reduce((sum, entry) => sum + entry.boldness, 0) / liked.length;
  return Math.max(2, Math.min(5, Math.round((base + tasteLevel) / 2)));
}

function colourBoldnessFit(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile): number {
  const { top, layer } = nearFaceColours(entry);
  const loudness = [...top, ...layer, ...findManColourMentions(entry.bottom).map(mention => mention.info)]
    .reduce((max, info) => Math.max(max, info.loudness), 0);
  const level = profile.colour_boldness;
  if (loudness === 2) return level <= 3 ? -0.3 : level <= 5 ? -0.05 : 0.12;
  if (loudness === 1) return level <= 2 ? -0.12 : level >= 6 ? 0.1 : 0.04;
  return level >= 7 ? -0.08 : 0.02;
}

function feedbackWeight(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile): number {
  const net = profile.look_feedback?.[String(entry.id)] ?? 0;
  return Math.max(-3, Math.min(3, net)) * 0.05;
}

function neverPieceConflict(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile): boolean {
  const text = manLookPieceText(entry);
  return profile.never_pieces.some(piece => !['suit', 'tie', 'patterns'].includes(piece) && manPieceMatches(piece, text));
}

function tryPieceBonus(entry: ManOutfitLibraryEntry, profile: ManRecommendationProfile, selected: ManOutfitLibraryEntry[]): number {
  const text = manLookPieceText(entry);
  return profile.try_pieces.reduce((bonus, piece) => {
    if (!manPieceMatches(piece, text)) return bonus;
    const covered = selected.some(chosen => manPieceMatches(piece, manLookPieceText(chosen)));
    return bonus + (covered ? 0.06 : 0.2);
  }, 0);
}

function lightVarietyBonus(entry: ManOutfitLibraryEntry, selected: ManOutfitLibraryEntry[]): number {
  let bonus = 0;
  if (!selected.some(chosen => footwearType(chosen) === footwearType(entry))) bonus += 0.06;
  const layer = layerType(entry);
  if (layer && !selected.some(chosen => layerType(chosen) === layer)) bonus += 0.05;
  return bonus;
}

function selectTasteLedPicks(
  classification: ClassificationResult,
  profile: ManRecommendationProfile,
  library: ManOutfitLibraryEntry[],
  now: Date,
  selectionSalt: string,
  overrides: ManOutfitSelectionOverrides,
): ManOutfitLibraryPick[] {
  const fingerprint = `${clientFingerprint(classification)}|${selectionSalt}`;
  const climate = getManReportClimateProfile(classification, now);
  const suppressPatterns = explicitPatternAversion(classification);
  const waivers = getManOutfitSelectionWaivers(classification);
  const wantsIndianCasual = requiresIndianCasual(classification) || profile.try_pieces.includes('kurta');
  const wantsIndoWestern = profile.try_pieces.includes('bandhgala')
    || profile.tribes.some(tribe => ['indo_authority', 'royal_edit'].includes(tribe))
    || profile.taste['343'] === 'love';
  const colouring = readManClientColouring(classification.colour, profile.white_preference);
  const taste = readTaste(profile, library);
  const split = computeManContextSplit(profile);
  const ladder = buildManOutfitLadder(split, manClientComfortBoldness(profile, library));
  const excluded = new Set([...(overrides.excluded ?? []), ...taste.rejected.map(entry => entry.id)]);
  const pinned = overrides.pinned ?? {};
  const relaxedWorkplace = NO_SUIT_DRESS_CODES.has(profile.dress_code);
  const slotPicks: Array<ManOutfitLibraryPick | undefined> = ladder.map(() => undefined);
  const selected = () => slotPicks.flatMap(pick => pick ? [pick.entry] : []);
  const topFamily = (entry?: ManOutfitLibraryEntry) => entry ? getManOutfitPrimaryColourFamily(entry.top) : null;
  const layerFamily = (entry?: ManOutfitLibraryEntry) => !entry || /^no layer$/i.test(entry.layer) ? null : getManOutfitPrimaryColourFamily(entry.layer);
  let indianPlaced = 0;
  // Pinned slots first, then the boldest ladder steps, so stretch slots get
  // first claim on the bold looks instead of whatever comfort slots leave.
  const stepPriority: Record<ManOutfitLadderStep, number> = { stretch: 0, 'step-up': 1, comfort: 2 };
  const fillOrder = ladder
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => Number(Boolean(pinned[String(b.index + 1)])) - Number(Boolean(pinned[String(a.index + 1)]))
      || stepPriority[a.slot.step] - stepPriority[b.slot.step]
      || a.index - b.index);

  for (const { slot, index } of fillOrder) {
    const outfitNumber = index + 1;
    const context = slot.context;
    void outfitNumber;
    const pinnedSource = library.find(entry => entry.id === pinned[String(outfitNumber)]);
    const pinnedEntry = pinnedSource && pinnedSource.context !== context ? { ...pinnedSource, context } : pinnedSource;
    let chosen = pinnedEntry && !selected().some(item => item.id === pinnedEntry.id) ? pinnedEntry : undefined;

    if (!chosen) {
      const indianSlot = wantsIndianCasual && context === 'Relaxed Casual' && indianPlaced < 2;
      const inContext = selected().filter(entry => entry.context === context);
      const silhouetteCount = (family: string, scope: ManOutfitLibraryEntry[]) => scope.filter(entry => entry.silhouetteFamily === family).length;
      const patternedSoFar = selected().filter(entry => entry.patternFamily !== 'solid').length;
      const blackLedSoFar = selected().filter(isBlackLed).length;
      const whiteSneakersSoFar = selected().filter(hasWhiteSneakers).length;
      // A relaxed workplace's office looks can come from office-safe smart-casual
      // board looks (shirt or knit with tailored trousers), relabelled as Office.
      const borrowOfficeLooks = context === 'Office / Formal' && profile.dress_code !== 'suit_tie';
      const contextPool = library.flatMap(entry => {
        if (entry.context === context) return [entry];
        if (borrowOfficeLooks && entry.context === 'Smart Casual' && entry.tier === 'board' && isOfficeSafe(entry)) return [{ ...entry, context }];
        return [];
      });
      const eligibleBeforeCaps = contextPool
        .filter(entry => indianSlot ? entry.archetype === 'indian-casual' : !INDIAN_ARCHETYPES.has(entry.archetype) || (context === 'Evening Wear' && entry.archetype === 'indian-formal' && wantsIndoWestern))
        .filter(entry => entry.climateModes.includes(climate.mode))
        .filter(entry => !antiPreferenceConflict(entry, classification))
        .filter(entry => !waivers.includes('ties') || !hasTie(entry))
        .filter(entry => !waivers.includes('suits') || !isSuit(entry))
        .filter(entry => entry.patternFamily === 'solid' || (!suppressPatterns && patternedSoFar < MAX_PATTERNED))
        .filter(entry => !selected().some(chosenEntry => chosenEntry.id === entry.id))
        .filter(entry => !excluded.has(entry.id));
      const withinCaps = eligibleBeforeCaps
        .filter(entry => silhouetteCount(entry.silhouetteFamily, inContext) < 2)
        .filter(entry => silhouetteCount(entry.silhouetteFamily, selected()) < MAX_FAMILY_TASTE_LED);
      // Variety caps give way before the report does.
      const base = withinCaps.length ? withinCaps : eligibleBeforeCaps;
      // Soft limits: drop them only when nothing else is left.
      const preferred = base
        .filter(entry => !neverPieceConflict(entry, profile))
        .filter(entry => !isBlackLed(entry) || blackLedSoFar < MAX_BLACK_LED)
        .filter(entry => !hasWhiteSneakers(entry) || whiteSneakersSoFar < MAX_WHITE_SNEAKERS);
      const pool = preferred.length ? preferred : base;
      const tier = pool.some(entry => entry.tier === 'board') ? pool.filter(entry => entry.tier === 'board') : pool;
      const current = selected();
      const score = (entry: ManOutfitLibraryEntry) => {
        // Falling short of a stretch slot costs more than overshooting a comfort one.
        const under = Math.max(0, slot.targetBoldness - entry.boldness);
        const over = Math.max(0, entry.boldness - slot.targetBoldness);
        const ladderFit = 1 - under * 0.3 - over * 0.25;
        const officeTone = context === 'Office / Formal' && profile.dress_code === 'smart_no_tie' ? (hasTie(entry) ? -0.2 : 0) - (isSuit(entry) ? 0.1 : 0) : 0;
        return 0.3 * manLookStyleMatch(entry, profile)
          + 0.35 * ladderFit
          + 0.22 * manLookPaletteFit(entry, colouring)
          + 0.08 * bodyCompatibilityScore(entry, classification)
          + tasteAffinity(entry, taste)
          + tryPieceBonus(entry, profile, current)
          + colourBoldnessFit(entry, profile)
          + feedbackWeight(entry, profile)
          + lightVarietyBonus(entry, current)
          + officeTone
          + (relaxedWorkplace && context === 'Office / Formal' && /blazer/i.test(entry.layer) && profile.poles.structure !== 'structured' ? -0.05 : 0)
          + (stableHash(`${fingerprint}|${entry.context}|${entry.id}`) / 0xffffffff) * 0.03;
      };
      const ranked = [...tier].sort((a, b) => score(b) - score(a) || a.id - b.id);
      const neighbours = [slotPicks[index - 1]?.entry, slotPicks[index + 1]?.entry].filter((entry): entry is ManOutfitLibraryEntry => Boolean(entry));
      const clashesTop = (entry: ManOutfitLibraryEntry) => neighbours.some(other => topFamily(other) === topFamily(entry));
      const clashesLayer = (entry: ManOutfitLibraryEntry) => Boolean(layerFamily(entry)) && neighbours.some(other => layerFamily(other) === layerFamily(entry));
      // Neighbouring outfits should look different, but not at the cost of a
      // clearly better look: only near-equal candidates are swapped for variety.
      const floor = ranked.length ? score(ranked[0]) - 0.1 : 0;
      const close = ranked.filter(entry => score(entry) >= floor);
      chosen = close.find(entry => !clashesTop(entry) && !clashesLayer(entry))
        ?? close.find(entry => !clashesTop(entry))
        ?? ranked[0];

      if (!chosen && indianSlot) {
        const fallbackBase = library.find(entry => entry.context === 'Relaxed Casual' && !INDIAN_ARCHETYPES.has(entry.archetype) && !selected().some(item => item.id === entry.id));
        if (fallbackBase) chosen = indianCasualFallback(fallbackBase, indianPlaced === 0, suppressPatterns);
      }
      if (chosen && indianSlot) indianPlaced += 1;
    }
    if (!chosen) throw new Error(`ICONIK library cannot fill a ${context} look for ${climate.label}.`);

    slotPicks[index] = {
      entry: chosen,
      ladder: slot.step,
      targetBoldness: slot.targetBoldness,
      paletteFit: Math.round(manLookPaletteFit(chosen, colouring) * 100) / 100,
      styleMatch: Math.round(manLookStyleMatch(chosen, profile) * 100) / 100,
    };
  }

  const picks = slotPicks.filter((pick): pick is ManOutfitLibraryPick => Boolean(pick));

  const counted = new Map<string, number>();
  for (const pick of picks) counted.set(pick.entry.context, (counted.get(pick.entry.context) ?? 0) + 1);
  const missing = split.filter(([context, count]) => counted.get(context) !== count);
  if (missing.length) throw new Error(`ICONIK portfolio selection failed: ${missing.map(([context, count]) => `${context} needs ${count} looks`).join('; ')}.`);
  return picks;
}

function selectLegacyReferences(
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
      const eligibleFrom = (pool: ManOutfitLibraryEntry[]) => pool
        .filter(entry => indianSlot ? entry.archetype === 'indian-casual' : !INDIAN_ARCHETYPES.has(entry.archetype))
        .filter(entry => entry.climateModes.includes(climate.mode))
        .filter(entry => !antiPreferenceConflict(entry, classification))
        .filter(entry => !waivers.includes('ties') || !hasTie(entry))
        .filter(entry => !waivers.includes('suits') || !isSuit(entry))
        .filter(entry => entry.patternFamily === 'solid' || (!suppressPatterns && patternedSoFar < MAX_PATTERNED))
        .filter(entry => !selected.some(chosen => chosen.id === entry.id))
        .filter(entry => silhouetteCount(entry.silhouetteFamily, inContext) < 2)
        .filter(entry => silhouetteCount(entry.silhouetteFamily, selected) < 3);
      let eligible = eligibleFrom(library.filter(entry => entry.context === context));
      if (!eligible.length && context === 'Office / Formal') {
        // Ties or suits waived and the office pool is used up: office-safe smart-casual board looks stand in.
        eligible = eligibleFrom(library
          .filter(entry => entry.context === 'Smart Casual' && entry.tier === 'board' && isOfficeSafe(entry))
          .map(entry => ({ ...entry, context })));
      }
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
  const profile = classification.recommendation_profile;
  const colouring = profile ? readManClientColouring(classification.colour, profile.white_preference) : null;
  const taste = profile ? readTaste(profile, library) : null;
  // The Edit is a monthly nudge forward, so it aims one step past his comfort level.
  const editTarget = profile ? Math.min(5, manClientComfortBoldness(profile, library) + 1) : 0;
  const editScore = (entry: ManOutfitLibraryEntry) => profile && colouring && taste
    ? 0.3 * manLookStyleMatch(entry, profile)
      + 0.2 * (1 - Math.abs(entry.boldness - editTarget) / 4)
      + 0.22 * manLookPaletteFit(entry, colouring)
      + tasteAffinity(entry, taste)
      + tryPieceBonus(entry, profile, [])
      + colourBoldnessFit(entry, profile)
      + feedbackWeight(entry, profile)
      + (stableHash(`${fingerprint}|${entry.id}`) / 0xffffffff) * 0.03
    : semanticReferenceScore(entry, classification, fingerprint);
  const chosen: ManOutfitLibraryEntry[] = [];
  for (const [context, count] of EDIT_SOURCES_PER_CONTEXT) {
    const ranked = library
      .filter(entry => entry.tier === 'board' && entry.context === context && !exclude.has(entry.id))
      .filter(entry => wantsIndianCasual || !INDIAN_ARCHETYPES.has(entry.archetype))
      .filter(entry => entry.climateModes.includes(climate.mode))
      .filter(entry => !antiPreferenceConflict(entry, classification))
      .filter(entry => !waivers.includes('ties') || !hasTie(entry))
      .filter(entry => !waivers.includes('suits') || !isSuit(entry))
      .filter(entry => !suppressPatterns || entry.patternFamily === 'solid')
      .filter(entry => !profile || !neverPieceConflict(entry, profile))
      .sort((a, b) => editScore(b) - editScore(a) || a.id - b.id);
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
  overrides: ManOutfitSelectionOverrides = {},
): ManOutfitLibraryAssignment[] {
  return selectManOutfitLibraryPicks(classification, library, now, selectionSalt, overrides).map((pick, index) => ({
    outfitNumber: index + 1,
    context: pick.entry.context,
    libraryLookId: pick.entry.id,
    archetype: pick.entry.archetype,
    silhouetteFamily: pick.entry.silhouetteFamily,
    ...(pick.ladder ? {
      ladder: pick.ladder,
      boldness: pick.entry.boldness,
      targetBoldness: pick.targetBoldness,
      tribes: pick.entry.tribes,
      paletteFit: pick.paletteFit,
      styleMatch: pick.styleMatch,
    } : {}),
  }));
}

/** The occasion split for this client, in report order. */
export function getManContextSplit(classification: Pick<ClassificationResult, 'recommendation_profile'>): Array<[ManOutfitLibraryContext, number]> {
  return computeManContextSplit(classification.recommendation_profile);
}

/** "Outfits 1-5: OFFICE / FORMAL" lines for prompts, following the client's split. */
export function describeManContextSplit(classification: Pick<ClassificationResult, 'recommendation_profile'>, separator = '-'): string[] {
  let next = 1;
  return getManContextSplit(classification).map(([context, count]) => {
    const line = `Outfits ${next}${separator}${next + count - 1}: ${context.toUpperCase()}`;
    next += count;
    return line;
  });
}

/** Which board look each outfit number came from, for the colour lock. */
export function getManOutfitSourceLooks(
  assignments: ManOutfitLibraryAssignment[] | null | undefined,
  library = getManOutfitLibrary(),
): Map<number, ManOutfitLibraryEntry> {
  const sources = new Map<number, ManOutfitLibraryEntry>();
  for (const assignment of assignments ?? []) {
    const entry = library.find(item => item.id === assignment.libraryLookId);
    if (entry) sources.set(assignment.outfitNumber, entry);
  }
  return sources;
}

const LADDER_GUIDANCE: Record<ManOutfitLadderStep, string> = {
  comfort: 'comfort zone — familiar enough to wear tomorrow, executed better than he would alone',
  'step-up': 'one step beyond his usual — the look that makes people ask where he got it',
  stretch: 'a deliberate stretch — the anchor sentence should acknowledge it is a step outside his usual rotation and say why it works on him',
};

function formatTasteLedLibraryPrompt(
  classification: ClassificationResult,
  picks: ManOutfitLibraryPick[],
  climate: ManReportClimateProfile,
): string {
  const references = picks.map((pick, index) => {
    const entry = pick.entry;
    return `### MANDATORY SOURCE FOR FINAL OUTFIT ${index + 1}: LIBRARY LOOK ${entry.id} — ${entry.context.toUpperCase()}
LADDER: ${pick.ladder ? LADDER_GUIDANCE[pick.ladder] : 'comfort zone'}
SILHOUETTE FAMILY: ${entry.silhouetteFamily}
STYLE TRIBES: ${entry.tribes.join(', ')}
TOP: ${entry.top}
LAYER: ${entry.layer}
BOTTOM: ${entry.bottom}
FOOTWEAR: ${entry.footwear}
ACCESSORY: ${entry.accessories}${entry.styling ? `
STYLING: ${entry.styling}` : ''}`;
  }).join('\n\n');
  const split = describeManContextSplit(classification, '–').join('; ');
  const waivers = getManOutfitSelectionWaivers(classification);

  return `# ICONIK MEN'S REFERENCE OUTFIT LIBRARY

These ${picks.length} looks were chosen for this client from the Iconik board: they match his style tribes, his experimentation level, his colouring, the occasions he actually dresses for, and his taste-test answers. They are private prompt references, never client-facing citations.

SOURCE LOCK — non-negotiable, and it outranks every older rule about colour:
- Final Outfit 1 is written from Mandatory Source 1, Final Outfit 2 from Mandatory Source 2, and so on in order. Never swap in another formula or invent an unrelated look.
- COLOUR LOCK: every garment keeps the colour its source names. You may make a colour more precise inside the same colour ("cream" → "ecru", "pale blue" → "powder blue", "dark blue jeans" → "indigo jeans", "white" → "chalk white") but never change it to a different colour, never darken or mute it into another family, and never "adapt" it to his season — his colouring was already applied when these looks were chosen. Red stays red, pink stays pink, beige stays beige, black stays black. A source that only says "dark" or "light" may be given any colour of that depth. Two-colour garments ("blue-and-white striped") keep both colours.
- Keep each source's garment types, layer or no-layer decision, bottom silhouette and footwear category exactly. Climate may change a fabric (wool → cotton, suede → smooth leather), never a colour or a category.
- Keep the source's STYLING line (tucked, sleeves rolled, worn open, draped) and its accessories. If the source accessory is "None", add one that suits his face shape.
- Your job is execution: give every garment a real fabric, a fit for his body and one precise styling instruction, so each line reads as a buyable product. That is where the elevation comes from — fabric, texture, proportion and styling — not from new colours.
- Respect the LADDER line: comfort looks stay wearable, stretch looks stay bold. Do not tone a stretch look down.
- Never introduce satin or any shiny fabric; silk only as matte raw silk or cotton-silk in wedding-function looks. ${waivers.includes('ties') ? 'No ties for this client.' : 'Add a tie only where the source has one.'} ${waivers.includes('suits') ? 'No suits for this client.' : ''}

Occasion split for this client: ${split}.${classification.recommendation_profile?.occasion_mode === 'groom'
    ? ' THIS IS HIS OWN WEDDING: the Haldi, Mehendi, Sangeet, Wedding Ceremony and Reception looks dress him as the groom. Name every Indian garment precisely (kurta, churidar, sherwani, achkan, nehru jacket, bandhgala, mojaris, juttis, safa, dupatta) and keep the source silhouette; raw silk, cotton-silk, jacquard, velvet and tonal thread embroidery are welcome, but nothing shiny or sequinned. The anchor sentence names the function and why the look suits his body and colouring.'
    : classification.recommendation_profile?.occasion_mode === 'wedding_guest'
      ? ' He is attending weddings: the wedding-function looks dress him as a well-turned-out guest, never outshining the groom. Name every Indian garment precisely and keep the source silhouette; nothing shiny or sequinned.'
      : ''} Office looks stay office-appropriate for his workplace; Evening reads night-out; Relaxed follows its sources; wedding-function looks follow their sources exactly. ${requiresIndianCasual(classification) ? 'The kurta sources must stay everyday kurtas; a Western shirt renamed Indian does not qualify.' : ''} Current climate mode: ${climate.label} (${climate.mode.toUpperCase()}). ${climate.promptGuidance} Do not mention library look numbers, ladder steps, source references, or adaptation in the visible report.

## SELECTED REFERENCES

${references}`;
}

export function formatManOutfitLibraryForPrompt(
  classification: ClassificationResult,
  library = getManOutfitLibrary(),
  now = new Date(),
  selectionSalt = '',
  overrides: ManOutfitSelectionOverrides = {},
): string {
  const climate = getManReportClimateProfile(classification, now);
  if (classification.recommendation_profile) {
    return formatTasteLedLibraryPrompt(classification, selectManOutfitLibraryPicks(classification, library, now, selectionSalt, overrides), climate);
  }
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

Library version: ${MAN_OUTFIT_LIBRARY_LEGACY_VERSION}. Most sources come from the Iconik board of real, current looks; keep their modern, relaxed proportions rather than making them older or more formal. The core library is Warm Autumn-led. Never copy its colours blindly: the client's classification always wins near the face and across the outfit. Current climate mode: ${climate.label} (${climate.mode.toUpperCase()}). ${climate.promptGuidance} Do not mention library look numbers, source references, or adaptation in the visible report.

The 6/4/5/5 context split is already mapped below. Preserve each source's silhouette family as well as its core garments. Office / Formal stays office-appropriate (no tees, polos, denim or sneakers); suits and ties are not required. Evening must read night-out. ${requiresIndianCasual(classification) ? 'CLIENT PREFERENCE OVERRIDE: the first 2 Relaxed Casual sources are everyday kurta looks and must stay kurtas; wedding sherwanis or a Western shirt renamed Indian do not qualify.' : 'Relaxed Casual follows its sources; there is no fixed resort or old-money split.'} Patterns are optional: use at most 7 patterned pieces${explicitPatternAversion(classification) ? ', and none for this client' : ''}. No silhouette family more than twice inside one context or three times overall. Keep all v6.1 garment-reality, climate, and QA rules.

## SELECTED REFERENCES

${references}`;
}
