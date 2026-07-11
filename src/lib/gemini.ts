import { GoogleGenAI } from '@google/genai';
import type { FashionItem, FashionItemStyleTags, ItemCategory } from './supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';

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
  style_description: string;
  style_tags: FashionItemStyleTags | null;
  confidence: number; // 0–1
}

const ITEM_PARSE_PROMPT = `You are a fashion data extraction specialist and senior stylist. Analyze the provided clothing item image and the admin's description, then extract structured data.

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
- style_description: string — A rich 4–6 sentence paragraph written as if briefing a fashion stylist who cannot see the image. Cover all of the following in order:
    1. Visual overview: silhouette type (fitted/flowy/structured/relaxed), length (crop/hip/midi/maxi/full), and overall impression
    2. Construction details: neckline type, sleeve length and style (sleeveless/cap/short/3-quarter/full), any defining features (wrap closure, pleats, pockets, embellishment, print placement)
    3. Print or texture nature: is it solid? printed (describe density — subtle/medium/bold — and pattern type)? textured (ribbed/embossed/lace/embroidered)?
    4. Layering and styling potential: can it be belted? worn as a layer over/under something? tucked or left out? does it need a visible waistline treatment?
    5. Occasion suitability: which of casual / work / evening / weekend / formal / party does it genuinely suit, and which does it NOT suit?
    6. Season and fabric notes: is the fabric lightweight, medium-weight, or heavy? any weather sensitivity (avoid monsoon, ideal for summer, etc.)?
  Be specific and practical. Use stylist vocabulary. Never say "this item" — name the piece.
- style_tags: object with structured tags for rule-based outfit matching. Use null for fields that do not apply to this item type (e.g. neckline/sleeve for shoes, length for bags). All enum values are exact strings — do not invent new values.
  {
    "silhouette_type": one of: "A-line" | "fitted" | "relaxed" | "flowy" | "structured" | "boxy" | "tailored" | "oversized" | "wrap" | "sheath" | "column",
    "length": one of: "crop" | "hip" | "midi" | "maxi" | "full" | "knee" | "ankle" | "mini" | null,
    "neckline": one of: "crew" | "v-neck" | "scoop" | "boat" | "square" | "halter" | "cowl" | "polo" | "mandarin" | "sweetheart" | "off-shoulder" | "none" | null,
    "fit_category": one of: "slim" | "regular" | "relaxed" | "oversized",
    "visual_weight": one of: "light" | "medium" | "heavy",
    "sleeve_type": one of: "sleeveless" | "cap" | "short" | "3-quarter" | "full" | "none" | null,
    "coverage": array of zero or more: "arms_covered" | "tummy_covered" | "tummy_skimming" | "tummy_exposed" | "knee_below" | "knee_above" | "shoulders_covered" | "back_covered",
    "occasion_tags": array of one or more: "casual" | "work" | "evening" | "weekend" | "formal" | "party",
    "undertone_compatibility": array of one or more: "warm" | "cool" | "neutral" | "deep-warm" | "olive",
    "fabric_weight": one of: "light" | "medium" | "heavy",
    "pattern": one of: "solid" | "stripe" | "check" | "floral" | "abstract" | "geometric" | "animal-print" | "embroidered" | "textured" | "printed"
  }
- confidence: float 0–1 (your confidence in the extraction accuracy)

Rules:
- Use specific color terms (ivory not white, cobalt not blue)
- If size info is unclear or not mentioned, return empty array []
- If price is unclear, return null
- Return ONLY the JSON, no explanation`;

/**
 * Parse a fashion item from an uploaded image + admin's raw text.
 * Uses Gemini 2.5 Flash vision for richer style understanding.
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
    model: TEXT_MODEL,
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

  // Normalise: ensure arrays are arrays and required strings exist
  if (!Array.isArray(parsed.color))            parsed.color = [];
  if (!Array.isArray(parsed.material))         parsed.material = [];
  if (!Array.isArray(parsed.size_availability)) parsed.size_availability = [];
  if (typeof parsed.confidence !== 'number')   parsed.confidence = 0.5;
  if (typeof parsed.style_description !== 'string') parsed.style_description = '';
  if (parsed.style_tags && typeof parsed.style_tags === 'object') {
    if (!Array.isArray(parsed.style_tags.coverage)) parsed.style_tags.coverage = [];
    if (!Array.isArray(parsed.style_tags.occasion_tags)) parsed.style_tags.occasion_tags = [];
    if (!Array.isArray(parsed.style_tags.undertone_compatibility)) parsed.style_tags.undertone_compatibility = [];
  } else {
    parsed.style_tags = null;
  }

  return parsed;
}

/**
 * Generate structured style_tags for an existing item using its stored image URL.
 * Used by the retroactive enrichment endpoint to backfill items ingested before
 * structured tagging was introduced.
 *
 * @param imageUrl       - Public URL of the item image in Supabase Storage
 * @param itemName       - Name of the item (used as context)
 * @param rawDescription - Original admin description if available
 */
export async function generateStyleTags(
  imageUrl: string,
  itemName: string,
  rawDescription: string
): Promise<FashionItemStyleTags | null> {
  const TAGS_PROMPT = `You are a fashion data specialist. Study this clothing item and return ONLY a valid JSON object with structured tags for outfit matching.

Item name: "${itemName}"
${rawDescription ? `Admin notes: "${rawDescription}"` : ''}

Return this exact JSON shape — use null for fields that do not apply to this item type:
{
  "silhouette_type": one of: "A-line" | "fitted" | "relaxed" | "flowy" | "structured" | "boxy" | "tailored" | "oversized" | "wrap" | "sheath" | "column",
  "length": one of: "crop" | "hip" | "midi" | "maxi" | "full" | "knee" | "ankle" | "mini" | null,
  "neckline": one of: "crew" | "v-neck" | "scoop" | "boat" | "square" | "halter" | "cowl" | "polo" | "mandarin" | "sweetheart" | "off-shoulder" | "none" | null,
  "fit_category": one of: "slim" | "regular" | "relaxed" | "oversized",
  "visual_weight": one of: "light" | "medium" | "heavy",
  "sleeve_type": one of: "sleeveless" | "cap" | "short" | "3-quarter" | "full" | "none" | null,
  "coverage": array of zero or more: "arms_covered" | "tummy_covered" | "tummy_skimming" | "tummy_exposed" | "knee_below" | "knee_above" | "shoulders_covered" | "back_covered",
  "occasion_tags": array of one or more: "casual" | "work" | "evening" | "weekend" | "formal" | "party",
  "undertone_compatibility": array of one or more: "warm" | "cool" | "neutral" | "deep-warm" | "olive",
  "fabric_weight": one of: "light" | "medium" | "heavy",
  "pattern": one of: "solid" | "stripe" | "check" | "floral" | "abstract" | "geometric" | "animal-print" | "embroidered" | "textured" | "printed"
}

Return ONLY the JSON object. No markdown, no explanation.`;

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const arrayBuffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: TAGS_PROMPT },
        ],
      },
    ],
  });

  const text = (response.text ?? '').trim();
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as FashionItemStyleTags;
    if (!Array.isArray(parsed.coverage)) parsed.coverage = [];
    if (!Array.isArray(parsed.occasion_tags)) parsed.occasion_tags = [];
    if (!Array.isArray(parsed.undertone_compatibility)) parsed.undertone_compatibility = [];
    return parsed;
  } catch {
    console.error('generateStyleTags: failed to parse JSON:', text.slice(0, 200));
    return null;
  }
}

/**
 * Generate a style_description for an existing item using its stored image URL.
 * Used by the retroactive enrichment endpoint to backfill items ingested before
 * this field was introduced.
 *
 * @param imageUrl    - Public URL of the item image in Supabase Storage
 * @param itemName    - Name of the item (used as context)
 * @param rawDescription - Original admin description if available
 */
export async function generateStyleDescription(
  imageUrl: string,
  itemName: string,
  rawDescription: string
): Promise<string> {
  const ENRICH_PROMPT = `You are a senior fashion stylist writing a briefing for another stylist who cannot see the image. Study this clothing item carefully and write a rich, specific 4–6 sentence paragraph covering:

1. Visual overview: silhouette type (fitted/flowy/structured/relaxed), length (crop/hip/midi/maxi/full), and overall impression
2. Construction details: neckline type, sleeve length and style (sleeveless/cap/short/3-quarter/full), any defining features (wrap closure, pleats, pockets, embellishment, print placement)
3. Print or texture nature: is it solid? printed (describe density — subtle/medium/bold — and pattern type)? textured (ribbed/embossed/lace/embroidered)?
4. Layering and styling potential: can it be belted? worn as a layer over/under something? tucked or left out? does it need a visible waistline treatment?
5. Occasion suitability: which of casual / work / evening / weekend / formal / party does it genuinely suit, and which does it NOT suit?
6. Season and fabric notes: is the fabric lightweight, medium-weight, or heavy? any weather sensitivity?

Item name: "${itemName}"
${rawDescription ? `Admin notes: "${rawDescription}"` : ''}

Write the paragraph only — no JSON, no bullet points, no heading. Be specific and practical. Use stylist vocabulary. Name the piece rather than saying "this item".`;

  // Fetch image and convert to base64
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
  const arrayBuffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: ENRICH_PROMPT },
        ],
      },
    ],
  });

  return (response.text ?? '').trim();
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
    style_description: result.style_description || undefined,
    style_tags: result.style_tags ?? undefined,
    image_url: imageUrl,
    ai_confidence: result.confidence,
    ai_raw_response: result as unknown as Record<string, unknown>,
    status: 'draft',
    uploaded_by: uploadedBy ?? undefined,
  };
}
