import 'server-only';

import { GoogleGenAI } from '@google/genai';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { supabaseAdmin } from './supabase';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
import {
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintOutfitCount,
  inferStylistCoverageProfile,
  isManualStylistBlueprintSubmission,
  type BlueprintPage,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator';

const BUCKET = 'stylist-blueprint-images';
const SIGNED_URL_TTL = 60 * 60;
const SLATE = '#94a6ad';
const MODEL = 'gemini-3.1-flash-image-preview';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const GEMINI_IMAGE_TIMEOUT_MS = 45_000;
const GEMINI_INLINE_IMAGE_MAX_BYTES = 18 * 1024 * 1024;
const GEMINI_SOURCE_IMAGE_MAX_DIMENSION = 1800;
const SUPPORTED_GEMINI_INPUT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
let bucketReady = false;

export type StylistBlueprintImageGroup =
  | 'diagnosis'
  | 'prescription'
  | 'capsule_1'
  | 'capsule_2'
  | 'capsule_3'
  | 'capsule_4'
  | 'closing'
  | 'all';

export const STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS = [
  'diagnosis.silhouetteFront',
  'diagnosis.silhouetteSide',
  'diagnosis.undertoneMap',
  'diagnosis.faceShapeDiagram',
  'prescription.hairDirections',
  'prescription.eyewearFrames',
  'application.outfitFlatlays.0',
  'application.outfitFlatlays.1',
  'application.outfitFlatlays.2',
  'application.outfitFlatlays.3',
  'application.outfitFlatlays.4',
  'application.outfitFlatlays.5',
  'application.outfitFlatlays.6',
  'application.outfitFlatlays.7',
  'application.outfitFlatlays.8',
  'application.outfitFlatlays.9',
  'application.outfitFlatlays.10',
  'application.outfitFlatlays.11',
  'application.outfitFlatlays.12',
  'application.outfitFlatlays.13',
  'application.outfitFlatlays.14',
  'application.outfitFlatlays.15',
  'application.outfitFlatlays.16',
  'application.outfitFlatlays.17',
  'application.outfitFlatlays.18',
  'application.outfitFlatlays.19',
  'closing.editTeaser',
] as const;

export type StylistBlueprintImageSlotKey = typeof STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS[number];

export interface StylistBlueprintImagePaths {
  cover?: { portrait?: string | null };
  diagnosis?: {
    silhouetteFront?: string | null;
    silhouetteSide?: string | null;
    proportionalAxes?: string | null;
    undertoneMap?: string | null;
    depthContrastMatrix?: string | null;
    palettePreview?: string | null;
    faceShapeDiagram?: string | null;
    faceRatios?: string | null;
    necklinePreview?: string | null;
    combinedAxes?: string | null;
    focalHeatmap?: string | null;
    avoidanceGrid?: string | null;
  };
  prescription?: {
    basePalette?: string | null;
    accentPalette?: string | null;
    necklineGrid?: string | null;
    sleeveWaistGrid?: string | null;
    hairDirections?: string | null;
    eyewearFrames?: string | null;
    approvedFabrics?: string | null;
    avoidedFabrics?: string | null;
  };
  application?: {
    capsuleCovers?: (string | null)[];
    outfitFlatlays?: (string | null)[];
    outfitDetails?: (string | null)[];
  };
  closing?: {
    combinationMatrix?: string | null;
    editTeaser?: string | null;
  };
  bodyGeometryCard?: string | null;
  colourPaletteCard?: string | null;
  faceHairAccessoryCard?: string | null;
  outfitCards?: (string | null)[];
  referenceCard?: string | null;
}

export type ResolvedStylistBlueprintImageUrls = StylistBlueprintImagePaths;

type MutablePaths = {
  cover: { portrait: string | null };
  diagnosis: {
    silhouetteFront: string | null;
    silhouetteSide: string | null;
    proportionalAxes: string | null;
    undertoneMap: string | null;
    depthContrastMatrix: string | null;
    palettePreview: string | null;
    faceShapeDiagram: string | null;
    faceRatios: string | null;
    necklinePreview: string | null;
    combinedAxes: string | null;
    focalHeatmap: string | null;
    avoidanceGrid: string | null;
  };
  prescription: {
    basePalette: string | null;
    accentPalette: string | null;
    necklineGrid: string | null;
    sleeveWaistGrid: string | null;
    hairDirections: string | null;
    eyewearFrames: string | null;
    approvedFabrics: string | null;
    avoidedFabrics: string | null;
  };
  application: {
    capsuleCovers: (string | null)[];
    outfitFlatlays: (string | null)[];
    outfitDetails: (string | null)[];
  };
  closing: {
    combinationMatrix: string | null;
    editTeaser: string | null;
  };
};

type SingleSlotPlan = {
  fileName: string;
  prompt: string;
  sourceUrl?: string | null;
  extraSourceUrl?: string | null;
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  getCurrent: (paths: MutablePaths) => string | null | undefined;
  setCurrent: (paths: MutablePaths, path: string) => void;
};

function emptyPaths(): MutablePaths {
  return {
    cover: { portrait: null },
    diagnosis: {
      silhouetteFront: null,
      silhouetteSide: null,
      proportionalAxes: null,
      undertoneMap: null,
      depthContrastMatrix: null,
      palettePreview: null,
      faceShapeDiagram: null,
      faceRatios: null,
      necklinePreview: null,
      combinedAxes: null,
      focalHeatmap: null,
      avoidanceGrid: null,
    },
    prescription: {
      basePalette: null,
      accentPalette: null,
      necklineGrid: null,
      sleeveWaistGrid: null,
      hairDirections: null,
      eyewearFrames: null,
      approvedFabrics: null,
      avoidedFabrics: null,
    },
    application: {
      capsuleCovers: [null, null, null, null],
      outfitFlatlays: Array.from({ length: 20 }, () => null),
      outfitDetails: Array.from({ length: 20 }, () => null),
    },
    closing: { combinationMatrix: null, editTeaser: null },
  };
}

function normalise(paths: StylistBlueprintImagePaths | null | undefined): MutablePaths {
  const base = emptyPaths();
  return {
    cover: { portrait: paths?.cover?.portrait ?? null },
    diagnosis: { ...base.diagnosis, ...(paths?.diagnosis ?? {}) },
    prescription: { ...base.prescription, ...(paths?.prescription ?? {}) },
    application: {
      capsuleCovers: Array.from({ length: 4 }, (_, index) => paths?.application?.capsuleCovers?.[index] ?? null),
      outfitFlatlays: Array.from({ length: 20 }, (_, index) => paths?.application?.outfitFlatlays?.[index] ?? null),
      outfitDetails: Array.from({ length: 20 }, (_, index) => paths?.application?.outfitDetails?.[index] ?? null),
    },
    closing: { ...base.closing, ...(paths?.closing ?? {}) },
  };
}

async function getStoredPaths(reportId: string) {
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('image_urls')
    .eq('id', reportId)
    .single();
  if (error) throw error;
  return normalise(data?.image_urls as StylistBlueprintImagePaths | null);
}

async function persistPaths(reportId: string, paths: MutablePaths, shareToken?: string | null, progressStage?: string | null) {
  await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({
      image_urls: paths,
      progress_stage: progressStage === undefined ? 'generating_images' : progressStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  await revalidateStylistBlueprintCache(reportId, shareToken);
}

async function uploadBuffer(reportId: string, fileName: string, buffer: Buffer) {
  const path = `${reportId}/${fileName}.jpg`;
  const jpeg = await sharp(buffer, { failOn: 'none' }).jpeg({ quality: 92 }).toBuffer();
  const upload = () => supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });

  if (!bucketReady) {
    const { error } = await upload();
    if (!error) {
      bucketReady = true;
      return path;
    }
    if (!/bucket not found|not found/i.test(error.message)) throw error;
    await ensureBucket();
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  bucketReady = true;
  return path;
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  bucketReady = true;
}

async function callGeminiImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['IMAGE'],
        httpOptions: { timeout: GEMINI_IMAGE_TIMEOUT_MS },
      },
    });
    const parts = (response.candidates?.[0]?.content?.parts ?? []) as Array<{ inlineData?: { data?: string } }>;
    const data = parts.find(part => part.inlineData?.data)?.inlineData?.data;
    return data ? Buffer.from(data, 'base64') : null;
  } catch (error) {
    console.error('[stylist-blueprint-images] Gemini image generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

function cleanMimeType(contentType: string | null): string | null {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType || null;
}

async function normaliseImageForGemini(
  buffer: Buffer,
  sourceMimeType: string | null,
): Promise<{ data: string; mimeType: string }> {
  try {
    const image = sharp(buffer, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();
    const output = await image
      .resize({
        width: GEMINI_SOURCE_IMAGE_MAX_DIMENSION,
        height: GEMINI_SOURCE_IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    if (output.length > GEMINI_INLINE_IMAGE_MAX_BYTES) {
      throw new Error(`Prepared image is too large for inline Gemini request (${output.length} bytes)`);
    }

    console.log(
      `[stylist-blueprint-images] Prepared Gemini source image sourceMime=${sourceMimeType ?? 'unknown'} ` +
      `sourceFormat=${metadata.format ?? 'unknown'} sourceBytes=${buffer.length} outputBytes=${output.length}`,
    );

    return {
      data: output.toString('base64'),
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    const fallbackMimeType = SUPPORTED_GEMINI_INPUT_MIME_TYPES.has(sourceMimeType ?? '')
      ? sourceMimeType!
      : 'image/jpeg';
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[stylist-blueprint-images] Could not normalise source image for Gemini; using original bytes. mimeType=${fallbackMimeType} error="${message.slice(0, 300)}"`);

    if (buffer.length > GEMINI_INLINE_IMAGE_MAX_BYTES) {
      throw new Error(`Source image is too large for inline Gemini request (${buffer.length} bytes) and could not be normalised: ${message}`);
    }

    return {
      data: buffer.toString('base64'),
      mimeType: fallbackMimeType,
    };
  }
}

async function fetchGeminiImagePart(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source image fetch failed: ${response.status}`);
  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  if (sourceBuffer.length === 0) throw new Error('Source image fetch returned an empty file');
  return normaliseImageForGemini(sourceBuffer, cleanMimeType(response.headers.get('content-type')));
}

async function callGeminiImageEdit(
  prompt: string,
  sourceUrl: string,
  extraSourceUrl?: string | null,
): Promise<Buffer | null> {
  try {
    const [primary, extra] = await Promise.all([
      fetchGeminiImagePart(sourceUrl),
      extraSourceUrl && extraSourceUrl !== sourceUrl ? fetchGeminiImagePart(extraSourceUrl).catch(error => {
        console.warn('[stylist-blueprint-images] Extra Gemini reference image unavailable:', error instanceof Error ? error.message : error);
        return null;
      }) : Promise.resolve(null),
    ]);
    const parts: object[] = [
      { inlineData: { mimeType: primary.mimeType, data: primary.data } },
      ...(extra ? [{ inlineData: { mimeType: extra.mimeType, data: extra.data } }] : []),
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ parts }],
      config: {
        responseModalities: ['IMAGE'],
        httpOptions: { timeout: GEMINI_IMAGE_TIMEOUT_MS },
      },
    });
    const responseParts = (response.candidates?.[0]?.content?.parts ?? []) as Array<{
      inlineData?: { data?: string; mimeType?: string };
      text?: string;
    }>;
    const data = responseParts.find(part => part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data)?.inlineData?.data;
    if (data) return Buffer.from(data, 'base64');

    const text = responseParts.find(part => typeof part.text === 'string')?.text?.slice(0, 500) ?? '(no text in response)';
    const finishReason = response.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`Gemini returned no image data (finishReason=${finishReason}): ${text}`);
  } catch (error) {
    console.error('[stylist-blueprint-images] Gemini image edit failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function callOpenAIImage(prompt: string, size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1536'): Promise<Buffer | null> {
  if (!openai) return null;
  try {
    const result = await openai.images.generate({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size,
      quality: 'medium',
    } as Parameters<typeof openai.images.generate>[0]);
    const imageBase64 = (result as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
    return imageBase64 ? Buffer.from(imageBase64, 'base64') : null;
  } catch (error) {
    console.error('[stylist-blueprint-images] OpenAI image generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function sourceImageFileFromUrl(url: string, fileName: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source image fetch failed: ${response.status}`);
  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const jpeg = await sharp(sourceBuffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();
  return toFile(jpeg, `${fileName}.jpg`, { type: 'image/jpeg' });
}

async function callOpenAIImageEdit(prompt: string, sourceUrl: string, fileName: string, size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1536'): Promise<Buffer | null> {
  if (!openai) return null;
  try {
    const image = await sourceImageFileFromUrl(sourceUrl, fileName);
    const result = await openai.images.edit({
      model: OPENAI_IMAGE_MODEL,
      image,
      prompt,
      size,
      quality: 'medium',
      input_fidelity: 'high',
    } as Parameters<typeof openai.images.edit>[0]);
    const imageBase64 = (result as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
    return imageBase64 ? Buffer.from(imageBase64, 'base64') : null;
  } catch (error) {
    console.error('[stylist-blueprint-images] OpenAI image edit failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function callEditorialImage(
  prompt: string,
  sourceUrl?: string | null,
  fileName = 'source',
  size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1536',
  extraSourceUrl?: string | null,
): Promise<Buffer | null> {
  const geminiBuffer = sourceUrl
    ? await callGeminiImageEdit(prompt, sourceUrl, extraSourceUrl)
    : await callGeminiImage(prompt);
  if (geminiBuffer) return geminiBuffer;

  console.warn(`[stylist-blueprint-images] Falling back to OpenAI image model for ${fileName}`);
  if (sourceUrl) {
    return callOpenAIImageEdit(prompt, sourceUrl, fileName, size);
  }
  return callOpenAIImage(prompt, size);
}

function blockText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(blockText).filter(Boolean).join('; ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${blockText(item)}`)
      .filter(Boolean)
      .join('; ');
  }
  return String(value);
}

function pageText(page: BlueprintPage) {
  return [
    `Title: ${page.title}`,
    page.subtitle ? `Context: ${page.subtitle}` : '',
    ...page.blocks.map(block => [
      block.label ? `Label: ${block.label}` : '',
      block.heading ? `Heading: ${block.heading}` : '',
      block.body ? `Body: ${block.body}` : '',
      block.reason ? `Reason: ${block.reason}` : '',
      block.items?.length ? `Items: ${blockText(block.items)}` : '',
    ].filter(Boolean).join('\n')),
  ].filter(Boolean).join('\n');
}

function outfitColourAuthority(page: BlueprintPage) {
  const paletteUsed = page.palette_used?.length
    ? `Palette used: ${page.palette_used.map(colour => `${colour.role}: ${colour.name} ${colour.hex}`).join('; ')}`
    : 'Palette used: read the formula item colour fields below.';
  const formulaItems = page.blocks
    .flatMap(block => Array.isArray(block.items) ? block.items : [])
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
      const record = item as Record<string, unknown>;
      return [
        typeof record.slot === 'string' ? `slot=${record.slot}` : '',
        typeof record.piece === 'string' ? `piece=${record.piece}` : '',
        typeof record.colour_name === 'string' ? `colour=${record.colour_name}` : '',
        typeof record.colour_hex === 'string' ? `hex=${record.colour_hex}` : '',
        typeof record.palette_role === 'string' ? `role=${record.palette_role}` : '',
      ].filter(Boolean).join(', ');
    })
    .filter(Boolean)
    .join('\n');

  return [paletteUsed, formulaItems ? `Per-piece colour authority:\n${formulaItems}` : ''].filter(Boolean).join('\n');
}

function outfitCoverageAuthority(reportData: StylistBlueprintReportData) {
  const profile = inferStylistCoverageProfile(reportData);
  const rules = [
    profile.neckline
      ? `Neckline/chest coverage is mandatory: render a higher neckline such as ${profile.approvedNecklines.slice(0, 5).join(', ')}. Absolutely no cleavage, plunging neckline, deep V, low scoop, low-cut top, keyhole, strapless, off-shoulder, one-shoulder, spaghetti straps, strappy standalone camisole, or exposed chest.`
      : 'Avoid plunging, cleavage-revealing, or obviously low-cut necklines unless explicitly written in the outfit text.',
    profile.arms ? 'Arm/shoulder coverage is mandatory: render real sleeves or the specified layer; do not show bare upper arms or shoulders.' : '',
    profile.legs ? 'Leg/knee coverage is mandatory: render trousers/full-length bottoms or at/below-knee hemlines.' : '',
    profile.opacity ? 'Fabric opacity is mandatory: no sheer, transparent, see-through, or unlined exposure.' : '',
    profile.looseFit ? 'Fit comfort is mandatory: avoid bodycon or clingy rendering through sensitive areas.' : '',
  ].filter(Boolean);
  return rules.join('\n- ');
}

function wornOutfitPrompt(reportData: StylistBlueprintReportData, page: BlueprintPage) {
  const palette = [
    ...reportData.classification.colour.base_palette,
    ...reportData.classification.colour.accent_palette,
  ].map(colour => `${colour.name} ${colour.hex}`).join(', ');
  const outfit = pageText(page);
  return `Professional editorial fashion catalogue photography for the ICONIK women's Style Blueprint.

Reference photos may be provided: the first is the client's full-body/body reference, and the second is the client's original headshot when available.

Extract the client's face, skin tone, facial features, hair constraints, and identity from the headshot when provided. Extract body proportions, body shape, stance, and scale from the full-body reference. Preserve the client's exact skin tone, facial features, body proportions, and identity. Do not alter, slim, age, or idealise the client.

CRITICAL CLOTHING INSTRUCTION:
- Remove and discard the original clothing from the reference photos.
- Do not preserve, copy, blend, reinterpret, or borrow garments, shoes, accessories, colours, collars, sleeves, silhouettes, or prints from the reference photos.
- The outfit text below is the only authority for what the client wears.

Background and style:
- Matte ICONIK slate background ${SLATE}.
- Premium studio cyclorama fashion editorial, clean front/three-quarter pose.
- Portrait vertical 2:3 composition. Final image must be tall, not landscape or square.
- Full outfit visible from head to toe, centered in frame, with generous margin above the head and below the footwear. Both shoes and all footwear details must be fully visible.
- Absolutely no text, letters, typography, captions, labels, logos, signage, watermarks, UI marks, brand marks, readable symbols, extra people, or mannequin.
- Natural realistic fabric behavior and correct garment construction.
- Practical colour realism: never render coloured leather sneakers. If the outfit mentions sneakers, they must be white, off-white, cream, or grey-neutral with no coloured trim.
- Bags and shoes are a single realistic leather/suede colour head to toe: black, espresso, chocolate, cognac, tan, taupe, burgundy, cream, or restrained grey. Never add a coloured trim, tag, stripe, piping, hardware, stitch, sole, or "detail" in a different colour on a bag or shoe — if a piece is a bag or shoe, ignore any stray colour accent and render the whole item in its realistic neutral leather colour.
- Accent colours appear only on knitwear, tops, layers, scarves, belts, jewellery stones/enamel, garment prints, or an evening clutch — never as a small detail bolted onto an otherwise neutral bag or shoe.

Client styling constraints:
- Body geometry: ${reportData.classification.body.geometry}.
- Proportion directive: ${reportData.classification.body.proportion_directive}.
- Coverage rules: ${reportData.classification.body.coverage_rules.join(', ') || 'follow intake coverage preferences'}.
- Rendered coverage authority:
- ${outfitCoverageAuthority(reportData)}
- Palette direction: ${reportData.classification.colour.palette_name}; use these colours where relevant: ${palette}.
- Exact outfit colours: the per-piece colour authority below overrides any generic colour assumption.
- Taste direction: ${reportData.classification.taste.style_archetype}; avoid: ${reportData.classification.taste.anti_codes.join(', ') || 'anything outside the stated outfit text'}.

${outfitColourAuthority(page)}

Outfit text to render:
${outfit}`;
}

function editTeaserPrompt(reportData: StylistBlueprintReportData) {
  return `Use the uploaded client photo as the identity and body reference. Create a full-body editorial image of the same client wearing a future ICONIK Edit outfit direction based on this Blueprint. Preserve the client's face, skin tone, body proportions, and identity.

Background and style:
- Matte ICONIK slate background ${SLATE}.
- Premium studio fashion editorial, clean full-body pose.
- No text, no labels, no watermark, no extra people, no mannequin.

Styling direction:
- Body geometry: ${reportData.classification.body.geometry}.
- Palette: ${reportData.classification.colour.palette_name}.
- Taste direction: ${reportData.classification.taste.style_archetype}.
- Build a polished continuation look that feels aligned with the ${getStylistBlueprintOutfitCount(reportData)} outfit formulas in this report.`;
}

async function generatedImage(
  reportId: string,
  fileName: string,
  prompt: string,
  sourceUrl?: string | null,
  size: '1024x1024' | '1024x1536' | '1536x1024' = '1024x1536',
  extraSourceUrl?: string | null,
) {
  const buffer = await callEditorialImage(prompt, sourceUrl, fileName, size, extraSourceUrl);
  if (!buffer) throw new Error(`Image generation returned no image for ${fileName}`);
  const output = size === '1024x1536'
    ? await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: 1024, height: 1536, fit: 'contain', background: SLATE })
      .jpeg({ quality: 92 })
      .toBuffer()
    : buffer;
  return uploadBuffer(reportId, fileName, output);
}

function sourcePhotos(submission?: StylistIntakeSubmission | null) {
  const photos = submission?.photo_urls ?? {};
  return {
    headshot: photos.headshot || null,
    front: photos.full_body_front || null,
    side: photos.full_body_side || null,
    outfit: photos.one_outfit || submission?.one_outfit_image_url || null,
  };
}

function diagnosisPrompt(reportData: StylistBlueprintReportData, slot: keyof MutablePaths['diagnosis']) {
  const body = reportData.analysis.silhouette_profile;
  const colour = `${reportData.classification.colour.palette_name}, ${reportData.classification.colour.undertone_direction}, ${reportData.classification.colour.depth} depth, ${reportData.classification.colour.contrast} contrast`;
  const face = reportData.classification.face_hair_accessories.face_shape;
  const palette = reportData.classification.colour.base_palette.slice(0, 5).map(c => `${c.name} ${c.hex}`).join(', ');
  const base = `Create a premium ICONIK clinical-editorial diagnostic image. Preserve the source client's photo where supplied; do not alter identity, facial features, skin tone, or body shape. Add clean warm-white analytical overlays on matte slate #94A6AD: thin measurement lines, small dot terminators, calibrated marks. No labels, no numbers, no readable text. Vogue editorial meets clinical report.`;
  const prompts: Record<keyof MutablePaths['diagnosis'], string> = {
    silhouetteFront: `${base} Use the front full-body photo as the underlying image. Overlay shoulder span, hip span, vertical centre line, and natural waist curve for a ${body} silhouette. Keep the full head-to-toe body visible with margin above the head and below the feet; do not crop the head, hair, footwear, or feet. Front-facing, elegant and restrained.`,
    silhouetteSide: `${base} Use the side/full-body source photo as the underlying image. Create a side-profile proportional overlay with posture line, natural waist marker, torso-to-hip curve, and centre-of-gravity dot for a ${body} silhouette. Keep the full head-to-toe body visible with margin above the head and below the feet; do not crop the head, hair, footwear, or feet.`,
    proportionalAxes: `${base} Use the full-body source photo as the underlying image. Overlay three proportional axes: vertical balance, horizontal balance, and focal point indicator. Scientific but editorial.`,
    undertoneMap: `${base} Use the headshot as the underlying image. Add a subtle horizontal cool-neutral-warm undertone calibration bar and marker beside the face. Chromatic profile: ${colour}.`,
    depthContrastMatrix: `${base} Use the headshot as the underlying image. Add a refined 5x5 depth/contrast calibration matrix beside the portrait with one highlighted point. Chromatic profile: ${colour}.`,
    palettePreview: `Create a premium colour palette preview image on matte slate #94A6AD. Show exactly five clean swatches using these colours: ${palette}. No text, no labels, no numbers. Editorial spacing and exact colour emphasis.`,
    faceShapeDiagram: `${base} Use the headshot as the underlying image. Overlay forehead width, cheekbone width, jaw width, and face length lines for ${face} facial architecture. Keep face natural and recognizable.`,
    faceRatios: `${base} Use the headshot as the underlying image. Add facial thirds and proportion bars as delicate overlay marks, preserving the client's face. No labels or numbers.`,
    necklinePreview: `Create a premium neckline geometry reference image on matte slate #94A6AD. Four approved neckline line diagrams for ${face}: ${reportData.classification.face_hair_accessories.approved_necklines.join(', ')}. Warm-white lines, no text, no model.`,
    combinedAxes: `${base} Use the full-body source photo as the underlying image. Overlay combined vertical, horizontal, and focal axes based on ${body} and focus: ${reportData.analysis.proportional_focus.join(', ')}.`,
    focalHeatmap: `${base} Use the full-body source photo as the underlying image. Add subtle translucent warm-rose focal heat zones at the recommended focal areas. Keep the image elegant, scientific, and non-invasive.`,
    avoidanceGrid: `Create a premium six-cell avoidance rule image on matte slate #94A6AD. Icon-like garment diagrams matching these avoid rules: ${reportData.classification.taste.anti_codes.join(', ')}. Warm-white line drawings with subtle rose diagonal avoid strokes. No text.`,
  };
  return prompts[slot];
}

function prescriptionPrompt(reportData: StylistBlueprintReportData, slot: keyof MutablePaths['prescription']) {
  const base = `Create a premium ICONIK reference image on matte slate #94A6AD. Restrained Vogue editorial meets clinical report. No readable text, no labels, no numbers.`;
  const basePalette = reportData.classification.colour.base_palette.map(c => `${c.name} ${c.hex}`).join(', ');
  const accentPalette = reportData.classification.colour.accent_palette.map(c => `${c.name} ${c.hex}`).join(', ');
  const hairStyles = reportData.classification.face_hair_accessories.hair_styles.join(', ');
  const eyewearShapes = reportData.classification.face_hair_accessories.eyewear_shapes.join(', ');
  const prompts: Record<keyof MutablePaths['prescription'], string> = {
    basePalette: `${base} Show exactly 10 colour swatches in two rows of five. Use these colours exactly: ${basePalette}.`,
    accentPalette: `${base} Show exactly 5 colour swatches in one centered row. Use these colours exactly: ${accentPalette}.`,
    necklineGrid: `${base} Show six approved neckline geometry diagrams in a 3x2 grid: ${reportData.classification.face_hair_accessories.approved_necklines.join(', ')}. Warm-white line work.`,
    sleeveWaistGrid: `${base} Show sleeve and waistline construction geometry diagrams for these silhouette rules: ${reportData.classification.body.silhouette_rules.join(', ')}. Warm-white line work.`,
    hairDirections: `Use the uploaded client headshot as the source image. Preserve the client's identity, face, skin tone, facial features, and natural proportions in every cell. Create one clean 2x2 grid image with exactly four polished head-and-shoulders hairstyle options for the same client: ${hairStyles}. Each cell should show one distinct realistic, wearable hairstyle matched to ${reportData.classification.face_hair_accessories.face_shape} facial architecture. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    eyewearFrames: `Use the uploaded client headshot as the source image. Preserve the client's identity, face, skin tone, facial features, and natural proportions in every cell. Create one clean 2x2 grid image with exactly four eyewear options on the same client: two optical eyeglass frames and two sunglasses. Frame direction: ${eyewearShapes}. Frames must be realistic, properly scaled, and matched to ${reportData.classification.face_hair_accessories.face_shape} facial architecture. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    approvedFabrics: `${base} Show a 2x2 macro texture grid of approved fabrics: ${reportData.classification.fabrics.approved.map(f => f.name).join(', ')}. Warm ivory fabric texture, photorealistic macro detail.`,
    avoidedFabrics: `${base} Show avoided fabric macro swatches: ${reportData.classification.fabrics.avoid.map(f => f.name).join(', ')}. Add subtle warm-rose diagonal avoid strokes. Photorealistic macro detail.`,
  };
  return prompts[slot];
}

export function isStylistBlueprintImageSlotKey(value: unknown): value is StylistBlueprintImageSlotKey {
  return typeof value === 'string' && (STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS as readonly string[]).includes(value);
}

function singleSlotProgressStage(slotKey: StylistBlueprintImageSlotKey) {
  return `regenerating_image_${slotKey.replace(/\W+/g, '_')}`;
}

function regeneratedFileName(baseName: string) {
  return `${baseName}-regen-${Date.now()}`;
}

function outfitPageForSlot(reportData: StylistBlueprintReportData, index: number) {
  const pageNumber = index + 14;
  const page = reportData.pages.find(item => item.page_number === pageNumber);
  if (!page) throw new Error(`Missing outfit page ${pageNumber} for image generation`);
  return page;
}

function buildSingleSlotPlan(
  slotKey: StylistBlueprintImageSlotKey,
  reportData: StylistBlueprintReportData,
  photos: ReturnType<typeof sourcePhotos>,
): SingleSlotPlan {
  const baseFileName = slotKey.replace(/\./g, '-');

  if (slotKey === 'diagnosis.silhouetteFront') {
    if (!photos.front) throw new Error('No front full-body photo found for silhouette image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: diagnosisPrompt(reportData, 'silhouetteFront'),
      sourceUrl: photos.front,
      size: '1024x1536',
      getCurrent: paths => paths.diagnosis.silhouetteFront,
      setCurrent: (paths, path) => { paths.diagnosis.silhouetteFront = path; },
    };
  }

  if (slotKey === 'diagnosis.silhouetteSide') {
    if (!photos.side) throw new Error('No side full-body photo found for side-profile image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: diagnosisPrompt(reportData, 'silhouetteSide'),
      sourceUrl: photos.side,
      size: '1024x1536',
      getCurrent: paths => paths.diagnosis.silhouetteSide,
      setCurrent: (paths, path) => { paths.diagnosis.silhouetteSide = path; },
    };
  }

  if (slotKey === 'diagnosis.undertoneMap') {
    if (!photos.headshot) throw new Error('No headshot found for undertone image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: diagnosisPrompt(reportData, 'undertoneMap'),
      sourceUrl: photos.headshot,
      size: '1024x1024',
      getCurrent: paths => paths.diagnosis.undertoneMap,
      setCurrent: (paths, path) => { paths.diagnosis.undertoneMap = path; },
    };
  }

  if (slotKey === 'diagnosis.faceShapeDiagram') {
    if (!photos.headshot) throw new Error('No headshot found for face-shape image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: diagnosisPrompt(reportData, 'faceShapeDiagram'),
      sourceUrl: photos.headshot,
      size: '1024x1024',
      getCurrent: paths => paths.diagnosis.faceShapeDiagram,
      setCurrent: (paths, path) => { paths.diagnosis.faceShapeDiagram = path; },
    };
  }

  if (slotKey === 'prescription.hairDirections') {
    if (!photos.headshot) throw new Error('No headshot found for hair direction image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: prescriptionPrompt(reportData, 'hairDirections'),
      sourceUrl: photos.headshot,
      size: '1024x1536',
      getCurrent: paths => paths.prescription.hairDirections,
      setCurrent: (paths, path) => { paths.prescription.hairDirections = path; },
    };
  }

  if (slotKey === 'prescription.eyewearFrames') {
    if (!photos.headshot) throw new Error('No headshot found for eyewear image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: prescriptionPrompt(reportData, 'eyewearFrames'),
      sourceUrl: photos.headshot,
      size: '1024x1536',
      getCurrent: paths => paths.prescription.eyewearFrames,
      setCurrent: (paths, path) => { paths.prescription.eyewearFrames = path; },
    };
  }

  if (slotKey.startsWith('application.outfitFlatlays.')) {
    const index = Number(slotKey.split('.').at(-1));
    if (!Number.isInteger(index) || index < 0 || index >= getStylistBlueprintOutfitCount(reportData)) throw new Error('Invalid outfit image slot for this report version');
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (!clientSource) throw new Error('No client photo found for outfit image generation');
    return {
      fileName: regeneratedFileName(`outfit-${index + 1}-client`),
      prompt: wornOutfitPrompt(reportData, outfitPageForSlot(reportData, index)),
      sourceUrl: clientSource,
      extraSourceUrl: photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
      size: '1024x1536',
      getCurrent: paths => paths.application.outfitFlatlays[index],
      setCurrent: (paths, path) => { paths.application.outfitFlatlays[index] = path; },
    };
  }

  if (slotKey === 'closing.editTeaser') {
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (!clientSource) throw new Error('No client photo found for closing teaser image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: editTeaserPrompt(reportData),
      sourceUrl: clientSource,
      extraSourceUrl: photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
      size: '1024x1536',
      getCurrent: paths => paths.closing.editTeaser,
      setCurrent: (paths, path) => { paths.closing.editTeaser = path; },
    };
  }

  throw new Error('Unsupported image slot');
}

async function setSlot(input: {
  reportId: string;
  paths: MutablePaths;
  shareToken?: string | null;
  force?: boolean;
  getCurrent: () => string | null | undefined;
  setCurrent: (path: string) => void;
  fileName: string;
  create: () => Promise<string>;
}) {
  if (input.getCurrent() && !input.force) return;
  const path = await input.create();
  input.setCurrent(path);
  await persistPaths(input.reportId, input.paths, input.shareToken);
}

export async function generateStylistBlueprintImages(
  reportId: string,
  reportData: StylistBlueprintReportData,
  shareToken?: string | null,
  options: { group?: StylistBlueprintImageGroup; force?: boolean; submission?: StylistIntakeSubmission | null } = {},
): Promise<StylistBlueprintImagePaths> {
  const group = options.group ?? 'all';
  const force = Boolean(options.force);
  const paths = await getStoredPaths(reportId);
  const photos = sourcePhotos(options.submission);
  const includeClosingEditTeaser = !isManualStylistBlueprintSubmission(options.submission);

  await persistPaths(reportId, paths, shareToken, `generating_images_${group}`);

  if (group === 'diagnosis' || group === 'all') {
    const diagnosisSlots: Array<[keyof MutablePaths['diagnosis'], string, string | null, '1024x1024' | '1024x1536' | '1536x1024']> = [
      ['silhouetteFront', 'diagnosis-silhouette-front', photos.front, '1024x1536'],
      ['silhouetteSide', 'diagnosis-silhouette-side', photos.side, '1024x1536'],
      ['undertoneMap', 'diagnosis-undertone-map', photos.headshot, '1024x1024'],
      ['faceShapeDiagram', 'diagnosis-face-shape', photos.headshot, '1024x1024'],
      ['faceRatios', 'diagnosis-face-ratios', photos.headshot, '1024x1024'],
    ];
    for (const [slot, fileName, sourceUrl, size] of diagnosisSlots) {
      if (!sourceUrl) continue;
      await setSlot({
        reportId, paths, shareToken, force, fileName,
        getCurrent: () => paths.diagnosis[slot],
        setCurrent: path => { paths.diagnosis[slot] = path; },
        create: () => generatedImage(reportId, fileName, diagnosisPrompt(reportData, slot), sourceUrl, size),
      });
    }
  }

  if (group === 'prescription' || group === 'all') {
    const prescriptionSlots: Array<[keyof MutablePaths['prescription'], string, string | null, '1024x1024' | '1024x1536' | '1536x1024']> = [
      ['hairDirections', 'prescription-hair-directions', photos.headshot, '1024x1536'],
      ['eyewearFrames', 'prescription-eyewear-frames', photos.headshot, '1024x1536'],
    ];
    for (const [slot, fileName, sourceUrl, size] of prescriptionSlots) {
      if (!sourceUrl) continue;
      await setSlot({
        reportId, paths, shareToken, force, fileName,
        getCurrent: () => paths.prescription[slot],
        setCurrent: path => { paths.prescription[slot] = path; },
        create: () => generatedImage(reportId, fileName, prescriptionPrompt(reportData, slot), sourceUrl, size),
      });
    }
  }

  const capsuleGroups: Array<[StylistBlueprintImageGroup, number, number, number]> =
    getStylistBlueprintCapsulePageRanges(reportData).map((range, index) => [
      `capsule_${index + 1}` as StylistBlueprintImageGroup,
      index,
      range.firstPage,
      range.lastPage,
    ]);
  for (const [capsuleGroup, capsuleIndex, firstPage, lastPage] of capsuleGroups) {
    if (group !== capsuleGroup && group !== 'all') continue;
    paths.application.capsuleCovers[capsuleIndex] = null;
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (!clientSource) {
      throw new Error('No client photo found for outfit image generation');
    }
    for (let page = firstPage; page <= lastPage; page++) {
      const index = page - 14;
      const pageData = reportData.pages.find(item => item.page_number === page);
      if (!pageData) throw new Error(`Missing outfit page ${page} for image generation`);
      paths.application.outfitDetails[index] = null;
      await setSlot({
        reportId, paths, shareToken, force, fileName: `outfit-${index + 1}-client`,
        getCurrent: () => paths.application.outfitFlatlays[index],
        setCurrent: path => { paths.application.outfitFlatlays[index] = path; },
        create: () => generatedImage(
          reportId,
          `outfit-${index + 1}-client`,
          wornOutfitPrompt(reportData, pageData),
          clientSource,
          '1024x1536',
          photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
        ),
      });
    }
  }

  if (includeClosingEditTeaser && (group === 'closing' || group === 'all')) {
    await setSlot({
      reportId, paths, shareToken, force, fileName: 'closing-edit-teaser',
      getCurrent: () => paths.closing.editTeaser,
      setCurrent: path => { paths.closing.editTeaser = path; },
      create: () => {
        const clientSource = photos.front || photos.side || photos.headshot || null;
        if (!clientSource) throw new Error('No client photo found for closing teaser image generation');
        return generatedImage(
          reportId,
          'closing-edit-teaser',
          editTeaserPrompt(reportData),
          clientSource,
          '1024x1536',
          photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
        );
      },
    });
  }

  await persistPaths(reportId, paths, shareToken, null);
  return paths;
}

export async function regenerateStylistBlueprintImageSlot(
  reportId: string,
  reportData: StylistBlueprintReportData,
  slotKey: StylistBlueprintImageSlotKey,
  options: { shareToken?: string | null; submission?: StylistIntakeSubmission | null; progressStage?: string | null } = {},
) {
  const paths = await getStoredPaths(reportId);
  const photos = sourcePhotos(options.submission);
  if (slotKey === 'closing.editTeaser' && isManualStylistBlueprintSubmission(options.submission)) {
    throw new Error('Manual reports do not include the ICONIK Edit teaser image.');
  }
  const plan = buildSingleSlotPlan(slotKey, reportData, photos);

  await persistPaths(reportId, paths, options.shareToken, options.progressStage ?? singleSlotProgressStage(slotKey));

  try {
    const storagePath = await generatedImage(
      reportId,
      plan.fileName,
      plan.prompt,
      plan.sourceUrl,
      plan.size ?? '1024x1536',
      plan.extraSourceUrl,
    );

    plan.setCurrent(paths, storagePath);
    await persistPaths(reportId, paths, options.shareToken, null);

    const imageUrls = await resolveStylistBlueprintImageUrls(paths);
    const freshPaths = normalise(paths);
    const resolvedPaths = imageUrls ? normalise(imageUrls) : null;
    const imageUrl = resolvedPaths ? plan.getCurrent(resolvedPaths) ?? null : null;

    return {
      slotKey,
      storagePath,
      imagePaths: freshPaths as StylistBlueprintImagePaths,
      imageUrls,
      imageUrl,
    };
  } catch (error) {
    await persistPaths(reportId, paths, options.shareToken, null);
    throw error;
  }
}

function collectPaths(paths: StylistBlueprintImagePaths | null | undefined): string[] {
  const normalised = normalise(paths);
  return [
    normalised.cover.portrait,
    ...Object.values(normalised.diagnosis),
    ...Object.values(normalised.prescription),
    ...normalised.application.outfitFlatlays,
    normalised.closing.combinationMatrix,
    normalised.closing.editTeaser,
    paths?.bodyGeometryCard,
    paths?.colourPaletteCard,
    paths?.faceHairAccessoryCard,
    ...(paths?.outfitCards ?? []),
    paths?.referenceCard,
  ].filter((path): path is string => Boolean(path));
}

async function getSignedUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw new Error(`Signed URL failed for ${path}`);
  return data.signedUrl;
}

export async function resolveStylistBlueprintImageUrls(paths: StylistBlueprintImagePaths | null | undefined) {
  if (!paths) return null;
  const uniquePaths = [...new Set(collectPaths(paths))];
  const signedUrlMap = new Map<string, string>();

  if (uniquePaths.length) {
    const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(uniquePaths, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
    }
    for (const path of uniquePaths) {
      if (!signedUrlMap.has(path)) signedUrlMap.set(path, await getSignedUrl(path));
    }
  }

  const resolved = normalise(paths);
  const map = (path: string | null | undefined) => path ? signedUrlMap.get(path) ?? null : null;
  return {
    cover: { portrait: map(resolved.cover.portrait) },
    diagnosis: Object.fromEntries(Object.entries(resolved.diagnosis).map(([key, value]) => [key, map(value)])),
    prescription: Object.fromEntries(Object.entries(resolved.prescription).map(([key, value]) => [key, map(value)])),
    application: {
      capsuleCovers: resolved.application.capsuleCovers.map(() => null),
      outfitFlatlays: resolved.application.outfitFlatlays.map(map),
      outfitDetails: resolved.application.outfitDetails.map(() => null),
    },
    closing: {
      combinationMatrix: map(resolved.closing.combinationMatrix),
      editTeaser: map(resolved.closing.editTeaser),
    },
    bodyGeometryCard: map(paths.bodyGeometryCard),
    colourPaletteCard: map(paths.colourPaletteCard),
    faceHairAccessoryCard: map(paths.faceHairAccessoryCard),
    outfitCards: (paths.outfitCards ?? []).map(map),
    referenceCard: map(paths.referenceCard),
  } as ResolvedStylistBlueprintImageUrls;
}

export function getStylistBlueprintImageCounts(
  paths: StylistBlueprintImagePaths | null | undefined,
  options: {
    hasFrontPhoto?: boolean;
    hasSidePhoto?: boolean;
    hasHeadshot?: boolean;
    hasClientPhoto?: boolean;
    outfitCount?: number;
    includeClosingEditTeaser?: boolean;
  } = {},
) {
  const normalised = normalise(paths);
  const outfitCount = options.outfitCount ?? 20;
  const capsuleSize = Math.ceil(outfitCount / 4);
  const outfitSlots = normalised.application.outfitFlatlays.slice(0, outfitCount);
  const groups = {
    diagnosis: [
      ...(options.hasFrontPhoto ? [normalised.diagnosis.silhouetteFront] : []),
      ...(options.hasSidePhoto ? [normalised.diagnosis.silhouetteSide] : []),
      ...(options.hasHeadshot ? [
        normalised.diagnosis.undertoneMap,
        normalised.diagnosis.faceShapeDiagram,
        normalised.diagnosis.faceRatios,
      ] : []),
    ],
    prescription: options.hasHeadshot ? [
      normalised.prescription.hairDirections,
      normalised.prescription.eyewearFrames,
    ] : [],
    capsule_1: options.hasClientPhoto ? outfitSlots.slice(0, capsuleSize) : [],
    capsule_2: options.hasClientPhoto ? outfitSlots.slice(capsuleSize, capsuleSize * 2) : [],
    capsule_3: options.hasClientPhoto ? outfitSlots.slice(capsuleSize * 2, capsuleSize * 3) : [],
    capsule_4: options.hasClientPhoto ? outfitSlots.slice(capsuleSize * 3, outfitCount) : [],
    closing: [
      ...(options.hasClientPhoto && options.includeClosingEditTeaser !== false ? [normalised.closing.editTeaser] : []),
    ],
  };
  return Object.fromEntries(
    Object.entries(groups).map(([key, values]) => [key, {
      done: values.filter(Boolean).length,
      total: values.length,
    }]),
  );
}
