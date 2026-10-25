import { NextResponse } from 'next/server';

// Account activation is handled by the signature-verified Razorpay webhook.
export async function POST() {
  return NextResponse.json({ success: false, error: 'Activation is handled automatically after payment.' }, { status: 410 });
}
