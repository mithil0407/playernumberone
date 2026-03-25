import { GoogleGenAI } from '@google/genai';
import type { FashionItem, ItemCategory } from './supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export interface FashionItemAIResult {
  brand: string | null;
  item_name: string;
  category: ItemCategory | null;
  color: string[];
  material: string[];
  price: number | null;
  currency: string;
  size_availability: string[];
  purchase_link: string | null;
  confidence: number; // 0–1
}

const ITEM_PARSE_PROMPT = `You are a fashion data extraction specialist. Analyze the provided clothing item image and the admin's description, then extract structured data.

Return ONLY a valid JSON object with these exact fields:
- brand: string or null (brand name if visible/mentioned)
- item_name: string (concise descriptive name, e.g. "Floral Wrap Midi Dress")
- category: one of exactly: "top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory", "jumpsuit", "skirt", "other"
- color: array of strings (specific color names, e.g. ["ivory", "cobalt blue"])
- material: array of strings (e.g. ["cotton", "polyester"])
- price: number or null (numeric value only, no currency symbols)
- currency: string (default "INR" if not specified)
- size_availability: array using ONLY these values: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "One Size"]
- purchase_link: string or null (URL if mentioned in description)
- confidence: float 0–1 (your confidence in the extraction accuracy)

Rules:
- Use specific color terms (ivory not white, cobalt not blue)
- If size info is unclear or not mentioned, return empty array []
- If price is unclear, return null
- Return ONLY the JSON, no explanation`;

/**
 * Parse a fashion item from an uploaded image + admin's raw text.
 * Uses Gemini 2.5 Flash vision capabilities.
 *
 * @param imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param mimeType    - MIME type of the image (e.g. "image/jpeg")
 * @param rawText     - Admin's unstructured description
 */
export async function parseItemWithGemini(
  imageBase64: string,
  mimeType: string,
  rawText: string
): Promise<FashionItemAIResult> {
  const prompt = rawText.trim()
    ? `${ITEM_PARSE_PROMPT}\n\nAdmin description: "${rawText}"`
    : ITEM_PARSE_PROMPT;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
  });

  const text = response.text ?? '';

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed: FashionItemAIResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  // Normalise: ensure arrays are arrays
  if (!Array.isArray(parsed.color))            parsed.color = [];
  if (!Array.isArray(parsed.material))         parsed.material = [];
  if (!Array.isArray(parsed.size_availability)) parsed.size_availability = [];
  if (typeof parsed.confidence !== 'number')   parsed.confidence = 0.5;

  return parsed;
}

/**
 * Convert a Gemini extraction result into a partial FashionItem ready for DB insert.
 */
export function aiResultToFashionItem(
  result: FashionItemAIResult,
  imageUrl: string,
  rawDescription: string,
  uploadedBy: string | null
): Omit<FashionItem, 'id' | 'created_at' | 'updated_at'> {
  return {
    raw_description: rawDescription,
    raw_image_url: imageUrl,
    brand: result.brand ?? undefined,
    item_name: result.item_name,
    category: result.category ?? undefined,
    color: result.color,
    material: result.material,
    price: result.price ?? undefined,
    currency: result.currency || 'INR',
    size_availability: result.size_availability,
    purchase_link: result.purchase_link ?? undefined,
    image_url: imageUrl,
    ai_confidence: result.confidence,
    ai_raw_response: result as unknown as Record<string, unknown>,
    status: 'draft',
    uploaded_by: uploadedBy ?? undefined,
  };
}
