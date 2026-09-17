import 'server-only';

import sharp from 'sharp';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from './supabase';

/**
 * Serving report images to readers. Originals are 1024x1536 photos (~365 KB)
 * shown at about half that size, and each request used to sign a fresh URL
 * against the storage API. Readers now get a 1200px WebP copy made once and
 * kept in storage, behind a signed URL that is reused while it is still valid.
 */
const BUCKET = 'stylist-blueprint-images';
const SIGNED_URL_SECONDS = 60 * 60;
/** A cached signed URL is handed out only while it has at least this long left. */
const MIN_REMAINING_MS = 15 * 60_000;
const DISPLAY_WIDTH = 1200;

export function stylistBlueprintDisplayVariantPath(path: string) {
  const [reportId, ...rest] = path.replace(/\.[a-z0-9]+$/i, '').split('/');
  return `${reportId}/display-v1/${rest.join('/')}.webp`;
}

async function sign(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

async function createDisplayVariant(path: string, variant: string) {
  const { data: original, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !original) return false;
  const webp = await sharp(Buffer.from(await original.arrayBuffer()), { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: DISPLAY_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(variant, webp, {
    contentType: 'image/webp', upsert: true, cacheControl: '31536000',
  });
  return !uploadError;
}

async function signDisplayImage(path: string) {
  const variant = stylistBlueprintDisplayVariantPath(path);
  let url = await sign(variant);
  if (!url) {
    try {
      if (await createDisplayVariant(path, variant)) url = await sign(variant);
    } catch (error) {
      console.error('[stylist-blueprint] display image variant failed', error);
    }
  }
  // Serving the original is slower but always correct.
  url ??= await sign(path);
  return url ? { url, expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000 } : null;
}

/** A signed URL for the reader-sized copy of a stored report image. */
export async function getStylistBlueprintDisplayImage(path: string) {
  const cached = await unstable_cache(
    () => signDisplayImage(path),
    ['stylist-blueprint-display-image-v1', path],
    { revalidate: 20 * 60 },
  )();
  if (cached && cached.expiresAt - Date.now() > MIN_REMAINING_MS) return cached;
  return signDisplayImage(path);
}
