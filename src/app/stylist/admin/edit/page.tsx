'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarPlus, CheckCircle2, Clock, FileCheck, Loader2, RefreshCw, Search, Sparkles, Users } from 'lucide-react';

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
  error: '#C4645A',
  success: '#5A8B6A',
};

interface SubscriptionRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  plan_type: string;
  created_at: string;
  style_edit_client_profiles?: Array<{ id: string; status: string; profile_summary: string | null; next_issue_at: string | null; error_message: string | null }> | { id: string; status: string; profile_summary: string | null; next_issue_at: string | null; error_message: string | null } | null;
  style_edit_issues?: Array<{ id: string; status: string; week_start: string; issue_number: number; topic_plan: { title?: string }; sent_at: string | null; created_at: string }>;
}

function profileOf(row: SubscriptionRow) {
  return Array.isArray(row.style_edit_client_profiles) ? row.style_edit_client_profiles[0] : row.style_edit_client_profiles;
}

function latestIssue(row: SubscriptionRow) {
  return [...(row.style_edit_issues ?? [])].sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime())[0] ?? null;
}

function getWeekStart() {
  const date = new Date();
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = next.getUTCDay();
  next.setUTCDate(next.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return next.toISOString().slice(0, 10);
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
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

function issueBadgeColor(status: string) {
  if (status === 'sent') return S.success;
  if (status === 'error') return S.error;
  if (['draft_ready', 'in_review', 'approved'].includes(status)) return S.slate;
  if (status === 'generating') return S.gold;
  return S.muted;
}

export default function StyleEditAdminPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search ? { search } : {}), ...(status ? { status } : {}) });
    const res = await fetch(`/api/stylist-edit/admin/subscriptions?${params}`, { cache: 'no-store' });
    const data = await res.json();
    setRows(data.subscriptions ?? []);
    setLoading(false);
  }, [search, status]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const issues = rows.map(latestIssue).filter(Boolean);
    return {
      active: rows.filter(row => row.status === 'active').length,
      needsGeneration: rows.filter(row => {
        const issue = latestIssue(row);
        return !issue || ['pending_profile', 'topic_ready'].includes(issue.status);
      }).length,
      generating: issues.filter(issue => issue?.status === 'generating').length,
      drafts: issues.filter(issue => ['draft_ready', 'in_review'].includes(issue?.status ?? '')).length,
      approved: issues.filter(issue => issue?.status === 'approved' || issue?.status === 'scheduled').length,
      sent: issues.filter(issue => issue?.status === 'sent').length,
      errors: issues.filter(issue => issue?.status === 'error').length,
    };
  }, [rows]);

  const generateWeek = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const res = await fetch('/api/stylist-edit/admin/generate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: getWeekStart(), generate: true }),
      });
      const data = await res.json();
      setMessage(`Created ${data.created?.length ?? 0} issue(s). Skipped ${data.skipped?.length ?? 0}.`);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>The ICONIK Edit</div>
          <h1 className="iconik-display" style={{ fontSize: '28px', color: S.ink }}>Weekly Edit Monitor</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body transition"
            style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={generateWeek}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
            style={{ background: S.slateDeep, color: S.bg }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
            Generate Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-7 gap-4 mb-7">
        <Stat label="Active subscribers" value={stats.active} icon={Users} color={S.gold} />
        <Stat label="Needs generation" value={stats.needsGeneration} icon={Sparkles} color={S.slateDeep} />
        <Stat label="Generating" value={stats.generating} icon={RefreshCw} color={S.gold} />
        <Stat label="Needs review" value={stats.drafts} icon={Clock} color={S.slate} />
        <Stat label="Approved" value={stats.approved} icon={CheckCircle2} color={S.success} />
        <Stat label="Sent" value={stats.sent} icon={FileCheck} color={S.success} />
        <Stat label="Errors" value={stats.errors} icon={AlertCircle} color={S.error} />
      </div>

      {message && <p className="luxury-body text-sm mb-4" style={{ color: S.slate }}>{message}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
          />
        </div>
        <select
          value={status}
          onChange={event => setStatus(event.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none luxury-body"
          style={{ background: S.card, border: `1px solid ${S.border}`, color: S.ink }}
        >
          <option value="">All subscriptions</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="halted">Halted</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: S.bg, borderColor: S.border }}>
        <table className="w-full">
          <thead style={{ background: S.card }}>
            <tr>
              {['Subscriber', 'Profile', 'Subscription', 'Latest Issue', 'Sent'].map(head => (
                <th key={head} className="text-left px-4 py-3 iconik-micro" style={{ color: S.muted }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center luxury-body text-sm" style={{ color: S.muted }}>Loading…</td></tr>
            ) : rows.map(row => {
              const profile = profileOf(row);
              const issue = latestIssue(row);
              return (
                <tr key={row.id} className="border-t" style={{ borderColor: S.rowBorder }}>
                  <td className="px-4 py-4">
                    <Link href={`/stylist/admin/edit/clients/${row.id}`} className="luxury-body hover:underline" style={{ color: S.ink, fontWeight: 500 }}>
                      {row.customer_name || row.customer_email}
                    </Link>
                    <p className="luxury-body text-xs mt-0.5" style={{ color: S.muted, fontWeight: 300 }}>{row.customer_email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="iconik-mono capitalize" style={{ fontSize: '11px', color: profile?.status === 'ready' ? S.success : S.muted }}>
                      {profile?.status ?? 'not built'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="iconik-mono capitalize" style={{ fontSize: '11px', color: row.status === 'active' ? S.success : S.muted }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {issue ? (
                      <Link href={`/stylist/admin/edit/issues/${issue.id}`} className="luxury-body text-sm hover:underline" style={{ color: S.ink }}>
                        {issue.topic_plan?.title || `Issue ${issue.issue_number}`}
                        <span className="iconik-mono ml-2 capitalize" style={{ fontSize: '10px', color: issueBadgeColor(issue.status) }}>
                          {issue.status}
                        </span>
                      </Link>
                    ) : (
                      <span className="luxury-body text-sm" style={{ color: S.muted }}>No issue</span>
                    )}
                  </td>
                  <td className="px-4 py-4 iconik-mono" style={{ fontSize: '11px', color: S.muted }}>
                    {issue?.sent_at ? new Date(issue.sent_at).toLocaleDateString() : '—'}
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
