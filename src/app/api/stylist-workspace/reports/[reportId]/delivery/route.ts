import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getStylistBlueprintContinuationPage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintTransformationPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
  validateStylistBlueprintReport,
} from '@/lib/stylistBlueprintGenerator';
import { checkStudioReportQuality } from '@/lib/stylistReportStudio';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity, isAdminCookieAuthenticated, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { buildWhatsappUrl, normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro').replace(/\/$/, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if ((!identity && !(await isAdminCookieAuthenticated())) || !(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { action?: string };
  const action = body.action ?? 'prepare';
  if (!['prepare', 'confirm', 'copied', 'opened'].includes(action)) return NextResponse.json({ error: 'Invalid delivery action' }, { status: 400 });
  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, progress_stage, updated_at, report_data, image_urls, share_token, section_approvals, published_at, submission_id, stylist_intake_responses(id, consultation_id, customer_phone, full_name, source_photo_paths, intake_source)')
    .eq('id', reportId)
    .single();
  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const intake = Array.isArray(report.stylist_intake_responses)
    ? report.stylist_intake_responses[0]
    : report.stylist_intake_responses;
  if (!intake?.consultation_id) return NextResponse.json({ error: 'Consultation link is missing' }, { status: 400 });
  if (action === 'prepare' && !normalizeIndianWhatsappNumber(intake.customer_phone || '')) {
    return NextResponse.json({ error: 'Add a valid Indian mobile number before WhatsApp delivery' }, { status: 400 });
  }

  if (action === 'confirm') {
    if (!report.published_at) return NextResponse.json({ error: 'Publish the report first' }, { status: 400 });
    const now = new Date().toISOString();
    const { data: delivered, error: updateError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'delivered', delivered_at: now, updated_at: now })
      .eq('id', reportId)
      .eq('updated_at', report.updated_at)
      .eq('published_at', report.published_at)
      .select('id')
      .maybeSingle();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    if (!delivered) return NextResponse.json({ error: 'The report changed during delivery. Review and publish it again.' }, { status: 409 });
    await supabaseAdmin
      .from('consultations')
      .update({ status: 'delivered', delivered_at: now, updated_at: now })
      .eq('id', intake.consultation_id);
    await logStylistReportActivity({
      action: 'whatsapp_delivery_confirmed', reportId, consultationId: intake.consultation_id, stylistId: identity?.stylistId,
    });
    await revalidateStylistBlueprintCache(reportId, report.share_token);
    return NextResponse.json({ success: true, status: 'delivered', deliveredAt: now });
  }

  if (action === 'copied' || action === 'opened') {
    await logStylistReportActivity({
      action: action === 'copied' ? 'report_link_copied' : 'whatsapp_opened',
      reportId,
      consultationId: intake.consultation_id,
      stylistId: identity?.stylistId,
    });
  }

  if (action === 'prepare') {
    const reportData = report.report_data as StylistBlueprintReportData | null;
    if (!isVersionedStylistBlueprintReportData(reportData)) {
      return NextResponse.json({ error: 'The report is not ready to publish' }, { status: 400 });
    }
    if (report.status === 'generating' || report.progress_stage) {
      return NextResponse.json({ error: 'Finish report generation before publishing' }, { status: 400 });
    }
    // Everything below is reported, never enforced. The stylist is looking at
    // the finished report and is the one who decides it is ready; a checklist
    // that disagrees with her has been wrong often enough to strand reports
    // that were fine. Each unmet check is recorded on the publish log instead,
    // so a report that shipped incomplete is still traceable afterwards.
    const publishWarnings: string[] = [];
    try {
      validateStylistBlueprintReport(reportData);
    } catch (error) {
      publishWarnings.push(error instanceof Error ? error.message : 'Report structure checks failed');
    }
    if (reportData.studio) {
      for (const issue of checkStudioReportQuality(reportData)) {
        if (issue.level === 'error') publishWarnings.push(issue.message);
      }
      if (!reportData.studio.analysis_confirmed) publishWarnings.push('Analysis was not confirmed');
    }
    const continuationPage = getStylistBlueprintContinuationPage(reportData);
    const hiddenPages = new Set(reportData.studio?.hidden_page_numbers ?? []);
    const visiblePages = reportData.pages.filter(page => page.page_number !== continuationPage && !hiddenPages.has(page.page_number));
    const approvals = report.section_approvals as Record<string, boolean> | null;
    const unapprovedPages = visiblePages.filter(page => approvals?.[`p${page.page_number}`] !== true).length;
    if (unapprovedPages) publishWarnings.push(`${unapprovedPages} page${unapprovedPages === 1 ? '' : 's'} were not approved`);
    const sourcePaths = (intake.source_photo_paths ?? {}) as Record<string, string>;
    // Reported, never enforced. An empty image slot renders as a placeholder
    // rather than a broken page, so it is the stylist's call whether to ship
    // without it — blocking here only ever stranded finished reports.
    const imageCounts = getStylistBlueprintImageCounts(report.image_urls as StylistBlueprintImagePaths | null, {
      hasFrontPhoto: Boolean(sourcePaths.full_body_front),
      hasSidePhoto: Boolean(sourcePaths.full_body_side),
      hasHeadshot: Boolean(sourcePaths.headshot),
      hasClientPhoto: Boolean(sourcePaths.full_body_front || sourcePaths.full_body_side || sourcePaths.headshot || sourcePaths.one_outfit),
      outfitCount: getStylistBlueprintOutfitCount(reportData),
      includeClosingEditTeaser: false,
      includeTransformationPreview: Boolean(getStylistBlueprintTransformationPage(reportData)),
      includeBeautyPages: Boolean(getStylistBlueprintHairColourPage(reportData)),
      reportData,
    });
    const missingImages = Object.values(imageCounts).reduce((sum, group) => sum + Math.max(0, group.total - group.done), 0);
    const publishedAt = new Date().toISOString();
    const { data: published, error: publishError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'approved', published_at: publishedAt, updated_at: publishedAt })
      .eq('id', reportId)
      .eq('updated_at', report.updated_at)
      .select('id')
      .maybeSingle();
    if (publishError) return NextResponse.json({ error: 'Could not publish report' }, { status: 500 });
    if (!published) return NextResponse.json({ error: 'The report changed during publication. Review it again.' }, { status: 409 });
    await logStylistReportActivity({
      action: 'report_published', reportId, consultationId: intake.consultation_id, stylistId: identity?.stylistId,
      // Recorded rather than enforced, so a report that shipped with empty
      // image slots or unmet checks is still traceable afterwards.
      ...(missingImages || publishWarnings.length
        ? { metadata: { ...(missingImages ? { missingImages } : {}), ...(publishWarnings.length ? { publishWarnings } : {}) } }
        : {}),
    });
    await revalidateStylistBlueprintCache(reportId, report.share_token);
  }

  const reportUrl = `${siteUrl()}/stylist/report/${report.share_token}`;
  const message = `Hi ${intake.full_name || 'there'}, your personalised ICONIK Style Blueprint is ready. You can view it here: ${reportUrl}`;
  const whatsappUrl = buildWhatsappUrl(intake.customer_phone || '', message);
  if (!whatsappUrl) return NextResponse.json({ error: 'A valid Indian mobile number is required' }, { status: 400 });
  return NextResponse.json({ reportUrl, whatsappUrl, clientName: intake.full_name, published: true });
}
