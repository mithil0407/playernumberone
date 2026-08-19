import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createScanAccessToken } from '@/lib/styleScan';
import { processStyleScanToken } from '@/lib/styleScanProcessing';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('style_scan_leads')
    .select('id').in('scan_status', ['submitted', 'failed']).lt('generation_attempts', 4).order('submitted_at').limit(2);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = await Promise.all((data || []).map(scan => processStyleScanToken(createScanAccessToken(scan.id))));
  return NextResponse.json({ processed: results.length, results });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
