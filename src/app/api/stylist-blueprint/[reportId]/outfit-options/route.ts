import { NextRequest, NextResponse } from 'next/server';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateStylistBlueprintCache } from '@/lib/stylistBlueprintCache';
import { getStylistBlueprintOutfitStartPage, isVersionedStylistBlueprintReportData, validateStylistBlueprintReport, type StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import { scienceOutfitsToBlueprintPages } from '@/lib/stylistOutfitScience';

async function load(reportId: string) {
  const { data, error } = await supabaseAdmin.from('stylist_blueprint_reports')
    .select('id, report_data, image_urls, revision, updated_at, status, progress_stage, section_approvals, share_token').eq('id', reportId).maybeSingle();
  if (error || !data || !isVersionedStylistBlueprintReportData(data.report_data)) return null;
  return { ...data, report_data: data.report_data as StylistBlueprintReportData };
}
function alternatives(report: StylistBlueprintReportData, pageNumber: number) {
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
  return NextResponse.json({ options: alternatives(report.report_data, pageNumber).map(item => ({ id: item.id,
    pieces: item.formula_items.map(piece => piece.piece), capsule: item.capsule })) }, { headers: { 'Cache-Control': 'private, no-store' } });
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
  const candidate = alternatives(report.report_data, body.pageNumber).find(item => item.id === body.candidateId);
  if (!candidate) return NextResponse.json({ error: 'This alternative is no longer available. Refresh the choices.' }, { status: 409 });
  const engine = report.report_data.outfit_engine!;
  const index = body.pageNumber - getStylistBlueprintOutfitStartPage(report.report_data);
  const ids = engine.selected_candidate_ids.map((id, i) => i === index ? candidate.id : id);
  const selected = ids.map(id => engine.scored_candidates.find(item => item.id === id)!);
  if (selected.some(item => !item)) return NextResponse.json({ error: 'Edit the outfit manually; its original selection is unavailable.' }, { status: 400 });
  const page = scienceOutfitsToBlueprintPages(selected, report.report_data).find(item => item.page_number === body.pageNumber);
  if (!page) return NextResponse.json({ error: 'Could not prepare this outfit.' }, { status: 400 });
  const reportData = { ...report.report_data, pages: report.report_data.pages.map(item => item.page_number === page.page_number ? page : item),
    outfit_engine: { ...engine, selected_candidate_ids: ids } };
  try { validateStylistBlueprintReport(reportData, { validateStaticPageDensity: false }); }
  catch { return NextResponse.json({ error: 'This alternative does not pass the report checks. Choose another look.' }, { status: 400 }); }
  const images = report.image_urls ?? {};
  const { data, error } = await supabaseAdmin.from('stylist_blueprint_reports').update({ report_data: reportData,
    image_urls: { ...images, application: { ...images.application, outfitFlatlays: ids.map((_, i) => i === index ? null : images.application?.outfitFlatlays?.[i] ?? null),
      outfitDetails: ids.map((_, i) => i === index ? null : images.application?.outfitDetails?.[i] ?? null) } },
    section_approvals: { ...report.section_approvals, [`p${page.page_number}`]: false }, revision: report.revision + 1,
    published_at: null, delivered_at: null, status: 'in_review', updated_at: new Date().toISOString(),
  }).eq('id', reportId).eq('updated_at', report.updated_at).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not save this outfit. Please retry.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'The report changed. Reload and choose again.' }, { status: 409 });
  await revalidateStylistBlueprintCache(reportId, report.share_token);
  return NextResponse.json({ success: true });
}
