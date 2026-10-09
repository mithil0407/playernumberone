#!/usr/bin/env node
// Generates the Style Membership image set from docs/style-membership/shot-list.md
// with the same Google image model the WhatsApp agent uses (agentImages.ts).
//
//   node --env-file=.env.local scripts/generate-membership-images.mjs --out <raw dir> [--only a,b] [--force] [--concurrency 3]
//   node scripts/generate-membership-images.mjs --webp --out <raw dir> [--only a,b]
//
// Raw images (JPEG/PNG straight from the model) go to --out; every call is
// appended to <out>/generation-log.jsonl with its tokens and estimated cost.
// --webp turns the raw files into public/membership/<id>.webp.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOT_LIST = path.join(ROOT, 'docs/style-membership/shot-list.md');
const PUBLIC_DIR = path.join(ROOT, 'public/membership');
const MODEL = process.env.ICONIK_AGENT_IMAGE_MODEL?.trim() || 'gemini-nano-banana-2.1';
const COST_USD = Number(process.env.ICONIK_AGENT_IMAGE_COST_USD) || 0.06;

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : true;
}

export function parseShotList(markdown) {
  const prefixes = {};
  const shots = [];
  const blocks = markdown.split(/^### /m).slice(1);
  for (const block of blocks) {
    const id = block.split('\n', 1)[0].trim();
    const prompt = block.match(/```prompt\n([\s\S]*?)```/)?.[1].trim();
    if (!prompt) continue;
    if (id.startsWith('prefix:')) {
      prefixes[id.slice('prefix:'.length)] = prompt;
      continue;
    }
    const field = name => block.match(new RegExp(`^- ${name}: (.+)$`, 'm'))?.[1].trim() ?? null;
    shots.push({ id, prompt, aspect: field('aspect') ?? '4:5', style: field('style') ?? 'photo', ref: field('ref') });
  }
  return { prefixes, shots };
}

function rawPath(outDir, id) {
  for (const extension of ['jpg', 'png', 'webp']) {
    const candidate = path.join(outDir, `${id}.${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function generate(ai, shot, prefixes, outDir) {
  const parts = [];
  if (shot.ref) {
    const refFile = rawPath(outDir, shot.ref);
    if (!refFile) throw new Error(`${shot.id}: reference ${shot.ref} has not been generated yet`);
    const mimeType = refFile.endsWith('.png') ? 'image/png' : refFile.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    parts.push({ inlineData: { mimeType, data: fs.readFileSync(refFile).toString('base64') } });
  }
  const prefix = prefixes[shot.style] ?? '';
  parts.push({ text: `${prefix}\n\n${shot.prompt}` });
  const started = Date.now();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { imageSize: '1K', aspectRatio: shot.aspect },
      httpOptions: { timeout: 120_000 },
    },
  });
  const image = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
  const usage = response.usageMetadata ?? {};
  const entry = {
    id: shot.id,
    at: new Date().toISOString(),
    ms: Date.now() - started,
    model: MODEL,
    ok: Boolean(image),
    input_tokens: usage.promptTokenCount ?? 0,
    output_tokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
    cost_usd: image ? COST_USD : 0,
  };
  fs.appendFileSync(path.join(outDir, 'generation-log.jsonl'), `${JSON.stringify(entry)}\n`);
  if (!image) throw new Error(`${shot.id}: no image (${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
  const extension = image.inlineData.mimeType === 'image/png' ? 'png' : 'jpg';
  const existing = rawPath(outDir, shot.id);
  if (existing) fs.renameSync(existing, existing.replace(/\.(\w+)$/, `.prev-${Date.now()}.$1`));
  fs.writeFileSync(path.join(outDir, `${shot.id}.${extension}`), Buffer.from(image.inlineData.data, 'base64'));
  return entry;
}

async function toWebp(shots, outDir) {
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  let total = 0;
  for (const shot of shots) {
    const source = rawPath(outDir, shot.id);
    if (!source) {
      console.warn(`skip ${shot.id}: not generated`);
      continue;
    }
    const width = shot.aspect === '1:1' ? 720 : 960;
    const target = path.join(PUBLIC_DIR, `${shot.id}.webp`);
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(target);
    const size = fs.statSync(target).size;
    total += size;
    console.log(`${shot.id}.webp ${(size / 1024).toFixed(0)} KB`);
  }
  console.log(`total ${(total / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  const outDir = arg('out');
  if (typeof outDir !== 'string') throw new Error('--out <raw dir> is required');
  fs.mkdirSync(outDir, { recursive: true });
  const { prefixes, shots } = parseShotList(fs.readFileSync(SHOT_LIST, 'utf8'));
  const only = typeof arg('only') === 'string' ? new Set(arg('only').split(',')) : null;
  const selected = only ? shots.filter(shot => only.has(shot.id)) : shots;

  if (arg('webp')) return toWebp(selected, outDir);

  const { GoogleGenAI } = await import('@google/genai');
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not set');
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const force = Boolean(arg('force'));
  const todo = selected.filter(shot => force || !rawPath(outDir, shot.id));
  const concurrency = Number(arg('concurrency', 3)) || 3;
  // Shots without a reference first, so every reference exists before it is needed.
  const waves = [todo.filter(shot => !shot.ref), todo.filter(shot => shot.ref)];
  let cost = 0;
  for (const wave of waves) {
    for (let index = 0; index < wave.length; index += concurrency) {
      const batch = wave.slice(index, index + concurrency);
      const results = await Promise.allSettled(batch.map(shot => generate(ai, shot, prefixes, outDir)));
      results.forEach((result, position) => {
        if (result.status === 'fulfilled') {
          cost += result.value.cost_usd;
          console.log(`✓ ${result.value.id} (${(result.value.ms / 1000).toFixed(1)}s)`);
        } else {
          console.error(`✗ ${batch[position].id}: ${result.reason?.message ?? result.reason}`);
        }
      });
    }
  }
  console.log(`generated ${todo.length} shot(s), est. $${cost.toFixed(2)} this run`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
