// manImageGenerator.ts
// Phase 3 & 4 of the /man report pipeline: image generation via Gemini.
//
// Phase 3 — Face option grids (3 calls, parallel):
//   Client's HEADSHOT → 2x2 hairstyle, beard, and eyewear grids
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
import {
  normaliseComboGridGroupText,
  normaliseComboGridText,
  type ComboGridKind,
  type ParsedComboGridGroup,
} from './manComboGridSection';

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
const ICONIK_SLATE = '#94A6AD';
const ABSOLUTE_NO_TEXT_RULE = 'Absolutely no text, letters, words, typography, captions, labels, numbers, annotations, arrows, callouts, logos, signage, watermarks, UI marks, brand marks, readable symbols, product cards, before/after captions, or title text anywhere in the image. Do not place labels inside grid cells.';
const REALISTIC_MALE_GROOMING_RULE = 'This must be a realistic same-person grooming transformation, not a makeover fantasy: preserve the exact identity, face shape, skin tone, facial features, natural proportions, hairline, hair density limits, beard density limits, and age. Keep changes low-delta and barber-executable from the source photo. Do not add impossible hair volume, change the hairline, fill bald/thin areas unrealistically, invent beard coverage, reshape the jaw, slim the face, beautify skin, or make the client look like a different person.';
const MAN_STUDIO_BACKGROUND_RULE = `Use the exact same light studio background as the ICONIK stylist-admin outfit images: one flat, uniform, matte light desaturated blue-grey field in HEX ${ICONIK_SLATE} (RGB 148, 166, 173). This is a high-key light background, never charcoal, dark grey, black, moody, or vignetted. It must be a clean professional studio image with no visible flooring or room. No floor plane, floor texture, floor-to-wall seam, horizon line, baseboard, cyclorama sweep line, platform, carpet, rug, tile, wood, concrete, wall panels, corners, furniture, windows, props, architectural details, spotlight pool, shadow gradient, or background gradient. The identical flat ${ICONIK_SLATE} colour continues uninterrupted behind the subject and beneath the feet; allow only a very faint tight contact shadow directly under the shoes.`;
const MEN_STYLIST_REPORT_IMAGE_STYLE = [
  MAN_STUDIO_BACKGROUND_RULE,
  'Premium high-key studio fashion editorial with a confident, natural menswear pose.',
  'Portrait vertical 2:3 composition. Final image must be tall, not landscape or square.',
  'Full outfit visible from head to toe, centered in frame, with generous margin above the head and below the footwear. Both shoes and all footwear details must be fully visible.',
  `${ABSOLUTE_NO_TEXT_RULE} No extra people or mannequin.`,
  'Natural realistic fabric behavior and correct garment construction.',
  'Practical colour realism: if the outfit mentions sneakers, they must be white, off-white, cream, or grey-neutral with no coloured trim.',
  'Bags and shoes must be one realistic leather/suede colour: black, espresso, chocolate, cognac, tan, taupe, burgundy, cream, or restrained grey. Never add contrasting tags, stripes, piping, panels, hardware, stitching, soles, or decorative coloured details.',
  'Accent colours belong on garments, knitwear, scarves, belts, jewellery details, garment prints, or an evening clutch — never as a small coloured detail added to an otherwise neutral bag or shoe.',
].join('\n- ');

const OUTFIT_POSE_DIRECTIONS = [
  'Use a relaxed editorial weight shift with one foot slightly forward and shoulders open to camera.',
  'Use a confident three-quarter stance while naturally adjusting one cuff or the watch; keep the torso and outfit unobstructed.',
  'Use a relaxed three-quarter stance with one hand lightly in a trouser pocket and the other arm naturally visible.',
  'Use a controlled mid-step editorial pose with both feet and the complete outfit sharply visible.',
  'Use a polished three-quarter stance while lightly adjusting the jacket lapel or outer layer; if there is no layer, use an open relaxed hand position instead.',
  'Use an easy editorial stance with one foot forward, a subtle body angle, and calm confident posture.',
] as const;

function outfitPoseDirection(outfitNumber: number): string {
  return OUTFIT_POSE_DIRECTIONS[Math.max(0, outfitNumber - 1) % OUTFIT_POSE_DIRECTIONS.length];
}

const OUTFIT_POSE_VISIBILITY_RULE = 'The pose must remain realistic and wearable and must not hide the neckline, torso fit, waistband, layering, accessories, trouser silhouette, or footwear. No seated, crouched, arms-crossed, hands-behind-back, jumping, exaggerated runway, or garment-obscuring pose.';

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

/** Shape stored in image_urls JSONB column — storage paths, not URLs */
export interface ManReportImagePaths {
  hairstyleCards: (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  beardCards:     (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  eyewearCards:   (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  outfitCards:    (string | null)[];
  diagnostic?: {
    faceGeometry?: string | null;
    frameFront?: string | null;
    frameSide?: string | null;
    colourDrape?: string | null;
  };
  deliverables?: {
    beforeImage?: string | null;
    afterImage?: string | null;
    beforeAfter?: string | null;
    linkedinHeadshot?: string | null;
    datingProfileShots?: (string | null)[];
  };
  comboGridCards?: {
    office?: string | null;
    evening?: string | null;
    relaxed?: string | null;
  };
  baseModel?:     string;            // legacy — kept for backward compat with old reports
}

/** Shape returned to clients — signed URLs ready for <img> tags */
export interface ResolvedImageUrls {
  hairstyleCards: (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  beardCards:     (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  eyewearCards:   (string | null)[]; // new reports store one 2x2 grid at index 0; old reports may have 2 cards
  outfitCards:    (string | null)[];
  diagnostic?: {
    faceGeometry?: string | null;
    frameFront?: string | null;
    frameSide?: string | null;
    colourDrape?: string | null;
  };
  deliverables?: {
    beforeImage?: string | null;
    afterImage?: string | null;
    beforeAfter?: string | null;
    linkedinHeadshot?: string | null;
    datingProfileShots?: (string | null)[];
  };
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
  diagnostic?: ManReportImagePaths['diagnostic'];
  deliverables?: ManReportImagePaths['deliverables'];
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
    diagnostic: {
      faceGeometry: normaliseImagePath(paths?.diagnostic?.faceGeometry),
      frameFront: normaliseImagePath(paths?.diagnostic?.frameFront),
      frameSide: normaliseImagePath(paths?.diagnostic?.frameSide),
      colourDrape: normaliseImagePath(paths?.diagnostic?.colourDrape),
    },
    deliverables: {
      beforeImage: normaliseImagePath(paths?.deliverables?.beforeImage),
      afterImage: normaliseImagePath(paths?.deliverables?.afterImage),
      beforeAfter: normaliseImagePath(paths?.deliverables?.beforeAfter),
      linkedinHeadshot: normaliseImagePath(paths?.deliverables?.linkedinHeadshot),
      datingProfileShots: (paths?.deliverables?.datingProfileShots ?? []).map(normaliseImagePath),
    },
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
    diagnostic: {
      faceGeometry: normaliseImagePath(incoming?.diagnostic?.faceGeometry) ?? base.diagnostic?.faceGeometry ?? null,
      frameFront: normaliseImagePath(incoming?.diagnostic?.frameFront) ?? base.diagnostic?.frameFront ?? null,
      frameSide: normaliseImagePath(incoming?.diagnostic?.frameSide) ?? base.diagnostic?.frameSide ?? null,
      colourDrape: normaliseImagePath(incoming?.diagnostic?.colourDrape) ?? base.diagnostic?.colourDrape ?? null,
    },
    deliverables: {
      beforeImage: normaliseImagePath(incoming?.deliverables?.beforeImage) ?? base.deliverables?.beforeImage ?? null,
      afterImage: normaliseImagePath(incoming?.deliverables?.afterImage) ?? base.deliverables?.afterImage ?? null,
      beforeAfter: normaliseImagePath(incoming?.deliverables?.beforeAfter) ?? base.deliverables?.beforeAfter ?? null,
      linkedinHeadshot: normaliseImagePath(incoming?.deliverables?.linkedinHeadshot) ?? base.deliverables?.linkedinHeadshot ?? null,
      datingProfileShots: mergeImagePathArrays(
        base.deliverables?.datingProfileShots,
        incoming?.deliverables?.datingProfileShots,
      ),
    },
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

const GRID_POSITIONS = ['Top left', 'Top right', 'Bottom left', 'Bottom right'] as const;

function getFaceStyleOptions(
  classification: ClassificationResult,
  kind: FaceImageKind,
  override?: { optionIndex: number; style: string },
): string[] {
  const { face } = classification;
  const base = kind === 'hairstyle'
    ? [...(face.hairstyle_recommendations ?? [])]
    : kind === 'beard'
      ? [...(face.beard_style_recommendations ?? [])]
      : [...(face.eyewear_shapes ?? [])];

  if (override?.style.trim() && override.optionIndex >= 1 && override.optionIndex <= 4) {
    while (base.length < override.optionIndex) base.push('');
    base[override.optionIndex - 1] = override.style.trim();
  }

  return base.slice(0, 4);
}

function formatGridOptions(options: string[]): string {
  return GRID_POSITIONS
    .map((position, index) => `${position}: ${options[index] || 'Conservative, realistic option matching the client'}`)
    .join('\n');
}

function buildHairstyleGridPrompt(options: string[], faceShape: string, hairPresence: string | undefined): string {
  return `Use the uploaded client headshot as the source image. Create a realistic men's grooming recommendation grid.

Output: one clean square 2x2 grid image, four equal quadrants, same man in each quadrant, head and upper shoulders only. Fill the square composition evenly with no blank bands. ${ABSOLUTE_NO_TEXT_RULE}

Grid mapping:
${formatGridOptions(options)}

Rules:
- ${REALISTIC_MALE_GROOMING_RULE}
- Preserve the client's facial features, skin tone, expression, and general headshot framing in every cell.
- Each quadrant must show only its mapped hairstyle/grooming option.
- The top-left option is the safest and most achievable default.
- Recommendations must look conservative, realistic, barber-executable, and suitable for a ${faceShape} face. Avoid dramatic celebrity hair, fantasy volume, wet-look editorial styling, and dense hair replacement.
- Hair presence: ${hairPresence ?? 'unclear'}. Do not add unrealistic density, volume, fringe, quiff, or fullness beyond what the source hair can support.
- Keep each recommendation close to the client's current visible hair length, texture, density, and hairline unless the written option explicitly asks for a shorter cut. If the source hair is short, show short variations only.
- If the client is bald or closely shaved, show scalp/close-shave grooming variants only; do not add scalp hair or shadow hair.
- Matte ICONIK slate background ${ICONIK_SLATE} in every quadrant.
- Premium studio grooming editorial, clean head-and-shoulders front/three-quarter pose.
- Keep clothing simple and consistent enough that the grooming differences are easy to compare.

Professional editorial lighting, natural grooming, premium but understated finish. No written labels in or around the grid.`;
}

function buildBeardGridPrompt(options: string[], faceShape: string, facialHairPresence: string | undefined): string {
  return `Use the uploaded client headshot as the source image. Create a realistic men's beard and facial-hair recommendation grid.

Output: one clean square 2x2 grid image, four equal quadrants, same man in each quadrant, head and upper shoulders only. Fill the square composition evenly with no blank bands. ${ABSOLUTE_NO_TEXT_RULE}

Grid mapping:
${formatGridOptions(options)}

Rules:
- ${REALISTIC_MALE_GROOMING_RULE}
- Preserve the client's facial features, skin tone, scalp hair, expression, and general headshot framing.
- Each quadrant must show only its mapped beard/facial-hair option.
- The top-left option is the safest and most achievable default.
- Recommendations must look conservative, realistic, barber-executable, and suitable for a ${faceShape} face.
- Visible facial hair state: ${facialHairPresence ?? 'unclear'}. Do not invent impossible beard density or coverage.
- Keep beard, moustache, stubble, cheek line, and neckline close to what the source photo can realistically grow. If coverage is patchy, keep it patchy but cleaner; do not fill cheeks, jaw, moustache, or chin beyond visible density.
- Beard, moustache, stubble, cheek line, and neckline must look natural, clean, and maintainable. Avoid heavy airbrushed beard fills, fake sharp paint-like lines, and dramatic facial reshaping.
- Matte ICONIK slate background ${ICONIK_SLATE} in every quadrant.
- Premium studio grooming editorial, clean head-and-shoulders front/three-quarter pose.
- Keep clothing simple and consistent enough that the grooming differences are easy to compare.

Professional editorial lighting, natural grooming, premium but understated finish. No written labels in or around the grid.`;
}

function buildEyewearGridPrompt(options: string[], faceShape: string): string {
  return `Use the uploaded client headshot as the source image. Create a realistic men's eyewear recommendation grid.

Output: one clean square 2x2 grid image, four equal quadrants, same man in each quadrant, head and upper shoulders only. Fill the square composition evenly with no blank bands. ${ABSOLUTE_NO_TEXT_RULE}

Grid mapping:
Top left optical frame: ${options[0] || 'Conservative optical eyeglass frame with clear lenses'}
Top right optical frame: ${options[1] || 'Second conservative optical eyeglass frame with clear lenses'}
Bottom left sunglasses: ${options[2] || 'Classic sunglasses with softly tinted lenses'}
Bottom right sunglasses: ${options[3] || 'Second classic sunglasses option with tinted lenses'}

Rules:
- Preserve the client's facial features, skin tone, hair, beard, expression, and general headshot framing.
- Preserve grooming exactly from the source headshot; this grid changes eyewear only.
- The top row must be optical eyeglasses with clear, untinted lenses.
- The bottom row must be sunglasses with realistic tinted lenses.
- Frames must sit naturally on the nose bridge and suit a ${faceShape} face.
- Eyewear should look premium, realistic, and wearable, not cartoonish or costume-like.
- Matte ICONIK slate background ${ICONIK_SLATE} in every quadrant.
- Premium studio eyewear editorial, clean head-and-shoulders front/three-quarter pose.
- Keep clothing simple and consistent enough that the frame differences are easy to compare.

Professional editorial lighting, clean realistic eyewear rendering. No written labels in or around the grid.`;
}

function buildOutfitPrompt(outfit: ParsedOutfit, c: ClassificationResult): string {
  const garmentLines = [
    `Top: ${outfit.top}`,
    `Bottom: ${outfit.bottom}`,
    outfit.layer ? `Layer: ${outfit.layer}` : 'Layer: None',
    `Footwear: ${outfit.footwear}`,
    outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
  ].filter(Boolean).join('\n');

  const layerInstruction = outfit.layer
    ? ''
    : '\nLayer instruction: no layer is specified; do not add any jacket, blazer, vest, overshirt, coat, cardigan, hoodie, scarf, or third-piece layer.';
  const accessoryInstruction = outfit.accessories
    ? `\nAccessory rendering is mandatory: the accessories listed in the outfit specification must be visibly included where naturally visible (${outfit.accessories}). Do not omit them as optional styling hints.`
    : '';

  const defaultHairstyle = c.face.hairstyle_recommendations?.[0];
  const defaultBeard = c.face.beard_style_recommendations?.[0];
  const groomingTextInstruction = [
    defaultHairstyle ? `Subtle hairstyle/scalp grooming: ${defaultHairstyle}` : null,
    defaultBeard ? `Subtle beard/facial-hair grooming: ${defaultBeard}` : null,
  ].filter(Boolean).join('\n');

  return `Professional editorial fashion catalogue photography for the ICONIK men's Style Blueprint.

Reference photos are provided: the first is the client's full-body/body reference, and the second is the client's original headshot when available.

Extract the client's face, skin tone, facial features, current hair/facial-hair constraints, and identity from the headshot when provided. Extract body proportions, body shape, and scale from the full-body reference, but do not copy its stance. Preserve the client's exact skin tone, facial features, body proportions, and identity. Do not alter, slim, age, beautify, or idealise the client.

CRITICAL CLOTHING INSTRUCTION:
- Remove and discard the original clothing from the reference photos.
- Do not preserve, copy, blend, reinterpret, or borrow garments, shoes, accessories, colours, collars, sleeves, silhouettes, logos, or prints from the reference photos.
- The outfit specification below is the only authority for what the client wears. Render only those listed pieces.
- Do not add Indianwear, ethnicwear, kurtas, bandhgalas, Nehru jackets, festive Indian garments, sandals, or cultural accessories unless the outfit text explicitly names that exact item.
- Render at most one pair of eyewear on the client. If eyewear or sunglasses appear in more than one place, use only the accessory line. Never draw two pairs of glasses.

Background and style:
- ${MEN_STYLIST_REPORT_IMAGE_STYLE}

Assigned editorial pose:
- ${outfitPoseDirection(outfit.index)}
- ${OUTFIT_POSE_VISIBILITY_RULE}

Minimal grooming direction:
${groomingTextInstruction || 'Keep grooming clean, subtle, realistic, and very close to the original headshot.'}
- Apply only a low-delta, realistic tidy-up. Preserve the original hairline, hair density limits, beard density limits, face, skin tone, and age.
- Do not use a generated grooming grid as a reference or blend multiple grooming options.
- Do not reshape, retouch, beautify, or make the client look like a different person.

Compact outfit formula to render:
${garmentLines}${layerInstruction}
${accessoryInstruction}

Garment rendering: Clothes should look pressed, tailored, and naturally worn on this body — not floating, not distorted. Colour accuracy is critical — match the described colours precisely. No logos or brand markings visible. Garments must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}. If there is any conflict between the reference photos and the outfit specification, the outfit specification wins.

The lighting must match the stylist report image style: professional high-key studio lighting, even and soft, no harsh shadows, no blown highlights, premium catalogue realism.`;
}

export interface ComboGridRegenerationImagesResult {
  paths: NonNullable<ManReportImagePaths['comboGridCards']>;
  errors: Partial<Record<ComboGridKind, string>>;
}

function buildMixedComboOutfits(outfits: ParsedOutfit[], kind: ComboGridKind): ParsedOutfit[] {
  const pool = outfits.filter(outfit => {
    if (kind === 'office') return outfit.index >= 1 && outfit.index <= 6;
    if (kind === 'evening') return outfit.index >= 11 && outfit.index <= 15;
    return outfit.index >= 16 && outfit.index <= 20;
  });

  if (pool.length < 2) return pool.slice(0, 3);

  const n = pool.length;

  // Build 3 new outfits where each garment piece is drawn from a different source outfit,
  // using a step-2 rotation so no combo matches any original outfit.
  return [0, 1, 2].map(comboIdx => {
    const base = comboIdx * 2;
    const at = (offset: number) => pool[(base + offset) % n];
    return {
      index: comboIdx + 1,
      label: `Mix ${comboIdx + 1}`,
      top:         at(0).top,
      bottom:      at(1).bottom,
      layer:       at(2).layer,
      footwear:    at(3).footwear,
      accessories: at(1).accessories,
      fitNote:     null,
      colourLogic: null,
    };
  });
}

function buildComboGridPrompt(kind: ComboGridKind, outfits: ParsedOutfit[], c: ClassificationResult): string {
  const title: Record<ComboGridKind, string> = {
    office: 'Office mix-and-match combinations',
    evening: 'Evening mix-and-match combinations',
    relaxed: 'Relaxed mix-and-match combinations',
  };
  const outfitLines = outfits.map((outfit, index) => {
    const pieces = [
      `Top: ${outfit.top}`,
      `Bottom: ${outfit.bottom}`,
      outfit.layer ? `Layer: ${outfit.layer}` : 'Layer: No layer',
      `Footwear: ${outfit.footwear}`,
      outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
    ].filter(Boolean).join('; ');
    return `Column ${index + 1}: ${pieces}\nPose: ${outfitPoseDirection(index + 1)}`;
  }).join('\n');

  const defaultHairstyle = c.face.hairstyle_recommendations?.[0];
  const defaultBeard = c.face.beard_style_recommendations?.[0];
  const groomingTextInstruction = [
    defaultHairstyle ? `Default hairstyle/scalp grooming: ${defaultHairstyle}` : null,
    defaultBeard ? `Default beard/facial-hair grooming: ${defaultBeard}` : null,
  ].filter(Boolean).join('\n');

  return `Create one customised editorial styling grid image for ICONIK.

Reference photos are provided: the first is the client's full-body/body reference, and the second is the client's original headshot when available.
Use the second reference image for face identity, skin tone, and current hair/facial-hair constraints. Apply these TEXT grooming directions consistently in all three columns:
${groomingTextInstruction || 'Keep grooming clean, fresh, realistic, and close to the original headshot.'}
${REALISTIC_MALE_GROOMING_RULE}
Do not use a generated grooming grid as reference and do not blend multiple grooming options.

The output must be a single wide image with exactly 1 row and 3 equal vertical columns. Each column shows the same client full-body in its assigned stylish editorial pose and a different outfit combination. ${OUTFIT_POSE_VISIBILITY_RULE} ${ABSOLUTE_NO_TEXT_RULE} No flat-lay items.

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
- FOOTWEAR IS MANDATORY: Every column must show the specified footwear rendered visibly and completely on both feet. Do not omit, blur, or crop the shoes. Do not leave the subject barefoot. The footwear must match the exact description given (colour, style, material).

Background and style:
- ${MAN_STUDIO_BACKGROUND_RULE}
- Premium high-key studio fashion editorial with a different confident menswear pose in every column.
- No extra people or mannequin. ${ABSOLUTE_NO_TEXT_RULE}
- Natural realistic fabric behavior and correct garment construction.
- Even high-key studio lighting.

Composition: wide horizontal image, aspect ratio 16:9, one row, three equal columns. Each column must leave enough vertical room for a full-body portrait. The full body must be visible head-to-toe in each column with minimal headroom and no cropped feet. The subject's feet and footwear must be fully visible at the bottom of each column.`;
}

function buildEditedComboGridPrompt(group: ParsedComboGridGroup, c: ClassificationResult): string {
  const lookLines = group.looks.map((look, index) => [
    `Column ${index + 1}: ${look.name}`,
    `Outfit summary: ${look.outfitSummary}`,
    `Styling logic: ${look.logic}`,
    `Source context: ${look.source}`,
    `Pose: ${outfitPoseDirection(index + 1)}`,
  ].join('\n')).join('\n\n');

  const defaultHairstyle = c.face.hairstyle_recommendations?.[0];
  const defaultBeard = c.face.beard_style_recommendations?.[0];
  const groomingTextInstruction = [
    defaultHairstyle ? `Default hairstyle/scalp grooming: ${defaultHairstyle}` : null,
    defaultBeard ? `Default beard/facial-hair grooming: ${defaultBeard}` : null,
  ].filter(Boolean).join('\n');

  return `Create one customised editorial styling grid image for ICONIK.

Reference photos are provided: the first is the client's full-body/body reference, and the second is the client's original headshot when available.
Use the second reference image for face identity, skin tone, and current hair/facial-hair constraints. Apply these TEXT grooming directions consistently in all three columns:
${groomingTextInstruction || 'Keep grooming clean, fresh, realistic, and close to the original headshot.'}
${REALISTIC_MALE_GROOMING_RULE}
Do not use a generated grooming grid as reference and do not blend multiple grooming options.

The output must be a single wide image with exactly 1 row and 3 equal vertical columns. Each column shows the same client full-body in its assigned stylish editorial pose and a different outfit combination. ${OUTFIT_POSE_VISIBILITY_RULE} ${ABSOLUTE_NO_TEXT_RULE} No flat-lay items.

Grid theme: ${group.title}.

Use these three edited combination-grid looks exactly. Treat the outfit summary as the garment specification; use the styling logic and source context only to resolve ambiguity:
${lookLines}

Customisation rules:
- Preserve the client's body proportions, skin tone, face, and grooming reference.
- Dress the client in the specified clothing only; do not borrow garments from the source photo.
- Each column should feel related as one styling system, but the three looks must be visibly different.
- Clothes must fit this body type (${c.body.silhouette_type}): ${c.body.fit_directive}.
- Colours, accessories, layering, and footwear must match the outfit summaries precisely.
- No logos or brand markings.
- FOOTWEAR IS MANDATORY: Every column must show footwear rendered visibly and completely on both feet. Do not omit, blur, or crop the shoes. Do not leave the subject barefoot.

Background and style:
- ${MAN_STUDIO_BACKGROUND_RULE}
- Premium high-key studio fashion editorial with a different confident menswear pose in every column.
- No extra people or mannequin. ${ABSOLUTE_NO_TEXT_RULE}
- Natural realistic fabric behavior and correct garment construction.
- Even high-key studio lighting.

Composition: wide horizontal image, aspect ratio 16:9, one row, three equal columns. Each column must leave enough vertical room for a full-body portrait. The full body must be visible head-to-toe in each column with minimal headroom and no cropped feet. The subject's feet and footwear must be fully visible at the bottom of each column.`;
}

export function buildOutfitImagePromptFromText(
  outfitText: string,
  classification: ClassificationResult,
  expectedOutfitNumber?: number,
): string {
  const parsed = parseOutfitsFromSection(outfitText);
  const outfit = expectedOutfitNumber
    ? parsed.find(candidate => candidate.index === expectedOutfitNumber) ?? parsed[0]
    : parsed[0];

  if (!outfit) {
    throw new Error('Could not parse outfit text for image prompt');
  }

  return buildOutfitPrompt(outfit, classification);
}

export function buildOutfitImagePromptForReport(
  sections: ReportSections,
  classification: ClassificationResult,
  outfitNumber: number,
): string {
  const outfits = parseOutfitsFromSection(sections.s4_outfits ?? '');
  const outfit = outfits.find(candidate => candidate.index === outfitNumber);
  if (!outfit) {
    throw new Error(`Could not find Outfit ${outfitNumber} in Section 4 text`);
  }
  return buildOutfitPrompt(outfit, classification);
}

export function buildComboGridImagePromptForReport(
  kind: ComboGridKind,
  sections: ReportSections,
  classification: ClassificationResult,
): string {
  const comboText = sections.s4_combo_grids ?? '';
  const normalised = comboText ? normaliseComboGridText(comboText) : null;
  if (normalised?.ok) {
    const group = normalised.groups.find(candidate => candidate.kind === kind);
    if (group) return buildEditedComboGridPrompt(group, classification);
  }

  const outfits = parseOutfitsFromSection(sections.s4_outfits ?? '');
  const selected = buildMixedComboOutfits(outfits, kind);
  if (selected.length < 3) {
    throw new Error(`Not enough outfits found to build the ${kind} combination grid prompt`);
  }
  return buildComboGridPrompt(kind, selected, classification);
}

function buildDiagnosticPrompt(
  kind: 'faceGeometry' | 'frameFront' | 'frameSide' | 'colourDrape',
  classification: ClassificationResult,
): string {
  const base = `Create a premium ICONIK clinical-editorial diagnostic image. Preserve the source client's identity, skin tone, facial features, and body shape. Add clean warm-white analytical overlays on matte slate ${ICONIK_SLATE}: thin measurement lines, small dot terminators, calibrated marks. ${ABSOLUTE_NO_TEXT_RULE}`;

  if (kind === 'faceGeometry') {
    return `${base} Use the headshot as the underlying image. Overlay forehead width, cheekbone width, jaw width, face length, and facial thirds for ${classification.face.face_shape} facial architecture. Keep the face natural and recognisable.`;
  }

  if (kind === 'frameFront') {
    return `${base} Use the front full-body photo as the underlying image. Overlay shoulder span, waist span, vertical centre line, hip/stance width, and jacket-length guide for a ${classification.body.silhouette_type} frame. Keep the full body head-to-toe visible with feet and footwear uncropped.`;
  }

  if (kind === 'frameSide') {
    return `${base} Use the side-profile full-body photo as the underlying image. Overlay posture line, abdomen projection guide, natural waist marker, shoulder-to-hip fall line, and centre-of-gravity dot. Keep the full body head-to-toe visible with feet and footwear uncropped. Use honest tailoring geometry, no body judgement language or visual exaggeration.`;
  }

  const best = classification.colour.primary_palette?.[0];
  const avoid = classification.colour.colours_to_avoid?.[0];
  return `Create one strict professional colour-analysis comparison image in portrait 4:5 format.

LAYOUT — NON-NEGOTIABLE:
- Show exactly two separate, equal-width head-and-shoulders portraits of the same client side by side: one complete portrait in the left column and one complete portrait in the right column.
- Do not create one person wearing a half-blue/half-green garment. Do not split one face or one body down the centre. Do not merge the two drapes into one shawl, scarf, shirt, or garment.
- Duplicate the original headshot composition precisely in both columns: identical face size, head position, eye line, shoulders, expression, grooming, camera distance, crop, exposure, white balance, shadows, and skin rendering.
- Preserve the client's exact identity, facial features, natural skin texture, skin tone, hair, beard, eyewear, face shape, age, and proportions. No beautification or facial changes.

DRAPES:
- Left portrait only: place one plain matte professional colour-analysis drape across the upper chest and shoulders in ${avoid?.name ?? 'the least flattering high-risk colour'} ${avoid?.hex ?? ''}.
- Right portrait only: place one plain matte professional colour-analysis drape across the upper chest and shoulders in ${best?.name ?? 'the strongest palette colour'} ${best?.hex ?? ''}.
- Each drape is a simple single-colour fabric panel below the collarbone. It is not clothing and must not wrap around the neck, cover the chin, form lapels, resemble a scarf, or extend vertically down the body.
- The drape colour is the ONLY difference between the two portraits. Do not brighten, darken, smooth, warm, cool, glow, dull, or recolour either face.

STUDIO:
- ${MAN_STUDIO_BACKGROUND_RULE}
- No room, wall, doorway, furniture, plant, lamp, ceiling light, interior detail, or environmental reflection.
- Soft, flat, neutral colour-analysis lighting with no dramatic highlights.

${ABSOLUTE_NO_TEXT_RULE}`;
}

function outfitSpecForDeliverable(sections: ReportSections, outfitNumber: number): string {
  const outfit = parseOutfitsFromSection(sections.s4_outfits ?? '').find(item => item.index === outfitNumber);
  if (!outfit) return `Use Outfit ${outfitNumber} from the report.`;
  return [
    `Top: ${outfit.top}`,
    `Bottom: ${outfit.bottom}`,
    outfit.layer ? `Layer: ${outfit.layer}` : null,
    `Footwear: ${outfit.footwear}`,
    outfit.accessories ? `Accessories: ${outfit.accessories}` : null,
  ].filter(Boolean).join('\n');
}

function buildBeforeAfterComparisonPrompt(classification: ClassificationResult, sections: ReportSections): string {
  return `Create one locked before/after transformation comparison for ICONIK as a single horizontal 4:3 image containing exactly two equal portrait 2:3 panels.

ALIGNMENT — ABSOLUTELY NON-NEGOTIABLE:
- LEFT panel is BEFORE. RIGHT panel is AFTER.
- Render the same client twice in exactly the same full-body pose and at exactly the same scale and coordinates.
- The two silhouettes must overlay perfectly when stacked: identical head top, eye line, face size, shoulder line, hand positions, elbows, hips, knees, foot positions, body angle, expression, camera height, focal length, distance, crop, headroom, and space below the shoes.
- Treat the right panel as a clothing-only edit of the left panel, not a second photoshoot. Do not move, re-pose, resize, rotate, widen, narrow, slim, age, beautify, or idealise the client.
- Preserve the exact identity, facial features, natural skin texture, skin tone, body proportions, original pose, and expression from the source references.

BEFORE — LEFT PANEL:
- Keep the original clothing, footwear, accessories, hair, and facial hair from the uploaded full-body reference exactly as shown. Do not improve or restyle them.

AFTER — RIGHT PANEL:
- Change only the clothing and low-delta grooming to the specification below while preserving the locked body and pose.
- Outfit:
${outfitSpecForDeliverable(sections, 1)}
- Grooming: ${classification.face.hairstyle_recommendations?.[0] ?? 'clean realistic grooming'}; ${classification.face.beard_style_recommendations?.[0] ?? classification.face.facial_hair_recommendations ?? 'preserve realistic facial hair'}.
- ${REALISTIC_MALE_GROOMING_RULE}

STUDIO AND CANVAS:
- ${MAN_STUDIO_BACKGROUND_RULE}
- Both panels use the exact same flat background pixels and the exact same high-key exposure and shadows.
- Full body visible head-to-toe in both panels, including both shoes, with matching headroom and footroom.
- No divider, border, gutter, frame, line, labels, or gap between panels. The canvas midpoint is only the invisible crop boundary.

${ABSOLUTE_NO_TEXT_RULE}`;
}

function buildLinkedinHeadshotPrompt(classification: ClassificationResult): string {
  const best = classification.colour.primary_palette?.[0] ?? classification.colour.neutral_base_colours?.[0];
  return `Create a professional LinkedIn headshot from the uploaded headshot. Preserve the client's exact identity, facial features, skin tone, and natural proportions. Apply realistic polished grooming: ${classification.face.hairstyle_recommendations?.[0] ?? 'clean haircut or scalp grooming'} and ${classification.face.beard_style_recommendations?.[0] ?? classification.face.facial_hair_recommendations ?? 'clean facial hair lines'}.
${REALISTIC_MALE_GROOMING_RULE}

Wardrobe: premium blazer, shirt, or overshirt near the face in ${best?.name ?? 'the strongest palette colour'} ${best?.hex ?? ''}, no logos. Studio background in warm neutral slate, soft professional light, confident approachable expression. Compose as a square 1:1 headshot with the face centred, balanced headroom, shoulders visible, and generous safe space on every side so the portrait remains natural inside a circular LinkedIn or Instagram crop. Keep the head and chin comfortably away from the crop edge. Profile-ready resolution. ${ABSOLUTE_NO_TEXT_RULE}`;
}

function buildSocialMediaInspirationPrompt(
  classification: ClassificationResult,
  sections: ReportSections,
  shotIndex: number,
): string {
  const specs = [
    {
      outfitNumber: 11,
      scene: 'warm restaurant terrace or rooftop evening setting, flattering ambient light, confident relaxed three-quarter pose',
    },
    {
      outfitNumber: 16,
      scene: 'outdoor cafe or walkable street in golden-hour light, natural candid mid-walk pose, approachable expression',
    },
    {
      outfitNumber: 18,
      scene: 'bookstore, gallery, coffee counter, or weekend activity setting with natural light and easy body language',
    },
  ];
  const spec = specs[Math.max(0, Math.min(specs.length - 1, shotIndex))];
  return `Create a realistic Instagram-ready social media style inspiration photo of the same client.

Two reference photos are provided: full-body photo first, headshot second. Preserve identity, facial features, skin tone, and body proportions. Do not slim, age, or idealise. Use realistic lifestyle photography, not a fashion render.

Scene: ${spec.scene}.
Outfit to apply:
${outfitSpecForDeliverable(sections, spec.outfitNumber)}

Grooming:
${classification.face.hairstyle_recommendations?.[0] ?? 'clean realistic grooming'}
${classification.face.beard_style_recommendations?.[0] ?? classification.face.facial_hair_recommendations ?? ''}
${REALISTIC_MALE_GROOMING_RULE}

Composition: natural portrait or full-body lifestyle crop suitable for a premium personal Instagram inspiration grid, no other people, no readable signage, no logos. ${ABSOLUTE_NO_TEXT_RULE} The image must look like a real recent social post, not a dating-app photo and not a studio catalogue render.`;
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

async function splitBeforeAfterComparison(base64Data: string): Promise<{ before: string; after: string }> {
  const source = Buffer.from(base64Data, 'base64');
  const oriented = await sharp(source, { failOn: 'none' })
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const width = oriented.info.width;
  const height = oriented.info.height;
  const halfWidth = Math.floor(width / 2);
  if (halfWidth < 1 || height < 1) throw new Error('Generated before/after comparison has invalid dimensions');

  const renderPanel = (left: number) => sharp(oriented.data, { failOn: 'none' })
    .extract({ left, top: 0, width: halfWidth, height })
    .resize({ width: 1024, height: 1536, fit: 'contain', background: ICONIK_SLATE })
    .jpeg({ quality: 92 })
    .toBuffer();

  const [before, after] = await Promise.all([
    renderPanel(0),
    renderPanel(width - halfWidth),
  ]);
  return { before: before.toString('base64'), after: after.toString('base64') };
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

/**
 * Keep men's outfit cards on the same final canvas used by the stylist
 * Blueprint outfit pipeline. Gemini does not reliably obey an aspect-ratio
 * instruction, so prompt parity alone is not enough.
 */
async function uploadOutfitPortraitToStorage(
  reportId: string,
  base64Data: string,
  filename: string,
): Promise<string> {
  const source = Buffer.from(base64Data, 'base64');
  const portrait = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({
      width: 1024,
      height: 1536,
      fit: 'contain',
      background: ICONIK_SLATE,
    })
    .jpeg({ quality: 92 })
    .toBuffer();

  return uploadToStorage(reportId, portrait.toString('base64'), filename);
}

export async function uploadManualManReportImage(
  reportId: string,
  fileBuffer: Buffer,
  filename: string,
  portraitOutfit = false,
): Promise<string> {
  if (fileBuffer.length === 0) {
    throw new Error('Cannot upload an empty image file');
  }

  const path = `${reportId}/${filename}`;
  const image = sharp(fileBuffer, { failOn: 'none' }).rotate();
  const output = portraitOutfit
    ? await image
      .resize({ width: 1024, height: 1536, fit: 'contain', background: ICONIK_SLATE })
      .jpeg({ quality: 92 })
      .toBuffer()
    : await image.jpeg({ quality: 92, mozjpeg: true }).toBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, output, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Manual image upload failed [${filename}]: ${error.message}`);
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

export function buildFaceGridPrompt(classification: ClassificationResult, kind: FaceImageKind, override?: { optionIndex: number; style: string }): string {
  const options = getFaceStyleOptions(classification, kind, override);
  const { face } = classification;
  if (kind === 'hairstyle') {
    return buildHairstyleGridPrompt(options, face.face_shape, face.hair_presence);
  }
  if (kind === 'beard') {
    return buildBeardGridPrompt(options, face.face_shape, face.facial_hair_presence);
  }
  return buildEyewearGridPrompt(options, face.face_shape);
}

/**
 * Regenerate the face grid for a kind when the grid slot is missing.
 *
 * New reports store exactly one 2x2 grid at index 0 for hairstyle, beard, and
 * eyewear. The `slots` argument is kept for API compatibility with the old
 * per-card flow; any non-empty slot list regenerates the single grid.
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

  try {
    console.log(`[regenerateMissingFaceSlots] Starting ${kind} grid (model: ${imageModel})`);
    const outputBase64 = await withRetry(
      () => callGeminiImageEdit(data, mimeType, buildFaceGridPrompt(classification, kind), imageModel),
      3,
      3_000,
    );
    const path = await uploadToStorage(reportId, outputBase64, `${kind}_grid.jpg`);
    console.log(`[regenerateMissingFaceSlots] ${kind} grid saved: ${path}`);
    return [path];
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[regenerateMissingFaceSlots] ${kind} grid FAILED (model: ${imageModel}): ${errMsg}`);
    void supabaseAdmin
      .from('man_reports')
      .update({
        error_message: `${kind === 'hairstyle' ? 'Hairstyle' : kind === 'beard' ? 'Beard' : 'Eyewear'} grid failed: ${errMsg.slice(0, 400)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .then(null, () => {});
    return [null];
  }
}

/**
 * Regenerate the full 2x2 face grid for a kind.
 * Uses the submission headshot when present, otherwise falls back to the full-body photo.
 * Overwrites the grid slot file in storage unless a unique filename is passed.
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
  if (![1, 2, 3, 4].includes(optionIndex)) {
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

  const selectedOption = styleOverride?.trim() || getFaceStyleOptions(classification, kind)[optionIndex - 1];
  if (!selectedOption?.trim()) {
    throw new Error(`No ${kind} recommendation found for option ${optionIndex}`);
  }

  const outputBase64 = await withRetry(
    () => callGeminiImageEdit(
      data,
      mimeType,
      buildFaceGridPrompt(classification, kind, styleOverride?.trim() ? { optionIndex, style: styleOverride } : undefined),
      imageModel,
    ),
    3,
    3_000,
  );

  return uploadToStorage(reportId, outputBase64, storageFilename ?? `${kind}_grid.jpg`);
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
  groomingReferenceUrl: string | null | undefined, // original headshot preferred; never a generated grooming grid
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

  // Fetch base photo and original headshot reference concurrently — they're independent.
  // Do not use generated face grids here; outfit renders use the original headshot plus top-left text recommendations.
  const fetchGroomingRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    if (!groomingReferenceUrl) return undefined;
    try {
      return fetchAsBase64(groomingReferenceUrl);
    } catch {
      console.warn('[manImageGenerator] Could not fetch original headshot grooming reference — proceeding without it');
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
        const path = await uploadOutfitPortraitToStorage(reportId, outputBase64, `outfit_${outfit.index}.jpg`);
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
  groomingReferenceUrl: string | null | undefined,
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
    if (!groomingReferenceUrl) return undefined;
    try {
      return fetchAsBase64(groomingReferenceUrl);
    } catch {
      console.warn('[manImageGenerator] Could not fetch original headshot grooming reference for combo grids — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, groomingRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchGroomingRef(),
  ]);

  for (const kind of ['office', 'evening', 'relaxed'] as const) {
    if (result[kind]) continue;
    const selected = buildMixedComboOutfits(outfits, kind);
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

export async function generateManBlueprintV2Images(
  reportId: string,
  submission: Pick<ManIntakeSubmission, 'photo_fullbody_url' | 'photo_headshot_url' | 'photo_side_profile_url'>,
  classification: ClassificationResult,
  sections: ReportSections,
  imageModel: string = MODEL,
  existingPaths: ManReportImagePaths | null = null,
  softDeadlineMs: number = Date.now() + 260_000,
): Promise<Pick<ManReportImagePaths, 'diagnostic' | 'deliverables'>> {
  const current = normaliseImagePaths(existingPaths);
  const diagnostic = { ...(current.diagnostic ?? {}) };
  const deliverables = {
    ...(current.deliverables ?? {}),
    datingProfileShots: [...(current.deliverables?.datingProfileShots ?? [])],
  };

  const headshotUrl = submission.photo_headshot_url;
  const fullBodyUrl = submission.photo_fullbody_url;
  if (!headshotUrl || !fullBodyUrl) {
    throw new Error('Both headshot and full-body photos are required before v2 image generation');
  }

  const [{ data: headData, mimeType: headMime }, { data: bodyData, mimeType: bodyMime }, sideRef] = await Promise.all([
    fetchAsBase64(headshotUrl),
    fetchAsBase64(fullBodyUrl),
    submission.photo_side_profile_url
      ? fetchAsBase64(submission.photo_side_profile_url).catch(err => {
          console.warn('[manImageGenerator] Side-profile source unusable; side diagnostic will use fallback text only:', err instanceof Error ? err.message : err);
          return undefined;
        })
      : Promise.resolve(undefined),
  ]);

  const generateWithOutput = async (
    label: string,
    filename: string,
    primary: { data: string; mimeType: string },
    prompt: string,
    extra?: { data: string; mimeType: string },
  ): Promise<{ path: string; image: { data: string; mimeType: string } } | null> => {
    if (Date.now() >= softDeadlineMs) {
      console.warn(`[manImageGenerator] Soft deadline reached before ${label} — leaving slot for retry`);
      return null;
    }

    try {
      const outputBase64 = await withRetry(
        () => callGeminiImageEdit(primary.data, primary.mimeType, prompt, imageModel, extra),
        3,
        4_000,
      );
      const path = await uploadToStorage(reportId, outputBase64, filename);
      console.log(`[manImageGenerator] ${label} saved: ${path}`);
      return { path, image: { data: outputBase64, mimeType: 'image/jpeg' } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[manImageGenerator] ${label} FAILED (model: ${imageModel}): ${message}`);
      void supabaseAdmin
        .from('man_reports')
        .update({ error_message: `${label} failed: ${message.slice(0, 500)}`, updated_at: new Date().toISOString() })
        .eq('id', reportId)
        .then(null, () => {});
      return null;
    }
  };

  const generate = async (
    label: string,
    filename: string,
    primary: { data: string; mimeType: string },
    prompt: string,
    extra?: { data: string; mimeType: string },
  ): Promise<string | null> => (await generateWithOutput(label, filename, primary, prompt, extra))?.path ?? null;

  if (!diagnostic.faceGeometry) {
    diagnostic.faceGeometry = await generate(
      'Face geometry diagnostic',
      'diagnostic_face_geometry.jpg',
      { data: headData, mimeType: headMime },
      buildDiagnosticPrompt('faceGeometry', classification),
    );
    await mergeManReportImagePathsForReport(reportId, { diagnostic });
  }

  if (!diagnostic.frameFront) {
    diagnostic.frameFront = await generate(
      'Front frame diagnostic',
      'diagnostic_frame_front.jpg',
      { data: bodyData, mimeType: bodyMime },
      buildDiagnosticPrompt('frameFront', classification),
    );
    await mergeManReportImagePathsForReport(reportId, { diagnostic });
  }

  if (!diagnostic.frameSide && sideRef) {
    diagnostic.frameSide = await generate(
      'Side frame diagnostic',
      'diagnostic_frame_side.jpg',
      sideRef,
      buildDiagnosticPrompt('frameSide', classification),
    );
    await mergeManReportImagePathsForReport(reportId, { diagnostic });
  }

  if (!diagnostic.colourDrape) {
    diagnostic.colourDrape = await generate(
      'Colour drape diagnostic',
      'diagnostic_colour_drape.jpg',
      { data: headData, mimeType: headMime },
      buildDiagnosticPrompt('colourDrape', classification),
    );
    await mergeManReportImagePathsForReport(reportId, { diagnostic });
  }

  if ((!deliverables.beforeImage || !deliverables.afterImage) && Date.now() < softDeadlineMs) {
    try {
      const comparisonBase64 = await withRetry(
        () => callGeminiImageEdit(
          bodyData,
          bodyMime,
          buildBeforeAfterComparisonPrompt(classification, sections),
          imageModel,
          { data: headData, mimeType: headMime },
        ),
        3,
        4_000,
      );
      const panels = await splitBeforeAfterComparison(comparisonBase64);
      const [beforePath, afterPath] = await Promise.all([
        uploadToStorage(reportId, panels.before, 'deliverable_before.jpg'),
        uploadToStorage(reportId, panels.after, 'deliverable_after.jpg'),
      ]);
      deliverables.beforeImage = beforePath;
      deliverables.afterImage = afterPath;
      await mergeManReportImagePathsForReport(reportId, { deliverables });
      console.log(`[manImageGenerator] Locked before/after comparison saved: ${beforePath}, ${afterPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[manImageGenerator] Locked before/after comparison FAILED (model: ${imageModel}): ${message}`);
      void supabaseAdmin
        .from('man_reports')
        .update({ error_message: `Before/after comparison failed: ${message.slice(0, 500)}`, updated_at: new Date().toISOString() })
        .eq('id', reportId)
        .then(null, () => {});
    }
  }

  if (!deliverables.linkedinHeadshot) {
    deliverables.linkedinHeadshot = await generate(
      'LinkedIn headshot',
      'deliverable_linkedin_headshot.jpg',
      { data: headData, mimeType: headMime },
      buildLinkedinHeadshotPrompt(classification),
    );
    await mergeManReportImagePathsForReport(reportId, { deliverables });
  }

  for (let index = 0; index < 3; index++) {
    if (deliverables.datingProfileShots?.[index]) continue;
    const path = await generate(
      `Social media inspiration image ${index + 1}`,
      `deliverable_social_${index + 1}.jpg`,
      { data: bodyData, mimeType: bodyMime },
      buildSocialMediaInspirationPrompt(classification, sections, index),
      { data: headData, mimeType: headMime },
    );
    deliverables.datingProfileShots[index] = path;
    await mergeManReportImagePathsForReport(reportId, { deliverables });
  }

  return { diagnostic, deliverables };
}

export type ManV2ImageTarget =
  | 'faceGeometry'
  | 'frameFront'
  | 'colourDrape'
  | 'beforeAfter'
  | 'linkedinHeadshot'
  | 'social1'
  | 'social2'
  | 'social3';

/** Regenerate one V2 diagnostic/deliverable target without touching unrelated images. */
export async function regenerateManBlueprintV2Image(
  reportId: string,
  submission: Pick<ManIntakeSubmission, 'photo_fullbody_url' | 'photo_headshot_url'>,
  classification: ClassificationResult,
  sections: ReportSections,
  target: ManV2ImageTarget,
  imageModel: string = MODEL,
): Promise<Partial<Pick<ManReportImagePaths, 'diagnostic' | 'deliverables'>>> {
  if (!submission.photo_headshot_url || !submission.photo_fullbody_url) {
    throw new Error('Both headshot and full-body photos are required before image regeneration');
  }

  const [{ data: headData, mimeType: headMime }, { data: bodyData, mimeType: bodyMime }] = await Promise.all([
    fetchAsBase64(submission.photo_headshot_url),
    fetchAsBase64(submission.photo_fullbody_url),
  ]);
  const stamp = Date.now();
  const generate = async (
    filename: string,
    primary: { data: string; mimeType: string },
    prompt: string,
    extra?: { data: string; mimeType: string },
  ) => {
    const output = await withRetry(
      () => callGeminiImageEdit(primary.data, primary.mimeType, prompt, imageModel, extra),
      3,
      4_000,
    );
    return uploadToStorage(reportId, output, filename);
  };

  if (target === 'faceGeometry' || target === 'frameFront' || target === 'colourDrape') {
    const useHeadshot = target !== 'frameFront';
    const path = await generate(
      `diagnostic_${target}_${stamp}.jpg`,
      useHeadshot ? { data: headData, mimeType: headMime } : { data: bodyData, mimeType: bodyMime },
      buildDiagnosticPrompt(target, classification),
    );
    return { diagnostic: { [target]: path } };
  }

  if (target === 'beforeAfter') {
    const comparison = await withRetry(
      () => callGeminiImageEdit(
        bodyData,
        bodyMime,
        buildBeforeAfterComparisonPrompt(classification, sections),
        imageModel,
        { data: headData, mimeType: headMime },
      ),
      3,
      4_000,
    );
    const panels = await splitBeforeAfterComparison(comparison);
    const [beforeImage, afterImage] = await Promise.all([
      uploadToStorage(reportId, panels.before, `deliverable_before_${stamp}.jpg`),
      uploadToStorage(reportId, panels.after, `deliverable_after_${stamp}.jpg`),
    ]);
    return { deliverables: { beforeImage, afterImage } };
  }

  if (target === 'linkedinHeadshot') {
    const linkedinHeadshot = await generate(
      `deliverable_linkedin_headshot_${stamp}.jpg`,
      { data: headData, mimeType: headMime },
      buildLinkedinHeadshotPrompt(classification),
    );
    return { deliverables: { linkedinHeadshot } };
  }

  const socialIndex = Number(target.slice(-1)) - 1;
  const socialPath = await generate(
    `deliverable_social_${socialIndex + 1}_${stamp}.jpg`,
    { data: bodyData, mimeType: bodyMime },
    buildSocialMediaInspirationPrompt(classification, sections, socialIndex),
    { data: headData, mimeType: headMime },
  );
  const datingProfileShots: (string | null)[] = [];
  datingProfileShots[socialIndex] = socialPath;
  return { deliverables: { datingProfileShots } };
}

export async function regenerateComboGridImagesFromText(
  reportId: string,
  comboGridText: string,
  basePhotoUrl: string,
  classification: ClassificationResult,
  groomingReferenceUrl: string | null | undefined,
  imageModel: string = MODEL,
): Promise<ComboGridRegenerationImagesResult> {
  const normalised = normaliseComboGridText(comboGridText);
  if (!normalised.ok) throw new Error(normalised.error);

  const result: NonNullable<ManReportImagePaths['comboGridCards']> = {
    office: null,
    evening: null,
    relaxed: null,
  };
  const errors: Partial<Record<ComboGridKind, string>> = {};

  const fetchGroomingRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    if (!groomingReferenceUrl) return undefined;
    try {
      return fetchAsBase64(groomingReferenceUrl);
    } catch {
      console.warn('[regenerateComboGridImagesFromText] Could not fetch original headshot grooming reference — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, groomingRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchGroomingRef(),
  ]);

  for (const kind of ['office', 'evening', 'relaxed'] as const) {
    const group = normalised.groups.find(candidate => candidate.kind === kind);
    if (!group) {
      errors[kind] = `No ${kind} combination grid group found`;
      continue;
    }

    try {
      const outputBase64 = await withRetry(() =>
        callGeminiImageEdit(baseData, baseMime, buildEditedComboGridPrompt(group, classification), imageModel, groomingRef),
        3,
        4_000,
      );
      const path = await uploadToStorage(reportId, outputBase64, `combo_grid_${kind}.jpg`);
      result[kind] = path;
      console.log(`[regenerateComboGridImagesFromText] Combo grid ${kind} saved: ${path}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors[kind] = message;
      console.error(`[regenerateComboGridImagesFromText] Combo grid ${kind} FAILED (model: ${imageModel}): ${message}`);
    }
  }

  return { paths: result, errors };
}

export async function regenerateSingleComboGridImageFromText(
  reportId: string,
  kind: ComboGridKind,
  comboGridGroupText: string,
  basePhotoUrl: string,
  classification: ClassificationResult,
  groomingReferenceUrl: string | null | undefined,
  imageModel: string = MODEL,
): Promise<string> {
  const normalised = normaliseComboGridGroupText(kind, comboGridGroupText);
  if (!normalised.ok) throw new Error(normalised.error);

  const fetchGroomingRef = async (): Promise<{ data: string; mimeType: string } | undefined> => {
    if (!groomingReferenceUrl) return undefined;
    try {
      return fetchAsBase64(groomingReferenceUrl);
    } catch {
      console.warn('[regenerateSingleComboGridImageFromText] Could not fetch original headshot grooming reference — proceeding without it');
    }
    return undefined;
  };

  const [{ data: baseData, mimeType: baseMime }, groomingRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    fetchGroomingRef(),
  ]);

  const outputBase64 = await withRetry(() =>
    callGeminiImageEdit(baseData, baseMime, buildEditedComboGridPrompt(normalised.group, classification), imageModel, groomingRef),
    3,
    4_000,
  );
  const path = await uploadToStorage(reportId, outputBase64, `combo_grid_${kind}.jpg`);
  console.log(`[regenerateSingleComboGridImageFromText] Combo grid ${kind} saved: ${path}`);
  return path;
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
  hairstyleHeadshotUrl?: string | null, // optional original headshot for face/grooming reference
  storageFilename?:     string,
): Promise<string> {
  const [{ data: baseData, mimeType: baseMime }, hairstyleRef] = await Promise.all([
    fetchAsBase64(basePhotoUrl),
    hairstyleHeadshotUrl
      ? fetchAsBase64(hairstyleHeadshotUrl).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const prompt       = buildOutfitImagePromptFromText(outfitText, classification, outfitNumber);
  const outputBase64 = await callGeminiImageEdit(baseData, baseMime, prompt, imageModel, hairstyleRef ?? undefined);

  return uploadOutfitPortraitToStorage(reportId, outputBase64, storageFilename ?? `outfit_${outfitNumber}.jpg`);
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
    paths.diagnostic?.faceGeometry ?? null,
    paths.diagnostic?.frameFront ?? null,
    paths.diagnostic?.frameSide ?? null,
    paths.diagnostic?.colourDrape ?? null,
    paths.deliverables?.beforeImage ?? null,
    paths.deliverables?.afterImage ?? null,
    paths.deliverables?.beforeAfter ?? null,
    paths.deliverables?.linkedinHeadshot ?? null,
    ...(paths.deliverables?.datingProfileShots ?? []),
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
    diagnostic: {
      faceGeometry: resolve(paths.diagnostic?.faceGeometry),
      frameFront: resolve(paths.diagnostic?.frameFront),
      frameSide: resolve(paths.diagnostic?.frameSide),
      colourDrape: resolve(paths.diagnostic?.colourDrape),
    },
    deliverables: {
      beforeImage: resolve(paths.deliverables?.beforeImage),
      afterImage: resolve(paths.deliverables?.afterImage),
      beforeAfter: resolve(paths.deliverables?.beforeAfter),
      linkedinHeadshot: resolve(paths.deliverables?.linkedinHeadshot),
      datingProfileShots: (paths.deliverables?.datingProfileShots ?? []).map(resolve),
    },
    comboGridCards: {
      office: resolve(paths.comboGridCards?.office),
      evening: resolve(paths.comboGridCards?.evening),
      relaxed: resolve(paths.comboGridCards?.relaxed),
    },
    baseModel:      resolve(paths.baseModel),
  };
}
