import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerbatimClientRules,
  classifyTuck,
  clientRuleWarningsForPage,
  evaluateVerbatimLook,
  flatVersionOfShoe,
  generatePinterestVerbatimApplication,
  getAllVerbatimLooks,
  getVerbatimLooks,
  parseVerbatimLooks,
  rankVerbatimLooks,
  setOutfitLibraryCuration,
  type VerbatimLook,
} from './stylistPinterestOutfits.ts';
import type { StylistBlueprintReportData, StylistIntakeSubmission } from './stylistBlueprintGenerator.ts';

// The fit/ranking cases use an explicitly approved library fixture. Production
// starts with no eligible looks until the curator's saved choices are loaded.
test.beforeEach(() => setOutfitLibraryCuration({ verdicts: new Map(getAllVerbatimLooks().map(look => [look.id, 'like'])) }));
test.afterEach(() => setOutfitLibraryCuration(null));

const classification = {
  client: { name: 'Test', email: '', country: 'India', language: 'English', age_range: '34', lifestyle_summary: 'Doctor who needs simple workwear.' },
  body: {
    geometry: 'Pear',
    focus_areas: ['Post-pregnancy body', 'Hips/Thighs'],
    coverage_rules: ['No deep necklines', 'No backless designs', 'No sleeveless tops', 'Leg coverage: keep hemlines at or below the knee.'],
    silhouette_rules: ['A-line or straight-leg trousers to skim the hips'],
    proportion_directive: 'Balance wider hips.',
  },
  taste: {
    moodboard: 'Clean lines, earthy tones.',
    anti_codes: ['Ruffles', 'Visible logos', 'Very tight fits', 'No stark white or bright ivory as the top or layer worn against the face.'],
    signature_codes: ['Structured blazers', 'Pointed-toe flats', 'Gold minimal jewellery'],
    style_archetype: 'Minimalist Professional',
    shopping_filters: ['Straight-leg trousers'],
  },
  colour: {
    depth: 'Deep',
    contrast: 'Medium-High',
    palette_name: 'Deep Muted Earthy Warm',
    undertone_direction: 'deep warm',
    avoid_colours: ['Optic White', 'Neon Pink', 'Cool Silver'],
    base_palette: [
      { name: 'Deep Navy', hex: '#1B2431', usage: '' },
      { name: 'Rust', hex: '#8B4513', usage: '' },
      { name: 'Olive Green', hex: '#556B2F', usage: '' },
      { name: 'Oat Stone', hex: '#D8CFC0', usage: '' },
      { name: 'Camel Tan', hex: '#B8865B', usage: '' },
      { name: 'Black Ink', hex: '#0F0F0F', usage: '' },
    ],
    accent_palette: [{ name: 'Deep Garnet', hex: '#730800', usage: '' }],
  },
  face_hair_accessories: { neckline_direction: '', approved_necklines: [] },
} as unknown as StylistBlueprintReportData['classification'];

const reportData = { version: 'women_blueprint_41_v1', classification, pages: [] } as unknown as StylistBlueprintReportData;

const submission = {
  id: 'test',
  coverage_requirements: { boundaries: ['Deep Neck', 'Backless', 'Sleeveless'], fit_restrictions: ['Nothing tight (comfort priority)', 'No dresses and skirts at work.'] },
  piece_preferences: { footwear: ['Flats only'], metal_preference: 'Gold', avoided: ['Very tight fitted'] },
  raw_consultation_notes: 'Mostly workwear. Add a few smart ethnic workwear options.',
  body_measurements: { height_cm: 158 },
} as unknown as StylistIntakeSubmission;

const look = (overrides: Partial<VerbatimLook>): VerbatimLook => ({
  id: 'pinterest-1', source: 'pinterest', capsules: ['Professional'], ethnic: false,
  top: 'Rust linen shirt with long sleeves', bottom: 'chocolate wide-leg trousers', shoes: 'tan pointed flats',
  accessories: 'tan leather tote, gold hoops', styling: 'shirt worn loose over the trousers', ...overrides,
});

test('the library parses into real looks with their provenance', () => {
  const looks = getVerbatimLooks();
  assert.ok(looks.length > 500, `only ${looks.length} looks`);
  assert.ok(looks.every(item => /^(pinterest|ethnic-office)-\d+[a-z]?$/.test(item.id)));
  assert.ok(looks.some(item => item.source === 'ethnic_office'));
  const parsed = parseVerbatimLooks('## Pinterest board\n### Professional\n**1.** Navy tee / camel blazer / blue jeans / nude pumps / tan tote. *Styling: tee tucked in.*\n<!-- pinterest-13 · also fits: Everyday -->');
  assert.deepEqual(parsed.map(item => [item.id, item.capsules]), [['pinterest-13', ['Professional', 'Everyday']]]);
});

test('the model, fallback, previews and replacements can only use the kept pool', async () => {
  const { verbatimAlternativesForPage, verbatimReplacementPage } = await import('./stylistPinterestOutfits.ts');
  const all = getAllVerbatimLooks();
  const kept = new Set(all.filter((_, index) => index % 2 === 0).map(look => look.id));
  const passed = all[1].id;
  const unreviewed = all[3].id;
  setOutfitLibraryCuration({ verdicts: new Map([...all.filter(look => kept.has(look.id)).map(look => [look.id, 'like'] as const), [passed, 'dislike']]) });
  const calls: string[] = [];
  const hostileModel = async (prompt: string) => {
    calls.push(prompt);
    // Invalid ids must be rejected even when the model tries to pick them.
    return Object.fromEntries(['Professional', 'Everyday', 'Social', 'Occasion'].map(capsule => [capsule, [passed, unreviewed, passed]]));
  };
  for (const caller of [hostileModel, async () => { throw new Error('model offline'); }]) {
    const result = await generatePinterestVerbatimApplication(submission, reportData, caller);
    const selected = result.outfit_engine.selected;
    assert.equal(selected.length, 20);
    assert.equal(new Set(selected.map(item => item.look_id)).size, 20);
    assert.ok(selected.every(item => kept.has(item.look_id)));
    assert.equal(result.outfit_engine.preview_look_ids.length, 3);
    assert.ok(result.outfit_engine.preview_look_ids.every(id => kept.has(id)));
    const next = { ...reportData, pages: result.pages, outfit_engine: result.outfit_engine };
    const page = selected[0].page_number;
    const alternatives = verbatimAlternativesForPage(submission, next, page);
    assert.ok(alternatives.length > 0);
    assert.ok(alternatives.every(item => kept.has(item.evaluated.look.id)));
    await assert.rejects(verbatimReplacementPage(submission, next, page, caller, passed), /no longer available/);
    await assert.rejects(verbatimReplacementPage(submission, next, page, caller, unreviewed), /no longer available/);
    const replacement = await verbatimReplacementPage(submission, next, page, caller);
    assert.ok(replacement.outfit_engine.selected.every(item => kept.has(item.look_id)));
    // The legacy-report replacement path must use the same kept-only pool.
    const legacy = { ...next, outfit_engine: undefined };
    const legacyReplacement = await verbatimReplacementPage(submission, legacy, page, caller);
    assert.ok(legacyReplacement.outfit_engine.selected.every(item => kept.has(item.look_id)));
  }
  assert.ok(calls[0].includes('20 outfits total'));
  assert.ok(!calls[0].includes(passed));
  assert.ok(!calls[0].includes(unreviewed));
});

test('a missing or insufficient kept pool stops before calling the model', async () => {
  let called = false;
  const caller = async () => { called = true; return {}; };
  for (const state of [null, { verdicts: new Map([[getAllVerbatimLooks()[0].id, 'like' as const]]) }]) {
    setOutfitLibraryCuration(state);
    await assert.rejects(generatePinterestVerbatimApplication(submission, reportData, caller), /Not enough kept outfits/);
  }
  assert.equal(called, false);
});

test('hard rules drop a look rather than patch it', () => {
  const rules = buildVerbatimClientRules(submission, reportData);
  assert.ok(evaluateVerbatimLook(look({ top: 'Black sleeveless shell' }), rules, 'Professional').rejects.includes('bare arms or shoulders'));
  assert.ok(evaluateVerbatimLook(look({ top: 'Plunging deep-V blouse' }), rules, 'Professional').rejects.includes('low neckline'));
  assert.ok(evaluateVerbatimLook(look({ bottom: 'denim mini skirt' }), rules, 'Everyday').rejects.includes('short hem'));
  assert.ok(evaluateVerbatimLook(look({ bottom: 'navy A-line midi skirt' }), rules, 'Professional').rejects.includes('skirt or dress at work'));
  assert.equal(evaluateVerbatimLook(look({ bottom: 'navy A-line midi skirt' }), rules, 'Everyday').rejects.includes('skirt or dress at work'), false);
  assert.ok(evaluateVerbatimLook(look({ top: 'Ruffled blouse with long sleeves' }), rules, 'Professional').rejects.includes('ruffles'));
});

test('only small named swaps are made: flats, metal, a near-face shade', () => {
  const rules = buildVerbatimClientRules(submission, reportData);
  const evaluated = evaluateVerbatimLook(look({ shoes: 'nude pointed slingbacks', accessories: 'silver hoops, black tote', top: 'White crew-neck tee with long sleeves' }), rules, 'Professional');
  assert.deepEqual(evaluated.rejects, []);
  assert.equal(evaluated.pieces.shoes, 'nude pointed slingback flats');
  assert.match(evaluated.pieces.accessories, /gold hoops/);
  assert.doesNotMatch(evaluated.pieces.top, /^white/i);
  assert.match(evaluated.pieces.bottom, /^chocolate wide-leg trousers$/);
});

test('heels become a flat of the same colour', () => {
  assert.equal(flatVersionOfShoe('black pointed pumps'), 'black pointed flats');
  assert.equal(flatVersionOfShoe('brown heeled sandals'), 'brown flat sandals');
  assert.equal(flatVersionOfShoe('nude block-heel pumps'), 'nude flats');
});

test('tuck state comes from how the look was styled', () => {
  assert.equal(classifyTuck({ top: 'tee', styling: 'tee tucked in fully' }), 'tucked');
  assert.equal(classifyTuck({ top: 'shirt', styling: 'worn loose and untucked over the trousers' }), 'untucked');
  assert.equal(classifyTuck({ top: 'tee', styling: 'half-tucked at the front' }), 'half-tucked');
  assert.equal(classifyTuck({ dress: 'midi dress', styling: '' }), 'one-piece');
});

test('her palette ranks looks without recolouring them', () => {
  const pools = rankVerbatimLooks(submission, reportData);
  const professional = pools.byCapsule.Professional;
  assert.ok(professional.length >= 5);
  const mint = pools.byCapsule.Occasion.concat(pools.byCapsule.Everyday).find(item => /^mint/i.test(item.pieces.dress || item.pieces.top));
  const rust = pools.byCapsule.Everyday.concat(professional).find(item => /^rust/i.test(item.pieces.dress || item.pieces.top));
  if (mint && rust) assert.ok(rust.score > mint.score, 'rust outranks mint for a deep warm client');
});

test('a full set is twenty real looks with a mix of tucked and untucked', async () => {
  const noModel = async () => { throw new Error('offline'); };
  const result = await generatePinterestVerbatimApplication(submission, { ...reportData, version: 'women_blueprint_41_v1', pages: [] } as StylistBlueprintReportData, noModel);
  const outfits = result.pages.filter(page => page.page_type === 'outfit');
  assert.equal(outfits.length, 20);
  assert.equal(new Set(outfits.map(page => page.library_refs?.[0]?.id)).size, 20);
  const tucks = result.outfit_engine.selected.map(item => item.look_id);
  assert.equal(tucks.length, 20);
  for (const page of outfits) assert.deepEqual(clientRuleWarningsForPage(submission, reportData, page), [], `${page.title} breaks a rule`);
});

test('colour sits on a neutral base, not head to toe', async () => {
  const { colourBalanceOf, garmentReadsNeutral } = await import('./stylistPinterestOutfits.ts');
  assert.equal(garmentReadsNeutral('mid-blue wide-leg jeans'), true);
  assert.equal(garmentReadsNeutral('Camel double-breasted blazer'), true);
  assert.equal(garmentReadsNeutral('Rust linen shirt'), false);
  const base = { layer: '', shoes: 'tan flats', accessories: 'tan tote', dress: '' };
  assert.equal(colourBalanceOf({ ...base, top: 'Rust linen shirt', bottom: 'dark indigo jeans' }), 'balanced');
  assert.equal(colourBalanceOf({ ...base, top: 'Emerald kurta', bottom: 'matching emerald palazzo' }), 'all-colour');
  assert.equal(colourBalanceOf({ ...base, top: 'Black tee', bottom: 'beige trousers' }), 'all-neutral');
  assert.equal(colourBalanceOf({ ...base, top: 'Black tee', bottom: 'beige trousers', accessories: 'burgundy tote' }), 'neutral-with-accent');
});

test('a full set mostly puts palette colour on a neutral base', async () => {
  const noModel = async () => { throw new Error('offline'); };
  const result = await generatePinterestVerbatimApplication(submission, { ...reportData, version: 'women_blueprint_41_v1', pages: [] } as StylistBlueprintReportData, noModel);
  const pools = rankVerbatimLooks(submission, reportData);
  const all = Object.values(pools.byCapsule).flat();
  const balances = result.outfit_engine.selected.map(item => all.find(look => look.look.id === item.look_id)!.colourBalance);
  assert.ok(balances.filter(item => item === 'balanced').length >= 12, `only ${balances.filter(item => item === 'balanced').length} balanced looks`);
  assert.ok(balances.filter(item => item === 'all-colour').length <= 2);
});

test('the Western/Indian mix is exact, never over the stated share', async () => {
  const { withExactEthnicCount } = await import('./stylistPinterestOutfits.ts');
  const look = (id: string, ethnic: boolean) => ({ look: { id, ethnic } }) as unknown as Parameters<typeof withExactEthnicCount>[0][number];
  const chosen = [look('k1', true), look('k2', true), look('k3', true), look('w1', false), look('w2', false)];
  const pool = [...chosen, look('w3', false), look('w4', false)];
  assert.equal(withExactEthnicCount(chosen, pool, 1).filter(item => item.look.ethnic).length, 1);
  assert.equal(withExactEthnicCount(chosen.slice(3), [...pool], 2).filter(item => item.look.ethnic).length, 2);
});

// --- Pre-deploy audit cases, from real intake wording -----------------------

const withPrefs = (overrides: Record<string, unknown>) => ({ ...submission, ...overrides }) as unknown as StylistIntakeSubmission;
const ethnicTotal = (rules: ReturnType<typeof buildVerbatimClientRules>) => Object.values(rules.ethnicByCapsule).reduce((a, b) => a + b, 0);

test('a stated Western/Indian mix is honoured, plurals included', () => {
  const aziza = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: '', piece_preferences: { outfit_ratio: 'Equal', loved: ['ethnics kurtas for work'] } }), reportData);
  assert.equal(ethnicTotal(aziza), 10);
  const ranjani = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: '', piece_preferences: { outfit_ratio: 'More Western', loved: ['kurtis'] } }), reportData);
  assert.equal(ethnicTotal(ranjani), 5);
  const khushi = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: 'A few options of ethnic for work.', piece_preferences: { outfit_ratio: 'More Ethnic', loved: ['Dupatta dresses', 'sarees'] } }), reportData);
  assert.equal(ethnicTotal(khushi), 12, 'a "few for work" note does not override More Ethnic');
  assert.equal(khushi.antiCodePatterns.some(code => code.label === 'dupattas'), false, 'loving dupatta dresses never bans dupattas');
  const western = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: '', piece_preferences: { outfit_ratio: 'Western only' } }), reportData);
  assert.equal(ethnicTotal(western), 0);
  const festive = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: 'ethnic for festive only, 2-3 looks', piece_preferences: { outfit_ratio: 'More Western' } }), reportData);
  assert.equal(festive.ethnicByCapsule.Professional, 0);
  assert.ok(ethnicTotal(festive) <= 3);
});

test('negated avoid terms, strappy pieces and full modesty are hard rules', () => {
  const jyotsna = buildVerbatimClientRules(withPrefs({ piece_preferences: { avoided: ['no skirts', 'no sarees'], footwear: ['Flats only'] } }), reportData);
  assert.ok(evaluateVerbatimLook(look({ bottom: 'navy pleated midi skirt' }), jyotsna, 'Everyday').rejects.some(item => /avoids/.test(item)));
  const sabiha = buildVerbatimClientRules(withPrefs({ coverage_requirements: { modesty_preference: 'Wears hijab, fully covered' }, piece_preferences: {} }), reportData);
  assert.ok(sabiha.arms && sabiha.armsStrict && sabiha.legs && sabiha.neckline);
  const slip = look({ top: undefined, bottom: undefined, dress: 'Red-and-white polka-dot strappy bias midi dress, slip-style cut' });
  assert.ok(evaluateVerbatimLook(slip, sabiha, 'Social').rejects.includes('bare arms or shoulders'));
  const noTuck = buildVerbatimClientRules(withPrefs({ piece_preferences: { avoided: ['no tucked in'] } }), reportData);
  assert.ok(evaluateVerbatimLook(look({ styling: 'shirt tucked in fully' }), noTuck, 'Professional').rejects.includes('tucked in'));
  const daily = buildVerbatimClientRules(withPrefs({ raw_consultation_notes: 'no dresses and skirts for daily wear' }), reportData);
  assert.deepEqual([...daily.noSkirtCapsules].sort(), ['Everyday', 'Professional']);
});

test('heel swaps stay sensible and respect her height', async () => {
  const { heeledVersionOfShoe, statedHeelHeight } = await import('./stylistPinterestOutfits.ts');
  assert.equal(statedHeelHeight('comfortable heels').phrase, 'low');
  assert.equal(statedHeelHeight('1.2-2 inch heel').maxInches, 2);
  assert.doesNotMatch(heeledVersionOfShoe('tan flat slide sandals', '1.2-2 inch heel'), /flat/i);
  const teju = buildVerbatimClientRules(withPrefs({ piece_preferences: { footwear: ['1.2-2 inch heel'] } }), reportData);
  const juttis = evaluateVerbatimLook(look({ shoes: 'gold flat juttis' }), teju, 'Social');
  assert.equal(juttis.pieces.shoes, 'gold flat juttis');
  const stiletto = evaluateVerbatimLook(look({ shoes: 'black 4-inch stilettos' }), teju, 'Social');
  assert.match(stiletto.pieces.shoes, /1\.2-2 inch heel/);
});

test('no shine means no metallic shoe is added', () => {
  const shabana = buildVerbatimClientRules({ ...withPrefs({ piece_preferences: {} }) }, { classification: { ...classification, taste: { ...classification.taste, anti_codes: ['No shine or satin'] } } } as StylistBlueprintReportData);
  const evaluated = evaluateVerbatimLook(look({ shoes: 'not visible' }), shabana, 'Occasion');
  assert.doesNotMatch(evaluated.pieces.shoes, /metallic|gold|silver/i);
});

test('tonal colour sets are head-to-toe colour even under a neutral vest', async () => {
  const { colourBalanceOf } = await import('./stylistPinterestOutfits.ts');
  assert.equal(colourBalanceOf({ top: 'Rust linen top', layer: 'cream knit waistcoat', bottom: 'matching rust wide-leg trousers', dress: '', shoes: 'tan flats', accessories: 'tan tote' }), 'all-colour');
  assert.equal(colourBalanceOf({ top: 'Sage green shirt', layer: '', bottom: 'black trousers', dress: '', shoes: 'tan flats', accessories: 'tan tote' }), 'balanced');
});

test('board commentary and swapped colours never reach her styling note', async () => {
  const { stylingAfterSwaps } = await import('./stylistPinterestOutfits.ts');
  const text = stylingAfterSwaps('top tucked in, everything else white — the strongest colour-matching in the set', ['white → stone (closest shade in her palette)'], { metal: 'gold' });
  assert.equal(text, 'top tucked in, everything else stone');
});

test('fallback copy speaks to her and never cuts a word', async () => {
  const { fallbackVerbatimCopy } = await import('./stylistPinterestOutfits.ts');
  const rules = buildVerbatimClientRules(submission, reportData);
  const evaluated = evaluateVerbatimLook(look({ bottom: 'matching rust wide-leg trousers with a pressed crease' }), rules, 'Professional');
  const copy = fallbackVerbatimCopy(evaluated, 'Professional');
  assert.doesNotMatch(copy.why, /\bher\b/);
  assert.match(copy.why, /^This outfit /);
  assert.ok(copy.title.split(/\s+/).every(word => /^[A-Za-z,-]+$/.test(word)));
});

test('a very strict client still gets twenty looks instead of a failed report', async () => {
  const strict = withPrefs({
    coverage_requirements: { boundaries: ['Deep Neck', 'Backless', 'Sleeveless', 'Short Skirt'], fit_restrictions: ['Nothing tight', 'No dresses and skirts at work.'] },
    piece_preferences: { avoided: ['palazzo', 'jeans', 'dresses'], footwear: ['Flats only'] },
  });
  const result = await generatePinterestVerbatimApplication(strict, { ...reportData, pages: [] } as StylistBlueprintReportData, async () => { throw new Error('offline'); });
  assert.equal(result.pages.filter(page => page.page_type === 'outfit').length, 20);
});
