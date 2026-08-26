import { buildSourceLockedOutfitIdentityRules, type OutfitFacialHairPresence } from './manOutfitImageIdentity.ts';

type AnyRecord = Record<string, unknown>;

export function buildManWhatsappOutfitImagePrompt(input: {
  profile: AnyRecord;
  request: string;
  outfitDirection?: string | null;
  memories?: string[];
  facialHairPresence?: OutfitFacialHairPresence | null;
}) {
  const identityRules = buildSourceLockedOutfitIdentityRules(input.facialHairPresence);

  return `Create one premium, photorealistic men's outfit image depicting the same adult client shown in BOTH supplied reference images.

REFERENCE ROLE SEPARATION — NON-NEGOTIABLE:
- The file named headshot is the sole authority for identity, face, complexion, apparent age, hairstyle, hairline, and facial hair.
- The file named full-body is the sole authority for height impression, shoulder-to-hip relationship, torso length, limb proportions, body volume, natural build, and overall scale.
- Combine the headshot identity with the full-body physique so the face and body unmistakably belong to the same real client. Do not paste an oversized or undersized head onto the body, alter neck width, or create a generic face-body composite.
- Neither reference controls the environment. Completely discard and replace both source backgrounds, floors, rooms, furniture, mirrors, walls, outdoor scenery, lighting colour casts, and incidental objects.
- Neither reference controls the final clothing. The written outfit direction below is the sole authority for the garments.

${identityRules}

WHITE SEAMLESS CYC STUDIO — REQUIRED:
- Re-stage the client in a professional pure-white (#FFFFFF) seamless cyclorama studio: matte white infinity wall flowing continuously into a matte white floor.
- The background must read as a clean high-key white fashion studio, not the location from either reference image.
- No visible wall-to-floor seam, horizon line, corner, baseboard, room edge, paper-roll edge, backdrop stand, furniture, props, windows, mirrors, doors, texture, pattern, coloured wash, grey backdrop, gradient, vignette, or environmental detail.
- Use soft, even, neutral studio lighting that preserves the client's true skin tone and garment colours. Allow only a faint, tight, natural contact shadow directly beneath the shoes so the client remains grounded.
- Keep the complete cyclorama white rather than clipping away the client's outline; preserve clean separation around hair, shoulders, pale garments, and shoes.

OUTFIT AND COMPOSITION:
- Show the client head-to-toe in the exact outfit direction below. Match every specified garment, colour, fabric, fit, layer, shoe, accessory, and styling move; do not swap in a different look.
- Use a natural relaxed front or subtle three-quarter pose with both feet visible, realistic fabric texture, anatomically correct hands, balanced proportions, and a straight full-length fashion-editorial camera perspective.
- Make the look attainable and commercially wearable in India, not costume-like or runway-extreme.
- Do not beautify, slim, broaden, heighten, age, de-age, reshape, or idealise the client.
- Contain no written text, logos, price tags, watermarks, collages, borders, or before/after panels.

OUTFIT DIRECTION — SOURCE OF TRUTH:
${input.outfitDirection?.trim() || 'Create the most suitable outfit for the client request using the profile and saved preferences below.'}

CLIENT STYLE PROFILE:
${JSON.stringify(input.profile, null, 2).slice(0, 12_000)}

SAVED PREFERENCES:
${input.memories?.length ? input.memories.join('\n') : 'No additional preferences saved.'}

CLIENT REQUEST:
${input.request}`;
}
