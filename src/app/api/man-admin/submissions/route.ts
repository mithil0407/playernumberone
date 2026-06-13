import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit  = 20;
  const from   = (page - 1) * limit;
  const to     = from + limit - 1;
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? ''; // report status filter

  try {
    let query = supabaseAdmin
      .from('man_intake_submissions')
      .select(`
        id,
        customer_email,
        customer_phone,
        face_shape,
        body_shape,
        derived_colour_season,
        primary_goal,
        location_tier,
        photo_fullbody_url,
        photo_headshot_url,
        created_at,
        man_reports(id, status, progress_stage, share_token, generated_at, sent_at, error_message, created_at)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('customer_email', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('man-admin submissions list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Each submission can have multiple report rows; pick the most recent one
    const submissions = (data ?? []).map(row => {
      const reports = (row.man_reports as ManReportRow[] ?? [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestReport = reports[0] ?? null;
      return { ...row, man_reports: undefined, latest_report: latestReport };
    });

    // Filter by report status after the JOIN (simpler than a complex SQL filter)
    const filtered = status
      ? submissions.filter(s => {
          if (status === 'none') return !s.latest_report;
          return s.latest_report?.status === status;
        })
      : submissions;

    return NextResponse.json({ submissions: filtered, total: count ?? 0, page, limit });
  } catch (err) {
    console.error('man-admin submissions API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ManReportRow {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}
