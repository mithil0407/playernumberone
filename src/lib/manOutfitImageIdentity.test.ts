import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSourceLockedOutfitIdentityRules } from './manOutfitImageIdentity.ts';

test('stubble classifications produce a clean-shaven outfit-image rule', () => {
  const rules = buildSourceLockedOutfitIdentityRules('stubble');

  assert.match(rules, /fresh clean-shaven or near-clean-shaven/i);
  assert.match(rules, /faint natural shadow already visible/i);
  assert.match(rules, /Do not add a beard/i);
  assert.match(rules, /original headshot wins/i);
});

test('outfit-image rules lock the source hairstyle to a tiny tidy-up', () => {
  const rules = buildSourceLockedOutfitIdentityRules('clean_shaven');

  assert.match(rules, /same haircut silhouette, length, part direction/i);
  assert.match(rules, /only allowed hairstyle change is a very small real-world tidy-up/i);
  assert.match(rules, /Do not introduce a side part, quiff, fade, taper, undercut/i);
  assert.match(rules, /Ignore hairstyle and beard recommendations from the report/i);
});

test('existing beards are preserved rather than replaced by recommendation text', () => {
  const rules = buildSourceLockedOutfitIdentityRules('full_beard');

  assert.match(rules, /Preserve the exact facial-hair style, length, density, coverage/i);
  assert.match(rules, /do not replace it with a recommended beard style/i);
});

test('identity rules explicitly prevent generic face replacement', () => {
  const rules = buildSourceLockedOutfitIdentityRules('unclear');

  assert.match(rules, /distinctive eye shape and spacing/i);
  assert.match(rules, /Do not substitute a generic model/i);
  assert.match(rules, /full-body reference is authoritative only for body proportions/i);
});
