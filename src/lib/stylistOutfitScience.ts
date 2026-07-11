import {
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintTransformationPage,
} from './stylistBlueprintSchema';
import {
  getParsedStylistOutfitLibrary,
  isUsableStylistOutfitAnchor,
  type ParsedStylistOutfit,
  type ParsedStylistOutfitSlot,
} from './stylistOutfitLibraryParser';
import type {
  BlueprintBlock,
  BlueprintColourUse,
  BlueprintLibraryRef,
  BlueprintPage,
  StylistBlueprintClassification,
  StylistBlueprintReportData,
  StylistIntakeSubmission,
} from './stylistBlueprintGenerator';

export const STYLIST_OUTFIT_SCIENCE_VERSION = 'outfit_science_v1' as const;

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
  return [...vetoes].filter(Boolean).slice(0, 20);
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
  if (target === 'clear') return value;
  if (target === 'muted') return 1 - value;
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
  const colour = role === 'ground'
    ? NEUTRAL_COLOURS[(index + 1) % NEUTRAL_COLOURS.length]
    : colourAt(clientState, index + (role === 'support' ? 3 : role === 'accent' ? 6 : 0), role);
  const piece = `${colour.name} ${slot.piece}`.replace(/\s+/g, ' ').trim();
  return {
    slot: rawSlot === 'Outerwear' ? 'Layer' : rawSlot,
    piece,
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: role,
    structural_notes: structuralNoteForSlot(rawSlot, demand),
  };
}

function structuralNoteForSlot(slot: string, demand: FunctionDemand) {
  const functions = demand.functions.map(item => item.function).join(', ');
  if (/top|dress|base|outerwear|layer/i.test(slot)) return `Near-face and upper-body placement supports ${functions} without breaking client guardrails.`;
  if (/bottom/i.test(slot)) return 'The lower line stays clean and full enough to lengthen and balance the frame.';
  if (/footwear/i.test(slot)) return 'The shoe keeps the vertical line grounded and realistic to source.';
  if (/bag|jewel|accessor|waist/i.test(slot)) return 'The finish adds polish without stealing attention from the face.';
  return 'This piece supports the outfit function while staying shoppable.';
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

export function generateOutfitCandidates(
  clientState: ClientStateModel,
  demands: FunctionDemand[],
  readOnlyLibrary: ParsedStylistOutfit[],
): CandidateOutfit[] {
  const library = readOnlyLibrary.filter(isUsableStylistOutfitAnchor);
  const candidates: CandidateOutfit[] = [];
  for (const [demandIndex, demand] of demands.entries()) {
    const anchors = library
      .filter(outfit => outfit.capsule === demand.capsule || demandIndex % 2 === 0)
      .filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard))
      .slice(0, 12);
    const sourceAnchors = anchors.length ? anchors : library.filter(outfit => !hasHardVeto(outfitText(outfit), clientState.vetoes.hard)).slice(0, 12);
    for (let variant = 0; variant < 3; variant++) {
      const anchor = sourceAnchors[(demandIndex * 3 + variant) % Math.max(1, sourceAnchors.length)];
      const slots = anchor?.normalised_slots?.length ? anchor.normalised_slots : fallbackSlots(demand.capsule);
      const formulaItems = slots
        .map(slot => slotToFormulaItem(slot, clientState, demandIndex * 3 + variant, demand))
        .filter((item): item is FormulaItem => Boolean(item))
        .slice(0, 8);
      if (!formulaItems.some(item => /top|dress|base|outfit/i.test(item.slot))) {
        formulaItems.unshift(slotToFormulaItem(fallbackSlots(demand.capsule)[0], clientState, demandIndex * 3 + variant, demand)!);
      }
      if (!formulaItems.some(item => /bottom|dress|outfit/i.test(item.slot))) {
        formulaItems.splice(1, 0, slotToFormulaItem(fallbackSlots(demand.capsule)[1], clientState, demandIndex * 3 + variant, demand)!);
      }
      if (!formulaItems.some(item => /footwear|shoe/i.test(item.slot))) {
        formulaItems.push(slotToFormulaItem(fallbackSlots(demand.capsule)[3], clientState, demandIndex * 3 + variant, demand)!);
      }
      if (!formulaItems.some(item => /bag|jewel|accessor/i.test(item.slot))) {
        formulaItems.push(slotToFormulaItem(fallbackSlots(demand.capsule)[4], clientState, demandIndex * 3 + variant, demand)!);
      }
      const text = formulaItems.map(item => `${item.slot} ${item.piece}`).join(' ');
      const failedVeto = hasHardVeto(text, clientState.vetoes.hard);
      if (failedVeto) continue;
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
    const iconik = Math.min(10, 3 + techniqueScore * 0.5 + uniqueCount(candidate.techniques.flatMap(item => item.functions)) * 0.35 + (candidate.library_ref ? 1 : 0));
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

export function selectOutfitPortfolio(
  scoredCandidates: ScoredCandidateOutfit[],
  constraints: { count: number; perCapsule?: number },
): ScoredCandidateOutfit[] {
  const survivors = scoredCandidates.filter(candidate => !candidate.score.killed);
  const selected: ScoredCandidateOutfit[] = [];
  const usedSignatures = new Set<string>();
  const usedLeadFamilies = new Map<string, number>();
  const perCapsule = constraints.perCapsule ?? constraints.count / CAPSULES.length;
  for (const capsule of CAPSULES) {
    const capsuleCandidates = survivors
      .filter(candidate => candidate.capsule === capsule)
      .sort((a, b) => {
        const aLead = a.formula_items.find(item => item.palette_role === 'lead')?.colour_name ?? '';
        const bLead = b.formula_items.find(item => item.palette_role === 'lead')?.colour_name ?? '';
        const aPenalty = (usedLeadFamilies.get(aLead.toLowerCase()) ?? 0) + (a.library_signature && usedSignatures.has(a.library_signature) ? 2 : 0);
        const bPenalty = (usedLeadFamilies.get(bLead.toLowerCase()) ?? 0) + (b.library_signature && usedSignatures.has(b.library_signature) ? 2 : 0);
        const aTotal = a.score.iconik * 1.5 + a.score.realism + a.score.relevance + a.score.diversity - aPenalty;
        const bTotal = b.score.iconik * 1.5 + b.score.realism + b.score.relevance + b.score.diversity - bPenalty;
        return bTotal - aTotal;
      });
    for (const candidate of capsuleCandidates) {
      if (selected.filter(item => item.capsule === capsule).length >= perCapsule) break;
      if (candidate.library_signature && usedSignatures.has(candidate.library_signature) && capsuleCandidates.length > perCapsule) continue;
      selected.push(candidate);
      if (candidate.library_signature) usedSignatures.add(candidate.library_signature);
      const lead = candidate.formula_items.find(item => item.palette_role === 'lead')?.colour_name?.toLowerCase() ?? 'unknown';
      usedLeadFamilies.set(lead, (usedLeadFamilies.get(lead) ?? 0) + 1);
    }
  }
  if (selected.length < constraints.count) {
    for (const candidate of survivors.sort((a, b) => b.score.iconik - a.score.iconik)) {
      if (selected.length >= constraints.count) break;
      if (!selected.some(item => item.id === candidate.id)) selected.push(candidate);
    }
  }
  return selected.slice(0, constraints.count).sort((a, b) => CAPSULES.indexOf(a.capsule) - CAPSULES.indexOf(b.capsule));
}

function pageFromScienceOutfit(candidate: ScoredCandidateOutfit, pageNumber: number, displayIndex: number): BlueprintPage {
  const hero = candidate.formula_items.find(item => item.palette_role === 'lead') ?? candidate.formula_items[0];
  const anchor = candidate.formula_items.find(item => /bottom|dress|outfit/i.test(item.slot)) ?? candidate.formula_items[1] ?? hero;
  const bridge = candidate.formula_items.find(item => /bag|footwear|shoe|belt|jewel/i.test(item.slot)) ?? candidate.formula_items.at(-1) ?? hero;
  const scoreText = `Realism ${candidate.score.realism}/10. Relevance ${candidate.score.relevance}/10. ICONIK ${candidate.score.iconik}/10. Diversity ${candidate.score.diversity}/10.`;
  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: `Outfit ${displayIndex} - ${candidate.capsule} Science Look`,
    subtitle: candidate.capsule,
    blocks: [
      {
        label: 'Formula',
        heading: `${candidate.capsule} science formula ${displayIndex}`,
        body: `Archetype: Function-led library adaptation. Hero: ${hero?.piece ?? 'main garment'}. The one move is ${candidate.techniques[0]?.name ?? 'clean visual hierarchy'}.`,
        items: candidate.formula_items,
      },
      {
        label: 'Why it works',
        heading: 'Outfit science logic',
        body: `${candidate.generation_reasoning} Attention is predicted to land first on the face, then move to ${candidate.attention_map.second_fixation}.`,
        reason: candidate.generation_reasoning,
      },
      {
        label: 'Role breakdown',
        heading: 'Hero, anchor, bridge, finish',
        body: `Hero: ${hero?.piece ?? 'main garment'}. Anchor: ${anchor?.piece ?? 'lower line'}. Bridge: ${bridge?.piece ?? 'finish'}. Functions: ${candidate.techniques.flatMap(item => item.functions).slice(0, 6).join(', ')}.`,
      },
      {
        label: 'Do not buy',
        heading: 'The version that breaks it',
        body: 'Do not buy the clingy, high-contrast, unsupported version of this outfit; it breaks the attention map and loses the body strategy.',
      },
      {
        label: 'Score summary',
        heading: 'Blind science score',
        body: `${scoreText} ${candidate.score.rationale}`,
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
