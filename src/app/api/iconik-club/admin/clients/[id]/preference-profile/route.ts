import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { generatePreferenceProfile, WOMEN_OUTFIT_ENGINE_VERSION } from '@/lib/outfitGenerator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminServerClient();

  const { data: profile, error } = await admin
    .from('client_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  try {
    const { preferenceProfile } = await generatePreferenceProfile({
      liked_outfit_examples: profile.liked_outfit_examples ?? [],
      style_notes: profile.style_notes ?? null,
      visual_profile: profile.visual_profile ?? null,
      style_restrictions: profile.style_restrictions ?? [],
      budget_level: profile.budget_level ?? null,
      height_cm: profile.height_cm ?? undefined,
      weight_kg: profile.weight_kg ?? undefined,
      bust_cm: profile.bust_cm ?? undefined,
      waist_cm: profile.waist_cm ?? undefined,
      hips_cm: profile.hips_cm ?? undefined,
      preference_profile: null,
      preference_profile_version: null,
    });

    const { data: updated, error: updateError } = await admin
      .from('client_profiles')
      .update({
        preference_profile: preferenceProfile,
        preference_profile_version: WOMEN_OUTFIT_ENGINE_VERSION,
        preference_profile_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ preference_profile: preferenceProfile, client: updated });
  } catch (err) {
    console.error('Preference profile generation failed:', err);
    return NextResponse.json({ error: 'Preference profile generation failed' }, { status: 500 });
  }
}
