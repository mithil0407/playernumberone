import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { signedStorageUrl, STYLE_SCAN_RESULT_BUCKET, type InstantReportV1 } from '@/lib/styleScan';

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reportId } = await params;
  const { data, error } = await supabaseAdmin.from('instant_reports')
    .select('*, stylist_orders(customer_name, customer_email, customer_phone), instant_report_intakes(*)')
    .eq('id', reportId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const paths = data.image_paths && typeof data.image_paths === 'object' ? (data.image_paths as { outfits?: string[] }).outfits || [] : [];
  const imageUrls = await Promise.all(paths.map(path => signedStorageUrl(STYLE_SCAN_RESULT_BUCKET, path, 60 * 60)));
  return NextResponse.json({ report: { ...data, imageUrls } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reportId } = await params;
  const body = await request.json();
  const reportData = body.reportData as InstantReportV1;
  if (!reportData || reportData.version !== 'instant-report-v1' || !Array.isArray(reportData.outfits) || reportData.outfits.length !== 10) {
    return NextResponse.json({ error: 'Invalid report data.' }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from('instant_reports').update({ report_data: reportData, updated_at: new Date().toISOString() }).eq('id', reportId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

