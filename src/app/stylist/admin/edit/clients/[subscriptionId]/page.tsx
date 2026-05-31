'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Zap } from 'lucide-react';

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
    <div className="rounded-2xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#c9a96e' }}>{title}</p>
      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[420px]" style={{ color: '#c8bfae' }}>{typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)}</pre>
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

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: '#c9a96e' }} /></div>;
  if (!subscription) return <p style={{ color: '#6b5f4a' }}>Subscription not found.</p>;

  const profile = profileOf(subscription);
  const issues = [...(subscription.style_edit_issues ?? [])].sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime());

  return (
    <div className="max-w-6xl">
      <Link href="/stylist/admin/edit" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#6b5f4a' }}><ArrowLeft size={14} /> Back to ICONIK Edit</Link>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>Edit Subscriber</p>
          <h1 className="text-2xl font-light" style={{ color: '#f0ebe0' }}>{subscription.customer_name || subscription.customer_email}</h1>
          <p className="text-sm mt-1" style={{ color: '#6b5f4a' }}>{subscription.customer_email} · {subscription.status}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={rebuild} disabled={working} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}>{working ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Rebuild Profile</button>
          <button onClick={generateIssue} disabled={working} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#c9a96e', color: '#fff' }}><Zap size={14} /> Generate Week</button>
        </div>
      </div>
      {message && <p className="text-sm mb-4" style={{ color: '#c9a96e' }}>{message}</p>}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <DataBlock title="Subscription" value={{ id: subscription.id, status: subscription.status, plan_type: subscription.plan_type, customer_phone: subscription.customer_phone, created_at: subscription.created_at }} />
        <DataBlock title="Profile Status" value={profile ?? { status: 'not built' }} />
        <DataBlock title="Issue History" value={issues.map(issue => ({ id: issue.id, status: issue.status, week_start: issue.week_start, title: issue.topic_plan?.title, sent_at: issue.sent_at }))} />
      </div>

      <div className="rounded-2xl border overflow-hidden mb-6" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
        <table className="w-full">
          <thead style={{ background: '#0f0f0f' }}><tr>{['Issue', 'Week', 'Status', 'Topic'].map(head => <th key={head} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide" style={{ color: '#6b5f4a' }}>{head}</th>)}</tr></thead>
          <tbody>
            {issues.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: '#6b5f4a' }}>No issues yet.</td></tr> : issues.map(issue => (
              <tr key={issue.id} className="border-t" style={{ borderColor: '#181818' }}>
                <td className="px-4 py-4"><Link href={`/stylist/admin/edit/issues/${issue.id}`} className="hover:underline" style={{ color: '#f0ebe0' }}>Issue {issue.issue_number}</Link></td>
                <td className="px-4 py-4 text-sm" style={{ color: '#c8bfae' }}>{issue.week_start}</td>
                <td className="px-4 py-4 text-sm capitalize" style={{ color: issue.status === 'error' ? '#f87171' : '#c8bfae' }}>{issue.status}</td>
                <td className="px-4 py-4 text-sm" style={{ color: '#c9a96e' }}>{issue.topic_plan?.title || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataBlock title="Personalization Profile" value={profile?.personalization_profile ?? {}} />
    </div>
  );
}
