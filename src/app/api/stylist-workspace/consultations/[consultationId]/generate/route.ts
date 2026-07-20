import { after, NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { STYLIST_BLUEPRINT_PAGE_COUNT } from '@/lib/stylistBlueprintGenerator';
import { canAccessConsultation, getStylistWorkspaceIdentity, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { ensureConsultationIntake } from '@/lib/stylistConsultationWorkspace';
import { runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity || !(await canAccessConsultation(consultationId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { newVersion?: boolean };
  try {
    const intake = await ensureConsultationIntake({ consultationId, stylistId: identity.stylistId, refresh: true });
    const { data: latestReports } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status')
      .eq('submission_id', intake.id)
      .order('created_at', { ascending: false })
      .limit(1);
    const latest = latestReports?.[0];
    if (latest && !body.newVersion && !['error'].includes(latest.status)) {
      return NextResponse.json({ reportId: latest.id, status: latest.status, existing: true });
    }

    const { data: report, error } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .insert({
        submission_id: intake.id,
        created_by_stylist_id: identity.stylistId,
        status: 'generating',
        progress_stage: 'queued',
        section_approvals: Object.fromEntries(
          Array.from({ length: STYLIST_BLUEPRINT_PAGE_COUNT }, (_, index) => [`p${index + 1}`, false]),
        ),
      })
      .select('id')
      .single();
    if (error || !report) {
      if (error?.code === '23505') {
        const { data: active } = await supabaseAdmin
          .from('stylist_blueprint_reports')
          .select('id, status')
          .eq('submission_id', intake.id)
          .not('status', 'in', '(delivered,sent,error)')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (active) return NextResponse.json({ reportId: active.id, status: active.status, existing: true });
      }
      throw new Error(error?.message || 'Could not create report');
    }

    const { error: jobError } = await supabaseAdmin.from('stylist_report_jobs').insert({
      report_id: report.id,
      consultation_id: consultationId,
      stylist_id: identity.stylistId,
      job_type: 'full_report',
      target: 'all',
      intake_snapshot: intake,
    });
    if (jobError) {
      await supabaseAdmin
        .from('stylist_blueprint_reports')
        .update({ status: 'error', progress_stage: null, error_message: jobError.message, updated_at: new Date().toISOString() })
        .eq('id', report.id);
      throw new Error(jobError.message);
    }

    const { data: consultation } = await supabaseAdmin
      .from('consultations')
      .select('status')
      .eq('id', consultationId)
      .single();
    if (consultation?.status !== 'delivered') {
      await supabaseAdmin
        .from('consultations')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', consultationId);
    }
    await logStylistReportActivity({
      action: 'report_queued', reportId: report.id, consultationId, stylistId: identity.stylistId,
    });
    after(async () => {
      try { await runClaimedStylistWorkspaceJobs(1); } catch (workerError) { console.error('[stylist-workspace] immediate worker failed', workerError); }
    });
    return NextResponse.json({ reportId: report.id, status: 'generating' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 400 });
  }
}
