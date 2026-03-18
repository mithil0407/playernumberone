'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FashionItem, ItemStatus } from '@/lib/supabase';

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
    if (!confirm('Archive this item?')) return;
    setDeleting(id);
    await fetch(`/api/iconik-club/items/${id}`, { method: 'DELETE' });
    await fetchItems();
    setDeleting(null);
  };

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/iconik-club/admin/items?${p}`);
  };

  const totalPages = Math.ceil(total / limit);
  const selectCls = "px-3 py-2 text-sm border border-[#ffb3d1] rounded-xl bg-white text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-1">Catalog</p>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Items</h2>
        </div>
        <Link
          href="/iconik-club/admin/items/upload"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6b9d] hover:bg-[#e85a8a] text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-[#ff6b9d]/20"
        >
          <Plus size={15} />
          Upload item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-4 mb-5 flex flex-wrap gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a2c3e]/30" />
          <input
            type="text"
            defaultValue={search}
            onKeyDown={e => { if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value); }}
            placeholder="Search items…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition"
          />
        </div>
        <select value={status} onChange={e => setParam('status', e.target.value)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={category || 'all'} onChange={e => setParam('category', e.target.value)} className={`${selectCls} capitalize`}>
          {CATEGORIES.map(c => (
            <option key={c} value={c} className="capitalize">{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-[#4a2c3e]/40 mb-3 font-medium">{total} item{total !== 1 ? 's' : ''}</p>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-[#ff6b9d]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#4a2c3e]/40 text-sm mb-2">No items found.</p>
            <Link href="/iconik-club/admin/items/upload" className="text-[#ff6b9d] text-sm font-medium hover:underline">
              Upload your first item →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ffb3d1]/50 bg-[#fff9f5]">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Item</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest hidden lg:table-cell">Price</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-[#4a2c3e]/40 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffb3d1]/30">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-[#fff9f5] transition-colors group">
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
                    <div className="flex items-center justify-end gap-1">
                      {item.purchase_link && (
                        <a
                          href={item.purchase_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#4a2c3e]/30 hover:text-[#ff6b9d] rounded-lg hover:bg-[#fff0f5] transition-all"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <Link
                        href={`/iconik-club/admin/items/${item.id}`}
                        className="p-2 text-[#4a2c3e]/30 hover:text-[#ff6b9d] rounded-lg hover:bg-[#fff0f5] transition-all"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={deleting === item.id}
                        className="p-2 text-[#4a2c3e]/30 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40"
                      >
                        {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
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
