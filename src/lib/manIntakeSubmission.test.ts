import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRollbackPhotoPaths,
  persistManIntakeWithRollback,
  validateManIntakeSubmission,
} from './manIntakeSubmission.ts';
import {
  getManIntakePhotoContentType,
  getManIntakePhotoExtension,
  getManIntakePhotoValidationError,
  MAN_INTAKE_MAX_PHOTO_BYTES,
} from './manIntakePhoto.ts';

const SUPABASE_URL = 'https://example-project.supabase.co';
const NOW = Date.now();

function photoUrl(type: 'fullbody' | 'headshot' | 'side_profile', name = 'photo') {
  return `${SUPABASE_URL}/storage/v1/object/public/man-intake-photos/public/${NOW}_${type}_${name}.jpg`;
}

function validPayload() {
  return {
    customer_email: 'client@example.com',
    customer_phone: '+91 98765 43210',
    photo_fullbody_url: photoUrl('fullbody'),
    photo_headshot_url: photoUrl('headshot'),
    photo_side_profile_url: photoUrl('side_profile'),
    primary_goal: 'professional',
    free_text_note: 'Relaxed, untucked casual.',
  };
}

test('accepts allow-listed intake fields with or without a side-profile photo', () => {
  const withSide = validateManIntakeSubmission(validPayload(), SUPABASE_URL);
  assert.equal(withSide.ok, true);
  if (withSide.ok) assert.equal(withSide.data.photo_side_profile_url, photoUrl('side_profile'));

  const withoutSide: Record<string, unknown> = { ...validPayload() };
  delete withoutSide.photo_side_profile_url;
  assert.equal(validateManIntakeSubmission(withoutSide, SUPABASE_URL).ok, true);
});

test('accepts supported photos and rejects empty, oversized, or unsupported files', () => {
  assert.equal(getManIntakePhotoValidationError({ name: 'photo.jpg', size: 10, type: 'image/jpeg' }), null);
  assert.match(getManIntakePhotoValidationError({ name: 'photo.jpg', size: 0, type: 'image/jpeg' }) || '', /empty/i);
  assert.match(
    getManIntakePhotoValidationError({ name: 'photo.jpg', size: MAN_INTAKE_MAX_PHOTO_BYTES + 1, type: 'image/jpeg' }) || '',
    /larger than 20 MB/i,
  );
  assert.match(getManIntakePhotoValidationError({ name: 'photo.gif', size: 10, type: 'image/gif' }) || '', /JPG, PNG/i);
  assert.equal(getManIntakePhotoExtension({ name: 'portrait.HEIC', type: 'image/heic' }), 'heic');
  assert.equal(getManIntakePhotoExtension({ name: 'portrait.jpeg', type: 'image/jpeg' }), 'jpg');
  assert.equal(getManIntakePhotoContentType({ name: 'portrait.png', type: '' }), 'image/png');
});

test('rejects unexpected fields, missing photos, and external photo URLs', () => {
  assert.deepEqual(
    validateManIntakeSubmission({ ...validPayload(), created_at: '2026-07-20' }, SUPABASE_URL),
    { ok: false, error: 'Unexpected intake field: created_at' },
  );

  const missingHeadshot: Record<string, unknown> = { ...validPayload() };
  delete missingHeadshot.photo_headshot_url;
  assert.deepEqual(
    validateManIntakeSubmission(missingHeadshot, SUPABASE_URL),
    { ok: false, error: 'Missing photo_headshot_url.' },
  );

  assert.deepEqual(
    validateManIntakeSubmission({ ...validPayload(), photo_fullbody_url: 'https://example.com/photo.jpg' }, SUPABASE_URL),
    { ok: false, error: 'photo_fullbody_url must be an ICONIK intake photo URL.' },
  );
});

test('selects only a fresh, same-request photo group for rollback', () => {
  const validation = validateManIntakeSubmission(validPayload(), SUPABASE_URL);
  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  assert.deepEqual(getRollbackPhotoPaths(validation.data, SUPABASE_URL, NOW + 1_000), [
    `public/${NOW}_fullbody_photo.jpg`,
    `public/${NOW}_headshot_photo.jpg`,
    `public/${NOW}_side_profile_photo.jpg`,
  ]);
  assert.deepEqual(getRollbackPhotoPaths(validation.data, SUPABASE_URL, NOW + 2 * 60 * 60 * 1_000), []);
});

test('rolls back the current upload group when the database insert fails', async () => {
  const validation = validateManIntakeSubmission(validPayload(), SUPABASE_URL);
  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  let removed: string[] = [];
  const result = await persistManIntakeWithRollback({
    submission: validation.data,
    supabaseUrl: SUPABASE_URL,
    insert: async () => ({ data: null, error: { code: 'PGRST204', message: 'Schema mismatch' } }),
    remove: async (paths) => {
      removed = paths;
      return { error: null };
    },
  });

  assert.equal(result.error?.code, 'PGRST204');
  assert.deepEqual(result.removedPaths, removed);
  assert.equal(removed.length, 3);
});

test('does not delete photos after a successful insert', async () => {
  const validation = validateManIntakeSubmission(validPayload(), SUPABASE_URL);
  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  let removeCalled = false;
  const result = await persistManIntakeWithRollback({
    submission: validation.data,
    supabaseUrl: SUPABASE_URL,
    insert: async () => ({ data: { id: 'submission-id' }, error: null }),
    remove: async () => {
      removeCalled = true;
      return { error: null };
    },
  });

  assert.deepEqual(result.data, { id: 'submission-id' });
  assert.equal(removeCalled, false);
});
