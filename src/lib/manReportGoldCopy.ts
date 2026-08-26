import type { ReportData } from './manReportGenerator';

// A reversible, local-only editorial standard for the sample report. This is
// intentionally kept separate from the generator until the final voice and
// information design have been approved in the rendered experience.
export const MAN_REPORT_GOLD_COPY_SAMPLE_TOKEN = '088c3bb6-b94e-4376-b527-e3142e890d9f';

const GOLD_SECTIONS: ReportData['sections'] = {
  s0_snapshot: `## SECTION 0: YOUR PERSONAL STYLE SNAPSHOT

Your best direction is polished, modern and easy to repeat. Choose clothes that add shape at your shoulders, sit comfortably over your stomach and create a clean line from waist to shoe.

### Your Top 3 Priorities
* **Get the fit right first:** Jackets should fit cleanly at the shoulders, shirts should not pull across the stomach, and trousers should sit securely without a tight belt.
* **Build around rich, darker colours:** Deep navy, burgundy, olive and chocolate brown suit your warm colouring and combine easily.
* **Use repeatable outfit formulas:** Start with one good top, one straight trouser and one optional open layer. Change the colours and fabrics instead of rebuilding every outfit from scratch.`,

  s1_face: `## SECTION 1: YOUR FACE, HAIR & EYEWEAR

You have a square face with a broad forehead and a strong jaw. Your best grooming choices keep that strength but add a little height and softness, so the face does not look wider than it is.

### Beard & Facial Hair Guide
Keep your beard at roughly 3–5 mm. Trim the cheek line neatly and clean the neckline every two or three days; place the neckline about one finger above the Adam's apple. Let the chin stay slightly fuller than the sides, and use a small amount of beard oil if the grey hairs feel coarse.

### Hair, Collars & Metals
* **Hair:** Keep some texture and height on top, with shorter sides. A textured quiff, soft side part or brushed-back style will work well.
* **Shirt collars:** Point, semi-spread and moderate spread collars are safest. Avoid extremely wide collars worn open because they add more width near the jaw.
* **Metals:** Gold, brass and warm steel are your easiest choices. Brushed silver can still work with navy and grey outfits; it does not need to be banned.

### Eyewear Guide
* **Round tortoiseshell frames:** Your safest everyday option; the curved shape balances your jaw.
* **Clubmaster frames:** Good for work when you want a sharper, more formal look without using a heavy rectangular frame.
* **Round gold sunglasses:** A warm, lighter option that suits your colouring and softens the face.
* **Classic aviators:** Choose a medium size with brown or green lenses; oversized frames will overwhelm your features.`,

  s2_body: `## SECTION 2: YOUR FIT GUIDE

Your main fit goal is simple: add definition at the shoulders and let everything below fall cleanly without squeezing your stomach.

### What Works Best
* **Structured jackets:** A clear shoulder line gives your upper body shape. Choose light padding rather than bulky padding.
* **Mid- or high-rise trousers:** The waistband should sit close to your natural waist, not underneath the stomach.
* **Straight-leg trousers:** A clean line from thigh to shoe balances your torso better than a narrow ankle.

### Five Fitting-Room Checks
* **Check the shoulder first:** The jacket seam should end where your shoulder ends. If the shoulder is wrong, do not size up or down hoping to fix it elsewhere.
* **Button the jacket:** It should close without an X-shaped pull across the stomach. Wear it open most of the time, but it still needs to button comfortably.
* **Sit down in the shirt:** The buttons should stay flat and the hem should remain tucked. If the placket pulls, try a roomier cut or size.
* **Test the waistband without a belt:** It should stay in place without digging in. A belt should finish the outfit, not hold the trousers up.
* **Look at the hem:** Formal trousers should touch the shoe with little or no pooling. Casual denim can have a small amount of soft stacking.

### Avoid These Fits
* **Skinny trousers:** They make the lower body look too narrow compared with the torso.
* **Very low-rise trousers:** They cut across the stomach and make shirts harder to keep neat.
* **Short, tight jackets:** A jacket that ends at the widest part of the body makes the torso look shorter.

### If You Want to Look Taller
* Keep the shirt, jacket and trousers within a similar depth of colour instead of creating a hard light-dark split at the waist.
* Choose full-length trousers with a clean hem and jackets that cover the seat; avoid excess fabric gathering at the shoe.`,

  s3_colour: `## SECTION 3: YOUR COLOUR GUIDE

You suit rich colours with warmth and depth. Darker shades are the easiest place to start, but you do not need to dress entirely in dark colours or avoid every cool shade.

### Your Best Core Colours
* **Deep navy:** Use for suits, jackets, trousers and knitwear. It is softer than black and works with almost every colour below.
* **Burgundy:** Use for polos, knitwear, ties and an occasional jacket. It adds colour without looking loud.
* **Olive green:** Excellent for chinos, overshirts and casual jackets. It works particularly well with ivory, navy and brown.
* **Rust:** Best in one piece at a time, such as a polo, shirt or sweater.
* **Mustard:** Keep it to a small accent, a muted shirt or a patterned detail rather than an entire formal outfit.
* **Chocolate brown:** Your most useful leather colour and a strong alternative to black for jackets and knitwear.

### Useful Neutrals
* **Charcoal:** Use for formal trousers and suits, preferably with an ivory, blue or burgundy top.
* **Dark tan:** Useful for casual trousers, belts and lightweight outerwear.
* **Camel:** Best for jackets and coats. Keep the rest of the outfit darker so camel remains the focal point.

### Accent Colours
* **Teal:** Use in a polo, tie or small pattern when you want a stronger colour near the face.
* **Copper:** Best in watch details, buckles or small accessories.

### Colours to Be Careful With
* **Very pale pink:** It can look weak next to your deeper colouring. Choose dusty rose or burgundy instead.
* **Icy silver-grey:** Keep it away from the face. A darker charcoal is safer.
* **Neon colours:** They will dominate the outfit and are difficult to combine with the rest of your wardrobe.

### Patterns & Fabrics
Choose small checks, narrow stripes and subtle textures. Matte cotton, linen blends, wool blends and brushed fabrics will look more refined than shiny material. During hot or wet weather, keep the same colours but switch heavy knits and suede to breathable cotton blends and smooth leather.

### Five Easy Colour Rules
* Start with navy, charcoal, olive or chocolate brown as the largest part of the outfit.
* Ivory and cream are easier near your face than brilliant white, although a crisp white shirt still works under a darker jacket.
* Match brown shoes with a brown belt; they do not need to be the exact same shade.
* Warm metals are the easiest choice, but brushed silver is fine when the outfit is based on navy, grey or black.
* Wear one strong colour at a time. Let the other pieces stay neutral.`,

  s4_outfits: `## SECTION 4: YOUR 20 OUTFITS

Treat these as repeatable formulas, not costumes. Buy the fit and fabric first, then get as close as possible to the suggested colour. For suede, heavy knitwear and leather layers, use the outfit in dry or cooler weather and choose the stated alternative during heat or rain.

OUTFIT 1 — OFFICE / FORMAL
TOP: Powder blue cotton poplin dress shirt — regular tailored fit — tucked
LAYER: Ink navy pinstripe linen-cotton suit jacket — half-lined — worn open
BOTTOM: Matching ink navy pinstripe suit trousers — mid-rise — straight fit — clean break
FOOTWEAR: Dark brown leather Derby shoes
ACCESSORIES: Burgundy knitted tie — dark brown belt — Clubmaster glasses
OCCASION ANCHOR: Wear this for presentations, interviews and important client meetings. The navy column keeps the outfit sharp and lengthens your frame.

OUTFIT 2 — OFFICE / FORMAL
TOP: Warm ivory cotton poplin dress shirt — tailored fit — tucked
LAYER: Warm taupe linen-cotton suit jacket — unlined — worn open
BOTTOM: Matching warm taupe suit trousers — mid-rise — single pleat — straight fit
FOOTWEAR: Dark chocolate leather Oxford shoes
ACCESSORIES: Deep olive knitted tie — chocolate belt — gold-tone watch — Clubmaster glasses
OCCASION ANCHOR: Choose this for daytime events and warm-weather meetings. The darker shoes and tie keep the light suit grounded.

OUTFIT 3 — OFFICE / FORMAL
TOP: Pale grey cotton poplin dress shirt — moderate spread collar — tucked
LAYER: Espresso linen-cotton blazer — half-lined — worn open
BOTTOM: Mid-grey tailored trousers — mid-rise — straight fit — clean break
FOOTWEAR: Dark brown leather Derby shoes
ACCESSORIES: Navy knitted tie — dark brown belt — brushed-steel watch — Clubmaster glasses
OCCASION ANCHOR: Wear this for regular office days and business dinners. The open brown blazer adds structure without making the outfit feel like a full suit.

OUTFIT 4 — OFFICE / FORMAL
TOP: Powder blue cotton poplin dress shirt — point collar — tucked
LAYER: None
BOTTOM: Warm taupe linen-cotton trousers — mid-rise — straight fit — clean break
FOOTWEAR: Dark brown leather Derby shoes
ACCESSORIES: Deep olive knitted tie — dark brown belt — Clubmaster glasses
OCCASION ANCHOR: Use this on hot office days when a jacket is unnecessary. Keep the shirt crisp and the trouser crease sharp.

OUTFIT 5 — OFFICE / FORMAL
TOP: Warm white cotton poplin shirt — semi-spread collar — tucked
LAYER: None
BOTTOM: Deep olive tailored trousers — mid-rise — single pleat — straight fit
FOOTWEAR: Dark brown leather Oxford shoes
ACCESSORIES: Chocolate knitted tie — dark brown belt — gold-tone watch — dark navy acetate glasses
OCCASION ANCHOR: This is a useful alternative to grey office trousers. The olive adds personality while the white shirt and brown leather keep it professional.

OUTFIT 6 — OFFICE / FORMAL
TOP: Charcoal-brown knitted polo — long sleeve — open collar — tucked
LAYER: None
BOTTOM: Warm ivory cotton trousers — mid-rise — straight fit — clean break
FOOTWEAR: Dark brown leather penny loafers
ACCESSORIES: Dark brown belt — brushed-steel watch — Clubmaster glasses
OCCASION ANCHOR: Wear this for business-casual Fridays, lunches and less formal meetings. The heavier polo fabric should skim the stomach rather than cling to it.

OUTFIT 7 — SMART CASUAL
TOP: Navy cable-knit half-zip sweater — relaxed fit
LAYER: Light grey cotton crew-neck T-shirt — visible only at the neckline
BOTTOM: Warm ivory cotton-twill trousers — mid-rise — straight fit — slight break
FOOTWEAR: Dark tan leather loafers
ACCESSORIES: Brushed-steel watch — brown leather bracelet — black acetate glasses
OCCASION ANCHOR: Use this for cooler evenings, travel and relaxed dinners. In warm weather, replace the sweater with a navy textured polo.

OUTFIT 8 — SMART CASUAL
TOP: Dark indigo chambray shirt — button-down collar — straight hem — sleeves rolled
LAYER: None
BOTTOM: Warm stone cotton chinos — mid-rise — single pleat — straight fit
FOOTWEAR: Dark brown leather penny loafers
ACCESSORIES: Brushed-steel watch — tortoiseshell sunglasses
OCCASION ANCHOR: Wear this for casual client lunches and weekend plans. The straight shirt hem gives comfort without looking oversized.

OUTFIT 9 — SMART CASUAL
TOP: Deep burgundy ribbed knit polo — open collar — relaxed fit
LAYER: Warm white crew-neck T-shirt — visible at the neckline
BOTTOM: Light-wash straight-leg jeans — mid-rise — relaxed drape
FOOTWEAR: White leather low-top sneakers
ACCESSORIES: Brushed-steel watch — thin ring — Clubmaster glasses
OCCASION ANCHOR: This works for dinner with friends, house parties and rooftop evenings. Burgundy brings colour near your face while the denim keeps it relaxed.

OUTFIT 10 — SMART CASUAL
TOP: Crisp white Oxford shirt — regular fit — sleeves rolled — untucked
LAYER: Deep navy fine-knit sweater — carried or draped over the shoulders
BOTTOM: Deep navy tailored trousers — mid-rise — straight fit — no break
FOOTWEAR: Light beige leather slip-on sneakers
ACCESSORIES: Tortoiseshell round glasses — brushed-steel watch — thin bracelet
OCCASION ANCHOR: Choose this for client lunches, resort dinners and polished weekend plans. The navy base keeps the white shirt from creating a harsh split at the waist.

OUTFIT 11 — EVENING WEAR
TOP: Warm ivory textured cotton T-shirt — relaxed fit — untucked
LAYER: Dark chocolate leather jacket — clean zip front — worn open
BOTTOM: Mid-wash straight-leg jeans — mid-rise — relaxed drape
FOOTWEAR: White leather low-top sneakers
ACCESSORIES: Brushed-steel watch — soft rectangular black glasses
OCCASION ANCHOR: Wear this for a date, evening coffee or casual dinner. The open jacket adds shape while the light T-shirt keeps the face bright.

OUTFIT 12 — EVENING WEAR
TOP: Jet black cotton shirt — regular fit — collar open — untucked
LAYER: Warm ivory fine-knit sweater — carried or draped over the shoulders
BOTTOM: Off-white linen-blend trousers — mid-rise — straight fit — clean full length
FOOTWEAR: Light beige textured loafers with a rubber sole
ACCESSORIES: Brushed-steel watch — Clubmaster glasses
OCCASION ANCHOR: Use this for a resort dinner, café meeting or holiday evening. The black top gives definition while the light trousers keep the outfit relaxed.

OUTFIT 13 — EVENING WEAR
TOP: Oatmeal textured cotton sweater — relaxed fit
LAYER: Mid-wash denim overshirt — worn fully open
BOTTOM: Warm stone tailored chinos — mid-rise — straight leg — clean break
FOOTWEAR: Black leather penny loafers
ACCESSORIES: Brushed-steel watch — Clubmaster glasses
OCCASION ANCHOR: Wear this on cooler casual evenings. The open denim layer gives the shoulders shape and stops the pale base from looking flat.

OUTFIT 14 — EVENING WEAR
TOP: Black heavyweight cotton T-shirt — relaxed fit — untucked
LAYER: Muted burgundy, navy and beige plaid overshirt — brushed cotton — worn open
BOTTOM: Mid-wash straight-leg jeans — relaxed fit — full length
FOOTWEAR: Off-white low-top sneakers
ACCESSORIES: Bold black rectangular glasses
OCCASION ANCHOR: This is an easy option for concerts, casual bars and weekend evenings. The patterned layer makes a simple T-shirt and jeans look intentional.

OUTFIT 15 — EVENING WEAR
TOP: Jet black cotton-jersey Henley — long sleeve — top two buttons open
LAYER: None
BOTTOM: Dark indigo straight-leg jeans — mid-rise — slight stacking
FOOTWEAR: Black leather loafers — almond toe
ACCESSORIES: Brushed-steel watch — tortoiseshell panto glasses
OCCASION ANCHOR: Wear this for an understated dinner or evening event. Keeping the top and jeans similarly dark creates one long, clean line.

OUTFIT 16 — RELAXED CASUAL
TOP: Forest green micro-check cotton shirt — short sleeve — relaxed fit
LAYER: None
BOTTOM: Mid-wash denim shorts — relaxed straight fit — knee length
FOOTWEAR: White retro-style low-top sneakers
ACCESSORIES: Green cap — black crossbody bag — blue-tinted Clubmaster sunglasses
OCCASION ANCHOR: Use this for sightseeing, hot weekends and casual lunches. Keep the shorts close to the knee so the proportions feel balanced.

OUTFIT 17 — RELAXED CASUAL
TOP: Warm ivory cotton T-shirt — relaxed fit — untucked
LAYER: Olive cotton-twill overshirt — structured chest pockets — worn open
BOTTOM: Warm ivory drawstring trousers — straight leg — fluid drape
FOOTWEAR: Black leather penny loafers — rubber sole
ACCESSORIES: Dark tortoiseshell wayfarer sunglasses
OCCASION ANCHOR: Wear this for travel, brunch and relaxed social plans. The olive overshirt frames the light base and gives the outfit enough structure.

OUTFIT 18 — RELAXED CASUAL
TOP: Warm ivory cotton-jersey T-shirt — regular fit — untucked
LAYER: Espresso and taupe plaid cotton overshirt — relaxed fit — worn open
BOTTOM: Warm stone cotton chinos — mid-rise — straight leg — slight break
FOOTWEAR: White leather low-top sneakers
ACCESSORIES: Clubmaster glasses — brushed-steel watch
OCCASION ANCHOR: Choose this for errands, coffee and casual meet-ups. The darker overshirt adds shape while the warm neutrals remain easy to repeat.

OUTFIT 19 — RELAXED CASUAL
TOP: Butter-yellow linen shirt — relaxed fit — neck open — sleeves rolled
LAYER: None
BOTTOM: Warm white linen-blend trousers — mid-rise — straight leg — full length
FOOTWEAR: Off-white leather sneakers — gum sole
ACCESSORIES: Brushed-steel chain and bracelet — warm tortoiseshell sunglasses
OCCASION ANCHOR: This is your warm-weather holiday outfit. The soft yellow adds colour near your face while the tonal lower half keeps the look clean.

OUTFIT 20 — RELAXED CASUAL
TOP: Warm ivory and deep navy rugby shirt — heavyweight cotton — relaxed fit
LAYER: None
BOTTOM: Light-wash straight-leg jeans — mid-rise — full length
FOOTWEAR: Off-white canvas low-top sneakers
ACCESSORIES: Brushed-steel chain — simple watch — Clubmaster glasses
OCCASION ANCHOR: Wear this for weekend walks, brunch, travel and casual gatherings. The collar and colour blocking make it more polished than a basic T-shirt.`,

  s4_combo_grids: `## SECTION 5: REPEATABLE OUTFIT COMBINATIONS

### Office Combinations

#### The Important Meeting
- Outfit summary: Powder blue shirt, ink navy pinstripe suit, burgundy knitted tie and dark brown Derby shoes.
- Logic: Use this when you need to look most formal. The navy suit creates one clean line and the brown shoes soften the contrast.
- Source: Derived from Outfit #1

#### The Everyday Separate
- Outfit summary: Pale grey shirt, espresso blazer, mid-grey trousers and dark brown Derby shoes.
- Logic: This is easier to repeat than a full suit. The open blazer adds shoulder shape while the grey trousers keep the base neutral.
- Source: Derived from Outfit #3

#### The Olive Trouser Formula
- Outfit summary: Warm white shirt, deep olive trousers, chocolate knitted tie and dark brown Oxford shoes.
- Logic: Use this when you want more personality without losing formality. Every colour remains warm and easy to combine.
- Source: Derived from Outfit #5

### Evening Combinations

#### The Leather Layer
- Outfit summary: Warm ivory textured T-shirt, dark chocolate leather jacket, straight blue jeans and white sneakers.
- Logic: The open jacket gives your upper body shape while the simple base keeps it relaxed.
- Source: Derived from Outfit #11

#### The Denim Layer
- Outfit summary: Oatmeal sweater, open denim overshirt, stone chinos and black loafers.
- Logic: The textures make the neutral colours interesting, and the open overshirt creates a cleaner line through the torso.
- Source: Derived from Outfit #13

#### The Dark Column
- Outfit summary: Black Henley, dark indigo jeans and black leather loafers.
- Logic: Keeping the top and jeans close in colour makes the body look longer. The Henley collar stops the outfit from feeling flat.
- Source: Derived from Outfit #15

### Relaxed Combinations

#### The Olive Overshirt
- Outfit summary: Warm ivory T-shirt and trousers, open olive overshirt and black penny loafers.
- Logic: This is comfortable enough for travel but still looks considered because the olive layer frames the lighter base.
- Source: Derived from Outfit #17

#### The Holiday Linen Set
- Outfit summary: Butter-yellow linen shirt, warm white linen-blend trousers and off-white leather sneakers.
- Logic: The low-contrast base keeps the outfit clean while the yellow shirt brings warmth near your face.
- Source: Derived from Outfit #19

#### The Rugby Weekend
- Outfit summary: Warm ivory and navy rugby shirt, light-wash straight jeans and off-white canvas sneakers.
- Logic: The rugby collar and heavier fabric give more shape than a standard T-shirt without making the outfit formal.
- Source: Derived from Outfit #20`,

  s5_shopping: `## SECTION 6: YOUR SHOPPING PLAN

Do not try to buy the entire report. Start with the pieces that solve the most outfits, check the fit carefully, and only upgrade once you know you will wear the category often.

### Buy First
* **Deep navy blazer:** Choose a half-lined, single-breasted jacket that fits cleanly at the shoulders and buttons without pulling. This will improve office trousers, chinos and dark jeans.
* **Two mid-rise straight trousers:** Start with charcoal or navy for work and olive or stone for casual wear. The waistband should stay up without a tight belt.
* **Dark brown leather loafers or Derby shoes:** Look for a rounded or almond toe and a rubber or mixed sole for Indian weather. Avoid very thin, pointed shoes.
* **One textured polo:** Choose burgundy, navy or chocolate in a fabric heavy enough to skim the body. Avoid thin clingy jersey.
* **Straight dark jeans:** Choose a clean dark indigo wash with room through the thigh. Avoid distressing, heavy fading and a narrow ankle.

### Upgrade Next
* **A well-altered suit:** Start with deep navy. Pay for sleeve, waist and trouser alterations rather than chasing a more expensive label.
* **An olive overshirt:** Choose breathable cotton twill with a straight hem. It should close comfortably even if you normally wear it open.
* **A warm-weather linen set:** Choose ivory, stone, taupe or muted yellow, and make sure the fabric is lined or dense enough not to become transparent.

### Skip For Now
* **Another black shirt:** You already have enough dark evening options; navy, burgundy or olive will add more range.
* **Heavy winter outerwear:** It has little use in your climate unless you travel frequently to colder places.
* **Delicate suede footwear:** Buy it only after your everyday leather shoes are covered, and reserve it for dry weather.

### Never Buy
* **Skinny or extra-slim trousers:** They will feel restrictive and make the proportions less balanced.
* **A jacket with the wrong shoulders:** Tailors can adjust the waist and sleeves, but shoulder alterations are difficult and expensive.
* **Shiny synthetic shirts or suits:** They reflect light, show pulling and usually look cheaper than matte cotton, linen or wool blends.`,

  s5_grooming_skin: `## SECTION 7: YOUR GROOMING & SKINCARE ROUTINE

### Beard Routine
Keep the beard at 3–5 mm, with the chin very slightly fuller than the sides. Clean the neckline every two or three days and do a full even trim once a week. Use a small amount of lightweight beard oil after washing if the grey hairs feel dry. Avoid letting the neck growth join the beard because it makes the outline look less deliberate.

### Morning
* Wash with a gentle cleanser or simply rinse if your skin feels dry in the morning.
* Apply a light moisturiser that does not leave a greasy finish.
* Finish with broad-spectrum SPF 30 or higher on the face, ears and neck.

### Evening
* Use a gentle cleanser to remove sunscreen, sweat and pollution.
* Apply moisturiser while the skin is still slightly damp.

### After Trimming
* Use a clean trimmer and avoid repeatedly passing over the same area.
* Rinse the neckline, pat it dry and apply an alcohol-free moisturiser or balm.
* If a product consistently causes burning or a rash, stop using it and speak to a dermatologist.

### Adjust the Texture, Not the Whole Routine
If your skin feels oily, use lighter gel or lotion textures. If it feels tight or flaky, use a richer moisturiser at night. Keep the routine consistent for a few weeks before adding anything else.`,

  s6_identity: `## SECTION 8: YOUR STYLE IN ONE PARAGRAPH

Your style should feel confident, polished and easy to understand. You look strongest in clean tailoring, straight trousers, rich colours and one structured layer worn open. You do not need complicated outfits: a well-fitting shirt or polo, a straight trouser and good leather shoes will do most of the work. For casual days, keep the same fit rules and switch to denim, cotton overshirts and clean sneakers. When every new purchase works with at least three things you already own, getting dressed will become faster and your wardrobe will become noticeably stronger.`,
};

export function applyManReportGoldCopy(data: ReportData): ReportData {
  return {
    ...data,
    // The stored QA belongs to the original outfit text. The local gold copy
    // must be re-checked before it can claim verification.
    qa: undefined,
    classification: {
      ...data.classification,
      body: {
        ...data.classification.body,
        fit_directive: 'Structured at the shoulders, comfortable through the waist',
        highlight_zone: 'Shoulders',
        height_adjustment: 'Keep the colour line clean and avoid excess fabric at the shoe',
        silhouette_rules: [
          'Choose jackets that fit cleanly at the shoulders and skim the stomach',
          'Wear mid- or high-rise trousers that stay in place without a tight belt',
          'Use straight legs and keep tops and bottoms close in colour when you want to look taller',
        ],
        avoid_cuts: [
          'Skinny trousers or very narrow ankles',
          'Low-rise trousers and short jackets that cut across the stomach',
        ],
      },
      face: {
        ...data.classification.face,
        beard_maintenance: 'Keep the beard at 3–5 mm and clean the cheek and neck lines every two or three days.',
        facial_hair_recommendations: 'Keep the chin slightly fuller than the sides so the beard supports the jaw without adding width.',
        hairstyle_recommendations: [
          'Textured quiff with short, softly faded sides',
          'Classic side part with a low taper',
          'Short brushed-back style with a matte finish',
          'Textured crop with a little height at the front',
        ],
        beard_style_recommendations: [
          'Short boxed beard at 3–5 mm with a clean neckline',
          'Professional stubble with neat cheek and neck lines',
          'Short beard with the chin slightly fuller than the sides',
          'Clean shave with tidy sideburns and a moisturised neckline',
        ],
        eyewear_shapes: [
          'Round tortoiseshell optical frames',
          'Clubmaster optical frames with warm metal details',
          'Round gold sunglasses with brown lenses',
          'Medium gold aviators with green or brown lenses',
        ],
        skincare_routine: {
          morning: ['Gentle cleanser or water rinse', 'Light moisturiser', 'Broad-spectrum SPF 30+'],
          evening: ['Gentle cleanser', 'Moisturiser on slightly damp skin'],
          shaving_or_beard_area: 'Use a clean trimmer, avoid repeated passes and apply an alcohol-free moisturiser after trimming.',
          skin_adjustment: 'Use a lighter lotion if the skin feels oily and a richer night moisturiser if it feels tight or flaky.',
        },
      },
      colour: {
        ...data.classification.colour,
        skin_tone_depth: 'Deep',
        colours_to_avoid: [
          { name: 'Very Pale Pink', hex: '#FADADD', reason: 'Choose dusty rose or burgundy instead; they give your colouring more definition.' },
          { name: 'Icy Silver Grey', hex: '#C0C0C0', reason: 'Keep very cool grey away from the face and choose charcoal when you need a grey neutral.' },
          { name: 'Neon Lime', hex: '#32CD32', reason: 'Neon colour dominates the outfit and is difficult to combine with your core wardrobe.' },
        ],
        pattern_guidance: 'Choose small checks, narrow stripes and subtle textures rather than large, high-contrast prints.',
        fabric_tone_guidance: 'Prefer matte cotton, linen blends and wool blends; switch heavy knits and suede during hot or wet weather.',
      },
      style_brief: {
        ...data.classification.style_brief,
        primary_brief: 'A polished wardrobe built from clean tailoring, comfortable straight fits and rich colours that are easy to repeat.',
        aesthetic_direction: 'Modern professional with relaxed, practical off-duty outfits',
      },
    },
    sections: GOLD_SECTIONS,
    diagnostics: data.diagnostics ? {
      ...data.diagnostics,
      faceGeometryVerdict: 'Your face is square, with a broad forehead and strong jaw. Add some height in the hair and choose glasses with softer curves.',
      frameFrontVerdict: 'Add shape at the shoulders, give the stomach enough room and keep the trouser line straight.',
      frameSideVerdict: 'From the side, the best clothes fall cleanly from the shoulder and do not catch or pull across the stomach.',
      frameSideFallback: 'No side photo was supplied, so these fit rules use the front photo and your intake answers. Check them in a mirror from the side when trying clothes on.',
      colourDrapeVerdict: 'Rich, warm colours suit you best near the face. Start with navy, burgundy, olive and chocolate brown, then add lighter shades in smaller amounts.',
      frameTrainingDirection: {
        title: 'Four-week posture and movement routine',
        weeks: 'Repeat three days per week for four weeks. Keep the movements comfortable and stop if anything hurts.',
        focus: [
          'Practise standing tall without lifting the shoulders or forcing the chest forward.',
          'Use regular walking and simple core-bracing practice to improve how clothes hang.',
          'This is optional support for posture; clothing fit should never depend on changing your body.',
        ],
      },
    } : data.diagnostics,
    deliverables: data.deliverables ? {
      ...data.deliverables,
      linkedinHeadshotSpec: 'Use a clean side part, a neatly edged 3–5 mm beard, and a deep navy jacket or shirt. Keep the background simple and the camera level with the eyes.',
    } : data.deliverables,
  };
}
