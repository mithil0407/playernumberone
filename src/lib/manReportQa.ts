import type { ClassificationResult, ReportData } from './manReportGenerator';
import { inferOutfitContext, parseManOutfitsFromSection } from './manOutfitSection';
import { getManOutfitPrimaryColourFamily, getManReportClimateProfile } from './manOutfitLibrary';

export interface ManReportQaIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface ManReportQaResult {
  checkedAt: string;
  outfitCount: number;
  contextCounts: Record<string, number>;
  issues: ManReportQaIssue[];
  quality?: ManOutfitPortfolioQuality;
}

export interface ManOutfitQualityScore {
  outfitNumber: number;
  context: string;
  score: number;
  categoryFidelity: number;
  aspirationNovelty: number;
  personalisation: number;
  portfolioDiversity: number;
  climateWearability: number;
}

export interface ManOutfitPortfolioQuality {
  overallScore: number;
  contextScores: Record<string, number>;
  outfitScores: ManOutfitQualityScore[];
  rubricVersion: 'iconik-men-9plus-v1';
  evaluatorVersion: 'deterministic-independent-v1';
  minimumOutfitScore: number;
  passed: boolean;
  failedCriteria: string[];
}

export interface ManReportQaOptions {
  enforceV2?: boolean;
  patternWaiver?: boolean;
  suitWaiver?: boolean;
  tieWaiver?: boolean;
}

interface ParsedQaOutfit {
  number: number;
  rawLabel: string;
  context: string;
  block: string;
  fields: Record<string, string>;
}

const EXPECTED_CONTEXTS = ['Office / Formal', 'Smart Casual', 'Evening Wear', 'Relaxed Casual'] as const;
const EXPECTED_CONTEXT_COUNTS: Record<string, number> = {
  'Office / Formal': 6,
  'Smart Casual': 4,
  'Evening Wear': 5,
  'Relaxed Casual': 5,
};

const CONTEXT_ALIASES: Array<[RegExp, string]> = [
  [/\boffice\b|\bformal\b/i, 'Office / Formal'],
  [/\bsmart\s+casual\b/i, 'Smart Casual'],
  [/\bevening\b/i, 'Evening Wear'],
  [/\brelaxed\s+casual\b|\bcasual\b/i, 'Relaxed Casual'],
];

const FIELD_ALIASES: Record<string, string[]> = {
  top: ['TOP', 'Top'],
  layer: ['LAYER', 'Layer', 'Layer/Outerwear', 'Outerwear'],
  bottom: ['BOTTOM', 'Bottom'],
  footwear: ['FOOTWEAR', 'Footwear'],
  accessory: ['ACCESSORY', 'ACCESSORIES', 'Accessory', 'Accessories'],
  why: ['WHY IT WORKS FOR YOU', 'Why it works for you', 'Why it works', 'Occasion anchor'],
  fitNote: ['FIT NOTE', 'Fit note'],
  colourLogic: ['COLOUR LOGIC', 'COLOR LOGIC', 'Colour logic', 'Color logic'],
  shoppingTranslation: ['SHOPPING TRANSLATION', 'Shopping translation'],
  acceptableSubstitutes: ['ACCEPTABLE SUBSTITUTES', 'Acceptable substitutes'],
  doNotBuy: ['DO NOT BUY', 'Do not buy'],
};

const COMMON_COLOURS = [
  'black', 'white', 'ivory', 'cream', 'off-white', 'navy', 'charcoal', 'grey', 'gray',
  'stone', 'camel', 'tan', 'brown', 'chocolate', 'olive', 'khaki', 'rust', 'terracotta',
  'burgundy', 'wine', 'teal', 'emerald', 'cobalt', 'plum', 'sage', 'slate',
];

const INVENTED_DETAIL_PATTERN = /\b(gathered|twist-front|twist\s+front|asymmetric|cutout|cut-out|statement\s+sleeve|panelled|paneled|deconstructed|wrap-effect|wrap\s+effect|ruched|cascading|architectural|hybrid)\b/i;
const MULTI_COLOUR_GARMENT_PATTERN = /\b(colou?r-?blocked|contrast\s+(panel|panels|piping|trim|trims)|two-?tone|hint\s+of|inserted\s+colou?r|multi-?colou?r)\b/i;
const SHINY_FABRIC_PATTERN = /\b(satin|shiny|high-?gloss|glossy)\b|\bsilk\b(?![-\s]free)/i;
const BANNED_SHIRT_PATTERN = /\b(band[-\s]?collar|mandarin[-\s]?collar)\b/i;
const BANNED_SNEAKER_PATTERN = /\b(brown|tan|colou?red|logo[-\s]?heavy)\s+(?:leather\s+|canvas\s+|low[-\s]?top\s+|retro\s+|minimalist\s+)?sneakers?\b/i;
const FORMAL_CASUAL_PATTERN = /\b(tee|t-shirt|polo|denim|jeans|sneakers?|drawstring|cargo|camp[-\s]?collar|overshirt|rugby|henley)\b/i;
const STATEMENT_EVENING_LAYER_PATTERN = /\b(leather|suede)\b.*\b(jacket|bomber|blouson|café racer|cafe racer)\b|\b(varsity|letterman|harrington|matte\s+cotton\s+bomber)\b/i;
const LEATHER_OUTERWEAR_PATTERN = /\bleather\b.*\b(jacket|bomber|blouson|café racer|cafe racer)\b/i;
const STANDARD_TONAL_VARSITY_PATTERN = /\btonal\b.*\b(?:cotton(?:-twill)?|wool(?:-blend)?)\b.*\bvarsity\s+jacket\b.*\b(?:no\s+logos?|plain\s+body|tonal\s+sleeves?)\b/i;
const HOT_CLIMATE_RESTRICTED_PATTERN = /\bturtleneck\b|\broll[-\s]?neck\b|\bwool(?:-blend|\s+blend)?\b|\bflannel\b|\bheavy\s+knit\b|\bmerino\b|\bcorduroy\b|\bovercoat\b|\bpuffer\b|\bscarf\b|\bthick\s+tweed\b|\bvelvet\b/i;
const MONSOON_RESTRICTED_PATTERN = /\bsuede\b|\bnubuck\b|\bturtleneck\b|\broll[-\s]?neck\b|\bwool(?:-blend|\s+blend)?\b|\bflannel\b|\bheavy\s+knit\b|\bmerino\b|\bcorduroy\b|\bovercoat\b|\bpuffer\b|\bscarf\b|\bthick\s+tweed\b|\bvelvet\b/i;
const STATEMENT_FABRIC_PATTERN = /\b(suede|leather|corduroy|flannel)\b/gi;
const ELEVATED_PRIMARY_COLOURS = /\b(ecru|warm\s+ivory|chalk\s+white|off-white|bone|ink\s+navy|slate\s+blue|powder\s+blue|dusty\s+blue|chambray\s+blue|dark\s+olive|sage|forest|pistachio|espresso|chocolate|tobacco|cognac|dark\s+taupe|stone|oatmeal|sand|warm\s+taupe|camel|charcoal|warm\s+grey|slate|burgundy|muted\s+terracotta|brick|butter\s+yellow|dusty\s+pink)\b/i;
const ELEVATION_MOVE_PATTERNS = [
  /\b(ecru|warm\s+ivory|chalk\s+white|off-white|bone|ink\s+navy|dark\s+olive|espresso|stone|taupe|oatmeal|dark\s+brown\s+suede|burgundy)\b/i,
  /\b(sage|pistachio|dusty\s+pink|butter\s+yellow|powder\s+blue|tobacco|mid-grey\s+flannel|cognac)\b/i,
  /\bthree[-\s]?depth|clearly\s+distinguishable\s+depths\b/i,
  /\bhigh[-\s]?rise|single[-\s]?pleat|pleated\b/i,
  /\bfuller\s+tapered|full[-\s]?length|clean\s+full\s+fall|full\s+clean\s+fall\b/i,
  /\b(open|fully\s+open)\b.*\b(layer|overshirt|blazer|chore\s+jacket|jacket)\b/i,
  /\b(tortoiseshell|panto|face[-\s]?shape[-\s]?calibrated)\b/i,
  /\b(collar\s+and\s+cuffs\s+visible|tee\s+collar\s+visible|visible\s+underlayer)\b/i,
  /\b(suede|linen[-\s]?cotton|fine[-\s]?merino|brushed\s+cotton)\b/i,
  /\b(top\s+button\s+open|sleeves?\s+rolled|belt\s+(?:matched|matches)|watch\s+metal)\b/i,
];

function issue(code: string, severity: ManReportQaIssue['severity'], message: string): ManReportQaIssue {
  return { code, severity, message };
}

function extractField(block: string, labels: string[]): string {
  const labelPattern = labels
    .map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|');
  const nextLabelPattern = Object.values(FIELD_ALIASES)
    .flat()
    .map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|');

  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*[-•]?[ \\t]*\\*{0,2}(?:${labelPattern})\\*{0,2}[ \\t]*:[ \\t]*\\*{0,2}(.+?)(?=\\n[ \\t]*[-•]?[ \\t]*\\*{0,2}(?:${nextLabelPattern})\\*{0,2}[ \\t]*:|\\n\\s*---|\\n\\s*(?:\\*\\*)?Outfit\\s+\\d+|\\n\\s*OUTFIT\\s+\\d+|$)`,
    'is',
  );

  return block.match(pattern)?.[1]?.replace(/\*{1,2}$/g, '').replace(/\n/g, ' ').trim() ?? '';
}

export function parseManReportOutfitsForQa(s4Text: string): ParsedQaOutfit[] {
  return parseManOutfitsFromSection(s4Text)
    .map(outfit => {
      const fields: Record<string, string> = {};
      for (const [key, labels] of Object.entries(FIELD_ALIASES)) {
        fields[key] = extractField(outfit.block, labels);
      }

      return {
        number: outfit.number,
        rawLabel: outfit.label,
        context: inferOutfitContext(outfit.label, outfit.number),
        block: outfit.block,
        fields,
      };
    })
    .sort((a, b) => a.number - b.number);
}

function findRepeatedDominantColours(outfits: ParsedQaOutfit[]): string[] {
  const counts: Record<string, number> = {};
  for (const outfit of outfits) {
    const searchable = [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom, outfit.fields.footwear].join(' ').toLowerCase();
    const firstColour = COMMON_COLOURS.find(colour => new RegExp(`\\b${colour}\\b`, 'i').test(searchable));
    if (firstColour) counts[firstColour] = (counts[firstColour] ?? 0) + 1;
  }
  return Object.entries(counts).filter(([, count]) => count > 3).map(([colour]) => colour);
}

function countStatementFabricsOutsideFootwear(outfit: ParsedQaOutfit): number {
  const text = [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom]
    .filter(Boolean)
    .join(' ');
  return Array.from(text.matchAll(STATEMENT_FABRIC_PATTERN)).length;
}

function hasNoLayer(outfit: ParsedQaOutfit): boolean {
  return !outfit.fields.layer || /^\s*(none|no layer|n\/a)\s*$/i.test(outfit.fields.layer);
}

function countVisibleElevationMoves(outfit: ParsedQaOutfit): number {
  const text = outfit.block.toLowerCase();
  return ELEVATION_MOVE_PATTERNS.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function looksLikeBasicCombo(outfit: ParsedQaOutfit): boolean {
  const top = outfit.fields.top.toLowerCase();
  const bottom = outfit.fields.bottom.toLowerCase();
  const footwear = outfit.fields.footwear.toLowerCase();
  const layer = outfit.fields.layer.toLowerCase();
  const noLayer = hasNoLayer(outfit);

  return (
    (noLayer && /\bwhite\b.*\b(shirt|oxford)\b/.test(top) && /\b(navy|black)\b.*\b(trouser|chino)\b/.test(bottom) && /\bblack\b.*\b(derby|oxford|loafer|shoe)\b/.test(footwear)) ||
    (/\blight\s+blue\b.*\bshirt\b/.test(top) && /\bnavy\b.*\bchino\b/.test(bottom) && /\bbrown\b.*\b(loafer|derby|shoe)\b/.test(footwear)) ||
    (/\bnavy\b.*\bpolo\b/.test(top) && /\b(beige|khaki)\b.*\bchino\b/.test(bottom) && /\bwhite\b.*\bsneaker/.test(footwear)) ||
    (/\bblack\b.*\bpolo\b/.test(top) && /\b(black|grey|gray)\b.*\b(trouser|chino)\b/.test(bottom)) ||
    (noLayer && /\bwhite\b.*\btee\b/.test(top) && /\b(blue|mid-blue|light-wash)\b.*\bdenim|jeans\b/.test(bottom) && /\bwhite\b.*\bsneaker/.test(footwear)) ||
    (/\bgrey\b.*\b(tee|polo)\b/.test(top) && /\bnavy\b.*\btrouser\b/.test(bottom)) ||
    (noLayer && /\bcheck\b.*\bshirt\b/.test(top) && /\bblue\b.*\bdenim|jeans\b/.test(bottom) && /\bsneaker/.test(footwear)) ||
    (/\bnavy\b.*\bblazer\b/.test(layer) && /\bwhite\b.*\bshirt\b/.test(top) && /\bnavy\b.*\btrouser\b/.test(bottom) && /\bblack\b.*\b(derby|oxford|loafer|shoe)\b/.test(footwear))
  );
}

function countElevatedPrimaryColourOutfits(outfits: ParsedQaOutfit[]): number {
  return outfits.filter(outfit => {
    return ELEVATED_PRIMARY_COLOURS.test(outfit.fields.top)
      || (!hasNoLayer(outfit) && ELEVATED_PRIMARY_COLOURS.test(outfit.fields.layer));
  }).length;
}

function isPatterned(outfit: ParsedQaOutfit): boolean {
  return /\b(stripe|striped|gingham|check|checked|houndstooth|glen\s+check|pinstripe|chalk[-\s]?stripe|jacquard|paisley|geometric|abstract\s+print|patterned)\b/i.test(
    [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom].join(' '),
  );
}

function outfitSilhouetteFamily(outfit: ParsedQaOutfit): string {
  const text = [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom].join(' ').toLowerCase();
  const prefix = outfit.context.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  if (/matching\b.*\bsuit|\bsuit\s+(jacket|trousers)/.test(text)) return `${prefix}:matched-suit`;
  if (/\bblazer\b/.test(outfit.fields.layer.toLowerCase())) return `${prefix}:open-blazer-tailoring`;
  if (STATEMENT_EVENING_LAYER_PATTERN.test(outfit.fields.layer)) return `${prefix}:statement-jacket-column`;
  if (/overshirt|chore\s+jacket|utility\s+jacket|trucker\s+jacket/.test(outfit.fields.layer.toLowerCase())) return `${prefix}:open-utility-column`;
  if (/draped over (?:the )?shoulders/.test(text)) return `${prefix}:draped-knit-tailoring`;
  if (/\bshorts\b/.test(outfit.fields.bottom.toLowerCase())) return `${prefix}:resort-shorts`;
  if (/\bdenim|jeans\b/.test(outfit.fields.bottom.toLowerCase())) return `${prefix}:top-with-straight-denim`;
  if (/\bpolo\b/.test(outfit.fields.top.toLowerCase())) return `${prefix}:polo-tailored-bottom`;
  return `${prefix}:shirt-tailored-bottom`;
}

function outfitFootwearType(outfit: ParsedQaOutfit): string {
  const text = outfit.fields.footwear.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ['oxford', /\boxford\b/], ['derby', /\bderby\b/], ['loafer', /\bloafer\b/],
    ['chelsea-boot', /\bchelsea\b/], ['lace-up-boot', /\b(?:lace-up|plain-toe|dress)\s+boots?\b/],
    ['chukka', /\bchukka\b/], ['sneaker', /\bsneakers?\b/], ['espadrille', /\bespadrilles?\b/], ['sandal', /\bsandals?\b/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';
}

function outfitLayerType(outfit: ParsedQaOutfit): string | null {
  if (hasNoLayer(outfit)) return null;
  const text = outfit.fields.layer.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ['suit-or-blazer', /suit\s+jacket|blazer/], ['statement-jacket', STATEMENT_EVENING_LAYER_PATTERN],
    ['overshirt', /overshirt|open\s+shirt/], ['coat', /coat/],
    ['knit', /sweater|quarter-zip|half-zip|cardigan|knit/], ['utility', /chore|utility|trucker/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';
}

function relaxedArchetype(outfit: ParsedQaOutfit): 'resort' | 'old-money' | 'urban' {
  const text = [outfit.fields.top, outfit.fields.layer, outfit.fields.bottom, outfit.fields.footwear].join(' ').toLowerCase();
  if (/cargo|chore\s+jacket|utility\s+jacket|trucker\s+jacket|varsity|harrington|retro\s+runner/.test(text)) return 'urban';
  if (/camp[-\s]?collar|terry[-\s]?cloth|espadrille|sandals?|drawstring|\bshorts\b|linen.*(?:trouser|shirt)/.test(text)) return 'resort';
  return 'old-money';
}

function addV2PortfolioIssues(outfits: ParsedQaOutfit[], climateMode: ReturnType<typeof getManReportClimateProfile>['mode'], issues: ManReportQaIssue[], options: ManReportQaOptions) {
  const byContext = (context: string) => outfits.filter(outfit => outfit.context === context);
  const formal = byContext('Office / Formal');
  const evening = byContext('Evening Wear');
  const relaxed = byContext('Relaxed Casual');

  for (const outfit of formal) {
    if (FORMAL_CASUAL_PATTERN.test([outfit.fields.top, outfit.fields.layer, outfit.fields.bottom, outfit.fields.footwear].join(' '))) {
      issues.push(issue('formal_context_purity', 'error', `Outfit ${outfit.number} contains a casual garment in strict Office / Formal.`));
    }
  }
  const suitCount = formal.filter(outfit => /\bsuit\b/i.test(`${outfit.fields.layer} ${outfit.fields.bottom}`)).length;
  const blazerCount = formal.filter(outfit => /\bblazer\b/i.test(outfit.fields.layer) && !/\bsuit\b/i.test(`${outfit.fields.layer} ${outfit.fields.bottom}`)).length;
  const shirtLedCount = formal.filter(outfit => hasNoLayer(outfit) && /\bshirt\b/i.test(outfit.fields.top)).length;
  const tieCount = formal.filter(outfit => /\btie\b/i.test(outfit.fields.accessory)).length;
  if (!options.suitWaiver && suitCount !== 2) issues.push(issue('formal_suit_quota', 'error', `Strict Formal requires exactly 2 matched suits; found ${suitCount}.`));
  if (blazerCount !== 2) issues.push(issue('formal_blazer_quota', 'error', `Strict Formal requires exactly 2 blazer-and-trouser looks; found ${blazerCount}.`));
  if (shirtLedCount !== 2) issues.push(issue('formal_shirt_led_quota', 'error', `Strict Formal requires exactly 2 shirt-and-trouser looks; found ${shirtLedCount}.`));
  if (!options.tieWaiver && tieCount < 3) issues.push(issue('formal_tie_quota', 'error', `Strict Formal requires ties in at least 3 looks; found ${tieCount}.`));

  const statementCount = evening.filter(outfit => STATEMENT_EVENING_LAYER_PATTERN.test(outfit.fields.layer)).length;
  const requiredStatements = climateMode === 'hot' || climateMode === 'monsoon' ? 1 : 2;
  if (statementCount < requiredStatements) issues.push(issue('evening_statement_quota', 'error', `Evening requires ${requiredStatements} statement outerwear look${requiredStatements === 1 ? '' : 's'} in this climate; found ${statementCount}.`));
  const noLayerEvening = evening.filter(hasNoLayer).length;
  if (noLayerEvening > 2) issues.push(issue('evening_no_layer_cap', 'error', `Evening allows at most 2 no-layer looks; found ${noLayerEvening}.`));
  const plainPoloEvening = evening.filter(outfit => hasNoLayer(outfit) && /\bpolo\b/i.test(outfit.fields.top) && !isPatterned(outfit)).length;
  if (plainPoloEvening > 1) issues.push(issue('evening_plain_polo_cap', 'error', `Evening allows at most 1 plain no-layer polo look; found ${plainPoloEvening}.`));

  const relaxedCounts = relaxed.reduce<Record<string, number>>((acc, outfit) => {
    const archetype = relaxedArchetype(outfit);
    acc[archetype] = (acc[archetype] ?? 0) + 1;
    return acc;
  }, {});
  if (relaxedCounts.resort !== 2 || relaxedCounts['old-money'] !== 2 || relaxedCounts.urban !== 1) {
    issues.push(issue('relaxed_archetype_split', 'error', `Relaxed Casual must be 2 Resort/Riviera, 2 Daily Old-Money and 1 Urban/Travel; found ${relaxedCounts.resort ?? 0}/${relaxedCounts['old-money'] ?? 0}/${relaxedCounts.urban ?? 0}.`));
  }
  const relaxedPlainTees = relaxed.filter(outfit => /\b(tee|t-shirt)\b/i.test(outfit.fields.top) && !isPatterned(outfit)).length;
  if (relaxedPlainTees > 2) issues.push(issue('relaxed_plain_tee_cap', 'error', `Relaxed Casual allows at most 2 plain tee-led looks; found ${relaxedPlainTees}.`));
  const relaxedOpenUtility = relaxed.filter(outfit => /overshirt|chore\s+jacket|utility\s+jacket|trucker\s+jacket/i.test(outfit.fields.layer)).length;
  if (relaxedOpenUtility > 2) issues.push(issue('relaxed_open_layer_cap', 'error', `Relaxed Casual allows at most 2 open overshirt/utility silhouettes; found ${relaxedOpenUtility}.`));

  const silhouetteCounts = new Map<string, number>();
  for (const outfit of outfits) silhouetteCounts.set(outfitSilhouetteFamily(outfit), (silhouetteCounts.get(outfitSilhouetteFamily(outfit)) ?? 0) + 1);
  for (const [family, count] of silhouetteCounts) if (count > 3) issues.push(issue('silhouette_global_cap', 'error', `${family} appears ${count} times; a silhouette family may appear at most 3 times.`));
  for (const context of EXPECTED_CONTEXTS) {
    const local = new Map<string, number>();
    for (const outfit of byContext(context)) local.set(outfitSilhouetteFamily(outfit), (local.get(outfitSilhouetteFamily(outfit)) ?? 0) + 1);
    for (const [family, count] of local) if (count > 2) issues.push(issue('silhouette_context_cap', 'error', `${context} repeats ${family} ${count} times; the context maximum is 2.`));
  }

  const patternCount = outfits.filter(isPatterned).length;
  if (!options.patternWaiver && (patternCount < 5 || patternCount > 7)) issues.push(issue('pattern_portfolio_quota', 'error', `The v2 portfolio requires 5-7 patterned pieces; found ${patternCount}.`));
  if (!options.patternWaiver) {
    const minima: Array<[string, number]> = [['Office / Formal', 1], ['Smart Casual', 1], ['Evening Wear', 1], ['Relaxed Casual', 2]];
    for (const [context, minimum] of minima) {
      const count = byContext(context).filter(isPatterned).length;
      if (count < minimum) issues.push(issue('pattern_context_quota', 'error', `${context} requires at least ${minimum} patterned look${minimum === 1 ? '' : 's'}; found ${count}.`));
    }
  }
  if (new Set(outfits.map(outfitFootwearType)).size < 6) issues.push(issue('footwear_diversity', 'error', 'The v2 portfolio requires at least 6 footwear types.'));
  if (new Set(outfits.map(outfitLayerType).filter(Boolean)).size < 4) issues.push(issue('layer_diversity', 'error', 'The v2 portfolio requires at least 4 layer types.'));
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function evaluatePortfolioQuality(outfits: ParsedQaOutfit[], issues: ManReportQaIssue[]): ManOutfitPortfolioQuality {
  const diversityErrors = issues.filter(item => /diversity|silhouette|pattern_|archetype|_cap/.test(item.code) && item.severity === 'error').length;
  const portfolioDiversity = diversityErrors === 0 ? 9.6 : Math.max(6, 9.2 - diversityErrors * 0.5);
  const outfitScores = outfits.map(outfit => {
    const localErrors = issues.filter(item => item.severity === 'error' && new RegExp(`\\bOutfit ${outfit.number}\\b`).test(item.message)).length;
    const contextErrors = issues.filter(item => item.severity === 'error' && item.message.includes(outfit.context)).length;
    const moves = countVisibleElevationMoves(outfit);
    const categoryFidelity = localErrors || contextErrors ? Math.max(5, 9.4 - (localErrors + contextErrors) * 0.8) : 9.6;
    const aspirationNovelty = moves >= 3 ? 9.7 : moves >= 2 ? 9.2 : moves === 1 ? 8 : 6.5;
    const personalisation = outfit.fields.why.length >= 70 ? 9.5 : outfit.fields.why.length >= 40 ? 9.1 : outfit.fields.why ? 8.5 : 6.5;
    const wearabilityErrors = issues.filter(item => item.severity === 'error' && /climate|fabric|garment|banned|formal_context/.test(item.code) && item.message.includes(`Outfit ${outfit.number}`)).length;
    const climateWearability = wearabilityErrors ? Math.max(5, 9.5 - wearabilityErrors) : 9.6;
    const score = roundScore(categoryFidelity * 0.25 + aspirationNovelty * 0.25 + personalisation * 0.2 + portfolioDiversity * 0.15 + climateWearability * 0.15);
    return { outfitNumber: outfit.number, context: outfit.context, score, categoryFidelity: roundScore(categoryFidelity), aspirationNovelty: roundScore(aspirationNovelty), personalisation: roundScore(personalisation), portfolioDiversity: roundScore(portfolioDiversity), climateWearability: roundScore(climateWearability) };
  });
  const contextScores = EXPECTED_CONTEXTS.reduce<Record<string, number>>((acc, context) => {
    const scores = outfitScores.filter(item => item.context === context).map(item => item.score);
    acc[context] = scores.length ? roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    return acc;
  }, {});
  const overallScore = outfitScores.length ? roundScore(outfitScores.reduce((sum, item) => sum + item.score, 0) / outfitScores.length) : 0;
  const minimumOutfitScore = outfitScores.length ? Math.min(...outfitScores.map(item => item.score)) : 0;
  const failedCriteria = [
    overallScore < 9 ? `Overall outfit score is ${overallScore}; minimum is 9.0.` : null,
    ...Object.entries(contextScores).filter(([, score]) => score < 9).map(([context, score]) => `${context} score is ${score}; minimum is 9.0.`),
    minimumOutfitScore < 8.5 ? `Minimum individual outfit score is ${minimumOutfitScore}; minimum is 8.5.` : null,
    issues.some(item => item.severity === 'error') ? 'Deterministic outfit QA has blocking errors.' : null,
  ].filter(Boolean) as string[];
  return { overallScore, contextScores, outfitScores, rubricVersion: 'iconik-men-9plus-v1', evaluatorVersion: 'deterministic-independent-v1', minimumOutfitScore, passed: failedCriteria.length === 0, failedCriteria };
}

export function validateManReportSection4(
  s4Text: string,
  classification: ClassificationResult,
  options: ManReportQaOptions = {},
): ManReportQaResult {
  const outfits = parseManReportOutfitsForQa(s4Text);
  const climate = getManReportClimateProfile(classification);
  const issues: ManReportQaIssue[] = [];
  const contextCounts = EXPECTED_CONTEXTS.reduce<Record<string, number>>((acc, context) => {
    acc[context] = 0;
    return acc;
  }, {});

  for (const outfit of outfits) {
    contextCounts[outfit.context] = (contextCounts[outfit.context] ?? 0) + 1;
  }

  const expectedTotal = Object.values(EXPECTED_CONTEXT_COUNTS).reduce((sum, count) => sum + count, 0);
  if (outfits.length !== expectedTotal) {
    issues.push(issue('outfit_count', 'error', `Expected ${expectedTotal} parsed outfits, found ${outfits.length}.`));
  }

  for (const [context, expected] of Object.entries(EXPECTED_CONTEXT_COUNTS)) {
    if ((contextCounts[context] ?? 0) !== expected) {
      issues.push(issue('context_split', 'error', `${context} should have ${expected} outfits, found ${contextCounts[context] ?? 0}.`));
    }
  }

  const seenNumbers = new Set<number>();
  for (const outfit of outfits) {
    if (seenNumbers.has(outfit.number)) {
      issues.push(issue('duplicate_outfit_number', 'error', `Outfit ${outfit.number} appears more than once.`));
    }
    seenNumbers.add(outfit.number);

    if (!CONTEXT_ALIASES.some(([pattern]) => pattern.test(outfit.rawLabel))) {
      issues.push(issue('context_header', 'warning', `Outfit ${outfit.number} header does not explicitly name its context.`));
    }

    for (const field of ['top', 'layer', 'bottom', 'footwear', 'accessory']) {
      if (!outfit.fields[field]) {
        issues.push(issue('missing_required_field', 'error', `Outfit ${outfit.number} is missing ${field}.`));
      }
    }

    if (!outfit.fields.why) {
      issues.push(issue('missing_rationale', 'warning', `Outfit ${outfit.number} is missing a client-specific rationale.`));
    }

    const fullText = outfit.block.toLowerCase();
    if (/\bskinny\s+(jeans|trousers|pants)\b|\bspray-on\b/.test(fullText)) {
      issues.push(issue('banned_skinny', 'error', `Outfit ${outfit.number} includes a banned skinny/spray-on cut.`));
    }

    if (/\bcropped\b|\bankle[-\s]?cut\b|\b7\/8\b/.test(fullText)) {
      issues.push(issue('cropped_trouser', 'error', `Outfit ${outfit.number} includes cropped or ankle-cut trousers, which v6.1 bans.`));
    }

    if (INVENTED_DETAIL_PATTERN.test(fullText)) {
      issues.push(issue('garment_reality_invented_detail', 'error', `Outfit ${outfit.number} includes an invented or non-retail garment detail.`));
    }

    if (MULTI_COLOUR_GARMENT_PATTERN.test(fullText) && !STANDARD_TONAL_VARSITY_PATTERN.test(fullText)) {
      issues.push(issue('garment_reality_multi_colour', 'error', `Outfit ${outfit.number} includes a multi-colour or contrast-detail garment.`));
    }

    if (SHINY_FABRIC_PATTERN.test(fullText)) {
      issues.push(issue('shiny_fabric', 'error', `Outfit ${outfit.number} includes satin/silk/shiny fabric, which is banned.`));
    }

    if (BANNED_SHIRT_PATTERN.test(fullText)) {
      issues.push(issue('banned_collar', 'error', `Outfit ${outfit.number} includes a band/mandarin collar, which is banned.`));
    }

    if (BANNED_SNEAKER_PATTERN.test(fullText)) {
      issues.push(issue('banned_sneaker_colour', 'error', `Outfit ${outfit.number} includes a banned sneaker colour or logo sneaker.`));
    }

    if (countStatementFabricsOutsideFootwear(outfit) > 1) {
      issues.push(issue('too_many_statement_fabrics', 'error', `Outfit ${outfit.number} uses more than one statement fabric outside footwear.`));
    }

    if (looksLikeBasicCombo(outfit) && countVisibleElevationMoves(outfit) < 2) {
      issues.push(issue('basic_combo_ban', 'error', `Outfit ${outfit.number} matches a v6.1 Basic Combo Ban pattern without at least two visible elevation moves.`));
    }

    if (/relaxed\s+casual/i.test(outfit.context) && /\bblazer\b/.test(fullText)) {
      issues.push(issue('relaxed_blazer', 'error', `Outfit ${outfit.number} uses a blazer in Relaxed Casual.`));
    }

    if (climate.mode === 'hot' && (HOT_CLIMATE_RESTRICTED_PATTERN.test(fullText) || LEATHER_OUTERWEAR_PATTERN.test(fullText))) {
      issues.push(issue('hot_climate_fabric', 'error', `Outfit ${outfit.number} includes a hot-climate restricted garment or fabric.`));
    }

    if (climate.mode === 'monsoon' && (MONSOON_RESTRICTED_PATTERN.test(fullText) || LEATHER_OUTERWEAR_PATTERN.test(fullText))) {
      issues.push(issue('monsoon_weather_unsuitable', 'error', `Outfit ${outfit.number} includes suede, heavy winter fabric, or another monsoon-unsuitable material.`));
    }
  }

  for (const colour of findRepeatedDominantColours(outfits)) {
    issues.push(issue('repeated_colour', 'warning', `${colour} appears to dominate more than 3 outfits; check colour variety.`));
  }

  for (let index = 1; index < outfits.length; index += 1) {
    const previous = outfits[index - 1];
    const current = outfits[index];
    const previousTopFamily = getManOutfitPrimaryColourFamily(previous.fields.top);
    const currentTopFamily = getManOutfitPrimaryColourFamily(current.fields.top);
    if (previousTopFamily && previousTopFamily === currentTopFamily) {
      issues.push(issue(
        'consecutive_top_colour',
        'error',
        `Outfits ${previous.number} and ${current.number} repeat the ${currentTopFamily.replace(/^patterned-/, '')} top-colour family; adjacent looks must read visibly different.`,
      ));
    }

    if (!hasNoLayer(previous) && !hasNoLayer(current)) {
      const previousLayerFamily = getManOutfitPrimaryColourFamily(previous.fields.layer);
      const currentLayerFamily = getManOutfitPrimaryColourFamily(current.fields.layer);
      if (previousLayerFamily && previousLayerFamily === currentLayerFamily) {
        issues.push(issue(
          'consecutive_layer_colour',
          'error',
          `Outfits ${previous.number} and ${current.number} repeat the ${currentLayerFamily.replace(/^patterned-/, '')} visible layer colour family; change one for visual variety.`,
        ));
      }
    }
  }

  const elevatedPrimaryCount = countElevatedPrimaryColourOutfits(outfits);
  if (outfits.length === expectedTotal && elevatedPrimaryCount < 6) {
    issues.push(issue('elevated_primary_colour_quota', 'error', `Only ${elevatedPrimaryCount} outfits appear to use an elevated non-default colour as a primary top/layer; v6.1 requires at least 6.`));
  }

  if (options.enforceV2 && outfits.length === expectedTotal) {
    addV2PortfolioIssues(outfits, climate.mode, issues, options);
  }

  const quality = evaluatePortfolioQuality(outfits, issues);
  if (options.enforceV2 && !quality.passed) {
    issues.push(issue('quality_floor', 'error', quality.failedCriteria.join(' ')));
  }

  return {
    checkedAt: new Date().toISOString(),
    outfitCount: outfits.length,
    contextCounts,
    issues,
    quality,
  };
}

export function withManReportSection4Qa(reportData: ReportData): ReportData {
  return {
    ...reportData,
    qa: {
      ...reportData.qa,
      section4: validateManReportSection4(
        reportData.sections?.s4_outfits ?? '',
        reportData.classification,
        {
          enforceV2: reportData.outfit_library?.version === 'v2-9plus',
          patternWaiver: reportData.outfit_library?.selectionProfile?.patternWaiver,
          suitWaiver: reportData.outfit_library?.selectionProfile?.waivers?.includes('suits'),
          tieWaiver: reportData.outfit_library?.selectionProfile?.waivers?.includes('ties'),
        },
      ),
    },
  };
}

export function manReportOutfitQualityGatePassed(reportData: ReportData | null | undefined): boolean {
  if (reportData?.outfit_library?.version !== 'v2-9plus') return true;
  const section4 = reportData.qa?.section4;
  return Boolean(section4?.quality?.passed) && !(section4?.issues ?? []).some(item => item.severity === 'error');
}
