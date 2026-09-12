export const MAN_INTAKE_TUS_MAX_PREVIOUS_AGE_MS = 23 * 60 * 60 * 1_000;

export type ManIntakeUploadEndpoint = 'direct' | 'project' | 'signed';
export type ManIntakeUploadStage = 'create' | 'resume' | 'patch' | 'signed';

export type PreviousManIntakeUpload = {
  size: number | null;
  metadata: Record<string, string>;
  creationTime: string;
  uploadUrl: string | null;
  urlStorageKey: string;
  parallelUploadUrls: string[] | null;
};

type RequestLike = {
  getMethod(): string;
  getHeader(name: string): string | undefined;
};
type ResponseLike = { getStatus(): number };
export type DetailedUploadErrorLike = Error & {
  originalRequest?: RequestLike | null;
  originalResponse?: ResponseLike | null;
  causingError?: Error | null;
};

export type UploadErrorInfo = {
  code: string;
  status: number | null;
  stage: ManIntakeUploadStage;
  requestId: string | null;
};

export function inspectClientUploadError(
  error: unknown,
  fallbackStage: ManIntakeUploadStage = 'create',
): UploadErrorInfo {
  const detailed = error && typeof error === 'object' ? error as DetailedUploadErrorLike : null;
  const request = detailed?.originalRequest;
  const response = detailed?.originalResponse;
  const status = response ? response.getStatus() : null;
  const method = request?.getMethod()?.toUpperCase();
  const stage: ManIntakeUploadStage = method === 'PATCH' ? 'patch' : method === 'HEAD' ? 'resume' : fallbackStage;
  const requestId = request?.getHeader('X-Request-ID') || null;
  const message = [
    error instanceof Error ? error.message : String(error || ''),
    detailed?.causingError?.message || '',
  ].join(' ');

  let code = 'unknown';
  if (!status && (request || /progress ?event|failed to (create|upload|resume)|network|load failed|fetch|offline/i.test(message))) {
    code = 'network_no_response';
  } else if (/timed? ?out|timeout/i.test(message)) code = 'timeout';
  else if (status === 401 || status === 403 || /signature|unauthor/i.test(message)) code = 'authorization';
  else if (status === 404 || status === 410) code = 'stale_upload';
  else if (status === 408) code = 'timeout';
  else if (status === 409 || /conflict|already exists/i.test(message)) code = 'conflict';
  else if (status === 429) code = 'rate_limited';
  else if ((status !== null && status >= 500) || /server/i.test(message)) code = 'storage_server';
  else if (status !== null && status >= 400) code = 'storage_rejected';
  return { code, status, stage, requestId };
}

export function normalizeClientUploadError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code;
  return inspectClientUploadError(error).code;
}

export function customerUploadErrorMessage(code: string): string {
  switch (code) {
    case 'network_no_response': return 'The photo connection was interrupted. We tried both upload routes. Please switch between Wi-Fi and mobile data, then retry. (UPL-NET-CREATE)';
    case 'timeout': return 'The photo upload timed out. Your answers are saved; please retry this photo. (UPL-TIMEOUT)';
    case 'authorization': return 'The secure upload link expired. Please retry to create a fresh link. (UPL-AUTH)';
    case 'stale_upload': return 'The previous upload expired. Please retry to start a fresh upload. (UPL-STALE)';
    case 'conflict': return 'A previous copy of this photo is still being processed. Please retry. (UPL-CONFLICT)';
    case 'rate_limited': return 'Photo storage is busy. Please wait a moment and retry. (UPL-BUSY)';
    case 'storage_server': return 'Photo storage is temporarily unavailable. Your answers are saved; please retry. (UPL-STORAGE)';
    default: return 'We could not upload this photo. Your answers are saved; please retry. (UPL-UNKNOWN)';
  }
}

export function shouldRetryManIntakeUpload(error: unknown, online = true): boolean {
  if (!online) return false;
  const { status } = inspectClientUploadError(error);
  return status === null || status === 408 || status === 409 || status === 423
    || status === 425 || status === 429 || (status !== null && status >= 500);
}

export function selectFreshPreviousUpload(
  previous: PreviousManIntakeUpload[],
  expected: { size: number; path: string },
  now = Date.now(),
): PreviousManIntakeUpload | null {
  return previous
    .filter(item => item.size === expected.size
      && item.uploadUrl
      && item.metadata?.objectName === expected.path
      && Number.isFinite(Date.parse(item.creationTime))
      && now - Date.parse(item.creationTime) >= 0
      && now - Date.parse(item.creationTime) < MAN_INTAKE_TUS_MAX_PREVIOUS_AGE_MS)
    .sort((a, b) => Date.parse(b.creationTime) - Date.parse(a.creationTime))[0] || null;
}
