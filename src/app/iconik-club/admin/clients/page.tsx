'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, ChevronLeft, ChevronRight, Plus, Send, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react';
import type { ClientProfile } from '@/lib/supabase';

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
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = 20;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);

    const res  = await fetch(`/api/iconik-club/admin/clients?${params}`);
    const data = await res.json();
    setClients(data.clients ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, page]);

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Manage</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Clients</h2>
        </div>
        <Link
          href="/iconik-club/admin/clients/new"
          className="flex items-center gap-2 bg-[#ff6b9d] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#ff4d8d] transition-colors shadow-sm shadow-[#ff6b9d]/20"
        >
          <Plus size={13} />
          Add Client
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a2c3e]/30" />
          <input
            type="text"
            defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
          />
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-[#4a2c3e]/40 mb-3 font-medium">{total} client{total !== 1 ? 's' : ''}</p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-[#ff6b9d]" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#4a2c3e]/40 text-sm">No clients found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ffb3d1]/50 bg-[#fff9f5]">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Client</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden lg:table-cell">Measurements</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffb3d1]/30">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-[#fff9f5] transition-colors group">
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
                        <p className="font-semibold text-[#4a2c3e]">{client.name}</p>
                        <p className="text-xs text-[#4a2c3e]/40 font-medium">{client.email}</p>
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
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      client.onboarding_complete
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {client.onboarding_complete ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {client.onboarding_complete && (
                        <button
                          onClick={e => regenerateOutfits(client, e)}
                          disabled={regeneratingId === client.id}
                          title="Regenerate outfits (use if generation failed or to refresh)"
                          className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-[#f0f4ff] text-[#4a6cf7] border border-[#4a6cf7]/20 hover:bg-[#e0e8ff] disabled:opacity-50 transition-colors"
                        >
                          {regeneratingId === client.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <><RefreshCw size={11} /> Regenerate</>
                          )}
                        </button>
                      )}
                      {client.onboarding_complete && client.phone && client.preview_token && (
                        <button
                          onClick={e => openWhatsApp(client, e)}
                          title="Open WhatsApp with pre-filled message"
                          className="flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-[#e7f9ef] text-[#25D366] border border-[#25D366]/20 hover:bg-[#d0f5e2] transition-colors"
                        >
                          <MessageCircle size={11} />
                          WhatsApp
                        </button>
                      )}
                      {client.onboarding_complete && (
                        <button
                          onClick={e => sendPreview(client.id!, e)}
                          disabled={sendingId === client.id}
                          title={sentIds.has(client.id!) ? 'Email sent — link also copied' : 'Send preview email + copy link'}
                          className={`flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            sentIds.has(client.id!)
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-[#fff0f5] text-[#ff6b9d] border border-[#ffb3d1] hover:bg-[#ffe0ec]'
                          }`}
                        >
                          {sendingId === client.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : sentIds.has(client.id!) ? (
                            <><ExternalLink size={11} /> Sent</>
                          ) : (
                            <><Send size={11} /> Email</>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
        <Loader2 size={22} className="animate-spin text-[#ff6b9d]" />
      </div>
    }>
      <AdminClientsContent />
    </Suspense>
  );
}
