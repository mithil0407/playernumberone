import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { admitFromWaitlist } from '@/lib/agentGrowthStore';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

/**
 * Lets the next people off the waitlist. Those who messaged in the last 24h are
 * told now; everyone admitted is enrolled the next time they write.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromCookieValue(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { count?: unknown };
  const count = Math.min(500, Math.max(1, Math.round(Number(body.count) || 10)));
  const result = await admitFromWaitlist(count, async (phone, text) => (await sendWhatsAppTextMessage(phone, text)).success);
  return NextResponse.json(result);
}
