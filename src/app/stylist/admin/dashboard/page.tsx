'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Search } from 'lucide-react';
import { Avatar, Button, Pill, Segmented, type PillTone } from '@/components/manAdmin/ui';

interface LatestReport {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  customer_email: string | null;
  customer_phone: string | null;
  full_name: string | null;
  country: string | null;
  intake_source?: string | null;
  selected_moodboard_label: string | null;
  completed_at: string | null;
  created_at: string;
  latest_report: LatestReport | null;
}

function stageName(stage: string | null) {
  const map: Record<string, string> = {
    classifying: 'Classifying…',
    generating_s0: 'Snapshot…',
    generating_s1: 'Body…',
    generating_s2: 'Colour…',
    generating_s3: 'Face…',
    generating_s4: 'Outfits…',
    generating_s5: 'Shopping…',
    generating_s6: 'Identity…',
    generating_images: 'Images…',
  };
  return stage ? map[stage] ?? 'Generating…' : 'Generating…';
}

function ReportBadge({ report }: { report: LatestReport | null }) {
  if (!report) return <Pill dot>Not started</Pill>;
  if (report.status === 'generating') return <Pill tone="blue" live>{stageName(report.progress_stage).replace('…', '')}</Pill>;
  const tone: PillTone = report.status === 'error' ? 'red'
    : report.status === 'sent' || report.status === 'approved' ? 'green'
      : report.status === 'draft_ready' || report.status === 'in_review' ? 'accent'
        : 'neutral';
  const label = report.status === 'draft_ready' ? 'Ready to review' : report.status === 'error' ? 'Failed' : report.status.replace(/_/g, ' ');
  return <Pill tone={tone} dot>{label.charAt(0).toUpperCase() + label.slice(1)}</Pill>;
}

export default function StylistSubmissionsDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    const res = await fetch(`/api/stylist-admin/submissions?${params}`, { cache: 'no-store' });
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  const clientLabel = (item: Submission) => item.full_name || item.customer_email || item.customer_phone || 'Manual client';
  const waiting = submissions.filter(item => ['draft_ready', 'in_review'].includes(item.latest_report?.status ?? '')).length;

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ma-eyebrow mb-2">ICONIK Stylist</div>
          <h1 className="ma-title">Blueprint <em>submissions</em></h1>
          <p className="ma-muted mt-2 text-[15px]">
            {loading && !submissions.length ? ' ' : <>{total} completed intakes{waiting ? <> · <span style={{ color: 'var(--ma-accent)', fontWeight: 600 }}>{waiting} to review</span></> : null}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block w-full sm:w-72">
            <Search size={15} className="ma-faint pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email…" className="ma-input" style={{ borderRadius: 999, paddingLeft: 40 }} />
          </label>
          <Button iconOnly icon={<RefreshCw size={15} className={loading ? 'animate-spin' : undefined} />} onClick={() => void fetchSubmissions()} aria-label="Refresh" title="Refresh" />
        </div>
      </div>

      <div className="mb-4">
        <Segmented<string>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All' },
            { value: 'none', label: 'To generate' },
            { value: 'generating', label: 'Generating' },
            { value: 'draft_ready', label: 'Draft ready' },
            { value: 'in_review', label: 'In review' },
            { value: 'approved', label: 'Approved' },
            { value: 'sent', label: 'Sent' },
            { value: 'error', label: 'Failed' },
          ]}
        />
      </div>

      <div className="ma-card overflow-hidden">
        {loading && submissions.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="ma-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="flex items-center gap-3">
                <div className="ma-skeleton h-[38px] w-[38px] rounded-full" />
                <div className="flex-1 space-y-2"><div className="ma-skeleton h-3.5 w-48" /><div className="ma-skeleton h-3 w-32" /></div>
              </div>
            </div>
          ))
        ) : submissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="ma-h2">Nothing here</div>
            <p className="ma-muted mt-1 text-sm">{search ? 'No client matches that search.' : 'No submissions in this list right now.'}</p>
          </div>
        ) : (
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {submissions.map(item => {
              const intakeHref = `/stylist/admin/dashboard/${item.id}`;
              const reportHref = item.latest_report ? `/stylist/admin/report/${item.latest_report.id}` : null;
              const reviewable = ['draft_ready', 'in_review', 'approved'].includes(item.latest_report?.status ?? '');
              return (
                <div key={item.id} className="ma-row ma-client-row">
                  <Link href={reportHref ?? intakeHref} className="flex min-w-0 items-center gap-3">
                    <Avatar name={clientLabel(item)} />
                    <div className="min-w-0">
                      <div className="truncate text-[15px]" style={{ fontWeight: 600 }}>{clientLabel(item)}</div>
                      <div className="ma-faint truncate text-[13px]">{item.customer_email || item.customer_phone || (item.intake_source === 'manual_admin' ? 'Manual entry' : 'No email')}</div>
                    </div>
                  </Link>
                  <div className="hidden min-w-0 md:block">
                    <div className="truncate text-[13px]" style={{ fontWeight: 500 }}>{item.selected_moodboard_label || '—'}</div>
                    <div className="ma-faint truncate text-[13px]">{item.country || '—'}</div>
                  </div>
                  <div className="ma-faint ma-num hidden text-[13px] md:block">{item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
                  <div className="hidden sm:block"><ReportBadge report={item.latest_report} /></div>
                  <div className="flex items-center justify-end gap-1.5">
                    {reportHref
                      ? <Link href={reportHref} className={`ma-btn ma-btn--sm ${reviewable ? 'ma-btn--dark' : 'ma-btn--secondary'}`}>{reviewable ? <>Review <ArrowRight size={13} /></> : 'Open'}</Link>
                      : <Link href={intakeHref} className="ma-btn ma-btn--secondary ma-btn--sm">Intake</Link>}
                    {reportHref && <Link href={intakeHref} className="ma-btn ma-btn--ghost ma-btn--sm">Intake</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
