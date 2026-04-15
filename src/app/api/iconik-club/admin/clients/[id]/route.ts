import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

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
  const body = await request.json();

  // Whitelist only editable fields
  const allowed = [
    'name', 'email', 'phone',
    'height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hips_cm',
    'style_notes', 'style_restrictions', 'onboarding_complete',
    'budget_level', 'visual_profile', 'liked_outfit_examples',
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
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

  const admin = createSupabaseAdminServerClient();
  const { data: client, error } = await admin
    .from('client_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client });
}
