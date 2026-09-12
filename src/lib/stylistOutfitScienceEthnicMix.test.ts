import assert from 'node:assert/strict';
import test from 'node:test';
import { selectOutfitPortfolio, type ScoredCandidateOutfit } from './stylistOutfitScience.ts';
import { bannedPieceTerms, violatesBannedPieces } from './stylistIntakePreferences.ts';

const CAPSULES = ['Professional', 'Social', 'Everyday', 'Occasion'] as const;

/**
 * Ethnic anchors are shared across capsules in the real library, so every
 * ethnic candidate here deliberately reuses one of two signatures. That is what
 * starved the Occasion capsule: it is selected last, and the signature dedup had
 * already consumed every ethnic anchor by the time it ran.
 */
function candidate(capsule: string, index: number, isEthnic: boolean): ScoredCandidateOutfit {
  return {
    id: `${capsule}-${index}-${isEthnic ? 'ethnic' : 'western'}`,
    demand_id: `${capsule}-demand`,
    capsule: capsule as ScoredCandidateOutfit['capsule'],
    is_ethnic: isEthnic,
    library_signature: isEthnic ? `ethnic-${capsule}-${index}` : `western-${capsule}-${index}`,
    formula_items: [
      { slot: 'Top', piece: isEthnic ? 'Indigo kurta' : 'Ivory shirt', colour_name: 'Ivory', colour_hex: '#F4EFE5', palette_role: 'lead', structural_notes: '' },
    ],
    techniques: [],
    attention_map: { first_fixation: 'face', second_fixation: 'waist', risk_zones: [] },
    colour_scores: [],
    veto_checks: [],
    sourcing_assumptions: [],
    generation_reasoning: '',
    score: { iconik: 5, realism: 5, relevance: 5, diversity: 5, killed: false, verdict: 'PASS', notes: [] },
  } as unknown as ScoredCandidateOutfit;
}

const pool = CAPSULES.flatMap(capsule => [
  ...Array.from({ length: 5 }, (_, index) => candidate(capsule, index, true)),
  ...Array.from({ length: 5 }, (_, index) => candidate(capsule, index + 10, false)),
]);

test('a stated ethnic target is met, and every capsule gets its share', () => {
  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5, ethnicTarget: 12 });
  assert.equal(selection.length, 20);
  assert.equal(selection.filter(item => item.is_ethnic).length, 12);

  const byCapsule = Object.fromEntries(CAPSULES.map(capsule => [
    capsule,
    selection.filter(item => item.capsule === capsule && item.is_ethnic).length,
  ]));
  assert.deepEqual(byCapsule, { Occasion: 4, Social: 3, Everyday: 3, Professional: 2 });
});

test('Occasion is not starved when ethnic anchors are shared across capsules', () => {
  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5, ethnicTarget: 12 });
  const occasionEthnic = selection.filter(item => item.capsule === 'Occasion' && item.is_ethnic).length;
  assert.ok(occasionEthnic > 0, 'Occasion had zero ethnic looks — the capsule where ethnic matters most');
});

test('no ethnic target leaves the portfolio unchanged in size', () => {
  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5, ethnicTarget: 0 });
  assert.equal(selection.length, 20);
});

test('rejecting palazzos catches every wide-leg variant, not just the exact phrase', () => {
  const banned = bannedPieceTerms({ avoided: ['loose plazzos'] });
  const shapes = [
    'Navy wide-leg trousers',
    'Ivory wide-leg linen pants',
    'Black wide-legged trouser',
    'Teal wide-leg culottes',
    'Cream wide leg jeans',
    'Stone palazzo pants',
  ];
  for (const shape of shapes) {
    assert.ok(violatesBannedPieces(shape, banned).length > 0, `"${shape}" slipped through the ban`);
  }
  // Straight and tapered legs are a different silhouette and stay allowed.
  for (const allowed of ['Navy straight-leg trousers', 'Black tapered cigarette trouser']) {
    assert.equal(violatesBannedPieces(allowed, banned).length, 0, `"${allowed}" was banned by mistake`);
  }
});

test('garments the client names by name are preferred over merely commoner ones', async () => {
  const { preferredEthnicGarments, matchesPreferredGarment } = await import('./stylistIntakePreferences.ts');
  const named = preferredEthnicGarments({ loved: ['sarees', 'indian', 'more of workwear'] });
  assert.ok(named.includes('saree'), `expected saree to be picked up, got ${named.join(', ')}`);
  assert.ok(matchesPreferredGarment('Ivory handloom cotton saree with a charcoal border', named));
  assert.equal(matchesPreferredGarment('Ivory straight-cut cotton kurta', named), false);
});

test('naming nothing leaves every ethnic garment equally eligible', async () => {
  const { preferredEthnicGarments, matchesPreferredGarment } = await import('./stylistIntakePreferences.ts');
  const named = preferredEthnicGarments({ loved: ['workwear'] });
  assert.deepEqual(named, []);
  assert.equal(matchesPreferredGarment('Ruby banarasi silk saree', named), false, 'no preference means no boost');
});

test('portfolio diversity counts colour families, not just colour names', async () => {
  const { colourFamilyOfHex } = await import('./stylistColourMatching.ts');
  // Ivory and Champagne are different names but the same neutral family. The old
  // single-tier penalty treated them as two distinct choices, so a report could
  // lead on near-identical neutrals repeatedly and still look "diverse".
  assert.equal(colourFamilyOfHex('#F5F0E8'), colourFamilyOfHex('#E8D9BE'));

  const make = (id: string, capsule: string, colour: { name: string; hex: string }): ScoredCandidateOutfit => ({
    id, demand_id: `${capsule}-d`, capsule: capsule as ScoredCandidateOutfit['capsule'], is_ethnic: false,
    library_signature: `sig-${id}`,
    formula_items: [{ slot: 'Top', piece: `${colour.name} top`, colour_name: colour.name, colour_hex: colour.hex, palette_role: 'lead', structural_notes: '' }],
    techniques: [], attention_map: { first_fixation: 'face', second_fixation: 'waist', risk_zones: [] },
    colour_scores: [], veto_checks: [], sourcing_assumptions: [], generation_reasoning: '',
    score: { iconik: 5, realism: 5, relevance: 5, diversity: 5, killed: false, verdict: 'PASS', notes: [] },
  } as unknown as ScoredCandidateOutfit);

  const neutrals = [
    { name: 'Ivory', hex: '#F5F0E8' }, { name: 'Champagne', hex: '#E8D9BE' },
    { name: 'Cream', hex: '#F3EADA' }, { name: 'Bone', hex: '#EDE5D2' },
    { name: 'Stone', hex: '#D4C9B6' },
  ];
  const colours = [
    { name: 'Emerald', hex: '#1F5B4D' }, { name: 'Burgundy', hex: '#5C1F2A' },
    { name: 'Cobalt', hex: '#1F4FA8' }, { name: 'Rust', hex: '#A6522C' },
    { name: 'Plum', hex: '#5A2E4A' },
  ];
  const pool = ['Professional', 'Social', 'Everyday', 'Occasion'].flatMap(capsule => [
    ...neutrals.map((c, i) => make(`${capsule}-n${i}`, capsule, c)),
    ...colours.map((c, i) => make(`${capsule}-c${i}`, capsule, c)),
  ]);

  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5 });
  const families = selection.map(item => colourFamilyOfHex(item.formula_items[0].colour_hex!));
  const neutralLeads = families.filter(f => f === 'neutral').length;
  assert.ok(neutralLeads < 20, 'every outfit led on a neutral — the family penalty is not working');
  assert.ok(new Set(families).size >= 3, `only ${new Set(families).size} colour families across twenty outfits`);
});

test('an outfit can serve two capsules but never appears twice in one report', async () => {
  const { outfitCapsules } = await import('./stylistOutfitLibraryParser.ts');
  const shared = (id: string, capsule: string): ScoredCandidateOutfit => ({
    id, demand_id: `${capsule}-d`, capsule: capsule as ScoredCandidateOutfit['capsule'], is_ethnic: false,
    // The same underlying look, reachable from more than one capsule.
    library_signature: 'shared-blazer-over-jeans',
    formula_items: [{ slot: 'Top', piece: 'Navy tee', colour_name: 'Navy', colour_hex: '#1F2A44', palette_role: 'lead', structural_notes: '' }],
    techniques: [], attention_map: { first_fixation: 'face', second_fixation: 'waist', risk_zones: [] },
    colour_scores: [], veto_checks: [], sourcing_assumptions: [], generation_reasoning: '',
    score: { iconik: 9, realism: 9, relevance: 9, diversity: 9, killed: false, verdict: 'PASS', notes: [] },
  } as unknown as ScoredCandidateOutfit);
  const filler = (id: string, capsule: string, sig: string): ScoredCandidateOutfit =>
    ({ ...shared(id, capsule), library_signature: sig } as unknown as ScoredCandidateOutfit);

  const pool = [
    // The shared look is the top-scoring option in both capsules.
    shared('pro-shared', 'Professional'),
    shared('eve-shared', 'Everyday'),
    ...['Professional', 'Social', 'Everyday', 'Occasion'].flatMap(capsule =>
      Array.from({ length: 6 }, (_, i) => filler(`${capsule}-${i}`, capsule, `${capsule}-sig-${i}`))),
  ];

  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5 });
  const signatures = selection.map(item => item.library_signature).filter(Boolean);
  assert.equal(signatures.length - new Set(signatures).size, 0, 'the same look was shown twice in one report');
  assert.equal(
    selection.filter(item => item.library_signature === 'shared-blazer-over-jeans').length,
    1,
    'a look eligible for two capsules should still be used once',
  );

  // Eligibility itself is multi-valued.
  assert.deepEqual(outfitCapsules({ capsule: 'Everyday' } as never), ['Everyday']);
  assert.deepEqual(outfitCapsules({ capsule: 'Professional', capsules: ['Professional', 'Everyday'] } as never), ['Professional', 'Everyday']);
});

test('a shared anchor reduces the ethnic count rather than repeating a look', () => {
  const make = (id: string, capsule: string, isEthnic: boolean, sig: string): ScoredCandidateOutfit => ({
    id, demand_id: `${capsule}-d`, capsule: capsule as ScoredCandidateOutfit['capsule'], is_ethnic: isEthnic,
    library_signature: sig,
    formula_items: [{ slot: 'Top', piece: isEthnic ? 'Indigo kurta' : 'Ivory shirt', colour_name: 'Ivory', colour_hex: '#F4EFE5', palette_role: 'lead', structural_notes: '' }],
    techniques: [], attention_map: { first_fixation: 'face', second_fixation: 'waist', risk_zones: [] },
    colour_scores: [], veto_checks: [], sourcing_assumptions: [], generation_reasoning: '',
    score: { iconik: 5, realism: 5, relevance: 5, diversity: 5, killed: false, verdict: 'PASS', notes: [] },
  } as unknown as ScoredCandidateOutfit);

  // Only two distinct ethnic looks exist, shared across all four capsules.
  const pool = ['Professional', 'Social', 'Everyday', 'Occasion'].flatMap(capsule => [
    ...Array.from({ length: 5 }, (_, i) => make(`${capsule}-e${i}`, capsule, true, `shared-ethnic-${i % 2}`)),
    ...Array.from({ length: 5 }, (_, i) => make(`${capsule}-w${i}`, capsule, false, `western-${capsule}-${i}`)),
  ]);

  const selection = selectOutfitPortfolio(pool, { count: 20, perCapsule: 5, ethnicTarget: 12 });
  const signatures = selection.map(item => item.library_signature).filter(Boolean);
  assert.equal(signatures.length - new Set(signatures).size, 0, 'a look was repeated to hit the ethnic quota');
  assert.equal(selection.filter(item => item.is_ethnic).length, 2, 'only the two distinct ethnic looks should be used');
  assert.equal(selection.length, 20, 'the report is still filled out');
});

/** The smallest client the outfit engine will generate candidates for. */
async function testClientState() {
  const { extractStylistClientState } = await import('./stylistOutfitScience.ts');
  return extractStylistClientState(
    { id: 'c', customer_email: 'c@example.com', piece_preferences: {}, focus_areas: [], photo_urls: {} } as never,
    {
      client: { display_name: 'Test Client', email: 'c@example.com', month_year: 'September 2026' },
      analysis: { silhouette_profile: 'balanced', chromatic_family: 'neutral', facial_architecture: 'oval', style_direction: 'Structured', proportional_focus: [], evidence_notes: [], confidence: { body: 'medium', colour: 'medium', face: 'medium' } },
      classification: {
      body: { geometry: 'balanced', proportion_directive: 'Lengthen the line.', coverage_rules: [], focus_areas: [], silhouette_rules: [] },
      colour: { base_palette: [{ name: 'Ivory', hex: '#F5F0E8', usage: '' }], accent_palette: [{ name: 'Rust', hex: '#A6522C', usage: '' }], palette: [], undertone_direction: 'neutral', depth: 'medium', contrast: 'medium', palette_name: 'x', avoid_colours: [] },
      taste: { style_archetype: 'Structured', anti_codes: [], moodboard: '', signature_codes: [], shopping_filters: [] },
      face_hair_accessories: { approved_necklines: [], face_shape: 'oval' },
      client: {}, makeup: {}, fabrics: { approved: [], avoid: [] },
    } } as never,
  );
}

test('every outfit has enough pieces for the report to render it', async () => {
  const { generateOutfitCandidates, deriveFunctionDemands } = await import('./stylistOutfitScience.ts');
  // A one-piece look satisfies both the top and the bottom check, so a dress
  // plus shoes plus a bag came to three items and the report refused to render
  // the page: "Outfit page 51 needs enough formula items to render".
  const clientState = await testClientState();

  const onePieceAnchor = {
    id: 'one-piece', title: 'Dress look', source: 'pinterest' as const, capsule: 'Social' as const,
    fields: [], signature: 'one-piece-sig', completeness_score: 5, notes: [],
    normalised_slots: [
      { slot: 'Dress', piece: 'Cream polka-dot midi dress', source_label: 'Dress', role: 'base' as const },
      { slot: 'Footwear', piece: 'black low-heel slingbacks', source_label: 'Footwear', role: 'finish' as const },
      { slot: 'Accessories', piece: 'small black bag', source_label: 'Accessories', role: 'finish' as const },
    ],
  };

  const demands = deriveFunctionDemands(clientState);
  const candidates = generateOutfitCandidates(clientState, demands, [onePieceAnchor as never]);
  assert.ok(candidates.length > 0, 'the one-piece anchor should still produce candidates');
  for (const candidate of candidates) {
    assert.ok(candidate.formula_items.length >= 4, `an outfit came back with ${candidate.formula_items.length} pieces`);
    // And the top-up must not put a shirt under a dress.
    const hasDress = candidate.formula_items.some(item => /dress/i.test(item.slot));
    const addedTop = candidate.formula_items.some(item => /^top$/i.test(item.slot) && /blouse|shirt/i.test(item.piece) && !/saree|sari\b/i.test(JSON.stringify(candidate.formula_items)));
    assert.ok(!(hasDress && addedTop), 'a shirt was added underneath a dress');
  }
});

test('a one-piece is never given a separate bottom, whatever slot it sits in', async () => {
  const { generateOutfitCandidates, deriveFunctionDemands } = await import('./stylistOutfitScience.ts');
  const clientState = await testClientState();

  // Board look 68 as the library used to hand it over: the pin wrote "-" for the
  // bottom, so the jumpsuit stayed in a slot labelled Top. The bottom check read
  // slot labels only, saw no bottom, and printed "Antique Cream full-length
  // tailored wide-leg trousers" underneath a jumpsuit.
  const jumpsuitInTopSlot = {
    id: 'jumpsuit-in-top', title: 'Jumpsuit look', source: 'pinterest' as const, capsule: 'Everyday' as const,
    fields: [], signature: 'jumpsuit-sig', completeness_score: 5, notes: [],
    normalised_slots: [
      { slot: 'Top', piece: 'Mint-green wide-leg jumpsuit with a V-neck', source_label: 'Top', role: 'base' as const },
      { slot: 'Outerwear', piece: 'white tropical-print short-sleeve shirt worn open over it', source_label: 'Outerwear', role: 'structure' as const },
      { slot: 'Footwear', piece: 'nude heeled sandals', source_label: 'Footwear', role: 'finish' as const },
      { slot: 'Accessories', piece: 'straw half-moon bag', source_label: 'Accessories', role: 'finish' as const },
    ],
  };

  const candidates = generateOutfitCandidates(clientState, deriveFunctionDemands(clientState), [jumpsuitInTopSlot as never]);
  assert.ok(candidates.length > 0, 'the jumpsuit anchor should still produce candidates');
  for (const candidate of candidates) {
    const wearsJumpsuit = candidate.formula_items.some(item => /jumpsuit/i.test(item.piece));
    if (!wearsJumpsuit) continue;
    const bottom = candidate.formula_items.find(item => /trouser|pant|jean|skirt|palazzo|legging/i.test(item.piece));
    assert.ok(!bottom, `a ${bottom?.piece ?? ''} was added under a jumpsuit`);
    assert.ok(candidate.formula_items.length >= 4, 'the page still has enough pieces to render');
  }
});
