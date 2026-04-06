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
}

interface StyleDNA {
  aesthetic: string;         // The overarching style identity in 3–5 words
  silhouette: string;        // Shapes, fits, proportions she gravitates toward
  colourStory: string;       // Her palette logic — neutrals, accents, how she uses colour
  fabricTexture: string;     // Materials and textures implied by her references
  stylingSignals: string;    // How she layers, accessorises, what her hero pieces tend to be
  avoid: string;             // The inverse — what her taste clearly rejects
  occasionTranslation: string; // How this DNA maps across the 6 occasions in her wardrobe
}

/**
 * Pass 1 — Analyse the client's raw style notes to extract the underlying style DNA.
 * Rather than treating notes as literal instructions, this call asks Gemini to act as
 * a style analyst: understand WHY she likes the outfits she mentions, what the common
 * thread is, and articulate principles that can be applied across new outfit builds.
 *
 * Returns null if notes are empty or the call fails — the outfit generator falls back
 * to using the raw notes directly in that case.
 */
async function analyzeStyleDNA(styleNotes: string): Promise<StyleDNA | null> {
  if (!styleNotes.trim()) return null;

  const prompt = `You are a senior fashion analyst. A styling client has provided notes about her taste — she may have described outfits she loves, brands she wears, aesthetics she gravitates toward, or outfit examples she wants replicated.

Your job is NOT to take these notes literally. Your job is to read between the lines: understand what these references have in common, why she is drawn to them, and extract the underlying style principles that make them work for her.

Client's style notes:
"${styleNotes.trim()}"

Analyse these notes and return a JSON object with exactly these keys:

{
  "aesthetic": "3–5 word label for her overall style identity — e.g. 'Clean Minimal Parisian', 'Relaxed Luxe Bohemian', 'Sharp Contemporary Indian', 'Soft Romantic Feminine'",
  "silhouette": "The shapes and proportions she consistently gravitates toward. Be specific: does she prefer fluid and relaxed, or structured and tailored? Wide-leg, slim, or flared? Midi length or short? Oversized on top with fitted below, or the reverse? What silhouette signals appear across her references?",
  "colourStory": "Her colour logic. What is her neutral base? Does she use colour at all or stay tonal? When she uses an accent, what kind — muted/earthy/saturated/bold? Does she mix or keep it clean? Name specific shades that capture her palette if you can infer them.",
  "fabricTexture": "The materials and textures her preferred outfits imply — even if she didn't name them. Linen and cotton for ease? Silk and satin for polish? Structured crepe? Flowy georgette? Textured knits? What fabric story runs through her taste?",
  "stylingSignals": "How she assembles an outfit. Does she tuck in tops or leave them out? Does she layer? Does she accessorise heavily or barely? What are her hero pieces — tops, bottoms, dresses? Does she belt things? What finishing moves appear repeatedly?",
  "avoid": "What her taste clearly rejects — even if she didn't say it explicitly. If she loves minimal, she avoids maximalist. If she loves fluid drape, she likely avoids stiff structured boxy shapes. Infer what would feel wrong for her.",
  "occasionTranslation": "A concise brief on how this style DNA should translate across her 6 wardrobe occasions: casual, work, evening, weekend, formal, party. For each, name the one key ingredient that keeps it true to her aesthetic. Keep it compact — one sentence per occasion."
}

Return ONLY the JSON object. No markdown, no explanation.`;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });

    const text = response.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn('analyzeStyleDNA: no JSON object found in response');
      return null;
    }
    const dna = JSON.parse(match[0]) as StyleDNA;
    console.log(`Style DNA analyzed — aesthetic: ${dna.aesthetic}`);
    return dna;
  } catch (err) {
    console.warn('analyzeStyleDNA failed, will use raw notes:', err);
    return null;
  }
}

// Returns the current Indian climate season based on month.
function getIndianSeason(date: Date): { season: string; description: string } {
  const month = date.getMonth() + 1; // 1–12
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

// Human-readable descriptions for each restriction key.
const RESTRICTION_RULES: Record<string, string> = {
  no_sleeveless:
    'NO SLEEVELESS — Never include tops, dresses, jumpsuits, or any upper-body piece without sleeves. Every upper-body item must have sleeves (short sleeves are acceptable as a minimum). This applies to every single outfit — no exceptions.',
  cover_tummy:
    'COVER TUMMY — The client prefers to keep her midsection covered and not emphasised. Never include crop tops, short tops, or bodycon / form-fitting silhouettes that cling to the stomach. Always prefer A-line, empire-waist, wrap, or flowy/structured styles that drape away from the midsection. This applies to every single outfit — no exceptions.',
};

type Undertone = 'warm' | 'cool' | 'neutral';

// Extract the skin undertone from the visual profile paragraph.
// The generateVisualProfile prompt explicitly asks for "(warm / cool / neutral)"
// so these keywords reliably appear in the skin tone sentence.
function extractUndertone(visualProfile: string): Undertone {
  const text = visualProfile.toLowerCase();
  // Look for explicit undertone markers first, then broader warm/cool signals
  if (/\bcool[\s-]toned\b|\bcool undertone\b|\b\(cool\)\b/.test(text)) return 'cool';
  if (/\bwarm[\s-]toned\b|\bwarm undertone\b|\b\(warm\)\b/.test(text)) return 'warm';
  if (/\bneutral undertone\b|\b\(neutral\)\b/.test(text)) return 'neutral';
  // Fallback: single keyword presence in skin description
  if (/\bcool\b/.test(text)) return 'cool';
  if (/\bwarm\b/.test(text)) return 'warm';
  return 'neutral';
}

// Returns the COLOUR RULES section tailored to the client's undertone.
// When no visual profile is available, falls back to generic guidance.
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
The following combinations make warm-toned skin glow. Match catalog items to these target palettes as closely as possible — use the colour field on each item to guide selection.

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
The following combinations work with the cool clarity in the skin. Match catalog items to these target palettes as closely as possible.

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

  // Neutral undertone or unknown
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
  const itemList = items.map(item => {
    const entry: Record<string, unknown> = {
      id: item.id,
      name: item.item_name,
      category: item.category,
    };
    if (item.color?.length) entry.color = item.color;
    if (item.brand) entry.brand = item.brand;
    if (item.price != null) entry.price = item.price;
    if (item.material?.length) entry.material = item.material;
    if (item.style_description) entry.description = item.style_description;
    return entry;
  });

  const { season, description: seasonDescription } = getIndianSeason(new Date());

  const activeRestrictions = (profile.style_restrictions ?? []).filter(r => RESTRICTION_RULES[r]);

  // Restrictions block — placed at the very top of the prompt so the model sees them first
  // and they are not displaced by later context.
  const restrictionsBlock = activeRestrictions.length > 0
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ ABSOLUTE RESTRICTIONS — APPLY TO EVERY OUTFIT, NO EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These rules override every other styling decision. Violating any restriction is not acceptable under any circumstance:
${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}

`
    : '';

  // Pass 1 — analyse style notes into structured DNA (runs in parallel with nothing else yet)
  const styleDNA = profile.style_notes?.trim()
    ? await analyzeStyleDNA(profile.style_notes.trim())
    : null;

  // Style DNA block — uses the analysed DNA when available, falls back to raw notes
  const styleNotesBlock = profile.style_notes?.trim()
    ? styleDNA
      ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT STYLE DNA (analysed from her references — this is who she is as a dresser)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AESTHETIC IDENTITY: ${styleDNA.aesthetic}

SILHOUETTE LANGUAGE: ${styleDNA.silhouette}

COLOUR STORY: ${styleDNA.colourStory}

FABRIC & TEXTURE: ${styleDNA.fabricTexture}

HOW SHE STYLES: ${styleDNA.stylingSignals}

WHAT TO AVOID: ${styleDNA.avoid}

HOW THIS TRANSLATES ACROSS OCCASIONS:
${styleDNA.occasionTranslation}

Original client notes (for reference):
"${profile.style_notes.trim()}"

CRITICAL INSTRUCTION: Every outfit must feel like it belongs to THIS client's aesthetic identity — not a generic version of the occasion. Use the DNA above as the creative brief. The occasion brief below defines the context; the DNA defines the character.
If the notes reference specific outfits or looks, study why she likes them — the silhouette logic, the colour balance, the proportion play — and reproduce that reasoning with the available catalog items, not just the surface details.
Per-occasion direction in the DNA takes absolute priority over the default occasion briefs.

`
      : `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT STYLE NOTES (primary signal — read carefully)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The client's own words:
"${profile.style_notes.trim()}"

How to apply these notes:
1. Extract the client's overall aesthetic and apply it as the baseline across all 6 outfits.
2. If the notes mention specific outfits or looks, understand WHY she likes them — the silhouette, the colour balance, the proportion — and reproduce that logic with the available catalog items.
3. If the notes mention a specific occasion by name, that preference OVERRIDES the default occasion brief below.
4. Per-occasion instructions take absolute priority over the OCCASION BRIEFS section.

`
    : '';

  // Visual profile block — AI-generated appearance description from client photos
  const visualProfileBlock = profile.visual_profile?.trim()
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT APPEARANCE PROFILE (generated from client photos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profile.visual_profile.trim()}

Use this to:
- Recommend colours that flatter this specific skin tone and undertone
- Select silhouettes and proportions suited to this body shape and build
- Ensure fit language matches the client's frame (e.g. avoid overwhelming a petite frame with oversized volumes)

`
    : '';

  // Derive undertone from visual profile and build dynamic colour rules
  const undertone: Undertone | null = profile.visual_profile?.trim()
    ? extractUndertone(profile.visual_profile)
    : null;
  const colourRules = buildColourRules(undertone);

  // Budget block — controls which price tier of items to prioritise
  const BUDGET_GUIDANCE: Record<string, string> = {
    high: 'BUDGET: High — No price constraint. Select the best item for each slot in the outfit regardless of cost. Prioritise quality, craftsmanship, and luxury. Price is not a filtering criterion.',
    mid:  'BUDGET: Mid — The client is value-conscious but willing to invest in key pieces. Prefer mid-range items. Avoid the most expensive option in the catalog unless it is clearly the best fit with no suitable alternative. Strike a balance between quality and cost.',
    low:  'BUDGET: Low — Budget-conscious. Always prefer the most affordable item that still works well for the outfit. When two items are equally suitable, choose the lower-priced one. Avoid premium-priced items unless no other option fits the occasion or outfit structure.',
  };
  const budgetBlock = profile.budget_level && BUDGET_GUIDANCE[profile.budget_level]
    ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUDGET LEVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${BUDGET_GUIDANCE[profile.budget_level]}
The catalog includes a price field for each item — use it to make budget-aligned decisions across all 6 outfits.

`
    : '';

  // Restriction reminder used in the final verification step
  const restrictionReminder = activeRestrictions.length > 0
    ? `\n⛔ RE-CHECK RESTRICTIONS on every outfit before returning:\n${activeRestrictions.map(r => `   - ${RESTRICTION_RULES[r]}`).join('\n')}\n`
    : '';

  const prompt = `You are a senior fashion stylist for Iconik Club, an Indian luxury womenswear brand. Your aesthetic is modern trendy but minimal. Every outfit you build must feel intentional and wearable, not a random assortment of pieces.

${restrictionsBlock}${styleNotesBlock}${visualProfileBlock}${budgetBlock}Client measurements:
- Height: ${profile.height_cm ?? 'unknown'} cm
- Weight: ${profile.weight_kg ?? 'unknown'} kg
- Bust: ${profile.bust_cm ?? 'unknown'} cm
- Waist: ${profile.waist_cm ?? 'unknown'} cm
- Hips: ${profile.hips_cm ?? 'unknown'} cm

Current season: ${season}
${seasonDescription}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTFIT STRUCTURE RULES (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every outfit is built from these slots:

BASE (required — exactly one of these combinations):
  Option A — Single piece: one dress or jumpsuit worn alone as the full base
  Option B — Two-piece base: one top + one bottom (skirt or trousers). NEVER two bottoms together.
  A single piece and a separate bottom must NEVER be combined.

LAYER (optional — maximum one):
  Any item from the catalog can serve as a layer, regardless of its category label. Category is just a filing system — it does not define whether a piece can be worn over something else. Use your judgment as a stylist:
  - A blazer layered over a slip dress
  - A shirt worn open over a fitted top
  - A structured vest over a knit
  - A longline coat over wide-leg trousers
  - A printed scarf tied as a top layer
  - A denim jacket over a flowy skirt
  If an item in the catalog could realistically be worn over the base outfit and adds to the look, it is a valid layer. Do not restrict layering to items tagged "outerwear".

SHOES (required — exactly one pair): Always include footwear.

BAG (optional — maximum one): Include only if it genuinely completes the look.

ACCESSORY (optional — maximum one): Include only if it adds the character the outfit needs.

Total items per outfit: 2–6. The layer, bag, and accessory slots are optional additions — use them when they improve the outfit, not as obligation.

${colourRules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITEM REUSE LIMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The same item ID must NOT appear in more than 2 outfits across the full set of 6.
- Prioritise variety — spread items across outfits so the wardrobe feels diverse, not repetitive.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCCASION BRIEFS (defaults — overridden by client style notes above if applicable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
casual   — Relaxed but put-together. Think effortless daywear: a clean top with well-fitted trousers or a simple midi dress. Comfortable fabrics (cotton, linen, jersey). No eveningwear fabrics.
work     — Polished and professional for an Indian metro office. Structured silhouettes: tailored trousers, blazers, midi skirts, shirts. Smart fabrics (crepe, cotton-blend). Nothing bodycon, nothing sheer.
evening  — Elevated and refined for a dinner out or cocktail event. Silk, georgette, or satin pieces. One statement element (a draped top, a midi skirt in a rich tone). Understated glamour — not party-loud.
weekend  — Stylish but laid-back. Relaxed-fit pieces the client would genuinely wear to brunch or shopping: wide-leg trousers, a breezy top, loafers or clean sneakers. Comfortable yet visually coherent.
formal   — Occasion-ready for a wedding guest, gala, or formal Indian event. Full-length or midi silhouettes in luxurious fabrics (chiffon, satin, embroidered). Coordinated and complete-looking.
party    — Fun and confident for a night out or celebration. Bolder colour or texture than evening — a metallic, a rich jewel tone, or a statement silhouette. Still minimal in layering; avoid over-accessorising.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLING PRINCIPLES — apply all six to every outfit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These are what separate a styled outfit from a dressed one. Each principle is mandatory — not optional flourish.

FOUNDATION (always apply)
- Modern and minimal: if an item does not add to the outfit, leave it out.
- One focal "hero" piece per outfit — everything else supports it quietly.
- Fit and proportion: pair oversized/relaxed tops with fitted bottoms, or fitted tops with wider-leg bottoms — never loose + loose.

1. PRINT AGAINST PLAIN
   If the hero piece is solid, at least one supporting piece must introduce pattern or texture. A stripe shirt against a white skirt. A floral blouse against camel trousers. An abstract print scarf against a plain blazer. Two flat solids together with no texture break makes an outfit die — never allow this combination.

2. BELT AS ARCHITECTURE
   Belting is silhouette engineering, not decoration. A belt signals that the waist was considered — not that pieces were just thrown together. Apply it across all occasion types where a belt exists in the catalog: belted over a blazer, wide belt over a tucked knit, chain belt over a flowy skirt. When in doubt, belt it.

3. LAYERING WITH OPINION
   When adding an outer layer, it must have its own strong silhouette — not just a cardigan. A biker jacket, oversized blazer, structured vest, or longline coat. The layer should feel like it has a point of view and could stand alone. This principle applies to office, casual, and occasion wear equally — not just casual looks.

4. CONSIDERED COLOUR LOGIC
   The accent or disruptor colour must feel chosen, not defaulted to. Always pick the more considered version: powder blue over navy, burgundy over maroon, rust over orange, olive over standard green. For this client's Indian skin tone specifically, jewel tones (emerald, sapphire, deep burgundy, amber) and earthy saturated shades (terracotta, rust, deep olive, saffron) will always outperform safe muted ones — prioritise these whenever the catalog allows.

5. THE CHARACTER ACCESSORY
   Every outfit should include one accessory that gives the look personality — not just completion. A printed neck scarf. A wide statement belt. A woven or textured bag. A chunky chain. Stacked rings. This is the difference between "dressed" and "styled." When the catalog contains such a piece and the occasion allows it, always include it.

6. UNEXPECTED FOOTWEAR
   The shoe should create a small, deliberate surprise that signals the aesthetic. Woven mary janes with a formal skirt. Ankle boots with a flowy hem. Chunky loafers with something delicate and feminine. Never default to the obvious safe shoe — choose the one that makes the outfit feel considered and complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(itemList)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create EXACTLY 6 outfits — one per occasion (casual, work, evening, weekend, formal, party). Each occasion must appear exactly once. Only use item IDs that exist in the catalog above.

Before returning, verify every outfit against ALL of the following:
- Each outfit has a valid base (single-piece OR top + one bottom — never two bottoms, never single-piece + separate bottom)
- Each outfit includes footwear
- No item ID appears in more than 2 outfits
- Any layering piece is something that could realistically be worn over the base — category label is irrelevant, wearability is the test
- Client style notes and DNA have been applied — especially any per-occasion preferences${restrictionReminder}
Return ONLY a valid JSON array with exactly 6 objects. Each object must have:
- itemIds: array of item ID strings from the catalog
- occasion: exactly one of "casual", "work", "evening", "weekend", "formal", "party"
- styleNote: 3–5 word editorial headline for the outfit (e.g. "Effortless Weekend Ease", "Sharp Boardroom Power", "Evening Drama in Ivory") — no full sentences, no punctuation at the end

Return ONLY the JSON array, no markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = response.text ?? '';

  // Extract the JSON array robustly — works regardless of markdown fences or extra text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error(`No JSON array found in Gemini response: ${text.slice(0, 300)}`);
  }

  let recs: OutfitRecommendation[];
  try {
    recs = JSON.parse(arrayMatch[0]);
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${arrayMatch[0].slice(0, 300)}`);
  }

  if (!Array.isArray(recs)) throw new Error('Gemini did not return an array');

  // Validate item IDs exist in our catalog
  const validIds = new Set(items.map(i => i.id));
  const itemById = new Map(items.map(i => [i.id, i]));

  // Single-piece categories — a dress/jumpsuit is its own bottom layer
  const SINGLE_PIECE_CATS = new Set(['dress', 'jumpsuit']);
  // Separate bottom categories — only one allowed per outfit
  const BOTTOM_CATS = new Set(['bottom', 'skirt']);

  const validated = recs.slice(0, 6).map(rec => {
    let ids: string[] = (rec.itemIds ?? []).filter(id => validIds.has(id));

    // Guard: remove duplicate bottoms — keep only the first bottom/skirt found,
    // and drop any separate bottom if a single-piece (dress/jumpsuit) is present.
    const hasSinglePiece = ids.some(id => SINGLE_PIECE_CATS.has(itemById.get(id)?.category ?? ''));
    if (hasSinglePiece) {
      // Drop all separate bottoms — dress/jumpsuit is the bottom layer
      ids = ids.filter(id => !BOTTOM_CATS.has(itemById.get(id)?.category ?? ''));
    } else {
      // Keep only the first bottom/skirt, remove subsequent ones
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

  // Ensure every outfit has footwear — inject a shoe if the AI forgot
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
