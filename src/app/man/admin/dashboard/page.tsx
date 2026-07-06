'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const S = {
  bg: '#F4EFE5',
  card: '#EDE5D2',
  border: 'rgba(44,38,34,0.1)',
  rowBorder: 'rgba(44,38,34,0.07)',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.4)',
  slate: '#94A6AD',
  slateDeep: '#7E9098',
  gold: '#C9A96E',
  success: '#5A8B6A',
  error: '#C4645A',
};

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
  face_shape: string | null;
  body_shape: string | null;
  derived_colour_season: string | null;
  primary_goal: string | null;
  location_tier: string | null;
  photo_fullbody_url: string | null;
  photo_headshot_url: string | null;
  created_at: string;
  latest_report: LatestReport | null;
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All review buckets' },
  { value: 'none', label: 'Needs Generation' },
  { value: 'generating', label: 'Generating' },
  { value: 'draft_ready', label: 'Needs Review - Draft Ready' },
  { value: 'in_review', label: 'Needs Review - In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'error', label: 'Error' },
];

function stageName(stage: string | null) {
  const map: Record<string, string> = {
    classifying: 'Classifying...',
    generating_s0: 'Snapshot...',
    analysing_face: 'Analysing face...',
    generating_s1: 'Face...',
    analysing_body: 'Analysing body...',
    generating_s2: 'Body...',
    mapping_colour: 'Mapping colour...',
    generating_s3: 'Colour...',
    generating_outfits: 'Outfits...',
    generating_s4: 'Outfits...',
    generating_s4_combo_grids: 'Combination grids...',
    generating_s5: 'Style rules...',
    generating_s5_shopping: 'Shopping...',
    generating_s5_grooming_skin: 'Grooming...',
    generating_s6: 'Identity...',
    generating_images: 'Images...',
    repairing_section4: 'Repairing outfits...',
    finalising: 'Finalising...',
  };
  return stage ? map[stage] ?? 'Generating...' : 'Generating...';
}

function isStuck(report: LatestReport) {
  return report.status === 'generating' && (Date.now() - new Date(report.created_at).getTime()) > 10 * 60 * 1000;
}

function ReportBadge({ report }: { report: LatestReport | null }) {
  if (!report) {
    return (
      <span className="rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: '10px', background: S.card, color: S.muted }}>
        No Report
      </span>
    );
  }

  const stuck = isStuck(report);
  const label = stuck ? 'Stuck?' : report.status === 'generating' ? stageName(report.progress_stage) : report.status.replace(/_/g, ' ');
  const color = report.status === 'error' ? S.error
    : report.status === 'sent' || report.status === 'approved' ? S.success
      : stuck ? '#B86D2A'
        : report.status === 'generating' ? S.gold
          : S.slate;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: '10px', background: `${color}18`, color }}>
      {report.status === 'generating' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />}
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: S.card, borderColor: S.border }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        {loading
          ? <div className="h-7 w-10 rounded-md animate-pulse mb-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
          : <p className="iconik-display" style={{ fontSize: '26px', color: S.ink }}>{value}</p>
        }
        <p className="iconik-micro" style={{ color: S.muted }}>{label}</p>
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatValue(value: string | null | undefined) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function getMissingPhotos(submission: Pick<Submission, 'photo_fullbody_url' | 'photo_headshot_url'>) {
  return [
    submission.photo_fullbody_url ? null : 'Full body',
    submission.photo_headshot_url ? null : 'Headshot',
  ].filter(Boolean) as string[];
}

function clientLabel(item: Submission) {
  return item.customer_email || item.customer_phone || 'Man blueprint client';
}

export default function ManSubmissionsDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
      const res = await fetch(`/api/man-admin/submissions?${params}`, { cache: 'no-store' });
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  const stats = {
    total,
    needsGeneration: submissions.filter(item => !item.latest_report).length,
    generating: submissions.filter(item => item.latest_report?.status === 'generating').length,
    approved: submissions.filter(item => item.latest_report?.status === 'approved').length,
    sent: submissions.filter(item => item.latest_report?.status === 'sent').length,
    review: submissions.filter(item => ['draft_ready', 'in_review'].includes(item.latest_report?.status ?? '')).length,
    errors: submissions.filter(item => item.latest_report?.status === 'error').length,
  };

  const handleGenerate = async (submissionId: string, reportId?: string) => {
    setGeneratingIds(prev => new Set(prev).add(submissionId));
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
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-7">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>ICONIK Man</div>
          <h1 className="iconik-display" style={{ fontSize: '28px', color: S.ink }}>Blueprint Submissions</h1>
        </div>
        <button
          onClick={() => void fetchSubmissions()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body transition"
          style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-7 gap-4 mb-7">
        <StatCard label="Completed intakes" value={stats.total} icon={Users} color={S.gold} loading={loading} />
        <StatCard label="Needs generation" value={stats.needsGeneration} icon={Sparkles} color={S.slateDeep} loading={loading} />
        <StatCard label="Generating" value={stats.generating} icon={RefreshCw} color={S.gold} loading={loading} />
        <StatCard label="Needs review" value={stats.review} icon={Clock} color={S.slate} loading={loading} />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color={S.success} loading={loading} />
        <StatCard label="Sent" value={stats.sent} icon={FileCheck} color={S.success} loading={loading} />
        <StatCard label="Errors" value={stats.errors} icon={AlertCircle} color={S.error} loading={loading} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={event => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search email or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={event => { setStatusFilter(event.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
          style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
        >
          {STATUS_FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: S.bg, borderColor: S.border }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead style={{ background: S.card }}>
              <tr>
                {['Client', 'Submitted', 'Profile', 'Photos', 'Report', 'Actions'].map(head => (
                  <th key={head} className="text-left px-4 py-3 iconik-micro" style={{ color: S.muted }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-t" style={{ borderColor: S.rowBorder }}>
                    {Array.from({ length: 6 }).map((__, colIndex) => (
                      <td key={colIndex} className="px-4 py-4">
                        <div className="h-4 rounded-md animate-pulse" style={{ background: 'rgba(44,38,34,0.08)', width: colIndex === 0 ? '70%' : '55%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center luxury-body text-sm" style={{ color: S.muted }}>No submissions found.</td>
                </tr>
              ) : submissions.map(item => {
                const missingPhotos = getMissingPhotos(item);
                const hasRequiredPhotos = missingPhotos.length === 0;
                const report = item.latest_report;
                const stuck = report ? isStuck(report) : false;

                return (
                  <tr key={item.id} className="border-t transition-colors" style={{ borderColor: S.rowBorder }}>
                    <td className="px-4 py-4">
                      <Link
                        href={`/man/admin/dashboard/${item.id}`}
                        className="luxury-body hover:underline"
                        style={{ color: S.ink, fontWeight: 500 }}
                      >
                        {clientLabel(item)}
                      </Link>
                      <p className="luxury-body text-xs mt-0.5" style={{ color: S.muted, fontWeight: 300 }}>
                        {item.customer_phone || 'No phone'}
                      </p>
                    </td>
                    <td className="px-4 py-4 iconik-mono" style={{ fontSize: '11px', color: S.muted }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-4 luxury-body text-sm" style={{ color: S.muted }}>
                      <div className="space-y-0.5">
                        <p><span style={{ color: S.ink }}>Face:</span> {formatValue(item.face_shape)}</p>
                        <p><span style={{ color: S.ink }}>Body:</span> {formatValue(item.body_shape)}</p>
                        <p style={{ color: S.gold }}>{formatValue(item.derived_colour_season)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="iconik-mono" style={{ fontSize: '10px', color: item.photo_fullbody_url ? S.success : S.error }}>
                          Body {item.photo_fullbody_url ? 'ready' : 'missing'}
                        </span>
                        <span className="iconik-mono" style={{ fontSize: '10px', color: item.photo_headshot_url ? S.success : S.error }}>
                          Headshot {item.photo_headshot_url ? 'ready' : 'missing'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><ReportBadge report={report} /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {!hasRequiredPhotos && (
                          <Link
                            href={`/man/admin/dashboard/${item.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                            style={{ background: `${S.error}12`, color: S.error, border: `1px solid ${S.error}25` }}
                            title={`Missing: ${missingPhotos.join(', ')}`}
                          >
                            <AlertCircle size={11} /> Add photos
                          </Link>
                        )}

                        {!report && hasRequiredPhotos && (
                          <button
                            onClick={() => void handleGenerate(item.id)}
                            disabled={generatingIds.has(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body disabled:opacity-50 transition"
                            style={{ background: S.slateDeep, color: S.bg }}
                          >
                            {generatingIds.has(item.id) ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                            Generate
                          </button>
                        )}

                        {hasRequiredPhotos && report?.status === 'generating' && (
                          stuck ? (
                            <button
                              onClick={() => void handleGenerate(item.id, report.id)}
                              disabled={generatingIds.has(item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body disabled:opacity-50 transition"
                              style={{ background: '#B86D2A18', color: '#B86D2A', border: '1px solid #B86D2A30' }}
                            >
                              {generatingIds.has(item.id) ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                              Force Restart
                            </button>
                          ) : (
                            <Link
                              href={`/man/admin/report/${report.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                              style={{ background: `${S.gold}18`, color: S.gold, border: `1px solid ${S.gold}30` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: S.gold }} />
                              Open Report
                            </Link>
                          )
                        )}

                        {hasRequiredPhotos && report?.status === 'error' && (
                          <button
                            onClick={() => void handleGenerate(item.id, report.id)}
                            disabled={generatingIds.has(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body disabled:opacity-50 transition"
                            style={{ background: `${S.error}12`, color: S.error, border: `1px solid ${S.error}25` }}
                          >
                            {generatingIds.has(item.id) ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                            Retry
                          </button>
                        )}

                        {['draft_ready', 'in_review', 'approved'].includes(report?.status ?? '') && report && (
                          <Link
                            href={`/man/admin/report/${report.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                            style={{ background: S.ink, color: S.bg }}
                          >
                            Open Report
                          </Link>
                        )}

                        {report?.status === 'sent' && (
                          <>
                            <Link
                              href={`/man/admin/report/${report.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                              style={{ background: S.ink, color: S.bg }}
                            >
                              Open Report
                            </Link>
                            <Link
                              href={`/man/report/${report.share_token}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                              style={{ background: `${S.success}18`, color: S.success, border: `1px solid ${S.success}30` }}
                            >
                              Client Link <ExternalLink size={11} />
                            </Link>
                          </>
                        )}

                        <Link
                          href={`/man/admin/dashboard/${item.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                          style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
                        >
                          Intake
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: S.border, background: S.card }}>
            <p className="iconik-mono" style={{ fontSize: '11px', color: S.muted }}>
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}
                className="p-2 rounded-lg disabled:opacity-30 transition"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                className="p-2 rounded-lg disabled:opacity-30 transition"
                style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}
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
