import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { getStyleScanByToken, STYLE_SCAN_PHOTO_BUCKET } from '@/lib/styleScan';

export const maxDuration = 60;
const MAX_SIZE = 12 * 1024 * 1024;
const ROLES = new Set(['headshot', 'full_body']);

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(STYLE_SCAN_PHOTO_BUCKET, {
    public: false,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

function qualityError(role: string, width: number, height: number, brightness: number) {
  if (width < 500 || height < 500) return 'This photo is too small. Please upload a clearer, higher-resolution photo.';
  if (brightness < 38) return 'This photo is too dark for an accurate scan. Please retake it in bright natural light.';
  if (role === 'full_body' && height / width < 1.15) return 'Please use a vertical full-body photo showing you from head to toe.';
  return null;
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  try {
    const form = await request.formData();
    const token = String(form.get('token') || '');
    const role = String(form.get('role') || '');
    const file = form.get('file');
    if (!ROLES.has(role)) return NextResponse.json({ error: 'Invalid photo role.' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Please upload an image under 12MB.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Please upload a JPG, PNG, WEBP, HEIC or HEIF image.' }, { status: 400 });

    const scan = await getStyleScanByToken(token, 'id, scan_status, photo_paths');
    if (!scan || !['draft', 'retake_required'].includes(scan.scan_status)) {
      return NextResponse.json({ error: 'This scan can no longer accept photos.' }, { status: 403 });
    }

    const source = Buffer.from(await file.arrayBuffer());
    const decodedAt = performance.now();
    const pipeline = sharp(source, { failOn: 'warning', sequentialRead: true, limitInputPixels: 40_000_000 }).autoOrient();
    const metadata = await pipeline.metadata();
    const stats = await pipeline.clone().resize(96, 96, { fit: 'inside' }).greyscale().stats();
    const brightness = stats.channels[0]?.mean ?? 0;
    const width = metadata.autoOrient?.width || metadata.width || 0;
    const height = metadata.autoOrient?.height || metadata.height || 0;
    const issue = qualityError(role, width, height, brightness);
    if (issue) return NextResponse.json({ error: issue, retakeRequired: true }, { status: 422 });

    const cleaned = await pipeline
      .resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true })
      // libjpeg-turbo is materially faster than mozjpeg here; 87 is ample for analysis.
      .jpeg({ quality: 87, progressive: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    const processedAt = performance.now();
    const path = `${scan.id}/${role}.jpg`;
    let upload = await supabaseAdmin.storage.from(STYLE_SCAN_PHOTO_BUCKET).upload(path, cleaned, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });
    if (upload.error && /bucket not found|not found/i.test(upload.error.message)) {
      await ensureBucket();
      upload = await supabaseAdmin.storage.from(STYLE_SCAN_PHOTO_BUCKET).upload(path, cleaned, {
        contentType: 'image/jpeg', upsert: true, cacheControl: '3600',
      });
    }
    if (upload.error) throw upload.error;
    const current = scan.photo_paths && typeof scan.photo_paths === 'object' ? scan.photo_paths : {};
    const { error } = await supabaseAdmin.from('style_scan_leads').update({
      photo_paths: { ...current, [role]: upload.data.path },
      retake_reason: null,
      scan_status: 'draft',
      updated_at: new Date().toISOString(),
    }).eq('id', scan.id);
    if (error) throw error;
    const completedAt = performance.now();
    return NextResponse.json({ success: true, role, quality: { width, height, brightness: Math.round(brightness) } }, {
      headers: {
        'Cache-Control': 'no-store',
        'Server-Timing': [
          `receive;dur=${Math.round(decodedAt - startedAt)}`,
          `process;dur=${Math.round(processedAt - decodedAt)}`,
          `storage;dur=${Math.round(completedAt - processedAt)}`,
        ].join(', '),
      },
    });
  } catch (error) {
    console.error('[style-scan] upload failed:', error);
    return NextResponse.json({ error: 'We could not read that photo. Try a clear JPG, PNG or WEBP under 12MB.' }, { status: 500 });
  }
}
