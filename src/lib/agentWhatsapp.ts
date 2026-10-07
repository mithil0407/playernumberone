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
 * indicator after ~25 seconds or whenever we send anything (a reaction too),
 * so it is re-sent while we work and after every mid-turn send.
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

/**
 * An image already uploaded to WhatsApp (by media id). Unlike a link, WhatsApp
 * doesn't have to fetch it first, so it can't arrive after the text sent next.
 */
export function buildWhatsappImageByIdPayload(to: string, mediaId: string, caption?: string) {
  const recipient = normalizeIndianWhatsappNumber(to);
  if (!recipient) throw new Error('A valid Indian WhatsApp number is required');
  if (!mediaId.trim()) throw new Error('WhatsApp media ID is required');
  const normalizedCaption = caption?.trim().slice(0, 1_024);
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'image',
    image: { id: mediaId.trim(), ...(normalizedCaption ? { caption: normalizedCaption } : {}) },
  };
}

/**
 * Orders inbound messages the way the client sent them: by WhatsApp's own
 * timestamp (seconds), then by when we stored them. Webhooks can arrive out of
 * order, and a photo used to be stored only after it downloaded.
 */
export function compareBySentOrder(
  a: { created_at: string; metadata?: Record<string, unknown> | null },
  b: { created_at: string; metadata?: Record<string, unknown> | null },
) {
  const sentAt = (row: typeof a) => {
    const value = Number(row.metadata?.whatsapp_timestamp);
    return Number.isFinite(value) && value > 0 ? value : Math.floor(new Date(row.created_at).getTime() / 1000);
  };
  return sentAt(a) - sentAt(b) || a.created_at.localeCompare(b.created_at);
}

/**
 * Team test commands (numbers listed by name in ICONIK_AGENT_ALLOWED_PHONES):
 * "reset colour" makes the number a fresh free client, so the free colour flow
 * can be tested from a number with a Blueprint; "blueprint mode" switches back.
 */
export function teamTestCommand(text: string): 'free' | 'blueprint' | null {
  if (/^\s*\/?reset colou?r\s*$/i.test(text)) return 'free';
  if (/^\s*\/?blueprint mode\s*$/i.test(text)) return 'blueprint';
  return null;
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
 * person would: 👀 on a photo or a request (work is starting), 👋 on a hello,
 * and a warmer emoji when the moment calls for one. A plain answer to our
 * question ("pink", "yes", "saree") gets none: a friend doesn't react to every
 * text, and "typing…" already shows we're on it.
 */
export function pickAckReaction(input: { text: string; hasImage: boolean }): string | null {
  const text = input.text.trim();
  for (const rule of ACK_RULES) {
    if (rule.pattern.test(text)) return rule.emoji;
  }
  if (input.hasImage) return '👀';
  if (GREETING.test(text)) return '👋';
  if (REQUEST.test(text) && text.split(/\s+/).length > 2) return '👀';
  return null;
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

/**
 * The model's reply text. output_text glues separate message parts together with
 * no space ("…your contrast.For a casual look…"); each part is its own paragraph.
 */
export function replyText(output: Array<{ type: string; content?: unknown; phase?: unknown }>) {
  const messages = output.filter(item => item.type === 'message' && Array.isArray(item.content));
  // When the model marks its final answer, that is the reply; earlier commentary isn't repeated.
  const finals = messages.filter(item => item.phase === 'final_answer');
  const parts: string[] = [];
  for (const item of finals.length ? finals : messages) {
    for (const part of item.content as Array<{ type?: string; text?: string }>) {
      const text = part.type === 'output_text' ? part.text?.trim() : '';
      if (text && !parts.includes(text)) parts.push(text);
    }
  }
  return parts.join('\n\n').trim();
}

// ── Quote replies: theirs to us, ours to them ──

/** Adds WhatsApp's reply context, so the message shows as a reply quoting messageId. */
export function withReplyContext<T extends Record<string, unknown>>(payload: T, messageId?: string | null) {
  const id = messageId?.trim();
  return id ? { ...payload, context: { message_id: id } } : payload;
}

/** What they swiped to reply to, stored on their message so the thread can show it. */
export interface QuotedMessage {
  /** "us" when they quoted one of our messages, "them" when they quoted their own. */
  by: 'us' | 'them';
  kind: string;
  text: string;
}

export function quotedFrom(row: { direction: string; kind: string; content: string } | null): QuotedMessage | null {
  if (!row) return null;
  return {
    by: row.direction === 'outbound' ? 'us' : 'them',
    kind: row.kind,
    text: row.content.replace(/\s+/g, ' ').trim().slice(0, 180),
  };
}

/** How a quoted reply reads to the model, before the message itself. */
export function quotePrefix(metadata: Record<string, unknown> | null | undefined) {
  const quoted = metadata?.quoted as QuotedMessage | undefined;
  if (!quoted || (quoted.by !== 'us' && quoted.by !== 'them')) return '';
  const what = quoted.kind === 'image'
    ? quoted.by === 'us' ? 'your picture' : 'their photo'
    : quoted.by === 'us' ? 'your message' : 'their earlier message';
  return `[replying to ${what}${quoted.text ? `: "${quoted.text}"` : ''}] `;
}

/**
 * Short labels (m1, m2…) for their recent messages, oldest first, so the model
 * can quote-reply to one: "[reply m2] this one's the winner". Only messages
 * WhatsApp can quote (those with an id).
 */
export function quoteRefs(messages: Array<{ id: string; direction: string; kind: string; whatsapp_message_id: string | null }>, limit = 8) {
  const quotable = messages
    .filter(message => message.direction === 'inbound' && message.whatsapp_message_id && ['text', 'image', 'interactive'].includes(message.kind))
    .slice(-limit);
  const byMessageId = new Map<string, string>();
  const byRef = new Map<string, string>();
  quotable.forEach((message, index) => {
    const ref = `m${index + 1}`;
    byMessageId.set(message.id, ref);
    byRef.set(ref, message.whatsapp_message_id!);
  });
  return { byMessageId, byRef };
}

/**
 * When several of their messages are answered at once (three photos, two
 * questions), a note beside them so each answer can quote the one it's about.
 */
export function severalMessagesNote(labels: string[]) {
  if (labels.length < 2) return null;
  return `[ICONIK note, not from them: they sent ${labels.length} messages together (${labels.join(', ')}). Where a bubble is about one of them, start it with [reply ${labels[labels.length - 1]}] (the label of that one) so it quotes it — like a person replying to each.]`;
}

const QUOTE_MARKER = /\[reply\s+(m\d+)\]\s*/gi;

/**
 * A bubble that starts with "[reply m2]" is sent as a reply quoting their
 * message m2. Markers anywhere else, labels the model echoed ("(m2)"), and
 * refs that don't exist are dropped, so nothing technical reaches them.
 */
export function parseQuoteMarker(bubble: string, refs: Map<string, string>) {
  const leading = bubble.match(/^\s*\[reply\s+(m\d+)\]/i);
  const replyTo = leading ? refs.get(leading[1].toLowerCase()) ?? null : null;
  const text = bubble.replace(QUOTE_MARKER, '').replace(/^\s*\(m\d+\)\s*/i, '').trim();
  return { text, replyTo };
}

/** Bubbles not already sent this turn: the model sometimes double-texts a line early, then repeats it in its reply. */
export function unsentBubbles<T extends { text: string }>(bubbles: T[], alreadySent: string[]) {
  const key = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const seen = new Set(alreadySent.map(key));
  return bubbles.filter(bubble => {
    const id = key(bubble.text);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * A human pause before a follow-up bubble: roughly the time to type it, with an
 * extra beat before an afterthought ("oh and…", "also…"), the way people double-text.
 */
export function typingDelayMs(bubble: string) {
  const typing = Math.min(4_200, 900 + bubble.length * 26);
  const afterthought = /^(?:oh|ooh|also|btw|wait|and|plus|actually|p\.?s\.?)\b/i.test(bubble.trim()) ? 1_400 : 0;
  return typing + afterthought;
}

/**
 * How long to wait before sending the next bubble, counted from when the
 * previous send started, so the time the send itself took isn't added on top.
 */
export function remainingTypingDelayMs(bubble: string, previousSendStartedAt: number, now = Date.now()) {
  return Math.max(0, typingDelayMs(bubble) - (now - previousSendStartedAt));
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
