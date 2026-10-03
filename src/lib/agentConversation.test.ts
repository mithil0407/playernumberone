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
import {
  buildWhatsappReactionPayload,
  buildWhatsappTypingPayload,
  isWithinCustomerServiceWindow,
  NO_REPLY_SENTINEL,
  pickAckReaction,
  splitIntoBubbles,
} from './agentWhatsapp.ts';

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

test('ack reactions only where a friend would react', () => {
  assert.equal(pickAckReaction({ text: 'my cousin’s wedding is next month!', hasImage: false }), '🎉');
  assert.equal(pickAckReaction({ text: 'thanks so much', hasImage: false }), '🙏');
  assert.equal(pickAckReaction({ text: 'how does this look', hasImage: true }), '👀');
  assert.equal(pickAckReaction({ text: 'what colour trousers go with olive?', hasImage: false }), null);
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
    canShowOutfitImages: false,
    now: NOW,
  });
  assert.match(instructions, /Riya's ICONIK report/);
  assert.match(instructions, /Warm Autumn/);
  assert.match(instructions, /PORTRAIT: Loves earthy colours/);
  assert.match(instructions, /FIRST CONVERSATION/);
  assert.doesNotMatch(instructions, /show_outfit_image/);
  assert.match(formatEvents(events, NOW), /in 21 days[\s\S]*CHECK-IN DUE: Three weeks out/);
});
