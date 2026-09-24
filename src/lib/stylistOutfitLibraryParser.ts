import { readFileSync } from 'fs';
import { join } from 'path';

export interface ParsedStylistOutfit {
  id: string;
  title: string;
  source: 'stylist' | 'pinterest' | 'women' | 'root' | 'curated' | 'learned';
  /**
   * Every capsule this look genuinely works for. A camel blazer over a tee and
   * jeans is both a relaxed office outfit and a weekend one, so it should be
   * reachable from either — while still appearing at most once per report.
   * Always contains `capsule`.
   */
  capsules?: ParsedStylistOutfit['capsule'][];
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
  saree: 'Dress',
  sari: 'Dress',
  lehenga: 'Bottom',
  kurta: 'Top',
  blouse: 'Top',
  dupatta: 'Outerwear',
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
  // Indian womenswear labels. Without these a stylist cannot write "SAREE:" or
  // "BLOUSE:" in the library at all — the entry parses to zero fields and the
  // whole outfit is silently dropped, which is why the library had no sarees.
  'SAREE',
  'SARI',
  'BLOUSE',
  'DUPATTA',
  'LEHENGA',
  'KURTA',
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

/** The one outfit library the women's Blueprint reads. */
const OUTFIT_LIBRARY_FILE = 'outfitlibrary.md';

function readOutfitLibraryFile(): string {
  try {
    return readFileSync(join(process.cwd(), OUTFIT_LIBRARY_FILE), 'utf-8');
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
  const hasOnePiece = /\b(dress(?:es)?|jumpsuits?|sarees?|saris?|kurtas?|kurtis?|tunics?|lehengas?|anarkalis?|shararas?|ghararas?|salwar|co-ords?|coords?|sets?|ensembles?)\b/.test(text);
  const hasTop = /\b(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|base layer)\b/.test(text) || slots.some(slot => /top|base layer/i.test(slot.slot));
  const hasBottom = /\b(bottom|trousers?|pants?|jeans?|skirts?|palazzos?|leggings?|churidars?|salwars?)\b/.test(text) || slots.some(slot => /bottom/i.test(slot.slot));
  const hasFootwear = /\b(footwear|shoes?|sandals?|heels?|flats?|sneakers?|loafers?|pumps?|mules?|juttis?|kolhapuris?|wedges?|espadrilles?)\b/.test(text);
  const hasBag = /\b(bags?|totes?|clutch(?:es)?|crossbody|handbags?|shoulder bags?|baguettes?|potlis?)\b/.test(text);
  const hasAccessory = /\b(jewell?ery|jewels?|earrings?|necklaces?|bracelets?|watch(?:es)?|bangles?|accessor(?:y|ies)|sunglass(?:es)?|scarf|scarves|belts?|jhumkas?|chandbalis?|kundan|studs?|hoops?|cuffs?)\b/.test(text);
  const hasStructure = /\b(blazer|jacket|cardigan|vest|coat|outerwear|layer|overshirt|belt|waist|tie)\b/.test(text);
  const hasDetail = slots.length >= 5;
  // How the look is worn — the tuck, the rolled sleeve, where the belt sits.
  const hasStylingNote = slots.some(slot => /styling line/i.test(slot.slot));

  // Bag and accessory stay separate signals so entries written to the older
  // template keep their score, and the styling note is an extra point on top —
  // it is what makes a stylist-described outfit more useful than a generated
  // one. Collapsing bag and accessory instead cost the existing library 49
  // anchors to gain 45 here, which is not a trade worth making.
  return [
    hasOnePiece || (hasTop && hasBottom),
    hasFootwear,
    hasBag,
    hasAccessory,
    hasStructure,
    hasDetail,
    hasStylingNote,
  ].filter(Boolean).length;
}

function outfitHasCompleteBase(slots: ParsedStylistOutfitSlot[]): boolean {
  const text = slots.map(slot => `${slot.slot} ${slot.piece}`).join(' ').toLowerCase();
  const hasOnePiece = /\b(dress(?:es)?|jumpsuits?|sarees?|saris?|kurtas?|kurtis?|tunics?|lehengas?|anarkalis?|shararas?|ghararas?|salwar|co-ords?|coords?|sets?|ensembles?)\b/.test(text);
  const hasTop = /\b(top|blouse|shirt|tee|t-shirt|knit|camisole|tank|base layer)\b/.test(text) || slots.some(slot => /top|base layer/i.test(slot.slot));
  const hasBottom = /\b(bottom|trouser|pant|jean|skirt|palazzo|legging)\b/.test(text) || slots.some(slot => /bottom/i.test(slot.slot));
  const hasFootwear = /\b(footwear|shoes?|sandals?|heels?|flats?|sneakers?|loafers?|pumps?|mules?|juttis?|kolhapuris?|wedges?|espadrilles?|boots?)\b/.test(text);
  const hasBagOrAccessory = /\b(bags?|totes?|clutch(?:es)?|crossbody|handbags?|shoulder bags?|baguettes?|potlis?|jewell?ery|jewels?|earrings?|necklaces?|bracelets?|watch(?:es)?|bangles?|accessor(?:y|ies)|sunglass(?:es)?|scarf|scarves|belts?|jhumkas?|chandbalis?|kundan|studs?|hoops?|cuffs?)\b/.test(text);

  // An anchor's job is the garment relationship. Footwear and a bag are filled
  // in by the engine when the anchor does not name them (see the fallback slots
  // in generateOutfitCandidates), so demanding both here rejected complete
  // outfits purely because the source photo cropped the shoes.
  return (hasOnePiece || (hasTop && hasBottom)) && (hasFootwear || hasBagOrAccessory);
}

function outfitHasAmbiguousShoppingLanguage(outfit: Pick<ParsedStylistOutfit, 'fields'>): boolean {
  const text = outfit.fields.map(field => field.value).join(' ').toLowerCase();
  return (
    /\b(any|or|\/)\b[^.]{0,28}\b(shade|colour|color|loafers|sneakers|heels|boots|flats|sandals|trench|denim jacket|top|blouse|dress|pants|trousers)\b/.test(text) ||
    /\btransparent\b/.test(text) ||
    /\bimage\s+(?:should|in|clear|hd)\b/.test(text)
  );
}

/** The capsules an anchor may be drawn into. */
export function outfitCapsules(outfit: ParsedStylistOutfit): ParsedStylistOutfit['capsule'][] {
  return outfit.capsules?.length ? outfit.capsules : [outfit.capsule];
}

export function isUsableStylistOutfitAnchor(outfit: ParsedStylistOutfit): boolean {
  // The reference board includes pins explicitly marked as men's looks to skip.
  const text = outfit.fields.map(field => field.value).join(' ');
  if (/\(\s*menswear\b|men['’]s look/i.test(text)) return false;
  // completeness_score still ranks anchors against each other, but it is no
  // longer a gate: it scored a missing bag and a missing shoe as two separate
  // failures, which dropped complete looks twice over.
  return outfit.normalised_slots.length >= 3 &&
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


// --- Stylist-described board outfits -----------------------------------------
// One outfit per line, positional rather than labelled:
//   **12.** top / layer / bottom / shoes / accessories. *Styling: ...*
// The styling note is the point of this source: it records how the look is
// actually worn — the tuck, the rolled sleeve, where the belt sits — which no
// generated outfit supplies.

const PINTEREST_ENTRY_RE = /^\*\*(\d+)\.\*\*\s*(.+)$/;
const NO_PIECE_RE = /^(no layer|none|not visible|no bag|no accessories|no jewellery|minimal|n\/a|[-–—])$/i;
/** The "bottom" slot when the top is really a one-piece. */
const ONE_PIECE_BOTTOM_RE = /^(dress|gown|jumpsuit|attached|built-in|skirt of the dress|romper|playsuit|the dress)\b/i;

/**
 * A garment that is already the whole outfit from shoulder to hem.
 *
 * One-piece-ness used to be read from the *bottom* segment alone, so it only
 * worked when the pin restated the garment there ("... / dress / ..."). A pin
 * that wrote "—" for the bottom left a jumpsuit sitting in the Top slot, and
 * the outfit engine then bolted a pair of trousers onto it.
 */
const ONE_PIECE_TOP_RE = /\b(dress|gown|jumpsuit|romper|playsuit|kaftan|caftan|sari|saree|anarkali)\b/i;

/**
 * The same nouns worn as a layer over a separate outfit. A shirt-dress worn
 * open over jeans is outerwear, not the outfit, so it keeps its real bottom.
 */
const ONE_PIECE_AS_LAYER_RE = /\b(worn open|open over|duster|cape|shrug|overlay|kaftan top|jacket)\b/i;

/**
 * A bottom that is a genuinely separate garment rather than a description of
 * the one-piece's own lower half. "draped sari" and "A-line skirt with a
 * ruffled hem" describe the dress; "matching blue palazzo trousers" under an
 * anarkali does not.
 */
const SEPARATE_BOTTOM_RE = /\b(trouser|pant|jean|palazzo|legging|churidar|salwar|sharara|gharara|shorts|culotte|dhoti)\b/i;

/** A board pin that photographs more than one outfit at once. */
const MULTI_LOOK_PREFIX_RE = /^\*?\((?:two|three|four)\s+looks\)\*?\s*[-\u2013\u2014]?\s*/i;

/** The labels a stylist uses to separate the looks inside such a pin. */
const LOOK_LABEL_RE = /\s*\b(?:left|right|centre|center|middle)\s*:\s*/i;

/**
 * The looks described by one pin. A "(Two looks)" pin that labels them
 * "Left: ... Right: ..." holds two complete outfits; splitting on the label is
 * what stops the second look's pieces from shifting every slot of the first
 * (trousers landing in Outerwear, pumps in Bottom, a bag in Footwear).
 */
function boardLooksFromFormula(formulaPart: string): string[] {
  const cleaned = formulaPart
    .replace(/^\*\(Flat-lay\)\*\s*/i, '')
    .replace(MULTI_LOOK_PREFIX_RE, '')
    .trim();
  const looks = cleaned
    .split(LOOK_LABEL_RE)
    .map(part => part.trim().replace(/[.;]+$/, '').trim())
    .filter(Boolean);
  return looks.length ? looks : [cleaned];
}

/** Board look 138 and 138b, so a split pin keeps a stable, distinct id. */
function boardLookSuffix(index: number) {
  return index === 0 ? '' : String.fromCharCode(97 + index);
}

const FOOTWEAR_PIECE_RE = /\b(?:shoe|sandal|heel|heeled|flats|sneaker|trainer|loafer|pump|mule|boot|jutti|wedge|espadrille|slide|brogue|slingback|stiletto)s?\b/i;
const BAG_PIECE_RE = /\b(?:bag|tote|clutch|crossbody|handbag|potli|purse|backpack)s?\b/i;
const BOTTOM_PIECE_RE = /\b(?:trouser|pant|jean|palazzo|legging|skirt|shorts|culotte|churidar|salwar|sharara|gharara|dhoti|chino)s?\b/i;
const LAYER_PIECE_RE = /\b(?:blazer|jacket|cardigan|waistcoat|vest|coat|duster|kimono|shrug|overshirt|dupatta|cape|shacket|poncho)s?\b/i;
const ACCESSORY_PIECE_RE = /\b(?:necklace|earring|hoop|stud|bangle|bracelet|watch|cuff|belt|scarf|scarves|sunglasses|ring|brooch|headband|neckerchief)s?\b/i;

/**
 * Whether the pin skipped a position, so reading it by position is wrong.
 *
 * The board convention is top / layer / bottom / shoes / accessories, and a pin
 * that omits the "no layer" placeholder shifts every slot after it: board look
 * 138 put its trousers in Outerwear, its pumps in Bottom and its bag in
 * Footwear. Trousers in the layer position, a shoe in the bottom position, or a
 * bag where the shoe belongs are all things a real pin never says.
 */
function boardSegmentsAreShifted(segments: string[]) {
  const [, layer = '', bottom = '', shoes = ''] = segments;
  const layerIsBottom = BOTTOM_PIECE_RE.test(layer) && !LAYER_PIECE_RE.test(layer);
  const bottomIsFootwear = FOOTWEAR_PIECE_RE.test(bottom);
  const footwearIsBag = BAG_PIECE_RE.test(shoes) && !FOOTWEAR_PIECE_RE.test(shoes);
  return layerIsBottom || bottomIsFootwear || footwearIsBag;
}

/** Reads a shifted pin by what each piece actually is, since position lied. */
function boardSlotsByGarment(segments: string[]) {
  const remaining = segments.filter(part => part && !NO_PIECE_RE.test(cleanText(part)));
  const take = (match: RegExp, exclude?: RegExp) => {
    const index = remaining.findIndex(part => match.test(part) && !exclude?.test(part));
    return index >= 0 ? remaining.splice(index, 1)[0] : undefined;
  };
  const shoes = take(FOOTWEAR_PIECE_RE);
  const bottom = take(BOTTOM_PIECE_RE);
  const layer = take(LAYER_PIECE_RE);
  const accessoryParts = remaining.filter(part => BAG_PIECE_RE.test(part) || ACCESSORY_PIECE_RE.test(part));
  const top = remaining.find(part => !accessoryParts.includes(part));
  return { top, layer, bottom, shoes, accessories: accessoryParts.join(', ').trim() };
}

/** The five board slots, read by position and repaired only when position lied. */
function boardSlotsFromSegments(segments: string[]) {
  if (boardSegmentsAreShifted(segments)) return boardSlotsByGarment(segments);
  const [top, layer, bottom, shoes, ...accessoryParts] = segments;
  return { top, layer, bottom, shoes, accessories: accessoryParts.join(', ').trim() };
}

interface CapsuleSignal { capsule: ParsedStylistOutfit['capsule']; pattern: RegExp; weight: number }

// Ordered by how strongly a term implies its context. Occasion cues are checked
// hardest because putting a gown in someone's everyday section is the worst
// possible mistake; Everyday cues are the most common and weighted lowest.
const CAPSULE_SIGNALS: CapsuleSignal[] = [
  { capsule: 'Occasion', pattern: /\bgown\b|floor-length|sequin|embellish|bridal|lehenga|anarkali|sharara|gharara|banarasi|kanjivaram|zari|brocade|tulle|feather|corsage/i, weight: 4 },
  { capsule: 'Occasion', pattern: /\bclutch\b/i, weight: 1 },
  { capsule: 'Professional', pattern: /blazer|tailored trouser|pencil skirt|suiting|work tote|pinstripe|waistcoat|shirt dress|trouser suit|structured tote/i, weight: 2 },
  { capsule: 'Professional', pattern: /loafer|court shoe|pointed pump|slingback/i, weight: 1 },
  { capsule: 'Social', pattern: /satin|slip skirt|bias|silk|velvet|cocktail|evening|strappy heel|metallic|midi slip/i, weight: 2 },
  { capsule: 'Everyday', pattern: /sneaker|trainer|\bjeans\b|\bdenim\b|\btee\b|t-shirt|crossbody|tote bag|flat sandal|slide sandal|espadrille|shorts|track pant|hoodie|sweatshirt|cap\b/i, weight: 2 },
];

function capsuleScores(text: string) {
  const scores: Record<string, number> = { Professional: 0, Social: 0, Everyday: 0, Occasion: 0 };
  for (const signal of CAPSULE_SIGNALS) {
    if (signal.pattern.test(text)) scores[signal.capsule] += signal.weight;
  }
  return scores;
}

/** Best-guess primary capsule from the garment vocabulary alone. */
export function inferPinterestCapsule(text: string): ParsedStylistOutfit['capsule'] {
  const best = (Object.entries(capsuleScores(text)) as Array<[ParsedStylistOutfit['capsule'], number]>)
    .sort((a, b) => b[1] - a[1]);
  if (!best[0][1]) return 'Everyday';
  return best[0][0];
}

/**
 * Every capsule the look is good enough for, strongest first. A second capsule
 * qualifies only when its evidence is close to the winner's, so a gown does not
 * become an everyday option just because it scored a single stray point.
 */
export function inferPinterestCapsules(text: string): ParsedStylistOutfit['capsule'][] {
  const ranked = (Object.entries(capsuleScores(text)) as Array<[ParsedStylistOutfit['capsule'], number]>)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return ['Everyday'];
  const [, topScore] = ranked[0];
  return ranked.filter(([, score]) => score >= topScore - 1).map(([capsule]) => capsule);
}

interface BoardParseOptions {
  /** Distinguishes ids when several board files are loaded. */
  idPrefix?: string;
  /**
   * The context the file was collected for. A file of office looks is
   * Professional by definition, so we do not ask the vocabulary to rediscover
   * that — but any further capsule the look also suits is still inferred.
   */
  baseCapsule?: ParsedStylistOutfit['capsule'];
}

export function parsePinterestOutfitLibrary(raw: string, options: BoardParseOptions = {}): ParsedStylistOutfit[] {
  const entries: ParsedStylistOutfit[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const match = line.trim().match(PINTEREST_ENTRY_RE);
    if (!match) continue;
    const [, number, rest] = match;

    const [formulaPart, stylingPart] = rest.split(/\*Styling:/i);
    const styling = (stylingPart ?? '')
      .replace(/\*/g, '')
      .replace(/^\s*/, '')
      .replace(/\s*$/, '')
      .trim();

    const looks = boardLooksFromFormula(formulaPart);
    for (const [lookIndex, look] of looks.entries()) {
      const segments = look
        .split(' / ')
        .map(part => part.trim().replace(/[.;]+$/, '').trim());
      if (segments.length < 4) continue;

      const { top, layer, bottom, shoes, accessories } = boardSlotsFromSegments(segments);
      // The pin restates a one-piece in the bottom slot ("... / dress / ..."),
      // but not every stylist does, so the top's own garment noun decides too.
      const topIsOnePiece = ONE_PIECE_TOP_RE.test(top ?? '') && !ONE_PIECE_AS_LAYER_RE.test(top ?? '');
      const bottomRestatesTop = topIsOnePiece && !SEPARATE_BOTTOM_RE.test(bottom ?? '');
      const onePiece = ONE_PIECE_BOTTOM_RE.test(bottom ?? '') || bottomRestatesTop;

      const fields: Array<{ label: string; value: string }> = [];
      const push = (label: string, value: string | undefined) => {
        const text = cleanText(value ?? '');
        if (!text || NO_PIECE_RE.test(text)) return;
        fields.push({ label, value: text });
      };

      push(topIsOnePiece || onePiece ? 'Dress' : 'Top', top);
      push('Outerwear', layer);
      if (!onePiece) push('Bottom', bottom);
      push('Footwear', shoes);
      push('Accessories', accessories);
      push('Styling Line', styling);

      const normalised_slots = normaliseStylistOutfitSlots(fields);
      const text = fields.map(field => field.value).join(' ');
      const signature = stylistOutfitSignature(normalised_slots) || text.toLowerCase();
      if (seen.has(signature)) continue;
      seen.add(signature);

      const prefix = options.idPrefix ?? 'pinterest';
      const reference = `${number}${boardLookSuffix(lookIndex)}`;
      const inferred = inferPinterestCapsules(text);
      const capsules = options.baseCapsule
        ? [options.baseCapsule, ...inferred.filter(item => item !== options.baseCapsule)]
        : inferred;

      entries.push({
        id: `${prefix}-${reference}`,
        title: `Board look ${reference}`,
        source: 'pinterest',
        capsule: options.baseCapsule ?? inferPinterestCapsule(text),
        capsules,
        fields,
        normalised_slots,
        completeness_score: stylistOutfitCompletenessScore(normalised_slots),
        signature,
        notes: styling ? [`Stylist styling note: ${styling}`] : [],
      });
    }
  }

  return entries;
}

// --- The single outfit library ----------------------------------------------
// outfitlibrary.md holds every outfit in the board's one-line format. A `##`
// heading names where the outfit came from, which sets its priority; a `###`
// heading under it is the capsule. Sections not listed here (Needs fixing, or a
// typo) are never read, so a half-written outfit cannot reach a client.

const LIBRARY_SECTION_SOURCES: Record<string, ParsedStylistOutfit['source']> = {
  'stylist picks': 'stylist',
  'pinterest board': 'pinterest',
  ethnic: 'pinterest',
  'from the women library': 'women',
};

const LIBRARY_CAPSULES: ParsedStylistOutfit['capsule'][] = ['Professional', 'Social', 'Everyday', 'Occasion'];

export function parseOutfitLibrary(raw: string): ParsedStylistOutfit[] {
  const entries: ParsedStylistOutfit[] = [];
  let source: ParsedStylistOutfit['source'] | undefined;
  let capsule: ParsedStylistOutfit['capsule'] | undefined;
  let chunk: string[] = [];

  const flush = () => {
    if (source && capsule && chunk.length) {
      const sectionSource = source;
      for (const outfit of parsePinterestOutfitLibrary(chunk.join('\n'), { idPrefix: 'lib', baseCapsule: capsule })) {
        entries.push({ ...outfit, source: sectionSource, title: outfit.title.replace(/^Board look/, 'Library look') });
      }
    }
    chunk = [];
  };

  for (const line of raw.split(/\r?\n/)) {
    const section = line.match(/^##\s+(.+?)\s*$/);
    if (section) {
      flush();
      source = LIBRARY_SECTION_SOURCES[section[1].toLowerCase()];
      capsule = undefined;
      continue;
    }
    const capsuleHeading = line.match(/^###\s+(.+?)\s*$/);
    if (capsuleHeading) {
      flush();
      capsule = LIBRARY_CAPSULES.find(name => name.toLowerCase() === capsuleHeading[1].toLowerCase());
      continue;
    }
    chunk.push(line);
  }
  flush();
  return entries;
}

export function getParsedStylistOutfitLibrary(): ParsedStylistOutfit[] {
  return parseOutfitLibrary(readOutfitLibraryFile());
}
