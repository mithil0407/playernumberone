export type ComboGridKind = 'office' | 'evening' | 'relaxed';

export interface ParsedComboGridLook {
  name: string;
  outfitSummary: string;
  logic: string;
  source: string;
}

export interface ParsedComboGridGroup {
  kind: ComboGridKind;
  title: string;
  looks: ParsedComboGridLook[];
}

export type ComboGridNormaliseResult =
  | { ok: true; text: string; groups: ParsedComboGridGroup[] }
  | { ok: false; error: string; groups: ParsedComboGridGroup[] };

export type ComboGridGroupNormaliseResult =
  | { ok: true; text: string; group: ParsedComboGridGroup }
  | { ok: false; error: string; groups: ParsedComboGridGroup[] };

const COMBO_GRID_GROUPS: Array<{ kind: ComboGridKind; title: string; headingPattern: RegExp }> = [
  { kind: 'office', title: 'Office Basic Combinations', headingPattern: /\boffice\b|\bformal\b/i },
  { kind: 'evening', title: 'Evening Outfit Combinations', headingPattern: /\bevening\b/i },
  { kind: 'relaxed', title: 'Relaxed Casual Combinations', headingPattern: /\brelaxed\b|\bcasual\b/i },
];

const REQUIRED_FIELD_NAMES = ['outfit summary', 'logic', 'source'] as const;

function cleanInlineText(value: string): string {
  return value
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s*/, '')
    .trim();
}

function fieldValue(block: string, labels: string[]): string {
  const labelPattern = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(
    `(?:^|\\n)\\s*[-*]?\\s*\\*{0,2}(?:${labelPattern})\\*{0,2}\\s*:\\s*(.+?)(?=\\n\\s*[-*]?\\s*\\*{0,2}(?:Outfit summary|Full outfit summary|Logic|Why it suits this client|Why it works|Source)\\*{0,2}\\s*:|\\n\\s*####\\s|$)`,
    'is',
  );
  return cleanInlineText(block.match(pattern)?.[1] ?? '');
}

function groupDetails(kind: ComboGridKind) {
  return COMBO_GRID_GROUPS.find(group => group.kind === kind)!;
}

export function comboGridGroupTitle(kind: ComboGridKind): string {
  return groupDetails(kind).title;
}

function kindFromHeading(heading: string): ComboGridKind | null {
  return COMBO_GRID_GROUPS.find(group => group.headingPattern.test(heading))?.kind ?? null;
}

function sectionBlocks(text: string): Array<{ kind: ComboGridKind; block: string }> {
  const headings = Array.from(text.matchAll(/^###\s+(.+)$/gim));
  const blocks: Array<{ kind: ComboGridKind; block: string }> = [];

  for (let index = 0; index < headings.length; index++) {
    const kind = kindFromHeading(headings[index][1]);
    if (!kind) continue;

    const start = headings[index].index ?? 0;
    const end = headings[index + 1]?.index ?? text.length;
    blocks.push({ kind, block: text.slice(start, end).trim() });
  }

  return blocks;
}

function parseCanonicalGroup(kind: ComboGridKind, block: string): ParsedComboGridGroup | null {
  const headings = Array.from(block.matchAll(/^####\s+(.+)$/gim));
  if (headings.length !== 3) return null;

  const looks = headings.map((heading, index) => {
    const start = heading.index ?? 0;
    const end = headings[index + 1]?.index ?? block.length;
    const lookBlock = block.slice(start, end);
    return {
      name: cleanInlineText(heading[1]),
      outfitSummary: fieldValue(lookBlock, ['Outfit summary', 'Full outfit summary']),
      logic: fieldValue(lookBlock, ['Logic', 'Why it suits this client', 'Why it works']),
      source: fieldValue(lookBlock, ['Source']),
    };
  });

  if (looks.some(look => !look.name || !look.outfitSummary || !look.logic || !look.source)) {
    return null;
  }

  return { kind, title: groupDetails(kind).title, looks };
}

function splitPipeRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return null;

  const withoutOuterPipes = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells = withoutOuterPipes.split('|').map(cell => cell.trim());
  return cells.length >= 3 ? cells : null;
}

function isDelimiterCells(cells: string[]): boolean {
  return cells.length >= 3 && cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()));
}

function labelledCellValue(cell: string, labels: string[]): string {
  const labelPattern = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return cleanInlineText(
    cell.replace(new RegExp(`^\\s*\\*{0,2}(?:${labelPattern})\\*{0,2}\\s*:\\s*`, 'i'), ''),
  );
}

function parseLegacyTableGroup(kind: ComboGridKind, block: string): ParsedComboGridGroup | null {
  const rows = block.split('\n')
    .map(splitPipeRow)
    .filter((row): row is string[] => !!row);

  const delimiterIndex = rows.findIndex(isDelimiterCells);
  if (delimiterIndex < 1) return null;

  const names = rows[delimiterIndex - 1].slice(0, 3).map(cleanInlineText);
  const valueRows = rows.slice(delimiterIndex + 1);
  const summaryRow = valueRows.find(row => /outfit\s+summary|full\s+outfit\s+summary/i.test(row.join(' ')));
  const logicRow = valueRows.find(row => /\blogic\b|why\s+it\s+(?:suits|works)/i.test(row.join(' ')));
  const sourceRow = valueRows.find(row => /\bsource\b|derived\s+from/i.test(row.join(' ')));

  if (!summaryRow || !logicRow || !sourceRow || names.length !== 3) return null;

  const looks = names.map((name, index) => ({
    name,
    outfitSummary: labelledCellValue(summaryRow[index] ?? '', ['Outfit summary', 'Full outfit summary']),
    logic: labelledCellValue(logicRow[index] ?? '', ['Logic', 'Why it suits this client', 'Why it works']),
    source: labelledCellValue(sourceRow[index] ?? '', ['Source']),
  }));

  if (looks.some(look => !look.name || !look.outfitSummary || !look.logic || !look.source)) {
    return null;
  }

  return { kind, title: groupDetails(kind).title, looks };
}

export function parseComboGridText(text: string): ParsedComboGridGroup[] {
  return sectionBlocks(text)
    .map(({ kind, block }) => parseCanonicalGroup(kind, block) ?? parseLegacyTableGroup(kind, block))
    .filter((group): group is ParsedComboGridGroup => !!group);
}

export function serialiseComboGridText(groups: ParsedComboGridGroup[]): string {
  const orderedGroups = COMBO_GRID_GROUPS.map(({ kind }) => groups.find(group => group.kind === kind)!);
  const sections = orderedGroups.map(serialiseComboGridGroup);

  return `## SECTION 5: YOUR COMBINATION GRID GUIDE\n\n${sections.join('\n\n')}`;
}

export function serialiseComboGridGroup(group: ParsedComboGridGroup): string {
  return [
    `### ${group.title}`,
    '',
    ...group.looks.flatMap(look => [
      `#### ${look.name}`,
      `- Outfit summary: ${look.outfitSummary}`,
      `- Logic: ${look.logic}`,
      `- Source: ${look.source}`,
      '',
    ]),
  ].join('\n').trimEnd();
}

function validateGroupCompleteness(group: ParsedComboGridGroup): string | null {
  if (
    group.looks.length !== 3 ||
    group.looks.some(look => REQUIRED_FIELD_NAMES.some(field => {
      if (field === 'outfit summary') return !look.outfitSummary;
      return !look[field];
    }))
  ) {
    return `${group.title} must include exactly three complete looks.`;
  }

  return null;
}

export function normaliseComboGridText(text: string): ComboGridNormaliseResult {
  const groups = parseComboGridText(text);
  const duplicateKind = groups.find((group, index) =>
    groups.findIndex(candidate => candidate.kind === group.kind) !== index,
  );
  if (duplicateKind) {
    return { ok: false, error: `Combination Grids contains more than one ${duplicateKind.title} section.`, groups };
  }

  const missingTitles = COMBO_GRID_GROUPS
    .filter(({ kind }) => !groups.some(group => group.kind === kind))
    .map(group => group.title);
  if (missingTitles.length > 0) {
    return {
      ok: false,
      error: `Combination Grids must include three complete looks for: ${missingTitles.join(', ')}.`,
      groups,
    };
  }

  const invalidGroup = groups.find(group => validateGroupCompleteness(group));
  if (invalidGroup) {
    return { ok: false, error: validateGroupCompleteness(invalidGroup)!, groups };
  }

  const orderedGroups = COMBO_GRID_GROUPS.map(({ kind }) => groups.find(group => group.kind === kind)!);
  return { ok: true, text: serialiseComboGridText(orderedGroups), groups: orderedGroups };
}

export function normaliseComboGridGroupText(kind: ComboGridKind, text: string): ComboGridGroupNormaliseResult {
  const groupText = text.trim();
  const wrappedText = /^###\s+/im.test(groupText)
    ? groupText
    : `### ${groupDetails(kind).title}\n\n${groupText}`;
  const groups = parseComboGridText(wrappedText);
  const matchingGroups = groups.filter(group => group.kind === kind);
  const unexpectedGroup = groups.find(group => group.kind !== kind);

  if (unexpectedGroup) {
    return {
      ok: false,
      error: `This editor only accepts ${groupDetails(kind).title}. Remove the ${unexpectedGroup.title} section.`,
      groups,
    };
  }

  if (matchingGroups.length !== 1) {
    return {
      ok: false,
      error: `${groupDetails(kind).title} must include exactly three complete looks.`,
      groups,
    };
  }

  const error = validateGroupCompleteness(matchingGroups[0]);
  if (error) return { ok: false, error, groups };

  return {
    ok: true,
    text: serialiseComboGridGroup(matchingGroups[0]),
    group: matchingGroups[0],
  };
}

export function getComboGridGroupText(text: string, kind: ComboGridKind): string | null {
  const group = parseComboGridText(text).find(candidate => candidate.kind === kind);
  return group ? serialiseComboGridGroup(group) : null;
}

export function mergeComboGridGroupText(
  fullText: string,
  kind: ComboGridKind,
  groupText: string,
): ComboGridNormaliseResult {
  const normalisedFull = normaliseComboGridText(fullText);
  if (!normalisedFull.ok) return normalisedFull;

  const normalisedGroup = normaliseComboGridGroupText(kind, groupText);
  if (!normalisedGroup.ok) {
    return {
      ok: false,
      error: normalisedGroup.error,
      groups: normalisedGroup.groups,
    };
  }

  const nextGroups = normalisedFull.groups.map(group =>
    group.kind === kind ? normalisedGroup.group : group,
  );

  return {
    ok: true,
    text: serialiseComboGridText(nextGroups),
    groups: nextGroups,
  };
}

export function stripComboGridTableSeparators(text: string): string {
  return text
    .split('\n')
    .filter(line => {
      const cells = splitPipeRow(line);
      return !cells || !isDelimiterCells(cells);
    })
    .join('\n');
}
