import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMetaPageViewRouteKey,
  isMetaPageViewExcluded,
  type MetaPageViewTarget,
  trackMetaPageView,
} from './metaPageView.ts';

test('builds a stable route key from pathname and sorted search parameters', () => {
  assert.equal(
    buildMetaPageViewRouteKey('/checkout', '?step=2&plan=vip'),
    '/checkout?plan=vip&step=2',
  );
  assert.equal(
    buildMetaPageViewRouteKey('/checkout', 'plan=vip&step=2'),
    '/checkout?plan=vip&step=2',
  );
  assert.equal(buildMetaPageViewRouteKey('/checkout'), '/checkout');
});

test('recognizes admin, staff, and private software routes', () => {
  const excluded = [
    '/dashboard',
    '/globe/admin/dashboard',
    '/man/admin/report/report-id',
    '/stylist/admin/manual',
    '/iconik-club/admin/clients',
    '/iconik-club/client/outfits',
    '/stylist/jazz/dashboard',
    '/stylist/jazz/consultations/consultation-id',
    '/stylist/jazz/reports/report-id',
    '/globe/report/share-token',
    '/man/report/share-token',
    '/stylist/report/share-token',
    '/stylist/edit/share-token',
    '/iconik-club/preview/share-token',
    '/stylist/login',
  ];

  for (const pathname of excluded) {
    assert.equal(isMetaPageViewExcluded(pathname), true, pathname);
  }

  for (const pathname of ['/globe', '/man/checkout', '/stylist/checkout', '/iconik-club/join']) {
    assert.equal(isMetaPageViewExcluded(pathname), false, pathname);
  }
});

test('tracks a public route once and preserves the generated event ID', () => {
  const calls: unknown[][] = [];
  const target: MetaPageViewTarget = {
    fbq: (...args) => calls.push(args),
  };

  const first = trackMetaPageView(target, '/checkout', '?step=1', () => 'page-view-1');
  const duplicate = trackMetaPageView(target, '/checkout', 'step=1', () => 'unused');

  assert.deepEqual(first, {
    status: 'tracked',
    routeKey: '/checkout?step=1',
    eventId: 'page-view-1',
  });
  assert.deepEqual(duplicate, {
    status: 'duplicate',
    routeKey: '/checkout?step=1',
  });
  assert.deepEqual(calls, [
    ['track', 'PageView', {}, { eventID: 'page-view-1' }],
  ]);
});

test('tracks search changes and browser-history returns without double-firing renders', () => {
  const calls: unknown[][] = [];
  const target: MetaPageViewTarget = {
    fbq: (...args) => calls.push(args),
  };
  let sequence = 0;
  const nextId = () => `page-view-${++sequence}`;

  assert.equal(trackMetaPageView(target, '/checkout', 'step=1', nextId).status, 'tracked');
  assert.equal(trackMetaPageView(target, '/checkout', 'step=2', nextId).status, 'tracked');
  assert.equal(trackMetaPageView(target, '/checkout', 'step=2', nextId).status, 'duplicate');
  assert.equal(trackMetaPageView(target, '/stylist/admin/dashboard', '', nextId).status, 'excluded');
  assert.equal(trackMetaPageView(target, '/checkout', 'step=2', nextId).status, 'tracked');

  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map((call) => call[3]), [
    { eventID: 'page-view-1' },
    { eventID: 'page-view-2' },
    { eventID: 'page-view-3' },
  ]);
});
