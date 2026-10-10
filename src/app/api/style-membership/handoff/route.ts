import { NextRequest, NextResponse } from 'next/server';
import { findMembership, getLead, listQueuedMessages } from '@/lib/styleMembershipStore';
import { quizSummary } from '@/lib/styleMembershipLogic';
import { hashToken, parseMemberCode } from '@/lib/styleMembershipTokens';

/**
 * For the team and tools: everything the stylist needs about a member, by her
 * ICM- code. Protected by ICONIK_INTERNAL_SECRET. The WhatsApp agent itself
 * reads the same data in-process (styleMembershipAgent.ts).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.ICONIK_INTERNAL_SECRET;
  if (!secret || request.headers.get('x-internal-secret') !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const code = parseMemberCode(request.nextUrl.searchParams.get('code'));
  const membership = code ? await findMembership('member_code_hash', hashToken(code)) : null;
  if (!membership) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  const lead = membership.lead_id ? await getLead(membership.lead_id) : null;
  return NextResponse.json({
    ok: true,
    membership: { ...membership, member_code_hash: undefined },
    quiz: lead ? quizSummary(lead.answers, lead.selfie_season) : null,
    queued: await listQueuedMessages(membership.id),
  });
}
