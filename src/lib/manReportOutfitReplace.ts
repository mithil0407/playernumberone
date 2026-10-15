import 'server-only';

// Replaces some outfits in a Man report and leaves the rest exactly as they are
// (text, pictures, shopping links). Used by "Replace 👎 outfits" and by the
// admin's own picks of outfits to replace or rewrite.
//
//   replace: a new look for this slot (the old look is never picked again)
//   rewrite: the same look, written again (e.g. to fix its shoes), with an
//            optional instruction for the writer
//
// On a v5 report the head stylist chooses the new looks around the kept ones.

import { supabaseAdmin } from './supabase';
import {
  buildManBlueprintV2StructuredData,
  generateSection4AtQualityFloor,
  runSection5,
  type ReportData,
} from './manReportGenerator';
import type { ManIntakeSubmission } from './supabaseMan';
import type { ManReportImagePaths } from './manImageGenerator';
import { extractOutfitBlock, normaliseSequentialManOutfitNumbers, replaceOutfitBlock } from './manOutfitSection';
import { invalidateChangedOutfitImages } from './manOutfitConsistency';
import {
  MAN_OUTFIT_LIBRARY_PORTFOLIO_VERSION,
  getManOutfitLibraryVersion,
  type ManOutfitSelectionOverrides,
} from './manOutfitLibrary';
import { withManReportSection4Qa } from './manReportQa';
import { revalidateManReportCache } from './manReportCache';
import { markStaleShoppingSlots } from './manShoppingPipeline';

export interface ManOutfitReplaceRequest {
  replace: number[];
  rewrite?: number[];
  /** Outfit number → what the writer must fix when rewriting it. */
  fixNotes?: Record<string, string>;
}

export async function replaceManReportOutfits(reportId: string, request: ManOutfitReplaceRequest) {
  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('status, report_data, image_urls, submission_id, share_token')
    .eq('id', reportId)
    .single();
  if (error || !report) throw new Error('Report not found');
  const reportData = report.report_data as ReportData | null;
  const classification = reportData?.classification;
  if (!reportData || !classification) throw new Error('No report classification data found');
  const { data: submission, error: subErr } = await supabaseAdmin
    .from('man_intake_submissions').select('*').eq('id', report.submission_id).single();
  if (subErr || !submission) throw new Error('Submission not found');

  const assignments = reportData.outfit_library?.assignments ?? [];
  const replace = new Set(request.replace);
  const rewrite = new Set((request.rewrite ?? []).filter(number => !replace.has(number)));
  if (!replace.size && !rewrite.size) throw new Error('Choose at least one outfit to replace or rewrite.');
  const previous = reportData.outfit_library?.selectionProfile?.overrides ?? {};
  const excluded = [...new Set([
    ...(previous.excluded ?? []),
    ...assignments.filter(item => replace.has(item.outfitNumber)).map(item => item.libraryLookId),
  ])];
  const fixed = Object.fromEntries(assignments
    .filter(item => !replace.has(item.outfitNumber))
    .map(item => [String(item.outfitNumber), item.libraryLookId]));
  const keepNotes = Object.fromEntries(Object.entries(previous.stylistNotes ?? {}).filter(([slot]) => !replace.has(Number(slot))));
  const keepRoles = Object.fromEntries(Object.entries(previous.roles ?? {}).filter(([slot]) => !replace.has(Number(slot))));

  let overrides: ManOutfitSelectionOverrides = { excluded, pinned: fixed, roles: keepRoles, stylistNotes: keepNotes };
  if (replace.size && getManOutfitLibraryVersion(classification) === MAN_OUTFIT_LIBRARY_PORTFOLIO_VERSION) {
    try {
      const { runManHeadStylist } = await import('./manHeadStylist');
      const stylist = await runManHeadStylist(classification, new Date(), { excluded, fixed });
      overrides = {
        ...stylist.overrides,
        roles: { ...keepRoles, ...stylist.overrides.roles },
        stylistNotes: { ...keepNotes, ...stylist.overrides.stylistNotes },
      };
    } catch (err) {
      console.error(`[man-report] head stylist failed replacing outfits in ${reportId}; using the rule-based picks:`, err);
    }
  }
  if (request.fixNotes && Object.keys(request.fixNotes).length) overrides.fixNotes = request.fixNotes;

  const selectionSalt = reportData.outfit_library?.selectionProfile?.selectionSalt ?? '';
  const generated = await generateSection4AtQualityFloor(classification, submission as ManIntakeSubmission, '', selectionSalt, overrides);
  let newS4 = normaliseSequentialManOutfitNumbers(generated.section4);
  // Every outfit not being replaced or rewritten keeps its exact text (and so its picture).
  const previousS4 = reportData.sections?.s4_outfits ?? '';
  for (const item of assignments) {
    if (replace.has(item.outfitNumber) || rewrite.has(item.outfitNumber)) continue;
    const keptBlock = extractOutfitBlock(previousS4, item.outfitNumber);
    if (keptBlock) newS4 = replaceOutfitBlock(newS4, item.outfitNumber, keptBlock) ?? newS4;
  }
  const comboGridText = await runSection5(classification, submission as ManIntakeSubmission);

  const structured = buildManBlueprintV2StructuredData(classification, generated.selectionSalt, overrides);
  const nextReportData = withManReportSection4Qa({
    ...reportData,
    ...structured,
    classification,
    sections: { ...reportData.sections, s4_outfits: newS4, s4_combo_grids: comboGridText },
    generated_at: new Date().toISOString(),
    qa: { ...reportData.qa, section4: generated.qa },
  });
  const clearedImagePaths = invalidateChangedOutfitImages(report.image_urls as ManReportImagePaths | null, previousS4, newS4);
  const nextStatus = report.status === 'sent' ? 'in_review' : report.status;
  const updatedAt = new Date().toISOString();
  const { error: saveErr } = await supabaseAdmin
    .from('man_reports')
    .update({ report_data: nextReportData, image_urls: clearedImagePaths, status: nextStatus, progress_stage: null, error_message: null, updated_at: updatedAt })
    .eq('id', reportId);
  if (saveErr) throw new Error(saveErr.message);
  await revalidateManReportCache(reportId, report.share_token ?? null);
  await markStaleShoppingSlots(reportId, newS4);

  return {
    updatedS4Outfits: newS4,
    updatedComboGridText: comboGridText,
    qa: nextReportData.qa,
    status: nextStatus,
    updatedAt,
    clearedImageUrls: {
      outfitCards: clearedImagePaths.outfitCards,
      comboGridCards: clearedImagePaths.comboGridCards,
      deliverables: clearedImagePaths.deliverables,
    },
  };
}
