import { GoogleGenAI } from '@google/genai';
import type { ClassificationResult } from './manReportGenerator';
import {
  extractOutfitBlock,
  inferOutfitContext,
  normaliseOutfitHeader,
  normaliseSequentialManOutfitNumbers,
  parseManOutfitBlock,
  type ParsedManOutfit,
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

function hasUsableValue(value: string | null | undefined): value is string {
  return !!value && !needsEnrichment(value);
}

function cleanField(value: string | null | undefined): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function pickField(edited: string, current: string, fallback: string): string {
  const cleanedEdited = cleanField(edited);
  if (hasUsableValue(cleanedEdited)) return cleanedEdited;

  const cleanedCurrent = cleanField(current);
  if (hasUsableValue(cleanedCurrent)) return cleanedCurrent;

  return fallback;
}

function getPrimaryColour(input: EnrichManOutfitEditInput): string {
  return (
    input.classification.colour?.neutral_base_colours?.[0]?.name ||
    input.classification.colour?.primary_palette?.[0]?.name ||
    'your strongest neutral'
  );
}

function getFitDirective(input: EnrichManOutfitEditInput): string {
  return input.classification.body?.fit_directive || 'clean structure';
}

function getRegister(input: EnrichManOutfitEditInput): string {
  return input.classification.style_brief?.register || 'the occasion';
}

function fallbackRationale(
  input: EnrichManOutfitEditInput,
  editedParsed: ParsedManOutfit,
  field: 'fitNote' | 'colourLogic' | 'whyItWorks' | 'shoppingTranslation' | 'acceptableSubstitutes' | 'doNotBuy',
): string {
  const primaryColour = getPrimaryColour(input);
  const fitDirective = getFitDirective(input);
  const register = getRegister(input);
  const top = hasUsableValue(editedParsed.top) ? editedParsed.top : 'the top';
  const bottom = hasUsableValue(editedParsed.bottom) ? editedParsed.bottom : 'the trouser';
  const footwear = hasUsableValue(editedParsed.footwear) ? editedParsed.footwear : 'clean footwear';

  switch (field) {
    case 'fitNote':
      return `${top} and ${bottom} keep the fit aligned with ${fitDirective}.`;
    case 'colourLogic':
      return `${primaryColour} keeps the palette grounded while the outfit stays cohesive.`;
    case 'whyItWorks':
      return `Use this for ${register}; it reads intentional without looking overworked.`;
    case 'shoppingTranslation':
      return `Prioritise the same silhouette, fabric weight, and colour depth.`;
    case 'acceptableSubstitutes':
      return `Swap within the same colour family and similar fit.`;
    case 'doNotBuy':
      return `Avoid skinny cuts, shiny finishes, or loud contrast details.`;
    default:
      return `Keep the replacement close to ${footwear} in polish and weight.`;
  }
}

function completeEditedOutfitBlock(
  input: EnrichManOutfitEditInput,
  currentParsed: ParsedManOutfit | null,
  editedParsed: ParsedManOutfit,
  context: string,
): string {
  const top = pickField(editedParsed.top, currentParsed?.top ?? '', 'Structured shirt or knit');
  const bottom = pickField(editedParsed.bottom, currentParsed?.bottom ?? '', 'Tailored trouser');
  const layer = pickField(editedParsed.layer, currentParsed?.layer ?? '', 'No layer');
  const footwear = pickField(editedParsed.footwear, currentParsed?.footwear ?? '', 'Clean leather loafer');
  const accessories = pickField(editedParsed.accessories, currentParsed?.accessories ?? '', 'Minimal watch or belt');
  const fitNote = pickField(
    editedParsed.fitNote,
    currentParsed?.fitNote ?? '',
    fallbackRationale(input, editedParsed, 'fitNote'),
  );
  const colourLogic = pickField(
    editedParsed.colourLogic,
    currentParsed?.colourLogic ?? '',
    fallbackRationale(input, editedParsed, 'colourLogic'),
  );
  const whyItWorks = pickField(
    editedParsed.whyItWorks,
    currentParsed?.whyItWorks ?? '',
    fallbackRationale(input, editedParsed, 'whyItWorks'),
  );
  const shoppingTranslation = pickField(
    editedParsed.shoppingTranslation,
    currentParsed?.shoppingTranslation ?? '',
    fallbackRationale(input, editedParsed, 'shoppingTranslation'),
  );
  const acceptableSubstitutes = pickField(
    editedParsed.acceptableSubstitutes,
    currentParsed?.acceptableSubstitutes ?? '',
    fallbackRationale(input, editedParsed, 'acceptableSubstitutes'),
  );
  const doNotBuy = pickField(
    editedParsed.doNotBuy,
    currentParsed?.doNotBuy ?? '',
    fallbackRationale(input, editedParsed, 'doNotBuy'),
  );

  return enforceConciseOutfitEditFields(`OUTFIT ${input.outfitNumber} — ${context.toUpperCase()}
TOP: ${top}
BOTTOM: ${bottom}
LAYER: ${layer}
FOOTWEAR: ${footwear}
ACCESSORIES: ${accessories}
FIT NOTE: ${fitNote}
COLOUR LOGIC: ${colourLogic}
OCCASION ANCHOR: ${whyItWorks}
SHOPPING TRANSLATION: ${shoppingTranslation}
ACCEPTABLE SUBSTITUTES: ${acceptableSubstitutes}
DO NOT BUY: ${doNotBuy}`);
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

export function completeManOutfitEditDeterministically(input: EnrichManOutfitEditInput): string {
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
  const normalisedEditedParsed = parseManOutfitBlock(editedBlock);
  if (!normalisedEditedParsed) {
    throw new Error(`Edited text must be a parseable Outfit ${input.outfitNumber} block`);
  }

  return completeEditedOutfitBlock(input, currentParsed, normalisedEditedParsed, context);
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
  const fallbackBlock = completeEditedOutfitBlock(input, currentParsed, parseManOutfitBlock(editedBlock) ?? editedParsed, context);

  const fallbackToDeterministicBlock = (reason: string) => {
    console.warn(`Man outfit edit AI polish fell back for Outfit ${input.outfitNumber}: ${reason}`);
    return fallbackBlock;
  };

  let responseText = '';
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 2048 },
    });
    responseText = response.text ?? '';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fallbackToDeterministicBlock(message);
  }

  const candidateBlock = enforceConciseOutfitEditFields(
    normaliseOutfitHeader(stripFences(responseText), input.outfitNumber, context),
  );
  const parsedCandidate = parseManOutfitBlock(candidateBlock);
  if (!parsedCandidate) {
    return fallbackToDeterministicBlock('AI did not return a parseable outfit block');
  }
  if (parsedCandidate.number !== input.outfitNumber) {
    return fallbackToDeterministicBlock(`AI returned Outfit ${parsedCandidate.number}; expected Outfit ${input.outfitNumber}`);
  }
  if (parsedCandidate.context !== context) {
    return fallbackToDeterministicBlock(`AI returned ${parsedCandidate.context}; expected ${context}`);
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
    return fallbackToDeterministicBlock('AI returned an outfit block with missing or placeholder stylist rationale');
  }

  return candidateBlock;
}
