/**
 * Colour vocabulary for men's outfit lines.
 *
 * One place that knows what "pale turquoise" or "dark brown suede" means, so the
 * picker can judge a look against a client's colouring, QA can tell whether the
 * model kept a board look's colours, and the intake can draw swatches. Every
 * rule here is a visible lookup, not a model judgement.
 */

export type ManColourFamily =
  | 'white' | 'cream' | 'beige' | 'tan' | 'brown'
  | 'grey' | 'charcoal' | 'black'
  | 'navy' | 'blue' | 'light-blue' | 'denim' | 'teal'
  | 'green' | 'dark-green' | 'olive' | 'sage'
  | 'wine' | 'red' | 'rust' | 'orange' | 'yellow' | 'pink' | 'purple';

export interface ManColourInfo {
  family: ManColourFamily;
  hex: string;
  temperature: 'warm' | 'cool' | 'neutral';
  depth: 'light' | 'medium' | 'deep';
  /** 0 = menswear neutral, 1 = a colour people notice, 2 = loud. */
  loudness: 0 | 1 | 2;
}

type Entry = [name: string, family: ManColourFamily, hex: string, temperature: ManColourInfo['temperature'], depth: ManColourInfo['depth'], loudness: ManColourInfo['loudness']];

const ENTRIES: Entry[] = [
  ['white', 'white', '#F7F7F4', 'neutral', 'light', 0],
  ['bright white', 'white', '#FFFFFF', 'cool', 'light', 0],
  ['true white', 'white', '#FFFFFF', 'cool', 'light', 0],
  ['optic white', 'white', '#FFFFFF', 'cool', 'light', 0],
  ['chalk', 'white', '#F2F0EA', 'neutral', 'light', 0],
  ['chalk white', 'white', '#F2F0EA', 'neutral', 'light', 0],
  ['off-white', 'cream', '#F3EFE4', 'warm', 'light', 0],
  ['warm white', 'cream', '#F5F0E3', 'warm', 'light', 0],
  ['bone', 'cream', '#E9E2D0', 'warm', 'light', 0],
  ['ivory', 'cream', '#F1EAD7', 'warm', 'light', 0],
  ['warm ivory', 'cream', '#EFE5CC', 'warm', 'light', 0],
  ['cream', 'cream', '#EEE3C8', 'warm', 'light', 0],
  ['ecru', 'cream', '#E6DCC3', 'warm', 'light', 0],
  ['beige', 'beige', '#D9C7A7', 'warm', 'light', 0],
  ['pale beige', 'beige', '#E3D6BC', 'warm', 'light', 0],
  ['light beige', 'beige', '#E3D6BC', 'warm', 'light', 0],
  ['sand', 'beige', '#D6C29E', 'warm', 'light', 0],
  ['stone', 'beige', '#CFC4AE', 'neutral', 'light', 0],
  ['oatmeal', 'beige', '#D8CDB5', 'warm', 'light', 0],
  ['khaki', 'beige', '#BFAE85', 'warm', 'medium', 0],
  ['taupe', 'beige', '#A39382', 'neutral', 'medium', 0],
  ['warm taupe', 'beige', '#A08A72', 'warm', 'medium', 0],
  ['dark taupe', 'brown', '#7D6B5B', 'neutral', 'medium', 0],
  ['tan', 'tan', '#B98A5B', 'warm', 'medium', 0],
  ['light tan', 'tan', '#C9A47A', 'warm', 'medium', 0],
  ['camel', 'tan', '#B58A55', 'warm', 'medium', 0],
  ['cognac', 'tan', '#9A5B2E', 'warm', 'medium', 0],
  ['brown', 'brown', '#6E4B33', 'warm', 'deep', 0],
  ['dark brown', 'brown', '#4A3123', 'warm', 'deep', 0],
  ['mid-brown', 'brown', '#7A5236', 'warm', 'medium', 0],
  ['chocolate', 'brown', '#45291B', 'warm', 'deep', 0],
  ['espresso', 'brown', '#3A2619', 'warm', 'deep', 0],
  ['mocha', 'brown', '#6B4E3D', 'warm', 'medium', 0],
  ['tobacco', 'brown', '#7A4E2A', 'warm', 'medium', 0],
  ['grey', 'grey', '#9C9EA0', 'cool', 'medium', 0],
  ['gray', 'grey', '#9C9EA0', 'cool', 'medium', 0],
  ['light grey', 'grey', '#C7C9CB', 'cool', 'light', 0],
  ['pale grey', 'grey', '#CFD1D3', 'cool', 'light', 0],
  ['mid-grey', 'grey', '#8C8F92', 'cool', 'medium', 0],
  ['medium grey', 'grey', '#8C8F92', 'cool', 'medium', 0],
  ['warm grey', 'grey', '#9A948C', 'warm', 'medium', 0],
  ['silver', 'grey', '#B8BCC0', 'cool', 'light', 0],
  ['slate', 'grey', '#6B7780', 'cool', 'medium', 0],
  ['silver slate', 'grey', '#708090', 'cool', 'medium', 0],
  ['slate grey', 'grey', '#6B7780', 'cool', 'medium', 0],
  ['dark grey', 'charcoal', '#4A4D50', 'cool', 'deep', 0],
  ['charcoal', 'charcoal', '#3A3D40', 'cool', 'deep', 0],
  ['dark charcoal', 'charcoal', '#2E3033', 'cool', 'deep', 0],
  ['black', 'black', '#141414', 'cool', 'deep', 0],
  ['navy', 'navy', '#1F2A44', 'cool', 'deep', 0],
  ['dark navy', 'navy', '#1A2238', 'cool', 'deep', 0],
  ['ink navy', 'navy', '#1B2233', 'cool', 'deep', 0],
  ['midnight', 'navy', '#191970', 'cool', 'deep', 0],
  ['deep midnight', 'navy', '#191970', 'cool', 'deep', 0],
  ['dark blue', 'navy', '#22325A', 'cool', 'deep', 0],
  ['blue', 'blue', '#3F66A8', 'cool', 'medium', 0],
  ['mid-blue', 'blue', '#4A72B0', 'cool', 'medium', 0],
  ['muted blue', 'blue', '#5C7594', 'cool', 'medium', 0],
  ['slate blue', 'blue', '#6A7FA8', 'cool', 'medium', 0],
  ['dusty blue', 'blue', '#7D93AE', 'cool', 'medium', 0],
  ['bright blue', 'blue', '#1F5FD1', 'cool', 'medium', 2],
  ['royal blue', 'blue', '#2350B8', 'cool', 'medium', 2],
  ['cobalt', 'blue', '#0047AB', 'cool', 'medium', 2],
  ['cobalt blue', 'blue', '#0047AB', 'cool', 'medium', 2],
  ['light blue', 'light-blue', '#A9C4E2', 'cool', 'light', 0],
  ['pale blue', 'light-blue', '#BBD0E8', 'cool', 'light', 0],
  ['powder blue', 'light-blue', '#B0C9E3', 'cool', 'light', 0],
  ['sky blue', 'light-blue', '#9CC3E6', 'cool', 'light', 0],
  ['chambray', 'light-blue', '#8EA7C6', 'cool', 'medium', 0],
  ['denim', 'denim', '#3C5A85', 'cool', 'medium', 0],
  ['indigo', 'denim', '#2B3A67', 'cool', 'deep', 0],
  ['medium-wash', 'denim', '#5577A3', 'cool', 'medium', 0],
  ['mid-wash', 'denim', '#5577A3', 'cool', 'medium', 0],
  ['light-wash', 'denim', '#86A3C6', 'cool', 'light', 0],
  ['dark-wash', 'denim', '#2B3A5C', 'cool', 'deep', 0],
  ['teal', 'teal', '#1F6F73', 'cool', 'medium', 1],
  ['deep teal', 'teal', '#14555A', 'cool', 'deep', 1],
  ['turquoise', 'teal', '#40B5B8', 'cool', 'medium', 2],
  ['pale turquoise', 'teal', '#9ED9D6', 'cool', 'light', 1],
  ['light turquoise', 'teal', '#8FD3D0', 'cool', 'light', 1],
  ['aqua', 'teal', '#6FC8C8', 'cool', 'light', 1],
  ['green', 'green', '#3F8F5A', 'neutral', 'medium', 1],
  ['bright green', 'green', '#2EAD58', 'neutral', 'medium', 2],
  ['emerald', 'green', '#1F7A4D', 'cool', 'medium', 2],
  ['kelly green', 'green', '#2E9E4F', 'neutral', 'medium', 2],
  ['dark green', 'dark-green', '#23432F', 'neutral', 'deep', 1],
  ['deep green', 'dark-green', '#23432F', 'neutral', 'deep', 1],
  ['forest', 'dark-green', '#26462F', 'neutral', 'deep', 1],
  ['forest green', 'dark-green', '#26462F', 'neutral', 'deep', 1],
  ['bottle green', 'dark-green', '#1F3D2B', 'cool', 'deep', 1],
  ['pine', 'dark-green', '#01796F', 'cool', 'deep', 1],
  ['pine green', 'dark-green', '#01796F', 'cool', 'deep', 1],
  ['olive', 'olive', '#5F6136', 'warm', 'medium', 0],
  ['olive green', 'olive', '#5F6136', 'warm', 'medium', 0],
  ['dark olive', 'olive', '#4A4B2C', 'warm', 'deep', 0],
  ['sage', 'sage', '#A7B49A', 'neutral', 'light', 1],
  ['sage green', 'sage', '#A7B49A', 'neutral', 'light', 1],
  ['mint', 'sage', '#BFE3CF', 'cool', 'light', 1],
  ['mint green', 'sage', '#BFE3CF', 'cool', 'light', 1],
  ['pale mint', 'sage', '#CFEBDC', 'cool', 'light', 1],
  ['pale mint green', 'sage', '#CFEBDC', 'cool', 'light', 1],
  ['pistachio', 'sage', '#C4D6A4', 'warm', 'light', 1],
  ['burgundy', 'wine', '#6D1F2C', 'cool', 'deep', 1],
  ['dark burgundy', 'wine', '#561824', 'cool', 'deep', 1],
  ['maroon', 'wine', '#6A1F2A', 'neutral', 'deep', 1],
  ['deep maroon', 'wine', '#561A23', 'neutral', 'deep', 1],
  ['wine', 'wine', '#722F37', 'cool', 'deep', 1],
  ['oxblood', 'wine', '#4E1A1F', 'neutral', 'deep', 1],
  ['red', 'red', '#B3242C', 'neutral', 'medium', 2],
  ['brick', 'rust', '#8E3B2E', 'warm', 'medium', 1],
  ['rust', 'rust', '#A0461F', 'warm', 'medium', 1],
  ['terracotta', 'rust', '#B5583A', 'warm', 'medium', 1],
  ['muted terracotta', 'rust', '#A8634A', 'warm', 'medium', 1],
  ['orange', 'orange', '#E07B2E', 'warm', 'medium', 2],
  ['coral', 'orange', '#E9785F', 'warm', 'medium', 2],
  ['peach', 'orange', '#F2B596', 'warm', 'light', 1],
  ['pale peach', 'orange', '#F6CDB4', 'warm', 'light', 1],
  ['apricot', 'orange', '#F0A875', 'warm', 'light', 1],
  ['yellow', 'yellow', '#E7C93B', 'warm', 'light', 2],
  ['bright yellow', 'yellow', '#F2D21B', 'warm', 'light', 2],
  ['butter', 'yellow', '#F2E3A6', 'warm', 'light', 1],
  ['butter yellow', 'yellow', '#F2E3A6', 'warm', 'light', 1],
  ['mustard', 'yellow', '#C9A227', 'warm', 'medium', 1],
  ['mustard yellow', 'yellow', '#C9A227', 'warm', 'medium', 1],
  ['pink', 'pink', '#E7A9B8', 'cool', 'light', 1],
  ['pale pink', 'pink', '#F1C9D2', 'cool', 'light', 1],
  ['dusty pink', 'pink', '#D3A3A6', 'neutral', 'light', 1],
  ['blush', 'pink', '#EBC1C1', 'warm', 'light', 1],
  ['rose', 'pink', '#C9808D', 'cool', 'medium', 1],
  ['lavender', 'purple', '#B9A8D6', 'cool', 'light', 1],
  ['lilac', 'purple', '#C3AED6', 'cool', 'light', 1],
  ['mauve', 'purple', '#8E6A85', 'cool', 'medium', 1],
  ['plum', 'purple', '#5E2750', 'cool', 'deep', 1],
  ['purple', 'purple', '#5B3A80', 'cool', 'medium', 2],
  // Occasion and festive colours (Indian wedding wear).
  ['gold', 'yellow', '#C9A646', 'warm', 'medium', 1],
  ['muted gold', 'yellow', '#B89B5E', 'warm', 'medium', 1],
  ['champagne', 'beige', '#E3D3B0', 'warm', 'light', 0],
  ['saffron', 'orange', '#E8902E', 'warm', 'medium', 2],
  ['saffron yellow', 'yellow', '#EBA937', 'warm', 'medium', 2],
  ['marigold', 'yellow', '#E7A32A', 'warm', 'medium', 2],
  ['marigold yellow', 'yellow', '#E7A32A', 'warm', 'medium', 2],
  ['turmeric', 'yellow', '#D9A520', 'warm', 'medium', 2],
  ['turmeric yellow', 'yellow', '#D9A520', 'warm', 'medium', 2],
  ['pale lemon', 'yellow', '#F3EBA8', 'warm', 'light', 1],
  ['lemon', 'yellow', '#EEDD5A', 'warm', 'light', 2],
  ['dusty rose', 'pink', '#C99A9A', 'neutral', 'medium', 1],
  ['rose pink', 'pink', '#D9899C', 'cool', 'medium', 1],
  ['onion pink', 'pink', '#D9A3A3', 'neutral', 'light', 1],
  ['rani pink', 'pink', '#C2185B', 'cool', 'medium', 2],
  ['silver-grey', 'grey', '#A9ADB1', 'cool', 'light', 0],
  ['silver grey', 'grey', '#A9ADB1', 'cool', 'light', 0],
];

const COLOURS = new Map<string, ManColourInfo>(
  ENTRIES.map(([name, family, hex, temperature, depth, loudness]) => [name, { family, hex, temperature, depth, loudness }]),
);
// Longest names first so "pale blue" wins over "blue" and "dark brown" over "brown".
const NAMES = [...COLOURS.keys()].sort((a, b) => b.length - a.length);
const NAME_PATTERN = new RegExp(`(?<![a-z])(${NAMES.map(name => name.replace(/[-\s]/g, '[-\\s]')).join('|')})(?![a-z]|-stripe)`, 'gi');

/** "Dark shoes", "light slip-on shoes": the board sometimes only gives a depth. */
const DEPTH_ONLY_PATTERN = /^(?:dark|light)(?=[\s-])/i;

export interface ManColourMention {
  name: string;
  index: number;
  /** Length of the matched text, which can differ from `name` in spacing. */
  length: number;
  info: ManColourInfo;
}

function canonical(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').replace(/(\w)\s(?=wash\b)/, '$1-');
}

export function getManColourInfo(name: string): ManColourInfo | null {
  return COLOURS.get(canonical(name)) ?? COLOURS.get(canonical(name).replace(/-/g, ' ')) ?? null;
}

/** Every named colour in a garment line, in order. "Blue-and-white" yields blue then white. */
export function findManColourMentions(text: string): ManColourMention[] {
  const mentions: ManColourMention[] = [];
  for (const match of text.matchAll(NAME_PATTERN)) {
    const info = getManColourInfo(match[1]) ?? getManColourInfo(match[1].replace(/[\s-]+/g, ' '));
    if (info) mentions.push({ name: canonical(match[1]), index: match.index ?? 0, length: match[0].length, info });
  }
  return mentions;
}

const LEADING_JOINERS = /^[\s,]*(?:and|&|with|-and-|-)?[\s,-]*/i;

/**
 * The colour words a garment line opens with: "Blue-and-white vertically striped
 * shirt" → "Blue-and-white". This is the phrase that must survive adaptation.
 */
export function getLeadingColourPhrase(text: string): { phrase: string; mentions: ManColourMention[] } {
  const trimmed = text.trim();
  const depthOnly = trimmed.match(DEPTH_ONLY_PATTERN);
  const mentions = findManColourMentions(trimmed);
  let cursor = 0;
  const leading: ManColourMention[] = [];
  for (const mention of mentions) {
    const gap = trimmed.slice(cursor, mention.index);
    if (gap.replace(LEADING_JOINERS, '').trim()) break;
    leading.push(mention);
    cursor = mention.index + mention.length;
  }
  if (!leading.length) {
    return depthOnly ? { phrase: depthOnly[0], mentions: [] } : { phrase: '', mentions: [] };
  }
  return { phrase: trimmed.slice(0, cursor), mentions: leading };
}

/** Colours that may stand in for each other when the model makes a colour name more precise. */
const NEIGHBOURS: Partial<Record<ManColourFamily, ManColourFamily[]>> = {
  white: ['cream'],
  cream: ['white', 'beige'],
  beige: ['cream', 'tan'],
  tan: ['beige'],
  grey: ['charcoal'],
  charcoal: ['grey'],
  navy: ['blue', 'denim'],
  blue: ['navy', 'denim', 'light-blue'],
  'light-blue': ['blue'],
  denim: ['navy', 'blue', 'light-blue'],
  green: ['dark-green'],
  'dark-green': ['green'],
};

const DARK_FAMILIES: ManColourFamily[] = ['black', 'charcoal', 'navy', 'denim', 'dark-green', 'wine', 'brown'];
const LIGHT_FAMILIES: ManColourFamily[] = ['white', 'cream', 'beige', 'light-blue', 'grey', 'sage', 'pink'];

export interface ManColourLockResult {
  ok: boolean;
  /** The source phrase that the final line should carry, e.g. "Pale turquoise". */
  expected: string;
  found: string;
}

/**
 * Does a final garment line keep its source line's colours? A source with no
 * colour at all ("Matching checked suit jacket") locks nothing.
 */
export function checkManColourLock(sourceLine: string, finalLine: string): ManColourLockResult {
  if (/^\s*(none|no layer)\b/i.test(sourceLine)) return { ok: true, expected: '', found: '' };
  const source = getLeadingColourPhrase(sourceLine);
  const sourceMentions = source.mentions.length ? source.mentions : findManColourMentions(sourceLine).slice(0, 1);
  const final = getLeadingColourPhrase(finalLine);
  const finalMentions = final.mentions.length ? final.mentions : findManColourMentions(finalLine).slice(0, 1);

  let allowed: Set<ManColourFamily>;
  if (sourceMentions.length) {
    allowed = new Set(sourceMentions.flatMap(mention => [mention.info.family, ...(NEIGHBOURS[mention.info.family] ?? [])]));
  } else if (/^dark/i.test(source.phrase)) {
    allowed = new Set(DARK_FAMILIES);
  } else if (/^light/i.test(source.phrase)) {
    allowed = new Set(LIGHT_FAMILIES);
  } else {
    return { ok: true, expected: '', found: final.phrase };
  }

  const expected = source.phrase || sourceMentions.map(mention => mention.name).join(' and ');
  // A source that only gives a depth ("dark trousers") is satisfied by the same depth word or any colour of that depth.
  if (!finalMentions.length) return { ok: !sourceMentions.length, expected, found: final.phrase };
  const ok = finalMentions.every(mention => allowed.has(mention.info.family))
    && sourceMentions.every(mention => finalMentions.some(found =>
      found.info.family === mention.info.family || (NEIGHBOURS[mention.info.family] ?? []).includes(found.info.family)));
  return { ok, expected, found: final.phrase || finalMentions.map(mention => mention.name).join(' and ') };
}

/** Puts the source's colour phrase back at the start of a final garment line. */
export function restoreManSourceColour(sourceLine: string, finalLine: string): string | null {
  const source = getLeadingColourPhrase(sourceLine);
  const final = getLeadingColourPhrase(finalLine);
  if (!source.phrase || !source.mentions.length || !final.phrase) return null;
  const rest = finalLine.trim().slice(final.phrase.length).replace(/^[\s,]+/, '');
  const phrase = source.phrase.charAt(0).toUpperCase() + source.phrase.slice(1).toLowerCase();
  return `${phrase} ${rest}`.trim();
}

// ── Client colouring ────────────────────────────────────────────────────────

export interface ManClientColouring {
  temperature: 'warm' | 'cool' | 'neutral';
  depth: 'light' | 'medium' | 'deep';
  soft: boolean;
  paletteFamilies: Set<ManColourFamily>;
  avoidFamilies: Set<ManColourFamily>;
  /** From the intake white test. */
  whitePreference?: 'bright_white' | 'cream' | 'both' | 'avoids' | string;
}

export function readManClientColouring(colour: {
  season?: string;
  undertone?: string;
  skin_tone_depth?: string;
  primary_palette?: Array<{ name: string }>;
  neutral_base_colours?: Array<{ name: string }>;
  accent_colours?: Array<{ name: string }>;
  colours_to_avoid?: Array<{ name: string }>;
}, whitePreference?: string): ManClientColouring {
  const season = `${colour.season ?? ''} ${colour.undertone ?? ''}`.toLowerCase();
  const temperature = /\bcool|winter|summer/.test(season) ? 'cool' : /\bwarm|autumn|spring/.test(season) ? 'warm' : 'neutral';
  const depthText = `${colour.season ?? ''} ${colour.skin_tone_depth ?? ''}`.toLowerCase();
  const depth = /deep|dark|dusky|rich/.test(depthText) ? 'deep' : /light|fair|porcelain/.test(depthText) ? 'light' : 'medium';
  const families = (items?: Array<{ name: string }>) => new Set((items ?? []).flatMap(item => findManColourMentions(item.name).map(mention => mention.info.family)));
  const paletteFamilies = new Set([
    ...families(colour.primary_palette),
    ...families(colour.neutral_base_colours),
    ...families(colour.accent_colours),
  ]);
  const avoidFamilies = families(colour.colours_to_avoid);
  for (const family of paletteFamilies) avoidFamilies.delete(family);
  return {
    temperature,
    depth,
    soft: /soft|muted/.test(season),
    paletteFamilies,
    avoidFamilies,
    whitePreference,
  };
}

/** -1 (works against him) … +1 (one of his colours). Only meaningful near the face. */
export function scoreManColourNearFace(info: ManColourInfo, client: ManClientColouring): number {
  if (client.avoidFamilies.has(info.family)) return -1;
  let score = client.paletteFamilies.has(info.family) ? 0.8 : 0.1;
  if (client.temperature === 'cool' && info.temperature === 'warm' && info.loudness >= 1) score -= 0.7;
  if (client.temperature === 'warm' && info.temperature === 'cool' && info.loudness >= 1) score -= 0.45;
  if (client.depth === 'light' && info.family === 'black') score -= 0.5;
  if (client.soft && info.loudness === 2) score -= 0.4;
  if (info.family === 'white' || info.family === 'cream') {
    if (client.whitePreference === 'avoids') score -= 0.6;
    if (client.whitePreference === 'cream' && info.family === 'white') score -= 0.3;
    if (client.whitePreference === 'bright_white' && info.family === 'cream') score -= 0.1;
  }
  return Math.max(-1, Math.min(1, score));
}

/** Bottoms and shoes barely touch the face; only an explicit avoid colour counts there. */
export function scoreManColourAwayFromFace(info: ManColourInfo, client: ManClientColouring): number {
  return client.avoidFamilies.has(info.family) ? -0.5 : 0;
}

export function manColourHex(name: string): string | null {
  return getManColourInfo(name)?.hex ?? null;
}
