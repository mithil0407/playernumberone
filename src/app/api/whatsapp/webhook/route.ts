import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface WhatsAppStatus {
  id?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }>;
  biz_opaque_callback_data?: string;
}

function safeTokenMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const mode = search.get('hub.mode');
  const receivedToken = search.get('hub.verify_token');
  const challenge = search.get('hub.challenge');
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!mode && !receivedToken && !challenge) {
    return NextResponse.json({
      status: 'active',
      access_token_configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      phone_number_id_configured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      graph_api_version_configured: Boolean(process.env.WHATSAPP_GRAPH_API_VERSION),
      app_secret_configured: Boolean(process.env.WHATSAPP_APP_SECRET),
      verify_token_configured: Boolean(expectedToken),
    });
  }

  if (
    mode === 'subscribe'
    && challenge
    && receivedToken
    && expectedToken
    && safeTokenMatch(receivedToken, expectedToken)
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();

  if (!appSecret || !signature) {
    return NextResponse.json({ error: 'Webhook signature configuration is missing' }, { status: 401 });
  }

  const expectedSignature = `sha256=${crypto.createHmac('sha256', appSecret).update(body).digest('hex')}`;
  if (!safeTokenMatch(signature, expectedSignature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: {
    object?: string;
    entry?: Array<{ changes?: Array<{ value?: { statuses?: WhatsAppStatus[] } }> }>;
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (payload.object !== 'whatsapp_business_account') {
    return NextResponse.json({ status: 'ignored' });
  }

  const statuses = (payload.entry || []).flatMap(entry =>
    (entry.changes || []).flatMap(change => change.value?.statuses || []),
  );

  await Promise.all(statuses.map(async status => {
    if (!status.id || !status.status) return;
    const error = status.errors?.[0];
    const statusAt = status.timestamp && /^\d+$/.test(status.timestamp)
      ? new Date(Number(status.timestamp) * 1000).toISOString()
      : new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_message_deliveries')
      .update({
        status: status.status,
        status_at: statusAt,
        error_code: error?.code ? String(error.code) : null,
        error_message: error?.error_data?.details || error?.message || error?.title || null,
        raw_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('whatsapp_message_id', status.id);

    if (updateError) {
      console.error('Failed to record WhatsApp delivery status for message:', status.id, updateError);
    }
  }));

  return NextResponse.json({ status: 'success' });
}
