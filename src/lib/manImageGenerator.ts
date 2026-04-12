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

  return `Editorial menswear portrait. The subject is the person in the reference photo — preserve their face, skin tone, eye colour, and body proportions exactly. Do not alter or idealise the body in any way.

Hair: Style the hair as: ${hairstyle}. Natural and groomed for a ${faceShape} face shape. Do not change face, skin tone, or facial features.

Pose: Standing upright, relaxed and confident. Arms at sides. Facing the camera directly. Full body visible from head to feet, subject centred in frame.

Background: Clean, flat, solid #94a6ad (cool slate grey). No texture, no gradient, no shadow spill onto the background. Subject edges clean against the background.

Lighting: High-end editorial — soft, even light from slightly above. Clean skin tone rendering. No harsh shadows, no blown highlights.

Do not add props, text, furniture, or any additional elements. Portrait format.`;
}

function buildOutfitPrompt(outfit: ParsedOutfit, c: ClassificationResult): string {
  const garmentLines = [
    `Top: ${outfit.top}`,
    `Bottom: ${outfit.bottom}`,
    outfit.layer ? `Layer: ${outfit.layer}` : null,
    `Footwear: ${outfit.footwear}`,
    outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
  ].filter(Boolean).join('\n');

  const fitNote = outfit.fitNote ? `\nFit: ${outfit.fitNote}` : '';

  return `Editorial menswear portrait. The subject is the person in the reference photo — preserve their face, skin tone, and body proportions exactly. Do not alter or idealise the body.

Wearing this:
${garmentLines}${fitNote}

Pose: Standing upright, relaxed and confident, arms at sides, facing the camera directly. Full body visible from head to feet. Same stance as the reference image.

Background: Same flat solid #94a6ad (cool slate grey) as the reference image. Clean, no texture, no gradient.

Lighting: Match the editorial lighting from the reference image — soft, even, from slightly above.

Garment rendering: Clothes should look pressed and naturally worn — not floating, not distorted. Colours must be accurate to the description. No logos or brand markings visible.

Body silhouette (${c.body.silhouette_type}): ${c.body.fit_directive}. Highlight zone: ${c.body.highlight_zone}. The garments should suit this body type — ${c.body.silhouette_rules.slice(0, 2).join('; ')}.

Do not use skinny jeans, slim-tapered trousers, or fitted/muscle-fit tops. Trousers must have a clean, non-constricting silhouette.`;
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
  const baseSignedUrl                   = await getSignedUrl(baseModelPath, 300);
  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(baseSignedUrl);

  const tasks = outfits.map((outfit) => async () => {
    const prompt       = buildOutfitPrompt(outfit, classification);
    const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt, imageModel);
    return uploadToStorage(reportId, outputBase64, `outfit_${outfit.index}.jpg`);
  });

  return withConcurrency(tasks, 4);
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
