import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveStylistBlueprintImageUrls, stylistBlueprintStudioImageUrl, uniqueStylistBlueprintImagePath } from './stylistBlueprintImageGenerator.ts';
import { isStudioImageRequest } from './stylistWorkspaceSecurity.ts';
import { cropAvoidingCorner, watermarkCorner } from '../components/imageUploadPrep.ts';

test('studio image links stay the same across reloads, so the browser reuses them', async () => {
  const path = 'report-1/outfit-3-client-1761600000000.jpg';
  assert.equal(stylistBlueprintStudioImageUrl(path), stylistBlueprintStudioImageUrl(path));
  assert.equal(stylistBlueprintStudioImageUrl(path), `/api/stylist-blueprint/report-1/image?p=${encodeURIComponent(path)}`);
  const resolved = await resolveStylistBlueprintImageUrls({ cover: { portrait: path } } as never);
  assert.equal(resolved?.cover?.portrait, stylistBlueprintStudioImageUrl(path));
  assert.doesNotMatch(String(resolved?.cover?.portrait), /token=|\/object\/sign\//);
});

test('every stored image gets its own path, so a cached copy is never an old picture', () => {
  assert.equal(uniqueStylistBlueprintImagePath('r', 'outfit-3-client', 1761600000000), 'r/outfit-3-client-1761600000000.jpg');
  // Names that already carry a timestamp are left alone.
  assert.equal(uniqueStylistBlueprintImagePath('r', 'cover-manual-1761600000000', 1), 'r/cover-manual-1761600000000.jpg');
  assert.equal(uniqueStylistBlueprintImagePath('r', 'silhouette-proof-1-regen-1761600000000', 1), 'r/silhouette-proof-1-regen-1761600000000.jpg');
});

test('only the studio image link keeps its own short private cache', () => {
  assert.equal(isStudioImageRequest('/api/stylist-blueprint/abc/image', 'GET'), true);
  assert.equal(isStudioImageRequest('/api/stylist-blueprint/abc/image', 'POST'), false);
  assert.equal(isStudioImageRequest('/api/stylist-blueprint/abc/assets', 'GET'), false);
  assert.equal(isStudioImageRequest('/api/stylist-blueprint/share/tok/image', 'GET'), false);
  const route = readFileSync('src/app/api/stylist-blueprint/[reportId]/image/route.ts', 'utf8');
  assert.match(route, /canAccessBlueprintReport\(reportId\)/);
  assert.match(route, /path\.startsWith\(`\$\{reportId\}\/`\)/);
  assert.match(route, /private, max-age=/);
});

test('the Flow watermark corner is cropped out, losing as little of the picture as possible', () => {
  // A 9:16 Flow portrait into a 2:3 frame: full width kept, nudged up just past the mark.
  const crop = cropAvoidingCorner({ width: 900, height: 1600, aspect: 2 / 3, corner: watermarkCorner(0) });
  assert.equal(Math.round(crop.width), 900);
  assert.equal(Math.round(crop.height), 1350);
  assert.ok(crop.top + crop.height <= 1600 - 0.18 * 900 + 0.001, 'bottom edge stays above the mark');
  assert.ok(crop.top > 0 && crop.top < 125, 'stays close to the centred crop');
  // A 2:3 image in a 2:3 frame has to zoom in a little; the crop stays the frame's shape.
  const tight = cropAvoidingCorner({ width: 1024, height: 1536, aspect: 2 / 3, corner: watermarkCorner(0) });
  assert.ok(Math.abs(tight.width / tight.height - 2 / 3) < 1e-9);
  assert.ok(tight.top + tight.height <= 1536 - 0.18 * 1024 + 0.001 || tight.left + tight.width <= 1024 - 0.18 * 1024 + 0.001);
});

test('after a quarter turn the mark is in a different corner', () => {
  assert.deepEqual(watermarkCorner(0), { right: true, bottom: true });
  assert.deepEqual(watermarkCorner(90), { right: false, bottom: true });
  assert.deepEqual(watermarkCorner(180), { right: false, bottom: false });
  assert.deepEqual(watermarkCorner(270), { right: true, bottom: false });
});
