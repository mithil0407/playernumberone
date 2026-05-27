import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  mergeComboGridGroupText,
  normaliseComboGridText,
  serialiseComboGridGroup,
  type ComboGridKind,
} from '@/lib/manComboGridSection';
import {
  mergeManReportImagePathsForReport,
  regenerateComboGridImagesFromText,
  regenerateSingleComboGridImageFromText,
  resolveManReportImageUrls,
  type ManReportImagePaths,
  type ResolvedImageUrls,
} from '@/lib/manImageGenerator';
import { revalidateManReportCache } from '@/lib/manReportCache';

type ComboGridImageStatus = 'generated' | 'partial' | 'failed';
const COMBO_GRID_KINDS = new Set<ComboGridKind>(['office', 'evening', 'relaxed']);

function parseComboGridKind(value: unknown): ComboGridKind | null {
  return typeof value === 'string' && COMBO_GRID_KINDS.has(value as ComboGridKind)
    ? value as ComboGridKind
    : null;
}

function clearComboGridImageSlots(paths: ManReportImagePaths | null): ManReportImagePaths {
  return {
    hairstyleCards: [...(paths?.hairstyleCards ?? [])],
    beardCards: [...(paths?.beardCards ?? [])],
    eyewearCards: [...(paths?.eyewearCards ?? [])],
    outfitCards: [...(paths?.outfitCards ?? [])],
    comboGridCards: {
      office: null,
      evening: null,
      relaxed: null,
    },
    ...(paths?.baseModel ? { baseModel: paths.baseModel } : {}),
  };
}

function clearComboGridImageSlot(paths: ManReportImagePaths | null, kind: ComboGridKind): ManReportImagePaths {
  return {
    hairstyleCards: [...(paths?.hairstyleCards ?? [])],
    beardCards: [...(paths?.beardCards ?? [])],
    eyewearCards: [...(paths?.eyewearCards ?? [])],
    outfitCards: [...(paths?.outfitCards ?? [])],
    comboGridCards: {
      office: paths?.comboGridCards?.office ?? null,
      evening: paths?.comboGridCards?.evening ?? null,
      relaxed: paths?.comboGridCards?.relaxed ?? null,
      [kind]: null,
    },
    ...(paths?.baseModel ? { baseModel: paths.baseModel } : {}),
  };
}

function statusFromPaths(paths: NonNullable<ManReportImagePaths['comboGridCards']>): ComboGridImageStatus {
  const generatedCount = (['office', 'evening', 'relaxed'] as const)
    .filter(kind => !!paths[kind])
    .length;

  if (generatedCount === 3) return 'generated';
  if (generatedCount > 0) return 'partial';
  return 'failed';
}

function emptyResolvedComboGridCards(): NonNullable<ResolvedImageUrls['comboGridCards']> {
  return { office: null, evening: null, relaxed: null };
}

function allGridErrors(message: string): Partial<Record<ComboGridKind, string>> {
  return {
    office: message,
    evening: message,
    relaxed: message,
  };
}

function oneGridError(kind: ComboGridKind, message: string): Partial<Record<ComboGridKind, string>> {
  return { [kind]: message } as Partial<Record<ComboGridKind, string>>;
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
  const comboGridText = String(body?.comboGridText ?? '').trim();
  const imageModel = typeof body?.imageModel === 'string' ? body.imageModel : undefined;
  const kind = parseComboGridKind(body?.kind);
  if (body?.kind !== undefined && !kind) {
    return NextResponse.json({ error: 'Invalid combo grid kind' }, { status: 400 });
  }

  if (!comboGridText) {
    return NextResponse.json({ error: 'comboGridText is required' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, image_urls, submission_id, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classification = (report.report_data as any)?.classification;
  if (!classification) {
    return NextResponse.json({ error: 'No classification data found' }, { status: 400 });
  }

  const reportData = report.report_data as ReportData;
  const existingComboText = reportData.sections.s4_combo_grids ?? '';
  const normalised = kind
    ? mergeComboGridGroupText(existingComboText, kind, comboGridText)
    : normaliseComboGridText(comboGridText);
  if (!normalised.ok) {
    return NextResponse.json({ error: normalised.error }, { status: 400 });
  }

  const nextReportData: ReportData = {
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_combo_grids: normalised.text,
    },
  };

  if (kind) {
    const selectedGroup = normalised.groups.find(group => group.kind === kind);
    if (!selectedGroup) {
      return NextResponse.json({ error: `No ${kind} combination grid group found` }, { status: 400 });
    }

    const clearedImagePaths = clearComboGridImageSlot(report.image_urls as ManReportImagePaths | null, kind);
    const { error: saveError } = await supabaseAdmin
      .from('man_reports')
      .update({
        report_data: nextReportData,
        image_urls: clearedImagePaths,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    await revalidateManReportCache(reportId, report.share_token ?? null);

    const { data: submission, error: subError } = await supabaseAdmin
      .from('man_intake_submissions')
      .select('photo_headshot_url, photo_fullbody_url')
      .eq('id', report.submission_id)
      .single();

    if (subError || !submission?.photo_fullbody_url) {
      const message = 'No full-body photo found on submission — combination grid text was saved but this image could not be regenerated';
      await supabaseAdmin
        .from('man_reports')
        .update({
          error_message: `Combination grid ${kind} image regeneration failed: ${message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, report.share_token ?? null);
      const resolved = await resolveManReportImageUrls(clearedImagePaths);

      return NextResponse.json({
        updatedComboGridText: normalised.text,
        comboGridCards: resolved?.comboGridCards ?? emptyResolvedComboGridCards(),
        storagePaths: clearedImagePaths.comboGridCards,
        imageStatus: 'failed' as ComboGridImageStatus,
        gridErrors: oneGridError(kind, message),
        error: message,
        kind,
      });
    }

    try {
      const newPath = await regenerateSingleComboGridImageFromText(
        reportId,
        kind,
        serialiseComboGridGroup(selectedGroup),
        submission.photo_fullbody_url,
        classification,
        submission.photo_headshot_url ?? null,
        imageModel ?? 'gemini-3.1-flash-image-preview',
      );
      const newImagePaths = await mergeManReportImagePathsForReport(
        reportId,
        { comboGridCards: { [kind]: newPath } },
        {
          report_data: nextReportData,
          error_message: null,
        },
      );
      const resolved = await resolveManReportImageUrls(newImagePaths);

      return NextResponse.json({
        updatedComboGridText: normalised.text,
        comboGridCards: resolved?.comboGridCards ?? emptyResolvedComboGridCards(),
        storagePaths: newImagePaths.comboGridCards,
        imageStatus: 'generated' as ComboGridImageStatus,
        gridErrors: {},
        error: null,
        kind,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from('man_reports')
        .update({
          error_message: `Combination grid ${kind} image regeneration failed: ${message.slice(0, 500)}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      await revalidateManReportCache(reportId, report.share_token ?? null);
      const resolved = await resolveManReportImageUrls(clearedImagePaths);

      return NextResponse.json({
        updatedComboGridText: normalised.text,
        comboGridCards: resolved?.comboGridCards ?? emptyResolvedComboGridCards(),
        storagePaths: clearedImagePaths.comboGridCards,
        imageStatus: 'failed' as ComboGridImageStatus,
        gridErrors: oneGridError(kind, message),
        error: message,
        kind,
      });
    }
  }

  const clearedImagePaths = clearComboGridImageSlots(report.image_urls as ManReportImagePaths | null);
  const { error: saveError } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      image_urls: clearedImagePaths,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  const { data: submission, error: subError } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('photo_headshot_url, photo_fullbody_url')
    .eq('id', report.submission_id)
    .single();

  if (subError || !submission?.photo_fullbody_url) {
    const message = 'No full-body photo found on submission — combination grid text was saved but images could not be regenerated';
    await supabaseAdmin
      .from('man_reports')
      .update({
        error_message: `Combination grid image regeneration failed: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      updatedComboGridText: normalised.text,
      comboGridCards: emptyResolvedComboGridCards(),
      storagePaths: clearedImagePaths.comboGridCards,
      imageStatus: 'failed' as ComboGridImageStatus,
      gridErrors: allGridErrors(message),
      error: message,
    });
  }

  let generated: Awaited<ReturnType<typeof regenerateComboGridImagesFromText>>;
  try {
    generated = await regenerateComboGridImagesFromText(
      reportId,
      normalised.text,
      submission.photo_fullbody_url,
      classification,
      submission.photo_headshot_url ?? null,
      imageModel ?? 'gemini-3.1-flash-image-preview',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabaseAdmin
      .from('man_reports')
      .update({
        error_message: `Combination grid image regeneration failed: ${message.slice(0, 500)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, report.share_token ?? null);

    return NextResponse.json({
      updatedComboGridText: normalised.text,
      comboGridCards: emptyResolvedComboGridCards(),
      storagePaths: clearedImagePaths.comboGridCards,
      imageStatus: 'failed' as ComboGridImageStatus,
      gridErrors: allGridErrors(message),
      error: message,
    });
  }

  const imageStatus = statusFromPaths(generated.paths);
  const errorMessage = imageStatus === 'generated'
    ? null
    : `Combination grid image regeneration ${imageStatus}: ${Object.entries(generated.errors)
      .map(([kind, message]) => `${kind}: ${message}`)
      .join(' | ')
      .slice(0, 500)}`;

  const newImagePaths = await mergeManReportImagePathsForReport(
    reportId,
    { comboGridCards: generated.paths },
    {
      report_data: nextReportData,
      error_message: errorMessage,
    },
  );

  const resolved = await resolveManReportImageUrls(newImagePaths);

  return NextResponse.json({
    updatedComboGridText: normalised.text,
    comboGridCards: resolved?.comboGridCards ?? emptyResolvedComboGridCards(),
    storagePaths: newImagePaths.comboGridCards,
    imageStatus,
    gridErrors: generated.errors,
    error: errorMessage,
  });
}
