import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdminSessionToken, isAdminAuthenticatedFromCookieValue, verifyAdminCredentials } from './adminAuth.ts';
import { verifyAdminCookieEdge } from './adminAuthEdge.ts';
import { parseAdminSessionToken } from './adminSessionCore.ts';

test('admin session uses a signed, short-lived token instead of the shared secret', async () => {
  const previous = process.env.ICONIK_ADMIN_SESSION_SECRET;
  process.env.ICONIK_ADMIN_SESSION_SECRET = 'test-admin-session-key-with-enough-entropy';
  try {
    const token = createAdminSessionToken();
    const changedToken = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    assert.notEqual(token, process.env.ICONIK_ADMIN_SESSION_SECRET);
    assert.equal(isAdminAuthenticatedFromCookieValue(token), true);
    assert.equal(await verifyAdminCookieEdge(token), true);
    assert.equal(isAdminAuthenticatedFromCookieValue(changedToken), false);
    assert.equal(await verifyAdminCookieEdge(changedToken), false);
    assert.equal(parseAdminSessionToken(token, Date.now() + 13 * 60 * 60 * 1000), null);
  } finally {
    if (previous === undefined) delete process.env.ICONIK_ADMIN_SESSION_SECRET;
    else process.env.ICONIK_ADMIN_SESSION_SECRET = previous;
  }
});

test('admin credentials reject nonstring values', () => {
  const email = process.env.ICONIK_ADMIN_EMAIL;
  const password = process.env.ICONIK_ADMIN_PASSWORD;
  process.env.ICONIK_ADMIN_EMAIL = 'admin@example.com';
  process.env.ICONIK_ADMIN_PASSWORD = 'test password';
  try {
    assert.equal(verifyAdminCredentials('admin@example.com', 'test password'), true);
    assert.equal(verifyAdminCredentials('admin@example.com', 'wrong'), false);
    assert.equal(verifyAdminCredentials({} as string, 'test password'), false);
  } finally {
    if (email === undefined) delete process.env.ICONIK_ADMIN_EMAIL;
    else process.env.ICONIK_ADMIN_EMAIL = email;
    if (password === undefined) delete process.env.ICONIK_ADMIN_PASSWORD;
    else process.env.ICONIK_ADMIN_PASSWORD = password;
  }
});
