import assert from 'node:assert/strict';
import test from 'node:test';

import { readStyleScanPhotoUploadResponse } from './styleScanPhotoUploadResponse.ts';

test('uses the upload confirmation header when Safari exposes an empty body', async () => {
  const response = new Response('', {
    status: 200,
    headers: { 'X-ICONIK-Upload-URL': 'https://images.example.test/photo.jpeg' },
  });

  assert.equal(
    await readStyleScanPhotoUploadResponse(response),
    'https://images.example.test/photo.jpeg',
  );
});

test('uses a valid JSON upload response', async () => {
  const response = Response.json({ url: 'https://images.example.test/photo.jpeg' });
  assert.equal(
    await readStyleScanPhotoUploadResponse(response),
    'https://images.example.test/photo.jpeg',
  );
});

test('replaces Safari JSON syntax errors with an actionable message', async () => {
  const response = new Response('', { status: 200 });
  await assert.rejects(
    () => readStyleScanPhotoUploadResponse(response),
    /without confirmation/i,
  );
});
