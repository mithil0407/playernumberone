import type { StylistBlueprintReportData } from './stylistBlueprintGenerator';

export const STYLIST_BLUEPRINT_LEGACY_VERSION = 'women_blueprint_28_v1' as const;
export const STYLIST_BLUEPRINT_VERSION = 'women_blueprint_36_v1' as const;
export const STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT = 28;
export const STYLIST_BLUEPRINT_PAGE_COUNT = 36;
export const STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT = 12;
export const STYLIST_BLUEPRINT_OUTFIT_COUNT = 20;

function versionOf(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return typeof dataOrVersion === 'string' ? dataOrVersion : dataOrVersion?.version;
}

export function getStylistBlueprintPageCount(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number {
  return versionOf(dataOrVersion) === STYLIST_BLUEPRINT_LEGACY_VERSION
    ? STYLIST_BLUEPRINT_LEGACY_PAGE_COUNT
    : STYLIST_BLUEPRINT_PAGE_COUNT;
}

export function getStylistBlueprintOutfitCount(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null): number {
  return versionOf(dataOrVersion) === STYLIST_BLUEPRINT_LEGACY_VERSION
    ? STYLIST_BLUEPRINT_LEGACY_OUTFIT_COUNT
    : STYLIST_BLUEPRINT_OUTFIT_COUNT;
}

export function getStylistBlueprintOutfitStartPage() {
  return 14;
}

export function getStylistBlueprintOutfitEndPage(dataOrVersion?: Pick<StylistBlueprintReportData, 'version'> | string | null) {
  return getStylistBlueprintOutfitStartPage() + getStylistBlueprintOutfitCount(dataOrVersion) - 1;
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
  const start = getStylistBlueprintOutfitStartPage();
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
    (record.version === STYLIST_BLUEPRINT_VERSION || record.version === STYLIST_BLUEPRINT_LEGACY_VERSION)
    && Array.isArray(record.pages)
  );
}
