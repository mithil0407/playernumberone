import 'server-only';

// The client-facing shape of a Look page: everything the page shows, nothing it
// shouldn't (no client ids, no raw retailer URLs — those go through /go).

import { inviteLink } from '@/lib/agentGrowth';
import { loadLookLink } from '@/lib/agentStore';
import { supabaseAdmin } from '@/lib/supabase';

export type LookVerificationStatus = 'pending' | 'checking' | 'verified' | 'unavailable' | 'failed';

export interface LookItemView {
  id: string;
  slot: string;
  title: string;
  retailer: string | null;
  imageUrl: string | null;
  priceInr: number | null;
  colour: string | null;
  reason: string | null;
  status: LookVerificationStatus;
  sizeChecked: string | null;
  availableSizes: string[];
  offer: string | null;
  note: string | null;
  /** Friends' votes from the shared link. */
  votes: number;
}

export interface LookView {
  id: string;
  slug: string;
  title: string;
  occasion: string | null;
  intro: string | null;
  heroImageUrl: string | null;
  firstName: string | null;
  line: 'man' | 'woman';
  createdAt: string;
  items: LookItemView[];
  /** The owner's invite link, shown to friends who open a shared Look. */
  inviteUrl: string | null;
}

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function loadLookView(slug: string): Promise<(LookView & { clientId: string }) | null> {
  const link = await loadLookLink(slug);
  if (!link || link.status !== 'active') return null;
  const client = asRecord(one(link.agent_clients as unknown));
  const votes = new Map<string, number>();
  for (const event of (link.look_link_events ?? []) as AnyRecord[]) {
    if (event.type === 'vote' && typeof event.item_id === 'string') votes.set(event.item_id, (votes.get(event.item_id) ?? 0) + 1);
  }
  const { data: invite } = await supabaseAdmin
    .from('agent_invites')
    .select('code, max_uses, uses')
    .eq('owner_client_id', link.client_id)
    .eq('disabled', false)
    .limit(1)
    .maybeSingle();
  const inviteUrl = invite && invite.uses < invite.max_uses ? inviteLink(invite.code) : null;
  const items = ((link.look_link_items ?? []) as AnyRecord[])
    .sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0))
    .map(item => {
      const check = asRecord(item.verification);
      return {
        id: String(item.id),
        slot: String(item.slot ?? 'other'),
        title: String(item.title ?? 'Product'),
        retailer: (item.retailer as string | null) ?? null,
        imageUrl: (item.image_url as string | null) ?? null,
        priceInr: item.price_inr === null || item.price_inr === undefined ? null : Number(item.price_inr),
        colour: (item.colour as string | null) ?? null,
        reason: (item.reason as string | null) ?? null,
        status: String(item.verification_status ?? 'pending') as LookVerificationStatus,
        sizeChecked: typeof check.size_checked === 'string' ? check.size_checked : null,
        availableSizes: Array.isArray(check.available_sizes) ? check.available_sizes.map(String).slice(0, 12) : [],
        offer: typeof check.offer === 'string' ? check.offer : null,
        note: typeof check.notes === 'string' && check.notes ? check.notes : null,
        votes: votes.get(String(item.id)) ?? 0,
      };
    });
  return {
    id: String(link.id),
    clientId: String(link.client_id),
    slug: String(link.slug),
    title: String(link.title),
    occasion: (link.occasion as string | null) ?? null,
    intro: (link.intro as string | null) ?? null,
    heroImageUrl: (link.hero_image_url as string | null) ?? items.find(item => item.imageUrl)?.imageUrl ?? null,
    firstName: (client.first_name as string | null) ?? null,
    line: client.line === 'man' ? 'man' : 'woman',
    createdAt: String(link.created_at),
    items,
    inviteUrl,
  };
}

/** The page and its API never expose which client a Look belongs to. */
export function publicLookView(look: LookView & { clientId: string }): LookView {
  return {
    id: look.id,
    slug: look.slug,
    title: look.title,
    occasion: look.occasion,
    intro: look.intro,
    heroImageUrl: look.heroImageUrl,
    firstName: look.firstName,
    line: look.line,
    createdAt: look.createdAt,
    items: look.items,
    inviteUrl: look.inviteUrl,
  };
}
