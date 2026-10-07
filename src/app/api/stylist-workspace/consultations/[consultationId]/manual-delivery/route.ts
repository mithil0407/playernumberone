import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { getConsultationWorkspaceAccess, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { manualDeliveredAt } from '@/lib/stylistWorkspaceQueueModel';

/**
 * Record that a report went to the client outside the studio. There is nothing
 * to publish here, so the stylist says when she sent it. The moment she
 * actually pressed the button is kept in the activity log next to that date.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const access = await getConsultationWorkspaceAccess(consultationId);
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { deliveredOn?: unknown };
  const { data: consultation, error } = await supabaseAdmin
    .from('consultations')
    .select('id, stylist_id, status, consultation_date, delivered_at, report_due_at')
    .eq('id', consultationId)
    .single();
  if (error || !consultation) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (consultation.delivered_at || consultation.status === 'delivered') {
    return NextResponse.json({ error: 'This report is already marked delivered.' }, { status: 409 });
  }

  const when = manualDeliveredAt(body.deliveredOn, consultation.consultation_date);
  if ('error' in when) return NextResponse.json({ error: when.error }, { status: 400 });

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('consultations')
    .update({ status: 'delivered', delivered_at: when.at, updated_at: now })
    .eq('id', consultationId)
    .is('delivered_at', null)
    .select('id')
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'This report is already marked delivered.' }, { status: 409 });

  // Drafts left in review would keep the client in To do, so the newest one
  // follows the consultation. Nothing is published and no client link opens.
  const { data: intakes } = await supabaseAdmin.from('stylist_intake_responses').select('id').eq('consultation_id', consultationId);
  const intakeIds = (intakes ?? []).map(item => item.id);
  let reportId: string | null = null;
  if (intakeIds.length) {
    const { data: latest } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status')
      .in('submission_id', intakeIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest && latest.status !== 'generating' && latest.status !== 'delivered') {
      reportId = latest.id;
      await supabaseAdmin.from('stylist_blueprint_reports').update({ status: 'delivered', delivered_at: when.at, updated_at: now }).eq('id', latest.id);
    }
  }

  await logStylistReportActivity({
    action: 'manual_delivery_recorded', reportId, consultationId, stylistId: access.stylistId,
    metadata: { delivered_on: body.deliveredOn, delivered_at: when.at, recorded_at: now, by_admin: access.isAdmin, report_due_at: consultation.report_due_at },
  });
  clearWorkspaceQueueCache(consultation.stylist_id ?? undefined);
  return NextResponse.json({ success: true, deliveredAt: when.at });
}
