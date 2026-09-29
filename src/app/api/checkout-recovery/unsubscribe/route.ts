// Stops checkout-recovery emails. Handles both the RFC 8058 one-click POST that
// Gmail and Apple Mail send from the List-Unsubscribe header (token in the
// query) and the confirm button on /checkout-recovery/unsubscribe (token in the
// form). There is deliberately no GET: link scanners prefetch GETs.

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeCheckoutRecovery } from '@/lib/checkoutRecovery';

export async function POST(request: NextRequest) {
  const queryToken = request.nextUrl.searchParams.get('t');
  let formToken: string | null = null;
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('form')) {
    const form = await request.formData().catch(() => null);
    const value = form?.get('t');
    formToken = typeof value === 'string' ? value : null;
  }

  const token = formToken ?? queryToken;
  const ok = await unsubscribeCheckoutRecovery(token);

  // The confirm page posts a form without `t` in the query; send it back to the page.
  if (formToken) {
    const back = new URL('/checkout-recovery/unsubscribe', request.url);
    back.searchParams.set('t', formToken);
    back.searchParams.set(ok ? 'done' : 'error', '1');
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
