import { NextRequest, NextResponse } from 'next/server';
import {
  getManIntakeUploadStatuses,
  loadManIntakeUploadSession,
  readBearerToken,
} from '@/lib/manIntakeUploadSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await loadManIntakeUploadSession(
      typeof body.session_id === 'string' ? body.session_id : '',
      readBearerToken(request),
      { allowSubmitted: true },
    );
    return NextResponse.json({
      success: true,
      status: session.status,
      expires_at: session.expires_at,
      photos: await getManIntakeUploadStatuses(session),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not check photo uploads.';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
