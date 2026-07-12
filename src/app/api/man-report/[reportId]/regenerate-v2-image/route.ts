import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  mergeManReportImagePathsForReport,
  regenerateManBlueprintV2Image,
  resolveManReportImageUrls,
  type ManReportImagePaths,
  type ManV2ImageTarget,
} from '@/lib/manImageGenerator';
import type { ReportData } from '@/lib/manReportGenerator';
import { revalidateManReportCache } from '@/lib/manReportCache';

const TARGETS: ManV2ImageTarget[] = ['faceGeometry', 'frameFront', 'colourDrape', 'beforeAfter', 'linkedinHeadshot', 'social1', 'social2', 'social3'];
const MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];

export const maxDuration = 180;

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const target = body?.target as ManV2ImageTarget;
  const imageModel = MODELS.includes(body?.imageModel) ? body.imageModel : MODELS[0];
  if (!TARGETS.includes(target)) {
    return NextResponse.json({ error: 'Invalid V2 image target' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls, submission_id, share_token')
    .eq('id', reportId)
    .single();
  if (error || !report?.report_data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_headshot_url, photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();
  if (submissionError || !submission) return NextResponse.json({ error: 'Submission photos not found' }, { status: 400 });

  try {
    const reportData = report.report_data as ReportData;
    const patch = await regenerateManBlueprintV2Image(
      reportId,
      submission,
      reportData.classification,
      reportData.sections,
      target,
      imageModel,
    );
    const paths = await mergeManReportImagePathsForReport(reportId, patch as Partial<ManReportImagePaths>);
    await revalidateManReportCache(reportId, report.share_token ?? null);
    return NextResponse.json({ target, imageUrls: await resolveManReportImageUrls(paths) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image regeneration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
