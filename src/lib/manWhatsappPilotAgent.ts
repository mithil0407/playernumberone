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
import { routeManWhatsappRequest } from '@/lib/manWhatsappStylist';
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
  type IconikManWhatsappPilotConfig,
  type WhatsappInboundMessage,
} from '@/lib/whatsappPilot';

type AnyRecord = Record<string, unknown>;

const MEMORY_METADATA_TYPE = 'iconik_man_style_memory_v1';
const PILOT_CHANNEL = 'iconik_man_whatsapp_pilot';

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

  const caption = 'Here’s that look on you. I’ve kept it aligned with the colours, fit and layers we just discussed.';
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
      'For this first pilot, send me a text or a mirror selfie. I can help with an occasion, explain your report, or review what you’re wearing.',
    );
    return { status: 'unsupported' as const };
  }

  const context = await loadPilotContext(config);
  if (!context) {
    await sendPilotText(
      config.phone,
      `I’m connected, ${config.firstName}, but I can’t see your completed ICONIK Man report yet. Once you’ve created it with ${config.email}, message me here again and I’ll pick it up automatically.`,
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
        'I couldn’t read that image clearly. Please resend it as a regular WhatsApp photo—ideally full length, in natural light, with the outfit visible head to toe.',
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
    .select('id')
    .single();

  if (userError || !userMessage) throw new Error(userError?.message || 'Could not save pilot message');

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
  let reply: string;
  if (imageRequested && conversationReference) {
    reply = 'Absolutely — I’m turning that exact outfit into a visual for you now.';
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
        'I hit a temporary issue while checking current retailer pages. Send the retailer and item once more in a moment—I’ve kept the outfit we were discussing.',
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
        'I hit a temporary issue while reading your style profile. Send that once more in a moment—I’ve kept your message.',
      );
      return { status: 'generation_failed' as const };
    }
  }
  reply = formatWhatsappStylistReply(reply);

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

  if (imageRequested) {
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
        'My image studio hit a temporary issue, but the outfit direction above is still the one I recommend. Ask me to generate the visual again in a moment.',
      );
    }
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
