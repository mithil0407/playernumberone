/**
 * Tags the women's outfit library once (sleeves, neckline, length, co-ord,
 * fit, which shoes each look works with, occasions, colour families...) with
 * the operator's signed-in ChatGPT account (Codex CLI, gpt-6-sol on high).
 * Each call gets a few looks: the written look plus the picture Jazz swiped.
 *
 * Tags are saved to outfitlibrarytags.json after every batch, so a stopped run
 * resumes where it left off. Only looks Jazz kept are tagged unless --all.
 * A look whose text changed since it was tagged is tagged again.
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     --import ./scripts/node-test-hooks.mjs scripts/outfit-library-tags.mts \
 *     [--all] [--ids pinterest-1,pinterest-2] [--batch 6] [--limit N] [--redo] [--fix-only]
 *
 * --fix-only applies correctTagsFromWords to the saved tags without calling the model.
 *
 * Needs the sandbox off (Codex writes to ~/.codex).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { parseVerbatimLooks, type VerbatimLook } from '../src/lib/stylistPinterestOutfits.ts';
import { TAG_GUIDE, correctTagsFromWords, lookTextHash, parseOutfitLookTags, type OutfitTagFile } from '../src/lib/stylistOutfitTags.ts';
import { CodexUnavailableError, runCodex } from '../src/lib/codexRunner.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const IMAGE_DIR = process.env.OUTFIT_LIBRARY_IMAGE_DIR || '/Users/navalakhaarts/playernumberone/outputs/outfit-library-images';
const TAG_FILE = join(process.cwd(), 'outfitlibrarytags.json');
const BATCH = Math.max(1, Number(option('batch')) || 6);
const LIMIT = option('limit') === undefined ? Infinity : Number(option('limit'));
const ONLY_IDS = option('ids')?.split(',').map(id => id.trim()).filter(Boolean);

const log = (...parts: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...parts);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const tags: OutfitTagFile = existsSync(TAG_FILE) ? JSON.parse(readFileSync(TAG_FILE, 'utf8')) : {};
const save = () => {
  const sorted = Object.fromEntries(Object.entries(tags).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  writeFileSync(TAG_FILE, `${JSON.stringify(sorted, null, 1)}\n`);
};

async function keptIds(): Promise<Set<string> | null> {
  if (flag('all')) return null;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const slug = process.env.STYLIST_OUTFIT_CURATOR_SLUG?.trim() || 'jazz';
  const { data: curator, error } = await db.from('stylists').select('id').eq('slug', slug).single();
  if (error || !curator) throw new Error(`Curator ${slug} not found`);
  const votes = await db.from('stylist_outfit_library_votes').select('look_id, verdict').eq('stylist_id', curator.id);
  if (votes.error) throw votes.error;
  return new Set((votes.data ?? []).filter(row => row.verdict === 'like').map(row => row.look_id as string));
}

const imageFiles = readdirSync(IMAGE_DIR).filter(name => name.endsWith('.jpg'));
/** The newest picture of this look; "pinterest-1-" never matches "pinterest-13-". */
function pictureOf(look: VerbatimLook) {
  const files = imageFiles
    .filter(name => name.startsWith(`${look.id}-`))
    .map(name => join(IMAGE_DIR, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] ?? null;
}

function lookText(look: VerbatimLook) {
  return [
    look.dress ? `dress/one-piece: ${look.dress}` : `top: ${look.top ?? ''}`,
    look.layer ? `layer: ${look.layer}` : '',
    look.bottom ? `bottom: ${look.bottom}` : '',
    `shoes: ${look.shoes ?? 'not shown'}`,
    look.accessories ? `accessories: ${look.accessories}` : '',
    look.styling ? `styling: ${look.styling}` : '',
  ].filter(Boolean).join('\n  ');
}

async function tagBatch(batch: Array<{ look: VerbatimLook; picture: string | null }>) {
  const images = [];
  const lines: string[] = [];
  for (const { look, picture } of batch) {
    let pictureNote = 'no picture';
    if (picture) {
      const jpeg = await sharp(picture).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      images.push({ data: jpeg.toString('base64'), mimeType: 'image/jpeg' });
      pictureNote = `picture ${images.length}`;
    }
    lines.push(`id: ${look.id} (${pictureNote})\n  ${lookText(look)}`);
  }
  const prompt = `You are a senior Indian personal stylist tagging outfits in our library so a recommendation engine can match them to clients exactly. Each outfit has a written description and a studio picture of it (attached in the same order). The written description is the outfit we recommend; use the picture to judge fit, length, sleeves and how it reads, and report any difference in picture_mismatch.

${TAG_GUIDE}

Outfits:
${lines.join('\n\n')}

Return only JSON, no commentary: {"looks":[{"id":"<id>","wear":"...","type":"...","sleeves":"...","arms_covered_by_layer":false,"neckline":"...","open_back":false,"length":"...","bottom":"...","fit":"...","slit":"...","sheer":false,"midriff":false,"tuck":"...","layer":"...","shoes":{"shown":"...","flats_ok":true,"low_heel_ok":true},"occasions":["..."],"formality":"...","print":"...","colours":{"main":["..."],"lead_family":"...","families":["..."]},"shine":false,"fabrics":["..."],"winter":false,"body":{"tummy_friendly":true,"hip_friendly":true,"arms_friendly":false,"petite_friendly":true},"has_jewellery":false,"has_eyewear":false,"has_bag":false,"complete":true,"picture_mismatch":"","note":""}]} with one entry per outfit above.`;

  const result = await runCodex({ prompt, images, output: 'text', reasoningEffort: 'high', timeoutMs: 12 * 60_000, label: batch.map(item => item.look.id).join(',') });
  const json = result.text.slice(result.text.indexOf('{'), result.text.lastIndexOf('}') + 1);
  const parsed = JSON.parse(json) as { looks?: Array<Record<string, unknown>> };
  const failed: VerbatimLook[] = [];
  for (const { look } of batch) {
    const entry = parsed.looks?.find(item => item.id === look.id);
    try {
      tags[look.id] = correctTagsFromWords(look, parseOutfitLookTags(entry, lookTextHash(look))).tags;
    } catch (error) {
      log(`${look.id}: ${(error as Error).message}`);
      failed.push(look);
    }
  }
  return { failed, seconds: Math.round(result.durationMs / 1000) };
}

if (flag('fix-only')) {
  let changed = 0;
  for (const look of parseVerbatimLooks(readFileSync(join(process.cwd(), 'outfitlibrary.md'), 'utf8'))) {
    const current = tags[look.id];
    if (!current || current.look_hash !== lookTextHash(look)) continue;
    const { tags: fixed, changes } = correctTagsFromWords(look, current);
    if (!changes.length) continue;
    tags[look.id] = fixed;
    changed += 1;
    log(`${look.id}: ${changes.join('; ')}`);
  }
  save();
  log(`corrected ${changed} looks`);
  process.exit(0);
}

const kept = await keptIds();
const todo = parseVerbatimLooks(readFileSync(join(process.cwd(), 'outfitlibrary.md'), 'utf8'))
  .filter(look => !kept || kept.has(look.id))
  .filter(look => !ONLY_IDS || ONLY_IDS.includes(look.id))
  .filter(look => flag('redo') || tags[look.id]?.look_hash !== lookTextHash(look))
  .slice(0, LIMIT)
  .map(look => ({ look, picture: pictureOf(look) }));

log(`${todo.length} looks to tag in batches of ${BATCH}${kept ? ` (kept by the curator: ${kept.size})` : ''}`);
let done = 0;
const queue = [...todo];
const retries = new Map<string, number>();
async function worker() {
  while (queue.length) {
    const batch = queue.splice(0, BATCH);
    try {
      const { failed, seconds } = await tagBatch(batch);
      done += batch.length - failed.length;
      save();
      log(`tagged ${done}/${todo.length} (${seconds}s)`);
      for (const look of failed) {
        const count = (retries.get(look.id) ?? 0) + 1;
        retries.set(look.id, count);
        if (count <= 2) queue.push({ look, picture: pictureOf(look) });
      }
    } catch (error) {
      if (error instanceof CodexUnavailableError) {
        log(`${error.message.slice(0, 160)} — waiting ${Math.round(error.retryAfterMs / 60_000)} min`);
        queue.unshift(...batch);
        await sleep(error.retryAfterMs);
        continue;
      }
      log(`batch ${batch.map(item => item.look.id).join(',')} failed: ${(error as Error).message.slice(0, 200)}`);
      for (const item of batch) {
        const count = (retries.get(item.look.id) ?? 0) + 1;
        retries.set(item.look.id, count);
        if (count <= 2) queue.push(item);
      }
    }
  }
}
await Promise.all(Array.from({ length: Math.max(1, Number(option('concurrency')) || 3) }, worker));
save();
const missing = todo.filter(({ look }) => tags[look.id]?.look_hash !== lookTextHash(look)).map(({ look }) => look.id);
log(`finished: ${todo.length - missing.length} tagged${missing.length ? `, not tagged: ${missing.join(', ')}` : ''}`);
