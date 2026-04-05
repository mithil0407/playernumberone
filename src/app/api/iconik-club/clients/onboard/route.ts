import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { enhanceClientPhotos, generateVisualProfile } from '@/lib/outfitCompositor';

export async function POST(request: NextRequest) {
  try {
    // Auth: must be a signed-in client
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData     = await request.formData();
    const headshot     = formData.get('headshot')   as File | null;
    const bodyPhoto    = formData.get('body_photo') as File | null;
    const name         = formData.get('name')       as string;
    const phone        = (formData.get('phone')     as string) || null;
    const height_cm    = parseFloat(formData.get('height_cm')  as string) || null;
    const weight_kg    = parseFloat(formData.get('weight_kg')  as string) || null;
    const bust_cm      = parseFloat(formData.get('bust_cm')    as string) || null;
    const waist_cm     = parseFloat(formData.get('waist_cm')   as string) || null;
    const hips_cm      = parseFloat(formData.get('hips_cm')    as string) || null;
    const styleRestrictionsRaw = formData.get('style_restrictions') as string | null;
    const style_restrictions: string[] = styleRestrictionsRaw
      ? JSON.parse(styleRestrictionsRaw)
      : [];
    const style_notes = (formData.get('style_notes') as string | null)?.trim() || null;

    if (!headshot || !bodyPhoto) {
      return NextResponse.json({ error: 'Both headshot and body photo are required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminServerClient();

    // Resolve MIME type — clipboard pastes often have empty type
    function resolveType(file: File): string {
      if (file.type) return file.type;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'png') return 'image/png';
      if (ext === 'webp') return 'image/webp';
      return 'image/jpeg';
    }

    // Read raw buffers
    const headshotBuf = Buffer.from(await headshot.arrayBuffer());
    const bodyBuf     = Buffer.from(await bodyPhoto.arrayBuffer());

    // Upload raw photos immediately so the response isn't blocked
    const headshotKey = `${user.id}/headshot.jpg`;
    const { error: hsErr } = await supabaseAdmin.storage
      .from('client-photos')
      .upload(headshotKey, headshotBuf, { contentType: resolveType(headshot), upsert: true });
    if (hsErr) {
      console.error('Headshot upload error:', hsErr);
      return NextResponse.json({ error: 'Headshot upload failed', detail: hsErr.message }, { status: 500 });
    }

    const bodyKey = `${user.id}/body.jpg`;
    const { error: bpErr } = await supabaseAdmin.storage
      .from('client-photos')
      .upload(bodyKey, bodyBuf, { contentType: resolveType(bodyPhoto), upsert: true });
    if (bpErr) {
      console.error('Body photo upload error:', bpErr);
      return NextResponse.json({ error: 'Body photo upload failed', detail: bpErr.message }, { status: 500 });
    }

    // Enhance photos to studio quality in the background after the response is sent.
    // The enhanced versions overwrite the raw uploads at the same storage paths,
    // so by the time outfits are generated the better images are already in place.
    const headshotMime = resolveType(headshot);
    const bodyMime     = resolveType(bodyPhoto);
    after(async () => {
      try {
        console.log(`[bg] Enhancing client photos and generating visual profile for ${user.id}…`);
        const headshotData = { data: headshotBuf.toString('base64'), mimeType: headshotMime };
        const bodyData     = { data: bodyBuf.toString('base64'),     mimeType: bodyMime };

        // Run photo enhancement and visual profile generation in parallel
        const [{ headshot: enhancedHeadshot, bodyPhoto: enhancedBody }, visualProfile] = await Promise.all([
          enhanceClientPhotos(headshotData, bodyData),
          generateVisualProfile(headshotData, bodyData),
        ]);

        const bgAdmin = createSupabaseAdminServerClient();

        // Upload enhanced photos
        if (enhancedHeadshot) {
          await bgAdmin.storage.from('client-photos').upload(
            headshotKey,
            Buffer.from(enhancedHeadshot.data, 'base64'),
            { contentType: enhancedHeadshot.mimeType, upsert: true },
          );
          console.log(`[bg] Headshot enhanced for ${user.id}`);
        }
        if (enhancedBody) {
          await bgAdmin.storage.from('client-photos').upload(
            bodyKey,
            Buffer.from(enhancedBody.data, 'base64'),
            { contentType: enhancedBody.mimeType, upsert: true },
          );
          console.log(`[bg] Body photo enhanced for ${user.id}`);
        }

        // Save visual profile to DB
        if (visualProfile) {
          await bgAdmin
            .from('client_profiles')
            .update({ visual_profile: visualProfile })
            .eq('user_id', user.id);
          console.log(`[bg] Visual profile saved for ${user.id}`);
        }
      } catch (err) {
        console.error(`[bg] Background processing failed for ${user.id}:`, err);
      }
    });

    // Get signed URLs (private bucket — 1-year expiry for internal use)
    const { data: hsUrl } = await supabaseAdmin.storage
      .from('client-photos').createSignedUrl(headshotKey, 60 * 60 * 24 * 365);
    const { data: bpUrl } = await supabaseAdmin.storage
      .from('client-photos').createSignedUrl(bodyKey, 60 * 60 * 24 * 365);

    // Upsert client_profiles (re-onboarding overwrites previous data)
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('client_profiles')
      .upsert({
        user_id:            user.id,
        name:               name || user.user_metadata?.name || user.email,
        email:              user.email,
        phone,
        headshot_url:       hsUrl?.signedUrl,
        body_photo_url:     bpUrl?.signedUrl,
        height_cm,
        weight_kg,
        bust_cm,
        waist_cm,
        hips_cm,
        style_restrictions,
        style_notes,
        onboarding_complete: true,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (dbError) {
      console.error('Profile upsert error:', dbError);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('Onboard error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
