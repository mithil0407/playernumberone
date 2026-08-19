import { NextRequest, NextResponse } from 'next/server';
import { processInstantReportToken } from '@/lib/instantReportProcessing';

export const maxDuration = 300;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await processInstantReportToken(token);
  if (result.status === 'not_found') return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  if (result.status === 'failed') return NextResponse.json({ error: 'Report generation hit a temporary issue. It is safe to retry.' }, { status: 500 });
  return NextResponse.json({ success: true, status: result.status }, { status: result.status === 'generating' ? 202 : 200 });
}

