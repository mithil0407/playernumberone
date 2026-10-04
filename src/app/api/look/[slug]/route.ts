import { NextRequest, NextResponse } from 'next/server';
import { isLookEventType, isLookSlug } from '@/lib/agentLookLinks';
import { loadLookView, publicLookView } from '@/lib/agentLookView';
import { hasVoted, recordLookEvent } from '@/lib/agentStore';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

/** Live verification state, polled by the page while products are being checked. */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  if (!isLookSlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const look = await loadLookView(slug);
  if (!look) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ look: publicLookView(look) }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Records likes, saves, shares and views — the retention signal for each Look. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  if (!isLookSlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isLookEventType(body.type) || body.type === 'click_out') {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }
  const look = await loadLookView(slug);
  if (!look) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const itemId = typeof body.item_id === 'string' ? body.item_id : null;
  if (itemId && !look.items.some(item => item.id === itemId)) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }
  const visitorId = typeof body.visitor_id === 'string' ? body.visitor_id.slice(0, 64) : null;
  if (body.type === 'vote') {
    if (!itemId || !visitorId) return NextResponse.json({ error: 'A vote needs a product' }, { status: 400 });
    if (await hasVoted(look.id, visitorId)) return NextResponse.json({ status: 'already_voted' });
  }
  await recordLookEvent({
    lookLinkId: look.id,
    clientId: look.clientId,
    type: body.type,
    itemId,
    visitorId,
  });
  return NextResponse.json({ status: 'ok' });
}
