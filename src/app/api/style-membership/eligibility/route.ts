import { NextRequest, NextResponse } from 'next/server';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { leadFromToken } from '@/lib/styleMembershipServer';
import { isPastBuyer } from '@/lib/styleMembershipStore';
import { errorResponse, noStore, readJson } from '../_shared/http';

/** Whether the founding price can be shown: only for past ICONIK buyers. */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-lead-token');
    if (token) {
      const lead = await leadFromToken(token);
      return NextResponse.json({ ok: true, eligible: await isPastBuyer(lead.phone, lead.email) }, { headers: noStore });
    }
    const body = await readJson(request);
    const phone = normalizeIndianWhatsappNumber(typeof body.phone === 'string' ? body.phone : '');
    const email = typeof body.email === 'string' && body.email.includes('@') ? body.email.trim().toLowerCase() : null;
    if (!phone) return NextResponse.json({ ok: true, eligible: false }, { headers: noStore });
    return NextResponse.json({ ok: true, eligible: await isPastBuyer(phone, email) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'eligibility');
  }
}
