import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  regenerateSingleFaceImage,
  resolveManReportImageUrls,
  type FaceImageKind,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import {
  getFaceStyleOption,
  hashFaceStyleText,
  setFaceStyleOption,
} from '@/lib/manFaceStyleSwap';
import { revalidateManReportCache } from '@/lib/manReportCache';

const VALID_FACE_IMAGE_KINDS: FaceImageKind[] = ['hairstyle', 'beard', 'eyewear'];
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
  const body = await request.json().catch(() => ({}));
  const kind = body?.kind as FaceImageKind;
  const optionIndex = Number(body?.optionIndex);
  const candidateStyle = String(body?.candidateStyle ?? '').trim();
  const baseUpdatedAt = String(body?.baseUpdatedAt ?? '').trim();
  const currentStyleHash = String(body?.currentStyleHash ?? '').trim();
  const reason = String(body?.reason ?? '').trim();
  const notes = String(body?.notes ?? '').trim();
  const imageModel = ALLOWED_IMAGE_MODELS.includes(body?.imageModel)
    ? body.imageModel
    : 'gemini-3.1-flash-image-preview';

  if (!VALID_FACE_IMAGE_KINDS.includes(kind) || ![1, 2].includes(optionIndex) || !candidateStyle || !baseUpdatedAt || !currentStyleHash) {
    return NextResponse.json({
      error: 'kind, optionIndex, candidateStyle, baseUpdatedAt, and currentStyleHash are required',
    }, { status: 400 });
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

  const reportData = report.report_data as ReportData & { face_style_swap_history?: unknown[] };
  const currentStyle = getFaceStyleOption(reportData.classification, kind, optionIndex);
  if (!currentStyle) {
    return NextResponse.json({ error: `No ${kind} recommendation found for option ${optionIndex}` }, { status: 400 });
  }
  if (hashFaceStyleText(currentStyle) !== currentStyleHash) {
    return NextResponse.json({ error: 'This style changed after the draft was created. Generate a fresh replacement draft.' }, { status: 409 });
  }

  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_headshot_url, photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subErr || (!submission?.photo_headshot_url && !submission?.photo_fullbody_url)) {
    return NextResponse.json({ error: 'No usable source photo found on submission — replacement was not applied' }, { status: 400 });
  }

  const nextClassification = setFaceStyleOption(reportData.classification, kind, optionIndex, candidateStyle);
  const nextReportData = {
    ...reportData,
    classification: nextClassification,
    face_style_swap_history: [
      ...(Array.isArray(reportData.face_style_swap_history) ? reportData.face_style_swap_history : []),
      {
        kind,
        optionIndex,
        swappedAt: new Date().toISOString(),
        reason,
        notes,
        previousStyle: currentStyle,
        replacementStyle: candidateStyle,
        previousImagePath: (report.image_urls as ManReportImagePaths | null | undefined)?.[
          kind === 'hairstyle' ? 'hairstyleCards' : kind === 'beard' ? 'beardCards' : 'eyewearCards'
        ]?.[optionIndex - 1] ?? null,
      },
    ],
  } as ReportData & { face_style_swap_history?: unknown[] };

  let newPath: string;
  try {
    newPath = await regenerateSingleFaceImage(
      reportId,
      submission,
      nextClassification,
      kind,
      optionIndex,
      imageModel,
      candidateStyle,
      `${kind}_${optionIndex}_${Date.now()}.jpg`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Image generation failed. Existing style was left unchanged: ${message}` }, { status: 500 });
  }

  const imagePaths = (report.image_urls as ManReportImagePaths | null) ?? {
    hairstyleCards: [],
    beardCards: [],
    eyewearCards: [],
    outfitCards: [],
    comboGridCards: {},
  };
  const nextImagePaths: ManReportImagePaths = {
    hairstyleCards: [...(imagePaths.hairstyleCards ?? [])],
    beardCards: [...(imagePaths.beardCards ?? [])],
    eyewearCards: [...(imagePaths.eyewearCards ?? [])],
    outfitCards: [...(imagePaths.outfitCards ?? [])],
    comboGridCards: { ...(imagePaths.comboGridCards ?? {}) },
    ...(imagePaths.baseModel ? { baseModel: imagePaths.baseModel } : {}),
  };

  const targetCards = kind === 'hairstyle'
    ? nextImagePaths.hairstyleCards
    : kind === 'beard'
      ? nextImagePaths.beardCards
      : nextImagePaths.eyewearCards;
  while (targetCards.length < optionIndex) targetCards.push(null);
  targetCards[optionIndex - 1] = newPath;

  const auditHistory = Array.isArray(nextReportData.face_style_swap_history)
    ? nextReportData.face_style_swap_history
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
  const imageUrl = kind === 'hairstyle'
    ? resolved?.hairstyleCards?.[optionIndex - 1] ?? null
    : kind === 'beard'
      ? resolved?.beardCards?.[optionIndex - 1] ?? null
      : resolved?.eyewearCards?.[optionIndex - 1] ?? null;

  return NextResponse.json({
    kind,
    optionIndex,
    imageUrl,
    storagePath: newPath,
    candidateStyle,
    updatedFace: (saved.report_data as ReportData).classification.face,
  });
}
