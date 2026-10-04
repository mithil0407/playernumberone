import { NextRequest, NextResponse } from 'next/server';
import { getStyleScanByToken, signedStorageUrl, STYLE_SCAN_PHOTO_BUCKET, STYLE_SCAN_RESULT_BUCKET } from '@/lib/styleScan';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const scan = await getStyleScanByToken(
      token,
      'scan_status, scan_analysis, outfit_visual_path, retake_reason, result_ready_at, phone_e164, email, photo_paths, scan_answers',
    );
    if (!scan || scan.scan_status === 'deleted') return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
    const ready = scan.scan_status === 'ready';
    const photos = scan.photo_paths && typeof scan.photo_paths === 'object' ? scan.photo_paths as Record<string, string> : {};
    // Her own selfie, shown back to her on the private result page for the colour drape.
    const [visualUrl, headshotUrl] = await Promise.all([
      ready ? signedStorageUrl(STYLE_SCAN_RESULT_BUCKET, scan.outfit_visual_path, 60 * 60) : null,
      ready ? signedStorageUrl(STYLE_SCAN_PHOTO_BUCKET, photos.headshot, 60 * 60).catch(() => null) : null,
    ]);
    return NextResponse.json({
      status: scan.scan_status,
      analysis: scan.scan_status === 'ready' ? scan.scan_analysis : null,
      visualUrl,
      headshotUrl,
      retakeReason: scan.retake_reason,
      readyAt: scan.result_ready_at,
      contact: ready ? { phone: scan.phone_e164, email: scan.email ?? null } : null,
      dressCode: ready && scan.scan_answers && typeof scan.scan_answers === 'object' ? (scan.scan_answers as Record<string, unknown>).dressCode ?? null : null,
    }, { headers: { 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    console.error('[style-scan] status failed:', error);
    return NextResponse.json({ error: 'Unable to load this scan.' }, { status: 500 });
  }
}
