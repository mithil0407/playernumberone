import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import { buildWomenConsultationTemplatePayload } from './whatsapp.ts';

test('normalises Indian WhatsApp numbers for Cloud API', () => {
  assert.equal(normalizeIndianWhatsappNumber('98765 43210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('+91 98765 43210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('09876543210'), '919876543210');
  assert.equal(normalizeIndianWhatsappNumber('12345'), null);
});

test('builds the approved women consultation confirmation template payload', () => {
  const payload = buildWomenConsultationTemplatePayload({
    customerPhone: '9876543210',
    orderId: 'order-db-123',
    orderAmount: 2699,
    paymentId: 'pay_123',
  });

  assert.equal(payload.to, '919876543210');
  assert.equal(payload.type, 'template');
  assert.equal(payload.biz_opaque_callback_data, 'order:order-db-123');
  assert.deepEqual(payload.template.components[0].parameters, [
    { type: 'text', text: '₹2,699' },
    { type: 'text', text: 'pay_123' },
  ]);
});
