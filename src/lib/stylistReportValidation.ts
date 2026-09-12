import { getStylistBlueprintPageCount, isVersionedStylistBlueprintReportData } from './stylistBlueprintSchema.ts';
import type { StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

/** Drafts may be incomplete, but must remain safe to render and resume. */
export function assertStylistReportDraft(value: unknown): asserts value is StylistBlueprintReportData {
  if (!isVersionedStylistBlueprintReportData(value)) throw new Error('Invalid Blueprint report');
  const data = value as unknown as Record<string, unknown>;
  if (!isRecord(data.client) || typeof data.client.display_name !== 'string'
    || !isRecord(data.analysis) || !isRecord(data.classification)) throw new Error('Report client and analysis are required');
  for (const field of ['silhouette_profile', 'chromatic_family', 'facial_architecture', 'style_direction']) {
    if (typeof data.analysis[field] !== 'string') throw new Error(`Invalid analysis field: ${field}`);
  }
  const colour = data.classification.colour;
  if (!isRecord(colour) || !Array.isArray(colour.base_palette) || !Array.isArray(colour.accent_palette)) {
    throw new Error('Report colour palettes are required');
  }
  const count = getStylistBlueprintPageCount(value);
  const numbers = new Set<number>();
  for (const page of value.pages) {
    if (!isRecord(page) || !Number.isInteger(page.page_number) || page.page_number < 1 || page.page_number > count
      || numbers.has(page.page_number)) throw new Error('Report page numbers must be unique and within the report');
    numbers.add(page.page_number);
    if (typeof page.title !== 'string' || typeof page.page_type !== 'string' || !Array.isArray(page.blocks)) {
      throw new Error(`Page ${page.page_number} has invalid content`);
    }
    for (const block of page.blocks) {
      if (!isRecord(block)) throw new Error(`Page ${page.page_number} has an invalid block`);
      for (const field of ['label', 'heading', 'body', 'reason']) {
        if (block[field] != null && typeof block[field] !== 'string') throw new Error(`Page ${page.page_number} has invalid ${field}`);
      }
      if (block.items != null && !Array.isArray(block.items)) throw new Error(`Page ${page.page_number} has invalid items`);
    }
  }
  if (value.studio) {
    const { hidden_page_numbers: hidden, page_order: order } = value.studio;
    if (!Array.isArray(hidden) || hidden.some(n => !Number.isInteger(n) || n < 2 || n > count)) {
      throw new Error('Hidden pages must be valid page numbers; the cover must stay visible');
    }
    if (!Array.isArray(order) || order.length !== count || new Set(order).size !== count
      || order.some(n => !Number.isInteger(n) || n < 1 || n > count)) throw new Error('Page order must include every page once');
  }
}

export function assertStylistPageApprovals(value: unknown, count: number): asserts value is Record<string, boolean> {
  if (!isRecord(value) || Object.entries(value).some(([key, approved]) =>
    !/^p[1-9]\d*$/.test(key) || Number(key.slice(1)) > count || typeof approved !== 'boolean')) {
    throw new Error('Page approvals must contain valid page numbers and boolean values');
  }
}
