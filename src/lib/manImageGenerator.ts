// manImageGenerator.ts
// Phase 3 & 4 of the /man report pipeline: image generation via Gemini.
//
// Phase 3 — Base model (1 call):
//   Client's full-body photo → recommended hairstyle + #94a6ad bg + editorial lighting
//
// Phase 4 — Outfit images (16 calls, concurrency 4):
//   Base model image → each of the 16 outfits applied
//
// image_urls in the DB stores storage paths (not signed URLs).
// resolveManReportImageUrls() converts paths → fresh signed URLs at serve time.

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from './supabase';
import type { ClassificationResult, ReportSections } from './manReportGenerator';
import type { ManIntakeSubmission } from './supabaseMan';

const ai     = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL  = 'gemini-3.1-flash-image-preview';
const BUCKET = 'man-report-images';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days — refreshed on every fetch

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape stored in image_urls JSONB column — storage paths, not URLs */
export interface ManReportImagePaths {
  baseModel: string;
  outfitCards: (string | null)[];
}

/** Shape returned to clients — signed URLs ready for <img> tags */
export interface ResolvedImageUrls {
  baseModel: string | null;
  outfitCards: (string | null)[];
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

function parseOutfitsFromSection(s4Text: string): ParsedOutfit[] {
  const outfits: ParsedOutfit[] = [];
  const blocks = s4Text.split(/(?=\*\*Outfit\s+\d+)/i);

  for (const block of blocks) {
    const header = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
    if (!header) continue;

    // Grabs everything after "Label:" up to the next field marker or double newline
    const field = (label: string): string => {
      const m = block.match(new RegExp(`[-•]\\s*${label}\\s*:\\s*([^\\n]+)`, 'i'));
      return m ? m[1].replace(/\*\*/g, '').trim() : '';
    };

    const layerRaw       = field('Layer(?:/Outerwear)?');
    const accessoriesRaw = field('Accessories');
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

function buildBaseModelPrompt(c: ClassificationResult): string {
  const hairstyle = c.face.hairstyle_recommendations[0];
  const faceShape = c.face.face_shape;

  return `Professional editorial fashion catalogue photography.

STERNLY IGNORE and COMPLETELY DISCARD the original background from the uploaded photo.

Extract ONLY the subject's face, features, and body proportions. Preserve their exact skin tone, facial features, eye colour, and body shape — do not alter, slim, or idealise.

Place the subject against a professional studio cyclorama wall in #94a6ad (cool slate grey). Clean seamless backdrop, no texture, no gradient, no props.

Apply polished grooming throughout. Style the hair as: ${hairstyle} — natural and intentional for a ${faceShape} face shape.

Pose: Standing upright, confident, arms relaxed at sides, facing the camera directly. Full body head to feet visible, subject centred in frame.

The lighting must be professional studio high-key lighting for a clean lookbook aesthetic. Even, flat, no harsh shadows, no blown highlights. Consistent skin tone rendering.

Do not add text, furniture, or decorative elements. Portrait format. Aspect ratio 3:4 (taller than wide). The subject must fill the vertical frame from head to toe with minimal headroom and no cropping at the feet.`;
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

STERNLY IGNORE and COMPLETELY DISCARD the original background from the reference photo.

Extract ONLY the subject's face, features, and body proportions from the reference image. Preserve their exact skin tone, facial features, and body shape — do not alter, slim, or idealise.

Place the subject against our brand studio cyclorama wall in #94a6ad (cool slate grey). Clean seamless backdrop, no texture, no gradient.

Apply polished grooming — clean, fresh, well-kept. No changes to facial features or skin tone.

Dress the subject in this specific outfit:
${garmentLines}${fitNote}

Garment rendering: Clothes should look pressed, tailored, and naturally worn on this body — not floating, not distorted. Colour accuracy is critical — match the described colours precisely. No logos or brand markings visible. Garments must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}.

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
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [{
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: prompt },
      ],
    }],
    config: { responseModalities: ['IMAGE'] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) =>
    p.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini returned no image data');
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
// Concurrency helper — no p-limit dependency needed
// ─────────────────────────────────────────────────────────────────────────────

async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      try {
        results[i] = await tasks[i]();
      } catch (err) {
        console.error(`[manImageGenerator] Task ${i} failed:`, err instanceof Error ? err.message : err);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phase 3: Generate base model image from client's full-body photo.
 * Applies recommended hairstyle, ICONIK slate background, editorial lighting.
 * Returns storage path (e.g. "{reportId}/base.jpg").
 */
export async function generateBaseModel(
  reportId:       string,
  submission:     ManIntakeSubmission,
  classification: ClassificationResult,
  imageModel:     string = MODEL,
): Promise<string> {
  if (!submission.photo_fullbody_url) {
    throw new Error('No photo_fullbody_url on submission — cannot generate base model');
  }

  const { data, mimeType } = await fetchAsBase64(submission.photo_fullbody_url);
  const prompt             = buildBaseModelPrompt(classification);
  const outputBase64       = await callGeminiImageEdit(data, mimeType, prompt, imageModel);

  return uploadToStorage(reportId, outputBase64, 'base.jpg');
}

/**
 * Phase 4: Generate all 16 outfit images from the base model.
 * Runs with concurrency limit of 4.
 * Returns array of storage paths (null where generation failed).
 */
export async function generateAllOutfitImages(
  reportId:        string,
  baseModelPath:   string,
  classification:  ClassificationResult,
  sections:        ReportSections,
  imageModel:      string = MODEL,
): Promise<(string | null)[]> {
  const outfits = parseOutfitsFromSection(sections.s4_outfits);

  if (outfits.length === 0) {
    console.warn('[manImageGenerator] No outfits parsed from s4_outfits — skipping image generation');
    return [];
  }

  console.log(`[manImageGenerator] Generating ${outfits.length} outfit images with concurrency 4 (model: ${imageModel})`);

  // Fetch base model once (short-lived signed URL for internal use)
  const baseSignedUrl                        = await getSignedUrl(baseModelPath, 300);
  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(baseSignedUrl);

  // Pre-allocate so we can write partial progress to the DB after each upload.
  // If Vercel kills the after() callback mid-generation, whatever completed is already persisted.
  const partialPaths: (string | null)[] = new Array(outfits.length).fill(null);

  const tasks = outfits.map((outfit, taskIdx) => async () => {
    const prompt       = buildOutfitPrompt(outfit, classification);
    const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt, imageModel);
    const path         = await uploadToStorage(reportId, outputBase64, `outfit_${outfit.index}.jpg`);

    // Persist immediately — don't wait for all outfits to finish
    partialPaths[taskIdx] = path;
    await supabaseAdmin
      .from('man_reports')
      .update({
        image_urls:  { baseModel: baseModelPath, outfitCards: [...partialPaths] },
        updated_at:  new Date().toISOString(),
      })
      .eq('id', reportId);

    return path;
  });

  return withConcurrency(tasks, 4);
}

/**
 * Regenerate a single outfit image from an edited outfit text block.
 * Overwrites the existing outfit_N.jpg in storage.
 * Returns the storage path (same as before, just re-uploaded).
 */
export async function regenerateSingleOutfitImage(
  reportId:       string,
  outfitNumber:   number,           // 1-indexed (1–16)
  outfitText:     string,           // raw markdown block for this outfit
  baseModelPath:  string,
  classification: ClassificationResult,
  imageModel:     string = MODEL,
): Promise<string> {
  const parsed = parseOutfitsFromSection(outfitText);
  if (parsed.length === 0) throw new Error(`Could not parse outfit from text block`);

  const outfit = parsed[0];

  const baseSignedUrl                          = await getSignedUrl(baseModelPath, 300);
  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(baseSignedUrl);

  const prompt       = buildOutfitPrompt(outfit, classification);
  const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt, imageModel);

  return uploadToStorage(reportId, outputBase64, `outfit_${outfitNumber}.jpg`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — resolution (paths → signed URLs for serving)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert stored image_urls paths → fresh signed URLs.
 * Call this in API route handlers before returning report data to clients.
 */
export async function resolveManReportImageUrls(
  paths: ManReportImagePaths | null | undefined,
): Promise<ResolvedImageUrls | null> {
  if (!paths) return null;

  const resolveOne = async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;

    // 1. Try signed URL (works for both public and private buckets)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    if (signedData?.signedUrl) return signedData.signedUrl;

    console.error(`[manImageGenerator] createSignedUrl failed for "${path}":`, signedError?.message ?? 'no signedUrl returned');

    // 2. Fall back to public URL (works if bucket is set to public)
    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    if (publicData?.publicUrl) {
      console.warn(`[manImageGenerator] Using public URL fallback for "${path}"`);
      return publicData.publicUrl;
    }

    return null;
  };

  const allPaths = [paths.baseModel, ...(paths.outfitCards ?? [])];
  const allUrls  = await Promise.all(allPaths.map(resolveOne));
  const [baseModel, ...outfitCards] = allUrls;

  return { baseModel: baseModel ?? null, outfitCards };
}
