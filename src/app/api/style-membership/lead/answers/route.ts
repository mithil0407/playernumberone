import { NextRequest, NextResponse } from 'next/server';
import { leadFromToken, publicLead, sanitizeAnswers } from '@/lib/styleMembershipServer';
import { updateLead } from '@/lib/styleMembershipStore';
import { errorResponse, noStore, readJson } from '../../_shared/http';

/** Saves quiz answers to an existing lead (members who paid on the sales page take the quiz after). */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const lead = await leadFromToken(request.headers.get('x-lead-token'));
    const updated = await updateLead(lead.id, { answers: { ...lead.answers, ...sanitizeAnswers(body.answers) } });
    return NextResponse.json({ ok: true, lead: publicLead(updated ?? lead) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'save answers');
  }
}
