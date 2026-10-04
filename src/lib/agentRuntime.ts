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
import { AGENT_TEXT_MODEL, agentOpenAI } from '@/lib/agentLlm';
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
import type { WhatsappInboundMessage } from '@/lib/whatsappPilot';

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function storeInboundImage(clientId: string, mediaId: string) {
  const downloaded = await downloadWhatsAppImage(mediaId);
  const extension = downloaded.mimeType.split('/')[1] || 'jpg';
  return uploadAgentMedia(clientId, downloaded.bytes, downloaded.mimeType, extension);
}

/**
 * Entry point from the WhatsApp webhook. Returns 'not_client' when the number
 * has no finished ICONIK report, so the caller can fall back.
 */
export async function handleAgentInbound(message: WhatsappInboundMessage, access: { previewReports: boolean }) {
  const client = await resolveAgentClientByPhone(message.from, { allowPreviewReports: access.previewReports });
  if (!client) return 'not_client' as const;
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
  toolLog: Array<{ name: string; ok: boolean; summary: string }>;
}

export function agentTools(line: 'man' | 'woman'): FunctionTool[] {
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
  if (line === 'man') {
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
      state.searchCount += 1;
      const found = await searchProducts({
        line: state.client.line,
        query: String(args.query ?? '').slice(0, 200),
        colours: Array.isArray(args.colours) ? args.colours.map(String).slice(0, 5) : [],
        budgetMaxInr: typeof args.budget_max_inr === 'number' ? args.budget_max_inr : null,
        retailerNames: Array.isArray(args.stores) ? args.stores.map(String) : [],
        sports: args.sports === true,
        idPrefix: `s${state.searchCount}c`,
      });
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
    const views = events.filter(event => event.type === 'view').length;
    return `- "${link.title}" (${String(link.created_at).slice(0, 10)}): ${views} views`
      + `${liked.length ? `; liked/saved: ${[...new Set(liked)].join(', ')}` : ''}`
      + `${disliked.length ? `; disliked: ${[...new Set(disliked)].join(', ')}` : ''}`
      + `${clicked.length ? `; went to store for: ${[...new Set(clicked)].join(', ')}` : ''}`;
  }).join('\n');
}

export async function runAgentTurn(client: AgentClient) {
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
    });

    const pendingIds = new Set(pending.map(message => message.id));
    let input: ResponseInputItem[] = [...threadToInput(thread, pendingIds), pendingToInput(pending)];
    const tools = agentTools(client.line);
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
      await reflectOnTurn({
        clientId: client.id,
        nodes: fresh,
        clientMessages: clientText,
        assistantReply: bubbles.join('\n\n'),
        sourceMessageIds: pending.map(message => message.id),
      });
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
