// Renders a checkout-recovery email in the browser, or sends a test copy.
//   /api/checkout-recovery/preview?key=<CRON_SECRET>&step=1&stage=payment_failed&addons=outfit_preview,smart_shopper
//   ...&send_to=you@example.com  → emails that rendering to you instead
// Uses a dummy token, so the preview's links resume and unsubscribe nothing.

import { NextRequest, NextResponse } from 'next/server';
import { isCheckoutRecoveryCronAuthorized, renderCheckoutRecoveryEmail, sendCheckoutRecoveryEmail } from '@/lib/checkoutRecovery';
import { normaliseRecoveryEmail, parseRecoverySource, priceRecoveryCart, type CheckoutRecoveryStage, type CheckoutRecoveryStep } from '@/lib/checkoutRecoveryModel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isCheckoutRecoveryCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const step = (['1', '2', '3'].includes(params.get('step') ?? '') ? Number(params.get('step')) : 1) as CheckoutRecoveryStep;
  const stage: CheckoutRecoveryStage = params.get('stage') === 'payment_failed' ? 'payment_failed' : 'payment_opened';
  const addonList = (params.get('addons') ?? '').split(',');
  const addons = {
    outfitPreview: addonList.includes('outfit_preview'),
    wardrobeDetox: addonList.includes('wardrobe_detox'),
    smartShopper: addonList.includes('smart_shopper'),
  };
  const source = parseRecoverySource(params.get('source')) ?? 'offer_2699_checkout';
  const { basePrice, amount } = priceRecoveryCart(source, addons);
  const row = {
    token: 'preview-token-does-not-resolve00',
    email: 'preview@example.com',
    checkout_source: source,
    topic: params.get('topic'),
    stage,
    outfit_preview: addons.outfitPreview,
    wardrobe_detox: addons.wardrobeDetox,
    smart_shopper: addons.smartShopper,
    base_price: basePrice,
    amount,
  };

  const sendTo = normaliseRecoveryEmail(params.get('send_to'));
  if (sendTo) {
    const result = await sendCheckoutRecoveryEmail(row, step, sendTo);
    return NextResponse.json({ ...result, step, stage, to: sendTo });
  }

  const email = renderCheckoutRecoveryEmail(row, step);
  const format = params.get('format');
  if (format === 'text') {
    return new NextResponse(`Subject: ${email.subject}\nPreheader: ${email.preheader}\n\n${email.text}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new NextResponse(email.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
