// menOutfitGenerator.ts — ICONIK Club Men
// Gemini prompt tuned for men's styling: body geometry, occasions, fit language.

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
  return { season: 'Winter', description: 'Cool Indian winter (December–February). Full sleeves, light woolens, structured blazers, layering appropriate. Crepe and knit fabrics are ideal.' };
}

// Men's style restriction rules
const RESTRICTION_RULES: Record<string, string> = {
  formal_only:
    'FORMAL ONLY — The client dresses exclusively in formal contexts. Avoid casual pieces like t-shirts, sneakers, or denim. Every outfit should be office-appropriate or smarter.',
  no_shorts:
    'NO SHORTS — Never include shorts in any outfit. Always use full-length trousers, chinos, or kurta bottoms.',
  no_indian_wear:
    'NO INDIAN WEAR — The client does not wear kurtas or ethnic pieces. Exclude all Indian occasion wear. Use Western formal or smart-casual for all occasions.',
  indian_wear_only:
    'INDIAN WEAR PREFERRED — The client strongly prefers kurtas, sherwanis, and Indo-western pieces. Prioritise ethnic and fusion options wherever the catalog allows.',
};

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

  const activeRestrictions = (profile.style_restrictions ?? []).filter(r => RESTRICTION_RULES[r]);
  const restrictionsBlock = activeRestrictions.length > 0
    ? `\nStyle restrictions — STRICTLY enforce every rule below:\n${activeRestrictions.map(r => `- ${RESTRICTION_RULES[r]}`).join('\n')}\n`
    : '';

  const styleNotesBlock = profile.style_notes?.trim()
    ? `\nClient style preferences (treat this as the strongest signal for aesthetic, colour, and brands):\n"${profile.style_notes.trim()}"\n`
    : '';

  const prompt = `You are a senior men's stylist for ICONIK, an Indian luxury menswear brand. Your aesthetic is modern, minimal, and intentional — the kind of man who looks sharp without trying too hard. Every outfit must feel like it was built for this specific client's body and lifestyle.

Client measurements:
- Height: ${profile.height_cm ?? 'unknown'} cm
- Weight: ${profile.weight_kg ?? 'unknown'} kg
- Chest: ${profile.chest_cm ?? 'unknown'} cm
- Waist: ${profile.waist_cm ?? 'unknown'} cm
- Shoulder width: ${profile.shoulder_cm ?? 'unknown'} cm
- Body shape: ${profile.body_shape ?? 'unknown'}

Current season: ${season}
${seasonDescription}
${styleNotesBlock}${restrictionsBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTFIT STRUCTURE RULES (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every outfit MUST have:
1. Exactly ONE top layer — a shirt, t-shirt, kurta, or blazer (as the primary visible layer).
2. Exactly ONE bottom — trousers, jeans, chinos, or churidar. NEVER two bottoms.
3. Exactly ONE pair of shoes — always include footwear.
4. Maximum ONE outerwear piece — a blazer or jacket is optional, not required.
5. Maximum ONE accessory — a watch, pocket square, or belt. Optional.
6. Total items per outfit: 2–5 items. Shoes always count.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLOUR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Maximum 3 distinct colours per outfit — fewer is better.
- Build each outfit around one neutral anchor (navy, charcoal, white, black, camel, stone, olive) plus at most one secondary tone.
- Tonal dressing (e.g. different shades of grey, or navy head to toe) is strongly preferred.
- Never combine more than one bold or patterned piece — one statement item, everything else quiet.
- For Indian occasion outfits, rich deep tones (terracotta, emerald, burgundy, ivory) are appropriate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIT LANGUAGE (apply based on body shape)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Athletic / broad: slim-fit shirts, tapered trousers — lean into the V-taper, avoid boxy fits.
- Lean / slim: structured blazers and slightly relaxed-fit trousers add visual width.
- Stocky / fuller waist: straight-cut trousers over slim-fit, unstructured blazers, monochromatic builds.
- Average: slim-straight or regular-fit trousers pair well with most tops.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITEM REUSE LIMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The same item ID must NOT appear in more than 2 outfits across the full 6.
- Spread catalog items across outfits so the wardrobe feels diverse.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OCCASION BRIEFS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
office          — Sharp and professional for Indian metro office. Structured trousers, dress shirts, blazers. Leather shoes or smart loafers. No sneakers, no denim.
smart-casual    — Elevated casual: chinos or tapered trousers, a clean shirt or knit polo, loafers or clean leather shoes. The sweet spot between office and weekend.
casual          — Relaxed but intentional. Well-fitted jeans or chinos, a t-shirt or linen shirt, clean sneakers or casual loafers. Nothing sloppy.
indian-occasion — Weddings, festivals, celebrations. Kurtas, sherwanis, nehru-collar pieces in rich fabrics. Kolhapuris, juttis, or formal leather shoes. Complete and occasion-ready.
weekend         — Stylish and comfortable for brunch, errands, or a market. Clean sneakers, relaxed-fit trousers or jeans, a relaxed shirt or polo. Still visually coherent.
evening         — Dinner out, cocktail event, upscale gathering. Slim trousers, a refined shirt or turtleneck, leather shoes or Chelsea boots. Quiet elegance — one statement piece maximum.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLING PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Modern and minimal: cleaner is better. Do not over-accessorise or over-layer.
- Each outfit should have one focal piece — everything else supports it quietly.
- Proportion matters: slim top + tapered trouser, or structured blazer + fitted shirt + clean trouser.
- The goal is a man who looks like he made a decision, not a man who tried too hard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(itemList)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create EXACTLY 6 outfits — one per occasion (office, smart-casual, casual, indian-occasion, weekend, evening). Each occasion must appear exactly once. Only use item IDs that exist in the catalog above.

Return ONLY a valid JSON array with exactly 6 objects. Each object must have:
- itemIds: array of item ID strings from the catalog
- occasion: exactly one of "office", "smart-casual", "casual", "indian-occasion", "weekend", "evening"
- styleNote: 3–5 word editorial headline (e.g. "Quiet Office Authority", "Weekend Done Right", "Festive Depth in Terracotta") — no full sentences, no punctuation at the end

Return ONLY the JSON array, no markdown, no explanation.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = response.text ?? '';

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error(`No JSON array found in Gemini response: ${text.slice(0, 300)}`);
  }

  let recs: MenOutfitRecommendation[];
  try {
    recs = JSON.parse(arrayMatch[0]);
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${arrayMatch[0].slice(0, 300)}`);
  }

  if (!Array.isArray(recs)) throw new Error('Gemini did not return an array');

  const validIds = new Set(items.map(i => i.id));
  const itemById = new Map(items.map(i => [i.id, i]));

  // Categories that ARE a full top+bottom (suits handled as separate pieces in men's)
  const BOTTOM_CATS = new Set(['trousers', 'jeans', 'other']);
  const TOP_CATS    = new Set(['shirt', 'tshirt', 'kurta', 'blazer', 'suit', 'outerwear']);

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

    // Keep only one primary top (shirt/tshirt/kurta) — blazer/outerwear can stack on top
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

  // Ensure every outfit has footwear
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
