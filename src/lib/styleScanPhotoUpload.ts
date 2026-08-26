'use client';

import type { StyleScanPhotoRole } from '@/lib/styleScanPhotoTypes';

export const STYLE_SCAN_MAX_PHOTO_BYTES = 12 * 1024 * 1024;
export const STYLE_SCAN_CLIENT_TARGET_BYTES = 1.5 * 1024 * 1024;
const CLIENT_MAX_WIDTH = 1800;
const CLIENT_MAX_HEIGHT = 2400;
const CLIENT_JPEG_QUALITY = 0.86;
const UPLOAD_TIMEOUT_MS = 120_000;

export interface StyleScanUploadResult {
  success: true;
  role: StyleScanPhotoRole;
  quality: { width: number; height: number; brightness: number };
}

export interface PreparedStyleScanPhoto {
  file: File;
  originalBytes: number;
  uploadBytes: number;
  optimized: boolean;
}

export class StyleScanUploadError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'StyleScanUploadError';
    this.status = status;
    this.retryable = status === 0 || status === 408 || status === 429 || status >= 500;
  }
}

function extension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

export function validateStyleScanPhoto(file: File): string | null {
  const supportedType = /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type);
  const supportedExtension = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extension(file));
  if (!supportedType && !supportedExtension) return 'Choose a JPG, PNG, WEBP, HEIC or HEIF photo.';
  if (file.size <= 0) return 'That photo appears to be empty. Please choose another one.';
  if (file.size > STYLE_SCAN_MAX_PHOTO_BYTES) return 'Please choose a photo under 12MB.';
  return null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

async function decodePhoto(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
  } catch {
    // Safari can often render an iPhone HEIC even when createImageBitmap cannot.
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    try {
      await image.decode();
      return { source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => URL.revokeObjectURL(url) };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

/**
 * Shrink ordinary browser-decodable photos before they cross the network.
 * HEIC/HEIF support varies by browser, so decode failures intentionally fall
 * back to the original file and let Sharp handle them on the server.
 */
export async function prepareStyleScanPhoto(file: File): Promise<PreparedStyleScanPhoto> {
  const validationError = validateStyleScanPhoto(file);
  if (validationError) throw new StyleScanUploadError(validationError, 400);

  // Small files gain little from a client-side decode/re-encode cycle.
  if (file.size <= STYLE_SCAN_CLIENT_TARGET_BYTES) {
    return { file, originalBytes: file.size, uploadBytes: file.size, optimized: false };
  }

  let decoded: Awaited<ReturnType<typeof decodePhoto>> | null = null;
  try {
    decoded = await decodePhoto(file);
    const scale = Math.min(1, CLIENT_MAX_WIDTH / decoded.width, CLIENT_MAX_HEIGHT / decoded.height);
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas is unavailable.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', CLIENT_JPEG_QUALITY);
    if (!blob || blob.size >= file.size * 0.92) {
      return { file, originalBytes: file.size, uploadBytes: file.size, optimized: false };
    }
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'style-scan-photo';
    const optimizedFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
    return { file: optimizedFile, originalBytes: file.size, uploadBytes: optimizedFile.size, optimized: true };
  } catch {
    return { file, originalBytes: file.size, uploadBytes: file.size, optimized: false };
  } finally {
    decoded?.cleanup();
  }
}

function readResponse(xhr: XMLHttpRequest): Record<string, unknown> {
  try {
    return JSON.parse(xhr.responseText || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function postStyleScanJson<T extends Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 45_000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onerror = () => reject(new StyleScanUploadError(
      navigator.onLine
        ? 'ICONIK could not be reached. Please retry, or temporarily pause any traffic-inspection browser extension.'
        : 'You appear to be offline. Reconnect and try again.',
    ));
    xhr.ontimeout = () => reject(new StyleScanUploadError('ICONIK took too long to respond. Please retry.', 408));
    xhr.onload = () => {
      const data = readResponse(xhr);
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new StyleScanUploadError(
          typeof data.error === 'string' ? data.error : `Request failed (${xhr.status}).`,
          xhr.status,
        ));
        return;
      }
      resolve(data as T);
    };
    xhr.send(JSON.stringify(body));
  });
}

/** Uses XHR so uploads have real byte progress and are not coupled to extensions that monkey-patch window.fetch. */
export function uploadStyleScanPhoto(input: {
  token: string;
  role: StyleScanPhotoRole;
  file: File;
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
  onUploadComplete?: () => void;
}): Promise<StyleScanUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    xhr.open('POST', '/api/style-scan/upload-url');
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = event => {
      if (event.lengthComputable && event.total > 0) input.onProgress?.(event.loaded / event.total);
    };
    xhr.upload.onload = () => {
      input.onProgress?.(1);
      input.onUploadComplete?.();
    };
    xhr.onerror = () => reject(new StyleScanUploadError(
      navigator.onLine
        ? 'The photo could not reach ICONIK. A browser extension or unstable connection may be blocking it. Please retry.'
        : 'You appear to be offline. Reconnect and retry the photo.',
    ));
    xhr.ontimeout = () => reject(new StyleScanUploadError('The upload timed out. Please retry on a stable connection.', 408));
    xhr.onabort = () => reject(new DOMException('Upload cancelled.', 'AbortError'));
    xhr.onload = () => {
      const data = readResponse(xhr);
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new StyleScanUploadError(
          typeof data.error === 'string' ? data.error : `Photo upload failed (${xhr.status}).`,
          xhr.status,
        ));
        return;
      }
      resolve(data as unknown as StyleScanUploadResult);
    };

    const form = new FormData();
    form.append('token', input.token);
    form.append('role', input.role);
    form.append('file', input.file);
    input.signal?.addEventListener('abort', abort, { once: true });
    xhr.addEventListener('loadend', () => input.signal?.removeEventListener('abort', abort), { once: true });
    xhr.send(form);
  });
}
