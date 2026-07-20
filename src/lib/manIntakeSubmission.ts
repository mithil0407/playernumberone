export const MAN_INTAKE_FIELDS = [
  'customer_email',
  'customer_phone',
  'photo_fullbody_url',
  'photo_headshot_url',
  'photo_side_profile_url',
  'primary_goal',
  'style_relationship',
  'dressing_context',
  'location_tier',
  'height_category',
  'body_shape',
  'fat_storage_zone',
  'highlight_zone',
  'minimise_zone',
  'fit_preference',
  'wardrobe_composition',
  'skin_tone',
  'vein_undertone',
  'white_test',
  'hair_colour',
  'eye_colour',
  'derived_colour_season',
  'face_shape',
  'facial_feature_type',
  'primary_style_goal',
  'branch_answer',
  'style_tribes',
  'style_pole_structure',
  'style_pole_expression',
  'style_pole_tone',
  'style_pole_register',
  'style_blocker',
  'style_anti_pref',
  'style_anti_pref_note',
  'free_text_note',
] as const;

export type ManIntakeField = (typeof MAN_INTAKE_FIELDS)[number];
export type SanitizedManIntakeSubmission = Partial<Record<ManIntakeField, string>> & {
  customer_email: string;
  photo_fullbody_url: string;
  photo_headshot_url: string;
};

export type ManIntakeValidationResult =
  | { ok: true; data: SanitizedManIntakeSubmission }
  | { ok: false; error: string };

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type InsertResult<T> = { data: T | null; error: DatabaseError | null };

const FIELD_SET = new Set<string>(MAN_INTAKE_FIELDS);
const REQUIRED_FIELDS = ['customer_email', 'photo_fullbody_url', 'photo_headshot_url'] as const;
const PHOTO_FIELDS = ['photo_fullbody_url', 'photo_headshot_url', 'photo_side_profile_url'] as const;
const MAX_TEXT_LENGTH = 2_000;
const MAX_NOTE_LENGTH = 200;
const MAX_URL_LENGTH = 2_048;
const PHOTO_BUCKET_PATH = '/storage/v1/object/public/man-intake-photos/';
const RECENT_UPLOAD_WINDOW_MS = 60 * 60 * 1_000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function storageOrigin(supabaseUrl: string): string | null {
  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
}

export function getManIntakePhotoPath(value: string, supabaseUrl: string): string | null {
  const expectedOrigin = storageOrigin(supabaseUrl);
  if (!expectedOrigin) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== expectedOrigin) return null;
    if (!url.pathname.startsWith(PHOTO_BUCKET_PATH)) return null;

    const path = decodeURIComponent(url.pathname.slice(PHOTO_BUCKET_PATH.length));
    if (!path.startsWith('public/') || path.includes('..')) return null;
    return path;
  } catch {
    return null;
  }
}

export function validateManIntakeSubmission(
  input: unknown,
  supabaseUrl: string,
): ManIntakeValidationResult {
  if (!isPlainObject(input)) {
    return { ok: false, error: 'The intake payload must be an object.' };
  }

  const unexpectedFields = Object.keys(input).filter((field) => !FIELD_SET.has(field));
  if (unexpectedFields.length > 0) {
    return { ok: false, error: `Unexpected intake field: ${unexpectedFields[0]}` };
  }

  const sanitized: Partial<Record<ManIntakeField, string>> = {};
  for (const field of MAN_INTAKE_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      return { ok: false, error: `${field} must be a string.` };
    }

    const trimmed = value.trim();
    const maxLength = PHOTO_FIELDS.includes(field as (typeof PHOTO_FIELDS)[number])
      ? MAX_URL_LENGTH
      : field === 'free_text_note'
        ? MAX_NOTE_LENGTH
        : MAX_TEXT_LENGTH;

    if (trimmed.length > maxLength) {
      return { ok: false, error: `${field} is too long.` };
    }
    sanitized[field] = trimmed;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!sanitized[field]) {
      return { ok: false, error: `Missing ${field}.` };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.customer_email!)) {
    return { ok: false, error: 'customer_email is invalid.' };
  }

  for (const field of PHOTO_FIELDS) {
    const value = sanitized[field];
    if (value && !getManIntakePhotoPath(value, supabaseUrl)) {
      return { ok: false, error: `${field} must be an ICONIK intake photo URL.` };
    }
  }

  return { ok: true, data: sanitized as SanitizedManIntakeSubmission };
}

export function getRollbackPhotoPaths(
  submission: SanitizedManIntakeSubmission,
  supabaseUrl: string,
  now = Date.now(),
): string[] {
  const paths = PHOTO_FIELDS.flatMap((field) => {
    const value = submission[field];
    const path = value ? getManIntakePhotoPath(value, supabaseUrl) : null;
    return path ? [path] : [];
  });

  const parsed = paths.map((path) => {
    const match = path.match(/^public\/(\d+)_(fullbody|headshot|side_profile)_[^/]+\.jpg$/);
    return match ? { path, timestamp: Number(match[1]), type: match[2] } : null;
  });
  if (parsed.some((item) => item === null)) return [];

  const uploads = parsed.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const timestamps = new Set(uploads.map((item) => item.timestamp));
  const types = new Set(uploads.map((item) => item.type));
  const timestamp = uploads[0]?.timestamp;

  if (
    !timestamp
    || timestamps.size !== 1
    || !types.has('fullbody')
    || !types.has('headshot')
    || timestamp > now + 5 * 60 * 1_000
    || now - timestamp > RECENT_UPLOAD_WINDOW_MS
  ) {
    return [];
  }

  return uploads.map((item) => item.path);
}

export async function persistManIntakeWithRollback<T>({
  submission,
  supabaseUrl,
  insert,
  remove,
}: {
  submission: SanitizedManIntakeSubmission;
  supabaseUrl: string;
  insert: (payload: SanitizedManIntakeSubmission) => Promise<InsertResult<T>>;
  remove: (paths: string[]) => Promise<{ error: DatabaseError | null }>;
}): Promise<{ data: T | null; error: DatabaseError | null; cleanupError: DatabaseError | null; removedPaths: string[] }> {
  const result = await insert(submission);
  if (!result.error) {
    return { data: result.data, error: null, cleanupError: null, removedPaths: [] };
  }

  const paths = getRollbackPhotoPaths(submission, supabaseUrl);
  if (paths.length === 0) {
    return { data: null, error: result.error, cleanupError: null, removedPaths: [] };
  }

  let cleanup: { error: DatabaseError | null };
  try {
    cleanup = await remove(paths);
  } catch (error) {
    cleanup = {
      error: {
        message: error instanceof Error ? error.message : 'Photo rollback failed',
      },
    };
  }
  return {
    data: null,
    error: result.error,
    cleanupError: cleanup.error,
    removedPaths: cleanup.error ? [] : paths,
  };
}
