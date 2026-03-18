import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminServerClient();

  const { data: profile } = await admin
    .from('client_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Fetch the outfit set
  const { data: outfitSet, error } = await admin
    .from('outfit_sets')
    .select('*')
    .eq('id', id)
    .eq('client_id', profile.id)
    .single();

  if (error || !outfitSet) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch items for this outfit
  const { data: outfitItems } = await admin
    .from('outfit_items')
    .select('fashion_item_id, position')
    .eq('outfit_set_id', id)
    .order('position', { ascending: true });

  const itemIds = (outfitItems ?? []).map(oi => oi.fashion_item_id);
  const { data: fashionItems } = itemIds.length
    ? await admin.from('fashion_items').select('*').in('id', itemIds)
    : { data: [] };

  const itemMap = Object.fromEntries((fashionItems ?? []).map(i => [i.id, i]));

  const outfit = {
    ...outfitSet,
    items: (outfitItems ?? [])
      .map(oi => itemMap[oi.fashion_item_id])
      .filter(Boolean),
  };

  return NextResponse.json({ outfit });
}
