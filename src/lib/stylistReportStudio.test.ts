import assert from 'node:assert/strict';
import test from 'node:test';
import type { BlueprintPage, StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';
import {
  STYLIST_BLUEPRINT_41_VERSION,
  STYLIST_BLUEPRINT_VERSION,
  getStylistBlueprintAuditPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintShoppingPlanPage,
  getStylistBlueprintStudioGuidePages,
} from './stylistBlueprintSchema.ts';
import { checkStudioReportQuality, formatOutfitDraft, moveStudioPage } from './stylistReportStudio.ts';

const outfitPage: BlueprintPage = {
  page_number: 32,
  page_type: 'outfit',
  title: 'Old outfit',
  subtitle: 'Professional',
  blocks: [{ label: 'Formula', items: [] }],
};

test('Studio schema expands to 55 pages without shifting old 41-page reports', () => {
  assert.equal(getStylistBlueprintPageCount(STYLIST_BLUEPRINT_VERSION), 55);
  assert.equal(getStylistBlueprintOutfitStartPage(STYLIST_BLUEPRINT_VERSION), 32);
  assert.equal(getStylistBlueprintStudioGuidePages(STYLIST_BLUEPRINT_VERSION).length, 13);
  assert.equal(getStylistBlueprintMatrixPage(STYLIST_BLUEPRINT_VERSION), 52);
  assert.equal(getStylistBlueprintAuditPage(STYLIST_BLUEPRINT_VERSION), 53);
  assert.equal(getStylistBlueprintShoppingPlanPage(STYLIST_BLUEPRINT_VERSION), 54);
  assert.equal(getStylistBlueprintPageCount(STYLIST_BLUEPRINT_41_VERSION), 41);
  assert.equal(getStylistBlueprintOutfitStartPage(STYLIST_BLUEPRINT_41_VERSION), 19);
});

test('outfit auto-format creates a structured formula and palette', () => {
  const formatted = formatOutfitDraft(`Title: Burgundy Authority\nCapsule: Professional\nFormula:\n- Top | Ivory silk shirt | Ivory | #F4EFE5 | lead | Soft open collar\n- Bottom | Burgundy wide-leg trousers | Burgundy | #6D1F3C | support | Full length\n- Footwear | Espresso loafer | Espresso | #3B251B | ground | Almond toe\nWhy it works: The long lower line balances the frame.\nStyling move: Add a slim gold cuff.\nDo not buy: Cropped trousers with a heavy ankle strap.`, outfitPage);
  assert.equal(formatted.title, 'Burgundy Authority');
  assert.equal(formatted.blocks[0].items?.length, 3);
  assert.equal((formatted.blocks[0].items?.[1] as { piece: string }).piece, 'Burgundy wide-leg trousers');
  assert.equal(formatted.palette_used?.length, 3);
  assert.match(formatted.blocks[1].body ?? '', /balances the frame/);
});

test('module order moves independently of canonical page numbers', () => {
  const data = {
    version: STYLIST_BLUEPRINT_VERSION,
    pages: [],
    studio: { analysis_confirmed: false, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, index) => index + 1) },
  } as unknown as StylistBlueprintReportData;
  const moved = moveStudioPage(data, 22, -1);
  assert.equal(moved.studio?.page_order[20], 22);
  assert.equal(moved.studio?.page_order[21], 21);
});

test('quality check blocks delivery for unconfirmed analysis and incomplete outfit formulas', () => {
  const pages = Array.from({ length: 55 }, (_, index) => ({
    page_number: index + 1,
    page_type: index + 1 >= 32 && index + 1 <= 51 ? 'outfit' : index === 0 ? 'cover' : 'rules',
    title: `Page ${index + 1}`,
    blocks: index === 0 ? [] : [{ body: 'Complete guidance' }],
  })) as BlueprintPage[];
  const data = {
    version: STYLIST_BLUEPRINT_VERSION,
    pages,
    studio: { analysis_confirmed: false, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, index) => index + 1) },
  } as unknown as StylistBlueprintReportData;
  const issues = checkStudioReportQuality(data);
  assert.ok(issues.some(issue => /Confirm the body/.test(issue.message)));
  assert.ok(issues.some(issue => issue.page === 32 && /four structured pieces/.test(issue.message)));
});

test('quality check flags abstract titles, headline-length copy and duplicated fields', () => {
  const pages = Array.from({ length: 55 }, (_, index) => ({
    page_number: index + 1,
    page_type: index + 1 >= 32 && index + 1 <= 51 ? 'outfit' : index === 0 ? 'cover' : 'rules',
    title: `Page ${index + 1}`,
    blocks: index === 0 ? [] : [{ body: 'Complete guidance for the client.' }],
  })) as BlueprintPage[];

  pages[4] = {
    ...pages[4],
    title: 'Architecture for the Rounded Vertical Frame',
    subtitle: 'Depth and Warmth for Olive Undertones',
    blocks: [{
      heading: 'The Proportional Focus',
      body: 'Belt at the natural waist.',
      reason: 'Belt at the natural waist.',
    }],
  };
  pages[5] = {
    ...pages[5],
    title: 'Your colours',
    blocks: [{ body: 'name: Wide leg trouser - reason: it lengthens the leg line.' }],
  };

  const data = {
    version: STYLIST_BLUEPRINT_VERSION,
    pages,
    studio: { analysis_confirmed: true, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, index) => index + 1) },
  } as unknown as StylistBlueprintReportData;

  const issues = checkStudioReportQuality(data);
  assert.ok(issues.some(issue => issue.page === 5 && /abstract label/.test(issue.message)), 'flags the abstract title');
  assert.ok(issues.some(issue => issue.page === 5 && /Title is 6 words/.test(issue.message)), 'flags the over-length title');
  assert.ok(issues.some(issue => issue.page === 5 && /Subtitle is 6 words/.test(issue.message)) === false, 'a 6-word subtitle is within budget');
  assert.ok(issues.some(issue => issue.page === 5 && /body and reason say the same thing/.test(issue.message)), 'flags duplicated body and reason');
  assert.ok(issues.some(issue => issue.page === 6 && /raw field label/.test(issue.message)), 'flags leaked schema labels');
});

test('a plainly written page raises no language issues', () => {
  const pages = Array.from({ length: 55 }, (_, index) => ({
    page_number: index + 1,
    page_type: index + 1 >= 32 && index + 1 <= 51 ? 'outfit' : index === 0 ? 'cover' : 'rules',
    title: 'How your body reads',
    subtitle: undefined,
    pull_quote: 'Your outfits work best when the waist is marked and the leg line runs long.',
    blocks: index === 0 ? [] : [{
      heading: 'Belt at your waist',
      body: 'Wear a belt at your natural waist over untucked shirts.',
      reason: 'It marks the narrowest point instead of letting the shirt widen you.',
    }],
  })) as BlueprintPage[];

  const data = {
    version: STYLIST_BLUEPRINT_VERSION,
    pages,
    studio: { analysis_confirmed: true, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, index) => index + 1) },
  } as unknown as StylistBlueprintReportData;

  const languageIssues = checkStudioReportQuality(data)
    .filter(issue => /abstract label|words|repeats|same thing|raw field label/.test(issue.message));
  assert.deepEqual(languageIssues, []);
});

test('abstract page titles from real reports are flagged', () => {
  const pages = Array.from({ length: 55 }, (_, index) => ({
    page_number: index + 1,
    page_type: index + 1 >= 32 && index + 1 <= 51 ? 'outfit' : index === 0 ? 'cover' : 'rules',
    title: 'Your shape rules',
    blocks: index === 0 ? [] : [{ body: 'Wear a belt at your natural waist.' }],
  })) as BlueprintPage[];

  // Taken from page 12 of report 4ec6da7f as delivered.
  pages[11] = {
    ...pages[11],
    title: 'Silhouette Rules',
    subtitle: 'The Vertical Elongation Framework',
    blocks: [
      { heading: 'The Waist Axis', body: 'Choose a rise above the navel.' },
      { heading: 'Side Slit Verticality', body: 'Choose kurtas with high side slits.' },
      { heading: 'Crisp Shoulder Framing', body: 'Keep the shoulder seam at your shoulder break.' },
    ],
  };

  const data = {
    version: STYLIST_BLUEPRINT_VERSION,
    pages,
    studio: { analysis_confirmed: true, hidden_page_numbers: [], page_order: Array.from({ length: 55 }, (_, index) => index + 1) },
  } as unknown as StylistBlueprintReportData;

  const flagged = checkStudioReportQuality(data)
    .filter(issue => issue.page === 12 && /abstract label/.test(issue.message))
    .map(issue => issue.message)
    .join(' | ');

  assert.match(flagged, /Vertical Elongation Framework/, 'the "-Framework" title should be flagged');
  assert.match(flagged, /Waist Axis/, '"Axis" should be flagged — the pattern used to match only "axes"');
  assert.match(flagged, /Verticality/, 'a nominalised adjective should be flagged');
});
