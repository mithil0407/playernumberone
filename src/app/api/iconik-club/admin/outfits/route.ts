import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const status   = searchParams.get('status') ?? 'all';
    const clientId = searchParams.get('client_id') ?? '';

    const supabaseAdmin = createSupabaseAdminServerClient();
    let query = supabaseAdmin.from('outfit_sets').select('*', { count: 'exact' });

    if (status !== 'all') query = query.eq('status', status);
    if (clientId)         query = query.eq('client_id', clientId);

    const from = (page - 1) * limit;

    const { data: outfits, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch client names for display
    if (outfits?.length) {
      const clientIds = [...new Set(outfits.map(o => o.client_id))];
      const { data: profiles } = await supabaseAdmin
        .from('client_profiles')
        .select('id, name, email')
        .in('id', clientIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      const enriched = outfits.map(o => ({
        ...o,
        client_name: profileMap[o.client_id]?.name ?? profileMap[o.client_id]?.email ?? '—',
      }));

      return NextResponse.json({ outfits: enriched, total: count ?? 0, page, limit });
    }

    return NextResponse.json({ outfits: outfits ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error('List outfits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
