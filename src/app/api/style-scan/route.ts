import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createScanAccessToken, hashPrivateToken, safeAttribution } from '@/lib/styleScan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const attribution = safeAttribution(body.attribution);
    const { data, error } = await supabaseAdmin
      .from('style_scan_leads')
      .insert({
        email: null,
        source: 'iconik_style_scan',
        scan_status: 'draft',
        ...attribution,
      })
      .select('id')
      .single();
    if (error) throw error;
    const token = createScanAccessToken(data.id);
    const { error: tokenError } = await supabaseAdmin.from('style_scan_leads')
      .update({ result_token_hash: hashPrivateToken(token) }).eq('id', data.id);
    if (tokenError) throw tokenError;
    return NextResponse.json({ success: true, token, draftId: data.id }, {
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    console.error('[style-scan] create failed:', error);
    return NextResponse.json({ error: 'We could not start your scan. Please try again.' }, { status: 500 });
  }
}
