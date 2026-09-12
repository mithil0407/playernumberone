import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SAFE_NECKLINES,
  applyNecklineSafetyToPiece,
  stripColourWords,
} from './stylistBlueprintTextSafety.ts';

const coverageRequired = { necklineRequired: true, approvedNecklines: SAFE_NECKLINES };
const applyNeckline = (piece: string, slot = 'Top') => applyNecklineSafetyToPiece(piece, slot, coverageRequired);

// Every string below is either taken verbatim from the live report
// 4ec6da7f-d676-44c4-816e-8472fe92ba6a or is the input that produced it.

test('neckline safety is idempotent across repeated regenerations', () => {
  // The safe phrase used to contain "cleavage", which the unsafe pattern also
  // matches, so each pass wrapped the previous pass's output.
  const seeds = [
    'Cream shirt dress with a deep V neckline, elbow-length sleeves',
    'cotton-jersey wrap top tied at the waist',
    'ivory silk-blend tank shell tucked cleanly',
    'blouse with a plunging neckline and gathered cuffs',
  ];
  for (const seed of seeds) {
    const once = applyNeckline(seed);
    let repeated = seed;
    for (let pass = 0; pass < 8; pass += 1) repeated = applyNeckline(repeated);
    assert.equal(repeated, once, `"${seed}" is not stable under repeated passes`);
    assert.doesNotMatch(repeated, /(\b\w+\b)\s+\1\b/i, `"${repeated}" repeats a word`);
    assert.doesNotMatch(repeated, /does not expose.*does not expose/i);
  }
});

test('neckline safety still removes unsafe necklines', () => {
  assert.doesNotMatch(applyNeckline('top with a plunging neckline'), /plunging/i);
  assert.doesNotMatch(applyNeckline('off-shoulder blouse'), /off-shoulder/i);
  assert.doesNotMatch(applyNeckline('strapless midi dress'), /strapless/i);
});

test('colour stripping does not strand conjunctions or prepositions', () => {
  const cases: Array<[string, RegExp]> = [
    ['Charcoal and white horizontal stripe cotton-poplin overshirt', /^horizontal stripe cotton-poplin overshirt$/],
    ['Slate blue and white printed silk scarf', /^printed silk scarf$/],
    ['earthy silk scarf in rose and brown tied close to the neck', /^earthy silk scarf tied close to the neck$/],
    ['trousers, full-length to ground the look in navy', /^trousers, full-length to ground the look$/],
  ];
  for (const [input, expected] of cases) {
    const output = stripColourWords(input);
    assert.match(output, expected, `"${input}" -> "${output}"`);
    assert.doesNotMatch(output, /(^|\s)(and|or|in|with|of)(\s*[-–—])?\s*$/i, `"${output}" ends on a stranded word`);
    assert.doesNotMatch(output, /\band-\s/i, `"${output}" contains a dangling "and-"`);
    assert.doesNotMatch(output, /\s\.\s|\s\.$/, `"${output}" contains a stranded full stop`);
  }
});
