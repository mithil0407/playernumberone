import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';
import {
  buildWhatsappPilotImagePayload,
  buildWhatsappPilotTextPayload,
  buildWhatsappReadReceiptPayload,
} from './whatsappPilot.ts';

export const WOMEN_CONSULTATION_WHATSAPP_TEMPLATE =
  process.env.WHATSAPP_WOMEN_CONFIRMATION_TEMPLATE || 'iconik_women_consultation_confirmation_v1';

export const WOMEN_CONSULTATION_WHATSAPP_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

export interface WomenConsultationWhatsAppData {
  customerPhone: string;
  orderId: string;
  orderAmount: number;
  paymentId: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  recipient?: string;
  error?: string;
}

interface WhatsAppCloudResponse {
  messages?: Array<{ id?: string }>;
  error?: {
    code?: number;
    message?: string;
    error_data?: { details?: string };
  };
}

interface WhatsAppMediaMetadataResponse {
  url?: string;
  mime_type?: string;
  file_size?: number;
  id?: string;
  error?: WhatsAppCloudResponse['error'];
}

const WHATSAPP_INBOUND_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

export function buildWomenConsultationTemplatePayload(data: WomenConsultationWhatsAppData) {
  const recipient = normalizeIndianWhatsappNumber(data.customerPhone);
  if (!recipient) throw new Error('A valid Indian WhatsApp number is required');

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: WOMEN_CONSULTATION_WHATSAPP_TEMPLATE,
      language: { code: WOMEN_CONSULTATION_WHATSAPP_LANGUAGE },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: `₹${data.orderAmount.toLocaleString('en-IN')}` },
            { type: 'text', text: data.paymentId },
          ],
        },
      ],
    },
    // Meta returns this value in status webhooks, which makes support and
    // delivery debugging possible without placing customer data in logs.
    biz_opaque_callback_data: `order:${data.orderId}`,
  };
}

function whatsappConfiguration():
  | { accessToken: string; phoneNumberId: string; graphApiVersion: string }
  | { error: string } {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION?.trim();
  const missing = [
    !accessToken && 'WHATSAPP_ACCESS_TOKEN',
    !phoneNumberId && 'WHATSAPP_PHONE_NUMBER_ID',
    !graphApiVersion && 'WHATSAPP_GRAPH_API_VERSION',
  ].filter(Boolean);

  if (missing.length > 0) {
    return { error: `WhatsApp is not configured: missing ${missing.join(', ')}` };
  }

  if (!/^v\d+\.\d+$/.test(graphApiVersion!)) {
    return { error: 'WHATSAPP_GRAPH_API_VERSION must look like v26.0' };
  }

  return { accessToken: accessToken!, phoneNumberId: phoneNumberId!, graphApiVersion: graphApiVersion! };
}

async function sendWhatsappPayload(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  try {
    const configuration = whatsappConfiguration();
    if ('error' in configuration) return { success: false, error: configuration.error };

    const response = await fetch(
      `https://graph.facebook.com/${configuration.graphApiVersion}/${configuration.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${configuration.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const responseBody = await response.json().catch(() => ({})) as WhatsAppCloudResponse;

    if (!response.ok) {
      const metaError = responseBody.error;
      const detail = metaError?.error_data?.details || metaError?.message || `HTTP ${response.status}`;
      return {
        success: false,
        recipient: typeof payload.to === 'string' ? payload.to : undefined,
        error: metaError?.code ? `Meta ${metaError.code}: ${detail}` : detail,
      };
    }

    return {
      success: true,
      messageId: responseBody.messages?.[0]?.id,
      recipient: typeof payload.to === 'string' ? payload.to : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp send error',
    };
  }
}

export async function sendWhatsAppTextMessage(to: string, body: string) {
  return sendWhatsappPayload(buildWhatsappPilotTextPayload(to, body));
}

export async function sendWhatsAppImageMessage(to: string, imageUrl: string, caption?: string) {
  return sendWhatsappPayload(buildWhatsappPilotImagePayload(to, imageUrl, caption));
}

export async function markWhatsAppMessageRead(messageId: string) {
  return sendWhatsappPayload(buildWhatsappReadReceiptPayload(messageId));
}

export async function downloadWhatsAppImage(mediaId: string): Promise<{
  bytes: Buffer;
  mimeType: string;
  fileName: string;
}> {
  const configuration = whatsappConfiguration();
  if ('error' in configuration) throw new Error(configuration.error);
  if (!mediaId.trim()) throw new Error('WhatsApp media ID is required');

  const metadataResponse = await fetch(
    `https://graph.facebook.com/${configuration.graphApiVersion}/${encodeURIComponent(mediaId.trim())}`,
    {
      headers: { Authorization: `Bearer ${configuration.accessToken}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const metadata = await metadataResponse.json().catch(() => ({})) as WhatsAppMediaMetadataResponse;
  if (!metadataResponse.ok || !metadata.url) {
    const detail = metadata.error?.error_data?.details || metadata.error?.message || `HTTP ${metadataResponse.status}`;
    throw new Error(`Could not read WhatsApp image metadata: ${detail}`);
  }
  if (metadata.file_size && metadata.file_size > WHATSAPP_INBOUND_IMAGE_MAX_BYTES) {
    throw new Error('WhatsApp image is too large');
  }

  const mediaResponse = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${configuration.accessToken}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!mediaResponse.ok) throw new Error(`Could not download WhatsApp image: HTTP ${mediaResponse.status}`);

  const bytes = Buffer.from(await mediaResponse.arrayBuffer());
  if (bytes.length > WHATSAPP_INBOUND_IMAGE_MAX_BYTES) throw new Error('WhatsApp image is too large');
  const mimeType = metadata.mime_type || mediaResponse.headers.get('content-type') || 'image/jpeg';
  if (!/^image\/(?:jpeg|png|webp|heic|heif)$/i.test(mimeType)) {
    throw new Error(`Unsupported WhatsApp image type: ${mimeType}`);
  }
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

  return {
    bytes,
    mimeType,
    fileName: `whatsapp-${mediaId.replace(/[^a-zA-Z0-9_-]/g, '')}.${extension}`,
  };
}

export async function sendWomenConsultationConfirmationWhatsApp(
  data: WomenConsultationWhatsAppData,
): Promise<WhatsAppSendResult> {
  const payload = buildWomenConsultationTemplatePayload(data);
  const result = await sendWhatsappPayload(payload);
  if (result.success && !result.messageId) {
    return { success: false, recipient: payload.to, error: 'Meta accepted the request without a message ID' };
  }
  return result;
}
