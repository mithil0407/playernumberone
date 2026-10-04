// Pure helpers for Look Links — the personal page the agent sends instead of raw
// retailer URLs. Every product click goes through /go/<itemId>, which records the
// click-out and forwards to the retailer with tracking (and an affiliate wrapper
// when one is configured), so GMV the agent drives becomes measurable.

import { randomBytes } from 'node:crypto';

const SLUG_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/** 8 unambiguous characters: short enough to read, ~40 bits so links are not guessable. */
export function createLookSlug(bytes: Buffer = randomBytes(8)) {
  let slug = '';
  for (let index = 0; index < 8; index += 1) {
    slug += SLUG_ALPHABET[bytes[index] % SLUG_ALPHABET.length];
  }
  return slug;
}

export function isLookSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[2-9a-hjkmnp-z]{8}$/.test(value);
}

export const LOOK_EVENT_TYPES = ['view', 'like', 'dislike', 'save', 'unsave', 'click_out', 'share', 'vote'] as const;
export type LookEventType = typeof LOOK_EVENT_TYPES[number];

export function isLookEventType(value: unknown): value is LookEventType {
  return typeof value === 'string' && (LOOK_EVENT_TYPES as readonly string[]).includes(value);
}

/** Only https product pages on public hosts may be linked or browsed. */
export function isSafeRetailUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * The URL a client is forwarded to. UTM tags let retailers (and their affiliate
 * dashboards) attribute the sale; LOOK_AFFILIATE_URL_TEMPLATE, when set, wraps
 * the link in an affiliate network redirect, e.g.
 * https://linksredirect.com/?cid=XXXX&source=linkkit&url={url}
 */
export function decorateRetailUrl(
  value: string,
  context: { lookSlug: string; itemId: string },
  affiliateTemplate = process.env.LOOK_AFFILIATE_URL_TEMPLATE,
) {
  const url = new URL(value);
  url.searchParams.set('utm_source', 'iconik');
  url.searchParams.set('utm_medium', 'stylist_agent');
  url.searchParams.set('utm_campaign', `look_${context.lookSlug}`);
  url.searchParams.set('utm_content', context.itemId.slice(0, 8));
  const tracked = url.toString();
  const template = affiliateTemplate?.trim();
  if (!template || !template.includes('{url}')) return tracked;
  return template.replace('{url}', encodeURIComponent(tracked));
}

export function lookLinkUrl(slug: string, base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro') {
  return new URL(`/l/${slug}`, base).toString();
}

export function formatInr(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
