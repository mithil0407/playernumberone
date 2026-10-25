import assert from 'node:assert/strict';
import test from 'node:test';
import { getAUPrivatePhotoPath } from './auIntakePhotoPolicy.ts';

const origin = 'https://example.supabase.co';
const order = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const path = `orders/${order}/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg`;
const url = `${origin}/storage/v1/object/sign/au-intake-private/${path}?token=secret`;

test('AU photo submit rejects cross-order, public, external, and unsigned URLs', () => {
  assert.equal(getAUPrivatePhotoPath(url, order, origin), path);
  assert.equal(getAUPrivatePhotoPath(url, 'cccccccc-cccc-cccc-cccc-cccccccccccc', origin), null);
  assert.equal(getAUPrivatePhotoPath(url.replace('example.supabase.co', 'evil.example'), order, origin), null);
  assert.equal(getAUPrivatePhotoPath(url.replace('/sign/', '/public/'), order, origin), null);
  assert.equal(getAUPrivatePhotoPath(url.replace('?token=secret', ''), order, origin), null);
});
