import test from 'node:test';
import assert from 'node:assert/strict';
import { STYLIST_WORN_OUTFIT_RENDER_BASE as base } from './stylistBlueprintImageGenerator.ts';

// This one string is the preamble for 27 client-as-model renders: the 20 outfit
// images, the 3 transformation looks and the 4 silhouette proofs. The outfit was
// styled and the hair was not, because the prompt used to say "keep her
// hairstyle" — which an image model reads as "reproduce the intake selfie".
test('worn-outfit renders ask for styled hair without changing the cut', () => {
  assert.match(base, /blow-dried and styled/i);
  assert.match(base, /flyaways controlled/i);

  // Styled must not become restyled. The hairstyle page is where a client is
  // shown a different cut; these images are meant to be recognisably her.
  assert.match(base, /same cut, length and colour/i);
  assert.match(base, /No new cut, fringe or added volume/i);

  // The instruction that caused the problem must not creep back in.
  assert.ok(!/skin tone and hairstyle/i.test(base), 'the render base tells the model to reproduce the source hairstyle');
});

// The long version of this prompt was ~570 words the image model mostly
// ignored, and it made the studio Visuals panel unreadable. The per-slot outfit
// text and the silhouette principle line are added on top of this base, and the
// whole thing is held under 200 words by stylistBlueprintCulturalMode.test.ts.
test('the render base leaves room for the per-slot outfit text', () => {
  assert.ok(base.split(/\s+/).length < 120, `render base has grown to ${base.split(/\s+/).length} words`);
});

test('worn-outfit renders still lock identity and framing', () => {
  assert.match(base, /Keep her face and skin tone/i);
  assert.match(base, /Do not slim, reshape, age or idealise her/i);
  assert.match(base, /portrait 2:3/i);
  assert.match(base, /No text, logos or watermarks/i);
});
