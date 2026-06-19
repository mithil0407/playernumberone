import {
  getDuplicateManOutfitNumbers,
  normaliseSequentialManOutfitNumbers,
  parseManOutfitsFromSection,
  replaceOutfitBlock,
} from './manOutfitSection';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const duplicateOutfitSample = `## Section 4

OUTFIT 9 — SMART CASUAL
TOP: Navy linen shirt
BOTTOM: Cream trouser
LAYER: None
FOOTWEAR: Tan loafer
ACCESSORIES: Brown belt

OUTFIT 10 — SMART CASUAL
TOP: Olive overshirt
BOTTOM: Dark denim
LAYER: None
FOOTWEAR: Brown boot
ACCESSORIES: Watch

OUTFIT 10 — EVENING WEAR
TOP: Black silk shirt
BOTTOM: Charcoal trouser
LAYER: Black blazer
FOOTWEAR: Black loafer
ACCESSORIES: Silver ring

OUTFIT 12 — EVENING WEAR
TOP: Burgundy knit polo
BOTTOM: Black trouser
LAYER: None
FOOTWEAR: Oxblood loafer
ACCESSORIES: Slim watch`;

export function runManOutfitSectionAssertions() {
  const parsed = parseManOutfitsFromSection(duplicateOutfitSample);

  invariant(parsed.length === 4, 'keeps both duplicate outfit blocks');
  invariant(parsed[1].number === 10, 'parses first Outfit 10');
  invariant(parsed[2].number === 10, 'parses second Outfit 10');
  invariant(parsed[1].identityKey !== parsed[2].identityKey, 'duplicate-number outfits get distinct identity keys');
  invariant(getDuplicateManOutfitNumbers(duplicateOutfitSample).join(',') === '10', 'detects duplicate outfit number');

  const normalised = normaliseSequentialManOutfitNumbers(duplicateOutfitSample);
  const normalisedParsed = parseManOutfitsFromSection(normalised);

  invariant(normalisedParsed.map(outfit => outfit.number).join(',') === '1,2,3,4', 'renumbers by document order');
  invariant(normalised.includes('OUTFIT 3 — EVENING WEAR'), 'renumbers second duplicate header');
  invariant(normalised.includes('TOP: Black silk shirt'), 'preserves duplicate block body text');
  invariant(normalised.includes('OUTFIT 4 — EVENING WEAR'), 'renumbers later missing-number header');

  const replaced = replaceOutfitBlock(normalised, 3, `OUTFIT 3 — EVENING WEAR
TOP: Black velvet shirt
BOTTOM: Charcoal trouser
LAYER: Black blazer
FOOTWEAR: Black loafer
ACCESSORIES: Silver ring`);

  invariant(!!replaced, 'replaces intended unique outfit after normalisation');
  invariant(replaced.includes('TOP: Black velvet shirt'), 'replacement text is inserted');
  invariant(replaced.includes('TOP: Olive overshirt'), 'neighbouring outfit remains intact');

  const rationaleFallback = parseManOutfitsFromSection(`OUTFIT 1 — OFFICE / FORMAL
TOP: White cotton shirt
BOTTOM: Navy trouser
LAYER: Camel blazer
FOOTWEAR: Brown loafer
ACCESSORIES: Watch
OCCASION ANCHOR: Not specified by stylist
WHY IT WORKS FOR YOU: The blazer builds shoulder structure while the darker trouser keeps the lower half clean.`);

  invariant(
    rationaleFallback[0]?.whyItWorks.startsWith('The blazer builds shoulder structure'),
    'falls back from placeholder occasion anchor to meaningful rationale',
  );
}
