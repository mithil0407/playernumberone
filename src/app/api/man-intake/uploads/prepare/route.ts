import { NextRequest, NextResponse } from 'next/server';
import { prepareManIntakeUploads, readBearerToken } from '@/lib/manIntakeUploadSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await prepareManIntakeUploads({
      sessionId: typeof body.session_id === 'string' ? body.session_id : undefined,
      token: readBearerToken(request) || undefined,
      files: Array.isArray(body.files) ? body.files : [],
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not prepare photo uploads.';
    const status = /credentials|expired|not found/i.test(message) ? 401 : 400;
    console.error('Man intake upload prepare failed', { message });
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
