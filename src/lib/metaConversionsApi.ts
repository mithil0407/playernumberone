import 'server-only';

import crypto from 'crypto';
import { META_PIXEL_ID } from './metaPixel';
import type { AttributionFields } from './attribution';

type MetaCurrency = 'INR' | 'USD' | 'AUD' | 'AED';

interface MetaPurchaseInput {
  eventId: string;
  eventSourceUrl?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  amount: number;
  currency: MetaCurrency;
  contentName: string;
  contentIds: string[];
  numItems: number;
  attribution?: AttributionFields | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

function sha256(value?: string | null) {
  const cleaned = value?.trim().toLowerCase();
  if (!cleaned) return undefined;
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

function digitsOnly(value?: string | null) {
  const digits = value?.replace(/\D/g, '');
  return digits || undefined;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const userData: Record<string, string | undefined> = {
      em: sha256(input.customerEmail),
      ph: sha256(digitsOnly(input.customerPhone)),
      client_ip_address: input.ipAddress || undefined,
      client_user_agent: input.userAgent || undefined,
      fbp: getPayloadValue(input.attribution, 'fbp'),
      fbc: getPayloadValue(input.attribution, 'fbc'),
    };

    const response = await fetch(`https://graph.facebook.com/${resolveGraphApiVersion()}/${META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: input.eventId,
            action_source: 'website',
            event_source_url: input.eventSourceUrl || input.attribution?.landing_page || 'https://www.iconik.pro/man/checkout',
            user_data: Object.fromEntries(Object.entries(userData).filter(([, value]) => value)),
            custom_data: {
              currency: input.currency,
              value: input.amount,
              content_name: input.contentName,
              content_ids: input.contentIds,
              content_type: 'product',
              num_items: input.numItems,
              content_category: 'Man Funnel',
            },
          },
        ],
        ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Meta CAPI Purchase failed:', response.status, text);
    }
  } catch (error) {
    console.error('Meta CAPI Purchase unavailable:', error);
  } finally {
    clearTimeout(timeout);
  }
}
