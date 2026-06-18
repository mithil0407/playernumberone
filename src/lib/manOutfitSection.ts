export interface ParsedManOutfit {
  number: number;
  occurrenceIndex: number;
  blockStart: number;
  identityKey: string;
  label: string;
  context: string;
  block: string;
  top: string;
  bottom: string;
  layer: string;
  footwear: string;
  accessories: string;
  fitNote: string;
  colourLogic: string;
  whyItWorks: string;
  shoppingTranslation: string;
  acceptableSubstitutes: string;
  doNotBuy: string;
}

const CONTEXT_ALIASES: Array<[RegExp, string]> = [
  [/\boffice\b|\bformal\b/i, 'Office / Formal'],
  [/\bsmart\s+casual\b/i, 'Smart Casual'],
  [/\bevening\b/i, 'Evening Wear'],
  [/\brelaxed\s+casual\b|\bcasual\b/i, 'Relaxed Casual'],
];

const KNOWN_CONTEXTS = new Set(['FORMAL', 'SMART CASUAL', 'EVENING WEAR', 'RELAXED CASUAL']);
const OUTFIT_HEADER_PATTERN = /(?:\*\*Outfit|OUTFIT)\s+(\d+)\s*[—–-][^\n]*/gi;

export function stripOutfitHex(text: string): string {
  return text.replace(/\s*\(#?[0-9A-Fa-f]{3,6}\)/g, '').trim();
}

export function toOutfitTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function inferOutfitContext(rawLabel: string, outfitNumber: number): string {
  const fromLabel = CONTEXT_ALIASES.find(([pattern]) => pattern.test(rawLabel))?.[1];
  if (fromLabel) return fromLabel;
  if (outfitNumber >= 1 && outfitNumber <= 6) return 'Office / Formal';
  if (outfitNumber >= 7 && outfitNumber <= 10) return 'Smart Casual';
  if (outfitNumber >= 11 && outfitNumber <= 15) return 'Evening Wear';
  if (outfitNumber >= 16 && outfitNumber <= 20) return 'Relaxed Casual';
  return 'Unknown';
}

export function getOutfitField(block: string, label: string): string {
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*[-•]?[ \\t]*\\*{0,2}${label}\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2}(.+?)\\*{0,2}(?=\\n[ \\t]*[-•]?[ \\t]*\\*{0,2}[A-Za-z]|\\n\\n|\\n\\*\\*Outfit|\\nOUTFIT|$)`,
    'is',
  );
  const raw = block.match(pattern)?.[1]?.replace(/\n/g, ' ').trim() ?? '—';
  return stripOutfitHex(raw);
}

function getOutfitHeaderMatches(s4Text: string): RegExpMatchArray[] {
  return Array.from(s4Text.matchAll(OUTFIT_HEADER_PATTERN));
}

export function extractOutfitBlock(s4Text: string, outfitNumber: number): string | null {
  const matches = getOutfitHeaderMatches(s4Text);
  const matchIndex = matches.findIndex(match => Number(match[1]) === outfitNumber);
  if (matchIndex === -1) return null;

  const start = matches[matchIndex].index ?? 0;
  const end = matches[matchIndex + 1]?.index ?? s4Text.length;
  return s4Text.slice(start, end).trim();
}

export function replaceOutfitBlock(s4Text: string, outfitNumber: number, newBlock: string): string | null {
  const matches = getOutfitHeaderMatches(s4Text);
  const matchIndex = matches.findIndex(match => Number(match[1]) === outfitNumber);
  if (matchIndex === -1) return null;

  const start = matches[matchIndex].index ?? 0;
  const end = matches[matchIndex + 1]?.index ?? s4Text.length;
  return `${s4Text.slice(0, start)}${newBlock.trimEnd()}\n\n${s4Text.slice(end).trimStart()}`;
}

export function hashOutfitBlock(block: string): string {
  const text = block.trim();
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function parseManOutfitBlock(
  block: string,
  meta?: { occurrenceIndex?: number; blockStart?: number },
): ParsedManOutfit | null {
  const boldMatch = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
  const plainMatch = block.match(/^OUTFIT\s+(\d+)\s*[—–-]\s*(.+)/im);
  const header = boldMatch ?? plainMatch;
  if (!header) return null;

  const number = parseInt(header[1], 10);
  const label = header[2].replace(/\*+/g, '').trim();
  const occurrenceIndex = meta?.occurrenceIndex ?? 0;
  const blockStart = meta?.blockStart ?? 0;

  return {
    number,
    occurrenceIndex,
    blockStart,
    identityKey: `outfit-${number}-at-${blockStart}`,
    label,
    context: inferOutfitContext(label, number),
    block: block.trim(),
    top: getOutfitField(block, 'Top'),
    bottom: getOutfitField(block, 'Bottom'),
    layer: getOutfitField(block, 'Layer(?:\\/Outerwear)?(?:\\/Layer)?'),
    footwear: getOutfitField(block, 'Footwear'),
    accessories: getOutfitField(block, 'Accessor(?:y|ies)'),
    fitNote: getOutfitField(block, 'Fit note'),
    colourLogic: getOutfitField(block, 'Colour logic'),
    whyItWorks: (() => {
      const occasion = getOutfitField(block, 'Occasion anchor');
      return occasion !== '—' ? occasion : getOutfitField(block, 'Why it works(?:\\s+for\\s+you)?');
    })(),
    shoppingTranslation: getOutfitField(block, 'Shopping translation'),
    acceptableSubstitutes: getOutfitField(block, 'Acceptable substitutes'),
    doNotBuy: getOutfitField(block, 'Do not buy'),
  };
}

export function parseManOutfitsFromSection(s4Text: string): ParsedManOutfit[] {
  const matches = getOutfitHeaderMatches(s4Text);
  return matches
    .map((match, index) => {
      const start = match.index ?? 0;
      const end = matches[index + 1]?.index ?? s4Text.length;
      return parseManOutfitBlock(s4Text.slice(start, end).trim(), {
        occurrenceIndex: index,
        blockStart: start,
      });
    })
    .filter((outfit): outfit is ParsedManOutfit => !!outfit);
}

export function getDuplicateManOutfitNumbers(s4Text: string): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const outfit of parseManOutfitsFromSection(s4Text)) {
    if (seen.has(outfit.number)) duplicates.add(outfit.number);
    seen.add(outfit.number);
  }
  return [...duplicates].sort((a, b) => a - b);
}

export function hasSequentialManOutfitNumbers(s4Text: string): boolean {
  const outfits = parseManOutfitsFromSection(s4Text);
  return outfits.every((outfit, index) => outfit.number === index + 1);
}

function renumberOutfitHeaderLine(headerLine: string, nextNumber: number): string {
  return headerLine.replace(/((?:\*\*Outfit|OUTFIT)\s+)\d+(\s*[—–-])/i, `$1${nextNumber}$2`);
}

export function normaliseSequentialManOutfitNumbers(s4Text: string): string {
  const matches = getOutfitHeaderMatches(s4Text);
  if (matches.length === 0) return s4Text;

  let changed = false;
  let result = '';

  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? s4Text.length;
    const expectedNumber = index + 1;
    const currentNumber = Number(match[1]);

    if (index === 0) result += s4Text.slice(0, start);

    const block = s4Text.slice(start, end);
    if (currentNumber === expectedNumber) {
      result += block;
      continue;
    }

    const newlineIndex = block.search(/\r?\n/);
    const headerLine = newlineIndex === -1 ? block : block.slice(0, newlineIndex);
    const rest = newlineIndex === -1 ? '' : block.slice(newlineIndex);
    result += `${renumberOutfitHeaderLine(headerLine, expectedNumber)}${rest}`;
    changed = true;
  }

  return changed ? result : s4Text;
}

export function normaliseOutfitHeader(block: string, outfitNumber: number, context: string): string {
  const cleanContext = KNOWN_CONTEXTS.has(context.toUpperCase()) ? context.toUpperCase() : context;
  const headerPattern = /^(?:\*\*Outfit\s+\d+\s*[—–-]\s*[^*\n]+\*\*|OUTFIT\s+\d+\s*[—–-]\s*.+)$/im;
  const header = `OUTFIT ${outfitNumber} — ${cleanContext.toUpperCase()}`;
  if (headerPattern.test(block)) return block.replace(headerPattern, header).trim();
  return `${header}\n${block.trim()}`;
}
