'use client';

import { Upload } from 'tus-js-client';
import { getManIntakePhotoFingerprintSource } from '@/lib/manIntakePhoto';
import type { ManIntakePhotoKind } from '@/lib/manIntakeUploadSession';
import {
  customerUploadErrorMessage,
  inspectClientUploadError,
  selectFreshPreviousUpload,
  shouldRetryManIntakeUpload,
  type ManIntakeUploadEndpoint,
  type ManIntakeUploadStage,
  type PreviousManIntakeUpload,
} from '@/lib/manIntakeUploadPolicy';
import { recoverManIntakeUpload } from '@/lib/manIntakeUploadRecovery';

export {
  customerUploadErrorMessage,
  normalizeClientUploadError,
  selectFreshPreviousUpload,
  shouldRetryManIntakeUpload,
} from '@/lib/manIntakeUploadPolicy';
export type { ManIntakeUploadEndpoint, ManIntakeUploadStage } from '@/lib/manIntakeUploadPolicy';

export const MAN_INTAKE_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
// Fail over quickly instead of spending 40 seconds repeating one broken route.
export const MAN_INTAKE_TUS_RETRY_DELAYS = [0, 2_000, 5_000];
const MAN_INTAKE_UPLOAD_WATCHDOG_MS = 90_000;
const MAN_INTAKE_BUCKET = 'man-intake-photos';

export interface ManIntakeUploadCredentials { id: string; token: string; expires_at: string }
export interface PreparedManIntakeUpload {
  kind: ManIntakePhotoKind; path: string; size: number; content_type: string;
  fingerprint: string; completed: boolean; signed_token: string | null; signed_url?: string | null;
}
export interface ManIntakeUploadStatus {
  kind: ManIntakePhotoKind; path: string; fingerprint: string; completed: boolean;
  expected_size: number; expected_content_type: string; size: number | null;
  content_type: string | null; error?: string;
}
export interface ManIntakeFileSelection { kind: ManIntakePhotoKind; file: File }

export class ManIntakeTusUploadError extends Error {
  attempts: number;
  code: string;
  endpoint: ManIntakeUploadEndpoint;
  stage: ManIntakeUploadStage;
  status: number | null;
  requestId: string | null;

  constructor(error: unknown, attempts: number, endpoint: ManIntakeUploadEndpoint, stage?: ManIntakeUploadStage) {
    const info = inspectClientUploadError(error, stage);
    super(customerUploadErrorMessage(info.code));
    this.name = 'ManIntakeTusUploadError';
    this.attempts = attempts;
    this.code = info.code;
    this.endpoint = endpoint;
    this.stage = info.stage;
    this.status = info.status;
    this.requestId = info.requestId;
    this.cause = error;
  }
}

export async function fingerprintManIntakeFile(selection: ManIntakeFileSelection): Promise<string> {
  const source = getManIntakePhotoFingerprintSource(descriptor(selection));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function manIntakeStorageEndpoint(endpoint: Exclude<ManIntakeUploadEndpoint, 'signed'>): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) throw new Error('Photo storage is not configured.');
  const url = new URL(configured);
  if (endpoint === 'direct' && /^[^.]+\.supabase\.co$/.test(url.hostname)) {
    return `https://${url.hostname.split('.')[0]}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

function descriptor(selection: ManIntakeFileSelection) {
  return { kind: selection.kind, name: selection.file.name, size: selection.file.size,
    type: selection.file.type, last_modified: selection.file.lastModified };
}

async function jsonRequest<T>(url: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const result = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function prepareManIntakeUploads(
  selections: ManIntakeFileSelection[], session?: ManIntakeUploadCredentials | null,
): Promise<{ session: ManIntakeUploadCredentials; uploads: PreparedManIntakeUpload[] }> {
  return jsonRequest('/api/man-intake/uploads/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) },
    body: JSON.stringify({ ...(session?.id ? { session_id: session.id } : {}), files: selections.map(descriptor) }),
  });
}

export async function getManIntakeUploadStatus(session: ManIntakeUploadCredentials): Promise<{
  status: string; expires_at: string; photos: ManIntakeUploadStatus[];
}> {
  return jsonRequest('/api/man-intake/uploads/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ session_id: session.id }),
  });
}

export type ManIntakeUploadEvent = {
  event: 'prepared' | 'started' | 'resumed' | 'fallback' | 'succeeded' | 'failed' | 'submitted';
  kind?: ManIntakePhotoKind; bytes?: number; duration_ms?: number; attempt?: number; error_code?: string;
  stage?: ManIntakeUploadStage | 'prepare' | 'verify' | 'submit'; endpoint?: ManIntakeUploadEndpoint;
  http_status?: number | null; request_id?: string | null;
};

export async function reportManIntakeUploadEvent(session: ManIntakeUploadCredentials, event: ManIntakeUploadEvent): Promise<void> {
  await jsonRequest('/api/man-intake/uploads/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ session_id: session.id, online: typeof navigator === 'undefined' ? null : navigator.onLine,
      browser: browserFamily(), ...event }),
  });
}

function browserFamily(): string {
  if (typeof navigator === 'undefined') return 'server';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/CriOS|Chrome\//.test(ua)) return 'chrome';
  if (/Firefox|FxiOS/.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}

function uploadThroughTus(input: {
  endpoint: Exclude<ManIntakeUploadEndpoint, 'signed'>; prepared: PreparedManIntakeUpload; file: File;
  onProgress: (uploaded: number, total: number) => void; onResume?: () => void;
  onRetry?: (attempt: number, endpoint: ManIntakeUploadEndpoint) => void;
}): Promise<{ resumed: boolean; attempts: number; endpoint: ManIntakeUploadEndpoint }> {
  if (!input.prepared.signed_token) throw new Error('Missing signed photo upload token.');
  const signedToken = input.prepared.signed_token;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Photo upload authorization is not configured.');

  return new Promise((resolve, reject) => {
    let resumed = false;
    let attempts = 1;
    let settled = false;
    let currentStage: ManIntakeUploadStage = 'create';
    let watchdog: ReturnType<typeof setTimeout>;
    const finish = (callback: () => void) => { if (!settled) { settled = true; clearTimeout(watchdog); callback(); } };
    const upload = new Upload(input.file, {
      endpoint: manIntakeStorageEndpoint(input.endpoint),
      fingerprint: () => Promise.resolve(`iconik-man-intake-v3-${input.endpoint}-${input.prepared.path}-${input.prepared.fingerprint}`),
      retryDelays: MAN_INTAKE_TUS_RETRY_DELAYS,
      chunkSize: MAN_INTAKE_TUS_CHUNK_BYTES,
      uploadDataDuringCreation: false,
      removeFingerprintOnSuccess: true,
      addRequestId: true,
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-signature': signedToken },
      metadata: { bucketName: MAN_INTAKE_BUCKET, objectName: input.prepared.path,
        contentType: input.prepared.content_type, cacheControl: '3600' },
      onBeforeRequest: request => { currentStage = request.getMethod() === 'PATCH' ? 'patch' : request.getMethod() === 'HEAD' ? 'resume' : 'create'; },
      onShouldRetry: error => {
        const retry = shouldRetryManIntakeUpload(error, typeof navigator === 'undefined' || navigator.onLine);
        if (retry) { attempts += 1; input.onRetry?.(attempts, input.endpoint); armWatchdog(); }
        return retry;
      },
      onProgress: (uploaded, total) => { armWatchdog(); input.onProgress(uploaded, total); },
      onUploadUrlAvailable: () => armWatchdog(),
      onError: error => finish(() => reject(new ManIntakeTusUploadError(error, attempts, input.endpoint, currentStage))),
      onSuccess: () => finish(() => resolve({ resumed, attempts, endpoint: input.endpoint })),
    });
    const armWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => void upload.abort().finally(() => finish(() => reject(
        new ManIntakeTusUploadError(new Error('Upload timeout'), attempts, input.endpoint, currentStage),
      ))), MAN_INTAKE_UPLOAD_WATCHDOG_MS);
    };

    armWatchdog();
    upload.findPreviousUploads().then(previous => {
      const candidate = selectFreshPreviousUpload(previous as PreviousManIntakeUpload[], { size: input.file.size, path: input.prepared.path });
      if (candidate) { resumed = true; currentStage = 'resume'; upload.resumeFromPreviousUpload(candidate); input.onResume?.(); }
      upload.start();
    }).catch(error => finish(() => reject(new ManIntakeTusUploadError(error, attempts, input.endpoint, 'resume'))));
  });
}

async function uploadThroughSignedUrl(input: { prepared: PreparedManIntakeUpload; file: File; onProgress: (uploaded: number, total: number) => void }) {
  if (!input.prepared.signed_token) throw new Error('Missing signed photo upload token.');
  const fallbackUrl = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/${MAN_INTAKE_BUCKET}/${input.prepared.path}`);
  fallbackUrl.searchParams.set('token', input.prepared.signed_token);
  const signedUrl = input.prepared.signed_url || fallbackUrl.toString();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.timeout = MAN_INTAKE_UPLOAD_WATCHDOG_MS;
    xhr.setRequestHeader('x-upsert', 'false');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
    }
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) input.onProgress(Math.min(input.file.size, event.loaded), input.file.size);
    };
    xhr.onerror = () => reject(new ManIntakeTusUploadError(new Error('Network error during signed upload'), 1, 'signed', 'signed'));
    xhr.ontimeout = () => reject(new ManIntakeTusUploadError(new Error('Upload timeout'), 1, 'signed', 'signed'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(input.file.size, input.file.size);
        resolve();
      } else {
        const error = Object.assign(new Error('Signed upload rejected'), { originalResponse: { getStatus: () => xhr.status } });
        reject(new ManIntakeTusUploadError(error, 1, 'signed', 'signed'));
      }
    };
    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', input.file);
    xhr.send(body);
  });
  return { resumed: false as const, attempts: 1, endpoint: 'signed' as const };
}

export async function uploadManIntakeFileResumable(input: {
  prepared: PreparedManIntakeUpload; file: File; onProgress: (uploaded: number, total: number) => void;
  onResume?: () => void; onRetry?: (attempt: number, endpoint?: ManIntakeUploadEndpoint) => void;
  onFallback?: (endpoint: ManIntakeUploadEndpoint, error: ManIntakeTusUploadError) => void;
  refreshPrepared?: () => Promise<PreparedManIntakeUpload>;
}): Promise<{ resumed: boolean; attempts: number; endpoint: ManIntakeUploadEndpoint }> {
  return recoverManIntakeUpload({
    prepared: input.prepared,
    uploadTus: (prepared, endpoint) => uploadThroughTus({ ...input, prepared, endpoint }),
    uploadSigned: prepared => uploadThroughSignedUrl({ ...input, prepared }),
    normalizeError: (error, endpoint) => error instanceof ManIntakeTusUploadError
      ? error
      : new ManIntakeTusUploadError(error, 1, endpoint, endpoint === 'signed' ? 'signed' : undefined),
    refreshPrepared: input.refreshPrepared,
    onFallback: input.onFallback,
  });
}
