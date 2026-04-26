export interface AttributionFields {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  first_touch_at?: string | null;
  attribution_payload?: Record<string, unknown> | null;
}

const STORAGE_KEY = 'iconik_first_touch_attribution';
const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'referrer',
  'landing_page',
  'first_touch_at',
] as const;

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function cleanUrl(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  return cleaned.slice(0, 1000);
}

function cleanTimestamp(value: unknown) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  const time = new Date(cleaned).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function normalizeAttribution(input: unknown): AttributionFields {
  const source = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const normalized: AttributionFields = {
    utm_source: cleanText(source.utm_source),
    utm_medium: cleanText(source.utm_medium),
    utm_campaign: cleanText(source.utm_campaign),
    utm_term: cleanText(source.utm_term),
    utm_content: cleanText(source.utm_content),
    referrer: cleanUrl(source.referrer),
    landing_page: cleanUrl(source.landing_page),
    first_touch_at: cleanTimestamp(source.first_touch_at) ?? new Date().toISOString(),
  };

  normalized.attribution_payload = Object.fromEntries(
    ATTRIBUTION_KEYS.map(key => [key, normalized[key] ?? null])
  );

  return normalized;
}

export function attributionToColumns(input: unknown): Required<AttributionFields> {
  const normalized = normalizeAttribution(input);
  return {
    utm_source: normalized.utm_source ?? null,
    utm_medium: normalized.utm_medium ?? null,
    utm_campaign: normalized.utm_campaign ?? null,
    utm_term: normalized.utm_term ?? null,
    utm_content: normalized.utm_content ?? null,
    referrer: normalized.referrer ?? null,
    landing_page: normalized.landing_page ?? null,
    first_touch_at: normalized.first_touch_at ?? null,
    attribution_payload: normalized.attribution_payload ?? {},
  };
}

export function firstTouchAttribution(existing: unknown, incoming: unknown): Required<AttributionFields> {
  const current = attributionToColumns(existing);
  const next = attributionToColumns(incoming);
  const hasCurrentTouch = Boolean(
    current.utm_source ||
    current.utm_medium ||
    current.utm_campaign ||
    current.referrer ||
    current.landing_page
  );

  return hasCurrentTouch ? current : next;
}

export function attributionFromRow(row: Record<string, unknown> | null | undefined): Required<AttributionFields> {
  if (!row) return attributionToColumns(null);
  return attributionToColumns({
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_term: row.utm_term,
    utm_content: row.utm_content,
    referrer: row.referrer,
    landing_page: row.landing_page,
    first_touch_at: row.first_touch_at,
    attribution_payload: row.attribution_payload,
  });
}

export function getAttributionPayload(): Required<AttributionFields> {
  if (typeof window === 'undefined') return attributionToColumns(null);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return attributionToColumns(JSON.parse(stored));

    const params = new URLSearchParams(window.location.search);
    const payload = attributionToColumns({
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
      referrer: document.referrer || null,
      landing_page: window.location.href,
      first_touch_at: new Date().toISOString(),
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return attributionToColumns(null);
  }
}

export function captureAttribution() {
  return getAttributionPayload();
}

