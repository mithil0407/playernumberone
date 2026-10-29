/**
 * Women's Blueprint outfits taken from the Pinterest library as they are.
 *
 * The harness gave each outfit one library look as a "skeleton to adapt", then
 * layered rotating pattern, texture, layer, scarf and eyewear tables on top and
 * hid the client's palette from the writer. What reached clients were invented
 * outfits in forced colour combinations, nearly all tucked and belted.
 *
 * This engine never invents an outfit. Every look is a real Pinterest look from
 * outfitlibrary.md (the "Pinterest board" and "Ethnic" office sections), worn
 * the way it was photographed. The only changes allowed are small, named swaps:
 *
 * - a heel becomes a flat of the same colour for a flats-only client;
 * - a missing shoe or bag gets one plain neutral;
 * - silver jewellery becomes gold for a client who wears gold;
 * - a near-face colour she must avoid moves to the closest shade in her own
 *   palette, inside the same colour family (white tee -> oat tee), never to a
 *   different colour.
 *
 * Her palette ranks looks; it never recolours them. A look that breaks a hard
 * rule (bare arms, low neck, short hem, sheer, tight, a banned piece) is
 * dropped rather than patched. The model only chooses among real looks and
 * writes the "why it works" copy.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintTransformationPage,
} from './stylistBlueprintSchema.ts';
import {
  isUsableStylistOutfitAnchor,
  parsePinterestOutfitLibrary,
  type ParsedStylistOutfit,
} from './stylistOutfitLibraryParser.ts';
import {
  colourDistance,
  colourFamilyOfHex,
  colourFromPieceText,
  relativeLuminance,
} from './stylistColourMatching.ts';
import {
  bannedPieceTerms,
  dullsInWhite,
  ETHNIC_CAPSULE_CAPS,
  ETHNIC_CAPSULE_PRIORITY,
  ethnicOutfitTarget,
  parseEthnicShare,
  intakeSignalsEthnicPreference,
  parseFootwearPreference,
  violatesBannedPieces,
} from './stylistIntakePreferences.ts';
import { bannedOutfitFor } from './stylistBannedOutfits.ts';
import { applyOutfitLibraryCuration, type OutfitLibraryCuration } from './stylistOutfitLibraryReview.ts';
import type {
  BlueprintBlock,
  BlueprintColourUse,
  BlueprintPage,
  StylistBlueprintClassification,
  StylistBlueprintReportData,
  StylistIntakeSubmission,
} from './stylistBlueprintGenerator.ts';
import type { FormulaItem, OutfitScienceQaFeedback } from './stylistOutfitScience.ts';

export const PINTEREST_VERBATIM_ENGINE_VERSION = 'pinterest_verbatim_v1' as const;

export type VerbatimCapsule = 'Professional' | 'Social' | 'Everyday' | 'Occasion';
const CAPSULES: VerbatimCapsule[] = ['Professional', 'Social', 'Everyday', 'Occasion'];

/** One real look from the library, exactly as written. */
export interface VerbatimLook {
  /** Where it came from: pinterest-13, pinterest-138b, ethnic-office-4. */
  id: string;
  source: 'pinterest' | 'ethnic_office';
  /** The capsule heading it is filed under first, then the "also fits" ones. */
  capsules: VerbatimCapsule[];
  top?: string;
  dress?: string;
  layer?: string;
  bottom?: string;
  shoes?: string;
  accessories?: string;
  styling?: string;
  ethnic: boolean;
}

export type TuckState = 'tucked' | 'half-tucked' | 'untucked' | 'peplum' | 'one-piece' | 'unstated';

/**
 * How colour sits in a look. Stylists build on neutrals and let one palette
 * colour lead or accent: a rust shirt over denim, a navy column with a teal coat.
 * Head-to-toe colour, every garment from the palette, is what Samiya flagged.
 */
export type ColourBalance = 'balanced' | 'neutral-with-accent' | 'all-neutral' | 'all-colour';

/** A look checked against one client: what it would be, and why. */
export interface EvaluatedLook {
  look: VerbatimLook;
  /** The look as she would wear it, after the allowed swaps. */
  pieces: Required<Pick<VerbatimLook, 'top' | 'dress' | 'layer' | 'bottom' | 'shoes' | 'accessories' | 'styling'>>;
  rejects: string[];
  swaps: string[];
  tuck: TuckState;
  colourBalance: ColourBalance;
  score: number;
  scoreNotes: string[];
}

export interface PinterestOutfitEngineMetadata {
  version: typeof PINTEREST_VERBATIM_ENGINE_VERSION;
  /** The look on each outfit page, in page order. */
  selected: Array<{ page_number: number; look_id: string; capsule: VerbatimCapsule; swaps: string[] }>;
  /** The looks on the transformation preview page. */
  preview_look_ids: string[];
  /** The rules this client's looks were checked against, for the stylist. */
  rules: string[];
  /** Kept so the existing outfit feedback route works on these reports too. */
  qa_feedback: OutfitScienceQaFeedback[];
}

export function isPinterestVerbatimReport(
  reportData?: Pick<StylistBlueprintReportData, 'outfit_engine'> | null,
): boolean {
  return (reportData?.outfit_engine as { version?: string } | undefined)?.version === PINTEREST_VERBATIM_ENGINE_VERSION;
}

/**
 * On unless a deploy opts back into another engine. The science engine still
 * owns reports it already generated.
 */
export function isPinterestVerbatimEngineEnabled() {
  const engine = (process.env.STYLIST_WOMEN_OUTFIT_ENGINE ?? '').trim().toLowerCase();
  return engine !== 'harness' && engine !== 'science';
}

// --- The library -------------------------------------------------------------

const VERBATIM_SECTIONS: Record<string, VerbatimLook['source']> = {
  'pinterest board': 'pinterest',
  ethnic: 'ethnic_office',
};

const ENTRY_RE = /^\*\*\d+\.\*\*/;
const PROVENANCE_RE = /<!--\s*((?:pinterest|ethnic-office)-[0-9]+[a-z]?)\s*(?:·\s*also fits:\s*([^>]*?))?\s*-->/i;
const ETHNIC_RE = /\b(kurta|kurti|saree|sari|lehenga|anarkali|salwar|churidar|sharara|gharara|dupatta|bandhgala|jutti|juttis|kolhapuri|kaftan kurta|angrakha|chanderi|ikat|ajrakh|block-print kurta)\b/i;

function capsuleNamed(value: string): VerbatimCapsule | undefined {
  return CAPSULES.find(capsule => capsule.toLowerCase() === value.trim().toLowerCase());
}

function fieldValue(outfit: ParsedStylistOutfit, label: string) {
  return outfit.fields.find(field => field.label === label)?.value ?? '';
}

/** Reads the Pinterest and ethnic office looks out of outfitlibrary.md. */
export function parseVerbatimLooks(raw: string): VerbatimLook[] {
  const looks: VerbatimLook[] = [];
  const lines = raw.split(/\r?\n/);
  let source: VerbatimLook['source'] | undefined;
  let capsule: VerbatimCapsule | undefined;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const section = line.match(/^##\s+(.+?)\s*$/);
    if (section) {
      source = VERBATIM_SECTIONS[section[1].toLowerCase()];
      capsule = undefined;
      continue;
    }
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      capsule = capsuleNamed(heading[1]);
      continue;
    }
    if (!source || !capsule || !ENTRY_RE.test(line.trim())) continue;
    const lookSource = source;
    const lookCapsule = capsule;
    const provenanceLine = lines.slice(index + 1, index + 3).find(next => PROVENANCE_RE.test(next)) ?? '';
    const provenance = provenanceLine.match(PROVENANCE_RE);
    if (!provenance) continue;
    const also = (provenance[2] ?? '').split(',').map(capsuleNamed).filter((item): item is VerbatimCapsule => Boolean(item));
    const parsed = parsePinterestOutfitLibrary(line.trim(), { idPrefix: 'look', baseCapsule: lookCapsule });
    parsed.forEach((outfit, lookIndex) => {
      if (!isUsableStylistOutfitAnchor(outfit)) return;
      const id = lookIndex === 0 ? provenance[1] : `${provenance[1]}${String.fromCharCode(97 + lookIndex)}`;
      const text = outfit.fields.map(field => field.value).join(' ');
      looks.push({
        id,
        source: lookSource,
        capsules: [lookCapsule, ...also.filter(item => item !== lookCapsule)],
        top: fieldValue(outfit, 'Top') || undefined,
        dress: fieldValue(outfit, 'Dress') || undefined,
        layer: fieldValue(outfit, 'Outerwear') || undefined,
        bottom: fieldValue(outfit, 'Bottom') || undefined,
        shoes: fieldValue(outfit, 'Footwear') || undefined,
        accessories: fieldValue(outfit, 'Accessories') || undefined,
        styling: fieldValue(outfit, 'Styling Line') || undefined,
        ethnic: lookSource === 'ethnic_office' || ETHNIC_RE.test(text),
      });
    });
  }
  return looks;
}

let cachedLooks: VerbatimLook[] | null = null;

/** Every look in the library, whatever the curator thought of it. */
export function getAllVerbatimLooks(): VerbatimLook[] {
  if (cachedLooks) return cachedLooks;
  const raw = readFileSync(join(process.cwd(), 'outfitlibrary.md'), 'utf-8');
  const looks = parseVerbatimLooks(raw);
  // An empty library would quietly hand every client an empty report.
  if (looks.length < 100) throw new Error(`The outfit library loaded only ${looks.length} Pinterest looks; check outfitlibrary.md is deployed.`);
  cachedLooks = looks;
  return looks;
}

let libraryCuration: OutfitLibraryCuration | null = null;
let curatedLooks: VerbatimLook[] | null = null;

/** The curator's swipes, loaded by primeOutfitLibraryCuration before an engine run. */
export function setOutfitLibraryCuration(curation: OutfitLibraryCuration | null) {
  libraryCuration = curation;
  curatedLooks = null;
}

/** Only looks the curator explicitly kept may enter ranking or any fallback. */
export function getVerbatimLooks(): VerbatimLook[] {
  curatedLooks ??= applyOutfitLibraryCuration(getAllVerbatimLooks(), libraryCuration);
  return curatedLooks;
}

// --- What this client needs ----------------------------------------------------

export interface VerbatimClientRules {
  arms: boolean;
  /** Upper arms covered too, not just "no sleeveless". */
  armsStrict: boolean;
  neckline: boolean;
  back: boolean;
  legs: boolean;
  sheer: boolean;
  loose: boolean;
  /** She wants shape: nothing oversized, baggy or boxy. */
  wantsDefinition: boolean;
  flatsOnly: boolean;
  heelPreferred: boolean;
  /** Her own words, e.g. "1.2-2 inch heel". */
  statedHeel: string;
  noWorkSkirtOrDress: boolean;
  /** Capsules where she said no skirts or dresses ("at work", "for daily wear"). */
  noSkirtCapsules: VerbatimCapsule[];
  /** She said "no tucked in": every tucked look is out. */
  noTuck: boolean;
  /** Bare arms are fine under a sleeved layer ("no sleeveless unless layered"). */
  layeredBaseAllowed: boolean;
  /** A warm country and no winter wardrobe asked for: no wool coats or roll-necks. */
  warmClimate: boolean;
  /** Deterministic per-client seed so two clients do not get the same twenty. */
  seed: string;
  /** Her ethnic share when she stated one, else null. */
  ethnicShare: number | null;
  bannedTerms: string[];
  antiCodePatterns: Array<{ label: string; re: RegExp }>;
  avoidColours: Array<{ label: string; re: RegExp; nearFaceOnly: boolean }>;
  avoidLightNearFace: boolean;
  metal: 'gold' | 'silver' | null;
  ethnicAllowed: boolean;
  ethnicByCapsule: Record<string, number>;
  /** Capsules to fill with ethnic looks first. */
  ethnicCapsuleOrder: VerbatimCapsule[];
  body: {
    pear: boolean;
    midsection: boolean;
    petite: boolean;
    inverted: boolean;
    hourglass: boolean;
    rectangle: boolean;
  };
  palette: Array<{ name: string; hex: string }>;
  undertone: 'warm' | 'cool' | 'neutral';
  depth: 'light' | 'medium' | 'deep';
  muted: boolean;
  tasteTerms: string[];
  minimalist: boolean;
  summary: string[];
}

function flatText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flatText).join(' ');
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).map(flatText).join(' ');
  return '';
}

const ANTI_CODE_PATTERNS: Array<{ match: RegExp; label: string; re: RegExp }> = [
  { match: /ruffl|frill/i, label: 'ruffles', re: /ruffl|frill|flounce/i },
  { match: /logo|brand/i, label: 'visible logos', re: /louis vuitton|\blv\b|herm[eè]s|gucci|chanel|\bdior\b|adidas|nike|veja|monogram|logo|converse|birkin|\bysl\b|prada|fendi|burberry/i },
  { match: /neon|fluoro/i, label: 'neon', re: /\bneon\b|fluoro/i },
  { match: /flims|sheer|see.?through|transparent/i, label: 'sheer or flimsy fabric', re: /sheer|mesh|see[- ]through|transparent|organza|tulle/i },
  { match: /tight|bodycon|cling/i, label: 'tight fits', re: /bodycon|body[- ]con|second[- ]skin|skin[- ]tight|body[- ]skimming|figure[- ]hugging|\bskinny\b|leggings|\btight\b/i },
  { match: /crop|midriff/i, label: 'cropped tops', re: /\bcrop(?:ped)? (?:top|tee|blouse|knit|cami|tank)|midriff/i },
  { match: /peplum/i, label: 'peplum', re: /peplum/i },
  { match: /jumpsuit/i, label: 'jumpsuits', re: /jumpsuit|playsuit|romper/i },
  { match: /animal|leopard|zebra/i, label: 'animal print', re: /leopard|zebra|snake ?print|animal print|cheetah/i },
  { match: /sequin|glitter|shimmer/i, label: 'sequins', re: /sequin|glitter|lam[eé]\b/i },
  { match: /satin|shiny|shine/i, label: 'shine', re: /\bsatin\b|metallic|lam[eé]\b/i },
  { match: /\bshorts?\b/i, label: 'shorts', re: /\bshorts\b|bermuda/i },
  { match: /dupatta/i, label: 'dupattas', re: /dupatta/i },
  { match: /baggy|overly loose|oversized/i, label: 'baggy fits', re: /oversized|baggy|slouch|boxy/i },
  { match: /loud|flashy|bling|showy|over the top/i, label: 'loud pieces', re: /louis vuitton|\blv\b|monogram|logo|birkin|sequin|embellish|glitter|\bstatement\b|neon/i },
];

const SHADE_WORDS = '(?:optic|stark|bright|crisp|neon|icy|hot|electric|pastel|baby|lemon|pure|cool|fluorescent)';

function avoidColourPatterns(avoid: string[]): VerbatimClientRules['avoidColours'] {
  const patterns: VerbatimClientRules['avoidColours'] = [];
  for (const entry of avoid) {
    const lower = entry.toLowerCase();
    const nearFaceOnly = /face|near|against/.test(lower);
    const found = lower.match(/\b(white|ivory|pink|yellow|lavender|lilac|mauve|silver|grey|gray|orange|green|blue|purple|red|black|beige|mint|peach|coral|gold|brown|navy|fuchsia|magenta|turquoise|aqua)\b/);
    if (!found) continue;
    // A client who avoids lavender avoids lilac too; grey is spelt both ways.
    const SYNONYMS: Record<string, string> = { lavender: '(?:lavender|lilac)', lilac: '(?:lilac|lavender)', mauve: '(?:mauve|lilac)', grey: '(?:grey|gray)', gray: '(?:grey|gray)' };
    const colour = [found[0], SYNONYMS[found[1]] ?? found[1]] as const;
    const shade = lower.match(new RegExp(`\\b${SHADE_WORDS}\\b`));
    // An optic or stark white is the white a plain "white tee" is, so plain
    // white counts. A neon pink is not a dusty pink, so the shade word must match.
    if (shade && !(found[1] === 'white' && /optic|stark|bright|pure|crisp/.test(shade[0]))) {
      const word = shade[0] === 'lemon' ? 'lemon' : `${shade[0]}[- ]?${colour[1]}`;
      patterns.push({ label: entry, re: new RegExp(`\\b${word}\\b`, 'i'), nearFaceOnly });
    } else {
      patterns.push({ label: entry, re: new RegExp(`\\b(?:${SHADE_WORDS}[- ]?)?${colour[1]}\\b`, 'i'), nearFaceOnly });
    }
  }
  return patterns;
}

/** Everything the selector needs to know about her, read once. */
export function buildVerbatimClientRules(
  submission: StylistIntakeSubmission,
  reportData: Pick<StylistBlueprintReportData, 'classification'>,
  outfitCount = 20,
): VerbatimClientRules {
  const classification: StylistBlueprintClassification = reportData.classification;
  const coverageText = [
    flatText(submission.coverage_requirements),
    ...(classification.body.coverage_rules ?? []),
  ].join(' ').toLowerCase();
  const notes = [submission.raw_consultation_notes ?? '', flatText(submission.coverage_requirements), flatText(submission.lifestyle_context)].join(' ').toLowerCase();
  const antiCodes = classification.taste.anti_codes ?? [];
  const antiText = antiCodes.join(' ').toLowerCase();
  const prefs = submission.piece_preferences ?? {};
  const footwear = parseFootwearPreference(prefs);
  const footwearText = flatText((prefs as Record<string, unknown>).footwear).toLowerCase();
  const focus = (classification.body.focus_areas ?? []).join(' ').toLowerCase();
  const geometry = `${classification.body.geometry} ${classification.body.proportion_directive ?? ''}`.toLowerCase();
  const measurements = (submission.body_measurements ?? {}) as Record<string, unknown>;
  const heightCm = Number(measurements.height_cm ?? 0);
  const metalText = `${flatText((prefs as Record<string, unknown>).metal_preference)} ${(classification.taste.signature_codes ?? []).join(' ')} ${(classification.taste.shopping_filters ?? []).join(' ')}`.toLowerCase();

  // Where a stylist writes the mix in words: her notes, the reason for the
  // consultation, and the free text of what she loves and wears.
  const rawNotes = [
    submission.raw_consultation_notes ?? '',
    flatText((submission.lifestyle_context as Record<string, unknown> | null)?.consultation_reason),
    flatText((prefs as Record<string, unknown>).loved),
    flatText((prefs as Record<string, unknown>).go_to_outfits),
  ].join(' . ').toLowerCase();
  const ETHNIC_WORD = '(?:ethn\\w*|indian\\w*|inidan|traditional)';
  // Her stated mix is consent in itself: "More Western" still means some
  // Indianwear, "Equal" means half. Only a client who states nothing falls
  // back to reading her answers for ethnic words.
  const ethnicShare = parseEthnicShare((prefs as Record<string, unknown>).outfit_ratio);
  const ethnicAllowed = ethnicShare !== null
    ? ethnicShare > 0 || /\bethn[a-z]*\b/.test(rawNotes)
    : intakeSignalsEthnicPreference(submission) || /\bethn[a-z]*\b/.test(notes);
  // A stylist who writes "a few ethnic options" means a handful. It narrows an
  // even or unstated mix; it never overrides "More Ethnic".
  const fewMatch = rawNotes.match(new RegExp(`\\b(few|couple|some|one or two|\\d\\s*(?:or|-|to)\\s*\\d|two or three|\\d)\\b[^.]{0,40}\\b${ETHNIC_WORD}`))
    ?? rawNotes.match(new RegExp(`\\b${ETHNIC_WORD}[^.]{0,40}\\b(few|couple|one or two|\\d\\s*(?:or|-|to)\\s*\\d|two or three)\\b`));
  const fewEthnic = Boolean(fewMatch) && (ethnicShare === null || ethnicShare <= 0.5);
  const festiveOnly = new RegExp(`${ETHNIC_WORD}[^.]{0,30}\\b(?:only\\s+)?for\\s+(?:festive|festivals?|weddings?|functions?|occasions?)|${ETHNIC_WORD}[^.]{0,20}(?:festive|festival|wedding|occasion)s?\\s+only|(?:festive|occasion)s?\\s+only[^.]{0,20}${ETHNIC_WORD}|only\\s+[^.]{0,20}${ETHNIC_WORD}\\s+(?:festive|festival|wedding|occasion)`).test(rawNotes);
  const ethnicWork = new RegExp(`${ETHNIC_WORD}\\s+(?:work|office)|(?:work|office)\\w*\\s+${ETHNIC_WORD}|${ETHNIC_WORD}[^.]{0,20}\\bfor\\s+(?:work|office)`).test(rawNotes);
  const perCapsule = outfitCount / CAPSULES.length;
  const range = fewMatch?.[0].match(/(\d)\s*(?:or|-|to)\s*(\d)/);
  const statedCount = !fewMatch ? 0
    : range ? Number(range[2])
      : /two or three/.test(fewMatch[0]) ? 3 : /one or two|couple/.test(fewMatch[0]) ? 2 : Number(fewMatch[0].match(/\d/)?.[0]) || 3;
  const target = !ethnicAllowed ? 0
    : fewEthnic ? Math.min(statedCount || 3, Math.round(outfitCount * 0.2))
      : ethnicOutfitTarget({ outfitCount, culturalMode: 'ethnic_allowed', piecePreferences: prefs });
  const ethnicCapsuleOrder: VerbatimCapsule[] = festiveOnly
    ? ['Occasion', 'Social']
    : ethnicWork ? ['Professional', 'Everyday', 'Social', 'Occasion'] : [...ETHNIC_CAPSULE_PRIORITY] as VerbatimCapsule[];
  const ethnicByCapsule = spreadAcross(target, perCapsule, ethnicCapsuleOrder);

  // Anti-codes come from what she avoids, never from what she loves: loving
  // "dupatta dresses" must not ban every dupatta.
  const avoidedText = flatText([
    (prefs as Record<string, unknown>).avoided,
    (prefs as Record<string, unknown>).least_favourites,
    (prefs as Record<string, unknown>).disliked,
  ]).toLowerCase();
  const antiCodePatterns = ANTI_CODE_PATTERNS
    .filter(entry => entry.match.test(antiText) || entry.match.test(avoidedText))
    .map(({ label, re }) => ({ label, re }));
  const bannedTerms = bannedPieceTerms(prefs);

  // Hijab or full modesty is every coverage rule at once.
  const fullModesty = /hijab|abaya|burqa|full(?:y)?\s+(?:modest|cover)|fully covered|conservative|modest dressing/.test(`${coverageText} ${notes}`);
  const noSkirtCapsules = new Set<VerbatimCapsule>();
  const skirtText = `${notes} ${avoidedText}`;
  const SKIRT_WORDS = '(?:skirts?|dress(?:es)?)';
  const contexts = [
    ...skirtText.matchAll(new RegExp(`\\bno\\s+${SKIRT_WORDS}(?:\\s*(?:and|or|&|/|,)\\s*${SKIRT_WORDS})?\\s*(?:at|for|to|in|during|as)?\\s*(?:the\\s+)?(work|office|hospital|clinic|daily wear|daily|everyday|day to day)`, 'g')),
    ...skirtText.matchAll(new RegExp(`(work|office|daily)\\s*wear\\s*\\(?\\s*no\\s+${SKIRT_WORDS}`, 'g')),
    ...skirtText.matchAll(new RegExp(`${SKIRT_WORDS}\\s+(?:are\\s+)?not\\s+(?:for|at|in)\\s+(?:the\\s+)?(work|office|daily)`, 'g')),
  ].map(match => match[1]);
  for (const context of contexts) {
    noSkirtCapsules.add('Professional');
    if (/daily|everyday|day to day/.test(context)) noSkirtCapsules.add('Everyday');
  }
  const country = `${classification.client.country ?? ''} ${submission.country ?? ''}`.toLowerCase();
  const winterwear = flatText((submission.lifestyle_context as Record<string, unknown> | null)?.winterwear).toLowerCase();
  const warmCountry = /india|singapore|malaysia|dubai|uae|emirates|qatar|oman|bahrain|sri lanka|indonesia|thailand|philippines|kenya|nigeria|bangladesh/.test(country) || !country.trim();

  const rules: VerbatimClientRules = {
    arms: fullModesty || /sleeveless|arm|sleeve|shoulder/.test(coverageText),
    armsStrict: fullModesty || /cover (?:my |the )?(?:upper )?arms|upper arms|elbow/.test(coverageText),
    neckline: fullModesty || /deep neck|cleavage|low neck|neckline|plung/.test(coverageText),
    back: fullModesty || /backless|open back|back/.test(coverageText),
    legs: fullModesty || /\bleg|knee|mini|short skirt|thigh/.test(coverageText),
    sheer: fullModesty || /sheer|opaque|opacity|transparent|see.?through/.test(coverageText) || /flims|sheer/.test(antiText),
    // "Nothing too loose (wants definition)" is the opposite of "nothing tight".
    loose: fullModesty || /tight|cling|bodycon/.test(coverageText) || /\btight/.test(antiText),
    wantsDefinition: /too loose|not loose|overly loose|definition|baggy|shapeless/.test(`${coverageText} ${antiText}`),
    flatsOnly: /flats? only|only flats|no heels?|flat shoes only|without heels?/.test(footwearText) || /flats only|no heels/.test(notes),
    // "Flats only" wins over a loved "flat heels" or "comfortable heels".
    heelPreferred: footwear.heelPreferred && !(/flats? only|only flats|no heels?|flat shoes only|without heels?/.test(footwearText) || /flats only|no heels/.test(notes)) && !/flat heels?/.test(footwearText + ' ' + flatText((prefs as Record<string, unknown>).loved).toLowerCase()),
    statedHeel: footwear.statedHeel,
    noWorkSkirtOrDress: noSkirtCapsules.has('Professional'),
    noSkirtCapsules: [...noSkirtCapsules],
    noTuck: bannedTerms.some(term => /tuck/.test(term)),
    layeredBaseAllowed: /unless layered|if layered|with a layer|layering (?:is )?(?:ok|fine)|can (?:be )?layer/.test(coverageText),
    warmClimate: warmCountry && !/yes|cold|winter/.test(winterwear),
    seed: String(submission.id ?? classification.client.name ?? ''),
    ethnicShare,
    bannedTerms,
    antiCodePatterns,
    avoidColours: avoidColourPatterns(classification.colour.avoid_colours ?? []),
    avoidLightNearFace: /(white|ivory).{0,40}(face)|(face).{0,40}(white|ivory)/.test(antiText)
      || dullsInWhite(submission)
      || (classification.colour.avoid_colours ?? []).some(item => /white|ivory/i.test(item) && /face/i.test(item)),
    metal: /\bgold\b/.test(metalText) ? 'gold' : /\bsilver\b/.test(metalText) ? 'silver' : null,
    ethnicAllowed,
    ethnicByCapsule,
    ethnicCapsuleOrder,
    body: {
      pear: /pear|triangle|hip|thigh|lower body/.test(`${geometry} ${focus}`) && !/inverted/.test(geometry),
      midsection: /tummy|stomach|midsection|post[- ]?pregnancy|belly|apple/.test(`${geometry} ${focus}`),
      petite: /petite/.test(`${geometry} ${focus}`) || (heightCm > 0 && heightCm < 160),
      inverted: /inverted|broad shoulder/.test(geometry),
      hourglass: /hourglass/.test(geometry),
      rectangle: /rectangle|straight|athletic/.test(geometry),
    },
    palette: [...(classification.colour.base_palette ?? []), ...(classification.colour.accent_palette ?? [])]
      .filter(entry => /^#[0-9a-f]{6}$/i.test(entry.hex)),
    undertone: /warm|golden|autumn|spring/i.test(`${classification.colour.undertone_direction} ${classification.colour.palette_name}`) ? 'warm'
      : /cool|summer|winter|pink|blue/i.test(`${classification.colour.undertone_direction} ${classification.colour.palette_name}`) ? 'cool' : 'neutral',
    depth: /deep|dark/i.test(classification.colour.depth ?? '') ? 'deep' : /light|pale|fair/i.test(classification.colour.depth ?? '') ? 'light' : 'medium',
    muted: /muted|soft|dusty|autumn|summer/i.test(`${classification.colour.palette_name} ${classification.colour.contrast}`),
    tasteTerms: tasteTermsFrom([
      ...(classification.taste.signature_codes ?? []),
      ...(classification.taste.shopping_filters ?? []),
      // What she told us she loves and actually wears outranks our labels.
      flatText((prefs as Record<string, unknown>).loved),
      flatText((prefs as Record<string, unknown>).go_to_outfits),
    ]),
    minimalist: /minimal/i.test(`${classification.taste.style_archetype} ${classification.taste.moodboard} ${flatText(submission.secondary_moodboard_elements)} ${submission.selected_moodboard_label ?? ''}`),
    summary: [],
  };
  rules.summary = [
    rules.arms ? (rules.armsStrict ? 'Upper arms covered' : 'No sleeveless or bare shoulders') : '',
    rules.neckline ? 'No deep or low necklines' : '',
    rules.back ? 'Nothing backless' : '',
    rules.legs ? 'Hems at or below the knee' : '',
    rules.sheer ? 'Nothing sheer' : '',
    rules.loose ? 'Nothing tight or clingy' : '',
    rules.wantsDefinition ? 'Nothing oversized, baggy or boxy' : '',
    rules.flatsOnly ? 'Flats only: heels are swapped for a flat in the same colour' : '',
    rules.noSkirtCapsules.length ? `No dresses or skirts in ${rules.noSkirtCapsules.map(item => item === 'Professional' ? 'work' : 'everyday').join(' or ')} outfits` : '',
    rules.noTuck ? 'Nothing tucked in' : '',
    rules.warmClimate ? 'Warm climate: no wool coats or roll-necks' : '',
    ...rules.antiCodePatterns.map(item => `No ${item.label}`),
    rules.bannedTerms.length ? `Pieces she avoids: ${rules.bannedTerms.slice(0, 6).join(', ')}` : '',
    rules.avoidLightNearFace ? 'No stark white or bright ivory against the face' : '',
    rules.metal ? `${rules.metal[0].toUpperCase()}${rules.metal.slice(1)} jewellery and hardware` : '',
    rules.ethnicAllowed ? `${Object.values(rules.ethnicByCapsule).reduce((a, b) => a + b, 0)} ethnic looks` : 'Western looks only',
  ].filter(Boolean);
  return rules;
}

function spreadAcross(target: number, perCapsule: number, order: VerbatimCapsule[]) {
  const counts: Record<string, number> = Object.fromEntries(CAPSULES.map(capsule => [capsule, 0]));
  let remaining = target;
  while (remaining > 0) {
    let placed = false;
    for (const capsule of order) {
      if (remaining <= 0) break;
      if (counts[capsule] >= Math.min(ETHNIC_CAPSULE_CAPS[capsule] ?? perCapsule, perCapsule)) continue;
      counts[capsule] += 1;
      remaining -= 1;
      placed = true;
    }
    if (!placed) break;
  }
  return counts;
}

const TASTE_NOUNS = /\bdress|co-?ord|bootcut|boot cut|chanderi|kota|stole|jeans|\bsuit|kurt[ai]|blazer|trouser|tunic|loafer|pointed|flat|gold|tonal|monochrom|matching|set|co-ord|shirt|knit|linen|leather|tote|straight[- ]leg|wide[- ]leg|structured|crisp|denim|kurta|waistcoat|vest|cardigan|trench|coat|silk|cotton/gi;

function tasteTermsFrom(values: string[]) {
  const terms = new Set<string>();
  for (const value of values) for (const match of value.toLowerCase().match(TASTE_NOUNS) ?? []) terms.add(match.replace(/[- ]/g, '[- ]?'));
  return [...terms];
}

// --- Checking one look ---------------------------------------------------------

/** "Slim but not tight" and "nothing oversized" describe the opposite of the word. */
function withoutNegations(text: string) {
  return text.replace(/\b(?:not|never|no|without|nothing|isn'?t)\s+(?:too\s+|very\s+|overly\s+)?(?:tight|clingy|bodycon|skinny|fitted|oversized|baggy|boxy|loose|sheer)\b/gi, '');
}

const BARE_ARM_RE = /strappy|\bstraps\b|thin[- ]straps?|slip[- ](?:dress|top)|(?:waistcoat|vest)(?: top| worn as)|sleeveless|strapless|off[- ]the[- ]shoulder|off[- ]shoulder|one[- ]shoulder|halter|bandeau|tube top|spaghetti|\bcami(?:sole)?\b|\btank\b|racerback|cold[- ]shoulder|cut-?out shoulder|bustier|corset|bralette|vest top|muscle tee/i;
const SHORT_SLEEVE_RE = /short[- ]sleeve|cap[- ]sleeve|short puff|puff[- ]sleeve(?!.*(long|three-quarter|elbow))|flutter[- ]sleeve|\btee\b(?!.*(long[- ]sleeve|three-quarter))|t-shirt(?!.*long)|polo/i;
const LOW_NECK_RE = /plung|deep[- ]v|low[- ]cut|sweetheart|keyhole|surplice|unbuttoned to|open to the (?:chest|sternum)|deep scoop|deep neck|wrap[- ]front mini/i;
const BACKLESS_RE = /backless|open[- ]back|low back|cut-?out back|bare back/i;
const SHORT_HEM_RE = /\bmini\b|shorts|bermuda|thigh[- ](?:high )?slit|high slit|slit to the thigh|above[- ]the[- ]knee|above[- ]knee|just above the knee|skort|\bmicro[- ]?(?:mini|skirt|shorts|dress)\b|hot pants/i;
const SHEER_RE = /sheer|mesh|see[- ]through|transparent|organza|tulle|lace (?:top|blouse|dress|sleeves)|slip (?:underneath|showing)|unbuttoned from the waist/i;
/** A shell is sleeveless unless the piece says otherwise. */
const SHELL_RE = /\bshell\b/i;
const SLEEVED_LAYER_RE = /blazer|jacket|cardigan|shrug|kimono|coat|overshirt|shirt|duster|bolero|kurta/i;
/** Wool coats, roll-necks and heavy knits, wrong for a warm climate. */
const WINTER_RE = /\bwool|overcoat|\bcoat\b|roll[- ]?neck|turtle[- ]?neck|polo[- ]neck|cable[- ]knit|chunky knit|\bfur\b|shearling|puffer|knee[- ]high boots|thermal|cashmere|\bjumper\b|\bsweater\b/i;
const TIGHT_RE = /bodycon|body[- ]con|second[- ]skin|skin[- ]tight|body[- ]skimming|figure[- ]hugging|\bskinny\b|leggings|pencil|\btight\b|ribbed knit (?:midi )?(?:tank )?dress|bandage/i;
const CROPPED_RE = /\bcrop(?:ped)? (?:top|tee|blouse|knit|cami|tank|sweater|cardigan)|crop top|midriff|sliver of (?:waist|skin)|bare midriff|knotted at the (?:front |waist|hem)|tie-front (?:cropped )?(?:top|blouse|shirt)/i;
const NOT_AN_OUTFIT_RE = /mannequin|menswear|product shot|reference chart|footwear only|shirtless|nothing under(?:neath)?|worn as the top|bra top/i;
const SHAPELESS_RE = /oversized|baggy|slouch|boxy|loose[- ]fit|relaxed[- ]fit|tent|swing (?:top|dress)|kaftan|poncho|smock/i;
const HIP_CLING_RE = /skinny|\bslim\b|cigarette|pencil|legging|jogger|tapered|capri|bodycon|jeggings|\bbias\b|slip skirt|slip dress/i;
const HIP_VOLUME_RE = /tiered|balloon|harem|bubble|cargo|paper-?bag|peg[- ]leg|full circle|puffball|dhoti/i;
const SKIRT_DRESS_RE = /\bskirt\b|\bdress\b|\bgown\b|saree|\bsari\b|lehenga/i;

const HEEL_RE = /\bheels?\b|heeled|\bpumps?\b|stiletto|wedges?\b|platforms?\b|block[- ]heel|kitten[- ]heel|court shoes?|slingbacks?\b|\bmules?\b(?=.*heel)|heeled boots?/i;
/** A heel, unless the piece already says it is a flat ("slingback flats"). */
function isHeeledShoe(shoe: string) {
  // Platform sneakers are still sneakers.
  return HEEL_RE.test(shoe) && !/\bflats?\b|flat (?:sandals?|mules?|boots?)|sneaker|trainer/i.test(shoe);
}

/** Shoes that are flat by nature: no one wants "block-heel juttis". */
const HEEL_SWAP_SKIP_RE = /jutti|kolhapuri|mojari|loafer|espadrille|sneaker|trainer|slide|moccasin|brogue|oxford|gladiator|boot|clog|derby/i;

/** "1.2-2 inch heel" -> "1.2-2 inch"; anything without a number is just "low". */
export function statedHeelHeight(statedHeel: string): { phrase: string; maxInches: number | null } {
  const match = statedHeel.match(/(\d+(?:\.\d+)?)(?:\s*[-–to]+\s*(\d+(?:\.\d+)?))?\s*(inch(?:es)?|in\b|"|cm)/i);
  if (!match) return { phrase: 'low', maxInches: null };
  const unit = /cm/i.test(match[3]) ? 'cm' : 'inch';
  const max = Number(match[2] ?? match[1]);
  return { phrase: `${match[1]}${match[2] ? `-${match[2]}` : ''} ${unit}`, maxInches: unit === 'cm' ? max / 2.54 : max };
}

const SHOE_WORD_RE = /shoe|sandal|heel|flat|sneaker|trainer|loafer|pump|mule|boot|jutti|kolhapuri|wedge|espadrille|slide|brogue|slingback|stiletto|oxford|moccasin|ballet|derby|clog/i;
const MISSING_RE = /^(?:not visible|barefoot|none|n\/a|unknown|hidden|cropped out)/i;

/** The low heel she asked for, in the same colour and shape. */
export function heeledVersionOfShoe(shoe: string, statedHeel: string): string {
  const height = statedHeelHeight(statedHeel).phrase;
  const next = shoe
    // "flat" as an adjective goes; the shoe it describes stays.
    .replace(/\bflat\s+(?=[a-z])/gi, '')
    .replace(/\bballet flats?\b/gi, 'block-heel pumps')
    .replace(/\bpointed flats?\b/gi, 'pointed block-heel pumps')
    .replace(/\bflat sandals?\b/gi, 'block-heel sandals')
    .replace(/\bflat mules?\b/gi, 'block-heel mules')
    .replace(/\bslingback flats?\b/gi, 'block-heel slingbacks')
    .replace(/\bflats\b/gi, 'block-heel pumps')
    .replace(/\b(sandals|mules)\b/i, match => (/block-heel/i.test(match) ? match : `block-heel ${match}`))
    .replace(/block-heel block-heel/gi, 'block-heel')
    .replace(/\bflat\s+block-heel/gi, 'block-heel');
  return /heel|pump/i.test(next) ? `${next.replace(/\s*\.\s*$/, '')}, ${height} heel` : `${next}, ${height} block heel`;
}

/** A flat in the same colour, so the look keeps its colour story. */
export function flatVersionOfShoe(shoe: string): string {
  let next = shoe
    .replace(/\b(?:very |sky[- ])?high[- ]heel(?:ed)?\s*/gi, '')
    .replace(/\b(?:block|kitten|stiletto|low|mid|chunky|cone|spool|sculptural|clear|lucite|wooden)[- ]heel(?:ed)?\s*/gi, '')
    .replace(/\b\d+(?:\.\d+)?[- ]?(?:inch|in|cm)\s*/gi, '')
    .replace(/\bplatform\s*/gi, '')
    .replace(/\bheeled\s+/gi, '')
    .replace(/\bstilettos?\b/gi, 'pointed flats')
    .replace(/\bcourt shoes?\b/gi, 'pointed flats')
    .replace(/\bpumps?\b/gi, 'flats')
    .replace(/\bslingbacks?\b(?!\s*flats)/gi, 'slingback flats')
    .replace(/\b(espadrille\s+)?wedges?\b(\s+sandals?)?/gi, (_m, esp) => (esp ? 'espadrille flats' : 'flat sandals'))
    .replace(/\bstrappy heels\b/gi, 'strappy flat sandals')
    .replace(/\bheels\b/gi, 'flats')
    .replace(/\bsandals\b(?!.*flat)/gi, match => (/flat/i.test(shoe) ? match : 'flat sandals'))
    .replace(/\bmules\b/gi, 'flat mules')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (/\bboots?\b/i.test(next) && !/flat/i.test(next)) next = next.replace(/\bboots?\b/i, match => `flat ${match}`);
  if (!/flat|loafer|sneaker|trainer|ballet|jutti|kolhapuri|slide|moccasin|brogue|oxford|espadrille/i.test(next)) next = `${next} (flat)`;
  return next.replace(/flat flat/gi, 'flat');
}

function neutralShoe(capsule: VerbatimCapsule, rules: VerbatimClientRules) {
  const warm = rules.palette.some(entry => /camel|tan|cognac|brown|terracotta|rust/i.test(entry.name));
  const metal = rules.metal ?? 'gold';
  const height = statedHeelHeight(rules.statedHeel).phrase;
  // A client who ruled out shine gets leather, not a metallic.
  const noShine = rules.antiCodePatterns.some(code => /shine|sequin|loud/.test(code.label));
  if (capsule === 'Occasion' || capsule === 'Social') {
    if (noShine) return rules.flatsOnly ? 'Nude leather pointed flats' : rules.heelPreferred ? `Nude leather block-heel sandals, ${height} heel` : 'Nude leather pointed flats';
    return rules.flatsOnly ? `Soft ${metal} metallic pointed flats` : rules.heelPreferred ? `Soft ${metal} metallic block-heel sandals, ${height} heel` : `Soft ${metal} metallic block-heel sandals`;
  }
  if (rules.heelPreferred) return `${warm ? 'Tan' : 'Black'} leather pointed block-heel pumps, ${height} heel`;
  return warm ? 'Tan leather pointed flats' : 'Black leather pointed flats';
}

function neutralBag(capsule: VerbatimCapsule, rules: VerbatimClientRules) {
  const warm = rules.palette.some(entry => /camel|tan|cognac|brown|terracotta|rust/i.test(entry.name));
  if (capsule === 'Occasion' || capsule === 'Social') return warm ? 'Small tan leather clutch' : 'Small black leather clutch';
  return warm ? 'Structured tan leather tote' : 'Structured black leather tote';
}

const BAG_RE = /\b(?:bag|tote|clutch|crossbody|handbag|potli|purse|backpack|satchel|hobo|bucket|baguette|pouch|shopper)\b/i;

function swapMetal(text: string, metal: VerbatimClientRules['metal']) {
  if (!metal || !text) return text;
  const other = metal === 'gold' ? 'silver' : 'gold';
  return text.replace(new RegExp(`\\b(oxidised |oxidized |polished |brushed )?${other}(?![- ]?(?:grey|gray|blue|sequin))(-tone)?\\b`, 'gi'), (_match, finish, tone) => `${finish && metal === 'silver' ? finish : ''}${metal}${tone ?? ''}`);
}

export function classifyTuck(look: Pick<VerbatimLook, 'dress' | 'styling' | 'top'> & { ethnic?: boolean }): TuckState {
  const styling = (look.styling ?? '').toLowerCase();
  const top = (look.top ?? '').toLowerCase();
  if (look.dress) return 'one-piece';
  if (/peplum/.test(`${top} ${styling}`)) return 'peplum';
  if (/half[- ]tuck|front[- ]tuck|french tuck|tucked (?:in )?(?:at )?the front only|loosely tucked at the front/.test(styling)) return 'half-tucked';
  if (/untucked|worn loose|left loose|left out|not tucked|no tuck|hangs? (?:straight|loose)|worn long|skims? the hip|over the (?:trousers|jeans|skirt|culottes|palazzo|pants|leggings|churidar)|worn open over|left hanging/.test(styling)) return 'untucked';
  if (look.ethnic && /kurta|kurti|tunic/.test(top)) return 'untucked';
  if (/tunic|longline|kurta|kurti|overshirt/.test(top)) return 'untucked';
  if (/tuck/.test(styling)) return 'tucked';
  return 'unstated';
}

/** A wearable shade word from a palette name: "Oat Stone" -> "stone", "Soft Ivory" -> "ivory". */
function colourShadeName(name: string) {
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  const known = [...words].reverse().find(word => colourFromPieceText(word));
  if (words.length > 1 && /^(?:deep|dark|muted|dusty|light)$/.test(words[0]) && known) return `${words[0]} ${known}`;
  return known ?? (name.toLowerCase().replace(/\b(?:ink|soft|warm|cool)\b\s*/g, '').trim() || name.toLowerCase());
}

const COLOUR_PHRASE_RE = /\b(?:(?:deep|dark|light|pale|soft|bright|muted|dusty|powder|rich|optic|stark|crisp|pure|plain|warm|cool|icy|baby|hot|neon)[- ])?(?:off-white|white|ivory|cream|black|navy|blue|grey|gray|silver|pink|blush|lavender|lilac|yellow|lemon|mint|coral|peach|orange|red|green|purple|fuchsia|magenta|turquoise|aqua|beige|camel|tan|brown)(?:[- ](?:blue|green|pink|grey|gray|white|yellow))?\b/i;

/** Moves one near-face colour onto her palette inside the same family, or reports it cannot. */
function nudgedPiece(piece: string, rules: VerbatimClientRules, reason: 'avoid' | 'light'): { piece: string; swap: string } | null {
  const current = colourFromPieceText(piece);
  if (!current) return null;
  const family = colourFamilyOfHex(current.hex);
  const pool = rules.palette.filter(entry => {
    if (reason === 'light') {
      const lum = relativeLuminance(entry.hex);
      return colourFamilyOfHex(entry.hex) === 'neutral' && lum > 0.55 && lum < 0.9;
    }
    return colourFamilyOfHex(entry.hex) === family && !rules.avoidColours.some(avoid => avoid.re.test(entry.name));
  });
  const best = pool
    .map(entry => ({ entry, distance: deltaE(entry.hex, current.hex) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!best || best.distance > (reason === 'light' ? 30 : 25)) return null;
  const match = piece.match(COLOUR_PHRASE_RE);
  if (!match) return null;
  const shade = colourShadeName(best.entry.name);
  const replaced = piece.replace(match[0], match.index === 0 ? `${shade[0].toUpperCase()}${shade.slice(1)}` : shade);
  return { piece: replaced, swap: `${match[0].toLowerCase()} → ${shade} (closest shade in her palette)` };
}

function paletteCloseness(piece: string, rules: VerbatimClientRules): number | null {
  const colour = colourFromPieceText(piece);
  if (!colour || !rules.palette.length) return null;
  return Math.min(...rules.palette.map(entry => deltaE(entry.hex, colour.hex)));
}

function pieceColourScore(piece: string | undefined, rules: VerbatimClientRules, weight: number) {
  if (!piece) return 0;
  if (/metallic|gold|silver|bronze/i.test(piece) && !/(top|blouse|dress|trouser|skirt|jacket|blazer)/i.test(piece)) return 0;
  const distance = paletteCloseness(piece, rules);
  if (distance == null) return 0;
  const score = distance <= 12 ? 2 : distance <= 22 ? 1 : distance <= 35 ? 0 : -1.5;
  return (score - colourTheoryPenalty(piece, rules)) * weight;
}

function labOf(hex: string) {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const clean = hex.replace('#', '');
  const r = channel(Number.parseInt(clean.slice(0, 2), 16));
  const g = channel(Number.parseInt(clean.slice(2, 4), 16));
  const b = channel(Number.parseInt(clean.slice(4, 6), 16));
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}

/** Perceptual distance: RGB called mint "close" to oat and fuchsia "close" to plum. */
function deltaE(left: string, right: string) {
  const a = labOf(left);
  const b = labOf(right);
  return Math.sqrt(((a.l - b.l) / 1.5) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

const COOL_CLASH_RE = /\b(?:mint|lilac|lavender|periwinkle|powder|baby[- ]blue|ice|icy|sky[- ]blue|fuchsia|magenta|hot[- ]pink|bubblegum|cobalt|royal[- ]blue|electric|lemon|silver|pastel|pale[- ](?:pink|blue|grey|gray|yellow)|blush|candy)\b/i;
const WARM_CLASH_RE = /\b(?:mustard|ochre|rust|terracotta|orange|camel|tan|olive|khaki|caramel|brick|burnt|copper|chartreuse)\b/i;
const BRIGHT_RE = /\b(?:neon|electric|bright|hot[- ]pink|fuchsia|magenta|cobalt|royal[- ]blue|lime|chartreuse|canary|lemon|scarlet|sequin)/i;
const PALE_RE = /\b(?:pale|pastel|baby|powder|icy|light[- ](?:pink|blue|yellow|lilac|grey|gray)|mint|blush|butter)/i;

/** What a colour analyst would say before any palette arithmetic. */
function colourTheoryPenalty(piece: string, rules: VerbatimClientRules) {
  let penalty = 0;
  if (rules.undertone === 'warm' && COOL_CLASH_RE.test(piece)) penalty += 2;
  if (rules.undertone === 'cool' && WARM_CLASH_RE.test(piece)) penalty += 2;
  if (rules.muted && BRIGHT_RE.test(piece)) penalty += 1.5;
  if (rules.depth === 'deep' && PALE_RE.test(piece)) penalty += 1.5;
  if (rules.depth === 'light' && /\b(?:black|charcoal|espresso|oxblood)\b/i.test(piece)) penalty += 1;
  return penalty;
}

const LIGHT_NEAR_FACE_RE = /^(?:plain |crisp |bright |optic |stark |pure )?(?:white|ivory|off-white)\b/i;

/** Checks one look against her rules and makes the allowed swaps. */
export function evaluateVerbatimLook(look: VerbatimLook, rules: VerbatimClientRules, capsule: VerbatimCapsule): EvaluatedLook {
  const rejects: string[] = [];
  const swaps: string[] = [];
  const pieces = {
    top: look.top ?? '',
    dress: look.dress ?? '',
    layer: look.layer ?? '',
    bottom: look.bottom ?? '',
    shoes: look.shoes ?? '',
    accessories: look.accessories ?? '',
    styling: look.styling ?? '',
  };
  const base = pieces.dress || pieces.top;
  const all = Object.values(pieces).join(' / ');
  const garments = withoutNegations([pieces.top, pieces.dress, pieces.layer, pieces.bottom].join(' / '));

  if (NOT_AN_OUTFIT_RE.test(all)) rejects.push('not a complete outfit');
  if (!base || (!pieces.dress && !pieces.bottom)) rejects.push('incomplete look');
  // A pin whose slots shifted puts a skirt in the shoe slot; it cannot be shown as written.
  if (pieces.shoes && !MISSING_RE.test(pieces.shoes) && !SHOE_WORD_RE.test(pieces.shoes)) rejects.push('garbled pin');
  if (!rules.ethnicAllowed && look.ethnic) rejects.push('ethnic look for a Western-only client');

  const bareBase = BARE_ARM_RE.test(base) || (SHELL_RE.test(base) && !/sleeve/i.test(base));
  // "No sleeveless unless layered" accepts a sleeveless base under a sleeved layer.
  const coveredByLayer = rules.layeredBaseAllowed && SLEEVED_LAYER_RE.test(pieces.layer) && !BARE_ARM_RE.test(pieces.layer);
  if (rules.arms && bareBase && !coveredByLayer) rejects.push('bare arms or shoulders');
  if (rules.arms && BARE_ARM_RE.test(pieces.layer) && !pieces.top) rejects.push('bare arms or shoulders');
  if (rules.armsStrict && !pieces.layer && SHORT_SLEEVE_RE.test(base)) rejects.push('short sleeves for an upper-arm client');
  if (rules.neckline && LOW_NECK_RE.test(`${base} ${pieces.styling}`)) rejects.push('low neckline');
  if (rules.back && BACKLESS_RE.test(all)) rejects.push('backless');
  if (rules.legs && SHORT_HEM_RE.test(garments)) rejects.push('short hem');
  if (rules.sheer && SHEER_RE.test(garments)) rejects.push('sheer');
  if (rules.loose && TIGHT_RE.test(garments)) rejects.push('tight fit');
  if (rules.wantsDefinition && SHAPELESS_RE.test(garments)) rejects.push('oversized or shapeless');
  if ((rules.loose || rules.neckline || rules.arms) && CROPPED_RE.test(`${garments} ${pieces.styling}`)) rejects.push('cropped or midriff');
  for (const code of rules.antiCodePatterns) if (code.re.test(all)) rejects.push(code.label);
  const banned = violatesBannedPieces(garments, rules.bannedTerms);
  if (banned.length) rejects.push(`avoids ${banned[0]}`);
  if (rules.noSkirtCapsules.includes(capsule) && SKIRT_DRESS_RE.test(`${pieces.dress} ${pieces.bottom}`)) rejects.push(capsule === 'Professional' ? 'skirt or dress at work' : 'skirt or dress for everyday');
  // The one pear rule a stylist never breaks: nothing that clings at the hip.
  if (rules.body.pear && HIP_CLING_RE.test(`${pieces.bottom} ${pieces.dress}`)) rejects.push('clings at the hip');
  if (rules.body.pear && HIP_VOLUME_RE.test(`${pieces.bottom} ${pieces.dress}`)) rejects.push('adds volume at the hip');
  const lowerHalf = pieces.dress || pieces.bottom;
  if (rules.body.pear && /satin|sateen|metallic|sequin|lam[eé]|shiny/i.test(lowerHalf) && /champagne|cream|ivory|white|gold|silver|beige|blush|pale|light/i.test(lowerHalf)) rejects.push('pale shine on her hips');

  // Colours she must not wear: nudge a near-face piece within its family, or drop the look.
  const nearFace: Array<keyof typeof pieces> = pieces.dress ? ['dress', 'layer'] : ['top', 'layer'];
  for (const key of ['top', 'dress', 'layer', 'bottom'] as const) {
    const piece = pieces[key];
    if (!piece) continue;
    const isNearFace = nearFace.includes(key);
    // Only the piece's own main colour counts: white in a zebra print is not a white blouse.
    const mainColour = piece.match(COLOUR_PHRASE_RE)?.[0] ?? '';
    const avoided = rules.avoidColours.find(avoid => avoid.re.test(mainColour) && piece.indexOf(mainColour) < 12 && !/-and-|\/|print|stripe|check|dot/i.test(piece.slice(0, 30)) && (!avoid.nearFaceOnly || isNearFace));
    const lightFace = isNearFace && rules.avoidLightNearFace && LIGHT_NEAR_FACE_RE.test(piece)
      // An open layer over a darker base sits away from the face.
      && !(key === 'layer' && pieces.top && !LIGHT_NEAR_FACE_RE.test(pieces.top));
    if (!avoided && !lightFace) continue;
    const nudge = nudgedPiece(piece, rules, lightFace ? 'light' : 'avoid');
    if (nudge && swaps.filter(item => item.includes('closest shade')).length < 1) {
      pieces[key] = nudge.piece;
      swaps.push(nudge.swap);
    } else {
      rejects.push(lightFace ? 'white next to her face' : `avoided colour (${avoided?.label})`);
    }
  }

  // Checked after the colour nudges, so a nudged look cannot turn into a banned one.
  const bannedOutfit = bannedOutfitFor([pieces.top, pieces.dress, pieces.layer, pieces.bottom]);
  if (bannedOutfit) rejects.push(`banned outfit (${bannedOutfit.label})`);

  // Shoes: flats for a flats-only client; one plain shoe when the pin shows none.
  if (!pieces.shoes || MISSING_RE.test(pieces.shoes)) {
    pieces.shoes = neutralShoe(capsule, rules);
    swaps.push(`shoes not shown → ${pieces.shoes.toLowerCase()}`);
  } else if (rules.heelPreferred && !isHeeledShoe(pieces.shoes) && !HEEL_SWAP_SKIP_RE.test(pieces.shoes)) {
    const heeled = heeledVersionOfShoe(pieces.shoes, rules.statedHeel);
    swaps.push(`${pieces.shoes.toLowerCase()} → ${heeled.toLowerCase()}`);
    pieces.shoes = heeled;
  } else if (rules.heelPreferred && isHeeledShoe(pieces.shoes) && statedHeelHeight(rules.statedHeel).maxInches !== null
    && /stiletto|high[- ]heel|sky[- ]high|platform|\b(?:[3-9]|1\d)(?:\.\d)?[- ]?(?:inch|in\b)/i.test(pieces.shoes)) {
    // She gave a heel height; a stiletto from the board comes down to it.
    const capped = `${pieces.shoes
      .replace(/\bstilettos?\b/gi, 'block-heel pumps')
      .replace(/\b(?:very |sky[- ])?high[- ]heel(?:ed)?\s*/gi, 'block-heel ')
      .replace(/\bplatform\s*/gi, '')
      .replace(/,?\s*\b\d+(?:\.\d+)?[- ]?(?:inch|in)\b(?:\s*heels?)?/gi, '')
      .replace(/block-heel block-heel/gi, 'block-heel')
      .replace(/\s{2,}/g, ' ')
      .trim()}, ${statedHeelHeight(rules.statedHeel).phrase} heel`;
    swaps.push(`${pieces.shoes.toLowerCase()} → ${capped.toLowerCase()}`);
    pieces.shoes = capped;
  } else if (rules.flatsOnly && isHeeledShoe(pieces.shoes)) {
    const flat = flatVersionOfShoe(pieces.shoes);
    swaps.push(`${pieces.shoes.toLowerCase()} → ${flat.toLowerCase()}`);
    pieces.shoes = flat;
  }
  if (rules.metal) {
    const accessories = swapMetal(pieces.accessories, rules.metal);
    const shoes = swapMetal(pieces.shoes, rules.metal);
    if (accessories !== pieces.accessories || shoes !== pieces.shoes) swaps.push(`${rules.metal === 'gold' ? 'silver' : 'gold'} → ${rules.metal}`);
    pieces.accessories = accessories;
    pieces.shoes = shoes;
  }
  if (!BAG_RE.test(pieces.accessories) && !/\b(minimal|none)\b/i.test(pieces.accessories) && capsule !== 'Occasion') {
    const bag = neutralBag(capsule, rules);
    pieces.accessories = pieces.accessories ? `${pieces.accessories}, ${bag.toLowerCase()}` : bag;
    swaps.push(`bag not shown → ${bag.toLowerCase()}`);
  }
  if (!pieces.accessories || /^(minimal|none)$/i.test(pieces.accessories)) {
    pieces.accessories = neutralBag(capsule, rules);
    swaps.push(`bag not shown → ${pieces.accessories.toLowerCase()}`);
  }

  // The report shows at least four pieces per outfit; a sparser pin cannot fill the page.
  if (verbatimFormulaItems({ pieces, swaps }).length < 4) rejects.push('too few pieces');
  const tuck = classifyTuck({ ...look, top: pieces.top, dress: pieces.dress });
  if (rules.noTuck && (tuck === 'tucked' || tuck === 'half-tucked')) rejects.push('tucked in');
  // The styling note goes to her and to the image model, so it must describe
  // the look she gets after the swaps, without the board's own commentary.
  pieces.styling = stylingAfterSwaps(pieces.styling, swaps, rules);
  const colourBalance = colourBalanceOf(pieces);
  const { score, notes } = scoreLook(look, pieces, tuck, rules, capsule, colourBalance);
  return { look, pieces, rejects, swaps, tuck, colourBalance, score: score - swaps.length * 0.25, scoreNotes: notes };
}

const WARDROBE_NEUTRALS = new Set([
  'black', 'ink', 'jet', 'charcoal', 'graphite', 'grey', 'gray', 'slate', 'white', 'off-white', 'ivory', 'cream', 'ecru', 'chalk', 'bone',
  'oatmeal', 'oat', 'beige', 'sand', 'stone', 'taupe', 'mushroom', 'biscuit', 'nude', 'camel', 'tan', 'caramel', 'toffee', 'cognac',
  'brown', 'chocolate', 'cocoa', 'mocha', 'coffee', 'espresso', 'chestnut', 'khaki', 'navy', 'denim', 'indigo', 'chambray',
]);
const DENIM_RE = /\b(?:denim|jeans|chambray)\b/i;

/** True for a wardrobe neutral (black, ivory, camel, navy, denim...), false for a colour, null when the piece names none. */
export function garmentReadsNeutral(piece: string): boolean | null {
  if (!piece) return null;
  const colour = colourFromPieceText(piece);
  if (!colour) return DENIM_RE.test(piece) ? true : null;
  const base = colour.name.toLowerCase().split(/\s+/).at(-1) ?? '';
  // Pale colours read as low-saturation hex values but are colours to a stylist.
  if (/^(?:sage|mint|blush|lilac|lavender|powder|sky|peach|coral|mauve|rose|pistachio|butter|lemon|pink)$/.test(base)) return false;
  if (WARDROBE_NEUTRALS.has(base)) return true;
  // "Light-wash jeans" and "mid-blue denim" read as denim, not as blue.
  if (DENIM_RE.test(piece) && /blue|wash/i.test(piece)) return true;
  return colourFamilyOfHex(colour.hex) === 'neutral';
}

export function colourBalanceOf(pieces: Pick<EvaluatedLook['pieces'], 'top' | 'dress' | 'layer' | 'bottom' | 'shoes' | 'accessories'>): ColourBalance {
  // A coloured top over coloured trousers is a colour set even under a neutral vest.
  if (!pieces.dress && garmentReadsNeutral(pieces.top) === false && garmentReadsNeutral(pieces.bottom) === false) return 'all-colour';
  const garments = pieces.dress ? [pieces.dress, pieces.layer] : [pieces.top, pieces.layer, pieces.bottom];
  const reads = garments.filter(Boolean).map(garmentReadsNeutral).filter((value): value is boolean => value !== null);
  const neutral = reads.filter(Boolean).length;
  const colour = reads.length - neutral;
  if (colour && neutral) return 'balanced';
  if (colour) return 'all-colour';
  const accents = `${pieces.shoes}, ${pieces.accessories}`.split(/,\s*/).filter(part => garmentReadsNeutral(part) === false && !/\bgold|silver|metallic|bronze|pearl\b/i.test(part));
  return accents.length ? 'neutral-with-accent' : 'all-neutral';
}

function scoreLook(
  look: VerbatimLook,
  pieces: EvaluatedLook['pieces'],
  tuck: TuckState,
  rules: VerbatimClientRules,
  capsule: VerbatimCapsule,
  colourBalance: ColourBalance,
) {
  const notes: string[] = [];
  let score = 0;
  const add = (value: number, note: string) => { if (value) { score += value; notes.push(`${value > 0 ? '+' : ''}${value} ${note}`); } };
  const bottom = `${pieces.bottom} ${pieces.dress}`.toLowerCase();
  const top = `${pieces.top} ${pieces.dress}`.toLowerCase();
  const all = Object.values(pieces).join(' ').toLowerCase();
  const styling = pieces.styling.toLowerCase();

  if (rules.body.pear) {
    if (/wide[- ]leg|straight[- ]leg|straight trouser|a-line|palazzo|bootcut|flared|flare\b|relaxed trouser|tailored trouser|column/.test(bottom)) add(2, 'balances her hips');
    if (/skinny|\bslim\b|cigarette|pencil|legging|jogger|tapered|capri/.test(bottom)) add(-3, 'clings at the hip');
    if (/tiered|balloon|harem|bubble|cargo|paper-?bag|pleated mini|full circle/.test(bottom)) add(-2, 'adds volume at the hip');
    if (/peplum/.test(top)) add(-1, 'peplum adds hip volume');
    if (/satin|sateen|metallic|sequin|lam[eé]|shiny|silk/.test(pieces.bottom.toLowerCase()) && /champagne|cream|ivory|white|gold|silver|beige|blush|pale|light/.test(pieces.bottom.toLowerCase())) add(-3, 'pale shine on her hips');
    if (/blazer|structured shoulder|puff|boat neck|bateau|statement collar|square neck|epaulette|shoulder pad|wide collar/.test(`${top} ${pieces.layer.toLowerCase()}`)) add(1, 'interest at the shoulder');
    if (/white|ivory|cream|light[- ]wash|pale/.test(pieces.bottom.toLowerCase()) && /black|navy|chocolate|dark|deep|espresso|burgundy/.test(pieces.top.toLowerCase())) add(-1, 'light bottom under a dark top');
  }
  if (rules.body.midsection) {
    if (tuck === 'untucked' || /longline|tunic|kurta|open (?:blazer|cardigan|jacket|layer)|worn open/.test(`${top} ${styling}`)) add(2, 'skims her midsection');
    if (tuck === 'tucked') add(-1, 'full tuck at the waist');
    if (/belted at the (?:natural )?waist|belt(?:ed)? at the waist|cinched/.test(`${styling} ${pieces.accessories.toLowerCase()}`)) add(-1, 'belt at her midsection');
  }
  if (rules.body.petite) {
    if (/culotte|cropped wide|ankle-grazing wide|midi skirt/.test(bottom) && /flat|loafer|sneaker/.test(pieces.shoes.toLowerCase())) add(-1, 'cuts her height');
    const topColour = colourFromPieceText(pieces.top || pieces.dress);
    const bottomColour = colourFromPieceText(pieces.bottom);
    if (topColour && bottomColour && colourDistance(topColour.hex, bottomColour.hex) < 60) add(1, 'one long colour line');
  }
  if (rules.body.inverted) {
    if (/wide[- ]leg|a-line|palazzo|flare/.test(bottom)) add(1, 'volume below');
    if (/puff|shoulder pad|epaulette|boat neck/.test(top)) add(-1, 'width at the shoulder');
  }
  if (rules.body.hourglass && /wrap|belt|defined waist|tucked/.test(`${top} ${styling} ${pieces.accessories}`)) add(1, 'marks her waist');
  if (rules.body.rectangle && /belt|peplum|wrap/.test(`${top} ${styling} ${pieces.accessories}`)) add(1, 'creates a waist');

  // Her palette ranks the look; it never recolours it.
  const nearFace = pieces.dress || pieces.top;
  const colour = pieceColourScore(nearFace, rules, 2) + pieceColourScore(pieces.layer, rules, 1.5)
    + pieceColourScore(pieces.bottom, rules, 1);
  add(Math.round(colour * 10) / 10, 'palette fit');
  // Palette colours lead or accent; neutrals carry the rest of the outfit.
  if (colourBalance === 'balanced') add(2.5, 'palette colour on a neutral base');
  if (colourBalance === 'neutral-with-accent') add(1, 'neutral base with a colour accent');
  if (colourBalance === 'all-neutral') add(-1, 'no colour at all');
  if (colourBalance === 'all-colour') add(-3, 'head-to-toe colour');

  const tasteHits = rules.tasteTerms.filter(term => new RegExp(term, 'i').test(all)).length;
  add(Math.min(2, tasteHits * 0.5), 'matches her taste');
  if (rules.minimalist) {
    const statements = (all.match(/\bprint|floral|sequin|embellish|fringe|feather|statement|chunky|oversized sunglasses|layered (?:chains|necklaces)|stacked|multiple|tassel|clash|contrast/g) ?? []).length;
    if (statements >= 2) add(-1, 'busy for a minimalist');
  }
  if (look.capsules[0] === capsule) add(1, `filed under ${capsule}`);
  if (/not visible/i.test(look.shoes ?? '')) add(-0.5, 'shoes not shown');
  if (rules.warmClimate && WINTER_RE.test(`${pieces.top} ${pieces.layer} ${pieces.dress}`)) add(-3, 'too warm for her climate');
  // A small per-client nudge, so near-equal looks differ between clients
  // instead of every report landing on the same handful.
  add(Math.round(seededUnit(`${rules.seed}|${look.id}`) * 25) / 10, 'variety');
  return { score, notes };
}

/** A stable number in [0, 1) for a string. */
function seededUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

/** Board commentary written for us, not for her: "the strongest colour-matching in the set". */
const CURATOR_NOTE_RE = /\bin the set\b|\bof the set\b|\bon the board\b|\bthe board\b|\bof the (?:board|looks|outfits|layered looks)\b|\bthe pin\b|curat|"designer"|\bstrongest\b|\bthe most\b|\bbest of\b|\bthe only\b/i;

export function stylingAfterSwaps(styling: string, swaps: string[], rules: Pick<VerbatimClientRules, 'metal'>) {
  if (!styling) return styling;
  let next = styling;
  for (const swap of swaps) {
    const shade = swap.match(/^(.+?) → (.+?) \(closest shade/);
    if (shade) next = next.replace(new RegExp(`\\b${shade[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), shade[2]);
  }
  const shoeSwap = swaps.find(swap => /→/.test(swap) && /flat|heel|pump/i.test(swap) && !/not shown/.test(swap));
  if (shoeSwap && /→ .*flat/i.test(shoeSwap)) next = next.replace(/\b(?:heels|pumps|stilettos)\b/gi, 'flats').replace(/\bheeled\b/gi, 'flat');
  if (shoeSwap && /→ .*(?:heel|pump)/i.test(shoeSwap)) next = next.replace(/\bflats\b/gi, 'heels');
  if (rules.metal) next = next.replace(new RegExp(`\\b${rules.metal === 'gold' ? 'silver' : 'gold'}\\b`, 'gi'), rules.metal);
  const clauses = next.split(/\s*(?:—|–|;)\s*/).filter(clause => clause && !CURATOR_NOTE_RE.test(clause));
  return clauses.join('; ').replace(/\s+/g, ' ').trim();
}

// --- Choosing the set ------------------------------------------------------------

function bottomFamily(pieces: EvaluatedLook['pieces']) {
  const text = `${pieces.bottom} ${pieces.dress}`.toLowerCase();
  if (pieces.dress) return /jumpsuit/.test(text) ? 'jumpsuit' : /saree|sari/.test(text) ? 'saree' : 'dress';
  if (/jean|denim/.test(text)) return 'jeans';
  if (/skirt/.test(text)) return 'skirt';
  if (/palazzo|wide[- ]leg|culotte|flare/.test(text)) return 'wide';
  if (/straight|cigarette|slim|tapered|churidar/.test(text)) return 'straight';
  return 'trouser';
}

function layerFamily(pieces: EvaluatedLook['pieces']) {
  const text = pieces.layer.toLowerCase();
  if (!text) return 'none';
  const match = text.match(/blazer|jacket|cardigan|coat|trench|waistcoat|vest|shrug|kimono|duster|dupatta|shawl|stole|overshirt|shirt/);
  return match?.[0] ?? 'other';
}

function leadFamily(pieces: EvaluatedLook['pieces']) {
  const colour = colourFromPieceText(pieces.dress || pieces.top);
  return colour ? colourFamilyOfHex(colour.hex) : 'unknown';
}

function isBelted(item: EvaluatedLook) {
  return /\bbelt/i.test(`${item.pieces.accessories} ${item.pieces.styling}`);
}

function shapeKey(pieces: EvaluatedLook['pieces']) {
  const top = (pieces.dress || pieces.top).toLowerCase().match(/shirt|blouse|tee|t-shirt|knit|sweater|kurta|tunic|dress|jumpsuit|polo|top|cardigan|turtleneck|saree/)?.[0] ?? 'top';
  return `${top}|${bottomFamily(pieces)}|${layerFamily(pieces)}`;
}

/** How many fully tucked looks a capsule of five may hold before it reads as one formula. */
function tuckAllowance(capsule: VerbatimCapsule, perCapsule: number) {
  return capsule === 'Professional' ? Math.ceil(perCapsule * 0.6) : Math.ceil(perCapsule * 0.4);
}

function diversityPenalty(candidate: EvaluatedLook, chosen: EvaluatedLook[], capsuleChosen: EvaluatedLook[], capsule: VerbatimCapsule, perCapsule: number) {
  let penalty = 0;
  const bottom = bottomFamily(candidate.pieces);
  const layer = layerFamily(candidate.pieces);
  const lead = leadFamily(candidate.pieces);
  penalty += capsuleChosen.filter(item => bottomFamily(item.pieces) === bottom).length * 1.2;
  penalty += chosen.filter(item => bottomFamily(item.pieces) === bottom).length * 0.25;
  if (layer !== 'none') penalty += capsuleChosen.filter(item => layerFamily(item.pieces) === layer).length * 1;
  // A jacket on every look reads as one formula: past two layered looks a capsule pays for more.
  if (layer !== 'none') penalty += Math.max(0, capsuleChosen.filter(item => layerFamily(item.pieces) !== 'none').length - 1) * 2;
  if (layer !== 'none') penalty += Math.max(0, chosen.filter(item => layerFamily(item.pieces) !== 'none').length - 7) * 1;
  // One peplum and two belted looks per capsule at most before they read as a formula.
  if (candidate.tuck === 'peplum') penalty += capsuleChosen.filter(item => item.tuck === 'peplum').length * 2.5
    + Math.max(0, chosen.filter(item => item.tuck === 'peplum').length - 1) * 2;
  if (isBelted(candidate)) penalty += Math.max(0, capsuleChosen.filter(isBelted).length - 1) * 1.5
    + Math.max(0, chosen.filter(isBelted).length - 3) * 1.5;
  if (WINTER_RE.test(`${candidate.pieces.top} ${candidate.pieces.layer}`)) penalty += Math.max(0, chosen.filter(item => WINTER_RE.test(`${item.pieces.top} ${item.pieces.layer}`)).length - 1) * 2;
  // Neutral base, colour on top: head-to-toe colour is rare across the set, and
  // all-neutral looks cannot pile up in a capsule and turn it beige.
  if (candidate.colourBalance === 'all-colour') penalty += chosen.filter(item => item.colourBalance === 'all-colour').length * 2.5;
  if (candidate.colourBalance === 'all-neutral') penalty += capsuleChosen.filter(item => item.colourBalance === 'all-neutral').length * 2;
  if (candidate.colourBalance === 'neutral-with-accent') penalty += Math.max(0, capsuleChosen.filter(item => item.colourBalance !== 'balanced' && item.colourBalance !== 'all-colour').length - 1) * 1;
  if (lead !== 'neutral') penalty += capsuleChosen.filter(item => leadFamily(item.pieces) === lead).length * 2;
  penalty += chosen.filter(item => leadFamily(item.pieces) === lead).length * 0.3;
  if (chosen.some(item => shapeKey(item.pieces) === shapeKey(candidate.pieces) && leadFamily(item.pieces) === lead)) penalty += 2;
  const tucked = capsuleChosen.filter(item => item.tuck === 'tucked').length + capsuleChosen.filter(item => item.tuck === 'half-tucked').length * 0.5;
  if (candidate.tuck === 'tucked' && tucked + 1 > tuckAllowance(capsule, perCapsule)) penalty += 3;
  // A mix: the first look in a capsule worn another way earns its place.
  if (candidate.tuck !== 'tucked' && candidate.tuck !== 'unstated' && !capsuleChosen.some(item => item.tuck === candidate.tuck)) penalty -= 0.75;
  return penalty;
}

export interface VerbatimCandidatePools {
  rules: VerbatimClientRules;
  /** Every look that passes her rules, best first, by capsule. */
  byCapsule: Record<VerbatimCapsule, EvaluatedLook[]>;
  rejected: number;
}

export function rankVerbatimLooks(
  submission: StylistIntakeSubmission,
  reportData: Pick<StylistBlueprintReportData, 'classification' | 'pages' | 'version'>,
  looks: VerbatimLook[] = getVerbatimLooks(),
  options: { relaxSoftRules?: boolean } = {},
): VerbatimCandidatePools {
  const outfitCount = getStylistBlueprintOutfitCount(reportData as StylistBlueprintReportData);
  const strict = buildVerbatimClientRules(submission, reportData, outfitCount);
  const rules: VerbatimClientRules = options.relaxSoftRules
    ? { ...strict, antiCodePatterns: [], wantsDefinition: false, noTuck: false, body: { ...strict.body, pear: false } }
    : strict;
  const byCapsule = Object.fromEntries(CAPSULES.map(capsule => [capsule, [] as EvaluatedLook[]])) as Record<VerbatimCapsule, EvaluatedLook[]>;
  let rejected = 0;
  for (const look of looks) {
    for (const capsule of look.capsules) {
      const evaluated = evaluateVerbatimLook(look, rules, capsule);
      if (evaluated.rejects.length) { rejected += 1; continue; }
      byCapsule[capsule].push(evaluated);
    }
  }
  for (const capsule of CAPSULES) byCapsule[capsule].sort((a, b) => b.score - a.score);
  // Her total ethnic count is the promise. A capsule with too few ethnic looks
  // that pass her rules hands its share to capsules that have them.
  const perCapsule = outfitCount / CAPSULES.length;
  const counts = { ...rules.ethnicByCapsule };
  const available = (capsule: VerbatimCapsule) => Math.min(perCapsule, byCapsule[capsule].filter(item => item.look.ethnic).length);
  let carry = 0;
  for (const capsule of CAPSULES) {
    const over = (counts[capsule] ?? 0) - available(capsule);
    if (over > 0) { counts[capsule] -= over; carry += over; }
  }
  const order = [...rules.ethnicCapsuleOrder, ...CAPSULES.filter(capsule => !rules.ethnicCapsuleOrder.includes(capsule))];
  for (const capsule of order) {
    while (carry > 0 && (counts[capsule] ?? 0) < available(capsule)) { counts[capsule] = (counts[capsule] ?? 0) + 1; carry -= 1; }
  }
  return { rules: { ...rules, ethnicByCapsule: counts }, byCapsule, rejected };
}

/**
 * A diverse shortlist per capsule: greedy, each pick paying for what is
 * already chosen. Ethnic looks fill the ethnic slots first.
 */
export function shortlistVerbatimLooks(
  pools: VerbatimCandidatePools,
  perCapsule: number,
  shortlistSize = perCapsule,
  exclude: Set<string> = new Set(),
): Record<VerbatimCapsule, EvaluatedLook[]> {
  const chosen: EvaluatedLook[] = [];
  const used = new Set(exclude);
  const result = Object.fromEntries(CAPSULES.map(capsule => [capsule, [] as EvaluatedLook[]])) as Record<VerbatimCapsule, EvaluatedLook[]>;
  for (const capsule of CAPSULES) {
    const ethnicSlots = pools.rules.ethnicByCapsule[capsule] ?? 0;
    const capsuleChosen = result[capsule];
    const pick = (filter: (item: EvaluatedLook) => boolean) => {
      let best: EvaluatedLook | null = null;
      let bestValue = Number.NEGATIVE_INFINITY;
      for (const candidate of pools.byCapsule[capsule]) {
        if (used.has(candidate.look.id) || !filter(candidate)) continue;
        const value = candidate.score - diversityPenalty(candidate, chosen, capsuleChosen, capsule, perCapsule);
        if (value > bestValue) { bestValue = value; best = candidate; }
      }
      if (best) {
        used.add(best.look.id);
        capsuleChosen.push(best);
        chosen.push(best);
      }
      return best;
    };
    // Shortlists keep the ethnic share of the final five.
    const ethnicWanted = Math.round((ethnicSlots / perCapsule) * shortlistSize);
    for (let index = 0; index < ethnicWanted; index += 1) if (!pick(item => item.look.ethnic)) break;
    while (capsuleChosen.length < shortlistSize) {
      const westernLeft = shortlistSize - capsuleChosen.length - Math.max(0, ethnicWanted - capsuleChosen.filter(item => item.look.ethnic).length);
      if (!pick(item => westernLeft > 0 ? !item.look.ethnic : true) && !pick(() => true)) break;
    }
  }
  return result;
}

// --- Pages -----------------------------------------------------------------------

export interface VerbatimOutfitCopy {
  title: string;
  occasion: string;
  pull_quote: string;
  why: string;
  /** One "If you prefer…" line: a single swap that keeps the look working. */
  swap?: string;
}

function sentenceCase(text: string) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1)}` : trimmed;
}

function asSentence(text: string) {
  const value = sentenceCase(text).replace(/\s*\.\s*$/, '');
  return value ? `${value}.` : '';
}

function itemColour(piece: string, rules: VerbatimClientRules | null): { name: string; hex: string } {
  const colour = colourFromPieceText(piece);
  if (colour) return colour;
  if (/gold/i.test(piece)) return { name: 'Gold', hex: '#B8912F' };
  if (/silver/i.test(piece)) return { name: 'Silver', hex: '#C4C4C4' };
  const fallback = rules?.palette.find(entry => colourFamilyOfHex(entry.hex) === 'neutral');
  return fallback ? { name: fallback.name, hex: fallback.hex } : { name: 'Neutral', hex: '#8E8E8E' };
}

/** Props in the photo, not things to buy or wear: a laptop, a lanyard, sunglasses on her head. */
const NOT_WORN_RE = /\b(?:laptop|lanyard|phone|coffee|cup|book|umbrella|hair (?:in|pulled|slicked|tied|worn|up|down)|low bun|high bun|ponytail|sunglasses|glasses|hands? in pockets|carried)\b/i;

function splitAccessories(accessories: string) {
  const parts = accessories.split(/,\s*(?![^()]*\))/).map(part => part.trim()).filter(part => part && !NOT_WORN_RE.test(part));
  const bags = parts.filter(part => BAG_RE.test(part));
  const belts = parts.filter(part => !BAG_RE.test(part) && /\bbelt\b/i.test(part));
  const rest = parts.filter(part => !BAG_RE.test(part) && !/\bbelt\b/i.test(part));
  return { bags, belts, rest };
}

/** The formula items for a look, one per real piece, in reading order. */
export function verbatimFormulaItems(evaluated: Pick<EvaluatedLook, 'pieces' | 'swaps'>, rules: VerbatimClientRules | null = null): FormulaItem[] {
  const { pieces } = evaluated;
  const items: FormulaItem[] = [];
  const push = (slot: string, piece: string, role: BlueprintColourUse['role'], note: string) => {
    const text = sentenceCase(piece.replace(/\s*\.\s*$/, ''));
    if (!text) return;
    const colour = itemColour(text, rules);
    items.push({ slot, piece: text, colour_name: colour.name, colour_hex: colour.hex, palette_role: role, structural_notes: note });
  };
  const swapped = (piece: string) => evaluated.swaps.some(swap => swap.endsWith(piece.toLowerCase()) || swap.includes(`→ ${piece.toLowerCase()}`));
  if (pieces.dress) push(/jumpsuit/i.test(pieces.dress) ? 'Jumpsuit' : /saree|sari/i.test(pieces.dress) ? 'Saree' : 'Dress', pieces.dress, 'lead', 'The whole outfit in one piece.');
  else push(/kurta|kurti/i.test(pieces.top) ? 'Kurta' : 'Top', pieces.top, 'lead', 'Worn closest to your face.');
  if (pieces.layer) push(/dupatta|stole|shawl/i.test(pieces.layer) ? 'Dupatta' : 'Layer', pieces.layer, 'support', 'Worn exactly as styled.');
  if (pieces.bottom && !pieces.dress) push('Bottom', pieces.bottom, 'support', 'Keeps the line from waist to floor.');
  const shoeSwap = evaluated.swaps.find(swap => swap.endsWith(pieces.shoes.toLowerCase()));
  const shoeNote = !shoeSwap || !swapped(pieces.shoes) ? 'As styled in the original look.'
    : /not shown/.test(shoeSwap) ? 'A plain shoe that suits the look.'
      : /→ .*flat/.test(shoeSwap) ? 'The flat version of the shoe in the original look.'
        : 'The same shoe on the heel height you asked for.';
  push('Footwear', pieces.shoes, 'ground', shoeNote);
  const { bags, belts, rest } = splitAccessories(pieces.accessories);
  for (const bag of bags) push('Bag', bag, 'ground', 'Finishes the outfit.');
  for (const belt of belts) push('Belt', belt, 'accent', 'Part of the original styling.');
  if (rest.length) push(rest.some(part => /necklace|earring|hoop|stud|bangle|bracelet|cuff|ring|jhumka|chain|pendant|watch/i.test(part)) ? 'Jewellery' : 'Accessories', rest.join(', '), 'accent', 'Small finishing pieces.');
  return items;
}

function paletteUsed(items: FormulaItem[]): BlueprintColourUse[] {
  return items
    .filter(item => !/jewel|accessor/i.test(item.slot))
    .map(item => ({ name: item.colour_name, hex: item.colour_hex, role: item.palette_role }))
    .filter((item, index, array) => array.findIndex(other => other.hex === item.hex) === index)
    .slice(0, 5);
}

/** How the look is worn, from the original styling note. */
export function verbatimHowToWear(evaluated: Pick<EvaluatedLook, 'pieces'>) {
  const styling = evaluated.pieces.styling.trim();
  return styling ? asSentence(styling) : '';
}

const NOTE_TO_COPY: Array<[RegExp, string]> = [
  [/balances her hips/, 'balances your hips'],
  [/interest at the shoulder/, 'brings the eye up to your shoulders'],
  [/skims her midsection/, 'skims your midsection'],
  [/one long colour line/, 'keeps one long line of colour'],
  [/volume below/, 'balances your shoulders with volume below'],
  [/marks her waist/, 'marks your waist'],
  [/creates a waist/, 'gives you shape at the waist'],
  [/palette colour on a neutral base/, 'puts one of your colours on a neutral base'],
  [/neutral base with a colour accent/, 'keeps a neutral base with a touch of your colour'],
  [/matches her taste/, 'fits the way you like to dress'],
];

const FALLBACK_QUOTES = [
  'One of your colours, on a base you can wear anywhere.',
  'Easy to put on, and it looks considered all day.',
  'The shape does the work, so you do not have to.',
  'A look you can repeat with what you already own.',
  'Polished without trying too hard.',
  'Built to move with you from morning to evening.',
  'Simple pieces, worn the way they look best on you.',
  'The colour sits by your face, where it does the most for you.',
];

/** A short garment name cut on a word boundary: "Rust linen shirt", never "rust wide-leg trou". */
function shortPieceName(piece: string, maxWords = 4) {
  const head = piece.split(/,|\s+(?:with|in|and|over|under|worn)\s+/i)[0].trim();
  const words = head.split(/\s+/).slice(0, maxWords);
  while (words.length > 1 && /^(?:a|an|the|of|on|in|with|and|matching)$/i.test(words[words.length - 1])) words.pop();
  return words.join(' ');
}

export function fallbackVerbatimCopy(evaluated: EvaluatedLook, capsule: VerbatimCapsule): VerbatimOutfitCopy {
  const lead = shortPieceName(evaluated.pieces.dress || evaluated.pieces.top);
  const bottom = evaluated.pieces.dress ? '' : shortPieceName(evaluated.pieces.bottom, 3);
  const reasons = evaluated.scoreNotes
    .filter(note => note.startsWith('+'))
    .map(note => NOTE_TO_COPY.find(([pattern]) => pattern.test(note))?.[1])
    .filter((value): value is string => Boolean(value));
  const why = reasons.length >= 2 ? `This outfit ${reasons[0]} and ${reasons[1]}.`
    : reasons.length === 1 ? `This outfit ${reasons[0]}, in colours that suit you.`
      : 'This outfit keeps the proportions clean and the colours close to your palette.';
  return {
    title: sentenceCase(bottom ? `${lead}, ${bottom}`.toLowerCase() : lead.toLowerCase()),
    occasion: capsule,
    pull_quote: FALLBACK_QUOTES[Math.floor(seededUnit(evaluated.look.id) * FALLBACK_QUOTES.length)],
    why,
    swap: evaluated.pieces.dress
      ? 'If you prefer more coverage, add a light open layer in a neutral from your palette.'
      : 'If you prefer something softer, keep the same colours and swap the shoes for flats.',
  };
}

export function verbatimOutfitPage(
  evaluated: EvaluatedLook,
  capsule: VerbatimCapsule,
  pageNumber: number,
  copy: VerbatimOutfitCopy,
  rules: VerbatimClientRules | null = null,
): BlueprintPage {
  const items = verbatimFormulaItems(evaluated, rules);
  const howToWear = verbatimHowToWear(evaluated);
  const blocks: BlueprintBlock[] = [
    { label: 'Formula', heading: 'The pieces', body: howToWear ? `How to wear it: ${howToWear}` : '', items },
    {
      label: 'Why it works',
      heading: 'Why this works on you',
      body: [copy.why, howToWear ? `How to wear it: ${howToWear}` : ''].filter(Boolean).join(' '),
      reason: copy.pull_quote,
    },
    { label: 'How to wear it', heading: 'Wear it like this', body: howToWear || 'Wear each piece as listed.' },
    ...(copy.swap ? [{ label: 'If you prefer', heading: 'If you prefer', body: copy.swap }] : []),
  ];
  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: copy.title,
    subtitle: copy.occasion || capsule,
    pull_quote: copy.pull_quote,
    blocks,
    image_refs: [],
    palette_used: paletteUsed(items),
    library_refs: [{
      id: evaluated.look.id,
      title: `${evaluated.look.source === 'ethnic_office' ? 'Ethnic office' : 'Pinterest'} look ${evaluated.look.id.replace(/^\D+-/, '')}`,
      source: 'pinterest',
      capsule,
      adaptation: evaluated.swaps.length ? `As styled, with: ${evaluated.swaps.join('; ')}` : 'As styled, no changes',
    }],
  };
}

// --- The model's part: choose among real looks, then explain them -----------------

export type VerbatimJsonCaller = (prompt: string, imageUrls?: string[]) => Promise<unknown>;

function lookLine(evaluated: EvaluatedLook) {
  const p = evaluated.pieces;
  return [
    p.dress ? `dress: ${p.dress}` : `top: ${p.top}`,
    p.layer ? `layer: ${p.layer}` : '',
    p.bottom && !p.dress ? `bottom: ${p.bottom}` : '',
    `shoes: ${p.shoes}`,
    p.accessories ? `accessories: ${p.accessories}` : '',
    p.styling ? `worn: ${p.styling}` : '',
    `colour: ${evaluated.colourBalance.replace(/-/g, ' ')}`,
  ].filter(Boolean).join(' | ');
}

function clientBrief(reportData: Pick<StylistBlueprintReportData, 'classification'>, rules: VerbatimClientRules) {
  const c = reportData.classification;
  return [
    `Client: ${c.client.age_range ? `${c.client.age_range}, ` : ''}${c.client.lifestyle_summary}`,
    `Body: ${c.body.geometry}. Focus: ${(c.body.focus_areas ?? []).join(', ')}. ${c.body.proportion_directive ?? ''}`,
    `Colouring: ${c.colour.palette_name} (${c.colour.undertone_direction}, ${c.colour.depth} depth, ${c.colour.contrast} contrast). Her palette: ${rules.palette.map(entry => entry.name).join(', ')}. Avoid: ${(c.colour.avoid_colours ?? []).join(', ')}.`,
    `Taste: ${c.taste.style_archetype}. ${c.taste.moodboard}`,
    `Hard rules already applied: ${rules.summary.join('; ')}.`,
  ].join('\n');
}

/**
 * The visual pass: from each capsule's shortlist, the model picks the looks
 * that will look best on her. It returns ids only, so it can only choose
 * between real outfits, never write one.
 */
export async function pickVerbatimLooksByEye(
  shortlist: Record<VerbatimCapsule, EvaluatedLook[]>,
  perCapsule: number,
  rules: VerbatimClientRules,
  reportData: Pick<StylistBlueprintReportData, 'classification'>,
  callJson: VerbatimJsonCaller,
  photoUrls: string[] = [],
  stylistNote?: string,
): Promise<Record<VerbatimCapsule, EvaluatedLook[]>> {
  const prompt = `You are a senior personal stylist choosing outfits for one real client. Her photos are attached.
${clientBrief(reportData, rules)}
${stylistNote?.trim() ? `\nHer stylist asked for this change: "${stylistNote.trim().slice(0, 600)}". Honour it in your choice.\n` : ''}
Below are outfits kept by our head stylist, already checked against this client's hard rules. Choose only from these ids; passed and unreviewed looks are unavailable. You cannot change them. For each capsule choose exactly ${perCapsule} by id (${perCapsule * CAPSULES.length} outfits total).

Choose by how good each outfit will actually LOOK ON HER, as a stylist would judge it in a mirror:
- colours that flatter her skin, hair and eyes and sit well together, never a forced combination;
- proportions that suit her body without making a show of hiding it;
- outfits that look like something a stylish woman really wears for that part of her life, not a costume;
- a set that is varied: some tucked, some untucked or worn long, different bottoms and colours, never five versions of one formula;
- not a jacket or blazer on every look: most outfits should stand on their own, with a layer only where it makes the look;
- colour the way a stylist uses it: build each outfit on neutrals (black, ivory, navy, denim, camel, brown, beige, grey) and let her palette colour be the hero piece or the accent, a coloured top, layer, bag or shoe. Not head-to-toe colour, not a run of all-beige looks, and never the same hero colour twice in a capsule.
Technical correctness is the floor, not the goal. If two are equally correct, pick the one that looks better on her.
${Object.entries(rules.ethnicByCapsule).filter(([, count]) => count > 0).map(([capsule, count]) => `Include exactly ${count} ethnic look(s) in ${capsule}.`).join(' ')}

${CAPSULES.map(capsule => `${capsule}:\n${shortlist[capsule].map(item => `- ${item.look.id}${item.look.ethnic ? ' (ethnic)' : ''}: ${lookLine(item)}`).join('\n')}`).join('\n\n')}

Return only JSON: {"Professional":["id",...],"Social":[...],"Everyday":[...],"Occasion":[...]}`;
  const fallback = Object.fromEntries(CAPSULES.map(capsule => [capsule,
    withExactEthnicCount(shortlist[capsule].slice(0, perCapsule), shortlist[capsule], rules.ethnicByCapsule[capsule] ?? 0)])) as Record<VerbatimCapsule, EvaluatedLook[]>;
  let raw: unknown;
  try {
    raw = await callJson(prompt, photoUrls);
  } catch {
    return fallback;
  }
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const used = new Set<string>();
  const result = {} as Record<VerbatimCapsule, EvaluatedLook[]>;
  for (const capsule of CAPSULES) {
    const ids = Array.isArray(record[capsule]) ? (record[capsule] as unknown[]).filter((id): id is string => typeof id === 'string') : [];
    const picked = ids
      .map(id => shortlist[capsule].find(item => item.look.id === id))
      .filter((item): item is EvaluatedLook => Boolean(item) && !used.has(item!.look.id));
    const unique = picked.filter((item, index) => picked.findIndex(other => other.look.id === item.look.id) === index).slice(0, perCapsule);
    // Top up from the deterministic order if the model returned too few.
    for (const item of shortlist[capsule]) {
      if (unique.length >= perCapsule) break;
      if (!unique.includes(item) && !used.has(item.look.id)) unique.push(item);
    }
    const exact = withExactEthnicCount(unique, shortlist[capsule].filter(item => !used.has(item.look.id)), rules.ethnicByCapsule[capsule] ?? 0);
    exact.forEach(item => used.add(item.look.id));
    result[capsule] = exact;
  }
  return result;
}

/**
 * Exactly the ethnic share she asked for in this capsule. The Western/Indian
 * mix is her stated preference, so extra kurtas and saris are swapped out for
 * the best Western looks as firmly as missing ones are swapped in. A client
 * who said "More Western" was given ten ethnic looks of twenty before this.
 */
export function withExactEthnicCount(chosen: EvaluatedLook[], pool: EvaluatedLook[], wanted: number): EvaluatedLook[] {
  const result = [...chosen];
  const spare = (ethnic: boolean) => pool.filter(item => item.look.ethnic === ethnic && !result.includes(item));
  const ethnicCount = () => result.filter(item => item.look.ethnic).length;
  while (ethnicCount() > wanted) {
    const replacement = spare(false)[0];
    const extra = [...result].reverse().find(item => item.look.ethnic);
    if (!replacement || !extra) break;
    result[result.indexOf(extra)] = replacement;
  }
  while (ethnicCount() < wanted) {
    const replacement = spare(true)[0];
    const western = [...result].reverse().find(item => !item.look.ethnic);
    if (!replacement || !western) break;
    result[result.indexOf(western)] = replacement;
  }
  return result;
}

const GARMENT_WORDS = /\b(blazer|jacket|cardigan|coat|trench|scarf|belt|vest|waistcoat|dupatta|shawl|stole|shrug|kimono|cape|boots?|heels?|pumps?|sneakers?|loafers?|sandals?|hat|sunglasses|necklace|earrings?|bangles?|watch|clutch|tote|skirt|dress|jeans|jumpsuit|kurta|kurti|saree|sari|palazzos?|trousers?|pants|tunic|shirt|blouse|tee|sweater|jumper|turtleneck|cami)\b/gi;
const COLOUR_WORDS = /\b(red|rust|terracotta|orange|mustard|yellow|ochre|olive|green|emerald|teal|blue|navy|cobalt|indigo|purple|plum|burgundy|wine|maroon|pink|blush|coral|peach|cream|ivory|white|black|grey|gray|brown|camel|tan|beige|taupe|khaki|chocolate|lilac|lavender|mint|sage|silver|champagne)\b/gi;

/** The copy names only garments and colours the look actually has. */
function copyStaysTrue(copy: VerbatimOutfitCopy, evaluated: EvaluatedLook) {
  const lookText = Object.values(evaluated.pieces).join(' ').toLowerCase();
  const text = `${copy.title} ${copy.why} ${copy.pull_quote}`.toLowerCase();
  const garments = text.match(GARMENT_WORDS) ?? [];
  // A colour only counts when it describes a garment ("emerald silk top");
  // "your warm brown skin" is about her, not the outfit.
  const colouredGarments = [...text.matchAll(new RegExp(`${COLOUR_WORDS.source}(?:[\\s-]+[a-z]+){0,2}?[\\s-]+${GARMENT_WORDS.source.replace('(blazer', '(top|blazer')}`, 'gi'))].map(match => match[1].toLowerCase());
  return garments.every(word => lookText.includes(word.replace(/s$/, '')))
    && colouredGarments.every(word => lookText.includes(word) || (/grey|gray/.test(word) && /grey|gray/.test(lookText)));
}

/** The model writes the titles and "why it works" for looks it did not write. */
export async function writeVerbatimCopy(
  looks: Array<{ evaluated: EvaluatedLook; capsule: VerbatimCapsule }>,
  rules: VerbatimClientRules,
  reportData: Pick<StylistBlueprintReportData, 'classification'>,
  callJson: VerbatimJsonCaller,
): Promise<VerbatimOutfitCopy[]> {
  const prompt = `You write the copy for a client's personal style report. The outfits are fixed; describe them, do not change them.
${clientBrief(reportData, rules)}

For each outfit write:
- "title": 2-6 words naming the outfit by its two main pieces, sentence case, e.g. "Rust shirt, espresso trousers". No client name, no occasion.
- "occasion": 2-5 words for where she wears it in HER life (e.g. "Hospital rounds", "Sunday family lunch"), matching the capsule.
- "pull_quote": one sentence, at most 18 words, to her as "you", on what this outfit does for her.
- "why": ONE short sentence, at most 20 words, on why it suits her body or colouring. Plain, simple English, no styling jargon. Different from pull_quote.
- "swap": ONE sentence, at most 20 words, starting "If you prefer", giving one easy swap that keeps the look working for her (e.g. "If you prefer flats, wear tan pointed flats instead of the heels."). This is the only field that may name a garment the outfit does not list.
Outside "swap", never mention a garment, colour or accessory the outfit does not list. Never mention Pinterest or a library. No hex codes.

${looks.map(({ evaluated, capsule }, index) => `${index + 1}. [${capsule}] ${lookLine(evaluated)}`).join('\n')}

Return only JSON: {"outfits":[{"title":"","occasion":"","pull_quote":"","why":"","swap":""}, ...]} in the same order.`;
  let entries: unknown[] = [];
  try {
    const raw = await callJson(prompt);
    const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    entries = Array.isArray(record.outfits) ? record.outfits : [];
  } catch {
    entries = [];
  }
  return looks.map(({ evaluated, capsule }, index) => {
    const fallback = fallbackVerbatimCopy(evaluated, capsule);
    const entry = (entries[index] && typeof entries[index] === 'object' ? entries[index] : {}) as Record<string, unknown>;
    const text = (key: string) => (typeof entry[key] === 'string' ? (entry[key] as string).trim() : '');
    const copy: VerbatimOutfitCopy = {
      title: sentenceCase(text('title')) || fallback.title,
      occasion: sentenceCase(text('occasion')) || fallback.occasion,
      pull_quote: asSentence(text('pull_quote')) || fallback.pull_quote,
      why: text('why') ? asSentence(text('why')) : fallback.why,
      swap: /^if you prefer/i.test(text('swap')) ? asSentence(text('swap')) : fallback.swap,
    };
    return copyStaysTrue(copy, evaluated) ? copy : { ...copy, why: fallback.why, pull_quote: fallback.pull_quote, title: copyStaysTrue({ ...fallback, title: copy.title }, evaluated) ? copy.title : fallback.title };
  });
}

// --- The whole application act -----------------------------------------------------

function photoUrlsOf(submission: StylistIntakeSubmission) {
  const photos = submission.photo_urls ?? {};
  return [photos.headshot, photos.full_body_front, photos.full_body_side].filter((url): url is string => typeof url === 'string' && url.length > 0);
}

function transformationPreviewPage(
  previews: Array<{ evaluated: EvaluatedLook; capsule: VerbatimCapsule; copy: VerbatimOutfitCopy }>,
  pageNumber: number,
  rules: VerbatimClientRules,
): BlueprintPage {
  return {
    page_number: pageNumber,
    page_type: 'transformation',
    title: 'Transformation Preview',
    subtitle: 'Three looks chosen for you before the full wardrobe system',
    blocks: previews.map(({ evaluated, capsule, copy }, index) => ({
      label: `Look ${String(index + 1).padStart(2, '0')}`,
      heading: capsule.toUpperCase(),
      body: [copy.why, verbatimHowToWear(evaluated) ? `How to wear it: ${verbatimHowToWear(evaluated)}` : ''].filter(Boolean).join(' '),
      reason: copy.pull_quote,
      items: verbatimFormulaItems(evaluated, rules),
    })),
    image_refs: [],
    palette_used: paletteUsed(previews.flatMap(({ evaluated }) => verbatimFormulaItems(evaluated, rules))).slice(0, 4),
  };
}

function outfitSystemPage(pages: BlueprintPage[], capsules: VerbatimCapsule[], pageNumber: number, perCapsule: number): BlueprintPage {
  return {
    page_number: pageNumber,
    page_type: 'outfit_system',
    title: 'Outfit System',
    subtitle: 'Twenty real outfits, chosen for you and worn as styled',
    blocks: [{
      label: 'Capsules',
      heading: 'Four outfit categories',
      body: 'Every outfit here is a real, photographed look, chosen for your body, your colouring and your days, and worn exactly the way it was styled.',
      items: CAPSULES.map((capsule, capsuleIndex) => ({
        capsule,
        range: `Outfits ${capsuleIndex * perCapsule + 1}-${(capsuleIndex + 1) * perCapsule}`,
        outfits: pages.filter((_, index) => capsules[index] === capsule).map(page => page.title),
      })),
    }],
    image_refs: [],
  };
}

export async function generatePinterestVerbatimApplication(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  callJson: VerbatimJsonCaller,
  options: { excludeLookIds?: string[]; stylistNote?: string } = {},
): Promise<{ pages: BlueprintPage[]; outfit_engine: PinterestOutfitEngineMetadata }> {
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const perCapsule = outfitCount / CAPSULES.length;
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const pools = rankVerbatimLooks(submission, reportData);
  // "Regenerate all" should show new looks, as long as enough remain to choose from.
  const exclude = new Set(options.excludeLookIds ?? []);
  const roomToExclude = CAPSULES.every(capsule => pools.byCapsule[capsule].filter(item => !exclude.has(item.look.id)).length >= perCapsule + 3);
  const shortlist = shortlistVerbatimLooks(pools, perCapsule, perCapsule + 7, roomToExclude ? exclude : new Set());
  fillShortCapsules(shortlist, pools, perCapsule, submission, reportData);
  if (CAPSULES.some(capsule => shortlist[capsule].length < perCapsule)) {
    throw new Error(`Not enough kept outfits pass this client's rules for a set of ${outfitCount}. Ask the head stylist to keep more suitable outfits before generating this set.`);
  }
  const picked = await pickVerbatimLooksByEye(shortlist, perCapsule, pools.rules, reportData, callJson, photoUrlsOf(submission), options.stylistNote);

  const ordered = CAPSULES.flatMap(capsule => picked[capsule].map(evaluated => ({ evaluated, capsule })));
  if (ordered.length !== outfitCount) throw new Error(`Only ${ordered.length} kept outfits pass this client's rules; ${outfitCount} are needed. Ask the head stylist to keep more suitable outfits before generating this set.`);

  // Three more looks for the preview page, from what was shortlisted but not used.
  const usedIds = new Set(ordered.map(item => item.evaluated.look.id));
  const transformationPageNumber = getStylistBlueprintTransformationPage(reportData);
  const previewSources = transformationPageNumber
    ? (['Professional', 'Everyday', 'Social'] as VerbatimCapsule[])
      .map((capsule, index) => {
        // The preview is the first impression: an ethnic look leads it only for
        // a client whose set is at least half ethnic.
        const unused = [...shortlist[capsule], ...pools.byCapsule[capsule]].filter(item => !usedIds.has(item.look.id));
        const ethnicLed = ordered.filter(item => item.evaluated.look.ethnic).length * 2 >= ordered.length;
        const pick = (index === 0 && ethnicLed ? unused.find(item => item.look.ethnic) : unused.find(item => !item.look.ethnic)) ?? unused[0];
        if (pick) usedIds.add(pick.look.id);
        return { capsule, evaluated: pick };
      })
      .filter((item): item is { capsule: VerbatimCapsule; evaluated: EvaluatedLook } => Boolean(item.evaluated))
    : [];

  const copies = await writeVerbatimCopy([...ordered, ...previewSources], pools.rules, reportData, callJson);
  const outfitPages = ordered.map(({ evaluated, capsule }, index) => verbatimOutfitPage(evaluated, capsule, outfitStart + index, copies[index], pools.rules));
  const pages: BlueprintPage[] = [];
  if (transformationPageNumber && previewSources.length) {
    pages.push(transformationPreviewPage(
      previewSources.map((item, index) => ({ ...item, copy: copies[ordered.length + index] })),
      transformationPageNumber,
      pools.rules,
    ));
  }
  pages.push(outfitSystemPage(outfitPages, ordered.map(item => item.capsule), outfitStart - 1, perCapsule));
  pages.push(...outfitPages);

  return {
    pages,
    outfit_engine: {
      version: PINTEREST_VERBATIM_ENGINE_VERSION,
      selected: ordered.map(({ evaluated, capsule }, index) => ({
        page_number: outfitStart + index,
        look_id: evaluated.look.id,
        capsule,
        swaps: evaluated.swaps,
      })),
      preview_look_ids: previewSources.map(item => item.evaluated.look.id),
      rules: pools.rules.summary,
      qa_feedback: (reportData.outfit_engine as { qa_feedback?: OutfitScienceQaFeedback[] } | undefined)?.qa_feedback ?? [],
    },
  };
}

/**
 * A very strict brief can leave a capsule short of looks. Rather than fail the
 * whole report, borrow looks that pass her rules from the other capsules, then
 * relax only the softer rules (taste anti-codes, body preferences) and mark
 * those looks for the stylist to check. Coverage rules are never relaxed.
 */
function fillShortCapsules(
  shortlist: Record<VerbatimCapsule, EvaluatedLook[]>,
  pools: VerbatimCandidatePools,
  perCapsule: number,
  submission: StylistIntakeSubmission,
  reportData: Pick<StylistBlueprintReportData, 'classification' | 'pages' | 'version'>,
) {
  const used = () => new Set(CAPSULES.flatMap(capsule => shortlist[capsule].map(item => item.look.id)));
  let relaxed: VerbatimCandidatePools | null = null;
  for (const capsule of CAPSULES) {
    if (shortlist[capsule].length >= perCapsule) continue;
    const borrow = CAPSULES.filter(other => other !== capsule).flatMap(other => pools.byCapsule[other]);
    for (const item of borrow) {
      if (shortlist[capsule].length >= perCapsule) break;
      if (!used().has(item.look.id)) shortlist[capsule].push(item);
    }
    if (shortlist[capsule].length >= perCapsule) continue;
    relaxed ??= rankVerbatimLooks(submission, reportData, getVerbatimLooks(), { relaxSoftRules: true });
    for (const item of [...relaxed.byCapsule[capsule], ...CAPSULES.flatMap(other => relaxed!.byCapsule[other])]) {
      if (shortlist[capsule].length >= perCapsule) break;
      if (used().has(item.look.id)) continue;
      shortlist[capsule].push({ ...item, swaps: [...item.swaps, 'stylist to check: a soft rule was relaxed to fill this capsule'] });
    }
  }
}

// --- Swapping one look --------------------------------------------------------------

function selectedLookIds(reportData: StylistBlueprintReportData) {
  const fromPages = reportData.pages
    .filter(page => page.page_type === 'outfit' || page.page_type === 'transformation')
    .flatMap(page => page.library_refs?.map(ref => ref.id) ?? []);
  const engine = reportData.outfit_engine as Partial<PinterestOutfitEngineMetadata> | undefined;
  return new Set([...fromPages, ...(engine?.selected?.map(item => item.look_id) ?? []), ...(engine?.preview_look_ids ?? [])]);
}

function capsuleOfPage(reportData: StylistBlueprintReportData, pageNumber: number): VerbatimCapsule {
  const engine = reportData.outfit_engine as Partial<PinterestOutfitEngineMetadata> | undefined;
  const fromEngine = engine?.selected?.find(item => item.page_number === pageNumber)?.capsule;
  if (fromEngine) return fromEngine;
  const index = pageNumber - getStylistBlueprintOutfitStartPage(reportData);
  const perCapsule = getStylistBlueprintOutfitCount(reportData) / CAPSULES.length;
  return CAPSULES[Math.min(CAPSULES.length - 1, Math.max(0, Math.floor(index / perCapsule)))];
}

/** The next best real looks for one outfit page, none already in the report. */
export function verbatimAlternativesForPage(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  limit = 8,
): Array<{ evaluated: EvaluatedLook; capsule: VerbatimCapsule }> {
  const capsule = capsuleOfPage(reportData, pageNumber);
  const pools = rankVerbatimLooks(submission, reportData);
  const used = selectedLookIds(reportData);
  const engine = reportData.outfit_engine as Partial<PinterestOutfitEngineMetadata> | undefined;
  const currentPage = reportData.pages.find(page => page.page_number === pageNumber);
  const current = currentPage?.library_refs?.[0]?.id ?? engine?.selected?.find(item => item.page_number === pageNumber)?.look_id;
  // Keep the page on its side of her Western/Indian mix, whatever produced it.
  const currentEthnic = current
    ? getAllVerbatimLooks().find(look => look.id === current)?.ethnic
    : currentPage ? ETHNIC_RE.test(JSON.stringify(currentPage.blocks)) : undefined;
  const others = reportData.pages
    .filter(page => page.page_type === 'outfit' && page.page_number !== pageNumber)
    .map(page => pools.byCapsule[capsule].find(item => item.look.id === page.library_refs?.[0]?.id))
    .filter((item): item is EvaluatedLook => Boolean(item));
  const perCapsule = getStylistBlueprintOutfitCount(reportData) / CAPSULES.length;
  return pools.byCapsule[capsule]
    .filter(item => !used.has(item.look.id))
    .filter(item => currentEthnic === undefined || item.look.ethnic === currentEthnic)
    .map(item => ({ item, value: item.score - diversityPenalty(item, others, others, capsule, perCapsule) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(({ item }) => ({ evaluated: item, capsule }));
}

/** A ready outfit page for one replacement look, with fresh copy. */
export async function verbatimReplacementPage(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  callJson: VerbatimJsonCaller,
  lookId?: string,
  stylistNote?: string,
): Promise<{ page: BlueprintPage; outfit_engine: PinterestOutfitEngineMetadata }> {
  const alternatives = verbatimAlternativesForPage(submission, reportData, pageNumber, lookId ? 200 : 8);
  let choice = lookId ? alternatives.find(item => item.evaluated.look.id === lookId) : alternatives[0];
  // A stylist who says why she is replacing the look gets a replacement chosen for that reason.
  if (!lookId && stylistNote?.trim() && alternatives.length > 1) {
    try {
      const raw = await callJson(`A stylist is replacing one outfit in a client's report. Her reason: "${stylistNote.trim().slice(0, 600)}".
Pick the one outfit below that best answers her reason. Return only JSON: {"id":""}.

${alternatives.map(item => `- ${item.evaluated.look.id}: ${lookLine(item.evaluated)}`).join('\n')}`);
      const id = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>).id : null);
      choice = alternatives.find(item => item.evaluated.look.id === id) ?? choice;
    } catch {
      // The best-ranked alternative stands.
    }
  }
  if (!choice) throw new Error(lookId ? 'That look is no longer available for this outfit.' : 'No other library look passes this client\'s rules for this outfit.');
  const rules = buildVerbatimClientRules(submission, reportData, getStylistBlueprintOutfitCount(reportData));
  const [copy] = await writeVerbatimCopy([choice], rules, reportData, callJson);
  const page = verbatimOutfitPage(choice.evaluated, choice.capsule, pageNumber, copy, rules);
  const engine = (isPinterestVerbatimReport(reportData) ? reportData.outfit_engine : null) as PinterestOutfitEngineMetadata | null;
  const selected = engine?.selected ?? [];
  const nextSelected = [
    ...selected.filter(item => item.page_number !== pageNumber),
    { page_number: pageNumber, look_id: choice.evaluated.look.id, capsule: choice.capsule, swaps: choice.evaluated.swaps },
  ].sort((a, b) => a.page_number - b.page_number);
  return {
    page,
    outfit_engine: {
      version: PINTEREST_VERBATIM_ENGINE_VERSION,
      selected: nextSelected,
      preview_look_ids: engine?.preview_look_ids ?? [],
      rules: rules.summary,
      qa_feedback: engine?.qa_feedback ?? [],
    },
  };
}

// --- Checking an outfit a stylist wrote -------------------------------------------

/**
 * The hard rules, applied to a look a stylist pasted or edited. Pasted looks
 * used to be saved unchecked: heels for a flats-only client, a sleeveless
 * shell for a client who ruled sleeveless out, silver for a gold wearer.
 */
export function clientRuleWarningsForPage(
  submission: StylistIntakeSubmission,
  reportData: Pick<StylistBlueprintReportData, 'classification' | 'pages' | 'version'>,
  page: BlueprintPage,
): string[] {
  const rules = buildVerbatimClientRules(submission, reportData, getStylistBlueprintOutfitCount(reportData as StylistBlueprintReportData));
  const items = page.blocks.flatMap(block => (Array.isArray(block.items) ? block.items : [])) as Array<Record<string, unknown>>;
  const piece = (pattern: RegExp) => items.filter(item => pattern.test(String(item.slot ?? ''))).map(item => String(item.piece ?? '')).join(', ');
  const look: VerbatimLook = {
    id: 'stylist-edit',
    source: 'pinterest',
    capsules: [capsuleOfPage(reportData as StylistBlueprintReportData, page.page_number)],
    top: piece(/top|kurta|blouse|shirt/i) || undefined,
    dress: piece(/dress|saree|jumpsuit/i) || undefined,
    layer: piece(/layer|outer|jacket|blazer|dupatta/i) || undefined,
    bottom: piece(/bottom|trouser|skirt|pant/i) || undefined,
    shoes: piece(/foot|shoe/i) || 'shown',
    accessories: piece(/bag|jewel|accessor|belt|scarf|eyewear/i) || 'shown bag',
    styling: '',
    ethnic: false,
  };
  look.ethnic = ETHNIC_RE.test(Object.values(look).join(' '));
  const evaluated = evaluateVerbatimLook(look, rules, look.capsules[0]);
  // Structural notes are for library pins, not for an outfit a stylist wrote.
  const warnings = [...evaluated.rejects.filter(item => !/^(?:incomplete look|not a complete outfit|too few pieces|garbled pin)$/.test(item))];
  if (rules.flatsOnly && isHeeledShoe(look.shoes ?? '')) warnings.push('heels for a flats-only client');
  if (rules.metal && new RegExp(`\\b${rules.metal === 'gold' ? 'silver' : 'gold'}\\b`, 'i').test(`${look.accessories} ${look.shoes}`)) warnings.push(`${rules.metal === 'gold' ? 'silver' : 'gold'} for a ${rules.metal} wearer`);
  return [...new Set(warnings)];
}

/** Breaks a stylist cannot save over: coverage, shoes she ruled out, skirts at work, banned outfits. */
export function isHardClientRuleWarning(warning: string) {
  return /bare arms|short sleeves|low neckline|backless|short hem|sheer|tight fit|cropped|heels for a flats-only|skirt or dress at work|skirt or dress for everyday|banned outfit/.test(warning);
}
