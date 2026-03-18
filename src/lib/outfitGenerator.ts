import { GoogleGenAI } from '@google/genai';
import type { FashionItem, OutfitOccasion } from './supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export interface OutfitRecommendation {
  itemIds: string[];
  occasion: OutfitOccasion;
  styleNote: string;
}

export async function generateOutfitRecommendations(
  profile: {
    height_cm?: number;
    weight_kg?: number;
    bust_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
  },
  items: FashionItem[]
): Promise<OutfitRecommendation[]> {
  const itemList = items.map(item => ({
    id: item.id,
    name: item.item_name,
    category: item.category,
    color: item.color,
    brand: item.brand ?? null,
    price: item.price ?? null,
  }));

  const prompt = `You are a professional fashion stylist for an Indian luxury clothing brand called Iconik Club.

Client measurements:
- Height: ${profile.height_cm ?? 'unknown'} cm
- Weight: ${profile.weight_kg ?? 'unknown'} kg
- Bust: ${profile.bust_cm ?? 'unknown'} cm
- Waist: ${profile.waist_cm ?? 'unknown'} cm
- Hips: ${profile.hips_cm ?? 'unknown'} cm

Available catalog items:
${JSON.stringify(itemList, null, 2)}

Create EXACTLY 6 outfit combinations — no more, no less. Rules:
- Each outfit must contain 3–5 items from the catalog (use their exact IDs)
- EVERY outfit MUST include exactly one pair of shoes (category "shoes") — never omit footwear
- Cover 6 different occasions spread across: casual, work, evening, weekend, formal, party
- Each occasion must appear exactly once
- Match colors and styles harmoniously
- Be appropriate for Indian climate and culture
- Only use item IDs that exist in the catalog above
- Do NOT create more than 6 outfits

Return ONLY a valid JSON array with exactly 6 objects. Each object must have:
- itemIds: array of item ID strings from the catalog
- occasion: exactly one of "casual", "work", "evening", "weekend", "formal", "party"
- styleNote: 3–5 word editorial headline for the outfit (e.g. "Effortless Weekend Ease", "Sharp Boardroom Power", "Evening Drama in Ivory") — no full sentences, no punctuation at the end

Return ONLY the JSON array, no markdown, no explanation.`;

  const response = await ai.models.generateContent({
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
