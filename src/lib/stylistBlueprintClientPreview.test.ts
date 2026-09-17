import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync('src/app/stylist/report/[shareToken]/page.tsx', 'utf8');
const loader = readFileSync('src/lib/stylistBlueprintLoader.ts', 'utf8');

test('the client preview of an unpublished report is gated on report access', () => {
  const branch = page.slice(page.indexOf('async function loadReportForViewer'), page.indexOf('export default async function'));
  assert.match(branch, /getStylistBlueprintClientPreviewByShareToken\(shareToken\)/);
  assert.match(branch, /loaded && await canAccessBlueprintReport\(loaded\.report\.id\)/);
  // Without access the page falls through to the ordinary public loader.
  assert.match(branch, /return report \? \{ report, preview: null \} : null;/);
});

test('the public (cached) loader still hides unpublished consultation reports', () => {
  assert.match(loader, /loadClientReportByShareToken\(shareToken, \{ requireLive: true \}\)/);
  assert.match(loader, /return loaded\?\.live \? loaded\.report : null;/);
  const cached = loader.slice(loader.indexOf('export const getPublicStylistBlueprintByShareToken'));
  assert.match(cached, /loadPublicByShareToken\(shareToken\)/);
  assert.doesNotMatch(cached, /getStylistBlueprintClientPreviewByShareToken|allowUnpublished/);
});
