import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintSubmission } from '@/lib/stylistWorkspaceAuth';
import { runStylistBlueprintTextPipeline } from '@/lib/stylistBlueprintTextPipeline';
import { STYLIST_BLUEPRINT_PAGE_COUNT, type StylistIntakeSubmission } from '@/lib/stylistBlueprintGenerator';
import { resolveConsultationIntakePhotos } from '@/lib/stylistConsultationWorkspace';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params;
  if (!(await canAccessBlueprintSubmission(submissionId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (submissionError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }
  const resolvedSubmission = await resolveConsultationIntakePhotos(submission as StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null });

  const { data: existingReports } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, created_at')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(1);

  const latest = existingReports?.[0];
  if (latest?.status === 'generating') {
    const ageMs = Date.now() - new Date(latest.created_at).getTime();
    if (ageMs < 10 * 60 * 1000) {
      return NextResponse.json({ reportId: latest.id, status: 'generating', alreadyRunning: true });
    }
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ status: 'error', progress_stage: null, error_message: 'Generation timed out — restarted', updated_at: new Date().toISOString() })
      .eq('id', latest.id);
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .insert({
      submission_id: submissionId,
      status: 'generating',
      progress_stage: 'classifying',
      section_approvals: Object.fromEntries(Array.from({ length: STYLIST_BLUEPRINT_PAGE_COUNT }, (_, index) => [`p${index + 1}`, false])),
    })
    .select('id, share_token')
    .single();

  if (reportError || !report) {
    console.error('[stylist-blueprint] create report failed:', reportError);
    return NextResponse.json({ error: 'Failed to start report generation' }, { status: 500 });
  }

  after(async () => {
    await runStylistBlueprintTextPipeline(report.id, resolvedSubmission, report.share_token ?? null, null);
  });

  return NextResponse.json({ reportId: report.id, status: 'generating' });
}
