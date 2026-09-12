import assert from 'node:assert/strict';
import test from 'node:test';
import { recoverManIntakeUpload, type RecoverableUploadError } from './manIntakeUploadRecovery.ts';
import type { ManIntakeUploadEndpoint } from './manIntakeUploadPolicy.ts';

type Prepared = { completed: boolean; revision: number };

function failure(code: string, endpoint: ManIntakeUploadEndpoint, attempts = 1): RecoverableUploadError {
  return Object.assign(new Error(code), { code, endpoint, attempts });
}

const normalizeError = (error: unknown, endpoint: ManIntakeUploadEndpoint) => error instanceof Error && 'code' in error
  ? error as RecoverableUploadError
  : failure('unknown', endpoint);

test('switches from direct TUS to project TUS after a no-response failure', async () => {
  const calls: string[] = [];
  const result = await recoverManIntakeUpload<Prepared, RecoverableUploadError>({
    prepared: { completed: false, revision: 1 },
    uploadTus: async (prepared, endpoint) => {
      calls.push(`${endpoint}:${prepared.revision}`);
      if (endpoint === 'direct') throw failure('network_no_response', endpoint, 3);
      return { resumed: false, attempts: 1, endpoint };
    },
    uploadSigned: async () => { throw new Error('signed should not run'); },
    normalizeError,
    refreshPrepared: async () => ({ completed: false, revision: 2 }),
  });
  assert.deepEqual(calls, ['direct:1', 'project:2']);
  assert.deepEqual(result, { resumed: false, attempts: 4, endpoint: 'project' });
});

test('uses standard signed upload after both TUS hostnames fail', async () => {
  const fallbacks: string[] = [];
  let revision = 1;
  const result = await recoverManIntakeUpload<Prepared, RecoverableUploadError>({
    prepared: { completed: false, revision },
    uploadTus: async (_prepared, endpoint) => { throw failure('timeout', endpoint, 2); },
    uploadSigned: async prepared => ({ resumed: false, attempts: prepared.revision, endpoint: 'signed' }),
    normalizeError,
    refreshPrepared: async () => ({ completed: false, revision: ++revision }),
    onFallback: endpoint => fallbacks.push(endpoint),
  });
  assert.deepEqual(fallbacks, ['project', 'signed']);
  assert.deepEqual(result, { resumed: false, attempts: 7, endpoint: 'signed' });
});

test('accepts a committed object when the browser lost the success response', async () => {
  let projectCalls = 0;
  const result = await recoverManIntakeUpload<Prepared, RecoverableUploadError>({
    prepared: { completed: false, revision: 1 },
    uploadTus: async (_prepared, endpoint) => {
      if (endpoint === 'project') projectCalls += 1;
      throw failure('network_no_response', endpoint);
    },
    uploadSigned: async () => { throw new Error('signed should not run'); },
    normalizeError,
    refreshPrepared: async () => ({ completed: true, revision: 2 }),
  });
  assert.equal(projectCalls, 0);
  assert.deepEqual(result, { resumed: true, attempts: 1, endpoint: 'direct' });
});

test('refreshes an expired signature and retries it only once', async () => {
  const revisions: number[] = [];
  const result = await recoverManIntakeUpload<Prepared, RecoverableUploadError>({
    prepared: { completed: false, revision: 1 },
    uploadTus: async (prepared, endpoint) => {
      revisions.push(prepared.revision);
      if (prepared.revision === 1) throw failure('authorization', endpoint);
      return { resumed: false, attempts: 1, endpoint };
    },
    uploadSigned: async () => { throw new Error('signed should not run'); },
    normalizeError,
    refreshPrepared: async () => ({ completed: false, revision: 2 }),
  });
  assert.deepEqual(revisions, [1, 2]);
  assert.equal(result.attempts, 2);
});

test('verifies storage after a lost signed-upload acknowledgement', async () => {
  let refreshes = 0;
  const result = await recoverManIntakeUpload<Prepared, RecoverableUploadError>({
    prepared: { completed: false, revision: 1 },
    uploadTus: async (_prepared, endpoint) => { throw failure('timeout', endpoint); },
    uploadSigned: async () => { throw failure('network_no_response', 'signed'); },
    normalizeError,
    refreshPrepared: async () => ({ completed: ++refreshes === 3, revision: refreshes + 1 }),
  });
  assert.deepEqual(result, { resumed: true, attempts: 3, endpoint: 'signed' });
});

test('does not fail over permanent storage rejections', async () => {
  await assert.rejects(
    recoverManIntakeUpload<Prepared, RecoverableUploadError>({
      prepared: { completed: false, revision: 1 },
      uploadTus: async (_prepared, endpoint) => { throw failure('storage_rejected', endpoint); },
      uploadSigned: async () => { throw new Error('signed should not run'); },
      normalizeError,
      refreshPrepared: async () => ({ completed: false, revision: 2 }),
    }),
    (error: RecoverableUploadError) => error.code === 'storage_rejected' && error.attempts === 1,
  );
});
