import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { findPaidAUOrder } from '@/lib/auIntakeAccess';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'au-intake-private';
const MIME: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'image/heif': 'heif',
};
const MAX = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const order = await findPaidAUOrder(body.customer_email, body.payment_id);
    if (!order) return NextResponse.json({ error: 'Paid purchase access required' }, { status: 403 });
    if (body.action === 'confirm') {
      const path = typeof body.path === 'string' ? body.path : '';
      if (!new RegExp(`^orders/${order.id}/[0-9a-f-]{36}\\.(jpg|png|webp|heic|heif)$`, 'i').test(path)) {
        return NextResponse.json({ error: 'Invalid photo path' }, { status: 400 });
      }
      const { data: object, error: objectError } = await supabaseAdmin.storage.from(BUCKET).info(path);
      if (objectError || !object) return NextResponse.json({ error: 'Photo upload incomplete' }, { status: 404 });
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 7 * 24 * 60 * 60);
      if (error || !data?.signedUrl) throw error || new Error('Could not sign photo');
      return NextResponse.json({ url: data.signedUrl, path: `${BUCKET}/${path}` }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const type = String(body.contentType || '');
    const size = Number(body.size);
    if (!MIME[type] || !Number.isFinite(size) || size <= 0 || size > MAX) {
      return NextResponse.json({ error: 'Choose a JPG, PNG, WEBP, HEIC or HEIF image under 12MB' }, { status: 400 });
    }
    const { data: existing, error: listError } = await supabaseAdmin.storage.from(BUCKET).list(`orders/${order.id}`, { limit: 12 });
    if (listError) throw listError;
    if ((existing?.length || 0) >= 12) return NextResponse.json({ error: 'Photo upload limit reached' }, { status: 429 });
    const path = `orders/${order.id}/${randomUUID()}.${MIME[type]}`;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) throw error || new Error('Could not prepare upload');
    return NextResponse.json({ path, token: data.token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('AU intake photo preparation failed:', error);
    return NextResponse.json({ error: 'Could not prepare photo upload' }, { status: 500 });
  }
}
