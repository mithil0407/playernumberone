import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ReportData } from '@/lib/manReportGenerator';
import { loadManReportOutfitFeedback, saveManReportOutfitFeedback, type ManOutfitVerdict } from '@/lib/manOutfitFeedback';

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** The stylist's 👍 / 👎 on each outfit of this report, plus why each look was picked. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { reportId } = await params;

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data')
    .eq('id', reportId)
    .single();
  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  const reportData = report.report_data as ReportData | null;
  const feedback = await loadManReportOutfitFeedback(reportId);
  return NextResponse.json({
    available: feedback.available,
    feedback: feedback.rows,
    libraryVersion: reportData?.outfit_library?.version ?? null,
    assignments: reportData?.outfit_library?.assignments ?? [],
    profile: reportData?.classification?.recommendation_profile ?? null,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { reportId } = await params;

  let body: { outfitNumber?: unknown; verdict?: unknown; reasons?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const outfitNumber = Number(body.outfitNumber);
  if (!Number.isInteger(outfitNumber) || outfitNumber < 1 || outfitNumber > 40) {
    return NextResponse.json({ error: 'outfitNumber must be 1-40' }, { status: 400 });
  }
  const verdict = body.verdict === 'up' || body.verdict === 'down' ? body.verdict as ManOutfitVerdict : null;
  if (body.verdict !== null && body.verdict !== undefined && !verdict) {
    return NextResponse.json({ error: 'verdict must be up, down or null' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data')
    .eq('id', reportId)
    .single();
  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const assignment = (report.report_data as ReportData | null)?.outfit_library?.assignments
    ?.find(item => item.outfitNumber === outfitNumber);

  const saved = await saveManReportOutfitFeedback({
    reportId,
    outfitNumber,
    verdict,
    libraryLookId: assignment?.libraryLookId ?? null,
    context: assignment?.context ?? null,
    reasons: body.reasons,
    note: body.note,
  });
  if (!saved.ok) {
    return NextResponse.json({
      error: saved.missingTable
        ? 'Outfit ratings need the database migration add_man_style_profile_and_outfit_feedback.sql to be run first.'
        : saved.error,
    }, { status: saved.missingTable ? 503 : 500 });
  }

  const feedback = await loadManReportOutfitFeedback(reportId);
  return NextResponse.json({ ok: true, feedback: feedback.rows });
}
