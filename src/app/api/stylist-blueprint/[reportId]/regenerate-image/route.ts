import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';
import {
  isStylistBlueprintImageSlotKey,
  getStylistBlueprintImageSlotPageNumber,
  regenerateStylistBlueprintImageSlot,
} from '@/lib/stylistBlueprintImageGenerator';
import { getStylistBlueprintOutfitCount, isVersionedStylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await isAdminCookieAuthenticated())) {
    return NextResponse.json({ error: 'Image generation is available to admins only' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const slotKey = body.slotKey;

  if (!isStylistBlueprintImageSlotKey(slotKey)) {
    return NextResponse.json({ error: 'Invalid image slot' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id, progress_stage, status, updated_at, section_approvals, revision')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.progress_stage || report.status === 'generating') {
    return NextResponse.json(
      { error: 'Image generation already in progress', progressStage: report.progress_stage },
      { status: 409 },
    );
  }

  if (!isVersionedStylistBlueprintReportData(report.report_data)) {
    return NextResponse.json({ error: 'A v1 Blueprint report is required to regenerate images' }, { status: 400 });
  }

  if (slotKey.startsWith('application.outfitFlatlays.')) {
    const index = Number(slotKey.split('.').at(-1));
    if (!Number.isInteger(index) || index >= getStylistBlueprintOutfitCount(report.report_data)) {
      return NextResponse.json({ error: 'Invalid outfit image slot for this report version' }, { status: 400 });
    }
  }

  const page = getStylistBlueprintImageSlotPageNumber(slotKey, report.report_data);
  const { data: claimed, error: claimError } = await supabaseAdmin.from('stylist_blueprint_reports')
    .update({ progress_stage: `generating_image_${slotKey}`, updated_at: new Date().toISOString(),
      section_approvals: { ...(report.section_approvals ?? {}), ...(page ? { [`p${page}`]: false } : {}) },
      revision: (report.revision ?? 1) + 1, published_at: null, delivered_at: null, status: 'in_review' })
    .eq('id', reportId).eq('updated_at', report.updated_at).select('id').maybeSingle();
  if (claimError) return NextResponse.json({ error: 'Could not start image generation' }, { status: 500 });
  if (!claimed) return NextResponse.json({ error: 'The report changed. Reload before generating.' }, { status: 409 });

  try {
    const { data: submission } = await supabaseAdmin
      .from('stylist_intake_responses')
      .select('*')
      .eq('id', report.submission_id)
      .maybeSingle();

    const resolvedSubmission = submission ? await resolveConsultationIntakePhotos(submission) : null;
    const result = await regenerateStylistBlueprintImageSlot(
      reportId,
      report.report_data,
      slotKey,
      { shareToken: report.share_token ?? null, submission: resolvedSubmission },
    );

    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ progress_stage: null, error_message: null, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image regeneration failed';
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ progress_stage: null, error_message: message, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
