import { parseManOutfitsFromSection, hashOutfitBlock } from './manOutfitSection';
import type { ManReportImagePaths } from './manImageGenerator';
import type { ClassificationResult } from './manReportGenerator';

export function requiresIndianCasual(classification: ClassificationResult): boolean {
  const brief = classification.style_brief;
  if (/\b(?:no|avoid|exclude)\s+(?:all\s+)?(?:indian|ethnic)/i.test(brief.anti_preferences ?? '')) return false;
  return /\bindian[\s_-]+casual\b/i.test([...(brief.tribes ?? []), brief.primary_brief].join(' '));
}

/** Hash only the rendered garment specification, not explanatory copy. */
export function outfitVisualSignature(section: string, number: number): string | null {
  const outfit = parseManOutfitsFromSection(section).find(item => item.number === number);
  return outfit ? hashOutfitBlock(JSON.stringify([
    outfit.top, outfit.bottom, outfit.layer, outfit.footwear, outfit.accessories,
  ])) : null;
}

export function invalidateChangedOutfitImages(
  paths: ManReportImagePaths | null | undefined,
  previous: string,
  next: string,
): ManReportImagePaths {
  const count = Math.max(paths?.outfitCards?.length ?? 0,
    ...parseManOutfitsFromSection(next).map(item => item.number), 0);
  let changed = false;
  const outfitCards = Array.from({ length: count }, (_, index) => {
    if (outfitVisualSignature(previous, index + 1) !== outfitVisualSignature(next, index + 1)) {
      changed = true;
      return null;
    }
    return paths?.outfitCards?.[index] ?? null;
  });
  return {
    ...paths,
    hairstyleCards: paths?.hairstyleCards ?? [],
    beardCards: paths?.beardCards ?? [],
    eyewearCards: paths?.eyewearCards ?? [],
    outfitCards,
    ...(changed ? {
      comboGridCards: { office: null, evening: null, relaxed: null },
      deliverables: { ...paths?.deliverables, beforeImage: null, afterImage: null,
        beforeAfter: null, datingProfileShots: [] },
    } : {}),
  };
}

export function missingOutfitImageNumbers(section: string, paths: ManReportImagePaths | null | undefined): number[] {
  return parseManOutfitsFromSection(section)
    .filter(outfit => !paths?.outfitCards?.[outfit.number - 1])
    .map(outfit => outfit.number);
}
