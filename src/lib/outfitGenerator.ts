import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import type {
  BudgetLevel,
  CatalogCandidate,
  FashionItem,
  FashionItemStyleTags,
  MatchDiagnostics,
  OutfitOccasion,
  PreferenceProfile,
} from './supabase';

const WOMEN_OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/womenOutfitRecommendationSkill.md'),
  'utf-8'
);

export const WOMEN_OUTFIT_ENGINE_VERSION = 'women-skill-v1';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

type RestrictionKey = 'no_sleeveless' | 'cover_tummy';
type SlotKey = 'singlePiece' | 'top' | 'layer' | 'bottom' | 'shoes' | 'bag' | 'accessory';
const OCCASIONS: OutfitOccasion[] = ['casual', 'work', 'evening', 'weekend', 'formal', 'party'];
const SLOT_ORDER: SlotKey[] = ['singlePiece', 'top', 'layer', 'bottom', 'shoes', 'bag', 'accessory'];

const CATEGORY_BY_SLOT: Record<SlotKey, FashionItem['category'][]> = {
  singlePiece: ['dress', 'jumpsuit'],
  top: ['top'],
  layer: ['outerwear'],
  bottom: ['bottom', 'skirt'],
  shoes: ['shoes'],
  bag: ['bag'],
  accessory: ['accessory'],
};

const RESTRICTION_RULES: Record<RestrictionKey, string> = {
  no_sleeveless:
    'NO SLEEVELESS — Never include tops, dresses, jumpsuits, or any upper-body piece without sleeves. Every upper-body item must have sleeves (short sleeves are acceptable as a minimum).',
  cover_tummy:
    'COVER TUMMY — Never include crop tops, short tops, or silhouettes that expose or strongly emphasise the stomach. Prefer A-line, wrap, draped, structured, or flowy coverage through the midsection.',
};

const BUDGET_MAX_PRICE: Record<BudgetLevel, number> = {
  low: 3500,
  mid: 8500,
  high: Number.POSITIVE_INFINITY,
};

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export interface OutfitBlueprint {
  occasion: OutfitOccasion;
  title: string;
  singlePiece: string | null;
  top: string | null;
  layer: string | null;
  bottom: string | null;
  shoes: string;
  bag: string | null;
  accessory: string | null;
  disruptor: string;
  colourHierarchy: string;
  structurePiece: string;
  signatureCodesUsed: string[];
}

export interface OutfitRecommendation {
  itemIds: string[];
  occasion: OutfitOccasion;
  styleNote: string;
  blueprint?: OutfitBlueprint;
  diagnostics?: MatchDiagnostics;
  validationErrors?: string[];
}

export interface OutfitGenerationResult {
  recommendations: OutfitRecommendation[];
  preferenceProfile: PreferenceProfile;
  generationVersion: string;
  preferenceProfileSource: 'stored' | 'generated';
}

interface CandidateItem {
  item: FashionItem;
  summary: CatalogCandidate;
}

interface MatchOutput {
  occasion: OutfitOccasion;
  styleNote: string;
  itemIds: string[];
  slotSelections: Record<SlotKey, string | null>;
}

function cleanJson(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelayMs = 2_000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const isTransient =
        msg.includes('503') || msg.includes('unavailable') || msg.includes('429') ||
        msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted');
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

async function callGeminiJSON<T>(prompt: string, maxOutputTokens = 32768): Promise<T> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.2, topP: 0.8, maxOutputTokens },
    });
    const text = cleanJson(response.text ?? '');
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) throw new Error(`No JSON returned: ${text.slice(0, 300)}`);
    return JSON.parse(match[0]) as T;
  });
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => typeof entry === 'string' ? entry.trim() : '')
    .filter(Boolean);
}

function isPreferenceProfile(value: unknown): value is PreferenceProfile {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Partial<PreferenceProfile>;
  return typeof maybe.profileVersion === 'string'
    && !!maybe.colour
    && !!maybe.silhouette
    && !!maybe.styling
    && !!maybe.occasionDirectives;
}

function normalizePreferenceProfile(raw: PreferenceProfile): PreferenceProfile {
  const occasionDirectives = Object.fromEntries(
    OCCASIONS.map(occasion => [occasion, raw.occasionDirectives?.[occasion] ?? ''])
  ) as PreferenceProfile['occasionDirectives'];

  return {
    profileVersion: raw.profileVersion || WOMEN_OUTFIT_ENGINE_VERSION,
    tasteSummary: raw.tasteSummary || '',
    colour: {
      temperature: raw.colour?.temperature ?? 'neutral',
      depth: raw.colour?.depth ?? 'medium',
      saturation: raw.colour?.saturation ?? 'balanced',
      undertone: raw.colour?.undertone ?? 'neutral',
      preferredColours: sanitizeStringArray(raw.colour?.preferredColours),
      avoidedColours: sanitizeStringArray(raw.colour?.avoidedColours),
      anchorNeutrals: sanitizeStringArray(raw.colour?.anchorNeutrals),
    },
    silhouette: {
      family: raw.silhouette?.family ?? 'rectangle',
      structurePreference: raw.silhouette?.structurePreference ?? 'balanced',
      fitPreference: raw.silhouette?.fitPreference ?? 'regular',
      preferredCuts: sanitizeStringArray(raw.silhouette?.preferredCuts),
      avoidCuts: sanitizeStringArray(raw.silhouette?.avoidCuts),
    },
    styling: {
      footwearLanguage: sanitizeStringArray(raw.styling?.footwearLanguage),
      bagLanguage: sanitizeStringArray(raw.styling?.bagLanguage),
      accessoryLanguage: sanitizeStringArray(raw.styling?.accessoryLanguage),
      disruptorStyle: raw.styling?.disruptorStyle ?? 'accessory',
      disruptorTolerance: raw.styling?.disruptorTolerance ?? 'subtle',
      modestyRules: sanitizeStringArray(raw.styling?.modestyRules),
      signatureCodes: sanitizeStringArray(raw.styling?.signatureCodes),
      antiCodes: sanitizeStringArray(raw.styling?.antiCodes),
    },
    occasionDirectives,
  };
}

function getIndianSeason(date: Date): { season: string; description: string } {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return {
      season: 'Summer',
      description: 'Hot Indian summer. Prefer breathable fabrics, light layering, and avoid heavy pieces.'
    };
  }
  if (month >= 6 && month <= 9) {
    return {
      season: 'Monsoon',
      description: 'Monsoon season. Avoid heavy, delicate, or slow-drying pieces; quick-dry and practical footwear are preferred.'
    };
  }
  if (month >= 10 && month <= 11) {
    return {
      season: 'Post-Monsoon / Early Winter',
      description: 'Transitional weather. Light layers and medium-weight fabrics work well.'
    };
  }
  return {
    season: 'Winter',
    description: 'Cool Indian winter. Medium-weight fabrics and light layering are appropriate.'
  };
}

function getActiveRestrictions(restrictions?: string[] | null): RestrictionKey[] {
  return (restrictions ?? []).filter((rule): rule is RestrictionKey => rule in RESTRICTION_RULES);
}

function stringifyForPrompt(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildPreferenceProfilePrompt(profile: {
  liked_outfit_examples?: string[] | null;
  style_notes?: string | null;
  visual_profile?: string | null;
  style_restrictions?: string[] | null;
  budget_level?: BudgetLevel | null;
  height_cm?: number;
  weight_kg?: number;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
}): string {
  return `${WOMEN_OUTFIT_SKILL}

TASK: Build the Preference Profile JSON only.

Rules:
- Output only valid JSON matching the Preference Profile JSON contract in the skill.
- The same client inputs should produce the same normalized profile.
- liked_outfit_examples are the primary taste signal.
- style_notes are secondary.
- visual_profile supports undertone, silhouette, and scale decisions only.
- Convert repeated positive cues into signatureCodes.
- Convert explicit dislikes or clear absences into antiCodes where justified.

CLIENT INPUT
liked_outfit_examples: ${stringifyForPrompt(sanitizeStringArray(profile.liked_outfit_examples))}
style_notes: ${JSON.stringify(profile.style_notes ?? '')}
visual_profile: ${JSON.stringify(profile.visual_profile ?? '')}
style_restrictions: ${stringifyForPrompt(getActiveRestrictions(profile.style_restrictions))}
budget_level: ${JSON.stringify(profile.budget_level ?? null)}
measurements: ${stringifyForPrompt({
  height_cm: profile.height_cm ?? null,
  weight_kg: profile.weight_kg ?? null,
  bust_cm: profile.bust_cm ?? null,
  waist_cm: profile.waist_cm ?? null,
  hips_cm: profile.hips_cm ?? null,
})}
`;
}

export async function generatePreferenceProfile(profile: {
  liked_outfit_examples?: string[] | null;
  style_notes?: string | null;
  visual_profile?: string | null;
  style_restrictions?: string[] | null;
  budget_level?: BudgetLevel | null;
  height_cm?: number;
  weight_kg?: number;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  preference_profile?: PreferenceProfile | null;
  preference_profile_version?: string | null;
}): Promise<{ preferenceProfile: PreferenceProfile; source: 'stored' | 'generated' }> {
  if (
    isPreferenceProfile(profile.preference_profile)
    && profile.preference_profile_version === WOMEN_OUTFIT_ENGINE_VERSION
  ) {
    return {
      preferenceProfile: normalizePreferenceProfile(profile.preference_profile),
      source: 'stored',
    };
  }

  const prompt = buildPreferenceProfilePrompt(profile);
  const generated = await callGeminiJSON<PreferenceProfile>(prompt);
  return {
    preferenceProfile: normalizePreferenceProfile(generated),
    source: 'generated',
  };
}

function buildBlueprintPrompt(
  preferenceProfile: PreferenceProfile,
  season: { season: string; description: string },
  activeRestrictions: RestrictionKey[],
  budgetLevel: BudgetLevel | null
): string {
  return `${WOMEN_OUTFIT_SKILL}

TASK: Build the Outfit Blueprint JSON only.

Rules:
- Output only valid JSON matching the Outfit Blueprint JSON contract in the skill.
- Return exactly 6 objects, one per occasion.
- Honour the preference profile as the source of truth.
- Keep the entire batch coherent as one wardrobe.
- Use signature codes repeatedly across the batch without making the 6 looks feel duplicated.
- Respect these hard restrictions: ${activeRestrictions.length ? activeRestrictions.map(rule => RESTRICTION_RULES[rule]).join(' | ') : 'none'}
- Budget guidance: ${budgetLevel ?? 'mid'}

CURRENT SEASON
${season.season}: ${season.description}

PREFERENCE PROFILE
${stringifyForPrompt(preferenceProfile)}
`;
}

async function generateIdealBlueprints(
  preferenceProfile: PreferenceProfile,
  activeRestrictions: RestrictionKey[],
  season: { season: string; description: string },
  budgetLevel: BudgetLevel | null
): Promise<OutfitBlueprint[]> {
  const blueprints = await callGeminiJSON<OutfitBlueprint[]>(
    buildBlueprintPrompt(preferenceProfile, season, activeRestrictions, budgetLevel)
  );

  if (!Array.isArray(blueprints) || blueprints.length !== OCCASIONS.length) {
    throw new Error(`Expected ${OCCASIONS.length} blueprints, got ${Array.isArray(blueprints) ? blueprints.length : 'invalid'}`);
  }

  return blueprints.map(blueprint => ({
    ...blueprint,
    signatureCodesUsed: sanitizeStringArray(blueprint.signatureCodesUsed),
  }));
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasAnyToken(haystack: string, tokens: string[]): boolean {
  return tokens.some(token => token && haystack.includes(normalizeText(token)));
}

function isUpperBodySlot(slot: SlotKey): boolean {
  return slot === 'singlePiece' || slot === 'top' || slot === 'layer';
}

function itemText(item: FashionItem): string {
  return normalizeText([
    item.item_name,
    item.category,
    item.brand,
    item.raw_description,
    item.style_description,
    ...(item.color ?? []),
    ...(item.material ?? []),
  ].filter(Boolean).join(' '));
}

function getItemColors(item: FashionItem): string[] {
  return (item.color ?? []).map(color => normalizeText(color)).filter(Boolean);
}

function matchesCategory(item: FashionItem, slot: SlotKey): boolean {
  const allowed = CATEGORY_BY_SLOT[slot];
  return !!item.category && allowed.includes(item.category);
}

function violatesRestrictions(item: FashionItem, slot: SlotKey, activeRestrictions: RestrictionKey[]): boolean {
  const tags = item.style_tags;
  if (!tags) return false;

  if (activeRestrictions.includes('no_sleeveless') && isUpperBodySlot(slot)) {
    if (tags.sleeve_type === 'sleeveless' || !tags.coverage.includes('shoulders_covered')) return true;
  }

  if (activeRestrictions.includes('cover_tummy') && (slot === 'singlePiece' || slot === 'top')) {
    if (tags.coverage.includes('tummy_exposed')) return true;
  }

  return false;
}

function seasonAllowsItem(tags: FashionItemStyleTags | undefined, seasonName: string): boolean {
  if (!tags) return true;
  if (seasonName === 'Summer' || seasonName === 'Monsoon') {
    return tags.fabric_weight !== 'heavy';
  }
  if (seasonName === 'Winter') {
    return true;
  }
  return true;
}

function silhouetteScore(slot: SlotKey, tags: FashionItemStyleTags | undefined, preferenceProfile: PreferenceProfile): number {
  if (!tags) return 0;

  const family = preferenceProfile.silhouette.family;
  const silhouette = tags.silhouette_type;
  const fit = tags.fit_category;
  let score = 0;

  if ((family === 'pear' || family === 'inverted-triangle') && slot === 'bottom') {
    if (['A-line', 'flowy', 'relaxed', 'tailored'].includes(silhouette)) score += 8;
    if (fit === 'slim') score -= 6;
  }

  if ((family === 'apple' || family === 'plus') && (slot === 'singlePiece' || slot === 'top')) {
    if (['flowy', 'structured', 'wrap', 'tailored'].includes(silhouette)) score += 8;
    if (silhouette === 'fitted' || silhouette === 'sheath') score -= 6;
  }

  if (family === 'hourglass') {
    if (['wrap', 'fitted', 'tailored'].includes(silhouette)) score += 8;
  }

  if (family === 'rectangle') {
    if (['structured', 'tailored', 'A-line', 'wrap'].includes(silhouette)) score += 7;
  }

  if (family === 'petite') {
    if (tags.length === 'maxi' && slot === 'layer') score -= 10;
    if (fit === 'oversized') score -= 5;
  }

  return score;
}

function budgetScore(item: FashionItem, budgetLevel: BudgetLevel | null): number {
  if (!budgetLevel || item.price == null) return 0;
  const maxPrice = BUDGET_MAX_PRICE[budgetLevel];
  if (item.price <= maxPrice) return 8;
  if (budgetLevel === 'high') return 2;
  return -8;
}

function scoreCandidate(
  item: FashionItem,
  slot: SlotKey,
  blueprint: OutfitBlueprint,
  preferenceProfile: PreferenceProfile,
  budgetLevel: BudgetLevel | null
): CatalogCandidate {
  const tags = item.style_tags;
  const text = itemText(item);
  const colours = getItemColors(item);
  const preferredColours = preferenceProfile.colour.preferredColours.map(normalizeText);
  const avoidedColours = preferenceProfile.colour.avoidedColours.map(normalizeText);
  const signatureCodes = preferenceProfile.styling.signatureCodes.map(normalizeText);
  const antiCodes = preferenceProfile.styling.antiCodes.map(normalizeText);
  const blueprintText = normalizeText([
    blueprint.title,
    blueprint.singlePiece,
    blueprint.top,
    blueprint.layer,
    blueprint.bottom,
    blueprint.shoes,
    blueprint.bag,
    blueprint.accessory,
    blueprint.disruptor,
  ].filter(Boolean).join(' '));

  let score = 20;
  const reasons: string[] = [];

  if (tags?.occasion_tags?.includes(blueprint.occasion)) {
    score += 16;
    reasons.push('occasion match');
  } else if (!tags?.occasion_tags?.length) {
    reasons.push('occasion unknown');
  } else {
    score -= 10;
    reasons.push('weak occasion fit');
  }

  if (tags?.undertone_compatibility?.includes(preferenceProfile.colour.undertone)) {
    score += 12;
    reasons.push('undertone match');
  } else if (!tags?.undertone_compatibility?.length) {
    reasons.push('undertone unknown');
  }

  if (colours.some(colour => preferredColours.includes(colour))) {
    score += 10;
    reasons.push('preferred colour');
  }

  if (colours.some(colour => avoidedColours.includes(colour))) {
    score -= 12;
    reasons.push('avoided colour');
  }

  if (hasAnyToken(text, signatureCodes) || hasAnyToken(blueprintText, colours)) {
    score += 8;
    reasons.push('signature alignment');
  }

  if (hasAnyToken(text, antiCodes)) {
    score -= 10;
    reasons.push('anti-code conflict');
  }

  const silhouette = silhouetteScore(slot, tags, preferenceProfile);
  if (silhouette !== 0) {
    score += silhouette;
    reasons.push('silhouette fit');
  }

  const budget = budgetScore(item, budgetLevel);
  if (budget !== 0) {
    score += budget;
    reasons.push(budget > 0 ? 'budget fit' : 'budget stretch');
  }

  if (hasAnyToken(text, blueprint.signatureCodesUsed.map(normalizeText))) {
    score += 6;
    reasons.push('blueprint code match');
  }

  return {
    id: item.id!,
    name: item.item_name,
    category: item.category ?? 'other',
    score,
    reasons,
    color: item.color,
    material: item.material,
  };
}

function buildCandidatePoolForSlot(
  blueprint: OutfitBlueprint,
  slot: SlotKey,
  items: FashionItem[],
  preferenceProfile: PreferenceProfile,
  activeRestrictions: RestrictionKey[],
  season: { season: string; description: string },
  budgetLevel: BudgetLevel | null
): CandidateItem[] {
  const primary = items
    .filter(item => item.id && matchesCategory(item, slot))
    .filter(item => !violatesRestrictions(item, slot, activeRestrictions))
    .filter(item => seasonAllowsItem(item.style_tags, season.season))
    .filter(item => {
      if (!item.style_tags?.occasion_tags?.length) return true;
      return item.style_tags.occasion_tags.includes(blueprint.occasion);
    })
    .filter(item => {
      if (!item.style_tags?.undertone_compatibility?.length) return true;
      return item.style_tags.undertone_compatibility.includes(preferenceProfile.colour.undertone);
    });

  const source = primary.length > 0
    ? primary
    : items
        .filter(item => item.id && matchesCategory(item, slot))
        .filter(item => !violatesRestrictions(item, slot, activeRestrictions));

  return source
    .map(item => ({
      item,
      summary: scoreCandidate(item, slot, blueprint, preferenceProfile, budgetLevel),
    }))
    .sort((a, b) => b.summary.score - a.summary.score)
    .slice(0, slot === 'shoes' ? 10 : 8);
}

function buildAllCandidatePools(
  blueprints: OutfitBlueprint[],
  items: FashionItem[],
  preferenceProfile: PreferenceProfile,
  activeRestrictions: RestrictionKey[],
  season: { season: string; description: string },
  budgetLevel: BudgetLevel | null
): Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>> {
  const pools = new Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>();

  for (const blueprint of blueprints) {
    const slotPools = {} as Record<SlotKey, CandidateItem[]>;
    for (const slot of SLOT_ORDER) {
      const required = slot === 'shoes'
        || (slot === 'singlePiece' && !!blueprint.singlePiece)
        || (slot === 'top' && !!blueprint.top)
        || (slot === 'layer' && !!blueprint.layer)
        || (slot === 'bottom' && !!blueprint.bottom)
        || (slot === 'bag' && !!blueprint.bag)
        || (slot === 'accessory' && !!blueprint.accessory);

      slotPools[slot] = required
        ? buildCandidatePoolForSlot(blueprint, slot, items, preferenceProfile, activeRestrictions, season, budgetLevel)
        : [];
    }
    pools.set(blueprint.occasion, slotPools);
  }

  return pools;
}

function candidatePoolsForPrompt(
  blueprints: OutfitBlueprint[],
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>
): string {
  return blueprints.map(blueprint => {
    const pools = candidatePools.get(blueprint.occasion)!;
    const slotText = SLOT_ORDER
      .filter(slot => pools[slot].length > 0)
      .map(slot => {
        const candidates = pools[slot]
          .map(({ summary }) => `- ${summary.id} | ${summary.name} | ${summary.category} | score=${summary.score} | reasons=${summary.reasons.join(', ') || 'none'} | color=${(summary.color ?? []).join('/') || 'n/a'}`)
          .join('\n');
        return `${slot}:\n${candidates}`;
      })
      .join('\n\n');

    return `OCCASION ${blueprint.occasion.toUpperCase()} — ${blueprint.title}
Blueprint: ${stringifyForPrompt(blueprint)}
Candidate pools:
${slotText}`;
  }).join('\n\n');
}

function buildMatchPrompt(
  blueprints: OutfitBlueprint[],
  preferenceProfile: PreferenceProfile,
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>
): string {
  return `${WOMEN_OUTFIT_SKILL}

TASK: Build the Catalog Match JSON only.

Rules:
- Use only the candidate IDs provided.
- Return exactly 6 objects.
- Do not use the same item in more than 2 outfits.
- Shoes are mandatory.
- If a singlePiece is selected, top and bottom must be null.
- If a bag or accessory has no good option, leave that slot null.

PREFERENCE PROFILE
${stringifyForPrompt(preferenceProfile)}

BLUEPRINTS + CANDIDATE POOLS
${candidatePoolsForPrompt(blueprints, candidatePools)}
`;
}

function buildRepairPrompt(
  blueprints: OutfitBlueprint[],
  preferenceProfile: PreferenceProfile,
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>,
  invalidMatches: MatchOutput[],
  errors: string[]
): string {
  return `${WOMEN_OUTFIT_SKILL}

TASK: Repair the Catalog Match JSON.

Return only valid JSON matching the Catalog Match JSON contract.
Use only the candidate IDs provided.

Validation errors to fix:
${errors.map(error => `- ${error}`).join('\n')}

Invalid current output:
${stringifyForPrompt(invalidMatches)}

PREFERENCE PROFILE
${stringifyForPrompt(preferenceProfile)}

BLUEPRINTS + CANDIDATE POOLS
${candidatePoolsForPrompt(blueprints, candidatePools)}
`;
}

function matchUsesCandidate(
  occasion: OutfitOccasion,
  slot: SlotKey,
  itemId: string | null,
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>
): boolean {
  if (!itemId) return true;
  const pools = candidatePools.get(occasion);
  if (!pools) return false;
  return pools[slot].some(candidate => candidate.item.id === itemId);
}

function finalizeItemIds(slotSelections: Record<SlotKey, string | null>): string[] {
  return SLOT_ORDER
    .map(slot => slotSelections[slot])
    .filter((id): id is string => !!id)
    .filter((id, index, ids) => ids.indexOf(id) === index);
}

function validateMatches(
  matches: MatchOutput[],
  blueprints: OutfitBlueprint[],
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>,
  itemById: Map<string, FashionItem>,
  activeRestrictions: RestrictionKey[]
): string[] {
  const errors: string[] = [];
  const usage = new Map<string, number>();

  if (matches.length !== blueprints.length) {
    errors.push(`Expected ${blueprints.length} match objects, got ${matches.length}`);
    return errors;
  }

  const blueprintByOccasion = new Map(blueprints.map(blueprint => [blueprint.occasion, blueprint]));

  for (const match of matches) {
    const blueprint = blueprintByOccasion.get(match.occasion);
    if (!blueprint) {
      errors.push(`Unknown occasion in match output: ${match.occasion}`);
      continue;
    }

    const selections = match.slotSelections;
    if (!selections || typeof selections !== 'object') {
      errors.push(`${match.occasion}: missing slotSelections`);
      continue;
    }

    for (const slot of SLOT_ORDER) {
      const selectedId = selections[slot];
      if (!matchUsesCandidate(match.occasion, slot, selectedId, candidatePools)) {
        errors.push(`${match.occasion}: ${slot} selected an ID outside its candidate pool`);
      }
    }

    if (!selections.shoes) {
      errors.push(`${match.occasion}: missing shoes`);
    }

    if (!selections.singlePiece && (!selections.top || !selections.bottom)) {
      errors.push(`${match.occasion}: missing base outfit pieces`);
    }

    if (selections.singlePiece && (selections.top || selections.bottom)) {
      errors.push(`${match.occasion}: singlePiece cannot be combined with top/bottom`);
    }

    const itemIds = finalizeItemIds(selections);
    for (const itemId of itemIds) {
      const item = itemById.get(itemId);
      if (!item) {
        errors.push(`${match.occasion}: unknown item ${itemId}`);
        continue;
      }
      usage.set(itemId, (usage.get(itemId) ?? 0) + 1);

      if (violatesRestrictions(item, selections.singlePiece === itemId ? 'singlePiece' :
        selections.top === itemId ? 'top' :
        selections.layer === itemId ? 'layer' :
        selections.bottom === itemId ? 'bottom' :
        selections.shoes === itemId ? 'shoes' :
        selections.bag === itemId ? 'bag' : 'accessory', activeRestrictions)) {
        errors.push(`${match.occasion}: selected item ${item.item_name} violates restrictions`);
      }
    }
  }

  for (const [itemId, count] of usage.entries()) {
    if (count > 2) {
      const item = itemById.get(itemId);
      errors.push(`Item reused more than twice: ${item?.item_name ?? itemId}`);
    }
  }

  return errors;
}

async function selectMatches(
  blueprints: OutfitBlueprint[],
  preferenceProfile: PreferenceProfile,
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>,
  itemById: Map<string, FashionItem>,
  activeRestrictions: RestrictionKey[]
): Promise<{ matches: MatchOutput[]; selectionSource: 'model' | 'repair'; validationErrors: string[] }> {
  const initial = await callGeminiJSON<MatchOutput[]>(
    buildMatchPrompt(blueprints, preferenceProfile, candidatePools)
  );
  const initialMatches = Array.isArray(initial) ? initial : [];
  const errors = validateMatches(initialMatches, blueprints, candidatePools, itemById, activeRestrictions);

  if (errors.length === 0) {
    return { matches: initialMatches, selectionSource: 'model', validationErrors: [] };
  }

  const repaired = await callGeminiJSON<MatchOutput[]>(
    buildRepairPrompt(blueprints, preferenceProfile, candidatePools, initialMatches, errors)
  );
  const repairedMatches = Array.isArray(repaired) ? repaired : [];
  const repairedErrors = validateMatches(repairedMatches, blueprints, candidatePools, itemById, activeRestrictions);

  if (repairedErrors.length > 0) {
    throw new Error(`Match repair failed: ${repairedErrors.join(' | ')}`);
  }

  return { matches: repairedMatches, selectionSource: 'repair', validationErrors: errors };
}

function buildDiagnosticsForOutfit(
  occasion: OutfitOccasion,
  candidatePools: Map<OutfitOccasion, Record<SlotKey, CandidateItem[]>>,
  slotSelections: Record<SlotKey, string | null>,
  selectionSource: 'model' | 'repair',
  notes: string[]
): MatchDiagnostics {
  const pools = candidatePools.get(occasion)!;
  return {
    selectionSource,
    candidatePools: SLOT_ORDER
      .filter(slot => pools[slot].length > 0)
      .map(slot => ({
        occasion,
        slot,
        candidates: pools[slot].map(({ summary }) => summary),
      })),
    slotSelections,
    notes,
  };
}

export async function generateOutfitRecommendations(
  profile: {
    height_cm?: number;
    weight_kg?: number;
    bust_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    style_restrictions?: string[] | null;
    style_notes?: string | null;
    visual_profile?: string | null;
    budget_level?: BudgetLevel | null;
    liked_outfit_examples?: string[] | null;
    preference_profile?: PreferenceProfile | null;
    preference_profile_version?: string | null;
  },
  items: FashionItem[]
): Promise<OutfitGenerationResult> {
  const season = getIndianSeason(new Date());
  const activeRestrictions = getActiveRestrictions(profile.style_restrictions);
  const { preferenceProfile, source } = await generatePreferenceProfile(profile);
  const blueprints = await generateIdealBlueprints(
    preferenceProfile,
    activeRestrictions,
    season,
    profile.budget_level ?? null
  );

  const validItems = items.filter(item => !!item.id);
  const itemById = new Map(validItems.map(item => [item.id!, item]));
  const candidatePools = buildAllCandidatePools(
    blueprints,
    validItems,
    preferenceProfile,
    activeRestrictions,
    season,
    profile.budget_level ?? null
  );

  const { matches, selectionSource, validationErrors } = await selectMatches(
    blueprints,
    preferenceProfile,
    candidatePools,
    itemById,
    activeRestrictions
  );

  const blueprintByOccasion = new Map(blueprints.map(blueprint => [blueprint.occasion, blueprint]));
  const recommendations = matches.map(match => ({
    occasion: match.occasion,
    styleNote: match.styleNote,
    itemIds: finalizeItemIds(match.slotSelections),
    blueprint: blueprintByOccasion.get(match.occasion),
    diagnostics: buildDiagnosticsForOutfit(
      match.occasion,
      candidatePools,
      match.slotSelections,
      selectionSource,
      validationErrors
    ),
    validationErrors,
  }));

  return {
    recommendations,
    preferenceProfile,
    generationVersion: WOMEN_OUTFIT_ENGINE_VERSION,
    preferenceProfileSource: source,
  };
}
