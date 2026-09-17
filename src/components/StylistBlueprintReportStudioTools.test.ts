import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Image tools (Replace, Crop, prompts, Regenerate) render only when a page passes
// these props. Pages a client can open must never pass them.
const STUDIO_PROPS = /\b(onImageUpload|onImageRegenerate|imagePrompts|uploadingImageSlot|regeneratingImageSlot)\s*=/;
const CLIENT_PAGES = ['src/app/stylist/report/[shareToken]/page.tsx', 'src/app/blueprint-preview/page.tsx'];

test('client-facing report pages never enable the stylist image tools', () => {
  for (const page of CLIENT_PAGES) {
    assert.doesNotMatch(readFileSync(page, 'utf8'), STUDIO_PROPS, `${page} must not pass studio image props`);
  }
});

test('the report loads studio image code lazily and only for studio slots', () => {
  const report = readFileSync('src/components/StylistBlueprintReport.tsx', 'utf8');
  assert.match(report, /dynamic\(\(\) => import\('@\/components\/ImageSlotStudioTools'\)/);
  assert.match(report, /dynamic\(\(\) => import\('@\/components\/ImageCropDialog'\)/);
  assert.doesNotMatch(report, /^import (?!type)[^;]*ImageSlotStudioTools/m);
  assert.doesNotMatch(report, /^import (?!type)[^;]*ImageCropDialog/m);
  assert.match(report, /const isStudio = canUpload \|\| canRegenerate \|\| Boolean\(prompt\);/);
  assert.match(report, /\{isStudio && \(\s*<ImageSlotStudioTools/);
});
