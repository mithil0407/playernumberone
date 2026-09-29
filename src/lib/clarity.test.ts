import assert from 'node:assert/strict';
import test from 'node:test';
import { clarityRouteFor } from './clarity.ts';

test('records the paid-acquisition landing and checkout pages', () => {
  assert.deepEqual(clarityRouteFor('/'), { funnel: 'root', step: 'landing' });
  assert.deepEqual(clarityRouteFor('/offer-2699'), { funnel: 'offer-2699', step: 'landing' });
  assert.deepEqual(clarityRouteFor('/offer-2699/modest'), { funnel: 'offer-2699', step: 'landing' });
  assert.deepEqual(clarityRouteFor('/offer-2699/sleeves'), { funnel: 'offer-2699', step: 'landing' });
  assert.deepEqual(clarityRouteFor('/offer-2699/checkout'), { funnel: 'offer-2699', step: 'checkout' });
  assert.deepEqual(clarityRouteFor('/man'), { funnel: 'man', step: 'landing' });
  assert.deepEqual(clarityRouteFor('/man/checkout'), { funnel: 'man', step: 'checkout' });
});

test('never records intake, payment success, reports or internal pages', () => {
  for (const pathname of [
    '/checkout',
    '/checkout/success',
    '/checkout/intake',
    '/man/intake',
    '/man/report/abc',
    '/man/admin',
    '/stylist/checkout',
    '/dashboard',
    '/iconik-club/client',
    '/offer-2699/other',
    '/us/checkout',
    '/colour-analysis',
    '',
    null,
  ]) {
    assert.equal(clarityRouteFor(pathname), null, String(pathname));
  }
});
