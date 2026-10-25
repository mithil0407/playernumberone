import { adminSessionMessage, parseAdminSessionToken } from './adminSessionCore.ts';

/** WebCrypto verifier for middleware's Edge runtime. */
export async function verifyAdminCookieEdge(token: string | undefined) {
  const parsed = parseAdminSessionToken(token);
  const secret = process.env.ICONIK_ADMIN_SESSION_SECRET || process.env.ICONIK_INTERNAL_SECRET;
  if (!parsed || !secret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const encoded = parsed.signature.replace(/-/g, '+').replace(/_/g, '/');
  const signature = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(adminSessionMessage(parsed.issuedAt, parsed.nonce)));
}
