import { NextRequest, NextResponse } from 'next/server';
import { findPaidAUOrder } from '@/lib/auIntakeAccess';
import { supabaseAdmin } from '@/lib/supabase';
import { getAUPrivatePhotoPath } from '@/lib/auIntakePhotoPolicy';

const BUCKET = 'au-intake-private';
const PHOTO_FIELDS = ['photo_fullbody_url', 'photo_headshot_url'] as const;
const TEXT_FIELDS = [
  'frustrations', 'frustrations_custom', 'situations', 'body_insecurities',
  'wardrobe_type', 'colour_preference', 'style_aesthetics', 'style_outcome',
  'style_restrictions', 'hair_type',
] as const;

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 100_000) {
      return NextResponse.json({ error: 'Intake is too large' }, { status: 413 });
    }
    const body = await request.json() as Record<string, unknown>;
    const order = await findPaidAUOrder(body.customer_email, body.payment_id);
    if (!order) return NextResponse.json({ error: 'Paid purchase access required' }, { status: 403 });
    const { data: existing, error: existingError } = await supabaseAdmin.from('au_intake_submissions')
      .select('id').eq('order_id', order.id).limit(1).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ success: true, already_saved: true });

    const photos: Record<string, string> = {};
    const paths: Record<string, string> = {};
    for (const field of PHOTO_FIELDS) {
      const path = getAUPrivatePhotoPath(body[field], order.id, process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      if (!path) return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
      const { data: object, error: objectError } = await supabaseAdmin.storage.from(BUCKET).info(path);
      if (objectError || !object) return NextResponse.json({ error: 'Photo upload incomplete' }, { status: 400 });
      const { data: signed, error: signError } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 7 * 24 * 60 * 60);
      if (signError || !signed?.signedUrl) throw signError || new Error('Could not sign photo');
      photos[field] = signed.signedUrl;
      paths[field === 'photo_fullbody_url' ? 'photo_fullbody_path' : 'photo_headshot_path'] = `${BUCKET}/${path}`;
    }
    const payload: Record<string, unknown> = {
      order_id: order.id,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone || (typeof body.customer_phone === 'string' ? body.customer_phone.slice(0, 40) : null),
      ...photos,
      ...paths,
    };
    for (const field of TEXT_FIELDS) {
      const value = body[field];
      payload[field] = typeof value === 'string' ? value.slice(0, 2000) : null;
    }
    const { error } = await supabaseAdmin.from('au_intake_submissions').insert([payload]);
    if (error) throw error;
    await supabaseAdmin.from('au_orders').update({ quiz_reminder_sent: true }).eq('id', order.id);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('AU intake submission failed:', error);
    return NextResponse.json({ error: 'Could not save intake' }, { status: 500 });
  }
}
