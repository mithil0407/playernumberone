#!/usr/bin/env node
// Dry-run by default. This script never deletes source objects or changes bucket visibility.
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export const MARKETS = {
  stylist: { table: 'stylist_intake_responses', source: 'stylist-intake-photos', target: 'stylist-intake-private', fields: null },
  au: { table: 'au_intake_submissions', source: 'au-intake-photos', target: 'au-intake-private', fields: { photo_fullbody_url: 'photo_fullbody_path', photo_headshot_url: 'photo_headshot_path' } },
  globe: { table: 'globe_intake_submissions', source: 'globe-intake-photos', target: 'globe-intake-private', fields: { photo_fullbody_url: 'photo_fullbody_path', photo_headshot_url: 'photo_headshot_path' } },
  man: { table: 'man_intake_submissions', source: 'man-intake-photos', target: 'man-intake-private', fields: { photo_fullbody_url: 'photo_fullbody_path', photo_headshot_url: 'photo_headshot_path', photo_side_profile_url: 'photo_side_profile_path' } },
};

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function parseLegacyPhotoUrl(value, supabaseUrl, bucket) {
  if (typeof value !== 'string' || !value) return null;
  if (/%(?:2e|2f|5c)/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(supabaseUrl).origin) return null;
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || path.includes('\\') || path.split('/').some(segment => !segment || segment === '.' || segment === '..')) return null;
    return path;
  } catch { return null; }
}

export function destinationPath(bucket, sourcePath) {
  const digest = createHash('sha256').update(`${bucket}\0${sourcePath}`).digest('hex');
  const ext = /\.(jpe?g|png|webp|heic|heif)$/i.exec(sourcePath)?.[1]?.toLowerCase() || 'jpg';
  return `legacy/${digest}.${ext === 'jpeg' ? 'jpg' : ext}`;
}

function references(row, config, supabaseUrl) {
  if (!config.fields) {
    const photos = row.photo_urls && typeof row.photo_urls === 'object' && !Array.isArray(row.photo_urls) ? row.photo_urls : {};
    const savedOutfitPath = parseLegacyPhotoUrl(photos.one_outfit, supabaseUrl, config.source);
    const separateOutfitPath = parseLegacyPhotoUrl(row.one_outfit_image_url, supabaseUrl, config.source);
    if (savedOutfitPath && separateOutfitPath && savedOutfitPath !== separateOutfitPath) {
      throw new Error(`Stylist row ${row.id} has conflicting legacy outfit photo references`);
    }
    const values = { ...photos };
    if (!values.one_outfit && row.one_outfit_image_url) values.one_outfit = row.one_outfit_image_url;
    return Object.entries(values).flatMap(([key, url]) => {
      const sourcePath = parseLegacyPhotoUrl(url, supabaseUrl, config.source);
      return sourcePath ? [{ key, url, sourcePath, pathField: 'source_photo_paths' }] : [];
    });
  }
  return Object.entries(config.fields).flatMap(([urlField, pathField]) => {
    const url = row[urlField];
    const sourcePath = parseLegacyPhotoUrl(url, supabaseUrl, config.source);
    return sourcePath ? [{ key: urlField, url, sourcePath, pathField }] : [];
  });
}

function pendingReferenceCount(row, config, supabaseUrl) {
  return references(row, config, supabaseUrl).filter(ref => {
    const expected = `${config.target}/${destinationPath(config.source, ref.sourcePath)}`;
    const actual = config.fields ? row[ref.pathField] : row.source_photo_paths?.[ref.key];
    return actual !== expected;
  }).length;
}

async function fetchRows(client, table) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client.from(table).select('*').order('id').range(start, start + 499);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

async function assertPrivateBucket(client, bucket) {
  const { data, error } = await client.storage.getBucket(bucket);
  if (error || !data || data.public) throw new Error(`${bucket} must exist and be private before --apply`);
}

async function objectBytes(client, bucket, path) {
  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Object download failed in ${bucket}: ${error?.message || 'missing data'}`);
  return Buffer.from(await data.arrayBuffer());
}

async function copyAndVerify(client, config, sourcePath, targetPath) {
  const source = await objectBytes(client, config.source, sourcePath);
  const sourceHash = createHash('sha256').update(source).digest('hex');
  const { data: existing } = await client.storage.from(config.target).info(targetPath);
  if (!existing) {
    const { data: info, error: infoError } = await client.storage.from(config.source).info(sourcePath);
    if (infoError || !info) throw new Error(`Could not inspect source object in ${config.source}`);
    const contentType = info.metadata?.mimetype || info.metadata?.contentType || 'image/jpeg';
    if (!ALLOWED_TYPES.has(contentType)) throw new Error(`Unsupported source MIME type in ${config.source}`);
    const { error } = await client.storage.from(config.target).upload(targetPath, source, { contentType, upsert: false });
    if (error && !/already exists|duplicate|409/i.test(error.message)) throw new Error(`Private upload failed: ${error.message}`);
  }
  const target = await objectBytes(client, config.target, targetPath);
  const targetHash = createHash('sha256').update(target).digest('hex');
  if (sourceHash !== targetHash) throw new Error(`Private object checksum mismatch in ${config.target}`);
}

async function applyRow(client, config, plannedRow, supabaseUrl) {
  const { data: row, error } = await client.from(config.table).select('*').eq('id', plannedRow.id).single();
  if (error || !row) throw new Error(`${config.table} row changed or disappeared`);
  const refs = references(row, config, supabaseUrl);
  const original = references(plannedRow, config, supabaseUrl);
  if (JSON.stringify(refs) !== JSON.stringify(original)) return 'changed';
  const patch = {};
  if (!config.fields) patch.source_photo_paths = { ...(row.source_photo_paths || {}) };
  for (const ref of refs) {
    const targetPath = destinationPath(config.source, ref.sourcePath);
    const durable = `${config.target}/${targetPath}`;
    const previous = config.fields ? row[ref.pathField] : patch.source_photo_paths[ref.key];
    if (previous && previous !== durable) throw new Error(`${config.table} has conflicting private photo path`);
    await copyAndVerify(client, config, ref.sourcePath, targetPath);
    if (config.fields) patch[ref.pathField] = durable;
    else patch.source_photo_paths[ref.key] = durable;
  }
  if (!refs.length || (config.fields ? Object.keys(patch).length === 0 : JSON.stringify(patch.source_photo_paths) === JSON.stringify(row.source_photo_paths || {}))) return 'unchanged';
  const { error: updateError } = await client.from(config.table).update(patch).eq('id', row.id);
  if (updateError) throw new Error(`${config.table} path update failed: ${updateError.message}`);
  return 'updated';
}

export async function run(args = process.argv.slice(2), env = process.env) {
  const apply = args.includes('--apply');
  if (apply && !args.includes('--acknowledge-live-write')) throw new Error('--apply also requires --acknowledge-live-write');
  const marketArg = args.find(arg => arg.startsWith('--market='))?.slice('--market='.length);
  if (!marketArg || !MARKETS[marketArg]) throw new Error('Choose one market with --market=stylist|au|globe|man');
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const selected = [[marketArg, MARKETS[marketArg]]];
  for (const [market, config] of selected) {
    if (apply) await assertPrivateBucket(client, config.target);
    const rows = await fetchRows(client, config.table);
    const candidates = rows.filter(row => references(row, config, supabaseUrl).length);
    const refs = candidates.reduce((sum, row) => sum + references(row, config, supabaseUrl).length, 0);
    const pending = candidates.reduce((sum, row) => sum + pendingReferenceCount(row, config, supabaseUrl), 0);
    process.stdout.write(`${market}: ${rows.length} rows, ${candidates.length} rows with legacy photos, ${refs} photo references, ${pending} missing private paths\n`);
    if (!apply) continue;
    const tally = { updated: 0, unchanged: 0, changed: 0, failed: 0 };
    for (const row of candidates) {
      try { tally[await applyRow(client, config, row, supabaseUrl)]++; }
      catch (error) { tally.failed++; process.stderr.write(`${market} row ${row.id}: ${error.message}\n`); }
    }
    process.stdout.write(`${market} copy result: ${JSON.stringify(tally)}\n`);
    if (tally.failed || tally.changed) throw new Error(`${market} is incomplete; rerun after reviewing failures`);
  }
  if (!apply) process.stdout.write('DRY RUN ONLY. No objects or database rows were changed.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
