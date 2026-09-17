# ICONIK Personal Stylist: offer and delivery design

Status: local visual prototype. No checkout API, billing, mandate, customer creation, message delivery or subscription lifecycle is enabled by these pages. Existing homepage and paid checkout are unchanged.

## Preview routes

- `/personal-stylist-preview`: root-page visual language adapted to the membership.
- `/personal-stylist-preview/checkout?plan=monthly&priority=fit`: interactive, non-charging checkout.
- `plan=blueprint` selects the one-time alternative. Supported priorities: `fit`, `colour`, `wardrobe`.
- Routes are marked noindex. This is a design experiment, not a public launch.

## Offer contract to validate before launch

- INR 2,499 per calendar month, cancel before renewal, no minimum term.
- Four styling briefs per paid cycle, each with two complete looks and one round of adjustments. Eight looks total.
- The first brief addresses the customer's chosen priority and is delivered within two working days of a complete intake. It consumes one of the four briefs; there are three remaining.
- A concise saved Style Profile records preferences, fit direction, colour direction, budget, comfort and wardrobe notes. The full standalone 20-outfit Blueprint is not included.
- One 30-minute planning call per cycle. A structured asynchronous review replaces this slot if the customer cannot attend; it is not a second service entitlement.
- Four quick checks per cycle, one outfit or product decision each; replies within two working days, Monday–Friday.
- Two proactive stylist check-ins per cycle.
- Clothing purchases are separate. Work with existing clothes first.
- Unused briefs and checks do not roll over. One cycle pause means no billing or service for that cycle. Delivered personalised looks and Style Profile remain with the customer after cancellation.
- Outfit Library, Packing Planner and Buy Better Checklist are shared member resources. Their covers are shown in the prototype; the actual resource library still needs creation and review.
- All proposed timing, revision and pause promises need real delivery/billing implementation before accepting orders.

## Continuity without withholding useful advice

Each cycle has one agreed focus, selected by the customer and stylist. A default example is fit, then colour application, then wardrobe combinations; this is not a required three-month course. If colour or an urgent event matters first, start there. Necessary advice is not deliberately delayed to force renewal.

The recurring loop is: choose a real need → deliver two looks → customer wears/tries → record feedback → adapt the next brief. Upcoming events and quick checks remain available alongside the cycle's main focus.

## Delivery system

| Trigger | Owner | Action | Record |
|---|---|---|---|
| Initial payment confirmed | Operations | Assign available stylist, create cycle, send intake and service scope | payment ID, cycle start/end, assigned stylist |
| Intake complete | Stylist | Validate photos, wardrobe items, comfort, budget and first priority | intake completion time, first-brief due date |
| First brief | Stylist | Deliver two looks and one short, practical adjustment | brief 1/4, two looks, delivery time |
| Customer tries looks | Stylist | Record wore / would wear / rejected, and why | fit, comfort, purchase, use feedback |
| Planning call or async slot | Stylist | Agree on cycle focus and upcoming occasions | priority, next three briefs, actual time |
| Two check-in dates | Stylist | Check usage and prepare for an upcoming need | response, issue, next action |
| Quick check | Stylist | Answer one outfit/product decision | allowance used, response time |
| Before renewal | Operations + stylist | Send billing reminder and useful recap; propose next focus | next charge date, delivered value, preference changes |
| Renewal paid | Operations | Open next paid cycle and reset allowances | payment ID, new cycle, entitlement reset |
| Payment failed | Operations | Notify customer and offer payment recovery; do not count as retained | failed charge, grace status, outcome |
| Pause/cancel | Operations | Stop future charges as applicable; confirm dates and preserve delivered work | effective date, reason, remaining paid access |

A real system needs at least: memberships, payment events, paid service cycles, assignments, profile revisions, briefs, delivered looks, feedback, quick checks, call slots, check-ins, cancellation/pause events and a shared resource library. Assignments and deadlines must be based on stylist capacity rather than an unchecked automatic promise.

## Time and economics

Measure all time: onboarding, photo review, calls, searches, recommendations, revisions, support and administration. The prior INR 1,000 monthly delivery example is an assumption, not a measured cost. Confirm whether four two-look briefs and support can fit this budget. Track per-customer cost and heavy-use customers, not only the mean.

A two-working-day first-brief promise requires an operations queue and capacity gate. A non-charging preview is not evidence this SLA is staffed.

## Funnel choices implemented

Visual system mirrors the root page's Precision Glass design (bone/carbon/slate palette, oxblood pill CTAs, Manrope with Bodoni italic accents, glass cards, dark video/price sections). Styles live in `membership.module.css`; offer numbers live in `offer.ts`.

Page order is built to sell the monthly plan first:

1. Hero: "Stop Guessing What to Wear. Keep a Stylist On Call." with the monthly price in the CTA, client transformation carousel and an illustrative WhatsApp exchange.
2. Proof strip (`CLIENT_PROOF` clients/countries, looks per month, days to first looks).
3. Four-step monthly loop (intake → first looks → WhatsApp second opinions → monthly planning).
4. Existing ICONIK video testimonials, labelled as the existing styling service.
5. Inclusions beside an example styling request (two looks + stylist note).
6. Monthly vs one-time comparison table.
7. Existing client stories.
8. Single price card (monthly only, ₹/day framing, first-focus chips). Blueprint is a secondary text link, not an equal card.
9. Assurances (cancel before renewal, adjustments, keep delivered work) and FAQ.
10. Final CTA and mobile sticky bar after the hero CTA scrolls away.

Checkout defaults to monthly. Blueprint is reachable by a switch link or `?plan=blueprint`; when chosen, a nudge shows the monthly plan costs less today. The total shows the next billing date. Explicit renewal consent is unticked by default.

Guardrails kept: no fabricated reviews, countdowns, stock claims or member counts; testimonials are attributed to the existing service; no payment APIs, tracking events or stored contact details. The WhatsApp exchange and sample request are labelled illustrative/example.

## Launch prerequisites

1. Confirm pricing/tax display, final cancellation/refund policy and support scope.
2. Create the three member resources and review outfit examples.
3. Staff and measure the first-brief workflow; configure working days and deadlines.
4. Implement genuine subscription billing, mandate authorization, server-confirmed initial/renewal payments, cancellation/pause and failed-payment recovery.
5. Implement entitlements and a customer-visible upcoming billing date. Do not label a mandate authorization as a paid renewal.
6. Implement customer communication preferences separately from service/billing consent.
7. Define analytics for offer variant, selected priority, plan, confirmed initial payment, renewal, cancellation, actual looks worn, direct costs and 90-day contribution per visitor. Do not emit purchase events from the prototype.
8. Test a controlled traffic split against the original funnel and retain the one-time conversion and contribution baseline.

## Verification

Desktop and mobile visual review, image loading, priority handoff, journey switching, plan switching, form validation and local completion are checked in the browser. Source TypeScript is checked separately because this workspace's multiple generated Next.js build directories produce conflicting route definitions in the broad default typecheck.
