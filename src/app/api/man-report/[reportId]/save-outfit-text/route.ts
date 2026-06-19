import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import type { ReportData } from '@/lib/manReportGenerator';
import { withManReportSection4Qa } from '@/lib/manReportQa';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { normaliseSequentialManOutfitNumbers, replaceOutfitBlock } from '@/lib/manOutfitSection';
import { enrichManOutfitEdit } from '@/lib/manOutfitEdit';

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
  const body = await request.json();
  const { outfitNumber, outfitText } = body as {
    outfitNumber: number;
    outfitText: string;
  };

  if (!outfitNumber || !outfitText) {
    return NextResponse.json(
      { error: 'outfitNumber and outfitText are required' },
      { status: 400 },
    );
  }

  if (!new RegExp(`(?:\\*\\*Outfit|OUTFIT)\\s+${outfitNumber}\\s*[—–-]`, 'i').test(outfitText)) {
    return NextResponse.json(
      { error: `Edited text must include the Outfit ${outfitNumber} header so the report can be parsed` },
      { status: 400 },
    );
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData;
  if (!reportData.classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  const currentS4 = normaliseSequentialManOutfitNumbers(reportData.sections?.s4_outfits ?? '');
  let enrichedOutfitText: string;
  try {
    enrichedOutfitText = await enrichManOutfitEdit({
      classification: reportData.classification,
      currentSection4: currentS4,
      outfitNumber,
      editedBlock: outfitText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const replacedS4 = replaceOutfitBlock(currentS4, outfitNumber, enrichedOutfitText);

  if (!replacedS4) {
    return NextResponse.json(
      { error: `Could not find Outfit ${outfitNumber} in Section 4 text` },
      { status: 400 },
    );
  }
  const newS4 = normaliseSequentialManOutfitNumbers(replacedS4);

  // Re-run QA on the updated text so the admin panel reflects any issues immediately.
  const nextReportData = withManReportSection4Qa({
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_outfits: newS4,
    },
  });

  // Persist text + QA — image_urls is deliberately NOT touched so the existing image remains.
  const { error: saveErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  return NextResponse.json({
    updatedS4Outfits: newS4,
    enrichedOutfitText,
    qa: nextReportData.qa,
  });
}
