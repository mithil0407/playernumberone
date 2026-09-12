import assert from 'node:assert/strict';
import test from 'node:test';
import {
  colourFamilyOfHex,
  colourFromPieceText,
  snapColourToPalette,
} from './stylistColourMatching.ts';

test('a written garment yields the colour it actually names', () => {
  assert.equal(colourFromPieceText('Mocha satin-silk saree with a plain body')?.name, 'Mocha');
  assert.equal(colourFromPieceText('Ivory handloom cotton saree')?.name, 'Ivory');
  assert.equal(colourFromPieceText('Optic white cotton saree')?.name, 'Optic White');
  // The colour is not always the first word.
  assert.equal(colourFromPieceText('Slim chocolate leather belt')?.name, 'Chocolate');
  assert.equal(colourFromPieceText('a piece naming no colour at all'), null);
});

test('shade modifiers darken or lighten without changing family', () => {
  const plain = colourFromPieceText('Teal chanderi saree');
  const deep = colourFromPieceText('Deep teal chanderi saree');
  assert.ok(plain && deep);
  assert.equal(deep.name, 'Deep Teal');
  assert.notEqual(deep.hex, plain.hex, 'deep teal should not be the same hex as teal');
  assert.equal(colourFamilyOfHex(deep.hex), colourFamilyOfHex(plain.hex), 'it is still teal');
});

test('a colour that must be replaced moves within its own family, not into a neutral', () => {
  // The whole point of snapping by family: an ice blue should become another
  // blue, never a beige, or the look loses the relationship that made it work.
  const palette = [
    { name: 'Warm Ivory', hex: '#F5F0E8' },
    { name: 'Deep Cocoa', hex: '#4B2E24' },
    { name: 'Slate Blue', hex: '#4A6A8A' },
    { name: 'Olive', hex: '#6F7A5E' },
  ];
  const snapped = snapColourToPalette('#B9CBDD', palette);
  assert.equal(snapped?.name, 'Slate Blue', `expected a blue, got ${snapped?.name}`);
});

test('snapping falls back to the whole palette when the family is absent', () => {
  const palette = [{ name: 'Warm Ivory', hex: '#F5F0E8' }, { name: 'Deep Cocoa', hex: '#4B2E24' }];
  const snapped = snapColourToPalette('#7A2A45', palette);
  assert.ok(snapped, 'a colour with no family match should still resolve');
});

test('an empty palette cannot snap', () => {
  assert.equal(snapColourToPalette('#B9CBDD', []), undefined);
});

test('image prompts carry no hex codes and no duplicated colour', async () => {
  const { buildStylistBlueprintManualImagePrompt } = await import('./stylistBlueprintImageGenerator.ts');
  const report = {
    version: 'women_blueprint_studio_55_v1',
    classification: {
      body: { geometry: 'balanced', proportion_directive: 'Lengthen the leg line.', coverage_rules: [], focus_areas: [], silhouette_rules: [] },
      colour: { base_palette: [], accent_palette: [], palette: [], undertone_direction: 'olive', depth: 'deep', contrast: 'high', palette_name: 'x', avoid_colours: [] },
      taste: { style_archetype: 'Structured', anti_codes: [], moodboard: '', signature_codes: [], shopping_filters: [] },
      face_hair_accessories: { approved_necklines: [] },
      client: {}, makeup: {}, fabrics: { approved: [], avoid: [] },
    },
    pages: [{
      page_number: 32,
      page_type: 'outfit',
      title: 'Outfit 1',
      blocks: [{
        label: 'Formula',
        items: [
          // colour_name deliberately disagrees with the garment, as older stored
          // reports do, and carries a hex the image model must never see.
          { slot: 'Layer', piece: 'Navy knitted jacket with gold buttons', colour_name: 'Espresso Olive', colour_hex: '#30261E' },
          { slot: 'Bottom', piece: 'straight trousers', colour_name: 'Charcoal', colour_hex: '#3C3C3C' },
        ],
      }],
    }],
  } as never;

  const { slotDetail } = buildStylistBlueprintManualImagePrompt('application.outfitFlatlays.0', report);
  assert.doesNotMatch(slotDetail, /#[0-9a-f]{6}/i, 'a hex code reached the image prompt');
  assert.match(slotDetail, /Layer: Navy knitted jacket/, 'the garment description should win over palette metadata');
  assert.doesNotMatch(slotDetail, /Espresso Olive/, 'a contradicting palette colour was prepended');
  // A piece that names no colour still gets one, so the model is not left guessing.
  assert.match(slotDetail, /Bottom: Charcoal straight trousers/);
});
