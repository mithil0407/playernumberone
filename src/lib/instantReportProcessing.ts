import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';
import { hashPrivateToken, type InstantReportRefinementV1, type StyleScanAnalysisV1, type StyleScanAnswersV1 } from '@/lib/styleScan';
import { generateEditorialOutfitVisual, generateInstantReportText, STYLE_SCAN_MODEL_METADATA } from '@/lib/styleScanGeneration';
import type { StylistBlueprintClassification } from '@/lib/stylistBlueprintGenerator';

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, task: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  }));
  return results;
}

export async function processInstantReportToken(token: string) {
  let reportId: string | null = null;
  try {
    const tokenHash = hashPrivateToken(token);
    const { data: report, error } = await supabaseAdmin.from('instant_reports')
      .select('id, status, scan_lead_id, intake_id, report_data, image_paths, attempt_count, max_attempts')
      .eq('access_token_hash', tokenHash).maybeSingle();
    if (error) throw error;
    if (!report) return { status: 'not_found' as const };
    reportId = report.id;
    if (['review_required', 'approved', 'published'].includes(report.status)) {
      return { status: report.status as 'review_required' | 'approved' | 'published' };
    }
    if (report.status === 'generating') return { status: 'generating' as const };
    if (report.status === 'failed' && Number(report.attempt_count || 0) >= Number(report.max_attempts || 4)) {
      return { status: 'manual_review_required' as const };
    }
    const claim = await supabaseAdmin.from('instant_reports').update({
      status: 'generating', progress_stage: 'generating_text', error_message: null,
      attempt_count: Number(report.attempt_count || 0) + 1, updated_at: new Date().toISOString(),
    }).eq('id', report.id).in('status', ['queued', 'failed']).select('id').maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) return { status: 'generating' as const };
    const [{ data: scan, error: scanError }, { data: intake, error: intakeError }] = await Promise.all([
      supabaseAdmin.from('style_scan_leads').select('scan_analysis, classification_payload, scan_answers').eq('id', report.scan_lead_id).single(),
      supabaseAdmin.from('instant_report_intakes').select('*').eq('id', report.intake_id).single(),
    ]);
    if (scanError || !scan) throw scanError || new Error('Style Scan unavailable');
    if (intakeError || !intake) throw intakeError || new Error('Refinement unavailable');
    const refinement: InstantReportRefinementV1 = {
      height: intake.height, sizeRange: intake.size_range, wardrobeMix: intake.wardrobe_mix,
      priorityContexts: intake.priority_contexts, footwearPreference: intake.footwear_preference,
      hardNos: intake.hard_nos || undefined, finalNote: intake.final_note || undefined,
    };
    const reportData = await generateInstantReportText({
      scan: scan.scan_analysis as StyleScanAnalysisV1,
      classification: scan.classification_payload as StylistBlueprintClassification,
      refinement,
      answers: scan.scan_answers as StyleScanAnswersV1,
    });
    await supabaseAdmin.from('instant_reports').update({
      report_data: reportData, progress_stage: 'generating_outfit_visuals', updated_at: new Date().toISOString(),
    }).eq('id', report.id);
    const imagePaths = await mapWithConcurrency(reportData.outfits, 2, (outfit, index) => generateEditorialOutfitVisual({
      ownerId: report.id, slot: `outfit-${String(index + 1).padStart(2, '0')}`, outfit, palette: reportData.palette.slice(0, 5),
    }));
    await supabaseAdmin.from('instant_reports').update({
      status: 'review_required', progress_stage: null, image_paths: { outfits: imagePaths },
      generation_model: `${STYLE_SCAN_MODEL_METADATA.text};${STYLE_SCAN_MODEL_METADATA.image}`,
      generation_version: 'instant-report-v1', updated_at: new Date().toISOString(),
    }).eq('id', report.id);
    return { status: 'review_required' as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instant report generation failed';
    console.error('[instant-report] process failed:', message);
    if (reportId) await supabaseAdmin.from('instant_reports').update({
      status: 'failed', progress_stage: null, error_message: message.slice(0, 800), updated_at: new Date().toISOString(),
    }).eq('id', reportId);
    return { status: 'failed' as const, error: message };
  }
}
