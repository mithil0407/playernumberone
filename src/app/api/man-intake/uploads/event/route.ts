import { NextRequest, NextResponse } from 'next/server';
import {
  loadManIntakeUploadSession,
  readBearerToken,
  recordManIntakeUploadEvent,
} from '@/lib/manIntakeUploadSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await loadManIntakeUploadSession(
      typeof body.session_id === 'string' ? body.session_id : '',
      readBearerToken(request),
      { allowSubmitted: true },
    );
    await recordManIntakeUploadEvent({
      session,
      event: body.event,
      kind: body.kind,
      bytes: body.bytes,
      durationMs: body.duration_ms,
      attempt: body.attempt,
      errorCode: body.error_code,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not record upload event.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
