import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { isCrossOriginWorkspaceMutation, isStylistPrivatePath, isStylistWorkspacePage } from './stylistWorkspaceSecurity.ts';
import { INTERNAL_PAGE_VIEW_PATTERNS } from './metaPageView.ts';
import { stylistWorkspaceDestination } from './stylistWorkspaceNavigation.ts';

test('guards staff pages without blocking customer intake and checkout', () => {
  for (const path of ['/stylist/jazz/dashboard', '/stylist/other/consultations/123', '/stylist/jazz/reports/abc']) {
    assert.equal(isStylistWorkspacePage(path), true);
    assert.equal(isStylistPrivatePath(path), true);
  }
  for (const path of ['/stylist/intake', '/stylist/checkout', '/stylist/style-score']) assert.equal(isStylistPrivatePath(path), false);
});

test('rejects cross-site mutations and forged or opaque origins, retaining worker authentication', () => {
  const url = 'https://www.iconik.pro/api/stylist-workspace/auth/login';
  for (const method of ['POST', 'PATCH', 'DELETE', 'PUT']) {
    for (const origin of ['https://attacker.invalid', 'https://www.iconik.pro.attacker.invalid', 'http://www.iconik.pro', 'null']) {
      assert.equal(isCrossOriginWorkspaceMutation(method, new Headers({ origin }), url), true);
    }
    assert.equal(isCrossOriginWorkspaceMutation(method, new Headers({ origin: 'https://www.iconik.pro' }), url), false);
    assert.equal(isCrossOriginWorkspaceMutation(method, new Headers({ 'sec-fetch-site': 'cross-site' }), url), true);
    assert.equal(isCrossOriginWorkspaceMutation(method, new Headers(), url), false);
  }
  assert.equal(isCrossOriginWorkspaceMutation('GET', new Headers(), url), false);
});

test('preserves the requested dashboard filter while rejecting another stylist or external destination', () => {
  const path = '/stylist/jazz/dashboard?bucket=needs_inputs&search=A&page=2';
  assert.equal(stylistWorkspaceDestination('jazz', path), path);
  for (const path of ['//attacker.invalid', '/stylist/other/dashboard', '/stylist/jazz/../../checkout']) {
    assert.equal(stylistWorkspaceDestination('jazz', path), '/stylist/jazz/dashboard');
  }
});

test('the actual bootstrap exits before loading any advertising SDK on private pages', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  const template = layout.split('<Script id="meta-signals-gateway"')[1].split('{`')[1].split('`}')[0];
  const script = vm.runInNewContext('`' + template + '`', { INTERNAL_PAGE_VIEW_PATTERNS, META_PIXEL_ID: 'test' });
  for (const pathname of ['/stylist/login', '/stylist/jazz/dashboard', '/stylist/jazz/reports/abc', '/stylist/admin/workspace', '/stylist/report/token']) {
    const window = { location: { pathname } };
    vm.runInNewContext(script, { window }); // No document exists: touching it would fail.
    assert.equal('fbq' in window, false);
  }
  assert.throws(() => vm.runInNewContext(script, { window: { location: { pathname: '/checkout' } } }), /document is not defined/);
  let loads = 0;
  const window = { location: { pathname: '/stylist/login' } } as { location: { pathname: string }; __iconikStartPublicTracking?: () => void };
  vm.runInNewContext(script, { window, document: {
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: () => { loads++; } } }],
  } });
  assert.equal(loads, 0);
  window.location.pathname = '/checkout';
  window.__iconikStartPublicTracking?.();
  assert.equal(loads, 2, 'Public checkout still initializes Meta and its gateway after private navigation');
  window.__iconikStartPublicTracking?.();
  assert.equal(loads, 2, 'The SDKs initialize only once');
});
