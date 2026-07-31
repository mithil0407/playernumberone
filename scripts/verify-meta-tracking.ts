/**
 * Meta tracking verification harness for the India Blueprint funnel
 * (`/` + `/offer-2699` → /offer-2699/checkout → /checkout/success).
 *
 *   npm run verify:meta-tracking
 *
 * Stage 1 (offline) re-derives the browser and server Purchase payloads for the
 * same synthetic order and asserts they are identical. That is the invariant the
 * whole setup rests on: both events carry the Razorpay payment ID as their event
 * ID, so Meta keeps whichever arrives first — if they disagree, what you see in
 * Events Manager is a race.
 *
 * Stage 2 (live) sends that server payload to the Conversions API through the
 * real sendMetaPurchaseEvent(), scoped to META_TEST_EVENT_CODE so it lands in
 * the Test Events tab and never in production reporting.
 */

import {
  INDIA_BLUEPRINT_CONTENT_NAME,
  INDIA_BLUEPRINT_CHECKOUT_URL,
  INDIA_OFFER_2699_FUNNEL_CATEGORY,
  buildIndiaBlueprintContentIds,
  normalizeMetaEmail,
  normalizeMetaPhone,
  resolveMetaCompleteRegistrationEventId,
  resolveMetaPurchaseEventId,
  splitMetaName,
} from '../src/lib/metaTrackingContract.ts';

// ── Synthetic order: offer-2699 base + two add-ons ──────────────────────────
const BASE_PRICE = 2699;
const WARDROBE_DETOX_PRICE = 1499;
const SMART_SHOPPER_PRICE = 499;

const paymentId = `pay_verify_${Date.now()}`;
const orderId = `order_verify_${Date.now()}`;
const selected = { outfitPreview: false, wardrobeDetox: true, smartShopper: true };
const amount = BASE_PRICE + WARDROBE_DETOX_PRICE + SMART_SHOPPER_PRICE;

const customer = {
  name: 'Verification Tester',
  email: 'meta.verification@example.com',
  phone: '9876543210', // 10-digit national format, exactly as the checkout collects it
};

// ── Stage 1: browser / server payload parity ────────────────────────────────

interface PurchasePayload {
  eventId: string | undefined;
  value: number;
  currency: string;
  contentName: string;
  contentIds: string[];
  contentCategory: string;
  numItems: number;
}

// What src/app/offer-2699/checkout/page.tsx sends.
const browserContentIds = buildIndiaBlueprintContentIds(selected);
const browserPayload: PurchasePayload = {
  eventId: resolveMetaPurchaseEventId(paymentId, paymentId),
  value: amount,
  currency: 'INR',
  contentName: INDIA_BLUEPRINT_CONTENT_NAME,
  contentIds: browserContentIds,
  contentCategory: INDIA_OFFER_2699_FUNNEL_CATEGORY,
  numItems: browserContentIds.length,
};

// What src/app/api/payment/webhook/route.ts reconstructs from the Razorpay
// order notes, via the same helpers.
const addOnsString = [
  selected.wardrobeDetox ? 'Wardrobe Detox' : '',
  selected.smartShopper ? "Smart Shopper's Guide" : '',
  selected.outfitPreview ? 'Outfit Preview on You' : '',
].filter(Boolean).join(', ');

const razorpayAmountMinor = amount * 100;
const serverContentIds = buildIndiaBlueprintContentIds({
  wardrobeDetox: addOnsString.includes('Wardrobe Detox'),
  smartShopper: addOnsString.includes("Smart Shopper's Guide"),
  outfitPreview: addOnsString.includes('Outfit Preview on You'),
});
const serverPayload: PurchasePayload = {
  eventId: paymentId,
  value: razorpayAmountMinor / 100,
  currency: 'INR',
  contentName: INDIA_BLUEPRINT_CONTENT_NAME,
  contentIds: serverContentIds,
  contentCategory: INDIA_OFFER_2699_FUNNEL_CATEGORY, // read back from notes.funnel_entry
  numItems: serverContentIds.length,
};

const checks: Array<{ field: string; browser: unknown; server: unknown; ok: boolean }> = [];
for (const field of ['eventId', 'value', 'currency', 'contentName', 'contentCategory', 'numItems'] as const) {
  const b = browserPayload[field];
  const s = serverPayload[field];
  checks.push({ field, browser: b, server: s, ok: b === s });
}
checks.push({
  field: 'contentIds',
  browser: browserPayload.contentIds.join(','),
  server: serverPayload.contentIds.join(','),
  ok: browserPayload.contentIds.join(',') === serverPayload.contentIds.join(','),
});

console.log('\n── Stage 1: deduplicated pair must agree ───────────────────────');
console.table(checks);

const parityFailures = checks.filter((check) => !check.ok);
if (parityFailures.length) {
  console.error(`✗ ${parityFailures.length} field(s) disagree between browser and server.`);
  process.exit(1);
}
console.log('✓ Browser and server Purchase payloads are identical.');

// Matching fields, so a test run shows what Meta will actually receive.
const { firstName, lastName } = splitMetaName(customer.name);
console.log('\n── Advanced matching (values shown pre-hash) ───────────────────');
console.table([
  { field: 'em', value: normalizeMetaEmail(customer.email) },
  { field: 'ph', value: normalizeMetaPhone(customer.phone, '91') },
  { field: 'fn', value: firstName },
  { field: 'ln', value: lastName },
  { field: 'country', value: 'in' },
  { field: 'external_id', value: orderId },
]);
if (normalizeMetaPhone(customer.phone, '91') !== '919876543210') {
  console.error('✗ Phone is not in the country-code format Meta matches on.');
  process.exit(1);
}

console.log(`\nCompleteRegistration event ID: ${resolveMetaCompleteRegistrationEventId(paymentId)}`);

// ── Stage 2: live send to the Conversions API ───────────────────────────────

const testEventCode = process.env.META_TEST_EVENT_CODE;
const accessToken = process.env.META_ACCESS_TOKEN;

console.log('\n── Stage 2: live Conversions API send ──────────────────────────');
if (!testEventCode) {
  console.log('skipped — META_TEST_EVENT_CODE is not set.');
  process.exit(0);
}
if (!accessToken) {
  console.log('skipped — META_ACCESS_TOKEN is not set in this environment.');
  console.log('Add it to .env.local (System User token with ads_management), then re-run.');
  process.exit(0);
}

console.log(`Sending Purchase event_id=${paymentId} with test_event_code=${testEventCode} …`);

const { sendMetaPurchaseEvent } = await import('../src/lib/metaConversionsApi.ts');

await sendMetaPurchaseEvent({
  eventId: paymentId,
  eventSourceUrl: INDIA_BLUEPRINT_CHECKOUT_URL,
  externalId: orderId,
  customerEmail: customer.email,
  customerName: customer.name,
  customerPhone: customer.phone,
  countryCode: 'in',
  phoneCountryCode: '91',
  amount: serverPayload.value,
  currency: 'INR',
  contentName: serverPayload.contentName,
  contentIds: serverPayload.contentIds,
  numItems: serverPayload.numItems,
  contentCategory: serverPayload.contentCategory,
  attribution: {
    landing_page: 'https://www.iconik.pro/offer-2699',
    attribution_payload: { fbp: 'fb.1.1700000000000.1234567890', fbc: null },
  },
});

console.log('\nOpen Events Manager → Test Events and look for a Purchase with');
console.log(`event ID ${paymentId}, value ${serverPayload.value} INR, ${serverPayload.numItems} items.`);
