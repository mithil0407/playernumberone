export const ADMIN_COOKIE = 'iconik_admin_auth';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export function adminSessionMessage(issuedAt: number, nonce: string) {
  return `iconik-admin-session:v1:${issuedAt}:${nonce}`;
}

export function parseAdminSessionToken(token: string | undefined, now = Date.now()) {
  const match = /^v1\.([1-9]\d{9})\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/.exec(token || '');
  if (!match) return null;
  const issuedAt = Number(match[1]);
  const currentSeconds = Math.floor(now / 1000);
  if (issuedAt > currentSeconds + 60 || issuedAt <= currentSeconds - ADMIN_SESSION_MAX_AGE_SECONDS) return null;
  return { issuedAt, nonce: match[2], signature: match[3] };
}
