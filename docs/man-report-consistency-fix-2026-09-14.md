# Men's report consistency repair — 14 September 2026

## Findings

- The mobile report presented a source outfit photo as the photo of a derived combination, even when the combination changed garments and colours. The affected report displayed nine such combinations with mismatched photos.
- Outfit and combination-grid text edits could retain images of the previous garment specification.
- Image generation could repair Section 4, retain old image paths, and then skip those populated slots on resume.
- Generated images reused storage filenames. Replacing bytes at the same URL allowed older cached images to remain visible. This is a confirmed cache-risk mechanism, not proof of which cached image a customer saw.
- The mandatory Western reference portfolio and fixed relaxed-casual archetypes overrode an explicitly selected Indian Casual preference.
- The outfit editor validated removed explanatory fields, rejected valid responses using the current format, and fell back to older explanations. A word-count cut could also leave incomplete sentences.

## Changes

- Display derived mobile combinations as readable text cards. A source outfit reference does not prove that its photo matches a new combination.
- Compare rendered garment fields and clear changed outfit photos plus dependent composites; preserve matching photos for copy-only edits.
- Apply invalidation in individual edits, full report edits, text-pipeline checkpoints, and pre-image text repair. Reflect cleared images in the editor.
- Use unique generated-image filenames and reject late outfit image writes when Section 4 changed during generation.
- Refuse send requests with missing outfit photos. This is a completeness/consistency safeguard, not an automated visual correctness guarantee.
- Require two everyday kurta looks when the classification includes Indian Casual, and add a blocking preference-coverage QA check. Explicit Indian-wear exclusions take precedence.
- Validate the current explanation contract, preserve stylist-edited garments, avoid recycling untouched explanations after garment changes, and retain complete sentences.

## Customer correction

The affected report was updated at its existing private link. Twenty outfit descriptions were reviewed, two everyday Indian-casual photos replaced Western casual slots 16 and 17, and all twenty outfit photos plus three grooming grids received new storage URLs. A close-up review corrected the high-top sneaker description in slot 7 and the tuck description in slot 8. The original data and photos remain backed up locally. No email was sent.

This correction addressed the reported photo/description consistency and missing Indian casual wear; it did not regenerate every legacy diagnostic or redesign the complete portfolio to satisfy every newer style-quality rule. Fresh Section 4 QA remains visible rather than being overridden.

## Validation

- Six executed consistency regressions passed, including the existing library, parser, and QA assertion suites.
- Existing outfit-edit assertions passed with updated tests for stale rationale and complete sentences.
- TypeScript check passed.
- Isolated production build passed; unrelated uncommitted workspace edits were excluded.
- The live page showed the corrected descriptions, twenty image references using the reviewed revision, and the matching ivory and rust kurta cards.
- Final production deployment completed and was aliased to `www.iconik.pro`. Mobile DOM verification found nine combination cards, zero borrowed combination photos, and all twenty main outfit photos pointing to the reviewed revision. The mobile combination layout and ivory kurta detail were checked visually.

Private backup, generated images, and prompt records are in the ignored `tmp/man-report-audit/` directory. Built-in imagegen was used for the two new images.
