'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Zap } from 'lucide-react';

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

interface SubscriptionDetail {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  plan_type: string;
  created_at: string;
  style_edit_client_profiles?: Array<Record<string, unknown>> | Record<string, unknown> | null;
  style_edit_issues?: Array<{ id: string; status: string; week_start: string; issue_number: number; topic_plan: { title?: string; rationale?: string }; sent_at: string | null }>;
}

function profileOf(row: SubscriptionDetail | null) {
  const profile = row?.style_edit_client_profiles;
  return Array.isArray(profile) ? profile[0] : profile;
}

function DataBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: S.card, borderColor: S.border }}>
      <div className="iconik-micro mb-3" style={{ color: S.muted }}>{title}</div>
      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[420px] font-mono" style={{ color: S.muted }}>
        {typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}

function ContextCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: S.bg, borderColor: S.rowBorder }}>
      <p className="iconik-micro mb-2" style={{ color: S.muted }}>{title}</p>
      <p className="luxury-body text-sm leading-6" style={{ color: S.ink, fontWeight: 300 }}>
        {typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}
      </p>
    </div>
  );
}

export default function StyleEditClientPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = use(params);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/stylist-edit/admin/subscriptions', { cache: 'no-store' });
    const data = await res.json();
    const found = (data.subscriptions ?? []).find((row: SubscriptionDetail) => row.id === subscriptionId) ?? null;
    setSubscription(found);
    setLoading(false);
  }, [subscriptionId]);

  useEffect(() => { void load(); }, [load]);

  const rebuild = async () => {
    setWorking(true);
    setMessage('');
    try {
      const res = await fetch(`/api/stylist-edit/admin/profiles/${subscriptionId}/rebuild`, { method: 'POST' });
      const data = await res.json();
      setMessage(res.ok ? `Profile ${data.profile?.status || 'rebuilt'}.` : data.error || 'Profile rebuild failed');
      await load();
    } finally {
      setWorking(false);
    }
  };

  const generateIssue = async () => {
    setWorking(true);
    setMessage('');
    try {
      await fetch('/api/stylist-edit/admin/generate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId, generate: true }),
      });
      setMessage('Weekly generation started.');
      await load();
    } finally {
      setWorking(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin" style={{ color: S.muted }} />
    </div>
  );
  if (!subscription) return <p className="luxury-body" style={{ color: S.muted }}>Subscription not found.</p>;

  const profile = profileOf(subscription);
  const issues = [...(subscription.style_edit_issues ?? [])].sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime());
  const latestIssue = issues[0] ?? null;

  return (
    <div className="max-w-6xl">
      <Link href="/stylist/admin/edit" className="inline-flex items-center gap-2 text-sm mb-6 luxury-body" style={{ color: S.muted }}>
        <ArrowLeft size={14} /> Back to ICONIK Edit
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>Edit Subscriber</div>
          <h1 className="iconik-display" style={{ fontSize: '26px', color: S.ink }}>{subscription.customer_name || subscription.customer_email}</h1>
          <p className="luxury-body text-sm mt-1" style={{ color: S.muted, fontWeight: 300 }}>
            {subscription.customer_email} · {subscription.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={rebuild}
            disabled={working}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
            style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
          >
            {working ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Rebuild Profile
          </button>
          <button
            onClick={generateIssue}
            disabled={working}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
            style={{ background: S.slateDeep, color: S.bg }}
          >
            <Zap size={14} /> Generate Week
          </button>
        </div>
      </div>

      {message && <p className="luxury-body text-sm mb-4" style={{ color: S.slate }}>{message}</p>}

      <div className="rounded-2xl border p-5 mb-6" style={{ background: S.card, borderColor: S.border }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="iconik-micro mb-1" style={{ color: S.muted }}>Review Context</div>
            <p className="luxury-body text-sm" style={{ color: S.ink, fontWeight: 500 }}>
              {latestIssue ? `Latest issue ${latestIssue.issue_number} - ${latestIssue.status.replace(/_/g, ' ')}` : 'No issue generated yet'}
            </p>
          </div>
          {latestIssue && (
            <Link href={`/stylist/admin/edit/issues/${latestIssue.id}`} className="px-4 py-2 rounded-xl text-sm luxury-body transition" style={{ background: S.ink, color: S.bg }}>
              Review Latest Issue
            </Link>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <ContextCard title="Profile status" value={profile?.status ?? 'not built'} />
          <ContextCard title="Next issue" value={profile?.next_issue_at ?? latestIssue?.week_start ?? '—'} />
          <ContextCard title="Profile summary" value={profile?.profile_summary ?? '—'} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <DataBlock title="Subscription" value={{ id: subscription.id, status: subscription.status, plan_type: subscription.plan_type, customer_phone: subscription.customer_phone, created_at: subscription.created_at }} />
        <DataBlock title="Profile Status" value={profile ?? { status: 'not built' }} />
        <DataBlock title="Issue History" value={issues.map(issue => ({ id: issue.id, status: issue.status, week_start: issue.week_start, title: issue.topic_plan?.title, sent_at: issue.sent_at }))} />
      </div>

      <div className="rounded-2xl border overflow-hidden mb-6" style={{ background: S.bg, borderColor: S.border }}>
        <table className="w-full">
          <thead style={{ background: S.card }}>
            <tr>
              {['Issue', 'Week', 'Status', 'Topic'].map(head => (
                <th key={head} className="text-left px-4 py-3 iconik-micro" style={{ color: S.muted }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center luxury-body text-sm" style={{ color: S.muted }}>No issues yet.</td>
              </tr>
            ) : issues.map(issue => (
              <tr key={issue.id} className="border-t" style={{ borderColor: S.rowBorder }}>
                <td className="px-4 py-4">
                  <Link href={`/stylist/admin/edit/issues/${issue.id}`} className="luxury-body hover:underline" style={{ color: S.ink, fontWeight: 500 }}>
                    Issue {issue.issue_number}
                  </Link>
                </td>
                <td className="px-4 py-4 iconik-mono" style={{ fontSize: '11px', color: S.muted }}>{issue.week_start}</td>
                <td className="px-4 py-4 iconik-mono capitalize" style={{ fontSize: '11px', color: issue.status === 'error' ? S.error : issue.status === 'sent' ? S.success : S.muted }}>
                  {issue.status}
                </td>
                <td className="px-4 py-4 luxury-body text-sm" style={{ color: S.muted, fontWeight: 300 }}>{issue.topic_plan?.title || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataBlock title="Personalization Profile" value={profile?.personalization_profile ?? {}} />
    </div>
  );
}
