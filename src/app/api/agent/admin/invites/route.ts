import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { inviteLink } from '@/lib/agentGrowth';
import { createTeamInvites } from '@/lib/agentGrowthStore';

/** Creates team invite codes (first wave, partners, campaigns) from the dashboard. */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromCookieValue(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { count?: unknown; maxUses?: unknown; note?: unknown };
  const count = Math.min(200, Math.max(1, Math.round(Number(body.count) || 1)));
  const maxUses = Math.min(10_000, Math.max(1, Math.round(Number(body.maxUses) || 1)));
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 120) : null;
  const codes = await createTeamInvites(count, maxUses, note);
  return NextResponse.json({ invites: codes.map(code => ({ code, link: inviteLink(code) })) });
}
