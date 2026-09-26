'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';

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

interface IssueRow {
  id: string;
  status: string;
  progress_stage: string | null;
  error_message: string | null;
  share_token: string | null;
  edit_issue_number: number;
  sent_at: string | null;
  stalled: boolean;
  title: string | null;
  periodLabel: string | null;
}

interface Entitlement {
  blueprint: { id: string; share_token: string | null; sent_at: string | null } | null;
  paidCharges: number;
  owed: number;
  nextIssueNumber: number;
  blockedReason: string | null;
  issues: IssueRow[];
}

interface SubscriptionRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  status: string;
  next_billing_at: string | null;
  created_at: string;
  entitlement: Entitlement | null;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
}

function issueTone(issue: IssueRow) {
  if (issue.status === 'sent') return S.success;
  if (issue.status === 'error' || issue.stalled) return S.error;
  return S.gold;
}

function issueLabel(issue: IssueRow) {
  if (issue.status === 'sent') return `Sent ${formatDate(issue.sent_at)}`;
  if (issue.stalled) return 'Stalled';
  if (issue.status === 'error') return 'Failed';
  if (issue.progress_stage === 'writing_edit' || issue.progress_stage === 'resuming') return 'Writing…';
  if (issue.progress_stage === 'generating_images') return 'Shooting looks…';
  return 'Ready to review';
}

export default function ManEditAdminPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
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

  // Keep polling while any draft is still being written or shot.
  const working = rows.some(row => row.entitlement?.issues.some(issue => issue.progress_stage && !issue.stalled));
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => { void load(); }, 8000);
    return () => clearInterval(timer);
  }, [working, load]);

  const stats = useMemo(() => {
    const active = rows.filter(row => row.status === 'active');
    const issues = active.flatMap(row => row.entitlement?.issues ?? []);
    return {
      active: active.length,
      owed: active.reduce((sum, row) => sum + (row.entitlement && !row.entitlement.blockedReason ? row.entitlement.owed : 0), 0),
      review: issues.filter(issue => issue.status !== 'sent' && !issue.progress_stage).length,
      sent: issues.filter(issue => issue.status === 'sent').length,
    };
  }, [rows]);

  const createIssue = async (row: SubscriptionRow, allowAhead = false) => {
    setBusy(row.id);
    setMessage('');
    try {
      const res = await fetch('/api/man-edit/admin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: row.id, allow_ahead: allowAhead }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(`${row.customer_email}: ${data.error}`);
      else setMessage(data.created
        ? `Writing Issue ${data.issueNumber} for ${row.customer_email} — about 4 minutes including photos.`
        : `${row.customer_email} already has Issue ${data.issueNumber} open.`);
      await load();
    } finally {
      setBusy('');
    }
  };

  const resume = async (issue: IssueRow) => {
    setBusy(issue.id);
    try {
      await fetch(`/api/man-edit/admin/issues/${issue.id}`, { method: 'POST' });
      await load();
    } finally {
      setBusy('');
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: S.muted }}>Iconik Man</p>
          <h1 className="text-2xl font-semibold" style={{ color: S.ink }}>The Iconik Edit</h1>
          <p className="text-sm mt-1" style={{ color: S.muted }}>One issue per paid month. Drafts start automatically on each charge; nothing is sent until you review it.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm self-start" style={{ background: S.panel, color: S.muted, border: `1px solid ${S.border}` }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {[
          ['Active subscribers', stats.active],
          ['Issues owed', stats.owed],
          ['Ready to review', stats.review],
          ['Issues sent', stats.sent],
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
          <option value="active">Active</option>
          <option value="">All statuses</option>
          <option value="pending">Pending (never paid)</option>
          <option value="cancelled">Cancelled</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="rounded-xl border overflow-x-auto" style={{ background: S.panel, borderColor: S.border }}>
        <table className="w-full min-w-[860px]">
          <thead>
            <tr style={{ background: '#111' }}>
              {['Subscriber', 'Blueprint', 'Paid / owed', 'Issues', 'Next'].map(head => (
                <th key={head} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.18em]" style={{ color: S.muted }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: S.muted }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: S.muted }}>No subscribers match.</td></tr>
            ) : rows.map(row => {
              const ent = row.entitlement;
              const open = ent?.issues.find(issue => issue.status !== 'sent');
              return (
                <tr key={row.id} className="border-t align-top" style={{ borderColor: S.border }}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium" style={{ color: S.ink }}>{row.customer_name || row.customer_email}</p>
                    <p className="text-xs mt-1" style={{ color: S.muted }}>{row.customer_email}</p>
                    <p className="text-xs mt-1 capitalize" style={{ color: row.status === 'active' ? S.success : S.muted }}>
                      {row.status}{row.next_billing_at && row.status === 'active' ? ` · renews ${formatDate(row.next_billing_at)}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {ent?.blueprint ? (
                      <a
                        href={`/man/report/${ent.blueprint.share_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: S.gold }}
                      >
                        Sent {formatDate(ent.blueprint.sent_at)} <ExternalLink size={11} />
                      </a>
                    ) : (
                      <p className="text-xs" style={{ color: row.status === 'active' ? S.error : S.muted }}>
                        {row.status === 'active' ? 'No sent Blueprint' : '—'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {ent ? (
                      <>
                        <p className="text-sm" style={{ color: S.ink }}>{ent.paidCharges} paid</p>
                        <p className="text-xs mt-1" style={{ color: ent.owed > 0 ? S.error : S.muted }}>{ent.owed} owed</p>
                      </>
                    ) : <p className="text-xs" style={{ color: S.muted }}>—</p>}
                  </td>
                  <td className="px-4 py-4">
                    {ent?.issues.length ? (
                      <ul className="space-y-2">
                        {ent.issues.map(issue => (
                          <li key={issue.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Link href={`/man/admin/edit/${issue.id}`} className="text-sm hover:underline" style={{ color: S.ink }}>
                              #{issue.edit_issue_number} {issue.title || issue.periodLabel || ''}
                            </Link>
                            <span className="text-xs inline-flex items-center gap-1" style={{ color: issueTone(issue) }}>
                              {issue.progress_stage && !issue.stalled && <Loader2 size={11} className="animate-spin" />}
                              {issueLabel(issue)}
                            </span>
                            {(issue.stalled || issue.status === 'error') && (
                              <button
                                disabled={Boolean(busy)}
                                onClick={() => resume(issue)}
                                className="inline-flex items-center gap-1 text-xs underline disabled:opacity-40"
                                style={{ color: S.gold }}
                              >
                                <RotateCcw size={11} /> Resume
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-xs" style={{ color: S.muted }}>None yet</p>}
                  </td>
                  <td className="px-4 py-4">
                    {row.status !== 'active' || !ent ? null : ent.blockedReason ? (
                      <p className="text-xs max-w-[180px]" style={{ color: S.muted }}>{ent.blockedReason}</p>
                    ) : open ? (
                      <Link href={`/man/admin/edit/${open.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#1e1a14', color: S.gold }}>
                        Review #{open.edit_issue_number}
                      </Link>
                    ) : (
                      <button
                        disabled={Boolean(busy)}
                        onClick={() => createIssue(row, ent.owed <= 0)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                        style={{ background: ent.owed > 0 ? S.gold : '#1e1a14', color: ent.owed > 0 ? '#090909' : S.gold }}
                        title={ent.owed > 0 ? undefined : 'Every paid month already has an issue — this makes an extra one'}
                      >
                        {busy === row.id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        {ent.owed > 0 ? `Create Issue ${ent.nextIssueNumber}` : `Extra Issue ${ent.nextIssueNumber}`}
                      </button>
                    )}
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
