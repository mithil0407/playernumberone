import 'server-only';

// Free-tier persistence: shopping-run credits, invite codes and redemptions,
// enrolment of people without a Blueprint, and the waitlist.

import type { AgentClient } from '@/lib/agentClients';
import {
  CAMPAIGN_FIRST_MONTH_RUNS,
  CAMPAIGN_NOTE_PREFIX,
  DIRECT_CAMPAIGN_NAME,
  FREE_LIMITS,
  createInviteCode,
  friendJoinedMessage,
  indiaMonthKey,
  inviteLink,
  isCampaignNote,
  monthlyGrantAmount,
} from '@/lib/agentGrowth';
import { sendProactiveAgentMessage } from '@/lib/agentJobs';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';
import { getWhatsAppBusinessNumber } from '@/lib/whatsapp';

// ── Credits ──

export async function creditBalance(clientId: string) {
  const { data, error } = await supabaseAdmin.from('agent_credit_ledger').select('delta').eq('client_id', clientId);
  if (error) throw new Error(`Could not load credits: ${error.message}`);
  return (data ?? []).reduce((sum, row) => sum + Number(row.delta ?? 0), 0);
}

async function addCredits(clientId: string, delta: number, reason: string, ref: string) {
  if (!delta) return false;
  const { error } = await supabaseAdmin.from('agent_credit_ledger').insert({ client_id: clientId, delta, reason, ref });
  if (error && error.code !== '23505') throw new Error(`Could not update credits: ${error.message}`);
  return !error;
}

/** Tops a free client up for the month, once per calendar month. */
export async function ensureMonthlyGrant(client: AgentClient) {
  if (client.tier !== 'free') return;
  const month = indiaMonthKey();
  const { count } = await supabaseAdmin
    .from('agent_credit_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('reason', 'monthly_grant')
    .eq('ref', month);
  if (count) return;
  await addCredits(client.id, monthlyGrantAmount(await creditBalance(client.id)), 'monthly_grant', month);
}

export type ChargeResult =
  | { ok: true; remaining: number | null }
  | { ok: false; reason: 'no_runs' | 'daily_cap' };

/** One product hunt = one run for free clients (charged once per turn). Blueprint clients are unlimited. */
export async function chargeShoppingRun(client: AgentClient, turnId: string): Promise<ChargeResult> {
  if (client.tier !== 'free') return { ok: true, remaining: null };
  await ensureMonthlyGrant(client);
  const balance = await creditBalance(client.id);
  if (balance <= 0) return { ok: false, reason: 'no_runs' };

  const startOfDay = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())}T00:00:00+05:30`);
  const { count: runsToday } = await supabaseAdmin
    .from('agent_credit_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('reason', 'shopping_run')
    .gte('created_at', startOfDay.toISOString());
  if ((runsToday ?? 0) >= FREE_LIMITS.dailyRunsGlobal) return { ok: false, reason: 'daily_cap' };

  await addCredits(client.id, -1, 'shopping_run', turnId);
  return { ok: true, remaining: balance - 1 };
}

export async function inboundMessagesToday(clientId: string) {
  const startOfDay = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())}T00:00:00+05:30`);
  const { count } = await supabaseAdmin
    .from('agent_messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('direction', 'inbound')
    .gte('created_at', startOfDay.toISOString());
  return count ?? 0;
}

/**
 * Photo checks used since `since`: answered conversations that included a
 * photo (an album of three is one check). The instant share message doesn't count.
 */
export async function photoChecksUsed(clientId: string, since: Date) {
  const { data: photos, error } = await supabaseAdmin
    .from('agent_messages')
    .select('turn_id')
    .eq('client_id', clientId)
    .eq('direction', 'inbound')
    .eq('kind', 'image')
    .not('turn_id', 'is', null)
    .gte('created_at', since.toISOString());
  if (error) throw new Error(`Could not count photo checks: ${error.message}`);
  const turnIds = [...new Set((photos ?? []).map(row => row.turn_id as string))];
  if (!turnIds.length) return 0;
  const { count } = await supabaseAdmin
    .from('agent_turns')
    .select('id', { count: 'exact', head: true })
    .in('id', turnIds)
    .neq('model', 'instant');
  return count ?? 0;
}

// ── Invites ──

async function insertInvite(ownerClientId: string | null, maxUses: number, note: string | null) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = createInviteCode();
    const { error } = await supabaseAdmin.from('agent_invites').insert({ code, owner_client_id: ownerClientId, max_uses: maxUses, note });
    if (!error) return code;
    if (error.code !== '23505') throw new Error(`Could not create an invite: ${error.message}`);
  }
  throw new Error('Could not create a unique invite code');
}

/** The client's own invite code (created on first use) and how many friends can still join with it. */
export async function ensureInviteCode(client: AgentClient) {
  const { data } = await supabaseAdmin
    .from('agent_invites')
    .select('code, max_uses, uses')
    .eq('owner_client_id', client.id)
    .eq('disabled', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const number = await getWhatsAppBusinessNumber();
  if (data) return { code: data.code as string, remaining: Math.max(0, data.max_uses - data.uses), link: inviteLink(data.code, number) };
  const code = await insertInvite(client.id, FREE_LIMITS.invitesPerUser, null);
  return { code, remaining: FREE_LIMITS.invitesPerUser, link: inviteLink(code, number) };
}

/** Friends who joined with this client's invite link: what unlocks their Face Analysis. */
export async function friendsJoined(clientId: string) {
  const { count } = await supabaseAdmin
    .from('agent_clients')
    .select('id', { count: 'exact', head: true })
    .eq('invited_by_client_id', clientId);
  return count ?? 0;
}

/** The client who owns an invite code (null for team and campaign codes). */
export async function inviteOwner(code: string) {
  const { data } = await supabaseAdmin.from('agent_invites').select('owner_client_id').eq('code', code.toUpperCase()).maybeSingle();
  return (data?.owner_client_id as string | null | undefined) ?? null;
}

/** Codes the team hands out (first wave, partners, campaigns). */
export async function createTeamInvites(count: number, maxUses: number, note: string | null) {
  const codes: string[] = [];
  for (let index = 0; index < Math.min(Math.max(1, count), 200); index += 1) {
    codes.push(await insertInvite(null, Math.max(1, maxUses), note));
  }
  return codes;
}

/**
 * A campaign link (a reel, an ad): one code many people use, which always gets
 * them in, asks for the free colour analysis (or body shape analysis), and is attributed on the dashboard.
 */
export async function createCampaign(name: string, maxUses: number, purpose: 'colour_analysis' | 'body_analysis' = 'colour_analysis') {
  const code = await insertInvite(null, Math.max(1, maxUses), `${CAMPAIGN_NOTE_PREFIX} ${name.trim().slice(0, 80)}`);
  return { code, link: inviteLink(code, await getWhatsAppBusinessNumber(), purpose) };
}

/** The always-open campaign for people who message the number asking for a colour analysis. */
export async function ensureDirectCampaignCode() {
  const note = `${CAMPAIGN_NOTE_PREFIX} ${DIRECT_CAMPAIGN_NAME}`;
  const { data } = await supabaseAdmin.from('agent_invites').select('code').eq('note', note).is('owner_client_id', null).limit(1).maybeSingle();
  if (data) return data.code as string;
  return insertInvite(null, 10_000_000, note);
}

export async function teamInviteLinks(codes: string[]) {
  const number = await getWhatsAppBusinessNumber();
  return codes.map(code => ({ code, link: inviteLink(code, number) }));
}

async function findClientByPhone(phone: string) {
  const { data } = await supabaseAdmin.from('agent_clients').select('*').eq('phone', phone).maybeSingle();
  return data as AgentClient | null;
}

/**
 * Enrols someone without a Blueprint on the free tier, using an invite code
 * (or none, when signups are open). The friend who invited them and the new
 * client both get bonus runs, and the inviter hears about it.
 */
export async function enrolFreeClient(rawPhone: string, code: string | null): Promise<AgentClient | null> {
  const phone = normalizeIndianWhatsappNumber(rawPhone);
  if (!phone) return null;

  let invite: { code: string; owner_client_id: string | null; note: string | null } | null = null;
  if (code) {
    const { data, error } = await supabaseAdmin.rpc('claim_agent_invite', { p_code: code });
    if (error) throw new Error(`Could not redeem the invite: ${error.message}`);
    invite = ((data ?? []) as Array<{ code: string; owner_client_id: string | null; note: string | null }>)[0] ?? null;
    if (!invite) return null;
  }

  const { data: created, error } = await supabaseAdmin
    .from('agent_clients')
    .insert({
      phone,
      tier: 'free',
      line: null,
      invited_by_client_id: invite?.owner_client_id ?? null,
      invite_code_used: invite?.code ?? null,
    })
    .select('*')
    .single();
  if (error) {
    const existing = await findClientByPhone(phone);
    if (existing) return existing;
    throw new Error(`Could not enrol: ${error.message}`);
  }
  const client = created as AgentClient;

  if (invite) {
    await supabaseAdmin.from('agent_invite_redemptions').insert({ code: invite.code, client_id: client.id });
  }
  await supabaseAdmin.from('agent_waitlist').update({ status: 'joined' }).eq('phone', phone);
  if (isCampaignNote(invite?.note)) {
    // Campaign joiners start with fewer hunts this month; invites earn them more.
    await addCredits(client.id, CAMPAIGN_FIRST_MONTH_RUNS, 'monthly_grant', indiaMonthKey());
  }
  await ensureMonthlyGrant(client);

  if (invite?.owner_client_id) {
    await addCredits(client.id, FREE_LIMITS.referralBonus, 'referral_bonus', `joined_with:${invite.code}`);
    await addCredits(invite.owner_client_id, FREE_LIMITS.referralBonus, 'referral_bonus', `invited:${client.id}`);
    const owner = await supabaseAdmin.from('agent_clients').select('*').eq('id', invite.owner_client_id).maybeSingle();
    if (owner.data) {
      const joined = await friendsJoined(invite.owner_client_id);
      await sendProactiveAgentMessage(
        owner.data as AgentClient,
        friendJoinedMessage(joined),
        { type: 'referral_joined', friend_client_id: client.id, friends_joined: joined },
      ).catch(() => undefined);
    }
  }
  return client;
}

// ── Waitlist ──

/** Adds the number to the waitlist; says whether to reply (at most once a day, so bots can't loop us). */
export async function joinWaitlist(rawPhone: string, firstMessage: string) {
  const phone = normalizeIndianWhatsappNumber(rawPhone);
  if (!phone) return { shouldReply: false, admittedCode: null as string | null };
  const now = new Date();
  const { data: existing } = await supabaseAdmin.from('agent_waitlist').select('*').eq('phone', phone).maybeSingle();
  if (existing?.status === 'admitted' && existing.admitted_code) {
    return { shouldReply: false, admittedCode: existing.admitted_code as string };
  }
  const lastReplied = existing?.last_replied_at ? new Date(existing.last_replied_at).getTime() : 0;
  const shouldReply = now.getTime() - lastReplied > 24 * 60 * 60 * 1000;
  await supabaseAdmin.from('agent_waitlist').upsert({
    phone,
    first_message: existing?.first_message ?? firstMessage.slice(0, 500),
    status: existing?.status ?? 'waiting',
    created_at: existing?.created_at ?? now.toISOString(),
    last_message_at: now.toISOString(),
    last_replied_at: shouldReply ? now.toISOString() : existing?.last_replied_at ?? null,
  });
  return { shouldReply, admittedCode: null };
}

/**
 * Lets the next people in. Each gets a single-use code; they are enrolled the
 * next time they message. Those still inside the 24h window are told now.
 */
export async function admitFromWaitlist(count: number, notify: (phone: string, text: string) => Promise<boolean>) {
  const { data: waiting } = await supabaseAdmin
    .from('agent_waitlist')
    .select('phone, last_message_at')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(Math.min(Math.max(1, count), 500));
  let notified = 0;
  for (const row of waiting ?? []) {
    const code = await insertInvite(null, 1, 'waitlist');
    await supabaseAdmin.from('agent_waitlist').update({ status: 'admitted', admitted_code: code }).eq('phone', row.phone);
    const inWindow = Date.now() - new Date(row.last_message_at).getTime() < 23.5 * 60 * 60 * 1000;
    if (inWindow && await notify(row.phone, "You're in! 🎉 Send me a selfie in daylight (no filter) and I'll read your best colours to start.")) {
      notified += 1;
    }
  }
  return { admitted: waiting?.length ?? 0, notified };
}
