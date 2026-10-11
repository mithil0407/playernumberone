// The head stylist's brief: given everything we know about one man and a
// shortlist of real library looks per occasion, choose his portfolio the way a
// senior stylist would. Pure, so the exact wording and the checks on the answer
// can be tested; the model call lives in manHeadStylist.ts.
//
// Rules decide what he can wear (the shortlist). The stylist decides what is
// good on him: what he loved, what he rejected, the people he dresses like,
// whether a look reads as a stylist's pick or as filler.

import type { ClassificationResult } from './manReportGenerator';
import {
  MAN_MAX_BLACK_LED,
  getManOutfitPrimaryColourFamily,
  isManBlackLed,
  manLookPieceText,
  type ManOutfitLibraryContext,
  type ManOutfitLibraryEntry,
  type ManPortfolioCandidate,
  type ManPortfolioSlot,
} from './manOutfitLibrary';
import { MAN_TASTE_LOOKS, describeManRecommendationProfile } from './manRecommendationProfile';
import { manPortfolioLookShape, type ManPortfolioLook } from './manReportQa';

const ROLE_BRIEF = {
  anchor: 'SAFE CLASSIC: a look he could wear tomorrow, but it must still be good: clean, well-proportioned, never filler',
  signature: 'SIGNATURE: the colours or textures that suit him best; the look people compliment him in',
  stretch: 'STRETCH: a considered step past his usual, still clearly him',
} as const;

function names(list: Array<{ name: string }> | undefined) {
  return (list ?? []).map(item => item.name).join(', ') || 'none given';
}

function tasteLines(classification: ClassificationResult) {
  const taste = classification.recommendation_profile?.taste ?? {};
  const verdict = { love: 'LOVED', try: 'would try', never: 'REJECTED' } as const;
  return MAN_TASTE_LOOKS
    .filter(look => taste[String(look.id)])
    .map(look => `- ${verdict[taste[String(look.id)]]}: ${look.title} (${look.pieces.join(', ')})`)
    .join('\n');
}

export function buildManHeadStylistPrompt(input: {
  classification: ClassificationResult;
  slots: ManPortfolioSlot[];
  candidates: Map<ManOutfitLibraryContext, ManPortfolioCandidate[]>;
  climateLabel: string;
  maxPerLeadFamily: number;
}) {
  const { classification, slots, candidates } = input;
  const { colour, body, style_brief: style, client } = classification;
  const profile = classification.recommendation_profile;
  const roleCounts = (['anchor', 'signature', 'stretch'] as const)
    .map(role => `${slots.filter(slot => slot.role === role).length} ${role}`).join(', ');
  const slotLines = slots.map((slot, index) => `Slot ${index + 1} — ${slot.context} — ${ROLE_BRIEF[slot.role]}`).join('\n');
  const candidateBlocks = [...candidates.entries()].map(([context, list]) => `### ${context.toUpperCase()} (choose only from these for ${context} slots)
${list.map(({ entry }) => lookLine(entry)).join('\n')}`).join('\n\n');

  return `You are ICONIK's head menswear stylist. You are choosing the ${slots.length} outfits for one client's Style Blueprint from a shortlist of real looks. Every look you choose will be photographed on him and he will judge us by them. A man should open this and think "this is exactly me, only better".

## THE CLIENT
Age: ${profile?.age_range?.replace('_', '–') ?? 'not given'}. Lives in: ${profile?.city ?? client.location_region}. Climate now: ${input.climateLabel}.
Goal: ${client.primary_goal}. What holds him back: ${style.style_blocker}. What he wants: ${style.key_aspiration}.
Body: ${body.silhouette_type}. Carries weight: ${body.fat_storage_zone}. Minimise: ${body.minimise_zone}. Fit: ${body.fit_directive}. Avoid: ${body.avoid_cuts.join('; ')}.
Colouring: ${colour.season}, ${colour.undertone} undertone, ${colour.skin_tone_depth} skin. Palette: ${names(colour.primary_palette)}. Neutrals: ${names(colour.neutral_base_colours)}. Accents: ${names(colour.accent_colours)}. Avoid near the face: ${names(colour.colours_to_avoid)}.
Style: ${style.tribes.join(', ')}. ${style.aesthetic_direction} Expression: ${style.expression}. Register: ${style.register}. Structure: ${style.structure_level}. Dislikes: ${style.anti_preferences || 'none given'}.
${describeManRecommendationProfile(profile)}

What he said about the 12 test looks:
${tasteLines(classification) || '- He did not take the taste test.'}

## HOW TO CHOOSE
1. Every look must be genuinely good: something you would be proud to send. Pass over filler (a plain tee and jeans with nothing considered about it) and vaguely described looks ("dark shirt", "dark trousers") unless nothing better fits the slot.
2. Follow the slot roles exactly (${roleCounts}). Roughly one look in five is the safe classic. The rest should make him look better than he dresses today.
3. "Minimal" means calm and coherent, NOT plain or colourless. A minimal man still wears colour; he just doesn't want three competing colours or a costume. Keep minimal looks to at most two colours plus neutrals.
4. His palette tells you which shades suit him; it does not fence him in. Blues, greys, greens, burgundy and black can all work if the depth and brightness suit his skin. No colour may lead near his face in more than ${input.maxPerLeadFamily} looks, no more than ${MAN_MAX_BLACK_LED} looks may have black at the neckline, and don't let the portfolio turn into one season's clichés (rust, olive, mustard, maroon again and again).
5. Lean on what he LOVED and his style reference. Stay well away from anything resembling what he REJECTED, even if it scores well on paper.
6. Dress his body: ${bodyNote(classification)}
7. Range, the way a stylist checks a rail before it goes out. Each look's [shape] and [top] colour are given; these limits are checked and anything over them is sent back:
   - no shape more than twice within one occasion, or more than three times across the Blueprint (four office shirts with trousers is a uniform, not a wardrobe: use a knit, a blazer, an overshirt, a polo);
   - no two looks next to each other (in slot order) with the same [top] colour, or the same layer colour;
   - no colour group (blues, browns, greys, whites, greens, reds…) leading near his face in more than a fifth of the looks;
   - evening needs at least one statement jacket (leather, suede, bomber) and at most three looks with no layer;
   - relaxed has at most three plain-tee looks.

## THE SLOTS
${slotLines}

## THE SHORTLIST
${candidateBlocks}

## ANSWER
Return ONLY JSON, no markdown: {"outfits":[{"slot":1,"id":215,"why":"one plain sentence on why this is right for him"}, …]} with exactly one entry per slot, every id from that slot's occasion list, and no id used twice.`;
}

function lookLine(entry: ManOutfitLibraryEntry) {
  const top = getManOutfitPrimaryColourFamily(entry.top)?.replace(/^patterned-/, 'patterned ') ?? 'unnamed';
  return `#${entry.id}: ${manLookPieceText(entry).replace(/\s*\|\s*/g, ' | ')}${entry.styling ? ` (${entry.styling})` : ''} [shape ${manPortfolioLookShape(entry)}] [top ${top}] [boldness ${entry.boldness}/5]`;
}

/** The chosen looks in the shape the variety check reads. */
export function manPortfolioLooks(choices: ManHeadStylistChoice[], slots: ManPortfolioSlot[], entries: Map<number, ManOutfitLibraryEntry>): ManPortfolioLook[] {
  return [...choices].sort((a, b) => a.slot - b.slot).flatMap(choice => {
    const entry = entries.get(choice.id);
    return entry ? [{ number: choice.slot, context: slots[choice.slot - 1].context, top: entry.top, layer: entry.layer, bottom: entry.bottom, footwear: entry.footwear }] : [];
  });
}

/**
 * Reorders the looks inside each occasion so neighbours differ in top and layer
 * colour, the way a stylist would hang them. Roles and reasons move with their
 * look. A complete answer only; partial answers keep their order.
 */
export function orderManPortfolioChoices(choices: ManHeadStylistChoice[], slots: ManPortfolioSlot[], entries: Map<number, ManOutfitLibraryEntry>): ManHeadStylistChoice[] {
  if (choices.length !== slots.length) return choices;
  const bySlot = new Map(choices.map(choice => [choice.slot, choice]));
  const top = (choice?: ManHeadStylistChoice) => choice ? getManOutfitPrimaryColourFamily(entries.get(choice.id)?.top ?? '') : null;
  const layer = (choice?: ManHeadStylistChoice) => {
    const text = choice ? entries.get(choice.id)?.layer ?? '' : '';
    return /^(none|no layer)\b/i.test(text.trim()) ? null : getManOutfitPrimaryColourFamily(text);
  };
  const clash = (a?: ManHeadStylistChoice, b?: ManHeadStylistChoice) => Boolean(a && b)
    && ((top(a) !== null && top(a) === top(b)) || (layer(a) !== null && layer(a) === layer(b)));
  const ordered: ManHeadStylistChoice[] = [];
  let start = 0;
  while (start < slots.length) {
    const context = slots[start].context;
    let end = start;
    while (end < slots.length && slots[end].context === context) end += 1;
    const group = slots.slice(start, end).map((_, offset) => bySlot.get(start + offset + 1)!);
    const before = ordered.at(-1);
    // Small occasions (at most 8 looks): try orders until one has no clashing neighbours.
    let best = group;
    let bestClashes = Infinity;
    let tries = 0;
    const permute = (rest: ManHeadStylistChoice[], path: ManHeadStylistChoice[], clashes: number) => {
      if (clashes >= bestClashes || tries > 20000) return;
      if (!rest.length) { best = path; bestClashes = clashes; return; }
      for (let index = 0; index < rest.length; index += 1) {
        tries += 1;
        const next = rest[index];
        permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...path, next], clashes + (clash(path.at(-1) ?? before, next) ? 1 : 0));
      }
    };
    permute(group, [], 0);
    best.forEach((choice, offset) => ordered.push({ ...choice, slot: start + offset + 1, role: choice.role ?? slots[choice.slot - 1].role }));
    start = end;
  }
  return ordered;
}

export function buildManHeadStylistRepairPrompt(prompt: string, previous: ManHeadStylistChoice[], problems: string[]) {
  return `${prompt}

## YOUR FIRST ANSWER BROKE THESE RULES
${problems.map(problem => `- ${problem}`).join('\n')}

Your first answer was: ${JSON.stringify({ outfits: previous.map(({ slot, id, why }) => ({ slot, id, why })) })}

Fix every problem by swapping as few looks as you need (use other shortlist looks for that occasion), keep the good choices, and return the full corrected answer in the same JSON format.`;
}

function bodyNote(classification: ClassificationResult) {
  const body = `${classification.body.silhouette_type} ${classification.body.fat_storage_zone} ${classification.body.minimise_zone}`.toLowerCase();
  if (/triangle|pear|hips?|thighs?/.test(body) && !/inverted triangle/.test(body)) {
    return 'he carries weight on his hips and thighs, so draw the eye up: dark, plain bottoms with room through the thigh, interest and structure on top (jackets, overshirts, collars), no shorts, no light or coloured trousers.';
  }
  if (/oval|round|belly|midsection|abdomen/.test(body)) {
    return 'he carries weight on his middle, so prefer open layers and long vertical lines; avoid clingy knits, tucked-in shirts with nothing over them, and horizontal stripes.';
  }
  return 'keep the fit his fit directive asks for, and favour looks that suit his frame.';
}

export interface ManHeadStylistChoice {
  slot: number;
  id: number;
  why: string;
  /** The role the look was chosen for; it stays with the look if the occasion is reordered. */
  role?: ManPortfolioSlot['role'];
}

/**
 * Reads the stylist's answer and keeps only choices that obey the rules: a real
 * shortlist look for that slot's occasion, used once, and no colour leading
 * more than the cap. Anything dropped is filled by the rule-based picker.
 */
export function parseManHeadStylistChoices(
  raw: string,
  slots: ManPortfolioSlot[],
  candidates: Map<ManOutfitLibraryContext, ManPortfolioCandidate[]>,
  maxPerLeadFamily: number,
): { choices: ManHeadStylistChoice[]; dropped: string[] } {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as { outfits?: unknown };
  const outfits = Array.isArray(parsed.outfits) ? parsed.outfits : [];
  const choices: ManHeadStylistChoice[] = [];
  const dropped: string[] = [];
  const used = new Set<number>();
  const leads = new Map<string, number>();
  let blackLed = 0;
  for (const item of outfits) {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const slot = Number(record.slot);
    const id = Number(record.id);
    const why = typeof record.why === 'string' ? record.why.trim().slice(0, 240) : '';
    const target = slots[slot - 1];
    if (!target) { dropped.push(`slot ${record.slot}: no such slot`); continue; }
    if (choices.some(choice => choice.slot === slot)) { dropped.push(`slot ${slot}: chosen twice`); continue; }
    const candidate = candidates.get(target.context)?.find(option => option.entry.id === id);
    if (!candidate) { dropped.push(`slot ${slot}: #${record.id} is not on the ${target.context} shortlist`); continue; }
    if (used.has(id)) { dropped.push(`slot ${slot}: #${id} already used`); continue; }
    const family = candidate.leadFamily;
    if (family && (leads.get(family) ?? 0) >= maxPerLeadFamily) { dropped.push(`slot ${slot}: #${id} would be ${family} near the face too often`); continue; }
    const black = isManBlackLed(candidate.entry);
    if (black && blackLed >= MAN_MAX_BLACK_LED) { dropped.push(`slot ${slot}: #${id} would be one black-led look too many`); continue; }
    if (black) blackLed += 1;
    used.add(id);
    if (family) leads.set(family, (leads.get(family) ?? 0) + 1);
    choices.push({ slot, id, why, role: target.role });
  }
  return { choices, dropped };
}
