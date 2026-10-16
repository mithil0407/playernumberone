import 'server-only';

// Links a WhatsApp chat to a Style Membership. The welcome page's "Open
// WhatsApp" button types her ICM- code; the agent calls this before anything
// else, and from then on her lite profile carries the membership, her quiz and
// her 90-day schedule.

import { supabaseAdmin } from '@/lib/supabase';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import type { AgentClient } from '@/lib/agentClients';
import { memberLiteProfile } from './styleMembershipAgentProfile';
import { membershipSchedule } from './styleMembershipSchedule';
import { findActiveMembershipByPhone, findMembership, getLead, updateMembership, type Membership } from './styleMembershipStore';
import { hashToken, parseMemberCode } from './styleMembershipTokens';

async function clientForPhone(phone: string): Promise<AgentClient | null> {
  const { data, error } = await supabaseAdmin.from('agent_clients').select('*').eq('phone', phone).maybeSingle();
  if (error) throw new Error(`Could not look up the client: ${error.message}`);
  return (data as AgentClient | null) ?? null;
}

async function linkMembership(membership: Membership, phone: string): Promise<AgentClient | null> {
  if (membership.status !== 'active' && membership.status !== 'past_due') return null;
  if (membership.agent_client_id) {
    // Already linked: only the same chat may use the code again.
    const { data } = await supabaseAdmin.from('agent_clients').select('*').eq('id', membership.agent_client_id).maybeSingle();
    const linked = data as AgentClient | null;
    return linked?.phone === phone ? linked : null;
  }

  const lead = membership.lead_id ? await getLead(membership.lead_id) : null;
  const schedule = membershipSchedule(new Date(membership.paid_at ?? Date.now()), {
    plan: membership.plan,
    answers: lead?.answers ?? {},
    hasSelfie: Boolean(lead?.selfie_season),
  });
  const patch = memberLiteProfile({
    membershipId: membership.id,
    plan: membership.plan,
    status: membership.status,
    paidAt: membership.paid_at,
    currentPeriodEnd: membership.current_period_end,
    autopayStatus: membership.autopay_status,
    bumps: membership.bumps,
    answers: lead?.answers ?? {},
    selfieSeason: lead?.selfie_season ?? null,
    schedule,
  });

  let client = await clientForPhone(phone);
  if (!client) {
    const { data, error } = await supabaseAdmin.from('agent_clients').insert({
      phone,
      tier: 'free',
      line: 'woman',
      first_name: membership.first_name,
      email: membership.email,
      lite_profile: patch,
    }).select('*').single();
    if (error) {
      client = await clientForPhone(phone);
      if (!client) throw new Error(`Could not enrol the member: ${error.message}`);
    } else {
      client = data as AgentClient;
    }
  }
  {
    const lite = { ...(client.lite_profile ?? {}), ...patch };
    const { data, error } = await supabaseAdmin.from('agent_clients').update({
      lite_profile: lite,
      line: client.line ?? 'woman',
      first_name: client.first_name ?? membership.first_name,
      email: client.email ?? membership.email,
      status: client.status === 'opted_out' ? client.status : 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', client.id).select('*').single();
    if (error) throw new Error(`Could not save the member profile: ${error.message}`);
    client = data as AgentClient;
  }
  await updateMembership(membership.id, { agent_client_id: client.id, claimed_at: new Date().toISOString() });
  return client;
}

/**
 * Called by the agent on an inbound message. With an ICM- code in the text it
 * links that membership; without one it links an unclaimed membership paid
 * with this same WhatsApp number. Returns the agent client, or null.
 */
export async function claimMembershipForAgent(text: string, rawPhone: string, options: { byPhone: boolean }) {
  const phone = normalizeIndianWhatsappNumber(rawPhone);
  if (!phone) return null;
  const code = parseMemberCode(text);
  const membership = code
    ? await findMembership('member_code_hash', hashToken(code))
    : options.byPhone ? await findActiveMembershipByPhone(phone) : null;
  if (!membership || (!code && membership.agent_client_id)) return null;
  return linkMembership(membership, phone);
}

export { parseMemberCode };
