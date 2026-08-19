import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrderAccessToken } from '@/lib/styleScan';
import { processInstantReportToken } from '@/lib/instantReportProcessing';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('instant_reports')
    .select('order_id').in('status', ['queued', 'failed']).lt('attempt_count', 4).order('created_at').limit(2);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = await Promise.all((data || []).map(report => processInstantReportToken(createOrderAccessToken(report.order_id))));
  return NextResponse.json({ processed: results.length, results });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
