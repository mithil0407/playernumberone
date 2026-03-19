import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const search = searchParams.get('search') ?? '';

    const onboarding = searchParams.get('onboarding_complete');

    const supabaseAdmin = createSupabaseAdminServerClient();
    let query = supabaseAdmin.from('client_profiles').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (onboarding === 'true')  query = query.eq('onboarding_complete', true);
    if (onboarding === 'false') query = query.eq('onboarding_complete', false);

    const from = (page - 1) * limit;

    const { data: clients, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ clients: clients ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error('List clients error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
