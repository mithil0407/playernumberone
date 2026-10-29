import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  BODY_SHAPE_KEYS,
  BODY_SHAPE_LIBRARY,
  FABRIC_LIBRARY,
  FACE_SHAPE_LIBRARY,
  fabricImagePath,
  GUIDE_CATEGORIES,
  UNDERTONE_LIBRARY,
  libraryCardsFor,
  libraryImagePath,
  styleLibraryPicksFor,
  toBodyShapeKey,
  toFaceShapeKey,
  toUndertoneKey,
} from './stylistStyleLibrary.ts';
import {
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAvoidancePage,
  getStylistBlueprintHiddenPageNumbers,
  getStylistBlueprintLibraryLayout,
  getStylistBlueprintPageCount,
  getStylistBlueprintReadingGuidePage,
  getStylistBlueprintRulesStartPage,
  getVisibleStylistBlueprintPages,
} from './stylistBlueprintSchema.ts';
import { assertStylistReportDraft } from './stylistReportValidation.ts';

const count = getStylistBlueprintPageCount(STYLIST_BLUEPRINT_VERSION);
const studio = (extra = {}) => ({ analysis_confirmed: false, hidden_page_numbers: [], page_order: Array.from({ length: count }, (_, i) => i + 1), ...extra });
const picks = { body_shape: 'apple', face_shape: 'round', undertone: 'warm' } as const;

test('every body shape has two goals and four cards on each clothing page, each with its picture', () => {
  for (const shape of BODY_SHAPE_KEYS) {
    const entry = BODY_SHAPE_LIBRARY[shape];
    assert.equal(entry.goals.length, 2, shape);
    for (const category of GUIDE_CATEGORIES) assert.equal(entry.guides[category.key].length, 4, `${shape} ${category.key}`);
    for (const { card } of libraryCardsFor(shape)) {
      assert.ok(existsSync(join(process.cwd(), 'public', libraryImagePath(shape, card.id))), `missing picture ${shape}/${card.id}`);
      assert.ok(card.line.split(/\s+/).length <= 20, `${shape}/${card.id} line is too long`);
    }
  }
  assert.equal(Object.keys(FACE_SHAPE_LIBRARY).length, 5);
  assert.deepEqual(Object.keys(UNDERTONE_LIBRARY), ['warm', 'cool', 'neutral']);
});

test('whatever the model wrote maps onto the fixed lists', () => {
  assert.equal(toBodyShapeKey('Inverted triangle'), 'inverted_triangle');
  assert.equal(toBodyShapeKey('Apple (Oval) with a subtle Rectangle influence'), 'apple');
  assert.equal(toBodyShapeKey('Pear'), 'pear');
  assert.equal(toFaceShapeKey('Diamond'), 'heart');
  assert.equal(toFaceShapeKey('Triangle'), 'square');
  assert.equal(toUndertoneKey('warm olive'), 'neutral');
  assert.equal(toUndertoneKey('Warm'), 'warm');
  assert.equal(toUndertoneKey('cool pink'), 'cool');
  // A report always gets a full set of picks, even from thin analysis.
  assert.deepEqual(styleLibraryPicksFor({}), { body_shape: 'rectangle', face_shape: 'oval', undertone: 'neutral' });
  assert.deepEqual(styleLibraryPicksFor({ body: { shape: 'Hourglass' }, colour: { undertone: 'Cool' }, face_hair_accessories: { face_shape: 'Oblong' } }),
    { body_shape: 'hourglass', face_shape: 'oblong', undertone: 'cool' });
});

test('only reports with picks use the library layout, and it leaves out the cut pages', () => {
  const pages = Array.from({ length: count }, (_, index) => ({ page_number: index + 1 }));
  assert.equal(getStylistBlueprintLibraryLayout({ version: STYLIST_BLUEPRINT_VERSION, studio: studio() }), null);
  const data = { version: STYLIST_BLUEPRINT_VERSION, studio: studio({ style_library: picks }), pages };
  const layout = getStylistBlueprintLibraryLayout(data)!;
  assert.ok(layout);
  for (const page of [getStylistBlueprintReadingGuidePage(data), getStylistBlueprintAvoidancePage(data), getStylistBlueprintRulesStartPage(data)]) {
    assert.ok(layout.hidden.has(page), `page ${page} should be cut`);
    assert.ok(getStylistBlueprintHiddenPageNumbers(data).has(page));
  }
  assert.deepEqual([...layout.kinds.values()].filter(kind => /tops|bottoms|dresses|layers|footwear/.test(kind)),
    ['library_tops', 'library_bottoms', 'library_dresses', 'library_layers', 'library_footwear']);
  const visible = getVisibleStylistBlueprintPages(data).map(page => page.page_number);
  assert.ok(visible.length < count);
  for (const page of layout.kinds.keys()) assert.ok(visible.includes(page), `library page ${page} should show`);
});

test('a saved report must pick from the fixed lists', () => {
  const draft = (style_library: unknown) => ({
    version: STYLIST_BLUEPRINT_VERSION,
    pages: [],
    client: { display_name: 'Test' },
    analysis: { silhouette_profile: '', chromatic_family: '', facial_architecture: '', style_direction: '' },
    classification: { colour: { base_palette: [], accent_palette: [] } },
    studio: studio({ style_library }),
  });
  assert.doesNotThrow(() => assertStylistReportDraft(draft(picks)));
  assert.throws(() => assertStylistReportDraft(draft({ ...picks, body_shape: 'banana' })), /fixed options/);
});

test('every shape has four fabrics with a close-up picture, and its goals carry marks inside the picture', () => {
  for (const shape of BODY_SHAPE_KEYS) {
    const entry = BODY_SHAPE_LIBRARY[shape];
    assert.equal(entry.fabrics.length, 4, shape);
    assert.ok(entry.fabricSkip.length >= 1 && entry.fabricSkip.length <= 3, shape);
    for (const item of entry.fabrics) {
      assert.ok(item.id in FABRIC_LIBRARY, `${shape}: unknown fabric ${item.id}`);
      assert.ok(existsSync(join(process.cwd(), 'public', fabricImagePath(item.id))), `missing fabric picture ${item.id}`);
    }
    for (const goal of entry.goals) {
      assert.ok(goal.marks.length >= 1, `${shape}/${goal.id} has no marks`);
      for (const mark of goal.marks) {
        const values = mark.kind === 'vertical' ? [mark.x, mark.from, mark.to] : [mark.y, mark.from, mark.to];
        assert.ok(values.every(value => value >= 0 && value <= 1), `${shape}/${goal.id} mark is outside the picture`);
        assert.ok(mark.label.split(/\s+/).length <= 4, `${shape}/${goal.id} mark label is too long`);
      }
    }
  }
});
