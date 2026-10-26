import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getStylistWorkspaceIdentity, getWorkspaceStylistBySlug, isAdminCookieAuthenticated, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { parseNewClientIntake } from '@/lib/stylistNewClientIntake';
import { isCrossOriginWorkspaceMutation } from '@/lib/stylistWorkspaceSecurity';

export async function POST(request: NextRequest) {
  if (isCrossOriginWorkspaceMutation('POST', request.headers, request.url)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  if (Number(request.headers.get('content-length') || 0) > 100_000) {
    return NextResponse.json({ error: 'The form is too large.' }, { status: 413 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json({ error: 'Send the form as JSON.' }, { status: 415 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid form');
  } catch {
    return NextResponse.json({ error: 'Invalid form.' }, { status: 400 });
  }
  const admin = await isAdminCookieAuthenticated();
  const identity = admin ? null : await getStylistWorkspaceIdentity();
  if (!admin && !identity) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  // A stylist's ID always comes from the verified session, never from the form.
  const stylist = admin && typeof body.stylistSlug === 'string'
    ? await getWorkspaceStylistBySlug(body.stylistSlug)
    : null;
  if (admin && !stylist) return NextResponse.json({ error: 'Select an active stylist.' }, { status: 400 });
  const stylistId = stylist?.id || identity!.stylistId;
  let intake;
  try {
    intake = parseNewClientIntake(body);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Check the form.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('consultations').insert({
    stylist_id: stylistId,
    client_name: intake.clientName,
    client_phone: intake.clientPhone,
    consultation_date: intake.consultationDate,
    status: 'waiting_images',
    client_data: intake.clientData,
  }).select('id').single();
  if (error || !data) {
    console.error('[stylist-workspace] new client insert failed', error);
    return NextResponse.json({ error: 'Could not save the client. Please retry.' }, { status: 500 });
  }
  clearWorkspaceQueueCache(stylistId);
  await logStylistReportActivity({ action: 'consultation_created', consultationId: data.id, stylistId });
  const { data: uploadLink } = await supabaseAdmin.from('consultation_upload_links')
    .select('token').eq('consultation_id', data.id).maybeSingle();
  const uploadTemplate = process.env.CONSULTATION_UPLOAD_URL_TEMPLATE?.trim();
  const uploadUrl = uploadTemplate && uploadLink?.token
    ? uploadTemplate.includes('{token}')
      ? uploadTemplate.replace('{token}', encodeURIComponent(uploadLink.token))
      : `${uploadTemplate.replace(/\/$/, '')}/${encodeURIComponent(uploadLink.token)}`
    : null;
  return NextResponse.json({ id: data.id, uploadUrl }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
