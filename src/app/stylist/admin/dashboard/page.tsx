'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, FileCheck, RefreshCw, Search, Sparkles, Users } from 'lucide-react';

const S = {
  bg: '#F4EFE5',
  card: '#EDE5D2',
  border: 'rgba(44,38,34,0.1)',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.4)',
  slate: '#94A6AD',
  slateDeep: '#7E9098',
  gold: '#C9A96E',
  rowHover: 'rgba(44,38,34,0.03)',
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
  if (!report) return (
    <span className="rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: '10px', background: S.card, color: S.muted }}>
      No Report
    </span>
  );
  const label = report.status === 'generating' ? stageName(report.progress_stage) : report.status.replace(/_/g, ' ');
  const color = report.status === 'error' ? '#C4645A'
    : report.status === 'sent' ? '#5A8B6A'
      : report.status === 'generating' ? S.gold
        : S.slate;
  return (
    <span className="rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: '10px', background: `${color}18`, color }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: S.card, borderColor: S.border }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="iconik-display" style={{ fontSize: '26px', color: S.ink }}>{value}</p>
        <p className="iconik-micro" style={{ color: S.muted }}>{label}</p>
      </div>
    </div>
  );
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

  const stats = {
    total,
    needsGeneration: submissions.filter(item => !item.latest_report).length,
    generating: submissions.filter(item => item.latest_report?.status === 'generating').length,
    approved: submissions.filter(item => item.latest_report?.status === 'approved').length,
    sent: submissions.filter(item => item.latest_report?.status === 'sent').length,
    review: submissions.filter(item => ['draft_ready', 'in_review'].includes(item.latest_report?.status ?? '')).length,
    errors: submissions.filter(item => item.latest_report?.status === 'error').length,
  };

  const clientLabel = (item: Submission) => item.full_name || item.customer_email || item.customer_phone || 'Manual client';

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>ICONIK Stylist</div>
          <h1 className="iconik-display" style={{ fontSize: '28px', color: S.ink }}>Blueprint Submissions</h1>
        </div>
        <button
          onClick={fetchSubmissions}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body transition"
          style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-7 gap-4 mb-7">
        <StatCard label="Completed intakes" value={stats.total} icon={Users} color={S.gold} />
        <StatCard label="Needs generation" value={stats.needsGeneration} icon={Sparkles} color={S.slateDeep} />
        <StatCard label="Generating" value={stats.generating} icon={RefreshCw} color={S.gold} />
        <StatCard label="Needs review" value={stats.review} icon={Clock} color={S.slate} />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="#5A8B6A" />
        <StatCard label="Sent" value={stats.sent} icon={FileCheck} color="#5A8B6A" />
        <StatCard label="Errors" value={stats.errors} icon={AlertCircle} color="#C4645A" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
          style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
        >
          <option value="">All review buckets</option>
          <option value="none">Needs Generation</option>
          <option value="generating">Generating</option>
          <option value="draft_ready">Needs Review - Draft Ready</option>
          <option value="in_review">Needs Review - In Review</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: S.bg, borderColor: S.border }}>
        <table className="w-full">
          <thead style={{ background: S.card }}>
            <tr>
              {['Client', 'Country', 'Moodboard', 'Completed', 'Report', 'Actions'].map(head => (
                <th key={head} className="text-left px-4 py-3 iconik-micro" style={{ color: S.muted }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center luxury-body text-sm" style={{ color: S.muted }}>Loading…</td>
              </tr>
            ) : submissions.map(item => (
              <tr key={item.id} className="border-t" style={{ borderColor: S.border }}>
                <td className="px-4 py-4">
                  <Link
                    href={`/stylist/admin/dashboard/${item.id}`}
                    className="luxury-body hover:underline"
                    style={{ color: S.ink, fontWeight: 500 }}
                  >
                    {clientLabel(item)}
                  </Link>
                  <p className="luxury-body text-xs mt-0.5" style={{ color: S.muted, fontWeight: 300 }}>
                    {item.customer_email || item.customer_phone || (item.intake_source === 'manual_admin' ? 'Manual entry' : 'No email')}
                  </p>
                </td>
                <td className="px-4 py-4 luxury-body text-sm" style={{ color: S.muted }}>{item.country || '—'}</td>
                <td className="px-4 py-4 luxury-body text-sm" style={{ color: S.muted }}>{item.selected_moodboard_label || '—'}</td>
                <td className="px-4 py-4 iconik-mono" style={{ fontSize: '11px', color: S.muted }}>
                  {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-4"><ReportBadge report={item.latest_report} /></td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/stylist/admin/dashboard/${item.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                      style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
                    >
                      Intake
                    </Link>
                    {item.latest_report && (
                      <Link
                        href={`/stylist/admin/report/${item.latest_report.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs luxury-body transition"
                        style={{ background: S.ink, color: S.bg }}
                      >
                        Open Report
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
