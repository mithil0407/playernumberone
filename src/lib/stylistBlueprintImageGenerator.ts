import 'server-only';

import { GoogleGenAI } from '@google/genai';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { colourFromPieceText } from './stylistColourMatching.ts';
import { supabaseAdmin } from './supabase.ts';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache.ts';
import {
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintTransformationPage,
  inferStylistCoverageProfile,
  isManualStylistBlueprintSubmission,
  type BlueprintPage,
  type SilhouetteProofOutfit,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator.ts';

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
  | 'application'
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
  'prescription.colourDrapeComparison',
  'prescription.hairDirections',
  'prescription.hairColourDirections',
  'prescription.eyewearFrames',
  'prescription.makeupLook',
  'application.transformationLooks.0',
  'application.transformationLooks.1',
  'application.transformationLooks.2',
  'application.silhouetteProofs.0',
  'application.silhouetteProofs.1',
  'application.silhouetteProofs.2',
  'application.silhouetteProofs.3',
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
    hairColourDirections?: string | null;
    eyewearFrames?: string | null;
    makeupLook?: string | null;
    colourDrapeComparison?: string | null;
    approvedFabrics?: string | null;
    avoidedFabrics?: string | null;
  };
  application?: {
    capsuleCovers?: (string | null)[];
    transformationLooks?: (string | null)[];
    silhouetteProofs?: (string | null)[];
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
    hairColourDirections: string | null;
    eyewearFrames: string | null;
    makeupLook: string | null;
    colourDrapeComparison: string | null;
    approvedFabrics: string | null;
    avoidedFabrics: string | null;
  };
  application: {
    capsuleCovers: (string | null)[];
    transformationLooks: (string | null)[];
    silhouetteProofs: (string | null)[];
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
      hairColourDirections: null,
      eyewearFrames: null,
      makeupLook: null,
      colourDrapeComparison: null,
      approvedFabrics: null,
      avoidedFabrics: null,
    },
    application: {
      capsuleCovers: [null, null, null, null],
      transformationLooks: [null, null, null],
      silhouetteProofs: [null, null, null, null],
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
      transformationLooks: Array.from({ length: 3 }, (_, index) => paths?.application?.transformationLooks?.[index] ?? null),
      silhouetteProofs: Array.from({ length: 4 }, (_, index) => paths?.application?.silhouetteProofs?.[index] ?? null),
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
  const { error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({
      image_urls: paths,
      progress_stage: progressStage === undefined ? 'generating_images' : progressStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  if (error) throw new Error(`Could not save report images: ${error.message}`);
  await revalidateStylistBlueprintCache(reportId, shareToken);
}

async function uploadBuffer(reportId: string, fileName: string, buffer: Buffer) {
  const path = `${reportId}/${fileName}.jpg`;
  const jpeg = await sharp(buffer, { limitInputPixels: 40_000_000 }).rotate().jpeg({ quality: 92 }).toBuffer();
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

function outfitFormulaItems(page: BlueprintPage) {
  return page.blocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
}

function formulaItemRecord(item: unknown) {
  return item && typeof item === 'object' && !Array.isArray(item)
    ? item as Record<string, unknown>
    : {};
}

function formulaSlot(item: unknown) {
  const slot = formulaItemRecord(item).slot;
  return typeof slot === 'string' ? slot.trim() : '';
}

function formulaPiece(item: unknown) {
  const piece = formulaItemRecord(item).piece;
  return typeof piece === 'string' ? piece.trim() : '';
}

/**
 * The outfit as an image model should read it: one colour per piece, no metadata.
 *
 * This used to emit `${colour} ${hex} ${piece}`, which produced lines like
 * "Layer: Espresso Olive #30261E Espresso Olive Navy knitted jacket" — the hex
 * code, the colour name twice, and a palette colour contradicting the colour in
 * the garment description. Hex codes are for the report's swatches; an image
 * model either renders them as literal text or lets them distort the garment.
 *
 * The written garment wins. The palette colour is only used to fill a gap when
 * the piece names no colour of its own.
 */
function compactOutfitRenderText(page: BlueprintPage) {
  const items = outfitFormulaItems(page)
    .map((item) => {
      const record = formulaItemRecord(item);
      const slot = formulaSlot(item);
      const piece = formulaPiece(item);
      if (!slot || !piece || /^none$/i.test(piece)) return '';
      const alreadyColoured = Boolean(colourFromPieceText(piece));
      const fallbackColour = typeof record.colour_name === 'string' ? record.colour_name.trim() : '';
      const described = alreadyColoured || !fallbackColour ? piece : `${fallbackColour} ${piece}`;
      return `${slot}: ${described.replace(/\s+/g, ' ').trim()}`;
    })
    .filter(Boolean);
  return items.length ? items.join('\n') : pageText(page);
}

function silhouetteProofOutfits(reportData: StylistBlueprintReportData): SilhouetteProofOutfit[] {
  const rulesPageNumber = getStylistBlueprintRulesStartPage(reportData);
  const rulesPage = reportData.pages.find(page => page.page_number === rulesPageNumber);
  if (!rulesPage) return [];
  const proofs: SilhouetteProofOutfit[] = [];
  for (const block of rulesPage.blocks) {
    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length) {
      for (const item of items) {
        const proof = item && typeof item === 'object' && !Array.isArray(item)
          ? (item as { example_outfit?: SilhouetteProofOutfit }).example_outfit
          : undefined;
        if (proof) proofs.push(proof);
        if (proofs.length >= 4) return proofs;
      }
    } else if (block.example_outfit) {
      proofs.push(block.example_outfit);
      if (proofs.length >= 4) return proofs;
    }
  }
  return proofs;
}

function silhouetteProofPageForPrompt(proof: SilhouetteProofOutfit): BlueprintPage {
  const index = Number(proof.image_slot.split('.').at(-1));
  return {
    page_number: Number.isInteger(index) ? 900 + index : 900,
    page_type: 'outfit',
    title: proof.title,
    subtitle: 'Silhouette Rules proof',
    blocks: [
      {
        label: 'Formula',
        heading: proof.title,
        body: `Silhouette proof principle: ${proof.principle}`,
        items: proof.formula_items,
      },
    ],
    image_refs: [],
    palette_used: proof.palette_used,
  };
}

function silhouetteProofPrompt(reportData: StylistBlueprintReportData, proof: SilhouetteProofOutfit) {
  // Same simple base as any outfit; the only extra is the shape principle this
  // particular image has to demonstrate.
  return `${wornOutfitPrompt(reportData, silhouetteProofPageForPrompt(proof))}

The outfit must clearly show this shape principle: ${proof.principle}`;
}

/**
 * Shared half of every worn-outfit render prompt. Deliberately short: the long
 * version was ~570 words of rules the image model mostly ignored, and it made
 * the studio Visuals panel unreadable. Identity, pose and background are all the
 * base needs to carry; what she wears comes from the outfit formula.
 */
const WORN_OUTFIT_RENDER_BASE = `Using the reference images, create a full-body studio photograph of the same woman wearing the outfit below.

Keep her original body proportions, weight, physique and natural body shape. Keep her face, skin tone and hairstyle. Do not slim, reshape, age or idealise her.

She is smiling, straight on to camera in a slightly stylish standing pose, with soft natural flattering makeup.

Plain studio background in matte slate ${SLATE}. Head to toe in frame, portrait 2:3, nothing cropped. No text, logos or watermarks.`;

/**
 * The per-slot half: the outfit itself, plus a coverage line only when this
 * client actually has coverage requirements. Coverage stays in the prompt
 * because an image model will otherwise render a neckline the client explicitly
 * ruled out — but it is one line now, not three paragraphs.
 */
function wornOutfitPromptDelta(reportData: StylistBlueprintReportData, page: BlueprintPage) {
  const coverage = shortCoverageLine(reportData);
  return [
    `Outfit:\n${compactOutfitRenderText(page)}`,
    coverage ? `Must stay covered: ${coverage}` : '',
  ].filter(Boolean).join('\n\n');
}

/** One line, only when the client has real coverage requirements. */
function shortCoverageLine(reportData: StylistBlueprintReportData) {
  const profile = inferStylistCoverageProfile(reportData);
  return [
    profile.neckline ? 'no cleavage or low necklines' : '',
    profile.arms ? 'sleeves, no bare upper arms or shoulders' : '',
    profile.legs ? 'trousers or at/below-knee hems' : '',
    profile.opacity ? 'nothing sheer' : '',
    profile.looseFit ? 'nothing clingy' : '',
  ].filter(Boolean).join(', ');
}

function wornOutfitPrompt(reportData: StylistBlueprintReportData, page: BlueprintPage) {
  return `${WORN_OUTFIT_RENDER_BASE}

${wornOutfitPromptDelta(reportData, page)}`;
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
  const hairStyles = (reportData.classification.face_hair_accessories.hair_styles ?? []).join(', ');
  const hairColours = (reportData.classification.face_hair_accessories.hair_colour_options ?? []).join(', ');
  const eyewearShapes = (reportData.classification.face_hair_accessories.eyewear_shapes ?? []).join(', ');
  const makeupColours = (reportData.classification.makeup?.colours ?? []).join(', ');
  const prompts: Record<keyof MutablePaths['prescription'], string> = {
    basePalette: `${base} Show exactly 10 colour swatches in two rows of five. Use these colours exactly: ${basePalette}.`,
    accentPalette: `${base} Show exactly 5 colour swatches in one centered row. Use these colours exactly: ${accentPalette}.`,
    necklineGrid: `${base} Show six approved neckline geometry diagrams in a 3x2 grid: ${reportData.classification.face_hair_accessories.approved_necklines.join(', ')}. Warm-white line work.`,
    sleeveWaistGrid: `${base} Show sleeve and waistline construction geometry diagrams for these silhouette rules: ${reportData.classification.body.silhouette_rules.join(', ')}. Warm-white line work.`,
    hairDirections: `Use the uploaded client headshot as the source image. Preserve the client's identity, face, skin tone, facial features, and natural proportions in every cell. Create one clean square 2x2 grid image with exactly four polished head-and-shoulders hairstyle options for the same client: ${hairStyles}. Each cell should show one distinct realistic, wearable hairstyle matched to ${reportData.classification.face_hair_accessories.face_shape} facial architecture. Fill the square composition evenly with no blank bands. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    hairColourDirections: `Use the uploaded client headshot as the source image. Preserve the client's identity, face, skin tone, facial features, existing hairstyle, existing haircut, hair length, hair texture, parting, and natural proportions in every cell. Create one clean square 2x2 grid image with exactly four head-and-shoulders variations of the same client, each showing a different flattering, realistic, salon-achievable hair colour or highlight direction: ${hairColours}. Keep the existing hairstyle/cut identical across cells — vary only the hair colour/highlight placement. The result must look classy, feminine, expensive, and wearable, never brassy, patchy, fantasy-coloured, stripy, or over-processed. Colours must look natural on this client's depth and undertone. Fill the square composition evenly with no blank bands. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    eyewearFrames: `Use the uploaded client headshot as the source image. Preserve the client's identity, face, skin tone, facial features, and natural proportions in every cell. Create one clean square 2x2 grid image with exactly four eyewear options on the same client: two optical eyeglass frames and two sunglasses. Frame direction: ${eyewearShapes}. Frames must be realistic, properly scaled, and matched to ${reportData.classification.face_hair_accessories.face_shape} facial architecture. Fill the square composition evenly with no blank bands. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    makeupLook: `Use the uploaded client headshot as the source image. Preserve the client's exact identity, facial features, skin tone, face shape, hair, and natural proportions. Create one clean head-and-shoulders portrait of the same client wearing subtle natural everyday makeup: skin-first, fresh, soft, and barely-there. This should look like polished real-life makeup, not glam makeup, not bridal makeup, not party makeup, not editorial beauty, and not a heavy makeover. Use these flattering everyday shades very lightly: ${makeupColours}. Avoid heavy foundation, dramatic contour, sharp brows, smoky eyes, false lashes, thick eyeliner, glitter, overdrawn lips, high-shine highlight, and bold lipstick. Even, professional, realistic studio lighting; do not slim, age, or idealise the client. Matte ICONIK slate #94A6AD background. No text, no labels, no numbers, no before/after captions.`,
    colourDrapeComparison: colourDrapeComparisonPrompt(reportData),
    approvedFabrics: `${base} Show a 2x2 macro texture grid of approved fabrics: ${reportData.classification.fabrics.approved.map(f => f.name).join(', ')}. Warm ivory fabric texture, photorealistic macro detail.`,
    avoidedFabrics: `${base} Show avoided fabric macro swatches: ${reportData.classification.fabrics.avoid.map(f => f.name).join(', ')}. Add subtle warm-rose diagonal avoid strokes. Photorealistic macro detail.`,
  };
  return prompts[slot];
}

function bestDrapeColour(reportData: StylistBlueprintReportData) {
  return (
    reportData.classification.colour.base_palette.find(colour => /face|near|lift|best|soft|clear|fresh/i.test(`${colour.name} ${colour.usage}`))
    ?? reportData.classification.colour.accent_palette[0]
    ?? reportData.classification.colour.base_palette.find(colour => !/black|charcoal|grey|gray|taupe|brown|espresso|camel|ivory|white|cream|beige/i.test(colour.name))
    ?? reportData.classification.colour.base_palette[0]
    ?? { name: 'soft flattering palette colour', hex: '#A8B8A0' }
  );
}

function avoidDrapeColour(reportData: StylistBlueprintReportData) {
  const avoid = reportData.classification.colour.avoid_colours[0];
  if (avoid) return avoid;
  const undertone = reportData.classification.colour.undertone_direction.toLowerCase();
  if (/warm|gold|olive/.test(undertone)) return 'icy blue-white';
  if (/cool|pink|blue/.test(undertone)) return 'yellow mustard';
  return 'harsh neon orange';
}

function colourDrapeComparisonPrompt(reportData: StylistBlueprintReportData) {
  const best = bestDrapeColour(reportData);
  const avoid = avoidDrapeColour(reportData);
  return `Use the uploaded client headshot as the source image. Preserve the client's exact identity, facial features, skin tone, hair, face shape, and natural proportions.

Create a realistic professional colour-analysis split portrait: the same client head-and-shoulders twice, side by side, on the same clean studio background. Left side draped near the face in the client's MOST UNFLATTERING colour direction: ${avoid}. Right side draped near the face in the client's MOST FLATTERING colour direction: ${best.name} ${best.hex}.

CRITICAL — this must look like one honest photograph split in two, not a beauty edit:
- Both sides must use identical, equal, neutral studio lighting: same exposure, same white balance, same softbox setup, same shadows, same background, same camera angle, same distance, same pose and expression.
- Do NOT brighten, glow, smooth, or add radiance to the flattering side. Do NOT darken, dull, grey, or add shadow to the unflattering side.
- The ONLY difference between the two sides is the colour of the fabric draped at the neckline. Any difference in how the skin reads must come purely from how each drape colour interacts with the same skin under the same light.

No text, no labels, no typography, no arrows, no captions, no logos, no watermark. Do not add jewellery or makeup. Keep both sides identically and professionally lit.`;
}

function transformationLookPageForSlot(reportData: StylistBlueprintReportData, index: number): BlueprintPage {
  const pageNumber = getStylistBlueprintTransformationPage(reportData);
  if (!pageNumber) throw new Error('This report version has no transformation preview page');
  const page = reportData.pages.find(item => item.page_number === pageNumber);
  const block = page?.blocks[index];
  if (!page || page.page_type !== 'transformation' || !block) throw new Error(`Missing transformation look ${index + 1}`);
  return {
    page_number: page.page_number,
    page_type: 'outfit',
    title: `${page.title} - Look ${index + 1}`,
    subtitle: block.heading || page.subtitle,
    blocks: [
      {
        label: 'Formula',
        heading: block.heading,
        body: block.body,
        reason: block.reason,
        items: block.items,
      },
    ],
    image_refs: [],
    palette_used: page.palette_used,
  };
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
  const pageNumber = getStylistBlueprintOutfitStartPage(reportData) + index;
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
      size: '1024x1024',
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
      size: '1024x1024',
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

  if (slotKey === 'prescription.hairColourDirections') {
    if (!getStylistBlueprintHairColourPage(reportData)) throw new Error('This report version has no hair colour direction image');
    if (!photos.headshot) throw new Error('No headshot found for hair colour direction image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: prescriptionPrompt(reportData, 'hairColourDirections'),
      sourceUrl: photos.headshot,
      size: '1024x1536',
      getCurrent: paths => paths.prescription.hairColourDirections,
      setCurrent: (paths, path) => { paths.prescription.hairColourDirections = path; },
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

  if (slotKey === 'prescription.makeupLook') {
    if (!getStylistBlueprintMakeupPage(reportData)) throw new Error('This report version has no makeup look image');
    if (!photos.headshot) throw new Error('No headshot found for makeup look image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: prescriptionPrompt(reportData, 'makeupLook'),
      sourceUrl: photos.headshot,
      size: '1024x1536',
      getCurrent: paths => paths.prescription.makeupLook,
      setCurrent: (paths, path) => { paths.prescription.makeupLook = path; },
    };
  }

  if (slotKey === 'prescription.colourDrapeComparison') {
    if (!getStylistBlueprintTransformationPage(reportData)) throw new Error('This report version has no colour drape comparison image');
    if (!photos.headshot) throw new Error('No headshot found for colour drape comparison image generation');
    return {
      fileName: regeneratedFileName(baseFileName),
      prompt: prescriptionPrompt(reportData, 'colourDrapeComparison'),
      sourceUrl: photos.headshot,
      size: '1536x1024',
      getCurrent: paths => paths.prescription.colourDrapeComparison,
      setCurrent: (paths, path) => { paths.prescription.colourDrapeComparison = path; },
    };
  }

  if (slotKey.startsWith('application.transformationLooks.')) {
    if (!getStylistBlueprintTransformationPage(reportData)) throw new Error('This report version has no transformation preview images');
    const index = Number(slotKey.split('.').at(-1));
    if (!Number.isInteger(index) || index < 0 || index >= 3) throw new Error('Invalid transformation image slot');
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (!clientSource) throw new Error('No client photo found for transformation image generation');
    return {
      fileName: regeneratedFileName(`transformation-look-${index + 1}`),
      prompt: wornOutfitPrompt(reportData, transformationLookPageForSlot(reportData, index)),
      sourceUrl: clientSource,
      extraSourceUrl: photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
      size: '1024x1536',
      getCurrent: paths => paths.application.transformationLooks[index],
      setCurrent: (paths, path) => { paths.application.transformationLooks[index] = path; },
    };
  }

  if (slotKey.startsWith('application.silhouetteProofs.')) {
    const index = Number(slotKey.split('.').at(-1));
    const proof = silhouetteProofOutfits(reportData)[index];
    if (!Number.isInteger(index) || index < 0 || index >= 4 || !proof) throw new Error('Invalid silhouette proof image slot');
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (!clientSource) throw new Error('No client photo found for silhouette proof image generation');
    return {
      fileName: regeneratedFileName(`silhouette-proof-${index + 1}`),
      prompt: silhouetteProofPrompt(reportData, proof),
      sourceUrl: clientSource,
      extraSourceUrl: photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
      size: '1024x1536',
      getCurrent: paths => paths.application.silhouetteProofs[index],
      setCurrent: (paths, path) => { paths.application.silhouetteProofs[index] = path; },
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

export function buildStylistBlueprintImageSlotPlanSummaryForTest(
  slotKey: StylistBlueprintImageSlotKey,
  reportData: StylistBlueprintReportData,
  submission?: StylistIntakeSubmission | null,
) {
  const photos = sourcePhotos(submission);
  const plan = buildSingleSlotPlan(slotKey, reportData, photos);
  return {
    fileName: plan.fileName,
    prompt: plan.prompt,
    sourceUrl: plan.sourceUrl ?? null,
    extraSourceUrl: plan.extraSourceUrl ?? null,
    size: plan.size ?? '1024x1536',
  };
}

/** Only slots that appear in this report and can use the supplied client photos. */
export function planStylistBlueprintImageGeneration(
  reportData: StylistBlueprintReportData,
  paths: StylistBlueprintImagePaths | null,
  submission: StylistIntakeSubmission | null,
  group: StylistBlueprintImageGroup = 'all',
  force = false,
) {
  const hidden = new Set(reportData.studio?.hidden_page_numbers ?? []);
  const photos = sourcePhotos(submission);
  return STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS.filter(slot => {
    const page = getStylistBlueprintImageSlotPageNumber(slot, reportData);
    if (!page || hidden.has(page) || !reportData.pages.some(item => item.page_number === page)) return false;
    if (slot === 'closing.editTeaser' && isManualStylistBlueprintSubmission(submission)) return false;
    const index = Number(slot.split('.').at(-1));
    const slotGroup = slot.startsWith('application.outfitFlatlays.')
      ? `capsule_${Math.floor(index / (getStylistBlueprintOutfitCount(reportData) / 4)) + 1}` : slot.split('.')[0];
    if (group !== 'all' && group !== slotGroup) return false;
    try {
      const plan = buildSingleSlotPlan(slot, reportData, photos);
      if (!plan.sourceUrl) return false;
      return force || !plan.getCurrent(normalise(paths));
    } catch { return false; }
  });
}

export function buildStylistBlueprintManualImagePrompt(
  slotKey: StylistBlueprintImageSlotKey,
  reportData: StylistBlueprintReportData,
) {
  const plan = buildSingleSlotPlan(slotKey, reportData, {
    front: 'manual-source-photo',
    side: 'manual-source-photo',
    headshot: 'manual-source-photo',
    outfit: 'manual-source-photo',
  });
  const prompt = plan.prompt;
  // 28 of the 38 slots share WORN_OUTFIT_RENDER_BASE verbatim. Splitting it out
  // lets the studio show the few lines that actually differ per slot and keep
  // the shared preamble collapsed, instead of 28 walls of identical text.
  const sharedPreamble = prompt.startsWith(WORN_OUTFIT_RENDER_BASE) ? WORN_OUTFIT_RENDER_BASE : null;
  const slotDetail = sharedPreamble ? prompt.slice(sharedPreamble.length).trim() : prompt;
  return { prompt, size: plan.size ?? '1024x1536', sharedPreamble, slotDetail };
}

export async function uploadStylistBlueprintManualImage(input: {
  reportId: string;
  reportData: StylistBlueprintReportData;
  slotKey: StylistBlueprintImageSlotKey;
  buffer: Buffer;
  shareToken?: string | null;
  pageNumber?: number | null;
}) {
  const { data: current, error: loadError } = await supabaseAdmin.from('stylist_blueprint_reports')
    .select('image_urls, updated_at, revision, section_approvals, status, progress_stage').eq('id', input.reportId).single();
  if (loadError || !current) throw new Error('Could not load report for upload');
  if (current.status === 'generating' || current.progress_stage) throw new Error('Wait for generation to finish before uploading');
  const paths = normalise(current.image_urls as StylistBlueprintImagePaths | null);
  const plan = buildSingleSlotPlan(input.slotKey, input.reportData, {
    front: 'manual-source-photo',
    side: 'manual-source-photo',
    headshot: 'manual-source-photo',
    outfit: 'manual-source-photo',
  });
  const path = await uploadBuffer(input.reportId, `${input.slotKey.replace(/\./g, '-')}-manual-${Date.now()}`, input.buffer);
  plan.setCurrent(paths, path);
  const approvals = { ...(current.section_approvals as Record<string, boolean> ?? {}) };
  if (input.pageNumber) approvals[`p${input.pageNumber}`] = false;
  const { data: saved, error } = await supabaseAdmin.from('stylist_blueprint_reports').update({
    image_urls: paths, section_approvals: approvals, published_at: null, delivered_at: null,
    status: 'in_review', revision: Number(current.revision ?? 0) + 1, updated_at: new Date().toISOString(),
  }).eq('id', input.reportId).eq('updated_at', current.updated_at).select('id').maybeSingle();
  if (error) throw new Error(`Could not save uploaded image: ${error.message}`);
  if (!saved) throw new Error('The report changed during upload. Retry the upload.');
  await revalidateStylistBlueprintCache(input.reportId, input.shareToken);
  return { imagePaths: paths, imageUrls: await resolveStylistBlueprintImageUrls(paths), path };
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
    type PrescriptionSlotSpec = [keyof MutablePaths['prescription'], string, string | null, '1024x1024' | '1024x1536' | '1536x1024'];
    const prescriptionSlots: Array<PrescriptionSlotSpec> = [
      ['hairDirections', 'prescription-hair-directions', photos.headshot, '1024x1024'],
      ...(getStylistBlueprintHairColourPage(reportData)
        ? [['hairColourDirections', 'prescription-hair-colour-directions', photos.headshot, '1024x1024'] as PrescriptionSlotSpec]
        : []),
      ['eyewearFrames', 'prescription-eyewear-frames', photos.headshot, '1024x1024'],
      ...(getStylistBlueprintMakeupPage(reportData)
        ? [['makeupLook', 'prescription-makeup-look', photos.headshot, '1024x1536'] as PrescriptionSlotSpec]
        : []),
      ...(getStylistBlueprintTransformationPage(reportData)
        ? [['colourDrapeComparison', 'prescription-colour-drape-comparison', photos.headshot, '1536x1024'] as PrescriptionSlotSpec]
        : []),
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

  if (group === 'all') {
    const transformationPageNumber = getStylistBlueprintTransformationPage(reportData);
    const clientSource = photos.front || photos.side || photos.headshot || null;
    if (transformationPageNumber && clientSource) {
      for (let index = 0; index < 3; index++) {
        await setSlot({
          reportId, paths, shareToken, force, fileName: `transformation-look-${index + 1}`,
          getCurrent: () => paths.application.transformationLooks[index],
          setCurrent: path => { paths.application.transformationLooks[index] = path; },
          create: () => generatedImage(
            reportId,
            `transformation-look-${index + 1}`,
            wornOutfitPrompt(reportData, transformationLookPageForSlot(reportData, index)),
            clientSource,
            '1024x1536',
            photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
          ),
        });
      }
    }

    if (silhouetteProofOutfits(reportData).length && !clientSource) {
      throw new Error('No client photo found for silhouette proof image generation');
    }
    for (const [index, proof] of silhouetteProofOutfits(reportData).slice(0, 4).entries()) {
      await setSlot({
        reportId, paths, shareToken, force, fileName: `silhouette-proof-${index + 1}`,
        getCurrent: () => paths.application.silhouetteProofs[index],
        setCurrent: path => { paths.application.silhouetteProofs[index] = path; },
        create: () => generatedImage(
          reportId,
          `silhouette-proof-${index + 1}`,
          silhouetteProofPrompt(reportData, proof),
          clientSource,
          '1024x1536',
          photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
        ),
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
      const index = page - getStylistBlueprintOutfitStartPage(reportData);
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

export async function generateStylistBlueprintSilhouetteProofImages(
  reportId: string,
  reportData: StylistBlueprintReportData,
  shareToken?: string | null,
  options: { force?: boolean; submission?: StylistIntakeSubmission | null } = {},
): Promise<StylistBlueprintImagePaths> {
  const paths = await getStoredPaths(reportId);
  const force = Boolean(options.force);
  const photos = sourcePhotos(options.submission);
  const clientSource = photos.front || photos.side || photos.headshot || null;
  if (silhouetteProofOutfits(reportData).length && !clientSource) {
    throw new Error('No client photo found for silhouette proof image generation');
  }
  await persistPaths(reportId, paths, shareToken, 'generating_images_silhouette_proofs');

  for (const [index, proof] of silhouetteProofOutfits(reportData).slice(0, 4).entries()) {
    await setSlot({
      reportId, paths, shareToken, force, fileName: `silhouette-proof-${index + 1}`,
      getCurrent: () => paths.application.silhouetteProofs[index],
      setCurrent: path => { paths.application.silhouetteProofs[index] = path; },
      create: () => generatedImage(
        reportId,
        `silhouette-proof-${index + 1}`,
        silhouetteProofPrompt(reportData, proof),
        clientSource,
        '1024x1536',
        photos.headshot && photos.headshot !== clientSource ? photos.headshot : null,
      ),
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
    ...normalised.application.transformationLooks,
    ...normalised.application.silhouetteProofs,
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

  return mapStylistBlueprintImagePaths(paths, path => signedUrlMap.get(path) ?? null);
}

/** Every stored image path a report references. */
export function isStylistBlueprintImagePath(paths: StylistBlueprintImagePaths | null | undefined, path: string) {
  return Boolean(path) && collectPaths(paths).includes(path);
}

/** A short-lived URL for one stored report image. */
export function signStylistBlueprintImagePath(path: string) {
  return getSignedUrl(path);
}

/** Builds the resolved image structure the report renders, with URLs chosen by the caller. */
export function mapStylistBlueprintImagePaths(paths: StylistBlueprintImagePaths | null | undefined, urlFor: (path: string) => string | null) {
  if (!paths) return null;
  const resolved = normalise(paths);
  const map = (path: string | null | undefined) => path ? urlFor(path) : null;
  return {
    cover: { portrait: map(resolved.cover.portrait) },
    diagnosis: Object.fromEntries(Object.entries(resolved.diagnosis).map(([key, value]) => [key, map(value)])),
    prescription: Object.fromEntries(Object.entries(resolved.prescription).map(([key, value]) => [key, map(value)])),
    application: {
      capsuleCovers: resolved.application.capsuleCovers.map(() => null),
      transformationLooks: resolved.application.transformationLooks.map(map),
      silhouetteProofs: resolved.application.silhouetteProofs.map(map),
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

export function getStylistBlueprintImageSlotPageNumber(slot: StylistBlueprintImageSlotKey, data?: StylistBlueprintReportData) {
  if (slot === 'diagnosis.silhouetteFront' || slot === 'diagnosis.silhouetteSide') return getStylistBlueprintBodyGeometryPage(data);
  if (slot === 'diagnosis.undertoneMap') return getStylistBlueprintChromaticPage(data);
  if (slot === 'diagnosis.faceShapeDiagram') return getStylistBlueprintFaceArchitecturePage(data);
  if (slot === 'prescription.colourDrapeComparison') return getStylistBlueprintColourDrapePage(data);
  if (slot === 'prescription.hairDirections') return getStylistBlueprintHairstylePage(data);
  if (slot === 'prescription.hairColourDirections') return getStylistBlueprintHairColourPage(data);
  if (slot === 'prescription.eyewearFrames') return getStylistBlueprintEyeframePage(data);
  if (slot === 'prescription.makeupLook') return getStylistBlueprintMakeupPage(data);
  if (slot.startsWith('application.transformationLooks.')) return getStylistBlueprintTransformationPage(data);
  if (slot.startsWith('application.silhouetteProofs.')) return getStylistBlueprintRulesStartPage(data);
  if (slot.startsWith('application.outfitFlatlays.')) return getStylistBlueprintOutfitStartPage(data) + Number(slot.split('.').at(-1));
  if (slot === 'closing.editTeaser') return getStylistBlueprintContinuationPage(data);
  return null;
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
    includeTransformationPreview?: boolean;
    includeBeautyPages?: boolean;
    reportData?: StylistBlueprintReportData;
  } = {},
) {
  const normalised = normalise(paths);
  const outfitCount = options.outfitCount ?? 20;
  const capsuleSize = Math.ceil(outfitCount / 4);
  const hidden = new Set(options.reportData?.studio?.hidden_page_numbers ?? []);
  const counts: Record<string, { done: number; total: number }> = Object.fromEntries(
    ['diagnosis', 'prescription', 'application', 'capsule_1', 'capsule_2', 'capsule_3', 'capsule_4', 'closing']
      .map(group => [group, { done: 0, total: 0 }]),
  );
  for (const slot of STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS) {
    const page = getStylistBlueprintImageSlotPageNumber(slot, options.reportData);
    if (page && hidden.has(page)) continue;
    let group = slot.split('.')[0];
    if (slot === 'diagnosis.silhouetteFront' && !options.hasFrontPhoto) continue;
    if (slot === 'diagnosis.silhouetteSide' && !options.hasSidePhoto) continue;
    if ((slot === 'diagnosis.undertoneMap' || slot === 'diagnosis.faceShapeDiagram') && !options.hasHeadshot) continue;
    if (slot.startsWith('prescription.')) {
      if (!options.hasHeadshot) continue;
      if (slot === 'prescription.colourDrapeComparison' && !options.includeTransformationPreview) continue;
      if ((slot === 'prescription.hairColourDirections' || slot === 'prescription.makeupLook') && !options.includeBeautyPages) continue;
    }
    if (slot.startsWith('application.transformationLooks.') && (!options.hasClientPhoto || !options.includeTransformationPreview)) continue;
    if (slot.startsWith('application.outfitFlatlays.')) {
      const index = Number(slot.split('.').at(-1));
      if (!options.hasClientPhoto || index >= outfitCount) continue;
      group = `capsule_${Math.floor(index / capsuleSize) + 1}`;
    }
    if (slot === 'closing.editTeaser' && (!options.hasClientPhoto || options.includeClosingEditTeaser === false)) continue;
    let current: unknown = normalised;
    for (const key of slot.split('.')) current = current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : null;
    counts[group].total += 1;
    if (typeof current === 'string' && current) counts[group].done += 1;
  }
  return counts;
}
