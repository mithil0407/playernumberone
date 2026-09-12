import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPrivateToken, signedStorageUrl, STYLE_SCAN_RESULT_BUCKET } from '@/lib/styleScan';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const tokenHash = hashPrivateToken(token);
    const { data: order, error } = await supabaseAdmin.from('stylist_orders')
      .select('id, lead_id, customer_email, customer_name, customer_phone, status, refinement_completed_at, report_due_at')
      .eq('access_token_hash', tokenHash).eq('product_type', 'instant_report_999').maybeSingle();
    if (error) throw error;
    if (!order) return NextResponse.json({ error: 'Report order not found.' }, { status: 404 });
    const { data: report } = await supabaseAdmin.from('instant_reports')
      .select('id, status, progress_stage, report_data, image_paths, error_message, sla_due_at, approved_at, published_at')
      .eq('order_id', order.id).maybeSingle();
    const paths = report?.image_paths && typeof report.image_paths === 'object'
      ? (report.image_paths as { outfits?: string[] }).outfits || [] : [];
    const imageUrls = report?.status === 'published'
      ? await Promise.all(paths.map(path => signedStorageUrl(STYLE_SCAN_RESULT_BUCKET, path, 60 * 60)))
      : [];
    return NextResponse.json({
      order: {
        paid: order.status === 'paid',
        email: order.customer_email,
        name: order.customer_name,
        phone: order.customer_phone,
        refinementComplete: Boolean(order.refinement_completed_at),
        dueAt: order.report_due_at,
      },
      report: report ? { ...report, imageUrls } : null,
    }, { headers: { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    console.error('[instant-report] status failed:', error);
    return NextResponse.json({ error: 'Unable to load report status.' }, { status: 500 });
  }
}

