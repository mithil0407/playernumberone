import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('instant_reports')
    .select('id, status, progress_stage, error_message, sla_due_at, created_at, approved_at, stylist_orders(customer_name, customer_email, customer_phone)')
    .order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data || [] });
}

