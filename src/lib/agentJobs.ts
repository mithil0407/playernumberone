import 'server-only';

// Background work for the ICONIK agent, driven by /api/agent/worker:
//   verify_look_link     open every product on a Look page in a real browser,
//                        record size/stock/price, then tell the client
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
import { verifyProductWithBrowser } from '@/lib/agentBrowserVerifier';
import { dueNudgeStage, EVENT_NUDGE_STAGES, describeEventTiming } from '@/lib/agentEvents';
import { generateAgentJson } from '@/lib/agentLlm';
import { formatInr, lookLinkUrl } from '@/lib/agentLookLinks';
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
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

const WORKER_BUDGET_MS = 230_000;
/** One product check can take a few minutes; don't start one we cannot finish. */
const PRODUCT_CHECK_HEADROOM_MS = 180_000;

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

/** The only way the agent messages a client who did not just write to it. */
export async function sendProactiveAgentMessage(client: AgentClient, text: string, metadata: Record<string, unknown>) {
  const { data: fresh } = await supabaseAdmin
    .from('agent_clients').select('last_inbound_at, status').eq('id', client.id).maybeSingle();
  if (fresh?.status !== 'active') return { sent: false as const, reason: 'client_not_active' };
  if (!isWithinCustomerServiceWindow(fresh?.last_inbound_at)) return { sent: false as const, reason: 'outside_window' };
  const result = await sendWhatsAppTextMessage(client.phone, text);
  if (!result.success) return { sent: false as const, reason: result.error ?? 'send_failed' };
  await recordOutboundMessage({ clientId: client.id, content: text, whatsappMessageId: result.messageId ?? null, metadata });
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
  id: string; title: string; url: string; colour: string | null; retailer: string | null;
  price_inr: number | null; image_url: string | null; verification_status: string; verification: Record<string, unknown>;
};

function verificationSummary(items: ItemRow[], slug: string) {
  const ok = items.filter(item => item.verification_status === 'verified');
  const gone = items.filter(item => item.verification_status === 'unavailable');
  const lines = items.map(item => {
    const check = item.verification as { price_inr?: number | null; size_checked?: string | null; available_sizes?: string[]; notes?: string };
    const price = formatInr(check.price_inr ?? item.price_inr);
    if (item.verification_status === 'verified') {
      return `✅ ${item.title}${check.size_checked ? ` — your size is in` : ' — in stock'}${price ? `, ${price}` : ''}`;
    }
    if (item.verification_status === 'unavailable') {
      const details = item.verification as { matches_listing?: boolean; in_stock?: boolean | null };
      if (details.matches_listing === false) return `❌ ${item.title} — the store page doesn't match what I picked`;
      if (details.in_stock === false) return `❌ ${item.title} — sold out`;
      const sizes = check.available_sizes?.length ? ` (left: ${check.available_sizes.slice(0, 4).join(', ')})` : '';
      return `❌ ${item.title} — not available in your size${sizes}`;
    }
    return `• ${item.title} — couldn't confirm on the site`;
  });
  const opener = gone.length
    ? `Checked your Look on the actual store pages:`
    : ok.length === items.length
      ? `Checked every piece on the actual store pages — all good to buy:`
      : `Checked your Look on the store pages:`;
  const closer = gone.length
    ? `Want me to find a swap for ${gone.length === 1 ? 'that one' : 'those'}?`
    : `Everything's on your page 👇`;
  return `${opener}\n\n${lines.join('\n')}\n\n${closer}\n${lookLinkUrl(slug)}`;
}

async function runVerifyLookLink(job: AgentJobRow, startedAt: number) {
  const lookLinkId = String(job.payload.look_link_id ?? '');
  const slug = String(job.payload.slug ?? '');
  const client = await loadClient(job.client_id);
  if (!client || !lookLinkId) return { done: true, result: { skipped: 'missing client or look' } };

  const loadItems = async () => {
    const { data, error } = await supabaseAdmin
      .from('look_link_items')
      .select('id, title, url, colour, retailer, price_inr, image_url, verification_status, verification')
      .eq('look_link_id', lookLinkId)
      .order('rank', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ItemRow[];
  };

  const size = await sizeNotes(client.id);
  let items = await loadItems();
  for (const item of items) {
    if (!['pending', 'checking'].includes(item.verification_status)) continue;
    if (Date.now() - startedAt > WORKER_BUDGET_MS - PRODUCT_CHECK_HEADROOM_MS) {
      return { done: false, result: null };
    }
    const retailer = retailerForUrl(item.url);
    await supabaseAdmin.from('look_link_items').update({ verification_status: 'checking' }).eq('id', item.id);
    const check = retailer
      ? await verifyProductWithBrowser({
          url: item.url,
          title: item.title,
          colour: item.colour,
          size,
          retailerDomain: retailer.domain,
        })
      : null;
    await supabaseAdmin.from('look_link_items').update({
      verification_status: check?.status ?? 'failed',
      verification: check ?? { notes: 'Store is not on the trusted list' },
      verified_at: new Date().toISOString(),
      ...(check?.price_inr ? { price_inr: check.price_inr } : {}),
      ...(check?.image_url && !item.image_url ? { image_url: check.image_url } : {}),
    }).eq('id', item.id);
  }

  items = await loadItems();
  const message = verificationSummary(items, slug);
  const delivery = await sendProactiveAgentMessage(client, message, { type: 'look_verification', look_link_id: lookLinkId });
  return {
    done: true,
    result: {
      verified: items.filter(item => item.verification_status === 'verified').length,
      unavailable: items.filter(item => item.verification_status === 'unavailable').length,
      failed: items.filter(item => item.verification_status === 'failed').length,
      update_sent: delivery.sent,
      update_skipped_reason: delivery.sent ? null : delivery.reason,
    },
  };
}

async function runConsolidation(job: AgentJobRow) {
  const client = await loadClient(job.client_id);
  if (!client) return { done: true, result: { skipped: 'missing client' } };
  const passport = await loadStylePassport(client);
  const branches = await consolidateMemory(client.id, JSON.stringify(passport.profile).slice(0, 3_000));
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
    const raw = await generateAgentJson(`You are ICONIK's personal stylist texting a client on WhatsApp. Write one short, warm check-in (max 45 words, no greeting like "Dear", at most one emoji) about their upcoming occasion. It should feel personal, not automated.

Return ONLY JSON: {"message": "…"}

OCCASION: ${event.title} — ${event.event_date} (${describeEventTiming(event.event_date)})${event.dress_code ? `, dress code ${event.dress_code}` : ''}${event.city ? `, in ${event.city}` : ''}
WHY NOW: ${brief}
CLIENT: ${passport.firstName ?? 'the client'}; style notes: ${JSON.stringify(passport.profile.style ?? {}).slice(0, 600)}`, 'iconik_agent_event_checkin');
    const message = typeof raw.message === 'string' ? raw.message.trim().slice(0, 500) : '';
    if (!message) continue;
    const delivery = await sendProactiveAgentMessage(client, message, { type: 'event_checkin', event_id: event.id, stage: stage.key });
    if (delivery.sent) sent += 1;
  }
  return sent;
}

export async function runAgentWorker() {
  const startedAt = Date.now();
  const summary = { jobs: 0, checkIns: 0, handedOff: false, errors: [] as string[] };

  try {
    summary.checkIns = await runEventCheckIns();
  } catch (error) {
    summary.errors.push(`check-ins: ${error instanceof Error ? error.message : String(error)}`);
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
