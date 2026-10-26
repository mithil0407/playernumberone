import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  CLIENT_UPLOAD_MAX_BYTES,
  clientUploadExists,
  clientUploadPathPattern,
  isClientUploadPhotoKey,
  loadClientUploadLink,
  prepareClientPhotoUpload,
} from '@/lib/consultationClientUpload';
import { CLIENT_UPLOAD_PHOTOS, parseClientMeasurements } from '@/lib/consultationMeasurements';
import { clearWorkspaceQueueCache } from '@/lib/stylistWorkspaceQueue';
import { logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import { isCrossOriginWorkspaceMutation } from '@/lib/stylistWorkspaceSecurity';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (isCrossOriginWorkspaceMutation('POST', request.headers, request.url)) return reply({ error: 'Invalid request origin.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 20_000) return reply({ error: 'Request too large.' }, 413);
  const { token } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return reply({ error: 'Invalid request.' }, 400);

  let link;
  try { link = await loadClientUploadLink(token); }
  catch { return reply({ error: 'Something went wrong. Please try again.' }, 500); }
  if (link.state === 'invalid') return reply({ error: 'This upload link is not valid.' }, 404);
  if (link.state === 'submitted') return reply({ error: 'Your photos and measurements are already submitted.' }, 409);
  if (link.state === 'expired') return reply({ error: 'This upload link has expired. Please message your stylist for a new one.' }, 410);

  if (body.action === 'prepare') {
    const size = Number(body.size);
    if (!isClientUploadPhotoKey(body.photo)) return reply({ error: 'Unknown photo.' }, 400);
    if (!Number.isFinite(size) || size <= 0 || size > CLIENT_UPLOAD_MAX_BYTES) return reply({ error: 'Each photo must be smaller than 10 MB.' }, 413);
    try {
      return reply(await prepareClientPhotoUpload(token, body.photo, String(body.contentType || '').toLowerCase()));
    } catch (error) {
      return reply({ error: error instanceof Error ? error.message : 'Could not prepare the upload.' }, 400);
    }
  }

  if (body.action === 'submit') {
    let measurements;
    try { measurements = parseClientMeasurements(body.measurements); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : 'Check your measurements.' }, 400); }
    const rawPaths = body.photoPaths && typeof body.photoPaths === 'object' && !Array.isArray(body.photoPaths) ? body.photoPaths as Record<string, unknown> : {};
    const photoPaths: Record<string, string> = {};
    for (const photo of CLIENT_UPLOAD_PHOTOS) {
      const path = rawPaths[photo.key];
      if (path === undefined || path === null || path === '') {
        if (photo.required) return reply({ error: `Add your ${photo.label.toLowerCase()}.` }, 400);
        continue;
      }
      if (typeof path !== 'string' || !clientUploadPathPattern(token, photo.key).test(path) || !(await clientUploadExists(token, path))) {
        return reply({ error: `Please upload your ${photo.label.toLowerCase()} again.` }, 400);
      }
      photoPaths[photo.key] = path;
    }
    // The database function locks the link and starts the report clock atomically.
    const { data, error } = await supabaseAdmin.rpc('submit_consultation_upload', {
      _token: token,
      _photo_paths: photoPaths,
      _measurements: measurements,
    });
    if (error) {
      console.error('[consultation-upload] submit failed', error.message);
      return reply({ error: /locked|expired/i.test(error.message) ? 'This link is no longer accepting changes.' : 'Could not submit. Please try again.' }, 409);
    }
    clearWorkspaceQueueCache(link.stylistId);
    await logStylistReportActivity({
      action: 'consultation_inputs_submitted_by_client',
      consultationId: link.consultationId,
      stylistId: link.stylistId,
      metadata: { photo_types: Object.keys(photoPaths), unit: measurements.unit },
    }).catch(() => undefined);
    const submittedAt = Array.isArray(data) ? data[0]?.submitted_at : null;
    return reply({ submittedAt: submittedAt || new Date().toISOString() });
  }

  return reply({ error: 'Unsupported action.' }, 400);
}
