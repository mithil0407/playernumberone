// Colour-scan nurture emails 2–6 (email 1 goes out the moment a result is
// ready). The existing checkout-recovery cron job already runs this every 15
// minutes, so no new scheduler job is needed; this route exists for a manual
// run or a dry run:
//   GET /api/colour-scan-nurture/cron?key=<CRON_SECRET>&dry=1

import { NextRequest, NextResponse } from 'next/server';
import { isCheckoutRecoveryCronAuthorized } from '@/lib/checkoutRecovery';
import { runColourScanNurture } from '@/lib/colourScanNurture';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  if (!isCheckoutRecoveryCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const dryRun = request.nextUrl.searchParams.get('dry') === '1';
    const result = await runColourScanNurture({ dryRun });
    return NextResponse.json({ success: true, dryRun, ...result });
  } catch (error) {
    console.error('Colour scan nurture cron error:', error);
    return NextResponse.json({ success: false, error: 'Colour scan nurture run failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
