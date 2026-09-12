import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadWorkspaceQueue } from '@/lib/stylistWorkspaceQueue';
import { positiveInteger, queryWorkspaceItems, workspaceCounts } from '@/lib/stylistWorkspaceQueueModel';

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const stylistId = params.get('stylist') || '';
  const page = positiveInteger(params.get('page'), 1, 100000);
  const limit = positiveInteger(params.get('limit'), 24, 50);
  try {
    const [stylistResult, all] = await Promise.all([
      supabaseAdmin.from('stylists').select('id, name, slug, is_active, workspace_enabled').order('name'),
      loadWorkspaceQueue(undefined, params.get('fresh') === '1'),
    ]);
    if (stylistResult.error) throw new Error(stylistResult.error.message);
    const stylists = (stylistResult.data ?? []).map(stylist => {
      const clients = all.filter(item => item.stylistId === stylist.id);
      return { ...stylist, clients: clients.length, forms: clients.filter(item => item.formCompleted).length, photos: clients.filter(item => item.photosSubmitted).length };
    });
    const selected = all.filter(item => !stylistId || (stylistId === 'unassigned' ? !item.stylistId : item.stylistId === stylistId));
    const visible = queryWorkspaceItems(selected, { view: params.get('bucket') || 'photos', search: params.get('search') || '' });
    return NextResponse.json({
      stylists, unassigned: all.filter(item => !item.stylistId).length,
      items: visible.slice((page - 1) * limit, page * limit), counts: workspaceCounts(selected), total: visible.length, page, limit,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[stylist-workspace] overview failed', error);
    return NextResponse.json({ error: 'Could not load the admin workspace. Please retry.' }, { status: 500 });
  }
}
