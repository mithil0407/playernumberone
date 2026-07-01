import { supabaseAdmin } from './supabase';
import {
  normaliseStylistOutfitSlots,
  stylistOutfitCompletenessScore,
  stylistOutfitSignature,
  type ParsedStylistOutfit,
  type ParsedStylistOutfitSlot,
} from './stylistOutfitLibraryParser';
import {
  getStylistBlueprintCapsulePageRanges,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
} from './stylistBlueprintSchema';
import type { BlueprintBlock, BlueprintPage, StylistBlueprintReportData } from './stylistBlueprintGenerator';

type CapsuleName = ParsedStylistOutfit['capsule'];
const CAPSULES: CapsuleName[] = ['Professional', 'Social', 'Everyday', 'Occasion'];

export interface LearnedOutfitPayload {
  title: string;
  capsule: CapsuleName;
  fields: Array<{ label: string; value: string }>;
  normalised_slots: ParsedStylistOutfitSlot[];
  signature: string;
  outfit_snapshot: Record<string, unknown>;
}

interface LearnedOutfitRow {
  id: string;
  status: string;
  source: string;
  source_report_id: string | null;
  source_page_number: number | null;
  title: string;
  capsule: CapsuleName;
  fields: unknown;
  normalised_slots: unknown;
  signature: string;
  outfit_snapshot: unknown;
  like_count: number | null;
  dislike_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface NegativeOutfitSignal {
  signature: string;
  reason: string;
  title?: string;
  capsule?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function inferCapsuleFromPage(page: BlueprintPage, reportData?: StylistBlueprintReportData): CapsuleName {
  const visible = `${page.subtitle ?? ''} ${page.title ?? ''}`.toLowerCase();
  if (/professional|work|office|client|business/.test(visible)) return 'Professional';
  if (/social|dinner|date|brunch|gallery|party/.test(visible)) return 'Social';
  if (/occasion|event|wedding|festive|cocktail|evening/.test(visible)) return 'Occasion';
  if (/everyday|casual|weekend|errand|day/.test(visible)) return 'Everyday';

  if (reportData) {
    const ranges = getStylistBlueprintCapsulePageRanges(reportData);
    const matchIndex = ranges.findIndex(range => page.page_number >= range.firstPage && page.page_number <= range.lastPage);
    if (matchIndex >= 0) return CAPSULES[matchIndex] ?? 'Everyday';
  }

  return 'Everyday';
}

function formulaBlocks(page: BlueprintPage): BlueprintBlock[] {
  const withItems = page.blocks.filter(block => Array.isArray(block.items) && block.items.length);
  const formula = withItems.filter(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  return formula.length ? formula : withItems;
}

function extractFieldsFromPage(page: BlueprintPage): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();

  for (const block of formulaBlocks(page)) {
    for (const rawItem of block.items ?? []) {
      const item = asRecord(rawItem);
      const label = asString(item.slot) || asString(item.category) || asString(item.label) || asString(item.name);
      const value = asString(item.piece) || asString(item.guidance) || asString(item.body) || asString(item.name);
      if (!label || !value) continue;
      const key = `${label}:${value}`.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      fields.push({ label, value });
    }
  }

  if (!fields.length && page.title) {
    fields.push({ label: 'Formula', value: page.title });
  }

  return fields;
}

function normaliseStoredSlots(value: unknown): ParsedStylistOutfitSlot[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    const record = asRecord(item);
    const slot = asString(record.slot);
    const piece = asString(record.piece);
    if (!slot || !piece) return null;
    const role = asString(record.role);
    return {
      slot,
      piece,
      source_label: asString(record.source_label, slot),
      role: ['base', 'structure', 'finish', 'detail'].includes(role)
        ? role as ParsedStylistOutfitSlot['role']
        : 'detail',
    };
  }).filter((slot): slot is ParsedStylistOutfitSlot => Boolean(slot));
}

function normaliseStoredFields(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    const record = asRecord(item);
    const label = asString(record.label);
    const fieldValue = asString(record.value);
    return label && fieldValue ? { label, value: fieldValue } : null;
  }).filter((field): field is { label: string; value: string } => Boolean(field));
}

export function buildLearnedOutfitPayload(
  page: BlueprintPage,
  reportData?: StylistBlueprintReportData,
): LearnedOutfitPayload {
  const capsule = inferCapsuleFromPage(page, reportData);
  const fields = extractFieldsFromPage(page);
  const normalised_slots = normaliseStylistOutfitSlots(fields);
  const signature = stylistOutfitSignature(normalised_slots) || fields
    .map(field => `${field.label}:${field.value}`)
    .join('|')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: asString(page.title, `Outfit ${page.page_number}`),
    capsule,
    fields,
    normalised_slots,
    signature,
    outfit_snapshot: {
      page_number: page.page_number,
      page_type: page.page_type,
      title: page.title,
      subtitle: page.subtitle,
      blocks: page.blocks,
      palette_used: page.palette_used,
      library_refs: page.library_refs,
    },
  };
}

export async function loadLearnedStylistOutfits(limit = 80): Promise<ParsedStylistOutfit[]> {
  const { data, error } = await supabaseAdmin
    .from('stylist_outfit_library_entries')
    .select('id,status,source,source_report_id,source_page_number,title,capsule,fields,normalised_slots,signature,outfit_snapshot,like_count,dislike_count,created_at,updated_at')
    .eq('status', 'active')
    .in('source', ['manual', 'import', 'system'])
    .order('like_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[stylist outfit learning] failed to load learned outfits:', error.message);
    return [];
  }

  return ((data ?? []) as LearnedOutfitRow[]).map(row => {
    const fields = normaliseStoredFields(row.fields);
    const normalisedSlots = normaliseStoredSlots(row.normalised_slots);
    return {
      id: `learned-${row.id}`,
      title: row.title,
      source: 'learned',
      capsule: row.capsule,
      fields,
      normalised_slots: normalisedSlots,
      completeness_score: stylistOutfitCompletenessScore(normalisedSlots),
      signature: row.signature,
      notes: [
        `Admin-approved learned outfit. Likes: ${row.like_count ?? 1}. Keep its formula relationships, then adapt colour, coverage, fabric weight, formality, and fit to the current client.`,
      ],
    };
  });
}

export async function loadStylistOutfitNegativeSignals(limit = 50): Promise<NegativeOutfitSignal[]> {
  const { data, error } = await supabaseAdmin
    .from('stylist_outfit_feedback')
    .select('signature,reason,outfit_snapshot,created_at')
    .eq('vote', 'dislike')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[stylist outfit learning] failed to load negative outfit feedback:', error.message);
    return [];
  }

  return ((data ?? []) as Array<{ signature: string; reason: string | null; outfit_snapshot: unknown }>).map(row => {
    const snapshot = asRecord(row.outfit_snapshot);
    return {
      signature: row.signature,
      reason: asString(row.reason, 'Admin disliked this outfit formula. Avoid near-duplicates.'),
      title: asString(snapshot.title),
      capsule: asString(snapshot.subtitle),
    };
  }).filter(signal => Boolean(signal.signature));
}

export function negativeSignalsPrompt(signals: NegativeOutfitSignal[]): string {
  if (!signals.length) return 'No admin dislike signals yet.';

  return signals.slice(0, 16).map((signal, index) => {
    const title = signal.title ? ` "${signal.title}"` : '';
    const capsule = signal.capsule ? ` (${signal.capsule})` : '';
    return `${index + 1}. Avoid formula signature${title}${capsule}: ${signal.reason}`;
  }).join('\n');
}

export function isOutfitPageNumber(pageNumber: number, reportData: StylistBlueprintReportData): boolean {
  return pageNumber >= getStylistBlueprintOutfitStartPage(reportData) && pageNumber <= getStylistBlueprintOutfitEndPage(reportData);
}
