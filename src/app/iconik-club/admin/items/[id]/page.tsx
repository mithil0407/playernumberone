'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { FashionItem, ItemCategory } from '@/lib/supabase';

const CATEGORIES: ItemCategory[] = ['top','bottom','dress','outerwear','shoes','bag','accessory','jumpsuit','skirt','other'];
const SIZES = ['XXS','XS','S','M','L','XL','XXL','One Size'];

export default function ItemDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [item, setItem]         = useState<FashionItem | null>(null);
  const [form, setForm]         = useState<Partial<FashionItem>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetch(`/api/iconik-club/items/${id}`)
      .then(r => r.json())
      .then(d => { setItem(d.item); setForm(d.item); })
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    try {
      const body = newStatus ? { ...form, status: newStatus } : form;
      const res  = await fetch(`/api/iconik-club/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast('error', data.error ?? 'Save failed.'); return; }
      setItem(data.item);
      setForm(data.item);
      showToast('success', newStatus === 'active' ? 'Item activated!' : 'Changes saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Archive this item? It will be hidden from the catalog.')) return;
    setDeleting(true);
    await fetch(`/api/iconik-club/items/${id}`, { method: 'DELETE' });
    router.push('/iconik-club/admin/items');
  };

  const field = (key: keyof FashionItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSize = (size: string) =>
    setForm(f => {
      const current = (f.size_availability ?? []) as string[];
      return {
        ...f,
        size_availability: current.includes(size)
          ? current.filter(s => s !== size)
          : [...current, size],
      };
    });

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition";
  const labelCls = "block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[#ff6b9d]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-24">
        <p className="text-[#4a2c3e]/40 text-sm mb-3">Item not found.</p>
        <Link href="/iconik-club/admin/items" className="text-[#ff6b9d] text-sm font-medium hover:underline">Back to items</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${toast.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-red-500 shadow-red-500/25'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <Link href="/iconik-club/admin/items" className="p-2 mt-0.5 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all flex-shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="luxury-heading text-3xl text-[#4a2c3e] truncate">{item.item_name}</h2>
          <p className="text-sm text-[#4a2c3e]/45 capitalize mt-0.5">{item.status} · {item.category ?? 'uncategorised'}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 border border-red-200 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50 flex-shrink-0"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Archive
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 space-y-5 shadow-sm">
        {/* Image preview */}
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.item_name} className="w-full max-h-64 object-contain rounded-xl border border-[#ffb3d1]/60" />
        )}

        <div>
          <label className={labelCls}>Item name *</label>
          <input value={form.item_name ?? ''} onChange={field('item_name')} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Brand</label>
            <input value={form.brand ?? ''} onChange={field('brand')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category ?? ''} onChange={field('category')} className={`${inputCls} capitalize`}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Price</label>
            <input type="number" value={form.price ?? ''} onChange={field('price')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <input value={form.currency ?? 'INR'} onChange={field('currency')} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Purchase link</label>
          <input value={form.purchase_link ?? ''} onChange={field('purchase_link')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Colors (comma-separated)</label>
          <input
            value={Array.isArray(form.color) ? form.color.join(', ') : ''}
            onChange={e => setForm(f => ({ ...f, color: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Size availability</label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => {
              const selected = ((form.size_availability ?? []) as string[]).includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    selected
                      ? 'bg-[#ff6b9d] border-[#ff6b9d] text-white shadow-sm'
                      : 'border-[#ffb3d1] text-[#4a2c3e]/60 hover:border-[#ff6b9d] hover:text-[#ff6b9d]'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#ffb3d1]/50">
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save changes
          </button>

          {item.status !== 'active' && (
            <button onClick={() => handleSave('active')} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-xl transition-all disabled:opacity-60 shadow-md shadow-[#ff6b9d]/20"
            >
              <CheckCircle size={14} />
              Activate
            </button>
          )}

          {item.status === 'active' && (
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-white rounded-xl transition-all disabled:opacity-60"
            >
              Move to draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
