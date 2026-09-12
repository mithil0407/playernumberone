import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getManIntakeUploadFingerprint,
  getManIntakeStoredPhotoMetadataError,
  hashManIntakeUploadToken,
  isManIntakeUploadSessionExpired,
  isManIntakeSessionPhotoPath,
  normalizeManIntakeUploadError,
  validateManIntakeUploadDescriptor,
} from './manIntakeUploadSession.ts';

const SESSION_ID = '26d21f18-3122-4384-9498-7f7490f9c547';

function descriptor(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'fullbody',
    name: 'IMG_1966.HEIC',
    size: 1_476_281,
    type: 'image/heic',
    last_modified: 1_786_526_732_000,
    ...overrides,
  };
}

test('validates descriptors and preserves the real image format', () => {
  const result = validateManIntakeUploadDescriptor(descriptor());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.extension, 'heic');
  assert.equal(result.data.content_type, 'image/heic');

  const png = validateManIntakeUploadDescriptor(descriptor({ name: 'photo.png', type: 'image/png' }));
  assert.equal(png.ok, true);
  if (png.ok) assert.equal(png.data.extension, 'png');

  const browserTranscoded = validateManIntakeUploadDescriptor(descriptor({ name: 'photo.HEIC', type: 'image/jpeg' }));
  assert.equal(browserTranscoded.ok, true);
  if (browserTranscoded.ok) assert.equal(browserTranscoded.data.extension, 'jpg');
});

test('stored object metadata must exactly match the prepared file', () => {
  const expected = { size: 1_476_281, content_type: 'image/heic' };
  assert.equal(getManIntakeStoredPhotoMetadataError(expected, {
    size: 1_476_281,
    content_type: 'image/heic',
  }), null);
  assert.match(getManIntakeStoredPhotoMetadataError(expected, {
    size: 1_476_280,
    content_type: 'image/heic',
  }) || '', /size/);
  assert.match(getManIntakeStoredPhotoMetadataError(expected, {
    size: 1_476_281,
    content_type: 'image/jpeg',
  }) || '', /type/);
});

test('rejects invalid kinds, oversized files, and unsupported image formats', () => {
  assert.equal(validateManIntakeUploadDescriptor(descriptor({ kind: 'profile' })).ok, false);
  assert.equal(validateManIntakeUploadDescriptor(descriptor({ size: -1 })).ok, false);
  assert.equal(validateManIntakeUploadDescriptor(descriptor({ last_modified: -1 })).ok, false);
  assert.equal(validateManIntakeUploadDescriptor(descriptor({ size: 20 * 1024 * 1024 + 1 })).ok, false);
  assert.equal(validateManIntakeUploadDescriptor(descriptor({ name: 'photo.gif', type: 'image/gif' })).ok, false);
});

test('fingerprints are stable for the same file and change for replacements', () => {
  const base = descriptor() as Parameters<typeof getManIntakeUploadFingerprint>[0];
  assert.equal(getManIntakeUploadFingerprint(base), getManIntakeUploadFingerprint({ ...base }));
  assert.notEqual(getManIntakeUploadFingerprint(base), getManIntakeUploadFingerprint({ ...base, size: base.size + 1 }));
});

test('session photo paths are tightly scoped to the session and allowed formats', () => {
  const path = `public/man-intake-sessions/${SESSION_ID}/fullbody-622eef91-35a8-457a-bade-b5d438f3ac85.heic`;
  assert.equal(isManIntakeSessionPhotoPath(SESSION_ID, path), true);
  assert.equal(isManIntakeSessionPhotoPath(SESSION_ID, path.replace(SESSION_ID, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')), false);
  assert.equal(isManIntakeSessionPhotoPath(SESSION_ID, `${path}/../outside.jpg`), false);
  assert.equal(isManIntakeSessionPhotoPath(SESSION_ID, path.replace('.heic', '.gif')), false);
});

test('tokens are hashed and upload failures are normalized without retaining raw errors', () => {
  assert.equal(hashManIntakeUploadToken('secret'), hashManIntakeUploadToken('secret'));
  assert.notEqual(hashManIntakeUploadToken('secret'), 'secret');
  assert.equal(hashManIntakeUploadToken('secret').length, 64);
  assert.equal(normalizeManIntakeUploadError(new Error('Load failed')), 'network');
  assert.equal(normalizeManIntakeUploadError(new Error('HTTP 503')), 'storage_server');
  assert.equal(normalizeManIntakeUploadError(new Error('Something unusual')), 'unknown');
});

test('session expiry rejects invalid and elapsed timestamps', () => {
  const now = Date.parse('2026-08-12T12:00:00.000Z');
  assert.equal(isManIntakeUploadSessionExpired('2026-08-12T12:00:01.000Z', now), false);
  assert.equal(isManIntakeUploadSessionExpired('2026-08-12T12:00:00.000Z', now), true);
  assert.equal(isManIntakeUploadSessionExpired('not-a-date', now), true);
});
