import 'server-only';

// Pictures the stylist makes in the chat — their outfit with the fix applied,
// them in a suggested look, hairstyles on their face — on Google's image model
// (gemini-nano-banana-2.1 at 1K, 4:5). Every call is logged to
// agent_usage_events (kind "image") with its tokens and estimated cost.

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '@/lib/supabase';
import { buildAgentImagePrompt, type ImageKind } from '@/lib/agentImagePrompts';

export const AGENT_IMAGE_MODEL = process.env.ICONIK_AGENT_IMAGE_MODEL?.trim() || 'gemini-nano-banana-2.1';
const IMAGE_SIZE = process.env.ICONIK_AGENT_IMAGE_SIZE?.trim() || '1K';
const IMAGE_TIMEOUT_MS = 90_000;
/** Estimated cost per picture, until the real price is set (ICONIK_AGENT_IMAGE_COST_USD). */
const IMAGE_COST_USD = Number(process.env.ICONIK_AGENT_IMAGE_COST_USD) || 0.06;

let ai: GoogleGenAI | null = null;
function gemini() {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not configured');
  ai ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return ai;
}

export interface ImageReference {
  bytes: Buffer;
  mimeType: string;
}

export async function generateAgentImage(input: {
  clientId: string;
  kind: ImageKind;
  brief: string;
  line: 'man' | 'woman' | null;
  palette?: string[] | null;
  references: ImageReference[];
}) {
  const prompt = buildAgentImagePrompt({ kind: input.kind, brief: input.brief, line: input.line, palette: input.palette });
  const parts = [
    ...input.references.slice(0, 2).map(reference => ({
      inlineData: { mimeType: reference.mimeType, data: reference.bytes.toString('base64') },
    })),
    { text: prompt },
  ];
  const response = await gemini().models.generateContent({
    model: AGENT_IMAGE_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { imageSize: IMAGE_SIZE, aspectRatio: input.kind === 'hairstyles' ? '1:1' : '4:5' },
      httpOptions: { timeout: IMAGE_TIMEOUT_MS },
    },
  });
  const usage = response.usageMetadata;
  const image = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
  void supabaseAdmin.from('agent_usage_events').insert({
    client_id: input.clientId,
    kind: 'image',
    workload: `iconik_agent_image_${input.kind}`,
    model: AGENT_IMAGE_MODEL,
    input_tokens: usage?.promptTokenCount ?? 0,
    cached_tokens: 0,
    output_tokens: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
    web_searches: 0,
    cost_usd: image ? IMAGE_COST_USD : 0,
  }).then(({ error }) => {
    if (error) console.warn('[agent] image usage not recorded:', error.message);
  });
  if (!image?.inlineData?.data) {
    const finish = response.candidates?.[0]?.finishReason ?? 'unknown';
    const text = response.candidates?.[0]?.content?.parts?.find(part => part.text)?.text?.slice(0, 200) ?? '';
    throw new Error(`No image came back (${finish})${text ? `: ${text}` : ''}`);
  }
  return {
    bytes: Buffer.from(image.inlineData.data, 'base64'),
    mimeType: image.inlineData.mimeType || 'image/png',
  };
}
