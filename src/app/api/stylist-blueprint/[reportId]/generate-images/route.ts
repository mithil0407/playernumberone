import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';
import { generateStylistBlueprintImages, planStylistBlueprintImageGeneration, type StylistBlueprintImageGroup } from '@/lib/stylistBlueprintImageGenerator';
import type { StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';

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
  const allowedGroups = new Set(['diagnosis', 'prescription', 'application', 'capsule_1', 'capsule_2', 'capsule_3', 'capsule_4', 'closing', 'all']);
  const group = allowedGroups.has(body.group) ? body.group as StylistBlueprintImageGroup : 'all';
  const force = Boolean(body.force);

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id, status, progress_stage, image_urls')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report data not found' }, { status: 404 });
  }

  if (report.status === 'generating' || report.progress_stage) return NextResponse.json({ error: 'Finish the current generation first' }, { status: 409 });

  try {
    const { data: submission } = await supabaseAdmin
      .from('stylist_intake_responses')
      .select('*')
      .eq('id', report.submission_id)
      .maybeSingle();

    const resolvedSubmission = submission ? await resolveConsultationIntakePhotos(submission) : null;
    if (body.planOnly === true) return NextResponse.json({ slots: planStylistBlueprintImageGeneration(report.report_data as StylistBlueprintReportData, report.image_urls, resolvedSubmission, group, force) });
    const imagePaths = await generateStylistBlueprintImages(
      reportId,
      report.report_data as StylistBlueprintReportData,
      report.share_token ?? null,
      { group, force, submission: resolvedSubmission },
    );
    return NextResponse.json({ success: true, imagePaths });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ progress_stage: null, error_message: message, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
