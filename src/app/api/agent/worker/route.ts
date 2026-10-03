import { NextResponse } from 'next/server';
import { runAgentWorker } from '@/lib/agentJobs';
import { isStylistWorkerRequestAuthorized } from '@/lib/stylistWorkerAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Runs the agent's background work: browser verification of Look pages, memory
 * consolidation and event check-ins. Hit by the app's own hand-off (POST, bearer)
 * and by the external scheduler (GET, ?key=) as a fallback. Safe to call twice:
 * jobs are claimed atomically and check-in stages are claimed before sending.
 */
async function handle(request: Request) {
  if (!isStylistWorkerRequestAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const summary = await runAgentWorker();
  return NextResponse.json({ status: 'ok', ...summary });
}

export const GET = handle;
export const POST = handle;
