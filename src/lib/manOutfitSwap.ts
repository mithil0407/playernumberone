import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import type { ClassificationResult } from './manReportGenerator';
import {
  extractOutfitBlock,
  inferOutfitContext,
  normaliseOutfitHeader,
  parseManOutfitBlock,
  replaceOutfitBlock,
} from './manOutfitSection';
import { validateManReportSection4, type ManReportQaIssue } from './manReportQa';

const OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/outfitrecommendationskill.md'),
  'utf-8',
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const TEXT_MODEL = 'gemini-3-flash-preview';
const MAX_INSPIRATION_IMAGE_BYTES = 8 * 1024 * 1024;

interface InspirationImage {
  data: string;
  mimeType: string;
}

export interface OutfitSwapDraftInput {
  classification: ClassificationResult;
  currentSection4: string;
  outfitNumber: number;
  reason: string;
  notes: string;
  inspirationText: string;
  inspirationImage?: InspirationImage | null;
}

export interface OutfitSwapDraftResult {
  candidateBlock: string;
  projectedSection4: string;
  qaIssues: ManReportQaIssue[];
}

function deriveClimateZone(locationRegion: string): 'HOT' | 'TEMPERATE' {
  const loc = locationRegion.toLowerCase();
  if (/india|uae|middle\s*east|dubai|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/.test(loc)) return 'HOT';
  return 'TEMPERATE';
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md|text)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

function buildDraftPrompt(input: OutfitSwapDraftInput, currentBlock: string, context: string): string {
  const climateZone = deriveClimateZone(input.classification.client.location_region);

  return `${OUTFIT_SKILL}

DERIVED VARIABLES:
CLIMATE_ZONE = ${climateZone}

You are replacing ONE rejected outfit inside an ICONIK Men's Blueprint.

Return ONLY one corrected outfit block. Do not include explanations, markdown fences, or any text before/after the block.

Target slot:
OUTFIT ${input.outfitNumber} — ${context.toUpperCase()}

Admin rejection reason:
${input.reason || 'Not provided'}

Admin notes:
${input.notes || 'Not provided'}

Inspiration text:
${input.inspirationText || 'Not provided'}

Rules for the replacement:
- Keep the same outfit number and same context.
- Treat the inspiration image/text as style direction, not a literal copy.
- Adapt the inspiration to the client's body geometry, colour season, climate, style brief, anti-preferences, and existing Section 4 variety.
- Do not use banned garments or hot-climate restricted fabrics.
- The replacement must be visually distinct from the rejected outfit.
- Output the same field structure used by the report.
- Include TOP, LAYER, BOTTOM, FOOTWEAR, ACCESSORIES or ACCESSORY, FIT NOTE, COLOUR LOGIC, OCCASION ANCHOR, SHOPPING TRANSLATION, ACCEPTABLE SUBSTITUTES, and DO NOT BUY.

Client classification JSON:
${JSON.stringify(input.classification, null, 2)}

Rejected current outfit block:
${currentBlock}

Full current Section 4 for variety context:
${input.currentSection4}

Required output header:
OUTFIT ${input.outfitNumber} — ${context.toUpperCase()}`;
}

export async function imageFileToGeminiInlineData(file: File | null): Promise<InspirationImage | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith('image/')) {
    throw new Error('Inspiration upload must be an image file');
  }
  if (file.size > MAX_INSPIRATION_IMAGE_BYTES) {
    throw new Error('Inspiration image is too large. Use an image under 8 MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    data: buffer.toString('base64'),
    mimeType: file.type || 'image/jpeg',
  };
}

export async function generateOutfitSwapDraft(input: OutfitSwapDraftInput): Promise<OutfitSwapDraftResult> {
  const currentBlock = extractOutfitBlock(input.currentSection4, input.outfitNumber);
  if (!currentBlock) {
    throw new Error(`Could not locate Outfit ${input.outfitNumber} in Section 4`);
  }

  const currentParsed = parseManOutfitBlock(currentBlock);
  const context = currentParsed?.context ?? inferOutfitContext('', input.outfitNumber);
  const prompt = buildDraftPrompt(input, currentBlock, context);
  const parts: object[] = [
    { text: prompt },
    ...(input.inspirationImage
      ? [{ inlineData: { mimeType: input.inspirationImage.mimeType, data: input.inspirationImage.data } }]
      : []),
  ];

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts }],
    config: { maxOutputTokens: 8192 },
  });

  const rawCandidate = stripFences(response.text ?? '');
  const candidateBlock = normaliseOutfitHeader(rawCandidate, input.outfitNumber, context);
  const parsedCandidate = parseManOutfitBlock(candidateBlock);

  if (!parsedCandidate) {
    throw new Error('AI did not return a parseable outfit block');
  }
  if (parsedCandidate.number !== input.outfitNumber) {
    throw new Error(`AI returned Outfit ${parsedCandidate.number}; expected Outfit ${input.outfitNumber}`);
  }
  if (parsedCandidate.context !== context) {
    throw new Error(`AI returned ${parsedCandidate.context}; expected ${context}`);
  }

  const projectedSection4 = replaceOutfitBlock(input.currentSection4, input.outfitNumber, candidateBlock);
  if (!projectedSection4) {
    throw new Error(`Could not project replacement for Outfit ${input.outfitNumber}`);
  }

  const qa = validateManReportSection4(projectedSection4, input.classification);

  return {
    candidateBlock,
    projectedSection4,
    qaIssues: qa.issues,
  };
}
