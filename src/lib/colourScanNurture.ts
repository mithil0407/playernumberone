// Lead nurture for the free colour scan: enrols each scanner when her result is
// ready, sends email 1 (the result) at once, and sends emails 2–6 from the cron.
// Scheduling rules are in colourScanNurtureModel.ts; the emails themselves are
// in colourScanNurtureEmails.ts. Nothing here may ever block the scan, so every
// entry point used by the scan swallows its own errors.

import 'server-only';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { getTransporter } from '@/lib/email';
import { findRecentPaidOrderId } from '@/lib/checkoutRecovery';
import { buildColourScanNurtureEmail } from '@/lib/colourScanNurtureEmails';
import {
  NURTURE_MAX_AGE_DAYS,
  NURTURE_STEPS,
  isPausedForCheckoutRecovery,
  isWithinNurtureSendingHours,
  nextNurtureStep,
  nurtureOfferUrl,
  nurtureOneClickUnsubscribeUrl,
  nurtureResultUrl,
  nurtureUnsubscribeUrl,
  shouldRestartNurture,
  type NurtureStep,
  type RecoveryOverlapState,
} from '@/lib/colourScanNurtureModel';
import { createScanAccessToken, normalizeScanEmail, type StyleScanAnalysisV1 } from '@/lib/styleScan';
import { SUPPORT_EMAIL } from '@/lib/siteFacts';

const TABLE = 'colour_scan_nurture';
const MAX_SENDS_PER_RUN = 25;
const RUN_TIME_BUDGET_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ColourScanNurtureRow {
  id: string;
  token: string;
  email: string;
  scan_id: string;
  first_name: string | null;
  upcoming: string | null;
  dress_code: string | null;
  emails_sent: number;
  enrolled_at: string;
  last_email_sent_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
}

const ROW_COLUMNS = 'id, token, email, scan_id, first_name, upcoming, dress_code, emails_sent, enrolled_at, last_email_sent_at, converted_at, unsubscribed_at';

function newToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function isNurtureToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32}$/.test(value);
}

function truncate(value: string | null | undefined, max: number) {
  return value ? value.slice(0, max) : null;
}

export interface EnrolColourScanInput {
  scanId: string;
  email: unknown;
  firstName?: string | null;
  upcoming?: string | null;
  dressCode?: string | null;
}

/**
 * One sequence per email. A repeat scan points the sequence at the newest
 * result; it only starts over once NURTURE_RESTART_AFTER_DAYS have passed.
 */
export async function enrolColourScanNurture(input: EnrolColourScanInput): Promise<{ ok: boolean; reason?: string }> {
  try {
    const email = normalizeScanEmail(input.email);
    if (!email) return { ok: false, reason: 'no_email' };
    const now = new Date();
    const nowIso = now.toISOString();
    const details = {
      scan_id: input.scanId,
      first_name: truncate(input.firstName ?? null, 60),
      upcoming: truncate(input.upcoming ?? null, 40),
      dress_code: truncate(input.dressCode ?? null, 40),
      updated_at: nowIso,
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: existing, error: readError } = await supabaseAdmin
        .from(TABLE)
        .select('id, emails_sent, enrolled_at, converted_at')
        .eq('email', email)
        .maybeSingle();
      if (readError) throw readError;

      if (!existing) {
        const { error } = await supabaseAdmin.from(TABLE).insert({ ...details, email, token: newToken(), enrolled_at: nowIso });
        // Two enrolments racing for a new email: the loser updates the winner's row.
        if (error?.code === '23505') continue;
        if (error) throw error;
        return { ok: true };
      }

      const update: Record<string, unknown> = { ...details };
      if (shouldRestartNurture(existing, now)) {
        Object.assign(update, {
          enrolled_at: nowIso,
          emails_sent: 0,
          last_email_sent_at: null,
          last_email_error: null,
          converted_at: null,
          converted_order_id: null,
          converted_after_emails: null,
        });
      }
      const { error } = await supabaseAdmin.from(TABLE).update(update).eq('id', existing.id);
      if (error) throw error;
      return { ok: true };
    }
    return { ok: false, reason: 'conflict' };
  } catch (error) {
    console.error('Colour scan nurture: enrol failed:', error);
    return { ok: false, reason: 'error' };
  }
}

async function loadColourProfile(scanId: string) {
  const { data } = await supabaseAdmin.from('style_scan_leads').select('scan_analysis').eq('id', scanId).maybeSingle();
  const analysis = data?.scan_analysis as StyleScanAnalysisV1 | null | undefined;
  return analysis?.colour ?? null;
}

type NurtureEmailRow = Pick<ColourScanNurtureRow, 'token' | 'email' | 'scan_id' | 'first_name' | 'upcoming' | 'dress_code'>;

export async function renderColourScanNurtureEmail(row: NurtureEmailRow, step: NurtureStep, colour?: StyleScanAnalysisV1['colour'] | null) {
  const scanToken = createScanAccessToken(row.scan_id);
  return buildColourScanNurtureEmail({
    step,
    firstName: row.first_name,
    colour: colour === undefined ? await loadColourProfile(row.scan_id) : colour,
    upcoming: row.upcoming,
    dressCode: row.dress_code,
    resultUrl: nurtureResultUrl(scanToken, step),
    offerUrl: nurtureOfferUrl(scanToken, step),
    unsubscribeUrl: nurtureUnsubscribeUrl(row.token),
  });
}

export async function sendColourScanNurtureEmail(
  row: NurtureEmailRow,
  step: NurtureStep,
  options: { to?: string; colour?: StyleScanAnalysisV1['colour'] | null } = {},
): Promise<{ ok: boolean; error?: string }> {
  try {
    const email = await renderColourScanNurtureEmail(row, step, options.colour);
    await getTransporter().sendMail({
      from: `"ICONIK Styling Team" <${process.env.GMAIL_USER}>`,
      to: options.to ?? row.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: {
        'List-Unsubscribe': `<${nurtureOneClickUnsubscribeUrl(row.token)}>, <mailto:${SUPPORT_EMAIL}?subject=Unsubscribe%20colour%20emails>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `colour-scan-${row.token}-${step}`,
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/** Claims the step (compare-and-set on emails_sent), sends it, and records any error. */
async function claimAndSend(row: ColourScanNurtureRow, step: NurtureStep): Promise<'sent' | 'failed' | 'skipped'> {
  const nowIso = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from(TABLE)
    .update({ emails_sent: step, last_email_sent_at: nowIso, updated_at: nowIso })
    .eq('id', row.id)
    .eq('emails_sent', step - 1)
    .is('converted_at', null)
    .is('unsubscribed_at', null)
    .select('id');
  if (claimError) throw claimError;
  if (!claimed?.length) return 'skipped';

  const sent = await sendColourScanNurtureEmail(row, step);
  await supabaseAdmin.from(TABLE).update({ last_email_error: sent.ok ? null : truncate(sent.error, 500) }).eq('id', row.id);
  if (!sent.ok) console.error(`Colour scan nurture: email ${step} failed for ${row.id}:`, sent.error);
  return sent.ok ? 'sent' : 'failed';
}

/**
 * Email 1 is her result, so it goes the moment the scan is ready rather than
 * waiting for the next cron tick. The cron picks it up if this fails.
 */
export async function deliverColourScanResultEmail(scanId: string): Promise<void> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from(TABLE)
      .select(ROW_COLUMNS)
      .eq('scan_id', scanId)
      .eq('emails_sent', 0)
      .is('unsubscribed_at', null)
      .is('converted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!row) return;
    await claimAndSend(row as ColourScanNurtureRow, 1);
  } catch (error) {
    console.error('Colour scan nurture: result email failed:', error);
  }
}

export async function markColourScanNurtureConverted(email: string, orderId: string | null) {
  const { data: row } = await supabaseAdmin.from(TABLE).select('id, emails_sent, converted_at').eq('email', email).maybeSingle();
  if (!row || row.converted_at) return;
  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from(TABLE)
    .update({ converted_at: nowIso, converted_order_id: orderId, converted_after_emails: row.emails_sent, updated_at: nowIso })
    .eq('id', row.id)
    .is('converted_at', null);
}

export async function unsubscribeColourScanNurture(token: unknown): Promise<boolean> {
  if (!isNurtureToken(token)) return false;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ unsubscribed_at: nowIso, updated_at: nowIso })
    .eq('token', token)
    .is('unsubscribed_at', null)
    .select('id');
  if (error) {
    console.error('Colour scan nurture: unsubscribe failed:', error);
    return false;
  }
  if (data?.length) return true;
  // Already unsubscribed still counts as success for the person clicking.
  const { data: existing } = await supabaseAdmin.from(TABLE).select('id').eq('token', token).maybeSingle();
  return Boolean(existing);
}

async function findRecoveryOverlap(email: string): Promise<RecoveryOverlapState | null> {
  const { data, error } = await supabaseAdmin
    .from('checkout_recoveries')
    .select('emails_sent, last_activity_at, converted_at, unsubscribed_at')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  return (data as RecoveryOverlapState | null) ?? null;
}

export interface ColourScanNurtureRunResult {
  quietHours: boolean;
  scanned: number;
  due: number;
  sent: number;
  failed: number;
  converted: number;
  paused: number;
  planned: Array<{ id: string; step: NurtureStep }>;
}

/**
 * One cron tick. Safe to run as often and as late as the scheduler likes: each
 * step is claimed with a compare-and-set before sending. Outside sending hours
 * only email 1 (her result) can go out.
 */
export async function runColourScanNurture({ now = new Date(), dryRun = false } = {}): Promise<ColourScanNurtureRunResult> {
  const startedAt = Date.now();
  const quietHours = !isWithinNurtureSendingHours(now);
  const result: ColourScanNurtureRunResult = { quietHours, scanned: 0, due: 0, sent: 0, failed: 0, converted: 0, paused: 0, planned: [] };

  let query = supabaseAdmin
    .from(TABLE)
    .select(ROW_COLUMNS)
    .is('converted_at', null)
    .is('unsubscribed_at', null)
    .lt('emails_sent', NURTURE_STEPS)
    .gte('enrolled_at', new Date(now.getTime() - NURTURE_MAX_AGE_DAYS * DAY_MS).toISOString())
    .order('enrolled_at', { ascending: true })
    .limit(300);
  if (quietHours && !dryRun) query = query.eq('emails_sent', 0);
  const { data: rows, error } = await query;
  if (error) throw error;

  for (const row of (rows ?? []) as ColourScanNurtureRow[]) {
    result.scanned++;
    const step = nextNurtureStep(row, now);
    if (!step) continue;
    result.due++;
    if (result.sent + result.failed >= MAX_SENDS_PER_RUN || Date.now() - startedAt > RUN_TIME_BUDGET_MS) continue;

    if (step > 1) {
      const paidOrderId = await findRecentPaidOrderId(row.email, now);
      if (paidOrderId) {
        if (!dryRun) await markColourScanNurtureConverted(row.email, paidOrderId);
        result.converted++;
        continue;
      }
      const recovery = await findRecoveryOverlap(row.email);
      if (recovery?.converted_at) {
        if (!dryRun) await markColourScanNurtureConverted(row.email, null);
        result.converted++;
        continue;
      }
      if (isPausedForCheckoutRecovery(recovery, now)) {
        result.paused++;
        continue;
      }
    }

    if (dryRun) {
      result.planned.push({ id: row.id, step });
      continue;
    }
    const outcome = await claimAndSend(row, step);
    if (outcome === 'sent') result.sent++;
    if (outcome === 'failed') result.failed++;
  }
  return result;
}
