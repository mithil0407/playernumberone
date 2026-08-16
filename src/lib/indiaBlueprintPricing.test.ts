import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  INDIA_BLUEPRINT_ADDON_PRICES,
  INDIA_OFFER_2699_BLUEPRINT_PRICE,
  INDIA_ROOT_BLUEPRINT_PRICE,
  calculateIndiaBlueprintTotal,
  indiaBlueprintBasePriceForCheckout,
} from './indiaBlueprintPricing.ts';

test('keeps the root and offer-2699 base prices separate', () => {
  assert.equal(INDIA_ROOT_BLUEPRINT_PRICE, 2499);
  assert.equal(INDIA_OFFER_2699_BLUEPRINT_PRICE, 2699);
  assert.equal(indiaBlueprintBasePriceForCheckout('root_checkout'), 2499);
  assert.equal(indiaBlueprintBasePriceForCheckout('offer_2699_checkout'), 2699);
});

test('keeps identical add-on prices for both checkout variants', () => {
  const selected = { outfitPreview: true, wardrobeDetox: true, smartShopper: true };
  const addonTotal = Object.values(INDIA_BLUEPRINT_ADDON_PRICES).reduce((sum, price) => sum + price, 0);

  assert.equal(calculateIndiaBlueprintTotal(INDIA_ROOT_BLUEPRINT_PRICE, selected), 2499 + addonTotal);
  assert.equal(calculateIndiaBlueprintTotal(INDIA_OFFER_2699_BLUEPRINT_PRICE, selected), 2699 + addonTotal);
});

test('routes each landing page to its matching checkout and tracking entry', async () => {
  const rootLanding = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const rootCheckout = await readFile(new URL('../app/checkout/page.tsx', import.meta.url), 'utf8');
  const offerCheckout = await readFile(new URL('../app/offer-2699/checkout/page.tsx', import.meta.url), 'utf8');

  assert.match(rootLanding, /checkoutHref="\/checkout"/);
  assert.match(rootLanding, /INDIA_ROOT_BLUEPRINT_PRICE/);
  assert.match(rootCheckout, /funnelEntry="root"/);
  assert.match(rootCheckout, /checkoutSource="root_checkout"/);
  assert.match(offerCheckout, /funnelEntry="offer2699"/);
  assert.match(offerCheckout, /checkoutSource="offer_2699_checkout"/);
});
