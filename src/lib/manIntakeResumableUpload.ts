'use client';

import { Upload } from 'tus-js-client';
import { getManIntakePhotoFingerprintSource } from '@/lib/manIntakePhoto';
import type { ManIntakePhotoKind } from '@/lib/manIntakeUploadSession';

export const MAN_INTAKE_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
export const MAN_INTAKE_TUS_RETRY_DELAYS = [0, 3_000, 5_000, 10_000, 20_000];

export interface ManIntakeUploadCredentials {
  id: string;
  token: string;
  expires_at: string;
}

export interface PreparedManIntakeUpload {
  kind: ManIntakePhotoKind;
  path: string;
  size: number;
  content_type: string;
  fingerprint: string;
  completed: boolean;
  signed_token: string | null;
}

export interface ManIntakeUploadStatus {
  kind: ManIntakePhotoKind;
  path: string;
  fingerprint: string;
  completed: boolean;
  expected_size: number;
  expected_content_type: string;
  size: number | null;
  content_type: string | null;
  error?: string;
}

export interface ManIntakeFileSelection {
  kind: ManIntakePhotoKind;
  file: File;
}

export class ManIntakeTusUploadError extends Error {
  attempts: number;

  constructor(error: unknown, attempts: number) {
    super(error instanceof Error ? error.message : String(error || 'Upload failed'));
    this.name = 'ManIntakeTusUploadError';
    this.attempts = attempts;
    this.cause = error;
  }
}

export async function fingerprintManIntakeFile(selection: ManIntakeFileSelection): Promise<string> {
  const source = getManIntakePhotoFingerprintSource(descriptor(selection));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function storageEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) throw new Error('Photo storage is not configured.');
  const url = new URL(configured);
  if (/^[^.]+\.supabase\.co$/.test(url.hostname)) {
    const projectId = url.hostname.split('.')[0];
    return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

function descriptor(selection: ManIntakeFileSelection) {
  return {
    kind: selection.kind,
    name: selection.file.name,
    size: selection.file.size,
    type: selection.file.type,
    last_modified: selection.file.lastModified,
  };
}

async function jsonRequest<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

export async function prepareManIntakeUploads(
  selections: ManIntakeFileSelection[],
  session?: ManIntakeUploadCredentials | null,
): Promise<{ session: ManIntakeUploadCredentials; uploads: PreparedManIntakeUpload[] }> {
  const result = await jsonRequest<{
    session: ManIntakeUploadCredentials;
    uploads: PreparedManIntakeUpload[];
  }>('/api/man-intake/uploads/prepare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify({
      ...(session?.id ? { session_id: session.id } : {}),
      files: selections.map(descriptor),
    }),
  });
  return result;
}

export async function getManIntakeUploadStatus(session: ManIntakeUploadCredentials): Promise<{
  status: string;
  expires_at: string;
  photos: ManIntakeUploadStatus[];
}> {
  return jsonRequest('/api/man-intake/uploads/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ session_id: session.id }),
  });
}

export async function reportManIntakeUploadEvent(
  session: ManIntakeUploadCredentials,
  event: {
    event: 'prepared' | 'started' | 'resumed' | 'succeeded' | 'failed' | 'submitted';
    kind?: ManIntakePhotoKind;
    bytes?: number;
    duration_ms?: number;
    attempt?: number;
    error_code?: string;
  },
): Promise<void> {
  await jsonRequest('/api/man-intake/uploads/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ session_id: session.id, ...event }),
  });
}

export function normalizeClientUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'unknown');
  if (/network|load failed|fetch|offline/i.test(message)) return 'network';
  if (/timed? ?out|timeout/i.test(message)) return 'timeout';
  if (/401|403|signature|unauthor/i.test(message)) return 'authorization';
  if (/409|conflict|already exists/i.test(message)) return 'conflict';
  if (/5\d\d|server/i.test(message)) return 'storage_server';
  return 'unknown';
}

export function uploadManIntakeFileResumable(input: {
  prepared: PreparedManIntakeUpload;
  file: File;
  onProgress: (uploaded: number, total: number) => void;
  onResume?: () => void;
  onRetry?: (attempt: number) => void;
}): Promise<{ resumed: boolean; attempts: number }> {
  if (!input.prepared.signed_token) throw new Error('Missing signed photo upload token.');
  const signedToken = input.prepared.signed_token;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Photo upload authorization is not configured.');

  return new Promise((resolve, reject) => {
    let resumed = false;
    let attempts = 1;
    const upload = new Upload(input.file, {
      endpoint: storageEndpoint(),
      // Scope resume state to the server-assigned object, not only the local
      // File. The same photo can legitimately be selected for two photo kinds.
      fingerprint: () => Promise.resolve(
        `iconik-man-intake-${input.prepared.path}-${input.prepared.fingerprint}`,
      ),
      retryDelays: MAN_INTAKE_TUS_RETRY_DELAYS,
      chunkSize: MAN_INTAKE_TUS_CHUNK_BYTES,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'x-signature': signedToken,
      },
      metadata: {
        bucketName: 'man-intake-photos',
        objectName: input.prepared.path,
        contentType: input.prepared.content_type,
        cacheControl: '3600',
      },
      onShouldRetry: () => {
        attempts += 1;
        input.onRetry?.(attempts);
        return true;
      },
      onProgress: input.onProgress,
      onError: error => reject(new ManIntakeTusUploadError(error, attempts)),
      onSuccess: () => resolve({ resumed, attempts }),
    });

    upload.findPreviousUploads()
      .then((previous) => {
        const candidate = previous.find((item) => item.size === input.file.size) || previous[0];
        if (candidate) {
          resumed = true;
          upload.resumeFromPreviousUpload(candidate);
          input.onResume?.();
        }
        upload.start();
      })
      .catch(reject);
  });
}
