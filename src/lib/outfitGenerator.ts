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
    'NO SLEEVELESS — Never include tops, dresses, jumpsuits, or any upper-body piece without sleeves. Every upper-body item must have sleeves (short sleeves are acceptable as a minimum).',
  cover_tummy:
    'COVER TUMMY — The client prefers to keep her midsection covered and not emphasised. Never include crop tops, short tops, or bodycon / form-fitting silhouettes that cling to the stomach. Always prefer A-line, empire-waist, wrap, or flowy/structured styles that drape away from the midsection.',
};

export async function generateOutfitRecommendations(
  profile: {
    height_cm?: number;
    weight_kg?: number;
    bust_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    style_restrictions?: string[] | null;
    style_notes?: string | null;
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
    return entry;
  });

  const { season, description: seasonDescription } = getIndianSeason(new Date());

  // Build the restrictions block — only include active restrictions.
  const activeRestrictions = (profile.style_restrictions ?? []).filter(r => RESTRICTION_RULES[r]);
  const restrictionsBlock = activeRestrictions.length > 0
    ? `\nStyle restrictions — STRICTLY enforce every rule below. Violating any restriction is not allowed:\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n`
    : '';

  const styleNotesBlock = profile.style_notes?.trim()
    ? `\nClient style preferences (her own words — treat this as the single strongest signal for the overall aesthetic, colour palette, and brands to prioritise):\n"${profile.style_notes.trim()}"\n`
    : '';

  const prompt = `You are a senior fashion stylist for Iconik Club, an Indian luxury womenswear brand. Your aesthetic is modern trendy but minimal . Every outfit you build must feel intentional and wearable, not a random assortment of pieces.

Client measurements:
- Height: ${profile.height_cm ?? 'unknown'} cm
- Weight: ${profile.weight_kg ?? 'unknown'} kg
- Bust: ${profile.bust_cm ?? 'unknown'} cm
- Waist: ${profile.waist_cm ?? 'unknown'} cm
- Hips: ${profile.hips_cm ?? 'unknown'} cm

Current season: ${season}
${seasonDescription}
${styleNotesBlock}${restrictionsBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTFIT STRUCTURE RULES (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every outfit MUST have:
1. Exactly ONE bottom layer — either: a single-piece (dress, jumpsuit) OR a top + one bottom (skirt, bottom). NEVER combine two bottoms (e.g. no skirt + bottom, no two trousers). NEVER use a dress/jumpsuit alongside a separate bottom.
2. Exactly ONE pair of shoes — always include footwear, never omit it.
3. Maximum ONE bag — optional, not required.
4. Maximum ONE accessory — optional, not required.
5. Total items per outfit: 2–4 items (shoes always count, bag/accessory are extras).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOUR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 3 distinct colours per outfit — fewer is better (2 is ideal for a minimal look).
- Build each outfit around one neutral anchor (white, ivory, black, beige, camel, grey, navy) plus at most one accent colour.
- Tonal dressing (different shades of the same colour) is strongly preferred over clashing contrasts.
- Avoid combining more than one bold/printed piece in the same outfit — let one statement piece lead, keep everything else simple.
- Metallics (gold, silver) count as a neutral for evening/formal outfits only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITEM REUSE LIMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The same item ID must NOT appear in more than 2 outfits across the full set of 6.
- Prioritise variety — spread items across outfits so the wardrobe feels diverse, not repetitive.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCCASION BRIEFS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
casual   — Relaxed but put-together. Think effortless daywear: a clean top with well-fitted trousers or a simple midi dress. Comfortable fabrics (cotton, linen, jersey). No eveningwear fabrics.
work     — Polished and professional for an Indian metro office. Structured silhouettes: tailored trousers, blazers, midi skirts, shirts. Smart fabrics (crepe, cotton-blend). Nothing bodycon, nothing sheer.
evening  — Elevated and refined for a dinner out or cocktail event. Silk, georgette, or satin pieces. One statement element (a draped top, a midi skirt in a rich tone). Understated glamour — not party-loud.
weekend  — Stylish but laid-back. Relaxed-fit pieces the client would genuinely wear to brunch or shopping: wide-leg trousers, a breezy top, loafers or clean sneakers. Comfortable yet visually coherent.
formal   — Occasion-ready for a wedding guest, gala, or formal Indian event. Full-length or midi silhouettes in luxurious fabrics (chiffon, satin, embroidered). Coordinated and complete-looking.
party    — Fun and confident for a night out or celebration. Bolder colour or texture than evening — a metallic, a rich jewel tone, or a statement silhouette. Still minimal in layering; avoid over-accessorising.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLING PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Modern and minimal: cleaner is better. If an item does not add to the outfit, leave it out.
- Each outfit should have one focal piece (the "hero") — everything else supports it quietly.
- Avoid over-layering; 2–3 pieces (plus shoes) is the ideal modern outfit formula.
- Fit and proportion matter: pair oversized/relaxed tops with fitted bottoms, or fitted tops with wider-leg bottoms — never loose + loose.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(itemList)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create EXACTLY 6 outfits — one per occasion (casual, work, evening, weekend, formal, party). Each occasion must appear exactly once. Only use item IDs that exist in the catalog above.

Return ONLY a valid JSON array with exactly 6 objects. Each object must have:
- itemIds: array of item ID strings from the catalog
- occasion: exactly one of "casual", "work", "evening", "weekend", "formal", "party"
- styleNote: 3–5 word editorial headline for the outfit (e.g. "Effortless Weekend Ease", "Sharp Boardroom Power", "Evening Drama in Ivory") — no full sentences, no punctuation at the end

Return ONLY the JSON array, no markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash-lite',
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
