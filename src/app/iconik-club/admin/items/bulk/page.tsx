'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ImagePlus, Loader2, CheckCircle, AlertCircle,
  X, Zap, SkipForward, ChevronDown,
} from 'lucide-react';
import type { ItemCategory } from '@/lib/supabase';
import { WorkflowSteps } from '@/components/IconikClubAdminUI';

const CATEGORIES: ItemCategory[] = [
  'top', 'bottom', 'dress', 'outerwear', 'shoes',
  'bag', 'accessory', 'jumpsuit', 'skirt', 'other',
];

const BATCH_SIZE = 5; // concurrent Gemini requests

type CardStatus = 'queued' | 'processing' | 'done' | 'error' | 'activated' | 'skipped';

interface BulkCard {
  localId: string;
  file: File;
  preview: string;
  status: CardStatus;
  error?: string;
  // populated after ingest
  dbId?: string;
  name?: string;
  category?: string;
  brand?: string;
  price?: string;
  purchaseLink?: string;
  colors?: string[];
  confidence?: number;
}

export default function BulkUploadPage() {
  const [cards, setCards]         = useState<BulkCard[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep a ref so async callbacks always see current cards
  const cardsRef = useRef<BulkCard[]>([]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const updateCard = useCallback((localId: string, updates: Partial<BulkCard>) => {
    setCards(prev => prev.map(c => c.localId === localId ? { ...c, ...updates } : c));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newCards: BulkCard[] = [];
    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) continue;
      newCards.push({
        localId:  crypto.randomUUID(),
        file,
        preview:  URL.createObjectURL(file),
        status:   'queued',
      });
    }
    setCards(prev => [...prev, ...newCards]);
  }, []);

  const removeCard = (localId: string) => {
    setCards(prev => prev.filter(c => c.localId !== localId));
  };

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (imageFiles.length) addFiles(imageFiles);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const processOne = async (card: BulkCard) => {
    updateCard(card.localId, { status: 'processing' });
    try {
      const fd = new FormData();
      fd.append('image', card.file);
      const res  = await fetch('/api/iconik-club/items/ingest', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        updateCard(card.localId, { status: 'error', error: data.error ?? 'Extraction failed' });
        return;
      }
      const item = data.item;
      updateCard(card.localId, {
        status:      'done',
        dbId:        item.id,
        name:        item.item_name ?? '',
        category:    item.category ?? '',
        brand:       item.brand ?? '',
        price:       item.price != null ? String(item.price) : '',
        purchaseLink: item.purchase_link ?? '',
        colors:      item.color ?? [],
        confidence:  item.ai_confidence ?? 0,
      });
    } catch {
      updateCard(card.localId, { status: 'error', error: 'Network error' });
    }
  };

  const processAll = async () => {
    setIsProcessing(true);
    const queued = cardsRef.current.filter(c => c.status === 'queued');
    for (let i = 0; i < queued.length; i += BATCH_SIZE) {
      await Promise.all(queued.slice(i, i + BATCH_SIZE).map(processOne));
    }
    setIsProcessing(false);
  };

  const activateCard = async (localId: string) => {
    const card = cardsRef.current.find(c => c.localId === localId);
    if (!card?.dbId) return;
    updateCard(localId, { status: 'processing' });
    try {
      const res = await fetch(`/api/iconik-club/items/${card.dbId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          item_name:     card.name,
          category:      card.category,
          brand:         card.brand,
          price:         card.price ? parseFloat(card.price) : null,
          purchase_link: card.purchaseLink,
          status:        'active',
        }),
      });
      if (res.ok) updateCard(localId, { status: 'activated' });
      else        updateCard(localId, { status: 'error', error: 'Activate failed' });
    } catch {
      updateCard(localId, { status: 'error', error: 'Network error' });
    }
  };

  const activateAll = async () => {
    const eligible = cardsRef.current.filter(c => c.status === 'done');
    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      await Promise.all(eligible.slice(i, i + BATCH_SIZE).map(c => activateCard(c.localId)));
    }
  };

  // Counts
  const total      = cards.length;
  const queued     = cards.filter(c => c.status === 'queued').length;
  const processing = cards.filter(c => c.status === 'processing').length;
  const done       = cards.filter(c => c.status === 'done').length;
  const activated  = cards.filter(c => c.status === 'activated').length;
  const errors     = cards.filter(c => c.status === 'error').length;

  const allProcessed = total > 0 && queued === 0 && processing === 0;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <Link href="/iconik-club/admin/items" className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-bold text-[#ff6b9d] tracking-[0.2em] uppercase mb-0.5">Catalog</p>
            <h2 className="luxury-heading text-3xl text-[#4a2c3e]">Bulk upload</h2>
          </div>
        </div>
        <WorkflowSteps steps={['Add images', 'Review extraction', 'Activate']} current={0} />

        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl cursor-pointer transition-all
            flex flex-col items-center justify-center min-h-[280px]
            ${isDragging
              ? 'border-[#ff6b9d] bg-[#fff0f5]'
              : 'border-[#ffb3d1] bg-white hover:border-[#ff6b9d] hover:bg-[#fff9f5]'
            }
          `}
        >
          <input
            ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); }}
          />
          <div className="text-center p-10">
            <div className="w-16 h-16 bg-[#fff0f5] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ImagePlus size={28} className="text-[#ffb3d1]" />
            </div>
            <p className="text-base font-semibold text-[#4a2c3e]/70 mb-2">Drop all your product images here</p>
            <p className="text-sm text-[#4a2c3e]/35 mb-4">or click to select multiple files at once</p>
            <div className="flex items-center justify-center gap-3 text-xs text-[#4a2c3e]/30">
              <span>JPEG · PNG · WebP</span>
              <span>·</span>
              <span><kbd className="px-1.5 py-0.5 bg-[#fff0f5] border border-[#ffb3d1] rounded text-[10px] font-mono">⌘V</kbd> to paste</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/iconik-club/admin/items" className="p-2 text-[#4a2c3e]/40 hover:text-[#4a2c3e] hover:bg-[#fff0f5] rounded-xl transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="luxury-heading text-2xl text-[#4a2c3e]">Bulk upload</h2>
        </div>
        {/* Add more images */}
        {!isProcessing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold border border-[#ffb3d1] text-[#4a2c3e] rounded-xl hover:bg-[#fff0f5] transition-colors"
          >
            + Add more
          </button>
        )}
        <input
          ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); }}
        />
      </div>
      <WorkflowSteps steps={['Add images', 'Review extraction', 'Activate']} current={activated > 0 ? 2 : (processing > 0 || done > 0 ? 1 : 0)} />

      {/* Status bar */}
      <div className="bg-white rounded-2xl border border-[#ffb3d1]/60 px-5 py-3.5 mb-5 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 flex-1 flex-wrap text-xs">
          <span className="text-[#4a2c3e]/40 font-medium">{total} images</span>
          {queued > 0     && <span className="text-[#4a2c3e]/50">{queued} queued</span>}
          {processing > 0 && <span className="flex items-center gap-1 text-[#ff6b9d] font-semibold"><Loader2 size={11} className="animate-spin" />{processing} processing</span>}
          {done > 0       && <span className="text-emerald-600 font-semibold">{done} extracted</span>}
          {activated > 0  && <span className="text-emerald-700 font-bold">{activated} activated</span>}
          {errors > 0     && <span className="text-red-500 font-semibold">{errors} failed</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Activate all — shown once processing is done and there are done items */}
          {allProcessed && done > 0 && (
            <button
              onClick={activateAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-sm"
            >
              <Zap size={13} />
              Activate all ({done})
            </button>
          )}
          {/* Process — shown when there are queued items */}
          {queued > 0 && !isProcessing && (
            <button
              onClick={processAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-xl transition-colors shadow-sm shadow-[#ff6b9d]/20"
            >
              <Zap size={13} />
              Process {queued} item{queued !== 1 ? 's' : ''}
            </button>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#4a2c3e]/50">
              <Loader2 size={13} className="animate-spin" /> Processing…
            </span>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <BulkCard
            key={card.localId}
            card={card}
            onRemove={removeCard}
            onActivate={activateCard}
            onSkip={id => updateCard(id, { status: 'skipped' })}
            onRetry={id => {
              const c = cardsRef.current.find(x => x.localId === id);
              if (c) { updateCard(id, { status: 'queued' }); }
            }}
            onChange={(id, updates) => updateCard(id, updates)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Individual card component ────────────────────────────────────────────────

interface BulkCardProps {
  card: BulkCard;
  onRemove: (id: string) => void;
  onActivate: (id: string) => void;
  onSkip: (id: string) => void;
  onRetry: (id: string) => void;
  onChange: (id: string, updates: Partial<BulkCard>) => void;
}

function BulkCard({ card, onRemove, onActivate, onSkip, onChange }: BulkCardProps) {
  const [expanded, setExpanded] = useState(false);

  const inputCls = "w-full px-2.5 py-1.5 text-xs border border-[#ffb3d1] rounded-lg bg-[#fff9f5] text-[#4a2c3e] outline-none focus:ring-1 focus:ring-[#ff6b9d]/40 focus:border-[#ff6b9d] transition placeholder:text-[#4a2c3e]/25";

  const confidencePct = Math.round((card.confidence ?? 0) * 100);
  const confColor = card.confidence != null
    ? card.confidence >= 0.8 ? 'bg-emerald-400' : card.confidence >= 0.6 ? 'bg-amber-400' : 'bg-red-400'
    : 'bg-gray-200';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      card.status === 'activated' ? 'border-emerald-200 opacity-60' :
      card.status === 'skipped'   ? 'border-gray-200 opacity-40' :
      card.status === 'error'     ? 'border-red-200' :
      'border-[#ffb3d1]/60'
    }`}>
      {/* Image + status overlay */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.preview} alt="" className="w-full aspect-square object-cover" />

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          {card.status === 'queued' && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-black/40 text-white rounded-full backdrop-blur-sm">Queued</span>
          )}
          {card.status === 'processing' && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#ff6b9d]/90 text-white rounded-full">
              <Loader2 size={9} className="animate-spin" /> Processing
            </span>
          )}
          {card.status === 'done' && card.confidence != null && (
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${
              card.confidence >= 0.8 ? 'bg-emerald-500/90 text-white' : 'bg-amber-400/90 text-white'
            }`}>
              {confidencePct}%
            </span>
          )}
          {card.status === 'activated' && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500/90 text-white rounded-full">
              <CheckCircle size={9} /> Active
            </span>
          )}
          {card.status === 'error' && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-500/90 text-white rounded-full">
              <AlertCircle size={9} /> Error
            </span>
          )}
          {card.status === 'skipped' && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gray-500/70 text-white rounded-full">Skipped</span>
          )}
        </div>

        {/* Remove button — only when queued */}
        {card.status === 'queued' && (
          <button
            onClick={() => onRemove(card.localId)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Queued: just filename */}
        {card.status === 'queued' && (
          <p className="text-xs text-[#4a2c3e]/40 truncate font-medium">{card.file.name}</p>
        )}

        {/* Processing: spinner */}
        {card.status === 'processing' && (
          <div className="flex items-center justify-center py-3">
            <Loader2 size={18} className="animate-spin text-[#ff6b9d]" />
          </div>
        )}

        {/* Error */}
        {card.status === 'error' && (
          <p className="text-xs text-red-500">{card.error}</p>
        )}

        {/* Done / Activated — show extracted fields */}
        {(card.status === 'done' || card.status === 'activated') && (
          <>
            {/* Confidence bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#fff0f5] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${confColor}`} style={{ width: `${confidencePct}%` }} />
              </div>
              <span className="text-[10px] text-[#4a2c3e]/40 font-medium tabular-nums w-7 text-right">{confidencePct}%</span>
            </div>

            {/* Name */}
            <input
              value={card.name ?? ''}
              onChange={e => onChange(card.localId, { name: e.target.value })}
              disabled={card.status === 'activated'}
              placeholder="Item name"
              className={`${inputCls} font-semibold`}
            />

            {/* Category */}
            <select
              value={card.category ?? ''}
              onChange={e => onChange(card.localId, { category: e.target.value })}
              disabled={card.status === 'activated'}
              className={`${inputCls} capitalize`}
            >
              <option value="">Category…</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>

            {/* Expanded: extra fields */}
            {expanded && (
              <div className="space-y-2 pt-1 border-t border-[#ffb3d1]/30">
                <input
                  value={card.purchaseLink ?? ''}
                  onChange={e => onChange(card.localId, { purchaseLink: e.target.value })}
                  disabled={card.status === 'activated'}
                  placeholder="Purchase link (URL)"
                  className={inputCls}
                />
                <input
                  type="number"
                  value={card.price ?? ''}
                  onChange={e => onChange(card.localId, { price: e.target.value })}
                  disabled={card.status === 'activated'}
                  placeholder="Price (INR)"
                  className={inputCls}
                />
                {card.brand && (
                  <input
                    value={card.brand ?? ''}
                    onChange={e => onChange(card.localId, { brand: e.target.value })}
                    disabled={card.status === 'activated'}
                    placeholder="Brand"
                    className={inputCls}
                  />
                )}
              </div>
            )}

            {/* Toggle expand */}
            {card.status !== 'activated' && (
              <button
                onClick={() => setExpanded(p => !p)}
                className="flex items-center gap-1 text-[10px] text-[#4a2c3e]/35 hover:text-[#ff6b9d] transition-colors"
              >
                <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Less' : 'Link / price / brand'}
              </button>
            )}

            {/* Actions */}
            {card.status === 'done' && (
              <div className="flex gap-1.5 pt-0.5">
                <button
                  onClick={() => onActivate(card.localId)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold bg-[#ff6b9d] hover:bg-[#e85a8a] text-white rounded-lg transition-colors"
                >
                  <CheckCircle size={11} /> Activate
                </button>
                <button
                  onClick={() => onSkip(card.localId)}
                  className="px-3 py-1.5 text-xs font-semibold border border-[#ffb3d1] text-[#4a2c3e]/50 rounded-lg hover:bg-[#fff0f5] transition-colors"
                  title="Skip"
                >
                  <SkipForward size={11} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
