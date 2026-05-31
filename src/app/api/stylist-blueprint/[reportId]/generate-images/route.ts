import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { generateStylistBlueprintImages, type StylistBlueprintImageGroup } from '@/lib/stylistBlueprintImageGenerator';
import type { StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const allowedGroups = new Set(['cover', 'diagnosis', 'prescription', 'capsule_1', 'capsule_2', 'capsule_3', 'capsule_4', 'closing', 'all']);
  const group = allowedGroups.has(body.group) ? body.group as StylistBlueprintImageGroup : 'all';
  const force = Boolean(body.force);

  const { data: report, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, share_token, submission_id')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report data not found' }, { status: 404 });
  }

  try {
    const { data: submission } = await supabaseAdmin
      .from('stylist_intake_responses')
      .select('*')
      .eq('id', report.submission_id)
      .maybeSingle();

    const imagePaths = await generateStylistBlueprintImages(
      reportId,
      report.report_data as StylistBlueprintReportData,
      report.share_token ?? null,
      { group, force, submission: submission ?? null },
    );
    return NextResponse.json({ success: true, imagePaths });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    await supabaseAdmin
      .from('stylist_blueprint_reports')
      .update({ progress_stage: null, error_message: message, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
