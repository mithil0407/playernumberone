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

  return `Transform this full-body photograph of a man:

1. HAIRSTYLE: Replace current hairstyle with: ${hairstyle}. Must look natural and achievable on a ${faceShape} face shape. Do not alter face identity.

2. BACKGROUND: Replace entire background with flat solid colour #94a6ad (ICONIK slate). No gradient, no vignette, no shadow bleed onto background.

3. LIGHTING: Reprocess to clean editorial quality — soft directional light from slightly above, even skin tone rendering, no harsh shadows or blown highlights.

4. POSE: Clean neutral standing — weight centred, arms relaxed at sides, slight 3/4 angle toward camera. Full body from head to feet must be visible.

5. PRESERVE EXACTLY: Face identity, skin tone depth, body proportions, and height impression must remain unchanged.

Output: Full body, head to feet, subject centred, flat slate background.`;
}

function buildOutfitPrompt(outfit: ParsedOutfit, c: ClassificationResult): string {
  const silhouetteRules = c.body.silhouette_rules.map(r => `  • ${r}`).join('\n');
  const avoidCuts       = c.body.avoid_cuts.map(r => `  ✗ ${r}`).join('\n');

  const garmentBlock = [
    `TOP:         ${outfit.top}`,
    `BOTTOM:      ${outfit.bottom}`,
    `LAYER:       ${outfit.layer ?? 'No layer'}`,
    `FOOTWEAR:    ${outfit.footwear}`,
    outfit.accessories ? `ACCESSORIES: ${outfit.accessories}` : null,
  ].filter(Boolean).join('\n');

  const fitContext = outfit.fitNote
    ? `\nFit context for this client: ${outfit.fitNote}`
    : '';

  const colourContext = outfit.colourLogic
    ? `\nColour sourcing: ${outfit.colourLogic}`
    : '';

  return `Dress this man in Outfit ${outfit.index} — ${outfit.label}.

━━━ GARMENTS TO RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━
${garmentBlock}${fitContext}${colourContext}

━━━ BODY SILHOUETTE RULES (mandatory) ━━━━━━━━━━━
Body type: ${c.body.silhouette_type}
Fit directive: ${c.body.fit_directive}
Highlight zone: ${c.body.highlight_zone}
Minimise zone: ${c.body.minimise_zone}
Silhouette rules to apply:
${silhouetteRules}
Cuts to never render:
${avoidCuts}

━━━ GARMENT FIT STANDARDS (non-negotiable) ━━━━━━
✗ NO skinny jeans or slim-tapered trousers
✗ NO fitted/muscle-fit tops — fabric must not stretch across chest or arms
✗ NO slim-leg trousers with aggressive ankle taper
✓ Trousers: straight leg or wider — clean, non-constricting silhouette
✓ Tops: fabric must have visible ease — not contoured to the torso
✓ Layer (if present): should sit cleanly — not pulled tight across shoulders

━━━ RENDER CONSTRAINTS ━━━━━━━━━━━━━━━━━━━━━━━━━━
- Identical pose to base image — do not alter stance, weight, or body position
- Background: flat solid #94a6ad — exact match to base image
- Lighting: match base image editorial lighting exactly — no new shadows
- Garments pressed and styled — no rumpling, no bunching
- Colour accuracy critical — match hex values from outfit description precisely
- No logos, labels, or brand markings visible on any garment
- Full body head to feet — no cropping
- Western garments only — suits, trousers, shirts, chinos, outerwear`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini image edit call
// ─────────────────────────────────────────────────────────────────────────────

async function callGeminiImageEdit(
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
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
  reportId:      string,
  submission:    ManIntakeSubmission,
  classification: ClassificationResult,
): Promise<string> {
  if (!submission.photo_fullbody_url) {
    throw new Error('No photo_fullbody_url on submission — cannot generate base model');
  }

  const { data, mimeType } = await fetchAsBase64(submission.photo_fullbody_url);
  const prompt             = buildBaseModelPrompt(classification);
  const outputBase64       = await callGeminiImageEdit(data, mimeType, prompt);

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
): Promise<(string | null)[]> {
  const outfits = parseOutfitsFromSection(sections.s4_outfits);

  if (outfits.length === 0) {
    console.warn('[manImageGenerator] No outfits parsed from s4_outfits — skipping image generation');
    return [];
  }

  console.log(`[manImageGenerator] Generating ${outfits.length} outfit images with concurrency 4`);

  // Fetch base model once (short-lived signed URL for internal use)
  const baseSignedUrl                   = await getSignedUrl(baseModelPath, 300);
  const { data: baseData, mimeType: baseMime } = await fetchAsBase64(baseSignedUrl);

  const tasks = outfits.map((outfit) => async () => {
    const prompt       = buildOutfitPrompt(outfit, classification);
    const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt);
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
    try {
      return await getSignedUrl(path, SIGNED_URL_TTL);
    } catch {
      return null;
    }
  };

  const allPaths = [paths.baseModel, ...(paths.outfitCards ?? [])];
  const allUrls  = await Promise.all(allPaths.map(resolveOne));
  const [baseModel, ...outfitCards] = allUrls;

  return { baseModel: baseModel ?? null, outfitCards };
}
