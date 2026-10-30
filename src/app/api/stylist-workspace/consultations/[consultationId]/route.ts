import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { getConsultationWorkspaceAccess, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import {
  consultationReadiness,
  consultationIntakeDiff,
  consultationSourceToIntake,
  ensureConsultationIntake,
  loadConsultationSource,
  signedConsultationPhotoUrls,
} from '@/lib/stylistConsultationWorkspace';
import { consultationUploadUrl } from '@/lib/consultationUploadLink';
import { parseOccasionCounts, suggestOccasionCounts } from '@/lib/stylistOccasionCounts';
import { STYLIST_BLUEPRINT_OUTFIT_COUNT } from '@/lib/stylistBlueprintSchema';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getConsultationWorkspaceAccess(consultationId);
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const source = await loadConsultationSource(consultationId);
  if (!source) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
  const readiness = consultationReadiness(source);
  const [photoUrls, intakeResult, uploadLinkResult] = await Promise.all([
    signedConsultationPhotoUrls(source.upload?.photo_paths ?? {}),
    supabaseAdmin.from('stylist_intake_responses').select('id, raw_consultation_notes, workspace_overrides')
      .eq('consultation_id', consultationId).maybeSingle(),
    supabaseAdmin.from('consultation_upload_links').select('token, expires_at')
      .eq('consultation_id', consultationId).maybeSingle(),
  ]);
  if (intakeResult.error || uploadLinkResult.error) return NextResponse.json({ error: 'Could not load client inputs. Please retry.' }, { status: 500 });
  const intake = intakeResult.data;
  const uploadLinkRow = uploadLinkResult.data;
  const uploadUrl = consultationUploadUrl(uploadLinkRow?.token);
  const { data: reports, error: reportError } = intake?.id
    ? await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, error_message, section_approvals, published_at, delivered_at, created_at, updated_at')
      .eq('submission_id', intake.id)
      .order('created_at', { ascending: false })
    : { data: [], error: null };
  if (reportError) return NextResponse.json({ error: 'Could not load report history. Please retry.' }, { status: 500 });
  // Outfits per occasion: suggested from her form answers, unless the stylist saved her own split.
  const overrides = (intake?.workspace_overrides ?? {}) as Record<string, unknown>;
  const lifestyle = (overrides.lifestyle_context as Record<string, unknown> | undefined) ?? consultationSourceToIntake(source).lifestyle_context;
  const occasionPlan = {
    total: STYLIST_BLUEPRINT_OUTFIT_COUNT,
    suggested: suggestOccasionCounts({ lifestyle_context: lifestyle as Record<string, unknown> | null }, STYLIST_BLUEPRINT_OUTFIT_COUNT),
    saved: parseOccasionCounts(overrides.outfit_occasion_counts, STYLIST_BLUEPRINT_OUTFIT_COUNT),
  };
  return NextResponse.json({
    source,
    readiness,
    photoUrls,
    intake: intake ? { id: intake.id, raw_consultation_notes: intake.raw_consultation_notes } : null,
    occasionPlan,
    reports: reports ?? [],
    uploadLink: uploadLinkRow ? { url: uploadUrl, expiresAt: uploadLinkRow.expires_at } : null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getConsultationWorkspaceAccess(consultationId);
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!identity.stylistId) return NextResponse.json({ error: 'Assign this client to a stylist before editing report inputs.' }, { status: 409 });
  clearWorkspaceQueueCache(identity.stylistId);
  const body = await request.json().catch(() => null) as { action?: string; overrides?: Record<string, unknown>; confirmed?: boolean } | null;
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  if (body.action === 'preview_refresh') {
    const [intake, source] = await Promise.all([
      ensureConsultationIntake({ consultationId, stylistId: identity.stylistId, allowIncomplete: true }),
      loadConsultationSource(consultationId),
    ]);
    if (!source) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    return NextResponse.json({ changes: consultationIntakeDiff(intake, consultationSourceToIntake(source)) });
  }

  if (body.action === 'refresh') {
    if (!body.confirmed) return NextResponse.json({ error: 'Confirm the source changes before refreshing.' }, { status: 400 });
    const intake = await ensureConsultationIntake({ consultationId, stylistId: identity.stylistId, refresh: true, allowIncomplete: true });
    await logStylistReportActivity({ action: 'consultation_snapshot_refreshed', consultationId, stylistId: identity.stylistId });
    return NextResponse.json({ intake });
  }

  if (body.action === 'save_overrides') {
    const intake = await ensureConsultationIntake({ consultationId, stylistId: identity.stylistId, allowIncomplete: true });
    const allowed = new Set([
      'body_measurements', 'focus_areas', 'coverage_requirements', 'lifestyle_context',
      'piece_preferences', 'selected_moodboard_label', 'secondary_moodboard_elements',
      'hair_context', 'skin_tone_self_description', 'raw_consultation_notes',
    ]);
    const patch = Object.fromEntries(Object.entries(body.overrides ?? {}).filter(([key]) => allowed.has(key)));
    const nextOverrides: Record<string, unknown> = { ...((intake.workspace_overrides as Record<string, unknown> | null) ?? {}), ...patch };
    // Outfits per occasion live only in workspace_overrides; null goes back to the form's suggestion.
    if (body.overrides && 'outfit_occasion_counts' in body.overrides) {
      const value = body.overrides.outfit_occasion_counts;
      if (value === null) delete nextOverrides.outfit_occasion_counts;
      else {
        const counts = parseOccasionCounts(value, STYLIST_BLUEPRINT_OUTFIT_COUNT);
        if (!counts) return NextResponse.json({ error: `Outfits per occasion must add up to ${STYLIST_BLUEPRINT_OUTFIT_COUNT}.` }, { status: 400 });
        nextOverrides.outfit_occasion_counts = counts;
      }
    }
    const { data, error } = await supabaseAdmin
      .from('stylist_intake_responses')
      .update({ ...patch, workspace_overrides: nextOverrides, updated_at: new Date().toISOString() })
      .eq('id', intake.id)
      .eq('assigned_stylist_id', identity.stylistId)
      .select('*')
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message || 'Save failed' }, { status: 500 });
    await logStylistReportActivity({ action: 'consultation_overrides_saved', consultationId, stylistId: identity.stylistId });
    return NextResponse.json({ intake: data });
  }
  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
