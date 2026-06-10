import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import {
  getParsedStylistOutfitLibrary,
  getStylistOutfitLibraryPrompt,
  type ParsedStylistOutfit,
} from './stylistOutfitLibraryParser';
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

const WOMEN_OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/womenOutfitRecommendationSkill.md'),
  'utf-8',
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export interface StylistIntakeSubmission {
  id: string;
  order_id?: string | null;
  lead_id?: string | null;
  customer_email: string;
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
  source: 'root' | 'curated';
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
      const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const transient = message.includes('503') || message.includes('429') || message.includes('quota') || message.includes('overloaded');
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
  return `Client:
Name: ${submission.full_name || submission.customer_email.split('@')[0]}
Email: ${submission.customer_email}
Phone: ${submission.customer_phone || ''}
Country: ${submission.country || ''}
Age Range: ${submission.age_range || ''}
Language: ${submission.primary_language || ''}

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
Image URL: ${submission.one_outfit_image_url || ''}`;
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
  const stylistOutfitLibrary = getStylistOutfitLibraryPrompt();
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
The 15 base shades must span colour families, not only neutrals: roughly 7 neutral/ground roles (deep anchor, light neutral, soft neutral, grey/slate, taupe or brown, black/ink, off-white) plus roughly 8 wearable colours the client can genuinely wear (a deep statement colour, a near-face soft colour, a mid colour, a denim/blue, a secondary colour, an earthy/olive, a berry/plum or teal, and one warm or cool pop). Every base shade must flatter the client's undertone and depth.
The 5 accent colours are smaller-dose colours used for layers, knit tops, and details.

--- WOMEN OUTFIT LOGIC ---
${WOMEN_OUTFIT_SKILL}

--- STYLIST OUTFIT LIBRARY ---
Use this library as adaptable inspiration only. Do not copy a library outfit exactly. Borrow silhouette logic, capsule logic, styling rationale, or piece relationships only when they fit the client's body geometry, colour direction, coverage needs, lifestyle, climate, budget, and taste.
${stylistOutfitLibrary}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  const colour = asRecord(raw.colour);
  const face = asRecord(raw.face_hair_accessories);
  const classification: StylistBlueprintClassification = {
    client: {
      name: asString(asRecord(raw.client).name, submission.full_name || submission.customer_email.split('@')[0]),
      email: submission.customer_email,
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
    classification.face_hair_accessories.approved_necklines = ['Deep V', 'Soft scoop', 'Asymmetric one-shoulder', 'Open square', 'Soft boat', 'Keyhole'];
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
      display_name: classification.client.name || submission.full_name || submission.customer_email.split('@')[0],
      email: submission.customer_email,
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
  max_visible_colours: 3;
  library_reference?: BlueprintLibraryRef;
  library_piece_logic?: Array<{ slot: string; piece: string }>;
};

const CAPSULE_SEQUENCE: PlannedOutfit['capsule'][] = ['Professional', 'Social', 'Everyday', 'Occasion'];
const LAYERED_OUTFIT_INDEXES = new Set([0, 1, 3, 5, 7, 9, 12, 14, 16, 18]);
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
    slot: 'Pattern Detail',
    piece: 'pinstripe, micro-print, or border detail',
    guidance: 'Use the accent as part of a print or stripe, not as a flat block on the whole outfit.',
  },
  {
    slot: 'Bag',
    piece: 'compact clutch or small structured bag',
    guidance: 'Let the accent become one polished object rather than many scattered details.',
  },
  {
    slot: 'Footwear Detail',
    piece: 'heel, piping, stitch, or strap detail',
    guidance: 'Use the accent on a realistic shoe detail while the shoe body stays neutral leather or suede.',
  },
  {
    slot: 'Jewellery',
    piece: 'stone, enamel, or metal jewellery detail',
    guidance: 'Use the accent through jewellery that reads intentional and wearable.',
  },
  {
    slot: 'Waist Detail',
    piece: 'slim belt, buckle, or waist piping',
    guidance: 'Use the accent as a narrow line that shapes the outfit without dominating it.',
  },
  {
    slot: 'Print Detail',
    piece: 'small floral, geometric, or abstract print',
    guidance: 'Use the accent inside a print with the base palette carrying the rest of the outfit.',
  },
  {
    slot: 'Hair or Face Detail',
    piece: 'hair clip, eyewear tint, or near-face enamel detail',
    guidance: 'Keep this close to the face and small enough to feel premium.',
  },
  {
    slot: 'Scarf',
    piece: 'narrow silk scarf',
    guidance: 'Use this only as the single scarf moment in the full wardrobe, not as a repeated styling crutch.',
  },
];

const PRACTICAL_COLOUR_APPLICATION_RULES = `
Practical colour application rules:
- Use the palette as wardrobe logic, not literal paint on every item.
- Never create coloured leather sneakers. Sneakers must be white, off-white, cream, or grey-neutral; palette colours may appear only as tiny trim, stripe, sole, or stitching details.
- Professional and Occasion outfits should normally use loafers, pointed flats, pumps, sandals, juttis, mules, or refined heels instead of sneakers unless the library reference and client lifestyle clearly justify a casual version.
- Leather shoes and bags should use realistic leather/suede families: black, espresso, chocolate, cognac, tan, taupe, cream, burgundy, or restrained grey. Do not invent slate leather sneakers, emerald leather sneakers, blue leather sneakers, or similar unrealistic footwear.
- Accents can be used with more confidence, but realistically: accent inner top, camisole, knit shell, small print, pinstripe, border detail, compact bag, heel/strap trim, belt, enamel, stone, or jewellery. Do not make a whole trouser, sneaker, or large coat the accent colour.
- Do not rely on scarves. Across the full outfit system, use at most one scarf moment unless the admin specifically asks for more.
- Keep each outfit visually distinct: vary formula type, top/bottom relationship, texture, pattern, shoe type, bag shape, jewellery idea, and where the palette colour appears.
- Include real wardrobe texture/pattern variety where appropriate: vertical pinstripes, fine stripes, tweed/boucle, ribbed knit, twill, crepe, satin-back crepe, denim, herringbone, micro-check, border detail, piping, or tonal jacquard.
- Every outfit must visibly borrow the assigned library_reference piece relationship, then adapt colour, formality, coverage, climate, and fit to this client.
- Avoid same-depth same-family top + bottom pairings. Each outfit needs a clear light/dark or texture/depth bridge.
`.trim();

function libraryPieceLogic(outfit: ParsedStylistOutfit): Array<{ slot: string; piece: string }> {
  return outfit.fields
    .filter(field => ['Outfit', 'Dress', 'Top', 'Base Layer', 'Outerwear', 'Bottom', 'Waist Detail', 'Footwear', 'Bag', 'Jewellery', 'Accessories', 'Statement Piece'].includes(field.label))
    .slice(0, 8)
    .map(field => ({ slot: field.label, piece: field.value }));
}

function libraryReferenceForPlan(outfit: ParsedStylistOutfit, capsule: PlannedOutfit['capsule']): BlueprintLibraryRef {
  const pieceSummary = libraryPieceLogic(outfit)
    .slice(0, 5)
    .map(item => `${item.slot}: ${item.piece}`)
    .join('; ');
  return {
    id: outfit.id,
    title: outfit.title,
    source: outfit.source,
    capsule: outfit.capsule,
    adaptation: `Borrow this ${capsule} piece relationship from ${outfit.title}${pieceSummary ? ` (${pieceSummary})` : ''}, then adapt colour, coverage, fabric weight, formality, and fit to this client's Blueprint.`,
  };
}

function chooseLibraryOutfit(
  library: ParsedStylistOutfit[],
  capsule: PlannedOutfit['capsule'],
  index: number,
): ParsedStylistOutfit | undefined {
  if (!library.length) return undefined;
  const capsuleMatches = library.filter((outfit) => outfit.capsule === capsule);
  const pool = capsuleMatches.length ? capsuleMatches : library;
  return pool[index % pool.length];
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

export function coverageRequiresCover(classification: StylistBlueprintClassification): boolean {
  const text = [
    ...(classification.body.coverage_rules ?? []),
    ...(classification.body.silhouette_rules ?? []),
  ].join(' ').toLowerCase();
  return /\b(arm|arms|shoulder|shoulders|sleeve|sleeves|elbow|elbows)\b/.test(text);
}

function buildOutfitDiversityPlan(reportData: StylistBlueprintReportData): PlannedOutfit[] {
  const base = Array.from({ length: BASE_PALETTE_SIZE }, (_, index) => reportData.classification.colour.base_palette[index] ?? paletteFallback(index));
  const accents = Array.from({ length: ACCENT_PALETTE_SIZE }, (_, index) => reportData.classification.colour.accent_palette[index] ?? paletteFallback(index + 5));
  const library = getParsedStylistOutfitLibrary();
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const perCapsule = outfitCount / 4;
  const needsCover = coverageRequiresCover(reportData.classification);

  return Array.from({ length: outfitCount }, (_, index): PlannedOutfit => {
    const usesAccent = index % 2 === 0;
    const layerRequired = LAYERED_OUTFIT_INDEXES.has(index) || needsCover;
    const capsule = CAPSULE_SEQUENCE[Math.floor(index / perCapsule)] ?? 'Everyday';
    const libraryOutfit = chooseLibraryOutfit(library, capsule, index);
    const formulaDirections = FORMULA_DIRECTIONS[capsule];
    const accentIndex = Math.floor(index / 2) % ACCENT_APPLICATIONS.length;
    // Colour roles cycle through the base palette; on the second pass (outfits
    // BASE_PALETTE_SIZE apart) shift the support/ground/accent offsets so colour
    // "twins" diverge while leads still repeat at most twice.
    const cycle = Math.floor(index / base.length);
    const supportOffset = cycle === 0 ? 3 : 5;
    const groundOffset = cycle === 0 ? 6 : 8;
    const accentSlot = Math.floor(index / 2);
    // Texture/pattern get their own cycle (keyed on the 10-long lists) so outfits
    // a palette-length apart still differ in fabric and pattern.
    const textureCycle = Math.floor(index / TEXTURE_DIRECTIONS.length);
    // The accent shows up as a real piece: the layer when the outfit has one, an
    // occasional coloured top otherwise, else a small detail.
    const accentMode: PlannedOutfit['accent_mode'] = usesAccent
      ? (layerRequired ? 'layer' : (accentSlot % 2 === 0 ? 'top' : 'detail'))
      : undefined;
    const layerPool = LAYER_TYPES_BY_CAPSULE[capsule];
    return {
      outfit_number: index + 1,
      page_number: getStylistBlueprintOutfitStartPage() + index,
      capsule,
      formula_direction: formulaDirections[index % formulaDirections.length],
      texture_direction: TEXTURE_DIRECTIONS[(index + textureCycle * 5) % TEXTURE_DIRECTIONS.length],
      pattern_direction: PATTERN_DIRECTIONS[((index * 3) + textureCycle * 5) % PATTERN_DIRECTIONS.length],
      lead_colour: plannedColour(base[index % base.length], 'lead', index),
      support_colour: plannedColour(base[(index + supportOffset) % base.length], 'support', index + supportOffset),
      ground_colour: usesAccent ? undefined : plannedColour(base[(index + groundOffset) % base.length], 'ground', index + groundOffset),
      accent_colour: usesAccent ? plannedColour(accents[(accentSlot + cycle) % accents.length], 'accent', index + 10) : undefined,
      accent_application: usesAccent ? ACCENT_APPLICATIONS[accentIndex] : undefined,
      accent_mode: accentMode,
      layer_required: layerRequired,
      layer_type: layerRequired ? layerPool[index % layerPool.length] : undefined,
      coverage_requires_cover: needsCover,
      max_visible_colours: 3,
      library_reference: libraryOutfit ? libraryReferenceForPlan(libraryOutfit, capsule) : undefined,
      library_piece_logic: libraryOutfit ? libraryPieceLogic(libraryOutfit) : undefined,
    };
  });
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
): PlannedOutfit {
  const index = pageNumber - getStylistBlueprintOutfitStartPage();
  const plan: PlannedOutfit = { ...buildOutfitDiversityPlan(reportData)[index] };
  const basePalette = reportData.classification.colour.base_palette as PaletteEntry[];
  const accentPalette = reportData.classification.colour.accent_palette as PaletteEntry[];
  const note = (instruction ?? '').toLowerCase();

  // --- 1. Always vary: shift colour roles away from the rejected outfit. ---
  const currentPage = reportData.pages.find(page => page.page_number === pageNumber);
  const usedHexes = new Set((currentPage?.palette_used ?? []).map(colour => normaliseHex(colour.hex)));
  const chosen = new Set<string>();
  const indexOfColour = (palette: PaletteEntry[], colour?: { hex?: string }) => {
    const hex = normaliseHex(colour?.hex ?? '');
    const found = palette.findIndex(item => normaliseHex(item.hex) === hex);
    return found >= 0 ? found : 0;
  };
  const rotate = (palette: PaletteEntry[], from: PlannedOutfitColour | undefined, role: BlueprintColourUse['role'], avoidUsed: boolean) => {
    if (!palette.length) return from;
    const offset = 1 + Math.floor(Math.random() * Math.max(1, palette.length - 1));
    const start = (indexOfColour(palette, from) + offset) % palette.length;
    const passes = avoidUsed ? [true, false] : [false];
    for (const respectUsed of passes) {
      for (let step = 0; step < palette.length; step++) {
        const candidate = palette[(start + step) % palette.length];
        const hex = normaliseHex(candidate.hex);
        if (chosen.has(hex)) continue;
        if (respectUsed && usedHexes.has(hex)) continue;
        chosen.add(hex);
        return plannedColour(candidate, role, start + step);
      }
    }
    return plannedColour(palette[start], role, start);
  };
  plan.lead_colour = rotate(basePalette, plan.lead_colour, 'lead', true) ?? plan.lead_colour;
  plan.support_colour = rotate(basePalette, plan.support_colour, 'support', true) ?? plan.support_colour;
  if (plan.ground_colour) plan.ground_colour = rotate(basePalette, plan.ground_colour, 'ground', true) ?? plan.ground_colour;
  if (plan.accent_colour) plan.accent_colour = rotate(accentPalette, plan.accent_colour, 'accent', true) ?? plan.accent_colour;

  if (!note) return plan;

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

  return plan;
}

function plannedPalette(plan: PlannedOutfit): BlueprintColourUse[] {
  return [plan.lead_colour, plan.support_colour, plan.ground_colour, plan.accent_colour]
    .filter((colour): colour is PlannedOutfitColour => Boolean(colour))
    .map(colour => ({ name: colour.name, hex: colour.hex, role: colour.role }));
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
      fallbackBlock('Necklines', 'Open the line', `Prioritise ${face.approved_necklines.slice(0, 3).join(', ') || 'open V, soft scoop, and open square necklines'} to lengthen the face and keep the upper body clean.`),
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
  if (/(dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set)/.test(lower)) return 'Dress';
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
  if (isShoeBag) return plan.ground_colour ?? plan.support_colour;
  if (isLayer) return plan.support_colour;
  if (isDetail) return accent ?? plan.support_colour;
  return plan.lead_colour;
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

function colourLooksAccentOnly(colour: PlannedOutfitColour) {
  return colour.role === 'accent' || /(emerald|teal|rose|pink|coral|peach|plum|violet|purple|marigold|mustard|gold|rust|terracotta|sienna|red|berry)/i.test(colourText(colour));
}

function realisticFootwearFamily(colour: PlannedOutfitColour, plan: PlannedOutfit, originalPiece: string) {
  const lowerPiece = originalPiece.toLowerCase();
  const sneakerAllowed = plan.capsule === 'Everyday' || (plan.capsule === 'Social' && /casual|denim|street|sneaker/.test(lowerPiece));
  const isSneaker = /sneaker|trainer|canvas|low-top|slip-on/.test(lowerPiece);
  const isWarmLeather = /(espresso|cocoa|chocolate|brown|tan|camel|cognac|taupe|warm|burgundy|oxblood)/i.test(colourText(colour));
  const isDark = relativeLuminance(colour.hex) < 0.26 || /(black|ink|charcoal|espresso|cocoa|chocolate|navy)/i.test(colourText(colour));

  if (isSneaker && sneakerAllowed) {
    if (colourLooksLight(colour)) return `${colour.name} minimalist leather low-top sneakers`;
    if (colourLooksGreyNeutral(colour)) return `white leather low-top sneakers with restrained ${colour.name} trim`;
    return `off-white leather low-top sneakers with tiny ${colour.name} trim`;
  }

  if (plan.capsule === 'Professional') {
    if (isWarmLeather) return `${colour.name} leather loafers`;
    if (isDark) return `${colour.name} pointed-toe flats or low pumps`;
    if (colourLooksGreyNeutral(colour)) return `charcoal or pewter suede pointed flats`;
    return `neutral leather pointed flats with a small ${colour.name} detail`;
  }

  if (plan.capsule === 'Occasion') {
    if (colourLooksAccentOnly(colour)) return `metallic or neutral low heels with tiny ${colour.name} detailing`;
    if (isWarmLeather) return `${colour.name} suede block heels or refined sandals`;
    if (isDark) return `${colour.name} low heels or dressy flats`;
    return `${colour.name} refined sandals or low heels`;
  }

  if (colourLooksAccentOnly(colour) && !colourLooksLeatherGround(colour)) {
    return `neutral leather flats with small ${colour.name} trim`;
  }

  if (colourLooksGreyNeutral(colour)) return `${colour.name} suede loafers, flats, or grey-neutral sneakers`;
  if (colourLooksLeatherGround(colour)) return `${colour.name} leather loafers, flats, or sandals`;
  return `neutral shoe with a controlled ${colour.name} detail`;
}

function realisticBagFamily(colour: PlannedOutfitColour, plan: PlannedOutfit) {
  if (colourLooksAccentOnly(colour) && plan.capsule === 'Occasion') return `compact ${colour.name} clutch or minaudiere`;
  if (colourLooksAccentOnly(colour)) return `neutral structured bag with small ${colour.name} trim or hardware`;
  if (colourLooksLeatherGround(colour) || colourLooksGreyNeutral(colour)) return `${colour.name} structured leather bag`;
  return `neutral leather bag with a small ${colour.name} detail`;
}

function realisticAccessoryFamily(colour: PlannedOutfitColour, plan: PlannedOutfit, slot: string) {
  const application = plan.accent_application;
  if (application && colour.role === 'accent') {
    const lowerSlot = slot.toLowerCase();
    if (/scarf/.test(lowerSlot) || /scarf/.test(application.slot)) return `${colour.name} narrow silk scarf`;
    if (/hair|face/.test(lowerSlot) || /hair|face/.test(application.slot)) return `${colour.name} hair clip, eyewear tint, or near-face enamel detail`;
    if (/print|pattern/.test(lowerSlot) || /print|pattern/.test(application.slot)) return `${colour.name} micro-print, pinstripe, or border detail`;
    if (/waist|belt/.test(lowerSlot) || /waist|belt/.test(application.slot)) return `${colour.name} slim belt, buckle, or waist piping`;
    if (/footwear/.test(lowerSlot) || /footwear/.test(application.slot)) return `neutral shoe with ${colour.name} heel, strap, or piping detail`;
    if (/bag/.test(lowerSlot) || /bag/.test(application.slot)) return realisticBagFamily(colour, plan);
    if (/top|layer/.test(lowerSlot) || /top|layer/.test(application.slot)) return `${colour.name} ${application.piece}`;
  }
  if (/(gold|marigold|amber|copper|bronze)/i.test(colourText(colour))) return `${colour.name} metal jewellery detail`;
  if (/(silver|pewter|grey|gray|slate)/i.test(colourText(colour))) return `${colour.name} metal, stone, or enamel jewellery detail`;
  return `${colour.name} stone, enamel, or jewellery detail`;
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

function normalisePieceColourApplication(piece: string, slot: string, plan: PlannedOutfit, colour: PlannedOutfitColour) {
  const lower = slot.toLowerCase();
  if (/shoe|footwear/.test(lower)) return realisticFootwearFamily(colour, plan, piece);
  if (/bag|tote|clutch|crossbody|handbag/.test(lower)) return realisticBagFamily(colour, plan);
  if (/jewel|accessor|scarf|trim|hardware|hair|pattern|print/.test(lower)) return realisticAccessoryFamily(colour, plan, slot);
  if (/belt/.test(lower)) return `${colour.name} slim belt or waist detail`;
  const withoutName = piece.replace(new RegExp(escapeRegExp(colour.name), 'gi'), ' ');
  const noun = stripColourWords(withoutName) || slot.toLowerCase();
  return `${colour.name} ${noun}`;
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

  // Only one "pattern moment" per outfit: carry the pattern on the lead top/dress
  // slot so the look is not head-to-toe in the same print.
  const isPatternSlot = /top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic/i.test(slot);
  const pattern = (!isPatternSlot || hasPattern || /solid/i.test(plan.pattern_direction))
    ? ''
    : ` with ${plan.pattern_direction}`;

  return `${piece}${texture}${pattern}`;
}

function accentFormulaItem(plan: PlannedOutfit): NormalisedFormulaItem | null {
  if (!plan.accent_colour || !plan.accent_application) return null;
  const colour = plan.accent_colour;
  const slot = plan.accent_application.slot;
  const piece = normalisePieceColourApplication(`${colour.name} ${plan.accent_application.piece}`, slot, plan, colour);
  return {
    slot,
    piece,
    colour_name: colour.name,
    colour_hex: colour.hex,
    palette_role: colour.role,
    structural_notes: plan.accent_application.guidance,
  };
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

function structuralNotesFromItem(item: unknown, slot: string, plan: PlannedOutfit) {
  const record = asRecord(item);
  const existing = asString(record.structural_notes) || asString(record.notes) || asString(record.guidance) || asString(record.body);
  if (!weakText(existing)) return existing;
  if (/outer|layer|blazer|jacket|cardigan|vest/i.test(slot)) return `Use this ${plan.layer_type ?? 'layer'} only when it strengthens the outer frame; keep it open or lightly shaped so it does not add bulk through the centre.`;
  if (/jewel|accessor|bag|belt|scarf|trim/i.test(slot)) return 'Keep the detail small and intentional so the accent adds interest without taking over the outfit.';
  if (/shoe|footwear/i.test(slot)) return 'Keep the shoe clean and aligned with the outfit depth so the vertical line continues to the floor.';
  if (/bottom|trouser|skirt|jean/i.test(slot)) return 'Choose a clean fall and enough ease so the lower half supports length without clinging.';
  return 'Keep the fit clean through the torso and let the colour lead the outfit without adding extra visual noise.';
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

  if (plan.layer_required && !hasFormulaSlot(next, /outer|layer|blazer|jacket|cardigan|vest|coat|overshirt|dupatta/i)) {
    next.splice(Math.min(hasDress ? 1 : 2, next.length), 0, plannedFormulaItem('Outerwear', plan, plan.layer_type ?? 'layer'));
  }

  if (!hasFormulaSlot(next, /footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule/i)) {
    next.push(plannedFormulaItem('Footwear', plan, 'refined shoe'));
  }
  if (!hasFormulaSlot(next, /bag|tote|clutch|crossbody|handbag/i)) {
    next.push(plannedFormulaItem('Bag', plan, 'structured bag'));
  }
  if (!hasFormulaSlot(next, /jewel|accessor|earring|necklace|bracelet|watch|bangle|scarf|belt/i)) {
    next.push(plannedFormulaItem('Jewellery', plan, 'small jewellery detail'));
  }

  // Only detail-mode accents add a separate small item. Layer/top accents are
  // already carried by the structural layer or top (via colourForSlot), so we
  // never add a duplicate accent garment.
  const accentItem = plan.accent_mode === 'detail' ? accentFormulaItem(plan) : null;
  if (accentItem) {
    const accentText = `${accentItem.slot} ${accentItem.piece}`.toLowerCase();
    const alreadyHasAccentApplication = next.some(item => {
      const text = `${item.slot} ${item.piece}`.toLowerCase();
      return item.palette_role === 'accent' && (
        text.includes(plan.accent_application?.slot.toLowerCase() ?? '') ||
        text.includes(plan.accent_application?.piece.split(/\s+/)[0]?.toLowerCase() ?? '') ||
        text === accentText
      );
    });
    if (!alreadyHasAccentApplication) {
      const insertAt = Math.min(hasDress ? 2 : 3, next.length);
      next.splice(insertAt, 0, accentItem);
    }
  }

  // Pad to a complete look. For garment-accent outfits (layer/top) the accent is
  // already present, so pad with a neutral detail rather than piling on accent.
  while (next.length < 5) {
    const accentDetail = plan.accent_mode === 'detail';
    next.push(plannedFormulaItem(
      accentDetail ? 'Accessory' : 'Waist Detail',
      plan,
      accentDetail ? 'controlled accent detail' : 'clean waist detail',
    ));
  }

  return next;
}

function isInternalLibraryBlock(block: BlueprintBlock) {
  const text = `${block.label ?? ''} ${block.heading ?? ''} ${block.body ?? ''}`.toLowerCase();
  return /library reference|adapted from|source outfit|root-\d|curated-\d/.test(text);
}

function outfitTitleFromPlan(plan: PlannedOutfit) {
  const direction = plan.formula_direction
    .replace(/\+/g, ' with ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
  return `${plan.capsule} Look ${plan.outfit_number}: ${direction}`;
}

function shouldReplaceOutfitTitle(title: string, plan: PlannedOutfit) {
  const lower = title.toLowerCase();
  const libraryTitle = plan.library_reference?.title.toLowerCase();
  return !title.trim() ||
    /adapted from|library reference|root-\d|curated-\d/.test(lower) ||
    Boolean(libraryTitle && lower.includes(libraryTitle));
}

function normaliseOutfitPage(page: BlueprintPage, plan: PlannedOutfit): BlueprintPage {
  const paletteUsed = plannedPalette(plan);
  let items: NormalisedFormulaItem[] = flattenFormulaItems(page).map((item, index) => {
    const initialSlot = slotFromItem(item, index);
    const initialColour = colourForSlot(initialSlot, plan);
    const piece = pieceTextFromItem(item, `${initialColour.name} ${initialSlot.toLowerCase()}`);
    const slot = /^(outfit|formula|look|piece)$/i.test(initialSlot)
      ? inferPrimarySlot(piece, index === 0 ? 'Top' : initialSlot)
      : initialSlot;
    const slotColour = colourForSlot(slot, plan);
    const normalisedPiece = enrichGarmentTextureAndPattern(
      normalisePieceColourApplication(piece, slot, plan, slotColour),
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

  if (!plan.layer_required) {
    items = items.filter(item => !/outer|layer|blazer|jacket|cardigan|vest/i.test(asString(item.slot)));
  }

  if (plan.layer_required && !items.some(item => /outer|layer|blazer|jacket|cardigan|vest/i.test(asString(item.slot)))) {
    const layerColour = colourForSlot('Outerwear', plan);
    const piece = enrichGarmentTextureAndPattern(
      normalisePieceColourApplication(`${layerColour.name} ${plan.layer_type ?? 'layer'}`, 'Outerwear', plan, layerColour),
      'Outerwear',
      plan,
    );
    items.splice(2, 0, {
      slot: 'Outerwear',
      piece,
      colour_name: layerColour.name,
      colour_hex: layerColour.hex,
      palette_role: layerColour.role,
      structural_notes: `Use this ${plan.layer_type ?? 'layer'} to create an intentional outer frame, not as a default extra piece.`,
    });
  }

  items = completeFormulaItems(items, plan);

  const reasoningIndex = page.blocks.findIndex(block => block.reason || /reason|why|works/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const reasoningBlock = reasoningIndex >= 0 ? page.blocks[reasoningIndex] : null;
  const meaningfulReasonText = reasoningBlock && !isInternalLibraryBlock(reasoningBlock) && !weakText(reasoningBlock.reason || reasoningBlock.body)
    ? reasoningBlock
    : {
      label: 'Why it works',
      heading: 'Colour and structure logic',
      body: `The lead colour is ${plan.lead_colour.name}, supported by ${plan.support_colour.name}${plan.accent_colour ? ` with a controlled ${plan.accent_colour.name} accent` : ` and grounded by ${plan.ground_colour?.name ?? plan.support_colour.name}`}. ${plan.layer_required ? `The ${plan.layer_type} is used because this look benefits from an outer frame.` : 'No outer layer is forced here, so the outfit has breathing room and variety.'}`,
      reason: 'This keeps the wardrobe varied while still following one palette and proportion system.',
    };

  const formulaBlock: BlueprintBlock = {
    label: 'Formula',
    heading: `${plan.capsule} formula ${plan.outfit_number}`,
    body: `Use ${plan.lead_colour.name} as the lead shade inside a ${plan.formula_direction} structure. Texture direction: ${plan.texture_direction}. Pattern direction: ${plan.pattern_direction}.${plan.accent_colour && plan.accent_application ? ` Accent use: ${plan.accent_colour.name} as ${plan.accent_application.piece}.` : ''} Keep the full look to ${plan.max_visible_colours} visible colours.`,
    items,
  };

  const formulaIndex = page.blocks.findIndex(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const nextBlocks = [
    formulaBlock,
    ...(reasoningIndex >= 0
      ? page.blocks
        .map((block, index) => index === reasoningIndex ? meaningfulReasonText : block)
        .filter((block, index) => index !== formulaIndex && !isInternalLibraryBlock(block))
      : [
        meaningfulReasonText,
        ...page.blocks.filter(block =>
          !/formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`) &&
          !isInternalLibraryBlock(block),
        ),
      ]),
  ].slice(0, 5);

  return {
    ...page,
    title: shouldReplaceOutfitTitle(page.title, plan) ? outfitTitleFromPlan(plan) : page.title,
    subtitle: page.subtitle || plan.capsule,
    blocks: nextBlocks,
    palette_used: paletteUsed,
    library_refs: plan.library_reference ? [plan.library_reference] : page.library_refs,
  };
}

function normaliseGeneratedPage(
  page: BlueprintPage,
  reportData: StylistBlueprintReportData,
  planOverride?: PlannedOutfit,
): BlueprintPage {
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (page.page_number >= outfitStart && page.page_number <= outfitEnd) {
    const plan = planOverride ?? buildOutfitDiversityPlan(reportData)[page.page_number - outfitStart];
    return normaliseOutfitPage(page, plan);
  }
  return normaliseUsefulBlocks(page, reportData);
}

export async function generateStylistBlueprintPages(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing',
): Promise<BlueprintPage[]> {
  const stylistOutfitLibrary = getStylistOutfitLibraryPrompt();
  const pageCount = getStylistBlueprintPageCount(reportData);
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(reportData);
  const matrixPage = getStylistBlueprintMatrixPage(reportData);
  const auditPage = getStylistBlueprintAuditPage(reportData);
  const continuationPage = getStylistBlueprintContinuationPage(reportData);
  const capsuleRanges = getStylistBlueprintCapsulePageRanges(reportData);
  const outfitsPerCapsule = outfitCount / 4;
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData);
  const ranges = {
    opening: 'pages 1-3',
    diagnosis: 'pages 4-8',
    prescription: 'pages 9-12',
    application: `pages 13-${outfitEndPage}`,
    closing: `pages ${matrixPage}-${continuationPage}`,
  };

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
- Each outfit page must follow the deterministic outfit diversity plan exactly.
- Each outfit page must follow its formula_direction and library_piece_logic from the deterministic plan.
- Each outfit page must use its deterministic library_reference as the source inspiration, without copying it verbatim.
- Each outfit page must include top-level library_refs with the assigned library_reference id, title, source, capsule, and adaptation.
- Do not mention "adapted from", "library reference", source ids, or source outfit titles in visible client-facing body text. Keep that only in top-level library_refs.
- Each outfit page must include formula items for top, bottom or dress, footwear, bag, jewellery/accessory, plus structural notes.
- Include outerwear/layers only where the plan says layer_required=true. Do not add a layer to no-layer outfits.
- Formula item objects must include: {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""}.
- Each outfit page must include page-level "palette_used" containing only the colours actually used in that outfit, with roles.
- Lead colours must be visibly different across outfit pages; do not keep using the first five colours.
- Accent colours must follow the accent_application in the plan. Use them with enough visibility to feel intentional, but keep them realistic and never as a whole trouser, sneaker, or large coat.
- Use no more than 3 visible colours per outfit.
- Each outfit page must include a reasoning block.
- Shared pieces should repeat across capsules where useful.
- Use the Stylist Outfit Library as inspiration for capsule structure, piece relationships, and styling logic. Adapt every look to the client; do not copy library outfits verbatim.

${PRACTICAL_COLOUR_APPLICATION_RULES}

Closing:
- Page ${matrixPage} must include core pieces and which outfits they appear in.
- Page ${auditPage} must include 6 wardrobe audit questions.
- Page ${continuationPage} must adapt to whether the client selected/subscribed to ICONIK Edit if known.

--- CURRENT CLASSIFICATION ---
${stringify(reportData.classification)}

--- CURRENT ANALYSIS ---
${stringify(reportData.analysis)}

--- DETERMINISTIC OUTFIT DIVERSITY PLAN ---
${stringify(outfitDiversityPlan)}

--- EXISTING PAGES ---
${stringify(reportData.pages)}

--- STYLIST OUTFIT LIBRARY ---
${stylistOutfitLibrary}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  return normalisePages(raw.pages, act, reportData);
}

export async function generateStylistBlueprintReplacementOutfit(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  pageNumber: number,
  reason?: string,
): Promise<BlueprintPage> {
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  if (pageNumber < outfitStart || pageNumber > outfitEnd) {
    throw new Error(`Page ${pageNumber} is not an outfit page`);
  }

  const existingPage = reportData.pages.find(page => page.page_number === pageNumber);
  if (!existingPage) throw new Error(`Missing outfit page ${pageNumber}`);

  const plan = buildReplacementPlan(reportData, pageNumber, reason);
  const prompt = `You are ICONIK's premium women Style Blueprint writer.
Return ONLY valid JSON: {"page":{...}}.

Replace exactly one outfit page in an existing ${getStylistBlueprintPageCount(reportData)}-page Blueprint.
Use structured data only. No markdown.
Do not repeat the rejected outfit formula, title, garment combination, or styling angle.
Honour the admin instruction in the REPLACEMENT REQUEST below, and make this outfit clearly different from the rejected one.
The UPDATED OUTFIT PLAN below already reflects that instruction (colours, layer, formula). Follow it.
Keep the same page number, capsule, max visible colours, and library reference.

Required page object:
{"page_number":${pageNumber},"page_type":"outfit","title":"","subtitle":"","blocks":[{"label":"","heading":"","body":"","reason":"","items":[]}],"palette_used":[],"library_refs":[]}

Replacement rules:
- The outfit page must follow the updated outfit plan below.
- Follow the formula_direction and library_piece_logic from the plan.
- Use the assigned library_reference as inspiration only; adapt it to the client rather than copying it.
- Do not mention "adapted from", "library reference", source ids, or source outfit titles in visible client-facing body text. Keep that only in top-level library_refs.
- Include formula items for top, bottom or dress, footwear, bag, jewellery/accessory, plus structural notes.
- Include outerwear/layers only where layer_required=true.
- Formula item objects must include: {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""}.
- Include page-level palette_used containing only the colours actually used in this outfit, with roles.
- Use no more than 3 visible colours.
- Include one reasoning block explaining why the replacement works.
- Include top-level library_refs with the assigned library_reference id, title, source, capsule, and adaptation.

${PRACTICAL_COLOUR_APPLICATION_RULES}

--- REPLACEMENT REQUEST ---
${reason || 'Admin rejected the current outfit and requested a stronger alternative in the same report context.'}

--- CURRENT CLASSIFICATION ---
${stringify(reportData.classification)}

--- CURRENT ANALYSIS ---
${stringify(reportData.analysis)}

--- UPDATED OUTFIT PLAN FOR THIS PAGE ---
${stringify(plan)}

--- REJECTED OUTFIT PAGE - DO NOT REPEAT ---
${stringify(existingPage)}

--- CURRENT REPORT PAGES FOR CONTEXT ---
${stringify(reportData.pages)}

--- STYLIST OUTFIT LIBRARY ---
${getStylistOutfitLibraryPrompt()}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  const page = asRecord(raw.page) || asRecord(Array.isArray(raw.pages) ? raw.pages[0] : null);
  if (!Object.keys(page).length) throw new Error('Replacement outfit generation returned no page');

  const candidate: BlueprintPage = {
    page_number: pageNumber,
    page_type: 'outfit',
    title: asString(page.title, existingPage.title || `Outfit ${pageNumber - outfitStart + 1}`),
    subtitle: asString(page.subtitle, plan.capsule),
    blocks: Array.isArray(page.blocks) ? page.blocks.map(block => {
      const record = asRecord(block);
      return {
        label: asString(record.label) || undefined,
        heading: asString(record.heading) || undefined,
        body: asString(record.body) || undefined,
        reason: asString(record.reason) || undefined,
        items: Array.isArray(record.items) ? record.items : undefined,
      };
    }) : [],
    image_refs: asStringArray(page.image_refs),
  };

  return normaliseGeneratedPage(candidate, reportData, plan);
}

export async function generateStylistBlueprintReplacementOutfits(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  reason?: string,
): Promise<BlueprintPage[]> {
  const outfitCount = getStylistBlueprintOutfitCount(reportData);
  const outfitStart = getStylistBlueprintOutfitStartPage();
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  const capsuleRanges = getStylistBlueprintCapsulePageRanges(reportData);
  const outfitsPerCapsule = outfitCount / 4;
  const outfitDiversityPlan = buildOutfitDiversityPlan(reportData);

  const prompt = `You are ICONIK's premium women Style Blueprint writer.
Return ONLY valid JSON: {"pages":[...]}.

Replace the full outfit system in an existing ${getStylistBlueprintPageCount(reportData)}-page Blueprint.
Generate page 13 and pages ${outfitStart}-${outfitEnd} together in one response so colour, garment, silhouette, and capsule choices are balanced across the whole wardrobe.
Use structured data only. No markdown. Do not repeat the current outfit formulas.

Required page object:
{"page_number":13,"page_type":"outfit_system","title":"","subtitle":"","blocks":[{"label":"","heading":"","body":"","reason":"","items":[]}],"image_refs":[""]}

Bulk replacement rules:
- Page 13 must introduce 4 capsules and list their ${outfitsPerCapsule} outfit names.
- Pages ${outfitStart}-${outfitEnd} must be one outfit per page.
- Each outfit page must follow the deterministic outfit diversity plan exactly.
- Each outfit page must follow its formula_direction and library_piece_logic from the deterministic plan.
- Balance the entire wardrobe: avoid repeated garment formulas, repeated top/bottom combinations, repeated accessory ideas, and repeated colour impressions.
- Use every lead colour according to the plan, vary support/ground roles, and make accent colours appear as small details only.
- Keep each outfit to no more than 3 visible colours.
- Use the assigned library_reference as inspiration only; adapt it to the client rather than copying it.
- Include top-level library_refs with the assigned library_reference id, title, source, capsule, and adaptation.
- Do not mention "adapted from", "library reference", source ids, or source outfit titles in visible client-facing body text. Keep that only in top-level library_refs.
- Each outfit page must include formula items for top, bottom or dress, footwear, bag, jewellery/accessory, plus structural notes.
- Include outerwear/layers only where layer_required=true. Do not add a layer to no-layer outfits.
- Formula item objects must include: {"slot":"","piece":"","colour_name":"","colour_hex":"","palette_role":"lead|support|ground|accent","structural_notes":""}.
- Each outfit page must include page-level palette_used containing only the colours actually used in that outfit, with roles.
- Each outfit page must include a reasoning block.

${PRACTICAL_COLOUR_APPLICATION_RULES}

Capsules:
${capsuleRanges[0].firstPage}-${capsuleRanges[0].lastPage} Professional Capsule outfits
${capsuleRanges[1].firstPage}-${capsuleRanges[1].lastPage} Social Capsule outfits
${capsuleRanges[2].firstPage}-${capsuleRanges[2].lastPage} Everyday Capsule outfits
${capsuleRanges[3].firstPage}-${capsuleRanges[3].lastPage} Occasion Capsule outfits

--- BULK REPLACEMENT REQUEST ---
${reason || 'Admin requested a stronger, more diverse full outfit system using the same report context.'}

--- CURRENT CLASSIFICATION ---
${stringify(reportData.classification)}

--- CURRENT ANALYSIS ---
${stringify(reportData.analysis)}

--- DETERMINISTIC OUTFIT DIVERSITY PLAN ---
${stringify(outfitDiversityPlan)}

--- CURRENT OUTFIT SYSTEM AND OUTFITS - DO NOT REPEAT ---
${stringify(reportData.pages.filter(page => page.page_number >= 13 && page.page_number <= outfitEnd))}

--- FULL CURRENT REPORT PAGES FOR CONTEXT ---
${stringify(reportData.pages)}

--- STYLIST OUTFIT LIBRARY ---
${getStylistOutfitLibraryPrompt()}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  return normalisePages(raw.pages, 'application', reportData);
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
          const source: BlueprintLibraryRef['source'] = asString(record.source) === 'curated' ? 'curated' : 'root';
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
    .map(page => normaliseGeneratedPage(page, reportData));

  const missing = expected[act].filter(pageNumber => !pages.some(page => page.page_number === pageNumber));
  if (missing.length) throw new Error(`Blueprint ${act} generation missed page(s): ${missing.join(', ')}`);
  return pages.sort((a, b) => a.page_number - b.page_number);
}

export function mergeBlueprintPages(existing: BlueprintPage[], incoming: BlueprintPage[]) {
  const map = new Map(existing.map(page => [page.page_number, page]));
  for (const page of incoming) map.set(page.page_number, page);
  return [...map.values()].sort((a, b) => a.page_number - b.page_number);
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

  const baseHexes = data.classification.colour.base_palette.slice(0, BASE_PALETTE_SIZE).map(colour => normaliseHex(colour.hex));
  const accentHexes = data.classification.colour.accent_palette.slice(0, ACCENT_PALETTE_SIZE).map(colour => normaliseHex(colour.hex));
  const leadCounts = new Map(baseHexes.map(hex => [hex, 0]));
  const accentUsed = new Set<string>();
  let outerwearCount = 0;

  for (const page of outfitPages) {
    const paletteUsed = page.palette_used ?? [];
    const lead = paletteUsed.find(colour => colour.role === 'lead');
    if (!lead || !leadCounts.has(normaliseHex(lead.hex))) throw new Error(`Outfit page ${page.page_number} is missing a valid lead colour`);
    leadCounts.set(normaliseHex(lead.hex), (leadCounts.get(normaliseHex(lead.hex)) ?? 0) + 1);
    for (const colour of paletteUsed) {
      const hex = normaliseHex(colour.hex);
      if (accentHexes.includes(hex)) accentUsed.add(hex);
    }

    const formulaItems = page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
    if (formulaItems.length < 5) throw new Error(`Outfit page ${page.page_number} needs at least 5 formula items`);
    const formulaText = formulaItems
      .map(item => {
        const record = asRecord(item);
        return `${asString(record.slot)} ${asString(record.piece)}`;
      })
      .join(' ')
      .toLowerCase();
    if (!/(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a clear top/dress/base garment`);
    }
    if (!/(bottom|trouser|pant|jean|skirt|palazzo|legging|dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a clear bottom or one-piece garment`);
    }
    if (!/(footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs footwear`);
    }
    if (!/(bag|tote|clutch|crossbody|handbag|jewel|accessor|earring|necklace|bracelet|watch|bangle|scarf|belt)/.test(formulaText)) {
      throw new Error(`Outfit page ${page.page_number} needs a bag or accessory`);
    }
    const hasOuterwear = formulaItems.some(item => /outer|layer|blazer|jacket|cardigan|vest/i.test(asString(asRecord(item).slot) || asString(asRecord(item).category)));
    if (hasOuterwear) outerwearCount++;

    for (const item of formulaItems) {
      const record = asRecord(item);
      if (!asString(record.slot) || !asString(record.piece)) throw new Error(`Outfit page ${page.page_number} has an incomplete formula item`);
      if (!asString(record.colour_name) || !isValidHex(asString(record.colour_hex))) throw new Error(`Outfit page ${page.page_number} has formula item missing colour metadata`);
      if (!['lead', 'support', 'ground', 'accent'].includes(asString(record.palette_role))) throw new Error(`Outfit page ${page.page_number} has formula item missing palette role`);
      if (weakText(asString(record.structural_notes))) throw new Error(`Outfit page ${page.page_number} has formula item missing structural notes`);
    }
  }

  // With 20 outfits over 15 base shades, ~5 colours lead twice and ~10 lead once;
  // just guard against any single colour dominating the lead role.
  for (const [hex, count] of leadCounts) {
    if (count > 2) throw new Error(`Base colour ${hex} should lead at most 2 outfits, found ${count}`);
  }
  if (accentUsed.size < accentHexes.length) throw new Error(`Expected all ${accentHexes.length} accent colours to appear, found ${accentUsed.size}`);
  // Clients whose coverage rules require covered arms/shoulders get a layer on
  // every outfit, so the usual 8-12 outerwear window does not apply to them.
  if (!coverageRequiresCover(data.classification) && (outerwearCount < 8 || outerwearCount > 12)) {
    throw new Error(`Outerwear should appear in 8-12 outfits, found ${outerwearCount}`);
  }
}
