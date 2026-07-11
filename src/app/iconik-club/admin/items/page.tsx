'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FashionItem, ItemStatus } from '@/lib/supabase';
import { ActionMenu, AdminCard, AdminPageHeader, CLUB, ConfirmDialog, controlClass, EmptyState, FilterBar, LoadingState, primaryButtonClass, quietButtonClass, StatusBadge, secondaryButtonClass } from '@/components/IconikClubAdminUI';

const STATUS_COLORS: Record<ItemStatus, string> = {
  active:   'bg-emerald-50 text-emerald-600 border border-emerald-100',
  draft:    'bg-amber-50 text-amber-600 border border-amber-100',
  archived: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const CATEGORIES = ['all','top','bottom','dress','outerwear','shoes','bag','accessory','jumpsuit','skirt','other'];

function AdminItemsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems]       = useState<FashionItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const status   = searchParams.get('status')   ?? 'all';
  const category = searchParams.get('category') ?? '';
  const search   = searchParams.get('search')   ?? '';
  const page     = parseInt(searchParams.get('page') ?? '1');
  const limit    = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status !== 'all') params.set('status', status);
    if (category)         params.set('category', category);
    if (search)           params.set('search', search);

    const res  = await fetch(`/api/iconik-club/items/list?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [status, category, search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/iconik-club/items/${id}`, { method: 'DELETE' });
    await fetchItems();
    setDeleting(null);
    setArchiveId(null);
  };

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/iconik-club/admin/items?${p}`);
  };

  const totalPages = Math.ceil(total / limit);
  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader eyebrow="Wardrobe library" title="Catalogue" description="Review the pieces available for outfit generation." actions={<><Link href="/iconik-club/admin/items/bulk" className={secondaryButtonClass}>Bulk upload</Link><Link href="/iconik-club/admin/items/upload" className={primaryButtonClass}><Plus size={14} /> Upload item</Link></>} />

      {/* Filters */}
      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: CLUB.faint }} />
          <input
            type="text"
            defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value); }}
            placeholder="Search items…"
            aria-label="Search catalogue"
            className={`${controlClass} pl-10`}
          />
        </div>
        <select aria-label="Item status" value={status} onChange={e => setParam('status', e.target.value)} className={`${controlClass} sm:w-auto`}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select aria-label="Item category" value={category || 'all'} onChange={e => setParam('category', e.target.value)} className={`${controlClass} capitalize sm:w-auto`}>
          {CATEGORIES.map(c => (
            <option key={c} value={c} className="capitalize">{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </FilterBar>

      {/* Count */}
      {!loading && (
        <p className="mb-3 text-xs" style={{ color: CLUB.muted }}>{total} item{total !== 1 ? 's' : ''}</p>
      )}

      {/* Table */}
      <AdminCard className="overflow-visible">
        {loading ? (
          <LoadingState label="Loading catalogue…" />
        ) : items.length === 0 ? (
          <EmptyState title="No catalogue items found" description="Try changing the filters or add a new piece." action={<Link href="/iconik-club/admin/items/upload" className={primaryButtonClass}>Upload item</Link>} />
        ) : (
          <>
          <div className="divide-y md:hidden" style={{ borderColor: CLUB.border }}>{items.map(item => <div key={item.id} className="flex items-start gap-3 p-4"><div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: CLUB.card }}>{item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" style={{ color: CLUB.ink }}>{item.item_name}</p><p className="mt-0.5 text-xs capitalize" style={{ color: CLUB.muted }}>{item.brand || item.category || 'Uncategorised'}</p><div className="mt-2"><StatusBadge tone={item.status === 'active' ? 'success' : item.status === 'draft' ? 'warning' : 'neutral'}>{item.status}</StatusBadge></div></div><ActionMenu label="Actions">{item.purchase_link && <a href={item.purchase_link} target="_blank" rel="noopener noreferrer" className={`${quietButtonClass} w-full justify-start`}><ExternalLink size={14} /> Open product</a>}<Link href={`/iconik-club/admin/items/${item.id}`} className={`${quietButtonClass} w-full justify-start`}><Pencil size={14} /> Edit item</Link><button className={`${quietButtonClass} w-full justify-start text-[#B45E55]`} onClick={() => setArchiveId(item.id!)}><Trash2 size={14} /> Archive</button></ActionMenu></div>)}</div>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr style={{ background: CLUB.card, borderBottom: `1px solid ${CLUB.border}` }}>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Item</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden lg:table-cell">Price</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: CLUB.border }}>
              {items.map(item => (
                <tr key={item.id} className="transition-colors hover:bg-black/[0.025]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-11 h-11 object-cover rounded-xl border border-[#ffb3d1]/60 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-[#fff0f5] rounded-xl border border-[#ffb3d1]/60 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[#4a2c3e]">{item.item_name}</p>
                        {item.brand && <p className="text-xs text-[#4a2c3e]/40 font-medium">{item.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 capitalize text-sm hidden md:table-cell">
                    {item.category ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-[#4a2c3e]/60 text-sm hidden lg:table-cell">
                    {item.price ? `${item.currency ?? 'INR'} ${item.price.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[item.status as ItemStatus] ?? ''}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end"><ActionMenu label="Actions">{item.purchase_link && <a href={item.purchase_link} target="_blank" rel="noopener noreferrer" className={`${quietButtonClass} w-full justify-start`}><ExternalLink size={14} /> Open product</a>}<Link href={`/iconik-club/admin/items/${item.id}`} className={`${quietButtonClass} w-full justify-start`}><Pencil size={14} /> Edit item</Link><button className={`${quietButtonClass} w-full justify-start text-[#B45E55]`} onClick={() => setArchiveId(item.id!)}><Trash2 size={14} /> Archive</button></ActionMenu></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></>
        )}
      </AdminCard>

      <ConfirmDialog open={Boolean(archiveId)} title="Archive this item?" description="It will be hidden from the active catalogue. You can still find it using the Archived filter." confirmLabel="Archive item" busy={Boolean(deleting)} onCancel={() => setArchiveId(null)} onConfirm={() => archiveId && void handleDelete(archiveId)} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set('page', String(Math.max(1, page - 1)));
              router.push(`/iconik-club/admin/items?${p}`);
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
                    router.push(`/iconik-club/admin/items?${params}`);
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
              router.push(`/iconik-club/admin/items?${p}`);
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

export default function AdminItemsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-[#ff6b9d]" /></div>}>
      <AdminItemsContent />
    </Suspense>
  );
}
