import { NextResponse } from 'next/server';

// Browser requests cannot establish that a subscription was paid.
export async function POST() {
  return NextResponse.json({ success: false, error: 'Activation is handled automatically after payment.' }, { status: 410 });
}
