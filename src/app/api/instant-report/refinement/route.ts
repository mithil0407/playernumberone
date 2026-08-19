import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPrivateToken, type InstantReportRefinementV1 } from '@/lib/styleScan';

const mixes = new Set(['western', 'ethnic', 'mixed']);

function valid(body: Record<string, unknown>): body is Record<string, unknown> & InstantReportRefinementV1 {
  return typeof body.height === 'string' && body.height.trim().length > 1
    && typeof body.sizeRange === 'string' && body.sizeRange.trim().length > 0
    && mixes.has(String(body.wardrobeMix))
    && Array.isArray(body.priorityContexts) && body.priorityContexts.length === 2
    && body.priorityContexts.every(value => typeof value === 'string' && value.length > 0)
    && typeof body.footwearPreference === 'string' && body.footwearPreference.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = String(body.token || '');
    if (!valid(body)) return NextResponse.json({ error: 'Complete all required refinement fields and choose exactly two contexts.' }, { status: 400 });
    const tokenHash = hashPrivateToken(token);
    const { data: order, error: orderError } = await supabaseAdmin.from('stylist_orders')
      .select('id, lead_id, status, refinement_completed_at')
      .eq('access_token_hash', tokenHash).eq('product_type', 'instant_report_999').maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.status !== 'paid' || !order.lead_id) return NextResponse.json({ error: 'A confirmed ₹999 order is required.' }, { status: 403 });
    if (order.refinement_completed_at) return NextResponse.json({ success: true, reportUrl: `/instant-report/report/${encodeURIComponent(token)}` });
    const { data: scan, error: scanError } = await supabaseAdmin.from('style_scan_leads')
      .select('photo_paths, scan_status').eq('id', order.lead_id).single();
    if (scanError || scan.scan_status !== 'ready') return NextResponse.json({ error: 'Your Style Scan photos need attention before the report can begin.' }, { status: 409 });
    const now = new Date();
    const due = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const payload = {
      order_id: order.id,
      scan_lead_id: order.lead_id,
      height: body.height.trim(),
      size_range: body.sizeRange.trim(),
      wardrobe_mix: body.wardrobeMix,
      priority_contexts: body.priorityContexts,
      footwear_preference: body.footwearPreference,
      hard_nos: typeof body.hardNos === 'string' ? body.hardNos.trim().slice(0, 1000) : null,
      final_note: typeof body.finalNote === 'string' ? body.finalNote.trim().slice(0, 1000) : null,
      photo_paths: scan.photo_paths,
      completed_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const { data: intake, error: intakeError } = await supabaseAdmin.from('instant_report_intakes')
      .upsert(payload, { onConflict: 'order_id' }).select('id').single();
    if (intakeError) throw intakeError;
    const { error: reportError } = await supabaseAdmin.from('instant_reports').upsert({
      order_id: order.id,
      intake_id: intake.id,
      scan_lead_id: order.lead_id,
      status: 'queued',
      progress_stage: 'waiting_to_generate',
      access_token_hash: tokenHash,
      sla_started_at: now.toISOString(),
      sla_due_at: due.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'order_id' });
    if (reportError) throw reportError;
    await supabaseAdmin.from('stylist_orders').update({
      refinement_completed_at: now.toISOString(), report_due_at: due.toISOString(), intake_completed: true, intake_completed_at: now.toISOString(),
    }).eq('id', order.id);
    return NextResponse.json({ success: true, reportUrl: `/instant-report/report/${encodeURIComponent(token)}` });
  } catch (error) {
    console.error('[instant-report] refinement failed:', error);
    return NextResponse.json({ error: 'We could not save the refinement. Please try again.' }, { status: 500 });
  }
}
