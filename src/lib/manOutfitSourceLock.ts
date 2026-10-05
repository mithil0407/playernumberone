import { checkManColourLock, restoreManSourceColour } from './manOutfitColour';
import { parseManOutfitsFromSection } from './manOutfitSection';

/** The garment lines of a board look that the colour lock protects. */
export interface ManOutfitColourSource {
  top: string;
  layer: string;
  bottom: string;
  footwear: string;
}

type LockedField = 'top' | 'layer' | 'bottom' | 'footwear';

const FIELD_LINE = /^([ \t]*[-•]?[ \t]*\**[ \t]*(TOP|LAYER|BOTTOM|FOOTWEAR)[ \t]*\**[ \t]*:[ \t]*\**[ \t]*)(.+?)([ \t]*\**[ \t]*)$/gim;
const NO_LAYER = /^\s*(none|no layer|n\/a)\b/i;

export interface ManColourDrift {
  outfitNumber: number;
  field: LockedField;
  expected: string;
  found: string;
}

function eachLockedLine(
  block: string,
  visit: (field: LockedField, value: string) => string | null,
): string {
  return block.replace(FIELD_LINE, (line, prefix: string, label: string, value: string, suffix: string) => {
    const next = visit(label.toLowerCase() as LockedField, value.trim());
    return next === null ? line : `${prefix}${next}${suffix}`;
  });
}

function sourceLine(source: ManOutfitColourSource, field: LockedField): string | null {
  const line = source[field];
  if (!line || (field === 'layer' && NO_LAYER.test(line))) return null;
  return line;
}

/** Every garment line whose colour no longer matches its board look. */
export function findManSection4ColourDrift(
  section4: string,
  sources: Map<number, ManOutfitColourSource>,
): ManColourDrift[] {
  const drift: ManColourDrift[] = [];
  for (const outfit of parseManOutfitsFromSection(section4)) {
    const source = sources.get(outfit.number);
    if (!source) continue;
    eachLockedLine(outfit.block, (field, value) => {
      const expectedLine = sourceLine(source, field);
      if (!expectedLine || NO_LAYER.test(value)) return null;
      const result = checkManColourLock(expectedLine, value);
      if (!result.ok) drift.push({ outfitNumber: outfit.number, field, expected: result.expected, found: result.found || 'no colour' });
      return null;
    });
  }
  return drift;
}

/**
 * Puts each board look's colour phrase back at the start of any garment line
 * that drifted ("Burgundy cotton chore jacket" from a red source becomes "Red
 * cotton chore jacket"). Lines it can't safely rewrite are left for QA.
 */
export function restoreManSection4SourceColours(
  section4: string,
  sources: Map<number, ManOutfitColourSource>,
): string {
  let result = section4;
  for (const outfit of parseManOutfitsFromSection(section4)) {
    const source = sources.get(outfit.number);
    if (!source) continue;
    const fixed = eachLockedLine(outfit.block, (field, value) => {
      const expectedLine = sourceLine(source, field);
      if (!expectedLine || NO_LAYER.test(value)) return null;
      if (checkManColourLock(expectedLine, value).ok) return null;
      const restored = restoreManSourceColour(expectedLine, value);
      return restored && checkManColourLock(expectedLine, restored).ok ? restored : null;
    });
    if (fixed !== outfit.block) result = result.replace(outfit.block, fixed);
  }
  return result;
}
