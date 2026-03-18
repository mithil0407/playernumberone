import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminServerClient();
  const { data: item, error } = await supabaseAdmin
    .from('fashion_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body   = await request.json();

  // Strip immutable fields
  const { id: _id, created_at: _ca, uploaded_by: _ub, ai_raw_response: _ar, ...updates } = body;

  const supabaseAdmin = createSupabaseAdminServerClient();
  const { data: item, error } = await supabaseAdmin
    .from('fashion_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminServerClient();
  const { error } = await supabaseAdmin
    .from('fashion_items')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
