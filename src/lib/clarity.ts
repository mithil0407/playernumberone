// Microsoft Clarity records sessions only on the paid-acquisition sales pages.
// This is an allowlist on purpose: intake (photos, body details), payment
// success, reports and every internal surface must never be recorded, and a
// new route should stay unrecorded until someone decides otherwise.

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'yq0tddvs1q';

export type ClarityFunnel = 'root' | 'offer-2699' | 'man';

const CLARITY_ROUTES: Array<{ pattern: RegExp; funnel: ClarityFunnel; step: 'landing' | 'checkout' }> = [
  { pattern: /^\/$/, funnel: 'root', step: 'landing' },
  { pattern: /^\/offer-2699\/checkout\/?$/, funnel: 'offer-2699', step: 'checkout' },
  { pattern: /^\/offer-2699(?:\/(?:modest|sleeves))?\/?$/, funnel: 'offer-2699', step: 'landing' },
  { pattern: /^\/man\/checkout\/?$/, funnel: 'man', step: 'checkout' },
  { pattern: /^\/man\/?$/, funnel: 'man', step: 'landing' },
];

export function clarityRouteFor(pathname: string | null | undefined) {
  if (!pathname) return null;
  const route = CLARITY_ROUTES.find(({ pattern }) => pattern.test(pathname));
  return route ? { funnel: route.funnel, step: route.step } : null;
}
