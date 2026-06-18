import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  extractOutfitBlock,
  hashOutfitBlock,
  normaliseSequentialManOutfitNumbers,
  parseManOutfitBlock,
  replaceOutfitBlock,
} from '@/lib/manOutfitSection';
import {
  regenerateSingleOutfitImage,
  resolveManReportImageUrls,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import { withManReportSection4Qa } from '@/lib/manReportQa';
import { revalidateManReportCache } from '@/lib/manReportCache';
import { getLiteralSwapBlockingIssues } from '@/lib/manOutfitSwap';

const ALLOWED_IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];

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
  const body = await request.json();
  const outfitNumber = Number(body?.outfitNumber);
  const candidateBlock = String(body?.candidateBlock ?? '').trim();
  const baseUpdatedAt = String(body?.baseUpdatedAt ?? '').trim();
  const currentOutfitHash = String(body?.currentOutfitHash ?? '').trim();
  const reason = String(body?.reason ?? '').trim();
  const notes = String(body?.notes ?? '').trim();
  const imageModel = ALLOWED_IMAGE_MODELS.includes(body?.imageModel)
    ? body.imageModel
    : 'gemini-3.1-flash-image-preview';

  if (!Number.isInteger(outfitNumber) || outfitNumber < 1 || outfitNumber > 20 || !candidateBlock || !baseUpdatedAt || !currentOutfitHash) {
    return NextResponse.json({ error: 'outfitNumber, candidateBlock, baseUpdatedAt, and currentOutfitHash are required' }, { status: 400 });
  }

  const candidate = parseManOutfitBlock(candidateBlock);
  if (!candidate || candidate.number !== outfitNumber) {
    return NextResponse.json({ error: `Replacement must be a parseable Outfit ${outfitNumber} block` }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls, submission_id, share_token, updated_at')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.updated_at !== baseUpdatedAt) {
    return NextResponse.json({ error: 'Report changed after the draft was created. Generate a fresh replacement draft.' }, { status: 409 });
  }

  const reportData = report.report_data as ReportData & { outfit_swap_history?: unknown[] };
  const imagePaths = (report.image_urls as ManReportImagePaths | null) ?? {
    hairstyleCards: [],
    beardCards: [],
    eyewearCards: [],
    outfitCards: [],
    comboGridCards: {},
  };
  const currentSection4 = normaliseSequentialManOutfitNumbers(reportData.sections?.s4_outfits ?? '');
  const currentBlock = extractOutfitBlock(currentSection4, outfitNumber);

  if (!currentBlock) {
    return NextResponse.json({ error: `Could not locate Outfit ${outfitNumber}` }, { status: 400 });
  }

  if (hashOutfitBlock(currentBlock) !== currentOutfitHash) {
    return NextResponse.json({ error: 'This outfit changed after the draft was created. Generate a fresh replacement draft.' }, { status: 409 });
  }

  const replacedS4 = replaceOutfitBlock(currentSection4, outfitNumber, candidateBlock);
  if (!replacedS4) {
    return NextResponse.json({ error: `Could not replace Outfit ${outfitNumber}` }, { status: 400 });
  }
  const newS4 = normaliseSequentialManOutfitNumbers(replacedS4);

  const nextReportData = withManReportSection4Qa({
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_outfits: newS4,
    },
    outfit_swap_history: [
      ...(Array.isArray(reportData.outfit_swap_history) ? reportData.outfit_swap_history : []),
      {
        outfitNumber,
        swappedAt: new Date().toISOString(),
        reason,
        notes,
        previousBlock: currentBlock,
        replacementBlock: candidateBlock,
        previousImagePath: imagePaths.outfitCards?.[outfitNumber - 1] ?? null,
      },
    ],
  } as ReportData & { outfit_swap_history?: unknown[] }) as ReportData & { outfit_swap_history?: unknown[] };

  const blockingQaIssues = getLiteralSwapBlockingIssues(nextReportData.qa?.section4?.issues ?? []);
  if (blockingQaIssues.length > 0) {
    return NextResponse.json({
      error: `Replacement has blocking QA issues: ${blockingQaIssues[0].message}`,
      issues: blockingQaIssues,
    }, { status: 400 });
  }

  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_headshot_url, photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subErr || !submission?.photo_fullbody_url) {
    return NextResponse.json({ error: 'No full-body photo found on submission — replacement was not applied' }, { status: 400 });
  }

  const groomingHeadshotUrl = submission.photo_headshot_url ?? null;

  let newPath: string;
  try {
    newPath = await regenerateSingleOutfitImage(
      reportId,
      outfitNumber,
      candidateBlock,
      submission.photo_fullbody_url,
      reportData.classification,
      imageModel,
      groomingHeadshotUrl,
      `outfit_${outfitNumber}_${Date.now()}.jpg`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Image generation failed. Existing outfit was left unchanged: ${message}` }, { status: 500 });
  }

  const nextOutfitCards = [...(imagePaths.outfitCards ?? [])];
  while (nextOutfitCards.length < outfitNumber) nextOutfitCards.push(null);
  nextOutfitCards[outfitNumber - 1] = newPath;

  const nextImagePaths: ManReportImagePaths = {
    hairstyleCards: [...(imagePaths.hairstyleCards ?? [])],
    beardCards: [...(imagePaths.beardCards ?? [])],
    eyewearCards: [...(imagePaths.eyewearCards ?? [])],
    outfitCards: nextOutfitCards,
    comboGridCards: { ...(imagePaths.comboGridCards ?? {}) },
    ...(imagePaths.baseModel ? { baseModel: imagePaths.baseModel } : {}),
  };

  const auditHistory = Array.isArray(nextReportData.outfit_swap_history)
    ? nextReportData.outfit_swap_history
    : [];
  const latestAudit = auditHistory[auditHistory.length - 1] as Record<string, unknown> | undefined;
  if (latestAudit) latestAudit.newImagePath = newPath;

  const { data: saved, error: saveErr } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      image_urls: nextImagePaths,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('updated_at', report.updated_at)
    .select('image_urls, report_data, share_token')
    .maybeSingle();

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  if (!saved) {
    return NextResponse.json({ error: 'Report changed while the image was generating. Generate a fresh replacement draft.' }, { status: 409 });
  }

  await revalidateManReportCache(reportId, saved.share_token ?? report.share_token ?? null);

  const resolved = await resolveManReportImageUrls(saved.image_urls as ManReportImagePaths);

  return NextResponse.json({
    imageUrl: resolved?.outfitCards?.[outfitNumber - 1] ?? null,
    storagePath: newPath,
    updatedS4Outfits: (saved.report_data as ReportData).sections.s4_outfits,
    qa: (saved.report_data as ReportData).qa,
  });
}
