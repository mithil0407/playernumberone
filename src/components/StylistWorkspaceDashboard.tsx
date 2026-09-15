'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, ImageIcon, RefreshCw, Search, Users } from 'lucide-react';
import { WORKSPACE_CATEGORIES, WORKSPACE_VIEWS, queryWorkspaceItems, workspaceNextAction, type WorkspaceQueueItem } from '@/lib/stylistWorkspaceQueueModel';

const C = { ink: '#2C2622', muted: '#746D65', card: '#EDE5D2', bg: '#F4EFE5', border: 'rgba(44,38,34,.12)', gold: '#9A7538', success: '#426B4E' };
type Stylist = { id: string; name: string; slug: string | null; is_active: boolean; workspace_enabled: boolean; clients: number; forms: number; photos: number };
type Result = { snapshotItems?: WorkspaceQueueItem[]; items: WorkspaceQueueItem[]; counts: Record<string, number>; total: number; page: number; limit: number; stylists?: Stylist[]; unassigned?: number; stylist?: { name: string; slug: string } };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
}
function statusLabel(item: WorkspaceQueueItem) {
  if (item.report) return (item.report.progressStage || item.report.status).replace(/_/g, ' ');
  if (item.consultationStatus === 'delivered') return 'Delivered outside studio';
  return item.readiness.ready ? 'Ready to generate' : 'Awaiting inputs';
}

export default function StylistWorkspaceDashboard({ admin = false, stylistSlug, initialResult }: { admin?: boolean; stylistSlug?: string; initialResult?: Result }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const requestedView = params.get('bucket') || (admin ? 'all' : 'reports');
  const view = WORKSPACE_VIEWS.find(item => item.key === requestedView)?.key || 'all';
  const category = WORKSPACE_CATEGORIES.find(item => item.views.includes(view))!;
  const selectedStylist = admin ? params.get('stylist') || '' : '';
  const parsedPage = Number(params.get('page') || 1);
  const page = Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1;
  const [search, setSearch] = useState(params.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const scope = `${admin ? 'admin' : 'stylist'}:${stylistSlug || ''}`;
  const [loaded, setLoaded] = useState<{ scope: string; data: Result } | null>(() => initialResult ? { scope, data: initialResult } : null);
  const initialScope = useRef(initialResult ? scope : null);
  const source = loaded?.scope === scope ? loaded.data : null;
  const result = useMemo(() => {
    if (!source?.snapshotItems) return source;
    const visible = queryWorkspaceItems(source.snapshotItems, { view, search: debouncedSearch });
    return { ...source, items: visible.slice((page - 1) * 24, page * 24), total: visible.length, page, limit: 24 };
  }, [source, view, debouncedSearch, page]);
  const [busy, setBusy] = useState(!initialResult);
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

  // Only the admin's paginated endpoint depends on filters. A stylist loads
  // their own summary once; filtering and paging then happen immediately.
  const serverFilters = admin ? new URLSearchParams({ bucket: view, page: String(page), search: debouncedSearch, stylist: selectedStylist }).toString() : 'snapshot=1';
  useEffect(() => {
    if (!admin && initialScope.current === scope && refresh === 0) {
      setUpdated(Date.now());
      return;
    }
    initialScope.current = null;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const requestId = ++sequence.current;
    const fresh = refresh !== lastRefresh.current;
    lastRefresh.current = refresh;
    setBusy(true); setError('');
    const query = new URLSearchParams(serverFilters);
    query.set('limit', '24');
    if (stylistSlug) query.set('stylistSlug', stylistSlug);
    if (fresh) query.set('fresh', '1');
    const endpoint = admin ? '/api/stylist-workspace/admin/overview' : '/api/stylist-workspace/queue';
    const timeout = setTimeout(() => abort.abort(new Error('Request timed out. Please retry.')), 25000);
    void (async () => {
      try {
        const response = await fetch(`${endpoint}?${query}`, { cache: 'no-store', signal: abort.signal });
        if (response.status === 401) {
          window.location.href = `${admin ? '/stylist/admin/login' : '/stylist/login'}?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load clients');
        if (sequence.current === requestId) { setLoaded({ scope, data }); setUpdated(Date.now()); }
      } catch (caught) {
        if (sequence.current === requestId && (!abort.signal.aborted || abort.signal.reason?.message?.includes('timed out'))) setError(abort.signal.aborted ? 'The connection is taking too long. Please retry.' : caught instanceof Error ? caught.message : 'Could not load clients');
      } finally {
        clearTimeout(timeout);
        if (sequence.current === requestId) setBusy(false);
      }
    })();
    return () => { sequence.current = requestId + 1; clearTimeout(timeout); abort.abort(); };
  }, [admin, stylistSlug, scope, serverFilters, refresh]);

  const generating = Boolean(result?.counts.generating);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !busy) setRefresh(value => value + 1);
    }, generating ? 20000 : 60000);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !busy && updated && Date.now() - updated > 20000) setRefresh(value => value + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [generating, busy, updated]);

  const staff = result?.stylists ?? [];
  const selectedName = staff.find(stylist => stylist.id === selectedStylist)?.name;
  const title = admin ? 'The report studio' : 'Your report desk';
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / 24));
  const activeLabel = WORKSPACE_VIEWS.find(item => item.key === view)?.label;

  return <div className="max-w-[1550px] mx-auto" style={{ color: C.ink }}>
    <header className="relative overflow-hidden rounded-[28px] px-5 py-5 md:px-7 md:py-6 mb-4" style={{ background: C.ink, color: C.bg }}>
      <div className="absolute -right-12 -top-28 w-80 h-80 rounded-full border border-[#C9A96E]/20 pointer-events-none" aria-hidden="true" />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div><p className="iconik-micro text-[#C9A96E] mb-3">I C O N I K · {admin ? 'TEAM STUDIO' : `WELCOME${result?.stylist?.name ? `, ${result.stylist.name.toUpperCase()}` : ''}`}</p>
          <h1 className="iconik-display text-3xl md:text-4xl tracking-tight">{title}</h1>
          <p className="luxury-body text-sm leading-6 mt-2 max-w-2xl text-[#F4EFE5]/70">{admin ? 'A clear view of every stylist, every client, and the next report to finish.' : 'Thoughtful reports, one client at a time. Start with the work that needs you next.'}</p>
        </div>
        <button disabled={busy} onClick={() => setRefresh(value => value + 1)} className="inline-flex items-center gap-2 rounded-full border border-[#F4EFE5]/25 px-4 py-2.5 text-xs luxury-body disabled:opacity-50"><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh</button>
      </div>
      <div className="relative flex flex-wrap gap-x-6 gap-y-3 mt-4 pt-3 border-t border-[#F4EFE5]/15 luxury-body text-xs text-[#F4EFE5]/65">
        <span>01 · Client inputs</span><ArrowRight size={13} aria-hidden="true" /><span>02 · Review & edit</span><ArrowRight size={13} aria-hidden="true" /><span>03 · Images & delivery</span>
      </div>
    </header>
    {!admin && <section aria-label="Your work at a glance" className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      {([{ key: 'ready', label: 'Ready to start', note: 'Client inputs complete' }, { key: 'needs_review', label: 'In review', note: 'Continue where you left off' }, { key: 'ready_to_deliver', label: 'Ready to deliver', note: 'Finish the client handover' }, { key: 'needs_attention', label: 'Needs attention', note: 'Resolve an issue' }]).map(tile =>
        <button key={tile.key} onClick={() => updateParams({ bucket: tile.key, page: '' })} className="rounded-2xl p-4 text-left border transition hover:border-[#9A7538]" style={{ background: C.bg, borderColor: view === tile.key ? C.gold : C.border }}>
          <p className="luxury-body text-xs" style={{ color: C.muted }}>{tile.label}</p><p className="iconik-display text-3xl my-2">{result?.counts[tile.key] ?? '—'}</p><p className="luxury-body text-[11px]" style={{ color: C.muted }}>{tile.note}</p>
        </button>)}
    </section>}

    {admin && <section aria-label="Stylists" className="mb-7">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="luxury-body font-medium text-sm mr-auto flex items-center gap-2"><Users size={16} /> Your team {staff.length > 0 && `(${staff.length})`}</h2>
        <button onClick={() => updateParams({ stylist: '', page: '' })} aria-pressed={!selectedStylist} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: !selectedStylist ? C.ink : C.card, color: !selectedStylist ? C.bg : C.ink }}>All stylists</button>
        <button onClick={() => updateParams({ stylist: 'unassigned', page: '' })} aria-pressed={selectedStylist === 'unassigned'} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: selectedStylist === 'unassigned' ? C.ink : C.card, color: selectedStylist === 'unassigned' ? C.bg : C.ink }}>Unassigned ({result?.unassigned ?? '—'})</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {staff.map(stylist => <article key={stylist.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${selectedStylist === stylist.id ? C.ink : C.border}`, background: selectedStylist === stylist.id ? C.ink : C.card, color: selectedStylist === stylist.id ? C.bg : C.ink }}>
          <button onClick={() => updateParams({ stylist: stylist.id, page: '' })} aria-pressed={selectedStylist === stylist.id} className="w-full p-4 text-left"><span className="luxury-body text-sm font-semibold">{stylist.name}</span><span className="block luxury-body text-[11px] mt-1 opacity-65">{!stylist.is_active ? 'Inactive' : stylist.workspace_enabled ? 'Workspace active' : 'Workspace not enabled'}</span><span className="block luxury-body text-xs mt-3">{stylist.clients} clients · {stylist.photos} with photos</span></button>
          {stylist.workspace_enabled && stylist.slug && <Link href={`/stylist/${stylist.slug}/dashboard`} className="flex items-center justify-between gap-2 px-4 py-3 border-t border-current/10 luxury-body text-xs">Open workspace <ArrowRight size={13} /></Link>}
        </article>)}
        {!result && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 rounded-2xl animate-pulse" style={{ background: C.card }} />)}
      </div>
    </section>}

    <div className="rounded-3xl p-4 md:p-5 mb-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" aria-label="Client categories">
        {WORKSPACE_CATEGORIES.map(({ key, label }) => <button key={key} onClick={() => updateParams({ bucket: key, page: '' })} aria-pressed={category.key === key} className="flex items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-sm luxury-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A7538]" style={{ background: category.key === key ? C.ink : C.bg, color: category.key === key ? C.bg : C.muted }}><span>{label}</span><span className="text-xs font-semibold tabular-nums">{result?.counts[key] ?? '—'}</span></button>)}
      </div>
      <p className="luxury-body text-xs mt-4" style={{ color: C.muted }}>{category.description}</p>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-4">
        {category.views.length > 1 && <label className="block sm:w-60 shrink-0 luxury-body text-xs" style={{ color: C.muted }}>
          {category.key === 'reports' ? 'Report stage' : 'Client view'}
          <select value={view} onChange={event => updateParams({ bucket: event.target.value, page: '' })} className="block w-full mt-1.5 rounded-xl py-3 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-[#9A7538]" style={{ color: C.ink, background: C.bg, border: `1px solid ${C.border}` }}>
            {category.views.map(key => <option key={key} value={key}>{WORKSPACE_VIEWS.find(item => item.key === key)?.label} ({result?.counts[key] ?? '—'})</option>)}
          </select>
        </label>}
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2" style={{ color: C.muted }} />
          <input aria-label="Search client or phone" value={search} onChange={event => { setSearch(event.target.value); updateParams({ search: event.target.value, page: '' }, true); }} placeholder="Search client name or phone…" className="w-full rounded-xl py-3 pl-11 pr-4 text-sm luxury-body outline-none focus:ring-2 focus:ring-[#9A7538]" style={{ background: C.bg, border: `1px solid ${C.border}` }} />
        </div>
      </div>
    </div>

    <div className="flex flex-wrap justify-between gap-2 mb-4 luxury-body text-xs" style={{ color: C.muted }}>
      <p>{selectedName || (selectedStylist === 'unassigned' ? 'Unassigned clients' : admin ? 'All stylists' : result?.stylist?.name)} · {activeLabel} · {result?.total ?? '—'} clients</p>
      <p role="status" aria-live="polite">{busy ? 'Updating clients…' : updated ? `Updated ${new Date(updated).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}</p>
    </div>
    {view === 'recent' && <p className="luxury-body text-xs mb-4" style={{ color: C.muted }}>Past consultation dates with a filled form, newest first. Use All clients to include bookings awaiting a form.</p>}
    {view === 'photos' && <p className="luxury-body text-xs mb-4" style={{ color: C.muted }}>Includes clients with any saved photo, even if their report was already delivered manually.</p>}
    {error && <div role="alert" className="rounded-xl p-4 mb-4 text-sm luxury-body" style={{ color: '#9A4039', background: '#F8E8E3' }}>{error} <button onClick={() => setRefresh(value => value + 1)} className="underline ml-2">Retry</button></div>}

    <section aria-label="Client cards" aria-busy={busy} className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
      {!result && busy && Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-3xl h-72 animate-pulse" style={{ background: C.card }} />)}
      {result?.items.map(item => {
        const nextAction = workspaceNextAction(item);
        const overdue = item.bucket !== 'delivered' && Boolean(item.reportDueAt && Date.parse(item.reportDueAt) < Date.now());
        const stylist = staff.find(person => person.id === item.stylistId);
        const detailUrl = admin ? `/stylist/admin/workspace/consultations/${item.id}` : `/stylist/${stylistSlug}/consultations/${item.id}`;
        const reportUrl = item.report ? admin ? `/stylist/admin/report/${item.report.id}` : `/stylist/${stylistSlug}/reports/${item.report.id}` : null;
        const primaryUrl = nextAction.target === 'report' && reportUrl ? reportUrl : detailUrl;
        return <article key={item.id} className="rounded-2xl p-5 flex flex-col shadow-[0_2px_12px_rgba(44,38,34,0.03)]" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
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
          <div className="mt-4 mb-5">{item.reportDueAt && <p className="luxury-body text-xs mb-3" style={{ color: overdue ? '#9A4039' : C.gold }}>{overdue ? 'Overdue · ' : 'Due · '}{dateLabel(item.reportDueAt)}</p>}<p className="luxury-body text-xs capitalize font-medium">{statusLabel(item)}</p>{item.report?.errorMessage && <p className="luxury-body text-xs mt-1 text-red-700 line-clamp-2">{item.report.errorMessage}</p>}{!item.readiness.ready && <p className="luxury-body text-[11px] mt-1" style={{ color: C.muted }}>Missing: {item.readiness.missing.slice(0, 2).join(', ')}{item.readiness.missing.length > 2 ? ` +${item.readiness.missing.length - 2}` : ''}</p>}</div>
          <p className="luxury-body text-xs leading-5 mb-4" style={{ color: C.muted }}>{nextAction.hint}</p>
          <div className="flex gap-2 mt-auto"><Link prefetch={false} href={primaryUrl} className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl luxury-body text-sm" style={{ background: C.ink, color: C.bg }}>{nextAction.label}<ArrowRight size={14} /></Link>{primaryUrl !== detailUrl && <Link prefetch={false} href={detailUrl} className="inline-flex items-center rounded-xl px-3 luxury-body text-xs" style={{ border: `1px solid ${C.border}` }}>Client details</Link>}</div>
        </article>;
      })}
    </section>
    {!busy && result && result.items.length === 0 && <div className="rounded-3xl p-12 text-center" style={{ background: C.card }}><ImageIcon className="mx-auto mb-4" style={{ color: C.muted }} /><p className="iconik-display text-2xl">No clients match this view</p><p className="luxury-body text-sm mt-2" style={{ color: C.muted }}>{admin ? 'Try All clients, another stylist, or clear your search.' : 'Try All clients, check Awaiting inputs, or clear your search.'}</p><button onClick={() => { setSearch(''); updateParams({ search: '', bucket: 'all', page: '' }); }} className="underline text-sm luxury-body mt-4">Show all clients</button></div>}
    {result && result.total > 0 && <div className="flex items-center justify-between gap-4 mt-6 luxury-body text-sm">
      <p style={{ color: C.muted }}>Page {page} of {totalPages}</p>
      <div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || busy} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronLeft size={18} /></button><button aria-label="Next page" disabled={page >= totalPages || busy} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronRight size={18} /></button></div>
    </div>}
  </div>;
}
