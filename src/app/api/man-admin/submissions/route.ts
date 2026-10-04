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
  // Bucket filter (todo | working | review | sent | failed) or a raw report status.
  const status = searchParams.get('status') ?? '';

  try {
    // The whole Man intake list is a few hundred rows, so filter and count
    // in memory: the buckets depend on each submission's latest report, which
    // a paginated SQL query can't filter on.
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
        man_reports(id, status, progress_stage, share_token, generated_at, sent_at, error_message, created_at, updated_at, report_kind)
      `)
      .order('created_at', { ascending: false })
      .range(0, 4999);

    if (search) {
      const safeSearch = search.replace(/[(),]/g, ' ');
      query = query.or(`customer_email.ilike.%${safeSearch}%,customer_phone.ilike.%${safeSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('man-admin submissions list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Each submission can have multiple report rows; pick the most recent
    // Blueprint. Monthly Edit issues share the submission but aren't Blueprints.
    const submissions = (data ?? []).map(row => {
      const reports = (row.man_reports as Array<ManReportRow & { report_kind?: string }> ?? [])
        .filter(report => report.report_kind !== 'edit')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestReport = reports[0] ?? null;
      return { ...row, man_reports: undefined, latest_report: latestReport };
    });

    const counts: Record<ManSubmissionBucket, number> = { todo: 0, working: 0, review: 0, sent: 0, failed: 0 };
    for (const submission of submissions) counts[submissionBucket(submission.latest_report)]++;

    const filtered = status
      ? submissions.filter(s => {
          if (isBucket(status)) return submissionBucket(s.latest_report) === status;
          if (status === 'none') return !s.latest_report;
          return s.latest_report?.status === status;
        })
      : submissions;

    return NextResponse.json({
      submissions: filtered.slice(from, to + 1),
      total: filtered.length,
      allTotal: submissions.length,
      counts,
      page,
      limit,
    });
  } catch (err) {
    console.error('man-admin submissions API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type ManSubmissionBucket = 'todo' | 'working' | 'review' | 'sent' | 'failed';

function isBucket(value: string): value is ManSubmissionBucket {
  return value === 'todo' || value === 'working' || value === 'review' || value === 'sent' || value === 'failed';
}

function submissionBucket(report: Pick<ManReportRow, 'status'> | null): ManSubmissionBucket {
  if (!report) return 'todo';
  if (report.status === 'generating' || report.status === 'pending') return 'working';
  if (report.status === 'sent') return 'sent';
  if (report.status === 'error') return 'failed';
  return 'review';
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
  updated_at: string | null;
}
