# Admin image generation and outfit diversity

## September 11 changes

The Studio editor excluded image controls with `!isStudioReport`, which hid them even on the admin route. Admins now have Generate Images, Regenerate Images, group selection, and per-image regeneration. Stylist workspace profiles retain manual upload and prompt access. Image-generation endpoints require the admin cookie; outfit editing/replacement cannot indirectly start image generation for a non-admin profile.

Generate Images asks the server for the visible, eligible missing slots and processes one image per request. Completed images are persisted individually, image counts refresh after each completion, and a failed batch can resume through Generate Images. Regenerate Images deliberately includes already-filled slots. Generating a slot invalidates its page approval and publication, and concurrent starts use the report timestamp to prevent two claims. No paid image generation was started during this change.

## How recommendations work

1. The report analysis and intake become a client state: proportions, focus areas, colour characteristics, coverage preferences, restrictions, lifestyle, and requested ethnic mix.
2. The engine derives styling requirements for four capsules: Professional, Social, Everyday, and Occasion.
3. Eligible reference-library looks supply garment combinations. The engine adapts fit, coverage, colour, and styling details and filters vetoed or unsuitable candidates.
4. Candidates receive rule-based scores for realism, relevance, colour/body suitability, styling impact, and diversity. This stage is deterministic; these outfit pages are not simply twenty independently invented AI outfits.
5. Portfolio selection chooses five looks per capsule while reserving the requested ethnic mix and avoiding reused library signatures. It now re-ranks after every choice and penalizes repeated garment families, supporting layers, and colour families. Garment constraints remain active during diversity selection.

Previously, lead colours and different library IDs could disguise identical supporting layers. The selector also sorted once per capsule, so the second, third, and fourth choices did not account for earlier choices in that capsule. The candidate pool was limited to its first twelve eligible anchors. Those conditions allowed four different blue/white/cream tops to arrive with the same camel blazer and similar jeans.

The updated sampler considers garment structures across the eligible library, then takes a bounded sample. Repeated camel/beige/oatmeal/taupe layers count as the same visible neutral family. Diversity is a selection preference, not a promise to invent unsuitable looks when the usable library is thin. Explicitly labelled men's reference pins are excluded.

## Current report

Report `510724fb-a4f7-410b-a0ef-4a2c18a39a7e` was refreshed using the corrected selector after verifying all 20 outfit pages still matched the original generated text and none had been approved. All 55 pages remain. The first five now contain one camel blazer, one denim waistcoat, and three unlayered combinations using a maxi skirt, culottes, and ankle trousers. The report is still in review and has not been sent or published.

## Verification

- 175 automated tests passed, including matching beige layers with different names, thin candidate pools, ethnic reservations, and explicitly marked men's reference pins.
- TypeScript passed.
- Production build passed, with existing application lint warnings.
- Browser inspection confirmed the admin toolbar and per-image regeneration control.
- Live API checks rejected non-admin generation requests with 403 and returned the 37-slot visible generation plan for the authenticated admin without invoking an image provider.
- Current report regeneration completed through the application API and preserved its 55-page structure.

The existing September 9 release checklist still applies to hosted worker scheduling, a completed PDF export, and approved outbound delivery testing.
