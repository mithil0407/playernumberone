# ICONIK Club Codebase Report

Generated from a source review of the women-focused ICONIK Club implementation in `playernumberone-app`.

## Executive Summary

ICONIK Club is a subscription-based styling product that delivers six personalized, shoppable outfits to a client. The system has three major surfaces:

1. Public sales and payment flow at `/iconik-club/join`.
2. Authenticated client portal at `/iconik-club/client`.
3. Internal admin workspace at `/iconik-club/admin`.

The core product delivered to the customer is a monthly style edit: six outfit sets across fixed occasions, each with an AI-generated outfit card and individual catalog items with direct shopping links. The implementation supports two client acquisition modes:

1. Self-serve subscribers who pay through Razorpay, receive Supabase Auth credentials, complete onboarding, then access their vault.
2. Admin-created clients who can be onboarded manually and receive a preview link without needing an account.

AI is used in four places:

1. Catalog ingestion: extract structured product metadata from item images and admin notes.
2. Client photo processing: enhance headshot/full-body photos and build a visual profile.
3. Outfit planning: build a stable preference profile, six outfit blueprints, and catalog matches.
4. Outfit imagery: generate a photorealistic editorial card of the client wearing selected pieces, with a collage fallback.

## Technology Stack

- Framework: Next.js 15 App Router, React 19, TypeScript.
- Styling/UI: Tailwind utility classes, Framer Motion, Lucide icons.
- Database/auth/storage: Supabase Auth, Postgres, Storage.
- Payments: Razorpay subscriptions.
- Email: Nodemailer through Gmail app credentials.
- AI: `@google/genai` using Gemini text, vision, and image generation models.
- Image processing fallback: Sharp.

Key files:

- `src/app/iconik-club/**`: women ICONIK Club pages.
- `src/app/api/iconik-club/**`: women ICONIK Club API routes.
- `src/lib/outfitGenerator.ts`: women outfit recommendation engine.
- `src/lib/outfitCompositor.ts`: visual profile, photo enhancement, outfit card generation.
- `src/lib/gemini.ts`: catalog item parsing and enrichment.
- `src/lib/email.ts`: welcome and outfits-ready emails.
- `src/middleware.ts`: route protection.
- `supabase/migrations/add_iconik_club_tables.sql`: core tables.

## Product Promise and Deliverables

The customer-facing promise is:

- 6 complete outfit sets every month.
- Personalization around body geometry, colour palette, lifestyle, style preferences, and budget.
- Shoppable pieces with direct purchase links.
- A private "Style Vault" where outfits can be viewed later.
- Occasion-specific looks: `casual`, `work`, `evening`, `weekend`, `formal`, and `party`.

Each generated outfit can contain:

- One single-piece garment, or top plus bottom.
- Shoes, which are mandatory.
- Optional layer, bag, and accessory.
- AI style note explaining the look.
- AI blueprint metadata for admin/debug visibility.
- Match diagnostics and validation errors for auditability.
- An outfit card image, ideally showing the client wearing all selected pieces.
- The underlying shoppable catalog item cards.

## User Flows

### Public Join Flow

Route: `src/app/iconik-club/join/page.tsx`

The join page sells monthly and annual plans:

- Monthly: INR 699.
- Annual: INR 7,188.

The page collects name, email, and phone, then calls `POST /api/subscription`. Razorpay Checkout opens using the returned `subscription_id`. On success, the user lands at `/iconik-club/join/success`.

Important implementation details:

- The public page pulls sample active catalog items from `GET /api/iconik-club/items/sample`.
- Attribution payload is captured and sent to the subscription API.
- Payment confirmation and account creation primarily rely on Razorpay webhooks.

### Subscription Creation

Route: `src/app/api/subscription/route.ts`

This route creates a Razorpay subscription using configured plan IDs:

- `ICONIK_CLUB_PLAN_MONTHLY`
- `ICONIK_CLUB_PLAN_QUARTERLY`
- `ICONIK_CLUB_PLAN_YEARLY`

It also tries to persist a `customers` row and a `subscriptions` row. The saved subscription starts as `pending`. Razorpay remains the source of truth if the DB save fails.

### Subscription Activation

Primary route: `src/app/api/payment/webhook/route.ts`

On `subscription.activated`, the webhook:

1. Updates the matching `subscriptions` row to `active`.
2. Resolves customer details from the DB row or Razorpay notes.
3. Skips account creation if a `client_profiles` row already exists for that email.
4. Creates a Supabase Auth user with a temporary password.
5. Creates a `client_profiles` row linked to that Auth user.
6. Sends the welcome email with portal credentials.

There is also `src/app/api/subscription/activate/route.ts`, which performs similar activation manually. This looks like an auxiliary or fallback endpoint.

### Client Login and Portal

Routes:

- `src/app/iconik-club/client/login/page.tsx`
- `src/app/iconik-club/client/page.tsx`
- `src/app/iconik-club/client/onboarding/page.tsx`
- `src/app/iconik-club/client/profile/page.tsx`
- `src/app/iconik-club/client/outfits/page.tsx`
- `src/app/iconik-club/client/outfits/[id]/page.tsx`

Client auth is Supabase email/password auth. Middleware protects `/iconik-club/client/**` except login and auth callback.

After login:

- If `onboarding_complete` is false, user goes to onboarding.
- If true, user goes to the outfit vault.

Client onboarding collects:

- Headshot.
- Full-body photo.
- Height, weight, bust, waist, hips.
- Style notes.
- Liked outfit examples.

The onboarding API uploads the raw photos immediately, returns quickly, then runs photo enhancement and visual profile generation in a background `after()` task.

### Admin Workspace

Routes:

- `src/app/iconik-club/admin/dashboard/page.tsx`
- `src/app/iconik-club/admin/revenue/page.tsx`
- `src/app/iconik-club/admin/items/**`
- `src/app/iconik-club/admin/clients/**`
- `src/app/iconik-club/admin/outfits/page.tsx`

Admin auth is a simple cookie-based login:

- `ICONIK_ADMIN_EMAIL`
- `ICONIK_ADMIN_PASSWORD`
- `ICONIK_INTERNAL_SECRET`
- Cookie name: `iconik_admin_auth`

Middleware protects `/iconik-club/admin/**` except `/iconik-club/admin/login`.

Admin capabilities include:

- Upload single catalog item.
- Bulk upload catalog items.
- List, search, filter, edit, archive catalog items.
- Create clients manually.
- Edit client photos, measurements, restrictions, budget, style notes, visual profile, and preference profile.
- Generate or regenerate outfits.
- Send preview email.
- Open prefilled WhatsApp message.
- Inspect outfit generation state.

## Data Model

### `fashion_items`

Defined in `supabase/migrations/add_iconik_club_tables.sql`.

Purpose: catalog of shoppable items used by the outfit generator.

Important fields:

- `raw_description`, `raw_image_url`: original admin input.
- `brand`, `item_name`, `category`, `color`, `material`, `price`, `currency`, `size_availability`, `purchase_link`.
- `image_url`: canonical Supabase Storage URL.
- `style_description`: AI-generated stylist paragraph.
- `style_tags`: structured JSON tags for rule-based matching.
- `ai_confidence`, `ai_raw_response`.
- `status`: `draft`, `active`, `archived`.

Only active catalog items are eligible for outfit generation.

### `client_profiles`

Purpose: client identity, photos, body data, preferences, subscription link, and preview token.

Important fields:

- `user_id`: Supabase Auth user for self-serve clients. Null for some admin-created preview clients.
- `name`, `email`, `phone`.
- `headshot_url`, `body_photo_url`.
- `height_cm`, `weight_kg`, `bust_cm`, `waist_cm`, `hips_cm`.
- `style_notes`.
- `style_restrictions`: currently supports `no_sleeveless` and `cover_tummy`.
- `liked_outfit_examples`: primary taste signal.
- `budget_level`: `low`, `mid`, `high`.
- `visual_profile`: AI-generated appearance profile.
- `preference_profile`: stable AI-generated taste profile.
- `preference_profile_version`, `preference_profile_updated_at`.
- `subscription_id`.
- `onboarding_complete`.
- `preview_token`, `token_expires_at`.

### `outfit_sets`

Purpose: one generated outfit.

Important fields:

- `client_id`.
- `outfit_card_url`.
- `ai_style_note`.
- `occasion`: `casual`, `work`, `evening`, `weekend`, `formal`, `party`.
- `season`: present in schema, though generation currently stores occasion more than season.
- `status`: `pending`, `generating`, `ready`, `failed`.
- `generation_batch`.
- `ai_blueprint`: Gemini blueprint before catalog matching.
- `generation_version`.
- `preference_profile_snapshot`.
- `match_diagnostics`.
- `validation_errors`.

### `outfit_items`

Join table between `outfit_sets` and `fashion_items`, with display `position`.

### `outfit_feedback`

Added by the consistency migration but not visibly wired into client UI yet. It supports one `like` or `dislike` per client/outfit pair.

## Storage Model

Expected Supabase Storage buckets:

- `fashion-items`: public item images.
- `client-photos`: private client headshots and body photos.
- `outfit-cards`: generated outfit card images.

Path conventions:

- Self-onboarded client photos: `<user_id>/headshot.jpg` and `<user_id>/body.jpg`.
- Admin-created client photos: `admin-clients/<profile_id>/headshot.jpg` and `admin-clients/<profile_id>/body.jpg`.
- Outfit cards: `outfit-cards/<outfit_set_id>.jpg` inside the `outfit-cards` bucket.

Note: some code calls `getPublicUrl` for outfit cards, so the bucket or object policy must permit public reads for those URLs to render.

## AI Catalog Pipeline

### Single Item Ingestion

Route: `POST /api/iconik-club/items/ingest`

Implementation:

1. Admin uploads an image and optional raw description.
2. Image is uploaded to the `fashion-items` bucket.
3. `parseItemWithGemini` analyzes image plus text.
4. The extracted data is saved as a `fashion_items` draft.

The Gemini extraction returns:

- Brand.
- Product name.
- Category.
- Colour and material arrays.
- Price/currency.
- Sizes.
- Purchase link.
- Stylist-oriented `style_description`.
- Structured `style_tags`.
- Confidence.

### Enrichment Backfill

Route: `POST /api/iconik-club/items/enrich`

This processes existing items missing `style_description` or `style_tags`, sequentially, with a `limit` query param to avoid rate limits.

## AI Client Profile Pipeline

Client or admin onboarding uploads raw headshot/body photos. The system then:

1. Enhances both photos using `gemini-3.1-flash-image-preview`.
2. Overwrites the raw storage objects with enhanced studio versions.
3. Generates `visual_profile` with Gemini vision.
4. Stores the visual profile on `client_profiles`.

The visual profile is a factual stylist paragraph covering:

- Estimated age range.
- Skin tone and undertone.
- Body shape.
- Build/frame.
- Hair.

The prompt explicitly asks the model not to alter identity, skin tone, body shape, or proportions during enhancement.

## Outfit Generation Pipeline

Core file: `src/lib/outfitGenerator.ts`

Generation is a three-step engine driven by `src/lib/womenOutfitRecommendationSkill.md`.

### Step 1: Preference Profile

The system builds or reuses a `PreferenceProfile`.

Inputs, in order of authority:

1. `liked_outfit_examples`
2. `style_notes`
3. `style_restrictions`
4. `visual_profile`
5. Measurements
6. Budget
7. Season

If a stored `preference_profile` exists and its version matches `women-skill-v1`, it is reused. Otherwise Gemini generates a new profile and the route saves it back to the client.

This is a strong design choice because it stabilizes client taste across generations instead of rediscovering it each time.

### Step 2: Outfit Blueprints

Gemini generates exactly six ideal outfit blueprints, one for each occasion:

- Casual.
- Work.
- Evening.
- Weekend.
- Formal.
- Party.

Blueprints define desired garment slots, colour hierarchy, structural piece, disruptor, and signature codes used.

### Step 3: Catalog Matching

The server builds candidate pools per outfit slot before asking Gemini to choose items. This is important because Gemini can only choose from supplied item IDs.

Server-side filters and scoring include:

- Category-slot compatibility.
- Hard restrictions.
- Season fabric suitability.
- Occasion tags.
- Undertone compatibility.
- Preferred and avoided colours.
- Signature and anti-code alignment.
- Silhouette/body-shape scoring.
- Budget fit.

Gemini then returns slot selections. The server validates:

- Exactly six matches.
- Known occasion only.
- Selected IDs must come from candidate pools.
- Shoes are mandatory.
- Must have a base outfit.
- Single-piece cannot be combined with top/bottom.
- No item can appear in more than two outfits.
- Restrictions must not be violated.

If validation fails, the system asks Gemini for one repair pass. If repair still fails, generation fails.

## Outfit Card Generation

Core file: `src/lib/outfitCompositor.ts`

For each outfit, the system calls `createOutfitCard` with:

- Client headshot.
- Client body photo.
- Selected item images.
- Style note.

The prompt asks Gemini to create a full-body photorealistic editorial image of the same person wearing all selected pieces. The headshot is treated as the highest priority face reference, and the body photo as proportion/body reference.

Generation is intentionally sequential per outfit. The code comments say parallel image generation hurts identity fidelity and trips rate limits.

If Gemini image generation fails, the fallback is a 600x800 Sharp-created collage of selected item images.

## Delivery Channels

### Authenticated Vault

Routes:

- `GET /api/iconik-club/outfits/list`
- `GET /api/iconik-club/outfits/[id]`
- `/iconik-club/client/outfits`
- `/iconik-club/client/outfits/[id]`

The vault shows ready outfits only. Outfit detail pages show:

- Outfit card.
- Occasion.
- AI style note.
- Individual pieces.
- Brand, item name, price.
- Direct shop link if available.

### Preview Links

Routes:

- `POST /api/iconik-club/admin/clients/[id]/send-preview`
- `GET /api/iconik-club/preview/[token]`
- `/iconik-club/preview/[token]`

Preview support depends on:

- `client_profiles.preview_token`.
- `client_profiles.token_expires_at`.

Admin preview send extends expiry by 30 days, builds a URL, and sends an email. The admin clients UI can also open WhatsApp with a prefilled preview message.

Preview pages fetch ready outfits by token without client login. The API returns only client name/email plus outfit data.

## Admin Generation Flow

Route: `POST /api/iconik-club/admin/clients/[id]/generate`

Admin generation:

1. Checks admin cookie.
2. Loads profile.
3. If `force=true`, deletes existing outfit sets and join rows.
4. Downloads client photos using admin-created path.
5. Fetches active fashion items.
6. Requires at least 8 active items.
7. Runs `generateOutfitRecommendations`.
8. Saves generated preference profile.
9. Downloads selected catalog images.
10. Creates six outfit sets sequentially.
11. Generates and uploads outfit cards.
12. Inserts outfit item junction rows.
13. Sets preview token expiry to 30 days.
14. Emails the client with either portal URL or preview URL.

The user self-service generation route at `POST /api/iconik-club/outfits/generate` is similar but uses the authenticated user's storage path and does not send email.

## Access Control

### Middleware

`src/middleware.ts` protects:

- `/iconik-club/admin/**` using the admin cookie.
- `/iconik-club/client/**` using Supabase Auth, except login/callback.

### Supabase RLS

The migrations enable RLS:

- Authenticated users can read active catalog items.
- Clients can access their own profile and outfits.
- Admins are expected to have `user_metadata.role = admin`.

However, most application API routes use the Supabase service role client and enforce access in route code instead of relying on RLS.

## Environment Variables

Required or used by ICONIK Club paths:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `GOOGLE_AI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `ICONIK_CLUB_PLAN_MONTHLY`
- `ICONIK_CLUB_PLAN_QUARTERLY`
- `ICONIK_CLUB_PLAN_YEARLY`
- `ICONIK_ADMIN_EMAIL`
- `ICONIK_ADMIN_PASSWORD`
- `ICONIK_INTERNAL_SECRET`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Parallel Men's System

There is also a parallel `iconik-club-men` API and schema:

- `supabase/migrations/add_men_club_tables.sql`
- `src/lib/supabaseClubMen.ts`
- `src/app/api/iconik-club-men/**`

It mirrors the women system with separate tables:

- `men_fashion_items`
- `men_client_profiles`
- `men_outfit_sets`
- `men_outfit_items`

The active UI paths for men are less visible in the reviewed file list, but the API structure supports catalog, client, preview, subscription, and generation flows.

## Notable Strengths

1. The generation design is structured and auditable. It separates taste profiling, blueprinting, and catalog matching instead of using a single freeform prompt.
2. Catalog matching is constrained by server-built candidate pools, reducing hallucinated product IDs.
3. There is validation plus a repair pass before saving recommendations.
4. Stored preference profiles should improve consistency across drops.
5. Admin tooling covers the full operating workflow: catalog, clients, generation, previews, and revenue.
6. Photo enhancement and visual profiling happen asynchronously during onboarding, keeping the client response faster.
7. The system supports both subscriber portal access and preview-only delivery.

## Risks and Gaps

### 1. Admin-created generation only downloads admin path photos

`/api/iconik-club/admin/clients/[id]/generate` downloads from:

- `admin-clients/<profileId>/headshot.jpg`
- `admin-clients/<profileId>/body.jpg`

If an admin regenerates outfits for a self-onboarded client with `user_id`, photos are stored under `<user_id>/...`, not `admin-clients/<profileId>/...`. The visual-profile route handles both paths, but the admin generation route does not. This can produce outfit cards without client photo references for self-onboarded users.

### 2. Preview tokens are bearer links

Anyone with the preview URL can view the client's outfits until expiry. That may be intentional, but these links expose personal generated imagery and shoppable recommendations. The system should treat preview URLs as sensitive.

### 3. Signed client photo URLs are stored for one year

Client photos are stored in a private bucket, but signed URLs with one-year expiry are saved into `client_profiles`. Storage downloads are used for generation, which is better, but the stored signed URLs are still rendered in admin UI and may expire or leak.

### 4. Outfit card bucket assumptions need confirmation

Generated outfit cards use `getPublicUrl`. If the `outfit-cards` bucket is private, cards will not render. The migration comments originally described `outfit-cards` as private, but the app serves public URLs.

### 5. Self-service outfit generation appears callable by clients

`POST /api/iconik-club/outfits/generate` lets an authenticated client trigger generation if no outfits exist. The UI does not appear to call it directly in the reviewed pages, but the route exists. This may be useful, but because it invokes expensive AI image generation, it should be intentionally gated or rate-limited.

### 6. Active subscription status is not enforced for portal access

Middleware checks Supabase Auth only. It does not check whether `subscriptions.status` is still active. A cancelled or expired subscriber may retain portal access unless handled elsewhere.

### 7. Preference profile can be invalidated without regenerating existing outfits

Profile edits reset stored preference profile fields, but existing outfit sets remain until regeneration. This is probably expected, but the admin UI should make that operational distinction clear.

### 8. Several flows use service role queries with route-level authorization

This is workable, but it raises the importance of every API route correctly checking admin or user ownership. The reviewed core routes do this, but service-role routes should be treated as high-risk when adding new endpoints.

### 9. Temporary passwords are emailed in plain text

The activation flow creates a temporary password and emails it. This is operationally simple, but password reset or magic-link onboarding would reduce credential exposure.

### 10. RLS admin policy and app admin auth are separate concepts

Database RLS expects `auth.jwt().user_metadata.role = admin`, but the app's admin area uses a custom cookie and service role client. Those two admin models are not unified.

## Recommended Next Steps

1. Fix admin generation photo path resolution so it supports both self-onboarded and admin-created clients.
2. Decide whether client-triggered generation should remain public to authenticated clients. If yes, add rate limiting and subscription checks.
3. Enforce active subscription status in client portal middleware or client profile APIs.
4. Confirm `outfit-cards` bucket visibility. Either make it public intentionally or switch to signed URLs.
5. Replace emailed temporary passwords with invite links or password reset flows.
6. Add operational status to admin client detail: photos present, visual profile present, preference profile present, active item count, existing outfit count.
7. Wire `outfit_feedback` into the client UI if the intent is to learn from likes/dislikes over time.
8. Add a generation job/queue for long-running outfit card creation. Current route-based sequential generation is simple but can be slow and fragile on serverless time limits.
9. Add tests around generator validation: candidate pool constraints, restriction enforcement, item reuse, and single-piece versus top/bottom logic.
10. Document the required Supabase buckets, policies, and env vars in deployment docs.

## High-Level System Diagram

```text
Public join page
  -> POST /api/subscription
  -> Razorpay subscription
  -> Razorpay webhook subscription.activated
  -> Supabase Auth user + client_profiles row
  -> Welcome email with portal credentials
  -> Client onboarding
  -> Photo upload + background enhancement + visual profile
  -> Admin or client generation
  -> Preference profile
  -> Six outfit blueprints
  -> Catalog candidate pools
  -> Gemini catalog match
  -> Validation/repair
  -> Outfit sets + outfit items
  -> AI outfit cards
  -> Client vault or preview link
```

## Code Map

### Pages

- `src/app/iconik-club/join/page.tsx`: sales and Razorpay checkout.
- `src/app/iconik-club/join/success/page.tsx`: post-payment instructions.
- `src/app/iconik-club/client/login/page.tsx`: Supabase password login.
- `src/app/iconik-club/client/onboarding/page.tsx`: client photo and measurements flow.
- `src/app/iconik-club/client/outfits/page.tsx`: outfit gallery.
- `src/app/iconik-club/client/outfits/[id]/page.tsx`: outfit detail.
- `src/app/iconik-club/client/profile/page.tsx`: profile editing.
- `src/app/iconik-club/preview/[token]/page.tsx`: public token preview.
- `src/app/iconik-club/admin/**`: internal operations UI.

### APIs

- `src/app/api/subscription/route.ts`: create Razorpay subscription.
- `src/app/api/payment/webhook/route.ts`: subscription lifecycle and account creation.
- `src/app/api/subscription/activate/route.ts`: manual/fallback activation.
- `src/app/api/iconik-club/clients/onboard/route.ts`: authenticated client onboarding.
- `src/app/api/iconik-club/clients/profile/route.ts`: authenticated profile get/update.
- `src/app/api/iconik-club/items/**`: catalog ingest/list/edit/enrich/sample.
- `src/app/api/iconik-club/outfits/**`: authenticated outfit generation/list/detail.
- `src/app/api/iconik-club/preview/[token]/route.ts`: preview data.
- `src/app/api/iconik-club/admin/**`: admin clients, outfits, revenue, login/logout.

### Libraries

- `src/lib/outfitGenerator.ts`: recommendation logic.
- `src/lib/womenOutfitRecommendationSkill.md`: prompt contract and generation rules.
- `src/lib/outfitCompositor.ts`: visual profile, photo enhancement, outfit cards.
- `src/lib/gemini.ts`: item parsing and enrichment.
- `src/lib/supabaseServer.ts`: SSR and admin Supabase clients.
- `src/lib/adminAuth.ts`: admin cookie auth.
- `src/lib/email.ts`: emails.
- `src/lib/revenueAnalytics.ts` and `src/lib/revenueEvents.ts`: revenue tracking used by admin/revenue and webhooks.

