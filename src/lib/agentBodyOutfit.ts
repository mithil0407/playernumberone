// From body shape to a real outfit: after the Body Card, the agent suggests one
// look from ICONIK's hand-picked libraries (women: outfitlibrarywomen.md, men:
// the Pinterest board library) and offers to find it. The libraries aren't
// tagged by body shape, so looks are ranked by what the garments are — a wrap
// top, an A-line skirt, a structured shoulder — against what flatters each
// shape, and by the client's colours when we know them.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BODY_SHAPES, type BodyLine } from './agentBodyCard.ts';
import { loadOccasionLibrary } from './agentOccasionLibrary.ts';
import { parseWomenOutfitLibrary } from './stylistOutfitLibraryParser.ts';

export interface BodyLibraryLook {
  /** Stable across restarts, e.g. "women-06" or "board-220". */
  id: string;
  line: BodyLine;
  /** Women: Professional / Social / Everyday / Occasion. Men: the setting in the library. */
  setting: string;
  /** The garments, one line each, e.g. "Top: Optic white fine-rib knit shell". */
  pieces: string[];
  styling: string;
}

type Rule = [RegExp, number];

/** What the garment text says about fit. Positive helps the shape, negative works against it. */
const SHAPE_RULES: Record<BodyLine, Record<string, Rule[]>> = {
  woman: {
    hourglass: [
      [/\bwrap\b|\bbelt|cinch|fitted|shaped waist|defined waist|nipped|peplum|fit-and-flare|high[- ]rise|\bbias\b|a-line/i, 1],
      [/\bboxy\b|oversized|drop[- ]waist|shapeless|\btent\b|smock/i, -1.5],
    ],
    pear: [
      [/structured shoulder|sharp shoulder|boat neck|bateau|square neck|off[- ]shoulder|puff sleeve|statement sleeve|embellished|blazer|a-line|wide[- ]leg|bootcut|flare|straight[- ]leg/i, 1],
      [/skinny|pencil|bodycon|cargo|patch pocket|hip pocket|leggings|clingy|slip skirt/i, -1.5],
    ],
    'inverted triangle': [
      [/wide[- ]leg|a-line|full skirt|pleated|flare|bootcut|v[- ]neck|scoop|soft shoulder|drape|cowl|tiered|flowy|midi skirt/i, 1],
      [/shoulder pad|structured shoulder|sharp shoulder|puff sleeve|boat neck|halter|off[- ]shoulder|strapless|double[- ]breasted|statement sleeve/i, -1.5],
    ],
    rectangle: [
      [/\bbelt|\bwrap\b|peplum|ruffle|tiered|ruched|cinch|layer|\bbias\b|fit-and-flare|a-line|textured|bouclé|boucle/i, 1],
      [/\bboxy\b|\bshift\b|column dress|oversized/i, -1.5],
    ],
    apple: [
      [/empire|\bwrap\b|v[- ]neck|a-line|flowy|drape|open|longline|straight[- ]leg|wide[- ]leg|duster|tunic|kurta|structured jacket/i, 1],
      [/bodycon|crop(?:ped)? top|clingy|tight|halter|corset|bustier|strapless|high[- ]waist belt|fully tuck|ruched at the waist/i, -1.5],
    ],
  },
  man: {
    trapezoid: [
      [/tailored|fitted|\btuck|slim|structured|bandhgala|blazer/i, 0.5],
      [/oversized|\bboxy\b/i, -0.75],
    ],
    rectangle: [
      [/layer|jacket|blazer|bomber|overshirt|structured shoulder|textured|check|stripe|knit|bandhgala|nehru|waistcoat|vest/i, 1],
      [/skinny|ultra[- ]slim|plain tee/i, -1],
    ],
    'inverted triangle': [
      [/straight[- ]leg|relaxed|wide[- ]leg|soft shoulder|unstructured|v[- ]neck|knit|henley|polo|pleated|cargo/i, 1],
      [/padded shoulder|structured shoulder|peak lapel|epaulette|double[- ]breasted|puffer|\bboxy\b/i, -1.5],
    ],
    oval: [
      [/worn open|open|longline|straight|v[- ]neck|tonal|pinstripe|unlined|drape|bandhgala|knee[- ]length|waistcoat/i, 1],
      [/horizontal stripe|\btight|slim[- ]fit|cropped|short kurta|\bbelt|chunky|bomber|cargo/i, -1.25],
    ],
    triangle: [
      [/structured shoulder|jacket|blazer|layer|overshirt|bomber|straight|check|stripe/i, 1],
      [/skinny|tapered|slim[- ]fit trousers|cargo/i, -1.25],
    ],
  },
};

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const trimStop = (value: string) => value.replace(/[\s.]+$/, '').trim();

function fieldValue(fields: Array<{ label: string; value: string }>, label: string) {
  return fields.find(field => field.label === label)?.value ?? '';
}

export function parseWomenBodyLibrary(raw: string): BodyLibraryLook[] {
  return parseWomenOutfitLibrary(raw).flatMap(outfit => {
    const slot = (label: string) => trimStop(fieldValue(outfit.fields, label));
    const pieces = [
      ['Dress', slot('Dress') || slot('Outfit')],
      ['Top', slot('Top')],
      ['Layer', slot('Outerwear')],
      ['Bottom', slot('Bottom')],
      ['Shoes', slot('Footwear')],
    ].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
    // A look needs a body and shoes to be searchable; fragments are skipped.
    return pieces.length >= 3 ? [{ id: outfit.id, line: 'woman' as const, setting: outfit.capsule, pieces, styling: trimStop(slot('Styling Line')) }] : [];
  });
}

const cache = new Map<BodyLine, BodyLibraryLook[]>();

/** The library for womenswear or menswear; empty (not an error) if the file can't be read. */
export function loadBodyLibrary(line: BodyLine): BodyLibraryLook[] {
  const cached = cache.get(line);
  if (cached) return cached;
  let looks: BodyLibraryLook[] = [];
  try {
    if (line === 'woman') {
      looks = parseWomenBodyLibrary(readFileSync(join(process.cwd(), 'outfitlibrarywomen.md'), 'utf-8'));
    } else {
      looks = loadOccasionLibrary('board').filter(outfit => !/carried|in one hand|slung|draped over/i.test(`${outfit.layer ?? ''} ${outfit.top} ${outfit.styling}`)).map(outfit => ({
        id: `board-${outfit.id}`,
        line: 'man' as const,
        setting: outfit.setting.replace(/^\/\s*/, ''),
        pieces: [
          ['Top', outfit.top], ['Layer', outfit.layer], ['Bottom', outfit.bottom], ['Shoes', outfit.footwear],
        ].filter(([, value]) => value).map(([label, value]) => `${label}: ${trimStop(value as string)}`),
        styling: trimStop(outfit.styling),
      }));
    }
  } catch (error) {
    console.warn('[agent] could not load the outfit library:', error);
  }
  if (looks.length) cache.set(line, looks);
  return looks;
}

/** "office", "date night", "wedding"… → the library settings that fit, or null when nothing was asked. */
function settingsFor(line: BodyLine, occasion: string | null | undefined) {
  const text = (occasion ?? '').toLowerCase();
  if (!text) return null;
  if (/office|work|meeting|interview|formal|business/.test(text)) return line === 'woman' ? ['Professional'] : ['FORMAL'];
  if (/party|dinner|date|evening|night|cocktail|club/.test(text)) return line === 'woman' ? ['Social', 'Occasion'] : ['WEAR'];
  if (/wedding|festive|diwali|function|sangeet|mehendi|puja|pooja/.test(text)) return line === 'woman' ? ['Occasion'] : ['WEAR', 'FORMAL'];
  if (/casual|weekend|everyday|college|brunch|coffee|travel|day/.test(text)) return line === 'woman' ? ['Everyday'] : ['CASUAL'];
  return null;
}

function mentions(text: string, names: unknown) {
  if (!Array.isArray(names)) return 0;
  const lower = text.toLowerCase();
  return names.reduce<number>((count, name) => count + (typeof name === 'string' && name.length > 2 && lower.includes(name.toLowerCase()) ? 1 : 0), 0);
}

/** How well a look suits the shape (and colours); higher is better. */
export function scoreBodyLook(look: BodyLibraryLook, shape: string, profile: Record<string, unknown>, seed = '') {
  const garments = look.pieces.join(' ');
  const text = `${garments} ${look.styling}`;
  let score = 0;
  for (const [pattern, weight] of SHAPE_RULES[look.line][shape] ?? []) {
    // Each distinct feature counts (a wrap top AND an A-line skirt), up to three.
    const hits = new Set((text.match(new RegExp(pattern.source, 'gi')) ?? []).map(hit => hit.toLowerCase())).size;
    score += weight * Math.min(hits, 3);
  }
  // Colour matters most near the face: the first garments listed.
  const nearFace = look.pieces.filter(piece => /^(?:Dress|Top|Layer):/.test(piece)).join(' ');
  score -= mentions(nearFace, profile.avoid_colours) * 5;
  score += Math.min(1.5, mentions(nearFace, profile.best_colours) * 0.5);
  return score + stableHash(`${seed}:${look.id}`) * 0.4;
}

/** The best looks for this shape, best first. Without an occasion: everyday and work looks. */
export function pickBodyLooks(
  options: { line: BodyLine; shape: string; profile?: Record<string, unknown>; occasion?: string | null; exclude?: string[]; count?: number; seed?: string },
  library: BodyLibraryLook[] = loadBodyLibrary(options.line),
) {
  const wanted = settingsFor(options.line, options.occasion);
  const excluded = new Set(options.exclude ?? []);
  // Without an occasion, womenswear gets everyday and work looks (no sarees and cocktail dresses out of the blue).
  const inSetting = (look: BodyLibraryLook) => wanted
    ? wanted.some(setting => look.setting.toUpperCase().includes(setting.toUpperCase()))
    : look.line === 'man' || look.setting === 'Everyday' || look.setting === 'Professional';
  let pool = library.filter(look => !excluded.has(look.id) && inSetting(look));
  if (!pool.length) pool = library.filter(look => !excluded.has(look.id));
  return pool
    .map(look => ({ look, score: scoreBodyLook(look, options.shape, options.profile ?? {}, options.seed) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.count ?? 1)
    .map(item => item.look);
}

export function lookBullets(look: BodyLibraryLook) {
  return look.pieces.map(piece => `• ${piece}`).join('\n');
}

/** The look as one line, piece by piece: what the product search works from. */
export function lookText(look: BodyLibraryLook) {
  return look.pieces.join('; ');
}

/** The message that follows the wow: the best outfit for their shape, then a real look that does it. */
export function bodyOutfitMessage(input: { line: BodyLine; shape: string; bestOutfit: string; look: BodyLibraryLook | null }) {
  const info = BODY_SHAPES[input.line][input.shape];
  const best = input.bestOutfit.trim();
  const head = `Your best outfit as a ${info.label.toLowerCase()}: ${best}`;
  if (!input.look) return head;
  const tip = input.look.styling ? `\n\nStyling tip: ${input.look.styling}.` : '';
  return `${head}\n\nHere's a look from our library that does exactly that:\n${lookBullets(input.look)}\n\nWhy it works for you: ${info.why}${tip}`;
}

/** The last message of the Body Card flow, the one they answer. */
export const BODY_LINK_QUESTION = "Want me to find this for you with shopping links? Send your pincode and your usual size, and I'll check stock and delivery to you 📍";
