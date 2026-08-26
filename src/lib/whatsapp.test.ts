import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import { buildWomenConsultationTemplatePayload } from './whatsapp.ts';
import {
  buildWhatsappPilotImagePayload,
  buildWhatsappPilotTextPayload,
  extractWhatsappWebhookEvents,
  formatWhatsappStylistReply,
  getIconikManWhatsappPilotConfig,
  isIconikManWhatsappPilotSender,
  wantsGeneratedOutfitImage,
} from './whatsappPilot.ts';
import {
  buildRetailerFallbackUrl,
  findRequestedRetailer,
  resolveShoppingQuery,
  routeManWhatsappRequest,
} from './manWhatsappStylist.ts';
import { buildManWhatsappOutfitImagePrompt } from './manWhatsappOutfitImagePrompt.ts';

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

test('formats stylist copy as clean WhatsApp plain text', () => {
  const formatted = formatWhatsappStylistReply(`## Date-night look

- **Top:** Burgundy merino polo
- *Shoes:* Chocolate loafers

Keep it relaxed.`);

  assert.equal(formatted, `Date-night look

• Top: Burgundy merino polo
• Shoes: Chocolate loafers

Keep it relaxed.`);
  assert.doesNotMatch(formatted, /[*#`]/);
});

test('builds an outbound WhatsApp image payload', () => {
  const payload = buildWhatsappPilotImagePayload(
    '+91 85540 45500',
    'https://images.example.com/outfit.png',
    'Your dinner look',
  );
  assert.deepEqual(payload, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '918554045500',
    type: 'image',
    image: {
      link: 'https://images.example.com/outfit.png',
      caption: 'Your dinner look',
    },
  });
});

test('only requests paid outfit generation for explicit visual intent', () => {
  assert.equal(wantsGeneratedOutfitImage('What should I wear for a dinner date?'), false);
  assert.equal(wantsGeneratedOutfitImage('Show me an outfit for a dinner date'), true);
  assert.equal(wantsGeneratedOutfitImage('Generate a visual of that look'), true);
  assert.equal(wantsGeneratedOutfitImage('Can you rate this outfit image?'), false);
});

test('routes WhatsApp styling jobs before answer generation', () => {
  assert.equal(routeManWhatsappRequest('What should I wear for a dinner date?').intent, 'outfit_recommendation');
  assert.equal(routeManWhatsappRequest('How do I style this olive jacket?').intent, 'owned_item_styling');
  assert.equal(routeManWhatsappRequest('Could you give me a link for this jacket from H and M?').intent, 'shopping');
  assert.equal(routeManWhatsappRequest('What did my Blueprint say about my colour palette?').intent, 'report_question');
  assert.equal(routeManWhatsappRequest('Rate this', { hasImage: true }).intent, 'outfit_review');
});

test('resolves anaphoric shopping requests against the latest outfit', () => {
  const query = resolveShoppingQuery(
    'Could you also give me a link for this jacket from h and m',
    'Wear a cream fitted tee under an olive green matte cotton-twill bomber jacket with dark indigo jeans.',
  );
  assert.match(query, /olive green matte cotton-twill bomber jacket/i);

  const retailer = findRequestedRetailer('from h and m');
  assert.equal(retailer?.name, 'H&M');
  const fallback = buildRetailerFallbackUrl(retailer, query);
  assert.match(fallback, /^https:\/\/www2\.hm\.com\/en_in\/search-results\.html\?q=/);
  assert.match(decodeURIComponent(fallback), /olive green matte cotton-twill bomber jacket/i);
});

test('outfit visuals use separate face and body authorities on a white cyclorama', () => {
  const prompt = buildManWhatsappOutfitImagePrompt({
    profile: { classification: { body: { silhouette_type: 'Rectangle' } } },
    request: 'Show me the dinner outfit',
    outfitDirection: 'Ecru knit polo with espresso pleated trousers and dark brown loafers.',
    facialHairPresence: 'stubble',
  });

  assert.match(prompt, /headshot is the sole authority for identity, face/i);
  assert.match(prompt, /full-body is the sole authority for height impression/i);
  assert.match(prompt, /face and body unmistakably belong to the same real client/i);
  assert.match(prompt, /Completely discard and replace both source backgrounds/i);
  assert.match(prompt, /pure-white \(#FFFFFF\) seamless cyclorama studio/i);
  assert.match(prompt, /No visible wall-to-floor seam, horizon line, corner/i);
  assert.match(prompt, /faint, tight, natural contact shadow directly beneath the shoes/i);
  assert.match(prompt, /Ecru knit polo with espresso pleated trousers/i);
});
