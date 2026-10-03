// Line-level parsing for one outfit block. Each garment line keeps its own
// prefix and label formatting; only the value after the colon is editable.

const LINE_PATTERN = /^(\s*(?:[-*•]\s*)?(?:\*\*)?)(TOP|LAYER|BOTTOM|FOOTWEAR|ACCESSOR(?:Y|IES)|OCCASION ANCHOR|FIT NOTE|COLOUR LOGIC|WHY IT WORKS)((?:\*\*)?\s*:\s*(?:\*\*)?\s*)(.*)$/i;

export interface FieldLine {
  kind: 'field';
  key: string;      // normalised label, e.g. ACCESSORIES
  prefix: string;
  label: string;    // label exactly as written
  separator: string;
  value: string;
}

export type OutfitLine = FieldLine | { kind: 'raw'; text: string };

function normaliseKey(label: string): string {
  const upper = label.toUpperCase();
  return upper.startsWith('ACCESSOR') ? 'ACCESSORIES' : upper;
}

export function parseOutfitLines(block: string): OutfitLine[] {
  return block.split('\n').map(text => {
    const match = text.match(LINE_PATTERN);
    if (!match) return { kind: 'raw', text } as const;
    return { kind: 'field', key: normaliseKey(match[2]), prefix: match[1], label: match[2], separator: match[3], value: match[4] };
  });
}

export function serialiseOutfitLines(lines: OutfitLine[]): string {
  return lines.map(line => (line.kind === 'raw' ? line.text : `${line.prefix}${line.label}${line.separator}${line.value}`)).join('\n');
}

