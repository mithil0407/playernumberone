import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { runStyleEditIssuePipeline } from '@/lib/styleEditGenerator';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { issueId } = await params;
  after(async () => {
    await runStyleEditIssuePipeline(issueId).catch(() => {});
  });
  return NextResponse.json({ issueId, status: 'generating' });
}
