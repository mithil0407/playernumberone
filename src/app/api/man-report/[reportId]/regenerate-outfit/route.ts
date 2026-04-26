import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import {
  regenerateSingleOutfitImage,
  mergeManReportImagePathsForReport,
  resolveManReportImageUrls,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import type { ReportData } from '@/lib/manReportGenerator';
import { withManReportSection4Qa } from '@/lib/manReportQa';

// Replace the outfit block for `outfitNumber` in the full s4_outfits string.
// Handles both old bold format "**Outfit N —" and new plain uppercase "OUTFIT N —".
function replaceOutfitBlock(s4Text: string, outfitNumber: number, newBlock: string): string {
  const blocks = s4Text.split(/(?=(?:\*\*Outfit\s+\d+|\bOUTFIT\s+\d+))/i);
  const idx = blocks.findIndex(b => {
    const t = b.trim();
    return new RegExp(`^(?:\\*\\*Outfit|OUTFIT)\\s+${outfitNumber}\\s*[—–-]`).test(t);
  });
  if (idx === -1) return s4Text;
  blocks[idx] = newBlock.trimEnd() + '\n\n';
  return blocks.join('');
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
  const { outfitNumber, outfitText, imageModel } = body as {
    outfitNumber: number;
    outfitText: string;
    imageModel?: string;
  };

  if (!outfitNumber || !outfitText) {
    return NextResponse.json({ error: 'outfitNumber and outfitText are required' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls, submission_id')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Fetch full-body photo URL from the submission
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission?.photo_fullbody_url) {
    return NextResponse.json({ error: 'No full-body photo found on submission — cannot regenerate outfit image' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classification = (report.report_data as any)?.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  const imagePaths = report.image_urls as ManReportImagePaths | null;

  // Resolve hairstyle headshot signed URL for face/hair reference (best effort)
  let hairstyleHeadshotUrl: string | null = null;
  const hairstylePath = imagePaths?.hairstyleCards?.[0];
  if (hairstylePath) {
    const { data: signed } = await supabaseAdmin.storage
      .from('man-report-images')
      .createSignedUrl(hairstylePath, 300);
    hairstyleHeadshotUrl = signed?.signedUrl ?? null;
  }

  const newPath = await regenerateSingleOutfitImage(
    reportId,
    outfitNumber,
    outfitText,
    submission.photo_fullbody_url,
    classification,
    imageModel ?? 'gemini-3.1-flash-image-preview',
    hairstyleHeadshotUrl,
  );

  const outfitPatch: (string | null | undefined)[] = [];
  outfitPatch[outfitNumber - 1] = newPath;

  // Patch s4_outfits text (replace just this outfit block)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentS4 = (report.report_data as any)?.sections?.s4_outfits ?? '';
  const newS4 = replaceOutfitBlock(currentS4, outfitNumber, outfitText);
  const nextReportData = withManReportSection4Qa({
    ...(report.report_data as ReportData),
    sections: {
      ...((report.report_data as ReportData)?.sections),
      s4_outfits: newS4,
    },
  });

  const newImagePaths = await mergeManReportImagePathsForReport(
    reportId,
    { outfitCards: outfitPatch },
    {
      report_data: nextReportData,
    },
  );

  const resolved = await resolveManReportImageUrls(newImagePaths);
  const imageUrl = resolved?.outfitCards?.[outfitNumber - 1] ?? null;

  return NextResponse.json({
    imageUrl,
    storagePath: newPath,
    updatedS4Outfits: newS4,
    qa: nextReportData.qa,
  });
}
