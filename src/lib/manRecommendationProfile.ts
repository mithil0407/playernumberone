/**
 * What the outfit picker knows about how a man wants to dress.
 *
 * Built from the intake answers by plain rules (no model), stored on the
 * report's classification so every later pick for that report sees the same
 * inputs. Older intakes without the taste questions get sensible values
 * derived from the answers they did give.
 *
 * Shared by the intake page (questions, taste looks, piece chips) and the
 * server (picker, QA), so nothing here may touch the filesystem.
 */

export type ManOutfitContext = 'Office / Formal' | 'Smart Casual' | 'Evening Wear' | 'Relaxed Casual';
export const MAN_OUTFIT_CONTEXTS: ManOutfitContext[] = ['Office / Formal', 'Smart Casual', 'Evening Wear', 'Relaxed Casual'];

export type ManWeekKey = 'office' | 'smart' | 'evening' | 'relaxed';
export type ManDressCode = 'suit_tie' | 'smart_no_tie' | 'business_casual' | 'casual' | 'no_office';
export type ManTasteVerdict = 'love' | 'try' | 'never';
export type ManAgeRange = 'under_25' | '25_34' | '35_44' | '45_54' | '55_plus';
export type ManOutfitLadderStep = 'comfort' | 'step-up' | 'stretch';

/** The answers stored in `man_intake_submissions.style_profile`. */
export interface ManStyleProfileAnswers {
  version: 1;
  age_range?: ManAgeRange;
  city?: string;
  week?: Partial<Record<ManWeekKey, number>>;
  dress_code?: ManDressCode;
  /** 1 = keep it safe … 10 = push me. */
  experimentation?: number;
  /** 1 = neutrals only … 10 = bring the colour. */
  colour_boldness?: number;
  /** Board look id → verdict, from the taste test. */
  taste?: Record<string, ManTasteVerdict>;
  try_pieces?: string[];
  never_pieces?: string[];
  style_reference?: string;
}

export interface ManRecommendationProfile {
  version: 1;
  /** 'intake' when the client answered the taste questions; 'derived' for older intakes. */
  source: 'intake' | 'derived';
  tribes: string[];
  poles: { structure?: string; expression?: string; tone?: string; register?: string };
  style_relationship?: string;
  primary_goal?: string;
  experimentation: number;
  colour_boldness: number;
  week: Record<ManWeekKey, number>;
  dress_code: ManDressCode;
  taste: Record<string, ManTasteVerdict>;
  try_pieces: string[];
  never_pieces: string[];
  age_range?: ManAgeRange;
  city?: string;
  style_reference?: string;
  anti_pref_note?: string;
  white_preference?: string;
  /** Net 👍 minus 👎 per library look across every client, when the profile was built. */
  look_feedback?: Record<string, number>;
  built_at: string;
}

/** The intake fields the profile reads. */
export interface ManRecommendationProfileSource {
  style_tribes?: string | null;
  style_pole_structure?: string | null;
  style_pole_expression?: string | null;
  style_pole_tone?: string | null;
  style_pole_register?: string | null;
  style_relationship?: string | null;
  primary_goal?: string | null;
  dressing_context?: string | null;
  style_anti_pref_note?: string | null;
  white_test?: string | null;
  style_profile?: unknown;
}

// ── Questions shown on the intake ───────────────────────────────────────────

export const MAN_AGE_RANGES: Array<{ value: ManAgeRange; label: string }> = [
  { value: 'under_25', label: 'Under 25' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_plus', label: '55+' },
];

export const MAN_WEEK_ROWS: Array<{ key: ManWeekKey; label: string; hint: string }> = [
  { key: 'office', label: 'Work', hint: 'Office days, meetings, client calls' },
  { key: 'smart', label: 'Smart casual', hint: 'Lunches, errands, casual Fridays' },
  { key: 'evening', label: 'Evenings out', hint: 'Dinners, dates, drinks, parties' },
  { key: 'relaxed', label: 'Relaxed', hint: 'Weekends, travel, at home' },
];

export const MAN_WEEK_LEVELS = ['Rarely', 'Sometimes', 'Often', 'Most days'] as const;

export const MAN_DRESS_CODES: Array<{ value: ManDressCode; label: string; sub: string }> = [
  { value: 'suit_tie', label: 'Suit and tie', sub: 'Formal office, banking, law, senior client meetings' },
  { value: 'smart_no_tie', label: 'Smart, no tie needed', sub: 'Blazers and good trousers, ties optional' },
  { value: 'business_casual', label: 'Business casual', sub: 'Shirts, chinos and knits; suits would look out of place' },
  { value: 'casual', label: 'Casual', sub: 'Startup or creative work; almost anything goes' },
  { value: 'no_office', label: "I don't go into an office", sub: 'Work from home or on the move' },
];

export const MAN_EXPERIMENTATION_STOPS: Array<{ max: number; label: string; sub: string }> = [
  { max: 2, label: 'Keep it safe', sub: 'Classic pieces, done really well' },
  { max: 4, label: 'A little more interesting', sub: 'Better fabrics, one detail that stands out' },
  { max: 6, label: 'Push me a bit', sub: 'A statement jacket, a new silhouette, some colour' },
  { max: 8, label: 'Make me stand out', sub: 'Pieces I would never have picked myself' },
  { max: 10, label: 'Go all in', sub: 'Fashion-forward, bold, editorial' },
];

export const MAN_COLOUR_STOPS: Array<{ max: number; label: string; sub: string }> = [
  { max: 2, label: 'Neutrals only', sub: 'Navy, grey, white, black, brown' },
  { max: 4, label: 'Neutrals plus one', sub: 'One soft colour per outfit' },
  { max: 6, label: 'Some colour', sub: 'Greens, pinks, burgundy, teal' },
  { max: 8, label: 'Lots of colour', sub: 'Brighter shirts, coloured trousers' },
  { max: 10, label: 'Bring it on', sub: 'Bold colour and colour combinations' },
];

export function manScaleStop<T extends { max: number }>(stops: T[], value: number): T {
  return stops.find(stop => value <= stop.max) ?? stops[stops.length - 1];
}

/**
 * Twelve board looks spanning quiet to bold, shown as a taste test. The ids are
 * board look ids in ICONIK_Mens_Library_Board.md; the pieces repeat that file so
 * the intake can render them without reading it.
 */
export const MAN_TASTE_LOOKS: Array<{ id: number; title: string; pieces: string[] }> = [
  { id: 299, title: 'Crisp and classic', pieces: ['White button-front shirt', 'Grey tailored trousers', 'Brown leather loafers'] },
  { id: 304, title: 'Old-money stripe', pieces: ['Blue-and-white striped shirt', 'Cream trousers', 'Dark brown loafers'] },
  { id: 201, title: 'Quiet texture', pieces: ['White T-shirt', 'Tan suede overshirt, worn open', 'Charcoal tailored trousers', 'Tan suede loafers'] },
  { id: 251, title: 'Dark and sharp', pieces: ['Black turtleneck', 'Grey tailored trousers', 'Black loafers'] },
  { id: 249, title: 'Tonal cream', pieces: ['Cream knit polo', 'Matching cream trousers', 'Tan suede loafers'] },
  { id: 283, title: 'Night-out bomber', pieces: ['Black T-shirt', 'Beige bomber jacket', 'Black trousers', 'Brown suede Chelsea boots'] },
  { id: 225, title: 'All-black leather', pieces: ['Black T-shirt', 'Black leather jacket', 'Black jeans', 'Black sneakers'] },
  { id: 258, title: 'Colour on the legs', pieces: ['Light blue knit polo', 'Burgundy trousers', 'Tan suede loafers'] },
  { id: 209, title: 'Riviera pink', pieces: ['Pink shirt', 'Pale knit over the shoulders', 'White trousers', 'Dark loafers'] },
  { id: 206, title: 'Fashion-forward vest', pieces: ['White T-shirt', 'Blue sweater vest', 'Charcoal jeans', 'Gold pendant necklace'] },
  { id: 301, title: 'Bold colour blazer', pieces: ['Pale turquoise shirt', 'Coral blazer, worn open', 'White trousers', 'Dark brown loafers'] },
  { id: 343, title: 'Indo-western', pieces: ['Navy bandhgala jacket', 'Ivory trousers', 'Brown loafers'] },
];

/** Garments and details a client can ask for or rule out. Patterns match library garment text. */
export const MAN_STYLE_PIECES: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: 'overshirt', label: 'Overshirts', pattern: /overshirt|shirt,? worn open|open shirt/i },
  { id: 'statement_jacket', label: 'Bombers & suede jackets', pattern: /bomber|suede[-\s]look jacket|suede jacket|zip-front jacket/i },
  { id: 'leather_jacket', label: 'Leather jackets', pattern: /leather(?:-look)? jacket/i },
  { id: 'blazer', label: 'Blazers', pattern: /blazer/i },
  { id: 'suit', label: 'Suits', pattern: /suit jacket|\bsuit\b/i },
  { id: 'tie', label: 'Ties', pattern: /\btie\b/i },
  { id: 'knit_polo', label: 'Knit polos', pattern: /knit polo|ribbed .*polo|long-sleeve polo/i },
  { id: 'polo', label: 'Polo shirts', pattern: /\bpolo\b/i },
  { id: 'turtleneck', label: 'Turtlenecks', pattern: /turtleneck|high-neck|roll[-\s]?neck/i },
  { id: 'layered_knit', label: 'Knits over shirts', pattern: /sweater over|collar (?:just )?visible|visible at collar|cardigan|sweater vest/i },
  { id: 'vest', label: 'Vests & gilets', pattern: /\bvest\b|gilet/i },
  { id: 'pleated', label: 'Pleated trousers', pattern: /pleated/i },
  { id: 'white_trousers', label: 'White or cream trousers', pattern: /(white|cream|ivory)\b[^,;]*\b(trousers|chinos)/i },
  { id: 'coloured_trousers', label: 'Coloured trousers', pattern: /(burgundy|olive|green|red|blue)\b[^,;]*\b(trousers|chinos)\b/i },
  { id: 'jeans', label: 'Jeans', pattern: /\bjeans\b|denim/i },
  { id: 'shorts', label: 'Shorts', pattern: /\bshorts\b/i },
  { id: 'kurta', label: 'Kurtas', pattern: /kurta/i },
  { id: 'bandhgala', label: 'Bandhgalas', pattern: /bandhgala|nehru|jodhpuri/i },
  { id: 'loafers', label: 'Loafers', pattern: /loafer/i },
  { id: 'boots', label: 'Chelsea & ankle boots', pattern: /chelsea|boots?\b/i },
  { id: 'sneakers', label: 'Sneakers', pattern: /sneaker/i },
  { id: 'jewellery', label: 'Chains, pendants & bracelets', pattern: /pendant|necklace|bracelet|chain/i },
  { id: 'caps', label: 'Caps', pattern: /\bcap\b/i },
  { id: 'bags', label: 'Bags & totes', pattern: /\bbag\b|tote|backpack|briefcase|duffel|pouch/i },
  { id: 'patterns', label: 'Stripes, checks & prints', pattern: /stripe|striped|check|checked|plaid|gingham|print|graphic|pattern/i },
  { id: 'pastels', label: 'Pastels', pattern: /\b(pale |light |dusty )?(pink|mint|lavender|peach|turquoise|sage)\b/i },
  { id: 'brights', label: 'Bright colours', pattern: /\bbright\b|\byellow\b|\bcoral\b|\bred\b|\borange\b/i },
  { id: 'all_black', label: 'All-black outfits', pattern: /^(?=[^|]*black)(?=(?:[^|]*\|){2}[^|]*black)/i },
];

// ── Building the profile ───────────────────────────────────────────────────

const WEEK_KEYS: ManWeekKey[] = ['office', 'smart', 'evening', 'relaxed'];
const DRESS_CODES = new Set<string>(MAN_DRESS_CODES.map(code => code.value));
const AGE_RANGES = new Set<string>(MAN_AGE_RANGES.map(range => range.value));
const PIECE_IDS = new Set(MAN_STYLE_PIECES.map(piece => piece.id));
const TASTE_IDS = new Set(MAN_TASTE_LOOKS.map(look => String(look.id)));
const VERDICTS = new Set<string>(['love', 'try', 'never']);

function clampInt(value: unknown, min: number, max: number): number | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(number)) return undefined;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return text || undefined;
}

function cleanList(value: unknown, allowed: Set<string>): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = [...new Set(value.filter((item): item is string => typeof item === 'string' && allowed.has(item)))];
  return list.length ? list : undefined;
}

/** Accepts the raw JSON (object or string) and keeps only known, in-range answers. */
export function parseManStyleProfileAnswers(raw: unknown): ManStyleProfileAnswers | null {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;

  const week: Partial<Record<ManWeekKey, number>> = {};
  if (input.week && typeof input.week === 'object' && !Array.isArray(input.week)) {
    for (const key of WEEK_KEYS) {
      const level = clampInt((input.week as Record<string, unknown>)[key], 0, 3);
      if (level !== undefined) week[key] = level;
    }
  }
  const taste: Record<string, ManTasteVerdict> = {};
  if (input.taste && typeof input.taste === 'object' && !Array.isArray(input.taste)) {
    for (const [id, verdict] of Object.entries(input.taste as Record<string, unknown>)) {
      if (TASTE_IDS.has(id) && typeof verdict === 'string' && VERDICTS.has(verdict)) taste[id] = verdict as ManTasteVerdict;
    }
  }
  const tryPieces = cleanList(input.try_pieces, PIECE_IDS);
  const neverPieces = cleanList(input.never_pieces, PIECE_IDS)?.filter(piece => !tryPieces?.includes(piece));

  const answers: ManStyleProfileAnswers = {
    version: 1,
    ...(typeof input.age_range === 'string' && AGE_RANGES.has(input.age_range) ? { age_range: input.age_range as ManAgeRange } : {}),
    ...(cleanText(input.city, 60) ? { city: cleanText(input.city, 60) } : {}),
    ...(Object.keys(week).length ? { week } : {}),
    ...(typeof input.dress_code === 'string' && DRESS_CODES.has(input.dress_code) ? { dress_code: input.dress_code as ManDressCode } : {}),
    ...(clampInt(input.experimentation, 1, 10) !== undefined ? { experimentation: clampInt(input.experimentation, 1, 10) } : {}),
    ...(clampInt(input.colour_boldness, 1, 10) !== undefined ? { colour_boldness: clampInt(input.colour_boldness, 1, 10) } : {}),
    ...(Object.keys(taste).length ? { taste } : {}),
    ...(tryPieces ? { try_pieces: tryPieces } : {}),
    ...(neverPieces?.length ? { never_pieces: neverPieces } : {}),
    ...(cleanText(input.style_reference, 300) ? { style_reference: cleanText(input.style_reference, 300) } : {}),
  };
  return Object.keys(answers).length > 1 ? answers : null;
}

function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map(item => item.trim()).filter(Boolean);
  } catch { /* comma list */ }
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/** How often each occasion comes up, from the dressing-context answer, for intakes without the week question. */
function weekFromDressingContext(contexts: string[]): Record<ManWeekKey, number> {
  const week: Record<ManWeekKey, number> = { office: 0, smart: 0, evening: 0, relaxed: 0 };
  const add = (key: ManWeekKey, amount: number) => { week[key] = Math.min(3, week[key] + amount); };
  for (const context of contexts) {
    if (context === 'corporate_office') { add('office', 3); add('smart', 1); }
    if (context === 'client_facing') { add('office', 3); add('smart', 1); add('evening', 1); }
    if (context === 'business_casual') { add('office', 2); add('smart', 3); }
    if (context === 'wfh') { add('smart', 2); add('relaxed', 2); }
    if (context === 'casual_social') { add('relaxed', 3); add('evening', 2); add('smart', 1); }
    if (context === 'indian_occasions') { add('evening', 1); add('relaxed', 1); }
  }
  if (WEEK_KEYS.every(key => week[key] === 0)) return { office: 2, smart: 2, evening: 2, relaxed: 2 };
  return week;
}

function dressCodeFromDressingContext(contexts: string[]): ManDressCode {
  if (contexts.includes('corporate_office')) return 'suit_tie';
  if (contexts.includes('client_facing')) return 'smart_no_tie';
  if (contexts.includes('business_casual')) return 'business_casual';
  if (contexts.length && contexts.every(context => context === 'wfh' || context === 'casual_social' || context === 'indian_occasions')) {
    return contexts.includes('wfh') ? 'no_office' : 'casual';
  }
  return 'smart_no_tie';
}

/** A 1-10 experimentation guess for intakes that predate the slider. */
function deriveExperimentation(source: ManRecommendationProfileSource, tribes: string[]): number {
  let level = 4;
  if (source.style_pole_expression === 'expressive') level += 2;
  if (source.style_pole_tone === 'current') level += 1.5;
  if (source.style_pole_structure === 'fluid') level += 0.5;
  if (source.primary_goal === 'signature_style') level += 0.5;
  if (['comfort_first', 'avoidance'].includes(source.style_relationship ?? '')) level -= 1;
  if (source.style_relationship === 'safe_rotation') level -= 0.5;
  if (tribes.some(tribe => ['dark_romantic', 'urban_wear', 'sharp_evening', 'royal_edit'].includes(tribe))) level += 0.5;
  return Math.max(2, Math.min(8, Math.round(level)));
}

function deriveColourBoldness(source: ManRecommendationProfileSource, experimentation: number): number {
  let level = experimentation;
  if (source.style_pole_expression === 'minimal') level -= 1;
  if (source.style_pole_expression === 'expressive') level += 1;
  return Math.max(2, Math.min(8, Math.round(level)));
}

export function buildManRecommendationProfile(
  source: ManRecommendationProfileSource,
  lookFeedback?: Record<string, number>,
  now = new Date(),
): ManRecommendationProfile {
  const answers = parseManStyleProfileAnswers(source.style_profile);
  const tribes = splitList(source.style_tribes);
  const contexts = splitList(source.dressing_context);
  const derivedWeek = weekFromDressingContext(contexts);
  const week = answers?.week && WEEK_KEYS.some(key => answers.week?.[key] !== undefined)
    ? Object.fromEntries(WEEK_KEYS.map(key => [key, answers.week?.[key] ?? 0])) as Record<ManWeekKey, number>
    : derivedWeek;
  const experimentation = answers?.experimentation ?? deriveExperimentation(source, tribes);
  return {
    version: 1,
    source: answers ? 'intake' : 'derived',
    tribes,
    poles: {
      ...(source.style_pole_structure ? { structure: source.style_pole_structure } : {}),
      ...(source.style_pole_expression ? { expression: source.style_pole_expression } : {}),
      ...(source.style_pole_tone ? { tone: source.style_pole_tone } : {}),
      ...(source.style_pole_register ? { register: source.style_pole_register } : {}),
    },
    ...(source.style_relationship ? { style_relationship: source.style_relationship } : {}),
    ...(source.primary_goal ? { primary_goal: source.primary_goal } : {}),
    experimentation,
    colour_boldness: answers?.colour_boldness ?? deriveColourBoldness(source, experimentation),
    week,
    dress_code: answers?.dress_code ?? dressCodeFromDressingContext(contexts),
    taste: answers?.taste ?? {},
    try_pieces: answers?.try_pieces ?? [],
    never_pieces: answers?.never_pieces ?? [],
    ...(answers?.age_range ? { age_range: answers.age_range } : {}),
    ...(answers?.city ? { city: answers.city } : {}),
    ...(answers?.style_reference ? { style_reference: answers.style_reference } : {}),
    ...(source.style_anti_pref_note ? { anti_pref_note: source.style_anti_pref_note } : {}),
    ...(source.white_test ? { white_preference: source.white_test } : {}),
    ...(lookFeedback && Object.keys(lookFeedback).length ? { look_feedback: lookFeedback } : {}),
    built_at: now.toISOString(),
  };
}

// ── What the profile decides ────────────────────────────────────────────────

/** The old fixed split, kept for reports built before the profile existed. */
export const MAN_DEFAULT_CONTEXT_SPLIT: Array<[ManOutfitContext, number]> = [
  ['Office / Formal', 6],
  ['Smart Casual', 4],
  ['Evening Wear', 5],
  ['Relaxed Casual', 5],
];

const CONTEXT_WEEK_KEY: Record<ManOutfitContext, ManWeekKey> = {
  'Office / Formal': 'office',
  'Smart Casual': 'smart',
  'Evening Wear': 'evening',
  'Relaxed Casual': 'relaxed',
};

/** Every occasion keeps enough looks for its page and combination grid. */
const CONTEXT_MINIMUM: Record<ManOutfitContext, number> = {
  'Office / Formal': 3,
  'Smart Casual': 2,
  'Evening Wear': 3,
  'Relaxed Casual': 3,
};
const CONTEXT_MAXIMUM = 8;

/**
 * How the 20 outfits split across occasions. Each occasion gets its minimum,
 * and the rest follow how often he dresses for it (largest remainder).
 */
export function computeManContextSplit(profile: ManRecommendationProfile | null | undefined, total = 20): Array<[ManOutfitContext, number]> {
  if (!profile) return MAN_DEFAULT_CONTEXT_SPLIT;
  const counts = new Map<ManOutfitContext, number>(MAN_OUTFIT_CONTEXTS.map(context => [context, CONTEXT_MINIMUM[context]]));
  let remaining = total - [...counts.values()].reduce((sum, count) => sum + count, 0);
  const weights = MAN_OUTFIT_CONTEXTS.map(context => ({ context, weight: Math.max(0, profile.week[CONTEXT_WEEK_KEY[context]] ?? 0) }));
  const weightTotal = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
  const shares = weights.map(item => ({ ...item, exact: (item.weight / weightTotal) * remaining }));
  for (const share of shares) {
    const whole = Math.min(Math.floor(share.exact), CONTEXT_MAXIMUM - (counts.get(share.context) ?? 0));
    counts.set(share.context, (counts.get(share.context) ?? 0) + whole);
    remaining -= whole;
  }
  const byRemainder = [...shares].sort((a, b) => (b.exact % 1) - (a.exact % 1) || b.weight - a.weight);
  let guard = 0;
  while (remaining > 0 && guard < 50) {
    for (const share of byRemainder) {
      if (remaining <= 0) break;
      if ((counts.get(share.context) ?? 0) >= CONTEXT_MAXIMUM) continue;
      counts.set(share.context, (counts.get(share.context) ?? 0) + 1);
      remaining -= 1;
    }
    guard += 1;
  }
  return MAN_OUTFIT_CONTEXTS.map(context => [context, counts.get(context) ?? 0]);
}

/** The boldness (1-5) a client is comfortable at, from the experimentation level. */
export function manComfortBoldness(profile: ManRecommendationProfile | null | undefined): number {
  const level = profile?.experimentation ?? 4;
  // Never below 2: a level-1 look is the plain shirt-and-trousers he already owns.
  return Math.max(2, Math.min(5, Math.round(level / 2)));
}

export interface ManLadderSlot {
  context: ManOutfitContext;
  step: ManOutfitLadderStep;
  targetBoldness: number;
}

/**
 * Most looks sit at his comfort level, about a third go one step further, and a
 * couple are clearly a stretch, so a man stuck in a safe rotation sees where he
 * could go without the whole report feeling foreign.
 */
export function buildManOutfitLadder(
  split: Array<[ManOutfitContext, number]>,
  comfort: number,
): ManLadderSlot[] {
  const slots: ManLadderSlot[] = [];
  for (const [context, count] of split) {
    const stretch = count >= 5 || (count >= 4 && context !== 'Office / Formal') ? 1 : 0;
    const stepUp = Math.round(count * 0.35);
    const order: ManOutfitLadderStep[] = [];
    let comfortLeft = count - stretch - stepUp;
    let stepLeft = stepUp;
    let stretchLeft = stretch;
    for (let index = 0; index < count; index += 1) {
      if (index % 2 === 1 && stepLeft > 0) { order.push('step-up'); stepLeft -= 1; continue; }
      if (index === 3 && stretchLeft > 0) { order.push('stretch'); stretchLeft -= 1; continue; }
      if (comfortLeft > 0) { order.push('comfort'); comfortLeft -= 1; continue; }
      if (stepLeft > 0) { order.push('step-up'); stepLeft -= 1; continue; }
      order.push('stretch'); stretchLeft -= 1;
    }
    for (const step of order) {
      const target = step === 'comfort' ? comfort : step === 'step-up' ? comfort + 1 : comfort + 2;
      slots.push({ context, step, targetBoldness: Math.min(5, target) });
    }
  }
  return slots;
}

export function manPieceMatches(pieceId: string, garmentText: string): boolean {
  return MAN_STYLE_PIECES.find(piece => piece.id === pieceId)?.pattern.test(garmentText) ?? false;
}

export function describeManRecommendationProfile(profile: ManRecommendationProfile | null | undefined): string {
  if (!profile) return 'Not available';
  const lines = [
    `Experimentation: ${profile.experimentation}/10 (${manScaleStop(MAN_EXPERIMENTATION_STOPS, profile.experimentation).label})${profile.source === 'derived' ? ' — estimated from his style answers' : ''}`,
    `Colour boldness: ${profile.colour_boldness}/10 (${manScaleStop(MAN_COLOUR_STOPS, profile.colour_boldness).label})`,
    `Week: ${MAN_WEEK_ROWS.map(row => `${row.label} ${MAN_WEEK_LEVELS[profile.week[row.key] ?? 0].toLowerCase()}`).join(', ')}`,
    `Workplace dress code: ${MAN_DRESS_CODES.find(code => code.value === profile.dress_code)?.label ?? profile.dress_code}`,
    profile.age_range ? `Age: ${MAN_AGE_RANGES.find(range => range.value === profile.age_range)?.label}` : null,
    profile.city ? `City: ${profile.city}` : null,
    profile.try_pieces.length ? `Wants to try: ${profile.try_pieces.map(id => MAN_STYLE_PIECES.find(piece => piece.id === id)?.label ?? id).join(', ')}` : null,
    profile.never_pieces.length ? `Never: ${profile.never_pieces.map(id => MAN_STYLE_PIECES.find(piece => piece.id === id)?.label ?? id).join(', ')}` : null,
    Object.keys(profile.taste).length
      ? `Taste test: ${MAN_TASTE_LOOKS.filter(look => profile.taste[String(look.id)]).map(look => `${look.title} = ${profile.taste[String(look.id)]}`).join('; ')}`
      : null,
    profile.style_reference ? `Style reference: ${profile.style_reference}` : null,
    profile.anti_pref_note ? `Dislikes wearing: ${profile.anti_pref_note}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}
