import type { BlueprintPage, BlueprintColourUse } from './stylistBlueprintGenerator.ts';

export type OutfitPiece = Record<string, unknown> & { slot: string; piece: string; colour_name: string; colour_hex: string; palette_role: BlueprintColourUse['role']; structural_notes: string };
export function outfitFormulaIndex(page: BlueprintPage) {
  return page.blocks.findIndex(block => /formula|piece|look|outfit/i.test(`${block.label ?? ''} ${block.heading ?? ''}`) && Array.isArray(block.items));
}
export function outfitPieces(page: BlueprintPage): OutfitPiece[] {
  return (page.blocks[outfitFormulaIndex(page)]?.items ?? []).map(raw => {
    const item = raw as Record<string, unknown>;
    return { ...item, slot: String(item.slot ?? ''), piece: String(item.piece ?? item.name ?? ''),
      colour_name: String(item.colour_name ?? ''), colour_hex: String(item.colour_hex ?? '#2C2622'),
      palette_role: (item.palette_role ?? 'support') as BlueprintColourUse['role'], structural_notes: String(item.structural_notes ?? item.guidance ?? '') };
  });
}
export function setOutfitPieces(page: BlueprintPage, pieces: OutfitPiece[]): BlueprintPage {
  const index = outfitFormulaIndex(page);
  const palette = new Map<string, BlueprintColourUse>();
  for (const piece of pieces) if (/^#[0-9a-f]{6}$/i.test(piece.colour_hex)) {
    palette.set(piece.colour_hex.toUpperCase(), { name: piece.colour_name, hex: piece.colour_hex.toUpperCase(), role: piece.palette_role });
  }
  return { ...page, palette_used: [...palette.values()], blocks: page.blocks.map((block, i) => i === index ? { ...block, items: pieces } : block) };
}
export const OUTFIT_COPY_FIELDS = [
  { key: 'why', label: 'Why it works for this client', match: /why/i },
  { key: 'styling', label: 'How to wear it', match: /role breakdown|styling move|one move/i },
  { key: 'avoid', label: 'What to avoid', match: /do not buy|avoid/i },
] as const;
export function outfitCopy(page: BlueprintPage, key: typeof OUTFIT_COPY_FIELDS[number]['key']) {
  const field = OUTFIT_COPY_FIELDS.find(item => item.key === key)!;
  const block = page.blocks.find(block => field.match.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  return block?.body ?? block?.reason ?? '';
}
export function setOutfitCopy(page: BlueprintPage, key: typeof OUTFIT_COPY_FIELDS[number]['key'], value: string): BlueprintPage {
  const field = OUTFIT_COPY_FIELDS.find(item => item.key === key)!;
  const index = page.blocks.findIndex(block => field.match.test(`${block.label ?? ''} ${block.heading ?? ''}`));
  if (index < 0) return { ...page, blocks: [...page.blocks, { label: key === 'why' ? 'Why it works' : key === 'styling' ? 'Styling move' : 'Do not buy', body: value }] };
  return { ...page, blocks: page.blocks.map((block, i) => i === index ? { ...block, body: value, ...(block.reason !== undefined ? { reason: value } : {}) } : block) };
}
