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
import { normaliseSequentialManOutfitNumbers } from './manOutfitSection';
import {
  formatManOutfitLibraryForPrompt,
  getManOutfitLibraryAssignments,
  getManOutfitSelectionWaivers,
  getManReportClimateProfile,
  MAN_OUTFIT_LIBRARY_VERSION,
  type ManOutfitLibraryAssignment,
} from './manOutfitLibrary';

const OUTFIT_SKILL = readFileSync(
  join(process.cwd(), 'src/lib/outfitrecommendationskill.md'), 'utf-8'
);

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const MAN_REPORT_TEXT_MODEL = process.env.GEMINI_MAN_TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

export const MAN_BLUEPRINT_V2_VERSION = 'man_blueprint_v2' as const;

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
The report is rendered as a visual, page-based blueprint. Keep copy concise:
- Prefer short card-ready bullets over long paragraphs.
- Paragraphs must be 1-2 sentences unless a section explicitly asks for a longer identity statement.
- For diagnosis and prescription slides, use this structure: verdict headline, visual evidence cue, 3 do's, 2 avoids. One verdict sentence maximum before bullets.
- Do not repeat the same logic across sections; let the image grids, palette swatches, and outfit images carry the detail.
- Use simple language a client can act on immediately.

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

Opening paragraph (1-2 short sentences):
Summarise the main style direction in simple, direct language. No dense analysis.

### Your Top 3 Priorities
3 bullets exactly. Each bullet must be a plain-language takeaway he can act on immediately.

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

The ICONIK Outfit Recommendation Skill v6.1 has been injected above. It is the controlling authority for this section. v6.1 supersedes v6.0. Use the retained v5.1 appendix only where v6.0/v6.1 explicitly says a rule, formula, reference, or list is retained.

Generate the FINAL 20 outfits only. Perform the v6.1 two-pass candidate generation, elevation scoring, and QA internally; do not show candidates, scores, rejected options, QA notes, or reasoning.

Fixed output split:
- Outfits 1-6: OFFICE / FORMAL
- Outfits 7-10: SMART CASUAL
- Outfits 11-15: EVENING WEAR
- Outfits 16-20: RELAXED CASUAL

Mandatory v6.1 controls:
- Garment Reality Rule: every garment must be a real searchable menswear item: one colour + one fabric + one standard garment type. No invented design details, colour-blocking, contrast trims, panels, draping, gathered/twist/asymmetric/cutout effects, or hybrid fantasy garments.
- Colour Physics: optimise value, then contrast, then chroma, then temperature. Season palette is a prior, not a prison. Warm leather can resolve cool outfits.
- Suit Exception: matched suits are legal in Office/Formal and Evening when the shirt/knit creates clear depth contrast. Monochrome separates are still banned.
- Elevation Mandate: every outfit needs 2-4 elevation moves from the v6.1 Elevation Move Bank, with at least one move from categories A-C. Basic Combo Ban entries are forbidden unless rescued by at least two visible elevation moves.
- Use Elevated Colour Vocabulary whenever it fits the client's season and anti-preferences. At least 6 of the final 20 outfits must use a non-default colour as a primary top or layer outside plain white/navy/black/beige/grey.
- Apply the mannequin test before accepting each outfit. ICONIK kill threshold: Smart Casual and Evening must score at least 8; Office/Formal and Relaxed Casual must score at least 7. Realism and Relevance must each score at least 7.
- Portfolio diversity: no silhouette family more than twice inside a context or three times overall, at least 8 colour families, 5-7 patterned pieces unless explicitly waived, at least 6 footwear types, and at least 4 layer types where climate permits.
- Consecutive visual diversity: adjacent outfits must not repeat the same or near-identical primary top colour family. White/ecru/ivory/cream/off-white/chalk/bone are one light-neutral family; stone/oatmeal/sand/beige are one pale-earth family. Do not repeat a visible layer colour family in consecutive looks either.
- Indian / ethnic wear default OFF. Include it only if explicitly requested in the client’s own words.

Use this exact parser-friendly field sequence for every outfit. Do not use markdown tables.

OUTFIT [NUMBER] — [CONTEXT NAME]

TOP: [colour + fabric + standard garment type — fit — one styling instruction]
LAYER: [colour + fabric + standard layer type — how it is worn] or None
BOTTOM: [colour + fabric + standard trouser/denim type — fit/cut — trouser break]
FOOTWEAR: [colour + material + standard shoe type]
ACCESSORY: [belt/watch/eyewear with face-shape rationale] or None

OCCASION ANCHOR: [One short sentence naming where he wears this and what it signals.]

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

## SECTION 6: YOUR SHOPPING FILTER

### Shopping Roadmap
Use these subheadings exactly:
#### Buy First
#### Upgrade Next
#### Skip For Now
#### Never Buy

Under each subheading, give 3-5 bullets. Each bullet must name the garment/category, colour/fabric/fit direction, why it suits him, and the common wrong version to avoid.

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

export interface ManBlueprintV2Diagnostics {
  faceGeometryVerdict: string;
  frameFrontVerdict: string;
  frameSideVerdict: string;
  frameSideFallback: string;
  frameTrainingDirection: {
    title: string;
    weeks: string;
    focus: string[];
  };
  colourDrapeVerdict: string;
}

export interface ManBlueprintV2Deliverables {
  strongestOutfitNumber: number;
  linkedinHeadshotSpec: string;
  datingProfileShots: Array<{
    title: string;
    outfitNumber: number;
    scene: string;
    usage: string;
  }>;
}

export interface ReportData {
  report_version?: typeof MAN_BLUEPRINT_V2_VERSION | 'legacy';
  classification: ClassificationResult;
  sections: ReportSections;
  diagnostics?: ManBlueprintV2Diagnostics;
  deliverables?: ManBlueprintV2Deliverables;
  outfit_library?: {
    source: 'ICONIK_Mens_Library_100';
    version?: typeof MAN_OUTFIT_LIBRARY_VERSION | 'legacy';
    assignments: ManOutfitLibraryAssignment[];
    selectionProfile?: {
      archetypes: string[];
      patternWaiver: boolean;
      waivers?: string[];
      selectionSalt?: string;
    };
  };
  generated_at: string;
  qa?: {
    section4?: ManReportQaResult;
  };
}

export function buildManBlueprintV2StructuredData(
  classification: ClassificationResult,
  selectionSalt = '',
): Pick<ReportData, 'report_version' | 'diagnostics' | 'deliverables' | 'outfit_library'> {
  const shoulderFocus = /triangle|slim|narrow/i.test(classification.body.silhouette_type)
    ? 'Add shoulder width through lateral delts, rear delts, and upright posture.'
    : 'Maintain shoulder structure while improving posture and torso control.';
  const abdomenFocus = /belly|abdomen|torso|midsection/i.test(`${classification.body.fat_storage_zone} ${classification.body.minimise_zone}`)
    ? 'Use core bracing, walking volume, and tailoring that lets fabric skim the abdomen.'
    : 'Use posture and upper-back work to keep the vertical line clean.';

  const assignments = getManOutfitLibraryAssignments(classification, undefined, new Date(), selectionSalt);
  const patternWaiver = /\b(no|avoid|dislike|hate)\b.{0,24}\b(pattern|print|stripe|check)/i.test(
    `${classification.style_brief.anti_preferences} ${classification.colour.pattern_guidance}`,
  );
  return {
    report_version: MAN_BLUEPRINT_V2_VERSION,
    outfit_library: {
      source: 'ICONIK_Mens_Library_100',
      version: MAN_OUTFIT_LIBRARY_VERSION,
      assignments,
      selectionProfile: {
        archetypes: assignments.map(assignment => assignment.archetype ?? 'legacy'),
        patternWaiver,
        waivers: getManOutfitSelectionWaivers(classification),
        ...(selectionSalt ? { selectionSalt } : {}),
      },
    },
    diagnostics: {
      faceGeometryVerdict: `${classification.face.face_shape} face architecture with ${classification.face.feature_type} features: recommendations should balance width, height, and facial-hair edge control.`,
      frameFrontVerdict: `${classification.body.silhouette_type} frame: ${classification.body.fit_directive}`,
      frameSideVerdict: `Side profile should validate posture, abdomen projection, and how structured layers fall from shoulder to hem.`,
      frameSideFallback: `No side-profile photo was supplied, so this page uses the front photo, intake answers, and fit rules instead of a side overlay.`,
      frameTrainingDirection: {
        title: '4-week silhouette direction',
        weeks: 'Repeat 3 days per week for four weeks; keep it non-medical and form-first.',
        focus: [
          shoulderFocus,
          abdomenFocus,
          classification.body.height_adjustment || 'Keep trouser break, jacket length, and vertical contrast intentional.',
        ],
      },
      colourDrapeVerdict: `${classification.colour.season} works when colour sits at the right depth near the face; the drape comparison shows what to repeat and what to remove.`,
    },
    deliverables: {
      strongestOutfitNumber: 1,
      linkedinHeadshotSpec: `Professional headshot using ${classification.face.hairstyle_recommendations?.[0] || 'clean grooming'}, ${classification.face.beard_style_recommendations?.[0] || classification.face.facial_hair_recommendations || 'precise facial hair'}, and a best-palette blazer or shirt.`,
      datingProfileShots: [
        {
          title: 'Evening style inspiration',
          outfitNumber: 11,
          scene: 'Warm restaurant or rooftop evening light, relaxed three-quarter pose, direct but natural expression.',
          usage: 'Use as inspiration for a polished evening post with confident, natural energy.',
        },
        {
          title: 'Candid street-style frame',
          outfitNumber: 16,
          scene: 'Outdoor cafe or street-side golden-hour candid, mid-walk body angle, approachable expression.',
          usage: 'Use as inspiration for a relaxed social post that still shows the outfit clearly.',
        },
        {
          title: 'Weekend lifestyle post',
          outfitNumber: 18,
          scene: 'Bookstore, gallery, coffee counter, or weekend activity setting with natural light and visible full outfit.',
          usage: 'Use as inspiration for a lifestyle post with a clear sense of place and personality.',
        },
      ],
    },
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
  const stripped = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
  // Callers all expect a single JSON object — slice to the outer braces to drop any prose the model added around it.
  const first = stripped.indexOf('{');
  const last  = stripped.lastIndexOf('}');
  if (first !== -1 && last > first) return stripped.slice(first, last + 1);
  return stripped;
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
        // Malformed JSON from the model (only JSON calls throw SyntaxError) — a fresh generation almost always parses.
        err instanceof SyntaxError ||
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
      model: MAN_REPORT_TEXT_MODEL,
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
      model: MAN_REPORT_TEXT_MODEL,
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
      model: MAN_REPORT_TEXT_MODEL,
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
This report is visual-first. Keep the output short enough to fit into cards:
- Opening paragraphs: maximum 2 sentences.
- Bullets: short, practical, and direct.
- Diagnosis/prescription sections must lead with one verdict sentence, then evidence/do/avoid bullets. Do not write setup paragraphs.
- Avoid long explanations; give the recommendation and the reason in plain language.

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

// Extract the section instruction blocks from the combined template at module load time.
// Sections in REPORT_USER_TEMPLATE are separated by '\n\n---\n\n' and each starts with '## SECTION'.
const _SECTION_BLOCKS = REPORT_USER_TEMPLATE
  .split('\n\n---\n\n')
  .filter(block => block.trimStart().startsWith('## SECTION'));

function buildSectionUserPrompt(
  sectionIndex: number,
  classification: ClassificationResult,
  submission: ManIntakeSubmission,
  selectionSalt = '',
): string {
  const preamble = fillTemplate(SECTION_USER_PREAMBLE_TEMPLATE, {
    classification_json: JSON.stringify(classification, null, 2),
    free_note:           submission.free_text_note ?? 'Not provided',
    primary_goal:        mapField('primary_goal',  submission.primary_goal),
    style_blocker:       mapField('style_blocker', submission.style_blocker),
  });

  let prompt = preamble + _SECTION_BLOCKS[sectionIndex];

  // Inject the outfit recommendation skill for Section 4 with an actual
  // date-aware regional climate mode, rather than a country-level HOT shortcut.
  if (sectionIndex === 4) {
    const now = new Date();
    const climate = getManReportClimateProfile(classification, now);
    const outfitLibrary = formatManOutfitLibraryForPrompt(classification, undefined, now, selectionSalt);
    const climateHeader = `DERIVED VARIABLES (use these — do not re-derive):
CLIMATE_MODE = ${climate.mode.toUpperCase()}
CLIMATE_LABEL = ${climate.label}
CLIMATE REQUIREMENTS: ${climate.promptGuidance}

V6.1 FINAL-OUTPUT OVERRIDE:
- Generate/scoring candidates internally per the v6.1 two-pass engine, but output exactly the final 20 outfits only.
- Outfits 1-6: OFFICE / FORMAL.
- Outfits 7-10: SMART CASUAL.
- Outfits 11-15: EVENING WEAR.
- Outfits 16-20: RELAXED CASUAL.
- Enforce Garment Reality, Colour Physics, Suit Exception, v6.1 Elevation Mandate, Basic Combo Ban, Elevated Colour Vocabulary, and Four-Axis Evaluation.
- Every garment line must be searchable menswear: one colour + one fabric + one standard garment type.
- Every outfit must include 2-4 visible elevation moves from the v6.1 Elevation Move Bank, with at least one from categories A-C.
- No mannequin-default outfit: do not output white shirt + navy/black trouser + black shoe, navy polo + beige chino + white sneaker, black polo + black/grey trouser, white tee + blue denim + white sneaker without an open layer, check shirt + blue denim + sneaker without styling, or navy blazer + white shirt + navy trouser + black shoe unless clearly rescued by at least two visible elevation moves.
- At least 6 final outfits must use a non-default elevated colour as a primary top or layer outside plain white/navy/black/beige/grey.
- Use at least 5 bottom types, 6 top types, 4 layer types, 6 shoe types, 8 colour families, and 5-7 patterned pieces unless the client explicitly rejects patterns.
- No satin, silk, or shiny fabric anywhere, including ties, pocket squares, and linings; ties are grenadine, knitted, or matte woven only.
- Keep every assigned source look's footwear category and layer/no-layer decision exactly: adapt materials for climate within the category, and replace a climate-unsafe layer with a permitted equivalent instead of removing it.
- Office / Formal is strict corporate formal: exactly 2 matched suits, 2 blazer separates, 2 shirt-and-tailored-trouser looks, at least 3 ties, and zero polos, tees, denim, sneakers, drawstrings, cargos, camp collars, or casual overshirts. Explicit suit/tie anti-preferences override only their matching quota: replace suit slots with climate-formal layers and omit ties without relaxing formality.
- Evening must preserve its climate-aware statement-outerwear quota and may use at most 2 no-layer looks and 1 plain no-layer polo.
- Relaxed Casual must remain exactly 2 Resort/Riviera + 2 Daily Old-Money + 1 Urban/Travel, with at most 2 plain tee-led and 2 open overshirt/utility looks.
- Use the exact header format: OUTFIT [NUMBER] — [CONTEXT NAME].
- Use the exact field labels: TOP:, LAYER:, BOTTOM:, FOOTWEAR:, ACCESSORY:, OCCASION ANCHOR:.

`;
    prompt = OUTFIT_SKILL + '\n\n' + outfitLibrary + '\n\n' + climateHeader + prompt;
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
    .replace(/^(?:PASS\s*[12]|CANDIDATE\s+OUTFITS?|SCORING|SCORES?|REALISM|RELEVANCE|ICONIK|DIVERSITY)\b.*$/gim, '')
    .replace(/^(?:Free Note Translation|Outfit split confirmed|Top silhouette distribution|Cap compliance|Location|Colours to avoid[^:]*|Universal neutrals planned|Palette colours[^:]*|Short-client module):.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function runSection4(classification: ClassificationResult, submission: ManIntakeSubmission, selectionSalt = ''): Promise<string> {
  const raw = await callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionUserPrompt(4, classification, submission, selectionSalt), 65536);
  return stripSection4Preamble(raw);
}

function buildSection4RepairPrompt(
  classification: ClassificationResult,
  currentSection4: string,
  issues: ManReportQaIssue[],
): string {
  const now = new Date();
  const climate = getManReportClimateProfile(classification, now);
  return `${OUTFIT_SKILL}

${formatManOutfitLibraryForPrompt(classification, undefined, now)}

DERIVED VARIABLES (use these — do not re-derive):
CLIMATE_MODE = ${climate.mode.toUpperCase()}
CLIMATE_LABEL = ${climate.label}
CLIMATE REQUIREMENTS: ${climate.promptGuidance}

You are repairing Section 4 of an ICONIK Men's Blueprint before outfit images are generated.

Return ONLY the corrected Section 4 outfit text. Do not include explanations, QA notes, markdown fences, or any text before the first outfit.

Repair goal:
- Fix every blocking QA issue listed below.
- Preserve the client's profile, body logic, colour season, climate rules, style direction, and outfit contexts.
- Rewrite only outfits directly implicated by the blocking issues. Preserve every passing outfit verbatim.
- If one outfit has a hot-climate restricted garment or fabric, replace the restricted item with a permitted HOT-climate equivalent and check the entire section for the same problem.
- Apply the v6.1 Garment Reality Rule while repairing: no invented garments, no multi-colour single garments, no contrast trims/panels/piping, no draped/gathered/twist/asymmetric/cutout effects, and no fantasy hybrid garments.
- Keep the v6.1 Suit Exception: matched suits are allowed in Office/Formal and Evening when the inner shirt/knit creates clear depth contrast.
- Apply the v6.1 Elevation Mandate while repairing: every outfit must include 2-4 visible elevation moves, with at least one from categories A-C.
- Remove mannequin-default combinations unless you can visibly rescue them with at least two elevation moves. Prefer elevated colour words such as ecru, warm ivory, ink navy, espresso, stone, oatmeal, sage, tobacco, burgundy, and dark olive where they fit the client.
- Enforce the v2-9plus portfolio: Formal 2 suits + 2 blazer separates + 2 shirt-led formals with at least 3 ties, except explicit suit/tie anti-preferences replace only those matching slots; climate-aware Evening statement outerwear; Relaxed 2 Resort/Riviera + 2 Daily Old-Money + 1 Urban/Travel; 5-7 patterns unless explicitly rejected.
- The tonal varsity exception permits only a matte, plain, tonal varsity jacket with no logos, patches, lettering, shine, or loud contrast.

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
- Every outfit must include TOP, LAYER, BOTTOM, FOOTWEAR, ACCESSORY, and OCCASION ANCHOR.
- No skinny or spray-on cuts. No cropped or ankle-cut trousers.
- Every garment must read as a purchasable product: colour + fabric + standard garment type.
- Every outfit must look styled, not basic: use at least two v6.1 elevation moves and avoid plain default combinations.
- At least 6 final outfits must use a non-default elevated colour as a primary top or layer outside plain white/navy/black/beige/grey.
- Adjacent outfits must not repeat the same or close primary top colour family. Treat white/ecru/ivory/cream/off-white/chalk/bone as one light-neutral family and stone/oatmeal/sand/beige as one pale-earth family. Do not repeat a visible layer colour family in consecutive looks either.
- No blazer in RELAXED CASUAL.
- Never introduce satin, silk, or shiny fabrics anywhere, including ties and pocket squares; ties are grenadine, knitted, or matte woven only.
- Never remove a layer while repairing: replace a climate- or preference-unsafe layer with a permitted equivalent of similar formality. Evening keeps at most 2 no-layer looks.
- Never change an outfit's footwear category while repairing; the portfolio must keep at least 6 distinct footwear types across the 20 outfits.
- Follow CLIMATE REQUIREMENTS exactly. In MONSOON mode, keep the outfit rain-aware: no suede/nubuck, heavy winter fabrics, overcoats, puffers, or scarves; keep each outfit's existing footwear category in its most rain-practical leather or rubber-soled version, and use weather-sensible fabrics.
- Use the exact outfit header format: OUTFIT [NUMBER] — [CONTEXT NAME].
- Use the exact field labels: TOP:, LAYER:, BOTTOM:, FOOTWEAR:, ACCESSORY:, OCCASION ANCHOR:`;
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

function buildManSection4QaOptions(classification: ClassificationResult) {
  const antiPreferences = classification.style_brief.anti_preferences;
  return {
    enforceV2: true,
    patternWaiver: /\b(no|avoid|dislike|hate)\b.{0,24}\b(pattern|print|stripe|check)/i.test(
      `${antiPreferences} ${classification.colour.pattern_guidance}`,
    ),
    suitWaiver: /\b(no|avoid|dislike|hate)\b.{0,18}\bsuits?\b/i.test(antiPreferences),
    tieWaiver: /\b(no|avoid|dislike|hate)\b.{0,18}\bties?\b/i.test(antiPreferences),
  } as const;
}

function section4QaPassed(qa: ManReportQaResult): boolean {
  return !qa.issues.some(item => item.severity === 'error') && Boolean(qa.quality?.passed);
}

export async function repairSection4OutfitsUntilQaPass(
  classification: ClassificationResult,
  currentSection4: string,
  maxRepairAttempts = 2,
): Promise<{ section4: string; qa: ManReportQaResult; repaired: boolean }> {
  let section4 = currentSection4;
  const qaOptions = buildManSection4QaOptions(classification);
  let qa = validateManReportSection4(section4, classification, qaOptions);
  let repaired = false;

  for (let attempt = 0; attempt < maxRepairAttempts; attempt++) {
    const blockingIssues = qa.issues.filter(issue => issue.severity === 'error');
    if (blockingIssues.length === 0) break;

    section4 = await repairSection4Outfits(classification, section4, blockingIssues);
    qa = validateManReportSection4(section4, classification, qaOptions);
    repaired = true;
  }

  return { section4, qa, repaired };
}

export async function generateSection4AtQualityFloor(
  classification: ClassificationResult,
  submission: ManIntakeSubmission,
  currentSection4 = '',
  currentSelectionSalt = '',
): Promise<{ section4: string; qa: ManReportQaResult; repaired: boolean; reselected: boolean; selectionSalt: string }> {
  const initial = currentSection4.trim() ? currentSection4 : await runSection4(classification, submission, currentSelectionSalt);
  const repaired = await repairSection4OutfitsUntilQaPass(classification, normaliseSequentialManOutfitNumbers(initial), 2);
  if (section4QaPassed(repaired.qa)) {
    return { ...repaired, reselected: false, selectionSalt: currentSelectionSalt };
  }

  // Full regeneration attempts: a fresh library selection AND generation, each
  // followed by its own repair loop — a fresh draft is never discarded on the
  // first QA read without a repair chance.
  let lastQa = repaired.qa;
  for (const selectionSalt of ['reselection-v2', 'reselection-v3'].filter(salt => salt !== currentSelectionSalt)) {
    const reselectedText = normaliseSequentialManOutfitNumbers(
      await runSection4(classification, submission, selectionSalt),
    );
    const reselected = await repairSection4OutfitsUntilQaPass(classification, reselectedText, 2);
    if (section4QaPassed(reselected.qa)) {
      return { section4: reselected.section4, qa: reselected.qa, repaired: reselected.repaired, reselected: true, selectionSalt };
    }
    lastQa = reselected.qa;
  }

  throw new Error(`Outfit portfolio remained below the v2 9/10 quality floor after regeneration and repair: ${lastQa.issues.filter(item => item.severity === 'error').map(item => item.message).join(' ')}`);
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
