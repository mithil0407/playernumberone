import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  clientIp,
  getStyleScanByToken,
  normalizeScanEmail,
  normalizeScanPhone,
  pickStyleScanAnswers,
  sanitizeFirstName,
  STYLE_SCAN_CONSENT_VERSION,
  validateStyleScanAnswers,
} from '@/lib/styleScan';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const scan = await getStyleScanByToken(token, 'id, scan_status, photo_paths');
    if (!scan) return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
    if (!['draft', 'retake_required'].includes(scan.scan_status)) {
      return NextResponse.json({ error: 'This scan has already been submitted.' }, { status: 409 });
    }
    const photos = scan.photo_paths && typeof scan.photo_paths === 'object' ? scan.photo_paths as Record<string, unknown> : {};
    // The full-body photo is optional since the colour-first scan; the selfie is not.
    if (!photos.headshot) {
      return NextResponse.json({ error: 'Please upload your selfie first.' }, { status: 400 });
    }
    if (!validateStyleScanAnswers(body.answers)) {
      return NextResponse.json({ error: 'Please answer all the questions.' }, { status: 400 });
    }
    const email = normalizeScanEmail(body.email);
    if (!email) return NextResponse.json({ error: 'Enter a valid email address so we can send your colours.' }, { status: 400 });
    const phone = normalizeScanPhone(body.phone);
    if (!phone) return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    if (body.whatsappOptIn !== true) {
      return NextResponse.json({ error: 'WhatsApp consent is required to complete the scan.' }, { status: 400 });
    }
    const now = new Date().toISOString();
    // First name is optional; when present it rides inside the scan_answers JSON (no schema change).
    const firstName = sanitizeFirstName(body.firstName);
    const picked = pickStyleScanAnswers(body.answers);
    const answers = firstName ? { ...picked, firstName } : picked;
    const { error } = await supabaseAdmin.from('style_scan_leads').update({
      email,
      phone_e164: phone,
      whatsapp_opt_in: true,
      whatsapp_consent_at: now,
      consent_policy_version: STYLE_SCAN_CONSENT_VERSION,
      consent_ip: clientIp(request.headers),
      consent_user_agent: request.headers.get('user-agent'),
      scan_answers: answers,
      diagnosis_answers: answers,
      style_struggle: picked.concern,
      dressing_context: picked.dressCode,
      scan_status: 'submitted',
      submitted_at: now,
      updated_at: now,
    }).eq('id', scan.id);
    if (error) throw error;
    return NextResponse.json({ success: true, resultUrl: `/style-scan/result/${encodeURIComponent(token)}` });
  } catch (error) {
    console.error('[style-scan] submit failed:', error);
    return NextResponse.json({ error: 'We could not submit your scan. Please try again.' }, { status: 500 });
  }
}
