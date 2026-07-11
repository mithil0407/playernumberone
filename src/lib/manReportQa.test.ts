import type { ClassificationResult } from './manReportGenerator';
import { validateManReportSection4 } from './manReportQa';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classification = {
  client: { location_region: 'India — Tier 1 city', height_category: 'Average', primary_goal: 'Professional' },
  body: { silhouette_type: 'Rectangle', fat_storage_zone: '', highlight_zone: '', minimise_zone: '', fit_directive: 'Straight fits', height_adjustment: '', silhouette_rules: [], avoid_cuts: [] },
  face: { face_shape: 'Oval', feature_type: 'Balanced', hairstyle_recommendations: [], facial_hair_recommendations: '', eyewear_shapes: [] },
  colour: { season: 'Warm Autumn', undertone: 'Warm', skin_tone_depth: 'Medium', primary_palette: [], neutral_base_colours: [], accent_colours: [], colours_to_avoid: [], pattern_guidance: 'Use refined patterns', fabric_tone_guidance: '' },
  style_brief: { primary_brief: 'Old-money corporate with stronger evening outerwear', aesthetic_direction: '', tribes: ['Old Money'], register: '', expression: '', structure_level: '', anti_preferences: '', style_blocker: '', key_aspiration: '' },
  outfit_split: { total: 20, categories: [] },
} as ClassificationResult;

function block(number: number, context: string, overrides: Partial<Record<'top' | 'bottom' | 'layer' | 'footwear' | 'accessory', string>> = {}) {
  return `OUTFIT ${number} — ${context}
TOP: ${overrides.top ?? 'Warm ivory cotton poplin shirt — top button open'}
LAYER: ${overrides.layer ?? 'No layer'}
BOTTOM: ${overrides.bottom ?? 'Ink navy high-rise pleated tailored trousers — full clean fall'}
FOOTWEAR: ${overrides.footwear ?? 'Dark brown leather penny loafers'}
ACCESSORY: ${overrides.accessory ?? 'Dark brown belt matched to shoe — tortoise panto frames'}
OCCASION ANCHOR: This precise colour, proportion and fit combination supports the client’s frame, palette and stated occasion while remaining practical to buy and repeat.`;
}

function invalidPortfolio() {
  const outfits: string[] = [];
  for (let number = 1; number <= 20; number += 1) {
    const context = number <= 6 ? 'OFFICE / FORMAL' : number <= 10 ? 'SMART CASUAL' : number <= 15 ? 'EVENING WEAR' : 'RELAXED CASUAL';
    outfits.push(block(number, context, number <= 6 ? {
      top: 'Navy cotton polo — open collar',
      bottom: 'Stone cotton chinos — straight fit',
      footwear: 'White leather sneakers',
    } : {}));
  }
  return outfits.join('\n\n');
}

export function runManReportQaAssertions() {
  const qa = validateManReportSection4(invalidPortfolio(), classification, { enforceV2: true });
  const codes = new Set(qa.issues.map(item => item.code));
  invariant(codes.has('formal_context_purity'), 'rejects casual garments in strict Formal');
  invariant(codes.has('formal_suit_quota'), 'requires two matched suits');
  invariant(codes.has('formal_tie_quota'), 'requires at least three ties');
  invariant(codes.has('evening_statement_quota'), 'requires climate-aware evening statement outerwear');
  invariant(codes.has('relaxed_archetype_split'), 'requires relaxed 2/2/1 archetype coverage');
  invariant(codes.has('silhouette_global_cap'), 'rejects repeated silhouette families');
  invariant(codes.has('pattern_portfolio_quota'), 'requires 5-7 patterns');
  invariant(codes.has('quality_floor'), 'blocks portfolios below the 9/10 quality floor');
  invariant(qa.quality?.passed === false, 'stores a failed independent quality evaluation');

  const tonalVarsity = validateManReportSection4(block(1, 'EVENING WEAR', {
    layer: 'Ink navy tonal cotton-twill varsity jacket — plain body — tonal sleeves — no logos — worn open',
  }), classification);
  invariant(!tonalVarsity.issues.some(item => item.code === 'garment_reality_multi_colour'), 'allows the narrow tonal varsity construction exception');

  const loudVarsity = validateManReportSection4(block(1, 'EVENING WEAR', {
    layer: 'Blue-and-white colour-blocked varsity jacket with contrast panels and logo-heavy lettering',
  }), classification);
  invariant(loudVarsity.issues.some(item => item.code === 'garment_reality_multi_colour'), 'continues to reject loud colour-blocked varsity jackets');

  const silkFreeTie = validateManReportSection4(block(1, 'OFFICE / FORMAL', {
    accessory: 'Ink navy silk-free woven tie — dark brown leather belt',
  }), classification);
  invariant(!silkFreeTie.issues.some(item => item.code === 'shiny_fabric'), 'does not flag silk-free accessories as shiny fabric');

  const silkTie = validateManReportSection4(block(1, 'OFFICE / FORMAL', {
    accessory: 'Burgundy silk knit tie — dark brown leather belt',
  }), classification);
  invariant(silkTie.issues.some(item => item.code === 'shiny_fabric'), 'still rejects real silk garments');
}
