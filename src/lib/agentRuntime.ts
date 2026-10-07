import 'server-only';

// The ICONIK agent's conversation loop.
//
//   message arrives ─► stored at once (photos download after), emoji reaction,
//                      then "typing…" kept up until the reply
//   short pause      ─► if they're still typing, the newest invocation takes over
//   one turn         ─► answers every unanswered message together, with tools:
//                      memory, events, product search, Look pages, interim texts
//   reply            ─► 1-3 bubbles with typing between them, like a person
//   afterwards       ─► reflection writes what was learned into the memory tree;
//                      busy branches are queued for consolidation
//
// One turn runs at a time per client. A newer message stops a turn that hasn't
// sent anything yet, and the newer turn answers everything. A turn that already
// sent something (a Colour Card, a heads-up) finishes its reply first, then the
// newer turn answers what came after.

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
import {
  BETTER_BODY_PHOTO_ASK,
  BODY_PHOTO_RECEIVED_MESSAGE,
  FREE_LIMITS,
  SELFIE_RECEIVED_MESSAGE,
  asksForBodyShapeAnalysis,
  asksForColourAnalysis,
  bodyPhotoAskMessage,
  forwardableInvite,
  inviteUnlockIntro,
  isBodyOpenerMessage,
  isOpenerMessage,
  isOverDailyMessageCap,
  outOfPhotoChecksMessage,
  ownInviteReply,
  parseInviteCode,
  photoCheckAllowance,
  photoChecksCountFrom,
  selfieAskMessage,
  stillOutOfPhotoChecksMessage,
} from '@/lib/agentGrowth';
import { BODY_SHAPES, bodyCardPending, bodyProfileFields, bodyShapeKey, parseBodyAnalysis } from '@/lib/agentBodyCard';
import { BODY_LINK_QUESTION, bodyOutfitMessage, lookBullets, lookText, pickBodyLooks } from '@/lib/agentBodyOutfit';
import { parseColourAnalysis } from '@/lib/agentColourCard';
import { prewarmCardBrowser, renderBodyCard, renderColourCard } from '@/lib/agentProductCards';
import {
  chargeShoppingRun,
  creditBalance,
  enrolFreeClient,
  ensureDirectCampaignCode,
  ensureInviteCode,
  ensureMonthlyGrant,
  friendsJoined,
  inboundMessagesToday,
  inviteOwner,
  joinWaitlist,
  photoChecksUsed,
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
import { forwardableOccasionInvite, lookResponseFromText, occasionCampaign, parseLookButtonPayload } from '@/lib/agentOccasionLooks';
import { findOccasionOutfit, loadOccasionLibrary, occasionOutfitText, shortlistOccasionOutfits } from '@/lib/agentOccasionLibrary';
import { activeOccasionLookFor, noteOccasionLookResponse, revealOccasionLook } from '@/lib/agentOccasionLookStore';
import { searchProducts, type ProductCandidate } from '@/lib/agentProductSearch';
import {
  attachInboundImage,
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
  sentRecently,
  startTurn,
  turnShouldWait,
  unansweredInboundMessages,
  updateClientEvent,
  uploadAgentMedia,
  type AgentMessageRow,
} from '@/lib/agentStore';
import {
  MAX_REPLY_BUBBLES,
  NO_REPLY_SENTINEL,
  pickAckReaction,
  remainingTypingDelayMs,
  splitIntoBubbles,
  teamTestCommand,
} from '@/lib/agentWhatsapp';
import {
  downloadWhatsAppImage,
  sendWhatsAppImageInOrder,
  sendWhatsAppReaction,
  sendWhatsAppTextMessage,
  showWhatsAppTypingIndicator,
} from '@/lib/whatsapp';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';
import type { WhatsappInboundMessage } from '@/lib/whatsappPilot';
import type { AgentLine } from '@/lib/agentClients';

const DEBOUNCE_MS = Number(process.env.ICONIK_AGENT_DEBOUNCE_MS) || 2_500;
// WhatsApp hides "typing…" after ~25s; refresh well before that.
const TYPING_REFRESH_MS = 9_000;
// How long a turn waits for the previous one (or a photo still downloading).
const TURN_WAIT_MAX_MS = 150_000;
const TURN_WAIT_POLL_MS = 1_000;
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
const TEAM_TEST_REPLIES = {
  free: 'Test mode: you are now a fresh free user with no colour profile. Send "colour analysis" to start (send "blueprint mode" to switch back).',
  blueprint: 'Test mode off: you are back on your Blueprint.',
} as const;

const BETTER_SELFIE_ASK = "For your Colour Card I need a close selfie — face to the camera, no sunglasses or filter — so I can read your skin, eyes and hair 📸 Send one and it'll be ready in under a minute.";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Keeps "typing…" on screen while we work. WhatsApp hides it after ~25 seconds
 * and whenever we send anything (a reaction too), so it is re-sent on a timer
 * and right after every mid-turn send. stop() waits for a call in flight, so a
 * late "typing…" can't appear after the final bubble.
 */
class TypingKeepalive {
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight: Promise<unknown> = Promise.resolve();

  constructor(private readonly messageId: string) {}

  start() {
    if (!this.messageId) return;
    this.show();
    this.restartTimer();
  }

  /** After a send: show it again now, and count the next refresh from here. */
  bump() {
    if (!this.timer) return;
    this.show();
    this.restartTimer();
  }

  show() {
    if (!this.messageId) return;
    this.inFlight = showWhatsAppTypingIndicator(this.messageId).then(result => {
      if (!result.success) console.warn('[agent] typing indicator failed:', result.error);
    }).catch(() => undefined);
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.inFlight;
  }

  private restartTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.show(), TYPING_REFRESH_MS);
  }
}

/**
 * A team number in free test mode (see teamTestCommand) is served as a free
 * client; its stored tier is untouched, so "blueprint mode" switches it back.
 */
function asServedClient(client: AgentClient, team: boolean): AgentClient {
  return team && client.tier !== 'free' && client.lite_profile?.free_test === true
    ? { ...client, tier: 'free' }
    : client;
}

/** A free client who hasn't had their Colour Card yet: the first wow is still ahead. */
function awaitingColourCard(client: AgentClient) {
  const profile = client.lite_profile ?? {};
  return client.tier === 'free' && !profile.colour_card_at
    && !(Array.isArray(profile.best_colours) && profile.best_colours.length);
}

/**
 * They asked for their Body Card: from here until the card goes out, a photo is
 * their body photo. Only the first request counts; a finished card isn't reopened
 * by someone mentioning it.
 */
async function markBodyShapeAsk(client: AgentClient): Promise<AgentClient> {
  const profile = { ...(client.lite_profile ?? {}), body_ask_at: new Date().toISOString() };
  const { error } = await supabaseAdmin.from('agent_clients')
    .update({ lite_profile: profile, updated_at: new Date().toISOString() })
    .eq('id', client.id);
  if (error) console.warn('[agent] could not note the body card request:', error.message);
  return { ...client, lite_profile: profile };
}

// Messages that usually need no reply beyond the emoji ("thanks!"): no "typing…"
// for these, or it would hang on screen with nothing coming.
const LIKELY_NO_REPLY = /^(?:ok(?:ay)?|k+|thanks+|thank you|thx|ty|tysm|cool|great|nice|done|sure|👍|🙏|❤️|😊|🙂)[\s!.]*$/i;

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
    if (!code && colourAnalysisOpen() && (asksForColourAnalysis(message.text) || asksForBodyShapeAnalysis(message.text))) code = await ensureDirectCampaignCode();
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
  const team = access?.previewReports === true;
  const testMode = team ? teamTestCommand(message.text) : null;
  if (testMode) {
    await supabaseAdmin.from('agent_clients')
      .update({ lite_profile: testMode === 'free' ? { free_test: true } : {}, updated_at: new Date().toISOString() })
      .eq('id', client.id);
    await sendWhatsAppTextMessage(client.phone, TEAM_TEST_REPLIES[testMode]).catch(() => undefined);
    return 'test_mode' as const;
  }
  client = asServedClient(client, team);

  // Stored straight away, so it keeps its place in the conversation; a photo is
  // attached once it has downloaded.
  const hasPhoto = message.type === 'image' && Boolean(message.mediaId);
  const metadata: Record<string, unknown> = { whatsapp_timestamp: message.timestamp ?? null };
  if (message.payload) metadata.button_payload = message.payload;
  const stored = await insertInboundMessage({
    clientId: client.id,
    kind: message.type === 'image' && !hasPhoto ? 'unsupported' : message.type,
    content: message.type === 'image' && !hasPhoto
      ? `${message.text} [the photo did not come through]`.trim()
      : message.text,
    whatsappMessageId: message.id,
    metadata: hasPhoto ? { ...metadata, media_pending: true } : metadata,
  });
  if (!stored) return 'duplicate' as const;

  // Tapping their own invite link sends us their own code: explain it, no model call.
  const sentCode = parseInviteCode(message.text);
  if (sentCode && await inviteOwner(sentCode) === client.id) {
    const reply = ownInviteReply(await friendsJoined(client.id));
    const sent = await sendWhatsAppTextMessage(client.phone, reply).catch(() => null);
    if (sent?.success) {
      await recordOutboundMessage({ clientId: client.id, content: reply, whatsappMessageId: sent.messageId ?? null, metadata: { type: 'own_invite' } });
    }
    await markMessagesAnswered([stored.id], stored.id);
    return 'own_invite' as const;
  }

  if (client.tier === 'free') {
    const today = await inboundMessagesToday(client.id);
    if (isOverDailyMessageCap(today)) {
      // Say it once, on the first message over the cap; stay quiet after that.
      if (today === FREE_LIMITS.dailyMessages + 1) {
        await sendWhatsAppTextMessage(client.phone, DAILY_CAP_REPLY).catch(() => undefined);
        await recordOutboundMessage({ clientId: client.id, content: DAILY_CAP_REPLY, metadata: { type: 'daily_cap' } });
      }
      if (hasPhoto) await attachInboundImage(stored.id, null, metadata, `${message.text} [photo not kept: daily limit]`.trim());
      await markMessagesAnswered([stored.id], stored.id);
      return 'daily_cap' as const;
    }
  }

  // Asking for the Body Card (the campaign link, or in their own words) opens it.
  if (client.tier === 'free' && !client.lite_profile?.body_card_at && !bodyCardPending(client.lite_profile)
    && asksForBodyShapeAnalysis(message.text)) {
    client = await markBodyShapeAsk(client);
  }

  // People send thoughts in pieces: the pause starts now, while we acknowledge
  // and the photo downloads. If a newer message arrives, its invocation answers all.
  const pause = sleep(DEBOUNCE_MS);
  const typing = new TypingKeepalive(message.id);
  const servedClient = client;
  const acknowledged = (async () => {
    // The reaction first: sending anything hides "typing…", so it goes up after.
    const ack = pickAckReaction({ text: message.text, hasImage: hasPhoto });
    const reacted = await sendWhatsAppReaction(servedClient.phone, message.id, ack).catch(() => null);
    // The body photo for the Body Card: say straight away that the reading has started.
    if (hasPhoto && servedClient.tier === 'free' && bodyCardPending(servedClient.lite_profile)) {
      if (!await sentRecently(servedClient.id, 'body_photo_received', 3 * 60_000)) {
        const sent = await sendWhatsAppTextMessage(servedClient.phone, BODY_PHOTO_RECEIVED_MESSAGE).catch(() => null);
        if (sent?.success) {
          await recordOutboundMessage({
            clientId: servedClient.id, content: BODY_PHOTO_RECEIVED_MESSAGE, whatsappMessageId: sent.messageId ?? null, metadata: { type: 'body_photo_received' },
          });
        }
      }
    // The selfie for the Colour Card: say straight away that the reading has started.
    } else if (hasPhoto && awaitingColourCard(servedClient) && !await sentRecently(servedClient.id, 'selfie_received', 3 * 60_000)) {
      const sent = await sendWhatsAppTextMessage(servedClient.phone, SELFIE_RECEIVED_MESSAGE).catch(() => null);
      if (sent?.success) {
        await recordOutboundMessage({
          clientId: servedClient.id, content: SELFIE_RECEIVED_MESSAGE, whatsappMessageId: sent.messageId ?? null, metadata: { type: 'selfie_received' },
        });
      }
    }
    if (hasPhoto || !LIKELY_NO_REPLY.test(message.text)) typing.start();
    if (reacted?.success) {
      await recordOutboundMessage({ clientId: servedClient.id, kind: 'reaction', content: ack, metadata: { reacted_to: message.id } });
    } else {
      console.warn('[agent] acknowledgement reaction failed:', reacted?.error);
    }
  })().catch(error => console.warn('[agent] acknowledgement failed:', error));
  const photoAttached = hasPhoto
    ? storeInboundImage(servedClient.id, message.mediaId!)
      .catch(error => {
        console.error('[agent] image intake failed:', error);
        return null;
      })
      .then(image => attachInboundImage(stored.id, image, metadata, `${message.text} [the photo did not come through]`.trim()))
    : Promise.resolve();

  // Answers to an occasion look (a button tap or the email's typed text) are tracked.
  const lookNoted = noteOccasionLookResponse(servedClient, message)
    .catch(error => console.warn('[agent] could not note the look response:', error));

  try {
    await Promise.all([pause, acknowledged, photoAttached, lookNoted]);
    const latest = await latestInboundMessage(client.id);
    if (latest && latest.id !== stored.id) return 'deferred_to_newer_message' as const;
    // He was told an occasion look is ready: draw it now that he's here. If all he
    // said was "show me", the picture is the whole answer.
    const reveal = await revealOccasionLook(client, message, () => typing.bump()).catch(error => {
      console.error('[agent] occasion look reveal failed:', error);
      return 'failed' as const;
    });
    const askedToSee = parseLookButtonPayload(message.payload)?.action === 'show'
      || lookResponseFromText(message.text, null) === 'show'
      || /^show me my .{0,30}look/i.test(message.text.trim());
    if (reveal === 'revealed' && askedToSee) {
      const pending = await unansweredInboundMessages(client.id);
      await markMessagesAnswered(pending.map(item => item.id), stored.id);
      return 'occasion_look' as const;
    }
    return await runAgentTurn(client, { typing, inboundId: stored.id });
  } finally {
    await typing.stop();
  }
}

interface TurnState {
  client: AgentClient;
  passport: StylePassport;
  nodes: MemoryNode[];
  turnId: string;
  latestWhatsappId: string;
  /** WhatsApp id of the newest photo in this turn's messages (the selfie to analyse). */
  newestPhotoWhatsappId: string | null;
  typing: TypingKeepalive;
  /** True once the client has seen something from this turn; it then always finishes its reply. */
  committed: boolean;
  /** Outbound rows being written; awaited before the turn ends. */
  recordings: Array<Promise<unknown>>;
  candidates: Map<string, ProductCandidate>;
  searchCount: number;
  interimSent: number;
  runCharged: boolean;
  /** Friends who joined with their invite link (free tier): 3 unlock the Face Analysis. */
  friendsJoined: number;
  /** The occasion of the look we sent them (e.g. "Diwali"), while it's active. */
  occasion: string | null;
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
      name: 'forget',
      description: 'The client asked you to forget something: archives the closest matching memories so you never use them again. Tell them what you forgot.',
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['what'],
        properties: { what: { type: 'string', description: 'What to forget, in their words.' } },
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
    description: 'Send the client a ready-to-forward invite message with their personal ICONIK link. Only when they ask how to share or get more, ask for the locked Face Analysis, or run out of product hunts — never unprompted. On the free tier each friend who joins gives them more photo checks and both of them extra product hunts, and 3 friends unlock the Face Analysis (the intro explaining that is sent for you).',
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
      description: "Deliver the free colour analysis: saves their colour profile and sends their personal ICONIK Colour Card image (season, undertone, best colours, neutrals, colours to avoid, metal), then your wow message and your next-step question. Call it in your FIRST response once you have read a clear selfie — before anything else.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['first_name', 'season', 'undertone', 'depth', 'contrast', 'best_colours', 'neutrals', 'avoid_colours', 'metal', 'caption', 'wow', 'next_step'],
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
          wow: { type: 'string', description: 'Sent right after the card (max 70 words): what you saw in their photo (e.g. golden warmth along the jaw, deep brown eyes, the contrast with their hair) and one surprising, specific insight — a colour they very likely wear that drains them, and the swap that lights them up. If their message asked something about the photo (e.g. "rate my outfit"), answer it here: a quick verdict and the one fix, in their colours. Never give a rating or score they did not ask for.' },
          next_step: { type: 'string', description: 'The last message, a question they will want to answer (max 30 words) that moves forward from the wow — never re-ask what the wow answered. Default: invite them to send a photo of something in their wardrobe they are unsure about, and you will tell them if it is their colour. If they mentioned an occasion, offer to plan their look for it instead.' },
        },
      },
    });
    const textList = (description: string) => ({ type: 'array', description, items: { type: 'string' } });
    tools.push({
      type: 'function',
      name: 'send_body_card',
      description: "Deliver the free body shape analysis from a clear full-length photo: saves their body profile and sends their ICONIK Body Card image, then your wow, then the best outfit for their shape with a real look from our library, then asks if they want shopping links (pincode and size). Call it in your FIRST response once you have read a full-length photo — before anything else. Everything is about proportion, clothes and balance; never about weight or size.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['first_name', 'line', 'shape', 'proportions', 'summary', 'highlight', 'silhouettes', 'necklines', 'go_easy', 'fabrics', 'formula', 'caption', 'wow', 'best_outfit'],
        properties: {
          first_name: { type: ['string', 'null'] },
          line: { type: 'string', enum: ['woman', 'man'], description: 'Which shape list you used: womenswear (woman) or menswear (man).' },
          shape: { type: 'string', enum: ['hourglass', 'pear', 'inverted triangle', 'rectangle', 'apple', 'trapezoid', 'oval', 'triangle'], description: 'Women: hourglass, pear, inverted triangle, rectangle, apple. Men: trapezoid, rectangle, inverted triangle, oval, triangle.' },
          proportions: textList('2 or 3 short proportion facts, e.g. "Shoulders a touch narrower than hips", "Defined waist". Max 34 characters each.'),
          summary: { type: 'string', description: 'One warm sentence on what makes their shape work (max 110 characters), about balance and proportion only.' },
          highlight: textList('3 things to dress to highlight, each a short clothing-focused line (max 56 characters).'),
          silhouettes: textList('3 or 4 silhouettes that flatter, e.g. "A-line skirts", "Wrap tops", "Straight-leg trousers" (max 32 characters each).'),
          necklines: textList('3 or 4 necklines and collars that suit, e.g. "Boat neck", "Spread collar" (max 28 characters each).'),
          go_easy: textList('2 things to go easy on, as clothes (e.g. "Hip-level pockets and patches"), never about their body (max 48 characters each).'),
          fabrics: textList('2 or 3 fabrics that sit well (max 28 characters each).'),
          formula: { type: 'string', description: 'Their one-line outfit formula, e.g. "Structure on top, a clean A-line below, one belt to cinch" (max 100 characters).' },
          caption: { type: 'string', description: 'Short caption under the card, e.g. "Riya, you\'re an Hourglass 👗".' },
          wow: { type: 'string', description: 'Sent right after the card (max 60 words): what you saw in how they stand and dress (the shoulder, waist and hip balance, never weight) and one surprising, specific insight — a cut they likely wear that works against them, and the swap that works for them.' },
          best_outfit: { type: 'string', description: 'The best outfit for their shape in one or two sentences (max 40 words): top, bottom, layer and one finishing touch, in their colours if you know them. It is shown right before the library look, so describe the idea, not specific products.' },
        },
      },
    });
    tools.push({
      type: 'function',
      name: 'start_body_card',
      description: "They agreed to the free Body Card: marks it as open and asks for their full-length photo. Use it when they say yes to your offer, or ask for it in words that did not start it already. Not needed if the BODY CARD section says they already asked.",
      strict: true,
      parameters: { type: 'object', additionalProperties: false, required: [], properties: {} },
    });
    tools.push({
      type: 'function',
      name: 'suggest_library_outfit',
      description: "Pick other looks from ICONIK's outfit library that suit their body shape (and colours), e.g. when they want another one or one for an occasion. Returns 3 options; present the first as bullets and ask for their pincode and size so you can find it. Needs their Body Card first.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false, required: ['occasion'],
        properties: { occasion: { type: ['string', 'null'], description: 'office, party, casual, wedding… or null for an everyday look.' } },
      },
    });
    tools.push({
      type: 'function',
      name: 'save_style_profile',
      description: "Save what you've learned about a client without a Blueprint: from their selfie and answers. Only include what you can see or were told; null otherwise. Call again to refine.",
      strict: true,
      parameters: {
        type: 'object', additionalProperties: false,
        required: ['first_name', 'line', 'undertone', 'season', 'depth', 'contrast', 'best_colours', 'avoid_colours', 'style_vibe', 'fit_notes', 'city', 'budget_band', 'face_shape', 'face_notes'],
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
          face_shape: { type: ['string', 'null'], description: 'Only after a Face Analysis: oval, round, square, heart, oblong or diamond.' },
          face_notes: { type: ['string', 'null'], description: 'Only after a Face Analysis: best necklines, earrings, hair, glasses, in one line.' },
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

/** Three other library looks for "Show me another", each a different shape from the one he saw. */
function occasionAlternatives(look: { campaign: string; outfit: string; id: string }, profile: Record<string, unknown>) {
  const campaign = occasionCampaign(look.campaign);
  if (!campaign) return [];
  try {
    const library = loadOccasionLibrary(campaign.library);
    const shown = findOccasionOutfit(library, look.outfit);
    return shortlistOccasionOutfits(library, profile, {
      count: 3, perFamily: 1, exclude: [look.outfit], avoidFamilies: shown ? [shown.family] : [], seed: `${look.id}:another`,
    }).map(occasionOutfitText);
  } catch (error) {
    console.warn('[agent] could not load occasion alternatives:', error);
    return [];
  }
}

/** Sends a bubble; recording it doesn't hold up the next one (the turn awaits it before ending). */
async function sendText(state: TurnState, text: string, metadata: Record<string, unknown> = {}) {
  const sent = await sendWhatsAppTextMessage(state.client.phone, text);
  if (!sent.success) throw new Error(sent.error || 'WhatsApp send failed');
  state.committed = true;
  state.recordings.push(recordOutboundMessage({
    clientId: state.client.id, content: text, whatsappMessageId: sent.messageId ?? null, turnId: state.turnId, metadata,
  }).catch(error => console.warn('[agent] could not record a sent message:', error)));
}

/**
 * Sends bubbles one after another like a person typing: "typing…", then a pause
 * that suits the bubble's length (counted from when the previous send started).
 */
async function sendPaced(
  state: TurnState,
  messages: Array<{ text: string; metadata?: Record<string, unknown> }>,
  options: { firstImmediately?: boolean; previousSendStartedAt?: number } = {},
) {
  let previousStartedAt = options.previousSendStartedAt ?? Date.now();
  for (const [index, message] of messages.entries()) {
    if (index > 0 || !options.firstImmediately) {
      state.typing.show();
      await sleep(remainingTypingDelayMs(message.text, previousStartedAt));
    }
    previousStartedAt = Date.now();
    await sendText(state, message.text, message.metadata ?? {});
  }
}

/** Tools that message the client or spend money: a superseded turn must not start them. */
const SIDE_EFFECT_TOOLS = new Set([
  'send_message', 'react', 'search_products', 'present_products', 'share_invite', 'send_colour_card', 'send_body_card', 'start_body_card', 'show_outfit_image', 'forget',
]);

class TurnSuperseded extends Error {}

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
      state.typing.bump();
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
    case 'forget': {
      const matches = searchMemories(state.nodes, String(args.what ?? ''), 3);
      if (!matches.length) return 'Nothing like that is in memory.';
      await applyMemoryOperations({
        clientId: state.client.id,
        nodes: state.nodes,
        operations: matches.map(node => ({ op: 'archive' as const, nodeId: node.id })),
      });
      const forgotten = new Set(matches.map(node => node.id));
      state.nodes = state.nodes.filter(node => !forgotten.has(node.id));
      return `Forgot:\n${matches.map(node => `- ${node.content}`).join('\n')}`;
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
      // The cards are on their way, so this turn's "checking…" line must go out.
      state.committed = true;
      return `Checking ${items.length} product${items.length === 1 ? '' : 's'} on the store pages now; the cards and summary will be sent automatically when done. In your reply, tell them in one short line what you're checking (size${pincode ? `, delivery to ${pincode}` : ''}) and roughly how long — don't list the products.`;
    }
    case 'share_invite': {
      const invite = await ensureInviteCode(state.client);
      if (invite.remaining <= 0) return 'All their invites have been used. Tell them, and thank them for spreading the word.';
      const intro = state.client.tier === 'free'
        ? inviteUnlockIntro(state.friendsJoined)
        : String(args.intro ?? '').trim().slice(0, 200) || 'Here you go — forward this to a friend 👇 the link is for them.';
      await sendText(state, intro, { type: 'invite_intro' });
      const season = typeof state.client.lite_profile?.season === 'string' ? state.client.lite_profile.season : null;
      // A Blueprint man inviting his wife or family for the occasion: so their outfits go together.
      const forwardable = state.client.tier === 'blueprint' && state.occasion
        ? forwardableOccasionInvite({ code: invite.code, link: invite.link, inviterName: state.passport.firstName, occasion: state.occasion })
        : forwardableInvite({ code: invite.code, link: invite.link, inviterName: state.passport.firstName, season });
      await sendText(state, forwardable, { type: 'invite', code: invite.code });
      state.interimSent += 2;
      state.typing.bump();
      return `Sent their invite (${invite.code}); ${invite.remaining} friend${invite.remaining === 1 ? '' : 's'} can still join with it. Don't repeat the link in your reply.`;
    }
    case 'send_colour_card': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report already has their colours.';
      // One card per selfie: a retried or overlapping turn must not send a second one.
      const previous = state.client.lite_profile ?? {};
      const hadCard = Boolean(previous.colour_card_for || previous.colour_card_at);
      if (hadCard && (!state.newestPhotoWhatsappId || previous.colour_card_for === state.newestPhotoWhatsappId)) {
        return "Their Colour Card for this photo was already sent — don't send another. Carry on from it using their palette; a new analysis needs a new photo.";
      }
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
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('agent_clients')
        .update({ lite_profile: profile, first_name: firstName, updated_at: new Date().toISOString() })
        .eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: profile, first_name: firstName };

      const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
      // One retry with a fresh browser; the error is kept on the message so failures can be read later.
      let renderError: string | null = null;
      const renderOnce = () => renderColourCard(state.client.id, analysis, dateLabel)
        .then(result => {
          if (!result?.signedUrl) renderError = result ? 'no signed URL for the stored card' : 'card element missing';
          return result;
        })
        .catch(error => {
          renderError = error instanceof Error ? error.message : String(error);
          console.error('[agent] colour card render failed:', error);
          return null;
        });
      let rendered = await renderOnce();
      if (!rendered?.signedUrl) rendered = await renderOnce();
      const caption = String(args.caption ?? '').trim().slice(0, 200) || `${firstName ? `${firstName}, you're` : "You're"} a ${analysis.season} 🎨`;
      const sent = rendered?.signedUrl
        ? await sendWhatsAppImageInOrder(state.client.phone, rendered.signedUrl, caption, rendered.bytes)
        : null;
      const cardSentAt = Date.now();
      if (rendered?.signedUrl && sent?.success) {
        state.committed = true;
        await recordOutboundMessage({
          clientId: state.client.id, kind: 'image', content: caption, imageUrl: rendered.signedUrl, whatsappMessageId: sent.messageId ?? null,
          turnId: state.turnId, metadata: { type: 'colour_card', season: analysis.season },
        });
      } else {
        if (sent) console.error('[agent] colour card send failed:', sent.error);
        await sendText(state, `${caption}\n\nYour best colours: ${analysis.best.map(swatch => swatch.name).join(', ')}.`, {
          type: 'colour_card', season: analysis.season, image_failed: sent ? `send: ${sent.error}` : `render: ${renderError}`,
        });
      }
      // Marked only once it has gone out, so a failed send can be retried.
      const delivered = { ...profile, colour_card_at: new Date().toISOString(), colour_card_for: state.newestPhotoWhatsappId };
      await supabaseAdmin.from('agent_clients').update({ lite_profile: delivered }).eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: delivered };

      // Straight after the card, without waiting for another model call: the wow,
      // then the question last so it's the thing they answer. No invite here —
      // they share once they've had the value (when their free checks run out).
      const wow = String(args.wow ?? '').trim().slice(0, 700);
      const nextStep = String(args.next_step ?? '').trim().slice(0, 300);
      const followUps: Array<{ text: string; metadata?: Record<string, unknown> }> = [];
      if (wow) followUps.push({ text: wow, metadata: { type: 'colour_wow' } });
      if (nextStep) followUps.push({ text: nextStep, metadata: { type: 'colour_next_step' } });
      await sendPaced(state, followUps, { previousSendStartedAt: cardSentAt });
      state.interimSent += 1 + followUps.length;
      // Everything is sent; no "typing…" left hanging while the model wraps up.
      await state.typing.stop();
      return `Colour Card, your wow message and your next-step question are all sent, and the profile is saved. Your wow already answered any question about their photo, so reply exactly ${NO_REPLY_SENTINEL} — unless a message asked about something unrelated that still needs an answer.`;
    }
    case 'start_body_card': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report already covers their body analysis.';
      if (bodyCardPending(state.client.lite_profile)) return `The Body Card is already open. Ask for their full-length photo in your reply, or reply exactly ${NO_REPLY_SENTINEL} if you just asked.`;
      state.client = await markBodyShapeAsk(state.client);
      const ask = bodyPhotoAskMessage(state.client.first_name, false);
      await sendText(state, ask, { type: 'body_photo_ask' });
      state.interimSent += 1;
      state.typing.bump();
      return `The photo ask is sent and the Body Card is open. Reply exactly ${NO_REPLY_SENTINEL}.`;
    }
    case 'send_body_card': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report already covers their body analysis.';
      const previous = state.client.lite_profile ?? {};
      // One card per photo: a retried or overlapping turn must not send a second one.
      if (!state.newestPhotoWhatsappId) return 'There is no photo in this conversation yet — ask for one full-length photo instead.';
      if (previous.body_card_at && previous.body_card_for === state.newestPhotoWhatsappId) {
        return "Their Body Card for this photo was already sent — don't send another. Carry on from it; a new analysis needs a new full-length photo.";
      }
      const firstName = nullableString(args.first_name, 40) ?? state.client.first_name;
      const analysis = parseBodyAnalysis(args, firstName);
      if (!analysis) return 'The body analysis is incomplete: give the line, a shape from the list for it, a summary, at least 2 highlights, at least 2 silhouettes and a formula.';
      const bestOutfit = String(args.best_outfit ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
      const look = pickBodyLooks({ line: analysis.line, shape: analysis.shape, profile: previous, seed: state.client.id })[0] ?? null;
      const profile: Record<string, unknown> = {
        ...previous,
        ...bodyProfileFields(analysis),
        body_outfit: { id: look?.id ?? null, text: look ? lookText(look) : bestOutfit, shown_ids: look ? [look.id] : [] },
        updated_at: new Date().toISOString(),
      };
      const line = state.client.line ?? analysis.line;
      await supabaseAdmin.from('agent_clients')
        .update({ lite_profile: profile, first_name: firstName, line, updated_at: new Date().toISOString() })
        .eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: profile, first_name: firstName, line };

      const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
      let renderError: string | null = null;
      const renderOnce = () => renderBodyCard(state.client.id, analysis, dateLabel)
        .then(result => {
          if (!result?.signedUrl) renderError = result ? 'no signed URL for the stored card' : 'card element missing';
          return result;
        })
        .catch(error => {
          renderError = error instanceof Error ? error.message : String(error);
          console.error('[agent] body card render failed:', error);
          return null;
        });
      let rendered = await renderOnce();
      if (!rendered?.signedUrl) rendered = await renderOnce();
      const shapeLabel = BODY_SHAPES[analysis.line][analysis.shape].label;
      const caption = String(args.caption ?? '').trim().slice(0, 200) || `${firstName ? `${firstName}, your` : 'Your'} shape is ${shapeLabel} 👗`;
      const sent = rendered?.signedUrl
        ? await sendWhatsAppImageInOrder(state.client.phone, rendered.signedUrl, caption, rendered.bytes)
        : null;
      const cardSentAt = Date.now();
      if (rendered?.signedUrl && sent?.success) {
        state.committed = true;
        await recordOutboundMessage({
          clientId: state.client.id, kind: 'image', content: caption, imageUrl: rendered.signedUrl, whatsappMessageId: sent.messageId ?? null,
          turnId: state.turnId, metadata: { type: 'body_card', shape: shapeLabel },
        });
      } else {
        if (sent) console.error('[agent] body card send failed:', sent.error);
        await sendText(state, `${caption}\n\nWhat to wear: ${analysis.formula}`, {
          type: 'body_card', shape: shapeLabel, image_failed: sent ? `send: ${sent.error}` : `render: ${renderError}`,
        });
      }
      // Marked only once it has gone out, so a failed send can be retried.
      const delivered = { ...profile, body_card_at: new Date().toISOString(), body_card_for: state.newestPhotoWhatsappId };
      await supabaseAdmin.from('agent_clients').update({ lite_profile: delivered }).eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: delivered };

      // Straight after the card, without another model call: the wow, the best
      // outfit for their shape with a real library look, then the question last.
      const wow = String(args.wow ?? '').trim().slice(0, 600);
      const followUps: Array<{ text: string; metadata?: Record<string, unknown> }> = [];
      if (wow) followUps.push({ text: wow, metadata: { type: 'body_wow' } });
      followUps.push({
        text: bodyOutfitMessage({ line: analysis.line, shape: analysis.shape, bestOutfit: bestOutfit || analysis.formula, look }),
        metadata: { type: 'body_outfit', look_id: look?.id ?? null },
      });
      followUps.push({ text: BODY_LINK_QUESTION, metadata: { type: 'body_link_question' } });
      await sendPaced(state, followUps, { previousSendStartedAt: cardSentAt });
      state.interimSent += 1 + followUps.length;
      await state.typing.stop();
      return `Body Card, your wow, the best outfit with a library look, and the question about shopping links are all sent, and the profile is saved. Reply exactly ${NO_REPLY_SENTINEL} — unless a message asked about something unrelated that still needs an answer.`;
    }
    case 'suggest_library_outfit': {
      const profile = state.client.lite_profile ?? {};
      const line = state.client.line;
      const shape = line ? bodyShapeKey(typeof profile.body_shape === 'string' ? profile.body_shape : '', line) : null;
      if (!line || !shape) return 'They have no Body Card yet — offer it first (start_body_card), or suggest an outfit from what you know.';
      const outfit = profile.body_outfit && typeof profile.body_outfit === 'object' ? profile.body_outfit as Record<string, unknown> : {};
      const shown = Array.isArray(outfit.shown_ids) ? outfit.shown_ids.map(String) : [];
      const looks = pickBodyLooks({ line, shape, profile, occasion: nullableString(args.occasion, 60), exclude: shown, count: 3, seed: `${state.client.id}:${shown.length}` });
      if (!looks.length) return 'No more looks in the library for this — describe one yourself from their Body Card and colours.';
      const updated = { ...profile, body_outfit: { id: looks[0].id, text: lookText(looks[0]), shown_ids: [...shown, ...looks.map(look => look.id)].slice(-30) }, updated_at: new Date().toISOString() };
      await supabaseAdmin.from('agent_clients').update({ lite_profile: updated }).eq('id', state.client.id);
      state.client = { ...state.client, lite_profile: updated };
      const info = BODY_SHAPES[line][shape];
      return `Library looks for their ${info.label} shape (option 1 is saved as the one on offer — present it, or option 2 or 3 if their colours or occasion fit better):\n${looks.map((look, index) => `Option ${index + 1} (${look.setting}):\n${lookBullets(look)}${look.styling ? `\nStyling: ${look.styling}` : ''}`).join('\n\n')}\nWhy it works for them: ${info.why}\nPresent the pieces as short bullets, add the why in one line, then ask for their pincode and size so you can find it.`;
    }
    case 'save_style_profile': {
      if (state.client.tier !== 'free') return 'This client has a Blueprint; their report is the profile.';
      const profile: Record<string, unknown> = { ...(state.client.lite_profile ?? {}) };
      for (const key of ['undertone', 'season', 'depth', 'contrast', 'style_vibe', 'fit_notes', 'city', 'budget_band', 'face_shape', 'face_notes'] as const) {
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
      const sent = await sendWhatsAppImageInOrder(state.client.phone, uploaded.signedUrl);
      if (!sent.success) return 'The image could not be sent.';
      state.committed = true;
      state.typing.bump();
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

interface TurnOptions {
  /** The invocation's own "typing…" keepalive, already showing. */
  typing?: TypingKeepalive;
  /** The message whose invocation runs this turn; it gives way if a newer one arrives while waiting. */
  inboundId?: string;
}

export function runAgentTurn(client: AgentClient, options: TurnOptions = {}) {
  return withAgentUsage({ clientId: client.id, kind: 'chat' }, () => runAgentTurnInner(client, options));
}

/** One turn at a time per client: wait for the previous turn and any photo still downloading. */
async function waitForTurnSlot(clientId: string) {
  const deadline = Date.now() + TURN_WAIT_MAX_MS;
  while (Date.now() < deadline && await turnShouldWait(clientId)) await sleep(TURN_WAIT_POLL_MS);
}

async function photoCheckStatus(client: AgentClient) {
  const joined = await friendsJoined(client.id);
  const allowance = photoCheckAllowance(joined);
  const colourCardAt = typeof client.lite_profile?.colour_card_at === 'string' ? client.lite_profile.colour_card_at : null;
  const used = await photoChecksUsed(client.id, photoChecksCountFrom(colourCardAt));
  return { joined, allowance, left: allowance - used };
}

/** Their free photo checks are used up: thank them and offer the invite — once; after that a short reminder. */
async function sendOutOfPhotoChecks(
  client: AgentClient,
  pending: AgentMessageRow[],
  checks: { joined: number; allowance: number },
  options: TurnOptions,
) {
  const turnId = await startTurn(client.id, pending.map(message => message.id), 'instant');
  await options.typing?.stop();
  const askedRecently = await sentRecently(client.id, 'share_ask', 12 * 3_600_000);
  const invite = askedRecently ? null : await ensureInviteCode(client).catch(() => null);
  const canInvite = Boolean(invite && invite.remaining > 0);
  const season = typeof client.lite_profile?.season === 'string' ? client.lite_profile.season : null;
  const messages: Array<{ text: string; metadata: Record<string, unknown> }> = askedRecently
    ? [{ text: stillOutOfPhotoChecksMessage(), metadata: { type: 'share_reminder' } }]
    : [{ text: outOfPhotoChecksMessage(checks.allowance, canInvite, checks.joined), metadata: { type: canInvite ? 'share_ask' : 'photo_checks_out' } }];
  if (invite && canInvite) {
    messages.push({
      text: forwardableInvite({ code: invite.code, link: invite.link, inviterName: client.first_name, season }),
      metadata: { type: 'invite', code: invite.code },
    });
  }
  let ok = true;
  for (const message of messages) {
    const sent = await sendWhatsAppTextMessage(client.phone, message.text);
    if (!sent.success) {
      ok = false;
      break;
    }
    await recordOutboundMessage({ clientId: client.id, content: message.text, whatsappMessageId: sent.messageId ?? null, turnId, metadata: message.metadata });
  }
  await markMessagesAnswered(pending.map(message => message.id), turnId);
  await finishTurn(turnId, ok ? 'completed' : 'failed', {
    toolCalls: [{ name: 'out_of_photo_checks', ok, summary: messages.map(message => message.metadata.type).join(', ') }],
    error: ok ? null : 'send failed',
  });
  return ok ? 'replied' as const : 'failed' as const;
}

async function runAgentTurnInner(client: AgentClient, options: TurnOptions) {
  await waitForTurnSlot(client.id);
  if (options.inboundId) {
    const latest = await latestInboundMessage(client.id);
    if (latest && latest.id !== options.inboundId) return 'deferred_to_newer_message' as const;
  }
  const pending = await unansweredInboundMessages(client.id);
  if (!pending.length) return 'nothing_to_answer' as const;
  const latestPending = pending[pending.length - 1];
  const latestWhatsappId = latestPending.whatsapp_message_id ?? '';
  const newestPhoto = [...pending].reverse().find(message => message.kind === 'image' && message.image_url);
  const bodyPending = client.tier === 'free' && bodyCardPending(client.lite_profile);
  // While the Body Card is open, a photo is theirs for that, not a selfie for the Colour Card.
  const awaitingCard = awaitingColourCard(client) && !bodyPending;

  // The Body Card request that only opens the chat (the campaign link's text):
  // ask for the full-length photo at once, without a model call.
  if (bodyPending && !newestPhoto && pending.every(message => message.kind === 'text' && isBodyOpenerMessage(message.content))
    && !await sentRecently(client.id, 'body_photo_ask', 3 * 60_000)) {
    const turnId = await startTurn(client.id, pending.map(message => message.id), 'instant');
    await options.typing?.stop();
    const ask = bodyPhotoAskMessage(client.first_name, await isFirstConversation(client.id));
    const sent = await sendWhatsAppTextMessage(client.phone, ask);
    if (sent.success) {
      await recordOutboundMessage({ clientId: client.id, content: ask, whatsappMessageId: sent.messageId ?? null, turnId, metadata: { type: 'body_photo_ask' } });
    }
    await markMessagesAnswered(pending.map(message => message.id), turnId);
    await finishTurn(turnId, sent.success ? 'completed' : 'failed', {
      toolCalls: [{ name: 'instant_body_photo_ask', ok: sent.success, summary: sent.error ?? 'sent' }],
      error: sent.success ? null : sent.error ?? 'send failed',
    });
    return sent.success ? 'replied' as const : 'failed' as const;
  }

  // The first message on the free colour flow (the campaign link's text, an
  // invite code, a hello): ask for the selfie at once, without a model call.
  if (awaitingCard && pending.every(message => message.kind === 'text' && isOpenerMessage(message.content))
    && await isFirstConversation(client.id)) {
    const turnId = await startTurn(client.id, pending.map(message => message.id), 'instant');
    await options.typing?.stop();
    const ask = selfieAskMessage(client.first_name);
    const sent = await sendWhatsAppTextMessage(client.phone, ask);
    if (sent.success) {
      await recordOutboundMessage({ clientId: client.id, content: ask, whatsappMessageId: sent.messageId ?? null, turnId, metadata: { type: 'selfie_ask' } });
    }
    await markMessagesAnswered(pending.map(message => message.id), turnId);
    await finishTurn(turnId, sent.success ? 'completed' : 'failed', {
      toolCalls: [{ name: 'instant_selfie_ask', ok: sent.success, summary: sent.error ?? 'sent' }],
      error: sent.success ? null : sent.error ?? 'send failed',
    });
    return sent.success ? 'replied' as const : 'failed' as const;
  }
  // The selfie is in: start the card renderer now, while the model reads it.
  if ((awaitingCard || bodyPending) && newestPhoto) prewarmCardBrowser();

  // A photo after the Colour Card uses one of this month's free photo checks.
  // When they're used up, the share message goes instead of a model call: the
  // one moment we ask them to invite friends, after they've had the value.
  const checks = client.tier === 'free' && !awaitingCard && !bodyPending && newestPhoto
    ? await photoCheckStatus(client).catch(error => {
      console.warn('[agent] photo check count failed:', error);
      return null;
    })
    : null;
  if (checks && checks.left <= 0) return sendOutOfPhotoChecks(client, pending, checks, options);

  const turnId = await startTurn(client.id, pending.map(message => message.id), AGENT_TEXT_MODEL);

  const typing = options.typing ?? new TypingKeepalive(latestWhatsappId);
  if (!options.typing) typing.start();

  const state: TurnState = {
    client,
    passport: null as unknown as StylePassport,
    nodes: [],
    turnId,
    latestWhatsappId,
    newestPhotoWhatsappId: newestPhoto?.whatsapp_message_id ?? null,
    typing,
    committed: false,
    recordings: [],
    candidates: new Map(),
    searchCount: 0,
    interimSent: 0,
    runCharged: false,
    friendsJoined: 0,
    occasion: null,
    toolLog: [],
  };

  try {
    await ensureMemoryTree(client.id);
    const [passport, nodes, thread, events, firstConversation, lookActivity, occasionLook] = await Promise.all([
      loadStylePassport(client),
      loadMemoryNodes(client.id),
      loadThread(client.id, 40),
      listClientEvents(client.id),
      isFirstConversation(client.id),
      lookActivitySummary(client.id),
      activeOccasionLookFor(client).catch(error => {
        console.warn('[agent] occasion look lookup failed:', error);
        return null;
      }),
    ]);
    state.passport = passport;
    state.nodes = nodes;
    state.occasion = occasionCampaign(occasionLook?.campaign)?.occasion ?? null;

    const freeTier = client.tier === 'free';
    if (freeTier) await ensureMonthlyGrant(client);
    const [runsLeft, invite, joined] = await Promise.all([
      freeTier ? creditBalance(client.id) : Promise.resolve(null),
      ensureInviteCode(client).catch(() => null),
      freeTier ? friendsJoined(client.id) : Promise.resolve(0),
    ]);
    state.friendsJoined = joined;

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
      friendsJoined: joined,
      photoChecksLeft: checks?.left ?? null,
      blueprintUrl: new URL(client.line === 'man' ? '/man' : '/', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro').toString(),
      occasionLook: occasionLook ? { ...occasionLook, alternatives: occasionAlternatives(occasionLook, passport.profile) } : null,
    });

    const pendingIds = new Set(pending.map(message => message.id));
    let input: ResponseInputItem[] = [...threadToInput(thread, pendingIds), pendingToInput(pending)];
    const tools = agentTools({ freeTier, outfitImages: client.line === 'man' && Boolean(client.report_share_token) });
    let reply = '';
    // A newer message stops this turn only while the client hasn't seen anything from it.
    const supersededBeforeSending = async () => {
      if (state.committed) return false;
      const latest = await latestInboundMessage(client.id);
      return Boolean(latest && latest.id !== latestPending.id);
    };

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
        if (SIDE_EFFECT_TOOLS.has(toolCall.name) && await supersededBeforeSending()) throw new TurnSuperseded();
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
    // (A turn that already sent something finishes; the newer turn answers what came after.)
    if (await supersededBeforeSending()) throw new TurnSuperseded();

    // Until the Colour Card (or the Body Card, when that was asked for), every reply is one ask: one bubble.
    const bodyStillPending = bodyCardPending(state.client.lite_profile);
    const bubbles = reply.trim() === NO_REPLY_SENTINEL
      ? []
      : splitIntoBubbles(reply, (bodyPending ? bodyStillPending : awaitingColourCard(state.client) && !bodyStillPending) ? 1 : MAX_REPLY_BUBBLES);
    // They sent a photo and were told their card is coming. If the model couldn't
    // make one and didn't ask for a better photo, ask for it rather than go quiet.
    if (bodyPending) {
      if (bodyStillPending && newestPhoto && !/photo|pic|picture|full[- ]length/i.test(bubbles.join(' '))) bubbles.push(BETTER_BODY_PHOTO_ASK);
    } else if (awaitingColourCard(state.client) && !bodyStillPending && newestPhoto && !/selfie|photo|pic|picture/i.test(bubbles.join(' '))) {
      bubbles.push(BETTER_SELFIE_ASK);
    }
    if (!bubbles.length && reply.trim() !== NO_REPLY_SENTINEL && !state.interimSent) {
      bubbles.push('Sorry — I lost my train of thought there. Can you send that again?');
    }
    // The timer stops so no stray "typing…" lands after the last bubble; between
    // bubbles it is shown by hand, for a pause that suits the next bubble's length.
    await typing.stop();
    await sendPaced(state, bubbles.map(text => ({ text })), { firstImmediately: true });

    await Promise.all(state.recordings);
    await markMessagesAnswered(pending.map(message => message.id), turnId);
    await finishTurn(turnId, 'completed', { toolCalls: state.toolLog });

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
    await Promise.all(state.recordings);
    if (error instanceof TurnSuperseded) {
      // Nothing was sent; the newer turn answers these messages too.
      await finishTurn(turnId, 'superseded', { toolCalls: state.toolLog });
      return 'superseded' as const;
    }
    console.error('[agent] turn failed:', error);
    await typing.stop();
    await finishTurn(turnId, 'failed', { toolCalls: state.toolLog, error: error instanceof Error ? error.message : String(error) });
    await sendText(state, 'Something went wrong on my side — give me a moment and send that again?').catch(() => undefined);
    await markMessagesAnswered(pending.map(message => message.id), turnId);
    return 'failed' as const;
  } finally {
    await typing.stop();
  }
}
