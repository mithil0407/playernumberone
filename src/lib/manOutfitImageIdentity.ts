export type OutfitFacialHairPresence =
  | 'clean_shaven'
  | 'stubble'
  | 'short_beard'
  | 'full_beard'
  | 'moustache'
  | 'unclear'
  | string;

function facialHairDirection(presence: OutfitFacialHairPresence | null | undefined): string {
  if (presence === 'clean_shaven' || presence === 'stubble') {
    return 'Render a fresh clean-shaven or near-clean-shaven finish matching the headshot. At most, retain the faint natural shadow already visible in the source. Do not add a beard, moustache, shaped designer stubble, heavy stubble, stronger cheek coverage, or stronger jaw/chin coverage.';
  }

  if (presence === 'short_beard' || presence === 'full_beard' || presence === 'moustache') {
    return 'Preserve the exact facial-hair style, length, density, coverage, cheek line, moustache, and neckline visible in the original headshot. A tiny neatness cleanup is allowed, but do not replace it with a recommended beard style or invent denser coverage.';
  }

  return 'Preserve only the facial hair visibly present in the original headshot. Do not infer or add a beard, moustache, stubble pattern, cheek coverage, or chin coverage that is not clearly visible.';
}

/**
 * Outfit and lifestyle renders must show the client as they currently look.
 * Recommendation grids remain free to demonstrate alternative grooming styles;
 * this policy deliberately applies only to client-as-model images.
 */
export function buildSourceLockedOutfitIdentityRules(
  facialHairPresence: OutfitFacialHairPresence | null | undefined,
  hairPresence?: string | null,
): string {
  // Full-body renders see the head small, and the model tends to invent a
  // full head of hair on bald clients (seen on a before/after, 27 Sep 2026).
  const scalpLock = hairPresence === 'bald' || hairPresence === 'closely_shaved'
    ? '\n- Scalp lock: the client is bald or closely shaved in every reference photo. Render the head bald or closely shaved exactly as in the headshot, in every panel. Never add scalp hair, a hairline, a haircut, or hair shadow.'
    : '';
  return `SOURCE-LOCKED IDENTITY AND GROOMING — HIGHEST PRIORITY:
- The original headshot is the definitive authority for the client's identity, face, skin tone, apparent age, hair, and facial hair. The full-body reference is authoritative only for body proportions, frame, and scale.
- Preserve the client's distinctive eye shape and spacing, eyebrows, nose, lips, ears, cheek structure, jaw shape, skin texture, hairline, and head shape. Do not substitute a generic model, strengthen the jaw, mature the face, beautify the skin, or change facial proportions.
- Preserve the hairstyle from the original headshot: same haircut silhouette, length, part direction, fringe, texture, wave/curl pattern, hairline, temple shape, and density.
- The only allowed hairstyle change is a very small real-world tidy-up: lightly comb or arrange the existing hair and control obvious flyaways while keeping its natural movement. Do not introduce a side part, quiff, fade, taper, undercut, slick-back, extra height, extra volume, sharper hairline, or a different cut.
- Ignore hairstyle and beard recommendations from the report when rendering this client. Those recommendations belong only to the separate grooming-option slides.
- Facial-hair lock: ${facialHairDirection(facialHairPresence)}${scalpLock}
- If any styling instruction conflicts with the original headshot's identity or grooming, the original headshot wins.`;
}
