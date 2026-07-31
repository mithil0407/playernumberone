# ICONIK — Meta Pixel / Signals Gateway / Conversions API Audit

**Date:** 2026-07-31
**Branch audited:** `fix-google-analytics-primary-id` (working tree, including uncommitted changes)
**Pixel ID:** `1373360484073939`
**Signals Gateway dataset:** `5610545609651043442` @ `https://connect.iconik.pro/`
**GA4 properties:** `G-LHX425PH4B`, `G-V4126JH4EJ`, `G-94CVS6PDTF` (+ `NEXT_PUBLIC_GA_MEASUREMENT_ID` if set)

---

## 1. Executive summary

The foundation is good: one declared Meta Pixel ID, one root loader, centralised helpers in `src/lib/metaPixel.ts`, deterministic Purchase event IDs, an explicit PageView owner with route-level dedup, and an internal-pages exclusion list. The Signals Gateway bridge preserves application-supplied event IDs and mirrors browser events even when the Meta SDK is blocked. 7/7 tests in `npm run test:meta-pixel` pass.

The implementation is **not production-complete**. The largest gap is direct server coverage: only the Men and Stylist/Style Scan funnels call the direct Conversions API. Match-quality inputs are incomplete, the Iconik Club paid funnel has no standard conversion events at all, the US funnel sends several browser events with INR because helper defaults are used, and production logs a Meta “multiple pixels with conflicting versions” warning on every tested full-page load.

| # | Severity | Finding |
|---|---|---|
| P0-1 | Critical | Direct Conversions API Purchase is wired to **2 of 13 revenue funnels**. Eleven funnels have no payment/webhook server backstop. |
| P0-2 | Critical | `fbp` / `fbc` are snapshotted into localStorage on first touch and **frozen forever** — usually captured *before* `fbevents.js` has written the `_fbp` cookie, so CAPI sends `fbp: null` for most users. |
| P0-3 | Critical | Attribution capture is **not global** — only `/man` and `/globe` call `captureAttribution()` on landing. Most funnels can lose UTMs / `fbclid` before checkout. |
| P0-4 | Critical | Paid Iconik Club membership (`/iconik-club/join`) has PageView only: no ViewContent, InitiateCheckout, Purchase, CompleteRegistration, advanced matching, or CAPI. |
| P1-1 | High | `customerName` is accepted by `sendMetaPurchaseEvent()` and then **silently dropped** — no `fn` / `ln` ever reaches Meta. |
| P1-2 | High | Phone numbers are sent as bare digits with **no country code** (`9876543210`, not `919876543210`) both client- and server-side. |
| P1-3 | High | Advanced matching (`fbq('init', …, {em, ph})`) is **not forwarded to the Signals Gateway** — the bridge only forwards `track*` calls. |
| P1-4 | High | PageView fires **only after React hydration**. There is no in-`<head>` PageView, so fast bounces are invisible. |
| P1-5 | High | CAPI has a 2 s abort timeout, no retry, and swallows failures — cold-start Vercel invocations silently lose conversions. |
| P1-6 | High | US ViewContent, AddToCart, RemoveFromCart, InitiateCheckout, and CTA events use helper defaults and are sent as **INR**, while Purchase is USD. |
| P2-1 | Medium | `stylist-webhook` sends a full `Purchase` for **every recurring subscription charge**, inflating ROAS against the original ad. |
| P2-2 | Medium | Lead-magnet quiz submissions fire a **custom** `quiz_lead_submit` event, never the standard `Lead`. |
| P2-3 | Medium | No `external_id`, `ct`, `st`, `zp`, or `country` in CAPI user data. |
| P2-4 | Medium | No consent gating / Meta Consent Mode, despite serving US / AU / UAE / EU-reachable traffic. |
| P2-5 | Low | CAPI only ever sends `Purchase` — no server-side `InitiateCheckout`, `Lead`, or `CompleteRegistration`. |
| P2-6 | Low | `console.log` of every pixel event ships to production. |
| P2-7 | Medium | Production logs Meta’s “multiple pixels with conflicting versions” warning on every tested full-page load. The DOM contains one Meta SDK and one Stape SDK, so this appears to be bridge/version interaction rather than a second hard-coded Pixel ID, but it still requires resolution/confirmation in Stape. |
| P2-8 | Medium | The 47 internal/admin/report routes suppress PageView but still load and initialise Meta and the Signals Gateway. |

### Audit scope and production evidence

- **Code scope:** all 217 `src/app/**/page.tsx` routes, all pixel helper call sites, root/nested layouts, payment/confirm/webhook routes, attribution, direct CAPI payload construction, and the Stape bridge.
- **Route result:** all 217 route files inherit the root Meta/Stape loader. 170 public routes are eligible for PageView; 47 internal/admin/client/report routes are excluded from PageView by `metaPageView.ts`.
- **Production checks:** `https://www.iconik.pro/`, `/us`, `/iconik-club/join`, and `/man/admin/login`.
- **Production loader:** one `connect.facebook.net/en_US/fbevents.js` element and one `connect.iconik.pro/sdk/5610545609651043442/events.js` element were present; the public Stape SDK returned HTTP 200.
- **Production signals:** the homepage and `/us` logged ViewContent + PageView; Iconik Club logged PageView only; `/man/admin/login` correctly logged no PageView.
- **Production diagnostic:** each tested hard navigation logged `Multiple pixels with conflicting versions were detected on this page.`
- **Automated verification:** `npm run test:meta-pixel` passed 7/7 tests.
- **Account-side limitation:** the Stape admin surface redirected to login in both available browser sessions. Therefore pipeline delivery rate, outgoing Meta response codes, Events Manager browser/server split, deduplication percentage, Event Match Quality, and production-token presence could not be independently verified. These are explicitly listed in §11.

### Page-level ownership summary

| Route class | Route files | Loader present | PageView |
|---|---:|---|---|
| Public marketing, SEO, funnel, checkout and success pages | 170 | ✅ | ✅ after React hydration |
| Internal/admin/client/report pages | 47 | ✅ | ❌ deliberately excluded |

The 47 PageView-excluded files are: `/dashboard`; all `/globe/admin/**`, `/man/admin/**`, and `/stylist/admin/**`; `/globe/report/**`, `/man/report/**`, and `/stylist/report/**`; `/stylist/login`; `/stylist/[stylistSlug]/dashboard`, `/consultations/**`, and `/reports/**`; `/stylist/edit/**`; all `/iconik-club/admin/**` and `/iconik-club/client/**`; and `/iconik-club/preview/**`.

---

## 2. Architecture as implemented

### Loader — [src/app/layout.tsx:129](src/app/layout.tsx#L129)

A single `beforeInteractive` inline script in the root `<head>` does three things in order:

1. Standard Meta pixel snippet → loads `connect.facebook.net/en_US/fbevents.js`, then `fbq('set','autoConfig',false,…)` and `fbq('init', '1373360484073939', {})`.
2. Signals Gateway fork-from-snippet bridge (`integrationMethod: forkFromSnippetCode@1.0`) → loads `connect.iconik.pro/sdk/5610545609651043442/events.js`, stashes the original `fbq` on `window.xbq`, and replaces `window.fbq` with a wrapper that (a) injects an `eventID` when one is absent, (b) dispatches to the Meta SDK, and (c) mirrors every `track*` call to `window.cbq` (the gateway).
3. `disablePushState = true` on both `fbq` and `xbq`, so the SDK never auto-fires PageView on SPA navigation.

Because the root layout is the only layout containing the Meta/Stape `<Script>` tag, **every page on the site loads the pixel and the gateway.** There is no page-level pixel drift and no second Pixel ID anywhere in the source. Production DOM inspection also found only one Meta SDK element and one Stape SDK element. However, the live Meta SDK/Signals SDK combination reports a conflicting-version warning on each hard navigation; see §4.4.

**The bridge is correct.** Two details worth calling out as working:

- `if (isTrack && (!arguments[3] || !arguments[3].eventID))` — the wrapper only generates an event ID when the caller didn't supply one, so the deterministic Purchase IDs from `metaPixel.ts` survive.
- The `f.xbq.callMethod` fallback ([layout.tsx:195](src/app/layout.tsx#L195)) exists because `window._fbq` still points at the *original* `fbq`, so `fbevents.js` attaches `callMethod` there rather than to the bridge. Without this, client-navigation events sat in the bridge queue and got their event IDs rewritten. This is already fixed.
- The `cbq` mirror at [layout.tsx:210](src/app/layout.tsx#L210) is **outside** the `callMethod` branch. That means if an ad blocker kills `connect.facebook.net`, gateway events still fire from the first-party domain. This is exactly the behaviour you want from the gateway.

### Client helpers — [src/lib/metaPixel.ts](src/lib/metaPixel.ts)

All standard events funnel through one private `trackEvent()`. Purchase resolves its event ID via `resolveMetaPurchaseEventId(transactionId, eventId)` ([metaTrackingContract.ts:9](src/lib/metaTrackingContract.ts#L9)), which returns `eventId || transactionId` — in practice the Razorpay payment ID.

### PageView — [src/lib/metaPageView.ts](src/lib/metaPageView.ts) + [MetaPixelProvider.tsx](src/components/MetaPixelProvider.tsx)

PageView ownership is explicit and singular: a `useEffect` in `MetaPixelProvider` calls `trackMetaPageView()` on every `pathname`/`searchParams` change, guarded by a `window.__iconikLastMetaPageViewRoute` route key with canonicalised (sorted) query strings. Internal surfaces — `/dashboard`, `/*/admin`, `/*/report`, `/stylist/login`, `/iconik-club/*` — are excluded. Excluded routes still update the route key so a browser-back to a public page re-fires. This is well-designed.

### Server — [src/lib/metaConversionsApi.ts](src/lib/metaConversionsApi.ts)

One function, `sendMetaPurchaseEvent()`, POSTing to Graph API `v24.0`. Called from exactly four routes.

---

## 3. Funnel × event coverage matrix

| Funnel | Landing | ViewContent | AddToCart | InitiateCheckout | Purchase (browser) | CompleteRegistration | **CAPI Purchase** |
|---|---|---|---|---|---|---|---|
| India women — main | `/` | ✅ | ✅ (+Remove) | ✅ | ✅ | ✅ | ❌ |
| India women — offer 2699 | `/offer-2699` | ✅ | ✅ | ✅ | ✅ | — | ❌ |
| **Men** | `/man` | ✅ | ✅ | ✅ | ✅ | ✅ (intake) | ✅ |
| US | `/us` | ⚠️ (INR instead of USD) | ⚠️ (+Remove; INR instead of USD) | ⚠️ (INR instead of USD) | ✅ USD | ✅ | ❌ |
| UAE | `/uae` | ✅ | ✅ | ✅ | ✅ (+OTO) | ✅ | ❌ |
| AU | `/au` | ✅ | ❌ | ✅ | ✅ (+OTO) | ✅ (intake) | ❌ |
| Global | `/global` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Globe | `/globe` | ✅ | ❌ | ✅ | ✅ (+OTO) | ✅ | ❌ |
| **Stylist / Style Scan** | `/stylist/style-score` | ❌ | — | ✅ | ✅ | — | ✅ |
| Monthly US tiered | `/monthly` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Monthly India | `/monthly/indian` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `checkout-monthly` | — | ❌ | ❌ | ✅ | ✅ | — | ❌ |
| **Iconik Club membership** | `/iconik-club/join` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Blog / SEO + lead tools | articles | — | — | — | — | — | ❌ (custom events only) |
| Contact | `/contact` | — | — | — | — | `Lead` ✅ | — |

Gaps visible in the matrix beyond CAPI:

- **AU / Global / Globe have no AddToCart** even though they have add-ons and OTOs.
- **`/stylist/style-score` fires no ViewContent and no Lead** — only a `CTA_Click` custom event, despite being the top of a paid funnel.
- **`/checkout-monthly` fires no ViewContent** — it jumps straight to InitiateCheckout.
- **`/checkout/intake`** (India women post-payment intake) fires nothing, while the equivalent `/man/intake` and `/au/intake` both fire CompleteRegistration.
- **`/iconik-club/join` is a paid recurring-membership checkout with no standard commerce event at any stage.** Its success page also fires nothing beyond PageView.
- **US currency is internally inconsistent:** the USD Purchase is correct, but landing ViewContent, add-on cart events, InitiateCheckout, and CTA custom events omit the currency argument and inherit `INR`.

---

## 4. Signals Gateway (Stape) findings

### 4.1 What is working

- Correct fork-from-snippet integration, correct host (`connect.iconik.pro`), correct dataset ID.
- Every browser `track` / `trackCustom` is mirrored to the gateway with the **same event ID** as the browser pixel → Meta deduplicates cleanly. There is no double-counting between the browser pixel and the gateway.
- Gateway mirroring survives `connect.facebook.net` being blocked.
- `autoConfig false` + `disablePushState true` means no surprise automatic events polluting the dataset.

### 4.2 P1-3 — Advanced matching never reaches the gateway

`updateUserData()` ([metaPixel.ts:89](src/lib/metaPixel.ts#L89)) calls `window.fbq('init', META_PIXEL_ID, { em, ph })`. The bridge only mirrors to `cbq` when the method **starts with `track`** ([layout.tsx:204](src/app/layout.tsx#L204)):

```js
if (typeof method === 'string' && method.indexOf('track') === 0) { … f.cbq… }
```

`'init'` fails that test. So the email/phone you collect on 22 call sites across every checkout page reaches the browser pixel but **never reaches the Signals Gateway**. The gateway can still derive `fbp`/`fbc` from first-party cookies, but it has no hashed email or phone — which is the single highest-weight matching signal.

**Fix:** mirror `init` calls to the gateway explicitly, e.g. in `updateUserData()`:

```ts
window.cbq?.('init', GATEWAY_DATASET_ID, userData);
```

or switch to passing user data on each event.

### 4.3 P1-4 — No PageView before hydration

The loader script `init`s the pixel but never fires `PageView`. The only PageView comes from `MetaPixelProvider`'s `useEffect`, which runs after React hydration. On a slow mobile connection, a user who bounces in the first 2–3 seconds produces **zero** events — no PageView on the pixel, none through the gateway. This under-counts landing-page traffic and starves Meta's optimisation of top-of-funnel signal.

**Fix:** fire the initial PageView in the `<head>` snippet with an event ID written to `window.__iconikLastMetaPageViewRoute`, so the provider's dedup guard suppresses the duplicate on hydration. The route key format is `pathname` + canonical search — you can build it inline.

### 4.4 P2-7 — Live conflicting-version warning

On each hard navigation tested in production (`/`, `/us`, `/iconik-club/join`, `/man/admin/login`), the console reported:

```text
[Meta Pixel] - Multiple pixels with conflicting versions were detected on this page.
```

The source and production DOM do **not** show a second hard-coded Pixel ID or a second actual `fbevents.js` element. The root snippet deliberately creates an original `fbq` (`xbq`) and then replaces `window.fbq` with the Signals Gateway wrapper. The warning is therefore most likely a version/identity conflict between those two exposed queues or between the custom fork snippet and the currently served Stape SDK.

This did not stop PageView or ViewContent in the browser checks, so it is not evidence that all events are failing. It is still material because it can hide a future real duplicate source and means the installed fork snippet is not clean against the current SDK. Re-export the current Signals Gateway installation snippet from Stape, compare it with `layout.tsx`, and have Stape confirm that the `xbq.callMethod` fallback remains supported.

### 4.5 P2-8 — Internal pages suppress events, not loaders

`isMetaPageViewExcluded()` correctly suppresses PageView for 47 private/internal route files, but the root `<head>` still downloads and initialises both SDKs before that client-side exclusion runs. This creates unnecessary third-party code, cookies/identifiers, console diagnostics, and performance overhead on admin, staff, customer portal and report pages.

**Fix:** prevent the loader itself from running on private surfaces, ideally through route groups/layout separation. If that is not practical, gate initialisation with a synchronous pathname exclusion before loading either SDK.

---

## 5. Conversions API findings

### 5.1 P0-1 — Direct CAPI covers 2 of 13 revenue funnels

`sendMetaPurchaseEvent()` is called from exactly four places:

| Route | Funnel | Trigger |
|---|---|---|
| [api/payment/webhook/route.ts:610](src/app/api/payment/webhook/route.ts#L610) | Men (India + INTL) | Razorpay `order.paid` — **gated on `isMenOrderForCapi`** |
| [api/man-confirm-payment/route.ts:95](src/app/api/man-confirm-payment/route.ts#L95) | Men INTL | Client confirm |
| [api/stylist-confirm-payment/route.ts:99](src/app/api/stylist-confirm-payment/route.ts#L99) | Stylist | Client confirm |
| [api/stylist-webhook/route.ts:87](src/app/api/stylist-webhook/route.ts#L87) | Stylist Edit | `subscription.charged` |

Note the gate at [payment/webhook/route.ts:603](src/app/api/payment/webhook/route.ts#L603):

```ts
const isMenOrderForCapi = baseProduct === 'Iconik Man Style Blueprint' || baseProduct === 'Iconik Man Style Blueprint INTL';
if (isMenOrderForCapi) { … sendMetaPurchaseEvent(…) }
```

The India women's main funnel and `offer-2699` flow through this **same webhook** and are explicitly excluded. There are `au-confirm-payment`, `global-confirm-payment`, `globe-confirm-payment`, `global-webhook`, and `globe-webhook` routes that never import the CAPI module at all. The US, UAE, monthly, legacy monthly, and Iconik Club flows also have no direct CAPI call. Iconik Club has neither a browser Purchase nor a CAPI Purchase.

**Why this matters even with the Signals Gateway:** the gateway only relays events the *browser* fires. It cannot recover a purchase where the browser never fired one — tab closed during the Razorpay redirect, UPI app-switch that doesn't return, network drop on the success page, or a payment that only settles later via webhook. Those are precisely the conversions the CAPI exists to recover, and for ten funnels you are recovering none of them.

**Fix:** lift the `isMenOrderForCapi` gate and map `baseProduct` → `{contentName, contentIds, currency, contentCategory}`, then add the same call to the AU / Global / Globe / US / UAE / monthly / Iconik Club payment-confirmation and webhook routes. Event IDs are already deterministic (`razorpay_payment_id`) in most existing browser Purchase paths. Iconik Club must first preserve the Razorpay payment ID in its subscription handler/webhook and use that same ID in both channels.

### 5.2 P0-2 — `fbp` is almost always null

[attribution.ts:134](src/lib/attribution.ts#L134):

```ts
export function getAttributionPayload(): Required<AttributionFields> {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return attributionToColumns(JSON.parse(stored));   // ← frozen forever
  …
  fbp: readCookie('_fbp'),
  fbc: readCookie('_fbc') || buildFbc(fbclid),
  …
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
```

Two compounding problems:

1. `_fbp` is written by `fbevents.js` **asynchronously after it loads**. The first `getAttributionPayload()` call typically happens in a landing-page `useEffect` (e.g. [man/page.tsx:109](src/app/man/page.tsx#L109)) or from `trackGrowthEvent()` on an article — often before the cookie exists. `readCookie('_fbp')` returns `null`.
2. The `if (stored) return …` early-return means the payload is **never refreshed**. A `null` `fbp` captured on visit one is still `null` at checkout three days later.

Since `fbp` is the identifier that ties a CAPI event back to the browser session that saw the ad, this materially depresses match quality and attribution on the two funnels that *do* have CAPI.

**Fix:** keep first-touch UTM/referrer/landing-page immutable, but re-read `_fbp` / `_fbc` on every call and merge them in:

```ts
const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
const live = { fbp: readCookie('_fbp'), fbc: readCookie('_fbc') || buildFbc(fbclid) };
const merged = { ...stored, attribution_payload: { ...stored?.attribution_payload,
  fbp: live.fbp ?? stored?.attribution_payload?.fbp,
  fbc: live.fbc ?? stored?.attribution_payload?.fbc } };
window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
```

Also note `buildFbc()` stamps `Date.now()` at *read* time rather than click time. Once fbp/fbc are refreshed live this matters less, but the `_fbc` cookie should always be preferred (it already is).

### 5.3 P0-3 — Attribution capture is not global

`captureAttribution()` is called on exactly **two** landing pages: [man/page.tsx:109](src/app/man/page.tsx#L109) and [globe/page.tsx:121](src/app/globe/page.tsx#L121). Every other funnel first touches attribution lazily — usually on the checkout page, and several flows do not call it until a submit/payment action.

Consequence: a user lands on `/?utm_source=fb&utm_campaign=X&fbclid=Y`, clicks through to `/checkout` via client navigation, and the first `getAttributionPayload()` call there records `landing_page: '/checkout'` with **no UTMs and no fbclid**, because those live in the landing URL's query string, not the checkout URL's. The orders table gets empty attribution, and any CAPI event built from `attributionFromRow()` gets no `fbc`.

**Fix:** call `captureAttribution()` once globally — the natural home is the `useEffect` in `MetaPixelProvider`, which already runs on every route change and already has `pathname`/`searchParams`.

### 5.4 P1-1 — `customerName` is accepted and discarded

[metaConversionsApi.ts:10](src/lib/metaConversionsApi.ts#L10) declares `customerName?: string | null` on `MetaPurchaseInput`, and three of the four call sites dutifully pass it. It is then never referenced — `userData` is built with only `em`, `ph`, `client_ip_address`, `client_user_agent`, `fbp`, `fbc`:

```ts
const userData: Record<string, string | undefined> = {
  em: sha256(input.customerEmail),
  ph: sha256(digitsOnly(input.customerPhone)),
  client_ip_address: input.ipAddress || undefined,
  client_user_agent: input.userAgent || undefined,
  fbp: getPayloadValue(input.attribution, 'fbp'),
  fbc: getPayloadValue(input.attribution, 'fbc'),
};
```

**Fix:** split on first whitespace and add `fn: sha256(first)`, `ln: sha256(rest)`. Free EMQ points — the data is already in the function.

### 5.5 P1-2 — Phone numbers lack a country code

Server-side `digitsOnly()` strips everything non-numeric; client-side `validatedAdvancedMatching()` does the same (`phone?.replace(/\D/g, '')`) and accepts 7–15 digits. An Indian mobile entered as `9876543210` is hashed as `9876543210`. Meta expects the country code without a `+`, i.e. `919876543210`. Both sides are consistently wrong, so dedup is unaffected — but the phone signal simply fails to match.

You already have `normalizeIndianWhatsappNumber()` in [src/lib/indiaPhone.ts:1](src/lib/indiaPhone.ts#L1) that does exactly this for 10-digit Indian numbers. Generalise it per market (IN → 91, US → 1, AE → 971, AU → 61) and apply it in both `validatedAdvancedMatching()` and `digitsOnly()`.

### 5.6 P1-5 — CAPI failures are silent and unretried

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 2000);
```

2 000 ms against Graph API from a cold Vercel function is tight. On abort or non-2xx, the code logs and returns — the purchase is gone. There is no queue, no retry, and no persisted "capi_sent" flag on the order to reconcile against.

**Fix (in order of effort):** raise the timeout to ~5 s; add one retry on network error / 5xx; record `meta_capi_sent_at` on the order row so failures are visible and replayable. Since `event_id` is the Razorpay payment ID, a replay is idempotent from Meta's side.

---

## 6. Deduplication analysis

This is the part most implementations get wrong, and yours is largely right. Summary:

| Pair | Shared key | Status |
|---|---|---|
| Browser pixel ↔ Signals Gateway | Bridge injects/preserves one `eventID` per call | ✅ Correct |
| Browser Purchase ↔ CAPI Purchase | `razorpay_payment_id` on both sides | ✅ Correct |
| `man/checkout` client Purchase ↔ `payment/webhook` CAPI ↔ `man-confirm-payment` CAPI | All three use `payment.id` | ✅ Correct (three sources, one event) |
| `stylist/checkout` Edit Purchase ↔ `stylist/checkout/success` Edit Purchase | Both pass `razorpay_payment_id` | ✅ Correct |
| `au/checkout` Purchase ↔ `au/thankyou` Purchase | `sessionStorage['au_purchaseTracked']` guard **and** shared payment ID | ✅ Belt and braces |
| `globe/checkout` ↔ `globe/thankyou` | Same pattern | ✅ |
| PageView across SPA navigations | `__iconikLastMetaPageViewRoute` + `disablePushState` | ✅ |

Two soft spots:

- [monthly/checkout/success/page.tsx:138](src/app/monthly/checkout/success/page.tsx#L138) passes `paymentId || undefined`. When `paymentId` is absent, `resolveMetaPurchaseEventId()` returns `undefined` and `trackEvent()` mints a random ID. Browser↔gateway dedup still works (one call, one ID), but a page refresh will produce a **second distinct Purchase**. Same shape at [au/thankyou/page.tsx:125](src/app/au/thankyou/page.tsx#L125) (`paymentId || undefined`).
- `stylist/checkout/success` reads its payment ID from `sessionStorage` and removes the key after firing — correct, but if the user reaches the success page in a new tab the Purchase is never fired at all. The CAPI on `stylist-confirm-payment` covers this, which is exactly why that funnel is healthy.

### P2-1 — Subscription renewals are counted as Purchases

[stylist-webhook/route.ts:87](src/app/api/stylist-webhook/route.ts#L87) fires a full `Purchase` on **every** `subscription.charged` event, not just the first:

```ts
eventType: subscription.paid_count === 1 ? 'subscription_initial' : 'subscription_charge',
…
await sendMetaPurchaseEvent({ eventId: payment.id, … contentName: 'THE ICONIK EDIT', … });
```

The revenue-event layer distinguishes initial from renewal; the Meta layer does not. Month 6 of a subscription gets attributed back to the ad that drove month 1, inflating that campaign's reported ROAS and skewing optimisation toward it.

**Fix:** either gate on `subscription.paid_count === 1`, or send renewals as a distinct custom event (`SubscriptionRenewal`) that you exclude from your ROAS columns.

---

## 7. Data quality / Event Match Quality

Current CAPI user-data parameters: `em`, `ph`, `client_ip_address`, `client_user_agent`, `fbp`, `fbc`.

Missing and cheaply available:

| Parameter | Availability | Notes |
|---|---|---|
| `fn` / `ln` | Already passed into the function | See §5.4 — pure bug |
| `external_id` | Order ID / customer ID present in every call site | Highest-value addition after email |
| `country` | Known per funnel (IN / US / AE / AU) | One-line constant per route |
| `ct` / `st` / `zp` | Not collected at checkout | Would need a form field |

Also note that `stylist-webhook` is the only CAPI call site that passes **neither** `userAgent` nor `ipAddress`. That is defensible — it runs in a Razorpay webhook where the request IP is Razorpay's, not the customer's, and sending the wrong IP is worse than sending none. The other webhook (`payment/webhook`) has the same property but *also* omits them, correctly. `man-confirm-payment` and `stylist-confirm-payment` run in the customer's own request context and correctly forward `x-forwarded-for` / `user-agent`.

One inconsistency worth flagging: `payment/webhook` computes `amount: Math.round(order.amount / 100)`. For INR that is exact. For the `Iconik Man Style Blueprint INTL` branch that same line rounds USD cents away — a $119.50 order is reported to Meta as `119`.

---

## 8. Other events and hygiene

### P2-2 — Lead-magnet submissions are custom events

[growthAnalytics.ts:165](src/lib/growthAnalytics.ts#L165):

```ts
if (!isGoogleOnlyGrowthEvent(eventName)) {
  window.fbq?.("trackCustom", eventName, parameters);
}
```

`quiz_lead_submit`, fired from [LeadMagnetTool.tsx:377](src/components/LeadMagnetTool.tsx#L377), goes to Meta as a **custom** event. Custom events can be used as optimisation targets, but standard `Lead` carries Meta's cross-advertiser prior and is what Advantage+ campaigns expect. `trackLead()` exists in `metaPixel.ts` and is used on exactly one page (`/contact`).

**Fix:** fire `trackLead()` alongside the growth event at the quiz submit and at `/stylist/style-score` completion.

The `GOOGLE_ONLY_GROWTH_EVENTS` set (`checkout_started`, `purchase`) is a correct and deliberate guard — it stops the lower-case growth events from double-signalling against the standard `InitiateCheckout` / `Purchase`. Good call.

### P2-4 — No consent gating

There is no Meta Consent Mode call (`fbq('consent', 'revoke'|'grant')`), no cookie banner, and no gating of `getAttributionPayload()`'s localStorage write. Given active US, AU, UAE and "global" funnels, this is a live exposure rather than a theoretical one. `_fbp` is set unconditionally on first paint.

### P2-6 — Production console noise

`trackEvent()`, `initMetaPixel()`, `updateUserData()` and `trackMetaPageView()` all `console.log` on every fire, including full event payloads and event IDs. Gate on `process.env.NODE_ENV !== 'production'`.

### P1-6 — US events report INR before Purchase

The Meta helpers default currency to INR. The US landing and checkout omit the currency argument in several calls:

- `us/page.tsx`: ViewContent and CTA events.
- `us/checkout/page.tsx`: AddToCart, RemoveFromCart and InitiateCheckout.

The final Purchase explicitly passes USD, so one funnel session contains INR product/cart/checkout events followed by a USD Purchase. This corrupts value-based audiences and makes funnel-value reporting internally inconsistent.

**Fix:** pass `'USD'` and the US category on every US call, or remove market-specific defaults from the generic helpers so TypeScript requires a currency.

### P0-4 — Iconik Club is a paid blind spot

`/iconik-club/join` creates a Razorpay subscription for ₹699/month or ₹7,188/year and redirects to `/iconik-club/join/success`, but neither page imports `metaPixel.ts`. The subscription API/webhook also never calls `sendMetaPurchaseEvent()`. Only the global PageView is emitted.

At minimum this funnel needs ViewContent on join, InitiateCheckout on validated submit, Purchase on the first successful charge with a deterministic payment ID, and CompleteRegistration after the membership/profile is activated. Renewals should be a separate custom event such as `SubscriptionRenewal`, not another acquisition Purchase.

### Environment configuration

`.env.local` contains **no** `META_ACCESS_TOKEN`, `META_TEST_EVENT_CODE`, `META_GRAPH_API_VERSION`, or `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Locally, `sendMetaPurchaseEvent()` therefore short-circuits at [metaConversionsApi.ts:51](src/lib/metaConversionsApi.ts#L51) with a warning and sends nothing. **Verify `META_ACCESS_TOKEN` is set in Vercel production**, otherwise even the two wired funnels are sending zero server events. There is also no `.env.example` documenting these keys.

### Tests

`npm run test:meta-pixel` → **7/7 pass** (`node --experimental-strip-types --test`). Note these files are *not* picked up by `vitest` (they use `node:test`), so they will not run in a `vitest`-based CI job. Coverage is PageView dedup, the route-key canonicalisation, the internal-page exclusions, and the assertion that the gateway loader does not own PageView. Nothing covers Purchase event-ID resolution end-to-end or the CAPI payload shape.

---

## 9. Prioritised remediation plan

**Week 1 — recover lost conversions**

1. Remove the `isMenOrderForCapi` gate in `payment/webhook` and map product → CAPI payload for all India products. *(P0-1, biggest single win)*
2. Add `sendMetaPurchaseEvent()` to the AU, Global, Globe, US, UAE, monthly and Iconik Club payment-confirmation/webhook paths. *(P0-1)*
3. Instrument Iconik Club end to end and preserve its Razorpay payment ID for browser/server deduplication. *(P0-4)*
4. Confirm `META_ACCESS_TOKEN` exists in Vercel production. *(blocking — everything above is inert without it)*

**Week 1 — recover match quality**

5. Refresh `_fbp` / `_fbc` on every `getAttributionPayload()` call instead of freezing the first-touch snapshot. *(P0-2)*
6. Call `captureAttribution()` globally from `MetaPixelProvider`. *(P0-3)*
7. Send `fn` / `ln` from the `customerName` already being passed in. *(P1-1, ~4 lines)*
8. Normalise phones to country-code digits on both client and server. *(P1-2)*
9. Add `external_id` (order ID) and `country` to CAPI user data. *(P2-3)*
10. Correct every US event to USD. *(P1-6)*

**Week 2 — plug the gateway and top-of-funnel gaps**

11. Mirror `fbq('init', …, userData)` to `cbq` so advanced matching reaches the Signals Gateway. *(P1-3)*
12. Fire the initial PageView in the `<head>` snippet, pre-seeding the dedup route key. *(P1-4)*
13. Raise the CAPI timeout to 5 s, add one retry, persist `meta_capi_sent_at`. *(P1-5)*
14. Gate `stylist-webhook` Purchase on `paid_count === 1`. *(P2-1)*
15. Fire standard `Lead` on quiz submit and style-score completion. *(P2-2)*
16. Replace the hand-edited Signals Gateway fork snippet with the current Stape-exported snippet and resolve the live conflicting-version warning without losing deterministic IDs. *(P2-7)*

**Backlog**

17. Add AddToCart to AU / Global / Globe; ViewContent to `/stylist/style-score` and `/checkout-monthly`; CompleteRegistration to `/checkout/intake`.
18. Stop loading Meta/Stape SDKs on the 47 internal/private route files. *(P2-8)*
19. Implement Meta Consent Mode + consent banner. *(P2-4)*
20. Gate production `console.log`s. *(P2-6)*
21. Add `.env.example`; wire `test:meta-pixel` into CI (it will not run under `vitest`).

---

## 10. Overall assessment

| Area | Rating | Rationale |
|---|---|---|
| Base Pixel installation | **Good with warning** | One source Pixel ID, one root loader, consistent helper layer; live version-conflict diagnostic must be resolved. |
| PageView | **Good logic, incomplete delivery** | Correct SPA dedup/exclusions; initial view waits for hydration. |
| Browser funnel events | **Mixed** | Strong on core paid funnels, but Iconik Club is uninstrumented and US pre-purchase currency is wrong. |
| Signals Gateway | **Structurally sound, account delivery unverified** | First-party SDK is live and event IDs are mirrored; advanced matching is not mirrored and dashboard delivery could not be inspected. |
| Direct CAPI | **Poor coverage** | Purchase only, 2/13 funnels, limited user data, 2 s timeout, no retry/reconciliation. |
| Deduplication | **Good where implemented** | Browser↔gateway IDs and Men/Stylist browser↔direct-CAPI Purchase IDs are deterministic. Most funnels have no direct server pair to deduplicate. |
| Match quality | **Needs work** | Frozen `fbp`/`fbc`, missing name/external ID/country, unnormalised phone, no gateway advanced matching. |
| Consent/privacy | **Needs work** | No consent gate; Meta/Stape still initialise on private/internal routes. |

**Bottom line:** do not treat the current setup as “full CAPI coverage.” It is a broad browser Pixel + Signals Gateway installation with solid event-ID handling, plus a narrow direct Purchase CAPI implementation for two funnels. The priority is to instrument payment-confirmed server events for every revenue path, repair identity/attribution inputs, and then verify server delivery and deduplication in Stape and Meta Events Manager.

## 11. Account-side closeout checklist

These checks require an authenticated Stape/Meta session and are the remaining evidence needed for a telemetry-complete audit:

1. In Stape Signals Gateway, confirm the website Pixel data source is receiving PageView, ViewContent, InitiateCheckout and Purchase.
2. Confirm the Meta destination pipeline is enabled and inspect outgoing 4xx/5xx rates for the last 7 and 28 days.
3. In Meta Events Manager, record browser/server event counts, deduplicated counts and deduplication rate per standard event.
4. Record Event Match Quality separately for PageView, ViewContent, InitiateCheckout, Lead and Purchase.
5. Confirm the live production environment contains `META_ACCESS_TOKEN` and does not contain `META_TEST_EVENT_CODE`.
6. Run one non-chargeable test-event sequence per funnel, then one real low-value/test-mode payment per payment architecture, verifying the same Purchase `event_id` in browser, Signals Gateway and direct CAPI.
7. Resolve every active Diagnostics item, especially duplicate/version warnings, missing event IDs, missing currency/value, and low match-quality parameters.
