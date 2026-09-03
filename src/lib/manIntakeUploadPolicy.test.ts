import assert from 'node:assert/strict';
import test from 'node:test';
import {
  customerUploadErrorMessage,
  inspectClientUploadError,
  selectFreshPreviousUpload,
  shouldRetryManIntakeUpload,
  type DetailedUploadErrorLike,
  type PreviousManIntakeUpload,
} from './manIntakeUploadPolicy.ts';

function detailedError(status: number | null, method = 'POST'): DetailedUploadErrorLike {
  return Object.assign(new Error('tus request failed'), {
    originalRequest: {
      getMethod: () => method,
      getHeader: (name: string) => name === 'X-Request-ID' ? 'request-123' : undefined,
    },
    originalResponse: status === null ? null : { getStatus: () => status },
    causingError: status === null ? new Error('[object ProgressEvent]') : null,
  });
}

function previous(overrides: Partial<PreviousManIntakeUpload> = {}): PreviousManIntakeUpload {
  return {
    size: 3_626_247,
    metadata: { objectName: 'session/fullbody.jpg' },
    creationTime: '2026-09-03T05:00:00.000Z',
    uploadUrl: 'https://storage.example/upload/one',
    urlStorageKey: 'key',
    parallelUploadUrls: null,
    ...overrides,
  };
}

test('classifies a no-response ProgressEvent at the exact request stage', () => {
  assert.deepEqual(inspectClientUploadError(detailedError(null, 'POST')), {
    code: 'network_no_response', status: null, stage: 'create', requestId: 'request-123',
  });
  assert.equal(inspectClientUploadError(detailedError(null, 'PATCH')).stage, 'patch');
  assert.match(customerUploadErrorMessage('network_no_response'), /UPL-NET-CREATE/);
});

test('retries transient responses and rejects permanent responses or offline retries', () => {
  for (const status of [null, 408, 409, 423, 425, 429, 500, 503]) {
    assert.equal(shouldRetryManIntakeUpload(detailedError(status)), true, `expected ${status} to retry`);
  }
  for (const status of [400, 401, 403, 404, 410, 422]) {
    assert.equal(shouldRetryManIntakeUpload(detailedError(status)), false, `expected ${status} to stop`);
  }
  assert.equal(shouldRetryManIntakeUpload(detailedError(null), false), false);
});

test('resumes only the newest matching unexpired upload URL', () => {
  const now = Date.parse('2026-09-03T06:00:00.000Z');
  const newest = previous({ creationTime: '2026-09-03T05:30:00.000Z', uploadUrl: 'https://storage.example/upload/new' });
  const selected = selectFreshPreviousUpload([
    previous(),
    newest,
    previous({ size: 123 }),
    previous({ metadata: { objectName: 'another/photo.jpg' } }),
    previous({ creationTime: '2026-09-02T06:00:00.000Z' }),
  ], { size: 3_626_247, path: 'session/fullbody.jpg' }, now);
  assert.equal(selected?.uploadUrl, newest.uploadUrl);
});

test('rejects future, invalid, missing, and expired previous upload URLs', () => {
  const now = Date.parse('2026-09-03T06:00:00.000Z');
  const candidates = [
    previous({ uploadUrl: null }),
    previous({ creationTime: 'invalid' }),
    previous({ creationTime: '2026-09-04T06:00:00.000Z' }),
    previous({ creationTime: '2026-09-02T06:59:59.000Z' }),
  ];
  assert.equal(selectFreshPreviousUpload(candidates, { size: 3_626_247, path: 'session/fullbody.jpg' }, now), null);
});
