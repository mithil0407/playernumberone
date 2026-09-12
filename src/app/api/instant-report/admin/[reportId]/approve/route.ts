import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrderAccessToken } from '@/lib/styleScan';
import { sendInstantReportReadyEmail } from '@/lib/email';

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reportId } = await params;
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin.from('instant_reports').update({
    status: 'published',
    reviewed_by: 'ICONIK admin',
    reviewed_by_label: 'ICONIK Styling Team',
    approved_at: now,
    published_at: now,
    updated_at: now,
  }).eq('id', reportId).eq('status', 'review_required').select('id, order_id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Only a report awaiting review can be published.' }, { status: 409 });
  const { data: order } = await supabaseAdmin.from('stylist_orders')
    .select('id, customer_name, customer_email, ready_email_sent').eq('id', data.order_id).maybeSingle();
  if (order && !order.ready_email_sent) {
    const token = createOrderAccessToken(order.id);
    const reportUrl = new URL(`/instant-report/report/${encodeURIComponent(token)}`, request.nextUrl.origin).toString();
    const sent = await sendInstantReportReadyEmail({ customer_name: order.customer_name || order.customer_email, customer_email: order.customer_email, report_url: reportUrl });
    if (sent.success) await supabaseAdmin.from('stylist_orders').update({ ready_email_sent: true }).eq('id', order.id);
  }
  return NextResponse.json({ success: true });
}
