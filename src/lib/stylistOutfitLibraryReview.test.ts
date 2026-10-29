import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyOutfitLibraryCuration,
  buildOutfitLibraryImagePrompt,
  isReviewableLook,
  outfitLibraryImageHash,
  type OutfitLibraryCuration,
  type OutfitVerdict,
} from './stylistOutfitLibraryReview.ts';
import { getAllVerbatimLooks, getVerbatimLooks, setOutfitLibraryCuration, type VerbatimLook } from './stylistPinterestOutfits.ts';

const looks = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `pinterest-${index + 1}` }));
function curation(entries: Array<[string, OutfitVerdict]>): OutfitLibraryCuration {
  return { verdicts: new Map(entries) };
}

test('missing or empty swipes never opens the library to recommendations', () => {
  const library = looks(10);
  assert.deepEqual(applyOutfitLibraryCuration(library, null), []);
  assert.deepEqual(applyOutfitLibraryCuration(library, curation([])), []);
});

test('only explicit keeps are eligible while the review is still unfinished', () => {
  const library = looks(10);
  const state = curation([['pinterest-1', 'dislike'], ['pinterest-2', 'like']]);
  assert.deepEqual(applyOutfitLibraryCuration(library, state), [library[1]]);
});

test('new and picture-less looks stay out until explicitly kept', () => {
  const library = looks(160);
  const entries = library.map((look, index): [string, OutfitVerdict] => [look.id, index < 120 ? 'like' : 'dislike']);
  const extra = [{ id: 'pinterest-9001' }, { id: 'pinterest-9002' }];
  const kept = applyOutfitLibraryCuration([...library, ...extra], curation(entries));
  assert.deepEqual(kept, library.slice(0, 120));
});

test('a small kept pool never permits unreviewed looks to fill the gap', () => {
  const library = looks(50);
  const state = curation(library.slice(0, 20).map(look => [look.id, 'like']));
  assert.deepEqual(applyOutfitLibraryCuration(library, state), library.slice(0, 20));
});

test('the engine sees the curated library and still knows every look', () => {
  const all = getAllVerbatimLooks();
  setOutfitLibraryCuration(curation([[all[0].id, 'dislike'], [all[1].id, 'like']]));
  try {
    assert.deepEqual(getVerbatimLooks(), [all[1]]);
    assert.equal(getAllVerbatimLooks().length, all.length);
    // A pass and an undo both remove a previously kept look from the next run.
    setOutfitLibraryCuration(curation([[all[1].id, 'dislike']]));
    assert.deepEqual(getVerbatimLooks(), []);
    setOutfitLibraryCuration(curation([]));
    assert.deepEqual(getVerbatimLooks(), []);
  } finally {
    setOutfitLibraryCuration(null);
  }
  assert.deepEqual(getVerbatimLooks(), []);
});

test('pictures are studio shots of the look as written, redrawn when the words change', () => {
  const look: VerbatimLook = {
    id: 'pinterest-34', source: 'pinterest', capsules: ['Professional'], ethnic: false,
    top: 'Light-blue chambray button-down shirt', layer: 'camel blazer', bottom: 'mid-blue straight-leg jeans',
    shoes: 'not visible', accessories: 'brown belt', styling: 'shirt tucked.',
  };
  const prompt = buildOutfitLibraryImagePrompt(look);
  assert.match(prompt, /white seamless studio/i);
  assert.match(prompt, /- Top: Light-blue chambray button-down shirt/);
  assert.match(prompt, /- Shoes: simple shoes/);
  assert.match(prompt, /Worn: shirt tucked\./);
  assert.notEqual(outfitLibraryImageHash(look), outfitLibraryImageHash({ ...look, bottom: 'black trousers' }));
});

test('banned looks are left out of her pile', () => {
  const banned = getAllVerbatimLooks().find(look => look.id === 'ethnic-office-29');
  assert.ok(banned);
  assert.equal(isReviewableLook(banned), false);
});
