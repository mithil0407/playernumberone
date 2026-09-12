import assert from 'node:assert/strict';
import test from 'node:test';
import { bannedPieceTerms, parseFootwearPreference, violatesBannedPieces } from './stylistIntakePreferences.ts';

const herIntake = {
  loved: ['sarees', 'indian', 'more of workwear'],
  avoided: ['loose plazzos'],
  footwear: ['1.2-2 inch heel'],
  least_favourites: ['loose plazzos'],
};

test('a stated heel is read off the intake', () => {
  const preference = parseFootwearPreference(herIntake);
  assert.equal(preference.heelPreferred, true);
  assert.equal(preference.statedHeel, '1.2-2 inch heel');
  assert.equal(preference.sneakersWelcome, false);
});

test('no footwear preference means no heel is forced', () => {
  assert.equal(parseFootwearPreference({}).heelPreferred, false);
  assert.equal(parseFootwearPreference(null).heelPreferred, false);
  assert.equal(parseFootwearPreference({ footwear: ['flats only, no heel'] }).heelPreferred, false);
});

test('rejecting palazzos also rejects the wide-leg trousers that replaced them', () => {
  const banned = bannedPieceTerms(herIntake);
  assert.ok(banned.includes('loose plazzos'), 'keeps her own wording');
  assert.ok(banned.some(term => term.includes('wide-leg')), `expected wide-leg to be banned, got ${banned.join(', ')}`);

  // Five outfits in the live report used this exact shape.
  const hits = violatesBannedPieces('Teal-green high-rise wide-leg trousers in fluid suiting fabric', banned);
  assert.ok(hits.length > 0, 'wide-leg trousers should be flagged for this client');
});

test('an intake with nothing avoided bans nothing', () => {
  assert.deepEqual(bannedPieceTerms({}), []);
  assert.deepEqual(violatesBannedPieces('wide-leg trousers', []), []);
});
