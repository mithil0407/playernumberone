import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkspaceSession,
  getWorkspaceStylistBySlug,
  isWorkspaceLoginLocked,
  recordWorkspaceLoginAttempt,
  requestIp,
  setWorkspaceSessionCookie,
  verifyWorkspacePin,
} from '@/lib/stylistWorkspaceAuth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { slug?: string; pin?: string } | null;
  const slug = body?.slug?.trim().toLowerCase() ?? '';
  const pin = body?.pin?.trim() ?? '';
  if (!slug || !/^\d{4,12}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid stylist or PIN' }, { status: 401 });
  }

  const stylist = await getWorkspaceStylistBySlug(slug);
  if (!stylist) return NextResponse.json({ error: 'Workspace access is not enabled' }, { status: 403 });
  const ip = requestIp(request);
  if (await isWorkspaceLoginLocked(stylist.id, ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const verified = await verifyWorkspacePin(stylist.id, pin);
  await recordWorkspaceLoginAttempt(stylist.id, ip, verified);
  if (!verified) return NextResponse.json({ error: 'Invalid stylist or PIN' }, { status: 401 });

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
}
