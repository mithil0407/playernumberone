import test from 'node:test';
import {
  TECHNIQUE_GRAMMAR,
  buildScienceHarnessSummaryForTest,
  deriveFunctionDemands,
  extractStylistClientState,
  generateOutfitCandidates,
  colourForSlotForTest,
  pieceWithColourForTest,
  scoreBandForTest,
  scoreColourPhysics,
  shortGarmentForTest,
  outfitProseBlocks,
  scoreOutfitCandidatesBlind,
  selectOutfitPortfolio,
  scienceOutfitsToBlueprintPages,
} from './stylistOutfitScience.ts';
import {
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  type StylistBlueprintClassification,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator.ts';
import type { ParsedStylistOutfit } from './stylistOutfitLibraryParser.ts';

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
  // The internal blind score is stylist metadata and lives on outfit_engine.
  // It must not be a block in the client's report copy.
  invariant(!pages[2].blocks.some(block => block.label === 'Score summary'), 'score summary must not reach client copy');
  const outfitCopy = JSON.stringify(pages[2].blocks);
  invariant(!/FRAME_FACE|ELONGATE|DEFINE_WAIST|CONTEXT_FIT|Demand /.test(outfitCopy), 'engine function codes leaked into client copy');
  invariant(!/\b\d\/10\b/.test(outfitCopy), 'an internal score leaked into client copy');

  // scoreColourPhysics returns 0-10, not 0-1. COLOUR_KEEP_THRESHOLD was written
  // as 0.45 against that scale, so nothing ever fell below it, the palette snap
  // never ran, and every library colour passed through untouched. Nothing in
  // the RGB space scores below ~2.3, so a fractional threshold is always true.
  let lowestPhysicsScore = Number.POSITIVE_INFINITY;
  for (let r = 0; r < 256; r += 51) {
    for (let g = 0; g < 256; g += 51) {
      for (let b = 0; b < 256; b += 51) {
        const hex = `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`;
        for (const zone of ['near_face', 'away_from_face'] as const) {
          lowestPhysicsScore = Math.min(lowestPhysicsScore, scoreColourPhysics(clientState.colour, { name: 'probe', hex }, zone));
        }
      }
    }
  }
  invariant(lowestPhysicsScore > 1, 'scoreColourPhysics is on a 0-10 scale, so a 0-1 threshold would never fire');

  // Chroma is a band, not a slope. `1 - value` scored a colourless garment as
  // perfectly muted, so optic white took a full mark on this axis and
  // terracotta — a muted colour she asked for by name — took zero.
  invariant(scoreBandForTest('muted', 0) < scoreBandForTest('muted', 0.35), 'a colourless garment must not be the most muted colour there is');
  invariant(scoreBandForTest('muted', 0.35) > scoreBandForTest('muted', 1), 'a mid-chroma colour must beat a fully saturated one on a muted palette');
  invariant(scoreBandForTest('clear', 1) < scoreBandForTest('clear', 0.85), 'clear chroma is a band, not a slope');

  const fullSummary = buildScienceHarnessSummaryForTest(reportData, submission);
  invariant(fullSummary.selectedCount === getStylistBlueprintOutfitCount(reportData), 'full science summary selects full report count');

  // "The Black pointed heels on a finishes it." — a trim that stopped on a
  // preposition, then had a verb appended. The library phrases footwear this
  // way whenever the client states a heel height, so this is the common case.
  // The stated white-dulling guard. Her intake answers what white clothing does
  // to her face; "makes me dull" must keep ivory off every near-face slot, and
  // the replacement must not be another off-white — the palette carries one.
  const dullsSubmission: StylistIntakeSubmission = {
    ...submission,
    skin_tone_self_description: 'Natural tint: Yellowish\nWhite clothing effect: Makes me dull',
  };
  const dullsState = extractStylistClientState(dullsSubmission, reportData);
  invariant(dullsState.preferences.avoid_light_near_face, 'a stated white-dulling answer must reach the client state');
  invariant(!clientState.preferences.avoid_light_near_face, 'a submission that says nothing about white must not set the flag');

  const ivoryLibrary: ParsedStylistOutfit[] = [{
    ...library[0],
    id: 'women-ivory',
    signature: 'ivory-blouse',
    normalised_slots: [
      { slot: 'Top', piece: 'Ivory silk blouse with a closed neck and full sleeves', source_label: 'Top', role: 'base' },
      { slot: 'Bottom', piece: 'charcoal tailored straight trousers', source_label: 'Bottom', role: 'base' },
      { slot: 'Footwear', piece: 'chocolate leather court shoes', source_label: 'Footwear', role: 'finish' },
      { slot: 'Bag', piece: 'structured leather tote', source_label: 'Bag', role: 'finish' },
    ],
  }];
  const nearFaceRe = /top|dress|layer|outerwear|jewel|scarf|neck|blouse/i;
  const readsWhite = (hex: string) => {
    const value = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    const max = Math.max(r, g, b);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 >= 0.8 && (max === 0 ? 0 : (max - Math.min(r, g, b)) / max) <= 0.35;
  };
  const guarded = generateOutfitCandidates(dullsState, deriveFunctionDemands(dullsState), ivoryLibrary);
  invariant(guarded.length > 0, 'guard test generated no candidates to inspect');
  for (const candidate of guarded) {
    for (const item of candidate.formula_items.filter(entry => nearFaceRe.test(entry.slot))) {
      invariant(!readsWhite(item.colour_hex), `an off-white reached a near-face slot: ${item.slot} ${item.colour_name}`);
      invariant(!/\bivory\b/i.test(item.piece), `the piece text still names ivory while its swatch moved: "${item.piece}"`);
    }
  }

  // Metals are materials, not colours: correcting them produced "Saffron temple
  // jhumkas" next to "gold cuff" in the same line. Scored against a palette
  // holding no metal, gold falls under the keep threshold and would be moved.
  const metalHostile = {
    ...dullsState,
    colour: {
      ...dullsState.colour,
      undertone: 'olive' as const,
      value_depth: 'deep' as const,
      contrast: 'high' as const,
      chroma: 'muted' as const,
      base_palette: [{ name: 'Deep Teal', hex: '#184A59' }],
      accent_palette: [{ name: 'Deep Teal', hex: '#184A59' }],
    },
  };
  const metalSlot = { slot: 'Accessories', piece: 'Gold temple jhumkas, gold cuff', source_label: 'Accessories', role: 'finish' as const };
  const metalResolved = colourForSlotForTest(metalSlot, metalHostile, 0, 'accent');
  invariant(metalResolved.name === 'Gold', `a metal was recoloured as a fabric shade: ${metalResolved.name}`);
  invariant(metalResolved.piece === metalSlot.piece, `a metal's description was rewritten: "${metalResolved.piece}"`);

  // "Burnt Sienna Burnt Sienna tussar silk saree" — a palette name whose words
  // are both absent from the colour lexicon was prepended to a description that
  // already opened with it. The fixture palette alone cannot catch this, so the
  // adversarial names are named here explicitly.
  const twoWordColours = ['Burnt Sienna', 'Mushroom Taupe', 'Antique Cream', 'Rich Indigo', 'Espresso Olive'];
  for (const name of twoWordColours) {
    const described = pieceWithColourForTest(`${name} tussar silk saree`, name);
    invariant(
      !described.toLowerCase().startsWith(`${name.toLowerCase()} ${name.toLowerCase()}`),
      `a palette name was prepended to a description that already opened with it: "${described}"`,
    );
  }
  // The prefix must still be added when the description genuinely names no colour.
  invariant(
    pieceWithColourForTest('tussar silk saree', 'Burnt Sienna').startsWith('Burnt Sienna tussar'),
    'a description naming no colour must still be given one',
  );

  const trimmed = [
    'Black pointed heels on a 1.2-2 inch heel',
    'Nude 1.2-2 inch block-heel court shoes',
    'Gold studs, slim watch.',
    'Mocha satin-silk saree with a plain body and no border.',
    'light-wash denim jacket worn as a layer',
  ].map(shortGarmentForTest);
  for (const name of trimmed) {
    invariant(!/\s(?:on|in|at|of|to|for|and|or|with|over|under|a|an|the)$/i.test(name), `garment name ends on a dangling word: "${name}"`);
  }
  invariant(trimmed[0] === 'Black pointed heels', `heel phrasing must not leak into the garment name: "${trimmed[0]}"`);
  invariant(trimmed[1].endsWith('shoes'), `garment name must keep its head noun: "${trimmed[1]}"`);
  invariant(trimmed[2] === 'Gold studs', `a comma list must trim to the first piece: "${trimmed[2]}"`);
}

function runOutfitProseAssertions() {
  const items = [
    { slot: 'Top', piece: 'Ivory silk shirt with a relaxed placket', colour_name: 'Ivory', colour_hex: '#F2ECE1', palette_role: 'lead' as const, structural_notes: '' },
    { slot: 'Bottom', piece: 'Charcoal wide-leg trousers', colour_name: 'Charcoal', colour_hex: '#3A3A3C', palette_role: 'ground' as const, structural_notes: '' },
    { slot: 'Footwear', piece: 'Tan leather loafers', colour_name: 'Tan', colour_hex: '#A9784E', palette_role: 'support' as const, structural_notes: '' },
    { slot: 'Bag', piece: 'Cognac structured tote', colour_name: 'Cognac', colour_hex: '#8C4A22', palette_role: 'accent' as const, structural_notes: '' },
  ];
  const copy = { why: 'This outfit lengthens your line.', styling: 'How to wear it: tuck the shirt at the front only.' };
  const blocks = outfitProseBlocks(items, copy);

  const formula = blocks.find(block => block.label === 'Formula');
  invariant(formula?.items === items, 'the formula block must carry the pieces it was given');

  // The renderer prints `reason` as a pull quote above `body`, so identical
  // text there prints the same sentence twice on the page.
  const why = blocks.find(block => block.label === 'Why it works');
  invariant(Boolean(why?.reason) && Boolean(why?.body) && why!.reason !== why!.body, 'the why block must not print the same sentence twice');

  // The reason this prose is derived rather than stored: change the lead piece
  // and no block may still be describing the garment that used to be there.
  const swapped = outfitProseBlocks(
    items.map((item, index) => index === 0 ? { ...item, piece: 'Olive linen kurta with a straight hem' } : item),
    copy,
  );
  const prose = swapped
    .filter(block => block.label !== 'Formula' && block.label !== 'Why it works')
    .map(block => `${block.body ?? ''} ${block.reason ?? ''}`)
    .join(' ');
  invariant(!/silk shirt/i.test(prose), `prose still names a garment the outfit no longer has: "${prose}"`);
  invariant(/olive linen kurta/i.test(prose), `prose does not name the new lead garment: "${prose}"`);

  // When the LEAD piece is the bottom, the breakdown still has a second
  // garment to name — it used to match the bottom again and drop the sentence.
  const bottomLed = outfitProseBlocks(
    items.map(item => ({ ...item, palette_role: item.slot === 'Bottom' ? 'lead' as const : item.slot === 'Top' ? 'support' as const : item.palette_role })),
    copy,
  ).find(block => block.label === 'Role breakdown')?.body ?? '';
  invariant(/wide-leg trousers lead/i.test(bottomLed), `a bottom-led outfit lost its lead sentence: "${bottomLed}"`);
  invariant(/silk shirt/i.test(bottomLed), `a bottom-led outfit never names its other garment: "${bottomLed}"`);

  // "what the trousers is doing here" — plural garments need a plural verb.
  const dontBuy = outfitProseBlocks(
    items.map(item => ({ ...item, palette_role: item.slot === 'Bottom' ? 'lead' as const : 'support' as const })),
    copy,
  ).find(block => block.label === 'Do not buy')?.body ?? '';
  invariant(!/\btrousers is\b/i.test(dontBuy), `plural garment given a singular verb: "${dontBuy}"`);

  // A one-piece look makes hero, anchor and finish collapse onto one item; the
  // breakdown must name it once rather than printing the saree three times.
  const onePiece = [
    { slot: 'Saree', piece: 'Mocha satin-silk saree', colour_name: 'Mocha', colour_hex: '#6B4A38', palette_role: 'lead' as const, structural_notes: '' },
    { slot: 'Footwear', piece: 'Nude block-heel sandals', colour_name: 'Nude', colour_hex: '#D8BBA4', palette_role: 'support' as const, structural_notes: '' },
    { slot: 'Jewellery', piece: 'Gold studs', colour_name: 'Gold', colour_hex: '#C9A227', palette_role: 'accent' as const, structural_notes: '' },
  ];
  const breakdown = outfitProseBlocks(onePiece, copy).find(block => block.label === 'Role breakdown')?.body ?? '';
  invariant((breakdown.match(/saree/gi) ?? []).length <= 1, `the role breakdown repeats a garment: "${breakdown}"`);
}

test('outfit page prose is derived from the pieces on the page', () => {
  runOutfitProseAssertions();
});

test('outfit science invariants hold', () => {
  runStylistOutfitScienceAssertions();
});
