# ICONIK Men's Blueprint — Outfit Recommendation Engine

**Version:** 3.1
**Scope:** Automated Blueprint report generation — outfit recommendation section only
**Output:** 16 outfits across 4 lifestyle contexts (4 per context)
**Geography:** Western clothing by default, with lightweight Indian-context support only when the intake explicitly signals Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, or ethnic wardrobe needs
**Logic:** Hybrid — rule-based constraints define what is correct, AI generates the outfit copy
**Visual Reference Standard:** All outfits must be executable at the quality level of the reference image library. If an outfit would not look at home in that library, do not generate it.

---

## HOW THIS SKILL WORKS

When generating outfit recommendations for an ICONIK Men's Blueprint, you will:

1. **Read all form inputs** — body shape, undertone, colour season, face shape, lifestyle contexts, style poles, fat storage zone, highlight zone, minimise zone, fit preference
2. **Apply the constraint rules** in this file to determine WHAT is appropriate for this client
3. **Generate 16 outfit descriptions** — 4 per context — using those constraints
4. **Format each outfit** as: Top + Layer + Bottom + Footwear + Accessory (max 2) + Why It Works + Shopping Translation + Acceptable Substitutes + Do Not Buy

Never generate an outfit that violates a constraint rule. The constraints are the science. The language is yours.

---

## THE VISUAL DNA — WHAT THESE OUTFITS MUST LOOK LIKE

Every outfit generated must feel like it belongs to one of these proven formulas. These are not suggestions — they are the reference standard for what ICONIK recommends.

### FORMULA 01 — THE POLO + CHINO FORMULA (Smart Casual, HOT Climate)
Dark polo (navy, forest green, deep burgundy) + light chino (beige, stone, off-white) + dark brown leather loafer + slim dark belt.
The depth contrast is the entire outfit. No layer needed. The polo must be fitted through the chest and shoulder. The chino must be flat-front and slim-straight. The belt and loafer must match in tone.

### FORMULA 02 — THE TUCKED SHIRT FORMULA (Formal / Smart Casual, LEAN FRAMES ONLY)
Slim-fit light Oxford shirt (cream, warm ivory, pale blue) tucked into dark flat-front trousers (chocolate brown, dark navy, charcoal). Dark loafer or Derby shoe. Sleeves rolled to mid-forearm. Aviator sunglasses optional.
**Hard restriction: Oval and Rectangle body shapes must NOT use the tucked shirt formula. Athletic and Slim frames only.**

### FORMULA 03 — THE BLAZER MIX FORMULA (Formal / Smart Casual / Evening)
Contrast blazer + contrast trouser + white or neutral open-collar shirt. The blazer and trouser must be from different colour families. The shoe must match the warmest tone in the outfit.
Examples: Tan blazer + navy trouser + white shirt + dark brown loafer. Navy blazer + grey flannel trouser + burgundy knit polo + brown loafer.

### FORMULA 04 — THE WARM THREE-TONE STACK (Relaxed Casual, TEMPERATE Climate)
Dark warm layer (dark brown corduroy overshirt, chocolate field jacket) + mid-tone warm tee (olive, warm sage, muted terracotta) + light warm bottom (beige, stone, tan chino) + dark brown leather boots or chunky loafer.
Each piece is one step lighter than the piece above it. Temperature never breaks. All three pieces must sit in the warm family.

### FORMULA 05 — THE LINEN RESORT FORMULA (Relaxed Casual / Evening Casual, HOT Climate)
Coloured linen shirt (forest green, deep teal, deep burgundy stripe, slate blue) worn open-collar + white or off-white linen wide-leg trousers + tan/brown leather flat sandal or white slip-on loafer.
Gold watch or bracelet is the only accessory. No layer. The shirt and trouser must have clear depth contrast.

### FORMULA 06 — THE TONAL SHIRT + WHITE BOTTOM (Relaxed Casual / Smart Casual, HOT Climate)
Stripe or solid coloured shirt (blue stripe, royal blue, deep forest green) + white or off-white chino or linen trouser + white slip-on loafer or brown suede tassel loafer.
Sunglasses. No belt visible or minimal belt. Works for both lean and oval frames when the shirt is worn untucked.

### FORMULA 07 — THE MONOCHROME + WHITE SHOE (Evening Casual / Party)
All-black base (black fitted long-sleeve tee + black straight trousers) + black leather jacket or biker jacket + white clean leather sneakers.
The white sneaker is the only contrast. The braid or woven belt adds subtle texture within the black. No other colour anywhere.

### FORMULA 08 — THE HARRINGTON / COACH JACKET FORMULA (Evening Casual / Party)
Zip or snap-button jacket (tan, camel, navy, dark olive) + white or neutral tee underneath (always visible) + wide-leg or relaxed straight trousers (blue-grey, stone, dark indigo) + white chunky leather sneakers.
The jacket and trouser must be from different temperature families. Gold watch is the only accessory.

### FORMULA 09 — THE LEATHER JACKET ELEVATED (Evening Casual / Party)
Dark brown or black leather/faux leather zip jacket + white open-collar shirt underneath (collar visible above jacket) + mid-wash straight-leg or relaxed denim + dark brown chunky-sole loafer.
Black crossbody or tote bag optional. The collar above the jacket is what elevates this above a streetwear look.

### FORMULA 10 — THE DARK CORDUROY / OVERSHIRT SOLO (Relaxed Casual, TEMPERATE Climate)
Dark corduroy overshirt (dark brown, near-black) worn open, no base tee visible at chest + grey wide-leg relaxed denim + white sneakers.
**Hard restriction: Athletic and Slim frames only. Not for Oval or Rectangle — no base layer means the midsection is unsupported.**

### FORMULA 11 — THE HENLEY + WIDE-LEG DENIM (Relaxed Casual)
White or warm ivory linen Henley (long sleeve) + light-wash or off-white wide-leg relaxed denim + black leather loafer or white low-top sneaker.
Thin chain necklace at the neck. Belt visible at waist (black or dark brown). The Henley must be untucked.

### FORMULA 12 — THE FITTED DARK TEE + WIDE-LEG DENIM (Relaxed Casual)
Fitted black or dark navy long-sleeve crewneck tee + light-wash relaxed wide-leg denim + white or black high-top canvas sneaker.
The contrast between the fitted dark top and the wide-leg light bottom is the entire outfit. Maximum depth contrast with minimum pieces. The tee must be fitted — if it is oversized, the outfit fails.

### FORMULA 13 — THE TEXTURED OPEN SHIRT + WIDE-LEG TROUSER (Smart Casual / Relaxed Casual)
A shirt with visual texture — washed denim shirt, chambray, or linen in a mid-tone (slate blue, washed indigo, light denim) — worn open 2–3 buttons, sleeves rolled to mid-forearm, untucked. Paired with wide-leg or relaxed straight trousers in a warm neutral (tan, stone, warm beige, khaki). Dark brown penny loafer or dark brown leather boot. Silver or gold watch. No layer needed.
**The depth contrast rule:** The shirt must be lighter or cooler than the trouser. The trouser is always the warm anchor. The loafer matches the trouser's warmth tone.
**This formula directly replaces any no-layer smart casual or formal outfit where the engine would otherwise reach for a band-collar shirt in a flat grey/teal/slate register with no depth contrast.**
*Ideal for:* Athletic, Slim, Rectangle. Average to tall height. Cool Medium or Neutral undertone.

### FORMULA 14 — THE CHECK / PLAID SHIRT + DARK DENIM (Relaxed Casual)
A muted check or plaid overshirt (sage green + white check, slate blue + white check, warm beige + brown check) — relaxed fit, worn open-collar, untucked. Paired with dark indigo wide-leg or relaxed straight denim. White clean leather sneakers. Silver watch.
**The check shirt IS the accent piece** — it carries all the visual interest a jacket or layer would otherwise provide. The dark denim is the unambiguous deep anchor. The check must always be muted and tonal — never bold primary colours. Never pair a check shirt with a light-wash trouser — the dark denim anchor is non-negotiable for this formula.
**This formula directly replaces any casual outfit where the engine would generate a bright or saturated single-colour tee under a jacket in competing mid-tones (e.g., mustard + olive, teal + grey).**
*Ideal for:* Athletic, Slim, Rectangle. Any undertone — the check tones are calibrated to the client's season. Tall-average to tall.

### FORMULA 15 — THE STRIPE SHIRT + WHITE DENIM + DARK LOAFER (Smart Casual / Relaxed Casual, HOT Climate)
Fine-stripe Oxford shirt (muted pink + white stripe, blue + white stripe, sage + white stripe) — slim-fit, open collar, sleeves rolled, untucked or half-tucked. White or off-white straight-leg or relaxed denim. Dark wine, dark burgundy, or dark brown leather penny loafer or loafer.
**Rule:** The loafer must be the darkest piece in the outfit — it does all the depth contrast work when both top and bottom are light. If the loafer is also light, the outfit has no anchor.
**Cool-undertone version of Formula 06.** Pink stripe and blue stripe are the correct accent tones for Cool Light and Cool Medium clients — not forest green or deep burgundy which read warm.
*Ideal for:* Athletic, Slim. Cool Light or Cool Medium undertone. Average to tall. HOT climate.

### FORMULA 16 — THE LEATHER JACKET + STRIPE SHIRT + CREAM TROUSER (Evening Casual / Party)
Black faux leather or leather zip jacket (trucker/harrington collar profile) + vertical stripe shirt worn underneath (cream + beige stripe, white + navy stripe) — collar visible above jacket. Cream or off-white wide-leg relaxed trousers. Black high-top canvas sneakers or black leather Chelsea boot.
**Rule:** When the jacket is black and the trouser is cream/light — the shoe must be black. The black shoe closes the colour loop: black jacket at top, black shoe at bottom, light trouser in between. This is the only formula where black sneakers pair with a cream trouser.
**This is a variant of Formula 09** — the stripe shirt replaces the plain white Oxford for clients who lean expressive on the style poles.
*Ideal for:* Athletic, Slim, Rectangle. Cool Deep or Neutral undertone. Tall-average to tall. Fashion-forward style pole.

### FORMULA 17 — THE QUARTER-ZIP + DARK TAILORED TROUSER (Formal / Smart Casual, TEMPERATE Climate)
Camel, warm tan, or dark olive fine merino or cotton quarter-zip — worn with white tee collar visible at the neck above the zip. Dark navy pinstripe or charcoal flat-front tailored trouser. Tan leather penny loafer or dark brown Derby shoe. Brown leather watch.
**The white tee collar peek is mandatory** — it adds a third clean element and prevents the quarter-zip from reading as casualwear when paired with tailored trousers. Without it, the look loses register.
**The shoe bridges the temperature:** camel quarter-zip (warm) + navy trouser (cool) = tan loafer that bridges both. Never use a black shoe here — it doubles down on the cool bottom and loses the warm bridge.
**This formula directly replaces any formal or smart casual blazer outfit** when the style poles lean relaxed or the client wants structure without stiffness.
*Ideal for:* Rectangle, Athletic, Slim. Warm Medium or Neutral undertone. Average to tall. TEMPERATE climate only — merino quarter-zip is not appropriate for HOT climate.

---

### BAND-COLLAR SHIRT — PROHIBITION RULE
**The band-collar shirt is removed from the active vocabulary entirely.**
It generates flat, tonally dead outfits (grey band-collar + charcoal chino, teal band-collar + charcoal trouser) with no depth contrast and no anchor-accent logic. Every context where the skill would previously reach for a band-collar shirt now has a better formula replacement:
- No-layer smart casual with depth contrast → Formula 13 (textured open shirt + wide-leg trouser)
- No-layer HOT climate shirt look → Formula 01, 05, 06, or 15
- Elevated casual evening with no blazer → Formula 13 or Formula 17
Do not generate a band-collar shirt in any outfit under any circumstances.

---

## SECTION 01 — FORM INPUT MAP

| Form Field | Blueprint Variable Name | Used For |
|---|---|---|
| Q5 (Height) | `HEIGHT` | Proportion rules, trouser break, layering |
| Q6 (Body Shape) | `BODY_SHAPE` | Silhouette constraints |
| Q7 (Fat Storage Zone) | `MINIMISE_ZONE` | Camouflage rules |
| Q8 (Highlight Zone) | `HIGHLIGHT_ZONE` | Enhancement rules |
| Q9 (Minimise Zone) | `MINIMISE_ZONE_2` | Secondary camouflage |
| Q10 (Fit Preference) | `FIT_PREF` | Fit language across all outfits |
| Q12 (Skin Tone) | `SKIN_TONE` | Colour depth calibration |
| Q13 (Vein Undertone) | `UNDERTONE` | Warm / Cool / Neutral determination |
| Q14 (White Test) | `WHITE_TEST` | Colour contrast level |
| Q15 (Hair Colour) | `HAIR` | Colour season input |
| Q16 (Eye Colour) | `EYES` | Colour season input |
| Q3 (Dressing Contexts) | `CONTEXTS` | Confirms which 4 contexts to populate |
| Q4 (Location) | `CLIMATE_ZONE` | HOT or TEMPERATE — drives fabric, layer frequency, item restrictions |
| Q11 (Wardrobe Composition) | `WARDROBE_BASE` | Starting point awareness |
| Q19 (Primary Style Goal) | `STYLE_GOAL` | Tone and direction of copy |
| Q21 (Style Tribes) | `STYLE_TRIBES` | Off Duty / Urban Wear streetwear signal |
| Q22–Q25 (Style Poles) | `STYLE_POLES` | Structured vs fluid, minimal vs expressive, etc. |
| Q27 (Anti-Preferences) | `ANTI_PREFS` | Hard exclusions — never include these |

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
| Cool | Fair / Light | **Cool Light** |
| Cool | Medium / Wheatish | **Cool Medium** |
| Cool | Deep / Dark | **Cool Deep** |
| Warm | Fair / Light | **Warm Light** |
| Warm | Medium / Golden | **Warm Medium** |
| Warm | Deep / Dark | **Warm Deep** |
| Neutral | Any | **Neutral** |

### Step 3 — Palette Per Season

**CRITICAL COLOUR VARIETY RULE:** Never repeat the same specific colour in more than 2 outfits across all 16. The goal is a complete varied wardrobe.

**BLACK JACKET RULE:** A black jacket, blazer, or outerwear piece is always permitted regardless of colour season. At least one other piece in that outfit must sit within the client's palette.

#### COOL LIGHT
- **Power Neutrals:** Soft white, light grey, navy, slate blue, pale chambray blue, silver-grey
- **Accent:** Icy lavender, dusty rose, cool mint, powder blue, soft teal
- **Avoid:** Orange, warm brown, mustard, rust, golden yellow

#### COOL MEDIUM
- **Power Neutrals:** Charcoal, navy, cool mid-grey, slate, cool taupe, steel blue
- **Accent:** Teal, muted burgundy, cool olive, dusty blue, slate green
- **Avoid:** Warm camel, terracotta, golden yellow, rust

#### COOL DEEP
- **Power Neutrals:** Black, deep navy, dark charcoal, pure white (high contrast), dark teal
- **Accent:** Deep burgundy, royal blue, emerald, deep plum, forest teal
- **Avoid:** Warm brown, mustard, orange, warm camel

#### WARM LIGHT
- **Power Neutrals:** Warm ivory, sand, camel, tan, warm beige, light khaki
- **Accent:** Peach, warm coral, warm gold, light terracotta, apricot
- **Avoid:** Heavy black (use dark navy or dark warm brown), icy cool tones, silver-grey

#### WARM MEDIUM
- **Power Neutrals:** Camel, warm tan, olive, khaki, warm brown, warm taupe, dark olive
- **Accent:** Muted rust, muted terracotta, burnt sienna, tobacco brown, copper
- **Avoid:** Cool grey, icy white, silver-grey, mustard, bright yellow-adjacent tones

#### WARM DEEP
- **Power Neutrals:** Dark brown, rich olive, dark khaki, deep warm tan, chocolate brown, dark warm navy
- **Accent:** Muted deep rust, burnt sienna, forest green, deep muted terracotta, amber (accessory only)
- **Avoid:** Cool grey, icy pastels, silver-grey, stark white (use warm ivory), mustard

#### NEUTRAL
- **Power Neutrals:** Navy, warm grey, stone, medium brown, off-white, taupe, slate
- **Accent:** Both warm and cool accents work — do not combine a very warm accent with a very cool base in the same outfit
- **Avoid:** Neon tones; extreme temperature pairings within a single outfit

---

## SECTION 02B — COLOUR HIERARCHY RULE

**Applies to every single outfit. No exceptions.**

### The Two Roles

| Role | Definition | What qualifies |
|---|---|---|
| **Anchor** | Dominant, grounding piece. Always a neutral or dark tone. | Dark brown, navy, charcoal, olive, khaki, dark indigo, black, warm grey, chocolate, dark tan, white/off-white (when used as the bottom in a light-dominant formula) |
| **Accent** | Secondary piece. ONE piece only. Adds colour personality. | Muted rust, terracotta, burnt sienna, forest green, muted burgundy, teal, royal blue, slate blue — always in a muted or earthy register |

### Hard Rules

1. **One anchor. One accent. Maximum.** Never two accent-coloured pieces in the same outfit.
2. **Neutrals can pair with neutrals** — only if one is clearly lighter and one is clearly darker.
3. **Accent pieces go on tops, not bottoms** in casual and smart casual. Exception: deep neutral blazer as layer allows muted accent trouser.
4. **One temperature family per outfit** — warm accent with warm or dark neutral anchor only.
5. **Depth contrast is mandatory** — every outfit must have at least one clearly light piece and one clearly dark piece.

### The White/Off-White Bottom Exception
In Formulas 05, 06, 11 — white or off-white linen trousers or chinos act as the **light anchor** (not an accent). The coloured top is the accent. This is a valid formula because the contrast is maximum (dark saturated top vs. bright light bottom). Apply only when the top is a mid-to-dark saturated piece (forest green, royal blue, burgundy).

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

| Top (Accent/Anchor) | Bottom (Anchor) | Layer | Why It Works |
|---|---|---|---|
| Fitted navy polo | Beige flat-front chino | None | Formula 01 — dark anchor top, light anchor bottom |
| Cream Oxford shirt (tucked) | Chocolate brown flat-front trouser | None | Formula 02 — light top, dark bottom, warm family |
| White open-collar shirt | Dark navy slim trouser | Tan blazer | Formula 03 — warm layer, neutral base, cool bottom |
| Olive fitted tee | Beige straight chino | Dark brown corduroy overshirt | Formula 04 — warm three-tone stack |
| Deep forest green linen shirt | White linen wide-leg trouser | None | Formula 05 — dark accent top, white anchor bottom |
| White fitted tee | Black straight trouser | Black leather jacket | Formula 07 — full monochrome, white shoe only break |
| White tee | Blue-grey wide-leg trouser | Tan harrington jacket | Formula 08 — warm layer, neutral base, cool bottom |

---

## SECTION 03 — SILHOUETTE RULES BY BODY SHAPE

### RECTANGLE (Shoulders, chest, waist similar width)
**Goal:** Create the illusion of a waist and shoulder-hip contrast.
- **Formula fit:** Formulas 01, 02, 03, 04, 08, 09 work well
- **Tops:** Structured blazers, fitted polos, layered looks
- **Bottoms:** Slim-fit trousers with a slight taper; avoid baggy or overly wide legs
- **Avoid:** Boxy oversized tops paired with straight wide-leg trousers — no contrast means no silhouette
- **Fit Language:** Structured, tailored, fitted through the shoulder

### ATHLETIC / V-SHAPE (Broad shoulders, narrow waist)
**Goal:** Balance upper and lower body; avoid further widening the shoulders.
- **Formula fit:** All formulas work. Formulas 05, 06, 10, 12 particularly strong.
- **Tops:** Fitted crewnecks, V-necks, slim-fit shirts; avoid epaulettes or padded shoulders
- **Bottoms:** Straight-leg or slim trousers — wide-leg also works here because it adds lower body volume
- **Avoid:** Padded shoulders, wide lapels, horizontal chest stripes
- **Fit Language:** Fitted, slim, no excess shoulder structure

### OVAL / ROUND (Fuller midsection, belly-dominant)
**Goal:** Draw the eye vertically; minimise midsection width.
- **Formula fit:** Formulas 01, 03, 06, 08 work. Formulas 02 and 10 are PROHIBITED.
- **Tops:** Straight-hem shirts worn untucked, open layering pieces (open blazer, open overshirt, open jacket), V-neck or open-collar necklines
- **Bottoms:** Flat-front slim-straight trousers; avoid pleated fronts; dark tones on trouser
- **HARD RULE — OVAL FORMULA RESTRICTIONS:**
  - NEVER tucked shirt (Formula 02 is prohibited)
  - NEVER overshirt worn skin-to-shirt with no base layer (Formula 10 is prohibited)
  - NEVER fitted tee with wide-leg denim (Formula 12 is prohibited — fitted tee reads tight over midsection)
  - ALWAYS use an open layer (blazer open, jacket open, overshirt open) to create a vertical channel
- **Fit Language:** Relaxed through the midsection, straight or slim through the leg

### SLIM / LEAN (Narrow frame throughout)
**Goal:** Add volume and visual mass.
- **Formula fit:** All formulas work. Formulas 04, 08, 11, 12 particularly strong.
- **Tops:** Structured blazers, layered looks, heavier fabrics, textured knits
- **Bottoms:** Straight-leg or slightly relaxed; avoid ultra-skinny
- **Fit Language:** Structured, layered, medium-relaxed

### TRIANGLE (Narrower shoulders, broader hips/thighs)
**Goal:** Widen the shoulder line; slim the lower half.
- **Formula fit:** Formulas 01, 02, 03, 04, 08 work well.
- **Tops:** Structured blazers with shoulder structure, lighter tones on top, horizontal details at chest
- **Bottoms:** Dark tones, slim-fit or tapered
- **Avoid:** Wide-leg or heavily pleated bottoms, light-coloured bottoms

---

## SECTION 04 — HEIGHT RULES

| HEIGHT | Proportion Rules |
|---|---|
| Under 5'6" (Short) | No cropped jackets. Use vertical elements (V-necks, vertical stripe, vertical texture). Trousers: no break, clean ankle hem. Monochromatic elongates. Wide-leg denim PROHIBITED — kills vertical line. Formulas 11 and 12 with wide-leg denim are NOT available for short clients. |
| 5'6"–5'9" (Average) | Most silhouettes work. Slight trouser break acceptable. Standard proportions apply. Wide-leg works if the top is fitted. |
| 5'9"–6'0" (Tall-average) | Full-break trousers work. Longer jacket lengths look intentional. All formulas available. |
| Above 6'0" (Tall) | All formulas available. Wide-leg and oversized silhouettes read as confident. Formula 08 oversized harrington + wide-leg is particularly strong here. |

---

## SECTION 04B — CLIMATE ZONE RULES

| Q4 Location | Climate Zone |
|---|---|
| India (any city) | **HOT** |
| UAE / Middle East | **HOT** |
| UK / Europe | **TEMPERATE** |
| Canada / USA | **TEMPERATE** |
| Other | **TEMPERATE** |

### HOT CLIMATE RULES

**Fabric restrictions:**
- No wool, flannel, heavy knits, merino in any base top
- Blazers: linen-cotton blend or lightweight unlined cotton only — no wool blazers
- Trousers: linen, cotton chino, or lightweight cotton blend
- No turtlenecks of any kind
- No heavy corduroy — lightweight cotton corduroy only if client is in a cooler microclimate
- Denim acceptable in casual; avoid raw or very thick denim

**Formula restrictions for HOT climate:**
- Formula 04 (warm three-tone stack with corduroy) — PROHIBITED. Use Formula 06 or 05 instead.
- Formula 10 (dark corduroy overshirt solo) — PROHIBITED.
- Formula 17 (quarter-zip + dark tailored trouser) — PROHIBITED. Quarter-zip merino is not appropriate for HOT climate.
- Formulas 05, 06, 01 are the primary casual formulas for HOT climate clients.

**Layer frequency for HOT climate:**
- Maximum 7 layers total across all 16 outfits
- A layer must be genuinely necessary — a single top + clean trouser + footwear is a complete outfit in hot climates
- When a layer is used: lightweight, worn open only, airflow-appropriate
- Preferred HOT climate layers: unlined linen-cotton blazer, lightweight cotton overshirt (open), lightweight nylon or cotton harrington, unstructured cotton sport coat

**No-layer tops that can carry a HOT climate Formal or Smart Casual outfit alone:**
- Fine cotton poplin Oxford, spread collar, slim-fit
- Linen-cotton blend shirt, slim-fit, open collar
- Long-sleeve fine cotton polo, slim-fit
- Camp collar short-sleeve shirt (smart casual / casual only)

### TEMPERATE CLIMATE RULES
Full vocabulary applies. No restrictions on wool, merino, flannel, corduroy. All formulas available.

---

## SECTION 05 — FAT STORAGE ZONE CAMOUFLAGE RULES

| Zone | Camouflage Strategy |
|---|---|
| Belly / Midsection | Untucked tops only. Open layers (never buttoned closed). Dark tones through the midsection. V-neck and open-collar necklines create vertical line. Formulas 01, 03, 06, 08 are the primary tools. |
| Chest / Upper body | V-neck and open-collar necklines. Avoid bulky knits and double-breasted jackets. |
| Hips / Thighs | Dark tones on bottoms. Slim-tapered cut. Structured tops with shoulder volume to redirect eye upward. |
| Arms / Back | Structured jacket sleeves add a clean line. Avoid very slim-fitted sleeves. |
| Evenly distributed | Monochromatic dressing. Vertical elements. Medium-relaxed fit throughout. |

---

## SECTION 06 — HIGHLIGHT ZONE ENHANCEMENT RULES

| Zone | Enhancement Strategy |
|---|---|
| Shoulders / Chest | Structured blazers, lapels, V-necklines, open-collar shirts |
| Arms (if muscular) | Fitted sleeve through the upper arm |
| Legs | Slim-tapered or straight trousers following the leg line |
| No specific area | Proportion-balanced silhouettes |

---

## SECTION 07 — FIT PREFERENCE CALIBRATION

| Fit Preference | How to Apply |
|---|---|
| Fitted — I want my shape to show | All pieces slim-fit. Only override if body shape rule prohibits (e.g., Oval must not have tucked-in fitted shirts). |
| Structured and tailored — nothing too tight | Slim-fit to tailored. Blazers and structured layers included frequently. |
| Relaxed / Oversized — comfort first | Medium-relaxed. Straight-leg bottoms. No baggy — relaxed and intentional. Wide-leg formulas (11, 12) are good here. |
| Open to fitted if I knew it would look good | Apply the correct formula for the body shape. Write the copy as if designed for his specific geometry. |

---

## SECTION 08 — STYLE POLES CALIBRATION

| Pole | LEFT lean | RIGHT lean |
|---|---|---|
| Structure: Structured ↔ Fluid | Formulas 01, 02, 03 dominate; blazers in 3+ outfits | Formulas 05, 06, 08, 11 dominate; more linen and relaxed pieces |
| Expression: Minimal ↔ Expressive | Neutral palette, accessories minimal | Allow accent colours, vertical stripes (Formula 05 burgundy stripe, Formula 06 blue stripe) |
| Tone: Classic ↔ Fashion-forward | Formulas 01, 02, 03; Oxford shirts, chinos, blazers | Formulas 08, 10, 12; wide-leg denim, harrington jackets, chunky sneakers |
| Register: Dressed-up ↔ Dressed-down | Elevate casual contexts with Formula 09 or 03 | Formal contexts still clean but add ease — Formula 03 open-collar white shirt |

---

## SECTION 09 — ANTI-PREFERENCE RULES

`ANTI_PREFS` is a hard block. If the client has listed a colour, silhouette, or style category — that item is excluded from all 16 outfits. If `ANTI_PREFS` = "No" or "Never thought about this" → no exclusions apply.

---

## SECTION 10 — THE 4 LIFESTYLE CONTEXTS

### CONTEXT A — FORMAL
**Definition:** Corporate office, client-facing meetings, board settings, job interviews, formal events.

**Primary formulas for this context:** Formula 01, Formula 02 (Athletic/Slim only), Formula 03.

**Layer frequency: 3 out of 4 outfits have a layer. 1 outfit stands alone.**

**Rules:**
- 3 outfits include a layer — minimum 2 blazers; the third can be a quarter-zip or structured overshirt
- 1 outfit stands without a layer — a fine cotton Oxford shirt in a strong palette colour with tailored trousers and leather shoes reads as complete. In HOT climates this is strongly preferred.
- Trousers: Flat-front slim or tailored. No jeans.
- Footwear: Leather Oxfords, Derby shoes, Chelsea boots (leather only). No sneakers.
- Colour: Power neutrals. Max 1 accent piece per outfit.
- No waistcoats.
- Outfit 4 of 4: Most elevated — full coordinated suit or strong colour-matched combination.

**HOT climate adjustments:**
- All blazers must be unlined linen-cotton or lightweight cotton
- Prefer no-layer outfits (2 of 4 no-layer is acceptable in HOT climate formal)
- Fine cotton poplin Oxford shirt alone with tailored linen trousers and leather shoes is a complete formal outfit

---

### CONTEXT B — SMART CASUAL
**Definition:** Business casual workplace, client lunches, startup office, dinner with colleagues.

**Primary formulas for this context:** Formula 01, Formula 02 (Athletic/Slim only), Formula 03, Formula 06.

**Layer frequency: 2 out of 4 outfits have a layer. 2 outfits stand alone.**

**Rules:**
- 2 outfits include a layer — vary across: unstructured blazer, structured overshirt, lightweight bomber, quarter-zip, harrington jacket (TEMPERATE), open Oxford shirt as layer
- 2 outfits stand without a layer — a well-fitted polo + clean chino + loafer (Formula 01) is a complete smart casual outfit
- HOT climate: default to no-layer; layer only if style poles lean strongly structured
- Trousers: Chinos, smart trousers, dark clean denim on 1 outfit acceptable
- Footwear: Loafers, clean white leather sneakers, suede Chelsea boots
- Formula 06 (stripe or solid coloured shirt + white trouser) is a strong HOT climate smart casual formula

---

### CONTEXT C — EVENING WEAR
**Definition:** Dinner dates, cocktail events, parties, rooftop evenings, weddings as a guest.

**Primary formulas for this context:** Formula 03, Formula 07, Formula 08, Formula 09.

**Layer frequency: 3 out of 4 outfits have a layer. 1 outfit stands alone.**

**Rules:**
- 3 outfits include a layer — vary across: blazer (single or double-breasted), leather/faux leather jacket, harrington/coach jacket, bomber
- 1 outfit stands without a layer — only if the base top is elevated enough. Qualifying tops: silk-blend polo, fine textured knit, satin-finish camp collar shirt, richly coloured fine cotton crewneck, Formula 05 linen resort shirt.
- Formula 07 (all-black + white sneaker) is the party formula — include this in at least 1 Evening outfit if the client is fashion-forward
- Formula 08 (harrington jacket formula) is the approachable party formula — include for classic-leaning clients
- Formula 09 (leather jacket over open shirt) is the elevated casual formula — strongest for Warm undertone clients
- Formula 05 (linen resort shirt + white linen trouser + sandal) is the HOT climate evening formula
- Dark tones, rich colours, high-contrast pairings appropriate
- Footwear: Chelsea boots, leather loafers, chunky-sole dark brown loafer, white clean leather sneakers (1 outfit only)
- Accessories: Up to 2 per outfit — watch + chain combination acceptable

---

### CONTEXT D — RELAXED CASUAL
**Definition:** Weekends, coffee, travel, errands, social hangouts.

**Primary formulas for this context:** Formula 04 (TEMPERATE), Formula 05 (HOT), Formula 06, Formula 10 (Athletic/Slim TEMPERATE), Formula 11, Formula 12.

**Layer frequency: 2 out of 4 outfits have a layer. 2 outfits stand alone.**

**Layer rules:**
- 2 outfits include a layer — use only casual-appropriate options: open denim jacket, field jacket, harrington jacket, lightweight bomber, open cotton overshirt, corduroy overshirt (TEMPERATE only). Never use a blazer in Relaxed Casual.
- 2 outfits stand without a layer — Formula 05, 06, 11, or 12 are complete on their own
- HOT climate: maximum 1 layer across the 4 Relaxed Casual outfits

**Bottom variety requirement:**
- Must vary across at least 2 different bottom types: e.g., white linen wide-leg, dark indigo straight-leg denim, light-wash wide-leg denim, beige chino
- Do not repeat the same bottom in more than 2 Relaxed Casual outfits

**Footwear for Relaxed Casual:**
- White clean leather low-top sneakers
- White leather chunky-sole sneakers
- Tan or brown leather flat sandal (HOT climate only — Formula 05)
- White slip-on loafer (HOT climate only — Formula 06)
- Dark brown chunky-sole loafer (for Formula 09 and elevated casual)
- Black high-top canvas sneaker (for Formula 12 only)

**STREETWEAR OUTFIT RULE:** If the client selected "Off Duty" or "Urban Wear" under Q21, one of the 4 Relaxed Casual outfits must follow Formula 08 or Formula 12 as the streetwear-adjacent look. No layer on the Formula 12 streetwear outfit.

**INDIAN-CONTEXT RULE:** If the client signals Indian occasions, wedding season, festivals, Indo Authority, or ethnic wardrobe needs — at least 2 outfits across Smart Casual, Evening Wear, or Relaxed Casual must include Indian-context usability. Acceptable pieces: band-collar shirt, kurta, Nehru jacket, bandh-gala, festive loafer. Do not use sherwani unless the intake specifically points to wedding season.

---

## SECTION 11 — LAYERING VARIETY RULE

**Blazers maximum 5 times across all 16 outfits.**

**Overall layer count: 10 maximum, 8 minimum (TEMPERATE). 7 maximum (HOT).**

**Approved Layering by Context:**

| Layer Type | Formal | Smart Casual | Evening | Relaxed Casual |
|---|---|---|---|---|
| Single-breasted slim blazer | ✓ | ✓ | ✓ | ✗ |
| Double-breasted slim blazer | ✓ | ✗ | ✓ | ✗ |
| Unstructured / sport coat blazer | ✗ | ✓ | ✓ | ✗ |
| Tailored suit jacket (full suit) | ✓ | ✗ | ✓ | ✗ |
| Quarter-zip pullover | ✓ | ✓ | ✗ | ✗ |
| Harrington / coach snap-button jacket | ✗ | ✓ | ✓ | ✓ |
| Leather / faux leather zip jacket | ✗ | ✗ | ✓ | ✓ |
| Biker jacket (leather / faux) | ✗ | ✗ | ✓ | ✓ |
| Bomber jacket (nylon / satin) | ✗ | ✓ | ✓ | ✓ |
| Denim jacket (dark wash, clean) | ✗ | ✗ | ✗ | ✓ |
| Field jacket (cotton) | ✗ | ✓ | ✗ | ✓ |
| Corduroy overshirt (TEMPERATE only) | ✗ | ✓ | ✗ | ✓ |
| Open Oxford shirt as layer | ✗ | ✓ | ✗ | ✓ |
| Cotton overshirt (open) | ✗ | ✓ | ✗ | ✓ |

**NEVER use a blazer in Relaxed Casual context under any circumstances.**

---

## SECTION 12 — TROUSER, DENIM, AND BOTTOM RULES

**These are hard rules. No exceptions.**

1. **No skinny jeans.** Minimum cut is slim-straight.
2. **No cropped trousers or jeans.** Trousers must reach the ankle.
3. **No ankle-cut anything.** If the hem ends above the ankle bone, it is not permitted.
4. **Wide-leg relaxed denim is a mainstream casual cut** — not only a streetwear exception. It is appropriate across Formulas 08, 09, 11, 12, and for HOT climate resort formulas. It requires height (5'6" minimum).

**Approved cuts:**

| Cut | Contexts |
|---|---|
| Slim-straight clean denim, dark indigo | All contexts |
| Flat-front slim tailored trousers | Formal, Smart Casual |
| Flat-front slim chino trousers | Smart Casual, Relaxed Casual |
| Slim-fit linen trousers | Smart Casual, Relaxed Casual (HOT climate) |
| White or off-white linen wide-leg trousers | Relaxed Casual, Evening Casual (HOT climate) |
| Relaxed straight-leg denim, mid or dark wash | Relaxed Casual, Evening Casual |
| Light-wash wide-leg relaxed denim | Relaxed Casual (Formulas 11, 12) — 5'6" minimum height |
| Off-white or grey wide-leg relaxed denim | Relaxed Casual (Formula 08) |
| Oversized wide-leg denim, dark wash | Relaxed Casual streetwear outfit only |
| Black heavy-duty cargo trousers, relaxed fit | Relaxed Casual streetwear outfit only |

---

## SECTION 13 — FOOTWEAR RULES

### Complete Footwear Vocabulary

**Formal / Smart Casual:**
- Brown leather Oxford brogues, lace-up
- Dark brown leather Derby shoes
- Black leather Oxford shoes, lace-up
- Black leather Chelsea boots, slim toe
- Tan suede Chelsea boots, slim toe
- Tan suede penny loafers
- Dark brown suede loafers
- Tan suede tassel loafers

**Casual / Evening Casual:**
- White clean leather low-top sneakers, white sole, minimal detail
- White leather chunky-sole sneakers, chunkier profile
- Black high-top canvas sneakers (Formula 12 / streetwear only)
- Dark brown chunky-sole leather loafer (Formulas 09, elevated casual)
- White slip-on loafer (HOT climate Formula 06 only)
- Tan or brown leather flat sandal (HOT climate Formulas 05, casual evening only)

### FOOTWEAR HARD RULES

- **Sneakers are white only** in all casual formulas, except the black high-top canvas sneaker which is permitted in Formula 12 only
- **No brown sneakers, no tan sneakers, no grey sneakers, no coloured sneakers**
- **No sneakers in Formal under any circumstances**
- **No leather Oxfords or Derby shoes in Relaxed Casual**
- **Footwear must match the warmest tone in the outfit** — in warm-family outfits (Formulas 01, 02, 04) the shoe is always dark brown or tan leather, never black
- **Sandals are only permitted in HOT climate Relaxed Casual and Evening Casual** — never in Formal or Smart Casual

---

## SECTION 14 — ACCESSORIES RULES

**Accessories: max 2 in Evening, max 1 in all other contexts.**

**Undertone-correct accessories:**
- Gold minimalist watch → warm undertone clients
- Silver minimalist watch → cool undertone clients
- Thin gold chain → warm undertone, casual / evening
- Thin silver chain → cool undertone, casual / evening
- Slim dark brown leather belt → warm undertone
- Slim black leather belt → cool undertone
- Aviator sunglasses → casual / outdoor only
- Camel or dark brown leather tote / briefcase → formal / smart casual
- Black crossbody or tote bag → evening casual

---

## SECTION 15 — CLOTHING ITEM VOCABULARY

### TOPS (Base Layer)

- Slim-fit Oxford button-down shirt (spread collar / club collar / button-down collar)
- Slim-fit camp collar shirt (smart casual / casual — HOT climate appropriate)
- Washed denim shirt, relaxed-fit, point collar — worn open 2–3 buttons, sleeves rolled (Formula 13)
- Muted check / plaid overshirt shirt, relaxed-fit, point collar — sage+white, slate+white, beige+brown only — worn open-collar, untucked (Formula 14)
- Fine-stripe Oxford shirt, slim-fit, open collar — muted pink+white, blue+white, sage+white only (Formula 15)
- Vertical stripe shirt — slim-fit, open collar (Cuban/revere collar or regular) — worn open-collar (Formulas 05, 16)
- Fitted crew-neck T-shirt (long sleeve and short sleeve)
- Fitted V-neck T-shirt
- Polo shirt, slim-fit, long sleeve
- Polo shirt, slim-fit, short sleeve (casual only)
- Fitted Henley shirt, full sleeve, two or three-button placket
- Slim merino turtleneck (TEMPERATE only)
- Slim-fit crewneck knit sweater (TEMPERATE only)
- Fine merino or cotton quarter-zip pullover — camel, warm tan, dark olive only (Formula 17 — TEMPERATE only)

**NEVER SUGGEST:** Band-collar shirts in any form, any colour, any context — permanently removed from vocabulary. Waistcoats. Turtlenecks for HOT climate clients.

### LAYERS / OUTERWEAR

- Single-breasted slim-fit blazer, wool or wool-blend (TEMPERATE) / linen-cotton unlined (HOT)
- Unstructured blazer / sport coat, linen-cotton or cotton blend
- Double-breasted slim blazer, fine wool (evening / formal only)
- Tailored suit jacket with matching trousers
- Quarter-zip pullover, fine merino or cotton
- Harrington jacket / coach snap-button jacket, cotton or cotton-twill (warm neutral colours: tan, camel, navy, olive, dark olive)
- Leather zip jacket, slim-fit (black or dark brown — NOT biker silhouette — trucker/harrington collar profile)
- Biker jacket, leather or faux leather (black — always permitted regardless of season)
- Bomber jacket, satin or nylon finish
- Field jacket, cotton or cotton-blend
- Corduroy overshirt, worn open (TEMPERATE only — dark brown, near-black)
- Cotton overshirt, worn open
- Open Oxford shirt used as casual layer
- Denim jacket, dark wash, clean (Relaxed Casual only)

**NEVER SUGGEST:** Waistcoats. Turtlenecks for HOT climate clients.

### BOTTOMS

- Flat-front slim-fit wool or wool-blend trousers
- Flat-front slim-fit chino trousers, cotton twill
- Flat-front slim-fit linen trousers (smart casual / casual — HOT climate)
- White or off-white linen wide-leg trousers (Relaxed Casual / Evening Casual — HOT climate)
- Slim-straight clean denim, dark indigo
- Straight-leg clean denim, mid or dark wash
- Relaxed straight-leg denim, mid or dark wash
- Light-wash wide-leg relaxed denim (5'6" minimum height)
- Off-white or grey wide-leg relaxed denim (5'6" minimum height)
- Oversized wide-leg denim, dark wash (streetwear only)
- Black heavy-duty cargo trousers (streetwear only)

---

## SECTION 16 — OUTFIT OUTPUT FORMAT

```
---
OUTFIT [NUMBER] — [CONTEXT NAME]

TOP: [Specific item — fit + fabric + colour + style detail]
LAYER: [Specific item — type + fit + fabric + colour] or "None"
BOTTOM: [Specific item — fit + fabric + colour + style detail]
FOOTWEAR: [Specific item — type + colour + material detail]
ACCESSORY: [1–2 items max, or "None"]

WHY IT WORKS FOR YOU: [1–2 sentences — reference at least one specific client variable using ICONIK language. Reference the formula number internally but do not write the word "formula" in the output.]
SHOPPING TRANSLATION: [1 sentence naming the 1–2 key items to buy for this outfit]
ACCEPTABLE SUBSTITUTES: [1 sentence with practical replacements that preserve the same silhouette and colour logic]
DO NOT BUY: [1 sentence naming the common wrong version of this outfit]
---
```

**"Why It Works For You" — Writing Rules:**
- Always reference at least one specific form input (body shape, undertone, fat storage zone, or style goal)
- Never use filler phrases like "this is a great look" or "you'll love this"
- Use ICONIK's language: geometric balance, chromatic harmony, vertical line, shoulder-to-hip contrast, undertone alignment, depth contrast
- 1–2 sentences maximum

---

## SECTION 17 — FABRIC VOCABULARY

Never use "fabric" or "material" generically. Always name the fabric.

**Formal:** Wool, wool-blend, ponte, cotton twill, fine cotton poplin, merino knit, fine flannel (TEMPERATE), linen-cotton blend (HOT)
**Smart Casual:** Cotton chino, brushed twill, fine jersey, linen-cotton blend, stretch cotton, mid-weight cotton, linen
**Evening:** Satin-finish cotton, fine wool, silk-blend, leather or faux leather, cotton twill
**Casual:** Washed cotton, chambray, brushed cotton, heavyweight jersey, linen, ripstop cotton, corduroy (TEMPERATE)

---

## SECTION 18 — FULL GENERATION PROMPT TEMPLATE

```
You are the ICONIK Men's Blueprint Outfit Engine v3.1. Generate 16 outfit recommendations for a male client. You are operating within strict constraint rules. Output must be precise, scientific in tone, and personal to this client.

CLIENT PROFILE:
- Height: [HEIGHT]
- Body Shape: [BODY_SHAPE]
- Fat Storage Zone: [MINIMISE_ZONE]
- Highlight Zone: [HIGHLIGHT_ZONE]
- Minimise Zone: [MINIMISE_ZONE_2]
- Fit Preference: [FIT_PREF]
- Skin Tone: [SKIN_TONE]
- Undertone: [UNDERTONE]
- Colour Season (derived): [COLOUR_SEASON]
- Hair Colour: [HAIR]
- Eye Colour: [EYES]
- Primary Style Goal: [STYLE_GOAL]
- Style Tribes Selected: [STYLE_TRIBES]
- Style Poles: Structure [1–5], Expression [1–5], Tone [1–5], Register [1–5]
- Anti-Preferences: [ANTI_PREFS]
- Wardrobe Base: [WARDROBE_BASE]
- Climate Zone: [CLIMATE_ZONE — HOT or TEMPERATE]

CONSTRAINT RULES (non-negotiable — apply all):

BODY SHAPE SILHOUETTE RULE:
[Paste relevant body shape rule from Section 03. Include HARD FORMULA RESTRICTIONS for Oval clients explicitly.]

HEIGHT RULE:
[Paste relevant height rule from Section 04. Flag wide-leg denim prohibition for under 5'6".]

CAMOUFLAGE RULE:
[Paste relevant fat storage zone rule from Section 05]

CLIMATE RULE:
[Paste relevant climate zone rule from Section 04B. For HOT: list prohibited formulas and fabric restrictions explicitly.]

COLOUR PALETTE:
[Paste the full colour season palette — Power Neutrals, Accent, Avoid]

COLOUR HIERARCHY (non-negotiable — every outfit):
- One anchor (neutral/dark tone) + one accent (muted colour) only
- White/off-white trouser = light anchor when paired with a dark saturated top (Formulas 05, 06)
- Accent on top. Anchor on bottom. Exception: deep neutral blazer as layer allows muted accent trouser.
- Depth contrast mandatory — one clearly light piece + one clearly dark piece in every outfit
- One temperature family per outfit
- NEVER mustard or high-saturation yellow-adjacent tones for any client

ANTI-PREFERENCES:
[List hard exclusions or state "None"]

FORMULA ASSIGNMENT — Use these reference formulas to build the 16 outfits:
[List the 4–6 formulas most appropriate for this client's body shape, climate, and style poles. Reference Section Visual DNA. Specify which formulas to use for which contexts.]

STREETWEAR:
[If STYLE_TRIBES includes Off Duty or Urban Wear: "Include one streetwear outfit in Relaxed Casual using Formula 08 or Formula 12." Otherwise: "Not applicable."]

OUTPUT REQUIREMENTS:
Generate exactly 16 outfits:
- Outfits 1–4: FORMAL
- Outfits 5–8: SMART CASUAL
- Outfits 9–12: EVENING WEAR
- Outfits 13–16: RELAXED CASUAL

Use the exact output format from Section 16.

RULES — APPLY ALL:
1. Never include any item from ANTI_PREFS
2. All colours from the client's Colour Season palette — never repeat the same colour more than twice across 16 outfits
3. Black outerwear always permitted — balance with a palette-correct piece in the same outfit
4. Every silhouette complies with body shape rules
5. Height proportion rules followed — no wide-leg denim for under 5'6"
6. Camouflage zone addressed in every outfit
7. NEVER skinny jeans. NEVER cropped or ankle-cut trousers.
8. Blazers maximum 5 times total across all 16 outfits
9. NEVER waistcoats
10. HOT climate: no turtlenecks, no wool, no corduroy, all blazers linen-cotton unlined, max 7 layers total
11. TEMPERATE climate: full vocabulary, max 10 layers total
12. Layer count by context: Formal 3/4 | Smart Casual 2/4 | Evening 3/4 | Relaxed Casual 2/4 (HOT: reduce each by 1)
13. Sneakers are white only, except black high-top canvas in Formula 12 only
14. No sneakers in Formal. No Oxford/Derby shoes in Relaxed Casual.
15. Vary top types within each context — no repeated top style more than twice in any context
16. Always name fabric specifically
17. Accessories: max 2 in Evening, max 1 in all other contexts
18. "Why It Works For You" must reference a specific client variable
19. No two outfits within the same context should feel similar
20. Never use a blazer in Relaxed Casual
21. Oval body shape: never tucked shirt, never overshirt worn skin-to-shirt, never fitted tee with wide-leg denim
22. Footwear must match the warmest tone in the outfit for warm-family formulas
23. Sandals only in HOT climate Relaxed Casual and Evening Casual
24. White/off-white linen trousers only in HOT climate
25. COLOUR HIERARCHY: every outfit has one anchor + one accent only. Depth contrast mandatory. Temperature family consistent per outfit. Never mustard.
26. The 17 reference formulas in Section Visual DNA are the creative guardrails — every outfit must be traceable back to one of them.
```

---

## SECTION 19 — QUALITY CHECKLIST

Before finalising output, verify every outfit:

- [ ] Colour within the client's Colour Season palette
- [ ] No tone repeated more than twice across 16 outfits
- [ ] Black outerwear balanced with a palette-correct piece
- [ ] Silhouette complies with body shape rule
- [ ] Height proportion rules followed — wide-leg denim prohibited under 5'6"
- [ ] Camouflage zone addressed
- [ ] No skinny jeans, no cropped trousers, no ankle-cut
- [ ] No waistcoats
- [ ] Blazer count is 5 or fewer total
- [ ] No blazers in Relaxed Casual
- [ ] Total layer count within range for climate
- [ ] Layer count per context matches targets
- [ ] HOT climate: no turtlenecks, no wool, no corduroy, all blazers lightweight unlined
- [ ] Sneakers are white only (or black high-top canvas for Formula 12 only)
- [ ] No sneakers in Formal. No Oxfords/Derbys in Relaxed Casual.
- [ ] Sandals only in HOT climate casual / evening
- [ ] White/off-white linen trousers only in HOT climate
- [ ] Band-collar shirts: zero instances in any of the 16 outfits
- [ ] No item from ANTI_PREFS
- [ ] Fabric named specifically in every line
- [ ] Fit language matches FIT_PREF with body shape overrides applied
- [ ] Accessory count within limit for this context
- [ ] "Why It Works For You" references a specific client variable
- [ ] Shopping Translation, Acceptable Substitutes, Do Not Buy present for every outfit
- [ ] No two outfits within the same context are too similar
- [ ] Oval client: zero tucked shirts, zero overshirt-skin formulas, zero fitted tee + wide-leg combos
- [ ] Streetwear outfit included if Off Duty / Urban Wear selected
- [ ] Indian-context support included if ethnic wardrobe signals present
- [ ] Every outfit is traceable to one of the 12 reference formulas in Section Visual DNA
- [ ] ⚡ COLOUR HIERARCHY: one anchor + one accent only per outfit
- [ ] ⚡ DEPTH CONTRAST: one clearly light piece + one clearly dark piece in every outfit
- [ ] ⚡ NO MUSTARD: zero mustard or high-saturation yellow-adjacent tones
- [ ] ⚡ TEMPERATURE MATCH: warm accent with warm or dark neutral anchor only
- [ ] ⚡ FOOTWEAR: dark brown/tan leather for warm-family formulas; white sneaker for dark tonal formula

---

## SECTION 20 — SAMPLE OUTPUT

**Input profile:** Oval body shape · Warm Medium season · 5'8" · Relaxed-fit preference · Belly fat storage zone · Classic tone · HOT climate (Mumbai)

```
OUTFIT 1 — FORMAL

TOP: Slim-fit fine cotton poplin Oxford shirt, warm ivory, spread collar — worn untucked, open one button at collar
LAYER: Unlined linen-cotton blazer, camel, single-breasted notch lapel — worn open
BOTTOM: Flat-front slim-fit cotton chino trousers, dark olive, slim-straight, ankle-clean hem
FOOTWEAR: Tan suede penny loafers
ACCESSORY: Gold minimalist watch

WHY IT WORKS FOR YOU: The open camel blazer creates a deliberate vertical channel through your midsection — your Oval Geometric Silhouette profile requires an open layer at all times to avoid visual width across the midsection. Warm ivory against dark olive gives mandatory depth contrast while keeping the entire outfit within your warm undertone family.
SHOPPING TRANSLATION: Invest in an unlined linen-cotton blazer in camel and a pair of dark olive flat-front slim chinos — these two pieces anchor three formal outfits.
ACCEPTABLE SUBSTITUTES: Replace the camel blazer with a dark olive unstructured sport coat for a more tonal but still depth-contrasted look.
DO NOT BUY: A fitted or single-button-close blazer — closing it across your midsection eliminates the vertical line entirely.
```

```
OUTFIT 5 — SMART CASUAL

TOP: Slim-fit fine cotton polo, deep burgundy, long sleeve — worn untucked
LAYER: None
BOTTOM: Flat-front slim-fit cotton chino, dark khaki, slim-straight, ankle-clean
FOOTWEAR: Dark brown suede loafers
ACCESSORY: Slim dark brown leather belt

WHY IT WORKS FOR YOU: Deep burgundy on top against dark khaki below — one accent, one warm neutral anchor — delivers depth contrast without relying on a layer. The untucked polo skims cleanly across your midsection, preserving the vertical line your Oval geometry requires without cinching at the waist.
SHOPPING TRANSLATION: A slim-fit long-sleeve polo in a muted accent colour from your Warm Medium palette is the single most versatile smart casual top you can own.
ACCEPTABLE SUBSTITUTES: Replace burgundy polo with a muted rust or tobacco brown polo — same formula, different accent from your warm palette.
DO NOT BUY: A short-sleeve polo — the full sleeve is what reads as smart casual rather than weekend wear.
```

```
OUTFIT 9 — EVENING WEAR

TOP: Fine cotton crewneck, warm ivory, fitted, long sleeve
LAYER: Black faux leather zip jacket, harrington collar, slim-fit — worn open
BOTTOM: Slim-straight clean denim, dark indigo, ankle-clean
FOOTWEAR: White clean leather low-top sneakers
ACCESSORY: Thin gold chain

WHY IT WORKS FOR YOU: Black outerwear is universally permitted and the open jacket preserves the vertical line your Oval silhouette needs. Warm ivory crewneck underneath is the single palette accent — clean chromatic contrast against the dark indigo denim below.
SHOPPING TRANSLATION: A black faux leather zip jacket and dark indigo slim-straight denim — both are the most rewearable evening pieces in this Blueprint.
ACCEPTABLE SUBSTITUTES: Replace the faux leather zip jacket with a dark navy harrington jacket for a softer take on the same formula.
DO NOT BUY: A cropped leather jacket — the hem must fall at or below the hip to avoid exposing the waistband.
```

```
OUTFIT 13 — RELAXED CASUAL

TOP: Deep forest green linen shirt, slim-fit, open collar, sleeves rolled to mid-forearm — worn untucked
LAYER: None
BOTTOM: White linen wide-leg trousers, relaxed straight, full length
FOOTWEAR: Tan leather flat sandal
ACCESSORY: Gold minimalist watch

WHY IT WORKS FOR YOU: Deep forest green against white creates maximum depth contrast and pulls from your Warm Medium palette's cool-neutral accent range. The open-collar linen shirt worn untucked keeps the midsection unobstructed — the wide-leg white trouser below adds clean volume that balances your Oval Geometric Silhouette without adding width through the midsection.
SHOPPING TRANSLATION: White linen wide-leg trousers and a deep coloured linen shirt are the two key pieces — this formula works in 3 colour variations across your Blueprint.
ACCEPTABLE SUBSTITUTES: Replace forest green with a deep slate blue or muted burgundy linen shirt — same formula, different accent.
DO NOT BUY: Narrow or tapered linen trousers — the wide straight leg is what creates the balanced silhouette here.
```

---

*ICONIK Men's Blueprint Outfit Recommendation Engine — SKILL.md v3.0*
*For use in automated Blueprint generation pipeline only.*
*All constraint logic is derived from ICONIK's proprietary three-pillar methodology:*
*Geometric Silhouette Profiling™ · Chromatic Harmony Mapping™ · Facial Architecture Analysis™*