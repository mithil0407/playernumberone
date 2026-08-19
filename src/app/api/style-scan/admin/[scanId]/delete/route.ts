import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { STYLE_SCAN_PHOTO_BUCKET, STYLE_SCAN_RESULT_BUCKET } from '@/lib/styleScan';

function pathsFrom(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.values(value as Record<string, unknown>).flatMap(item => Array.isArray(item) ? item : [item]).filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { scanId } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.requestedBy !== 'string' || body.requestedBy.trim().length < 3 || body.identityVerified !== true) {
    return NextResponse.json({ error: 'Record who requested deletion and confirm identity verification.' }, { status: 400 });
  }
  const { data: scan, error } = await supabaseAdmin.from('style_scan_leads')
    .select('photo_paths, outfit_visual_path').eq('id', scanId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!scan) return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
  const { data: reports } = await supabaseAdmin.from('instant_reports').select('id, image_paths').eq('scan_lead_id', scanId);
  const photoPaths = pathsFrom(scan.photo_paths);
  const resultPaths = [scan.outfit_visual_path, ...(reports || []).flatMap(report => pathsFrom(report.image_paths))].filter((path): path is string => Boolean(path));
  if (photoPaths.length) await supabaseAdmin.storage.from(STYLE_SCAN_PHOTO_BUCKET).remove(photoPaths);
  if (resultPaths.length) await supabaseAdmin.storage.from(STYLE_SCAN_RESULT_BUCKET).remove(resultPaths);
  const now = new Date().toISOString();
  await supabaseAdmin.from('instant_reports').update({ status: 'deleted', report_data: null, image_paths: {}, access_token_hash: `deleted:${scanId}:${Date.now()}`, updated_at: now }).eq('scan_lead_id', scanId);
  await supabaseAdmin.from('style_scan_leads').update({
    scan_status: 'deleted', photo_paths: {}, outfit_visual_path: null, scan_analysis: null, classification_payload: null,
    scan_answers: {}, diagnosis_answers: null, result_token_hash: null, phone_e164: null, email: null, updated_at: now,
  }).eq('id', scanId);
  await supabaseAdmin.from('style_scan_deletion_audit').insert({
    scan_lead_id: scanId, requested_by: body.requestedBy.trim(), deleted_paths: [...photoPaths, ...resultPaths], retained_financial_records: true, completed_at: now,
  });
  return NextResponse.json({ success: true, deletedAssets: photoPaths.length + resultPaths.length, financialRecordsRetained: true });
}
