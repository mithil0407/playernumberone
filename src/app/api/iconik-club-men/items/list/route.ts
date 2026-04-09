import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status   = searchParams.get('status')   ?? 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const search   = searchParams.get('search')   ?? '';
    const category = searchParams.get('category') ?? '';

    const admin = createSupabaseAdminServerClient();
    // Exclude ai_raw_response and style_tags (large JSON) — only needed on the detail view
    const LIST_COLUMNS = 'id, item_name, category, color, material, brand, price, currency, size_availability, purchase_link, style_description, image_url, ai_confidence, status, uploaded_by, created_at, updated_at';
    let query = admin.from('men_fashion_items').select(LIST_COLUMNS, { count: 'exact' });

    if (status !== 'all') query = query.eq('status', status);
    if (category)         query = query.eq('category', category);
    if (search)           query = query.ilike('item_name', `%${search}%`);

    const from = (page - 1) * limit;
    const { data: items, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: items ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error('Men items list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
