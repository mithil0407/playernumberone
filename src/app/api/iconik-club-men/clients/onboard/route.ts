import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { enhanceClientPhotos } from '@/lib/outfitCompositor';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData   = await request.formData();
    const headshot   = formData.get('headshot')   as File | null;
    const bodyPhoto  = formData.get('body_photo') as File | null;
    const name       = formData.get('name')       as string;
    const phone      = (formData.get('phone')     as string) || null;

    // Men-specific measurements
    const height_cm   = parseFloat(formData.get('height_cm')   as string) || null;
    const weight_kg   = parseFloat(formData.get('weight_kg')   as string) || null;
    const chest_cm    = parseFloat(formData.get('chest_cm')    as string) || null;
    const waist_cm    = parseFloat(formData.get('waist_cm')    as string) || null;
    const shoulder_cm = parseFloat(formData.get('shoulder_cm') as string) || null;

    const styleRestrictionsRaw = formData.get('style_restrictions') as string | null;
    const style_restrictions: string[] = styleRestrictionsRaw ? JSON.parse(styleRestrictionsRaw) : [];
    const style_notes = (formData.get('style_notes') as string | null)?.trim() || null;

    if (!headshot || !bodyPhoto) {
      return NextResponse.json({ error: 'Both headshot and body photo are required' }, { status: 400 });
    }

    const admin = createSupabaseAdminServerClient();

    function resolveType(file: File): string {
      if (file.type) return file.type;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png')  return 'image/png';
      if (ext === 'webp') return 'image/webp';
      return 'image/jpeg';
    }

    const headshotBuf = Buffer.from(await headshot.arrayBuffer());
    const bodyBuf     = Buffer.from(await bodyPhoto.arrayBuffer());

    const headshotKey = `${user.id}/headshot.jpg`;
    const { error: hsErr } = await admin.storage
      .from('men-client-photos')
      .upload(headshotKey, headshotBuf, { contentType: resolveType(headshot), upsert: true });
    if (hsErr) {
      return NextResponse.json({ error: 'Headshot upload failed', detail: hsErr.message }, { status: 500 });
    }

    const bodyKey = `${user.id}/body.jpg`;
    const { error: bpErr } = await admin.storage
      .from('men-client-photos')
      .upload(bodyKey, bodyBuf, { contentType: resolveType(bodyPhoto), upsert: true });
    if (bpErr) {
      return NextResponse.json({ error: 'Body photo upload failed', detail: bpErr.message }, { status: 500 });
    }

    // Enhance photos in background after response is sent
    const headshotMime = resolveType(headshot);
    const bodyMime     = resolveType(bodyPhoto);
    after(async () => {
      try {
        const { headshot: enhancedHeadshot, bodyPhoto: enhancedBody } = await enhanceClientPhotos(
          { data: headshotBuf.toString('base64'), mimeType: headshotMime },
          { data: bodyBuf.toString('base64'),     mimeType: bodyMime },
        );
        const bgAdmin = createSupabaseAdminServerClient();
        if (enhancedHeadshot) {
          await bgAdmin.storage.from('men-client-photos').upload(
            headshotKey,
            Buffer.from(enhancedHeadshot.data, 'base64'),
            { contentType: enhancedHeadshot.mimeType, upsert: true },
          );
        }
        if (enhancedBody) {
          await bgAdmin.storage.from('men-client-photos').upload(
            bodyKey,
            Buffer.from(enhancedBody.data, 'base64'),
            { contentType: enhancedBody.mimeType, upsert: true },
          );
        }
      } catch (err) {
        console.error(`[bg] Men photo enhancement failed for ${user.id}:`, err);
      }
    });

    // Generate signed URLs (1-year)
    const { data: hsUrl } = await admin.storage
      .from('men-client-photos').createSignedUrl(headshotKey, 60 * 60 * 24 * 365);
    const { data: bpUrl } = await admin.storage
      .from('men-client-photos').createSignedUrl(bodyKey, 60 * 60 * 24 * 365);

    // Upsert men_client_profiles
    const { data: profile, error: dbError } = await admin
      .from('men_client_profiles')
      .upsert({
        user_id:             user.id,
        name:                name || user.user_metadata?.name || user.email,
        email:               user.email,
        phone,
        headshot_url:        hsUrl?.signedUrl,
        body_photo_url:      bpUrl?.signedUrl,
        height_cm,
        weight_kg,
        chest_cm,
        waist_cm,
        shoulder_cm,
        style_restrictions,
        style_notes,
        onboarding_complete: true,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (dbError) {
      console.error('Men profile upsert error:', dbError);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('Men onboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
