'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { WORKSPACE_CATEGORIES, WORKSPACE_STAGE_LABELS, WORKSPACE_VIEWS, isOverdue, queryWorkspaceItems, workspaceNextAction, type WorkspaceQueueItem } from '@/lib/stylistWorkspaceQueueModel';

const C = { ink: '#2C2622', muted: '#655E57', card: '#EDE5D2', bg: '#F4EFE5', surface: '#FBF8F2', border: 'rgba(44,38,34,.12)', gold: '#9A7538', danger: '#9A4039' };
const STAGE_STYLE: Record<string, { bg: string; fg: string }> = {
  needs_attention: { bg: '#F6E3DF', fg: '#9A4039' }, ready_to_deliver: { bg: '#E3EDE3', fg: '#426B4E' },
  ready: { bg: '#F1E6CF', fg: '#7A5A26' }, needs_review: { bg: '#E2E8EA', fg: '#3F5860' },
  generating: { bg: '#E2E8EA', fg: '#3F5860' }, needs_inputs: { bg: '#EDE5D2', fg: '#655E57' }, delivered: { bg: 'transparent', fg: '#655E57' },
};
// Delivered, stale and browse-everything lists are for looking things up, so they use compact rows.
const ROW_VIEWS = new Set(['delivered', 'stale', 'all', 'recent', 'forms', 'photos', 'today']);
type Stylist = { id: string; name: string; slug: string | null; is_active: boolean; workspace_enabled: boolean; clients: number; forms: number; photos: number };
type Result = { snapshotItems?: WorkspaceQueueItem[]; items: WorkspaceQueueItem[]; counts: Record<string, number>; total: number; page: number; limit: number; stylists?: Stylist[]; unassigned?: number; stylist?: { name: string; slug: string } };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
}
function daysOverdue(item: WorkspaceQueueItem) {
  return Math.max(1, Math.floor((Date.now() - Date.parse(item.reportDueAt!)) / 86_400_000));
}
function waitingFor(item: WorkspaceQueueItem) {
  const photos = Object.entries(item.readiness.photos).filter(([key, present]) => key !== 'one_outfit' && !present).length;
  const measurements = Object.values(item.readiness.measurements).filter(present => !present).length;
  const parts = [!item.formCompleted && 'the form', photos && `${photos} photo${photos > 1 ? 's' : ''}`, measurements && `${measurements} measurement${measurements > 1 ? 's' : ''}`].filter(Boolean);
  return parts.length ? `Waiting for ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]}` : '';
}
function StagePill({ item }: { item: WorkspaceQueueItem }) {
  const style = STAGE_STYLE[item.bucket] ?? STAGE_STYLE.needs_inputs;
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] luxury-body font-medium whitespace-nowrap" style={{ background: style.bg, color: style.fg, border: item.bucket === 'delivered' ? `1px solid ${C.border}` : undefined }}>
    {item.bucket === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" />}
    {WORKSPACE_STAGE_LABELS[item.bucket] ?? item.bucket}
  </span>;
}
function DueLabel({ item }: { item: WorkspaceQueueItem }) {
  if (!item.reportDueAt || item.bucket === 'delivered') return null;
  if (isOverdue(item)) {
    const days = daysOverdue(item);
    return <span className="inline-flex items-center gap-1 luxury-body text-xs font-medium whitespace-nowrap" style={{ color: C.danger }}><AlertTriangle size={13} aria-hidden="true" /> Overdue {days} day{days > 1 ? 's' : ''}</span>;
  }
  return <span className="luxury-body text-xs whitespace-nowrap" style={{ color: C.muted }}>Due {dateLabel(item.reportDueAt)}</span>;
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
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / 24));
  const counts = result?.counts ?? {};
  const asRows = ROW_VIEWS.has(view);
  const selectTab = (bucket: string) => updateParams({ bucket, page: '' });
  const links = (item: WorkspaceQueueItem) => {
    const detailUrl = admin ? `/stylist/admin/workspace/consultations/${item.id}` : `/stylist/${stylistSlug}/consultations/${item.id}`;
    const reportUrl = item.report ? admin ? `/stylist/admin/report/${item.report.id}` : `/stylist/${stylistSlug}/reports/${item.report.id}` : null;
    const nextAction = workspaceNextAction(item);
    return { detailUrl, nextAction, primaryUrl: nextAction.target === 'report' && reportUrl ? reportUrl : detailUrl };
  };
  const stylistName = (item: WorkspaceQueueItem) => admin ? staff.find(person => person.id === item.stylistId)?.name || 'Unassigned' : null;

  return <div className="max-w-[1400px] mx-auto" style={{ color: C.ink }}>
    <header className="flex flex-wrap items-end justify-between gap-2 mb-5">
      <div>
        <p className="iconik-micro" style={{ color: C.muted }}>{admin ? 'Team studio' : 'Stylist workspace'}</p>
        <h1 className="iconik-display text-3xl mt-1">{admin ? 'All stylists’ clients' : 'Your clients'}</h1>
      </div>
      <p role="status" aria-live="polite" className="luxury-body text-xs" style={{ color: C.muted }}>{busy ? 'Updating…' : updated ? `Updated ${new Date(updated).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}</p>
    </header>

    {admin && <section aria-label="Stylists" className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="luxury-body font-medium text-sm mr-auto flex items-center gap-2"><Users size={16} /> Your team {staff.length > 0 && `(${staff.length})`}</h2>
        <button onClick={() => updateParams({ stylist: '', page: '' })} aria-pressed={!selectedStylist} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: !selectedStylist ? C.ink : C.card, color: !selectedStylist ? C.bg : C.ink }}>All stylists</button>
        <button onClick={() => updateParams({ stylist: 'unassigned', page: '' })} aria-pressed={selectedStylist === 'unassigned'} className="rounded-full px-4 py-2 text-xs luxury-body" style={{ background: selectedStylist === 'unassigned' ? C.ink : C.card, color: selectedStylist === 'unassigned' ? C.bg : C.ink }}>Unassigned ({result?.unassigned ?? '—'})</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {staff.map(stylist => <article key={stylist.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${selectedStylist === stylist.id ? C.ink : C.border}`, background: selectedStylist === stylist.id ? C.ink : C.card, color: selectedStylist === stylist.id ? C.bg : C.ink }}>
          <button onClick={() => updateParams({ stylist: stylist.id, page: '' })} aria-pressed={selectedStylist === stylist.id} className="w-full p-4 text-left"><span className="luxury-body text-sm font-semibold">{stylist.name}</span><span className="block luxury-body text-[11px] mt-1 opacity-75">{!stylist.is_active ? 'Inactive' : stylist.workspace_enabled ? 'Workspace active' : 'Workspace not enabled'}</span><span className="block luxury-body text-xs mt-3">{stylist.clients} clients · {stylist.photos} with photos</span></button>
          {stylist.workspace_enabled && stylist.slug && <Link href={`/stylist/${stylist.slug}/dashboard`} className="flex items-center justify-between gap-2 px-4 py-3 border-t border-current/10 luxury-body text-xs">Open workspace <ArrowRight size={13} /></Link>}
        </article>)}
        {!result && Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 rounded-2xl animate-pulse" style={{ background: C.card }} />)}
      </div>
    </section>}

    <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
      <div role="tablist" aria-label="Client lists" className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: C.card }}>
        {WORKSPACE_CATEGORIES.map(({ key, label }) => {
          const active = category.key === key;
          return <button key={key} role="tab" aria-selected={active} onClick={() => selectTab(key)} className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm luxury-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A7538]" style={{ background: active ? C.ink : 'transparent', color: active ? C.bg : C.ink }}>
            {label}
            <span className="text-xs tabular-nums" style={{ opacity: active ? 0.75 : 0.65 }}>{counts[key] ?? '—'}</span>
            {key === 'reports' && (counts.needs_attention > 0 || counts.overdue > 0) && <span className="w-2 h-2 rounded-full" style={{ background: C.danger }} aria-label="Has urgent work" />}
          </button>;
        })}
      </div>
      <div className="relative flex-1 lg:max-w-sm lg:ml-auto">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2" style={{ color: C.muted }} aria-hidden="true" />
        <input aria-label="Search client or phone" value={search} onChange={event => { setSearch(event.target.value); updateParams({ search: event.target.value, page: '' }, true); }} placeholder="Search name or phone" className="w-full rounded-xl py-2.5 pl-11 pr-4 text-sm luxury-body outline-none focus:ring-2 focus:ring-[#9A7538]" style={{ background: C.surface, border: `1px solid ${C.border}` }} />
      </div>
    </div>

    {admin && category.views.length > 1 && <label className="flex items-center gap-2 mb-4 luxury-body text-xs" style={{ color: C.muted }}>
      Show
      <select value={view} onChange={event => selectTab(event.target.value)} className="rounded-lg py-1.5 pl-2 pr-7 text-xs outline-none focus:ring-2 focus:ring-[#9A7538]" style={{ color: C.ink, background: C.surface, border: `1px solid ${C.border}` }}>
        {category.views.filter(key => key !== 'needs_inputs').map(key => <option key={key} value={key}>{WORKSPACE_VIEWS.find(item => item.key === key)?.label} ({counts[key] ?? '—'})</option>)}
      </select>
    </label>}

    {category.key !== 'reports' && counts.overdue > 0 && <button onClick={() => selectTab('reports')} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 text-left luxury-body text-sm" style={{ background: '#F6E3DF', color: C.danger }}>
      <AlertTriangle size={16} aria-hidden="true" /><span className="flex-1">{counts.overdue} report{counts.overdue > 1 ? 's are' : ' is'} overdue</span><span className="inline-flex items-center gap-1 font-medium">Open To do <ArrowRight size={14} /></span>
    </button>}

    {view === 'stale' && <div className="flex flex-wrap items-center justify-between gap-2 mb-4 luxury-body text-sm">
      <p style={{ color: C.muted }}>Clients who haven’t sent photos or measurements in over 30 days since their consultation.</p>
      <button onClick={() => selectTab('waiting')} className="inline-flex items-center gap-1 underline"><ChevronLeft size={14} /> Recent clients</button>
    </div>}

    {error && <div role="alert" className="rounded-xl p-4 mb-4 text-sm luxury-body" style={{ color: C.danger, background: '#F6E3DF' }}>{error} <button onClick={() => setRefresh(value => value + 1)} className="underline ml-2">Retry</button></div>}

    {!result && busy && <div aria-hidden="true" className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-2xl h-44 animate-pulse" style={{ background: C.card }} />)}</div>}

    {result && result.items.length > 0 && (asRows
      ? <section aria-label="Clients" aria-busy={busy} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {result.items.map((item, index) => {
          const { primaryUrl, nextAction } = links(item);
          return <Link key={item.id} prefetch={false} href={primaryUrl} className="group grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_140px_180px_140px_150px] items-center gap-x-4 gap-y-1 px-4 md:px-5 py-3.5 hover:bg-[#F4EFE5] transition-colors" style={{ borderTop: index ? `1px solid ${C.border}` : undefined }}>
            <div className="min-w-0">
              <p className="luxury-body text-sm font-medium truncate" title={item.clientName}>{item.clientName || 'Unnamed client'}</p>
              <p className="luxury-body text-xs truncate" style={{ color: C.muted }}>{[stylistName(item), item.clientPhone].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="justify-self-end md:justify-self-start"><StagePill item={item} /></div>
            <p className="col-span-2 md:col-span-1 luxury-body text-xs whitespace-nowrap" style={{ color: C.muted }}>Consultation {dateLabel(item.consultationDate)}</p>
            <div className="hidden md:block"><DueLabel item={item} /></div>
            <span className="hidden md:inline-flex justify-end items-center gap-1 luxury-body text-xs font-medium whitespace-nowrap group-hover:underline">{nextAction.label} <ArrowRight size={13} /></span>
          </Link>;
        })}
      </section>
      : <section aria-label="Clients" aria-busy={busy} className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {result.items.map(item => {
          const { detailUrl, primaryUrl, nextAction } = links(item);
          const overdue = isOverdue(item);
          const note = item.bucket === 'needs_inputs' ? waitingFor(item) : item.bucket === 'generating' ? 'Being prepared. You can work on another client meanwhile.' : '';
          return <article key={item.id} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: C.surface, border: `1px solid ${overdue || item.bucket === 'needs_attention' ? 'rgba(154,64,57,.45)' : C.border}` }}>
            <div className="flex items-center justify-between gap-3"><StagePill item={item} /><DueLabel item={item} /></div>
            <div className="min-w-0">
              <h2 className="iconik-display text-xl leading-snug line-clamp-2 break-words" title={item.clientName}><Link prefetch={false} href={detailUrl} className="hover:underline">{item.clientName || 'Unnamed client'}</Link></h2>
              <p className="luxury-body text-xs mt-1" style={{ color: C.muted }}>{[stylistName(item), `Consultation ${dateLabel(item.consultationDate)}`, item.clientPhone].filter(Boolean).join(' · ')}</p>
            </div>
            {item.report?.errorMessage && <p className="luxury-body text-xs line-clamp-2" style={{ color: C.danger }}>{item.report.errorMessage}</p>}
            {note && <p className="luxury-body text-xs" style={{ color: C.muted }}>{note}</p>}
            <div className="flex items-center gap-4 mt-auto pt-1">
              <Link prefetch={false} href={primaryUrl} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl luxury-body text-sm" style={{ background: C.ink, color: C.bg }}>{nextAction.label}<ArrowRight size={14} /></Link>
              {primaryUrl !== detailUrl && <Link prefetch={false} href={detailUrl} className="luxury-body text-xs underline underline-offset-4" style={{ color: C.muted }}>Client details</Link>}
            </div>
          </article>;
        })}
      </section>)}

    {view === 'waiting' && result && counts.stale > 0 && !debouncedSearch && page >= totalPages && <button onClick={() => selectTab('stale')} className="w-full mt-3 flex items-center justify-between gap-3 rounded-2xl px-5 py-4 luxury-body text-sm text-left" style={{ border: `1px dashed ${C.border}`, color: C.muted }}>
      <span>{counts.stale} older client{counts.stale > 1 ? 's' : ''} haven’t sent inputs in over 30 days</span><span className="inline-flex items-center gap-1 font-medium" style={{ color: C.ink }}>Show <ArrowRight size={14} /></span>
    </button>}

    {!busy && result && result.items.length === 0 && <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {debouncedSearch
        ? <><p className="iconik-display text-2xl">No clients match “{debouncedSearch}”</p><p className="luxury-body text-sm mt-2" style={{ color: C.muted }}>Search looks inside the current tab only.</p><button onClick={() => { setSearch(''); updateParams({ search: '', bucket: 'all', page: '' }); }} className="underline text-sm luxury-body mt-4">Search all clients</button></>
        : category.key === 'reports'
          ? <><p className="iconik-display text-2xl">You’re all caught up</p><p className="luxury-body text-sm mt-2" style={{ color: C.muted }}>No reports need you right now.{counts.waiting ? ` ${counts.waiting} client${counts.waiting > 1 ? 's are' : ' is'} still sending photos or measurements.` : ''}</p></>
          : <p className="iconik-display text-2xl">{category.key === 'waiting' ? 'No recent clients are waiting' : 'No clients here yet'}</p>}
    </div>}

    {result && totalPages > 1 && <div className="flex items-center justify-between gap-4 mt-5 luxury-body text-sm">
      <p style={{ color: C.muted }}>Page {page} of {totalPages} · {result.total} clients</p>
      <div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || busy} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronLeft size={18} /></button><button aria-label="Next page" disabled={page >= totalPages || busy} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-xl px-4 py-2 disabled:opacity-30" style={{ border: `1px solid ${C.border}` }}><ChevronRight size={18} /></button></div>
    </div>}
  </div>;
}
