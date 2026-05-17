export interface ParsedManOutfit {
  number: number;
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

export function extractOutfitBlock(s4Text: string, outfitNumber: number): string | null {
  const headerPattern = /(?:\*\*Outfit|OUTFIT)\s+(\d+)\s*[—–-][^\n]*/gi;
  const matches = Array.from(s4Text.matchAll(headerPattern));
  const matchIndex = matches.findIndex(match => Number(match[1]) === outfitNumber);
  if (matchIndex === -1) return null;

  const start = matches[matchIndex].index ?? 0;
  const end = matches[matchIndex + 1]?.index ?? s4Text.length;
  return s4Text.slice(start, end).trim();
}

export function replaceOutfitBlock(s4Text: string, outfitNumber: number, newBlock: string): string | null {
  const headerPattern = /(?:\*\*Outfit|OUTFIT)\s+(\d+)\s*[—–-][^\n]*/gi;
  const matches = Array.from(s4Text.matchAll(headerPattern));
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

export function parseManOutfitBlock(block: string): ParsedManOutfit | null {
  const boldMatch = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
  const plainMatch = block.match(/^OUTFIT\s+(\d+)\s*[—–-]\s*(.+)/im);
  const header = boldMatch ?? plainMatch;
  if (!header) return null;

  const number = parseInt(header[1], 10);
  const label = header[2].replace(/\*+/g, '').trim();

  return {
    number,
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
  const blocks = s4Text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);
  return blocks
    .map(parseManOutfitBlock)
    .filter((outfit): outfit is ParsedManOutfit => !!outfit)
    .sort((a, b) => a.number - b.number);
}

export function normaliseOutfitHeader(block: string, outfitNumber: number, context: string): string {
  const cleanContext = KNOWN_CONTEXTS.has(context.toUpperCase()) ? context.toUpperCase() : context;
  const headerPattern = /^(?:\*\*Outfit\s+\d+\s*[—–-]\s*[^*\n]+\*\*|OUTFIT\s+\d+\s*[—–-]\s*.+)$/im;
  const header = `OUTFIT ${outfitNumber} — ${cleanContext.toUpperCase()}`;
  if (headerPattern.test(block)) return block.replace(headerPattern, header).trim();
  return `${header}\n${block.trim()}`;
}
