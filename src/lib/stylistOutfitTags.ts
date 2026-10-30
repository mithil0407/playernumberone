/**
 * Fixed tags for every look in the women's outfit library.
 *
 * The engine used to guess what a look was from its wording on every run
 * ("blazer worn as the top" read as "no top", a "shell" read as sleeveless).
 * Each look is now tagged once (sleeves, neckline, length, co-ord, fit, which
 * shoes it works with, the occasions it suits...) and the tags were checked
 * against the look's picture. Client rules are matched to tags one to one.
 *
 * Tags live in outfitlibrarytags.json next to outfitlibrary.md. Each entry
 * keeps a hash of the look's text: if the library line is edited, its old tags
 * no longer apply and the look drops out until it is tagged again.
 *
 * This file is pure, so the engine, the tagging script and tests share it.
 */
import { createHash } from 'crypto';

export const OCCASIONS = ['work', 'everyday', 'party', 'festive', 'travel', 'date'] as const;
export type OutfitOccasionTag = typeof OCCASIONS[number];

export const TAG_VALUES = {
  wear: ['western', 'indian', 'fusion'],
  type: ['top_and_bottom', 'dress', 'jumpsuit', 'coord_set', 'suit', 'kurta_set', 'saree', 'lehenga', 'anarkali_gown'],
  sleeves: ['strapless', 'sleeveless', 'short', 'elbow', 'three_quarter', 'full'],
  neckline: ['high', 'collared', 'round', 'v', 'square', 'boat', 'deep', 'off_shoulder', 'one_shoulder', 'halter'],
  length: ['mini', 'above_knee', 'knee', 'midi', 'ankle', 'floor'],
  bottom: ['jeans', 'trousers', 'wide_leg_trousers', 'skirt', 'shorts', 'palazzo', 'salwar_churidar', 'leggings', 'none'],
  fit: ['bodycon', 'fitted', 'tailored', 'relaxed', 'oversized'],
  slit: ['none', 'low', 'high'],
  tuck: ['tucked', 'half_tucked', 'untucked', 'one_piece'],
  layer: ['none', 'blazer', 'jacket', 'cardigan', 'shrug', 'coat', 'waistcoat', 'kimono', 'dupatta', 'shirt', 'other'],
  shoes: ['flats', 'low_heel', 'high_heel', 'sneakers', 'boots', 'not_shown'],
  formality: ['casual', 'smart_casual', 'business', 'evening', 'festive'],
  print: ['solid', 'subtle', 'bold'],
  colourFamily: ['neutral', 'earthy', 'pastel', 'jewel', 'bright', 'dark'],
  fabric: ['cotton', 'linen', 'silk', 'satin', 'denim', 'knit', 'wool', 'leather', 'chiffon_georgette', 'net_organza', 'polyester', 'velvet', 'sequin', 'other'],
} as const;

type Of<K extends keyof typeof TAG_VALUES> = typeof TAG_VALUES[K][number];
export type ColourFamilyTag = Of<'colourFamily'>;

export interface OutfitLookTags {
  /** Hash of the look's text when it was tagged; a mismatch means the tags are stale. */
  look_hash: string;
  wear: Of<'wear'>;
  type: Of<'type'>;
  /** Of the base garment: the top, dress, kurta or blouse. */
  sleeves: Of<'sleeves'>;
  /** A sleeved layer (blazer, jacket, shrug, cardigan) is worn on and covers the arms. */
  arms_covered_by_layer: boolean;
  neckline: Of<'neckline'>;
  open_back: boolean;
  /** Hem of the dress or skirt; for trousers the trouser length; shorts are mini. */
  length: Of<'length'>;
  bottom: Of<'bottom'>;
  fit: Of<'fit'>;
  slit: Of<'slit'>;
  sheer: boolean;
  /** Any bare midriff: crop top, cut-out, knotted top. */
  midriff: boolean;
  tuck: Of<'tuck'>;
  layer: Of<'layer'>;
  shoes: {
    shown: Of<'shoes'>;
    /** Still looks right if the shoe is swapped for a flat in the same colour. */
    flats_ok: boolean;
    /** Still looks right on a small 1-2 inch heel. */
    low_heel_ok: boolean;
  };
  occasions: OutfitOccasionTag[];
  formality: Of<'formality'>;
  print: Of<'print'>;
  colours: {
    /** Plain colour names of the main garments, lead first: ["rust", "ivory", "denim blue"]. */
    main: string[];
    /** The family of the colour that leads the look (the top or dress, or the strongest colour). */
    lead_family: ColourFamilyTag;
    families: ColourFamilyTag[];
  };
  /** Satin, sequin, metallic, lamé: anything that shines. */
  shine: boolean;
  fabrics: Array<Of<'fabric'>>;
  /** Wool coat, roll-neck, heavy knit: only for cold weather. */
  winter: boolean;
  body: {
    /** Skims or hides the tummy: no tight tuck or cling at the midsection. */
    tummy_friendly: boolean;
    /** Skims the hips and thighs: no cling or extra volume there. */
    hip_friendly: boolean;
    /** Upper arms covered to at least the elbow, or the look is fine for heavier arms. */
    arms_friendly: boolean;
    /** Works on a woman under 5'3" without swamping her. */
    petite_friendly: boolean;
  };
  has_jewellery: boolean;
  has_eyewear: boolean;
  has_bag: boolean;
  /** Reads as a full wearable outfit for an Indian woman out of the house. */
  complete: boolean;
  /** Where the picture differs from the written look (the written look wins). */
  picture_mismatch: string;
  /** Anything a stylist should know about this look. */
  note: string;
}

export type OutfitTagFile = Record<string, OutfitLookTags>;

interface LookText {
  top?: string;
  dress?: string;
  layer?: string;
  bottom?: string;
  shoes?: string;
  accessories?: string;
  styling?: string;
}

/** A short stable hash of what the look says, so edited library lines lose their old tags. */
export function lookTextHash(look: LookText) {
  const text = [look.top, look.dress, look.layer, look.bottom, look.shoes, look.accessories, look.styling].map(part => (part ?? '').trim()).join('|');
  return createHash('sha1').update(text).digest('hex').slice(0, 12);
}

/** Words the model sometimes uses for a listed value. */
const ALIASES: Partial<Record<keyof typeof TAG_VALUES, Record<string, string>>> = {
  length: { maxi: 'ankle', full: 'floor', full_length: 'floor', cropped: 'ankle', calf: 'midi', calf_length: 'midi', tea: 'midi', below_knee: 'midi', knee_length: 'knee' },
  sleeves: { long: 'full', cap: 'short', puff: 'short', elbow_length: 'elbow', '3/4': 'three_quarter', none: 'sleeveless' },
  neckline: { scoop: 'round', crew: 'round', jewel: 'round', mandarin: 'high', turtleneck: 'high', mock: 'high', cowl: 'round', sweetheart: 'square', plunging: 'deep', shirt: 'collared' },
  fit: { loose: 'relaxed', slim: 'fitted', tight: 'bodycon', structured: 'tailored', flowy: 'relaxed' },
  bottom: { wide_leg: 'wide_leg_trousers', pants: 'trousers', culottes: 'wide_leg_trousers', salwar: 'salwar_churidar', churidar: 'salwar_churidar' },
};

function oneOf<K extends keyof typeof TAG_VALUES>(key: K, raw: unknown): Of<K> {
  const allowed = TAG_VALUES[key] as readonly string[];
  const value = typeof raw === 'string' ? (ALIASES[key]?.[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase()) : raw;
  if (typeof value !== 'string' || !allowed.includes(value)) throw new Error(`${key}: "${String(value)}" is not one of ${allowed.join(', ')}`);
  return value as Of<K>;
}

function bool(name: string, value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error(`${name} must be true or false`);
  return value;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Checks a model's tag answer and returns clean tags, or throws with what is wrong. */
export function parseOutfitLookTags(raw: unknown, lookHash: string): OutfitLookTags {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const shoes = (r.shoes ?? {}) as Record<string, unknown>;
  const colours = (r.colours ?? {}) as Record<string, unknown>;
  const body = (r.body ?? {}) as Record<string, unknown>;
  const occasions = Array.isArray(r.occasions) ? r.occasions : [];
  const families = Array.isArray(colours.families) ? colours.families : [];
  const fabrics = Array.isArray(r.fabrics) ? r.fabrics : [];
  const tags: OutfitLookTags = {
    look_hash: lookHash,
    wear: oneOf('wear', r.wear),
    type: oneOf('type', r.type),
    sleeves: oneOf('sleeves', r.sleeves),
    arms_covered_by_layer: bool('arms_covered_by_layer', r.arms_covered_by_layer),
    neckline: oneOf('neckline', r.neckline),
    open_back: bool('open_back', r.open_back),
    length: oneOf('length', r.length),
    bottom: oneOf('bottom', r.bottom),
    fit: oneOf('fit', r.fit),
    slit: oneOf('slit', r.slit),
    sheer: bool('sheer', r.sheer),
    midriff: bool('midriff', r.midriff),
    tuck: oneOf('tuck', r.tuck),
    layer: oneOf('layer', r.layer),
    shoes: {
      shown: oneOf('shoes', shoes.shown),
      flats_ok: bool('shoes.flats_ok', shoes.flats_ok),
      low_heel_ok: bool('shoes.low_heel_ok', shoes.low_heel_ok),
    },
    occasions: [...new Set(occasions.map(value => {
      if (!(OCCASIONS as readonly string[]).includes(value)) throw new Error(`occasion "${String(value)}" is not one of ${OCCASIONS.join(', ')}`);
      return value as OutfitOccasionTag;
    }))],
    formality: oneOf('formality', r.formality),
    print: oneOf('print', r.print),
    colours: {
      main: (Array.isArray(colours.main) ? colours.main : []).map(text).filter(Boolean).slice(0, 5),
      lead_family: oneOf('colourFamily', colours.lead_family),
      families: [...new Set(families.map(value => oneOf('colourFamily', value)))],
    },
    shine: bool('shine', r.shine),
    fabrics: [...new Set(fabrics.map(value => oneOf('fabric', value)))],
    winter: bool('winter', r.winter),
    body: {
      tummy_friendly: bool('body.tummy_friendly', body.tummy_friendly),
      hip_friendly: bool('body.hip_friendly', body.hip_friendly),
      arms_friendly: bool('body.arms_friendly', body.arms_friendly),
      petite_friendly: bool('body.petite_friendly', body.petite_friendly),
    },
    has_jewellery: bool('has_jewellery', r.has_jewellery),
    has_eyewear: bool('has_eyewear', r.has_eyewear),
    has_bag: bool('has_bag', r.has_bag),
    complete: bool('complete', r.complete),
    picture_mismatch: text(r.picture_mismatch),
    note: text(r.note),
  };
  if (!tags.occasions.length) throw new Error('occasions must list at least one occasion');
  if (!tags.colours.main.length) throw new Error('colours.main must name the main colours');
  if (!tags.colours.families.includes(tags.colours.lead_family)) tags.colours.families.unshift(tags.colours.lead_family);
  // One-piece looks have no separate bottom.
  if (['dress', 'jumpsuit', 'saree', 'lehenga', 'anarkali_gown'].includes(tags.type) && tags.tuck !== 'one_piece') tags.tuck = 'one_piece';
  return tags;
}

/** Tags for this look, or null when it was never tagged or its text changed since. */
export function tagsForLook(file: OutfitTagFile | null, look: LookText & { id: string }): OutfitLookTags | null {
  const tags = file?.[look.id];
  if (!tags) return null;
  return tags.look_hash === lookTextHash(look) ? tags : null;
}

/** What the tagging model is told each tag means. Kept here so the script and the docs agree. */
export const TAG_GUIDE = `Tag the outfit with these fields. Use only the listed values.
- wear: western | indian | fusion (Indian pieces worn with Western ones, e.g. kurta with jeans).
- type: top_and_bottom | dress | jumpsuit | coord_set (top and bottom in the same fabric/print, sold as a set) | suit (matching blazer and trousers/skirt) | kurta_set | saree | lehenga | anarkali_gown.
- sleeves (of the top, dress, kurta or blouse itself, NOT the layer): strapless | sleeveless (includes cami, tank, halter, waistcoat worn as a top) | short (incl. cap, puff, tee) | elbow | three_quarter | full.
- arms_covered_by_layer: true only when a sleeved layer (blazer, jacket, shrug, cardigan, kimono, shirt) is worn ON, not draped on the shoulders or carried.
- neckline: high | collared | round | v (a modest V) | square | boat | deep (plunging, deep V, low scoop, open to the chest, a blazer worn with nothing under) | off_shoulder | one_shoulder | halter.
- open_back: true for backless or a deep open back.
- length: hem of the dress, skirt, kurta set or saree; for trousers/jeans use ankle or floor; shorts and mini skirts are mini. above_knee = a few inches above the knee.
- bottom: jeans | trousers | wide_leg_trousers | skirt | shorts | palazzo | salwar_churidar | leggings | none (one-piece looks).
- fit: bodycon (tight, clings everywhere) | fitted (close but not tight) | tailored (structured, sharp) | relaxed (easy, skims the body) | oversized (deliberately big, boxy or baggy).
- slit: none | low (below the knee) | high (at or above the knee).
- sheer: any see-through panel, mesh, organza, lace you can see skin through.
- midriff: any bare midriff (crop top, cut-out, knotted top).
- tuck: tucked | half_tucked | untucked (worn out or long) | one_piece.
- layer: the outer piece worn over the base: none | blazer | jacket | cardigan | shrug | coat | waistcoat (over a top) | kimono | dupatta | shirt (open over a top) | other.
- shoes.shown: flats | low_heel (up to about 2 inches, incl. block and kitten heels) | high_heel | sneakers | boots | not_shown.
- shoes.flats_ok: would the outfit still look right and finished with a flat (pointed flats, flat sandals, juttis, loafers) in the same colour? Floor-length gowns, sharp suits and evening looks that need height may be false. Most day looks are true.
- shoes.low_heel_ok: would it look right on a small 1-2 inch block or kitten heel?
- occasions: every occasion an Indian woman could wear this to, from: work (office, meetings), everyday (errands, home, casual outings, brunch), party (evening events, parties, cocktails), festive (festivals, pujas, weddings, family functions), travel (vacation, sightseeing, flights), date (dinner out, date night). Usually 1-3.
- formality: casual | smart_casual | business | evening | festive.
- print: solid (plain or tonal) | subtle (fine stripe, small print, light texture) | bold (large or busy print, strong pattern).
- colours.main: plain names of the main garment colours, lead first, e.g. ["rust", "ivory", "denim blue"].
- colours.lead_family and colours.families, from: neutral (black, white, ivory, beige, grey, camel, brown, denim) | earthy (rust, terracotta, olive, mustard, khaki, burnt orange, chocolate, navy) | pastel (baby blue, butter yellow, sage, blush, lilac, mint, powder pink, peach) | jewel (emerald, sapphire, ruby, plum, teal, wine, deep magenta) | bright (red, cobalt, fuchsia, orange, lime, hot pink) | dark (charcoal, black-led, deep navy, oxblood). lead_family is the family of the colour that leads the look.
- shine: satin, sequin, metallic or lamé anywhere in the garments.
- fabrics: from cotton | linen | silk | satin | denim | knit | wool | leather | chiffon_georgette | net_organza | polyester | velvet | sequin | other. Best guess from words and picture.
- winter: wool coat, roll-neck, heavy knit, boots for cold weather.
- body.tummy_friendly: skims or hides the tummy (untucked, A-line, open layer, wrap, empire); false if it is tight or tucked at the midsection.
- body.hip_friendly: skims hips and thighs (straight, wide-leg, A-line, flowing); false for skinny, pencil, bodycon, or volume at the hip.
- body.arms_friendly: upper arms covered to at least the elbow by the garment or a worn layer.
- body.petite_friendly: works on a woman under 5'3" (no swamping volume or shapeless length).
- has_jewellery, has_eyewear, has_bag: whether the written look already includes them.
- complete: true if this is a full, wearable outfit an Indian woman would wear out; false if a piece is missing, it is only a garment, or it is unwearable as styled.
- picture_mismatch: if the picture shows something different from the written look (e.g. sleeves when the text says sleeveless), say what in a few words, else "". The written look is the truth.
- note: anything a stylist should know in a few words, else "".`;

/**
 * Where a garment's own words are explicit, they win over the model's tag:
 * "baggy jeans" and "boxy shirt" are oversized, not relaxed; "mini" is mini.
 * A look marked incomplete only because no shoe is shown is complete: the
 * engine adds a plain shoe. Returns the corrected tags and what changed.
 */
export function correctTagsFromWords(look: LookText, tags: OutfitLookTags): { tags: OutfitLookTags; changes: string[] } {
  const next: OutfitLookTags = { ...tags, shoes: { ...tags.shoes }, body: { ...tags.body }, colours: { ...tags.colours } };
  const changes: string[] = [];
  const garments = [look.top, look.dress, look.bottom].filter(Boolean).join(' / ').toLowerCase();
  const set = <K extends keyof OutfitLookTags>(key: K, value: OutfitLookTags[K], why: string) => {
    if (next[key] === value) return;
    changes.push(`${String(key)} ${String(next[key])} → ${String(value)} (${why})`);
    next[key] = value;
  };
  // "Oversized gold buttons" is not an oversized garment; "oversized shirt" is.
  const OVERSIZED_RE = /\b(?:baggy|boxy|slouchy)\b|\boversized\s+(?:fit\s+)?(?:[a-z-]+\s+)?(?:shirt|tee|t-shirt|top|blouse|sweater|jumper|knit|jeans|trousers|pants|dress|kurta|tunic|hoodie|sweatshirt|cardigan)\b/;
  if (OVERSIZED_RE.test(garments) && next.fit !== 'oversized') set('fit', 'oversized', 'the garment says baggy/boxy/oversized');
  if (/\b(?:bodycon|body-con|skin-tight|second-skin)\b/.test(garments)) set('fit', 'bodycon', 'the garment says bodycon');
  if (/\bmini\b/.test(garments)) set('length', 'mini', 'the garment says mini');
  if (/\bco-?ord\b/.test(garments) && next.type === 'top_and_bottom') set('type', 'coord_set', 'the look says co-ord');
  if (!next.complete && /barefoot|shoe|footwear/i.test(next.note) && !/\b(?:top|base|bottom|blouse|trousers|skirt)\b/i.test(next.note)) set('complete', true, 'only the shoe was missing; a plain shoe is added');
  return { tags: next, changes };
}
