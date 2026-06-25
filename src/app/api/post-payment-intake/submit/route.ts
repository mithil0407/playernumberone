import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  POST_PAYMENT_INTAKE_BUCKET,
  assertPendingIntakePhotosExist,
  assertPostPaymentIntakePhotoType,
  savePendingCrmIntake,
  verifyPostPaymentIntakeAccess,
  type PostPaymentIntakePhotoType,
} from '@/lib/postPaymentIntake';

const REQUIRED_PHOTOS: PostPaymentIntakePhotoType[] = ['full_front', 'headshot', 'side_profile'];

function getRequiredNumber(measurements: Record<string, unknown>, key: string): number {
  const raw = String(measurements[key] || '').trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${key}`);
  return value;
}

function getRequiredPhoto(
  photos: Record<string, unknown>,
  key: PostPaymentIntakePhotoType,
  pendingIntakeId: string,
): { bucket: string; path: string } {
  const value = photos[key];
  if (!value || typeof value !== 'object') throw new Error(`Missing ${key} image upload`);

  const photo = value as { bucket?: unknown; path?: unknown };
  const bucket = String(photo.bucket || '');
  const path = String(photo.path || '');
  const expectedPrefix = `post-payment-intakes/${pendingIntakeId}/`;

  assertPostPaymentIntakePhotoType(key);
  if (bucket !== POST_PAYMENT_INTAKE_BUCKET) throw new Error(`Invalid ${key} image bucket`);
  if (!path.startsWith(expectedPrefix)) throw new Error(`Invalid ${key} image path`);
  if (!path.includes(`_${key}.`)) throw new Error(`Invalid ${key} image name`);

  return { bucket, path };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '');
    const paymentId = String(body.payment_id || '');
    const pendingIntakeId = String(body.pending_intake_id || '');

    const row = await verifyPostPaymentIntakeAccess({ token, paymentId });

    if (!pendingIntakeId) throw new Error('Missing pending intake ID');

    const rawMeasurements = body.measurements && typeof body.measurements === 'object'
      ? body.measurements as Record<string, unknown>
      : {};
    const unit = String(rawMeasurements.unit || 'in') === 'cm' ? 'cm' : 'in';
    const measurements = {
      unit,
      chest: getRequiredNumber(rawMeasurements, 'chest'),
      waist: getRequiredNumber(rawMeasurements, 'waist'),
      shoulders: getRequiredNumber(rawMeasurements, 'shoulders'),
      hips: getRequiredNumber(rawMeasurements, 'hips'),
    };

    const rawPhotos = body.photos && typeof body.photos === 'object'
      ? body.photos as Record<string, unknown>
      : {};
    const photoPayload = REQUIRED_PHOTOS.reduce((acc, photoType) => {
      acc[photoType] = getRequiredPhoto(rawPhotos, photoType, pendingIntakeId);
      return acc;
    }, {} as Record<PostPaymentIntakePhotoType, { bucket: string; path: string }>);

    await assertPendingIntakePhotosExist(photoPayload);

    await savePendingCrmIntake({
      pendingIntakeId,
      row,
      measurements,
      photos: photoPayload,
      paymentId,
    });

    const submittedAt = new Date().toISOString();
    await supabaseAdmin
      .from('post_payment_intake_tokens')
      .update({
        razorpay_payment_id: paymentId,
        submitted_at: submittedAt,
      })
      .eq('id', row.id);

    return NextResponse.json({
      success: true,
      pending_intake_id: pendingIntakeId,
      submitted_at: submittedAt,
    });
  } catch (error) {
    console.error('Post-payment intake submit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not submit intake' },
      { status: 400 },
    );
  }
}
