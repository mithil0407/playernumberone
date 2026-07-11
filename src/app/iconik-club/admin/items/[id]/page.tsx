'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { FashionItem, ItemCategory } from '@/lib/supabase';
import { ActionMenu, AdminCard, AdminPageHeader, CLUB, ConfirmDialog, controlClass, dangerButtonClass, LoadingState, primaryButtonClass, secondaryButtonClass } from '@/components/IconikClubAdminUI';

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
  const [confirmArchive, setConfirmArchive] = useState(false);
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

  const inputCls = controlClass;
  const labelCls = "block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5";

  if (loading) {
    return (
      <LoadingState label="Loading item…" />
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
    <div className="mx-auto max-w-3xl pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${toast.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-red-500 shadow-red-500/25'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <Link href="/iconik-club/admin/items" className={`${secondaryButtonClass} mb-5`}><ArrowLeft size={14} /> Catalogue</Link>
      <AdminPageHeader eyebrow="Catalogue item" title={item.item_name} description={`${item.status} · ${item.category ?? 'uncategorised'}`} actions={<ActionMenu><button className={dangerButtonClass} onClick={() => setConfirmArchive(true)}><Trash2 size={14} /> Archive item</button></ActionMenu>} />

      <AdminCard className="space-y-5 p-5 sm:p-6">
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
        <div className="sticky bottom-3 z-10 flex flex-wrap justify-end gap-3 rounded-2xl border p-3 shadow-xl" style={{ background: CLUB.surface, borderColor: CLUB.border }}>
          <button onClick={() => handleSave()} disabled={saving} className={primaryButtonClass}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save changes
          </button>

          {item.status !== 'active' && (
            <button onClick={() => handleSave('active')} disabled={saving}
              className={secondaryButtonClass}
            >
              <CheckCircle size={14} />
              Activate
            </button>
          )}

          {item.status === 'active' && (
            <button onClick={() => handleSave('draft')} disabled={saving}
              className={secondaryButtonClass}
            >
              Move to draft
            </button>
          )}
        </div>
      </AdminCard>
      <ConfirmDialog open={confirmArchive} title="Archive this item?" description="It will be hidden from the active catalogue and remain available through the Archived filter." confirmLabel="Archive item" busy={deleting} onCancel={() => setConfirmArchive(false)} onConfirm={() => void handleDelete()} />
    </div>
  );
}
