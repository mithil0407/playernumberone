import assert from 'node:assert/strict';
import test from 'node:test';
import { statedIntakeConstraints, summarisePiecePreferences } from './stylistIntakePreferences.ts';

// The exact piece_preferences payload written by a stylist-run consultation
// (intake_source: india_consultation) for report 4ec6da7f.
const consultationIntake = {
  loved: ['sarees', 'indian', 'vacations', 'lip shades', 'more of workwear', 'less of other'],
  avoided: ['loose plazzos'],
  footwear: ['1.2-2 inch heel'],
  outfit_ratio: 'More Ethnic',
  colour_family: ['Earthy colours (Navy blue', 'rust', 'terracotta)'],
  least_favourites: ['loose plazzos'],
  metal_preference: 'Silver',
};

// The shape written by the self-serve web form.
const webIntake = {
  tops: { liked: ['wrap_blouse'], disliked: ['halter'], skipped: [] },
};

test('flat consultation preferences reach the prompt instead of reporting "none"', () => {
  const summary = summarisePiecePreferences(consultationIntake);
  assert.doesNotMatch(summary, /liked=none/, 'flat intake was being summarised as empty');
  for (const expected of ['sarees', 'loose plazzos', '1.2-2 inch heel', 'More Ethnic', 'Silver']) {
    assert.ok(summary.includes(expected), `summary is missing "${expected}":\n${summary}`);
  }
});

test('nested web-form preferences still summarise as before', () => {
  const summary = summarisePiecePreferences(webIntake);
  assert.match(summary, /liked=/);
  assert.ok(summary.includes('wrap blouse') || summary.includes('wrap_blouse'));
});

test('stated constraints name the things the outfits kept breaking', () => {
  const constraints = statedIntakeConstraints({ piece_preferences: consultationIntake });
  assert.match(constraints, /1\.2-2 inch heel/);
  assert.ok(/Never recommend[\s\S]*loose plazzos/.test(constraints));
  assert.match(constraints, /Silver/);
  assert.match(constraints, /More Ethnic/);
});

test('an empty intake produces no constraint block', () => {
  assert.equal(statedIntakeConstraints({ piece_preferences: {} }), '');
  assert.equal(statedIntakeConstraints({ piece_preferences: null }), '');
});
