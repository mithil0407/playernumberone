# ICONIK Agent v1

One WhatsApp stylist for every ICONIK client — men and women — after their
consultation. It knows them from their report, remembers every conversation in
a memory tree, tracks their occasions, and sends products as a personal **Look
page** whose items are verified on the real store pages by a browser agent.

## How a message is handled

1. **Webhook** (`api/whatsapp/webhook`) → `handleAgentInbound` (`agentRuntime.ts`)
   for numbers on the rollout list. Everyone else still goes to the Man pilot.
2. The number is matched to the client's latest finished report
   (`man_reports` or `stylist_blueprint_reports`) → `agent_clients`
   (`agentClients.ts`). Numbers listed by name in `ICONIK_AGENT_ALLOWED_PHONES`
   (the team) may also use reports still `in_review`/`draft_ready`. Men who used
   the pilot keep its memories and their last 30 messages (`agentLegacyImport.ts`).
3. **Instant acknowledgement**: the message is stored at once (a photo is
   attached after it downloads), then one emoji reaction — 👀 on a request, 👍 on
   an answer, 👋 on a greeting, warmer ones for weddings, thanks, photos — and
   then read receipt + "typing…" (any send, a reaction too, hides the indicator,
   so the reaction goes first). "Typing…" is refreshed every 9s, and again after
   every mid-turn send, until the reply.
4. **Double-text handling**: a short pause (`ICONIK_AGENT_DEBOUNCE_MS`, 2.5s)
   that starts on arrival; if another message arrived, the newest invocation
   answers all unanswered messages together. Messages are ordered by WhatsApp's
   send timestamp, not by when we stored them. **One turn at a time** per
   client: a turn waits for the previous one and for photos still downloading.
5. **Turn**: OpenAI model with tools — `send_message` (interim "on it" texts),
   `react`, `recall_memory`, `remember`, `save_event`, `update_event`,
   `search_products`, `present_products`, and (men) `show_outfit_image`.
   A newer message stops a turn before it sends anything (checked before every
   tool that messages the client or spends money), and the newer turn answers
   everything. A turn that already sent something (Colour Card, heads-up, cards
   on the way) finishes its reply; the newer turn then answers what came after.
6. **Reply** in 1–3 bubbles with typing pauses between them (counted from the
   previous send, so the send time isn't added on top). Free clients get one
   bubble until their Colour Card. Images (Colour Card, product cards, outfit
   images) are uploaded to WhatsApp and sent by media id, so they can't arrive
   after the text sent next.
7. **Reflection** writes what was learned into the memory tree; busy branches
   are queued for consolidation.

## Shopping: decide first, check, then present

Modelled on how a personal shopper (and Instinct) works:

1. **Brief** — fill what/budget/size/pincode/deadline from the report and
   memory; ask only for what is missing, in one message, with numbered options
   when there is a choice (genuine brand vs the look). Sizes and pincode are
   remembered; a budget belongs to the request.
2. **Search** — `search_products` across trusted stores including authorised
   premium retailers (The Collective, Tata CLiQ Luxury…). A brand passed as a
   store searches every store. Over-budget results are kept and flagged so the
   agent can offer the trade-off with real prices.
3. **Check** — `present_products` (pick first, 1-3 alternatives, size, pincode)
   queues a job; each product is opened in a real browser, up to 3 at once
   (`ICONIK_AGENT_VERIFY_CONCURRENCY`): stock in the size, price/MRP, offer,
   delivery date typed against the pincode, returns.
4. **Present** — numbered ICONIK product cards rendered in headless Chrome
   (`agentPresentation.ts`, `agentProductCards.ts`) with captions carrying the
   checked facts and a tracked `/go` link; then a short summary (only verified
   facts, honest about anything unavailable) with the Look page link, and one
   next-step question. Unavailable products are not carded.

## Memory tree (`agentMemoryTree.ts`, `agentMemoryStore.ts`)

```
portrait (root)          3-4 sentences: who they are, what never to forget
└ branches               identity · body · colour · style · wardrobe · lifestyle
   │                     people · occasions · shopping · feedback — each with a gist
   ├ facts               constraint / preference / fact / wardrobe / person / plan
   └ episodes            dated moments ("loved the emerald kurta for the sangeet")
```

- **Strength** = importance × confidence × recency × reinforcement. Constraints
  never fade; episodes fade over weeks; facts over months. Every recall and
  restatement strengthens a memory.
- **Recall** each turn: portrait + branch gists + all constraints + the
  strongest memories related to what was just said.
- **Changes of mind** supersede (the old belief is kept and linked), never overwrite.
- **Consolidation** (background job) rewrites branch gists, merges duplicates,
  archives stale episodes and refreshes the portrait.

## Look pages (`/l/<slug>`) and tracking

- Built only from `search_products` candidates (no invented URLs).
- Every "Shop" tap goes through `/go/<itemId>`: records `click_out`, adds UTM
  tags and, if `LOOK_AFFILIATE_URL_TEMPLATE` is set, the affiliate wrapper.
- Views, likes, dislikes, saves and shares land in `look_link_events` and are
  shown back to the agent ("liked/saved…, went to store for…").

## Browser verification (`agentBrowserVerifier.ts`, `agentBrowserExecutor.ts`)

- A computer-use model drives our own headless Chrome via puppeteer, one product
  at a time, in the background worker, and reports in-stock, size availability,
  price, offer and image through a strict `report_product_check` tool.
- `ICONIK_AGENT_BROWSER_PROVIDER` picks the driver:
  - `openai` (default) — `gpt-6-sol` with OpenAI's `computer` tool on
    screenshots, plus `get_page_text` and `find_on_page` (exact click
    coordinates) for accuracy. Pending safety checks are never auto-acknowledged:
    the check stops and reports "couldn't confirm".
  - `anthropic` — `claude-opus-5-5` with the browser toolset
    (`browser_toolset_20260801`), elements targeted by reference; server-side
    refusal fallback enabled (`fallbacks: "default"`). Needs `ANTHROPIC_API_KEY`.
- Navigation is locked to the product's store domain; login, cart, checkout,
  uploads and scripts are off.
- When all products are checked the client gets a WhatsApp summary — only if
  they are inside the 24h window.
- **Bot protection** (tested 3 Oct 2026 from a residential connection): Myntra,
  Zara, H&M, Westside, Nykaa Fashion, M&S, Fabindia work. AJIO and Uniqlo return
  "Access Denied"; Tata CLiQ renders empty. These are ranked last and come back
  as "couldn't confirm" unless `AGENT_BROWSER_WS_ENDPOINT` points at a hosted
  browser with residential IPs. Vercel's datacenter IPs may be blocked more often
  than a home connection — check the first production runs.

## Proactive messages — no templates

ICONIK does not use Meta message templates. `sendProactiveAgentMessage`
(`agentJobs.ts`) is the only proactive path and sends only inside the 24h
window. Event check-ins (T-21, T-10, T-2, day after) that fall outside the
window are raised in the client's next conversation ("CHECK-IN DUE" in the
prompt) and then marked done.

## Setup

1. Run `supabase/migrations/add_iconik_agent_v1.sql` in the Supabase SQL editor.
2. Environment (Vercel):
   | Variable | Purpose |
   |---|---|
   | `OPENAI_API_KEY` | Conversation, product search and (default) browser verification — needs credits |
   | `ICONIK_AGENT_BROWSER_PROVIDER` | Optional: `openai` (default) or `anthropic` |
   | `ANTHROPIC_API_KEY` | Only for the `anthropic` browser provider |
   | `ICONIK_AGENT_ENABLED=1` | Turns the agent on |
   | `ICONIK_AGENT_ALLOWED_PHONES` | Rollout list: your number first, then a comma list, `*` for every client. From a number listed by name, `reset colour` switches to free test mode as a fresh free client (to test the colour flow; send it again to start over) and `blueprint mode` switches back |
   | `ICONIK_AGENT_TEXT_MODEL` | Optional; defaults to `ICONIK_MAN_WHATSAPP_TEXT_MODEL` |
   | `ICONIK_AGENT_BROWSER_MODEL` | Optional; defaults to `gpt-6-sol` (openai) or `claude-opus-5-5` (anthropic) |
   | `AGENT_BROWSER_WS_ENDPOINT` | Optional hosted browser (needed for AJIO/Uniqlo/Tata CLiQ) |
   | `LOOK_AFFILIATE_URL_TEMPLATE` | Optional, e.g. `https://linksredirect.com/?cid=…&source=linkkit&url={url}` |
3. External scheduler (freecronjob): GET
   `https://www.iconik.pro/api/agent/worker?key=<CRON_SECRET>` every 15 minutes.
   The app also hands off to the worker itself whenever a Look is created.

## Tests

`npm run test:agent` — memory scoring/selection/operations, reminder stages,
bubbles, reactions, the 24h window, Look URL safety and tracking, and the prompt.

## Free tier (invite-only), referrals and analytics

People without a Blueprint can use the agent for free, by invite or through the
colour-analysis campaign. The goal for now is many users who come back every
day; money comes later (brand partnerships and product recommendations). The
free agent knows only what it sees and is told.

- **Entry** (`handleAgentInbound`): existing client → Blueprint customer (report
  match; with the free tier on, every Blueprint customer is served) → invite code
  in the message (`ICK-XXXXXX`) → enrolled free; otherwise waitlisted (one reply
  per day). `ICONIK_AGENT_FREE_OPEN=1` skips invites.
- **Onboarding — the colour flow, built for time to first wow**:
  1. The opener (the campaign link's text, an invite code, a hello) gets the
     selfie ask instantly, with no model call (`isOpenerMessage`,
     `selfieAskMessage`). A real question still goes to the model.
  2. The selfie gets 👀 and "Got it 📸 reading your undertone…" straight away;
     the card renderer's Chrome starts warming up (`prewarmCardBrowser`) while
     the model reads the photo. The name isn't waited for.
  3. One model call: `send_colour_card` carries the analysis plus the wow and
     the next step, and sends card → wow → forwardable invite → next-step
     question, paced like typing, without a second model call. The default
     next step is a wardrobe check (cheap, and it starts the wardrobe memory)
     rather than a paid product hunt.
- **Everyday help** (prompt): wardrobe check, outfit check, screenshot to shop,
  group colours (family/friends for an occasion, each invited to their own
  card), beauty and accessories in their palette; most replies end with one easy
  next step. "Forget …" archives memories (`forget`). Upcoming moments (Diwali,
  wedding season, yearly dates — `upcomingMoments` in `agentGrowth.ts`; add each
  year's lunar festival dates there) feed the prompt and the next-day follow-up.
- **Growth before revenue**: the free agent mentions the Blueprint only when
  someone asks for that depth, never as a sales line.
- **Limits** (`agentGrowth.ts`, env-overridable): 3 shopping runs a month
  (carry over to 10), +2 for both people per referral, 30 messages a day, 150
  free runs a day across everyone. Chat is free; a run is charged once per turn,
  on the first product search. Blueprint clients are unlimited.
- **Invite unlock**: 3 friends joining with someone's link unlocks their **Face
  Analysis** (face shape → necklines, earrings, hair, glasses, makeup placement;
  `ICONIK_AGENT_FACE_UNLOCK_FRIENDS`). The invite intro after the Colour Card says
  so with progress ("1/3 so far"); the inviter hears about each join
  (`friendJoinedMessage`); tapping your own link gets an explanation, not a
  model call. While locked, the agent gives one quick tip and offers the invite.
- **Selfie reminder**: people who got the selfie ask but never sent a photo get
  one reminder 2h+ later, between 9am and 9pm IST, inside the 24h window
  (worker, `runSelfieReminders`). Outfit photos where the face can be read make
  the card first (the outfit verdict goes in the wow); unreadable faces get a
  clear ask for a close selfie, and a code-level safety net adds it if the model
  forgets. A failed card render is retried once; the error is kept on the text
  fallback's metadata (`image_failed`).
- **Invites**: everyone gets a personal code (5 friends); `share_invite` sends a
  ready-to-forward message with a wa.me link that opens ICONIK with the code typed
  in. Friends who open a shared Look page (`?f=1`) can vote on the options and
  see an invite to get their own stylist.
- **Costs**: every OpenAI call is logged to `agent_usage_events` with its cost,
  attributed to the client and kind of work (`withAgentUsage`).
- **Dashboard**: `/agent/admin` (admin login): users, activity, product hunts,
  click-outs, AI spend and cost per user/hunt, free-user funnel, weekly
  retention, Look engagement, store click-outs, invites (create team codes),
  waitlist (admit), users table.

### Turning it on
1. Run `supabase/migrations/add_iconik_agent_v3_free.sql`.
2. Set `WHATSAPP_BUSINESS_NUMBER` (the ICONIK WhatsApp number, digits) so invite
   links work, then `ICONIK_AGENT_FREE_ENABLED=1`. Redeploy.
3. Create the first wave of codes on `/agent/admin` and send them out.

## Occasion looks (Diwali 2026): bringing existing Man clients in

Every man with a delivered Blueprint is told a Diwali look is ready for him.
**Nothing is designed or drawn until he asks to see it**, so image credits are
only spent on men who engage.

**Flow**
1. `/agent/admin/looks` → **List Blueprint clients** (free): one row per delivered
   Blueprint, latest report per phone; men with no intake photos, no contact or
   who stopped messages are left out. Anyone can be left out by hand.
2. **Invite**, with **Check send** (dry run) first; up to 40 per send, 9am–9pm IST:
   - **1 · Email** (free): "Rohan, your Diwali look is ready 🪔" with one button that
     opens WhatsApp with "Show me my Diwali look 🪔" typed, so he starts the chat.
   - **2 · WhatsApp to those who didn't reply** (a day or two later): the text-only
     template below with a "Show me my look" button, only to men who haven't replied;
     free reply buttons instead when his chat is already open.
3. **He asks to see it** (taps the button or sends the email's text):
   `revealOccasionLook` says "Give me a minute, dressing you up for Diwali 🪔",
   designs the look from his report (`designLook`), draws him in it
   (`generateManEditOutfitImage`) and sends it with **Love it 😍 / Show me another**.
   This is the only point where credits are spent. If his first message was
   something else, the agent answers it right after the picture.
4. For 21 days (until the day after Diwali) the prompt carries the look
   (`occasionLookSection`): "Love it" → ask for pincode + shirt size in one line, then
   search and present checked products; "Show me another" → a new picture straight
   away; family mentioned → one natural offer to plan her outfit too (pairing
   invite, free Colour Card). Replies are recorded on the row (`response`).

Code: `agentOccasionLooks.ts` (pure: campaign copy, payloads, prompt section; tested
in `agentOccasionLooks.test.ts`), `agentOccasionLookStore.ts` (list, invite, reveal,
response tracking), `api/agent/admin/looks`, `app/agent/admin/looks`. Add a later
occasion to `OCCASION_CAMPAIGNS`.

**Setup**
1. Run `supabase/migrations/add_agent_occasion_looks.sql`.
2. Both channels lead to WhatsApp, so the agent must serve every Blueprint client:
   `ICONIK_AGENT_ENABLED=1` and `ICONIK_AGENT_ALLOWED_PHONES` including `*` (or the free
   tier on). Sending is refused otherwise.
3. `WHATSAPP_BUSINESS_NUMBER` (the email button's wa.me link) and `GMAIL_USER` /
   `GMAIL_APP_PASSWORD`.
4. For step 2 only, submit the template in WhatsApp Manager → Message templates:
   - **Name:** `iconik_diwali_look_invite_v1` · **Category:** Marketing · **Language:** English (`en`)
   - **Header:** none
   - **Body:**
     ```text
     Hi {{1}}, Diwali's on the 8th 🪔 I've put together a look for you, built on your Blueprint: your colours, your fit.

     Want to see it?
     ```
     Sample: `{{1}}` = `Rohan`
   - **Button:** Quick reply `Show me my look`
   If Meta changes the name or language, set `WHATSAPP_OCCASION_LOOK_TEMPLATE` /
   `WHATSAPP_OCCASION_LOOK_LANGUAGE`.
