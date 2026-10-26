import 'server-only';

import { randomUUID } from 'crypto';
import { supabaseAdmin } from './supabase';
import { CLIENT_UPLOAD_PHOTOS, type ClientUploadPhotoKey } from './consultationMeasurements';

// Photos go straight from the client's phone to this private bucket through
// one-time signed upload URLs. Nobody but the server can list or read it.
export const CLIENT_UPLOAD_BUCKET = 'consultation-client-uploads';
export const CLIENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const MAX_OBJECTS_PER_LINK = 24;

export const CLIENT_UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export type UploadLinkState =
  | { state: 'invalid' }
  | { state: 'expired' | 'submitted' | 'ready'; linkId: string; consultationId: string; stylistId: string | null; firstName: string; expiresAt: string; submittedAt: string | null };

export function isClientUploadToken(token: unknown): token is string {
  return typeof token === 'string' && /^[a-f0-9]{48}$/.test(token);
}

export function isClientUploadPhotoKey(value: unknown): value is ClientUploadPhotoKey {
  return CLIENT_UPLOAD_PHOTOS.some(photo => photo.key === value);
}

export function clientUploadPathPattern(token: string, key: ClientUploadPhotoKey) {
  return new RegExp(`^${token}/${key}-[0-9]{13}-[a-f0-9]{8}\\.(?:jpg|png|webp|heic|heif)$`);
}

export async function loadClientUploadLink(token: unknown): Promise<UploadLinkState> {
  if (!isClientUploadToken(token)) return { state: 'invalid' };
  const { data, error } = await supabaseAdmin
    .from('consultation_upload_links')
    .select('id, consultation_id, expires_at, submitted_at, locked_at, consultations(client_name, stylist_id)')
    .eq('token', token)
    .maybeSingle();
  if (error) throw new Error('Could not load upload link');
  if (!data) return { state: 'invalid' };
  const consultation = (Array.isArray(data.consultations) ? data.consultations[0] : data.consultations) as { client_name?: string | null; stylist_id?: string | null } | null;
  const firstName = (consultation?.client_name || '').trim().split(/\s+/)[0] || '';
  const base = {
    linkId: data.id as string,
    consultationId: data.consultation_id as string,
    stylistId: consultation?.stylist_id ?? null,
    firstName,
    expiresAt: data.expires_at as string,
    submittedAt: data.submitted_at as string | null,
  };
  if (data.locked_at || data.submitted_at) return { state: 'submitted', ...base };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { state: 'expired', ...base };
  return { state: 'ready', ...base };
}

export async function prepareClientPhotoUpload(token: string, key: ClientUploadPhotoKey, contentType: string) {
  const extension = CLIENT_UPLOAD_TYPES[contentType];
  if (!extension) throw new Error('Use a JPG, PNG, WEBP or HEIC photo.');
  const { data: existing, error: listError } = await supabaseAdmin.storage.from(CLIENT_UPLOAD_BUCKET).list(token, { limit: MAX_OBJECTS_PER_LINK + 1 });
  if (listError) throw new Error('Could not prepare the upload');
  if ((existing?.length ?? 0) >= MAX_OBJECTS_PER_LINK) throw new Error('Too many photos were tried on this link. Please message your stylist.');
  const path = `${token}/${key}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const { data, error } = await supabaseAdmin.storage.from(CLIENT_UPLOAD_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) throw new Error('Could not prepare the upload');
  return { path, uploadToken: data.token };
}

export async function clientUploadExists(token: string, path: string) {
  const name = path.slice(token.length + 1);
  const { data, error } = await supabaseAdmin.storage.from(CLIENT_UPLOAD_BUCKET).list(token, { search: name, limit: 5 });
  if (error) return false;
  return Boolean(data?.some(item => item.name === name && Number(item.metadata?.size ?? 0) > 0));
}
