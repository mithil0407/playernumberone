// Renders a colour-scan nurture email in the browser, or sends a test copy.
//   /api/colour-scan-nurture/preview?key=<CRON_SECRET>&step=1&upcoming=wedding&dress=ethnic_leaning
//   ...&scan_id=<style_scan_leads.id>   → uses that real scan's colours
//   ...&send_to=you@example.com          → emails that rendering to you instead
// Uses a dummy unsubscribe token, so the preview's unsubscribe link does nothing.

import { NextRequest, NextResponse } from 'next/server';
import { isCheckoutRecoveryCronAuthorized } from '@/lib/checkoutRecovery';
import { renderColourScanNurtureEmail, sendColourScanNurtureEmail } from '@/lib/colourScanNurture';
import { parseNurtureStep } from '@/lib/colourScanNurtureModel';
import { normalizeScanEmail } from '@/lib/styleScan';
import { buildColourProfile } from '@/lib/styleScanColour';

export const dynamic = 'force-dynamic';

const SAMPLE_COLOUR = buildColourProfile({
  colour: {
    undertone_direction: 'warm',
    depth: 'medium',
    contrast: 'medium',
    palette_name: 'Warm Muted Earth',
    base_palette: [
      { name: 'Warm Ivory', hex: '#F3EBDD' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Chocolate', hex: '#4E3226' },
      { name: 'Deep Teal', hex: '#1F6F6B' },
      { name: 'Rust', hex: '#A4492A' },
      { name: 'Olive', hex: '#6B6B35' },
      { name: 'Mustard', hex: '#C9A227' },
      { name: 'Warm Navy', hex: '#24324A' },
      { name: 'Terracotta', hex: '#B9643F' },
      { name: 'Forest', hex: '#2E4A36' },
      { name: 'Taupe', hex: '#8F7E6E' },
      { name: 'Soft Peach', hex: '#E8B595' },
      { name: 'Wine', hex: '#6A2433' },
      { name: 'Denim', hex: '#4A6382' },
      { name: 'Ink', hex: '#1E1E24' },
    ],
    accent_palette: [
      { name: 'Marigold', hex: '#E0A030' },
      { name: 'Emerald', hex: '#0F7B55' },
      { name: 'Coral', hex: '#E0735A' },
      { name: 'Plum', hex: '#5B2A4B' },
      { name: 'Copper', hex: '#B87333' },
    ],
    avoid_colours: ['icy lavender', 'stark optic white near the face', 'silver grey'],
  },
  jewelleryDirection: 'Warm yellow gold and brass in medium scale.',
  makeupColours: ['Soft terracotta lip', 'Warm peach cheek'],
});

export async function GET(request: NextRequest) {
  if (!isCheckoutRecoveryCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const step = parseNurtureStep(params.get('step')) ?? 1;
  const scanId = params.get('scan_id');
  const row = {
    token: 'preview-token-does-not-resolve00',
    email: 'preview@example.com',
    // A real scan id gives real colours and working result links; the zero UUID gives the sample.
    scan_id: scanId && /^[0-9a-f-]{36}$/i.test(scanId) ? scanId : '00000000-0000-0000-0000-000000000000',
    first_name: params.get('name') ?? 'Priya',
    upcoming: params.get('upcoming') ?? 'wedding',
    dress_code: params.get('dress') ?? 'mixed',
  };
  const colour = scanId ? undefined : SAMPLE_COLOUR;

  const sendTo = normalizeScanEmail(params.get('send_to'));
  if (sendTo) {
    const result = await sendColourScanNurtureEmail(row, step, { to: sendTo, colour });
    return NextResponse.json({ ...result, step, to: sendTo });
  }

  const email = await renderColourScanNurtureEmail(row, step, colour);
  if (params.get('format') === 'text') {
    return new NextResponse(`Subject: ${email.subject}\nPreheader: ${email.preheader}\n\n${email.text}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new NextResponse(email.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
