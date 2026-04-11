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

═══════════════════════════════════════════════
ABSOLUTE BANNED GARMENTS — NEVER USE IN ANY OUTFIT
═══════════════════════════════════════════════
The following are permanently prohibited regardless of client profile, season, or occasion:
✗ Skinny jeans (tapered below the knee, ankle-hugging silhouette)
✗ Slim-fit trousers with aggressive thigh-to-ankle taper (look for: "slim", "skinny", "spray-on" fit descriptors — all banned)
✗ Body-hugging or muscle-fit t-shirts (fabric stretched across chest/arms, revealing musculature)
✗ Stretch denim in any cut narrower than straight-leg
✗ Compression-style tops worn as outerwear
✗ Jeggings or denim with elastane construction in slim silhouettes
Any outfit that violates the above is invalid. If you notice a violation mid-generation, correct it before outputting.

═══════════════════════════════════════════════
GARMENT VOCABULARY & FIT STANDARDS
═══════════════════════════════════════════════
Approved trouser silhouettes (use these exact descriptors):
  • Straight-leg — consistent width from hip to hem, clean break at shoe
  • Tailored straight — structured, mid-rise, slight taper only through knee (not below)
  • Wide-leg — relaxed through thigh and leg, contemporary proportion
  • Pleated trousers — single or double pleat, high-rise, full seat, straight leg
  • Chinos (straight or tailored straight only — never slim-leg chinos)
  • Cropped trousers — straight leg with no-break hem (appropriate for smart casual/casual only)

Approved top silhouettes:
  • Classic-fit shirt — chest and body have ease, not fitted to the torso
  • Relaxed-fit shirt — more ease through body, intended to be worn untucked or loosely tucked
  • Boxy or straight-cut tee — fabric falls straight from shoulder, not contoured to chest
  • Oversized tee — deliberate volume, worn with intention not by default
  • Knitwear — ribbed, cable, fine-gauge; always with ease through body
  • Polo — classic fit only, never fitted/slim polo

Approved outerwear:
  • Structured blazer / sport coat (single or double breasted)
  • Suit jacket
  • Unstructured linen/cotton blazer
  • Overcoat / topcoat
  • Trench coat
  • Bomber jacket (relaxed fit, not cropped tight)
  • Field jacket / harrington jacket
  • Knitwear layer (cardigan, zip-through)

═══════════════════════════════════════════════
FOOTWEAR TAXONOMY — USE ONLY THESE TERMS
═══════════════════════════════════════════════
Formal/Work:
  • Oxford (cap-toe, plain, brogue) — closed lacing, most formal
  • Derby — open lacing, slightly less formal, more toe box room
  • Loafer (penny, tassel, horsebit) — slip-on, smart casual to semi-formal
  • Chelsea boot — elastic side panel, clean ankle, works formal to smart casual

Smart Casual:
  • Suede loafer — relaxed material, smarter than trainers
  • Suede chukka boot — two-eyelet ankle boot, versatile
  • Derby in suede or textured leather
  • Clean white leather trainer — minimal, no chunky sole

Casual:
  • Canvas or leather low-top trainer (clean, minimal colourway)
  • Suede desert boot
  • Leather sandal (appropriate for India/UAE climates, warm months)

Always specify: shoe type + material + colour.
Example: "Tan suede penny loafer" or "Black leather cap-toe Oxford"

═══════════════════════════════════════════════
OUTFIT FORMAT — REQUIRED FOR ALL 16
═══════════════════════════════════════════════

For each outfit category (from outfit_split in classification), open with:
Category intro (2 sentences): Objective of this category for this specific client — what role these outfits play in his life, and what they should achieve for his presence.

Then for each outfit, use this exact structure:

**Outfit [N] — [Two to three word occasion/mood label]**

- Top: [garment type] in [colour name] ([hex]) — [fit descriptor: classic-fit / relaxed-fit / boxy / oversized] — [fabric: e.g. brushed cotton, fine merino, linen, heavy Oxford cloth] — [tuck instruction: tucked / untucked / half-tuck]
- Bottom: [trouser type from approved list] in [colour name] ([hex]) — [rise: mid-rise / high-rise] — [fabric: e.g. wool-blend, cotton twill, linen, stretch-free denim] — [break: no break / quarter break / half break]
- Layer: [specific outerwear type] in [colour name] ([hex]) — [worn: open / closed / over-arm] | or: No layer
- Footwear: [type + material + colour from approved taxonomy] — [sock note: no-show / fine cotton / wool ribbed / no socks]
- Accessories: [1-2 items maximum — belt, watch, pocket square, bag. Specific material and colour. If none, omit this line entirely]
- Fit note: [One sentence on how each piece should physically fit this client's specific body geometry — reference silhouette type and highlight/minimise zones]
- Colour logic: [One sentence tracing every colour in this outfit back to the palette — name the palette category for each piece]
- Why it works: [One sentence connecting the complete outfit to this client's style brief and aspiration — reference the aesthetic direction and register]

═══════════════════════════════════════════════
GENERATION RULES — ALL 16 MUST PASS EVERY CHECK
═══════════════════════════════════════════════
1. COLOUR FIDELITY — Every colour must come from primary palette, neutral base, or accent colours. Name the palette source for each piece in Colour logic.
2. SILHOUETTE COMPLIANCE — Every bottom must use an approved trouser silhouette. Every top must use an approved top silhouette. No exceptions.
3. STYLE BRIEF ALIGNMENT — Every outfit must be traceable to the aesthetic direction and register in the classification style_brief.
4. UNIQUENESS — No two outfits may share the same top + bottom combination.
5. PALETTE COVERAGE — Across the 16 outfits, every primary palette colour must appear at least once.
6. ASPIRATION ANCHORING — At least 3 outfits must directly reflect the Free Note aspiration (if the Free Note contains substantive content).
7. CATEGORY INTEGRITY — Casual outfits are not downgraded in quality — they must be as colour-correct and silhouette-precise as work outfits.
8. FABRIC LOGIC — Fabric choices must suit the occasion tier (e.g. no linen suit in a formal corporate outfit, no heavy tweed in a casual summer look).
9. LAYERING LOGIC — Only add a layer if it serves a functional or proportional purpose. Specify open vs closed. Never add a layer just to fill the field.
10. FOOTWEAR REGISTER — Shoe formality must match the outfit's occasion tier. No trainers in Work/Formal. No Oxfords in Casual.
11. BANNED GARMENTS CHECK — Before finalising each outfit, verify: no skinny jeans, no slim-tapered trousers, no fitted/muscle-fit tops. If any are present, replace immediately.
12. LOCATION CLIMATE — Factor in the client's location region for layering decisions. India T1 / UAE: reduce layering in warm categories. UK / Canada: include outerwear more frequently.
13. PROPORTION SYSTEM — Each outfit must function as a coherent proportion system. If the bottom has volume (wide-leg, pleated), the top should have some structure or tuck. If the top has volume (oversized, relaxed), the bottom should be cleaner and straighter.

Before generating the first outfit: confirm total = exactly 16, all categories represented, counts match classification outfit_split. State this confirmation as a single line before the first category header.

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

async function callGeminiText(systemPrompt: string, userPrompt: string): Promise<string> {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: combined }] }],
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
