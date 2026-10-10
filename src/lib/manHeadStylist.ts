import 'server-only';

// The head stylist: one model call that chooses a man's v5 portfolio from the
// rule-built shortlist, before Section 4 is written. Its choices become pinned
// slots (so every later pick, QA pass and redo sees the same looks) and its
// one-line reasons go to the Section 4 writer. If the call fails or a choice
// breaks a rule, the rule-based picker fills that slot as before.

import { GoogleGenAI } from '@google/genai';
import { manGenerateText } from './manAi';
import {
  getManPortfolioCandidates,
  getManReportClimateProfile,
  manPortfolioLeadCap,
  type ManOutfitSelectionOverrides,
} from './manOutfitLibrary';
import { buildManHeadStylistPrompt, parseManHeadStylistChoices } from './manHeadStylistPrompt';
import type { ClassificationResult } from './manReportGenerator';

const STYLIST_MODEL = process.env.GEMINI_MAN_STYLIST_MODEL || process.env.GEMINI_MAN_TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

let ai: GoogleGenAI | null = null;
function gemini() {
  ai ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return ai;
}

export async function runManHeadStylist(
  classification: ClassificationResult,
  now = new Date(),
): Promise<{ overrides: ManOutfitSelectionOverrides; dropped: string[]; prompt: string; raw: string }> {
  const { slots, candidates } = getManPortfolioCandidates(classification, undefined, now);
  const maxPerLeadFamily = manPortfolioLeadCap(slots.length);
  const prompt = buildManHeadStylistPrompt({
    classification,
    slots,
    candidates,
    climateLabel: getManReportClimateProfile(classification, now).label,
    maxPerLeadFamily,
  });
  const raw = await manGenerateText({ label: 'man-head-stylist', prompt }, async () => {
    const response = await gemini().models.generateContent({
      model: STYLIST_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });
    return response.text ?? '';
  });
  const { choices, dropped } = parseManHeadStylistChoices(raw, slots, candidates, maxPerLeadFamily);
  return {
    overrides: {
      pinned: Object.fromEntries(choices.map(choice => [String(choice.slot), choice.id])),
      stylistNotes: Object.fromEntries(choices.filter(choice => choice.why).map(choice => [String(choice.slot), choice.why])),
    },
    dropped,
    prompt,
    raw,
  };
}
