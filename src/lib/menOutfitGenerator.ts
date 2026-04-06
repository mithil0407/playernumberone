// menOutfitGenerator.ts — ICONIK Club Men
// 3-pass generation: diagnose style profile → ideal blueprints → match to catalog

import { GoogleGenAI } from '@google/genai';
import type { MenFashionItem, MenOutfitOccasion } from './supabaseClubMen';

function getAI() {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
  return new GoogleGenAI({ apiKey: key });
}

export interface MenOutfitRecommendation {
  itemIds: string[];
  occasion: MenOutfitOccasion;
  styleNote: string;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface MenStyleDiagnosis {
  chromaticHarmony: {
    undertone: 'warm' | 'cool' | 'neutral' | 'deep-warm';
    palette: string;       // description of his colour language
    explanation: string;
  };
  buildProfile: {
    shape: 'athletic' | 'lean' | 'stocky' | 'broad' | 'average';
    fitLanguage: string;   // specific fit guidance for this shape
    explanation: string;
  };
  disruptorStyle: {
    type: 'chromatic' | 'structural' | 'accessory' | 'footwear';
    explanation: string;
  };
  signatureCodes: string[];
}

interface MenOutfitBlueprint {
  occasion: MenOutfitOccasion;
  title: string;
  top: string;             // shirt, tshirt, kurta — always required
  layer: string | null;    // blazer, jacket, waistcoat — optional
  bottom: string;          // trousers, jeans, chinos — always required
  shoes: string;           // always required
  accessory: string | null; // watch, pocket square, belt — optional
  disruptor: string;
  colourHierarchy: string;
  fitNote: string;         // how this outfit addresses the client's build
}

// ─── Season ───────────────────────────────────────────────────────────────────

function getIndianSeason(date: Date): { season: string; description: string } {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return { season: 'Summer', description: 'Hot Indian summer (March–May). Lightweight cotton shirts, linen trousers, breathable fabrics. Avoid heavy layering or woolen pieces.' };
  }
  if (month >= 6 && month <= 9) {
    return { season: 'Monsoon', description: 'Monsoon (June–September). Prefer quick-dry fabrics. Closed shoes over open sandals. Avoid raw silk or suede.' };
  }
  if (month >= 10 && month <= 11) {
    return { season: 'Post-Monsoon / Early Winter', description: 'Transitional weather (October–November). Light layers work well — an unstructured blazer or light jacket over a shirt.' };
  }
  return { season: 'Winter', description: 'Cool Indian winter (December–February). Full sleeves, light woolens, structured blazers, layering appropriate.' };
}

// ─── Restrictions ─────────────────────────────────────────────────────────────

const RESTRICTION_RULES: Record<string, string> = {
  formal_only:
    'FORMAL ONLY — The client dresses exclusively in formal contexts. Avoid casual pieces like t-shirts, sneakers, or denim. Every outfit should be office-appropriate or smarter.',
  no_shorts:
    'NO SHORTS — Never include shorts in any outfit. Always use full-length trousers, chinos, or kurta bottoms.',
  no_indian_wear:
    'NO INDIAN WEAR — The client does not wear kurtas or ethnic pieces. Exclude all Indian occasion wear. Use Western formal or smart-casual for all occasions.',
  indian_wear_only:
    'INDIAN WEAR PREFERRED — The client strongly prefers kurtas, sherwanis, and Indo-western pieces. Prioritise ethnic and fusion options wherever possible.',
};

// ─── Build Profile Fit Language ───────────────────────────────────────────────

const BUILD_FIT_BRIEFS: Record<string, string> = {
  athletic:
    'ATHLETIC — Broad shoulders, narrow waist (V-taper). Lean into the silhouette: slim-fit shirts, tapered trousers. Avoid boxy or oversized fits that hide the shape. Structure pieces (blazers) should be well-fitted, not padded.',
  lean:
    'LEAN — Slim frame. Add visual weight and width with slightly relaxed-fit trousers, structured blazers that add shoulder presence, and layering. Avoid extremely tight fits that emphasise narrowness.',
  stocky:
    'STOCKY — Fuller waist and chest. Straight-cut or slightly relaxed trousers (not slim). Unstructured or lightly structured blazers. Monochromatic builds to create a clean, elongated read. Avoid strong horizontal breaks at the waist.',
  broad:
    'BROAD — Wide frame overall. Similar to athletic but with more emphasis on proportion. Tapered trousers to balance the upper body. Avoid anything that adds bulk on top.',
  average:
    'AVERAGE — Balanced proportions. Slim-straight or regular-fit trousers work well with most tops. Has the most flexibility — can use structure or relaxed fits depending on the occasion.',
};

// ─── Pass 0: Style Diagnosis ──────────────────────────────────────────────────

async function diagnoseStyleProfile(
  styleNotes: string | null,
  bodyShape: string | null,
  measurements: { height_cm?: number; weight_kg?: number; chest_cm?: number; waist_cm?: number; shoulder_cm?: number }
): Promise<MenStyleDiagnosis | null> {
  if (!styleNotes?.trim() && !bodyShape) return null;

  const prompt = `You are a senior menswear stylist at ICONIK Club. Diagnose this client's personal style across three dimensions.

${styleNotes?.trim() ? `CLIENT STYLE NOTES:\n"${styleNotes.trim()}"` : ''}
${bodyShape ? `\nBody shape (admin-assessed): ${bodyShape}` : ''}
${measurements.height_cm ? `\nMEASUREMENTS:\n- Height: ${measurements.height_cm} cm\n- Weight: ${measurements.weight_kg ?? 'unknown'} kg\n- Chest: ${measurements.chest_cm ?? 'unknown'} cm\n- Waist: ${measurements.waist_cm ?? 'unknown'} cm\n- Shoulder: ${measurements.shoulder_cm ?? 'unknown'} cm` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 1 — CHROMATIC HARMONY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
warm      — Earthy, golden palette: camel, olive, rust, cream, chocolate, warm khaki, cognac. Gold hardware. Avoids stark cool tones.
cool      — Crisp, blue-based palette: navy, charcoal, cool grey, burgundy, slate, stone. Silver hardware. Avoids yellow-warm tones.
neutral   — Moves across both: all neutrals work, picks one temperature per outfit and commits.
deep-warm — Rich saturated colours on dark skin: cobalt, emerald, ivory, warm gold, rich brown. Avoids pastels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 2 — BUILD PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
athletic  — V-taper. Slim-fit shirts, tapered trousers. Blazers well-fitted.
lean      — Add width via structure and layering. Relaxed-fit trousers, structured blazers.
stocky    — Streamline. Straight-cut trousers, unstructured blazers, monochromatic builds.
broad     — Balance upper body with tapered trousers. Avoid bulk on top.
average   — Flexible. Slim-straight or regular-fit works across occasions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 3 — DISRUPTOR STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
chromatic   — Unexpected colour pairing that creates a deliberate tension (e.g. rust shirt with grey trousers).
structural  — Unexpected layer or proportion (waistcoat instead of blazer, overshirt as outerwear).
accessory   — Unexpected finishing detail (bold watch, printed pocket square against a quiet suit).
footwear    — Unexpected shoe choice (chunky loafers with formal trousers, suede chelsea boots with casual denim).

Return ONLY a valid JSON object:
{
  "chromaticHarmony": {
    "undertone": "warm" | "cool" | "neutral" | "deep-warm",
    "palette": "2-3 sentence description of his colour language and the tones he reaches for",
    "explanation": "1-2 sentences on which patterns led to this read"
  },
  "buildProfile": {
    "shape": "athletic" | "lean" | "stocky" | "broad" | "average",
    "fitLanguage": "Specific fit guidance for this build in 1-2 sentences",
    "explanation": "1-2 sentences on what led to this assessment"
  },
  "disruptorStyle": {
    "type": "chromatic" | "structural" | "accessory" | "footwear",
    "explanation": "1-2 sentences on how he creates intentional tension in his looks"
  },
  "signatureCodes": ["3-5 short strings — recurring rules that define his personal style, e.g. 'Always leather shoes', 'Tucks in shirts', 'One accessory maximum'"]
}

Return ONLY the JSON. No markdown, no explanation.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    const text = response.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) { console.warn('Men diagnoseStyleProfile: no JSON found'); return null; }
    const diagnosis = JSON.parse(match[0]) as MenStyleDiagnosis;
    console.log(`Men style diagnosis — undertone: ${diagnosis.chromaticHarmony.undertone} | build: ${diagnosis.buildProfile.shape} | disruptor: ${diagnosis.disruptorStyle.type}`);
    return diagnosis;
  } catch (err) {
    console.warn('Men diagnoseStyleProfile failed:', err);
    return null;
  }
}

// ─── Pass 1: Ideal Blueprint Generation ───────────────────────────────────────

async function generateIdealBlueprints(
  diagnosis: MenStyleDiagnosis | null,
  activeRestrictions: string[],
  season: { season: string; description: string },
  bodyShape: string | null,
  styleNotes: string | null
): Promise<MenOutfitBlueprint[]> {
  const restrictionsBlock = activeRestrictions.length > 0
    ? `⛔ ABSOLUTE RESTRICTIONS — apply to every blueprint:\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n\n`
    : '';

  const diagnosisBlock = diagnosis
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT STYLE DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHROMATIC HARMONY: ${diagnosis.chromaticHarmony.undertone.toUpperCase()}
${diagnosis.chromaticHarmony.palette}
${diagnosis.chromaticHarmony.explanation}

BUILD PROFILE: ${diagnosis.buildProfile.shape.toUpperCase()}
${diagnosis.buildProfile.fitLanguage}
${diagnosis.buildProfile.explanation}

DISRUPTOR STYLE: ${diagnosis.disruptorStyle.type.toUpperCase()}
${diagnosis.disruptorStyle.explanation}

SIGNATURE CODES (honour in every outfit):
${diagnosis.signatureCodes.map(c => `- ${c}`).join('\n')}

`
    : styleNotes?.trim()
      ? `CLIENT STYLE NOTES:\n"${styleNotes.trim()}"\n\n`
      : '';

  const buildBrief = diagnosis?.buildProfile.shape
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIT LANGUAGE FOR THIS CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${BUILD_FIT_BRIEFS[diagnosis.buildProfile.shape] ?? ''}

`
    : bodyShape
      ? `Client body shape: ${bodyShape}\n\n`
      : '';

  const prompt = `You are a senior menswear stylist at ICONIK Club. Design 6 ideal outfit blueprints for this client — one per occasion. Design freely, as if shopping at any store. Do NOT constrain yourself to any existing catalog.

${restrictionsBlock}${diagnosisBlock}${buildBrief}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOUR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 3 colours per outfit — fewer is better. 2 is ideal.
- Build around one neutral anchor (navy, charcoal, white, black, camel, stone, olive) plus at most one secondary tone.
- Tonal dressing (different shades of the same colour family) is strongly preferred.
- Never combine more than one bold or patterned piece — one statement item, everything else quiet.
- For Indian occasion outfits: rich deep tones (terracotta, emerald, burgundy, ivory) are appropriate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTFIT PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. FIT FOR BUILD — Every garment must be specified with the correct fit for this client's build profile (see above). Name the fit explicitly: slim-fit, tapered, regular, relaxed, straight-cut.

2. ONE FOCAL PIECE — Every outfit has one focal piece that gives it character. Everything else supports it quietly. Cleaner is better — do not over-layer or over-accessorise.

3. FABRIC SPEAKS THE OCCASION:
   - office/evening: wool-blend, crepe, fine cotton, linen-blend
   - smart-casual: cotton, linen, knit polo, chinos fabric
   - casual/weekend: cotton, linen shirt, well-fitted denim, jersey
   - indian-occasion: silk, cotton voile, linen kurta, embroidered fabric

4. ONE DISRUPTOR — Every outfit has one element that matches the client's disruptor style. Keep it subtle and intentional.

5. WARDROBE COHERENCE — All 6 blueprints must share a colour story, a consistent fit language, and a recurring accessory language. They should feel like one wardrobe, not 6 disconnected looks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always include exactly one bottom (trousers, jeans, or churidar) — never two
- Always include footwear
- Layer (blazer/jacket) is optional — include only when it improves the look
- Accessory is optional — include only if it adds genuine character (watch, pocket square, belt)
- Modern and minimal: the goal is a man who looks like he made a decision, not one who tried too hard

Current season: ${season.season}
${season.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCCASIONS (one blueprint per occasion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
office          — Sharp and professional for Indian metro office. Structured trousers, dress shirts, blazers. Leather shoes or smart loafers.
smart-casual    — Elevated casual: chinos or tailored trousers, clean shirt or knit polo, loafers. Between office and weekend.
casual          — Relaxed but intentional. Well-fitted jeans or chinos, a t-shirt or linen shirt, clean sneakers or loafers.
indian-occasion — Weddings, festivals, celebrations. Kurtas, sherwanis, nehru-collar pieces in rich fabrics. Kolhapuris, juttis, or formal leather shoes.
weekend         — Stylish and comfortable for brunch or errands. Clean sneakers, relaxed trousers or jeans, a relaxed shirt or polo.
evening         — Dinner out or upscale gathering. Slim trousers, a refined shirt or turtleneck, leather shoes or Chelsea boots. Quiet elegance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create exactly 6 ideal outfit blueprints. Each occasion must appear exactly once.

For every garment, include: specific colour name, fabric, cut/fit, and any defining detail.
Good example: "Slim-fit navy wool-blend trousers, flat-front, tapered leg, clean hem"
Bad example: "Trousers"

Return ONLY a valid JSON array of exactly 6 objects:
[
  {
    "occasion": "office",
    "title": "3-5 word evocative title",
    "top": "Full description — always required",
    "layer": "Full description of blazer/jacket/waistcoat OR null",
    "bottom": "Full description — always required",
    "shoes": "Full description — always required",
    "accessory": "Full description OR null",
    "disruptor": "Name the disruptor element and one sentence on why it works",
    "colourHierarchy": "ANCHOR = [neutral colour — piece]. SECONDARY = [tone — piece]. ACCENT = [finishing colour — piece]",
    "fitNote": "One sentence on how the fit choices address this client's build"
  }
]

Return ONLY the JSON array. No markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = response.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in men blueprint response: ${text.slice(0, 300)}`);
  const blueprints = JSON.parse(match[0]) as MenOutfitBlueprint[];
  if (!Array.isArray(blueprints) || blueprints.length === 0) throw new Error('Invalid men blueprints from Gemini');
  console.log(`Generated ${blueprints.length} men's blueprints — occasions: ${blueprints.map(b => b.occasion).join(', ')}`);
  return blueprints;
}

// ─── Pass 2: Catalog Matching ──────────────────────────────────────────────────

async function matchBlueprintsToItems(
  blueprints: MenOutfitBlueprint[],
  items: MenFashionItem[],
  activeRestrictions: string[]
): Promise<MenOutfitRecommendation[]> {
  const catalog = items.map(item => {
    const entry: Record<string, unknown> = {
      id: item.id,
      name: item.item_name,
      category: item.category,
    };
    if (item.color?.length) entry.color = item.color;
    if (item.material?.length) entry.material = item.material;
    if (item.price != null) entry.price = item.price;
    if (item.style_description) entry.description = item.style_description;
    return entry;
  });

  const restrictionReminder = activeRestrictions.length > 0
    ? `⛔ RESTRICTIONS — enforce when matching:\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n\n`
    : '';

  const blueprintText = blueprints.map((bp, i) => {
    const slots = [
      `  top (required): "${bp.top}"`,
      bp.layer ? `  layer (optional): "${bp.layer}"` : null,
      `  bottom (required): "${bp.bottom}"`,
      `  shoes (required): "${bp.shoes}"`,
      bp.accessory ? `  accessory (optional): "${bp.accessory}"` : null,
    ].filter(Boolean).join('\n');
    return `BLUEPRINT ${i + 1} — ${bp.title} [${bp.occasion}]\n${slots}\nColour hierarchy: ${bp.colourHierarchy}\nDisruptor: ${bp.disruptor}\nFit note: ${bp.fitNote}`;
  }).join('\n\n');

  const prompt = `You are a menswear buyer for ICONIK Club. Match ideal outfit blueprints to available catalog inventory. Find the closest match for each slot — you are shopping for this client.

${restrictionReminder}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDEAL BLUEPRINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${blueprintText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(catalog)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATCHING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Match by fit and silhouette first, then colour proximity, then fabric weight. Category label is a guide — a tailored shirt can serve as "top", a structured jacket as "layer", etc.
2. Colour proximity: if ideal says "navy slim trousers" and catalog has "charcoal slim trousers", that is an acceptable match — similar tone family and silhouette.
3. For top: match a shirt, tshirt, or kurta.
4. For bottom: match exactly one trouser, jeans, or similar. Never two bottoms.
5. For shoes: always include exactly one shoe item.
6. For layer and accessory: only include if a genuinely good match exists. Do not force.
7. The same item ID must NOT appear in more than 2 outfits across all 6.
8. Only use item IDs that exist in the catalog above. Do not invent IDs.

Return ONLY a valid JSON array of exactly 6 objects:
[
  {
    "occasion": "office",
    "styleNote": "3-5 word title matching the blueprint title",
    "itemIds": ["catalog-id-1", "catalog-id-2", "catalog-id-3"]
  }
]

Return ONLY the JSON array. No markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = response.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in men matching response: ${text.slice(0, 300)}`);
  const recs = JSON.parse(match[0]) as MenOutfitRecommendation[];
  if (!Array.isArray(recs)) throw new Error('Gemini men matching did not return an array');
  console.log(`Men catalog matching complete — ${recs.length} outfits matched`);
  return recs;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function generateMenOutfitRecommendations(
  profile: {
    height_cm?: number;
    weight_kg?: number;
    chest_cm?: number;
    waist_cm?: number;
    shoulder_cm?: number;
    body_shape?: string;
    style_restrictions?: string[] | null;
    style_notes?: string | null;
  },
  items: MenFashionItem[]
): Promise<MenOutfitRecommendation[]> {
  const season = getIndianSeason(new Date());
  const activeRestrictions = (profile.style_restrictions ?? []).filter(r => RESTRICTION_RULES[r]);

  // ── Pass 0: Diagnose style profile ────────────────────────────────────────
  const diagnosis = await diagnoseStyleProfile(
    profile.style_notes ?? null,
    profile.body_shape ?? null,
    {
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      chest_cm: profile.chest_cm,
      waist_cm: profile.waist_cm,
      shoulder_cm: profile.shoulder_cm,
    }
  );

  // ── Pass 1: Generate ideal blueprints ─────────────────────────────────────
  const blueprints = await generateIdealBlueprints(
    diagnosis,
    activeRestrictions,
    season,
    profile.body_shape ?? null,
    profile.style_notes ?? null
  );

  // ── Pass 2: Match blueprints to catalog ───────────────────────────────────
  const recs = await matchBlueprintsToItems(blueprints, items, activeRestrictions);

  // ── Validation: structural guards ─────────────────────────────────────────
  const validIds = new Set(items.map(i => i.id));
  const itemById = new Map(items.map(i => [i.id, i]));
  const BOTTOM_CATS = new Set(['trousers', 'jeans', 'other']);

  const validated = recs.slice(0, 6).map(rec => {
    let ids: string[] = (rec.itemIds ?? []).filter(id => validIds.has(id));

    // Keep only one bottom
    let bottomSeen = false;
    ids = ids.filter(id => {
      const cat = itemById.get(id)?.category ?? '';
      if (BOTTOM_CATS.has(cat)) {
        if (bottomSeen) return false;
        bottomSeen = true;
      }
      return true;
    });

    // Keep only one primary top (shirt/tshirt/kurta) — blazer/outerwear can stack
    let primaryTopSeen = false;
    ids = ids.filter(id => {
      const cat = itemById.get(id)?.category ?? '';
      if (cat === 'shirt' || cat === 'tshirt' || cat === 'kurta') {
        if (primaryTopSeen) return false;
        primaryTopSeen = true;
      }
      return true;
    });

    return { ...rec, itemIds: ids };
  });

  // Inject shoe if AI forgot
  const shoeItems = items.filter(i => i.category === 'shoes');
  if (shoeItems.length > 0) {
    for (const rec of validated) {
      const hasShoes = rec.itemIds.some(id => itemById.get(id)?.category === 'shoes');
      if (!hasShoes) {
        rec.itemIds.push(shoeItems[Math.floor(Math.random() * shoeItems.length)].id!);
      }
    }
  }

  return validated;
}
