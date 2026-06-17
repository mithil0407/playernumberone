import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.status === 'draft_ready' || body.status === 'in_review' || body.status === 'approved' || body.status === 'sent') {
    patch.status = body.status;
  }
  if (body.page_data && typeof body.page_data === 'object') {
    patch.page_data = body.page_data;
  }
  if (body.status === 'approved') {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = 'admin';
  }
  if (body.status === 'sent') {
    patch.sent_at = new Date().toISOString();
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('man_edit_monthly_recommendations')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendation: data });
}
