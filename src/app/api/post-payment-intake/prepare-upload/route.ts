import { NextRequest, NextResponse } from 'next/server';
import {
  assertPostPaymentIntakePhotoType,
  createPendingIntakePhotoUploadUrl,
  upsertPendingCrmIntakeShell,
  verifyPostPaymentIntakeAccess,
  type PostPaymentIntakePhotoType,
} from '@/lib/postPaymentIntake';

const REQUIRED_PHOTOS: PostPaymentIntakePhotoType[] = ['full_front', 'headshot', 'side_profile'];

type UploadRequestFile = {
  photo_type?: string;
  file_name?: string;
  content_type?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '');
    const paymentId = String(body.payment_id || '');
    const files = Array.isArray(body.files) ? body.files as UploadRequestFile[] : [];

    const row = await verifyPostPaymentIntakeAccess({ token, paymentId });

    const fileByType = new Map<PostPaymentIntakePhotoType, UploadRequestFile>();
    files.forEach((file) => {
      if (!file?.photo_type) return;
      const photoType = assertPostPaymentIntakePhotoType(file.photo_type);
      fileByType.set(photoType, file);
    });

    for (const photoType of REQUIRED_PHOTOS) {
      if (!fileByType.has(photoType)) throw new Error(`Missing ${photoType} image`);
    }

    const { pendingIntakeId } = await upsertPendingCrmIntakeShell(row, paymentId);

    const uploads = await Promise.all(REQUIRED_PHOTOS.map(async (photoType) => {
      const file = fileByType.get(photoType);
      const upload = await createPendingIntakePhotoUploadUrl({
        pendingIntakeId,
        photoType,
        fileName: file?.file_name || null,
        contentType: file?.content_type || null,
      });

      return {
        photo_type: photoType,
        bucket: upload.bucket,
        path: upload.path,
        signed_url: upload.signedUrl,
      };
    }));

    return NextResponse.json({
      success: true,
      pending_intake_id: pendingIntakeId,
      uploads,
    });
  } catch (error) {
    console.error('Post-payment intake prepare-upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not prepare uploads' },
      { status: 400 },
    );
  }
}
