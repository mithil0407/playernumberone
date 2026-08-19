import 'server-only';

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import {
  classifyStylistBlueprint,
  createBlueprintShell,
  type StylistBlueprintClassification,
  type StylistIntakeSubmission,
} from '@/lib/stylistBlueprintGenerator';
import {
  STYLE_SCAN_GENERATION_VERSION,
  STYLE_SCAN_RESULT_BUCKET,
  type InstantReportRefinementV1,
  type InstantReportV1,
  type StyleScanAnalysisV1,
  type StyleScanAnswersV1,
} from '@/lib/styleScan';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const google = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function concernCopy(concern: StyleScanAnswersV1['concern']) {
  return {
    tummy: {
      dont: ['Tucked-in shirts with mid-rise bottoms', 'Clingy jersey across the waist', 'Hard horizontal colour breaks at the tummy'],
      do: 'A softly structured open-neck top, high-rise straight trousers, a longline third layer, pointed flats and a medium structured bag',
    },
    arms: {
      dont: ['Cap sleeves ending at the widest point', 'Tight armholes in rigid fabric', 'High-contrast sleeve hems'],
      do: 'A fluid elbow-sleeve top, clean high-rise trousers, a softly defined waist, low-vamp shoes and an elongated pendant',
    },
    hips: {
      dont: ['Tops ending at the widest hip point', 'Side-entry pockets that flare open', 'High-contrast bottoms with a quiet top'],
      do: 'A shoulder-defining top, waist-skimming layer, clean dark straight-leg bottoms, pointed shoes and a face-level accessory',
    },
    height: {
      dont: ['Multiple horizontal colour breaks', 'Long tops over low-rise bottoms', 'Heavy ankle straps with cropped trousers'],
      do: 'A tonal column, a waist-length structured layer, full-length high-rise trousers, pointed shoes and a compact bag',
    },
    nothing_specific: {
      dont: ['Shapeless pieces with no visual intention', 'Three competing focal points in one outfit', 'Colours that fight your natural undertone'],
      do: 'A clean neckline, one defined proportion point, a tonal base, a structured finishing layer and one deliberate accessory',
    },
  }[concern];
}

function verticalLine(geometry: string, directive: string) {
  const text = `${geometry} ${directive}`.toLowerCase();
  if (/petite|short vertical|shorter vertical|lengthen/.test(text)) return 'short vertical line';
  if (/tall|long vertical|elongated/.test(text)) return 'long vertical line';
  return 'balanced vertical line';
}

function confidenceNumber(value: 'low' | 'medium' | 'high') {
  return value === 'high' ? 0.9 : value === 'medium' ? 0.72 : 0.45;
}

function buildDonts(
  answers: StyleScanAnswersV1,
  classification: StylistBlueprintClassification,
): StyleScanAnalysisV1['donts'] {
  const concern = concernCopy(answers.concern);
  const geometry = classification.body.geometry.toLowerCase();
  const undertone = classification.colour.undertone_direction;
  const avoidColour = classification.colour.avoid_colours[0] || 'icy, high-contrast shades';
  return [
    {
      title: concern.dont[0],
      why: `On a ${geometry} frame, this places attention exactly where you asked us to soften it instead of creating a controlled line.`,
    },
    {
      title: concern.dont[1],
      why: `It works against your proportion directive: ${classification.body.proportion_directive.replace(/\.$/, '').toLowerCase()}.`,
    },
    {
      title: `${avoidColour} near your face`,
      why: `These shades fight your ${undertone} undertone and ${classification.colour.depth} depth, which can make an otherwise good outfit look off in photos.`,
    },
  ];
}

function buildOutfit(answers: StyleScanAnswersV1, classification: StylistBlueprintClassification) {
  const palette = classification.colour.base_palette.slice(0, 3).map(colour => colour.name).join(', ');
  const formula = concernCopy(answers.concern).do;
  return {
    title: `${label(answers.dressCode)} formula`,
    formula: `${formula}. Build it in ${palette || 'your warmest wearable neutrals'}.`,
    why: `It respects your ${label(answers.dressPreference).toLowerCase()} fit preference while creating ${classification.body.proportion_directive.replace(/\.$/, '').toLowerCase()}.`,
  };
}

export async function generateStyleScanAnalysis(input: {
  scanId: string;
  phone: string;
  answers: StyleScanAnswersV1;
  headshotUrl: string;
  fullBodyUrl: string;
}) {
  const submission: StylistIntakeSubmission = {
    id: input.scanId,
    customer_phone: input.phone,
    country: 'India',
    primary_language: 'English',
    photo_urls: {
      headshot: input.headshotUrl,
      full_body_front: input.fullBodyUrl,
    },
    focus_areas: input.answers.concern === 'nothing_specific' ? [] : [input.answers.concern],
    coverage_requirements: {
      modesty: input.answers.dressPreference,
      arms: input.answers.concern === 'arms',
      tummy: input.answers.concern === 'tummy',
    },
    lifestyle_context: {
      daily_dress_code: input.answers.dressCode,
      upcoming_60_days: input.answers.upcoming,
      emotional_context: input.answers.lastFeltGreat,
    },
    piece_preferences: {},
    completion_percentage: 100,
    completed_at: new Date().toISOString(),
    intake_source: 'style_scan',
  };
  const classification = await classifyStylistBlueprint(submission);
  const shell = createBlueprintShell(submission, classification);
  const overall = Math.min(
    confidenceNumber(shell.analysis.confidence.body),
    confidenceNumber(shell.analysis.confidence.colour),
  );
  const scan: StyleScanAnalysisV1 = {
    version: 'style-scan-v1',
    geometry: {
      shape: classification.body.geometry,
      verticalLine: verticalLine(classification.body.geometry, classification.body.proportion_directive),
      interpretation: classification.body.proportion_directive,
    },
    undertone: {
      direction: classification.colour.undertone_direction,
      depth: classification.colour.depth,
      wardrobeConflict: `${classification.colour.avoid_colours.slice(0, 2).join(' and ') || 'Very cool, high-contrast colours'} are likely to wash you out or overpower your natural colouring.`,
    },
    donts: buildDonts(input.answers, classification),
    do: buildOutfit(input.answers, classification),
    confidence: {
      body: shell.analysis.confidence.body,
      colour: shell.analysis.confidence.colour,
      overall,
    },
    generatedAt: new Date().toISOString(),
    model: TEXT_MODEL,
  };
  return { scan, classification };
}

async function ensureResultBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(STYLE_SCAN_RESULT_BUCKET, {
    public: false,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

async function generateImageBuffer(prompt: string) {
  try {
    const response = await google.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseModalities: ['IMAGE'], httpOptions: { timeout: 60_000 } },
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const data = parts.find(part => part.inlineData?.data)?.inlineData?.data;
    if (data) return Buffer.from(data, 'base64');
  } catch (error) {
    console.warn('[style-scan] Gemini image failed; trying OpenAI:', error instanceof Error ? error.message : error);
  }
  if (!openai) return null;
  const result = await openai.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: '1024x1536',
    quality: 'medium',
  } as Parameters<typeof openai.images.generate>[0]);
  const data = (result as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
  return data ? Buffer.from(data, 'base64') : null;
}

export async function generateEditorialOutfitVisual(input: {
  ownerId: string;
  slot: string;
  outfit: { title: string; formula: string; why?: string };
  palette?: Array<{ name: string; hex: string }>;
}) {
  const palette = input.palette?.map(colour => `${colour.name} ${colour.hex}`).join(', ') || 'editorial warm neutrals';
  const prompt = `Create a premium vertical editorial fashion flat-lay for ICONIK Women.
Warm cream studio background, refined Indian luxury-magazine art direction, realistic garments, no person, no mannequin, no text, no logo, no watermark, no collage borders.
Outfit: ${input.outfit.title}. ${input.outfit.formula}
Palette: ${palette}.
Show every named garment, shoe, bag and accessory once, beautifully spaced, coherent and commercially wearable. 2:3 portrait composition.`;
  const raw = await generateImageBuffer(prompt);
  if (!raw) throw new Error('Outfit visual generation returned no image');
  const jpeg = await sharp(raw, { failOn: 'none' }).rotate().resize(1024, 1536, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
  const path = `${input.ownerId}/${input.slot}.jpg`;
  let upload = await supabaseAdmin.storage.from(STYLE_SCAN_RESULT_BUCKET).upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  if (upload.error && /bucket not found|not found/i.test(upload.error.message)) {
    await ensureResultBucket();
    upload = await supabaseAdmin.storage.from(STYLE_SCAN_RESULT_BUCKET).upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  }
  if (upload.error) throw upload.error;
  return upload.data.path;
}

function cleanJson(text: string) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export async function generateInstantReportText(input: {
  scan: StyleScanAnalysisV1;
  classification: StylistBlueprintClassification;
  refinement: InstantReportRefinementV1;
  answers: StyleScanAnswersV1;
}): Promise<InstantReportV1> {
  const prompt = `You are ICONIK's senior India womenswear styling engine. Return ONLY JSON, never markdown.
Create a concise 20-page-equivalent Instant Report with exactly 10 complete, distinct, buyable outfit formulas. Respect all modesty, hard-no and fit constraints. Do not mention weight loss, medical claims, exact body measurements inferred from photos, brands, prices, or shopping links.

Required JSON:
{
 "snapshot":"",
 "proportionRules":[""],
 "chromaticProfile":"",
 "faceGuidance":{"necklines":[""],"accessories":[""],"hair":[""]},
 "outfitSystem":"",
 "outfits":[{"number":1,"title":"","context":"","formula":"","silhouetteRationale":"","colourRationale":"","coverageNotes":""}],
 "shoppingRules":[""],
 "checklist":[""]
}

Scan: ${JSON.stringify(input.scan)}
Full classification: ${JSON.stringify(input.classification)}
Free answers: ${JSON.stringify(input.answers)}
Paid refinement: ${JSON.stringify(input.refinement)}`;
  const response = await google.models.generateContent({ model: TEXT_MODEL, contents: prompt });
  const parsed = JSON.parse(cleanJson(response.text || '{}')) as Partial<InstantReportV1>;
  if (!Array.isArray(parsed.outfits) || parsed.outfits.length !== 10) {
    throw new Error('Instant report must contain exactly 10 outfits');
  }
  const base = input.classification.colour.base_palette.slice(0, 15).map(colour => ({
    name: colour.name,
    hex: colour.hex,
    use: colour.usage,
  }));
  return {
    version: 'instant-report-v1',
    signature: 'ICONIK Styling Team',
    generatedAt: new Date().toISOString(),
    snapshot: String(parsed.snapshot || input.classification.client.lifestyle_summary),
    geometry: input.scan.geometry,
    proportionRules: Array.isArray(parsed.proportionRules) ? parsed.proportionRules.map(String).slice(0, 8) : [],
    chromaticProfile: String(parsed.chromaticProfile || `${input.scan.undertone.direction}, ${input.scan.undertone.depth}`),
    palette: base,
    avoidColours: input.classification.colour.avoid_colours.slice(0, 8),
    faceGuidance: {
      necklines: Array.isArray(parsed.faceGuidance?.necklines) ? parsed.faceGuidance!.necklines.map(String).slice(0, 6) : input.classification.face_hair_accessories.approved_necklines,
      accessories: Array.isArray(parsed.faceGuidance?.accessories) ? parsed.faceGuidance!.accessories.map(String).slice(0, 6) : [input.classification.face_hair_accessories.jewellery_direction],
      hair: Array.isArray(parsed.faceGuidance?.hair) ? parsed.faceGuidance!.hair.map(String).slice(0, 6) : input.classification.face_hair_accessories.hair_styles,
    },
    outfitSystem: String(parsed.outfitSystem || 'Ten distinct formulas for the contexts you chose.'),
    outfits: parsed.outfits.map((outfit, index) => ({
      number: index + 1,
      title: String(outfit.title || `Outfit ${index + 1}`),
      context: String(outfit.context || input.refinement.priorityContexts[index % 2]),
      formula: String(outfit.formula || ''),
      silhouetteRationale: String(outfit.silhouetteRationale || input.scan.geometry.interpretation),
      colourRationale: String(outfit.colourRationale || input.scan.undertone.wardrobeConflict),
      coverageNotes: String(outfit.coverageNotes || input.refinement.hardNos || 'Balanced coverage and ease.'),
    })),
    shoppingRules: Array.isArray(parsed.shoppingRules) ? parsed.shoppingRules.map(String).slice(0, 10) : [],
    checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map(String).slice(0, 10) : [],
  };
}

export const STYLE_SCAN_MODEL_METADATA = { text: TEXT_MODEL, image: IMAGE_MODEL, version: STYLE_SCAN_GENERATION_VERSION };
