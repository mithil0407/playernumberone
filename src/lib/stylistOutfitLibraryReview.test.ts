import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MIN_LIKES_FOR_LIKES_ONLY,
  applyOutfitLibraryCuration,
  buildOutfitLibraryImagePrompt,
  curationMode,
  isReviewableLook,
  outfitLibraryImageHash,
  type OutfitLibraryCuration,
  type OutfitVerdict,
} from './stylistOutfitLibraryReview.ts';
import { getAllVerbatimLooks, getVerbatimLooks, setOutfitLibraryCuration, type VerbatimLook } from './stylistPinterestOutfits.ts';

const looks = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `pinterest-${index + 1}` }));
function curation(entries: Array<[string, OutfitVerdict]>, imaged: string[]): OutfitLibraryCuration {
  return { verdicts: new Map(entries), imagedLookIds: new Set(imaged) };
}

test('no swipes leaves the whole library in play', () => {
  const library = looks(10);
  assert.equal(curationMode(library, null), 'off');
  assert.equal(applyOutfitLibraryCuration(library, curation([], [])).length, 10);
});

test('a pass drops the look straight away while she is still swiping', () => {
  const library = looks(10);
  const state = curation([['pinterest-1', 'dislike'], ['pinterest-2', 'like']], library.map(look => look.id));
  assert.equal(curationMode(library, state), 'drop_passes');
  const kept = applyOutfitLibraryCuration(library, state).map(look => look.id);
  assert.equal(kept.includes('pinterest-1'), false);
  assert.equal(kept.length, 9);
});

test('once every picture is judged, only her likes are recommended', () => {
  const library = looks(MIN_LIKES_FOR_LIKES_ONLY + 40);
  const entries = library.map((look, index): [string, OutfitVerdict] => [look.id, index < MIN_LIKES_FOR_LIKES_ONLY ? 'like' : 'dislike']);
  // Two looks never got a picture: they cannot be judged, and are left out too.
  const extra = [{ id: 'pinterest-9001' }, { id: 'pinterest-9002' }];
  const state = curation(entries, library.map(look => look.id));
  assert.equal(curationMode([...library, ...extra], state), 'likes_only');
  const kept = applyOutfitLibraryCuration([...library, ...extra], state);
  assert.equal(kept.length, MIN_LIKES_FOR_LIKES_ONLY);
});

test('too few likes never shrinks the library to likes only', () => {
  const library = looks(50);
  const state = curation(library.map((look, index): [string, OutfitVerdict] => [look.id, index < 20 ? 'like' : 'dislike']), library.map(look => look.id));
  assert.equal(curationMode(library, state), 'drop_passes');
  assert.equal(applyOutfitLibraryCuration(library, state).length, 20);
});

test('the engine sees the curated library and still knows every look', () => {
  const all = getAllVerbatimLooks();
  setOutfitLibraryCuration(curation([[all[0].id, 'dislike']], all.map(look => look.id)));
  try {
    assert.equal(getVerbatimLooks().some(look => look.id === all[0].id), false);
    assert.equal(getVerbatimLooks().length, all.length - 1);
    assert.equal(getAllVerbatimLooks().length, all.length);
  } finally {
    setOutfitLibraryCuration(null);
  }
  assert.equal(getVerbatimLooks().length, all.length);
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
