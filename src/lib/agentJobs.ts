import 'server-only';

// Background work for the ICONIK agent, driven by /api/agent/worker:
//   verify_look_link     open every product in a real browser (size, stock,
//                        price, delivery to the pincode, returns), then send
//                        numbered product cards and a short follow-up
//   consolidate_memory   fold busy memory branches into their gists
//   event check-ins      reminders for saved occasions
//
// Production has no reliable scheduler (an external GET cron is the fallback),
// so each invocation hands over to the next while work remains.
//
// Every proactive WhatsApp message goes through sendProactiveAgentMessage(),
// which only sends inside the 24h customer-service window: ICONIK does not use
// Meta templates. A check-in that cannot be sent waits for the client's next
// message and is raised in that conversation instead.

import { loadStylePassport, type AgentClient } from '@/lib/agentClients';
import { verifyProductWithBrowser, type ProductCheckResult } from '@/lib/agentBrowserVerifier';
import { dueNudgeStage, EVENT_NUDGE_STAGES, describeEventTiming } from '@/lib/agentEvents';
import { generateAgentJson, withAgentUsage } from '@/lib/agentLlm';
import { lookLinkUrl } from '@/lib/agentLookLinks';
import { buildProductCaption, type PresentableProduct } from '@/lib/agentPresentation';
import { renderProductCards } from '@/lib/agentProductCards';
import { consolidateMemory, loadMemoryNodes } from '@/lib/agentMemoryStore';
import { searchMemories } from '@/lib/agentMemoryTree';
import { retailerForUrl } from '@/lib/agentProductSearch';
import {
  claimAgentJob,
  claimEventNudge,
  finishAgentJob,
  recordOutboundMessage,
  requeueAgentJob,
  upcomingEventsWithReminders,
  type AgentJobRow,
} from '@/lib/agentStore';
import { isWithinCustomerServiceWindow } from '@/lib/agentWhatsapp';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppImageInOrder, sendWhatsAppTextMessage } from '@/lib/whatsapp';

const WORKER_BUDGET_MS = 230_000;
/** A product check usually takes under a minute (capped at ~3); don't start a batch we cannot finish. */
const PRODUCT_CHECK_HEADROOM_MS = 175_000;
/** Rendering cards and sending them needs a little time of its own. */
const PRESENT_HEADROOM_MS = 45_000;
/** Products checked at once, each in its own browser. */
const VERIFY_CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.ICONIK_AGENT_VERIFY_CONCURRENCY) || 3));

export async function dispatchAgentWorker() {
  const base = process.env.ICONIK_AGENT_WORKER_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return;
  try {
    await fetch(new URL('/api/agent/worker', base), {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      cache: 'no-store',
      // The worker runs for minutes; only the hand-off needs to land.
      signal: AbortSignal.timeout(4_000),
    });
  } catch (error) {
    if (!(error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))) {
      console.error('[agent] could not dispatch the worker', error);
    }
  }
}

/**
 * The only way the agent messages a client who did not just write to it. Text,
 * or an image with a caption; sent only inside the 24h customer-service window.
 */
export async function sendProactiveAgentMessage(
  client: AgentClient,
  text: string,
  metadata: Record<string, unknown>,
  imageUrl?: string | null,
) {
  const { data: fresh } = await supabaseAdmin
    .from('agent_clients').select('last_inbound_at, status').eq('id', client.id).maybeSingle();
  if (fresh?.status !== 'active') return { sent: false as const, reason: 'client_not_active' };
  if (!isWithinCustomerServiceWindow(fresh?.last_inbound_at)) return { sent: false as const, reason: 'outside_window' };
  const result = imageUrl
    ? await sendWhatsAppImageInOrder(client.phone, imageUrl, text)
    : await sendWhatsAppTextMessage(client.phone, text);
  if (!result.success) return { sent: false as const, reason: result.error ?? 'send_failed' };
  await recordOutboundMessage({
    clientId: client.id,
    kind: imageUrl ? 'image' : 'text',
    content: text,
    imageUrl: imageUrl ?? null,
    whatsappMessageId: result.messageId ?? null,
    metadata,
  });
  return { sent: true as const };
}

async function loadClient(clientId: string | null) {
  if (!clientId) return null;
  const { data } = await supabaseAdmin.from('agent_clients').select('*').eq('id', clientId).maybeSingle();
  return data as AgentClient | null;
}

async function sizeNotes(clientId: string) {
  const nodes = await loadMemoryNodes(clientId);
  const notes = searchMemories(nodes, 'size sizes fit wears', 3)
    .filter(node => node.path.startsWith('body'))
    .map(node => node.content);
  return notes.length ? notes.join(' ') : null;
}

type ItemRow = {
  id: string; title: string; url: string; colour: string | null; retailer: string | null; reason: string | null;
  rank: number; price_inr: number | null; image_url: string | null; verification_status: string;
  verification: Record<string, unknown>;
};

function cardDateLabel(now = new Date()) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(now);
}

function unavailableReason(item: ItemRow) {
  const check = item.verification as { matches_listing?: boolean; in_stock?: boolean | null; available_sizes?: string[] };
  if (check.matches_listing === false) return "the store page didn't match what I picked";
  if (check.in_stock === false) return 'sold out';
  return `not available in the size${check.available_sizes?.length ? ` (left: ${check.available_sizes.slice(0, 4).join(', ')})` : ''}`;
}

/**
 * Presents a checked Look the way a personal shopper would: one numbered card
 * per product that can actually be bought (my pick first), then a short
 * summary of what the store pages confirmed, then one useful next step.
 */
async function presentLook(client: AgentClient, items: ItemRow[], job: AgentJobRow) {
  const slug = String(job.payload.slug ?? '');
  const lookLinkId = String(job.payload.look_link_id ?? '');
  const pincode = typeof job.payload.pincode === 'string' ? job.payload.pincode : null;
  const brief = typeof job.payload.brief === 'string' ? job.payload.brief : '';
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro';
  const pickId = items.find(item => item.rank === 0)?.id;

  const presentable = [
    ...items.filter(item => item.verification_status === 'verified'),
    ...items.filter(item => item.verification_status === 'failed'),
  ];
  const products: PresentableProduct[] = presentable.map((item, index) => {
    const check = item.verification as Partial<ProductCheckResult>;
    return {
      number: index + 1,
      title: item.title,
      retailer: item.retailer,
      priceInr: check.price_inr ?? item.price_inr,
      mrpInr: check.mrp_inr ?? null,
      colour: check.colour ?? item.colour,
      reason: item.reason,
      isPick: item.id === pickId && item.verification_status === 'verified',
      status: item.verification_status as PresentableProduct['status'],
      sizeChecked: check.size_checked ?? null,
      sizeAvailable: check.size_available ?? null,
      deliveryEstimate: check.delivery_estimate ?? null,
      pincode,
      imageUrl: check.image_url ?? item.image_url,
      shopUrl: new URL(`/go/${item.id}`, site).toString(),
    };
  });

  const cards = await renderProductCards(client.id, products, cardDateLabel());
  let sent = 0;
  for (const product of products) {
    const delivery = await sendProactiveAgentMessage(
      client,
      buildProductCaption(product),
      { type: 'product_card', look_link_id: lookLinkId, number: product.number },
      cards.get(product.number) ?? product.imageUrl,
    );
    if (!delivery.sent) return { sent, reason: delivery.reason };
    sent += 1;
  }

  const facts = {
    request: brief,
    delivery_pincode: pincode,
    presented: presentable.map((item, index) => {
      const check = item.verification as Partial<ProductCheckResult>;
      return {
        number: index + 1,
        title: item.title,
        store: item.retailer,
        price_inr: check.price_inr ?? item.price_inr,
        confirmed_on_store_page: item.verification_status === 'verified',
        size_checked: check.size_checked ?? null,
        size_available: check.size_available ?? null,
        delivery_estimate: check.delivery_estimate ?? null,
        returns: check.returns ?? null,
        store_notes: check.notes ?? null,
      };
    }),
    not_available: items
      .filter(item => item.verification_status === 'unavailable')
      .map(item => ({ title: item.title, why: unavailableReason(item) })),
  };
  const raw = await generateAgentJson(`You are ICONIK's personal stylist on WhatsApp. You just sent the client product cards for their request. Write the follow-up, like a sharp personal shopper.

Return ONLY JSON: {"summary": "…", "next_step": "…"}
- summary: 1-3 short sentences using ONLY the facts below — what the store pages confirmed (store, size, delivery date to their pincode, returns), any fit or stock note worth knowing, and honestly what was not available. If nothing could be presented, say so plainly and suggest what you'd look for instead. No headings, no lists.
- next_step: one short question offering the single most useful next move (e.g. build the full outfit around #1, find it in another colour, look for a cheaper alternative). Never offer to place the order or take payment.
- Plain everyday English, at most one emoji in total.

FACTS:
${JSON.stringify(facts)}`, 'iconik_agent_look_followup');
  const summary = typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 700) : '';
  const nextStep = typeof raw.next_step === 'string' ? raw.next_step.trim().slice(0, 300) : '';
  const lookLine = products.length ? `All picks in one place, tap ♥ on what you like: ${lookLinkUrl(slug)}` : '';
  for (const text of [[summary, lookLine].filter(Boolean).join('\n\n'), nextStep].filter(Boolean)) {
    const delivery = await sendProactiveAgentMessage(client, text, { type: 'look_followup', look_link_id: lookLinkId });
    if (!delivery.sent) return { sent, reason: delivery.reason };
    sent += 1;
  }
  return { sent, reason: null };
}

async function runVerifyLookLink(job: AgentJobRow, startedAt: number) {
  const lookLinkId = String(job.payload.look_link_id ?? '');
  const client = await loadClient(job.client_id);
  if (!client || !lookLinkId) return { done: true, result: { skipped: 'missing client or look' } };

  const loadItems = async () => {
    const { data, error } = await supabaseAdmin
      .from('look_link_items')
      .select('id, title, url, colour, retailer, reason, rank, price_inr, image_url, verification_status, verification')
      .eq('look_link_id', lookLinkId)
      .order('rank', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ItemRow[];
  };

  const size = typeof job.payload.size === 'string' && job.payload.size.trim()
    ? job.payload.size.trim()
    : await sizeNotes(client.id);
  const pincode = typeof job.payload.pincode === 'string' ? job.payload.pincode : null;
  const verifyItem = async (item: ItemRow) => {
    const retailer = retailerForUrl(item.url);
    await supabaseAdmin.from('look_link_items').update({ verification_status: 'checking' }).eq('id', item.id);
    const check = retailer
      ? await withAgentUsage({ clientId: client.id, kind: 'product_check' }, () => verifyProductWithBrowser({
          url: item.url,
          title: item.title,
          colour: item.colour,
          size,
          pincode,
          retailerDomain: retailer.domain,
        }))
      : null;
    await supabaseAdmin.from('look_link_items').update({
      verification_status: check?.status ?? 'failed',
      verification: check ?? { notes: 'Store is not on the trusted list' },
      verified_at: new Date().toISOString(),
      ...(check?.price_inr ? { price_inr: check.price_inr } : {}),
      ...(check?.image_url && !item.image_url ? { image_url: check.image_url } : {}),
    }).eq('id', item.id);
  };

  let items = await loadItems();
  let pending = items.filter(item => ['pending', 'checking'].includes(item.verification_status));
  while (pending.length) {
    if (Date.now() - startedAt > WORKER_BUDGET_MS - PRODUCT_CHECK_HEADROOM_MS) return { done: false, result: null };
    await Promise.all(pending.slice(0, VERIFY_CONCURRENCY).map(verifyItem));
    pending = pending.slice(VERIFY_CONCURRENCY);
  }
  if (Date.now() - startedAt > WORKER_BUDGET_MS - PRESENT_HEADROOM_MS) return { done: false, result: null };

  items = await loadItems();
  const presented = await withAgentUsage({ clientId: client.id, kind: 'followup' }, () => presentLook(client, items, job));
  return {
    done: true,
    result: {
      verified: items.filter(item => item.verification_status === 'verified').length,
      unavailable: items.filter(item => item.verification_status === 'unavailable').length,
      failed: items.filter(item => item.verification_status === 'failed').length,
      messages_sent: presented.sent,
      stopped_reason: presented.reason,
    },
  };
}

async function runConsolidation(job: AgentJobRow) {
  const client = await loadClient(job.client_id);
  if (!client) return { done: true, result: { skipped: 'missing client' } };
  const passport = await loadStylePassport(client);
  const branches = await withAgentUsage({ clientId: client.id, kind: 'memory' }, () => (
    consolidateMemory(client.id, JSON.stringify(passport.profile).slice(0, 3_000))
  ));
  return { done: true, result: { branches } };
}

/**
 * Event check-ins. Sent only while the client is inside the 24h window; others
 * stay due and the agent raises them in the client's next conversation
 * (see "CHECK-IN DUE" in agentPrompt.ts), which then claims the stage.
 */
async function runEventCheckIns() {
  const events = await upcomingEventsWithReminders();
  let sent = 0;
  for (const event of events) {
    const client = event.agent_clients;
    const stage = dueNudgeStage(event);
    if (!client || !stage || !isWithinCustomerServiceWindow(client.last_inbound_at)) continue;
    if (!await claimEventNudge(event, stage.key)) continue;

    const passport = await loadStylePassport(client);
    const brief = EVENT_NUDGE_STAGES.find(item => item.key === stage.key)?.brief ?? '';
    const raw = await withAgentUsage({ clientId: client.id, kind: 'checkin' }, () => generateAgentJson(`You are ICONIK's personal stylist texting a client on WhatsApp. Write one short, warm check-in (max 45 words, no greeting like "Dear", at most one emoji) about their upcoming occasion. It should feel personal, not automated.

Return ONLY JSON: {"message": "…"}

OCCASION: ${event.title} — ${event.event_date} (${describeEventTiming(event.event_date)})${event.dress_code ? `, dress code ${event.dress_code}` : ''}${event.city ? `, in ${event.city}` : ''}
WHY NOW: ${brief}
CLIENT: ${passport.firstName ?? 'the client'}; style notes: ${JSON.stringify(passport.profile.style ?? passport.profile).slice(0, 600)}`, 'iconik_agent_event_checkin'));
    const message = typeof raw.message === 'string' ? raw.message.trim().slice(0, 500) : '';
    if (!message) continue;
    const delivery = await sendProactiveAgentMessage(client, message, { type: 'event_checkin', event_id: event.id, stage: stage.key });
    if (delivery.sent) sent += 1;
  }
  return sent;
}

/** The last chance to reach someone on WhatsApp is just before their 24h window closes. */
const FOLLOW_UP_AFTER_HOURS = 19;
const FOLLOW_UP_BEFORE_HOURS = 23;
const FOLLOW_UP_EVERY_DAYS = 3;

/**
 * One genuinely useful message to free clients who went quiet ~20 hours ago:
 * a tip in their colours and a question that invites a reply (which reopens the
 * window). At most once every few days, and only once they have a Colour Card.
 */
async function runWindowFollowUps() {
  const now = Date.now();
  const { data: clients, error } = await supabaseAdmin
    .from('agent_clients')
    .select('*')
    .eq('tier', 'free')
    .eq('status', 'active')
    .gte('last_inbound_at', new Date(now - FOLLOW_UP_BEFORE_HOURS * 3_600_000).toISOString())
    .lte('last_inbound_at', new Date(now - FOLLOW_UP_AFTER_HOURS * 3_600_000).toISOString())
    .limit(200);
  if (error) throw new Error(error.message);
  let sent = 0;
  for (const client of (clients ?? []) as AgentClient[]) {
    const profile = client.lite_profile ?? {};
    if (!Array.isArray(profile.best_colours) || !profile.best_colours.length) continue;
    const { count } = await supabaseAdmin
      .from('agent_messages')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('direction', 'outbound')
      .contains('metadata', { type: 'window_followup' })
      .gte('created_at', new Date(now - FOLLOW_UP_EVERY_DAYS * 86_400_000).toISOString());
    if (count) continue;

    const { data: recent } = await supabaseAdmin
      .from('agent_messages')
      .select('direction, content')
      .eq('client_id', client.id)
      .neq('kind', 'reaction')
      .order('created_at', { ascending: false })
      .limit(8);
    const thread = [...(recent ?? [])].reverse()
      .map(message => `${message.direction === 'inbound' ? 'Client' : 'ICONIK'}: ${String(message.content).slice(0, 300)}`)
      .join('\n');
    const raw = await withAgentUsage({ clientId: client.id, kind: 'checkin' }, () => generateAgentJson(`You are ICONIK, a personal stylist on WhatsApp. The client went quiet yesterday. Write ONE message (max 45 words) that's worth opening:
- a specific, useful tip in their colours (how to wear their power colour this week, or one swap for something they mentioned owning), then
- one easy question that invites a reply (e.g. "Want me to find one under ₹1,500?").
Warm and personal, never salesy, never "just checking in", at most one emoji.

Return ONLY JSON: {"message": "…"}

CLIENT: ${client.first_name ?? 'unknown name'}; ${String(profile.season ?? '')} — best colours ${(profile.best_colours as string[]).join(', ')}; avoid ${Array.isArray(profile.avoid_colours) ? (profile.avoid_colours as string[]).join(', ') : 'unknown'}
RECENT CHAT:
${thread}`, 'iconik_agent_window_followup'));
    const message = typeof raw.message === 'string' ? raw.message.trim().slice(0, 500) : '';
    if (!message) continue;
    const delivery = await sendProactiveAgentMessage(client, message, { type: 'window_followup' });
    if (delivery.sent) sent += 1;
  }
  return sent;
}

export async function runAgentWorker() {
  const startedAt = Date.now();
  const summary = { jobs: 0, checkIns: 0, followUps: 0, handedOff: false, errors: [] as string[] };

  try {
    summary.checkIns = await runEventCheckIns();
  } catch (error) {
    summary.errors.push(`check-ins: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    summary.followUps = await runWindowFollowUps();
  } catch (error) {
    summary.errors.push(`follow-ups: ${error instanceof Error ? error.message : String(error)}`);
  }

  while (Date.now() - startedAt < WORKER_BUDGET_MS - 20_000) {
    const job = await claimAgentJob();
    if (!job) break;
    summary.jobs += 1;
    try {
      const outcome = job.type === 'verify_look_link'
        ? await runVerifyLookLink(job, startedAt)
        : await runConsolidation(job);
      if (outcome.done) {
        await finishAgentJob(job, { ok: true, result: outcome.result });
      } else {
        await requeueAgentJob(job, job.payload);
        summary.handedOff = true;
        break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`${job.type}: ${message}`);
      await finishAgentJob(job, { ok: false, error: message });
    }
  }

  if (summary.handedOff) await dispatchAgentWorker();
  return summary;
}
