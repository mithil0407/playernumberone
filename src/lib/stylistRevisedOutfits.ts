/**
 * Revised looks: outfits a stylist writes after delivery, when the client asks
 * for some of her looks to be changed.
 *
 * A revised look is an ordinary outfit page — same design, same editor, same
 * paste-an-outfit flow — but it lives beside the fixed page layout rather than
 * inside it. `report_data.pages` stays exactly the pages the layout defines, so
 * validation, generation, repair and approvals keep counting what they always
 * counted. The original look stays in the report too; the client sees the new
 * one first and the old one marked as revised.
 *
 * Numbering: revised pages start at 101 so a page number alone says which kind
 * of page it is, and their images live in their own slots
 * (`revision.outfitFlatlays.<n>`, n = page number - 101).
 */
import type { BlueprintPage, StylistBlueprintReportData, StylistRevisedOutfit } from './stylistBlueprintGenerator.ts';
import {
  MAX_REVISED_OUTFITS,
  REVISED_OUTFIT_FIRST_PAGE,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  isRevisedOutfitPageNumber,
} from './stylistBlueprintSchema.ts';
import { outfitPieces } from './stylistOutfitEditor.ts';

export { MAX_REVISED_OUTFITS, REVISED_OUTFIT_FIRST_PAGE, isRevisedOutfitPageNumber };

export type RevisedOutfitSlotKey = `revision.outfitFlatlays.${number}`;

export function revisedOutfitSlotIndex(pageNumber: number) {
  return pageNumber - REVISED_OUTFIT_FIRST_PAGE;
}

export function revisedOutfitSlotKey(pageNumber: number): RevisedOutfitSlotKey {
  return `revision.outfitFlatlays.${revisedOutfitSlotIndex(pageNumber)}`;
}

/** `revision.outfitFlatlays.3` -> 3, or null for any other slot. */
export function revisedOutfitSlotIndexFromKey(slotKey: string) {
  const match = /^revision\.outfitFlatlays\.(\d{1,2})$/.exec(slotKey);
  const index = match ? Number(match[1]) : NaN;
  return Number.isInteger(index) && index >= 0 && index < MAX_REVISED_OUTFITS ? index : null;
}

export function revisedOutfits(data: Pick<StylistBlueprintReportData, 'revised_outfits'> | null | undefined): StylistRevisedOutfit[] {
  return Array.isArray(data?.revised_outfits) ? data.revised_outfits : [];
}

export function findRevisedOutfit(data: Pick<StylistBlueprintReportData, 'revised_outfits'> | null | undefined, pageNumber: number) {
  return revisedOutfits(data).find(entry => entry.page.page_number === pageNumber) ?? null;
}

/**
 * The revision a new look belongs to. A report delivered once is at published
 * version 1, and the looks written for its first revision are round 1; they go
 * out as version 2. Looks added before that publish join the same round.
 */
export function revisionRoundFor(publishedVersion: number | null | undefined) {
  return Math.max(1, Math.floor(Number(publishedVersion) || 0));
}

/** Reading order: the newest revision first, then in the order of the looks they replace. */
export function orderedRevisedOutfits(data: Pick<StylistBlueprintReportData, 'revised_outfits'> | null | undefined) {
  return [...revisedOutfits(data)].sort((a, b) => b.round - a.round || a.replaces - b.replaces || a.page.page_number - b.page.page_number);
}

/** The newest revised look written for an original look, if any. */
export function latestRevisionOf(data: Pick<StylistBlueprintReportData, 'revised_outfits'> | null | undefined, lookNumber: number) {
  return orderedRevisedOutfits(data).find(entry => entry.replaces === lookNumber) ?? null;
}

/** A look the stylist has not started: every piece still empty. */
export function isBlankRevisedOutfit(entry: StylistRevisedOutfit) {
  return !outfitPieces(entry.page).some(piece => piece.piece.trim());
}

function originalPage(data: StylistBlueprintReportData, lookNumber: number) {
  const pageNumber = getStylistBlueprintOutfitStartPage(data) + lookNumber - 1;
  return data.pages.find(page => page.page_number === pageNumber) ?? null;
}

/**
 * A blank look in the shape the outfit editor and the paste parser write, so
 * both work on it unchanged. The occasion is carried over: the client asked
 * for a different outfit, rarely for a different occasion.
 */
export function blankRevisedOutfitPage(data: StylistBlueprintReportData, pageNumber: number, lookNumber: number): BlueprintPage {
  const original = originalPage(data, lookNumber);
  const piece = (slot: string, role: 'lead' | 'support' | 'ground' | 'accent') => ({ slot, piece: '', colour_name: '', colour_hex: '#2C2622', palette_role: role, structural_notes: '' });
  return {
    page_number: pageNumber,
    page_type: 'outfit',
    title: '',
    subtitle: original?.subtitle ?? '',
    pull_quote: '',
    blocks: [
      { label: 'Formula', heading: 'The pieces', body: '', items: [piece('Top', 'lead'), piece('Bottom', 'ground'), piece('Footwear', 'support'), piece('Bag', 'accent')] },
      { label: 'Why it works', heading: 'Why this works on you', body: '', reason: '' },
      { label: 'Role breakdown', heading: 'What each piece is doing', body: '' },
    ],
    palette_used: [],
  };
}

/**
 * Adds a blank revised look for each original look named. A look that already
 * has one in this round is left alone, so pressing the button twice, or two
 * stylists on the same report, never produces duplicates.
 */
export function addRevisedOutfits(
  data: StylistBlueprintReportData,
  input: { looks: number[]; round: number; now?: string },
): { data: StylistBlueprintReportData; added: StylistRevisedOutfit[] } {
  const outfitCount = getStylistBlueprintOutfitCount(data);
  const looks = [...new Set(input.looks)].sort((a, b) => a - b);
  if (!looks.length) throw new Error('Choose at least one look to revise.');
  for (const look of looks) {
    if (!Number.isInteger(look) || look < 1 || look > outfitCount) throw new Error(`There is no look ${look} in this report.`);
  }
  const existing = revisedOutfits(data);
  const pending = looks.filter(look => !existing.some(entry => entry.round === input.round && entry.replaces === look));
  if (existing.length + pending.length > MAX_REVISED_OUTFITS) {
    throw new Error(`A report can hold ${MAX_REVISED_OUTFITS} revised looks in total, and this one has ${existing.length}.`);
  }
  const used = new Set(existing.map(entry => entry.page.page_number));
  const free = Array.from({ length: MAX_REVISED_OUTFITS }, (_, index) => REVISED_OUTFIT_FIRST_PAGE + index).filter(page => !used.has(page));
  const createdAt = input.now ?? new Date().toISOString();
  const added = pending.map((look, index) => ({
    page: blankRevisedOutfitPage(data, free[index], look),
    replaces: look,
    round: input.round,
    created_at: createdAt,
  }));
  return { data: { ...data, revised_outfits: [...existing, ...added] }, added };
}

export function removeRevisedOutfit(data: StylistBlueprintReportData, pageNumber: number): StylistBlueprintReportData {
  return { ...data, revised_outfits: revisedOutfits(data).filter(entry => entry.page.page_number !== pageNumber) };
}

export function replaceRevisedOutfitPage(data: StylistBlueprintReportData, page: BlueprintPage): StylistBlueprintReportData {
  return {
    ...data,
    revised_outfits: revisedOutfits(data).map(entry => entry.page.page_number === page.page_number ? { ...entry, page } : entry),
  };
}

/**
 * The report as if this revised look stood in its original's place. The paste
 * parser, the outfit validator and the image prompt all address an outfit by
 * its page in the layout; this lets every one of them work on a revised look
 * without learning a second numbering scheme.
 */
export function withRevisedOutfitInPlace(data: StylistBlueprintReportData, entry: StylistRevisedOutfit) {
  const pageNumber = getStylistBlueprintOutfitStartPage(data) + entry.replaces - 1;
  return {
    pageNumber,
    data: { ...data, pages: data.pages.map(page => page.page_number === pageNumber ? { ...entry.page, page_number: pageNumber } : page) },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/** Throws on anything a stylist's browser should not be able to store. */
export function assertRevisedOutfits(value: unknown, data: Pick<StylistBlueprintReportData, 'version'>) {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new Error('Revised looks must be a list.');
  if (value.length > MAX_REVISED_OUTFITS) throw new Error(`A report can hold at most ${MAX_REVISED_OUTFITS} revised looks.`);
  const outfitCount = getStylistBlueprintOutfitCount(data);
  const numbers = new Set<number>();
  for (const entry of value) {
    if (!isRecord(entry) || !isRecord(entry.page)) throw new Error('A revised look is missing its page.');
    const page = entry.page;
    const pageNumber = Number(page.page_number);
    if (!isRevisedOutfitPageNumber(pageNumber) || numbers.has(pageNumber)) throw new Error('Revised look page numbers must be unique and in range.');
    numbers.add(pageNumber);
    if (page.page_type !== 'outfit' || typeof page.title !== 'string' || !Array.isArray(page.blocks)) throw new Error(`Revised look ${pageNumber} has invalid content.`);
    for (const block of page.blocks) {
      if (!isRecord(block)) throw new Error(`Revised look ${pageNumber} has an invalid block.`);
      for (const field of ['label', 'heading', 'body', 'reason']) {
        if (block[field] != null && typeof block[field] !== 'string') throw new Error(`Revised look ${pageNumber} has invalid ${field}.`);
      }
      if (block.items != null && !Array.isArray(block.items)) throw new Error(`Revised look ${pageNumber} has invalid items.`);
    }
    if (!Number.isInteger(entry.replaces) || (entry.replaces as number) < 1 || (entry.replaces as number) > outfitCount) throw new Error(`Revised look ${pageNumber} must name the look it replaces.`);
    if (!Number.isInteger(entry.round) || (entry.round as number) < 1) throw new Error(`Revised look ${pageNumber} has an invalid revision number.`);
    if (typeof entry.created_at !== 'string') throw new Error(`Revised look ${pageNumber} has an invalid date.`);
  }
}

/** Warnings for the studio and the publish check. Advisory, like every other readiness check. */
export function revisedOutfitIssues(data: Pick<StylistBlueprintReportData, 'revised_outfits'>, hasImage: (pageNumber: number) => boolean) {
  const issues: string[] = [];
  for (const entry of orderedRevisedOutfits(data)) {
    const label = `The revised look for Look ${entry.replaces}`;
    if (isBlankRevisedOutfit(entry)) issues.push(`${label} is still blank.`);
    else if (!hasImage(entry.page.page_number)) issues.push(`${label} has no image yet.`);
  }
  return issues;
}
