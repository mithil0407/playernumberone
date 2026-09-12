import { NextRequest, NextResponse } from 'next/server';
import { getStylistWorkspaceIdentity, isAdminCookieAuthenticated, getWorkspaceStylistBySlug } from '@/lib/stylistWorkspaceAuth';
import { loadWorkspaceQueue } from '@/lib/stylistWorkspaceQueue';
import { positiveInteger, queryWorkspaceItems, workspaceCounts } from '@/lib/stylistWorkspaceQueueModel';

export async function GET(request: NextRequest) {
  const previewSlug = request.nextUrl.searchParams.get('stylistSlug');
  const adminStylist = previewSlug && await isAdminCookieAuthenticated() ? await getWorkspaceStylistBySlug(previewSlug) : null;
  const identity = adminStylist ? { stylistId: adminStylist.id, name: adminStylist.name, slug: adminStylist.slug } : await getStylistWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const page = positiveInteger(params.get('page'), 1, 100000);
  const limit = positiveInteger(params.get('limit'), 24, 50);
  try {
    const items = await loadWorkspaceQueue(identity.stylistId, params.get('fresh') === '1');
    const visible = queryWorkspaceItems(items, { view: params.get('bucket') || 'recent', search: params.get('search') || '', due: params.get('due') || '' });
    return NextResponse.json({
      stylist: { name: identity.name, slug: identity.slug },
      items: visible.slice((page - 1) * limit, page * limit), counts: workspaceCounts(items), total: visible.length, page, limit,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[stylist-workspace] queue failed', error);
    return NextResponse.json({ error: 'Could not load the client queue. Please retry.' }, { status: 500 });
  }
}
