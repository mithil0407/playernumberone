'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, ImageIcon, Loader2, RefreshCw, Send, SkipForward } from 'lucide-react';
import StyleEditIssuePage from '@/components/StyleEditIssuePage';
import type { StyleEditPageData } from '@/lib/styleEditTypes';

interface Issue {
  id: string;
  profile_id: string;
  subscription_id: string;
  week_start: string;
  issue_number: number;
  status: string;
  progress_stage: string | null;
  topic_plan: { title?: string; theme?: string; rationale?: string; focusAreas?: string[] };
  page_data: StyleEditPageData | null;
  image_urls: { heroCard?: string | null; outfitCards?: (string | null)[]; paletteCard?: string | null } | null;
  share_token: string;
  approval_state: Record<string, boolean>;
  sent_at: string | null;
  error_message: string | null;
  style_edit_client_profiles: { customer_email: string; customer_name: string | null; profile_summary: string | null } | null;
}

export default function StyleEditIssueReviewPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = use(params);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/stylist-edit/admin/issues/${issueId}`, { cache: 'no-store' });
    const data = await res.json();
    setIssue(data.issue ?? null);
    setEditText(data.issue?.page_data ? JSON.stringify(data.issue.page_data, null, 2) : '');
    setLoading(false);
  }, [issueId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!issue || !['generating', 'sending'].includes(issue.status)) return;
    const interval = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(interval);
  }, [issue, load]);

  const action = async (name: string, fn: () => Promise<Response>) => {
    setWorking(name);
    setError('');
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || `${name} failed`);
      await load();
    } finally {
      setWorking('');
    }
  };

  const saveJson = async () => {
    let parsed: StyleEditPageData;
    try {
      parsed = JSON.parse(editText) as StyleEditPageData;
    } catch {
      setError('Page data JSON is invalid.');
      return;
    }
    await action('save', () => fetch(`/api/stylist-edit/admin/issues/${issueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_data: parsed }),
    }));
  };

  const approve = async () => action('approve', () => fetch(`/api/stylist-edit/admin/issues/${issueId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved', approval_state: { issue: true, images: true } }),
  }));

  const copyLink = () => {
    if (!issue) return;
    navigator.clipboard.writeText(`${window.location.origin}/stylist/edit/${issue.share_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: '#c9a96e' }} /></div>;
  if (!issue) return <p style={{ color: '#6b5f4a' }}>Issue not found.</p>;

  return (
    <div>
      <Link href="/stylist/admin/edit" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#6b5f4a' }}><ArrowLeft size={14} /> Back to ICONIK Edit</Link>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>Edit Issue Review</p>
          <h1 className="text-2xl font-light" style={{ color: '#f0ebe0' }}>{issue.page_data?.issueTitle || issue.topic_plan?.title || `Issue ${issue.issue_number}`}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#6b5f4a' }}>{issue.style_edit_client_profiles?.customer_email} · {issue.status}{issue.progress_stage ? ` · ${issue.progress_stage}` : ''}</p>
          {issue.error_message && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{issue.error_message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => action('generate', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/generate`, { method: 'POST' }))} disabled={Boolean(working)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}>{working === 'generate' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Generate</button>
          <button onClick={() => action('images', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/generate-images`, { method: 'POST' }))} disabled={!issue.page_data || Boolean(working)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}>{working === 'images' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} Images</button>
          <button onClick={approve} disabled={!issue.page_data || Boolean(working)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#102014', color: '#4ade80' }}><Check size={14} /> Approve</button>
          <button onClick={() => action('send', () => fetch(`/api/stylist-edit/admin/issues/${issueId}/send`, { method: 'POST' }))} disabled={!['approved', 'scheduled', 'sent'].includes(issue.status) || Boolean(working)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: '#c9a96e', color: '#fff' }}>{working === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send</button>
          <button onClick={() => action('skip', () => fetch(`/api/stylist-edit/admin/issues/${issueId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'skipped' }) }))} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1e1e1e', color: '#c8bfae' }}><SkipForward size={14} /> Skip</button>
          <button onClick={copyLink} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1e1e1e', color: '#c8bfae' }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}</button>
        </div>
      </div>
      {error && <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>}

      <div className="grid xl:grid-cols-[430px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#c9a96e' }}>Topic Plan</p>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: '#c8bfae' }}>{JSON.stringify(issue.topic_plan, null, 2)}</pre>
          </div>
          <div className="rounded-2xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#c9a96e' }}>Page Data JSON</p>
              <button onClick={saveJson} disabled={Boolean(working)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#c9a96e', color: '#fff' }}>Save</button>
            </div>
            <textarea value={editText} onChange={event => setEditText(event.target.value)} rows={24} className="w-full rounded-xl p-4 text-xs font-mono outline-none" style={{ background: '#0b0b0b', color: '#f0ebe0', border: '1px solid #2a2a2a' }} />
          </div>
        </aside>
        <main className="rounded-2xl overflow-hidden border" style={{ borderColor: '#1e1e1e' }}>
          {issue.page_data ? <StyleEditIssuePage data={issue.page_data} imageUrls={issue.image_urls} /> : <div className="p-12 text-center" style={{ background: '#111111', color: '#6b5f4a' }}>No page data yet. Generate the issue first.</div>}
        </main>
      </div>
    </div>
  );
}
