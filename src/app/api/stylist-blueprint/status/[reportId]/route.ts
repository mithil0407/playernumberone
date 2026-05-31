import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { getStylistBlueprintImageCounts, type StylistBlueprintImagePaths } from '@/lib/stylistBlueprintImageGenerator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, progress_stage, error_message, generated_at, share_token, updated_at, image_urls')
    .eq('id', reportId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  return NextResponse.json({
    reportId: data.id,
    status: data.status,
    progressStage: data.progress_stage,
    errorMessage: data.error_message,
    generatedAt: data.generated_at,
    shareToken: data.share_token,
    updatedAt: data.updated_at,
    imageCounts: getStylistBlueprintImageCounts(data.image_urls as StylistBlueprintImagePaths | null),
  });
}
