'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, ImagePlus, Loader2, CheckCircle, AlertCircle, ArrowLeft, X, Plus } from 'lucide-react';
import type { FashionItem, ItemCategory } from '@/lib/supabase';
import { WorkflowSteps } from '@/components/IconikClubAdminUI';

const CATEGORIES: ItemCategory[] = ['top','bottom','dress','outerwear','shoes','bag','accessory','jumpsuit','skirt','other'];
const SIZES = ['XXS','XS','S','M','L','XL','XXL','One Size'];

type Step = 'upload' | 'review' | 'done';

interface IngestResponse {
  success: boolean;
  item: FashionItem;
  ai_extracted: { confidence: number };
  error?: string;
}

interface Variant {
  itemId: string;
  preview: string;
  colors: string[];
  colorInput: string;
  purchaseLink: string;
  confidence: number;
}

export default function UploadItemPage() {
  const router = useRouter();

  const [step, setStep]                 = useState<Step>('upload');
  const [imageFiles, setImageFiles]     = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [rawDescription, setRawDesc]    = useState('');
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');
  const [isDragging, setIsDragging]     = useState(false);

  // Shared across all colour variants
  const [sharedForm, setSharedForm] = useState<Partial<FashionItem>>({});
  // One entry per uploaded image
  const [variants, setVariants]     = useState<Variant[]>([]);
  const [saving, setSaving]         = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: File[]) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const valid = files.filter(f => allowed.includes(f.type));
    if (valid.length < files.length) {
      setError('Some files were skipped — only JPEG, PNG, and WebP are supported.');
    } else {
      setError('');
    }
    if (!valid.length) return;
    setImageFiles(prev => [...prev, ...valid].slice(0, 8));
    valid.forEach(f => {
      const url = URL.createObjectURL(f);
      setImagePreviews(prev => [...prev, url].slice(0, 8));
    });
  }, []);

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) addFiles(files);
  }, [addFiles]);

  useEffect(() => {
    if (step !== 'upload') return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) pasted.push(f);
        }
      }
      if (pasted.length) addFiles(pasted);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, addFiles]);

  const handleIngest = async () => {
    if (!imageFiles.length) { setError('Please add at least one image.'); return; }
    setUploading(true);
    setError('');

    try {
      const results = await Promise.all(
        imageFiles.map(async (file, i) => {
          const fd = new FormData();
          fd.append('image', file);
          fd.append('raw_description', rawDescription);
          const res = await fetch('/api/iconik-club/items/ingest', { method: 'POST', body: fd });
          const data: IngestResponse = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error ?? `Image ${i + 1} failed to process`);
          return data;
        })
      );

      // Shared details come from the first image's extraction
      const first = results[0].item;
      setSharedForm({
        brand:             first.brand,
        item_name:         first.item_name,
        category:          first.category,
        material:          first.material,
        price:             first.price,
        currency:          first.currency ?? 'INR',
        size_availability: first.size_availability,
        style_description: first.style_description,
        ai_confidence:     first.ai_confidence,
      });

      setVariants(results.map((r, i) => ({
        itemId:      r.item.id!,
        preview:     imagePreviews[i],
        colors:      r.item.color ?? [],
        colorInput:  '',
        purchaseLink: r.item.purchase_link ?? '',
        confidence:  r.ai_extracted.confidence,
      })));

      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all(variants.map(v =>
        fetch(`/api/iconik-club/items/${v.itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sharedForm,
            color:         v.colors,
            purchase_link: v.purchaseLink,
            status:        'active',
          }),
        })
      ));
      setStep('done');
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    await Promise.all(variants.map(v =>
      fetch(`/api/iconik-club/items/${v.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sharedForm,
          color:         v.colors,
          purchase_link: v.purchaseLink,
          status:        'draft',
        }),
      })
    ));
    setSaving(false);
    router.push('/iconik-club/admin/items');
  };

  const sharedField = (key: keyof FashionItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setSharedForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSize = (size: string) => {
    setSharedForm(f => {
      const current = (f.size_availability ?? []) as string[];
      return {
        ...f,
        size_availability: current.includes(size)
          ? current.filter(s => s !== size)
          : [...current, size],
      };
    });
  };

  const addColorToVariant = (vi: number) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== vi) return v;
      const trimmed = v.colorInput.trim();
      if (!trimmed || v.colors.includes(trimmed)) return { ...v, colorInput: '' };
      return { ...v, colors: [...v.colors, trimmed], colorInput: '' };
    }));
  };

  const removeColorFromVariant = (vi: number, color: string) => {
    setVariants(prev => prev.map((v, i) =>
      i !== vi ? v : { ...v, colors: v.colors.filter(c => c !== color) }
    ));
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/30";
  const labelCls = "block text-[10px] font-bold text-[#4a2c3e]/50 uppercase tracking-widest mb-1.5";

  /* ── Done ── */
  if (step === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-400/25">
          <CheckCircle size={28} className="text-white" />
        </div>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e] mb-2">
          {variants.length === 1 ? 'Item activated!' : `${variants.length} variants activated!`}
          </h2>
          <WorkflowSteps steps={['Add images', 'Review extraction', 'Activate']} current={2} />
        <p className="text-sm text-[#4a2c3e]/55 mb-8">
          {variants.length === 1
            ? 'The item is now live in the catalog.'
            : 'All colour variants are now live in the catalog.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setStep('upload');
              setImageFiles([]);
              setImagePreviews([]);
              setRawDesc('');
              setSharedForm({});
              setVariants([]);
              setError('');
            }}
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

  /* ── Review ── */
  if (step === 'review') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => setStep('upload')} className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Review extraction</h2>
            <p className="text-sm text-[#4a2c3e]/50">
              {variants.length > 1
                ? `Shared details apply to all ${variants.length} variants. Set colour & link per variant below.`
                : 'Edit any fields before activating.'}
            </p>
          </div>
        </div>
        <WorkflowSteps steps={['Add images', 'Review extraction', 'Activate']} current={1} />

        <div className="space-y-5">
          {/* Shared fields */}
          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 space-y-5 shadow-sm">
            <p className={`${labelCls} !text-[#ff6b9d]`}>
              Shared details {variants.length > 1 && <span className="normal-case font-normal text-[#4a2c3e]/30">— applies to all variants</span>}
            </p>

            {/* AI confidence bar (from first image) */}
            <div>
              <p className={`${labelCls} mb-2`}>AI confidence</p>
              <div className="w-full bg-[#fff0f5] rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-[#ff6b9d] to-[#e85a8a] h-2.5 rounded-full transition-all"
                  style={{ width: `${((sharedForm.ai_confidence ?? 0.5) * 100).toFixed(0)}%` }}
                />
              </div>
              <p className="text-xs text-[#4a2c3e]/40 mt-1.5 font-medium">
                {((sharedForm.ai_confidence ?? 0.5) * 100).toFixed(0)}% confident
              </p>
            </div>

            <div>
              <label className={labelCls}>Item name *</label>
              <input value={sharedForm.item_name ?? ''} onChange={sharedField('item_name')} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Brand</label>
                <input value={sharedForm.brand ?? ''} onChange={sharedField('brand')} placeholder="e.g. Zara" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={sharedForm.category ?? ''} onChange={sharedField('category')} className={`${inputCls} capitalize`}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price</label>
                <input type="number" value={sharedForm.price ?? ''} onChange={sharedField('price')} placeholder="1499" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <input value={sharedForm.currency ?? 'INR'} onChange={sharedField('currency')} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Size availability</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(s => {
                  const selected = (sharedForm.size_availability as string[] ?? []).includes(s);
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
          </div>

          {/* Per-variant rows */}
          <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 p-6 shadow-sm">
            <p className={`${labelCls} !text-[#ff6b9d] mb-5`}>
              Colour variants
              <span className="normal-case font-normal text-[#4a2c3e]/30"> — {variants.length} image{variants.length > 1 ? 's' : ''}</span>
            </p>
            <div className="space-y-5">
              {variants.map((v, vi) => (
                <div key={v.itemId} className="flex gap-4 pb-5 border-b border-[#ffb3d1]/30 last:pb-0 last:border-0">
                  {/* Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.preview} alt={`variant ${vi + 1}`} className="w-20 h-20 object-cover rounded-xl border border-[#ffb3d1] flex-shrink-0" />

                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Colour chips + input */}
                    <div>
                      <label className={labelCls}>Colour</label>
                      {v.colors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {v.colors.map(c => (
                            <span key={c} className="flex items-center gap-1 px-2.5 py-1 bg-[#fff0f5] border border-[#ffb3d1] text-[#4a2c3e] text-xs font-medium rounded-lg">
                              {c}
                              <button type="button" onClick={() => removeColorFromVariant(vi, c)} className="text-[#4a2c3e]/40 hover:text-[#ff6b9d] ml-0.5">
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={v.colorInput}
                          onChange={e => setVariants(prev => prev.map((x, i) => i === vi ? { ...x, colorInput: e.target.value } : x))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColorToVariant(vi); } }}
                          placeholder="e.g. cobalt blue — press Enter to add"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => addColorToVariant(vi)}
                          className="px-3 py-2.5 text-sm bg-[#fff0f5] border border-[#ffb3d1] text-[#ff6b9d] rounded-xl hover:bg-[#ffe0ee] transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Purchase link */}
                    <div>
                      <label className={labelCls}>Purchase link</label>
                      <input
                        value={v.purchaseLink}
                        onChange={e => setVariants(prev => prev.map((x, i) => i === vi ? { ...x, purchaseLink: e.target.value } : x))}
                        placeholder="https://…"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={saveDraft} disabled={saving}
              className="px-5 py-2.5 text-sm font-medium border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] transition-colors disabled:opacity-60"
            >
              Save as draft
            </button>
            <button onClick={handleActivate} disabled={saving || !sharedForm.item_name}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#ff6b9d]/20"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {variants.length > 1 ? `Activate ${variants.length} variants` : 'Activate item'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Upload ── */
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/iconik-club/admin/items" className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Upload item</h2>
          <p className="text-sm text-[#4a2c3e]/50">Drop one image per colour variant — Gemini extracts the details.</p>
        </div>
      </div>
      <WorkflowSteps steps={['Add images', 'Review extraction', 'Activate']} current={0} />

      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !imageFiles.length && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl transition-all
            ${imageFiles.length ? 'cursor-default' : 'cursor-pointer'}
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
            multiple
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) addFiles(files);
              e.target.value = '';
            }}
          />

          {imageFiles.length > 0 ? (
            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`variant ${i + 1}`} className="w-24 h-24 object-cover rounded-xl border border-[#ffb3d1]" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeImage(i); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#4a2c3e] text-white rounded-full flex items-center justify-center hover:bg-[#ff6b9d] transition-colors shadow-sm"
                    >
                      <X size={10} />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-semibold rounded-md">
                      {i + 1}
                    </span>
                  </div>
                ))}
                {imageFiles.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-[#ffb3d1] rounded-xl flex flex-col items-center justify-center text-[#4a2c3e]/40 hover:border-[#ff6b9d] hover:text-[#ff6b9d] transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] mt-1 font-medium">Add more</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#4a2c3e]/35 mt-3">
                {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} queued
                {imageFiles.length > 1 ? ' · each image = one colour variant' : ''}
                {' '}· drag or{' '}
                <kbd className="px-1 py-0.5 bg-[#fff0f5] border border-[#ffb3d1] rounded text-[9px] font-mono">⌘V</kbd>
                {' '}paste to add more
              </p>
            </div>
          ) : (
            <div className="text-center p-10">
              <div className="w-14 h-14 bg-[#fff0f5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImagePlus size={24} className="text-[#ffb3d1]" />
              </div>
              <p className="text-sm font-semibold text-[#4a2c3e]/70 mb-1">Drop or paste images here</p>
              <p className="text-xs text-[#4a2c3e]/35">
                One image per colour variant · JPEG, PNG, WebP ·{' '}
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
            placeholder='e.g. "H&M silk blouse, XS-L, ₹1499 — available in 3 colours"'
            className="w-full px-3.5 py-2.5 text-sm border border-[#ffb3d1] rounded-xl bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-2 focus:ring-[#ff6b9d]/30 focus:border-[#ff6b9d] resize-none placeholder:text-[#4a2c3e]/30 transition"
          />
          <p className="text-[10px] text-[#4a2c3e]/35 mt-2">
            Gemini 2.5 Flash extracts brand, category, price and sizes. Each image gets its own colour detected.
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
          disabled={!imageFiles.length || uploading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff6b9d] hover:bg-[#e85a8a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#ff6b9d]/20"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" />Analysing with Gemini…</>
          ) : imageFiles.length > 1 ? (
            <><Upload size={16} />Upload & extract {imageFiles.length} variants</>
          ) : (
            <><Upload size={16} />Upload & extract details</>
          )}
        </button>
      </div>
    </div>
  );
}
