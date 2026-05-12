import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(entry => typeof entry === 'string' ? entry.trim() : '')
      .filter(Boolean);
  } catch {
    return value
      .split('\n')
      .map(entry => entry.trim())
      .filter(Boolean);
  }
}

function resolveType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminServerClient();
    const { data: profile, error } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: profile ?? null });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminServerClient();
    const { data: existing, error: existingError } = await admin
      .from('client_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const headshot = formData.get('headshot') as File | null;
    const bodyPhoto = formData.get('body_photo') as File | null;

    const budgetLevel = formData.get('budget_level');
    const updates: Record<string, unknown> = {
      name: (formData.get('name') as string | null)?.trim() || user.user_metadata?.name || user.email,
      phone: (formData.get('phone') as string | null)?.trim() || null,
      height_cm: parseNullableNumber(formData.get('height_cm')),
      weight_kg: parseNullableNumber(formData.get('weight_kg')),
      bust_cm: parseNullableNumber(formData.get('bust_cm')),
      waist_cm: parseNullableNumber(formData.get('waist_cm')),
      hips_cm: parseNullableNumber(formData.get('hips_cm')),
      style_notes: (formData.get('style_notes') as string | null)?.trim() || null,
      style_restrictions: parseStringArray(formData.get('style_restrictions')),
      liked_outfit_examples: parseStringArray(formData.get('liked_outfit_examples')),
      budget_level:
        budgetLevel === 'low' || budgetLevel === 'mid' || budgetLevel === 'high'
          ? budgetLevel
          : null,
    };

    if (headshot && headshot.size > 0) {
      const key = `${user.id}/headshot.jpg`;
      const buffer = Buffer.from(await headshot.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from('client-photos')
        .upload(key, buffer, { contentType: resolveType(headshot), upsert: true });

      if (uploadError) {
        return NextResponse.json(
          { error: 'Headshot upload failed', detail: uploadError.message },
          { status: 500 },
        );
      }

      const { data: signed } = await admin.storage
        .from('client-photos')
        .createSignedUrl(key, 60 * 60 * 24 * 365);
      updates.headshot_url = signed?.signedUrl ?? null;
      updates.visual_profile = null;
    }

    if (bodyPhoto && bodyPhoto.size > 0) {
      const key = `${user.id}/body.jpg`;
      const buffer = Buffer.from(await bodyPhoto.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from('client-photos')
        .upload(key, buffer, { contentType: resolveType(bodyPhoto), upsert: true });

      if (uploadError) {
        return NextResponse.json(
          { error: 'Body photo upload failed', detail: uploadError.message },
          { status: 500 },
        );
      }

      const { data: signed } = await admin.storage
        .from('client-photos')
        .createSignedUrl(key, 60 * 60 * 24 * 365);
      updates.body_photo_url = signed?.signedUrl ?? null;
      updates.visual_profile = null;
    }

    updates.preference_profile = null;
    updates.preference_profile_version = null;
    updates.preference_profile_updated_at = null;
    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await admin
      .from('client_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save profile', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('Profile save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
