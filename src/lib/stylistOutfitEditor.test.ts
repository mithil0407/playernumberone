import assert from 'node:assert/strict';
import test from 'node:test';
import { outfitPieces, setOutfitPieces, outfitCopy, setOutfitCopy } from './stylistOutfitEditor.ts';
import { stylistWorkspaceDestination } from './stylistWorkspaceNavigation.ts';
import type { BlueprintPage } from './stylistBlueprintGenerator.ts';

function page(): BlueprintPage {
  return { page_number: 16, title: 'Office', section: 'application', blocks: [
    { label: 'Outfit formula', items: [{ slot: 'Top', piece: 'Navy blouse', colour_name: 'Navy', colour_hex: '#112233', palette_role: 'base', structural_notes: 'Wrap waist', source_id: 'keep-me' }] },
    { label: 'Why it works', body: 'Old explanation', reason: 'Old explanation', custom: 'preserved' },
    { label: 'Shopping tip', body: 'Keep this advice' },
  ] } as unknown as BlueprintPage;
}
test('outfit edits preserve garment metadata, unrelated advice, and the original page', () => {
  const original = page();
  const pieces = outfitPieces(original);
  const updated = setOutfitPieces(original, [{ ...pieces[0], piece: 'Olive blouse', colour_name: 'Olive', colour_hex: '#abcdef' }]);
  assert.equal(outfitPieces(updated)[0].source_id, 'keep-me');
  assert.equal(outfitPieces(updated)[0].structural_notes, 'Wrap waist');
  assert.deepEqual(updated.blocks[2], original.blocks[2]);
  assert.equal(outfitPieces(original)[0].piece, 'Navy blouse');
  assert.deepEqual(updated.palette_used, [{ name: 'Olive', hex: '#ABCDEF', role: 'base' }]);
});
test('editing advice updates both renderer copy fields without dropping metadata', () => {
  const changed = setOutfitCopy(page(), 'why', 'Updated explanation');
  assert.equal(outfitCopy(changed, 'why'), 'Updated explanation');
  assert.equal(changed.blocks[1].reason, 'Updated explanation');
  assert.equal((changed.blocks[1] as Record<string, unknown>).custom, 'preserved');
  const added = setOutfitCopy(changed, 'styling', 'Tuck the front');
  assert.equal(outfitCopy(added, 'styling'), 'Tuck the front');
  assert.equal(added.blocks.length, 4);
});
test('workspace login returns to the selected stylist and rejects path escapes', () => {
  assert.equal(stylistWorkspaceDestination('jazz', '/stylist/jazz/reports/123?page=16'), '/stylist/jazz/reports/123?page=16');
  for (const requested of [null, '//evil.example', 'https://evil.example', '/stylist/priyanka/dashboard', '/stylist/jazz/../../admin', '/stylist/jazz/%2e%2e/admin', '/stylist/jazz/%5cadmin', '/stylist/jazz/%zz', '/stylist/jazz/..%2fadmin']) {
    assert.equal(stylistWorkspaceDestination('jazz', requested), '/stylist/jazz/dashboard', String(requested));
  }
});
