import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return value === 'true';
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
    return [];
  }
}

function resolveType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminServerClient();

  const { data: client, error } = await admin
    .from('client_profiles')
    .select('*, subscriptions(plan_type, status, created_at)')
    .eq('id', id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json({ client });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const contentType = request.headers.get('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  // Whitelist only editable fields
  const allowed = [
    'name', 'email', 'phone',
    'height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hips_cm',
    'style_notes', 'style_restrictions', 'onboarding_complete',
    'budget_level', 'visual_profile', 'liked_outfit_examples',
  ] as const;

  const updates: Record<string, unknown> = {};

  const admin = createSupabaseAdminServerClient();

  if (isMultipart) {
    const formData = await request.formData();
    const budgetLevel = formData.get('budget_level');

    updates.name = (formData.get('name') as string | null)?.trim() || '';
    updates.email = (formData.get('email') as string | null)?.trim() || '';
    updates.phone = (formData.get('phone') as string | null)?.trim() || null;
    updates.height_cm = parseNullableNumber(formData.get('height_cm'));
    updates.weight_kg = parseNullableNumber(formData.get('weight_kg'));
    updates.bust_cm = parseNullableNumber(formData.get('bust_cm'));
    updates.waist_cm = parseNullableNumber(formData.get('waist_cm'));
    updates.hips_cm = parseNullableNumber(formData.get('hips_cm'));
    updates.style_notes = (formData.get('style_notes') as string | null)?.trim() || null;
    updates.visual_profile = (formData.get('visual_profile') as string | null)?.trim() || null;
    updates.style_restrictions = parseStringArray(formData.get('style_restrictions'));
    updates.liked_outfit_examples = parseStringArray(formData.get('liked_outfit_examples'));
    updates.budget_level =
      budgetLevel === 'low' || budgetLevel === 'mid' || budgetLevel === 'high'
        ? budgetLevel
        : null;
    updates.onboarding_complete = parseBoolean(formData.get('onboarding_complete'));

    const { data: existing, error: existingError } = await admin
      .from('client_profiles')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const basePath = existing.user_id ? `${existing.user_id}` : `admin-clients/${id}`;
    const headshot = formData.get('headshot') as File | null;
    const bodyPhoto = formData.get('body_photo') as File | null;

    if (headshot && headshot.size > 0) {
      const key = `${basePath}/headshot.jpg`;
      const { error: uploadError } = await admin.storage
        .from('client-photos')
        .upload(key, Buffer.from(await headshot.arrayBuffer()), {
          contentType: resolveType(headshot),
          upsert: true,
        });

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
      const key = `${basePath}/body.jpg`;
      const { error: uploadError } = await admin.storage
        .from('client-photos')
        .upload(key, Buffer.from(await bodyPhoto.arrayBuffer()), {
          contentType: resolveType(bodyPhoto),
          upsert: true,
        });

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
  } else {
    const body = await request.json();
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const invalidatesPreferenceProfile = [
    'style_notes',
    'style_restrictions',
    'budget_level',
    'visual_profile',
    'liked_outfit_examples',
    'height_cm',
    'weight_kg',
    'bust_cm',
    'waist_cm',
    'hips_cm',
  ].some(key => key in updates);

  if (invalidatesPreferenceProfile) {
    updates.preference_profile = null;
    updates.preference_profile_version = null;
    updates.preference_profile_updated_at = null;
  }

  updates.updated_at = new Date().toISOString();

  const { data: client, error } = await admin
    .from('client_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save client', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ client });
}
