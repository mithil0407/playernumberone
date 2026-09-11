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

// --- Client-language checks -------------------------------------------------
// The structural checks above prove a page exists and is populated. These prove
// it is readable: they catch the abstract-title register, headline overflow, and
// duplicated fields that made earlier reports unusable for the client.

const ABSTRACT_LABEL_PATTERNS: RegExp[] = [
  /^(the\s+)?architecture\s+(for|of)\b/i,
  /^(the\s+)?language\s+of\b/i,
  /^(a\s+)?study\s+in\b/i,
  /^(the\s+)?art\s+of\b/i,
  /\bthesis\b/i,
  /\bdossier\b/i,
  /\bchromatic\b/i,
  /\bterritory\b/i,
  // "The Waist Axis" — the original pattern matched "axe"/"axes" but not the
  // singular "axis", so every axis-titled card slipped through.
  /\bax(is|es)\b/i,
  // Abstract-noun tails: "The Vertical Elongation Framework", "The Layering
  // System". The noun carries no information the client can act on.
  /\b(framework|methodology|paradigm|philosophy|doctrine|taxonomy|schema|construct|apparatus)\b/i,
  // Nominalised adjectives: "Side Slit Verticality", "Shoulder Angularity".
  /\b\w{4,}(ality|icity|ivity|ness of)\b/i,
  /\bpillar\b/i,
  /\bprescription\b(?!\s+(glass|frame|lens|lenses|eyewear|sunglass))/i,
  /\bdiagnos(is|tic)\b/i,
];

const TITLE_MAX_WORDS = 4;
const SUBTITLE_MAX_WORDS = 6;
const HEADING_MAX_WORDS = 6;

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function comparable(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function abstractLabel(value: string) {
  return ABSTRACT_LABEL_PATTERNS.some(pattern => pattern.test(value));
}

/** Schema keys leaking into client copy, e.g. "name: Wide leg - reason: ...". */
function leaksSchemaLabels(value: string) {
  return /\b(name|reason|guidance|body|heading|label|slot|piece|palette_role|colour_hex)\s*:/i.test(value);
}

function checkPageLanguage(page: BlueprintPage): StudioQualityIssue[] {
  const issues: StudioQualityIssue[] = [];
  const title = textOf(page.title);
  const subtitle = textOf(page.subtitle);

  if (title && words(title) > TITLE_MAX_WORDS) {
    issues.push({ level: 'warning', page: page.page_number, message: `Title is ${words(title)} words; it renders as a full-page headline. Keep it to ${TITLE_MAX_WORDS}.` });
  }
  if (title && abstractLabel(title)) {
    issues.push({ level: 'error', page: page.page_number, message: `Title "${title}" reads as an abstract label rather than a plain description.` });
  }
  if (subtitle && words(subtitle) > SUBTITLE_MAX_WORDS) {
    issues.push({ level: 'warning', page: page.page_number, message: `Subtitle is ${words(subtitle)} words; it renders at headline size next to the title.` });
  }
  if (subtitle && abstractLabel(subtitle)) {
    issues.push({ level: 'error', page: page.page_number, message: `Subtitle "${subtitle}" reads as an abstract label rather than a plain description.` });
  }
  if (subtitle && comparable(subtitle) === comparable(title)) {
    issues.push({ level: 'warning', page: page.page_number, message: 'Subtitle repeats the title.' });
  }

  const quote = textOf(page.pull_quote);
  if (quote && [title, subtitle].some(value => value && comparable(value) === comparable(quote))) {
    issues.push({ level: 'warning', page: page.page_number, message: 'Pull quote repeats the title or subtitle.' });
  }

  page.blocks.forEach((block, index) => {
    const heading = textOf(block.heading);
    const body = textOf(block.body);
    const reason = textOf(block.reason);
    const where = `Block ${index + 1}`;

    if (heading && words(heading) > HEADING_MAX_WORDS) {
      issues.push({ level: 'warning', page: page.page_number, message: `${where}: heading is ${words(heading)} words; card titles should be ${HEADING_MAX_WORDS} or fewer.` });
    }
    if (heading && abstractLabel(heading)) {
      issues.push({ level: 'warning', page: page.page_number, message: `${where}: heading "${heading}" reads as an abstract label.` });
    }
    if (body && reason && comparable(body) === comparable(reason)) {
      issues.push({ level: 'warning', page: page.page_number, message: `${where}: body and reason say the same thing, so the page prints it twice.` });
    }
    for (const [field, value] of [['body', body], ['reason', reason], ['heading', heading]] as const) {
      if (value && leaksSchemaLabels(value)) {
        issues.push({ level: 'error', page: page.page_number, message: `${where}: ${field} contains a raw field label ("name:", "reason:").` });
      }
    }
  });

  return issues;
}



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
  for (const page of data.pages) {
    issues.push(...checkPageLanguage(page));
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
