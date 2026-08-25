import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';

export interface IconikManWhatsappPilotConfig {
  email: string;
  phone: string;
  firstName: string;
}

export interface WhatsappInboundMessage {
  id: string;
  from: string;
  timestamp?: string;
  type: 'text' | 'image' | 'interactive' | 'unsupported';
  text: string;
  mediaId?: string;
  mimeType?: string;
}

export interface WhatsappDeliveryStatus {
  id?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }>;
  biz_opaque_callback_data?: string;
}

type AnyRecord = Record<string, unknown>;
type PilotEnv = Partial<Record<
  'ICONIK_MAN_WHATSAPP_PILOT_EMAIL' | 'ICONIK_MAN_WHATSAPP_PILOT_PHONE' | 'ICONIK_MAN_WHATSAPP_PILOT_NAME',
  string | undefined
>>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asRecordArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getIconikManWhatsappPilotConfig(
  env: PilotEnv = process.env as PilotEnv,
): IconikManWhatsappPilotConfig | null {
  const email = cleanString(env.ICONIK_MAN_WHATSAPP_PILOT_EMAIL).toLowerCase();
  const phone = normalizeIndianWhatsappNumber(cleanString(env.ICONIK_MAN_WHATSAPP_PILOT_PHONE));
  if (!email || !email.includes('@') || !phone) return null;

  const configuredName = cleanString(env.ICONIK_MAN_WHATSAPP_PILOT_NAME);
  const emailName = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();

  return {
    email,
    phone,
    firstName: configuredName || emailName || 'there',
  };
}

export function isIconikManWhatsappPilotSender(
  sender: string,
  config: IconikManWhatsappPilotConfig | null,
) {
  if (!config) return false;
  return normalizeIndianWhatsappNumber(sender) === config.phone;
}

function parseInboundMessage(raw: AnyRecord): WhatsappInboundMessage | null {
  const id = cleanString(raw.id);
  const from = normalizeIndianWhatsappNumber(cleanString(raw.from));
  if (!id || !from) return null;

  const rawType = cleanString(raw.type);
  const timestamp = cleanString(raw.timestamp) || undefined;

  if (rawType === 'text') {
    const text = cleanString(asRecord(raw.text).body);
    if (!text) {
      return { id, from, timestamp, type: 'unsupported', text: '[Empty WhatsApp text message]' };
    }
    return { id, from, timestamp, type: 'text', text };
  }

  if (rawType === 'image') {
    const image = asRecord(raw.image);
    const mediaId = cleanString(image.id);
    if (!mediaId) return null;
    return {
      id,
      from,
      timestamp,
      type: 'image',
      text: cleanString(image.caption) || 'How does this outfit look on me? Rate the outfit and tell me what you would change.',
      mediaId,
      mimeType: cleanString(image.mime_type) || undefined,
    };
  }

  if (rawType === 'interactive') {
    const interactive = asRecord(raw.interactive);
    const reply = asRecord(interactive.button_reply ?? interactive.list_reply);
    const text = cleanString(reply.title) || cleanString(reply.id);
    if (!text) {
      return { id, from, timestamp, type: 'unsupported', text: '[Empty WhatsApp interactive reply]' };
    }
    return { id, from, timestamp, type: 'interactive', text };
  }

  return {
    id,
    from,
    timestamp,
    type: 'unsupported',
    text: rawType ? `[Unsupported WhatsApp message: ${rawType}]` : '[Unsupported WhatsApp message]',
  };
}

export function extractWhatsappWebhookEvents(payload: unknown): {
  messages: WhatsappInboundMessage[];
  statuses: WhatsappDeliveryStatus[];
} {
  const root = asRecord(payload);
  const messages: WhatsappInboundMessage[] = [];
  const statuses: WhatsappDeliveryStatus[] = [];

  for (const entry of asRecordArray(root.entry)) {
    for (const change of asRecordArray(entry.changes)) {
      const value = asRecord(change.value);
      for (const rawMessage of asRecordArray(value.messages)) {
        const parsed = parseInboundMessage(rawMessage);
        if (parsed) messages.push(parsed);
      }
      for (const rawStatus of asRecordArray(value.statuses)) {
        statuses.push(rawStatus as WhatsappDeliveryStatus);
      }
    }
  }

  return { messages, statuses };
}

export function buildWhatsappPilotTextPayload(to: string, body: string) {
  const recipient = normalizeIndianWhatsappNumber(to);
  if (!recipient) throw new Error('A valid Indian WhatsApp number is required');
  const normalizedBody = body.trim().slice(0, 4_000);
  if (!normalizedBody) throw new Error('WhatsApp message body is required');

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: true,
      body: normalizedBody,
    },
  };
}

export function buildWhatsappReadReceiptPayload(messageId: string) {
  if (!messageId.trim()) throw new Error('WhatsApp message ID is required');
  return {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId.trim(),
  };
}
