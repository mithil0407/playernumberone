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
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAuditPage,
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
} from './stylistBlueprintSchema';
import { WOMEN_OUTFIT_HARNESS_V2 } from './womenOutfitHarnessV2';

export {
  STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT,
  STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT,
  STYLIST_BLUEPRINT_LEGACY_VERSION,
  STYLIST_BLUEPRINT_OUTFIT_COUNT,
  STYLIST_BLUEPRINT_PAGE_COUNT,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAuditPage,
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
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
  Disruptor, or Indian Base + Modern Finishing.
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
- 07 - FINISHING DETAIL: belt, scarf, sunglasses, watch, lip tone, or eyewear
  only if needed.
- 08 - EYEWEAR: only for alternate outfits. One exact frame or sunglass
  recommendation.
- The final outfit should feel like normal clothes arranged with superior
  intelligence, plus one styling decision the client would not have made herself.`;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

// Temporary experiment mode: generate outfits from the deterministic stylist
// decision hierarchy only, without verified outfit-library anchors or feedback
// memory from generated outfits.
const STYLIST_OUTFIT_LIBRARY_ENABLED = false;
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
    neckline_direction: string;
    jewellery_direction: string;
    eyewear_direction: string;
    approved_necklines: string[];
    hair_styles: string[];
    eyewear_shapes: string[];
    earring_shapes: string[];
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
  | 'summary'
  | 'reading_guide'
  | 'diagnosis'
  | 'avoidance'
  | 'palette'
  | 'rules'
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
}

export interface BlueprintColourUse {
  name: string;
  hex: string;
  role: 'lead' | 'support' | 'ground' | 'accent';
}

export interface BlueprintLibraryRef {
  id: string;
  title: string;
  source: 'root' | 'curated' | 'learned';
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
  version: typeof STYLIST_BLUEPRINT_VERSION | typeof STYLIST_BLUEPRINT_LEGACY_VERSION;
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
    return 'Outfit library is disabled for this generation experiment. Do not use verified-library anchors, outfit memory, library_refs, or library_piece_logic. Build each outfit from the harness, using only the basic intake context, coverage, and shoppable realism as guardrails.';
  }
  return getStylistOutfitLibraryPromptFromOutfits(context.outfits);
}

function outfitGenerationSourceRules(context: OutfitLibraryContext) {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED || !context.outfits.length) {
    return `- No outfit library is attached for this run. Do not invent library_refs, source ids, source outfit titles, or library_piece_logic.
- Build the outfit from the harness first: styling intention -> archetype -> hero -> colour role hierarchy -> body geometry -> formula items -> accessory architecture -> score check.
- Use the basic page plan only for page number, capsule, max colours, and eyewear cadence, not as garment or colour authority.
- Variation should come from the harness outcome, fabric, proportion, shoe type, bag shape, and realistic repeated wardrobe anchors, not from random colour novelty.`;
  }
  return `- Each outfit page must adapt the selected library skeleton in library_piece_logic. Treat those slots as the hard starting outfit, not loose inspiration.
- Preserve the selected library skeleton's garment categories, silhouette relationships, and styling logic. Change only colour, coverage, fabric weight, formality, and fit to this client.
- Do not invent a different formula when the selected library skeleton already supplies the slot. Do not borrow slots from another library outfit.
- Each outfit page must include top-level library_refs with the assigned library_reference id, title, source, capsule, and adaptation.
- Do not mention "adapted from", "library reference", source ids, or source outfit titles in visible client-facing body text. Keep that only in top-level library_refs.`;
}

function outfitColourSourceRules(context: OutfitLibraryContext) {
  if (!STYLIST_OUTFIT_LIBRARY_ENABLED || !context.outfits.length) {
    return `- Colour story must be realistic, buyable, and visually balanced from the attached images, coverage, free notes, occasion capsule, and harness rules.
- Use enough main-garment freshness; do not force a fixed palette and do not cycle neutrals mechanically.`;
  }
  return `- Lead colours should follow the selected source outfit's colour logic, adapted to the attached images, coverage, free notes, and retail realism.
- Accent colours must follow the harness intention or source outfit logic. Use them only when intentional, realistic, and never as a whole trouser, sneaker, or large coat.`;
}

export function canonicalStylistBlueprintPageType(
  pageNumber: number,
  dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null,
): BlueprintPageType {
  if (pageNumber === 1) return 'cover';
  if (pageNumber === 2) return 'summary';
  if (pageNumber === 3) return 'reading_guide';
  if ([4, 5, 6, 7].includes(pageNumber)) return 'diagnosis';
  if (pageNumber === 8) return 'avoidance';
  if (pageNumber === 9) return 'palette';
  if ([10, 11].includes(pageNumber)) return 'rules';
  if (pageNumber === 12) return 'fabric';
  if (pageNumber === 13) return 'outfit_system';
  if (pageNumber >= getStylistBlueprintOutfitStartPage() && pageNumber <= getStylistBlueprintOutfitEndPage(dataOrVersion)) return 'outfit';
  if (pageNumber === getStylistBlueprintMatrixPage(dataOrVersion)) return 'matrix';
  if (pageNumber === getStylistBlueprintAuditPage(dataOrVersion)) return 'audit';
  if (pageNumber === getStylistBlueprintContinuationPage(dataOrVersion)) return 'continuation';
  return 'diagnosis';
}

function stringify(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
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

const BASE_PALETTE_SIZE = 15;
const ACCENT_PALETTE_SIZE = 5;

function paletteGuardrailFallbacks(
  colour: Pick<StylistBlueprintClassification['colour'], 'undertone_direction' | 'depth' | 'contrast'>,
  type: 'base' | 'accent',
) {
  const isCool = /cool/i.test(colour.undertone_direction);
  const isDeep = /deep|dark|high/i.test(`${colour.depth} ${colour.contrast}`);

  if (type === 'accent') {
    return isCool
      ? [
        { name: 'Berry Wine', hex: '#7A263F', usage: 'Small bags, lips, nails, evening details.' },
        { name: 'Cobalt Ink', hex: '#254B8F', usage: 'Scarves, trims, or one expressive accessory.' },
        { name: 'Cool Emerald', hex: '#0F6B58', usage: 'Jewellery stones or compact festive accents.' },
        { name: 'Rose Quartz', hex: '#C78A9B', usage: 'Soft near-face accents and delicate accessories.' },
        { name: 'Icy Pewter', hex: '#B8C1C8', usage: 'Metallic accessories and subtle shine.' },
      ]
      : [
        { name: 'Terracotta', hex: '#B55336', usage: 'Small bags, sandals, print details, or trims.' },
        { name: 'Marigold', hex: '#C99822', usage: 'Jewellery, scarves, festive accents, or shoe details.' },
        { name: 'Olive Gold', hex: '#7F7A2E', usage: 'Grounded accent accessories and soft prints.' },
        { name: 'Warm Coral', hex: '#C96A58', usage: 'Near-face warmth in small controlled doses.' },
        { name: 'Antique Bronze', hex: '#8A6A32', usage: 'Hardware, jewellery, belts, and evening details.' },
      ];
  }

  // 15 family-spread base shades: ~7 neutral/ground roles + ~8 wearable colours
  // so outfit lead colours rotate through real colour, not just neutrals.
  if (isCool) {
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

  return [
    { name: isDeep ? 'Espresso' : 'Deep Cocoa', hex: isDeep ? '#33211B' : '#4B2E24', usage: 'Deep anchor for bags, shoes, tailoring, and evening.' },
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
  const base_palette = enforcePaletteDiversity(classification.colour.base_palette, baseFallbacks, BASE_PALETTE_SIZE, baseMinDistance);
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
      const transient = message.includes('503') || message.includes('429') || message.includes('quota') || message.includes('overloaded')
        || message.includes('fetch failed') || message.includes('econnreset') || message.includes('etimedout')
        || message.includes('enotfound') || message.includes('eai_again') || message.includes('terminated')
        || message.includes('socket') || message.includes('network');
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
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
    });
    return JSON.parse(cleanJson(response.text ?? '{}'));
  });
}

async function callGeminiText(prompt: string): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text?.trim() ?? '';
  });
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
  const indiaContext = isIndianStylistIntake(submission)
    ? `
India Market Context:
- Client market is India. Use INR/₹ if any price or budget language is needed; never use USD, dollars, American pricing, US sizing, or US department-store assumptions.
- Assume Indian retail availability, Indian office/social/festive contexts, warm-weather practicality, and realistic Indian tailoring/alteration access.
- Use kurtas, sarees/saris, co-ords, juttis, sandals, dupattas, and Indian festive pieces only where they match the client's stated preferences and lifestyle.
- Keep western/formal preferences intact when the notes ask for western, formals, trousers, tops, midis, or evening wear.
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

function outfitPlanForHarnessPrompt(plan: PlannedOutfit) {
  return {
    outfit_number: plan.outfit_number,
    page_number: plan.page_number,
    capsule: plan.capsule,
    eyewear_required: plan.eyewear_required,
    eyewear_piece: plan.eyewear_required ? plan.eyewear_piece : undefined,
    max_visible_colours: plan.max_visible_colours,
  };
}

function outfitPlansForHarnessPrompt(plans: PlannedOutfit[]) {
  return plans.map(outfitPlanForHarnessPrompt);
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
    "face_shape":"","face_direction":"","hair_direction":"","neckline_direction":"","jewellery_direction":"","eyewear_direction":"",
    "approved_necklines":[""],"hair_styles":[""],"eyewear_shapes":[""],"earring_shapes":[""]
  },
  "taste": {"style_archetype":"","moodboard":"","signature_codes":[""],"anti_codes":[""],"shopping_filters":[""]},
  "fabrics": {"approved":[{"name":"","reason":""}],"avoid":[{"name":"","reason":""}]}
}

Return exactly 15 base_palette colours and exactly 5 accent_palette colours with accurate hex codes.
This is a classy, wearable wardrobe palette, not a colour-theory showcase. Weight it heavily toward neutrals so outfits stay realistic and easy to shop.
The 15 base shades must be roughly 9 neutral/grounding roles (black/ink, charcoal, deep espresso or chocolate, navy, grey/slate, taupe, camel or tan, soft stone, off-white/ivory) plus roughly 6 genuinely wearable, undertone-flattering colours the client would actually buy (e.g. a soft near-face colour, a denim/blue, a muted earthy tone like olive or rust, a wine/berry only if it flatters, a dusty pastel, and one slightly richer feature colour). Keep every colour muted-to-medium in saturation; avoid neon, primary, or hard-to-find shades. Every base shade must flatter the client's undertone and depth.
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
      undertone_direction: asString(colour.undertone_direction, 'neutral-warm'),
      depth: asString(colour.depth, 'medium'),
      contrast: asString(colour.contrast, 'medium'),
      palette_name: asString(colour.palette_name, 'Structured Warm Neutrals'),
      base_palette: toPalette(colour.base_palette, fallbackBase).slice(0, BASE_PALETTE_SIZE),
      accent_palette: toPalette(colour.accent_palette, fallbackBase).slice(0, ACCENT_PALETTE_SIZE),
      palette: toPalette(colour.palette, fallbackBase),
      avoid_colours: asStringArray(colour.avoid_colours),
    },
    face_hair_accessories: {
      face_shape: asString(face.face_shape, 'oval'),
      face_direction: asString(face.face_direction, 'Keep visual weight balanced around cheekbone level.'),
      hair_direction: asString(face.hair_direction, 'Soft structure and controlled movement around the face.'),
      neckline_direction: asString(face.neckline_direction, 'Open necklines that lengthen without widening unnecessarily.'),
      jewellery_direction: asString(face.jewellery_direction, 'Medium-scale geometry with vertical movement.'),
      eyewear_direction: asString(face.eyewear_direction, 'Frames with gentle structure and lifted outer edges.'),
      approved_necklines: asStringArray(face.approved_necklines).slice(0, 6),
      hair_styles: asStringArray(face.hair_styles).slice(0, 4),
      eyewear_shapes: asStringArray(face.eyewear_shapes).slice(0, 4),
      earring_shapes: asStringArray(face.earring_shapes).slice(0, 4),
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
    classification.face_hair_accessories.neckline_direction = 'No cleavage showing.';
    classification.face_hair_accessories.approved_necklines = deterministicCoverage.approvedNecklines.slice(0, 6);
    classification.taste.anti_codes = [
      ...classification.taste.anti_codes,
      'No cleavage showing.',
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
  capsule: 'Professional' | 'Social' | 'Everyday' | 'Occasion';
  formula_direction: string;
  texture_direction: string;
  pattern_direction: string;
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
    'soft overshirt',
    'denim or utility jacket',
    'chunky knit cardigan',
    'longline cardigan',
    'shacket',
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
    'easy top + denim/chino/trouser + clean neutral sneaker or flat',
    'open overshirt/cardigan + simple base + grounded bottom',
    'relaxed dress or co-ord + practical flat shoe + structured tote',
    'knit or tee + non-clingy bottom + small accessory detail',
    'casual column broken by one lighter or darker bridge piece',
  ],
  Occasion: [
    'dress or saree/kurta-led look + refined heel/sandal + compact bag',
    'polished co-ord + jewellery accent + clean neutral grounding',
    'fluid festive layer + simple base + metallic or leather bridge',
    'evening separates with one luminous near-face detail',
    'statement silhouette controlled by restrained palette placement',
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
  'clean solid colour blocking',
  'vertical pinstripe',
  'tonal micro-check',
  'subtle herringbone',
  'fine vertical stripe',
  'tonal jacquard texture',
  'small-scale print',
  'contrast piping',
  'border or panel detail',
  'quiet woven texture',
];

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
- Use the palette as wardrobe logic, not literal paint on every item.
- Accent colours appear ONLY when the styling decision or admin instruction calls for one. Use them as whole realistic pieces: a coloured knit or top, a silk scarf, a leather belt, a jewellery stone/enamel, a garment print, or (for evening) a whole coloured clutch.
- NEVER put an accent (or any) colour on a bag or shoe as a trim, tag, stripe, piping, hardware, stitch, sole, or "detail". Bags and shoes are a single realistic colour from head to toe.
- Bags and shoes use realistic leather/suede colours only: black, espresso, chocolate, cognac, tan, taupe, cream, burgundy, or restrained grey. A vivid/bright colour belongs on a knit, top, scarf, belt, jewellery, or evening clutch — not on an everyday leather bag or shoe.
- Never create coloured leather sneakers. Sneakers are white, off-white, cream, or grey-neutral with no coloured trim.
- Professional and Occasion outfits should normally use loafers, pointed flats, pumps, sandals, juttis, mules, or refined heels instead of sneakers unless the library reference and client lifestyle clearly justify a casual version.
- Do not make a whole trouser, sneaker, or large coat the accent colour.
- Do not rely on scarves. Across the full outfit system, use at most one scarf moment unless the admin specifically asks for more.
- Keep each outfit visually distinct by selecting different complete library references, not by forcing random patterns or colour placements.
- Include texture/pattern only where the styling decision calls for it or where a garment would otherwise be too vague to shop.
- Every outfit must preserve the assigned library_reference piece relationship, then adapt colour, formality, coverage, climate, and fit to this client.
- Avoid same-depth same-family top + bottom pairings. Each outfit needs a clear light/dark or texture/depth bridge.

Shoppable realism rules (every piece must be findable in real stores):
- Each "piece" must read like a specific, real retail garment a woman could search for and buy today. Name the garment type plus its fabric, cut/silhouette, length, and neckline or finish where relevant — e.g. "ivory fitted ribbed-knit crewneck top", "navy mid-rise straight-leg tailored trousers, cropped at the ankle", not "navy top" or "nice trousers".
- Use ordinary, recognisable garments and standard names. No invented silhouettes, runway one-offs, costume pieces, or items that don't exist at normal retail.
- Keep colours realistic and easy to source. No neon, no novelty or oddly-specific shades; a feature colour should be a normal, buyable tone in one or two places, with the rest of the look in neutrals.
- structural_notes must say how the piece sits on the body and why it suits this client (fit, proportion, coverage) in concrete, practical terms — not vague mood words.
- Prefer the exact piece types, fabrics, and styling moves shown in the verified library outfits over anything invented.`.trim();

const HARNESS_FIRST_OUTFIT_CONTRACT = `
Harness-first outfit contract:
- The ICONIK Outfit Recommendation Harness is the primary outfit system. Treat attached images, coverage requirements, free notes, and the basic page plan as the only outfit intake context.
- Do not let the deterministic plan flatten outfits into the same neutral formula. Use it for page number, capsule, coverage, eyewear cadence, and structural safety; the harness chooses the styling intention, archetype, hero, colour movement, and exact item mix.
- Colour has undertone-safe freedom. You may choose any realistic, buyable, undertone-aligned retail colour even if it is not one of the named palette colours. The generated palette is guidance, not a hard whitelist.
- Exact palette colours are not provided to the outfit engine. Choose colours from the attached images, coverage, free notes, occasion, garment realism, and retail availability.
- Manual-admin notes, profile text, and explicit preferences are hard guardrails when provided. Use liked/preferred garments to steer outfit worlds, and reject outfits that conflict with avoid, exposure, fit, footwear, or garment-category boundaries.
- If a preference conflicts with body/coverage safety or garment realism, preserve safety/realism and choose the nearest acceptable alternative.
- For customer-form reports, treat item preferences as soft context unless they express hard coverage, fit, modesty, avoid, or lifestyle needs.
- Keep each outfit to no more than 3 visible colours plus metal direction. At least half of the full outfit set must use colour in a main garment, not only in bag, jewellery, scarf, eyewear, or shoes.
- Each outfit page must include one formula block with exact formula item objects: {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""}.
- Formula items must be exact. Do not use "or", slashes, "optional", alternate colours, alternate shoes, alternate layers, or category-only names.
- Each outfit page must include blocks for Why it works, Role breakdown, Do not buy, and Score summary.
- Each formula must identify one archetype from the harness: Coloured Hero + Quiet Support; Neutral Architecture + Rich Accent; Pattern Hero + Controlled Solids; Texture Hero + Tonal Depth; Shape Hero + Clean Colour; Casual Base + Polished Disruptor; Indian Base + Modern Finishing.
- Shoes and bags must remain realistic leather/suede/occasion-metal colours: black, espresso, chocolate, cognac, tan, taupe, cream, burgundy, restrained grey, or a realistic occasion metallic. No coloured trims, tags, soles, piping, or fake contrast hardware.
- Eyewear follows eyewear_required only: exactly one Eyewear item when true, no eyewear when false.`.trim();

function normalisedLibrarySlots(outfit: ParsedStylistOutfit): Array<{ slot: string; piece: string; source: 'primary' }> {
  const slots = outfit.normalised_slots?.length
    ? outfit.normalised_slots
    : outfit.fields.map(field => ({ slot: field.label, piece: field.value, source_label: field.label, role: 'detail' as const }));

  return slots
    .filter(slot => ['Outfit', 'Dress', 'Top', 'Base Layer', 'Outerwear', 'Bottom', 'Waist Detail', 'Pattern Detail', 'Neckline', 'Footwear', 'Bag', 'Jewellery', 'Accessories', 'Statement Piece'].includes(slot.slot))
    .slice(0, 9)
    .map(slot => ({ slot: slot.slot, piece: slot.piece, source: 'primary' as const }));
}

function libraryPieceLogic(primary: ParsedStylistOutfit): Array<{ slot: string; piece: string; source: 'primary' }> {
  return normalisedLibrarySlots(primary).slice(0, 9);
}

function libraryReferenceForPlan(
  outfit: ParsedStylistOutfit,
  capsule: PlannedOutfit['capsule'],
): BlueprintLibraryRef {
  const pieceSummary = libraryPieceLogic(outfit)
    .slice(0, 5)
    .map(item => `${item.slot}: ${item.piece}`)
    .join('; ');
  return {
    id: outfit.id,
    title: outfit.title,
    source: outfit.source,
    capsule: outfit.capsule,
    adaptation: `Use this as the complete verified skeleton for this ${capsule} outfit, ${outfit.title}${pieceSummary ? ` (${pieceSummary})` : ''}: preserve the garment categories, silhouette relationship, and styling logic; adapt only colour, coverage, fabric weight, formality, and fit to this client's Blueprint. Do not graft slots from another outfit.`,
  };
}

function rankedLibraryPool(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
) {
  const sourceScore = (source: ParsedStylistOutfit['source']) => source === 'root' ? 3 : source === 'curated' ? 2 : 1;
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

function chooseLibraryOutfit(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
  index: number,
  usedSignatures: Map<string, number>,
  blockedSignatures: Set<string>,
  anchorRole?: StylingDecisionPlan['anchor_role'],
): ParsedStylistOutfit | undefined {
  if (!library.length) return undefined;
  const pool = rankedLibraryPool(library, capsule).sort((a, b) => outfitAnchorScore(b, anchorRole) - outfitAnchorScore(a, anchorRole));
  const allowedPool = pool.filter(outfit => !blockedSignatures.has(outfit.signature));
  const effectivePool = allowedPool.length ? allowedPool : pool;
  const bestUnused = effectivePool.find(outfit => (usedSignatures.get(outfit.signature) ?? 0) === 0);
  const selected = bestUnused ?? effectivePool[index % effectivePool.length];
  usedSignatures.set(selected.signature, (usedSignatures.get(selected.signature) ?? 0) + 1);
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
    profile.neckline ? 'No cleavage showing.' : '',
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
  if (profile.neckline && capsule !== 'Everyday') return 'shirt_blouse';
  if (profile.legs) return 'trouser';
  if (/tummy|stomach|midsection|waist|vertical|length|petite|hip|lower body/.test(focus)) return 'trouser';
  if (capsule === 'Professional') return index % 2 === 0 ? 'blazer' : 'trouser';
  if (capsule === 'Social') return index % 3 === 0 ? 'shirt_blouse' : index % 3 === 1 ? 'dress' : 'skirt';
  if (capsule === 'Occasion') return index % 2 === 0 ? 'dress' : 'set';
  return index % 2 === 0 ? 'shirt_blouse' : 'layer';
}

function anchorPieceForRole(role: StylingDecisionPlan['anchor_role'], capsule: PlannedOutfit['capsule']) {
  const professional = capsule === 'Professional';
  const pieces: Record<StylingDecisionPlan['anchor_role'], string> = {
    blazer: professional ? 'structured blazer or tailored vest' : 'soft structured jacket',
    trouser: professional ? 'tailored straight or wide-leg trouser' : 'clean non-clingy trouser',
    shirt_blouse: professional ? 'polished blouse, shirt, or shell' : 'defined top or blouse',
    dress: capsule === 'Occasion' ? 'refined dress or one-piece column' : 'clean dress with controlled fit',
    layer: 'intentional outer layer that creates vertical structure',
    skirt: 'midi skirt with clean fall',
    set: capsule === 'Occasion' ? 'polished co-ord, kurta set, saree, or festive ensemble' : 'co-ord or coordinated set',
  };
  return pieces[role];
}

function colourWorldForCapsule(capsule: PlannedOutfit['capsule'], classification: StylistBlueprintClassification) {
  const undertone = classification.colour.undertone_direction.toLowerCase();
  const cool = /cool|neutral-cool|neutral cool/.test(undertone);
  const base = cool ? 'cool, sharp, calm, and expensive' : 'warm-neutral, grounded, calm, and expensive';
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

function accessoryRulesForCapsule(capsule: PlannedOutfit['capsule']) {
  if (capsule === 'Professional') return 'Finish with pointed flats/loafers/low pumps, structured tote or shoulder bag, small earrings, watch, or a thin belt only if it helps waist definition.';
  if (capsule === 'Occasion') return 'Finish with refined heels/flats/juttis or sandals, compact clutch, and one strong jewellery idea; no competing accessory pile-up.';
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
  libraryOutfit?: ParsedStylistOutfit,
  anchorRoleOverride?: StylingDecisionPlan['anchor_role'],
): StylingDecisionPlan {
  const anchor_role = anchorRoleOverride ?? anchorRoleForOutfit(capsule, index, reportData.classification, profile);
  const anchor_piece = anchorPieceForRole(anchor_role, capsule);
  const outfit_message = outfitMessageForCapsule(capsule, reportData.classification);
  const body_strategy = bodyStrategyFromProfile(reportData.classification, profile);
  const colour_world = colourWorldForCapsule(capsule, reportData.classification);
  const necklineInstruction = profile.neckline
    ? 'Neckline coverage: No cleavage showing.'
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
    accessory_rules: accessoryRulesForCapsule(capsule),
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
  'crew neck',
  'jewel neck',
  'high scoop',
  'bateau or boat neck',
  'modest square neck',
  'collared shirt with safe button stance',
  'mock neck',
  'band or mandarin collar',
  'high wrap neckline',
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
    neckline ? 'neckline/chest exposure' : '',
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
    rules.push('Neckline coverage: No cleavage showing.');
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
  burgundy: '#6E2C39', oxblood: '#5A2733', maroon: '#5C2E33', wine: '#6A2C3E', berry: '#7C3A55', plum: '#5E3A57', aubergine: '#45304A',
  red: '#9E3B36', crimson: '#8E2A37', scarlet: '#B23A2E',
  pink: '#D8A0AE', rose: '#C98B97', blush: '#E3C2C2', fuchsia: '#B83E7E', magenta: '#B0357C', coral: '#D87B66', peach: '#E6BBA0', salmon: '#E0937E',
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
): { name: string; hex: string } | undefined {
  if (!palette.length) return undefined;
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of palette) {
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
  const pickDistinct = (candidates: AnchorColour[], role: BlueprintColourUse['role']): PlannedOutfitColour | undefined => {
    for (const candidate of candidates) {
      const snap = snapColourToPalette(candidate.hex, base);
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
  const accentSnap = saturated ? snapColourToPalette(saturated.hex, accents.length ? accents : base) : undefined;
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
  const hit = candidates.find(colour => !used.has(normaliseHex(colour.hex))) ?? candidates[0] ?? palette[0] ?? paletteFallback(fallbackIndex);
  used.add(normaliseHex(hit.hex));
  return plannedColour(hit, role, fallbackIndex);
}

function restrainedColourStory(
  reportData: StylistBlueprintReportData,
  capsule: PlannedOutfit['capsule'],
  index: number,
  libraryOutfit: ParsedStylistOutfit | undefined,
  decision: StylingDecisionPlan,
): { lead: PlannedOutfitColour; support: PlannedOutfitColour; ground: PlannedOutfitColour; accent?: PlannedOutfitColour } {
  const base = Array.from({ length: BASE_PALETTE_SIZE }, (_, colourIndex) => reportData.classification.colour.base_palette[colourIndex] ?? paletteFallback(colourIndex));
  const accents = Array.from({ length: ACCENT_PALETTE_SIZE }, (_, colourIndex) => reportData.classification.colour.accent_palette[colourIndex] ?? paletteFallback(colourIndex + 5));
  const anchorColours = anchorColourStory(libraryOutfit, base, accents);
  const used = new Set<string>();
  const neutralPool = base.filter(isWardrobeNeutral);
  const professionalPool = base.filter(isProfessionalAnchorNeutral);
  const groundedPool = professionalPool.length ? professionalPool : neutralPool.length ? neutralPool : base;

  const lead = anchorColours.lead && (capsule !== 'Professional' || isWardrobeNeutral(anchorColours.lead))
    ? anchorColours.lead
    : pickDistinctPlannedColour(
      capsule === 'Professional' ? groundedPool : (neutralPool.length ? neutralPool : base),
      'lead',
      used,
      index,
    );
  used.add(normaliseHex(lead.hex));

  const support = anchorColours.support && normaliseHex(anchorColours.support.hex) !== normaliseHex(lead.hex)
    ? anchorColours.support
    : pickDistinctPlannedColour(neutralPool.length ? neutralPool : base, 'support', used, index + 3);
  used.add(normaliseHex(support.hex));

  const ground = anchorColours.ground && !used.has(normaliseHex(anchorColours.ground.hex))
    ? anchorColours.ground
    : pickDistinctPlannedColour(groundedPool, 'ground', used, index + 6);

  const sourceHasAccent = Boolean(anchorColours.accent) && outfitText(libraryOutfit).match(/\b(accent|print|scarf|jewel|clutch|festive|statement|berry|plum|emerald|teal|burgundy|wine|mauve)\b/);
  const accentAllowed = capsule !== 'Professional' && sourceHasAccent && index % 3 === 0;
  const accent = accentAllowed ? anchorColours.accent : undefined;

  if (decision.outfit_message.includes('not loud')) return { lead, support, ground };
  return { lead, support, ground, accent };
}

function outfitHasLibraryLayer(outfit: ParsedStylistOutfit | undefined) {
  return Boolean(outfit?.normalised_slots.some(slot => /outerwear|layer|blazer|jacket|cardigan|vest|coat|overshirt|dupatta/i.test(`${slot.slot} ${slot.piece}`)));
}

function buildOutfitDiversityPlan(
  reportData: StylistBlueprintReportData,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
): PlannedOutfit[] {
  const library = libraryContext.outfits;
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const perCapsule = outfitCount / 4;
  const coverageProfile = coverageProfileFromClassification(reportData.classification);
  const usedLibrarySignatures = new Map<string, number>();

  return Array.from({ length: outfitCount }, (_, index): PlannedOutfit => {
    const capsule = CAPSULE_SEQUENCE[Math.floor(index / perCapsule)] ?? 'Everyday';
    const anchorRole = anchorRoleForOutfit(capsule, index, reportData.classification, coverageProfile);
    const libraryOutfit = chooseLibraryOutfit(library, capsule, index, usedLibrarySignatures, libraryContext.blockedSignatures, anchorRole);
    const formulaDirections = FORMULA_DIRECTIONS[capsule];
    const accentIndex = Math.floor(index / 2) % ACCENT_APPLICATIONS.length;
    const textureCycle = Math.floor(index / TEXTURE_DIRECTIONS.length);
    const stylingDecision = buildStylingDecisionPlan(reportData, capsule, index, coverageProfile, libraryOutfit, anchorRole);
    const colours = restrainedColourStory(reportData, capsule, index, libraryOutfit, stylingDecision);
    const usesAccent = Boolean(colours.accent);
    const layerRequired = coverageProfile.arms || outfitHasLibraryLayer(libraryOutfit);
    const accentMode: PlannedOutfit['accent_mode'] = usesAccent ? 'detail' : undefined;
    const layerPool = LAYER_TYPES_BY_CAPSULE[capsule];
    const plan: PlannedOutfit = {
      outfit_number: index + 1,
      page_number: getStylistBlueprintOutfitStartPage() + index,
      capsule,
      formula_direction: `${stylingDecision.anchor_piece} -> ${formulaDirections[index % formulaDirections.length]}`,
      texture_direction: TEXTURE_DIRECTIONS[(index + textureCycle * 5) % TEXTURE_DIRECTIONS.length],
      pattern_direction: PATTERN_DIRECTIONS[((index * 3) + textureCycle * 5) % PATTERN_DIRECTIONS.length],
      lead_colour: colours.lead,
      support_colour: colours.support,
      ground_colour: colours.ground,
      accent_colour: usesAccent ? colours.accent : undefined,
      accent_application: usesAccent ? ACCENT_APPLICATIONS[accentIndex] : undefined,
      accent_mode: accentMode,
      layer_required: layerRequired,
      layer_type: layerRequired ? layerPool[index % layerPool.length] : undefined,
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
  realismCheck: string;
  doNotBuy: string;
};

const HARNESS_SECTION_MARKERS: Array<{ key: keyof Omit<ParsedHarnessOutfit, 'outfitNumber' | 'context'>; pattern: RegExp }> = [
  { key: 'top', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?1\s*[—-]\s*TOP(?:\s*\/\s*KURTA)?\s*:\s*(?:\*\*)?/im },
  { key: 'bottom', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?2\s*[—-]\s*BOTTOM\s*:\s*(?:\*\*)?/im },
  { key: 'layer', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?3\s*[—-]\s*LAYER(?:\s*\/\s*DUPATTA)?\s*:\s*(?:\*\*)?/im },
  { key: 'footwear', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?4\s*[—-]\s*FOOTWEAR\s*:\s*(?:\*\*)?/im },
  { key: 'bag', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?5\s*[—-]\s*BAG\s*:\s*(?:\*\*)?/im },
  { key: 'jewellery', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?6\s*[—-]\s*JEWELL?ERY\s*:\s*(?:\*\*)?/im },
  { key: 'finishing', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?7\s*[—-]\s*FINISHING DETAIL\s*:\s*(?:\*\*)?/im },
  { key: 'eyewear', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?0?8\s*[—-]\s*EYEWEAR\s*:\s*(?:\*\*)?/im },
  { key: 'whyItWorks', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?WHY IT WORKS\s*:\s*(?:\*\*)?/im },
  { key: 'oneMove', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?THE ONE MOVE\s*:\s*(?:\*\*)?/im },
  { key: 'dnaCheck', pattern: /^\s*(?:[-*]\s*)?(?:\*\*)?DNA CHECK\s*:\s*(?:\*\*)?/im },
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

function parseHarnessOutfitText(text: string): ParsedHarnessOutfit[] {
  const headerPattern = /^\s*(?:\*\*)?OUTFIT\s*\[?(\d+)\]?\s*[—-]\s*(.+?)(?:\*\*)?\s*$/gim;
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
      context: stripHarnessMarkdown(match[2]),
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
      realismCheck: parseHarnessSection(block, 'realismCheck'),
      doNotBuy: parseHarnessSection(block, 'doNotBuy'),
    };
    const missing = [
      ['TOP', parsed.top],
      ['BOTTOM', parsed.bottom],
      ['FOOTWEAR', parsed.footwear],
      ['BAG', parsed.bag],
      ['JEWELLERY', parsed.jewellery],
      ['WHY IT WORKS', parsed.whyItWorks],
      ['THE ONE MOVE', parsed.oneMove],
      ['DNA CHECK', parsed.dnaCheck],
      ['DO NOT BUY', parsed.doNotBuy],
    ].filter(([, value]) => !value);
    if (missing.length) {
      throw new Error(`Harness outfit ${parsed.outfitNumber || index + 1} is missing: ${missing.map(([label]) => label).join(', ')}`);
    }
    return parsed;
  });
}

function capsuleRangesForHarnessPrompt(reportData: StylistBlueprintReportData, plans: PlannedOutfit[]) {
  const lines: string[] = [];
  for (const capsule of CAPSULE_SEQUENCE) {
    const numbers = plans.filter(plan => plan.capsule === capsule).map(plan => plan.outfit_number);
    if (!numbers.length) continue;
    const first = numbers[0];
    const last = numbers[numbers.length - 1];
    lines.push(`${capsule}: outfits ${first}-${last} (${numbers.length} outfits)`);
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
- If notes say the client loves or prefers a garment world, use that world repeatedly enough for the set to feel personal.
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

function buildHarnessOnlyOutfitPrompt(reportData: StylistBlueprintReportData, plans: PlannedOutfit[], submission?: StylistIntakeSubmission | null) {
  return `${WOMEN_OUTFIT_HARNESS_V2}

---

${buildHarnessClientContext(submission, reportData)}

---

Generate exactly ${plans.length} outfit${plans.length === 1 ? '' : 's'} total.

Categories:
${capsuleRangesForHarnessPrompt(reportData, plans)}

Return plain text only using the harness output format.
Do not return JSON.
Do not add any wrapper, introduction, notes, analysis, or explanation outside the outfit blocks.`;
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
  if (parsed.layer && !isNoneHarnessValue(parsed.layer)) {
    items.push(harnessParsedFormulaItem('Layer', parsed.layer, parsed, plan));
  }
  items.push(
    harnessParsedFormulaItem('Footwear', parsed.footwear, parsed, plan),
    harnessParsedFormulaItem('Bag', parsed.bag, parsed, plan),
    harnessParsedFormulaItem('Jewellery', parsed.jewellery, parsed, plan),
  );
  if (parsed.finishing && !isNoneHarnessValue(parsed.finishing)) {
    items.push(harnessParsedFormulaItem('Finishing Detail', parsed.finishing, parsed, plan));
  }
  if (parsed.eyewear && !isNoneHarnessValue(parsed.eyewear)) {
    items.push(harnessParsedFormulaItem('Eyewear', parsed.eyewear, parsed, plan));
  }
  return items;
}

function pageTitleFromHarnessOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit) {
  const context = parsed.context || `${plan.capsule} Look`;
  return `Outfit ${plan.outfit_number} - ${context}`;
}

function pageFromParsedHarnessOutfit(parsed: ParsedHarnessOutfit, plan: PlannedOutfit): BlueprintPage {
  const items = formulaItemsFromParsedHarnessOutfit(parsed, plan);
  const paletteUsed = paletteUsedFromItems(items, plannedPalette(plan));
  const archetype = harnessArchetypeForParsedOutfit(parsed, plan);
  const hero = items[0]?.piece ?? parsed.top;
  const anchor = items.find(item => /bottom|footwear|bag/i.test(`${item.slot} ${item.piece}`))?.piece ?? parsed.bottom;
  const bridge = items.find(item => /bag|footwear|belt|jewel/i.test(`${item.slot} ${item.piece}`))?.piece ?? parsed.bag;
  const realismCheck = parsed.realismCheck ? `REALISM CHECK: ${parsed.realismCheck}. ` : 'Realism: exact items only. ';

  return {
    page_number: plan.page_number,
    page_type: 'outfit',
    title: pageTitleFromHarnessOutfit(parsed, plan),
    subtitle: plan.capsule,
    blocks: [
      {
        label: 'Formula',
        heading: `${plan.capsule} harness formula ${plan.outfit_number}`,
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
        body: `DNA CHECK: ${parsed.dnaCheck}. ${realismCheck}Body Geometry: driven by the harness formula. Undertone Alignment: handled by the harness near-face split. Colour Freshness: visible in the hero and contrast. Visual Hierarchy: ${parsed.oneMove}. Distinctiveness: not correct but forgettable.`,
      },
    ],
    image_refs: [],
    palette_used: paletteUsed,
  };
}

function buildHarnessOutfitSystemPage(outfitPages: BlueprintPage[], reportData: StylistBlueprintReportData): BlueprintPage {
  const perCapsule = getStylistBlueprintOutfitCount(reportData) / CAPSULE_SEQUENCE.length;
  const items = CAPSULE_SEQUENCE.map((capsule, index) => {
    const pages = outfitPages.filter(page => page.subtitle === capsule);
    const first = pages[0]?.page_number ? pages[0].page_number - getStylistBlueprintOutfitStartPage() + 1 : index * perCapsule + 1;
    const last = pages[pages.length - 1]?.page_number ? pages[pages.length - 1].page_number - getStylistBlueprintOutfitStartPage() + 1 : (index + 1) * perCapsule;
    return {
      capsule,
      range: `Outfits ${first}-${last}`,
      outfits: pages.map(page => page.title),
    };
  });
  return {
    page_number: 13,
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
  const outfitPages = plans.map((plan, index) => {
    const outfit = allNumbersMatch ? parsedByNumber.get(plan.outfit_number) : parsed[index];
    if (!outfit) throw new Error(`Harness outfit generation missed outfit ${plan.outfit_number}`);
    return pageFromParsedHarnessOutfit(outfit, plan);
  });

  return [
    buildHarnessOutfitSystemPage(outfitPages, reportData),
    ...outfitPages,
  ];
}

async function generateHarnessOnlyOutfitPages(reportData: StylistBlueprintReportData, plans: PlannedOutfit[], submission?: StylistIntakeSubmission | null) {
  const prompt = buildHarnessOnlyOutfitPrompt(reportData, plans, submission);
  const text = await callGeminiText(prompt);
  return parseHarnessTextToBlueprintPages(text, reportData, plans);
}

type PaletteEntry = { name: string; hex: string; usage?: string };

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

// Builds the plan for a single replacement outfit: always varies the colours away
// from the rejected look, then biases the plan to honour an admin instruction
// (colour/family, warmer/cooler/bolder/muted, layer add/remove, formality, garment).
export function buildReplacementPlan(
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  instruction?: string,
  libraryContext: OutfitLibraryContext = seedOutfitLibraryContext(),
): PlannedOutfit {
  const index = pageNumber - getStylistBlueprintOutfitStartPage();
  const plan: PlannedOutfit = { ...buildOutfitDiversityPlan(reportData, libraryContext)[index] };
  const basePalette = reportData.classification.colour.base_palette as PaletteEntry[];
  const accentPalette = reportData.classification.colour.accent_palette as PaletteEntry[];
  const note = (instruction ?? '').toLowerCase();
  if (note) {
    plan.coverage_profile = mergeCoverageProfiles(plan.coverage_profile, profileFromCoverageText(note));
    plan.layer_required = plan.coverage_profile.arms || plan.layer_required;
  }
  const currentPage = reportData.pages.find(page => page.page_number === pageNumber);
  const currentLibraryIds = new Set((currentPage?.library_refs ?? []).map(ref => ref.id));
  const alternative = chooseAlternativeLibraryOutfit(
    libraryContext.outfits,
    plan.capsule,
    currentLibraryIds,
    libraryContext.blockedSignatures,
    plan.styling_decision.anchor_role,
  );

  if (alternative) {
    const stylingDecision = buildStylingDecisionPlan(reportData, plan.capsule, index, plan.coverage_profile, alternative, plan.styling_decision.anchor_role);
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
    plan.layer_required = plan.coverage_profile.arms || outfitHasLibraryLayer(alternative);
    plan.layer_type = plan.layer_required ? (plan.layer_type ?? LAYER_TYPES_BY_CAPSULE[plan.capsule][index % LAYER_TYPES_BY_CAPSULE[plan.capsule].length]) : undefined;
  } else if (note) {
    plan.styling_decision = buildStylingDecisionPlan(reportData, plan.capsule, index, plan.coverage_profile, undefined, plan.styling_decision.anchor_role);
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
    if (!plan.coverage_profile.arms) {
      plan.layer_required = false;
      plan.layer_type = undefined;
      if (plan.accent_mode === 'layer') plan.accent_mode = plan.accent_colour ? 'top' : undefined;
    }
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
  const colour = data.classification.colour;
  const face = data.classification.face_hair_accessories;
  const coverage = coverageProfileFromClassification(data.classification);

  if (pageNumber === 2) {
    return [
      fallbackBlock('Silhouette', data.analysis.silhouette_profile, body.proportion_directive),
      fallbackBlock('Colour', data.analysis.chromatic_family, `Build most outfits from ${colour.base_palette.slice(0, 3).map(item => item.name).join(', ')}, then use accents only in small details so the palette feels varied but controlled.`),
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
          ? 'No cleavage showing.'
          : `Prioritise ${face.approved_necklines.slice(0, 3).join(', ') || 'open collar, soft V, and high scoop necklines'} to lengthen the face and keep the upper body clean.`,
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
  'forest', 'mint', 'burgundy', 'oxblood', 'maroon', 'wine', 'berry', 'red', 'crimson',
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
  const safeNeckline = plan.styling_decision.neckline_rules.approved[0] ?? 'high scoop';
  let next = piece
    .replace(UNSAFE_NECKLINE_RE, safeNeckline)
    .replace(/\bwrap\b/gi, 'high-wrap')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (STANDALONE_CAMISOLE_RE.test(next)) {
    next = next.replace(STANDALONE_CAMISOLE_RE, `${safeNeckline} sleeved shell`);
  }
  if (!new RegExp(`\\b(${SAFE_NECKLINES.map(escapeRegExp).join('|')}|collared|crew|jewel|mock|mandarin|band collar|boat|bateau|high scoop|modest square|high-wrap)\\b`, 'i').test(next)) {
    next = `${next} with ${safeNeckline} neckline`;
  }
  return next;
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
  return texture;
}

function enrichGarmentTextureAndPattern(piece: string, slot: string, plan: PlannedOutfit) {
  const lowerSlot = slot.toLowerCase();
  if (/shoe|footwear|bag|jewel|accessor|scarf|belt|trim|hardware|hair/.test(lowerSlot)) return piece;

  const lowerPiece = piece.toLowerCase();
  const hasTexture = /(crepe|ribbed|knit|cotton|linen|twill|satin|silk|boucle|tweed|ponte|denim|suede|leather|wool|jacquard|chiffon|georgette|organza)/.test(lowerPiece);
  const hasPattern = /(stripe|pinstripe|check|herringbone|print|jacquard|panel|border|piping|plaid|texture|woven|ribbed|tweed|boucle)/.test(lowerPiece);

  const texture = hasTexture ? '' : ` in ${textureForSlot(slot, plan)}`;

  const pattern = hasPattern ? '' : '';

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
  const noAccessoryTrim = sanitiseAccessoryPieceRealism(exactPiece || piece, slot);
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
  if (slotNeedsNecklineSafety(slot) && plan.coverage_profile.neckline) return 'No cleavage showing.';
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
  const colour = colourForSlot(slot, plan);
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
  return plan.outfit_number % 2 === 0 ? 'Indian Base + Modern Finishing' : 'Coloured Hero + Quiet Support';
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
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (page.page_number >= outfitStart && page.page_number <= outfitEnd) {
    const plan = planOverride ?? buildOutfitDiversityPlan(reportData, libraryContext)[page.page_number - outfitStart];
    return normaliseOutfitPage(page, plan);
  }
  return normaliseUsefulBlocks(page, reportData);
}

export async function generateStylistBlueprintPages(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing',
): Promise<BlueprintPage[]> {
  const libraryContext = await loadOutfitLibraryContext();
  const stylistOutfitLibrary = outfitLibraryPromptForContext(libraryContext);
  const pageCount = getStylistBlueprintPageCount(reportData);
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(reportData);
  const matrixPage = getStylistBlueprintMatrixPage(reportData);
  const auditPage = getStylistBlueprintAuditPage(reportData);
  const continuationPage = getStylistBlueprintContinuationPage(reportData);
  const capsuleRanges = getStylistBlueprintCapsulePageRanges(reportData);
  const outfitsPerCapsule = outfitCount / 4;
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData, libraryContext);
  if (act === 'application') {
    return generateHarnessOnlyOutfitPages(reportData, outfitDiversityPlan, submission);
  }
  const classificationContext = stringify(reportData.classification);
  const intakeContext = buildStylistBlueprintIntakeDigest(submission);
  const ranges = {
    opening: 'pages 1-3',
    diagnosis: 'pages 4-8',
    prescription: 'pages 9-12',
    application: `pages 13-${outfitEndPage}`,
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
2 Blueprint Summary dossier
3 Reading This Blueprint
4 Geometric Silhouette Profile
5 Chromatic Harmony Mapping
6 Facial Architecture Analysis
7 Proportional Axes
8 What to Avoid And Why
9 Colour Palette
10 Silhouette Rules
11 Hair, Face, Accessories
12 Fabric and Texture Direction
13 Outfit System
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
- Page 13 must introduce 4 capsules and list their ${outfitsPerCapsule} outfit names.
- Pages 14-${outfitEndPage} must be one outfit per page.
- Use the harness-first outfit contract below. The basic page plan is scaffolding only, not the source of colour blocking or repeated formulas.
- Each outfit plan includes only page number, capsule, max colours, and eyewear cadence.
${outfitGenerationSourceRules(libraryContext)}
- Neckline rules are hard coverage rules. If neckline_rules.coverage_required=true, say only: No cleavage showing.
${outfitColourSourceRules(libraryContext)}
- Each outfit plan includes eyewear_required. If true, include exactly one Eyewear formula item with the provided eyewear_piece. If false, do not mention eyewear.
- Shared pieces should repeat across capsules where useful.

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
  void reason;
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (pageNumber < outfitStart || pageNumber > outfitEnd) {
    throw new Error(`Page ${pageNumber} is not an outfit page`);
  }

  const existingPage = reportData.pages.find(page => page.page_number === pageNumber);
  if (!existingPage) throw new Error(`Missing outfit page ${pageNumber}`);

  const libraryContext = await loadOutfitLibraryContext();
  const plan = buildOutfitDiversityPlan(reportData, libraryContext)[pageNumber - outfitStart];
  if (!plan) throw new Error(`Missing outfit plan for page ${pageNumber}`);
  const pages = await generateHarnessOnlyOutfitPages(reportData, [plan], submission);
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
  const outfitStart = getStylistBlueprintOutfitStartPage();
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
  void reason;
  const libraryContext = await loadOutfitLibraryContext();
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData, libraryContext);
  return generateHarnessOnlyOutfitPages(reportData, outfitDiversityPlan, submission);
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
    (_, index) => getStylistBlueprintOutfitStartPage() + index,
  );
  const expected: Record<typeof act, number[]> = {
    opening: [1, 2, 3],
    diagnosis: [4, 5, 6, 7, 8],
    prescription: [9, 10, 11, 12],
    application: [13, ...outfitPages],
    closing: [
      getStylistBlueprintMatrixPage(reportData),
      getStylistBlueprintAuditPage(reportData),
      getStylistBlueprintContinuationPage(reportData),
    ],
  };
  const allowedTypes: BlueprintPageType[] = [
    'cover', 'summary', 'reading_guide', 'diagnosis', 'avoidance', 'palette', 'rules',
    'fabric', 'outfit_system', 'outfit', 'matrix', 'audit', 'continuation',
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
            rawSource === 'curated' || rawSource === 'learned' ? rawSource : 'root';
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

function clientFacingOutfitText(page: BlueprintPage) {
  return page.blocks
    .flatMap(block => [
      block.label,
      block.heading,
      block.body,
      block.reason,
      ...(Array.isArray(block.items)
        ? block.items.flatMap(item => {
          const record = asRecord(item);
          return [
            asString(record.slot),
            asString(record.piece),
            asString(record.structural_notes),
            asString(record.notes),
            asString(record.guidance),
          ];
        })
        : []),
    ])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasUnsafeNecklineLanguage(text: string) {
  return UNSAFE_NECKLINE_RE.test(text) ||
    /\b(cleavage|exposed chest|low neckline|low neck|plunge|plunging|deep v|keyhole|strapless|off shoulder|one shoulder|spaghetti strap|strappy camisole|standalone camisole|standalone tank)\b/i.test(text);
}

function isMainGarmentFormulaItem(item: unknown) {
  const record = asRecord(item);
  return /(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble|outer|layer|blazer|jacket|cardigan|vest|coat|dupatta|bottom|trouser|pant|jean|skirt|palazzo|legging)/i
    .test(`${asString(record.slot)} ${asString(record.piece)}`);
}

function formulaItemColour(item: unknown): PlannedOutfitColour | null {
  const record = asRecord(item);
  const hex = asString(record.colour_hex);
  const role = asString(record.palette_role);
  if (!isValidHex(hex) || !validPaletteRole(role)) return null;
  return {
    name: asString(record.colour_name, 'Palette colour'),
    hex: normaliseHex(hex),
    role,
  };
}

function formulaItemHasColourFreshness(item: unknown) {
  const colour = formulaItemColour(item);
  return Boolean(colour && isMainGarmentFormulaItem(item) && !isWardrobeNeutral(colour));
}

function visibleColourKeysForOutfit(items: unknown[]) {
  const keys = new Set<string>();
  for (const item of items) {
    const record = asRecord(item);
    if (/jewel|jewellery|jewelry|earring|necklace|bracelet|bangle/i.test(asString(record.slot))) continue;
    const colour = formulaItemColour(item);
    if (colour) keys.add(normaliseHex(colour.hex));
  }
  return keys;
}

function dominantFormulaSignature(items: unknown[]) {
  const slots = new Set<string>();
  for (const item of items) {
    const record = asRecord(item);
    const text = `${asString(record.slot)} ${asString(record.piece)}`.toLowerCase();
    if (/(dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)/.test(text)) slots.add('one-piece');
    else if (/(top|blouse|shirt|tee|t-shirt|knit|camisole|tank)/.test(text)) slots.add('top');
    else if (/(bottom|trouser|pant|jean|skirt|palazzo|legging)/.test(text)) slots.add('bottom');
    else if (/(outer|layer|blazer|jacket|cardigan|vest|coat|dupatta)/.test(text)) slots.add('layer');
    else if (/(footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule)/.test(text)) slots.add('footwear');
    else if (/(bag|tote|clutch|crossbody|handbag)/.test(text)) slots.add('bag');
  }
  return [...slots].sort().join('+') || 'unknown';
}

function hasHarnessBlock(page: BlueprintPage, pattern: RegExp) {
  return page.blocks.some(block => pattern.test(`${block.label ?? ''} ${block.heading ?? ''} ${block.body ?? ''} ${block.reason ?? ''}`));
}

export function validateStylistBlueprintReport(data: StylistBlueprintReportData) {
  if (![STYLIST_BLUEPRINT_VERSION, STYLIST_BLUEPRINT_LEGACY_VERSION].includes(data.version)) throw new Error('Invalid Blueprint version');
  const expectedPageCount = getStylistBlueprintPageCount(data);
  const expectedOutfitCount = getStylistBlueprintOutfitCount(data);
  if (data.pages.length !== expectedPageCount) throw new Error(`Expected ${expectedPageCount} pages, found ${data.pages.length}`);
  for (let i = 1; i <= expectedPageCount; i++) {
    if (!data.pages.some(page => page.page_number === i)) throw new Error(`Missing page ${i}`);
  }
  const outfitPages = data.pages.filter(page => page.page_type === 'outfit');
  if (outfitPages.length !== expectedOutfitCount) throw new Error(`Expected ${expectedOutfitCount} outfit pages, found ${outfitPages.length}`);
  for (const page of outfitPages) {
    const hasReason = page.blocks.some(block => block.reason || /why|because|works/i.test(block.heading ?? ''));
    if (!hasReason) throw new Error(`Outfit page ${page.page_number} is missing reasoning`);
  }
  if (data.classification.colour.base_palette.length < BASE_PALETTE_SIZE) throw new Error(`Base palette requires ${BASE_PALETTE_SIZE} colours`);
  if (data.classification.colour.accent_palette.length < ACCENT_PALETTE_SIZE) throw new Error(`Accent palette requires ${ACCENT_PALETTE_SIZE} colours`);

  const importantPages = new Map([
    [3, 3],
    [4, 3],
    [6, 3],
    [7, 3],
  ]);
  for (const [pageNumber, minimumUsefulBlocks] of importantPages) {
    const page = data.pages.find(item => item.page_number === pageNumber);
    if (!page) throw new Error(`Missing page ${pageNumber}`);
    const usefulBlocks = page.blocks.filter(block => !weakText(block.body || block.reason));
    if (usefulBlocks.length < minimumUsefulBlocks) {
      throw new Error(`Page ${pageNumber} needs at least ${minimumUsefulBlocks} useful content blocks`);
    }
  }

  if (data.version !== STYLIST_BLUEPRINT_VERSION) return;

  const leadCounts = new Map<string, number>();
  const formulaCounts = new Map<string, number>();
  const coverageProfile = coverageProfileFromClassification(data.classification);
  let mainGarmentColourCount = 0;

  for (const page of outfitPages) {
    if (STYLIST_OUTFIT_LIBRARY_ENABLED && !page.library_refs?.length) throw new Error(`Outfit page ${page.page_number} is missing a library reference`);
    if (/library reference|adapted from|source outfit|root-\d|curated-\d/.test(clientFacingOutfitText(page))) {
      throw new Error(`Outfit page ${page.page_number} exposes internal library wording`);
    }

    const paletteUsed = page.palette_used ?? [];
    if (paletteUsed.length > 3) throw new Error(`Outfit page ${page.page_number} uses too many visible colours`);
    const lead = paletteUsed.find(colour => colour.role === 'lead');
    if (!lead || !isValidHex(lead.hex)) throw new Error(`Outfit page ${page.page_number} is missing a valid lead colour`);
    if (!hasHarnessBlock(page, /archetype/i) || !HARNESS_ARCHETYPES.some(archetype => clientFacingOutfitText(page).includes(archetype.toLowerCase()))) {
      throw new Error(`Outfit page ${page.page_number} is missing a clear harness archetype`);
    }
    if (!hasHarnessBlock(page, /hero/i)) throw new Error(`Outfit page ${page.page_number} is missing a clear hero`);
    if (!hasHarnessBlock(page, /role|face-lift|anchor|lengthener|freshness|bridge|finish/i)) throw new Error(`Outfit page ${page.page_number} is missing role breakdown`);
    if (!hasHarnessBlock(page, /do not buy|wrong version|breaks it|avoid buying/i)) throw new Error(`Outfit page ${page.page_number} is missing do-not-buy guidance`);
    if (!hasHarnessBlock(page, /score|body geometry|undertone alignment|visual hierarchy|realism/i)) throw new Error(`Outfit page ${page.page_number} is missing score summary`);
    leadCounts.set(normaliseHex(lead.hex), (leadCounts.get(normaliseHex(lead.hex)) ?? 0) + 1);
    const formulaItems = page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
    if (formulaItems.length < 5) throw new Error(`Outfit page ${page.page_number} needs at least 5 formula items`);
    const visibleColourCount = visibleColourKeysForOutfit(formulaItems).size;
    if (visibleColourCount > 3) throw new Error(`Outfit page ${page.page_number} uses ${visibleColourCount} visible colours`);
    if (formulaItems.some(formulaItemHasColourFreshness)) mainGarmentColourCount++;
    const formulaSignature = dominantFormulaSignature(formulaItems);
    formulaCounts.set(formulaSignature, (formulaCounts.get(formulaSignature) ?? 0) + 1);
    const outfitNumber = page.page_number - getStylistBlueprintOutfitStartPage() + 1;
    const eyewearItems = formulaItems.filter(isEyewearFormulaItem);
    if (eyewearItems.length > 1) {
      throw new Error(`Outfit ${outfitNumber} must not include more than one eyewear formula item`);
    }
    for (const item of eyewearItems) {
      const record = asRecord(item);
      const text = asString(record.piece).toLowerCase();
      if (/\boptional\b|\band\/or\b|\/|\bor\b/.test(text)) {
        throw new Error(`Outfit ${outfitNumber} eyewear must be one exact item without optional language or alternatives`);
      }
    }
    const libraryMappedCount = formulaItems.filter(item => {
      const record = asRecord(item);
      return asString(record.library_source) === 'primary';
    }).length;
    if (STYLIST_OUTFIT_LIBRARY_ENABLED && libraryMappedCount < 4) {
      throw new Error(`Outfit page ${page.page_number} needs at least 4 formula items mapped to the outfit library`);
    }
    const formulaText = formulaItems
      .map(item => {
        const record = asRecord(item);
        return `${asString(record.slot)} ${asString(record.piece)}`;
      })
      .join(' ')
      .toLowerCase();
    if (coverageProfile.neckline && hasUnsafeNecklineLanguage(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} violates neckline/chest coverage`);
    }
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
      if (exactItemHasAlternativeLanguage(asString(record.piece))) throw new Error(`Outfit page ${page.page_number} has a non-exact formula item`);
      if (!asString(record.colour_name) || !isValidHex(asString(record.colour_hex))) throw new Error(`Outfit page ${page.page_number} has formula item missing colour metadata`);
      if (!['lead', 'support', 'ground', 'accent'].includes(asString(record.palette_role))) throw new Error(`Outfit page ${page.page_number} has formula item missing palette role`);
      if (weakText(asString(record.structural_notes))) throw new Error(`Outfit page ${page.page_number} has formula item missing structural notes`);
      if (/bag|tote|clutch|crossbody|handbag|shoe|footwear|sandal|heel|flat|loafer|pump|sneaker|mule|boot/i.test(`${asString(record.slot)} ${asString(record.piece)}`)) {
        const colour = {
          name: asString(record.colour_name),
          hex: normaliseHex(asString(record.colour_hex)),
          role: asString(record.palette_role) as BlueprintColourUse['role'],
        };
        const isOccasionClutch = /clutch/i.test(`${asString(record.slot)} ${asString(record.piece)}`) && /occasion|evening|social/i.test(page.subtitle ?? '');
        if (!isOccasionClutch && !isRealisticLeatherColour(colour)) {
          throw new Error(`Outfit page ${page.page_number} uses an unrealistic bag/shoe colour`);
        }
      }
    }
  }

  if (mainGarmentColourCount < Math.ceil(expectedOutfitCount / 2)) {
    throw new Error(`Expected at least ${Math.ceil(expectedOutfitCount / 2)} outfits with colour in a main garment, found ${mainGarmentColourCount}`);
  }
  for (const [signature, count] of formulaCounts) {
    if (count > 5) throw new Error(`Dominant outfit formula ${signature} repeats too often, found ${count}`);
  }

  // Keep one colour from dominating, but do not force palette coverage. A real
  // stylist can repeat wearable anchors when the verified outfit bank calls for it.
  for (const [hex, count] of leadCounts) {
    if (count > 6) throw new Error(`Base colour ${hex} is overused as a lead colour, found ${count}`);
  }
}
