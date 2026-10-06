'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, Check, ChevronLeft, MessageSquarePlus, RefreshCw, Search } from 'lucide-react';
import { REPORT_DUE_DAYS, WORKSPACE_CATEGORIES, WORKSPACE_STAGE_LABELS, WORKSPACE_VIEWS, firstDeliveredAt, isOverdue, lateLabel, queryWorkspaceItems, workspaceDue, workspaceNextAction, type DeliveryRecord, type WorkspaceQueueItem } from '@/lib/stylistWorkspaceQueueModel';
import StylistRevisionRequestDialog, { type RevisionCreated } from '@/components/StylistRevisionRequestDialog';
import { Avatar, Button, Pill, type PillTone } from '@/components/manAdmin/ui';

const STAGE_TONE: Record<string, PillTone> = {
  needs_attention: 'red', ready_to_deliver: 'green', ready: 'accent', needs_review: 'blue',
  generating: 'blue', needs_inputs: 'neutral', delivered: 'neutral', revision_requested: 'amber',
};
// Delivered, stale and browse-everything lists are for looking things up, so they use compact rows.
const ROW_VIEWS = new Set(['delivered', 'stale', 'all', 'recent', 'forms', 'photos', 'today']);
type Stylist = { id: string; name: string; slug: string | null; is_active: boolean; workspace_enabled: boolean; clients: number; forms: number; photos: number; delivery?: { onTime: number; late: number; overdue: number } };
type Result = { snapshotItems?: WorkspaceQueueItem[]; items: WorkspaceQueueItem[]; counts: Record<string, number>; deliveryRecord?: DeliveryRecord; total: number; page: number; limit: number; stylists?: Stylist[]; unassigned?: number; stylist?: { name: string; slug: string } };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
}
/**
 * A published report can be confirmed as delivered; anything earlier cannot.
 * Unpublished edits are not in the client's copy yet, so a report mid-revision
 * is not deliverable either — publishing it comes first.
 */
function canMarkDelivered(item: WorkspaceQueueItem) {
  return Boolean(item.report?.publishedAt) && !item.report?.hasUnpublishedChanges && item.bucket !== 'delivered';
}
/**
 * A client can only ask for changes to a report she already has. An open
 * revision does not hide the button: a second ask joins the same brief.
 */
function canRequestRevision(item: WorkspaceQueueItem) {
  return Boolean(item.report?.publishedAt);
}

function daysOverdue(item: WorkspaceQueueItem) {
  return Math.max(1, Math.floor((Date.now() - Date.parse(workspaceDue(item)!.at)) / 86_400_000));
}
function waitingFor(item: WorkspaceQueueItem) {
  const photos = Object.entries(item.readiness.photos).filter(([key, present]) => key !== 'one_outfit' && !present).length;
  const measurements = Object.values(item.readiness.measurements).filter(present => !present).length;
  const parts = [!item.formCompleted && 'the form', photos && `${photos} photo${photos > 1 ? 's' : ''}`, measurements && `${measurements} measurement${measurements > 1 ? 's' : ''}`].filter(Boolean);
  return parts.length ? `Waiting for ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]}` : '';
}
function StagePill({ item }: { item: WorkspaceQueueItem }) {
  return <Pill tone={STAGE_TONE[item.bucket] ?? 'neutral'} live={item.bucket === 'generating'} dot={item.bucket !== 'generating'}>
    {WORKSPACE_STAGE_LABELS[item.bucket] ?? item.bucket}
  </Pill>;
}
function DueLabel({ item }: { item: WorkspaceQueueItem }) {
  const due = workspaceDue(item);
  if (item.bucket === 'delivered') {
    const deliveredAt = firstDeliveredAt(item);
    const lateMs = deliveredAt && item.reportDueAt ? Date.parse(deliveredAt) - Date.parse(item.reportDueAt) : 0;
    return lateMs > 0 ? <Pill tone="red"><AlertTriangle size={12} aria-hidden="true" /> Sent {lateLabel(lateMs)} late</Pill> : null;
  }
  if (!due) return null;
  const what = due.kind === 'revision' ? 'Revision' : 'Report';
  if (isOverdue(item)) {
    const days = daysOverdue(item);
    return <Pill tone="red"><AlertTriangle size={12} aria-hidden="true" /> {what} overdue {days} day{days > 1 ? 's' : ''}</Pill>;
  }
  return <span className="ma-faint whitespace-nowrap text-[13px]">{due.kind === 'revision' ? 'Revision due' : 'Due'} {dateLabel(due.at)}</span>;
}

/**
 * The week's delivery record for the first version of each report. Late and
 * overdue reports are named one by one, because the point is that nobody's
 * lateness is hidden in a total — the ICONIK team sees the same list.
 */
function DeliveryRecordPanel({ record, clientUrl, stylistName }: { record: DeliveryRecord; clientUrl: (id: string) => string; stylistName: (id: string | null) => string | null }) {
  const [expanded, setExpanded] = useState(false);
  const missed = [...record.overdue.map(entry => ({ ...entry, open: true })), ...record.late.map(entry => ({ ...entry, open: false }))];
  const total = record.onTime + missed.length;
  if (!total) return null;
  if (!missed.length) return <section aria-label="Delivery record" className="mb-6 flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px]" style={{ background: 'var(--ma-green-soft)', color: 'var(--ma-green)', fontWeight: 500 }}>
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--ma-green)', color: '#fff' }}><Check size={14} aria-hidden="true" /></span>
    All {record.onTime} report{record.onTime > 1 ? 's' : ''} delivered on time in the last {record.days} days.
  </section>;
  const shown = expanded ? missed : missed.slice(0, 5);
  const summary = [
    record.overdue.length && `${record.overdue.length} overdue now`,
    record.late.length && `${record.late.length} sent late`,
    `${record.onTime} on time`,
  ].filter(Boolean).join(' · ');
  return <section aria-label="Delivery record" className="st-record mb-8">
    <div className="st-record__head">
      <span className="st-record__icon"><AlertTriangle size={18} aria-hidden="true" /></span>
      <div className="min-w-[200px] flex-1">
        <p className="text-[19px] leading-tight" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>{missed.length} of {total} report{total > 1 ? 's' : ''} missed the deadline</p>
        <p className="mt-1 text-[13px]" style={{ opacity: 0.85 }}>Last {record.days} days · {summary}</p>
      </div>
    </div>
    <div>
      {shown.map(entry => <Link key={entry.id} prefetch={false} href={clientUrl(entry.id)} className="ma-row st-record-row">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={entry.clientName || 'Client'} size={34} />
          <div className="min-w-0">
            <div className="truncate text-[15px]" style={{ fontWeight: 600 }}>{entry.clientName || 'Unnamed client'}</div>
            <div className="ma-faint truncate text-[13px]">{[stylistName(entry.stylistId), `Due ${dateLabel(entry.dueAt)}`].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <span className="justify-self-end md:justify-self-start"><Pill tone="red" dot>{entry.open ? `Overdue ${lateLabel(entry.lateMs)}` : `Sent ${lateLabel(entry.lateMs)} late`}</Pill></span>
        <span className="ma-faint col-span-2 text-[13px] md:col-span-1">{entry.open ? 'Not delivered yet' : `Delivered ${dateLabel(entry.deliveredAt)}`}</span>
        <ArrowRight size={14} className="ma-faint hidden md:block" aria-hidden="true" />
      </Link>)}
    </div>
    {missed.length > shown.length && <div className="px-5 py-2" style={{ borderTop: '1px solid var(--ma-line-2)' }}>
      <Button size="sm" variant="ghost" onClick={() => setExpanded(true)}>Show all {missed.length}</Button>
    </div>}
    <p className="ma-faint px-5 py-3.5 text-[13px]" style={{ borderTop: '1px solid var(--ma-line-2)', background: 'var(--ma-surface-2)' }}>
      Each report is due {REPORT_DUE_DAYS} days after the client’s inputs are complete. The clock stops when you press Mark delivered. This record is visible to the ICONIK team.
    </p>
  </section>;
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
  const [deliveringId, setDeliveringId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [revisionFor, setRevisionFor] = useState<WorkspaceQueueItem | null>(null);
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
    const timedOut = new Error('Request timed out. Please retry.');
    const timeout = setTimeout(() => abort.abort(timedOut), 25000);
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
        // An abort is this effect's own doing — a filter change, an unmount, or
        // StrictMode's double-invoke in dev. Only the timeout is worth showing;
        // treating the rest as failures surfaced "signal is aborted without
        // reason" on a dashboard that was loading perfectly well.
        if (sequence.current !== requestId) return;
        if (abort.signal.aborted) {
          if (abort.signal.reason === timedOut) setError('The connection is taking too long. Please retry.');
          return;
        }
        setError(caught instanceof Error ? caught.message : 'Could not load clients');
      } finally {
        clearTimeout(timeout);
        if (sequence.current === requestId) setBusy(false);
      }
    })();
    // Aborting with a reason keeps the rejection identifiable: a bare abort()
    // rejects with "signal is aborted without reason", which reads as a crash.
    return () => { sequence.current = requestId + 1; clearTimeout(timeout); abort.abort(new Error('Dashboard query superseded')); };
  }, [admin, stylistSlug, scope, serverFilters, refresh]);

  // Stylists send the link from WhatsApp in another tab and often never come
  // back to the report to confirm, so a published report can be marked
  // delivered from its card here.
  const markDelivered = async (item: WorkspaceQueueItem) => {
    if (!item.report || deliveringId) return;
    const name = item.clientName || 'this client';
    if (!window.confirm(`Mark ${name}'s report as delivered? Do this once you have sent them the link.`)) return;
    setDeliveringId(item.id);
    setDeliveryNote('');
    setError('');
    try {
      const response = await fetch(`/api/stylist-workspace/reports/${item.report.id}/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not mark this report as delivered');
      setDeliveryNote(`${name}'s report is marked delivered.`);
      setRefresh(value => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not mark this report as delivered');
    } finally {
      setDeliveringId('');
    }
  };

  // A revision is recorded against the report the client already has, and each
  // look she wants changed becomes a blank page there, ready to write.
  const revisionCreated = (item: WorkspaceQueueItem, result: RevisionCreated) => {
    if (result.open) {
      const base = admin ? `/stylist/admin/report/${item.report!.id}` : `/stylist/${stylistSlug}/reports/${item.report!.id}`;
      window.location.href = result.firstPage ? `${base}?page=${result.firstPage}` : base;
      return;
    }
    const added = result.addedLooks.length;
    setRevisionFor(null);
    setDeliveryNote(`Saved. ${item.clientName || 'This client'}'s revision is in your To do${added ? `, with ${added} new look${added > 1 ? 's' : ''} to write` : ''}.`);
    setRefresh(value => value + 1);
  };

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
  const firstName = result?.stylist?.name?.split(' ')[0];

  return <div style={{ color: 'var(--ma-ink)' }}>
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="ma-eyebrow mb-2">{admin ? 'Team studio' : firstName ? `Hi ${firstName}` : 'Stylist workspace'}</div>
        <h1 className="ma-title">{admin ? <>All stylists’ <em>clients</em></> : <>Your <em>clients</em></>}</h1>
        <p className="ma-muted mt-2 text-[15px]">
          {result ? <>
            {counts.reports ?? 0} to do
            {counts.overdue ? <> · <span style={{ color: 'var(--ma-red)', fontWeight: 600 }}>{counts.overdue} overdue</span></> : null}
            {counts.waiting ? <> · {counts.waiting} waiting on client</> : null}
          </> : ' '}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative block w-full sm:w-72">
          <Search size={15} className="ma-faint pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input aria-label="Search client or phone" value={search} onChange={event => { setSearch(event.target.value); updateParams({ search: event.target.value, page: '' }, true); }} placeholder="Search name or phone" className="ma-input" style={{ borderRadius: 999, paddingLeft: 40 }} />
        </label>
        <Button iconOnly icon={<RefreshCw size={15} className={busy ? 'animate-spin' : undefined} />} onClick={() => setRefresh(value => value + 1)} aria-label="Refresh" title={updated ? `Updated ${new Date(updated).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : 'Refresh'} />
      </div>
    </header>
    <p role="status" aria-live="polite" className="sr-only">{busy ? 'Updating…' : ''}</p>

    {!admin && result?.deliveryRecord && <DeliveryRecordPanel record={result.deliveryRecord} clientUrl={id => `/stylist/${stylistSlug}/consultations/${id}`} stylistName={() => null} />}

    {admin && <section aria-label="Stylists" className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="ma-h2 mr-auto">Your team {staff.length > 0 && <span className="ma-faint ma-num">{staff.length}</span>}</h2>
        <div className="ma-seg">
          <button type="button" onClick={() => updateParams({ stylist: '', page: '' })} aria-pressed={!selectedStylist}>All stylists</button>
          <button type="button" onClick={() => updateParams({ stylist: 'unassigned', page: '' })} aria-pressed={selectedStylist === 'unassigned'}>Unassigned <span className="ma-seg__count">{result?.unassigned ?? '—'}</span></button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {staff.map(stylist => {
          const selected = selectedStylist === stylist.id;
          const missed = stylist.delivery ? stylist.delivery.late + stylist.delivery.overdue : 0;
          return <article key={stylist.id} className="ma-card overflow-hidden" style={{ borderRadius: 20, borderColor: selected ? 'var(--ma-accent)' : undefined, boxShadow: selected ? '0 0 0 3px var(--ma-accent-soft)' : undefined }}>
            <button type="button" onClick={() => updateParams({ stylist: stylist.id, page: '' })} aria-pressed={selected} className="flex w-full items-start gap-3 p-4 text-left">
              <Avatar name={stylist.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]" style={{ fontWeight: 600 }}>{stylist.name}</span>
                <span className="ma-faint block text-[12px]">{!stylist.is_active ? 'Inactive' : stylist.workspace_enabled ? 'Workspace active' : 'Workspace not enabled'}</span>
                <span className="ma-muted ma-num mt-2 block text-[13px]">{stylist.clients} clients · {stylist.photos} with photos</span>
                {stylist.delivery && (missed > 0
                  ? <span className="mt-2 block"><Pill tone="red"><AlertTriangle size={12} aria-hidden="true" /> {[stylist.delivery.overdue && `${stylist.delivery.overdue} overdue`, stylist.delivery.late && `${stylist.delivery.late} late`].filter(Boolean).join(' · ')} this week</Pill></span>
                  : stylist.delivery.onTime > 0 && <span className="mt-2 block"><Pill tone="green" dot>{stylist.delivery.onTime} on time this week</Pill></span>)}
              </span>
            </button>
            {stylist.workspace_enabled && stylist.slug && <Link href={`/stylist/${stylist.slug}/dashboard`} className="flex items-center justify-between gap-2 px-4 py-3 text-[13px]" style={{ borderTop: '1px solid var(--ma-line-2)', fontWeight: 500 }}>Open workspace <ArrowRight size={13} /></Link>}
          </article>;
        })}
        {!result && Array.from({ length: 4 }, (_, index) => <div key={index} className="ma-skeleton h-32" style={{ borderRadius: 20 }} />)}
      </div>
    </section>}

    {admin && result?.deliveryRecord && <DeliveryRecordPanel record={result.deliveryRecord} clientUrl={id => `/stylist/admin/workspace/consultations/${id}`} stylistName={id => staff.find(person => person.id === id)?.name || 'Unassigned'} />}

    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="ma-seg" role="tablist" aria-label="Client lists">
        {WORKSPACE_CATEGORIES.map(({ key, label }) => {
          const active = category.key === key;
          const urgent = key === 'reports' && (counts.needs_attention > 0 || counts.overdue > 0);
          return <button key={key} type="button" role="tab" aria-selected={active} onClick={() => selectTab(key)}>
            {label}
            <span className="ma-seg__count" style={urgent ? { background: 'var(--ma-red)', color: '#fff' } : undefined}>{counts[key] ?? '—'}</span>
            {urgent && <span className="sr-only">Has urgent work</span>}
          </button>;
        })}
      </div>
      {admin && category.views.length > 1 && <label className="ml-auto flex items-center gap-2 text-[13px]">
        <span className="ma-faint">Show</span>
        <select value={view} onChange={event => selectTab(event.target.value)} className="ma-select" style={{ height: 34, borderRadius: 999, width: 'auto', paddingRight: 32 }}>
          {category.views.filter(key => key !== 'needs_inputs').map(key => <option key={key} value={key}>{WORKSPACE_VIEWS.find(item => item.key === key)?.label} ({counts[key] ?? '—'})</option>)}
        </select>
      </label>}
    </div>

    {view === 'stale' && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[14px]">
      <p className="ma-muted">Clients who haven’t sent photos or measurements in over 30 days since their consultation.</p>
      <Button size="sm" variant="ghost" icon={<ChevronLeft size={14} />} onClick={() => selectTab('waiting')}>Recent clients</Button>
    </div>}

    {error && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-[14px]" style={{ color: 'var(--ma-red)', background: 'var(--ma-red-soft)' }}>{error} <Button size="sm" variant="danger" onClick={() => setRefresh(value => value + 1)}>Retry</Button></div>}
    {deliveryNote && <p role="status" className="mb-4 rounded-2xl px-4 py-3 text-[14px]" style={{ color: 'var(--ma-green)', background: 'var(--ma-green-soft)', fontWeight: 500 }}>{deliveryNote}</p>}

    {!result && busy && <div aria-hidden="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="ma-skeleton h-48" style={{ borderRadius: 24 }} />)}</div>}

    {result && result.items.length > 0 && (asRows
      ? <section aria-label="Clients" aria-busy={busy} className="ma-card overflow-hidden" style={{ opacity: busy ? 0.7 : 1, transition: 'opacity .15s' }}>
        {result.items.map(item => {
          const { primaryUrl, nextAction } = links(item);
          return <Link key={item.id} prefetch={false} href={primaryUrl} className="group ma-row st-client-row">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={item.clientName || 'Client'} />
              <div className="min-w-0">
                <div className="truncate text-[15px]" style={{ fontWeight: 600 }} title={item.clientName}>{item.clientName || 'Unnamed client'}</div>
                <div className="ma-faint truncate text-[13px]">{[stylistName(item), item.clientPhone].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
            <div className="justify-self-end md:justify-self-start"><StagePill item={item} /></div>
            <div className="ma-faint hidden whitespace-nowrap text-[13px] md:block">Consultation {dateLabel(item.consultationDate)}</div>
            <div className="hidden md:block"><DueLabel item={item} /></div>
            {canRequestRevision(item)
              ? <button
                  type="button"
                  onClick={event => { event.preventDefault(); event.stopPropagation(); setRevisionFor(item); }}
                  title="The client wants some looks changed. Choose them and write the new versions."
                  className="ma-btn ma-btn--secondary ma-btn--sm hidden justify-self-end md:inline-flex"
                >
                  <MessageSquarePlus size={13} /> Revise report
                </button>
              : <span className="hidden items-center justify-end gap-1 whitespace-nowrap text-[13px] group-hover:underline md:inline-flex" style={{ fontWeight: 500 }}>{nextAction.label} <ArrowRight size={13} /></span>}
          </Link>;
        })}
      </section>
      : <section aria-label="Clients" aria-busy={busy} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" style={{ opacity: busy ? 0.7 : 1, transition: 'opacity .15s' }}>
        {result.items.map(item => {
          const { detailUrl, primaryUrl, nextAction } = links(item);
          const overdue = isOverdue(item);
          const revision = item.revision;
          const note = item.bucket === 'needs_inputs' ? waitingFor(item) : item.bucket === 'generating' ? 'Being prepared. You can work on another client meanwhile.' : '';
          return <article key={item.id} className="st-client-card" data-urgent={overdue || item.bucket === 'needs_attention'}>
            <div className="flex items-center justify-between gap-3"><StagePill item={item} /><DueLabel item={item} /></div>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={item.clientName || 'Client'} size={42} />
              <div className="min-w-0">
                <h2 className="line-clamp-2 break-words text-[17px] leading-snug" style={{ fontWeight: 600, letterSpacing: '-0.015em' }} title={item.clientName}><Link prefetch={false} href={detailUrl} className="hover:underline">{item.clientName || 'Unnamed client'}</Link></h2>
                <p className="ma-faint mt-0.5 text-[13px]">{[stylistName(item), `Consultation ${dateLabel(item.consultationDate)}`, item.clientPhone].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            {item.report?.errorMessage && <p className="line-clamp-2 text-[13px]" style={{ color: 'var(--ma-red)' }}>{item.report.errorMessage}</p>}
            {revision && <div className="rounded-2xl px-3.5 py-3" style={{ background: 'var(--ma-amber-soft)' }}>
              <p className="text-[13px] leading-5">
                “{revision.changes[0] ?? 'Changes requested'}”
                {revision.changes.length > 1 && <span className="ma-faint"> +{revision.changes.length - 1} more</span>}
              </p>
              {revision.total > 0 && <p className="ma-faint mt-1 text-[12px]">{revision.done} of {revision.total} done</p>}
            </div>}
            {note && <p className="ma-muted text-[13px]">{note}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <Link prefetch={false} href={primaryUrl} className={`ma-btn ma-btn--sm ${item.bucket === 'ready' || item.bucket === 'ready_to_deliver' ? 'ma-btn--primary' : 'ma-btn--dark'}`}>{nextAction.label}<ArrowRight size={13} /></Link>
              {canMarkDelivered(item) && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => void markDelivered(item)}
                  disabled={Boolean(deliveringId)}
                  loading={deliveringId === item.id}
                  icon={<Check size={13} />}
                  title="Already sent the link on WhatsApp? Mark it delivered without opening the report."
                >
                  {deliveringId === item.id ? 'Marking…' : 'Mark delivered'}
                </Button>
              )}
              {canRequestRevision(item) && <Button
                size="sm"
                onClick={() => setRevisionFor(item)}
                title="The client wants some looks changed. Choose them and write the new versions."
                icon={<MessageSquarePlus size={13} />}
              >
                Revise report
              </Button>}
              {primaryUrl !== detailUrl && <Link prefetch={false} href={detailUrl} className="ma-btn ma-btn--ghost ma-btn--sm">Client details</Link>}
            </div>
          </article>;
        })}
      </section>)}

    {view === 'waiting' && result && counts.stale > 0 && !debouncedSearch && page >= totalPages && <button type="button" onClick={() => selectTab('stale')} className="mt-3 flex w-full items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left text-[14px]" style={{ border: '1px dashed var(--ma-line)' }}>
      <span className="ma-muted">{counts.stale} older client{counts.stale > 1 ? 's' : ''} haven’t sent inputs in over 30 days</span><span className="inline-flex items-center gap-1" style={{ fontWeight: 600 }}>Show <ArrowRight size={14} /></span>
    </button>}

    {!busy && result && result.items.length === 0 && <div className="ma-card px-6 py-16 text-center">
      {debouncedSearch
        ? <><div className="ma-h2">No clients match “{debouncedSearch}”</div><p className="ma-muted mt-1 text-sm">Search looks inside the current tab only.</p><Button size="sm" className="mt-4" onClick={() => { setSearch(''); updateParams({ search: '', bucket: 'all', page: '' }); }}>Search all clients</Button></>
        : category.key === 'reports'
          ? <><div className="ma-h2">You’re all caught up</div><p className="ma-muted mt-1 text-sm">No reports need you right now.{counts.waiting ? ` ${counts.waiting} client${counts.waiting > 1 ? 's are' : ' is'} still sending photos or measurements.` : ''}</p></>
          : <div className="ma-h2">{category.key === 'waiting' ? 'No recent clients are waiting' : 'No clients here yet'}</div>}
    </div>}

    {revisionFor?.report && <StylistRevisionRequestDialog
      reportId={revisionFor.report.id}
      clientName={revisionFor.clientName || 'your client'}
      onClose={() => setRevisionFor(null)}
      onDone={result => revisionCreated(revisionFor, result)}
    />}

    {result && totalPages > 1 && <div className="mt-5 flex items-center justify-between gap-4">
      <p className="ma-faint ma-num text-sm">Page {page} of {totalPages} · {result.total} clients</p>
      <div className="flex gap-2">
        <Button size="sm" disabled={page <= 1 || busy} onClick={() => updateParams({ page: String(page - 1) })}>Previous</Button>
        <Button size="sm" disabled={page >= totalPages || busy} onClick={() => updateParams({ page: String(page + 1) })}>Next</Button>
      </div>
    </div>}
  </div>;
}
