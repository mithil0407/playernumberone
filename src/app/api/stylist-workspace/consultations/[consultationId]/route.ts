import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessConsultation, getStylistWorkspaceIdentity, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import {
  consultationReadiness,
  consultationIntakeDiff,
  consultationSourceToIntake,
  ensureConsultationIntake,
  loadConsultationSource,
  signedConsultationPhotoUrls,
} from '@/lib/stylistConsultationWorkspace';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity || !(await canAccessConsultation(consultationId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const source = await loadConsultationSource(consultationId);
  if (!source) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
  const readiness = consultationReadiness(source);
  const photoUrls = source.upload?.photo_paths
    ? await signedConsultationPhotoUrls(source.upload.photo_paths)
    : {};
  const { data: intake } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();
  const { data: uploadLinkRow } = await supabaseAdmin
    .from('consultation_upload_links')
    .select('token, expires_at')
    .eq('consultation_id', consultationId)
    .maybeSingle();
  const uploadTemplate = process.env.CONSULTATION_UPLOAD_URL_TEMPLATE?.trim();
  const uploadUrl = uploadTemplate && uploadLinkRow?.token
    ? (uploadTemplate.includes('{token}')
      ? uploadTemplate.replace('{token}', encodeURIComponent(uploadLinkRow.token))
      : `${uploadTemplate.replace(/\/$/, '')}/${encodeURIComponent(uploadLinkRow.token)}`)
    : null;
  const { data: reports } = intake?.id
    ? await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('id, status, progress_stage, error_message, section_approvals, published_at, delivered_at, created_at, updated_at')
      .eq('submission_id', intake.id)
      .order('created_at', { ascending: false })
    : { data: [] };
  return NextResponse.json({
    source,
    readiness,
    photoUrls,
    intake,
    reports: reports ?? [],
    uploadLink: uploadLinkRow ? { url: uploadUrl, expiresAt: uploadLinkRow.expires_at } : null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity || !(await canAccessConsultation(consultationId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
    const nextOverrides = { ...((intake.workspace_overrides as Record<string, unknown> | null) ?? {}), ...patch };
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
