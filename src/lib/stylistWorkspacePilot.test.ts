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
