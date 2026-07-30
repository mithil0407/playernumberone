export interface MetaPageViewOptions {
  eventID: string;
}

export interface MetaPageViewTarget {
  fbq?: (
    command: 'track',
    eventName: 'PageView',
    parameters: Record<string, never>,
    options: MetaPageViewOptions,
  ) => void;
  __iconikLastMetaPageViewRoute?: string;
}

export type MetaPageViewResult =
  | { status: 'tracked'; routeKey: string; eventId: string }
  | { status: 'duplicate' | 'excluded' | 'unavailable'; routeKey: string };

const INTERNAL_PAGE_VIEW_PATTERNS = [
  /^\/dashboard(?:\/|$)/,
  /^\/(?:globe|man|stylist)\/admin(?:\/|$)/,
  /^\/iconik-club\/(?:admin|client)(?:\/|$)/,
  /^\/stylist\/login(?:\/|$)/,
  /^\/stylist\/[^/]+\/(?:dashboard|consultations|reports)(?:\/|$)/,
  /^\/(?:globe|man|stylist)\/report(?:\/|$)/,
  /^\/stylist\/edit(?:\/|$)/,
  /^\/iconik-club\/preview(?:\/|$)/,
];

function canonicalSearch(search: string) {
  const source = search.startsWith('?') ? search.slice(1) : search;
  if (!source) return '';

  const entries = Array.from(new URLSearchParams(source).entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => (
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    ));

  return new URLSearchParams(entries).toString();
}

export function buildMetaPageViewRouteKey(pathname: string, search = '') {
  const normalizedPathname = pathname || '/';
  const normalizedSearch = canonicalSearch(search);
  return normalizedSearch ? `${normalizedPathname}?${normalizedSearch}` : normalizedPathname;
}

export function isMetaPageViewExcluded(pathname: string) {
  return INTERNAL_PAGE_VIEW_PATTERNS.some((pattern) => pattern.test(pathname || '/'));
}

export function createMetaEventId(eventName: string) {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function trackMetaPageView(
  target: MetaPageViewTarget,
  pathname: string,
  search = '',
  createEventId: (eventName: string) => string = createMetaEventId,
): MetaPageViewResult {
  const routeKey = buildMetaPageViewRouteKey(pathname, search);

  if (target.__iconikLastMetaPageViewRoute === routeKey) {
    return { status: 'duplicate', routeKey };
  }

  // Store every observed route, including excluded routes. This lets a later
  // browser-history return to the prior public route generate a fresh PageView.
  target.__iconikLastMetaPageViewRoute = routeKey;

  if (isMetaPageViewExcluded(pathname)) {
    return { status: 'excluded', routeKey };
  }

  if (!target.fbq) {
    return { status: 'unavailable', routeKey };
  }

  const eventId = createEventId('PageView');
  target.fbq('track', 'PageView', {}, { eventID: eventId });
  if (typeof window !== 'undefined' && target === window) {
    console.log(`Meta Pixel: PageView tracked ${eventId}`);
  }
  return { status: 'tracked', routeKey, eventId };
}
