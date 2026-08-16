import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  INDIA_BLUEPRINT_PRODUCT_ID,
  INDIA_BLUEPRINT_CHECKOUT_URL,
  INDIA_FUNNEL_CATEGORY,
  INDIA_OFFER_2699_FUNNEL_CATEGORY,
  INDIA_ROOT_BLUEPRINT_CHECKOUT_URL,
  INDIA_ROOT_FUNNEL_CATEGORY,
  META_PURCHASE_EVENT_NAME,
  buildIndiaBlueprintContentIds,
  buildMetaPurchaseServerIdentity,
  indiaFunnelCategoryFromEntry,
  isGoogleOnlyGrowthEvent,
  normalizeMetaEmail,
  normalizeMetaPhone,
  resolveMetaCompleteRegistrationEventId,
  resolveMetaPurchaseEventId,
  splitMetaName,
} from './metaTrackingContract.ts';

test('uses the payment ID as the browser Purchase deduplication key', () => {
  assert.equal(META_PURCHASE_EVENT_NAME, 'Purchase');
  assert.equal(resolveMetaPurchaseEventId('pay_razorpay_123'), 'pay_razorpay_123');
  assert.equal(
    resolveMetaPurchaseEventId('pay_razorpay_123', 'explicit_event_id'),
    'explicit_event_id',
  );
  assert.deepEqual(buildMetaPurchaseServerIdentity('pay_razorpay_123'), {
    event_name: 'Purchase',
    event_id: 'pay_razorpay_123',
  });
});

test('keeps standard conversion growth events out of Meta custom events', () => {
  assert.equal(isGoogleOnlyGrowthEvent('purchase'), true);
  assert.equal(isGoogleOnlyGrowthEvent('checkout_started'), true);
  assert.equal(isGoogleOnlyGrowthEvent('consultation_cta_click'), false);
});

test('collapses repeat success-page views onto one CompleteRegistration', () => {
  // The success page can be reloaded, bookmarked, or reopened from the intake
  // email on another device where no local guard exists.
  assert.equal(
    resolveMetaCompleteRegistrationEventId('pay_razorpay_123'),
    'CompleteRegistration_pay_razorpay_123',
  );
  assert.equal(resolveMetaCompleteRegistrationEventId(''), undefined);
  assert.equal(resolveMetaCompleteRegistrationEventId(null), undefined);
});

test('keeps the India Blueprint content_ids identical on browser and server', () => {
  // Both sides of a deduplicated Purchase pair call this. If they can disagree,
  // the surviving payload depends on which event reaches Meta first.
  assert.deepEqual(buildIndiaBlueprintContentIds(), [INDIA_BLUEPRINT_PRODUCT_ID]);
  assert.deepEqual(
    buildIndiaBlueprintContentIds({ outfitPreview: true, wardrobeDetox: true, smartShopper: true }),
    ['iconik_style_consultation', 'outfit_preview', 'wardrobe_detox', 'smart_shoppers_guide'],
  );
  // Order is stable regardless of which flags are set.
  assert.deepEqual(
    buildIndiaBlueprintContentIds({ smartShopper: true, outfitPreview: true }),
    ['iconik_style_consultation', 'outfit_preview', 'smart_shoppers_guide'],
  );
});

test('separates the two Blueprint price funnels', () => {
  assert.equal(indiaFunnelCategoryFromEntry('root'), INDIA_ROOT_FUNNEL_CATEGORY);
  assert.equal(indiaFunnelCategoryFromEntry('offer2699'), INDIA_OFFER_2699_FUNNEL_CATEGORY);
  assert.notEqual(INDIA_ROOT_FUNNEL_CATEGORY, INDIA_OFFER_2699_FUNNEL_CATEGORY);
  assert.equal(INDIA_ROOT_BLUEPRINT_CHECKOUT_URL, 'https://www.iconik.pro/checkout');
  assert.equal(INDIA_BLUEPRINT_CHECKOUT_URL, 'https://www.iconik.pro/offer-2699/checkout');
  // Unknown legacy entries are recorded as the general funnel, not as a guess.
  assert.equal(indiaFunnelCategoryFromEntry(null), INDIA_FUNNEL_CATEGORY);
  assert.equal(indiaFunnelCategoryFromEntry('something-else'), INDIA_FUNNEL_CATEGORY);

  // These values are written into Razorpay order notes, which the webhook reads
  // back to reproduce the browser's content_category. Keep them ASCII.
  for (const category of [INDIA_FUNNEL_CATEGORY, INDIA_ROOT_FUNNEL_CATEGORY, INDIA_OFFER_2699_FUNNEL_CATEGORY]) {
    assert.match(category, /^[\x20-\x7E]+$/, `${category} must be ASCII-safe for Razorpay notes`);
  }
});

test('normalises phone numbers to the country-code format Meta matches on', () => {
  // A bare 10-digit Indian mobile simply fails to match.
  assert.equal(normalizeMetaPhone('9876543210', '91'), '919876543210');
  assert.equal(normalizeMetaPhone('+91 98765 43210', '91'), '919876543210');
  assert.equal(normalizeMetaPhone('09876543210', '91'), '919876543210');
  assert.equal(normalizeMetaPhone('0091-98765-43210', '91'), '919876543210');
  // Already carries a country code — must not be double-prefixed.
  assert.equal(normalizeMetaPhone('919876543210', '91'), '919876543210');
  // A 10-digit national number that happens to start with the dialling code.
  assert.equal(normalizeMetaPhone('9198765432', '91'), '919198765432');
  // Without a country code the digits pass through unchanged.
  assert.equal(normalizeMetaPhone('9876543210'), '9876543210');
  assert.equal(normalizeMetaPhone(''), undefined);
  assert.equal(normalizeMetaPhone('123'), undefined);
  assert.equal(normalizeMetaPhone('1234567890123456'), undefined);
});

test('validates and lower-cases email before hashing', () => {
  assert.equal(normalizeMetaEmail('  Person@Example.COM '), 'person@example.com');
  assert.equal(normalizeMetaEmail('not-an-email'), undefined);
  assert.equal(normalizeMetaEmail(null), undefined);
});

test('splits a single collected name into the fn/ln Meta expects', () => {
  assert.deepEqual(splitMetaName('Asha  Menon'), { firstName: 'Asha', lastName: 'Menon' });
  assert.deepEqual(splitMetaName('Asha Rani Menon'), { firstName: 'Asha', lastName: 'Rani Menon' });
  assert.deepEqual(splitMetaName('asha'), { firstName: 'asha', lastName: undefined });
  assert.deepEqual(splitMetaName('   '), {});
});

test('sends a server-side Purchase for the India Blueprint funnel, not only for men', async () => {
  const webhook = await readFile(new URL('../app/api/payment/webhook/route.ts', import.meta.url), 'utf8');

  // The India women's funnel has no confirm endpoint, so order.paid is its only
  // server-side signal. It used to be excluded by an isMenOrderForCapi gate.
  assert.doesNotMatch(webhook, /isMenOrderForCapi/);
  assert.match(webhook, /Iconik Style Consultation/);
  assert.match(webhook, /buildIndiaBlueprintContentIds/);
  assert.match(webhook, /INDIA_ROOT_BLUEPRINT_CHECKOUT_URL/);
  assert.match(webhook, /notes\.checkout_source === 'root_checkout'/);

  // Razorpay reports the minor unit. The orders table stores a rounded integer,
  // but the Meta payload must not — rounding drops USD cents, and the browser
  // Purchase this deduplicates against sends the exact amount.
  const capiCall = webhook.slice(webhook.indexOf('await sendMetaPurchaseEvent({'));
  const capiArgs = capiCall.slice(0, capiCall.indexOf('});'));
  assert.match(capiArgs, /amount: order\.amount \/ 100,/);
  assert.doesNotMatch(capiArgs, /Math\.round/);
});

test('bills the man Edit subscription as its own Purchase, first charge only', async () => {
  const webhook = await readFile(new URL('../app/api/payment/webhook/route.ts', import.meta.url), 'utf8');
  const checkout = await readFile(new URL('../app/man/checkout/page.tsx', import.meta.url), 'utf8');

  // The Edit subscription used to reach Meta nowhere at all.
  assert.match(webhook, /MAN_EDIT_PRODUCT_ID/);
  // Renewals must not re-credit the ad that drove the first charge.
  assert.match(webhook, /subscription\.paid_count === 1/);

  // The Blueprint Purchase must not list the Edit product: its price is billed
  // through a separate subscription order and is not in that event's value.
  const blueprintPurchase = checkout.slice(checkout.indexOf('const purchasedItems = [MAN_BLUEPRINT_PRODUCT_ID]'));
  const blueprintBlock = blueprintPurchase.slice(0, blueprintPurchase.indexOf('trackPurchase('));
  assert.doesNotMatch(blueprintBlock, /MAN_EDIT_PRODUCT_ID/);
});

test('does not re-initialise the Signals Gateway SDK from application code', async () => {
  // Events Manager reports em/ph on 100% of Purchase events across both
  // sources, so Stape already has the matching data. Calling cbq('init') again
  // mid-session would buy nothing and risks resetting gateway state.
  const pixel = await readFile(new URL('./metaPixel.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(pixel, /cbq/);
});

test('Signals Gateway loader does not own PageView or send application cbq events', async () => {
  const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(layout, /cbq\(\s*['"]track/);
  assert.doesNotMatch(layout, /fbq\(\s*['"]track['"]\s*,\s*['"]PageView/);
  assert.match(layout, /forkFromSnippetCode@1\.0/);
});
