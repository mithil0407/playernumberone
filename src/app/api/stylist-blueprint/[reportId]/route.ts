import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { loadStylistBlueprintReportByIdFresh, getStylistBlueprintReportById } from '@/lib/stylistBlueprintLoader';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { sendStylistBlueprintReportEmail } from '@/lib/email';
import { assertStylistReportDraft, assertStylistPageApprovals } from '@/lib/stylistReportValidation';
import { checkStudioReportQuality } from '@/lib/stylistReportStudio';
import { outfitPieces } from '@/lib/stylistOutfitEditor';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';
import {
  getStylistBlueprintPageCount,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintTransformationPage,
  getStylistBlueprintContinuationPage,
  isManualStylistBlueprintSubmission,
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
  let invalidatedOutfitImages: number[] = [];
  const expectedRevision = body.expectedRevision;
  if (expectedRevision !== undefined && (!Number.isInteger(expectedRevision) || expectedRevision < 0)) {
    return NextResponse.json({ error: 'Invalid report revision' }, { status: 400 });
  }
  const { data: currentRevisionRow, error: revisionError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('revision, updated_at, status, progress_stage, report_data, section_approvals, image_urls')
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
  if (body.expectedUpdatedAt && body.expectedUpdatedAt !== currentRevisionRow.updated_at) {
    return NextResponse.json({ error: 'This report changed in another session. Reload before saving.', conflict: true }, { status: 409 });
  }
  if ((body.report_data || body.page || body.page_approvals || body.section_approvals)
    && (currentRevisionRow.status === 'generating' || currentRevisionRow.progress_stage)) {
    return NextResponse.json({ error: 'Wait for report generation to finish before saving or approving.' }, { status: 409 });
  }
  try {
    for (const approvals of [body.page_approvals, body.section_approvals]) {
      if (approvals !== undefined) assertStylistPageApprovals(approvals, getStylistBlueprintPageCount(currentRevisionRow.report_data));
    }
    if (body.report_data !== undefined) {
      assertStylistReportDraft(body.report_data);
      if (body.report_data.pages.length === getStylistBlueprintPageCount(body.report_data)) validateStylistBlueprintReport(body.report_data);
      const previous = currentRevisionRow.report_data as StylistBlueprintReportData | null;
      if (previous?.pages?.some(page => !body.report_data.pages.some((next: BlueprintPage) => next.page_number === page.page_number))) {
        throw new Error('Existing pages cannot be removed. Use Hide Page instead.');
      }
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid report update' }, { status: 400 });
  }

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
    const previous = currentRevisionRow.report_data as StylistBlueprintReportData | null;
    const approvals = { ...(patch.section_approvals as Record<string, boolean> ?? currentRevisionRow.section_approvals ?? {}) };
    const analysisChanged = JSON.stringify(previous?.analysis) !== JSON.stringify(body.report_data.analysis);
    for (const page of body.report_data.pages as BlueprintPage[]) {
      if (analysisChanged || JSON.stringify(previous?.pages?.find(p => p.page_number === page.page_number)) !== JSON.stringify(page)) approvals[`p${page.page_number}`] = false;
    }
    if (analysisChanged && body.report_data.studio) body.report_data.studio.analysis_confirmed = false;
    patch.section_approvals = approvals;
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
    if (!incoming || !Number.isInteger(incoming.page_number) || !reportData.pages.some(page => page.page_number === incoming.page_number)) {
      return NextResponse.json({ error: 'Page not found in this report' }, { status: 400 });
    }
    const pages = reportData.pages.map(page => page.page_number === incoming.page_number ? incoming : page);
    const nextData = { ...reportData, pages };
    try {
      assertStylistReportDraft(nextData);
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

  // A new garment or colour needs a matching image. Never leave an old image
  // counted as complete after a stylist edits the outfit formula.
  if (patch.report_data && isVersionedStylistBlueprintReportData(currentRevisionRow.report_data)) {
    const before = currentRevisionRow.report_data;
    const after = patch.report_data as StylistBlueprintReportData;
    const start = getStylistBlueprintOutfitStartPage(after);
    const changed = new Set(after.pages.filter(page => page.page_number >= start && page.page_number < start + getStylistBlueprintOutfitCount(after))
      .filter(page => {
        const previous = before.pages.find(item => item.page_number === page.page_number);
        return !previous || JSON.stringify(outfitPieces(previous)) !== JSON.stringify(outfitPieces(page));
      }).map(page => page.page_number - start));
    invalidatedOutfitImages = [...changed];
    if (changed.size) {
      const paths = currentRevisionRow.image_urls as StylistBlueprintImagePaths | null;
      patch.image_urls = { ...paths, application: { ...paths?.application,
        outfitFlatlays: Array.from({ length: getStylistBlueprintOutfitCount(after) }, (_, index) => changed.has(index) ? null : paths?.application?.outfitFlatlays?.[index] ?? null),
        outfitDetails: Array.from({ length: getStylistBlueprintOutfitCount(after) }, (_, index) => changed.has(index) ? null : paths?.application?.outfitDetails?.[index] ?? null),
      } };
    }
  }

  const updateQuery = supabaseAdmin
    .from('stylist_blueprint_reports')
    .update(patch)
    .eq('id', reportId)
    .eq('revision', currentRevisionRow.revision)
    .eq('updated_at', currentRevisionRow.updated_at);
  const { data, error } = await updateQuery
    .select('id, share_token, status, sent_at, published_at, delivered_at, revision, updated_at, section_approvals, report_data')
    .maybeSingle();

  if (!error && !data) return NextResponse.json({ error: 'This report changed while saving. Reload before saving.', conflict: true }, { status: 409 });

  if (error || !data) {
    console.error('[stylist-blueprint PATCH] error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }

  await revalidateStylistBlueprintCache(reportId, data.share_token);
  return NextResponse.json({ report: data, invalidatedOutfitImages });
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
      .select('report_data, status, progress_stage, revision, updated_at')
      .eq('id', reportId)
      .single();
    if (loadError || !existing) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    if (existing.status === 'generating' || existing.status === 'error' || existing.progress_stage) {
      return NextResponse.json({ error: 'Finish report generation before approving' }, { status: 400 });
    }
    if (isVersionedStylistBlueprintReportData(existing.report_data)) {
      try {
        validateStylistBlueprintReport(existing.report_data);
      } catch {
        return NextResponse.json({ error: 'Finish report generation before approving' }, { status: 400 });
      }
    }
    const pageCount = isVersionedStylistBlueprintReportData(existing.report_data)
      ? getStylistBlueprintPageCount(existing.report_data)
      : 28;
    const sectionApprovals = Object.fromEntries(Array.from({ length: pageCount }, (_, index) => [`p${index + 1}`, true]));
    const { data, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ section_approvals: sectionApprovals, revision: (existing.revision ?? 1) + 1, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .eq('updated_at', existing.updated_at)
      .select('id, share_token, section_approvals, revision, updated_at')
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to approve report' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'The report changed during approval. Reload and review it again.' }, { status: 409 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data });
  }

  if (action === 'send') {
    const { data: existingReport, error: existingError } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, section_approvals, sent_at, share_token, report_data, image_urls, stylist_intake_responses(customer_email, full_name, intake_source, photo_urls, source_photo_paths, one_outfit_image_url)')
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
    const sourceIntake = firstRelation(existingReport.stylist_intake_responses);
    if (sourceIntake?.intake_source === 'india_consultation') {
      return NextResponse.json({ error: 'Use Publish & Deliver for consultation reports' }, { status: 400 });
    }
    if (!reportData || existingReport.status === 'generating' || existingReport.status === 'error' || existingReport.progress_stage) {
      return NextResponse.json({ error: 'Finish report generation before sending' }, { status: 400 });
    }
    if (isVersionedStylistBlueprintReportData(reportData)) {
      try {
        validateStylistBlueprintReport(reportData);
        const issue = reportData.studio && checkStudioReportQuality(reportData).find(issue => issue.level === 'error');
        if (issue) throw new Error(issue.message);
        const hidden = new Set(reportData.studio?.hidden_page_numbers ?? []);
        if (isManualStylistBlueprintSubmission(sourceIntake)) hidden.add(getStylistBlueprintContinuationPage(reportData));
        if (!reportData.pages.filter(page => !hidden.has(page.page_number)).every(page => existingReport.section_approvals?.[`p${page.page_number}`] === true)) {
          throw new Error('Approve every visible page before sending');
        }
        const photos = { ...(sourceIntake?.photo_urls ?? {}), ...(sourceIntake?.source_photo_paths ?? {}) } as Record<string, string>;
        const imageCounts = getStylistBlueprintImageCounts(existingReport.image_urls as StylistBlueprintImagePaths, {
          hasFrontPhoto: Boolean(photos.full_body_front), hasSidePhoto: Boolean(photos.full_body_side),
          hasHeadshot: Boolean(photos.headshot), hasClientPhoto: Boolean(Object.values(photos).some(Boolean) || sourceIntake?.one_outfit_image_url),
          outfitCount: getStylistBlueprintOutfitCount(reportData), includeClosingEditTeaser: !isManualStylistBlueprintSubmission(sourceIntake),
          includeTransformationPreview: Boolean(getStylistBlueprintTransformationPage(reportData)),
          includeBeautyPages: Boolean(getStylistBlueprintHairColourPage(reportData)), reportData,
        });
        if (Object.values(imageCounts).some(group => group.done < group.total)) throw new Error('Upload every required image before sending');
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Report quality checks failed' }, { status: 400 });
      }
    }
    if (isVersionedStylistBlueprintReportData(reportData) && reportData.studio && !reportData.studio.analysis_confirmed) {
      return NextResponse.json({ error: 'Confirm the body, colour and face analysis before sending' }, { status: 400 });
    }
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
      .eq('status', 'draft_ready')
      .select('id, share_token, status')
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Report is no longer awaiting review' }, { status: 409 });
    await revalidateStylistBlueprintCache(reportId, data.share_token);
    return NextResponse.json({ report: data });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
