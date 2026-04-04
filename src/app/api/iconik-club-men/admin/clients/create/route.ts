import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { enhanceClientPhotos } from '@/lib/outfitCompositor';

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData    = await request.formData();
    const name        = (formData.get('name')        as string)?.trim();
    const email       = (formData.get('email')       as string)?.trim().toLowerCase();
    const phone       = (formData.get('phone')       as string)?.trim() || null;
    const headshot    = formData.get('headshot')     as File | null;
    const bodyPhoto   = formData.get('body_photo')   as File | null;
    const height_cm   = parseFloat(formData.get('height_cm')   as string) || null;
    const chest_cm    = parseFloat(formData.get('chest_cm')    as string) || null;
    const waist_cm    = parseFloat(formData.get('waist_cm')    as string) || null;
    const shoulder_cm = parseFloat(formData.get('shoulder_cm') as string) || null;
    const styleRestrictionsRaw = formData.get('style_restrictions') as string | null;
    const style_restrictions: string[] = styleRestrictionsRaw ? JSON.parse(styleRestrictionsRaw) : [];
    const style_notes = (formData.get('style_notes') as string | null)?.trim() || null;

    if (!name || !email)           return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    if (!headshot || !bodyPhoto)   return NextResponse.json({ error: 'Both headshot and body photo are required' }, { status: 400 });

    const admin = createSupabaseAdminServerClient();

    // Insert profile first to get the ID used as storage path
    const { data: profile, error: profileErr } = await admin
      .from('men_client_profiles')
      .insert({ name, email, phone, height_cm, chest_cm, waist_cm, shoulder_cm, style_notes, style_restrictions, onboarding_complete: false })
      .select()
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Failed to create profile', detail: profileErr?.message }, { status: 500 });
    }

    const profileId = profile.id as string;

    function resolveType(file: File): string {
      if (file.type) return file.type;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png')  return 'image/png';
      if (ext === 'webp') return 'image/webp';
      return 'image/jpeg';
    }

    const headshotBuf = Buffer.from(await headshot.arrayBuffer());
    const bodyBuf     = Buffer.from(await bodyPhoto.arrayBuffer());

    const headshotKey = `admin-clients/${profileId}/headshot.jpg`;
    const { error: hsErr } = await admin.storage
      .from('men-client-photos')
      .upload(headshotKey, headshotBuf, { contentType: resolveType(headshot), upsert: true });

    if (hsErr) {
      await admin.from('men_client_profiles').delete().eq('id', profileId);
      return NextResponse.json({ error: 'Headshot upload failed', detail: hsErr.message }, { status: 500 });
    }

    const bodyKey = `admin-clients/${profileId}/body.jpg`;
    const { error: bpErr } = await admin.storage
      .from('men-client-photos')
      .upload(bodyKey, bodyBuf, { contentType: resolveType(bodyPhoto), upsert: true });

    if (bpErr) {
      await admin.from('men_client_profiles').delete().eq('id', profileId);
      return NextResponse.json({ error: 'Body photo upload failed', detail: bpErr.message }, { status: 500 });
    }

    // Enhance in background after response
    after(async () => {
      try {
        const { headshot: eH, bodyPhoto: eB } = await enhanceClientPhotos(
          { data: headshotBuf.toString('base64'), mimeType: resolveType(headshot) },
          { data: bodyBuf.toString('base64'),     mimeType: resolveType(bodyPhoto) },
        );
        const bgAdmin = createSupabaseAdminServerClient();
        if (eH) await bgAdmin.storage.from('men-client-photos').upload(headshotKey, Buffer.from(eH.data, 'base64'), { contentType: eH.mimeType, upsert: true });
        if (eB) await bgAdmin.storage.from('men-client-photos').upload(bodyKey,     Buffer.from(eB.data, 'base64'), { contentType: eB.mimeType, upsert: true });
      } catch (err) {
        console.error(`[bg] Men photo enhancement failed for ${profileId}:`, err);
      }
    });

    const [{ data: hsUrl }, { data: bpUrl }] = await Promise.all([
      admin.storage.from('men-client-photos').createSignedUrl(headshotKey, 60 * 60 * 24 * 365),
      admin.storage.from('men-client-photos').createSignedUrl(bodyKey,     60 * 60 * 24 * 365),
    ]);

    const { data: updated, error: updateErr } = await admin
      .from('men_client_profiles')
      .update({ headshot_url: hsUrl?.signedUrl, body_photo_url: bpUrl?.signedUrl, onboarding_complete: true })
      .eq('id', profileId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update profile', detail: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Men admin create client error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
