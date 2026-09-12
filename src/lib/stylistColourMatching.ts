// Shared colour reasoning for both outfit engines.
//
// These helpers used to live inside stylistBlueprintGenerator, which imports the
// science engine — so the science engine could not reach them and instead
// assigned every garment a colour by `palette[index % palette.length]`. That
// discarded the colour relationships that made a curated look worth keeping.

export type WardrobeColourFamily =
  | 'red' | 'pink' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'neutral';

export function normaliseHex(value: string) {
  const text = (value ?? '').trim();
  const hex = text.startsWith('#') ? text : `#${text}`;
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : '#8C8C8C';
}

export function hexToRgb(hex: string) {
  const value = normaliseHex(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function colourDistance(a: string, b: string) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  return Math.sqrt(((left.r - right.r) ** 2) + ((left.g - right.g) ** 2) + ((left.b - right.b) ** 2));
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Hue buckets, so a burgundy stays red instead of snapping to a nearby neutral. */
export function colourFamilyOfHex(hex: string): WardrobeColourFamily {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const saturation = max === 0 ? 0 : delta / max;
  if (delta < 24 || saturation < 0.16) return 'neutral';
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta + 6) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  // Tan, camel and brown are an orange hue but read as leather neutrals.
  if (hue >= 15 && hue < 55 && (saturation < 0.42 || relativeLuminance(hex) < 0.18)) return 'neutral';
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 200) return 'teal';
  if (hue < 260) return 'blue';
  if (hue < 315) return 'purple';
  return 'pink';
}

/**
 * Named colours as they appear in the outfit library, so a written look can be
 * read back as real colour data instead of being replaced by palette arithmetic.
 */
const NAMED_COLOURS: Record<string, string> = {
  // neutrals — light
  ivory: '#F5F0E8', 'optic white': '#FCFCFA', white: '#FAFAF7', cream: '#F3EADA',
  ecru: '#EFE7D6', oatmeal: '#E6DCC8', bone: '#EDE5D2', chalk: '#F2F0EA',
  champagne: '#E8D9BE', sand: '#E0D3B8', beige: '#DCCDB4', stone: '#D4C9B6',
  // neutrals — mid and dark
  taupe: '#B8A898', mushroom: '#BFB2A4', khaki: '#A99C7C', tan: '#C9A57A',
  camel: '#C19A6B', cognac: '#9A5B33', caramel: '#A9743F', toffee: '#8A6440',
  chocolate: '#5C3A24', cocoa: '#5A4034', mocha: '#7A5C4B', coffee: '#4E3A2E',
  espresso: '#3E2A20', brown: '#6B4A31', chestnut: '#6B3F2A', mahogany: '#4E2A20',
  grey: '#8E8E8E', gray: '#8E8E8E', slate: '#6E7A82', charcoal: '#3C3C3C',
  graphite: '#4A4A4A', gunmetal: '#53585C', silver: '#C4C4C4',
  black: '#151515', ink: '#1C1C1C',
  // colour families
  navy: '#1F2A44', blue: '#2E5A8C', indigo: '#31456B', cobalt: '#1F4FA8',
  denim: '#4A6A8A', powder: '#B9CBDD', sky: '#9EC1DC',
  teal: '#1F5B5B', turquoise: '#2E8B8B', aqua: '#7FBFBF',
  emerald: '#1F5B4D', jade: '#2E7A63', green: '#3E6B4A', forest: '#2A4A34',
  olive: '#6F7A5E', moss: '#5E6B4A', sage: '#9BA88F', mint: '#B7D0C0',
  burgundy: '#5C1F2A', wine: '#5E2231', claret: '#6B2233', oxblood: '#4A1C22',
  maroon: '#5A2028', plum: '#5A2E4A', aubergine: '#4A2A42', berry: '#7A2A45',
  ruby: '#8C1F2F', crimson: '#96202E', red: '#A32B2B', scarlet: '#B22C22',
  rust: '#A6522C', terracotta: '#A85C3E', clay: '#B85C38', ochre: '#B07A28', orange: '#C25E28',
  saffron: '#C98A1E', mustard: '#C9A227', amber: '#C08A2E', yellow: '#D6B54A', gold: '#B8912F',
  magenta: '#9C2A5C', fuchsia: '#A82A6B', pink: '#D48CA6', blush: '#E3BFB8',
  rose: '#C97B8E', coral: '#D2705C', peach: '#E5B49A', nude: '#D8BBA4',
  lilac: '#B9A6C9', lavender: '#B3A8CC', violet: '#6B4A8C', purple: '#5E3A6E', mauve: '#A98BA0',
  bronze: '#8C6A3F', copper: '#9A5F3A',
};

/** Modifiers that shift a named colour without changing its family. */
const SHADE_MODIFIERS: Record<string, number> = {
  deep: -0.28, dark: -0.3, rich: -0.18, muted: -0.08,
  light: 0.28, pale: 0.34, soft: 0.18, powder: 0.3, dusty: 0.06,
};

function shiftLightness(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const move = (channel: number) => {
    const next = amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `#${[move(r), move(g), move(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * Reads the colour a written garment actually names, e.g. "Deep teal chanderi
 * saree" -> a darkened teal. Returns null when the piece names no colour.
 */
export function colourFromPieceText(piece: string): { name: string; hex: string } | null {
  const words = (piece ?? '').toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
  const window = words.slice(0, 6);
  for (let index = 0; index < window.length; index += 1) {
    // Two-word names such as "optic white" take priority over the single word.
    const pair = `${window[index]} ${window[index + 1] ?? ''}`.trim();
    const base = NAMED_COLOURS[pair] ? pair : NAMED_COLOURS[window[index]] ? window[index] : '';
    if (!base) continue;
    const modifier = index > 0 ? SHADE_MODIFIERS[window[index - 1]] : undefined;
    const hex = modifier ? shiftLightness(NAMED_COLOURS[base], modifier) : NAMED_COLOURS[base];
    const name = index > 0 && modifier
      ? `${window[index - 1][0].toUpperCase()}${window[index - 1].slice(1)} ${base.replace(/\b\w/g, c => c.toUpperCase())}`
      : base.replace(/\b\w/g, c => c.toUpperCase());
    return { name, hex: normaliseHex(hex) };
  }
  return null;
}

/**
 * Moves a colour onto the client's palette, staying inside its own family first
 * so a mid-saturation colour does not collapse into a neutral.
 */
export function snapColourToPalette(
  hex: string,
  palette: Array<{ name: string; hex: string }>,
  family?: WardrobeColourFamily,
): { name: string; hex: string } | undefined {
  if (!palette.length) return undefined;
  const targetFamily = family ?? colourFamilyOfHex(hex);
  const familyPool = palette.filter(entry => colourFamilyOfHex(entry.hex) === targetFamily);
  const pool = familyPool.length ? familyPool : palette;
  let best = pool[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of pool) {
    const distance = colourDistance(hex, entry.hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return { name: best.name, hex: normaliseHex(best.hex) };
}
