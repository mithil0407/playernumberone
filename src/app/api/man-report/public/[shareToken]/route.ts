import { NextRequest, NextResponse } from 'next/server';
import { getPublicManReportByShareToken } from '@/lib/manReportLoader';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const report = await getPublicManReportByShareToken(shareToken);

  if (!report) {
    return NextResponse.json({ error: 'Report not found or not yet published' }, { status: 404 });
  }

  return NextResponse.json({ report });
}
