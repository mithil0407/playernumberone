import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import type { ReportData } from '@/lib/manReportGenerator';
import { withManReportSection4Qa } from '@/lib/manReportQa';
import { revalidateManReportCache } from '@/lib/manReportCache';

// Replace the outfit block for `outfitNumber` in the full s4_outfits string.
// Handles both old bold format "**Outfit N —" and new plain uppercase "OUTFIT N —".
function replaceOutfitBlock(s4Text: string, outfitNumber: number, newBlock: string): string | null {
  const headerPattern = /(?:\*\*Outfit|OUTFIT)\s+(\d+)\s*[—–-][^\n]*/gi;
  const matches = Array.from(s4Text.matchAll(headerPattern));
  const matchIndex = matches.findIndex(match => Number(match[1]) === outfitNumber);
  if (matchIndex === -1) return null;

  const start = matches[matchIndex].index ?? 0;
  const end = matches[matchIndex + 1]?.index ?? s4Text.length;
  return `${s4Text.slice(0, start)}${newBlock.trimEnd()}\n\n${s4Text.slice(end)}`;
}

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
  const currentS4 = reportData.sections?.s4_outfits ?? '';
  const newS4 = replaceOutfitBlock(currentS4, outfitNumber, outfitText);

  if (!newS4) {
    return NextResponse.json(
      { error: `Could not find Outfit ${outfitNumber} in Section 4 text` },
      { status: 400 },
    );
  }

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
    qa: nextReportData.qa,
  });
}
