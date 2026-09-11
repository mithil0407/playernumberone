/**
 * Reading a client's stated piece preferences out of intake.
 *
 * Intake writes this blob in two different shapes and the generator has to
 * understand both. Kept separate from stylistBlueprintGenerator so the parsing
 * can be unit tested against real intake payloads.
 */
import { PIECE_PREFERENCE_LABELS } from './stylistIntakePreferenceLabels.ts';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function piecePreferenceLabel(value: string) {
  return PIECE_PREFERENCE_LABELS[value] ?? value.replace(/_/g, ' ');
}

// Intake writes piece preferences in two different shapes. The self-serve web
// form nests them per category: {tops: {liked, disliked, skipped}}. A
// stylist-run consultation (stylistConsultationWorkspace) writes a flat record
// instead: {loved: [...], avoided: [...], footwear: [...], outfit_ratio: "..."}.
// The summariser only understood the nested shape, so every consultation intake
// reported "liked=none; disliked=none" for every field and the client's stated
// preferences never reached the outfit prompts at all.
const FLAT_PREFERENCE_LIKE_KEYS = ['loved', 'liked', 'favourites', 'favorites', 'wants'];
const FLAT_PREFERENCE_DISLIKE_KEYS = ['avoided', 'disliked', 'least_favourites', 'least_favorites', 'avoid'];

export function summarisePiecePreferences(preferences: unknown) {
  const record = asRecord(preferences);
  const groups = Object.entries(record);
  if (!groups.length) return 'No raw piece preference sorting was provided.';

  const lines: string[] = [];
  for (const [category, rawGroup] of groups) {
    // Nested shape: {liked, disliked, skipped}.
    const group = asRecord(rawGroup);
    if (group.liked !== undefined || group.disliked !== undefined || group.skipped !== undefined) {
      const liked = asStringArray(group.liked).map(piecePreferenceLabel);
      const disliked = asStringArray(group.disliked).map(piecePreferenceLabel);
      const skipped = asStringArray(group.skipped).map(piecePreferenceLabel);
      lines.push(`${category}: liked=${liked.length ? liked.join(', ') : 'none'}; disliked=${disliked.length ? disliked.join(', ') : 'none'}; skipped=${skipped.length ? skipped.join(', ') : 'none'}`);
      continue;
    }

    // Flat shape: the key names the intent and the value is the content.
    const values = Array.isArray(rawGroup)
      ? asStringArray(rawGroup)
      : typeof rawGroup === 'string' && rawGroup.trim()
        ? [rawGroup.trim()]
        : [];
    if (!values.length) continue;
    const label = category.replace(/_/g, ' ');
    if (FLAT_PREFERENCE_LIKE_KEYS.includes(category)) {
      lines.push(`${label} (wants more of): ${values.join(', ')}`);
    } else if (FLAT_PREFERENCE_DISLIKE_KEYS.includes(category)) {
      lines.push(`${label} (do not recommend): ${values.join(', ')}`);
    } else {
      lines.push(`${label}: ${values.join(', ')}`);
    }
  }
  return lines.length ? lines.join('\n') : 'No raw piece preference sorting was provided.';
}

/**
 * Hard constraints the client stated directly. These used to be buried in a
 * preference blob the summariser silently dropped, so outfits contradicted them
 * — a client asking for a 1.2-2 inch heel received thirteen flat loafers.
 */
export function statedIntakeConstraints(submission: { piece_preferences?: Record<string, unknown> | null }) {
  const prefs = asRecord(submission.piece_preferences);
  const list = (value: unknown) => (Array.isArray(value) ? asStringArray(value) : typeof value === 'string' && value.trim() ? [value.trim()] : []);
  const avoided = [...list(prefs.avoided), ...list(prefs.least_favourites), ...list(prefs.disliked)]
    .filter((item, index, arr) => arr.indexOf(item) === index);
  const rules = [
    list(prefs.footwear).length ? `Footwear: she asked for ${list(prefs.footwear).join(', ')}. Match this on every outfit unless the occasion makes it impossible, and state the heel height.` : '',
    avoided.length ? `Never recommend, in any capsule: ${avoided.join(', ')}. This includes close variants of the same shape.` : '',
    list(prefs.metal_preference).length ? `Jewellery metal: ${list(prefs.metal_preference).join(', ')} only.` : '',
    list(prefs.colour_family).length ? `Colour families she asked for: ${list(prefs.colour_family).join(', ')}.` : '',
    list(prefs.loved).length ? `She explicitly asked for more of: ${list(prefs.loved).join(', ')}. These must appear across the set, not as a token single outfit.` : '',
    list(prefs.outfit_ratio).length ? `Western/ethnic mix: "${list(prefs.outfit_ratio).join(', ')}". Honour this as a proportion across the twenty outfits, not as a permission.` : '',
  ].filter(Boolean);
  return rules.length ? rules.join('\n- ') : '';
}


/**
 * Whether the client told us light neutrals drain her. The intake asks what
 * white clothing does to her face; "makes me dull" is a stated fact about her
 * colouring, not a taste, so it outranks whatever colour a library look happens
 * to name near her face.
 */
export function dullsInWhite(submission: { skin_tone_self_description?: string | null }) {
  return /white\s+clothing\s+effect\s*:?\s*(makes me dull|dull|washes)/i
    .test(submission.skin_tone_self_description ?? '');
}


// --- Ethnic / Western mix ---------------------------------------------------
// `outfit_ratio` is free text typed by a stylist during consultation, so this
// parses intent rather than matching a fixed option list. It used to be written
// at intake and never read again: a client who asked for "More Ethnic" and said
// she loved sarees received twenty Western outfits and zero sarees.

/** Capsule order is the priority order for placing ethnic looks. */
export const ETHNIC_CAPSULE_PRIORITY = ['Occasion', 'Social', 'Everyday', 'Professional'] as const;

/**
 * How many of each capsule's five outfits may be ethnic. Occasion and Social
 * carry ethnic naturally; Professional is capped low because ethnic workwear is
 * real but narrow, and a corporate client still needs Western options. Total
 * capacity is 14 of 20, so no ratio can push the whole report into Indianwear.
 */
export const ETHNIC_CAPSULE_CAPS: Record<string, number> = {
  Occasion: 5,
  Social: 4,
  Everyday: 3,
  Professional: 2,
};

/**
 * Share of the outfit set that should be ethnic or indo-western, from the
 * client's stated ratio. Returns null when nothing was stated.
 */
export function parseEthnicShare(rawRatio: unknown): number | null {
  const text = typeof rawRatio === 'string' ? rawRatio.trim().toLowerCase() : '';
  if (!text) return null;

  const mentionsEthnic = /ethnic|indian|traditional|desi|saree|sari|kurta|lehenga/.test(text);
  const mentionsWestern = /western|contemporary|modern/.test(text);

  // "70/30", "70:30", "70-30" — the first number belongs to whichever side the
  // text names first.
  const split = text.match(/(\d{1,3})\s*[/:–-]\s*(\d{1,3})/);
  if (split) {
    const first = Number(split[1]);
    const second = Number(split[2]);
    if (first + second > 0) {
      const ethnicFirst = !mentionsWestern || text.indexOf('ethnic') < text.indexOf('western');
      return clampShare((ethnicFirst ? first : second) / (first + second));
    }
  }

  // "60% ethnic", "60 percent western"
  const percent = text.match(/(\d{1,3})\s*(?:%|percent)/);
  if (percent) {
    const value = Number(percent[1]) / 100;
    if (mentionsWestern && !mentionsEthnic) return clampShare(1 - value);
    return clampShare(value);
  }

  if (/\b(no|not?|zero|never)\b.*\bethnic\b/.test(text) || /only\s+western|all\s+western|western\s+only/.test(text)) return 0;
  // Never 1.0: work outfits still need Western options even for an "all ethnic"
  // client, and a report with no Western look at all is not a wardrobe system.
  if (/only\s+ethnic|all\s+ethnic|ethnic\s+only|fully\s+(ethnic|indian)/.test(text)) return 0.85;
  if (/\b(more|mostly|mainly|majority|heavy|heavily|primarily)\b/.test(text) && mentionsEthnic) return 0.6;
  if (/\b(more|mostly|mainly|majority|heavy|heavily|primarily)\b/.test(text) && mentionsWestern) return 0.25;
  if (/\b(equal|balanced?|50\s*[-/]?\s*50|half|even|mix)\b/.test(text)) return 0.5;
  if (/\b(less|fewer|minimal|occasional|some|few)\b/.test(text) && mentionsEthnic) return 0.2;
  if (mentionsEthnic) return 0.5;
  if (mentionsWestern) return 0.25;
  return null;
}

function clampShare(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.85, Math.max(0, value));
}

/**
 * How many of `outfitCount` outfits should be ethnic.
 *
 * `culturalMode` is a hard gate and wins over any stated ratio: a client whose
 * intake gives no ethnic signal never receives Indianwear, whatever this field
 * says. When ethnic is allowed but no ratio was given, a floor applies so a
 * client who told us she loves sarees gets more than a token single look.
 */
export function ethnicOutfitTarget(input: {
  outfitCount: number;
  culturalMode: 'western_default' | 'ethnic_allowed';
  piecePreferences?: Record<string, unknown> | null;
}): number {
  if (input.culturalMode === 'western_default') return 0;
  const prefs = input.piecePreferences && typeof input.piecePreferences === 'object' ? input.piecePreferences : {};
  const stated = parseEthnicShare((prefs as Record<string, unknown>).outfit_ratio);
  const share = stated ?? 0.25;
  const capacity = Object.values(ETHNIC_CAPSULE_CAPS).reduce((total, cap) => total + cap, 0)
    * (input.outfitCount / (Object.keys(ETHNIC_CAPSULE_CAPS).length * 5));
  return Math.max(0, Math.min(Math.round(input.outfitCount * share), Math.floor(capacity)));
}

/**
 * Splits the ethnic target across capsules, filling the priority order one at a
 * time so ethnic looks spread across contexts instead of saturating Occasion.
 */
export function ethnicCountsByCapsule(target: number, perCapsule: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const capsule of ETHNIC_CAPSULE_PRIORITY) counts[capsule] = 0;
  let remaining = Math.max(0, target);
  let progressed = true;
  while (remaining > 0 && progressed) {
    progressed = false;
    for (const capsule of ETHNIC_CAPSULE_PRIORITY) {
      if (remaining <= 0) break;
      const cap = Math.min(ETHNIC_CAPSULE_CAPS[capsule] ?? 0, perCapsule);
      if (counts[capsule] >= cap) continue;
      counts[capsule] += 1;
      remaining -= 1;
      progressed = true;
    }
  }
  return counts;
}

/**
 * Which slots inside one capsule are ethnic. Spread by stride rather than taken
 * from the front, so a capsule does not read as a block of ethnic looks
 * followed by a block of Western ones.
 */
export function ethnicSlotsForCapsule(count: number, perCapsule: number): Set<number> {
  const slots = new Set<number>();
  if (count <= 0 || perCapsule <= 0) return slots;
  if (count >= perCapsule) {
    for (let index = 0; index < perCapsule; index += 1) slots.add(index);
    return slots;
  }
  const stride = perCapsule / count;
  for (let step = 0; step < count; step += 1) {
    slots.add(Math.min(perCapsule - 1, Math.round(step * stride)));
  }
  return slots;
}

// --- Footwear ---------------------------------------------------------------

export interface FootwearPreference {
  /** She asked for a heel, so flats and loafers are not an acceptable default. */
  heelPreferred: boolean;
  /** Her own words, e.g. "1.2-2 inch heel", for use in the garment description. */
  statedHeel: string;
  /** True when she named sneakers herself. */
  sneakersWelcome: boolean;
}

/**
 * Footwear was chosen from capsule and colour alone, defaulting to loafers, so a
 * client who asked for a 1.2-2 inch heel received thirteen flat pairs out of
 * twenty. This reads what she actually asked for.
 */
export function parseFootwearPreference(piecePreferences?: Record<string, unknown> | null): FootwearPreference {
  const prefs = piecePreferences && typeof piecePreferences === 'object' ? piecePreferences as Record<string, unknown> : {};
  const values = [
    ...(Array.isArray(prefs.footwear) ? prefs.footwear : [prefs.footwear]),
    ...(Array.isArray(prefs.loved) ? prefs.loved : []),
  ].filter((item): item is string => typeof item === 'string');
  const text = values.join(' ').toLowerCase();
  const heelMatch = values.find(value => /heel|pump|block|wedge/i.test(value)) ?? '';
  return {
    heelPreferred: /heel|pump|wedge/.test(text) && !/no heel|flat only|without heel|avoid heel/.test(text),
    statedHeel: heelMatch.trim(),
    sneakersWelcome: /sneaker|trainer|keds|canvas shoe/.test(text),
  };
}

// --- Pieces she asked us never to recommend ---------------------------------

/**
 * Terms that describe the same garment a client is rejecting. Banning only her
 * literal wording lets the near-identical shape straight back in — she rejected
 * "loose plazzos" and the report returned five wide-leg trouser outfits.
 */
const AVOID_TERM_SYNONYMS: Array<{ match: RegExp; terms: string[] }> = [
  { match: /palazz?o|plazz?o/, terms: ['palazzo', 'plazzo', 'wide-leg', 'wide leg', 'wide-legged', 'wide legged'] },
  { match: /\bskinny\b/, terms: ['skinny', 'spray-on'] },
  { match: /\bcrop(ped)? top\b/, terms: ['crop top', 'cropped top', 'midriff'] },
  { match: /bodycon|body-con/, terms: ['bodycon', 'body-con', 'second-skin'] },
  { match: /\bruffle/, terms: ['ruffle', 'frill', 'tiered flounce'] },
  { match: /\bpeplum\b/, terms: ['peplum'] },
  { match: /\bmini\b/, terms: ['mini skirt', 'mini dress', 'above-knee hem'] },
  { match: /\bsleeveless\b/, terms: ['sleeveless top', 'shell without sleeves'] },
];

/** Every garment term to keep out of this client's outfits, expanded from her own words. */
export function bannedPieceTerms(piecePreferences?: Record<string, unknown> | null): string[] {
  const prefs = piecePreferences && typeof piecePreferences === 'object' ? piecePreferences as Record<string, unknown> : {};
  const stated = [prefs.avoided, prefs.least_favourites, prefs.disliked]
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => item.trim());

  const expanded = new Set<string>();
  for (const term of stated) {
    expanded.add(term);
    const lower = term.toLowerCase();
    for (const entry of AVOID_TERM_SYNONYMS) {
      if (entry.match.test(lower)) for (const synonym of entry.terms) expanded.add(synonym);
    }
  }
  return [...expanded];
}

/** True when a garment description uses something the client ruled out. */
export function violatesBannedPieces(text: string, bannedTerms: string[]): string[] {
  const lower = text.toLowerCase();
  return bannedTerms.filter(term => lower.includes(term.toLowerCase()));
}


// --- Does this client's intake signal any interest in ethnic wear? ----------
// Lives here rather than in the generator so both outfit engines can use it
// (the generator imports the science engine, so the dependency cannot run the
// other way).

export interface EthnicSignalSource {
  selected_moodboard_label?: string | null;
  selected_moodboard_id?: string | null;
  one_outfit_description?: string | null;
  raw_consultation_notes?: string | null;
  skin_tone_self_description?: string | null;
  focus_areas?: string[] | null;
  secondary_moodboard_elements?: string[] | null;
  piece_preferences?: Record<string, unknown> | null;
  lifestyle_context?: Record<string, unknown> | null;
  coverage_requirements?: Record<string, unknown> | null;
}

const ETHNIC_PREFERENCE_PATTERN = /\b(indian|ethnic(?:wear)?|kurt[ai]|kurta|kurti|saree|sari|lehenga|anarkali|salwar|churidar|sharara|gharara|dupatta|indo[- ]?western|festive|festival|wedding|shaadi|sangeet|mehendi|mehndi|haldi|diwali|traditional|desi|jutti|juttis|kolhapuri|banarasi|chikankari|bandhani|silk sari)\b/i;

// Only surface Indian/ethnic outfits when the client's own intake signals interest in them —
// being an India-market or admin-created intake is NOT sufficient on its own.
export function intakeSignalsEthnicPreference(submission: EthnicSignalSource): boolean {
  const parts = [
    submission.selected_moodboard_label ?? '',
    submission.selected_moodboard_id ?? '',
    submission.one_outfit_description ?? '',
    submission.raw_consultation_notes ?? '',
    submission.skin_tone_self_description ?? '',
    ...(submission.focus_areas ?? []),
    ...(submission.secondary_moodboard_elements ?? []),
    JSON.stringify(submission.piece_preferences ?? {}),
    JSON.stringify(submission.lifestyle_context ?? {}),
    JSON.stringify(submission.coverage_requirements ?? {}),
  ];
  return ETHNIC_PREFERENCE_PATTERN.test(parts.join(' \n '));
}


// --- Garments the client named by name --------------------------------------

const ETHNIC_GARMENT_WORDS = [
  'saree', 'sari', 'lehenga', 'anarkali', 'salwar', 'churidar',
  'sharara', 'gharara', 'kurta', 'kurti', 'dupatta', 'indo-western',
];

/**
 * Ethnic garments the client asked for by name. Blind scoring cannot know that
 * "I love sarees" should outrank a better-scoring kurta, so a client who named
 * sarees was given kurtas simply because the library holds more of them.
 */
export function preferredEthnicGarments(piecePreferences?: Record<string, unknown> | null): string[] {
  const prefs = piecePreferences && typeof piecePreferences === 'object' ? piecePreferences as Record<string, unknown> : {};
  const text = [prefs.loved, prefs.liked, prefs.favourites, prefs.outfit_ratio]
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .filter((item): item is string => typeof item === 'string')
    .join(' ')
    .toLowerCase();
  return ETHNIC_GARMENT_WORDS.filter(word => text.includes(word));
}

/** True when a garment description matches one of the named garments. */
export function matchesPreferredGarment(text: string, preferred: string[]): boolean {
  if (!preferred.length) return false;
  const lower = text.toLowerCase();
  return preferred.some(word => lower.includes(word));
}
