import type { ClassificationResult } from './manReportGenerator';
import { completeManOutfitEditDeterministically } from './manOutfitEdit';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classification = {
  client: {
    location_region: 'India',
    height_category: 'average',
    primary_goal: 'look sharper',
  },
  body: {
    fit_directive: 'structured but comfortable fit',
  },
  colour: {
    primary_palette: [{ name: 'navy', hex: '#001F5B', usage: 'base' }],
    neutral_base_colours: [{ name: 'charcoal', hex: '#36454F' }],
  },
  style_brief: {
    register: 'client-facing workdays',
  },
} as ClassificationResult;

const currentSection4 = `OUTFIT 1 — OFFICE / FORMAL
TOP: White cotton shirt
BOTTOM: Navy tailored trouser
LAYER: Charcoal blazer
FOOTWEAR: Dark brown loafer
ACCESSORIES: Steel watch
FIT NOTE: The blazer adds shoulder structure while the trouser keeps the line clean.
COLOUR LOGIC: Navy and charcoal give you authority without flattening your complexion.
OCCASION ANCHOR: Use this for client-facing workdays where polish matters.
SHOPPING TRANSLATION: Buy crisp cotton, matte wool blends, and clean leather.
ACCEPTABLE SUBSTITUTES: Swap navy for charcoal or deep olive.
DO NOT BUY: Avoid skinny trousers, glossy shoes, or loud contrast buttons.

OUTFIT 2 — OFFICE / FORMAL
TOP: Pale blue oxford shirt
BOTTOM: Grey trouser
LAYER: Navy blazer
FOOTWEAR: Brown derby
ACCESSORIES: Leather belt`;

export function runManOutfitEditAssertions() {
  const placeholderRationale = completeManOutfitEditDeterministically({
    classification,
    currentSection4,
    outfitNumber: 1,
    editedBlock: `OUTFIT 1 — OFFICE / FORMAL
TOP: Black linen shirt
BOTTOM: Cream tailored trouser
LAYER: No layer
FOOTWEAR: Tan loafer
ACCESSORIES: Steel watch
FIT NOTE: Not specified by stylist
COLOUR LOGIC: Not specified by stylist
OCCASION ANCHOR: Not specified by stylist
SHOPPING TRANSLATION: Not specified by stylist
ACCEPTABLE SUBSTITUTES: Not specified by stylist
DO NOT BUY: Not specified by stylist`,
  });

  invariant(placeholderRationale.includes('TOP: Black linen shirt'), 'preserves edited top');
  invariant(placeholderRationale.includes('BOTTOM: Cream tailored trouser'), 'preserves edited bottom');
  invariant(placeholderRationale.includes('LAYER: No layer'), 'preserves valid no-layer choice');
  invariant(
    placeholderRationale.includes('Use this for client-facing workdays where polish matters.'),
    'reuses previous valid occasion rationale',
  );
  invariant(!/Not specified by stylist/i.test(placeholderRationale), 'removes placeholder rationale');

  const missingShoppingFields = completeManOutfitEditDeterministically({
    classification,
    currentSection4,
    outfitNumber: 2,
    editedBlock: `OUTFIT 2 — OFFICE / FORMAL
TOP: Ecru knit polo
BOTTOM: Charcoal pleated trouser
LAYER: Navy overshirt
FOOTWEAR: Dark brown loafer
ACCESSORIES: Minimal watch`,
  });

  invariant(missingShoppingFields.includes('TOP: Ecru knit polo'), 'preserves edited garments with missing fields');
  invariant(missingShoppingFields.includes('FIT NOTE:'), 'fills missing fit note');
  invariant(missingShoppingFields.includes('SHOPPING TRANSLATION:'), 'fills missing shopping translation');
  invariant(missingShoppingFields.includes('ACCEPTABLE SUBSTITUTES:'), 'fills missing acceptable substitutes');
  invariant(missingShoppingFields.includes('DO NOT BUY:'), 'fills missing do-not-buy guidance');
  invariant(!missingShoppingFields.includes('SHOPPING TRANSLATION: —'), 'does not leave shopping placeholder');

  let wrongNumberFailed = false;
  try {
    completeManOutfitEditDeterministically({
      classification,
      currentSection4,
      outfitNumber: 1,
      editedBlock: `OUTFIT 2 — OFFICE / FORMAL
TOP: Black shirt`,
    });
  } catch {
    wrongNumberFailed = true;
  }
  invariant(wrongNumberFailed, 'rejects wrong outfit number');
}
