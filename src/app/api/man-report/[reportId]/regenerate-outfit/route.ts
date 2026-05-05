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

function clearOutfitImageSlot(
  paths: ManReportImagePaths | null,
  outfitNumber: number,
): ManReportImagePaths {
  const outfitCards = [...(paths?.outfitCards ?? [])];
  while (outfitCards.length < outfitNumber) outfitCards.push(null);
  outfitCards[outfitNumber - 1] = null;

  return {
    hairstyleCards: [...(paths?.hairstyleCards ?? [])],
    eyewearCards: [...(paths?.eyewearCards ?? [])],
    outfitCards,
    ...(paths?.baseModel ? { baseModel: paths.baseModel } : {}),
  };
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

  if (!new RegExp(`(?:\\*\\*Outfit|OUTFIT)\\s+${outfitNumber}\\s*[—–-]`, 'i').test(outfitText)) {
    return NextResponse.json({
      error: `Edited text must include the Outfit ${outfitNumber} header so the report and image prompt can be parsed`,
    }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls, submission_id, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classification = (report.report_data as any)?.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  const imagePaths = report.image_urls as ManReportImagePaths | null;
  const reportData = report.report_data as ReportData;

  // Patch s4_outfits text (replace just this outfit block) and persist it before
  // calling Gemini. If image generation fails, the text edit still remains saved.
  const currentS4 = reportData.sections?.s4_outfits ?? '';
  const newS4 = replaceOutfitBlock(currentS4, outfitNumber, outfitText);
  if (!newS4) {
    return NextResponse.json({ error: `Could not find Outfit ${outfitNumber} in Section 4 text` }, { status: 400 });
  }

  const nextReportData = withManReportSection4Qa({
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_outfits: newS4,
    },
  });

  const clearedImagePaths = clearOutfitImageSlot(imagePaths, outfitNumber);
  const { error: saveErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      image_urls: clearedImagePaths,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  // Fetch full-body photo URL from the submission after the text has been saved.
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission?.photo_fullbody_url) {
    const message = 'No full-body photo found on submission — outfit text was saved but image could not be regenerated';
    await supabaseAdmin
      .from('man_reports')
      .update({
        error_message: `Outfit ${outfitNumber} image regeneration failed: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      imageUrl: null,
      storagePath: null,
      updatedS4Outfits: newS4,
      qa: nextReportData.qa,
      imageStatus: 'failed',
      error: message,
    });
  }

  // Resolve hairstyle headshot signed URL for face/hair reference (best effort)
  let hairstyleHeadshotUrl: string | null = null;
  const hairstylePath = imagePaths?.hairstyleCards?.[0];
  if (hairstylePath) {
    const { data: signed } = await supabaseAdmin.storage
      .from('man-report-images')
      .createSignedUrl(hairstylePath, 300);
    hairstyleHeadshotUrl = signed?.signedUrl ?? null;
  }

  let newPath: string;
  try {
    newPath = await regenerateSingleOutfitImage(
      reportId,
      outfitNumber,
      outfitText,
      submission.photo_fullbody_url,
      classification,
      imageModel ?? 'gemini-3.1-flash-image-preview',
      hairstyleHeadshotUrl,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabaseAdmin
      .from('man_reports')
      .update({
        error_message: `Outfit ${outfitNumber} image regeneration failed: ${message.slice(0, 500)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      imageUrl: null,
      storagePath: null,
      updatedS4Outfits: newS4,
      qa: nextReportData.qa,
      imageStatus: 'failed',
      error: message,
    });
  }

  const outfitPatch: (string | null | undefined)[] = [];
  outfitPatch[outfitNumber - 1] = newPath;

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
    imageStatus: 'generated',
  });
}
