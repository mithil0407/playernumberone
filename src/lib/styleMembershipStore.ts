import 'server-only';

// Where the Style Membership funnel keeps leads, memberships, funnel events and
// queued WhatsApp messages. Two backends:
// - supabase: the tables in supabase/migrations/add_style_membership.sql
//   (production, after the owner runs that migration);
// - file: a JSON file under .style-membership-dev/ (local development), so
//   trying the funnel locally never writes to the production database.
// STYLE_MEMBERSHIP_STORE picks one; outside production the default is "file".

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import type { QuizAnswers } from './styleMembershipLogic';
import type { MembershipBumpId, MembershipPlanId } from './styleMembershipConfig';

export interface AttributionColumns {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  first_touch_at: string | null;
  attribution_payload: Record<string, unknown> | null;
}

export interface MembershipLead extends AttributionColumns {
  id: string;
  created_at: string;
  updated_at: string;
  token_hash: string;
  session_id: string | null;
  phone: string;
  email: string | null;
  first_name: string | null;
  whatsapp_consent_at: string;
  consent_version: string;
  answers: QuizAnswers;
  selfie_path: string | null;
  selfie_delete_after: string | null;
  selfie_season: string | null;
  selfie_reading: Record<string, unknown> | null;
  look_path: string | null;
  look_status: 'none' | 'generating' | 'ready' | 'failed';
  source: 'quiz' | 'sales_page';
}

export type MembershipStatus = 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'refunded' | 'failed';
export type AutopayStatus = 'not_offered' | 'not_set_up' | 'pending' | 'active' | 'failed' | 'cancelled';

export interface Membership extends AttributionColumns {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  phone: string;
  email: string | null;
  first_name: string | null;
  plan: MembershipPlanId;
  bumps: MembershipBumpId[];
  amount_paise: number;
  renewal_paise: number | null;
  currency: 'INR';
  status: MembershipStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  current_period_end: string | null;
  autopay_status: AutopayStatus;
  razorpay_subscription_id: string | null;
  member_code_hash: string | null;
  agent_client_id: string | null;
  claimed_at: string | null;
  source: 'quiz' | 'sales_page';
}

export interface FunnelEvent {
  session_id: string;
  lead_id?: string | null;
  event: string;
  screen?: string | null;
  step?: number | null;
  props?: Record<string, unknown>;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
}

export type QueuedMessageKind = 'lead_dna_card' | 'schedule' | 'renewal_pay_link';

export interface QueuedMessage {
  id: string;
  created_at: string;
  membership_id: string | null;
  lead_id: string | null;
  kind: QueuedMessageKind;
  step_id: string | null;
  due_at: string;
  status: 'queued' | 'sent' | 'skipped' | 'failed';
  title: string;
  brief: string;
  needs_template: boolean;
  pay_link_url: string | null;
  razorpay_payment_link_id: string | null;
  payload: Record<string, unknown>;
}

type NewRow<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

interface StoreShape {
  leads: MembershipLead[];
  memberships: Membership[];
  events: Array<FunnelEvent & { id: string; created_at: string }>;
  messages: QueuedMessage[];
}

export function membershipStoreMode(): 'file' | 'supabase' {
  const configured = process.env.STYLE_MEMBERSHIP_STORE?.trim();
  if (configured === 'file' || configured === 'supabase') return configured;
  return process.env.NODE_ENV === 'production' ? 'supabase' : 'file';
}

const DEV_DIR = path.join(process.cwd(), '.style-membership-dev');
const DEV_FILE = path.join(DEV_DIR, 'store.json');
/** Selfies and generated looks; production keeps them in this private bucket. */
export const MEMBERSHIP_BUCKET = 'style-scan-private';
const OBJECT_PREFIX = 'membership/';

let writeQueue: Promise<unknown> = Promise.resolve();

async function readDevStore(): Promise<StoreShape> {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, 'utf8')) as StoreShape;
  } catch {
    return { leads: [], memberships: [], events: [], messages: [] };
  }
}

/** Serialised read-modify-write, so parallel requests don't drop each other's rows. */
function mutateDevStore<T>(change: (store: StoreShape) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    const store = await readDevStore();
    const result = change(store);
    await fs.mkdir(DEV_DIR, { recursive: true });
    await fs.writeFile(DEV_FILE, JSON.stringify(store, null, 2));
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

function now() {
  return new Date().toISOString();
}

function fail(action: string, error: { message: string } | null) {
  if (error) throw new Error(`Style Membership: could not ${action}: ${error.message}`);
}

// ── Leads ────────────────────────────────────────────────────────────────────

export async function insertLead(row: NewRow<MembershipLead>): Promise<MembershipLead> {
  if (membershipStoreMode() === 'file') {
    const lead: MembershipLead = { ...row, id: randomUUID(), created_at: now(), updated_at: now() };
    await mutateDevStore(store => { store.leads.push(lead); });
    return lead;
  }
  const { data, error } = await supabaseAdmin.from('style_membership_leads').insert(row).select('*').single();
  fail('save the lead', error);
  return data as MembershipLead;
}

export async function getLeadByTokenHash(tokenHash: string): Promise<MembershipLead | null> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).leads.find(lead => lead.token_hash === tokenHash) ?? null;
  }
  const { data, error } = await supabaseAdmin.from('style_membership_leads').select('*').eq('token_hash', tokenHash).maybeSingle();
  fail('load the lead', error);
  return (data as MembershipLead | null) ?? null;
}

export async function getLead(id: string): Promise<MembershipLead | null> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).leads.find(lead => lead.id === id) ?? null;
  }
  const { data, error } = await supabaseAdmin.from('style_membership_leads').select('*').eq('id', id).maybeSingle();
  fail('load the lead', error);
  return (data as MembershipLead | null) ?? null;
}

export async function updateLead(id: string, patch: Partial<MembershipLead>): Promise<MembershipLead | null> {
  const values = { ...patch, updated_at: now() };
  if (membershipStoreMode() === 'file') {
    return mutateDevStore(store => {
      const lead = store.leads.find(item => item.id === id);
      if (!lead) return null;
      Object.assign(lead, values);
      return lead;
    });
  }
  const { data, error } = await supabaseAdmin.from('style_membership_leads').update(values).eq('id', id).select('*').maybeSingle();
  fail('update the lead', error);
  return (data as MembershipLead | null) ?? null;
}

/** Atomically moves the personalised look from "none"/"failed" to "generating"; false if already taken. */
export async function claimLookGeneration(id: string): Promise<boolean> {
  if (membershipStoreMode() === 'file') {
    return mutateDevStore(store => {
      const lead = store.leads.find(item => item.id === id);
      if (!lead || (lead.look_status !== 'none' && lead.look_status !== 'failed')) return false;
      lead.look_status = 'generating';
      lead.updated_at = now();
      return true;
    });
  }
  const { data, error } = await supabaseAdmin
    .from('style_membership_leads')
    .update({ look_status: 'generating', updated_at: now() })
    .eq('id', id)
    .in('look_status', ['none', 'failed'])
    .select('id');
  fail('start the look', error);
  return Boolean(data?.length);
}

/** Personalised looks generated today across everyone: the spend safety net. */
export async function looksGeneratedSince(since: string): Promise<number> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).leads.filter(lead => lead.look_status !== 'none' && lead.updated_at >= since).length;
  }
  const { count, error } = await supabaseAdmin
    .from('style_membership_leads')
    .select('id', { count: 'exact', head: true })
    .neq('look_status', 'none')
    .gte('updated_at', since);
  fail('count looks', error);
  return count ?? 0;
}

// ── Memberships ──────────────────────────────────────────────────────────────

export async function insertMembership(row: NewRow<Membership>): Promise<Membership> {
  if (membershipStoreMode() === 'file') {
    const membership: Membership = { ...row, id: randomUUID(), created_at: now(), updated_at: now() };
    await mutateDevStore(store => { store.memberships.push(membership); });
    return membership;
  }
  const { data, error } = await supabaseAdmin.from('style_memberships').insert(row).select('*').single();
  fail('save the membership', error);
  return data as Membership;
}

type MembershipKey = 'id' | 'razorpay_order_id' | 'razorpay_subscription_id' | 'member_code_hash';

export async function findMembership(key: MembershipKey, value: string): Promise<Membership | null> {
  if (!value) return null;
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).memberships.find(item => item[key] === value) ?? null;
  }
  const { data, error } = await supabaseAdmin.from('style_memberships').select('*').eq(key, value).maybeSingle();
  fail('load the membership', error);
  return (data as Membership | null) ?? null;
}

/** Her paid membership that no WhatsApp chat has claimed yet (or already claimed by this chat). */
export async function findActiveMembershipByPhone(phone: string): Promise<Membership | null> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).memberships
      .filter(item => item.phone === phone && item.status === 'active')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }
  const { data, error } = await supabaseAdmin
    .from('style_memberships')
    .select('*')
    .eq('phone', phone)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  fail('look up the membership', error);
  return ((data ?? [])[0] as Membership | undefined) ?? null;
}

export async function updateMembership(id: string, patch: Partial<Membership>): Promise<Membership | null> {
  const values = { ...patch, updated_at: now() };
  if (membershipStoreMode() === 'file') {
    return mutateDevStore(store => {
      const membership = store.memberships.find(item => item.id === id);
      if (!membership) return null;
      Object.assign(membership, values);
      return membership;
    });
  }
  const { data, error } = await supabaseAdmin.from('style_memberships').update(values).eq('id', id).select('*').maybeSingle();
  fail('update the membership', error);
  return (data as Membership | null) ?? null;
}

/**
 * Marks a pending membership paid exactly once (the browser confirm and the
 * webhook can both arrive); returns the row only to the caller that flipped it.
 */
export async function activateMembershipOnce(id: string, patch: Partial<Membership>): Promise<Membership | null> {
  const values = { ...patch, status: 'active' as const, updated_at: now() };
  if (membershipStoreMode() === 'file') {
    return mutateDevStore(store => {
      const membership = store.memberships.find(item => item.id === id);
      if (!membership || membership.status !== 'pending') return null;
      Object.assign(membership, values);
      return membership;
    });
  }
  const { data, error } = await supabaseAdmin
    .from('style_memberships')
    .update(values)
    .eq('id', id)
    .eq('status', 'pending')
    .select('*');
  fail('activate the membership', error);
  return ((data ?? [])[0] as Membership | undefined) ?? null;
}

// ── Funnel events ────────────────────────────────────────────────────────────

export async function insertFunnelEvent(event: FunnelEvent) {
  if (membershipStoreMode() === 'file') {
    await mutateDevStore(store => {
      store.events.push({ ...event, id: randomUUID(), created_at: now() });
      if (store.events.length > 5000) store.events.splice(0, store.events.length - 5000);
    });
    return;
  }
  const { error } = await supabaseAdmin.from('style_membership_events').insert(event);
  if (error) console.warn('[style-membership] event not recorded:', error.message);
}

// ── Queued WhatsApp messages (never sent from here) ─────────────────────────

export async function queueMessages(rows: Array<Omit<QueuedMessage, 'id' | 'created_at'>>) {
  if (!rows.length) return;
  if (membershipStoreMode() === 'file') {
    await mutateDevStore(store => {
      for (const row of rows) store.messages.push({ ...row, id: randomUUID(), created_at: now() });
    });
    return;
  }
  const { error } = await supabaseAdmin.from('style_membership_messages').insert(rows);
  fail('queue messages', error);
}

export async function listQueuedMessages(membershipId: string): Promise<QueuedMessage[]> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).messages.filter(message => message.membership_id === membershipId)
      .sort((a, b) => a.due_at.localeCompare(b.due_at));
  }
  const { data, error } = await supabaseAdmin
    .from('style_membership_messages')
    .select('*')
    .eq('membership_id', membershipId)
    .order('due_at', { ascending: true });
  fail('load queued messages', error);
  return (data ?? []) as QueuedMessage[];
}

// ── Private files (selfies, generated looks) ────────────────────────────────

export async function putObject(objectPath: string, bytes: Buffer, contentType: string) {
  const key = `${OBJECT_PREFIX}${objectPath}`;
  if (membershipStoreMode() === 'file') {
    const target = path.join(DEV_DIR, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
    return key;
  }
  const { error } = await supabaseAdmin.storage.from(MEMBERSHIP_BUCKET).upload(key, bytes, { contentType, upsert: true });
  fail('store the file', error);
  return key;
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (!key.startsWith(OBJECT_PREFIX)) return null;
  if (membershipStoreMode() === 'file') {
    try {
      return await fs.readFile(path.join(DEV_DIR, key));
    } catch {
      return null;
    }
  }
  const { data, error } = await supabaseAdmin.storage.from(MEMBERSHIP_BUCKET).download(key);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteObject(key: string) {
  if (!key.startsWith(OBJECT_PREFIX)) return;
  if (membershipStoreMode() === 'file') {
    await fs.rm(path.join(DEV_DIR, key), { force: true });
    return;
  }
  await supabaseAdmin.storage.from(MEMBERSHIP_BUCKET).remove([key]);
}

// ── Founding price eligibility ───────────────────────────────────────────────

/**
 * Past Blueprint buyers get the founding quarter. Production checks a completed
 * order on the same email or phone; local development reads an allowlist so it
 * never queries production orders.
 */
export async function isPastBuyer(phone: string, email: string | null): Promise<boolean> {
  if (membershipStoreMode() === 'file') {
    const allow = (process.env.STYLE_MEMBERSHIP_DEV_PAST_BUYERS ?? '').split(',').map(value => value.trim()).filter(Boolean);
    return allow.includes(phone) || Boolean(email && allow.includes(email.toLowerCase()));
  }
  const last10 = phone.replace(/\D+/g, '').slice(-10);
  if (last10.length !== 10) return false;
  const filters = [`phone.ilike.*${last10}`];
  if (email && !/[",()]/.test(email)) filters.push(`email.eq."${email.toLowerCase()}"`);
  const { data: customers, error } = await supabaseAdmin.from('customers').select('id').or(filters.join(',')).limit(5);
  if (error || !customers?.length) return false;
  const { count } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('customer_id', customers.map(customer => customer.id))
    .eq('status', 'completed');
  return Boolean(count);
}

// ── Renewals cron ────────────────────────────────────────────────────────────

/** Active renewing memberships ending before `before` that have no working autopay. */
export async function listMembershipsNeedingPayLink(before: string): Promise<Membership[]> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).memberships.filter(item =>
      (item.status === 'active' || item.status === 'past_due')
      && item.renewal_paise !== null
      && item.autopay_status !== 'active'
      && Boolean(item.current_period_end && item.current_period_end <= before));
  }
  const { data, error } = await supabaseAdmin
    .from('style_memberships')
    .select('*')
    .in('status', ['active', 'past_due'])
    .not('renewal_paise', 'is', null)
    .neq('autopay_status', 'active')
    .lte('current_period_end', before)
    .limit(200);
  fail('list renewals', error);
  return (data ?? []) as Membership[];
}

/** Whether a renewal link was already prepared for her since `since` (so a re-run doesn't make another). */
export async function hasPayLinkSince(membershipId: string, since: string): Promise<boolean> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).messages.some(message =>
      message.membership_id === membershipId && message.kind === 'renewal_pay_link' && message.created_at >= since);
  }
  const { count, error } = await supabaseAdmin
    .from('style_membership_messages')
    .select('id', { count: 'exact', head: true })
    .eq('membership_id', membershipId)
    .eq('kind', 'renewal_pay_link')
    .gte('created_at', since);
  fail('check pay links', error);
  return Boolean(count);
}

export async function listLeadsWithExpiredSelfies(nowIso: string): Promise<MembershipLead[]> {
  if (membershipStoreMode() === 'file') {
    return (await readDevStore()).leads.filter(lead => lead.selfie_path && lead.selfie_delete_after && lead.selfie_delete_after <= nowIso);
  }
  const { data, error } = await supabaseAdmin
    .from('style_membership_leads')
    .select('*')
    .not('selfie_path', 'is', null)
    .lte('selfie_delete_after', nowIso)
    .limit(200);
  fail('list expired selfies', error);
  return (data ?? []) as MembershipLead[];
}
