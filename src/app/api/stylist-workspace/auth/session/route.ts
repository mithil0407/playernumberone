import { NextResponse } from 'next/server';
import { getStylistWorkspaceIdentity } from '@/lib/stylistWorkspaceAuth';

export async function GET() {
  const identity = await getStylistWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ stylist: identity });
}
