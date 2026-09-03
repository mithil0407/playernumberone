import type { ManIntakeUploadEndpoint } from './manIntakeUploadPolicy.ts';

export type RecoverablePreparedUpload = { completed: boolean };
export type RecoverableUploadResult = {
  resumed: boolean;
  attempts: number;
  endpoint: ManIntakeUploadEndpoint;
};
export type RecoverableUploadError = Error & {
  attempts: number;
  code: string;
  endpoint: ManIntakeUploadEndpoint;
};

export function canFailOverManIntakeUpload(error: Pick<RecoverableUploadError, 'code'>): boolean {
  return ['network_no_response', 'timeout', 'storage_server', 'rate_limited', 'stale_upload', 'conflict']
    .includes(error.code);
}

/** Coordinate independent transports and server verification. */
export async function recoverManIntakeUpload<TPrepared extends RecoverablePreparedUpload, TError extends RecoverableUploadError>(input: {
  prepared: TPrepared;
  uploadTus: (prepared: TPrepared, endpoint: 'direct' | 'project') => Promise<RecoverableUploadResult>;
  uploadSigned: (prepared: TPrepared) => Promise<RecoverableUploadResult>;
  normalizeError: (error: unknown, endpoint: ManIntakeUploadEndpoint) => TError;
  refreshPrepared?: () => Promise<TPrepared>;
  onFallback?: (endpoint: ManIntakeUploadEndpoint, error: TError) => void;
}): Promise<RecoverableUploadResult> {
  let prepared = input.prepared;
  let totalAttempts = 0;

  const refresh = async (): Promise<boolean> => {
    if (!input.refreshPrepared) return false;
    try {
      prepared = await input.refreshPrepared();
      return true;
    } catch {
      return false;
    }
  };

  for (const endpoint of ['direct', 'project'] as const) {
    let failure: TError;
    try {
      const result = await input.uploadTus(prepared, endpoint);
      return { ...result, attempts: totalAttempts + result.attempts };
    } catch (error) {
      failure = input.normalizeError(error, endpoint);
      totalAttempts += failure.attempts;
    }

    const refreshed = await refresh();
    if (prepared.completed) return { resumed: true, attempts: totalAttempts, endpoint };

    // A rejected short-lived signature gets one retry on the same transport
    // after refresh. Other transient failures switch transports immediately.
    if (failure.code === 'authorization' && refreshed) {
      try {
        const result = await input.uploadTus(prepared, endpoint);
        return { ...result, attempts: totalAttempts + result.attempts };
      } catch (error) {
        failure = input.normalizeError(error, endpoint);
        totalAttempts += failure.attempts;
        await refresh();
        if (prepared.completed) return { resumed: true, attempts: totalAttempts, endpoint };
      }
    }

    if (!canFailOverManIntakeUpload(failure)) {
      failure.attempts = totalAttempts;
      throw failure;
    }
    input.onFallback?.(endpoint === 'direct' ? 'project' : 'signed', failure);
  }

  try {
    const result = await input.uploadSigned(prepared);
    return { ...result, attempts: totalAttempts + result.attempts };
  } catch (error) {
    const failure = input.normalizeError(error, 'signed');
    totalAttempts += failure.attempts;
    await refresh();
    if (prepared.completed) return { resumed: true, attempts: totalAttempts, endpoint: 'signed' };
    failure.attempts = totalAttempts;
    throw failure;
  }
}
