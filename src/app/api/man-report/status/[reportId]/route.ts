// GET /api/man-report/status/[reportId]
// Lightweight polling endpoint — returns only status + progress_stage.
// Called every 4 seconds by the admin detail page while generation is running.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;

  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, progress_stage, error_message, generated_at, share_token, updated_at, image_urls')
    .eq('id', reportId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const imageUrls = data.image_urls as {
    hairstyleCards?: (string | null)[];
    beardCards?: (string | null)[];
    eyewearCards?: (string | null)[];
    outfitCards?: (string | null)[];
    comboGridCards?: { office?: string | null; evening?: string | null; relaxed?: string | null };
  } | null;

  return NextResponse.json({
    reportId:      data.id,
    status:        data.status,
    progressStage: data.progress_stage,
    errorMessage:  data.error_message,
    generatedAt:   data.generated_at,
    shareToken:    data.share_token,
    updatedAt:     data.updated_at,
    imageCounts: {
      hairstyleDone: imageUrls?.hairstyleCards?.[0] ? 1 : 0,
      beardDone:     imageUrls?.beardCards?.[0] ? 1 : 0,
      eyewearDone:   imageUrls?.eyewearCards?.[0] ? 1 : 0,
      outfitDone:    (imageUrls?.outfitCards    ?? []).filter(Boolean).length,
      comboGridDone: Object.values(imageUrls?.comboGridCards ?? {}).filter(Boolean).length,
    },
  });
}
