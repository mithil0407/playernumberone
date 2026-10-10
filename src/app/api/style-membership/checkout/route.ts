import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/styleMembershipServer';
import { errorResponse, noStore, readJson, requestMeta } from '../_shared/http';

/** The first quarter (plus any ticked bumps) as one normal Razorpay payment. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const checkout = await createCheckout({
      plan: body.plan,
      bumps: body.bumps,
      leadToken: request.headers.get('x-lead-token') || undefined,
      phone: body.phone,
      email: body.email,
      firstName: body.firstName,
      consent: body.consent,
      attribution: body.attribution,
      expectedTotalPaise: body.expectedTotalPaise,
      eventId: body.eventId,
      ...requestMeta(request),
    });
    return NextResponse.json({ ok: true, ...checkout }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'checkout');
  }
}
