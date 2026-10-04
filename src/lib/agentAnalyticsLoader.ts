import 'server-only';

// Fetches the last 60 days of agent activity for the analytics dashboard.

import { computeAgentAnalytics, type AnalyticsRows } from '@/lib/agentAnalytics';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';

const PAGE = 1000;
const WINDOW_DAYS = 60;

type Query = { range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> };

/** Reads every row of a query, a page at a time (Supabase caps responses at 1000 rows). */
async function readAll<T>(build: () => Query): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function loadAgentAnalytics(now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [
    clients, inbound, outboundCount, ledger, lookEvents, lookItems, looksCreated, usage, invites, redemptions, waitlist,
    colourCards, inviteShares, clientsInviteCodes,
  ] = await Promise.all([
    readAll<AnalyticsRows['clients'][number]>(() => supabaseAdmin.from('agent_clients')
      .select('id, tier, created_at, last_inbound_at, phone, first_name, line, lite_profile, invited_by_client_id')
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['inbound'][number]>(() => supabaseAdmin.from('agent_messages')
      .select('client_id, created_at')
      .eq('direction', 'inbound')
      .is('metadata->>imported_from', null)
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['outboundCount'][number]>(() => supabaseAdmin.from('agent_messages')
      .select('created_at')
      .eq('direction', 'outbound')
      .neq('kind', 'reaction')
      .is('metadata->>imported_from', null)
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['ledger'][number]>(() => supabaseAdmin.from('agent_credit_ledger')
      .select('client_id, delta, reason, created_at')
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['lookEvents'][number]>(() => supabaseAdmin.from('look_link_events')
      .select('type, client_id, item_id, created_at')
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['lookItems'][number]>(() => supabaseAdmin.from('look_link_items')
      .select('id, retailer, verification_status, created_at')
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['looksCreated'][number]>(() => supabaseAdmin.from('look_links')
      .select('created_at')
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['usage'][number]>(() => supabaseAdmin.from('agent_usage_events')
      .select('client_id, kind, cost_usd, created_at')
      .gte('created_at', since)
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['invites'][number]>(() => supabaseAdmin.from('agent_invites')
      .select('code, owner_client_id, uses, max_uses, note, created_at')
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['redemptions'][number]>(() => supabaseAdmin.from('agent_invite_redemptions')
      .select('code, client_id, created_at')
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['waitlist'][number]>(() => supabaseAdmin.from('agent_waitlist')
      .select('status, created_at')
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['colourCards'][number]>(() => supabaseAdmin.from('agent_messages')
      .select('client_id, created_at')
      .eq('direction', 'outbound')
      .contains('metadata', { type: 'colour_card' })
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['inviteShares'][number]>(() => supabaseAdmin.from('agent_messages')
      .select('client_id, created_at')
      .eq('direction', 'outbound')
      .contains('metadata', { type: 'invite' })
      .order('created_at') as unknown as Query),
    readAll<AnalyticsRows['clientsInviteCodes'][number]>(() => supabaseAdmin.from('agent_clients')
      .select('id, invite_code_used')
      .not('invite_code_used', 'is', null)
      .order('created_at') as unknown as Query),
  ]);

  return computeAgentAnalytics({
    now,
    clients,
    inbound,
    outboundCount,
    ledger,
    lookEvents,
    lookItems,
    looksCreated,
    usage,
    invites,
    redemptions,
    waitlist,
    colourCards,
    inviteShares,
    clientsInviteCodes,
    upgradedClientIds: await findUpgrades(clients.filter(client => client.tier === 'free')),
  });
}

/** Free clients whose number started a Blueprint intake after joining the agent. */
async function findUpgrades(freeClients: AnalyticsRows['clients']) {
  const upgraded = new Set<string>();
  if (!freeClients.length) return upgraded;
  const earliest = freeClients.reduce((min, client) => (client.created_at < min ? client.created_at : min), freeClients[0].created_at);
  const byPhone = new Map(freeClients.map(client => [client.phone, client]));
  for (const table of ['man_intake_submissions', 'stylist_intake_responses'] as const) {
    const rows = await readAll<{ customer_phone: string | null; created_at: string }>(() => supabaseAdmin.from(table)
      .select('customer_phone, created_at')
      .gte('created_at', earliest)
      .order('created_at') as unknown as Query);
    for (const row of rows) {
      const client = byPhone.get(normalizeIndianWhatsappNumber(row.customer_phone ?? '') ?? '');
      if (client && row.created_at > client.created_at) upgraded.add(client.id);
    }
  }
  return upgraded;
}
