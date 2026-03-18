'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

type OutfitStatus = 'pending' | 'generating' | 'ready' | 'failed';

interface OutfitRow {
  id: string;
  client_id: string;
  client_name?: string;
  outfit_card_url?: string;
  ai_style_note?: string;
  occasion?: string;
  season?: string;
  status?: OutfitStatus;
  created_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ready:      'bg-emerald-50 text-emerald-600 border border-emerald-100',
  pending:    'bg-amber-50 text-amber-600 border border-amber-100',
  generating: 'bg-blue-50 text-blue-600 border border-blue-100',
  failed:     'bg-red-50 text-red-500 border border-red-100',
};

function AdminOutfitsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') ?? 'all';
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = 20;

  const fetchOutfits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status !== 'all') params.set('status', status);

    const res  = await fetch(`/api/iconik-club/admin/outfits?${params}`);
    const data = await res.json();
    setOutfits(data.outfits ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/iconik-club/admin/outfits?${p}`);
  };

  const totalPages = Math.ceil(total / limit);
  const selectCls = "px-3 py-2 text-sm border border-[#ffb3d1] rounded-xl bg-white text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Styling</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Outfits</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        <select value={status} onChange={e => setParam('status', e.target.value)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="pending">Pending</option>
          <option value="generating">Generating</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-[#4a2c3e]/40 mb-3 font-medium">{total} outfit{total !== 1 ? 's' : ''}</p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-[#ff6b9d]" />
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#4a2c3e]/40 text-sm">No outfits found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ffb3d1]/50 bg-[#fff9f5]">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Outfit</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden md:table-cell">Client</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden lg:table-cell">Occasion</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden lg:table-cell">Season</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffb3d1]/30">
              {outfits.map(outfit => (
                <tr key={outfit.id} className="hover:bg-[#fff9f5] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {outfit.outfit_card_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={outfit.outfit_card_url}
                          alt="Outfit"
                          className="w-11 h-11 object-cover rounded-xl border border-[#ffb3d1]/60 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-[#fff0f5] rounded-xl border border-[#ffb3d1]/60 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[#4a2c3e] text-xs truncate max-w-[200px]">
                          {outfit.ai_style_note || `Outfit #${outfit.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm hidden md:table-cell">
                    {outfit.client_name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm capitalize hidden lg:table-cell">
                    {outfit.occasion ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm capitalize hidden lg:table-cell">
                    {outfit.season ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[outfit.status ?? ''] ?? ''}`}>
                      {outfit.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/40 text-xs hidden md:table-cell">
                    {outfit.created_at
                      ? new Date(outfit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
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
              router.push(`/iconik-club/admin/outfits?${p}`);
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
                    router.push(`/iconik-club/admin/outfits?${params}`);
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
              router.push(`/iconik-club/admin/outfits?${p}`);
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

export default function AdminOutfitsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-[#ff6b9d]" /></div>}>
      <AdminOutfitsContent />
    </Suspense>
  );
}
