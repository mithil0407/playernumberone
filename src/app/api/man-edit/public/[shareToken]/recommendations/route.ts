import { NextRequest, NextResponse } from 'next/server';
import { hasActiveManEdit, loadManEditReportContext } from '@/lib/manEdit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const context = await loadManEditReportContext(shareToken, true);

  if (!context) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (!hasActiveManEdit(context)) return NextResponse.json({ error: 'Active Iconik Edit subscription required' }, { status: 403 });

  return NextResponse.json({
    recommendations: context.recommendations,
  }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
