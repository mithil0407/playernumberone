// globeReportGenerator.ts
// Two-phase text pipeline for the ICONIK Globe women's Blueprint.

import { GoogleGenAI } from '@google/genai';
import type { GlobeIntakeSubmission } from './supabaseGlobe';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

const CLASSIFICATION_SYSTEM_PROMPT = `You are ICONIK's Classification Engine for international women's style analysis.
Return only valid JSON. No markdown fences, no explanation.

Classify the intake into a deterministic styling profile for a women's personal Style Blueprint.
Use the client's self-reported colour season as a strong signal. Respect modesty, body concerns, location climate, wardrobe mix, and free-text preferences.

Every field must be populated. Use precise fashion language. Generate exactly 20 total outfit slots.`;

const CLASSIFICATION_USER_TEMPLATE = `Classify this ICONIK Globe women's intake form.

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
Modesty Level: {{modesty_level}}
Skin Tone: {{skin_tone}}
Undertone: {{undertone}}
White Test: {{white_test}}
Hair Colour: {{hair_colour}}
Eye Colour: {{eye_colour}}
Colour Season: {{colour_season}}
Face Shape: {{face_shape}}
Feature Type: {{feature_type}}
Style Goal: {{style_goal}}
Branch Sub Goal: {{branch_sub_goal}}
Branch Blocker: {{branch_blocker}}
Branch Reference: {{branch_reference}}
Structure: {{structure}}
Expression: {{expression}}
Tone: {{tone}}
Register: {{register}}
Style Blocker: {{style_blocker}}
Anti-Pref: {{anti_pref}}
Anti-Pref Note: {{anti_pref_note}}
Free Note: {{free_note}}

Return this exact JSON shape:
{
  "client": {
    "location_region": "",
    "height_category": "",
    "primary_goal": "",
    "climate_zone": "hot | temperate | cold | mixed"
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
    "hairstyle_recommendations": ["", ""],
    "eyewear_shapes": ["", ""],
    "neckline_guidance": "",
    "earring_guidance": ""
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
    "register": "",
    "expression": "",
    "structure_level": "",
    "anti_preferences": "",
    "style_blocker": "",
    "key_aspiration": "",
    "modesty_rules": ["", ""],
    "signature_codes": ["", "", ""]
  },
  "outfit_split": {
    "total": 20,
    "categories": [
      {"category": "Work", "count": 4, "rationale": ""},
      {"category": "Smart Casual", "count": 4, "rationale": ""},
      {"category": "Evening", "count": 4, "rationale": ""},
      {"category": "Weekend", "count": 4, "rationale": ""},
      {"category": "Formal Occasion", "count": 2, "rationale": ""},
      {"category": "Travel Resort", "count": 2, "rationale": ""}
    ]
  }
}`;

const REPORT_SYSTEM_PROMPT = `You are ICONIK's Senior Style Architect writing a personalised women's Style Blueprint for an international client.
Tone: authoritative, warm, precise, editorial, outcome-focused.
Write directly to the client in second person. Do not mention the classification JSON.
No brand names, celebrity references, product links, or generic styling advice.
Respect modesty and coverage preferences absolutely.
Use women's garment vocabulary: dresses, trousers, skirts, blazers, shirts, blouses, knitwear, co-ords, jumpsuits, outerwear, footwear, bags, jewellery.
Avoid the words: unique, journey, stunning, gorgeous, amazing.`;

const REPORT_USER_TEMPLATE = `Use this classification and original form data to write the full ICONIK Globe Women's Style Blueprint.

--- CLASSIFICATION JSON ---
{{classification_json}}
--- END CLASSIFICATION ---

Free Note: {{free_note}}
Primary Goal: {{primary_goal}}
Style Blocker: {{style_blocker}}

Generate these 6 sections. Use the exact section headers.

---

## SECTION 1: YOUR FACE ARCHITECTURE PROFILE

Opening paragraph: name the face shape and feature type, then explain what the geometry needs.

### Hairstyle Direction
Describe the two recommended hairstyle directions and why they suit her face architecture.

### Sunglasses & Eyeframe Guide
List the two recommended frame shapes and explain why each works.

### Necklines & Earrings
Give direct neckline and earring guidance for this face shape.

---

## SECTION 2: YOUR BODY GEOMETRY ANALYSIS

One sentence naming the silhouette type and the most important styling principle.

### Structural Strengths
3 bullets maximum. Each bullet names one garment, cut, or styling structure she carries well.

### Fit Blueprint
4-5 bullets. Each starts with a bold rule title, then one sentence of geometric logic.

### Cuts to Avoid
3 bullets maximum. Be precise and use no shame language.

### Height Equation
2 bullets for length, rise, hem, vertical line, or scale adjustments.

---

## SECTION 3: YOUR CHROMATIC HARMONY MAP

Opening paragraph: name the colour season, undertone, depth, saturation, and contrast.

### Your Primary Palette
List all 6 primary colours with hex codes and usage notes.

### Your Neutral Base
List the 3 neutral base colours and where to use them.

### Your Accent Colours
List the 2 accent colours and how to deploy them.

### Colours to Avoid
List the 3 avoid colours with exact reasons.

### Pattern & Fabric Guidance
One paragraph on pattern scale, contrast, texture, shine, and fabric weight.

---

## SECTION 4: YOUR 20 OUTFITS

Generate exactly 20 outfits in this order:
- Outfits 1-4: WORK
- Outfits 5-8: SMART CASUAL
- Outfits 9-12: EVENING
- Outfits 13-16: WEEKEND
- Outfits 17-18: FORMAL OCCASION
- Outfits 19-20: TRAVEL RESORT

Every outfit must use this exact structure:

**Outfit [N] - [Two to four word label]**

- Top: [specific garment, colour, fabric, neckline/sleeve detail] OR No separate top
- Bottom: [specific garment, colour, fabric, silhouette] OR No separate bottom
- Single Piece: [dress/jumpsuit/co-ord, colour, fabric, cut] OR No single piece
- Layer: [specific layer, colour, fabric, cut] OR No layer
- Footwear: [specific shoe, colour, heel height or sole, toe shape]
- Bag: [specific bag style, colour, hardware]
- Jewellery: [specific jewellery pieces and metal]
- Fit note: [one sentence tied to her body geometry]
- Colour logic: [TONAL / ANALOGOUS / NEUTRAL ANCHOR + ACCENT / DARK-LIGHT CONTRAST, with exact colours]
- Occasion anchor: [where she wears it and what it signals]

Rules:
- Respect modesty level in every outfit.
- No cropped tops, backless styles, ultra-short hemlines, sheer exposure, or low necklines unless explicitly allowed.
- Use at least 6 different outfit silhouettes across the 20 looks.
- Use climate-appropriate fabrics for the client's location.
- Do not repeat the same top+bottom or dress logic.
- Include bags and jewellery in every outfit.

---

## SECTION 5: YOUR STYLE RULES

### 3 Always Rules
Three rules specific to her body + colour + style brief.

### 3 Never Rules
Three optimisation rules for cuts, colours, or styling choices to avoid.

---

## SECTION 6: YOUR STYLE IDENTITY STATEMENT

One paragraph, 5-7 sentences. Write like a senior stylist who understands her self-concept, lifestyle, body, colouring, and desired presence.`;

export interface ClassificationResult {
  client: {
    location_region: string;
    height_category: string;
    primary_goal: string;
    climate_zone?: string;
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
    hairstyle_recommendations: string[];
    eyewear_shapes: string[];
    neckline_guidance?: string;
    earring_guidance?: string;
    facial_hair_recommendations?: string;
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
    tribes?: string[];
    register: string;
    expression: string;
    structure_level: string;
    anti_preferences: string;
    style_blocker: string;
    key_aspiration: string;
    modesty_rules?: string[];
    signature_codes?: string[];
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

const FIELD_MAPS: Record<string, Record<string, string>> = {
  primary_goal: {
    body_shape: 'Understand what suits my body shape',
    signature_style: 'Build a signature style',
    professional: 'Look more polished for work',
    body_change: 'Style reset after body change',
    modest: 'Dress modestly without looking frumpy',
  },
  location_tier: {
    india_t1: 'India - Tier 1 city',
    india_t2: 'India - Tier 2/3 city',
    uk: 'UK / Europe',
    uae: 'UAE / Middle East',
    canada_usa: 'Canada / USA',
    other: 'International - Other',
  },
  style_blocker: {
    nothing_fits: 'Nothing fits the way I want it to',
    dont_know_body: "I don't know what works on my body",
    buy_never_wear: 'I buy things I never wear',
    dont_know_style: "I don't know what my style actually is",
    dress_for_others: 'I dress for others, not myself',
    dont_know_where: "I don't know where to shop",
    lifestyle: "My lifestyle doesn't allow the style I want",
  },
};

function cleanJson(text: string): string {
  return text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
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
  } catch {}
  return val.split(',').map(v => readable(v.trim())).join(', ');
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [key, val]) => t.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || 'Not specified'),
    template,
  );
}

function buildTemplateVars(sub: GlobeIntakeSubmission): Record<string, string> {
  return {
    email: sub.customer_email ?? 'Not provided',
    location: mapField('location_tier', sub.location_tier),
    primary_goal: mapField('primary_goal', sub.primary_goal),
    style_relationship: readable(sub.style_relationship),
    dressing_context: parseMulti(sub.dressing_context),
    wardrobe: parseMulti(sub.wardrobe_composition),
    height: readable(sub.height_category),
    body_shape: readable(sub.body_shape),
    fat_storage: readable(sub.fat_storage_zone),
    highlight_zone: readable(sub.highlight_zone),
    minimise_zone: readable(sub.minimise_zone),
    fit_preference: readable(sub.fit_preference),
    modesty_level: readable(sub.modesty_level),
    skin_tone: readable(sub.skin_tone),
    undertone: readable(sub.vein_undertone),
    white_test: readable(sub.white_test),
    hair_colour: readable(sub.hair_colour),
    eye_colour: readable(sub.eye_colour),
    colour_season: readable(sub.derived_colour_season),
    face_shape: readable(sub.face_shape),
    feature_type: readable(sub.facial_feature_type),
    style_goal: readable(sub.primary_style_goal),
    branch_sub_goal: readable(sub.branch_sub_goal),
    branch_blocker: readable(sub.branch_blocker),
    branch_reference: readable(sub.branch_reference),
    structure: readable(sub.style_pole_structure),
    expression: readable(sub.style_pole_expression),
    tone: readable(sub.style_pole_tone),
    register: readable(sub.style_pole_register),
    style_blocker: mapField('style_blocker', sub.style_blocker),
    anti_pref: readable(sub.style_anti_pref),
    anti_pref_note: sub.style_anti_pref_note ?? 'Not specified',
    free_note: sub.free_text_note ?? 'Not provided',
  };
}

function parseReportSections(text: string): ReportSections {
  const sectionMap: Record<string, string> = {};
  const parts = text.split(/(##\s*SECTION\s*\d+:[^\n]*)/i);
  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i];
    const content = (parts[i + 1] ?? '').trim();
    const numMatch = header.match(/SECTION\s*(\d+)/i);
    if (numMatch) sectionMap[numMatch[1]] = `${header.trim()}\n\n${content}`.trim();
  }
  return {
    s1_face: sectionMap['1'] ?? '',
    s2_body: sectionMap['2'] ?? '',
    s3_colour: sectionMap['3'] ?? '',
    s4_outfits: sectionMap['4'] ?? '',
    s5_rules: sectionMap['5'] ?? '',
    s6_identity: sectionMap['6'] ?? '',
  };
}

async function withTextRetry<T>(fn: () => Promise<T>, maxAttempts = 4, baseDelayMs = 5_000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      const transient = ['503', 'unavailable', 'high demand', '429', 'resource_exhausted', 'quota', 'rate limit', 'overloaded']
        .some(s => msg.includes(s));
      if (!transient || attempt === maxAttempts - 1) throw err;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
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
    return JSON.parse(cleanJson(response.text ?? ''));
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

export async function runClassification(submission: GlobeIntakeSubmission): Promise<ClassificationResult> {
  const userPrompt = fillTemplate(CLASSIFICATION_USER_TEMPLATE, buildTemplateVars(submission));
  return (await callGeminiJSON(CLASSIFICATION_SYSTEM_PROMPT, userPrompt)) as ClassificationResult;
}

export async function runReportGeneration(
  classification: ClassificationResult,
  submission: GlobeIntakeSubmission,
): Promise<ReportSections> {
  const text = await callGeminiText(REPORT_SYSTEM_PROMPT, buildFullReportPrompt(classification, submission), 65536);
  return parseReportSections(text);
}

const sectionBlocks = REPORT_USER_TEMPLATE
  .split('\n\n---\n\n')
  .filter(block => block.trimStart().startsWith('## SECTION'));

function buildFullReportPrompt(classification: ClassificationResult, submission: GlobeIntakeSubmission): string {
  return fillTemplate(REPORT_USER_TEMPLATE, {
    classification_json: JSON.stringify(classification, null, 2),
    free_note: submission.free_text_note ?? 'Not provided',
    primary_goal: mapField('primary_goal', submission.primary_goal),
    style_blocker: mapField('style_blocker', submission.style_blocker),
  });
}

function buildSectionPrompt(sectionIndex: number, classification: ClassificationResult, submission: GlobeIntakeSubmission): string {
  const base = fillTemplate(`Use this data to write exactly one section of the ICONIK Globe Women's Style Blueprint.
Write only the requested section and use the exact header.

--- CLASSIFICATION JSON ---
{{classification_json}}
--- END CLASSIFICATION ---

Free Note: {{free_note}}
Primary Goal: {{primary_goal}}
Style Blocker: {{style_blocker}}

`, {
    classification_json: JSON.stringify(classification, null, 2),
    free_note: submission.free_text_note ?? 'Not provided',
    primary_goal: mapField('primary_goal', submission.primary_goal),
    style_blocker: mapField('style_blocker', submission.style_blocker),
  });
  return base + sectionBlocks[sectionIndex];
}

export async function runSection1(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(0, classification, submission));
}

export async function runSection2(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(1, classification, submission));
}

export async function runSection3(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(2, classification, submission));
}

export async function runSection4(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(3, classification, submission), 65536);
}

export async function runSection5(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(4, classification, submission));
}

export async function runSection6(classification: ClassificationResult, submission: GlobeIntakeSubmission): Promise<string> {
  return callGeminiText(REPORT_SYSTEM_PROMPT, buildSectionPrompt(5, classification, submission));
}
