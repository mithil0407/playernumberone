// manReportGenerator.ts
// Two-prompt sequential pipeline for ICONIK Men's Blueprint generation.
// Prompt 1 → Classification JSON (deterministic science layer)
// Prompt 2 → Full report copy (voice layer, depends on Prompt 1 output)

import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import type { ManIntakeSubmission } from './supabaseMan';
import {
  validateManReportSection4,
  type ManReportQaIssue,
  type ManReportQaResult,
} from './manReportQa';
import { normaliseComboGridText } from './manComboGridSection';

const OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/outfitrecommendationskill.md'), 'utf-8'
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export type HairPresence = 'full_hair' | 'thinning_or_receding' | 'closely_shaved' | 'bald' | 'unclear';
export type FacialHairPresence = 'clean_shaven' | 'stubble' | 'short_beard' | 'full_beard' | 'moustache' | 'unclear';
export type GroomingFocus = 'hairstyle' | 'beard';

export interface GroomingImageProfile {
  hair_presence: HairPresence;
  facial_hair_presence: FacialHairPresence;
  confidence: number;
  evidence: string;
}

const CONFIDENT_GROOMING_THRESHOLD = 0.68;
const GROOMING_IMAGE_MAX_BYTES = 18 * 1024 * 1024;
const GROOMING_IMAGE_MAX_DIMENSION = 1600;

const DEFAULT_GROOMING_PROFILE: GroomingImageProfile = {
  hair_presence: 'unclear',
  facial_hair_presence: 'unclear',
  confidence: 0,
  evidence: 'No confident image-derived grooming profile available.',
};

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
  Tribe aesthetics and Style Goal inform secondary parameters only.
- Image-derived grooming profile is source-of-truth when confidence is 0.68 or higher.
- If the image-derived hair_presence is "bald" or "closely_shaved", set grooming_focus to "beard", never recommend adding scalp hair, and never recommend hairstyles requiring volume, density, fringe, quiff, crops with visible fullness, or fuller hair.
- If hair_presence is "thinning_or_receding", keep grooming_focus as "hairstyle" but recommend only realistic low-density grooming: buzz cut, close crop, clean shave transition, or beard-balancing options. Do not recommend full-volume hair.
- If grooming profile confidence is below 0.68 or hair_presence is "unclear", use the existing hairstyle flow.
- Generate exactly 4 hairstyle recommendations, 4 beard style recommendations, and 4 eyewear recommendations.
- Recommendation order is visual grid order: option 1 = top-left, option 2 = top-right, option 3 = bottom-left, option 4 = bottom-right.
- Option 1 must always be the safest, most achievable, highest-confidence recommendation for the client.
- Grooming recommendations must be conservative, realistic, barber-executable, and compatible with visible/self-reported hair density and facial hair density.
- Never recommend unrealistic hair volume, dramatic identity changes, fantasy density, sharp trend cuts, or beard growth the client cannot plausibly execute.
- Eyewear recommendations must include exactly 2 optical eyeglass frames first, then exactly 2 sunglasses options.

HEX CODE ACCURACY — CRITICAL:
Every hex code you produce must be visually accurate. The rendered colour swatch MUST match what a human expects when reading the colour name.
Never hallucinate or approximate hex codes. Use the canonical, widely-recognised hex for each named colour.
Mandatory reference anchors (use these exact ranges):
  - olive / olive green → #6B6B00 to #808000 (dark yellow-green, NOT light green)
  - camel → #C19A6B to #C09A5B
  - burgundy / wine → #800020 to #722F37
  - navy → #001F5B to #003087
  - charcoal → #36454F to #454545
  - cream / ivory → #FFFDD0 to #FFFFF0
  - tan → #D2B48C to #C4A882
  - dark tan → #A0785A to #8B6340
  - forest green → #228B22 to #1B5E20
  - teal → #008080 to #004D40
  - rust → #B7410E to #A0522D
  - dusty rose → #DCAE96 to #C4887A
  - slate blue → #6A7FA8 to #5B6E8F
  - off-white → #F5F5F0 to #FAF9F6
  - cobalt → #0047AB to #003D9E
  - mauve → #8E4585 to #7B3F6E
If unsure of a colour's hex, choose a darker/more saturated version rather than a light pastel — most style palette colours lean mid-depth, not pale.`;

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

--- IMAGE-DERIVED GROOMING PROFILE ---
{{grooming_profile}}
--- END GROOMING PROFILE ---

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
    "hair_presence": "",
    "facial_hair_presence": "",
    "grooming_focus": "",
    "grooming_image_confidence": 0,
    "grooming_image_evidence": "",
    "hairstyle_recommendations": ["", "", "", ""],
    "beard_style_recommendations": ["", "", "", ""],
    "beard_maintenance": "",
    "facial_hair_recommendations": "",
    "eyewear_shapes": ["", "", "", ""],
    "skincare_routine": {
      "morning": ["", "", ""],
      "evening": ["", ""],
      "shaving_or_beard_area": "",
      "skin_adjustment": ""
    }
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
    "total": 20,
    "categories": [
      {"category": "Office / Formal", "count": 6, "rationale": "Office, formal workplace, client-facing, presentations, polished professional presence"},
      {"category": "Smart Casual", "count": 4, "rationale": "Business casual, startup office, client lunches, elevated day-to-evening dressing"},
      {"category": "Evening Wear", "count": 5, "rationale": "Dinner, parties, dates, social evenings, stronger personality dressing"},
      {"category": "Relaxed Casual", "count": 5, "rationale": "Weekends, coffee, travel, errands, social hangouts, practical off-duty dressing"}
    ]
  }
}

OUTFIT SPLIT — always use this exact fixed split regardless of dressing context:
  Office / Formal: 6 | Smart Casual: 4 | Evening Wear: 5 | Relaxed Casual: 5 = 20 total

SKINCARE ROUTINE — keep it basic, non-medical, and product-type only:
  Morning must cover cleanser, moisturiser, sunscreen.
  Evening must cover cleanser and moisturiser.
  Shaving/beard-area guidance must be practical and tied to visible/self-reported grooming, without diagnosing skin conditions.
  Do not name brands, actives, treatments, prescriptions, acne protocols, or medical claims.`;

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

Generate the following sections in order.
Use the exact section headers provided.
Each section must be complete, specific, and personalised — no filler sentences.

---

## SECTION 0: YOUR PERSONAL STYLE SNAPSHOT

Opening paragraph (3-4 sentences):
Summarise this man's style direction, body priority, colour direction, grooming direction, and what the wardrobe must do for him now.

### Your Top 3 Priorities
3 bullets exactly. Each bullet must be specific, actionable, and tied to his intake.

### What Changes First
One paragraph explaining the highest-return change across clothes, grooming, and shopping behaviour.

---

## SECTION 1: YOUR FACE ARCHITECTURE PROFILE

Opening paragraph (3-4 sentences):
State the face shape and feature type. Explain what this means structurally — what proportions are at play. Set up why the recommendations below work for this specific geometry.

### Beard & Facial Hair Guide
One paragraph (3-4 sentences) on facial hair for this client, even if he is currently clean-shaven. Include best beard/stubble length, cheek line, neckline, moustache direction when relevant, what to avoid, and maintenance frequency. Do not force a full beard; clean-shaven can be the answer if it is best.

### Grooming & Collar Direction
3 bullets maximum. If grooming_focus is "beard", rename this subheading to exactly "### Beard Style & Collar Direction" and cover beard style direction instead of hairstyle direction; otherwise keep this subheading and cover hairstyle direction. Also cover neckline/collar shape and watch/accessory metal direction. Tie every recommendation to face geometry, feature type, undertone, or register. For bald or closely shaved clients, do not mention growing scalp hair or adding hair volume. The image grid labels are rendered separately by the report UI; do not write corner-label copy here.

### Eyewear Guide
List exactly 4 eyewear recommendations in this order: top-left optical frame, top-right optical frame, bottom-left sunglasses, bottom-right sunglasses. One sentence each on why. Do not describe these as embedded image labels; the report UI handles the corner labels.

---

## SECTION 2: YOUR BODY GEOMETRY ANALYSIS

One sentence: name the silhouette type and the single most important clothing principle for this frame.

### Structural Strengths
3 bullet points maximum. Each bullet: one garment type or cut this body carries exceptionally well. No filler sentences.

### Fit Blueprint
4-5 bullet points. Each bullet: one rule stated clearly in bold, then a dash, then one sentence of geometric logic. No sub-bullets, no examples.

### Ready-To-Wear Fit Diagnostics
7 bullets exactly. Cover shirt length, shoulder fit, sleeve width, trouser rise, trouser break, shoe shape, and fabric weight for India/UAE climates. Make each bullet a practical off-the-rack shopping diagnostic; do not make tailoring the main solution.

### Cuts to Avoid
3 bullet points maximum. Each: cut name in bold, dash, one sentence on why it conflicts. No shame language.

### Height Equation
2 bullet points. Each: one specific adjustment (trouser break, jacket length, or vertical/horizontal element).

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

### Practical Colour Rules
5 bullets exactly:
- Best neutrals
- Safest shirt colours
- Best leather/shoe colours
- Best metal direction
- High-risk colours and how to avoid them

---

## SECTION 4: YOUR 20 OUTFITS

The ICONIK Outfit Recommendation Skill has been injected above. Follow it exactly — all constraint rules, format, and context splits are defined there.

Generate all 20 outfits now using the format from Section 13 of the skill:
- Outfits 1–6: OFFICE / FORMAL
- Outfits 7–10: SMART CASUAL
- Outfits 11–15: EVENING WEAR
- Outfits 16–20: RELAXED CASUAL

---
BANNED GARMENTS \u2014 INTERNAL INSTRUCTION, DO NOT OUTPUT THIS SECTION HEADER
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Only one garment type is banned:
\u2717 Skinny jeans \u2014 ankle-hugging, spray-on fit below the knee
Everything else is permitted \u2014 slim-fit trousers, tapered chinos, fitted tees, stretch denim, slim-straight cuts \u2014 all fine.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
GARMENT VOCABULARY \u2014 DIVERSITY IS MANDATORY
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
BOTTOMS \u2014 use at least 5 different types across 20 outfits, no single type should dominate:
  \u2022 Straight-leg jeans (raw denim, washed, or lightly distressed \u2014 vary the wash)
  \u2022 Slim-straight jeans (fitted through thigh, straight below knee)
  \u2022 Wide-leg trousers (relaxed through thigh and leg)
  \u2022 Tailored trousers (pleated or flat-front)
  \u2022 Chinos (any fit)
  \u2022 Cargo / utility trousers
  \u2022 Linen trousers
  \u2022 Cropped trousers (not for short clients)
  \u2022 Corduroy trousers
  \u2022 Jogger-style trousers in structured fabric (casual only)

TOPS \u2014 use at least 6 different types across 20 outfits. Avoid repeating the same type more than 4 times:
  \u2022 Dress shirt (any fit)
  \u2022 Casual button-down / Oxford shirt
  \u2022 Linen shirt (relaxed or camp collar)
  \u2022 Cuban / camp collar shirt
  \u2022 Polo shirt
  \u2022 Crew-neck or V-neck t-shirt (any fit)
  \u2022 Henley
  \u2022 Turtleneck / roll-neck
  \u2022 Knitwear (crew-neck, V-neck, cable-knit, fine-gauge)
  \u2022 Band-collar / mandarin-collar shirt
  \u2022 Printed / patterned shirt (geometric, abstract, stripes \u2014 NO floral prints)
  \u2022 Kurta (Indian occasion)

LAYERS & OUTERWEAR \u2014 use at least 4 different layer types across the 20 outfits:
  \u2022 Structured blazer (single or double breasted)
  \u2022 Unstructured / deconstructed blazer
  \u2022 Leather jacket (biker, caf\u00e9 racer, or classic)
  \u2022 Suede jacket
  \u2022 Bomber jacket
  \u2022 Denim jacket
  \u2022 Field jacket / utility jacket
  \u2022 Harrington jacket
  \u2022 Overshirt / shirt jacket (shacket)
  \u2022 Cardigan (chunky, fine-gauge, or zip-through)
  \u2022 Gilet / vest (quilted or knit)
  \u2022 Trench coat
  \u2022 Overcoat / topcoat (cold climates)
  \u2022 Nehru jacket / bandh-gala (Indian occasion)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FOOTWEAR \u2014 use at least 5 different types across 20 outfits
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Formal:
  \u2022 Oxford (cap-toe, plain, brogue) \u2014 closed lacing, most formal
  \u2022 Derby \u2014 open lacing, slightly less formal
  \u2022 Loafer (penny, tassel, horsebit) \u2014 slip-on, smart casual to semi-formal
  \u2022 Chelsea boot \u2014 elastic side panel, formal to smart casual

Casual / Evening:
  \u2022 Suede loafer or suede chukka boot
  \u2022 Derby in suede or textured leather
  \u2022 Clean white leather trainer \u2014 minimal
  \u2022 Canvas or leather low-top trainer
  \u2022 Suede desert boot
  \u2022 Chunky-sole sneakers (leather or canvas)
  \u2022 Leather sandal (India/UAE warm months)

Always specify: shoe type + material + colour.
Example: "Tan suede penny loafer" or "Black leather cap-toe Oxford"

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FABRIC CLIMATE GATE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Read the client's location_region from classification.

India T1 / UAE:
  PERMITTED: structured cotton, cotton-wool blend (max 20% wool), cotton-silk, linen-blend, matte polyester suiting.
  BANNED: heavy wool, wool flannel, wool mohair, velvet, thick tweed.
  Light cotton knitwear only \u2014 no heavy knitwear layers.

UK / Canada:
  All fabrics permitted: wool-blend, flannel, tweed, overcoat weight, heavy knitwear.

Mixed / Unknown \u2014 Default to India T1 rules.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
ACCESSORY SYSTEM \u2014 3 TIERS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Do not default to belt in every outfit.

Hardware rule from undertone:
  Warm undertone \u2192 gold hardware, cognac or tan leather
  Cool undertone \u2192 silver hardware, black or dark brown leather
  Neutral undertone \u2192 choose based on outfit colour temperature

TIER 1 \u2014 Formal:
  Belt + watch + pocket square (if blazer/suit). Specify colours and finishes.
  Example: "Cognac leather belt, gold buckle \u2014 slim dress watch \u2014 ivory pocket square"

TIER 2 \u2014 Evening Wear:
  Watch or statement accessory (chain, bracelet, rings). Belt optional.
  Example: "Silver chain \u2014 black leather strap watch"

TIER 3 \u2014 Casual:
  Only if it adds genuine value. No belt-as-filler default.
  If no accessory improves the outfit, omit the Accessories line entirely.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SHORT CLIENT PROPORTION MODULE
Activate if: height_category = "short" (under 5'7")
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
If active, apply these guidelines:
  \u2717 No cropped trousers
  \u2713 Trouser break: quarter break minimum, half break preferred
  \u2713 Blazer length: must reach the hip bone
  \u2713 Favour tonal or monochromatic builds for vertical elongation

If fat_storage_zone = abdomen or torso (Short + Belly profile):
  \u2713 Prefer half-tuck or full tuck
  \u2713 Favour structured layers (blazer, overshirt) to create vertical structure

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
COLOUR RULES
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RULE 1 \u2014 COLOUR FREEDOM WITH PURPOSE:
Any colour family is permitted in any outfit. The client's primary palette colours are NOT a default — do NOT cluster outfits around the palette colours just because they are listed there. Treat the palette as one data source among many, not as the outfit colour guide.
The ONLY hard block: the classification colours_to_avoid list. Everything else is open.
The client's primary palette already covers his signature colours — the 20 outfits should go BEYOND that narrow range and demonstrate the full breadth of a well-built wardrobe.

RULE 2 \u2014 UNDERTONE SHAPES SHADE, NOT COLOUR FAMILY:
The client's undertone determines WHICH SHADE to pick within a colour family — it does NOT restrict which families are available.
  Warm undertone \u2192 reach for warm-shifted shades: teal-blue (not icy blue), moss or olive green (not mint), amber, rust, terracotta, warm burgundy, camel, tobacco, dusty rose
  Cool undertone \u2192 reach for cool-shifted shades: cobalt blue, true navy, emerald green, plum, icy grey, slate, mauve, cool white, silver-toned neutrals
  Neutral undertone \u2192 both temperature directions work; anchor in mid-depth shades
A warm-undertone client SHOULD wear blue, green, purple, grey — he just picks the warmer-shifted version of each. A cool-undertone client SHOULD wear earth tones — he just picks cooler-shifted versions (slate green vs olive, cool taupe vs camel). Never let undertone become a reason to stay in one colour zone.

RULE 3 \u2014 COLOUR PAIRING STRATEGY (required per outfit):
Every outfit must follow one of these four named pairing strategies. State the strategy name in the Colour Logic field:
  TONAL \u2014 shades of the same family across all pieces (e.g. warm white shirt + stone chinos + sand suede loafer)
  ANALOGOUS \u2014 adjacent colour families on the wheel (e.g. olive + rust, navy + forest green, camel + warm brown)
  NEUTRAL ANCHOR + ACCENT \u2014 two neutrals as the base + one colour as the focal point (e.g. charcoal + ivory + deep teal accent)
  DARK/LIGHT CONTRAST \u2014 one deep shade + one light shade, matched in temperature (e.g. dark burgundy + cream, midnight navy + soft white)

RULE 4 \u2014 OCCASION COLOUR TEMPERATURE:
Colour choice must respect the context of each category:
  OFFICE / FORMAL (outfits 1\u20136): Dominant colour must be a sober, authoritative tone \u2014 navy, charcoal, dark grey, stone, ivory, dark burgundy, dark forest green, mid-blue, chocolate brown, or black. A creative or fashion-forward primary_brief may introduce one structured bold colour, but in no more than 1 of the 6 office/formal looks.
  SMART CASUAL (outfits 7\u201310): Polished but easy. Expand from power neutrals into accents, textured shirts, elevated polos, relaxed tailoring, and client-lunch outfits.
  EVENING WEAR (outfits 11\u201315): Rich, confident, sophisticated. Jewel tones, bold monochromes, deep saturated shades. Avoid safe neutrals here \u2014 evening is the correct context for the palette's accent colours and for maximum colour impact.
  RELAXED CASUAL (outfits 16\u201320): Practical, repeatable off-duty dressing. This is where denim, tees, Henleys, lightweight casual layers, and streetwear-adjacent signals can appear when the client selected them.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
DIVERSITY MANDATE \u2014 THE MOST IMPORTANT RULE IN THIS ENTIRE PROMPT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
The 20 outfits must feel like 20 DIFFERENT outfits, not variations of the same look.

GARMENT DIVERSITY (hard requirements):
- Use at least 5 different bottom types across 20 outfits (e.g. jeans, chinos, tailored trousers, linen trousers)
- Use at least 6 different top types across 20 outfits (e.g. dress shirt, t-shirt, polo, knit, linen shirt)
- Use at least 4 different layer/outerwear types (e.g. blazer, leather jacket, bomber, overshirt)
- Use at least 5 different footwear types across 20 outfits

COLOUR DIVERSITY (hard requirements):
- No single dominant colour should appear in more than 5 of 20 outfits (this includes navy, white, black, grey)
- At least 4 outfits must feature a bold or unexpected colour as the dominant note (not a neutral or earth tone)
- At least 2 outfits must be fully tonal (head-to-toe in shades of one colour family)
- No more than 3 consecutive outfits within the same colour family
- All 6 of the following colour families MUST appear across the 20 outfits \u2014 if any are missing the output fails:
    \u2713 Warm earth (camel, rust, tan, terracotta, tobacco, warm brown, warm olive)
    \u2713 Cool neutral (charcoal, slate, cool grey, true navy, stone, off-white, black)
    \u2713 Jewel tone (deep teal, emerald, burgundy, cobalt, plum, rich olive, sapphire)
    \u2713 Pastel / muted (dusty rose, sage, powder blue, muted lavender, soft terracotta, pale stone)
    \u2713 Monochrome / tonal (a head-to-toe look in shades of one family)
    \u2713 Bright / bold (at least one genuinely saturated high-energy colour that demands attention)

SILHOUETTE DIVERSITY:
- Mix fitted and relaxed silhouettes \u2014 do not make every outfit the same proportional shape
- At least 3 outfits should feature a layer or outerwear piece
- At least 2 outfits should be intentionally minimal (top + bottom + shoes only)

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FREE NOTE TRANSLATION \u2014 INTERNAL PLANNING STEP (DO NOT OUTPUT)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Before generating any outfit, internally translate the client's Free Note aspiration into specific garment types, colour names, and occasion terms. Do NOT output this translation \u2014 use it only to inform \u22654 outfits that directly embody the client's aesthetic.

If Free Note is absent or vague, default to the style brief's aesthetic_direction from classification.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
OUTFIT ORDERING
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Present outfits in this order: Office / Formal (6), then Smart Casual (4), then Evening Wear (5), then Relaxed Casual (5).
Within each category, order from highest-stakes to most relaxed.
The first outfit sets the quality benchmark \u2014 make it the strongest look.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
PRE-GENERATION CHECKLIST \u2014 INTERNAL ONLY, DO NOT OUTPUT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Before writing the first category header, silently verify:
- Outfit split: 6 Office / Formal + 4 Smart Casual + 5 Evening Wear + 5 Relaxed Casual = 20
- colours_to_avoid confirmed and hard-blocked in all 20 outfits
- Diversity: \u22655 bottom types, \u22656 top types, \u22654 layer types, \u22655 footwear types planned
- No single dominant colour in more than 5 outfits
- No two outfits share the same dominant colour story
- All 6 colour families covered: warm earth, cool neutral, jewel tone, pastel/muted, monochrome/tonal, bright/bold
- Occasion colour temperature applied: formal=sober, casual=open, evening=rich

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
OUTFIT FORMAT \u2014 REQUIRED FOR ALL 20
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

For each outfit category (Office / Formal, Smart Casual, Evening Wear, Relaxed Casual), open with:
Category intro (2 sentences): Objective of this category for this specific client \u2014 what role these outfits play in his life.

Then for each outfit, use this exact structure:

**Outfit [N] \u2014 [Context name]**

- Top: [garment type] in [colour name] \u2014 [fit descriptor] \u2014 [fabric] \u2014 [tuck instruction: tucked / untucked / half-tuck]
- Bottom: [trouser type] in [colour name] \u2014 [rise] \u2014 [fabric] \u2014 [break: no break / quarter break / half break]
- Layer: [specific outerwear type] in [colour name] \u2014 [worn: open / closed / over-arm] | or: No layer
- Footwear: [type + material + colour] \u2014 [sock note: no-show / fine cotton / wool ribbed / no socks]
- Accessories: [Apply the correct tier. If Tier 3 warrants no accessories, omit this line entirely.]
- Fit note: [One sentence on how each piece physically fits this client's body geometry]
- Colour logic: [Strategy: TONAL / ANALOGOUS / NEUTRAL ANCHOR + ACCENT / DARK-LIGHT CONTRAST \u2014 then name the colours used and one sentence on why this combination works.]
- Occasion anchor: [One sentence \u2014 "Wear this to [specific situation] \u2014 it signals [specific quality] to [specific audience]."]
- Shopping translation: [1 sentence naming the 1-2 key items to buy for this outfit]
- Acceptable substitutes: [1 sentence with practical replacements that preserve the same silhouette and colour logic]
- Do not buy: [1 sentence naming the common wrong version of this outfit]

If the original intake includes Indian occasions, wedding season, festivals, Indo Authority, Indian Casual, or ethnic wardrobe signals, include lightweight Indian-context support in at least 2 outfits. Use Western-first styling unless the signal is strong; acceptable Indian-context pieces include kurta, band-collar shirt, Nehru jacket, bandh-gala, and festive loafers/sandals where climate-appropriate.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
FULL GENERATION CHECKLIST \u2014 ALL 20 MUST PASS BEFORE OUTPUT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
\u2713 BANNED GARMENTS: No skinny jeans in any outfit.
\u2713 COLOUR BLOCK: colours_to_avoid absent from all 20.
\u2713 DIVERSITY: \u22655 bottom types, \u22656 top types, \u22654 layer types, \u22655 shoe types used.
\u2713 COLOUR DIVERSITY: No dominant colour in >5 outfits. \u22654 bold/unexpected colours. \u22652 tonal builds. All 6 colour families present.
\u2713 UNIQUENESS: No two outfits share the same top+bottom combination or colour story.
\u2713 FABRIC CLIMATE: Correct matrix applied for client's location.
\u2713 FIT NOTE: Every outfit references client's body geometry.
\u2713 OCCASION ANCHOR: Every outfit has a specific wear-to scenario.
\u2713 CATEGORY SPLIT: 6 Office / Formal, 4 Smart Casual, 5 Evening Wear, 5 Relaxed Casual \u2014 all present.

---

## SECTION 5: YOUR COMBINATION GRID GUIDE

Write copy for three custom 1-row x 3-column image grids that will be generated after the 20 outfit images. Each grid should define three related looks that show the client in the same visual system, not generic flat-lays.
Do not use Markdown tables, pipe-delimited rows, or table separator syntax.

### Office Basic Combinations
Write exactly three looks, using this exact structure for each:
#### [Look Name]
- Outfit summary: [full outfit description]
- Logic: [why it suits this client]
- Source: Derived from Outfit #[Office / Formal outfit number]

### Evening Outfit Combinations
Write exactly three looks using the same four-line structure, derived from Evening Wear outfits.

### Relaxed Casual Combinations
Write exactly three looks using the same four-line structure, derived from Relaxed Casual outfits.

---

## SECTION 6: YOUR SHOPPING & READY-TO-WEAR FIT SYSTEM

### Shopping Roadmap
Use these subheadings exactly:
#### Buy First
#### Upgrade Next
#### Skip For Now
#### Never Buy

Under each subheading, give 3-5 bullets. Each bullet must name the garment/category, colour/fabric/fit direction, why it suits him, and the common wrong version to avoid.

### Ready-To-Wear Fit Guide
Give practical off-the-rack checks for Indian men. Cover shirt length, shoulder fit, sleeve width, trouser rise, trouser break, shoe shape, and fabric weight for India/UAE climates. Do not make tailoring the main solution.

---

## SECTION 7: YOUR GROOMING & BASIC SKINCARE SYSTEM

### Beard & Facial Hair System
Give a dedicated facial-hair plan for this client: best length, cheek line, neckline, moustache direction, what to avoid, and maintenance frequency. Clean-shaven is allowed, but still explain how to maintain the shave line and skin around it.

### Basic Skincare Routine
Keep this practical and non-medical. Use these subheadings exactly:
#### Morning
List cleanser, moisturiser, sunscreen.
#### Evening
List cleanser and moisturiser.
#### Shaving / Beard Area
Give 2-3 practical rules for irritation control, neckline care, and beard-area neatness without medical claims.
#### Adjustment
Give one basic adjustment for oily, dry, or sensitive-looking skin if visible from the image or implied by shaving/beard state; otherwise give a neutral routine note.

---

## SECTION 8: YOUR STYLE IDENTITY STATEMENT

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
    hair_presence?: HairPresence;
    facial_hair_presence?: FacialHairPresence;
    grooming_focus?: GroomingFocus;
    grooming_image_confidence?: number;
    grooming_image_evidence?: string;
    hairstyle_recommendations: string[];
    beard_style_recommendations?: string[];
    beard_maintenance?: string;
    facial_hair_recommendations: string;
    eyewear_shapes: string[];
    skincare_routine?: {
      morning: string[];
      evening: string[];
      shaving_or_beard_area: string;
      skin_adjustment: string;
    };
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
  s0_snapshot?: string;
  s1_face: string;
  s2_body: string;
  s3_colour: string;
  s4_outfits: string;
  s4_combo_grids?: string;
  s5_rules?: string;
  s5_shopping?: string;
  s5_grooming_skin?: string;
  s6_identity: string;
}

export interface ReportData {
  classification: ClassificationResult;
  sections: ReportSections;
  generated_at: string;
  qa?: {
    section4?: ManReportQaResult;
  };
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

function buildTemplateVars(
  sub: ManIntakeSubmission,
  groomingProfile: GroomingImageProfile = DEFAULT_GROOMING_PROFILE,
): Record<string, string> {
  const confidentProfile = groomingProfile.confidence >= CONFIDENT_GROOMING_THRESHOLD;
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
    grooming_profile:   confidentProfile
      ? JSON.stringify(groomingProfile, null, 2)
      : JSON.stringify({
          ...DEFAULT_GROOMING_PROFILE,
          evidence: groomingProfile.evidence || DEFAULT_GROOMING_PROFILE.evidence,
        }, null, 2),
  };
}

function isConfidentBaldOrShaved(profile: GroomingImageProfile | null | undefined): boolean {
  return !!profile &&
    profile.confidence >= CONFIDENT_GROOMING_THRESHOLD &&
    ['bald', 'closely_shaved'].includes(profile.hair_presence);
}

function fallbackBeardStyles(facialHairPresence: FacialHairPresence | undefined): string[] {
  if (facialHairPresence === 'moustache') {
    return [
      'Short moustache with light designer stubble',
      'Defined moustache with clean-shaved cheeks',
      'Short moustache with a neat chin patch',
      'Soft moustache with 3-day stubble and a clean neckline',
    ];
  }
  if (facialHairPresence === 'full_beard') {
    return [
      'Short boxed beard with a defined neckline',
      'Tapered full beard with clean cheek lines',
      'Medium stubble beard with a natural cheek line',
      'Short full beard with slightly faded sideburns',
    ];
  }
  if (facialHairPresence === 'short_beard') {
    return [
      'Short boxed beard with sharp cheek lines',
      'Medium stubble beard with a tapered neckline',
      'Heavy stubble with clean cheeks and a low neckline',
      'Short beard with a softer natural cheek line',
    ];
  }
  return [
    'Defined designer stubble',
    'Short boxed beard with a clean neckline',
    'Clean-shaven finish with precise sideburn edges',
    'Light moustache and chin stubble with clean cheeks',
  ];
}

function fallbackHairstyles(hairPresence: HairPresence | undefined): string[] {
  if (hairPresence === 'bald' || hairPresence === 'closely_shaved') {
    return [
      'Clean close shave with a crisp hairline edge',
      'Uniform zero-guard buzz with polished scalp grooming',
      'Very close shadow buzz with tidy temple edges',
      'Clean-shaven scalp with softly blended sideburns',
    ];
  }
  if (hairPresence === 'thinning_or_receding') {
    return [
      'Low buzz cut with a clean hairline',
      'Short close crop with minimal top volume',
      'Soft Caesar crop kept short and low-density',
      'Clean shave transition with stronger beard balance',
    ];
  }
  return [
    'Short textured crop with natural volume',
    'Classic side part with low taper',
    'Short crew cut with soft taper',
    'Natural brushed-back short cut with controlled sides',
  ];
}

function fallbackEyewearShapes(): string[] {
  return [
    'Rectangular acetate optical frames in dark brown with clear lenses',
    'Soft square metal optical frames in brushed gunmetal with clear lenses',
    'Wayfarer sunglasses in black acetate with smoke lenses',
    'Aviator sunglasses in thin metal with softly tinted brown lenses',
  ];
}

function normaliseClassification(
  result: ClassificationResult,
  groomingProfile: GroomingImageProfile = DEFAULT_GROOMING_PROFILE,
): ClassificationResult {
  const face = result.face;
  const confidentBaldOrShaved = isConfidentBaldOrShaved(groomingProfile);
  const confidentThinning = groomingProfile.confidence >= CONFIDENT_GROOMING_THRESHOLD &&
    groomingProfile.hair_presence === 'thinning_or_receding';

  const next: ClassificationResult = {
    ...result,
    face: {
      ...face,
      hair_presence: groomingProfile.confidence >= CONFIDENT_GROOMING_THRESHOLD
        ? groomingProfile.hair_presence
        : face.hair_presence ?? 'unclear',
      facial_hair_presence: groomingProfile.confidence >= CONFIDENT_GROOMING_THRESHOLD
        ? groomingProfile.facial_hair_presence
        : face.facial_hair_presence ?? 'unclear',
      grooming_focus: confidentBaldOrShaved ? 'beard' : 'hairstyle',
      grooming_image_confidence: groomingProfile.confidence,
      grooming_image_evidence: groomingProfile.evidence,
      hairstyle_recommendations: Array.isArray(face.hairstyle_recommendations)
        ? face.hairstyle_recommendations.slice(0, 4)
        : [],
      beard_style_recommendations: Array.isArray(face.beard_style_recommendations)
        ? face.beard_style_recommendations.slice(0, 4)
        : [],
      beard_maintenance: face.beard_maintenance || 'Keep cheek lines intentional and clean the neckline every 3-5 days so facial hair reads groomed, not accidental.',
      facial_hair_recommendations: face.facial_hair_recommendations || 'Keep facial hair intentionally shaped to support the face geometry.',
      eyewear_shapes: Array.isArray(face.eyewear_shapes) ? face.eyewear_shapes.slice(0, 4) : [],
      skincare_routine: {
        morning: Array.isArray(face.skincare_routine?.morning) && face.skincare_routine.morning.length
          ? face.skincare_routine.morning.slice(0, 3)
          : ['Gentle cleanser', 'Light moisturiser', 'Broad-spectrum sunscreen'],
        evening: Array.isArray(face.skincare_routine?.evening) && face.skincare_routine.evening.length
          ? face.skincare_routine.evening.slice(0, 2)
          : ['Gentle cleanser', 'Light moisturiser'],
        shaving_or_beard_area: face.skincare_routine?.shaving_or_beard_area || 'Use a clean shave line or beard edge, then moisturise the beard area so the skin does not look dry around the grooming line.',
        skin_adjustment: face.skincare_routine?.skin_adjustment || 'Keep the routine simple and consistent; adjust product texture lighter or richer depending on how the skin feels through the day.',
      },
    },
  };

  if (confidentBaldOrShaved) {
    next.face.grooming_focus = 'beard';
    next.face.hairstyle_recommendations = fallbackHairstyles(next.face.hair_presence);
  }

  if (confidentThinning) {
    next.face.hairstyle_recommendations = fallbackHairstyles(next.face.hair_presence);
  }

  if (next.face.hairstyle_recommendations.length < 4) {
    next.face.hairstyle_recommendations = [
      ...next.face.hairstyle_recommendations,
      ...fallbackHairstyles(next.face.hair_presence),
    ].filter(Boolean).slice(0, 4);
  }

  if ((next.face.beard_style_recommendations ?? []).length < 4) {
    next.face.beard_style_recommendations = [
      ...(next.face.beard_style_recommendations ?? []),
      ...fallbackBeardStyles(next.face.facial_hair_presence),
    ].filter(Boolean).slice(0, 4);
  }

  if (next.face.eyewear_shapes.length < 4) {
    next.face.eyewear_shapes = [
      ...next.face.eyewear_shapes,
      ...fallbackEyewearShapes(),
    ].filter(Boolean).slice(0, 4);
  }

  return next;
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
    s0_snapshot:  sectionMap['0'] ?? '',
    s1_face:     sectionMap['1'] ?? '',
    s2_body:     sectionMap['2'] ?? '',
    s3_colour:   sectionMap['3'] ?? '',
    s4_outfits:  sectionMap['4'] ?? '',
    s4_combo_grids: sectionMap['5'] ?? '',
    s5_shopping: sectionMap['6'] ?? '',
    s5_grooming_skin: sectionMap['7'] ?? '',
    s6_identity: sectionMap['8'] ?? sectionMap['6'] ?? '',
  };
}

// ─────────────────────────────────────────────────────────────
// Gemini call wrappers
// ─────────────────────────────────────────────────────────────

async function withTextRetry<T>(fn: () => Promise<T>, maxAttempts = 4, baseDelayMs = 5_000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const isTransient =
        msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') ||
        msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') ||
        msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('overloaded');
      if (!isTransient || attempt === maxAttempts - 1) throw err;
      const delayMs = baseDelayMs * Math.pow(2, attempt); // 5s → 10s → 20s
      console.warn(`[manReportGenerator] Attempt ${attempt + 1}/${maxAttempts} failed (transient), retrying in ${delayMs / 1000}s… error: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

async function callGeminiJSON(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  return withTextRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: combined }] }],
    });
    const text    = response.text ?? '';
    const cleaned = cleanJson(text);
    return JSON.parse(cleaned);
  });
}

async function callGeminiText(systemPrompt: string, userPrompt: string, maxOutputTokens?: number): Promise<string> {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  return withTextRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: combined }] }],
      ...(maxOutputTokens ? { config: { maxOutputTokens } } : {}),
    });
    return response.text ?? '';
  });
}

function cleanMimeType(contentType: string | null): string {
  const mimeType = contentType?.split(';')[0]?.trim().toLowerCase();
  return mimeType?.startsWith('image/') ? mimeType : 'image/jpeg';
}

function normaliseHairPresence(value: unknown): HairPresence {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'full_hair') return 'full_hair';
  if (raw === 'thinning_or_receding') return 'thinning_or_receding';
  if (raw === 'closely_shaved') return 'closely_shaved';
  if (raw === 'bald') return 'bald';
  return 'unclear';
}

function normaliseFacialHairPresence(value: unknown): FacialHairPresence {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'clean_shaven') return 'clean_shaven';
  if (raw === 'stubble') return 'stubble';
  if (raw === 'short_beard') return 'short_beard';
  if (raw === 'full_beard') return 'full_beard';
  if (raw === 'moustache') return 'moustache';
  return 'unclear';
}

function normaliseGroomingImageProfile(value: unknown): GroomingImageProfile {
  const raw = (value ?? {}) as Record<string, unknown>;
  const confidence = Number(raw.confidence);
  return {
    hair_presence: normaliseHairPresence(raw.hair_presence),
    facial_hair_presence: normaliseFacialHairPresence(raw.facial_hair_presence),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    evidence: String(raw.evidence ?? '').slice(0, 240) || 'No visual evidence returned.',
  };
}

async function fetchImageForGemini(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) throw new Error('Image fetch returned an empty file');
  const sourceMimeType = cleanMimeType(res.headers.get('content-type'));

  try {
    const output = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: GROOMING_IMAGE_MAX_DIMENSION,
        height: GROOMING_IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    if (output.length <= GROOMING_IMAGE_MAX_BYTES) {
      return { data: output.toString('base64'), mimeType: 'image/jpeg' };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[manReportGenerator] Could not normalise grooming source image: ${message.slice(0, 200)}`);
  }

  if (buffer.length > GROOMING_IMAGE_MAX_BYTES) {
    throw new Error(`Grooming source image is too large for inline analysis (${buffer.length} bytes)`);
  }

  return { data: buffer.toString('base64'), mimeType: sourceMimeType };
}

export async function runGroomingImageClassification(
  submission: ManIntakeSubmission,
): Promise<GroomingImageProfile> {
  const imageUrl = submission.photo_headshot_url ?? submission.photo_fullbody_url;
  if (!imageUrl) return DEFAULT_GROOMING_PROFILE;

  try {
    const image = await fetchImageForGemini(imageUrl);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { mimeType: image.mimeType, data: image.data } },
          {
            text: `Inspect only the visible grooming state of the man in this image.
Return ONLY valid JSON with this exact shape:
{
  "hair_presence": "full_hair | thinning_or_receding | closely_shaved | bald | unclear",
  "facial_hair_presence": "clean_shaven | stubble | short_beard | full_beard | moustache | unclear",
  "confidence": 0.0,
  "evidence": ""
}

Definitions:
- "bald": no usable scalp hair visible across most of the top/crown.
- "closely_shaved": scalp hair is present but shaved very close with no meaningful styling length.
- "thinning_or_receding": visible recession or low density but some scalp hair remains styleable.
- "full_hair": enough scalp hair exists to recommend normal hairstyles.

Do not identify the person. Do not infer age, ethnicity, attractiveness, or sensitive traits. Keep evidence to one short visual sentence.`,
          },
        ],
      }],
    });
    const cleaned = cleanJson(response.text ?? '');
    return normaliseGroomingImageProfile(JSON.parse(cleaned));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[manReportGenerator] Grooming image classification failed; falling back to hairstyle flow: ${message.slice(0, 300)}`);
    return {
      ...DEFAULT_GROOMING_PROFILE,
      evidence: `Image grooming classification unavailable: ${message.slice(0, 180)}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function runClassification(
  submission: ManIntakeSubmission,
  groomingProfile: GroomingImageProfile = DEFAULT_GROOMING_PROFILE,
): Promise<ClassificationResult> {
  const vars       = buildTemplateVars(submission, groomingProfile);
  const userPrompt = fillTemplate(CLASSIFICATION_USER_TEMPLATE, vars);
  const result     = await callGeminiJSON(CLASSIFICATION_SYSTEM_PROMPT, userPrompt);
  return normaliseClassification(result as ClassificationResult, groomingProfile);
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

function deriveClimateZone(locationRegion: string): 'HOT' | 'TEMPERATE' {
  const loc = locationRegion.toLowerCase();
  if (/india|uae|middle\s*east|dubai|mumbai|delhi|bangalore|hyderabad|chennai|kolkata/.test(loc)) return 'HOT';
  return 'TEMPERATE';
}

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

  let prompt = preamble + _SECTION_BLOCKS[sectionIndex];

  // Inject the outfit recommendation skill for Section 4, with explicit CLIMATE_ZONE.
  if (sectionIndex === 4) {
    const climateZone = deriveClimateZone(classification.client.location_region);
    const climateHeader = `DERIVED VARIABLES (use these — do not re-derive):
CLIMATE_ZONE = ${climateZone}

20-OUTFIT OVERRIDE — this supersedes any older 16-outfit instruction in the injected skill:
- Generate exactly 20 outfits.
- Outfits 1-6: OFFICE / FORMAL.
- Outfits 7-10: SMART CASUAL.
- Outfits 11-15: EVENING WEAR.
- Outfits 16-20: RELAXED CASUAL.
- Use at least 5 bottom types, 6 top types, 4 layer types, and 5 shoe types.
- Use the exact header format: OUTFIT [NUMBER] — [CONTEXT NAME].

`;
    prompt = OUTFIT_SKILL + '\n\n' + climateHeader + prompt;
  }

  return prompt;
}

export async function runSection1(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(1, classification, submission));
}

export async function runSection2(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(2, classification, submission));
}

export async function runSection3(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(3, classification, submission));
}

export async function runSection0(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(0, classification, submission));
}

/** Safety net: strip any planning/meta text the model may output before the actual outfits.
 *  The prompt now instructs the model NOT to output these, but strip defensively anyway. */
function stripSection4Preamble(text: string): string {
  return text
    .replace(/^FREE NOTE TRANSLATION:.*$/gim, '')
    .replace(/^PRE-GENERATION CHECK[:\s].*$/gim, '')
    .replace(/^(?:Free Note Translation|Outfit split confirmed|Top silhouette distribution|Cap compliance|Location|Colours to avoid[^:]*|Universal neutrals planned|Palette colours[^:]*|Short-client module):.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function runSection4(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  const raw = await callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(4, classification, submission), 65536);
  return stripSection4Preamble(raw);
}

function buildSection4RepairPrompt(
  classification: ClassificationResult,
  currentSection4: string,
  issues: ManReportQaIssue[],
): string {
  const climateZone = deriveClimateZone(classification.client.location_region);
  return `${OUTFIT_SKILL}

DERIVED VARIABLES (use these — do not re-derive):
CLIMATE_ZONE = ${climateZone}

You are repairing Section 4 of an ICONIK Men's Blueprint before outfit images are generated.

Return ONLY the corrected Section 4 outfit text. Do not include explanations, QA notes, markdown fences, or any text before the first outfit.

Repair goal:
- Fix every blocking QA issue listed below.
- Preserve the client's profile, body logic, colour season, climate rules, style direction, and outfit contexts.
- You may rewrite any outfit needed to make the full section valid.
- If one outfit has a hot-climate restricted garment or fabric, replace the restricted item with a permitted HOT-climate equivalent and check the entire section for the same problem.

Blocking QA issues:
${JSON.stringify(issues, null, 2)}

Client classification JSON:
${JSON.stringify(classification, null, 2)}

Current Section 4 text:
${currentSection4}

Mandatory corrected output:
- Exactly 20 outfits.
- Outfits 1–6: OFFICE / FORMAL.
- Outfits 7–10: SMART CASUAL.
- Outfits 11–15: EVENING WEAR.
- Outfits 16–20: RELAXED CASUAL.
- Every outfit must include TOP, LAYER, BOTTOM, FOOTWEAR, ACCESSORY, WHY IT WORKS FOR YOU, SHOPPING TRANSLATION, ACCEPTABLE SUBSTITUTES, and DO NOT BUY.
- No skinny or spray-on cuts.
- No blazer in RELAXED CASUAL.
- If CLIMATE_ZONE = HOT: no turtlenecks, no wool, no wool-blend, no flannel, no heavy knits, no merino, no thick tweed, no velvet. Blazers must be unlined linen-cotton or lightweight cotton only.
- Use the exact outfit header format: OUTFIT [NUMBER] — [CONTEXT NAME].
- Use the exact field labels: TOP:, LAYER:, BOTTOM:, FOOTWEAR:, ACCESSORY:, WHY IT WORKS FOR YOU:, SHOPPING TRANSLATION:, ACCEPTABLE SUBSTITUTES:, DO NOT BUY:`;
}

export async function repairSection4Outfits(
  classification: ClassificationResult,
  currentSection4: string,
  issues: ManReportQaIssue[],
): Promise<string> {
  const raw = await callGeminiText(
    REPORT_SYSTEM_PROMPT,
    buildSection4RepairPrompt(classification, currentSection4, issues),
    65536,
  );
  return stripSection4Preamble(raw);
}

export async function repairSection4OutfitsUntilQaPass(
  classification: ClassificationResult,
  currentSection4: string,
  maxRepairAttempts = 2,
): Promise<{ section4: string; qa: ManReportQaResult; repaired: boolean }> {
  let section4 = currentSection4;
  let qa = validateManReportSection4(section4, classification);
  let repaired = false;

  for (let attempt = 0; attempt < maxRepairAttempts; attempt++) {
    const blockingIssues = qa.issues.filter(issue => issue.severity === 'error');
    if (blockingIssues.length === 0) break;

    section4 = await repairSection4Outfits(classification, section4, blockingIssues);
    qa = validateManReportSection4(section4, classification);
    repaired = true;
  }

  return { section4, qa, repaired };
}

function buildComboGridRepairPrompt(classification: ClassificationResult, currentText: string): string {
  return `You are repairing Section 5 of an ICONIK Men's Blueprint before it is shown to a client.

Return ONLY the corrected Section 5 text. Do not include explanations, QA notes, or markdown fences.
Never use Markdown tables, pipe-delimited rows, or table separator syntax.

Required output:
## SECTION 5: YOUR COMBINATION GRID GUIDE

### Office Basic Combinations
Exactly three looks derived from Office / Formal outfits.

### Evening Outfit Combinations
Exactly three looks derived from Evening Wear outfits.

### Relaxed Casual Combinations
Exactly three looks derived from Relaxed Casual outfits.

Use this exact structure for every look:
#### [Look Name]
- Outfit summary: [full outfit description]
- Logic: [why it suits this client]
- Source: Derived from Outfit #[number]

Client classification JSON:
${JSON.stringify(classification, null, 2)}

Current invalid Section 5 text:
${currentText}`;
}

export async function runSection5(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  const raw = await callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(5, classification, submission));
  const firstPass = normaliseComboGridText(raw);
  if (firstPass.ok) return firstPass.text;

  const repaired = await callGeminiText(REPORT_SYSTEM_PROMPT, buildComboGridRepairPrompt(classification, raw));
  const secondPass = normaliseComboGridText(repaired);
  if (secondPass.ok) return secondPass.text;

  throw new Error(`Combination Grid text is invalid after repair: ${secondPass.error}`);
}

export async function runSection6Shopping(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(6, classification, submission));
}

export async function runSection7GroomingSkin(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(7, classification, submission));
}

export async function runSection6(classification: ClassificationResult, submission: ManIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(8, classification, submission));
}
