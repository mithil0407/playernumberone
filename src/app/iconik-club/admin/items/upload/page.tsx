'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle, ArrowLeft, X } from 'lucide-react';
import type { FashionItem, ItemCategory } from '@/lib/supabase';

const CATEGORIES: ItemCategory[] = ['top','bottom','dress','outerwear','shoes','bag','accessory','jumpsuit','skirt','other'];
const SIZES = ['XXS','XS','S','M','L','XL','XXL','One Size'];

type Step = 'upload' | 'review' | 'done';

interface IngestResponse {
  success: boolean;
  item: FashionItem;
  ai_extracted: { confidence: number };
  error?: string;
}

export default function UploadItemPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>('upload');
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [rawDescription, setRawDesc] = useState('');
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');
  const [isDragging, setIsDragging]   = useState(false);

  const [itemId, setItemId] = useState('');
  const [form, setForm]     = useState<Partial<FashionItem>>({});
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP files are supported.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  useEffect(() => {
    if (step !== 'upload') return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, handleFile]);

  const handleIngest = async () => {
    if (!imageFile) { setError('Please select an image.'); return; }
    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      fd.append('raw_description', rawDescription);

      const res  = await fetch('/api/iconik-club/items/ingest', { method: 'POST', body: fd });
      const data: IngestResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Upload failed. Please try again.');
        return;
      }

      setItemId(data.item.id!);
      setForm(data.item);
      setStep('review');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/iconik-club/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'active' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed.'); return; }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    await fetch(`/api/iconik-club/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'draft' }),
    });
    setSaving(false);
    router.push('/iconik-club/admin/items');
  };

  const field = (key: keyof FashionItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSize = (size: string) => {
    setForm(f => {
      const current = (f.size_availability ?? []) as string[];
      return {
        ...f,
        size_availability: current.includes(size)
          ? current.filter(s => s !== size)
          : [...current, size],
      };
    });
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30";
  const labelCls = "block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5";

  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-400/25">
          <CheckCircle size={28} className="text-white" />
        </div>
        <h2 className="luxury-heading text-3xl text-[#4a2c3e] mb-2">Item activated!</h2>
        <p className="text-sm text-[#4a2c3e]/55 mb-8">The item is now live in the catalog.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setStep('upload'); setImageFile(null); setImagePreview(''); setRawDesc(''); setForm({}); setItemId(''); }}
            className="px-5 py-2.5 text-sm font-medium border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] transition-colors"
          >
            Upload another
          </button>
          <Link href="/iconik-club/admin/items" className="px-5 py-2.5 text-sm font-semibold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-xl transition-colors shadow-md shadow-[#ff6b9d]/20">
            View all items
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => setStep('upload')} className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Review extraction</h2>
            <p className="text-sm text-[#4a2c3e]/50">Edit any fields before activating.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 space-y-5 shadow-sm">
          {/* Preview + confidence */}
          <div className="flex gap-5">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="preview" className="w-28 h-28 object-cover rounded-xl border border-[#ffb3d1] flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`${labelCls} mb-2`}>AI confidence</p>
              <div className="w-full bg-[#fff0f5] rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-[#ff6b9d] to-[#e85a8a] h-2.5 rounded-full transition-all"
                  style={{ width: `${((form.ai_confidence ?? 0.5) * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-xs text-[#4a2c3e]/40 mt-1.5 font-medium">
                {((form.ai_confidence ?? 0.5) * 100).toFixed(0)}% confident
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Item name *</label>
            <input value={form.item_name ?? ''} onChange={field('item_name')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Brand</label>
              <input value={form.brand ?? ''} onChange={field('brand')} placeholder="e.g. Zara" className={inputCls} />
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
              <input type="number" value={form.price ?? ''} onChange={field('price')} placeholder="1499" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <input value={form.currency ?? 'INR'} onChange={field('currency')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Purchase link</label>
            <input value={form.purchase_link ?? ''} onChange={field('purchase_link')} placeholder="https://…" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Colors (comma-separated)</label>
            <input
              value={Array.isArray(form.color) ? form.color.join(', ') : ''}
              onChange={e => setForm(f => ({ ...f, color: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="ivory, cobalt blue"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Size availability</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => {
                const selected = (form.size_availability as string[] ?? []).includes(s);
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

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-[#ffb3d1]/50">
            <button onClick={saveDraft} disabled={saving}
              className="px-5 py-2.5 text-sm font-medium border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] transition-colors disabled:opacity-60"
            >
              Save as draft
            </button>
            <button onClick={handleActivate} disabled={saving || !form.item_name}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#ff6b9d]/20"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Activate item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/iconik-club/admin/items" className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Upload item</h2>
          <p className="text-sm text-[#4a2c3e]/50">Drop an image — Gemini will extract the details.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl cursor-pointer transition-all
            flex flex-col items-center justify-center min-h-[220px]
            ${isDragging
              ? 'border-[#ff6b9d] bg-[#fff0f5]'
              : 'border-[#ffb3d1] bg-white hover:border-[#ff6b9d] hover:bg-[#fff9f5]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {imagePreview ? (
            <div className="relative py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className="max-h-64 max-w-full rounded-xl object-contain" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(''); }}
                className="absolute -top-1 -right-1 w-7 h-7 bg-[#4a2c3e] text-white rounded-full flex items-center justify-center hover:bg-[#ff6b9d] transition-colors shadow-sm"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="text-center p-10">
              <div className="w-14 h-14 bg-[#fff0f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImagePlus size={24} className="text-[#ffb3d1]" />
              </div>
              <p className="text-sm font-semibold text-[#4a2c3e]/70 mb-1">Drag & drop or paste an image here</p>
              <p className="text-xs text-[#4a2c3e]/35">
                or click to browse · JPEG, PNG, WebP ·{' '}
                <kbd className="px-1.5 py-0.5 bg-[#fff0f5] border border-[#ffb3d1] rounded-md text-[10px] font-mono">⌘V</kbd> to paste
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-5 shadow-sm">
          <label className="block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-2">
            Description <span className="normal-case font-normal text-[#4a2c3e]/30">(optional)</span>
          </label>
          <textarea
            value={rawDescription}
            onChange={e => setRawDesc(e.target.value)}
            rows={3}
            placeholder='Rough notes, e.g. "H&M silk blouse, light blue, XS-L, ₹1499, hm.com"'
            className="w-full px-3.5 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] resize-none placeholder:text-[#4a2c3e]/30 transition"
          />
          <p className="text-[10px] text-[#4a2c3e]/35 mt-2">
            Gemini 2.5 Flash will extract brand, category, price, sizes & purchase link automatically.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <button
          onClick={handleIngest}
          disabled={!imageFile || uploading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff6b9d] hover:bg-[#e85a8a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#ff6b9d]/20"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" />Analysing with Gemini…</>
          ) : (
            <><Upload size={16} />Upload & extract details</>
          )}
        </button>
      </div>
    </div>
  );
}
