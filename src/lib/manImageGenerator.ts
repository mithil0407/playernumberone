// manImageGenerator.ts
// Phase 3 & 4 of the /man report pipeline: image generation via Gemini.
//
// Phase 3 — Hairstyle images (2 calls, parallel):
//   Client's HEADSHOT → 2 hairstyle variants applied, background kept as-is
//
// Phase 4 — Outfit images (16 calls, fully parallel):
//   Client's FULL-BODY PHOTO → each of the 20 outfits applied + 3 combo grids
//
// image_urls in the DB stores storage paths (not signed URLs).
// resolveManReportImageUrls() converts paths → fresh signed URLs at serve time.

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { supabaseAdmin } from './supabase';
import type { ClassificationResult, ReportSections } from './manReportGenerator';
import type { ManIntakeSubmission } from './supabaseMan';
import { revalidateManReportCache } from './manReportCache';
import { parseManOutfitsFromSection } from './manOutfitSection';

const ai     = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL  = 'gemini-3.1-flash-image-preview';
const BUCKET = 'man-report-images';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days — refreshed on every fetch
const GEMINI_IMAGE_TIMEOUT_MS = 45_000;
const OUTFIT_IMAGE_CONCURRENCY = 3;
const GEMINI_INLINE_IMAGE_MAX_BYTES = 18 * 1024 * 1024;
const GEMINI_SOURCE_IMAGE_MAX_DIMENSION = 1800;
const SUPPORTED_GEMINI_INPUT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape stored in image_urls JSONB column — storage paths, not URLs */
export interface ManReportImagePaths {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  beardCards:     (string | null)[]; // 2 headshot beard/grooming variants for bald clients
  eyewearCards:   (string | null)[]; // 2 headshot eyewear variants
  outfitCards:    (string | null)[];
  comboGridCards?: {
    office?: string | null;
    evening?: string | null;
    relaxed?: string | null;
  };
  baseModel?:     string;            // legacy — kept for backward compat with old reports
}

/** Shape returned to clients — signed URLs ready for <img> tags */
export interface ResolvedImageUrls {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  beardCards:     (string | null)[]; // 2 headshot beard/grooming variants for bald clients
  eyewearCards:   (string | null)[]; // 2 headshot eyewear variants
  outfitCards:    (string | null)[];
  comboGridCards?: {
    office?: string | null;
    evening?: string | null;
    relaxed?: string | null;
  };
  baseModel?:     string | null;     // legacy
}

export type FaceImageKind = 'hairstyle' | 'beard' | 'eyewear';

interface PartialImagePathPatch {
  hairstyleCards?: (string | null | undefined)[];
  beardCards?: (string | null | undefined)[];
  eyewearCards?: (string | null | undefined)[];
  outfitCards?: (string | null | undefined)[];
  comboGridCards?: ManReportImagePaths['comboGridCards'];
  baseModel?: string | null;
}
interface StoredImagePathState {
  imageUrls: ManReportImagePaths | null;
  updatedAt: string | null;
}

function normaliseImagePath(value: string | null | undefined): string | null {
  return value ? value : null;
}

function mergeImagePathArrays(
  current: (string | null)[] | undefined,
  incoming: (string | null | undefined)[] | undefined,
): (string | null)[] {
  const maxLen = Math.max(current?.length ?? 0, incoming?.length ?? 0);
  const merged: (string | null)[] = [];
  for (let i = 0; i < maxLen; i++) {
    const nextValue = normaliseImagePath(incoming?.[i]);
    const currentValue = normaliseImagePath(current?.[i]);
    merged[i] = nextValue ?? currentValue ?? null;
  }
  return merged;
}

function normaliseImagePaths(paths: ManReportImagePaths | null | undefined): ManReportImagePaths {
  return {
    hairstyleCards: (paths?.hairstyleCards ?? []).map(normaliseImagePath),
    beardCards:     (paths?.beardCards     ?? []).map(normaliseImagePath),
    eyewearCards:   (paths?.eyewearCards   ?? []).map(normaliseImagePath),
    outfitCards:    (paths?.outfitCards    ?? []).map(normaliseImagePath),
    comboGridCards: {
      office: normaliseImagePath(paths?.comboGridCards?.office),
      evening: normaliseImagePath(paths?.comboGridCards?.evening),
      relaxed: normaliseImagePath(paths?.comboGridCards?.relaxed),
    },
    ...(paths?.baseModel ? { baseModel: paths.baseModel } : {}),
  };
}

export function mergeManReportImagePaths(
  current: ManReportImagePaths | null | undefined,
  incoming: PartialImagePathPatch | null | undefined,
): ManReportImagePaths {
  const base = normaliseImagePaths(current);

  return {
    hairstyleCards: mergeImagePathArrays(base.hairstyleCards, incoming?.hairstyleCards),
    beardCards:     mergeImagePathArrays(base.beardCards, incoming?.beardCards),
    eyewearCards:   mergeImagePathArrays(base.eyewearCards, incoming?.eyewearCards),
    outfitCards:    mergeImagePathArrays(base.outfitCards, incoming?.outfitCards),
    comboGridCards: {
      office: normaliseImagePath(incoming?.comboGridCards?.office) ?? base.comboGridCards?.office ?? null,
      evening: normaliseImagePath(incoming?.comboGridCards?.evening) ?? base.comboGridCards?.evening ?? null,
      relaxed: normaliseImagePath(incoming?.comboGridCards?.relaxed) ?? base.comboGridCards?.relaxed ?? null,
    },
    ...(normaliseImagePath(incoming?.baseModel) ?? base.baseModel
      ? { baseModel: normaliseImagePath(incoming?.baseModel) ?? base.baseModel! }
      : {}),
  };
}

async function getStoredManReportImagePathState(reportId: string): Promise<StoredImagePathState> {
  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('image_urls, updated_at')
    .eq('id', reportId)
    .single();

  if (error) throw new Error(`Could not load current image paths for report ${reportId}: ${error.message}`);
  return {
    imageUrls: data?.image_urls ? normaliseImagePaths(data.image_urls as ManReportImagePaths) : null,
    updatedAt: data?.updated_at ?? null,
  };
}

export async function getStoredManReportImagePaths(reportId: string): Promise<ManReportImagePaths | null> {
  const state = await getStoredManReportImagePathState(reportId);
  return state.imageUrls;
}

export async function mergeManReportImagePathsForReport(
  reportId: string,
  incoming: PartialImagePathPatch,
  extraUpdates: Record<string, unknown> = {},
): Promise<ManReportImagePaths> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const state = await getStoredManReportImagePathState(reportId);
    const merged = mergeManReportImagePaths(state.imageUrls, incoming);
    const nextUpdatedAt = new Date().toISOString();

    let query = supabaseAdmin
      .from('man_reports')
      .update({
        ...extraUpdates,
        image_urls: merged,
        updated_at: nextUpdatedAt,
      })
      .eq('id', reportId);

    query = state.updatedAt
      ? query.eq('updated_at', state.updatedAt)
      : query.is('updated_at', null);

    const { data, error } = await query.select('image_urls, share_token').maybeSingle();

    if (error) {
      throw new Error(`Could not persist image paths for report ${reportId}: ${error.message}`);
    }

    if (data) {
      await revalidateManReportCache(reportId, data.share_token ?? null);
      return data.image_urls ? normaliseImagePaths(data.image_urls as ManReportImagePaths) : merged;
    }
  }

  throw new Error(`Could not persist image paths for report ${reportId}: concurrent update retries exhausted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Outfit parser
// Extracts the structured outfits from Section 4 markdown text
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedOutfit {
  index:       number;
  label:       string;
  top:         string;
  bottom:      string;
  layer:       string | null;
  footwear:    string;
  accessories: string | null;
  fitNote:     string | null;
  colourLogic: string | null;
}

function parseOutfitsFromSection(s4Text: string): ParsedOutfit[] {
  return parseManOutfitsFromSection(s4Text).map(outfit => ({
    index: outfit.number,
    label: outfit.label,
    top: outfit.top === '—' ? '' : outfit.top,
    bottom: outfit.bottom === '—' ? '' : outfit.bottom,
    layer: outfit.layer && outfit.layer !== '—' && !/no layer/i.test(outfit.layer) ? outfit.layer : null,
    footwear: outfit.footwear === '—' ? '' : outfit.footwear,
    accessories: outfit.accessories && outfit.accessories !== '—' ? outfit.accessories : null,
    fitNote: outfit.fitNote && outfit.fitNote !== '—' ? outfit.fitNote : null,
    colourLogic: outfit.colourLogic && outfit.colourLogic !== '—' ? outfit.colourLogic : null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────────────────────────────────────

export function isBeardFocusedClassification(classification: Pick<ClassificationResult, 'face'> | null | undefined): boolean {
  return classification?.face?.grooming_focus === 'beard';
}

function buildEyewearPrompt(eyewearShape: string, faceShape: string): string {
  return `You are editing a headshot photo. Your only task is to add a pair of glasses to the subject's face.

PRESERVE EVERYTHING EXCEPT THE EYEWEAR:
- Background: keep it exactly as it appears in the uploaded photo — same colour, same setting, same objects
- Face: same skin tone, same features, same expression, same lighting on face
- Hair: unchanged
- Clothing: unchanged
- Framing and composition: unchanged

ONLY CHANGE: Place a pair of ${eyewearShape} eyeglass frames on the subject's face. The glasses should sit naturally on the nose bridge, fit the face proportions of a ${faceShape} face shape, and look like premium, realistic eyewear — not cartoonish or digital-looking. The lenses should be clear (not tinted).

Do not alter the background in any way. Do not change the lighting. Do not reframe or crop differently.

Portrait format, tightly framed on the head and upper shoulders.`;
}

function buildHairstylePrompt(hairstyle: string, faceShape: string): string {
  return `You are editing a headshot photo. Your only task is to change the subject's hairstyle.

PRESERVE EVERYTHING EXCEPT THE HAIR:
- Background: keep it exactly as it appears in the uploaded photo — same colour, same setting, same objects
- Face: same skin tone, same features, same expression, same lighting on face
- Clothing: unchanged
- Framing and composition: unchanged

ONLY CHANGE: Apply this hairstyle — ${hairstyle} — styled naturally and intentionally for a ${faceShape} face shape. The hair should look polished, well-groomed, and realistic. Match the natural hair texture of the subject.

Do not alter the background in any way. Do not change the lighting. Do not reframe or crop differently.

Portrait format, tightly framed on the head and upper shoulders.`;
}

function buildBeardPrompt(beardStyle: string, faceShape: string): string {
  return `You are editing a headshot photo. Your only task is to adjust the subject's facial hair grooming.

PRESERVE EVERYTHING EXCEPT FACIAL HAIR:
- Background: keep it exactly as it appears in the uploaded photo — same colour, same setting, same objects
- Head and scalp: preserve the subject's bald, shaved, or closely cropped scalp exactly; do not add scalp hair
- Face: same skin tone, same features, same expression, same lighting on face
- Clothing: unchanged
- Framing and composition: unchanged

ONLY CHANGE: Apply this facial hair style — ${beardStyle} — shaped naturally and intentionally for a ${faceShape} face shape. The beard, stubble, moustache, cheek line, and neckline should look realistic, premium, and well-groomed.

Do not add hair to the scalp. Do not alter the background in any way. Do not change the lighting. Do not reframe or crop differently.

Portrait format, tightly framed on the head and upper shoulders.`;
}

// Softer prompt used as a safety-block fallback. Drops "preserve real face features"
// language that frequently triggers Gemini's image-safety filter on portraits.
function buildHairstylePromptSoft(hairstyle: string, faceShape: string): string {
  return `Editorial men's grooming reference photo. A young man with a ${faceShape} face shape, photographed in soft studio light, head and shoulders only.

The hair is styled in this exact style: ${hairstyle}. The hair should look polished, well-groomed, and realistic, with a natural texture.

The image should match the upload as closely as is reasonable in skin tone, build, and framing — interpret this as a styling reference, not as identity preservation.

Portrait format. Tightly framed on the head and upper shoulders. Clean neutral background.`;
}

function buildBeardPromptSoft(beardStyle: string, faceShape: string): string {
  return `Editorial men's grooming reference photo. A bald or closely shaved man with a ${faceShape} face shape, photographed in soft studio light, head and shoulders only.

The scalp remains bald or closely shaved with no added scalp hair. The facial hair is styled in this exact style: ${beardStyle}. The grooming should look polished, realistic, and natural.

The image should match the upload as closely as is reasonable in skin tone, build, and framing — interpret this as a grooming reference, not as identity preservation.

Portrait format. Tightly framed on the head and upper shoulders. Clean neutral background.`;
}

function buildEyewearPromptSoft(eyewearShape: string, faceShape: string): string {
  return `Editorial men's eyewear reference photo. A young man with a ${faceShape} face shape, photographed in soft studio light, head and shoulders only.

The subject is wearing ${eyewearShape} eyeglass frames that sit naturally on the nose bridge and suit the face proportions. Frames should look like premium, realistic eyewear with clear (not tinted) lenses.

The image should match the upload as closely as is reasonable in skin tone, build, and framing — interpret this as a styling reference, not as identity preservation.

Portrait format. Tightly framed on the head and upper shoulders. Clean neutral background.`;
}

function buildOutfitPrompt(outfit: ParsedOutfit, c: ClassificationResult): string {
  const garmentLines = [
    `Top: ${outfit.top}`,
    `Bottom: ${outfit.bottom}`,
    outfit.layer ? `Layer: ${outfit.layer}` : null,
    `Footwear: ${outfit.footwear}`,
    outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
  ].filter(Boolean).join('\n');

  const fitNote = outfit.fitNote ? `\nFit context: ${outfit.fitNote}` : '';
  const accessoryInstruction = outfit.accessories
    ? `\nAccessory rendering is mandatory: the accessories listed in the outfit specification must be visibly included where naturally visible (${outfit.accessories}). Do not omit them as optional styling hints.`
    : '';

  const groomingReferenceInstruction = isBeardFocusedClassification(c)
    ? 'Extract the subject\'s face, bald or closely shaved scalp, and beard grooming from the HEADSHOT (second image) — use this as the definitive face and grooming reference. Do not add scalp hair.'
    : 'Extract the subject\'s face and hairstyle from the HEADSHOT (second image) — use this as the definitive face and hair reference.';

  const groomingApplicationInstruction = isBeardFocusedClassification(c)
    ? 'Apply polished grooming — clean, fresh, well-kept. Carry the bald or closely shaved scalp and beard grooming from the headshot reference exactly into this full-body render. No changes to facial features or skin tone.'
    : 'Apply polished grooming — clean, fresh, well-kept. Carry the hairstyle from the headshot reference exactly into this full-body render. No changes to facial features or skin tone.';

  return `Professional editorial fashion catalogue photography.

Two reference photos are provided: the first is a full-body photo, the second is a styled headshot showing the subject's recommended grooming.

STERNLY IGNORE and COMPLETELY DISCARD the original background from both reference photos.

${groomingReferenceInstruction} Extract the body proportions and shape from the FULL-BODY photo (first image). Preserve their exact skin tone, facial features, and body shape — do not alter, slim, or idealise.

CRITICAL CLOTHING INSTRUCTION:
- Remove and discard the original clothing from BOTH reference photos
- Do not preserve, copy, blend, reinterpret, or borrow any garments, shoes, accessories, collars, lapels, colours, or silhouettes from either reference image
- The outfit specification below is the ONLY authority for what the subject wears

Place the subject against our brand studio cyclorama wall in #94a6ad (cool slate grey). Clean seamless backdrop, no texture, no gradient.

${groomingApplicationInstruction}

Dress the subject in this specific outfit:
${garmentLines}${fitNote}
${accessoryInstruction}

Garment rendering: Clothes should look pressed, tailored, and naturally worn on this body — not floating, not distorted. Colour accuracy is critical — match the described colours precisely. No logos or brand markings visible. Garments must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}. If there is any conflict between the reference photos and the outfit specification, the outfit specification wins.

Pose: Standing upright, confident, arms relaxed at sides, facing the camera directly. Full body head to feet visible, subject centred in frame.

The lighting must be professional studio high-key lighting for a clean lookbook aesthetic. Even, soft, no harsh shadows, no blown highlights.

Portrait format. Aspect ratio 3:4 (taller than wide). The subject must fill the vertical frame from head to toe with minimal headroom and no cropping at the feet.`;
}

type ComboGridKind = 'office' | 'evening' | 'relaxed';

function selectComboGridOutfits(outfits: ParsedOutfit[], kind: ComboGridKind): ParsedOutfit[] {
  const ranges: Record<ComboGridKind, [number, number][]> = {
    office: [[1, 1], [3, 3], [6, 6]],
    evening: [[11, 11], [13, 13], [15, 15]],
    relaxed: [[16, 16], [18, 18], [20, 20]],
  };
  const selected = ranges[kind]
    .map(([start]) => outfits.find(outfit => outfit.index === start))
    .filter((outfit): outfit is ParsedOutfit => !!outfit);

  if (selected.length >= 3) return selected.slice(0, 3);

  const fallback = outfits.filter(outfit => {
    if (kind === 'office') return outfit.index >= 1 && outfit.index <= 6;
    if (kind === 'evening') return outfit.index >= 11 && outfit.index <= 15;
    return outfit.index >= 16 && outfit.index <= 20;
  });

  return [...selected, ...fallback.filter(outfit => !selected.some(row => row.index === outfit.index))].slice(0, 3);
}

function buildComboGridPrompt(kind: ComboGridKind, outfits: ParsedOutfit[], c: ClassificationResult): string {
  const title: Record<ComboGridKind, string> = {
    office: 'Office basic combinations',
    evening: 'Evening outfit combinations',
    relaxed: 'Relaxed casual combinations',
  };
  const outfitLines = outfits.map((outfit, index) => {
    const pieces = [
      `Top: ${outfit.top}`,
      `Bottom: ${outfit.bottom}`,
      outfit.layer ? `Layer: ${outfit.layer}` : 'Layer: No layer',
      `Footwear: ${outfit.footwear}`,
      outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
      outfit.fitNote ? `Fit context: ${outfit.fitNote}` : null,
      outfit.colourLogic ? `Colour logic: ${outfit.colourLogic}` : null,
    ].filter(Boolean).join('; ');
    return `Column ${index + 1} / Outfit ${outfit.index}: ${pieces}`;
  }).join('\n');

  const groomingReferenceInstruction = isBeardFocusedClassification(c)
    ? 'Use the second reference image as the definitive face, bald/closely shaved scalp, and beard grooming reference. Do not add scalp hair.'
    : 'Use the second reference image as the definitive face and hairstyle reference.';

  return `Create one customised editorial styling grid image for ICONIK.

Two reference photos are provided: the first is the client's full-body photo and the second is the client's styled grooming headshot.
${groomingReferenceInstruction}

The output must be a single wide image with exactly 1 row and 3 equal vertical columns. Each column shows the same client standing full-body, facing camera, in a different outfit combination. No text, no labels, no product cards, no flat-lay items.

Grid theme: ${title[kind]}.

Use these three outfit combinations exactly:
${outfitLines}

Customisation rules:
- Preserve the client's body proportions, skin tone, face, and grooming reference.
- Dress the client in the specified clothing only; do not borrow garments from the source photo.
- Each column should feel related as one styling system, but the three looks must be visibly different.
- Clothes must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}.
- Colours and accessories must match the outfit descriptions precisely.
- No logos or brand markings.

Scene: clean premium studio lookbook, seamless cool slate grey backdrop (#94a6ad), even high-key lighting.

Composition: wide horizontal image, aspect ratio 3:1 or 16:9, one row, three columns. The full body must be visible head-to-toe in each column with minimal headroom and no cropped feet.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini image edit call
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiImageEdit(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  model: string = MODEL,
  extraImage?: { data: string; mimeType: string }, // optional second reference image (e.g. hairstyle headshot)
): Promise<string> {
  const primaryBytes = Buffer.byteLength(imageBase64, 'base64');
  const extraBytes = extraImage ? Buffer.byteLength(extraImage.data, 'base64') : 0;
  const parts: object[] = [
    { inlineData: { mimeType, data: imageBase64 } },
    ...(extraImage ? [{ inlineData: { mimeType: extraImage.mimeType, data: extraImage.data } }] : []),
    { text: prompt },
  ];

  console.log(`[callGeminiImageEdit] Calling model=${model}, mimeType=${mimeType}, bytes=${primaryBytes}, hasExtraImage=${!!extraImage}, extraBytes=${extraBytes}`);

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        responseModalities: ['IMAGE'],
        httpOptions: { timeout: GEMINI_IMAGE_TIMEOUT_MS },
      },
    });
  } catch (err) {
    const errorLike = err as { code?: unknown; status?: unknown; message?: unknown };
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[callGeminiImageEdit] Gemini request failed. model=${model} mimeType=${mimeType} bytes=${primaryBytes} code=${String(errorLike.code ?? 'unknown')} status=${String(errorLike.status ?? 'unknown')} message="${message.slice(0, 500)}"`);
    throw err;
  }

  const allParts = response.candidates?.[0]?.content?.parts ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagePart = allParts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart?.inlineData?.data) {
    // Capture any text the model returned — often explains a refusal or safety block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textPart = allParts.find((p: any) => typeof p.text === 'string');
    const modelText = textPart?.text?.slice(0, 500) ?? '(no text in response)';
    const finishReason = response.candidates?.[0]?.finishReason ?? 'unknown';
    console.error(`[callGeminiImageEdit] No image returned. model=${model} finishReason=${finishReason} modelText="${modelText}"`);
    throw new Error(`Gemini returned no image data (model=${model}, finishReason=${finishReason}): ${modelText}`);
  }

  return imagePart.inlineData.data as string; // base64
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanMimeType(contentType: string | null): string | null {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType || null;
}

async function normaliseImageForGemini(
  buffer: Buffer,
  sourceMimeType: string | null,
  url: string,
): Promise<{ data: string; mimeType: string }> {
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();
    const needsResize =
      (metadata.width ?? 0) > GEMINI_SOURCE_IMAGE_MAX_DIMENSION ||
      (metadata.height ?? 0) > GEMINI_SOURCE_IMAGE_MAX_DIMENSION;

    const output = await image
      .resize({
        width: GEMINI_SOURCE_IMAGE_MAX_DIMENSION,
        height: GEMINI_SOURCE_IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    const sourceHost = (() => {
      try { return new URL(url).host; } catch { return 'unknown-host'; }
    })();

    console.log(
      `[fetchAsBase64] Prepared Gemini image host=${sourceHost} sourceMime=${sourceMimeType ?? 'unknown'} ` +
      `sourceFormat=${metadata.format ?? 'unknown'} sourceBytes=${buffer.length} outputBytes=${output.length} ` +
      `width=${metadata.width ?? 'unknown'} height=${metadata.height ?? 'unknown'} resized=${needsResize}`,
    );

    if (output.length > GEMINI_INLINE_IMAGE_MAX_BYTES) {
      throw new Error(`Prepared image is too large for inline Gemini request (${output.length} bytes)`);
    }

    return {
      data: output.toString('base64'),
      mimeType: 'image/jpeg',
    };
  } catch (err) {
    const fallbackMimeType = SUPPORTED_GEMINI_INPUT_MIME_TYPES.has(sourceMimeType ?? '')
      ? sourceMimeType!
      : 'image/jpeg';
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[fetchAsBase64] Could not normalise source image; falling back to original bytes with mimeType=${fallbackMimeType}. error="${message.slice(0, 300)}"`);

    if (buffer.length > GEMINI_INLINE_IMAGE_MAX_BYTES) {
      throw new Error(`Source image is too large for inline Gemini request (${buffer.length} bytes) and could not be normalised: ${message}`);
    }

    return {
      data: buffer.toString('base64'),
      mimeType: fallbackMimeType,
    };
  }
}

async function fetchAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Image fetch returned an empty file: ${url}`);
  }
  return normaliseImageForGemini(buffer, cleanMimeType(res.headers.get('content-type')), url);
}

async function fetchFirstUsableImageAsBase64(
  candidates: Array<{ label: string; url?: string | null }>,
): Promise<{ data: string; mimeType: string }> {
  const errors: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.url) continue;

    try {
      const image = await fetchAsBase64(candidate.url);
      console.log(`[fetchFirstUsableImageAsBase64] Using ${candidate.label} source for Gemini image edit`);
      return image;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${candidate.label}: ${message}`);
      console.warn(`[fetchFirstUsableImageAsBase64] ${candidate.label} source unusable, trying fallback if available. error="${message.slice(0, 300)}"`);
    }
  }

  throw new Error(`No usable source photo found for Gemini image edit (${errors.join(' | ') || 'no URLs available'})`);
}

async function uploadToStorage(reportId: string, base64Data: string, filename: string): Promise<string> {
  const path   = `${reportId}/${filename}`;
  const buffer = Buffer.from(base64Data, 'base64');

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Storage upload failed [${filename}]: ${error.message}`);
  return path;
}

async function getSignedUrl(path: string, ttl = SIGNED_URL_TTL): Promise<string> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) throw new Error(`Signed URL failed for ${path}`);
  return data.signedUrl;
}


// ─────────────────────────────────────────────────────────────────────────────
// Concurrency + retry helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Run task functions with at most `limit` in-flight at once. */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  shouldStart: () => boolean = () => true,
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      if (!shouldStart()) break;
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/**
 * Retry fn up to maxAttempts times with exponential backoff.
 * Retries on transient Gemini errors: 503 overload, 429 rate limit, quota exceeded.
 * Hard failures (bad model, auth, safety block) throw immediately.
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5, baseDelayMs = 8_000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const isTransient =
        msg.includes('503') ||
        msg.includes('unavailable') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('resource_exhausted') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('too many requests') ||
        msg.includes('overloaded') ||
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        msg.includes('aborted');
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      const delayMs = baseDelayMs * Math.pow(2, attempt); // 8s → 16s → 32s → 64s
      const errSnippet = (err instanceof Error ? err.message : String(err)).slice(0, 200);
      console.warn(`[withRetry] Attempt ${attempt + 1}/${maxAttempts} failed (transient), retrying in ${delayMs / 1000}s… error: ${errSnippet}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — generation
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];

function isSafetyBlock(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('safety') || msg.includes('recitation') || msg.includes('prohibited') || msg.includes('blocked');
}

function isFaceFallbackCandidate(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    isSafetyBlock(err) ||
    msg.includes('unable to process input image') ||
    msg.includes('invalid_argument') ||
    msg.includes('returned no image data')
  );
}

/**
 * Run a face-image generation attempt with three layers of fallback:
 *   1. primary prompt + requested model
 *   2. soft prompt + requested model        (handles safety blocks on real faces)
 *   3. soft prompt + the other allowed model (handles model-specific refusals/input handling)
 * Each layer wraps `withRetry` so transient quota/503 errors still backoff.
 *
 * Lower base delay (3s) so the worst-case retry chain still fits inside the
 * 5-minute Vercel `after()` budget when this runs across 4 face slots in parallel.
 */
async function generateFaceSlotWithFallback(
  imageBase64: string,
  mimeType:    string,
  primaryPrompt: string,
  softPrompt:    string,
  imageModel:    string,
): Promise<string> {
  try {
    return await withRetry(
      () => callGeminiImageEdit(imageBase64, mimeType, primaryPrompt, imageModel),
      3,      // attempts
      3_000,  // 3s → 6s → 12s
    );
  } catch (err) {
    if (!isFaceFallbackCandidate(err)) throw err;
    const reason = isSafetyBlock(err) ? 'Safety block' : 'Face image edit failed';
    console.warn(`[generateFaceSlotWithFallback] ${reason} — retrying with soft prompt`);
  }

  try {
    return await withRetry(
      () => callGeminiImageEdit(imageBase64, mimeType, softPrompt, imageModel),
      2,
      3_000,
    );
  } catch (err) {
    if (!isFaceFallbackCandidate(err)) throw err;
    const fallbackModel = FALLBACK_IMAGE_MODELS.find(m => m !== imageModel) ?? imageModel;
    console.warn(`[generateFaceSlotWithFallback] Soft prompt failed too — falling back to model ${fallbackModel}`);
    return await withRetry(
      () => callGeminiImageEdit(imageBase64, mimeType, softPrompt, fallbackModel),
      2,
      3_000,
    );
  }
}

/**
 * Regenerate a list of missing face slots (hairstyle or eyewear) for a report.
 *
 * Returns an array aligned to `slots`: each entry is either the storage path
 * for that slot or `null` if generation ultimately failed. On any null, an
 * `error_message` is persisted to `man_reports` so the UI can surface it.
 */
export async function regenerateMissingFaceSlots(
  reportId:       string,
  submission:     ManIntakeSubmission,
  classification: ClassificationResult,
  kind:           FaceImageKind,
  slots:          number[], // 1-indexed slot numbers to regenerate
  imageModel:     string = MODEL,
): Promise<(string | null)[]> {
  if (slots.length === 0) return [];

  const photoUrl = submission.photo_headshot_url ?? submission.photo_fullbody_url;
  if (!photoUrl) {
    throw new Error(`No headshot or full-body photo on submission — cannot generate ${kind} images`);
  }

  const { data, mimeType } = await fetchFirstUsableImageAsBase64([
    { label: 'headshot', url: submission.photo_headshot_url },
    { label: 'full-body', url: submission.photo_fullbody_url },
  ]);
  const { face } = classification;
  const options = kind === 'hairstyle'
    ? face.hairstyle_recommendations
    : kind === 'beard'
      ? face.beard_style_recommendations ?? []
      : face.eyewear_shapes;

  const tasks = slots.map((slot) => {
    const optionText = options[slot - 1];
    if (!optionText) {
      console.warn(`[regenerateMissingFaceSlots] No ${kind} recommendation for slot ${slot}`);
      return Promise.resolve<string | null>(null);
    }

    const primaryPrompt = kind === 'hairstyle'
      ? buildHairstylePrompt(optionText, face.face_shape)
      : kind === 'beard'
        ? buildBeardPrompt(optionText, face.face_shape)
        : buildEyewearPrompt(optionText, face.face_shape);
    const softPrompt = kind === 'hairstyle'
      ? buildHairstylePromptSoft(optionText, face.face_shape)
      : kind === 'beard'
        ? buildBeardPromptSoft(optionText, face.face_shape)
        : buildEyewearPromptSoft(optionText, face.face_shape);

    console.log(`[regenerateMissingFaceSlots] Starting ${kind} ${slot}: "${optionText}" (model: ${imageModel})`);

    return generateFaceSlotWithFallback(data, mimeType, primaryPrompt, softPrompt, imageModel)
      .then(outputBase64 => uploadToStorage(reportId, outputBase64, `${kind}_${slot}.jpg`))
      .then(path => { console.log(`[regenerateMissingFaceSlots] ${kind} ${slot} saved: ${path}`); return path as string | null; })
      .catch(err => {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[regenerateMissingFaceSlots] ${kind} ${slot} FAILED (model: ${imageModel}): ${errMsg}`);
        // Fire-and-forget — surface the failure on the report so the admin sees it.
        void supabaseAdmin
          .from('man_reports')
          .update({
            error_message: `${kind === 'hairstyle' ? 'Hairstyle' : kind === 'beard' ? 'Beard' : 'Eyewear'} ${slot} failed: ${errMsg.slice(0, 400)}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId)
          .then(null, () => {});
        return null;
      });
  });

  return Promise.all(tasks);
}

/**
 * Regenerate a single face image slot (hairstyle or eyewear).
 * Uses the submission headshot when present, otherwise falls back to the full-body photo.
 * Overwrites the existing slot file in storage.
 */
export async function regenerateSingleFaceImage(
  reportId:       string,
  submission:     Pick<ManIntakeSubmission, 'photo_headshot_url' | 'photo_fullbody_url'>,
  classification: ClassificationResult,
  kind:           FaceImageKind,
  optionIndex:    number, // 1-indexed
  imageModel:     string = MODEL,
  styleOverride?:  string,
  storageFilename?: string,
): Promise<string> {
  if (![1, 2].includes(optionIndex)) {
    throw new Error(`Invalid ${kind} option index: ${optionIndex}`);
  }

  const photoUrl = submission.photo_headshot_url ?? submission.photo_fullbody_url;
  if (!photoUrl) {
    throw new Error('No headshot or full-body photo on submission — cannot regenerate face image');
  }

  const { data, mimeType } = await fetchFirstUsableImageAsBase64([
    { label: 'headshot', url: submission.photo_headshot_url },
    { label: 'full-body', url: submission.photo_fullbody_url },
  ]);
  const { face } = classification;
  const selectedOption = styleOverride?.trim() || (kind === 'hairstyle'
    ? face.hairstyle_recommendations[optionIndex - 1]
    : kind === 'beard'
      ? face.beard_style_recommendations?.[optionIndex - 1]
      : face.eyewear_shapes[optionIndex - 1]);

  if (!selectedOption) {
    throw new Error(`No ${kind} recommendation found for option ${optionIndex}`);
  }

  const primaryPrompt = kind === 'hairstyle'
    ? buildHairstylePrompt(selectedOption, face.face_shape)
    : kind === 'beard'
      ? buildBeardPrompt(selectedOption, face.face_shape)
      : buildEyewearPrompt(selectedOption, face.face_shape);
  const softPrompt = kind === 'hairstyle'
    ? buildHairstylePromptSoft(selectedOption, face.face_shape)
    : kind === 'beard'
      ? buildBeardPromptSoft(selectedOption, face.face_shape)
      : buildEyewearPromptSoft(selectedOption, face.face_shape);

  const outputBase64 = await generateFaceSlotWithFallback(data, mimeType, primaryPrompt, softPrompt, imageModel);

  return uploadToStorage(reportId, outputBase64, storageFilename ?? `${kind}_${optionIndex}.jpg`);
}

/**
 * Phase 4: Generate all 16 outfit images fully in parallel.
 * Takes the client's original full-body photo URL directly (not a storage path).
 * hairstylePaths and eyewearPaths must be passed in so partial progress writes don't overwrite them.
 * Returns array of storage paths (null where generation failed).
 */
export async function generateAllOutfitImages(
  reportId:       string,
  basePhotoUrl:   string,              // direct URL to the full-body photo
  classification: ClassificationResult,
  sections:       ReportSections,
  hairstylePaths: (string | null)[],   // preserved in every partial DB write
  _eyewearPaths:  (string | null)[],   // preserved by merge-safe writes at route level
  imageModel:     string = MODEL,
  existingOutfitPaths: (string | null)[] = [], // already-generated slots — skip on resume
  softDeadlineMs: number = Date.now() + 260_000,
): Promise<(string | null)[]> {
  const outfits = parseOutfitsFromSection(sections.s4_outfits);

  if (outfits.length === 0) {
    console.warn('[manImageGenerator] No outfits parsed from s4_outfits — skipping image generation');
    return [];
  }

  const highestOutfitIndex = outfits.reduce((max, outfit) => Math.max(max, outfit.index), 0);
  const totalOutfitSlots = Math.max(
    classification.outfit_split?.total ?? 0,
    existingOutfitPaths.length,
    highestOutfitIndex,
  );

  // Key every image slot by the declared outfit number, not by the parser's dense array index.
  // This prevents mismatches if Section 4 formatting causes any block to be skipped.
  const partialPaths: (string | null)[] = Array.from(
    { length: totalOutfitSlots },
    (_, i) => existingOutfitPaths[i] ?? null,
  );
  const toGenerate = outfits.filter(outfit => !partialPaths[outfit.index - 1]);

  const missingOutfitNumbers: number[] = [];
  for (let outfitNumber = 1; outfitNumber <= highestOutfitIndex; outfitNumber++) {
    if (!outfits.some(outfit => outfit.index === outfitNumber)) {
      missingOutfitNumbers.push(outfitNumber);
    }
  }
  if (missingOutfitNumbers.length > 0) {
    console.warn(
      `[manImageGenerator] Section 4 parser skipped outfit numbers: ${missingOutfitNumbers.join(', ')}`,
    );
  }

  console.log(`[manImageGenerator] ${toGenerate.length}/${outfits.length} outfit images to generate (model: ${imageModel})`);

  if (toGenerate.length === 0) return partialPaths;

  let progressWriteQueue = Promise.resolve();
  const queueProgressWrite = (taskIdx: number, path: string) => {
    const outfitPatch: (string | null | undefined)[] = [];
    outfitPatch[taskIdx] = path;

    progressWriteQueue = progressWriteQueue
      .then(() =>
        mergeManReportImagePathsForReport(
          reportId,
          { outfitCards: outfitPatch },
          {},
        ).then(() => undefined)
      )
      .catch((e: unknown) => {
        console.warn(
          `[manImageGenerator] Progress write failed for outfit ${taskIdx + 1}:`,
          e instanceof Error ? e.message : e,
        );
      });
  };

  // Fetch base photo and grooming reference concurrently — they're independent.
  // For beard-focused reports, the caller passes beardCards as this reference.
  const fetchGroomingRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    const groomingPath = hairstylePaths[0];
    if (!groomingPath) return undefined;
    try {
      const { data: signedData } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(groomingPath, 300);
      if (signedData?.signedUrl) return fetchAsBase64(signedData.signedUrl);
    } catch {
      console.warn('[manImageGenerator] Could not fetch grooming reference — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, groomingRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchGroomingRef(),
  ]);

  const tasks = toGenerate.map((outfit) => {
    const taskIdx = outfit.index - 1;
    return async () => {
      if (Date.now() >= softDeadlineMs) {
        console.warn(`[manImageGenerator] Soft deadline reached before outfit ${outfit.index} — leaving slot for next retry`);
        return null;
      }

      console.log(`[manImageGenerator] Starting outfit ${outfit.index}/${outfits.length} "${outfit.label}" (model: ${imageModel})`);
      try {
        const outputBase64 = await withRetry(() =>
          callGeminiImageEdit(baseData, baseMime, buildOutfitPrompt(outfit, classification), imageModel, groomingRef),
          3,
          4_000,
        );
        const path = await uploadToStorage(reportId, outputBase64, `outfit_${outfit.index}.jpg`);
        partialPaths[taskIdx] = path;
        console.log(`[manImageGenerator] Outfit ${outfit.index} saved: ${path}`);
        queueProgressWrite(taskIdx, path);
        return path;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[manImageGenerator] Outfit ${outfit.index} FAILED (model: ${imageModel}): ${errMsg}`);
        // Fire-and-forget error persist
        void supabaseAdmin
          .from('man_reports')
          .update({ error_message: `Outfit ${outfit.index} failed: ${errMsg.slice(0, 500)}`, updated_at: new Date().toISOString() })
          .eq('id', reportId)
          .then(null, () => {});
        return null;
      }
    };
  });

  await runWithConcurrency(tasks, OUTFIT_IMAGE_CONCURRENCY, () => Date.now() < softDeadlineMs);
  await progressWriteQueue;
  return partialPaths;
}

export async function generateComboGridImages(
  reportId: string,
  basePhotoUrl: string,
  classification: ClassificationResult,
  sections: ReportSections,
  groomingPaths: (string | null)[],
  imageModel: string = MODEL,
  existingComboGridPaths: ManReportImagePaths['comboGridCards'] = {},
): Promise<NonNullable<ManReportImagePaths['comboGridCards']>> {
  const outfits = parseOutfitsFromSection(sections.s4_outfits);
  const result: NonNullable<ManReportImagePaths['comboGridCards']> = {
    office: existingComboGridPaths?.office ?? null,
    evening: existingComboGridPaths?.evening ?? null,
    relaxed: existingComboGridPaths?.relaxed ?? null,
  };

  if (outfits.length === 0) {
    console.warn('[manImageGenerator] No outfits parsed from s4_outfits — skipping combo grids');
    return result;
  }

  const fetchGroomingRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    const groomingPath = groomingPaths[0];
    if (!groomingPath) return undefined;
    try {
      const { data: signedData } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(groomingPath, 300);
      if (signedData?.signedUrl) return fetchAsBase64(signedData.signedUrl);
    } catch {
      console.warn('[manImageGenerator] Could not fetch grooming reference for combo grids — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, groomingRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchGroomingRef(),
  ]);

  for (const kind of ['office', 'evening', 'relaxed'] as const) {
    if (result[kind]) continue;
    const selected = selectComboGridOutfits(outfits, kind);
    if (selected.length < 3) {
      console.warn(`[manImageGenerator] Not enough outfits for ${kind} combo grid`);
      continue;
    }

    try {
      const outputBase64 = await withRetry(() =>
        callGeminiImageEdit(baseData, baseMime, buildComboGridPrompt(kind, selected, classification), imageModel, groomingRef),
        3,
        4_000,
      );
      const path = await uploadToStorage(reportId, outputBase64, `combo_grid_${kind}.jpg`);
      result[kind] = path;
      await mergeManReportImagePathsForReport(reportId, { comboGridCards: { [kind]: path } });
      console.log(`[manImageGenerator] Combo grid ${kind} saved: ${path}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[manImageGenerator] Combo grid ${kind} FAILED (model: ${imageModel}): ${errMsg}`);
      void supabaseAdmin
        .from('man_reports')
        .update({ error_message: `Combo grid ${kind} failed: ${errMsg.slice(0, 500)}`, updated_at: new Date().toISOString() })
        .eq('id', reportId)
        .then(null, () => {});
    }
  }

  return result;
}

/**
 * Regenerate a single outfit image from an edited outfit text block.
 * Overwrites the existing outfit_N.jpg in storage.
 * Takes the full-body photo URL directly (from submission.photo_fullbody_url).
 * Returns the storage path (same as before, just re-uploaded).
 */
export async function regenerateSingleOutfitImage(
  reportId:            string,
  outfitNumber:        number,          // 1-indexed (1–16)
  outfitText:          string,          // raw markdown block for this outfit
  basePhotoUrl:        string,          // direct URL to full-body photo
  classification:      ClassificationResult,
  imageModel:          string = MODEL,
  hairstyleHeadshotUrl?: string | null, // optional hairstyle headshot for face/hair reference
  storageFilename?:     string,
): Promise<string> {
  const parsed = parseOutfitsFromSection(outfitText);
  if (parsed.length === 0) throw new Error(`Could not parse outfit from text block`);

  const outfit = parsed[0];

  const [{ data: baseData, mimeType: baseMime }, hairstyleRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    hairstyleHeadshotUrl
      ? fetchAsBase64(hairstyleHeadshotUrl).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const prompt       = buildOutfitPrompt(outfit, classification);
  const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt, imageModel, hairstyleRef ?? undefined);

  return uploadToStorage(reportId, outputBase64, storageFilename ?? `outfit_${outfitNumber}.jpg`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — resolution (paths → signed URLs for serving)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert stored image_urls paths → fresh signed URLs.
 * Call this in API route handlers before returning report data to clients.
 * Handles both new format (hairstyleCards) and legacy format (baseModel).
 */
export async function resolveManReportImageUrls(
  paths: ManReportImagePaths | null | undefined,
): Promise<ResolvedImageUrls | null> {
  if (!paths) return null;

  // Resolve hairstyle cards.
  // New format: hairstyleCards array is present (even if it contains nulls for failed images).
  // Legacy format: only baseModel exists — treat it as a single hairstyle card.
  // Distinguish "no hairstyleCards key" (undefined) from "empty array" ([]): if the key
  // exists (even as []), trust it — don't fall back to baseModel for new-format reports.
  const hairstylePaths: (string | null)[] = paths.hairstyleCards !== undefined
    ? paths.hairstyleCards
    : paths.baseModel ? [paths.baseModel] : [];
  const beardPaths: (string | null)[] = paths.beardCards ?? [];

  // Collect every non-null path in a single flat list for one batch signing call
  const allPaths = [
    ...hairstylePaths,
    ...beardPaths,
    ...(paths.eyewearCards ?? []),
    ...(paths.outfitCards  ?? []),
    paths.comboGridCards?.office ?? null,
    paths.comboGridCards?.evening ?? null,
    paths.comboGridCards?.relaxed ?? null,
    paths.baseModel ?? null,
  ];
  const uniquePaths = [...new Set(allPaths.filter((p): p is string => !!p))];

  const signedUrlMap = new Map<string, string>();

  if (uniquePaths.length > 0) {
    const { data: signed, error: batchError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrls(uniquePaths, SIGNED_URL_TTL);

    if (batchError) {
      console.error('[manImageGenerator] createSignedUrls batch failed:', batchError.message);
    }

    for (const { path, signedUrl } of signed ?? []) {
      if (path && signedUrl) signedUrlMap.set(path, signedUrl);
    }

    // Retry any missing entries individually. The bucket is private, so public URLs are not valid fallback.
    for (const path of uniquePaths) {
      if (!signedUrlMap.has(path)) {
        try {
          signedUrlMap.set(path, await getSignedUrl(path));
        } catch (error) {
          console.warn(
            `[manImageGenerator] Individual signed URL retry failed for "${path}":`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    }
  }

  const resolve = (path: string | null | undefined): string | null =>
    path ? (signedUrlMap.get(path) ?? null) : null;

  return {
    hairstyleCards: hairstylePaths.map(resolve),
    beardCards:     beardPaths.map(resolve),
    eyewearCards:   (paths.eyewearCards ?? []).map(resolve),
    outfitCards:    (paths.outfitCards  ?? []).map(resolve),
    comboGridCards: {
      office: resolve(paths.comboGridCards?.office),
      evening: resolve(paths.comboGridCards?.evening),
      relaxed: resolve(paths.comboGridCards?.relaxed),
    },
    baseModel:      resolve(paths.baseModel),
  };
}
