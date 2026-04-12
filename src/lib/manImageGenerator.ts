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

const ai     = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MODEL  = 'gemini-3.1-flash-image-preview';
const BUCKET = 'man-report-images';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days — refreshed on every fetch

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape stored in image_urls JSONB column — storage paths, not URLs */
export interface ManReportImagePaths {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  outfitCards:    (string | null)[];
  baseModel?:     string;            // legacy — kept for backward compat with old reports
}

/** Shape returned to clients — signed URLs ready for <img> tags */
export interface ResolvedImageUrls {
  hairstyleCards: (string | null)[]; // 2 headshot hairstyle variants
  outfitCards:    (string | null)[];
  baseModel?:     string | null;     // legacy
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
// Public API — generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phase 3: Generate 2 hairstyle variant headshots from the client's headshot photo.
 * Uses hairstyle_recommendations[0] and [1]. Background is kept unchanged.
 * Returns [path1, path2] — either may be null if that variant failed.
 */
export async function generateHairstyleImages(
  reportId:       string,
  submission:     ManIntakeSubmission,
  classification: ClassificationResult,
  imageModel:     string = MODEL,
): Promise<(string | null)[]> {
  const photoUrl = submission.photo_headshot_url ?? submission.photo_fullbody_url;
  if (!photoUrl) {
    throw new Error('No headshot or full-body photo on submission — cannot generate hairstyle images');
  }

  const { data, mimeType } = await fetchAsBase64(photoUrl);
  const { face } = classification;
  const hairstyles = face.hairstyle_recommendations.slice(0, 2);

  const tasks = hairstyles.map((hairstyle, i) =>
    callGeminiImageEdit(data, mimeType, buildHairstylePrompt(hairstyle, face.face_shape), imageModel)
      .then(outputBase64 => uploadToStorage(reportId, outputBase64, `hairstyle_${i + 1}.jpg`))
      .catch(err => {
        console.error(`[manImageGenerator] Hairstyle variant ${i + 1} failed:`, err instanceof Error ? err.message : err);
        return null;
      })
  );

  return Promise.all(tasks);
}

/**
 * Phase 4: Generate all 16 outfit images fully in parallel.
 * Takes the client's original full-body photo URL directly (not a storage path).
 * hairstylePaths must be passed in so partial progress writes don't overwrite them.
 * Returns array of storage paths (null where generation failed).
 */
export async function generateAllOutfitImages(
  reportId:       string,
  basePhotoUrl:   string,              // direct URL to the full-body photo
  classification: ClassificationResult,
  sections:       ReportSections,
  hairstylePaths: (string | null)[],   // preserved in every partial DB write
  imageModel:     string = MODEL,
): Promise<(string | null)[]> {
  const outfits = parseOutfitsFromSection(sections.s4_outfits);

  if (outfits.length === 0) {
    console.warn('[manImageGenerator] No outfits parsed from s4_outfits — skipping image generation');
    return [];
  }

  console.log(`[manImageGenerator] Generating ${outfits.length} outfit images fully parallel (model: ${imageModel})`);

  // Fetch the full-body reference photo once, reuse across all 16 calls
  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(basePhotoUrl);

  // Pre-allocate for partial progress writes
  const partialPaths: (string | null)[] = new Array(outfits.length).fill(null);

  const tasks = outfits.map((outfit, taskIdx) =>
    callGeminiImageEdit(baseData, baseMime, buildOutfitPrompt(outfit, classification), imageModel)
      .then(outputBase64 => uploadToStorage(reportId, outputBase64, `outfit_${outfit.index}.jpg`))
      .then(async path => {
        partialPaths[taskIdx] = path;
        // Always include hairstylePaths so they are never overwritten by outfit progress writes
        await supabaseAdmin
          .from('man_reports')
          .update({
            image_urls:  { hairstyleCards: hairstylePaths, outfitCards: [...partialPaths] },
            updated_at:  new Date().toISOString(),
          })
          .eq('id', reportId);
        return path;
      })
      .catch(err => {
        console.error(`[manImageGenerator] Outfit ${outfit.index} failed:`, err instanceof Error ? err.message : err);
        return null;
      })
  );

  return Promise.all(tasks);
}

/**
 * Regenerate a single outfit image from an edited outfit text block.
 * Overwrites the existing outfit_N.jpg in storage.
 * Takes the full-body photo URL directly (from submission.photo_fullbody_url).
 * Returns the storage path (same as before, just re-uploaded).
 */
export async function regenerateSingleOutfitImage(
  reportId:       string,
  outfitNumber:   number,     // 1-indexed (1–16)
  outfitText:     string,     // raw markdown block for this outfit
  basePhotoUrl:   string,     // direct URL to full-body photo
  classification: ClassificationResult,
  imageModel:     string = MODEL,
): Promise<string> {
  const parsed = parseOutfitsFromSection(outfitText);
  if (parsed.length === 0) throw new Error(`Could not parse outfit from text block`);

  const outfit = parsed[0];

  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(basePhotoUrl);

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
 * Handles both new format (hairstyleCards) and legacy format (baseModel).
 */
export async function resolveManReportImageUrls(
  paths: ManReportImagePaths | null | undefined,
): Promise<ResolvedImageUrls | null> {
  if (!paths) return null;

  const resolveOne = async (path: string | null | undefined): Promise<string | null> => {
    if (!path) return null;

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    if (signedData?.signedUrl) return signedData.signedUrl;

    console.error(`[manImageGenerator] createSignedUrl failed for "${path}":`, signedError?.message ?? 'no signedUrl returned');

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    if (publicData?.publicUrl) {
      console.warn(`[manImageGenerator] Using public URL fallback for "${path}"`);
      return publicData.publicUrl;
    }

    return null;
  };

  // Resolve hairstyle cards.
  // New format: hairstyleCards array is present (even if it contains nulls for failed images).
  // Legacy format: only baseModel exists — treat it as a single hairstyle card.
  // Distinguish "no hairstyleCards key" (undefined) from "empty array" ([]): if the key
  // exists (even as []), trust it — don't fall back to baseModel for new-format reports.
  const hairstylePaths: (string | null)[] = paths.hairstyleCards !== undefined
    ? paths.hairstyleCards
    : paths.baseModel ? [paths.baseModel] : [];

  const [hairstyleUrls, outfitUrls] = await Promise.all([
    Promise.all(hairstylePaths.map(resolveOne)),
    Promise.all((paths.outfitCards ?? []).map(resolveOne)),
  ]);

  return {
    hairstyleCards: hairstyleUrls,
    outfitCards:    outfitUrls,
    baseModel:      paths.baseModel ? await resolveOne(paths.baseModel) : null,
  };
}
