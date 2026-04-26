import type { ClassificationResult, ReportData } from './manReportGenerator';

export interface ManReportQaIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface ManReportQaResult {
  checkedAt: string;
  outfitCount: number;
  contextCounts: Record<string, number>;
  issues: ManReportQaIssue[];
}

interface ParsedQaOutfit {
  number: number;
  rawLabel: string;
  context: string;
  block: string;
  fields: Record<string, string>;
}

const EXPECTED_CONTEXTS = ['Formal', 'Smart Casual', 'Evening Wear', 'Relaxed Casual'] as const;
const EXPECTED_CONTEXT_COUNTS: Record<string, number> = {
  Formal: 4,
  'Smart Casual': 4,
  'Evening Wear': 4,
  'Relaxed Casual': 4,
};

const CONTEXT_ALIASES: Array<[RegExp, string]> = [
  [/\bformal\b/i, 'Formal'],
  [/\bsmart\s+casual\b/i, 'Smart Casual'],
  [/\bevening\b/i, 'Evening Wear'],
  [/\brelaxed\s+casual\b|\bcasual\b/i, 'Relaxed Casual'],
];

const FIELD_ALIASES: Record<string, string[]> = {
  top: ['TOP', 'Top'],
  layer: ['LAYER', 'Layer', 'Layer/Outerwear', 'Outerwear'],
  bottom: ['BOTTOM', 'Bottom'],
  footwear: ['FOOTWEAR', 'Footwear'],
  accessory: ['ACCESSORY', 'ACCESSORIES', 'Accessory', 'Accessories'],
  why: ['WHY IT WORKS FOR YOU', 'Why it works for you', 'Why it works', 'Occasion anchor'],
  fitNote: ['FIT NOTE', 'Fit note'],
  colourLogic: ['COLOUR LOGIC', 'COLOR LOGIC', 'Colour logic', 'Color logic'],
  shoppingTranslation: ['SHOPPING TRANSLATION', 'Shopping translation'],
  acceptableSubstitutes: ['ACCEPTABLE SUBSTITUTES', 'Acceptable substitutes'],
  doNotBuy: ['DO NOT BUY', 'Do not buy'],
};

const COMMON_COLOURS = [
  'black', 'white', 'ivory', 'cream', 'off-white', 'navy', 'charcoal', 'grey', 'gray',
  'stone', 'camel', 'tan', 'brown', 'chocolate', 'olive', 'khaki', 'rust', 'terracotta',
  'burgundy', 'wine', 'teal', 'emerald', 'cobalt', 'plum', 'sage', 'slate',
];

function issue(code: string, severity: ManReportQaIssue['severity'], message: string): ManReportQaIssue {
  return { code, severity, message };
}

function contextFromLabel(rawLabel: string, outfitNumber: number): string {
  const fromLabel = CONTEXT_ALIASES.find(([pattern]) => pattern.test(rawLabel))?.[1];
  if (fromLabel) return fromLabel;
  if (outfitNumber >= 1 && outfitNumber <= 4) return 'Formal';
  if (outfitNumber >= 5 && outfitNumber <= 8) return 'Smart Casual';
  if (outfitNumber >= 9 && outfitNumber <= 12) return 'Evening Wear';
  if (outfitNumber >= 13 && outfitNumber <= 16) return 'Relaxed Casual';
  return 'Unknown';
}

function extractField(block: string, labels: string[]): string {
  const labelPattern = labels
    .map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|');
  const nextLabelPattern = Object.values(FIELD_ALIASES)
    .flat()
    .map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|');

  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*[-•]?[ \\t]*\\*{0,2}(?:${labelPattern})\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2}(.+?)(?=\\n[ \\t]*[-•]?[ \\t]*\\*{0,2}(?:${nextLabelPattern})\\*{0,2}[ \\t]*:|\\n\\s*---|\\n\\s*(?:\\*\\*)?Outfit\\s+\\d+|\\n\\s*OUTFIT\\s+\\d+|$)`,
    'is',
  );

  return block.match(pattern)?.[1]?.replace(/\*{1,2}$/g, '').replace(/\n/g, ' ').trim() ?? '';
}

export function parseManReportOutfitsForQa(s4Text: string): ParsedQaOutfit[] {
  const blocks = s4Text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);

  return blocks
    .map(block => {
      const boldMatch = block.match(/\*\*Outfit\s+(\d+)\s*[—–-]\s*([^*\n]+)\*\*/i);
      const plainMatch = block.match(/^OUTFIT\s+(\d+)\s*[—–-]\s*(.+)/im);
      const header = boldMatch ?? plainMatch;
      if (!header) return null;

      const number = parseInt(header[1], 10);
      const rawLabel = header[2].replace(/\*+/g, '').trim();
      const fields: Record<string, string> = {};
      for (const [key, labels] of Object.entries(FIELD_ALIASES)) {
        fields[key] = extractField(block, labels);
      }

      return {
        number,
        rawLabel,
        context: contextFromLabel(rawLabel, number),
        block,
        fields,
      };
    })
    .filter((outfit): outfit is ParsedQaOutfit => !!outfit)
    .sort((a, b) => a.number - b.number);
}

function isHotClimate(classification: ClassificationResult): boolean {
  return /india|uae|middle\s*east|dubai|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/i
    .test(classification.client.location_region ?? '');
}

function findRepeatedDominantColours(outfits: ParsedQaOutfit[]): string[] {
  const counts: Record<string, number> = {};
  for (const outfit of outfits) {
    const searchable = [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom, outfit.fields.footwear].join(' ').toLowerCase();
    const firstColour = COMMON_COLOURS.find(colour => new RegExp(`\\b${colour}\\b`, 'i').test(searchable));
    if (firstColour) counts[firstColour] = (counts[firstColour] ?? 0) + 1;
  }
  return Object.entries(counts).filter(([, count]) => count > 4).map(([colour]) => colour);
}

export function validateManReportSection4(
  s4Text: string,
  classification: ClassificationResult,
): ManReportQaResult {
  const outfits = parseManReportOutfitsForQa(s4Text);
  const issues: ManReportQaIssue[] = [];
  const contextCounts = EXPECTED_CONTEXTS.reduce<Record<string, number>>((acc, context) => {
    acc[context] = 0;
    return acc;
  }, {});

  for (const outfit of outfits) {
    contextCounts[outfit.context] = (contextCounts[outfit.context] ?? 0) + 1;
  }

  if (outfits.length !== 16) {
    issues.push(issue('outfit_count', 'error', `Expected 16 parsed outfits, found ${outfits.length}.`));
  }

  for (const [context, expected] of Object.entries(EXPECTED_CONTEXT_COUNTS)) {
    if ((contextCounts[context] ?? 0) !== expected) {
      issues.push(issue('context_split', 'error', `${context} should have ${expected} outfits, found ${contextCounts[context] ?? 0}.`));
    }
  }

  const seenNumbers = new Set<number>();
  for (const outfit of outfits) {
    if (seenNumbers.has(outfit.number)) {
      issues.push(issue('duplicate_outfit_number', 'error', `Outfit ${outfit.number} appears more than once.`));
    }
    seenNumbers.add(outfit.number);

    if (!CONTEXT_ALIASES.some(([pattern]) => pattern.test(outfit.rawLabel))) {
      issues.push(issue('context_header', 'warning', `Outfit ${outfit.number} header does not explicitly name its context.`));
    }

    for (const field of ['top', 'layer', 'bottom', 'footwear']) {
      if (!outfit.fields[field]) {
        issues.push(issue('missing_required_field', 'error', `Outfit ${outfit.number} is missing ${field}.`));
      }
    }

    if (!outfit.fields.why && !(outfit.fields.fitNote && outfit.fields.colourLogic)) {
      issues.push(issue('missing_rationale', 'warning', `Outfit ${outfit.number} is missing a client-specific rationale.`));
    }

    for (const field of ['shoppingTranslation', 'acceptableSubstitutes', 'doNotBuy']) {
      if (!outfit.fields[field]) {
        issues.push(issue('missing_shopping_field', 'warning', `Outfit ${outfit.number} is missing ${field}.`));
      }
    }

    const fullText = outfit.block.toLowerCase();
    if (/\bskinny\s+(jeans|trousers|pants)\b|\bspray-on\b/.test(fullText)) {
      issues.push(issue('banned_skinny', 'error', `Outfit ${outfit.number} includes a banned skinny/spray-on cut.`));
    }

    if (/\bcropped\b|\bankle[-\s]?cut\b|\b7\/8\b/.test(fullText)) {
      issues.push(issue('cropped_trouser', 'warning', `Outfit ${outfit.number} mentions cropped or ankle-cut trousers; verify this is intentional and not for a short client.`));
    }

    if (/relaxed\s+casual/i.test(outfit.context) && /\bblazer\b/.test(fullText)) {
      issues.push(issue('relaxed_blazer', 'error', `Outfit ${outfit.number} uses a blazer in Relaxed Casual.`));
    }

    if (isHotClimate(classification) && /\bturtleneck\b|\bheavy\s+knit\b|\bwool\s+flannel\b|\bthick\s+tweed\b|\bvelvet\b/.test(fullText)) {
      issues.push(issue('hot_climate_fabric', 'error', `Outfit ${outfit.number} includes a hot-climate restricted garment or fabric.`));
    }
  }

  for (const colour of findRepeatedDominantColours(outfits)) {
    issues.push(issue('repeated_colour', 'warning', `${colour} appears to dominate more than 4 outfits; check colour variety.`));
  }

  return {
    checkedAt: new Date().toISOString(),
    outfitCount: outfits.length,
    contextCounts,
    issues,
  };
}

export function withManReportSection4Qa(reportData: ReportData): ReportData {
  return {
    ...reportData,
    qa: {
      ...reportData.qa,
      section4: validateManReportSection4(
        reportData.sections?.s4_outfits ?? '',
        reportData.classification,
      ),
    },
  };
}
