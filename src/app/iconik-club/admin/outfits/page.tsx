'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

type OutfitStatus = 'pending' | 'generating' | 'ready' | 'failed';

interface OutfitBlueprint {
  occasion: string;
  title: string;
  singlePiece: string | null;
  top: string | null;
  layer: string | null;
  bottom: string | null;
  shoes: string;
  bag: string | null;
  accessory: string | null;
  disruptor: string;
  colourHierarchy: string;
  structurePiece: string;
}

interface OutfitRow {
  id: string;
  client_id: string;
  client_name?: string;
  outfit_card_url?: string;
  ai_style_note?: string;
  ai_blueprint?: OutfitBlueprint;
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

function BlueprintPanel({ bp }: { bp: OutfitBlueprint }) {
  const slots = [
    bp.singlePiece && { label: 'One piece', value: bp.singlePiece },
    bp.top         && { label: 'Top',       value: bp.top },
    bp.layer       && { label: 'Layer',     value: bp.layer },
    bp.bottom      && { label: 'Bottom',    value: bp.bottom },
    bp.shoes       && { label: 'Shoes',     value: bp.shoes },
    bp.bag         && { label: 'Bag',       value: bp.bag },
    bp.accessory   && { label: 'Accessory', value: bp.accessory },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="px-3 pb-3 border-t border-[#ffb3d1]/30 pt-2.5 space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#ff6b9d]/50 mb-1.5">Gemini Blueprint</p>

      {/* Slots */}
      <div className="space-y-1">
        {slots.map(s => (
          <div key={s.label} className="flex gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 w-14 flex-shrink-0 pt-px">{s.label}</span>
            <span className="text-[10px] text-[#4a2c3e]/75 leading-snug">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Colour hierarchy */}
      <div className="pt-1 border-t border-[#ffb3d1]/20">
        <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-0.5">Colour hierarchy</p>
        <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">{bp.colourHierarchy}</p>
      </div>

      {/* Disruptor */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-0.5">Disruptor</p>
        <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">{bp.disruptor}</p>
      </div>

      {/* Structure piece */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-0.5">Structure piece</p>
        <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">{bp.structurePiece}</p>
      </div>
    </div>
  );
}

function OutfitCard({ outfit }: { outfit: OutfitRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
      {/* Image */}
      <div className="relative w-full aspect-[2/3] bg-[#fff0f5]">
        {outfit.outfit_card_url ? (
          <Image
            src={outfit.outfit_card_url}
            alt={outfit.ai_style_note ?? 'Outfit'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[#ffb3d1] text-xs font-medium uppercase tracking-widest">
              {outfit.status === 'generating' ? 'Generating…' : 'No image'}
            </p>
          </div>
        )}

        {/* Status badge */}
        {outfit.status && (
          <div className="absolute top-2.5 right-2.5">
            <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLORS[outfit.status] ?? ''}`}>
              {outfit.status}
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-3 border-t border-[#ffb3d1]/30">
        {outfit.occasion && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#ff6b9d]/60 mb-0.5">
            {outfit.occasion}
          </p>
        )}
        <p className="text-xs font-semibold text-[#4a2c3e] leading-snug line-clamp-2 mb-1.5">
          {outfit.ai_style_note || `Outfit #${outfit.id.slice(0, 8)}`}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-[#4a2c3e]/40 truncate">{outfit.client_name ?? '—'}</p>
          {outfit.created_at && (
            <p className="text-[10px] text-[#4a2c3e]/30 flex-shrink-0">
              {new Date(outfit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Blueprint toggle */}
      {outfit.ai_blueprint && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2 border-t border-[#ffb3d1]/30 text-[10px] font-semibold text-[#4a2c3e]/50 hover:text-[#ff6b9d] hover:bg-[#fff0f5] transition-colors"
          >
            <span>Gemini blueprint</span>
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {open && <BlueprintPanel bp={outfit.ai_blueprint} />}
        </>
      )}
    </div>
  );
}

function AdminOutfitsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  const status = searchParams.get('status') ?? 'all';
  const page   = parseInt(searchParams.get('page') ?? '1');
  const limit  = 24;

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
        <p className="text-xs text-[#4a2c3e]/40 mb-4 font-medium">{total} outfit{total !== 1 ? 's' : ''}</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-[#ff6b9d]" />
        </div>
      ) : outfits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 text-center py-24 shadow-sm">
          <p className="text-[#4a2c3e]/40 text-sm">No outfits found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {outfits.map(outfit => (
            <OutfitCard key={outfit.id} outfit={outfit} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
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
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-[#ff6b9d]" /></div>}>
      <AdminOutfitsContent />
    </Suspense>
  );
}
