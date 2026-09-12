import {
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintTransformationPage,
} from './stylistBlueprintSchema.ts';
import {
  getParsedStylistOutfitLibrary,
  outfitCapsules,
  isUsableStylistOutfitAnchor,
  type ParsedStylistOutfit,
  type ParsedStylistOutfitSlot,
} from './stylistOutfitLibraryParser.ts';
import type {
  BlueprintBlock,
  BlueprintColourUse,
  BlueprintLibraryRef,
  BlueprintPage,
  StylistBlueprintClassification,
  StylistBlueprintReportData,
  StylistIntakeSubmission,
} from './stylistBlueprintGenerator.ts';

export const STYLIST_OUTFIT_SCIENCE_VERSION = 'outfit_science_v1' as const;

import {
  colourFamilyOfHex,
  colourFromPieceText,
  snapColourToPalette,
} from './stylistColourMatching.ts';
import {
  ETHNIC_CAPSULE_PRIORITY,
  bannedPieceTerms,
  dullsInWhite,
  ethnicCountsByCapsule,
  matchesPreferredGarment,
  preferredEthnicGarments,
  ethnicOutfitTarget,
  intakeSignalsEthnicPreference,
  parseFootwearPreference,
  type FootwearPreference,
} from './stylistIntakePreferences.ts';

export function isStylistOutfitScienceHarnessEnabled() {
  return /^(1|true|yes)$/i.test(process.env.STYLIST_OUTFIT_SCIENCE_HARNESS_ENABLED ?? '');
}

export type BodyZone = 'arms' | 'midsection' | 'hips' | 'thighs' | 'bust' | 'neck' | 'face' | 'legs';
export type ZoneState = 'feature' | 'neutral' | 'camouflage';
export type ColourProfileValue = 'light' | 'medium' | 'deep';
export type ColourProfileContrast = 'low' | 'medium' | 'high';
export type ColourProfileChroma = 'muted' | 'medium' | 'clear';
export type ColourProfileUndertone = 'warm' | 'cool' | 'neutral' | 'olive';
export type StylingFunction =
  | 'ELONGATE'
  | 'WIDEN'
  | 'NARROW'
  | 'DEFINE_WAIST'
  | 'BALANCE'
  | 'SPOTLIGHT'
  | 'DIFFUSE'
  | 'FRAME_FACE'
  | 'POLISH'
  | 'ELEVATE'
  | 'SOFTEN'
  | 'SHARPEN'
  | 'HARMONIZE'
  | 'CONTEXT_FIT';

/** Garments that read as Indian, ethnic or indo-western. */
export const ETHNIC_GARMENT_RE = /\b(saree|sari|kurta|kurti|lehenga|anarkali|salwar|churidar|sharara|gharara|dupatta|indo[- ]?western|bandhgala|chanderi|banarasi|potli|jutti)\b/i;

export interface StatedClientPreferences {
  /** How many of the twenty outfits should be ethnic, from her stated ratio. */
  ethnic_target: number;
  /** Ethnic garments she asked for by name, e.g. "saree". */
  preferred_ethnic_garments: string[];
  footwear: FootwearPreference;
  banned_pieces: string[];
  /** She told us white clothing makes her look dull, so keep it off her face. */
  avoid_light_near_face: boolean;
}

export interface ClientStateModel {
  client_id: string;
  display_name: string;
  geometry: {
    silhouette_summary: string;
    shoulder_to_hip: 'narrower_shoulders' | 'balanced' | 'wider_shoulders' | 'unknown';
    waist_definition: 'defined' | 'soft' | 'straight' | 'unknown';
    vertical_line: 'short_torso' | 'balanced' | 'long_torso' | 'unknown';
    height_band: 'petite' | 'average' | 'tall' | 'unknown';
    scale: 'fine' | 'medium' | 'substantial';
    zone_map: Record<BodyZone, ZoneState>;
  };
  colour: {
    undertone: ColourProfileUndertone;
    value_depth: ColourProfileValue;
    contrast: ColourProfileContrast;
    chroma: ColourProfileChroma;
    palette_name: string;
    base_palette: Array<{ name: string; hex: string; usage?: string }>;
    accent_palette: Array<{ name: string; hex: string; usage?: string }>;
    avoid_colours: string[];
  };
  aspiration: {
    descriptors: string[];
    context: string;
    statement: string;
  };
  vetoes: {
    hard: string[];
    modesty: string[];
    soft_preferences: string[];
  };
  /** Instructions the client gave directly, honoured as quotas and bans. */
  preferences: StatedClientPreferences;
  context: {
    country: string;
    climate: string;
    market: string;
    capsules: Array<'Professional' | 'Social' | 'Everyday' | 'Occasion'>;
  };
  wardrobe_baseline: string;
}

export interface FunctionDemand {
  id: string;
  capsule: 'Professional' | 'Social' | 'Everyday' | 'Occasion';
  occasion: string;
  functions: Array<{ function: StylingFunction; zone?: BodyZone; priority: number; reason: string }>;
  aspiration_register: string;
  hard_constraints: string[];
}

export interface TechniqueGrammarEntry {
  id: string;
  name: string;
  functions: StylingFunction[];
  preconditions: string[];
  enablers: string[];
  contraindications: string[];
  cost: string[];
}

export interface FormulaItem {
  slot: string;
  piece: string;
  colour_name: string;
  colour_hex: string;
  palette_role: BlueprintColourUse['role'];
  structural_notes: string;
}

export interface CandidateOutfit {
  /** True when the look reads as Indian, ethnic or indo-western. */
  is_ethnic?: boolean;
  /**
   * How the anchor look is actually worn, written by a stylist — the tuck, the
   * rolled sleeve, where the belt sits. Better client copy than anything we can
   * generate, so it is carried through to the report.
   */
  styling_note?: string;
  id: string;
  demand_id: string;
  capsule: FunctionDemand['capsule'];
  library_ref?: BlueprintLibraryRef;
  library_signature?: string;
  formula_items: FormulaItem[];
  techniques: Array<{ id: string; name: string; functions: StylingFunction[]; enablers_used: string[] }>;
  attention_map: {
    first_fixation: BodyZone | 'face';
    second_fixation: BodyZone | 'hem' | 'waist' | 'hands';
    risk_zones: BodyZone[];
  };
  colour_scores: Array<{ slot: string; colour: string; zone: 'near_face' | 'away_from_face'; score: number }>;
  veto_checks: Array<{ veto: string; passed: boolean; reason: string }>;
  sourcing_assumptions: string[];
  generation_reasoning: string;
}

export interface OutfitScore {
  candidate_id: string;
  realism: number;
  relevance: number;
  iconik: number;
  diversity: number;
  killed: boolean;
  kill_flags: Array<'REALISM' | 'RELEVANCE' | 'ICONIK' | 'VETO'>;
  rationale: string;
}

export interface ScoredCandidateOutfit extends CandidateOutfit {
  score: OutfitScore;
}

export type OutfitScienceQaVerdict = 'PASS' | 'PASS_SURPRISE' | 'KILL_EYE' | 'KILL_WOW' | 'KILL_REAL';

export interface OutfitScienceQaFeedback {
  id: string;
  page_number: number;
  candidate_id: string | null;
  library_anchor_id: string | null;
  verdict: OutfitScienceQaVerdict;
  reason: string;
  technique_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface OutfitScienceEngineMetadata {
  version: typeof STYLIST_OUTFIT_SCIENCE_VERSION;
  client_state: ClientStateModel;
  function_demands: FunctionDemand[];
  generated_candidates: CandidateOutfit[];
  scored_candidates: ScoredCandidateOutfit[];
  selected_candidate_ids: string[];
  portfolio_score: {
    average_realism: number;
    average_relevance: number;
    average_iconik: number;
    diversity: number;
  };
  qa_feedback: OutfitScienceQaFeedback[];
}

const CAPSULES: FunctionDemand['capsule'][] = ['Professional', 'Social', 'Everyday', 'Occasion'];
const NEUTRAL_COLOURS = [
  { name: 'Ivory', hex: '#F5F0E8' },
  { name: 'Chocolate', hex: '#4B2E24' },
  { name: 'Charcoal', hex: '#2D3033' },
  { name: 'Cognac', hex: '#9A5A2F' },
  { name: 'Black', hex: '#111111' },
];

export const TECHNIQUE_GRAMMAR: TechniqueGrammarEntry[] = [
  {
    id: 'full-tuck-with-absorbing-layer',
    name: 'Full tuck with absorbing layer',
    functions: ['DEFINE_WAIST', 'POLISH', 'ELONGATE', 'DIFFUSE'],
    preconditions: ['midsection is not the visual focus or the side midsection is covered by an open structured layer'],
    enablers: ['open blazer/vest absorbs side attention', 'low waist contrast', 'front-only tuck in fluid fabric'],
    contraindications: ['clingy knit top, high-contrast belt, and no layer on a camouflage midsection'],
    cost: ['adds heat through a layer', 'requires structured waistband'],
  },
  {
    id: 'hem-volume-balance',
    name: 'Hem volume balance',
    functions: ['BALANCE', 'ELONGATE', 'HARMONIZE'],
    preconditions: ['full-length hem or clean vertical lower line'],
    enablers: ['straight-leg full length trouser', 'wide-leg trouser', 'A-line skirt', 'flared kurta hem'],
    contraindications: ['cropped flares on petite clients with calf camouflage'],
    cost: ['may require hemming'],
  },
  {
    id: 'empire-seam-relocation',
    name: 'Empire seam relocation',
    functions: ['DIFFUSE', 'DEFINE_WAIST', 'ELONGATE'],
    preconditions: ['bust or upper torso can anchor the seam and fabric drapes below it'],
    enablers: ['soft V neckline', 'fluid fabric below seam'],
    contraindications: ['straight rectangle frame with no seam anchor'],
    cost: ['more sourcing specificity'],
  },
  {
    id: 'open-vertical-frame',
    name: 'Open vertical frame',
    functions: ['ELONGATE', 'FRAME_FACE', 'DIFFUSE', 'POLISH'],
    preconditions: ['third piece can stay open and unbulky'],
    enablers: ['tonal inner column', 'longline vest', 'unstructured blazer'],
    contraindications: ['stiff boxy layer ending at the widest camouflage zone'],
    cost: ['layering can be warm'],
  },
  {
    id: 'near-face-contrast-frame',
    name: 'Near-face contrast frame',
    functions: ['FRAME_FACE', 'SPOTLIGHT', 'SHARPEN'],
    preconditions: ['near-face colour has compatible value and contrast'],
    enablers: ['warm metal bridge', 'soft ivory instead of optic white', 'collar or earring colour correction'],
    contraindications: ['very high chroma near low-contrast muted colouring'],
    cost: ['requires more precise shade choice'],
  },
  {
    id: 'texture-hero-grounded',
    name: 'Texture hero with grounded support',
    functions: ['ELEVATE', 'HARMONIZE', 'POLISH'],
    preconditions: ['one tactile fabric can be the hero while the rest stays quiet'],
    enablers: ['satin skirt', 'suede texture', 'ribbed knit', 'structured twill'],
    contraindications: ['all pieces shiny or all pieces flat'],
    cost: ['fabric quality matters'],
  },
  {
    id: 'pattern-displacement',
    name: 'Pattern displacement',
    functions: ['SPOTLIGHT', 'DIFFUSE', 'HARMONIZE'],
    preconditions: ['pattern sits away from camouflage zones or is scaled to client contrast'],
    enablers: ['micro stripe', 'vertical stripe', 'print hero with quiet bottom'],
    contraindications: ['dense high-contrast print over a camouflage midsection'],
    cost: ['pattern sourcing specificity'],
  },
  {
    id: 'warm-bridge-correction',
    name: 'Warm bridge correction',
    functions: ['HARMONIZE', 'ELEVATE', 'FRAME_FACE'],
    preconditions: ['cool or high-contrast outfit needs a humanising bridge'],
    enablers: ['gold jewellery', 'cognac leather', 'tortoiseshell', 'warm lip tone'],
    contraindications: ['overuse of warm bridge when the client explicitly avoids warm metals/leather'],
    cost: ['accessory discipline required'],
  },
];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

function textFromUnknown(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normaliseUndertone(value: string): ColourProfileUndertone {
  const text = value.toLowerCase();
  if (/olive/.test(text)) return 'olive';
  if (/cool/.test(text)) return 'cool';
  if (/warm/.test(text)) return 'warm';
  return 'neutral';
}

function normaliseDepth(value: string): ColourProfileValue {
  const text = value.toLowerCase();
  if (/deep|dark/.test(text)) return 'deep';
  if (/light|fair/.test(text)) return 'light';
  return 'medium';
}

function normaliseContrast(value: string): ColourProfileContrast {
  const text = value.toLowerCase();
  if (/high|strong/.test(text)) return 'high';
  if (/low|soft/.test(text)) return 'low';
  return 'medium';
}

function normaliseChroma(value: string): ColourProfileChroma {
  const text = value.toLowerCase();
  if (/clear|bright|vivid|saturated/.test(text)) return 'clear';
  if (/muted|soft|dusty/.test(text)) return 'muted';
  return 'medium';
}

function zoneState(zone: BodyZone, classification: StylistBlueprintClassification): ZoneState {
  const text = [
    classification.body.geometry,
    classification.body.proportion_directive,
    ...classification.body.focus_areas,
    ...classification.body.silhouette_rules,
  ].join(' ').toLowerCase();
  if (zone === 'midsection' && /(midsection|tummy|stomach|belly|waist)/.test(text)) return 'camouflage';
  if (zone === 'arms' && /(arm|sleeve|shoulder coverage)/.test(text)) return 'camouflage';
  if (zone === 'hips' && /(hip|pear|lower body)/.test(text)) return 'camouflage';
  if (zone === 'thighs' && /(thigh|leg coverage)/.test(text)) return 'camouflage';
  if (zone === 'face' || zone === 'neck') return 'feature';
  return 'neutral';
}

function hardVetoesFromSubmission(submission: StylistIntakeSubmission, classification: StylistBlueprintClassification) {
  const textParts = [
    ...classification.taste.anti_codes,
    ...classification.colour.avoid_colours,
    textFromUnknown(submission.piece_preferences),
    textFromUnknown(submission.coverage_requirements),
    submission.raw_consultation_notes ?? '',
  ];
  const vetoes = new Set<string>();
  for (const part of textParts) {
    const lower = part.toLowerCase();
    const noMatches = lower.match(/\b(?:no|avoid|hate|dislike|not comfortable with)\s+([a-z -]{3,32})/g) ?? [];
    for (const match of noMatches) vetoes.add(match.replace(/\b(?:no|avoid|hate|dislike|not comfortable with)\s+/g, '').trim());
  }
  if (/sleeveless.*(?:false|no|avoid)|no sleeveless|avoid sleeveless/i.test(textParts.join(' '))) vetoes.add('sleeveless');
  for (const term of bannedPieceTerms(submission.piece_preferences ?? null)) vetoes.add(term.toLowerCase());
  return [...vetoes].filter(Boolean).slice(0, 30);
}

export function extractStylistClientState(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
): ClientStateModel {
  const classification = reportData.classification;
  const notes = submission.raw_consultation_notes ?? '';
  const focus = classification.body.focus_areas.join(' ').toLowerCase();
  const geometryText = `${classification.body.geometry} ${classification.body.proportion_directive}`.toLowerCase();
  return {
    client_id: submission.id,
    display_name: reportData.client.display_name || classification.client.name || 'Client',
    geometry: {
      silhouette_summary: classification.body.geometry,
      shoulder_to_hip: /shoulder.*wide|inverted/.test(geometryText) ? 'wider_shoulders' : /hip|pear/.test(geometryText) ? 'narrower_shoulders' : 'balanced',
      waist_definition: /defined waist|hourglass/.test(geometryText) ? 'defined' : /straight|rectangle/.test(geometryText) ? 'straight' : /waist|midsection|apple|soft/.test(geometryText) ? 'soft' : 'unknown',
      vertical_line: /petite|short torso/.test(geometryText) ? 'short_torso' : /long torso/.test(geometryText) ? 'long_torso' : 'balanced',
      height_band: /petite/.test(`${focus} ${geometryText}`) ? 'petite' : /tall/.test(`${focus} ${geometryText}`) ? 'tall' : 'average',
      scale: /substantial|broad|strong/.test(geometryText) ? 'substantial' : /fine|delicate/.test(geometryText) ? 'fine' : 'medium',
      zone_map: {
        arms: zoneState('arms', classification),
        midsection: zoneState('midsection', classification),
        hips: zoneState('hips', classification),
        thighs: zoneState('thighs', classification),
        bust: zoneState('bust', classification),
        neck: zoneState('neck', classification),
        face: zoneState('face', classification),
        legs: zoneState('legs', classification),
      },
    },
    colour: {
      undertone: normaliseUndertone(classification.colour.undertone_direction),
      value_depth: normaliseDepth(classification.colour.depth),
      contrast: normaliseContrast(classification.colour.contrast),
      chroma: normaliseChroma(`${classification.colour.palette_name} ${classification.colour.undertone_direction}`),
      palette_name: classification.colour.palette_name,
      base_palette: classification.colour.base_palette,
      accent_palette: classification.colour.accent_palette,
      avoid_colours: classification.colour.avoid_colours,
    },
    aspiration: {
      descriptors: [
        classification.taste.style_archetype,
        reportData.analysis.style_direction,
        ...classification.taste.signature_codes.slice(0, 3),
      ].filter(Boolean),
      context: classification.client.lifestyle_summary || textFromUnknown(submission.lifestyle_context),
      statement: `${classification.taste.style_archetype}; ${classification.client.lifestyle_summary || 'modern real-life dressing'}`,
    },
    preferences: {
      // The stated Western/ethnic mix is a quota, not a permission. Without
      // this the engine produced two kurtas and no sarees for a client who
      // asked for "More Ethnic" and said she loved sarees.
      ethnic_target: ethnicOutfitTarget({
        outfitCount: 20,
        culturalMode: intakeSignalsEthnicPreference(submission) ? 'ethnic_allowed' : 'western_default',
        piecePreferences: submission.piece_preferences ?? null,
      }),
      preferred_ethnic_garments: preferredEthnicGarments(submission.piece_preferences ?? null),
      footwear: parseFootwearPreference(submission.piece_preferences ?? null),
      banned_pieces: bannedPieceTerms(submission.piece_preferences ?? null),
      avoid_light_near_face: dullsInWhite(submission),
    },
    vetoes: {
      hard: hardVetoesFromSubmission(submission, classification),
      modesty: [
        ...classification.body.coverage_rules,
        ...asStringArray(submission.focus_areas).filter(item => /coverage|modest|arm|neck|leg/i.test(item)),
      ],
      soft_preferences: [
        ...classification.taste.signature_codes,
        ...asStringArray(submission.secondary_moodboard_elements),
        submission.one_outfit_description ?? '',
        notes,
      ].filter(Boolean),
    },
    context: {
      country: classification.client.country || submission.country || '',
      climate: /humid|hot|summer|mumbai|india/i.test(`${classification.client.country} ${notes}`) ? 'warm/humid' : 'temperate',
      market: /india/i.test(`${classification.client.country} ${submission.country}`) ? 'India' : 'global',
      capsules: CAPSULES,
    },
    wardrobe_baseline: submission.one_outfit_description || classification.taste.moodboard || 'current wardrobe baseline not explicit',
  };
}

export function deriveFunctionDemands(clientState: ClientStateModel): FunctionDemand[] {
  const zoneMap = clientState.geometry.zone_map;
  return CAPSULES.flatMap((capsule) => Array.from({ length: 5 }, (_, index): FunctionDemand => {
    const baseFunctions: FunctionDemand['functions'] = [
      { function: 'FRAME_FACE', zone: 'face', priority: 10, reason: 'Face should be the first visual subject.' },
      { function: 'ELONGATE', priority: 9, reason: 'Every report outfit needs a clean vertical read.' },
      { function: 'CONTEXT_FIT', priority: 8, reason: `${capsule} capsule must match the room.` },
      { function: capsule === 'Professional' ? 'POLISH' : capsule === 'Occasion' ? 'ELEVATE' : 'HARMONIZE', priority: 8, reason: `Capsule register: ${capsule}.` },
    ];
    if (zoneMap.midsection === 'camouflage') {
      baseFunctions.push({ function: 'DIFFUSE', zone: 'midsection', priority: 10, reason: 'Midsection is a client focus/camouflage zone.' });
    }
    if (zoneMap.hips === 'camouflage' || zoneMap.thighs === 'camouflage') {
      baseFunctions.push({ function: 'BALANCE', zone: 'hips', priority: 8, reason: 'Lower-body balance needs controlled hem volume.' });
    }
    if (index % 2 === 0) {
      baseFunctions.push({ function: 'DEFINE_WAIST', zone: 'midsection', priority: 6, reason: 'Create a waist cue without overexposing the waist zone.' });
    }
    return {
      id: `${capsule.toLowerCase()}-${index + 1}`,
      capsule,
      occasion: capsule,
      functions: baseFunctions,
      aspiration_register: clientState.aspiration.statement,
      hard_constraints: [...clientState.vetoes.hard, ...clientState.vetoes.modesty],
    };
  }));
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '').trim();
  const full = cleaned.length === 3 ? cleaned.split('').map(ch => ch + ch).join('') : cleaned;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return { r: 128, g: 128, b: 128 };
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function temperature(hex: string) {
  const { r, b } = hexToRgb(hex);
  return r - b;
}

function scoreBand(target: string, value: number) {
  if (target === 'light') return 1 - Math.abs(value - 0.72);
  if (target === 'deep') return 1 - Math.abs(value - 0.24);
  if (target === 'high') return value;
  if (target === 'low') return 1 - value;
  // Chroma is a band, not a slope. `1 - value` scored a colourless garment as
  // perfectly muted, so optic white took a full mark on this axis while
  // terracotta — a muted colour she actually asked for — took zero.
  if (target === 'clear') return 1 - Math.abs(value - 0.85);
  if (target === 'muted') return 1 - Math.abs(value - 0.35);
  return 1 - Math.abs(value - 0.5);
}

export function scoreColourPhysics(
  profile: ClientStateModel['colour'],
  colour: { name: string; hex: string },
  zone: 'near_face' | 'away_from_face',
) {
  const valueScore = Math.max(0, scoreBand(profile.value_depth, luminance(colour.hex)));
  const contrastProxy = Math.abs(luminance(colour.hex) - 0.5) * 2;
  const contrastScore = Math.max(0, scoreBand(profile.contrast, contrastProxy));
  const chromaScore = Math.max(0, scoreBand(profile.chroma, saturation(colour.hex)));
  const temp = temperature(colour.hex);
  const temperatureScore = profile.undertone === 'neutral'
    ? 0.8
    : profile.undertone === 'olive'
      ? (temp < 40 ? 0.8 : 0.55)
      : profile.undertone === 'warm'
        ? (temp >= 0 ? 0.9 : 0.45)
        : (temp <= 0 ? 0.9 : 0.45);
  const weights = zone === 'near_face'
    ? { value: 3, contrast: 3, chroma: 2, temperature: 2 }
    : { value: 1, contrast: 2, chroma: 1, temperature: 0.5 };
  const numerator =
    valueScore * weights.value +
    contrastScore * weights.contrast +
    chromaScore * weights.chroma +
    temperatureScore * weights.temperature;
  const denominator = weights.value + weights.contrast + weights.chroma + weights.temperature;
  return Math.round((numerator / denominator) * 100) / 10;
}

function outfitText(outfit: ParsedStylistOutfit) {
  return outfit.fields.map(field => `${field.label} ${field.value}`).join(' ');
}

// --- Coverage enforcement -----------------------------------------------------
// The client's modesty rules were extracted into `vetoes.modesty` and then never
// used to prune anything: only `vetoes.hard` was checked. A client whose intake
// says "use a real sleeve or intentional layer" was still shown sleeveless and
// off-shoulder tops. The image prompt told the model to cover her; the outfit
// itself did not.

/** Tops that leave the shoulders or upper arms bare. */
const BARE_ARM_RE = /sleeveless|off[- ]shoulder|strapless|spaghetti|halter|bandeau|tube top|one[- ]shoulder|racerback|\btank\b|camisole|\bcami\b/i;
/** Layers that actually cover an arm. A sleeveless vest does not. */
const SLEEVED_LAYER_RE = /blazer|jacket|cardigan|duster|overshirt|shirt-jacket|coat|shrug|bolero|kurta|dupatta/i;
const SHORT_HEM_RE = /\bmini\b|above[- ]the[- ]knee|above[- ]knee|\bshorts\b|micro skirt/i;
const SHEER_RE = /sheer|see[- ]through|mesh|organza overlay|unlined/i;
const CLINGY_RE = /bodycon|body[- ]con|second[- ]skin|skin[- ]tight|clingy/i;
const LOW_NECK_RE = /plunging|deep v\b|deep-v|low[- ]cut|keyhole bust/i;

function coverageNeeds(clientState: ClientStateModel) {
  const rules = clientState.vetoes.modesty.join(' ').toLowerCase();
  return {
    arms: /arm coverage|real sleeve/.test(rules),
    legs: /leg coverage|hemlines at or below|short skirt/.test(rules),
    opacity: /opacity|sheer|transparent/.test(rules),
    fit: /bodycon|cling/.test(rules),
    neckline: /neckline coverage|cleavage/.test(rules),
  };
}

/** The coverage rule a set of pieces breaks, or null when it is acceptable. */
export function coverageViolationForTest(items: FormulaItem[], clientState: ClientStateModel) {
  return coverageViolation(items, clientState);
}

/** Exposes the chroma/value banding so a regression in it is visible directly. */
export function scoreBandForTest(target: string, value: number) {
  return scoreBand(target, value);
}

/** Exposes per-slot colour resolution, including the material and white guards. */
export function colourForSlotForTest(
  slot: ParsedStylistOutfitSlot,
  clientState: ClientStateModel,
  index: number,
  role: BlueprintColourUse['role'],
) {
  return colourForSlot(slot, clientState, index, role);
}

/** Exposes the colour-prefixing rule applied to every library description. */
export function pieceWithColourForTest(piece: string, colourName: string) {
  return pieceWithColour(piece, colourName);
}

/** Exposes the garment-name trim used to build outfit copy. */
export function shortGarmentForTest(piece: string) {
  return shortGarment(piece);
}

function coverageViolation(items: FormulaItem[], clientState: ClientStateModel): string | null {
  const needs = coverageNeeds(clientState);
  const text = items.map(item => `${item.slot} ${item.piece}`).join(' ');

  if (needs.arms) {
    const bareTop = items.some(item => /top|dress|blouse|base/i.test(item.slot) && BARE_ARM_RE.test(item.piece));
    const sleevedLayer = items.some(item =>
      /layer|outerwear|jacket/i.test(item.slot) && SLEEVED_LAYER_RE.test(item.piece) && !BARE_ARM_RE.test(item.piece));
    if (bareTop && !sleevedLayer) return 'leaves the arms or shoulders bare';
  }
  if (needs.legs && SHORT_HEM_RE.test(text)) return 'sits above the knee';
  if (needs.opacity && SHEER_RE.test(text)) return 'is sheer';
  if (needs.fit && CLINGY_RE.test(text)) return 'is cut close through the body';
  if (needs.neckline && LOW_NECK_RE.test(text)) return 'has a neckline she asked us to avoid';
  return null;
}

function candidateText(candidate: Pick<CandidateOutfit, 'formula_items' | 'generation_reasoning'>) {
  return `${candidate.formula_items.map(item => `${item.slot} ${item.piece}`).join(' ')} ${candidate.generation_reasoning}`;
}

function hasHardVeto(text: string, vetoes: string[]) {
  const lower = text.toLowerCase();
  return vetoes.find(veto => veto.length > 2 && lower.includes(veto.toLowerCase()));
}

function colourAt(clientState: ClientStateModel, index: number, role: BlueprintColourUse['role']) {
  const palette = role === 'accent' ? clientState.colour.accent_palette : clientState.colour.base_palette;
  const source = palette[index % Math.max(1, palette.length)] ?? NEUTRAL_COLOURS[index % NEUTRAL_COLOURS.length];
  return {
    name: source.name || NEUTRAL_COLOURS[index % NEUTRAL_COLOURS.length].name,
    hex: source.hex || NEUTRAL_COLOURS[index % NEUTRAL_COLOURS.length].hex,
    role,
  };
}

function fallbackSlots(capsule: FunctionDemand['capsule']): ParsedStylistOutfitSlot[] {
  const top = capsule === 'Professional' ? 'structured crepe blouse' : capsule === 'Everyday' ? 'polished cotton shirt' : 'draped satin blouse';
  return [
    { slot: 'Top', piece: top, source_label: 'Top', role: 'base' },
    { slot: 'Bottom', piece: 'full-length tailored wide-leg trousers', source_label: 'Bottom', role: 'base' },
    { slot: 'Outerwear', piece: 'open structured blazer', source_label: 'Outerwear', role: 'structure' },
    { slot: 'Footwear', piece: 'pointed leather flats', source_label: 'Footwear', role: 'finish' },
    { slot: 'Bag', piece: 'structured leather top-handle bag', source_label: 'Bag', role: 'finish' },
    { slot: 'Jewellery', piece: 'small polished metal hoops', source_label: 'Jewellery', role: 'finish' },
  ];
}

/**
 * The colour a garment should actually be.
 *
 * This used to be `palette[index % palette.length]` — array position, nothing
 * else — so a curated look kept its shapes but lost every colour relationship
 * that made it worth curating. A "Mocha satin-silk saree" was tagged Berry Wine
 * because of where it happened to sit in a loop.
 *
 * Now the look's own colour is kept whenever it suits the client, and only a
 * colour that genuinely fails her is moved onto her palette — within its own
 * family, so an ice blue becomes a different blue rather than a beige.
 */
function colourForSlot(
  slot: ParsedStylistOutfitSlot,
  clientState: ClientStateModel,
  index: number,
  role: BlueprintColourUse['role'],
) {
  const written = colourFromPieceText(slot.piece);
  if (!written) {
    // The piece names no colour, so there is nothing to preserve.
    const fallback = role === 'ground'
      ? NEUTRAL_COLOURS[(index + 1) % NEUTRAL_COLOURS.length]
      : colourAt(clientState, index + (role === 'support' ? 3 : role === 'accent' ? 6 : 0), role);
    return { ...fallback, role, piece: slot.piece };
  }

  if (MATERIAL_COLOUR_RE.test(written.name)) return { ...written, role, piece: slot.piece };

  const nearFace = NEAR_FACE_SLOT_RE.test(slot.slot);
  const fit = scoreColourPhysics(clientState.colour, written, nearFace ? 'near_face' : 'away_from_face');
  // A stated fact about her colouring outranks the physics model. The intake
  // asks what white clothing does to her face; when she answers "makes me
  // dull", a library look's ivory blouse is wrong however well it scores — and
  // it scores well, because an achromatic colour tops both the contrast and the
  // muted-chroma axes.
  const dullsHer = nearFace
    && clientState.preferences.avoid_light_near_face
    && readsAsWhite(written.hex)
    && !WHITE_PRINT_RE.test(slot.piece);
  if (!dullsHer && fit >= COLOUR_KEEP_THRESHOLD) return { ...written, role, piece: slot.piece };

  const full = role === 'accent' ? clientState.colour.accent_palette : clientState.colour.base_palette;
  // When the reason for moving the colour is that white drains her, the
  // replacement cannot be another off-white — her own palette carries two.
  const replacement = dullsHer
    ? nearFaceReplacement(clientState, full, index)
    : snapColourToPalette(written.hex, full, colourFamilyOfHex(written.hex));
  if (!replacement) return { ...written, role, piece: slot.piece };
  return {
    name: replacement.name,
    hex: replacement.hex,
    role,
    piece: recolourPiece(slot.piece, written.name, replacement.name),
  };
}

/** Slots worn against the face, where undertone matters most. */
const NEAR_FACE_SLOT_RE = /top|dress|layer|outerwear|jewel|scarf|neck|blouse/i;

/**
 * How well a colour must suit the client before we leave it alone, on the 0-10
 * scale `scoreColourPhysics` returns. Set low deliberately: the point is to
 * correct colours that fight her colouring, not to relitigate every choice a
 * stylist already made.
 *
 * This was 0.45, written as though the score were a 0-1 fraction. Nothing in
 * the RGB space scores below 2.3, so the comparison was always true, the snap
 * below never ran, and every library colour passed through untouched.
 */
const COLOUR_KEEP_THRESHOLD = 4.5;

/**
 * Metals and pearl are materials, not colours to be corrected: a gold hoop is
 * gold. Scored as colours they lose to whatever fabric shade suits her best,
 * which turns "Gold temple jhumkas" into "Saffron temple jhumkas" and leaves
 * the rest of the line — "slim gold bracelet" — contradicting it.
 */
const MATERIAL_COLOUR_RE = /^(?:gold|silver|bronze|copper|brass|gunmetal|rose gold|metallic|pearl|tortoiseshell)$/i;

/**
 * Light enough to bounce against the skin, with too little colour in it to read
 * as a pale version of something else — an ivory, cream, champagne or optic
 * white rather than a powder blue.
 */
function readsAsWhite(hex: string) {
  return luminance(hex) >= 0.8 && saturation(hex) <= 0.35;
}

/** A two-colour print is not a white garment worn against the face. */
const WHITE_PRINT_RE = /\b(?:ivory|white|cream|ecru|champagne|pearl|bone|chalk|oatmeal|optic)\s*(?:-and-|\/|\s+and\s+)/i;

/**
 * A near-face colour to wear instead of one that drains her, best fit first and
 * rotated so the set stays varied.
 *
 * Two rules that look natural here are both wrong. Nearest-hex snapping has
 * nothing to preserve — the written colour is being rejected — and it collapsed
 * every off-white onto the one neutral closest to white, printing the same
 * taupe as the lead colour in seven of twenty outfits. Capping the pool to the
 * best-scoring few does the same thing more slowly. Every entry here is from
 * her own analysed palette and clears COLOUR_KEEP_THRESHOLD, so the whole
 * non-white palette is eligible.
 */
function nearFaceReplacement(
  clientState: ClientStateModel,
  palette: Array<{ name: string; hex: string }>,
  index: number,
) {
  const ranked = palette
    .filter(entry => !readsAsWhite(entry.hex))
    .map(entry => ({ entry, fit: scoreColourPhysics(clientState.colour, entry, 'near_face') }))
    .sort((a, b) => b.fit - a.fit);
  return ranked.length ? ranked[index % ranked.length].entry : undefined;
}

/**
 * Rewrites the colour word a garment already names so its text and its swatch
 * agree. Moving the swatch alone reproduces the contradiction this engine was
 * built to remove: an "Ivory tussar silk saree" labelled Mushroom Taupe.
 */
function recolourPiece(piece: string, writtenName: string, nextName: string) {
  const words = writtenName.trim().split(/\s+/).map(word => word.replace(/[^a-z]/gi, ''));
  if (!words.length || words.some(word => !word)) return piece;
  const pattern = new RegExp(`\\b${words.join('[\\s-]+')}\\b`, 'i');
  const match = piece.match(pattern);
  if (!match) return piece;
  // Keep the sentence shape: a colour named mid-description stays lower case.
  return piece.replace(pattern, /^[A-Z]/.test(match[0]) ? nextName : nextName.toLowerCase());
}

function slotToFormulaItem(
  slot: ParsedStylistOutfitSlot,
  clientState: ClientStateModel,
  index: number,
  demand: FunctionDemand,
): FormulaItem | null {
  const rawSlot = slot.slot;
  if (/hairstyle|formula|styling line|statement/i.test(rawSlot)) return null;
  const role: BlueprintColourUse['role'] = /bag|footwear|shoe/.test(rawSlot.toLowerCase())
    ? 'ground'
    : /jewel|accessor|belt|scarf|waist/.test(rawSlot.toLowerCase())
      ? 'accent'
      : /bottom|outerwear|layer/.test(rawSlot.toLowerCase())
        ? 'support'
        : 'lead';
  const colour = colourForSlot(slot, clientState, index, role);
  const basePiece = /footwear|shoe/i.test(rawSlot)
    ? applyFootwearPreference(colour.piece, clientState.preferences.footwear)
    : colour.piece;
  const piece = pieceWithColour(basePiece, colour.name);
  return {
    slot: rawSlot === 'Outerwear' ? 'Layer' : rawSlot,
    piece,
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: role,
    structural_notes: structuralNoteForSlot(rawSlot, demand),
  };
}

/**
 * Library pieces almost always name their own colour ("Mocha satin-silk saree",
 * "Slim chocolate leather belt"). Prefixing the palette colour on top produced
 * "Berry Wine Mocha satin-silk saree" and "Turquoise Slim chocolate leather
 * belt", so only add a colour when the piece does not already carry one
 * anywhere in its opening words.
 */
function pieceWithColour(piece: string, colourName: string) {
  const text = piece.replace(/\s+/g, ' ').trim();
  if (!colourName || !text) return text;
  // The lexicon below cannot be relied on to cover every palette name: a
  // two-word colour whose words are both missing from it was prepended to a
  // description that already opened with it, printing "Burnt Sienna Burnt
  // Sienna tussar silk saree" on the page.
  if (text.toLowerCase().startsWith(`${colourName.toLowerCase()} `)) return text;
  const opening = text.toLowerCase().split(' ').slice(0, 5).join(' ');
  if (COLOUR_WORDS.some(word => new RegExp(`\\b${word}\\b`).test(opening))) return text;
  return `${colourName} ${text}`.replace(/\s+/g, ' ').trim();
}

/**
 * Colour words that appear at the head of library piece descriptions. Kept as a
 * lexicon rather than a leading-anchor pattern because the colour is often the
 * second or third word ("Slim chocolate leather belt").
 */
const COLOUR_WORDS = [
  'ivory', 'white', 'optic', 'ecru', 'oatmeal', 'cream', 'bone', 'chalk',
  'black', 'ink', 'charcoal', 'graphite', 'grey', 'gray', 'slate', 'gunmetal', 'silver',
  'stone', 'beige', 'taupe', 'sand', 'biscuit', 'khaki', 'mushroom',
  'tan', 'cognac', 'camel', 'caramel', 'toffee', 'chocolate', 'cocoa', 'mocha', 'coffee',
  'espresso', 'brown', 'chestnut', 'mahogany', 'russet', 'rust', 'terracotta', 'clay', 'orange', 'sienna', 'burnt',
  'navy', 'blue', 'indigo', 'cobalt', 'denim', 'powder', 'sky', 'teal', 'turquoise', 'aqua',
  'emerald', 'jade', 'olive', 'moss', 'forest', 'sage', 'mint', 'green', 'pistachio',
  'burgundy', 'wine', 'claret', 'oxblood', 'maroon', 'plum', 'aubergine', 'berry',
  'ruby', 'crimson', 'red', 'scarlet', 'magenta', 'fuchsia', 'pink', 'blush', 'rose', 'coral', 'peach',
  'lilac', 'lavender', 'violet', 'purple', 'mauve',
  'gold', 'bronze', 'copper', 'champagne', 'nude', 'saffron', 'mustard', 'ochre', 'amber', 'yellow',
  'tortoiseshell', 'pearl', 'metallic', 'tonal', 'monochrome',
  'deep', 'light', 'dark', 'soft', 'pale', 'mid', 'warm', 'cool', 'muted', 'bright',
];

/**
 * Rewrites a flat shoe into the heel the client asked for, and states the
 * height. Library anchors are mostly flats, so without this a client who asked
 * for a 1.2-2 inch heel is given loafers whatever she wrote on the form.
 */
function applyFootwearPreference(piece: string, preference: FootwearPreference) {
  if (!preference.heelPreferred) return piece;
  if (/heel|pump|slingback|court shoe/i.test(piece)) {
    if (!preference.statedHeel || new RegExp(escapeForRegExp(preference.statedHeel), 'i').test(piece)) return piece;
    // Library pieces usually end in a full stop, so append inside the sentence
    // rather than after it: "court shoes. on a 1.2-2 inch heel" reads as a typo.
    const trimmed = piece.replace(/\s*\.\s*$/, '');
    return `${trimmed} on a ${heelHeightPhrase(preference)} heel`;
  }
  if (/sneaker|trainer/i.test(piece) && preference.sneakersWelcome) return piece;
  const kind = /sandal/i.test(piece) ? 'block-heel sandals'
    : /boot/i.test(piece) ? 'ankle boots'
      : /loafer|flat|mule|slide|ballet|sneaker|trainer/i.test(piece) ? 'block-heel court shoes'
        : 'block-heel court shoes';
  return `${heelHeightPhrase(preference)} ${kind}`;
}

function heelHeightPhrase(preference: FootwearPreference) {
  const stated = preference.statedHeel.trim();
  if (!stated) return 'low';
  return /heel/i.test(stated) ? stated.replace(/\s*heel\s*$/i, '').trim() : stated;
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Why this piece is in the outfit, written for the client. It used to splice the
 * raw function codes into the sentence — "supports FRAME_FACE, ELONGATE, POLISH
 * without breaking client guardrails" — which is our vocabulary, not hers.
 */
function structuralNoteForSlot(slot: string, demand: FunctionDemand) {
  if (/top|dress|base|outerwear|layer/i.test(slot)) {
    const purpose = demand.functions
      .map(item => FUNCTION_IN_PLAIN_ENGLISH[item.function])
      .filter(Boolean)
      .slice(0, 2)
      .join(', and ');
    return purpose
      ? `Worn near your face, where it ${purpose}.`
      : 'Worn near your face, where the colour does the most work.';
  }
  if (/bottom/i.test(slot)) return 'Keeps the lower line clean and long.';
  if (/footwear/i.test(slot)) return 'Grounds the outfit, and is a shoe you can actually buy and walk in.';
  if (/bag|jewel|accessor|waist/i.test(slot)) return 'Finishes the outfit without pulling attention off your face.';
  return 'Earns its place in the outfit and is easy to find in a shop.';
}

/** The stylist's own note on how the anchor look is worn, if there is one. */
function stylingNoteOf(outfit: ParsedStylistOutfit | undefined) {
  const slot = outfit?.normalised_slots.find(item => /styling line/i.test(item.slot));
  const note = (slot?.piece ?? '').trim();
  if (!note) return undefined;
  const sentence = note.charAt(0).toUpperCase() + note.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function libraryRef(outfit: ParsedStylistOutfit, capsule: FunctionDemand['capsule']): BlueprintLibraryRef {
  return {
    id: outfit.id,
    title: outfit.title,
    source: outfit.source,
    capsule: outfit.capsule,
    adaptation: `Read-only science anchor for ${capsule}: preserve the skeleton, relationship, and finish; adapt only colour, coverage, fabric, formality, and fit.`,
  };
}

function techniquesForDemand(clientState: ClientStateModel, demand: FunctionDemand, index: number) {
  const demanded = new Set(demand.functions.map(item => item.function));
  const selected = TECHNIQUE_GRAMMAR
    .filter(technique => technique.functions.some(fn => demanded.has(fn)))
    .slice(index % 3, index % 3 + 4);
  const techniques = selected.length ? selected : TECHNIQUE_GRAMMAR.slice(0, 4);
  return techniques.map(technique => ({
    id: technique.id,
    name: technique.name,
    functions: technique.functions,
    enablers_used: technique.enablers.filter(enabler => {
      if (clientState.geometry.zone_map.midsection === 'camouflage') return /layer|contrast|front|drape|tonal/i.test(enabler);
      return /vertical|metal|texture|full/i.test(enabler);
    }).slice(0, 2),
  }));
}

/** The report cannot render an outfit page with fewer pieces than this. */
/** One-piece garments cannot be tucked, layered over, or hem-balanced. */
const ONE_PIECE_RE = /saree|sari\b|dress|jumpsuit|romper|playsuit|gown|anarkali|kaftan|caftan/i;

/**
 * Whether a formula item is already the whole outfit, shoulder to hem.
 *
 * The slot label alone is not enough. A board pin that wrote "—" for its bottom
 * left a jumpsuit sitting in a slot labelled Top, so the bottom check below saw
 * no bottom and bolted a pair of tailored trousers onto it — an outfit nobody
 * can wear and the image generator cannot draw.
 */
function isOnePieceItem(item: FormulaItem) {
  return ONE_PIECE_RE.test(`${item.slot} ${item.piece}`);
}

const MIN_FORMULA_ITEMS = 4;

/** Below this, a capsule borrows anchors from the rest of the library. */
const MIN_CAPSULE_ANCHOR_POOL = 6;
/** Same idea for the ethnic pool, which is smaller by nature. */
const MIN_ETHNIC_CAPSULE_POOL = 3;

// Sample garment structures across the entire eligible library, rather than
// taking the first rows (which can all be variations of the same blazer).
function diverseAnchorPool(pool: ParsedStylistOutfit[], limit = 30) {
  const buckets = new Map<string, ParsedStylistOutfit[]>();
  for (const outfit of pool) {
    const key = outfit.normalised_slots.filter(slot => /top|bottom|dress|outfit|layer|outerwear/i.test(slot.slot))
      .map(slot => `${slot.slot.toLowerCase()}:${outfitGarmentFamily(slot.piece)}`).sort().join('|');
    const bucket = buckets.get(key) ?? [];
    bucket.push(outfit);
    buckets.set(key, bucket);
  }
  const result: ParsedStylistOutfit[] = [];
  for (let index = 0; result.length < limit; index++) {
    let added = false;
    for (const bucket of buckets.values()) {
      if (!bucket[index]) continue;
      result.push(bucket[index]); added = true;
      if (result.length === limit) break;
    }
    if (!added) break;
  }
  return result;
}

export function generateOutfitCandidates(
  clientState: ClientStateModel,
  demands: FunctionDemand[],
  readOnlyLibrary: ParsedStylistOutfit[],
): CandidateOutfit[] {
  const library = readOnlyLibrary.filter(isUsableStylistOutfitAnchor);
  const candidates: CandidateOutfit[] = [];
  const wantsEthnic = clientState.preferences.ethnic_target > 0;
  // When the client asked for ethnic wear the pool needs ethnic candidates to
  // pick from, so the last variant of every demand is seeded from an ethnic
  // anchor. Selection then enforces the actual quota.
  const preferred = clientState.preferences.preferred_ethnic_garments;
  const allEthnic = library.filter(outfit => ETHNIC_GARMENT_RE.test(outfitText(outfit)));
  // Seed from the garments she named where the library has them, so "I love
  // sarees" does not lose to a kurta simply because there are more kurtas.
  const namedEthnic = allEthnic.filter(outfit => matchesPreferredGarment(outfitText(outfit), preferred));
  const ethnicLibrary = namedEthnic.length >= 4 ? namedEthnic : allEthnic;
  const variantCount = wantsEthnic && ethnicLibrary.length ? 7 : 6;
  for (const [demandIndex, demand] of demands.entries()) {
    // Draw from this capsule first. The old rule let every second demand pull
    // from the whole library, which is how a banarasi wedding saree ended up
    // seeding an everyday look and an office linen saree seeded an occasion one.
    // Cross-capsule borrowing is now a fallback for a genuinely thin pool.
    const inCapsule = library
      .filter(outfit => outfitCapsules(outfit).includes(demand.capsule))
      .filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard));
    const anchors = (inCapsule.length >= MIN_CAPSULE_ANCHOR_POOL
      ? inCapsule
      : [...inCapsule, ...library
        .filter(outfit => !outfitCapsules(outfit).includes(demand.capsule))
        .filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard))]);
    const sourceAnchors = diverseAnchorPool(anchors.length ? anchors : library.filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard)));
    // Ethnic anchors are chosen within the capsule too. Without this the forced
    // ethnic variant drew from the whole ethnic pool, so a wedding banarasi
    // could seed an everyday look and an office linen saree an occasion one.
    const ethnicPool = ethnicLibrary.filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard));
    const ethnicInCapsule = ethnicPool.filter(outfit => outfitCapsules(outfit).includes(demand.capsule));
    const ethnicAnchors = diverseAnchorPool(ethnicInCapsule.length >= MIN_ETHNIC_CAPSULE_POOL ? ethnicInCapsule : ethnicPool);
    for (let variant = 0; variant < variantCount; variant++) {
      const forceEthnic = wantsEthnic && ethnicAnchors.length > 0 && variant === variantCount - 1;
      const pool = forceEthnic ? ethnicAnchors : sourceAnchors;
      const anchor = pool[(demandIndex * 6 + variant) % Math.max(1, pool.length)];
      const slots = anchor?.normalised_slots?.length ? anchor.normalised_slots : fallbackSlots(demand.capsule);
      const formulaItems = slots
        .map(slot => slotToFormulaItem(slot, clientState, demandIndex * variantCount + variant, demand))
        .filter((item): item is FormulaItem => Boolean(item))
        .slice(0, 8);
      if (!formulaItems.some(item => /top|dress|base|outfit/i.test(item.slot) || isOnePieceItem(item))) {
        formulaItems.unshift(slotToFormulaItem(fallbackSlots(demand.capsule)[0], clientState, demandIndex * variantCount + variant, demand)!);
      }
      if (!formulaItems.some(item => /bottom|dress|outfit/i.test(item.slot) || isOnePieceItem(item))) {
        formulaItems.splice(1, 0, slotToFormulaItem(fallbackSlots(demand.capsule)[1], clientState, demandIndex * variantCount + variant, demand)!);
      }
      if (!formulaItems.some(item => /footwear|shoe/i.test(item.slot))) {
        formulaItems.push(slotToFormulaItem(fallbackSlots(demand.capsule)[3], clientState, demandIndex * variantCount + variant, demand)!);
      }
      if (!formulaItems.some(item => /bag|jewel|accessor/i.test(item.slot))) {
        formulaItems.push(slotToFormulaItem(fallbackSlots(demand.capsule)[4], clientState, demandIndex * variantCount + variant, demand)!);
      }
      // A one-piece look satisfies both the top and the bottom check, so a
      // dress plus shoes plus a bag is only three items — below the four the
      // report needs to render an outfit page. Top up from the unused slots.
      for (const slot of fallbackSlots(demand.capsule)) {
        if (formulaItems.length >= MIN_FORMULA_ITEMS) break;
        if (formulaItems.some(item => item.slot.toLowerCase() === slot.slot.toLowerCase())) continue;
        // A one-piece garment already is the top and the bottom. Top it up with
        // a layer or a finishing piece, never with a shirt under a dress.
        const isOnePiece = formulaItems.some(item => /outfit/i.test(item.slot) || isOnePieceItem(item));
        if (isOnePiece && /^(top|bottom|base layer)$/i.test(slot.slot)) continue;
        const filled = slotToFormulaItem(slot, clientState, demandIndex * variantCount + variant, demand);
        if (filled) formulaItems.push(filled);
      }
      const text = formulaItems.map(item => `${item.slot} ${item.piece}`).join(' ');
      const failedVeto = hasHardVeto(text, clientState.vetoes.hard);
      if (failedVeto) continue;
      // Coverage is a stated requirement, not a preference to score against.
      if (coverageViolation(formulaItems, clientState)) continue;
      const techniques = techniquesForDemand(clientState, demand, demandIndex + variant);
      const colourScores = formulaItems.map(item => {
        const nearFace = /top|dress|layer|outerwear|jewel|scarf|neck/i.test(item.slot);
        return {
          slot: item.slot,
          colour: item.colour_name,
          zone: nearFace ? 'near_face' as const : 'away_from_face' as const,
          score: scoreColourPhysics(clientState.colour, { name: item.colour_name, hex: item.colour_hex }, nearFace ? 'near_face' : 'away_from_face'),
        };
      });
      candidates.push({
        is_ethnic: ETHNIC_GARMENT_RE.test(text),
        styling_note: stylingNoteOf(anchor),
        id: `${demand.id}-candidate-${variant + 1}`,
        demand_id: demand.id,
        capsule: demand.capsule,
        library_ref: anchor ? libraryRef(anchor, demand.capsule) : undefined,
        library_signature: anchor?.signature,
        formula_items: formulaItems,
        techniques,
        attention_map: {
          first_fixation: 'face',
          second_fixation: demand.functions.some(item => item.function === 'BALANCE') ? 'hem' : 'waist',
          risk_zones: Object.entries(clientState.geometry.zone_map)
            .filter(([, state]) => state === 'camouflage')
            .map(([zone]) => zone as BodyZone),
        },
        colour_scores: colourScores,
        veto_checks: clientState.vetoes.hard.map(veto => ({ veto, passed: !text.toLowerCase().includes(veto.toLowerCase()), reason: 'Hard veto is pruned before scoring.' })),
        sourcing_assumptions: ['Normal retail garment names only', `Market: ${clientState.context.market}`, 'Library anchor is read-only'],
        generation_reasoning: `Demand ${demand.id}: ${demand.functions.map(item => item.function).join(', ')} via ${techniques.map(item => item.name).join(', ')}.`,
      });
    }
  }
  return candidates;
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean).map(value => value.toLowerCase())).size;
}

/**
 * How much human judgement went into an anchor.
 *
 * The blind scorer only ever asked whether an anchor existed, never which
 * source it came from — so a look a stylist described garment by garment scored
 * exactly the same as a templated library entry. Kept deliberately small: it
 * breaks ties in favour of the better-provenance look without overriding
 * realism, coverage or colour fit.
 */
function anchorProvenanceBonus(candidate: CandidateOutfit) {
  switch (candidate.library_ref?.source) {
    case 'pinterest': return 1.5;
    case 'learned': return 1.2;
    case 'women': return 0.6;
    case 'curated': return 0.4;
    default: return 0;
  }
}

export function scoreOutfitCandidatesBlind(
  clientState: ClientStateModel,
  candidates: CandidateOutfit[],
): ScoredCandidateOutfit[] {
  return candidates.map((candidate): ScoredCandidateOutfit => {
    const text = candidateText(candidate);
    const veto = hasHardVeto(text, clientState.vetoes.hard);
    const hasBase = candidate.formula_items.some(item => /top|dress|outfit|base/i.test(item.slot)) &&
      candidate.formula_items.some(item => /bottom|dress|outfit/i.test(item.slot));
    const hasFinish = candidate.formula_items.some(item => /footwear|shoe/i.test(item.slot)) &&
      candidate.formula_items.some(item => /bag|jewel|accessor/i.test(item.slot));
    const averageColour = candidate.colour_scores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, candidate.colour_scores.length);
    const techniqueScore = Math.min(10, 5 + candidate.techniques.length + candidate.techniques.reduce((sum, item) => sum + item.enablers_used.length * 0.25, 0));
    const realism = Math.min(10, (hasBase ? 3 : 0) + (hasFinish ? 3 : 0) + Math.min(2, candidate.formula_items.length / 3) + (candidate.library_ref ? 2 : 1));
    const relevance = Math.min(10, 5 + (candidate.capsule === 'Professional' ? 1 : 0) + averageColour * 0.25 + (veto ? -6 : 0));
    const iconik = Math.min(10, 3 + techniqueScore * 0.5 + uniqueCount(candidate.techniques.flatMap(item => item.functions)) * 0.35 + (candidate.library_ref ? 1 : 0) + anchorProvenanceBonus(candidate));
    const diversity = Math.min(10, 4 + uniqueCount(candidate.formula_items.map(item => item.slot)) * 0.55 + uniqueCount(candidate.formula_items.map(item => item.colour_name)) * 0.4);
    const killFlags: OutfitScore['kill_flags'] = [];
    if (veto) killFlags.push('VETO');
    if (realism < 6) killFlags.push('REALISM');
    if (relevance < 6) killFlags.push('RELEVANCE');
    if (iconik < 6) killFlags.push('ICONIK');
    return {
      ...candidate,
      score: {
        candidate_id: candidate.id,
        realism: Math.round(realism * 10) / 10,
        relevance: Math.round(relevance * 10) / 10,
        iconik: Math.round(iconik * 10) / 10,
        diversity: Math.round(diversity * 10) / 10,
        killed: killFlags.length > 0,
        kill_flags: killFlags,
        rationale: `Blind score uses formula completeness, colour physics, capsule relevance, and technique coverage; generator reasoning is not used as persuasion.`,
      },
    };
  });
}

function leadColourOf(candidate: ScoredCandidateOutfit) {
  const lead = candidate.formula_items.find(item => item.palette_role === 'lead') ?? candidate.formula_items[0];
  return {
    name: (lead?.colour_name ?? 'unknown').toLowerCase(),
    family: lead?.colour_hex ? colourFamilyOfHex(lead.colour_hex) : 'neutral',
  };
}

/** Comparable garment families, independent of adjectives used by different anchors. */
export function outfitGarmentFamily(piece: string) {
  const text = piece.toLowerCase();
  const families: Array<[RegExp, string]> = [
    [/blazer/, 'blazer'], [/cardigan/, 'cardigan'], [/overshirt|shacket/, 'overshirt'],
    [/waistcoat|vest/, 'vest'], [/jacket/, 'jacket'], [/coat|duster/, 'coat'],
    [/dupatta/, 'dupatta'], [/saree|sari/, 'saree'], [/kurta|kurti/, 'kurta'],
    [/jumpsuit/, 'jumpsuit'], [/dress/, 'dress'], [/jeans|denim/, 'jeans'],
    [/trouser|pant/, 'trousers'], [/skirt/, 'skirt'], [/blouse/, 'blouse'],
    [/tee|t-shirt/, 'tee'], [/shirt/, 'shirt'], [/knit|sweater/, 'knit'],
    [/tank|camisole/, 'tank'],
  ];
  return families.find(([pattern]) => pattern.test(text))?.[1] ?? text.replace(/[^a-z ]/g, '').trim();
}

function garmentColourFamily(item: FormulaItem) {
  // These names describe essentially the same visible neutral layer.
  if (/camel|beige|oatmeal|taupe|tan|sand|ecru/i.test(item.colour_name)) return 'warm-neutral';
  return colourFamilyOfHex(item.colour_hex);
}

function visibleGarments(candidate: ScoredCandidateOutfit) {
  return candidate.formula_items.filter(item => /top|bottom|dress|outfit|layer|outerwear/i.test(item.slot))
    .map(item => ({
      kind: outfitGarmentFamily(item.piece),
      colour: garmentColourFamily(item),
      layer: /layer|outerwear/i.test(item.slot),
    }));
}

function repetitionPenalty(candidate: ScoredCandidateOutfit, selected: ScoredCandidateOutfit[]) {
  const lead = leadColourOf(candidate);
  const garments = visibleGarments(candidate);
  let penalty = 0;
  for (const previous of selected) {
    const sameCapsule = previous.capsule === candidate.capsule;
    const previousLead = leadColourOf(previous);
    penalty += previousLead.name === lead.name ? 2 : previousLead.family === lead.family ? 0.6 : 0;
    for (const garment of garments) {
      const match = visibleGarments(previous).find(item => item.kind === garment.kind && item.layer === garment.layer);
      if (!match) continue;
      // A different shirt does not make the same camel blazer a new look.
      penalty += garment.layer
        ? (match.colour === garment.colour ? 24 : 8) * (sameCapsule ? 1 : 0.3)
        : (match.colour === garment.colour ? 4 : 1) * (sameCapsule ? 1 : 0.2);
    }
  }
  return penalty;
}

export function selectOutfitPortfolio(
  scoredCandidates: ScoredCandidateOutfit[],
  constraints: { count: number; perCapsule?: number; ethnicTarget?: number; preferredGarments?: string[] },
): ScoredCandidateOutfit[] {
  const survivors = scoredCandidates.filter(candidate => !candidate.score.killed);
  const selected: ScoredCandidateOutfit[] = [];
  const usedSignatures = new Set<string>();
  const perCapsule = constraints.perCapsule ?? constraints.count / CAPSULES.length;
  const ethnicQuota = ethnicCountsByCapsule(constraints.ethnicTarget ?? 0, perCapsule);
  const preferredGarments = constraints.preferredGarments ?? [];
  const unused = (candidate: ScoredCandidateOutfit, allowSignatureRepeat = false) =>
    !selected.some(item => item.id === candidate.id)
    && (allowSignatureRepeat || !candidate.library_signature || !usedSignatures.has(candidate.library_signature));
  const takeBest = (pool: ScoredCandidateOutfit[], preferNamed = false, allowSignatureRepeat = false) => {
    // Re-rank after EACH pick so every previous selection changes the next one.
    const score = (candidate: ScoredCandidateOutfit) => {
        const named = preferNamed && matchesPreferredGarment(candidate.formula_items.map(item => item.piece).join(' '), preferredGarments);
        return candidate.score.iconik * 1.5 + candidate.score.realism + candidate.score.relevance + candidate.score.diversity
          + (named ? 12 : 0) - repetitionPenalty(candidate, selected);
    };
    const ranked = pool.filter(candidate => unused(candidate, allowSignatureRepeat))
      .map(candidate => ({ candidate, score: score(candidate) })).sort((a, b) => b.score - a.score);
    if (!ranked.length) return false;
    const best = ranked[0].candidate;
    selected.push(best);
    if (best.library_signature) usedSignatures.add(best.library_signature);
    return true;
  };
  // Reserve the requested ethnic mix first, while applying the same diversity rules.
  for (const capsule of ETHNIC_CAPSULE_PRIORITY) {
    for (let n = 0; n < (ethnicQuota[capsule] ?? 0); n++) {
      if (!takeBest(survivors.filter(item => item.capsule === capsule && item.is_ethnic), true)) break;
    }
  }
  for (const capsule of CAPSULES) {
    const pool = survivors.filter(item => item.capsule === capsule);
    while (selected.filter(item => item.capsule === capsule).length < perCapsule) {
      const ethnicTaken = selected.filter(item => item.capsule === capsule && item.is_ethnic).length;
      const preferred = pool.filter(item => !item.is_ethnic || ethnicTaken < (ethnicQuota[capsule] ?? 0));
      if (!takeBest(preferred) && !takeBest(pool)) break;
    }
  }
  while (selected.length < constraints.count && takeBest(survivors)) { /* fill thin capsules */ }
  while (selected.length < constraints.count && takeBest(survivors, false, true)) { /* thin-library fallback */ }
  return selected.slice(0, constraints.count).sort((a, b) => CAPSULES.indexOf(a.capsule) - CAPSULES.indexOf(b.capsule));
}

// --- Client-facing translation ------------------------------------------------
// The outfit pages used to print the engine's own record straight into the
// report: "Demand professional-5: FRAME_FACE, ELONGATE, CONTEXT_FIT, POLISH via
// Full tuck with absorbing layer, Empire seam relocation." The client is paying
// for instructions, not a dump of our internal vocabulary. These maps turn the
// same data into something she can act on.

const FUNCTION_IN_PLAIN_ENGLISH: Record<StylingFunction, string> = {
  ELONGATE: 'makes your leg line read longer',
  WIDEN: 'adds width where you want it',
  NARROW: 'keeps the line close and controlled',
  DEFINE_WAIST: 'marks your waist instead of running straight down',
  BALANCE: 'evens out the proportion between your top and bottom half',
  SPOTLIGHT: 'puts the attention where you want it',
  DIFFUSE: 'takes attention away from the areas you would rather not feature',
  FRAME_FACE: 'brings the eye up to your face',
  POLISH: 'reads finished rather than thrown together',
  ELEVATE: 'lifts an ordinary combination into something considered',
  SOFTEN: 'keeps the whole look soft rather than severe',
  SHARPEN: 'gives the outfit a clean, deliberate edge',
  HARMONIZE: 'keeps every colour in the outfit working together',
  CONTEXT_FIT: 'is right for where you are actually wearing it',
};

const TECHNIQUE_IN_PLAIN_ENGLISH: Record<string, string> = {
  'full-tuck-with-absorbing-layer': 'tuck the top in fully and let the open layer skim over the midsection',
  'hem-volume-balance': 'keep the fullness at the hem so the line balances from the waist down',
  'empire-seam-relocation': 'let the seam sit just under the bust so the length reads from higher up',
  'open-vertical-frame': 'wear the layer open so it draws two long vertical lines down the body',
  'near-face-contrast-frame': 'keep the strongest colour up near your face',
  'texture-hero-grounded': 'let one textured piece lead and keep everything under it plain',
  'pattern-displacement': 'put the pattern away from the areas you would rather not draw the eye to',
  'warm-bridge-correction': 'use the leather tones to warm the outfit up',
};

/** Plural garment names ("shoes", "trousers") need a plural verb. */
function agrees(garment: string, singular: string, plural: string) {
  return /(?:s|es)$/i.test(garment.trim()) && !/dress$/i.test(garment.trim()) ? plural : singular;
}

/**
 * Trailing words that leave a sentence dangling. A trim that stops on one reads
 * as broken prose once the verb is appended: "The Black pointed heels on a
 * finishes it."
 */
const DANGLING_TAIL_RE = /(?:\s+(?:on|in|at|of|to|for|and|or|with|over|under|a|an|the))+$/i;

/**
 * A cap generous enough to keep the head noun. At five words "Nude 1.2-2 inch
 * block-heel court shoes" lost the word "shoes" and stopped naming a garment.
 */
const MAX_GARMENT_WORDS = 7;

/** A short garment name, so sentences do not repeat a full description. */
function shortGarment(piece: string | undefined) {
  const text = (piece ?? '').replace(/\s*\.\s*$/, '').trim();
  if (!text) return 'the main piece';
  // Cut the descriptive tail:
  //   "Mocha satin-silk saree with a plain body" -> "Mocha satin-silk saree"
  //   "Black pointed heels on a 1.2-2 inch heel" -> "Black pointed heels"
  //   "Gold studs, slim watch"                   -> "Gold studs"
  const head = text
    .split(',')[0]
    .split(/\s+(?:with|that|featuring|worn|on|over|under|in)\s+/i)[0]
    .trim();
  const capped = head.split(/\s+/).slice(0, MAX_GARMENT_WORDS).join(' ');
  const trimmed = capped.replace(DANGLING_TAIL_RE, '').trim();
  return trimmed || head.split(/\s+/)[0] || 'the main piece';
}


/** One sentence a client can act on, from the outfit's own styling move. */
function stylingMoveSentence(candidate: CandidateOutfit) {
  // A stylist wrote how this look is worn. Nothing generated beats that.
  if (candidate.styling_note) return `How to wear it: ${candidate.styling_note}`;
  const hero = candidate.formula_items.find(item => item.palette_role === 'lead');
  const isOnePiece = Boolean(hero && isOnePieceItem(hero));
  // Advice that contradicts the garment is worse than no advice: you cannot
  // tuck a saree in, or balance the hem volume of a column dress.
  const usable = candidate.techniques.find(technique => {
    const move = TECHNIQUE_IN_PLAIN_ENGLISH[technique.id];
    if (!move) return false;
    return !(isOnePiece && /tuck|hem|layer skim/i.test(move));
  });
  const move = usable ? TECHNIQUE_IN_PLAIN_ENGLISH[usable.id] : undefined;
  return move ? `The move that makes it work: ${move}.` : 'Keep the proportions clean and let one piece lead.';
}

/** Why this outfit suits her, in her own terms rather than function codes. */
function whyThisWorksSentence(candidate: CandidateOutfit) {
  const seen = new Set<StylingFunction>();
  const reasons: string[] = [];
  for (const technique of candidate.techniques) {
    for (const fn of technique.functions) {
      if (seen.has(fn) || reasons.length >= 2) continue;
      seen.add(fn);
      reasons.push(FUNCTION_IN_PLAIN_ENGLISH[fn]);
    }
  }
  if (!reasons.length) return 'This combination suits your proportions and the way you actually dress.';
  return `This outfit ${reasons.join(', and ')}.`;
}

function pageFromScienceOutfit(candidate: ScoredCandidateOutfit, pageNumber: number, displayIndex: number): BlueprintPage {
  const hero = candidate.formula_items.find(item => item.palette_role === 'lead') ?? candidate.formula_items[0];
  const anchor = candidate.formula_items.find(item => /bottom|dress|outfit/i.test(item.slot)) ?? candidate.formula_items[1] ?? hero;
  const finish = candidate.formula_items.find(item => /bag|footwear|shoe|belt|jewel/i.test(item.slot)) ?? candidate.formula_items.at(-1) ?? hero;
  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: `Outfit ${displayIndex}`,
    subtitle: candidate.capsule,
    blocks: [
      {
        label: 'Formula',
        heading: 'The pieces',
        body: `Built around the ${shortGarment(hero?.piece)}.`,
        items: candidate.formula_items,
      },
      {
        // The renderer takes the pull quote from `reason` and the body copy from
        // `body`, so these must say different things or the page prints twice.
        label: 'Why it works',
        heading: 'Why this works on you',
        body: `${whyThisWorksSentence(candidate)} ${stylingMoveSentence(candidate)}`,
        reason: whyThisWorksSentence(candidate),
      },
      {
        label: 'Role breakdown',
        heading: 'What each piece is doing',
        // Hero and anchor are the same item for a one-piece look, so only name
        // each garment once rather than printing the saree twice.
        body: [
          `The ${shortGarment(hero?.piece)} ${agrees(shortGarment(hero?.piece), 'leads', 'lead')}.`,
          anchor && anchor !== hero ? `The ${shortGarment(anchor.piece)} ${agrees(shortGarment(anchor.piece), 'grounds', 'ground')} it.` : '',
          finish && finish !== hero && finish !== anchor ? `The ${shortGarment(finish.piece)} ${agrees(shortGarment(finish.piece), 'finishes', 'finish')} it.` : '',
        ].filter(Boolean).join(' '),
      },
      {
        label: 'Do not buy',
        heading: 'The version that breaks it',
        body: `Skip the clingy version of this outfit, and skip it in a stiff fabric that will not drape. Both undo what the ${shortGarment(hero?.piece).toLowerCase()} is doing here.`,
      },
    ],
    image_refs: [],
    palette_used: candidate.formula_items.map(item => ({
      name: item.colour_name,
      hex: item.colour_hex,
      role: item.palette_role,
    })).filter((item, index, array) => array.findIndex(other => other.name === item.name && other.role === item.role) === index).slice(0, 5),
    library_refs: candidate.library_ref ? [candidate.library_ref] : undefined,
  };
}

export function scienceOutfitsToBlueprintPages(
  selection: ScoredCandidateOutfit[],
  reportData: StylistBlueprintReportData,
): BlueprintPage[] {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitPages = selection.map((candidate, index) => pageFromScienceOutfit(candidate, outfitStart + index, index + 1));
  const transformationPageNumber = getStylistBlueprintTransformationPage(reportData);
  const previewIndexes = [5, 10, 15].map(index => Math.min(index, selection.length - 1));
  const transformationPage: BlueprintPage | null = transformationPageNumber
    ? {
      page_number: transformationPageNumber,
      page_type: 'transformation',
      title: 'Transformation Preview',
      subtitle: 'Three function-led outfit directions from the science engine',
      blocks: previewIndexes.map((selectionIndex, index) => {
        const candidate = selection[selectionIndex] ?? selection[index];
        return {
          label: `Look ${String(index + 1).padStart(2, '0')}`,
          heading: `${candidate?.capsule ?? 'Science'} preview`,
          body: candidate
            ? `${candidate.techniques[0]?.name ?? 'Function-led styling'} creates ${candidate.attention_map.first_fixation} focus while respecting client vetoes.`
            : 'Science preview direction.',
          reason: candidate?.generation_reasoning ?? 'Generated by the outfit science harness.',
          items: candidate?.formula_items ?? [],
        };
      }),
      image_refs: [],
    }
    : null;
  const systemPage: BlueprintPage = {
    page_number: outfitStart - 1,
    page_type: 'outfit_system',
    title: 'Outfit System',
    subtitle: 'Function-led science portfolio',
    blocks: [
      {
        label: 'Capsules',
        heading: 'Four outfit categories',
        body: 'The outfit science engine over-generated function-led looks from read-only library skeletons, scored them blind, then selected this portfolio for realism, relevance, ICONIK delta, and diversity.',
        items: CAPSULES.map(capsule => ({
          capsule,
          range: `Outfits ${outfitPages.findIndex(page => page.subtitle === capsule) + 1}-${outfitPages.map(page => page.subtitle).lastIndexOf(capsule) + 1}`,
          outfits: outfitPages.filter(page => page.subtitle === capsule).map(page => page.title),
        })),
      },
    ],
    image_refs: [],
  };
  return [...(transformationPage ? [transformationPage] : []), systemPage, ...outfitPages];
}

function portfolioScore(selection: ScoredCandidateOutfit[]): OutfitScienceEngineMetadata['portfolio_score'] {
  const average = (key: keyof OutfitScore) => {
    const total = selection.reduce((sum, item) => sum + (typeof item.score[key] === 'number' ? item.score[key] as number : 0), 0);
    return Math.round((total / Math.max(1, selection.length)) * 10) / 10;
  };
  return {
    average_realism: average('realism'),
    average_relevance: average('relevance'),
    average_iconik: average('iconik'),
    diversity: Math.round((uniqueCount(selection.flatMap(item => item.formula_items.map(formula => formula.colour_name))) / Math.max(1, selection.length) * 10) * 10) / 10,
  };
}

export async function generateStylistOutfitScienceApplication(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  readOnlyLibrary: ParsedStylistOutfit[] = getParsedStylistOutfitLibrary(),
): Promise<{ pages: BlueprintPage[]; outfit_engine: OutfitScienceEngineMetadata }> {
  const clientState = extractStylistClientState(submission, reportData);
  const demands = deriveFunctionDemands(clientState);
  const candidates = generateOutfitCandidates(clientState, demands, readOnlyLibrary);
  const scored = scoreOutfitCandidatesBlind(clientState, candidates);
  const selection = selectOutfitPortfolio(scored, {
    count: getStylistBlueprintOutfitCount(reportData),
    perCapsule: getStylistBlueprintOutfitCount(reportData) / CAPSULES.length,
    ethnicTarget: clientState.preferences.ethnic_target,
    preferredGarments: clientState.preferences.preferred_ethnic_garments,
  });
  const pages = scienceOutfitsToBlueprintPages(selection, reportData);
  return {
    pages,
    outfit_engine: {
      version: STYLIST_OUTFIT_SCIENCE_VERSION,
      client_state: clientState,
      function_demands: demands,
      generated_candidates: candidates,
      scored_candidates: scored,
      selected_candidate_ids: selection.map(item => item.id),
      portfolio_score: portfolioScore(selection),
      qa_feedback: reportData.outfit_engine?.qa_feedback ?? [],
    },
  };
}

export function isScienceBlueprintReport(reportData?: Pick<StylistBlueprintReportData, 'outfit_engine'> | null) {
  return reportData?.outfit_engine?.version === STYLIST_OUTFIT_SCIENCE_VERSION;
}

export function scienceCandidateForPage(reportData: StylistBlueprintReportData, pageNumber: number) {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const index = pageNumber - outfitStart;
  const candidateId = reportData.outfit_engine?.selected_candidate_ids[index];
  if (!candidateId) return null;
  return reportData.outfit_engine?.scored_candidates.find(candidate => candidate.id === candidateId) ?? null;
}

export function scienceQaSummary(verdict: OutfitScienceQaVerdict) {
  switch (verdict) {
    case 'PASS': return 'Manual QA passed.';
    case 'PASS_SURPRISE': return 'Surprising soft-prior violation passed; review as a possible new enabler.';
    case 'KILL_EYE': return 'Manual visual QA failed; tighten technique preconditions.';
    case 'KILL_WOW': return 'Outfit is correct but not ICONIK enough; raise wow-axis pressure.';
    case 'KILL_REAL': return 'Outfit is impractical or hard to source; tighten realism anchors.';
  }
}

export function buildScienceHarnessSummaryForTest(reportData: StylistBlueprintReportData, submission: StylistIntakeSubmission) {
  const clientState = extractStylistClientState(submission, reportData);
  const demands = deriveFunctionDemands(clientState);
  const candidates = generateOutfitCandidates(clientState, demands, getParsedStylistOutfitLibrary());
  const scored = scoreOutfitCandidatesBlind(clientState, candidates);
  const selection = selectOutfitPortfolio(scored, { count: getStylistBlueprintOutfitCount(reportData) });
  return {
    clientState,
    demandCount: demands.length,
    candidateCount: candidates.length,
    killedCount: scored.filter(item => item.score.killed).length,
    selectedCount: selection.length,
    firstPageBlocks: scienceOutfitsToBlueprintPages(selection, reportData)[1]?.blocks.map((block: BlueprintBlock) => block.label),
  };
}
