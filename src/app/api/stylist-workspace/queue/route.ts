import { after, NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getStylistWorkspaceIdentity } from '@/lib/stylistWorkspaceAuth';
import {
  consultationReadiness,
  workspaceBucket,
  type ConsultationSourceBundle,
} from '@/lib/stylistConsultationWorkspace';
import {
  getStylistBlueprintHairColourPage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintOutfitCount,
  getStylistBlueprintTransformationPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';

type ReportRow = {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  section_approvals: Record<string, boolean> | null;
  report_data: { pages?: unknown[] } | null;
  image_urls: Record<string, unknown> | null;
  error_message: string | null;
  published_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  const identity = await getStylistWorkspaceIdentity();
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
  const bucket = request.nextUrl.searchParams.get('bucket')?.trim() ?? '';
  const dueFilter = request.nextUrl.searchParams.get('due')?.trim() ?? '';
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get('limit') || 30)));

  let consultationQuery = supabaseAdmin
    .from('consultations')
    .select('id, stylist_id, client_name, client_phone, consultation_date, images_received_at, report_due_at, delivered_at, status, client_data, notes, created_at, updated_at')
    .eq('stylist_id', identity.stylistId)
    .order('report_due_at', { ascending: true, nullsFirst: false })
    .limit(500);

  if (search) {
    const safe = search.replace(/[(),]/g, ' ');
    consultationQuery = consultationQuery.or(`client_name.ilike.%${safe}%,client_phone.ilike.%${safe}%`);
  }

  const { data: consultations, error } = await consultationQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (consultations ?? []).map(row => row.id as string);
  if (!ids.length) return NextResponse.json({ items: [], counts: {}, total: 0, page, limit });

  const [uploadResult, intakeResult] = await Promise.all([
    supabaseAdmin
      .from('consultation_upload_links')
      .select('consultation_id, submitted_at, photo_paths, measurements')
      .in('consultation_id', ids),
    supabaseAdmin
      .from('stylist_intake_responses')
      .select('id, consultation_id')
      .in('consultation_id', ids),
  ]);
  const uploadByConsultation = new Map((uploadResult.data ?? []).map(row => [row.consultation_id as string, row]));
  const intakeByConsultation = new Map((intakeResult.data ?? []).map(row => [row.consultation_id as string, row]));
  const intakeIds = (intakeResult.data ?? []).map(row => row.id as string);
  const reportResult = intakeIds.length
    ? await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, submission_id, status, progress_stage, share_token, section_approvals, report_data, image_urls, error_message, published_at, delivered_at, created_at, updated_at')
      .in('submission_id', intakeIds)
      .order('created_at', { ascending: false })
    : { data: [] as Array<ReportRow & { submission_id: string }> };

  const latestByIntake = new Map<string, ReportRow>();
  for (const row of reportResult.data ?? []) {
    if (!latestByIntake.has(row.submission_id as string)) latestByIntake.set(row.submission_id as string, row as ReportRow);
  }

  const allItems = (consultations ?? []).map(row => {
    const upload = uploadByConsultation.get(row.id as string);
    const source = {
      consultation: { ...row, client_data: row.client_data ?? {}, notes: row.notes ?? null },
      upload: upload ? {
        consultation_id: upload.consultation_id,
        submitted_at: upload.submitted_at,
        photo_paths: upload.photo_paths ?? {},
        measurements: upload.measurements ?? {},
      } : null,
    } as unknown as ConsultationSourceBundle;
    const readiness = consultationReadiness(source);
    const intake = intakeByConsultation.get(row.id as string);
    const report = intake ? latestByIntake.get(intake.id as string) ?? null : null;
    const itemBucket = workspaceBucket({
      consultationStatus: row.status as string,
      readiness,
      reportStatus: report?.status,
      reportProgress: report?.progress_stage,
    });
    const reportData = report?.report_data as StylistBlueprintReportData | null;
    const visibleReportPages = isVersionedStylistBlueprintReportData(reportData)
      ? reportData.pages.filter(page => page.page_number !== getStylistBlueprintContinuationPage(reportData))
      : [];
    const pageCount = visibleReportPages.length;
    const approvedCount = visibleReportPages.filter(page => Boolean(report?.section_approvals?.[`p${page.page_number}`])).length;
    const imageCounts = report && isVersionedStylistBlueprintReportData(reportData)
      ? getStylistBlueprintImageCounts(report.image_urls as StylistBlueprintImagePaths | null, {
        hasFrontPhoto: readiness.photos.full_body_front,
        hasSidePhoto: readiness.photos.full_body_side,
        hasHeadshot: readiness.photos.headshot,
        hasClientPhoto: Object.values(readiness.photos).some(Boolean),
        outfitCount: getStylistBlueprintOutfitCount(reportData),
        includeClosingEditTeaser: false,
        includeTransformationPreview: Boolean(getStylistBlueprintTransformationPage(reportData)),
        includeBeautyPages: Boolean(getStylistBlueprintHairColourPage(reportData)),
      })
      : null;
    const imageProgress = imageCounts
      ? Object.values(imageCounts).reduce((total, group) => ({ done: total.done + group.done, total: total.total + group.total }), { done: 0, total: 0 })
      : { done: 0, total: 0 };
    return {
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      consultationDate: row.consultation_date,
      reportDueAt: row.report_due_at,
      deliveredAt: row.delivered_at,
      consultationStatus: row.status,
      updatedAt: report?.updated_at ?? row.updated_at,
      readiness,
      bucket: itemBucket,
      report: report ? {
        id: report.id,
        status: report.status,
        progressStage: report.progress_stage,
        errorMessage: report.error_message,
        approvedCount,
        pageCount,
        imageDone: imageProgress.done,
        imageTotal: imageProgress.total,
        publishedAt: report.published_at,
        deliveredAt: report.delivered_at,
      } : null,
    };
  }).sort((a, b) => {
    const aDue = a.reportDueAt ? new Date(a.reportDueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.reportDueAt ? new Date(b.reportDueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue || new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });

  const counts = allItems.reduce<Record<string, number>>((result, item) => {
    result[item.bucket] = (result[item.bucket] ?? 0) + 1;
    const due = item.reportDueAt ? new Date(item.reportDueAt).getTime() : null;
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (due !== null && due <= todayEnd.getTime() && item.bucket !== 'delivered') result.today = (result.today ?? 0) + 1;
    return result;
  }, {});
  const waitingInputIds = allItems
    .filter(item => !item.report && !item.readiness.ready && item.consultationStatus !== 'waiting_images' && item.consultationStatus !== 'delivered')
    .map(item => item.id);
  if (waitingInputIds.length) {
    after(async () => {
      await supabaseAdmin
        .from('consultations')
        .update({ status: 'waiting_images', updated_at: new Date().toISOString() })
        .eq('stylist_id', identity.stylistId)
        .in('id', waitingInputIds);
    });
  }
  const bucketed = bucket && bucket !== 'all'
    ? allItems.filter(item => {
      if (bucket !== 'today') return item.bucket === bucket;
      if (!item.reportDueAt || item.bucket === 'delivered') return false;
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return new Date(item.reportDueAt).getTime() <= end.getTime();
    })
    : allItems;
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueFiltered = dueFilter
    ? bucketed.filter(item => {
      const due = item.reportDueAt ? new Date(item.reportDueAt).getTime() : null;
      if (dueFilter === 'none') return due === null;
      if (due === null) return false;
      if (dueFilter === 'overdue') return due < now.getTime();
      if (dueFilter === 'today') return due >= now.getTime() && due <= todayEnd.getTime();
      if (dueFilter === 'week') return due >= now.getTime() && due <= weekEnd.getTime();
      return true;
    })
    : bucketed;
  const from = (page - 1) * limit;
  return NextResponse.json({
    stylist: { name: identity.name, slug: identity.slug },
    items: dueFiltered.slice(from, from + limit),
    counts,
    total: dueFiltered.length,
    page,
    limit,
  });
}
