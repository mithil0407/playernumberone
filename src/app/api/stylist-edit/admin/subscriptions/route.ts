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
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('style_edit_subscriptions')
    .select('*, style_edit_client_profiles(id, status, profile_summary, next_issue_at, last_built_at, error_message), style_edit_issues(id, status, week_start, issue_number, topic_plan, sent_at, created_at)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) query = query.ilike('customer_email', `%${search}%`);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('[style-edit subscriptions] list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data ?? [] });
}
