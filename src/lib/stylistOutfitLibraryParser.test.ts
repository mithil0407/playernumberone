import {
  getParsedStylistOutfitLibrary,
  isUsableStylistOutfitAnchor,
  parseWomenOutfitLibrary,
} from './stylistOutfitLibraryParser';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const womenLibrarySample = `200 ELEVATED ICONIK WOMEN OUTFITS - V2
OFFICE / BUSINESS CASUAL / SOFT POWER

TOP: Ice-blue contrast-collar cotton-poplin shirt with French cuffs. LAYER: Charcoal cropped blazer with sharp shoulders. BOTTOM: Charcoal full-length wide-leg trousers. BELT: Slim black leather belt. SHOES: Black pointed slingback heels. BAG: Cognac structured work tote. ACCESSORIES: Gold oval hoops, slim watch, navy silk scarf tied on the tote handle. STYLING LINE: Fully tuck the shirt and keep the cuffs visible under the blazer.

071. TOP: Coral short kurta with scalloped neckline. LAYER: Ivory sleeveless jacket. BOTTOM: Olive straight trousers. SHOES: Tan juttis. BAG: Chocolate tote. ACCESSORIES: Gold hoops, scarf at bun.

TOP: Emerald brocade waistcoat with a curved hem. TOP INNER: Ivory silk blouse with elbow sleeves. BOTTOM: Ivory wide-leg trousers. SHOES: Gold heels. BAG: Emerald clutch. ACCESSORIES: Gold drop earrings, slim cuff. STYLING LINE: Button the brocade waistcoat fully and let it function as the hero top.`;

export function runStylistOutfitLibraryParserAssertions() {
  const parsed = parseWomenOutfitLibrary(womenLibrarySample);

  invariant(parsed.length === 3, 'parses numbered and unnumbered women library entries only');
  invariant(parsed.every(outfit => outfit.source === 'women'), 'marks women library entries with women source');

  const first = parsed[0];
  invariant(first.normalised_slots[0]?.slot === 'Top', 'keeps explicit TOP label as Top even when the description mentions waist');
  invariant(first.fields.some(field => field.label === 'Footwear' && field.value.includes('Black pointed slingback heels')), 'maps SHOES to Footwear');
  invariant(first.fields.some(field => field.label === 'Styling Line' && field.value.includes('Fully tuck the shirt')), 'preserves STYLING LINE as guidance');
  invariant(first.normalised_slots.some(slot => slot.slot === 'Styling Line'), 'keeps Styling Line as a normalised slot');
  invariant(isUsableStylistOutfitAnchor(first), 'complete single-line women outfit is usable as an anchor');

  const numbered = parsed[1];
  invariant(numbered.id === 'women-02', 'numbers parsed women entries sequentially independent of source numbering');
  invariant(numbered.fields[0]?.label === 'Top', 'strips numeric prefixes before parsing labels');
  invariant(isUsableStylistOutfitAnchor(numbered), 'numbered women outfit is usable as an anchor');

  const topInner = parsed[2];
  invariant(topInner.fields.some(field => field.label === 'Base Layer' && field.value.includes('Ivory silk blouse')), 'maps TOP INNER to Base Layer');

  const allParsed = getParsedStylistOutfitLibrary();
  invariant(allParsed[0]?.source === 'women', 'women library anchors are prioritised before older outfit libraries');
}
