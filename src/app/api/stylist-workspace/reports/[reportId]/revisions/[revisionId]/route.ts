import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity, isAdminCookieAuthenticated, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { MAX_REVISION_REQUEST_CHARS, assertRevisionScope, revisionFromRow } from '@/lib/stylistReportRevisions';

const REVISION_COLUMNS = 'id, report_id, consultation_id, stylist_id, requested_by, request_text, scope, status, published_version, due_at, published_at, cancelled_at, created_at, updated_at';

/**
 * Working through the brief: ticking a change off, correcting the checklist, or
 * closing a request the client withdrew. Publishing the update is what marks a
 * revision delivered, so this never sets that.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; revisionId: string }> },
) {
  const { reportId, revisionId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if ((!identity && !(await isAdminCookieAuthenticated())) || !(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { scope?: unknown; requestText?: string; status?: string };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  try {
    if (body.scope !== undefined) patch.scope = assertRevisionScope(body.scope);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid revision checklist' }, { status: 400 });
  }
  // A client who sends a second message adds to the same brief.
  if (typeof body.requestText === 'string') {
    const text = body.requestText.trim().slice(0, MAX_REVISION_REQUEST_CHARS);
    if (!text) return NextResponse.json({ error: 'The client’s request cannot be empty.' }, { status: 400 });
    patch.request_text = text;
  }
  if (body.status !== undefined) {
    if (body.status !== 'cancelled') return NextResponse.json({ error: 'A revision closes when you publish the update.' }, { status: 400 });
    patch.status = 'cancelled';
    patch.cancelled_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 1) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('stylist_report_revisions')
    .update(patch)
    .eq('id', revisionId)
    // Scoped to this report, and only while the request is still open.
    .eq('report_id', reportId)
    .eq('status', 'open')
    .select(REVISION_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update the revision request' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'This revision request is no longer open.' }, { status: 409 });

  if (patch.status === 'cancelled') {
    await logStylistReportActivity({
      action: 'revision_cancelled', reportId, consultationId: data.consultation_id, stylistId: identity?.stylistId ?? null,
    });
  }
  clearWorkspaceQueueCache(data.stylist_id);
  return NextResponse.json({ revision: revisionFromRow(data) });
}
