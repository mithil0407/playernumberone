import 'server-only';

// The ICONIK agent's conversation loop.
//
//   message arrives ─► stored, read receipt + "typing…", instant emoji reaction
//                      when a friend would react
//   short pause      ─► if they're still typing, the newest invocation takes over
//   one turn         ─► answers every unanswered message together, with tools:
//                      memory, events, product search, Look pages, interim texts
//   reply            ─► 1-3 bubbles with typing between them, like a person
//   afterwards       ─► reflection writes what was learned into the memory tree;
//                      busy branches are queued for consolidation
//
// A newer message arriving mid-turn supersedes the final reply (interim texts
// already sent stand), and the newer turn answers everything.

import type {
  FunctionTool,
  ResponseInputItem,
  ResponseFunctionToolCall,
} from 'openai/resources/responses/responses';
import {
  loadStylePassport,
  resolveAgentClientByPhone,
  type AgentClient,
  type StylePassport,
} from '@/lib/agentClients';
import { dueNudgeStage, indiaDateString, isValidEventDate } from '@/lib/agentEvents';
import { dispatchAgentWorker } from '@/lib/agentJobs';
import { AGENT_TEXT_MODEL, agentOpenAI, withAgentUsage } from '@/lib/agentLlm';
import { FREE_LIMITS, asksForColourAnalysis, forwardableInvite, isOverDailyMessageCap, parseInviteCode } from '@/lib/agentGrowth';
import { parseColourAnalysis } from '@/lib/agentColourCard';
import { renderColourCard } from '@/lib/agentProductCards';
import {
  chargeShoppingRun,
  creditBalance,
  enrolFreeClient,
  ensureDirectCampaignCode,
  ensureInviteCode,
  ensureMonthlyGrant,
  inboundMessagesToday,
  joinWaitlist,
} from '@/lib/agentGrowthStore';
import {
  ensureMemoryTree,
  loadMemoryNodes,
  markMemoriesRecalled,
  applyMemoryOperations,
  reflectOnTurn,
} from '@/lib/agentMemoryStore';
import {
  MEMORY_BRANCH_KEYS,
  MEMORY_TYPES,
  branchesNeedingConsolidation,
  searchMemories,
  selectMemoriesForTurn,
  type MemoryNode,
} from '@/lib/agentMemoryTree';
import { buildAgentInstructions } from '@/lib/agentPrompt';
import { searchProducts, type ProductCandidate } from '@/lib/agentProductSearch';
import {
  claimEventNudge,
  createLookLink,
  enqueueAgentJob,
  finishTurn,
  hasQueuedJob,
  insertInboundMessage,
  isFirstConversation,
  latestInboundMessage,
  listClientEvents,
  loadThread,
  markMessagesAnswered,
  recentLookActivity,
  recordOutboundMessage,
  saveClientEvent,
  startTurn,
  unansweredInboundMessages,
  updateClientEvent,
  uploadAgentMedia,
  type AgentMessageRow,
} from '@/lib/agentStore';
import {
  NO_REPLY_SENTINEL,
  pickAckReaction,
  splitIntoBubbles,
  typingDelayMs,
} from '@/lib/agentWhatsapp';
import {
  downloadWhatsAppImage,
  sendWhatsAppImageMessage,
  sendWhatsAppReaction,
  sendWhatsAppTextMessage,
  showWhatsAppTypingIndicator,
} from '@/lib/whatsapp';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';
import type { WhatsappInboundMessage } from '@/lib/whatsappPilot';
import type { AgentLine } from '@/lib/agentClients';

const DEBOUNCE_MS = Number(process.env.ICONIK_AGENT_DEBOUNCE_MS) || 2_500;
const TYPING_REFRESH_MS = 20_000;
const MAX_MODEL_CALLS = 8;
const MAX_INTERIM_MESSAGES = 2;

/**
 * Staged rollout. ICONIK_AGENT_ALLOWED_PHONES is "*" for every client with a
 * finished report, and/or a comma list of numbers. Numbers listed by name are
 * the team: they may also test on reports still in review.
 */
export function agentAccessFor(phone: string, env = process.env): { previewReports: boolean } | null {
  if (env.ICONIK_AGENT_ENABLED !== '1') return null;
  const allowed = (env.ICONIK_AGENT_ALLOWED_PHONES ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const normalized = normalizeIndianWhatsappNumber(phone);
  const listed = Boolean(normalized && allowed.some(value => normalizeIndianWhatsappNumber(value) === normalized));
  if (listed) return { previewReports: true };
  return allowed.includes('*') ? { previewReports: false } : null;
}

/** The free tier: people without a Blueprint, by invite (or open signup). */
export function freeTierEnabled(env = process.env) {
  return env.ICONIK_AGENT_ENABLED === '1' && env.ICONIK_AGENT_FREE_ENABLED === '1';
}

export function freeSignupsOpen(env = process.env) {
  return freeTierEnabled(env) && env.ICONIK_AGENT_FREE_OPEN === '1';
}

/** People who message asking for a colour analysis get in without a code (on unless set to "0"). */
export function colourAnalysisOpen(env = process.env) {
  return freeTierEnabled(env) && env.ICONIK_AGENT_OPEN_COLOUR_ANALYSIS !== '0';
}

const WAITLIST_REPLY = "Hey 👋 I'm ICONIK, a personal stylist on WhatsApp. I'm invite-only right now — if a friend sent you an invite code, paste it here. Otherwise you're on the waitlist and I'll let you in soon ✨";
const COLOUR_ANALYSIS_PROMPT_REPLY = "Hey 👋 I'm ICONIK, a personal stylist on WhatsApp. Want your free colour analysis? Reply \"colour analysis\" and I'll get started ✨";
const INVALID_INVITE_REPLY = "That invite code isn't working (it may be used up). Ask your friend for a fresh one — meanwhile you're on the waitlist ✨";
const DAILY_CAP_REPLY = "That's a lot of styling for one day 😄 I'll pick this up with you tomorrow.";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function storeInboundImage(clientId: string, mediaId: string) {
  const downloaded = await downloadWhatsAppImage(mediaId);
  const extension = downloaded.mimeType.split('/')[1] || 'jpg';
  return uploadAgentMedia(clientId, downloaded.bytes, downloaded.mimeType, extension);
}

/**
 * Entry point from the WhatsApp webhook. Existing clients and Blueprint
 * customers are served; with the free tier on, people without a Blueprint join
 * by invite code (or are waitlisted). Returns 'not_served' so the caller can
 * fall back to the Man pilot.
 */
export async function handleAgentInbound(message: WhatsappInboundMessage) {
  const access = agentAccessFor(message.from);
  const free = freeTierEnabled();
  if (!access && !free) return 'not_served' as const;

  let client = await resolveAgentClientByPhone(message.from, { allowPreviewReports: access?.previewReports ?? false });
  if (!client && free) {
    let code = parseInviteCode(message.text);
    if (!code && colourAnalysisOpen() && asksForColourAnalysis(message.text)) code = await ensureDirectCampaignCode();
    const waitlist = code || freeSignupsOpen() ? null : await joinWaitlist(message.from, message.text);
    const usable = code ?? waitlist?.admittedCode ?? null;
    if (!usable && !freeSignupsOpen()) {
      if (waitlist?.shouldReply) {
        await sendWhatsAppTextMessage(message.from, colourAnalysisOpen() ? COLOUR_ANALYSIS_PROMPT_REPLY : WAITLIST_REPLY).catch(() => undefined);
      }
      return 'waitlisted' as const;
    }
    client = await withAgentUsage({ clientId: null, kind: 'other' }, () => enrolFreeClient(message.from, usable));
    if (!client) {
      await joinWaitlist(message.from, message.text);
      await sendWhatsAppTextMessage(message.from, INVALID_INVITE_REPLY).catch(() => undefined);
      return 'invalid_invite' as const;
    }
  }
  if (!client) return 'not_served' as const;
  if (client.status !== 'active') return 'paused' as const;

  let image: { path: string; signedUrl: string | null } | null = null;
  if (message.type === 'image' && message.mediaId) {
    image = await storeInboundImage(client.id, message.mediaId).catch(error => {
      console.error('[agent] image intake failed:', error);
      return null;
    });
  }

  const stored = await insertInboundMessage({
    clientId: client.id,
    kind: message.type === 'image' && !image ? 'unsupported' : message.type,
    content: message.type === 'image' && !image
      ? `${message.text} [the photo did not come through]`
      : message.text,
    whatsappMessageId: message.id,
    imageUrl: image?.signedUrl ?? null,
    storagePath: image?.path ?? null,
    metadata: { whatsapp_timestamp: message.timestamp ?? null },
  });
  if (!stored) return 'duplicate' as const;

  if (client.tier === 'free') {
    const today = await inboundMessagesToday(client.id);
    if (isOverDailyMessageCap(today)) {
      // Say it once, on the first message over the cap; stay quiet after that.
      if (today === FREE_LIMITS.dailyMessages + 1) {
        await sendWhatsAppTextMessage(client.phone, DAILY_CAP_REPLY).catch(() => undefined);
        await recordOutboundMessage({ clientId: client.id, content: DAILY_CAP_REPLY, metadata: { type: 'daily_cap' } });
      }
      await markMessagesAnswered([stored.id], stored.id);
      return 'daily_cap' as const;
    }
  }

  // Instant acknowledgement: read + typing, and a reaction when a person would react.
  const typing = await showWhatsAppTypingIndicator(message.id).catch(() => null);
  if (!typing?.success) console.warn('[agent] typing indicator failed:', typing?.error);
  const ack = pickAckReaction({ text: message.text, hasImage: Boolean(image) });
  const reacted = await sendWhatsAppReaction(client.phone, message.id, ack).catch(() => null);
  if (reacted?.success) {
    await recordOutboundMessage({ clientId: client.id, kind: 'reaction', content: ack, metadata: { reacted_to: message.id } });
  } else {
    console.warn('[agent] acknowledgement reaction failed:', reacted?.error);
  }

  // People send thoughts in pieces. Wait; if a newer message arrived, its invocation answers all.
  await sleep(DEBOUNCE_MS);
  const latest = await latestInboundMessage(client.id);
  if (latest && latest.id !== stored.id) return 'deferred_to_newer_message' as const;

  return runAgentTurn(client);
}

interface TurnState {
  client: AgentClient;
  passport: StylePassport;
  nodes: MemoryNode[];
  turnId: string;
  latestWhatsappId: string;
  candidates: Map<string, ProductCandidate>;
  searchCount: number;
  interimSent: number;
  runCharged: boolean;
  /** Messages sent after the reply bubbles (e.g. the friend invite after a Colour Card). */
  afterReply: Array<{ text: string; metadata: Record<string, unknown> }>;
  toolLog: Array<{ name: string; ok: boolean; summary: string }>;
}

export function agentTools(options: { freeTier: boolean; outfitImages: boolean }): FunctionTool[] {
  const tools: FunctionTool[] = [
    {
      type: 'function',
      name: 'send_message',
      description: 'Send a short WhatsApp message right now, before you finish (a heads-up before slow work, or a natural double-text).',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['text'],
        properties: { text: { type: 'string', description: 'One short bubble.' } },
      },
    },
    {
      type: 'function',
      name: 'react',
      description: "Put an emoji reaction on the client's latest message.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['emoji'],
        properties: { emoji: { type: 'string', description: 'A single emoji.' } },
      },
    },
    {
      type: 'function',
      name: 'recall_memory',
      description: 'Search everything you remember about this client for something not shown in MEMORY.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['query'],
        properties: { query: { type: 'string' } },
      },
    },
    {
      type: 'function',
      name: 'remember',
      description: 'Save something important about the client immediately (a firm rule, a size, an owned item, a person).',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['branch', 'topic', 'memory_type', 'content', 'importance'],
        properties: {
          branch: { type: 'string', enum: [...MEMORY_BRANCH_KEYS] },
          topic: { type: ['string', 'null'], description: 'Optional short slug, e.g. "sizes" or "likes".' },
          memory_type: { type: 'string', enum: [...MEMORY_TYPES] },
          content: { type: 'string', description: 'One standalone sentence.' },
          importance: { type: 'number', description: '0-1; firm rules 0.9.' },
        },
      },
    },
    {
      type: 'function',
      name: 'save_event',
      description: 'Save an occasion the client mentioned that has a date.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['title', 'occasion_type', 'date', 'end_date', 'city', 'role', 'dress_code', 'budget_inr', 'notes', 'reminders_enabled'],
        properties: {
          title: { type: 'string', description: 'e.g. "Brother\'s sangeet"' },
          occasion_type: { type: ['string', 'null'], description: 'wedding, party, work, travel, festival, date…' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          end_date: { type: ['string', 'null'], description: 'YYYY-MM-DD for multi-day events' },
          city: { type: ['string', 'null'] },
          role: { type: ['string', 'null'], description: 'Their role, e.g. bride\'s sister, guest, speaker.' },
          dress_code: { type: ['string', 'null'] },
          budget_inr: { type: ['integer', 'null'] },
          notes: { type: ['string', 'null'] },
          reminders_enabled: { type: 'boolean', description: 'Only true if the client agreed to check-ins.' },
        },
      },
    },
    {
      type: 'function',
      name: 'update_event',
      description: 'Change a saved event (date, details, reminders, or mark it done/cancelled). Use the id shown in EVENTS.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['event_id', 'date', 'status', 'reminders_enabled', 'dress_code', 'budget_inr', 'notes'],
        properties: {
          event_id: { type: 'string' },
          date: { type: ['string', 'null'] },
          status: { type: ['string', 'null'], enum: ['upcoming', 'done', 'cancelled', null] },
          reminders_enabled: { type: ['boolean', 'null'] },
          dress_code: { type: ['string', 'null'] },
          budget_inr: { type: ['integer', 'null'] },
          notes: { type: ['string', 'null'] },
        },
      },
    },
    {
      type: 'function',
      name: 'search_products',
      description: 'Search trusted Indian and global fashion stores, including premium and authorised brand retailers, for specific products. Returns candidates (with ids for present_products) and flags any over budget.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['query', 'colours', 'budget_max_inr', 'stores', 'sports'],
        properties: {
          query: { type: 'string', description: 'Specific garment description, e.g. "olive linen overshirt relaxed fit".' },
          colours: { type: 'array', items: { type: 'string' } },
          budget_max_inr: { type: ['integer', 'null'] },
          stores: { type: 'array', items: { type: 'string' }, description: 'Store names the client asked for (e.g. Myntra, The Collective); empty for any. Put brands in the query.' },
          sports: { type: 'boolean', description: 'True only for performance/sportswear.' },
        },
      },
    },
    {
      type: 'function',
      name: 'present_products',
      description: 'Send your chosen products to the client. Each is first checked on the real store page (stock in their size, price, delivery date to their pincode, returns), then arrives as a numbered product card with a shop link, followed by a short summary. Takes a couple of minutes; you do not list the products yourself.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['title', 'occasion', 'brief', 'size', 'pincode', 'event_id', 'items'],
        properties: {
          title: { type: 'string', description: 'Short, personal: "Your old-money polo".' },
          occasion: { type: ['string', 'null'] },
          brief: { type: 'string', description: 'One line on what they asked for and the constraints (budget, deadline, fit).' },
          size: { type: ['string', 'null'], description: 'The size to check, e.g. "M" or "32". null if unknown.' },
          pincode: { type: ['string', 'null'], description: 'Delivery pincode to check delivery dates against.' },
          event_id: { type: ['string', 'null'] },
          items: {
            type: 'array',
            description: 'Your pick first, then 1-3 alternatives.',
            items: {
              type: 'object', additionalProperties: false, required: ['candidate_id', 'slot', 'reason'],
              properties: {
                candidate_id: { type: 'string' },
                slot: { type: 'string', enum: ['top', 'bottom', 'dress', 'ethnic_set', 'layer', 'shoes', 'bag', 'accessory', 'other'] },
                reason: { type: 'string', description: 'Why it suits them, max 12 words.' },
              },
            },
          },
        },
      },
    },
  ];
  tools.push({
    type: 'function',
    name: 'share_invite',
    description: 'Send the client a ready-to-forward invite message with their personal ICONIK link. Each friend who joins gives both of them extra shopping runs.',
    strict: true,
    parameters: {
      type: 'object', additionalProperties: false, required: ['intro'],
      properties: { intro: { type: 'string', description: 'One short line before the forwardable message, e.g. "Here you go — forward this 👇".' } },
    },
  });
  if (options.freeTier) {
    const swatchList = (description: string) => ({
      type: 'array',
      description,
      items: {
        type: 'object', additionalProperties: false, required: ['name', 'hex'],
        properties: { name: { type: 'string', description: 'Everyday name, e.g. "Rust", "Olive", "Cream".' }, hex: { type: 'string', description: '#RRGGBB' } },
      },
    });
    tools.push({
      type: 'function',
      name: 'send_colour_card',
      description: "Deliver the free colour analysis: saves their colour profile and sends their personal ICONIK Colour Card image (season, undertone, best colours, neutrals, colours to avoid, metal). Call once you have read a clear selfie.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['first_name', 'season', 'undertone', 'depth', 'contrast', 'best_colours', 'neutrals', 'avoid_colours', 'metal', 'caption'],
        properties: {
          first_name: { type: ['string', 'null'] },
          season: { type: 'string', description: 'Seasonal colour family, e.g. "Deep Autumn", "Soft Summer", "Bright Winter".' },
          undertone: { type: 'string', enum: ['warm', 'cool', 'neutral', 'olive'] },
          depth: { type: ['string', 'null'], enum: ['light', 'medium', 'deep', null] },
          contrast: { type: ['string', 'null'], enum: ['low', 'medium', 'high', null] },
          best_colours: swatchList('Exactly 8 colours that light them up, most flattering first.'),
          neutrals: swatchList('3 neutrals to build outfits on.'),
          avoid_colours: swatchList('3 colours to keep away from the face.'),
          metal: { type: ['string', 'null'], enum: ['gold', 'silver', 'both', null] },
          caption: { type: 'string', description: 'Short caption under the card, e.g. "Riya, you\'re a Deep Autumn 🍂".' },
        },
      },
    });
    tools.push({
      type: 'function',
      name: 'save_style_profile',
      description: "Save what you've learned about a client without a Blueprint: from their selfie and answers. Only include what you can see or were told; null otherwise. Call again to refine.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['first_name', 'line', 'undertone', 'season', 'depth', 'contrast', 'best_colours', 'avoid_colours', 'style_vibe', 'fit_notes', 'city', 'budget_band'],
        properties: {
          first_name: { type: ['string', 'null'] },
          line: { type: ['string', 'null'], enum: ['man', 'woman', null], description: 'Shops menswear (man) or womenswear (woman).' },
          undertone: { type: ['string', 'null'], enum: ['warm', 'cool', 'neutral', 'olive', null] },
          season: { type: ['string', 'null'], description: 'Seasonal colour family, e.g. "Deep Autumn".' },
          depth: { type: ['string', 'null'], description: 'light / medium / deep' },
          contrast: { type: ['string', 'null'], description: 'low / medium / high, between skin, hair and eyes.' },
          best_colours: { type: 'array', items: { type: 'string' } },
          avoid_colours: { type: 'array', items: { type: 'string' } },
          style_vibe: { type: ['string', 'null'] },
          fit_notes: { type: ['string', 'null'], description: 'Only what they told you about fit or sizes.' },
          city: { type: ['string', 'null'] },
          budget_band: { type: ['string', 'null'] },
        },
      },
    });
  }
  if (options.outfitImages) {
    tools.push({
      type: 'function',
      name: 'show_outfit_image',
      description: 'Create and send a photo-realistic image of the client wearing an outfit you described.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['outfit'],
        properties: { outfit: { type: 'string', description: 'The full outfit, piece by piece, with colours.' } },
      },
    });
  }
  return tools;
}

async function sendText(state: TurnState, text: string, metadata: Record<string, unknown> = {}) {
  const sent = await sendWhatsAppTextMessage(state.client.phone, text);
  if (!sent.success) throw new Error(sent.error || 'WhatsApp send failed');
  await recordOutboundMessage({
    clientId: state.client.id, content: text, whatsappMessageId: sent.messageId ?? null, turnId: state.turnId, metadata,
  });
}

function nullableString(value: unknown, max = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

async function runTool(state: TurnState, call: ResponseFunctionToolCall): Promise<string> {
  const args = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
  switch (call.name) {
    case 'send_message': {
      if (state.interimSent >= MAX_INTERIM_MESSAGES) return 'Skipped: enough interim messages this turn; put the rest in your final reply.';
      const text = String(args.text ?? '').trim().slice(0, 600);
      if (!text) return 'Nothing to send.';
      await sendText(state, text, { interim: true });
      state.interimSent += 1;
      await showWhatsAppTypingIndicator(state.latestWhatsappId).catch(() => undefined);
      return 'Sent.';
    }
    case 'react': {
      const emoji = String(args.emoji ?? '').trim().slice(0, 8);
      if (!emoji) return 'No emoji given.';
      const sent = await sendWhatsAppReaction(state.client.phone, state.latestWhatsappId, emoji);
      if (sent.success) {
        await recordOutboundMessage({ clientId: state.client.id, kind: 'reaction', content: emoji, turnId: state.turnId });
      }
      return sent.success ? 'Reacted.' : 'Reaction failed.';
    }
    case 'recall_memory': {
      const found = searchMemories(state.nodes, String(args.query ?? ''));
      await markMemoriesRecalled(state.nodes, found.map(node => node.id));
      return found.length
        ? found.map(node => `- [${node.path}] ${node.content}${node.occurredAt ? ` (${node.occurredAt.slice(0, 10)})` : ''}`).join('\n')
        : 'Nothing relevant remembered.';
    }
    case 'remember': {
      const branch = String(args.branch);
      const content = String(args.content ?? '').trim().slice(0, 280);
      if (!(MEMORY_BRANCH_KEYS as readonly string[]).includes(branch) || !content) return 'Invalid memory.';
      const memoryType = (MEMORY_TYPES as readonly string[]).includes(String(args.memory_type))
        ? args.memory_type as typeof MEMORY_TYPES[number]
        : 'fact';
      const applied = await applyMemoryOperations({
        clientId: state.client.id,
        nodes: state.nodes,
        operations: [{
          op: 'add',
          branch: branch as typeof MEMORY_BRANCH_KEYS[number],
          topic: nullableString(args.topic, 40),
          kind: 'fact',
          memoryType,
          content,
          importance: typeof args.importance === 'number' ? Math.max(0, Math.min(1, args.importance)) : 0.6,
          confidence: 0.95,
          validUntil: null,
          occurredAt: null,
        }],
      });
      return applied ? 'Remembered.' : 'Could not save that memory.';
    }
    case 'save_event': {
      if (!isValidEventDate(args.date)) return 'Invalid date: use YYYY-MM-DD.';
      const event = await saveClientEvent(state.client.id, {
        title: String(args.title ?? 'Event').slice(0, 120),
        occasion_type: nullableString(args.occasion_type, 40),
        event_date: args.date,
        end_date: isValidEventDate(args.end_date) ? args.end_date : null,
        city: nullableString(args.city, 80),
        role: nullableString(args.role, 80),
        dress_code: nullableString(args.dress_code, 120),
        budget_inr: typeof args.budget_inr === 'number' ? Math.round(args.budget_inr) : null,
        notes: nullableString(args.notes, 400),
        reminders_enabled: args.reminders_enabled === true,
      });
      return `Saved event ${event.id}.`;
    }
    case 'update_event': {
      const fields: Record<string, unknown> = {};
      if (isValidEventDate(args.date)) fields.event_date = args.date;
      if (args.status === 'upcoming' || args.status === 'done' || args.status === 'cancelled') fields.status = args.status;
      if (typeof args.reminders_enabled === 'boolean') fields.reminders_enabled = args.reminders_enabled;
      if (nullableString(args.dress_code)) fields.dress_code = nullableString(args.dress_code, 120);
      if (typeof args.budget_inr === 'number') fields.budget_inr = Math.round(args.budget_inr);
      if (nullableString(args.notes)) fields.notes = nullableString(args.notes, 400);
      const updated = await updateClientEvent(state.client.id, String(args.event_id), fields);
      return updated ? 'Event updated.' : 'No such event.';
    }
    case 'search_products': {
      if (!state.runCharged) {
        const charge = await chargeShoppingRun(state.client, state.turnId);
        if (!charge.ok) {
          return charge.reason === 'no_runs'
            ? "OUT OF SHOPPING RUNS: don't search. Tell them warmly they've used this month's free product hunts, and offer two ways to get more: invite friends (both get +2 runs, use share_invite) or the ICONIK Blueprint for unlimited runs and a full analysis. You can still give styling advice without searching."
            : "Product search is paused for today because of high demand. Don't search; give styling advice instead and offer to hunt products tomorrow.";
        }
        state.runCharged = true;
      }
      state.searchCount += 1;
      const found = await withAgentUsage({ clientId: state.client.id, kind: 'search' }, () => searchProducts({
        line: state.client.line ?? 'woman',
        query: String(args.query ?? '').slice(0, 200),
        colours: Array.isArray(args.colours) ? args.colours.map(String).slice(0, 5) : [],
        budgetMaxInr: typeof args.budget_max_inr === 'number' ? args.budget_max_inr : null,
        retailerNames: Array.isArray(args.stores) ? args.stores.map(String) : [],
        sports: args.sports === true,
        idPrefix: `s${state.searchCount}c`,
      }));
      for (const candidate of found) state.candidates.set(candidate.id, candidate);
      if (!found.length) return 'No strong matches. Try a different description, colour or store — or tell the client honestly.';
      const budget = typeof args.budget_max_inr === 'number' ? args.budget_max_inr : null;
      return found.map(candidate => {
        const overBudget = budget && candidate.priceInr && candidate.priceInr > budget ? ' — OVER BUDGET' : '';
        return `${candidate.id}: ${candidate.title} — ${candidate.retailer}${candidate.priceInr ? ` — ₹${candidate.priceInr}` : ' — price unknown'}${overBudget}${candidate.colour ? ` — ${candidate.colour}` : ''}${candidate.note ? ` — ${candidate.note}` : ''}`;
      }).join('\n');
    }
    case 'present_products': {
      const items = (Array.isArray(args.items) ? args.items : [])
        .map(raw => raw as Record<string, unknown>)
        .map(item => ({ item, candidate: state.candidates.get(String(item.candidate_id)) }))
        .filter((entry): entry is { item: Record<string, unknown>; candidate: ProductCandidate } => Boolean(entry.candidate))
        .slice(0, 4);
      if (!items.length) return 'None of those candidate ids exist. Use ids returned by search_products.';
      const pincode = typeof args.pincode === 'string' && /^\d{6}$/.test(args.pincode.trim()) ? args.pincode.trim() : null;
      const link = await createLookLink({
        clientId: state.client.id,
        title: String(args.title ?? 'Your picks').slice(0, 80),
        occasion: nullableString(args.occasion, 80),
        intro: nullableString(args.brief, 400),
        eventId: nullableString(args.event_id, 40),
        items: items.map(({ item, candidate }) => ({
          slot: String(item.slot ?? 'other'),
          title: candidate.title,
          retailer: candidate.retailer,
          url: candidate.url,
          imageUrl: candidate.imageUrl,
          priceInr: candidate.priceInr,
          colour: candidate.colour,
          reason: nullableString(item.reason, 120),
        })),
      });
      await enqueueAgentJob('verify_look_link', state.client.id, {
        look_link_id: link.id,
        slug: link.slug,
        size: nullableString(args.size, 20),
        pincode,
        brief: nullableString(args.brief, 300),
      });
      await dispatchAgentWorker();
      return `Checking ${items.length} product${items.length === 1 ? '' : 's'} on the store pages now; the cards and summary will be sent automatically when done. In your reply, tell them in one short line what you're checking (size${pincode ? `, delivery to ${pincode}` : ''}) and roughly how long — don't list the products.`;
    }
    case 'share_invite': {
      const invite = await ensureInviteCode(state.client);
      if (invite.remaining <= 0) return 'All their invites have been used. Tell them, and thank them for spreading the word.';
      const intro = String(args.intro ?? '').trim().slice(0, 200) || 'Here you go — forward this to a friend 👇';
      await sendText(state, intro, { type: 'invite_intro' });
      const season = typeof state.client.lite_profile?.season === 'string' ? state.client.lite_profile.season : null;
      await sendText(state, forwardableInvite({ code: invite.code, link: invite.link, inviterName: state.passport.firstName, season }), { type: 'invite', code: invite.code });
      state.interimSent += 2;
      return `Sent their invite (${invite.code}); ${invite.remaining} friend${invite.remaining === 1 ? '' : 's'} can still join with it. Don't repeat the link in your reply.`;
    }
    case 'send_colour_card': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report already has their colours.';
      const firstName = nullableString(args.first_name, 40) ?? state.client.first_name;
      const analysis = parseColourAnalysis(args, firstName);
      if (!analysis) return 'The colour analysis is incomplete: give a season, an undertone and 8 best colours with valid #RRGGBB hex codes.';
      const profile: Record<string, unknown> = {
        ...(state.client.lite_profile ?? {}),
        season: analysis.season,
        undertone: analysis.undertone,
        depth: analysis.depth,
        contrast: analysis.contrast,
        best_colours: analysis.best.map(swatch => swatch.name),
        neutrals: analysis.neutrals.map(swatch => swatch.name),
        avoid_colours: analysis.avoid.map(swatch => swatch.name),
        metal: analysis.metal,
        colour_card_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('agent_clients')
        .update({ lite_profile: profile, first_name: firstName, updated_at: new Date().toISOString() })
        .eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: profile, first_name: firstName };

      const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
      const imageUrl = await renderColourCard(state.client.id, analysis, dateLabel).catch(error => {
        console.error('[agent] colour card render failed:', error);
        return null;
      });
      const caption = String(args.caption ?? '').trim().slice(0, 200) || `${firstName ? `${firstName}, you're` : "You're"} a ${analysis.season} 🎨`;
      if (imageUrl) {
        const sent = await sendWhatsAppImageMessage(state.client.phone, imageUrl, caption);
        if (sent.success) {
          await recordOutboundMessage({
            clientId: state.client.id, kind: 'image', content: caption, imageUrl, whatsappMessageId: sent.messageId ?? null,
            turnId: state.turnId, metadata: { type: 'colour_card', season: analysis.season },
          });
        }
      } else {
        await sendText(state, `${caption}\n\nYour best colours: ${analysis.best.map(swatch => swatch.name).join(', ')}.`, { type: 'colour_card', season: analysis.season });
      }
      state.interimSent += 1;

      // Right after the wow, the forwardable invite: friends want theirs, and each one earns more hunts.
      const invite = await ensureInviteCode(state.client).catch(() => null);
      if (invite && invite.remaining > 0) {
        state.afterReply.push(
          { text: `Your friends will want theirs 😄 Forward this — every friend who joins gets you +${FREE_LIMITS.referralBonus} more product hunts (and them too).`, metadata: { type: 'invite_intro' } },
          { text: forwardableInvite({ code: invite.code, link: invite.link, inviterName: firstName, season: analysis.season }), metadata: { type: 'invite', code: invite.code } },
        );
      }
      return `Colour Card sent and profile saved (no need to call save_style_profile). Now reply in exactly 2 short bubbles, separated by a blank line:
1) The wow: what you saw (e.g. golden warmth along the jaw, deep brown eyes, the contrast with their hair) and one surprising, specific insight — a colour they very likely wear that drains them and the swap that does the same job but lights them up.
2) The hook that makes them want more: one irresistible next step — e.g. "Want me to find 3 pieces in your power colour under ₹2,000?" or a look for something coming up. Make it a question.
Do not mention invites or codes: the forwardable invite is sent automatically right after your reply.`;
    }
    case 'save_style_profile': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report is the profile.';
      const profile: Record<string, unknown> = { ...(state.client.lite_profile ?? {}) };
      for (const key of ['undertone', 'season', 'depth', 'contrast', 'style_vibe', 'fit_notes', 'city', 'budget_band'] as const) {
        const value = nullableString(args[key], 200);
        if (value) profile[key] = value;
      }
      for (const key of ['best_colours', 'avoid_colours'] as const) {
        const list = Array.isArray(args[key]) ? (args[key] as unknown[]).map(String).filter(Boolean).slice(0, 12) : [];
        if (list.length) profile[key] = list;
      }
      profile.updated_at = new Date().toISOString();
      const line = args.line === 'man' || args.line === 'woman' ? args.line as AgentLine : state.client.line;
      const firstName = nullableString(args.first_name, 40) ?? state.client.first_name;
      const { error } = await supabaseAdmin.from('agent_clients')
        .update({ lite_profile: profile, line, first_name: firstName, updated_at: new Date().toISOString() })
        .eq('id', state.client.id);
      if (error) return 'Could not save the profile.';
      state.client = { ...state.client, lite_profile: profile, line, first_name: firstName };
      return 'Saved. Use it for every recommendation from now on.';
    }
    case 'show_outfit_image': {
      if (state.client.line !== 'man' || !state.client.report_share_token) return 'Images are not available for this client yet.';
      const { loadManEditReportContext, generateManEditOutfitImage, uploadManEditChatImageBytes } = await import('@/lib/manEdit');
      const context = await loadManEditReportContext(state.client.report_share_token, false);
      if (!context) return 'Could not load their report for the image.';
      const outfit = String(args.outfit ?? '').slice(0, 800);
      const generated = await generateManEditOutfitImage({ context, request: outfit, outfitDirection: outfit });
      const uploaded = await uploadManEditChatImageBytes(context.report.id, generated.bytes, generated.mimeType, 'agent-outfit.png');
      if (!uploaded.signedUrl) return 'The image could not be stored.';
      const sent = await sendWhatsAppImageMessage(state.client.phone, uploaded.signedUrl);
      if (!sent.success) return 'The image could not be sent.';
      await recordOutboundMessage({
        clientId: state.client.id, kind: 'image', content: outfit, imageUrl: uploaded.signedUrl,
        whatsappMessageId: sent.messageId ?? null, turnId: state.turnId,
      });
      return 'Image sent. Keep your text reply short — the picture speaks.';
    }
    default:
      return `Unknown tool ${call.name}.`;
  }
}

function threadToInput(thread: AgentMessageRow[], pendingIds: Set<string>): ResponseInputItem[] {
  const input: ResponseInputItem[] = [];
  for (const message of thread) {
    if (pendingIds.has(message.id)) continue;
    const text = message.kind === 'image'
      ? `[sent a photo] ${message.content}`
      : message.content;
    if (!text.trim()) continue;
    input.push({ role: message.direction === 'inbound' ? 'user' : 'assistant', content: text });
  }
  return input;
}

function pendingToInput(pending: AgentMessageRow[]): ResponseInputItem {
  const content: Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string; detail: 'auto' }> = [];
  for (const message of pending) {
    if (message.image_url && message.kind === 'image') {
      content.push({ type: 'input_image', image_url: message.image_url, detail: 'auto' });
    }
    content.push({ type: 'input_text', text: message.content || '[photo]' });
  }
  return { role: 'user', content };
}

async function lookActivitySummary(clientId: string) {
  const links = await recentLookActivity(clientId);
  return links.map(link => {
    const events = (link.look_link_events ?? []) as Array<{ type: string; item_id: string | null }>;
    const items = (link.look_link_items ?? []) as Array<{ id: string; title: string }>;
    const titleOf = (id: string | null) => items.find(item => item.id === id)?.title ?? 'a piece';
    const liked = events.filter(event => event.type === 'like' || event.type === 'save').map(event => titleOf(event.item_id));
    const disliked = events.filter(event => event.type === 'dislike').map(event => titleOf(event.item_id));
    const clicked = events.filter(event => event.type === 'click_out').map(event => titleOf(event.item_id));
    const votes = new Map<string, number>();
    for (const event of events.filter(entry => entry.type === 'vote')) {
      const title = titleOf(event.item_id);
      votes.set(title, (votes.get(title) ?? 0) + 1);
    }
    const views = events.filter(event => event.type === 'view').length;
    return `- "${link.title}" (${String(link.created_at).slice(0, 10)}): ${views} views`
      + `${liked.length ? `; liked/saved: ${[...new Set(liked)].join(', ')}` : ''}`
      + `${disliked.length ? `; disliked: ${[...new Set(disliked)].join(', ')}` : ''}`
      + `${clicked.length ? `; went to store for: ${[...new Set(clicked)].join(', ')}` : ''}`
      + `${votes.size ? `; friends voted: ${[...votes].map(([title, count]) => `${title} (${count})`).join(', ')}` : ''}`;
  }).join('\n');
}

export function runAgentTurn(client: AgentClient) {
  return withAgentUsage({ clientId: client.id, kind: 'chat' }, () => runAgentTurnInner(client));
}

async function runAgentTurnInner(client: AgentClient) {
  const pending = await unansweredInboundMessages(client.id);
  if (!pending.length) return 'nothing_to_answer' as const;
  const latestPending = pending[pending.length - 1];
  const latestWhatsappId = latestPending.whatsapp_message_id ?? '';
  const turnId = await startTurn(client.id, pending.map(message => message.id), AGENT_TEXT_MODEL);

  const typing = setInterval(() => {
    if (latestWhatsappId) void showWhatsAppTypingIndicator(latestWhatsappId).catch(() => undefined);
  }, TYPING_REFRESH_MS);

  const state: TurnState = {
    client,
    passport: null as unknown as StylePassport,
    nodes: [],
    turnId,
    latestWhatsappId,
    candidates: new Map(),
    searchCount: 0,
    interimSent: 0,
    runCharged: false,
    afterReply: [],
    toolLog: [],
  };

  try {
    await ensureMemoryTree(client.id);
    const [passport, nodes, thread, events, firstConversation, lookActivity] = await Promise.all([
      loadStylePassport(client),
      loadMemoryNodes(client.id),
      loadThread(client.id, 40),
      listClientEvents(client.id),
      isFirstConversation(client.id),
      lookActivitySummary(client.id),
    ]);
    state.passport = passport;
    state.nodes = nodes;

    const freeTier = client.tier === 'free';
    if (freeTier) await ensureMonthlyGrant(client);
    const [runsLeft, invite] = await Promise.all([
      freeTier ? creditBalance(client.id) : Promise.resolve(null),
      ensureInviteCode(client).catch(() => null),
    ]);

    const clientText = pending.map(message => message.content).join('\n');
    const memory = selectMemoriesForTurn(nodes, clientText);
    void markMemoriesRecalled(nodes, memory.recalledIds);

    const instructions = buildAgentInstructions({
      line: client.line,
      firstName: passport.firstName,
      today: indiaDateString(),
      profile: passport.profile,
      reportUrl: passport.reportUrl,
      memoryText: memory.text,
      events,
      lookActivity,
      firstConversation,
      canShowOutfitImages: client.line === 'man' && Boolean(client.report_share_token),
      tier: client.tier,
      runsLeft,
      invitesLeft: invite?.remaining ?? 0,
      blueprintUrl: new URL(client.line === 'man' ? '/man' : '/', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro').toString(),
    });

    const pendingIds = new Set(pending.map(message => message.id));
    let input: ResponseInputItem[] = [...threadToInput(thread, pendingIds), pendingToInput(pending)];
    const tools = agentTools({ freeTier, outfitImages: client.line === 'man' && Boolean(client.report_share_token) });
    let reply = '';

    for (let call = 0; call < MAX_MODEL_CALLS; call += 1) {
      const response = await agentOpenAI().responses.create({
        model: AGENT_TEXT_MODEL,
        instructions,
        input,
        tools,
        reasoning: { effort: 'medium' },
        include: ['reasoning.encrypted_content'],
        max_output_tokens: 4_000,
        store: false,
        metadata: { workload: 'iconik_agent_turn' },
      });
      const calls = response.output.filter((item): item is ResponseFunctionToolCall => item.type === 'function_call');
      input = [...input, ...(response.output as ResponseInputItem[])];
      if (!calls.length) {
        reply = response.output_text.trim();
        break;
      }
      for (const toolCall of calls) {
        let output: string;
        try {
          output = await runTool(state, toolCall);
          state.toolLog.push({ name: toolCall.name, ok: true, summary: output.slice(0, 200) });
        } catch (error) {
          output = `Tool failed: ${error instanceof Error ? error.message : 'unknown error'}. Carry on without it and be honest with the client if it matters.`;
          state.toolLog.push({ name: toolCall.name, ok: false, summary: output.slice(0, 200) });
        }
        input.push({ type: 'function_call_output', call_id: toolCall.call_id, output });
      }
    }

    // A newer message arrived while we worked: its turn will answer everything.
    const latest = await latestInboundMessage(client.id);
    if (latest && latest.id !== latestPending.id) {
      await finishTurn(turnId, 'superseded', { toolCalls: state.toolLog });
      return 'superseded' as const;
    }

    const bubbles = reply.trim() === NO_REPLY_SENTINEL ? [] : splitIntoBubbles(reply);
    if (!bubbles.length && reply.trim() !== NO_REPLY_SENTINEL && !state.interimSent) {
      bubbles.push('Sorry — I lost my train of thought there. Can you send that again?');
    }
    for (const [index, bubble] of bubbles.entries()) {
      if (index > 0) {
        await showWhatsAppTypingIndicator(latestWhatsappId).catch(() => undefined);
        await sleep(typingDelayMs(bubble));
      }
      await sendText(state, bubble);
    }
    for (const extra of state.afterReply) {
      await showWhatsAppTypingIndicator(latestWhatsappId).catch(() => undefined);
      await sleep(typingDelayMs(extra.text));
      await sendText(state, extra.text, extra.metadata).catch(error => console.warn('[agent] follow-up not sent:', error));
    }

    await markMessagesAnswered(pending.map(message => message.id), turnId);
    await finishTurn(turnId, 'completed', { toolCalls: state.toolLog });
    clearInterval(typing);

    // Check-ins that were due were raised in this conversation; don't raise them again.
    for (const event of events) {
      const stage = dueNudgeStage(event);
      if (stage) await claimEventNudge(event, stage.key);
    }

    // Afterwards: remember what was learned, and consolidate busy branches in the background.
    try {
      const fresh = await loadMemoryNodes(client.id);
      await withAgentUsage({ clientId: client.id, kind: 'memory' }, () => reflectOnTurn({
        clientId: client.id,
        nodes: fresh,
        clientMessages: clientText,
        assistantReply: bubbles.join('\n\n'),
        sourceMessageIds: pending.map(message => message.id),
      }));
      const after = await loadMemoryNodes(client.id);
      if (branchesNeedingConsolidation(after).length && !await hasQueuedJob('consolidate_memory', client.id)) {
        await enqueueAgentJob('consolidate_memory', client.id, {}, new Date(Date.now() + 10 * 60 * 1000));
      }
    } catch (error) {
      console.warn('[agent] memory reflection failed:', error);
    }
    return 'replied' as const;
  } catch (error) {
    console.error('[agent] turn failed:', error);
    await finishTurn(turnId, 'failed', { toolCalls: state.toolLog, error: error instanceof Error ? error.message : String(error) });
    await sendText(state, 'Something went wrong on my side — give me a moment and send that again?').catch(() => undefined);
    await markMessagesAnswered(pending.map(message => message.id), turnId);
    return 'failed' as const;
  } finally {
    clearInterval(typing);
  }
}
