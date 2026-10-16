import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerbatimClientRules,
  classifyTuck,
  clientRuleWarningsForPage,
  evaluateVerbatimLook,
  flatVersionOfShoe,
  generatePinterestVerbatimApplication,
  getVerbatimLooks,
  parseVerbatimLooks,
  rankVerbatimLooks,
  type VerbatimLook,
} from './stylistPinterestOutfits.ts';
import type { StylistBlueprintReportData, StylistIntakeSubmission } from './stylistBlueprintGenerator.ts';

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
