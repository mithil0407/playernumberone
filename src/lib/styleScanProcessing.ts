import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';
import {
  getStyleScanByToken, signedStorageUrl, STYLE_SCAN_PHOTO_BUCKET,
  validateStyleScanAnswers, type StyleScanAnswersV1,
} from '@/lib/styleScan';
import {
  generateEditorialOutfitVisual, generateStyleScanAnalysis, STYLE_SCAN_MODEL_METADATA,
} from '@/lib/styleScanGeneration';

export async function processStyleScanToken(token: string) {
  let scanId: string | null = null;
  try {
    const scan = await getStyleScanByToken(token, 'id, phone_e164, scan_status, scan_answers, photo_paths, generation_attempts');
    if (!scan) return { status: 'not_found' as const };
    scanId = scan.id;
    if (scan.scan_status === 'ready') return { status: 'ready' as const };
    if (scan.scan_status === 'failed' && Number(scan.generation_attempts || 0) >= 4) return { status: 'manual_review_required' as const };
    if (!['submitted', 'failed'].includes(scan.scan_status)) return { status: scan.scan_status as string };
    if (!validateStyleScanAnswers(scan.scan_answers)) throw new Error('Scan answers are incomplete');
    const photos = scan.photo_paths as Record<string, string>;
    const claim = await supabaseAdmin.from('style_scan_leads').update({
      scan_status: 'analyzing', error_message: null, generation_attempts: Number(scan.generation_attempts || 0) + 1, updated_at: new Date().toISOString(),
    }).eq('id', scan.id).in('scan_status', ['submitted', 'failed']).select('id').maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) return { status: 'analyzing' as const };
    const [headshotUrl, fullBodyUrl] = await Promise.all([
      signedStorageUrl(STYLE_SCAN_PHOTO_BUCKET, photos.headshot),
      signedStorageUrl(STYLE_SCAN_PHOTO_BUCKET, photos.full_body),
    ]);
    if (!headshotUrl || !fullBodyUrl) throw new Error('Required photos are unavailable');
    const { scan: analysis, classification } = await generateStyleScanAnalysis({
      scanId: scan.id, phone: scan.phone_e164, answers: scan.scan_answers as StyleScanAnswersV1, headshotUrl, fullBodyUrl,
    });
    if (analysis.confidence.overall < 0.5) {
      await supabaseAdmin.from('style_scan_leads').update({
        scan_status: 'retake_required', scan_analysis: analysis, classification_payload: classification,
        scan_confidence: analysis.confidence,
        retake_reason: 'We could not read your geometry or colouring confidently. Please replace both photos in brighter natural light with your full outline visible.',
        updated_at: new Date().toISOString(),
      }).eq('id', scan.id);
      return { status: 'retake_required' as const };
    }
    await supabaseAdmin.from('style_scan_leads').update({
      scan_status: 'generating_visual', scan_analysis: analysis, classification_payload: classification,
      scan_confidence: analysis.confidence, body_shape: analysis.geometry.shape,
      undertone: analysis.undertone.direction, updated_at: new Date().toISOString(),
    }).eq('id', scan.id);
    const visualPath = await generateEditorialOutfitVisual({
      ownerId: scan.id, slot: 'free-do', outfit: analysis.do, palette: classification.colour.base_palette.slice(0, 4),
    });
    await supabaseAdmin.from('style_scan_leads').update({
      scan_status: 'ready', outfit_visual_path: visualPath,
      generation_model: `${STYLE_SCAN_MODEL_METADATA.text};${STYLE_SCAN_MODEL_METADATA.image}`,
      generation_version: STYLE_SCAN_MODEL_METADATA.version, result_ready_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', scan.id);
    return { status: 'ready' as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan generation failed';
    console.error('[style-scan] processing failed:', message);
    if (scanId) await supabaseAdmin.from('style_scan_leads').update({
      scan_status: 'failed', retake_reason: null, error_message: message.slice(0, 500), updated_at: new Date().toISOString(),
    }).eq('id', scanId);
    return { status: 'failed' as const, error: message };
  }
}
