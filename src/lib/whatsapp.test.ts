import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import { buildWomenConsultationTemplatePayload } from './whatsapp.ts';
import {
  buildWhatsappPilotTextPayload,
  extractWhatsappWebhookEvents,
  getIconikManWhatsappPilotConfig,
  isIconikManWhatsappPilotSender,
} from './whatsappPilot.ts';

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

test('requires an exact configured email and Indian phone for the Man pilot', () => {
  const config = getIconikManWhatsappPilotConfig({
    ICONIK_MAN_WHATSAPP_PILOT_EMAIL: 'Mithil0407@gmail.com ',
    ICONIK_MAN_WHATSAPP_PILOT_PHONE: '+91 85540 45500',
    ICONIK_MAN_WHATSAPP_PILOT_NAME: 'Mithil',
  });

  assert.deepEqual(config, {
    email: 'mithil0407@gmail.com',
    phone: '918554045500',
    firstName: 'Mithil',
  });
  assert.equal(isIconikManWhatsappPilotSender('8554045500', config), true);
  assert.equal(isIconikManWhatsappPilotSender('9876543210', config), false);
  assert.equal(getIconikManWhatsappPilotConfig({
    ICONIK_MAN_WHATSAPP_PILOT_EMAIL: 'mithil0407@gmail.com',
    ICONIK_MAN_WHATSAPP_PILOT_PHONE: '123',
    ICONIK_MAN_WHATSAPP_PILOT_NAME: '',
  }), null);
});

test('extracts text and image messages alongside delivery statuses', () => {
  const events = extractWhatsappWebhookEvents({
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [
            { id: 'wamid.text', from: '918554045500', timestamp: '123', type: 'text', text: { body: 'Wedding on Saturday' } },
            { id: 'wamid.image', from: '8554045500', type: 'image', image: { id: 'media-1', mime_type: 'image/jpeg', caption: 'Rate this' } },
          ],
          statuses: [{ id: 'wamid.outbound', status: 'delivered', timestamp: '124' }],
        },
      }],
    }],
  });

  assert.equal(events.messages.length, 2);
  assert.deepEqual(events.messages[0], {
    id: 'wamid.text',
    from: '918554045500',
    timestamp: '123',
    type: 'text',
    text: 'Wedding on Saturday',
  });
  assert.equal(events.messages[1].type, 'image');
  assert.equal(events.messages[1].mediaId, 'media-1');
  assert.equal(events.messages[1].text, 'Rate this');
  assert.equal(events.statuses[0].status, 'delivered');
});

test('builds a natural text reply payload with URL previews', () => {
  const payload = buildWhatsappPilotTextPayload('+91 85540 45500', 'This shirt works well. https://example.com/shirt');
  assert.equal(payload.to, '918554045500');
  assert.equal(payload.type, 'text');
  assert.deepEqual(payload.text, {
    preview_url: true,
    body: 'This shirt works well. https://example.com/shirt',
  });
});
