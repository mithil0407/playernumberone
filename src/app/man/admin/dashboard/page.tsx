'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, RefreshCw, Users, FileCheck, Clock, AlertCircle, ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface LatestReport {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
}

interface Submission {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  face_shape: string | null;
  body_shape: string | null;
  derived_colour_season: string | null;
  primary_goal: string | null;
  location_tier: string | null;
  photo_headshot_url: string | null;
  created_at: string;
  latest_report: LatestReport | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: '',           label: 'All' },
  { value: 'none',       label: 'No Report' },
  { value: 'generating', label: 'Generating' },
  { value: 'draft_ready',label: 'Draft Ready' },
  { value: 'in_review',  label: 'In Review' },
  { value: 'approved',   label: 'Approved' },
  { value: 'sent',       label: 'Sent' },
  { value: 'error',      label: 'Error' },
];

function ReportBadge({ report }: { report: LatestReport | null }) {
  if (!report) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
        style={{ background: '#1e1e1e', color: '#6b5f4a' }}>
        No Report
      </span>
    );
  }

  const configs: Record<string, { bg: string; color: string; label: string; dot?: boolean }> = {
    pending:     { bg: '#1e1e1e', color: '#6b5f4a',  label: 'Pending' },
    generating:  { bg: '#2a2010', color: '#c9a96e',  label: report.progress_stage ? stageName(report.progress_stage) : 'Generating…', dot: true },
    draft_ready: { bg: '#2a2010', color: '#e8c17a',  label: 'Draft Ready' },
    in_review:   { bg: '#0e1e2a', color: '#60a5fa',  label: 'In Review' },
    approved:    { bg: '#0e2010', color: '#4ade80',  label: 'Approved' },
    sent:        { bg: '#0e2010', color: '#22c55e',  label: 'Sent ✓' },
    error:       { bg: '#2a0e0e', color: '#f87171',  label: 'Error' },
  };

  const cfg = configs[report.status] ?? configs.pending;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.dot && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      )}
      {cfg.label}
    </span>
  );
}

function stageName(s: string) {
  const map: Record<string, string> = {
    analysing_face:    'Analysing face…',
    analysing_body:    'Analysing body…',
    mapping_colour:    'Mapping colour…',
    generating_outfits:'Generating outfits…',
    finalising:        'Finalising…',
  };
  return map[s] ?? 'Generating…';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSeason(s: string | null) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: React.ElementType; color: string; loading: boolean;
}) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4"
      style={{ background: '#111111', borderColor: '#1e1e1e' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22' }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div>
        {loading
          ? <div className="h-6 w-10 rounded-md animate-pulse mb-1" style={{ background: '#2a2a2a' }} />
          : <p className="text-2xl font-bold" style={{ color: '#f0ebe0' }}>{value}</p>
        }
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{label}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ManSubmissionsDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res  = await fetch(`/api/man-admin/submissions?${params}`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  // Derived stats from loaded submissions (rough — not full-DB counts)
  const stats = {
    total:         total,
    sent:          submissions.filter(s => s.latest_report?.status === 'sent').length,
    awaitingReview: submissions.filter(s => ['draft_ready','in_review'].includes(s.latest_report?.status ?? '')).length,
    errors:        submissions.filter(s => s.latest_report?.status === 'error').length,
  };

  const handleGenerate = async (submissionId: string) => {
    setGeneratingIds(prev => new Set(prev).add(submissionId));
    try {
      const res  = await fetch(`/api/man-report/generate/${submissionId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.reportId) {
        router.push(`/man/admin/report/${data.reportId}`);
      }
    } finally {
      setGeneratingIds(prev => { const next = new Set(prev); next.delete(submissionId); return next; });
    }
  };

  const totalPages = Math.ceil(total / 20);

  const thStyle = { color: '#6b5f4a', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '12px 16px', borderBottom: '1px solid #1e1e1e', background: '#0f0f0f' };
  const tdStyle = { padding: '14px 16px', borderBottom: '1px solid #181818', color: '#c8bfae', fontSize: 13 };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>
            ICONIK Man
          </p>
          <h1 className="text-3xl font-light tracking-wide" style={{ color: '#f0ebe0' }}>
            Submissions
          </h1>
        </div>
        <button
          onClick={fetchSubmissions}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Total submissions"  value={stats.total}          icon={Users}       color="#c9a96e"  loading={loading} />
        <StatCard label="Reports sent"        value={stats.sent}           icon={FileCheck}   color="#22c55e"  loading={loading} />
        <StatCard label="Awaiting review"     value={stats.awaitingReview} icon={Clock}       color="#60a5fa"  loading={loading} />
        <StatCard label="Errors"              value={stats.errors}         icon={AlertCircle} color="#f87171"  loading={loading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6b5f4a' }} />
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#f0ebe0' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === opt.value ? '#1e1a14' : '#111111',
                color: statusFilter === opt.value ? '#c9a96e' : '#6b5f4a',
                border: `1px solid ${statusFilter === opt.value ? '#2a2010' : '#2a2a2a'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e1e1e' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th style={thStyle}>Photo</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Profile</th>
                <th style={thStyle}>Report</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={tdStyle}>
                        <div className="h-4 rounded-md animate-pulse" style={{ background: '#1e1e1e', width: j === 0 ? 40 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!loading && submissions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '40px 16px', color: '#4a4030' }}>
                    No submissions found.
                  </td>
                </tr>
              )}
              {!loading && submissions.map(sub => (
                <tr key={sub.id} style={{ background: '#0d0d0d' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#111111'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = '#0d0d0d'}
                >
                  {/* Photo */}
                  <td style={tdStyle}>
                    {sub.photo_headshot_url ? (
                      <img
                        src={sub.photo_headshot_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                        style={{ border: '1px solid #2a2a2a' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs"
                        style={{ background: '#1e1e1e', color: '#4a4030' }}>
                        —
                      </div>
                    )}
                  </td>

                  {/* Contact */}
                  <td style={tdStyle}>
                    <p className="font-medium" style={{ color: '#f0ebe0', fontSize: 13 }}>{sub.customer_email}</p>
                    {sub.customer_phone && (
                      <p className="text-xs mt-0.5" style={{ color: '#6b5f4a' }}>{sub.customer_phone}</p>
                    )}
                  </td>

                  {/* Submitted */}
                  <td style={tdStyle}>
                    <span style={{ color: '#8a7a60', fontSize: 12 }}>{formatDate(sub.created_at)}</span>
                  </td>

                  {/* Profile */}
                  <td style={tdStyle}>
                    <div className="space-y-0.5">
                      {sub.face_shape && (
                        <p className="text-xs capitalize" style={{ color: '#c8bfae' }}>
                          <span style={{ color: '#6b5f4a' }}>Face: </span>{sub.face_shape.replace(/_/g, ' ')}
                        </p>
                      )}
                      {sub.body_shape && (
                        <p className="text-xs capitalize" style={{ color: '#c8bfae' }}>
                          <span style={{ color: '#6b5f4a' }}>Body: </span>{sub.body_shape.replace(/_/g, ' ')}
                        </p>
                      )}
                      {sub.derived_colour_season && (
                        <p className="text-xs" style={{ color: '#c9a96e' }}>{formatSeason(sub.derived_colour_season)}</p>
                      )}
                    </div>
                  </td>

                  {/* Report status */}
                  <td style={tdStyle}>
                    <ReportBadge report={sub.latest_report} />
                  </td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* No report — inline Generate */}
                      {!sub.latest_report && (
                        <button
                          onClick={() => handleGenerate(sub.id)}
                          disabled={generatingIds.has(sub.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
                        >
                          {generatingIds.has(sub.id) ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                          Generate
                        </button>
                      )}

                      {/* Generating — View Live deeplink */}
                      {sub.latest_report?.status === 'generating' && sub.latest_report.id && (
                        <Link
                          href={`/man/admin/report/${sub.latest_report.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: '#2a2010', color: '#c9a96e', border: '1px solid #3a3010' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#c9a96e' }} />
                          View Live
                        </Link>
                      )}

                      {/* Error — Retry inline */}
                      {sub.latest_report?.status === 'error' && (
                        <button
                          onClick={() => handleGenerate(sub.id)}
                          disabled={generatingIds.has(sub.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
                          style={{ background: '#2a0e0e', color: '#f87171', border: '1px solid #3a1010' }}
                        >
                          {generatingIds.has(sub.id) ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                          Retry
                        </button>
                      )}

                      {/* Draft Ready / In Review / Approved — Review deeplink */}
                      {['draft_ready', 'in_review', 'approved'].includes(sub.latest_report?.status ?? '') && sub.latest_report?.id && (
                        <Link
                          href={`/man/admin/report/${sub.latest_report.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
                        >
                          Review →
                        </Link>
                      )}

                      {/* Sent — Report external link */}
                      {sub.latest_report?.status === 'sent' && (
                        <Link
                          href={`/man/report/${sub.latest_report.share_token}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: '#0e2010', color: '#22c55e', border: '1px solid #1a3a1a' }}
                        >
                          Report ↗
                        </Link>
                      )}

                      {/* View always available (dimmer) */}
                      <Link
                        href={`/man/admin/dashboard/${sub.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: '#1e1e1e', color: '#6b5f4a' }}
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: '#1e1e1e', background: '#0f0f0f' }}>
            <p className="text-xs" style={{ color: '#6b5f4a' }}>
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg disabled:opacity-30 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#c8bfae' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg disabled:opacity-30 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#c8bfae' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
