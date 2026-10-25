import assert from 'node:assert/strict';
import test from 'node:test';
import { getPrivateStylistPhotoPath, isAllowedStylistPhotoValue } from './stylistPhotoPolicy.ts';

const origin = 'https://sample.supabase.co';
const order = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const otherOrder = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const object = 'cccccccc-cccc-cccc-cccc-cccccccccccc.jpg';
const signed = `${origin}/storage/v1/object/sign/stylist-intake-private/orders/${order}/${object}?token=secret`;

test('accepts only signed private URLs scoped to the matching order and project', () => {
  assert.equal(getPrivateStylistPhotoPath(signed, order, origin), `orders/${order}/${object}`);
  assert.equal(getPrivateStylistPhotoPath(signed, otherOrder, origin), null);
  assert.equal(getPrivateStylistPhotoPath(signed.replace('sample.supabase.co', 'evil.example'), order, origin), null);
  assert.equal(getPrivateStylistPhotoPath(signed.replace('token=secret', ''), order, origin), null);
  assert.equal(getPrivateStylistPhotoPath(signed.replace('/object/sign/', '/object/public/'), order, origin), null);
});

test('accepts a saved legacy URL only for the same order', () => {
  const old = `${origin}/storage/v1/object/public/stylist-intake-photos/public/photo.jpg`;
  assert.equal(isAllowedStylistPhotoValue({ value: old, existingValue: old, orderId: order, supabaseUrl: origin }), true);
  assert.equal(isAllowedStylistPhotoValue({ value: old, orderId: order, supabaseUrl: origin }), false);
  assert.equal(isAllowedStylistPhotoValue({ value: 'https://evil.example/photo.jpg', orderId: order, supabaseUrl: origin }), false);
});
