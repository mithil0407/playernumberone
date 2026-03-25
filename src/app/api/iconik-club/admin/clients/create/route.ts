import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

/*
  Run this SQL migration in Supabase before using this route:

  ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS preview_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

  CREATE INDEX IF NOT EXISTS idx_client_profiles_preview_token
    ON client_profiles(preview_token);
*/

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData   = await request.formData();
    const name       = (formData.get('name')       as string)?.trim();
    const email      = (formData.get('email')      as string)?.trim().toLowerCase();
    const phone      = (formData.get('phone')      as string)?.trim() || null;
    const headshot   = formData.get('headshot')    as File | null;
    const bodyPhoto  = formData.get('body_photo')  as File | null;
    const height_cm  = parseFloat(formData.get('height_cm')  as string) || null;
    const bust_cm    = parseFloat(formData.get('bust_cm')    as string) || null;
    const waist_cm   = parseFloat(formData.get('waist_cm')   as string) || null;
    const hips_cm    = parseFloat(formData.get('hips_cm')    as string) || null;
    const styleRestrictionsRaw = formData.get('style_restrictions') as string | null;
    const style_restrictions: string[] = styleRestrictionsRaw
      ? JSON.parse(styleRestrictionsRaw)
      : [];

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    if (!headshot || !bodyPhoto) {
      return NextResponse.json({ error: 'Both headshot and body photo are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminServerClient();

    // Create the profile row first to get the ID we'll use as the storage path
    const { data: profile, error: profileErr } = await admin
      .from('client_profiles')
      .insert({ name, email, phone, height_cm, bust_cm, waist_cm, hips_cm, style_restrictions, onboarding_complete: false })
      .select()
      .single();

    if (profileErr || !profile) {
      console.error('Profile insert error:', profileErr);
      return NextResponse.json({ error: 'Failed to create profile', detail: profileErr?.message }, { status: 500 });
    }

    const profileId = profile.id as string;

    function resolveType(file: File): string {
      if (file.type) return file.type;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png') return 'image/png';
      if (ext === 'webp') return 'image/webp';
      return 'image/jpeg';
    }

    // Upload headshot
    const headshotBuf = Buffer.from(await headshot.arrayBuffer());
    const headshotKey = `admin-clients/${profileId}/headshot.jpg`;
    const { error: hsErr } = await admin.storage
      .from('client-photos')
      .upload(headshotKey, headshotBuf, { contentType: resolveType(headshot), upsert: true });

    if (hsErr) {
      await admin.from('client_profiles').delete().eq('id', profileId);
      return NextResponse.json({ error: 'Headshot upload failed', detail: hsErr.message }, { status: 500 });
    }

    // Upload body photo
    const bodyBuf = Buffer.from(await bodyPhoto.arrayBuffer());
    const bodyKey = `admin-clients/${profileId}/body.jpg`;
    const { error: bpErr } = await admin.storage
      .from('client-photos')
      .upload(bodyKey, bodyBuf, { contentType: resolveType(bodyPhoto), upsert: true });

    if (bpErr) {
      await admin.from('client_profiles').delete().eq('id', profileId);
      return NextResponse.json({ error: 'Body photo upload failed', detail: bpErr.message }, { status: 500 });
    }

    // Generate signed URLs (1 year)
    const [{ data: hsUrl }, { data: bpUrl }] = await Promise.all([
      admin.storage.from('client-photos').createSignedUrl(headshotKey, 60 * 60 * 24 * 365),
      admin.storage.from('client-photos').createSignedUrl(bodyKey, 60 * 60 * 24 * 365),
    ]);

    // Mark onboarding complete + store photo URLs
    const { data: updated, error: updateErr } = await admin
      .from('client_profiles')
      .update({
        headshot_url:        hsUrl?.signedUrl,
        body_photo_url:      bpUrl?.signedUrl,
        onboarding_complete: true,
      })
      .eq('id', profileId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update profile', detail: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Admin create client error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
