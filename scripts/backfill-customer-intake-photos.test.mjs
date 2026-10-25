import assert from 'node:assert/strict';
import test from 'node:test';
import { MARKETS, destinationPath, parseLegacyPhotoUrl } from './backfill-customer-intake-photos.mjs';

const origin = 'https://example.supabase.co';
test('accepts only same-project legacy public object URLs', () => {
  assert.equal(parseLegacyPhotoUrl(`${origin}/storage/v1/object/public/au-intake-photos/public/a.jpg`, origin, 'au-intake-photos'), 'public/a.jpg');
  assert.equal(parseLegacyPhotoUrl('https://evil.example/storage/v1/object/public/au-intake-photos/public/a.jpg', origin, 'au-intake-photos'), null);
  assert.equal(parseLegacyPhotoUrl(`${origin}/storage/v1/object/public/globe-intake-photos/public/a.jpg`, origin, 'au-intake-photos'), null);
  assert.equal(parseLegacyPhotoUrl(`${origin}/storage/v1/object/public/au-intake-photos/public/%2e%2e/a.jpg`, origin, 'au-intake-photos'), null);
});
test('Man historical photos have a private backfill target for all three views', () => {
  assert.equal(MARKETS.man.target, 'man-intake-private');
  assert.deepEqual(Object.keys(MARKETS.man.fields).sort(), ['photo_fullbody_url', 'photo_headshot_url', 'photo_side_profile_url']);
  assert.equal(parseLegacyPhotoUrl(`${origin}/storage/v1/object/public/man-intake-photos/public/man-intake-sessions/abc/fullbody.jpg`, origin, MARKETS.man.source), 'public/man-intake-sessions/abc/fullbody.jpg');
});
test('destination keys are deterministic and do not contain customer paths', () => {
  const first = destinationPath('au-intake-photos', 'public/customer@example.com/headshot.jpeg');
  assert.equal(first, destinationPath('au-intake-photos', 'public/customer@example.com/headshot.jpeg'));
  assert.match(first, /^legacy\/[0-9a-f]{64}\.jpg$/);
  assert.equal(first.includes('customer@example.com'), false);
  assert.notEqual(first, destinationPath('globe-intake-photos', 'public/customer@example.com/headshot.jpeg'));
});
