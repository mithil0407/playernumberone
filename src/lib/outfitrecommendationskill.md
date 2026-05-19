# ICONIK Men's Blueprint — Outfit Recommendation Engine

**Version:** 3.2  
**Scope:** Automated Blueprint report generation — outfit recommendation section only  
**Output:** 20 outfits across 4 lifestyle contexts:
- 6 Office/Formal
- 4 Smart Casual
- 5 Evening Wear
- 5 Relaxed Casual

**Geography:** Western clothing by default, with lightweight Indian-context support only when the intake explicitly signals Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, ethnic wardrobe needs, kurta, Nehru jacket, bandhgala, or festive styling.

**Logic:** Hybrid — rule-based constraints define what is correct, AI generates the outfit copy.

**Visual Reference Standard:** All outfits must be executable at the quality level of the reference image library. If an outfit would not look at home in that library, do not generate it.

---

## HOW THIS SKILL WORKS

When generating outfit recommendations for an ICONIK Men's Blueprint, you will:

1. **Read all form inputs** — body shape, undertone, colour season, face shape, lifestyle contexts, style poles, fat storage zone, highlight zone, minimise zone, fit preference.
2. **Apply the constraint rules** in this file to determine WHAT is appropriate for this client.
3. **Generate exactly 20 outfit descriptions** — 6 Office/Formal, 4 Smart Casual, 5 Evening Wear, 5 Relaxed Casual — using those constraints.
4. **Format each outfit** as: Top + Layer + Bottom + Footwear + Accessory + Why It Works + Shopping Translation + Acceptable Substitutes + Do Not Buy.

Never generate an outfit that violates a constraint rule. The constraints are the science. The language is yours.

---

## THE VISUAL DNA — WHAT THESE OUTFITS MUST LOOK LIKE

Every outfit generated must feel like it belongs to one of these proven formulas. These are not suggestions — they are the reference standard for what ICONIK recommends.

### FORMULA 01 — THE POLO + CHINO FORMULA

Dark polo, such as navy, forest green, deep burgundy, or dark olive + light chino, such as beige, stone, sand, or off-white + dark brown leather loafer + slim dark belt.

The depth contrast is the entire outfit. No layer needed. The polo must be fitted through the chest and shoulder. The chino must be flat-front and slim-straight. The belt and loafer must match in tone.

Best for: Smart Casual, HOT climate.

---

### FORMULA 02 — THE TUCKED SHIRT FORMULA

Slim-fit light Oxford shirt, such as cream, warm ivory, pale blue, or soft white, tucked into dark flat-front trousers, such as chocolate brown, dark navy, or charcoal. Dark loafer or Derby shoe. Sleeves rolled to mid-forearm. Aviator sunglasses optional only for outdoor use.

**Hard restriction:** Oval and Rectangle body shapes must NOT use the tucked shirt formula. Athletic and Slim frames only.

Best for: Formal / Smart Casual, lean frames only.

---

### FORMULA 03 — THE BLAZER MIX FORMULA

Contrast blazer + contrast trouser + white or neutral open-collar shirt. The blazer and trouser must be from different colour families. The shoe must match the warmest tone in the outfit.

Examples:
- Tan blazer + navy trouser + white shirt + dark brown loafer
- Navy blazer + grey trouser + burgundy knit polo + brown loafer
- Olive blazer + off-white trouser + warm ivory shirt + tan loafer

Best for: Formal / Smart Casual / Evening.

---

### FORMULA 04 — THE WARM THREE-TONE STACK

Dark warm layer, such as dark brown cotton overshirt or chocolate field jacket + mid-tone warm tee, such as olive, warm sage, or muted terracotta + light warm bottom, such as beige, stone, or tan chino + dark brown leather boots or chunky loafer.

Each piece is one step lighter than the piece above it. Temperature never breaks. All three pieces must sit in the warm family.

Best for: Relaxed Casual, TEMPERATE climate.

---

### FORMULA 05 — THE LINEN RESORT FORMULA

Coloured linen shirt, such as forest green, deep teal, deep burgundy stripe, or slate blue, worn open-collar + white or off-white linen wide-leg trousers + tan/brown leather flat sandal or white/off-white slip-on loafer.

Gold watch or bracelet is the only accessory. No layer. The shirt and trouser must have clear depth contrast.

Best for: Relaxed Casual / Evening Casual, HOT climate.

---

### FORMULA 06 — THE TONAL SHIRT + WHITE BOTTOM

Stripe or solid coloured shirt, such as blue stripe, royal blue, deep forest green, or slate blue + white or off-white chino or linen trouser + white/off-white slip-on loafer or brown suede tassel loafer.

Sunglasses optional only for outdoor/daytime context. No visible belt or minimal belt. Works for both lean and oval frames when the shirt is worn untucked.

Best for: Relaxed Casual / Smart Casual, HOT climate.

---

### FORMULA 07 — THE MONOCHROME + WHITE SHOE

All-black base, such as black fitted long-sleeve tee + black straight trousers + black leather jacket or biker jacket + white/off-white clean leather sneakers.

The white/off-white sneaker is the only contrast. A black woven belt or black leather belt adds subtle texture within the black. No other colour anywhere.

Best for: Evening Casual / Party.

---

### FORMULA 08 — THE HARRINGTON / COACH JACKET FORMULA

Zip or snap-button jacket, such as tan, camel, navy, or dark olive + white or neutral tee underneath, always visible + wide-leg or relaxed straight trousers, such as blue-grey, stone, or dark indigo + white/off-white clean leather sneakers.

The jacket and trouser must be from different temperature families. Gold or silver watch depending on undertone is the only accessory.

Best for: Evening Casual / Party / Relaxed Casual.

---

### FORMULA 09 — THE LEATHER JACKET ELEVATED

Dark brown or black leather/faux leather zip jacket + white open-collar shirt underneath, collar visible above jacket + mid-wash straight-leg or relaxed denim + dark brown chunky-sole loafer or black minimal leather sneaker depending on colour loop.

Black crossbody or tote bag optional. The collar above the jacket is what elevates this above a streetwear look.

Best for: Evening Casual / Party.

---

### FORMULA 10 — THE DARK CORDUROY / OVERSHIRT SOLO

Dark corduroy overshirt, such as dark brown or near-black, worn open with no base tee visible at chest + grey wide-leg relaxed denim + white/off-white sneakers.

**Hard restriction:** Athletic and Slim frames only. Not for Oval or Rectangle — no base layer means the midsection is unsupported.

Best for: Relaxed Casual, TEMPERATE climate.

---

### FORMULA 11 — THE HENLEY + WIDE-LEG DENIM

White or warm ivory linen Henley, long sleeve + light-wash or off-white wide-leg relaxed denim + black leather loafer, white/off-white low-top sneaker, or black minimal sneaker depending on the outfit palette.

Thin chain necklace at the neck. Belt visible at waist, black or dark brown depending on footwear. The Henley must be untucked.

Best for: Relaxed Casual.

---

### FORMULA 12 — THE FITTED DARK TEE + WIDE-LEG DENIM

Fitted black or dark navy long-sleeve crewneck tee + light-wash relaxed wide-leg denim + white/off-white low-top sneaker or black high-top canvas sneaker.

The contrast between the fitted dark top and the wide-leg light bottom is the entire outfit. Maximum depth contrast with minimum pieces. The tee must be fitted — if it is oversized, the outfit fails.

Best for: Relaxed Casual / Streetwear-adjacent.

---

### FORMULA 13 — THE TEXTURED OPEN SHIRT + WIDE-LEG TROUSER

A shirt with visual texture — washed denim shirt, chambray, or linen in a mid-tone such as slate blue, washed indigo, or light denim — worn open 2–3 buttons, sleeves rolled to mid-forearm, untucked. Paired with wide-leg or relaxed straight trousers in a warm neutral such as tan, stone, warm beige, or khaki. Dark brown penny loafer or dark brown leather boot. Silver or gold watch.

The depth contrast rule: The shirt must be lighter or cooler than the trouser. The trouser is always the warm anchor. The loafer matches the trouser's warmth tone.

This formula directly replaces any no-layer smart casual or formal outfit where the engine would otherwise reach for a band-collar shirt in a flat grey/teal/slate register with no depth contrast.

Ideal for: Athletic, Slim, Rectangle. Average to tall height. Cool Medium or Neutral undertone.

---

### FORMULA 14 — THE CHECK / PLAID SHIRT + DARK DENIM

A muted check or plaid overshirt/shirt, such as sage green + white check, slate blue + white check, or warm beige + brown check — relaxed fit, worn open-collar, untucked. Paired with dark indigo wide-leg or relaxed straight denim. White/off-white clean leather sneakers. Silver watch.

The check shirt is the accent piece — it carries all the visual interest a jacket or layer would otherwise provide. The dark denim is the unambiguous deep anchor. The check must always be muted and tonal — never bold primary colours. Never pair a check shirt with a light-wash trouser — the dark denim anchor is non-negotiable for this formula.

Ideal for: Athletic, Slim, Rectangle. Any undertone — the check tones are calibrated to the client's season. Tall-average to tall.

---

### FORMULA 15 — THE STRIPE SHIRT + WHITE DENIM + DARK LOAFER

Fine-stripe Oxford shirt, such as muted pink + white stripe, blue + white stripe, or sage + white stripe — slim-fit, open collar, sleeves rolled, untucked or half-tucked. White or off-white straight-leg or relaxed denim. Dark wine, dark burgundy, or dark brown leather penny loafer.

Rule: The loafer must be the darkest piece in the outfit — it does all the depth contrast work when both top and bottom are light. If the loafer is also light, the outfit has no anchor.

Cool-undertone version of Formula 06. Pink stripe and blue stripe are the correct accent tones for Cool Light and Cool Medium clients — not forest green or deep burgundy, which read warm.

Ideal for: Athletic, Slim. Cool Light or Cool Medium undertone. Average to tall. HOT climate.

---

### FORMULA 16 — THE LEATHER JACKET + STRIPE SHIRT + CREAM TROUSER

Black faux leather or leather zip jacket, trucker/harrington collar profile + vertical stripe shirt worn underneath, such as cream + beige stripe or white + navy stripe — collar visible above jacket. Cream or off-white wide-leg relaxed trousers. Black high-top canvas sneakers, black minimal leather sneakers, or black leather Chelsea boot.

Rule: When the jacket is black and the trouser is cream/light — the shoe must be black. The black shoe closes the colour loop: black jacket at top, black shoe at bottom, light trouser in between. This is the only formula where black sneakers pair with a cream trouser.

This is a variant of Formula 09 — the stripe shirt replaces the plain white Oxford for clients who lean expressive on the style poles.

Ideal for: Athletic, Slim, Rectangle. Cool Deep or Neutral undertone. Tall-average to tall. Fashion-forward style pole.

---

### FORMULA 17 — THE QUARTER-ZIP + DARK TAILORED TROUSER

Camel, warm tan, or dark olive fine merino or cotton quarter-zip — worn with white tee collar visible at the neck above the zip. Dark navy pinstripe or charcoal flat-front tailored trouser. Tan leather penny loafer or dark brown Derby shoe. Brown leather watch.

The white tee collar peek is mandatory — it adds a third clean element and prevents the quarter-zip from reading as casualwear when paired with tailored trousers. Without it, the look loses register.

The shoe bridges the temperature: camel quarter-zip + navy trouser = tan loafer that bridges both. Never use a black shoe here — it doubles down on the cool bottom and loses the warm bridge.

This formula directly replaces any formal or smart casual blazer outfit when the style poles lean relaxed or the client wants structure without stiffness.

Ideal for: Rectangle, Athletic, Slim. Warm Medium or Neutral undertone. Average to tall. TEMPERATE climate only — merino quarter-zip is not appropriate for HOT climate.

---

## BAND-COLLAR SHIRT — CONTROLLED USE RULE

The band-collar shirt is removed from the active western outfit vocabulary.

It must NOT be used in standard western Formal, Smart Casual, Evening Wear, or Relaxed Casual outfits because it often generates flat, tonally dead combinations with no depth contrast and no clear anchor-accent logic.

Every western context where the engine would previously reach for a band-collar shirt now has a better formula replacement:
- No-layer smart casual with depth contrast → Formula 13
- No-layer HOT climate shirt look → Formula 01, 05, 06, or 15
- Elevated casual evening with no blazer → Formula 13 or Formula 17

**Exception:** Band-collar shirts are allowed only when the client explicitly signals Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, ethnic wardrobe needs, kurta, Nehru jacket, bandhgala, or festive styling.

In those cases, the band-collar shirt must look intentional, premium, and Indian-context appropriate — not like a weak substitute for a western shirt.

---

## SECTION 01 — FORM INPUT MAP

| Form Field | Blueprint Variable Name | Used For |
|---|---|---|
| Q5 Height | `HEIGHT` | Proportion rules, trouser break, layering |
| Q6 Body Shape | `BODY_SHAPE` | Silhouette constraints |
| Q7 Fat Storage Zone | `MINIMISE_ZONE` | Camouflage rules |
| Q8 Highlight Zone | `HIGHLIGHT_ZONE` | Enhancement rules |
| Q9 Minimise Zone | `MINIMISE_ZONE_2` | Secondary camouflage |
| Q10 Fit Preference | `FIT_PREF` | Fit language across all outfits |
| Q12 Skin Tone | `SKIN_TONE` | Colour depth calibration |
| Q13 Vein Undertone | `UNDERTONE` | Warm / Cool / Neutral determination |
| Q14 White Test | `WHITE_TEST` | Colour contrast level |
| Q15 Hair Colour | `HAIR` | Colour season input |
| Q16 Eye Colour | `EYES` | Colour season input |
| Q3 Dressing Contexts | `CONTEXTS` | Confirms which 4 contexts to populate |
| Q4 Location | `CLIMATE_ZONE` | HOT or TEMPERATE — drives fabric, layer frequency, item restrictions |
| Q11 Wardrobe Composition | `WARDROBE_BASE` | Starting point awareness |
| Q19 Primary Style Goal | `STYLE_GOAL` | Tone and direction of copy |
| Q21 Style Tribes | `STYLE_TRIBES` | Off Duty / Urban Wear streetwear signal |
| Q22–Q25 Style Poles | `STYLE_POLES` | Structured vs fluid, minimal vs expressive, etc. |
| Q27 Anti-Preferences | `ANTI_PREFS` | Hard exclusions — never include these |

---

## SECTION 02 — COLOUR SEASON DERIVATION

Derive the client's colour season from Q12 + Q13 + Q14 + Q15 + Q16 before generating any outfits.

### Step 1 — Determine Undertone

| Q13 Vein Colour | Undertone |
|---|---|
| Blue / Purple | Cool |
| Green | Warm |
| Mix of both | Neutral |
| Can't tell | Default to Neutral |

### Step 2 — Determine Season

| Undertone | Skin Depth | Season |
|---|---|---|
| Cool | Fair / Light | Cool Light |
| Cool | Medium / Wheatish | Cool Medium |
| Cool | Deep / Dark | Cool Deep |
| Warm | Fair / Light | Warm Light |
| Warm | Medium / Golden | Warm Medium |
| Warm | Deep / Dark | Warm Deep |
| Neutral | Any | Neutral |

### Step 3 — Palette Per Season

**CRITICAL COLOUR VARIETY RULE:** Never repeat the same specific colour in more than 3 outfits across all 20. The goal is a complete varied wardrobe.

**BLACK JACKET RULE:** A black jacket, blazer, or outerwear piece is always permitted regardless of colour season. At least one other piece in that outfit must sit within the client's palette.

### COOL LIGHT

**Power Neutrals:** Soft white, light grey, navy, slate blue, pale chambray blue, silver-grey  
**Accent:** Icy lavender, dusty rose, cool mint, powder blue, soft teal  
**Avoid:** Orange, warm brown, mustard, rust, golden yellow

### COOL MEDIUM

**Power Neutrals:** Charcoal, navy, cool mid-grey, slate, cool taupe, steel blue  
**Accent:** Teal, muted burgundy, cool olive, dusty blue, slate green  
**Avoid:** Warm camel, terracotta, golden yellow, rust

### COOL DEEP

**Power Neutrals:** Black, deep navy, dark charcoal, pure white, dark teal  
**Accent:** Deep burgundy, royal blue, emerald, deep plum, forest teal  
**Avoid:** Warm brown, mustard, orange, warm camel

### WARM LIGHT

**Power Neutrals:** Warm ivory, sand, camel, tan, warm beige, light khaki  
**Accent:** Peach, warm coral, warm gold, light terracotta, apricot  
**Avoid:** Heavy black, icy cool tones, silver-grey

### WARM MEDIUM

**Power Neutrals:** Camel, warm tan, olive, khaki, warm brown, warm taupe, dark olive  
**Accent:** Muted rust, muted terracotta, burnt sienna, tobacco brown, copper  
**Avoid:** Cool grey, icy white, silver-grey, mustard, bright yellow-adjacent tones

### WARM DEEP

**Power Neutrals:** Dark brown, rich olive, dark khaki, deep warm tan, chocolate brown, dark warm navy  
**Accent:** Muted deep rust, burnt sienna, forest green, deep muted terracotta, amber accessory only  
**Avoid:** Cool grey, icy pastels, silver-grey, stark white, mustard

### NEUTRAL

**Power Neutrals:** Navy, warm grey, stone, medium brown, off-white, taupe, slate  
**Accent:** Both warm and cool accents work — do not combine a very warm accent with a very cool base in the same outfit  
**Avoid:** Neon tones; extreme temperature pairings within a single outfit

---

## SECTION 02B — COLOUR HIERARCHY RULE

Applies to every single outfit. No exceptions.

### The Two Roles

| Role | Definition | What qualifies |
|---|---|---|
| Anchor | Dominant, grounding piece. Always a neutral or dark tone. | Dark brown, navy, charcoal, olive, khaki, dark indigo, black, warm grey, chocolate, dark tan, white/off-white when used as the bottom in a light-dominant formula |
| Accent | Secondary piece. One piece only. Adds colour personality. | Muted rust, terracotta, burnt sienna, forest green, muted burgundy, teal, royal blue, slate blue — always in a muted or earthy register |

### Hard Rules

1. One anchor. One accent. Maximum. Never two accent-coloured pieces in the same outfit.
2. Neutrals can pair with neutrals only if one is clearly lighter and one is clearly darker.
3. Accent pieces go on tops, not bottoms in casual and smart casual. Exception: deep neutral blazer as layer allows muted accent trouser.
4. One temperature family per outfit — warm accent with warm or dark neutral anchor only.
5. Depth contrast is mandatory — every outfit must have at least one clearly light piece and one clearly dark piece.

### The White/Off-White Bottom Exception

In Formulas 05, 06, and 11 — white or off-white linen trousers, chinos, or denim act as the light anchor, not an accent. The coloured top is the accent. This is valid because the contrast is maximum.

Apply only when the top is a mid-to-dark saturated piece such as forest green, royal blue, burgundy, deep teal, navy, or dark olive.

### Saturation Ceiling Rule

- Warm Deep and Cool Deep: All accent colours must be muted and earthy. No high-saturation orange, no mustard, no bright yellow.
- Warm Medium: Same saturation ceiling.
- Warm Light and Cool Light: Slightly higher saturation tolerated but still tonal.

### Prohibited Combinations

| Combination | Why Prohibited |
|---|---|
| Rust top + brown trouser | Two warm mid-tones — no depth contrast |
| Mustard top + any trouser | High-saturation — garish on Indian skin |
| Olive top + camel/tan trouser | Two warm mid-tones — muddy |
| Blue top + rust/terracotta trouser | Cross-temperature clash |
| Two accent colours in same outfit | No anchor |

### Correct Combination Examples

| Top | Bottom | Layer | Why It Works |
|---|---|---|---|
| Fitted navy polo | Beige flat-front chino | None | Dark anchor top, light anchor bottom |
| Cream Oxford shirt | Chocolate brown flat-front trouser | None | Light top, dark bottom, warm family |
| White open-collar shirt | Dark navy slim trouser | Tan blazer | Warm layer, neutral base, cool bottom |
| Olive fitted tee | Beige straight chino | Dark brown cotton overshirt | Warm three-tone stack |
| Deep forest green linen shirt | White linen wide-leg trouser | None | Dark accent top, white anchor bottom |
| White fitted tee | Black straight trouser | Black leather jacket | Full monochrome, white shoe only break |
| White tee | Blue-grey wide-leg trouser | Tan harrington jacket | Warm layer, neutral base, cool bottom |

---

## SECTION 03 — SILHOUETTE RULES BY BODY SHAPE

### RECTANGLE

Shoulders, chest, and waist are similar width.

**Goal:** Create the illusion of a waist and shoulder-hip contrast.

- Formula fit: Formulas 01, 03, 04, 08, 09 work well.
- Tops: Structured blazers, fitted polos, layered looks.
- Bottoms: Slim-fit trousers with a slight taper; avoid baggy or overly wide legs.
- Avoid: Boxy oversized tops paired with straight wide-leg trousers — no contrast means no silhouette.
- Fit Language: Structured, tailored, fitted through the shoulder.

---

### ATHLETIC / V-SHAPE

Broad shoulders, narrow waist.

**Goal:** Balance upper and lower body; avoid further widening the shoulders.

- Formula fit: All formulas work. Formulas 05, 06, 10, 12 particularly strong.
- Tops: Fitted crewnecks, V-necks, slim-fit shirts; avoid epaulettes or padded shoulders.
- Bottoms: Straight-leg or slim trousers — wide-leg also works because it adds lower body volume.
- Avoid: Padded shoulders, wide lapels, horizontal chest stripes.
- Fit Language: Fitted, slim, no excess shoulder structure.

---

### OVAL / ROUND

Fuller midsection, belly-dominant.

**Goal:** Draw the eye vertically; minimise midsection width.

- Formula fit: Formulas 01, 03, 06, 08 work. Formulas 02 and 10 are prohibited.
- Tops: Straight-hem shirts worn untucked, open layering pieces, open blazer, open overshirt, open jacket, V-neck or open-collar necklines.
- Bottoms: Flat-front slim-straight trousers; avoid pleated fronts; dark tones on trouser.

**HARD RULE — OVAL FORMULA RESTRICTIONS:**
- NEVER tucked shirt.
- NEVER overshirt worn skin-to-shirt with no base layer.
- NEVER fitted tee with wide-leg denim.
- ALWAYS use an open layer to create a vertical channel.
- Fit Language: Relaxed through the midsection, straight or slim through the leg.

---

### SLIM / LEAN

Narrow frame throughout.

**Goal:** Add volume and visual mass.

- Formula fit: All formulas work. Formulas 04, 08, 11, 12 particularly strong.
- Tops: Structured blazers, layered looks, heavier fabrics, textured knits.
- Bottoms: Straight-leg or slightly relaxed; avoid ultra-skinny.
- Fit Language: Structured, layered, medium-relaxed.

---

### TRIANGLE

Narrower shoulders, broader hips/thighs.

**Goal:** Widen the shoulder line; slim the lower half.

- Formula fit: Formulas 01, 02, 03, 04, 08 work well.
- Tops: Structured blazers with shoulder structure, lighter tones on top, horizontal details at chest.
- Bottoms: Dark tones, slim-fit or tapered.
- Avoid: Wide-leg or heavily pleated bottoms, light-coloured bottoms.

---

## SECTION 04 — HEIGHT RULES

| HEIGHT | Proportion Rules |
|---|---|
| Under 5'6" | No cropped jackets. Use vertical elements such as V-necks, vertical stripe, vertical texture. Trousers: no break, clean ankle hem. Monochromatic elongates. Wide-leg denim prohibited. Formulas 11 and 12 with wide-leg denim are not available. |
| 5'6"–5'9" | Most silhouettes work. Slight trouser break acceptable. Standard proportions apply. Wide-leg works if the top is fitted. |
| 5'9"–6'0" | Full-break trousers work. Longer jacket lengths look intentional. All formulas available. |
| Above 6'0" | All formulas available. Wide-leg and oversized silhouettes read as confident. Formula 08 oversized harrington + wide-leg is particularly strong. |

---

## SECTION 04B — CLIMATE ZONE RULES

| Q4 Location | Climate Zone |
|---|---|
| India | HOT |
| UAE / Middle East | HOT |
| UK / Europe | TEMPERATE |
| Canada / USA | TEMPERATE |
| Other | TEMPERATE |

### HOT CLIMATE RULES

**Fabric restrictions:**
- No wool, flannel, heavy knits, merino in any base top.
- Blazers: linen-cotton blend or lightweight unlined cotton only — no wool blazers.
- Trousers: linen, cotton chino, or lightweight cotton blend.
- No turtlenecks of any kind.
- No heavy corduroy — lightweight cotton corduroy only if client is in a cooler microclimate.
- Denim acceptable in casual; avoid raw or very thick denim.

**Formula restrictions for HOT climate:**
- Formula 04 prohibited.
- Formula 10 prohibited.
- Formula 17 prohibited.
- Formulas 05, 06, 01 are the primary casual formulas for HOT climate clients.

**Layer frequency for HOT climate:**
- Maximum 8 layers total across all 20 outfits.
- A layer must be genuinely necessary.
- When a layer is used: lightweight, worn open only, airflow-appropriate.
- Preferred HOT climate layers: unlined linen-cotton blazer, lightweight cotton overshirt, lightweight nylon or cotton harrington, unstructured cotton sport coat.

**No-layer tops that can carry a HOT climate Formal or Smart Casual outfit alone:**
- Fine cotton poplin Oxford, spread collar, slim-fit.
- Linen-cotton blend shirt, slim-fit, open collar.
- Long-sleeve fine cotton polo, slim-fit.
- Camp collar short-sleeve shirt for smart casual / casual only.

### TEMPERATE CLIMATE RULES

Full vocabulary applies. No restrictions on wool, merino, flannel, or corduroy. All formulas available.

---

## SECTION 05 — FAT STORAGE ZONE CAMOUFLAGE RULES

| Zone | Camouflage Strategy |
|---|---|
| Belly / Midsection | Untucked tops only. Open layers never buttoned closed. Dark tones through the midsection. V-neck and open-collar necklines create vertical line. Formulas 01, 03, 06, 08 are the primary tools. |
| Chest / Upper body | V-neck and open-collar necklines. Avoid bulky knits and double-breasted jackets. |
| Hips / Thighs | Dark tones on bottoms. Slim-tapered cut. Structured tops with shoulder volume to redirect eye upward. |
| Arms / Back | Structured jacket sleeves add a clean line. Avoid very slim-fitted sleeves. |
| Evenly distributed | Monochromatic dressing. Vertical elements. Medium-relaxed fit throughout. |

---

## SECTION 06 — HIGHLIGHT ZONE ENHANCEMENT RULES

| Zone | Enhancement Strategy |
|---|---|
| Shoulders / Chest | Structured blazers, lapels, V-necklines, open-collar shirts |
| Arms if muscular | Fitted sleeve through the upper arm |
| Legs | Slim-tapered or straight trousers following the leg line |
| No specific area | Proportion-balanced silhouettes |

---

## SECTION 07 — FIT PREFERENCE CALIBRATION

| Fit Preference | How to Apply |
|---|---|
| Fitted — I want my shape to show | All pieces slim-fit. Only override if body shape rule prohibits. |
| Structured and tailored — nothing too tight | Slim-fit to tailored. Blazers and structured layers included frequently. |
| Relaxed / Oversized — comfort first | Medium-relaxed. Straight-leg bottoms. No baggy — relaxed and intentional. Wide-leg formulas 11 and 12 are good here. |
| Open to fitted if I knew it would look good | Apply the correct formula for the body shape. Write the copy as if designed for his specific geometry. |

---

## SECTION 08 — STYLE POLES CALIBRATION

| Pole | LEFT lean | RIGHT lean |
|---|---|---|
| Structure: Structured ↔ Fluid | Formulas 01, 02, 03 dominate; blazers in 3+ outfits | Formulas 05, 06, 08, 11 dominate; more linen and relaxed pieces |
| Expression: Minimal ↔ Expressive | Neutral palette, accessories minimal | Allow accent colours, vertical stripes, selected jewellery |
| Tone: Classic ↔ Fashion-forward | Formulas 01, 02, 03; Oxford shirts, chinos, blazers | Formulas 08, 10, 12; wide-leg denim, harrington jackets, minimal black sneakers |
| Register: Dressed-up ↔ Dressed-down | Elevate casual contexts with Formula 09 or 03 | Formal contexts still clean but add ease — Formula 03 open-collar white shirt |

---

## SECTION 09 — ANTI-PREFERENCE RULES

`ANTI_PREFS` is a hard block. If the client has listed a colour, silhouette, item, or style category — that item is excluded from all 20 outfits.

If `ANTI_PREFS` = "No" or "Never thought about this" → no exclusions apply.

---

## SECTION 10 — THE 4 LIFESTYLE CONTEXTS

### CONTEXT A — FORMAL

**Definition:** Corporate office, client-facing meetings, board settings, job interviews, formal events.

**Output Count:** 6 outfits.

**Primary formulas:** Formula 01, Formula 02 where allowed, Formula 03.

**Layer frequency:** 4 out of 6 outfits have a layer. 2 outfits stand alone.

**Rules:**
- Minimum 3 outfits include blazers.
- 1 outfit may include a quarter-zip or structured overshirt if TEMPERATE.
- 2 outfits may stand without a layer — fine cotton Oxford shirt or long-sleeve polo with tailored trousers and leather shoes.
- Trousers: Flat-front slim or tailored. No jeans.
- Footwear: Leather Oxfords, Derby shoes, Chelsea boots, leather loafers. No sneakers.
- Colour: Power neutrals. Max 1 accent piece per outfit.
- No waistcoats.
- Outfit 6 should be the most elevated: full coordinated suit or strong colour-matched combination.

**HOT climate adjustments:**
- All blazers must be unlined linen-cotton or lightweight cotton.
- Prefer breathable no-layer outfits where appropriate.
- Fine cotton poplin Oxford shirt alone with tailored linen trousers and leather shoes is a complete formal outfit.

---

### CONTEXT B — SMART CASUAL

**Definition:** Business casual workplace, client lunches, startup office, dinner with colleagues.

**Output Count:** 4 outfits.

**Primary formulas:** Formula 01, Formula 02 where allowed, Formula 03, Formula 06, Formula 13, Formula 15.

**Layer frequency:** 2 out of 4 outfits have a layer. 2 outfits stand alone.

**Rules:**
- 2 outfits include a layer — vary across unstructured blazer, structured overshirt, lightweight bomber, quarter-zip, harrington jacket, open Oxford shirt as layer.
- 2 outfits stand without a layer — polo + chino + loafer, textured open shirt + trouser, or fine-stripe shirt + white denim.
- HOT climate: default to no-layer; layer only if style poles lean strongly structured.
- Trousers: Chinos, smart trousers, dark clean denim on 1 outfit acceptable.
- Footwear: Loafers, clean white/off-white leather sneakers, black minimal sneakers where colour loop allows, suede Chelsea boots.
- Formula 06 is a strong HOT climate smart casual formula.

---

### CONTEXT C — EVENING WEAR

**Definition:** Dinner dates, cocktail events, parties, rooftop evenings, weddings as a guest.

**Output Count:** 5 outfits.

**Primary formulas:** Formula 03, Formula 07, Formula 08, Formula 09, Formula 16.

**Layer frequency:** 4 out of 5 outfits have a layer. 1 outfit stands alone.

**Rules:**
- 4 outfits include a layer — vary across blazer, leather/faux leather jacket, harrington/coach jacket, bomber.
- 1 outfit stands without a layer only if the base top is elevated enough.
- Qualifying no-layer evening tops: silk-blend polo, fine textured knit, satin-finish camp collar shirt, richly coloured fine cotton crewneck, Formula 05 linen resort shirt.
- Formula 07 is the party formula — include in at least 1 Evening outfit if the client is fashion-forward.
- Formula 08 is the approachable party formula — include for classic-leaning clients.
- Formula 09 is the elevated casual formula.
- Formula 05 is the HOT climate evening formula.
- Dark tones, rich colours, high-contrast pairings appropriate.
- Footwear: Chelsea boots, leather loafers, chunky-sole dark brown loafer, white/off-white clean leather sneakers, black minimal leather sneakers where colour loop allows.
- Accessories: Up to 2 per outfit — watch + chain combination acceptable.

---

### CONTEXT D — RELAXED CASUAL

**Definition:** Weekends, coffee, travel, errands, social hangouts.

**Output Count:** 5 outfits.

**Primary formulas:** Formula 04 where climate allows, Formula 05, Formula 06, Formula 10 where allowed, Formula 11, Formula 12, Formula 14.

**Layer frequency:** 2 out of 5 outfits have a layer. 3 outfits stand alone.

**Layer rules:**
- 2 outfits include a layer — use only casual-appropriate options: open denim jacket, field jacket, harrington jacket, lightweight bomber, open cotton overshirt, corduroy overshirt in TEMPERATE only.
- Never use a blazer in Relaxed Casual.
- 3 outfits stand without a layer — Formula 05, 06, 11, 12, or 14 are complete on their own.
- HOT climate: maximum 1 layer across the 5 Relaxed Casual outfits.

**Bottom variety requirement:**
- Must vary across at least 2 different bottom types.
- Do not repeat the same bottom in more than 2 Relaxed Casual outfits.

**Footwear for Relaxed Casual:**
- White clean leather low-top sneakers.
- Off-white clean leather low-top sneakers.
- White/off-white leather chunky-sole sneakers.
- Black minimal leather sneakers.
- Black high-top canvas sneakers for Formula 12 only.
- Dark navy minimal canvas sneakers only in denim-based Relaxed Casual outfits.
- Tan or brown leather flat sandal for HOT climate only.
- White/off-white slip-on loafer for HOT climate Formula 06 only.
- Dark brown chunky-sole loafer for elevated casual.

**Streetwear Outfit Rule:**
If the client selected Off Duty or Urban Wear under Q21, one of the 5 Relaxed Casual outfits must follow Formula 08 or Formula 12 as the streetwear-adjacent look. No layer on the Formula 12 streetwear outfit.

**Indian-Context Rule:**
If the client signals Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, ethnic wardrobe needs, kurta, Nehru jacket, bandhgala, or festive styling — at least 2 outfits across Smart Casual, Evening Wear, or Relaxed Casual must include Indian-context usability.

Acceptable pieces: band-collar shirt, kurta, Nehru jacket, bandhgala, festive loafer, minimal mojaris.

Do not use sherwani unless the intake specifically points to wedding season.

---

## SECTION 11 — LAYERING VARIETY RULE

**Blazers maximum 6 times across all 20 outfits.**

**Overall layer count:**  
- TEMPERATE: 8–10 total layers.
- HOT: maximum 8 total layers.

### Approved Layering by Context

| Layer Type | Formal | Smart Casual | Evening | Relaxed Casual |
|---|---|---|---|---|
| Single-breasted slim blazer | Yes | Yes | Yes | No |
| Double-breasted slim blazer | Yes | No | Yes | No |
| Unstructured / sport coat blazer | No | Yes | Yes | No |
| Tailored suit jacket | Yes | No | Yes | No |
| Quarter-zip pullover | Yes | Yes | No | No |
| Harrington / coach snap-button jacket | No | Yes | Yes | Yes |
| Leather / faux leather zip jacket | No | No | Yes | Yes |
| Biker jacket | No | No | Yes | Yes |
| Bomber jacket | No | Yes | Yes | Yes |
| Denim jacket | No | No | No | Yes |
| Field jacket | No | Yes | No | Yes |
| Corduroy overshirt | No | Yes | No | Yes |
| Open Oxford shirt as layer | No | Yes | No | Yes |
| Cotton overshirt | No | Yes | No | Yes |

Never use a blazer in Relaxed Casual context under any circumstances.

---

## SECTION 12 — TROUSER, DENIM, AND BOTTOM RULES

These are hard rules. No exceptions.

1. No skinny jeans. Minimum cut is slim-straight.
2. No cropped trousers or jeans.
3. No ankle-cut anything. If the hem ends above the ankle bone, it is not permitted.
4. Wide-leg relaxed denim is a mainstream casual cut, not only a streetwear exception. It is appropriate across Formulas 08, 09, 11, 12, and HOT climate resort formulas. It requires height 5'6" minimum.

### Approved Cuts

| Cut | Contexts |
|---|---|
| Slim-straight clean denim, dark indigo | All contexts except strict formal |
| Flat-front slim tailored trousers | Formal, Smart Casual |
| Flat-front slim chino trousers | Smart Casual, Relaxed Casual |
| Slim-fit linen trousers | Smart Casual, Relaxed Casual, HOT climate |
| White or off-white linen wide-leg trousers | Relaxed Casual, Evening Casual, HOT climate |
| Relaxed straight-leg denim, mid or dark wash | Relaxed Casual, Evening Casual |
| Light-wash wide-leg relaxed denim | Relaxed Casual, 5'6" minimum |
| Off-white or grey wide-leg relaxed denim | Relaxed Casual, 5'6" minimum |
| Oversized wide-leg denim, dark wash | Relaxed Casual streetwear outfit only |
| Black heavy-duty cargo trousers | Relaxed Casual streetwear outfit only |

---

## SECTION 13 — FOOTWEAR RULES

### Complete Footwear Vocabulary

**Formal / Smart Casual:**
- Brown leather Oxford brogues, lace-up.
- Dark brown leather Derby shoes.
- Black leather Oxford shoes, lace-up.
- Black leather Chelsea boots, slim toe.
- Tan suede Chelsea boots, slim toe.
- Tan suede penny loafers.
- Dark brown suede loafers.
- Tan suede tassel loafers.
- Dark brown leather penny loafers.
- Black leather loafers.

**Casual / Evening Casual:**
- White clean leather low-top sneakers.
- Off-white / ivory leather low-top sneakers.
- White/off-white leather chunky-sole sneakers.
- Black minimal leather sneakers.
- Black high-top canvas sneakers for Formula 12 / streetwear only.
- Dark navy minimal canvas sneakers for Relaxed Casual denim outfits only.
- Dark brown chunky-sole leather loafer.
- White/off-white slip-on loafer for HOT climate Formula 06 only.
- Tan or brown leather flat sandal for HOT climate Formulas 05 and casual evening only.

### SNEAKER COLOUR RULE

Sneakers must stay minimal, neutral, and adult.

Approved sneaker colours:
- White clean leather sneakers.
- Off-white / ivory leather sneakers.
- Black minimal leather sneakers.
- Black high-top canvas sneakers — Formula 12 / streetwear only.
- Dark navy minimal canvas sneakers — Relaxed Casual only, if the outfit already uses navy or dark denim.

Prohibited sneaker colours:
- Brown sneakers.
- Tan sneakers.
- Grey sneakers.
- Red sneakers.
- Green sneakers.
- Multicolour sneakers.
- Loud logo sneakers.
- Chunky coloured running shoes.
- Any sneaker that looks like gym footwear.

**Default rule:** White or off-white sneakers are preferred for most casual outfits. Black sneakers are allowed only when they complete a dark tonal look. Navy canvas sneakers are allowed only in relaxed casual denim-based outfits.

### Footwear Hard Rules

- No sneakers in Formal under any circumstances.
- No leather Oxfords or Derby shoes in Relaxed Casual.
- Footwear must match the warmest tone in the outfit.
- In warm-family outfits, the shoe is usually dark brown or tan leather, never black unless a black outerwear colour loop requires it.
- Sandals are only permitted in HOT climate Relaxed Casual and Evening Casual — never in Formal or Smart Casual.

---

## SECTION 14 — ACCESSORIES RULES

**Accessories: max 2 in Evening, max 1 in all other contexts.**

Accessories must make the outfit look realistic, intentional, and age-appropriate. Never over-style the client. Most men should look better, sharper, and more polished — not like they are trying too hard.

### Undertone-Correct Metals

| Undertone | Preferred Metal |
|---|---|
| Warm | Gold, bronze, warm brown leather |
| Cool | Silver, steel, black leather |
| Neutral | Silver or gold, but do not mix metals in the same outfit |

---

### Watches

Approved watch vocabulary:
- Gold minimalist watch.
- Silver steel bracelet watch.
- Brown leather strap dress watch.
- Black leather strap dress watch.
- Minimal field watch with canvas or leather strap.
- Square-dial watch for fashion-forward clients only.

Rules:
- Formal outfits: dress watch only — leather strap or slim steel bracelet.
- Smart Casual: leather strap, steel bracelet, or minimal field watch.
- Evening: slim metal watch or dark leather strap watch.
- Relaxed Casual: field watch, simple steel watch, or no watch.
- Avoid oversized watches, loud chronographs, smartwatches in formal looks, and sporty rubber straps unless the outfit is explicitly casual.

---

### Belts

Approved belt vocabulary:
- Slim dark brown leather belt, 28–32mm.
- Slim black leather belt, 28–32mm.
- Tan leather belt for light warm outfits.
- Brown woven leather belt for resort or relaxed casual looks.
- Suede belt only when paired with suede loafers or suede Chelsea boots.

Rules:
- If the shirt is tucked or half-tucked, the belt must be specified.
- Belt colour should match the shoe family.
- Black belt with black shoes.
- Brown/tan belt with brown/tan shoes.
- Avoid large buckles, logo buckles, contrast stitching, and shiny synthetic belts.

---

### Sunglasses / Glasses

Approved sunglasses vocabulary:
- Aviator sunglasses — best for classic, angular, or mature styling.
- Wayfarer sunglasses — best for casual, smart casual, and rounder faces.
- Clubmaster sunglasses — best for classic, formal, and semi-formal looks.
- Rectangular black sunglasses — best for evening, streetwear, and sharp face framing.
- Thin metal-frame sunglasses — best for minimal, polished outfits.
- Tortoiseshell sunglasses — best for warm undertone and relaxed resort outfits.

Approved optical glasses vocabulary:
- Thin silver metal optical frames.
- Thin gold metal optical frames.
- Dark rectangular acetate optical frames.
- Tortoiseshell acetate optical frames.
- Clubmaster optical frames.

Rules:
- Sunglasses are casual / outdoor / travel / resort only.
- Do not use sunglasses in formal indoor office outfits.
- Rectangular frames sharpen round or soft faces.
- Aviators soften angular or long faces.
- Tortoiseshell works best with warm palettes.
- Black rectangular frames work best with cool, deep, evening, or urban looks.
- Avoid coloured lenses, mirrored lenses, oversized fashion frames, and sporty wraparound sunglasses.

---

### Jewellery

Approved jewellery vocabulary:
- Thin gold chain, 18–20 inch.
- Thin silver chain, 18–20 inch.
- Minimal signet ring.
- Thin metal bracelet.
- Leather bracelet for relaxed casual only.

Rules:
- One jewellery piece maximum unless the client is clearly expressive or fashion-forward.
- Chain is allowed only in Evening Wear or Relaxed Casual.
- Ring is allowed only in Evening Wear, Relaxed Casual, or fashion-forward Smart Casual.
- Bracelet must match the watch metal if worn together.
- Avoid thick chains, stacked bracelets, religious pendants unless the client already wears them, and loud rings.

---

### Bags

Approved bag vocabulary:
- Dark brown leather briefcase.
- Black leather briefcase.
- Slim leather laptop bag.
- Camel or dark brown leather tote.
- Black structured tote.
- Canvas tote for relaxed casual.
- Black crossbody bag for evening or streetwear.
- Leather weekender bag for travel outfits.

Rules:
- Formal: briefcase or slim leather laptop bag only.
- Smart Casual: leather tote, laptop bag, or clean structured tote.
- Evening: black crossbody or no bag.
- Relaxed Casual: canvas tote, crossbody, or weekender depending on context.
- Avoid backpacks in formal outfits unless the client explicitly needs commute practicality.

---

## SECTION 15 — CLOTHING ITEM VOCABULARY

### TOPS / BASE LAYER

- Slim-fit Oxford button-down shirt, spread collar / club collar / button-down collar.
- Slim-fit camp collar shirt, smart casual / casual, HOT climate appropriate.
- Washed denim shirt, relaxed-fit, point collar, worn open 2–3 buttons, sleeves rolled.
- Muted check / plaid overshirt shirt, relaxed-fit, point collar, sage+white, slate+white, beige+brown only, worn open-collar, untucked.
- Fine-stripe Oxford shirt, slim-fit, open collar, muted pink+white, blue+white, sage+white only.
- Vertical stripe shirt, slim-fit, open collar, Cuban/revere collar or regular, worn open-collar.
- Fitted crew-neck T-shirt, long sleeve and short sleeve.
- Fitted V-neck T-shirt.
- Polo shirt, slim-fit, long sleeve.
- Polo shirt, slim-fit, short sleeve, casual only.
- Fitted Henley shirt, full sleeve, two or three-button placket.
- Slim merino turtleneck, TEMPERATE only.
- Slim-fit crewneck knit sweater, TEMPERATE only.
- Fine merino or cotton quarter-zip pullover, camel, warm tan, dark olive only, TEMPERATE only.
- Band-collar shirt only for explicit Indian-context outfits.

**Never suggest:** Waistcoats. Turtlenecks for HOT climate clients. Band-collar shirts in western outfits.

---

### LAYERS / OUTERWEAR

- Single-breasted slim-fit blazer, wool or wool-blend in TEMPERATE / linen-cotton unlined in HOT.
- Unstructured blazer / sport coat, linen-cotton or cotton blend.
- Double-breasted slim blazer, fine wool, evening / formal only.
- Tailored suit jacket with matching trousers.
- Quarter-zip pullover, fine merino or cotton.
- Harrington jacket / coach snap-button jacket, cotton or cotton-twill.
- Leather zip jacket, slim-fit, black or dark brown, trucker/harrington collar profile.
- Biker jacket, leather or faux leather, black.
- Bomber jacket, satin or nylon finish.
- Field jacket, cotton or cotton-blend.
- Corduroy overshirt, worn open, TEMPERATE only.
- Cotton overshirt, worn open.
- Open Oxford shirt used as casual layer.
- Denim jacket, dark wash, clean, Relaxed Casual only.
- Nehru jacket only for explicit Indian-context outfits.
- Bandhgala only for explicit Indian-context outfits.

**Never suggest:** Waistcoats. Turtlenecks for HOT climate clients.

---

### BOTTOMS

- Flat-front slim-fit wool or wool-blend trousers.
- Flat-front slim-fit chino trousers, cotton twill.
- Flat-front slim-fit linen trousers, smart casual / casual, HOT climate.
- White or off-white linen wide-leg trousers, Relaxed Casual / Evening Casual, HOT climate.
- Slim-straight clean denim, dark indigo.
- Straight-leg clean denim, mid or dark wash.
- Relaxed straight-leg denim, mid or dark wash.
- Light-wash wide-leg relaxed denim, 5'6" minimum height.
- Off-white or grey wide-leg relaxed denim, 5'6" minimum height.
- Oversized wide-leg denim, dark wash, streetwear only.
- Black heavy-duty cargo trousers, streetwear only.
- Straight cotton trousers for Indian-context outfits.
- Kurta trousers or tapered ethnic trousers only for explicit Indian-context outfits.

---

## SECTION 16 — OUTFIT OUTPUT FORMAT

Use this exact format for every outfit:

```text
---
OUTFIT [NUMBER] — [CONTEXT NAME]

TOP: [Specific item — fit + fabric + colour + style detail]
LAYER: [Specific item — type + fit + fabric + colour] or "None"
BOTTOM: [Specific item — fit + fabric + colour + style detail]
FOOTWEAR: [Specific item — type + colour + material detail]
ACCESSORY: [1–2 items max, or "None"]

WHY IT WORKS FOR YOU: [1–2 sentences — reference at least one specific client variable using ICONIK language. Reference the formula logic internally but do not write the word "formula" in the output.]
SHOPPING TRANSLATION: [1 sentence naming the 1–2 key items to buy for this outfit]
ACCEPTABLE SUBSTITUTES: [1 sentence with practical replacements that preserve the same silhouette and colour logic]
DO NOT BUY: [1 sentence naming the common wrong version of this outfit]
---