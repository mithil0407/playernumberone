import { readFileSync } from 'fs';
import { join } from 'path';

export interface ParsedStylistOutfit {
  id: string;
  title: string;
  source: 'women' | 'root' | 'curated' | 'learned';
  capsule: 'Professional' | 'Social' | 'Everyday' | 'Occasion';
  fields: Array<{ label: string; value: string }>;
  normalised_slots: ParsedStylistOutfitSlot[];
  completeness_score: number;
  signature: string;
  notes: string[];
}

export interface ParsedStylistOutfitSlot {
  slot: string;
  piece: string;
  source_label: string;
  role: 'base' | 'structure' | 'finish' | 'detail';
}

const LABEL_ALIASES: Record<string, string> = {
  accessory: 'Accessories',
  accessories: 'Accessories',
  bag: 'Bag',
  base: 'Base Layer',
  'base layer': 'Base Layer',
  belt: 'Waist Detail',
  bottom: 'Bottom',
  bottoms: 'Bottom',
  dress: 'Dress',
  footwear: 'Footwear',
  handbag: 'Bag',
  hairstyle: 'Hairstyle',
  'inner top': 'Top',
  jewelry: 'Jewellery',
  jewellery: 'Jewellery',
  layer: 'Outerwear',
  'layering piece': 'Outerwear',
  lazer: 'Outerwear',
  neckline: 'Neckline',
  op: 'Top',
  outfit: 'Outfit',
  outerwear: 'Outerwear',
  'pattern detail': 'Pattern Detail',
  'statement piece': 'Statement Piece',
  shoes: 'Footwear',
  shoe: 'Footwear',
  'styling line': 'Styling Line',
  top: 'Top',
  'top inner': 'Base Layer',
  waist: 'Waist Detail',
  'waist detail': 'Waist Detail',
  'waist styling': 'Waist Detail',
};

const FIELD_PRIORITY = [
  'Outfit',
  'Dress',
  'Top',
  'Base Layer',
  'Outerwear',
  'Bottom',
  'Waist Detail',
  'Pattern Detail',
  'Footwear',
  'Bag',
  'Jewellery',
  'Accessories',
  'Statement Piece',
  'Neckline',
  'Hairstyle',
  'Styling Line',
  'Formula',
];

const INLINE_LABELS = [
  'TOP INNER',
  'BASE LAYER',
  'STYLING LINE',
  'PATTERN DETAIL',
  'STATEMENT PIECE',
  'WAIST DETAIL',
  'INNER TOP',
  'ACCESSORIES',
  'ACCESSORY',
  'OUTERWEAR',
  'FOOTWEAR',
  'JEWELLERY',
  'JEWELRY',
  'HAIRSTYLE',
  'NECKLINE',
  'BOTTOMS',
  'BOTTOM',
  'DRESS',
  'LAYER',
  'SHOES',
  'SHOE',
  'BELT',
  'BAG',
  'TOP',
];

const INLINE_LABEL_PATTERN = new RegExp(`(?:^|\\s)(${INLINE_LABELS.map(label => label.replace(/\s+/g, '\\s+')).join('|')}):\\s*`, 'gi');

function readWomenLibraryFile(): string {
  try {
    return readFileSync(join(process.cwd(), 'outfitlibrarywomen.md'), 'utf-8');
  } catch {
    return '';
  }
}

function readUserLibraryFile(): string {
  try {
    return readFileSync(join(process.cwd(), 'stylistoutfitlibrary.md'), 'utf-8');
  } catch {
    return '';
  }
}

function readCuratedLibraryFile(): string {
  try {
    return readFileSync(join(process.cwd(), 'src/lib/stylistOutfitLibrary.md'), 'utf-8');
  } catch {
    return '';
  }
}

function cleanText(value: string): string {
  return value
    .replace(/\\([_*+])/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/\s*\.\.?\s*image\s+(?:should\s+be\s+)?(?:in\s+)?(?:clear|hd)(?:\s+and\s+(?:clear|hd))?(?:\s+and\s+(?:clear|hd))?/gi, '')
    .replace(/\s*\bimage\s+(?:should\s+be\s+)?(?:in\s+)?(?:clear|hd)(?:\s+and\s+(?:clear|hd))?(?:\s+and\s+(?:clear|hd))?/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

function splitRawOutfits(raw: string): string[] {
  return raw
    .split(/(?:\\_){20,}|_{20,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normaliseLabel(rawLabel: string): string {
  const cleaned = cleanText(rawLabel).toLowerCase();
  return LABEL_ALIASES[cleaned] ?? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferSlotFromText(label: string, value: string): string {
  if ([
    'Outfit',
    'Dress',
    'Top',
    'Base Layer',
    'Outerwear',
    'Bottom',
    'Waist Detail',
    'Pattern Detail',
    'Footwear',
    'Bag',
    'Jewellery',
    'Accessories',
    'Statement Piece',
    'Neckline',
    'Hairstyle',
    'Styling Line',
    'Formula',
  ].includes(label)) {
    return label;
  }

  const text = `${label} ${value}`.toLowerCase();
  if (/dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble/.test(text)) return 'Dress';
  if (/trouser|pant|jean|skirt|palazzo|bottom|legging/.test(text)) return 'Bottom';
  if (/shoe|sandal|heel|flat|sneaker|loafer|pump|mule|footwear|jutti|wedge|espadrille/.test(text)) return 'Footwear';
  if (/bag|tote|clutch|crossbody|handbag|shoulder bag|baguette/.test(text)) return 'Bag';
  if (/jewel|earring|necklace|bracelet|watch|bangle|accessor|sunglass|scarf/.test(text)) return 'Jewellery';
  if (/blazer|jacket|cardigan|vest|coat|outerwear|layer|overshirt|dupatta|bomber/.test(text)) return 'Outerwear';
  if (/belt|waist|tie/.test(text)) return 'Waist Detail';
  if (/top|blouse|shirt|tee|t-shirt|knit|camisole|tank|base layer/.test(text)) return 'Top';
  if (label === 'Outfit' || label === 'Formula') return label;
  return label;
}

function slotRole(slot: string): ParsedStylistOutfitSlot['role'] {
  if (/dress|top|base|bottom|outfit|formula/i.test(slot)) return 'base';
  if (/outerwear|waist/i.test(slot)) return 'structure';
  if (/footwear|bag|jewel|accessor/i.test(slot)) return 'finish';
  return 'detail';
}

export function normaliseStylistOutfitSlots(fields: Array<{ label: string; value: string }>): ParsedStylistOutfitSlot[] {
  const slots: ParsedStylistOutfitSlot[] = [];
  const seen = new Set<string>();

  for (const field of fields) {
    const slot = inferSlotFromText(field.label, field.value);
    const key = `${slot}:${field.value}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push({
      slot,
      piece: field.value,
      source_label: field.label,
      role: slotRole(slot),
    });
  }

  return slots;
}

export function stylistOutfitSignature(slots: ParsedStylistOutfitSlot[]) {
  return slots
    .filter(slot => /dress|top|base|outerwear|bottom|footwear|bag|jewel|accessor|waist/i.test(slot.slot))
    .map(slot => `${slot.slot}:${slot.piece}`.toLowerCase().replace(/\b(black|white|ivory|cream|navy|blue|grey|gray|brown|tan|taupe|camel|cognac|espresso|cocoa|chocolate|beige|olive|green|burgundy|maroon|wine|red|pink|blush|fuchsia|mustard|yellow|gold|silver)\b/g, '').replace(/\s+/g, ' ').trim())
    .join('|');
}

export function stylistOutfitCompletenessScore(slots: ParsedStylistOutfitSlot[]): number {
  const text = slots.map(slot => `${slot.slot} ${slot.piece}`).join(' ').toLowerCase();
  const hasOnePiece = /\b(dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)\b/.test(text);
  const hasTop = /\b(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|base layer)\b/.test(text) || slots.some(slot => /top|base layer/i.test(slot.slot));
  const hasBottom = /\b(bottom|trouser|pant|jean|skirt|palazzo|legging)\b/.test(text) || slots.some(slot => /bottom/i.test(slot.slot));
  const hasFootwear = /\b(footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule|jutti|wedge|espadrille)\b/.test(text);
  const hasBag = /\b(bag|tote|clutch|crossbody|handbag|shoulder bag|baguette)\b/.test(text);
  const hasAccessory = /\b(jewel|earring|necklace|bracelet|watch|bangle|accessor|sunglass|scarf|belt)\b/.test(text);
  const hasStructure = /\b(blazer|jacket|cardigan|vest|coat|outerwear|layer|overshirt|belt|waist|tie)\b/.test(text);
  const hasDetail = slots.length >= 5;

  return [
    hasOnePiece || (hasTop && hasBottom),
    hasFootwear,
    hasBag,
    hasAccessory,
    hasStructure,
    hasDetail,
  ].filter(Boolean).length;
}

function outfitHasCompleteBase(slots: ParsedStylistOutfitSlot[]): boolean {
  const text = slots.map(slot => `${slot.slot} ${slot.piece}`).join(' ').toLowerCase();
  const hasOnePiece = /\b(dress|jumpsuit|saree|sari|kurta|tunic|co-ord|coord|set|ensemble)\b/.test(text);
  const hasTop = /\b(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|base layer)\b/.test(text) || slots.some(slot => /top|base layer/i.test(slot.slot));
  const hasBottom = /\b(bottom|trouser|pant|jean|skirt|palazzo|legging)\b/.test(text) || slots.some(slot => /bottom/i.test(slot.slot));
  const hasFootwear = /\b(footwear|shoe|sandal|heel|flat|sneaker|loafer|pump|mule|jutti|wedge|espadrille|boot)\b/.test(text);
  const hasBagOrAccessory = /\b(bag|tote|clutch|crossbody|handbag|shoulder bag|baguette|jewel|earring|necklace|bracelet|watch|bangle|accessor|sunglass|scarf|belt)\b/.test(text);

  return (hasOnePiece || (hasTop && hasBottom)) && hasFootwear && hasBagOrAccessory;
}

function outfitHasAmbiguousShoppingLanguage(outfit: Pick<ParsedStylistOutfit, 'fields'>): boolean {
  const text = outfit.fields.map(field => field.value).join(' ').toLowerCase();
  return (
    /\b(any|or|\/)\b[^.]{0,28}\b(shade|colour|color|loafers|sneakers|heels|boots|flats|sandals|trench|denim jacket|top|blouse|dress|pants|trousers)\b/.test(text) ||
    /\btransparent\b/.test(text) ||
    /\bimage\s+(?:should|in|clear|hd)\b/.test(text)
  );
}

export function isUsableStylistOutfitAnchor(outfit: ParsedStylistOutfit): boolean {
  return outfit.completeness_score >= 5 &&
    outfit.normalised_slots.length >= 4 &&
    outfitHasCompleteBase(outfit.normalised_slots) &&
    !outfitHasAmbiguousShoppingLanguage(outfit);
}

function parseEntry(
  rawEntry: string,
  index: number,
  source: ParsedStylistOutfit['source'],
  explicitTitle?: string,
  capsuleOverride?: ParsedStylistOutfit['capsule'],
): ParsedStylistOutfit | null {
  const lines = rawEntry
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean);

  if (!lines.length) return null;

  const fields: Array<{ label: string; value: string }> = [];
  const notes: string[] = [];

  for (const line of lines) {
    const inlineFields = splitInlineLabelledFields(line);
    if (inlineFields.length) {
      fields.push(...inlineFields);
      continue;
    }

    const match = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (match) {
      const label = normaliseLabel(match[1]);
      const value = cleanText(match[2]);
      if (value) fields.push({ label, value });
      continue;
    }

    const label = fields.length ? 'Styling Note' : 'Formula';
    fields.push({ label, value: line });
  }

  const dedupedFields = fields.reduce<Array<{ label: string; value: string }>>((acc, field) => {
    const duplicate = acc.some(
      (existing) =>
        existing.label === field.label &&
        existing.value.toLowerCase() === field.value.toLowerCase(),
    );
    if (!duplicate) acc.push(field);
    return acc;
  }, []);

  if (!dedupedFields.length) return null;

  const text = dedupedFields.map((field) => `${field.label}: ${field.value}`).join(' ');
  const title = explicitTitle ? cleanText(explicitTitle) : deriveTitle(dedupedFields, index);
  const capsule = capsuleOverride ?? inferCapsule(text);
  const orderedFields = orderFields(dedupedFields);
  const normalised_slots = normaliseStylistOutfitSlots(orderedFields);
  const signature = stylistOutfitSignature(normalised_slots) || text.toLowerCase().replace(/\s+/g, ' ').trim();

  notes.push('Anchor on this verified outfit: keep its silhouette, piece relationships, styling line, accessory architecture, and finishing logic as one complete outfit. Adapt only colour (to the client palette), coverage, fabric weight, formality, climate, and fit. Do not recombine its pieces with another outfit unless a human stylist explicitly requests it.');

  return {
    id: `${source}-${String(index + 1).padStart(2, '0')}`,
    title,
    source,
    capsule,
    fields: orderedFields,
    normalised_slots,
    completeness_score: stylistOutfitCompletenessScore(normalised_slots),
    signature,
    notes,
  };
}

function splitInlineLabelledFields(line: string): Array<{ label: string; value: string }> {
  const withoutNumber = line.replace(/^\s*\d{1,3}\.\s*/, '').trim();
  const matches = [...withoutNumber.matchAll(INLINE_LABEL_PATTERN)];
  if (!matches.length) return [];

  const prefix = withoutNumber.slice(0, matches[0].index ?? 0).trim();
  if (prefix) return [];

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? withoutNumber.length : withoutNumber.length;
      return {
        label: normaliseLabel(match[1]),
        value: cleanText(withoutNumber.slice(start, end)),
      };
    })
    .filter(field => field.value);
}

function deriveTitle(fields: Array<{ label: string; value: string }>, index: number): string {
  const source =
    fields.find((field) => ['Outfit', 'Dress', 'Top', 'Outerwear', 'Formula'].includes(field.label))
      ?.value ?? fields[0]?.value ?? `Outfit ${index + 1}`;
  const words = source
    .replace(/\([^)]*\)/g, '')
    .split(/\s+/)
    .filter((word) => !['a', 'an', 'the', 'with', 'and', 'or', 'in', 'of', 'for'].includes(word.toLowerCase()))
    .slice(0, 6)
    .join(' ');
  return words || `Outfit ${index + 1}`;
}

function inferCapsule(text: string): ParsedStylistOutfit['capsule'] {
  const lower = text.toLowerCase();

  if (/(satin|slip dress|clutch|festive|cocktail|statement|embellished|evening|wedding|occasion)/.test(lower)) {
    return 'Occasion';
  }

  if (/(blazer|tailored|office|professional|client meeting|trouser|pumps|pointed-toe)/.test(lower)) {
    return 'Professional';
  }

  if (/(dinner|date|gallery|social|going-out|heels|midi skirt|bodycon)/.test(lower)) {
    return 'Social';
  }

  return 'Everyday';
}

function orderFields(fields: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  return [...fields].sort((a, b) => {
    const aIndex = FIELD_PRIORITY.indexOf(a.label);
    const bIndex = FIELD_PRIORITY.indexOf(b.label);
    return (aIndex === -1 ? FIELD_PRIORITY.length : aIndex) - (bIndex === -1 ? FIELD_PRIORITY.length : bIndex);
  });
}

function parseRawOutfitLibrary(raw: string): ParsedStylistOutfit[] {
  const seen = new Set<string>();
  const entries: ParsedStylistOutfit[] = [];

  splitRawOutfits(raw).forEach((entry) => {
    const parsed = parseEntry(entry, entries.length, 'root');
    if (!parsed) return;

    const signature = parsed.fields
      .map((field) => `${field.label}:${field.value}`)
      .join('|')
      .toLowerCase();
    if (seen.has(signature)) return;

    seen.add(signature);
    entries.push(parsed);
  });

  return entries;
}

function isWomenLibraryHeading(line: string) {
  const text = cleanText(line.replace(/^\s*\d{1,3}\.\s*/, ''));
  return Boolean(text) && !text.includes(':') && /^[A-Z0-9 /&().,–—'-]+$/.test(text);
}

// The women library's section headings are the stylist's own capsule curation —
// trust them over per-entry keyword guessing. Evening entries split between
// Social (dinner-out looks) and Occasion (clutch/shine cocktail looks).
function capsuleForWomenSection(heading: string): ParsedStylistOutfit['capsule'] | 'evening' | undefined {
  const text = heading.toUpperCase();
  if (/OFFICE|BUSINESS/.test(text)) return 'Professional';
  if (/EVENING|DINNER|COCKTAIL/.test(text)) return 'evening';
  if (/FESTIVE|FAMILY OCCASION|WEDDING/.test(text)) return 'Occasion';
  if (/INDO-WESTERN|MODERN ETHNIC|BOHO|ARTISTIC|PRINT-LED|RESORT|VACATION|BRUNCH|EVERYDAY/.test(text)) return 'Everyday';
  return undefined;
}

function eveningEntryCapsule(entryText: string): ParsedStylistOutfit['capsule'] {
  return /\b(clutch|sequin|velvet|cape|one-shoulder|off-shoulder|halter|stiletto)\b/i.test(entryText)
    ? 'Occasion'
    : 'Social';
}

export function parseWomenOutfitLibrary(raw: string): ParsedStylistOutfit[] {
  const seen = new Set<string>();
  const entries: ParsedStylistOutfit[] = [];
  let sectionCapsule: ParsedStylistOutfit['capsule'] | 'evening' | undefined;

  raw
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (isWomenLibraryHeading(line)) {
        sectionCapsule = capsuleForWomenSection(line) ?? sectionCapsule;
        return;
      }
      if (!splitInlineLabelledFields(line).length) return;

      const capsuleOverride = sectionCapsule === 'evening' ? eveningEntryCapsule(line) : sectionCapsule;
      const parsed = parseEntry(line, entries.length, 'women', undefined, capsuleOverride);
      if (!parsed) return;

      const signature = parsed.fields
        .map((field) => `${field.label}:${field.value}`)
        .join('|')
        .toLowerCase();
      if (seen.has(signature)) return;

      seen.add(signature);
      entries.push(parsed);
    });

  return entries;
}

function parseCuratedOutfitLibrary(raw: string): ParsedStylistOutfit[] {
  const referenceText = raw.split(/##\s+Outfit References/i)[1] ?? raw;
  const chunks = referenceText
    .split(/\n###\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const entries: ParsedStylistOutfit[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const normalisedChunk = chunk.startsWith('### ') ? chunk.slice(4) : chunk;
    const [titleLine = '', ...bodyLines] = normalisedChunk.split(/\n/);
    const title = cleanText(titleLine);
    if (!title || /^outfit name$/i.test(title)) continue;

    const body = bodyLines
      .map((line) => line.replace(/^\s*-\s*/, ''))
      .join('\n')
      .trim();
    const parsed = parseEntry(body, entries.length, 'curated', title);
    if (!parsed) continue;

    const signature = `${parsed.title}|${parsed.fields.map((field) => `${field.label}:${field.value}`).join('|')}`
      .toLowerCase();
    if (seen.has(signature)) continue;
    seen.add(signature);
    entries.push(parsed);
  }

  return entries;
}

export function formatStylistOutfitsForPrompt(outfits: ParsedStylistOutfit[]): string {
  if (!outfits.length) {
    return 'No parsed client-tested outfit references were found.';
  }

  return outfits
    .filter(isUsableStylistOutfitAnchor)
    .map((outfit) => {
      const fields = outfit.fields
        .map((field) => `- ${field.label}: ${field.value}`)
        .join('\n');
      return `### ${outfit.id}: ${outfit.title}
- Capsule: ${outfit.capsule}
- Source: ${outfit.source}
- Completeness: ${outfit.completeness_score}/6
${fields}
- Adaptation rule: ${outfit.notes.join(' ')}`;
    })
    .join('\n\n');
}

export function getStylistOutfitLibraryPrompt(): string {
  return getStylistOutfitLibraryPromptFromOutfits(getParsedStylistOutfitLibrary());
}

export function getStylistOutfitLibraryPromptFromOutfits(parsedOutfits: ParsedStylistOutfit[]): string {
  const curatedLibrary = readCuratedLibraryFile();

  return `# ICONIK Stylist Outfit Library

These are real, stylist-verified, client-tested outfits — your strongest signal for what actually looks classy and works in real life. Anchor each generated look on ONE complete reference outfit: reproduce its silhouette, piece relationships, and styling logic faithfully. Do not recombine pieces across different references. Adapt only what this specific client needs — colour (to her palette), coverage, fabric weight (to her climate), formality, and fit (to her body). Do not drift into invented looks that are not grounded in this library.

## Parsed Client-Tested Outfit References

${formatStylistOutfitsForPrompt(parsedOutfits)}

## Curated Outfit Frameworks

${formatStylistOutfitsForPrompt(parseCuratedOutfitLibrary(curatedLibrary))}`;
}

export function getParsedStylistOutfitLibrary(): ParsedStylistOutfit[] {
  return [
    ...parseWomenOutfitLibrary(readWomenLibraryFile()),
    ...parseRawOutfitLibrary(readUserLibraryFile()),
    ...parseCuratedOutfitLibrary(readCuratedLibraryFile()),
  ];
}
