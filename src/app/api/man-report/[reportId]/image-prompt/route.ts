import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  buildComboGridImagePromptForReport,
  buildFaceGridPrompt,
  buildOutfitImagePromptForReport,
  type FaceImageKind,
} from '@/lib/manImageGenerator';
import { supabaseAdmin } from '@/lib/supabase';
import type { ComboGridKind } from '@/lib/manComboGridSection';

const FACE_KINDS = new Set<FaceImageKind>(['hairstyle', 'beard', 'eyewear']);
const COMBO_GRID_KINDS = new Set<ComboGridKind>(['office', 'evening', 'relaxed']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const imageType = body?.imageType as string | undefined;

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData;
  const classification = reportData.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  try {
    if (imageType === 'face') {
      const faceKind = body?.faceKind as FaceImageKind | undefined;
      if (!faceKind || !FACE_KINDS.has(faceKind)) {
        return NextResponse.json({ error: 'faceKind must be hairstyle, beard, or eyewear' }, { status: 400 });
      }
      return NextResponse.json({ prompt: buildFaceGridPrompt(classification, faceKind) });
    }

    if (imageType === 'outfit') {
      const outfitNumber = Number(body?.outfitNumber);
      if (!Number.isInteger(outfitNumber) || outfitNumber < 1) {
        return NextResponse.json({ error: 'outfitNumber is required' }, { status: 400 });
      }
      return NextResponse.json({
        prompt: buildOutfitImagePromptForReport(reportData.sections, classification, outfitNumber),
      });
    }

    if (imageType === 'comboGrid') {
      const comboGridKind = body?.comboGridKind as ComboGridKind | undefined;
      if (!comboGridKind || !COMBO_GRID_KINDS.has(comboGridKind)) {
        return NextResponse.json({ error: 'comboGridKind must be office, evening, or relaxed' }, { status: 400 });
      }
      return NextResponse.json({
        prompt: buildComboGridImagePromptForReport(comboGridKind, reportData.sections, classification),
      });
    }

    return NextResponse.json({ error: 'imageType must be face, outfit, or comboGrid' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
