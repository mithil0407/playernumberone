import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  getParsedStylistOutfitLibrary,
  getStylistOutfitLibraryPromptFromOutfits,
  isUsableStylistOutfitAnchor,
  type ParsedStylistOutfit,
} from './stylistOutfitLibraryParser';
import {
  loadLearnedStylistOutfits,
  loadStylistOutfitNegativeSignals,
  type NegativeOutfitSignal,
} from './stylistOutfitLearning';
import {
  STYLIST_BLUEPRINT_36_VERSION,
  STYLIST_BLUEPRINT_37_VERSION,
  STYLIST_BLUEPRINT_39_VERSION,
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAuditPage,
  getStylistBlueprintAvoidancePage,
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFabricPage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintHairFaceAccessoriesPage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintOutfitSystemPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  getStylistBlueprintProportionPage,
  getStylistBlueprintReadingGuidePage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintSummaryPage,
  getStylistBlueprintTransformationPage,
  isLatestStylistBlueprintVersion,
} from './stylistBlueprintSchema';
import { WOMEN_OUTFIT_HARNESS_V2 } from './womenOutfitHarnessV2';

export {
  STYLIST_BLUEPRINT_36_PAGE_COUNT,
  STYLIST_BLUEPRINT_36_VERSION,
  STYLIST_BLUEPRINT_37_PAGE_COUNT,
  STYLIST_BLUEPRINT_37_VERSION,
  STYLIST_BLUEPRINT_39_PAGE_COUNT,
  STYLIST_BLUEPRINT_39_VERSION,
  STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT,
  STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT,
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  STYLIST_BLUEPRINT_OUTFIT_COUNT,
  STYLIST_BLUEPRINT_PAGE_COUNT,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAuditPage,
  getStylistBlueprintAvoidancePage,
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFabricPage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintHairFaceAccessoriesPage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintOutfitSystemPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  getStylistBlueprintProportionPage,
  getStylistBlueprintReadingGuidePage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintSummaryPage,
  getStylistBlueprintTransformationPage,
  isLatestStylistBlueprintVersion,
  isVersionedStylistBlueprintReportData,
} from './stylistBlueprintSchema';

// Tight, stylist-report-specific styling principles. This replaces the old
// ICONIK Club catalog-matching skill, which described a different product
// (candidate-id matching across 6 occasions) and only confused this freeform,
// capsule-based Blueprint flow.
const STYLIST_STYLING_PRINCIPLES = `# ICONIK Women Style Blueprint — Styling Principles

You are styling for a real woman who will try to actually buy and wear these
looks. Classy, realistic, and shoppable beats novel or experimental every time.

## Realism (most important)
- Every piece must be something she can find at real retail today: a normal,
  recognisable garment with a clear fabric, cut, length, and finish. No invented
  shapes, no "fashion-week" one-offs, no garments that don't exist in stores.
- No random or hard-to-source colours. Colour belongs to the wardrobe system,
  not to every item. Most of an outfit is neutral; colour appears in one or two
  considered places.
- Each look reads as one woman with one coherent taste, dressed for one occasion.

## Colour discipline
- Max 3 visible colours per outfit; 2 is usually classier.
- One colour leads, one supports, neutrals ground. Anchor every outfit on a
  neutral (ivory, stone, taupe, grey, navy, charcoal, black, espresso, camel).
- Accent/feature colours appear ONLY as whole realistic pieces: a coloured knit
  or top, a coloured layer, a silk scarf, a leather belt, a jewellery stone, a
  garment print, or an evening clutch — never smeared across the whole outfit.
- Bags and shoes are a single realistic leather/suede colour head to toe. Never
  a coloured trim, stripe, sole, or hardware in a contrast colour.

## Silhouette & detail
- Honour the client's body geometry, proportion directive, and coverage rules
  absolutely. Coverage and modesty requirements are non-negotiable.
- Specify pieces concretely: fabric, cut/silhouette, length, neckline, and
  finish — the level of detail a stylist writes, not a vague category.
- Match formality to the occasion: shoe type, fabric finish, and structure carry
  the occasion shift more than colour does.

## Taste
- Stay inside the client's stated taste and signature codes. Do not introduce
  unsignalled statement pieces, maximalism, or experimental styling.
- Vary formula, top/bottom relationship, texture, shoe type, and bag shape across
  the set so no two looks feel duplicated.

## ICONIK outfit recommendation harness
- Start every outfit from a styling intention: occasion, desired impression,
  body goal, colour mood, freshness level, modesty level, practicality need, and
  the main styling move. Build the clothes after the intention is clear.
- Use exactly one decisive item per category. Never write alternatives such as
  "pumps or flats", "ivory or pale blue", "gold or silver", or slash options.
- Every outfit must follow one clear archetype: Coloured Hero + Quiet Support,
  Neutral Architecture + Rich Accent, Pattern Hero + Controlled Solids, Texture
  Hero + Tonal Depth, Shape Hero + Clean Colour, Casual Base + Polished
  Disruptor, Western Base + Elevated Finishing, or Indian Base + Modern
  Finishing only when the intake explicitly allows ethnic styling.
- Every colour must have a job: face-lift, hero, anchor, bridge, accent, or
  echo. Across the set, at least half of outfits should use colour in a main
  garment, not only through accessories.
- Keep the target style band at roughly 60% familiar and 40% elevated: realistic,
  buyable, fresh, flattering, context-appropriate, undertone-aligned, body-aware,
  visually balanced, and not confusing or overdone.
- Reject and revise outfits that are too neutral, too flat, too safe, too loud,
  too generic, too hard to buy, repetitive, not body-logical, or not aligned with
  the client's undertone, climate, modesty, and occasion.

## Accessory architecture
- Accessories must finish the architecture of the outfit; they are not filler.
- Use jewellery, bag, belt, scarf, watch, lip tone, or hair accessory only when
  it improves body balance, colour hierarchy, face lift, polish, or freshness.
- Keep one clear accessory idea per outfit. Do not stack a strong bag, strong
  jewellery, strong eyewear, and a strong finishing detail together.
- Score accessory architecture mentally before finalising. Target 8+ for visual
  hierarchy, realism, client safety, occasion fit, and set diversity.

## EYEFRAME / EYEWEAR RULE
- When generating multiple outfits, include one exact eyewear detail in every
  alternate outfit only. Use eyewear as a face-architecture and outfit-mood tool,
  not as a random accessory. Do not add eyewear to every outfit.
- For this Blueprint, alternate outfits are the even-numbered outfits: 2, 4, 6,
  8, 10, 12, 14, 16, 18, and 20.
- Eyewear must match face shape, facial architecture, outfit mood, colour
  palette, metal direction, occasion, and the client's personality and comfort
  level.
- Use eyewear to add authority, softness, modernity, luxury polish, or a colour
  echo. Choose one exact frame or sunglass item; never write optional eyewear.
- Do not create visual clutter near the face. If the outfit already has bold
  print, statement jewellery, a colourful hero garment, dramatic neckline, or
  heavy accessories, keep the required eyewear minimal and quiet.
- Office/formal: slim rectangular frames, soft cat-eye frames, dark
  tortoiseshell frames, black acetate frames, or thin silver/gold metal frames.
- Smart casual: soft square sunglasses, brown-tinted sunglasses, translucent
  acetate frames, or rounded rectangular frames.
- Brunch/feminine: soft cat-eye sunglasses, champagne frames, rose-gold frames,
  or warm brown frames.
- Travel/resort: oversized sunglasses, brown-tinted sunglasses, tortoiseshell
  sunglasses, or lightweight metal frames.
- Indian/festive: delicate gold-rimmed frames, soft brown sunglasses, or subtle
  cat-eye frames; avoid sporty frames unless the outfit is casual.

## Output contract
- Formula items must map to: top, bottom or one-piece, layer only when needed,
  footwear, bag, jewellery, finishing detail only if needed, and eyewear only on
  alternate outfits.
- 07 - FINISHING DETAIL: belt, scarf, watch, lip tone, hair detail, etc. — add a
  finishing detail whenever it elevates the look. Never put eyewear, sunglasses, or
  optical frames here.
- 08 - EYEWEAR: the ONLY place eyewear/sunglasses may appear, and only when
  appropriate. One exact frame or sunglass recommendation.
- Eyewear must never appear in more than one slot in the same outfit.
- The final outfit should feel like normal clothes arranged with superior
  intelligence, plus one styling decision the client would not have made herself.`;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const STYLIST_BLUEPRINT_TEXT_MODEL = process.env.GEMINI_STYLIST_TEXT_MODEL || 'gemini-3-flash-preview';
const STYLIST_BLUEPRINT_OUTFIT_TEXT_MODEL = process.env.GEMINI_STYLIST_OUTFIT_MODEL || 'gemini-3.1-pro-preview';
const GEMINI_TEXT_TIMEOUT_MS = 75_000;
const GEMINI_OUTFIT_TEXT_TIMEOUT_MS = Number(process.env.GEMINI_STYLIST_OUTFIT_TIMEOUT_MS || 150_000);

function readWomenOutfitLibraryText(): string {
  try {
    return readFileSync(join(process.cwd(), 'outfitlibrarywomen.md'), 'utf-8').trim();
  } catch {
    return '';
  }
}

// Detailed outfit generation should be anchored in parsed, verified outfit
// skeletons. Feedback learning remains off unless explicitly re-enabled.
const STYLIST_OUTFIT_LIBRARY_ENABLED = true;
const STYLIST_OUTFIT_FEEDBACK_LEARNING_ENABLED = false;

export interface StylistIntakeSubmission {
  id: string;
  order_id?: string | null;
  lead_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  full_name?: string | null;
  age_range?: string | null;
  country?: string | null;
  primary_language?: string | null;
  body_measurements?: Record<string, unknown> | null;
  photo_urls?: Record<string, string | null> | null;
  focus_areas?: string[] | null;
  coverage_requirements?: Record<string, unknown> | null;
  lifestyle_context?: Record<string, unknown> | null;
  piece_preferences?: Record<string, unknown> | null;
  selected_moodboard_id?: string | null;
  selected_moodboard_label?: string | null;
  secondary_moodboard_elements?: string[] | null;
  hair_context?: Record<string, unknown> | null;
  skin_tone_self_description?: string | null;
  shopping_relationship?: string | null;
  prior_styling_experience?: Record<string, unknown> | null;
  one_outfit_description?: string | null;
  one_outfit_image_url?: string | null;
  intake_source?: 'customer_form' | 'manual_admin' | string | null;
  raw_consultation_notes?: string | null;
  completion_percentage?: number | null;
  completed_at?: string | null;
  created_at?: string;
}

export interface StylistBlueprintClassification {
  client: {
    name: string;
    email: string;
    country: string;
    age_range: string;
    language: string;
    lifestyle_summary: string;
  };
  body: {
    geometry: string;
    focus_areas: string[];
    proportion_directive: string;
    coverage_rules: string[];
    silhouette_rules: string[];
  };
  colour: {
    undertone_direction: string;
    depth: string;
    contrast: string;
    palette_name: string;
    base_palette: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>;
    accent_palette: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>;
    palette: Array<{ name: string; hex: string; usage: string }>;
    avoid_colours: string[];
  };
  face_hair_accessories: {
    face_shape: string;
    face_direction: string;
    hair_direction: string;
    hair_colour_direction: string;
    hair_colour_options: string[];
    neckline_direction: string;
    jewellery_direction: string;
    eyewear_direction: string;
    approved_necklines: string[];
    hair_styles: string[];
    eyewear_shapes: string[];
    earring_shapes: string[];
  };
  makeup: {
    style: string;
    everyday_direction: string;
    steps: string[];
    colours: string[];
  };
  taste: {
    style_archetype: string;
    moodboard: string;
    signature_codes: string[];
    anti_codes: string[];
    shopping_filters: string[];
  };
  fabrics: {
    approved: Array<{ name: string; reason: string }>;
    avoid: Array<{ name: string; reason: string }>;
  };
}

export interface StylistBlueprintSections {
  s0_snapshot: string;
  s1_body_geometry: string;
  s2_colour_harmony: string;
  s3_face_hair_accessories: string;
  s4_outfit_formulas: string;
  s5_shopping_fit_rules: string;
  s6_identity_statement: string;
}

export interface LegacyStylistBlueprintReportData {
  classification: StylistBlueprintClassification;
  sections: StylistBlueprintSections;
  generated_at: string;
}

export type BlueprintPageType =
  | 'cover'
  | 'transformation'
  | 'summary'
  | 'reading_guide'
  | 'diagnosis'
  | 'avoidance'
  | 'palette'
  | 'colour_drape'
  | 'rules'
  | 'hair'
  | 'hair_colour'
  | 'eyewear'
  | 'makeup'
  | 'fabric'
  | 'outfit_system'
  | 'outfit'
  | 'matrix'
  | 'audit'
  | 'continuation';

export interface BlueprintBlock {
  label?: string;
  heading?: string;
  body?: string;
  reason?: string;
  items?: unknown[];
  example_outfit?: SilhouetteProofOutfit;
  example_outfit_page_number?: number;
  example_outfit_principle?: string;
  example_outfit_label?: string;
}

export type SilhouetteProofOutfit = {
  title: string;
  principle: string;
  formula_items: NormalisedFormulaItem[];
  palette_used: BlueprintColourUse[];
  image_slot: `application.silhouetteProofs.${number}`;
};

export interface BlueprintColourUse {
  name: string;
  hex: string;
  role: 'lead' | 'support' | 'ground' | 'accent';
}

export interface BlueprintLibraryRef {
  id: string;
  title: string;
  source: 'women' | 'root' | 'curated' | 'learned';
  capsule: string;
  adaptation: string;
}

export interface BlueprintPage {
  page_number: number;
  page_type: BlueprintPageType;
  title: string;
  subtitle?: string;
  blocks: BlueprintBlock[];
  image_refs?: string[];
  palette_used?: BlueprintColourUse[];
  library_refs?: BlueprintLibraryRef[];
}

export interface StylistBlueprintAnalysis {
  silhouette_profile: string;
  chromatic_family: string;
  facial_architecture: string;
  style_direction: string;
  proportional_focus: string[];
  evidence_notes: string[];
  confidence: {
    body: 'low' | 'medium' | 'high';
    colour: 'low' | 'medium' | 'high';
    face: 'low' | 'medium' | 'high';
  };
}

export interface StylistBlueprintReportData {
  version: typeof STYLIST_BLUEPRINT_VERSION | typeof STYLIST_BLUEPRINT_39_VERSION | typeof STYLIST_BLUEPRINT_37_VERSION | typeof STYLIST_BLUEPRINT_36_VERSION | typeof STYLIST_BLUEPRINT_LEGACY_VERSION;
  generated_at: string;
  client: {
    display_name: string;
    email: string;
    month_year: string;
  };
  analysis: StylistBlueprintAnalysis;
  classification: StylistBlueprintClassification;
  pages: BlueprintPage[];
}

type AnyRecord = Record<string, unknown>;

interface OutfitLibraryContext {
  outfits: ParsedStylistOutfit[];
  blockedSignatures: Set<string>;
  negativeSignals: NegativeOutfitSignal[];
}

function seedOutfitLibraryContext(): OutfitLibraryContext {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED) {
    return {
      outfits: [],
      blockedSignatures: new Set(),
      negativeSignals: [],
    };
  }
  return {
    outfits: getParsedStylistOutfitLibrary(),
    blockedSignatures: new Set(),
    negativeSignals: [],
  };
}

async function loadOutfitLibraryContext(): Promise<OutfitLibraryContext> {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED) return seedOutfitLibraryContext();
  if (!STYLIST_OUTFIT_FEEDBACK_LEARNING_ENABLED) {
    const outfits = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
    return {
      outfits,
      blockedSignatures: new Set(),
      negativeSignals: [],
    };
  }
  const [learnedOutfits, negativeSignals] = await Promise.all([
    loadLearnedStylistOutfits(),
    loadStylistOutfitNegativeSignals(),
  ]);
  const blockedSignatures = new Set(negativeSignals.map(signal => signal.signature).filter(Boolean));
  const seen = new Set<string>();
  const allOutfits = [...getParsedStylistOutfitLibrary(), ...learnedOutfits].filter(outfit => {
    const key = outfit.signature || outfit.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const outfits = allOutfits.filter(isUsableStylistOutfitAnchor);
  return { outfits, blockedSignatures, negativeSignals };
}

function outfitLibraryPromptForContext(context: OutfitLibraryContext) {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED || !context.outfits.length) {
    return 'No parsed verified outfit anchors are available for this run. Do not invent library_refs, source ids, source outfit titles, or library_piece_logic. Use outfitlibrarywomen.md as the dominant catalog reference when attached: choose the closest complete catalog formula, then adapt minimally for client coverage, fit, body geometry, undertone, occasion, cultural mode, climate, and explicit dislikes.';
  }
  return getStylistOutfitLibraryPromptFromOutfits(context.outfits);
}

function outfitGenerationSourceRules(context: OutfitLibraryContext) {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED || !context.outfits.length) {
    return `- No verified library anchor objects are attached for this run. Do not invent library_refs, source ids, source outfit titles, or library_piece_logic.
- Use the attached markdown outfit library as the dominant prompt reference: choose the closest library-quality formula, then adapt minimally for client coverage, fit, body geometry, undertone, occasion, cultural mode, climate, and explicit dislikes.
- Use the basic page plan only for page number, capsule, max colours, and eyewear cadence, not as garment or colour authority.
- Variation should come from the harness outcome, fabric, proportion, shoe type, bag shape, and realistic repeated wardrobe anchors, not from random colour novelty.`;
  }
  return `- Each outfit page must adapt the selected library skeleton in library_piece_logic. Treat those slots as the hard catalog starting outfit, not loose inspiration.
- Preserve the selected library skeleton's garment categories, silhouette relationships, styling line, finish, and accessory architecture. Change only colour, coverage, fabric weight, formality, climate, and fit to this client.
- Do not invent a different formula when the selected library skeleton already supplies the slot. Do not borrow slots from another library outfit.
- Each outfit page must include top-level library_refs with the assigned library_reference id, title, source, capsule, and adaptation.
- Do not mention "adapted from", "library reference", source ids, or source outfit titles in visible client-facing body text. Keep that only in top-level library_refs.`;
}

function outfitColourSourceRules(context: OutfitLibraryContext) {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED || !context.outfits.length) {
    return `- Colour story must be realistic, buyable, and visually balanced from the attached images, coverage, free notes, occasion capsule, and harness rules.
- Use enough main-garment freshness; do not force a fixed palette and do not cycle neutrals mechanically.`;
  }
  return `- Lead, support, ground, and accent colours are supplied per outfit in the plan record, pre-allocated from the client's palette with cross-set diversity caps. Follow the assigned colour families exactly; use the selected source outfit only for colour placement logic (which garment slot carries the colour), not to replace the assigned families.
- Accent colours appear only when the plan record provides one. Keep them intentional, realistic, and never a whole trouser, sneaker, or large coat.`;
}

export function canonicalStylistBlueprintPageType(
  pageNumber: number,
  dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null,
): BlueprintPageType {
  if (pageNumber === 1) return 'cover';
  if (pageNumber === getStylistBlueprintTransformationPage(dataOrVersion)) return 'transformation';
  if (pageNumber === getStylistBlueprintSummaryPage(dataOrVersion)) return 'summary';
  if (pageNumber === getStylistBlueprintReadingGuidePage(dataOrVersion)) return 'reading_guide';
  if ([
    getStylistBlueprintBodyGeometryPage(dataOrVersion),
    getStylistBlueprintChromaticPage(dataOrVersion),
    getStylistBlueprintFaceArchitecturePage(dataOrVersion),
    getStylistBlueprintProportionPage(dataOrVersion),
  ].includes(pageNumber)) return 'diagnosis';
  if (pageNumber === getStylistBlueprintAvoidancePage(dataOrVersion)) return 'avoidance';
  if (pageNumber === getStylistBlueprintPalettePage(dataOrVersion)) return 'palette';
  if (pageNumber === getStylistBlueprintColourDrapePage(dataOrVersion)) return 'colour_drape';
  if (pageNumber === getStylistBlueprintHairstylePage(dataOrVersion)) return 'hair';
  if (pageNumber === getStylistBlueprintHairColourPage(dataOrVersion)) return 'hair_colour';
  if (pageNumber === getStylistBlueprintEyeframePage(dataOrVersion)) return 'eyewear';
  if (pageNumber === getStylistBlueprintMakeupPage(dataOrVersion)) return 'makeup';
  if ([getStylistBlueprintRulesStartPage(dataOrVersion), getStylistBlueprintHairFaceAccessoriesPage(dataOrVersion)].includes(pageNumber)) return 'rules';
  if (pageNumber === getStylistBlueprintFabricPage(dataOrVersion)) return 'fabric';
  if (pageNumber === getStylistBlueprintOutfitSystemPage(dataOrVersion)) return 'outfit_system';
  if (pageNumber >= getStylistBlueprintOutfitStartPage(dataOrVersion) && pageNumber <= getStylistBlueprintOutfitEndPage(dataOrVersion)) return 'outfit';
  if (pageNumber === getStylistBlueprintMatrixPage(dataOrVersion)) return 'matrix';
  if (pageNumber === getStylistBlueprintAuditPage(dataOrVersion)) return 'audit';
  if (pageNumber === getStylistBlueprintContinuationPage(dataOrVersion)) return 'continuation';
  return 'diagnosis';
}

function stringify(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function cleanJson(text: string) {
  const stripped = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  // The JSON callers all expect a single object — slice to the outer braces to drop any prose the model added around it.
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  if (first !== -1 && last > first) return stripped.slice(first, last + 1);
  return stripped;
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function intakeDisplayName(submission: Pick<StylistIntakeSubmission, 'full_name' | 'customer_email' | 'customer_phone'>) {
  if (submission.full_name?.trim()) return submission.full_name.trim();
  if (submission.customer_email?.trim()) return submission.customer_email.trim().split('@')[0];
  if (submission.customer_phone?.trim()) return `Client ${submission.customer_phone.trim()}`;
  return 'Client';
}

export function isManualStylistBlueprintSubmission(submission?: Pick<StylistIntakeSubmission, 'intake_source'> | null) {
  return submission?.intake_source === 'manual_admin';
}

function isIndianStylistIntake(submission: Pick<StylistIntakeSubmission, 'country' | 'intake_source'>) {
  return submission.intake_source === 'manual_admin' || /\bindia\b/i.test(submission.country ?? '');
}

const ETHNIC_PREFERENCE_PATTERN = /\b(indian|ethnic(?:wear)?|kurt[ai]|kurta|kurti|saree|sari|lehenga|anarkali|salwar|churidar|sharara|gharara|dupatta|indo[- ]?western|festive|festival|wedding|shaadi|sangeet|mehendi|mehndi|haldi|diwali|traditional|desi|jutti|juttis|kolhapuri|banarasi|chikankari|bandhani|silk sari)\b/i;

export type StylistOutfitCulturalMode = 'western_default' | 'ethnic_allowed';

// Only surface Indian/ethnic outfits when the client's own intake signals interest in them —
// being an India-market or admin-created intake is NOT sufficient on its own.
function intakeSignalsEthnicPreference(submission: StylistIntakeSubmission): boolean {
  const parts = [
    submission.selected_moodboard_label ?? '',
    submission.selected_moodboard_id ?? '',
    submission.one_outfit_description ?? '',
    submission.raw_consultation_notes ?? '',
    submission.skin_tone_self_description ?? '',
    ...(submission.focus_areas ?? []),
    ...(submission.secondary_moodboard_elements ?? []),
    JSON.stringify(submission.piece_preferences ?? {}),
    JSON.stringify(submission.lifestyle_context ?? {}),
    JSON.stringify(submission.coverage_requirements ?? {}),
  ];
  return ETHNIC_PREFERENCE_PATTERN.test(parts.join(' \n '));
}

export function getStylistOutfitCulturalMode(submission?: StylistIntakeSubmission | null): StylistOutfitCulturalMode {
  return submission && intakeSignalsEthnicPreference(submission) ? 'ethnic_allowed' : 'western_default';
}

function culturalModeRules(mode: StylistOutfitCulturalMode) {
  if (mode === 'ethnic_allowed') {
    return `Cultural styling mode: ethnic_allowed.
- Indian, ethnic, and indo-western pieces are allowed only because the intake/admin notes explicitly signal them.
- Still respect Western/formal/trouser/top/midi/evening preferences when those are stated. Do not default the full set to Indianwear.
- Ethnic pieces must be elevated, modern, body-logical, and never generic or bulky.`;
  }

  return `Cultural styling mode: western_default.
- Generate Western / contemporary elevated outfits only. India-market context affects retail realism, climate, and INR language only.
- Do NOT use Indianwear, ethnicwear, indo-western pieces, kurtas, kurtis, sarees/saris, lehengas, anarkalis, salwar/churidar, shararas, dupattas, juttis, kolhapuris, Indian office wear, ethnic workwear, or festive Indian outfit terms.
- Learn taste from the outfit library's Western/elevated entries: wrap blouses, cowl tops, open collars, blazers, vests, trousers, skirts, dresses, denim, co-ords, structured bags, leather bridges, scarves, belts, watches, hair details, and jewellery.
- If the library contains ethnic garments, ignore the ethnic garment category and transfer only the elevated register, colour relationship, texture, proportion, and finishing intelligence.`;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

const PIECE_PREFERENCE_LABELS: Record<string, string> = {
  relaxed_oversized: 'relaxed oversized tops',
  fitted_tuck_in: 'fitted tucked-in tops',
  structured_button_front: 'structured button-front tops',
  draped_wrap: 'draped or wrap tops',
  detailed_collar: 'detailed collar tops',
  clean_minimal: 'clean minimal tops',
  wide_leg_trouser: 'wide-leg trousers',
  straight_cigarette: 'straight cigarette bottoms',
  tailored_midi_skirt: 'tailored midi skirts',
  wrap_skirt: 'wrap skirts',
  straight_jeans: 'fitted straight jeans',
  bootcut: 'flared or bootcut bottoms',
  structured_blazer: 'structured blazers',
  longline_coat: 'longline coats',
  denim_jacket: 'denim jackets',
  moto_jacket: 'leather or moto jackets',
  knit_cardigan: 'knit cardigans',
  linen_blazer: 'unstructured linen blazers',
  structured_bag: 'structured bags',
  soft_tote: 'soft totes',
  minimal_jewellery: 'minimal jewellery',
  statement_jewellery: 'statement jewellery',
  classic_shoe: 'classic shoes',
  modern_shoe: 'modern shoes',
};

function piecePreferenceLabel(value: string) {
  return PIECE_PREFERENCE_LABELS[value] ?? value.replace(/_/g, ' ');
}

function summarisePiecePreferences(preferences: unknown) {
  const groups = Object.entries(asRecord(preferences));
  if (!groups.length) return 'No raw piece preference sorting was provided.';

  const lines: string[] = [];
  for (const [category, rawGroup] of groups) {
    const group = asRecord(rawGroup);
    const liked = asStringArray(group.liked).map(piecePreferenceLabel);
    const disliked = asStringArray(group.disliked).map(piecePreferenceLabel);
    const skipped = asStringArray(group.skipped).map(piecePreferenceLabel);
    lines.push(`${category}: liked=${liked.length ? liked.join(', ') : 'none'}; disliked=${disliked.length ? disliked.join(', ') : 'none'}; skipped=${skipped.length ? skipped.join(', ') : 'none'}`);
  }
  return lines.join('\n');
}

function toPalette(value: unknown, fallback: Array<{ name: string; hex: string; usage: string }>) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map(item => asRecord(item))
    .map(item => ({
      name: asString(item.name, 'Palette colour'),
      hex: /^#[0-9a-f]{6}$/i.test(asString(item.hex)) ? asString(item.hex) : '#8C8C8C',
      usage: asString(item.usage, 'Use where the colour supports your proportions.'),
      avoid_for: asString(item.avoid_for) || undefined,
    }));
  return items.length ? items : fallback;
}

function isValidHex(value: string | undefined) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '');
}

function normaliseHex(value: string) {
  return isValidHex(value) ? value.toUpperCase() : '#8C8C8C';
}

function hexToRgb(hex: string) {
  const value = normaliseHex(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function colourDistance(a: string, b: string) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return Math.sqrt(
    ((left.r - right.r) ** 2) +
    ((left.g - right.g) ** 2) +
    ((left.b - right.b) ** 2),
  );
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function colourSaturation(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

type WardrobeColourFamily = 'red' | 'pink' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'neutral';

// Hue-bucket classification so colour logic can reason in wardrobe families
// (a burgundy stays in the red family instead of snapping to the nearest
// grey by raw RGB distance). Low-saturation shades and dark browns read as
// wardrobe neutrals.
function colourFamilyOfHex(hex: string): WardrobeColourFamily {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const saturation = max === 0 ? 0 : delta / max;
  if (delta < 24 || saturation < 0.16) return 'neutral';
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta + 6) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  // Tan/camel/brown territory: orange hue but muted or dark reads as leather neutral.
  if (hue >= 15 && hue < 55 && (saturation < 0.42 || relativeLuminance(hex) < 0.18)) return 'neutral';
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 200) return 'teal';
  if (hue < 260) return 'blue';
  if (hue < 315) return 'purple';
  return 'pink';
}

function wardrobeColourFamily(colour: { name: string; hex: string }): WardrobeColourFamily {
  if (isWardrobeNeutral(colour)) return 'neutral';
  return colourFamilyOfHex(colour.hex);
}

function wardrobeColourFamilyLabel(family: WardrobeColourFamily) {
  const labels: Record<WardrobeColourFamily, string> = {
    red: 'red / burgundy / berry',
    pink: 'pink / rose / blush',
    orange: 'rust / terracotta / coral',
    yellow: 'mustard / ochre / warm gold',
    green: 'green / olive / sage',
    teal: 'teal / emerald / blue-green',
    blue: 'blue / denim / navy / stripe',
    purple: 'plum / mauve / aubergine',
    neutral: 'neutral / white / cream / black / grey / brown / denim',
  };
  return labels[family];
}

function stringHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

const BASE_PALETTE_SIZE = 15;
const ACCENT_PALETTE_SIZE = 5;

export const STYLIST_COLOUR_CLASSIFICATION_RULES = `Colour classification rules:
- Undertone is an axis, not a palette whitelist. Diagnose undertone direction separately from depth, contrast, and palette/season name.
- Use one of these undertone buckets when possible: cool, warm, neutral, olive, deep warm, neutral-cool, neutral-warm.
- Do not overuse warm-neutral or cool-neutral as a safe default. Use them only when the visual evidence genuinely sits between neutral and a temperature direction; if evidence is unclear, prefer neutral and explain the uncertainty in evidence_notes/confidence rather than forcing a hybrid label.
- palette_name should describe the full colour season/territory using depth, contrast, clarity, and temperature, for example "Deep Soft Neutral", "Clear Cool Jewel", "Muted Olive Warm", or "Balanced Neutral Contrast".
- Undertone selects the best shade inside each colour family; it must not ban whole families. Warm clients can still wear blue, green, pink, brown, and purple in warmer or deeper versions. Cool clients can still wear earth tones in cooler, clearer, or softer versions.
- Build a complete wardrobe palette across colour families. The palette should support colour diversity in outfits instead of trapping the report inside beige/navy/grey or one warm-neutral/cool-neutral lane.
- The 15 base shades must include roughly 7 neutral/ground roles plus at least 8 wearable colour shades across useful families: a blue/denim direction, a green/olive/teal direction, a red/berry/plum direction, a soft near-face colour, a mid-depth colour, a deep statement colour, a muted earthy or slate direction, and one restrained pop.
- Accent colours are small-dose directions, but they should still be distinct from each other and useful for real retail pieces.`;

type UndertoneFallbackBucket = 'cool' | 'warm' | 'neutral' | 'olive' | 'deepWarm' | 'neutralCool' | 'neutralWarm';

function normaliseUndertoneFallbackBucket(
  colour: Pick<StylistBlueprintClassification['colour'], 'undertone_direction' | 'depth' | 'contrast'>,
): UndertoneFallbackBucket {
  const undertone = (colour.undertone_direction || '').toLowerCase().replace(/[_-]+/g, ' ');
  const profile = `${undertone} ${colour.depth || ''} ${colour.contrast || ''}`.toLowerCase();
  if (/olive|yellow green|green undertone/.test(profile)) return 'olive';
  if (/deep warm|dark warm|golden deep|warm deep/.test(profile)) return 'deepWarm';
  if (/neutral\s*cool|cool\s*neutral/.test(profile)) return 'neutralCool';
  if (/neutral\s*warm|warm\s*neutral/.test(profile)) return 'neutralWarm';
  if (/\bcool\b|blue undertone|pink undertone|rosy undertone/.test(profile)) return 'cool';
  if (/\bwarm\b|golden undertone|yellow undertone|peach undertone|red undertone/.test(profile)) return 'warm';
  return 'neutral';
}

function paletteGuardrailFallbacks(
  colour: Pick<StylistBlueprintClassification['colour'], 'undertone_direction' | 'depth' | 'contrast'>,
  type: 'base' | 'accent',
) {
  const bucket = normaliseUndertoneFallbackBucket(colour);
  const isDeep = /deep|dark|high/i.test(`${colour.depth} ${colour.contrast}`);

  if (type === 'accent') {
    if (bucket === 'cool' || bucket === 'neutralCool') {
      return [
        { name: 'Berry Wine', hex: '#7A263F', usage: 'Small bags, lips, nails, evening details.' },
        { name: 'Cobalt Ink', hex: '#254B8F', usage: 'Scarves, trims, or one expressive accessory.' },
        { name: 'Cool Emerald', hex: '#0F6B58', usage: 'Jewellery stones or compact festive accents.' },
        { name: 'Rose Quartz', hex: '#C78A9B', usage: 'Soft near-face accents and delicate accessories.' },
        { name: 'Icy Pewter', hex: '#B8C1C8', usage: 'Metallic accessories and subtle shine.' },
      ];
    }
    if (bucket === 'olive') {
      return [
        { name: 'Burnt Sienna', hex: '#A2492F', usage: 'Small bags, scarves, print details, or evening accents.' },
        { name: 'Deep Teal', hex: '#1D5B59', usage: 'Compact jewel accents and near-face contrast.' },
        { name: 'Antique Gold', hex: '#9B7A2A', usage: 'Jewellery, belts, and restrained shine.' },
        { name: 'Mulberry', hex: '#74314A', usage: 'Lips, nails, scarves, or an evening clutch.' },
        { name: 'Cognac', hex: '#9A5B2F', usage: 'Leather accents and warm grounding details.' },
      ];
    }
    if (bucket === 'neutral') {
      return [
        { name: 'Mulberry', hex: '#75324D', usage: 'Small bags, lips, nails, evening details.' },
        { name: 'Deep Teal', hex: '#225C61', usage: 'Scarves, compact knits, or one expressive accessory.' },
        { name: 'Soft Coral Rose', hex: '#BD6F67', usage: 'Near-face accents and delicate accessories.' },
        { name: 'Antique Gold', hex: '#A17A2A', usage: 'Jewellery, belts, and restrained shine.' },
        { name: 'Slate Blue', hex: '#5D7187', usage: 'Soft cool accent pieces and eyewear echoes.' },
      ];
    }
    return [
        { name: 'Terracotta', hex: '#B55336', usage: 'Small bags, sandals, print details, or trims.' },
        { name: 'Marigold', hex: '#C99822', usage: 'Jewellery, scarves, festive accents, or shoe details.' },
        { name: 'Olive Gold', hex: '#7F7A2E', usage: 'Grounded accent accessories and soft prints.' },
        { name: 'Warm Coral', hex: '#C96A58', usage: 'Near-face warmth in small controlled doses.' },
        { name: 'Antique Bronze', hex: '#8A6A32', usage: 'Hardware, jewellery, belts, and evening details.' },
    ];
  }

  // 15 family-spread base shades: ~7 neutral/ground roles + ~8 wearable colours
  // so outfit lead colours rotate through real colour, not just neutrals.
  if (bucket === 'cool' || bucket === 'neutralCool') {
    return [
      { name: isDeep ? 'Ink Navy' : 'Soft Navy', hex: isDeep ? '#172338' : '#33435A', usage: 'Deep anchor for tailoring and evening structure.' },
      { name: 'Optic Soft White', hex: '#F4F5F2', usage: 'Clean shirts and face-lightening layers.' },
      { name: 'Cool Stone', hex: '#C7C8C3', usage: 'Light trousers, knits, and low-contrast supports.' },
      { name: 'Charcoal Grey', hex: '#454C54', usage: 'Structured trousers and outerwear.' },
      { name: 'Pewter', hex: '#707A7F', usage: 'Shoes, bags, and mid-depth accessories.' },
      { name: 'Soft Black', hex: '#15171C', usage: 'Evening, eyewear, and polished grounding.' },
      { name: 'Cool Ivory', hex: '#ECE8DF', usage: 'Soft bases when pure white feels too sharp.' },
      { name: 'Deep Denim', hex: '#263F5E', usage: 'Denim and smart-casual anchors.' },
      { name: 'Blue Slate', hex: '#657787', usage: 'Mid blue near the face, shirting, and softened colour.' },
      { name: 'Dusty Blue', hex: '#5E7C92', usage: 'Soft near-face colour for knits and blouses.' },
      { name: 'Burgundy', hex: '#5B2433', usage: 'Deep statement colour for dresses, knits, and evening.' },
      { name: 'Cool Emerald', hex: '#13564A', usage: 'Rich secondary colour for tops, dresses, and layers.' },
      { name: 'Petrol Teal', hex: '#1E4E54', usage: 'Cool jewel colour for blouses and knitwear.' },
      { name: 'Deep Plum', hex: '#3E2A40', usage: 'Berry/plum depth for tailoring and evening pieces.' },
      { name: 'Cool Mauve', hex: '#8E7B8E', usage: 'Soft muted colour near the face.' },
    ];
  }

  if (bucket === 'olive') {
    return [
      { name: isDeep ? 'Espresso Olive' : 'Deep Olive Brown', hex: isDeep ? '#30261E' : '#4A3A2B', usage: 'Deep anchor for bags, shoes, tailoring, and evening.' },
      { name: 'Warm Cream', hex: '#F0E7D6', usage: 'Clean shirts and face-lightening layers.' },
      { name: 'Mushroom Taupe', hex: '#A99A8A', usage: 'Trousers, knits, and soft neutral supports.' },
      { name: 'Stone Khaki', hex: '#BDB59E', usage: 'Light bottoms, layering, and tonal outfits.' },
      { name: 'Soft Black Olive', hex: '#171A14', usage: 'Evening, eyewear, and controlled grounding.' },
      { name: 'Cognac Tan', hex: '#A66A3E', usage: 'Leather, sandals, belts, and warm layers.' },
      { name: 'Muted Charcoal', hex: '#464941', usage: 'Structured trousers and outerwear.' },
      { name: 'Deep Denim', hex: '#243E5B', usage: 'Denim and professional anchors.' },
      { name: 'Forest Olive', hex: '#46553A', usage: 'Outerwear, knits, and grounded separates.' },
      { name: 'Sage Grey', hex: '#7F8978', usage: 'Soft near-face colour and relaxed layers.' },
      { name: 'Burnt Sienna', hex: '#96452B', usage: 'Deep statement colour for knits, dresses, and layers.' },
      { name: 'Rust', hex: '#7D391F', usage: 'Rich secondary colour for tops and outerwear.' },
      { name: 'Mulberry', hex: '#683048', usage: 'Berry depth for dresses and evening tailoring.' },
      { name: 'Petrol Teal', hex: '#28585A', usage: 'Jewel colour for blouses and knitwear.' },
      { name: 'Dusty Peach', hex: '#C4917B', usage: 'Soft near-face warmth and feminine pieces.' },
    ];
  }

  if (bucket === 'neutral') {
    return [
      { name: 'Soft Black', hex: '#171717', usage: 'Evening, eyewear, and polished grounding.' },
      { name: 'Soft White', hex: '#F2EEE6', usage: 'Clean shirts and face-lightening layers.' },
      { name: 'Stone', hex: '#C7C0B4', usage: 'Light trousers, knits, and low-contrast supports.' },
      { name: 'Balanced Taupe', hex: '#A8998C', usage: 'Tailoring, trousers, and soft neutral supports.' },
      { name: 'Charcoal', hex: '#44484A', usage: 'Structured trousers and outerwear.' },
      { name: 'Espresso', hex: '#33251F', usage: 'Shoes, bags, tailoring, and evening anchors.' },
      { name: 'Camel Taupe', hex: '#A77952', usage: 'Leather, sandals, belts, and warm layers.' },
      { name: 'Deep Denim', hex: '#263F5E', usage: 'Denim and smart-casual anchors.' },
      { name: 'Slate Blue', hex: '#61788B', usage: 'Soft blue near the face, shirting, and knits.' },
      { name: 'Sage', hex: '#7D8A73', usage: 'Relaxed colour for layers, knits, and casual tops.' },
      { name: 'Deep Teal', hex: '#24585D', usage: 'Jewel colour for blouses and evening pieces.' },
      { name: 'Olive', hex: '#68704C', usage: 'Grounded secondary colour for outerwear and separates.' },
      { name: 'Mulberry', hex: '#6D304A', usage: 'Berry depth for dresses and evening tailoring.' },
      { name: 'Dusty Rose', hex: '#B5828B', usage: 'Soft near-face colour and feminine pieces.' },
      { name: 'Terracotta Rose', hex: '#A75C48', usage: 'Warm feature colour for knits, dresses, and layers.' },
    ];
  }

  return [
    { name: isDeep || bucket === 'deepWarm' ? 'Espresso' : 'Deep Cocoa', hex: isDeep || bucket === 'deepWarm' ? '#33211B' : '#4B2E24', usage: 'Deep anchor for bags, shoes, tailoring, and evening.' },
    { name: 'Warm Ivory', hex: '#F4ECDF', usage: 'Clean shirts and face-lightening layers.' },
    { name: 'Soft Taupe', hex: '#B6A391', usage: 'Trousers, knits, and soft neutral supports.' },
    { name: 'Mushroom', hex: '#978A7C', usage: 'Quiet tailoring and mid-depth foundations.' },
    { name: 'Warm Black', hex: '#181412', usage: 'Evening, eyewear, and controlled grounding.' },
    { name: 'Oat Stone', hex: '#D8CFC0', usage: 'Light bottoms, layering, and tonal outfits.' },
    { name: 'Camel Tan', hex: '#B8865B', usage: 'Leather, sandals, belts, and warm layers.' },
    { name: 'Dark Indigo', hex: '#243B58', usage: 'Denim and professional anchors.' },
    { name: 'Olive Slate', hex: '#69715C', usage: 'Earthy colour for outerwear and grounded separates.' },
    { name: 'Terracotta', hex: '#9E4A2E', usage: 'Deep statement colour for knits, dresses, and layers.' },
    { name: 'Rust', hex: '#8A3B1E', usage: 'Rich secondary colour for tops and outerwear.' },
    { name: 'Dusty Peach', hex: '#C99A83', usage: 'Soft near-face colour and feminine pieces.' },
    { name: 'Marsala', hex: '#6E3438', usage: 'Berry depth for dresses and evening tailoring.' },
    { name: 'Teal Green', hex: '#2C5D55', usage: 'Cool jewel colour for blouses and knitwear.' },
    { name: 'Mustard Ochre', hex: '#9C7322', usage: 'Warm mid colour for tops and knitwear.' },
  ];
}

function enforcePaletteDiversity(
  items: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
  fallbacks: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
  target: number,
  minimumDistance: number,
) {
  const next: Array<{ name: string; hex: string; usage: string; avoid_for?: string }> = [];
  const candidates = [...items, ...fallbacks];

  for (const item of candidates) {
    const hex = normaliseHex(item.hex);
    if (next.some((existing) => colourDistance(existing.hex, hex) < minimumDistance)) continue;
    next.push({
      name: asString(item.name, 'Palette colour'),
      hex,
      usage: asString(item.usage, 'Use where the colour supports your proportions.'),
      avoid_for: asString(item.avoid_for) || undefined,
    });
    if (next.length === target) break;
  }

  for (const fallback of fallbacks) {
    if (next.length === target) break;
    const hex = normaliseHex(fallback.hex);
    if (next.some((existing) => existing.hex === hex)) continue;
    next.push({ ...fallback, hex });
  }

  return next
    .slice(0, target)
    .sort((a, b) => relativeLuminance(a.hex) - relativeLuminance(b.hex));
}

const BASE_PALETTE_FAMILY_RULES: Array<{ key: string; pattern: RegExp }> = [
  { key: 'neutral', pattern: /\b(black|ink|charcoal|grey|gray|stone|ivory|cream|white|taupe|mushroom|camel|tan|espresso|cocoa|chocolate|brown|khaki)\b/i },
  { key: 'blue', pattern: /\b(navy|denim|blue|indigo|cobalt|slate)\b/i },
  { key: 'green', pattern: /\b(green|olive|sage|teal|emerald|forest|petrol)\b/i },
  { key: 'berry', pattern: /\b(red|berry|plum|burgundy|wine|marsala|mulberry|mauve|rose|pink)\b/i },
  { key: 'softNearFace', pattern: /\b(soft|dusty|near-face|face-lightening|face|peach|rose|mauve|sage|ivory|cream|white)\b/i },
];

function paletteFamilyText(colour: { name: string; usage?: string }) {
  return `${colour.name} ${colour.usage ?? ''}`;
}

function paletteHasFamily(
  items: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
  pattern: RegExp,
) {
  return items.some(item => pattern.test(paletteFamilyText(item)));
}

function familyCoverage(
  items: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
) {
  return BASE_PALETTE_FAMILY_RULES.map(rule => ({
    key: rule.key,
    present: paletteHasFamily(items, rule.pattern),
  }));
}

function enforceBasePaletteFamilySpread(
  items: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
  fallbacks: Array<{ name: string; hex: string; usage: string; avoid_for?: string }>,
) {
  const next = [...items];
  for (const rule of BASE_PALETTE_FAMILY_RULES) {
    if (paletteHasFamily(next, rule.pattern)) continue;
    const fallback = fallbacks.find(item =>
      rule.pattern.test(paletteFamilyText(item)) &&
      !next.some(existing => normaliseHex(existing.hex) === normaliseHex(item.hex))
    );
    if (!fallback) continue;

    const protectedIndexes = new Set<number>();
    for (const existingRule of BASE_PALETTE_FAMILY_RULES) {
      const firstIndex = next.findIndex(item => existingRule.pattern.test(paletteFamilyText(item)));
      if (firstIndex >= 0) protectedIndexes.add(firstIndex);
    }
    const replacementIndex = next.findIndex((_, index) => !protectedIndexes.has(index));
    next[replacementIndex >= 0 ? replacementIndex : next.length - 1] = {
      ...fallback,
      hex: normaliseHex(fallback.hex),
    };
  }
  return next.sort((a, b) => relativeLuminance(a.hex) - relativeLuminance(b.hex));
}

function applyColourGuardrails(classification: StylistBlueprintClassification): StylistBlueprintClassification {
  const baseFallbacks = paletteGuardrailFallbacks(classification.colour, 'base');
  const accentFallbacks = paletteGuardrailFallbacks(classification.colour, 'accent');
  // Scale the diversity threshold to the client's diagnosed contrast so a
  // genuinely soft, low-contrast season keeps its tonal palette instead of
  // being forced apart into generic high-contrast colours.
  const contrast = (classification.colour.contrast || '').toLowerCase();
  // Lower thresholds than before because we now pack 15 related-but-distinct
  // base shades; too high a threshold would discard the client's real colours.
  const baseMinDistance = /low/.test(contrast) ? 22 : /high/.test(contrast) ? 40 : 30;
  const accentMinDistance = /low/.test(contrast) ? 34 : 48;
  const base_palette = enforceBasePaletteFamilySpread(
    enforcePaletteDiversity(classification.colour.base_palette, baseFallbacks, BASE_PALETTE_SIZE, baseMinDistance),
    baseFallbacks,
  );
  const accent_palette = enforcePaletteDiversity(classification.colour.accent_palette, accentFallbacks, ACCENT_PALETTE_SIZE, accentMinDistance);

  return {
    ...classification,
    colour: {
      ...classification.colour,
      base_palette,
      accent_palette,
      palette: [...base_palette, ...accent_palette].map(({ name, hex, usage }) => ({ name, hex, usage })),
    },
  };
}

export function buildStylistBlueprintColourGuardrailSummaryForTest(
  colour: Pick<StylistBlueprintClassification['colour'], 'undertone_direction' | 'depth' | 'contrast' | 'base_palette' | 'accent_palette'>,
) {
  const guarded = applyColourGuardrails({
    client: { name: '', email: '', country: '', age_range: '', language: '', lifestyle_summary: '' },
    body: { geometry: '', focus_areas: [], proportion_directive: '', coverage_rules: [], silhouette_rules: [] },
    colour: {
      undertone_direction: colour.undertone_direction,
      depth: colour.depth,
      contrast: colour.contrast,
      palette_name: '',
      base_palette: colour.base_palette,
      accent_palette: colour.accent_palette,
      palette: [],
      avoid_colours: [],
    },
    face_hair_accessories: {
      face_shape: '',
      face_direction: '',
      hair_direction: '',
      hair_colour_direction: '',
      hair_colour_options: [],
      neckline_direction: '',
      jewellery_direction: '',
      eyewear_direction: '',
      approved_necklines: [],
      hair_styles: [],
      eyewear_shapes: [],
      earring_shapes: [],
    },
    makeup: { style: '', everyday_direction: '', steps: [], colours: [] },
    taste: { style_archetype: '', moodboard: '', signature_codes: [], anti_codes: [], shopping_filters: [] },
    fabrics: { approved: [], avoid: [] },
  }).colour;
  return {
    bucket: normaliseUndertoneFallbackBucket(colour),
    baseNames: guarded.base_palette.map(item => item.name),
    accentNames: guarded.accent_palette.map(item => item.name),
    coverage: familyCoverage(guarded.base_palette),
  };
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const cause = err instanceof Error && err.cause ? ` ${String((err.cause as { message?: string })?.message ?? err.cause).toLowerCase()}` : '';
      const message = (err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()) + cause;
      // Retry on Gemini overload/quota signals AND on transient network failures
      // (undici "fetch failed", resets, timeouts), which otherwise kill a whole
      // multi-minute generation on a single blip.
      const transient = err instanceof SyntaxError // malformed JSON from the model — a fresh generation almost always parses (only JSON calls throw this)
        || message.includes('503') || message.includes('429') || message.includes('quota') || message.includes('overloaded')
        || message.includes('fetch failed') || message.includes('econnreset') || message.includes('etimedout')
        || message.includes('enotfound') || message.includes('eai_again') || message.includes('terminated')
        || message.includes('aborted') || message.includes('aborterror')
        || message.includes('socket') || message.includes('network') || message.includes('empty text response');
      if (!transient || attempt === maxAttempts - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 4000 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

async function callGeminiJSON(prompt: string, imageUrls: string[] = []): Promise<unknown> {
  return withRetry(async () => {
    const imageParts = await Promise.all(imageUrls.slice(0, 4).map(fetchImagePart).filter(Boolean));
    const parts = [{ text: prompt }, ...imageParts.filter((part): part is { inlineData: { mimeType: string; data: string } } => Boolean(part))];
    const response = await ai.models.generateContent({
      model: STYLIST_BLUEPRINT_TEXT_MODEL,
      contents: [{ parts }],
      config: { httpOptions: { timeout: GEMINI_TEXT_TIMEOUT_MS } },
    });
    return JSON.parse(cleanJson(response.text ?? '{}'));
  });
}

async function callGeminiText(
  prompt: string,
  model: string = STYLIST_BLUEPRINT_TEXT_MODEL,
  options: { timeoutMs?: number; maxAttempts?: number } = {},
): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { httpOptions: { timeout: options.timeoutMs ?? GEMINI_TEXT_TIMEOUT_MS } },
    });
    const text = response.text?.trim() ?? '';
    if (!text) throw new Error('Gemini returned an empty text response');
    return text;
  }, options.maxAttempts ?? 3);
}

async function fetchImagePart(url: string | null | undefined): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    return { inlineData: { mimeType, data: buffer.toString('base64') } };
  } catch {
    return null;
  }
}

export function buildStylistBlueprintIntakeDigest(submission: StylistIntakeSubmission) {
  const culturalMode = getStylistOutfitCulturalMode(submission);
  const wantsEthnic = culturalMode === 'ethnic_allowed';
  const indiaContext = isIndianStylistIntake(submission)
    ? `
India Market Context:
- Client market is India. Use INR/₹ if any price or budget language is needed; never use USD, dollars, American pricing, US sizing, or US department-store assumptions.
- Assume Indian retail availability, Indian office/social/festive contexts, warm-weather practicality, and realistic Indian tailoring/alteration access.
${wantsEthnic
  ? `- This client has expressed interest in Indian/ethnic wear. Use kurtas, sarees/saris, co-ords, juttis, sandals, dupattas, and Indian festive pieces where they match the client's stated preferences and lifestyle.
- Keep western/formal preferences intact when the notes ask for western, formals, trousers, tops, midis, or evening wear.`
  : `- CLIENT TRUTH FIRST (overrides the outfit library and its "for Indian clients include Indianwear" defaults): this client has NOT expressed any Indian/ethnic clothing preference anywhere in the intake. Generate EVERY outfit and every outfit image in Western / contemporary style worlds only.
- Do NOT use Indianwear, kurtas, kurtis, sarees/saris, lehengas, anarkalis, salwar/churidar, shararas, dupattas, juttis, or any ethnic/festive pieces in any outfit. India Market Context here is about pricing and retail realism only, not about defaulting to ethnic clothing.`}
`
    : '';
  return `Client:
Name: ${intakeDisplayName(submission)}
Email: ${submission.customer_email || ''}
Phone: ${submission.customer_phone || ''}
Country: ${submission.country || ''}
Age Range: ${submission.age_range || ''}
Language: ${submission.primary_language || ''}
Intake Source: ${submission.intake_source || 'customer_form'}
Outfit Cultural Mode: ${culturalMode}

Measurements:
${stringify(submission.body_measurements)}

Photos:
${stringify(submission.photo_urls)}

Focus Areas:
${stringify(submission.focus_areas)}

Coverage Requirements:
${stringify(submission.coverage_requirements)}

Lifestyle:
${stringify(submission.lifestyle_context)}

Piece Preferences:
${stringify(submission.piece_preferences)}

Moodboard:
Selected: ${submission.selected_moodboard_label || submission.selected_moodboard_id || ''}
Secondary Elements: ${stringify(submission.secondary_moodboard_elements)}

Hair Context:
${stringify(submission.hair_context)}

Skin Tone Self Description:
${submission.skin_tone_self_description || ''}

Shopping Relationship:
${submission.shopping_relationship || ''}

Prior Styling Experience:
${stringify(submission.prior_styling_experience)}

Loved Outfit:
Description: ${submission.one_outfit_description || ''}
Image URL: ${submission.one_outfit_image_url || ''}

Raw Consultation Notes:
${submission.raw_consultation_notes || ''}
${indiaContext}`;
}

function buildStylistBlueprintOutfitClassificationContext(reportData: StylistBlueprintReportData) {
  const classification = reportData.classification;
  const colour = classification.colour;
  return `Colour Direction:
Undertone: ${colour.undertone_direction || 'not specified'}
Depth: ${colour.depth || 'not specified'}
Contrast: ${colour.contrast || 'not specified'}
Palette category/name: ${colour.palette_name || 'not specified'}
Avoid colour families: ${colour.avoid_colours?.length ? colour.avoid_colours.join(', ') : 'none specified'}
Use realistic, buyable colours that support this undertone/depth/contrast direction.
Do not use a fixed palette list. Exact base_palette, accent_palette, colour names, and hex codes are intentionally withheld from the outfit engine.

Body / Coverage Context:
Geometry: ${classification.body.geometry}
Focus areas: ${classification.body.focus_areas.join(', ')}
Proportion directive: ${classification.body.proportion_directive}
Coverage rules: ${classification.body.coverage_rules.join('; ')}
Silhouette rules: ${classification.body.silhouette_rules.join('; ')}

Face / Hair / Accessories Context:
Face shape: ${classification.face_hair_accessories.face_shape}
Face direction: ${classification.face_hair_accessories.face_direction}
Hair direction: ${classification.face_hair_accessories.hair_direction}
Neckline direction: ${classification.face_hair_accessories.neckline_direction}
Jewellery direction: ${classification.face_hair_accessories.jewellery_direction}
Eyewear direction: ${classification.face_hair_accessories.eyewear_direction}
Approved necklines: ${classification.face_hair_accessories.approved_necklines.join(', ')}
Eyewear shapes: ${classification.face_hair_accessories.eyewear_shapes.join(', ')}
Earring shapes: ${classification.face_hair_accessories.earring_shapes.join(', ')}

Taste Context:
Moodboard: ${classification.taste.moodboard}
Style archetype: ${classification.taste.style_archetype}
Signature codes: ${classification.taste.signature_codes.join(', ')}
Anti-codes: ${classification.taste.anti_codes.join(', ')}
Shopping filters: ${classification.taste.shopping_filters.join(', ')}
Taste anti-codes and shopping filters are light context unless they express coverage, modesty, fit safety, or realism.`;
}

function outfitPlanForHarnessPrompt(plan: PlannedOutfit, previousPlan?: PlannedOutfit, nextPlan?: PlannedOutfit) {
  const suggestedFamily = wardrobeColourFamily(plan.lead_colour);
  const previousFamily = previousPlan ? wardrobeColourFamily(previousPlan.lead_colour) : undefined;
  const nextFamily = nextPlan ? wardrobeColourFamily(nextPlan.lead_colour) : undefined;
  return {
    outfit_number: plan.outfit_number,
    page_number: plan.page_number,
    purpose: plan.purpose ?? 'detailed_report',
    display_outfit_number: plan.display_outfit_number,
    cultural_mode: plan.cultural_mode,
    capsule: plan.capsule,
    eyewear_required: plan.eyewear_required,
    eyewear_piece: plan.eyewear_required ? plan.eyewear_piece : undefined,
    layer_required: plan.layer_required,
    layer_type: plan.layer_type,
    formula_direction: plan.formula_direction,
    coverage_requires_cover: plan.coverage_requires_cover,
    coverage_instruction: plan.coverage_requires_cover && !plan.layer_required
      ? 'No separate layer is planned for this outfit; cover the upper arms through sleeve length, shoulder coverage, fabric drape, or one-piece cut.'
      : undefined,
    pattern_required: plan.pattern_required,
    pattern_instruction: plan.pattern_instruction,
    texture_direction: plan.texture_direction,
    pattern_direction: plan.pattern_direction,
    finishing_required: plan.finishing_required,
    finishing_detail_type: plan.finishing_detail_type,
    colour_strategy: {
      authority: 'soft guidance only; choose the most realistic colour story from the library skeleton, client undertone direction, classic wardrobe combinations, and category context',
      suggested_dominant_family: wardrobeColourFamilyLabel(suggestedFamily),
      adjacent_previous_family: previousFamily ? wardrobeColourFamilyLabel(previousFamily) : undefined,
      adjacent_next_family: nextFamily ? wardrobeColourFamilyLabel(nextFamily) : undefined,
      spacing_rule: 'do not make this outfit visually similar to the previous outfit; avoid repeating the same dominant family in adjacent outfits unless the library skeleton makes it clearly different',
      undertone_rule: 'undertone matters most near the face; choose warm/cool/olive/neutral versions inside broad colour families instead of banning the family',
      classic_combinations_allowed: [
        'white or ivory shirt with blue stripes',
        'denim or chambray with ivory, tan, chocolate, navy, or black',
        'navy blazer with cream, white, denim, tan, or grey',
        'black dress or column with flattering metal, leather, or scarf finish',
        'blue shirt with tan or chocolate leather',
        'cream knit with denim, olive, burgundy, black, or camel',
      ],
      avoid: [
        'do not use exact 15-palette shades as a cage',
        'do not repeat teal/green/blue-adjacent looks back-to-back',
        'do not make colour appear only in tiny accessories across the set',
      ],
    },
    max_visible_colours: plan.max_visible_colours,
    styling_decision: {
      outfit_message: plan.styling_decision.outfit_message,
      body_strategy: plan.styling_decision.body_strategy,
      colour_world: plan.styling_decision.colour_world,
      anchor_role: plan.styling_decision.anchor_role,
      anchor_piece: plan.styling_decision.anchor_piece,
      silhouette_formula: plan.styling_decision.silhouette_formula,
      fabric_rules: plan.styling_decision.fabric_rules,
      neckline_rules: plan.styling_decision.neckline_rules,
      accessory_rules: plan.styling_decision.accessory_rules,
    },
    library_reference: plan.library_reference,
    library_piece_logic: plan.library_piece_logic,
  };
}

function outfitPlansForHarnessPrompt(plans: PlannedOutfit[]) {
  return plans.map((plan, index) => outfitPlanForHarnessPrompt(plan, plans[index - 1], plans[index + 1]));
}

function photoUrls(submission: StylistIntakeSubmission) {
  const photos = submission.photo_urls ?? {};
  return [
    photos.headshot,
    photos.full_body_front,
    photos.full_body_side,
    photos.one_outfit,
    submission.one_outfit_image_url,
  ].filter((url): url is string => typeof url === 'string' && Boolean(url));
}

export async function classifyStylistBlueprint(submission: StylistIntakeSubmission): Promise<StylistBlueprintClassification> {
  const stylistOutfitLibrary = outfitLibraryPromptForContext(seedOutfitLibraryContext());
  const fallbackBase = [
    { name: 'Warm Ivory', hex: '#F5F0E8', usage: 'Base layers and clean negative space.' },
    { name: 'Soft Taupe', hex: '#B8A898', usage: 'Tailoring, trousers, and soft neutrals.' },
    { name: 'Clay', hex: '#B85C38', usage: 'Structured tops and accent knits.' },
    { name: 'Olive Slate', hex: '#6F7A5E', usage: 'Outerwear and grounded separates.' },
    { name: 'Deep Cocoa', hex: '#4B2E24', usage: 'Shoes, bags, and evening anchors.' },
  ];
  const prompt = `You are ICONIK's women Blueprint classification engine.
Return ONLY valid JSON. Do not use markdown.

Use the attached intake images when available plus the structured intake below.
Evidence discipline:
- Use relative visual language unless the client supplied exact measurements.
- Do not invent exact cm differences or exact percentages from photos.
- Do not diagnose medical or sensitive traits.

Preference discipline:
- Piece preferences are not outfit quotas. Liked form choices are broad taste cues only; do not turn them into repeated signature requirements.
- Disliked/No form choices, explicit avoid notes, coverage needs, modesty, fit safety, and lifestyle constraints should become anti_codes, shopping_filters, or coverage/silhouette rules where relevant.
- Skipped form choices are neutral. Do not infer dislike, absence, or hidden taste from skipped items.
- Moodboard, loved outfit, and secondary elements describe register and emotional comfort; never copy them literally or let them override body, coverage, undertone, or explicit dislikes.

${STYLIST_COLOUR_CLASSIFICATION_RULES}

Required JSON shape:
{
  "client": {"name":"","email":"","country":"","age_range":"","language":"","lifestyle_summary":""},
  "body": {"geometry":"","focus_areas":[""],"proportion_directive":"","coverage_rules":[""],"silhouette_rules":[""]},
  "colour": {
    "undertone_direction":"","depth":"","contrast":"","palette_name":"",
    "base_palette":[{"name":"","hex":"","usage":"","avoid_for":""}],
    "accent_palette":[{"name":"","hex":"","usage":"","avoid_for":""}],
    "palette":[{"name":"","hex":"","usage":""}],
    "avoid_colours":[""]
  },
  "face_hair_accessories": {
    "face_shape":"","face_direction":"","hair_direction":"","hair_colour_direction":"","hair_colour_options":[""],"neckline_direction":"","jewellery_direction":"","eyewear_direction":"",
    "approved_necklines":[""],"hair_styles":[""],"eyewear_shapes":[""],"earring_shapes":[""]
  },
  "makeup": {"style":"","everyday_direction":"","steps":[""],"colours":[""]},
  "taste": {"style_archetype":"","moodboard":"","signature_codes":[""],"anti_codes":[""],"shopping_filters":[""]},
  "fabrics": {"approved":[{"name":"","reason":""}],"avoid":[{"name":"","reason":""}]}
}

Hair colour and makeup guidance:
- hair_colour_direction: one short paragraph on the best hair-colour/highlight direction for this client's depth, undertone, and existing hairstyle — classy, feminine, salon-achievable, and close enough to her natural depth to look expensive.
- hair_colour_options: exactly 4 concrete, flattering hair-colour/highlight names (e.g. "soft caramel face-framing highlights", "warm chestnut gloss", "subtle honey balayage on existing layers", "deep espresso with soft lowlights") ordered safest-first, matched to undertone, depth, and existing hairstyle. Avoid fantasy colours, stripy highlights, harsh contrast, and brassy tones.
- makeup.style + makeup.everyday_direction: describe a subtle natural everyday makeup look for this client (skin-first, soft, barely-there, not glam, not bridal, not party makeup).
- makeup.steps: exactly 5 short ordered steps to achieve the everyday look (base/skin, brows, eyes, cheeks, lips), each one concise and product-type only — no brand names, no medical or clinical claims, no heavy contour, false lashes, glitter, smoky eyes, or bold lipstick.
- makeup.colours: 3-4 soft flattering everyday shade directions (natural lip, soft cheek, gentle eye) tied to the client's undertone and palette; keep them muted, wearable, and realistic.

Return exactly 15 base_palette colours and exactly 5 accent_palette colours with accurate hex codes.
This is a classy, wearable wardrobe palette, not a colour-theory showcase. Keep enough neutral grounding for real outfits, but do not let neutrals dominate so heavily that the recommendations lose colour diversity.
The 15 base shades must span colour families, not only neutrals: roughly 7 neutral/grounding roles (deep anchor, light neutral, soft neutral, grey/slate, taupe/brown, black/ink, off-white) plus roughly 8 genuinely wearable, undertone-flattering colours the client would actually buy (e.g. a soft near-face colour, a denim/blue, a green/olive/teal, a berry/plum/wine, a dusty pastel, a muted earthy/slate shade, one deep statement colour, and one restrained pop). Keep every colour muted-to-medium in saturation; avoid neon, primary, or hard-to-find shades. Every base shade must flatter the client's undertone, depth, and contrast.
The 5 accent colours are smaller-dose feature colours used for a single knit, top, layer, scarf, belt, jewellery stone, or evening clutch — still realistic, retail-available shades, never loud novelty colours.

--- STYLIST STYLING PRINCIPLES ---
${STYLIST_STYLING_PRINCIPLES}

--- STYLIST OUTFIT LIBRARY ---
${stylistOutfitLibrary}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  const colour = asRecord(raw.colour);
  const face = asRecord(raw.face_hair_accessories);
  const classification: StylistBlueprintClassification = {
    client: {
      name: asString(asRecord(raw.client).name, intakeDisplayName(submission)),
      email: submission.customer_email || '',
      country: asString(asRecord(raw.client).country, submission.country || ''),
      age_range: asString(asRecord(raw.client).age_range, submission.age_range || ''),
      language: asString(asRecord(raw.client).language, submission.primary_language || 'English'),
      lifestyle_summary: asString(asRecord(raw.client).lifestyle_summary, 'A practical wardrobe built around your real contexts.'),
    },
    body: {
      geometry: asString(asRecord(raw.body).geometry, 'Balanced vertical profile'),
      focus_areas: asStringArray(asRecord(raw.body).focus_areas).length ? asStringArray(asRecord(raw.body).focus_areas) : submission.focus_areas ?? [],
      proportion_directive: asString(asRecord(raw.body).proportion_directive, 'Create longer vertical lines and avoid unnecessary horizontal breaks.'),
      coverage_rules: asStringArray(asRecord(raw.body).coverage_rules),
      silhouette_rules: asStringArray(asRecord(raw.body).silhouette_rules),
    },
    colour: {
      undertone_direction: asString(colour.undertone_direction, 'neutral'),
      depth: asString(colour.depth, 'medium'),
      contrast: asString(colour.contrast, 'medium'),
      palette_name: asString(colour.palette_name, 'Balanced Neutral Spectrum'),
      base_palette: toPalette(colour.base_palette, fallbackBase).slice(0, BASE_PALETTE_SIZE),
      accent_palette: toPalette(colour.accent_palette, fallbackBase).slice(0, ACCENT_PALETTE_SIZE),
      palette: toPalette(colour.palette, fallbackBase),
      avoid_colours: asStringArray(colour.avoid_colours),
    },
    face_hair_accessories: {
      face_shape: asString(face.face_shape, 'oval'),
      face_direction: asString(face.face_direction, 'Keep visual weight balanced around cheekbone level.'),
      hair_direction: asString(face.hair_direction, 'Soft structure and controlled movement around the face.'),
      hair_colour_direction: asString(face.hair_colour_direction, 'Stay close to your natural depth with soft, face-framing warmth.'),
      hair_colour_options: asStringArray(face.hair_colour_options).slice(0, 4),
      neckline_direction: asString(face.neckline_direction, 'Open necklines that lengthen without widening unnecessarily.'),
      jewellery_direction: asString(face.jewellery_direction, 'Medium-scale geometry with vertical movement.'),
      eyewear_direction: asString(face.eyewear_direction, 'Frames with gentle structure and lifted outer edges.'),
      approved_necklines: asStringArray(face.approved_necklines).slice(0, 6),
      hair_styles: asStringArray(face.hair_styles).slice(0, 4),
      eyewear_shapes: asStringArray(face.eyewear_shapes).slice(0, 4),
      earring_shapes: asStringArray(face.earring_shapes).slice(0, 4),
    },
    makeup: {
      style: asString(asRecord(raw.makeup).style, 'Natural, skin-first everyday'),
      everyday_direction: asString(asRecord(raw.makeup).everyday_direction, 'A soft, natural everyday look that evens the skin and warms the features without heaviness.'),
      steps: asStringArray(asRecord(raw.makeup).steps).slice(0, 5),
      colours: asStringArray(asRecord(raw.makeup).colours).slice(0, 4),
    },
    taste: {
      style_archetype: asString(asRecord(raw.taste).style_archetype, submission.selected_moodboard_label || 'Structured Minimalist'),
      moodboard: asString(asRecord(raw.taste).moodboard, submission.selected_moodboard_label || 'Structured Minimalist'),
      signature_codes: asStringArray(asRecord(raw.taste).signature_codes),
      anti_codes: asStringArray(asRecord(raw.taste).anti_codes),
      shopping_filters: asStringArray(asRecord(raw.taste).shopping_filters),
    },
    fabrics: {
      approved: Array.isArray(asRecord(raw.fabrics).approved) ? asRecord(raw.fabrics).approved as Array<{ name: string; reason: string }> : [],
      avoid: Array.isArray(asRecord(raw.fabrics).avoid) ? asRecord(raw.fabrics).avoid as Array<{ name: string; reason: string }> : [],
    },
  };

  const deterministicCoverage = mergeCoverageProfiles(
    coverageProfileFromSubmission(submission),
    coverageProfileFromClassification(classification),
  );
  const deterministicRules = deterministicCoverageRulesFromProfile(deterministicCoverage);
  if (deterministicRules.length) {
    classification.body.coverage_rules = [
      ...classification.body.coverage_rules,
      ...deterministicRules,
    ].filter((rule, index, arr) => arr.indexOf(rule) === index);
  }
  if (deterministicCoverage.neckline) {
    classification.face_hair_accessories.neckline_direction = 'No cleavage or very low necklines; safe open necklines are allowed when covered.';
    classification.face_hair_accessories.approved_necklines = deterministicCoverage.approvedNecklines.slice(0, 6);
    classification.taste.anti_codes = [
      ...classification.taste.anti_codes,
      'No cleavage or very low necklines.',
    ].filter((rule, index, arr) => arr.indexOf(rule) === index).slice(0, 12);
  }

  if (classification.colour.base_palette.length < BASE_PALETTE_SIZE) {
    classification.colour.base_palette = [
      ...classification.colour.base_palette,
      ...paletteGuardrailFallbacks(classification.colour, 'base'),
    ].slice(0, BASE_PALETTE_SIZE);
  }
  if (classification.colour.accent_palette.length < ACCENT_PALETTE_SIZE) {
    classification.colour.accent_palette = [
      ...classification.colour.accent_palette,
      ...paletteGuardrailFallbacks(classification.colour, 'accent'),
    ].slice(0, ACCENT_PALETTE_SIZE);
  }
  if (!classification.face_hair_accessories.approved_necklines.length) {
    classification.face_hair_accessories.approved_necklines = ['Open collar', 'Soft V', 'High scoop', 'Modest square', 'Soft boat', 'Crew neck'];
  }
  if (!classification.face_hair_accessories.hair_styles.length) {
    classification.face_hair_accessories.hair_styles = ['Soft face-framing layers', 'Collarbone length', 'Low polished bun', 'Side-parted shoulder length'];
  }
  if (!classification.face_hair_accessories.eyewear_shapes.length) {
    classification.face_hair_accessories.eyewear_shapes = ['Soft rectangle', 'Subtle cat-eye', 'Rounded square', 'Light geometric'];
  }

  return applyColourGuardrails(classification);
}

export function createBlueprintShell(
  submission: StylistIntakeSubmission,
  classification: StylistBlueprintClassification,
  existingPages: BlueprintPage[] = [],
): StylistBlueprintReportData {
  const generatedAt = new Date().toISOString();
  const monthYear = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
  return {
    version: STYLIST_BLUEPRINT_VERSION,
    generated_at: generatedAt,
    client: {
      display_name: classification.client.name || intakeDisplayName(submission),
      email: submission.customer_email || '',
      month_year: monthYear,
    },
    analysis: {
      silhouette_profile: classification.body.geometry,
      chromatic_family: classification.colour.palette_name,
      facial_architecture: `${classification.face_hair_accessories.face_shape} - ${classification.face_hair_accessories.face_direction}`,
      style_direction: classification.taste.style_archetype,
      proportional_focus: classification.body.focus_areas.length
        ? classification.body.focus_areas
        : ['Vertical extension', 'balanced focal points', 'context-specific polish'],
      evidence_notes: [
        'Analysis uses submitted images, optional measurements, intake preferences, and lifestyle context.',
        'Relative visual ratios are used where exact measurements were not supplied.',
        'Recommendations preserve cultural, coverage, and comfort requirements from intake.',
      ],
      confidence: {
        body: submission.photo_urls?.full_body_front || submission.photo_urls?.full_body_side ? 'high' : 'medium',
        colour: submission.photo_urls?.headshot || submission.skin_tone_self_description ? 'medium' : 'low',
        face: submission.photo_urls?.headshot ? 'high' : 'medium',
      },
    },
    classification,
    pages: existingPages,
  };
}

type PlannedOutfitColour = {
  name: string;
  hex: string;
  role: BlueprintColourUse['role'];
};

type EyewearRole = 'authority' | 'softness' | 'modernity' | 'luxury_polish' | 'colour_echo';

export type StylistCoverageProfile = {
  neckline: boolean;
  arms: boolean;
  legs: boolean;
  opacity: boolean;
  looseFit: boolean;
  fullModesty: boolean;
  reasons: string[];
  approvedNecklines: string[];
  bannedNecklines: string[];
};

type StylingDecisionPlan = {
  outfit_message: string;
  body_strategy: string;
  colour_world: string;
  anchor_role: 'blazer' | 'trouser' | 'shirt_blouse' | 'dress' | 'layer' | 'skirt' | 'set';
  anchor_piece: string;
  silhouette_formula: string;
  fabric_rules: string;
  neckline_rules: {
    coverage_required: boolean;
    approved: string[];
    banned: string[];
    instruction: string;
  };
  accessory_rules: string;
  mirror_test: string[];
};

type PlannedOutfit = {
  outfit_number: number;
  page_number: number;
  purpose?: 'transformation_preview' | 'detailed_report';
  display_outfit_number?: number;
  cultural_mode: StylistOutfitCulturalMode;
  capsule: 'Professional' | 'Social' | 'Everyday' | 'Occasion';
  formula_direction: string;
  texture_direction: string;
  pattern_direction: string;
  pattern_required: boolean;
  pattern_instruction?: string;
  lead_colour: PlannedOutfitColour;
  support_colour: PlannedOutfitColour;
  ground_colour?: PlannedOutfitColour;
  accent_colour?: PlannedOutfitColour;
  accent_application?: {
    slot: string;
    piece: string;
    guidance: string;
  };
  accent_mode?: 'layer' | 'top' | 'detail';
  finishing_required: boolean;
  finishing_detail_type?: 'scarf' | 'belt' | 'watch' | 'hair_detail' | 'lip_tone';
  layer_required: boolean;
  layer_type?: string;
  coverage_requires_cover: boolean;
  coverage_profile: StylistCoverageProfile;
  styling_decision: StylingDecisionPlan;
  eyewear_required: boolean;
  eyewear_role?: EyewearRole;
  eyewear_piece?: string;
  max_visible_colours: 3;
  library_reference?: BlueprintLibraryRef;
  library_piece_logic?: Array<{ slot: string; piece: string; source: 'primary' }>;
};

const CAPSULE_SEQUENCE: PlannedOutfit['capsule'][] = ['Professional', 'Social', 'Everyday', 'Occasion'];
// Capsule-appropriate layer pools so blazers stay mostly Professional and each
// occasion gets realistic, varied outerwear instead of repeated blazers.
const LAYER_TYPES_BY_CAPSULE: Record<PlannedOutfit['capsule'], string[]> = {
  Professional: [
    'single-breasted blazer',
    'longline tailored vest',
    'structured jacket',
    'fine-knit cardigan',
    'tailored overshirt',
  ],
  Social: [
    'cropped jacket',
    'soft drape duster',
    'fine-knit cardigan',
    'longline vest',
    'relaxed blazer',
  ],
  Everyday: [
    'bold striped cotton overshirt worn open',
    'cropped denim jacket',
    'lightweight utility jacket',
    'relaxed chambray shirt-jacket',
    'open cotton-linen shirt',
  ],
  Occasion: [
    'cropped evening jacket',
    'fluid duster coat',
    'embellished bolero',
    'satin-trim jacket',
    'long draped layer',
  ],
};

const FORMULA_DIRECTIONS: Record<PlannedOutfit['capsule'], string[]> = {
  Professional: [
    'tailored trouser + polished top + structured outer frame',
    'one-piece dress or column + professional layer + refined shoe',
    'shirt/blouse + clean skirt or trouser + minimal accessories',
    'soft knit or shell + longline vest/blazer + tailored bottom',
    'monochrome-leaning base broken by contrast layer and neutral leather',
  ],
  Social: [
    'defined top + fluid skirt/trouser + compact evening accessory',
    'dress-led look with one structural counterpoint',
    'elevated denim or trouser + refined blouse + lower-contrast shoe',
    'soft statement layer + simple base + jewellery focal point',
    'tonal evening separates with one clear contrast bridge',
  ],
  Everyday: [
    'travel/off-duty base tank or tee + bold striped open overshirt + wide-leg cotton/linen trouser + white leather sneaker + structured tote',
    'cropped denim jacket or chambray shirt-jacket + clean base + relaxed trouser/denim + sneaker or flat',
    'striped shirt, eyelet blouse, or polished tee + denim/chino/skirt + belt + leather flat',
    'shirt dress, wrap dress, or printed cotton dress only when styled with sneakers/sandals and modern accessories',
    'knit/shell + satin/denim skirt or wide-leg trouser + belt, contemporary sunglasses, and practical bag',
  ],
  Occasion: [
    'dress, tailored trouser set, satin-skirt look, or polished co-ord + refined heel/sandal + compact bag',
    'polished co-ord + jewellery accent + clean neutral grounding',
    'fluid festive layer + simple base + metallic or leather bridge',
    'evening separates with one luminous near-face detail',
    'statement silhouette controlled by restrained palette placement',
  ],
};

const NO_LAYER_FORMULA_DIRECTIONS: Record<PlannedOutfit['capsule'], string[]> = {
  Professional: [
    'polished sleeve-led blouse + tailored trouser + refined shoe and bag',
    'structured knit shell with elbow or bracelet sleeves + midi skirt + slim belt',
    'one-piece work dress with real sleeves + classic shoe + structured bag',
    'detailed-collar top with sleeves + cigarette trouser + watch or scarf finish',
    'clean minimal top with sleeve coverage + wide-leg trouser + leather grounding',
  ],
  Social: [
    'draped sleeve-led top + fluid skirt or trouser + compact bag',
    'dress-led look with real sleeves + refined shoe + one finishing detail',
    'elevated denim or trouser + detailed blouse + lower-contrast shoe',
    'soft statement top + simple bottom + bag or belt focal point',
    'tonal separates with sleeve coverage and one clear contrast bridge',
  ],
  Everyday: [
    'striped shirt, eyelet blouse, polished tee, or sleeve-led knit + denim/chino/wide-leg trouser + clean sneaker or flat',
    'relaxed cotton or linen shirt with sleeve coverage + grounded bottom + tote or crossbody',
    'shirt dress, wrap dress, or printed cotton dress with real sleeves + practical sneaker/sandal',
    'non-clingy top + non-clingy bottom + belt, watch, cap, or sunglasses detail',
    'casual column shaped by hem, sleeve, belt, sneaker, or bag contrast',
  ],
  Occasion: [
    'sleeved dress, satin-skirt look, trouser set, or polished co-ord + refined heel/sandal',
    'polished co-ord with sleeve coverage + compact bag + jewellery accent',
    'evening separates with a luminous near-face detail and no outer layer',
    'statement silhouette controlled by neckline, sleeve, and restrained palette placement',
    'dress or skirt-led occasion look with one elegant finishing detail',
  ],
};

const TEXTURE_DIRECTIONS = [
  'matte crepe',
  'fine ribbed knit',
  'soft brushed cotton',
  'lightweight linen blend',
  'structured twill',
  'fluid satin-back crepe',
  'boucle or tweed texture',
  'smooth ponte knit',
  'washed denim',
  'soft suede or leather finish',
];

const PATTERN_DIRECTIONS = [
  'classic blue stripe shirting',
  'vertical pinstripe',
  'pinstripe tailored blazer or trouser',
  'small polka dot print',
  'tonal micro-check',
  'subtle herringbone',
  'fine vertical stripe',
  'double-breasted blazer structure with visible buttons',
  'denim jacket, chambray, or denim texture',
  'tonal jacquard texture',
  'small-scale print',
  'contrast piping',
  'border or panel detail',
  'quiet woven texture',
];

const EVERYDAY_PATTERN_DIRECTIONS = [
  'bold charcoal-and-white horizontal stripe overshirt or shirt',
  'classic blue banker stripe shirt',
  'denim or chambray texture',
  'white or ivory eyelet detail',
  'small-scale floral, paisley, or botanical print',
  'contrast piping on a casual shirt',
  'quiet woven texture',
];

const EVERYDAY_TEXTURE_DIRECTIONS = [
  'crisp cotton poplin',
  'soft cotton jersey',
  'washed denim',
  'lightweight linen blend',
  'fine ribbed knit',
  'cotton twill',
  'soft chambray',
];

function patternDirectionForPlan(capsule: PlannedOutfit['capsule'], index: number, textureCycle: number) {
  if (capsule === 'Everyday') {
    return EVERYDAY_PATTERN_DIRECTIONS[(index + textureCycle) % EVERYDAY_PATTERN_DIRECTIONS.length];
  }
  return PATTERN_DIRECTIONS[((index * 3) + textureCycle * 5) % PATTERN_DIRECTIONS.length];
}

function textureDirectionForPlan(capsule: PlannedOutfit['capsule'], index: number, textureCycle: number) {
  if (capsule === 'Everyday') {
    return EVERYDAY_TEXTURE_DIRECTIONS[(index + textureCycle) % EVERYDAY_TEXTURE_DIRECTIONS.length];
  }
  return TEXTURE_DIRECTIONS[(index + textureCycle * 5) % TEXTURE_DIRECTIONS.length];
}

const FINISHING_DETAIL_TYPES: Array<NonNullable<PlannedOutfit['finishing_detail_type']>> = [
  'scarf',
  'belt',
  'watch',
  'hair_detail',
  'lip_tone',
];

function requiresFinishingDetail(capsule: PlannedOutfit['capsule'], index: number) {
  const capsuleIndex = index % 5;
  if (capsule === 'Professional') return [0, 2, 4].includes(capsuleIndex);
  if (capsule === 'Social') return [0, 1, 3].includes(capsuleIndex);
  if (capsule === 'Everyday') return [1, 3].includes(capsuleIndex);
  return [0, 2, 4].includes(capsuleIndex);
}

function finishingDetailTypeForPlan(capsule: PlannedOutfit['capsule'], index: number): NonNullable<PlannedOutfit['finishing_detail_type']> {
  if (capsule === 'Professional') return index % 3 === 0 ? 'scarf' : index % 3 === 1 ? 'belt' : 'watch';
  if (capsule === 'Social') return index % 2 === 0 ? 'scarf' : 'lip_tone';
  if (capsule === 'Everyday') return index % 2 === 0 ? 'belt' : 'hair_detail';
  return FINISHING_DETAIL_TYPES[index % FINISHING_DETAIL_TYPES.length];
}

function requiresPattern(capsule: PlannedOutfit['capsule'], index: number) {
  const capsuleIndex = index % 5;
  if (capsule === 'Professional') return [0, 1, 3].includes(capsuleIndex);
  if (capsule === 'Social') return [0, 1, 2, 4].includes(capsuleIndex);
  if (capsule === 'Everyday') return [0, 1, 3, 4].includes(capsuleIndex);
  return [0, 1, 3].includes(capsuleIndex);
}

// Detail-only accent applications. Garment-level accents (a coloured layer or
// top) are now handled structurally via accent_mode, so they are not listed
// here and never produce a separate extra garment.
const ACCENT_APPLICATIONS: Array<{ slot: string; piece: string; guidance: string }> = [
  {
    slot: 'Scarf',
    piece: 'silk scarf',
    guidance: 'Use the accent as one whole coloured silk scarf, not as a repeated styling crutch.',
  },
  {
    slot: 'Print',
    piece: 'small-scale print on the top or dress',
    guidance: 'Use the accent inside a print on a real garment, with the base palette carrying the rest of the outfit.',
  },
  {
    slot: 'Jewellery',
    piece: 'stone or enamel jewellery',
    guidance: 'Use the accent through a coloured jewellery stone or enamel that reads intentional and wearable.',
  },
  {
    slot: 'Belt',
    piece: 'slim leather belt',
    guidance: 'Use the accent as one whole coloured leather belt at the waist.',
  },
  {
    slot: 'Bag',
    piece: 'compact clutch',
    guidance: 'Use the accent as one whole coloured clutch, never as trim or hardware on a neutral bag.',
  },
];

const PRACTICAL_COLOUR_APPLICATION_RULES = `
Practical colour application rules:
- Use colour analysis as wardrobe direction, not literal paint on every item and not a fixed 15-shade shopping list.
- The outfit library is the main source of outfit colour relationships. Keep strong classic combinations when they are stylish and realistic, then adjust shade temperature near the face for the client's undertone.
- Accent colours appear ONLY when the styling decision or admin instruction calls for one. Use them as whole realistic pieces: a coloured knit or top, a silk scarf, a leather belt, a jewellery stone/enamel, a garment print, or (for evening) a whole coloured clutch.
- NEVER put an accent (or any) colour on a bag or shoe as a trim, tag, stripe, piping, hardware, stitch, sole, or "detail". Bags and shoes are a single realistic colour from head to toe.
- Bags and shoes use realistic leather/suede colours only: black, espresso, chocolate, cognac, tan, taupe, cream, burgundy, or restrained grey. A vivid/bright colour belongs on a knit, top, scarf, belt, jewellery, or evening clutch — not on an everyday leather bag or shoe.
- Never create coloured leather sneakers. Sneakers are white, off-white, cream, or grey-neutral with no coloured trim.
- Professional and Occasion outfits should normally use loafers, pointed flats, pumps, sandals, mules, or refined heels instead of sneakers unless the library reference and client lifestyle clearly justify a casual version. Use juttis only in ethnic_allowed mode.
- Do not make a whole trouser, sneaker, or large coat the accent colour.
- Scarves, belts, and statement finishing pieces are a core elevated styling tool and appear throughout the outfit library — use them. Include a finishing detail (scarf, belt, or statement accessory) in a meaningful share of outfits (roughly one in three), varying the type, colour, and placement (tied at the neck, on the bag, at the waist, in the hair). Do not reuse the same scarf/belt colour or placement repeatedly, and do not force one into every look — but do not strip them out either.
- Keep each outfit visually distinct by selecting different complete library references and spacing dominant colour families across the report, not by forcing random patterns or colour placements.
- Include texture/pattern only where the styling decision calls for it or where a garment would otherwise be too vague to shop.
- Every outfit must preserve the assigned library_reference's styling logic and proportion relationship. Adapt colour, formality, coverage, climate, fit, and repetitive garment category when needed so the full capsule has real range. If a slot repeats too often, use the nearest equivalent garment family that keeps the same role: trouser to skirt/co-ord bottom, blouse to knit/shell/shirt, blazer to vest/jacket/cardigan, dress to jumpsuit/co-ord.
- Avoid same-depth same-family top + bottom pairings. Each outfit needs a clear light/dark or texture/depth bridge.

Shoppable realism rules (every piece must be findable in real stores):
- Each "piece" must read like a specific, real retail garment a woman could search for and buy today. Name the garment type plus its fabric, cut/silhouette, length, and neckline or finish where relevant — e.g. "ivory fitted ribbed-knit crewneck top", "navy mid-rise straight-leg tailored trousers, cropped at the ankle", not "navy top" or "nice trousers".
- Use ordinary, recognisable garments and standard names. No invented silhouettes, runway one-offs, costume pieces, or items that don't exist at normal retail.
- Keep colours realistic and easy to source. No neon, no novelty or oddly-specific shades; a feature colour should be a normal, buyable tone in one or two places, with the rest of the look in neutrals.
- structural_notes must say how the piece sits on the body and why it suits this client (fit, proportion, coverage) in concrete, practical terms — not vague mood words.
- Prefer the exact piece types, fabrics, and styling moves shown in the verified library outfits over anything invented.`.trim();

const HARNESS_FIRST_OUTFIT_CONTRACT = `
Harness-first outfit contract:
- The ICONIK Outfit Recommendation Harness is the primary outfit system. Treat attached images, coverage requirements, piece preference sorting, free notes, the attached women outfit library, and the basic page plan as outfit intake context.
- Do not let the deterministic plan flatten outfits into the same neutral formula. Use it for page number, capsule, coverage, eyewear cadence, and structural safety; the harness chooses the styling intention, archetype, hero, colour movement, and exact item mix.
- The plan record's colour_strategy is soft guidance, not a fixed palette assignment. The harness chooses the most realistic colour story from the assigned library skeleton, client undertone direction, classic wardrobe combinations, capsule context, and adjacent outfit spacing.
- Choose realistic retail colours freely across broad wardrobe families. Undertone shapes the best near-face shade inside a family; it does not ban blue, green, pink, brown, purple, denim, stripes, white shirts, or classic navy/cream/black combinations.
- The attached women outfit library is the dominant catalog source. Choose one complete assigned library skeleton first, then adapt minimally for this client instead of inventing unrelated formulas.
- Preserve the assigned library skeleton's garment categories, silhouette relationship, styling line, finish, accessory architecture, scarves, belts, polished bags, structured shoes, jewellery restraint, rich texture, strong colour relationships, warm leather bridges, and precise finishing details.
- Maintain visible colour diversity, layer/no-layer diversity, silhouette diversity, footwear/bag variety, and finishing-detail variety across the set without recombining different library outfits. Do not cite numbers or source ids, and do not force a blocked library slot when hard client guardrails point elsewhere.
- Do not add unnecessary decorative detail to every formula item. Individual pieces may be simple, clean, and realistic; the outfit should feel elevated through the full combination, proportion, colour relationship, texture, finishing detail, and accessories.
- Manual-admin notes, profile text, and explicit preferences are hard guardrails when provided. Use liked/preferred garments to softly steer outfit worlds, and reject outfits that conflict with avoid, exposure, fit, footwear, or garment-category boundaries.
- For form choices, disliked/No is an avoid signal, skipped is neutral and ignored, and liked is directional flavour only. Never repeat an item type merely because it was liked.
- If a preference conflicts with body/coverage safety or garment realism, preserve safety/realism and choose the nearest acceptable alternative.
- For customer-form reports, treat item preferences as soft context unless they express hard coverage, fit, modesty, avoid, or lifestyle needs.
- If the intake mentions modesty or neckline coverage, interpret it as no cleavage and no very low necklines. Do not automatically turn modesty into only high necklines; safe open collars, soft V necklines, soft scoops, and modest square necks are allowed when they stay covered.
- Keep each outfit to no more than 3 visible colours plus metal direction. At least half of the full outfit set must use colour in a main garment, not only in bag, jewellery, scarf, eyewear, or shoes.
- Build visible colour diversity across the full set. Do not reuse the same lead colour family repeatedly; rotate near-face colour, neutral depth, leather grounding, and accent placement so the pages do not read like the same palette repeated.
- Build visible pattern diversity where pattern_required=true: include the specified pattern_instruction as a real garment fabric/print/detail, such as a pinstripe blazer, micro-check trouser, small-scale print blouse, tonal jacquard, contrast piping, or fine vertical stripe.
- Professional outfits must include formal tailored layers whenever layer_required=true. Use the provided layer_type exactly enough to create real blazer/vest/jacket authority; do not replace formal layers with only a blouse and trousers.
- When finishing_required=true, fill 07 - FINISHING DETAIL with one exact non-jewellery finishing idea matching finishing_detail_type. Use scarves, belts, watches, lip tones, or hair details as styling architecture, not filler. Do not answer None for required finishing details.
- Before writing final outfit blocks, run a private elevation and diversity preflight. Do not output the preflight. Check that the set is not repeating the same colour family, same neutral formula, same shoe/bag, same layer, same silhouette, or same finishing placement.
- Keep layers to the plan cadence, roughly half to 60% of the outfit set. When layer_required=false, do not add a separate blazer, jacket, cardigan, vest, coat, overshirt, duster, wrap, or third-piece outer frame; solve coverage and polish through sleeves, neckline, fabric, colour, cut, bag, shoes, and finishing detail.
- Elevation means specific retail-real garment details and one intelligent styling move: fabric, cut, neckline, sleeve, hem, proportion, scarf/belt/watch/hair/lip finish. Avoid catalogue-basic blouse + trouser + bag formulas.
- When statement jewellery is disliked, use scarves, belts, watches, bag-handle scarves, hair scarves/details, lip tone, or shoe/bag polish as the elevated finishing system. Scarf moments should be a stylish minority, not a quota; include at least one bag-handle scarf only when it improves the full set.
- Each outfit page must include one formula block with exact formula item objects: {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""}.
- Formula items must be exact. Do not use "or", slashes, "optional", alternate colours, alternate shoes, alternate layers, or category-only names.
- Each outfit page must include blocks for Why it works, Role breakdown, Do not buy, and Score summary.
- Each formula must identify one archetype from the harness: Coloured Hero + Quiet Support; Neutral Architecture + Rich Accent; Pattern Hero + Controlled Solids; Texture Hero + Tonal Depth; Shape Hero + Clean Colour; Casual Base + Polished Disruptor; Western Base + Elevated Finishing. Use Indian Base + Modern Finishing only when cultural_mode is ethnic_allowed.
- Shoes and bags must remain realistic leather/suede/occasion-metal colours: black, espresso, chocolate, cognac, tan, taupe, cream, burgundy, restrained grey, or a realistic occasion metallic. No coloured trims, tags, soles, piping, or fake contrast hardware.
- Eyewear follows eyewear_required only: exactly one Eyewear item when true, no eyewear when false.`.trim();

function normalisedLibrarySlots(outfit: ParsedStylistOutfit): Array<{ slot: string; piece: string; source: 'primary' }> {
  const slots = outfit.normalised_slots?.length
    ? outfit.normalised_slots
    : outfit.fields.map(field => ({ slot: field.label, piece: field.value, source_label: field.label, role: 'detail' as const }));

  return slots
    .filter(slot => ['Outfit', 'Dress', 'Top', 'Base Layer', 'Outerwear', 'Bottom', 'Waist Detail', 'Pattern Detail', 'Neckline', 'Footwear', 'Bag', 'Jewellery', 'Accessories', 'Statement Piece', 'Styling Line'].includes(slot.slot))
    .slice(0, 12)
    .map(slot => ({ slot: slot.slot, piece: slot.piece, source: 'primary' as const }));
}

function libraryPieceLogic(primary: ParsedStylistOutfit): Array<{ slot: string; piece: string; source: 'primary' }> {
  return normalisedLibrarySlots(primary).slice(0, 12);
}

function libraryReferenceForPlan(
  outfit: ParsedStylistOutfit,
  capsule: PlannedOutfit['capsule'],
): BlueprintLibraryRef {
  const pieceSummary = libraryPieceLogic(outfit)
    .slice(0, 9)
    .map(item => `${item.slot}: ${item.piece}`)
    .join('; ');
  return {
    id: outfit.id,
    title: outfit.title,
    source: outfit.source,
    capsule: outfit.capsule,
    adaptation: `Use this as the complete verified catalog skeleton for this ${capsule} outfit, ${outfit.title}${pieceSummary ? ` (${pieceSummary})` : ''}: preserve the garment categories, silhouette relationship, styling line, finish, and accessory architecture; adapt only colour, coverage, fabric weight, formality, climate, and fit to this client's Blueprint. Do not graft slots from another outfit.`,
  };
}

function rankedLibraryPool(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
) {
  const sourceScore = (source: ParsedStylistOutfit['source']) => {
    if (source === 'women') return 4;
    if (source === 'root') return 3;
    if (source === 'curated') return 2;
    return 1;
  };
  return [...library].sort((a, b) => {
    const capsuleDelta = Number(b.capsule === capsule) - Number(a.capsule === capsule);
    if (capsuleDelta) return capsuleDelta;
    const sourceDelta = sourceScore(b.source) - sourceScore(a.source);
    if (sourceDelta) return sourceDelta;
    const completeDelta = b.completeness_score - a.completeness_score;
    if (completeDelta) return completeDelta;
    return a.title.localeCompare(b.title);
  });
}

// Feature extraction for anchor diversity: what a library outfit would repeat
// (lead colour family, bottom family, layer family, bag shape) if chosen again.
function anchorLeadFamilyOf(outfit: ParsedStylistOutfit): WardrobeColourFamily {
  const colours = extractAnchorColours(outfit);
  const lead = colours.find(colour => !colour.neutral) ?? colours[0];
  if (!lead) return 'neutral';
  return lead.neutral ? 'neutral' : colourFamilyOfHex(lead.hex);
}

function anchorBottomFamilyOf(text: string) {
  if (/\bskirt\b/.test(text)) return 'skirt';
  if (/\b(jean|jeans|denim)\b/.test(text)) return 'denim';
  if (/\b(palazzo|culotte)/.test(text)) return 'palazzo';
  if (/\b(trouser|pant)/.test(text)) return 'trouser';
  if (/\b(dress|jumpsuit|kaftan)\b/.test(text)) return 'onepiece';
  return 'other';
}

function anchorLayerFamilyOf(text: string) {
  if (/\bblazer\b/.test(text)) return 'blazer';
  if (/\b(waistcoat|vest)\b/.test(text)) return 'vest';
  if (/\b(jacket|shacket|overshirt)\b/.test(text)) return 'jacket';
  if (/\b(cardigan|kimono|cape|duster)\b/.test(text)) return 'soft-layer';
  return 'none';
}

function anchorBagFamilyOf(text: string) {
  if (/\btote\b/.test(text)) return 'tote';
  if (/\b(clutch|potli)\b/.test(text)) return 'clutch';
  if (/\bcrossbody\b/.test(text)) return 'crossbody';
  if (/\btop-handle\b/.test(text)) return 'top-handle';
  if (/\b(shoulder bag|hobo|crescent|saddle|bucket)\b/.test(text)) return 'shoulder';
  return 'other';
}

interface AnchorDiversityState {
  leadFamilies: Map<string, number>;
  bottoms: Map<string, number>;
  layers: Map<string, number>;
  bags: Map<string, number>;
}

function seedAnchorDiversityState(): AnchorDiversityState {
  return { leadFamilies: new Map(), bottoms: new Map(), layers: new Map(), bags: new Map() };
}

const ETHNIC_ANCHOR_RE = /\b(kurta|jutti|juttis|kolhapuri|kolhapuris|dupatta|potli|angrakha|chandbali|chandbalis|kundan|polki|saree|sari|lehenga|churidar|zari|farshi)\b/i;

function isEthnicLibraryAnchor(outfit: ParsedStylistOutfit) {
  return ETHNIC_ANCHOR_RE.test(outfitText(outfit));
}

function librarySourceScore(source: ParsedStylistOutfit['source']) {
  if (source === 'women') return 4;
  if (source === 'root') return 3;
  if (source === 'curated') return 2;
  return 1;
}

function everydayAnchorRelevanceScore(outfit: ParsedStylistOutfit) {
  const text = outfitText(outfit).toLowerCase();
  let score = 0;
  if (/\b(sneaker|trainer|low-top|slides?|sandals?|fisherman|espadrille|flat|mule)\b/.test(text)) score += 5;
  if (/\b(overshirt|shirt-jacket|shacket|denim jacket|cropped denim|chambray|utility jacket|linen shirt|resort shirt)\b/.test(text)) score += 5;
  if (/\b(stripe|striped|eyelet|crochet|embroidered|block-print|floral|paisley|printed|patchwork|denim)\b/.test(text)) score += 4;
  if (/\b(wide-leg jeans|straight jeans|denim skirt|denim maxi|culottes|linen trouser|linen pants|cream trouser|white jeans|chino)\b/.test(text)) score += 4;
  if (/\b(crossbody|tote|bucket|saddle|shoulder bag|raffia|woven|baseball cap|sunglasses|belt)\b/.test(text)) score += 3;
  if (/\b(resort|vacation|brunch|everyday|travel|off-duty|casual)\b/.test(text)) score += 3;

  if (/\b(pinstripe|herringbone|windowpane|glen-plaid|suiting|work tote|boardroom|pencil skirt|cigarette trouser|pointed pumps)\b/.test(text)) score -= 7;
  if (/\b(double-breasted|military-inspired|longline blazer|longline duster|denim duster|duster coat|fluid duster)\b/.test(text)) score -= 7;
  if (/\b(ponte sheath|ponte dress|plain ponte|belted ponte|structured shoulders)\b/.test(text)) score -= 8;
  if (/\b(cocktail|satin slip|clutch|stiletto|sequin|velvet|brocade)\b/.test(text)) score -= 6;
  return score;
}

// Diversity-aware anchor selection: instead of always taking the same
// top-ranked outfits, score every unused candidate and penalise repeats of
// lead colour family, bottom family, layer family, and bag shape across the
// anchors already chosen for this report. A per-report seed rotates ties so
// different clients draw different slices of the library.
function chooseLibraryOutfit(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
  index: number,
  usedSignatures: Map<string, number>,
  blockedSignatures: Set<string>,
  anchorRole?: StylingDecisionPlan['anchor_role'],
  diversity: AnchorDiversityState = seedAnchorDiversityState(),
  seed = 0,
): ParsedStylistOutfit | undefined {
  if (!library.length) return undefined;
  const allowed = library.filter(outfit => !blockedSignatures.has(outfit.signature));
  const pool = allowed.length ? allowed : library;
  const unused = pool.filter(outfit => (usedSignatures.get(outfit.signature) ?? 0) === 0);
  const candidates = unused.length ? unused : pool;

  let selected = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const outfit of candidates) {
    const text = outfitText(outfit);
    let score = 0;
    if (outfit.capsule === capsule) score += 12;
    score += librarySourceScore(outfit.source) * 1.5;
    score += outfit.completeness_score;
    score += outfitAnchorScore(outfit, anchorRole) * 0.6;
    if (capsule === 'Everyday') score += everydayAnchorRelevanceScore(outfit);
    score -= 4 * (diversity.leadFamilies.get(anchorLeadFamilyOf(outfit)) ?? 0);
    score -= 3 * (diversity.bottoms.get(anchorBottomFamilyOf(text)) ?? 0);
    score -= 2 * (diversity.layers.get(anchorLayerFamilyOf(text)) ?? 0);
    score -= 1.5 * (diversity.bags.get(anchorBagFamilyOf(text)) ?? 0);
    score += (((seed + stringHash(outfit.id)) % 97) / 97) * 3;
    if (score > bestScore) {
      bestScore = score;
      selected = outfit;
    }
  }

  usedSignatures.set(selected.signature, (usedSignatures.get(selected.signature) ?? 0) + 1);
  const text = outfitText(selected);
  diversity.leadFamilies.set(anchorLeadFamilyOf(selected), (diversity.leadFamilies.get(anchorLeadFamilyOf(selected)) ?? 0) + 1);
  diversity.bottoms.set(anchorBottomFamilyOf(text), (diversity.bottoms.get(anchorBottomFamilyOf(text)) ?? 0) + 1);
  diversity.layers.set(anchorLayerFamilyOf(text), (diversity.layers.get(anchorLayerFamilyOf(text)) ?? 0) + 1);
  diversity.bags.set(anchorBagFamilyOf(text), (diversity.bags.get(anchorBagFamilyOf(text)) ?? 0) + 1);
  return selected;
}

function chooseAlternativeLibraryOutfit(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
  currentLibraryIds: Set<string>,
  blockedSignatures: Set<string>,
  anchorRole?: StylingDecisionPlan['anchor_role'],
): ParsedStylistOutfit | undefined {
  const pool = rankedLibraryPool(library, capsule).filter(outfit =>
    !blockedSignatures.has(outfit.signature) &&
    !currentLibraryIds.has(outfit.id),
  ).sort((a, b) => outfitAnchorScore(b, anchorRole) - outfitAnchorScore(a, anchorRole));
  return pool[0];
}

function outfitText(outfit: ParsedStylistOutfit | undefined) {
  return outfit ? outfit.normalised_slots.map(slot => `${slot.slot} ${slot.piece}`).join(' ').toLowerCase() : '';
}

function outfitAnchorScore(outfit: ParsedStylistOutfit, anchorRole: StylingDecisionPlan['anchor_role'] | undefined) {
  if (!anchorRole) return 0;
  const text = outfitText(outfit);
  const patterns: Record<StylingDecisionPlan['anchor_role'], RegExp> = {
    blazer: /\b(blazer|structured jacket|tailored jacket|single-breasted|longline vest)\b/,
    trouser: /\b(trouser|wide-leg|straight-leg|pant|palazzo)\b/,
    shirt_blouse: /\b(shirt|blouse|top|shell|knit|collar)\b/,
    dress: /\b(dress|jumpsuit|one-piece)\b/,
    layer: /\b(layer|outerwear|cardigan|jacket|coat|duster|overshirt|dupatta)\b/,
    skirt: /\b(skirt|midi)\b/,
    set: /\b(co-ord|coord|set|kurta|saree|sari|ensemble)\b/,
  };
  return patterns[anchorRole].test(text) ? 10 : 0;
}

function outfitMessageForCapsule(capsule: PlannedOutfit['capsule'], classification: StylistBlueprintClassification) {
  const taste = `${classification.taste.style_archetype} ${classification.taste.signature_codes.join(' ')}`.toLowerCase();
  if (capsule === 'Professional') {
    if (/creative|expressive|artistic/.test(taste)) return 'polished, senior, controlled, with one creative but quiet signal';
    if (/feminine|soft/.test(taste)) return 'polished, senior, feminine, and composed';
    return 'polished, senior, controlled, and not loud';
  }
  if (capsule === 'Social') return /minimal|quiet/.test(taste) ? 'quietly elevated, expensive, and relaxed' : 'elevated, social, feminine, and comfortable';
  if (capsule === 'Everyday') return 'composed, repeatable, practical, and still styled';
  return /modest|covered/.test(taste) ? 'occasion-ready, modest, refined, and celebratory' : 'occasion-ready, refined, memorable, and restrained';
}

function bodyStrategyFromProfile(classification: StylistBlueprintClassification, profile: StylistCoverageProfile) {
  const focus = classification.body.focus_areas.join(', ') || 'balanced proportions';
  const rules = [
    classification.body.proportion_directive,
    profile.arms ? 'use a real sleeve or intentional outer frame for arm coverage' : '',
    profile.neckline ? 'avoid cleavage and very low necklines without defaulting to high necklines' : '',
    profile.legs ? 'use trousers or below-knee hemlines' : '',
    profile.looseFit ? 'avoid cling and use controlled ease through sensitive areas' : '',
  ].filter(Boolean);
  return `Prioritise ${focus}. ${rules.join(' ')}`.trim();
}

function anchorRoleForOutfit(
  capsule: PlannedOutfit['capsule'],
  index: number,
  classification: StylistBlueprintClassification,
  profile: StylistCoverageProfile,
): StylingDecisionPlan['anchor_role'] {
  const focus = `${classification.body.focus_areas.join(' ')} ${classification.body.silhouette_rules.join(' ')}`.toLowerCase();
  const capsuleIndex = index % 5;
  if (profile.neckline && capsule === 'Professional' && [1, 3].includes(capsuleIndex)) return 'shirt_blouse';
  if (profile.legs) return 'trouser';
  if (/tummy|stomach|midsection|waist|vertical|length|petite|hip|lower body/.test(focus)) {
    if (capsule === 'Professional') return capsuleIndex === 0 ? 'blazer' : capsuleIndex === 1 ? 'trouser' : capsuleIndex === 2 ? 'dress' : capsuleIndex === 3 ? 'shirt_blouse' : 'skirt';
    if (capsule === 'Social') return capsuleIndex === 0 ? 'shirt_blouse' : capsuleIndex === 1 ? 'dress' : capsuleIndex === 2 ? 'skirt' : capsuleIndex === 3 ? 'trouser' : 'set';
    if (capsule === 'Occasion') return capsuleIndex === 0 ? 'dress' : capsuleIndex === 1 ? 'set' : capsuleIndex === 2 ? 'skirt' : capsuleIndex === 3 ? 'trouser' : 'dress';
    return capsuleIndex === 0 ? 'shirt_blouse' : capsuleIndex === 1 ? 'layer' : capsuleIndex === 2 ? 'dress' : capsuleIndex === 3 ? 'trouser' : 'set';
  }
  if (capsule === 'Professional') return index % 2 === 0 ? 'blazer' : 'trouser';
  if (capsule === 'Social') return index % 3 === 0 ? 'shirt_blouse' : index % 3 === 1 ? 'dress' : 'skirt';
  if (capsule === 'Occasion') return index % 2 === 0 ? 'dress' : 'set';
  return index % 2 === 0 ? 'shirt_blouse' : 'layer';
}

function anchorPieceForRole(
  role: StylingDecisionPlan['anchor_role'],
  capsule: PlannedOutfit['capsule'],
  culturalMode: StylistOutfitCulturalMode,
) {
  const professional = capsule === 'Professional';
  const pieces: Record<StylingDecisionPlan['anchor_role'], string> = {
    blazer: professional ? 'structured blazer or tailored vest' : 'soft structured jacket',
    trouser: professional ? 'tailored straight or wide-leg trouser' : 'clean non-clingy trouser',
    shirt_blouse: professional ? 'polished blouse, shirt, or shell' : 'defined top or blouse',
    dress: capsule === 'Occasion' ? 'refined dress or one-piece column' : 'clean dress with controlled fit',
    layer: 'intentional outer layer that creates vertical structure',
    skirt: 'midi skirt with clean fall',
    set: capsule === 'Occasion'
      ? (culturalMode === 'western_default'
        ? 'polished co-ord, tailored trouser set, satin-skirt set, or refined dress'
        : 'polished co-ord, kurta set, saree, or festive ensemble')
      : 'co-ord or coordinated set',
  };
  return pieces[role];
}

function colourWorldForCapsule(capsule: PlannedOutfit['capsule'], classification: StylistBlueprintClassification) {
  const bucket = normaliseUndertoneFallbackBucket(classification.colour);
  const baseByBucket: Record<UndertoneFallbackBucket, string> = {
    cool: 'cool, sharp, calm, and expensive',
    neutralCool: 'neutral-cool, clear, calm, and expensive',
    neutral: 'balanced-neutral, versatile, calm, and expensive',
    olive: 'olive-neutral, earthy, polished, and expensive',
    neutralWarm: 'neutral-warm, grounded, calm, and expensive',
    warm: 'warm, grounded, calm, and expensive',
    deepWarm: 'deep warm, rich, grounded, and expensive',
  };
  const base = baseByBucket[bucket];
  if (capsule === 'Professional') return `${base}; medium contrast, restrained neutrals first`;
  if (capsule === 'Occasion') return `${base}; rich but controlled with one possible feature colour`;
  if (capsule === 'Social') return `${base}; softer contrast with one refined focal point`;
  return `${base}; practical neutrals with texture doing most of the work`;
}

function fabricRulesForCapsule(capsule: PlannedOutfit['capsule'], profile: StylistCoverageProfile) {
  const opacity = profile.opacity || profile.fullModesty ? 'Use opaque or lined fabrics. ' : '';
  if (capsule === 'Professional') return `${opacity}Use controlled fabric: crepe, suiting, structured cotton, fine knit, wool blend, ponte, or matte viscose. Avoid limp polyester, shiny satin, clingy jersey, and crushed fabric.`;
  if (capsule === 'Occasion') return `${opacity}Use refined occasion fabric: matte satin-back crepe, silk blend, jacquard, georgette with lining, fine knit, or structured festive fabric. Avoid flimsy shine and see-through layers.`;
  if (capsule === 'Social') return `${opacity}Use fabric with movement but not collapse: crepe, satin-back crepe, fine knit, soft twill, lined georgette, or polished denim when casual.`;
  return `${opacity}Use practical fabric with clean recovery: cotton, linen blend, twill, denim, ponte, fine knit, or soft structured blends.`;
}

function accessoryRulesForCapsule(capsule: PlannedOutfit['capsule'], culturalMode: StylistOutfitCulturalMode) {
  if (capsule === 'Professional') return 'Finish with pointed flats/loafers/low pumps, structured tote or shoulder bag, small earrings, watch, or a thin belt only if it helps waist definition.';
  if (capsule === 'Occasion') {
    return culturalMode === 'western_default'
      ? 'Finish with refined heels/flats/sandals, compact clutch, and one strong jewellery or finishing idea; no competing accessory pile-up.'
      : 'Finish with refined heels/flats/juttis or sandals, compact clutch, and one strong jewellery idea; no competing accessory pile-up.';
  }
  if (capsule === 'Social') return 'Finish with a compact bag, refined sandal/mule/flat, and one jewellery focal point.';
  return 'Finish with practical clean flats/sneakers/loafers, crossbody/tote, and simple jewellery; avoid slouchy bags that make the outfit look unfinished.';
}

function metalDirectionFromJewellery(jewelleryDirection: string) {
  const lower = jewelleryDirection.toLowerCase();
  if (/rose/.test(lower)) return 'rose-gold';
  if (/silver|platinum|white gold|cool metal/.test(lower)) return 'silver';
  if (/champagne/.test(lower)) return 'champagne-gold';
  if (/gold|bronze|warm metal|antique/.test(lower)) return 'gold';
  return 'gold';
}

function eyewearRoleForOutfit(
  capsule: PlannedOutfit['capsule'],
  index: number,
  decision: StylingDecisionPlan,
): EyewearRole {
  const message = decision.outfit_message.toLowerCase();
  if (capsule === 'Professional') return index % 4 === 1 || /senior|authority|controlled|formal/.test(message) ? 'authority' : 'softness';
  if (capsule === 'Social') return index % 4 === 1 ? 'softness' : 'colour_echo';
  if (capsule === 'Everyday') return index % 4 === 1 ? 'modernity' : 'softness';
  return index % 4 === 1 ? 'luxury_polish' : 'colour_echo';
}

function preferredEyewearShape(classification: StylistBlueprintClassification, fallback: string) {
  const fromProfile = classification.face_hair_accessories.eyewear_shapes
    .map(shape => shape.trim().toLowerCase())
    .find(Boolean);
  if (!fromProfile) return fallback;
  if (/cat/.test(fromProfile)) return 'soft cat-eye';
  if (/rect/.test(fromProfile)) return 'slim rectangular';
  if (/square/.test(fromProfile)) return 'soft square';
  if (/round/.test(fromProfile)) return 'rounded rectangular';
  if (/geo/.test(fromProfile)) return 'clean geometric';
  return fallback;
}

function colourEchoEyewearDescriptor(colour: PlannedOutfitColour | undefined) {
  const text = `${colour?.name ?? ''} ${colour?.hex ?? ''}`.toLowerCase();
  if (/burgundy|berry|wine|oxblood|maroon|plum/.test(text)) return 'burgundy acetate';
  if (/olive|sage|forest|green/.test(text)) return 'olive-tinted';
  if (/camel|tan|cognac|brown|espresso|chocolate|cocoa/.test(text)) return 'warm brown';
  if (/navy|blue|slate|denim/.test(text)) return 'smoky navy';
  if (/rose|pink|mauve|blush/.test(text)) return 'soft rose-brown';
  return 'dark tortoiseshell';
}

function eyewearPieceForPlan(
  classification: StylistBlueprintClassification,
  capsule: PlannedOutfit['capsule'],
  role: EyewearRole,
  colours: { lead: PlannedOutfitColour; support: PlannedOutfitColour; ground?: PlannedOutfitColour; accent?: PlannedOutfitColour },
  index: number,
) {
  const metal = metalDirectionFromJewellery(classification.face_hair_accessories.jewellery_direction);
  const echo = colourEchoEyewearDescriptor(colours.accent ?? colours.lead);
  const shape = preferredEyewearShape(
    classification,
    capsule === 'Professional' ? 'slim rectangular' : capsule === 'Occasion' ? 'subtle cat-eye' : 'rounded rectangular',
  );

  if (role === 'authority') {
    return index % 4 === 1
      ? `slim dark tortoiseshell ${shape.includes('rectangular') ? 'rectangular' : 'angular'} frames`
      : `black acetate ${shape} frames`;
  }
  if (role === 'softness') {
    return capsule === 'Social'
      ? `warm brown ${shape} sunglasses`
      : `soft brown acetate ${shape} frames`;
  }
  if (role === 'modernity') {
    return index % 4 === 1
      ? `translucent taupe ${shape} frames`
      : `thin ${metal} clean geometric frames`;
  }
  if (role === 'luxury_polish') {
    return capsule === 'Occasion'
      ? `delicate ${metal} rimmed subtle cat-eye frames`
      : `dark tortoiseshell oversized sunglasses`;
  }
  return capsule === 'Occasion'
    ? `${echo} subtle cat-eye sunglasses`
    : `${echo} ${shape} frames`;
}

function refreshPlanEyewear(plan: PlannedOutfit, reportData: StylistBlueprintReportData, index: number) {
  plan.eyewear_required = plan.outfit_number % 2 === 0;
  if (!plan.eyewear_required) {
    plan.eyewear_role = undefined;
    plan.eyewear_piece = undefined;
    return;
  }
  const role = eyewearRoleForOutfit(plan.capsule, index, plan.styling_decision);
  plan.eyewear_role = role;
  plan.eyewear_piece = eyewearPieceForPlan(
    reportData.classification,
    plan.capsule,
    role,
    {
      lead: plan.lead_colour,
      support: plan.support_colour,
      ground: plan.ground_colour,
      accent: plan.accent_colour,
    },
    index,
  );
}

function buildStylingDecisionPlan(
  reportData: StylistBlueprintReportData,
  capsule: PlannedOutfit['capsule'],
  index: number,
  profile: StylistCoverageProfile,
  culturalMode: StylistOutfitCulturalMode,
  libraryOutfit?: ParsedStylistOutfit,
  anchorRoleOverride?: StylingDecisionPlan['anchor_role'],
): StylingDecisionPlan {
  const anchor_role = anchorRoleOverride ?? anchorRoleForOutfit(capsule, index, reportData.classification, profile);
  const anchor_piece = anchorPieceForRole(anchor_role, capsule, culturalMode);
  const outfit_message = outfitMessageForCapsule(capsule, reportData.classification);
  const body_strategy = bodyStrategyFromProfile(reportData.classification, profile);
  const colour_world = colourWorldForCapsule(capsule, reportData.classification);
  const necklineInstruction = profile.neckline
    ? 'Neckline coverage: avoid cleavage and very low necklines; safe open necklines are allowed when covered.'
    : 'Use a polished neckline that supports the face.';
  const silhouette_formula = `${anchor_piece} first, then adapt ${libraryOutfit?.title ?? 'the verified library skeleton'} into a ${capsule.toLowerCase()} formula that serves the message before colour.`;
  return {
    outfit_message,
    body_strategy,
    colour_world,
    anchor_role,
    anchor_piece,
    silhouette_formula,
    fabric_rules: fabricRulesForCapsule(capsule, profile),
    neckline_rules: {
      coverage_required: profile.neckline,
      approved: profile.approvedNecklines,
      banned: profile.bannedNecklines,
      instruction: necklineInstruction,
    },
    accessory_rules: accessoryRulesForCapsule(capsule, culturalMode),
    mirror_test: [
      `Does she look ${outfit_message}?`,
      'Does the outfit flatter her actual body strategy before serving colour?',
      'Do the colours lift the face without feeling forced or repetitive?',
      'Is there one clear visual hierarchy?',
      'Would this work in her real context?',
    ],
  };
}

function paletteFallback(index: number) {
  const fallbacks = [
    { name: 'Deep Charcoal', hex: '#252525', usage: 'Grounding tailored pieces.' },
    { name: 'Soft Ivory', hex: '#F5F0E8', usage: 'Clean tops and light layers.' },
    { name: 'Slate Taupe', hex: '#95877B', usage: 'Trousers, layers, and quiet structure.' },
    { name: 'Cocoa', hex: '#4B2E24', usage: 'Shoes, bags, and evening anchors.' },
    { name: 'Olive Grey', hex: '#6F7668', usage: 'Outerwear and relaxed separates.' },
    { name: 'Dusty Blue', hex: '#70899A', usage: 'Soft colour near the face.' },
    { name: 'Mushroom', hex: '#B7AA9C', usage: 'Tonal supports and knitwear.' },
    { name: 'Ink Navy', hex: '#1F2A36', usage: 'Professional anchors.' },
    { name: 'Cool Stone', hex: '#C8C4BA', usage: 'Light trousers and base layers.' },
    { name: 'Muted Pewter', hex: '#7F817A', usage: 'Shoes, bags, and utility pieces.' },
  ];
  return fallbacks[index % fallbacks.length];
}

function plannedColour(
  colour: { name: string; hex: string; usage?: string } | undefined,
  role: BlueprintColourUse['role'],
  fallbackIndex: number,
): PlannedOutfitColour {
  const fallback = paletteFallback(fallbackIndex);
  return {
    name: asString(colour?.name, fallback.name),
    hex: normaliseHex(asString(colour?.hex, fallback.hex)),
    role,
  };
}

const SAFE_NECKLINES = [
  'soft V that does not expose cleavage',
  'open collar with safe button stance',
  'soft scoop that sits above cleavage',
  'boat neck',
  'modest square neck',
  'crew neck',
  'jewel neck',
  'collared shirt with safe button stance',
  'mock neck',
  'band or mandarin collar',
  'wrap neckline secured above cleavage',
];

const UNSAFE_NECKLINES = [
  'deep V',
  'plunging neckline',
  'low scoop',
  'keyhole',
  'off-shoulder',
  'one-shoulder',
  'strapless',
  'spaghetti straps',
  'strappy camisole as a standalone top',
  'cleavage-revealing wrap',
];

function freeTextFromUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(freeTextFromUnknown).join(' ');
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).map(freeTextFromUnknown).join(' ');
  return '';
}

function profileFromCoverageText(text: string): StylistCoverageProfile {
  const normalised = text.toLowerCase().replace(/[_/,-]+/g, ' ');
  const fullModesty = /\b(full modesty|modest|modesty|religious|cultural|hijab|covered|covering|conservative|temple|mosque|church|family function)\b/.test(normalised);
  const neckline = fullModesty ||
    /\b(high neck|high neckline|higher neckline|neckline|cleavage|chest|bust|décolletage|decolletage|not deep|not too deep|not low|not too low|low cut|low neck|plunging|exposed chest|cover chest|covered chest)\b/.test(normalised);
  const arms = fullModesty ||
    /\b(arm|arms|upper arms|sleeve|sleeves|elbow|elbows|shoulder|shoulders|cap sleeve|sleeveless|cover my arms|covered arms)\b/.test(normalised);
  const legs = fullModesty ||
    /\b(leg|legs|knee|knees|thigh|mini|short skirt|short dress|cover legs|covered legs)\b/.test(normalised);
  const opacity = fullModesty ||
    /\b(opaque|opacity|transparent|sheer|see through|see-through|not sheer|lining|lined)\b/.test(normalised);
  const looseFit = fullModesty ||
    /\b(loose|not tight|avoid cling|non clingy|non-clingy|not bodycon|relaxed fit|overall fit)\b/.test(normalised);
  const reasons = [
    neckline ? 'cleavage/very low neckline exposure' : '',
    arms ? 'arm/shoulder/sleeve coverage' : '',
    legs ? 'leg/knee coverage' : '',
    opacity ? 'fabric opacity' : '',
    looseFit ? 'non-clingy fit' : '',
  ].filter(Boolean);

  return {
    neckline,
    arms,
    legs,
    opacity,
    looseFit,
    fullModesty,
    reasons,
    approvedNecklines: neckline ? SAFE_NECKLINES : ['soft V', 'open collar', 'soft scoop', 'modest square', 'boat neck'],
    bannedNecklines: neckline ? UNSAFE_NECKLINES : ['plunging neckline', 'cleavage-revealing cut'],
  };
}

function mergeCoverageProfiles(...profiles: StylistCoverageProfile[]): StylistCoverageProfile {
  const neckline = profiles.some(profile => profile.neckline);
  const arms = profiles.some(profile => profile.arms);
  const legs = profiles.some(profile => profile.legs);
  const opacity = profiles.some(profile => profile.opacity);
  const looseFit = profiles.some(profile => profile.looseFit);
  const fullModesty = profiles.some(profile => profile.fullModesty);
  const reasons = [...new Set(profiles.flatMap(profile => profile.reasons))];
  return {
    neckline,
    arms,
    legs,
    opacity,
    looseFit,
    fullModesty,
    reasons,
    approvedNecklines: neckline ? SAFE_NECKLINES : ['soft V', 'open collar', 'soft scoop', 'modest square', 'boat neck'],
    bannedNecklines: neckline ? UNSAFE_NECKLINES : ['plunging neckline', 'cleavage-revealing cut'],
  };
}

function coverageProfileFromClassification(classification: StylistBlueprintClassification): StylistCoverageProfile {
  return profileFromCoverageText([
    ...(classification.body.coverage_rules ?? []),
    ...(classification.body.silhouette_rules ?? []),
    ...(classification.body.focus_areas ?? []),
    classification.face_hair_accessories.neckline_direction,
    ...(classification.face_hair_accessories.approved_necklines ?? []),
    ...(classification.taste.anti_codes ?? []),
    ...(classification.taste.shopping_filters ?? []),
  ].join(' '));
}

function coverageProfileFromSubmission(submission: StylistIntakeSubmission): StylistCoverageProfile {
  return profileFromCoverageText([
    freeTextFromUnknown(submission.coverage_requirements),
    freeTextFromUnknown(submission.prior_styling_experience),
    submission.one_outfit_description ?? '',
    submission.shopping_relationship ?? '',
  ].join(' '));
}

function deterministicCoverageRulesFromProfile(profile: StylistCoverageProfile): string[] {
  const rules: string[] = [];
  if (profile.neckline) {
    rules.push('Neckline coverage: avoid cleavage and very low necklines; do not assume high necklines are required.');
  }
  if (profile.arms) rules.push('Arm coverage: use a real sleeve or intentional layer; do not solve arm coverage with neckline changes.');
  if (profile.legs) rules.push('Leg coverage: keep hemlines at or below the knee, or use trousers/full-length bottoms.');
  if (profile.opacity) rules.push('Opacity: use lined or opaque fabrics; avoid sheer, transparent, or clingy see-through pieces.');
  if (profile.looseFit) rules.push('Fit comfort: avoid bodycon or cling through sensitive areas; use controlled ease and clean fall.');
  return rules;
}

export function inferStylistCoverageProfile(reportData: Pick<StylistBlueprintReportData, 'classification'>): StylistCoverageProfile {
  return coverageProfileFromClassification(reportData.classification);
}

export function coverageRequiresCover(classification: StylistBlueprintClassification): boolean {
  const profile = coverageProfileFromClassification(classification);
  return profile.arms;
}

// Representative hex for each colour word the library uses. Anchor colours are
// snapped to the client's actual palette, so these only need to be in the right
// neighbourhood — the snap rounds them to a real, on-palette, undertone-safe shade.
const NAMED_COLOUR_HEX: Record<string, string> = {
  black: '#1A1A1A', jet: '#1A1A1A', ink: '#1F2933',
  white: '#FFFFFF', 'off-white': '#F5F2EA', offwhite: '#F5F2EA', ivory: '#F3ECDD',
  cream: '#F1E7D2', chalk: '#F2EFE6', pearl: '#EDE7DA', bone: '#E4DBC8', ecru: '#D6C9AC', nude: '#E3C8A8',
  navy: '#1F2A44', blue: '#3E5C8A', cobalt: '#2E4E9E', indigo: '#34406B', periwinkle: '#8C9EDB', sapphire: '#28407A',
  grey: '#8C8C8C', gray: '#8C8C8C', slate: '#6E7884', charcoal: '#36393D', graphite: '#3A3D42', pewter: '#8E9094', silver: '#C7C9CC',
  brown: '#6B4A2F', tan: '#C2A178', taupe: '#A89A88', camel: '#C19A6B', cognac: '#9A5B34', espresso: '#3B2A21',
  cocoa: '#4B342A', chocolate: '#4A2F23', mocha: '#6F5647', beige: '#D9C7AC', oat: '#D8CBB3', oatmeal: '#D8CBB3',
  stone: '#C8BFAE', sand: '#D6C4A1', khaki: '#9A8C68',
  olive: '#6B6A3C', green: '#4F6B4A', emerald: '#1F6E54', teal: '#2C6E6A', sage: '#9BA790', forest: '#2C4A35', mint: '#A9D2BE', jade: '#2E7D6B',
  burgundy: '#6E2C39', oxblood: '#5A2733', maroon: '#5C2E33', wine: '#6A2C3E', berry: '#7C3A55', raspberry: '#9B2F5C', cranberry: '#8A2E45', cherry: '#A8323A', plum: '#5E3A57', aubergine: '#45304A',
  red: '#9E3B36', crimson: '#8E2A37', scarlet: '#B23A2E',
  pink: '#D8A0AE', rose: '#C98B97', blush: '#E3C2C2', dusty: '#B5828B', fuchsia: '#B83E7E', magenta: '#B0357C', coral: '#D87B66', peach: '#E6BBA0', salmon: '#E0937E',
  orange: '#C8612F', rust: '#9C5230', terracotta: '#A4593B', sienna: '#8B4A33', amber: '#C08A3E',
  mustard: '#C49A3A', marigold: '#D2942F', gold: '#B08D3F', golden: '#B08D3F', yellow: '#D6BB55', ochre: '#BB8A3C',
  mauve: '#A988A0', lilac: '#C4A8D6', lavender: '#B7A6D4', purple: '#6A4A86', violet: '#6E4E97',
  bronze: '#8C6A3E', copper: '#A56A3E',
  aqua: '#84C0C0', turquoise: '#46B5AC', cyan: '#5EC2C9',
};

const ANCHOR_NEUTRAL_WORDS = new Set([
  'black', 'jet', 'ink', 'white', 'off-white', 'offwhite', 'ivory', 'cream', 'chalk', 'pearl', 'bone', 'ecru', 'nude',
  'navy', 'grey', 'gray', 'slate', 'charcoal', 'graphite', 'pewter', 'silver',
  'brown', 'tan', 'taupe', 'camel', 'cognac', 'espresso', 'cocoa', 'chocolate', 'mocha', 'beige', 'oat', 'oatmeal', 'stone', 'sand', 'khaki',
]);

// Longest keys first so "off-white" wins over "white" at the same position.
const ANCHOR_COLOUR_RE = new RegExp(
  `\\b(${Object.keys(NAMED_COLOUR_HEX).sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})\\b`,
  'gi',
);

type AnchorColour = { word: string; hex: string; neutral: boolean };

// Pulls the colour story out of a verified library outfit, in garment order
// (fields are already priority-ordered, so the lead garment's colour comes first).
function extractAnchorColours(outfit: ParsedStylistOutfit): AnchorColour[] {
  const seen = new Set<string>();
  const out: AnchorColour[] = [];
  for (const field of outfit.fields) {
    const matches = field.value.toLowerCase().match(ANCHOR_COLOUR_RE);
    if (!matches) continue;
    for (const raw of matches) {
      const word = raw.toLowerCase();
      const hex = NAMED_COLOUR_HEX[word];
      if (!hex || seen.has(word)) continue;
      seen.add(word);
      out.push({ word, hex, neutral: ANCHOR_NEUTRAL_WORDS.has(word) });
    }
  }
  return out;
}

function snapColourToPalette(
  hex: string,
  palette: Array<{ name: string; hex: string }>,
  family?: WardrobeColourFamily,
): { name: string; hex: string } | undefined {
  if (!palette.length) return undefined;
  // Snap within the same colour family first so mid-saturation colours stop
  // collapsing into the palette's neutrals via raw RGB distance.
  const targetFamily = family ?? colourFamilyOfHex(hex);
  const familyPool = palette.filter(entry => wardrobeColourFamily(entry) === targetFamily);
  const pool = familyPool.length ? familyPool : palette;
  let best = pool[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of pool) {
    const distance = colourDistance(hex, entry.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return { name: best.name, hex: normaliseHex(best.hex) };
}

// Balanced-hybrid colour assignment: when the anchor outfit names real colours,
// derive the outfit's lead/support/ground/accent from them (snapped to the client
// palette) instead of cycling palette slots by index. Returns {} when the anchor
// is too colour-sparse, so the caller falls back to the deterministic cycle.
function anchorColourStory(
  outfit: ParsedStylistOutfit | undefined,
  base: Array<{ name: string; hex: string }>,
  accents: Array<{ name: string; hex: string }>,
): { lead?: PlannedOutfitColour; support?: PlannedOutfitColour; ground?: PlannedOutfitColour; accent?: PlannedOutfitColour } {
  if (!outfit) return {};
  const colours = extractAnchorColours(outfit);
  if (colours.length < 2) return {};

  const usedHex = new Set<string>();
  const anchorFamily = (candidate: AnchorColour): WardrobeColourFamily =>
    candidate.neutral ? 'neutral' : colourFamilyOfHex(candidate.hex);
  const pickDistinct = (candidates: AnchorColour[], role: BlueprintColourUse['role']): PlannedOutfitColour | undefined => {
    for (const candidate of candidates) {
      const snap = snapColourToPalette(candidate.hex, base, anchorFamily(candidate));
      if (!snap || usedHex.has(snap.hex)) continue;
      usedHex.add(snap.hex);
      return { name: snap.name, hex: snap.hex, role };
    }
    return undefined;
  };

  const lead = pickDistinct(colours, 'lead');
  const support = pickDistinct(colours, 'support');
  const ground = pickDistinct(colours.filter(colour => colour.neutral), 'ground');

  const saturated = colours.find(colour => !colour.neutral);
  const accentSnap = saturated
    ? snapColourToPalette(saturated.hex, accents.length ? accents : base, anchorFamily(saturated))
    : undefined;
  const accent = accentSnap ? { name: accentSnap.name, hex: accentSnap.hex, role: 'accent' as const } : undefined;

  return { lead, support, ground, accent };
}

function paletteColourText(colour: { name: string; hex: string }) {
  return `${colour.name} ${colour.hex}`.toLowerCase();
}

function isWardrobeNeutral(colour: { name: string; hex: string }) {
  return /(black|ink|charcoal|grey|gray|slate|pewter|navy|ivory|cream|white|stone|oat|taupe|mushroom|camel|tan|beige|espresso|cocoa|chocolate|brown|denim)/i.test(paletteColourText(colour)) ||
    colourSaturation(colour.hex) < 0.22;
}

function isProfessionalAnchorNeutral(colour: { name: string; hex: string }) {
  return /(navy|charcoal|slate|grey|gray|black|ink|taupe|mushroom|stone|ivory|white|espresso|cocoa|chocolate)/i.test(paletteColourText(colour));
}

function pickDistinctPlannedColour(
  palette: Array<{ name: string; hex: string }>,
  role: BlueprintColourUse['role'],
  used: Set<string>,
  fallbackIndex: number,
  predicate?: (colour: { name: string; hex: string }) => boolean,
) {
  const candidates = predicate ? palette.filter(predicate) : palette;
  const ordered = candidates.length
    ? Array.from({ length: candidates.length }, (_, offset) => candidates[(fallbackIndex + offset) % candidates.length])
    : [];
  const hit = ordered.find(colour => !used.has(normaliseHex(colour.hex)))
    ?? ordered[0]
    ?? palette[fallbackIndex % Math.max(1, palette.length)]
    ?? paletteFallback(fallbackIndex);
  used.add(normaliseHex(hit.hex));
  return plannedColour(hit, role, fallbackIndex);
}

// Cross-set lead colour caps: at most 3 outfits per colour family and a wider
// allowance for neutral-led looks, so a 20-outfit set is forced across at
// least ~6 distinct families instead of repeating the library's house palette.
const LEAD_COLOUR_FAMILY_CAP = 3;
const LEAD_NEUTRAL_FAMILY_CAP = 8;

function restrainedColourStory(
  reportData: StylistBlueprintReportData,
  capsule: PlannedOutfit['capsule'],
  index: number,
  libraryOutfit: ParsedStylistOutfit | undefined,
  decision: StylingDecisionPlan,
  leadFamilyCounts: Map<WardrobeColourFamily, number> = new Map(),
): { lead: PlannedOutfitColour; support: PlannedOutfitColour; ground: PlannedOutfitColour; accent?: PlannedOutfitColour } {
  const base = Array.from({ length: BASE_PALETTE_SIZE }, (_, colourIndex) => reportData.classification.colour.base_palette[colourIndex] ?? paletteFallback(colourIndex));
  const accents = Array.from({ length: ACCENT_PALETTE_SIZE }, (_, colourIndex) => reportData.classification.colour.accent_palette[colourIndex] ?? paletteFallback(colourIndex + 5));
  const anchorColours = anchorColourStory(libraryOutfit, base, accents);
  const used = new Set<string>();
  const neutralPool = base.filter(isWardrobeNeutral);
  const nonNeutralPool = base.filter(colour => !isWardrobeNeutral(colour));
  const professionalPool = base.filter(isProfessionalAnchorNeutral);
  const groundedPool = professionalPool.length ? professionalPool : neutralPool.length ? neutralPool : base;

  // Palette-first lead allocation: the client's palette drives which colour
  // family leads each outfit, rotating through the least-used families. The
  // anchor outfit's own lead is honoured only while it fits the caps, so the
  // library's house colours cannot dominate the whole set.
  const wantsNeutralLead = capsule === 'Professional' && index % 2 !== 0;
  const familyCount = (colour: { name: string; hex: string }) => leadFamilyCounts.get(wardrobeColourFamily(colour)) ?? 0;
  const familyCap = (colour: { name: string; hex: string }) =>
    wardrobeColourFamily(colour) === 'neutral' ? LEAD_NEUTRAL_FAMILY_CAP : LEAD_COLOUR_FAMILY_CAP;

  let lead: PlannedOutfitColour;
  const anchorLead = anchorColours.lead;
  const anchorLeadFits = Boolean(anchorLead)
    && familyCount(anchorLead!) < familyCap(anchorLead!)
    && (wantsNeutralLead ? isWardrobeNeutral(anchorLead!) : !isWardrobeNeutral(anchorLead!));
  if (anchorLead && anchorLeadFits) {
    lead = anchorLead;
  } else {
    const pool = wantsNeutralLead ? groundedPool : (nonNeutralPool.length ? nonNeutralPool : base);
    const ordered = [...pool].sort((a, b) => familyCount(a) - familyCount(b));
    const lowestCount = ordered.length ? familyCount(ordered[0]) : 0;
    const leastUsed = ordered.filter(colour => familyCount(colour) === lowestCount);
    const pick = leastUsed.length ? leastUsed[index % leastUsed.length] : paletteFallback(index);
    lead = plannedColour(pick, 'lead', index);
  }
  leadFamilyCounts.set(wardrobeColourFamily(lead), familyCount(lead) + 1);
  used.add(normaliseHex(lead.hex));

  const supportPool = neutralPool.length ? neutralPool : base;
  const support = anchorColours.support && normaliseHex(anchorColours.support.hex) !== normaliseHex(lead.hex)
    ? anchorColours.support
    : pickDistinctPlannedColour(supportPool, 'support', used, index + 3);
  used.add(normaliseHex(support.hex));

  const ground = anchorColours.ground && !used.has(normaliseHex(anchorColours.ground.hex))
    ? anchorColours.ground
    : pickDistinctPlannedColour(groundedPool, 'ground', used, index + 6);
  used.add(normaliseHex(ground.hex));

  // Accents run on a steady cadence from the client's accent palette instead
  // of waiting for the anchor text to mention accent-ish words.
  const accentAllowed = capsule === 'Professional' ? index % 4 === 2 : index % 2 === 1;
  let accent: PlannedOutfitColour | undefined;
  if (accentAllowed) {
    accent = anchorColours.accent && !used.has(normaliseHex(anchorColours.accent.hex))
      ? anchorColours.accent
      : pickDistinctPlannedColour(
        accents.length ? accents : nonNeutralPool,
        'accent',
        used,
        index + 1,
        colour => !isWardrobeNeutral(colour),
      );
  }

  if (decision.outfit_message.includes('not loud')) return { lead, support, ground };
  return { lead, support, ground, accent };
}

function shouldPlanLayer(capsule: PlannedOutfit['capsule'], capsuleIndex: number) {
  const layerSchedule: Record<PlannedOutfit['capsule'], number[]> = {
    Professional: [0, 3, 4],
    Social: [0, 4],
    Everyday: [1, 3],
    Occasion: [0, 4],
  };
  return layerSchedule[capsule].includes(capsuleIndex);
}

function buildOutfitDiversityPlan(
  reportData: StylistBlueprintReportData,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
  culturalMode: StylistOutfitCulturalMode = 'ethnic_allowed',
): PlannedOutfit[] {
  // In western_default mode, ethnic outfits must never become assigned
  // skeletons — filter them out of the anchor pool up front.
  const library = culturalMode === 'western_default'
    ? libraryContext.outfits.filter(outfit => !isEthnicLibraryAnchor(outfit))
    : libraryContext.outfits;
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const perCapsule = outfitCount / 4;
  const coverageProfile = coverageProfileFromClassification(reportData.classification);
  const usedLibrarySignatures = new Map<string, number>();
  const anchorDiversity = seedAnchorDiversityState();
  const leadFamilyCounts = new Map<WardrobeColourFamily, number>();
  const client = reportData.classification.client;
  const anchorSeed = stringHash(`${client.name}|${client.email}`);

  return Array.from({ length: outfitCount }, (_, index): PlannedOutfit => {
    const capsule = CAPSULE_SEQUENCE[Math.floor(index / perCapsule)] ?? 'Everyday';
    const capsuleIndex = index % perCapsule;
    const anchorRole = anchorRoleForOutfit(capsule, index, reportData.classification, coverageProfile);
    const libraryOutfit = chooseLibraryOutfit(library, capsule, index, usedLibrarySignatures, libraryContext.blockedSignatures, anchorRole, anchorDiversity, anchorSeed);
    const accentIndex = Math.floor(index / 2) % ACCENT_APPLICATIONS.length;
    const textureCycle = Math.floor(index / TEXTURE_DIRECTIONS.length);
    const stylingDecision = buildStylingDecisionPlan(reportData, capsule, index, coverageProfile, culturalMode, libraryOutfit, anchorRole);
    const colours = restrainedColourStory(reportData, capsule, index, libraryOutfit, stylingDecision, leadFamilyCounts);
    const usesAccent = Boolean(colours.accent);
    const professionalFormalLayer = capsule === 'Professional' && shouldPlanLayer(capsule, capsuleIndex);
    const layerRequired = shouldPlanLayer(capsule, capsuleIndex);
    const formulaDirections = layerRequired ? FORMULA_DIRECTIONS[capsule] : NO_LAYER_FORMULA_DIRECTIONS[capsule];
    const accentMode: PlannedOutfit['accent_mode'] = usesAccent ? 'detail' : undefined;
    const layerPool = LAYER_TYPES_BY_CAPSULE[capsule];
    const professionalLayerType = ['unstructured linen blazer', 'tailored waistcoat', 'soft knit blazer-jacket', 'unstructured blazer', 'cropped polished jacket'][capsuleIndex];
    const finishingRequired = requiresFinishingDetail(capsule, index);
    const patternRequired = requiresPattern(capsule, index);
    const textureDirection = textureDirectionForPlan(capsule, index, textureCycle);
    const patternDirection = patternDirectionForPlan(capsule, index, textureCycle);
    const plan: PlannedOutfit = {
      outfit_number: index + 1,
      page_number: getStylistBlueprintOutfitStartPage(reportData) + index,
      cultural_mode: culturalMode,
      capsule,
      formula_direction: `${stylingDecision.anchor_piece} -> ${formulaDirections[index % formulaDirections.length]}`,
      texture_direction: textureDirection,
      pattern_direction: patternDirection,
      pattern_required: patternRequired,
      pattern_instruction: patternRequired ? patternDirection : undefined,
      lead_colour: colours.lead,
      support_colour: colours.support,
      ground_colour: colours.ground,
      accent_colour: usesAccent ? colours.accent : undefined,
      accent_application: usesAccent ? ACCENT_APPLICATIONS[accentIndex] : undefined,
      accent_mode: accentMode,
      finishing_required: finishingRequired,
      finishing_detail_type: finishingRequired ? finishingDetailTypeForPlan(capsule, index) : undefined,
      layer_required: layerRequired,
      layer_type: layerRequired ? (professionalFormalLayer ? professionalLayerType : layerPool[index % layerPool.length]) : undefined,
      coverage_requires_cover: coverageProfile.arms,
      coverage_profile: coverageProfile,
      styling_decision: stylingDecision,
      eyewear_required: false,
      max_visible_colours: 3,
      library_reference: libraryOutfit ? libraryReferenceForPlan(libraryOutfit, capsule) : undefined,
      library_piece_logic: libraryOutfit ? libraryPieceLogic(libraryOutfit) : undefined,
    };
    refreshPlanEyewear(plan, reportData, index);
    return plan;
  });
}

export function buildOutfitDiversityPlanForTest(
  reportData: StylistBlueprintReportData,
  culturalMode: StylistOutfitCulturalMode = 'ethnic_allowed',
): PlannedOutfit[] {
  return buildOutfitDiversityPlan(reportData, seedOutfitLibraryContext(), culturalMode);
}

type ParsedHarnessOutfit = {
  outfitNumber: number;
  context: string;
  top: string;
  bottom: string;
  layer: string;
  footwear: string;
  bag: string;
  jewellery: string;
  finishing: string;
  eyewear: string;
  whyItWorks: string;
  oneMove: string;
  dnaCheck: string;
  fourAxisScore: string;
  realismCheck: string;
  doNotBuy: string;
};

const HARNESS_SECTION_MARKERS: Array<{ key: keyof Omit<ParsedHarnessOutfit, 'outfitNumber' | 'context'>; pattern: RegExp }> = [
  { key: 'top', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?1\s*[—:.\-]\s*)?TOP(?:\s*\/\s*KURTA)?\s*:\s*(?:\*\*)?/im },
  { key: 'bottom', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?2\s*[—:.\-]\s*)?BOTTOM\s*:\s*(?:\*\*)?/im },
  { key: 'layer', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?3\s*[—:.\-]\s*)?LAYER(?:\s*\/\s*DUPATTA)?\s*:\s*(?:\*\*)?/im },
  { key: 'footwear', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?4\s*[—:.\-]\s*)?FOOTWEAR\s*:\s*(?:\*\*)?/im },
  { key: 'bag', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?5\s*[—:.\-]\s*)?BAG\s*:\s*(?:\*\*)?/im },
  { key: 'jewellery', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?6\s*[—:.\-]\s*)?JEWELL?ERY\s*:\s*(?:\*\*)?/im },
  { key: 'finishing', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?7\s*[—:.\-]\s*)?FINISHING DETAIL\s*:\s*(?:\*\*)?/im },
  { key: 'eyewear', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:0?8\s*[—:.\-]\s*)?EYEWEAR\s*:\s*(?:\*\*)?/im },
  { key: 'whyItWorks', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:WHY (?:IT|THIS|THE OUTFIT) WORKS(?:\s+FOR\s+(?:HER|THE CLIENT))?|WHY THIS OUTFIT WORKS|STYLING LOGIC|WHY THIS LOOK WORKS)\s*:\s*(?:\*\*)?/im },
  { key: 'oneMove', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?(?:THE\s*)?ONE MOVE\s*:\s*(?:\*\*)?/im },
  { key: 'dnaCheck', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?DNA CHECK\s*:\s*(?:\*\*)?/im },
  { key: 'fourAxisScore', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?FOUR[-\s]?AXIS SCORE\s*:\s*(?:\*\*)?/im },
  { key: 'realismCheck', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?REALISM CHECK\s*:\s*(?:\*\*)?/im },
  { key: 'doNotBuy', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?DO NOT BUY\s*:\s*(?:\*\*)?/im },
];

function stripHarnessMarkdown(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNoneHarnessValue(value: string) {
  return /^(none|n\/a|not needed|not required|skip|no)$/i.test(stripHarnessMarkdown(value));
}

function parseHarnessSection(block: string, key: keyof Omit<ParsedHarnessOutfit, 'outfitNumber' | 'context'>) {
  const located = HARNESS_SECTION_MARKERS
    .map(marker => {
      const match = marker.pattern.exec(block);
      return match ? { ...marker, start: match.index, end: match.index + match[0].length } : null;
    })
    .filter((item): item is { key: keyof Omit<ParsedHarnessOutfit, 'outfitNumber' | 'context'>; pattern: RegExp; start: number; end: number } => Boolean(item))
    .sort((a, b) => a.start - b.start);
  const current = located.find(marker => marker.key === key);
  if (!current) return '';
  const next = located.find(marker => marker.start > current.start);
  return stripHarnessMarkdown(block.slice(current.end, next?.start ?? block.length));
}

function fallbackHarnessWhyItWorks(parsed: Pick<ParsedHarnessOutfit, 'top' | 'bottom' | 'layer' | 'footwear' | 'bag' | 'finishing' | 'oneMove'>) {
  const pieces = [
    parsed.top ? `top: ${parsed.top}` : '',
    parsed.bottom ? `bottom: ${parsed.bottom}` : '',
    parsed.layer && !isNoneHarnessValue(parsed.layer) ? `layer: ${parsed.layer}` : '',
    parsed.footwear ? `footwear: ${parsed.footwear}` : '',
    parsed.bag ? `bag: ${parsed.bag}` : '',
    parsed.finishing && !isNoneHarnessValue(parsed.finishing) ? `finish: ${parsed.finishing}` : '',
  ].filter(Boolean).join('; ');
  const move = parsed.oneMove || 'a clear proportion and polish move';
  return `This outfit works through ${move}, using ${pieces} to create a balanced, polished, client-specific silhouette with controlled colour and wearable structure.`;
}

function fillHarnessNarrativeFallbacks(parsed: ParsedHarnessOutfit) {
  if (!parsed.oneMove) {
    parsed.oneMove = parsed.finishing && !isNoneHarnessValue(parsed.finishing)
      ? parsed.finishing
      : 'Polished proportion balance';
  }
  if (!parsed.whyItWorks && parsed.top && parsed.bottom && parsed.footwear && parsed.bag) {
    parsed.whyItWorks = fallbackHarnessWhyItWorks(parsed);
  }
  if (!parsed.dnaCheck) {
    parsed.dnaCheck = 'Texture yes; warm bridge yes; one move yes; long line yes; contrast yes';
  }
  if (!parsed.fourAxisScore) {
    parsed.fourAxisScore = 'Realism yes; Diversity yes; Elevatedness yes; Relevance yes';
  }
  if (!parsed.realismCheck) {
    parsed.realismCheck = 'Collar/neckline clean; buttoning realistic; tuck/drape clean; category accurate';
  }
  if (!parsed.doNotBuy) {
    parsed.doNotBuy = 'Do not buy the shapeless, clingy, overly busy, or poorly proportioned version of this outfit.';
  }
}

const NO_LAYER_HARNESS_VALUE = 'None';
const ARM_COVERAGE_CUT_RE = /\b(sleeve|sleeved|elbow[-\s]?length|bracelet[-\s]?length|three[-\s]?quarter|3\/4|long[-\s]?sleeve|short[-\s]?sleeve|cap[-\s]?sleeve|covered shoulder|shoulder coverage|kimono sleeve|dolman sleeve|batwing sleeve)\b/i;
const ARM_EXPOSURE_RE = /\b(sleeveless|strapless|spaghetti\s+strap|thin\s+strap|cami|camisole|tank)\b/i;

function sleeveCoveragePhraseForPlan(plan: PlannedOutfit) {
  if (plan.capsule === 'Occasion') return 'with elegant bracelet-length sleeves';
  if (plan.capsule === 'Everyday') return 'with easy elbow-length sleeves';
  return 'with clean elbow-length sleeves';
}

function ensureNoLayerArmCoverage(piece: string, plan: PlannedOutfit) {
  if (!plan.coverage_requires_cover && !plan.coverage_profile.arms) return piece;
  if (ARM_COVERAGE_CUT_RE.test(piece)) return piece;

  const phrase = sleeveCoveragePhraseForPlan(plan);
  const replacedExposure = piece
    .replace(/\bspaghetti\s+strap\b/gi, 'sleeved')
    .replace(/\bthin\s+strap\b/gi, 'sleeved')
    .replace(/\bstrapless\b/gi, 'sleeved')
    .replace(/\bsleeveless\b/gi, 'sleeved')
    .replace(/\bcamisole\b/gi, 'sleeved shell')
    .replace(/\bcami\b/gi, 'sleeved shell')
    .replace(/\btank\b/gi, 'sleeved shell')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (replacedExposure !== piece && !ARM_EXPOSURE_RE.test(replacedExposure)) {
    return ARM_COVERAGE_CUT_RE.test(replacedExposure)
      ? replacedExposure
      : `${replacedExposure} ${phrase}`;
  }

  return `${piece} ${phrase}`.replace(/\s{2,}/g, ' ').trim();
}

function appendNoLayerCoverageLogic(existing: string) {
  const addition = 'Arm coverage is built into the sleeve or cut, so the look stays polished without a separate layer.';
  if (!existing) return addition;
  if (/without a separate layer|sleeve or cut|sleeve-led|built into the sleeve/i.test(existing)) return existing;
  return `${existing} ${addition}`;
}

const NO_LAYER_GHOST_LAYER_RE = /\b(jacket|blazer|cardigan|vest|waistcoat|overshirt|coat|duster|bolero|shacket|wrap|dupatta|shawl|outer frame|third[-\s]?piece|layer)\b/i;
const EVERYDAY_BAD_LAYER_RE = /\b(longline\s+denim\s+duster|denim\s+duster|duster\s+coat|longline\s+blazer|corporate\s+blazer|double[-\s]?breasted\s+blazer|military[-\s]?inspired\s+jacket)\b/i;
const EVERYDAY_OFFICE_BOTTOM_RE = /\b(pinstripe|glen[-\s]?plaid|windowpane|herringbone|suiting|cigarette\s+trouser|pencil\s+skirt|boardroom)\b/i;
const EVERYDAY_BAD_DRESS_RE = /\b(ponte\s+(?:sheath\s+)?dress|plain\s+ponte|smooth\s+ponte\s+dress|belted\s+ponte)\b/i;
const EVERYDAY_BAD_TOP_RE = /\b(double[-\s]?breasted\s+(?:top|shirt|blouse)|structured\s+shoulders\s+.*(?:top|shirt|blouse))\b/i;

function everydayLayerFallback(plan: PlannedOutfit) {
  const layerType = (plan.layer_type || '').toLowerCase();
  if (/denim|chambray/.test(layerType)) return 'cropped mid-blue denim jacket with clean seaming, worn open';
  if (/utility/.test(layerType)) return 'lightweight olive utility jacket with refined pockets, worn open';
  if (/cotton-linen|linen/.test(layerType)) return 'open cotton-linen shirt with rolled sleeves';
  if (/shirt-jacket|shacket/.test(layerType)) return 'relaxed chambray shirt-jacket worn open';
  return 'bold charcoal-and-white striped cotton overshirt worn open with casually rolled sleeves';
}

function everydayTravelFallback(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  parsed.top = plan.layer_required
    ? 'White fitted scoop-neck cotton tank top'
    : 'Charcoal-and-white striped cotton button-down shirt with rolled sleeves over a fitted scoop-neck base';
  parsed.layer = plan.layer_required
    ? everydayLayerFallback({ ...plan, layer_type: 'bold striped cotton overshirt worn open' })
    : NO_LAYER_HARNESS_VALUE;
  parsed.bottom = 'Soft cream high-waisted wide-leg trousers with a fluid full-length drape';
  parsed.footwear = 'Clean white leather low-top sneakers';
  parsed.bag = 'Structured black practical tote bag';
  parsed.jewellery = 'Delicate layered gold necklaces, slim gold watch, and small hoops';
  parsed.finishing = 'Slim black leather belt with a gold buckle, narrow black sunglasses, and a black baseball cap with subtle gold detail';
  parsed.oneMove = 'Striped overshirt travel polish';
  parsed.whyItWorks = plan.layer_required
    ? 'The striped open overshirt makes the base tank and wide-leg trouser feel styled instead of basic, while the belt defines the waist without sacrificing comfort. White sneakers, a structured tote, narrow sunglasses, and the cap keep the look realistic for travel but still visibly elevated.'
    : 'The striped shirt and fitted base create the same off-duty contrast without a separate layer, while the belt defines the waist without sacrificing comfort. White sneakers, a structured tote, narrow sunglasses, and the cap keep the look realistic for travel but still visibly elevated.';
  parsed.realismCheck = 'Travel pieces are searchable and wearable; sneaker, tote, belt, cap, and rolled overshirt are practical; no office suiting or formal pumps';
  parsed.fourAxisScore = 'Realism yes; Diversity yes; Elevatedness yes; Relevance yes';
}

function scrubNoLayerNarrative(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  if (NO_LAYER_GHOST_LAYER_RE.test(parsed.oneMove)) {
    parsed.oneMove = plan.coverage_requires_cover || plan.coverage_profile.arms
      ? 'Sleeve-led polish with clean colour and proportion'
      : 'Clean colour and proportion without a separate layer';
  }
  if (NO_LAYER_GHOST_LAYER_RE.test(parsed.whyItWorks)) {
    parsed.whyItWorks = fallbackHarnessWhyItWorks(parsed);
  }
  if (NO_LAYER_GHOST_LAYER_RE.test(parsed.realismCheck)) {
    parsed.realismCheck = 'Collar/neckline clean; sleeve/cut coverage realistic; tuck/drape clean; category accurate';
  }
}

function scrubEverydayNarrative(parsed: ParsedHarnessOutfit) {
  const badNarrative = /\b(denim\s+duster|longline\s+duster|pinstripe\s+trouser|corporate|boardroom|ponte\s+dress|double[-\s]?breasted\s+top|pointed\s+pump)\b/i;
  if (badNarrative.test(parsed.oneMove)) parsed.oneMove = 'Off-duty proportion polish';
  if (badNarrative.test(parsed.whyItWorks)) {
    parsed.whyItWorks = 'The look works because the casual base is styled with one intentional proportion or accessory move, keeping it realistic for everyday wear while still feeling more considered than a basic outfit.';
  }
  if (badNarrative.test(parsed.realismCheck)) {
    parsed.realismCheck = 'Everyday pieces are searchable and wearable; casual footwear and bag are practical; no office suiting or costume-like tailoring';
  }
}

function repairEverydayOutfitRealism(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  if (plan.capsule !== 'Everyday') return;
  const text = `${parsed.context} ${parsed.top} ${parsed.bottom} ${parsed.layer} ${parsed.footwear} ${parsed.bag} ${parsed.whyItWorks}`.toLowerCase();
  const isTravel = /\b(travel|airport|off-duty|vacation|resort)\b/.test(text);

  if ((isTravel && EVERYDAY_BAD_DRESS_RE.test(text)) || /smooth\s+ponte\s+dress/i.test(text)) {
    everydayTravelFallback(parsed, plan);
    return;
  }

  if (EVERYDAY_BAD_LAYER_RE.test(parsed.layer)) {
    parsed.layer = everydayLayerFallback(plan);
  }
  if (EVERYDAY_OFFICE_BOTTOM_RE.test(parsed.bottom)) {
    parsed.bottom = isTravel
      ? 'Soft cream high-waisted wide-leg trousers with a fluid full-length drape'
      : 'Dark indigo straight-leg denim or cream wide-leg cotton trousers with a clean full-length fall';
  }
  if (EVERYDAY_BAD_TOP_RE.test(parsed.top)) {
    parsed.top = 'Polished cotton shirt or soft knit top with clean sleeves and an easy neckline';
  }
  if (/\b(pointed\s+pumps|stiletto|patent\s+heel)\b/i.test(parsed.footwear)) {
    parsed.footwear = isTravel ? 'Clean white leather low-top sneakers' : 'Clean leather loafers or white leather low-top sneakers';
  }
  scrubEverydayNarrative(parsed);
}

function repairParsedHarnessOutfitAgainstPlan(parsed: ParsedHarnessOutfit, plan: PlannedOutfit): ParsedHarnessOutfit {
  const repaired = { ...parsed };

  if (!plan.layer_required) {
    repaired.layer = NO_LAYER_HARNESS_VALUE;
    repaired.top = ensureNoLayerArmCoverage(repaired.top, plan);
    scrubNoLayerNarrative(repaired, plan);
    if (plan.coverage_requires_cover || plan.coverage_profile.arms) {
      repaired.whyItWorks = appendNoLayerCoverageLogic(repaired.whyItWorks);
      if (!/sleeve|cut|no separate layer|without a separate layer/i.test(repaired.oneMove)) {
        repaired.oneMove = `${repaired.oneMove}; sleeve/cut coverage with no separate layer`;
      }
    }
  }

  repairEverydayOutfitRealism(repaired, plan);

  return repaired;
}

function parseHarnessOutfitText(text: string): ParsedHarnessOutfit[] {
  const headerPattern = /^\s*(?:#{1,6}\s*)?(?:[-*]\s*)?(?:\*\*)?OUTFIT\s*(?:#\s*)?\[?\s*(\d+)\s*\]?\s*(?:[—:.\-]\s*(.*?))?(?:\*\*)?\s*$/gim;
  const headers = [...text.matchAll(headerPattern)];
  if (!headers.length) {
    throw new Error('Harness outfit generation returned no OUTFIT blocks');
  }

  return headers.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < headers.length ? headers[index + 1].index ?? text.length : text.length;
    const block = text.slice(start, end);
    const parsed: ParsedHarnessOutfit = {
      outfitNumber: Number(match[1]),
      context: stripHarnessMarkdown(match[2] || `Look ${match[1]}`),
      top: parseHarnessSection(block, 'top'),
      bottom: parseHarnessSection(block, 'bottom'),
      layer: parseHarnessSection(block, 'layer'),
      footwear: parseHarnessSection(block, 'footwear'),
      bag: parseHarnessSection(block, 'bag'),
      jewellery: parseHarnessSection(block, 'jewellery'),
      finishing: parseHarnessSection(block, 'finishing'),
      eyewear: parseHarnessSection(block, 'eyewear'),
      whyItWorks: parseHarnessSection(block, 'whyItWorks'),
      oneMove: parseHarnessSection(block, 'oneMove'),
      dnaCheck: parseHarnessSection(block, 'dnaCheck'),
      fourAxisScore: parseHarnessSection(block, 'fourAxisScore'),
      realismCheck: parseHarnessSection(block, 'realismCheck'),
      doNotBuy: parseHarnessSection(block, 'doNotBuy'),
    };
    fillHarnessNarrativeFallbacks(parsed);
    const missing = [
      ['TOP', parsed.top],
      ['BOTTOM', parsed.bottom],
      ['FOOTWEAR', parsed.footwear],
      ['BAG', parsed.bag],
      ['JEWELLERY', parsed.jewellery],
    ].filter(([, value]) => !value);
    if (missing.length) {
      throw new Error(`Harness outfit ${parsed.outfitNumber || index + 1} is missing: ${missing.map(([label]) => label).join(', ')}`);
    }
    return parsed;
  });
}

function capsuleRangesForHarnessPrompt(reportData: StylistBlueprintReportData, plans: PlannedOutfit[]) {
  const lines: string[] = [];
  const previewNumbers = plans.filter(plan => plan.purpose === 'transformation_preview').map(plan => plan.outfit_number);
  if (previewNumbers.length) {
    lines.push(`Transformation Preview: outfits ${previewNumbers.join(', ')} (${previewNumbers.length} additional looks, not detailed report pages)`);
  }
  for (const capsule of CAPSULE_SEQUENCE) {
    const numbers = plans
      .filter(plan => plan.capsule === capsule && plan.purpose !== 'transformation_preview')
      .map(plan => plan.outfit_number);
    if (!numbers.length) continue;
    const first = numbers[0];
    const last = numbers[numbers.length - 1];
    const contiguous = numbers.every((number, index) => index === 0 || number === numbers[index - 1] + 1);
    lines.push(`${capsule}: outfits ${contiguous ? `${first}-${last}` : numbers.join(', ')} (${numbers.length} outfits)`);
  }
  if (lines.length) return lines.join('\n');

  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const perCapsule = outfitCount / CAPSULE_SEQUENCE.length;
  return CAPSULE_SEQUENCE
    .map((capsule, index) => `${capsule}: outfits ${index * perCapsule + 1}-${(index + 1) * perCapsule} (${perCapsule} outfits)`)
    .join('\n');
}

function buildHarnessClientContext(submission: StylistIntakeSubmission | null | undefined, reportData: StylistBlueprintReportData) {
  const classificationContext = buildStylistBlueprintOutfitClassificationContext(reportData);
  if (!submission) {
    return `--- CLIENT FIT CONTEXT ---
Use this client-specific classification as hard body, coverage, undertone, face, and taste context:

${classificationContext}`;
  }

  if (isManualStylistBlueprintSubmission(submission)) {
    return `--- MANUAL CLIENT CONTEXT ---
This is a manual-admin report. The pasted consultation/profile text and parsed preferences below are hard outfit guardrails.

Manual priority rules:
- Respect the raw notes, profile text, piece preferences, coverage requirements, lifestyle context, moodboard/aesthetic signals, and classification summary.
- Do not generate random outfits outside the client's stated preferences.
- If notes say the client loves or prefers a garment world, use it as directional flavour; do not repeat it mechanically across the set.
- If notes reject an item, exposure level, fit, footwear type, colour direction, garment category, or cultural style, do not include it.
- If a stated preference conflicts with body/coverage safety or garment realism, keep the safety/realism rule and choose the nearest acceptable alternative.
- Reject and regenerate any outfit that conflicts with the manual notes or profile preferences.

--- PARSED PROFILE, NOTES, AND PREFERENCES ---
${buildStylistBlueprintIntakeDigest(submission)}

--- CLASSIFICATION SUMMARY ---
${classificationContext}`;
  }

  return `--- CLIENT FIT CONTEXT ---
Use this client-specific context as guardrails. Hard coverage, fit, modesty, avoid, lifestyle, body, undertone, face, and realism signals override generic outfit variety. Treat softer item likes as directional rather than mandatory.

Form-choice interpretation:
- disliked/No piece choices are avoid signals unless an explicit admin note overrides them.
- skipped piece choices are neutral; ignore them completely.
- liked piece choices are broad flavour only. They may steer style worlds, but must not become repeated formulas or quotas.
- focus areas shape body strategy; coverage choices create hard garment boundaries; lifestyle choices set capsule emphasis; budget and shopping frequency set realism and repeatability.

Client intake:
Name: ${intakeDisplayName(submission)}
Country: ${submission.country || ''}
Age Range: ${submission.age_range || ''}
Focus Areas:
${stringify(submission.focus_areas)}

Coverage Requirements:
${stringify(submission.coverage_requirements)}

Lifestyle:
${stringify(submission.lifestyle_context)}

Piece Preferences Summary:
${summarisePiecePreferences(submission.piece_preferences)}

Raw Piece Preferences:
${stringify(submission.piece_preferences)}

Moodboard:
Selected: ${submission.selected_moodboard_label || submission.selected_moodboard_id || ''}
Secondary Elements: ${stringify(submission.secondary_moodboard_elements)}

Shopping Relationship:
${submission.shopping_relationship || ''}

Loved Outfit:
${submission.one_outfit_description || ''}

Classification:
${classificationContext}`;
}

function buildHarnessOnlyOutfitPrompt(
  reportData: StylistBlueprintReportData,
  plans: PlannedOutfit[],
  submission?: StylistIntakeSubmission | null,
  replacementContext?: ReplacementOutfitContext | null,
  replacementReason?: string,
  extraContext?: string,
) {
  const womenOutfitLibrary = readWomenOutfitLibraryText();
  const hasTransformationPreview = plans.some(plan => plan.purpose === 'transformation_preview');
  const culturalMode = plans[0]?.cultural_mode ?? getStylistOutfitCulturalMode(submission);
  const singleReplacementContext = replacementOutfitContextPrompt(replacementContext ?? null, replacementReason);
  return `${WOMEN_OUTFIT_HARNESS_V2}

---

--- ICONIK WOMEN OUTFIT LIBRARY ---
${womenOutfitLibrary
  ? `Use this 200-outfit library as the dominant catalog source for outfit quality. For each detailed report outfit, start from the assigned library_reference and library_piece_logic in the plan record when present. Preserve that catalog skeleton's garment categories, silhouette relationship, styling line, finish, and accessory architecture, then make only minimal client-specific adaptations for coverage, fit, body geometry, undertone, occasion, cultural mode, climate, and explicit dislikes. Maintain visible colour diversity, layer/no-layer diversity, silhouette diversity, footwear/bag variety, and finishing-detail variety across the set without grafting pieces from different library outfits. Do not mention source ids, entry numbers, source titles, "adapted from", or "library reference" in visible client-facing text. Do not add unnecessary detail to individual tops or formula items; simple, clean pieces are allowed when the complete outfit becomes elevated through proportion, colour relationship, texture, finishing, and accessories.${culturalMode === 'western_default' ? ' In western_default mode, ignore ethnic garment categories as usable skeletons unless a plan record explicitly assigns one; transfer only polish, colour logic, texture, proportion, and finishing detail intelligence when cultural guardrails require Western styling.' : ''}\n\n${womenOutfitLibrary}`
  : 'The outfit library file outfitlibrarywomen.md was not available. Continue with the harness rules and client context only.'}

---

${buildHarnessClientContext(submission, reportData)}

---

${culturalModeRules(culturalMode)}

---

Generate exactly ${plans.length} outfit${plans.length === 1 ? '' : 's'} total.

Categories:
${capsuleRangesForHarnessPrompt(reportData, plans)}

Outfit plan records:
${stringify(outfitPlansForHarnessPrompt(plans))}

${singleReplacementContext ? `${singleReplacementContext}\n\n` : ''}Plan enforcement:
- When a plan record includes library_reference and library_piece_logic, treat that as the catalog skeleton for that outfit. Preserve its supplied slots before applying layer_required, coverage, colour, cultural mode, and realism adjustments.
- Do not borrow pieces from another library entry. If a client guardrail blocks a slot, replace only that blocked slot with the nearest catalog-faithful equivalent and keep the rest of the skeleton intact.
- Respect layer_required/layer_type, pattern_required/pattern_instruction, texture_direction, colour_strategy, styling_decision.anchor_role, and finishing_required/finishing_detail_type in each plan record.
- Treat colour_strategy as stylist guidance, not a cage. The assigned library skeleton and real wardrobe logic decide the final colours; undertone adjusts shade temperature mainly near the face.
- Use classic combinations when they are the best outfit: blue striped white shirt, denim + ivory, navy + cream, black + gold/chocolate, olive + cream, burgundy + neutral, camel + blue, etc. These are allowed across undertones when the shade and contrast are flattering.
- Space colour visually. Do not let adjacent outfits read as the same dominant family; if the previous look is teal/green/blue-adjacent, move the next look toward a clearly different family or a classic neutral/stripe story.
- Colour should appear in meaningful garments across the set, but every outfit does not need a forced colour hero. A white shirt with blue stripes, denim, black dress, or navy blazer can be correct when the full outfit is strong.
- Professional looks with a required layer must include the named blazer, vest, or tailored jacket as a real formula item.
- If layer_required=false, 03 - LAYER must be None exactly. Do not preserve a library jacket/cardigan/vest/dupatta/wrap in that slot, even when the source outfit had one. For arm coverage, choose sleeves, drape, shoulder coverage, or one-piece construction instead of adding a separate layer or third-piece outer frame.
- Across the detailed outfit set, layers should appear in roughly half to 60% of looks, not all looks. Non-layer looks still need polish through cut, colour, texture, bag/shoe, and finishing detail.
- Required finishing details must appear in 07 - FINISHING DETAIL and should feel like the outfit library: scarf on neck/bag/hair, belt at waist, polished watch, soft lip tone, or feminine hair detail where it improves the look.
- Use scarf finishing as a balanced minority move. Include one clear bag-handle scarf moment across a full set when it suits the outfit, but do not put scarves on every bag or force scarves into every look.
- Rotate lead colours and patterns across the set. Do not make the recommendations feel like the same colour story repeated.
- Finishing detail lip tones must be wearable makeup shades only: rose-brown, nude rose, muted berry, soft coral, peach, mauve, terracotta, brick, wine, or blush. Never suggest blue, green, yellow, silver, gold, black, white, navy, teal, olive, emerald, purple, or novelty lipstick.

Four-axis outfit quality gate:
- Realism: every outfit must be easy to source from normal retail, with real garment names, normal fabrics, plausible colours, realistic shoe/bag materials, and wearable styling.
- Diversity: vary colour, pattern, garment type, layer type, footwear, bag, and finishing detail across the set. Use palette colours and out-of-palette classic wardrobe colours when the outfit is stronger that way.
- Elevatedness: each outfit needs one intelligent stylist move through proportion, pattern, texture, colour relationship, sleeve/neckline/hem choice, structured layer, belt/scarf/watch/hair/lip detail, or shoe/bag pairing.
- Relevance: each outfit must fit its capsule and occasion. Professional must look work-credible; Social must feel dinner/brunch/friend-facing; Everyday must be realistic but styled; Occasion must feel special without becoming costume-like.
- DNA CHECK and FOUR-AXIS SCORE must pass. If any outfit fails one axis, revise it before output.

Everyday and travel realism:
- Everyday is not weak officewear. Do not use boardroom formulas, pinstripe trousers, longline denim dusters, longline blazers, double-breasted short-sleeve tops, plain ponte belted dresses, pencil skirts, pointed pumps, work totes as the main idea, or corporate suiting language in Everyday.
- Everyday/Travel should feel like elevated off-duty styling: base tank/tee/knit, open striped overshirt or denim/chambray/utility jacket, wide-leg trouser/jean/chino/skirt, clean white sneaker/flat/sandal/loafer, belt, layered jewellery/watch, contemporary sunglasses, cap where appropriate, and a practical tote/crossbody.
- A strong travel outfit can be: white fitted scoop-neck tank, bold charcoal-and-white striped open overshirt with rolled sleeves, soft cream wide-leg trousers, slim black belt with gold buckle, layered gold jewellery, narrow black sunglasses, black baseball cap with subtle gold detail, clean white leather sneakers, and structured black tote.
- If the assigned library skeleton is too office-formal for Everyday, preserve only its styling logic and swap to the nearest realistic casual equivalent: blazer to cropped denim jacket/utility jacket/striped overshirt; pinstripe trouser to cream wide-leg trouser or dark straight denim; pumps to white sneaker/loafer/flat; work tote to practical tote/crossbody.

Capsule diversity requirements:
- Within each 5-outfit capsule, use at least 3 different main garment formulas from this set: top+trouser, top+skirt, dress/one-piece, co-ord/set, top+denim/chino, top+layered column.
- Within each 5-outfit capsule, use at least 2 different bottom families where bottoms appear: wide-leg trouser, straight/cigarette trouser, skirt, denim/chino, co-ord bottom, or no separate bottom because it is a dress/one-piece.
- Required layers in the same capsule must not all be blazers. Rotate blazer, vest, jacket, cardigan, overshirt, duster, or evening layer according to the plan's layer_type.
- Pattern_required=true must create a visible garment-level print/surface/detail, not only a tiny accessory. Use real wardrobe variety: striped shirts, pinstripe blazers/trousers, double-breasted blazers, polka-dot dresses or blouses, micro-checks, herringbone, jacquard, denim/chambray, contrast piping, or small-scale prints.
- Across a full 20-look set, include at least one striped shirt look, one denim jacket/chambray/denim texture look, one pinstripe or double-breasted blazer look, and one polka-dot or small-print dress/blouse when client guardrails allow.
- Do not repeat the same top type, bottom type, layer type, bag shape, shoe type, finishing detail placement, or lead colour family more than twice inside one capsule unless a hard client guardrail leaves no realistic alternative.

Private elevation preflight:
- Think through the full set before writing any OUTFIT block. Do not output this thinking.
- First assign distinct colour families, pattern/surface ideas, silhouettes, layer/no-layer status, layer types, footwear, bag shapes, and finishing placements across the set.
- Then write the final outfit blocks. If two outfits feel interchangeable, revise one before output.
- Make the looks more elevated than basic office formulas: use precise fabric, neckline, sleeve, hem, proportion, and one intentional finishing move.
- Avoid over-writing tops and other formula items with needless trims, collars, buttons, or extra details. A simple top, trouser, shoe, bag, or scarf can be right when the complete outfit feels elevated.
- For budget-conscious clients, elevation comes from styling architecture, fit, texture, colour, scarf/belt/watch/hair/lip details, and polished shoe/bag choices rather than expensive statement pieces.

${hasTransformationPreview
  ? `Transformation preview rules:
- Outfits 01-03 are transformation preview looks only. They are additional options for page 2, not part of the 20 detailed outfit pages.
- Outfits 04-${plans.length} become the detailed report outfit pages.
- Do not repeat the same top/bottom/layer silhouette, colour hero, or outfit archetype from Outfits 01-03 inside Outfits 04-${plans.length}.
- The preview looks should feel transformational and immediately visual, but still obey every hard dislike, coverage, modesty, undertone, body geometry, lifestyle, and explicit-note rule.`
  : ''}

${extraContext ? `${extraContext}\n\n` : ''}

Return plain text only using the harness output format.
Do not return JSON.
Do not add any wrapper, introduction, notes, analysis, or explanation outside the outfit blocks.`;
}

function buildStrictHarnessRetryPrompt(originalPrompt: string, plans: PlannedOutfit[], error: unknown) {
  const expectedNumbers = plans.map(plan => String(plan.outfit_number).padStart(2, '0')).join(', ');
  const message = error instanceof Error ? error.message : String(error);
  const layerContract = plans
    .map(plan => `OUTFIT ${String(plan.outfit_number).padStart(2, '0')}: layer_required=${plan.layer_required}${plan.layer_required ? `, 03 - LAYER must be a real ${plan.layer_type ?? 'layer'}` : ', 03 - LAYER must be None exactly'}`)
    .join('\n');
  return `The previous outfit response could not be parsed: ${message}

Regenerate the full outfit set now. This is a strict formatting retry.

Output exactly ${plans.length} outfit blocks, and only outfit blocks.
Required outfit numbers: ${expectedNumbers}

Every block must begin with this exact header pattern:
OUTFIT 01 - Context / occasion

Every block must include these exact labels, one per line:
01 - TOP:
02 - BOTTOM:
03 - LAYER:
04 - FOOTWEAR:
05 - BAG:
06 - JEWELLERY:
07 - FINISHING DETAIL:
08 - EYEWEAR:
WHY IT WORKS:
THE ONE MOVE:
DNA CHECK:
FOUR-AXIS SCORE:
REALISM CHECK:
DO NOT BUY:

Layer contract:
${layerContract}

For every layer_required=false outfit, write "03 - LAYER: None" exactly. If arm coverage is needed, solve it in 01 - TOP through sleeves, shoulder coverage, drape, or one-piece cut. Do not use a blazer, jacket, cardigan, vest, overshirt, duster, wrap, dupatta, shawl, or outer frame.

Do not use markdown tables. Do not return JSON. Do not add any explanation before or after the outfit blocks.

--- ORIGINAL STYLING BRIEF ---
${originalPrompt}`;
}

function harnessArchetypeForParsedOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  const text = `${parsed.context} ${parsed.top} ${parsed.bottom} ${parsed.layer} ${parsed.whyItWorks} ${parsed.oneMove}`.toLowerCase();
  if (/print|leopard|polka|stripe|pattern/.test(text)) return 'Pattern Hero + Controlled Solids';
  if (/satin|suede|velvet|ribbed|boucle|leather|silk|texture|denim/.test(text)) return 'Texture Hero + Tonal Depth';
  if (/peplum|asymmetric|drape|draped|wrap|tie|side-tied|belt|cinch|waist/.test(text)) return 'Shape Hero + Clean Colour';
  if (plan.capsule === 'Professional') return 'Neutral Architecture + Rich Accent';
  if (plan.capsule === 'Everyday') return 'Casual Base + Polished Disruptor';
  if (plan.capsule === 'Occasion') return 'Coloured Hero + Quiet Support';
  return 'Coloured Hero + Quiet Support';
}

function structuralNoteForHarnessItem(slot: string, piece: string, parsed: ParsedHarnessOutfit) {
  return `Use this exact ${slot.toLowerCase()} as written: ${piece}. It supports the harness move "${parsed.oneMove}" and should not be swapped for a flatter or bulkier version.`;
}

function harnessParsedFormulaItem(slot: string, piece: string, parsed: ParsedHarnessOutfit, plan: PlannedOutfit): NormalisedFormulaItem {
  const fallback = colourForSlot(slot, plan);
  const named = firstNamedColourFromText(piece);
  const role = roleForSlot(slot, fallback.role);
  const rawColour: PlannedOutfitColour = named
    ? { ...named, role }
    : { ...fallback, role };
  const slotColour = safeColourForHarnessSlot(`${slot} ${piece}`, rawColour, plan);
  return {
    slot,
    piece: sanitiseHarnessPiece(piece, slot, plan, slotColour),
    colour_name: slotColour.name,
    colour_hex: slotColour.hex,
    palette_role: slotColour.role,
    structural_notes: structuralNoteForHarnessItem(slot, piece, parsed),
  };
}

function formulaItemsFromParsedHarnessOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  const items: NormalisedFormulaItem[] = [
    harnessParsedFormulaItem('Top', parsed.top, parsed, plan),
    harnessParsedFormulaItem('Bottom', parsed.bottom, parsed, plan),
  ];
  if (plan.layer_required && parsed.layer && !isNoneHarnessValue(parsed.layer)) {
    items.push(harnessParsedFormulaItem('Layer', parsed.layer, parsed, plan));
  }
  items.push(
    harnessParsedFormulaItem('Footwear', parsed.footwear, parsed, plan),
    harnessParsedFormulaItem('Bag', parsed.bag, parsed, plan),
    harnessParsedFormulaItem('Jewellery', parsed.jewellery, parsed, plan),
  );
  if (parsed.finishing && !isNoneHarnessValue(parsed.finishing)) {
    items.push(harnessParsedFormulaItem('Finishing Detail', parsed.finishing, parsed, plan));
  } else if (plan.finishing_required) {
    items.push(plannedFinishingDetailItem(plan));
  }
  if (parsed.eyewear && !isNoneHarnessValue(parsed.eyewear)) {
    items.push(harnessParsedFormulaItem('Eyewear', parsed.eyewear, parsed, plan));
  }
  return items;
}

export function buildHarnessLayerPolicyRepairSummaryForTest(input: {
  top: string;
  layer: string;
  layerRequired?: boolean;
  armCoverage?: boolean;
  whyItWorks?: string;
  oneMove?: string;
}) {
  const layerRequired = input.layerRequired ?? false;
  const armCoverage = input.armCoverage ?? true;
  const coverageProfile: StylistCoverageProfile = {
    neckline: false,
    arms: armCoverage,
    legs: false,
    opacity: false,
    looseFit: false,
    fullModesty: false,
    reasons: armCoverage ? ['arm/shoulder/sleeve coverage'] : [],
    approvedNecklines: ['soft V', 'open collar', 'boat neck'],
    bannedNecklines: ['plunging neckline', 'cleavage-revealing cut'],
  };
  const lead: PlannedOutfitColour = { name: 'Emerald', hex: '#1F5B4D', role: 'lead' };
  const support: PlannedOutfitColour = { name: 'Ivory', hex: '#F5F0E8', role: 'support' };
  const ground: PlannedOutfitColour = { name: 'Chocolate', hex: '#4B2E24', role: 'ground' };
  const plan: PlannedOutfit = {
    outfit_number: 2,
    page_number: 19,
    cultural_mode: 'western_default',
    capsule: 'Professional',
    formula_direction: 'test formula',
    texture_direction: 'matte crepe',
    pattern_direction: 'clean solid',
    pattern_required: false,
    lead_colour: lead,
    support_colour: support,
    ground_colour: ground,
    finishing_required: false,
    layer_required: layerRequired,
    layer_type: layerRequired ? 'single-breasted blazer' : undefined,
    coverage_requires_cover: armCoverage,
    coverage_profile: coverageProfile,
    styling_decision: {
      outfit_message: 'test outfit',
      body_strategy: 'test strategy',
      colour_world: 'test colour world',
      anchor_role: 'shirt_blouse',
      anchor_piece: 'blouse',
      silhouette_formula: 'clean blouse with trouser',
      fabric_rules: 'matte crepe',
      neckline_rules: {
        coverage_required: false,
        approved: coverageProfile.approvedNecklines,
        banned: coverageProfile.bannedNecklines,
        instruction: 'keep neckline clean',
      },
      accessory_rules: 'minimal accessories',
      mirror_test: ['clean line'],
    },
    eyewear_required: false,
    max_visible_colours: 3,
  };
  const parsed: ParsedHarnessOutfit = {
    outfitNumber: 2,
    context: 'Test look',
    top: input.top,
    bottom: 'Ivory tailored trousers',
    layer: input.layer,
    footwear: 'Chocolate leather loafers',
    bag: 'Chocolate structured leather bag',
    jewellery: 'Small gold hoops',
    finishing: 'None',
    eyewear: 'None',
    whyItWorks: input.whyItWorks ?? 'The outfit creates polish through proportion.',
    oneMove: input.oneMove ?? 'Clean line',
    dnaCheck: 'Texture yes; long line yes',
    fourAxisScore: 'Realism yes; Diversity yes; Elevatedness yes; Relevance yes',
    realismCheck: 'Realistic',
    doNotBuy: 'Do not buy the clingy version.',
  };
  const repaired = repairParsedHarnessOutfitAgainstPlan(parsed, plan);
  const items = formulaItemsFromParsedHarnessOutfit(repaired, plan);
  return {
    top: repaired.top,
    layer: repaired.layer,
    whyItWorks: repaired.whyItWorks,
    oneMove: repaired.oneMove,
    formulaSlots: items.map(item => item.slot),
    hasLayerItem: items.some(item => /^layer$/i.test(item.slot) && !isNoneHarnessValue(item.piece)),
  };
}

export function buildHarnessEverydayRealismRepairSummaryForTest() {
  const coverageProfile: StylistCoverageProfile = {
    neckline: false,
    arms: false,
    legs: false,
    opacity: false,
    looseFit: false,
    fullModesty: false,
    reasons: [],
    approvedNecklines: ['soft scoop', 'open collar'],
    bannedNecklines: [],
  };
  const lead: PlannedOutfitColour = { name: 'Emerald', hex: '#1F5B4D', role: 'lead' };
  const support: PlannedOutfitColour = { name: 'Cream', hex: '#F1E7D2', role: 'support' };
  const ground: PlannedOutfitColour = { name: 'Black', hex: '#151515', role: 'ground' };
  const basePlan: PlannedOutfit = {
    outfit_number: 11,
    page_number: 28,
    cultural_mode: 'western_default',
    capsule: 'Everyday',
    formula_direction: 'travel/off-duty base',
    texture_direction: 'crisp cotton poplin',
    pattern_direction: 'bold charcoal-and-white horizontal stripe overshirt or shirt',
    pattern_required: true,
    pattern_instruction: 'bold charcoal-and-white horizontal stripe overshirt or shirt',
    lead_colour: lead,
    support_colour: support,
    ground_colour: ground,
    finishing_required: true,
    finishing_detail_type: 'belt',
    layer_required: true,
    layer_type: 'bold striped cotton overshirt worn open',
    coverage_requires_cover: false,
    coverage_profile: coverageProfile,
    styling_decision: {
      outfit_message: 'composed, repeatable, practical, and still styled',
      body_strategy: 'keep movement easy',
      colour_world: 'classic off-duty contrast',
      anchor_role: 'shirt_blouse',
      anchor_piece: 'shirt',
      silhouette_formula: 'open shirt with wide trouser',
      fabric_rules: 'cotton and twill',
      neckline_rules: {
        coverage_required: false,
        approved: coverageProfile.approvedNecklines,
        banned: coverageProfile.bannedNecklines,
        instruction: 'keep neckline easy',
      },
      accessory_rules: 'practical accessories',
      mirror_test: ['realistic travel'],
    },
    eyewear_required: false,
    max_visible_colours: 3,
  };
  const officeParsed: ParsedHarnessOutfit = {
    outfitNumber: 11,
    context: 'Everyday / Casual Office',
    top: 'Teal fine-rib knit top',
    bottom: 'Charcoal pinstripe wide-leg trousers',
    layer: 'Longline denim duster',
    footwear: 'Brown leather loafers',
    bag: 'Structured work tote',
    jewellery: 'Small hoops',
    finishing: 'None',
    eyewear: 'None',
    whyItWorks: 'The longline denim duster and pinstripe trousers create office polish.',
    oneMove: 'Longline denim duster',
    dnaCheck: 'Texture yes; one move yes',
    fourAxisScore: 'Realism yes; Diversity yes; Elevatedness yes; Relevance yes',
    realismCheck: 'Office duster realistic',
    doNotBuy: 'Do not buy bulky pieces.',
  };
  const travelParsed: ParsedHarnessOutfit = {
    ...officeParsed,
    context: 'Everyday / Travel',
    top: 'Smooth ponte dress with elbow sleeves',
    bottom: 'None',
    layer: 'None',
    footwear: 'Brown loafers',
    bag: 'Brown structured bag',
    whyItWorks: 'The smooth ponte dress provides effortless vertical elongation.',
    oneMove: 'Ponte dress column',
  };
  const travelPlan = { ...basePlan, layer_required: false, layer_type: undefined };
  const officeRepair = repairParsedHarnessOutfitAgainstPlan(officeParsed, basePlan);
  const travelRepair = repairParsedHarnessOutfitAgainstPlan(travelParsed, travelPlan);
  return {
    office: {
      layer: officeRepair.layer,
      bottom: officeRepair.bottom,
      oneMove: officeRepair.oneMove,
      whyItWorks: officeRepair.whyItWorks,
    },
    travel: {
      top: travelRepair.top,
      layer: travelRepair.layer,
      bottom: travelRepair.bottom,
      footwear: travelRepair.footwear,
      bag: travelRepair.bag,
      finishing: travelRepair.finishing,
    },
  };
}

function pageTitleFromHarnessOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  const context = parsed.context || `${plan.capsule} Look`;
  return `Outfit ${plan.display_outfit_number ?? plan.outfit_number} - ${context}`;
}

function pageFromParsedHarnessOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit): BlueprintPage {
  const items = clampHarnessFormulaColours(formulaItemsFromParsedHarnessOutfit(parsed, plan), plan);
  const paletteUsed = paletteUsedFromItems(items, plannedPalette(plan));
  const archetype = harnessArchetypeForParsedOutfit(parsed, plan);
  const hero = items[0]?.piece ?? parsed.top;
  const anchor = items.find(item => /bottom|footwear|bag/i.test(`${item.slot} ${item.piece}`))?.piece ?? parsed.bottom;
  const bridge = items.find(item => /bag|footwear|belt|jewel/i.test(`${item.slot} ${item.piece}`))?.piece ?? parsed.bag;
  const realismCheck = parsed.realismCheck ? `REALISM CHECK: ${parsed.realismCheck}. ` : 'Realism: exact items only. ';
  const fourAxisScore = parsed.fourAxisScore ? `FOUR-AXIS SCORE: ${parsed.fourAxisScore}. ` : '';

  return {
    page_number: plan.page_number,
    page_type: 'outfit',
    title: pageTitleFromHarnessOutfit(parsed, plan),
    subtitle: plan.capsule,
    blocks: [
      {
        label: 'Formula',
        heading: `${plan.capsule} harness formula ${plan.display_outfit_number ?? plan.outfit_number}`,
        body: `Archetype: ${archetype}. Hero: ${hero}. The one move is ${parsed.oneMove}.`,
        items,
      },
      {
        label: 'Why it works',
        heading: 'Harness styling logic',
        body: parsed.whyItWorks,
        reason: parsed.whyItWorks,
      },
      {
        label: 'Role breakdown',
        heading: 'Hero, anchor, bridge, finish',
        body: `Hero: ${hero}. Face-lift: ${items[0]?.colour_name ?? plan.lead_colour.name}. Anchor: ${anchor}. Freshness: ${parsed.oneMove}. Bridge: ${bridge}. Finish: ${parsed.finishing && !isNoneHarnessValue(parsed.finishing) ? parsed.finishing : parsed.jewellery}.`,
      },
      {
        label: 'Do not buy',
        heading: 'The version that breaks it',
        body: parsed.doNotBuy,
      },
      {
        label: 'Score summary',
        heading: 'Harness score check',
        body: `DNA CHECK: ${parsed.dnaCheck}. ${fourAxisScore}${realismCheck}Body Geometry: driven by the harness formula. Undertone Alignment: handled by the harness near-face split. Colour Freshness: visible in the hero and contrast. Visual Hierarchy: ${parsed.oneMove}. Distinctiveness: not correct but forgettable.`,
      },
    ],
    image_refs: [],
    palette_used: paletteUsed,
  };
}

function buildTransformationPreviewPlans(reportData: StylistBlueprintReportData, normalPlans: PlannedOutfit[]): PlannedOutfit[] {
  const sourceIndexes = [5, 10, 15].map(index => Math.min(index, normalPlans.length - 1));
  return sourceIndexes.map((sourceIndex, index) => {
    const source = normalPlans[sourceIndex] ?? normalPlans[index] ?? normalPlans[0];
    return {
      ...source,
      outfit_number: index + 1,
      display_outfit_number: index + 1,
      page_number: getStylistBlueprintTransformationPage(reportData) ?? 2,
      purpose: 'transformation_preview',
      eyewear_required: index === 1,
      eyewear_piece: index === 1 ? source.eyewear_piece : undefined,
      library_reference: undefined,
      library_piece_logic: undefined,
    };
  });
}

function buildDetailedHarnessPlansAfterTransformation(normalPlans: PlannedOutfit[]): PlannedOutfit[] {
  return normalPlans.map(plan => ({
    ...plan,
    outfit_number: plan.outfit_number + 3,
    display_outfit_number: plan.outfit_number,
    purpose: 'detailed_report' as const,
  }));
}

function buildTransformationPreviewPage(parsedOutfits: ParsedHarnessOutfit[], plans: PlannedOutfit[], reportData: StylistBlueprintReportData): BlueprintPage {
  const blocks = parsedOutfits.map((parsed, index) => {
    const plan = plans[index];
    const items = clampHarnessFormulaColours(formulaItemsFromParsedHarnessOutfit(parsed, plan), plan);
    return {
      label: `Look ${String(index + 1).padStart(2, '0')}`,
      heading: parsed.context || `${plan.capsule} transformation`,
      body: parsed.whyItWorks,
      reason: parsed.oneMove,
      items,
    };
  });
  const paletteItems = blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
  const paletteUsed = paletteUsedFromItems(paletteItems, [
    ...reportData.classification.colour.base_palette,
    ...reportData.classification.colour.accent_palette,
  ].map(colour => ({ name: colour.name, hex: colour.hex, role: 'support' as const })));
  return {
    page_number: getStylistBlueprintTransformationPage(reportData) ?? 2,
    page_type: 'transformation',
    title: 'Transformation Preview',
    subtitle: 'Three extra client-specific directions before the detailed wardrobe system',
    blocks,
    image_refs: [],
    palette_used: paletteUsed,
  };
}

function buildHarnessOutfitSystemPage(outfitPages: BlueprintPage[], reportData: StylistBlueprintReportData): BlueprintPage {
  const perCapsule = getStylistBlueprintOutfitCount(reportData) / CAPSULE_SEQUENCE.length;
  const items = CAPSULE_SEQUENCE.map((capsule, index) => {
    const pages = outfitPages.filter(page => page.subtitle === capsule);
    const first = pages[0]?.page_number ? pages[0].page_number - getStylistBlueprintOutfitStartPage(reportData) + 1 : index * perCapsule + 1;
    const last = pages[pages.length - 1]?.page_number ? pages[pages.length - 1].page_number - getStylistBlueprintOutfitStartPage(reportData) + 1 : (index + 1) * perCapsule;
    return {
      capsule,
      range: `Outfits ${first}-${last}`,
      outfits: pages.map(page => page.title),
    };
  });
  return {
    page_number: getStylistBlueprintOutfitSystemPage(reportData),
    page_type: 'outfit_system',
    title: 'Outfit System',
    subtitle: 'Harness-generated capsule map',
    blocks: [
      {
        label: 'Capsules',
        heading: 'Four outfit categories',
        body: 'The outfit harness generated the full set in capsule order, then the report parser mapped each outfit into the Blueprint pages.',
        items,
      },
    ],
    image_refs: [],
  };
}

function parseHarnessTextToBlueprintPages(text: string, reportData: StylistBlueprintReportData, plans: PlannedOutfit[]) {
  const parsed = parseHarnessOutfitText(text);
  if (parsed.length !== plans.length) {
    throw new Error(`Harness outfit generation returned ${parsed.length} outfit(s), expected ${plans.length}`);
  }

  const parsedByNumber = new Map(parsed.map(outfit => [outfit.outfitNumber, outfit]));
  const allNumbersMatch = plans.every(plan => parsedByNumber.has(plan.outfit_number));
  const previewPlans = plans.filter(plan => plan.purpose === 'transformation_preview');
  const detailedPlans = plans.filter(plan => plan.purpose !== 'transformation_preview');
  const sourcePlans = previewPlans.length ? detailedPlans : plans;
  const outfitForPlan = (plan: PlannedOutfit, fallbackIndex: number) => {
    const sourceIndex = plans.indexOf(plan);
    const outfit = allNumbersMatch ? parsedByNumber.get(plan.outfit_number) : parsed[sourceIndex >= 0 ? sourceIndex : fallbackIndex];
    if (!outfit) return undefined;
    return repairParsedHarnessOutfitAgainstPlan(outfit, plan);
  };
  const outfitPages = sourcePlans.map((plan, index) => {
    const outfit = outfitForPlan(plan, index);
    if (!outfit) throw new Error(`Harness outfit generation missed outfit ${plan.outfit_number}`);
    if (!plan.layer_required && outfit.layer && !isNoneHarnessValue(outfit.layer)) {
      throw new Error(`Outfit ${plan.outfit_number} returned a layer even though layer_required=false. 03 - LAYER must be None and arm coverage must come from sleeves/cut.`);
    }
    if (plan.layer_required && (!outfit.layer || isNoneHarnessValue(outfit.layer))) {
      throw new Error(`Outfit ${plan.outfit_number} missed the required layer_type ${plan.layer_type ?? 'layer'}.`);
    }
    return pageFromParsedHarnessOutfit(outfit, plan);
  });
  const transformationPage = previewPlans.length
    ? buildTransformationPreviewPage(
      previewPlans.map((plan, index) => {
        const outfit = outfitForPlan(plan, index);
        if (!outfit) throw new Error(`Harness outfit generation missed transformation outfit ${plan.outfit_number}`);
        return outfit;
      }),
      previewPlans,
      reportData,
    )
    : null;

  const pages = [
    ...(transformationPage ? [transformationPage] : []),
    buildHarnessOutfitSystemPage(outfitPages, reportData),
    ...outfitPages,
  ];
  enforceHarnessPagesAgainstPlans(pages, sourcePlans);
  return pages;
}

function enforceHarnessPagesAgainstPlans(pages: BlueprintPage[], plans: PlannedOutfit[]) {
  const planByPage = new Map(plans.map(plan => [plan.page_number, plan]));
  for (const page of pages.filter(item => item.page_type === 'outfit')) {
    const plan = planByPage.get(page.page_number);
    if (!plan) continue;
    const formulaItems = page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
    const hasLayerItem = formulaItems.some(item => /^layer$/i.test(asString(asRecord(item).slot)) && !isNoneHarnessValue(asString(asRecord(item).piece)));
    if (!plan.layer_required && hasLayerItem) {
      throw new Error(`Outfit ${plan.outfit_number} returned a layer even though layer_required=false. 03 - LAYER must be None and arm coverage must come from sleeves/cut.`);
    }
    if (plan.layer_required && !hasLayerItem) {
      throw new Error(`Outfit ${plan.outfit_number} missed the required layer_type ${plan.layer_type ?? 'layer'}.`);
    }
  }
}

async function generateHarnessOnlyOutfitPages(
  reportData: StylistBlueprintReportData,
  plans: PlannedOutfit[],
  submission?: StylistIntakeSubmission | null,
  replacementContext?: ReplacementOutfitContext | null,
  replacementReason?: string,
  extraContext?: string,
) {
  const prompt = buildHarnessOnlyOutfitPrompt(reportData, plans, submission, replacementContext, replacementReason, extraContext);
  const text = await callGeminiText(prompt, STYLIST_BLUEPRINT_OUTFIT_TEXT_MODEL, {
    timeoutMs: GEMINI_OUTFIT_TEXT_TIMEOUT_MS,
    maxAttempts: 1,
  });
  try {
    return parseHarnessTextToBlueprintPages(text, reportData, plans);
  } catch (error) {
    const retryPrompt = buildStrictHarnessRetryPrompt(prompt, plans, error);
    const retryText = await callGeminiText(retryPrompt, STYLIST_BLUEPRINT_OUTFIT_TEXT_MODEL, {
      timeoutMs: GEMINI_OUTFIT_TEXT_TIMEOUT_MS,
      maxAttempts: 1,
    });
    return parseHarnessTextToBlueprintPages(retryText, reportData, plans);
  }
}

function summariseGeneratedOutfitPageForBatch(page: BlueprintPage) {
  const formulaItems = page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
  const mainItems = formulaItems
    .map(item => {
      const record = asRecord(item);
      return `${asString(record.slot)}: ${asString(record.piece)}`;
    })
    .filter(Boolean)
    .slice(0, 4)
    .join('; ');
  const palette = (page.palette_used ?? [])
    .map(item => `${item.name} (${item.role})`)
    .join(', ');
  return `${page.title} / ${page.subtitle || 'Outfit'} — ${mainItems || 'formula generated'}${palette ? ` — palette: ${palette}` : ''}`;
}

function batchedHarnessExtraContext(
  batchPlans: PlannedOutfit[],
  allPlans: PlannedOutfit[],
  generatedPages: BlueprintPage[],
  baseExtraContext?: string,
) {
  const currentNumbers = batchPlans.map(plan => plan.display_outfit_number ?? plan.outfit_number).join(', ');
  const allNumbers = allPlans.map(plan => plan.display_outfit_number ?? plan.outfit_number).join(', ');
  const previous = generatedPages.map(summariseGeneratedOutfitPageForBatch).join('\n');
  return [
    baseExtraContext,
    `--- BATCHED FULL-SET GENERATION CONTEXT ---
You are generating one batch from a larger outfit report.
Current batch outfit numbers: ${currentNumbers}.
Full detailed outfit numbers in this replacement run: ${allNumbers}.
Keep this batch excellent on its own, but make it feel like part of the larger wardrobe.
Do not repeat dominant colour families, garment formulas, layer types, pattern ideas, footwear, bag shapes, or finishing placements already used in earlier batches unless the client guardrails require it.
Use the four-axis gate for this batch and the full set: Realism, Diversity, Elevatedness, Relevance.${previous ? `\n\nEarlier generated outfits in this run:\n${previous}` : ''}`,
  ].filter(Boolean).join('\n\n');
}

async function generateHarnessDetailedOutfitPagesInBatches(
  reportData: StylistBlueprintReportData,
  plans: PlannedOutfit[],
  submission?: StylistIntakeSubmission | null,
  replacementContext?: ReplacementOutfitContext | null,
  replacementReason?: string,
  extraContext?: string,
) {
  const generatedOutfitPages: BlueprintPage[] = [];
  for (const capsule of CAPSULE_SEQUENCE) {
    const batchPlans = plans.filter(plan => plan.capsule === capsule);
    if (!batchPlans.length) continue;
    const batchPages = await generateHarnessOnlyOutfitPages(
      reportData,
      batchPlans,
      submission,
      replacementContext,
      replacementReason,
      batchedHarnessExtraContext(batchPlans, plans, generatedOutfitPages, extraContext),
    );
    generatedOutfitPages.push(...batchPages.filter(page => page.page_type === 'outfit'));
  }
  generatedOutfitPages.sort((a, b) => a.page_number - b.page_number);
  return [
    buildHarnessOutfitSystemPage(generatedOutfitPages, reportData),
    ...generatedOutfitPages,
  ];
}

type PaletteEntry = { name: string; hex: string; usage?: string };
type ExistingOutfitSummary = {
  page_number: number;
  title: string;
  capsule: string;
  lead_colour: string;
  lead_family: string;
  main_piece: string;
  main_garment_type: string;
  layer_status: 'layered' | 'no_layer';
  layer_type: string;
  archetype: string;
  footwear: string;
  bag: string;
  library_ids: string[];
};

export type ReplacementOutfitContext = {
  replacing_page: number;
  replaced: ExistingOutfitSummary;
  surrounding_outfits: ExistingOutfitSummary[];
  used_lead_families: Array<{ family: string; count: number }>;
  used_lead_colours: string[];
  used_main_garment_types: string[];
  used_archetypes: string[];
  used_library_ids: string[];
};

// Maps an admin instruction phrase to the palette colours it should select.
const COLOUR_FAMILIES: Array<{ ask: RegExp; name: RegExp }> = [
  { ask: /burgundy|berry|wine|maroon|oxblood|marsala/, name: /burgundy|berry|wine|marsala|oxblood|plum/i },
  { ask: /\bred\b|crimson|scarlet|ruby/, name: /red|crimson|scarlet|ruby|terracotta|rust/i },
  { ask: /pink|blush|coral|peach|rose/, name: /pink|blush|coral|peach|rose|mauve/i },
  { ask: /orange|rust|terracotta|sienna|amber/, name: /orange|rust|terracotta|sienna|amber/i },
  { ask: /yellow|mustard|marigold|ochre|\bgold\b/, name: /yellow|mustard|marigold|ochre|gold/i },
  { ask: /green|emerald|olive|sage|forest|mint/, name: /green|emerald|olive|sage|forest|mint/i },
  { ask: /\bteal\b|turquoise|petrol/, name: /teal|turquoise|petrol/i },
  { ask: /\bblue\b|navy|denim|indigo|cobalt/, name: /blue|navy|denim|indigo|cobalt|slate/i },
  { ask: /purple|plum|violet|lilac|lavender|mauve|aubergine/, name: /purple|plum|violet|lilac|lavender|mauve|aubergine/i },
];

function findPaletteColour(palettes: PaletteEntry[][], re: RegExp): PaletteEntry | undefined {
  for (const palette of palettes) {
    const hit = palette.find(colour => re.test(colour.name));
    if (hit) return hit;
  }
  return undefined;
}

function colourFamily(value: string) {
  const text = value.toLowerCase();
  if (/\b(teal|petrol|turquoise)\b/.test(text)) return 'teal';
  if (/\b(emerald|green|sage|mint)\b/.test(text)) return 'green';
  if (/\b(olive|khaki)\b/.test(text)) return 'olive';
  if (/\b(navy|blue|denim|indigo|cobalt|slate)\b/.test(text)) return 'blue';
  if (/\b(burgundy|berry|wine|maroon|marsala|oxblood|plum)\b/.test(text)) return 'berry/plum';
  if (/\b(purple|violet|lilac|lavender|mauve|aubergine)\b/.test(text)) return 'purple';
  if (/\b(pink|blush|coral|peach|rose)\b/.test(text)) return 'pink/peach';
  if (/\b(red|crimson|scarlet|ruby)\b/.test(text)) return 'red';
  if (/\b(orange|rust|terracotta|sienna|amber)\b/.test(text)) return 'orange/rust';
  if (/\b(yellow|mustard|marigold|ochre|gold)\b/.test(text)) return 'yellow/gold';
  if (/\b(chocolate|cocoa|espresso|brown|tan|camel|cognac)\b/.test(text)) return 'brown/leather';
  if (/\b(ivory|cream|white|stone|ecru)\b/.test(text)) return 'light neutral';
  if (/\b(black|charcoal|grey|gray|pewter)\b/.test(text)) return 'dark neutral';
  if (/\b(taupe|mushroom|beige|sand)\b/.test(text)) return 'soft neutral';
  return text.split(/\s+/).filter(Boolean).slice(-1)[0] || 'unknown';
}

function formulaRecordsForSummary(page: BlueprintPage) {
  return flattenFormulaItems(page).map((item, index) => {
    const record = asRecord(item);
    const slot = slotFromItem(item, index);
    return {
      slot,
      piece: asString(record.piece) || asString(record.name) || asString(record.value),
      colour_name: asString(record.colour_name),
      colour_hex: normaliseHex(asString(record.colour_hex, '#000000')),
      palette_role: asString(record.palette_role),
    };
  });
}

function garmentTypeFromPiece(piece: string, slot: string) {
  const text = `${slot} ${piece}`.toLowerCase();
  const match = text.match(/\b(blazer|vest|jacket|cardigan|coat|overshirt|shirt|blouse|top|tee|knit|dress|jumpsuit|co-ord|coord|set|trouser|pant|jean|skirt|palazzo|kurta|saree|sari|tunic)\b/);
  return match?.[1]?.replace('coord', 'co-ord') ?? slot.toLowerCase();
}

function firstFormulaRecord(
  records: ReturnType<typeof formulaRecordsForSummary>,
  pattern: RegExp,
) {
  return records.find(record => pattern.test(`${record.slot} ${record.piece}`));
}

function outfitSummaryForReplacement(page: BlueprintPage): ExistingOutfitSummary {
  const records = formulaRecordsForSummary(page);
  const leadRecord = records.find(record => record.palette_role === 'lead')
    ?? records.find(record => /top|dress|jumpsuit|shirt|blouse|kurta|tunic|set|co-ord|coord/i.test(record.slot))
    ?? records[0];
  const layer = firstFormulaRecord(records, /layer|outerwear|blazer|vest|jacket|cardigan|coat|overshirt/i);
  const footwear = firstFormulaRecord(records, /footwear|shoe|sandal|heel|flat|loafer|pump|mule|sneaker|boot/i);
  const bag = firstFormulaRecord(records, /bag|tote|clutch|crossbody|handbag/i);
  const pageBody = pageText(page);
  const archetype = HARNESS_ARCHETYPES.find(item => pageBody.toLowerCase().includes(item.toLowerCase())) || 'unknown';
  const leadColour = leadRecord?.colour_name || page.palette_used?.find(colour => colour.role === 'lead')?.name || 'unknown';
  const mainPiece = leadRecord?.piece || page.title;
  return {
    page_number: page.page_number,
    title: page.title,
    capsule: page.subtitle || page.page_type,
    lead_colour: leadColour,
    lead_family: colourFamily(leadColour || mainPiece),
    main_piece: mainPiece,
    main_garment_type: garmentTypeFromPiece(mainPiece, leadRecord?.slot || 'main garment'),
    layer_status: layer && !/^none$/i.test(layer.piece) ? 'layered' : 'no_layer',
    layer_type: layer?.piece || 'none',
    archetype,
    footwear: footwear?.piece || 'unknown',
    bag: bag?.piece || 'unknown',
    library_ids: (page.library_refs ?? []).map(ref => ref.id).filter(Boolean),
  };
}

function countedValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));
}

export function buildReplacementOutfitContext(reportData: StylistBlueprintReportData, pageNumber: number): ReplacementOutfitContext | null {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  const outfitPages = reportData.pages
    .filter(page => page.page_number >= outfitStart && page.page_number <= outfitEnd && page.page_type === 'outfit')
    .sort((a, b) => a.page_number - b.page_number);
  const replacedPage = outfitPages.find(page => page.page_number === pageNumber);
  if (!replacedPage) return null;

  const replaced = outfitSummaryForReplacement(replacedPage);
  const surrounding = outfitPages
    .filter(page => page.page_number !== pageNumber)
    .map(outfitSummaryForReplacement);
  return {
    replacing_page: pageNumber,
    replaced,
    surrounding_outfits: surrounding,
    used_lead_families: countedValues(surrounding.map(item => item.lead_family)),
    used_lead_colours: [...new Set(surrounding.map(item => item.lead_colour).filter(Boolean))],
    used_main_garment_types: [...new Set(surrounding.map(item => item.main_garment_type).filter(Boolean))],
    used_archetypes: [...new Set(surrounding.map(item => item.archetype).filter(item => item && item !== 'unknown'))],
    used_library_ids: [...new Set(surrounding.flatMap(item => item.library_ids))],
  };
}

export function replacementOutfitContextPrompt(context: ReplacementOutfitContext | null, reason?: string) {
  if (!context) return '';
  return `--- SINGLE OUTFIT REPLACEMENT DIVERSITY CONTEXT ---
Admin replacement instruction: ${reason?.trim() || 'Replace this outfit with a stronger distinct option.'}

You are replacing page ${context.replacing_page}. The current rejected outfit is:
${stringify(context.replaced)}

Existing recommendations to avoid repeating:
${stringify({
  used_lead_families: context.used_lead_families,
  used_lead_colours: context.used_lead_colours,
  used_main_garment_types: context.used_main_garment_types,
  used_archetypes: context.used_archetypes,
  surrounding_outfits: context.surrounding_outfits.map(item => ({
    page_number: item.page_number,
    title: item.title,
    capsule: item.capsule,
    lead_colour: item.lead_colour,
    lead_family: item.lead_family,
    main_garment_type: item.main_garment_type,
    layer_status: item.layer_status,
    layer_type: item.layer_type,
    archetype: item.archetype,
    footwear: item.footwear,
    bag: item.bag,
  })),
})}

Replacement rules:
- Do not repeat the rejected outfit's lead colour family (${context.replaced.lead_family}) unless the admin explicitly requested that exact colour.
- Prefer a lead/main garment colour family that is not already common in used_lead_families.
- Do not repeat the rejected outfit formula: ${context.replaced.main_garment_type}, ${context.replaced.layer_status}, ${context.replaced.layer_type}, ${context.replaced.archetype}.
- Do not copy the same style world, hero garment, silhouette, layer type, shoe/bag pairing, or outfit archetype from surrounding_outfits.
- Keep client coverage, dislikes, cultural mode, realistic garment mechanics, and image-generation safety above novelty.
--- END SINGLE OUTFIT REPLACEMENT DIVERSITY CONTEXT ---`;
}

// Builds the plan for a single replacement outfit: always varies the colours away
// from the rejected look, then biases the plan to honour an admin instruction
// (colour/family, warmer/cooler/bolder/muted, layer add/remove, formality, garment).
export function buildReplacementPlan(
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  instruction?: string,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
  culturalMode: StylistOutfitCulturalMode = 'ethnic_allowed',
): PlannedOutfit {
  const index = pageNumber - getStylistBlueprintOutfitStartPage(reportData);
  const plan: PlannedOutfit = { ...buildOutfitDiversityPlan(reportData, libraryContext, culturalMode)[index] };
  const basePalette = reportData.classification.colour.base_palette as PaletteEntry[];
  const accentPalette = reportData.classification.colour.accent_palette as PaletteEntry[];
  const note = (instruction ?? '').toLowerCase();
  const replacementContext = buildReplacementOutfitContext(reportData, pageNumber);
  if (note) {
    plan.coverage_profile = mergeCoverageProfiles(plan.coverage_profile, profileFromCoverageText(note));
  }
  const currentPage = reportData.pages.find(page => page.page_number === pageNumber);
  const currentLibraryIds = new Set((currentPage?.library_refs ?? []).map(ref => ref.id));
  const usedLibraryIds = new Set([
    ...currentLibraryIds,
    ...(replacementContext?.used_library_ids ?? []),
  ]);
  const alternative = chooseAlternativeLibraryOutfit(
    libraryContext.outfits,
    plan.capsule,
    usedLibraryIds,
    libraryContext.blockedSignatures,
    plan.styling_decision.anchor_role,
  ) ?? chooseAlternativeLibraryOutfit(
    libraryContext.outfits,
    plan.capsule,
    currentLibraryIds,
    libraryContext.blockedSignatures,
    plan.styling_decision.anchor_role,
  );

  if (alternative) {
    const stylingDecision = buildStylingDecisionPlan(reportData, plan.capsule, index, plan.coverage_profile, plan.cultural_mode, alternative, plan.styling_decision.anchor_role);
    const colours = restrainedColourStory(reportData, plan.capsule, index, alternative, stylingDecision);
    const usesAccent = Boolean(colours.accent);
    plan.library_reference = libraryReferenceForPlan(alternative, plan.capsule);
    plan.library_piece_logic = libraryPieceLogic(alternative);
    plan.styling_decision = stylingDecision;
    plan.lead_colour = colours.lead;
    plan.support_colour = colours.support;
    plan.ground_colour = colours.ground;
    plan.accent_colour = usesAccent ? colours.accent : undefined;
    plan.accent_application = usesAccent ? plan.accent_application : undefined;
    plan.accent_mode = usesAccent ? 'detail' : undefined;
    plan.layer_required = shouldPlanLayer(plan.capsule, index % 5);
    plan.layer_type = plan.layer_required ? (plan.layer_type ?? LAYER_TYPES_BY_CAPSULE[plan.capsule][index % LAYER_TYPES_BY_CAPSULE[plan.capsule].length]) : undefined;
  } else if (note) {
    plan.styling_decision = buildStylingDecisionPlan(reportData, plan.capsule, index, plan.coverage_profile, plan.cultural_mode, undefined, plan.styling_decision.anchor_role);
  }

  if (replacementContext) {
    const familyCounts = new Map(replacementContext.used_lead_families.map(item => [item.family, item.count]));
    const replacedFamily = replacementContext.replaced.lead_family;
    const allPaletteCandidates = [...basePalette, ...accentPalette]
      .filter(colour => colour.name && isValidHex(colour.hex))
      .map((colour, candidateIndex) => ({
        colour,
        candidateIndex,
        family: colourFamily(colour.name),
        count: familyCounts.get(colourFamily(colour.name)) ?? 0,
      }));
    const paletteCandidates = allPaletteCandidates.some(candidate => candidate.family !== replacedFamily)
      ? allPaletteCandidates.filter(candidate => candidate.family !== replacedFamily)
      : allPaletteCandidates;
    const leastUsed = paletteCandidates
      .sort((a, b) => a.count - b.count || Number(a.family === replacedFamily) - Number(b.family === replacedFamily) || a.candidateIndex - b.candidateIndex)[0];
    if (leastUsed && !/\b(red|pink|blush|coral|peach|orange|rust|terracotta|yellow|mustard|gold|green|emerald|olive|sage|teal|turquoise|blue|navy|denim|indigo|cobalt|purple|plum|violet|lilac|lavender|mauve|burgundy|berry|wine|maroon|neutral|black|white|ivory|cream|brown|tan|camel|cognac|espresso)\b/.test(note)) {
      plan.lead_colour = plannedColour(leastUsed.colour, 'lead', leastUsed.candidateIndex);
    }

    if (replacementContext.replaced.layer_status === 'layered' && plan.layer_required) {
      const layerPool = LAYER_TYPES_BY_CAPSULE[plan.capsule] ?? [];
      const currentLayer = replacementContext.replaced.layer_type.toLowerCase();
      const alternateLayer = layerPool.find(layer => !currentLayer.includes(layer.toLowerCase()) && !layer.toLowerCase().includes(currentLayer));
      if (alternateLayer) {
        plan.layer_type = alternateLayer;
      } else if (plan.capsule !== 'Professional') {
        plan.layer_required = false;
        plan.layer_type = undefined;
      }
    } else if (replacementContext.replaced.layer_status === 'no_layer' && !plan.layer_required && plan.capsule !== 'Everyday') {
      const layerPool = LAYER_TYPES_BY_CAPSULE[plan.capsule] ?? [];
      if (layerPool.length) {
        plan.layer_required = true;
        plan.layer_type = layerPool[index % layerPool.length];
      }
    }
  }

  if (!note) {
    refreshPlanEyewear(plan, reportData, index);
    return plan;
  }

  // --- 2. Colour / family request. ---
  const accentFirst = /accent|pop|detail|touch of|hint of|small/.test(note);
  const searchOrder = accentFirst ? [accentPalette, basePalette] : [basePalette, accentPalette];
  let requested: PaletteEntry | undefined;
  for (const family of COLOUR_FAMILIES) {
    if (family.ask.test(note)) {
      requested = findPaletteColour(searchOrder, family.name);
      if (requested) break;
    }
  }
  if (!requested) requested = searchOrder.flat().find(colour => note.includes(colour.name.toLowerCase()));
  if (requested) {
    const isAccentColour = accentPalette.some(colour => normaliseHex(colour.hex) === normaliseHex(requested!.hex));
    if (isAccentColour && /accent|pop|detail|touch of|hint of|small/.test(note)) {
      plan.accent_colour = plannedColour(requested, 'accent', 0);
      plan.accent_mode = plan.layer_required ? 'layer' : 'top';
    } else {
      plan.lead_colour = plannedColour(requested, 'lead', 0);
    }
  }

  // --- 3. Tone / intensity (last match wins for stacked requests). ---
  const pickBy = (compare: (a: PaletteEntry, b: PaletteEntry) => number) => [...basePalette].sort(compare)[0];
  if (/bolder|brighter|more colour|more color|vibrant|pop of colour|pop of color|statement|punchy/.test(note)) {
    const vivid = [...basePalette, ...accentPalette].sort((a, b) => colourSaturation(b.hex) - colourSaturation(a.hex))[0];
    if (vivid) plan.lead_colour = plannedColour(vivid, 'lead', 0);
  } else if (/softer|muted|subtle|minimal|simpler|tonal|understated|neutral|quiet/.test(note)) {
    const neutral = pickBy((a, b) => colourSaturation(a.hex) - colourSaturation(b.hex));
    if (neutral) plan.lead_colour = plannedColour(neutral, 'lead', 0);
    plan.accent_colour = undefined;
    plan.accent_mode = undefined;
    plan.accent_application = undefined;
  }
  if (/warmer|warm tone|warm colour|warm color/.test(note)) {
    const warm = basePalette.find(colour => /terracotta|rust|camel|cocoa|olive|mustard|peach|gold|tan|espresso|marsala/i.test(colour.name));
    if (warm) plan.lead_colour = plannedColour(warm, 'lead', 0);
  } else if (/cooler|cool tone|cool colour|cool color/.test(note)) {
    const cool = basePalette.find(colour => /navy|blue|emerald|teal|slate|grey|gray|charcoal|plum|indigo|petrol/i.test(colour.name));
    if (cool) plan.lead_colour = plannedColour(cool, 'lead', 0);
  }
  if (/darker|deeper|richer/.test(note)) {
    const dark = pickBy((a, b) => relativeLuminance(a.hex) - relativeLuminance(b.hex));
    if (dark) plan.lead_colour = plannedColour(dark, 'lead', 0);
  } else if (/lighter|paler|brighter base/.test(note)) {
    const light = pickBy((a, b) => relativeLuminance(b.hex) - relativeLuminance(a.hex));
    if (light) plan.lead_colour = plannedColour(light, 'lead', 0);
  }

  // --- 4. Layer add / remove. ---
  const layerWord = /(layer|jacket|blazer|coat|cardigan|outerwear|overshirt|vest|duster|bolero|shacket)/;
  const removeLayer = new RegExp(`\\b(no|without|remove|drop|skip|lose|don'?t want|do not want)\\b[^.]{0,24}${layerWord.source}`).test(note);
  if (removeLayer) {
    plan.layer_required = false;
    plan.layer_type = undefined;
    if (plan.accent_mode === 'layer') plan.accent_mode = plan.accent_colour ? 'top' : undefined;
  } else {
    const named = note.match(/\b(blazer|jacket|cardigan|coat|duster|overshirt|vest|shacket|bolero)\b/);
    if (named && /\b(add|with|include|put|throw on|layer|wear)\b/.test(note)) {
      plan.layer_required = true;
      plan.layer_type = named[1];
    }
  }

  // --- 5. Formality. ---
  if (/casual|relaxed|everyday|laid.?back|off.?duty|daytime|\beasy\b/.test(note)) {
    plan.formula_direction = 'easy top + relaxed bottom + clean flat or loafer, kept casual but polished';
    plan.texture_direction = 'soft brushed cotton';
  } else if (/formal|dressy|dressier|elevated|evening|occasion|polished|black.?tie|cocktail|glam/.test(note)) {
    plan.formula_direction = 'refined dress or tailored separates + elegant heel or dressy flat + compact bag';
    plan.texture_direction = 'fluid satin-back crepe';
  }

  // --- 6. Garment-type nudge (the model honours this; normaliser keeps the noun). ---
  const garment = note.match(/\b(skirt|dress|wide.?leg|palazzo|trousers?|pants?|jumpsuit|saree|sari|kurta|co.?ord|jeans)\b/);
  if (garment) plan.formula_direction = `look built around a ${garment[1]} as the key piece; ${plan.formula_direction}`;

  refreshPlanEyewear(plan, reportData, index);
  return plan;
}

function plannedPalette(plan: PlannedOutfit): BlueprintColourUse[] {
  return [plan.lead_colour, plan.support_colour, plan.ground_colour, plan.accent_colour]
    .filter((colour): colour is PlannedOutfitColour => Boolean(colour))
    .map(colour => ({ name: colour.name, hex: colour.hex, role: colour.role }));
}

function paletteUsedFromItems(items: NormalisedFormulaItem[], fallback: BlueprintColourUse[]): BlueprintColourUse[] {
  const seen = new Map<string, BlueprintColourUse>();
  for (const item of items) {
    if (!isValidHex(item.colour_hex)) continue;
    const hex = normaliseHex(item.colour_hex);
    if (seen.has(hex)) continue;
    seen.set(hex, {
      name: item.colour_name || 'Palette colour',
      hex,
      role: item.palette_role,
    });
  }
  return seen.size ? [...seen.values()].slice(0, 3) : fallback.slice(0, 3);
}

function clampHarnessFormulaColours(items: NormalisedFormulaItem[], plan: PlannedOutfit): NormalisedFormulaItem[] {
  return items.map((item) => {
    if (/jewel|jewellery|jewelry|earring|necklace|bracelet|bangle/i.test(item.slot)) return item;
    if (!isShoeOrBagSlot(`${item.slot} ${item.piece}`)) return item;

    const currentColour: PlannedOutfitColour = isValidHex(item.colour_hex)
      ? {
        name: item.colour_name || 'Leather neutral',
        hex: normaliseHex(item.colour_hex),
        role: item.palette_role,
      }
      : neutralLeatherFallbackColour(plan, 'ground');
    const colour = isRealisticLeatherColour(currentColour)
      ? currentColour
      : neutralLeatherFallbackColour(plan, 'ground');
    const piece = normalisePieceColourApplication(item.piece, item.slot, plan, colour);
    return {
      ...item,
      piece,
      colour_name: colour.name,
      colour_hex: colour.hex,
      palette_role: colour.role,
    };
  });
}

function weakText(value: string | undefined) {
  const text = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text) return true;
  const lower = text.toLowerCase();
  if (['lead colour', 'controlled, defined features', 'controlled defined features', 'defined features'].includes(lower)) return true;
  return text.split(/\s+/).length < 6 || text.length < 32;
}

function fallbackBlock(label: string, heading: string, body: string, reason?: string): BlueprintBlock {
  return { label, heading, body, reason };
}

function pageContentFallbacks(pageNumber: number, data: StylistBlueprintReportData): BlueprintBlock[] | null {
  const body = data.classification.body;
  const face = data.classification.face_hair_accessories;
  const coverage = coverageProfileFromClassification(data.classification);

  if (pageNumber === 2) {
    return [
      fallbackBlock('Silhouette', data.analysis.silhouette_profile, body.proportion_directive),
      fallbackBlock('Colour', data.analysis.chromatic_family, `Use the palette as broad colour territory, not a fixed outfit list. Choose realistic wardrobe colours, classic combinations, and undertone-friendly near-face shades so the outfits feel varied but coherent.`),
      fallbackBlock('Architecture', face.face_shape, face.face_direction),
      fallbackBlock('Direction', data.analysis.style_direction, data.classification.client.lifestyle_summary),
    ];
  }

  if (pageNumber === 3) {
    return [
      fallbackBlock('Step 01', 'Start with the diagnosis', 'Use the first section to understand what your body, colour, and face lines need before choosing individual outfits.'),
      fallbackBlock('Step 02', 'Shop from the rules', 'Use the silhouette, neckline, fabric, and colour rules as filters when buying new pieces.'),
      fallbackBlock('Step 03', 'Copy the formulas', 'Treat the outfit pages as repeatable formulas: keep the shape and colour role even when you swap brands or exact garments.'),
      fallbackBlock('Step 04', 'Edit what fights the system', 'Remove pieces that repeatedly break the vertical line, colour harmony, coverage needs, or comfort rules.'),
    ];
  }

  if (pageNumber === 4) {
    return [
      fallbackBlock('Finding', 'Body geometry', body.proportion_directive),
      fallbackBlock('Objective', 'Create a cleaner frame', 'Use structure outside the torso and controlled vertical lines so the outfit does not stop at the midsection.'),
      fallbackBlock('Do this', 'Repeat vertical movement', body.silhouette_rules.slice(0, 2).join(' ') || 'Choose open fronts, longer lines, clean trousers, and gentle waist definition.'),
      fallbackBlock('Avoid this', 'Do not over-cut the centre', 'Avoid heavy horizontal contrast, clingy midsection focus, and short boxy layers unless balanced by a longer line.'),
    ];
  }

  if (pageNumber === 6) {
    return [
      fallbackBlock('Finding', 'Face and neckline logic', face.face_direction),
      fallbackBlock(
        'Necklines',
        coverage.neckline ? 'Protect the line' : 'Frame the line',
        coverage.neckline
          ? 'Avoid cleavage and very low necklines; use safe open necklines when they stay covered.'
          : `Prioritise ${face.approved_necklines.slice(0, 3).join(', ') || 'open collar, soft V, and soft scoop necklines'} to lengthen the face and keep the upper body clean.`,
      ),
      fallbackBlock('Hair and eyewear', 'Keep controlled structure', `${face.hair_direction} ${face.eyewear_direction}`),
      fallbackBlock('Accessories', 'Use deliberate scale', face.jewellery_direction),
    ];
  }

  if (pageNumber === 7) {
    return [
      fallbackBlock('Axis 01', 'Vertical balance', body.proportion_directive),
      fallbackBlock('Axis 02', 'Width control', body.silhouette_rules.slice(0, 2).join(' ') || 'Keep the strongest structure at the outer frame rather than across the centre.'),
      fallbackBlock('Axis 03', 'Focal point', data.analysis.proportional_focus.join(', ') || 'Place visual interest where it supports length and balance.'),
      fallbackBlock('Axis 04', 'Practical filter', 'If a piece creates a hard stop across the widest or most sensitive area, pair it with a longer line or choose a softer alternative.'),
    ];
  }

  return null;
}

function normaliseUsefulBlocks(page: BlueprintPage, data: StylistBlueprintReportData): BlueprintPage {
  const fallback = pageContentFallbacks(page.page_number, data);
  if (!fallback) return page;

  const minimum = page.page_number === 3 ? 3 : page.page_number === 2 ? 4 : 3;
  const existingUseful = page.blocks.filter(block => !weakText(block.body || block.reason));
  if (existingUseful.length >= minimum) return page;

  const merged = fallback.map((fallbackBlockItem, index) => {
    const current = page.blocks[index];
    if (!current) return fallbackBlockItem;
    const body = weakText(current.body || current.reason) ? fallbackBlockItem.body : current.body || current.reason;
    return {
      ...fallbackBlockItem,
      ...current,
      heading: weakText(current.heading) ? fallbackBlockItem.heading : current.heading,
      body,
      reason: current.reason && !weakText(current.reason) ? current.reason : fallbackBlockItem.reason,
    };
  });

  return { ...page, blocks: merged };
}

function flattenFormulaItems(page: BlueprintPage): unknown[] {
  const formulaBlock = page.blocks.find(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`))
    ?? page.blocks.find(block => Array.isArray(block.items) && block.items.length >= 3);
  if (!formulaBlock?.items?.length) return [];
  const objectItem = formulaBlock.items.length === 1 && asRecord(formulaBlock.items[0]);
  if (objectItem && ['top', 'bottom', 'bottoms', 'dress', 'outerwear', 'layer', 'footwear', 'shoes', 'bag', 'jewellery', 'jewelry', 'accessory', 'accessories'].some(key => objectItem[key] !== undefined)) {
    return Object.entries(objectItem)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([slot, value]) => ({ slot, piece: typeof value === 'string' ? value : stringify(value), structural_notes: asString(asRecord(value).structural_notes) || asString(asRecord(value).notes) }));
  }
  return formulaBlock.items;
}

function slotFromItem(item: unknown, index: number) {
  const record = asRecord(item);
  const raw = asString(record.slot) || asString(record.category) || asString(record.label);
  if (raw) return raw.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  const fallbacks = ['Top', 'Bottom', 'Outerwear', 'Footwear', 'Bag', 'Jewellery'];
  return fallbacks[index] ?? `Piece ${index + 1}`;
}

function inferPrimarySlot(piece: string, fallback: string) {
  const lower = piece.toLowerCase();
  if (/(dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)/.test(lower)) return 'Dress';
  if (/(trouser|pant|jean|skirt|palazzo|bottom|legging)/.test(lower)) return 'Bottom';
  if (/(shoe|sandal|heel|flat|sneaker|loafer|pump|mule|footwear)/.test(lower)) return 'Footwear';
  if (/(bag|tote|clutch|crossbody|handbag)/.test(lower)) return 'Bag';
  if (/(jewel|earring|necklace|bracelet|watch|bangle|accessor)/.test(lower)) return 'Jewellery';
  if (/(blazer|jacket|cardigan|vest|coat|outerwear|layer|overshirt|dupatta)/.test(lower)) return 'Outerwear';
  return fallback;
}

function colourForSlot(slot: string, plan: PlannedOutfit): PlannedOutfitColour {
  const lower = slot.toLowerCase();
  const isTop = /top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord/.test(lower);
  const isLayer = /outer|layer|blazer|jacket|cardigan|vest|overshirt|coat|duster|bolero|shacket/.test(lower);
  const isBottom = /bottom|trouser|pant|jean|skirt|palazzo|legging/.test(lower);
  const isShoeBag = /shoe|footwear|bag|tote|clutch|crossbody|handbag/.test(lower);
  const isEyewear = /eyewear|eyeglass|sunglass|frame/.test(lower);
  const isDetail = /jewel|accessor|scarf|trim|hardware|hair|belt|pattern|print|piping|detail|waist|face/.test(lower);

  const accent = plan.accent_colour;
  if (accent) {
    if (plan.accent_mode === 'layer' && isLayer) return accent;
    if (plan.accent_mode === 'top' && isTop) return accent;
    if (plan.accent_mode === 'detail' && isDetail) return accent;
  }

  // When the top carries the accent, the lead colour moves to the bottom so it
  // still appears and the look stays within three colours.
  if (isBottom) {
    if (plan.accent_mode === 'top' && accent) return plan.lead_colour;
    return plan.ground_colour ?? plan.support_colour;
  }
  if (isEyewear) return plan.ground_colour ?? plan.support_colour;
  if (isShoeBag) return plan.ground_colour ?? plan.support_colour;
  if (isLayer) return plan.support_colour;
  if (isDetail) return accent ?? plan.support_colour;
  return plan.lead_colour;
}

function roleForSlot(slot: string, fallback: BlueprintColourUse['role']): BlueprintColourUse['role'] {
  const lower = slot.toLowerCase();
  if (/top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord/.test(lower)) return 'lead';
  if (/outer|layer|blazer|jacket|cardigan|vest|overshirt|coat|duster|bolero|shacket|bottom|trouser|pant|jean|skirt|palazzo|legging/.test(lower)) return 'support';
  if (/shoe|footwear|bag|tote|clutch|crossbody|handbag/.test(lower)) return 'ground';
  if (/eyewear|eyeglass|sunglass|frame/.test(lower)) return 'support';
  if (/jewel|accessor|scarf|belt|pattern|print|waist/.test(lower)) return 'accent';
  return fallback;
}

function colourText(colour: PlannedOutfitColour) {
  return `${colour.name} ${colour.hex}`.toLowerCase();
}

function colourLooksLight(colour: PlannedOutfitColour) {
  return relativeLuminance(colour.hex) > 0.68 || /(white|ivory|cream|off[-\s]?white|stone|oat|pearl|ecru|bone|chalk)/i.test(colour.name);
}

function colourLooksGreyNeutral(colour: PlannedOutfitColour) {
  return /(grey|gray|slate|pewter|charcoal|graphite|stone|silver|smoke|ash)/i.test(colourText(colour));
}

function colourLooksLeatherGround(colour: PlannedOutfitColour) {
  return /(black|ink|espresso|cocoa|chocolate|brown|tan|camel|cognac|taupe|burgundy|oxblood|cream|ivory|stone|grey|gray|charcoal)/i.test(colourText(colour));
}


function colourIsSaturated(colour: PlannedOutfitColour) {
  return colourSaturation(colour.hex) >= 0.35;
}

// A pale colour that is genuinely neutral (cream/ivory/stone) rather than a bright,
// high-saturation light colour (lime, bright yellow) that should never be leather.
function colourLooksNeutralLight(colour: PlannedOutfitColour) {
  return colourLooksLight(colour) && !colourIsSaturated(colour);
}

// True only for colours that read as real leather/suede: neutrals, browns, greys,
// burgundy, or genuinely pale neutrals. Saturated brights are excluded.
function isRealisticLeatherColour(colour: PlannedOutfitColour) {
  return colourLooksLeatherGround(colour) || colourLooksGreyNeutral(colour) || colourLooksNeutralLight(colour);
}

// A realistic neutral leather colour to fall back to so bags/shoes are never
// forced into a vivid/accent colour (or a fake coloured trim).
function neutralLeatherColourName(plan: PlannedOutfit): string {
  const roles = [plan.ground_colour, plan.support_colour, plan.lead_colour]
    .filter((colour): colour is PlannedOutfitColour => Boolean(colour));
  const neutral = roles.find(colour => isRealisticLeatherColour(colour));
  if (neutral) return neutral.name;
  const cool = roles.some(colour => /navy|blue|slate|charcoal|grey|gray|ink|emerald|teal|plum|indigo|petrol/i.test(colourText(colour)));
  return cool ? 'Charcoal Grey' : 'Espresso';
}

// Footwear is always a whole shoe in a realistic shoe colour — never a neutral
// shoe with a coloured trim/detail. Saturated/vivid colours default to neutral.
function realisticFootwearFamily(colour: PlannedOutfitColour, plan: PlannedOutfit, originalPiece: string) {
  const lowerPiece = originalPiece.toLowerCase();
  const sneakerAllowed = plan.capsule === 'Everyday' || (plan.capsule === 'Social' && /casual|denim|street|sneaker/.test(lowerPiece));
  const isSneaker = /sneaker|trainer|canvas|low-top|slip-on/.test(lowerPiece);
  const isWarmLeather = /(espresso|cocoa|chocolate|brown|tan|camel|cognac|taupe|burgundy|oxblood)/i.test(colourText(colour));
  const isDark = relativeLuminance(colour.hex) < 0.26 || /(black|ink|charcoal|espresso|cocoa|chocolate|navy)/i.test(colourText(colour));
  const isRealisticShoeColour = isWarmLeather || isDark || isRealisticLeatherColour(colour);
  const neutral = neutralLeatherColourName(plan);

  if (isSneaker && sneakerAllowed) {
    if (colourLooksNeutralLight(colour)) return `${colour.name} minimalist leather low-top sneakers`;
    return `white leather low-top sneakers`;
  }

  if (plan.capsule === 'Professional') {
    if (isWarmLeather) return `${colour.name} leather loafers`;
    if (isDark) return `${colour.name} pointed-toe low pumps`;
    if (colourLooksGreyNeutral(colour)) return `${colour.name} suede pointed flats`;
    return `${neutral} leather pointed flats`;
  }

  if (plan.capsule === 'Occasion') {
    if (isWarmLeather) return `${colour.name} suede block-heel sandals`;
    if (isDark) return `${colour.name} dressy block heels`;
    if (colourLooksGreyNeutral(colour) || colourLooksNeutralLight(colour)) return `${colour.name} refined heeled sandals`;
    return `${neutral} metallic heeled sandals`;
  }

  if (isRealisticShoeColour) return `${colour.name} leather loafers`;
  return `${neutral} leather loafers`;
}

// Bags are a whole bag in a realistic leather colour, or — for vivid colours — an
// Occasion clutch in that colour, else a neutral leather bag. Never a coloured trim/tag.
function realisticBagFamily(colour: PlannedOutfitColour, plan: PlannedOutfit) {
  if (isRealisticLeatherColour(colour)) return `${colour.name} structured leather bag`;
  if (plan.capsule === 'Occasion') return `compact ${colour.name} clutch`;
  return `${neutralLeatherColourName(plan)} structured leather bag`;
}

// Accents appear only as whole realistic pieces: scarf, belt, garment print,
// knit/top/layer, or jewellery stone — never as trims, piping, or shoe details.
function realisticAccessoryFamily(colour: PlannedOutfitColour, plan: PlannedOutfit, slot: string) {
  const application = plan.accent_application;
  const lowerSlot = slot.toLowerCase();
  const appSlot = application?.slot.toLowerCase() ?? '';
  if (/scarf/.test(lowerSlot) || /scarf/.test(appSlot)) return `${colour.name} silk scarf`;
  if (/belt|waist/.test(lowerSlot) || /belt|waist/.test(appSlot)) return `${colour.name} slim leather belt`;
  if (/print|pattern/.test(lowerSlot) || /print|pattern/.test(appSlot)) return `${colour.name} small-scale print on the top or dress`;
  if (/bag/.test(lowerSlot) || /bag/.test(appSlot)) return realisticBagFamily(colour, plan);
  if (/top|layer/.test(lowerSlot) || /top|layer/.test(appSlot)) return application ? `${colour.name} ${application.piece}` : `${colour.name} knit top`;
  if (/hair|face/.test(lowerSlot) || /hair|face/.test(appSlot)) return `${colour.name} hair accessory`;
  if (/(gold|marigold|amber|copper|bronze)/i.test(colourText(colour))) return `${colour.name} metal jewellery`;
  return `${colour.name} stone or enamel jewellery`;
}

const COLOUR_MODIFIER_WORDS = [
  'soft', 'deep', 'dark', 'light', 'muted', 'dusty', 'warm', 'cool', 'pale', 'rich',
  'bright', 'washed', 'faded', 'dusky', 'smoky', 'smokey',
];

// Fabric-ish words (denim, chambray) are deliberately excluded so they survive as
// garment/fabric descriptors rather than being stripped as colours.
const COLOUR_NAME_WORDS = [
  'black', 'white', 'ivory', 'cream', 'off-white', 'offwhite', 'navy', 'blue', 'cobalt',
  'indigo', 'grey', 'gray', 'slate', 'charcoal', 'graphite', 'pewter', 'silver', 'brown',
  'tan', 'taupe', 'camel', 'cognac', 'espresso', 'cocoa', 'chocolate', 'mocha', 'beige',
  'oat', 'oatmeal', 'stone', 'sand', 'khaki', 'olive', 'green', 'emerald', 'teal', 'sage',
  'forest', 'mint', 'burgundy', 'oxblood', 'maroon', 'wine', 'berry', 'raspberry', 'cranberry', 'cherry', 'red', 'crimson',
  'scarlet', 'pink', 'rose', 'blush', 'fuchsia', 'magenta', 'coral', 'peach', 'salmon',
  'orange', 'rust', 'terracotta', 'sienna', 'amber', 'mustard', 'marigold', 'gold',
  'golden', 'yellow', 'ochre', 'mauve', 'lilac', 'lavender', 'purple', 'violet', 'plum',
  'aubergine', 'bronze', 'copper', 'nude', 'ecru', 'bone', 'chalk', 'pearl', 'jet', 'ink',
  'aqua', 'turquoise', 'cyan', 'periwinkle', 'jade', 'sapphire',
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const COLOUR_MODIFIER_COLOUR_RE = new RegExp(
  `\\b(?:${COLOUR_MODIFIER_WORDS.join('|')})\\s+(?:${COLOUR_NAME_WORDS.join('|')})\\b`,
  'gi',
);
const COLOUR_NAME_RE = new RegExp(`\\b(?:${COLOUR_NAME_WORDS.join('|')})\\b`, 'gi');

// Strip colour words from a piece description so a single plan colour can be
// prepended without producing impossible two-colour garments
// (e.g. "emerald silk dress" must not become "Camel Tan emerald silk dress").
function stripColourWords(piece: string) {
  return piece
    .replace(COLOUR_MODIFIER_COLOUR_RE, ' ')
    .replace(COLOUR_NAME_RE, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,-]+/, '')
    .trim();
}

const UNSAFE_NECKLINE_RE = /\b(deep\s*v|deep-v|plung(?:e|ing)|low[-\s]?cut|low\s+scoop|low\s+neck|keyhole|off[-\s]?shoulder|one[-\s]?shoulder|strapless|spaghetti\s+strap|strappy|cleavage|décolletage|decolletage)\b/i;
const STANDALONE_CAMISOLE_RE = /\b(camisole|cami|tank)\b/i;

function slotNeedsNecklineSafety(slot: string) {
  return /top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|kurta|tunic|co-ord|coord|set|base layer/i.test(slot);
}

function applyNecklineSafetyToPiece(piece: string, slot: string, plan: PlannedOutfit) {
  if (!plan.coverage_profile.neckline || !slotNeedsNecklineSafety(slot)) return piece;
  const safeNeckline = plan.styling_decision.neckline_rules.approved[0] ?? 'soft V that does not expose cleavage';
  let next = piece
    .replace(UNSAFE_NECKLINE_RE, safeNeckline)
    .replace(/\bwrap\b/gi, 'secured wrap neckline')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (STANDALONE_CAMISOLE_RE.test(next)) {
    next = next.replace(STANDALONE_CAMISOLE_RE, `${safeNeckline} sleeved shell`);
  }
  if (!new RegExp(`\\b(${SAFE_NECKLINES.map(escapeRegExp).join('|')}|collared|open collar|soft v|v neck|v-neck|crew|jewel|mock|mandarin|band collar|boat|bateau|soft scoop|modest square|secured wrap|wrap neckline)\\b`, 'i').test(next)) {
    next = `${next} with ${safeNeckline} neckline`;
  }
  return next;
}

function applyFinishingDetailSafety(piece: string, slot: string) {
  const text = `${slot} ${piece}`.toLowerCase();
  if (!/\b(lip|lipstick|lip tone|makeup)\b/.test(text)) return piece;
  if (/\b(blue|green|yellow|gold|silver|black|white|navy|teal|olive|emerald|purple|violet|lavender|aqua|turquoise|cyan)\b/.test(text)) {
    return 'soft rose-brown natural lip tone';
  }
  if (!/\b(rose|brown|rose-brown|nude|mauve|berry|coral|peach|pink|terracotta|brick|plum|wine|blush)\b/.test(text)) {
    return 'soft rose-brown natural lip tone';
  }
  return piece;
}

function normalisePieceColourApplication(piece: string, slot: string, plan: PlannedOutfit, colour: PlannedOutfitColour) {
  const lower = slot.toLowerCase();
  if (/shoe|footwear/.test(lower)) return realisticFootwearFamily(colour, plan, piece);
  if (/bag|tote|clutch|crossbody|handbag/.test(lower)) return realisticBagFamily(colour, plan);
  if (/jewel|accessor|scarf|trim|hardware|hair|pattern|print/.test(lower)) return realisticAccessoryFamily(colour, plan, slot);
  if (/belt/.test(lower)) return `${colour.name} slim leather belt`;
  const withoutName = piece.replace(new RegExp(escapeRegExp(colour.name), 'gi'), ' ');
  const noun = stripColourWords(withoutName) || slot.toLowerCase();
  return applyNecklineSafetyToPiece(`${colour.name} ${noun}`, slot, plan);
}

const LAYER_TEXTURES = [
  'structured twill',
  'smooth ponte knit',
  'boucle or tweed texture',
  'soft suede or leather finish',
  'fine ribbed knit',
];

const BOTTOM_TEXTURES = [
  'structured twill',
  'matte crepe',
  'washed denim',
  'lightweight linen blend',
  'smooth ponte knit',
];

// Give each slot its own fabric (top, bottom, and layer differ) and keep the
// fabric plausible for the capsule, instead of cloning one texture head-to-toe.
function textureForSlot(slot: string, plan: PlannedOutfit) {
  const lower = slot.toLowerCase();
  let texture = plan.texture_direction;
  if (/outer|layer|blazer|jacket|cardigan|vest|coat|overshirt/.test(lower)) {
    texture = LAYER_TEXTURES[plan.outfit_number % LAYER_TEXTURES.length];
  } else if (/bottom|trouser|pant|jean|skirt|palazzo|legging/.test(lower)) {
    texture = BOTTOM_TEXTURES[(plan.outfit_number + 1) % BOTTOM_TEXTURES.length];
  }
  if (plan.capsule === 'Occasion' && /denim|washed|brushed cotton/i.test(texture)) {
    texture = 'fluid satin-back crepe';
  }
  if (plan.capsule === 'Professional' && /denim|washed/i.test(texture)) {
    texture = 'structured twill';
  }
  if (plan.capsule === 'Everyday' && /ponte|suiting|satin-back crepe|boucle|tweed/i.test(texture)) {
    texture = /bottom|trouser|pant|jean|skirt/.test(lower)
      ? 'cotton twill'
      : /outer|layer|jacket|overshirt|cardigan/.test(lower)
        ? 'washed denim or cotton twill'
        : 'crisp cotton or fine ribbed knit';
  }
  return texture;
}

function enrichGarmentTextureAndPattern(piece: string, slot: string, plan: PlannedOutfit) {
  const lowerSlot = slot.toLowerCase();
  if (/shoe|footwear|bag|jewel|accessor|scarf|belt|trim|hardware|hair/.test(lowerSlot)) return piece;

  const lowerPiece = piece.toLowerCase();
  const hasTexture = /(crepe|ribbed|knit|cotton|linen|twill|satin|silk|boucle|tweed|ponte|denim|suede|leather|wool|jacquard|chiffon|georgette|organza)/.test(lowerPiece);
  const hasPattern = /(stripe|pinstripe|check|herringbone|print|jacquard|panel|border|piping|plaid|texture|woven|ribbed|tweed|boucle)/.test(lowerPiece);

  const texture = hasTexture ? '' : ` in ${textureForSlot(slot, plan)}`;

  const patternInstruction = plan.pattern_instruction && !/clean solid/i.test(plan.pattern_instruction)
    ? plan.pattern_instruction
    : '';
  const canCarryPattern = /top|blouse|shirt|dress|jumpsuit|outer|layer|blazer|jacket|vest|bottom|trouser|pant|skirt/.test(lowerSlot);
  const pattern = plan.pattern_required && patternInstruction && !hasPattern && canCarryPattern
    ? ` with ${patternInstruction}`
    : '';

  return `${piece}${texture}${pattern}`;
}

function pieceTextFromItem(item: unknown, fallback: string) {
  if (typeof item === 'string') return item;
  const record = asRecord(item);
  return asString(record.piece)
    || asString(record.name)
    || asString(record.heading)
    || asString(record.body)
    || asString(record.value)
    || fallback;
}

function firstNamedColourFromText(text: string): { name: string; hex: string } | undefined {
  const match = text.toLowerCase().match(ANCHOR_COLOUR_RE)?.[0];
  if (!match) return undefined;
  const hex = NAMED_COLOUR_HEX[match.toLowerCase()];
  if (!hex) return undefined;
  return {
    name: match.replace(/\b\w/g, letter => letter.toUpperCase()),
    hex: normaliseHex(hex),
  };
}

function validPaletteRole(value: string): value is BlueprintColourUse['role'] {
  return value === 'lead' || value === 'support' || value === 'ground' || value === 'accent';
}

function harnessColourForItem(record: AnyRecord, slot: string, piece: string, plan: PlannedOutfit): PlannedOutfitColour {
  const rawRole = asString(record.palette_role);
  const fallback = colourForSlot(slot, plan);
  const role = validPaletteRole(rawRole) ? rawRole : roleForSlot(slot, fallback.role);
  const rawHex = asString(record.colour_hex);
  const rawName = asString(record.colour_name);
  if (rawName && isValidHex(rawHex)) {
    return { name: rawName, hex: normaliseHex(rawHex), role };
  }

  const named = firstNamedColourFromText(`${rawName} ${piece}`);
  if (named) return { ...named, role };

  return {
    ...fallback,
    role,
  };
}

function isShoeOrBagSlot(slot: string) {
  return /bag|tote|clutch|crossbody|handbag|shoe|footwear|sandal|heel|flat|loafer|pump|sneaker|mule|boot/i.test(slot);
}

function exactItemHasAlternativeLanguage(piece: string) {
  return /\boptional\b|\band\/or\b|\/|\bor\b/i.test(piece);
}

function neutralLeatherFallbackColour(plan: PlannedOutfit, role: BlueprintColourUse['role'] = 'ground'): PlannedOutfitColour {
  const candidates = [plan.ground_colour, plan.support_colour, plan.lead_colour]
    .filter((colour): colour is PlannedOutfitColour => Boolean(colour));
  const existing = candidates.find(colour => isRealisticLeatherColour(colour));
  if (existing) return { ...existing, role };
  const name = neutralLeatherColourName(plan);
  const word = name.toLowerCase().split(/\s+/)[0] || 'espresso';
  const hex = NAMED_COLOUR_HEX[word] ?? (name.toLowerCase().includes('charcoal') ? NAMED_COLOUR_HEX.charcoal : NAMED_COLOUR_HEX.espresso);
  return { name, hex: normaliseHex(hex), role };
}

function safeColourForHarnessSlot(slot: string, colour: PlannedOutfitColour, plan: PlannedOutfit): PlannedOutfitColour {
  if (!isShoeOrBagSlot(slot)) return colour;
  const isOccasionClutch = /clutch/i.test(slot) && plan.capsule === 'Occasion';
  if (isOccasionClutch || isRealisticLeatherColour(colour)) return colour;
  return neutralLeatherFallbackColour(plan, colour.role === 'lead' ? 'ground' : colour.role);
}

function sanitiseHarnessPiece(piece: string, slot: string, plan: PlannedOutfit, colour: PlannedOutfitColour) {
  const exactPiece = exactItemHasAlternativeLanguage(piece)
    ? piece
      .replace(/\band\/or\b/gi, 'or')
      .split(/\s+or\s+|\/|,\s*or\s*/i)[0]
      .trim()
    : piece;
  const noAccessoryTrim = applyFinishingDetailSafety(sanitiseAccessoryPieceRealism(exactPiece || piece, slot), slot);
  if (isShoeOrBagSlot(`${slot} ${noAccessoryTrim}`) && !isRealisticLeatherColour(colour)) {
    return normalisePieceColourApplication(noAccessoryTrim, slot, plan, colour);
  }
  return applyNecklineSafetyToPiece(noAccessoryTrim, slot, plan);
}

function structuralNotesFromItem(item: unknown, slot: string, plan: PlannedOutfit) {
  const record = asRecord(item);
  const existing = asString(record.structural_notes) || asString(record.notes) || asString(record.guidance) || asString(record.body);
  if (!weakText(existing)) return existing;
  if (/outer|layer|blazer|jacket|cardigan|vest/i.test(slot)) return `Use this ${plan.layer_type ?? 'layer'} only when it strengthens the outer frame; keep it open or lightly shaped so it does not add bulk through the centre.`;
  if (/jewel|accessor|bag|belt|scarf|trim/i.test(slot)) return 'Keep the detail small and intentional so the accent adds interest without taking over the outfit.';
  if (/shoe|footwear/i.test(slot)) return 'Keep the shoe clean and aligned with the outfit depth so the vertical line continues to the floor.';
  if (/bottom|trouser|skirt|jean/i.test(slot)) return 'Choose a clean fall and enough ease so the lower half supports length without clinging.';
  if (slotNeedsNecklineSafety(slot) && plan.coverage_profile.neckline) return 'Avoid cleavage and very low necklines while keeping the neckline natural for the outfit.';
  return 'Let the fit serve the harness styling intention first. Colour should support the silhouette, not lead it.';
}

type NormalisedFormulaItem = {
  slot: string;
  piece: string;
  colour_name: string;
  colour_hex: string;
  palette_role: BlueprintColourUse['role'];
  structural_notes: string;
  [key: string]: unknown;
};

function plannedFormulaItem(slot: string, plan: PlannedOutfit, pieceNoun?: string): NormalisedFormulaItem {
  const rawColour = colourForSlot(slot, plan);
  const colour = isShoeOrBagSlot(slot) ? neutralLeatherFallbackColour(plan, 'ground') : rawColour;
  const piece = enrichGarmentTextureAndPattern(
    normalisePieceColourApplication(`${colour.name} ${pieceNoun ?? slot.toLowerCase()}`, slot, plan, colour),
    slot,
    plan,
  );
  return {
    slot,
    piece,
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: colour.role,
    structural_notes: structuralNotesFromItem({}, slot, plan),
  };
}

function plannedFinishingDetailItem(plan: PlannedOutfit): NormalisedFormulaItem {
  const colour = plan.accent_colour ?? plan.lead_colour ?? plan.support_colour;
  const type = plan.finishing_detail_type ?? 'scarf';
  const pieceByType: Record<NonNullable<PlannedOutfit['finishing_detail_type']>, string> = {
    scarf: `${colour.name} silk scarf tied on the bag handle`,
    belt: `${neutralLeatherColourName(plan)} slim leather belt at the waist`,
    watch: `slim gold-tone watch with clean leather strap`,
    hair_detail: `${colour.name} silk scarf at a low ponytail`,
    lip_tone: `soft rose-brown natural lip tone`,
  };
  const metadataByType: Partial<Record<NonNullable<PlannedOutfit['finishing_detail_type']>, { name: string; hex: string }>> = {
    watch: { name: 'Gold', hex: '#B08D3F' },
    lip_tone: { name: 'Rose Brown', hex: '#9A5B55' },
  };
  const metadata = metadataByType[type];
  return {
    slot: 'Finishing Detail',
    piece: pieceByType[type],
    colour_name: metadata?.name ?? (type === 'belt' ? neutralLeatherColourName(plan) : colour.name),
    colour_hex: metadata?.hex ?? (type === 'belt'
      ? normaliseHex(NAMED_COLOUR_HEX[neutralLeatherColourName(plan).toLowerCase().split(/\s+/)[0]] ?? colour.hex)
      : colour.hex),
    palette_role: 'accent',
    structural_notes: 'Use this finishing detail only as one intentional styling move so the outfit feels complete without accessory clutter.',
  };
}

function isEyewearFormulaItem(item: unknown) {
  const record = asRecord(item);
  const text = `${asString(record.slot)} ${asString(record.piece)} ${asString(record.name)}`.toLowerCase();
  return /\b(eyewear|eyeglasses?|sunglasses?|spectacles?|frames?|rimmed)\b/.test(text);
}

function eyewearFormulaItem(plan: PlannedOutfit): NormalisedFormulaItem {
  const colour = plan.ground_colour ?? plan.support_colour;
  return {
    slot: 'Eyewear',
    piece: plan.eyewear_piece || 'slim dark tortoiseshell rectangular frames',
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: colour.role,
    structural_notes: `Use eyewear for ${plan.eyewear_role?.replace(/_/g, ' ') ?? 'face architecture'} without adding visual clutter near the face; keep jewellery quieter if the neckline or hero garment is already strong.`,
  };
}

function enforceEyewearItems(items: NormalisedFormulaItem[], plan: PlannedOutfit) {
  const withoutEyewear = items.filter(item => !isEyewearFormulaItem(item));
  if (!plan.eyewear_required) return withoutEyewear;

  const next = [...withoutEyewear];
  let insertAfter = -1;
  for (let index = next.length - 1; index >= 0; index -= 1) {
    const item = next[index];
    if (/jewel|accessor|earring|necklace|bracelet|watch|bangle/i.test(`${item.slot} ${item.piece}`)) {
      insertAfter = index;
      break;
    }
  }
  next.splice(insertAfter >= 0 ? insertAfter + 1 : next.length, 0, eyewearFormulaItem(plan));
  return next;
}

function hasFormulaSlot(items: NormalisedFormulaItem[], pattern: RegExp) {
  return items.some(item => pattern.test(item.slot) || pattern.test(item.piece));
}

function dedupeFormulaItems(items: NormalisedFormulaItem[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.slot}:${item.piece}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function completeFormulaItems(items: NormalisedFormulaItem[], plan: PlannedOutfit) {
  const next = dedupeFormulaItems(items);
  const hasDress = hasFormulaSlot(next, /dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set/i);
  const hasTop = hasFormulaSlot(next, /top|blouse|shirt|tee|t-shirt|knit|camisole|tank/i);
  const hasBottom = hasFormulaSlot(next, /bottom|trouser|pant|jean|skirt|palazzo|legging/i);

  if (!hasDress && !hasTop) next.unshift(plannedFormulaItem('Top', plan, 'clean top'));
  if (!hasDress && !hasBottom) next.splice(Math.min(1, next.length), 0, plannedFormulaItem('Bottom', plan, 'tailored bottom'));

  if (!hasFormulaSlot(next, /footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule/i)) {
    next.push(plannedFormulaItem('Footwear', plan, 'refined shoe'));
  }
  if (!hasFormulaSlot(next, /bag|tote|clutch|crossbody|handbag/i)) {
    next.push(plannedFormulaItem('Bag', plan, 'structured bag'));
  }
  if (!hasFormulaSlot(next, /jewel|accessor|earring|necklace|bracelet|watch|bangle|scarf|belt/i)) {
    next.push(plannedFormulaItem('Jewellery', plan, 'small jewellery detail'));
  }

  while (next.length < 5) {
    next.push(plannedFormulaItem(
      'Waist Detail',
      plan,
      'clean waist detail',
    ));
  }

  return next;
}

function isInternalLibraryBlock(block: BlueprintBlock) {
  const text = `${block.label ?? ''} ${block.heading ?? ''} ${block.body ?? ''}`.toLowerCase();
  return /library reference|adapted from|source outfit|root-\d|curated-\d/.test(text);
}

function outfitTitleFromPlan(plan: PlannedOutfit) {
  return `${plan.capsule} Look ${plan.outfit_number}`;
}

function shouldReplaceOutfitTitle(title: string, plan: PlannedOutfit) {
  const lower = title.toLowerCase();
  const libraryTitle = plan.library_reference?.title.toLowerCase();
  return !title.trim() ||
    /adapted from|library reference|root-\d|curated-\d/.test(lower) ||
    Boolean(libraryTitle && lower.includes(libraryTitle));
}

const HARNESS_ARCHETYPES = [
  'Coloured Hero + Quiet Support',
  'Neutral Architecture + Rich Accent',
  'Pattern Hero + Controlled Solids',
  'Texture Hero + Tonal Depth',
  'Shape Hero + Clean Colour',
  'Casual Base + Polished Disruptor',
  'Western Base + Elevated Finishing',
  'Indian Base + Modern Finishing',
];

function pageText(page: BlueprintPage) {
  return page.blocks
    .flatMap(block => [
      block.label,
      block.heading,
      block.body,
      block.reason,
      ...(Array.isArray(block.items) ? block.items.map(item => stringify(item)) : []),
    ])
    .filter(Boolean)
    .join(' ');
}

function inferHarnessArchetype(page: BlueprintPage, plan: PlannedOutfit) {
  const text = pageText(page).toLowerCase();
  const found = HARNESS_ARCHETYPES.find(archetype => text.includes(archetype.toLowerCase()));
  if (found) return found;
  if (plan.capsule === 'Professional') return plan.outfit_number % 2 === 0 ? 'Neutral Architecture + Rich Accent' : 'Shape Hero + Clean Colour';
  if (plan.capsule === 'Social') return plan.outfit_number % 2 === 0 ? 'Coloured Hero + Quiet Support' : 'Pattern Hero + Controlled Solids';
  if (plan.capsule === 'Everyday') return plan.outfit_number % 2 === 0 ? 'Casual Base + Polished Disruptor' : 'Texture Hero + Tonal Depth';
  return plan.outfit_number % 2 === 0
    ? (plan.cultural_mode === 'western_default' ? 'Western Base + Elevated Finishing' : 'Indian Base + Modern Finishing')
    : 'Coloured Hero + Quiet Support';
}

function findHarnessBlock(page: BlueprintPage, pattern: RegExp) {
  return page.blocks.find(block => pattern.test(`${block.label ?? ''} ${block.heading ?? ''} ${block.body ?? ''} ${block.reason ?? ''}`));
}

function usefulHarnessBlock(page: BlueprintPage, pattern: RegExp, fallback: BlueprintBlock): BlueprintBlock {
  const block = findHarnessBlock(page, pattern);
  if (block && !isInternalLibraryBlock(block) && !weakText(block.body || block.reason)) return block;
  return fallback;
}

function normaliseOutfitPage(page: BlueprintPage, plan: PlannedOutfit): BlueprintPage {
  const sourceFormulaBlock = page.blocks.find(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const archetype = inferHarnessArchetype(page, plan);
  let items: NormalisedFormulaItem[] = flattenFormulaItems(page).map((item, index) => {
    const initialSlot = slotFromItem(item, index);
    const fallbackColour = colourForSlot(initialSlot, plan);
    const rawPiece = pieceTextFromItem(item, `${fallbackColour.name} ${initialSlot.toLowerCase()}`);
    const slot = /^(outfit|formula|look|piece)$/i.test(initialSlot)
      ? inferPrimarySlot(rawPiece, index === 0 ? 'Top' : initialSlot)
      : initialSlot;
    const rawColour = harnessColourForItem(asRecord(item), slot, rawPiece, plan);
    const slotColour = safeColourForHarnessSlot(`${slot} ${rawPiece}`, rawColour, plan);
    const normalisedPiece = enrichGarmentTextureAndPattern(
      sanitiseHarnessPiece(rawPiece, slot, plan, slotColour),
      slot,
      plan,
    );
    return {
      ...asRecord(item),
      slot,
      piece: normalisedPiece,
      colour_name: slotColour.name,
      colour_hex: slotColour.hex,
      palette_role: slotColour.role,
      structural_notes: structuralNotesFromItem(item, slot, plan),
    };
  });

  items = completeFormulaItems(items, plan);
  items = enforceEyewearItems(items, plan);
  const paletteUsed = paletteUsedFromItems(items, plannedPalette(plan));

  const heroItem = items.find(item => item.palette_role === 'lead') ?? items[0];
  const mainColour = heroItem?.colour_name ?? plan.lead_colour.name;
  const reasoningBlock = usefulHarnessBlock(page, /why|works|logic|reason/i, {
    label: 'Why it works',
    heading: 'Harness styling logic',
    body: `Archetype: ${archetype}. The hero is ${heroItem?.piece ?? 'the main garment'}, and the colour choice uses ${mainColour} as the main visual move while keeping shoes, bag, and accessories realistic.`,
    reason: 'This is a harness fallback because Gemini did not return a usable why-it-works block.',
  });

  const roleBlock = usefulHarnessBlock(page, /role|hero|face-lift|anchor|lengthener|freshness|bridge|finish/i, {
    label: 'Role breakdown',
    heading: 'Colour and structure roles',
    body: `Hero: ${heroItem?.piece ?? 'main garment'}. Face-lift: ${mainColour}. Anchor: ${items.find(item => item.palette_role === 'ground')?.piece ?? 'grounded footwear and bag'}. Freshness: ${mainColour}. Bridge: ${items.find(item => item.palette_role === 'support')?.piece ?? 'supporting neutral'}. Finish: ${items.find(item => /jewel|accessor|eyewear|belt|scarf|watch/i.test(item.slot))?.piece ?? 'clean finishing detail'}.`,
  });

  const doNotBuyBlock = usefulHarnessBlock(page, /do not buy|wrong version|avoid buying|avoid this/i, {
    label: 'Do not buy',
    heading: 'The version that breaks it',
    body: 'Do not buy the clingy, shiny, over-accessorised version of this outfit; it removes the body strategy and makes the colour look accidental instead of styled.',
  });

  const scoreBlock = usefulHarnessBlock(page, /score|summary|body geometry|undertone alignment|visual hierarchy|realism/i, {
    label: 'Score summary',
    heading: 'Harness score check',
    body: 'Body Geometry: 8+. Undertone Alignment: 8+. Colour Freshness: 7.5+. Contrast: 7.5+. Visual Hierarchy: 8+. Realism: 8+. Distinctiveness: 7+. Occasion Fit: 8+.',
  });
  const sourceBody = sourceFormulaBlock?.body;
  const formulaBody = sourceBody && !weakText(sourceBody)
    ? (/archetype|hero/i.test(sourceBody) ? sourceBody : `Archetype: ${archetype}. Hero: ${heroItem?.piece ?? 'main garment'}. ${sourceBody}`)
    : `Archetype: ${archetype}. Hero: ${heroItem?.piece ?? 'main garment'}. Use the attached images, coverage, and free notes as guardrails while the harness chooses the outfit formula and colour movement.`;

  const formulaBlock: BlueprintBlock = {
    label: sourceFormulaBlock?.label || 'Formula',
    heading: sourceFormulaBlock?.heading || `${plan.capsule} harness formula ${plan.outfit_number}`,
    body: formulaBody,
    items,
  };

  const nextBlocks = [
    formulaBlock,
    reasoningBlock,
    roleBlock,
    doNotBuyBlock,
    scoreBlock,
  ];

  return {
    ...page,
    title: shouldReplaceOutfitTitle(page.title, plan) ? outfitTitleFromPlan(plan) : page.title,
    subtitle: page.subtitle || plan.capsule,
    blocks: nextBlocks,
    palette_used: paletteUsed,
    library_refs: [plan.library_reference]
      .filter((ref): ref is BlueprintLibraryRef => Boolean(ref))
      .length
      ? [plan.library_reference].filter((ref): ref is BlueprintLibraryRef => Boolean(ref))
      : page.library_refs,
  };
}

function normaliseGeneratedPage(
  page: BlueprintPage,
  reportData: StylistBlueprintReportData,
  planOverride?: PlannedOutfit,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
): BlueprintPage {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (page.page_number >= outfitStart && page.page_number <= outfitEnd) {
    const plan = planOverride ?? buildOutfitDiversityPlan(reportData, libraryContext)[page.page_number - outfitStart];
    return normaliseOutfitPage(page, plan);
  }
  return normaliseUsefulBlocks(page, reportData);
}

type SilhouetteRuleExampleKind = 'vertical' | 'waist' | 'structure' | 'balance';

type SilhouetteRuleProofTarget = {
  blockIndex: number;
  itemIndex?: number;
  text: string;
  kind: SilhouetteRuleExampleKind;
};

const SILHOUETTE_RULE_EXAMPLES: Record<SilhouetteRuleExampleKind, {
  label: string;
  principle: string;
  ruleKeywords: RegExp;
  directive: string;
}> = {
  vertical: {
    label: 'Vertical Column Proof',
    principle: 'A continuous base with an open long line creates visual length.',
    ruleKeywords: /vertical|column|matching|tone|tonal|monochrome|open|longer|long-line|longline|layer|blazer|cardigan|elongat/i,
    directive: 'Create a fresh outfit with a continuous tonal inner column: matching or near-matching top and bottom tones underneath an open longline cardigan, blazer, duster, or jacket. The top and bottom must visibly read as one vertical base, and the open layer must create the long outer line.',
  },
  waist: {
    label: 'Ratio Proof',
    principle: 'A deliberate waist point controls the top-to-bottom ratio.',
    ruleKeywords: /waist|high-rise|high rise|tuck|tucked|semi-tuck|semi tuck|cropped|1\/3|2\/3|ratio|leg line|waistline/i,
    directive: 'Create a fresh outfit that demonstrates high-rise proportion with a visible tuck, semi-tuck, cropped top, belt, or waist seam. The result must clearly show a 1/3 top to 2/3 bottom ratio and an intentional waist point.',
  },
  structure: {
    label: 'Structure Proof',
    principle: 'Structured fabric skims the body instead of clinging to it.',
    ruleKeywords: /structured|structure|skim|skimming|woven|mid-weight|midweight|substance|cling|clinging|fabric|tailored|drape/i,
    directive: 'Create a fresh outfit using woven, tailored, midweight, or clean-fall garments that skim rather than cling. The formula must make the non-cling fabric behavior visible through cut, fabric, and structural notes.',
  },
  balance: {
    label: 'Balance Proof',
    principle: 'A stable lower line balances shoulder and hip width.',
    ruleKeywords: /shoulder|hip|balance|straight-leg|straight leg|wide-leg|wide leg|stable base|width|proportion/i,
    directive: 'Create a fresh outfit with a stable straight-leg, wide-leg, or similarly grounded lower line that balances shoulder and hip width. The lower body line must look intentional, clean, and visually stabilising.',
  },
};

function classifySilhouetteRuleExample(text: string, fallbackIndex: number): SilhouetteRuleExampleKind {
  const found = (Object.entries(SILHOUETTE_RULE_EXAMPLES) as Array<[SilhouetteRuleExampleKind, typeof SILHOUETTE_RULE_EXAMPLES[SilhouetteRuleExampleKind]]>)
    .find(([, config]) => config.ruleKeywords.test(text));
  if (found) return found[0];
  return (['vertical', 'waist', 'structure', 'balance'] as const)[Math.min(fallbackIndex, 3)];
}

function ruleBlockText(block: BlueprintBlock, item?: unknown) {
  return [
    block.label,
    block.heading,
    block.body,
    block.reason,
    item == null ? '' : stringify(item),
  ].filter(Boolean).join(' ');
}

function collectSilhouetteRuleProofTargets(rulesPage: BlueprintPage): SilhouetteRuleProofTarget[] {
  const targets: SilhouetteRuleProofTarget[] = [];
  rulesPage.blocks.forEach((block, blockIndex) => {
    if (targets.length >= 4) return;
    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length) {
      items.forEach((item, itemIndex) => {
        if (targets.length >= 4) return;
        const text = ruleBlockText(block, item);
        targets.push({
          blockIndex,
          itemIndex,
          text,
          kind: classifySilhouetteRuleExample(text, targets.length),
        });
      });
      return;
    }
    const text = ruleBlockText(block);
    targets.push({
      blockIndex,
      text,
      kind: classifySilhouetteRuleExample(text, targets.length),
    });
  });
  return targets.slice(0, 4);
}

function stripLegacySilhouetteExampleFields<T extends object>(record: T) {
  const rest = { ...record } as Record<string, unknown>;
  delete rest.example_outfit_page_number;
  delete rest.example_outfit_principle;
  delete rest.example_outfit_label;
  return rest;
}

function normalisedFormulaItemsForProof(page: BlueprintPage): NormalisedFormulaItem[] {
  return flattenFormulaItems(page)
    .map(item => asRecord(item) as NormalisedFormulaItem)
    .filter(item => Boolean(item.slot && item.piece));
}

function proofSlotIndex(items: NormalisedFormulaItem[], pattern: RegExp) {
  return items.findIndex(item => pattern.test(`${item.slot} ${item.piece}`));
}

function proofColourFromItem(item: NormalisedFormulaItem | undefined, fallback: BlueprintColourUse): BlueprintColourUse {
  const hex = normaliseHex(asString(item?.colour_hex, fallback.hex));
  return {
    name: asString(item?.colour_name, fallback.name),
    hex,
    role: fallback.role,
  };
}

function replaceProofPieceColour(piece: string, colour: Pick<BlueprintColourUse, 'name'>) {
  const cleaned = piece.replace(ANCHOR_COLOUR_RE, colour.name).replace(/\s{2,}/g, ' ').trim();
  if (new RegExp(`\\b${escapeRegExp(colour.name)}\\b`, 'i').test(cleaned)) return cleaned;
  return `${colour.name} ${cleaned}`;
}

function mergeProofNote(item: NormalisedFormulaItem, note: string) {
  return [item.structural_notes, note]
    .filter(Boolean)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function forceProofColour(
  item: NormalisedFormulaItem,
  colour: BlueprintColourUse,
  role: BlueprintColourUse['role'],
  note: string,
): NormalisedFormulaItem {
  return {
    ...item,
    piece: replaceProofPieceColour(item.piece, colour),
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: role,
    structural_notes: mergeProofNote(item, note),
  };
}

function forcePhrase(piece: string, phrase: string, pattern: RegExp) {
  if (pattern.test(piece)) return piece;
  return `${phrase} ${piece}`.replace(/\s{2,}/g, ' ').trim();
}

function enforceVerticalProofItems(items: NormalisedFormulaItem[]): NormalisedFormulaItem[] {
  const next = [...items];
  const topIndex = proofSlotIndex(next, /top|blouse|shirt|tee|knit|shell/i);
  const bottomIndex = proofSlotIndex(next, /bottom|trouser|pant|jean|skirt|palazzo/i);
  const layerIndex = proofSlotIndex(next, /layer|outerwear|blazer|jacket|cardigan|duster|vest|coat/i);
  const top = next[topIndex];
  const bottom = next[bottomIndex];
  if (top && bottom) {
    const topColour = proofColourFromItem(top, { name: 'Deep Column', hex: '#2A2926', role: 'lead' });
    const bottomColour = proofColourFromItem(bottom, { name: 'Deep Column', hex: '#2A2926', role: 'support' });
    const columnColour = relativeLuminance(bottomColour.hex) <= relativeLuminance(topColour.hex) ? bottomColour : topColour;
    next[topIndex] = forceProofColour(
      top,
      columnColour,
      'lead',
      'This top is deliberately the same tone as the bottom so the inner outfit reads as one uninterrupted vertical column.',
    );
    next[bottomIndex] = forceProofColour(
      bottom,
      columnColour,
      'support',
      'This bottom exactly matches the top tone to continue the vertical column from shoulder to hem.',
    );
  }
  if (layerIndex >= 0) {
    const layer = next[layerIndex];
    next[layerIndex] = {
      ...layer,
      piece: forcePhrase(
        layer.piece.replace(/\b(single-breasted|cropped|short)\b/gi, '').replace(/\s{2,}/g, ' ').trim(),
        'open longline',
        /\bopen\b.*\blongline\b|\blongline\b.*\bopen\b/i,
      ),
      structural_notes: mergeProofNote(layer, 'Wear this layer open; its longer outside edges create the two slimming vertical lines over the matching inner column.'),
    };
  }
  return next;
}

function ensureProofFinishingItem(items: NormalisedFormulaItem[], item: NormalisedFormulaItem) {
  const existingIndex = proofSlotIndex(items, /finishing|belt|scarf|watch|hair detail|lip tone/i);
  if (existingIndex >= 0) {
    const next = [...items];
    next[existingIndex] = {
      ...next[existingIndex],
      piece: item.piece,
      colour_name: item.colour_name,
      colour_hex: item.colour_hex,
      palette_role: item.palette_role,
      structural_notes: mergeProofNote(next[existingIndex], item.structural_notes),
    };
    return next;
  }
  if (items.length >= 7) {
    const replaceIndex = proofSlotIndex(items, /eyewear|jewellery|jewelry|earring|bracelet|watch|ring/i);
    const next = [...items];
    next[replaceIndex >= 0 ? replaceIndex : next.length - 1] = item;
    return next;
  }
  return [...items, item];
}

function enforceWaistProofItems(items: NormalisedFormulaItem[]): NormalisedFormulaItem[] {
  let next = [...items];
  const topIndex = proofSlotIndex(next, /top|blouse|shirt|tee|knit|shell/i);
  const bottomIndex = proofSlotIndex(next, /bottom|trouser|pant|jean|skirt|palazzo/i);
  if (topIndex >= 0) {
    const top = next[topIndex];
    next[topIndex] = {
      ...top,
      piece: forcePhrase(top.piece, 'semi-tucked', /\btuck|tucked|semi-tuck|semi tucked|cropped\b/i),
      structural_notes: mergeProofNote(top, 'Style this top semi-tucked or cropped so the waist point is visible instead of hidden.'),
    };
  }
  if (bottomIndex >= 0) {
    const bottom = next[bottomIndex];
    next[bottomIndex] = {
      ...bottom,
      piece: forcePhrase(bottom.piece, 'high-rise', /\bhigh-rise|high rise|high-waist|high waist\b/i),
      structural_notes: mergeProofNote(bottom, 'The high-rise waist creates the 1/3 top to 2/3 bottom proportion and lengthens the leg line.'),
    };
  }
  const beltColour: BlueprintColourUse = {
    name: asString(next.find(item => /bag|footwear|shoe/i.test(item.slot))?.colour_name, 'Chocolate'),
    hex: normaliseHex(asString(next.find(item => /bag|footwear|shoe/i.test(item.slot))?.colour_hex, '#4B2E24')),
    role: 'accent',
  };
  next = ensureProofFinishingItem(next, {
    slot: 'Finishing Detail',
    piece: `${beltColour.name} slim leather belt at the high waist`,
    colour_name: beltColour.name,
    colour_hex: beltColour.hex,
    palette_role: 'accent',
    structural_notes: 'The belt marks the waist cleanly so the ratio is visible in the image.',
  });
  return next;
}

function enforceStructureProofItems(items: NormalisedFormulaItem[]): NormalisedFormulaItem[] {
  return items.map((item) => {
    if (!/top|bottom|dress|jumpsuit|layer|outerwear|blazer|jacket|trouser|pant|skirt/i.test(`${item.slot} ${item.piece}`)) return item;
    return {
      ...item,
      piece: forcePhrase(item.piece, 'midweight woven', /\bwoven|midweight|mid-weight|tailored|crepe|ponte|structured\b/i),
      structural_notes: mergeProofNote(item, 'This piece must skim cleanly away from the body with structured fabric; it should never look clingy, thin, or bodycon.'),
    };
  });
}

function enforceBalanceProofItems(items: NormalisedFormulaItem[]): NormalisedFormulaItem[] {
  const next = [...items];
  const bottomIndex = proofSlotIndex(next, /bottom|trouser|pant|jean|skirt|palazzo/i);
  if (bottomIndex >= 0) {
    const bottom = next[bottomIndex];
    const colour = proofColourFromItem(bottom, { name: 'Grounded Neutral', hex: '#2F2A25', role: 'support' });
    next[bottomIndex] = {
      ...bottom,
      piece: /\bstraight-leg|straight leg|wide-leg|wide leg|palazzo\b/i.test(bottom.piece)
        ? bottom.piece
        : `${colour.name} high-waisted straight-leg tailored trousers`,
      colour_name: colour.name,
      colour_hex: colour.hex,
      palette_role: 'support',
      structural_notes: mergeProofNote(bottom, 'The clean straight or wide lower line creates a stable base that balances shoulder and hip width.'),
    };
  }
  return next;
}

function enforceSilhouetteProofItems(items: NormalisedFormulaItem[], kind: SilhouetteRuleExampleKind): NormalisedFormulaItem[] {
  if (kind === 'vertical') return enforceVerticalProofItems(items);
  if (kind === 'waist') return enforceWaistProofItems(items);
  if (kind === 'structure') return enforceStructureProofItems(items);
  if (kind === 'balance') return enforceBalanceProofItems(items);
  return items;
}

function proofOutfitFromPage(page: BlueprintPage, kind: SilhouetteRuleExampleKind, index: number): SilhouetteProofOutfit {
  const formulaItems = enforceSilhouetteProofItems(normalisedFormulaItemsForProof(page), kind).slice(0, 7);
  const palette = page.palette_used?.length
    ? page.palette_used
    : formulaItems
      .map(item => {
        return {
          name: asString(item.colour_name, 'Neutral'),
          hex: normaliseHex(asString(item.colour_hex, '#94A6AD')),
          role: item.palette_role || 'support',
          usage: asString(item.structural_notes),
        };
      })
      .slice(0, 4);
  return {
    title: page.title || SILHOUETTE_RULE_EXAMPLES[kind].label,
    principle: SILHOUETTE_RULE_EXAMPLES[kind].principle,
    formula_items: formulaItems,
    palette_used: paletteUsedFromItems(formulaItems, palette.slice(0, 5)),
    image_slot: `application.silhouetteProofs.${index}`,
  };
}

function attachExampleToRuleItem(item: unknown, proof: SilhouetteProofOutfit) {
  const base = typeof item === 'string' ? { guidance: item } : asRecord(item);
  return {
    ...stripLegacySilhouetteExampleFields(base),
    example_outfit: proof,
  };
}

function silhouetteProofExistingOutfits(reportData: StylistBlueprintReportData) {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  return reportData.pages
    .filter(page => page.page_number >= outfitStart && page.page_number <= outfitEnd && page.page_type === 'outfit')
    .map(outfitSummaryForReplacement);
}

function transformationLookSummaries(reportData: StylistBlueprintReportData) {
  const transformationPage = reportData.pages.find(page => page.page_number === getStylistBlueprintTransformationPage(reportData));
  return (transformationPage?.blocks ?? []).slice(0, 3).map((block, index) => ({
    look: index + 1,
    heading: block.heading || block.label || '',
    body: block.body || '',
    formula: Array.isArray(block.items) ? block.items : [],
  }));
}

function silhouetteProofCardDirective(target: SilhouetteRuleProofTarget) {
  return [
    `Actual Silhouette Rule card text: ${target.text}`,
    `Proof category: ${SILHOUETTE_RULE_EXAMPLES[target.kind].label}.`,
    `Hard visual directive: ${SILHOUETTE_RULE_EXAMPLES[target.kind].directive}`,
    'This proof outfit must be generated only for this rule card and must not become one of the detailed report recommendations.',
    'It must be different from the main report outfits while still obeying the client profile, coverage, cultural mode, colour palette, and the women outfit harness/library.',
  ].join(' ');
}

function silhouetteProofAvoidanceContext(reportData: StylistBlueprintReportData, targets: SilhouetteRuleProofTarget[]) {
  const detailedOutfits = silhouetteProofExistingOutfits(reportData);
  const transformationLooks = transformationLookSummaries(reportData);
  return `--- SILHOUETTE PROOF OUTFITS ---
Generate these four outfits only as compact proof examples for the Silhouette Rules slide. They are not detailed report recommendations and must not be added to report pages.

Proof directives, one per actual rule card:
${targets.map((target, index) => `${index + 1}. ${silhouetteProofCardDirective(target)}`).join('\n')}

Do not repeat or closely copy these existing detailed recommendation outfits:
${stringify(detailedOutfits.map(item => ({
  title: item.title,
  capsule: item.capsule,
  lead_colour: item.lead_colour,
  main_piece: item.main_piece,
  main_garment_type: item.main_garment_type,
  layer_status: item.layer_status,
  layer_type: item.layer_type,
  archetype: item.archetype,
  footwear: item.footwear,
  bag: item.bag,
})))}

Do not repeat or closely copy these transformation preview looks:
${stringify(transformationLooks)}

Each proof outfit should be visually simple, realistic to shop, image-generation safe, and focused on proving its assigned silhouette principle. Preserve any assigned library skeleton as the catalog anchor, but adapt it enough that it is not the same look as the main recommendation pages.
--- END SILHOUETTE PROOF OUTFITS ---`;
}

function buildSilhouetteProofPlans(
  reportData: StylistBlueprintReportData,
  submission?: StylistIntakeSubmission | null,
  targets: SilhouetteRuleProofTarget[] = [],
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
) {
  const culturalMode = getStylistOutfitCulturalMode(submission);
  const basePlans = buildOutfitDiversityPlan(reportData, libraryContext, culturalMode);
  const sourceIndexes = [0, 6, 12, 18];
  const fallbackKinds: SilhouetteRuleExampleKind[] = ['vertical', 'waist', 'structure', 'balance'];
  const usedLibraryIds = new Set(silhouetteProofExistingOutfits(reportData).flatMap(item => item.library_ids));
  return (targets.length ? targets : fallbackKinds.map((kind, index) => ({
    blockIndex: index,
    text: SILHOUETTE_RULE_EXAMPLES[kind].directive,
    kind,
  }))).slice(0, 4).map((target, index): PlannedOutfit => {
    const kind = target.kind;
    const sourceIndex = sourceIndexes[index] ?? index;
    const source = basePlans[sourceIndex] ?? basePlans[index] ?? basePlans[0];
    if (!source) throw new Error(`Missing silhouette proof source plan ${index + 1}`);
    const alternative = chooseAlternativeLibraryOutfit(
      libraryContext.outfits,
      source.capsule,
      usedLibraryIds,
      libraryContext.blockedSignatures,
      source.styling_decision.anchor_role,
    );
    const stylingDecision = alternative && source
      ? buildStylingDecisionPlan(reportData, source.capsule, sourceIndex, source.coverage_profile, culturalMode, alternative, source.styling_decision.anchor_role)
      : source.styling_decision;
    const colours = alternative && source
      ? restrainedColourStory(reportData, source.capsule, sourceIndex, alternative, stylingDecision)
      : null;
    if (alternative) usedLibraryIds.add(alternative.id);
    const plan: PlannedOutfit = {
      ...source,
      outfit_number: index + 1,
      display_outfit_number: index + 1,
      page_number: 900 + index,
      purpose: 'detailed_report',
      capsule: source.capsule,
      formula_direction: silhouetteProofCardDirective(target),
      ...(alternative
        ? {
          styling_decision: stylingDecision,
          lead_colour: colours?.lead ?? source.lead_colour,
          support_colour: colours?.support ?? source.support_colour,
          ground_colour: colours?.ground,
          accent_colour: colours?.accent,
          accent_mode: colours?.accent ? 'detail' : undefined,
          accent_application: colours?.accent ? source.accent_application : undefined,
          library_reference: libraryReferenceForPlan(alternative, source.capsule),
          library_piece_logic: libraryPieceLogic(alternative),
        }
        : {}),
      eyewear_required: false,
      finishing_required: kind === 'waist' || source.finishing_required,
      finishing_detail_type: kind === 'waist' ? 'belt' : source.finishing_detail_type,
      layer_required: kind === 'vertical' ? true : kind === 'structure' ? false : source.layer_required,
      layer_type: kind === 'vertical' ? 'open longline blazer or cardigan' : source.layer_type,
      pattern_required: false,
      pattern_instruction: undefined,
      max_visible_colours: 3,
    };
    if (!plan.layer_required) plan.layer_type = undefined;
    return plan;
  });
}

export function collectSilhouetteRuleProofTargetsForTest(reportData: StylistBlueprintReportData) {
  const rulesPage = reportData.pages.find(page => page.page_number === getStylistBlueprintRulesStartPage(reportData));
  return rulesPage ? collectSilhouetteRuleProofTargets(rulesPage).map(target => ({
    text: target.text,
    kind: target.kind,
    blockIndex: target.blockIndex,
    itemIndex: target.itemIndex,
  })) : [];
}

export function buildSilhouetteProofPlanSummariesForTest(
  reportData: StylistBlueprintReportData,
  submission?: StylistIntakeSubmission | null,
) {
  const rulesPage = reportData.pages.find(page => page.page_number === getStylistBlueprintRulesStartPage(reportData));
  const targets = rulesPage ? collectSilhouetteRuleProofTargets(rulesPage) : [];
  return buildSilhouetteProofPlans(reportData, submission, targets).map(plan => ({
    page_number: plan.page_number,
    formula_direction: plan.formula_direction,
    layer_required: plan.layer_required,
    layer_type: plan.layer_type,
    finishing_required: plan.finishing_required,
    finishing_detail_type: plan.finishing_detail_type,
    library_reference: plan.library_reference,
    has_library_piece_logic: Boolean(plan.library_piece_logic?.length),
  }));
}

async function generateSilhouetteProofOutfits(
  reportData: StylistBlueprintReportData,
  submission?: StylistIntakeSubmission | null,
  targets: SilhouetteRuleProofTarget[] = [],
) {
  const libraryContext = await loadOutfitLibraryContext();
  const plans = buildSilhouetteProofPlans(reportData, submission, targets, libraryContext);
  const pages = await generateHarnessOnlyOutfitPages(
    reportData,
    plans,
    submission,
    null,
    undefined,
    silhouetteProofAvoidanceContext(reportData, targets),
  );
  return plans.map((plan, index) => {
    const kind = targets[index]?.kind ?? (['vertical', 'waist', 'structure', 'balance'] as const)[index];
    const page = pages.find(candidate => candidate.page_number === plans[index].page_number) ?? pages[index];
    if (!page) throw new Error(`Silhouette proof outfit ${index + 1} was not generated`);
    return proofOutfitFromPage(page, kind, index);
  });
}

export async function attachSilhouetteRuleOutfitExamples(
  reportData: StylistBlueprintReportData,
  submission?: StylistIntakeSubmission | null,
): Promise<StylistBlueprintReportData> {
  const rulesPageNumber = getStylistBlueprintRulesStartPage(reportData);
  const rulesPage = reportData.pages.find(page => page.page_number === rulesPageNumber);
  if (!rulesPage) return reportData;

  const targets = collectSilhouetteRuleProofTargets(rulesPage);
  if (!targets.length) return reportData;
  const proofs = await generateSilhouetteProofOutfits(reportData, submission, targets);
  const proofByTarget = new Map(targets.map((target, index) => [`${target.blockIndex}:${target.itemIndex ?? 'block'}`, proofs[index]]));
  const nextBlocks = rulesPage.blocks.map((block, blockIndex) => {
    const blockProof = proofByTarget.get(`${blockIndex}:block`);
    if (Array.isArray(block.items) && block.items.length) {
      const nextItems = block.items.map((item, itemIndex) => {
        const proof = proofByTarget.get(`${blockIndex}:${itemIndex}`);
        if (!proof) return item;
        return attachExampleToRuleItem(item, proof);
      });
      return { ...block, items: nextItems };
    }

    if (!blockProof) return stripLegacySilhouetteExampleFields(block);
    return {
      ...stripLegacySilhouetteExampleFields(block),
      example_outfit: blockProof,
    };
  });

  return {
    ...reportData,
    pages: reportData.pages.map(page => page.page_number === rulesPageNumber ? { ...page, blocks: nextBlocks } : page),
  };
}

export async function generateStylistBlueprintPages(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing',
): Promise<BlueprintPage[]> {
  const libraryContext = await loadOutfitLibraryContext();
  const culturalMode = getStylistOutfitCulturalMode(submission);
  const stylistOutfitLibrary = outfitLibraryPromptForContext(libraryContext);
  const pageCount = getStylistBlueprintPageCount(reportData);
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(reportData);
  const matrixPage = getStylistBlueprintMatrixPage(reportData);
  const auditPage = getStylistBlueprintAuditPage(reportData);
  const continuationPage = getStylistBlueprintContinuationPage(reportData);
  const capsuleRanges = getStylistBlueprintCapsulePageRanges(reportData);
  const outfitsPerCapsule = outfitCount / 4;
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData, libraryContext, culturalMode);
  if (act === 'application') {
    if (isLatestStylistBlueprintVersion(reportData)) {
      const previewPlans = buildTransformationPreviewPlans(reportData, outfitDiversityPlan);
      const detailedPlans = buildDetailedHarnessPlansAfterTransformation(outfitDiversityPlan);
      const previewPages = await generateHarnessOnlyOutfitPages(
        reportData,
        previewPlans,
        submission,
        null,
        undefined,
        'Generate only the transformation preview looks for page 2. The detailed outfit pages will be generated separately by capsule.',
      );
      const detailedPages = await generateHarnessDetailedOutfitPagesInBatches(reportData, detailedPlans, submission);
      return [
        ...previewPages.filter(page => page.page_type === 'transformation'),
        ...detailedPages,
      ];
    }
    return generateHarnessDetailedOutfitPagesInBatches(reportData, outfitDiversityPlan, submission);
  }
  const classificationContext = stringify(reportData.classification);
  const intakeContext = buildStylistBlueprintIntakeDigest(submission);
  const transformationPage = getStylistBlueprintTransformationPage(reportData);
  const summaryPage = getStylistBlueprintSummaryPage(reportData);
  const readingGuidePage = getStylistBlueprintReadingGuidePage(reportData);
  const bodyPage = getStylistBlueprintBodyGeometryPage(reportData);
  const chromaticPage = getStylistBlueprintChromaticPage(reportData);
  const facePage = getStylistBlueprintFaceArchitecturePage(reportData);
  const proportionPage = getStylistBlueprintProportionPage(reportData);
  const avoidancePage = getStylistBlueprintAvoidancePage(reportData);
  const palettePage = getStylistBlueprintPalettePage(reportData);
  const colourDrapePage = getStylistBlueprintColourDrapePage(reportData);
  const rulesStartPage = getStylistBlueprintRulesStartPage(reportData);
  const hairstylePage = getStylistBlueprintHairstylePage(reportData);
  const hairColourPage = getStylistBlueprintHairColourPage(reportData);
  const eyeframePage = getStylistBlueprintEyeframePage(reportData);
  const makeupPage = getStylistBlueprintMakeupPage(reportData);
  const hairFaceAccessoriesPage = getStylistBlueprintHairFaceAccessoriesPage(reportData);
  const fabricPage = getStylistBlueprintFabricPage(reportData);
  const outfitSystemPage = getStylistBlueprintOutfitSystemPage(reportData);
  const outfitStartPage = getStylistBlueprintOutfitStartPage(reportData);
  const ranges = {
    opening: transformationPage ? `pages 1, ${summaryPage}-${readingGuidePage}` : 'pages 1-3',
    diagnosis: `pages ${bodyPage}-${avoidancePage}`,
    prescription: `pages ${palettePage}-${fabricPage}`,
    application: transformationPage ? `page ${transformationPage} and pages ${outfitSystemPage}-${outfitEndPage}` : `pages ${outfitSystemPage}-${outfitEndPage}`,
    closing: `pages ${matrixPage}-${continuationPage}`,
  };
  const promptContext = `--- CURRENT CLASSIFICATION ---
${classificationContext}

--- CURRENT ANALYSIS ---
${stringify(reportData.analysis)}

--- DETERMINISTIC OUTFIT DIVERSITY PLAN ---
${stringify(outfitPlansForHarnessPrompt(outfitDiversityPlan))}

--- EXISTING PAGES ---
${stringify(reportData.pages)}

--- STYLIST OUTFIT LIBRARY ---
${stylistOutfitLibrary}

--- INTAKE ---
${intakeContext}`;

  const prompt = `You are ICONIK's premium women Style Blueprint writer.
Return ONLY valid JSON: {"pages":[...]}.

Generate ${ranges[act]} for the ${pageCount}-page Blueprint.
Use structured data only. No markdown. No client name after page 1.
Every recommendation must include one clear explanation, but do not duplicate the same sentence in both "body" and "reason".
For rule/audit/fabric/avoidance pages, prefer item objects with clear fields: {"name":"","guidance":"","reason":""} or {"question":"","answer":"","reason":""}.
Never emit visible schema labels like "name:" or "reason:" inside string values.
Use evidence-safe wording: no invented exact cm or percentage claims unless the intake explicitly supplies them.

Page map:
1 cover
${transformationPage ? `${transformationPage} Transformation Preview (generated by the harness during the application act; do not generate it in the opening act)\n` : ''}${summaryPage} Blueprint Summary dossier
${readingGuidePage} Reading This Blueprint
${bodyPage} Geometric Silhouette Profile
${chromaticPage} Chromatic Harmony Mapping
${facePage} Facial Architecture Analysis
${proportionPage} Proportional Axes
${avoidancePage} What to Avoid And Why
${palettePage} Colour Palette
${colourDrapePage ? `${colourDrapePage} Professional Colour Drape\n` : ''}${rulesStartPage} Silhouette Rules
${hairstylePage ? `${hairstylePage} Hairstyle Direction\n` : ''}${hairColourPage ? `${hairColourPage} Hair Colour Direction\n` : ''}${eyeframePage ? `${eyeframePage} Eyeframe Direction\n` : ''}${makeupPage ? `${makeupPage} Makeup for Everyday Looks\n` : ''}${!hairstylePage ? `${hairFaceAccessoriesPage} Hair, Face, Accessories\n` : ''}${fabricPage} Fabric and Texture Direction
${outfitSystemPage} Outfit System
${capsuleRanges[0].firstPage}-${capsuleRanges[0].lastPage} Professional Capsule outfits
${capsuleRanges[1].firstPage}-${capsuleRanges[1].lastPage} Social Capsule outfits
${capsuleRanges[2].firstPage}-${capsuleRanges[2].lastPage} Everyday Capsule outfits
${capsuleRanges[3].firstPage}-${capsuleRanges[3].lastPage} Occasion Capsule outfits
${matrixPage} Combination Matrix
${auditPage} Wardrobe Audit Filter
${continuationPage} Continuation / Edit

Required page object:
{"page_number":1,"page_type":"cover","title":"","subtitle":"","blocks":[{"label":"","heading":"","body":"","reason":"","items":[]}],"image_refs":[""]}

Application pages:
- Page ${outfitSystemPage} must introduce 4 capsules and list their ${outfitsPerCapsule} outfit names.
- Pages ${outfitStartPage}-${outfitEndPage} must be one outfit per page.
- Use the harness-first outfit contract below. The basic page plan is scaffolding only, not the source of colour blocking or repeated formulas.
- Each outfit plan includes only page number, capsule, max colours, and eyewear cadence.
${outfitGenerationSourceRules(libraryContext)}
- Neckline rules are hard coverage rules. If neckline_rules.coverage_required=true, avoid cleavage and very low necklines; do not assume high necklines are required. Safe open collars, soft V necklines, soft scoops, and modest square necks are allowed when they stay covered.
${outfitColourSourceRules(libraryContext)}
- Each outfit plan includes eyewear_required. If true, include exactly one Eyewear formula item with the provided eyewear_piece. If false, do not mention eyewear.
- Shared pieces should repeat across capsules where useful.

Prescription pages:
- Page ${palettePage} should focus only on palette logic. Colour usage metadata may be structured in JSON, but visible client text should not depend on hex codes or "anchor/wearable" labels.
${colourDrapePage ? `- Page ${colourDrapePage} should be a minimal professional colour drape page. The generated image carries the comparison; keep text concise.` : ''}
${hairstylePage ? `- Page ${hairstylePage} should provide exactly four hairstyle directions that correspond to the 2x2 generated hair image.` : ''}
${hairColourPage ? `- Page ${hairColourPage} (Hair Colour Direction) should provide exactly four hair-colour/highlight directions from face_hair_accessories.hair_colour_options that correspond to the 2x2 generated hair-colour image, plus a short intro from hair_colour_direction. Keep colours realistic, classy, feminine, salon-achievable, and compatible with the client's existing hairstyle/cut.` : ''}
${eyeframePage ? `- Page ${eyeframePage} should provide exactly four eyeframe/sunglass directions that correspond to the 2x2 generated eyewear image.` : ''}
${makeupPage ? `- Page ${makeupPage} (Makeup for Everyday Looks) should present a subtle natural everyday makeup look that matches the generated makeup image: a short intro from makeup.everyday_direction, exactly five ordered steps from makeup.steps, and the flattering everyday shades from makeup.colours. Keep it product-type only — no brands, no medical or clinical claims. Avoid glam, bridal, party makeup, heavy base, dramatic contour, smoky eyes, false lashes, glitter, and bold lipstick.` : ''}

${STYLIST_STYLING_PRINCIPLES}

${HARNESS_FIRST_OUTFIT_CONTRACT}

${PRACTICAL_COLOUR_APPLICATION_RULES}

Closing:
- Page ${matrixPage} must include core pieces and which outfits they appear in.
- Page ${auditPage} must include 6 wardrobe audit questions.
- Page ${continuationPage} must adapt to whether the client selected/subscribed to ICONIK Edit if known.

${promptContext}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  return normalisePages(raw.pages, act, reportData, libraryContext);
}

export async function generateStylistBlueprintReplacementOutfit(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  reason?: string,
): Promise<BlueprintPage> {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (pageNumber < outfitStart || pageNumber > outfitEnd) {
    throw new Error(`Page ${pageNumber} is not an outfit page`);
  }

  const existingPage = reportData.pages.find(page => page.page_number === pageNumber);
  if (!existingPage) throw new Error(`Missing outfit page ${pageNumber}`);

  const libraryContext = await loadOutfitLibraryContext();
  const culturalMode = getStylistOutfitCulturalMode(submission);
  const replacementContext = buildReplacementOutfitContext(reportData, pageNumber);
  const plan = buildReplacementPlan(reportData, pageNumber, reason, libraryContext, culturalMode);
  if (!plan) throw new Error(`Missing outfit plan for page ${pageNumber}`);
  const pages = await generateHarnessOnlyOutfitPages(reportData, [plan], submission, replacementContext, reason);
  const page = pages.find(candidate => candidate.page_number === pageNumber);
  if (!page) throw new Error('Replacement outfit generation returned no page');
  return page;
}

// Removes fake "with [colour] trim/hardware/detail" clauses from bag/shoe pieces so
// an edited outfit never reintroduces an unrealistic coloured detail on leather.
function sanitiseAccessoryPieceRealism(piece: string, slot: string): string {
  const lower = slot.toLowerCase();
  if (!/bag|tote|clutch|crossbody|handbag|shoe|footwear|sandal|heel|flat|loafer|pump|sneaker|mule|boot/.test(lower)) return piece;
  const cleaned = piece
    .replace(/\b(with|and)\b[^,.]*\b(trim|trims|tag|tags|hardware|piping|stitch(?:ing)?|sole|detail|detailing|accent)\b[^,.]*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim();
  return cleaned || piece;
}

// Trusts the model's edited items (so the targeted change is preserved) and only
// fills missing metadata, cleans bag/shoe realism, and recomputes palette_used.
// Deliberately does NOT run normaliseOutfitPage, which would re-impose the plan.
function sanitiseEditedOutfitPage(raw: AnyRecord, existingPage: BlueprintPage, pageNumber: number): BlueprintPage {
  const rawBlocks = Array.isArray(raw.blocks) && raw.blocks.length ? raw.blocks : existingPage.blocks;
  const nextBlocks: BlueprintBlock[] = rawBlocks.map((blockRaw) => {
    const block = asRecord(blockRaw);
    const items = Array.isArray(block.items)
      ? block.items.map((itemRaw, idx) => {
        const item = asRecord(itemRaw);
        const slot = asString(item.slot) || asString(item.category) || asString(item.label) || `Piece ${idx + 1}`;
        const pieceRaw = asString(item.piece) || asString(item.name) || asString(item.heading) || '';
        const colourHex = asString(item.colour_hex);
        const role = asString(item.palette_role);
        return {
          ...item,
          slot,
          piece: sanitiseAccessoryPieceRealism(pieceRaw, slot) || pieceRaw,
          colour_name: asString(item.colour_name) || undefined,
          colour_hex: isValidHex(colourHex) ? normaliseHex(colourHex) : undefined,
          palette_role: ['lead', 'support', 'ground', 'accent'].includes(role) ? role : undefined,
          structural_notes: asString(item.structural_notes) || asString(item.notes) || asString(item.guidance) || '',
        };
      })
      : undefined;
    return {
      label: asString(block.label) || undefined,
      heading: asString(block.heading) || undefined,
      body: asString(block.body) || undefined,
      reason: asString(block.reason) || undefined,
      items,
    };
  });

  const used = new Map<string, BlueprintColourUse>();
  for (const block of nextBlocks) {
    for (const item of Array.isArray(block.items) ? block.items : []) {
      const record = asRecord(item);
      const hex = asString(record.colour_hex);
      const role = asString(record.palette_role);
      if (isValidHex(hex) && ['lead', 'support', 'ground', 'accent'].includes(role)) {
        const key = normaliseHex(hex);
        if (!used.has(key)) used.set(key, { name: asString(record.colour_name, 'Palette colour'), hex: key, role: role as BlueprintColourUse['role'] });
      }
    }
  }

  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: asString(raw.title, existingPage.title),
    subtitle: asString(raw.subtitle, existingPage.subtitle) || undefined,
    blocks: nextBlocks,
    image_refs: asStringArray(raw.image_refs).length ? asStringArray(raw.image_refs) : existingPage.image_refs,
    palette_used: used.size ? [...used.values()] : existingPage.palette_used,
    library_refs: existingPage.library_refs,
  };
}

export async function generateStylistBlueprintOutfitEdit(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  instruction: string,
): Promise<BlueprintPage> {
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (pageNumber < outfitStart || pageNumber > outfitEnd) {
    throw new Error(`Page ${pageNumber} is not an outfit page`);
  }
  if (!instruction.trim()) throw new Error('An edit instruction is required');

  const existingPage = reportData.pages.find(page => page.page_number === pageNumber);
  if (!existingPage) throw new Error(`Missing outfit page ${pageNumber}`);

  const classificationContext = buildStylistBlueprintOutfitClassificationContext(reportData);

  const prompt = `You are ICONIK's premium women Style Blueprint editor.
Return ONLY valid JSON: {"page":{...}}.

Apply ONLY the requested change to the outfit below. Keep every other piece, colour, fabric, layer, structural note, the title, and the page structure EXACTLY the same. Do not restyle, re-colour, or rephrase anything the instruction does not explicitly ask you to change.

Return the full page object with the same shape, including ALL formula items as objects with {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""} and a page-level "palette_used". Items the instruction does not touch must be returned unchanged.

When the instruction names a colour, keep it realistic, buyable, and aligned with the client's undertone/depth/contrast direction. Do not restrict the edit to a fixed palette list.

${PRACTICAL_COLOUR_APPLICATION_RULES}

--- EDIT INSTRUCTION ---
${instruction}

--- COLOUR AND CLIENT DIRECTION ---
${classificationContext}

--- CURRENT OUTFIT PAGE (edit this, preserve everything else) ---
${stringify(existingPage)}

--- OUTFIT EDIT CONTEXT ---
Preserve admin edits exactly unless they break coverage, eyewear cadence, exact-item formatting, or realistic bag/shoe colour rules. Intake item preferences are not provided to the outfit editor.`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  const page = asRecord(raw.page) || asRecord(Array.isArray(raw.pages) ? raw.pages[0] : null);
  if (!Object.keys(page).length) throw new Error('Outfit edit returned no page');

  return sanitiseEditedOutfitPage(page, existingPage, pageNumber);
}

export async function generateStylistBlueprintReplacementOutfits(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  reason?: string,
): Promise<BlueprintPage[]> {
  const libraryContext = await loadOutfitLibraryContext();
  const culturalMode = getStylistOutfitCulturalMode(submission);
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData, libraryContext, culturalMode);
  return generateHarnessDetailedOutfitPagesInBatches(reportData, outfitDiversityPlan, submission, null, reason);
}

export async function generateStylistBlueprintReplacementPalette(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  reason?: string,
): Promise<StylistBlueprintReportData> {
  const prompt = `Assume you are a Professional Colour Analyst.
You are ICONIK's women Blueprint colour classification engine.
Return ONLY valid JSON. Do not use markdown.

Regenerate only the Colour Palette for the existing report.
Keep the existing body, face, taste, fabric, and client analysis unchanged.
Return exactly 15 base_palette colours and exactly 5 accent_palette colours with accurate hex codes.
The colours must be visibly distinct and useful across real outfits, not minor variations of the same navy/grey/white family.
${STYLIST_COLOUR_CLASSIFICATION_RULES}
The 15 base shades must span colour families, not only neutrals: roughly 7 neutral/ground roles (deep anchor, light neutral, soft neutral, grey/slate, taupe/brown, black/ink, off-white) plus roughly 8 wearable colours the client can genuinely wear (a deep statement colour, a near-face soft colour, a mid colour, a denim/blue, a secondary colour, an earthy/olive, a berry/plum or teal, and one warm or cool pop). Every base shade must flatter the client's undertone and depth.
The accent palette must include five distinct small-dose accent directions.

Required JSON shape:
{
  "colour": {
    "undertone_direction":"","depth":"","contrast":"","palette_name":"",
    "base_palette":[{"name":"","hex":"","usage":"","avoid_for":""}],
    "accent_palette":[{"name":"","hex":"","usage":"","avoid_for":""}],
    "palette":[{"name":"","hex":"","usage":""}],
    "avoid_colours":[""]
  }
}

--- REGENERATION REQUEST ---
${reason || 'Admin requested a stronger, more varied Colour Palette page.'}

--- CURRENT COLOUR CLASSIFICATION ---
${stringify(reportData.classification.colour)}

--- FULL CURRENT CLASSIFICATION CONTEXT ---
${stringify(reportData.classification)}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  const colour = asRecord(raw.colour);
  const fallbackBase = reportData.classification.colour.base_palette.length
    ? reportData.classification.colour.base_palette
    : paletteGuardrailFallbacks(reportData.classification.colour, 'base');
  const fallbackAccent = reportData.classification.colour.accent_palette.length
    ? reportData.classification.colour.accent_palette
    : paletteGuardrailFallbacks(reportData.classification.colour, 'accent');
  const nextClassification = applyColourGuardrails({
    ...reportData.classification,
    colour: {
      undertone_direction: asString(colour.undertone_direction, reportData.classification.colour.undertone_direction),
      depth: asString(colour.depth, reportData.classification.colour.depth),
      contrast: asString(colour.contrast, reportData.classification.colour.contrast),
      palette_name: asString(colour.palette_name, reportData.classification.colour.palette_name),
      base_palette: toPalette(colour.base_palette, fallbackBase).slice(0, BASE_PALETTE_SIZE),
      accent_palette: toPalette(colour.accent_palette, fallbackAccent).slice(0, ACCENT_PALETTE_SIZE),
      palette: toPalette(colour.palette, fallbackBase),
      avoid_colours: asStringArray(colour.avoid_colours).length
        ? asStringArray(colour.avoid_colours)
        : reportData.classification.colour.avoid_colours,
    },
  });

  let nextData: StylistBlueprintReportData = {
    ...reportData,
    generated_at: new Date().toISOString(),
    analysis: {
      ...reportData.analysis,
      chromatic_family: nextClassification.colour.palette_name,
    },
    classification: nextClassification,
  };

  nextData = {
    ...nextData,
    pages: reportData.pages.map(page => normaliseGeneratedPage(page, nextData)),
  };

  return nextData;
}

function normalisePages(
  value: unknown,
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing',
  reportData: StylistBlueprintReportData,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
): BlueprintPage[] {
  const outfitPages = Array.from(
    { length: getStylistBlueprintOutfitCount(reportData) },
    (_, index) => getStylistBlueprintOutfitStartPage(reportData) + index,
  );
  const transformationPage = getStylistBlueprintTransformationPage(reportData);
  const openingPages = transformationPage
    ? [1, getStylistBlueprintSummaryPage(reportData), getStylistBlueprintReadingGuidePage(reportData)]
    : [1, 2, 3];
  const diagnosisPages = [
    getStylistBlueprintBodyGeometryPage(reportData),
    getStylistBlueprintChromaticPage(reportData),
    getStylistBlueprintFaceArchitecturePage(reportData),
    getStylistBlueprintProportionPage(reportData),
    getStylistBlueprintAvoidancePage(reportData),
  ];
  const prescriptionPages = [
    getStylistBlueprintPalettePage(reportData),
    ...(getStylistBlueprintColourDrapePage(reportData) ? [getStylistBlueprintColourDrapePage(reportData) as number] : []),
    getStylistBlueprintRulesStartPage(reportData),
    ...(getStylistBlueprintHairstylePage(reportData) ? [getStylistBlueprintHairstylePage(reportData) as number] : [getStylistBlueprintHairFaceAccessoriesPage(reportData)]),
    ...(getStylistBlueprintHairColourPage(reportData) ? [getStylistBlueprintHairColourPage(reportData) as number] : []),
    ...(getStylistBlueprintEyeframePage(reportData) ? [getStylistBlueprintEyeframePage(reportData) as number] : []),
    ...(getStylistBlueprintMakeupPage(reportData) ? [getStylistBlueprintMakeupPage(reportData) as number] : []),
    getStylistBlueprintFabricPage(reportData),
  ].filter((pageNumber): pageNumber is number => typeof pageNumber === 'number');
  const applicationPages = [
    ...(transformationPage ? [transformationPage] : []),
    getStylistBlueprintOutfitSystemPage(reportData),
    ...outfitPages,
  ];
  const expected: Record<typeof act, number[]> = {
    opening: openingPages,
    diagnosis: diagnosisPages,
    prescription: prescriptionPages,
    application: applicationPages,
    closing: [
      getStylistBlueprintMatrixPage(reportData),
      getStylistBlueprintAuditPage(reportData),
      getStylistBlueprintContinuationPage(reportData),
    ],
  };
  const allowedTypes: BlueprintPageType[] = [
    'cover', 'transformation', 'summary', 'reading_guide', 'diagnosis', 'avoidance', 'palette', 'colour_drape', 'rules',
    'hair', 'eyewear', 'fabric', 'outfit_system', 'outfit', 'matrix', 'audit', 'continuation',
  ];
  const arr = Array.isArray(value) ? value : [];
  const pages = arr.map(item => {
    const page = asRecord(item);
    const pageNumber = Number(page.page_number);
    const aiPageType = allowedTypes.includes(page.page_type as BlueprintPageType) ? page.page_type as BlueprintPageType : 'diagnosis';
    const pageType = canonicalStylistBlueprintPageType(pageNumber, reportData) || aiPageType;
    const blocks = Array.isArray(page.blocks) ? page.blocks.map(block => {
      const record = asRecord(block);
      return {
        label: asString(record.label) || undefined,
        heading: asString(record.heading) || undefined,
        body: asString(record.body) || undefined,
        reason: asString(record.reason) || undefined,
        items: Array.isArray(record.items) ? record.items : undefined,
      };
    }) : [];
    return {
      page_number: pageNumber,
      page_type: pageType,
      title: asString(page.title, `Page ${pageNumber}`),
      subtitle: asString(page.subtitle) || undefined,
      blocks,
      image_refs: asStringArray(page.image_refs),
      palette_used: Array.isArray(page.palette_used)
        ? page.palette_used.map(item => {
          const record = asRecord(item);
          const role = ['lead', 'support', 'ground', 'accent'].includes(asString(record.role))
            ? asString(record.role) as BlueprintColourUse['role']
            : 'support';
          return {
            name: asString(record.name, 'Palette colour'),
            hex: normaliseHex(asString(record.hex, '#8C8C8C')),
            role,
          };
        })
        : undefined,
      library_refs: Array.isArray(page.library_refs)
        ? page.library_refs.map(item => {
          const record = asRecord(item);
          const rawSource = asString(record.source);
          const source: BlueprintLibraryRef['source'] =
            rawSource === 'women' || rawSource === 'curated' || rawSource === 'learned' ? rawSource : 'root';
          return {
            id: asString(record.id, 'library-reference'),
            title: asString(record.title, 'Library reference'),
            source,
            capsule: asString(record.capsule, 'Everyday'),
            adaptation: asString(record.adaptation, 'Adapt this reference to the client profile.'),
          };
        })
        : undefined,
    };
  })
    .filter(page => expected[act].includes(page.page_number))
    .map(page => normaliseGeneratedPage(page, reportData, undefined, libraryContext));

  const missing = expected[act].filter(pageNumber => !pages.some(page => page.page_number === pageNumber));
  if (missing.length) throw new Error(`Blueprint ${act} generation missed page(s): ${missing.join(', ')}`);
  return pages.sort((a, b) => a.page_number - b.page_number);
}

export function mergeBlueprintPages(existing: BlueprintPage[], incoming: BlueprintPage[]) {
  const map = new Map(existing.map(page => [page.page_number, page]));
  for (const page of incoming) map.set(page.page_number, page);
  return [...map.values()].sort((a, b) => a.page_number - b.page_number);
}

export function validateStylistBlueprintReport(
  data: StylistBlueprintReportData,
  options: { culturalMode?: StylistOutfitCulturalMode; validateStaticPageDensity?: boolean } = {},
) {
  void options;
  if (![STYLIST_BLUEPRINT_VERSION, STYLIST_BLUEPRINT_39_VERSION, STYLIST_BLUEPRINT_37_VERSION, STYLIST_BLUEPRINT_36_VERSION, STYLIST_BLUEPRINT_LEGACY_VERSION].includes(data.version)) throw new Error('Invalid Blueprint version');
  const expectedPageCount = getStylistBlueprintPageCount(data);
  const expectedOutfitCount = getStylistBlueprintOutfitCount(data);
  if (data.pages.length !== expectedPageCount) throw new Error(`Expected ${expectedPageCount} pages, found ${data.pages.length}`);
  for (let i = 1; i <= expectedPageCount; i++) {
    if (!data.pages.some(page => page.page_number === i)) throw new Error(`Missing page ${i}`);
  }
  const outfitPages = data.pages.filter(page => page.page_type === 'outfit');
  if (outfitPages.length !== expectedOutfitCount) throw new Error(`Expected ${expectedOutfitCount} outfit pages, found ${outfitPages.length}`);
  if (data.classification.colour.base_palette.length < BASE_PALETTE_SIZE) throw new Error(`Base palette requires ${BASE_PALETTE_SIZE} colours`);
  if (data.classification.colour.accent_palette.length < ACCENT_PALETTE_SIZE) throw new Error(`Accent palette requires ${ACCENT_PALETTE_SIZE} colours`);

  const transformationPageNumber = getStylistBlueprintTransformationPage(data);
  const transformationPage = transformationPageNumber
    ? data.pages.find(page => page.page_number === transformationPageNumber)
    : null;
  if (transformationPageNumber) {
    if (!transformationPage || transformationPage.page_type !== 'transformation') throw new Error('Missing transformation preview page');
    if (transformationPage.blocks.length < 3) throw new Error('Transformation preview page needs 3 looks');
    for (const [index, block] of transformationPage.blocks.slice(0, 3).entries()) {
      const formulaItems = Array.isArray(block.items) ? block.items : [];
      if (formulaItems.length < 4) throw new Error(`Transformation look ${index + 1} needs enough formula items to render`);
      for (const item of formulaItems) {
        const record = asRecord(item);
        if (!asString(record.slot) || !asString(record.piece)) throw new Error(`Transformation look ${index + 1} has an incomplete formula item`);
      }
    }
  }

  for (const page of outfitPages) {
    const formulaItems = page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
    if (formulaItems.length < 4) throw new Error(`Outfit page ${page.page_number} needs enough formula items to render`);
    const formulaText = formulaItems
      .map(item => {
        const record = asRecord(item);
        return `${asString(record.slot)} ${asString(record.piece)}`;
      })
      .join(' ')
      .toLowerCase();
    if (!/(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a clear top/dress/base garment`);
    }
    if (!/(bottom|trouser|pant|jean|skirt|palazzo|legging|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a clear bottom or one-piece garment`);
    }
    if (!/(footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs footwear`);
    }
    if (!/(bag|tote|clutch|crossbody|handbag|jewel|accessor|earring|necklace|bracelet|watch|bangle|scarf|belt)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a bag or accessory`);
    }
    for (const item of formulaItems) {
      const record = asRecord(item);
      if (!asString(record.slot) || !asString(record.piece)) throw new Error(`Outfit page ${page.page_number} has an incomplete formula item`);
    }
  }
}
