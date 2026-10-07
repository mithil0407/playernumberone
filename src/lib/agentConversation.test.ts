import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntil, dueNudgeStage, isValidEventDate, type AgentEventLike } from './agentEvents.ts';
import {
  createLookSlug,
  decorateRetailUrl,
  isLookSlug,
  isSafeRetailUrl,
} from './agentLookLinks.ts';
import { buildAgentInstructions, formatEvents } from './agentPrompt.ts';
import { buildProductCaption, deliveryPhrase, productCardHtml, type PresentableProduct } from './agentPresentation.ts';
import {
  buildWhatsappImageByIdPayload,
  buildWhatsappReactionPayload,
  buildWhatsappTypingPayload,
  compareBySentOrder,
  remainingTypingDelayMs,
  teamTestCommand,
  typingDelayMs,
  isWithinCustomerServiceWindow,
  NO_REPLY_SENTINEL,
  parseQuoteMarker,
  pickAckReaction,
  quotePrefix,
  quoteRefs,
  quotedFrom,
  replyText,
  severalMessagesNote,
  splitIntoBubbles,
  unsentBubbles,
  withReplyContext,
} from './agentWhatsapp.ts';
import { extractWhatsappWebhookEvents } from './whatsappPilot.ts';

// 3 Oct 2026, 15:30 IST
const NOW = new Date('2026-10-03T10:00:00Z');

function event(overrides: Partial<AgentEventLike>): AgentEventLike {
  return {
    id: 'evt-1',
    title: "Brother's sangeet",
    event_date: '2026-10-24',
    status: 'upcoming',
    reminders_enabled: true,
    nudges_sent: [],
    ...overrides,
  };
}

test('typing indicator and reaction payloads match the Cloud API shape', () => {
  assert.deepEqual(buildWhatsappTypingPayload('wamid.1'), {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: 'wamid.1',
    typing_indicator: { type: 'text' },
  });
  assert.deepEqual(buildWhatsappReactionPayload('98765 43210', 'wamid.1', '🎉'), {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '919876543210',
    type: 'reaction',
    reaction: { message_id: 'wamid.1', emoji: '🎉' },
  });
});

test('photos, requests and moments get a fitting reaction; plain answers get none', () => {
  assert.equal(pickAckReaction({ text: 'my cousin’s wedding is next month!', hasImage: false }), '🎉');
  assert.equal(pickAckReaction({ text: 'thanks so much', hasImage: false }), '🙏');
  assert.equal(pickAckReaction({ text: 'how does this look', hasImage: true }), '👀');
  assert.equal(pickAckReaction({ text: 'Hey', hasImage: false }), '👋');
  assert.equal(pickAckReaction({ text: 'i want a ralph lauren style old money outfit, send me a link', hasImage: false }), '👀');
  assert.equal(pickAckReaction({ text: 'what colour trousers go with olive?', hasImage: false }), '👀');
  assert.equal(pickAckReaction({ text: '411037 10000inr', hasImage: false }), null);
  assert.equal(pickAckReaction({ text: '1', hasImage: false }), null);
  assert.equal(pickAckReaction({ text: 'Saree', hasImage: false }), null);
  assert.equal(pickAckReaction({ text: 'Help me find one', hasImage: false }), '👀');
});

test('the reply text keeps separate parts as paragraphs, once, preferring the final answer', () => {
  const message = (text: string, phase?: string) => ({ type: 'message', phase, content: [{ type: 'output_text', text }] });
  assert.equal(replyText([message('your contrast.'), message('For a casual look, add hoops.')]), 'your contrast.\n\nFor a casual look, add hoops.');
  assert.equal(replyText([message('same'), message('same')]), 'same');
  assert.equal(replyText([message('thinking aloud', 'commentary'), message('the answer', 'final_answer')]), 'the answer');
  assert.equal(replyText([{ type: 'reasoning' }, { type: 'function_call' }]), '');
});

test('replies split into at most three bubbles; NO_REPLY sends nothing', () => {
  assert.deepEqual(splitIntoBubbles('Love that.\n\nTry the rust overshirt.'), ['Love that.', 'Try the rust overshirt.']);
  assert.deepEqual(splitIntoBubbles('a\n\nb\n\nc\n\nd'), ['a', 'b', 'c\n\nd']);
  assert.deepEqual(splitIntoBubbles(NO_REPLY_SENTINEL), []);
  assert.deepEqual(splitIntoBubbles('**Bold** tip'), ['Bold tip']);
});

test('the 24h window closes with a safety margin', () => {
  assert.equal(isWithinCustomerServiceWindow(new Date(NOW.getTime() - 23 * 3_600_000), NOW), true);
  assert.equal(isWithinCustomerServiceWindow(new Date(NOW.getTime() - 23.75 * 3_600_000), NOW), false);
  assert.equal(isWithinCustomerServiceWindow(null, NOW), false);
});

test('event dates and countdown use India dates', () => {
  assert.equal(isValidEventDate('2026-12-14'), true);
  assert.equal(isValidEventDate('2026-02-30'), false);
  assert.equal(isValidEventDate('14 Dec'), false);
  assert.equal(daysUntil('2026-10-24', NOW), 21);
  // 23:00 IST on 3 Oct is still 3 Oct in India even though UTC is earlier in the day.
  assert.equal(daysUntil('2026-10-04', new Date('2026-10-03T17:30:00Z')), 1);
});

test('one reminder stage at a time, never repeated, only when enabled', () => {
  assert.equal(dueNudgeStage(event({}), NOW)?.key, 't21');
  assert.equal(dueNudgeStage(event({ nudges_sent: ['t21'] }), NOW), null);
  assert.equal(dueNudgeStage(event({ event_date: '2026-10-11' }), NOW)?.key, 't10');
  assert.equal(dueNudgeStage(event({ event_date: '2026-10-05' }), NOW)?.key, 't2');
  assert.equal(dueNudgeStage(event({ event_date: '2026-10-02' }), NOW)?.key, 'after');
  assert.equal(dueNudgeStage(event({ event_date: '2026-09-20' }), NOW), null);
  assert.equal(dueNudgeStage(event({ reminders_enabled: false }), NOW), null);
  assert.equal(dueNudgeStage(event({ event_date: '2026-12-01' }), NOW), null);
});

test('look slugs are short, unambiguous and validated', () => {
  const slug = createLookSlug();
  assert.equal(isLookSlug(slug), true);
  assert.equal(isLookSlug('ABCDEFGH'), false);
  assert.equal(isLookSlug('abc'), false);
  assert.equal(createLookSlug(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7])), '23456789');
});

test('only public https product pages are linkable', () => {
  assert.equal(isSafeRetailUrl('https://www.myntra.com/shirts/x/y/123/buy'), true);
  assert.equal(isSafeRetailUrl('http://www.myntra.com/x'), false);
  assert.equal(isSafeRetailUrl('https://localhost/x'), false);
  assert.equal(isSafeRetailUrl('https://192.168.1.1/x'), false);
  assert.equal(isSafeRetailUrl('javascript:alert(1)'), false);
});

test('click-outs carry tracking, and an affiliate wrapper when configured', () => {
  const tracked = new URL(decorateRetailUrl('https://www.zara.com/in/en/shirt-p0123.html?v1=9', { lookSlug: 'abcd2345', itemId: '1234567890' }, ''));
  assert.equal(tracked.searchParams.get('utm_source'), 'iconik');
  assert.equal(tracked.searchParams.get('utm_campaign'), 'look_abcd2345');
  assert.equal(tracked.searchParams.get('v1'), '9');
  const wrapped = decorateRetailUrl('https://www.zara.com/x', { lookSlug: 'abcd2345', itemId: 'i' }, 'https://aff.example/?u={url}');
  assert.match(wrapped, /^https:\/\/aff\.example\/\?u=https%3A%2F%2Fwww\.zara\.com/);
});

test('instructions carry the passport, memory and a due check-in', () => {
  const events = [{ ...event({}), occasion_type: 'wedding', city: 'Jaipur', dress_code: 'Indo-western', budget_inr: 8000, notes: null }];
  const instructions = buildAgentInstructions({
    line: 'woman',
    firstName: 'Riya',
    today: '2026-10-03',
    profile: { colour: { palette_name: 'Warm Autumn' } },
    reportUrl: null,
    memoryText: 'PORTRAIT: Loves earthy colours.',
    events,
    lookActivity: '',
    firstConversation: true,
    hasReportPhotos: false,
    now: NOW,
  });
  assert.match(instructions, /Riya's personal stylist[\s\S]*wrote her ICONIK report/);
  assert.match(instructions, /Warm Autumn/);
  assert.match(instructions, /PORTRAIT: Loves earthy colours/);
  assert.match(instructions, /FIRST CONVERSATION/);
  assert.doesNotMatch(instructions, /show_outfit_image|report photos can be used/);
  assert.match(instructions, /create_image/);
  assert.match(instructions, /present_products/);
  assert.match(instructions, /ONE short message/);
  assert.match(formatEvents(events, NOW), /in 21 days[\s\S]*CHECK-IN DUE: Three weeks out/);
});

const product: PresentableProduct = {
  number: 1,
  title: 'Soft Cotton Polo, Cream',
  retailer: 'The Collective',
  priceInr: 17500,
  mrpInr: null,
  colour: 'Cream',
  reason: 'The old-money staple, in your warm neutrals.',
  isPick: true,
  status: 'verified',
  sizeChecked: 'M',
  sizeAvailable: true,
  deliveryEstimate: 'by Wed, 8 Oct',
  pincode: '411037',
  imageUrl: 'https://example.com/polo.jpg',
  shopUrl: 'https://www.iconik.pro/go/abc',
};

test('product captions are numbered, carry the checked facts and a shop link', () => {
  assert.equal(buildProductCaption(product), [
    '1) Soft Cotton Polo, Cream — ₹17,500 · my pick',
    'The old-money staple, in your warm neutrals.',
    '✓ M in stock · arrives by Wed, 8 Oct (411037)',
    'Shop at The Collective: https://www.iconik.pro/go/abc',
  ].join('\n'));
  const unconfirmed = buildProductCaption({ ...product, number: 2, isPick: false, status: 'failed', reason: null });
  assert.match(unconfirmed, /^2\) Soft Cotton Polo, Cream — ₹17,500\n/);
  assert.match(unconfirmed, /Couldn't confirm M stock on the site/);
});

test('product card HTML escapes store text', () => {
  const html = productCardHtml({ ...product, title: '<script>x</script> Polo', retailer: 'A&B' }, '4 Oct 2026');
  assert.doesNotMatch(html, /<script>x<\/script>/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt; Polo/);
  assert.match(html, /A&amp;B/);
  assert.match(html, /My pick/);
});

test('delivery estimates read naturally whatever the store wrote', () => {
  assert.equal(deliveryPhrase('By Tue, Oct 06 for 411037'), 'by Tue, Oct 06');
  assert.equal(deliveryPhrase('Delivery by 8 Oct'), 'by 8 Oct');
  assert.equal(deliveryPhrase('Estimated delivery: Within 3-5 days'), 'within 3-5 days');
  assert.match(buildProductCaption({ ...product, deliveryEstimate: 'By Tue, Oct 06 for 411037' }), /✓ M in stock · arrives by Tue, Oct 06 \(411037\)/);
});

test('inbound messages sort by when the client sent them, not when we stored them', () => {
  const photo = { id: 'photo', created_at: '2026-10-05T19:13:09.000Z', metadata: { whatsapp_timestamp: '1791227580' } };
  const name = { id: 'name', created_at: '2026-10-05T19:13:06.000Z', metadata: { whatsapp_timestamp: '1791227583' } };
  const sameSecond = { id: 'later', created_at: '2026-10-05T19:13:10.000Z', metadata: { whatsapp_timestamp: '1791227583' } };
  const legacy = { id: 'legacy', created_at: '2026-10-05T19:00:00.000Z', metadata: {} };
  assert.deepEqual([sameSecond, name, photo, legacy].sort(compareBySentOrder).map(row => row.id), ['legacy', 'photo', 'name', 'later']);
});

test('images can be sent by uploaded media id so they keep their place', () => {
  assert.deepEqual(buildWhatsappImageByIdPayload('9876543210', ' 123 ', ' Your Colour Card '), {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '919876543210',
    type: 'image',
    image: { id: '123', caption: 'Your Colour Card' },
  });
  assert.throws(() => buildWhatsappImageByIdPayload('9876543210', ' '));
});

test('the pause between bubbles counts the time the previous send took', () => {
  const bubble = 'x'.repeat(50);
  assert.equal(remainingTypingDelayMs(bubble, 10_000, 10_000), typingDelayMs(bubble));
  assert.equal(remainingTypingDelayMs(bubble, 10_000, 10_600), typingDelayMs(bubble) - 600);
  assert.equal(remainingTypingDelayMs(bubble, 10_000, 20_000), 0);
});

test('team test commands switch between free and Blueprint', () => {
  assert.equal(teamTestCommand('reset colour'), 'free');
  assert.equal(teamTestCommand('/Reset Color '), 'free');
  assert.equal(teamTestCommand('Blueprint mode'), 'blueprint');
  assert.equal(teamTestCommand('please reset colour palette'), null);
  assert.equal(teamTestCommand('I want my free colour analysis'), null);
});

test('before the Colour Card the ask is one bubble with no talk of codes', () => {
  const prompt = buildAgentInstructions({
    line: null, firstName: null, today: '2026-10-05', profile: {}, reportUrl: null, memoryText: '', events: [],
    lookActivity: '', firstConversation: true, hasReportPhotos: false, tier: 'free', runsLeft: 3, invitesLeft: 3,
  });
  assert.match(prompt, /ONE short warm message, a single paragraph/);
  assert.match(prompt, /never mention codes/);
  assert.deepEqual(splitIntoBubbles('Hi! Welcome.\n\nSend a selfie and your name.', 1), ['Hi! Welcome.\n\nSend a selfie and your name.']);
});

test('the prompt carries the everyday-help playbook, what is coming up, and no Blueprint pitch', () => {
  const prompt = buildAgentInstructions({
    line: 'woman', firstName: 'Riya', today: '2026-10-05', profile: { season: 'Deep Autumn', best_colours: ['Rust'] }, reportUrl: null,
    memoryText: '', events: [], lookActivity: '', firstConversation: false, hasReportPhotos: false, tier: 'free', runsLeft: 3, invitesLeft: 3,
  });
  assert.match(prompt, /Wardrobe check/);
  assert.match(prompt, /Screenshot to shop/);
  assert.match(prompt, /Shades: lipstick, foundation/);
  assert.match(prompt, /COMING UP[\s\S]*Navratri[\s\S]*Diwali/);
  assert.match(prompt, /without pushing/);
  const fresh = buildAgentInstructions({
    line: null, firstName: null, today: '2026-10-05', profile: {}, reportUrl: null, memoryText: '', events: [],
    lookActivity: '', firstConversation: true, hasReportPhotos: false, tier: 'free', runsLeft: 3, invitesLeft: 3,
  });
  assert.match(fresh, /Don't wait for their name/);
  assert.match(fresh, /In your FIRST response, call send_colour_card/);
});

test('nothing is locked: face analysis is free, pictures and shade cards are offered, and the voice mirrors them', () => {
  const base = {
    line: 'woman' as const, firstName: null, today: '2026-10-05', reportUrl: null, memoryText: '', events: [],
    lookActivity: '', firstConversation: false, hasReportPhotos: false, tier: 'free' as const, runsLeft: 3, invitesLeft: 5,
  };
  const prompt = buildAgentInstructions({ ...base, profile: { season: 'Deep Autumn', best_colours: ['Rust'] }, imagesLeftToday: 2, textingStyle: 'They write very short messages (a few words).' });
  assert.match(prompt, /FACE ANALYSIS \(free/);
  assert.doesNotMatch(prompt, /FACE ANALYSIS: locked|unlocks? (?:when|with)|photo checks/i);
  assert.match(prompt, /NEVER TURN DOWN HELP/);
  assert.match(prompt, /Never say you can't make or send an image/);
  assert.match(prompt, /create_image \(2 left today\)/);
  assert.match(prompt, /send_shade_card/);
  assert.match(prompt, /HOW THEY TEXT — mirror it\nThey write very short messages/);
  assert.match(prompt, /No scores unless they ask/);
  assert.match(prompt, /EXAMPLES/);
  assert.doesNotMatch(prompt, /THIS TURN/);
  const photo = buildAgentInstructions({ ...base, profile: { best_colours: ['Rust'] }, imagesLeftToday: 3, photoThisTurn: true });
  assert.match(prompt, /start that bubble with \[reply m2\]/);
  assert.match(prompt, /Double-text the way people do/);
  assert.match(photo, /THIS TURN\n- They sent a photo[\s\S]*want to see it with the espresso trousers/);
  const fresh = buildAgentInstructions({ ...base, profile: {} });
  assert.match(fresh, /make the card FIRST, and if they asked about the outfit, answer inside the wow/);
  assert.match(fresh, /A photo with no caption is their selfie for the card: don't rate it/);
  assert.match(fresh, /Monk Skin Tone scale/);
  assert.match(fresh, /never as a pitch/);
  assert.match(fresh, /You haven't seen how they text yet/);
});

test('a swipe-reply arrives with the quoted message id; reactions keep their own shape', () => {
  const webhook = (message: Record<string, unknown>) => ({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [{ from: '919800000001', id: 'wamid.in', timestamp: '1', ...message }] } }] }],
  });
  const reply = extractWhatsappWebhookEvents(webhook({ type: 'text', text: { body: 'this one' }, context: { from: '919657564840', id: 'wamid.ours' } })).messages[0];
  assert.equal(reply.text, 'this one');
  assert.equal(reply.replyTo, 'wamid.ours');
  assert.equal(extractWhatsappWebhookEvents(webhook({ type: 'text', text: { body: 'hi' } })).messages[0].replyTo, undefined);
  const reaction = extractWhatsappWebhookEvents(webhook({ type: 'reaction', reaction: { message_id: 'wamid.ours', emoji: '❤️' } })).messages[0];
  assert.deepEqual(reaction.reaction, { messageId: 'wamid.ours', emoji: '❤️' });
  assert.equal(reaction.replyTo, undefined);
});

test('what they quoted reads naturally to the model, ours or theirs, text or picture', () => {
  assert.equal(quotePrefix({ quoted: quotedFrom({ direction: 'outbound', kind: 'image', content: 'the espresso version 👀' }) }), '[replying to your picture: "the espresso version 👀"] ');
  assert.equal(quotePrefix({ quoted: quotedFrom({ direction: 'inbound', kind: 'text', content: 'Navy blue saree' }) }), '[replying to their earlier message: "Navy blue saree"] ');
  assert.equal(quotePrefix({ quoted: quotedFrom({ direction: 'inbound', kind: 'image', content: '' }) }), '[replying to their photo] ');
  assert.equal(quotePrefix({}), '');
  assert.equal(quotedFrom(null), null);
});

test('the agent can quote-reply to one of their messages by label, and labels never leak', () => {
  const rows = [
    { id: 'a', direction: 'inbound', kind: 'image', whatsapp_message_id: 'wamid.a' },
    { id: 'b', direction: 'outbound', kind: 'text', whatsapp_message_id: 'wamid.b' },
    { id: 'c', direction: 'inbound', kind: 'image', whatsapp_message_id: 'wamid.c' },
    { id: 'd', direction: 'inbound', kind: 'reaction', whatsapp_message_id: 'wamid.d' },
    { id: 'e', direction: 'inbound', kind: 'text', whatsapp_message_id: null },
  ];
  const refs = quoteRefs(rows);
  assert.deepEqual([...refs.byMessageId], [['a', 'm1'], ['c', 'm2']]);
  assert.equal(refs.byRef.get('m2'), 'wamid.c');
  assert.deepEqual(parseQuoteMarker("[reply m2] this one's the winner", refs.byRef), { text: "this one's the winner", replyTo: 'wamid.c' });
  assert.deepEqual(parseQuoteMarker('[Reply M1]  love it', refs.byRef), { text: 'love it', replyTo: 'wamid.a' });
  assert.deepEqual(parseQuoteMarker('[reply m9] which?', refs.byRef), { text: 'which?', replyTo: null });
  assert.deepEqual(parseQuoteMarker('(m2) the second one [reply m1] works', refs.byRef), { text: 'the second one works', replyTo: null });
  assert.equal(quoteRefs(Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, direction: 'inbound', kind: 'text', whatsapp_message_id: `w${i}` }))).byRef.get('m1'), 'w4');
  assert.equal(severalMessagesNote(['m3']), null);
  assert.match(severalMessagesNote(['m3', 'm4', 'm5']) ?? '', /3 messages together \(m3, m4, m5\)[\s\S]*\[reply m5\]/);
  assert.deepEqual(withReplyContext({ type: 'text' }, 'wamid.c'), { type: 'text', context: { message_id: 'wamid.c' } });
  assert.deepEqual(withReplyContext({ type: 'text' }, null), { type: 'text' });
});

test('a line already double-texted this turn is not repeated in the reply', () => {
  const bubbles = [{ text: 'The turquoise is a little cool next to you.' }, { text: 'Want to see it with a bottle-green blouse?' }, { text: 'want to see it with a bottle green blouse' }];
  assert.deepEqual(unsentBubbles(bubbles, ['the turquoise is a little cool next to you']).map(bubble => bubble.text), ['Want to see it with a bottle-green blouse?']);
  assert.deepEqual(unsentBubbles([{ text: '' }, { text: 'ok' }], []).map(bubble => bubble.text), ['ok']);
});

test('double-texting pauses like typing, with an extra beat before an afterthought', () => {
  assert.ok(typingDelayMs('ok') < typingDelayMs('only thing, the grey is a bit cold next to your skin'));
  assert.ok(typingDelayMs('x'.repeat(2_000)) <= 4_200);
  assert.equal(typingDelayMs('oh and gold hoops with it') - typingDelayMs('so and gold hoops with it'), 1_400);
});
