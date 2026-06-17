import { NextRequest, NextResponse } from 'next/server';
import { hasActiveManEdit, loadManEditReportContext, rebuildManEditProfile } from '@/lib/manEdit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const context = await loadManEditReportContext(shareToken, false);

  if (!context) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (hasActiveManEdit(context)) {
    await rebuildManEditProfile(context).catch(() => null);
  }

  return NextResponse.json({
    active: hasActiveManEdit(context),
    subscription: context.subscription ? {
      status: context.subscription.status,
      plan_type: context.subscription.plan_type,
      next_billing_at: context.subscription.next_billing_at,
    } : null,
    feedback: context.feedback,
    recommendations: context.recommendations,
  }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}
