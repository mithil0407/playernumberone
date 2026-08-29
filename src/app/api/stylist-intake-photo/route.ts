import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'stylist-intake-photos';
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
let bucketReady = false;

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+/, '') || `upload-${Date.now()}.jpg`;
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 12 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
  bucketReady = true;
}

function extensionFor(fileName: string, contentType: string) {
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) return extension;
  return contentType === 'image/png' ? 'png'
    : contentType === 'image/webp' ? 'webp'
      : contentType === 'image/heic' ? 'heic'
        : contentType === 'image/heif' ? 'heif'
          : 'jpg';
}

async function prepareDirectUpload(request: NextRequest) {
  const body = await request.json() as { fileName?: unknown; contentType?: unknown; size?: unknown };
  const fileName = safeFileName(String(body.fileName || 'stylist-upload.jpg'));
  const contentType = String(body.contentType || 'image/jpeg').toLowerCase();
  const size = Number(body.size || 0);

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WEBP, HEIC, or HEIF images are supported.' }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Please choose an image under 12MB.' }, { status: 413 });
  }

  const extension = extensionFor(fileName, contentType);
  const stem = safeFileName(fileName).replace(/\.[^.]+$/, '');
  const path = `public/${Date.now()}_${stem}.${extension}`;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data?.token) {
    throw error || new Error('Unable to prepare signed photo upload');
  }

  const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json(
    {
      path,
      token: data.token,
      url: publicData.publicUrl,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

function isMissingBucket(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : String(error ?? '');
  return /bucket not found|not found/i.test(message);
}

function errorSummary(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { message: String(error ?? 'Unknown error') };
  }

  const record = error as Record<string, unknown>;
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    message: typeof record.message === 'string' ? record.message : String(error),
    statusCode: typeof record.statusCode === 'number' ? record.statusCode : undefined,
    name: typeof record.name === 'string' ? record.name : undefined,
  };
}

async function uploadToBucket(path: string, buffer: Buffer, contentType: string) {
  return supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType,
    });
}

function uploadSuccess(url: string, path: string) {
  return NextResponse.json(
    { url, path },
    {
      headers: {
        'Cache-Control': 'no-store',
        // Safari can expose an empty body after a successful large upload. Keep a
        // second confirmation channel so the client can continue without re-uploading.
        'X-ICONIK-Upload-URL': url,
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const uploadContext: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    pathPrefix?: string;
  } = {};

  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      return await prepareDirectUpload(request);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = safeFileName(String(formData.get('fileName') || 'stylist-upload.jpg'));
    uploadContext.fileName = fileName;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }
    uploadContext.mimeType = file.type || undefined;
    uploadContext.size = file.size;

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 });
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const path = `public/${Date.now()}_${safeFileName(fileName).replace(/\.[^.]+$/, '')}.${extension}`;
    uploadContext.pathPrefix = path.slice(0, 40);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!bucketReady) {
      const firstAttempt = await uploadToBucket(path, buffer, file.type || 'image/jpeg');
      if (!firstAttempt.error) {
        bucketReady = true;
        const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(firstAttempt.data.path);
        return uploadSuccess(publicData.publicUrl, firstAttempt.data.path);
      }
      if (!isMissingBucket(firstAttempt.error)) throw firstAttempt.error;
      await ensureBucket();
    }

    const { data, error } = await uploadToBucket(path, buffer, file.type || 'image/jpeg');

    if (error) throw error;

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
    return uploadSuccess(publicData.publicUrl, data.path);
  } catch (error) {
    console.error('[stylist-intake-photo] upload failed:', {
      ...uploadContext,
      error: errorSummary(error),
    });
    return NextResponse.json({
      error: 'We could not upload this photo. Please try a JPG, PNG, WEBP, HEIC, or HEIF image under 12MB.',
    }, { status: 500 });
  }
}
