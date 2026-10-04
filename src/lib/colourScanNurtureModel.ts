// Pure rules for the free colour-scan nurture emails: who is due which email
// and when, and where each link points. Database and sending live in
// colourScanNurture.ts; the emails themselves in colourScanNurtureEmails.ts.

import { SITE_URL } from './siteFacts.ts';

export type NurtureStep = 1 | 2 | 3 | 4 | 5 | 6;
export const NURTURE_STEPS = 6;

/** Hours after the result was ready that each email becomes due. */
export const NURTURE_STEP_DELAY_HOURS: Record<NurtureStep, number> = {
  1: 0, // the result itself
  2: 24, // the colours dulling your face
  3: 72, // three outfits in your colours
  4: 120, // proof
  5: 168, // your occasion
  6: 240, // last note
};

/** Never two nurture emails closer together than this, even after a late cron. */
export const NURTURE_MIN_GAP_HOURS = 18;
/** Stop the sequence once the result is this old; a stalled cron must not send stale emails. */
export const NURTURE_MAX_AGE_DAYS = 21;
/** Someone who finished (or bought) and scans again this much later starts over. */
export const NURTURE_RESTART_AFTER_DAYS = 45;
/** Emails 2–6 only go out between these IST hours. Email 1 is the result she asked for, so it goes any time. */
export const NURTURE_SEND_HOURS_IST = { start: 8, end: 21 } as const;

export const NURTURE_UTM = {
  source: 'email',
  medium: 'colour_scan_nurture',
  campaign: 'colour_scan_nurture',
} as const;

export interface NurtureScheduleState {
  emails_sent: number;
  enrolled_at: string;
  last_email_sent_at: string | null;
  converted_at: string | null;
  unsubscribed_at: string | null;
}

/** The checkout-recovery row for the same email, if any. */
export interface RecoveryOverlapState {
  emails_sent: number;
  last_activity_at: string;
  converted_at: string | null;
  unsubscribed_at: string | null;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function istHour(now: Date): number {
  return new Date(now.getTime() + 330 * 60 * 1000).getUTCHours();
}

export function isWithinNurtureSendingHours(now: Date): boolean {
  const hour = istHour(now);
  return hour >= NURTURE_SEND_HOURS_IST.start && hour < NURTURE_SEND_HOURS_IST.end;
}

export function nextNurtureStep(row: NurtureScheduleState, now: Date): NurtureStep | null {
  if (row.converted_at || row.unsubscribed_at) return null;
  if (row.emails_sent >= NURTURE_STEPS) return null;
  const step = (row.emails_sent + 1) as NurtureStep;

  const enrolledAt = new Date(row.enrolled_at).getTime();
  if (!Number.isFinite(enrolledAt)) return null;
  const sinceEnrolled = now.getTime() - enrolledAt;
  if (sinceEnrolled > NURTURE_MAX_AGE_DAYS * DAY) return null;
  if (sinceEnrolled < NURTURE_STEP_DELAY_HOURS[step] * HOUR) return null;

  if (step > 1 && row.last_email_sent_at) {
    const sinceEmail = now.getTime() - new Date(row.last_email_sent_at).getTime();
    if (sinceEmail < NURTURE_MIN_GAP_HOURS * HOUR) return null;
  }
  return step;
}

/**
 * While the ₹2,699 checkout-recovery emails are running for the same person,
 * they own the inbox: nurture waits rather than sending two sales emails a day.
 */
export function isPausedForCheckoutRecovery(recovery: RecoveryOverlapState | null, now: Date): boolean {
  if (!recovery || recovery.converted_at || recovery.unsubscribed_at) return false;
  if (recovery.emails_sent >= 3) return false;
  const sinceActivity = now.getTime() - new Date(recovery.last_activity_at).getTime();
  return Number.isFinite(sinceActivity) && sinceActivity < 7 * DAY;
}

/** Whether a returning scanner's finished or converted sequence should start over. */
export function shouldRestartNurture(
  row: Pick<NurtureScheduleState, 'emails_sent' | 'enrolled_at' | 'converted_at'>,
  now: Date,
): boolean {
  const restartMs = NURTURE_RESTART_AFTER_DAYS * DAY;
  if (row.converted_at) return now.getTime() - new Date(row.converted_at).getTime() > restartMs;
  return now.getTime() - new Date(row.enrolled_at).getTime() > restartMs;
}

function withParams(path: string, params: Record<string, string>) {
  const url = new URL(path, SITE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function utm(step: NurtureStep) {
  return {
    utm_source: NURTURE_UTM.source,
    utm_medium: NURTURE_UTM.medium,
    utm_campaign: NURTURE_UTM.campaign,
    utm_content: `email_${step}`,
  };
}

/** Her private result page. The scan token is already how that page is reached. */
export function nurtureResultUrl(scanToken: string, step: NurtureStep): string {
  return withParams(`/style-scan/result/${encodeURIComponent(scanToken)}`, utm(step));
}

/** The ₹2,699 offer, linked to her scan so the checkout prefills her details. */
export function nurtureOfferUrl(scanToken: string, step: NurtureStep): string {
  return withParams('/offer-2699', { scan: scanToken, ...utm(step) });
}

export function nurtureUnsubscribeUrl(token: string): string {
  return withParams('/colour-scan/unsubscribe', { t: token });
}

/** RFC 8058 one-click target for the List-Unsubscribe-Post header. */
export function nurtureOneClickUnsubscribeUrl(token: string): string {
  return withParams('/api/colour-scan-nurture/unsubscribe', { t: token });
}

export function parseNurtureStep(value: unknown): NurtureStep | null {
  const step = Number(value);
  return Number.isInteger(step) && step >= 1 && step <= NURTURE_STEPS ? (step as NurtureStep) : null;
}
