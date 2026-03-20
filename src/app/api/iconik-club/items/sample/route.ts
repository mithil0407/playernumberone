import { NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';

// Public — no auth. Returns one item per category (top, bottom, footwear, accessory) for the OTO preview card.
export async function GET() {
  try {
    const supabase = createSupabaseAdminServerClient();

    const categoryPatterns = [
      { key: 'top', patterns: ['top', 'tops', 'shirt', 'blouse', 'kurta', 'tshirt', 't-shirt'] },
      { key: 'bottom', patterns: ['bottom', 'bottoms', 'pant', 'pants', 'trouser', 'trousers', 'skirt', 'jeans', 'legging'] },
      { key: 'footwear', patterns: ['footwear', 'shoe', 'shoes', 'sandal', 'sandals', 'heel', 'heels', 'boot', 'boots', 'flat', 'flats'] },
      { key: 'accessory', patterns: ['accessory', 'accessories', 'bag', 'bags', 'jewellery', 'jewelry', 'watch', 'belt', 'scarf', 'earring', 'necklace', 'handbag'] },
    ];

    const results = await Promise.all(
      categoryPatterns.map(({ patterns }) =>
        supabase
          .from('fashion_items')
          .select('id, item_name, brand, image_url, price, currency, purchase_link, category')
          .eq('status', 'active')
          .not('image_url', 'is', null)
          .or(patterns.map(p => `category.ilike.%${p}%`).join(','))
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data }) => data?.[0] ?? null)
      )
    );

    const items = results.filter(Boolean);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
