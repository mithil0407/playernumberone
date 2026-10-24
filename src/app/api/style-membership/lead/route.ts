import { NextRequest, NextResponse } from 'next/server';
import { createLeadFromGate, leadFromToken, publicLead } from '@/lib/styleMembershipServer';
import { errorResponse, noStore, readJson, requestMeta } from '../_shared/http';

/** The WhatsApp gate: number (required, with consent), email optional. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const { lead, token } = await createLeadFromGate({
      phone: body.phone,
      email: body.email,
      firstName: body.firstName,
      consent: body.consent,
      answers: body.answers,
      sessionId: body.sessionId,
      attribution: body.attribution,
      eventId: body.eventId,
      ...requestMeta(request),
    });
    return NextResponse.json({ ok: true, token, lead: publicLead(lead) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'gate');
  }
}

/** Her lead, for the result page (token in a header, never the URL). */
export async function GET(request: NextRequest) {
  try {
    const lead = await leadFromToken(request.headers.get('x-lead-token'));
    return NextResponse.json({ ok: true, lead: publicLead(lead) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'load lead');
  }
}
