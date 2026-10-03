import 'server-only';

// Data access for the ICONIK agent: the conversation thread, turns, events,
// Look Links and the background job queue.

import type { AgentClient } from '@/lib/agentClients';
import { createLookSlug, lookLinkUrl, type LookEventType } from '@/lib/agentLookLinks';
import { supabaseAdmin } from '@/lib/supabase';

export interface AgentMessageRow {
  id: string;
  client_id: string;
  direction: 'inbound' | 'outbound';
  kind: 'text' | 'image' | 'reaction' | 'interactive' | 'unsupported';
  content: string;
  image_url: string | null;
  storage_path: string | null;
  whatsapp_message_id: string | null;
  turn_id: string | null;
  answered_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentEventRow {
  id: string;
  client_id: string;
  title: string;
  occasion_type: string | null;
  event_date: string;
  end_date: string | null;
  city: string | null;
  role: string | null;
  dress_code: string | null;
  budget_inr: number | null;
  notes: string | null;
  reminders_enabled: boolean;
  nudges_sent: string[];
  status: 'upcoming' | 'done' | 'cancelled';
}

export interface LookLinkItemInput {
  slot: string;
  title: string;
  retailer: string | null;
  url: string;
  imageUrl: string | null;
  priceInr: number | null;
  colour: string | null;
  reason: string | null;
}

export interface AgentJobRow {
  id: string;
  client_id: string | null;
  type: 'verify_look_link' | 'consolidate_memory';
  status: string;
  payload: Record<string, unknown>;
  attempts: number;
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`Could not ${action}: ${error?.message ?? 'unknown error'}`);
}

// ── Thread ──

/** Returns null when this WhatsApp message was already stored (webhook retries). */
export async function insertInboundMessage(input: {
  clientId: string;
  kind: AgentMessageRow['kind'];
  content: string;
  whatsappMessageId: string;
  imageUrl?: string | null;
  storagePath?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseAdmin
    .from('agent_messages')
    .insert({
      client_id: input.clientId,
      direction: 'inbound',
      kind: input.kind,
      content: input.content,
      whatsapp_message_id: input.whatsappMessageId,
      image_url: input.imageUrl ?? null,
      storage_path: input.storagePath ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') return null;
    fail('save the inbound message', error);
  }
  await supabaseAdmin.from('agent_clients')
    .update({ last_inbound_at: data.created_at, updated_at: new Date().toISOString() })
    .eq('id', input.clientId);
  return data as AgentMessageRow;
}

export async function recordOutboundMessage(input: {
  clientId: string;
  content: string;
  kind?: AgentMessageRow['kind'];
  whatsappMessageId?: string | null;
  turnId?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('agent_messages').insert({
    client_id: input.clientId,
    direction: 'outbound',
    kind: input.kind ?? 'text',
    content: input.content,
    whatsapp_message_id: input.whatsappMessageId ?? null,
    turn_id: input.turnId ?? null,
    image_url: input.imageUrl ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) console.warn('[agent] outbound message not recorded:', error.message);
  await supabaseAdmin.from('agent_clients').update({ last_outbound_at: now, updated_at: now }).eq('id', input.clientId);
}

export async function loadThread(clientId: string, limit = 30) {
  const { data, error } = await supabaseAdmin
    .from('agent_messages')
    .select('*')
    .eq('client_id', clientId)
    .neq('kind', 'reaction')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail('load the conversation', error);
  return [...(data ?? [])].reverse() as AgentMessageRow[];
}

export async function latestInboundMessage(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_messages')
    .select('id, created_at, whatsapp_message_id')
    .eq('client_id', clientId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('load the latest message', error);
  return data as Pick<AgentMessageRow, 'id' | 'created_at' | 'whatsapp_message_id'> | null;
}

/** Messages from the client nobody has answered yet: one turn answers them together. */
export async function unansweredInboundMessages(clientId: string, withinHours = 6) {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('agent_messages')
    .select('*')
    .eq('client_id', clientId)
    .eq('direction', 'inbound')
    .is('answered_at', null)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error) fail('load unanswered messages', error);
  return (data ?? []) as AgentMessageRow[];
}

export async function markMessagesAnswered(messageIds: string[], turnId: string) {
  if (!messageIds.length) return;
  await supabaseAdmin
    .from('agent_messages')
    .update({ answered_at: new Date().toISOString(), turn_id: turnId })
    .in('id', messageIds);
}

export async function isFirstConversation(clientId: string) {
  const { count } = await supabaseAdmin
    .from('agent_messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('direction', 'outbound');
  return !count;
}

// ── Turns ──

export async function startTurn(clientId: string, inboundIds: string[], model: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_turns')
    .insert({ client_id: clientId, inbound_message_ids: inboundIds, model })
    .select('id')
    .single();
  if (error) fail('start the turn', error);
  return data.id as string;
}

export async function finishTurn(turnId: string, status: 'completed' | 'superseded' | 'failed', details: {
  toolCalls?: unknown[];
  error?: string | null;
} = {}) {
  await supabaseAdmin.from('agent_turns').update({
    status,
    tool_calls: details.toolCalls ?? [],
    error: details.error ?? null,
    finished_at: new Date().toISOString(),
  }).eq('id', turnId);
}

// ── Events ──

export async function listClientEvents(clientId: string, includePastDays = 7) {
  const since = new Date(Date.now() - includePastDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('agent_events')
    .select('*')
    .eq('client_id', clientId)
    .neq('status', 'cancelled')
    .gte('event_date', since)
    .order('event_date', { ascending: true })
    .limit(20);
  if (error) fail('load events', error);
  return (data ?? []) as AgentEventRow[];
}

export async function saveClientEvent(clientId: string, event: Omit<AgentEventRow, 'id' | 'client_id' | 'nudges_sent' | 'status'> & {
  sourceMessageId?: string | null;
}) {
  const { sourceMessageId, ...fields } = event;
  const { data, error } = await supabaseAdmin
    .from('agent_events')
    .insert({ client_id: clientId, ...fields, source_message_id: sourceMessageId ?? null })
    .select('*')
    .single();
  if (error) fail('save the event', error);
  return data as AgentEventRow;
}

export async function updateClientEvent(clientId: string, eventId: string, fields: Partial<Omit<AgentEventRow, 'id' | 'client_id'>>) {
  const { data, error } = await supabaseAdmin
    .from('agent_events')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('client_id', clientId)
    .select('*')
    .maybeSingle();
  if (error) fail('update the event', error);
  return data as AgentEventRow | null;
}

/** Records a reminder stage as handled. Returns false if another run already claimed it. */
export async function claimEventNudge(event: AgentEventRow, stage: string) {
  const { data } = await supabaseAdmin
    .from('agent_events')
    .update({ nudges_sent: [...event.nudges_sent, stage], updated_at: new Date().toISOString() })
    .eq('id', event.id)
    .eq('nudges_sent', `{${event.nudges_sent.join(',')}}`)
    .select('id');
  return Boolean(data?.length);
}

export async function upcomingEventsWithReminders() {
  const today = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('agent_events')
    .select('*, agent_clients(*)')
    .eq('status', 'upcoming')
    .eq('reminders_enabled', true)
    .gte('event_date', today)
    .lte('event_date', horizon)
    .limit(500);
  if (error) fail('load reminder events', error);
  return (data ?? []) as Array<AgentEventRow & { agent_clients: AgentClient | null }>;
}

// ── Look Links ──

export async function createLookLink(input: {
  clientId: string;
  title: string;
  occasion: string | null;
  intro: string | null;
  eventId: string | null;
  heroImageUrl?: string | null;
  items: LookLinkItemInput[];
}) {
  let link: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 3 && !link; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('look_links')
      .insert({
        slug: createLookSlug(),
        client_id: input.clientId,
        event_id: input.eventId,
        title: input.title,
        occasion: input.occasion,
        intro: input.intro,
        hero_image_url: input.heroImageUrl ?? null,
      })
      .select('id, slug')
      .single();
    if (data) link = data;
    else if (error?.code !== '23505') fail('create the Look Link', error);
  }
  if (!link) throw new Error('Could not create a unique Look Link');

  const { error: itemError } = await supabaseAdmin.from('look_link_items').insert(input.items.map((item, index) => ({
    look_link_id: link.id,
    slot: item.slot,
    rank: index,
    title: item.title,
    retailer: item.retailer,
    url: item.url,
    image_url: item.imageUrl,
    price_inr: item.priceInr,
    colour: item.colour,
    reason: item.reason,
  })));
  if (itemError) fail('save the Look Link products', itemError);
  return { id: link.id, slug: link.slug, url: lookLinkUrl(link.slug) };
}

export async function loadLookLink(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('look_links')
    .select('id, slug, client_id, title, occasion, intro, hero_image_url, status, created_at, agent_clients(first_name, line), look_link_items(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) fail('load the Look Link', error);
  return data;
}

export async function loadLookLinkItem(itemId: string) {
  const { data, error } = await supabaseAdmin
    .from('look_link_items')
    .select('id, url, look_link_id, look_links(slug, client_id)')
    .eq('id', itemId)
    .maybeSingle();
  if (error) fail('load the product', error);
  return data;
}

export async function recordLookEvent(input: {
  lookLinkId: string;
  clientId: string;
  type: LookEventType;
  itemId?: string | null;
  visitorId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from('look_link_events').insert({
    look_link_id: input.lookLinkId,
    client_id: input.clientId,
    type: input.type,
    item_id: input.itemId ?? null,
    visitor_id: input.visitorId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) console.warn('[look] event not recorded:', error.message);
}

/** What the client did with recent Look pages — feeds the agent's sense of what landed. */
export async function recentLookActivity(clientId: string) {
  const { data } = await supabaseAdmin
    .from('look_links')
    .select('slug, title, created_at, look_link_items(id, title, slot, verification_status), look_link_events(type, item_id, created_at)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

// ── Jobs ──

export async function enqueueAgentJob(type: AgentJobRow['type'], clientId: string | null, payload: Record<string, unknown>, runAfter?: Date) {
  const { error } = await supabaseAdmin.from('agent_jobs').insert({
    type,
    client_id: clientId,
    payload,
    run_after: (runAfter ?? new Date()).toISOString(),
  });
  if (error) fail('queue background work', error);
}

export async function hasQueuedJob(type: AgentJobRow['type'], clientId: string) {
  const { count } = await supabaseAdmin
    .from('agent_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
    .eq('client_id', clientId)
    .in('status', ['queued', 'running']);
  return Boolean(count);
}

export async function claimAgentJob() {
  const { data, error } = await supabaseAdmin.rpc('claim_agent_job');
  if (error) fail('claim a job', error);
  const rows = (data ?? []) as AgentJobRow[];
  return rows[0] ?? null;
}

export async function finishAgentJob(job: AgentJobRow, outcome: { ok: true; result?: unknown } | { ok: false; error: string }) {
  const now = new Date();
  if (outcome.ok) {
    await supabaseAdmin.from('agent_jobs').update({
      status: 'done', result: outcome.result ?? null, locked_at: null, updated_at: now.toISOString(),
    }).eq('id', job.id);
    return;
  }
  const retry = job.attempts < 3;
  await supabaseAdmin.from('agent_jobs').update({
    status: retry ? 'queued' : 'failed',
    error: outcome.error.slice(0, 500),
    locked_at: null,
    run_after: new Date(now.getTime() + job.attempts * 60_000).toISOString(),
    updated_at: now.toISOString(),
  }).eq('id', job.id);
}

/** Persists progress on a multi-step job so the next invocation picks up where this one stopped. */
export async function requeueAgentJob(job: AgentJobRow, payload: Record<string, unknown>) {
  await supabaseAdmin.from('agent_jobs').update({
    status: 'queued', payload, locked_at: null, attempts: Math.max(0, job.attempts - 1), updated_at: new Date().toISOString(),
  }).eq('id', job.id);
}
