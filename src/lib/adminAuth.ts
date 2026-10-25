import type { NextRequest } from 'next/server';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ADMIN_COOKIE, adminSessionMessage, parseAdminSessionToken } from './adminSessionCore.ts';

export { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from './adminSessionCore.ts';

function sessionSecret() {
  return process.env.ICONIK_ADMIN_SESSION_SECRET || process.env.ICONIK_INTERNAL_SECRET;
}

export function createAdminSessionToken(now = Date.now()) {
  const secret = sessionSecret();
  if (!secret) throw new Error('Admin session secret is not configured');
  const issuedAt = Math.floor(now / 1000);
  const nonce = randomBytes(32).toString('base64url');
  const signature = createHmac('sha256', secret).update(adminSessionMessage(issuedAt, nonce)).digest('base64url');
  return `v1.${issuedAt}.${nonce}.${signature}`;
}

/** Check credentials against env vars. Returns true if valid. */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const validEmail    = process.env.ICONIK_ADMIN_EMAIL;
  const validPassword = process.env.ICONIK_ADMIN_PASSWORD;
  if (!validEmail || !validPassword) return false;
  if (typeof email !== 'string' || typeof password !== 'string') return false;
  const emailHash = createHash('sha256').update(email).digest();
  const expectedEmailHash = createHash('sha256').update(validEmail).digest();
  const passwordHash = createHash('sha256').update(password).digest();
  const expectedPasswordHash = createHash('sha256').update(validPassword).digest();
  return timingSafeEqual(emailHash, expectedEmailHash) && timingSafeEqual(passwordHash, expectedPasswordHash);
}

/** Check if the request carries a valid admin session cookie. */
export function isAdminAuthenticated(request: NextRequest): boolean {
  return isAdminAuthenticatedFromCookieValue(request.cookies.get(ADMIN_COOKIE)?.value);
}

/** Same check for use inside Route Handlers (cookies() is not available there). */
export function isAdminAuthenticatedFromCookieValue(cookieValue: string | undefined): boolean {
  const parsed = parseAdminSessionToken(cookieValue);
  const secret = sessionSecret();
  if (!parsed || !secret) return false;
  const expected = createHmac('sha256', secret).update(adminSessionMessage(parsed.issuedAt, parsed.nonce)).digest();
  const actual = Buffer.from(parsed.signature, 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
