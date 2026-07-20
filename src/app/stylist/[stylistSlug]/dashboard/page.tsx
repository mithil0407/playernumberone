'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock3, ImageIcon, Loader2,
  RefreshCw, Search, Send, Sparkles, UserRoundSearch,
} from 'lucide-react';

const C = { ink: '#2C2622', muted: 'rgba(44,38,34,.48)', card: '#EDE5D2', bg: '#F4EFE5', border: 'rgba(44,38,34,.10)', gold: '#C9A96E', slate: '#7E9098', success: '#5A8B6A', error: '#C4645A' };

type Bucket = 'today' | 'needs_inputs' | 'ready' | 'generating' | 'needs_review' | 'ready_to_deliver' | 'delivered' | 'needs_attention';
type QueueItem = {
  id: string;
  clientName: string;
  clientPhone: string;
  consultationDate: string | null;
  reportDueAt: string | null;
  deliveredAt: string | null;
  consultationStatus: string;
  updatedAt: string;
  bucket: Bucket;
  readiness: { ready: boolean; missing: string[]; photos: Record<string, boolean>; measurements: Record<string, boolean> };
  report: null | { id: string; status: string; progressStage: string | null; errorMessage: string | null; approvedCount: number; pageCount: number; imageDone: number; imageTotal: number; publishedAt: string | null; deliveredAt: string | null };
};

const BUCKETS: Array<{ key: Bucket; label: string; icon: React.ElementType }> = [
  { key: 'today', label: 'Today', icon: Clock3 },
  { key: 'needs_inputs', label: 'Needs Inputs', icon: ImageIcon },
  { key: 'ready', label: 'Ready to Generate', icon: Sparkles },
  { key: 'generating', label: 'Generating', icon: RefreshCw },
  { key: 'needs_review', label: 'Needs Review', icon: UserRoundSearch },
  { key: 'ready_to_deliver', label: 'Ready to Deliver', icon: Send },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  { key: 'needs_attention', label: 'Needs Attention', icon: AlertTriangle },
];

function dueLabel(date: string | null) {
  if (!date) return { text: 'No due date', tone: C.muted };
  const due = new Date(date);
  const deltaHours = Math.round((due.getTime() - Date.now()) / 3_600_000);
  if (deltaHours < 0) return { text: `${Math.abs(deltaHours)}h overdue`, tone: C.error };
  if (deltaHours < 24) return { text: `Due in ${deltaHours}h`, tone: C.gold };
  return { text: due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), tone: C.muted };
}

function primaryAction(item: QueueItem, slug: string) {
  if (item.report && ['draft_ready', 'in_review', 'approved', 'error', 'generating'].includes(item.report.status)) {
    return { href: `/stylist/${slug}/reports/${item.report.id}`, label: item.report.status === 'approved' ? 'Deliver report' : item.report.status === 'generating' ? 'View progress' : item.report.status === 'error' ? 'Resolve issue' : 'Review report' };
  }
  return { href: `/stylist/${slug}/consultations/${item.id}`, label: item.readiness.ready ? 'Review & generate' : item.bucket === 'delivered' ? 'View history' : 'Add inputs' };
}

export default function JazzDashboard() {
  const params = useParams<{ stylistSlug: string }>();
  const searchParams = useSearchParams();
  const [bucket, setBucket] = useState<Bucket>((searchParams.get('bucket') as Bucket) || 'today');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<{ items: QueueItem[]; counts: Record<string, number>; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const requested = searchParams.get('bucket') as Bucket | null;
    if (requested && BUCKETS.some(item => item.key === requested)) setBucket(requested);
  }, [searchParams]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    const query = new URLSearchParams({ bucket, ...(search.trim() ? { search: search.trim() } : {}) });
    try {
      const response = await fetch(`/api/stylist-workspace/queue?${query}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load queue');
      setData(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load queue');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bucket, search]);

  useEffect(() => { const timeout = setTimeout(() => void load(), 250); return () => clearTimeout(timeout); }, [load]);
  const hasGenerating = useMemo(() => Boolean(data?.counts.generating), [data]);
  useEffect(() => {
    if (!hasGenerating) return;
    const timer = setInterval(() => void load(true), 5000);
    return () => clearInterval(timer);
  }, [hasGenerating, load]);

  return (
    <div className="max-w-[1500px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-8">
        <div>
          <p className="iconik-micro mb-2" style={{ color: C.gold }}>JAZZ · INDIA CONSULTATIONS</p>
          <h1 className="iconik-display text-3xl md:text-4xl">Your report studio</h1>
          <p className="luxury-body text-sm mt-3 max-w-2xl" style={{ color: C.muted }}>Start with what is due, complete missing client inputs, and move every Blueprint confidently from generation to WhatsApp delivery.</p>
        </div>
        <button onClick={() => void load()} className="self-start flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm luxury-body" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
          <RefreshCw size={14} /> Refresh queue
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-7">
        {BUCKETS.map(({ key, label, icon: Icon }) => {
          const active = bucket === key;
          return (
            <button key={key} onClick={() => setBucket(key)} className="rounded-2xl p-4 text-left min-h-[104px] transition"
              style={{ background: active ? C.ink : C.card, color: active ? C.bg : C.ink, border: `1px solid ${active ? C.ink : C.border}` }}>
              <div className="flex items-center justify-between"><Icon size={16} style={{ opacity: .75 }} /><span className="iconik-display text-xl">{data?.counts[key] ?? 0}</span></div>
              <p className="iconik-micro mt-5 leading-4" style={{ opacity: active ? .76 : .48 }}>{label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search client or phone" className="w-full rounded-xl py-3 pl-11 pr-4 outline-none luxury-body text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }} />
        </div>
        <p className="luxury-body text-sm" style={{ color: C.muted }}>{data?.total ?? 0} consultation{data?.total === 1 ? '' : 's'} in this view</p>
      </div>

      {error && <div className="rounded-2xl p-4 mb-4 luxury-body text-sm" style={{ background: 'rgba(196,100,90,.10)', color: C.error }}>{error}</div>}
      <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
        {loading ? (
          <div className="h-64 flex items-center justify-center gap-2 luxury-body text-sm" style={{ color: C.muted }}><Loader2 size={18} className="animate-spin" /> Loading your queue…</div>
        ) : !data?.items.length ? (
          <div className="h-64 flex flex-col items-center justify-center text-center px-6"><CheckCircle2 size={28} style={{ color: C.success }} /><p className="iconik-display text-2xl mt-4">Nothing waiting here</p><p className="luxury-body text-sm mt-2" style={{ color: C.muted }}>Choose another queue to continue.</p></div>
        ) : data.items.map((item, index) => {
          const due = dueLabel(item.reportDueAt);
          const action = primaryAction(item, params.stylistSlug);
          return (
            <div key={item.id} className="grid lg:grid-cols-[1.25fr_.8fr_1fr_auto] gap-4 lg:items-center p-5 md:p-6" style={{ borderTop: index ? `1px solid ${C.border}` : undefined }}>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.bucket === 'needs_attention' ? C.error : item.bucket === 'delivered' ? C.success : item.bucket === 'generating' ? C.gold : C.slate }} />
                  <Link href={`/stylist/${params.stylistSlug}/consultations/${item.id}`} className="iconik-display text-xl truncate hover:underline">{item.clientName}</Link>
                </div>
                <p className="luxury-body text-sm mt-1.5 ml-5" style={{ color: C.muted }}>{item.clientPhone}</p>
              </div>
              <div>
                <p className="iconik-micro" style={{ color: C.muted }}>Deadline</p>
                <p className="luxury-body text-sm mt-1" style={{ color: due.tone }}>{due.text}</p>
              </div>
              <div>
                {item.report ? (
                  <><p className="iconik-micro capitalize" style={{ color: C.muted }}>{(item.report.progressStage || item.report.status).replace(/_/g, ' ')}</p><p className="luxury-body text-xs mt-1.5" style={{ color: C.muted }}>{item.report.pageCount ? `${item.report.approvedCount}/${item.report.pageCount} pages · ${item.report.imageDone}/${item.report.imageTotal} images` : 'Report generation underway'}</p></>
                ) : (
                  <><p className="iconik-micro" style={{ color: item.readiness.ready ? C.success : C.gold }}>{item.readiness.ready ? 'Inputs complete' : `${item.readiness.missing.length} inputs missing`}</p><p className="luxury-body text-xs mt-1.5 truncate" style={{ color: C.muted }}>{item.readiness.ready ? 'Ready for your review' : item.readiness.missing.slice(0, 2).join(' · ')}</p></>
                )}
              </div>
              <Link href={action.href} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm luxury-body whitespace-nowrap" style={{ background: C.ink, color: C.bg }}>
                {action.label} <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
