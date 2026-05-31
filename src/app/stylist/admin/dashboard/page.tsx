'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, FileCheck, RefreshCw, Search, Users } from 'lucide-react';

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
  customer_email: string;
  customer_phone: string | null;
  full_name: string | null;
  country: string | null;
  selected_moodboard_label: string | null;
  completed_at: string | null;
  created_at: string;
  latest_report: LatestReport | null;
}

function stageName(stage: string | null) {
  const map: Record<string, string> = {
    classifying: 'Classifying...',
    generating_s0: 'Snapshot...',
    generating_s1: 'Body...',
    generating_s2: 'Colour...',
    generating_s3: 'Face...',
    generating_s4: 'Outfits...',
    generating_s5: 'Shopping...',
    generating_s6: 'Identity...',
    generating_images: 'Images...',
  };
  return stage ? map[stage] ?? 'Generating...' : 'Generating...';
}

function ReportBadge({ report }: { report: LatestReport | null }) {
  if (!report) return <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: '#1e1e1e', color: '#6b5f4a' }}>No Report</span>;
  const label = report.status === 'generating' ? stageName(report.progress_stage) : report.status.replace(/_/g, ' ');
  const color = report.status === 'error' ? '#f87171' : report.status === 'sent' ? '#22c55e' : report.status === 'generating' ? '#c9a96e' : '#60a5fa';
  return <span className="rounded-full px-2.5 py-1 text-[11px] capitalize" style={{ background: `${color}22`, color }}>{label}</span>;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}><Icon size={19} style={{ color }} /></div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#f0ebe0' }}>{value}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{label}</p>
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
    sent: submissions.filter(item => item.latest_report?.status === 'sent').length,
    review: submissions.filter(item => ['draft_ready', 'in_review'].includes(item.latest_report?.status ?? '')).length,
    errors: submissions.filter(item => item.latest_report?.status === 'error').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>ICONIK Stylist</p>
          <h1 className="text-3xl font-light tracking-wide" style={{ color: '#f0ebe0' }}>Blueprint Submissions</h1>
        </div>
        <button onClick={fetchSubmissions} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Completed intakes" value={stats.total} icon={Users} color="#c9a96e" />
        <StatCard label="Reports sent" value={stats.sent} icon={FileCheck} color="#22c55e" />
        <StatCard label="Awaiting review" value={stats.review} icon={Clock} color="#60a5fa" />
        <StatCard label="Errors" value={stats.errors} icon={AlertCircle} color="#f87171" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6b5f4a' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111111', border: '1px solid #1e1e1e', color: '#f0ebe0' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111111', border: '1px solid #1e1e1e', color: '#c8bfae' }}>
          <option value="">All</option>
          <option value="none">No Report</option>
          <option value="generating">Generating</option>
          <option value="draft_ready">Draft Ready</option>
          <option value="in_review">In Review</option>
          <option value="sent">Sent</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
        <table className="w-full">
          <thead style={{ background: '#0f0f0f' }}>
            <tr>
              {['Client', 'Country', 'Moodboard', 'Completed', 'Report'].map(head => <th key={head} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#6b5f4a' }}>Loading...</td></tr>
            ) : submissions.map(item => (
              <tr key={item.id} className="border-t" style={{ borderColor: '#181818' }}>
                <td className="px-4 py-4">
                  <Link href={`/stylist/admin/dashboard/${item.id}`} className="font-medium hover:underline" style={{ color: '#f0ebe0' }}>{item.full_name || item.customer_email}</Link>
                  <p className="text-xs mt-1" style={{ color: '#6b5f4a' }}>{item.customer_email}</p>
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: '#c8bfae' }}>{item.country || '-'}</td>
                <td className="px-4 py-4 text-sm" style={{ color: '#c8bfae' }}>{item.selected_moodboard_label || '-'}</td>
                <td className="px-4 py-4 text-sm" style={{ color: '#c8bfae' }}>{item.completed_at ? new Date(item.completed_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-4"><ReportBadge report={item.latest_report} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
