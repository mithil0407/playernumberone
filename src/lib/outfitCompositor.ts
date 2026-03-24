import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { createSupabaseAdminServerClient } from './supabaseServer';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export interface OutfitItem {
  imageUrl: string;
  name: string;
  category: string;
  brand?: string | null;
  color?: string[] | null;
  material?: string[] | null;
  rawDescription?: string | null;
  imageData?: ImageData | null;
}

export interface ImageData {
  data: string;       // base64-encoded
  mimeType: string;
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
};

/**
 * Downloads an image from a URL.
 * For Supabase Storage URLs, uses the admin SDK (avoids fetch timeouts in server context).
 * Falls back to plain fetch for non-Supabase URLs.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  // Extract bucket + path from Supabase Storage URLs
  // Format: .../storage/v1/object/public/<bucket>/<path>
  //      or .../storage/v1/object/sign/<bucket>/<path>?token=...
  const sbMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/);
  if (sbMatch) {
    const [, bucket, storagePath] = sbMatch;
    try {
      const admin = createSupabaseAdminServerClient();
      const { data, error } = await admin.storage.from(bucket).download(storagePath);
      if (error || !data) {
        console.warn(`Supabase download failed ${bucket}/${storagePath}: ${error?.message}`);
        return null;
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const ext = storagePath.split('.').pop()?.toLowerCase() ?? 'jpg';
      return { data: buffer.toString('base64'), mimeType: MIME_MAP[ext] ?? 'image/jpeg' };
    } catch (err) {
      console.warn(`Supabase download error ${bucket}/${storagePath}: ${err}`);
      return null;
    }
  }

  // Non-Supabase URL — plain fetch
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.warn(`Fetch failed (${res.status}): ${url.slice(0, 100)}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') ?? 'image/jpeg';
    return { data: buffer.toString('base64'), mimeType: ct.split(';')[0].trim() };
  } catch (err) {
    console.warn(`Fetch error ${url.slice(0, 100)}: ${err}`);
    return null;
  }
}

function describeItem(item: OutfitItem, index: number): string {
  const parts = [`PIECE ${index}: ${item.category.toUpperCase()} — "${item.name}"`];
  if (item.brand) parts.push(`Brand: ${item.brand}`);
  if (item.color?.length) parts.push(`Color: ${item.color.join(', ')}`);
  if (item.material?.length) parts.push(`Material: ${item.material.join(', ')}`);
  if (item.rawDescription) parts.push(`Description: ${item.rawDescription}`);
  parts.push(`⚠️ This piece MUST be worn in the final image — do not omit it.`);
  return parts.join('\n');
}

/**
 * Generates an AI editorial portrait of the client wearing ALL outfit pieces.
 * Uses an interleaved parts approach: each image is immediately preceded by
 * its text description so Gemini associates them correctly.
 *
 * Client photos (headshot + body) should be pre-fetched and passed as base64
 * to avoid issues with expired signed URLs.
 */
export async function createOutfitCard(
  clientPhotos: { headshot?: ImageData | null; bodyPhoto?: ImageData | null },
  items: OutfitItem[],
  styleNote?: string
): Promise<Buffer> {
  const { headshot, bodyPhoto } = clientPhotos;

  // Use pre-fetched image data when available, otherwise fetch from URL
  const itemImgs = await Promise.all(
    items.map(i => i.imageData ? Promise.resolve(i.imageData) : fetchImageAsBase64(i.imageUrl)),
  );

  const loadedItems = items.filter((_, i) => !!itemImgs[i]);
  const loadedImgs = itemImgs.filter(Boolean) as { data: string; mimeType: string }[];

  console.log(
    `Outfit card — headshot:${!!headshot} body:${!!bodyPhoto} ` +
    `items:${loadedItems.length}/${items.length} [${loadedItems.map(i => i.name).join(', ')}]`
  );

  if (loadedItems.length === 0) {
    console.error('No item images loaded — falling back to collage');
    return createCollageCard(items.map(i => i.imageUrl));
  }

  // ── Build interleaved parts ──────────────────────────────────────────────
  // Pattern: description text → image (for each input)
  // This ensures Gemini links each image to its label.
  const parts: Part[] = [];

  // Client reference photos — headshot first (primary face reference), then full body for proportions.
  // Both are required: the headshot gives Gemini enough face detail to copy; the body photo
  // gives body shape and proportions. Without the headshot the face is too small to identify.
  if (headshot) {
    parts.push({ text: `IDENTITY REFERENCE 1 — CLIENT FACE (HIGHEST PRIORITY):
This close-up shows the client's face. The generated image MUST depict THIS EXACT PERSON.
Copy with absolute fidelity: facial structure, skin tone, complexion, eye shape, eye colour, nose, lips, jawline, hairline, hair colour, hair texture, and ethnicity.
The face in the output must be immediately recognisable as the same individual.` });
    parts.push({ inlineData: { mimeType: headshot.mimeType, data: headshot.data } });
  }
  if (bodyPhoto) {
    parts.push({ text: `IDENTITY REFERENCE 2 — CLIENT FULL BODY:
This is the same person's full body. Use it to copy her exact body shape, proportions, height, and build.
Do NOT idealise, slim, or alter her physique in any way.` });
    parts.push({ inlineData: { mimeType: bodyPhoto.mimeType, data: bodyPhoto.data } });
  }

  // Clothing pieces — each described immediately before its image
  loadedItems.forEach((item, i) => {
    parts.push({ text: describeItem(item, i + 1) });
    parts.push({ inlineData: { mimeType: loadedImgs[i].mimeType, data: loadedImgs[i].data } });
  });

  // Final generation instruction
  const pieceList = loadedItems
    .map((item, i) => `  ${i + 1}. ${item.category} — "${item.name}"`)
    .join('\n');

  const finalPrompt = `
TASK: Generate ONE photorealistic, full-body editorial fashion photograph. This is a VIRTUAL TRY-ON — the person in the output must be the SAME individual from the reference photos above, wearing the clothing pieces below.

She must be wearing ALL ${loadedItems.length} pieces listed below — every single one, no exceptions:
${pieceList}
${styleNote ? `\nOutfit concept: ${styleNote}` : ''}

IDENTITY (HIGHEST PRIORITY):
- The person in the generated image MUST be the same person as in the reference photos
- Use REFERENCE 1 (face close-up) to copy her face exactly: structure, skin tone, eyes, nose, lips, jawline
- Use REFERENCE 2 (full body) to copy her exact body shape, proportions, and build
- This must look like a photo OF HER, not a different model or generic person
- Do NOT beautify, slim, lighten skin, or alter her appearance in any way

HAIR & MAKEUP:
- Style her hair in face-framing layers
- Keep her natural hair color and texture from the reference photo
- Apply natural, editorial makeup: soft glowing skin, subtle brow definition, light mascara, and a neutral lip

CLOTHING RULES:
- ALL ${loadedItems.length} clothing pieces must be clearly visible and worn on her body simultaneously
- Each piece must match its reference image in color, pattern, material, and design
- Do NOT substitute, invent, or skip any piece
- If pieces overlap naturally (e.g. top tucked into bottom), show them as they would realistically be worn together

VISUAL STYLE:
- Portrait orientation, full body from head to toe including shoes
- Solid cool teal-grey background (#6B8E9F) — clean luxury studio
- Professional three-point studio lighting, soft shadows
- Luxury fashion editorial quality — Vogue / Harper's Bazaar campaign
- Photorealistic, sharp, high-resolution — not illustrated or painted
`.trim();

  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ parts }],
      config: { responseModalities: ['IMAGE'] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        const inlineData = (part as { inlineData?: { data: string; mimeType: string } }).inlineData;
        if (inlineData?.data) {
          return Buffer.from(inlineData.data, 'base64');
        }
      }
    }
    throw new Error('No image part returned by Gemini');
  } catch (err) {
    console.error('Gemini image generation failed, using collage fallback:', err);
    return createCollageCard(items.map(i => i.imageUrl));
  }
}

/** Fallback: 2-column portrait grid of item images */
async function createCollageCard(itemImageUrls: string[]): Promise<Buffer> {
  const W = 600, H = 800, PAD = 10;
  const BG = { r: 107, g: 142, b: 159 };
  const urls = itemImageUrls.slice(0, 4);
  const cols = 2;
  const rows = Math.ceil(Math.max(urls.length, 1) / cols);
  const cellW = Math.floor((W - PAD * (cols + 1)) / cols);
  const cellH = Math.floor((H - PAD * (rows + 1)) / rows);
  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < urls.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    try {
      const res = await fetch(urls[i], { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const resized = await sharp(buf)
        .resize(cellW, cellH, { fit: 'contain', background: BG })
        .png().toBuffer();
      composites.push({ input: resized, left: PAD + col * (cellW + PAD), top: PAD + row * (cellH + PAD) });
    } catch { /* skip */ }
  }

  return sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toBuffer();
}
