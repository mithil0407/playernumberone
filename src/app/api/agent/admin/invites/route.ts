import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { createCampaign, createTeamInvites, teamInviteLinks } from '@/lib/agentGrowthStore';

/** Creates team invite codes (first wave, partners) or a campaign link (a reel, an ad) from the dashboard. */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromCookieValue(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { count?: unknown; maxUses?: unknown; note?: unknown; campaign?: unknown };
  if (typeof body.campaign === 'string' && body.campaign.trim()) {
    const maxUses = Math.min(1_000_000, Math.max(1, Math.round(Number(body.maxUses) || 100_000)));
    return NextResponse.json({ campaign: await createCampaign(body.campaign, maxUses) });
  }
  const count = Math.min(200, Math.max(1, Math.round(Number(body.count) || 1)));
  const maxUses = Math.min(10_000, Math.max(1, Math.round(Number(body.maxUses) || 1)));
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 120) : null;
  const codes = await createTeamInvites(count, maxUses, note);
  return NextResponse.json({ invites: await teamInviteLinks(codes) });
}
