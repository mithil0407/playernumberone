import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createSupabaseAdminServerClient();

    const { data: profile } = await admin
      .from('men_client_profiles').select('id').eq('user_id', user.id).single();

    if (!profile) return NextResponse.json({ outfits: [] });

    const { data: outfitSets } = await admin
      .from('men_outfit_sets')
      .select('*')
      .eq('client_id', profile.id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });

    if (!outfitSets?.length) return NextResponse.json({ outfits: [] });

    const outfitIds = outfitSets.map(o => o.id);
    const { data: outfitItems } = await admin
      .from('men_outfit_items')
      .select('outfit_set_id, fashion_item_id, position')
      .in('outfit_set_id', outfitIds);

    const itemIds = [...new Set((outfitItems ?? []).map(oi => oi.fashion_item_id))];
    const { data: fashionItems } = itemIds.length
      ? await admin.from('men_fashion_items').select('*').in('id', itemIds)
      : { data: [] };

    const itemMap = Object.fromEntries((fashionItems ?? []).map(i => [i.id, i]));

    const outfits = outfitSets.map(set => ({
      ...set,
      items: (outfitItems ?? [])
        .filter(oi => oi.outfit_set_id === set.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(oi => itemMap[oi.fashion_item_id])
        .filter(Boolean),
    }));

    return NextResponse.json({ outfits }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('Men outfits list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
