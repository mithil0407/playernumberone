import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessConsultation, getStylistWorkspaceIdentity, logStylistReportActivity } from '@/lib/stylistWorkspaceAuth';
import {
  CONSULTATION_UPLOAD_BUCKET,
  consultationReadiness,
  loadConsultationSource,
  signedConsultationPhotoUrls,
} from '@/lib/stylistConsultationWorkspace';

export const maxDuration = 120;

const PHOTO_TYPES = ['headshot', 'full_body_front', 'full_body_side', 'one_outfit'] as const;
const MEASUREMENT_KEYS = ['shoulders', 'bust', 'chest', 'waist', 'hips'] as const;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

type PhotoType = typeof PHOTO_TYPES[number];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function storagePath(path: string) {
  return path.replace(/^\/+/, '').replace(new RegExp(`^${CONSULTATION_UPLOAD_BUCKET}/`), '');
}

function parseMeasurements(raw: FormDataEntryValue | null, existing: Record<string, unknown>) {
  if (typeof raw !== 'string') return existing;
  const incoming = record(JSON.parse(raw));
  const unit = incoming.unit === 'in' ? 'in' : 'cm';
  const next: Record<string, unknown> = { ...existing, unit };
  for (const key of MEASUREMENT_KEYS) {
    const value = incoming[key];
    if (value === '' || value === null || value === undefined) {
      delete next[key];
      continue;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > (unit === 'in' ? 120 : 300)) {
      throw new Error(`Enter a valid ${key} measurement`);
    }
    next[key] = Math.round(parsed * 10) / 10;
  }
  return next;
}

async function normalizePhoto(file: File) {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('Each image must be smaller than 15 MB');
  if (file.type && !file.type.startsWith('image/')) throw new Error('Only image files can be uploaded');
  try {
    return await sharp(Buffer.from(await file.arrayBuffer()), { failOn: 'error' })
      .rotate()
      .resize({ width: 2400, height: 3200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new Error(`“${file.name || 'Image'}” could not be read. Use JPG, PNG, WEBP, HEIC, or a WhatsApp image.`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> },
) {
  const { consultationId } = await params;
  const identity = await getStylistWorkspaceIdentity();
  if (!identity || !(await canAccessConsultation(consultationId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('consultation_upload_links')
      .select('id, photo_paths, measurements')
      .eq('consultation_id', consultationId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const oldPhotoPaths = Object.fromEntries(
      Object.entries(record(existing?.photo_paths)).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
    const nextPhotoPaths = { ...oldPhotoPaths };
    const nextMeasurements = parseMeasurements(form.get('measurements'), record(existing?.measurements));
    const uploadedPaths: string[] = [];
    const replacedPaths: string[] = [];
    const uploadedTypes: PhotoType[] = [];

    try {
      for (const photoType of PHOTO_TYPES) {
        const value = form.get(photoType);
        if (!(value instanceof File) || !value.size) continue;
        const image = await normalizePhoto(value);
        const path = `stylist-workspace/${consultationId}/${photoType}-${Date.now()}-${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from(CONSULTATION_UPLOAD_BUCKET)
          .upload(path, image, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        uploadedPaths.push(path);
        uploadedTypes.push(photoType);
        if (oldPhotoPaths[photoType]) replacedPaths.push(storagePath(oldPhotoPaths[photoType]));
        nextPhotoPaths[photoType] = path;
      }

      const now = new Date().toISOString();
      const payload = {
        photo_paths: nextPhotoPaths,
        measurements: nextMeasurements,
        updated_at: now,
      };
      const write = existing
        ? supabaseAdmin.from('consultation_upload_links').update(payload).eq('id', existing.id)
        : supabaseAdmin.from('consultation_upload_links').insert({
          consultation_id: consultationId,
          // Let Postgres apply its constrained 48-character secure hex-token default.
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ...payload,
        });
      const { error: saveError } = await write;
      if (saveError) throw new Error(saveError.message);
    } catch (error) {
      if (uploadedPaths.length) {
        await supabaseAdmin.storage.from(CONSULTATION_UPLOAD_BUCKET).remove(uploadedPaths);
      }
      throw error;
    }

    if (replacedPaths.length) {
      await supabaseAdmin.storage.from(CONSULTATION_UPLOAD_BUCKET).remove(replacedPaths);
    }

    const source = await loadConsultationSource(consultationId);
    if (!source) throw new Error('Consultation not found after saving inputs');
    const readiness = consultationReadiness(source);
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('consultations')
      .update(readiness.ready
        ? { images_received_at: now, updated_at: now }
        : { status: 'waiting_images', updated_at: now })
      .eq('id', consultationId)
      .eq('stylist_id', identity.stylistId);

    await logStylistReportActivity({
      action: 'consultation_inputs_saved_by_stylist',
      consultationId,
      stylistId: identity.stylistId,
      metadata: {
        uploaded_photo_types: uploadedTypes,
        measurements_updated: true,
        ready: readiness.ready,
        missing: readiness.missing,
      },
    });

    return NextResponse.json({
      success: true,
      readiness,
      measurements: source.upload?.measurements ?? {},
      photoUrls: await signedConsultationPhotoUrls(source.upload?.photo_paths ?? {}),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save client inputs' }, { status: 400 });
  }
}
