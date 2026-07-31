// Isomorphic Meta tracking contract.
//
// Everything in this module is shared by the browser pixel, the Signals Gateway
// bridge and the server-side Conversions API. Keep it free of `window` and of
// server-only imports so both bundles can pull from one source of truth — the
// browser and server payloads for a deduplicated event pair MUST agree.

export const META_PURCHASE_EVENT_NAME = 'Purchase';
export const META_COMPLETE_REGISTRATION_EVENT_NAME = 'CompleteRegistration';

const GOOGLE_ONLY_GROWTH_EVENTS = new Set(['checkout_started', 'purchase']);

export function isGoogleOnlyGrowthEvent(eventName: string) {
  return GOOGLE_ONLY_GROWTH_EVENTS.has(eventName);
}

export function resolveMetaPurchaseEventId(transactionId?: string, eventId?: string) {
  return eventId || transactionId;
}

export function buildMetaPurchaseServerIdentity(eventId: string) {
  return {
    event_name: META_PURCHASE_EVENT_NAME,
    event_id: eventId,
  } as const;
}

/**
 * CompleteRegistration is fired from a success page that a customer can reload,
 * bookmark, or reach again from the post-payment intake email — potentially on
 * another device, where no local guard exists. Deriving the event ID from the
 * payment ID lets Meta collapse every one of those into a single event.
 */
export function resolveMetaCompleteRegistrationEventId(paymentId?: string | null) {
  const trimmed = paymentId?.trim();
  return trimmed ? `${META_COMPLETE_REGISTRATION_EVENT_NAME}_${trimmed}` : undefined;
}

// ── India (women) Blueprint funnel product catalogue ────────────────────────
// `/` and `/offer-2699` are two entry points into one funnel. Both sell the
// same product through `/offer-2699/checkout`, so every step must use these IDs
// or content-ID based reporting silently drops part of the funnel.

export const INDIA_BLUEPRINT_PRODUCT_ID = 'iconik_style_consultation';
export const INDIA_OUTFIT_PREVIEW_PRODUCT_ID = 'outfit_preview';
export const INDIA_WARDROBE_DETOX_PRODUCT_ID = 'wardrobe_detox';
export const INDIA_SMART_SHOPPER_PRODUCT_ID = 'smart_shoppers_guide';
export const INDIA_BLUEPRINT_CONTENT_NAME = 'ICONIK Complete Package';
export const INDIA_BLUEPRINT_CHECKOUT_URL = 'https://www.iconik.pro/offer-2699/checkout';

export interface IndiaBlueprintAddons {
  outfitPreview?: boolean;
  wardrobeDetox?: boolean;
  smartShopper?: boolean;
}

/**
 * Single source of truth for Purchase / InitiateCheckout `content_ids`. The
 * browser and the Conversions API both call this, so a deduplicated pair can
 * never disagree about which items were bought.
 */
export function buildIndiaBlueprintContentIds(addons: IndiaBlueprintAddons = {}) {
  const contentIds = [INDIA_BLUEPRINT_PRODUCT_ID];
  if (addons.outfitPreview) contentIds.push(INDIA_OUTFIT_PREVIEW_PRODUCT_ID);
  if (addons.wardrobeDetox) contentIds.push(INDIA_WARDROBE_DETOX_PRODUCT_ID);
  if (addons.smartShopper) contentIds.push(INDIA_SMART_SHOPPER_PRODUCT_ID);
  return contentIds;
}

// ── Man funnel ──────────────────────────────────────────────────────────────
// The Iconik Edit subscription is billed through a *separate* Razorpay
// subscription, so its price is not part of the Blueprint order value. It
// therefore gets its own Purchase rather than riding along in the Blueprint's
// content_ids, where it would inflate num_items against an unchanged value.

export const MAN_EDIT_PRODUCT_ID = 'iconik_man_edit_monthly';
export const MAN_EDIT_CONTENT_NAME = 'Iconik Edit Monthly';
export const MAN_EDIT_FUNNEL_CATEGORY = 'Man Edit Subscription';
export const MAN_EDIT_CHECKOUT_URL = 'https://www.iconik.pro/man/checkout';

// ── Funnel entry attribution ────────────────────────────────────────────────
// `/` and `/offer-2699` render the same component at the same price into the
// same checkout. Without a distinct content_category their events are
// indistinguishable in Events Manager and neither can be measured.

// ASCII only: these values travel through Razorpay order notes so the webhook
// can reproduce the browser's content_category on the server-side Purchase.
export const INDIA_FUNNEL_CATEGORY = 'India';
export const INDIA_ROOT_FUNNEL_CATEGORY = 'India - Root';
export const INDIA_OFFER_2699_FUNNEL_CATEGORY = 'India - Offer2699';
export const INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY = 'India - Legacy Checkout';

export type IndiaFunnelEntry = 'root' | 'offer2699';

export const INDIA_FUNNEL_ENTRY_STORAGE_KEY = 'iconik_funnel_entry';

export function indiaFunnelCategoryFromEntry(entry?: string | null) {
  if (entry === 'root') return INDIA_ROOT_FUNNEL_CATEGORY;
  if (entry === 'offer2699') return INDIA_OFFER_2699_FUNNEL_CATEGORY;
  // Direct navigation to the checkout, or an order placed before entry
  // tracking shipped. Recorded as the funnel, not as either entry point.
  return INDIA_FUNNEL_CATEGORY;
}

// ── Phone normalisation ─────────────────────────────────────────────────────

/**
 * Meta matches phone numbers as digits including the country code and without a
 * leading `+`. A bare 10-digit Indian mobile simply fails to match, so both the
 * browser's advanced matching and the CAPI `ph` hash must run through this.
 *
 * `countryCode` is applied only when the number is in 10-digit national format
 * (India and the US); anything longer is assumed to already carry its code.
 */
export function normalizeMetaPhone(phone?: string | null, countryCode?: string) {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return undefined;

  if (digits.startsWith('00')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');

  if (countryCode && digits.length === 10) {
    digits = `${countryCode}${digits}`;
  }

  return digits.length >= 7 && digits.length <= 15 ? digits : undefined;
}

export function normalizeMetaEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : undefined;
}

/**
 * Meta expects `fn` / `ln` as separate lower-cased fields. Checkout collects a
 * single name (often derived from the email local part), so split on the first
 * whitespace and treat the remainder as the last name.
 */
export function splitMetaName(fullName?: string | null) {
  const cleaned = fullName?.trim().replace(/\s+/g, ' ');
  if (!cleaned) return {};
  const [firstName, ...rest] = cleaned.split(' ');
  return {
    firstName: firstName || undefined,
    lastName: rest.length ? rest.join(' ') : undefined,
  };
}
