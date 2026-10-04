// Turns raw agent tables into the numbers on the analytics dashboard
// (/agent/admin). Pure: the loader fetches rows, this computes.

import { CAMPAIGN_NOTE_PREFIX, isCampaignNote } from './agentGrowth.ts';

export interface AnalyticsRows {
  now: Date;
  clients: Array<{
    id: string; tier: 'blueprint' | 'free'; created_at: string; last_inbound_at: string | null;
    phone: string; first_name: string | null; line: string | null; lite_profile: Record<string, unknown> | null;
    invited_by_client_id: string | null;
  }>;
  inbound: Array<{ client_id: string; created_at: string }>;
  outboundCount: Array<{ created_at: string }>;
  ledger: Array<{ client_id: string; delta: number; reason: string; created_at: string }>;
  lookEvents: Array<{ type: string; client_id: string; item_id: string | null; created_at: string }>;
  lookItems: Array<{ id: string; retailer: string | null; verification_status: string; created_at: string }>;
  looksCreated: Array<{ created_at: string }>;
  usage: Array<{ client_id: string | null; kind: string; cost_usd: number; created_at: string }>;
  invites: Array<{ code: string; owner_client_id: string | null; uses: number; max_uses: number; note: string | null; created_at: string }>;
  redemptions: Array<{ code: string; client_id: string; created_at: string }>;
  waitlist: Array<{ status: string; created_at: string }>;
  colourCards: Array<{ client_id: string; created_at: string }>;
  inviteShares: Array<{ client_id: string; created_at: string }>;
  clientsInviteCodes: Array<{ id: string; invite_code_used: string | null }>;
  /** Free clients whose number later bought a Blueprint. */
  upgradedClientIds: Set<string>;
}

const DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/** Calendar day in India for a timestamp: YYYY-MM-DD. */
export function istDay(value: string | Date) {
  return new Date(new Date(value).getTime() + IST_OFFSET).toISOString().slice(0, 10);
}

export function lastDays(now: Date, count: number) {
  const days: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) days.push(istDay(new Date(now.getTime() - offset * DAY)));
  return days;
}

function within(value: string, now: Date, days: number) {
  return now.getTime() - new Date(value).getTime() <= days * DAY;
}

function countByDay<T extends { created_at: string }>(rows: T[], days: string[], weight: (row: T) => number = () => 1) {
  const totals = new Map(days.map(day => [day, 0]));
  for (const row of rows) {
    const day = istDay(row.created_at);
    if (totals.has(day)) totals.set(day, (totals.get(day) ?? 0) + weight(row));
  }
  return days.map(day => ({ day, value: totals.get(day) ?? 0 }));
}

export function maskPhone(phone: string) {
  return phone.length > 4 ? `…${phone.slice(-4)}` : phone;
}

export interface DailyPoint { day: string; value: number }

export function computeAgentAnalytics(rows: AnalyticsRows) {
  const { now } = rows;
  const days = lastDays(now, 30);
  const runs = rows.ledger.filter(entry => entry.reason === 'shopping_run');
  const clickOuts = rows.lookEvents.filter(event => event.type === 'click_out');

  // Daily active users: distinct clients who messaged that day.
  const activeByDay = new Map<string, Set<string>>(days.map(day => [day, new Set()]));
  for (const message of rows.inbound) activeByDay.get(istDay(message.created_at))?.add(message.client_id);

  const series = {
    activeUsers: days.map(day => ({ day, value: activeByDay.get(day)?.size ?? 0 })),
    newUsers: countByDay(rows.clients, days),
    messages: countByDay(rows.inbound, days),
    shoppingRuns: countByDay(runs, days),
    clickOuts: countByDay(clickOuts, days),
    spendUsd: countByDay(rows.usage, days, row => Number(row.cost_usd) || 0),
    colourCards: countByDay(rows.colourCards, days),
  };

  const active7 = new Set(rows.inbound.filter(message => within(message.created_at, now, 7)).map(message => message.client_id));
  const active1 = new Set(rows.inbound.filter(message => within(message.created_at, now, 1)).map(message => message.client_id));
  const spend7 = rows.usage.filter(row => within(row.created_at, now, 7)).reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);
  const spend30 = rows.usage.filter(row => within(row.created_at, now, 30)).reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);
  const runs30 = runs.filter(entry => within(entry.created_at, now, 30)).length;
  const shoppingSpend30 = rows.usage
    .filter(row => within(row.created_at, now, 30) && ['search', 'product_check', 'followup'].includes(row.kind))
    .reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);

  const spendByKind = new Map<string, number>();
  for (const row of rows.usage.filter(entry => within(entry.created_at, now, 30))) {
    spendByKind.set(row.kind, (spendByKind.get(row.kind) ?? 0) + Number(row.cost_usd || 0));
  }

  const freeClients = rows.clients.filter(client => client.tier === 'free');
  const carded = new Set(rows.colourCards.map(card => card.client_id));
  for (const client of freeClients) {
    if (Array.isArray(client.lite_profile?.best_colours) && (client.lite_profile?.best_colours as unknown[]).length) carded.add(client.id);
  }
  const ranRun = new Set(runs.map(entry => entry.client_id));
  const clicked = new Set(clickOuts.map(event => event.client_id));
  const funnel = [
    { label: 'Joined (free)', value: freeClients.length },
    { label: 'Got their Colour Card', value: freeClients.filter(client => carded.has(client.id)).length },
    { label: 'Shared their invite', value: freeClients.filter(client => rows.inviteShares.some(share => share.client_id === client.id)).length },
    { label: 'Did a product hunt', value: freeClients.filter(client => ranRun.has(client.id)).length },
    { label: 'Clicked through to a store', value: freeClients.filter(client => clicked.has(client.id)).length },
    { label: 'Bought a Blueprint', value: freeClients.filter(client => rows.upgradedClientIds.has(client.id)).length },
  ];

  // Weekly signup cohorts: share who messaged again in later weeks.
  const messagesByClient = new Map<string, number[]>();
  for (const message of rows.inbound) {
    const list = messagesByClient.get(message.client_id) ?? [];
    list.push(new Date(message.created_at).getTime());
    messagesByClient.set(message.client_id, list);
  }
  const weekStart = (value: string) => {
    const date = new Date(new Date(value).getTime() + IST_OFFSET);
    const day = (date.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day)).toISOString().slice(0, 10);
  };
  const cohortMap = new Map<string, typeof rows.clients>();
  for (const client of rows.clients) {
    const key = weekStart(client.created_at);
    cohortMap.set(key, [...(cohortMap.get(key) ?? []), client]);
  }
  const retentionWindows = [{ label: 'Week 1', from: 7, to: 14 }, { label: 'Week 2', from: 14, to: 21 }, { label: 'Week 4', from: 28, to: 35 }];
  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([week, members]) => ({
      week,
      users: members.length,
      retention: retentionWindows.map(window => {
        const eligible = members.filter(client => now.getTime() - new Date(client.created_at).getTime() >= window.to * DAY);
        if (!eligible.length) return null;
        const retained = eligible.filter(client => {
          const joined = new Date(client.created_at).getTime();
          return (messagesByClient.get(client.id) ?? []).some(time => time >= joined + window.from * DAY && time < joined + window.to * DAY);
        });
        return retained.length / eligible.length;
      }),
    }));

  const lookCounts = (type: string) => rows.lookEvents.filter(event => event.type === type && within(event.created_at, now, 30)).length;
  const views30 = lookCounts('view');
  const checkedItems = rows.lookItems.filter(item => ['verified', 'unavailable', 'failed'].includes(item.verification_status));
  const itemRetailer = new Map(rows.lookItems.map(item => [item.id, item.retailer ?? 'Unknown']));
  const retailerClicks = new Map<string, number>();
  for (const event of clickOuts.filter(entry => within(entry.created_at, now, 30))) {
    const retailer = itemRetailer.get(event.item_id ?? '') ?? 'Unknown';
    retailerClicks.set(retailer, (retailerClicks.get(retailer) ?? 0) + 1);
  }

  const clientCodes = new Set(rows.invites.filter(invite => invite.owner_client_id).map(invite => invite.code));
  const referralJoins = rows.redemptions.filter(redemption => clientCodes.has(redemption.code)).length;
  const inviterCounts = new Map<string, number>();
  for (const client of rows.clients) {
    if (client.invited_by_client_id) inviterCounts.set(client.invited_by_client_id, (inviterCounts.get(client.invited_by_client_id) ?? 0) + 1);
  }
  const clientById = new Map(rows.clients.map(client => [client.id, client]));

  const balances = new Map<string, number>();
  for (const entry of rows.ledger) balances.set(entry.client_id, (balances.get(entry.client_id) ?? 0) + Number(entry.delta));
  const messages30 = new Map<string, number>();
  for (const message of rows.inbound.filter(entry => within(entry.created_at, now, 30))) {
    messages30.set(message.client_id, (messages30.get(message.client_id) ?? 0) + 1);
  }
  const runsByClient = new Map<string, number>();
  for (const entry of runs) runsByClient.set(entry.client_id, (runsByClient.get(entry.client_id) ?? 0) + 1);
  const spendByClient = new Map<string, number>();
  for (const row of rows.usage) if (row.client_id) spendByClient.set(row.client_id, (spendByClient.get(row.client_id) ?? 0) + Number(row.cost_usd || 0));

  const codeByClient = new Map(rows.clientsInviteCodes.map(row => [row.id, row.invite_code_used]));
  const campaigns = rows.invites
    .filter(invite => !invite.owner_client_id && isCampaignNote(invite.note))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(invite => {
      const joined = rows.clients.filter(client => codeByClient.get(client.id) === invite.code);
      const joinedIds = new Set(joined.map(client => client.id));
      return {
        name: (invite.note ?? '').slice(CAMPAIGN_NOTE_PREFIX.length).trim() || invite.code,
        code: invite.code,
        joined: joined.length,
        colourCards: joined.filter(client => carded.has(client.id)).length,
        hunted: joined.filter(client => ranRun.has(client.id)).length,
        friendsBrought: rows.clients.filter(client => client.invited_by_client_id && joinedIds.has(client.invited_by_client_id)).length,
      };
    });

  return {
    generatedAt: now.toISOString(),
    campaigns,
    totals: {
      users: rows.clients.length,
      freeUsers: freeClients.length,
      blueprintUsers: rows.clients.length - freeClients.length,
      newUsers7: rows.clients.filter(client => within(client.created_at, now, 7)).length,
      active1: active1.size,
      active7: active7.size,
      messages7: rows.inbound.filter(message => within(message.created_at, now, 7)).length,
      replies7: rows.outboundCount.filter(message => within(message.created_at, now, 7)).length,
      runs7: runs.filter(entry => within(entry.created_at, now, 7)).length,
      colourCards7: rows.colourCards.filter(card => within(card.created_at, now, 7)).length,
      colourCardsTotal: rows.colourCards.length,
      inviteShares7: rows.inviteShares.filter(share => within(share.created_at, now, 7)).length,
      clickOuts7: clickOuts.filter(event => within(event.created_at, now, 7)).length,
      spend7,
      spend30,
      costPerActiveUser7: active7.size ? spend7 / active7.size : 0,
      costPerRun30: runs30 ? shoppingSpend30 / runs30 : 0,
    },
    series,
    spendByKind: [...spendByKind.entries()].map(([kind, usd]) => ({ kind, usd })).sort((a, b) => b.usd - a.usd),
    funnel,
    cohorts,
    looks: {
      created30: rows.looksCreated.filter(look => within(look.created_at, now, 30)).length,
      views30,
      likes30: lookCounts('like'),
      saves30: lookCounts('save'),
      votes30: lookCounts('vote'),
      shares30: lookCounts('share'),
      clickOuts30: lookCounts('click_out'),
      clickThroughRate: views30 ? lookCounts('click_out') / views30 : 0,
      verifiedRate: checkedItems.length ? checkedItems.filter(item => item.verification_status === 'verified').length / checkedItems.length : 0,
      topRetailers: [...retailerClicks.entries()].map(([retailer, clicks]) => ({ retailer, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 8),
    },
    growth: {
      teamCodes: rows.invites.filter(invite => !invite.owner_client_id).length,
      clientCodes: clientCodes.size,
      redemptions: rows.redemptions.length,
      referralJoins,
      /** Friends brought in per user: the viral coefficient. */
      kFactor: rows.clients.length ? referralJoins / rows.clients.length : 0,
      waitlistWaiting: rows.waitlist.filter(entry => entry.status === 'waiting').length,
      waitlistAdmitted: rows.waitlist.filter(entry => entry.status === 'admitted').length,
      waitlistJoined: rows.waitlist.filter(entry => entry.status === 'joined').length,
      topInviters: [...inviterCounts.entries()]
        .map(([id, friends]) => ({ name: clientById.get(id)?.first_name ?? maskPhone(clientById.get(id)?.phone ?? ''), friends }))
        .sort((a, b) => b.friends - a.friends)
        .slice(0, 5),
      teamInvites: rows.invites
        .filter(invite => !invite.owner_client_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20)
        .map(invite => ({ code: invite.code, uses: invite.uses, maxUses: invite.max_uses, note: invite.note })),
    },
    recentUsers: [...rows.clients]
      .sort((a, b) => (b.last_inbound_at ?? b.created_at).localeCompare(a.last_inbound_at ?? a.created_at))
      .slice(0, 30)
      .map(client => ({
        id: client.id,
        name: client.first_name ?? '—',
        phone: maskPhone(client.phone),
        tier: client.tier,
        line: client.line,
        joined: client.created_at,
        lastActive: client.last_inbound_at,
        messages30: messages30.get(client.id) ?? 0,
        runs: runsByClient.get(client.id) ?? 0,
        credits: client.tier === 'free' ? balances.get(client.id) ?? 0 : null,
        spendUsd: spendByClient.get(client.id) ?? 0,
        upgraded: rows.upgradedClientIds.has(client.id),
      })),
  };
}

export type AgentAnalytics = ReturnType<typeof computeAgentAnalytics>;
