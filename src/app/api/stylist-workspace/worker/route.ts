import { NextRequest, NextResponse } from 'next/server';
import { runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const processed = await runClaimedStylistWorkspaceJobs(Number(process.env.STYLIST_WORKER_CONCURRENCY || 2));
  return NextResponse.json({ processed });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
