/**
 * Draws one studio picture per women's library look with the operator's
 * signed-in ChatGPT account (Codex CLI), then uploads them for Jazz's swipe
 * review at /stylist/<slug>/outfit-review.
 *
 * Pictures are kept on this Mac first, so a long run survives restarts, usage
 * limits and a database that is not ready yet. Re-running only draws what is
 * missing or stale (the look's words or the prompt changed) and uploads what
 * the database does not have.
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     --import ./scripts/node-test-hooks.mjs scripts/outfit-library-images.mts \
 *     [--limit N] [--ids pinterest-1,pinterest-2] [--upload-only] [--no-upload] [--concurrency 3]
 *
 * Needs the sandbox off (Codex writes to ~/.codex).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { parseVerbatimLooks, type VerbatimLook } from '../src/lib/stylistPinterestOutfits.ts';
import {
  OUTFIT_LIBRARY_IMAGE_BUCKET,
  OUTFIT_LIBRARY_IMAGE_PROMPT_VERSION,
  buildOutfitLibraryImagePrompt,
  isReviewableLook,
  outfitLibraryImageHash,
} from '../src/lib/stylistOutfitLibraryReview.ts';
import { CodexUnavailableError, runCodex } from '../src/lib/codexRunner.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const CACHE_DIR = process.env.OUTFIT_LIBRARY_IMAGE_DIR || '/Users/navalakhaarts/playernumberone/outputs/outfit-library-images';
const CONCURRENCY = Math.max(1, Number(option('concurrency')) || 3);
const LIMIT = option('limit') === undefined ? Infinity : Number(option('limit'));
const ONLY_IDS = option('ids')?.split(',').map(id => id.trim()).filter(Boolean);
const UPLOAD_ONLY = flag('upload-only');
const NO_UPLOAD = flag('no-upload');

mkdirSync(CACHE_DIR, { recursive: true });

const log = (...parts: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...parts);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Interleave the library so the first pictures Jazz sees are a mix of capsules.
const order = (id: string) => createHash('sha1').update(`order:${id}`).digest('hex');
const looks: VerbatimLook[] = parseVerbatimLooks(readFileSync(join(process.cwd(), 'outfitlibrary.md'), 'utf8'))
  .filter(isReviewableLook)
  .filter(look => !ONLY_IDS || ONLY_IDS.includes(look.id))
  .sort((a, b) => order(a.id).localeCompare(order(b.id)));

const fileFor = (look: VerbatimLook) => join(CACHE_DIR, `${look.id}-${outfitLibraryImageHash(look)}.jpg`);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) : null;

let uploadsReady: boolean | null = null;
const uploaded = new Map<string, string>();

async function loadUploaded() {
  if (NO_UPLOAD || !db) { uploadsReady = false; return; }
  const { data, error } = await db.from('stylist_outfit_library_images').select('look_id, look_hash');
  if (error) {
    uploadsReady = false;
    log(`Uploads paused, pictures stay on this Mac (${error.message}). Re-run with --upload-only once the database is ready.`);
    return;
  }
  uploadsReady = true;
  for (const row of data ?? []) uploaded.set(row.look_id, row.look_hash);
}

let lastCheck = Date.now();
async function upload(look: VerbatimLook) {
  // A long run picks uploads up by itself once the database is ready.
  if (!uploadsReady && !NO_UPLOAD && Date.now() - lastCheck > 10 * 60_000) {
    lastCheck = Date.now();
    await loadUploaded();
    if (uploadsReady) log('Uploads are on now; earlier pictures upload with --upload-only.');
  }
  if (!uploadsReady || !db) return false;
  const hash = outfitLibraryImageHash(look);
  if (uploaded.get(look.id) === hash) return true;
  const storagePath = `looks/${look.id}-${hash}.jpg`;
  const { error: storageError } = await db.storage.from(OUTFIT_LIBRARY_IMAGE_BUCKET)
    .upload(storagePath, readFileSync(fileFor(look)), { contentType: 'image/jpeg', upsert: true });
  if (storageError) throw new Error(`upload ${look.id}: ${storageError.message}`);
  const { error } = await db.from('stylist_outfit_library_images').upsert({
    look_id: look.id,
    storage_path: storagePath,
    look_hash: hash,
    prompt_version: OUTFIT_LIBRARY_IMAGE_PROMPT_VERSION,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`record ${look.id}: ${error.message}`);
  uploaded.set(look.id, hash);
  return true;
}

async function draw(look: VerbatimLook) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const result = await runCodex({ prompt: buildOutfitLibraryImagePrompt(look), output: 'image', timeoutMs: 8 * 60_000, label: look.id });
      const jpeg = await sharp(Buffer.from(result.image!.data, 'base64'))
        .resize({ width: 900, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      writeFileSync(fileFor(look), jpeg);
      return Math.round(result.durationMs / 1000);
    } catch (error) {
      if (error instanceof CodexUnavailableError) {
        log(`${look.id}: ${error.message.slice(0, 160)} — waiting ${Math.round(error.retryAfterMs / 60_000)} min`);
        await sleep(error.retryAfterMs);
        continue;
      }
      if (attempt >= 3) throw error;
      log(`${look.id}: attempt ${attempt} failed (${String(error).slice(0, 160)}), retrying`);
      await sleep(10_000 * attempt);
    }
  }
}

await loadUploaded();
const todo = looks.slice(0, LIMIT);
const missing = todo.filter(look => !existsSync(fileFor(look)));
log(`${looks.length} reviewable looks; ${todo.length - missing.length} pictures already on this Mac; ${UPLOAD_ONLY ? 0 : missing.length} to draw; uploads ${uploadsReady ? 'on' : 'off'}.`);

let done = 0;
let failed = 0;
const queue = [...todo];
async function worker() {
  for (let look = queue.shift(); look; look = queue.shift()) {
    try {
      if (!existsSync(fileFor(look))) {
        if (UPLOAD_ONLY) continue;
        const seconds = await draw(look);
        done += 1;
        log(`drew ${look.id} in ${seconds}s (${done}/${missing.length})`);
      }
      await upload(look);
    } catch (error) {
      failed += 1;
      log(`FAILED ${look.id}: ${String(error).slice(0, 300)}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
log(`Finished: ${done} drawn, ${failed} failed, ${uploaded.size} uploaded in total.`);
