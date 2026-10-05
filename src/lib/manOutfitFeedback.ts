import 'server-only';

import { supabaseAdmin } from './supabase';
import { MAN_OUTFIT_FEEDBACK_REASONS } from './manOutfitFeedbackReasons';

/**
 * Stylist 👍 / 👎 on Blueprint outfits (table man_outfit_feedback).
 *
 * Totals per library look tilt the picker for every later client; a 👎 on a
 * report also keeps that look out of the same client's future picks. Until
 * the migration has run every read returns nothing, so generation never
 * depends on it.
 */

export type ManOutfitVerdict = 'up' | 'down';

const REASON_IDS = new Set<string>(MAN_OUTFIT_FEEDBACK_REASONS.map(reason => reason.id));

export interface ManOutfitFeedbackRow {
  report_id: string;
  outfit_number: number;
  library_look_id: number | null;
  context: string | null;
  verdict: ManOutfitVerdict;
  reasons: string[];
  note: string | null;
  updated_at: string;
}

function missingTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === '42P01' || error.code === 'PGRST205' || /man_outfit_feedback/.test(error.message ?? '')));
}

/** Net 👍 minus 👎 per library look id, across every report. */
export async function loadManLookFeedbackTotals(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('man_outfit_feedback')
    .select('library_look_id, verdict')
    .not('library_look_id', 'is', null)
    .limit(20000);
  if (error) {
    if (!missingTable(error)) console.warn('[man-outfit-feedback] totals unavailable:', error.message);
    return {};
  }
  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = String(row.library_look_id);
    totals[key] = (totals[key] ?? 0) + (row.verdict === 'up' ? 1 : -1);
  }
  return totals;
}

export async function loadManReportOutfitFeedback(reportId: string): Promise<{ rows: ManOutfitFeedbackRow[]; available: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('man_outfit_feedback')
    .select('report_id, outfit_number, library_look_id, context, verdict, reasons, note, updated_at')
    .eq('report_id', reportId)
    .order('outfit_number');
  if (error) {
    if (!missingTable(error)) console.warn('[man-outfit-feedback] report feedback unavailable:', error.message);
    return { rows: [], available: !missingTable(error) };
  }
  return { rows: (data ?? []) as ManOutfitFeedbackRow[], available: true };
}

export async function saveManReportOutfitFeedback(input: {
  reportId: string;
  outfitNumber: number;
  verdict: ManOutfitVerdict | null;
  libraryLookId: number | null;
  context: string | null;
  reasons?: unknown;
  note?: unknown;
}): Promise<{ ok: true } | { ok: false; error: string; missingTable?: boolean }> {
  if (!input.verdict) {
    const { error } = await supabaseAdmin
      .from('man_outfit_feedback')
      .delete()
      .eq('report_id', input.reportId)
      .eq('outfit_number', input.outfitNumber);
    return error ? { ok: false, error: error.message, missingTable: missingTable(error) } : { ok: true };
  }
  const reasons = Array.isArray(input.reasons)
    ? [...new Set(input.reasons.filter((reason): reason is string => typeof reason === 'string' && REASON_IDS.has(reason)))]
    : [];
  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 500) || null : null;
  const { error } = await supabaseAdmin
    .from('man_outfit_feedback')
    .upsert({
      report_id: input.reportId,
      outfit_number: input.outfitNumber,
      library_look_id: input.libraryLookId,
      context: input.context,
      verdict: input.verdict,
      reasons: input.verdict === 'down' ? reasons : [],
      note,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'report_id,outfit_number' });
  return error ? { ok: false, error: error.message, missingTable: missingTable(error) } : { ok: true };
}

/** Outfit numbers the stylist marked 👎 on this report. */
export function downvotedOutfitNumbers(rows: ManOutfitFeedbackRow[]): number[] {
  return rows.filter(row => row.verdict === 'down').map(row => row.outfit_number);
}
