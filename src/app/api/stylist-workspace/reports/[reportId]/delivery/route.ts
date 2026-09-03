import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getStylistBlueprintContinuationPage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintTransformationPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
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
  if (!identity || !(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { action?: string };
  const action = body.action ?? 'prepare';
  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, report_data, image_urls, share_token, section_approvals, published_at, submission_id, stylist_intake_responses(id, consultation_id, customer_phone, full_name, source_photo_paths, intake_source)')
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
    const { error: updateError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'delivered', delivered_at: now, updated_at: now })
      .eq('id', reportId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    await supabaseAdmin
      .from('consultations')
      .update({ status: 'delivered', delivered_at: now, updated_at: now })
      .eq('id', intake.consultation_id);
    await logStylistReportActivity({
      action: 'whatsapp_delivery_confirmed', reportId, consultationId: intake.consultation_id, stylistId: identity.stylistId,
    });
    await revalidateStylistBlueprintCache(reportId, report.share_token);
    return NextResponse.json({ success: true, status: 'delivered', deliveredAt: now });
  }

  if (action === 'copied' || action === 'opened') {
    await logStylistReportActivity({
      action: action === 'copied' ? 'report_link_copied' : 'whatsapp_opened',
      reportId,
      consultationId: intake.consultation_id,
      stylistId: identity.stylistId,
    });
  }

  if (action === 'prepare' && !report.published_at) {
    const reportData = report.report_data as StylistBlueprintReportData | null;
    if (!isVersionedStylistBlueprintReportData(reportData)) {
      return NextResponse.json({ error: 'The report is not ready to publish' }, { status: 400 });
    }
    if (reportData.studio && !reportData.studio.analysis_confirmed) {
      return NextResponse.json({ error: 'Confirm the body, colour and face analysis before publishing' }, { status: 400 });
    }
    const continuationPage = getStylistBlueprintContinuationPage(reportData);
    const hiddenPages = new Set(reportData.studio?.hidden_page_numbers ?? []);
    const visiblePages = reportData.pages.filter(page => page.page_number !== continuationPage && !hiddenPages.has(page.page_number));
    const approvals = report.section_approvals as Record<string, boolean> | null;
    if (!visiblePages.every(page => Boolean(approvals?.[`p${page.page_number}`]))) {
      return NextResponse.json({ error: 'Approve every report page before publishing' }, { status: 400 });
    }
    const sourcePaths = (intake.source_photo_paths ?? {}) as Record<string, string>;
    const imageCounts = getStylistBlueprintImageCounts(report.image_urls as StylistBlueprintImagePaths | null, {
      hasFrontPhoto: Boolean(sourcePaths.full_body_front),
      hasSidePhoto: Boolean(sourcePaths.full_body_side),
      hasHeadshot: Boolean(sourcePaths.headshot),
      hasClientPhoto: Boolean(sourcePaths.full_body_front || sourcePaths.full_body_side || sourcePaths.headshot || sourcePaths.one_outfit),
      outfitCount: getStylistBlueprintOutfitCount(reportData),
      includeClosingEditTeaser: false,
      includeTransformationPreview: Boolean(getStylistBlueprintTransformationPage(reportData)),
      includeBeautyPages: Boolean(getStylistBlueprintHairColourPage(reportData)),
    });
    if (!Object.values(imageCounts).every(group => group.done >= group.total)) {
      return NextResponse.json({ error: 'Upload every required image before publishing', imageCounts }, { status: 400 });
    }
    const publishedAt = new Date().toISOString();
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'approved', published_at: publishedAt, updated_at: publishedAt })
      .eq('id', reportId);
    await logStylistReportActivity({
      action: 'report_published', reportId, consultationId: intake.consultation_id, stylistId: identity.stylistId,
    });
    await revalidateStylistBlueprintCache(reportId, report.share_token);
  }

  const reportUrl = `${siteUrl()}/stylist/report/${report.share_token}`;
  const message = `Hi ${intake.full_name || 'there'}, your personalised ICONIK Style Blueprint is ready. You can view it here: ${reportUrl}`;
  const whatsappUrl = buildWhatsappUrl(intake.customer_phone || '', message);
  if (!whatsappUrl) return NextResponse.json({ error: 'A valid Indian mobile number is required' }, { status: 400 });
  return NextResponse.json({ reportUrl, whatsappUrl, clientName: intake.full_name, published: true });
}
