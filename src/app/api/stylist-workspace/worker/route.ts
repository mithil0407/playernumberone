import { NextRequest, NextResponse } from 'next/server';
import { isStylistWorkerRequestAuthorized } from '@/lib/stylistWorkerAuth';
import { runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!isStylistWorkerRequestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const processed = await runClaimedStylistWorkspaceJobs(Number(process.env.STYLIST_WORKER_CONCURRENCY || 2));
  return NextResponse.json({ processed });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
