// manImageGenerator.ts
// Phase 3 & 4 of the /man report pipeline: image generation via Gemini.
//
// Phase 3 — Hairstyle images (2 calls, parallel):
//   Client's HEADSHOT → 2 hairstyle variants applied, background kept as-is
//
// Phase 4 — Outfit images (16 calls, fully parallel):
//   Client's FULL-BODY PHOTO → each of the 16 outfits applied
//
// image_urls in the DB stores storage paths (not signed URLs).
// resolveManReportImageUrls() converts paths → fresh signed URLs at serve time.

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from './supabase';
import type { ClassificationResult, ReportSections } from './manReportGenerator';
import type { ManIntakeSubmission } from './supabaseMan';
import { revalidateManReportCache } from './manReportCache';

const ai     = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL  = 'gemini-3.1-flash-image-preview';
const BUCKET = 'man-report-images';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days — refreshed on every fetch
const GEMINI_IMAGE_TIMEOUT_MS = 45_000;
const OUTFIT_IMAGE_CONCURRENCY = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape stored in image_urls JSONB column — storage paths, not URLs */
export interface ManReportImagePaths {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  eyewearCards:   (string | null)[]; // 2 headshot eyewear variants
  outfitCards:    (string | null)[];
  baseModel?:     string;            // legacy — kept for backward compat with old reports
}

/** Shape returned to clients — signed URLs ready for <img> tags */
export interface ResolvedImageUrls {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  eyewearCards:   (string | null)[]; // 2 headshot eyewear variants
  outfitCards:    (string | null)[];
  baseModel?:     string | null;     // legacy
}

export type FaceImageKind = 'hairstyle' | 'eyewear';

interface PartialImagePathPatch {
  hairstyleCards?: (string | null | undefined)[];
  eyewearCards?: (string | null | undefined)[];
  outfitCards?: (string | null | undefined)[];
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
    eyewearCards:   (paths?.eyewearCards   ?? []).map(normaliseImagePath),
    outfitCards:    (paths?.outfitCards    ?? []).map(normaliseImagePath),
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
    eyewearCards:   mergeImagePathArrays(base.eyewearCards, incoming?.eyewearCards),
    outfitCards:    mergeImagePathArrays(base.outfitCards, incoming?.outfitCards),
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
// Extracts the 16 structured outfits from Section 4 markdown text
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

function stripHex(text: string): string {
  return text.replace(/\s*\(#?[0-9A-Fa-f]{3,6}\)/g, '').trim();
}

function parseOutfitsFromSection(s4Text: string): ParsedOutfit[] {
  const outfits: ParsedOutfit[] = [];
  // Split on either bold format "**Outfit N" or plain uppercase "OUTFIT N"
  const blocks = s4Text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);

  for (const block of blocks) {
    const boldMatch  = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
    const plainMatch = block.match(/^OUTFIT\s+(\d+)\s*[—–-]\s*(.+)/im);
    const header     = boldMatch ?? plainMatch;
    if (!header) continue;

    // Field extractor handles all known formats:
    //   Old: "- Label: value" or "• Label: value"
    //   New: "LABEL: value" (plain uppercase, no dash)
    //   Edited: "**Label:** value" / "- **Label:** value"
    const field = (label: string): string => {
      const pattern = new RegExp(
        `(?:^|\\n)[ \\t]*[-•]?[ \\t]*\\*{0,2}${label}\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2}(.+?)\\*{0,2}(?=\\n[ \\t]*[-•]?[ \\t]*\\*{0,2}[A-Za-z]|\\n\\n|\\n\\*\\*Outfit|\\nOUTFIT|$)`,
        'is',
      );
      const raw = block.match(pattern)?.[1]?.replace(/\n/g, ' ').trim() ?? '';
      return stripHex(raw);
    };

    const layerRaw       = field('Layer(?:/Outerwear)?');
    const accessoriesRaw = field('Accessory(?:ies)?');
    const fitNoteRaw     = field('Fit note');
    const colourLogicRaw = field('Colour logic');

    outfits.push({
      index:       parseInt(header[1], 10),
      label:       header[2].trim(),
      top:         field('Top'),
      bottom:      field('Bottom'),
      layer:       layerRaw && !/no layer/i.test(layerRaw) ? layerRaw : null,
      footwear:    field('Footwear'),
      accessories: accessoriesRaw || null,
      fitNote:     fitNoteRaw || null,
      colourLogic: colourLogicRaw || null,
    });
  }

  return outfits.sort((a, b) => a.index - b.index);
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────────────────────────────────────

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

// Softer prompt used as a safety-block fallback. Drops "preserve real face features"
// language that frequently triggers Gemini's image-safety filter on portraits.
function buildHairstylePromptSoft(hairstyle: string, faceShape: string): string {
  return `Editorial men's grooming reference photo. A young man with a ${faceShape} face shape, photographed in soft studio light, head and shoulders only.

The hair is styled in this exact style: ${hairstyle}. The hair should look polished, well-groomed, and realistic, with a natural texture.

The image should match the upload as closely as is reasonable in skin tone, build, and framing — interpret this as a styling reference, not as identity preservation.

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

  return `Professional editorial fashion catalogue photography.

Two reference photos are provided: the first is a full-body photo, the second is a styled headshot showing the subject's recommended hairstyle.

STERNLY IGNORE and COMPLETELY DISCARD the original background from both reference photos.

Extract the subject's face and hairstyle from the HEADSHOT (second image) — use this as the definitive face and hair reference. Extract the body proportions and shape from the FULL-BODY photo (first image). Preserve their exact skin tone, facial features, and body shape — do not alter, slim, or idealise.

CRITICAL CLOTHING INSTRUCTION:
- Remove and discard the original clothing from BOTH reference photos
- Do not preserve, copy, blend, reinterpret, or borrow any garments, shoes, accessories, collars, lapels, colours, or silhouettes from either reference image
- The outfit specification below is the ONLY authority for what the subject wears

Place the subject against our brand studio cyclorama wall in #94a6ad (cool slate grey). Clean seamless backdrop, no texture, no gradient.

Apply polished grooming — clean, fresh, well-kept. Carry the hairstyle from the headshot reference exactly into this full-body render. No changes to facial features or skin tone.

Dress the subject in this specific outfit:
${garmentLines}${fitNote}

Garment rendering: Clothes should look pressed, tailored, and naturally worn on this body — not floating, not distorted. Colour accuracy is critical — match the described colours precisely. No logos or brand markings visible. Garments must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}. If there is any conflict between the reference photos and the outfit specification, the outfit specification wins.

Pose: Standing upright, confident, arms relaxed at sides, facing the camera directly. Full body head to feet visible, subject centred in frame.

The lighting must be professional studio high-key lighting for a clean lookbook aesthetic. Even, soft, no harsh shadows, no blown highlights.

Portrait format. Aspect ratio 3:4 (taller than wide). The subject must fill the vertical frame from head to toe with minimal headroom and no cropping at the feet.`;
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
  const parts: object[] = [
    { inlineData: { mimeType, data: imageBase64 } },
    ...(extraImage ? [{ inlineData: { mimeType: extraImage.mimeType, data: extraImage.data } }] : []),
    { text: prompt },
  ];

  console.log(`[callGeminiImageEdit] Calling model=${model}, hasExtraImage=${!!extraImage}`);

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      responseModalities: ['IMAGE'],
      httpOptions: { timeout: GEMINI_IMAGE_TIMEOUT_MS },
    },
  });

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

async function fetchAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  return {
    data:     Buffer.from(buffer).toString('base64'),
    mimeType: res.headers.get('content-type') ?? 'image/jpeg',
  };
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

/**
 * Run a face-image generation attempt with three layers of fallback:
 *   1. primary prompt + requested model
 *   2. soft prompt + requested model        (handles safety blocks on real faces)
 *   3. soft prompt + the other allowed model (handles model-specific refusals)
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
    if (!isSafetyBlock(err)) throw err;
    console.warn('[generateFaceSlotWithFallback] Safety block — retrying with soft prompt');
  }

  try {
    return await withRetry(
      () => callGeminiImageEdit(imageBase64, mimeType, softPrompt, imageModel),
      2,
      3_000,
    );
  } catch (err) {
    if (!isSafetyBlock(err)) throw err;
    const fallbackModel = FALLBACK_IMAGE_MODELS.find(m => m !== imageModel) ?? imageModel;
    console.warn(`[generateFaceSlotWithFallback] Soft prompt blocked too — falling back to model ${fallbackModel}`);
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

  const { data, mimeType } = await fetchAsBase64(photoUrl);
  const { face } = classification;
  const options = kind === 'hairstyle' ? face.hairstyle_recommendations : face.eyewear_shapes;

  const tasks = slots.map((slot) => {
    const optionText = options[slot - 1];
    if (!optionText) {
      console.warn(`[regenerateMissingFaceSlots] No ${kind} recommendation for slot ${slot}`);
      return Promise.resolve<string | null>(null);
    }

    const primaryPrompt = kind === 'hairstyle'
      ? buildHairstylePrompt(optionText, face.face_shape)
      : buildEyewearPrompt(optionText, face.face_shape);
    const softPrompt = kind === 'hairstyle'
      ? buildHairstylePromptSoft(optionText, face.face_shape)
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
            error_message: `${kind === 'hairstyle' ? 'Hairstyle' : 'Eyewear'} ${slot} failed: ${errMsg.slice(0, 400)}`,
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
): Promise<string> {
  if (![1, 2].includes(optionIndex)) {
    throw new Error(`Invalid ${kind} option index: ${optionIndex}`);
  }

  const photoUrl = submission.photo_headshot_url ?? submission.photo_fullbody_url;
  if (!photoUrl) {
    throw new Error('No headshot or full-body photo on submission — cannot regenerate face image');
  }

  const { data, mimeType } = await fetchAsBase64(photoUrl);
  const { face } = classification;
  const selectedOption = kind === 'hairstyle'
    ? face.hairstyle_recommendations[optionIndex - 1]
    : face.eyewear_shapes[optionIndex - 1];

  if (!selectedOption) {
    throw new Error(`No ${kind} recommendation found for option ${optionIndex}`);
  }

  const prompt = kind === 'hairstyle'
    ? buildHairstylePrompt(selectedOption, face.face_shape)
    : buildEyewearPrompt(selectedOption, face.face_shape);

  const outputBase64 = await withRetry(() =>
    callGeminiImageEdit(data, mimeType, prompt, imageModel),
  );

  return uploadToStorage(reportId, outputBase64, `${kind}_${optionIndex}.jpg`);
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

  // Fetch base photo and hairstyle reference concurrently — they're independent
  const fetchHairstyleRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    const hairstylePath = hairstylePaths[0];
    if (!hairstylePath) return undefined;
    try {
      const { data: signedData } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(hairstylePath, 300);
      if (signedData?.signedUrl) return fetchAsBase64(signedData.signedUrl);
    } catch {
      console.warn('[manImageGenerator] Could not fetch hairstyle reference — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, hairstyleRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchHairstyleRef(),
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
          callGeminiImageEdit(baseData, baseMime, buildOutfitPrompt(outfit, classification), imageModel, hairstyleRef),
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

  return uploadToStorage(reportId, outputBase64, `outfit_${outfitNumber}.jpg`);
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

  // Collect every non-null path in a single flat list for one batch signing call
  const allPaths = [
    ...hairstylePaths,
    ...(paths.eyewearCards ?? []),
    ...(paths.outfitCards  ?? []),
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
    eyewearCards:   (paths.eyewearCards ?? []).map(resolve),
    outfitCards:    (paths.outfitCards  ?? []).map(resolve),
    baseModel:      resolve(paths.baseModel),
  };
}
