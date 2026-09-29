import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport, getStylistWorkspaceIdentity, isAdminCookieAuthenticated, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import {
  MAX_REVISION_REQUEST_CHARS,
  assertRevisionScope,
  mergeRevisionScope,
  parseRevisionRequest,
  revisionDueAt,
  revisionFromRow,
  revisionRequestForLooks,
  scopeWithRevisedLooks,
  type RevisionScopeItem,
} from '@/lib/stylistReportRevisions';
import { addRevisedOutfits, latestRevisionOf, revisedOutfitSlotIndex, revisionRoundFor } from '@/lib/stylistRevisedOutfits';
import {
  getStylistBlueprintOutfitCount,
  getStylistBlueprintOutfitStartPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import type { StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';

const REVISION_COLUMNS = 'id, report_id, consultation_id, stylist_id, requested_by, request_text, scope, status, published_version, due_at, published_at, cancelled_at, created_at, updated_at';

async function authorize(reportId: string) {
  const identity = await getStylistWorkspaceIdentity();
  if ((!identity && !(await isAdminCookieAuthenticated())) || !(await canAccessBlueprintReport(reportId))) return null;
  return { identity };
}

/** The revisions table arrives with a hand-run migration; until then there are simply none. */
function isMissingTable(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '')));
}

/**
 * Every revision recorded against this report, newest first, plus the report's
 * looks so the stylist can choose which ones to revise without opening it.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await authorize(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [revisionsResult, reportResult] = await Promise.all([
    supabaseAdmin
      .from('stylist_report_revisions')
      .select(REVISION_COLUMNS)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin.from('stylist_blueprint_reports').select('report_data').eq('id', reportId).maybeSingle(),
  ]);
  if (revisionsResult.error && !isMissingTable(revisionsResult.error)) {
    return NextResponse.json({ error: 'Could not load revision requests' }, { status: 500 });
  }
  const data = reportResult.data?.report_data;
  const looks = isVersionedStylistBlueprintReportData(data)
    ? Array.from({ length: getStylistBlueprintOutfitCount(data) }, (_, index) => {
      const page = data.pages.find(item => item.page_number === getStylistBlueprintOutfitStartPage(data) + index);
      const revised = latestRevisionOf(data, index + 1);
      return { number: index + 1, title: page?.title ?? '', occasion: page?.subtitle ?? '', revisedInRound: revised?.round ?? null };
    })
    : [];
  return NextResponse.json({
    revisions: (revisionsResult.data ?? []).map(revisionFromRow),
    looks,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * Starts (or adds to) a revision. The stylist may paste what the client wrote,
 * choose the looks to redo, or both. Each chosen look gets a blank revised
 * page in the report — same design as the outfits — for her to fill in; the
 * client keeps reading the published copy until she publishes the update.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const auth = await authorize(reportId);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { requestText?: string; scope?: unknown; requestedBy?: string; looks?: unknown };
  const looks = Array.isArray(body.looks) ? body.looks.map(Number) : [];
  if (looks.some(look => !Number.isInteger(look))) return NextResponse.json({ error: 'Choose looks by number.' }, { status: 400 });
  const pasted = typeof body.requestText === 'string' ? body.requestText.trim().slice(0, MAX_REVISION_REQUEST_CHARS) : '';
  if (!pasted && !looks.length) return NextResponse.json({ error: 'Paste what the client asked for, or choose the looks to revise.' }, { status: 400 });
  const requestText = pasted || revisionRequestForLooks(looks);
  const requestedBy = ['client', 'stylist', 'admin'].includes(body.requestedBy ?? '') ? body.requestedBy! : 'client';

  let scope: RevisionScopeItem[];
  try {
    scope = body.scope === undefined ? (pasted ? parseRevisionRequest(pasted) : []) : assertRevisionScope(body.scope);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid revision checklist' }, { status: 400 });
  }

  const { data: report, error: reportError } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    // '*' rather than a column list: published_version arrives with a hand-run
    // migration, and naming it would fail the whole query without it.
    .select('*, stylist_intake_responses(id, consultation_id, assigned_stylist_id)')
    .eq('id', reportId)
    .single();
  if (reportError || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  // Before the first delivery there is nothing to revise: the draft is still
  // the stylist's own work in progress.
  if (!report.published_at) {
    return NextResponse.json({ error: 'This report has not been delivered yet, so there is nothing to revise.' }, { status: 400 });
  }
  const intake = Array.isArray(report.stylist_intake_responses) ? report.stylist_intake_responses[0] : report.stylist_intake_responses;
  const stylistId = auth.identity?.stylistId ?? intake?.assigned_stylist_id ?? report.created_by_stylist_id ?? null;

  // The revised pages first: they are the work. The brief is the record of it,
  // and a workspace that has not run the revisions migration still gets pages.
  let added: Array<{ replaces: number; page_number: number }> = [];
  if (looks.length) {
    if (!isVersionedStylistBlueprintReportData(report.report_data)) {
      return NextResponse.json({ error: 'This report is too old to add revised looks to.' }, { status: 400 });
    }
    if (report.status === 'generating' || report.progress_stage) {
      return NextResponse.json({ error: 'Wait for the report to finish what it is doing, then try again.' }, { status: 409 });
    }
    let next;
    try {
      next = addRevisedOutfits(report.report_data as StylistBlueprintReportData, {
        looks,
        round: revisionRoundFor(report.published_version as number | null),
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not add those looks' }, { status: 400 });
    }
    added = next.added.map(entry => ({ replaces: entry.replaces, page_number: entry.page.page_number }));
    if (added.length) {
      // A page number can be reused after a revised look was removed; its old
      // image must not appear on the new, blank look.
      const images = (report.image_urls ?? {}) as StylistBlueprintImagePaths;
      const flatlays = [...(images.revision?.outfitFlatlays ?? [])];
      for (const entry of added) flatlays[revisedOutfitSlotIndex(entry.page_number)] = null;
      const approvals = { ...(report.section_approvals as Record<string, boolean> | null ?? {}) };
      for (const entry of added) approvals[`p${entry.page_number}`] = false;
      const { data: saved, error: saveError } = await supabaseAdmin
        .from('stylist_blueprint_reports')
        .update({
          report_data: next.data,
          image_urls: { ...images, revision: { ...images.revision, outfitFlatlays: flatlays } },
          section_approvals: approvals,
          status: 'in_review',
          revision: Number(report.revision ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('updated_at', report.updated_at)
        .select('id')
        .maybeSingle();
      if (saveError) return NextResponse.json({ error: 'Could not add the revised looks' }, { status: 500 });
      if (!saved) return NextResponse.json({ error: 'The report changed while adding looks. Try again.' }, { status: 409 });
      await revalidateStylistBlueprintCache(reportId, report.share_token);
    }
    // Every chosen look now has a revised page, new or already there from this
    // round; the checklist points at each of them.
    scope = scopeWithRevisedLooks(scope, [...new Set(looks)].flatMap(look => {
      const entry = latestRevisionOf(next.data, look);
      return entry ? [{ replaces: look, page_number: entry.page.page_number }] : [];
    }));
  }
  if (!scope.length) scope = parseRevisionRequest(requestText);

  const revision = await recordRevision({ reportId, consultationId: intake?.consultation_id ?? null, stylistId, requestedBy, requestText, pasted, scope });
  if ('error' in revision) return NextResponse.json({ error: revision.error }, { status: 500 });

  await logStylistReportActivity({
    action: 'revision_requested',
    reportId,
    consultationId: intake?.consultation_id ?? null,
    stylistId: auth.identity?.stylistId ?? null,
    metadata: { requestedBy, changes: scope.length, revisedLooks: added.map(entry => entry.replaces) },
  });
  clearWorkspaceQueueCache(stylistId);
  return NextResponse.json({
    revision: revision.row,
    addedLooks: added,
    firstPage: added[0]?.page_number ?? scope.find(item => item.page_number)?.page_number ?? null,
  }, { status: 201 });
}

/**
 * One open brief per report: a second ask while one is open joins it rather
 * than competing with it.
 */
async function recordRevision(input: {
  reportId: string; consultationId: string | null; stylistId: string | null; requestedBy: string;
  requestText: string; pasted: string; scope: RevisionScopeItem[]; retried?: boolean;
}): Promise<{ row: ReturnType<typeof revisionFromRow> | null } | { error: string }> {
  const { data: open, error: openError } = await supabaseAdmin
    .from('stylist_report_revisions')
    .select(REVISION_COLUMNS)
    .eq('report_id', input.reportId)
    .eq('status', 'open')
    .maybeSingle();
  if (isMissingTable(openError)) return { row: null };
  if (openError) return { error: 'Could not record the revision request' };

  if (open) {
    const current = revisionFromRow(open);
    const requestText = input.pasted && !current.request_text.includes(input.pasted)
      ? `${current.request_text}\n\n${input.pasted}`.slice(0, MAX_REVISION_REQUEST_CHARS)
      : current.request_text;
    const { data, error } = await supabaseAdmin
      .from('stylist_report_revisions')
      .update({ request_text: requestText, scope: mergeRevisionScope(current.scope, input.scope), updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .eq('status', 'open')
      .select(REVISION_COLUMNS)
      .maybeSingle();
    if (error || !data) return { error: 'Could not add to the open revision request' };
    return { row: revisionFromRow(data) };
  }

  const { data, error } = await supabaseAdmin
    .from('stylist_report_revisions')
    .insert({
      report_id: input.reportId,
      consultation_id: input.consultationId,
      stylist_id: input.stylistId,
      requested_by: input.requestedBy,
      request_text: input.requestText,
      scope: input.scope,
      due_at: revisionDueAt(),
    })
    .select(REVISION_COLUMNS)
    .single();
  // Another tab opened one between the read and the insert: join it instead.
  if (error?.code === '23505' && !input.retried) return recordRevision({ ...input, retried: true });
  if (error) {
    console.error('[stylist-workspace] revision insert failed', error);
    return { error: 'Could not record the revision request' };
  }
  return { row: revisionFromRow(data) };
}
