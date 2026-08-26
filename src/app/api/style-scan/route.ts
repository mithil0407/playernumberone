import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { createScanAccessToken, hashPrivateToken, safeAttribution } from '@/lib/styleScan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const attribution = safeAttribution(body.attribution);
    // Generate the UUID here so the access token and its hash can be inserted
    // atomically. This removes a second database round trip from "Start".
    const draftId = crypto.randomUUID();
    const token = createScanAccessToken(draftId);
    const { data, error } = await supabaseAdmin
      .from('style_scan_leads')
      .insert({
        id: draftId,
        email: null,
        source: 'iconik_style_scan',
        scan_status: 'draft',
        result_token_hash: hashPrivateToken(token),
        ...attribution,
      })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, token, draftId: data.id }, {
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    console.error('[style-scan] create failed:', error);
    return NextResponse.json({ error: 'We could not start your scan. Please try again.' }, { status: 500 });
  }
}
