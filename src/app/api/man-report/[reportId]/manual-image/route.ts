import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { revalidateManReportCache } from '@/lib/manReportCache';
import {
  mergeManReportImagePathsForReport,
  resolveManReportImageUrls,
  uploadManualManReportImage,
  type FaceImageKind,
  type ManReportImagePaths,
} from '@/lib/manImageGenerator';
import { supabaseAdmin } from '@/lib/supabase';
import type { ComboGridKind } from '@/lib/manComboGridSection';

const FACE_KINDS = new Set<FaceImageKind>(['hairstyle', 'beard', 'eyewear']);
const COMBO_GRID_KINDS = new Set<ComboGridKind>(['office', 'evening', 'relaxed']);

function imagePathsOrEmpty(paths: ManReportImagePaths | null): ManReportImagePaths {
  return {
    hairstyleCards: [...(paths?.hairstyleCards ?? [])],
    beardCards: [...(paths?.beardCards ?? [])],
    eyewearCards: [...(paths?.eyewearCards ?? [])],
    outfitCards: [...(paths?.outfitCards ?? [])],
    comboGridCards: {
      office: paths?.comboGridCards?.office ?? null,
      evening: paths?.comboGridCards?.evening ?? null,
      relaxed: paths?.comboGridCards?.relaxed ?? null,
    },
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
  const formData = await request.formData();
  const imageType = String(formData.get('imageType') ?? '');
  const replaceExisting = formData.get('replace') === '1';
  const file = formData.get('image');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Select or drop an image file before uploading.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'The selected image is empty. Choose a valid image file.' }, { status: 400 });
  }
  if (file.type && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: `Unsupported file type "${file.type}". Upload a JPG, PNG, WebP, HEIC, or other image file.` }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('image_urls, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const currentPaths = imagePathsOrEmpty(report.image_urls as ManReportImagePaths | null);
  let filename: string;
  let patch: Parameters<typeof mergeManReportImagePathsForReport>[1];
  let responseImageUrl: string | null = null;

  try {
    if (imageType === 'face') {
      const faceKind = String(formData.get('faceKind') ?? '') as FaceImageKind;
      if (!FACE_KINDS.has(faceKind)) {
        return NextResponse.json({ error: 'faceKind must be hairstyle, beard, or eyewear' }, { status: 400 });
      }

      const key = faceKind === 'hairstyle'
        ? 'hairstyleCards'
        : faceKind === 'beard'
          ? 'beardCards'
          : 'eyewearCards';
      if (currentPaths[key]?.[0] && !replaceExisting) {
        return NextResponse.json({
          error: 'This image slot already has a stored image. Refresh the report or upload again to replace it.',
        }, { status: 409 });
      }

      filename = `${faceKind}_grid.jpg`;
      const path = await uploadManualManReportImage(reportId, Buffer.from(await file.arrayBuffer()), filename);
      patch = { [key]: [path] } as Partial<ManReportImagePaths>;
    } else if (imageType === 'outfit') {
      const outfitNumber = Number(formData.get('outfitNumber'));
      if (!Number.isInteger(outfitNumber) || outfitNumber < 1) {
        return NextResponse.json({ error: 'outfitNumber is required' }, { status: 400 });
      }
      if (currentPaths.outfitCards[outfitNumber - 1] && !replaceExisting) {
        return NextResponse.json({
          error: 'This outfit slot already has a stored image. Refresh the report or upload again to replace it.',
        }, { status: 409 });
      }

      filename = `outfit_${outfitNumber}.jpg`;
      const path = await uploadManualManReportImage(
        reportId,
        Buffer.from(await file.arrayBuffer()),
        filename,
        true,
      );
      const outfitPatch: (string | null | undefined)[] = [];
      outfitPatch[outfitNumber - 1] = path;
      patch = { outfitCards: outfitPatch };
    } else if (imageType === 'comboGrid') {
      const comboGridKind = String(formData.get('comboGridKind') ?? '') as ComboGridKind;
      if (!COMBO_GRID_KINDS.has(comboGridKind)) {
        return NextResponse.json({ error: 'comboGridKind must be office, evening, or relaxed' }, { status: 400 });
      }
      if (currentPaths.comboGridCards?.[comboGridKind] && !replaceExisting) {
        return NextResponse.json({
          error: 'This combination grid already has a stored image. Refresh the report or upload again to replace it.',
        }, { status: 409 });
      }

      filename = `combo_grid_${comboGridKind}.jpg`;
      const path = await uploadManualManReportImage(reportId, Buffer.from(await file.arrayBuffer()), filename);
      patch = { comboGridCards: { [comboGridKind]: path } };
    } else {
      return NextResponse.json({ error: 'Unsupported manual image target. Choose a face grid, outfit, or combination grid slot.' }, { status: 400 });
    }

    const nextPaths = await mergeManReportImagePathsForReport(reportId, patch, { error_message: null });
    await revalidateManReportCache(reportId, report.share_token ?? null);

    const resolved = await resolveManReportImageUrls(nextPaths);
    if (imageType === 'face') {
      const faceKind = String(formData.get('faceKind')) as FaceImageKind;
      responseImageUrl = faceKind === 'hairstyle'
        ? resolved?.hairstyleCards?.[0] ?? null
        : faceKind === 'beard'
          ? resolved?.beardCards?.[0] ?? null
          : resolved?.eyewearCards?.[0] ?? null;
    } else if (imageType === 'outfit') {
      const outfitNumber = Number(formData.get('outfitNumber'));
      responseImageUrl = resolved?.outfitCards?.[outfitNumber - 1] ?? null;
    } else if (imageType === 'comboGrid') {
      const comboGridKind = String(formData.get('comboGridKind')) as ComboGridKind;
      responseImageUrl = resolved?.comboGridCards?.[comboGridKind] ?? null;
    }

    return NextResponse.json({
      imageUrl: responseImageUrl,
      imageUrls: resolved,
      storagePaths: nextPaths,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Manual image upload failed: ${message}` }, { status: 500 });
  }
}
