// POST /api/man-report/[reportId]/shopping/fetch
//
// Starts (or resumes) the shopping-links pipeline for a report. Responds 202
// immediately and runs the pipeline in the background via after(). Serves both
// the automatic Section-4-approval trigger and the manual "Fetch / Retry links"
// button in the review screen.
//
// Body (optional): { onlySlotKeys?: string[] } — restrict to specific slots.

import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  diffStaleSlotKeys,
  isShoppingFetchInFlight,
  type ManShoppingSlotKey,
  type ManShoppingState,
} from '@/lib/manShopping';
import { runManShoppingPipeline } from '@/lib/manShoppingPipeline';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const onlySlotKeys = Array.isArray(body?.onlySlotKeys)
    ? (body.onlySlotKeys.filter((key: unknown) => typeof key === 'string') as ManShoppingSlotKey[])
    : undefined;

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, report_data, shopping_data')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const s4Text = (report.report_data as ReportData | null)?.sections?.s4_outfits ?? '';
  if (!s4Text.trim()) {
    return NextResponse.json({ error: 'Report has no Section 4 outfits yet' }, { status: 400 });
  }

  const state = report.shopping_data as ManShoppingState | null;

  if (isShoppingFetchInFlight(state)) {
    return NextResponse.json({ status: 'already_running', reportId }, { status: 202 });
  }

  const staleKeys = onlySlotKeys ?? diffStaleSlotKeys(state, s4Text);
  if (staleKeys.length === 0 && state?.status === 'ready') {
    return NextResponse.json({ status: 'up_to_date', reportId });
  }

  after(async () => {
    await runManShoppingPipeline(reportId, { onlySlotKeys });
  });

  return NextResponse.json(
    { status: 'started', reportId, slotCount: staleKeys.length },
    { status: 202 },
  );
}
