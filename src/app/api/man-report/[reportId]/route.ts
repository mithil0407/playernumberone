import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { sendMenBlueprintReportEmail } from '@/lib/emailMen';
import type { ReportData } from '@/lib/manReportGenerator';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { getAdminManReportById, loadAdminManReportByIdFresh } from '@/lib/manReportLoader';
import { manReportOutfitQualityGatePassed, withManReportSection4Qa } from '@/lib/manReportQa';
import { normaliseComboGridText } from '@/lib/manComboGridSection';
import { normaliseSequentialManOutfitNumbers } from '@/lib/manOutfitSection';
import { shoppingNeedsFetch, type ManShoppingState } from '@/lib/manShopping';
import { runManShoppingPipeline } from '@/lib/manShoppingPipeline';

// Background budget for the shopping-links pipeline triggered on S4 approval.
export const maxDuration = 300;

// ── GET — fetch full report (admin) ────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const fresh = request.nextUrl.searchParams.get('fresh') === '1';
  let report = fresh
    ? await loadAdminManReportByIdFresh(reportId)
    : await getAdminManReportById(reportId);

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData | null;
  const currentS4 = reportData?.sections?.s4_outfits ?? '';
  const normalisedS4 = normaliseSequentialManOutfitNumbers(currentS4);
  if (reportData?.classification && normalisedS4 !== currentS4) {
    const nextReportData = withManReportSection4Qa({
      ...reportData,
      sections: {
        ...reportData.sections,
        s4_outfits: normalisedS4,
      },
    });
    const { data: saved } = await supabaseAdmin
      .from('man_reports')
      .update({
        report_data: nextReportData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (saved) {
      await revalidateManReportCache(reportId, report.share_token ?? null);
      report = saved;
    }
  }

  return NextResponse.json({ report });
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
    .select('id, status, sent_at, share_token, report_data, section_approvals, shopping_data, man_intake_submissions(customer_email)')
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

  if (body.report_data?.sections) {
    const incomingComboText = body.report_data.sections.s4_combo_grids;
    const existingComboText = (existingReport.report_data as ReportData | null)?.sections?.s4_combo_grids ?? '';
    if (typeof incomingComboText === 'string' && incomingComboText !== existingComboText) {
      const normalised = normaliseComboGridText(incomingComboText);
      if (!normalised.ok) {
        return NextResponse.json({ error: normalised.error }, { status: 400 });
      }
      update.report_data = {
        ...body.report_data,
        sections: {
          ...body.report_data.sections,
          s4_combo_grids: normalised.text,
        },
      };
    }
  }

  const nextReportData = update.report_data as ReportData | undefined;
  if (nextReportData?.classification && nextReportData?.sections?.s4_outfits) {
    update.report_data = withManReportSection4Qa({
      ...nextReportData,
      sections: {
        ...nextReportData.sections,
        s4_outfits: normaliseSequentialManOutfitNumbers(nextReportData.sections.s4_outfits),
      },
    });
  }

  if (body.status === 'sent') {
    const candidate = (update.report_data ?? existingReport.report_data) as ReportData | null;
    if (candidate?.classification && candidate.sections?.s4_outfits) {
      const checked = withManReportSection4Qa(candidate);
      update.report_data = checked;
      if (!manReportOutfitQualityGatePassed(checked) && body.quality_override !== true) {
        return NextResponse.json({
          error: 'This v2 outfit portfolio is below the ICONIK 9/10 quality floor. Resolve the outfit QA issues before sending.',
          requiresQualityOverride: true,
          quality: checked.qa?.section4?.quality,
          issues: checked.qa?.section4?.issues.filter(item => item.severity === 'error') ?? [],
        }, { status: 400 });
      }
    }
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

  await revalidateManReportCache(reportId, existingReport.share_token);

  // Section 4 approval is the (only) trigger for the shopping-links pipeline —
  // fetching product links before outfits are final would pay Apify for
  // garments that get regenerated or swapped. Re-approval after edits refetches
  // only slots whose descriptors actually changed; re-approval with fresh
  // links is a no-op.
  const s4JustApproved = body.section_approvals?.s4 === true
    && (existingReport.section_approvals as Record<string, boolean> | null)?.s4 !== true;
  if (s4JustApproved) {
    const s4Text = ((update.report_data ?? existingReport.report_data) as ReportData | null)?.sections?.s4_outfits ?? '';
    if (s4Text.trim() && shoppingNeedsFetch(existingReport.shopping_data as ManShoppingState | null, s4Text)) {
      after(async () => {
        await runManShoppingPipeline(reportId);
      });
    }
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

      await revalidateManReportCache(reportId, existingReport.share_token);

      return NextResponse.json(
        { error: `Client email failed: ${emailResult.error ?? 'Unknown error'}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ report: data });
}
