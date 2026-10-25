import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKETS = { au: 'au-intake-private', globe: 'globe-intake-private' } as const;

type PhotoRow = {
  photo_fullbody_url?: string | null;
  photo_headshot_url?: string | null;
  photo_fullbody_path?: string | null;
  photo_headshot_path?: string | null;
};

export async function resolveMarketIntakePhotos<T extends PhotoRow>(row: T, market: keyof typeof BUCKETS): Promise<T> {
  const bucket = BUCKETS[market];
  const signed = { ...row };
  for (const [urlKey, pathKey] of [
    ['photo_fullbody_url', 'photo_fullbody_path'],
    ['photo_headshot_url', 'photo_headshot_path'],
  ] as const) {
    const stored = row[pathKey];
    if (!stored) continue;
    if (!stored.startsWith(`${bucket}/`)) throw new Error('Invalid private intake photo path');
    const path = stored.slice(bucket.length + 1);
    if (!path || path.includes('..') || path.includes('\\') || path.startsWith('/')) throw new Error('Invalid private intake photo path');
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 2 * 60 * 60);
    if (error || !data?.signedUrl) throw error || new Error('Could not sign private intake photo');
    signed[urlKey] = data.signedUrl;
  }
  return signed;
}
