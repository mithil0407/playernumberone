import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? '';
  const week = searchParams.get('week') ?? '';
  const search = searchParams.get('search')?.trim() ?? '';

  let query = supabaseAdmin
    .from('style_edit_issues')
    .select('id, profile_id, subscription_id, week_start, issue_number, status, progress_stage, topic_plan, share_token, approval_state, generated_at, sent_at, error_message, created_at, style_edit_client_profiles(customer_email, customer_name, status, profile_summary)')
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (week) query = query.eq('week_start', week);

  const { data, error } = await query;
  if (error) {
    console.error('[style-edit issues] list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const issues = search
    ? (data ?? []).filter(issue => {
      const profile = Array.isArray(issue.style_edit_client_profiles)
        ? issue.style_edit_client_profiles[0]
        : issue.style_edit_client_profiles;
      const haystack = `${profile?.customer_email ?? ''} ${profile?.customer_name ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    : data ?? [];

  return NextResponse.json({ issues });
}
