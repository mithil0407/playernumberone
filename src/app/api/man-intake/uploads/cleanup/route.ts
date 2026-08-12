import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  MAN_INTAKE_PHOTO_BUCKET,
  isManIntakeSessionPhotoPath,
  type ManIntakeUploadManifest,
  type ManIntakeUploadManifestEntry,
} from '@/lib/manIntakeUploadSession';

async function cleanupExpiredSessions(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cleanup is not configured.' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sessions, error } = await supabaseAdmin
    .from('man_intake_upload_sessions')
    .select('id, photo_manifest')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Man intake upload cleanup query failed', { message: error.message });
    return NextResponse.json({ error: 'Could not load expired upload sessions.' }, { status: 500 });
  }

  let expired = 0;
  let removed = 0;
  const failures: string[] = [];

  for (const session of sessions || []) {
    const manifest = (session.photo_manifest || {}) as ManIntakeUploadManifest;
    const entries = Object.values(manifest).filter(Boolean) as ManIntakeUploadManifestEntry[];
    const paths = entries
      .map((entry) => entry.path)
      .filter((path) => isManIntakeSessionPhotoPath(session.id, path));

    if (paths.length > 0) {
      const removal = await supabaseAdmin.storage.from(MAN_INTAKE_PHOTO_BUCKET).remove(paths);
      if (removal.error) {
        failures.push(session.id);
        console.error('Man intake upload cleanup removal failed', {
          sessionId: session.id,
          count: paths.length,
          message: removal.error.message,
        });
        continue;
      }
      removed += paths.length;
    }

    const update = await supabaseAdmin.from('man_intake_upload_sessions').update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    }).eq('id', session.id).eq('status', 'active');
    if (update.error) {
      failures.push(session.id);
      continue;
    }
    expired++;
  }

  return NextResponse.json({
    success: failures.length === 0,
    processed: sessions?.length || 0,
    expired,
    removed,
    failed: failures.length,
  });
}

export async function GET(request: NextRequest) {
  return cleanupExpiredSessions(request);
}

export async function POST(request: NextRequest) {
  return cleanupExpiredSessions(request);
}
