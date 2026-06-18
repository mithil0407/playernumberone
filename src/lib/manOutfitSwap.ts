import { GoogleGenAI } from '@google/genai';
import type { ClassificationResult } from './manReportGenerator';
import {
  extractOutfitBlock,
  inferOutfitContext,
  normaliseSequentialManOutfitNumbers,
  normaliseOutfitHeader,
  parseManOutfitBlock,
  replaceOutfitBlock,
} from './manOutfitSection';
import { validateManReportSection4, type ManReportQaIssue } from './manReportQa';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const TEXT_MODEL = 'gemini-3-flash-preview';
const MAX_INSPIRATION_IMAGE_BYTES = 8 * 1024 * 1024;
const LITERAL_SWAP_BLOCKING_CODES = new Set([
  'outfit_count',
  'context_split',
  'duplicate_outfit_number',
  'missing_required_field',
]);

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

function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md|text)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

export function getLiteralSwapBlockingIssues(issues: ManReportQaIssue[]): ManReportQaIssue[] {
  return issues.filter(issue => issue.severity === 'error' && LITERAL_SWAP_BLOCKING_CODES.has(issue.code));
}

function buildDraftPrompt(input: OutfitSwapDraftInput, currentBlock: string, context: string): string {
  return `You are a literal outfit extraction assistant for ICONIK's men's report editor.

Return ONLY one corrected outfit block. Do not include explanations, markdown fences, or any text before/after the block.

Target slot:
OUTFIT ${input.outfitNumber} — ${context.toUpperCase()}

Admin rejection reason:
${input.reason || 'Not provided'}

Admin notes:
${input.notes || 'Not provided'}

Inspiration text:
${input.inspirationText || 'Not provided'}

LITERAL COPY RULES:
- Do NOT redesign the outfit.
- Do NOT improve the outfit.
- Do NOT add your own twist.
- Do NOT adapt the outfit to the client's colour season, body type, climate, style brief, anti-preferences, current wardrobe variety, or occasion logic.
- Do NOT substitute garments unless the source explicitly names that substitute.
- Do NOT make the outfit more formal, more wearable, more ICONIK, or more stylistically correct.
- Your only job is to extract the outfit from the admin's text and/or image and convert it into the report's outfit block format.
- If text and image conflict, follow the admin text first and use the image only for missing visible details.
- If the admin text already describes garments, preserve the garment types, colours, fabrics, fits, styling details, accessories, and footwear as literally as possible.
- If an inspiration image is provided, describe only the visible outfit: top, layer, bottom, footwear, accessories, colours, fit, and styling. Do not infer hidden garments.
- If admin text or the inspiration image includes accessories, output an Accessories line and preserve those accessories literally.
- Do not drop watches, belts, jewellery, bags, sunglasses, pocket squares, chains, bracelets, rings, or other named accessories.
- If a detail is not visible or not specified, write "Not visible in reference" or "Not specified by admin" instead of inventing it.
- Keep the same outfit number and same context.
- Output the same field structure used by the report so image generation can apply this exact outfit to the person.
- Include TOP, LAYER, BOTTOM, FOOTWEAR, ACCESSORIES or ACCESSORY, FIT NOTE, COLOUR LOGIC, OCCASION ANCHOR, SHOPPING TRANSLATION, ACCEPTABLE SUBSTITUTES, and DO NOT BUY.

Field-writing rules:
- TOP/BOTTOM/LAYER/FOOTWEAR/ACCESSORIES must be literal extraction fields.
- FIT NOTE may say how the visible/source garment fits, but must not recommend a different fit.
- COLOUR LOGIC may name the copied colours, but must not justify or change them for the client.
- OCCASION ANCHOR may be copied from admin text if supplied; otherwise write "Not specified by admin."
- SHOPPING TRANSLATION may name the copied key items only.
- ACCEPTABLE SUBSTITUTES must be "Not specified by admin" unless admin gave substitutes.
- DO NOT BUY must be "Not specified by admin" unless admin gave avoid instructions.

Rejected current outfit block:
${currentBlock}

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
  const currentSection4 = normaliseSequentialManOutfitNumbers(input.currentSection4);
  const currentBlock = extractOutfitBlock(currentSection4, input.outfitNumber);
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

  const projectedSection4 = replaceOutfitBlock(currentSection4, input.outfitNumber, candidateBlock);
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
