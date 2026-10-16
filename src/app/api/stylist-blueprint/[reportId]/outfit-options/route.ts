import { NextRequest, NextResponse } from 'next/server';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { withCurrentConsultationAnswers } from '@/lib/stylistConsultationWorkspace';

// Choosing a look writes fresh copy with Gemini.
export const maxDuration = 60;
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { callStylistOutfitJSON, getStylistBlueprintOutfitStartPage, isVersionedStylistBlueprintReportData, validateStylistBlueprintReport, type StylistBlueprintReportData, type StylistIntakeSubmission } from '@/lib/stylistBlueprintGenerator';
import { isScienceBlueprintReport, scienceOutfitsToBlueprintPages, type OutfitScienceEngineMetadata } from '@/lib/stylistOutfitScience';
import { isPinterestVerbatimReport, verbatimAlternativesForPage, verbatimFormulaItems, verbatimReplacementPage } from '@/lib/stylistPinterestOutfits';

async function load(reportId: string) {
  const { data, error } = await supabaseAdmin.from('stylist_blueprint_reports')
    .select('id, submission_id, report_data, image_urls, revision, updated_at, status, progress_stage, section_approvals, share_token').eq('id', reportId).maybeSingle();
  if (error || !data || !isVersionedStylistBlueprintReportData(data.report_data)) return null;
  return { ...data, report_data: data.report_data as StylistBlueprintReportData };
}
async function loadSubmission(submissionId: string) {
  const { data } = await supabaseAdmin.from('stylist_intake_responses').select('*').eq('id', submissionId).maybeSingle();
  return data ? withCurrentConsultationAnswers(data as StylistIntakeSubmission & { consultation_id?: string | null }) : null;
}
function scienceAlternatives(report: StylistBlueprintReportData & { outfit_engine: OutfitScienceEngineMetadata }, pageNumber: number) {
  const index = pageNumber - getStylistBlueprintOutfitStartPage(report);
  const engine = report.outfit_engine;
  const current = engine?.scored_candidates.find(item => item.id === engine.selected_candidate_ids[index]);
  if (!engine || !current) return [];
  const used = engine.scored_candidates.filter(item => engine.selected_candidate_ids.includes(item.id));
  const signatures = new Set(used.map(item => item.library_signature).filter(Boolean));
  const seen = new Set<string>();
  return engine.scored_candidates.filter(item => !item.score.killed && item.capsule === current.capsule
    && Boolean(item.is_ethnic) === Boolean(current.is_ethnic)
    && !engine.selected_candidate_ids.includes(item.id) && (!item.library_signature || !signatures.has(item.library_signature)))
    .sort((a, b) => (b.score.iconik + b.score.relevance + b.score.realism) - (a.score.iconik + a.score.relevance + a.score.realism))
    .filter(item => { const key = item.library_signature || item.id; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 8);
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const report = await load(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const pageNumber = Number(request.nextUrl.searchParams.get('page'));
  const headers = { 'Cache-Control': 'private, no-store' };
  // Pinterest reports offer the next best real looks that pass her rules.
  if (isPinterestVerbatimReport(report.report_data)) {
    const submission = await loadSubmission(report.submission_id);
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    const options = verbatimAlternativesForPage(submission, report.report_data, pageNumber).map(({ evaluated, capsule }) => ({
      id: evaluated.look.id,
      pieces: verbatimFormulaItems(evaluated).map(item => item.piece),
      capsule,
      changes: evaluated.swaps,
    }));
    return NextResponse.json({ options }, { headers });
  }
  if (!isScienceBlueprintReport(report.report_data)) return NextResponse.json({ options: [] }, { headers });
  return NextResponse.json({ options: scienceAlternatives(report.report_data, pageNumber).map(item => ({ id: item.id,
    pieces: item.formula_items.map(piece => piece.piece), capsule: item.capsule })) }, { headers });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const report = await load(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (report.status === 'generating' || report.progress_stage) return NextResponse.json({ error: 'Wait for the report to finish generating.' }, { status: 409 });
  if (!Number.isInteger(body?.pageNumber)) return NextResponse.json({ error: 'Choose an outfit page.' }, { status: 400 });
  if (body.expectedUpdatedAt !== report.updated_at) return NextResponse.json({ error: 'The report changed. Reload before choosing another look.' }, { status: 409 });
  const index = body.pageNumber - getStylistBlueprintOutfitStartPage(report.report_data);
  let reportData: StylistBlueprintReportData;
  if (isPinterestVerbatimReport(report.report_data)) {
    const submission = await loadSubmission(report.submission_id);
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    let replacement;
    try {
      replacement = await verbatimReplacementPage(submission, report.report_data, body.pageNumber, callStylistOutfitJSON, String(body.candidateId ?? ''));
    } catch {
      return NextResponse.json({ error: 'This alternative is no longer available. Refresh the choices.' }, { status: 409 });
    }
    reportData = { ...report.report_data, outfit_engine: replacement.outfit_engine,
      pages: report.report_data.pages.map(item => item.page_number === body.pageNumber ? replacement.page : item) };
  } else {
    if (!isScienceBlueprintReport(report.report_data)) return NextResponse.json({ error: 'This report has no alternative looks.' }, { status: 400 });
    const scienceReport = report.report_data;
    const candidate = scienceAlternatives(scienceReport, body.pageNumber).find(item => item.id === body.candidateId);
    if (!candidate) return NextResponse.json({ error: 'This alternative is no longer available. Refresh the choices.' }, { status: 409 });
    const engine = scienceReport.outfit_engine;
    const ids = engine.selected_candidate_ids.map((id, i) => i === index ? candidate.id : id);
    const selected = ids.map(id => engine.scored_candidates.find(item => item.id === id)!);
    if (selected.some(item => !item)) return NextResponse.json({ error: 'Edit the outfit manually; its original selection is unavailable.' }, { status: 400 });
    const page = scienceOutfitsToBlueprintPages(selected, scienceReport).find(item => item.page_number === body.pageNumber);
    if (!page) return NextResponse.json({ error: 'Could not prepare this outfit.' }, { status: 400 });
    reportData = { ...scienceReport, pages: scienceReport.pages.map(item => item.page_number === page.page_number ? page : item),
      outfit_engine: { ...engine, selected_candidate_ids: ids } };
  }
  try { validateStylistBlueprintReport(reportData, { validateStaticPageDensity: false }); }
  catch { return NextResponse.json({ error: 'This alternative does not pass the report checks. Choose another look.' }, { status: 400 }); }
  const images = report.image_urls ?? {};
  const outfitCount = Array.isArray(images.application?.outfitFlatlays) ? images.application.outfitFlatlays.length : 20;
  const slots = Array.from({ length: outfitCount }, (_, i) => i);
  const { data, error } = await supabaseAdmin.from('stylist_blueprint_reports').update({ report_data: reportData,
    image_urls: { ...images, application: { ...images.application, outfitFlatlays: slots.map(i => i === index ? null : images.application?.outfitFlatlays?.[i] ?? null),
      outfitDetails: slots.map(i => i === index ? null : images.application?.outfitDetails?.[i] ?? null) } },
    section_approvals: { ...report.section_approvals, [`p${body.pageNumber}`]: false }, revision: report.revision + 1,
    status: 'in_review', updated_at: new Date().toISOString(),
  }).eq('id', reportId).eq('updated_at', report.updated_at).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save this outfit. Please retry.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'The report changed. Reload and choose again.' }, { status: 409 });
  await revalidateStylistBlueprintCache(reportId, report.share_token);
  return NextResponse.json({ success: true });
}
