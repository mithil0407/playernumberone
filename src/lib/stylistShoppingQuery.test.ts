import assert from 'node:assert/strict';
import test from 'node:test';
import { shoppingQueryForPiece, shoppingSearchUrl } from './stylistShoppingQuery.ts';
import { buildHarnessFormulaItemsForTest } from './stylistBlueprintGenerator.ts';
import { SAFE_NECKLINES, applyNecklineSafetyToPiece } from './stylistBlueprintTextSafety.ts';

// Every piece below is verbatim from the sent report
// f1e3f97a-623a-4bd1-882e-95c171c4e857, whose Shop links searched for the wrong
// garment on 36 of 140 pieces.

test('the search is the garment the stylist wrote, not its fit notes', () => {
  assert.equal(
    shoppingQueryForPiece({ piece: 'Teal emerald satin-back crepe trousers, high-rise, straight-leg silhouette, full length to ground the frame', slot: 'Bottom', colourName: 'Teal' }),
    'Teal emerald satin-back crepe trousers women',
  );
  assert.equal(
    shoppingQueryForPiece({ piece: 'Linear gold drop earrings to elongate the neck.', slot: 'Jewellery', colourName: 'Muted Gold' }),
    'Linear gold drop earrings women',
  );
  assert.equal(
    shoppingQueryForPiece({ piece: 'Dark indigo straight-leg denim (non-distressed, tailored finish), high-rise, full length to ground the look.', slot: 'Bottom' }),
    'Dark indigo straight-leg denim women',
  );
});

test('a print that identifies the garment is kept', () => {
  assert.equal(
    shoppingQueryForPiece({ piece: 'Deep plum straight-cut matte crepe kurta, modest V-neckline, three-quarter sleeves, featuring a fine blue-and-white vertical stripe pattern, falling to just above the knee with clean side slits.', slot: 'Top', colourName: 'Plum' }),
    'Deep plum straight-cut matte crepe kurta blue-and-white vertical stripe women',
  );
  assert.equal(
    shoppingQueryForPiece({ piece: 'Rust-red fine ribbed-knit cotton kurti, small-scale cream paisley print, high round neck', slot: 'Top', colourName: 'Rust' }),
    'Rust-red fine ribbed-knit cotton kurti cream paisley women',
  );
});

test('a palette name never contradicts the colour the stylist wrote', () => {
  const cases: Array<[string, string, string, string]> = [
    ['Burgundy button-down A-line kurta with front slit', 'Dress', 'Garnet Red', 'Burgundy button-down A-line kurta women'],
    ['Beige ballet flats', 'Footwear', 'Soft Stone', 'Beige ballet flats women'],
    ['Tan structured tote bag', 'Bag', 'Rust Earth', 'Tan structured tote bag women'],
    ['High-waisted white wide-leg trousers', 'Bottom', 'Antique Ivory', 'High-waisted white wide-leg trousers women'],
    ['Wide-leg dark denim trousers', 'Bottom', 'Rich Navy', 'Wide-leg dark denim trousers women'],
    ['clear-strap heeled sandals', 'Footwear', 'Clear', 'clear-strap heeled sandals women'],
    ['High-waisted wide-leg trousers in a subtle chevron pattern', 'Bottom', 'Charcoal Grey', 'High-waisted wide-leg trousers chevron women'],
  ];
  for (const [piece, slot, colourName, expected] of cases) {
    assert.equal(shoppingQueryForPiece({ piece, slot, colourName }), expected, piece);
  }
});

test('a palette colour is added in plain words, and only to garments, shoes and bags', () => {
  assert.equal(shoppingQueryForPiece({ piece: 'structured leather bag', slot: 'Bag', colourName: 'Soft Stone' }), 'beige structured leather bag women');
  assert.equal(shoppingQueryForPiece({ piece: 'Soft Stone leather loafers', slot: 'Footwear', colourName: 'Soft Stone' }), 'beige leather loafers women');
  assert.equal(shoppingQueryForPiece({ piece: 'dressy block heels', slot: 'Footwear', colourName: 'Charcoal Grey' }), 'charcoal grey dressy block heels women');
  assert.equal(shoppingQueryForPiece({ piece: 'sunglasses', slot: 'Jewellery', colourName: 'Charcoal Grey' }), 'sunglasses women');
  assert.equal(shoppingQueryForPiece({ piece: 'Statement drop earrings', slot: 'Jewellery', colourName: 'Muted Gold' }), 'Statement drop earrings women');
  // The stylist's own single-word colour is hers, even where it is also a palette word.
  assert.equal(shoppingQueryForPiece({ piece: 'Pearl drop earrings', slot: 'Jewellery', colourName: 'Pearl' }), 'Pearl drop earrings women');
  // A palette name made only of non-colour words adds nothing.
  assert.equal(shoppingQueryForPiece({ piece: 'silk kurta', slot: 'Top', colourName: 'Majestic Dusk' }), 'silk kurta women');
});

test('pieces nobody can shop for get no link', () => {
  assert.equal(shoppingQueryForPiece({ piece: 'None.', slot: 'Eyewear', colourName: 'Oat Stone' }), '');
  assert.equal(shoppingQueryForPiece({ piece: 'Muted terracotta lip tone', slot: 'Finishing Detail', colourName: 'Terracotta' }), '');
  assert.equal(shoppingQueryForPiece({ piece: 'Deep berry lip tone (muted berry)', slot: 'Finishing Detail' }), '');
});

test('frames search as eyeglasses, and a heel height is not read as a sentence', () => {
  assert.equal(
    shoppingQueryForPiece({ piece: 'Slim dark tortoiseshell rectangular frames to provide angular contrast to the round face.', slot: 'Eyewear', colourName: 'Oat Stone' }),
    'Slim dark tortoiseshell rectangular frames eyeglasses women',
  );
  assert.equal(
    shoppingQueryForPiece({ piece: 'Tan 1.2-2 inch block-heel sandals', slot: 'Footwear', colourName: 'Tan' }),
    'Tan block-heel sandals women',
  );
});

test('the link is a Google Shopping search scoped to India for Indian clients', () => {
  const url = new URL(shoppingSearchUrl('Tan leather pointed-toe flats women', 'India'));
  assert.equal(url.searchParams.get('q'), 'Tan leather pointed-toe flats women');
  assert.equal(url.searchParams.get('udm'), '28');
  assert.equal(url.searchParams.get('gl'), 'in');
  assert.equal(new URL(shoppingSearchUrl('x', 'Australia')).searchParams.get('gl'), null);
});

// --- The generator keeps what the stylist wrote --------------------------------
// The Shop link can only be as right as the piece it searches for. These pin the
// generator so the card, the image and the link match the prose.

function pieceFor(items: Array<{ slot: string; piece: string }>, slot: string) {
  return items.find(item => item.slot === slot)?.piece ?? '';
}

test('a wearable shoe and bag are kept exactly as written', () => {
  const items = buildHarnessFormulaItemsForTest({
    outfit: {
      footwear: 'Tan leather pointed-toe flats',
      bag: 'Tan structured leather laptop tote',
    },
  });
  assert.equal(pieceFor(items, 'Footwear'), 'Tan leather pointed-toe flats');
  assert.equal(pieceFor(items, 'Bag'), 'Tan structured leather laptop tote');
});

test('metallic shoes and clutches are real finishes, not colours to replace', () => {
  const items = buildHarnessFormulaItemsForTest({
    outfit: {
      footwear: 'Gold-toned metallic pointed-toe flats',
      bag: 'Gold metallic structured box clutch',
    },
  });
  // Shipped as "Charcoal Grey dressy block heels" and "Charcoal Grey structured leather bag".
  assert.equal(pieceFor(items, 'Footwear'), 'Gold-toned metallic pointed-toe flats');
  assert.equal(pieceFor(items, 'Bag'), 'Gold metallic structured box clutch');
});

test('an unwearable shoe colour is swapped in place and the shoe keeps its shape', () => {
  const items = buildHarnessFormulaItemsForTest({ outfit: { footwear: 'Teal suede pointed-toe flats' } });
  const footwear = pieceFor(items, 'Footwear');
  assert.match(footwear, /suede pointed-toe flats$/);
  assert.doesNotMatch(footwear, /teal/i);
});

test('a stated heel still overrides a flat the model wrote', () => {
  const items = buildHarnessFormulaItemsForTest({
    heelPreferred: true,
    statedHeel: '1.2-2 inch heel',
    outfit: { footwear: 'Tan leather pointed-toe flats' },
  });
  assert.match(pieceFor(items, 'Footwear'), /1\.2-2 inch/);
});

test('a shirt with its collar "lying flat" is not treated as a shoe', () => {
  const items = buildHarnessFormulaItemsForTest({
    outfit: {
      top: 'Rust-toned cotton-poplin shirt, fine white vertical pinstripe, modest spread collar lying flat, long sleeves buttoned neatly at the wrist',
      finishing: 'Fine silk scarf in a tonal plum-and-teal print, tied neatly to the handle of the clutch',
    },
  });
  const top = pieceFor(items, 'Top');
  assert.match(top, /^Rust-toned cotton-poplin shirt, fine white vertical pinstripe/);
  assert.doesNotMatch(top, /modest V-neckline/, 'a collared shirt already states its neckline');
  assert.match(pieceFor(items, 'Finishing Detail'), /plum-and-teal print/);
});

test('three-quarter sleeves are a fraction, not a choice between two pieces', () => {
  const items = buildHarnessFormulaItemsForTest({
    outfit: { top: 'Plum matte crepe tunic, modest boat neck, 3/4 sleeves, clean straight fall ending at the upper hip' },
  });
  assert.equal(pieceFor(items, 'Top'), 'Plum matte crepe tunic, modest boat neck, 3/4 sleeves, clean straight fall ending at the upper hip');
});

test('a neckline the piece already states is not contradicted', () => {
  const rules = { necklineRequired: true, approvedNecklines: SAFE_NECKLINES };
  for (const piece of [
    'Rust-red fine ribbed-knit cotton kurti, small-scale cream paisley print, high round neck, elbow-length sleeves',
    'Teal emerald Chanderi silk kurta, vertical metallic gold pinstripes, modest V-slit neckline',
    'Sage-green soft brushed cotton shirt-style top, modest notched collar lying flat',
  ]) {
    assert.equal(applyNecklineSafetyToPiece(piece, 'Top', rules), piece);
  }
  assert.equal(
    applyNecklineSafetyToPiece('Teal-green fine-ribbed knit jumpsuit top, modest wrap-style neckline (secured)', 'Top', rules),
    'Teal-green fine-ribbed knit jumpsuit top, modest wrap-style neckline (secured)',
  );
});
