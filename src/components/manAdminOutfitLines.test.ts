import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOutfitLines, serialiseOutfitLines, type FieldLine } from './manAdmin/outfitLines.ts';

const CURRENT_BLOCK = `OUTFIT 2 — OFFICE / FORMAL
TOP: Pale grey cotton poplin dress shirt — cutaway collar — tucked
BOTTOM: Mid-grey linen-cotton tailored trousers — straight fit — full clean fall
LAYER: Espresso linen-cotton blazer — patch pockets — half-lined — worn open
FOOTWEAR: Dark brown leather Derby shoes
ACCESSORIES: Navy knitted tie — dark brown leather belt — silver dress watch
OCCASION ANCHOR: Client presentations where structured separates create a slimming vertical channel.`;

const LEGACY_BLOCK = `**Outfit 2 — The Tonal Executive**
- **Top:** Spread-collar dress shirt in pale champagne — tailored — tucked
- **Bottom:** Tailored trousers in dark tan — mid-rise — half break
- **Accessories:** Dark tan leather belt — gold watch`;

test('an untouched block round-trips byte for byte', () => {
  for (const block of [CURRENT_BLOCK, LEGACY_BLOCK]) {
    assert.equal(serialiseOutfitLines(parseOutfitLines(block)), block);
  }
});

test('editing one field changes only that value and keeps the label format', () => {
  const lines = parseOutfitLines(LEGACY_BLOCK);
  const top = lines.find(line => line.kind === 'field' && line.key === 'TOP') as FieldLine;
  top.value = 'Ecru cotton Oxford shirt — button-down collar — tucked';
  const out = serialiseOutfitLines(lines).split('\n');
  assert.equal(out[1], '- **Top:** Ecru cotton Oxford shirt — button-down collar — tucked');
  assert.equal(out[2], LEGACY_BLOCK.split('\n')[2]);
});

test('labels are normalised for the editor while the header stays raw', () => {
  const lines = parseOutfitLines(CURRENT_BLOCK);
  assert.equal(lines[0].kind, 'raw');
  const keys = lines.filter((line): line is FieldLine => line.kind === 'field').map(line => line.key);
  assert.deepEqual(keys, ['TOP', 'BOTTOM', 'LAYER', 'FOOTWEAR', 'ACCESSORIES', 'OCCASION ANCHOR']);
  assert.equal(parseOutfitLines('ACCESSORY: Steel watch')[0].kind === 'field' && (parseOutfitLines('ACCESSORY: Steel watch')[0] as FieldLine).key, 'ACCESSORIES');
});
