import 'server-only';

// The head stylist: one model call that chooses a man's v5 portfolio from the
// rule-built shortlist, before Section 4 is written. Its choices become pinned
// slots (so every later pick, QA pass and redo sees the same looks) and its
// one-line reasons go to the Section 4 writer.
//
// Its answer goes through the same variety rules as Section 4 QA. Looks are
// first reordered inside each occasion so neighbours differ; whatever still
// breaks a rule goes back to the stylist once; anything left after that is
// unpinned, and the rule-based picker fills those slots within its own caps.

import { GoogleGenAI } from '@google/genai';
import { manGenerateText } from './manAi';
import {
  getManOutfitLibrary,
  getManPortfolioCandidates,
  getManReportClimateProfile,
  manPortfolioLeadCap,
  type ManOutfitLibraryEntry,
  type ManOutfitSelectionOverrides,
} from './manOutfitLibrary';
import {
  buildManHeadStylistPrompt,
  buildManHeadStylistRepairPrompt,
  manPortfolioLooks,
  orderManPortfolioChoices,
  parseManHeadStylistChoices,
  type ManHeadStylistChoice,
} from './manHeadStylistPrompt';
import { findManPortfolioVarietyIssues, type ManPortfolioVarietyIssue } from './manReportQa';
import type { ClassificationResult } from './manReportGenerator';

const STYLIST_MODEL = process.env.GEMINI_MAN_STYLIST_MODEL || process.env.GEMINI_MAN_TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

let ai: GoogleGenAI | null = null;
function gemini() {
  ai ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return ai;
}

async function ask(prompt: string) {
  return manGenerateText({ label: 'man-head-stylist', prompt }, async () => {
    const response = await gemini().models.generateContent({
      model: STYLIST_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });
    return response.text ?? '';
  });
}

/**
 * After the repair round, only a repeated silhouette is worth losing a
 * stylist's pick over: the rule-based picker's fill is plainer than what it
 * replaces, so a colour one over its cap or two similar neighbours stay as
 * chosen (QA still notes them for the admin).
 */
function looksToRelease(issues: ManPortfolioVarietyIssue[]): Set<number> {
  const release = new Set<number>();
  for (const issue of issues) {
    if (!['silhouette_context_cap', 'silhouette_global_cap', 'formula_context_cap'].includes(issue.code) || issue.limit === undefined) continue;
    issue.outfits.slice(issue.limit).forEach(number => release.add(number));
  }
  return release;
}

export async function runManHeadStylist(
  classification: ClassificationResult,
  now = new Date(),
  options: {
    excluded?: number[];
    /** Outfit number → look already approved; only the other slots are chosen, and nothing moves. */
    fixed?: Record<string, number>;
  } = {},
): Promise<{ overrides: ManOutfitSelectionOverrides; dropped: string[]; issues: string[]; released: number[]; prompt: string; raw: string }> {
  const { slots, candidates } = getManPortfolioCandidates(classification, undefined, now, undefined, options.excluded);
  const library = getManOutfitLibrary();
  const entries = new Map<number, ManOutfitLibraryEntry>();
  for (const list of candidates.values()) for (const { entry } of list) entries.set(entry.id, entry);
  const fixed = new Map<number, ManOutfitLibraryEntry>();
  for (const [slot, id] of Object.entries(options.fixed ?? {})) {
    const entry = library.find(item => item.id === id);
    if (entry) { fixed.set(Number(slot), entry); entries.set(entry.id, entry); }
  }
  const fixedChoices: ManHeadStylistChoice[] = [...fixed].map(([slot, entry]) => ({ slot, id: entry.id, why: '' }));
  const maxPerLeadFamily = manPortfolioLeadCap(slots.length);
  const prompt = buildManHeadStylistPrompt({
    classification,
    slots,
    candidates,
    climateLabel: getManReportClimateProfile(classification, now).label,
    maxPerLeadFamily,
    fixed,
  });

  const attempt = (raw: string) => {
    const parsed = parseManHeadStylistChoices(raw, slots, candidates, maxPerLeadFamily, fixed);
    // Kept looks hold their slots (their text and pictures are already approved), so only a fresh portfolio is reordered.
    const choices = fixed.size ? parsed.choices : orderManPortfolioChoices(parsed.choices, slots, entries);
    const whole = [...fixedChoices, ...choices];
    // Checked on whatever was chosen, so a partial answer still gets its repeats sent back.
    const issues = findManPortfolioVarietyIssues(manPortfolioLooks(whole, slots, entries));
    return { choices, dropped: parsed.dropped, issues };
  };

  let raw = await ask(prompt);
  let result = attempt(raw);
  const firstProblems = [...result.dropped, ...result.issues.map(issue => issue.message)];
  if (firstProblems.length) {
    const repairRaw = await ask(buildManHeadStylistRepairPrompt(prompt, result.choices, firstProblems));
    const repaired = attempt(repairRaw);
    // Keep the repair unless it came back worse.
    if (repaired.choices.length >= result.choices.length
      && repaired.dropped.length + repaired.issues.length <= result.dropped.length + result.issues.length) {
      result = repaired;
      raw = repairRaw;
    }
  }

  const released = new Set([...looksToRelease(result.issues)].filter(slot => !fixed.has(slot)));
  const kept: ManHeadStylistChoice[] = result.choices.filter(choice => !released.has(choice.slot));
  return {
    overrides: {
      ...(options.excluded?.length ? { excluded: options.excluded } : {}),
      pinned: Object.fromEntries([...fixedChoices, ...kept].map(choice => [String(choice.slot), choice.id])),
      roles: Object.fromEntries(kept.flatMap(choice => choice.role ? [[String(choice.slot), choice.role]] : [])),
      stylistNotes: Object.fromEntries(kept.filter(choice => choice.why).map(choice => [String(choice.slot), choice.why])),
    },
    dropped: result.dropped,
    issues: result.issues.map(issue => issue.message),
    released: [...released],
    prompt,
    raw,
  };
}

