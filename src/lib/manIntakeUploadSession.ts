import crypto from 'crypto';
import { supabaseAdmin } from './supabase.ts';
import {
  getManIntakePhotoContentType,
  getManIntakePhotoExtension,
  getManIntakePhotoFingerprintSource,
  getManIntakePhotoValidationError,
  MAN_INTAKE_MAX_PHOTO_BYTES,
  MAN_INTAKE_PHOTO_TYPES,
} from './manIntakePhoto.ts';

export const MAN_INTAKE_PHOTO_BUCKET = 'man-intake-photos';
export const MAN_INTAKE_UPLOAD_SESSION_TTL_MS = 48 * 60 * 60 * 1_000;

export const MAN_INTAKE_PHOTO_KINDS = ['fullbody', 'headshot', 'side_profile'] as const;
export type ManIntakePhotoKind = (typeof MAN_INTAKE_PHOTO_KINDS)[number];

export interface ManIntakeUploadDescriptor {
  kind: ManIntakePhotoKind;
  name: string;
  size: number;
  type: string;
  last_modified: number;
}

export interface ManIntakeUploadManifestEntry {
  kind: ManIntakePhotoKind;
  path: string;
  size: number;
  content_type: string;
  fingerprint: string;
}

export type ManIntakeUploadManifest = Partial<Record<ManIntakePhotoKind, ManIntakeUploadManifestEntry>>;

export interface ManIntakeUploadSessionRow {
  id: string;
  token_hash: string;
  status: 'active' | 'submitted' | 'expired';
  photo_manifest: ManIntakeUploadManifest;
  diagnostics: Record<string, unknown>;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

const PHOTO_KIND_SET = new Set<string>(MAN_INTAKE_PHOTO_KINDS);
const EVENT_SET = new Set(['prepared', 'started', 'resumed', 'succeeded', 'failed', 'submitted']);

export function isManIntakePhotoKind(value: unknown): value is ManIntakePhotoKind {
  return typeof value === 'string' && PHOTO_KIND_SET.has(value);
}

export function hashManIntakeUploadToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createManIntakeUploadToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function readBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

export function isManIntakeUploadSessionExpired(expiresAt: string, now = Date.now()): boolean {
  const expiry = new Date(expiresAt).getTime();
  return !Number.isFinite(expiry) || expiry <= now;
}

export function getManIntakeUploadFingerprint(descriptor: ManIntakeUploadDescriptor): string {
  return crypto.createHash('sha256').update(getManIntakePhotoFingerprintSource(descriptor)).digest('hex');
}

export function isManIntakeSessionPhotoPath(sessionId: string, path: string): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || path.includes('..')) return false;
  const escapedSessionId = sessionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^public/man-intake-sessions/${escapedSessionId}/(fullbody|headshot|side_profile)-[0-9a-f-]{36}\\.(jpg|png|heic|heif)$`,
    'i',
  ).test(path);
}

export function validateManIntakeUploadDescriptor(input: unknown):
  | { ok: true; data: ManIntakeUploadDescriptor & { extension: string; content_type: string; fingerprint: string } }
  | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid photo descriptor.' };
  const raw = input as Record<string, unknown>;
  if (!isManIntakePhotoKind(raw.kind)) return { ok: false, error: 'Invalid photo kind.' };

  const descriptor: ManIntakeUploadDescriptor = {
    kind: raw.kind,
    name: typeof raw.name === 'string' ? raw.name.slice(0, 255) : '',
    size: Number(raw.size),
    type: typeof raw.type === 'string' ? raw.type : '',
    last_modified: Number(raw.last_modified),
  };

  if (!Number.isSafeInteger(descriptor.size) || descriptor.size <= 0
    || !Number.isSafeInteger(descriptor.last_modified) || descriptor.last_modified < 0) {
    return { ok: false, error: `Invalid ${descriptor.kind} photo metadata.` };
  }
  const validationError = getManIntakePhotoValidationError(descriptor);
  if (validationError) return { ok: false, error: validationError };

  const extension = getManIntakePhotoExtension(descriptor);
  const contentType = getManIntakePhotoContentType(descriptor);
  if (!extension || !contentType) return { ok: false, error: 'Unsupported photo type.' };

  return {
    ok: true,
    data: {
      ...descriptor,
      extension,
      content_type: contentType,
      fingerprint: getManIntakeUploadFingerprint(descriptor),
    },
  };
}

function safeManifest(value: unknown): ManIntakeUploadManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ManIntakeUploadManifest;
}

export async function loadManIntakeUploadSession(
  sessionId: string,
  token: string,
  options: { allowSubmitted?: boolean } = {},
): Promise<ManIntakeUploadSessionRow> {
  if (!sessionId || !token) throw new Error('Missing upload session credentials.');
  const { data, error } = await supabaseAdmin
    .from('man_intake_upload_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) throw new Error('Upload session was not found.');
  const row = { ...data, photo_manifest: safeManifest(data.photo_manifest) } as ManIntakeUploadSessionRow;
  const supplied = Buffer.from(hashManIntakeUploadToken(token));
  const expected = Buffer.from(row.token_hash || '');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw new Error('Upload session credentials are invalid.');
  }
  if (row.status === 'submitted' && options.allowSubmitted) return row;
  if (row.status !== 'active' || isManIntakeUploadSessionExpired(row.expires_at)) {
    throw new Error('Upload session has expired.');
  }
  return row;
}

export async function getManifestEntryStatus(entry: ManIntakeUploadManifestEntry): Promise<{
  completed: boolean;
  size: number | null;
  content_type: string | null;
  error?: string;
}> {
  const { data, error } = await supabaseAdmin.storage.from(MAN_INTAKE_PHOTO_BUCKET).info(entry.path);
  if (error || !data) return { completed: false, size: null, content_type: null };

  const size = typeof data.size === 'number' ? data.size : null;
  const contentType = typeof data.contentType === 'string' ? data.contentType.toLowerCase() : null;
  const metadataError = getManIntakeStoredPhotoMetadataError(entry, { size, content_type: contentType });
  return {
    completed: metadataError === null,
    size,
    content_type: contentType,
    ...(metadataError ? { error: metadataError } : {}),
  };
}

export function getManIntakeStoredPhotoMetadataError(
  entry: Pick<ManIntakeUploadManifestEntry, 'size' | 'content_type'>,
  stored: { size: number | null; content_type: string | null },
): string | null {
  if (stored.size !== entry.size) return 'Stored photo size does not match the selected file.';
  const normalizedExpectedType = entry.content_type === 'image/jpg' ? 'image/jpeg' : entry.content_type;
  const normalizedStoredType = stored.content_type === 'image/jpg' ? 'image/jpeg' : stored.content_type;
  const typeMatches = Boolean(
    normalizedStoredType
    && MAN_INTAKE_PHOTO_TYPES.has(normalizedStoredType)
    && normalizedStoredType === normalizedExpectedType,
  );
  return typeMatches ? null : 'Stored photo type does not match the selected file.';
}

export async function prepareManIntakeUploads(input: {
  sessionId?: string;
  token?: string;
  files: unknown[];
}) {
  if (!Array.isArray(input.files) || input.files.length < 1 || input.files.length > 3) {
    throw new Error('Choose between one and three intake photos.');
  }

  const parsed = input.files.map(validateManIntakeUploadDescriptor);
  const invalid = parsed.find((item) => !item.ok);
  if (invalid && !invalid.ok) throw new Error(invalid.error);
  const files = parsed.flatMap((item) => item.ok ? [item.data] : []);
  if (new Set(files.map((file) => file.kind)).size !== files.length) {
    throw new Error('Each intake photo kind may only be prepared once.');
  }

  let sessionId = input.sessionId;
  let sessionToken = input.token;
  let manifest: ManIntakeUploadManifest = {};
  const pathsToRemove: string[] = [];

  if (sessionId || sessionToken) {
    const row = await loadManIntakeUploadSession(sessionId || '', sessionToken || '');
    sessionId = row.id;
    manifest = row.photo_manifest;
  } else {
    sessionId = crypto.randomUUID();
    sessionToken = createManIntakeUploadToken();
  }

  for (const file of files) {
    const existing = manifest[file.kind];
    if (existing && existing.fingerprint !== file.fingerprint) pathsToRemove.push(existing.path);
    if (!existing || existing.fingerprint !== file.fingerprint) {
      manifest[file.kind] = {
        kind: file.kind,
        path: `public/man-intake-sessions/${sessionId}/${file.kind}-${crypto.randomUUID()}.${file.extension}`,
        size: file.size,
        content_type: file.content_type,
        fingerprint: file.fingerprint,
      };
    }
  }

  const expiresAt = new Date(Date.now() + MAN_INTAKE_UPLOAD_SESSION_TTL_MS).toISOString();
  const now = new Date().toISOString();
  if (pathsToRemove.length > 0) {
    const { error } = await supabaseAdmin.storage.from(MAN_INTAKE_PHOTO_BUCKET).remove(pathsToRemove);
    if (error) throw new Error(`Could not replace the selected photo: ${error.message}`);
  }

  if (input.sessionId) {
    const { error } = await supabaseAdmin.from('man_intake_upload_sessions').update({
      photo_manifest: manifest,
      expires_at: expiresAt,
      updated_at: now,
    }).eq('id', sessionId);
    if (error) throw new Error(`Could not update upload session: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin.from('man_intake_upload_sessions').insert([{
      id: sessionId,
      token_hash: hashManIntakeUploadToken(sessionToken!),
      photo_manifest: manifest,
      expires_at: expiresAt,
      updated_at: now,
    }]);
    if (error) throw new Error(`Could not create upload session: ${error.message}`);
  }

  const uploads = await Promise.all(files.map(async (file) => {
    const entry = manifest[file.kind]!;
    const status = await getManifestEntryStatus(entry);
    if (status.completed) return { ...entry, completed: true, signed_token: null };

    const { data, error } = await supabaseAdmin.storage
      .from(MAN_INTAKE_PHOTO_BUCKET)
      .createSignedUploadUrl(entry.path, { upsert: false });
    if (error || !data?.token) throw new Error(`Could not prepare ${file.kind} upload: ${error?.message || 'No token returned'}`);
    return { ...entry, completed: false, signed_token: data.token };
  }));

  return {
    session: { id: sessionId, token: sessionToken!, expires_at: expiresAt },
    uploads,
  };
}

export async function getManIntakeUploadStatuses(session: ManIntakeUploadSessionRow) {
  const entries = Object.values(session.photo_manifest).filter(Boolean) as ManIntakeUploadManifestEntry[];
  const statuses = await Promise.all(entries.map(async (entry) => ({
    kind: entry.kind,
    path: entry.path,
    fingerprint: entry.fingerprint,
    expected_size: entry.size,
    expected_content_type: entry.content_type,
    ...(await getManifestEntryStatus(entry)),
  })));
  return statuses;
}

export function normalizeManIntakeUploadError(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value || 'unknown');
  if (/network|load failed|fetch|offline/i.test(text)) return 'network';
  if (/timed? ?out|timeout/i.test(text)) return 'timeout';
  if (/401|403|signature|unauthor/i.test(text)) return 'authorization';
  if (/409|conflict|already exists/i.test(text)) return 'conflict';
  if (/5\d\d|server/i.test(text)) return 'storage_server';
  return 'unknown';
}

export async function recordManIntakeUploadEvent(input: {
  session: ManIntakeUploadSessionRow;
  event: unknown;
  kind?: unknown;
  bytes?: unknown;
  durationMs?: unknown;
  attempt?: unknown;
  errorCode?: unknown;
}) {
  if (typeof input.event !== 'string' || !EVENT_SET.has(input.event)) throw new Error('Invalid upload event.');
  const kind = isManIntakePhotoKind(input.kind) ? input.kind : 'session';
  const diagnostic = {
    event: input.event,
    bytes: Math.max(0, Math.min(Number(input.bytes) || 0, MAN_INTAKE_MAX_PHOTO_BYTES)),
    duration_ms: Math.max(0, Math.min(Number(input.durationMs) || 0, 60 * 60 * 1_000)),
    attempt: Math.max(0, Math.min(Number(input.attempt) || 0, 20)),
    error_code: typeof input.errorCode === 'string' ? input.errorCode.slice(0, 40) : null,
    at: new Date().toISOString(),
  };
  const diagnostics = { ...(input.session.diagnostics || {}), [kind]: diagnostic };
  const { error } = await supabaseAdmin.from('man_intake_upload_sessions').update({
    diagnostics,
    updated_at: diagnostic.at,
  }).eq('id', input.session.id);
  if (error) throw new Error(`Could not record upload event: ${error.message}`);
  console.info('man_intake_upload_event', { sessionId: input.session.id, kind, ...diagnostic });
}
