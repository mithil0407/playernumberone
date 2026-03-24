import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const admin = createSupabaseAdminServerClient();

  // Look up the client by preview_token
  const { data: profile, error: profileErr } = await admin
    .from('client_profiles')
    .select('id, name, email, token_expires_at')
    .eq('preview_token', token)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  // Check expiry
  if (profile.token_expires_at && new Date(profile.token_expires_at as string) < new Date()) {
    return NextResponse.json({ error: 'This preview link has expired' }, { status: 410 });
  }

  const profileId = profile.id as string;

  // Fetch ready outfit sets
  const { data: outfitSets } = await admin
    .from('outfit_sets')
    .select('*')
    .eq('client_id', profileId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  if (!outfitSets?.length) {
    return NextResponse.json({ client: profile, outfits: [] });
  }

  // Fetch items for each outfit
  const outfitIds = outfitSets.map(o => o.id);
  const { data: outfitItems } = await admin
    .from('outfit_items')
    .select('outfit_set_id, fashion_item_id, position')
    .in('outfit_set_id', outfitIds);

  const itemIds = [...new Set((outfitItems ?? []).map(oi => oi.fashion_item_id))];
  const { data: fashionItems } = itemIds.length
    ? await admin.from('fashion_items').select('*').in('id', itemIds)
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

  return NextResponse.json({ client: { name: profile.name, email: profile.email }, outfits });
}
