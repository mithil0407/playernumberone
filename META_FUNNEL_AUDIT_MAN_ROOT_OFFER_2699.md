# ICONIK — Focused Meta Pixel / Signals Gateway / CAPI Audit

**Scope:** `/man`, `/`, and `/offer-2699` acquisition funnels  
**Date:** 2026-07-31  
**Audit type:** code + production-loader verification; no implementation changes

---

## 1. Actual funnel routing

The homepage and `/offer-2699` are two landing creatives feeding the **same** checkout and post-payment path:

```text
/ ───────────────────────┐
                         ├─> /offer-2699/checkout
/offer-2699 ─────────────┘        │
                                  ├─> /checkout/success
                                  └─> /checkout/intake

/man ─> /man/checkout ─> /man/intake
```

Evidence:

- `BLUEPRINT_OFFER.currentPriceInr` is `2699`.
- `BLUEPRINT_OFFER.checkoutPath` is `/offer-2699/checkout`.
- The root page uses `LandingPageContent` defaults.
- `/offer-2699` explicitly passes the same ₹2,699 price and checkout URL.

Therefore:

- The current root funnel does **not** use `/checkout`.
- Root and `/offer-2699` are indistinguishable after the landing-page click unless first-touch attribution was preserved.
- `/checkout` is a separate legacy/direct checkout and is outside this focused funnel path.

## 2. Coverage matrix

| Signal | Root → offer checkout | `/offer-2699` → offer checkout | `/man` |
|---|---|---|---|
| PageView | ✅ after hydration | ✅ after hydration | ✅ after hydration |
| Landing ViewContent | ✅ | ✅ | ✅ |
| CTA custom events | ✅ | ✅ | ✅ |
| Checkout ViewContent | ✅ | ✅ | ✅ |
| AddToCart / RemoveFromCart | ✅ add-ons | ✅ add-ons | ✅ add-ons |
| InitiateCheckout | ✅ | ✅ | ✅ |
| Purchase — browser | ✅ | ✅ | ✅ |
| Purchase — Signals Gateway | ✅ if Stape pipeline is delivering | ✅ if Stape pipeline is delivering | ✅ if Stape pipeline is delivering |
| Purchase — direct backend CAPI | ❌ | ❌ | ✅ |
| CompleteRegistration | ⚠️ payment-success page | ⚠️ payment-success page | ✅ actual intake submission |
| Global first-touch attribution capture | ❌ | ❌ | ✅ |
| Browser/server Purchase dedup | N/A — no direct server pair | N/A — no direct server pair | ✅ payment ID |

## 3. Root and `/offer-2699` findings

### R1 — Critical: no direct payment-confirmed CAPI

Both flows create orders through `/api/payment` with:

```text
base_product = "Iconik Style Consultation"
```

The Razorpay webhook calls `sendMetaPurchaseEvent()` only when `base_product` is:

```text
Iconik Man Style Blueprint
Iconik Man Style Blueprint INTL
```

Consequently, root/offer purchases depend on the browser returning from Razorpay and executing `trackPurchase()`. Signals Gateway mirrors that browser event, but it cannot manufacture a Purchase that the browser never fired.

**Impact:** UPI app-switch abandonment, closed tabs, redirect failures and late webhook settlement can produce a paid order with no Meta Purchase.

### R2 — Critical: first-touch attribution is lost on normal navigation

Neither `/` nor `/offer-2699` calls `captureAttribution()`.

The first `getAttributionPayload()` call happens during checkout/payment. A visitor can land on:

```text
/?utm_source=facebook&utm_campaign=women_2699&fbclid=...
```

and then navigate to `/offer-2699/checkout`, where the original query parameters are no longer present. The stored landing page becomes the checkout URL, while UTM and `fbclid` values are empty.

This is especially damaging here because first-touch attribution is also the only reliable way to distinguish the root creative from `/offer-2699` after they merge into one checkout.

### R3 — High: the two landing funnels use the same Meta product identity

Both landing pages send:

```text
content_name = "ICONIK Blueprint"
content_ids = ["iconik_blueprint"]
content_category = "India"
value = 2699
currency = "INR"
```

Most CTA event names are also shared. Meta therefore receives no explicit `funnel_source`, `offer_variant`, or unique product ID that separates the root page from `/offer-2699`.

**Impact:** creative/funnel reporting must rely on URL/UTM data—the exact data currently lost before checkout.

### R4 — Medium: product identity changes between landing and checkout

Landing ViewContent uses:

```text
iconik_blueprint
```

Checkout and Purchase use:

```text
iconik_style_consultation
```

This breaks a clean ViewContent → InitiateCheckout → Purchase product sequence and makes product-level funnel analysis less reliable.

### R5 — High: CompleteRegistration is attached to payment success, not intake

`/checkout/success` emits `CompleteRegistration` when it finds an amount in localStorage or the URL. `/checkout/intake`, where the customer actually completes their information, emits no standard Meta event.

The success event:

- is triggered from browser-controlled URL/localStorage data;
- has no deterministic event ID;
- can fire again on refresh or revisit;
- represents payment success, not registration completion.

The equivalent Men event is correctly emitted only after the intake submission is saved.

### R6 — Working correctly

- Currency is consistently INR.
- Add-on AddToCart/RemoveFromCart values are explicit.
- Purchase uses the Razorpay payment ID as its browser event ID.
- Browser → Signals Gateway event IDs are preserved.
- Both landing variants reach the intended dedicated offer checkout.

## 4. `/man` findings

### M1 — Strong: the core Purchase path has direct CAPI

The Men funnel is the healthiest of the three:

- India Purchase is sent from the Razorpay `order.paid` webhook.
- International Purchase is sent from `/api/man-confirm-payment` and can also arrive through the webhook.
- Browser and server use the same Razorpay payment ID.
- Duplicate server submissions use the same `event_name + event_id` identity.
- Landing, checkout and Purchase use the stable `iconik_man_style_blueprint` product ID.

### M2 — Critical: the optional Edit subscription is reported as purchased too early

When “Iconik Edit Monthly” is selected:

1. It is appended to the main Purchase `content_ids`.
2. It increases `num_items`.
3. It does **not** increase the main Purchase value.
4. The browser Purchase fires before the separate subscription authorization modal.
5. If the subscription modal fails or is dismissed, the already-fired Purchase still claims it was bought.
6. The direct CAPI Purchase correctly excludes this subscription, creating browser/server custom-data disagreement under the same event ID.

The ₹699 subscription should not be part of the one-time Blueprint Purchase. It needs its own event only after the subscription payment/authorization succeeds.

### M3 — Critical: `fbp` can be frozen as null

`/man` correctly calls `captureAttribution()` on landing, but that call can run before `fbevents.js` creates `_fbp`. The resulting null value is saved to localStorage and never refreshed.

So Men has direct CAPI, but the identifier that ties the server Purchase to the ad/browser session can be missing precisely because attribution is captured early.

### M4 — High: CAPI match data is incomplete

The direct Men CAPI includes some combination of:

- email;
- phone;
- `fbp` / `fbc`;
- IP and user agent on the international confirmation request.

Problems:

- Indian 10-digit phone numbers are hashed without the `91` country code.
- `customerName` is passed by the webhook but discarded by `sendMetaPurchaseEvent()`.
- `external_id` is missing.
- `country` is missing.
- City/state/postcode are not collected.
- The webhook path has no customer IP/user-agent, which is correct for a payment-provider webhook, but makes strong persisted browser identifiers more important.

### M5 — Medium: international value can lose cents in the webhook

The webhook reports:

```text
Math.round(order.amount / 100)
```

That is safe for whole-rupee India pricing but rounds an international decimal value such as `$119.50` to `120`.

### M6 — Working correctly

- Landing attribution capture exists.
- Market-specific INR/USD pricing and currencies are passed explicitly.
- ViewContent, add-on cart events, InitiateCheckout and core Purchase share stable product IDs.
- Core Purchase browser/server deduplication is deterministic.
- CompleteRegistration is tied to successful intake persistence.

## 5. Shared Signals Gateway / Pixel findings

These affect all three funnels:

1. **Advanced matching is browser-only.** `updateUserData()` sends `fbq('init', …, {em, ph})`, but the bridge forwards only commands beginning with `track`; the Stape queue never receives that `init`.
2. **Initial PageView waits for React hydration.** Very fast bounces may produce no event.
3. **Production emits a conflicting-version warning.** The live site logged “Multiple pixels with conflicting versions were detected” on every tested hard navigation, although the DOM contained one Meta SDK and one Stape SDK.
4. **No consent gate.** Meta and Stape initialise before consent.
5. **Production console logging is noisy.** Event names, payload objects and event IDs are logged.

## 6. Focused priority order

### Priority 0 — conversion recovery

1. Add direct webhook CAPI for `Iconik Style Consultation`, covering the shared root/offer checkout.
2. Capture first-touch attribution globally and refresh `_fbp`/`_fbc` on every read.
3. Remove the Men Edit subscription from the main Blueprint Purchase; send a separate subscription event after confirmed authorization.

### Priority 1 — signal quality

4. Add explicit `funnel_source`/variant identity for root versus `/offer-2699`.
5. Standardise the women’s product ID across landing, checkout and Purchase.
6. Move women’s CompleteRegistration to successful intake submission and deduplicate it.
7. Add `fn`, `ln`, `external_id`, `country`, and country-code-normalised phone to Men and women CAPI payloads.
8. Mirror advanced-matching user data to the Signals Gateway.

### Priority 2 — delivery hygiene

9. Fire the initial PageView before hydration while preserving route deduplication.
10. Replace/reconcile the Signals Gateway snippet with Stape’s current export to remove the live version warning.
11. Add retry/reconciliation for direct CAPI and persist delivery status.
12. Add consent gating and disable production event logging.

## 7. Recommended reporting structure

Use one dataset and stable events, but distinguish these sources explicitly:

| Funnel | Suggested `content_category` | Suggested base `content_id` |
|---|---|---|
| Root women | `women_root` | `iconik_women_blueprint` |
| Offer women | `women_offer_2699` | `iconik_women_blueprint` |
| Men | `man_blueprint` | `iconik_man_style_blueprint` |

Keep the same women’s product ID across both landing variants so product reporting remains coherent; use `content_category`, `funnel_source`, UTMs, and the landing URL to separate creative paths.

## 8. Bottom line

- **Men:** strongest core funnel and the only one of this focused set with direct CAPI, but the Edit subscription event is materially wrong and match quality is weaker than it appears.
- **Root + `/offer-2699`:** browser event coverage is broad, but they are one merged ₹2,699 funnel with no direct CAPI and unreliable landing attribution.
- **Best first move:** add payment-webhook CAPI for the women’s shared checkout, then fix attribution refresh globally. Those two changes recover the largest amount of currently missing and unattributed conversion data.
