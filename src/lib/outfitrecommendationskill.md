# ICONIK Men's Blueprint — Outfit Recommendation Engine

**Version:** 2.1  
**Scope:** Automated Blueprint report generation — outfit recommendation section only  
**Output:** 16 outfits across 4 lifestyle contexts (4 per context)  
**Geography:** Western clothing by default, with lightweight Indian-context support only when the intake explicitly signals Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, or ethnic wardrobe needs  
**Logic:** Hybrid — rule-based constraints define what is correct, AI generates the outfit copy

---

## HOW THIS SKILL WORKS

When generating outfit recommendations for an ICONIK Men's Blueprint, you will:

1. **Read all form inputs** — body shape, undertone, colour season, face shape, lifestyle contexts, style poles, fat storage zone, highlight zone, minimise zone, fit preference
2. **Apply the constraint rules** in this file to determine WHAT is appropriate for this client
3. **Generate 16 outfit descriptions** — 4 per context — using those constraints
4. **Format each outfit** as: Top + Layer + Bottom + Footwear + Accessory (max 2) + Why It Works + Shopping Translation + Acceptable Substitutes + Do Not Buy

Never generate an outfit that violates a constraint rule. The constraints are the science. The language is yours.

---

## SECTION 01 — FORM INPUT MAP

The following form fields directly drive outfit logic. Reference these throughout.

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
| Q4 (Location) | `CLIMATE_ZONE` | Determines climate tier — drives fabric weight, layer frequency, and warm-weather item restrictions |
| Q11 (Wardrobe Composition) | `WARDROBE_BASE` | Starting point awareness |
| Q19 (Primary Style Goal) | `STYLE_GOAL` | Tone and direction of copy |
| Q21 (Style Tribes) | `STYLE_TRIBES` | Off Duty / Urban Wear signals streetwear outfit |
| Q22–Q25 (Style Poles) | `STYLE_POLES` | Structured vs fluid, minimal vs expressive, etc. |
| Q27 (Anti-Preferences) | `ANTI_PREFS` | Hard exclusions — never include these |

---

## SECTION 02 — COLOUR SEASON DERIVATION

Derive the client's colour season from Q12 + Q13 + Q14 + Q15 + Q16 before generating any outfits. All colour recommendations flow from the season.

### Step 1 — Determine Undertone
| Q13 Vein Colour | Undertone |
|---|---|
| Blue / Purple | Cool |
| Green | Warm |
| Mix of both | Neutral |
| Can't tell | Default to Neutral; use Q12 skin tone depth to guide palette breadth |

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

**CRITICAL COLOUR VARIETY RULE:** The season defines the *family* your colours come from — cool, warm, or neutral. Draw from the full breadth of that family across all 16 outfits. Never repeat the same specific colour in more than 2 outfits. The goal is that a client's 16 outfits feel like a complete varied wardrobe, not 16 variations of the same 3 tones. Cool season clients draw from the full cool + neutral range. Warm season clients draw from the full warm + neutral range. Neutral season clients can borrow from both sides in moderation.

**BLACK JACKET RULE:** A black jacket, blazer, or outerwear piece is always permitted regardless of the client's colour season. Black is a universal layering neutral for outerwear. The rule: at least one other piece in that outfit (the top or the bottom) must sit within the client's palette. Do not build a full head-to-toe black outfit unless the client is Cool Deep.

#### COOL LIGHT
- **Power Neutrals:** Soft white, light grey, navy, slate blue, pale chambray blue, silver-grey
- **Accent:** Icy lavender, dusty rose, cool mint, powder blue, soft teal
- **Neutrals shared with all seasons:** Stone, mid-grey, off-white
- **Avoid:** Orange, warm brown, mustard, rust, golden yellow

#### COOL MEDIUM
- **Power Neutrals:** Charcoal, navy, cool mid-grey, slate, cool taupe, steel blue
- **Accent:** Teal, muted burgundy, cool olive, dusty blue, slate green
- **Neutrals shared with all seasons:** Stone, off-white, mid-grey
- **Avoid:** Warm camel, terracotta, golden yellow, rust

#### COOL DEEP
- **Power Neutrals:** Black, deep navy, dark charcoal, pure white (high contrast), dark teal
- **Accent:** Deep burgundy, royal blue, emerald, deep plum, forest teal
- **Neutrals shared with all seasons:** Dark stone, dark grey
- **Avoid:** Warm brown, mustard, orange, warm camel

#### WARM LIGHT
- **Power Neutrals:** Warm ivory, sand, camel, tan, warm beige, light khaki
- **Accent:** Peach, warm coral, warm gold, light terracotta, apricot
- **Neutrals shared with all seasons:** Stone, warm off-white, warm mid-grey
- **Avoid:** Heavy use of black (use deep navy or dark warm brown instead), icy cool tones, silver-grey

#### WARM MEDIUM
- **Power Neutrals:** Camel, warm tan, olive, khaki, warm brown, warm taupe, dark olive
- **Accent:** Rust, terracotta, warm mustard, burnt orange, tobacco brown, copper
- **Neutrals shared with all seasons:** Stone, warm grey, warm off-white, dark warm navy
- **Avoid:** Cool grey, icy white, silver-grey

#### WARM DEEP
- **Power Neutrals:** Dark brown, rich olive, dark khaki, deep warm tan, chocolate brown, dark warm navy
- **Accent:** Deep rust, burnt sienna, forest green, deep terracotta, amber
- **Neutrals shared with all seasons:** Dark stone, warm charcoal, dark warm grey
- **Avoid:** Cool grey, icy pastels, silver-grey, stark pure white (use warm ivory instead)

#### NEUTRAL
- **Power Neutrals:** Navy, warm grey, stone, medium brown, off-white, taupe, slate
- **Accent:** Both warm and cool accents work — do not combine a very warm accent with a very cool base in the same outfit
- **Avoid:** Neon tones; extreme temperature pairings within a single outfit

---

## SECTION 03 — SILHOUETTE RULES BY BODY SHAPE

Apply these rules to every outfit regardless of context. Silhouette rules are non-negotiable.

### RECTANGLE (Shoulders, chest, waist all similar width)
**Goal:** Create the illusion of a waist and shoulder-hip contrast.
- **Tops:** Structured blazers with subtle shoulder detail, fitted turtlenecks, layered looks (open shirt over fitted tee creates visual depth)
- **Bottoms:** Slim-fit trousers with a slight taper; avoid baggy or overly wide legs
- **Avoid:** Boxy oversized tops paired with straight wide-leg trousers — no contrast means no silhouette
- **Fit Language:** Structured, tailored, fitted through the shoulder

### ATHLETIC / V-SHAPE (Broad shoulders, narrow waist)
**Goal:** Balance the upper and lower body; avoid further widening the shoulders.
- **Tops:** Fitted crewnecks, V-necks, slim-fit shirts without structured shoulder padding; avoid epaulettes
- **Bottoms:** Straight-leg or slim trousers with some volume; avoid very skinny cuts that over-emphasise the V
- **Avoid:** Padded shoulders, wide lapels, horizontal chest stripes
- **Fit Language:** Fitted, slim, no excess shoulder structure

### OVAL / ROUND (Fuller midsection, belly-dominant)
**Goal:** Draw the eye vertically; minimise midsection width.
- **Tops:** Straight-hem shirts worn untucked (long enough to cover waistband), open layering pieces (open blazer, open overshirt), V-neck or open-collar necklines
- **Bottoms:** Flat-front slim-straight trousers; avoid pleated fronts; dark tones on trouser
- **Avoid:** Tucked-in shirts, horizontal stripes across the midsection, belts with visible large buckles, cropped jackets
- **Fit Language:** Relaxed through the midsection, straight or slim through the leg

### SLIM / LEAN (Narrow frame throughout)
**Goal:** Add volume and visual mass; make the frame look intentional, not skinny.
- **Tops:** Structured blazers, layered looks, heavier fabrics (wool, flannel, heavy knit), textured knits
- **Bottoms:** Straight-leg or slightly relaxed trousers; avoid ultra-skinny cuts which accentuate narrowness
- **Avoid:** Draping or very oversized silhouettes that make the frame disappear
- **Fit Language:** Structured, layered, medium-relaxed

### TRIANGLE (Narrower shoulders, broader hips/thighs)
**Goal:** Widen the shoulder line visually; slim the lower half.
- **Tops:** Structured blazers with subtle shoulder structure, horizontal details at chest/shoulders (chest pockets, wide lapels), lighter tones on top
- **Bottoms:** Dark tones, slim-fit or tapered; avoid wide-leg or heavily pleated bottoms
- **Avoid:** A-line or wide-cut trousers, light-coloured or patterned bottoms
- **Fit Language:** Structured on top, slim on the bottom

---

## SECTION 04 — HEIGHT RULES

| HEIGHT | Proportion Rules |
|---|---|
| Under 5'6" (Short) | Avoid cropped jackets. Use vertical elements (thin lapels, V-necks, vertical texture). Trousers: no break or very slight break — hem must reach the ankle clean, never above it. Avoid horizontal seams or contrast waistbands. Monochromatic head-to-toe elongates. |
| 5'6"–5'9" (Average) | Most silhouettes work. Slight trouser break acceptable. Standard proportions apply. |
| 5'9"–6'0" (Tall-average) | Full-break trousers work. Longer jacket lengths look intentional. Relaxed fits available. |
| Above 6'0" (Tall) | Avoid ultra-cropped items. Wide-leg and straight-leg trousers elongate further — use with intention. Relaxed and oversized silhouettes read as confident at this height. |

---

## SECTION 04B — CLIMATE ZONE RULES

Derive `CLIMATE_ZONE` from Q4 (Location) before generating any outfits. Climate zone controls fabric weight, layer frequency, and which tops are permitted. It does not override silhouette or colour rules.

### Climate Zone Classification

| Q4 Location | Climate Zone | Behaviour |
|---|---|---|
| India Tier 1 city | **HOT** | Warm-climate rules apply |
| India Tier 2/3 city | **HOT** | Warm-climate rules apply |
| UAE / Middle East | **HOT** | Warm-climate rules apply |
| UK / Europe | **TEMPERATE** | Full vocabulary available |
| Canada / USA | **TEMPERATE** | Full vocabulary available |
| Other | **TEMPERATE** | Default to full vocabulary; use judgment |

---

### HOT CLIMATE RULES (India, UAE)

These rules apply in addition to all other constraint rules when `CLIMATE_ZONE = HOT`.

**Fabric restrictions:**
- No wool, no flannel, no heavy knits, no merino in any base top
- Blazers and structured outerwear: use linen-cotton blend, lightweight cotton, or unlined cotton only — no wool blazers
- Trousers: linen, cotton chino, or lightweight cotton blend only — no heavy wool trousers
- Denim is acceptable in casual contexts; avoid very thick or raw denim

**Item restrictions:**
- No turtlenecks of any kind — remove entirely from vocabulary for this client
- No heavy crewneck knit sweaters
- No quarter-zips in wool or heavy merino (lightweight cotton quarter-zip remains acceptable)
- No thick bomber jackets or heavy field jackets — lightweight nylon or cotton-shell versions only

**Layer frequency adjustment for HOT climate:**
- Layers are less frequent overall — the AI must apply genuine judgment about whether a layer makes sense
- A well-chosen single top + trouser + footwear combination is a complete outfit in hot climates
- When a layer is used, it should be lightweight and worn open (never closed/buttoned) to allow airflow
- Preferred layers in hot climate: unlined linen-cotton blazer, lightweight cotton overshirt (open), lightweight nylon bomber, unstructured cotton sport coat

**Elevated no-layer top options for HOT climate (Formal and Smart Casual):**
- Fine cotton poplin Oxford shirt, spread or camp collar, slim-fit — worn alone with tailored trousers this is a complete formal outfit
- Linen-cotton blend shirt, slim-fit, open collar
- Breathable fine cotton polo, long sleeve, slim-fit
- Camp collar short-sleeve shirt in fine cotton (smart casual only — not formal)

---

### TEMPERATE CLIMATE RULES (UK, Europe, Canada, USA)

Full vocabulary applies. No restrictions on wool, merino, flannel, knits, or turtlenecks. Layer frequency follows the standard context rules in Section 10.

---

## SECTION 05 — FAT STORAGE ZONE CAMOUFLAGE RULES

Always consult `MINIMISE_ZONE` and `MINIMISE_ZONE_2` before generating each outfit.

| Zone | Camouflage Strategy |
|---|---|
| Belly / Midsection | Untucked tops, straight-hem layers, open blazers or overshirts (never buttoned closed), dark tones through the midsection, avoid fitted shirts tucked in |
| Chest and upper body | V-neck and open-collar necklines create vertical line; avoid bulky knits and double-breasted jackets |
| Hips and thighs | Dark tones on bottoms, slim-tapered cut, structured tops with shoulder volume to redirect eye upward |
| Arms / Back | Avoid very slim-fitted sleeves; structured jacket sleeves add a clean line; avoid sleeveless in formal contexts |
| Evenly distributed | Monochromatic dressing, vertical elements, medium-relaxed fit throughout |

---

## SECTION 06 — HIGHLIGHT ZONE ENHANCEMENT RULES

Always consult `HIGHLIGHT_ZONE` before generating each outfit.

| Zone | Enhancement Strategy |
|---|---|
| Shoulders / Chest | Structured blazers, lapels, V-necklines, open-collar shirts; avoid round or high crew necks if chest is the highlight |
| Arms (if muscular) | Fitted sleeve through the upper arm; avoid boxy or oversized sleeves |
| Legs | Slim-tapered or straight trousers that follow the leg line; clean footwear that draws the eye down |
| No specific area | Use proportion-balanced silhouettes; no single element dominates |

---

## SECTION 07 — FIT PREFERENCE CALIBRATION

Translate `FIT_PREF` into fit language across all 16 outfits.

| Fit Preference | How to Apply |
|---|---|
| Fitted — I want my shape to show | All pieces: slim-fit. Tops: fitted through shoulder and chest. Bottoms: slim-straight or tapered. Only override if body shape rule prohibits it (e.g., Oval should not have tucked-in fitted shirts). |
| Structured and tailored — nothing too tight | Slim-fit to tailored. Clean lines. No excess fabric. Blazers and structured layers included frequently. |
| Relaxed / Oversized — comfort first | Medium-relaxed fits. Straight-leg bottoms. Overshirts, unstructured blazers, relaxed knits. Do not go into baggy — relaxed and intentional. |
| Open to fitted if I knew it would look good | Apply the correct fit for each body shape rule. Write the outfit as if it is designed for his specific geometry — make the logic explicit in the copy. |

---

## SECTION 08 — STYLE POLES CALIBRATION

Read Q22–Q25 (Style Poles) and use them to calibrate tone across all outfits.

| Pole | If Score Leans LEFT | If Score Leans RIGHT |
|---|---|---|
| Structure: Structured ↔ Fluid | Structured outerwear in 3+ outfits; blazers, tailored pieces | More relaxed fabrics — linen, jersey, unstructured layers, bombers, Harrington jackets |
| Expression: Minimal ↔ Expressive | Neutral palette, accessories limited to one watch or belt, no pattern | Allow accent colours, subtle prints (micro-check, fine texture), one statement piece |
| Tone: Classic ↔ Fashion-forward | Classic menswear — Oxford shirts, navy blazers, chinos | Contemporary silhouettes — wide-leg, oversized, cargo trousers, current colour pairings |
| Register: Dressed-up is comfort ↔ Dressed-down is comfort | Elevate casual contexts — smart casual reads as near-formal | Formal contexts still clean but not stiff; add ease where possible |

---

## SECTION 09 — ANTI-PREFERENCE RULES

**`ANTI_PREFS` is a hard block.** If the client has listed:
- A colour → that colour is excluded from all 16 outfits
- A silhouette or cut → that cut is excluded from all 16 outfits
- A style category → all items from that category are excluded

If `ANTI_PREFS` = "No" or "Never thought about this" → no exclusions apply.

Always check this before finalising any outfit.

---

## SECTION 10 — THE 4 LIFESTYLE CONTEXTS

Generate exactly 4 outfits per context. 16 outfits total.

---

### CONTEXT A — FORMAL
**Definition:** Corporate office, client-facing meetings, board settings, job interviews, formal events.

**Layer frequency: 3 out of 4 outfits have a layer. 1 outfit stands alone.**

**Layering judgment rules:**
- 3 outfits must include a layer — vary the type: minimum 2 blazers or suit jackets; the third can be a quarter-zip over a formal shirt or a structured overshirt
- 1 outfit stands without a layer — this must be a strong top + tailored trouser combination that reads as complete and polished on its own. A fine cotton poplin shirt in a bold palette colour with tailored trousers and leather shoes is sufficient. In HOT climates, no-layer outfits are encouraged here.
- Quarter-zip pullovers are acceptable over formal shirts as a modern office layer — pair only with flat-front tailored trousers
- In HOT climates: if a blazer is used, it must be unlined linen-cotton or lightweight cotton — never wool
- Trousers: Flat-front slim or tailored fit only; absolutely no jeans
- Footwear: Leather Oxfords, Derby shoes, Chelsea boots (leather only)
- Colour: Power neutrals from the client's season; max 1 accent piece per outfit
- No sneakers, no denim, no visible logo, no waistcoats
- Apply body shape silhouette rules strictly

**Outfit 4 of 4 rule:** The fourth formal outfit is the most elevated — a full coordinated suit or a strong colour-matched combination using an accent from the client's palette.

---

### CONTEXT B — SMART CASUAL
**Definition:** Business casual workplace, client lunches, startup office, dinner with colleagues.

**Layer frequency: 2 out of 4 outfits have a layer. 2 outfits stand alone.**

**Layering judgment rules:**
- 2 outfits include a layer — vary across: unstructured blazer, tweed sport coat (TEMPERATE only), structured overshirt, lightweight bomber, quarter-zip, open Oxford shirt worn as a layer
- 2 outfits stand without a layer — a well-fitted polo, a clean Oxford shirt, or a fine cotton crewneck with smart chinos and loafers is a complete smart casual outfit on its own
- In HOT climates: no-layer outfits are the default here; a layer is only added if the style poles lean strongly structured
- No waistcoats
- Trousers: Chinos, smart trousers, dark clean denim on 1–2 outfits acceptable
- Footwear: Loafers, clean white leather sneakers, suede Chelsea boots
- Colour: Expand from power neutrals into accent colours here
- Apply body shape and undertone rules

---

### CONTEXT C — EVENING WEAR
**Definition:** Dinner dates, cocktail events, parties, rooftop evenings, weddings as a guest.

**Layer frequency: 3 out of 4 outfits have a layer. 1 outfit stands alone.**

**Layering judgment rules:**
- 3 outfits include a layer — vary across: double-breasted blazer, single-breasted blazer in an accent colour, tweed or wool textured blazer (TEMPERATE only), biker jacket, bomber jacket in a rich tone
- 1 outfit stands without a layer — only if the base top is elevated enough to carry the look alone. Qualifying tops: silk-blend polo, fine textured knit, satin-finish camp collar shirt, richly coloured fine cotton crewneck. A plain tee or basic Oxford shirt does NOT qualify as a no-layer evening top.
- Black outerwear (biker jacket, black blazer) always permitted regardless of season — balance with a palette-correct top or trouser
- Dark tones, rich colours, or high-contrast pairings appropriate here
- Footwear: Chelsea boots, leather loafers, clean white leather sneakers for one outfit only
- Accessories: Up to 2 per outfit — watch + chain combination acceptable here
- No waistcoats
- Apply body shape silhouette rules; colour season accent palette appropriate for 2+ outfits

---

### CONTEXT D — RELAXED CASUAL
**Definition:** Weekends, coffee, travel, running errands, social hangouts.

**Layer frequency: 2 out of 4 outfits have a layer. 2 outfits stand alone.**

**Layering judgment rules:**
- 2 outfits include a layer — use only lightweight, casual-appropriate options: open denim jacket, field jacket, Harrington jacket, lightweight bomber, open cotton overshirt. Never use a blazer in Relaxed Casual.
- 2 outfits stand alone — a well-chosen tee, Henley, or polo with clean denim and good footwear is a complete casual outfit. No layer needed.
- In HOT climates: maximum 1 layer across the 4 Relaxed Casual outfits; the other 3 stand alone
- Vary tops across: fitted crew-neck tee, V-neck tee, Henley (full sleeve), long-sleeve polo, casual overshirt worn open — do not repeat the same top type across multiple outfits
- Bottoms: Clean denim (slim-straight or straight-leg), chinos, casual trousers; no active or gym wear
- Footwear: White leather low-top sneakers or white leather chunky-sole sneakers only
- Accessories: Minimal — one item max (watch or chain)
- Apply body shape camouflage rules even in casual context
- Colour palette: Accent colours appropriate here; more relaxed combinations acceptable

**STREETWEAR OUTFIT RULE:** If the client selected "Off Duty" or "Urban Wear" under Q21 (Style Tribes), one of the 4 Relaxed Casual outfits must be a streetwear-adjacent look. Use: heavyweight graphic-free oversized tee or boxy crewneck + either oversized wide-leg denim (dark wash) OR black heavy-duty cargo trousers (relaxed fit) + white leather chunky-sole sneakers. Keep colours within the client's season palette. This replaces one of the standard 4 Relaxed Casual outfits. No layer on the streetwear outfit.

**INDIAN-CONTEXT RULE:** If the client selected Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, or ethnic wardrobe signals, at least 2 outfits across Smart Casual, Evening Wear, or Relaxed Casual must include Indian-context usability. Keep the outfit Western-first unless the signal is strong. Acceptable pieces: band-collar shirt, kurta, Nehru jacket, bandh-gala, festive loafer, or leather sandal in HOT climate. Do not use sherwani unless the intake specifically points to wedding season or formal ethnic needs.

---

## SECTION 11 — LAYERING VARIETY RULE

**Blazers maximum 5 times across all 16 outfits.** Track the count as you generate. Once you hit 5 blazers total, all remaining outfits requiring a layer must use alternatives.

**Overall layer count target: 10 layers maximum, 8 minimum across all 16 outfits.** This means roughly 6 of 16 outfits stand without any layer. Layers must feel like a deliberate style choice, not a default fill.

**HOT CLIMATE adjustment (India, UAE):** Reduce total layers to 7 maximum across all 16 outfits. Layers in hot climates must always be lightweight and worn open.

**Approved Layering by Context:**

| Layer Type | Formal | Smart Casual | Evening | Relaxed Casual |
|---|---|---|---|---|
| Single-breasted slim blazer | ✓ | ✓ | ✓ | ✗ |
| Double-breasted slim blazer | ✓ | ✗ | ✓ | ✗ |
| Unstructured / sport coat blazer | ✗ | ✓ | ✓ | ✗ |
| Tweed / wool textured blazer (TEMPERATE only) | ✓ | ✓ | ✓ | ✗ |
| Tailored suit jacket (full suit) | ✓ | ✗ | ✓ | ✗ |
| Quarter-zip pullover | ✓ | ✓ | ✗ | ✗ |
| Bomber jacket | ✗ | ✓ | ✓ | ✓ |
| Biker jacket (leather / faux) | ✗ | ✗ | ✓ | ✓ |
| Denim jacket (dark wash, clean) | ✗ | ✗ | ✗ | ✓ |
| Field jacket | ✗ | ✓ | ✗ | ✓ |
| Harrington jacket | ✗ | ✓ | ✗ | ✓ |
| Open Oxford shirt as layer | ✗ | ✓ | ✗ | ✓ |
| Cotton overshirt (open) | ✗ | ✓ | ✗ | ✓ |

**Never use a blazer in Relaxed Casual context under any circumstances.**

---

## SECTION 12 — TROUSER AND DENIM RULES

**These are hard rules. No exceptions.**

1. **No skinny jeans.** Never suggest denim or trousers that taper severely below the knee. Minimum cut is slim-straight — fitted through the thigh, straight from knee to ankle.
2. **No cropped trousers or jeans.** No ankle-cut, no 7/8 length, no intentionally cropped hems. Trousers must reach the ankle. The only adjustment for short clients is a clean no-break hem that still reaches the ankle — not above it.
3. **No ankle-cut anything.** If the hem ends mid-calf or above the ankle bone, it is not permitted.

**Approved trouser and denim cuts:**

| Cut | Contexts |
|---|---|
| Slim-straight (fitted thigh, straight leg, ankle-clean) | All contexts |
| Straight-leg (relaxed thigh and leg, slight break acceptable) | Smart Casual, Evening, Relaxed Casual |
| Flat-front slim tailored trousers | Formal, Smart Casual |
| Flat-front slim chino trousers | Smart Casual, Relaxed Casual |
| Slim-fit linen trousers | Smart Casual, Relaxed Casual |
| Relaxed straight-leg denim | Relaxed Casual only |
| Oversized wide-leg denim, dark wash | Relaxed Casual streetwear outfit only |
| Black heavy-duty cargo trousers, relaxed fit | Relaxed Casual streetwear outfit only |

---

## SECTION 13 — OUTFIT OUTPUT FORMAT

Use this exact structure for all 16 outfits. No deviation.

```
---
OUTFIT [NUMBER] — [CONTEXT NAME]

TOP: [Specific item — fit + fabric + colour + style detail]
LAYER: [Specific item — type + fit + fabric + colour] or "None"
BOTTOM: [Specific item — fit + fabric + colour + style detail]
FOOTWEAR: [Specific item — type + colour + material detail]
ACCESSORY: [1–2 items max, or "None"]

WHY IT WORKS FOR YOU: [1–2 sentences connecting this outfit to this client's specific body shape, undertone, or style goal using ICONIK language]
SHOPPING TRANSLATION: [1 sentence naming the 1–2 key items to buy for this outfit]
ACCEPTABLE SUBSTITUTES: [1 sentence with practical replacements that preserve the same silhouette and colour logic]
DO NOT BUY: [1 sentence naming the common wrong version of this outfit]
---
```

**Note:** TOP = base layer worn closest to the body. LAYER = outerwear or second layer. If no layer, write "None."

**"Why It Works For You" — Writing Rules:**
- Always reference at least one specific form input (body shape, undertone, fat storage zone, or style goal)
- Never use filler phrases like "this is a great look" or "you'll love this"
- Use ICONIK's language: geometric balance, chromatic harmony, vertical line, shoulder-to-hip contrast, undertone alignment
- 1–2 sentences maximum — precise, not verbose

---

## SECTION 14 — FABRIC VOCABULARY (Always Specify)

Never use "fabric" or "material" generically. Always name the fabric.

**Formal:** Wool, wool-blend, ponte, cotton twill, fine cotton poplin, merino knit, fine flannel  
**Smart Casual:** Cotton chino, brushed twill, fine jersey, linen-cotton blend, stretch cotton, mid-weight cotton  
**Evening:** Satin-finish cotton, fine wool, silk-blend, leather or faux leather (biker jacket), velvet (accent piece only)  
**Casual:** Washed cotton, chambray, brushed cotton, heavyweight jersey, linen, ripstop cotton (cargo trousers)  

---

## SECTION 15 — CLOTHING ITEM VOCABULARY

Use only the items listed here. Do not invent item types outside this list.

### TOPS (Base Layer — worn closest to the body)
- Slim-fit Oxford button-down shirt (spread collar / club collar / button-down collar)
- Fitted crew-neck T-shirt
- Fitted V-neck T-shirt
- Polo shirt, slim-fit, long sleeve (more versatile — works across smart casual and casual)
- Polo shirt, slim-fit, short sleeve (casual contexts only)
- Slim merino turtleneck / ribbed turtleneck
- Slim-fit crewneck knit sweater
- Fine merino long-sleeve crewneck (smart casual / formal base layer — pairs well under quarter-zip)
- Fitted Henley shirt, full sleeve, two or three-button placket

### LAYERS / OUTERWEAR
- Single-breasted slim-fit blazer, wool or wool-blend
- Tweed or wool textured blazer, slim or regular fit
- Unstructured blazer / sport coat, linen-cotton or cotton blend
- Double-breasted slim blazer, fine wool (evening / formal only)
- Tailored suit jacket with matching trousers (full suit)
- Quarter-zip pullover, fine merino or cotton (over formal shirt for office; over tee for smart casual)
- Bomber jacket, satin, nylon, or suede finish
- Biker jacket, leather or faux leather (black always permitted regardless of season)
- Field jacket, olive, navy, or tan, cotton or cotton-blend
- Harrington jacket, waxed cotton or lightweight cotton
- Cotton overshirt, worn open as casual layer
- Structured overshirt, worn open as smart casual layer
- Denim jacket, dark wash, clean (Relaxed Casual only)

**NEVER SUGGEST:** Waistcoats in any form. Turtlenecks for HOT climate clients (India, UAE).

### BOTTOMS
- Flat-front slim-fit wool or wool-blend trousers
- Flat-front slim-fit chino trousers, cotton twill
- Slim-fit tailored suit trousers matching jacket
- Slim-fit linen trousers (smart casual / casual — summer appropriate)
- Straight-leg clean denim, dark indigo or mid-wash (no distressing in formal or smart casual)
- Slim-straight clean denim (no severe taper below knee — straight from knee to ankle)
- Relaxed straight-leg denim, mid or dark wash (casual only)
- Oversized wide-leg denim, dark wash (Relaxed Casual streetwear outfit only — Off Duty / Urban Wear clients)
- Black heavy-duty cargo trousers, relaxed fit with functional pockets (Relaxed Casual streetwear outfit only)

### FOOTWEAR

**Formal / Smart Casual:**
- Brown leather Oxford brogues, lace-up
- Dark brown leather Derby shoes
- Black leather Oxford shoes, lace-up
- Black leather Chelsea boots, slim toe
- Tan suede Chelsea boots, slim toe
- Tan suede penny loafers
- Dark brown suede loafers

**Casual:**
- White clean leather low-top sneakers, white sole, minimal detail
- White leather chunky-sole sneakers, chunkier profile (more casual / streetwear appropriate)

**FOOTWEAR COLOUR RULES — HARD:**
- Sneakers are white only. No brown sneakers, no tan sneakers, no grey sneakers, no coloured sneakers. Most people do not own non-white casual sneakers — do not suggest something they cannot easily find or own.
- Brown is a shoe colour, not a sneaker colour. Brown applies only to leather Oxfords, Derby shoes, Chelsea boots, and suede loafers.
- No sneakers in Formal context under any circumstances.
- No leather Oxfords or Derby shoes in Relaxed Casual context.

### ACCESSORIES
- Silver minimalist watch (cool undertone clients)
- Gold minimalist watch (warm undertone clients)
- Thin gold chain, simple (casual / evening — warm undertone clients)
- Thin silver chain, simple (casual / evening — cool undertone clients)
- Slim black leather belt
- Slim dark brown leather belt (warm undertone clients)
- Camel or dark brown leather slim tote / briefcase (formal / smart casual)
- Sunglasses, aviator or thin rectangular frame (casual / outdoor only)

---

## SECTION 16 — FULL GENERATION PROMPT TEMPLATE

When this skill is triggered, use the following as your system prompt. Populate all `[VARIABLES]` from the client's form before sending.

---

```
You are the ICONIK Men's Blueprint Outfit Engine. Generate 16 outfit recommendations for a male client based on his ICONIK Blueprint profile. You are operating within strict constraint rules. Output must be precise, scientific in tone, and personal to this specific client.

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
- Climate Zone: [CLIMATE_ZONE — HOT or TEMPERATE, derived from Q4 Location]

CONSTRAINT RULES (non-negotiable — apply all):

SILHOUETTE:
[Paste the relevant body shape rule from Section 03]

HEIGHT:
[Paste the relevant height rule from Section 04]

CAMOUFLAGE:
[Paste the relevant fat storage zone rule from Section 05]

ENHANCEMENT:
[Paste the relevant highlight zone rule from Section 06]

FIT LANGUAGE:
[Paste the relevant fit preference rule from Section 07]

STYLE POLES:
[Paste the relevant style pole calibration from Section 08]

COLOUR PALETTE:
[Paste the full colour season palette from Section 02 — Power Neutrals, Accent, Avoid]

ANTI-PREFERENCES:
[List hard exclusions from ANTI_PREFS, or state "None"]

STREETWEAR OUTFIT:
[If STYLE_TRIBES includes Off Duty or Urban Wear → "Include one streetwear outfit in Relaxed Casual: oversized graphic-free tee or boxy crewneck + oversized wide-leg denim OR black cargo trousers + white chunky-sole sneakers. Keep colours in palette." Otherwise → "Not applicable."]

OUTPUT REQUIREMENTS:
Generate exactly 16 outfits:
- Outfits 1–4: FORMAL
- Outfits 5–8: SMART CASUAL
- Outfits 9–12: EVENING WEAR
- Outfits 13–16: RELAXED CASUAL

Format every outfit exactly as:

---
OUTFIT [NUMBER] — [CONTEXT NAME]

TOP: [item — fit + fabric + colour + style detail]
LAYER: [item — type + fit + fabric + colour] or "None"
BOTTOM: [item — fit + fabric + colour + style detail]
FOOTWEAR: [item — type + colour + material]
ACCESSORY: [1–2 items, or "None"]

WHY IT WORKS FOR YOU: [1–2 sentences — reference at least one specific client variable using ICONIK language]
SHOPPING TRANSLATION: [1 sentence naming the 1–2 key items to buy for this outfit]
ACCEPTABLE SUBSTITUTES: [1 sentence with practical replacements that preserve the same silhouette and colour logic]
DO NOT BUY: [1 sentence naming the common wrong version of this outfit]
---

RULES — MUST FOLLOW ALL:
1. Never include any item from ANTI_PREFS
2. All colours from the client's Colour Season palette — use the full range, never repeat the same colour more than twice across 16 outfits
3. Black jackets or outerwear always permitted — balance with a palette-correct piece in the same outfit
4. Every silhouette must comply with body shape rules
5. Every outfit must comply with height proportion rules
6. Apply camouflage rules to every outfit regardless of context
7. NEVER suggest skinny jeans. NEVER suggest cropped or ankle-cut trousers. Hem must reach the ankle.
8. Blazers maximum 5 times total across all 16 outfits — use other layer types for the rest
9. NEVER suggest waistcoats
10. If CLIMATE_ZONE = HOT: no turtlenecks, no wool fabrics, no heavy knits; all blazers must be unlined linen-cotton or lightweight cotton; maximum 7 layers total across all 16 outfits
11. If CLIMATE_ZONE = TEMPERATE: full vocabulary applies; maximum 10 layers total across all 16 outfits
12. Layer count targets by context — Formal: 3 of 4 | Smart Casual: 2 of 4 | Evening: 3 of 4 | Relaxed Casual: 2 of 4 (HOT climate: reduce each by 1)
13. Sneakers are white only — never brown, tan, grey, or any other colour
14. No sneakers in Formal. No leather Oxfords or Derby shoes in Relaxed Casual.
15. Vary top types — do not repeat the same top style more than twice within any one context
16. Always name fabric specifically — never write "fabric" or "material"
17. Accessories: max 2 in Evening, max 1 in all other contexts
18. "Why It Works For You" must reference at least one specific client variable — never generic
19. No two outfits within the same context should feel similar — vary tops, layers, bottoms, footwear
20. Never use a blazer in Relaxed Casual context
```

---

## SECTION 17 — QUALITY CHECKLIST

Before finalising output, check every outfit against this list:

- [ ] Colour within the client's Colour Season palette
- [ ] Full colour range used — no tone repeated more than twice across 16 outfits
- [ ] Black outerwear balanced with a palette-correct piece in the same outfit
- [ ] Silhouette complies with body shape rule
- [ ] Height proportion rules followed
- [ ] Camouflage zone addressed in this outfit
- [ ] No skinny jeans, no cropped trousers, no ankle-cut anything
- [ ] No waistcoats
- [ ] Blazer count is 5 or fewer across all 16 outfits
- [ ] No blazers in Relaxed Casual
- [ ] Total layer count: max 10 (TEMPERATE) or max 7 (HOT) across all 16 outfits
- [ ] Layer count per context matches targets: Formal 3/4 | Smart Casual 2/4 | Evening 3/4 | Relaxed Casual 2/4
- [ ] HOT climate: no turtlenecks, no wool, no heavy knits, all blazers are lightweight unlined
- [ ] Sneakers are white only
- [ ] No item from ANTI_PREFS included
- [ ] Fabric named specifically in every line
- [ ] Fit language matches FIT_PREF (with body shape overrides applied)
- [ ] Accessory count within limit for this context
- [ ] "Why It Works For You" references a specific client variable
- [ ] Shopping Translation, Acceptable Substitutes, and Do Not Buy are present for every outfit
- [ ] No two outfits within the same context are too similar
- [ ] Streetwear outfit included if Off Duty / Urban Wear selected (no layer on that outfit)
- [ ] Indian-context support included if Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, or ethnic wardrobe signals are present

---

## SECTION 18 — SAMPLE OUTPUT

**Input profile:** Oval body shape · Warm Medium season · 5'7" · Relaxed fit preference · Belly fat storage zone · Minimal expression · Classic tone

---

```
OUTFIT 1 — FORMAL

TOP: Fitted fine cotton poplin Oxford shirt, warm ivory, spread collar — worn untucked under layer
LAYER: Single-breasted slim-fit blazer, camel wool-blend, notch lapel — worn open
BOTTOM: Flat-front slim-fit olive wool trousers, slight taper, ankle-clean hem
FOOTWEAR: Tan suede Chelsea boots, slim toe
ACCESSORY: Gold minimalist watch

WHY IT WORKS FOR YOU: The open blazer creates a deliberate vertical channel through your midsection rather than widening it horizontally — a direct function of your Oval Geometric Silhouette profile. Camel and warm olive are core Warm Medium palette pairings that produce chromatic harmony with your golden undertone depth.
```

```
OUTFIT 5 — SMART CASUAL

TOP: Fine merino long-sleeve crewneck in rust, slim-fit
LAYER: Quarter-zip pullover, warm tan fine merino — worn over crewneck, collar visible above zip
BOTTOM: Flat-front slim chino in khaki cotton twill, slim-straight, ankle-clean
FOOTWEAR: Tan suede penny loafers
ACCESSORY: Slim dark brown leather belt

WHY IT WORKS FOR YOU: Layering the quarter-zip over a contrasting crewneck adds vertical depth and draws the eye upward rather than across the midsection. Rust and warm tan are an accent-to-neutral pairing within your Warm Medium palette — chromatic harmony without tonal repetition.
```

```
OUTFIT 9 — EVENING WEAR

TOP: Fitted crew-neck T-shirt, heavyweight washed cotton, warm ivory — untucked
LAYER: Black faux leather biker jacket, slim-fit, zip front — worn open
BOTTOM: Slim-straight clean denim, dark indigo, ankle-clean
FOOTWEAR: Black leather Chelsea boots, slim toe
ACCESSORY: Thin gold chain

WHY IT WORKS FOR YOU: Black outerwear anchors the evening look regardless of colour season — the warm ivory tee underneath prevents a cold flat read and sits within your Warm Medium palette. The open biker jacket preserves the vertical line your Oval geometry requires rather than closing across the midsection.
```

```
OUTFIT 13 — RELAXED CASUAL

TOP: Fitted Henley shirt, full sleeve, washed cotton in warm olive — two-button placket, worn untucked
LAYER: None
BOTTOM: Relaxed straight-leg denim, dark indigo, full length
FOOTWEAR: White clean leather low-top sneakers
ACCESSORY: Gold minimalist watch

WHY IT WORKS FOR YOU: The untucked Henley in warm olive skims the midsection cleanly — relaxed in fit but geometrically intentional. Straight-leg denim rather than a tapered cut prevents the trouser from pulling focus toward the lower midsection, keeping the silhouette balanced from waist to ankle.
```

---

*ICONIK Men's Blueprint Outfit Recommendation Engine — SKILL.md v2.1*  
*For use in automated Blueprint generation pipeline only.*  
*All constraint logic is derived from ICONIK's proprietary three-pillar methodology:*  
*Geometric Silhouette Profiling™ · Chromatic Harmony Mapping™ · Facial Architecture Analysis™*
