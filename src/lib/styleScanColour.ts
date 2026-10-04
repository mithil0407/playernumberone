// Pure rules for the free colour scan: which classified shades the free result
// shows, how its plain-language colour rules read, and a hex for the "skip"
// colours (the classifier names those without hex codes). No server imports, so
// the result page, the nurture emails and the tests can all share it.

import type { StyleScanAnswersV1, StyleScanColourProfileV1, StyleScanSwatchV1 } from './styleScan.ts';

/** Shades the free result shows; the rest stay in the paid Blueprint. */
export const FREE_BEST_COUNT = 6;
export const FREE_ACCENT_COUNT = 2;
export const FREE_AVOID_COUNT = 3;

export interface ClassifiedColour {
  undertone_direction: string;
  depth: string;
  contrast: string;
  palette_name: string;
  base_palette: Array<{ name: string; hex: string; usage?: string }>;
  accent_palette: Array<{ name: string; hex: string; usage?: string }>;
  avoid_colours: string[];
}

const HEX = /^#[0-9a-f]{6}$/i;

function cleanHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim();
  if (HEX.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) return `#${hex.slice(1).split('').map(char => char + char).join('')}`.toUpperCase();
  return null;
}

function toSwatches(colours: ClassifiedColour['base_palette']): StyleScanSwatchV1[] {
  const seen = new Set<string>();
  const swatches: StyleScanSwatchV1[] = [];
  for (const colour of colours) {
    const hex = cleanHex(colour?.hex);
    const name = typeof colour?.name === 'string' ? colour.name.trim() : '';
    if (!hex || !name || seen.has(hex)) continue;
    seen.add(hex);
    swatches.push({ name, hex, ...(colour.usage ? { usage: colour.usage.trim() } : {}) });
  }
  return swatches;
}

/** Lightness 0–1, for ordering and for picking readable text on a swatch. */
export function hexLightness(hex: string): number {
  const value = cleanHex(hex);
  if (!value) return 0.5;
  const [r, g, b] = [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

function saturation(hex: string): number {
  const value = cleanHex(hex);
  if (!value) return 0;
  const [r, g, b] = [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  if (max === min) return 0;
  return light > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/**
 * The six free "best" shades. The classifier lists neutrals first, so taking the
 * first six would show mostly beige and black. Lead with the real colours, then
 * one or two grounding neutrals, which is what makes the result feel personal.
 */
const NEUTRAL_NAMES = /ivory|cream|off[- ]?white|white|ecru|oat|beige|sand|nude|stone|camel|tan\b|taupe|mushroom|khaki|grey|gray|charcoal|slate|black|ink|navy|brown|chocolate|cocoa|espresso|coffee/i;

/** A wardrobe colour rather than a neutral: judged by name first (camel is a neutral however saturated), then by hue. */
export function isColourfulShade(hex: string, name = ''): boolean {
  if (name && NEUTRAL_NAMES.test(name)) return false;
  return saturation(hex) >= 0.22 && hexLightness(hex) > 0.12 && hexLightness(hex) < 0.9;
}

export function pickFreeBestShades(base: StyleScanSwatchV1[], count = FREE_BEST_COUNT): StyleScanSwatchV1[] {
  const colourful = base.filter(swatch => isColourfulShade(swatch.hex, swatch.name));
  const neutral = base.filter(swatch => !colourful.includes(swatch));
  const picked = [...colourful.slice(0, count - 2), ...neutral.slice(0, 2)];
  for (const swatch of [...colourful, ...neutral]) {
    if (picked.length >= count) break;
    if (!picked.includes(swatch)) picked.push(swatch);
  }
  return picked.slice(0, count);
}

const COLOUR_WORDS: Array<[RegExp, string]> = [
  [/neon|fluoresc|electric|highlighter|acid/, '#C6F21B'],
  [/lavender|lilac|icy violet|wisteria/, '#C9C0E3'],
  [/icy pink|baby pink|pale pink|candy pink|bubblegum/, '#F6C6D8'],
  [/fuchsia|magenta|hot pink|shocking pink/, '#D3166F'],
  [/icy blue|powder blue|baby blue|ice blue/, '#C7DDF0'],
  [/mint|icy green/, '#BDEBD3'],
  [/silver grey|silver gray|cool grey|cool gray|ash grey|ash gray|dove grey|light grey|light gray|grey|gray/, '#B9BDC2'],
  [/stark white|optic white|pure white|bright white|crisp white|white/, '#FFFFFF'],
  [/jet black|pure black|black/, '#111111'],
  [/charcoal/, '#36393D'],
  [/mustard|ochre|turmeric/, '#C9A227'],
  [/lemon|canary|bright yellow|yellow/, '#F3E14B'],
  [/orange|tangerine|pumpkin/, '#EE7A21'],
  [/coral|salmon/, '#F47C6B'],
  [/peach|apricot/, '#F6BE9A'],
  [/camel|tan|khaki/, '#C19A6B'],
  [/beige|nude|sand|oatmeal|ecru/, '#D9C7A7'],
  [/brown|chocolate|cocoa|coffee/, '#5A3A29'],
  [/rust|terracotta|burnt/, '#B4532A'],
  [/olive|khaki green|moss/, '#6B6B35'],
  [/emerald/, '#0F7B55'],
  [/teal|peacock/, '#127A7C'],
  [/forest|bottle green|dark green/, '#1F4D36'],
  [/lime|chartreuse/, '#A4D23B'],
  [/green/, '#3E8E5B'],
  [/cobalt|royal blue|electric blue/, '#1F48C9'],
  [/navy/, '#1F2A44'],
  [/turquoise|aqua/, '#2BB3B1'],
  [/blue/, '#3C6FB6'],
  [/burgundy|wine|maroon|oxblood/, '#6A1F2B'],
  [/plum|aubergine|eggplant/, '#5B2A4B'],
  [/purple|violet|grape/, '#6B3FA0'],
  [/berry|raspberry/, '#9C2453'],
  [/red|scarlet|crimson|cherry/, '#C42330'],
  [/pink|rose/, '#E89AB5'],
  [/gold|metallic/, '#D4AF37'],
  [/pastel/, '#E5D7EC'],
];

/** Best-effort hex for a colour named in words, e.g. "icy pastels" or "stark optic white". */
export function approximateColourHex(name: string): string | null {
  const text = name.toLowerCase();
  for (const [pattern, hex] of COLOUR_WORDS) if (pattern.test(text)) return hex;
  return null;
}

/** Turns "icy pastels near the face" into "Icy pastels". */
export function shortColourName(name: string): string {
  const trimmed = name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .split(/[,;:–—]| - | near | on | as | for | when /i)[0]
    .trim();
  const words = trimmed.split(/\s+/).slice(0, 4).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function buildAvoidSwatches(
  avoidColours: string[],
  modelSwatches: Array<{ name?: unknown; hex?: unknown }> = [],
  count = FREE_AVOID_COUNT,
): StyleScanSwatchV1[] {
  const swatches: StyleScanSwatchV1[] = [];
  const seen = new Set<string>();
  for (const swatch of modelSwatches) {
    const hex = cleanHex(swatch?.hex);
    const name = typeof swatch?.name === 'string' ? shortColourName(swatch.name) : '';
    if (!hex || !name || seen.has(hex)) continue;
    seen.add(hex);
    swatches.push({ name, hex });
  }
  for (const avoid of avoidColours) {
    if (swatches.length >= count) break;
    const hex = approximateColourHex(avoid);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    swatches.push({ name: shortColourName(avoid), hex });
  }
  return swatches.slice(0, count);
}

export function titleCaseWords(value: string): string {
  return value
    .replace(/[_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-'))
    .join(' ');
}

type ContrastLevel = 'high' | 'medium' | 'low';

export function contrastLevel(contrast: string): ContrastLevel {
  const text = contrast.toLowerCase();
  if (/high|strong|clear|bright/.test(text)) return 'high';
  if (/low|soft|muted|gentle/.test(text)) return 'low';
  return 'medium';
}

export function contrastRule(contrast: string): { title: string; body: string } {
  const level = contrastLevel(contrast);
  if (level === 'high') {
    return {
      title: 'Go bold with light and dark together',
      body: 'Your features carry strong contrast, so a light top with a deep bottom looks sharp and intentional. All-beige or all-pastel outfits can make you look faded.',
    };
  }
  if (level === 'low') {
    return {
      title: 'Keep your outfits tonal',
      body: 'Your features blend softly, so shades close in depth (like camel with cream, or plum with mauve) look expensive. Stark black against white can overpower your face.',
    };
  }
  return {
    title: 'Pair one light shade with one mid shade',
    body: 'You sit in the middle, so outfits look best with gentle contrast: a light top with a mid-depth bottom, or the reverse. Avoid two extremes at once.',
  };
}

export function metalsAdvice(undertone: string, jewelleryDirection = ''): string {
  const text = `${jewelleryDirection} ${undertone}`.toLowerCase();
  const direction = jewelleryDirection.toLowerCase();
  if (/rose gold/.test(direction)) return 'Rose gold and soft yellow gold';
  if (/antique|oxidised|oxidized/.test(direction)) return 'Antique gold and oxidised silver';
  const silver = /silver|white gold|platinum/.test(direction);
  const gold = /gold|brass/.test(direction.replace(/white gold/g, ''));
  if (silver && !gold) return 'Silver, white gold and platinum';
  if (gold && !silver) return 'Yellow gold, rose gold and brass';
  if (gold && silver) return 'Both work: soft gold and brushed silver';
  if (/olive|neutral/.test(text)) return 'Both work: soft gold and brushed silver';
  if (/cool/.test(text)) return 'Silver, white gold and platinum';
  if (/warm|golden|deep/.test(text)) return 'Yellow gold, rose gold and brass';
  return 'Both work: soft gold and brushed silver';
}

export function nearFaceRule(best: StyleScanSwatchV1[], avoid: StyleScanSwatchV1[]): { title: string; body: string } {
  const wear = best.slice(0, 3).map(swatch => swatch.name.toLowerCase());
  const list = wear.length > 1 ? `${wear.slice(0, -1).join(', ')} or ${wear[wear.length - 1]}` : wear[0] || 'your best shades';
  const skip = avoid[0]?.name.toLowerCase();
  return {
    title: 'Your best colours belong near your face',
    body: `Wear ${list} on top: blouses, kurtas, dupattas and scarves.${skip ? ` If you love ${skip}, keep it below the waist, where it cannot cast a shadow on your skin.` : ''}`,
  };
}

export interface BuildColourProfileInput {
  colour: ClassifiedColour;
  jewelleryDirection?: string;
  makeupColours?: string[];
  /** Hexes the copy model gave for the avoid colours, when it gave them. */
  avoidSwatches?: Array<{ name?: unknown; hex?: unknown }>;
}

export function buildColourProfile(input: BuildColourProfileInput): StyleScanColourProfileV1 {
  const base = toSwatches(input.colour.base_palette);
  const accentsAll = toSwatches(input.colour.accent_palette).filter(accent => !base.some(swatch => swatch.hex === accent.hex));
  const best = pickFreeBestShades(base);
  const accents = accentsAll.slice(0, FREE_ACCENT_COUNT);
  const locked = [...base.filter(swatch => !best.includes(swatch)), ...accentsAll.slice(FREE_ACCENT_COUNT)];
  const avoid = buildAvoidSwatches(input.colour.avoid_colours, input.avoidSwatches);
  const metals = metalsAdvice(input.colour.undertone_direction, input.jewelleryDirection);
  return {
    paletteName: titleCaseWords(input.colour.palette_name || 'Balanced Neutral'),
    undertone: titleCaseWords(input.colour.undertone_direction || 'neutral'),
    depth: titleCaseWords(input.colour.depth || 'medium'),
    contrast: titleCaseWords(input.colour.contrast || 'medium'),
    best,
    accents,
    avoid,
    lockedCount: locked.length,
    lockedPreview: locked.map(swatch => swatch.hex),
    metals,
    lips: (input.makeupColours ?? []).filter(Boolean).slice(0, 2),
    rules: [
      nearFaceRule(best, avoid),
      contrastRule(input.colour.contrast || 'medium'),
      {
        title: 'Your metals',
        body: `${metals}. Jewellery sits right against your skin, so the right metal makes it look brighter and more even.`,
      },
    ],
  };
}

/** Her quiz answers as a weak hint for the classifier. Photo evidence always wins. */
export function colourSelfReport(answers: Pick<StyleScanAnswersV1, 'jewellery' | 'sun' | 'compliments'>): string {
  const lines: string[] = [];
  const jewellery = {
    gold: 'She feels gold jewellery looks best on her.',
    silver: 'She feels silver jewellery looks best on her.',
    both: 'She feels gold and silver both suit her.',
    unsure: '',
  }[answers.jewellery ?? 'unsure'];
  const sun = {
    tans_easily: 'In the sun her skin tans easily and rarely burns.',
    burns_then_tans: 'In the sun her skin burns a little, then tans.',
    burns: 'In the sun her skin burns and rarely tans.',
    rarely_changes: 'Her skin rarely changes in the sun.',
  }[answers.sun ?? 'rarely_changes'];
  const compliments = {
    earthy: 'She is most complimented in earthy colours such as rust, olive and mustard.',
    jewel: 'She is most complimented in jewel tones such as emerald, royal blue and magenta.',
    soft: 'She is most complimented in soft pastels.',
    contrast: 'She is most complimented in black and white.',
    unsure: '',
  }[answers.compliments ?? 'unsure'];
  if (jewellery) lines.push(jewellery);
  if (answers.sun && sun) lines.push(sun);
  if (compliments) lines.push(compliments);
  if (!lines.length) return '';
  return `Self-reported colour cues from a quick quiz (a weak hint only; the headshot evidence decides undertone and depth): ${lines.join(' ')}`;
}

export interface ColourOutfitIdea {
  title: string;
  formula: string;
  swatches: StyleScanSwatchV1[];
}

function lower(swatch: StyleScanSwatchV1) {
  return swatch.name.toLowerCase();
}

/**
 * Three outfit ideas built only from her free shades, so the emails and the
 * result page can show the palette working without giving away the Blueprint.
 */
export function colourOutfitIdeas(
  colour: Pick<StyleScanColourProfileV1, 'best' | 'accents' | 'metals'>,
  dressCode: StyleScanAnswersV1['dressCode'] | string | null | undefined,
): ColourOutfitIdea[] {
  const all = [...colour.best, ...colour.accents];
  if (!all.length) return [];
  const colourful = all.filter(swatch => isColourfulShade(swatch.hex, swatch.name));
  const neutral = all.filter(swatch => !isColourfulShade(swatch.hex, swatch.name));
  const pick = (list: StyleScanSwatchV1[], index: number) => list[index] ?? all[index % all.length];
  const [c1, c2, c3] = [pick(colourful, 0), pick(colourful, 1), pick(colourful, 2)];
  const [n1, n2] = [pick(neutral, 0), pick(neutral, 1)];
  const accent = colour.accents[0] ?? pick(colourful, 3);
  const metal = colour.metals.split(/[,:]| and /)[0].replace(/^Both work/i, 'soft gold').trim().toLowerCase();

  if (dressCode === 'ethnic_leaning') {
    return [
      { title: 'Office day', formula: `A ${lower(c1)} straight kurta with ${lower(n1)} cigarette pants and small ${metal} studs.`, swatches: [c1, n1] },
      { title: 'Festive evening', formula: `A ${lower(accent)} silk kurta set, a ${lower(n2)} potli bag and ${metal} jhumkas.`, swatches: [accent, n2] },
      { title: 'Weekend', formula: `A ${lower(c2)} cotton kurti over ${lower(n2)} straight jeans, with kolhapuris.`, swatches: [c2, n2] },
    ];
  }
  if (dressCode === 'mostly_home') {
    return [
      { title: 'Video call', formula: `A ${lower(c1)} top with a soft collar. Only the top half shows, so let your best colour do the work.`, swatches: [c1] },
      { title: 'Errands', formula: `A ${lower(c2)} relaxed shirt, ${lower(n1)} straight trousers and clean white sneakers.`, swatches: [c2, n1] },
      { title: 'Family lunch', formula: `A ${lower(accent)} kurti or blouse with ${lower(n2)} bottoms and ${metal} hoops.`, swatches: [accent, n2] },
    ];
  }
  if (dressCode === 'mixed') {
    return [
      { title: 'Office day', formula: `A ${lower(c1)} blouse tucked into ${lower(n1)} high-waist trousers, with ${metal} studs.`, swatches: [c1, n1] },
      { title: 'Family function', formula: `A ${lower(accent)} kurta set with a ${lower(c3)} dupatta and ${metal} jhumkas.`, swatches: [accent, c3] },
      { title: 'Weekend', formula: `A ${lower(c2)} knit top, ${lower(n2)} straight jeans and a tan bag.`, swatches: [c2, n2] },
    ];
  }
  return [
    { title: 'Office day', formula: `A ${lower(c1)} blouse tucked into ${lower(n1)} high-waist trousers, with ${metal} studs.`, swatches: [c1, n1] },
    { title: 'Dinner out', formula: `A ${lower(accent)} satin top, ${lower(n2)} wide-leg trousers and a ${metal} pendant.`, swatches: [accent, n2] },
    { title: 'Weekend', formula: `A ${lower(c2)} relaxed shirt over ${lower(n2)} straight jeans, with a ${lower(c3)} scarf.`, swatches: [c2, n2, c3] },
  ];
}

/** For each colour to skip, the free shade closest in lightness to wear instead. */
export function swapSuggestions(colour: Pick<StyleScanColourProfileV1, 'best' | 'avoid'>): Array<{ skip: StyleScanSwatchV1; wear: StyleScanSwatchV1 }> {
  if (!colour.best.length) return [];
  const used = new Set<string>();
  return colour.avoid.map(skip => {
    const ranked = [...colour.best].sort((a, b) => Math.abs(hexLightness(a.hex) - hexLightness(skip.hex)) - Math.abs(hexLightness(b.hex) - hexLightness(skip.hex)));
    const wear = ranked.find(swatch => !used.has(swatch.hex)) ?? ranked[0];
    used.add(wear.hex);
    return { skip, wear };
  });
}
