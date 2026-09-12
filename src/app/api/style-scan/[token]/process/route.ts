import { NextRequest, NextResponse } from 'next/server';
import { processStyleScanToken } from '@/lib/styleScanProcessing';

export const maxDuration = 300;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await processStyleScanToken(token);
  if (result.status === 'not_found') return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
  if (result.status === 'failed') return NextResponse.json({ error: 'Your scan hit a temporary issue. It is safe to retry.', status: 'failed' }, { status: 500 });
  return NextResponse.json({ success: true, status: result.status }, { status: ['submitted', 'analyzing', 'generating_visual'].includes(result.status) ? 202 : 200 });
}

