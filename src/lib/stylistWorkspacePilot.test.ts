import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWhatsappUrl, normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import { consultationReadiness } from './stylistConsultationReadiness.ts';

const requiredPhotos = {
  headshot: 'jazz/client/head.jpg',
  full_body_front: 'jazz/client/front.jpg',
  full_body_side: 'jazz/client/side.jpg',
};

test('readiness accepts bust or chest and keeps one-outfit optional', () => {
  const withBust = consultationReadiness({
    upload: { photo_paths: requiredPhotos, measurements: { shoulders: 38, bust: 91, waist: 72, hips: 98 } },
  });
  assert.equal(withBust.ready, true);
  assert.equal(withBust.photos.one_outfit, false);

  const withChest = consultationReadiness({
    upload: { photo_paths: requiredPhotos, measurements: { shoulders: '38 cm', chest: '91', waist: 72, hips: 98 } },
  });
  assert.equal(withChest.ready, true);
});

test('readiness identifies each missing source field', () => {
  const result = consultationReadiness({
    upload: { photo_paths: { headshot: 'head.jpg' }, measurements: { waist: 72 } },
  });
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, [
    'Full-body front photo',
    'Full-body side photo',
    'Shoulder measurement',
    'Bust or chest measurement',
    'Hip measurement',
  ]);
});

test('Indian WhatsApp numbers normalize without changing valid country codes', () => {
  assert.equal(normalizeIndianWhatsappNumber('98765 43210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('+91 98765 43210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('09876543210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('12345'), null);
});

test('WhatsApp message is safely URL encoded', () => {
  const url = buildWhatsappUrl('+91 98765 43210', 'Hi Jazz & client: report ready');
  assert.equal(url, 'https://wa.me/919876543210?text=Hi%20Jazz%20%26%20client%3A%20report%20ready');
});

import { indiaDayEnd, matchesWorkspaceView, positiveInteger, queryWorkspaceItems, workspaceQueueItem } from './stylistWorkspaceQueueModel.ts';

function queueRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'client-1', stylist_id: 'stylist-1', client_name: 'Test Client', client_phone: '9999999999',
    consultation_date: '2026-09-01T10:00:00.000Z', images_received_at: null,
    report_due_at: null, delivered_at: null, status: 'waiting_images', created_at: '2026-09-01T10:00:00.000Z', updated_at: '2026-09-01T10:00:00.000Z',
    form_occupation: null, form_body_shape: null, form_reason: null,
    consultation_upload_links: null, stylist_intake_responses: [], ...overrides,
  } as never;
}

test('queue separates imported bookings, filled forms, and uploaded photos', () => {
  const imported = workspaceQueueItem(queueRow());
  assert.equal(imported.formCompleted, false);
  assert.equal(matchesWorkspaceView(imported, 'recent', Date.parse('2026-09-02T12:00:00Z')), false);

  const filled = workspaceQueueItem(queueRow({ form_occupation: '' }));
  assert.equal(filled.formCompleted, true);
  assert.equal(matchesWorkspaceView(filled, 'forms'), true);

  const photographed = workspaceQueueItem(queueRow({
    status: 'delivered',
    consultation_upload_links: { submitted_at: '2026-09-01T11:00:00Z', photo_paths: { headshot: 'a.jpg' }, measurements: {} },
  }));
  assert.equal(matchesWorkspaceView(photographed, 'photos'), true);
  assert.equal(photographed.photoCount, 1);
  assert.equal(photographed.bucket, 'delivered');
});

test('queue search and paging inputs are deterministic and bounded', () => {
  const one = workspaceQueueItem(queueRow({ id: 'one', client_name: 'Anita', form_occupation: 'Founder' }));
  const two = workspaceQueueItem(queueRow({ id: 'two', client_name: 'Bea', client_phone: '1234567890', form_occupation: 'Designer', consultation_date: '2026-08-01T10:00:00Z' }));
  assert.deepEqual(queryWorkspaceItems([two, one], { view: 'forms', search: 'anita' }).map(item => item.id), ['one']);
  assert.equal(positiveInteger('999', 24, 50), 50);
  assert.equal(positiveInteger('oops', 24, 50), 24);
  assert.equal(indiaDayEnd(Date.parse('2026-09-02T01:00:00Z')), Date.parse('2026-09-02T18:29:59.999Z'));
});
