import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getParsedStylistOutfitLibrary,
  isUsableStylistOutfitAnchor,
  parseWomenOutfitLibrary,
} from './stylistOutfitLibraryParser.ts';

const sareeSample = `10 ICONIK WOMEN OUTFITS
INDIAN FESTIVE / FAMILY OCCASION

SAREE: Ruby banarasi silk saree with a dense gold zari border and a plain body. BLOUSE: Ruby raw-silk blouse with a closed round neckline and elbow sleeves. SHOES: Gold juttis. BAG: Gold potli. ACCESSORIES: Kundan chandbalis, stacked gold bangles. STYLING LINE: Keep the blouse plain so the weave stays the only ornament.
`;

test('a saree entry parses instead of being silently dropped', () => {
  const parsed = parseWomenOutfitLibrary(sareeSample);
  assert.equal(parsed.length, 1, 'the entry should parse at all — SAREE: used to yield zero fields');
  const [outfit] = parsed;
  assert.ok(outfit.normalised_slots.length >= 5, 'saree entry should produce real slots');
  assert.ok(isUsableStylistOutfitAnchor(outfit), 'a complete saree look must be usable as an anchor');
});

test('the saree leads the outfit rather than trailing the accessories', () => {
  const [outfit] = parseWomenOutfitLibrary(sareeSample);
  const slots = outfit.normalised_slots.map(slot => slot.slot);
  assert.equal(slots[0], 'Dress', `expected the saree first, got ${slots.join(', ')}`);
  assert.ok(slots.indexOf('Dress') < slots.indexOf('Footwear'), 'the garment must come before the shoes');
});

test('Indian jewellery and bags count towards completeness', () => {
  // "stacked gold bangles" and "Gold potli" previously scored zero, because the
  // patterns were singular-only and had no Indian vocabulary. That cost one
  // point and dropped every festive look below the usability threshold.
  const [outfit] = parseWomenOutfitLibrary(sareeSample);
  assert.ok(outfit.completeness_score >= 5, `completeness was ${outfit.completeness_score}, needs 5+`);
});

test('the shipped library actually contains the ethnic garments the engine can pick', () => {
  const usable = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
  const text = JSON.stringify(usable).toLowerCase();
  for (const garment of ['saree', 'lehenga', 'anarkali', 'churidar', 'sharara', 'salwar']) {
    assert.ok(text.includes(garment), `the library has no usable ${garment} — the engine cannot recommend one`);
  }

  // Ethnic anchors must exist in every capsule, or the per-capsule quota cannot
  // be filled and the last capsule is starved.
  const ETHNIC = /saree|kurta|lehenga|anarkali|salwar|churidar|sharara|dupatta|bandhgala/i;
  for (const capsule of ['Professional', 'Social', 'Everyday', 'Occasion']) {
    const count = usable.filter(o => o.capsule === capsule && ETHNIC.test(JSON.stringify(o))).length;
    assert.ok(count > 0, `no usable ethnic anchor for the ${capsule} capsule`);
  }
});

test('every capsule has enough ethnic anchors of its own to avoid borrowing', () => {
  // Everyday used to hold only three ethnic day-sarees, so the engine borrowed
  // festive silks and put a banarasi wedding saree into an everyday outfit.
  const usable = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
  const ETHNIC = /saree|kurta|lehenga|anarkali|salwar|churidar|sharara|gharara|dupatta|bandhgala/i;
  for (const capsule of ['Professional', 'Social', 'Everyday', 'Occasion']) {
    const count = usable.filter(o => o.capsule === capsule && ETHNIC.test(JSON.stringify(o))).length;
    assert.ok(count >= 3, `${capsule} has only ${count} ethnic anchors and will borrow from another capsule`);
  }
});

test('festive weaves stay out of the everyday capsule', () => {
  const usable = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
  const everydayFestive = usable.filter(o =>
    o.capsule === 'Everyday' && /banarasi|kanjivaram|patola|paithani|lehenga|zari/i.test(JSON.stringify(o)));
  assert.deepEqual(
    everydayFestive.map(o => o.normalised_slots[0]?.piece ?? ''),
    [],
    'heavy festive weaves should not be filed as everyday wear',
  );
});

test('the Social capsule is deep enough to fill a report', () => {
  // Social was the thinnest capsule at 13 anchors while every report needs five
  // social outfits, which forced heavy repetition.
  const usable = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
  const social = usable.filter(o => o.capsule === 'Social').length;
  assert.ok(social >= 20, `only ${social} social anchors for a five-outfit capsule`);
});

test('stylist-described board outfits parse and keep their styling note', async () => {
  const { parsePinterestOutfitLibrary, inferPinterestCapsule } = await import('./stylistOutfitLibraryParser.ts');
  const sample = `# Board
**1.** Sage-green blouse with bishop sleeves / no layer / navy wide-leg culottes / mint pointed pumps / mint top-handle bag, gold cuff. *Styling: blouse worn loose and untucked, sleeves gathered at the cuff.*
**2.** Coral off-shoulder ruched midi dress / no layer / dress / nude ankle-strap heels / ivory bag, small hoops. *Styling: rouching gathered to one hip.*
`;
  const parsed = parsePinterestOutfitLibrary(sample);
  assert.equal(parsed.length, 2);

  const [look, dress] = parsed;
  assert.equal(look.source, 'pinterest');
  // "no layer" is a marker, not a garment.
  assert.ok(!look.normalised_slots.some(slot => /no layer/i.test(slot.piece)), '"no layer" leaked in as a piece');
  assert.ok(look.notes?.[0]?.includes('untucked'), 'the styling note must survive parsing');
  assert.ok(look.normalised_slots.some(slot => /styling line/i.test(slot.slot)), 'styling note should be its own slot');

  // A one-piece look must not produce an empty bottom slot.
  assert.ok(dress.normalised_slots.some(slot => slot.slot === 'Dress'), 'a dress should occupy the one-piece slot');
  assert.ok(!dress.normalised_slots.some(slot => slot.slot === 'Bottom' && /^dress$/i.test(slot.piece)));
});

test('capsule is inferred from the garment vocabulary', async () => {
  const { inferPinterestCapsule } = await import('./stylistOutfitLibraryParser.ts');
  assert.equal(inferPinterestCapsule('white tee, blue jeans, white leather sneakers, canvas tote'), 'Everyday');
  assert.equal(inferPinterestCapsule('charcoal blazer, tailored trousers, pointed pumps, structured work tote'), 'Professional');
  assert.equal(inferPinterestCapsule('floor-length sequin gown with a clutch and metallic heels'), 'Occasion');
  assert.equal(inferPinterestCapsule('black satin bias slip skirt, silk top, strappy heels'), 'Social');
});

test('the ethnic office file loads as Professional, and closes that gap', async () => {
  const { getParsedStylistOutfitLibrary, isUsableStylistOutfitAnchor, outfitCapsules } = await import('./stylistOutfitLibraryParser.ts');
  const usable = getParsedStylistOutfitLibrary().filter(isUsableStylistOutfitAnchor);
  const officeEthnic = usable.filter(o => o.id.startsWith('ethnic-office'));
  assert.ok(officeEthnic.length >= 40, `only ${officeEthnic.length} ethnic office anchors loaded`);
  assert.ok(officeEthnic.every(o => outfitCapsules(o).includes('Professional')), 'office looks must be reachable from Professional');
  assert.ok(officeEthnic.every(o => o.notes?.length), 'every office look should keep its styling note');

  // Professional ethnic was the thinnest capsule in the whole library.
  const ETHNIC = /saree|sari\b|kurta|kurti|lehenga|anarkali|salwar|churidar|sharara|dupatta|bandhgala/i;
  const professionalEthnic = usable.filter(o =>
    outfitCapsules(o).includes('Professional') && ETHNIC.test(JSON.stringify(o))).length;
  assert.ok(professionalEthnic >= 40, `only ${professionalEthnic} ethnic anchors reachable from Professional`);
});

test('an anchor needs a wearable garment relationship, not a photographed shoe', async () => {
  const { parsePinterestOutfitLibrary, isUsableStylistOutfitAnchor } = await import('./stylistOutfitLibraryParser.ts');
  // Shoes cropped out of the photo: the engine fills footwear itself, so this is
  // a usable anchor. It used to be rejected for the missing shoe and the missing
  // bag as two separate failures.
  const cropped = parsePinterestOutfitLibrary(
    '**1.** Beige linen straight kurta with full sleeves / no layer / matching beige tapered trousers / not visible / brown leather tote. *Styling: sleeves rolled to the forearm.*',
  );
  assert.equal(cropped.length, 1);
  assert.ok(isUsableStylistOutfitAnchor(cropped[0]), 'a complete outfit should not be dropped for an unphotographed shoe');

  // A garment relationship is still required.
  const fragment = parsePinterestOutfitLibrary(
    '**2.** Gold hoop earrings / no layer / not visible / not visible / sunglasses. *Styling: nothing here is an outfit.*',
  );
  assert.ok(!fragment.length || !isUsableStylistOutfitAnchor(fragment[0]), 'a bag-and-earrings fragment is not an outfit');
});

test('a pin that photographs two looks parses as two outfits, not one shifted one', async () => {
  const { parsePinterestOutfitLibrary } = await import('./stylistOutfitLibraryParser.ts');
  // Board look 138. Read positionally as a single outfit this put the trousers
  // in Outerwear, the pumps in Bottom, the bag in Footwear, and mashed the whole
  // second look into Accessories — and the report printed it exactly that way.
  const parsed = parsePinterestOutfitLibrary(
    '**138.** *(Two looks)* Left: navy V-neck blouse / rust-red wide-leg trousers / navy pumps / navy bag. Right: rust-red satin blouse / navy pencil midi skirt / red pumps / red bag. *Styling: the same two colours swapped top-to-bottom.*',
  );
  assert.equal(parsed.length, 2, 'a two-look pin should yield two outfits');
  assert.deepEqual(parsed.map(entry => entry.id), ['pinterest-138', 'pinterest-138b']);

  const field = (index: number, label: string) => parsed[index].fields.find(item => item.label === label)?.value;
  assert.equal(field(0, 'Top'), 'navy V-neck blouse');
  assert.equal(field(0, 'Bottom'), 'rust-red wide-leg trousers');
  assert.equal(field(0, 'Footwear'), 'navy pumps');
  assert.equal(field(0, 'Accessories'), 'navy bag');
  assert.equal(field(1, 'Top'), 'rust-red satin blouse');
  assert.equal(field(1, 'Bottom'), 'navy pencil midi skirt');

  // The "(Two looks)" marker is an annotation, never a garment.
  assert.ok(
    parsed.every(entry => entry.fields.every(item => !/two looks|\bleft:|\bright:/i.test(item.value))),
    'the multi-look marker leaked into a piece',
  );
});

test('a one-piece keeps its own slot even when the pin leaves the bottom blank', async () => {
  const { parsePinterestOutfitLibrary } = await import('./stylistOutfitLibraryParser.ts');
  // Board look 68. One-piece-ness used to be read from the bottom segment alone,
  // so a pin that wrote "—" there left the jumpsuit in Top; the outfit engine
  // then saw no bottom and added trousers under it.
  const [jumpsuit] = parsePinterestOutfitLibrary(
    '**68.** Mint-green wide-leg jumpsuit with a V-neck / white tropical-print short-sleeve shirt worn open over it / — / nude heeled sandals / straw half-moon bag. *Styling: printed shirt used as a light open layer.*',
  );
  assert.ok(jumpsuit.fields.some(item => item.label === 'Dress' && /jumpsuit/i.test(item.value)), 'a jumpsuit belongs in the one-piece slot');
  assert.ok(!jumpsuit.fields.some(item => item.label === 'Bottom'), 'a jumpsuit must not carry a separate bottom');

  // A one-piece worn over a genuinely separate bottom still keeps both.
  const [anarkali] = parsePinterestOutfitLibrary(
    '**162.** Royal-blue embellished V-neck anarkali with a beaded yoke / no layer / matching blue palazzo trousers / nude heels / long earrings. *Styling: anarkali over palazzo.*',
  );
  assert.ok(anarkali.fields.some(item => item.label === 'Dress' && /anarkali/i.test(item.value)));
  assert.ok(anarkali.fields.some(item => item.label === 'Bottom' && /palazzo/i.test(item.value)), 'an anarkali still wears its palazzo');

  // A one-piece noun worn as an open layer is outerwear, and keeps its jeans.
  const [duster] = parsePinterestOutfitLibrary(
    '**680.** Black-and-white abstract-print longline shirt-dress worn open / no layer / mid-blue flared jeans / tan boots / gold hoops. *Styling: shirt-dress worn as a duster.*',
  );
  assert.ok(duster.fields.some(item => item.label === 'Bottom' && /jeans/i.test(item.value)), 'a shirt-dress worn open is a layer, not the outfit');
});

test('a pin that skips a position is read by garment rather than by position', async () => {
  const { parsePinterestOutfitLibrary } = await import('./stylistOutfitLibraryParser.ts');
  // Board look 556 names no top at all, so position put the blazer in Top and
  // the skirt in Outerwear.
  const [look] = parsePinterestOutfitLibrary(
    '**556.** Cornflower-blue tailored blazer / matching blue pencil midi skirt / — / not visible / gold necklace. *Styling: blazer and skirt as a set.*',
  );
  assert.ok(look.fields.some(item => item.label === 'Outerwear' && /blazer/i.test(item.value)), 'a blazer is outerwear wherever it sits');
  assert.ok(look.fields.some(item => item.label === 'Bottom' && /skirt/i.test(item.value)), 'a skirt is a bottom wherever it sits');

  // A well-formed pin is left alone: the layer here is a shirt, not a bottom.
  const [intact] = parsePinterestOutfitLibrary(
    '**215.** Orange ribbed knit tank / white short-sleeve linen shirt as an open layer / light-wash denim midi skirt / orange-and-cream flat slides / straw bag. *Styling: shirt open over the tank.*',
  );
  assert.ok(intact.fields.some(item => item.label === 'Top' && /tank/i.test(item.value)));
  assert.ok(intact.fields.some(item => item.label === 'Outerwear' && /linen shirt/i.test(item.value)));
  assert.ok(intact.fields.some(item => item.label === 'Bottom' && /denim midi skirt/i.test(item.value)));
  assert.ok(intact.fields.some(item => item.label === 'Footwear' && /slides/i.test(item.value)));
});
