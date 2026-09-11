# Audit handoff — ICONIK women's outfit recommendation pipeline

You are auditing a body of uncommitted work on branch `fix-google-analytics-primary-id`
in `/Users/navalakhaarts/playernumberone/playernumberone-app`.

**Your job is to decide whether it is safe to press "Replace All Outfits" on a real
client report.** Not to extend it. Not to tidy it. To find what is still wrong.

Assume the previous agent was competent and wrong in places. Everything below is
its own account of its work — treat it as claims to verify, not as facts.

---

## 1. What the system does

A stylist fills an intake form for a client. The app generates a 55-page personal
style report. Pages 32–51 are twenty outfit recommendations.

Outfits are produced by the **outfit science engine**, `src/lib/stylistOutfitScience.ts`:

```
extractStylistClientState  →  deriveFunctionDemands  →  generateOutfitCandidates
   →  scoreOutfitCandidatesBlind  →  selectOutfitPortfolio  →  scienceOutfitsToBlueprintPages
```

Candidates are assembled from **anchor outfits** parsed out of markdown libraries
by `src/lib/stylistOutfitLibraryParser.ts`.

**Critical routing fact.** There are two outfit engines. The other one lives in
`stylistBlueprintGenerator.ts` (`buildOutfitDiversityPlan` and friends). It is
**not running**: `STYLIST_OUTFIT_SCIENCE_HARNESS_ENABLED` is set in `.env.local`,
and the report is tagged `outfit_engine.version === 'outfit_science_v1'`, so
`generateStylistBlueprintPages` returns early into the science engine.

The previous agent lost roughly a day to this — it fixed the planner path first
and reported success on code the app never executes. **Before you accept that any
fix works, confirm the code you are looking at is on the live path.**

The button under audit calls
`POST /api/stylist-blueprint/[reportId]/regenerate-all-outfits`, which calls
`generateStylistOutfitScienceApplication`, then `validateStylistBlueprintReport`,
then saves. It also wipes all 20 outfit images and resets outfit approvals.

---

## 2. The client to test against

Report `4ec6da7f-d676-44c4-816e-8472fe92ba6a`. Her intake states:

| Field | Value | Must produce |
|---|---|---|
| `outfit_ratio` | "More Ethnic" | 12 of 20 outfits ethnic |
| `loved` | sarees, indian, more of workwear | sarees preferred over other ethnic wear |
| `avoided` | "loose plazzos" | no palazzo **or wide-leg** anything |
| `footwear` | "1.2-2 inch heel" | no flats; heel height stated |
| coverage rules | "use a real sleeve or intentional layer" | no bare arms unless a sleeved layer is present |
| `skin_tone_self_description` | "White clothing effect: Makes me dull" | no stark white against the face |

Fixtures used during development were written to a session scratchpad that will
not survive. Re-fetch from Supabase with the service role key in `.env.local`:

```js
// submission.json and report2.json
const { data } = await db.from('stylist_blueprint_reports')
  .select('*').eq('id','4ec6da7f-d676-44c4-816e-8472fe92ba6a').maybeSingle();
// then load the row from stylist_intake_responses by data.submission_id
```

---

## 3. How to run things

```bash
npx tsc --noEmit                 # typecheck
npm run test:stylist-workspace   # 63 tests across 12 files
npm run dev                      # app on :3000 (a server may already be on :3001)
```

Tests need a loader shim because several modules import `server-only` and
`next/cache`, which bare node cannot resolve:

```bash
node --experimental-strip-types --import ./scripts/node-test-hooks.mjs --test <file>
```

---

## 4. What was changed, and what to attack

Roughly 1,400 lines across the outfit pipeline. Take each claim below as a
hypothesis to falsify.

### 4.1 Colour handling
`colourAt` assigned every garment `palette[index % palette.length]` — array
position, nothing else. So a curated look kept its shapes and lost its colour
relationships. Now `colourForSlot` reads the colour the garment actually names
(`colourFromPieceText` in the new `stylistColourMatching.ts`), keeps it when it
suits the client, and snaps to the nearest palette colour **within the same
family** only when `scoreColourPhysics` falls below `COLOUR_KEEP_THRESHOLD` (0.45).

*Attack:* is 0.45 defensible? What happens to a client whose palette is far from
her library looks — does anything get preserved that shouldn't? Is the ~90-entry
colour lexicon wrong anywhere (e.g. "sage", "powder", "champagne")?

### 4.2 Diversity
Portfolio-level penalty in `selectOutfitPortfolio` now scores exact colour repeat
(2.0) and colour-family repeat (0.6) separately.

*Attack:* the stated fear was that preserving colours would make reports bland.
Measured 11 → 15 distinct lead colours on this client. Verify on a different
client profile — a low-contrast or very neutral palette is the risk case.

### 4.3 Intake compliance
Ethnic quota (`ethnicOutfitTarget`, `ethnicCountsByCapsule`), named-garment
preference, footwear heel, banned pieces expanded to silhouette tokens
(palazzo → `wide-leg`, `wide leg`, `wide-legged`), and coverage enforcement
(`coverageViolation`) — all in `stylistIntakePreferences.ts` and
`stylistOutfitScience.ts`.

*Attack:* coverage allows a sleeveless top **if** a sleeved layer is present.
Is `SLEEVED_LAYER_RE` right — does a "sleeveless waistcoat" wrongly count? Does
the ban on `wide-leg` catch too much (are legitimate garments being excluded)?

### 4.4 Client-facing copy
Outfit pages were printing the engine's own record:
`"Demand professional-5: FRAME_FACE, ELONGATE, CONTEXT_FIT via Full tuck with
absorbing layer"`, plus `Realism 7/10. ICONIK 6/10.` Now translated through
`FUNCTION_IN_PLAIN_ENGLISH` and `TECHNIQUE_IN_PLAIN_ENGLISH`, with the internal
score block removed.

*Attack:* grep the generated pages for any remaining internal vocabulary. Check
the translations are actually true — does `DIFFUSE` really mean what the map says?

### 4.5 Libraries
Three markdown sources now load, in this order:

| File | Anchors | Provenance |
|---|---|---|
| `outfitlibrarypinterest.md` | 707 parsed, ~692 usable | client's stylists, described garment by garment |
| `outfitlibraryethnicoffice.md` | 50 parsed, 49 usable | same, declared Professional |
| `outfitlibrarywomen.md` | 303 usable | pre-existing, plus 76 ethnic entries the agent wrote |

The agent also **deleted 37 Western entries it had invented itself** from
`outfitlibrarywomen.md` once real ones existed.

*Attack:* the 76 ethnic entries it kept were written from photographs and its own
styling knowledge. They are unreviewed. Read them. Regional weave claims
(tussar, kota, jamdani, patola, paithani) and wedding-function dress codes
(mehendi, haldi, sangeet) are confident assertions that may be wrong.

### 4.6 Anchor eligibility and the no-repeat rule
An anchor may now be eligible for several capsules (`capsules[]`, `outfitCapsules`),
and `isAlreadyUsed` guarantees the same look never appears twice in one report —
matching on **library signature**, not candidate id.

*Attack:* there is a last-resort branch that permits a repeat rather than
returning a short report (a short report fails page validation). Prove it does
not fire on real data. Check the capsule inference — 74 looks carry cues from two
capsules and were filed by a scoring heuristic.

### 4.7 The anchor gate was loosened
`isUsableStylistOutfitAnchor` no longer requires `completeness_score >= 5` or a
photographed shoe. Rationale: `generateOutfitCandidates` fills a missing footwear
or bag slot from `fallbackSlots`, so the anchor only needs a wearable garment
relationship. This admitted 136 more anchors with no loss to any source.

*Attack:* this is the loosest change in the set. Sample the newly admitted
anchors. Is anything in there not actually an outfit?

### 4.8 Image prompts
Prompt cut from ~600 words to ~150. Hex codes removed entirely — the prompt was
emitting `Layer: Espresso Olive #30261E Espresso Olive Navy knitted jacket`,
with the palette colour contradicting the garment.

*Attack:* **nobody has generated an image from the new prompt.** This is the
least-evidenced change in the whole body of work. Generate one.

### 4.9 Studio UI
Image prompts and uploads moved out of the sidebar onto each image slot in the
report (`ImageSlotFrame`): Upload / Copy prompt / Prompt, plus drag-and-drop.

*Attack:* prompts must never reach a client. The claim is that this is
structural — the client share page passes no `imagePrompts` prop. Verify at
`src/app/stylist/report/[shareToken]/page.tsx`. Check the PDF/print path too.

---

## 5. Known failure patterns of the previous agent

These are its actual mistakes this session. Look for more of the same shape.

1. **Declared readiness on incomplete evidence.** Ran a pre-flight but never ran
   `validateStylistBlueprintReport` — the check the route itself performs. The
   user pressed the button and hit
   `"Outfit page 51 needs enough formula items to render"`. **Always run the
   route's own validation, not a proxy for it.**
2. **Crude metrics producing false results.** Twice reported a violation that was
   not one (a cami under a denim jacket; a saree with its blouse) because the
   measuring script was simpler than the engine's real logic. **Verify with the
   engine's own functions.**
3. **Fixed code on a dead path** and reported success (§1).
4. **Claimed a ranking worked when it did not.** `librarySourceScore` is only
   consulted by the planner path; the live scorer ignored provenance entirely.
   A later fix added `anchorProvenanceBonus`. **Check it is actually consulted.**
5. **Three test files contained assertions that were never invoked** —
   `stylistBlueprintCulturalMode.test.ts`, `stylistOutfitLibraryParser.test.ts`,
   `stylistOutfitScience.test.ts` each exported a `run*Assertions()` function
   nothing called, so they reported "pass" while asserting nothing. One of them
   was pinning a bug in place. **Assume there are more. Check every `.test.ts`
   actually executes its assertions.**

---

## 6. What to deliver

1. **A go / no-go** on pressing Replace All Outfits, with reasons.
2. Anything that would reach a paying client and embarrass the business —
   incoherent copy, a garment that violates her stated requirements, a wrong
   colour, a broken page.
3. Anything unsafe or irreversible in the button's behaviour.
4. Regressions in the non-outfit parts of the report.
5. Your own list of what remains unverified.

Two open items the previous agent flagged and did not resolve:

- **The engine is fully deterministic.** Pressing the button twice gives the same
  twenty outfits — no seed, and the `reason` note is ignored on this path. The
  user has been told. Decide whether that is acceptable for a button labelled
  "Replace".
- **Classification is not re-run** by this button, so the stark-white guardrail
  (§2) only applies on a full Rebuild.

Do not commit anything. Report findings.
