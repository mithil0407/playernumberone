// Records a ₹2,699 checkout lead once a valid email and WhatsApp number are
// entered, so the recovery emails can reach people who leave before Pay.
// Always answers 200: the checkout fires this in the background and must never
// surface an error for it.

import { NextRequest, NextResponse } from 'next/server';
import { attributionToColumns } from '@/lib/attribution';
import { recordCheckoutLead } from '@/lib/checkoutRecovery';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const attribution = attributionToColumns(body.attribution);
  const result = await recordCheckoutLead({
    email: body.email,
    phone: body.phone,
    whatsappOptIn: body.whatsapp_opt_in,
    checkoutSource: body.checkout_source,
    topic: body.topic,
    addons: body.add_ons,
    stage: 'details',
    attribution,
  });
  return NextResponse.json({ ok: result.ok });
}
