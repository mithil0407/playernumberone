import type { BlueprintBlock, BlueprintColourUse, BlueprintPage, StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';
import { getStylistBlueprintOutfitEndPage, getStylistBlueprintOutfitStartPage, getStylistBlueprintPageCount } from './stylistBlueprintSchema.ts';

type RecordValue = Record<string, unknown>;

function recordOf(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function outfitPageToDraft(page: BlueprintPage): string {
  const formula = page.blocks.find(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const formulaLines = (formula?.items ?? []).map((raw, index) => {
    const item = recordOf(raw);
    return `- ${textOf(item.slot) || `Piece ${index + 1}`} | ${textOf(item.piece) || textOf(item.name)} | ${textOf(item.colour_name)} | ${textOf(item.colour_hex)} | ${textOf(item.palette_role)} | ${textOf(item.structural_notes) || textOf(item.guidance)}`;
  });
  const why = page.blocks.find(block => /why/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const move = page.blocks.find(block => /role breakdown|styling move|one move/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const avoid = page.blocks.find(block => /do not buy|avoid/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  return [
    `Title: ${page.title}`,
    `Capsule: ${page.subtitle ?? ''}`,
    'Formula:',
    ...(formulaLines.length ? formulaLines : ['- Top |  |  |  | lead | ', '- Bottom |  |  |  | support | ', '- Footwear |  |  |  | ground | ', '- Accessory |  |  |  | accent | ']),
    `Why it works: ${why?.body ?? why?.reason ?? ''}`,
    `Styling move: ${move?.body ?? ''}`,
    `Do not buy: ${avoid?.body ?? ''}`,
  ].join('\n');
}

function lineValue(lines: string[], label: string) {
  const prefix = `${label.toLowerCase()}:`;
  return lines.find(line => line.toLowerCase().startsWith(prefix))?.slice(prefix.length).trim() ?? '';
}

export function formatOutfitDraft(draft: string, existingPage: BlueprintPage): BlueprintPage {
  const lines = draft.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const formulaIndex = lines.findIndex(line => /^formula\s*:/i.test(line));
  const formulaEnd = lines.findIndex((line, index) => index > formulaIndex && /^(why it works|styling move|do not buy)\s*:/i.test(line));
  const formulaLines = formulaIndex >= 0
    ? lines.slice(formulaIndex + 1, formulaEnd >= 0 ? formulaEnd : lines.length).filter(line => /^[-•]/.test(line))
    : [];
  const palette = new Map<string, BlueprintColourUse>();
  const items = formulaLines.map((line, index) => {
    const [slot, piece, colourName, colourHex, roleRaw, notes] = line.replace(/^[-•]\s*/, '').split('|').map(value => value.trim());
    const role = ['lead', 'support', 'ground', 'accent'].includes(roleRaw) ? roleRaw as BlueprintColourUse['role'] : index === 0 ? 'lead' : 'support';
    if (/^#[0-9a-f]{6}$/i.test(colourHex)) palette.set(colourHex.toUpperCase(), { name: colourName || 'Palette colour', hex: colourHex.toUpperCase(), role });
    return {
      slot: slot || `Piece ${index + 1}`,
      piece: piece || 'Add garment or accessory',
      colour_name: colourName || undefined,
      colour_hex: /^#[0-9a-f]{6}$/i.test(colourHex) ? colourHex.toUpperCase() : undefined,
      palette_role: role,
      structural_notes: notes || '',
    };
  });
  const existingFormula = existingPage.blocks.find(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  const structuredBlocks: BlueprintBlock[] = [
    { ...existingFormula, label: existingFormula?.label || 'Formula', heading: existingFormula?.heading || 'Complete outfit formula', items: items.length ? items : existingFormula?.items },
    { label: 'Why it works', heading: 'Personal styling logic', body: lineValue(lines, 'Why it works') },
    { label: 'Styling move', heading: 'The finishing move', body: lineValue(lines, 'Styling move') },
    { label: 'Do not buy', heading: 'The version that breaks it', body: lineValue(lines, 'Do not buy') },
  ];
  return {
    ...existingPage,
    title: lineValue(lines, 'Title') || existingPage.title,
    subtitle: lineValue(lines, 'Capsule') || existingPage.subtitle,
    blocks: structuredBlocks,
    palette_used: palette.size ? [...palette.values()] : existingPage.palette_used,
  };
}

export function moveStudioPage(data: StylistBlueprintReportData, pageNumber: number, direction: -1 | 1): StylistBlueprintReportData {
  const pageCount = getStylistBlueprintPageCount(data);
  const order = data.studio?.page_order?.length === pageCount
    ? [...data.studio.page_order]
    : Array.from({ length: pageCount }, (_, index) => index + 1);
  const from = order.indexOf(pageNumber);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return data;
  [order[from], order[to]] = [order[to], order[from]];
  return { ...data, studio: { analysis_confirmed: false, hidden_page_numbers: [], ...data.studio, page_order: order } };
}

export type StudioQualityIssue = { level: 'error' | 'warning'; page?: number; message: string };

export function checkStudioReportQuality(data: StylistBlueprintReportData): StudioQualityIssue[] {
  const issues: StudioQualityIssue[] = [];
  if (!data.studio?.analysis_confirmed) issues.push({ level: 'error', message: 'Confirm the body, colour and face analysis before delivery.' });
  const pageNumbers = new Set(data.pages.map(page => page.page_number));
  for (let page = 1; page <= getStylistBlueprintPageCount(data); page += 1) {
    if (!pageNumbers.has(page)) issues.push({ level: 'error', page, message: `Page ${page} is missing.` });
  }
  for (const page of data.pages) {
    if (!page.title.trim()) issues.push({ level: 'error', page: page.page_number, message: 'Page title is empty.' });
    if (page.page_number !== 1 && !page.blocks.length) issues.push({ level: 'warning', page: page.page_number, message: 'Page has no content blocks.' });
    if (page.blocks.some(block => /\b(?:lorem ipsum|todo|tbd|placeholder)\b/i.test(JSON.stringify(block)))) {
      issues.push({ level: 'error', page: page.page_number, message: 'Placeholder copy remains on this page.' });
    }
  }
  const outfitStart = getStylistBlueprintOutfitStartPage(data);
  const outfitEnd = getStylistBlueprintOutfitEndPage(data);
  const signatures = new Map<string, number>();
  for (const page of data.pages.filter(item => item.page_number >= outfitStart && item.page_number <= outfitEnd)) {
    const pieces = page.blocks.flatMap(block => block.items ?? []).map(item => textOf(recordOf(item).piece).toLowerCase()).filter(Boolean);
    if (pieces.length < 4) issues.push({ level: 'error', page: page.page_number, message: 'Outfit needs at least four structured pieces.' });
    const signature = pieces.join('|');
    const duplicate = signatures.get(signature);
    if (signature && duplicate) issues.push({ level: 'warning', page: page.page_number, message: `Outfit formula duplicates page ${duplicate}.` });
    if (signature) signatures.set(signature, page.page_number);
  }
  return issues;
}
