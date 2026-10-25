import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyIntakePhotoStoragePath } from './stylistIntakeStoragePath.ts';

test('classifies private and existing consultation intake paths without changing their bucket', () => {
  assert.deepEqual(classifyIntakePhotoStoragePath('stylist-intake-private/orders/123/photo.jpg'), {
    bucket: 'stylist-intake-private', path: 'orders/123/photo.jpg',
  });
  assert.deepEqual(classifyIntakePhotoStoragePath('consultation-client-uploads/client/123/photo.jpg'), {
    bucket: 'consultation-client-uploads', path: 'client/123/photo.jpg',
  });
  assert.deepEqual(classifyIntakePhotoStoragePath('client/123/photo.jpg'), {
    bucket: 'consultation-client-uploads', path: 'client/123/photo.jpg',
  });
});

test('rejects traversal and missing object paths', () => {
  assert.equal(classifyIntakePhotoStoragePath('stylist-intake-private/../secret'), null);
  assert.equal(classifyIntakePhotoStoragePath('stylist-intake-private/'), null);
  assert.equal(classifyIntakePhotoStoragePath('stylist-intake-private/orders//photo.jpg'), null);
});
