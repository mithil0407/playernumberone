import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'iconik_admin_auth';
// Cookie value = ICONIK_INTERNAL_SECRET, set on successful login
const SESSION_TOKEN = () => process.env.ICONIK_INTERNAL_SECRET!;

/** Check credentials against env vars. Returns true if valid. */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const validEmail    = process.env.ICONIK_ADMIN_EMAIL;
  const validPassword = process.env.ICONIK_ADMIN_PASSWORD;
  if (!validEmail || !validPassword) return false;
  return email === validEmail && password === validPassword;
}

/** Check if the request carries a valid admin session cookie. */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === SESSION_TOKEN();
}

/** Same check for use inside Route Handlers (cookies() is not available there). */
export function isAdminAuthenticatedFromCookieValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === SESSION_TOKEN();
}
