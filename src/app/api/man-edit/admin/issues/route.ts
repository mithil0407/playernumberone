// POST /api/man-edit/admin/issues — start the next Edit issue for a subscriber.
// Body: { subscription_id, allow_ahead? }. Returns immediately; the writer and
// image pipeline run via after(). The admin page polls the issue row.

import { NextRequest, NextResponse, after } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { createEditIssueDraft, runEditIssuePipeline } from '@/lib/manEditIssues';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const subscriptionId = typeof body.subscription_id === 'string' ? body.subscription_id : '';
  if (!subscriptionId) return NextResponse.json({ error: 'subscription_id is required' }, { status: 400 });

  const result = await createEditIssueDraft(subscriptionId, { allowAhead: body.allow_ahead === true });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  if (result.created) after(() => runEditIssuePipeline(result.reportId));

  return NextResponse.json(result);
}
