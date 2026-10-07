// What we ask the image model for when the stylist shows instead of tells.
// Pure, so the exact wording can be tested and reviewed.
//
// The rule that matters most: it must still be THEM. Same face, same skin tone,
// same body, nothing slimmed, lightened or "improved". Only the clothes, hair
// or styling we're talking about change.

export const IMAGE_KINDS = ['outfit_fix', 'look_on_them', 'hairstyles', 'idea'] as const;
export type ImageKind = typeof IMAGE_KINDS[number];

/** Which of their photos each kind needs: their latest photo, or none. */
export function imageNeedsTheirPhoto(kind: ImageKind) {
  return kind !== 'idea';
}

const IDENTITY = `It must still be unmistakably the same person from the reference photo: the same face and features, the same skin tone exactly (never lighter, never smoothed or filtered), the same hair colour unless the brief changes it, the same body shape, size and height. Do not slim, reshape, beautify or age them. No text, captions, logos or watermarks anywhere in the image.`;

export function buildAgentImagePrompt(input: {
  kind: ImageKind;
  brief: string;
  line: 'man' | 'woman' | null;
  palette?: string[] | null;
}) {
  const brief = input.brief.replace(/\s+/g, ' ').trim().slice(0, 900);
  const palette = input.palette?.length ? ` Their best colours are ${input.palette.slice(0, 8).join(', ')}.` : '';
  switch (input.kind) {
    case 'outfit_fix':
      return `Edit this photo. Keep the person, their pose, the camera angle, the framing, the lighting and the background exactly as they are, and change only this: ${brief}. The changed pieces must look real: true fabric, natural folds and fit on their body, shadows that match the room. Everything not mentioned stays identical.${palette} ${IDENTITY}`;
    case 'look_on_them':
      return `A natural, photo-realistic full-length photo of the person in the reference photo, wearing this outfit: ${brief}. Standing relaxed, as if a friend took the photo, in soft daylight in a simple, believable Indian setting that suits the outfit (a home, a terrace, a street, a venue). The clothes should fit them well and look like real pieces you could buy, styled the way a good personal stylist would.${palette} Vertical 4:5 framing with their whole outfit visible, head to shoes. ${IDENTITY}`;
    case 'hairstyles':
      return `A 2x2 grid of four photo-realistic portraits of the person in the reference photo, each with a different hairstyle: ${brief}. Same face, same expression, same lighting and plain background in all four, head and shoulders, so the only difference is the hair. ${IDENTITY}`;
    case 'idea':
      return `A clean, photo-realistic fashion image for a personal stylist to show a client: ${brief}. Natural light, real fabrics and textures, styled simply on a soft neutral background, vertical 4:5. ${input.line === 'man' ? 'Menswear.' : input.line === 'woman' ? 'Womenswear.' : ''} No people's faces, no text, captions, logos or watermarks.`;
  }
}
