// manReportGenerator.ts
// Two-prompt sequential pipeline for ICONIK Men's Blueprint generation.
// Prompt 1 → Classification JSON (deterministic science layer)
// Prompt 2 → Full report copy (voice layer, depends on Prompt 1 output)

import { GoogleGenAI } from '@google/genai';
import type { ManIntakeSubmission } from './supabaseMan';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

// ─────────────────────────────────────────────────────────────
// PROMPT 1 — CLASSIFICATION ENGINE
// ─────────────────────────────────────────────────────────────

const CLASSIFICATION_SYSTEM_PROMPT = `You are ICONIK's Classification Engine for men's style analysis.
Your job is to take raw intake form data and output a precise, structured JSON classification object.
This JSON will be used by a separate prompt to generate the full report.

Rules:
- Output ONLY valid JSON. No preamble, no explanation, no markdown fences.
- Every field must be populated. Never leave a field null or empty.
- Classification must be deterministic — the same inputs must always produce the same outputs.
- Do not generate any report copy, outfit descriptions, or styling language in this prompt.
- Trust the client's self-reported Colour Season field. Do not override it.
- Outfit split is dynamic — derive from Dressing Context and Wardrobe fields.
- Style brief is derived from Free Note (primary), then Style Tribes, then Style Goal.
  If Free Note contains substantive content, it governs aesthetic direction.
  Tribe aesthetics and Style Goal inform secondary parameters only.`;

const CLASSIFICATION_USER_TEMPLATE = `Classify the following ICONIK men's intake form data and return a JSON object matching the schema exactly.

--- INTAKE FORM DATA ---
Email: {{email}}
Location: {{location}}
Primary Goal: {{primary_goal}}
Style Relationship: {{style_relationship}}
Dressing Context: {{dressing_context}}
Wardrobe: {{wardrobe}}
Height: {{height}}
Body Shape: {{body_shape}}
Fat Storage: {{fat_storage}}
Highlight Zone: {{highlight_zone}}
Minimise Zone: {{minimise_zone}}
Fit Preference: {{fit_preference}}
Skin Tone: {{skin_tone}}
Undertone: {{undertone}}
White Test: {{white_test}}
Hair Colour: {{hair_colour}}
Eye Colour: {{eye_colour}}
Colour Season: {{colour_season}}
Face Shape: {{face_shape}}
Feature Type: {{feature_type}}
Style Goal: {{style_goal}}
Branch Answer: {{branch_answer}}
Style Tribes: {{style_tribes}}
Structure: {{structure}}
Expression: {{expression}}
Tone: {{tone}}
Register: {{register}}
Style Blocker: {{style_blocker}}
Anti-Pref: {{anti_pref}}
Free Note: {{free_note}}
--- END FORM DATA ---

Return ONLY the following JSON object, fully populated:

{
  "client": {
    "location_region": "",
    "height_category": "",
    "primary_goal": ""
  },
  "body": {
    "silhouette_type": "",
    "fat_storage_zone": "",
    "highlight_zone": "",
    "minimise_zone": "",
    "fit_directive": "",
    "height_adjustment": "",
    "silhouette_rules": ["", "", ""],
    "avoid_cuts": ["", ""]
  },
  "face": {
    "face_shape": "",
    "feature_type": "",
    "neckline_recommendations": ["", "", ""],
    "necklines_to_avoid": ["", ""],
    "hairstyle_recommendations": ["", "", "", ""],
    "facial_hair_recommendations": "",
    "eyewear_shapes": ["", ""]
  },
  "colour": {
    "season": "",
    "undertone": "",
    "skin_tone_depth": "",
    "primary_palette": [
      {"name": "", "hex": "", "usage": ""},
      {"name": "", "hex": "", "usage": ""},
      {"name": "", "hex": "", "usage": ""},
      {"name": "", "hex": "", "usage": ""},
      {"name": "", "hex": "", "usage": ""},
      {"name": "", "hex": "", "usage": ""}
    ],
    "neutral_base_colours": [
      {"name": "", "hex": ""},
      {"name": "", "hex": ""},
      {"name": "", "hex": ""}
    ],
    "accent_colours": [
      {"name": "", "hex": ""},
      {"name": "", "hex": ""}
    ],
    "colours_to_avoid": [
      {"name": "", "hex": "", "reason": ""},
      {"name": "", "hex": "", "reason": ""},
      {"name": "", "hex": "", "reason": ""}
    ],
    "pattern_guidance": "",
    "fabric_tone_guidance": ""
  },
  "style_brief": {
    "primary_brief": "",
    "aesthetic_direction": "",
    "tribes": [],
    "register": "",
    "expression": "",
    "structure_level": "",
    "anti_preferences": "",
    "style_blocker": "",
    "key_aspiration": ""
  },
  "outfit_split": {
    "total": 16,
    "categories": [
      {"category": "", "count": 0, "rationale": ""},
      {"category": "", "count": 0, "rationale": ""},
      {"category": "", "count": 0, "rationale": ""},
      {"category": "", "count": 0, "rationale": ""}
    ]
  }
}

OUTFIT SPLIT LOGIC — derive dynamically from Dressing Context + Wardrobe:
- If Dressing Context = "Corporate Office, Client Facing": Work/Formal: 7, Smart Casual: 5, Casual: 4
- If Dressing Context = "Corporate Office" only: Work: 6, Smart Casual: 5, Casual: 5
- If Dressing Context includes "Client Facing" + "Events": Work: 5, Smart Casual: 5, Formal/Events: 4, Casual: 2
- If Dressing Context = "Casual / Everyday": Casual: 8, Smart Casual: 5, Work: 3
- If Dressing Context = "Mixed / No specific context": Casual: 5, Smart Casual: 5, Work: 4, Formal: 2
- If Wardrobe = "Scratch": All outfits must function as a complete wardrobe system.
- If Wardrobe includes "Casuals": Casual category must cover both weekday off-duty and weekend.`;

// ─────────────────────────────────────────────────────────────
// PROMPT 2 — REPORT GENERATION ENGINE
// ─────────────────────────────────────────────────────────────

const REPORT_SYSTEM_PROMPT = `You are ICONIK's Senior Style Architect writing a personalised Men's Style Blueprint.
ICONIK is a scientific personal styling brand. The tone is: authoritative, warm, precise, outcome-focused.
You are writing directly to the client — second person ("you", "your").
Never use generic styling advice. Every sentence must be traceable to the client's specific classification data.
Do not reference the classification JSON directly — translate it into natural language.
No brand names. No celebrity references. No product links.
Use Western garment vocabulary throughout (suits, trousers, shirts, chinos, outerwear).
Write each section in full, publication-ready copy. No placeholders.

Tone benchmarks:
- Not: "You should consider wearing structured jackets."
- Yes: "Your shoulders carry structured tailoring naturally — a single-button jacket in camel or tobacco is the single highest-return piece in your wardrobe."

- Not: "Avoid bright colours."
- Yes: "High-contrast brights fight your Warm Autumn depth — they create a visual disconnect that works against the quiet authority your profile is built for."

Never use: "unique," "journey," "stunning," "gorgeous," "amazing"
Always use: specific garment names, specific colours, specific geometric logic
POV: always second person (you/your), never third person`;

const REPORT_USER_TEMPLATE = `Write the full ICONIK Men's Style Blueprint for this client.
Use the classification data and original form data provided below.

--- CLASSIFICATION JSON ---
{{classification_json}}
--- END CLASSIFICATION ---

--- ORIGINAL FORM DATA (reference only) ---
Free Note: {{free_note}}
Primary Goal: {{primary_goal}}
Style Blocker: {{style_blocker}}
--- END FORM DATA ---

Generate the following 6 sections in order.
Use the exact section headers provided.
Each section must be complete, specific, and personalised — no filler sentences.

---

## SECTION 1: YOUR FACE ARCHITECTURE PROFILE

Opening paragraph (3-4 sentences):
State the face shape and feature type. Explain what this means structurally — what proportions are at play. Set up why the recommendations below work for this specific geometry.

### Collar & Neckline Guide
List the 3 recommended collar/neckline types. For each:
- Name of collar/neckline
- One sentence explaining why it works for this face shape
- One specific garment application

### Collars to Avoid
List 2 collars/necklines to avoid. One sentence each explaining the geometric conflict.

### Hairstyle Recommendations
List 4 hairstyle recommendations. For each:
- Hairstyle name/description
- One sentence explaining why it works for this face shape and feature type
- One sentence on how to maintain or style it

### Facial Hair Guide
One paragraph (2-3 sentences) on facial hair. Be specific — not "keep it neat."

### Eyewear Guide
List 2-3 eyewear frame shapes that suit this face. One sentence each on why.

---

## SECTION 2: YOUR BODY GEOMETRY ANALYSIS

Opening paragraph (3-4 sentences):
State the silhouette type. Explain the structural strengths and the proportional challenges honestly. Frame it in terms of what the right clothing does — not what's "wrong" with the body.

### Your Structural Strengths
2-3 sentences on what this body type carries exceptionally well. Name the garment types, cuts, or details.

### Your Fit Blueprint
List the 4-5 silhouette rules from the classification. For each:
- The rule stated clearly (bold)
- One sentence explaining the geometric logic
- One practical application

### Cuts to Avoid
List 2-4 cuts/fits to avoid. For each: state the cut, explain why it conflicts with this body's geometry. No shame language.

### The Height Equation
One paragraph (2-3 sentences) specific to this client's height category. Explain specific adjustments — trouser break, jacket length, vertical vs horizontal elements.

---

## SECTION 3: YOUR CHROMATIC HARMONY MAP

Opening paragraph (3-4 sentences):
Name the colour season. Explain what it means in terms of depth, saturation, and contrast level. Connect it to this client's specific skin tone depth and undertone.

### Your Primary Palette
List the 6 colours from the classification. For each:
- Colour name
- Hex code in brackets
- Usage note
- One sentence on why this colour works with this season/tone combination

### Your Neutral Base
List the 3 neutral base colours. For each: name, hex, and one sentence on where to anchor it in the wardrobe.

### Your Accent Colours
List 2 accent colours. One sentence each on how to deploy them without overpowering the palette.

### Colours to Avoid
List 3 colours. For each: name, hex, and a specific explanation of why this colour conflicts with this profile.

### Pattern & Fabric Guidance
One paragraph (3-4 sentences): pattern scale, contrast level, and fabric texture direction specific to this season and tone depth.

---

## SECTION 4: YOUR 16 OUTFITS

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
ABSOLUTE BANNED GARMENTS \u2014 NEVER USE IN ANY OUTFIT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
The following are permanently prohibited regardless of client profile, season, or occasion:
\u2717 Skinny jeans (tapered below the knee, ankle-hugging silhouette)
\u2717 Slim-fit trousers with aggressive thigh-to-ankle taper (look for: "slim", "skinny", "spray-on" fit descriptors \u2014 all banned)
\u2717 Body-hugging or muscle-fit t-shirts (fabric stretched across chest/arms, revealing musculature)
\u2717 Stretch denim in any cut narrower than straight-leg
\u2717 Compression-style tops worn as outerwear
\u2717 Jeggings or denim with elastane construction in slim silhouettes
Any outfit that violates the above is invalid. If you notice a violation mid-generation, correct it before outputting.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
GARMENT VOCABULARY & FIT STANDARDS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Approved trouser silhouettes (use these exact descriptors):
  \u2022 Straight-leg \u2014 consistent width from hip to hem, clean break at shoe
  \u2022 Tailored straight \u2014 structured, mid-rise, slight taper only through knee (not below)
  \u2022 Wide-leg \u2014 relaxed through thigh and leg, contemporary proportion
  \u2022 Pleated trousers \u2014 single or double pleat, high-rise, full seat, straight leg
  \u2022 Chinos (straight or tailored straight only \u2014 never slim-leg chinos)
  \u2022 Cropped trousers \u2014 straight leg, no-break hem (smart casual/casual only \u2014 never for short clients)

Approved top silhouettes with frequency caps:
  \u2022 Classic-fit shirt \u2014 maximum 5 appearances across 16 outfits
  \u2022 Relaxed-fit shirt \u2014 maximum 3 appearances
  \u2022 Polo (classic fit only, never fitted) \u2014 maximum 3 appearances
  \u2022 Boxy or straight-cut tee \u2014 counts toward combined tee cap
  \u2022 Oversized tee \u2014 counts toward combined tee cap (boxy + oversized combined: maximum 3)
  \u2022 Knitwear (ribbed/cable/fine-gauge, always with ease) \u2014 maximum 3 appearances
  \u2022 Suit jacket as primary top layer \u2014 maximum 2 appearances

Approved outerwear:
  \u2022 Structured blazer / sport coat (single or double breasted)
  \u2022 Suit jacket
  \u2022 Unstructured linen/cotton blazer
  \u2022 Overcoat / topcoat (UK/Canada only \u2014 or cold-climate clients)
  \u2022 Trench coat
  \u2022 Bomber jacket (relaxed fit, not cropped tight)
  \u2022 Field jacket / harrington jacket
  \u2022 Knitwear layer (cardigan, zip-through)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FOOTWEAR TAXONOMY \u2014 USE ONLY THESE TERMS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Formal/Work:
  \u2022 Oxford (cap-toe, plain, brogue) \u2014 closed lacing, most formal
  \u2022 Derby \u2014 open lacing, slightly less formal, more toe box room
  \u2022 Loafer (penny, tassel, horsebit) \u2014 slip-on, smart casual to semi-formal
  \u2022 Chelsea boot \u2014 elastic side panel, clean ankle, works formal to smart casual

Smart Casual:
  \u2022 Suede loafer \u2014 relaxed material, smarter than trainers
  \u2022 Suede chukka boot \u2014 two-eyelet ankle boot, versatile
  \u2022 Derby in suede or textured leather
  \u2022 Clean white leather trainer \u2014 minimal, no chunky sole

Casual:
  \u2022 Canvas or leather low-top trainer (clean, minimal colourway)
  \u2022 Suede desert boot
  \u2022 Leather sandal (appropriate for India/UAE climates, warm months)

Always specify: shoe type + material + colour.
Example: "Tan suede penny loafer" or "Black leather cap-toe Oxford"

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FABRIC CLIMATE GATE \u2014 CHECK BEFORE GENERATING ANY OUTFIT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Read the client's location_region from classification. Apply the correct column as a hard gate \u2014 not a guideline.

India T1 / UAE:
  PERMITTED work fabrics: structured cotton, cotton-wool blend (max 20% wool), cotton-silk, linen-blend, matte polyester suiting.
  BANNED work fabrics (hard block): heavy wool, wool flannel, wool mohair, velvet, thick tweed.
  All categories: no heavy knitwear layers \u2014 light cotton knitwear only.

UK / Canada:
  All fabrics permitted: wool-blend, flannel, tweed, overcoat weight, heavy knitwear.

Mixed / Unknown \u2014 Default to India T1 rules.

Confirm which column applies before generating Outfit 1. A wool mohair suit in a UAE report is not a minor error \u2014 it breaks client trust in the entire report.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
ACCESSORY SYSTEM \u2014 4 TIERS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Do not default to belt in every outfit. Apply the correct tier per outfit.

Hardware rule \u2014 hardcoded from undertone:
  Warm undertone \u2192 gold hardware, cognac or tan leather
  Cool undertone \u2192 silver hardware, black or dark brown leather
  Neutral undertone \u2192 choose based on outfit colour temperature (warmer outfit = gold/cognac, cooler = silver/dark)

TIER 1 \u2014 Formal/Work (suit or blazer + trouser outfits):
  Specify: belt colour + buckle finish (per hardware rule) + watch type (dress watch or field watch) + pocket square colour if worn.
  Example: "Cognac leather belt, gold buckle \u2014 slim dress watch \u2014 ivory pocket square"

TIER 2 \u2014 Smart Casual (chino/blazer outfits):
  Specify: belt or explicitly state no belt + watch (optional) + bag type only if relevant (briefcase, canvas tote).
  Example: "No belt \u2014 brushed silver field watch"

TIER 3 \u2014 Casual (jeans/chinos + tee/polo/relaxed shirt):
  Specify: watch (optional) + chain only if undertone = warm (subtle, not statement) + bag only if functional (backpack, canvas tote).
  If no accessory adds genuine value, omit the Accessories line entirely.

TIER 4 \u2014 Events (Indian occasion outfits):
  No belt. Specify ethnic-appropriate accessory only if it genuinely suits the garment: dupatta fold placement, brooch, embroidered pocket detail.
  Do not force an accessory if none is natural to the garment.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SHORT CLIENT PROPORTION MODULE
Activate if: height_category = "short" (under 5'7")
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
If active, these rules override general silhouette rules for every outfit:

  \u2717 No cropped trousers in any outfit, any occasion
  \u2717 No ankle-exposed hemlines in any context
  \u2713 Trouser break: quarter break minimum, half break preferred (adds perceived leg length)
  \u2717 No wide-leg trousers unless top is extremely fitted AND tucked \u2014 state volume ratio in Fit Note
  \u2713 Blazer length: must reach the hip bone \u2014 no cropped or waist-length blazers
  \u2713 Vertical emphasis mandatory in \u226510 of 16 outfits: vertical seams, pinstripes, tonal top-to-bottom builds, longline layers
  \u2713 Monochromatic or tonal builds (top + bottom in same colour family, close value) count as vertical emphasis \u2014 must appear in \u22653 outfits

If fat_storage_zone = abdomen or torso (Short + Belly profile):
  \u2717 No horizontal break at the waist \u2014 no contrasting belt or strong two-tone colour block at the waistline
  \u2713 Tuck instruction: half-tuck or full tuck only \u2014 never untucked (untucked adds visual width at the widest point)
  \u2713 Blazer or structured layer creates vertical structure \u2014 prioritise in Work and Smart Casual categories

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
COLOUR RULES
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RULE 1 \u2014 COLOUR APPROACH:
The client's palette colours are a strong preference \u2014 target \u226510 of 16 outfits containing at least one palette colour.
Outfits are NOT restricted exclusively to palette colours.

Universal wardrobe staples are always permitted regardless of colour season or undertone:
  navy, white, off-white, charcoal, light grey, stone, camel, khaki, mid-blue, cream, burgundy, ecru

The ONLY hard block is the classification colours_to_avoid list. Nothing else is banned.

A Warm Autumn man dressed exclusively in warm tones looks like a paint swatch, not a wardrobe.
The colour season tells you what activates the skin \u2014 neutrals are the wardrobe foundation; palette colours are the differentiator.

RULE 2 \u2014 COLOUR COLLISION PREVENTION:
Never pair two colours from the same colour family in one outfit unless:
  (a) Value contrast is at least 40% \u2014 ivory + dark chocolate = acceptable; forest green + teal = not acceptable, AND
  (b) The intent is explicit tonal dressing \u2014 which must be named as such in the Colour Logic field.

RULE 3 \u2014 DIVERSITY:
Each outfit must have a distinct colour story. No repeated two-colour pairing across multiple outfits. If Outfit 3 uses navy + stone, Outfit 7 cannot also use navy + stone.

RULE 4 \u2014 COLOUR LOGIC FIELD FORMAT:
Label every piece as one of:
  [palette colour] \u2014 e.g. "Rich rust (#b5451b) \u2014 palette accent"
  [universal neutral] \u2014 e.g. "Navy (#1a2b4a) \u2014 universal neutral"
  [complementary tone] \u2014 e.g. "Sage (#8a9e7a) \u2014 complementary tone, not on avoid list"

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FREE NOTE TRANSLATION \u2014 OUTPUT BEFORE ANY OUTFIT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Before generating any outfit, output this line:

FREE NOTE TRANSLATION: [Convert the client's Free Note aspiration into specific garment types, colour names, and occasion terms. Be concrete \u2014 name the actual pieces and colours that embody this aesthetic for this specific man.]

Example: "Ralph Lauren for a dusky Indian man = navy blazer, cream Oxford shirt, stone/khaki chinos, tan penny loafers \u2014 warm rust and olive as accent colour entries."

If Free Note is absent or vague, write: "No free note \u2014 defaulting to style brief: [aesthetic_direction from classification]."

The \u22653 aspiration-anchored outfits rule is enforced against this translation. Every aspiration-anchored outfit must trace directly to a specific element in this translation.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
OUTFIT ORDERING RULE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Within each category, order outfits from HIGHEST-STAKES to LOWEST-STAKES.

Work category: the most formal entry (suit or structured blazer + trouser) must appear within the first 4 outfits of the Work category \u2014 never saved for last.

If lifestyle context includes Corporate or Client Facing: a suit or formal blazer composition must be Outfit 1 or Outfit 2 of the entire report.

The first outfit the client reads sets the quality benchmark for the whole report. If Outfit 1 is weak, the perceived value of everything that follows drops.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
PRE-GENERATION DECLARATION \u2014 OUTPUT BEFORE OUTFIT 1
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Before writing the first category header, output this complete block. Do not skip any field.

PRE-GENERATION CHECK
Free Note Translation: [one sentence]
Outfit split confirmed: [Category] [N] / [Category] [N] / [Category] [N] / [Category] [N] = 16 total
Top silhouette distribution: Classic-fit shirt [N] / Relaxed-fit shirt [N] / Polo [N] / Tee [N] / Knitwear [N] / Other [N]
Cap compliance: Classic-fit \u22645 [\u2713/\u2717] / Relaxed \u22643 [\u2713/\u2717] / Polo \u22643 [\u2713/\u2717] / Tee \u22643 [\u2713/\u2717] / Knitwear \u22643 [\u2713/\u2717] \u2014 if any \u2717, revise distribution before proceeding.
Location: [location_region] \u2192 Fabric matrix: [India T1 / International]
Colours to avoid (hard block): [list from classification colours_to_avoid]
Universal neutrals planned: [list]
Palette colours in \u226510 outfits: [confirmed / count]
Short-client module: [Active \u2014 rules applied to all 16 / Not active]

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
OUTFIT FORMAT \u2014 REQUIRED FOR ALL 16
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

For each outfit category (from outfit_split in classification), open with:
Category intro (2 sentences): Objective of this category for this specific client \u2014 what role these outfits play in his life, and what they should achieve for his presence.

Then for each outfit, use this exact structure:

**Outfit [N] \u2014 [Two to three word occasion/mood label]**

- Top: [garment type] in [colour name] ([hex]) \u2014 [fit descriptor: classic-fit / relaxed-fit / boxy / oversized] \u2014 [fabric: e.g. brushed cotton, fine merino, linen, heavy Oxford cloth] \u2014 [tuck instruction: tucked / untucked / half-tuck]
- Bottom: [trouser type from approved list] in [colour name] ([hex]) \u2014 [rise: mid-rise / high-rise] \u2014 [fabric: e.g. cotton twill, linen, stretch-free denim] \u2014 [break: no break / quarter break / half break]
- Layer: [specific outerwear type] in [colour name] ([hex]) \u2014 [worn: open / closed / over-arm] | or: No layer
- Footwear: [type + material + colour from approved taxonomy] \u2014 [sock note: no-show / fine cotton / wool ribbed / no socks]
- Accessories: [Apply the correct tier from the 4-tier accessory system. If Tier 3 or 4 warrants no accessories, omit this line entirely \u2014 do not default to a belt.]
- Fit note: [One sentence on how each piece physically fits this client's body geometry \u2014 reference silhouette type, highlight/minimise zones, and any active short-module rules]
- Colour logic: [Label every piece as palette colour / universal neutral / complementary tone \u2014 with colour name and hex for each piece]
- Occasion anchor: [One sentence \u2014 "Wear this to [specific situation] \u2014 it signals [specific quality] to [specific audience]."]

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FULL GENERATION CHECKLIST \u2014 ALL 16 MUST PASS BEFORE OUTPUT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
\u2713 COLOUR APPROACH: Palette as preference (\u226510/16 outfits). Universal neutrals freely used. colours_to_avoid hard-blocked. Nothing else banned.
\u2713 COLOUR COLLISION: No same-family pairing without 40% value contrast AND explicit tonal naming in Colour Logic.
\u2713 DIVERSITY: Each outfit has a distinct colour story. No repeated two-colour pairing across outfits.
\u2713 SILHOUETTE COMPLIANCE: Every bottom = approved trouser silhouette. Every top = approved top silhouette.
\u2713 FREQUENCY CAPS: Classic-fit \u22645 / Relaxed \u22643 / Polo \u22643 / Tee \u22643 / Knitwear \u22643. Declared in pre-generation block.
\u2713 OUTFIT ORDERING: Work opens with most formal entry. Suit/formal blazer = Outfit 1 or 2 if Corporate/Client Facing.
\u2713 FABRIC CLIMATE: Correct matrix applied. Banned fabrics absent from all India T1/UAE outfits.
\u2713 ACCESSORY TIER: Correct tier per outfit. Hardware matches undertone. No belt-as-filler default.
\u2713 SHORT MODULE: If active \u2014 no cropped trousers, correct breaks, vertical emphasis in \u22656, tonal in \u22653, tuck rule applied.
\u2713 STYLE BRIEF: Every outfit traceable to aesthetic direction and register from classification.
\u2713 UNIQUENESS: No two outfits share the same top + bottom combination.
\u2713 ASPIRATION: \u22653 outfits match Free Note Translation directly.
\u2713 CATEGORY INTEGRITY: Casual outfits at same colour + silhouette precision as work outfits.
\u2713 LAYERING LOGIC: Layer only if functional or proportional. Specify open/closed. Never decorative filler.
\u2713 FOOTWEAR REGISTER: Shoe formality matches tier. No trainers in Work/Formal. No Oxfords in Casual.
\u2713 FABRIC OCCASION: Fabric suits occasion tier. No linen in formal corporate. No heavy tweed in casual.
\u2713 PROPORTION SYSTEM: Volume bottom \u2192 structured/tucked top. Volume top \u2192 clean straight bottom.
\u2713 BANNED GARMENTS: No skinny jeans, no slim-tapered trousers, no muscle-fit tops in any outfit.

---

## SECTION 5: YOUR STYLE RULES

### 5 Always Rules
Five rules specific to this client's body + colour + style brief combination.
Not generic advice. Each rule must be traceable to the classification.
Format: **[Rule title]** — [2 sentence explanation with specific application]

### 3 Never Rules
Three rules specific to what this client must avoid based on his profile.
Same format. No shame language — frame as optimisation, not restriction.

---

## SECTION 6: YOUR STYLE IDENTITY STATEMENT

One paragraph, 5-7 sentences.
Write directly to the client about who he is stylistically — what his profile says about him, what his aspiration tells you about his self-concept, and what his wardrobe can do for him.
Reference his Free Note vision without quoting it.
Close with one forward-looking sentence about what consistent dressing at this level will do for his presence and confidence.
This paragraph should read like it was written by a senior stylist who genuinely understands this man.
Do not be generic. Do not use phrases like "your unique style journey."`;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ClassificationResult {
  client: {
    location_region: string;
    height_category: string;
    primary_goal: string;
  };
  body: {
    silhouette_type: string;
    fat_storage_zone: string;
    highlight_zone: string;
    minimise_zone: string;
    fit_directive: string;
    height_adjustment: string;
    silhouette_rules: string[];
    avoid_cuts: string[];
  };
  face: {
    face_shape: string;
    feature_type: string;
    neckline_recommendations: string[];
    necklines_to_avoid: string[];
    hairstyle_recommendations: string[];
    facial_hair_recommendations: string;
    eyewear_shapes: string[];
  };
  colour: {
    season: string;
    undertone: string;
    skin_tone_depth: string;
    primary_palette: Array<{ name: string; hex: string; usage: string }>;
    neutral_base_colours: Array<{ name: string; hex: string }>;
    accent_colours: Array<{ name: string; hex: string }>;
    colours_to_avoid: Array<{ name: string; hex: string; reason: string }>;
    pattern_guidance: string;
    fabric_tone_guidance: string;
  };
  style_brief: {
    primary_brief: string;
    aesthetic_direction: string;
    tribes: string[];
    register: string;
    expression: string;
    structure_level: string;
    anti_preferences: string;
    style_blocker: string;
    key_aspiration: string;
  };
  outfit_split: {
    total: number;
    categories: Array<{ category: string; count: number; rationale: string }>;
  };
}

export interface ReportSections {
  s1_face: string;
  s2_body: string;
  s3_colour: string;
  s4_outfits: string;
  s5_rules: string;
  s6_identity: string;
}

export interface ReportData {
  classification: ClassificationResult;
  sections: ReportSections;
  generated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Field value maps — DB enum → human-readable
// ─────────────────────────────────────────────────────────────

const FIELD_MAPS: Record<string, Record<string, string>> = {
  primary_goal: {
    body_shape:      'Dress better for my body shape',
    signature_style: 'Build a signature style',
    professional:    'Look more professional',
    body_change:     'Refresh after significant body change',
    underdressed:    'Stop looking underdressed',
  },
  style_relationship: {
    safe_rotation:    'Tend to wear the same safe rotation',
    buy_nothing_fits: 'Buy clothes but nothing fits right',
    avoidance:        'Avoid thinking about clothes entirely',
    comfort_first:    'Prioritise comfort above all else',
    starting_fresh:   'Starting fresh — minimal wardrobe currently',
  },
  location_tier: {
    india_t1:   'India — Tier 1 (Mumbai, Delhi, Bangalore, Hyderabad)',
    india_t2:   'India — Tier 2 city',
    uk:         'United Kingdom',
    uae:        'UAE',
    canada_usa: 'Canada / USA',
    other:      'International — Other',
  },
  height_category: {
    short:        "Short (under 5'7\")",
    average:      "Average (5'7\"–5'10\")",
    tall_average: "Tall-average (5'10\"–6'0\")",
    tall:         "Tall (6'0\" and above)",
  },
  skin_tone: {
    porcelain: 'Porcelain / Very Fair',
    fair:      'Fair',
    wheatish:  'Wheatish',
    dusky:     'Dusky',
    deep:      'Deep / Dark',
  },
  vein_undertone: {
    cool:    'Cool (blue/purple veins)',
    warm:    'Warm (green/olive veins)',
    neutral: 'Neutral (mix of both)',
    unclear: 'Unclear',
  },
  white_test: {
    bright_white: 'Bright white suits better',
    cream:        'Cream / off-white suits better',
    both:         'Both work equally',
    avoids:       'Avoids white entirely',
  },
  fit_preference: {
    fitted:         'Fitted / close to body',
    structured:     'Structured / tailored',
    relaxed:        'Relaxed / easy fit',
    open_to_fitted: 'Open to fitted if it looks good',
  },
  style_blocker: {
    nothing_fits:   'Nothing fits my body well off-the-rack',
    dont_know_body: "Don't know my body type or what suits me",
    buy_never_wear: 'Buy clothes I never end up wearing',
    no_system:      'No system — shop randomly and hope it works',
    budget:         'Budget constraints limit my options',
    overwhelmed:    'Overwhelmed by too many choices',
  },
  style_anti_pref: {
    yes_colour:     'Yes — specific colours I avoid',
    yes_silhouette: 'Yes — specific silhouettes I avoid',
    yes_category:   'Yes — specific garment categories I avoid',
    no_wear_told:   'No — I wear what I am told works',
    never_thought:  "No — I've never thought about it",
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function cleanJson(text: string): string {
  return text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

function readable(val: string | null | undefined): string {
  if (!val) return 'Not specified';
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function mapField(field: string, val: string | null | undefined): string {
  if (!val) return 'Not specified';
  return FIELD_MAPS[field]?.[val] ?? readable(val);
}

function parseMulti(val: string | null | undefined): string {
  if (!val) return 'Not specified';
  try {
    const arr = JSON.parse(val);
    if (Array.isArray(arr)) return arr.map(v => readable(String(v))).join(', ');
  } catch { /* not JSON array */ }
  return val.split(',').map(v => readable(v.trim())).join(', ');
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [key, val]) => t.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || 'Not specified'),
    template
  );
}

function buildTemplateVars(sub: ManIntakeSubmission): Record<string, string> {
  return {
    email:              sub.customer_email          ?? 'Not provided',
    location:           mapField('location_tier',      sub.location_tier),
    primary_goal:       mapField('primary_goal',        sub.primary_goal),
    style_relationship: mapField('style_relationship',  sub.style_relationship),
    dressing_context:   parseMulti(sub.dressing_context),
    wardrobe:           parseMulti(sub.wardrobe_composition),
    height:             mapField('height_category',     sub.height_category),
    body_shape:         readable(sub.body_shape),
    fat_storage:        readable(sub.fat_storage_zone),
    highlight_zone:     readable(sub.highlight_zone),
    minimise_zone:      readable(sub.minimise_zone),
    fit_preference:     mapField('fit_preference',      sub.fit_preference),
    skin_tone:          mapField('skin_tone',            sub.skin_tone),
    undertone:          mapField('vein_undertone',       sub.vein_undertone),
    white_test:         mapField('white_test',           sub.white_test),
    hair_colour:        readable(sub.hair_colour),
    eye_colour:         readable(sub.eye_colour),
    colour_season:      readable(sub.derived_colour_season),
    face_shape:         readable(sub.face_shape),
    feature_type:       readable(sub.facial_feature_type),
    style_goal:         readable(sub.primary_style_goal),
    branch_answer:      readable(sub.branch_answer),
    style_tribes:       parseMulti(sub.style_tribes),
    structure:          readable(sub.style_pole_structure),
    expression:         readable(sub.style_pole_expression),
    tone:               readable(sub.style_pole_tone),
    register:           readable(sub.style_pole_register),
    style_blocker:      mapField('style_blocker',        sub.style_blocker),
    anti_pref:          mapField('style_anti_pref',      sub.style_anti_pref),
    free_note:          sub.free_text_note              ?? 'Not provided',
  };
}

function parseReportSections(text: string): ReportSections {
  const sectionMap: Record<string, string> = {};

  // Split on section headers, keeping the header as part of the content
  const parts = text.split(/(##\s*SECTION\s*\d+:[^\n]*)/i);

  for (let i = 1; i < parts.length; i += 2) {
    const header  = parts[i];
    const content = (parts[i + 1] ?? '').trim();
    const numMatch = header.match(/SECTION\s*(\d+)/i);
    if (numMatch) {
      sectionMap[numMatch[1]] = `${header.trim()}\n\n${content}`.trim();
    }
  }

  return {
    s1_face:     sectionMap['1'] ?? '',
    s2_body:     sectionMap['2'] ?? '',
    s3_colour:   sectionMap['3'] ?? '',
    s4_outfits:  sectionMap['4'] ?? '',
    s5_rules:    sectionMap['5'] ?? '',
    s6_identity: sectionMap['6'] ?? '',
  };
}

// ─────────────────────────────────────────────────────────────
// Gemini call wrappers
// ─────────────────────────────────────────────────────────────

async function callGeminiJSON(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: combined }] }],
  });
  const text    = response.text ?? '';
  const cleaned = cleanJson(text);
  return JSON.parse(cleaned);
}

async function callGeminiText(systemPrompt: string, userPrompt: string, maxOutputTokens?: number): Promise<string> {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: combined }] }],
    ...(maxOutputTokens ? { config: { maxOutputTokens } } : {}),
  });
  return response.text ?? '';
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function runClassification(
  submission: ManIntakeSubmission
): Promise<ClassificationResult> {
  const vars       = buildTemplateVars(submission);
  const userPrompt = fillTemplate(CLASSIFICATION_USER_TEMPLATE, vars);
  const result     = await callGeminiJSON(CLASSIFICATION_SYSTEM_PROMPT, userPrompt);
  return result as ClassificationResult;
}

export async function runReportGeneration(
  classification: ClassificationResult,
  submission: ManIntakeSubmission
): Promise<ReportSections> {
  const userPrompt = fillTemplate(REPORT_USER_TEMPLATE, {
    classification_json: JSON.stringify(classification, null, 2),
    free_note:           submission.free_text_note ?? 'Not provided',
    primary_goal:        mapField('primary_goal',   submission.primary_goal),
    style_blocker:       mapField('style_blocker',  submission.style_blocker),
  });
  const text = await callGeminiText(REPORT_SYSTEM_PROMPT, userPrompt);
  return parseReportSections(text);
}

// ─────────────────────────────────────────────────────────────
// Per-section generation (progressive pipeline)
// Each function makes one Gemini call for a single section.
// ─────────────────────────────────────────────────────────────

const SECTION_USER_PREAMBLE_TEMPLATE = `Write ONE section of the ICONIK Men's Style Blueprint.
Use the classification data and original form data provided below.
Write ONLY the single section requested. Use the exact section header provided.
The section must be complete, specific, and personalised — no filler sentences.

--- CLASSIFICATION JSON ---
{{classification_json}}
--- END CLASSIFICATION ---

--- ORIGINAL FORM DATA (reference only) ---
Free Note: {{free_note}}
Primary Goal: {{primary_goal}}
Style Blocker: {{style_blocker}}
--- END FORM DATA ---

Write the following section now:

---

`;

// Extract the 6 section instruction blocks from the combined template at module load time.
// Sections in REPORT_USER_TEMPLATE are separated by '\n\n---\n\n' and each starts with '## SECTION'.
const _SECTION_BLOCKS = REPORT_USER_TEMPLATE
  .split('\n\n---\n\n')
  .filter(block => block.trimStart().startsWith('## SECTION'));

function buildSectionUserPrompt(
  sectionIndex: number,
  classification: ClassificationResult,
  submission: ManIntakeSubmission
): string {
  const preamble = fillTemplate(SECTION_USER_PREAMBLE_TEMPLATE, {
    classification_json: JSON.stringify(classification, null, 2),
    free_note:           submission.free_text_note ?? 'Not provided',
    primary_goal:        mapField('primary_goal',  submission.primary_goal),
    style_blocker:       mapField('style_blocker', submission.style_blocker),
  });
  return preamble + _SECTION_BLOCKS[sectionIndex];
}

export async function runSection1(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(0, classification, submission));
}

export async function runSection2(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(1, classification, submission));
}

export async function runSection3(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(2, classification, submission));
}

/** Strip the PRE-GENERATION CHECK block and FREE NOTE TRANSLATION line that the model
 *  outputs as planning text before writing the actual outfits. These should not appear
 *  in the saved section content or in the rendered report. */
function stripSection4Preamble(text: string): string {
  return text
    .replace(/^FREE NOTE TRANSLATION:.*$/gim, '')
    .replace(/^PRE-GENERATION CHECK\s*$/gim, '')
    .replace(/^(?:Free Note Translation|Outfit split confirmed|Top silhouette distribution|Cap compliance|Location|Colours to avoid \(hard block\)|Universal neutrals planned|Palette colours[^:]*|Short-client module):.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function runSection4(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  const raw = await callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(3, classification, submission), 65536);
  return stripSection4Preamble(raw);
}

export async function runSection5(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(4, classification, submission));
}

export async function runSection6(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(5, classification, submission));
}
