import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import {
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  isVersionedStylistBlueprintReportData,
  parseStylistBlueprintOutfitText,
  validateStylistBlueprintReport,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';
import {
  buildStylistBlueprintManualImagePrompt,
  type StylistBlueprintImageSlotKey,
} from '@/lib/stylistBlueprintImageGenerator';

export const maxDuration = 60;

/** Long enough for a fully written outfit, short enough to stay a fast call. */
const MAX_OUTFIT_TEXT = 4000;

/**
 * The report validator writes for a developer reading a stack trace. The
 * stylist reading this is mid-edit and needs to know which piece to add.
 */
function readableValidationError(error: unknown, pageNumber: number) {
  const message = error instanceof Error ? error.message : '';
  const prefix = `Outfit page ${pageNumber} `;
  if (!message.startsWith(prefix)) return 'That outfit is missing something the report needs. Check the pieces and try again.';
  return `This outfit ${message.slice(prefix.length)}. Add it to the text and try again.`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pageNumber = Number(body.pageNumber);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'Paste the outfit first.' }, { status: 400 });
  if (text.length > MAX_OUTFIT_TEXT) {
    return NextResponse.json({ error: 'That outfit is too long. Keep it under 4000 characters.' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, status, progress_stage')
    .eq('id', reportId)
    .single();
  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (report.status === 'generating' || report.progress_stage) {
    return NextResponse.json({ error: 'Wait for the report to finish generating.' }, { status: 409 });
  }
  if (!isVersionedStylistBlueprintReportData(report.report_data)) {
    return NextResponse.json({ error: 'A v1 Blueprint report is required to edit outfits' }, { status: 400 });
  }

  const reportData = report.report_data as StylistBlueprintReportData;
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  if (!Number.isInteger(pageNumber) || pageNumber < outfitStart || pageNumber > getStylistBlueprintOutfitEndPage(reportData)) {
    return NextResponse.json({ error: 'Open an outfit page first.' }, { status: 400 });
  }

  try {
    const page = await parseStylistBlueprintOutfitText(reportData, pageNumber, text);
    const nextData: StylistBlueprintReportData = {
      ...reportData,
      pages: reportData.pages.map(item => item.page_number === pageNumber ? page : item),
    };

    // The same validator guards every save. Catching it here means a thin
    // outfit comes back as a fixable message instead of a page that looks
    // applied and then blocks the stylist's next save.
    try {
      validateStylistBlueprintReport(nextData);
    } catch (invalid) {
      return NextResponse.json({ error: readableValidationError(invalid, pageNumber) }, { status: 422 });
    }

    // Built from the parsed page rather than from storage, so the prompt on
    // screen is the outfit she is looking at — no save round trip in between.
    const slotKey = `application.outfitFlatlays.${pageNumber - outfitStart}` as StylistBlueprintImageSlotKey;
    let prompt: string | null = null;
    try {
      prompt = buildStylistBlueprintManualImagePrompt(slotKey, nextData).prompt;
    } catch {
      prompt = null;
    }

    return NextResponse.json({ page, prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read that outfit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
