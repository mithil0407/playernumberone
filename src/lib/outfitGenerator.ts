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

  const prompt = `You are a professional fashion stylist for an Indian luxury clothing brand called Iconik Club.

Client measurements:
- Height: ${profile.height_cm ?? 'unknown'} cm
- Weight: ${profile.weight_kg ?? 'unknown'} kg
- Bust: ${profile.bust_cm ?? 'unknown'} cm
- Waist: ${profile.waist_cm ?? 'unknown'} cm
- Hips: ${profile.hips_cm ?? 'unknown'} cm

Current season: ${season}
${seasonDescription}
${restrictionsBlock}
Available catalog items:
${JSON.stringify(itemList)}

Create EXACTLY 6 outfit combinations — no more, no less. Rules:
- Each outfit must contain 3–5 items from the catalog (use their exact IDs)
- EVERY outfit MUST include exactly one pair of shoes (category "shoes") — never omit footwear
- Cover 6 different occasions spread across: casual, work, evening, weekend, formal, party
- Each occasion must appear exactly once
- Match colors and styles harmoniously
- Be appropriate for the current season and Indian culture
- Only use item IDs that exist in the catalog above
- Do NOT create more than 6 outfits

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

  const validated = recs.slice(0, 6).map(rec => ({
    ...rec,
    itemIds: (rec.itemIds ?? []).filter(id => validIds.has(id)),
  }));

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
