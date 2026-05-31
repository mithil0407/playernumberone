'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarPlus, CheckCircle2, Clock, Loader2, RefreshCw, Search, Users } from 'lucide-react';

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
    <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}><Icon size={18} style={{ color }} /></div>
      <div><p className="text-2xl font-bold" style={{ color: '#f0ebe0' }}>{value}</p><p className="text-[11px] uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{label}</p></div>
    </div>
  );
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
      drafts: issues.filter(issue => ['draft_ready', 'in_review'].includes(issue?.status ?? '')).length,
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
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>THE ICONIK EDIT</p>
          <h1 className="text-3xl font-light tracking-wide" style={{ color: '#f0ebe0' }}>Weekly Edit Monitor</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}><RefreshCw size={14} /> Refresh</button>
          <button onClick={generateWeek} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#c9a96e', color: '#fff' }}>{generating ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />} Generate Week</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <Stat label="Active subscribers" value={stats.active} icon={Users} color="#c9a96e" />
        <Stat label="Drafts ready" value={stats.drafts} icon={Clock} color="#60a5fa" />
        <Stat label="Sent" value={stats.sent} icon={CheckCircle2} color="#22c55e" />
        <Stat label="Errors" value={stats.errors} icon={AlertCircle} color="#f87171" />
      </div>
      {message && <p className="text-sm mb-4" style={{ color: '#c9a96e' }}>{message}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6b5f4a' }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111111', border: '1px solid #1e1e1e', color: '#f0ebe0' }} />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#111111', border: '1px solid #1e1e1e', color: '#c8bfae' }}>
          <option value="">All subscriptions</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="halted">Halted</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
        <table className="w-full">
          <thead style={{ background: '#0f0f0f' }}>
            <tr>{['Subscriber', 'Profile', 'Subscription', 'Latest Issue', 'Sent'].map(head => <th key={head} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#6b5f4a' }}>Loading...</td></tr> : rows.map(row => {
              const profile = profileOf(row);
              const issue = latestIssue(row);
              return (
                <tr key={row.id} className="border-t" style={{ borderColor: '#181818' }}>
                  <td className="px-4 py-4"><Link href={`/stylist/admin/edit/clients/${row.id}`} className="font-medium hover:underline" style={{ color: '#f0ebe0' }}>{row.customer_name || row.customer_email}</Link><p className="text-xs mt-1" style={{ color: '#6b5f4a' }}>{row.customer_email}</p></td>
                  <td className="px-4 py-4 text-sm" style={{ color: profile?.status === 'ready' ? '#22c55e' : '#f59e0b' }}>{profile?.status ?? 'not built'}</td>
                  <td className="px-4 py-4 text-sm capitalize" style={{ color: row.status === 'active' ? '#22c55e' : '#c8bfae' }}>{row.status}</td>
                  <td className="px-4 py-4">{issue ? <Link href={`/stylist/admin/edit/issues/${issue.id}`} className="text-sm hover:underline" style={{ color: '#c9a96e' }}>{issue.topic_plan?.title || `Issue ${issue.issue_number}`}<span className="ml-2 capitalize" style={{ color: '#6b5f4a' }}>({issue.status})</span></Link> : <span className="text-sm" style={{ color: '#6b5f4a' }}>No issue</span>}</td>
                  <td className="px-4 py-4 text-sm" style={{ color: '#c8bfae' }}>{issue?.sent_at ? new Date(issue.sent_at).toLocaleDateString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
