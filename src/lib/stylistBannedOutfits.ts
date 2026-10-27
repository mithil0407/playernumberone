/**
 * Women's outfits the owner has banned from Blueprint reports.
 *
 * The list came from the "Styles to Avoid" deck reviewed on 2026-10-27: 15
 * outfits from reports made before 2026-10-16. They were written fresh by the
 * old engine, so none of them is a library entry that could simply be removed.
 * Instead every engine checks its outfits against this list:
 *
 * - the Pinterest engine drops a matching library look (picks, replacements
 *   and alternatives all go through evaluateVerbatimLook);
 * - a stylist cannot save a matching outfit by pasting it (hard warning);
 * - the science engine drops a matching candidate before choosing outfits.
 *
 * A ban names the garments that make the outfit, with their colour family,
 * so the same outfit is caught however the wording changes ("rust" or
 * "terracotta", "trousers" or "pants"). Every garment in a ban must be present
 * for the outfit to count.
 */

const C = {
  rust: 'rust|terracotta|brick|copper|cinnamon|burnt[- ]orange',
  navy: 'navy|ink|midnight',
  olive: 'olive|army[- ]green|moss',
  sage: 'sage',
  beige: 'beige|sand|khaki|stone|fawn|biscuit',
  brown: 'brown|chocolate|espresso|coffee|cocoa|mocha',
  pink: 'pink|rose|blush|mauve',
  yellow: 'yellow|mustard|ochre|butter',
  burgundy: 'burgundy|wine|maroon|oxblood|plum|berry',
  cream: 'cream|ivory|ecru|off[- ]white|oat',
  camel: 'camel|tan|caramel|toffee|beige',
  green: 'green|emerald|forest|bottle',
  teal: 'teal|petrol|peacock',
  white: 'white|ivory|cream|off[- ]white',
} as const;

const G = {
  top: 'top|blouse|shirt|tee|t-shirt|shell|knit|tunic',
  shirt: 'shirt|blouse|overshirt',
  trousers: 'trousers?|pants?|palazzos?|culottes',
  skirt: 'skirt',
  layer: 'blazer|jacket|coat|cardigan|duster|shrug|cape',
};

type Garment = { colour?: string; garment: string; with?: string };

/** One garment: its colour family (if any) and noun must both appear in the same piece. */
function garmentMatches(piece: string, g: Garment) {
  const noun = new RegExp(`\\b(?:${g.garment})\\b`, 'i');
  if (!noun.test(piece)) return false;
  if (g.colour && !new RegExp(`\\b(?:${g.colour})\\b`, 'i').test(piece)) return false;
  if (g.with && !new RegExp(g.with, 'i').test(piece)) return false;
  return true;
}

export interface BannedOutfit {
  id: string;
  /** What the outfit is, in the owner's terms. */
  label: string;
  /** Where it was seen: deck page/position and the report it came from. */
  seen: string;
  garments: Garment[];
}

export const BANNED_OUTFITS: BannedOutfit[] = [
  {
    id: 'rust-top-navy-long-vest-stripe-skirt',
    label: 'Rust top, navy long vest, striped midi skirt',
    seen: 'Deck page 1 #1 · report 17298ade Outfit 20',
    garments: [
      { colour: C.rust, garment: G.top },
      { colour: C.navy, garment: 'vest|waistcoat|gilet' },
      { garment: G.skirt, with: 'stripe' },
    ],
  },
  {
    id: 'yellow-stripe-shirt-rust-trousers',
    label: 'Yellow striped shirt over rust top and rust trousers',
    seen: 'Deck page 1 #2',
    garments: [
      { colour: C.yellow, garment: G.shirt, with: 'stripe' },
      { colour: C.rust, garment: G.trousers },
    ],
  },
  {
    id: 'olive-shirt-beige-trousers',
    label: 'Olive utility shirt or shirt-kurta with beige trousers',
    seen: 'Deck page 1 #3',
    garments: [
      { colour: C.olive, garment: 'shirt|kurta|kurti|tunic|shirt-dress|top', with: 'shirt|pocket|utility|collar|button' },
      { colour: C.beige, garment: G.trousers },
    ],
  },
  {
    id: 'polka-dot-blouse-brown-trousers',
    label: 'Polka-dot blouse with brown trousers',
    seen: 'Deck page 1 #4 · report 1396328c Outfit 2',
    garments: [
      { garment: G.shirt, with: 'polka|\\bdots?\\b|dot print' },
      { colour: C.brown, garment: G.trousers },
    ],
  },
  {
    id: 'olive-peplum-olive-maxi-skirt',
    label: 'Olive peplum top with olive maxi skirt (sage blazer)',
    seen: 'Deck page 1 #5 · reports 3913d57a Outfit 10, 27ad3b4c Outfit 17, f63666a6 Outfit 17',
    garments: [
      { colour: C.olive, garment: 'top|blouse', with: 'peplum' },
      { colour: C.olive, garment: G.skirt, with: 'maxi' },
    ],
  },
  {
    id: 'burgundy-cape-blazer-cream-top-brown-trousers',
    label: 'Burgundy blazer worn as a cape over a cream top and brown trousers',
    seen: 'Deck page 2 #1 · report 1396328c Outfit 10',
    garments: [
      { colour: C.burgundy, garment: 'blazer|cape|jacket' },
      { colour: C.cream, garment: G.top },
      { colour: C.brown, garment: G.trousers },
    ],
  },
  {
    id: 'pink-double-breasted-top-pink-trousers',
    label: 'Pink double-breasted tunic with matching pink trousers',
    seen: 'Deck page 2 #2 · report 1396328c Outfit 8',
    garments: [
      { colour: C.pink, garment: 'tunic|top|kurta|kurti|blazer|jacket', with: 'double-breasted|buttons' },
      { colour: C.pink, garment: G.trousers },
    ],
  },
  {
    id: 'stripe-shirt-pink-tee-beige-trousers',
    label: 'Striped shirt worn open over a pink tee with beige trousers',
    seen: 'Deck page 2 #3',
    garments: [
      { garment: G.shirt, with: 'stripe' },
      { colour: C.pink, garment: 'tee|t-shirt|top|knit' },
      { colour: C.beige, garment: G.trousers },
    ],
  },
  {
    id: 'ivory-long-cardigan-rust-top-rust-trousers',
    label: 'Ivory long cardigan over a rust top and rust trousers',
    seen: 'Deck page 2 #4',
    garments: [
      { colour: C.cream, garment: 'cardigan|coat|duster|jacket' },
      { colour: C.rust, garment: G.top },
      { colour: C.rust, garment: G.trousers },
    ],
  },
  {
    id: 'green-waistcoat-teal-trousers',
    label: 'Green double-breasted waistcoat top with teal trousers',
    seen: 'Deck page 2 #5 · report 4b35f2e2 Outfit 8',
    garments: [
      { colour: C.green, garment: 'waistcoat|vest|waistcoat-style' },
      { colour: C.teal, garment: G.trousers },
    ],
  },
  {
    id: 'rust-short-kurta-jeans',
    label: 'Rust short kurta with jeans',
    seen: 'Deck page 3 #1',
    garments: [
      { colour: C.rust, garment: 'kurta|kurti|tunic' },
      { garment: 'jeans|denim' },
    ],
  },
  {
    id: 'stripe-shirt-over-rust-kurta-white-trousers',
    label: 'Striped shirt over a rust printed kurta with white trousers',
    seen: 'Deck page 3 #2',
    garments: [
      { garment: `${G.shirt}|jacket`, with: 'stripe' },
      { colour: C.rust, garment: 'kurta|kurti|tunic' },
      { colour: C.white, garment: G.trousers },
    ],
  },
  {
    id: 'camel-blazer-cream-top-brown-midi-skirt',
    label: 'Camel blazer over a cream top with a brown satin midi skirt',
    seen: 'Deck page 3 #3 · report bc92ead9 Outfit 10',
    garments: [
      { colour: C.camel, garment: 'blazer|jacket' },
      { colour: C.cream, garment: G.top },
      { colour: C.brown, garment: G.skirt },
    ],
  },
  {
    id: 'pink-wrap-top-brown-trousers',
    label: 'Pink wrap top with brown trousers',
    seen: 'Deck page 3 #4',
    garments: [
      { colour: C.pink, garment: 'top|blouse', with: 'wrap' },
      { colour: C.brown, garment: G.trousers },
    ],
  },
  {
    id: 'rust-shirt-navy-trousers',
    label: 'Rust shirt with navy trousers',
    seen: 'Deck page 3 #5',
    garments: [
      // A collared shirt, not any rust blouse.
      { colour: C.rust, garment: 'shirt|overshirt' },
      { colour: C.navy, garment: G.trousers },
    ],
  },
];

/**
 * The banned outfit these garments make, if any. Pass the clothing pieces
 * (top, layer, bottom, dress); shoes and bags never decide a ban.
 */
export function bannedOutfitFor(pieces: Array<string | null | undefined>): BannedOutfit | null {
  const list = pieces.map(piece => (piece ?? '').trim()).filter(Boolean);
  if (!list.length) return null;
  return BANNED_OUTFITS.find(ban => ban.garments.every(g => list.some(piece => garmentMatches(piece, g)))) ?? null;
}
