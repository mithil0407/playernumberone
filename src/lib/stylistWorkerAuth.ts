import { timingSafeEqual } from 'node:crypto';

/**
 * Authorises calls to the report worker. The app's own hand-off sends a bearer
 * token; free schedulers cannot set headers, so `?key=` is accepted as well.
 */
export function isStylistWorkerRequestAuthorized(request: Request, secret = process.env.CRON_SECRET) {
  if (!secret) return false;
  const header = request.headers.get('authorization');
  const supplied = header ? header.replace(/^Bearer\s+/i, '') : new URL(request.url).searchParams.get('key') ?? '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
