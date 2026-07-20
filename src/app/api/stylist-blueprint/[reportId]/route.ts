import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { loadStylistBlueprintReportByIdFresh, getStylistBlueprintReportById } from '@/lib/stylistBlueprintLoader';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { sendStylistBlueprintReportEmail } from '@/lib/email';
import {
  getStylistBlueprintPageCount,
  getStylistOutfitCulturalMode,
  isVersionedStylistBlueprintReportData,
  validateStylistBlueprintReport,
  type BlueprintPage,
  type StylistIntakeSubmission,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';

function firstString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const allowedStatuses = new Set(['pending', 'generating', 'draft_ready', 'in_review', 'approved', 'sent', 'delivered', 'error']);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const expectedRevision = Number(body.expectedRevision);
  const { data: currentRevisionRow, error: revisionError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('revision')
    .eq('id', reportId)
    .single();
  if (revisionError || !currentRevisionRow) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  if (Number.isInteger(expectedRevision)) {
    if (currentRevisionRow.revision !== expectedRevision) {
      return NextResponse.json({ error: 'This report changed in another session. Reload before saving.', conflict: true }, { status: 409 });
    }
  }
  patch.revision = Number(currentRevisionRow.revision ?? 0) + 1;

  if (body.status) {
    if (!allowedStatuses.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    patch.status = body.status;
    if (body.status === 'sent') patch.sent_at = new Date().toISOString();
  }
  if (body.section_approvals) patch.section_approvals = body.section_approvals;
  if (body.page_approvals) {
    patch.section_approvals = body.page_approvals;
    if (Object.values(body.page_approvals as Record<string, unknown>).some(value => value === false)) {
      patch.published_at = null;
      patch.delivered_at = null;
      patch.status = 'in_review';
    }
  }
  if (body.report_data) {
    patch.report_data = body.report_data;
    patch.published_at = null;
    patch.delivered_at = null;
    patch.status = 'in_review';
  }
  if (body.clear_progress_stage) patch.progress_stage = null;
  if (body.page) {
    const { data: existing } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('report_data, section_approvals, submission_id, stylist_intake_responses(*)')
      .eq('id', reportId)
      .single();
    const reportData = existing?.report_data as StylistBlueprintReportData | null;
    if (!isVersionedStylistBlueprintReportData(reportData)) {
      return NextResponse.json({ error: 'Page updates require a v1 Blueprint report' }, { status: 400 });
    }
    const incoming = body.page as BlueprintPage;
    const pages = reportData.pages.map(page => page.page_number === incoming.page_number ? incoming : page);
    const nextData = { ...reportData, pages };
    try {
      validateStylistBlueprintReport(nextData, {
        culturalMode: getStylistOutfitCulturalMode(existing?.stylist_intake_responses as unknown as StylistIntakeSubmission | null),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid report page data';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    patch.report_data = nextData;
    patch.published_at = null;
    patch.delivered_at = null;
    patch.status = 'in_review';
    patch.section_approvals = {
      ...((existing?.section_approvals as Record<string, boolean> | null) ?? {}),
      [`p${incoming.page_number}`]: false,
    };
  }
  if (body.error_message !== undefined) patch.error_message = body.error_message;

  let updateQuery = supabaseAdmin
    .from('stylist_blueprint_reports')
    .update(patch)
    .eq('id', reportId);
  if (Number.isInteger(expectedRevision)) updateQuery = updateQuery.eq('revision', expectedRevision);
  const { data, error } = await updateQuery
    .select('id, share_token, status, sent_at, published_at, delivered_at, revision, section_approvals, report_data')
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
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'approve_all') {
    const { data: existing, error: loadError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('report_data')
      .eq('id', reportId)
      .single();
    if (loadError || !existing) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    const pageCount = isVersionedStylistBlueprintReportData(existing.report_data)
      ? getStylistBlueprintPageCount(existing.report_data)
      : 28;
    const sectionApprovals = Object.fromEntries(Array.from({ length: pageCount }, (_, index) => [`p${index + 1}`, true]));
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
    const { data: existingReport, error: existingError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, sent_at, share_token, report_data, stylist_intake_responses(customer_email, full_name)')
      .eq('id', reportId)
      .single();

    if (existingError || !existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const intake = firstRelation(existingReport.stylist_intake_responses as
      | { customer_email?: string | null; full_name?: string | null }
      | Array<{ customer_email?: string | null; full_name?: string | null }>
      | null);
    const recipientEmail = intake?.customer_email?.trim() ?? '';
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Client email is missing on the intake submission' }, { status: 400 });
    }

    const reportData = existingReport.report_data as StylistBlueprintReportData | null;
    const reportUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in').replace(/\/$/, '')}/stylist/report/${existingReport.share_token}`;
    const emailResult = await sendStylistBlueprintReportEmail({
      email: recipientEmail,
      reportUrl,
      clientName: firstString(
        isVersionedStylistBlueprintReportData(reportData) ? reportData.client.display_name : null,
        reportData?.classification?.client?.name,
        intake?.full_name,
      ),
      bodyProfile: firstString(
        isVersionedStylistBlueprintReportData(reportData) ? reportData.analysis.silhouette_profile : null,
        reportData?.classification?.body?.geometry,
        reportData?.classification?.body?.proportion_directive,
      ),
      colourProfile: firstString(
        isVersionedStylistBlueprintReportData(reportData) ? reportData.analysis.chromatic_family : null,
        reportData?.classification?.colour?.palette_name,
        reportData?.classification?.colour?.undertone_direction,
      ),
      faceProfile: firstString(
        isVersionedStylistBlueprintReportData(reportData) ? reportData.analysis.facial_architecture : null,
        reportData?.classification?.face_hair_accessories?.face_shape,
        reportData?.classification?.face_hair_accessories?.face_direction,
      ),
      styleDirection: firstString(
        isVersionedStylistBlueprintReportData(reportData) ? reportData.analysis.style_direction : null,
        reportData?.classification?.taste?.style_archetype,
        reportData?.classification?.taste?.moodboard,
      ),
    });

    if (!emailResult.success) {
      const message = `Client email failed: ${emailResult.error ?? 'Unknown error'}`;
      await supabaseAdmin
        .from('stylist_blueprint_reports')
        .update({ error_message: message, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      await revalidateStylistBlueprintCache(reportId, existingReport.share_token);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const sentAt = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'sent', sent_at: sentAt, error_message: null, updated_at: sentAt })
      .eq('id', reportId)
      .select('id, share_token, status, sent_at, error_message')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data, reportUrl });
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
