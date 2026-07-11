'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, ChevronLeft, ChevronRight, Plus, Send, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react';
import type { ClientProfile } from '@/lib/supabase';
import { ActionMenu, AdminCard, AdminPageHeader, CLUB, controlClass, EmptyState, FilterBar, LoadingState, primaryButtonClass, quietButtonClass, StatusBadge } from '@/components/IconikClubAdminUI';

type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';

type ClientWithSubscription = ClientProfile & {
  subscriptions?: {
    created_at?: string;
    start_date?: string;
    plan_type?: string;
    status?: SubscriptionStatus;
    cancelled_at?: string;
  } | null;
};

function formatMemberSince(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AdminClientsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [clients, setClients]   = useState<ClientWithSubscription[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [sendingId, setSendingId]       = useState<string | null>(null);
  const [sentIds, setSentIds]           = useState<Set<string>>(new Set());
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const onboarding = searchParams.get('onboarding') ?? 'all';
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = 20;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (onboarding !== 'all') params.set('onboarding_complete', onboarding === 'active' ? 'true' : 'false');

    const res  = await fetch(`/api/iconik-club/admin/clients?${params}`);
    const data = await res.json();
    setClients(data.clients ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, onboarding, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/iconik-club/admin/clients?${p}`);
  };

  const totalPages = Math.ceil(total / limit);

  const openWhatsApp = (client: ClientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.preview_token || !client.phone) return;
    const baseUrl    = window.location.origin;
    const previewUrl = `${baseUrl}/iconik-club/preview/${client.preview_token}`;
    const firstName  = client.name.split(' ')[0];
    const rawPhone   = client.phone.replace(/\D/g, '');
    const waPhone    = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
    const message    = `Hi ${firstName}! Your personal style edit from Iconik Club is ready 🎉\n\nView your 6 curated outfits here:\n${previewUrl}\n\nEvery piece has a direct shopping link. This preview is valid for 30 days.`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const regenerateOutfits = async (client: ClientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasExisting = await fetch(`/api/iconik-club/admin/outfits?client_id=${client.id}`).then(r => r.json()).then(d => (d.total ?? 0) > 0).catch(() => false);
    if (hasExisting && !confirm(`${client.name} already has outfits. Delete them and regenerate fresh?`)) return;
    setRegeneratingId(client.id!);
    try {
      const url = hasExisting
        ? `/api/iconik-club/admin/clients/${client.id}/generate?force=true`
        : `/api/iconik-club/admin/clients/${client.id}/generate`;
      const res  = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(`Generation failed: ${data.error ?? 'Unknown error'}`);
      } else {
        alert(`Done — ${data.message}`);
        fetchClients();
      }
    } finally {
      setRegeneratingId(null);
    }
  };

  const sendPreview = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingId(clientId);
    try {
      const res  = await fetch(`/api/iconik-club/admin/clients/${clientId}/send-preview`, { method: 'POST' });
      const data = await res.json();
      if (data.preview_url) {
        setSentIds(prev => new Set(prev).add(clientId));
        // Copy link to clipboard as a fallback
        navigator.clipboard.writeText(data.preview_url).catch(() => {});
      }
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader eyebrow="Relationships" title="Members" description="Manage member profiles, onboarding and outfit delivery." actions={<Link href="/iconik-club/admin/clients/new" className={primaryButtonClass}><Plus size={14} /> Add member</Link>} />

      {/* Search */}
      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: CLUB.faint }} />
          <input
            type="text"
            defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value); }}
            placeholder="Search members…"
            aria-label="Search members"
            className={`${controlClass} pl-10`}
          />
        </div>
        <select aria-label="Onboarding status" value={onboarding} onChange={e => setParam('onboarding', e.target.value)} className={`${controlClass} sm:w-auto`}>
          <option value="all">All members</option>
          <option value="active">Onboarded</option>
          <option value="pending">Pending onboarding</option>
        </select>
      </FilterBar>

      {/* Count */}
      {!loading && (
        <p className="mb-3 text-xs" style={{ color: CLUB.muted }}>{total} member{total !== 1 ? 's' : ''}</p>
      )}

      {/* Table */}
      <AdminCard className="overflow-visible">
        {loading ? (
          <LoadingState label="Loading members…" />
        ) : clients.length === 0 ? (
          <EmptyState title="No members found" description="Try changing the search or onboarding filter." />
        ) : (
          <>
          <div className="divide-y md:hidden" style={{ borderColor: CLUB.border }}>
            {clients.map(client => <div key={client.id} className="p-4" onClick={() => router.push(`/iconik-club/admin/clients/${client.id}`)}><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: CLUB.card, color: CLUB.gold }}>{client.headshot_url ? <img src={client.headshot_url} alt="" className="h-full w-full object-cover" /> : client.name?.charAt(0)?.toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" style={{ color: CLUB.ink }}>{client.name}</p><p className="truncate text-xs" style={{ color: CLUB.muted }}>{client.email}</p><div className="mt-2"><StatusBadge tone={client.onboarding_complete ? 'success' : 'warning'}>{client.onboarding_complete ? 'Onboarded' : 'Pending'}</StatusBadge></div></div>{client.onboarding_complete && <ActionMenu label="Actions"><button className={`${quietButtonClass} w-full justify-start`} onClick={e => sendPreview(client.id!, e)}><Send size={14} /> {sentIds.has(client.id!) ? 'Preview sent' : 'Email preview'}</button>{client.phone && client.preview_token && <button className={`${quietButtonClass} w-full justify-start`} onClick={e => openWhatsApp(client, e)}><MessageCircle size={14} /> WhatsApp</button>}<button className={`${quietButtonClass} w-full justify-start`} onClick={e => regenerateOutfits(client, e)}><RefreshCw size={14} /> Regenerate outfits</button></ActionMenu>}</div></div>)}
          </div>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr style={{ background: CLUB.card, borderBottom: `1px solid ${CLUB.border}` }}>
                <th className="text-left px-5 py-3.5 iconik-micro" style={{ color: CLUB.muted }}>Member</th>
                <th className="text-left px-5 py-3.5 iconik-micro" style={{ color: CLUB.muted }}>Phone</th>
                <th className="hidden text-left px-5 py-3.5 iconik-micro lg:table-cell" style={{ color: CLUB.muted }}>Measurements</th>
                <th className="text-left px-5 py-3.5 iconik-micro" style={{ color: CLUB.muted }}>Status</th>
                <th className="text-right px-5 py-3.5 iconik-micro" style={{ color: CLUB.muted }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: CLUB.border }}>
              {clients.map(client => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/iconik-club/admin/clients/${client.id}`)}
                  className="cursor-pointer transition-colors hover:bg-black/[0.025]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {client.headshot_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.headshot_url}
                          alt={client.name}
                          className="w-11 h-11 object-cover rounded-full border border-[#ffb3d1]/60 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-[#fff0f5] rounded-full border border-[#ffb3d1]/60 flex-shrink-0 flex items-center justify-center text-[#ff6b9d] font-bold text-sm">
                          {client.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium" style={{ color: CLUB.ink }}>{client.name}</p>
                        <p className="text-xs" style={{ color: CLUB.muted }}>{client.email}</p>
                        {client.subscriptions && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {(client.subscriptions.created_at || client.subscriptions.start_date) && (
                              <p className="text-[10px] text-[#ff6b9d]/70">
                                Member since {formatMemberSince(client.subscriptions.created_at ?? client.subscriptions.start_date)}
                              </p>
                            )}
                            {client.subscriptions.status && client.subscriptions.status !== 'active' && (
                              <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                                client.subscriptions.status === 'cancelled'
                                  ? 'bg-red-50 text-red-500 border border-red-100'
                                  : client.subscriptions.status === 'paused'
                                  ? 'bg-amber-50 text-amber-500 border border-amber-100'
                                  : client.subscriptions.status === 'expired'
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                              }`}>
                                {client.subscriptions.status}
                                {client.subscriptions.status === 'cancelled' && client.subscriptions.cancelled_at
                                  ? ` · ${formatMemberSince(client.subscriptions.cancelled_at)}`
                                  : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm hidden md:table-cell">
                    {client.phone ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm hidden lg:table-cell">
                    {client.height_cm || client.bust_cm || client.waist_cm || client.hips_cm ? (
                      <span className="text-xs">
                        {client.height_cm ? `${client.height_cm}cm` : ''}
                        {client.bust_cm ? ` · B${client.bust_cm}` : ''}
                        {client.waist_cm ? ` · W${client.waist_cm}` : ''}
                        {client.hips_cm ? ` · H${client.hips_cm}` : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={client.onboarding_complete ? 'success' : 'warning'}>{client.onboarding_complete ? 'Onboarded' : 'Pending'}</StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {client.onboarding_complete ? <ActionMenu label="Actions"><button className={`${quietButtonClass} w-full justify-start`} disabled={sendingId === client.id} onClick={e => sendPreview(client.id!, e)}>{sendingId === client.id ? <Loader2 size={14} className="animate-spin" /> : sentIds.has(client.id!) ? <ExternalLink size={14} /> : <Send size={14} />} {sentIds.has(client.id!) ? 'Preview sent' : 'Email preview'}</button>{client.phone && client.preview_token && <button className={`${quietButtonClass} w-full justify-start`} onClick={e => openWhatsApp(client, e)}><MessageCircle size={14} /> WhatsApp</button>}<button className={`${quietButtonClass} w-full justify-start`} disabled={regeneratingId === client.id} onClick={e => regenerateOutfits(client, e)}><RefreshCw size={14} /> Regenerate outfits</button></ActionMenu> : <span style={{ color: CLUB.faint }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set('page', String(Math.max(1, page - 1)));
              router.push(`/iconik-club/admin/clients?${p}`);
            }}
            disabled={page === 1}
            className="p-2 rounded-xl border border-[#ffb3d1] text-[#4a2c3e]/50 hover:bg-[#fff0f5] disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={15} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-1 text-[#4a2c3e]/30 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', String(p));
                    router.push(`/iconik-club/admin/clients?${params}`);
                  }}
                  className={`w-9 h-9 text-sm rounded-xl font-medium transition-all ${
                    p === page
                      ? 'bg-[#ff6b9d] text-white shadow-sm shadow-[#ff6b9d]/30'
                      : 'border border-[#ffb3d1] text-[#4a2c3e]/60 hover:bg-[#fff0f5] hover:text-[#4a2c3e]'
                  }`}
                >
                  {p}
                </button>
              )
            )
          }

          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set('page', String(Math.min(totalPages, page + 1)));
              router.push(`/iconik-club/admin/clients?${p}`);
            }}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-[#ffb3d1] text-[#4a2c3e]/50 hover:bg-[#fff0f5] disabled:opacity-30 transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin" style={{ color: CLUB.gold }} />
      </div>
    }>
      <AdminClientsContent />
    </Suspense>
  );
}
