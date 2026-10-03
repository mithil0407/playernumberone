import { NextRequest, NextResponse } from 'next/server';
import { decorateRetailUrl, isSafeRetailUrl } from '@/lib/agentLookLinks';
import { loadLookLinkItem, recordLookEvent } from '@/lib/agentStore';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every "Shop" tap on a Look page lands here: record the click-out (the GMV
 * signal), then forward to the retailer with tracking.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const home = new URL('/', request.url);
  if (!UUID.test(itemId)) return NextResponse.redirect(home);

  const item = await loadLookLinkItem(itemId);
  const link = Array.isArray(item?.look_links) ? item?.look_links[0] : item?.look_links;
  if (!item || !link || !isSafeRetailUrl(item.url)) return NextResponse.redirect(home);

  await recordLookEvent({
    lookLinkId: item.look_link_id,
    clientId: link.client_id,
    type: 'click_out',
    itemId: item.id,
    visitorId: request.nextUrl.searchParams.get('v')?.slice(0, 64) ?? null,
  });
  return NextResponse.redirect(decorateRetailUrl(item.url, { lookSlug: link.slug, itemId: item.id }), 302);
}
