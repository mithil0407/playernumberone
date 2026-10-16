import { NextRequest, NextResponse } from 'next/server';
import { createMandate, membershipForMember } from '@/lib/styleMembershipServer';
import { errorResponse, noStore, readJson } from '../_shared/http';

/** After the first payment: an optional autopay mandate for the renewals. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const membership = await membershipForMember(body.membershipId, body.code);
    return NextResponse.json({ ok: true, ...(await createMandate(membership)) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'mandate');
  }
}
