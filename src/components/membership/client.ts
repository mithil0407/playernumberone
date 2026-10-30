// Browser helpers for the Style Membership funnel: storage that survives a
// reload, per-screen tracking (Meta Pixel + our own event log, both carrying
// first-touch attribution such as utm_content=reel_<id>), and Razorpay.

import { getAttributionPayload } from '@/lib/attribution';
import { META_PIXEL_ID } from '@/lib/metaPixel';
import { MEMBERSHIP_CONTENT_NAME, MEMBERSHIP_FUNNEL_CATEGORY } from '@/lib/styleMembershipConfig';

const KEYS = {
  session: 'sm_session',
  answers: 'sm_answers',
  lead: 'sm_lead_token',
  member: 'sm_member',
  mode: 'sm_mode',
} as const;

export function readStore<T>(key: keyof typeof KEYS, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(KEYS[key]);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore(key: keyof typeof KEYS, value: unknown) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(KEYS[key]);
    else window.localStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch {
    // Private mode: the funnel still works for this visit, it just won't survive a reload.
  }
}

export function sessionId() {
  let id = readStore<string | null>('session', null);
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    writeStore('session', id);
  }
  return id;
}

export function newEventId(name: string) {
  return `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type FbqParams = Record<string, string | number | boolean | string[] | undefined>;

function fbq(kind: 'track' | 'trackCustom', name: string, params: FbqParams, eventId: string) {
  try {
    const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.fbq as any)?.(kind, name, clean, { eventID: eventId });
  } catch {
    // The pixel is optional; our own event log still records the step.
  }
}

function beacon(body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.('/api/style-membership/event', new Blob([payload], { type: 'text/plain' }))) return;
  } catch {
    // Fall through to fetch.
  }
  void fetch('/api/style-membership/event', { method: 'POST', body: payload, keepalive: true }).catch(() => undefined);
}

function attributionSummary() {
  const attribution = getAttributionPayload();
  return {
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
  };
}

const viewed = new Set<string>();

/** One event per screen: a Meta custom event and a row in our own funnel log. */
export function trackScreen(screen: string, step: number, chapter: string | null, leadId?: string | null) {
  const key = `${screen}:${step}`;
  if (viewed.has(key)) return;
  viewed.add(key);
  const attribution = attributionSummary();
  fbq('trackCustom', 'StyleQuizScreen', {
    screen,
    step,
    chapter: chapter ?? 'none',
    content_category: MEMBERSHIP_FUNNEL_CATEGORY,
    utm_content: attribution.utm_content ?? undefined,
  }, newEventId(`StyleQuizScreen_${screen}`));
  beacon({ sessionId: sessionId(), leadId, event: 'screen_view', screen, step, attribution, props: { chapter } });
}

/** Key actions (answers, gate, selfie, plan picks, checkout) in our own log. */
export function trackAction(event: string, props: Record<string, unknown> = {}, leadId?: string | null) {
  beacon({ sessionId: sessionId(), leadId, event, screen: props.screen ?? null, attribution: attributionSummary(), props });
}

/** Lead at the WhatsApp gate; the server sends the same event ID by the Conversions API. */
export function trackLeadPixel(eventId: string) {
  fbq('track', 'Lead', { content_name: MEMBERSHIP_CONTENT_NAME, content_category: MEMBERSHIP_FUNNEL_CATEGORY }, eventId);
}

export function trackInitiateCheckoutPixel(eventId: string, params: FbqParams) {
  fbq('track', 'InitiateCheckout', params, eventId);
}

export function pixelId() {
  return META_PIXEL_ID;
}

export function attribution() {
  return getAttributionPayload();
}

export function tapFeedback() {
  try {
    navigator.vibrate?.(8);
  } catch {
    // Not supported (iOS Safari): the press animation is the feedback.
  }
}

// ── Razorpay ────────────────────────────────────────────────────────────────

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

type RazorpayInstance = { open: () => void; on: (event: string, handler: (response: unknown) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function razorpayConstructor() {
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}

let razorpayScript: Promise<void> | null = null;

export function loadRazorpay() {
  razorpayScript ??= new Promise<void>((resolve, reject) => {
    if (razorpayConstructor()) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScript = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return razorpayScript;
}

/** Opens Razorpay and resolves with its response, or rejects when she closes it or it fails. */
export async function openRazorpay(options: Record<string, unknown>): Promise<RazorpayResponse> {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const Checkout = razorpayConstructor();
    if (!Checkout) return reject(new Error('Could not load the payment window. Please try again.'));
    const instance = new Checkout({
      ...options,
      handler: (response: RazorpayResponse) => resolve(response),
      modal: { ondismiss: () => reject(new Error('dismissed')), confirm_close: true },
      theme: { color: '#1E1B18' },
    });
    instance.on('payment.failed', (response: unknown) => {
      const description = (response as { error?: { description?: string } })?.error?.description;
      reject(new Error(description || 'The payment didn’t go through. No money was taken.'));
    });
    instance.open();
  });
}

export async function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || 'Something went wrong. Please try again.') as Error & { code?: string; status?: number };
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data as T;
}
