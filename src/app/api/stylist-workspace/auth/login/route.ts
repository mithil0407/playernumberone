import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkspaceSession,
  getWorkspaceStylistBySlug,
  isWorkspaceLoginLocked,
  recordWorkspaceLoginAttempt,
  markWorkspaceLoginSucceeded,
  requestIp,
  setWorkspaceSessionCookie,
  verifyWorkspacePin,
} from '@/lib/stylistWorkspaceAuth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { slug?: string; pin?: string } | null;
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) || !/^\d{4,12}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid stylist or PIN' }, { status: 401 });
  }

  try {
    const stylist = await getWorkspaceStylistBySlug(slug);
    if (!stylist) return NextResponse.json({ error: 'Invalid stylist or PIN' }, { status: 401 });
    const ip = requestIp(request);
    if (await isWorkspaceLoginLocked(stylist.id, ip)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }

    // Record before the expensive PIN check, including interrupted attempts.
    const attemptId = await recordWorkspaceLoginAttempt(stylist.id, ip, false);
    const verified = await verifyWorkspacePin(stylist.id, pin);
    if (!verified) return NextResponse.json({ error: 'Invalid stylist or PIN' }, { status: 401 });
    await markWorkspaceLoginSucceeded(attemptId);

    const session = await createWorkspaceSession({
      stylistId: stylist.id,
      ip,
      userAgent: request.headers.get('user-agent'),
    });
    const response = NextResponse.json({
      success: true,
      stylist: { id: stylist.id, name: stylist.name, slug: stylist.slug },
      expiresAt: session.expiresAt,
    });
    setWorkspaceSessionCookie(response, session.token);
    return response;
  } catch {
    return NextResponse.json({ error: 'Sign-in is temporarily unavailable. Please try again shortly.' }, { status: 503, headers: { 'Retry-After': '30' } });
  }
}
