import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  regenerateSingleFaceImage,
  mergeManReportImagePathsForReport,
  resolveManReportImageUrls,
  type FaceImageKind,
} from '@/lib/manImageGenerator';

const VALID_FACE_IMAGE_KINDS: FaceImageKind[] = ['hairstyle', 'beard', 'eyewear'];

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
  const { kind, optionIndex, imageModel } = body as {
    kind?: FaceImageKind;
    optionIndex?: number;
    imageModel?: string;
  };

  if (!kind || !VALID_FACE_IMAGE_KINDS.includes(kind) || !optionIndex || ![1, 2].includes(optionIndex)) {
    return NextResponse.json({ error: 'kind must be hairstyle|beard|eyewear and optionIndex must be 1 or 2' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, submission_id')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_headshot_url, photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subErr || (!submission?.photo_headshot_url && !submission?.photo_fullbody_url)) {
    return NextResponse.json(
      { error: 'No usable source photo found on submission — cannot regenerate face image' },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classification = (report.report_data as any)?.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  try {
    const newPath = await regenerateSingleFaceImage(
      reportId,
      submission,
      classification,
      kind,
      optionIndex,
      imageModel ?? 'gemini-3.1-flash-image-preview',
    );

    const slotPatch: (string | null | undefined)[] = [];
    slotPatch[optionIndex - 1] = newPath;

    const newImagePaths = await mergeManReportImagePathsForReport(
      reportId,
      kind === 'hairstyle'
        ? { hairstyleCards: slotPatch }
        : kind === 'beard'
          ? { beardCards: slotPatch }
          : { eyewearCards: slotPatch },
    );

    const resolved = await resolveManReportImageUrls(newImagePaths);
    const imageUrl = kind === 'hairstyle'
      ? resolved?.hairstyleCards?.[optionIndex - 1] ?? null
      : kind === 'beard'
        ? resolved?.beardCards?.[optionIndex - 1] ?? null
        : resolved?.eyewearCards?.[optionIndex - 1] ?? null;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to resolve regenerated image URL' }, { status: 500 });
    }

    return NextResponse.json({
      kind,
      optionIndex,
      imageUrl,
      storagePath: newPath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Face image regeneration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
