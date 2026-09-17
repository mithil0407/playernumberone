import { NextRequest, NextResponse, after } from 'next/server';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity } from '@/lib/stylistWorkspaceAuth';
import { resumeStylistReportGeneration, runClaimedStylistWorkspaceJobs } from '@/lib/stylistWorkspaceJobs';

export const maxDuration = 300;

/** The one "Continue generating" action for admins and stylists. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const identity = await getStylistWorkspaceIdentity();
  const result = await resumeStylistReportGeneration(reportId, { stylistId: identity?.stylistId ?? null });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  if (result.state === 'started') {
    after(async () => {
      try { await runClaimedStylistWorkspaceJobs(1); } catch (error) { console.error('[stylist-blueprint] resume dispatch failed', error); }
    });
  }
  return NextResponse.json(result);
}
