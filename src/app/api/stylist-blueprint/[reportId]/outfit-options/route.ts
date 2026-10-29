import { NextRequest, NextResponse } from 'next/server';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { withCurrentConsultationAnswers } from '@/lib/stylistConsultationWorkspace';

// Choosing a look writes fresh copy with Gemini.
export const maxDuration = 60;
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { callStylistOutfitJSON, getStylistBlueprintOutfitStartPage, getStylistBlueprintOutfitEndPage, isVersionedStylistBlueprintReportData, validateStylistBlueprintReport, type StylistBlueprintReportData, type StylistIntakeSubmission } from '@/lib/stylistBlueprintGenerator';
import { verbatimAlternativesForPage, verbatimFormulaItems, verbatimReplacementPage } from '@/lib/stylistPinterestOutfits';
import { primeOutfitLibraryCuration } from '@/lib/stylistOutfitLibraryCuration';

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
function isOutfitPage(report: StylistBlueprintReportData, pageNumber: number) {
  return Number.isInteger(pageNumber) && pageNumber >= getStylistBlueprintOutfitStartPage(report)
    && pageNumber <= getStylistBlueprintOutfitEndPage(report);
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const report = await load(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const pageNumber = Number(request.nextUrl.searchParams.get('page'));
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!isOutfitPage(report.report_data, pageNumber)) return NextResponse.json({ error: 'Choose an outfit page.' }, { status: 400 });
  const submission = await loadSubmission(report.submission_id);
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  try {
    await primeOutfitLibraryCuration();
    const options = verbatimAlternativesForPage(submission, report.report_data, pageNumber).map(({ evaluated, capsule }) => ({
      id: evaluated.look.id,
      pieces: verbatimFormulaItems(evaluated).map(item => item.piece),
      capsule,
      changes: evaluated.swaps,
    }));
    return NextResponse.json({ options }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load kept outfits.' }, { status: 503, headers });
  }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const report = await load(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (report.status === 'generating' || report.progress_stage) return NextResponse.json({ error: 'Wait for the report to finish generating.' }, { status: 409 });
  if (!isOutfitPage(report.report_data, body?.pageNumber)) return NextResponse.json({ error: 'Choose an outfit page.' }, { status: 400 });
  if (body.expectedUpdatedAt !== report.updated_at) return NextResponse.json({ error: 'The report changed. Reload before choosing another look.' }, { status: 409 });
  const index = body.pageNumber - getStylistBlueprintOutfitStartPage(report.report_data);
  let reportData: StylistBlueprintReportData;
  const submission = await loadSubmission(report.submission_id);
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  try {
    await primeOutfitLibraryCuration();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load kept outfits.' }, { status: 503 });
  }
  try {
    const replacement = await verbatimReplacementPage(submission, report.report_data, body.pageNumber, callStylistOutfitJSON, String(body.candidateId ?? ''));
    reportData = { ...report.report_data, outfit_engine: replacement.outfit_engine,
      pages: report.report_data.pages.map(item => item.page_number === body.pageNumber ? replacement.page : item) };
  } catch {
    return NextResponse.json({ error: 'This alternative is no longer available. Refresh the choices.' }, { status: 409 });
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
