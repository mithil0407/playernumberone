import { NextRequest, NextResponse } from 'next/server';
import { prepareRenewalPayLink, purgeExpiredSelfie } from '@/lib/styleMembershipServer';
import { hasPayLinkSince, listLeadsWithExpiredSelfies, listMembershipsNeedingPayLink } from '@/lib/styleMembershipStore';

export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Run by an external GET scheduler (cron-job.org style, any frequency; safe to
 * miss or repeat). It only prepares: for members whose quarter ends within 3
 * days and who have no working autopay, it creates a Razorpay payment link and
 * queues the WhatsApp message (never sends it). It also deletes selfies past
 * their 30 days.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.nextUrl.searchParams.get('secret');
  if (!secret || supplied !== secret) return NextResponse.json({ ok: false }, { status: 401 });

  const now = Date.now();
  const due = await listMembershipsNeedingPayLink(new Date(now + 3 * DAY_MS).toISOString());
  let prepared = 0;
  const failures: string[] = [];
  for (const membership of due) {
    if (await hasPayLinkSince(membership.id, new Date(now - 7 * DAY_MS).toISOString())) continue;
    try {
      await prepareRenewalPayLink(membership, membership.autopay_status === 'failed' ? 'autopay failed' : 'no autopay set up');
      prepared += 1;
    } catch (error) {
      failures.push(membership.id);
      console.error('[style-membership] pay link failed:', membership.id, error);
    }
  }

  let selfiesDeleted = 0;
  for (const lead of await listLeadsWithExpiredSelfies(new Date(now).toISOString())) {
    if (await purgeExpiredSelfie(lead).catch(() => false)) selfiesDeleted += 1;
  }
  return NextResponse.json({ ok: true, due: due.length, prepared, failures, selfiesDeleted });
}
