import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { buildStyleEditClientProfile } from '@/lib/styleEditProfile';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId } = await params;
  try {
    const profile = await buildStyleEditClientProfile(subscriptionId);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Profile rebuild failed' }, { status: 500 });
  }
}
