import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'stylist-intake-photos';

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+/, '') || `upload-${Date.now()}.jpg`;
}

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) {
    await supabaseAdmin.storage.updateBucket(BUCKET, { public: true }).catch(() => {});
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 12 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fileName = safeFileName(String(formData.get('fileName') || 'stylist-upload.jpg'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 });
    }

    await ensureBucket();

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const path = `public/${Date.now()}_${safeFileName(fileName).replace(/\.[^.]+$/, '')}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) throw error;

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: publicData.publicUrl, path: data.path });
  } catch (error) {
    console.error('[stylist-intake-photo] upload failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Photo upload failed',
    }, { status: 500 });
  }
}
