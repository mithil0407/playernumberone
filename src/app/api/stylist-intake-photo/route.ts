import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { findPaidStylistIntakeOrder } from '@/lib/stylistIntakeAccess';

const BUCKET = 'stylist-intake-private';
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};
const SIGNED_READ_SECONDS = 7 * 24 * 60 * 60;

async function authorize(email: unknown, paymentId: unknown) {
  return findPaidStylistIntakeOrder(email, paymentId);
}

async function signedReadUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_READ_SECONDS);
  if (error || !data?.signedUrl) throw error || new Error('Unable to sign photo URL');
  return data.signedUrl;
}

async function uploadLimitReached(orderId: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(`orders/${orderId}`, { limit: 12 });
  if (error) throw error;
  return (data?.length || 0) >= 12;
}

async function prepareDirectUpload(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const order = await authorize(body.customer_email, body.payment_id);
  if (!order) return NextResponse.json({ error: 'Purchase access required' }, { status: 403 });
  if (body.uploadProtocol !== 2) {
    return NextResponse.json({ error: 'Please refresh this page before uploading photos.' }, { status: 409 });
  }
  const contentType = String(body.contentType || '').toLowerCase();
  const size = Number(body.size);
  const extension = ALLOWED_MIME_TYPES[contentType];
  if (!extension) return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Please choose an image under 12MB.' }, { status: 413 });
  }
  if (await uploadLimitReached(order.id)) return NextResponse.json({ error: 'Photo upload limit reached. Contact support for help.' }, { status: 429 });

  const path = `orders/${order.id}/${randomUUID()}.${extension}`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) throw error || new Error('Unable to prepare photo upload');
  return NextResponse.json({ path, token: data.token }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: NextRequest) {
  try {
    const order = await authorize(request.nextUrl.searchParams.get('customer_email'), request.nextUrl.searchParams.get('payment_id'));
    if (!order) return NextResponse.json({ error: 'Purchase access required' }, { status: 403 });
    const path = request.nextUrl.searchParams.get('path') || '';
    if (!new RegExp(`^orders/${order.id}/[0-9a-f-]{36}\\.(jpg|png|webp|heic|heif)$`, 'i').test(path)) {
      return NextResponse.json({ error: 'Invalid photo path' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).info(path);
    if (error || !data) return NextResponse.json({ error: 'Photo upload is incomplete' }, { status: 404 });
    return NextResponse.json({ url: await signedReadUrl(path) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[stylist-intake-photo] confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to confirm photo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      return await prepareDirectUpload(request);
    }

    // Legacy multipart clients still receive the same access and validation checks.
    const form = await request.formData();
    const order = await authorize(form.get('customer_email'), form.get('payment_id'));
    if (!order) return NextResponse.json({ error: 'Purchase access required' }, { status: 403 });
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    const extension = ALLOWED_MIME_TYPES[file.type.toLowerCase()];
    if (!extension) return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Please choose an image under 12MB.' }, { status: 413 });
    }
    if (await uploadLimitReached(order.id)) return NextResponse.json({ error: 'Photo upload limit reached. Contact support for help.' }, { status: 429 });
    const path = `orders/${order.id}/${randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    return NextResponse.json({ path, url: await signedReadUrl(path) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[stylist-intake-photo] upload failed:', error);
    return NextResponse.json({ error: 'We could not upload this photo. Please try again.' }, { status: 500 });
  }
}
