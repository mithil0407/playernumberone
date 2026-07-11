import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'stylist-intake-photos';
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

export async function POST(request: NextRequest) {
  const uploadContext: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    pathPrefix?: string;
  } = {};

  try {
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
        return NextResponse.json({ url: publicData.publicUrl, path: firstAttempt.data.path });
      }
      if (!isMissingBucket(firstAttempt.error)) throw firstAttempt.error;
      await ensureBucket();
    }

    const { data, error } = await uploadToBucket(path, buffer, file.type || 'image/jpeg');

    if (error) throw error;

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: publicData.publicUrl, path: data.path });
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
