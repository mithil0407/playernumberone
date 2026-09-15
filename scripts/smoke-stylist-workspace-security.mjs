// Uses short-lived QA sessions and removes them in finally. Never changes PINs,
// consultations, reports or sends messages. No credentials are printed.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const origin = process.env.STYLIST_TEST_ORIGIN || 'http://localhost:3007';
assert.ok(['localhost', '127.0.0.1', 'www.iconik.pro'].includes(new URL(origin).hostname) || /^playernumberone-[a-z0-9]+-mithils-projects-72d979d3\.vercel\.app$/.test(new URL(origin).hostname));
const baseline = process.argv.includes('--baseline');
const { chromium } = await import(process.env.WORKSPACE_PLAYWRIGHT_MODULE || 'playwright-core');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
let browser;
const sessions = [];
try {
  const { data: roster, error } = await db.from('stylists').select('id,slug').eq('workspace_enabled', true).eq('is_active', true).order('slug');
  assert.ifError(error);
  const owner = roster.find(s => s.slug === 'jazz');
  assert.ok(owner);
  const outsider = roster.find(s => s.id !== owner.id);
  const token = randomBytes(32).toString('base64url');
  const { data: session, error: sessionError } = await db.from('stylist_sessions').insert({ stylist_id: owner.id, token_hash: createHash('sha256').update(token).digest('hex'), user_agent: 'ICONIK security/performance QA', expires_at: new Date(Date.now() + 600000).toISOString() }).select('id').single();
  assert.ifError(sessionError); sessions.push(session.id);
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', r => requests.push(r.url()));
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/stylist/jazz/dashboard?bucket=needs_inputs`);
  await page.waitForURL('**/stylist/login?**');
  await page.getByRole('combobox', { name: 'Your name' }).waitFor();
  if (!baseline) {
    assert.equal(new URL(page.url()).searchParams.get('redirectTo'), '/stylist/jazz/dashboard?bucket=needs_inputs');
    await page.waitForFunction(() => document.querySelector('select')?.disabled === false);
    assert.equal(requests.filter(url => /connect\.facebook\.net|connect\.iconik\.pro|googletagmanager|vercel-scripts/.test(url)).length, 0, 'No tracking scripts on the private login');
    console.log('PASS exact destination preserved; no advertising/analytics scripts loaded on login');
  }
  await context.addCookies([{ name: 'iconik_stylist_workspace', value: token, url: origin, httpOnly: true, sameSite: 'Lax', secure: origin.startsWith('https:') }]);
  const start = Date.now();
  await page.goto(`${origin}/stylist/jazz/dashboard?bucket=needs_inputs`);
  await page.waitForFunction(() => document.querySelector('[aria-label="Client cards"]')?.getAttribute('aria-busy') === 'false' && [...document.querySelectorAll('[role="status"]')].some(element => element.textContent.includes('Updated')));
  const initialMs = Date.now() - start;
  const countBefore = requests.filter(url => url.includes('/api/stylist-workspace/queue')).length;
  if (process.env.STYLIST_EXPECT_SERVER_DATA === '1') assert.equal(countBefore, 0, 'First dashboard view arrives with its data, without a browser queue request');
  const filterStart = Date.now();
  if (baseline) {
    await Promise.all([page.waitForResponse(r => r.url().includes('/api/stylist-workspace/queue') && r.status() === 200), page.getByRole('button', { name: /^All clients/ }).click()]);
  } else {
    await page.getByRole('button', { name: /^All clients/ }).click();
  }
  await page.waitForFunction(() => document.querySelector('[aria-label="Client cards"]')?.getAttribute('aria-busy') === 'false' && new URLSearchParams(location.search).get('bucket') === 'all');
  const filterMs = Date.now() - filterStart;
  await page.getByRole('link', { name: 'Continue reviewing', exact: true }).click();
  await page.waitForFunction(() => new URLSearchParams(location.search).get('bucket') === 'needs_review' && document.querySelector('[aria-label="Client cards"]')?.getAttribute('aria-busy') === 'false');
  await page.goBack();
  await page.waitForFunction(() => new URLSearchParams(location.search).get('bucket') === 'all');
  const countAfter = requests.filter(url => url.includes('/api/stylist-workspace/queue')).length;
  console.log(JSON.stringify({ mode: baseline ? 'baseline' : 'updated', initialMs, filterMs, additionalQueueRequestsForFiltersAndBack: countAfter - countBefore, browserErrors: errors.length }));
  if (baseline) process.exitCode = 0;
  else {
    assert.equal(countAfter, countBefore, 'Changing filters and browser history does not refetch');
    assert.deepEqual(errors, []);
    assert.equal(requests.filter(url => /connect\.facebook\.net|connect\.iconik\.pro|googletagmanager|vercel-scripts/.test(url)).length, 0, 'No marketing SDKs on the authenticated dashboard');
    const api = await context.request.get(`${origin}/api/stylist-workspace/queue?snapshot=1&stylistSlug=${outsider.slug}`);
    assert.equal(api.status(), 200);
    const data = await api.json();
    assert.equal(data.stylist.slug, owner.slug);
    assert.ok(data.snapshotItems.length > 0);
    assert.ok(data.snapshotItems.every(item => item.stylistId === owner.id));
    assert.equal(api.headers()['x-frame-options'], 'DENY');
    assert.match(api.headers()['cache-control'], /no-store/);
    console.log(`PASS authenticated snapshot isolates ${data.snapshotItems.length} assigned client summaries; private headers present`);
    const blocked = await context.request.post(`${origin}/api/stylist-workspace/auth/login`, { headers: { Origin: 'https://attacker.invalid' }, data: { slug: owner.slug, pin: '0000' } });
    assert.equal(blocked.status(), 403);
    console.log('PASS cross-site login denied before PIN processing');
    // Search and mobile navigation stay usable without a network request.
    await page.getByRole('textbox', { name: 'Search client or phone' }).fill('No matching QA client xyz');
    await page.getByText('No clients match this view').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'All my clients' }).click();
    await page.getByRole('button', { name: 'Open navigation' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    console.log('PASS client search, browser back and mobile navigation');
    const { error: revokeError } = await db.from('stylist_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.id);
    assert.ifError(revokeError);
    const denied = await context.request.get(`${origin}/api/stylist-workspace/queue?snapshot=1`);
    assert.equal(denied.status(), 401);
    await page.goto(`${origin}/stylist/jazz/dashboard?bucket=needs_inputs`);
    await page.waitForURL('**/stylist/login?**');
    assert.equal(new URL(page.url()).searchParams.get('redirectTo'), '/stylist/jazz/dashboard?bucket=needs_inputs');
    console.log('PASS revoked session denied and exact destination retained');
  }
} finally {
  await browser?.close();
  if (sessions.length) {
    const { error } = await db.from('stylist_sessions').delete().in('id', sessions);
    assert.ifError(error);
    console.log('QA sessions removed');
  }
}
