import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobeServer } from '@/lib/serverSupabaseGlobe';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [submissionRes, reportsRes] = await Promise.all([
      supabaseGlobeServer
        .from('globe_intake_submissions')
        .select('*')
        .eq('id', id)
        .single(),
      supabaseGlobeServer
        .from('globe_reports')
        .select('id, status, progress_stage, share_token, generated_at, sent_at, error_message, section_approvals, created_at')
        .eq('submission_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (submissionRes.error) {
      if (submissionRes.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw submissionRes.error;
    }

    return NextResponse.json({
      submission: submissionRes.data,
      reports: reportsRes.data ?? [],
    });
  } catch (err) {
    console.error('globe-admin submission detail API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
