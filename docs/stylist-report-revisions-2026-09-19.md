# Client revisions in the stylist workspace — 19 Sep 2026

How a stylist turns "can you change this?" into a published update, using the
report she has already made.

## Run these two migrations first

Both are additive. Run them in the Supabase SQL Editor **before** deploying, in
this order:

1. `supabase/migrations/add_stylist_report_published_snapshots.sql`
2. `supabase/migrations/add_stylist_report_revisions.sql`

The read paths degrade safely if the code lands first: client links, report
images and every stylist's dashboard keep working without these columns and
without the revisions table. Publishing a report needs migration 1, and
recording a revision needs migration 2.

## What was broken

Editing a delivered report cleared `published_at`, and the client's link 404s
while `published_at` is null. So the moment a stylist started on a revision, the
link she had already sent on WhatsApp went dead — and stayed dead until she had
re-approved every page she touched and published again. Her card also turned red
as "overdue" against the original due date, and nothing anywhere recorded what
the client had actually asked for.

## What the client reads now

Publishing writes a **snapshot** (`published_report_data`, `published_image_urls`)
and remembers the `revision` it was taken at. The client always reads the
snapshot; the stylist always edits the live row. They cannot interfere:

- her link never goes down mid-revision;
- an image that exists only in the unpublished draft is staff-only;
- `Preview as client` shows the draft, and says so in the preview bar;
- pages she did not touch keep their approval, so re-review is minutes, not a
  full pass;
- `published_version` counts what the client would call it: 1 as delivered, 2
  after the first revision. The share link never changes.

## The workflow

1. **The client messages her stylist** on WhatsApp, as she already does.
2. **Asked for a change** — on the client's card or row in the workspace, the
   stylist pastes the message. As she pastes, it becomes a checklist: one line
   per change, with "Look 4" or "Page 12" recognised from the client's own
   wording. She drops anything that is not work and saves — or saves and goes
   straight into the report.
3. **The card moves to the top of To do** as *Revision requested*, showing the
   ask and a `0 of 3 done` count, on its own 48-hour clock. The original due
   date no longer applies, so nothing shows as overdue.
4. **In the report studio** the brief sits above the report: the client's words
   verbatim, the checklist, and a jump link to the page each change is about.
   She ticks items off as she goes, using the tools that were already there —
   other looks, regenerate with the client's reason, paste a replacement outfit,
   new image only.
5. **Publish update** — the button names itself once there are unpublished
   edits. It writes the new snapshot, bumps the version, closes the brief, and
   prepares a WhatsApp message that tells the client to open the same link
   again.
6. **Mark delivered** as usual. It is refused while edits are unpublished,
   because the client cannot see those yet.

## Revised looks (29 Sep)

Most revisions are outfits, so the card's button is now **Revise report**. The
stylist chooses the looks the client wants changed (pasting her message ticks
the ones it names). Each chosen look becomes a blank page in the same design as
the outfits, which the stylist fills in with the usual outfit editor (paste the
outfit, then add the image).

- Stored in `report_data.revised_outfits`, **not** in `pages`, so the fixed
  layout and everything that counts it stay untouched. Pages are numbered
  101+, and images go in `image_urls.revision.outfitFlatlays[n]` (n = page - 101).
- The client sees them as "Your revised looks", just before the outfits,
  newest revision first. The original look stays, marked "Revised". A blank
  revised look is never shown to a reader.
- The paste parser, the outfit validator and the image prompt treat a revised
  look as if it were the original look (`withRevisedOutfitInPlace`).
- Blank or imageless revised looks are publish warnings, never blockers.
- Seven routes (image upload, regenerate image/outfit/palette, edit outfit,
  outfit options, replace all outfits) used to clear `published_at` and take
  the client's link down. They now bump `revision` instead.
- Bulk image generation and "attach silhouette examples" also bump `revision`
  now. Otherwise their changes to a delivered report would never show as
  unpublished, and so could never reach the client.

Library: `src/lib/stylistRevisedOutfits.ts`. No new migration.

## Deferred

- Parsing the paste with a model instead of string rules (the rules are fast and
  correctable; a model would read intent better).
- An "ask for a change to this look" button on the client's own report, which
  would capture page-level scope with no typing at all.
- Appending a second client message to an open brief from the studio (the API
  accepts it; there is no UI yet).
- Revision counts per report section, feeding the outfit library.
- A revision policy (how many are included, and for how long). Nothing in the
  code assumes one yet.
