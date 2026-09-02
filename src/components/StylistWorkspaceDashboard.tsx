'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, ImageIcon, RefreshCw, Search, Users } from 'lucide-react';
import { WORKSPACE_VIEWS, type WorkspaceQueueItem } from '@/lib/stylistWorkspaceQueueModel';

const C = { ink: '#2C2622', muted: '#746D65', card: '#EDE5D2', bg: '#F4EFE5', border: 'rgba(44,38,34,.12)', gold: '#9A7538', success: '#426B4E' };
type Stylist = { id: string; name: string; slug: string | null; is_active: boolean; workspace_enabled: boolean; clients: number; forms: number; photos: number };
type Result = { items: WorkspaceQueueItem[]; counts: Record<string, number>; total: number; page: number; limit: number; stylists?: Stylist[]; unassigned?: number; stylist?: { name: string; slug: string } };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
}
function statusLabel(item: WorkspaceQueueItem) {
  if (item.report) return (item.report.progressStage || item.report.status).replace(/_/g, ' ');
  if (item.consultationStatus === 'delivered') return 'Delivered outside studio';
  return item.readiness.ready ? 'Ready to generate' : 'Awaiting inputs';
}

export default function StylistWorkspaceDashboard({ admin = false, stylistSlug }: { admin?: boolean; stylistSlug?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const requestedView = params.get('bucket') || (admin ? 'photos' : 'recent');
  const view = WORKSPACE_VIEWS.some(item => item.key === requestedView) ? requestedView : 'recent';
  const selectedStylist = admin ? params.get('stylist') || '' : '';
  const parsedPage = Number(params.get('page') || 1);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;
  const [search, setSearch] = useState(params.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [updated, setUpdated] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lastRefresh = useRef(0);
  const sequence = useRef(0);
  const urlSearch = params.get('search') || '';

  function updateParams(changes: Record<string, string>, replace = false) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const url = `${pathname}${next.size ? `?${next}` : ''}`;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }

  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);
  useEffect(() => {
    const timeout = setTimeout(() => { setDebouncedSearch(search); }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const requestId = ++sequence.current;
    const fresh = refresh !== lastRefresh.current;
    lastRefresh.current = refresh;
    setBusy(true); setError('');
    const query = new URLSearchParams({ bucket: view, page: String(page), limit: '24' });
    if (debouncedSearch) query.set('search', debouncedSearch);
    if (selectedStylist) query.set('stylist', selectedStylist);
    if (fresh) query.set('fresh', '1');
    const endpoint = admin ? '/api/stylist-workspace/admin/overview' : '/api/stylist-workspace/queue';
    void (async () => {
      try {
        const response = await fetch(`${endpoint}?${query}`, { cache: 'no-store', signal: abort.signal });
        if (response.status === 401) {
          window.location.href = `${admin ? '/stylist/admin/login' : '/stylist/login'}?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load clients');
        if (sequence.current === requestId) { setResult(data); setUpdated(Date.now()); }
      } catch (caught) {
        if (!abort.signal.aborted && sequence.current === requestId) setError(caught instanceof Error ? caught.message : 'Could not load clients');
      } finally {
        if (!abort.signal.aborted && sequence.current === requestId) setBusy(false);
      }
    })();
    return () => abort.abort();
  }, [admin, stylistSlug, view, page, selectedStylist, debouncedSearch, refresh]);

  const generating = Boolean(result?.counts.generating);
  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !busy) setRefresh(value => value + 1);
    }, 20000);
    return () => clearInterval(timer);
  }, [generating, busy]);

  const staff = result?.stylists ?? [];
  const selectedName = staff.find(stylist => stylist.id === selectedStylist)?.name;
  const title = admin ? 'Stylist report studio' : `${result?.stylist?.name || 'Your'} report studio`;
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / 24));
  const activeLabel = WORKSPACE_VIEWS.find(item => item.key === view)?.label;

  return <div className="max-w-[1550px] mx-auto" style={{ color: C.ink }}>
    <div className="flex flex-wrap items-start justify-between gap-5 mb-7">
      <div>
        <p className="iconik-micro mb-2" style={{ color: C.gold }}>ICONIK WOMEN · {admin ? 'ADMIN' : 'CONSULTATIONS'}</p>
        <h1 className="iconik-display text-3xl md:text-4xl">{title}</h1>
        <p className="luxury-body text-sm mt-3 max-w-2xl" style={{ color: C.muted }}>{admin ? 'Find a client across your team, check their form and photos, and open their report workspace.' : 'Your consultations, client inputs and reports, in one place.'}</p>
      </div>
      <button disabled={busy} onClick={() => setRefresh(value => value + 1)} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm luxury-body disabled:opacity-50" style={{ border: `1px solid ${C.border}`, background: C.card }}><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Refresh</button>
    </div>

    {admin && <section aria-label="Stylists" className="mb-7">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="luxury-body font-medium text-sm mr-auto flex items-center gap-2"><Users size={16} /> Your team {staff.length > 0 && `(${staff.length})`}</h2>
        <button onClick={() => updateParams({ stylist: '', page: '' })} aria-pressed={!selectedStylist} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: !selectedStylist ? C.ink : C.card, color: !selectedStylist ? C.bg : C.ink }}>All stylists</button>
        <button onClick={() => updateParams({ stylist: 'unassigned', page: '' })} aria-pressed={selectedStylist === 'unassigned'} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: selectedStylist === 'unassigned' ? C.ink : C.card, color: selectedStylist === 'unassigned' ? C.bg : C.ink }}>Unassigned ({result?.unassigned ?? '—'})</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {staff.map(stylist => <button key={stylist.id} onClick={() => updateParams({ stylist: stylist.id, page: '' })} aria-pressed={selectedStylist === stylist.id} className="rounded-2xl p-4 text-left transition-colors" style={{ border: `1px solid ${selectedStylist === stylist.id ? C.ink : C.border}`, background: selectedStylist === stylist.id ? C.ink : C.card, color: selectedStylist === stylist.id ? C.bg : C.ink }}>
          <span className="luxury-body text-sm font-semibold">{stylist.name}</span>
          <span className="block luxury-body text-[11px] mt-1 opacity-65">{!stylist.is_active ? 'Inactive' : stylist.workspace_enabled ? 'Pilot login enabled' : 'Pilot login not enabled'}</span>
          <span className="block luxury-body text-xs mt-4">{stylist.clients} clients · {stylist.photos} with photos</span>
        </button>)}
        {!result && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 rounded-2xl animate-pulse" style={{ background: C.card }} />)}
      </div>
    </section>}

    <div className="rounded-3xl p-4 md:p-5 mb-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex gap-2 flex-wrap" aria-label="Client filters">
        {WORKSPACE_VIEWS.map(({ key, label }) => <button key={key} onClick={() => updateParams({ bucket: key, page: '' })} aria-pressed={view === key} className="rounded-full px-3.5 py-2 text-xs luxury-body transition-colors" style={{ background: view === key ? C.ink : C.bg, color: view === key ? C.bg : C.muted }}>{label} <span className="ml-1.5 font-semibold">{result?.counts[key] ?? '—'}</span></button>)}
      </div>
      <div className="relative mt-4 max-w-lg">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2" style={{ color: C.muted }} />
        <input aria-label="Search client or phone" value={search} onChange={event => { setSearch(event.target.value); updateParams({ search: event.target.value, page: '' }, true); }} placeholder="Search client name or phone…" className="w-full rounded-xl py-3 pl-11 pr-4 text-sm luxury-body outline-none focus:ring-2 focus:ring-[#9A7538]" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
      </div>
    </div>

    <div className="flex flex-wrap justify-between gap-2 mb-4 luxury-body text-xs" style={{ color: C.muted }}>
      <p>{selectedName || (selectedStylist === 'unassigned' ? 'Unassigned clients' : admin ? 'All stylists' : result?.stylist?.name)} · {activeLabel} · {result?.total ?? '—'} clients</p>
      <p role="status" aria-live="polite">{busy ? 'Updating clients…' : updated ? `Updated ${new Date(updated).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}</p>
    </div>
    {view === 'recent' && <p className="luxury-body text-xs mb-4" style={{ color: C.muted }}>Past consultation dates with a filled form, newest first. Use All clients to include bookings awaiting a form.</p>}
    {view === 'photos' && <p className="luxury-body text-xs mb-4" style={{ color: C.muted }}>Includes clients with any saved photo, even if their report was already delivered manually.</p>}
    {error && <div role="alert" className="rounded-xl p-4 mb-4 text-sm luxury-body" style={{ color: '#9A4039', background: '#F8E8E3' }}>{error} <button onClick={() => setRefresh(value => value + 1)} className="underline ml-2">Retry</button></div>}

    <section aria-label="Client cards" aria-busy={busy} className={`grid md:grid-cols-2 2xl:grid-cols-3 gap-4 ${busy && result ? 'opacity-60' : ''}`}>
      {!result && busy && Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-3xl h-72 animate-pulse" style={{ background: C.card }} />)}
      {result?.items.map(item => {
        const stylist = staff.find(person => person.id === item.stylistId);
        const detailUrl = admin ? `/stylist/admin/workspace/consultations/${item.id}` : `/stylist/${stylistSlug}/consultations/${item.id}`;
        const reportUrl = item.report ? admin ? `/stylist/admin/report/${item.report.id}` : `/stylist/${stylistSlug}/reports/${item.report.id}` : null;
        return <article key={item.id} className="rounded-3xl p-5 flex flex-col" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="iconik-display text-xl break-words"><Link prefetch={false} href={detailUrl} className="hover:underline">{item.clientName || 'Unnamed client'}</Link></h2><p className="luxury-body text-xs mt-1.5" style={{ color: C.muted }}>{item.clientPhone || 'No phone recorded'}</p></div>
            <span className="rounded-full px-2.5 py-1 text-[10px] luxury-body whitespace-nowrap" style={{ background: C.card }}>{stylist?.name || (admin ? 'Unassigned' : result.stylist?.name)}</span>
          </div>
          <p className="flex items-center gap-2 luxury-body text-xs mt-5" style={{ color: C.muted }}><CalendarDays size={14} /> Consultation · {dateLabel(item.consultationDate)}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="rounded-xl p-3" style={{ background: C.card }}><p className="flex items-center gap-1.5 text-xs luxury-body"><FileText size={14} /> Form</p><p className="luxury-body text-xs mt-2 font-medium" style={{ color: item.formCompleted ? C.success : C.muted }}>{item.formCompleted ? 'Filled' : 'Not filled yet'}</p></div>
            <div className="rounded-xl p-3" style={{ background: C.card }}><p className="flex items-center gap-1.5 text-xs luxury-body"><ImageIcon size={14} /> Photos</p><p className="luxury-body text-xs mt-2 font-medium" style={{ color: item.photosSubmitted ? C.success : C.muted }}>{item.photoCount ? `${item.photoCount} received` : 'Awaiting photos'}</p></div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 luxury-body text-[11px]" style={{ color: C.muted }}>
            {([['headshot', 'Face'], ['full_body_front', 'Front'], ['full_body_side', 'Side']] as const).map(([key, label]) => <span key={key} className="inline-flex items-center gap-1">{item.readiness.photos[key] ? <Check size={12} style={{ color: C.success }} /> : <span aria-hidden="true">○</span>}{label}</span>)}
            <span>{Object.values(item.readiness.measurements).filter(Boolean).length}/4 measurements</span>
          </div>
          <div className="mt-4 mb-5"><p className="luxury-body text-xs capitalize font-medium">{statusLabel(item)}</p>{item.report?.errorMessage && <p className="luxury-body text-xs mt-1 text-red-700 line-clamp-2">{item.report.errorMessage}</p>}{!item.readiness.ready && <p className="luxury-body text-[11px] mt-1" style={{ color: C.muted }}>Missing: {item.readiness.missing.slice(0, 2).join(', ')}{item.readiness.missing.length > 2 ? ` +${item.readiness.missing.length - 2}` : ''}</p>}</div>
          <div className="flex gap-2 mt-auto"><Link prefetch={false} href={detailUrl} className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl luxury-body text-xs" style={{ background: C.ink, color: C.bg }}>{item.readiness.ready ? 'Review inputs & test' : 'Open client'}<ArrowRight size={14} /></Link>{reportUrl && <Link prefetch={false} href={reportUrl} className="inline-flex items-center rounded-xl px-3 luxury-body text-xs" style={{ border: `1px solid ${C.border}` }}>Report</Link>}</div>
        </article>;
      })}
    </section>
    {!busy && result && result.items.length === 0 && <div className="rounded-3xl p-12 text-center" style={{ background: C.card }}><ImageIcon className="mx-auto mb-4" style={{ color: C.muted }} /><p className="iconik-display text-2xl">No clients match this view</p><p className="luxury-body text-sm mt-2" style={{ color: C.muted }}>Try All clients, another stylist, or clear your search.</p><button onClick={() => { setSearch(''); updateParams({ search: '', bucket: 'all', page: '' }); }} className="underline text-sm luxury-body mt-4">Show all clients</button></div>}
    {result && result.total > 0 && <div className="flex items-center justify-between gap-4 mt-6 luxury-body text-sm">
      <p style={{ color: C.muted }}>Page {page} of {totalPages}</p>
      <div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || busy} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronLeft size={18} /></button><button aria-label="Next page" disabled={page >= totalPages || busy} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronRight size={18} /></button></div>
    </div>}
  </div>;
}
