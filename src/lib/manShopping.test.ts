import {
  applyStaleMarks,
  buildFallbackSearchUrl,
  buildShoppingSlotKey,
  collectGarmentSlots,
  descriptorHash,
  diffStaleSlotKeys,
  isShoppingSlotCurrent,
  normalizeDescriptor,
  shoppingNeedsFetch,
  type ManShoppingSlot,
  type ManShoppingState,
} from './manShopping';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const s4Sample = `## Section 4

OUTFIT 1 — FORMAL
TOP: Ivory cotton oxford shirt — slim fit — tucked
BOTTOM: Charcoal wool trouser — tailored — full break
LAYER: Navy wool blazer — structured — worn open
FOOTWEAR: Black leather derby (#1B1815)
ACCESSORIES: Black leather belt + steel watch

OUTFIT 2 — FORMAL
TOP: Ivory cotton oxford shirt — slim fit — sleeves rolled
BOTTOM: Navy wool trouser — tapered — no break
LAYER: None
FOOTWEAR: Black leather derby
ACCESSORIES: Steel watch

OUTFIT 3 — SMART CASUAL
TOP: Sage green linen shirt — relaxed fit — untucked
BOTTOM: Charcoal wool trouser — tailored — full break
LAYER: —
FOOTWEAR: White leather sneaker
ACCESSORIES: None
`;

// ── normalizeDescriptor ──────────────────────────────────────

{
  const a = normalizeDescriptor('Ivory cotton oxford shirt — slim fit — tucked');
  const b = normalizeDescriptor('Ivory cotton oxford shirt — slim fit — sleeves rolled');
  invariant(a === 'ivory cotton oxford shirt slim fit', `keeps garment + fit, drops styling (got "${a}")`);
  invariant(a === b, 'styling-only differences normalize to the same key');
  invariant(
    normalizeDescriptor('Black leather derby (#1B1815)') === 'black leather derby',
    'strips hex swatches',
  );
  invariant(
    normalizeDescriptor('**Navy** wool blazer — structured — worn open') === 'navy wool blazer structured',
    'strips markdown and keeps first two segments',
  );
}

// ── collectGarmentSlots + dedupe ─────────────────────────────

{
  const slots = collectGarmentSlots(s4Sample);
  const keys = slots.map(slot => slot.key);

  invariant(keys.includes('1:top') && keys.includes('1:footwear'), 'collects populated slots');
  invariant(!keys.includes('2:layer'), 'skips "None" layers');
  invariant(!keys.includes('3:layer'), 'skips placeholder ("—") layers');
  invariant(!keys.some(key => key.endsWith(':accessories')), 'accessories are excluded');
  invariant(slots.length === 10, `expected 10 shoppable slots, got ${slots.length}`);

  const uniqueHashes = new Set(slots.map(slot => slot.hash));
  // 1:top/2:top share a hash, 1:footwear/2:footwear share a hash, 1:bottom/3:bottom share a hash.
  invariant(uniqueHashes.size === 7, `expected 7 unique garments after dedupe, got ${uniqueHashes.size}`);

  const topHash = slots.find(slot => slot.key === '1:top')!.hash;
  invariant(slots.find(slot => slot.key === '2:top')!.hash === topHash, 'same garment in two outfits shares one hash');
}

// ── diffStaleSlotKeys / staleness ────────────────────────────

{
  const slots = collectGarmentSlots(s4Sample);
  const now = new Date().toISOString();
  const readySlots: ManShoppingState['slots'] = {};
  for (const garment of slots) {
    readySlots[garment.key] = {
      descriptor: garment.descriptor,
      descriptorHash: garment.hash,
      query: garment.normalized,
      candidates: [],
      selected: [],
      status: 'ready',
    } satisfies ManShoppingSlot;
  }
  const state: ManShoppingState = { version: 1, status: 'ready', updatedAt: now, slots: readySlots };

  invariant(diffStaleSlotKeys(state, s4Sample).length === 0, 'fully fetched state has no stale slots');
  invariant(diffStaleSlotKeys(null, s4Sample).length === 10, 'null state marks every slot stale');
  invariant(!shoppingNeedsFetch(state, s4Sample), 'fresh state needs no fetch');

  const edited = s4Sample.replace('Sage green linen shirt', 'Rust brown corduroy overshirt');
  const diff = diffStaleSlotKeys(state, edited);
  invariant(diff.length === 1 && diff[0] === '3:top', `only the edited slot goes stale (got ${JSON.stringify(diff)})`);
  invariant(shoppingNeedsFetch(state, edited), 'edited garment triggers fetch need');

  const stylingOnly = s4Sample.replace('slim fit — tucked', 'slim fit — untucked, sleeves rolled');
  invariant(diffStaleSlotKeys(state, stylingOnly).length === 0, 'styling-only edits do not invalidate links');

  const { next, changed } = applyStaleMarks(state, edited);
  invariant(changed, 'applyStaleMarks reports the change');
  invariant(next.slots['3:top']?.status === 'stale', 'edited slot stamped stale');
  invariant(next.slots['1:top']?.status === 'ready', 'untouched slots keep their status');

  const inFlight: ManShoppingState = { ...state, status: 'fetching', startedAt: now };
  invariant(!shoppingNeedsFetch(inFlight, edited), 'in-flight fetch suppresses re-trigger');
  const deadFetch: ManShoppingState = {
    ...state,
    status: 'fetching',
    startedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  };
  invariant(shoppingNeedsFetch(deadFetch, edited), 'stale in-flight fetch (>10 min) is treated as dead');
}

// ── slot currency + fallback URL ─────────────────────────────

{
  const hash = descriptorHash(normalizeDescriptor('Ivory cotton oxford shirt — slim fit'));
  const slot: ManShoppingSlot = {
    descriptor: 'Ivory cotton oxford shirt — slim fit',
    descriptorHash: hash,
    query: 'ivory oxford shirt men',
    candidates: [],
    selected: [],
    status: 'ready',
  };
  invariant(isShoppingSlotCurrent(slot, hash), 'matching hash is current');
  invariant(!isShoppingSlotCurrent(slot, 'deadbeef'), 'hash mismatch is not current');
  invariant(!isShoppingSlotCurrent({ ...slot, status: 'stale' }, hash), 'stale status is never current');

  const url = buildFallbackSearchUrl('Ivory cotton oxford shirt — slim fit — tucked');
  invariant(url.includes('tbm%3Dshop') === false && url.includes('tbm=shop'), 'fallback URL targets Google Shopping');
  invariant(decodeURIComponent(url).includes('men'), 'fallback query includes "men"');
  invariant(url.includes('gl=in'), 'fallback URL pins India');

  invariant(buildShoppingSlotKey(7, 'footwear') === '7:footwear', 'slot key format is stable');
}

console.log('manShopping.test.ts passed');
