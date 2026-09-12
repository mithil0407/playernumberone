import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('stylists').select('name, slug')
    .eq('workspace_enabled', true).eq('is_active', true).order('name');
  if (error) return NextResponse.json({ error: 'Could not load stylist sign-in. Please try again.' }, { status: 503 });
  return NextResponse.json({ stylists: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
