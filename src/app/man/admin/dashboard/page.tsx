'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ExternalLink, FileText, RefreshCw, RotateCcw, Search, Sparkles, User } from 'lucide-react';
import {
  Avatar,
  Button,
  OverflowMenu,
  Pill,
  ReportStatusPill,
  Segmented,
  clientDisplayName,
  isReportStuck,
} from '@/components/manAdmin/ui';

interface LatestReport {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Submission {
  id: string;
  customer_email: string | null;
  customer_phone: string | null;
  face_shape: string | null;
  body_shape: string | null;
  derived_colour_season: string | null;
  photo_fullbody_url: string | null;
  photo_headshot_url: string | null;
  created_at: string;
  latest_report: LatestReport | null;
}

type Bucket = '' | 'todo' | 'working' | 'review' | 'failed' | 'sent';
type Counts = Record<Exclude<Bucket, ''>, number>;

const PAGE_SIZE = 20;

function titleCase(value: string | null | undefined) {
  return value ? value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : null;
}

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ManSubmissionsDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [allTotal, setAllTotal] = useState<number | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bucket, setBucket] = useState<Bucket>('');
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(bucket ? { status: bucket } : {}),
      });
      const res = await fetch(`/api/man-admin/submissions?${params}`, { cache: 'no-store' });
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
      setAllTotal(data.allTotal ?? null);
      setCounts(data.counts ?? null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, bucket]);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  // "/" jumps to search, like most Apple-style list apps.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const runGeneration = async (submissionId: string, reportId?: string) => {
    setBusyIds(prev => new Set(prev).add(submissionId));
    try {
      const res = await fetch(
        reportId ? `/api/man-report/${reportId}/resume-text` : `/api/man-report/generate/${submissionId}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (res.ok && data.reportId) {
        router.push(`/man/admin/report/${data.reportId}`);
        return;
      }
      await fetchSubmissions();
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

  const changeBucket = (next: Bucket) => {
    setBucket(next);
    setPage(1);
  };

  const waiting = counts ? counts.todo + counts.review : null;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(total, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ma-eyebrow mb-2">Men&apos;s Blueprint</div>
          <h1 className="ma-title">Clients</h1>
          <p className="ma-muted mt-2 text-[15px]">
            {allTotal == null ? ' ' : (
              <>
                {allTotal} clients
                {waiting ? <> · <span style={{ color: 'var(--ma-accent)', fontWeight: 600 }}>{waiting} waiting on you</span></> : null}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block w-full sm:w-72">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ma-faint" />
            <input
              ref={searchRef}
              value={search}
              onChange={event => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search email or phone"
              className="ma-input"
              style={{ borderRadius: 999, paddingLeft: 40, paddingRight: 40 }}
            />
            <span className="ma-kbd absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex">/</span>
          </label>
          <Button iconOnly icon={<RefreshCw size={15} />} onClick={() => void fetchSubmissions()} aria-label="Refresh" title="Refresh" />
        </div>
      </div>

      <div className="mb-4">
        <Segmented<Bucket>
          value={bucket}
          onChange={changeBucket}
          options={[
            { value: '', label: 'All' },
            { value: 'todo', label: 'To generate', count: counts?.todo ?? null },
            { value: 'working', label: 'Generating', count: counts?.working || null },
            { value: 'review', label: 'To review', count: counts?.review ?? null },
            { value: 'failed', label: 'Failed', count: counts?.failed || null },
            { value: 'sent', label: 'Sent' },
          ]}
        />
      </div>

      <div className="ma-card overflow-hidden">
        {loading && submissions.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="ma-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="flex items-center gap-3">
                <div className="ma-skeleton h-[38px] w-[38px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="ma-skeleton h-3.5 w-48" />
                  <div className="ma-skeleton h-3 w-32" />
                </div>
              </div>
            </div>
          ))
        ) : submissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="ma-h2">Nothing here</div>
            <p className="ma-muted mt-1 text-sm">{debouncedSearch ? 'No client matches that search.' : 'No clients in this list right now.'}</p>
          </div>
        ) : (
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {submissions.map(item => (
              <ClientRow
                key={item.id}
                item={item}
                busy={busyIds.has(item.id)}
                onGenerate={() => void runGeneration(item.id)}
                onResume={reportId => void runGeneration(item.id, reportId)}
              />
            ))}
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between">
          <p className="ma-faint text-sm ma-num">{firstRow}–{lastRow} of {total}</p>
          <div className="flex gap-2">
            <Button size="sm" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button>
            <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientRow({ item, busy, onGenerate, onResume }: {
  item: Submission;
  busy: boolean;
  onGenerate: () => void;
  onResume: (reportId: string) => void;
}) {
  const router = useRouter();
  const report = item.latest_report;
  const missingPhotos = [
    item.photo_fullbody_url ? null : 'full-body',
    item.photo_headshot_url ? null : 'headshot',
  ].filter(Boolean);
  const intakeHref = `/man/admin/dashboard/${item.id}`;
  const reportHref = report ? `/man/admin/report/${report.id}` : null;
  const name = clientDisplayName(item.customer_email, item.customer_phone);
  const face = titleCase(item.face_shape);
  const body = titleCase(item.body_shape);
  const profile = [face && `${face} face`, body && `${body} body`].filter(Boolean).join(' · ');

  let primary: React.ReactNode;
  if (missingPhotos.length > 0) {
    primary = <Button size="sm" onClick={() => router.push(intakeHref)}>Add photos</Button>;
  } else if (!report) {
    primary = <Button size="sm" variant="primary" icon={<Sparkles size={13} />} loading={busy} onClick={onGenerate}>Generate</Button>;
  } else if (report.status === 'error' || isReportStuck(report)) {
    primary = <Button size="sm" variant="danger" icon={<RotateCcw size={13} />} loading={busy} onClick={() => onResume(report.id)}>{report.status === 'error' ? 'Retry' : 'Restart'}</Button>;
  } else if (['draft_ready', 'in_review', 'approved'].includes(report.status)) {
    primary = <Button size="sm" variant="dark" onClick={() => router.push(reportHref!)}>Review <ArrowRight size={13} /></Button>;
  } else {
    primary = <Button size="sm" onClick={() => router.push(reportHref!)}>Open</Button>;
  }

  return (
    <div className="ma-row ma-client-row">
      <Link href={reportHref ?? intakeHref} className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={item.photo_headshot_url} />
        <div className="min-w-0">
          <div className="truncate text-[15px]" style={{ fontWeight: 600 }}>{name}</div>
          <div className="ma-faint truncate text-[13px]">{item.customer_email ?? item.customer_phone ?? '—'}</div>
        </div>
      </Link>

      <div className="hidden min-w-0 md:block">
        {item.derived_colour_season && <div className="truncate text-[13px]" style={{ fontWeight: 500 }}>{titleCase(item.derived_colour_season)}</div>}
        <div className="ma-faint truncate text-[13px]">{profile || '—'}</div>
      </div>

      <div className="ma-faint hidden text-[13px] md:block">{relativeDate(item.created_at)}</div>

      <div className="hidden sm:block">
        {missingPhotos.length > 0
          ? <Pill tone="amber" dot>No {missingPhotos.join(' or ')}</Pill>
          : <ReportStatusPill report={report} />}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {primary}
        <OverflowMenu
          trigger={<Button size="sm" variant="ghost" iconOnly icon={<span className="text-lg leading-none">···</span>} aria-label="More" />}
          items={[
            { label: 'Intake answers', icon: <User size={15} />, onSelect: () => router.push(intakeHref) },
            ...(reportHref ? [{ label: 'Open report', icon: <FileText size={15} />, onSelect: () => router.push(reportHref) }] : []),
            ...(report?.share_token && (report.status === 'sent' || report.status === 'approved')
              ? [{ label: 'Client link', hint: 'Opens what the client sees', icon: <ExternalLink size={15} />, onSelect: () => window.open(`/man/report/${report.share_token}`, '_blank') }]
              : []),
          ]}
        />
      </div>
    </div>
  );
}
