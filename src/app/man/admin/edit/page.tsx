'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';

const S = {
  bg: '#090909',
  panel: '#0f0f0f',
  row: '#141414',
  border: '#1e1e1e',
  ink: '#f0ebe0',
  muted: '#6b5f4a',
  gold: '#c9a96e',
  success: '#5A8B6A',
  error: '#C4645A',
};

interface Recommendation {
  id: string;
  status: string;
  month_start: string;
  issue_number: number;
  page_data?: { title?: string };
  sent_at: string | null;
  created_at: string;
}

interface SubscriptionRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  report_id: string | null;
  created_at: string;
  man_edit_profiles?: Array<{ id: string; status: string; profile_summary: string | null; error_message: string | null }> | null;
  man_edit_monthly_recommendations?: Recommendation[];
}

function latestRecommendation(row: SubscriptionRow) {
  return [...(row.man_edit_monthly_recommendations ?? [])]
    .sort((a, b) => new Date(b.month_start).getTime() - new Date(a.month_start).getTime())[0] ?? null;
}

function monthStart() {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export default function ManEditAdminPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search ? { search } : {}), ...(status ? { status } : {}) });
    const res = await fetch(`/api/man-edit/admin/subscriptions?${params}`, { cache: 'no-store' });
    const data = await res.json();
    setRows(data.subscriptions ?? []);
    setLoading(false);
  }, [search, status]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const latest = rows.map(latestRecommendation).filter(Boolean);
    return {
      active: rows.filter(row => row.status === 'active').length,
      linked: rows.filter(row => row.report_id).length,
      drafts: latest.filter(item => item?.status === 'draft_ready' || item?.status === 'in_review').length,
      approved: latest.filter(item => item?.status === 'approved' || item?.status === 'sent').length,
    };
  }, [rows]);

  const generate = async (subscriptionId?: string) => {
    setGenerating(subscriptionId || 'all');
    setMessage('');
    try {
      const res = await fetch('/api/man-edit/admin/generate-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_start: monthStart(), ...(subscriptionId ? { subscription_id: subscriptionId } : {}) }),
      });
      const data = await res.json();
      setMessage(`Created ${data.created?.length ?? 0} monthly edit(s). Skipped ${data.skipped?.length ?? 0}.`);
      await load();
    } finally {
      setGenerating('');
    }
  };

  const approve = async (recommendationId: string) => {
    setGenerating(recommendationId);
    try {
      await fetch(`/api/man-edit/admin/recommendations/${recommendationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      await load();
    } finally {
      setGenerating('');
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: S.muted }}>Iconik Man</p>
          <h1 className="text-2xl font-semibold" style={{ color: S.ink }}>Edit Subscribers</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: S.panel, color: S.muted, border: `1px solid ${S.border}` }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button disabled={Boolean(generating)} onClick={() => generate()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm disabled:opacity-50" style={{ background: S.gold, color: '#090909' }}>
            {generating === 'all' ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
            Generate Month
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-7">
        {[
          ['Active', stats.active],
          ['Report linked', stats.linked],
          ['Needs review', stats.drafts],
          ['Approved', stats.approved],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: S.panel, borderColor: S.border }}>
            <p className="text-2xl font-semibold" style={{ color: S.ink }}>{value}</p>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: S.muted }}>{label}</p>
          </div>
        ))}
      </div>

      {message && <p className="text-sm mb-4" style={{ color: S.gold }}>{message}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search email"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: S.panel, border: `1px solid ${S.border}`, color: S.ink }}
          />
        </div>
        <select
          value={status}
          onChange={event => setStatus(event.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: S.panel, border: `1px solid ${S.border}`, color: S.ink }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: S.panel, borderColor: S.border }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111' }}>
              {['Subscriber', 'Access', 'Latest monthly edit', 'Actions'].map(head => (
                <th key={head} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: S.muted }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: S.muted }}>Loading...</td></tr>
            ) : rows.map(row => {
              const latest = latestRecommendation(row);
              return (
                <tr key={row.id} className="border-t" style={{ borderColor: S.border }}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium" style={{ color: S.ink }}>{row.customer_name || row.customer_email}</p>
                    <p className="text-xs mt-1" style={{ color: S.muted }}>{row.customer_email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs capitalize" style={{ color: row.status === 'active' ? S.success : S.muted }}>{row.status}</p>
                    <p className="text-xs mt-1" style={{ color: row.report_id ? S.gold : S.muted }}>{row.report_id ? 'Report linked' : 'Waiting for report'}</p>
                  </td>
                  <td className="px-4 py-4">
                    {latest ? (
                      <>
                        <p className="text-sm" style={{ color: S.ink }}>{latest.page_data?.title || `Edit ${latest.issue_number}`}</p>
                        <p className="text-xs capitalize mt-1" style={{ color: latest.status === 'approved' || latest.status === 'sent' ? S.success : S.gold }}>{latest.status}</p>
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: S.muted }}>No monthly edit</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={Boolean(generating) || !row.report_id || row.status !== 'active'}
                        onClick={() => generate(row.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                        style={{ background: '#1e1a14', color: S.gold }}
                      >
                        {generating === row.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        Generate
                      </button>
                      {latest && ['draft_ready', 'in_review'].includes(latest.status) && (
                        <button
                          disabled={Boolean(generating)}
                          onClick={() => approve(latest.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                          style={{ background: '#142018', color: S.success }}
                        >
                          {generating === latest.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
