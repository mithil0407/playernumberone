import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

const WOMEN_OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/womenOutfitRecommendationSkill.md'),
  'utf-8',
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export const STYLIST_BLUEPRINT_VERSION = 'women_blueprint_28_v1' as const;
export const STYLIST_BLUEPRINT_PAGE_COUNT = 28;

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

export interface BlueprintPage {
  page_number: number;
  page_type: BlueprintPageType;
  title: string;
  subtitle?: string;
  blocks: BlueprintBlock[];
  image_refs?: string[];
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
  version: typeof STYLIST_BLUEPRINT_VERSION;
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

function canonicalPageType(pageNumber: number): BlueprintPageType {
  if (pageNumber === 1) return 'cover';
  if (pageNumber === 2) return 'summary';
  if (pageNumber === 3) return 'reading_guide';
  if ([4, 5, 6, 7].includes(pageNumber)) return 'diagnosis';
  if (pageNumber === 8) return 'avoidance';
  if (pageNumber === 9) return 'palette';
  if ([10, 11].includes(pageNumber)) return 'rules';
  if (pageNumber === 12) return 'fabric';
  if (pageNumber === 13) return 'outfit_system';
  if (pageNumber >= 14 && pageNumber <= 25) return 'outfit';
  if (pageNumber === 26) return 'matrix';
  if (pageNumber === 27) return 'audit';
  return 'continuation';
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
      hex: /^#[0-9a-f]{6}$/i.test(asString(item.hex)) ? asString(item.hex) : '#B97A3A',
      usage: asString(item.usage, 'Use where the colour supports your proportions.'),
      avoid_for: asString(item.avoid_for) || undefined,
    }));
  return items.length ? items : fallback;
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

Return exactly 10 base_palette colours and exactly 5 accent_palette colours with accurate hex codes.

--- WOMEN OUTFIT LOGIC ---
${WOMEN_OUTFIT_SKILL}

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
      base_palette: toPalette(colour.base_palette, fallbackBase).slice(0, 10),
      accent_palette: toPalette(colour.accent_palette, fallbackBase).slice(0, 5),
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

  if (classification.colour.base_palette.length < 10) {
    classification.colour.base_palette = [...classification.colour.base_palette, ...fallbackBase].slice(0, 10);
  }
  if (classification.colour.accent_palette.length < 5) {
    classification.colour.accent_palette = [...classification.colour.accent_palette, ...fallbackBase].slice(0, 5);
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

  return classification;
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

export async function generateStylistBlueprintPages(
  submission: StylistIntakeSubmission,
  reportData: StylistBlueprintReportData,
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing',
): Promise<BlueprintPage[]> {
  const ranges = {
    opening: 'pages 1-3',
    diagnosis: 'pages 4-8',
    prescription: 'pages 9-12',
    application: 'pages 13-25',
    closing: 'pages 26-28',
  };

  const prompt = `You are ICONIK's premium women Style Blueprint writer.
Return ONLY valid JSON: {"pages":[...]}.

Generate ${ranges[act]} for the 28-page Blueprint.
Use structured data only. No markdown. No client name after page 1.
Every recommendation must include a reason in either "reason" or the same item object.
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
14-16 Professional Capsule outfits
17-19 Social Capsule outfits
20-22 Everyday Capsule outfits
23-25 Occasion Capsule outfits
26 Combination Matrix
27 Wardrobe Audit Filter
28 Continuation / Edit

Required page object:
{"page_number":1,"page_type":"cover","title":"","subtitle":"","blocks":[{"label":"","heading":"","body":"","reason":"","items":[]}],"image_refs":[""]}

Application pages:
- Page 13 must introduce 4 capsules and list their 3 outfit names.
- Pages 14-25 must be one outfit per page.
- Each outfit page must include formula items for top, bottom or dress, outerwear, footwear, bag, jewellery/accessory, plus structural notes.
- Each outfit page must include a reasoning block.
- Shared pieces should repeat across capsules where useful.

Closing:
- Page 26 must include core pieces and which outfits they appear in.
- Page 27 must include 6 wardrobe audit questions.
- Page 28 must adapt to whether the client selected/subscribed to ICONIK Edit if known.

--- CURRENT CLASSIFICATION ---
${stringify(reportData.classification)}

--- CURRENT ANALYSIS ---
${stringify(reportData.analysis)}

--- EXISTING PAGES ---
${stringify(reportData.pages)}

--- INTAKE ---
${buildStylistBlueprintIntakeDigest(submission)}`;

  const raw = asRecord(await callGeminiJSON(prompt, photoUrls(submission)));
  return normalisePages(raw.pages, act);
}

function normalisePages(value: unknown, act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing'): BlueprintPage[] {
  const expected: Record<typeof act, number[]> = {
    opening: [1, 2, 3],
    diagnosis: [4, 5, 6, 7, 8],
    prescription: [9, 10, 11, 12],
    application: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    closing: [26, 27, 28],
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
    const pageType = canonicalPageType(pageNumber) || aiPageType;
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
    };
  }).filter(page => expected[act].includes(page.page_number));

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
  if (data.version !== STYLIST_BLUEPRINT_VERSION) throw new Error('Invalid Blueprint version');
  if (data.pages.length !== STYLIST_BLUEPRINT_PAGE_COUNT) throw new Error(`Expected 28 pages, found ${data.pages.length}`);
  for (let i = 1; i <= STYLIST_BLUEPRINT_PAGE_COUNT; i++) {
    if (!data.pages.some(page => page.page_number === i)) throw new Error(`Missing page ${i}`);
  }
  const outfitPages = data.pages.filter(page => page.page_type === 'outfit');
  if (outfitPages.length !== 12) throw new Error(`Expected 12 outfit pages, found ${outfitPages.length}`);
  for (const page of outfitPages) {
    const hasReason = page.blocks.some(block => block.reason || /why|because|works/i.test(block.heading ?? ''));
    if (!hasReason) throw new Error(`Outfit page ${page.page_number} is missing reasoning`);
  }
  if (data.classification.colour.base_palette.length < 10) throw new Error('Base palette requires 10 colours');
  if (data.classification.colour.accent_palette.length < 5) throw new Error('Accent palette requires 5 colours');
}

export function isVersionedStylistBlueprintReportData(data: unknown): data is StylistBlueprintReportData {
  return asRecord(data).version === STYLIST_BLUEPRINT_VERSION && Array.isArray(asRecord(data).pages);
}
