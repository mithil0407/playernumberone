'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { AdminCard, AdminPageHeader, CLUB, controlClass, EmptyState, FilterBar, LoadingState, StatusBadge } from '@/components/IconikClubAdminUI';

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
  signatureCodesUsed?: string[];
}

interface PreferenceProfileSnapshot {
  tasteSummary?: string;
  styling?: {
    signatureCodes?: string[];
    antiCodes?: string[];
  };
}

interface MatchDiagnostics {
  selectionSource?: 'model' | 'repair';
  candidatePools?: Array<{
    occasion: string;
    slot: string;
    candidates: Array<{
      id: string;
      name: string;
      category: string;
      score: number;
      reasons?: string[];
    }>;
  }>;
  slotSelections?: Record<string, string | null>;
  notes?: string[];
}

interface OutfitRow {
  id: string;
  client_id: string;
  client_name?: string;
  outfit_card_url?: string;
  ai_style_note?: string;
  ai_blueprint?: OutfitBlueprint;
  generation_version?: string;
  preference_profile_snapshot?: PreferenceProfileSnapshot;
  match_diagnostics?: MatchDiagnostics;
  validation_errors?: string[];
  occasion?: string;
  season?: string;
  status?: OutfitStatus;
  created_at?: string;
}

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
  const [openBlueprint, setOpenBlueprint] = useState(false);
  const [openDiagnostics, setOpenDiagnostics] = useState(false);

  return (
    <AdminCard className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative w-full aspect-[2/3]" style={{ background: CLUB.card }}>
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
            <StatusBadge tone={outfit.status === 'ready' ? 'success' : outfit.status === 'failed' ? 'danger' : outfit.status === 'generating' ? 'accent' : 'warning'}>{outfit.status}</StatusBadge>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="border-t p-3" style={{ borderColor: CLUB.border }}>
        {outfit.occasion && (
          <p className="iconik-micro mb-1" style={{ color: CLUB.gold }}>
            {outfit.occasion}
          </p>
        )}
        <p className="mb-1.5 line-clamp-2 text-xs font-medium leading-snug" style={{ color: CLUB.ink }}>
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
            onClick={() => setOpenBlueprint(o => !o)}
            className="flex w-full items-center justify-between border-t px-3 py-2 text-[11px] transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: CLUB.border, color: CLUB.muted }}
            aria-expanded={openBlueprint}
          >
            <span>Outfit details</span>
            {openBlueprint ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {openBlueprint && <BlueprintPanel bp={outfit.ai_blueprint} />}
        </>
      )}

      {(outfit.match_diagnostics || outfit.preference_profile_snapshot || outfit.generation_version) && (
        <>
          <button
            onClick={() => setOpenDiagnostics(o => !o)}
            className="flex w-full items-center justify-between border-t px-3 py-2 text-[11px] transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: CLUB.border, color: CLUB.muted }}
            aria-expanded={openDiagnostics}
          >
            <span>Diagnostics</span>
            {openDiagnostics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {openDiagnostics && (
            <div className="px-3 pb-3 border-t border-[#ffb3d1]/30 pt-2.5 space-y-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Generation</p>
                <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">
                  Version: {outfit.generation_version ?? '—'}
                  {outfit.match_diagnostics?.selectionSource ? ` · Selection: ${outfit.match_diagnostics.selectionSource}` : ''}
                </p>
              </div>

              {outfit.preference_profile_snapshot?.tasteSummary && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Taste summary</p>
                  <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">{outfit.preference_profile_snapshot.tasteSummary}</p>
                </div>
              )}

              {!!outfit.preference_profile_snapshot?.styling?.signatureCodes?.length && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Signature codes</p>
                  <p className="text-[10px] text-[#4a2c3e]/70 leading-snug">
                    {outfit.preference_profile_snapshot.styling.signatureCodes.join(' · ')}
                  </p>
                </div>
              )}

              {!!outfit.match_diagnostics?.slotSelections && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Slot selections</p>
                  <div className="space-y-1">
                    {Object.entries(outfit.match_diagnostics.slotSelections).map(([slot, itemId]) => (
                      itemId ? (
                        <div key={slot} className="flex gap-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 w-16 flex-shrink-0">{slot}</span>
                          <span className="text-[10px] text-[#4a2c3e]/70 break-all">{itemId}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {!!outfit.match_diagnostics?.candidatePools?.length && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Top candidates</p>
                  <div className="space-y-2">
                    {outfit.match_diagnostics.candidatePools.slice(0, 4).map(pool => (
                      <div key={`${pool.occasion}-${pool.slot}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#ff6b9d]/50 mb-0.5">{pool.slot}</p>
                        {pool.candidates.slice(0, 3).map(candidate => (
                          <p key={candidate.id} className="text-[10px] text-[#4a2c3e]/70 leading-snug">
                            {candidate.name} · {candidate.score}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!outfit.validation_errors?.length && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-[#4a2c3e]/35 mb-1">Repair input</p>
                  <div className="space-y-1">
                    {outfit.validation_errors.map(error => (
                      <p key={error} className="text-[10px] text-[#4a2c3e]/70 leading-snug">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminCard>
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
  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader eyebrow="Styling delivery" title="Outfits" description="Review generated looks, progress and any generation issues." />

      {/* Filters */}
      <FilterBar>
        <select aria-label="Outfit status" value={status} onChange={e => setParam('status', e.target.value)} className={`${controlClass} sm:w-auto`}>
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="pending">Pending</option>
          <option value="generating">Generating</option>
          <option value="failed">Failed</option>
        </select>
      </FilterBar>

      {/* Count */}
      {!loading && (
        <p className="mb-4 text-xs" style={{ color: CLUB.muted }}>{total} outfit{total !== 1 ? 's' : ''}</p>
      )}

      {/* Grid */}
      {loading ? (
        <LoadingState label="Loading outfits…" />
      ) : outfits.length === 0 ? (
        <AdminCard><EmptyState title="No outfits found" description="Try changing the status filter." /></AdminCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
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
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin" style={{ color: CLUB.gold }} /></div>}>
      <AdminOutfitsContent />
    </Suspense>
  );
}
