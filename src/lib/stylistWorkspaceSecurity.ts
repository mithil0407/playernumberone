/** Shared by the edge gate and its regression tests; no credentials or Node APIs. */
export function isStylistWorkspacePage(pathname: string) {
  return /^\/stylist\/[^/]+\/(?:dashboard|consultations|reports)(?:\/|$)/.test(pathname);
}

export function isStylistPrivatePath(pathname: string) {
  return isStylistWorkspacePage(pathname)
    || /^\/stylist\/(?:login|admin|report|edit)(?:\/|$)/.test(pathname)
    || /^\/api\/(?:stylist-workspace|stylist-blueprint)(?:\/|$)/.test(pathname);
}

export function isCrossOriginWorkspaceMutation(method: string, headers: Headers, requestUrl: string) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return false;
  if (headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = headers.get('origin');
  // Worker and other server-to-server calls have no Origin. Their endpoint's
  // own authentication still applies; browser requests must match exactly.
  if (!origin) return false;
  try { return new URL(origin).origin !== new URL(requestUrl).origin; }
  catch { return true; }
}

export const WORKSPACE_SECURITY_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
};
