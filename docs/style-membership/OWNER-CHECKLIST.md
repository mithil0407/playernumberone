# Style Membership: owner checklist before launch

The funnel is built and tested locally, with nothing live: no live prices, no ads, no messages sent, and no production migration. Everything below needs your decision or your hands.

## 1. Prices and promises to confirm

All of these live in one file: `src/lib/styleMembershipConfig.ts`. Amounts include GST.

| What | Now | Confirm |
|---|---|---|
| Subscribe and save (selected by default) | ₹1,799 every 3 months, about ₹20 a day | ☐ |
| 3 months, one-time (the anchor) | ₹2,999, no renewal ("Save 40%" badge comes from these two prices) | ☐ |
| Founding quarter, past buyers only | ₹1,499 for the first quarter, then ₹1,799. Shown only when the number or email matches a completed order (`orders.status = 'completed'`), and on `/style-membership/join?offer=founding` | ☐ |
| Founding cohort close date | 31 October 2026 (shown as a date, no timer; the line disappears after it) | ☐ |
| Bump: wedding and festive look pack | ₹499 | ☐ |
| Bump: "Style him too" | ₹999 | ☐ |
| Bump: Blueprint by a human stylist | ₹1,999 for members (₹2,699 struck through) | ☐ |
| Guarantee | "Love your first 3 looks or a full refund within 7 days", by WhatsApp message | ☐ |
| Social proof | "1,200+ Indian women styled" (the blueprint's past-buyer count). `siteFacts.ts` says 4,000 women elsewhere on the site: pick one number so the claims don't contradict each other | ☐ |
| Price comparison | "A personal stylist: ₹5,000–15,000 for one session" | ☐ |
| Renewal reminder | We promise a WhatsApp reminder 3 days before every renewal (schedule step "pre-debit", day 87) | ☐ |

**Bump fulfilment is not automated.** Ticked bumps are saved on the membership (`style_memberships.bumps`) and listed in the hand-off, but the festive pack, the men's styling and the Blueprint call still need someone to deliver them.

## 2. The stylist

- `STYLIST` in the config is a placeholder: the name "Ananya" and an AI-generated portrait (`public/membership/stylist-portrait.webp`). The blueprint promises a real ICONIK stylist who signs the reels. **Replace the name and the photo with the real stylist before launch**, or the welcome screen presents a generated face as a real person.
- The FAQ and the chat demo say plainly that the day-to-day WhatsApp stylist is an AI and that ICONIK stylists check the Style Plan.

## 3. Supabase migration (not run anywhere)

Run `supabase/migrations/add_style_membership.sql` once in the Supabase SQL editor before turning the funnel on. It is safe to re-run. It creates:

- `style_membership_leads`: the WhatsApp gate, quiz answers, selfie reading, generated look
- `style_memberships`: plan, bumps, payment, period end, autopay state, member-code hash, agent link
- `style_membership_events`: one row per quiz screen and key action, with `utm_content`
- `style_membership_messages`: the queued WhatsApp messages (DNA card, the 90-day schedule, renewal pay links). Nothing sends these yet.
- the view `style_membership_screen_funnel`: drop-off by screen and reel for the last 30 days

RLS is on with no policies (service role only). Selfies and generated looks go into the existing private bucket `style-scan-private` under `membership/`.

Production uses Supabase automatically. Local development writes to `.style-membership-dev/store.json` (gitignored); `STYLE_MEMBERSHIP_STORE` overrides this.

## 4. Razorpay

1. **Create the quarterly plan** in the live dashboard: ₹1,799, period "monthly", interval 3. Put its id in Vercel as `STYLE_MEMBERSHIP_PLAN_QUARTERLY`. Until then, "Set up autopay" on the welcome page says autopay isn't switched on and that a payment link will come before renewal.
2. **Webhook events**: the existing webhook (`/api/payment/webhook`) now hands membership events to `styleMembershipWebhook.ts` first, recognised by `notes.product = style_membership`. Add these events to it in the dashboard if they aren't on: `subscription.authenticated`, `subscription.pending`, `subscription.halted`, `payment_link.paid`. (`order.paid`, `payment.captured`, `subscription.activated`, `subscription.charged`, `subscription.cancelled` are already used.)
3. **UPI Autopay** must be enabled on the account for subscriptions. Run one mandate in test mode and check what the customer sees at authorisation. The welcome page says "Some banks show a small authorisation that is refunded"; correct it if Razorpay's flow differs.
4. **Pay with a real test payment once in a normal browser.** In my local run the Razorpay checkout opened correctly (test mode, ₹2,298 and ₹1,499), but the in-app browser blocks the netbanking and 3-D Secure popups, so I completed the payment step by posting a correctly signed confirmation to `/api/style-membership/confirm`.

## 5. The renewals cron

Add a daily GET on cron-job.org (it is safe to miss a day or run twice):

```
GET https://www.iconik.pro/api/style-membership/renewals
Authorization: Bearer <CRON_SECRET>
```

For members whose quarter ends within 3 days and who have no working autopay, it creates a Razorpay payment link (with Razorpay's own SMS and email turned off) and queues the WhatsApp message. It never sends anything. It also deletes selfies older than 30 days. A failed autopay (`subscription.pending` or `halted`) prepares the same link straight from the webhook.

## 6. WhatsApp: what is wired and what isn't

- **The hand-off is wired.** The welcome page's "Open WhatsApp" button types `ICM-XXXXXXXX`. `agentRuntime.handleAgentInbound` links that membership first; a new chat from the number she paid with also links without the code. Her `lite_profile` then carries the membership, her quiz summary and her 90-day schedule (the agent reads that profile every turn). An active member skips the free-tier limits on runs, pictures and daily messages, with 7 days' grace after the paid period. **This touches the live agent once merged**, so review that diff (`src/lib/agentRuntime.ts`, `src/lib/agentGrowthStore.ts`).
- **Sending is not wired.** The DNA card at the gate, the schedule steps and the renewal pay links are rows in `style_membership_messages` with `status = 'queued'`. Steps outside WhatsApp's 24-hour window need approved templates. Create templates for: the Style DNA card, ask-before-you-buy (day 2), occasion plan (day 7), referral (day 10), monthly drops (days 30 and 60), recap (day 80), the 3-day renewal reminder (day 87) and the renewal pay link. Then decide who sends them: the agent's job runner, or a person.
- Members only get replies on follow-up messages while the agent's free tier is enabled (it is today).

## 7. Tracking

- Every quiz screen has its own URL (`/style-membership/quiz/<screen>`) and fires a Meta custom event `StyleQuizScreen` plus a row in `style_membership_events`. PageView comes from the existing provider.
- `Lead` (gate), `InitiateCheckout` and `Purchase` go to both the pixel and the Conversions API with the same event IDs (Purchase uses the Razorpay payment ID). The CAPI sender was generalised (`sendMetaServerEvent`); Purchase sends the same payload as before.
- First-touch attribution is carried on every lead, membership and event row. **Reel links:** `iconik.pro/sm/<reel-id>` goes to the quiz with `utm_content=reel_<reel-id>`; `iconik.pro/sm/bio` goes to the sales page with `utm_content=bio`. Use one id per reel in the comment-keyword DM automation.
- Microsoft Clarity stays off on these pages (its allowlist in `src/lib/clarity.ts`). Add `/style-membership/join` and the result page there if you want recordings.
- All membership pages are `noindex` for the organic test. Flip `/style-membership/join` in `src/lib/seoContent.ts` and its page metadata when you want it in search.

## 8. Images that need a human eye

63 images in `public/membership/` (shot list and prompts in `shot-list.md`). I reviewed every one and re-rolled the ones that failed. These are acceptable but worth your look:

| Image | Why |
|---|---|
| `stylist-portrait.webp` | Placeholder for the real stylist (see section 2) |
| `shape-*.webp` (5) | The figures differ a little in drawing style (the rectangle has thinner outlines). Check that each shape reads clearly at thumbnail size |
| `ba-apple-before.webp` / `-after` | The model is only mildly apple-shaped |
| `hero-trio.webp` | The centre model was asked for "deep" skin and reads closer to dusky |
| `jewel-wheatish-gold` vs `-silver` | The earring shape differs slightly between the pair |
| `chat-mustard-kurta.webp` | The mandarin collar with buttons reads a little menswear |
| `chat-outfit-check.webp` | Mirror shot with her back and her reflection both in frame |
| `skin-*.webp` (5) | Bare-shoulder close-ups: tasteful, but check they suit the brand |
| `vein-check.webp` | The veins are faint |

The before/after pairs carry the caption "Illustrative images generated for ICONIK." Testimonials reuse the real photos and videos from the ₹2,699 page.

## 9. Compliance (India's 2023 dark-pattern guidelines)

- No countdown timer. The cohort close is a real date that removes itself.
- Renewal terms sit under every pay button. The one-time plan says it does not renew.
- Bumps start unticked. WhatsApp consent is an unticked box, with STOP to opt out.
- The selfie is optional and its privacy promise is specific: used only for colouring, never shown or used in ads, deleted after 30 days (the cron enforces this).
- Founding pricing is checked on the server. Totals are recomputed on the server and a tampered total is refused.
