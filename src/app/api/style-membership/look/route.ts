import { NextRequest, NextResponse } from 'next/server';
import { ensurePersonalLook, leadFromToken, publicLead } from '@/lib/styleMembershipServer';
import { getLead, getObject } from '@/lib/styleMembershipStore';
import { errorResponse, noStore } from '../_shared/http';

export const maxDuration = 90;

/**
 * Her look 1, generated once and only when she opens her result after the
 * WhatsApp gate. Never generated for anyone who hasn't reached it.
 */
export async function POST(request: NextRequest) {
  try {
    const lead = await leadFromToken(request.headers.get('x-lead-token'));
    const updated = await ensurePersonalLook(lead);
    return NextResponse.json({ ok: true, lead: publicLead(updated) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'look');
  }
}

/** The generated picture (a model matched to her, not her photo). */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('lead') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const lead = await getLead(id);
  const bytes = lead?.look_status === 'ready' && lead.look_path ? await getObject(lead.look_path) : null;
  if (!bytes) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=86400', 'X-Robots-Tag': 'noindex' },
  });
}
