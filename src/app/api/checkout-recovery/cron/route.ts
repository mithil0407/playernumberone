// ₹2,699 abandoned-checkout emails. Call from freecronjob every 15 minutes:
//   GET /api/checkout-recovery/cron?key=<CRON_SECRET>
// Add &dry=1 to see what would be sent without sending. Outside 08:00–21:00 IST
// a run does nothing, so a tight schedule is safe; each email step is claimed
// atomically, so late, overlapping or repeated runs never double-send.

import { NextRequest, NextResponse } from 'next/server';
import { isCheckoutRecoveryCronAuthorized, runCheckoutRecovery } from '@/lib/checkoutRecovery';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  if (!isCheckoutRecoveryCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const dryRun = request.nextUrl.searchParams.get('dry') === '1';
    const result = await runCheckoutRecovery({ dryRun });
    return NextResponse.json({ success: true, dryRun, ...result });
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
