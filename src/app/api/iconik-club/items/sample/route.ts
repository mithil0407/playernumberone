import { NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';

// Public — no auth. Returns a small set of active items for the OTO preview card.
export async function GET() {
  try {
    const supabase = createSupabaseAdminServerClient();

    const { data: items, error } = await supabase
      .from('fashion_items')
      .select('id, item_name, brand, image_url, price, currency, purchase_link, category')
      .eq('status', 'active')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return NextResponse.json({ items: items ?? [] });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
