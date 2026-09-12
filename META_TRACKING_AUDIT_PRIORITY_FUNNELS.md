# Priority Funnel Deep-Dive — Man, offer-2699, and Root (`/`)

Companion to [META_TRACKING_AUDIT.md](META_TRACKING_AUDIT.md). Scoped to the three funnels named as priority. Everything here is traced end-to-end: landing → checkout → Razorpay handler → success/intake → payment route → webhook → CAPI.

---

## 0. The structural finding: `/` and `/offer-2699` are one funnel, not two

This changes how the rest of the report should be read.

[siteFacts.ts:27](src/lib/siteFacts.ts#L27):

```ts
export const BLUEPRINT_OFFER = {
  name: "ICONIK Blueprint",
  currentPriceInr: 2699,
  checkoutPath: "/offer-2699/checkout",
  offerPath: "/offer-2699",
};
```

[page.tsx](src/app/page.tsx) renders `<LandingPageContent />` with **no props overridden**, so it inherits `checkoutHref = "/offer-2699/checkout"` and `basePrice = 2699` from those defaults. [offer-2699/page.tsx](src/app/offer-2699/page.tsx) renders the *same component* with `checkoutHref="/offer-2699/checkout"` and `basePrice={2699}`.

Both pages therefore fire, from [LandingPageContent.tsx:61](src/app/LandingPageContent.tsx#L61):

```ts
trackViewContent(BLUEPRINT_OFFER.name, basePrice, ['iconik_blueprint'], 'INR', 'India');
```

**Byte-identical.** Same `content_name` (`ICONIK Blueprint`), same value (2699), same `content_ids`, same `content_category` (`India`). Then both send the user to the same checkout, which sends them to the same success page.

### What this means in Events Manager

You cannot split `/` from `/offer-2699` on any event except PageView, where only the URL differs. Every ViewContent, InitiateCheckout, AddToCart and Purchase from the two entry points lands in one undifferentiated bucket. If you are running ads to `/offer-2699` and organic/SEO to `/`, **you currently cannot tell which one converts.**

CTA clicks are only partially differentiated — [LandingPageContent.tsx:176](src/app/LandingPageContent.tsx#L176) branches the hero label on `isOffer2699`, but the other four CTAs (`Whats Inside Section`, `Price Section`, `Bottom Section`, `Mobile Sticky`) send identical strings from both pages.

**Fix:** pass a distinguishing `contentCategory` through `LandingPageContent` — `'India · Root'` vs `'India · Offer2699'` — or a `content_ids` variant. One prop, threaded to the existing `trackViewContent` / `trackCTAClick` calls. Do this before anything else on this funnel; without it you cannot measure whether the other fixes worked.

### Funnel map as actually wired

```
/  ─┐
     ├─→ /offer-2699/checkout ─→ Razorpay ─→ /checkout/success
/offer-2699 ─┘                      │
                                    └─→ POST /api/payment (notes.checkout_source = 'offer_2699_checkout',
                                                            notes.base_product  = 'Iconik Style Consultation')
                                         └─→ Razorpay webhook order.paid
                                              └─→ CAPI **SKIPPED** (isMenOrderForCapi === false)

/checkout  ── ORPHANED (no inbound links, no redirect, still live at ₹3,299)

/man ─→ /man/checkout ─→ Razorpay ─→ /man/intake
                │            │
                │            ├─→ India:  POST /api/payment → webhook order.paid → CAPI ✅
                │            └─→ INTL:   POST /api/man-payment-intl → /api/man-confirm-payment → CAPI ✅
                │                        (+ webhook order.paid → CAPI ✅ — same event_id, dedups)
                └─→ Iconik Edit ₹699/mo → /api/man-edit-subscription → subscription.charged → **no Meta event at all**
```

---

## 1. Root + offer-2699 funnel

### P0 — Zero server-side purchase coverage, and no fallback path

This funnel calls **no confirm endpoint**. Unlike `/man`, `/stylist`, `/au`, `/global` and `/globe`, there is no `*-confirm-payment` fetch in the Razorpay handler ([offer-2699/checkout/page.tsx:266](src/app/offer-2699/checkout/page.tsx#L266) goes straight to `window.location.href = '/checkout/success?…'`). The only server-side touchpoint is the Razorpay `order.paid` webhook, and that gates CAPI on men's products only — [payment/webhook/route.ts:603](src/app/api/payment/webhook/route.ts#L603):

```ts
const isMenOrderForCapi = baseProduct === 'Iconik Man Style Blueprint' || baseProduct === 'Iconik Man Style Blueprint INTL';
if (isMenOrderForCapi) { … sendMetaPurchaseEvent(…) }
```

`base_product` for this funnel is `'Iconik Style Consultation'`. It never matches.

So for your highest-volume India funnel: if the browser Purchase doesn't fire — UPI app-switch that never returns, tab closed during the Razorpay redirect, ad-blocker that also kills `connect.iconik.pro`, iOS Low Power Mode killing the tab — **the conversion is invisible to Meta forever.** The Signals Gateway cannot help here; it only relays events the browser actually fires.

**Fix — the good news.** [api/payment/route.ts:81](src/app/api/payment/route.ts#L81) already writes both discriminators into the Razorpay order notes:

```ts
notes: { …, base_product: base_product, checkout_source: checkout_source || '' }
```

and the webhook already reads them back via `getBaseProductFromRazorpayOrder()`. So the fix is to replace the `isMenOrderForCapi` gate with a product→payload map:

```ts
const CAPI_PRODUCTS: Record<string, { contentName: string; contentIds: string[]; currency: MetaCurrency; contentCategory: string }> = {
  'Iconik Man Style Blueprint':      { contentName: 'ICONIK Man Complete Package', contentIds: [MAN_BLUEPRINT_PRODUCT_ID], currency: 'INR', contentCategory: 'Man Funnel' },
  'Iconik Man Style Blueprint INTL': { contentName: 'ICONIK Man Complete Package', contentIds: [MAN_BLUEPRINT_PRODUCT_ID], currency: 'USD', contentCategory: 'Man Funnel' },
  'Iconik Style Consultation':       { contentName: 'ICONIK Complete Package',     contentIds: ['iconik_style_consultation'], currency: 'INR', contentCategory: 'India' },
};
```

Event IDs already line up — the browser passes `razorpay_payment_id` as `transactionId` ([offer-2699/checkout/page.tsx:270](src/app/offer-2699/checkout/page.tsx#L270)) and the webhook would pass `payment.id`. `resolveMetaPurchaseEventId()` resolves both to the same string, so dedup works the moment you switch it on. **No client changes needed.**

Attribution is also already being persisted for this funnel — `attribution: getAttributionPayload()` is in the `/api/payment` body — so `attributionFromRow()` will find `fbp`/`fbc` (subject to the freeze bug in the main audit, §5.2).

### P1 — CompleteRegistration re-fires on every success-page load, with a stale value

[checkout/success/page.tsx:23](src/app/checkout/success/page.tsx#L23):

```ts
const purchaseAmount = localStorage.getItem('purchaseAmount') || urlAmount;
if (purchaseAmount) {
  trackCompleteRegistration(parseFloat(purchaseAmount), 'ICONIK Style Consultation Purchase', purchaseCurrency);
}
```

Three problems compounding:

1. `localStorage.purchaseAmount` is **written at checkout and never cleared**. The offer-2699 handler clears `sessionStorage[STORAGE_KEY]` but leaves `purchaseAmount` in localStorage indefinitely.
2. There is **no dedup guard and no event ID** — `trackCompleteRegistration` → `trackEvent` mints a fresh random `eventID` on every call.
3. Every other funnel guards its success-page event with a sessionStorage token (`au_purchaseTracked`, `globe_purchaseTracked`, `stylist_purchaseTracked`). This one has none.

Net: refresh the success page → second CompleteRegistration. Bookmark it and return next week → another one, at last week's amount. A second purchase months later → the *first* purchase's amount if localStorage read wins the `||`.

**Fix:** mirror the pattern the other funnels already use — write `sessionStorage.setItem('india_purchaseTracked', payment_id)` in the Razorpay handler, gate the success-page event on it, pass `payment_id` as the event ID, and `localStorage.removeItem('purchaseAmount')` after firing.

### P1 — No advanced matching on the success page

`/checkout/success` reads `localStorage.getItem('customerEmail')` at [line 41](src/app/checkout/success/page.tsx#L41) to render it on screen — and `customerPhone` is sitting in localStorage too, written by the checkout handler. But `updateUserData()` is never called, so CompleteRegistration goes to Meta with **no `em` and no `ph`**.

Two lines, meaningful EMQ gain:

```ts
const em = localStorage.getItem('customerEmail'); const ph = localStorage.getItem('customerPhone');
if (em || ph) updateUserData(em ?? undefined, ph ?? undefined);
```

### P1 — `content_ids` break between landing and checkout

| Step | `content_ids` |
|---|---|
| `/` and `/offer-2699` ViewContent | `['iconik_blueprint']` |
| `/offer-2699/checkout` ViewContent | `['iconik_style_consultation']` |
| InitiateCheckout (helper default) | `['iconik_style_consultation']` |
| Purchase | `['iconik_style_consultation', …addons]` |

The landing page is the odd one out. Any content-ID-based funnel report, catalogue association, or DPA retargeting audience built on `iconik_style_consultation` silently excludes the top of the funnel. Compare the man funnel, which uses `MAN_BLUEPRINT_PRODUCT_ID` consistently at all four steps — that is the pattern to copy.

### P2 — `/checkout` is orphaned but live, at a different price

Nothing links to `/checkout` any more. Grep across `src/` finds no `href="/checkout"`, and `next.config.ts` has no redirect for it. But the route is deployed, fully instrumented, and prices itself at **₹3,299** rather than ₹2,699 ([checkout/page.tsx:81](src/app/checkout/page.tsx#L81)):

```ts
const discountedPrice = isOffer2699Checkout ? 2699 : 3299;
```

It emits `ViewContent` / `InitiateCheckout` / `Purchase` with the *same* `content_ids` and `content_category` as the live funnel, at a different value. Anyone arriving from an old ad, an old email, a bookmark, or a stale SERP entry pollutes the live funnel's average order value and conversion rate.

**Fix:** either add a 301 in `next.config.ts` to `/offer-2699/checkout`, or — if you want it kept as a fallback — give it a distinct `content_category` so it is separable.

### P2 — Dead ends: `/checkout/intake` and `/checkout/basic-success`

Neither imports `metaPixel` at all. `/man/intake` and `/au/intake` both fire CompleteRegistration on submit; the India women's post-payment intake fires nothing, so you have no signal on intake completion for your largest funnel.

### P2 — Identifiers in the success URL reach Meta

The redirect is:

```
/checkout/success?payment_id=…&order_id=…&customer_id=…&db_order_id=…&amount=…
```

The PageView route key includes the canonicalised query string, so `event_source_url` carries `customer_id` and the Razorpay IDs to Meta and to the Signals Gateway. No direct PII (no email/phone), but these are durable customer identifiers in a third-party payload. Prefer `sessionStorage` or a short-lived token for the success-page handoff.

---

## 2. Man funnel

This is the **best-instrumented funnel in the codebase** and should be the template for the others. Worth stating plainly what it gets right, because the fixes below are refinements, not a rebuild:

- Consistent `MAN_BLUEPRINT_PRODUCT_ID` across ViewContent → AddToCart → InitiateCheckout → Purchase → CAPI.
- `captureAttribution()` on the landing page ([man/page.tsx:109](src/app/man/page.tsx#L109)) — one of only two funnels that does this, so UTMs and `fbclid` survive the trip to checkout.
- ViewContent correctly gated on `regionLoading` in both [man/page.tsx:113](src/app/man/page.tsx#L113) and [man/checkout/page.tsx:72](src/app/man/checkout/page.tsx#L72), so no INR-then-USD double-fire when geo resolves.
- `trackPurchase(…, response.razorpay_payment_id, response.razorpay_payment_id)` — the only call site that passes the payment ID as **both** `transactionId` and `eventId`, making it explicit rather than incidental.
- Advanced matching wired to the input handlers ([man/checkout/page.tsx:124](src/app/man/checkout/page.tsx#L124)).
- CAPI on both the India path (webhook) and the INTL path (confirm route).

### P0 — The Iconik Edit ₹699/mo upsell is completely invisible to Meta

`startIconikEditSubscription()` ([man/checkout/page.tsx:146](src/app/man/checkout/page.tsx#L146)) opens a second Razorpay checkout for the subscription. It fires **no** Meta event — no Purchase, no Subscribe, nothing.

On the server, `handleManEditSubscriptionEvent()` ([payment/webhook/route.ts:735](src/app/api/payment/webhook/route.ts#L735)) handles `subscription.charged`, calls `recordRevenueEvent()` with `productType: 'man_edit'` — and then **never calls `sendMetaPurchaseEvent()`**. Note the contrast: the equivalent stylist handler at [stylist-webhook/route.ts:87](src/app/api/stylist-webhook/route.ts#L87) *does* send CAPI for its Edit subscription. The man version was never wired up.

So every rupee of Iconik Edit MRR is in your revenue tables and absent from Meta. Meta is optimising the man funnel against blueprint-only value, systematically under-valuing whichever audiences convert best on the upsell.

**Fix:** copy the stylist-webhook block into `handleManEditSubscriptionEvent`, gated on `subscription.paid_count === 1` (see §7 of the main audit for why renewals should not be Purchases).

### P1 — `content_ids` / `num_items` include a product whose value is excluded

[man/checkout/page.tsx:276](src/app/man/checkout/page.tsx#L276):

```ts
const purchasedItems = [MAN_BLUEPRINT_PRODUCT_ID];
if (outfitPreviewAddon)   purchasedItems.push(MAN_OUTFIT_PREVIEW_PRODUCT_ID);
if (iconikEditSubscription) purchasedItems.push(MAN_EDIT_PRODUCT_ID);   // ← in content_ids
trackPurchase(totalAmount, …, purchasedItems, purchasedItems.length, …);
```

but `totalAmount` is:

```ts
const totalAmount = useMemo(() => discountedPrice + (outfitPreviewAddon ? outfitPreviewPrice : 0), …);
```

The ₹699 Edit price is deliberately **not** in `totalAmount` — correct, because it is billed through a separate subscription order. But `MAN_EDIT_PRODUCT_ID` is still pushed into `content_ids`, and `num_items` becomes 3. So the event claims three items while `value` covers two.

Worse, this is a **deduplicated pair with a mismatched payload**. The CAPI event for the same `event_id` builds its own list at [payment/webhook/route.ts:607](src/app/api/payment/webhook/route.ts#L607):

```ts
const contentIds = [MAN_BLUEPRINT_PRODUCT_ID, ...(hasOutfitPreview ? [MAN_OUTFIT_PREVIEW_PRODUCT_ID] : [])];
```

— never the Edit ID, `num_items` at most 2. Meta keeps whichever of the two arrives first and discards the other, so **which `content_ids` and `num_items` you see is a race**. `value` and `currency` happen to agree, which is what saves this from being a revenue bug, but the item data is non-deterministic.

**Fix:** drop `MAN_EDIT_PRODUCT_ID` from the blueprint Purchase's `content_ids` and give the subscription its own event (see the P0 above). That makes browser and server payloads identical.

### P1 — `/man/intake` reports ₹2,699 INR for international buyers

[man/intake/page.tsx:684](src/app/man/intake/page.tsx#L684):

```ts
trackCompleteRegistration(MAN_PRICING.IN.basePrice, 'ICONIK Blueprint Man — Intake Submitted', MAN_PRICING.IN.currency);
```

Hardcoded `MAN_PRICING.IN` — ₹2,699, INR. A US buyer who paid **$97 USD** submits intake and Meta records a **₹2,699 INR** CompleteRegistration. `/man/intake/page.tsx` is the only file in the man funnel that imports `MAN_PRICING` without also importing `useManRegion`; the landing and checkout both resolve region correctly.

**Fix:** use `useManRegion()` + `getManPricing(country)` here as the other two man pages already do. The email and phone are already in the form, and `updateUserData(form.email, form.phone)` is already called at [line 557](src/app/man/intake/page.tsx#L557), so matching is fine — only the value/currency is wrong.

### P2 — Double CAPI path for INTL, with a rounding divergence

An international man order hits CAPI twice:

| Source | `amount` expression | $119.50 order → |
|---|---|---|
| [man-confirm-payment:99](src/app/api/man-confirm-payment/route.ts#L99) | `Number(amount ?? updatedOrder.amount ?? 0)` | `119.5` |
| [payment/webhook:614](src/app/api/payment/webhook/route.ts#L614) | `Math.round(order.amount / 100)` | `119` |

Both use `payment.id` as `event_id`, so Meta deduplicates and no double-counting occurs — but again the surviving value depends on arrival order. `Math.round(order.amount / 100)` is exact for INR (rupees are the major unit in your schema) and lossy for USD cents.

**Fix:** `order.amount / 100` without the rounding, or branch on currency.

### P2 — CAPI `event_source_url` is hardcoded

`man-confirm-payment` and the webhook both pass `eventSourceUrl: 'https://www.iconik.pro/man/checkout'`, and `metaConversionsApi.ts` falls back to that same literal as its global default at [line 80](src/lib/metaConversionsApi.ts#L80). For the man funnel this happens to be true. When you extend CAPI to the offer-2699 funnel (§1 P0), make sure you pass the real URL — otherwise every India women's purchase will be attributed to a men's checkout page in Meta's URL reporting.

---

## 3. Side-by-side event coverage

| | `/` + `/offer-2699` | `/man` |
|---|---|---|
| PageView | ✅ (post-hydration only) | ✅ (post-hydration only) |
| ViewContent — landing | ✅ `iconik_blueprint` | ✅ `MAN_BLUEPRINT_PRODUCT_ID`, region-gated |
| ViewContent — checkout | ✅ `iconik_style_consultation` ⚠️ id drift | ✅ `MAN_BLUEPRINT_PRODUCT_ID`, region-gated |
| AddToCart / RemoveFromCart | ✅ 3 add-ons | ✅ 2 add-ons |
| InitiateCheckout | ✅ | ✅ explicit `contentIds` |
| Advanced matching at checkout | ✅ | ✅ |
| `captureAttribution()` on landing | ❌ | ✅ |
| Purchase — browser | ✅ `payment_id` | ✅ `payment_id` ×2 args |
| **Purchase — CAPI** | ❌ **none** | ✅ India + INTL |
| Upsell / subscription Purchase | n/a | ❌ **Edit ₹699/mo invisible** |
| CompleteRegistration | ⚠️ re-fires, stale value, no matching | ⚠️ hardcoded INR for INTL |
| Post-purchase intake event | ❌ | ✅ (see above) |

---

## 4. Recommended order of work

**Do first — one PR, unblocks measurement of everything else**

1. Differentiate `/` from `/offer-2699` via `contentCategory` threaded through `LandingPageContent`. Without this you cannot verify any other fix on this funnel.
2. Align the landing `content_ids` to `iconik_style_consultation`.

**Do second — recovers lost conversions**

3. Replace `isMenOrderForCapi` with a `base_product` → CAPI payload map; the order notes already carry what you need. *(Root/offer-2699 goes from zero to full server coverage; no client changes.)*
4. Add `sendMetaPurchaseEvent()` to `handleManEditSubscriptionEvent`, gated on `paid_count === 1`. *(Copy the stylist-webhook block.)*
5. Pass the real `eventSourceUrl` per funnel instead of the hardcoded `/man/checkout`.

**Do third — data correctness**

6. Region-aware `trackCompleteRegistration` in `/man/intake`.
7. Drop `MAN_EDIT_PRODUCT_ID` from the blueprint Purchase `content_ids`.
8. Guard `/checkout/success` CompleteRegistration with a sessionStorage payment-ID token; clear `purchaseAmount`; pass the payment ID as event ID.
9. Call `updateUserData()` on `/checkout/success` from the localStorage email/phone already sitting there.
10. Fix the USD rounding in the webhook CAPI amount.

**Cleanup**

11. 301 `/checkout` → `/offer-2699/checkout`, or give it a distinct `content_category`.
12. Add CompleteRegistration to `/checkout/intake`.
13. Move the success-page handoff off the query string.

Items 3 and 4 are the two that change what Meta can optimise against. Everything else is accuracy.
