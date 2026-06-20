import { GoogleGenAI } from '@google/genai';
import type { ClassificationResult } from './manReportGenerator';
import {
  extractOutfitBlock,
  inferOutfitContext,
  normaliseOutfitHeader,
  normaliseSequentialManOutfitNumbers,
  parseManOutfitBlock,
} from './manOutfitSection';
import { hasPlaceholderOutfitValue, isPlaceholderOutfitValue } from './manOutfitPlaceholders';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const TEXT_MODEL = 'gemini-3-flash-preview';

export interface EnrichManOutfitEditInput {
  classification: ClassificationResult;
  currentSection4: string;
  outfitNumber: number;
  editedBlock: string;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md|text)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

function needsEnrichment(value: string): boolean {
  return isPlaceholderOutfitValue(value) || hasPlaceholderOutfitValue(value);
}

function conciseSentence(value: string, maxWords: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  const firstSentence = cleaned.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? cleaned;
  const words = firstSentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return firstSentence;
  return `${words.slice(0, maxWords).join(' ').replace(/[,:;\-]+$/, '')}.`;
}

function enforceConciseOutfitEditFields(block: string): string {
  const limits: Array<[RegExp, number]> = [
    [/FIT\s+NOTE/i, 16],
    [/COLOU?R\s+LOGIC/i, 16],
    [/OCCASION\s+ANCHOR/i, 18],
    [/SHOPPING\s+TRANSLATION/i, 14],
    [/ACCEPTABLE\s+SUBSTITUTES/i, 14],
    [/DO\s+NOT\s+BUY/i, 14],
  ];

  return limits.reduce((text, [labelPattern, maxWords]) => {
    const linePattern = new RegExp(
      `^([ \\t]*(?:[-\u2022][ \\t]*)?\\*{0,2}${labelPattern.source}\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2})(.+)$`,
      'gim',
    );
    return text.replace(linePattern, (_match, prefix: string, value: string) =>
      `${prefix}${conciseSentence(value.replace(/\*+$/g, ''), maxWords)}`
    );
  }, block);
}

function buildOutfitEditPrompt(input: EnrichManOutfitEditInput, currentBlock: string, editedBlock: string, context: string): string {
  return `You are ICONIK's senior men's stylist repairing one outfit block after an admin advanced edit.

Return ONLY one complete outfit block. Do not include explanations, markdown fences, QA notes, or text before/after the block.

Target slot:
OUTFIT ${input.outfitNumber} - ${context.toUpperCase()}

Client classification JSON:
${JSON.stringify(input.classification, null, 2)}

Previous saved outfit block:
${currentBlock}

Admin-edited outfit block:
${editedBlock}

Rules:
- Preserve the admin-edited garment choices, colours, fabrics, fit descriptors, footwear, accessories, and styling details wherever they are concrete.
- Do not revert admin garment edits to the previous saved outfit.
- Keep the same outfit number and same context.
- Use the existing report field contract exactly.
- Replace placeholders such as "-", "N/A", "Not specified by admin", "Not specified by stylist", "Not visible in reference", "TBD", or empty explanatory fields with polished ICONIK stylist copy.
- Never output placeholder text in FIT NOTE, COLOUR LOGIC, OCCASION ANCHOR, SHOPPING TRANSLATION, ACCEPTABLE SUBSTITUTES, or DO NOT BUY.
- If the admin did not specify a layer or accessories, you may write "No layer" or "No accessories" only in those garment fields.
- Keep every field short and to the point. No paragraphs.
- Garment fields should be compact phrases, not styling essays.
- FIT NOTE must be one direct sentence, max 16 words.
- COLOUR LOGIC must be one direct sentence, max 16 words.
- OCCASION ANCHOR must be one direct sentence, max 18 words.
- SHOPPING TRANSLATION must be one direct sentence, max 14 words.
- ACCEPTABLE SUBSTITUTES must be one direct sentence, max 14 words.
- DO NOT BUY must be one direct sentence, max 14 words.
- Keep the writing direct, specific, second-person, and client-facing. No brand names. No filler.

Required output structure:
OUTFIT ${input.outfitNumber} - ${context.toUpperCase()}
TOP: ...
BOTTOM: ...
LAYER: ...
FOOTWEAR: ...
ACCESSORIES: ...
FIT NOTE: ...
COLOUR LOGIC: ...
OCCASION ANCHOR: ...
SHOPPING TRANSLATION: ...
ACCEPTABLE SUBSTITUTES: ...
DO NOT BUY: ...`;
}

export async function enrichManOutfitEdit(input: EnrichManOutfitEditInput): Promise<string> {
  const currentSection4 = normaliseSequentialManOutfitNumbers(input.currentSection4);
  const currentBlock = extractOutfitBlock(currentSection4, input.outfitNumber);
  if (!currentBlock) {
    throw new Error(`Could not locate Outfit ${input.outfitNumber} in Section 4`);
  }

  const currentParsed = parseManOutfitBlock(currentBlock);
  const editedParsed = parseManOutfitBlock(input.editedBlock);
  if (!editedParsed || editedParsed.number !== input.outfitNumber) {
    throw new Error(`Edited text must be a parseable Outfit ${input.outfitNumber} block`);
  }

  const context = currentParsed?.context ?? inferOutfitContext(editedParsed.label, input.outfitNumber);
  const editedBlock = normaliseOutfitHeader(input.editedBlock, input.outfitNumber, context);
  const prompt = buildOutfitEditPrompt(input, currentBlock, editedBlock, context);

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 2048 },
  });

  const candidateBlock = enforceConciseOutfitEditFields(
    normaliseOutfitHeader(stripFences(response.text ?? ''), input.outfitNumber, context),
  );
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

  const explanatoryValues = [
    parsedCandidate.fitNote,
    parsedCandidate.colourLogic,
    parsedCandidate.whyItWorks,
    parsedCandidate.shoppingTranslation,
    parsedCandidate.acceptableSubstitutes,
    parsedCandidate.doNotBuy,
  ];

  if (explanatoryValues.some(needsEnrichment)) {
    throw new Error('AI returned an outfit block with missing or placeholder stylist rationale');
  }

  return candidateBlock;
}
