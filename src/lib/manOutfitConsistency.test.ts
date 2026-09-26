import test from 'node:test';
import assert from 'node:assert/strict';
import { invalidateChangedOutfitImages, missingOutfitImageNumbers, requiresIndianCasual } from './manOutfitConsistency';
import { selectManOutfitLibraryReferences, formatManOutfitLibraryForPrompt } from './manOutfitLibrary';
import { validateManReportSection4 } from './manReportQa';
import { runManOutfitLibraryAssertions } from './manOutfitLibrary.test';
import { runManOutfitSectionAssertions } from './manOutfitSection.test';
import { runManReportQaAssertions } from './manReportQa.test';
import type { ClassificationResult } from './manReportGenerator';

test('existing library, parser and QA assertions execute', () => {
  runManOutfitLibraryAssertions(); runManOutfitSectionAssertions(); runManReportQaAssertions();
});
const block = (number: number, top = 'Navy cotton shirt', rationale = 'Wear for weekends.') => `OUTFIT ${number} — RELAXED CASUAL\nTOP: ${top}\nBOTTOM: Stone trousers\nLAYER: No layer\nFOOTWEAR: Brown loafers\nACCESSORIES: Watch\nOCCASION ANCHOR: ${rationale}`;
const paths = { hairstyleCards: ['hair'], beardCards: ['beard'], eyewearCards: ['frames'], outfitCards: ['one', 'two'], diagnostic: { frameFront: 'body' }, comboGridCards: { relaxed: 'combo' }, deliverables: { linkedinHeadshot: 'headshot', afterImage: 'hero' } };
test('garment edit clears only changed outfit plus dependent composites, preserving unrelated assets', () => {
  const before = `${block(1)}\n\n${block(2)}`;
  const after = `${block(1, 'Ivory cotton kurta')}\n\n${block(2)}`;
  const next = invalidateChangedOutfitImages(paths, before, after);
  assert.deepEqual(next.outfitCards, [null, 'two']);
  assert.equal(next.comboGridCards?.relaxed, null);
  assert.equal(next.deliverables?.afterImage, null);
  assert.equal(next.deliverables?.linkedinHeadshot, 'headshot');
  assert.equal(next.diagnostic?.frameFront, 'body');
  assert.deepEqual(paths.outfitCards, ['one', 'two']);
  assert.deepEqual(missingOutfitImageNumbers(after, next), [1]);
});
test('copy-only edits preserve matching photos', () => {
  assert.equal(invalidateChangedOutfitImages(paths, block(1), block(1, undefined, 'Wear for coffee.')).outfitCards[0], 'one');
});
test('removed or renumbered garments cannot reuse a different outfit photo', () => {
  assert.equal(invalidateChangedOutfitImages(paths, block(1), block(2)).outfitCards[0], null);
  assert.equal(invalidateChangedOutfitImages(paths, block(1), block(2)).outfitCards[1], null);
});
const c = {
  client: { location_region: 'India — Tier 1', primary_goal: 'Dress better' },
  body: { silhouette_type: 'Slim', fit_directive: 'Structured' },
  colour: { season: 'Warm Autumn', undertone: 'Warm', pattern_guidance: '', colours_to_avoid: [] },
  style_brief: { tribes: ['Urban Wear', 'Indian Casual'], primary_brief: 'Indian Casual and urban wardrobe', anti_preferences: '', aesthetic_direction: '', register: 'Dressed Down', expression: 'Minimal', key_aspiration: '' },
} as unknown as ClassificationResult;
test('explicit Indian Casual produces two real kurta sources and consistent prompt/QA', () => {
  const selected = selectManOutfitLibraryReferences(c, undefined, new Date('2026-09-14'));
  assert.equal(selected.filter(x => /kurta/i.test(x.top)).length, 2);
  assert.equal(selected.length, 20);
  // The board's own kurtas are used before any synthesised kurta.
  assert.deepEqual(selected.filter(x => /kurta/i.test(x.top)).map(x => x.tier), ['board', 'board']);
  assert.match(formatManOutfitLibraryForPrompt(c), /first 2 Relaxed Casual sources are everyday kurta looks/);
  assert.ok(validateManReportSection4(block(16), c).issues.some(x => x.code === 'missing_indian_casual'));
  assert.ok(!validateManReportSection4(`${block(16, 'Ivory cotton short kurta')}\n\n${block(17, 'Rust cotton kurta')}`, c).issues.some(x => x.code === 'missing_indian_casual'));
});
test('explicit exclusion wins and Western-only clients retain the default portfolio', () => {
  assert.equal(requiresIndianCasual({ ...c, style_brief: { ...c.style_brief, anti_preferences: 'No Indian wear' } }), false);
  const western = { ...c, style_brief: { ...c.style_brief, tribes: ['Urban Wear'], primary_brief: 'Urban wardrobe' } };
  assert.equal(selectManOutfitLibraryReferences(western).filter(x => /kurta/i.test(x.top)).length, 0);
});
