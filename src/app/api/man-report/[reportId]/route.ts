import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { resolveManReportImageUrls, type ManReportImagePaths } from '@/lib/manImageGenerator';
import { sendMenBlueprintReportEmail } from '@/lib/emailMen';
import type { ReportData } from '@/lib/manReportGenerator';

// ── GET — fetch full report (admin) ────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;

  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('*, man_intake_submissions(id, customer_email, customer_phone)')
    .eq('id', reportId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const imageUrls = await resolveManReportImageUrls(data.image_urls as ManReportImagePaths | null);

  return NextResponse.json({
    report: {
      ...data,
      image_urls: imageUrls,
    },
  });
}

// ── PATCH — update approvals, report_data edits, or status ────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json();

  const { data: existingReport, error: existingError } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, sent_at, share_token, report_data, man_intake_submissions(customer_email)')
    .eq('id', reportId)
    .single();

  if (existingError || !existingReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const allowedFields = ['section_approvals', 'report_data', 'status', 'sent_at', 'progress_stage', 'error_message'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const isFirstSend = body.status === 'sent' && existingReport.status !== 'sent';

  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field];
  }

  // When status transitions to 'sent', stamp sent_at
  if (body.status === 'sent' && !body.sent_at) {
    update.sent_at = new Date().toISOString();
  }

  const submissionRelation = existingReport.man_intake_submissions as
    | { customer_email?: string | null }
    | { customer_email?: string | null }[]
    | null;

  const recipientEmail = Array.isArray(submissionRelation)
    ? submissionRelation[0]?.customer_email ?? null
    : submissionRelation?.customer_email ?? null;

  if (isFirstSend && !recipientEmail) {
    return NextResponse.json({ error: 'Client email is missing on the intake submission' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .update(update)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('[man-report PATCH] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (isFirstSend && recipientEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
    const reportUrl = `${siteUrl}/man/report/${existingReport.share_token}`;
    const reportData = existingReport.report_data as ReportData | null;
    const classification = reportData?.classification;

    const emailResult = await sendMenBlueprintReportEmail({
      email: recipientEmail,
      reportUrl,
      silhouette: classification?.body?.silhouette_type,
      faceShape: classification?.face?.face_shape,
      season: classification?.colour?.season,
      primaryBrief: classification?.style_brief?.primary_brief,
    });

    if (!emailResult.success) {
      await supabaseAdmin
        .from('man_reports')
        .update({
          status: existingReport.status,
          sent_at: existingReport.sent_at,
          error_message: `Client email failed: ${emailResult.error ?? 'Unknown error'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      return NextResponse.json(
        { error: `Client email failed: ${emailResult.error ?? 'Unknown error'}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ report: data });
}
