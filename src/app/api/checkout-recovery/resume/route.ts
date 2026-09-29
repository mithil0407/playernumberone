// Resume links from the checkout-recovery emails.
//
// GET  ?t=<token>&step=N — the link in the email. Puts the token in a short-lived
//      cookie scoped to this route and redirects to a clean checkout URL, so the
//      token never appears in a page URL the Meta pixel reports. Read-only,
//      because mail scanners open every link.
// POST — called by the checkout when it loads with ?restore=1. Reads the cookie
//      and returns the saved cart to prefill.

import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_RECOVERY_COOKIE, findCheckoutRecoveryLink, restoreCheckoutRecovery } from '@/lib/checkoutRecovery';
import { parseRecoveryStep, recoveryCheckoutUrl } from '@/lib/checkoutRecoveryModel';
import { BLUEPRINT_OFFER } from '@/lib/siteFacts';

const COOKIE_PATH = '/api/checkout-recovery/resume';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const link = await findCheckoutRecoveryLink(params.get('t'));
  if (!link) {
    return NextResponse.redirect(new URL(BLUEPRINT_OFFER.checkoutPath, request.url), 303);
  }

  const response = NextResponse.redirect(recoveryCheckoutUrl(link, parseRecoveryStep(params.get('step'))), 303);
  response.cookies.set(CHECKOUT_RECOVERY_COOKIE, link.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: 60 * 60,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function POST(request: NextRequest) {
  const cart = await restoreCheckoutRecovery(request.cookies.get(CHECKOUT_RECOVERY_COOKIE)?.value);
  if (!cart) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, cart }, { headers: { 'Cache-Control': 'no-store' } });
}
