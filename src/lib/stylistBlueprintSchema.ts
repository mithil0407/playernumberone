import type { StylistBlueprintReportData } from './stylistBlueprintGenerator.ts';

export const STYLIST_BLUEPRINT_LEGACY_VERSION = 'women_blueprint_28_v1' as const;
export const STYLIST_BLUEPRINT_36_VERSION = 'women_blueprint_36_v1' as const;
export const STYLIST_BLUEPRINT_37_VERSION = 'women_blueprint_37_v1' as const;
export const STYLIST_BLUEPRINT_39_VERSION = 'women_blueprint_39_v1' as const;
export const STYLIST_BLUEPRINT_41_VERSION = 'women_blueprint_41_v1' as const;
export const STYLIST_BLUEPRINT_VERSION = 'women_blueprint_studio_55_v1' as const;
export const STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT = 28;
export const STYLIST_BLUEPRINT_36_PAGE_COUNT = 36;
export const STYLIST_BLUEPRINT_37_PAGE_COUNT = 37;
export const STYLIST_BLUEPRINT_39_PAGE_COUNT = 39;
export const STYLIST_BLUEPRINT_41_PAGE_COUNT = 41;
export const STYLIST_BLUEPRINT_PAGE_COUNT = 55;
export const STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT = 12;
export const STYLIST_BLUEPRINT_OUTFIT_COUNT = 20;

function versionOf(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return typeof dataOrVersion === 'string' ? dataOrVersion : dataOrVersion?.version;
}

export function isLatestStylistBlueprintVersion(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): boolean {
  const version = versionOf(dataOrVersion);
  return !version || version === STYLIST_BLUEPRINT_VERSION;
}

// v39 kept the same "modern" prescription layout as v41 but without the two extra beauty pages
// (Hair Colour, Makeup). These predicates let the page getters serve both versions correctly.
function isStylistBlueprint39(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): boolean {
  return versionOf(dataOrVersion) === STYLIST_BLUEPRINT_39_VERSION;
}

function isStylistBlueprint41(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): boolean {
  const version = versionOf(dataOrVersion);
  return version === STYLIST_BLUEPRINT_41_VERSION;
}

function isStylistBlueprintStudio(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): boolean {
  const version = versionOf(dataOrVersion);
  return !version || version === STYLIST_BLUEPRINT_VERSION;
}

function isStylistBlueprint39Or41(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): boolean {
  return isStylistBlueprint39(dataOrVersion) || isStylistBlueprint41(dataOrVersion);
}

export function getStylistBlueprintPageCount(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number {
  const version = versionOf(dataOrVersion);
  if (version === STYLIST_BLUEPRINT_LEGACY_VERSION) return STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT;
  if (version === STYLIST_BLUEPRINT_36_VERSION) return STYLIST_BLUEPRINT_36_PAGE_COUNT;
  if (version === STYLIST_BLUEPRINT_37_VERSION) return STYLIST_BLUEPRINT_37_PAGE_COUNT;
  if (version === STYLIST_BLUEPRINT_39_VERSION) return STYLIST_BLUEPRINT_39_PAGE_COUNT;
  if (version === STYLIST_BLUEPRINT_41_VERSION) return STYLIST_BLUEPRINT_41_PAGE_COUNT;
  return STYLIST_BLUEPRINT_PAGE_COUNT;
}

export function getStylistBlueprintOutfitCount(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number {
  return versionOf(dataOrVersion) === STYLIST_BLUEPRINT_LEGACY_VERSION
    ? STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT
    : STYLIST_BLUEPRINT_OUTFIT_COUNT;
}

export function getStylistBlueprintTransformationPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  const version = versionOf(dataOrVersion);
  return isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint39Or41(dataOrVersion) || version === STYLIST_BLUEPRINT_37_VERSION ? 2 : null;
}

export function getStylistBlueprintSummaryPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 3 : 2;
}

export function getStylistBlueprintReadingGuidePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 4 : 3;
}

export function getStylistBlueprintBodyGeometryPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 5 : 4;
}

export function getStylistBlueprintChromaticPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 6 : 5;
}

export function getStylistBlueprintFaceArchitecturePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 7 : 6;
}

export function getStylistBlueprintProportionPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 8 : 7;
}

export function getStylistBlueprintAvoidancePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 9 : 8;
}

export function getStylistBlueprintPalettePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 10 : 9;
}

export function getStylistBlueprintColourDrapePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint39Or41(dataOrVersion) ? 11 : null;
}

export function getStylistBlueprintRulesStartPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint39Or41(dataOrVersion)) return 12;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 11 : 10;
}

export function getStylistBlueprintHairstylePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint39Or41(dataOrVersion) ? 13 : null;
}

// New in v41 — sits directly after Hairstyle Direction.
export function getStylistBlueprintHairColourPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint41(dataOrVersion) ? 14 : null;
}

export function getStylistBlueprintEyeframePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint41(dataOrVersion)) return 15;
  return isStylistBlueprint39(dataOrVersion) ? 14 : null;
}

// New in v41 — sits directly after Eyeframe Direction.
export function getStylistBlueprintMakeupPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint41(dataOrVersion) ? 16 : null;
}

export function getStylistBlueprintHairFaceAccessoriesPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint39Or41(dataOrVersion)) return null;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 12 : 11;
}

export function getStylistBlueprintFabricPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion) || isStylistBlueprint41(dataOrVersion)) return 17;
  if (isStylistBlueprint39(dataOrVersion)) return 15;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 13 : 12;
}

export function getStylistBlueprintOutfitSystemPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion)) return 31;
  if (isStylistBlueprint41(dataOrVersion)) return 18;
  if (isStylistBlueprint39(dataOrVersion)) return 16;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 14 : 13;
}

export function getStylistBlueprintOutfitStartPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprintStudio(dataOrVersion)) return 32;
  if (isStylistBlueprint41(dataOrVersion)) return 19;
  if (isStylistBlueprint39(dataOrVersion)) return 17;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 15 : 14;
}

export function getStylistBlueprintOutfitEndPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintOutfitStartPage(dataOrVersion) + getStylistBlueprintOutfitCount(dataOrVersion) - 1;
}

export function getStylistBlueprintMatrixPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintPageCount(dataOrVersion) - (isStylistBlueprintStudio(dataOrVersion) ? 3 : 2);
}

export function getStylistBlueprintAuditPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintPageCount(dataOrVersion) - (isStylistBlueprintStudio(dataOrVersion) ? 2 : 1);
}

export function getStylistBlueprintShoppingPlanPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) ? getStylistBlueprintPageCount(dataOrVersion) - 1 : null;
}

export const STYLIST_BLUEPRINT_STUDIO_GUIDES = [
  { page: 18, key: 'tops', title: 'Tops, Necklines & Sleeves' },
  { page: 19, key: 'layers', title: 'Layers & Jackets' },
  { page: 20, key: 'trousers', title: 'Trousers for You' },
  { page: 21, key: 'jeans', title: 'Jeans for You' },
  { page: 22, key: 'skirts', title: 'Skirts for You' },
  { page: 23, key: 'dresses', title: 'Dresses & Jumpsuits' },
  { page: 24, key: 'indian_wear', title: 'Indian & Fusion Wear' },
  { page: 25, key: 'lingerie', title: 'Lingerie Foundations' },
  { page: 26, key: 'shapewear', title: 'Shapewear Guide' },
  { page: 27, key: 'footwear', title: 'Footwear for You' },
  { page: 28, key: 'jewellery', title: 'Jewellery & Face Accessories' },
  { page: 29, key: 'finishing', title: 'Bags, Belts & Scarves' },
  { page: 30, key: 'shopping_fit', title: 'Shopping & Fit Checklist' },
] as const;

export function getStylistBlueprintStudioGuidePages(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprintStudio(dataOrVersion) ? STYLIST_BLUEPRINT_STUDIO_GUIDES : [];
}

/**
 * The wardrobe manual: the fabric page plus the thirteen "for you" guides that
 * run from Tops through the Shopping & Fit Checklist. These are dense reference
 * pages with no generated image of their own, so they read after the outfits
 * rather than standing between the client and the twenty looks she came for.
 * Only the studio layout has them; earlier versions return null and keep their
 * original single "Your rules" run.
 */
export function getStylistBlueprintWardrobeManualRange(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  const guides = getStylistBlueprintStudioGuidePages(dataOrVersion);
  const lastGuide = guides.at(-1)?.page;
  if (!lastGuide) return null;
  return { firstPage: getStylistBlueprintFabricPage(dataOrVersion), lastPage: lastGuide };
}

/**
 * Reading order for the studio report — the order pages are shown in, which is
 * no longer the order they are numbered in. The outfit system and the twenty
 * outfits are lifted above the wardrobe manual so the client reaches the looks
 * first and the manual becomes the reference section behind them.
 *
 * Page numbers are deliberately left alone: image slots, generation, repair and
 * validation all address pages by number, so moving the reading order here keeps
 * every one of those untouched. Derived from the page getters rather than
 * written out, so it cannot drift if the layout gains a page.
 */
export function getStylistBlueprintReadingOrder(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number[] | null {
  const manual = getStylistBlueprintWardrobeManualRange(dataOrVersion);
  if (!manual) return null;
  const outfitSystemPage = getStylistBlueprintOutfitSystemPage(dataOrVersion);
  const outfitEndPage = getStylistBlueprintOutfitEndPage(dataOrVersion);
  const pageCount = getStylistBlueprintPageCount(dataOrVersion);
  const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
  const order = [
    ...range(1, manual.firstPage - 1),
    ...range(outfitSystemPage, outfitEndPage),
    ...range(manual.firstPage, manual.lastPage),
    ...range(outfitEndPage + 1, pageCount),
  ];
  // A dropped or duplicated page here would silently lose pages from the report,
  // so fall back to the numeric order rather than render an incomplete manual.
  if (order.length !== pageCount || new Set(order).size !== pageCount) return null;
  return order;
}

export function getStylistBlueprintContinuationPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintPageCount(dataOrVersion);
}

export function getStylistBlueprintCapsulePageRanges(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  const start = getStylistBlueprintOutfitStartPage(dataOrVersion);
  const perCapsule = getStylistBlueprintOutfitCount(dataOrVersion) / 4;
  return Array.from({ length: 4 }, (_, index) => ({
    firstPage: start + index * perCapsule,
    lastPage: start + (index + 1) * perCapsule - 1,
  }));
}

export function isVersionedStylistBlueprintReportData(data: unknown): data is StylistBlueprintReportData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const record = data as { version?: unknown; pages?: unknown };
  return (
    (
      record.version === STYLIST_BLUEPRINT_VERSION
      || record.version === STYLIST_BLUEPRINT_41_VERSION
      || record.version === STYLIST_BLUEPRINT_39_VERSION
      || record.version === STYLIST_BLUEPRINT_37_VERSION
      || record.version === STYLIST_BLUEPRINT_36_VERSION
      || record.version === STYLIST_BLUEPRINT_LEGACY_VERSION
    )
    && Array.isArray(record.pages)
  );
}

/**
 * The reader-facing section a page belongs to. This is the label in the page
 * corner and the grouping in the viewer's contents sheet, so the two can never
 * disagree about where a page lives.
 */
export function getStylistBlueprintSectionLabel(pageNumber: number, dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  const manual = getStylistBlueprintWardrobeManualRange(dataOrVersion);
  if (pageNumber === getStylistBlueprintTransformationPage(dataOrVersion)) return 'Three looks';
  if (pageNumber <= getStylistBlueprintReadingGuidePage(dataOrVersion)) return 'Start here';
  if (pageNumber <= getStylistBlueprintAvoidancePage(dataOrVersion)) return 'What we found';
  // The manual reads after the outfits, so it carries its own label. Without
  // the split, 'Your rules' would appear twice in the contents sheet as two
  // disconnected runs with the outfits wedged between them.
  if (manual && pageNumber >= manual.firstPage && pageNumber <= manual.lastPage) return 'Your wardrobe manual';
  if (pageNumber <= (getStylistBlueprintStudioGuidePages(dataOrVersion).at(-1)?.page ?? getStylistBlueprintFabricPage(dataOrVersion))) return 'Your rules';
  if (pageNumber <= getStylistBlueprintOutfitEndPage(dataOrVersion)) return 'Your outfits';
  return 'Putting it to work';
}

/**
 * The pages a reader actually sees, in reading order: studio-hidden pages are
 * dropped (unless `includeHidden`, for the editor) and the studio's page order
 * is applied. The report renderer and the viewer chrome both call this, so the
 * page counter in the corner and the contents sheet always agree.
 */
export function getVisibleStylistBlueprintPages<T extends { page_number: number }>(
  data: Pick<StylistBlueprintReportData, 'version' | 'studio'> & { pages: T[] },
  options: { hideContinuationPage?: boolean; includeHidden?: boolean } = {},
): T[] {
  const continuationPage = getStylistBlueprintContinuationPage(data);
  const hiddenPages = new Set(data.studio?.hidden_page_numbers ?? []);
  // A stylist who has reordered pages by hand wins. Anything else — no stored
  // order, or the untouched 1..N identity order some studio actions write —
  // reads in the layout's own order, which puts the outfits before the manual.
  const storedOrder = data.studio?.page_order ?? [];
  const stylistReordered = storedOrder.length > 0 && storedOrder.some((pageNumber, index) => pageNumber !== index + 1);
  const order = stylistReordered ? storedOrder : getStylistBlueprintReadingOrder(data) ?? storedOrder;
  const orderIndex = new Map(order.map((pageNumber, index) => [pageNumber, index]));
  return [...data.pages]
    .filter(page => !options.hideContinuationPage || page.page_number !== continuationPage)
    .filter(page => options.includeHidden || !hiddenPages.has(page.page_number))
    .sort((a, b) => (orderIndex.get(a.page_number) ?? a.page_number) - (orderIndex.get(b.page_number) ?? b.page_number));
}
