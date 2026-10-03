'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { Avatar, Button, Pill, Segmented, clientDisplayName, type PillTone } from '@/components/manAdmin/ui';

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

function issueTone(issue: IssueRow): PillTone {
  if (issue.status === 'sent') return 'green';
  if (issue.status === 'error' || issue.stalled) return 'red';
  if (issue.progress_stage) return 'blue';
  return 'accent';
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
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="ma-eyebrow mb-2">Monthly subscription</div>
          <h1 className="ma-title">The ICONIK <em>Edit</em></h1>
          <p className="ma-muted mt-2 text-[15px]">
            {stats.active} active
            {stats.owed > 0 && <> · <span style={{ color: 'var(--ma-accent)', fontWeight: 600 }}>{stats.owed} issue{stats.owed === 1 ? '' : 's'} owed</span></>}
            {stats.review > 0 && <> · {stats.review} to review</>}
            {' · '}{stats.sent} sent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block w-full sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ma-faint" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search email"
              className="ma-input"
              style={{ borderRadius: 999, paddingLeft: 40 }}
            />
          </label>
          <Button iconOnly icon={<RefreshCw size={15} />} onClick={() => void load()} aria-label="Refresh" title="Refresh" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'pending', label: 'Never paid' },
            { value: 'paused', label: 'Paused' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: '', label: 'All' },
          ]}
        />
        <p className="ma-faint text-[13px]">Drafts start on each charge. Nothing is sent until you review it.</p>
      </div>

      {message && <div className="mb-4 rounded-2xl px-5 py-3 text-[14px]" style={{ background: 'var(--ma-accent-soft)', color: 'var(--ma-accent)' }}>{message}</div>}

      <div className="ma-card overflow-hidden">
        {loading && rows.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="ma-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="flex items-center gap-3">
                <div className="ma-skeleton h-[38px] w-[38px] rounded-full" />
                <div className="flex-1 space-y-2"><div className="ma-skeleton h-3.5 w-48" /><div className="ma-skeleton h-3 w-32" /></div>
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="ma-h2">No subscribers here</div>
            <p className="ma-muted mt-1 text-sm">Try another filter.</p>
          </div>
        ) : rows.map(row => {
          const ent = row.entitlement;
          const open = ent?.issues.find(issue => issue.status !== 'sent');
          const name = row.customer_name?.trim().includes(' ') ? row.customer_name.trim() : clientDisplayName(row.customer_email);
          return (
            <div key={row.id} className="ma-row items-start" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1.6fr) auto' }}>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={name} />
                <div className="min-w-0">
                  <div className="truncate text-[15px]" style={{ fontWeight: 600 }}>{name}</div>
                  <div className="ma-faint truncate text-[13px]">
                    {row.status === 'active' && row.next_billing_at ? `Renews ${formatDate(row.next_billing_at)}` : row.status.replace(/^\w/, char => char.toUpperCase())}
                    {ent ? ` · ${ent.paidCharges} paid` : ''}
                    {ent?.blueprint?.share_token && (
                      <>
                        {' · '}
                        <a href={`/man/report/${ent.blueprint.share_token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline">
                          Blueprint <ExternalLink size={11} />
                        </a>
                      </>
                    )}
                    {!ent?.blueprint && row.status === 'active' && <span style={{ color: 'var(--ma-red)' }}> · No sent Blueprint</span>}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-1.5 pt-1.5">
                {ent?.issues.length ? ent.issues.map(issue => (
                  <span key={issue.id} className="inline-flex items-center gap-1">
                    <Link href={`/man/admin/edit/${issue.id}`} title={issue.title || issue.periodLabel || undefined}>
                      <Pill tone={issueTone(issue)} live={Boolean(issue.progress_stage && !issue.stalled)} dot={!(issue.progress_stage && !issue.stalled)}>
                        #{issue.edit_issue_number} · {issueLabel(issue)}
                      </Pill>
                    </Link>
                    {(issue.stalled || issue.status === 'error') && (
                      <Button size="sm" variant="ghost" iconOnly icon={<RotateCcw size={13} />} disabled={Boolean(busy)} loading={busy === issue.id} onClick={() => resume(issue)} aria-label="Resume" title="Resume" />
                    )}
                  </span>
                )) : <span className="ma-faint text-[13px]">No issues yet</span>}
              </div>

              <div className="flex justify-end">
                {row.status !== 'active' || !ent ? null : ent.blockedReason ? (
                  <p className="ma-faint max-w-[200px] text-right text-[12px]">{ent.blockedReason}</p>
                ) : open ? (
                  <Link href={`/man/admin/edit/${open.id}`} className="ma-btn ma-btn--dark ma-btn--sm">
                    Review #{open.edit_issue_number} <ArrowRight size={13} />
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant={ent.owed > 0 ? 'primary' : 'secondary'}
                    icon={<Plus size={13} />}
                    loading={busy === row.id}
                    disabled={Boolean(busy)}
                    onClick={() => createIssue(row, ent.owed <= 0)}
                    title={ent.owed > 0 ? undefined : 'Every paid month already has an issue — this makes an extra one'}
                  >
                    {ent.owed > 0 ? `Create issue ${ent.nextIssueNumber}` : `Extra issue ${ent.nextIssueNumber}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
