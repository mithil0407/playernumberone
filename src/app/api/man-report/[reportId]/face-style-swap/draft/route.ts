import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ReportData } from '@/lib/manReportGenerator';
import type { FaceImageKind } from '@/lib/manImageGenerator';
import {
  generateFaceStyleSwapDraft,
  getFaceStyleOption,
  hashFaceStyleText,
  imageFileToFaceStyleInlineData,
} from '@/lib/manFaceStyleSwap';

const VALID_FACE_IMAGE_KINDS: FaceImageKind[] = ['hairstyle', 'beard', 'eyewear'];

export const maxDuration = 120;

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
  const formData = await request.formData();
  const kind = String(formData.get('kind') ?? '') as FaceImageKind;
  const optionIndex = Number(formData.get('optionIndex'));
  const reason = String(formData.get('reason') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const replacementText = String(formData.get('replacementText') ?? '').trim();
  const inspirationFile = formData.get('inspirationImage');

  if (!VALID_FACE_IMAGE_KINDS.includes(kind) || ![1, 2].includes(optionIndex)) {
    return NextResponse.json({ error: 'kind must be hairstyle|beard|eyewear and optionIndex must be 1 or 2' }, { status: 400 });
  }
  if (!reason && !notes && !replacementText && !(inspirationFile instanceof File && inspirationFile.size > 0)) {
    return NextResponse.json({ error: 'Add a reason, replacement text, note, or inspiration image first' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, updated_at')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData;
  const currentStyle = getFaceStyleOption(reportData.classification, kind, optionIndex);
  if (!currentStyle) {
    return NextResponse.json({ error: `No ${kind} recommendation found for option ${optionIndex}` }, { status: 400 });
  }

  try {
    const inspirationImage = inspirationFile instanceof File
      ? await imageFileToFaceStyleInlineData(inspirationFile)
      : null;

    const draft = await generateFaceStyleSwapDraft({
      classification: reportData.classification,
      kind,
      optionIndex,
      reason,
      notes,
      replacementText,
      inspirationImage,
    });

    return NextResponse.json({
      candidateStyle: draft.candidateStyle,
      currentStyle,
      baseUpdatedAt: report.updated_at,
      currentStyleHash: hashFaceStyleText(currentStyle),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
