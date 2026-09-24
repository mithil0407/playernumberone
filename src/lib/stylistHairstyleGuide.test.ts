import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FACE_SHAPES,
  FACE_SHAPE_HAIR_GUIDE,
  faceShapeHairGuidePrompt,
  hairstyleNamesChanged,
  normaliseFaceShape,
  reportHairstyles,
  selectHairstyleDirections,
  withHairstyleEdit,
} from './stylistHairstyleGuide.ts';
import { applyFaceShapeHairstyles, type StylistBlueprintClassification } from './stylistBlueprintGenerator.ts';

test('every face shape has four cuts and four styles, each with a reason', () => {
  for (const shape of FACE_SHAPES) {
    const guide = FACE_SHAPE_HAIR_GUIDE[shape];
    assert.equal(guide.options.filter(option => option.kind === 'cut').length, 4, `${shape} cuts`);
    assert.equal(guide.options.filter(option => option.kind === 'style').length, 4, `${shape} styles`);
    assert.ok(guide.options.every(option => option.why.length > 20), `${shape} reasons`);
    assert.ok(guide.avoid.length >= 2, `${shape} avoid list`);
    assert.equal(new Set(guide.options.map(option => option.name)).size, 8, `${shape} names are unique`);
  }
});

test('face shape readings normalise to one leading shape', () => {
  assert.equal(normaliseFaceShape('Round')?.primary, 'round');
  assert.equal(normaliseFaceShape('Soft Oval')?.primary, 'oval');
  // Oval is the balanced reference: in a blend, the other shape is what hair must address.
  assert.deepEqual(normaliseFaceShape('Oval-Round'), { primary: 'round', secondary: 'oval' });
  assert.deepEqual(normaliseFaceShape('Round-Oval'), { primary: 'round', secondary: 'oval' });
  assert.equal(normaliseFaceShape('Oval-Oblong')?.primary, 'oblong');
  assert.equal(normaliseFaceShape('Inverted triangle')?.primary, 'heart');
  assert.equal(normaliseFaceShape('Triangle')?.primary, 'triangle');
  assert.equal(normaliseFaceShape('Rectangular')?.primary, 'oblong');
  assert.equal(normaliseFaceShape(''), null);
  assert.equal(normaliseFaceShape('unclear'), null);
});

test('hairstyles are two cuts and two styles from her own face shape only', () => {
  const round = FACE_SHAPE_HAIR_GUIDE.round.options.map(option => option.name);
  const directions = selectHairstyleDirections('Round', [
    'Low polished bun', // not on the round list
    'Deep side part',
    'Jaw-length blunt bob', // an oval cut a round face should avoid
    'long side swept fringe', // loose wording of a round option
  ]);
  assert.equal(directions.length, 4);
  assert.deepEqual(directions.map(direction => direction.kind), ['cut', 'cut', 'style', 'style']);
  assert.ok(directions.every(direction => round.includes(direction.name)), 'only round options');
  assert.ok(directions.some(direction => direction.name === 'Deep side part'), 'keeps a valid model pick');
  assert.ok(directions.some(direction => direction.name === 'Long side-swept fringe'), 'matches loose wording to the guide name');
  assert.ok(directions.every(direction => direction.face_shape === 'Round' && direction.why));
});

test('a blend never borrows a cut the leading shape should avoid', () => {
  const directions = selectHairstyleDirections('Oval-Round', ['Jaw-length blunt bob', 'Sleek middle part']);
  assert.ok(directions.every(direction => FACE_SHAPE_HAIR_GUIDE.round.options.some(option => option.name === direction.name)));
});

test('the same face and picks always give the same hairstyles', () => {
  const first = selectHairstyleDirections('Heart', []);
  const second = selectHairstyleDirections('Heart', []);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(direction => direction.name), [
    'Chin-to-collarbone bob with fuller ends', 'Side-swept fringe', 'Waves from the jaw down', 'Low side bun',
  ]);
  // An unreadable face falls back to the balanced oval list, not a random one.
  assert.ok(selectHairstyleDirections('unclear', []).every(direction => direction.face_shape === 'Oval'));
});

test('classification post-processing stores the shape, the reasons and the goal', () => {
  const face: StylistBlueprintClassification['face_hair_accessories'] = {
    face_shape: 'Oval-Round',
    face_direction: '',
    hair_direction: '',
    hair_colour_direction: '',
    hair_colour_options: [],
    neckline_direction: '',
    jewellery_direction: '',
    eyewear_direction: '',
    approved_necklines: [],
    hair_styles: ['Half-up with crown volume', 'Low polished bun'],
    eyewear_shapes: [],
    earring_shapes: [],
  };
  applyFaceShapeHairstyles(face);
  assert.equal(face.face_shape, 'Round');
  assert.equal(face.hair_styles.length, 4);
  assert.ok(face.hair_styles.includes('Half-up with crown volume'));
  assert.ok(!face.hair_styles.includes('Low polished bun'));
  assert.deepEqual(face.hair_style_directions?.map(direction => direction.name), face.hair_styles);
  assert.equal(face.hair_direction, FACE_SHAPE_HAIR_GUIDE.round.goal);
});

test('the prompt lists every shape with its signs, goal and options', () => {
  const prompt = faceShapeHairGuidePrompt();
  for (const shape of FACE_SHAPES) {
    const guide = FACE_SHAPE_HAIR_GUIDE[shape];
    assert.ok(prompt.includes(guide.label) && prompt.includes(guide.signs) && prompt.includes(guide.goal));
    assert.ok(guide.options.every(option => prompt.includes(option.name)));
  }
});

test('older reports without reasons still give four editable hairstyles', () => {
  const face = { face_shape: 'Round', hair_styles: ['Deep side part', 'Low polished bun'] };
  const hairstyles = reportHairstyles(face);
  assert.deepEqual(hairstyles.map(hairstyle => hairstyle.name), ['Deep side part', 'Low polished bun']);
  assert.ok(hairstyles[0].why, 'a name on the guide recovers its reason');
  assert.equal(hairstyles[1].why, '', 'a name off the guide is kept, with no invented reason');
});

test('a stylist edit keeps the page and the image prompt names in step', () => {
  const face = { face_shape: 'Round', hair_styles: [] as string[], hair_style_directions: selectHairstyleDirections('Round', []) };
  const renamed = withHairstyleEdit(face, 2, { name: 'Sleek low ponytail' });
  assert.equal(renamed.hair_styles[2], 'Sleek low ponytail');
  assert.equal(renamed.hair_style_directions?.[2].name, 'Sleek low ponytail');
  assert.equal(renamed.hair_style_directions?.[2].why, face.hair_style_directions[2].why, 'renaming keeps the reason');
  assert.ok(hairstyleNamesChanged({ hair_styles: face.hair_style_directions.map(hairstyle => hairstyle.name) }, renamed), 'a rename stales the image');

  const reworded = withHairstyleEdit(renamed, 0, { why: 'Lengthens the face.' });
  assert.equal(reworded.hair_style_directions?.[0].why, 'Lengthens the face.');
  assert.ok(!hairstyleNamesChanged(renamed, reworded), 'editing only the reason does not stale the image');
  assert.ok(!hairstyleNamesChanged({ hair_styles: ['Deep side part'] }, { hair_styles: ['deep side-part'] }), 'case and punctuation are not a new hairstyle');
});

test('the hair grid prompt uses the hairstyles as the stylist edited them', async () => {
  const { buildStylistBlueprintManualImagePrompt } = await import('./stylistBlueprintImageGenerator.ts');
  const face = withHairstyleEdit({
    face_shape: 'Round',
    hair_styles: [] as string[],
    hair_style_directions: selectHairstyleDirections('Round', []),
    hair_colour_options: [], eyewear_shapes: [], approved_necklines: [], earring_shapes: [],
  }, 1, { name: 'Sleek low ponytail' });
  const report = {
    version: 'women_blueprint_studio_55_v1',
    classification: {
      body: { geometry: 'balanced', proportion_directive: '', coverage_rules: [], focus_areas: [], silhouette_rules: [] },
      colour: { base_palette: [], accent_palette: [], palette: [], undertone_direction: 'warm', depth: 'medium', contrast: 'medium', palette_name: 'x', avoid_colours: [] },
      taste: { style_archetype: 'Structured', anti_codes: [], moodboard: '', signature_codes: [], shopping_filters: [] },
      face_hair_accessories: face,
      client: {}, makeup: { colours: [] }, fabrics: { approved: [], avoid: [] },
    },
    pages: [],
  } as never;
  const { prompt } = buildStylistBlueprintManualImagePrompt('prescription.hairDirections', report) as { prompt: string };
  assert.match(prompt, /Sleek low ponytail/);
  assert.match(prompt, /Round face shape/);
  assert.ok(face.hair_styles.every(name => prompt.includes(name)), 'every hairstyle on the page is in the prompt, in order');
});
