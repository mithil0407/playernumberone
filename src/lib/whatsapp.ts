import { normalizeIndianWhatsappNumber } from './indiaPhone.ts';

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

export async function sendWomenConsultationConfirmationWhatsApp(
  data: WomenConsultationWhatsAppData,
): Promise<WhatsAppSendResult> {
  try {
    const configuration = whatsappConfiguration();
    if ('error' in configuration) return { success: false, error: configuration.error };

    const payload = buildWomenConsultationTemplatePayload(data);
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
        recipient: payload.to,
        error: metaError?.code ? `Meta ${metaError.code}: ${detail}` : detail,
      };
    }

    const messageId = responseBody.messages?.[0]?.id;
    if (!messageId) {
      return { success: false, recipient: payload.to, error: 'Meta accepted the request without a message ID' };
    }

    return { success: true, messageId, recipient: payload.to };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp send error',
    };
  }
}
