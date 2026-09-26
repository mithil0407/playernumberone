/**
 * The search behind each "Shop" link on an outfit page.
 *
 * This deliberately builds a *search*, not a deep link to a single product
 * page. A specific product URL cannot be produced reliably without a shopping
 * feed behind it: any hard-coded listing goes out of stock, gets re-slugged, or
 * is regional, and a paid report full of dead links is worse than none. A
 * well-formed query lands her on live, buyable results for the exact piece.
 *
 * The pieces are written for a stylist, not for a search box, so the query is
 * the garment itself: the stylist's own colour, the shape, and any print that
 * makes it recognisable. Reasoning ("to elongate the neck"), fit notes after the
 * first comma, and the report's palette names are left out. A live report shipped
 * "Garnet Red Burgundy kurta", "Soft Stone Beige ballet flats" and "Oat Stone
 * None women": Google reads "Stone" and "Earth" literally, and a palette colour
 * guessed for a library outfit contradicted the colour the stylist wrote.
 */

import { COLOUR_NAME_WORDS, escapeRegExp } from './stylistBlueprintTextSafety.ts';

export interface ShoppingPieceInput {
  piece: string;
  slot?: string;
  /**
   * The colour the report assigned this piece. Pass it only when it was set
   * deliberately for this piece (the generator's colour_name), never a colour
   * inferred for display: an inferred one is a guess and misleads the search.
   */
  colourName?: string;
}

const COLOUR_WORD_RE = new RegExp(`\\b(?:${COLOUR_NAME_WORDS.map(escapeRegExp).join('|')})\\b`, 'i');

// Words that already settle what colour the piece is, so a palette colour in
// front of them only contradicts it ("Rich Navy dark denim", "Clear" straps).
const SETTLES_COLOUR_WORDS = [
  'champagne', 'metallic', 'tortoiseshell', 'tortoise', 'multicolour', 'multicolor', 'majenta',
  'denim', 'chambray', 'straw', 'rattan', 'jute', 'wicker', 'clear', 'transparent',
];
const SETTLES_COLOUR_RE = new RegExp(
  `\\b(?:${[...COLOUR_NAME_WORDS, ...SETTLES_COLOUR_WORDS].map(escapeRegExp).join('|')})\\b`,
  'i',
);

// A palette colour is only added to a garment, shoe or bag. On jewellery and
// eyewear it was decoration ("Charcoal Grey sunglasses").
const TAKES_COLOUR_SLOT_RE = /top|blouse|shirt|tee|knit|dress|kurta|kurti|tunic|saree|sari|jumpsuit|bottom|trouser|pant|jean|skirt|layer|jacket|blazer|coat|cardigan|shrug|outer|footwear|shoe|bag/i;

// Report palette words a shopper would not type, mapped to the word a retailer
// actually tags the product with.
const SHOPPING_COLOUR_WORD: Record<string, string> = {
  stone: 'beige',
  oat: 'beige',
  oatmeal: 'beige',
  sand: 'beige',
  ecru: 'off-white',
  bone: 'off-white',
  chalk: 'off-white',
  pearl: 'off-white',
  ink: 'navy',
  jet: 'black',
  graphite: 'charcoal',
  pewter: 'grey',
  espresso: 'dark brown',
  cocoa: 'brown',
  mocha: 'brown',
  golden: 'gold',
};

// Pieces nobody can buy from a search: an explicit "None", and make-up.
const NOT_SHOPPABLE_RE = /\b(lip|lips|lipstick|lip tone|makeup|make-up|blush|kajal|kohl|eyeliner|mascara|nail polish|manicure)\b/i;

// Prints and surface details that make a garment recognisable. The first-comma
// cut loses them ("kurta, featuring a fine blue-and-white vertical stripe"), so
// they are carried over with up to two leading describing words.
const PATTERN_RE = /\b((?:\p{L}+(?:-\p{L}+)*\s+){0,2}(?:pinstripes?|stripes?|striped|polka[- ]dots?|paisley|checks|checked|plaid|gingham|houndstooth|floral|animal[- ]print|leopard(?:[- ]print)?|chevron|herringbone|ikat|bandhani|block[- ]print|embroidery|embroidered|zari|sequins?|sequinned))\b/iu;

// Words that describe a pattern's scale or softness but only narrow the search.
const PATTERN_FILLER_RE = /\b(fine|small|small-scale|subtle|tonal|delicate|thin|a|an|the|with|in)\s+/gi;

// Opening words that describe how to wear it, not what to buy.
const LEADING_FILLER_RE = /^(?:(?:matching|classic|simple|clean|polished|classy)\s+)+/i;

// A clause from here on is reasoning or wearing instructions, not the garment.
const CLAUSE_BREAK_RE = /\s+(?:with|that|which|featuring|worn|to|so|for|in a|on a|in an|tied|tucked|draped)\s+/i;

/**
 * The palette name as a shopper would type it: "Garnet Red" -> red, "Soft
 * Stone" -> beige, "Charcoal Grey" stays whole. Words that are not colours
 * ("Garnet", "Earth", "Antique", "Muted") are dropped, and a name made only of
 * them adds nothing.
 */
function plainColourWords(colourName: string) {
  const words = colourName.toLowerCase().split(/[\s-]+/).filter(Boolean);
  const plain = words
    .filter(word => COLOUR_WORD_RE.test(word) || SHOPPING_COLOUR_WORD[word])
    .map(word => SHOPPING_COLOUR_WORD[word] ?? word);
  return [...new Set(plain)].join(' ');
}

function tidy(value: string) {
  return value
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(a|an|the)\s+/gi, ' ')
    .replace(/\b(\p{L}+)[-\s]toned\b/giu, '$1')
    .replace(/\b\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*inch(?:es)?\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function shoppingQueryForPiece({ piece, slot = '', colourName = '' }: ShoppingPieceInput): string {
  const raw = (piece ?? '').trim();
  if (!raw || /^none\.?$/i.test(raw) || NOT_SHOPPABLE_RE.test(`${slot} ${raw}`)) return '';

  const isJewellery = /jewel|earring|necklace|bracelet|bangle|ring|watch/i.test(slot);
  // A full stop ends the garment only when a space follows: "1.2-2 inch" is not a sentence.
  // Parentheticals first, so a comma inside one cannot cut the garment short.
  const text = raw.replace(/\([^)]*\)/g, ' ');
  let head = text.split(/[,;:]|\.(?=\s|$)/)[0].split(CLAUSE_BREAK_RE)[0];
  // "white strappy heels or loafers" is one choice too many for a search. For
  // jewellery "or" joins the item's own type ("hoop or stud earrings").
  if (!isJewellery) head = head.split(/\s+or\s+/i)[0];
  // "simple hoop earrings and watch": search for the first thing.
  if (isJewellery) head = head.split(/\s+and\s+/i)[0];
  const plainColour = plainColourWords(colourName);
  // A two-word palette name written into the piece ("Soft Stone leather
  // loafers") reads as the plain colour a retailer would tag it with. A single
  // word is the stylist's own ("Pearl drop earrings") and stays.
  const name = colourName.trim();
  if (/\s/.test(name) && plainColour) {
    head = head.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i'), plainColour);
  }
  head = tidy(head).replace(LEADING_FILLER_RE, '');
  if (!head) return '';

  const patternMatch = PATTERN_RE.exec(text);
  const headHasPattern = PATTERN_RE.test(head);
  const pattern = patternMatch && !headHasPattern
    ? tidy(patternMatch[1].replace(PATTERN_FILLER_RE, ''))
    : '';

  // A printed piece, or one that already says its colour, is searched as written.
  const settled = headHasPattern || Boolean(pattern) || SETTLES_COLOUR_RE.test(head);
  const colour = settled || !TAKES_COLOUR_SLOT_RE.test(slot) ? '' : plainColour;

  let query = [colour, head, pattern].filter(Boolean).join(' ');
  if (/eyewear|frames?|glasses/i.test(slot) && /\bframes?\b/i.test(query) && !/glasses/i.test(query)) {
    query = `${query} eyeglasses`;
  }
  return `${query.split(' ').slice(0, 11).join(' ')} women`.replace(/\s+/g, ' ').trim();
}

export function shoppingSearchUrl(query: string, country: string | undefined) {
  // udm=28 is Google's current Shopping surface. The older tbm=shop still works
  // but is served as a redirect to this, so we send the canonical form and skip
  // the hop. If Google retires the parameter the link degrades to an ordinary
  // search for the same garment rather than breaking.
  const params = new URLSearchParams({ q: query, udm: '28', hl: 'en' });
  // Scope to her market so prices and retailers are ones she can actually use.
  if (/india/i.test(country ?? '')) params.set('gl', 'in');
  return `https://www.google.com/search?${params.toString()}`;
}
