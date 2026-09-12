import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { revalidateManReportCache } from '@/lib/manReportCache';

/** Refreshes report views after an out-of-band shopping-data repair. Never crawls. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  await revalidateManReportCache(reportId);
  return NextResponse.json({ status: 'revalidated', reportId });
}
