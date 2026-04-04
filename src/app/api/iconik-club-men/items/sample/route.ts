import { NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';

// Public — no auth. Returns one item per men's category for the join page preview.
export async function GET() {
  try {
    const admin = createSupabaseAdminServerClient();

    const categoryPatterns = [
      { key: 'shirt',    patterns: ['shirt', 'tshirt', 't-shirt', 'kurta', 'blazer'] },
      { key: 'trousers', patterns: ['trousers', 'jeans', 'chinos', 'pants', 'bottom'] },
      { key: 'shoes',    patterns: ['shoes', 'shoe', 'loafer', 'sneaker', 'boot', 'oxford', 'derby'] },
      { key: 'accessory', patterns: ['accessory', 'watch', 'belt', 'pocket square', 'wallet'] },
    ];

    const results = await Promise.all(
      categoryPatterns.map(({ patterns }) =>
        admin
          .from('men_fashion_items')
          .select('id, item_name, brand, image_url, price, currency, purchase_link, category')
          .eq('status', 'active')
          .not('image_url', 'is', null)
          .or(patterns.map(p => `category.ilike.%${p}%`).join(','))
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data }) => data?.[0] ?? null)
      )
    );

    return NextResponse.json({ items: results.filter(Boolean) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
