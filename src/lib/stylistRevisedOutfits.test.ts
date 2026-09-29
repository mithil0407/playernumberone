import assert from 'node:assert/strict';
import test from 'node:test';
import type { StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';
import { getStylistBlueprintSectionLabel, getVisibleStylistBlueprintPages } from './stylistBlueprintSchema.ts';
import { assertStylistPageApprovals, assertStylistReportDraft } from './stylistReportValidation.ts';
import { mergeRevisionScope, parseRevisionRequest, revisionRequestForLooks, scopeWithRevisedLooks } from './stylistReportRevisions.ts';
import { outfitPieces, setOutfitPieces } from './stylistOutfitEditor.ts';
import {
  MAX_REVISED_OUTFITS,
  REVISED_OUTFIT_FIRST_PAGE,
  addRevisedOutfits,
  assertRevisedOutfits,
  findRevisedOutfit,
  isBlankRevisedOutfit,
  latestRevisionOf,
  orderedRevisedOutfits,
  removeRevisedOutfit,
  replaceRevisedOutfitPage,
  revisedOutfitIssues,
  revisedOutfitSlotIndexFromKey,
  revisedOutfitSlotKey,
  revisionRoundFor,
  withRevisedOutfitInPlace,
} from './stylistRevisedOutfits.ts';

const OUTFIT_START = 32;

function report(): StylistBlueprintReportData {
  const pages = Array.from({ length: 55 }, (_, index) => {
    const pageNumber = index + 1;
    const outfit = pageNumber >= OUTFIT_START && pageNumber < OUTFIT_START + 20;
    return {
      page_number: pageNumber,
      page_type: outfit ? 'outfit' : 'rules',
      title: outfit ? `Look title ${pageNumber - OUTFIT_START + 1}` : `Page ${pageNumber}`,
      subtitle: outfit ? `Occasion ${pageNumber - OUTFIT_START + 1}` : undefined,
      blocks: [],
    };
  });
  return {
    version: 'women_blueprint_studio_55_v1',
    generated_at: '2026-09-01T00:00:00.000Z',
    client: { display_name: 'Aditi', email: '', month_year: 'September 2026' },
    analysis: { silhouette_profile: '', chromatic_family: '', facial_architecture: '', style_direction: '', proportional_focus: [], evidence_notes: [] },
    classification: { colour: { base_palette: [], accent_palette: [] } },
    pages,
  } as unknown as StylistBlueprintReportData;
}

test('each chosen look gets a blank revised page that keeps its occasion', () => {
  const { data, added } = addRevisedOutfits(report(), { looks: [7, 4], round: 1, now: '2026-09-29T00:00:00.000Z' });
  assert.deepEqual(added.map(entry => [entry.replaces, entry.page.page_number]), [[4, 101], [7, 102]]);
  const look4 = findRevisedOutfit(data, 101)!;
  assert.equal(look4.page.page_type, 'outfit');
  assert.equal(look4.page.title, '');
  assert.equal(look4.page.subtitle, 'Occasion 4');
  assert.equal(outfitPieces(look4.page).length, 4, 'the editor needs its four piece cards');
  assert.ok(isBlankRevisedOutfit(look4));
  // The fixed layout is untouched: everything that counts pages still counts 55.
  assert.equal(data.pages.length, 55);
});

test('adding the same look twice in one round does not duplicate it', () => {
  const first = addRevisedOutfits(report(), { looks: [4], round: 1 });
  const second = addRevisedOutfits(first.data, { looks: [4, 5], round: 1 });
  assert.deepEqual(second.added.map(entry => entry.replaces), [5]);
  assert.equal(second.data.revised_outfits!.length, 2);
  // A later revision of the same look is a new page.
  const third = addRevisedOutfits(second.data, { looks: [4], round: 2 });
  assert.equal(third.added.length, 1);
  assert.equal(latestRevisionOf(third.data, 4)!.round, 2);
});

test('looks outside the report and too many revised looks are refused', () => {
  assert.throws(() => addRevisedOutfits(report(), { looks: [], round: 1 }), /at least one look/);
  assert.throws(() => addRevisedOutfits(report(), { looks: [21], round: 1 }), /no look 21/);
  const full = addRevisedOutfits(report(), { looks: Array.from({ length: 20 }, (_, index) => index + 1), round: 1 });
  assert.equal(full.data.revised_outfits!.length, MAX_REVISED_OUTFITS);
  assert.throws(() => addRevisedOutfits(full.data, { looks: [1], round: 2 }), /20 revised looks in total/);
});

test('a removed look frees its page number for the next one', () => {
  const { data } = addRevisedOutfits(report(), { looks: [2, 3], round: 1 });
  const removed = removeRevisedOutfit(data, 101);
  const again = addRevisedOutfits(removed, { looks: [9], round: 1 });
  assert.equal(again.added[0].page.page_number, 101);
});

function written(data: StylistBlueprintReportData) {
  return { ...data, revised_outfits: data.revised_outfits!.map(entry => ({ ...entry, page: setOutfitPieces(entry.page, outfitPieces(entry.page).map(piece => ({ ...piece, piece: 'Silk shirt' }))) })) };
}

test('the client reads revised looks first, newest revision first, before the outfits', () => {
  let data = addRevisedOutfits(report(), { looks: [9, 3], round: 1 }).data;
  data = written(addRevisedOutfits(data, { looks: [5], round: 2 }).data);
  const order = getVisibleStylistBlueprintPages(data).map(page => page.page_number);
  const system = order.indexOf(31);
  assert.deepEqual(order.slice(system - 3, system + 1), [103, 101, 102, 31]);
  assert.equal(order.length, 58);
  assert.deepEqual(orderedRevisedOutfits(data).map(entry => entry.replaces), [5, 3, 9]);
  assert.equal(getStylistBlueprintSectionLabel(101, data), 'Your revised looks');
});

test('a hand-reordered report still places revised looks before the outfits', () => {
  const base = report();
  const order = base.pages.map(page => page.page_number).reverse();
  const data = written(addRevisedOutfits({ ...base, studio: { analysis_confirmed: true, hidden_page_numbers: [], page_order: order } }, { looks: [1], round: 1 }).data);
  const visible = getVisibleStylistBlueprintPages(data).map(page => page.page_number);
  // Reversed, the outfit run starts at 32; the revised look leads it.
  assert.equal(visible[visible.indexOf(101) + 1], 32);
  assert.ok(visible.indexOf(101) < visible.indexOf(31));
});

test('a blank revised look is shown to the stylist, never to the client', () => {
  const { data } = addRevisedOutfits(report(), { looks: [4], round: 1 });
  assert.ok(!getVisibleStylistBlueprintPages(data).some(page => page.page_number === 101));
  assert.ok(getVisibleStylistBlueprintPages(data, { includeHidden: true }).some(page => page.page_number === 101));
  assert.ok(getVisibleStylistBlueprintPages(written(data)).some(page => page.page_number === 101));
});

test('edits to a revised page stay on that page', () => {
  const { data } = addRevisedOutfits(report(), { looks: [4], round: 1 });
  const entry = findRevisedOutfit(data, 101)!;
  const pieces = outfitPieces(entry.page).map((piece, index) => ({ ...piece, piece: `Piece ${index}` }));
  const next = replaceRevisedOutfitPage(data, { ...setOutfitPieces(entry.page, pieces), title: 'Ivory Saturday' });
  assert.equal(findRevisedOutfit(next, 101)!.page.title, 'Ivory Saturday');
  assert.equal(isBlankRevisedOutfit(findRevisedOutfit(next, 101)!), false);
  assert.equal(next.pages, data.pages);
});

test('a revised look stands in for its original when parsed, validated or prompted', () => {
  const { data } = addRevisedOutfits(report(), { looks: [4], round: 1 });
  const inPlace = withRevisedOutfitInPlace(data, findRevisedOutfit(data, 101)!);
  assert.equal(inPlace.pageNumber, OUTFIT_START + 3);
  const swapped = inPlace.data.pages.find(page => page.page_number === inPlace.pageNumber)!;
  assert.equal(swapped.title, '');
  assert.equal(inPlace.data.pages.length, 55);
});

test('revised image slots are their own and map back to their page', () => {
  assert.equal(revisedOutfitSlotKey(103), 'revision.outfitFlatlays.2');
  assert.equal(revisedOutfitSlotIndexFromKey('revision.outfitFlatlays.2'), 2);
  assert.equal(revisedOutfitSlotIndexFromKey('revision.outfitFlatlays.20'), null);
  assert.equal(revisedOutfitSlotIndexFromKey('application.outfitFlatlays.2'), null);
});

test('the round follows the version the client has', () => {
  assert.equal(revisionRoundFor(null), 1);
  assert.equal(revisionRoundFor(1), 1);
  assert.equal(revisionRoundFor(2), 2);
});

test('stored revised looks are validated, not trusted', () => {
  const { data } = addRevisedOutfits(report(), { looks: [4], round: 1 });
  assert.doesNotThrow(() => assertRevisedOutfits(data.revised_outfits, data));
  assert.doesNotThrow(() => assertRevisedOutfits(undefined, data));
  const entry = data.revised_outfits![0];
  assert.throws(() => assertRevisedOutfits('x', data), /must be a list/);
  assert.throws(() => assertRevisedOutfits([{ ...entry, page: { ...entry.page, page_number: 40 } }], data), /unique and in range/);
  assert.throws(() => assertRevisedOutfits([entry, entry], data), /unique and in range/);
  assert.throws(() => assertRevisedOutfits([{ ...entry, replaces: 21 }], data), /name the look it replaces/);
  assert.throws(() => assertRevisedOutfits([{ ...entry, page: { ...entry.page, blocks: [{ body: 4 }] } }], data), /invalid body/);
});

test('the layout validators still accept a report carrying revised looks', () => {
  const { data } = addRevisedOutfits(report(), { looks: [4], round: 1 });
  assert.doesNotThrow(() => assertStylistReportDraft(data));
  assert.doesNotThrow(() => assertStylistPageApprovals({ p1: true, [`p${REVISED_OUTFIT_FIRST_PAGE}`]: false }, 55));
  assert.throws(() => assertStylistPageApprovals({ p60: true }, 55));
});

test('publishing warns about a blank or imageless revised look, never blocks', () => {
  let data = addRevisedOutfits(report(), { looks: [4, 6], round: 1 }).data;
  const entry = findRevisedOutfit(data, 102)!;
  data = replaceRevisedOutfitPage(data, setOutfitPieces(entry.page, outfitPieces(entry.page).map(piece => ({ ...piece, piece: 'Silk shirt' }))));
  assert.deepEqual(revisedOutfitIssues(data, () => false), [
    'The revised look for Look 4 is still blank.',
    'The revised look for Look 6 has no image yet.',
  ]);
  assert.deepEqual(revisedOutfitIssues(data, pageNumber => pageNumber === 102), ['The revised look for Look 4 is still blank.']);
});

test('the brief points each named look at its new page and lists the unnamed ones', () => {
  const scope = parseRevisionRequest('Can you change look 4? It feels too formal.');
  const linked = scopeWithRevisedLooks(scope, [{ replaces: 4, page_number: 101 }, { replaces: 9, page_number: 102 }]);
  assert.equal(linked.find(item => item.outfit_number === 4)!.page_number, 101);
  assert.deepEqual(linked.at(-1), { id: 'look-9-102', label: 'Write a new Look 9', page_number: 102, outfit_number: 9, done: false });
  assert.equal(revisionRequestForLooks([9, 4, 12]), 'Revise Look 4, Look 9 and Look 12.');
  assert.equal(revisionRequestForLooks([2]), 'Revise Look 2.');
});

test('a second ask joins the open brief without duplicate items or ids', () => {
  const existing = scopeWithRevisedLooks([], [{ replaces: 4, page_number: 101 }]);
  const incoming = [
    { id: 'look-4-101', label: 'Write a new Look 4', page_number: 101, outfit_number: 4, done: false },
    ...parseRevisionRequest('Also swap look 7 please.'),
  ];
  const merged = mergeRevisionScope(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(new Set(merged.map(item => item.id)).size, 2);
});
