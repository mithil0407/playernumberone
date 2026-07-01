import type { StylistBlueprintReportData } from './stylistBlueprintGenerator';

export const STYLIST_BLUEPRINT_LEGACY_VERSION = 'women_blueprint_28_v1' as const;
export const STYLIST_BLUEPRINT_36_VERSION = 'women_blueprint_36_v1' as const;
export const STYLIST_BLUEPRINT_37_VERSION = 'women_blueprint_37_v1' as const;
export const STYLIST_BLUEPRINT_39_VERSION = 'women_blueprint_39_v1' as const;
export const STYLIST_BLUEPRINT_VERSION = 'women_blueprint_41_v1' as const;
export const STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT = 28;
export const STYLIST_BLUEPRINT_36_PAGE_COUNT = 36;
export const STYLIST_BLUEPRINT_37_PAGE_COUNT = 37;
export const STYLIST_BLUEPRINT_39_PAGE_COUNT = 39;
export const STYLIST_BLUEPRINT_PAGE_COUNT = 41;
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
  return STYLIST_BLUEPRINT_PAGE_COUNT;
}

export function getStylistBlueprintOutfitCount(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number {
  return versionOf(dataOrVersion) === STYLIST_BLUEPRINT_LEGACY_VERSION
    ? STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT
    : STYLIST_BLUEPRINT_OUTFIT_COUNT;
}

export function getStylistBlueprintTransformationPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  const version = versionOf(dataOrVersion);
  return isStylistBlueprint39Or41(dataOrVersion) || version === STYLIST_BLUEPRINT_37_VERSION ? 2 : null;
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
  return isStylistBlueprint39Or41(dataOrVersion) ? 11 : null;
}

export function getStylistBlueprintRulesStartPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint39Or41(dataOrVersion)) return 12;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 11 : 10;
}

export function getStylistBlueprintHairstylePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprint39Or41(dataOrVersion) ? 13 : null;
}

// New in v41 — sits directly after Hairstyle Direction.
export function getStylistBlueprintHairColourPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprint41(dataOrVersion) ? 14 : null;
}

export function getStylistBlueprintEyeframePage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint41(dataOrVersion)) return 15;
  return isStylistBlueprint39(dataOrVersion) ? 14 : null;
}

// New in v41 — sits directly after Eyeframe Direction.
export function getStylistBlueprintMakeupPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return isStylistBlueprint41(dataOrVersion) ? 16 : null;
}

export function getStylistBlueprintHairFaceAccessoriesPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint39Or41(dataOrVersion)) return null;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 12 : 11;
}

export function getStylistBlueprintFabricPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint41(dataOrVersion)) return 17;
  if (isStylistBlueprint39(dataOrVersion)) return 15;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 13 : 12;
}

export function getStylistBlueprintOutfitSystemPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint41(dataOrVersion)) return 18;
  if (isStylistBlueprint39(dataOrVersion)) return 16;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 14 : 13;
}

export function getStylistBlueprintOutfitStartPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  if (isStylistBlueprint41(dataOrVersion)) return 19;
  if (isStylistBlueprint39(dataOrVersion)) return 17;
  return getStylistBlueprintTransformationPage(dataOrVersion) ? 15 : 14;
}

export function getStylistBlueprintOutfitEndPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintOutfitStartPage(dataOrVersion) + getStylistBlueprintOutfitCount(dataOrVersion) - 1;
}

export function getStylistBlueprintMatrixPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintPageCount(dataOrVersion) - 2;
}

export function getStylistBlueprintAuditPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintPageCount(dataOrVersion) - 1;
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
      || record.version === STYLIST_BLUEPRINT_39_VERSION
      || record.version === STYLIST_BLUEPRINT_37_VERSION
      || record.version === STYLIST_BLUEPRINT_36_VERSION
      || record.version === STYLIST_BLUEPRINT_LEGACY_VERSION
    )
    && Array.isArray(record.pages)
  );
}
