import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticatedFromCookieValue, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

const PHOTO_BUCKET = 'man-intake-photos';
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function getExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/heic') return 'heic';
  if (file.type === 'image/heif') return 'heif';
  return 'jpg';
}

function getContentType(file: File): string {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return file.type;
  const ext = getExtension(file);
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return 'image/jpeg';
}

function validatePhoto(file: File, label: string): string | null {
  if (file.size === 0) return `${label} is empty. Upload a valid image file.`;
  if (file.size > MAX_PHOTO_BYTES) return `${label} must be 20MB or smaller.`;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const hasAllowedExt = !!ext && ALLOWED_EXTENSIONS.has(ext);
  const hasAllowedType = !!file.type && ALLOWED_MIME_TYPES.has(file.type);
  if (!hasAllowedExt && !hasAllowedType) {
    return `${label} must be a JPG, PNG, WEBP, HEIC, or HEIF image.`;
  }

  return null;
}

async function uploadSubmissionPhoto(submissionId: string, kind: 'fullbody' | 'headshot', file: File): Promise<string> {
  const ext = getExtension(file);
  const storagePath = `admin-backfill/${submissionId}/${kind}-${Date.now()}.${ext}`;
  const { data, error } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: getContentType(file),
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [submissionRes, reportsRes] = await Promise.all([
      supabaseAdmin
        .from('man_intake_submissions')
        .select('*')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('man_reports')
        .select('id, status, progress_stage, share_token, generated_at, sent_at, error_message, section_approvals, created_at')
        .eq('submission_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (submissionRes.error) {
      if (submissionRes.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw submissionRes.error;
    }

    return NextResponse.json({
      submission: submissionRes.data,
      reports: reportsRes.data ?? [],
    });
  } catch (err) {
    console.error('man-admin submission detail API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('man_intake_submissions')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      if (existingError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw existingError;
    }

    const formData = await request.formData();
    const fullBody = formData.get('photo_fullbody');
    const headshot = formData.get('photo_headshot');

    const fullBodyFile = fullBody instanceof File ? fullBody : null;
    const headshotFile = headshot instanceof File ? headshot : null;

    if (!fullBodyFile && !headshotFile) {
      return NextResponse.json({ error: 'Upload a full body photo, a headshot photo, or both.' }, { status: 400 });
    }

    const validationError =
      (fullBodyFile ? validatePhoto(fullBodyFile, 'Full body photo') : null) ||
      (headshotFile ? validatePhoto(headshotFile, 'Headshot photo') : null);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updates: Record<string, string> = {};

    if (fullBodyFile) {
      updates.photo_fullbody_url = await uploadSubmissionPhoto(id, 'fullbody', fullBodyFile);
    }

    if (headshotFile) {
      updates.photo_headshot_url = await uploadSubmissionPhoto(id, 'headshot', headshotFile);
    }

    const { data: submission, error: updateError } = await supabaseAdmin
      .from('man_intake_submissions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !submission) {
      return NextResponse.json({ error: updateError?.message ?? 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission });
  } catch (err) {
    console.error('man-admin submission photo upload API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
