// Abandoned-checkout recovery for the ₹2,699 Blueprint checkouts: records the
// lead, follows it through Razorpay, and sends the three reminder emails.
// Scheduling rules are in checkoutRecoveryModel.ts; the emails themselves are
// in checkoutRecoveryEmails.ts. Nothing here may ever block a checkout or a
// webhook, so every entry point used by those paths swallows its own errors.

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { getTransporter } from '@/lib/email';
import { buildCheckoutRecoveryEmail } from '@/lib/checkoutRecoveryEmails';
import {
  RECOVERY_MAX_AGE_DAYS,
  RECOVERY_STEP_DELAY_MINUTES,
  isWithinRecoverySendingHours,
  nextRecoveryStep,
  normaliseRecoveryEmail,
  normaliseRecoveryPhone,
  parseRecoveryAddons,
  parseRecoverySource,
  priceRecoveryCart,
  recoveryOneClickUnsubscribeUrl,
  recoveryResumeUrl,
  recoveryUnsubscribeUrl,
  shouldRestartRecovery,
  type CheckoutRecoveryStage,
  type CheckoutRecoveryStep,
} from '@/lib/checkoutRecoveryModel';
import { parseOfferTopicKey } from '@/lib/offerTopics';
import { SUPPORT_EMAIL } from '@/lib/siteFacts';

const TABLE = 'checkout_recoveries';
const MAX_SENDS_PER_RUN = 30;
const RUN_TIME_BUDGET_MS = 40_000;
const PAID_ORDER_LOOKBACK_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CheckoutRecoveryRow {
  id: string;
  token: string;
  email: string;
  phone: string | null;
  whatsapp_opt_in: boolean;
  checkout_source: string;
  topic: string | null;
  outfit_preview: boolean;
  wardrobe_detox: boolean;
  smart_shopper: boolean;
  base_price: number;
  amount: number;
  stage: CheckoutRecoveryStage;
  order_id: string | null;
  emails_sent: number;
  last_email_sent_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
  last_activity_at: string;
  resume_count: number;
}

export interface RecordCheckoutLeadInput {
  email: unknown;
  phone: unknown;
  whatsappOptIn?: unknown;
  checkoutSource: unknown;
  topic?: unknown;
  addons?: unknown;
  stage: 'details' | 'payment_opened';
  orderId?: string | null;
  attribution?: { utm_source?: string | null; utm_campaign?: string | null; landing_page?: string | null };
}

function newRecoveryToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function isRecoveryToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32}$/.test(value);
}

function truncate(value: string | null | undefined, max: number) {
  return value ? value.slice(0, max) : null;
}

/**
 * Upserts the lead for this email. A 'details' capture never downgrades a
 * lead that already reached payment; a converted or finished lead only starts
 * over once RECOVERY_RESTART_AFTER_DAYS have passed.
 */
export async function recordCheckoutLead(input: RecordCheckoutLeadInput): Promise<{ ok: boolean; reason?: string }> {
  try {
    const email = normaliseRecoveryEmail(input.email);
    const phone = normaliseRecoveryPhone(input.phone);
    const source = parseRecoverySource(input.checkoutSource);
    if (!email || !phone || !source) return { ok: false, reason: 'invalid' };

    const addons = parseRecoveryAddons(input.addons);
    const { basePrice, amount } = priceRecoveryCart(source, addons);
    const now = new Date();
    const nowIso = now.toISOString();
    const cart: Record<string, unknown> = {
      phone,
      whatsapp_opt_in: input.whatsappOptIn === true,
      checkout_source: source,
      topic: parseOfferTopicKey(typeof input.topic === 'string' ? input.topic : null) ?? null,
      outfit_preview: addons.outfitPreview,
      wardrobe_detox: addons.wardrobeDetox,
      smart_shopper: addons.smartShopper,
      base_price: basePrice,
      amount,
      last_activity_at: nowIso,
      updated_at: nowIso,
    };
    if (input.orderId) cart.order_id = input.orderId;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: existing, error: readError } = await supabaseAdmin
        .from(TABLE)
        .select('id, emails_sent, last_email_sent_at, converted_at')
        .eq('email', email)
        .maybeSingle();
      if (readError) throw readError;

      if (!existing) {
        const { error: insertError } = await supabaseAdmin.from(TABLE).insert({
          ...cart,
          token: newRecoveryToken(),
          email,
          stage: input.stage,
          utm_source: truncate(input.attribution?.utm_source, 200),
          utm_campaign: truncate(input.attribution?.utm_campaign, 200),
          landing_page: truncate(input.attribution?.landing_page, 500),
        });
        // Two captures racing for a new email: the loser updates the winner's row.
        if (insertError?.code === '23505') continue;
        if (insertError) throw insertError;
        return { ok: true };
      }

      const restart = shouldRestartRecovery(existing, now);
      if (existing.converted_at && !restart) return { ok: true, reason: 'converted' };

      const update: Record<string, unknown> = { ...cart };
      if (restart) {
        Object.assign(update, {
          stage: input.stage,
          emails_sent: 0,
          last_email_sent_at: null,
          last_email_error: null,
          converted_at: null,
          converted_order_id: null,
          converted_after_emails: null,
        });
      } else if (input.stage === 'payment_opened') {
        update.stage = 'payment_opened';
      }

      const { error: updateError } = await supabaseAdmin.from(TABLE).update(update).eq('id', existing.id);
      if (updateError) throw updateError;
      return { ok: true };
    }
    return { ok: false, reason: 'conflict' };
  } catch (error) {
    console.error('Checkout recovery: failed to record lead:', error);
    return { ok: false, reason: 'error' };
  }
}

/** Razorpay reported a failed payment: re-time the sequence from now and switch email 1's copy. */
export async function markCheckoutRecoveryPaymentFailed(orderId: string | null | undefined) {
  if (!orderId) return;
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({ stage: 'payment_failed', last_activity_at: nowIso, updated_at: nowIso })
      .eq('order_id', orderId)
      .is('converted_at', null);
    if (error) throw error;
  } catch (error) {
    console.error('Checkout recovery: failed to mark payment failed:', error);
  }
}

/** Stops the sequence and records how many recovery emails the buyer had received. */
export async function markCheckoutRecoveryConverted(emailValue: unknown, orderId: string | null | undefined) {
  const email = normaliseRecoveryEmail(emailValue);
  if (!email) return;
  try {
    const { data: row, error: readError } = await supabaseAdmin
      .from(TABLE)
      .select('id, emails_sent, converted_at')
      .eq('email', email)
      .maybeSingle();
    if (readError) throw readError;
    if (!row || row.converted_at) return;

    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({
        converted_at: nowIso,
        converted_order_id: orderId || null,
        converted_after_emails: row.emails_sent,
        updated_at: nowIso,
      })
      .eq('id', row.id)
      .is('converted_at', null);
    if (error) throw error;
  } catch (error) {
    console.error('Checkout recovery: failed to mark converted:', error);
  }
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Safety net for a missed webhook: a paid order for this email means no more emails. */
export async function findRecentPaidOrderId(email: string, now: Date): Promise<string | null> {
  const { data: customers, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .ilike('email', escapeLike(email))
    .limit(10);
  if (customerError) throw customerError;
  if (!customers?.length) return null;

  const { data: orders, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id')
    .in('customer_id', customers.map((customer) => customer.id))
    .in('status', ['paid', 'completed'])
    .gte('created_at', new Date(now.getTime() - PAID_ORDER_LOOKBACK_DAYS * DAY_MS).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);
  if (orderError) throw orderError;
  return orders?.[0]?.id ?? null;
}

export interface CheckoutRecoveryCart {
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  outfitPreview: boolean;
  wardrobeDetox: boolean;
  smartShopper: boolean;
}

/** Cookie that carries the resume token from the email link to the checkout's cart fetch. */
export const CHECKOUT_RECOVERY_COOKIE = 'iconik_checkout_recovery';

/** Where a resume link should land. Read-only, because mail scanners open every link. */
export async function findCheckoutRecoveryLink(token: unknown) {
  if (!isRecoveryToken(token)) return null;
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('token, checkout_source, topic')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return null;
  return data as { token: string; checkout_source: string; topic: string | null };
}

/**
 * The saved cart for the checkout to prefill. Only a real browser running the
 * checkout calls this, so it is where a resume is counted; it also counts as
 * fresh activity, which re-times the next email.
 */
export async function restoreCheckoutRecovery(token: unknown): Promise<CheckoutRecoveryCart | null> {
  if (!isRecoveryToken(token)) return null;
  const { data: row, error } = await supabaseAdmin
    .from(TABLE)
    .select('id, email, phone, whatsapp_opt_in, outfit_preview, wardrobe_detox, smart_shopper, resume_count, converted_at')
    .eq('token', token)
    .maybeSingle();
  if (error || !row) return null;

  if (!row.converted_at) {
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from(TABLE)
      .update({ resumed_at: nowIso, resume_count: (row.resume_count ?? 0) + 1, last_activity_at: nowIso, updated_at: nowIso })
      .eq('id', row.id);
  }

  return {
    email: row.email,
    phone: row.phone ?? '',
    whatsappOptIn: Boolean(row.whatsapp_opt_in),
    outfitPreview: Boolean(row.outfit_preview),
    wardrobeDetox: Boolean(row.wardrobe_detox),
    smartShopper: Boolean(row.smart_shopper),
  };
}

export async function unsubscribeCheckoutRecovery(token: unknown): Promise<boolean> {
  if (!isRecoveryToken(token)) return false;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ unsubscribed_at: nowIso, updated_at: nowIso })
    .eq('token', token)
    .is('unsubscribed_at', null)
    .select('id');
  if (error) {
    console.error('Checkout recovery: unsubscribe failed:', error);
    return false;
  }
  if (data?.length) return true;
  // Already unsubscribed still counts as success for the person clicking.
  const { data: existing } = await supabaseAdmin.from(TABLE).select('id').eq('token', token).maybeSingle();
  return Boolean(existing);
}

type RecoveryEmailRow = Pick<CheckoutRecoveryRow,
  'token' | 'email' | 'checkout_source' | 'topic' | 'stage' | 'outfit_preview' | 'wardrobe_detox' | 'smart_shopper' | 'base_price' | 'amount'>;

export function renderCheckoutRecoveryEmail(row: RecoveryEmailRow, step: CheckoutRecoveryStep) {
  return buildCheckoutRecoveryEmail({
    step,
    stage: row.stage,
    addons: { outfitPreview: row.outfit_preview, wardrobeDetox: row.wardrobe_detox, smartShopper: row.smart_shopper },
    basePrice: row.base_price,
    amount: row.amount,
    resumeUrl: recoveryResumeUrl(row, step),
    unsubscribeUrl: recoveryUnsubscribeUrl(row.token),
  });
}

export async function sendCheckoutRecoveryEmail(
  row: RecoveryEmailRow,
  step: CheckoutRecoveryStep,
  to: string = row.email,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const email = renderCheckoutRecoveryEmail(row, step);
    await getTransporter().sendMail({
      from: `"ICONIK Styling Team" <${process.env.GMAIL_USER}>`,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: {
        'List-Unsubscribe': `<${recoveryOneClickUnsubscribeUrl(row.token)}>, <mailto:${SUPPORT_EMAIL}?subject=Unsubscribe%20checkout%20reminders>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `checkout-recovery-${row.token}-${step}`,
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface CheckoutRecoveryRunResult {
  quietHours: boolean;
  scanned: number;
  due: number;
  sent: number;
  failed: number;
  converted: number;
  planned: Array<{ id: string; step: CheckoutRecoveryStep; stage: CheckoutRecoveryStage }>;
}

/**
 * One cron tick. Safe to run as often and as late as the scheduler likes:
 * each step is claimed with a compare-and-set on emails_sent before sending,
 * so an overlapping or repeated run cannot send the same email twice.
 */
export async function runCheckoutRecovery({ now = new Date(), dryRun = false } = {}): Promise<CheckoutRecoveryRunResult> {
  const startedAt = Date.now();
  const result: CheckoutRecoveryRunResult = {
    quietHours: !isWithinRecoverySendingHours(now),
    scanned: 0,
    due: 0,
    sent: 0,
    failed: 0,
    converted: 0,
    planned: [],
  };
  if (result.quietHours && !dryRun) return result;

  const { data: rows, error } = await supabaseAdmin
    .from(TABLE)
    .select('id, token, email, checkout_source, topic, stage, outfit_preview, wardrobe_detox, smart_shopper, base_price, amount, emails_sent, last_email_sent_at, converted_at, unsubscribed_at, last_activity_at')
    .is('converted_at', null)
    .is('unsubscribed_at', null)
    .lt('emails_sent', 3)
    .gte('last_activity_at', new Date(now.getTime() - RECOVERY_MAX_AGE_DAYS * DAY_MS).toISOString())
    .lte('last_activity_at', new Date(now.getTime() - RECOVERY_STEP_DELAY_MINUTES[1] * 60 * 1000).toISOString())
    .order('last_activity_at', { ascending: true })
    .limit(200);
  if (error) throw error;

  for (const row of (rows ?? []) as CheckoutRecoveryRow[]) {
    result.scanned++;
    const step = nextRecoveryStep(row, now);
    if (!step) continue;
    result.due++;
    if (result.sent + result.failed >= MAX_SENDS_PER_RUN || Date.now() - startedAt > RUN_TIME_BUDGET_MS) continue;

    const paidOrderId = await findRecentPaidOrderId(row.email, now);
    if (paidOrderId) {
      if (!dryRun) await markCheckoutRecoveryConverted(row.email, paidOrderId);
      result.converted++;
      continue;
    }

    if (dryRun) {
      result.planned.push({ id: row.id, step, stage: row.stage });
      continue;
    }

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
    if (!claimed?.length) continue;

    const sent = await sendCheckoutRecoveryEmail(row, step);
    await supabaseAdmin
      .from(TABLE)
      .update({ last_email_error: sent.ok ? null : truncate(sent.error, 500) })
      .eq('id', row.id);
    if (sent.ok) result.sent++;
    else {
      result.failed++;
      console.error(`Checkout recovery: email ${step} failed for ${row.id}:`, sent.error);
    }
  }

  return result;
}

/** Free cron schedulers cannot always set headers, so the secret is also accepted as ?key=. */
export function isCheckoutRecoveryCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const key = new URL(request.url).searchParams.get('key') ?? '';
  const expected = Buffer.from(secret);
  return [bearer, key].some((candidate) => {
    const given = Buffer.from(candidate);
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}
