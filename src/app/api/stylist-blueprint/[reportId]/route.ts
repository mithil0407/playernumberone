import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { loadStylistBlueprintReportByIdFresh, getStylistBlueprintReportById } from '@/lib/stylistBlueprintLoader';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  isVersionedStylistBlueprintReportData,
  validateStylistBlueprintReport,
  type BlueprintPage,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';

function authed(cookieValue: string | undefined) {
  return isAdminAuthenticatedFromCookieValue(cookieValue);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const fresh = request.nextUrl.searchParams.get('fresh') === '1';
  const report = fresh
    ? await loadStylistBlueprintReportByIdFresh(reportId)
    : await getStylistBlueprintReportById(reportId);

  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json();
  const allowedStatuses = new Set(['pending', 'generating', 'draft_ready', 'in_review', 'approved', 'sent', 'error']);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) {
    if (!allowedStatuses.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    patch.status = body.status;
    if (body.status === 'sent') patch.sent_at = new Date().toISOString();
  }
  if (body.section_approvals) patch.section_approvals = body.section_approvals;
  if (body.page_approvals) patch.section_approvals = body.page_approvals;
  if (body.report_data) patch.report_data = body.report_data;
  if (body.page) {
    const { data: existing } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('report_data')
      .eq('id', reportId)
      .single();
    const reportData = existing?.report_data as StylistBlueprintReportData | null;
    if (!isVersionedStylistBlueprintReportData(reportData)) {
      return NextResponse.json({ error: 'Page updates require a v1 Blueprint report' }, { status: 400 });
    }
    const incoming = body.page as BlueprintPage;
    const pages = reportData.pages.map(page => page.page_number === incoming.page_number ? incoming : page);
    const nextData = { ...reportData, pages };
    validateStylistBlueprintReport(nextData);
    patch.report_data = nextData;
  }
  if (body.error_message !== undefined) patch.error_message = body.error_message;

  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update(patch)
    .eq('id', reportId)
    .select('id, share_token, status, sent_at, section_approvals, report_data')
    .single();

  if (error || !data) {
    console.error('[stylist-blueprint PATCH] error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }

  await revalidateStylistBlueprintCache(reportId, data.share_token);
  return NextResponse.json({ report: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'approve_all') {
    const sectionApprovals = Object.fromEntries(Array.from({ length: 28 }, (_, index) => [`p${index + 1}`, true]));
    const { data, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ section_approvals: sectionApprovals, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('id, share_token, section_approvals')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Failed to approve report' }, { status: 500 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data });
  }

  if (action === 'send') {
    const { data, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('id, share_token, status, sent_at')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data });
  }

  if (action === 'mark_in_review') {
    const { data, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'in_review', updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('id, share_token, status')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
