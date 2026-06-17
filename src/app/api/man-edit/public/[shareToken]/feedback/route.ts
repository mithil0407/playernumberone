import { NextRequest, NextResponse } from 'next/server';
import { hasActiveManEdit, loadManEditReportContext, rebuildManEditProfile } from '@/lib/manEdit';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const context = await loadManEditReportContext(shareToken, true);

  if (!context) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (!hasActiveManEdit(context)) return NextResponse.json({ error: 'Active Iconik Edit subscription required' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const outfitKey = typeof body.outfit_key === 'string' ? body.outfit_key.trim() : '';
  const vote = body.vote === 'like' || body.vote === 'dislike' ? body.vote : '';

  if (!outfitKey || !vote) {
    return NextResponse.json({ error: 'Missing outfit_key or vote' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('man_report_outfit_feedback')
    .upsert({
      report_id: context.report.id,
      subscription_id: context.subscription?.id ?? null,
      customer_email: String(context.subscription?.customer_email ?? context.submission.customer_email),
      outfit_key: outfitKey,
      outfit_number: typeof body.outfit_number === 'number' ? body.outfit_number : null,
      outfit_label: typeof body.outfit_label === 'string' ? body.outfit_label : null,
      vote,
    }, { onConflict: 'report_id,outfit_key' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const refreshed = await loadManEditReportContext(shareToken, true);
  if (refreshed?.subscription) {
    await rebuildManEditProfile(refreshed).catch(() => null);
  }

  return NextResponse.json({ feedback: data });
}
