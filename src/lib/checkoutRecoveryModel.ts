// Pure rules for the ₹2,699 abandoned-checkout recovery emails: who is due
// which email and when, what their saved order contains, and where each link
// points. Database and email sending live in checkoutRecovery.ts.

import {
  INDIA_BLUEPRINT_ADDON_PRICES,
  calculateIndiaBlueprintTotal,
  indiaBlueprintBasePriceForCheckout,
  type IndiaBlueprintCheckoutSource,
} from './indiaBlueprintPricing.ts';
import { offerCheckoutHref, parseOfferTopicKey } from './offerTopics.ts';
import { BLUEPRINT_OFFER, SITE_URL } from './siteFacts.ts';

export type CheckoutRecoveryStage = 'details' | 'payment_opened' | 'payment_failed';
export type CheckoutRecoveryStep = 1 | 2 | 3;

export const CHECKOUT_RECOVERY_SOURCES: readonly IndiaBlueprintCheckoutSource[] = ['offer_2699_checkout', 'root_checkout'];

/** Minutes after the lead's last checkout activity that each email becomes due. */
export const RECOVERY_STEP_DELAY_MINUTES: Record<CheckoutRecoveryStep, number> = {
  1: 60,
  2: 24 * 60,
  3: 72 * 60,
};

/** Never two recovery emails closer together than this, even after a late cron. */
export const RECOVERY_MIN_GAP_MINUTES = 12 * 60;
/** A lead first seen longer ago than this is too cold to start emailing. */
export const RECOVERY_START_WINDOW_HOURS = 48;
/** Stop the sequence entirely once the last checkout activity is this old. */
export const RECOVERY_MAX_AGE_DAYS = 7;
/** A finished (or converted) lead who comes back after this long starts a fresh sequence. */
export const RECOVERY_RESTART_AFTER_DAYS = 30;
/** Emails only go out between these IST hours (start inclusive, end exclusive). */
export const RECOVERY_SEND_HOURS_IST = { start: 8, end: 21 } as const;

export const RECOVERY_UTM = {
  source: 'email',
  medium: 'checkout_recovery',
  campaign: 'offer_2699_recovery',
} as const;

export interface RecoveryAddons {
  outfitPreview: boolean;
  wardrobeDetox: boolean;
  smartShopper: boolean;
}

export interface RecoveryScheduleState {
  emails_sent: number;
  last_activity_at: string;
  last_email_sent_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
}

export interface RecoveryLinkState {
  token: string;
  checkout_source: string;
  topic: string | null;
}

const MINUTE = 60 * 1000;

export function normaliseRecoveryEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** Indian mobile numbers only, as the checkout collects them: 10 digits starting 6–9. */
export function normaliseRecoveryPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(phone) ? phone : null;
}

export function parseRecoverySource(value: unknown): IndiaBlueprintCheckoutSource | null {
  return CHECKOUT_RECOVERY_SOURCES.find((source) => source === value) ?? null;
}

export function parseRecoveryAddons(value: unknown): RecoveryAddons {
  const addons = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    outfitPreview: addons.outfit_preview === true || addons.outfitPreview === true,
    wardrobeDetox: addons.wardrobe_detox === true || addons.wardrobeDetox === true,
    smartShopper: addons.smart_shoppers_guide === true || addons.smartShopper === true,
  };
}

/** Prices always come from the server's price list, never from the browser. */
export function priceRecoveryCart(source: IndiaBlueprintCheckoutSource, addons: RecoveryAddons) {
  const basePrice = indiaBlueprintBasePriceForCheckout(source);
  return { basePrice, amount: calculateIndiaBlueprintTotal(basePrice, addons) };
}

export interface RecoveryLineItem {
  label: string;
  price: number;
}

export function recoveryAddonLines(addons: RecoveryAddons): RecoveryLineItem[] {
  const lines: RecoveryLineItem[] = [];
  if (addons.outfitPreview) lines.push({ label: 'AI Outfit Preview', price: INDIA_BLUEPRINT_ADDON_PRICES.outfitPreview });
  if (addons.wardrobeDetox) lines.push({ label: 'Wardrobe Detox', price: INDIA_BLUEPRINT_ADDON_PRICES.wardrobeDetox });
  if (addons.smartShopper) lines.push({ label: "Smart Shopper's Guide", price: INDIA_BLUEPRINT_ADDON_PRICES.smartShopper });
  return lines;
}

/** Hour of the day in India (IST has no daylight saving). */
export function istHour(now: Date): number {
  return new Date(now.getTime() + 330 * MINUTE).getUTCHours();
}

export function isWithinRecoverySendingHours(now: Date): boolean {
  const hour = istHour(now);
  return hour >= RECOVERY_SEND_HOURS_IST.start && hour < RECOVERY_SEND_HOURS_IST.end;
}

/**
 * The email this lead should get now, or null. Delays count from the latest
 * checkout activity, so someone who comes back and leaves again is re-timed
 * rather than chased on the old clock.
 */
export function nextRecoveryStep(row: RecoveryScheduleState, now: Date): CheckoutRecoveryStep | null {
  if (row.converted_at || row.unsubscribed_at) return null;
  if (row.emails_sent >= 3) return null;
  const step = (row.emails_sent + 1) as CheckoutRecoveryStep;

  const activityAt = new Date(row.last_activity_at).getTime();
  if (!Number.isFinite(activityAt)) return null;
  const sinceActivity = now.getTime() - activityAt;

  if (sinceActivity > RECOVERY_MAX_AGE_DAYS * 24 * 60 * MINUTE) return null;
  if (step === 1 && sinceActivity > RECOVERY_START_WINDOW_HOURS * 60 * MINUTE) return null;
  if (sinceActivity < RECOVERY_STEP_DELAY_MINUTES[step] * MINUTE) return null;

  if (row.last_email_sent_at) {
    const sinceEmail = now.getTime() - new Date(row.last_email_sent_at).getTime();
    if (sinceEmail < RECOVERY_MIN_GAP_MINUTES * MINUTE) return null;
  }

  return step;
}

/** Whether a returning lead's finished or converted sequence should start over. */
export function shouldRestartRecovery(
  row: Pick<RecoveryScheduleState, 'emails_sent' | 'last_email_sent_at' | 'converted_at'>,
  now: Date,
): boolean {
  const restartMs = RECOVERY_RESTART_AFTER_DAYS * 24 * 60 * MINUTE;
  if (row.converted_at) return now.getTime() - new Date(row.converted_at).getTime() > restartMs;
  if (row.emails_sent >= 3 && row.last_email_sent_at) {
    return now.getTime() - new Date(row.last_email_sent_at).getTime() > restartMs;
  }
  return false;
}

function withRecoveryParams(path: string, params: Record<string, string>) {
  const url = new URL(path, SITE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

/**
 * The link in the email. It lands on an API route that stashes the token in a
 * short-lived cookie and redirects, so the token never sits in a page URL that
 * the Meta pixel reports as event_source_url.
 */
export function recoveryResumeUrl(row: RecoveryLinkState, step: CheckoutRecoveryStep): string {
  return withRecoveryParams('/api/checkout-recovery/resume', { t: row.token, step: String(step) });
}

/** Back to the same checkout they left; `restore=1` tells it to load the saved cart. */
export function recoveryCheckoutUrl(row: Omit<RecoveryLinkState, 'token'>, step: CheckoutRecoveryStep | null): string {
  const path = row.checkout_source === 'root_checkout'
    ? '/checkout'
    : offerCheckoutHref(parseOfferTopicKey(row.topic) ?? 'general');
  return withRecoveryParams(path, {
    restore: '1',
    utm_source: RECOVERY_UTM.source,
    utm_medium: RECOVERY_UTM.medium,
    utm_campaign: RECOVERY_UTM.campaign,
    ...(step ? { utm_content: `email_${step}` } : {}),
  });
}

export function parseRecoveryStep(value: unknown): CheckoutRecoveryStep | null {
  return value === '1' || value === '2' || value === '3' ? (Number(value) as CheckoutRecoveryStep) : null;
}

export function recoveryUnsubscribeUrl(token: string): string {
  return withRecoveryParams('/checkout-recovery/unsubscribe', { t: token });
}

/** RFC 8058 one-click target for the List-Unsubscribe-Post header. */
export function recoveryOneClickUnsubscribeUrl(token: string): string {
  return withRecoveryParams('/api/checkout-recovery/unsubscribe', { t: token });
}

export function recoveryReferencePrice(): number {
  return BLUEPRINT_OFFER.referencePriceInr;
}
