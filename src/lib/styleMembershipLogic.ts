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
    rule: 'Structure and detail up top, clean straight lines below.',
    modelTone: 'wheatish',
  },
  apple: {
    id: 'apple',
    label: 'Apple',
    short: 'Fuller through the middle',
    illustration: '/membership/shape-apple.webp',
    before: { image: '/membership/ba-apple-before.webp', caption: 'Crop top + belt at the middle' },
    after: { image: '/membership/ba-apple-after.webp', caption: 'Long V-neck layer + straight trousers' },
    rule: 'Long vertical lines and V-necks; no belts at the middle.',
    modelTone: 'medium',
  },
  hourglass: {
    id: 'hourglass',
    label: 'Hourglass',
    short: 'Balanced, with a defined waist',
    illustration: '/membership/shape-hourglass.webp',
    before: { image: '/membership/ba-hourglass-before.webp', caption: 'Boxy kurta that hides the waist' },
    after: { image: '/membership/ba-hourglass-after.webp', caption: 'Wrap dress tied at the waist' },
    rule: 'Show the waist: wraps, belts and fitted kurtas.',
    modelTone: 'dusky',
  },
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    short: 'Straight, shoulders ≈ hips',
    illustration: '/membership/shape-rectangle.webp',
    before: { image: '/membership/ba-rectangle-before.webp', caption: 'Shapeless shift dress' },
    after: { image: '/membership/ba-rectangle-after.webp', caption: 'Peplum top + flared trousers' },
    rule: 'Create a waist: peplums, angrakhas and flares.',
    modelTone: 'fair',
  },
  'inverted-triangle': {
    id: 'inverted-triangle',
    label: 'Inverted triangle',
    short: 'Shoulders wider than hips',
    illustration: '/membership/shape-inverted-triangle.webp',
    before: { image: '/membership/ba-invtri-before.webp', caption: 'Puff sleeves + skinny jeans' },
    after: { image: '/membership/ba-invtri-after.webp', caption: 'V-neck kurta + flared sharara' },
    rule: 'Soft V-necks up top, volume and colour below.',
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

export interface SwipeLook {
  id: string;
  label: string;
  detail: string;
  image: string;
  flatlay: string;
  tone: SkinTone;
  tags: Array<'indian' | 'western' | 'fusion' | 'polished' | 'relaxed' | 'festive' | 'classic'>;
}

export const SWIPE_LOOKS: SwipeLook[] = [
  { id: 'office-kurta', label: 'Office kurta set', detail: 'Rust linen kurta, ivory straight pants', image: '/membership/look-office-kurta.webp', flatlay: '/membership/flat-office-kurta.webp', tone: 'wheatish', tags: ['indian', 'polished'] },
  { id: 'work-saree', label: 'A saree for work', detail: 'Beige handloom cotton, maroon border', image: '/membership/look-work-saree.webp', flatlay: '/membership/flat-work-saree.webp', tone: 'dusky', tags: ['indian', 'classic', 'polished'] },
  { id: 'blazer', label: 'Blazer and trousers', detail: 'Camel blazer, ivory shell, black trousers', image: '/membership/look-blazer.webp', flatlay: '/membership/flat-blazer.webp', tone: 'medium', tags: ['western', 'polished'] },
  { id: 'coord', label: 'Co-ord set', detail: 'Taupe linen shirt and wide trousers', image: '/membership/look-coord.webp', flatlay: '/membership/flat-coord.webp', tone: 'fair', tags: ['western', 'relaxed'] },
  { id: 'indowestern', label: 'Indo-western dress', detail: 'Mustard angrakha wrap dress', image: '/membership/look-indowestern.webp', flatlay: '/membership/flat-indowestern.webp', tone: 'deep', tags: ['fusion', 'classic'] },
  { id: 'festive-lehenga', label: 'Light festive lehenga', detail: 'Dusty pink, delicate gota work', image: '/membership/look-festive-lehenga.webp', flatlay: '/membership/flat-festive-lehenga.webp', tone: 'wheatish', tags: ['indian', 'festive'] },
  { id: 'jeans-kurti', label: 'Jeans and a kurti', detail: 'White chikankari kurti, straight jeans', image: '/membership/look-jeans-kurti.webp', flatlay: '/membership/flat-jeans-kurti.webp', tone: 'medium', tags: ['fusion', 'relaxed'] },
  { id: 'maxi', label: 'Maxi dress', detail: 'Terracotta cotton maxi, light shirt', image: '/membership/look-maxi.webp', flatlay: '/membership/flat-maxi.webp', tone: 'dusky', tags: ['western', 'relaxed'] },
];

export interface StyleArchetype {
  id: string;
  name: string;
  line: string;
}

const ARCHETYPES: Record<string, StyleArchetype> = {
  modern_classic: { id: 'modern_classic', name: 'Modern Classic', line: 'You like clean Indian and western pieces that mix. Polished, never fussy.' },
  indo_western: { id: 'indo_western', name: 'Indo-Western Edit', line: 'You love the in-between: angrakhas with sandals, kurtis with jeans, a dupatta over a dress.' },
  polished_pro: { id: 'polished_pro', name: 'Polished Professional', line: 'Sharp, structured and western-leaning. You want to walk into a room looking sure.' },
  graceful_traditional: { id: 'graceful_traditional', name: 'Graceful Traditional', line: 'Sarees, kurta sets and festive pieces are home for you. We keep it fresh, not dated.' },
  relaxed_minimal: { id: 'relaxed_minimal', name: 'Relaxed Minimal', line: 'Easy fabrics, calm colours, nothing that fights you. Comfort that still looks put together.' },
  explorer: { id: 'explorer', name: 'Open Explorer', line: 'Nothing grabbed you yet, and that’s useful too. Your stylist will try a few directions with you.' },
};

/** Her style archetype from the 8 swipes. */
export function styleArchetype(answers: QuizAnswers): StyleArchetype {
  const loved = SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love');
  if (!loved.length) return ARCHETYPES.explorer;
  const count = (tag: SwipeLook['tags'][number]) => loved.filter(look => look.tags.includes(tag)).length;
  const indian = count('indian');
  const western = count('western');
  const fusion = count('fusion');
  const relaxed = count('relaxed');
  const polished = count('polished');
  if (indian >= 3 && western === 0) return ARCHETYPES.graceful_traditional;
  if (western >= 3 && indian === 0) return polished >= relaxed ? ARCHETYPES.polished_pro : ARCHETYPES.relaxed_minimal;
  if (fusion >= 2) return ARCHETYPES.indo_western;
  if (relaxed >= 2 && polished === 0) return ARCHETYPES.relaxed_minimal;
  if (indian >= 1 && western >= 1) return ARCHETYPES.modern_classic;
  if (indian >= 2) return ARCHETYPES.graceful_traditional;
  if (western >= 2) return polished >= relaxed ? ARCHETYPES.polished_pro : ARCHETYPES.relaxed_minimal;
  return ARCHETYPES.modern_classic;
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
        ? 'Office plus family functions? You need two wardrobes that share half their pieces.'
        : functions
          ? 'Functions every other weekend? We plan them so you never repeat a look in the family photos.'
          : work
            ? 'Work wear that looks considered, without thinking about it every morning.'
            : 'A wardrobe that fits the life you actually live.';
      return {
        eyebrow: 'Noted',
        title,
        body: answers.gettingReady === 'change-3-4'
          ? 'And no more changing three or four times. We build it from pieces you already own, so getting ready takes one try.'
          : 'That’s exactly what we build: a small set of pieces that work across your week, starting from what’s already in your almirah.',
        image: '/membership/capsule-two-wardrobes.webp',
        imageAlt: 'Ivory trousers shared between an office outfit and a festive outfit',
      };
    }
    case 'body': {
      const shape = resolveShape(answers) ?? 'pear';
      const guide = SHAPES[shape];
      return {
        eyebrow: `${guide.label} shape`,
        title: 'Same woman. Same body. A different cut.',
        body: guide.rule,
        pair: { before: guide.before, after: guide.after },
      };
    }
    case 'colour': {
      const reading = readUndertone(answers);
      const season = likelySeason(answers);
      const tone = SKIN_TONES.find(item => item.id === answers.skinTone)?.label ?? 'Your tone';
      const metal = answers.metal === 'gold' ? 'gold' : answers.metal === 'silver' ? 'silver' : 'both metals';
      return {
        eyebrow: reading.label,
        title: season
          ? `${tone}, ${metal}${answers.compliments?.length ? ` and ${answers.compliments[0]} compliments` : ''}: you’re most likely a ${season.family === 'spring' || season.family === 'autumn' ? 'warm' : 'cool'} season.`
          : 'Your colours are taking shape.',
        body: 'We’ll confirm it with an optional selfie in a minute. A photo reads your undertone far better than any quiz.',
        image: season ? PALETTE_IMAGES[season.family] : undefined,
        imageAlt: season ? `${season.name} fabric swatches` : undefined,
        swatches: season?.best,
      };
    }
    case 'style': {
      const archetype = styleArchetype(answers);
      const loved = SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love');
      return {
        eyebrow: 'Your style',
        title: `Your style is ${archetype.name}.`,
        body: archetype.line,
        image: (loved[0] ?? SWIPE_LOOKS[0]).flatlay,
        imageAlt: (loved[0] ?? SWIPE_LOOKS[0]).label,
      };
    }
    case 'shopping': {
      const budget = budgetLabel(answers.budgetEveryday);
      return {
        eyebrow: 'Shopping, sorted',
        title: 'We start from what’s already in your almirah.',
        body: `Then we only suggest pieces in your size${answers.size ? ` (${answers.size})` : ''}${budget ? `, around ${budget} for everyday pieces,` : ''} from stores you already use.`,
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
    occasions: look.tags.includes('festive') ? ['festive', 'wedding'] : look.tags.includes('polished') ? ['office'] : ['weekend'],
  })),
  ...SHAPE_ORDER.map(shape => ({ image: SHAPES[shape].after.image, detail: SHAPES[shape].after.caption, tone: SHAPES[shape].modelTone, shape, occasions: ['office', 'weekend'] })),
  { image: '/membership/occ-sangeet.webp', detail: 'Ivory and gold sharara set', tone: 'deep', occasions: ['wedding', 'festive'] },
  { image: '/membership/occ-diwali.webp', detail: 'Maroon silk kurta set, gold dupatta', tone: 'fair', occasions: ['diwali', 'festive'] },
];

function scoreLook(look: LibraryLook, answers: QuizAnswers, shape: ShapeId | null) {
  let score = 0;
  if (shape && look.shape === shape) score += 3;
  if (answers.skinTone && look.tone === answers.skinTone) score += 2;
  if (look.swipe && answers.swipes?.[look.swipe] === 'love') score += 2;
  if (look.swipe && answers.swipes?.[look.swipe] === 'skip') score -= 3;
  return score;
}

/** The unlocked look: the library picture that best matches her. */
export function unlockedLook(answers: QuizAnswers): LibraryLook {
  const shape = resolveShape(answers);
  return [...LIBRARY].sort((a, b) => scoreLook(b, answers, shape) - scoreLook(a, answers, shape))[0];
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
  for (const filler of fillers) {
    if (titles.length >= 20) break;
    if (!titles.some(([title]) => title === filler[0])) titles.push(filler);
  }
  const lockedImages = [
    ...SWIPE_LOOKS.map(look => look.flatlay),
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
    style_archetype: styleArchetype(answers).name,
    loved_looks: SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'love').map(look => look.label),
    skipped_looks: SWIPE_LOOKS.filter(look => answers.swipes?.[look.id] === 'skip').map(look => look.label),
    stores: answers.stores ?? [],
    budget_everyday: budgetLabel(answers.budgetEveryday),
    budget_occasion: budgetLabel(answers.budgetOccasion),
    size: answers.size ?? null,
    coming_up: answers.comingUp ?? [],
    wedding_functions: weddingFunctionCount(answers) || null,
    wants_jewellery_help: answers.extras === 'yes',
  };
}
