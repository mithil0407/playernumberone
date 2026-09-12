import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ETHNIC_CAPSULE_CAPS,
  ethnicCountsByCapsule,
  ethnicOutfitTarget,
  ethnicSlotsForCapsule,
  parseEthnicShare,
} from './stylistIntakePreferences.ts';

test('stated ratios parse into a share of the set', () => {
  assert.equal(parseEthnicShare('More Ethnic'), 0.6);
  assert.equal(parseEthnicShare('mostly ethnic'), 0.6);
  assert.equal(parseEthnicShare('More Western'), 0.25);
  assert.equal(parseEthnicShare('balanced'), 0.5);
  assert.equal(parseEthnicShare('50-50'), 0.5);
  assert.equal(parseEthnicShare('60% ethnic'), 0.6);
  assert.equal(parseEthnicShare('70/30 ethnic'), 0.7);
  assert.equal(parseEthnicShare('no ethnic'), 0);
  assert.equal(parseEthnicShare('only western'), 0);
  assert.equal(parseEthnicShare(''), null);
  assert.equal(parseEthnicShare(undefined), null);
});

test('"only ethnic" still leaves Western looks for work', () => {
  const share = parseEthnicShare('only ethnic');
  assert.ok(share !== null && share < 1, 'a report with no Western outfit at all is not a wardrobe system');
  assert.equal(share, 0.85);
});

test('western_default is a hard gate that overrides any stated ratio', () => {
  assert.equal(ethnicOutfitTarget({
    outfitCount: 20,
    culturalMode: 'western_default',
    piecePreferences: { outfit_ratio: 'only ethnic' },
  }), 0);
});

test('an ethnic-signalling intake with no ratio still gets more than a token look', () => {
  const target = ethnicOutfitTarget({ outfitCount: 20, culturalMode: 'ethnic_allowed', piecePreferences: {} });
  assert.ok(target >= 4, `expected a real floor, got ${target}`);
});

test('this client\'s "More Ethnic" becomes 12 of 20, spread across every capsule', () => {
  const target = ethnicOutfitTarget({
    outfitCount: 20,
    culturalMode: 'ethnic_allowed',
    piecePreferences: { outfit_ratio: 'More Ethnic' },
  });
  assert.equal(target, 12);

  const counts = ethnicCountsByCapsule(target, 5);
  assert.deepEqual(counts, { Occasion: 4, Social: 3, Everyday: 3, Professional: 2 });
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), target);
  for (const [capsule, count] of Object.entries(counts)) {
    assert.ok(count <= ETHNIC_CAPSULE_CAPS[capsule], `${capsule} exceeded its cap`);
    assert.ok(count > 0, `${capsule} has no ethnic look despite "More Ethnic"`);
  }
});

test('ethnic slots spread inside a capsule instead of clumping at the front', () => {
  const slots = [...ethnicSlotsForCapsule(3, 5)].sort((a, b) => a - b);
  assert.equal(slots.length, 3);
  assert.notDeepEqual(slots, [0, 1, 2], 'slots should be spread, not taken from the front');
  assert.ok(slots.every(slot => slot >= 0 && slot < 5));
});

test('the quota never exceeds capsule capacity', () => {
  for (const ratio of ['only ethnic', '100% ethnic', 'all ethnic', 'More Ethnic']) {
    const target = ethnicOutfitTarget({ outfitCount: 20, culturalMode: 'ethnic_allowed', piecePreferences: { outfit_ratio: ratio } });
    const counts = ethnicCountsByCapsule(target, 5);
    assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), target, `"${ratio}" could not be placed`);
    assert.ok(target <= 14, `"${ratio}" asked for ${target}, above the 14 capacity`);
  }
});
