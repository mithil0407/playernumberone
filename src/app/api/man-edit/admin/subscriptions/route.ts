import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
  const status = request.nextUrl.searchParams.get('status')?.trim() ?? '';

  let query = supabaseAdmin
    .from('man_edit_subscriptions')
    .select('*, man_edit_profiles(id,status,profile_summary,last_built_at,error_message), man_edit_monthly_recommendations(id,status,month_start,issue_number,page_data,sent_at,created_at)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) query = query.ilike('customer_email', `%${search}%`);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ subscriptions: data ?? [] });
}
