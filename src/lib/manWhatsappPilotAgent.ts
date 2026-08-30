import 'server-only';

import {
  ICONIK_MAN_WHATSAPP_TEXT_MODEL,
  analyzeManWhatsappInteraction,
  generateManEditChatReply,
  generateManEditOutfitImage,
  generateManEditShoppingReply,
  loadManEditReportContext,
  uploadManEditChatImageBytes,
  type ManEditReportContext,
} from '@/lib/manEdit';
import {
  buildRecommendationDiversityBrief,
  selectMemoriesForTurn,
} from '@/lib/manWhatsappMemoryPolicy';
import {
  applyManWhatsappMemoryUpdates,
  ensureLegacyManWhatsappMemories,
  loadManWhatsappMemoryContext,
  saveManWhatsappRecommendationFingerprint,
} from '@/lib/manWhatsappMemoryStore';
import {
  contextClarificationForVagueOutfit,
  limitManWhatsappReply,
  quickManWhatsappReply,
  routeManWhatsappRequest,
} from '@/lib/manWhatsappStylist';
import { supabaseAdmin } from '@/lib/supabase';
import {
  downloadWhatsAppImage,
  markWhatsAppMessageRead,
  sendWhatsAppImageMessage,
  sendWhatsAppTextMessage,
} from '@/lib/whatsapp';
import {
  getIconikManWhatsappPilotConfig,
  formatWhatsappStylistReply,
  isIconikManWhatsappPilotSender,
  wantsGeneratedOutfitImage,
  whatsappImageCaptionCopy,
  whatsappImageProgressCopy,
  type IconikManWhatsappPilotConfig,
  type WhatsappInboundMessage,
} from '@/lib/whatsappPilot';

type AnyRecord = Record<string, unknown>;

const MEMORY_METADATA_TYPE = 'iconik_man_style_memory_v1';
const PILOT_CHANNEL = 'iconik_man_whatsapp_pilot';
const RAPID_MESSAGE_DEBOUNCE_MS = 2_000;
const RAPID_MESSAGE_WINDOW_MS = 15_000;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

async function findPilotReportShareToken(config: IconikManWhatsappPilotConfig) {
  const { data: submissions, error: submissionError } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('id')
    .ilike('customer_email', config.email)
    .order('created_at', { ascending: false })
    .limit(20);

  if (submissionError) throw new Error(`Could not load pilot intake: ${submissionError.message}`);
  const submissionIds = (submissions ?? []).map(item => item.id).filter(Boolean);
  if (!submissionIds.length) return null;

  const { data: reports, error: reportError } = await supabaseAdmin
    .from('man_reports')
    .select('share_token')
    .in('submission_id', submissionIds)
    .in('status', ['sent', 'draft_ready', 'in_review', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (reportError) throw new Error(`Could not load pilot report: ${reportError.message}`);
  return typeof reports?.[0]?.share_token === 'string' ? reports[0].share_token : null;
}

async function hasProcessedMessage(reportId: string, whatsappMessageId: string) {
  const { data, error } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('id')
    .eq('report_id', reportId)
    .contains('metadata', { whatsapp_message_id: whatsappMessageId })
    .limit(1);
  if (error) throw new Error(`Could not check WhatsApp message deduplication: ${error.message}`);
  return Boolean(data?.length);
}

async function hasNewerPilotUserMessage(reportId: string, messageId: string, createdAt: string) {
  const createdTime = Date.parse(createdAt);
  if (!Number.isFinite(createdTime)) return false;
  const windowEnd = new Date(createdTime + RAPID_MESSAGE_WINDOW_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('id')
    .eq('report_id', reportId)
    .eq('role', 'user')
    .neq('id', messageId)
    .gt('created_at', createdAt)
    .lte('created_at', windowEnd)
    .contains('metadata', { channel: PILOT_CHANNEL })
    .limit(1);
  if (error) {
    console.warn('[man whatsapp pilot] rapid-message check failed:', error.message);
    return false;
  }
  return Boolean(data?.length);
}

function waitForRapidWhatsappFollowup() {
  return new Promise(resolve => setTimeout(resolve, RAPID_MESSAGE_DEBOUNCE_MS));
}

async function loadSavedMemories(reportId: string) {
  const { data, error } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('content, metadata, created_at')
    .eq('report_id', reportId)
    .eq('role', 'system')
    .contains('metadata', { type: MEMORY_METADATA_TYPE })
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.warn('[man whatsapp pilot] memories unavailable:', error.message);
    return [];
  }

  return [...(data ?? [])].reverse()
    .map(item => typeof item.content === 'string' ? item.content.trim() : '')
    .filter(Boolean);
}

async function sendPilotText(to: string, body: string) {
  const result = await sendWhatsAppTextMessage(to, body);
  if (!result.success) throw new Error(result.error || 'WhatsApp send failed');
  return result;
}

async function sendRequestedOutfitImage(input: {
  context: ManEditReportContext;
  to: string;
  request: string;
  outfitDirection: string | null;
  memories: string[];
  sourceWhatsappMessageId: string;
}) {
  const generated = await generateManEditOutfitImage({
    context: input.context,
    request: input.request,
    outfitDirection: input.outfitDirection,
    memories: input.memories,
  });
  const uploaded = await uploadManEditChatImageBytes(
    input.context.report.id,
    generated.bytes,
    generated.mimeType,
    'generated-outfit.png',
  );
  if (!uploaded.signedUrl) throw new Error('Could not create a link for the generated outfit image');

  const caption = whatsappImageCaptionCopy(input.sourceWhatsappMessageId);
  const sent = await sendWhatsAppImageMessage(input.to, uploaded.signedUrl, caption);
  if (!sent.success) throw new Error(sent.error || 'WhatsApp image send failed');

  const customerEmail = String(input.context.subscription?.customer_email ?? input.context.submission.customer_email);
  const { error } = await supabaseAdmin.from('man_edit_chat_messages').insert({
    report_id: input.context.report.id,
    subscription_id: input.context.subscription?.id ?? null,
    customer_email: customerEmail,
    role: 'assistant',
    content: caption,
    image_url: uploaded.signedUrl,
    model: generated.model,
    metadata: {
      channel: PILOT_CHANNEL,
      type: 'iconik_man_generated_outfit_v1',
      outfit_direction: input.outfitDirection,
      client_request: input.request,
      storage_path: uploaded.path,
      in_reply_to_whatsapp_message_id: input.sourceWhatsappMessageId,
      whatsapp_message_id: sent.messageId ?? null,
    },
  });
  if (error) console.warn('[man whatsapp pilot] generated image message save failed:', error.message);
}

async function loadLatestOutfitDirection(reportId: string) {
  const { data, error } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('content, metadata, image_url')
    .eq('report_id', reportId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.warn('[man whatsapp pilot] latest outfit direction unavailable:', error.message);
    return null;
  }

  const fashionTerms = /\b(wear|outfit|look|shirt|polo|tee|t-shirt|trouser|jeans|chino|jacket|blazer|overshirt|shoe|loafer|sneaker|kurta|suit)\b/i;
  const imageFailure = /\b(?:can(?:not|'t) (?:render|generate|create|send)|image studio|generate the visual again)\b/i;

  for (const item of data ?? []) {
    const content = typeof item.content === 'string' ? item.content.trim() : '';
    const metadata = asRecord(item.metadata);
    const savedOutfitDirection = typeof metadata.outfit_direction === 'string'
      ? metadata.outfit_direction.trim()
      : '';
    if (savedOutfitDirection) return savedOutfitDirection;
    if (
      content.length >= 60
      && fashionTerms.test(content)
      && !imageFailure.test(content)
      && !item.image_url
      && metadata.type !== 'iconik_man_generated_outfit_v1'
    ) {
      return content;
    }
  }
  return null;
}

async function loadPilotContext(config: IconikManWhatsappPilotConfig) {
  const shareToken = await findPilotReportShareToken(config);
  if (!shareToken) return null;
  return loadManEditReportContext(shareToken, false);
}

export async function processIconikManWhatsappPilotMessage(message: WhatsappInboundMessage) {
  const config = getIconikManWhatsappPilotConfig();
  if (!isIconikManWhatsappPilotSender(message.from, config) || !config) {
    return { status: 'ignored' as const };
  }

  await markWhatsAppMessageRead(message.id).catch(error => {
    console.warn('[man whatsapp pilot] read receipt failed:', error instanceof Error ? error.message : error);
  });

  if (message.type === 'unsupported') {
    await sendPilotText(
      config.phone,
      'Send me a message or a clear outfit photo and tell me what you need help with.',
    );
    return { status: 'unsupported' as const };
  }

  const context = await loadPilotContext(config);
  if (!context) {
    await sendPilotText(
      config.phone,
      `I can’t see your ICONIK Man report yet. Finish it with ${config.email}, then message me again.`,
    );
    return { status: 'report_not_ready' as const };
  }

  if (await hasProcessedMessage(context.report.id, message.id)) {
    return { status: 'duplicate' as const };
  }

  let uploaded: Awaited<ReturnType<typeof uploadManEditChatImageBytes>> | null = null;
  let modelImage: { bytes: Buffer; mimeType: string } | null = null;
  if (message.type === 'image' && message.mediaId) {
    try {
      const downloaded = await downloadWhatsAppImage(message.mediaId);
      uploaded = await uploadManEditChatImageBytes(
        context.report.id,
        downloaded.bytes,
        downloaded.mimeType,
        downloaded.fileName,
      );
      modelImage = { bytes: downloaded.bytes, mimeType: downloaded.mimeType };
    } catch (error) {
      console.error('[man whatsapp pilot] image intake failed:', error);
      await sendPilotText(
        config.phone,
        'I can’t see that photo clearly. Send it again in good light with the full outfit visible.',
      );
      return { status: 'image_failed' as const };
    }
  }

  const route = routeManWhatsappRequest(message.text, { hasImage: message.type === 'image' });
  const customerEmail = String(context.subscription?.customer_email ?? context.submission.customer_email);
  const { data: userMessage, error: userError } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .insert({
      report_id: context.report.id,
      subscription_id: context.subscription?.id ?? null,
      customer_email: customerEmail,
      role: 'user',
      content: message.text,
      image_url: uploaded?.signedUrl ?? null,
      metadata: {
        channel: PILOT_CHANNEL,
        whatsapp_message_id: message.id,
        whatsapp_timestamp: message.timestamp ?? null,
        whatsapp_media_id: message.mediaId ?? null,
        storage_path: uploaded?.path ?? null,
        stylist_route: route.intent,
      },
    })
    .select('id, created_at')
    .single();

  if (userError || !userMessage) throw new Error(userError?.message || 'Could not save pilot message');

  if (message.type === 'text') {
    await waitForRapidWhatsappFollowup();
    if (await hasNewerPilotUserMessage(context.report.id, userMessage.id, userMessage.created_at)) {
      return { status: 'superseded_by_newer_message' as const };
    }
  }

  const [legacyMemories, memoryContext] = await Promise.all([
    loadSavedMemories(context.report.id),
    loadManWhatsappMemoryContext(context.report.id),
  ]);
  const legacyMemoryRecords = await ensureLegacyManWhatsappMemories({
    context,
    legacyMemories,
  });
  const memorySelection = selectMemoriesForTurn({
    memories: memoryContext.memories,
    legacyMemories,
    history: memoryContext.history,
    message: message.text,
    route: route.intent,
  });
  const memories = memorySelection.promptLines;
  const memoryDiversityBrief = buildRecommendationDiversityBrief(memoryContext.history);
  const imageRequested = wantsGeneratedOutfitImage(message.text);
  const conversationReference = route.needsConversationReference
    ? await loadLatestOutfitDirection(context.report.id)
    : null;
  const contextClarification = contextClarificationForVagueOutfit(
    message.text,
    conversationReference ?? '',
  );
  const shouldGenerateImage = imageRequested && !contextClarification;
  const quickReply = quickManWhatsappReply(message.text);
  let reply: string;
  if (quickReply) {
    reply = quickReply;
  } else if (contextClarification) {
    reply = contextClarification;
  } else if (imageRequested && conversationReference) {
    reply = whatsappImageProgressCopy(message.id);
  } else if (route.intent === 'shopping') {
    try {
      reply = await generateManEditShoppingReply({
        context,
        message: message.text,
        conversationReference,
        memories,
        memoryDiversityBrief,
      });
    } catch (error) {
      console.error('[man whatsapp pilot] shopping reply failed:', error);
      await sendPilotText(
        config.phone,
        'I couldn’t check the shops just now. Try that again in a moment?',
      );
      return { status: 'shopping_failed' as const };
    }
  } else {
    try {
      reply = await generateManEditChatReply({
        context,
        message: message.text,
        image: modelImage,
        memories,
        channel: 'whatsapp',
        firstName: config.firstName,
        route,
        conversationReference,
        memoryDiversityBrief,
      });
    } catch (error) {
      console.error('[man whatsapp pilot] stylist reply failed:', error);
      await sendPilotText(
        config.phone,
        'Something went wrong on my side. Send that again in a moment?',
      );
      return { status: 'generation_failed' as const };
    }
  }
  reply = formatWhatsappStylistReply(reply);
  reply = limitManWhatsappReply(reply, route.intent);

  if (await hasNewerPilotUserMessage(context.report.id, userMessage.id, userMessage.created_at)) {
    return { status: 'superseded_by_newer_message' as const };
  }

  const { data: assistantMessage, error: assistantError } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .insert({
      report_id: context.report.id,
      subscription_id: context.subscription?.id ?? null,
      customer_email: customerEmail,
      role: 'assistant',
      content: reply,
      model: ICONIK_MAN_WHATSAPP_TEXT_MODEL,
      metadata: {
        channel: PILOT_CHANNEL,
        in_reply_to_whatsapp_message_id: message.id,
        in_reply_to_chat_message_id: userMessage.id,
        stylist_route: route.intent,
      },
    })
    .select('id, metadata')
    .single();

  if (assistantError || !assistantMessage) throw new Error(assistantError?.message || 'Could not save pilot reply');

  const sent = await sendPilotText(config.phone, reply);
  await supabaseAdmin
    .from('man_edit_chat_messages')
    .update({
      metadata: {
        ...asRecord(assistantMessage.metadata),
        whatsapp_message_id: sent.messageId ?? null,
        whatsapp_recipient: sent.recipient ?? config.phone,
      },
    })
    .eq('id', assistantMessage.id);

  if (shouldGenerateImage) {
    try {
      await sendRequestedOutfitImage({
        context,
        to: config.phone,
        request: message.text,
        outfitDirection: conversationReference || reply,
        memories,
        sourceWhatsappMessageId: message.id,
      });
    } catch (error) {
      console.error('[man whatsapp pilot] outfit image generation failed:', error);
      await sendPilotText(
        config.phone,
        'That image didn’t work just now. Ask me once more in a moment?',
      );
    }
  }

  if (quickReply) {
    return {
      status: 'replied' as const,
      reportId: context.report.id,
      inboundMessageId: message.id,
      outboundMessageId: sent.messageId ?? null,
      memoriesSaved: 0,
    };
  }

  const interactionAnalysis = await analyzeManWhatsappInteraction({
    userMessage: message.text,
    assistantReply: reply,
    route: route.intent,
    activeMemories: [
      ...memoryContext.memories.filter(memory => memory.status === 'active'),
      ...legacyMemoryRecords.filter(legacy => (
        !memoryContext.memories.some(memory => memory.memoryKey === legacy.memoryKey)
      )),
    ],
    selectedMemoryKeys: memorySelection.selectedKeys,
  });
  const memoriesSaved = await applyManWhatsappMemoryUpdates({
    context,
    updates: interactionAnalysis.memoryUpdates,
    sourceWhatsappMessageId: message.id,
  });
  if (interactionAnalysis.recommendationFingerprint) {
    const { memoryKeysUsed, ...fingerprint } = interactionAnalysis.recommendationFingerprint;
    await saveManWhatsappRecommendationFingerprint({
      context,
      assistantMessageId: assistantMessage.id,
      route: route.intent,
      fingerprint,
      memoryKeysUsed,
    });
  }

  return {
    status: 'replied' as const,
    reportId: context.report.id,
    inboundMessageId: message.id,
    outboundMessageId: sent.messageId ?? null,
    memoriesSaved,
  };
}
