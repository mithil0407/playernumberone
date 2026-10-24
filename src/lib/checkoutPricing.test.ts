import assert from 'node:assert/strict';
import test from 'node:test';
import { priceForCheckout, priceForDedicatedCheckout } from './checkoutPricing.ts';

test('dedicated checkout prices are fixed by product and selected add-on', () => {
  assert.deepEqual(priceForDedicatedCheckout('stylist', false), { amount: 149, currency: 'USD' });
  assert.deepEqual(priceForDedicatedCheckout('stylist', true), { amount: 110, currency: 'USD' });
  assert.deepEqual(priceForDedicatedCheckout('au', true), { amount: 144, currency: 'AUD' });
  assert.deepEqual(priceForDedicatedCheckout('globe', true), { amount: 134, currency: 'USD' });
  assert.deepEqual(priceForDedicatedCheckout('global', true), { amount: 168, currency: 'USD' });
  assert.deepEqual(priceForDedicatedCheckout('man-intl', true), { amount: 134, currency: 'USD' });
});

test('shared checkout rejects unknown products and derives addon totals', () => {
  assert.equal(priceForCheckout({ base_product: 'secret_discount' }), null);
  assert.deepEqual(priceForCheckout({ checkout_source: 'root_checkout', base_product: 'Iconik Style Consultation', add_ons: { outfit_preview: true } }), { amount: 3698, currency: 'INR' });
  assert.deepEqual(priceForCheckout({ base_product: 'UAE Style Blueprint', add_ons: { outfit_preview: true } }), { amount: 278, currency: 'AED' });
  assert.deepEqual(priceForCheckout({ base_product: 'ICONIK Monthly Subscription', plan_type: 'base' }), { amount: 99, currency: 'INR' });
});
