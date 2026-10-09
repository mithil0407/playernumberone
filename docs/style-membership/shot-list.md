# Style Membership — image shot list

Generated with Google's image model (`gemini-nano-banana-2.1`, 1K) through the
app's `GOOGLE_AI_API_KEY`, by `scripts/generate-membership-images.mjs`, which
reads this file. Each shot is a `###` heading (the image id) with an `aspect`,
a `style` (which prefix below is added), an optional `ref` (an earlier shot
passed as a reference image, to keep the same woman or illustration style) and
a fenced `prompt`. Final files are WebP under `public/membership/<id>.webp`.

Art direction: BetterMe Style mixed with a little Apple. Warm cream/off-white
backgrounds, soft natural light, neutral/camel/brown/ivory/black wardrobes
unless the look calls for colour, generous negative space, product flat-lays on
white, and illustrated body-shape figures in nude bodysuits. Every woman is
Indian; skin tones rotate across fair, wheatish, medium, dusky and deep, in
Indian, Indo-western and western office wear.

## Style prefixes

### prefix:photo
```prompt
Editorial fashion photograph for a premium, calm style-coaching app. Warm cream seamless studio backdrop (#F3EEE6) with a soft floor sweep, soft diffused natural window light from the left, gentle realistic shadows. Clean, minimal, airy composition with generous negative space around the subject. The model is an Indian woman; photorealistic, natural skin texture with visible pores, no plastic retouching, natural Indian facial features. Relaxed, confident, warm expression. Anatomically correct hands with five fingers each, relaxed natural pose. No text, no logos, no watermarks, no extra people, no props unless stated.
```

### prefix:flatlay
```prompt
Overhead flat-lay product photograph shot straight down on a clean warm white surface (#F7F4EE). Soft natural daylight, very soft shadows, neat considered spacing with generous white space around the items, garments neatly folded or laid flat and pressed. Premium catalogue look, calm and minimal, true-to-life fabric texture. No people, no hands, no text, no labels, no logos, no brand names, no watermarks.
```

### prefix:illustration
```prompt
Soft minimal fashion illustration for a premium wellness and style app's body-type picker. One full-body front-view figure of an Indian woman standing straight, feet slightly apart, arms relaxed slightly away from the body so the silhouette is readable, wearing a plain seamless nude bodysuit that matches her skin tone. Simple, elegant, tasteful and non-sexualised. Flat muted colours with subtle soft shading, thin clean contour lines, hair in a neat low bun, a calm simplified face. Plain warm cream background (#F3EEE6), figure centred with space around it. No text, no labels, no arrows, no measurement lines.
```

### prefix:closeup
```prompt
Close-up beauty photograph, soft diffused natural daylight, warm cream background (#F3EEE6), shallow depth of field. Photorealistic natural Indian skin texture with visible pores, no heavy retouching, no makeup filter. Calm, premium, minimal. No text, no logos, no watermarks.
```

## 1. Hero and portraits

### hero-trio
- aspect: 4:5
- style: photo
```prompt
Three Indian women standing together, relaxed and smiling at each other, full length. Left: wheatish skin, wearing a camel blazer over an ivory silk shell and ivory straight trousers. Centre: deep brown skin, wearing a rust cotton straight kurta with ivory straight pants. Right: fair skin with warm undertone, wearing a black linen co-ord shirt and wide trousers. All with simple gold stud earrings. Hands relaxed at their sides or lightly touching a friend's arm.
```

### stylist-portrait
- aspect: 4:5
- style: photo
```prompt
Upper-body portrait of an Indian woman stylist about 32 years old, medium brown skin, shoulder-length dark hair, small gold hoops. She wears a crisp ivory cotton shirt with sleeves rolled once and camel trousers. She holds a small fan of fabric swatches (rust, mustard, olive, ivory) loosely in one hand at chest height, looking at the camera with a warm, assured smile.
```

### sales-hero
- aspect: 4:5
- style: photo
```prompt
An Indian woman about 30 with dusky brown skin and long wavy dark hair, wearing an ivory linen co-ord set (relaxed shirt and wide trousers) and thin gold bangles, sitting on a simple cream upholstered bench, holding a smartphone in both hands and smiling at the screen, the screen faces away from the camera. Three-quarter body.
```

### whatsapp-lifestyle
- aspect: 4:5
- style: photo
```prompt
An Indian woman about 28 with wheatish skin and a long braid, wearing a mustard cotton kurta with ivory churidar, standing beside a simple light-oak clothes rail holding a few neutral garments, glancing down at a smartphone in one hand with a pleased smile. The phone screen faces away from the camera. Three-quarter body.
```

## 2. Body-shape illustrations

No reference image: a reference makes every figure copy the first one's
proportions. The shared prefix keeps the style consistent; each prompt
exaggerates its silhouette so it reads at thumbnail size.

### shape-pear
- aspect: 3:4
- style: illustration
```prompt
Body shape: PEAR (triangle). Exaggerate it so it reads at a glance: narrow, sloping shoulders; small bust; a defined waist; hips and thighs MUCH wider than the shoulders (hips about 1.4 times the shoulder width), full rounded thighs. Skin tone: wheatish, a warm light-brown beige (not yellow).
```

### shape-apple
- aspect: 3:4
- style: illustration
```prompt
Body shape: APPLE (round). Exaggerate it so it reads at a glance: a full, rounded tummy and midsection that is the widest part of the torso, no waist indentation at all, a full bust, rounded shoulders, comparatively narrow hips and slim legs. Plus-size friendly, tasteful. Skin tone: medium brown.
```

### shape-hourglass
- aspect: 3:4
- style: illustration
```prompt
Body shape: HOURGLASS. Exaggerate it so it reads at a glance: shoulders and hips equally wide, a very clearly nipped-in narrow waist (waist much narrower than both), full bust and full rounded hips, curvy figure-eight outline. Skin tone: dusky brown.
```

### shape-rectangle
- aspect: 3:4
- style: illustration
```prompt
Body shape: RECTANGLE (straight). Exaggerate it so it reads at a glance: shoulders, waist and hips all the same width, a straight up-and-down outline with no waist indentation, small bust, slim athletic straight build. Skin tone: fair with warm undertone.
```

### shape-inverted-triangle
- aspect: 3:4
- style: illustration
```prompt
Body shape: INVERTED TRIANGLE. Exaggerate it so it reads at a glance: very broad, square, strong shoulders that are clearly the widest point of the body, much wider than the hips (shoulders about 1.5 times the hip width), the torso tapers in a V down to narrow straight hips with almost no hip curve, slim straight legs, athletic swimmer's upper body. Skin tone: deep brown.
```

## 3. Before and after, per shape

The "before" is tasteful but unflattering for the shape; the "after" uses the
same woman (reference) in the flattering version.

### ba-pear-before
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 30 with wheatish skin and a pear-shaped figure (narrow shoulders, fuller hips and thighs). She wears a short straight-cut beige kurta that ends right at the widest part of her hips and clings there, with very wide flowing beige palazzos that add volume to the lower half. Neutral standing pose, mild expression.
```

### ba-pear-after
- aspect: 4:5
- style: photo
- ref: ba-pear-before
```prompt
Full-length. The same woman as the reference (same face, hair, skin tone, body shape and pose), now in a flattering outfit for a pear shape: a knee-length olive A-line kurta with a structured boat neckline and three-quarter sleeves that skims past the hips, with ivory straight-leg trousers and tan block-heel sandals. Confident smile.
```

### ba-apple-before
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 38 with medium brown skin and an apple-shaped figure (fuller midsection, slim legs). She wears a tight short ribbed grey crop-length top tucked into tight skinny jeans with a wide belt cinched at the middle. Neutral standing pose, mild expression.
```

### ba-apple-after
- aspect: 4:5
- style: photo
- ref: ba-apple-before
```prompt
Full-length. The same woman as the reference (same face, hair, skin tone, body shape and pose), now in a flattering outfit for an apple shape: an ivory V-neck straight longline kurta-tunic with side slits under an open camel longline shrug, dark straight trousers and pointed tan flats. Confident smile.
```

### ba-hourglass-before
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 34 with dusky brown skin and an hourglass figure. She wears a very boxy oversized grey straight kurta that hangs straight from the bust and hides her waist completely, with loose matching pants. Neutral standing pose, mild expression.
```

### ba-hourglass-after
- aspect: 4:5
- style: photo
- ref: ba-hourglass-before
```prompt
Full-length. The same woman as the reference (same face, hair, skin tone, body shape and pose), now in a flattering outfit for an hourglass shape: a deep maroon wrap-style midi dress with a V-neckline and a tie at the natural waist, gold drop earrings and nude block heels. Confident smile.
```

### ba-rectangle-before
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 27 with fair skin with warm undertone and a slim rectangle figure (straight, little waist definition). She wears a shapeless straight grey shift dress to the knee with flat grey sneakers. Neutral standing pose, mild expression.
```

### ba-rectangle-after
- aspect: 4:5
- style: photo
- ref: ba-rectangle-before
```prompt
Full-length. The same woman as the reference (same face, hair, skin tone, body shape and pose), now in a flattering outfit for a rectangle shape: a blush pink peplum top with a defined waist seam, high-waisted ivory flared trousers and nude pointed heels, delicate gold necklace. Confident smile.
```

### ba-invtri-before
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 31 with deep brown skin and an inverted-triangle figure (broad shoulders, narrow hips). She wears a white boat-neck top with big puffed shoulders and tight black skinny jeans. Neutral standing pose, mild expression.
```

### ba-invtri-after
- aspect: 4:5
- style: photo
- ref: ba-invtri-before
```prompt
Full-length. The same woman as the reference (same face, hair, skin tone, body shape and pose), now in a flattering outfit for an inverted-triangle shape: a black V-neck sleeveless straight kurta with a softly flared camel sharara that adds volume at the hips, gold jhumkas. Confident smile.
```

## 4. Style swipes (on-model)

### look-office-kurta
- aspect: 4:5
- style: photo
```prompt
Full-length. A 30-year-old Indian woman with wheatish skin, long dark hair in a low bun, wearing a rust linen straight kurta with ivory straight trousers and tan leather flats, standing relaxed, gentle smile.
```

### look-work-saree
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 36 with dusky brown skin, hair in a neat low bun, wearing a crisp beige handloom cotton saree with a thin maroon border, neatly pleated and pinned, a matching three-quarter-sleeve blouse, a slim watch, and holding a structured black leather tote. Poised office-ready look.
```

### look-blazer
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 33 with medium brown skin and shoulder-length hair, wearing a tailored camel blazer, an ivory silk shell top, black high-waisted straight trousers and black loafers, small gold hoops. One hand in trouser pocket.
```

### look-coord
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 26 with fair skin with warm undertone and loose wavy hair, wearing a taupe linen co-ord set: a relaxed button-up shirt and matching wide-leg trousers, tan flat sandals and a small woven bag.
```

### look-indowestern
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 29 with deep brown skin and natural curly hair tied back, wearing a mustard angrakha-style wrap midi dress with subtle ivory block print and a tie at the side waist, tan juttis and gold jhumkas.
```

### look-festive-lehenga
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 27 with wheatish skin and a sleek low bun with a few jasmine flowers, wearing a light festive lehenga in dusty pink with delicate gold gota-patti work, a matching blouse and a sheer blush dupatta draped over one shoulder, small kundan earrings. Elegant, not bridal.
```

### look-jeans-kurti
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 24 with medium brown skin and a high ponytail, wearing a short white chikankari cotton kurti with straight-leg mid-blue jeans and tan kolhapuri sandals, silver jhumkas. Easy weekend look.
```

### look-maxi
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 32 with dusky brown skin and long open hair, wearing a flowing terracotta cotton maxi dress with thin straps under a light ivory open shirt, tan flat sandals, thin gold bangles. Relaxed, mid-step.
```

## 5. Outfit flat-lays

### flat-office-kurta
- aspect: 4:5
- style: flatlay
```prompt
An office kurta outfit: a folded rust linen straight kurta, folded ivory straight trousers, tan leather flats, a structured tan tote bag, small gold stud earrings and a slim gold watch.
```

### flat-work-saree
- aspect: 4:5
- style: flatlay
```prompt
A work saree outfit: a neatly folded beige handloom cotton saree with a thin maroon border showing, a folded matching blouse, a black structured leather tote, small gold earrings and a slim watch.
```

### flat-blazer
- aspect: 4:5
- style: flatlay
```prompt
A western office outfit: a camel tailored blazer laid flat, an ivory silk shell top, black straight trousers, black leather loafers, small gold hoop earrings.
```

### flat-coord
- aspect: 4:5
- style: flatlay
```prompt
A co-ord set outfit: a taupe linen button-up shirt and matching wide-leg trousers laid flat, tan flat sandals, a small woven straw bag and tortoiseshell sunglasses.
```

### flat-indowestern
- aspect: 4:5
- style: flatlay
```prompt
An Indo-western outfit: a mustard angrakha-style wrap midi dress with subtle ivory block print laid flat, tan embroidered juttis, gold jhumka earrings and a small tan clutch.
```

### flat-festive-lehenga
- aspect: 4:5
- style: flatlay
```prompt
A light festive outfit: a dusty pink lehenga skirt with delicate gold gota-patti work spread out, a matching folded blouse, a sheer blush dupatta loosely folded, a small gold potli bag and kundan drop earrings.
```

### flat-jeans-kurti
- aspect: 4:5
- style: flatlay
```prompt
A casual Indian outfit: a short white chikankari cotton kurti laid flat, folded straight-leg mid-blue jeans, tan kolhapuri sandals and silver jhumka earrings.
```

### flat-maxi
- aspect: 4:5
- style: flatlay
```prompt
A relaxed outfit: a terracotta cotton maxi dress laid flat, an ivory light shirt folded beside it, tan flat sandals, thin gold bangles and round sunglasses.
```

### flat-wedding-guest-saree
- aspect: 4:5
- style: flatlay
```prompt
A wedding-guest outfit: a neatly folded emerald green silk saree with a gold zari border showing, a folded gold blouse, a pair of gold temple jhumkas, a stack of thin gold bangles and a small gold potli bag.
```

### flat-wedding-guest-sharara
- aspect: 4:5
- style: flatlay
```prompt
A sangeet wedding-guest outfit: an ivory and gold embroidered short kurti with a matching flared sharara laid flat, a sheer ivory dupatta with a gold border, gold embroidered juttis and pearl-and-gold chandbali earrings.
```

## 6. Gold versus silver, on each skin tone

Same woman in each pair; the silver shot uses the gold shot as its reference.

### jewel-fair-gold
- aspect: 4:5
- style: closeup
```prompt
Close-up crop from the lips down to the collarbone of a North Indian woman with very fair, light porcelain-beige skin with a warm undertone (clearly lighter than wheatish), wearing a plain ivory crew-neck top, with medium gold drop earrings and a delicate gold chain with a small pendant. Hair tucked behind the ear so the earring shows. Hands not visible.
```

### jewel-fair-silver
- aspect: 4:5
- style: closeup
- ref: jewel-fair-gold
```prompt
The same woman, same crop, same top, same pose and light as the reference. Replace all the jewellery with the same designs in polished silver: silver drop earrings and a delicate silver chain with a small pendant. Hands not visible.
```

### jewel-wheatish-gold
- aspect: 4:5
- style: closeup
```prompt
Close-up crop from the lips down to the collarbone of an Indian woman with wheatish golden-beige skin, wearing a plain ivory crew-neck top, with medium gold drop earrings and a delicate gold chain with a small pendant. Hair tucked behind the ear so the earring shows. Hands not visible.
```

### jewel-wheatish-silver
- aspect: 4:5
- style: closeup
- ref: jewel-wheatish-gold
```prompt
The same woman, same crop, same top, same pose and light as the reference. Replace all the jewellery with the same designs in polished silver: silver drop earrings and a delicate silver chain with a small pendant. Hands not visible.
```

### jewel-medium-gold
- aspect: 4:5
- style: closeup
```prompt
Close-up crop from the lips down to the collarbone of an Indian woman with medium brown skin, wearing a plain ivory crew-neck top, with medium gold drop earrings and a delicate gold chain with a small pendant. Hair tucked behind the ear so the earring shows. Hands not visible.
```

### jewel-medium-silver
- aspect: 4:5
- style: closeup
- ref: jewel-medium-gold
```prompt
The same woman, same crop, same top, same pose and light as the reference. Replace all the jewellery with the same designs in polished silver: silver drop earrings and a delicate silver chain with a small pendant. Hands not visible.
```

### jewel-dusky-gold
- aspect: 4:5
- style: closeup
```prompt
Close-up crop from the lips down to the collarbone of an Indian woman with dusky brown skin, wearing a plain ivory crew-neck top, with medium gold drop earrings and a delicate gold chain with a small pendant. Hair tucked behind the ear so the earring shows. Hands not visible.
```

### jewel-dusky-silver
- aspect: 4:5
- style: closeup
- ref: jewel-dusky-gold
```prompt
The same woman, same crop, same top, same pose and light as the reference. Replace all the jewellery with the same designs in polished silver: silver drop earrings and a delicate silver chain with a small pendant. Hands not visible.
```

### jewel-deep-gold
- aspect: 4:5
- style: closeup
```prompt
Close-up crop from the lips down to the collarbone of an Indian woman with deep brown skin, wearing a plain ivory crew-neck top, with medium gold drop earrings and a delicate gold chain with a small pendant. Hair tucked behind the ear so the earring shows. Hands not visible.
```

### jewel-deep-silver
- aspect: 4:5
- style: closeup
- ref: jewel-deep-gold
```prompt
The same woman, same crop, same top, same pose and light as the reference. Replace all the jewellery with the same designs in polished silver: silver drop earrings and a delicate silver chain with a small pendant. Hands not visible.
```

## 7. Skin-tone swatches and the vein check

### skin-fair
- aspect: 1:1
- style: closeup
```prompt
Soft close-up of the jawline, neck and one bare shoulder of a North Indian woman with very fair, light porcelain-beige skin with a warm undertone (clearly lighter than wheatish), three-quarter angle, no jewellery, face cropped above the lips. Even daylight that shows the true skin tone.
```

### skin-wheatish
- aspect: 1:1
- style: closeup
```prompt
Soft close-up of the jawline, neck and one bare shoulder of an Indian woman with wheatish golden-beige skin, three-quarter angle, no jewellery, face cropped above the lips. Even daylight that shows the true skin tone.
```

### skin-medium
- aspect: 1:1
- style: closeup
```prompt
Soft close-up of the jawline, neck and one bare shoulder of an Indian woman with medium brown skin, three-quarter angle, no jewellery, face cropped above the lips. Even daylight that shows the true skin tone.
```

### skin-dusky
- aspect: 1:1
- style: closeup
```prompt
Soft close-up of the jawline, neck and one bare shoulder of an Indian woman with dusky brown skin, three-quarter angle, no jewellery, face cropped above the lips. Even daylight that shows the true skin tone.
```

### skin-deep
- aspect: 1:1
- style: closeup
```prompt
Soft close-up of the jawline, neck and one bare shoulder of an Indian woman with deep brown skin, three-quarter angle, no jewellery, face cropped above the lips. Even daylight that shows the true skin tone.
```

### vein-check
- aspect: 1:1
- style: closeup
```prompt
Close-up of an Indian woman's inner wrist and forearm, palm facing up, resting on a cream linen surface, wheatish skin, faint natural veins just visible at the wrist, an ivory cotton sleeve pushed back. Natural, relaxed hand with five fingers, partly out of frame.
```

## 8. Colour palettes

### palette-autumn
- aspect: 4:5
- style: flatlay
```prompt
A colour palette made of neatly folded fabric squares (silk, cotton and linen) arranged in a loose grid: rust, mustard, olive green, camel, deep maroon, warm cream and chocolate brown. A single gold hoop earring placed among them.
```

### palette-spring
- aspect: 4:5
- style: flatlay
```prompt
A colour palette made of neatly folded fabric squares (silk, cotton and linen) arranged in a loose grid: coral, peach, warm turquoise, golden yellow, leaf green, ivory and light camel. A single gold stud earring placed among them.
```

### palette-summer
- aspect: 4:5
- style: flatlay
```prompt
A colour palette made of neatly folded fabric squares (silk, cotton and linen) arranged in a loose grid: dusty rose, soft lavender, powder blue, soft grey, mauve, soft white and slate blue. A single silver hoop earring placed among them.
```

### palette-winter
- aspect: 4:5
- style: flatlay
```prompt
A colour palette made of neatly folded fabric squares (silk, cotton and linen) arranged in a loose grid: emerald green, royal blue, magenta, black, pure white, burgundy and icy pink. A single silver stud earring placed among them.
```

## 9. WhatsApp chat visuals

These sit inside chat bubbles drawn in HTML (the chat text itself is never baked into an image).

### chat-mustard-kurta
- aspect: 1:1
- style: photo
```prompt
No person. A mustard cotton kurta hanging on a simple wooden hanger against a plain cream wall, like a quick phone photo of something in a wardrobe but well lit, soft daylight.
```

### chat-jhumkas
- aspect: 1:1
- style: flatlay
```prompt
A single pair of small gold jhumka earrings with tiny pearl drops, placed side by side, product shot, lots of white space.
```

### chat-outfit-check
- aspect: 4:5
- style: photo
```prompt
An Indian woman about 30 with medium brown skin, wearing a sage green straight kurta with ivory pants, standing in front of a tall plain mirror in a minimal cream room taking a photo of her outfit with a phone held at chest height; her face is visible above the phone, smiling. Natural hands holding the phone.
```

## 10. Coming-up occasions

### occ-sangeet
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 30 with deep brown skin and a sleek bun, wearing an ivory and gold embroidered short kurti with a matching flared sharara and a sheer ivory dupatta, pearl-and-gold chandbali earrings, mid-twirl with a joyful smile, warm festive mood but the same clean cream backdrop.
```

### occ-diwali
- aspect: 4:5
- style: photo
```prompt
Full-length. An Indian woman about 35 with fair skin with warm undertone, wearing a deep maroon silk straight kurta set with a gold-bordered dupatta, gold jhumkas, holding a small lit brass diya in both hands at waist height, soft warm glow, the same clean cream backdrop.
```

## 11. Capsule mirror

### capsule-two-wardrobes
- aspect: 4:5
- style: flatlay
```prompt
A capsule wardrobe flat-lay showing two outfits that share pieces. In the centre, a pair of folded ivory straight trousers. On the left, office pieces: a camel blazer, a white cotton shirt and black loafers. On the right, festive pieces: a mustard silk kurta, gold jhumkas and tan embroidered juttis. Clear visual balance between the two sides.
```

## Generation log (9 Oct 2026)

- Model: `gemini-nano-banana-2.1` at 1K, through `GOOGLE_AI_API_KEY` (the same client and model as `src/lib/agentImages.ts`).
- 63 final images, from 73 generations: 62 in 6 batches, plus 10 re-rolls (5 body-shape figures that all copied the first figure's proportions, then pear and inverted triangle once more, and the fair-skin jewellery pair and skin swatch, which read too close to wheatish). The office kurta look is the smoke-test image.
- Estimated cost: 73 × $0.06 (the app's per-image estimate in agentImages.ts) ≈ **$4.38**.
- Output: `public/membership/*.webp`, 960 px wide (720 px for square shots), quality 78: **1.9 MB in total**, 15–45 KB each.
- The personalised look 1 on the result page is generated lazily: once per lead, only after the WhatsApp gate, under a daily cap (`STYLE_MEMBERSHIP_DAILY_LOOKS`, default 200), so about $0.06 per lead who reaches her result.

Images that need a human eye are listed in OWNER-CHECKLIST.md.
