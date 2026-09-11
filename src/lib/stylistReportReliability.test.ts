import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetryableStylistGenerationError } from './stylistGenerationRetry.ts';
import { assertStylistPageApprovals, assertStylistReportDraft } from './stylistReportValidation.ts';
import { getStylistBlueprintImageCounts, STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS } from './stylistBlueprintImageGenerator.ts';
import type { StylistBlueprintImagePaths } from './stylistBlueprintImageGenerator.ts';
import type { StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';

function draft() {
  return {
    version: 'women_blueprint_studio_55_v1',
    client: { display_name: 'Test Client' },
    analysis: { silhouette_profile: '', chromatic_family: '', facial_architecture: '', style_direction: '' },
    classification: { colour: { base_palette: [], accent_palette: [] } },
    pages: [{ page_number: 1, page_type: 'cover', title: 'Your style', blocks: [] }],
    studio: { analysis_confirmed: false, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, i) => i + 1) },
  };
}

test('the actual provider deadline failure is retryable; authentication failures are not', () => {
  assert.equal(isRetryableStylistGenerationError(new Error('{"error":{"code":504,"message":"Deadline expired before operation could complete.","status":"DEADLINE_EXCEEDED"}}')), true);
  assert.equal(isRetryableStylistGenerationError(new Error('request timed out')), true);
  assert.equal(isRetryableStylistGenerationError(new Error('fetch failed', { cause: new Error('ECONNRESET') })), true);
  assert.equal(isRetryableStylistGenerationError(new Error('401 invalid API key')), false);
  assert.equal(isRetryableStylistGenerationError(new Error('403 permission denied')), false);
});

test('incomplete checkpoints remain editable but malformed report objects are rejected', () => {
  assert.doesNotThrow(() => assertStylistReportDraft(draft()));
  for (const value of [null, [], {}, { ...draft(), analysis: null }, { ...draft(), classification: {} }, { ...draft(), pages: [null] }]) {
    assert.throws(() => assertStylistReportDraft(value));
  }
  const data = draft();
  data.pages.push(data.pages[0]);
  assert.throws(() => assertStylistReportDraft(data), /unique/);
});

test('page hiding and reordering cannot lose the cover or corrupt navigation', () => {
  assert.throws(() => assertStylistReportDraft({ ...draft(), studio: { ...draft().studio, hidden_page_numbers: [1] } }), /cover/);
  assert.throws(() => assertStylistReportDraft({ ...draft(), studio: { ...draft().studio, page_order: [1, 1] } }), /every page/);
});

test('truthy string approvals and nonexistent pages cannot bypass review', () => {
  assert.doesNotThrow(() => assertStylistPageApprovals({ p1: true, p55: false }, 55));
  for (const value of [{ p1: 'false' }, { p56: true }, { p0: true }, { other: true }, [], null]) {
    assert.throws(() => assertStylistPageApprovals(value, 55));
  }
});

test('uploading every visible image satisfies delivery without invisible legacy slots', () => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const slot of STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS) {
    const [group, name, index] = slot.split('.');
    paths[group] ??= {};
    if (index === undefined) paths[group][name] = 'test.jpg';
    else {
      paths[group][name] ??= [];
      (paths[group][name] as string[])[Number(index)] = 'test.jpg';
    }
  }
  const options = { hasFrontPhoto: true, hasSidePhoto: true, hasHeadshot: true, hasClientPhoto: true,
    includeTransformationPreview: true, includeBeautyPages: true, includeClosingEditTeaser: false };
  const counts = getStylistBlueprintImageCounts(paths as StylistBlueprintImagePaths, options);
  assert.equal(Object.values(counts).reduce((sum, count) => sum + count.total, 0), 36);
  assert.ok(Object.values(counts).every(count => count.done === count.total));
  const report = { ...draft(), studio: { ...draft().studio, hidden_page_numbers: [5, 12, 32] } };
  const hidden = getStylistBlueprintImageCounts(null, { ...options, reportData: report as unknown as StylistBlueprintReportData });
  assert.equal(hidden.diagnosis.total, 2);
  assert.equal(hidden.application.total, 3);
  assert.equal(hidden.capsule_1.total, 4);
});
