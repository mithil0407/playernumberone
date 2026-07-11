# Iconik SEO Growth Operating System

## Baseline and target

Baseline source: Google Search Console exports dated 10 July 2026.

| Metric | Baseline | Day 30 | Day 60 | Day 90 |
| --- | ---: | ---: | ---: | ---: |
| Rolling 28-day impressions | 5,822 | 12,000 | 23,000 | 38,000 |
| Rolling 28-day clicks | 171 | 420 | 920 | 1,710 |
| CTR | 2.9% | 3.5% | 4.0% | 4.5% |
| Non-branded click share | Low | 30% | 45% | 60% |
| Eligible editorial URLs indexed | Establish in Week 1 | 65% | 75% | 85% |

Conversion targets:

- Article to quiz start: 12% or higher.
- Quiz start to result: 65% or higher.
- Result to identified lead: 55% or higher.
- Lead to checkout: 8% or higher.
- Lead to paid consultation: 3–5%.

## Fixed weekly cadence

Monday:

1. Export GSC pages and queries for the last 28 days and compare with the previous 28 days.
2. Export GA4 landing-page and funnel-event data for the same period.
3. Classify every priority URL as expand, improve snippet, improve conversion, consolidate, or hold.

Tuesday to Thursday:

1. Produce one high-intent evergreen page or major refresh.
2. Produce one supporting refresh or internal-link improvement.
3. Produce one celebrity or visual-analysis article, with every fourth release assigned to men.
4. Prepare the article visual, metadata, schema, quiz route, Reel companion, and outreach angle as one package.

Friday approval batch:

1. Founder reviews claims, advice, brand voice, generated people, privacy blur, and Reel scripts.
2. Approved pages pass build, metadata, structured-data, link, responsive-image, and funnel-event checks.
3. Record the release date and schedule 7-, 14-, and 28-day reviews.

No more than three major releases ship in one week. A page that fails the editorial or visual rubric is held rather than published unfinished.

## Priority queue

### Implemented launch foundation

1. Dusky skin meaning, undertones, and best colours.
2. How to look taller in clothing.
3. Dark Indian skin colour guide.
4. Wheatish skin meaning, undertones, and best colours.
5. Modest professional office wear.
6. Personal stylist in Mumbai.
7. How much a personal stylist costs in India.

### Next recovery batch

1. Colour analysis hub.
2. Body-shape and proportion hub.
3. Men’s styling hub.

### Women’s expansion queue

1. Olive Indian skin: why common undertone tests conflict.
2. Jewellery colours by undertone and contrast.
3. Office colours for Indian skin tones.
4. Wedding colours by undertone and contrast.
5. Dressing a short and curvy frame without hiding it.
6. Trouser rise and waist placement by torso-to-leg ratio.
7. Sleeve placement for fuller arms and short frames.
8. Professional presence: one focal point versus competing details.
9. Celebrity style evolution: editing palette and focal points.
10. Celebrity style evolution: oversized versus intentional volume.

### Men’s first six pages

1. How shorter Indian men can dress taller.
2. Clothes for Indian men carrying weight around the stomach.
3. Oversized versus intentional fit for men.
4. Indian men’s colour and contrast guide.
5. Smart-casual wardrobe for Indian professionals.
6. Wedding and occasion dressing by male body proportion.

## Query ownership

The current colour pages remain separate because the supplied export shows different intents:

- Dusky page owns `dusky skin tone meaning`, `dusky colour`, and colours for medium-to-deep brown skin.
- Dark-skin page owns `which colour suits dark skin female Indian`, deep-skin clothing colour, and deep-skin occasion queries.
- Wheatish page owns `wheatish skin tone description`, wheatish meaning, and medium golden/olive palette queries.

Run a page-filtered GSC query export before consolidation. Consolidate only if more than 60% of meaningful impressions overlap and the pages cannot serve separate intents without repetition.

## Optimisation rules

- Impressions rising, CTR below 2%: change title and description; do not rewrite the whole page first.
- Position 4–15 with stable impressions: improve direct answer, examples, visual proof, internal links, and authority.
- No impressions after six weeks: check indexation, internal discovery, demand, duplication, and canonical URL.
- Traffic but quiz-start rate below 8%: change the CTA promise and position.
- Quiz starts but completion below 55%: simplify the first interaction and remove unnecessary questions.
- Results but lead rate below 40%: strengthen the value of the emailed rule list.
- Leads but checkout below 5%: align the consultation promise with the diagnostic result.
- Two URLs serving the same intent: retain the stronger URL and permanently redirect the weaker one.
- Winning topic: publish one deeper supporting page, not several synonyms.

## GA4 reporting view

Create one GA4 exploration using these rows and columns:

- Rows: landing page, `article_id`, `content_cluster`, `audience`, `traffic_channel`, `ai_source`.
- Columns: event name.
- Values: users, sessions, event count, key events, purchase revenue.
- Funnel: `article_view` → `article_quiz_cta_click` → `quiz_start` → `quiz_result_view` → `quiz_lead_submit` → `checkout_started` → `purchase`.
- Segment: organic search, AI referral, Instagram, and all traffic.

Mark `quiz_lead_submit`, `checkout_started`, and `purchase` as GA4 key events. Never create analytics dimensions from names, emails, phone numbers, uploaded images, or raw quiz answers.

## Release checklist

- Search intent and title promise match.
- Direct answer appears before the first long section.
- Published and reviewed dates are real.
- Author/reviewer is visible.
- Claims are supportable and styling judgments are framed as Iconik methodology.
- Canonical, description, Open Graph, Article schema, breadcrumbs, and visible text agree.
- Primary visual has correct privacy blur, alt text, disclosure, dimensions, and responsive loading.
- Three to six contextual internal links are present.
- Inline quiz CTA and final CTA carry full article context.
- GA4 and Meta receive each event once without PII.
- Production build succeeds.
- Founder approval is recorded before publishing.
