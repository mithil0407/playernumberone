// ₹2,699 abandoned-checkout emails. Call from freecronjob every 15 minutes:
//   GET /api/checkout-recovery/cron?key=<CRON_SECRET>
// Add &dry=1 to see what would be sent without sending. Outside 08:00–21:00 IST
// a run does nothing, so a tight schedule is safe; each email step is claimed
// atomically, so late, overlapping or repeated runs never double-send.
// The same tick also runs the free colour-scan nurture emails, so that sequence
// needs no scheduler job of its own; a failure there never fails this run.

import { NextRequest, NextResponse } from 'next/server';
import { isCheckoutRecoveryCronAuthorized, runCheckoutRecovery } from '@/lib/checkoutRecovery';
import { runColourScanNurture } from '@/lib/colourScanNurture';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  if (!isCheckoutRecoveryCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const dryRun = request.nextUrl.searchParams.get('dry') === '1';
    const result = await runCheckoutRecovery({ dryRun });
    const colourScanNurture = await runColourScanNurture({ dryRun }).catch((error) => {
      console.error('Colour scan nurture run failed inside checkout-recovery cron:', error);
      return { error: 'Colour scan nurture run failed' };
    });
    return NextResponse.json({ success: true, dryRun, ...result, colourScanNurture });
  } catch (error) {
    console.error('Checkout recovery cron error:', error);
    return NextResponse.json({ success: false, error: 'Checkout recovery run failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
