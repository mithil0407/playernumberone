import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetryableStylistGenerationError } from './stylistGenerationRetry.ts';
import { assertStylistPageApprovals, assertStylistReportDraft } from './stylistReportValidation.ts';
import { getStylistBlueprintImageCounts, STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS } from './stylistBlueprintImageGenerator.ts';
import {
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintOutfitSystemPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintSectionLabel,
  getStylistBlueprintWardrobeManualRange,
  getVisibleStylistBlueprintPages,
} from './stylistBlueprintSchema.ts';
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

type OrderableReport = Pick<StylistBlueprintReportData, 'version' | 'studio'> & { pages: Array<{ page_number: number }> };

function allPages(pageOrder: number[] = []): OrderableReport {
  return {
    version: STYLIST_BLUEPRINT_VERSION,
    studio: { analysis_confirmed: false, hidden_page_numbers: [], page_order: pageOrder },
    pages: Array.from({ length: getStylistBlueprintPageCount(STYLIST_BLUEPRINT_VERSION) }, (_, index) => ({ page_number: index + 1 })),
  };
}

test('the client reaches her outfits before the wardrobe manual, and loses no page doing it', () => {
  const data = allPages();
  const version = STYLIST_BLUEPRINT_VERSION;
  const order = getVisibleStylistBlueprintPages(data, {}).map(page => page.page_number);
  const manual = getStylistBlueprintWardrobeManualRange(version)!;

  // Nothing is dropped or duplicated by the reorder.
  assert.equal(order.length, getStylistBlueprintPageCount(version));
  assert.equal(new Set(order).size, order.length);
  assert.equal(order[0], 1, 'the cover still opens the report');

  // Every outfit page reads before every page of the manual.
  const lastOutfit = order.indexOf(getStylistBlueprintOutfitEndPage(version));
  const firstManual = order.indexOf(manual.firstPage);
  assert.ok(firstManual > lastOutfit, 'the manual must read after the outfits');
  assert.equal(order.indexOf(getStylistBlueprintOutfitSystemPage(version)) + 1, order.indexOf(getStylistBlueprintOutfitStartPage(version)), 'the outfit system still introduces the outfits');

  // The manual stays intact, and the closing pages stay last.
  const manualSlice = order.slice(firstManual, firstManual + (manual.lastPage - manual.firstPage + 1));
  assert.deepEqual(manualSlice, Array.from({ length: manual.lastPage - manual.firstPage + 1 }, (_, i) => manual.firstPage + i));
  assert.equal(order.at(-1), getStylistBlueprintPageCount(version));
});

test('each contents section is one unbroken run once the manual moves', () => {
  const data = allPages();
  const seen: string[] = [];
  for (const page of getVisibleStylistBlueprintPages(data, {})) {
    const raw = getStylistBlueprintSectionLabel(page.page_number, STYLIST_BLUEPRINT_VERSION);
    // The viewer folds the one-page transformation preview into the opening.
    const label = raw === 'Three looks' ? 'Start here' : raw;
    if (seen.at(-1) !== label) seen.push(label);
  }
  assert.equal(new Set(seen).size, seen.length, `a section is split across the report: ${seen.join(' > ')}`);
  assert.deepEqual(seen, ['Start here', 'What we found', 'Your rules', 'Your outfits', 'Your wardrobe manual', 'Putting it to work']);
});

test('a stylist who reordered pages by hand keeps their order', () => {
  const handOrder = [1, 3, 2, ...Array.from({ length: 52 }, (_, index) => index + 4)];
  assert.deepEqual(getVisibleStylistBlueprintPages(allPages(handOrder), {}).map(page => page.page_number), handOrder);
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

test('delivery only waits on the rule-example images the rules page actually shows', () => {
  // A live report stalled here: its rules page carried three example outfits,
  // the count demanded a fourth, and the stylist had no frame to upload it in.
  const rulesPage = {
    page_number: 12,
    page_type: 'rules',
    title: 'Rules for Perfect Fit',
    blocks: [{
      label: 'Fit',
      items: [0, 1, 2].map(index => ({ guidance: `Rule ${index + 1}`, example_outfit: { image_slot: `application.silhouetteProofs.${index}` } })),
    }],
  };
  const report = { ...draft(), pages: [...draft().pages, rulesPage] } as unknown as StylistBlueprintReportData;
  const options = { hasFrontPhoto: true, hasSidePhoto: true, hasHeadshot: true, hasClientPhoto: true,
    includeTransformationPreview: true, includeBeautyPages: true, includeClosingEditTeaser: false, reportData: report };

  const paths = { application: {
    transformationLooks: ['a.jpg', 'b.jpg', 'c.jpg'],
    silhouetteProofs: ['d.jpg', 'e.jpg', 'f.jpg', null],
  } } as unknown as StylistBlueprintImagePaths;
  const counts = getStylistBlueprintImageCounts(paths, options);
  assert.equal(counts.application.total, 6);
  assert.equal(counts.application.done, 6);

  // The proofs the page does show are still required.
  const partial = { application: { transformationLooks: ['a.jpg', 'b.jpg', 'c.jpg'], silhouetteProofs: ['d.jpg', null, null, null] } };
  assert.equal(getStylistBlueprintImageCounts(partial as unknown as StylistBlueprintImagePaths, options).application.done, 4);
});
