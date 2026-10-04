// Pure WhatsApp helpers for the ICONIK agent: payload builders for reactions and
// the typing indicator, how a reply is split into natural chat bubbles, and the
// 24-hour customer-service window that every proactive send must respect (ICONIK
// does not use Meta message templates, so outside the window we stay silent).

import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import { formatWhatsappStylistReply } from './whatsappPilot.ts';

/** Meta closes free-form messaging 24h after the client's last message; keep a margin. */
export const CUSTOMER_SERVICE_WINDOW_MS = 23.5 * 60 * 60 * 1000;
export const MAX_REPLY_BUBBLES = 3;
/** The agent answers with this when a reaction alone is the right reply. */
export const NO_REPLY_SENTINEL = 'NO_REPLY';

export function buildWhatsappReactionPayload(to: string, messageId: string, emoji: string) {
  const recipient = normalizeIndianWhatsappNumber(to);
  if (!recipient) throw new Error('A valid Indian WhatsApp number is required');
  if (!messageId.trim()) throw new Error('WhatsApp message ID is required');
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'reaction',
    // An empty emoji removes an earlier reaction.
    reaction: { message_id: messageId.trim(), emoji },
  };
}

/**
 * Marks the message read and shows "typing…" to the client. Meta hides the
 * indicator after ~25 seconds or when we send, so long turns re-send it.
 */
export function buildWhatsappTypingPayload(messageId: string) {
  if (!messageId.trim()) throw new Error('WhatsApp message ID is required');
  return {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId.trim(),
    typing_indicator: { type: 'text' },
  };
}

const ACK_RULES: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /\b(?:thanks+|thank you+|thx|ty|tysm)\b/i, emoji: '🙏' },
  { pattern: /\b(?:wedding|shaadi|sangeet|mehendi|mehndi|haldi|reception|engagement|birthday|anniversary|party)\b/i, emoji: '🎉' },
  { pattern: /\b(?:trip|vacation|holiday|travelling|traveling|goa|europe|flight)\b/i, emoji: '✈️' },
  { pattern: /\b(?:love(?:d)? (?:it|this|that)|obsessed|amazing|perfect|so good)\b/i, emoji: '❤️' },
  { pattern: /\b(?:interview|presentation|pitch|first day|new job)\b/i, emoji: '💪' },
  { pattern: /\b(?:haha+|lol|lmao)\b|😂|🤣/i, emoji: '😂' },
];

const GREETING = /^(?:hi+|hey+|hello+|hii+|yo|good (?:morning|afternoon|evening))[!.\s]*$/i;
const REQUEST = /\?|\b(?:help|find|need|want|suggest|recommend|show|send|buy|looking for|search|get me|can you|could you|what|which|how|should i|link)\b/i;

/**
 * The instant reaction that says "got it" before the real reply, the way a
 * person acknowledges a message: 👀 on a request (work is starting), 👍 on an
 * answer to our question, 👋 on a greeting, and a warmer emoji when the moment
 * calls for one. Every message gets exactly one.
 */
export function pickAckReaction(input: { text: string; hasImage: boolean }): string {
  const text = input.text.trim();
  for (const rule of ACK_RULES) {
    if (rule.pattern.test(text)) return rule.emoji;
  }
  if (input.hasImage) return '👀';
  if (GREETING.test(text)) return '👋';
  if (REQUEST.test(text)) return '👀';
  return '👍';
}

/**
 * Splits a reply into up to three chat bubbles on blank lines, the way people
 * double-text. Extra paragraphs fold into the last bubble so nothing is lost.
 */
export function splitIntoBubbles(reply: string, maxBubbles = MAX_REPLY_BUBBLES): string[] {
  const formatted = formatWhatsappStylistReply(reply);
  if (!formatted || formatted.trim() === NO_REPLY_SENTINEL) return [];
  const paragraphs = formatted.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  if (paragraphs.length <= maxBubbles) return paragraphs;
  return [
    ...paragraphs.slice(0, maxBubbles - 1),
    paragraphs.slice(maxBubbles - 1).join('\n\n'),
  ];
}

/** A short, human pause before a follow-up bubble, scaled to its length. */
export function typingDelayMs(bubble: string) {
  return Math.min(3_000, 700 + bubble.length * 18);
}

export function isWithinCustomerServiceWindow(
  lastInboundAt: string | Date | null | undefined,
  now = new Date(),
) {
  if (!lastInboundAt) return false;
  const last = new Date(lastInboundAt).getTime();
  if (!Number.isFinite(last)) return false;
  return now.getTime() - last < CUSTOMER_SERVICE_WINDOW_MS;
}
