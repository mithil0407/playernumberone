/**
 * Pure text-safety rules for garment descriptions.
 *
 * These transforms run on every generation AND on every repair, so each one must
 * be idempotent. When they were not, they compounded their own output: live
 * reports contain "soft V that does not expose soft V that does not expose
 * cleavage", "secured secured wrap neckline neckline top", and "and- horizontal
 * stripe" where a colour word was stripped out of the middle of a phrase.
 *
 * Extracted from stylistBlueprintGenerator so the rules can be unit tested
 * without pulling in the model clients.
 */

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Every entry must be safe to splice into garment text and must NOT contain any
// word matched by UNSAFE_NECKLINE_RE, or the substitution will re-match its own
// output and compound on each regeneration.
export const SAFE_NECKLINES = [
  'modest V-neckline',
  'open collar with a safe button stance',
  'high scoop neckline',
  'boat neck',
  'modest square neck',
  'crew neck',
  'jewel neck',
  'collared shirt with a safe button stance',
  'mock neck',
  'band or mandarin collar',
  'secured wrap neckline',
];

export const UNSAFE_NECKLINES = [
  'deep V',
  'plunging neckline',
  'low scoop',
  'keyhole',
  'off-shoulder',
  'one-shoulder',
  'strapless',
  'spaghetti straps',
  'strappy camisole as a standalone top',
  'cleavage-revealing wrap',
];

const COLOUR_MODIFIER_WORDS = [
  'soft', 'deep', 'dark', 'light', 'muted', 'dusty', 'warm', 'cool', 'pale', 'rich',
  'bright', 'washed', 'faded', 'dusky', 'smoky', 'smokey',
];

// Fabric-ish words (denim, chambray) are deliberately excluded so they survive as
// garment/fabric descriptors rather than being stripped as colours.
export const COLOUR_NAME_WORDS = [
  'black', 'white', 'ivory', 'cream', 'off-white', 'offwhite', 'navy', 'blue', 'cobalt',
  'indigo', 'grey', 'gray', 'slate', 'charcoal', 'graphite', 'pewter', 'silver', 'brown',
  'tan', 'taupe', 'camel', 'cognac', 'espresso', 'cocoa', 'chocolate', 'mocha', 'beige',
  'oat', 'oatmeal', 'stone', 'sand', 'khaki', 'olive', 'green', 'emerald', 'teal', 'sage',
  'forest', 'mint', 'burgundy', 'oxblood', 'maroon', 'wine', 'berry', 'raspberry', 'cranberry', 'cherry', 'red', 'crimson',
  'scarlet', 'pink', 'rose', 'blush', 'fuchsia', 'magenta', 'coral', 'peach', 'salmon',
  'orange', 'rust', 'terracotta', 'sienna', 'amber', 'mustard', 'marigold', 'gold',
  'golden', 'yellow', 'ochre', 'mauve', 'lilac', 'lavender', 'purple', 'violet', 'plum',
  'aubergine', 'bronze', 'copper', 'nude', 'ecru', 'bone', 'chalk', 'pearl', 'jet', 'ink',
  'aqua', 'turquoise', 'cyan', 'periwinkle', 'jade', 'sapphire',
];

const COLOUR_MODIFIER_COLOUR_RE = new RegExp(
  `\\b(?:${COLOUR_MODIFIER_WORDS.join('|')})\\s+(?:${COLOUR_NAME_WORDS.join('|')})\\b`,
  'gi',
);
const COLOUR_NAME_RE = new RegExp(`\\b(?:${COLOUR_NAME_WORDS.join('|')})\\b`, 'gi');

// Strip colour words from a piece description so a single plan colour can be
// prepended without producing impossible two-colour garments
// (e.g. "emerald silk dress" must not become "Camel Tan emerald silk dress").
export function stripColourWords(piece: string) {
  return tidyStrippedPhrase(
    piece
      .replace(COLOUR_MODIFIER_COLOUR_RE, GAP)
      .replace(COLOUR_NAME_RE, GAP),
  );
}

/** Marks where a colour word was removed, so the cleanup knows what to repair. */
const GAP = '\u0000';

/**
 * Cleans up after colour stripping. Removing a colour from the middle of a
 * phrase strands the grammar around it — "Charcoal and white horizontal stripe"
 * shipped as "and- horizontal stripe", and "scarf in rose and brown tied" as
 * "scarf in and tied". Because the stripper marks each removal with GAP, this
 * can repair the exact join rather than guessing from whitespace.
 */
function tidyStrippedPhrase(value: string) {
  const gap = '\u0000';
  return value
    // A conjunction or preposition whose object was the removed colour goes too.
    .replace(new RegExp(`\\b(and|or|&|in|with|of)\\s*${gap}`, 'gi'), gap)
    .replace(new RegExp(`${gap}\\s*[-–—]?\\s*\\b(and|or|&)\\b`, 'gi'), gap)
    // Collapse runs of adjacent removals, then drop the markers.
    .replace(new RegExp(`(?:${gap}|\\s|[-–—])*${gap}(?:${gap}|\\s|[-–—])*`, 'g'), ' ')
    .replace(new RegExp(gap, 'g'), ' ')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/([,;])\s*(?=[,.;])/g, '')
    .replace(/\s[-–—]+(?=\s|$)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,\-–—]+/, '')
    .replace(/[\s,\-–—]+$/, '')
    // A trailing article or preposition left with nothing to govern.
    .replace(/\s+\b(the|a|an|in|with|of|and|or)\b\s*\.?$/i, '')
    .trim();
}

// Test seams for the text-safety rules. Both are pure string transforms; the
// neckline helper is exercised with a coverage-required plan because that is the
// only path where it rewrites anything.
const UNSAFE_NECKLINE_RE = /\b(deep\s*v|deep-v|plung(?:e|ing)|low[-\s]?cut|low\s+scoop|low\s+neck|keyhole|off[-\s]?shoulder|one[-\s]?shoulder|strapless|spaghetti\s+strap|strappy|cleavage|décolletage|decolletage)\b/i;
const STANDALONE_CAMISOLE_RE = /\b(camisole|cami|tank)\b/i;

export function slotNeedsNecklineSafety(slot: string) {
  return /top|blouse|shirt|tee|t-shirt|knit|camisole|tank|dress|jumpsuit|kurta|tunic|co-ord|coord|set|base layer/i.test(slot);
}

/**
 * Rewrites an unsafe neckline in a garment description into an approved one.
 *
 * Every step here must be idempotent. This runs again on every repair and
 * regeneration, and when it was not idempotent it compounded its own output —
 * live reports contain "soft V that does not expose soft V that does not expose
 * cleavage" and "secured secured wrap neckline neckline top".
 */
export interface NecklineSafetyRules {
  /** True when this client's intake requires chest coverage. */
  necklineRequired: boolean;
  /** Approved neckline phrases, most preferred first. */
  approvedNecklines: string[];
}

export function applyNecklineSafetyToPiece(piece: string, slot: string, rules: NecklineSafetyRules) {
  if (!rules.necklineRequired || !slotNeedsNecklineSafety(slot)) return piece;
  const approved = rules.approvedNecklines[0];
  // Never splice in a phrase that the unsafe pattern would match on the next run.
  const safeNeckline = approved && !UNSAFE_NECKLINE_RE.test(approved) ? approved : SAFE_NECKLINES[0];
  let next = piece
    .replace(UNSAFE_NECKLINE_RE, safeNeckline)
    // Only an unqualified "wrap" needs rewriting; one already carrying its
    // neckline wording ("wrap neckline", "wrap-style neckline") is left alone so
    // repeat runs cannot stack the words. "wrap-style" used to become
    // "secured wrap neckline-style neckline".
    .replace(/\bwrap\b(?![-\s]*(?:style\s+)?neckline)/gi, (match, offset: number, whole: string) => (
      /\bsecured\s+$/i.test(whole.slice(0, offset)) ? match : 'secured wrap neckline'
    ))
    .replace(/\b(neckline|neck)\s+neckline\b/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (STANDALONE_CAMISOLE_RE.test(next)) {
    next = next.replace(STANDALONE_CAMISOLE_RE, `${safeNeckline} sleeved shell`)
      // The source may already end in "shell", which would double it.
      .replace(/\bshell\s+shell\b/gi, 'shell');
  }
  // A neckline the piece already states is kept. The list used to miss "high
  // round neck", "spread collar" and "V-slit neckline", so those pieces gained a
  // contradictory "with a modest V-neckline" on the end.
  if (!new RegExp(`\\b(${SAFE_NECKLINES.map(escapeRegExp).join('|')}|collared|collar|open collar|soft v|v neck|v-neck|v-slit|slit neckline|crew|jewel|mock|mandarin|band collar|boat|bateau|soft scoop|modest square|round neck|high neck|high-neck|turtle-?neck|polo|henley|button stance|secured wrap|wrap neckline|wrap-style neckline)\\b`, 'i').test(next)) {
    next = `${next} with a ${safeNeckline}`;
  }
  return next;
}

