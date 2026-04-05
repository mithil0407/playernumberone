import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { generateVisualProfile } from '@/lib/outfitCompositor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: profileId } = await params;
  const admin = createSupabaseAdminServerClient();

  // Load profile to know which storage path to use
  const { data: profile, error: profileErr } = await admin
    .from('client_profiles')
    .select('id, user_id')
    .eq('id', profileId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Self-onboarded clients store photos under their auth user_id;
  // admin-created clients store under admin-clients/<profileId>
  const basePath = profile.user_id
    ? `${profile.user_id}`
    : `admin-clients/${profileId}`;

  const [hsDownload, bpDownload] = await Promise.all([
    admin.storage.from('client-photos').download(`${basePath}/headshot.jpg`),
    admin.storage.from('client-photos').download(`${basePath}/body.jpg`),
  ]);

  if (!hsDownload.data && !bpDownload.data) {
    return NextResponse.json({ error: 'No client photos found in storage' }, { status: 422 });
  }

  let headshotData: { data: string; mimeType: string } | null = null;
  let bodyData: { data: string; mimeType: string } | null = null;

  if (hsDownload.data) {
    const buf = Buffer.from(await hsDownload.data.arrayBuffer());
    headshotData = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  }
  if (bpDownload.data) {
    const buf = Buffer.from(await bpDownload.data.arrayBuffer());
    bodyData = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  }

  const visualProfile = await generateVisualProfile(headshotData, bodyData);

  if (!visualProfile) {
    return NextResponse.json({ error: 'Visual profile generation failed — Gemini returned no output' }, { status: 500 });
  }

  const { data: updated, error: updateErr } = await admin
    .from('client_profiles')
    .update({ visual_profile: visualProfile })
    .eq('id', profileId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ visual_profile: visualProfile, client: updated });
}
