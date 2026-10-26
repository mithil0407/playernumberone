import assert from 'node:assert/strict';
import test from 'node:test';
import { consultationUploadUrl, uploadLinkWhatsAppUrl } from './consultationUploadLink';

const token = 'a'.repeat(48);

test('builds the iconik.pro upload link from a valid token, with or without a template', () => {
  assert.equal(consultationUploadUrl(token, ''), `https://www.iconik.pro/upload/${token}`);
  assert.equal(consultationUploadUrl(token, 'https://x.test/u/{token}?a=1'), `https://x.test/u/${token}?a=1`);
  assert.equal(consultationUploadUrl(token, 'https://x.test/u/'), `https://x.test/u/${token}`);
});

test('never builds a link from a missing or malformed token', () => {
  for (const bad of [null, undefined, '', 'abc', 'A'.repeat(48), `${token}/../x`]) assert.equal(consultationUploadUrl(bad, ''), null);
});

test('WhatsApp link adds India code to 10-digit numbers and rejects junk', () => {
  const url = uploadLinkWhatsAppUrl('+91 98765 43210', 'Meenal Shah', 'https://x.test/u');
  assert.ok(url?.startsWith('https://wa.me/919876543210?text='));
  assert.ok(decodeURIComponent(url!.split('text=')[1]).includes('Hi Meenal'));
  assert.ok(uploadLinkWhatsAppUrl('09876543210', 'A', 'u')?.startsWith('https://wa.me/919876543210'));
  assert.equal(uploadLinkWhatsAppUrl('12345', 'A', 'u'), null);
});
