// Style Membership quiz: what her answers mean. Pure and isomorphic, so the
// quiz, the result page, the APIs and the WhatsApp hand-off read her the same
// way, and the rules can be tested. Season names match agentColourSeason.ts so
// the agent recognises them.

export type AgeBand = '18-24' | '25-34' | '35-44' | '45+';
export type SkinTone = 'fair' | 'wheatish' | 'medium' | 'dusky' | 'deep';
export type ShapeId = 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle';
export type Undertone = 'warm' | 'cool' | 'neutral';

export interface QuizAnswers {
  age?: AgeBand;
  dressFor?: string[];
  climate?: string;
  goal?: string;
  gettingReady?: string;
  heightCm?: number;
  shape?: ShapeId | 'not-sure';
  shapeShoulders?: 'shoulders' | 'hips' | 'same';
  shapeGain?: 'tummy' | 'hips' | 'evenly' | 'bust';
  showOff?: string[];
  playDown?: string[];
  bodyChanged?: string;
  skinTone?: SkinTone;
  metal?: 'gold' | 'silver' | 'both';
  veins?: 'green' | 'blue' | 'both' | 'unsure';
  compliments?: string[];
  swipes?: Record<string, 'love' | 'skip'>;
  stores?: string[];
  budgetEveryday?: string;
  budgetOccasion?: string;
  size?: string;
  comingUp?: string[];
  weddingFunctions?: string;
  extras?: 'yes' | 'no';
}

export const SKIN_TONES: Array<{ id: SkinTone; label: string; hex: string; image: string }> = [
  { id: 'fair', label: 'Fair', hex: '#EBC9A8', image: '/membership/skin-fair.webp' },
  { id: 'wheatish', label: 'Wheatish', hex: '#D7A57A', image: '/membership/skin-wheatish.webp' },
  { id: 'medium', label: 'Medium', hex: '#B9825A', image: '/membership/skin-medium.webp' },
  { id: 'dusky', label: 'Dusky', hex: '#8E5B3C', image: '/membership/skin-dusky.webp' },
  { id: 'deep', label: 'Deep', hex: '#5E3A26', image: '/membership/skin-deep.webp' },
];

export interface ShapeGuide {
  id: ShapeId;
  label: string;
  short: string;
  illustration: string;
  before: { image: string; caption: string };
  after: { image: string; caption: string };
  /** The one-line rule her looks follow. */
  rule: string;
  /** Skin tone of the model in the before/after pair. */
  modelTone: SkinTone;
}

export const SHAPES: Record<ShapeId, ShapeGuide> = {
  pear: {
    id: 'pear',
    label: 'Pear',
    short: 'Hips wider than shoulders',
    illustration: '/membership/shape-pear.webp',
    before: { image: '/membership/ba-pear-before.webp', caption: 'Short straight kurta + wide palazzos' },
    after: { image: '/membership/ba-pear-after.webp', caption: 'A-line kurta + straight pants' },
    rule: 'Detail on top, simple and straight below.',
    modelTone: 'wheatish',
  },
  apple: {
    id: 'apple',
    label: 'Apple',
    short: 'Fuller through the middle',
    illustration: '/membership/shape-apple.webp',
    before: { image: '/membership/ba-apple-before.webp', caption: 'Short top, belt at the tummy' },
    after: { image: '/membership/ba-apple-after.webp', caption: 'V-neck, one colour, long blazer' },
    rule: 'V-necks and long, straight lines.',
    modelTone: 'medium',
  },
  hourglass: {
    id: 'hourglass',
    label: 'Hourglass',
    short: 'Balanced, with a defined waist',
    illustration: '/membership/shape-hourglass.webp',
    before: { image: '/membership/ba-hourglass-before.webp', caption: 'Boxy kurta that hides the waist' },
    after: { image: '/membership/ba-hourglass-after.webp', caption: 'Wrap dress tied at the waist' },
    rule: 'Show your waist.',
    modelTone: 'dusky',
  },
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    short: 'Straight, shoulders ≈ hips',
    illustration: '/membership/shape-rectangle.webp',
    before: { image: '/membership/ba-rectangle-before.webp', caption: 'Shapeless shift dress' },
    after: { image: '/membership/ba-rectangle-after.webp', caption: 'Peplum top + flared trousers' },
    rule: 'Add a waist with peplums and flares.',
    modelTone: 'fair',
  },
  'inverted-triangle': {
    id: 'inverted-triangle',
    label: 'Inverted triangle',
    short: 'Shoulders wider than hips',
    illustration: '/membership/shape-inverted-triangle.webp',
    before: { image: '/membership/ba-invtri-before.webp', caption: 'Puff sleeves + skinny jeans' },
    after: { image: '/membership/ba-invtri-after.webp', caption: 'V-neck kurta + flared sharara' },
    rule: 'Keep the top simple. Add volume below.',
    modelTone: 'deep',
  },
};

export const SHAPE_ORDER: ShapeId[] = ['apple', 'pear', 'hourglass', 'rectangle', 'inverted-triangle'];

/** Her shape, worked out from the two quick questions when she isn't sure. */
export function resolveShape(answers: QuizAnswers): ShapeId | null {
  if (answers.shape && answers.shape !== 'not-sure') return answers.shape;
  if (answers.shape !== 'not-sure') return null;
  const { shapeShoulders: wider, shapeGain: gain } = answers;
  if (!wider) return null;
  if (gain === 'tummy') return 'apple';
  if (wider === 'shoulders') return 'inverted-triangle';
  if (wider === 'hips') return 'pear';
  if (gain === 'bust') return 'inverted-triangle';
  if (gain === 'hips') return 'hourglass';
  return 'rectangle';
}

const WARM_COMPLIMENTS = new Set(['maroon', 'mustard', 'rust', 'olive']);
const COOL_COMPLIMENTS = new Set(['navy', 'emerald', 'blush', 'white', 'black', 'lavender']);

export interface UndertoneReading {
  undertone: Undertone;
  /** "Likely Warm" reads well when two signals agree; "Leaning" when only one does. */
  label: string;
  score: number;
}

/** Gold vs silver and the vein check carry the most weight; compliments break ties. */
export function readUndertone(answers: QuizAnswers): UndertoneReading {
  let score = 0;
  if (answers.metal === 'gold') score += 2;
  if (answers.metal === 'silver') score -= 2;
  if (answers.veins === 'green') score += 2;
  if (answers.veins === 'blue') score -= 2;
  for (const colour of answers.compliments ?? []) {
    if (WARM_COMPLIMENTS.has(colour)) score += 0.5;
    if (COOL_COMPLIMENTS.has(colour)) score -= 0.5;
  }
  const undertone: Undertone = score >= 1.5 ? 'warm' : score <= -1.5 ? 'cool' : 'neutral';
  const strong = Math.abs(score) >= 3;
  const label = undertone === 'neutral'
    ? 'Likely Neutral'
    : `${strong ? 'Likely' : 'Leaning'} ${undertone === 'warm' ? 'Warm' : 'Cool'}`;
  return { undertone, label, score };
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface SeasonPalette {
  name: string;
  family: 'spring' | 'summer' | 'autumn' | 'winter';
  best: Swatch[];
  avoid: Swatch[];
  metal: 'gold' | 'silver' | 'both';
  line: string;
}

const s = (name: string, hex: string): Swatch => ({ name, hex });

export const SEASON_PALETTES: Record<string, SeasonPalette> = {
  'Light Spring': { name: 'Light Spring', family: 'spring', metal: 'gold', line: 'Light, warm and fresh: peach, aqua and butter yellow.', best: [s('Peach', '#F6B49A'), s('Coral pink', '#F08A7E'), s('Light aqua', '#7FD1C7'), s('Butter yellow', '#F5D77E'), s('Ivory', '#FFF6E3'), s('Camel', '#C8A27A')], avoid: [s('Black', '#111111'), s('Burgundy', '#5E1A2B'), s('Charcoal', '#36393F')] },
  'Warm Spring': { name: 'Warm Spring', family: 'spring', metal: 'gold', line: 'Warm and bright: coral, golden yellow and warm turquoise.', best: [s('Coral', '#F26B4F'), s('Golden yellow', '#F2B33D'), s('Warm turquoise', '#2BB3A3'), s('Leaf green', '#6DA544'), s('Ivory', '#FBF1DC'), s('Light camel', '#C99B67')], avoid: [s('Icy grey', '#C9CDD2'), s('Black', '#111111'), s('Magenta', '#B0246E')] },
  'Bright Spring': { name: 'Bright Spring', family: 'spring', metal: 'gold', line: 'Clear and vivid: hot coral, turquoise and kelly green.', best: [s('Hot coral', '#FF5A4E'), s('Turquoise', '#00A6A6'), s('Bright yellow', '#FFC93C'), s('Kelly green', '#2DA44E'), s('True red', '#E0262E'), s('Ivory', '#FFF8E7')], avoid: [s('Dusty rose', '#C99BA5'), s('Mushroom', '#A8998A'), s('Olive', '#6B6F2A')] },
  'Light Summer': { name: 'Light Summer', family: 'summer', metal: 'silver', line: 'Soft and cool: powder blue, lavender and soft pink.', best: [s('Soft pink', '#F2B8C6'), s('Powder blue', '#AFCBE3'), s('Lavender', '#C9B8E3'), s('Mint', '#A8D8C8'), s('Dove grey', '#C3C5C8'), s('Soft white', '#F7F5F2')], avoid: [s('Black', '#111111'), s('Orange', '#E8731C'), s('Mustard', '#C9951B')] },
  'Cool Summer': { name: 'Cool Summer', family: 'summer', metal: 'silver', line: 'Cool and calm: rose, lavender and soft navy.', best: [s('Rose pink', '#D98AA6'), s('Powder blue', '#9DBAD5'), s('Lavender', '#B9A6D3'), s('Soft navy', '#3E4F78'), s('Cool grey', '#9EA3AB'), s('Soft white', '#F4F4F2')], avoid: [s('Orange', '#E8731C'), s('Mustard', '#C9951B'), s('Camel', '#B98552')] },
  'Soft Summer': { name: 'Soft Summer', family: 'summer', metal: 'both', line: 'Muted and cool: dusty rose, soft teal and mauve.', best: [s('Dusty rose', '#C99BA5'), s('Soft teal', '#6E9C9F'), s('Mauve', '#A884A1'), s('Slate blue', '#6F7FA1'), s('Soft grey', '#A7A9AC'), s('Soft white', '#F2EFEA')], avoid: [s('Neon pink', '#FF2E93'), s('Bright orange', '#FF6A13'), s('Pure black', '#0D0D0D')] },
  'Soft Autumn': { name: 'Soft Autumn', family: 'autumn', metal: 'gold', line: 'Muted and warm: sage, camel and dusty coral.', best: [s('Sage', '#9AA67F'), s('Camel', '#C19A6B'), s('Dusty coral', '#D08770'), s('Soft teal', '#5E8C85'), s('Mushroom', '#A8998A'), s('Cream', '#F1E6D2')], avoid: [s('Pure black', '#0D0D0D'), s('Fuchsia', '#D6247F'), s('Icy blue', '#CFE3F2')] },
  'Warm Autumn': { name: 'Warm Autumn', family: 'autumn', metal: 'gold', line: 'Rich and warm: rust, mustard and olive.', best: [s('Rust', '#A9471E'), s('Mustard', '#C9951B'), s('Olive', '#6B6F2A'), s('Camel', '#B98552'), s('Deep teal', '#1F5E5B'), s('Cream', '#F2E6CF')], avoid: [s('Icy pink', '#F3D1E0'), s('Cool grey', '#9EA3AB'), s('Fuchsia', '#D6247F')] },
  'Deep Autumn': { name: 'Deep Autumn', family: 'autumn', metal: 'gold', line: 'Deep and warm: maroon, forest green and burnt orange.', best: [s('Maroon', '#6E1F2A'), s('Deep teal', '#18484A'), s('Burnt orange', '#B2541B'), s('Forest green', '#2E4A2B'), s('Chocolate', '#4A2C1D'), s('Mustard', '#B88A1E')], avoid: [s('Pastel pink', '#F6C6D4'), s('Powder blue', '#AFCBE3'), s('Icy grey', '#C9CDD2')] },
  'Deep Winter': { name: 'Deep Winter', family: 'winter', metal: 'silver', line: 'Deep and clear: emerald, royal blue and magenta.', best: [s('Emerald', '#0B7A55'), s('Royal blue', '#2747A6'), s('Magenta', '#B0246E'), s('Burgundy', '#6B1530'), s('Black', '#111111'), s('Pure white', '#FFFFFF')], avoid: [s('Beige', '#D9C3A0'), s('Mustard', '#C9951B'), s('Peach', '#F6B49A')] },
  'Cool Winter': { name: 'Cool Winter', family: 'winter', metal: 'silver', line: 'Cool and crisp: true red, royal purple and navy.', best: [s('True red', '#C8102E'), s('Royal purple', '#5B2C83'), s('Navy', '#1F2A55'), s('Icy pink', '#F3D1E0'), s('Charcoal', '#36393F'), s('Pure white', '#FFFFFF')], avoid: [s('Orange', '#E8731C'), s('Camel', '#B98552'), s('Olive', '#6B6F2A')] },
  'Bright Winter': { name: 'Bright Winter', family: 'winter', metal: 'silver', line: 'High contrast: fuchsia, cobalt and emerald.', best: [s('Fuchsia', '#D6247F'), s('Cobalt', '#1D4ED8'), s('Emerald', '#009B6B'), s('Lemon', '#F4E04D'), s('Black', '#0D0D0D'), s('White', '#FFFFFF')], avoid: [s('Dusty rose', '#C99BA5'), s('Camel', '#B98552'), s('Mushroom', '#A8998A')] },
};

export const PALETTE_IMAGES: Record<SeasonPalette['family'], string> = {
  spring: '/membership/palette-spring.webp',
  summer: '/membership/palette-summer.webp',
  autumn: '/membership/palette-autumn.webp',
  winter: '/membership/palette-winter.webp',
};

/**
 * A likely season from her answers alone. The selfie replaces it with a real
 * reading (agentColourSeason.seasonFor); until then the page says "likely".
 */
export function likelySeason(answers: QuizAnswers): SeasonPalette | null {
  const tone = answers.skinTone;
  if (!tone) return null;
  const { undertone } = readUndertone(answers);
  const lovesContrast = (answers.compliments ?? []).some(colour => colour === 'black' || colour === 'white' || colour === 'emerald');
  const table: Record<Undertone, Record<SkinTone, string>> = {
    warm: { fair: 'Light Spring', wheatish: 'Warm Spring', medium: 'Warm Autumn', dusky: 'Warm Autumn', deep: 'Deep Autumn' },
    cool: { fair: 'Cool Summer', wheatish: 'Cool Summer', medium: 'Soft Summer', dusky: 'Deep Winter', deep: 'Deep Winter' },
    neutral: { fair: 'Soft Summer', wheatish: 'Soft Autumn', medium: 'Soft Autumn', dusky: 'Soft Autumn', deep: lovesContrast ? 'Deep Winter' : 'Deep Autumn' },
  };
  return SEASON_PALETTES[table[undertone][tone]];
}

export function paletteFor(seasonName: string | null | undefined): SeasonPalette | null {
  if (!seasonName) return null;
  return SEASON_PALETTES[seasonName] ?? null;
}

export type StyleVibe = 'classic' | 'minimal' | 'romantic' | 'bold' | 'glam' | 'relaxed' | 'eclectic' | 'modern' | 'traditional';
export type WearType = 'indian' | 'fusion' | 'western';
export type DressLevel = 'casual' | 'smart' | 'dressy';
export type ColourStory = 'neutral' | 'colour' | 'print';

export interface SwipeLook {
  id: string;
  /** The pin on the ICONIK Pinterest board (outfitlibrarypinterest.md) this look is taken from. */
  pin: number;
  label: string;
  detail: string;
  image: string;
  tone: SkinTone;
  wear: WearType;
  dress: DressLevel;
  vibes: StyleVibe[];
  colour: ColourStory;
  /** The styling formula, in plain words, for her profile and the stylist. */
  formula: string;
  /** The pin's outfit, garment by garment, as the image model must draw it (no invention). */
  outfit: string;
  /** Body shapes this look flatters, by ICONIK's shape rules. */
  suits: ShapeId[];
}

const ALL_SHAPES: ShapeId[] = ['apple', 'pear', 'hourglass', 'rectangle', 'inverted-triangle'];

// Twelve looks from the ICONIK Pinterest board, each chosen to test a different
// direction (Indian / Indo-western / western; casual to dressed up; neutral,
// colour or print), so her loves and skips describe her style in detail.
export const SWIPE_LOOKS: SwipeLook[] = [
  { id: 'blazer-column', pin: 15, label: 'Black with a camel blazer', detail: 'Black top and wide trousers, open camel blazer', image: '/membership/swipe-blazer-column.webp', tone: 'medium', wear: 'western', dress: 'smart', vibes: ['classic', 'modern'], colour: 'neutral', formula: 'one dark colour head to toe, with a camel blazer on top', outfit: 'a black sleeveless surplice-neck top, a camel double-breasted blazer worn open with the sleeves long, black high-waisted wide-leg trousers, black pointed pumps, a black structured top-handle bag, a delicate gold necklace', suits: ALL_SHAPES },
  { id: 'kurta-shrug', pin: 48, label: 'Cream kurta set with a linen shrug', detail: 'Printed kurta, straight trousers, open linen layer', image: '/membership/swipe-kurta-shrug.webp', tone: 'wheatish', wear: 'indian', dress: 'smart', vibes: ['classic', 'minimal'], colour: 'neutral', formula: 'a tonal kurta set with a light layer worn open', outfit: 'a cream printed straight kurta with a finely embroidered neckline, a beige linen shrug-jacket worn open over it, matching cream straight trousers, tan flat leather slides, gold jhumka earrings', suits: ALL_SHAPES },
  { id: 'tee-trousers', pin: 2, label: 'White tee and pleated trousers', detail: 'Half-tucked tee, wide trousers, white sneakers', image: '/membership/swipe-tee-trousers.webp', tone: 'fair', wear: 'western', dress: 'casual', vibes: ['minimal', 'relaxed'], colour: 'neutral', formula: 'a plain tee half-tucked into wide trousers with a belt', outfit: 'a plain white crew-neck tee half-tucked at the front so a slim black belt with a gold buckle shows, taupe pleated high-waisted wide-leg trousers, clean white leather sneakers, a black oversized tote', suits: ['pear', 'hourglass', 'rectangle', 'inverted-triangle'] },
  { id: 'kurta-jacket-jeans', pin: 218, label: 'Kurta, ikat jacket and jeans', detail: 'Mustard kurta, belted ikat jacket, straight jeans', image: '/membership/swipe-kurta-jacket-jeans.webp', tone: 'dusky', wear: 'fusion', dress: 'casual', vibes: ['eclectic', 'bold'], colour: 'print', formula: 'a short kurta over jeans, with a belted jacket', outfit: 'a mustard-yellow sleeveless A-line kurta to mid-thigh, a blue ikat-print sleeveless jacket over it, a wide brown leather belt over the jacket at the waist, mid-blue straight jeans, brown flat sandals, a silver statement necklace', suits: ['pear', 'hourglass', 'rectangle', 'inverted-triangle'] },
  { id: 'cobalt-blouse', pin: 12, label: 'Cobalt blouse, cream trousers', detail: 'Flutter-sleeve blouse tucked into pleated trousers', image: '/membership/swipe-cobalt-blouse.webp', tone: 'deep', wear: 'western', dress: 'smart', vibes: ['bold', 'classic'], colour: 'colour', formula: 'one strong colour on top, a soft neutral below', outfit: 'a cobalt-blue V-neck flutter-sleeve blouse fully tucked into cream high-waisted pleated wide-leg trousers, nude ballet flats, a natural woven tote, gold hoop earrings', suits: ['pear', 'hourglass', 'rectangle'] },
  { id: 'festive-sharara', pin: 89, label: 'Sea-green sharara set', detail: 'Embroidered kurta, net dupatta, sharara', image: '/membership/swipe-festive-sharara.webp', tone: 'wheatish', wear: 'indian', dress: 'dressy', vibes: ['traditional', 'romantic'], colour: 'colour', formula: 'a matching festive set in one colour, gold at the neck', outfit: 'a sea-green embroidered kurta with three-quarter sleeves, a matching sea-green net dupatta draped over one shoulder, a matching flared sharara, cream embroidered juttis, a gold choker necklace', suits: ['apple', 'hourglass', 'rectangle', 'inverted-triangle'] },
  { id: 'polka-midi', pin: 22, label: 'Polka-dot midi dress', detail: 'Puff sleeves, nipped waist, fluted hem', image: '/membership/swipe-polka-midi.webp', tone: 'medium', wear: 'western', dress: 'dressy', vibes: ['romantic', 'classic'], colour: 'print', formula: 'a feminine midi dress with soft sleeves and a defined waist', outfit: 'a cream midi dress with small black polka dots, a modest V-neckline, puff-shouldered three-quarter sleeves, a waist defined by the cut and a fluted hem, black pointed pumps, a small black clutch', suits: ['pear', 'hourglass', 'rectangle'] },
  { id: 'linen-kurta', pin: 520, label: 'Brown linen kurta, striped trousers', detail: 'Short-sleeve kurta, striped straight pants, mules', image: '/membership/swipe-linen-kurta.webp', tone: 'dusky', wear: 'indian', dress: 'casual', vibes: ['relaxed', 'minimal'], colour: 'neutral', formula: 'an easy linen kurta over striped trousers, all in browns', outfit: 'a chocolate-brown linen kurta with short sleeves and a curved hem worn long, brown-and-cream striped straight trousers, brown flat leather mules, a slim watch', suits: ALL_SHAPES },
  { id: 'leopard-magenta', pin: 32, label: 'Leopard blouse, magenta trousers', detail: 'Print on top, bright wide trousers below', image: '/membership/swipe-leopard-magenta.webp', tone: 'fair', wear: 'western', dress: 'smart', vibes: ['bold', 'eclectic'], colour: 'print', formula: 'a print on one half, a bright colour on the other', outfit: 'an opaque leopard-print high-neck cap-sleeve blouse fully tucked into magenta-pink high-waisted wide-leg trousers, snakeskin pointed heels, a navy quilted mini bag on a chain', suits: ['pear', 'hourglass', 'rectangle'] },
  { id: 'anarkali', pin: 158, label: 'Blush embroidered anarkali', detail: 'Fitted bodice, full skirt, sheer sleeves', image: '/membership/swipe-anarkali.webp', tone: 'deep', wear: 'indian', dress: 'dressy', vibes: ['glam', 'romantic', 'traditional'], colour: 'colour', formula: 'one statement festive piece with long earrings', outfit: 'a blush-pink embroidered anarkali gown with a V-neck, a fitted embroidered bodice, a full flared floor-length skirt and sheer bishop sleeves with embellished cuffs, long gold chandelier earrings', suits: ALL_SHAPES },
  { id: 'chambray-blazer', pin: 34, label: 'Chambray shirt, camel blazer, jeans', detail: 'Shirt tucked in, blazer, cropped jeans, flats', image: '/membership/swipe-chambray-blazer.webp', tone: 'wheatish', wear: 'western', dress: 'smart', vibes: ['classic', 'relaxed'], colour: 'neutral', formula: 'a shirt and blazer with jeans and flats', outfit: 'a light-blue chambray button-down shirt tucked in with the collar and cuffs folded out over a camel blazer, a brown belt, mid-blue straight-leg jeans cropped at the ankle, nude ballet flats, a blush quilted tote', suits: ['pear', 'hourglass', 'rectangle', 'inverted-triangle'] },
  { id: 'waistcoat', pin: 243, label: 'Navy waistcoat as a top', detail: 'Gold buttons, cream wide-leg trousers', image: '/membership/swipe-waistcoat.webp', tone: 'medium', wear: 'western', dress: 'smart', vibes: ['modern', 'bold'], colour: 'neutral', formula: 'a tailored waistcoat worn as the top, with wide trousers', outfit: 'a navy sleeveless tailored waistcoat with gold buttons worn buttoned as the top, cream high-waisted wide-leg trousers, nude pointed heels, gold statement earrings', suits: ['pear', 'hourglass', 'rectangle', 'inverted-triangle'] },
];

/** On-model looks from the first image set, still used for result-page looks. */
const EXTRA_LOOKS: Array<{ image: string; detail: string; tone: SkinTone; occasions: string[] }> = [
  { image: '/membership/look-office-kurta.webp', detail: 'Rust linen kurta, ivory straight pants', tone: 'wheatish', occasions: ['office'] },
  { image: '/membership/look-work-saree.webp', detail: 'Beige handloom saree, maroon border', tone: 'dusky', occasions: ['office'] },
  { image: '/membership/look-blazer.webp', detail: 'Camel blazer, ivory shell, black trousers', tone: 'medium', occasions: ['office'] },
  { image: '/membership/look-coord.webp', detail: 'Taupe linen co-ord', tone: 'fair', occasions: ['weekend'] },
  { image: '/membership/look-indowestern.webp', detail: 'Mustard angrakha wrap dress', tone: 'deep', occasions: ['weekend'] },
  { image: '/membership/look-festive-lehenga.webp', detail: 'Dusty pink lehenga, gota work', tone: 'wheatish', occasions: ['festive', 'wedding'] },
  { image: '/membership/look-jeans-kurti.webp', detail: 'White chikankari kurti, straight jeans', tone: 'medium', occasions: ['weekend'] },
  { image: '/membership/look-maxi.webp', detail: 'Terracotta maxi, light shirt', tone: 'dusky', occasions: ['weekend'] },
];

export interface StyleArchetype {
  id: StyleVibe | 'explorer';
  name: string;
  line: string;
}

const ARCHETYPES: Record<StyleArchetype['id'], StyleArchetype> = {
  classic: { id: 'classic', name: 'Modern Classic', line: 'Clean, polished pieces that never date.' },
  minimal: { id: 'minimal', name: 'Quiet Minimal', line: 'Calm colours, simple shapes, nothing fussy.' },
  romantic: { id: 'romantic', name: 'Soft Romantic', line: 'Soft fabrics, gentle shapes and a feminine touch.' },
  bold: { id: 'bold', name: 'Colour Confident', line: 'Strong colours and prints, worn with ease.' },
  glam: { id: 'glam', name: 'Evening Glam', line: 'You love a statement and dressing up.' },
  relaxed: { id: 'relaxed', name: 'Easy Relaxed', line: 'Comfort first, but always put together.' },
  eclectic: { id: 'eclectic', name: 'Free-Spirited Mix', line: 'You mix Indian and western, prints and colour, your own way.' },
  modern: { id: 'modern', name: 'Sharp Modern', line: 'Tailored, current and a little trend-led.' },
  traditional: { id: 'traditional', name: 'Graceful Traditional', line: 'Indian wear is home. We keep it fresh, not dated.' },
  explorer: { id: 'explorer', name: 'Open Explorer', line: 'Nothing grabbed you yet. That’s useful too: we’ll try a few directions with you.' },
};

/** Words for the second direction ("…, with a tailored side"); none repeats an archetype name. */
const VIBE_WORDS: Record<StyleVibe, string> = {
  classic: 'classic', minimal: 'minimal', romantic: 'feminine', bold: 'colourful', glam: 'glam',
  relaxed: 'relaxed', eclectic: 'playful', modern: 'tailored', traditional: 'traditional',
};

export interface StyleProfile {
  archetype: StyleArchetype;
  /** Second-strongest direction, e.g. "with a minimal side". */
  secondVibe: StyleVibe | null;
  loved: SwipeLook[];
  skipped: SwipeLook[];
  /** Plain one-liners for her result and the stylist. */
  wearLine: string;
  dressLine: string;
  colourLine: string;
  formulas: string[];
  avoidLine: string | null;
}

function tally<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Her style in detail, read from what she loved and skipped. */
export function styleProfile(answers: QuizAnswers): StyleProfile {
  const loved = SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love');
  const skipped = SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'skip');
  // A look's first vibe counts double: it is what the look is mostly about.
  const vibes = tally(loved.flatMap(look => [look.vibes[0], ...look.vibes]));
  const archetype = vibes.length ? ARCHETYPES[vibes[0][0]] : ARCHETYPES.explorer;
  const secondVibe = vibes.find(([vibe]) => vibe !== vibes[0]?.[0])?.[0] ?? null;

  const wear = tally(loved.map(look => look.wear));
  const has = (type: WearType) => loved.some(look => look.wear === type);
  const wearLine = !loved.length
    ? 'Still open: we’ll show you both Indian and western'
    : has('indian') && has('western')
      ? has('fusion') ? 'A real mix: Indian, western and Indo-western' : 'Both Indian and western'
      : wear[0][0] === 'indian' ? (has('fusion') ? 'Mostly Indian, with some Indo-western' : 'Mostly Indian wear')
        : wear[0][0] === 'fusion' ? 'Indo-western first'
          : has('fusion') ? 'Mostly western, with some Indo-western' : 'Mostly western wear';

  const dress = tally(loved.map(look => look.dress))[0]?.[0];
  const dressLine = dress === 'dressy' ? 'You like to dress up' : dress === 'casual' ? 'Easy and casual' : 'Smart and put-together';

  const colours = tally(loved.map(look => look.colour));
  const neutrals = loved.filter(look => look.colour === 'neutral').length;
  const colourLine = !loved.length ? 'We’ll find your colours with you'
    : colours[0][0] === 'neutral' ? (neutrals === loved.length ? 'Neutrals: black, cream, camel, brown' : 'Neutrals first, with a pop of colour')
      : colours[0][0] === 'print' ? 'You enjoy prints' : 'You love colour';

  const skippedBold = skipped.filter(look => look.vibes.includes('bold') || look.colour === 'print').length;
  const skippedIndian = skipped.filter(look => look.wear === 'indian').length;
  const avoidLine = skippedBold >= 2 && !loved.some(look => look.vibes.includes('bold'))
    ? 'Not for you: loud prints and bright colour'
    : skippedIndian >= 3 && !has('indian')
      ? 'Indian wear mostly for occasions only'
      : null;

  return {
    archetype,
    secondVibe,
    loved,
    skipped,
    wearLine,
    dressLine,
    colourLine,
    formulas: loved.slice(0, 3).map(look => look.formula),
    avoidLine,
  };
}

/** Her style archetype from the swipes. */
export function styleArchetype(answers: QuizAnswers): StyleArchetype {
  return styleProfile(answers).archetype;
}

/** "Modern Classic, with a minimal side" */
export function styleHeadline(profile: StyleProfile) {
  return profile.secondVibe && profile.archetype.id !== 'explorer'
    ? `${profile.archetype.name}, with a ${VIBE_WORDS[profile.secondVibe]} side`
    : profile.archetype.name;
}

const OCCASION_LABELS: Record<string, string> = {
  office: 'Office',
  wfh: 'Work from home',
  family: 'Family functions',
  weddings: 'Weddings',
  travel: 'Travel',
  dates: 'Dates',
  college: 'College',
};

const BUDGET_LABELS: Record<string, string> = {
  'under-1k': 'Under ₹1k',
  '1-2k': '₹1–2k',
  '2-4k': '₹2–4k',
  '4k-plus': '₹4k+',
  'under-3k': 'Under ₹3k',
  '3-6k': '₹3–6k',
  '6-12k': '₹6–12k',
  '12k-plus': '₹12k+',
};

export function budgetLabel(value: string | undefined) {
  return value ? BUDGET_LABELS[value] ?? value : null;
}

export interface DnaChip {
  key: string;
  label: string;
}

/** The live Style DNA card: one chip per thing we know, in the order she told us. */
export function dnaChips(answers: QuizAnswers, selfieSeason?: string | null): DnaChip[] {
  const chips: DnaChip[] = [];
  if (answers.age) chips.push({ key: 'age', label: answers.age });
  const occasions = (answers.dressFor ?? []).map(value => OCCASION_LABELS[value]).filter(Boolean);
  if (occasions.length) chips.push({ key: 'life', label: occasions.slice(0, 2).join(' + ') + (occasions.length > 2 ? ' +' : '') });
  const shape = resolveShape(answers);
  if (shape) chips.push({ key: 'shape', label: SHAPES[shape].label });
  if (answers.skinTone) chips.push({ key: 'tone', label: SKIN_TONES.find(tone => tone.id === answers.skinTone)?.label ?? answers.skinTone });
  if (selfieSeason) chips.push({ key: 'season', label: selfieSeason });
  else if (answers.metal || answers.veins) chips.push({ key: 'undertone', label: readUndertone(answers).label });
  if (answers.swipes && Object.keys(answers.swipes).length >= SWIPE_LOOKS.length) {
    chips.push({ key: 'style', label: styleArchetype(answers).name });
  }
  const budget = budgetLabel(answers.budgetOccasion);
  if (budget) chips.push({ key: 'budget', label: `${budget} / outfit` });
  if (answers.size) chips.push({ key: 'size', label: `Size ${answers.size}` });
  const coming = upcomingLabel(answers);
  if (coming) chips.push({ key: 'coming', label: coming });
  return chips;
}

export function weddingFunctionCount(answers: QuizAnswers) {
  const value = answers.weddingFunctions;
  if (value === '1') return 1;
  if (value === '2-3') return 3;
  if (value === '4-plus') return 4;
  return 0;
}

export function upcomingLabel(answers: QuizAnswers) {
  const coming = answers.comingUp ?? [];
  if (coming.includes('wedding')) {
    const functions = weddingFunctionCount(answers);
    return functions ? `Wedding · ${functions === 4 ? '4+' : functions} function${functions === 1 ? '' : 's'}` : 'Wedding';
  }
  if (coming.includes('diwali')) return 'Diwali';
  if (coming.includes('office-party')) return 'Office party';
  if (coming.includes('trip')) return 'A trip';
  return null;
}

export interface Mirror {
  eyebrow: string;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  pair?: { before: { image: string; caption: string }; after: { image: string; caption: string } };
  swatches?: Swatch[];
  style?: StyleProfile;
}

export type MirrorId = 'life' | 'body' | 'colour' | 'style' | 'shopping';

/** The answer-mirroring screens: her answer back, with what we'll do about it. */
export function mirrorFor(id: MirrorId, answers: QuizAnswers): Mirror {
  switch (id) {
    case 'life': {
      const dressFor = answers.dressFor ?? [];
      const work = dressFor.includes('office') || dressFor.includes('wfh');
      const functions = dressFor.includes('family') || dressFor.includes('weddings');
      const title = work && functions
        ? 'Office and functions? One wardrobe can do both.'
        : functions
          ? 'Lots of functions? No more repeating outfits.'
          : work
            ? 'Work outfits, sorted every morning.'
            : 'Clothes that fit your real life.';
      return {
        eyebrow: 'Got it',
        title,
        body: answers.gettingReady === 'change-3-4'
          ? 'No more changing 3–4 times. We start with what’s in your cupboard.'
          : 'We start with what’s already in your cupboard.',
        image: '/membership/capsule-two-wardrobes.webp',
        imageAlt: 'The same ivory trousers worn with office pieces and with festive pieces',
      };
    }
    case 'body': {
      const shape = resolveShape(answers) ?? 'pear';
      const guide = SHAPES[shape];
      return {
        eyebrow: `${guide.label} shape`,
        title: 'Same woman, different cut.',
        body: guide.rule,
        pair: { before: guide.before, after: guide.after },
      };
    }
    case 'colour': {
      const reading = readUndertone(answers);
      const season = likelySeason(answers);
      const tone = SKIN_TONES.find(item => item.id === answers.skinTone)?.label ?? 'Your skin tone';
      const metal = answers.metal === 'gold' ? 'gold' : answers.metal === 'silver' ? 'silver' : 'gold and silver';
      const warmth = season && (season.family === 'spring' || season.family === 'autumn') ? 'warm' : 'cool';
      return {
        eyebrow: reading.label,
        title: season ? `You’re most likely a ${warmth} season.` : 'Your colours are taking shape.',
        body: `${tone} skin, ${metal}${answers.compliments?.length ? `, ${answers.compliments[0]} compliments` : ''}. A selfie later will confirm it.`,
        image: season ? PALETTE_IMAGES[season.family] : undefined,
        imageAlt: season ? `${season.name} fabric swatches` : undefined,
        swatches: season?.best,
      };
    }
    case 'style': {
      const profile = styleProfile(answers);
      const lead = profile.loved[0] ?? SWIPE_LOOKS[0];
      return {
        eyebrow: 'Your style',
        title: styleHeadline(profile),
        body: profile.archetype.line,
        image: lead.image,
        imageAlt: lead.label,
        style: profile,
      };
    }
    case 'shopping': {
      return {
        eyebrow: 'Shopping, sorted',
        title: 'We start with your cupboard.',
        body: `Then we only suggest pieces in your size${answers.size ? ` (${answers.size})` : ''} and budget, from shops you already use.`,
        image: '/membership/flat-office-kurta.webp',
        imageAlt: 'A rust kurta, ivory trousers and tan accessories laid flat',
      };
    }
  }
}

export interface ResultLook {
  id: string;
  title: string;
  occasion: string;
  image: string;
  /** Short description of what's in it. */
  detail: string;
}

interface LibraryLook {
  image: string;
  detail: string;
  tone: SkinTone;
  shape?: ShapeId;
  swipe?: string;
  occasions: string[];
}

// Every on-model picture in the set, with what it is good for. Look 1 is the
// best match for her tone and shape until her own picture is generated.
const LIBRARY: LibraryLook[] = [
  ...SWIPE_LOOKS.map(look => ({
    image: look.image,
    detail: look.detail,
    tone: look.tone,
    swipe: look.id,
    occasions: look.dress === 'dressy' ? ['festive', 'wedding'] : look.dress === 'smart' ? ['office'] : ['weekend'],
  })),
  ...EXTRA_LOOKS,
  ...SHAPE_ORDER.map(shape => ({ image: SHAPES[shape].after.image, detail: SHAPES[shape].after.caption, tone: SHAPES[shape].modelTone, shape, occasions: ['office', 'weekend'] })),
  { image: '/membership/occ-sangeet.webp', detail: 'Ivory and gold sharara set', tone: 'deep', occasions: ['wedding', 'festive'] },
  { image: '/membership/occ-diwali.webp', detail: 'Maroon silk kurta set, gold dupatta', tone: 'fair', occasions: ['diwali', 'festive'] },
];

/**
 * Her look 1, by rules, never by the image model: the first look she loved that
 * flatters her shape; failing that, a look that flatters her shape and that she
 * didn't skip, closest to how she dresses; failing that, the safest look.
 */
export function lookForHer(answers: QuizAnswers): SwipeLook {
  const shape = resolveShape(answers);
  const fits = (look: SwipeLook) => !shape || look.suits.includes(shape);
  const loved = SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love');
  const lovedFit = loved.find(fits);
  if (lovedFit) return lovedFit;
  const profile = styleProfile(answers);
  const wears = new Set(loved.map(look => look.wear));
  const candidates = SWIPE_LOOKS.filter(look => fits(look) && answers.swipes?.[look.id] !== 'skip');
  const ranked = candidates.sort((a, b) => {
    const score = (look: SwipeLook) => (wears.has(look.wear) ? 2 : 0)
      + (profile.archetype.id !== 'explorer' && look.vibes.includes(profile.archetype.id as StyleVibe) ? 2 : 0)
      + (look.suits.length === ALL_SHAPES.length ? 1 : 0);
    return score(b) - score(a);
  });
  return ranked[0] ?? SWIPE_LOOKS.find(look => look.id === 'kurta-shrug')!;
}

/** The unlocked look: the library picture that best matches her. */
export function unlockedLook(answers: QuizAnswers): LibraryLook & { title: string } {
  const look = lookForHer(answers);
  const title = look.dress === 'dressy' ? (answers.comingUp?.includes('wedding') ? 'Sangeet night' : 'Festive evening')
    : look.dress === 'smart' ? 'Office day' : 'Weekend';
  return { image: look.image, detail: look.detail, tone: look.tone, swipe: look.id, occasions: [], title };
}

/** The 20 looks on her plan: the first unlocked, the rest shown blurred. */
export function resultLooks(answers: QuizAnswers): ResultLook[] {
  const first = unlockedLook(answers);
  const dressFor = answers.dressFor ?? [];
  const coming = answers.comingUp ?? [];
  const functions = weddingFunctionCount(answers);
  const titles: Array<[string, string]> = [];
  if (dressFor.includes('office') || dressFor.includes('wfh')) titles.push(['Office Monday', 'office'], ['Client meeting', 'office'], ['Friday at work', 'office']);
  if (coming.includes('wedding')) {
    const names = ['Mehendi', 'Sangeet', 'Wedding day', 'Reception'];
    names.slice(0, Math.max(2, functions)).forEach(name => titles.push([name, 'wedding']));
  }
  if (coming.includes('diwali')) titles.push(['Diwali puja', 'diwali'], ['Diwali card party', 'diwali']);
  if (coming.includes('office-party')) titles.push(['Office party', 'office']);
  if (coming.includes('trip') || dressFor.includes('travel')) titles.push(['Travel day', 'weekend'], ['Holiday dinner', 'weekend']);
  if (dressFor.includes('family')) titles.push(['Family lunch', 'festive'], ['Pooja at home', 'festive']);
  if (dressFor.includes('dates')) titles.push(['Dinner date', 'weekend']);
  const fillers: Array<[string, string]> = [
    ['Weekend brunch', 'weekend'], ['Errands, but nice', 'weekend'], ['Evening out', 'weekend'], ['Temple visit', 'festive'],
    ['Movie night', 'weekend'], ['Coffee with friends', 'weekend'], ['Rainy day', 'weekend'], ['Kitty party', 'festive'],
    ['Birthday dinner', 'weekend'], ['Lunch with in-laws', 'festive'], ['Market day', 'weekend'], ['Video call ready', 'office'],
    ['Sunday reset', 'weekend'], ['Gallery visit', 'weekend'], ['Airport look', 'weekend'], ['Festive brunch', 'festive'],
  ];
  // Look 1 is titled for the outfit she actually gets.
  titles.unshift([first.title, 'look-1']);
  for (const filler of fillers) {
    if (titles.length >= 20) break;
    if (!titles.some(([title]) => title === filler[0])) titles.push(filler);
  }
  const lockedImages = [
    ...['office-kurta', 'work-saree', 'blazer', 'coord', 'indowestern', 'festive-lehenga', 'jeans-kurti', 'maxi'].map(id => `/membership/flat-${id}.webp`),
    '/membership/flat-wedding-guest-saree.webp',
    '/membership/flat-wedding-guest-sharara.webp',
    ...LIBRARY.map(look => look.image).filter(image => image !== first.image),
  ];
  return titles.slice(0, 20).map(([title, occasion], index) => ({
    id: `look-${index + 1}`,
    title,
    occasion,
    image: index === 0 ? first.image : lockedImages[(index - 1) % lockedImages.length],
    detail: index === 0 ? first.detail : '',
  }));
}

/** Rough height label for the DNA and the hand-off. */
export function heightLabel(cm: number | undefined) {
  if (!cm) return null;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″ · ${cm} cm`;
}

/** A compact summary the WhatsApp agent can read (stored in its lite profile). */
export function quizSummary(answers: QuizAnswers, selfieSeason?: string | null) {
  const shape = resolveShape(answers);
  const season = paletteFor(selfieSeason) ?? likelySeason(answers);
  return {
    age: answers.age ?? null,
    dresses_for: answers.dressFor ?? [],
    climate: answers.climate ?? null,
    goal: answers.goal ?? null,
    height: heightLabel(answers.heightCm),
    body_shape_from_quiz: shape ? SHAPES[shape].label : null,
    show_off: answers.showOff ?? [],
    play_down: answers.playDown ?? [],
    body_changed: answers.bodyChanged ?? null,
    skin_tone: answers.skinTone ?? null,
    undertone_from_quiz: readUndertone(answers).label,
    season: season?.name ?? null,
    season_source: selfieSeason ? 'selfie' : 'quiz',
    style_archetype: styleHeadline(styleProfile(answers)),
    style_wear: styleProfile(answers).wearLine,
    style_dress_level: styleProfile(answers).dressLine,
    style_colour: styleProfile(answers).colourLine,
    style_formulas: styleProfile(answers).formulas,
    style_avoid: styleProfile(answers).avoidLine,
    loved_looks: SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love').map(look => `${look.label} (Pinterest pin ${look.pin})`),
    skipped_looks: SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'skip').map(look => `${look.label} (Pinterest pin ${look.pin})`),
    stores: answers.stores ?? [],
    budget_everyday: budgetLabel(answers.budgetEveryday),
    budget_occasion: budgetLabel(answers.budgetOccasion),
    size: answers.size ?? null,
    coming_up: answers.comingUp ?? [],
    wedding_functions: weddingFunctionCount(answers) || null,
    wants_jewellery_help: answers.extras === 'yes',
  };
}
