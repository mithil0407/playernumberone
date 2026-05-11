import { GoogleGenAI } from '@google/genai';
import type { ClassificationResult } from './manReportGenerator';
import type { FaceImageKind } from './manImageGenerator';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const TEXT_MODEL = 'gemini-3-flash-preview';
const MAX_INSPIRATION_IMAGE_BYTES = 8 * 1024 * 1024;

interface InspirationImage {
  data: string;
  mimeType: string;
}

export interface FaceStyleSwapDraftInput {
  classification: ClassificationResult;
  kind: FaceImageKind;
  optionIndex: number;
  reason: string;
  notes: string;
  replacementText: string;
  inspirationImage?: InspirationImage | null;
}

export interface FaceStyleSwapDraftResult {
  candidateStyle: string;
}

export function hashFaceStyleText(text: string): string {
  const value = text.trim();
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function getFaceStyleOption(
  classification: ClassificationResult,
  kind: FaceImageKind,
  optionIndex: number,
): string {
  if (kind === 'hairstyle') return classification.face.hairstyle_recommendations?.[optionIndex - 1] ?? '';
  if (kind === 'beard') return classification.face.beard_style_recommendations?.[optionIndex - 1] ?? '';
  return classification.face.eyewear_shapes?.[optionIndex - 1] ?? '';
}

export function setFaceStyleOption(
  classification: ClassificationResult,
  kind: FaceImageKind,
  optionIndex: number,
  style: string,
): ClassificationResult {
  const next: ClassificationResult = {
    ...classification,
    face: {
      ...classification.face,
      hairstyle_recommendations: [...(classification.face.hairstyle_recommendations ?? [])],
      beard_style_recommendations: [...(classification.face.beard_style_recommendations ?? [])],
      eyewear_shapes: [...(classification.face.eyewear_shapes ?? [])],
    },
  };

  const target = kind === 'hairstyle'
    ? next.face.hairstyle_recommendations
    : kind === 'beard'
      ? next.face.beard_style_recommendations!
      : next.face.eyewear_shapes;

  while (target.length < optionIndex) target.push('');
  target[optionIndex - 1] = style.trim();
  return next;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md|text)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

function cleanCandidateStyle(text: string): string {
  return stripFences(text)
    .replace(/^[-•]\s*/, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function kindLabel(kind: FaceImageKind): string {
  if (kind === 'hairstyle') return 'hairstyle';
  if (kind === 'beard') return 'beard / facial hair grooming';
  return 'eyewear frame';
}

function buildDraftPrompt(input: FaceStyleSwapDraftInput, currentStyle: string): string {
  const { face } = input.classification;
  const beardRules = input.kind === 'beard'
    ? `
BALD / CLOSELY SHAVED CLIENT RULES:
- Preserve the client as bald or closely shaved.
- Do not add scalp hair, hair volume, fringe, quiff, crop density, or any scalp hairstyle.
- The replacement must describe facial hair only: beard, moustache, stubble, cheek line, neckline, length, density, and grooming finish.`
    : '';

  const kindRules = input.kind === 'eyewear'
    ? `
EYEWEAR RULES:
- Describe the exact frame shape, material/finish, colour, lens clarity, and visual weight.
- Do not describe hairstyle or beard changes.`
    : input.kind === 'hairstyle'
      ? `
HAIRSTYLE RULES:
- Describe only the scalp hair style, length, shape, texture, parting, and grooming finish.
- Keep it realistic for the client's face shape and hair presence.`
      : '';

  return `You are a literal face-style extraction assistant for ICONIK's men's report editor.

Return ONLY the replacement ${kindLabel(input.kind)} text. No explanations, no markdown fences, no labels.

Target slot: ${kindLabel(input.kind)} option ${input.optionIndex}
Face shape: ${face.face_shape}
Hair presence: ${face.hair_presence ?? 'unclear'}
Facial hair presence: ${face.facial_hair_presence ?? 'unclear'}
Current recommendation:
${currentStyle || 'Not available'}

Admin rejection reason:
${input.reason || 'Not provided'}

Admin replacement text:
${input.replacementText || 'Not provided'}

Admin notes:
${input.notes || 'Not provided'}

LITERAL COPY RULES:
- If admin replacement text names a style, preserve that style as the source of truth.
- If an inspiration image is provided, describe only the visible ${kindLabel(input.kind)} details.
- If text and image conflict, follow admin replacement text first and use the image only for missing visible details.
- Do not improve, redesign, or add your own twist.
- Keep the output concise enough to store as one recommendation option.
${beardRules}${kindRules}

Required output: one clean replacement style phrase or sentence.`;
}

export async function imageFileToFaceStyleInlineData(file: File | null): Promise<InspirationImage | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith('image/')) {
    throw new Error('Inspiration upload must be an image file');
  }
  if (file.size > MAX_INSPIRATION_IMAGE_BYTES) {
    throw new Error('Inspiration image is too large. Use an image under 8 MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    data: buffer.toString('base64'),
    mimeType: file.type || 'image/jpeg',
  };
}

export async function generateFaceStyleSwapDraft(
  input: FaceStyleSwapDraftInput,
): Promise<FaceStyleSwapDraftResult> {
  if (![1, 2].includes(input.optionIndex)) {
    throw new Error('optionIndex must be 1 or 2');
  }

  const currentStyle = getFaceStyleOption(input.classification, input.kind, input.optionIndex);
  const prompt = buildDraftPrompt(input, currentStyle);
  const parts: object[] = [
    { text: prompt },
    ...(input.inspirationImage
      ? [{ inlineData: { mimeType: input.inspirationImage.mimeType, data: input.inspirationImage.data } }]
      : []),
  ];

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts }],
    config: { maxOutputTokens: 1024 },
  });

  const candidateStyle = cleanCandidateStyle(response.text ?? '');
  if (!candidateStyle) {
    throw new Error('AI did not return a replacement style');
  }

  return { candidateStyle };
}
