import { readFileSync } from 'fs';
import { join } from 'path';

export interface ParsedStylistOutfit {
  id: string;
  title: string;
  source: 'root' | 'curated';
  capsule: 'Professional' | 'Social' | 'Everyday' | 'Occasion';
  fields: Array<{ label: string; value: string }>;
  notes: string[];
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
  top: 'Top',
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
  'Formula',
];

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

function parseEntry(
  rawEntry: string,
  index: number,
  source: ParsedStylistOutfit['source'],
  explicitTitle?: string,
): ParsedStylistOutfit | null {
  const lines = rawEntry
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean);

  if (!lines.length) return null;

  const fields: Array<{ label: string; value: string }> = [];
  const notes: string[] = [];

  for (const line of lines) {
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
  const capsule = inferCapsule(text);

  notes.push('Use as inspiration only. Adapt colour, coverage, fabric weight, formality, and fit to the client profile.');

  return {
    id: `${source}-${String(index + 1).padStart(2, '0')}`,
    title,
    source,
    capsule,
    fields: orderFields(dedupedFields),
    notes,
  };
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

function formatParsedOutfits(outfits: ParsedStylistOutfit[]): string {
  if (!outfits.length) {
    return 'No parsed client-tested outfit references were found.';
  }

  return outfits
    .map((outfit) => {
      const fields = outfit.fields
        .map((field) => `- ${field.label}: ${field.value}`)
        .join('\n');
      return `### ${outfit.id}: ${outfit.title}
- Capsule: ${outfit.capsule}
- Source: ${outfit.source}
${fields}
- Adaptation rule: ${outfit.notes.join(' ')}`;
    })
    .join('\n\n');
}

export function getStylistOutfitLibraryPrompt(): string {
  const curatedLibrary = readCuratedLibraryFile();
  const parsedOutfits = getParsedStylistOutfitLibrary();

  return `# ICONIK Stylist Outfit Library

Use these references as client-tested outfit inspiration. Do not copy any look verbatim. Adapt each idea to the client's body geometry, colour direction, coverage requirements, lifestyle, climate, budget, and stated taste.

## Parsed Client-Tested Outfit References

${formatParsedOutfits(parsedOutfits)}

## Curated Outfit Frameworks

${formatParsedOutfits(parseCuratedOutfitLibrary(curatedLibrary))}`;
}

export function getParsedStylistOutfitLibrary(): ParsedStylistOutfit[] {
  return [
    ...parseRawOutfitLibrary(readUserLibraryFile()),
    ...parseCuratedOutfitLibrary(readCuratedLibraryFile()),
  ];
}
