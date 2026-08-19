import { NextRequest, NextResponse } from 'next/server';
import { getStyleScanByToken, signedStorageUrl, STYLE_SCAN_RESULT_BUCKET } from '@/lib/styleScan';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const scan = await getStyleScanByToken(
      token,
      'scan_status, scan_analysis, outfit_visual_path, retake_reason, result_ready_at, phone_e164',
    );
    if (!scan || scan.scan_status === 'deleted') return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
    const visualUrl = scan.scan_status === 'ready'
      ? await signedStorageUrl(STYLE_SCAN_RESULT_BUCKET, scan.outfit_visual_path, 60 * 60)
      : null;
    return NextResponse.json({
      status: scan.scan_status,
      analysis: scan.scan_status === 'ready' ? scan.scan_analysis : null,
      visualUrl,
      retakeReason: scan.retake_reason,
      readyAt: scan.result_ready_at,
      contact: scan.scan_status === 'ready' ? { phone: scan.phone_e164 } : null,
    }, { headers: { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    console.error('[style-scan] status failed:', error);
    return NextResponse.json({ error: 'Unable to load this scan.' }, { status: 500 });
  }
}
