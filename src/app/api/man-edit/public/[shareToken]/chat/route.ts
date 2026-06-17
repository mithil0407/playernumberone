import { NextRequest, NextResponse } from 'next/server';
import {
  generateManEditChatReply,
  hasActiveManEdit,
  loadManEditReportContext,
  uploadManEditChatImage,
} from '@/lib/manEdit';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 120;

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const message = String(form.get('message') ?? '').trim();
    const image = form.get('image');
    return {
      message,
      image: image instanceof File && image.size > 0 ? image : null,
    };
  }

  const body = await request.json().catch(() => ({}));
  return {
    message: typeof body.message === 'string' ? body.message.trim() : '',
    image: null,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const context = await loadManEditReportContext(shareToken, true);

  if (!context) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (!hasActiveManEdit(context)) return NextResponse.json({ error: 'Active Iconik Edit subscription required' }, { status: 403 });

  const parsed = await parseRequest(request);
  if (!parsed.message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const uploaded = parsed.image
    ? await uploadManEditChatImage(context.report.id, parsed.image)
    : null;

  const customerEmail = String(context.subscription?.customer_email ?? context.submission.customer_email);

  const { data: userMessage, error: userError } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .insert({
      report_id: context.report.id,
      subscription_id: context.subscription?.id ?? null,
      customer_email: customerEmail,
      role: 'user',
      content: parsed.message,
      image_url: uploaded?.signedUrl ?? null,
      metadata: uploaded ? { storage_path: uploaded.path } : {},
    })
    .select('*')
    .single();

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  const reply = await generateManEditChatReply({
    context,
    message: parsed.message,
    image: uploaded ? { bytes: uploaded.bytes, mimeType: uploaded.mimeType } : null,
  });

  const { data: assistantMessage, error: assistantError } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .insert({
      report_id: context.report.id,
      subscription_id: context.subscription?.id ?? null,
      customer_email: customerEmail,
      role: 'assistant',
      content: reply,
      model: 'gemini-3-flash-preview',
      metadata: { source: 'man-edit-chat' },
    })
    .select('*')
    .single();

  if (assistantError) return NextResponse.json({ error: assistantError.message }, { status: 500 });

  return NextResponse.json({ userMessage, assistantMessage });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const context = await loadManEditReportContext(shareToken, true);

  if (!context) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (!hasActiveManEdit(context)) return NextResponse.json({ error: 'Active Iconik Edit subscription required' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('*')
    .eq('report_id', context.report.id)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] }, { headers: { 'Cache-Control': 'private, max-age=20' } });
}
