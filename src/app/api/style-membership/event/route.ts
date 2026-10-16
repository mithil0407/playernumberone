import { NextRequest, NextResponse } from 'next/server';
import { insertFunnelEvent } from '@/lib/styleMembershipStore';
import { readJson } from '../_shared/http';

// One row per quiz screen view and key action (sent with sendBeacon), so drop-off
// can be read screen by screen and by reel (utm_content).

const text = (value: unknown, max = 80) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const sessionId = text(body.sessionId, 64);
  const event = text(body.event, 60);
  if (!sessionId || !event || !/^[a-z0-9_]+$/.test(event)) return NextResponse.json({ ok: false }, { status: 400 });
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution as Record<string, unknown> : {};
  const props = body.props && typeof body.props === 'object' && !Array.isArray(body.props)
    ? Object.fromEntries(Object.entries(body.props as Record<string, unknown>).slice(0, 12).map(([key, value]) => [key.slice(0, 40), typeof value === 'string' ? value.slice(0, 120) : value]))
    : {};
  await insertFunnelEvent({
    session_id: sessionId,
    lead_id: text(body.leadId, 64),
    event,
    screen: text(body.screen, 60),
    step: typeof body.step === 'number' && Number.isFinite(body.step) ? Math.round(body.step) : null,
    props,
    utm_source: text(attribution.utm_source),
    utm_medium: text(attribution.utm_medium),
    utm_campaign: text(attribution.utm_campaign),
    utm_content: text(attribution.utm_content),
  });
  return NextResponse.json({ ok: true });
}
