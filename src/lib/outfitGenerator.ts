import { GoogleGenAI } from '@google/genai';
import type { FashionItem, OutfitOccasion } from './supabase';

function getAI() {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
  return new GoogleGenAI({ apiKey: key });
}

export interface OutfitRecommendation {
  itemIds: string[];
  occasion: OutfitOccasion;
  styleNote: string;
  blueprint?: OutfitBlueprint;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface StyleDiagnosis {
  chromaticHarmony: {
    undertone: 'warm' | 'cool' | 'neutral' | 'deep-warm' | 'olive';
    explanation: string;
  };
  silhouetteProfile: {
    bodyShape: 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle' | 'petite' | 'plus';
    explanation: string;
  };
  disruptorStyle: {
    type: 'chromatic' | 'structural' | 'accessory' | 'footwear';
    explanation: string;
  };
  signatureCodes: string[];
}

export interface OutfitBlueprint {
  occasion: OutfitOccasion;
  title: string;
  singlePiece: string | null;  // dress or jumpsuit — when set, top+bottom are null
  top: string | null;
  layer: string | null;
  bottom: string | null;
  shoes: string;
  bag: string | null;
  accessory: string | null;
  disruptor: string;
  colourHierarchy: string;
  structurePiece: string;
}

// ─── Season ───────────────────────────────────────────────────────────────────

function getIndianSeason(date: Date): { season: string; description: string } {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return { season: 'Summer', description: 'Hot Indian summer (March–May). Prioritise light, breathable fabrics like cotton and linen. Minimal layering. Light colours work well.' };
  }
  if (month >= 6 && month <= 9) {
    return { season: 'Monsoon', description: 'Monsoon season (June–September). Avoid delicate or dry-clean-only fabrics. Prefer quick-dry materials. Closed or water-resistant footwear is better than open sandals.' };
  }
  if (month >= 10 && month <= 11) {
    return { season: 'Post-Monsoon / Early Winter', description: 'Pleasant transitional weather (October–November). Light layers work well. A mix of breathable and slightly warmer pieces is ideal.' };
  }
  return { season: 'Winter', description: 'Cool Indian winter (December–February). Light woolens, full sleeves, and layering are appropriate. Fabrics like georgette, crepe, and light knits work well.' };
}

// ─── Restrictions ─────────────────────────────────────────────────────────────

const RESTRICTION_RULES: Record<string, string> = {
  no_sleeveless:
    'NO SLEEVELESS — Never include tops, dresses, jumpsuits, or any upper-body piece without sleeves. Every upper-body item must have sleeves (short sleeves are acceptable as a minimum). This applies to every single outfit — no exceptions.',
  cover_tummy:
    'COVER TUMMY — The client prefers to keep her midsection covered and not emphasised. Never include crop tops, short tops, or bodycon / form-fitting silhouettes that cling to the stomach. Always prefer A-line, empire-waist, wrap, or flowy/structured styles that drape away from the midsection. This applies to every single outfit — no exceptions.',
};

// ─── Colour Rules ─────────────────────────────────────────────────────────────

type Undertone = 'warm' | 'cool' | 'neutral';

function extractUndertone(visualProfile: string): Undertone {
  const text = visualProfile.toLowerCase();
  if (/\bcool[\s-]toned\b|\bcool undertone\b|\b\(cool\)\b/.test(text)) return 'cool';
  if (/\bwarm[\s-]toned\b|\bwarm undertone\b|\b\(warm\)\b/.test(text)) return 'warm';
  if (/\bneutral undertone\b|\b\(neutral\)\b/.test(text)) return 'neutral';
  if (/\bcool\b/.test(text)) return 'cool';
  if (/\bwarm\b/.test(text)) return 'warm';
  return 'neutral';
}

// deep-warm and olive both benefit from warm colour pairings
function mapDiagnosisToUndertone(undertone: StyleDiagnosis['chromaticHarmony']['undertone']): Undertone {
  if (undertone === 'cool') return 'cool';
  if (undertone === 'neutral') return 'neutral';
  return 'warm';
}

function buildColourRules(undertone: Undertone | null): string {
  const structure = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOUR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE (applies to every outfit):
- Maximum 3 distinct colours per outfit. 2 is ideal.
- Never combine two bold or printed pieces — one statement item, everything else quiet.
- Tonal dressing (different shades of the same colour family) is strongly preferred over high-contrast mixing.
- Metallics (gold, silver) count as a neutral for evening and formal outfits only.

COLOUR HIERARCHY — every outfit must fill all three roles:
  LEAD — gives the outfit its character. Usually the richer or darker tone. Sits in the structure piece (blazer, top, waistcoat) or the top half.
  SUPPORT — carries the larger or more voluminous piece (wide-leg trousers, midi skirt, dress base). Usually the neutral.
  GROUNDING ACCENT — a tan, cognac, or warm neutral in the accessories (bag, shoes, belt) that stops the outfit feeling unfinished. Shifts to grey or nude for cool-undertone outfits. Must be present in almost every outfit.
  If any of the three roles is unfilled, the outfit will feel incomplete — always check before returning.`;

  if (undertone === 'warm') {
    return `${structure}

UNDERTONE: WARM (golden, peachy, yellow-based skin)
The following combinations make warm-toned skin glow. Build blueprints and match catalog items to these target palettes as closely as possible.

  Approved LEAD + SUPPORT combinations (grounding accent goes in accessories):
  - Burgundy + Toffee             → cognac or camel grounding
  - Khaki + Army Green            → ivory bridge piece if needed
  - Rust + Off-white              → tan or cognac grounding
  - Forest Green + Sand           → warm brown grounding
  - Chocolate + Peach             → warm ivory or cream grounding
  - Moss Green + Cream            → camel or tan grounding
  - Saddle Brown + Wheat          → cognac grounding
  - Olive + Warm Wheat            → tan grounding
  - Deep Red + Burlywood          → warm brown grounding
  - Burgundy + Burnt Sienna       → ivory bridge (both warm-red family)
  - Burnt Orange + Dark Gold      → cream or sand grounding
  - Dark Espresso + Peach         → warm ivory grounding
  - Cognac + Warm Linen           → tan grounding
  - Dark Olive + Caramel          → warm cream grounding

  Anchor neutrals (dominant piece): ivory, cream, camel, warm beige, warm taupe, chocolate brown, off-white, warm stone.
  AVOID: stark white, cool grey, icy silver, cobalt blue, lavender, mint — all fight warm skin.`;
  }

  if (undertone === 'cool') {
    return `${structure}

UNDERTONE: COOL (pink, blue, or red-based skin)
The following combinations work with the cool clarity in the skin.

  Approved LEAD + SUPPORT combinations (grounding accent goes in accessories):
  - Ivory + Navy                  → grey or nude grounding
  - Sage Green + Grey             → cream bridge if needed
  - Burgundy + Black              → grey or silver grounding
  - Stone Blue + Ivory            → slate or grey grounding
  - Denim Blue + Taupe            → ivory bridge
  - Steel Blue + Light Grey       → white or ivory grounding
  - Slate Purple + Ivory          → nude or grey grounding
  - Sea Green + Off-white         → grey or nude grounding
  - Burgundy + Silver Grey        → ivory grounding
  - Midnight Navy + Powder Blue   → white grounding
  - Deep Plum + Lavender          → nude or ivory grounding
  - Charcoal + Dusty Blue         → ivory bridge (two muted cools)
  - Teal + Ivory                  → grey grounding
  - Slate Blue + Pale Grey        → ivory bridge

  Anchor neutrals (dominant piece): pure white, black, cool grey, slate, navy, charcoal, cool stone.
  AVOID: cream, camel, warm beige, rust, terracotta, mustard, saffron — all warm-toned and unflattering on cool skin.`;
  }

  return `${structure}

UNDERTONE: NEUTRAL (balanced undertones — can move between warm and cool palettes)
These combinations sit in the middle ground. Pick one temperature per outfit and stay within it — do not mix warm and cool tones in the same outfit.

  Approved LEAD + SUPPORT combinations (grounding accent goes in accessories):
  - Warm Taupe + Slate Grey       → cognac or nude grounding
  - Dusty Rose + White            → nude or blush grounding
  - Sage + Warm Cream             → tan grounding
  - Muted Plum + Nude             → grey or taupe grounding
  - Charcoal + Warm Ivory         → tan or cognac grounding
  - Olive + Sand Beige            → warm brown grounding

  Anchor neutrals: ivory, cream, white, warm beige, cool grey, navy, camel, slate — all work. Pick a temperature and commit.`;
}

// ─── Pass 0: Style Diagnosis ──────────────────────────────────────────────────

async function diagnoseStyleProfile(
  styleNotes: string | null,
  visualProfile: string | null,
  measurements: { height_cm?: number; weight_kg?: number; bust_cm?: number; waist_cm?: number; hips_cm?: number }
): Promise<StyleDiagnosis | null> {
  if (!styleNotes?.trim() && !visualProfile?.trim()) return null;

  const prompt = `You are a senior fashion analyst at ICONIK Club. Diagnose this client's personal style across exactly three dimensions.

${styleNotes?.trim() ? `CLIENT STYLE NOTES (primary signal for chromatic and disruptor diagnosis):\n"${styleNotes.trim()}"` : ''}
${visualProfile?.trim() ? `\nCLIENT APPEARANCE PROFILE (primary signal for silhouette diagnosis):\n${visualProfile.trim()}` : ''}
${measurements.height_cm ? `\nMEASUREMENTS:\n- Height: ${measurements.height_cm} cm\n- Weight: ${measurements.weight_kg ?? 'unknown'} kg\n- Bust: ${measurements.bust_cm ?? 'unknown'} cm\n- Waist: ${measurements.waist_cm ?? 'unknown'} cm\n- Hips: ${measurements.hips_cm ?? 'unknown'} cm` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 1 — CHROMATIC HARMONY (undertone read)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Map her colour patterns to one undertone profile:

warm        — Consistently reaches for earthy, golden tones: camel, terracotta, rust, olive, warm ivory, peach, chocolate, warm mustard. Avoids icy or blue-cool tones. Gold hardware dominates.
cool        — Consistently reaches for crisp, jewel-toned, or blue-based colours: royal blue, burgundy, navy, cool grey, lavender, emerald, plum, icy pink, rose. Avoids yellow-heavy tones. Silver or mixed-metal hardware.
neutral     — Moves comfortably between warm and cool. Dusty rose, sage green, warm taupe, earthy nudes, soft terracotta, slate blue all appear. Tonal, sophisticated dressing.
deep-warm   — Dark skin with golden or red undertones. Rich saturated tones: cobalt, emerald, fuchsia, royal purple, warm golds, bright white. Pastels and nude tones wash her out.
olive       — Yellow-green undertone, medium-deep skin. Earthy richness: burnt orange, forest green, chocolate brown, warm cream, cognac, rust, burgundy. Avoids yellow-greens.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 2 — SILHOUETTE PROFILE (body shape read)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Map her body and silhouette choices to one profile:

apple              — Empire cuts, A-line, dark unbroken tones at midsection, structure from shoulder. Avoids natural waist cinching. Fluid fabrics at midsection.
pear               — Structure above waist (blazers, statement tops, interesting necklines). Bottoms always wide-leg, A-line, or straight. High-waisted. Pointed-toe shoes elongate.
hourglass          — Wrap styles, belted pieces, follows natural curve. Honours the waist — never hides it. Silk and satin fabrics appear.
rectangle          — Two-tone dressing that breaks at the waist. Peplum hems, high-waisted wide-leg with tucked top, ruffles or volume at bust or hip. Belts as waist-creators.
inverted-triangle  — Volume and weight lives below the waist. Full skirts, wide-leg trousers, flared or tiered hems. Avoids detail and structure at the shoulder. Darker tones on top.
petite             — Monochrome or tonal head-to-toe. High-waisted bottoms always. Cropped blazers, never longline. Pointed-toe shoes always. Avoids heavy layering.
plus               — Wrap dresses, A-line midi skirts, wide-leg trousers with fitted top. Structured blazer as backbone. Fluid fabrics that drape rather than cling. Monochrome or tonal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSION 3 — DISRUPTOR STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identify which disruptor category her style naturally uses:

chromatic   — Her unexpected element is always a colour tension: two colours that shouldn't work but do.
structural  — Her unexpected element is a layer or proportion: a waistcoat instead of a blazer, a longline vest over a dress.
accessory   — Her unexpected element is always in the finishing detail: a bold bag against a quiet outfit, a statement earring.
footwear    — Her unexpected element lives specifically in the shoes: trainers with tailored trousers, unexpected heel height or colour.

Return ONLY a valid JSON object with exactly this structure:
{
  "chromaticHarmony": {
    "undertone": "warm" | "cool" | "neutral" | "deep-warm" | "olive",
    "explanation": "1-2 sentences on which colour patterns led to this read"
  },
  "silhouetteProfile": {
    "bodyShape": "apple" | "pear" | "hourglass" | "rectangle" | "inverted-triangle" | "petite" | "plus",
    "explanation": "1-2 sentences on which silhouette and proportion choices led to this read"
  },
  "disruptorStyle": {
    "type": "chromatic" | "structural" | "accessory" | "footwear",
    "explanation": "1-2 sentences on how she creates intentional tension in her looks"
  },
  "signatureCodes": ["3-5 short strings — recurring rules that define her personal style, e.g. 'Always pointed-toe heels', 'Structured bag in every outfit', 'Never a belt at natural waist', 'Layer in every outfit'"]
}

Return ONLY the JSON. No markdown, no explanation.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });
    const text = response.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) { console.warn('diagnoseStyleProfile: no JSON found'); return null; }
    const diagnosis = JSON.parse(match[0]) as StyleDiagnosis;
    console.log(`Style diagnosis — undertone: ${diagnosis.chromaticHarmony.undertone} | body: ${diagnosis.silhouetteProfile.bodyShape} | disruptor: ${diagnosis.disruptorStyle.type}`);
    return diagnosis;
  } catch (err) {
    console.warn('diagnoseStyleProfile failed, proceeding without diagnosis:', err);
    return null;
  }
}

// ─── Pass 1: Ideal Blueprint Generation ───────────────────────────────────────

const SILHOUETTE_BRIEFS: Record<string, string> = {
  apple:
    'APPLE — Place structure at the shoulder or upper body. Empire cuts, A-line, wrap, or flowy silhouettes. Avoid anything that cinches or emphasises the natural waist. Dark unbroken tones through the midsection.',
  pear:
    'PEAR — Visual interest must live above the waist: structured tops, interesting necklines, blazers. Bottoms are always wide-leg, A-line, or straight-leg — never slim or fitted. High-waisted always. Pointed-toe shoes to elongate.',
  hourglass:
    'HOURGLASS — Honour the waist. Wrap styles, belted pieces, fitted or semi-fitted silhouettes. Never hide the waist under volume. Silk and satin appear frequently.',
  rectangle:
    'RECTANGLE — Create the illusion of a waist. Two-tone dressing that breaks at the waist. Peplum hems, high-waisted wide-leg with tucked top, belts as waist-creators. Volume at bust or hip.',
  'inverted-triangle':
    'INVERTED TRIANGLE — All volume lives below the waist. Full skirts, wide-leg trousers, flared or tiered hems. Avoid structure or detail at the shoulder. Darker, quieter tones on top.',
  petite:
    'PETITE — Monochrome or tonal head-to-toe to create vertical length. High-waisted bottoms always. Cropped blazers only — no longline. Pointed-toe shoes always. No heavy layering.',
  plus:
    'PLUS — Wrap dresses, A-line midi skirts, wide-leg trousers with fitted tops. Structured blazer as backbone. Fluid fabrics that drape rather than cling. Monochrome or tonal dressing for a clean, elongated read.',
};

async function generateIdealBlueprints(
  diagnosis: StyleDiagnosis | null,
  colourRules: string,
  activeRestrictions: string[],
  season: { season: string; description: string },
  budgetLevel: string | null,
  styleNotes: string | null
): Promise<OutfitBlueprint[]> {
  const restrictionsBlock = activeRestrictions.length > 0
    ? `⛔ ABSOLUTE RESTRICTIONS — apply to every single blueprint, no exceptions:\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n\n`
    : '';

  const BUDGET_FABRIC: Record<string, string> = {
    high: 'Premium fabrics freely: silk, cashmere, fine wool-blend, high-grade georgette, luxury crepe.',
    mid:  'Quality but accessible: crepe, ponte, good cotton, georgette, linen-blend. Avoid purely luxury-only materials.',
    low:  'Accessible fabrics: cotton, linen, cotton-blend, jersey, polyester-blend. Avoid silk or cashmere.',
  };
  const budgetNote = budgetLevel ? `Budget — fabric guidance: ${BUDGET_FABRIC[budgetLevel] ?? ''}\n\n` : '';

  const diagnosisBlock = diagnosis
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT STYLE DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHROMATIC HARMONY: ${diagnosis.chromaticHarmony.undertone.toUpperCase()} UNDERTONE
${diagnosis.chromaticHarmony.explanation}

SILHOUETTE PROFILE: ${diagnosis.silhouetteProfile.bodyShape.toUpperCase()}
${diagnosis.silhouetteProfile.explanation}

DISRUPTOR STYLE: ${diagnosis.disruptorStyle.type.toUpperCase()} DISRUPTOR
${diagnosis.disruptorStyle.explanation}

SIGNATURE CODES (honour in every outfit):
${diagnosis.signatureCodes.map(c => `- ${c}`).join('\n')}

`
    : styleNotes?.trim()
      ? `CLIENT STYLE NOTES:\n"${styleNotes.trim()}"\n\n`
      : '';

  const silhouetteBlock = diagnosis?.silhouetteProfile.bodyShape
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SILHOUETTE RULES FOR THIS CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${SILHOUETTE_BRIEFS[diagnosis.silhouetteProfile.bodyShape] ?? ''}

`
    : '';

  const prompt = `You are a senior fashion stylist at ICONIK Club. Design 6 ideal outfit blueprints for this client — one per occasion. Design freely, as if shopping at any store. Do NOT constrain yourself to any existing catalog.

${restrictionsBlock}${diagnosisBlock}${silhouetteBlock}${colourRules}

Current season: ${season.season}
${season.description}

${budgetNote}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUR MANDATORY PRINCIPLES (every blueprint must satisfy all four)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SILHOUETTE BALANCE
   Create visual balance using the body shape logic above. Where the eye travels and what it skips must be intentional.

2. COLOUR CLARITY
   One colour leads. One colour supports. One colour grounds. There is a clear hierarchy. Maximum 3 colours per outfit. Tonal dressing is preferred — do not mix warm and cool tones in the same look.

3. ONE STRUCTURE PIECE
   Every outfit has exactly one piece that gives it shape and intention: a blazer, belt, waistcoat, structured bag, tucked hem, or wrap tie. Without it, the outfit reads as an afterthought.

4. FABRIC SPEAKS THE OCCASION
   Name the fabric for every garment. Use this as a guide:
   - casual/weekend: linen, cotton, soft jersey, denim
   - work: crepe, ponte, cotton-blend, tailored fabric, structured twill
   - evening: satin, silk, lightweight georgette, velvet
   - formal: chiffon, embroidered fabric, silk-blend, heavy satin
   - party: metallic, sequin, rich velvet, bold texture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISRUPTOR RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every outfit must include one disruptor element that matches the client's diagnosed disruptor style. It must feel intentional, not accidental. For clients with refined taste, keep it subtle — a colour tension or a footwear break, not a maximalist statement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARDROBE COHERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All 6 blueprints must feel like a coherent wardrobe — not 6 disconnected looks. They must share:
- A consistent colour story (same palette temperature throughout)
- A recurring accessory language (e.g. always pointed-toe shoes, always a structured bag)
- A consistent silhouette logic (proportions stay true to the client's body shape across all occasions)
Do not introduce colours, silhouettes, or styling codes she has not signalled she likes. Build within her taste.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Hemlines at or below the knee for all skirts and dresses
- Moderately conservative: no bare shoulders, no backless, no sheer without underlayer
- If using a dress or jumpsuit as the base, set top and bottom to null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCCASIONS (exactly one blueprint per occasion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
casual   — Relaxed but put-together daywear
work     — Polished and professional for an Indian metro office
evening  — Elevated and refined for dinner out or a cocktail event
weekend  — Stylish but laid-back for brunch or errands
formal   — Occasion-ready for a wedding guest, gala, or formal Indian event
party    — Fun and confident for a night out or celebration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create exactly 6 ideal outfit blueprints. Each occasion must appear exactly once.

For every garment description, include: specific colour name, fabric, silhouette/cut, and any defining detail.
Good example: "High-waist wide-leg trousers, warm camel, ponte fabric, clean unpleated front, floor-grazing length"
Bad example: "Trousers"

Return ONLY a valid JSON array of exactly 6 objects:
[
  {
    "occasion": "casual",
    "title": "3-5 word evocative title",
    "singlePiece": "Full description of dress or jumpsuit OR null if using top+bottom",
    "top": "Full description OR null if using singlePiece",
    "layer": "Full description of optional layer OR null",
    "bottom": "Full description OR null if using singlePiece",
    "shoes": "Full description — always required",
    "bag": "Full description OR null",
    "accessory": "Full description OR null",
    "disruptor": "Name the disruptor element and one sentence explaining why it works",
    "colourHierarchy": "LEAD = [colour — piece]. SUPPORT = [colour — piece]. GROUNDING ACCENT = [colour — piece in accessories]",
    "structurePiece": "Name the structure piece and briefly how it creates shape"
  }
]

Return ONLY the JSON array. No markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = response.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in blueprint response: ${text.slice(0, 300)}`);
  const blueprints = JSON.parse(match[0]) as OutfitBlueprint[];
  if (!Array.isArray(blueprints) || blueprints.length === 0) throw new Error('Invalid blueprints from Gemini');
  console.log(`Generated ${blueprints.length} ideal blueprints — occasions: ${blueprints.map(b => b.occasion).join(', ')}`);
  return blueprints;
}

// ─── Pass 2: Catalog Matching ──────────────────────────────────────────────────

async function matchBlueprintsToItems(
  blueprints: OutfitBlueprint[],
  items: FashionItem[],
  activeRestrictions: string[]
): Promise<OutfitRecommendation[]> {
  const catalog = items.map(item => {
    const entry: Record<string, unknown> = {
      id: item.id,
      name: item.item_name,
      category: item.category,
    };
    if (item.color?.length) entry.color = item.color;
    if (item.material?.length) entry.material = item.material;
    if (item.price != null) entry.price = item.price;
    // Prefer structured tags for matching; fall back to prose description
    if (item.style_tags) entry.tags = item.style_tags;
    if (item.style_description) entry.description = item.style_description;
    return entry;
  });

  const restrictionReminder = activeRestrictions.length > 0
    ? `⛔ RESTRICTIONS — enforce when matching (reject any catalog item that violates these):\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n\n`
    : '';

  const blueprintText = blueprints.map((bp, i) => {
    const slots = [
      bp.singlePiece ? `  singlePiece (dress/jumpsuit): "${bp.singlePiece}"` : null,
      bp.top ? `  top: "${bp.top}"` : null,
      bp.layer ? `  layer (optional): "${bp.layer}"` : null,
      bp.bottom ? `  bottom: "${bp.bottom}"` : null,
      `  shoes (required): "${bp.shoes}"`,
      bp.bag ? `  bag (optional): "${bp.bag}"` : null,
      bp.accessory ? `  accessory (optional): "${bp.accessory}"` : null,
    ].filter(Boolean).join('\n');
    return `BLUEPRINT ${i + 1} — ${bp.title} [${bp.occasion}]\n${slots}\nColour hierarchy: ${bp.colourHierarchy}\nDisruptor: ${bp.disruptor}\nStructure piece: ${bp.structurePiece}`;
  }).join('\n\n');

  const prompt = `You are a fashion buyer for ICONIK Club. You have 6 ideal outfit blueprints and a catalog of available inventory. Your job is to shop the catalog — find the closest match for each blueprint slot.

${restrictionReminder}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDEAL BLUEPRINTS (what we are shopping for)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${blueprintText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(catalog)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATCHING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Each catalog item may include a "tags" object with structured fields (silhouette_type, fit_category, sleeve_type, coverage, occasion_tags, undertone_compatibility, etc.) AND/OR a prose "description". When "tags" is present, use it as the primary matching signal — it is rule-based and precise. Use "description" for additional nuance only.
2. Match priority: (a) silhouette_type + fit_category from tags, (b) coverage constraints from tags (e.g. arms_covered must satisfy restriction), (c) occasion_tags overlap with blueprint occasion, (d) undertone_compatibility overlap with client undertone, (e) colour proximity, (f) fabric_weight. Category label is a guide — a blouse can serve as "top", a tailored jacket as "layer", etc.
3. Colour proximity: "warm camel wide-leg" can be matched by "cream wide-leg trousers" if nothing closer exists. Silhouette match takes priority over exact colour match.
3. For a singlePiece slot: only match a dress or jumpsuit from the catalog.
4. For a top+bottom outfit: exactly one top-category item and exactly one bottom/skirt item.
5. For shoes: always include exactly one shoe item if available in the catalog.
6. For layer, bag, accessory slots: only include if a genuinely good match exists — it is better to have fewer items than a wrong one. Do not force.
7. The same item ID must NOT appear in more than 2 outfits across all 6.
8. Only use item IDs that exist in the catalog above. Do not invent IDs.
9. Every outfit must have at least 2 items (a base + shoes minimum).

Return ONLY a valid JSON array of exactly 6 objects:
[
  {
    "occasion": "casual",
    "styleNote": "3-5 word title (use the blueprint title)",
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
  if (!match) throw new Error(`No JSON array in matching response: ${text.slice(0, 300)}`);
  const recs = JSON.parse(match[0]) as OutfitRecommendation[];
  if (!Array.isArray(recs)) throw new Error('Gemini matching did not return an array');
  console.log(`Catalog matching complete — ${recs.length} outfits matched`);
  return recs;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function generateOutfitRecommendations(
  profile: {
    height_cm?: number;
    weight_kg?: number;
    bust_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    style_restrictions?: string[] | null;
    style_notes?: string | null;
    visual_profile?: string | null;
    budget_level?: 'high' | 'mid' | 'low' | null;
  },
  items: FashionItem[]
): Promise<OutfitRecommendation[]> {
  const season = getIndianSeason(new Date());
  const activeRestrictions = (profile.style_restrictions ?? []).filter(r => RESTRICTION_RULES[r]);

  // ── Pass 0: Diagnose style profile ────────────────────────────────────────
  const diagnosis = await diagnoseStyleProfile(
    profile.style_notes ?? null,
    profile.visual_profile ?? null,
    {
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      bust_cm: profile.bust_cm,
      waist_cm: profile.waist_cm,
      hips_cm: profile.hips_cm,
    }
  );

  // Derive undertone: from diagnosis if available, else parse visual profile text
  let undertone: Undertone | null = null;
  if (diagnosis) {
    undertone = mapDiagnosisToUndertone(diagnosis.chromaticHarmony.undertone);
  } else if (profile.visual_profile?.trim()) {
    undertone = extractUndertone(profile.visual_profile);
  }
  const colourRules = buildColourRules(undertone);

  // ── Pass 1: Generate ideal outfit blueprints ──────────────────────────────
  const blueprints = await generateIdealBlueprints(
    diagnosis,
    colourRules,
    activeRestrictions,
    season,
    profile.budget_level ?? null,
    profile.style_notes ?? null
  );

  // ── Pass 2: Match blueprints to catalog items ─────────────────────────────
  const recs = await matchBlueprintsToItems(blueprints, items, activeRestrictions);

  // ── Validation: structural guards ─────────────────────────────────────────
  const validIds = new Set(items.map(i => i.id));
  const itemById = new Map(items.map(i => [i.id, i]));
  const SINGLE_PIECE_CATS = new Set(['dress', 'jumpsuit']);
  const BOTTOM_CATS = new Set(['bottom', 'skirt']);

  const validated = recs.slice(0, 6).map(rec => {
    let ids: string[] = (rec.itemIds ?? []).filter(id => validIds.has(id));

    // Drop separate bottoms if a single-piece (dress/jumpsuit) is in the outfit
    const hasSinglePiece = ids.some(id => SINGLE_PIECE_CATS.has(itemById.get(id)?.category ?? ''));
    if (hasSinglePiece) {
      ids = ids.filter(id => !BOTTOM_CATS.has(itemById.get(id)?.category ?? ''));
    } else {
      // Keep only the first bottom/skirt, remove duplicates
      let bottomSeen = false;
      ids = ids.filter(id => {
        if (BOTTOM_CATS.has(itemById.get(id)?.category ?? '')) {
          if (bottomSeen) return false;
          bottomSeen = true;
        }
        return true;
      });
    }

    return { ...rec, itemIds: ids };
  });

  // Inject a shoe if the AI forgot to include one
  const shoeItems = items.filter(i => i.category === 'shoes');
  if (shoeItems.length > 0) {
    for (const rec of validated) {
      const hasShoes = rec.itemIds.some(id => itemById.get(id)?.category === 'shoes');
      if (!hasShoes) {
        rec.itemIds.push(shoeItems[Math.floor(Math.random() * shoeItems.length)].id!);
      }
    }
  }

  // Attach the blueprint to each rec so callers can persist/display what Gemini ideally designed
  const blueprintByOccasion = new Map(blueprints.map(b => [b.occasion, b]));
  for (const rec of validated) {
    rec.blueprint = blueprintByOccasion.get(rec.occasion);
  }

  return validated;
}
