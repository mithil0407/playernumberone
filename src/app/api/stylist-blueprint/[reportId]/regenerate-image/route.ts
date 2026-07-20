import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import {
  isStylistBlueprintImageSlotKey,
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
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const slotKey = body.slotKey;

  if (!isStylistBlueprintImageSlotKey(slotKey)) {
    return NextResponse.json({ error: 'Invalid image slot' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id, progress_stage')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.progress_stage) {
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
