import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — fetch report by share token (no auth required)
// Only returns reports with status = 'sent'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, report_data, image_urls, share_token, sent_at')
    .eq('share_token', shareToken)
    .eq('status', 'sent')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found or not yet published' }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}
