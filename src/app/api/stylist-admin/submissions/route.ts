import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';

interface StylistBlueprintReportRow {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('stylist_intake_responses')
    .select(`
      id,
      order_id,
      customer_email,
      customer_phone,
      full_name,
      country,
      selected_moodboard_label,
      completion_percentage,
      completed_at,
      created_at,
      stylist_blueprint_reports(id, status, progress_stage, share_token, generated_at, sent_at, error_message, created_at)
    `, { count: 'exact' })
    .not('completed_at', 'is', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) query = query.ilike('customer_email', `%${search}%`);

  const { data, error, count } = await query;
  if (error) {
    console.error('stylist-admin submissions list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const submissions = (data ?? []).map(row => {
    const reports = ((row.stylist_blueprint_reports as StylistBlueprintReportRow[] | null) ?? [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { ...row, stylist_blueprint_reports: undefined, latest_report: reports[0] ?? null };
  });

  const filtered = status
    ? submissions.filter(item => {
      if (status === 'none') return !item.latest_report;
      return item.latest_report?.status === status;
    })
    : submissions;

  return NextResponse.json({ submissions: filtered, total: count ?? 0, page, limit });
}
