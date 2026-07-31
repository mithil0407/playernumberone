import 'server-only';

import crypto from 'crypto';
import { META_PIXEL_ID } from './metaPixel';
import {
  buildMetaPurchaseServerIdentity,
  normalizeMetaEmail,
  normalizeMetaPhone,
  splitMetaName,
} from './metaTrackingContract';
import type { AttributionFields } from './attribution';

type MetaCurrency = 'INR' | 'USD' | 'AUD' | 'AED';

interface MetaPurchaseInput {
  eventId: string;
  eventSourceUrl?: string | null;
  /** Stable customer/order identifier. Meta's highest-weight non-PII matching key. */
  externalId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  /** ISO 3166-1 alpha-2, lower-cased by the hasher (e.g. 'in'). */
  countryCode?: string | null;
  /** Dialling code prefixed to 10-digit national numbers (e.g. '91'). */
  phoneCountryCode?: string | null;
  amount: number;
  currency: MetaCurrency;
  contentName: string;
  contentIds: string[];
  numItems: number;
  contentCategory?: string;
  attribution?: AttributionFields | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

const CAPI_TIMEOUT_MS = 5000;

function sha256(value?: string | null) {
  const cleaned = value?.trim().toLowerCase();
  if (!cleaned) return undefined;
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

function getPayloadValue(attribution: AttributionFields | null | undefined, key: 'fbp' | 'fbc') {
  const payload = attribution?.attribution_payload;
  const value = payload && typeof payload[key] === 'string' ? payload[key] : null;
  return value || undefined;
}

function resolveGraphApiVersion() {
  return process.env.META_GRAPH_API_VERSION || 'v24.0';
}

export async function sendMetaPurchaseEvent(input: MetaPurchaseInput) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('Skipping Meta CAPI Purchase: META_ACCESS_TOKEN is not configured.');
    return;
  }

  if (!input.eventId || !Number.isFinite(input.amount)) return;

  const { firstName, lastName } = splitMetaName(input.customerName);
  const userData: Record<string, string | undefined> = {
    em: sha256(normalizeMetaEmail(input.customerEmail)),
    ph: sha256(normalizeMetaPhone(input.customerPhone, input.phoneCountryCode ?? undefined)),
    fn: sha256(firstName),
    ln: sha256(lastName),
    country: sha256(input.countryCode),
    external_id: sha256(input.externalId),
    client_ip_address: input.ipAddress || undefined,
    client_user_agent: input.userAgent || undefined,
    fbp: getPayloadValue(input.attribution, 'fbp'),
    fbc: getPayloadValue(input.attribution, 'fbc'),
  };

  const body = JSON.stringify({
    data: [
      {
        ...buildMetaPurchaseServerIdentity(input.eventId),
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: input.eventSourceUrl || input.attribution?.landing_page || undefined,
        user_data: Object.fromEntries(Object.entries(userData).filter(([, value]) => value)),
        custom_data: {
          currency: input.currency,
          value: input.amount,
          content_name: input.contentName,
          content_ids: input.contentIds,
          content_type: 'product',
          num_items: input.numItems,
          content_category: input.contentCategory,
          order_id: input.externalId || undefined,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
    access_token: accessToken,
  });

  // A dropped Purchase cannot be recovered later, so retry once on a timeout,
  // a network error, or a 5xx. Retrying is safe: the event ID is the Razorpay
  // payment ID, so Meta deduplicates a delivered-but-unacknowledged send.
  const url = `https://graph.facebook.com/${resolveGraphApiVersion()}/${META_PIXEL_ID}/events`;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CAPI_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body,
      });

      if (response.ok) {
        // In Test Events mode surface Meta's acknowledgement, so a test run can
        // confirm the event was received rather than just that the POST left.
        if (process.env.META_TEST_EVENT_CODE) {
          const ack = await response.text().catch(() => '');
          console.log('Meta CAPI Purchase accepted:', input.eventId, ack);
        }
        return;
      }

      const text = await response.text().catch(() => '');
      // 4xx means the payload is wrong — retrying sends the same bad payload.
      if (response.status < 500) {
        console.error('Meta CAPI Purchase rejected:', response.status, text);
        return;
      }
      console.error(`Meta CAPI Purchase failed (attempt ${attempt}):`, response.status, text);
    } catch (error) {
      console.error(`Meta CAPI Purchase unavailable (attempt ${attempt}):`, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  console.error('Meta CAPI Purchase permanently failed for event', input.eventId);
}
