import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { occasionCampaign } from '@/lib/agentOccasionLooks';
import {
  listOccasionLooks,
  prepareOccasionLooks,
  sendOccasionInvites,
  setOccasionLookSkipped,
} from '@/lib/agentOccasionLookStore';

export const maxDuration = 300;

function authorised(request: NextRequest) {
  return isAdminAuthenticatedFromCookieValue(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const campaign = request.nextUrl.searchParams.get('campaign') ?? '';
  if (!occasionCampaign(campaign)) return NextResponse.json({ error: 'Unknown campaign' }, { status: 400 });
  return NextResponse.json({ looks: await listOccasionLooks(campaign) });
}

/**
 * Occasion looks from the dashboard: list every Blueprint client, leave some
 * out, then invite them (with a dry run first). Looks are only drawn when a
 * client asks to see his.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const campaign = typeof body.campaign === 'string' ? body.campaign : '';
  if (!occasionCampaign(campaign)) return NextResponse.json({ error: 'Unknown campaign' }, { status: 400 });

  try {
    switch (body.action) {
      case 'prepare':
        return NextResponse.json(await prepareOccasionLooks(campaign));
      case 'skip':
      case 'unskip':
        if (typeof body.id !== 'string') return NextResponse.json({ error: 'Choose a client' }, { status: 400 });
        await setOccasionLookSkipped(body.id, body.action === 'skip');
        return NextResponse.json({ ok: true });
      case 'send':
        return NextResponse.json(await sendOccasionInvites(campaign, {
          dryRun: body.dryRun !== false,
          limit: Number(body.limit) || undefined,
          channels: { whatsapp: body.whatsapp === true, email: body.email !== false },
        }));
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Something went wrong' }, { status: 500 });
  }
}
