import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  savePendingCrmIntake,
  uploadPendingIntakePhotoToCrm,
  upsertPendingCrmIntakeShell,
  verifyPostPaymentIntakeAccess,
} from '@/lib/postPaymentIntake';

function getRequiredFile(formData: FormData, key: string): File {
  const value = formData.get(key);
  if (!(value instanceof File)) throw new Error(`Missing ${key}`);
  return value;
}

function getRequiredNumber(formData: FormData, key: string): number {
  const raw = String(formData.get(key) || '').trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${key}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = String(formData.get('token') || '');
    const paymentId = String(formData.get('payment_id') || '');

    const row = await verifyPostPaymentIntakeAccess({ token, paymentId });

    const unit = String(formData.get('unit') || 'in') === 'cm' ? 'cm' : 'in';
    const measurements = {
      unit,
      chest: getRequiredNumber(formData, 'chest'),
      waist: getRequiredNumber(formData, 'waist'),
      shoulders: getRequiredNumber(formData, 'shoulders'),
      hips: getRequiredNumber(formData, 'hips'),
    };

    const fullFront = getRequiredFile(formData, 'full_front');
    const headshot = getRequiredFile(formData, 'headshot');
    const sideProfile = getRequiredFile(formData, 'side_profile');

    const { pendingIntakeId } = await upsertPendingCrmIntakeShell(row, paymentId);
    const photos = await Promise.all([
      uploadPendingIntakePhotoToCrm({ pendingIntakeId, file: fullFront, photoType: 'full_front' }),
      uploadPendingIntakePhotoToCrm({ pendingIntakeId, file: headshot, photoType: 'headshot' }),
      uploadPendingIntakePhotoToCrm({ pendingIntakeId, file: sideProfile, photoType: 'side_profile' }),
    ]);

    const photoPayload = {
      full_front: photos[0],
      headshot: photos[1],
      side_profile: photos[2],
    };

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
