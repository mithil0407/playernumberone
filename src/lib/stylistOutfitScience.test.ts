import {
  TECHNIQUE_GRAMMAR,
  buildScienceHarnessSummaryForTest,
  deriveFunctionDemands,
  extractStylistClientState,
  generateOutfitCandidates,
  scoreColourPhysics,
  scoreOutfitCandidatesBlind,
  selectOutfitPortfolio,
  scienceOutfitsToBlueprintPages,
} from './stylistOutfitScience';
import {
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  type StylistBlueprintClassification,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator';
import type { ParsedStylistOutfit } from './stylistOutfitLibraryParser';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classification: StylistBlueprintClassification = {
  client: {
    name: 'Science Client',
    email: 'science@example.com',
    country: 'India',
    age_range: '35-44',
    language: 'English',
    lifestyle_summary: 'Founder meetings, dinners, and polished everyday dressing.',
  },
  body: {
    geometry: 'balanced shoulders and hips with soft midsection',
    focus_areas: ['midsection'],
    proportion_directive: 'Create length and avoid cling at the waist.',
    coverage_rules: ['no cleavage'],
    silhouette_rules: ['Use open vertical frames and non-cling fabrics.'],
  },
  colour: {
    undertone_direction: 'neutral warm',
    depth: 'deep',
    contrast: 'high',
    palette_name: 'deep clear warm-neutral',
    base_palette: [
      { name: 'Deep Teal', hex: '#184A59', usage: 'near-face hero' },
      { name: 'Ivory', hex: '#F5F0E8', usage: 'support' },
      { name: 'Olive', hex: '#5F6844', usage: 'main garment' },
      { name: 'Burgundy', hex: '#6E253B', usage: 'main garment' },
      { name: 'Chocolate', hex: '#4B2E24', usage: 'ground' },
    ],
    accent_palette: [
      { name: 'Gold', hex: '#B08D3F', usage: 'metal' },
      { name: 'Cognac', hex: '#9A5A2F', usage: 'leather' },
    ],
    palette: [],
    avoid_colours: [],
  },
  face_hair_accessories: {
    face_shape: 'oval',
    face_direction: 'soft structure',
    hair_direction: 'smooth waves',
    hair_colour_direction: 'espresso gloss',
    hair_colour_options: ['espresso gloss'],
    neckline_direction: 'open but modest',
    jewellery_direction: 'gold',
    eyewear_direction: 'soft rectangular',
    approved_necklines: ['soft V', 'boat neck'],
    hair_styles: ['smooth waves'],
    eyewear_shapes: ['soft rectangular'],
    earring_shapes: ['small hoops'],
  },
  makeup: {
    style: 'natural',
    everyday_direction: 'skin-first',
    steps: ['base'],
    colours: ['rose brown'],
  },
  taste: {
    style_archetype: 'polished creative director',
    moodboard: 'structured modern',
    signature_codes: ['tailoring', 'warm leather', 'scarves'],
    anti_codes: ['no sleeveless'],
    shopping_filters: ['structured fabric'],
  },
  fabrics: {
    approved: [{ name: 'crepe', reason: 'clean fall' }],
    avoid: [{ name: 'clingy jersey', reason: 'too clingy' }],
  },
};

const submission: StylistIntakeSubmission = {
  id: 'science-submission',
  country: 'India',
  full_name: 'Science Client',
  customer_email: 'science@example.com',
  raw_consultation_notes: 'No sleeveless. Wants polished creative director energy.',
  one_outfit_description: 'Currently wears simple black tops and trousers.',
};

function report(): StylistBlueprintReportData {
  return {
    version: STYLIST_BLUEPRINT_VERSION,
    generated_at: '2026-07-08T00:00:00.000Z',
    client: { display_name: 'Science Client', email: 'science@example.com', month_year: 'July 2026' },
    analysis: {
      silhouette_profile: 'soft midsection',
      chromatic_family: 'deep neutral warm',
      facial_architecture: 'oval',
      style_direction: 'polished creative director',
      proportional_focus: ['length', 'midsection ease'],
      evidence_notes: ['test'],
      confidence: { body: 'medium', colour: 'medium', face: 'medium' },
    },
    classification,
    pages: [],
  };
}

const library: ParsedStylistOutfit[] = [
  {
    id: 'women-01',
    title: 'Blazer Column',
    source: 'women',
    capsule: 'Professional',
    fields: [],
    normalised_slots: [
      { slot: 'Top', piece: 'crepe shell top with sleeves', source_label: 'Top', role: 'base' },
      { slot: 'Bottom', piece: 'full-length wide-leg trousers', source_label: 'Bottom', role: 'base' },
      { slot: 'Outerwear', piece: 'open single-breasted blazer', source_label: 'Outerwear', role: 'structure' },
      { slot: 'Footwear', piece: 'pointed leather flats', source_label: 'Footwear', role: 'finish' },
      { slot: 'Bag', piece: 'structured leather tote', source_label: 'Bag', role: 'finish' },
      { slot: 'Jewellery', piece: 'small gold hoops', source_label: 'Jewellery', role: 'finish' },
    ],
    completeness_score: 6,
    signature: 'blazer-column',
    notes: [],
  },
  {
    id: 'women-02',
    title: 'Sleeveless Risk',
    source: 'women',
    capsule: 'Professional',
    fields: [],
    normalised_slots: [
      { slot: 'Top', piece: 'sleeveless satin top', source_label: 'Top', role: 'base' },
      { slot: 'Bottom', piece: 'tailored trousers', source_label: 'Bottom', role: 'base' },
      { slot: 'Footwear', piece: 'pointed flats', source_label: 'Footwear', role: 'finish' },
      { slot: 'Bag', piece: 'structured bag', source_label: 'Bag', role: 'finish' },
      { slot: 'Jewellery', piece: 'small hoops', source_label: 'Jewellery', role: 'finish' },
    ],
    completeness_score: 5,
    signature: 'sleeveless-risk',
    notes: [],
  },
];

export function runStylistOutfitScienceAssertions() {
  const reportData = report();
  const clientState = extractStylistClientState(submission, reportData);
  invariant(clientState.geometry.zone_map.midsection === 'camouflage', 'client state marks midsection as camouflage');
  invariant(clientState.vetoes.hard.includes('sleeveless'), 'client state extracts no sleeveless hard veto');

  const demands = deriveFunctionDemands(clientState);
  invariant(demands.length === getStylistBlueprintOutfitCount(reportData), 'function demand count matches outfit count');
  invariant(demands.some(demand => demand.functions.some(item => item.function === 'DIFFUSE' && item.zone === 'midsection')), 'midsection camouflage derives DIFFUSE demand');

  const nearFaceScore = scoreColourPhysics(clientState.colour, { name: 'Deep Teal', hex: '#184A59' }, 'near_face');
  const awayScore = scoreColourPhysics(clientState.colour, { name: 'Deep Teal', hex: '#184A59' }, 'away_from_face');
  invariant(nearFaceScore !== awayScore, 'near-face colour weighting differs from away-from-face weighting');

  const candidates = generateOutfitCandidates(clientState, demands, library);
  invariant(candidates.length > getStylistBlueprintOutfitCount(reportData), 'science engine over-generates candidates');
  invariant(!candidates.some(candidate => candidate.library_signature === 'sleeveless-risk'), 'hard veto prunes sleeveless library anchor before scoring');

  const tuckTechnique = TECHNIQUE_GRAMMAR.find(technique => technique.id === 'full-tuck-with-absorbing-layer');
  invariant(Boolean(tuckTechnique?.enablers.some(enabler => /layer|contrast|front/i.test(enabler))), 'full tuck technique has rescue enablers');
  invariant(Boolean(tuckTechnique?.contraindications.some(item => /clingy/i.test(item))), 'full tuck technique has hard contraindication');

  const scored = scoreOutfitCandidatesBlind(clientState, candidates);
  invariant(scored.every(candidate => candidate.score.candidate_id === candidate.id), 'blind scoring attaches score by candidate id');
  const selected = selectOutfitPortfolio(scored, { count: getStylistBlueprintOutfitCount(reportData) });
  invariant(selected.length === getStylistBlueprintOutfitCount(reportData), 'portfolio selection returns requested outfit count');

  const pages = scienceOutfitsToBlueprintPages(selected, reportData);
  invariant(pages.length === getStylistBlueprintOutfitCount(reportData) + 2, 'science projection returns transformation, outfit system, and outfit pages');
  invariant(pages[2].page_number === getStylistBlueprintOutfitStartPage(reportData), 'first science outfit lands on the existing outfit start page');
  invariant(pages[2].blocks.some(block => block.label === 'Score summary'), 'projected page includes score summary block');

  const fullSummary = buildScienceHarnessSummaryForTest(reportData, submission);
  invariant(fullSummary.selectedCount === getStylistBlueprintOutfitCount(reportData), 'full science summary selects full report count');
}
