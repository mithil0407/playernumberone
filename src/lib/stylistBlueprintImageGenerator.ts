import 'server-only';

import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { supabaseAdmin } from './supabase';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
import type { StylistBlueprintReportData, StylistIntakeSubmission } from './stylistBlueprintGenerator';

const BUCKET = 'stylist-blueprint-images';
const SIGNED_URL_TTL = 60 * 60;
const SLATE = '#94a6ad';
const IVORY = '#F5F0E8';
const ROSE = '#D4537E';
const MODEL = 'gemini-3.1-flash-image-preview';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export type StylistBlueprintImageGroup =
  | 'cover'
  | 'diagnosis'
  | 'prescription'
  | 'capsule_1'
  | 'capsule_2'
  | 'capsule_3'
  | 'capsule_4'
  | 'closing'
  | 'all';

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

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
      outfitFlatlays: Array.from({ length: 12 }, () => null),
      outfitDetails: Array.from({ length: 12 }, () => null),
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
      outfitFlatlays: Array.from({ length: 12 }, (_, index) => paths?.application?.outfitFlatlays?.[index] ?? null),
      outfitDetails: Array.from({ length: 12 }, (_, index) => paths?.application?.outfitDetails?.[index] ?? null),
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
      progress_stage: progressStage ?? 'generating_images',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  await revalidateStylistBlueprintCache(reportId, shareToken);
}

async function uploadBuffer(reportId: string, fileName: string, buffer: Buffer) {
  const path = `${reportId}/${fileName}.jpg`;
  const jpeg = await sharp(buffer, { failOn: 'none' }).jpeg({ quality: 92 }).toBuffer();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

async function uploadSvg(reportId: string, fileName: string, svg: string) {
  return uploadBuffer(reportId, fileName, Buffer.from(svg));
}

function svgShell(inner: string, width = 1200, height = 1500) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${SLATE}"/>
    ${inner}
  </svg>`;
}

function analyticalCard(kind: 'front' | 'side' | 'axis' | 'face' | 'ratio' | 'heat' | 'avoid' | 'matrix' | 'portrait') {
  if (kind === 'portrait') {
    return svgShell(`
      <circle cx="600" cy="430" r="180" fill="none" stroke="${IVORY}" stroke-width="4" opacity=".95"/>
      <path d="M385 900 C430 710 770 710 815 900 C745 1035 455 1035 385 900Z" fill="none" stroke="${IVORY}" stroke-width="4"/>
      <circle cx="520" cy="425" r="8" fill="${IVORY}"/><circle cx="680" cy="425" r="8" fill="${IVORY}"/>
      <path d="M480 545 C550 605 650 605 720 545" fill="none" stroke="${IVORY}" stroke-width="3" opacity=".7"/>
    `);
  }
  if (kind === 'avoid') {
    const cells = Array.from({ length: 6 }, (_, i) => {
      const x = 120 + (i % 3) * 320;
      const y = 180 + Math.floor(i / 3) * 360;
      return `<rect x="${x}" y="${y}" width="240" height="260" rx="10" fill="none" stroke="${IVORY}" stroke-opacity=".3"/>
        <path d="M${x + 70} ${y + 170} C${x + 110} ${y + 70} ${x + 170} ${y + 70} ${x + 190} ${y + 170}" fill="none" stroke="${IVORY}" stroke-width="4"/>
        <path d="M${x + 55} ${y + 215} L${x + 205} ${y + 85}" stroke="${ROSE}" stroke-width="9" stroke-opacity=".65"/>`;
    }).join('');
    return svgShell(cells, 1200, 900);
  }
  if (kind === 'matrix') {
    const nodes = Array.from({ length: 12 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 12;
      const x = 600 + Math.cos(angle) * 330;
      const y = 600 + Math.sin(angle) * 330;
      return `<line x1="600" y1="600" x2="${x}" y2="${y}" stroke="${IVORY}" stroke-width="2" stroke-opacity=".32"/>
        <circle cx="${x}" cy="${y}" r="22" fill="${IVORY}"/>`;
    }).join('');
    return svgShell(`${nodes}<circle cx="600" cy="600" r="54" fill="${IVORY}" opacity=".95"/>`, 1200, 1200);
  }
  const silhouette = kind === 'side'
    ? `<path d="M610 180 C520 250 540 350 590 430 C560 590 555 820 605 1150" fill="none" stroke="${IVORY}" stroke-width="5"/>`
    : `<path d="M600 160 C500 250 475 420 510 620 C455 800 480 1030 575 1280 M600 160 C700 250 725 420 690 620 C745 800 720 1030 625 1280" fill="none" stroke="${IVORY}" stroke-width="5"/>`;
  const lines = `<line x1="350" y1="360" x2="850" y2="360" stroke="#fff" stroke-width="3"/><line x1="405" y1="780" x2="795" y2="780" stroke="#fff" stroke-width="3"/><line x1="600" y1="130" x2="600" y2="1320" stroke="#fff" stroke-width="2" stroke-opacity=".7"/>`;
  if (kind === 'heat') {
    return svgShell(`${silhouette}<circle cx="600" cy="580" r="115" fill="${ROSE}" opacity=".28"/><circle cx="540" cy="770" r="85" fill="${ROSE}" opacity=".22"/><circle cx="650" cy="380" r="55" fill="${ROSE}" opacity=".2"/>`);
  }
  if (kind === 'axis') {
    return svgShell(`${silhouette}${lines}<circle cx="600" cy="610" r="14" fill="#fff"/><path d="M600 200 L600 150 M570 180 L600 150 L630 180" stroke="#fff" stroke-width="3" fill="none"/>`);
  }
  if (kind === 'face' || kind === 'ratio') {
    return svgShell(`
      <path d="M600 180 C420 220 390 520 450 760 C500 955 700 955 750 760 C810 520 780 220 600 180Z" fill="none" stroke="${IVORY}" stroke-width="5"/>
      <line x1="455" y1="360" x2="745" y2="360" stroke="#fff" stroke-width="3"/>
      <line x1="420" y1="545" x2="780" y2="545" stroke="#fff" stroke-width="3"/>
      <line x1="470" y1="740" x2="730" y2="740" stroke="#fff" stroke-width="3"/>
      <line x1="600" y1="180" x2="600" y2="895" stroke="#fff" stroke-width="2" stroke-opacity=".7"/>
    `, 1200, kind === 'face' ? 1200 : 1500);
  }
  return svgShell(`${silhouette}${lines}<circle cx="350" cy="360" r="8" fill="#fff"/><circle cx="850" cy="360" r="8" fill="#fff"/><circle cx="405" cy="780" r="8" fill="#fff"/><circle cx="795" cy="780" r="8" fill="#fff"/>`);
}

function swatchSvg(hexes: string[], cols: number, width = 1200, height = 800) {
  const size = cols >= 5 ? 150 : 170;
  const gap = 28;
  const rows = Math.ceil(hexes.length / cols);
  const startX = (width - (cols * size + (cols - 1) * gap)) / 2;
  const startY = (height - (rows * size + (rows - 1) * gap)) / 2;
  const rects = hexes.map((hex, i) => {
    const x = startX + (i % cols) * (size + gap);
    const y = startY + Math.floor(i / cols) * (size + gap);
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8" fill="${escapeXml(hex)}" stroke="${IVORY}" stroke-opacity=".25"/>`;
  }).join('');
  return svgShell(`${rects}<line x1="${width * .15}" y1="${height - 85}" x2="${width * .85}" y2="${height - 85}" stroke="${IVORY}" stroke-opacity=".4"/>`, width, height);
}

function gridLineSvg(count: number, aspect: 'square' | 'wide' | 'strip') {
  const width = aspect === 'strip' ? 1600 : 1200;
  const height = aspect === 'wide' ? 800 : aspect === 'strip' ? 420 : 1200;
  const cols = aspect === 'square' ? 2 : count;
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const cells = Array.from({ length: count }, (_, i) => {
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    return `<rect x="${x + 30}" y="${y + 30}" width="${cellW - 60}" height="${cellH - 60}" rx="12" fill="none" stroke="${IVORY}" stroke-opacity=".25"/>
      <path d="M${x + cellW * .3} ${y + cellH * .62} C${x + cellW * .45} ${y + cellH * .32} ${x + cellW * .62} ${y + cellH * .32} ${x + cellW * .72} ${y + cellH * .62}" fill="none" stroke="${IVORY}" stroke-width="4"/>`;
  }).join('');
  return svgShell(cells, width, height);
}

async function callGeminiImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ parts: [{ text: prompt }] }],
    });
    const parts = (response.candidates?.[0]?.content?.parts ?? []) as Array<{ inlineData?: { data?: string } }>;
    const data = parts.find(part => part.inlineData?.data)?.inlineData?.data;
    return data ? Buffer.from(data, 'base64') : null;
  } catch {
    return null;
  }
}

function outfitPrompt(title: string, detail = false) {
  return `On flat matte slate background ${SLATE}, create a ${detail ? 'close-up product detail of the hero garment' : 'floating editorial flat-lay of the complete outfit'}: ${title}. No body, no face, no mannequin, no text, no labels. Even soft frontal studio lighting. Hyperrealistic product photography with sharp fabric texture.`;
}

async function generatedOrFallback(reportId: string, fileName: string, prompt: string, fallbackSvg: string) {
  const buffer = await callGeminiImage(prompt);
  return buffer ? uploadBuffer(reportId, fileName, buffer) : uploadSvg(reportId, fileName, fallbackSvg);
}

function pageTitle(data: StylistBlueprintReportData, pageNumber: number) {
  return data.pages.find(page => page.page_number === pageNumber)?.title || `Page ${pageNumber}`;
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

  await persistPaths(reportId, paths, shareToken, `generating_images_${group}`);

  if (group === 'cover' || group === 'all') {
    await setSlot({
      reportId, paths, shareToken, force, fileName: 'cover-portrait',
      getCurrent: () => paths.cover.portrait,
      setCurrent: path => { paths.cover.portrait = path; },
      create: async () => generatedOrFallback(reportId, 'cover-portrait', `Warm editorial head-and-shoulders portrait treatment on slate background ${SLATE}. Natural luminous skin, no text, Vogue editorial restraint.`, analyticalCard('portrait')),
    });
  }

  if (group === 'diagnosis' || group === 'all') {
    const diagnosisSlots: Array<[keyof MutablePaths['diagnosis'], string, string]> = [
      ['silhouetteFront', 'diagnosis-silhouette-front', analyticalCard('front')],
      ['silhouetteSide', 'diagnosis-silhouette-side', analyticalCard('side')],
      ['proportionalAxes', 'diagnosis-proportional-axes', analyticalCard('axis')],
      ['undertoneMap', 'diagnosis-undertone-map', swatchSvg(['#A8B8C8', '#C8C0B4', '#D4B896'], 3, 1200, 900)],
      ['depthContrastMatrix', 'diagnosis-depth-contrast', gridLineSvg(25, 'square')],
      ['palettePreview', 'diagnosis-palette-preview', swatchSvg(reportData.classification.colour.base_palette.slice(0, 5).map(c => c.hex), 5, 1400, 800)],
      ['faceShapeDiagram', 'diagnosis-face-shape', analyticalCard('face')],
      ['faceRatios', 'diagnosis-face-ratios', analyticalCard('ratio')],
      ['necklinePreview', 'diagnosis-neckline-preview', gridLineSvg(4, 'square')],
      ['combinedAxes', 'diagnosis-combined-axes', analyticalCard('axis')],
      ['focalHeatmap', 'diagnosis-focal-heatmap', analyticalCard('heat')],
      ['avoidanceGrid', 'diagnosis-avoidance-grid', analyticalCard('avoid')],
    ];
    for (const [slot, fileName, svg] of diagnosisSlots) {
      await setSlot({
        reportId, paths, shareToken, force, fileName,
        getCurrent: () => paths.diagnosis[slot],
        setCurrent: path => { paths.diagnosis[slot] = path; },
        create: () => uploadSvg(reportId, fileName, svg),
      });
    }
  }

  if (group === 'prescription' || group === 'all') {
    const prescriptionSlots: Array<[keyof MutablePaths['prescription'], string, string]> = [
      ['basePalette', 'prescription-base-palette', swatchSvg(reportData.classification.colour.base_palette.slice(0, 10).map(c => c.hex), 5, 1400, 900)],
      ['accentPalette', 'prescription-accent-palette', swatchSvg(reportData.classification.colour.accent_palette.slice(0, 5).map(c => c.hex), 5, 1400, 700)],
      ['necklineGrid', 'prescription-neckline-grid', gridLineSvg(6, 'wide')],
      ['sleeveWaistGrid', 'prescription-sleeve-waist-grid', gridLineSvg(8, 'wide')],
      ['hairDirections', 'prescription-hair-directions', gridLineSvg(4, 'strip')],
      ['eyewearFrames', 'prescription-eyewear-frames', gridLineSvg(4, 'strip')],
      ['approvedFabrics', 'prescription-approved-fabrics', gridLineSvg(4, 'square')],
      ['avoidedFabrics', 'prescription-avoided-fabrics', analyticalCard('avoid')],
    ];
    for (const [slot, fileName, svg] of prescriptionSlots) {
      const isFabric = slot === 'approvedFabrics' || slot === 'avoidedFabrics';
      await setSlot({
        reportId, paths, shareToken, force, fileName,
        getCurrent: () => paths.prescription[slot],
        setCurrent: path => { paths.prescription[slot] = path; },
        create: () => isFabric
          ? generatedOrFallback(reportId, fileName, `Macro fabric texture grid on slate ${SLATE}, warm ivory fabrics, no text.`, svg)
          : uploadSvg(reportId, fileName, svg),
      });
    }
  }

  const capsuleGroups: Array<[StylistBlueprintImageGroup, number, number, number]> = [
    ['capsule_1', 0, 14, 16],
    ['capsule_2', 1, 17, 19],
    ['capsule_3', 2, 20, 22],
    ['capsule_4', 3, 23, 25],
  ];
  for (const [capsuleGroup, capsuleIndex, firstPage, lastPage] of capsuleGroups) {
    if (group !== capsuleGroup && group !== 'all') continue;
    await setSlot({
      reportId, paths, shareToken, force, fileName: `capsule-${capsuleIndex + 1}-cover`,
      getCurrent: () => paths.application.capsuleCovers[capsuleIndex],
      setCurrent: path => { paths.application.capsuleCovers[capsuleIndex] = path; },
      create: () => generatedOrFallback(reportId, `capsule-${capsuleIndex + 1}-cover`, outfitPrompt(`Capsule ${capsuleIndex + 1} anchor pieces: ${pageTitle(reportData, firstPage)}`), swatchSvg(reportData.classification.colour.base_palette.slice(0, 5).map(c => c.hex), 5)),
    });
    for (let page = firstPage; page <= lastPage; page++) {
      const index = page - 14;
      const title = pageTitle(reportData, page);
      await setSlot({
        reportId, paths, shareToken, force, fileName: `outfit-${index + 1}-flatlay`,
        getCurrent: () => paths.application.outfitFlatlays[index],
        setCurrent: path => { paths.application.outfitFlatlays[index] = path; },
        create: () => generatedOrFallback(reportId, `outfit-${index + 1}-flatlay`, outfitPrompt(title), swatchSvg(reportData.classification.colour.base_palette.slice(0, 5).map(c => c.hex), 5)),
      });
      await setSlot({
        reportId, paths, shareToken, force, fileName: `outfit-${index + 1}-detail`,
        getCurrent: () => paths.application.outfitDetails[index],
        setCurrent: path => { paths.application.outfitDetails[index] = path; },
        create: () => generatedOrFallback(reportId, `outfit-${index + 1}-detail`, outfitPrompt(title, true), gridLineSvg(1, 'square')),
      });
    }
  }

  if (group === 'closing' || group === 'all') {
    await setSlot({
      reportId, paths, shareToken, force, fileName: 'closing-combination-matrix',
      getCurrent: () => paths.closing.combinationMatrix,
      setCurrent: path => { paths.closing.combinationMatrix = path; },
      create: () => uploadSvg(reportId, 'closing-combination-matrix', analyticalCard('matrix')),
    });
    await setSlot({
      reportId, paths, shareToken, force, fileName: 'closing-edit-teaser',
      getCurrent: () => paths.closing.editTeaser,
      setCurrent: path => { paths.closing.editTeaser = path; },
      create: () => generatedOrFallback(reportId, 'closing-edit-teaser', outfitPrompt('ICONIK Edit weekly teaser outfit from the client palette'), swatchSvg(reportData.classification.colour.accent_palette.slice(0, 5).map(c => c.hex), 5)),
    });
  }

  await persistPaths(reportId, paths, shareToken, null);
  return paths;
}

function collectPaths(paths: StylistBlueprintImagePaths | null | undefined): string[] {
  const normalised = normalise(paths);
  return [
    normalised.cover.portrait,
    ...Object.values(normalised.diagnosis),
    ...Object.values(normalised.prescription),
    ...normalised.application.capsuleCovers,
    ...normalised.application.outfitFlatlays,
    ...normalised.application.outfitDetails,
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
      capsuleCovers: resolved.application.capsuleCovers.map(map),
      outfitFlatlays: resolved.application.outfitFlatlays.map(map),
      outfitDetails: resolved.application.outfitDetails.map(map),
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

export function getStylistBlueprintImageCounts(paths: StylistBlueprintImagePaths | null | undefined) {
  const normalised = normalise(paths);
  const groups = {
    cover: [normalised.cover.portrait],
    diagnosis: Object.values(normalised.diagnosis),
    prescription: Object.values(normalised.prescription),
    capsule_1: [normalised.application.capsuleCovers[0], ...normalised.application.outfitFlatlays.slice(0, 3), ...normalised.application.outfitDetails.slice(0, 3)],
    capsule_2: [normalised.application.capsuleCovers[1], ...normalised.application.outfitFlatlays.slice(3, 6), ...normalised.application.outfitDetails.slice(3, 6)],
    capsule_3: [normalised.application.capsuleCovers[2], ...normalised.application.outfitFlatlays.slice(6, 9), ...normalised.application.outfitDetails.slice(6, 9)],
    capsule_4: [normalised.application.capsuleCovers[3], ...normalised.application.outfitFlatlays.slice(9, 12), ...normalised.application.outfitDetails.slice(9, 12)],
    closing: [normalised.closing.combinationMatrix, normalised.closing.editTeaser],
  };
  return Object.fromEntries(
    Object.entries(groups).map(([key, values]) => [key, {
      done: values.filter(Boolean).length,
      total: values.length,
    }]),
  );
}
