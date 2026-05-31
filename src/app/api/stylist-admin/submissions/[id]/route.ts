import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [submissionRes, reportsRes] = await Promise.all([
    supabaseAdmin
      .from('stylist_intake_responses')
      .select('*, stylist_orders(id, amount, currency, status, razorpay_payment_id, created_at)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, share_token, generated_at, sent_at, error_message, section_approvals, created_at')
      .eq('submission_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (submissionRes.error) {
    if (submissionRes.error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('stylist-admin submission detail error:', submissionRes.error);
    return NextResponse.json({ error: submissionRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    submission: submissionRes.data,
    reports: reportsRes.data ?? [],
  });
}
