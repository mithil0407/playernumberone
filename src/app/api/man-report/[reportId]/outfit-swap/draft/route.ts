import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  extractOutfitBlock,
  hashOutfitBlock,
  parseManOutfitBlock,
} from '@/lib/manOutfitSection';
import {
  generateOutfitSwapDraft,
  imageFileToGeminiInlineData,
} from '@/lib/manOutfitSwap';

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
  const outfitNumber = Number(formData.get('outfitNumber'));
  const reason = String(formData.get('reason') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const inspirationText = String(formData.get('inspirationText') ?? '').trim();
  const inspirationFile = formData.get('inspirationImage');

  if (!Number.isInteger(outfitNumber) || outfitNumber < 1 || outfitNumber > 16) {
    return NextResponse.json({ error: 'Valid outfitNumber is required' }, { status: 400 });
  }
  if (!reason && !notes && !inspirationText && !(inspirationFile instanceof File && inspirationFile.size > 0)) {
    return NextResponse.json({ error: 'Add a reason, note, text inspiration, or inspiration image first' }, { status: 400 });
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
  const currentSection4 = reportData.sections?.s4_outfits ?? '';
  const currentBlock = extractOutfitBlock(currentSection4, outfitNumber);
  if (!currentBlock) {
    return NextResponse.json({ error: `Could not locate Outfit ${outfitNumber}` }, { status: 400 });
  }

  try {
    const inspirationImage = inspirationFile instanceof File
      ? await imageFileToGeminiInlineData(inspirationFile)
      : null;

    const draft = await generateOutfitSwapDraft({
      classification: reportData.classification,
      currentSection4,
      outfitNumber,
      reason,
      notes,
      inspirationText,
      inspirationImage,
    });

    const parsedPreview = parseManOutfitBlock(draft.candidateBlock);

    return NextResponse.json({
      candidateBlock: draft.candidateBlock,
      parsedPreview,
      qaIssues: draft.qaIssues,
      blockingIssues: draft.qaIssues.filter(issue => issue.severity === 'error'),
      baseUpdatedAt: report.updated_at,
      currentOutfitHash: hashOutfitBlock(currentBlock),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
