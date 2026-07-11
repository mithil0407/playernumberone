# Iconik Article Visual System

## Purpose

Use editorial fashion visuals to explain one styling principle at a time. Every image must function as evidence for the article, not decoration.

Canonical reference: `ChatGPT Image Jul 11, 2026, 12_25_06 PM.png` supplied by the founder on 11 July 2026.

## Brand direction

- Quiet-luxury blue-grey studio background with dimensional light.
- Ivory serif display type and restrained uppercase sans-serif labels.
- Fine white connector lines and small anchor dots.
- Subtle frosted-glass crop cards with thin white borders.
- Large negative space; never fill every area of the canvas.
- Technical, calm, precise language rather than makeover language.
- The person remains the visual focus; UI supports the diagnosis.

Suggested palette:

- Mist blue-grey: `#A7B6BC`
- Iconik blue-grey: `#8FA2AA`
- Deep slate: `#748891`
- Ivory: `#F8F4EC`
- Champagne accent: `#F0CB80`
- Ink: `#27353B`

## Comparison grammar

1. Show the same person and the same body in both states.
2. The diagnostic state uses a neutral front-facing pose.
3. The prescription state may use a subtly more confident pose, but must not create a false body transformation.
4. Change clothing logic only: shoulder placement, waist placement, colour control, vertical fall, scale, or accessory hierarchy.
5. Use two or three close-up cards per side. Every crop must correspond to the actual garment shown.
6. Describe construction, not judgment: `dropped seam`, `pooling`, `competing focal point`, `clean shoulder`, `intentional waist`, `vertical fall`.

## Photography rules

- Photorealistic Indian men and women matched to the article audience.
- Realistic height, weight, age, skin texture, hands, hair, and fabric behavior.
- Include short, curvy, plus-size, stocky, broad-waisted, narrow-shouldered, and other real target profiles where relevant.
- Avoid fashion-model proportions unless the article specifically requires them.
- Preserve identity and body volume across comparisons.
- No skin lightening, slimming, face replacement, or age reduction.
- Full body and footwear must be visible for proportion analysis.
- Use realistic studio grounding shadows; never allow floating feet.

## Privacy treatment

Generate a complete realistic face first. Apply a controlled Gaussian privacy blur to the facial oval during deterministic post-processing. Preserve the hairline, jaw edge, ears, neck, and lighting response.

Do not generate blank mannequin faces, glowing ovals, or extreme blur.

Default disclosure:

> AI-generated styling reconstruction informed by anonymized patterns observed across Iconik consultations. No real client or celebrity is depicted.

Celebrity-analysis disclosure:

> AI-generated styling reconstruction illustrating the principles discussed. It does not depict the celebrity or reproduce a specific outfit.

## Production workflow

1. Lock the article thesis and exact visual diagnosis.
2. Write a two-state shot list.
3. Generate the clean photographic comparison without text or UI.
4. Validate identity, body invariance, garment construction, hands, feet, and pose.
5. Apply privacy blur during post-processing.
6. Render labels, crop cards, connector lines, logo, and disclosure through the site component.
7. Export article, Open Graph, square social, and 4:5 Instagram variants.
8. Add descriptive alt text and Article schema images.

## Asset set per priority article

- Article comparison: 1600 × 2000 or equivalent 4:5 ratio.
- Article hero/Open Graph: 1600 × 900.
- Social square: 1080 × 1080.
- Instagram portrait: 1080 × 1350.
- Optional clean source plate without UI for future reuse.

## Avoid

- Generic catalogue lineups.
- Three unrelated people when the lesson is a transformation.
- Heavy glass panels covering the clothing.
- Decorative callouts that do not prove anything.
- AI-generated labels or paragraphs inside the source photo.
- Cheap gradients, neon palettes, excessive shadows, or glossy influencer retouching.
- Language that frames the body as the problem.
