'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCheck, Copy, ImageIcon, Loader2, RefreshCw, Send } from 'lucide-react';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import type { BlueprintPage, LegacyStylistBlueprintReportData, StylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import type { ResolvedStylistBlueprintImageUrls, StylistBlueprintImageGroup } from '@/lib/stylistBlueprintImageGenerator';

interface Report {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: StylistBlueprintReportData | LegacyStylistBlueprintReportData | null;
  image_urls: ResolvedStylistBlueprintImageUrls | null;
  share_token: string;
  section_approvals: Record<string, boolean>;
  submission_id: string;
  updated_at: string;
  error_message: string | null;
  sent_at: string | null;
  stylist_intake_responses: { customer_email: string; customer_phone: string | null; full_name: string | null } | null;
}

const IMAGE_GROUPS: Array<{ value: StylistBlueprintImageGroup; label: string }> = [
  { value: 'all', label: 'All missing' },
  { value: 'cover', label: 'Cover' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'capsule_1', label: 'Capsule 1' },
  { value: 'capsule_2', label: 'Capsule 2' },
  { value: 'capsule_3', label: 'Capsule 3' },
  { value: 'capsule_4', label: 'Capsule 4' },
  { value: 'closing', label: 'Closing' },
];

function isVersionedStylistBlueprintReportData(data: unknown): data is StylistBlueprintReportData {
  return Boolean(data && typeof data === 'object' && 'version' in data && (data as { version?: string }).version === 'women_blueprint_28_v1');
}

function stageLabel(stage: string | null) {
  if (!stage) return 'Ready';
  return stage.replace(/_/g, ' ');
}

function pageGroup(pageNumber: number) {
  if (pageNumber <= 3) return 'Opening';
  if (pageNumber <= 8) return 'Act 1';
  if (pageNumber <= 12) return 'Act 2';
  if (pageNumber <= 25) return 'Act 3';
  return 'Closing';
}

export default function StylistBlueprintAdminReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [editJson, setEditJson] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGroup, setImageGroup] = useState<StylistBlueprintImageGroup>('all');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [imageCounts, setImageCounts] = useState<Record<string, { done: number; total: number }> | null>(null);

  const load = useCallback(async (fresh = false) => {
    const res = await fetch(`/api/stylist-blueprint/${reportId}${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.report) setReport(data.report);
    setLoading(false);
  }, [reportId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (report?.status !== 'generating' && !report?.progress_stage) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const status = await res.json();
      setImageCounts(status.imageCounts ?? null);
      setReport(prev => prev ? {
        ...prev,
        status: status.status,
        progress_stage: status.progressStage,
        error_message: status.errorMessage,
      } : prev);
      if (status.status !== 'generating' && !status.progressStage) void load(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [report?.status, report?.progress_stage, reportId, load]);

  useEffect(() => {
    if (report?.status === 'draft_ready') {
      fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_review' }),
      }).then(() => load(true)).catch(() => {});
    }
  }, [report?.status, reportId, load]);

  const versioned = report?.report_data && isVersionedStylistBlueprintReportData(report.report_data) ? report.report_data : null;
  const pages = useMemo(() => versioned?.pages ?? [], [versioned]);
  const activePage = pages.find(page => page.page_number === activePageNumber) ?? pages[0] ?? null;
  const allApproved = versioned ? Array.from({ length: 28 }, (_, index) => Boolean(report?.section_approvals?.[`p${index + 1}`])).every(Boolean) : false;
  const requiredImagesDone = imageCounts
    ? Object.values(imageCounts).every(group => group.done >= group.total)
    : true;

  const startEdit = () => {
    if (!activePage) return;
    setEditJson(JSON.stringify(activePage, null, 2));
    setEditing(true);
    setError('');
  };

  const savePage = async () => {
    if (!report || !activePage) return;
    setSaving(true);
    setError('');
    try {
      const page = JSON.parse(editJson) as BlueprintPage;
      const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save page');
      await load(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid page JSON');
    } finally {
      setSaving(false);
    }
  };

  const toggleApproval = async (pageNumber: number) => {
    if (!report) return;
    const key = `p${pageNumber}`;
    const next = { ...(report.section_approvals ?? {}), [key]: !report.section_approvals?.[key] };
    setReport({ ...report, section_approvals: next });
    await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_approvals: next }),
    });
  };

  const approveAll = async () => {
    if (!versioned || !report) return;
    const next = Object.fromEntries(Array.from({ length: 28 }, (_, index) => [`p${index + 1}`, true]));
    setReport({ ...report, section_approvals: next });
    await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_approvals: next }),
    });
  };

  const generateImages = async (force = false) => {
    setGeneratingImages(true);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/${reportId}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: imageGroup, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');
      await load(true);
      const statusRes = await fetch(`/api/stylist-blueprint/status/${reportId}`, { cache: 'no-store' });
      if (statusRes.ok) setImageCounts((await statusRes.json()).imageCounts ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImages(false);
    }
  };

  const sendToClient = async () => {
    if (!allApproved || !requiredImagesDone) return;
    setSending(true);
    const res = await fetch(`/api/stylist-blueprint/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    });
    const data = await res.json();
    if (data.report) setReport(prev => prev ? { ...prev, status: 'sent', sent_at: data.report.sent_at } : prev);
    setSending(false);
  };

  const copyLink = () => {
    if (!report) return;
    navigator.clipboard.writeText(`${window.location.origin}/stylist/report/${report.share_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: '#c9a96e' }} /></div>;
  if (!report) return <p style={{ color: '#6b5f4a' }}>Report not found.</p>;

  return (
    <div>
      <Link href={`/stylist/admin/dashboard/${report.submission_id}`} className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#6b5f4a' }}><ArrowLeft size={14} /> Back to intake</Link>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>Women Blueprint Report</p>
          <h1 className="text-2xl font-light" style={{ color: '#f0ebe0' }}>{report.stylist_intake_responses?.full_name || report.stylist_intake_responses?.customer_email || 'Client'}</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: '#6b5f4a' }}>{report.progress_stage ? stageLabel(report.progress_stage) : report.status.replace(/_/g, ' ')}</p>
          {report.error_message && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{report.error_message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={imageGroup} onChange={event => setImageGroup(event.target.value as StylistBlueprintImageGroup)} className="rounded-xl px-3 py-2 text-sm" style={{ background: '#111111', color: '#c8bfae', border: '1px solid #1e1e1e' }}>
            {IMAGE_GROUPS.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
          </select>
          <button onClick={() => generateImages(false)} disabled={!versioned || generatingImages} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}>
            {generatingImages ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            Missing Images
          </button>
          <button onClick={() => generateImages(true)} disabled={!versioned || generatingImages} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#1e1e1e', color: '#c8bfae' }}>
            <RefreshCw size={14} /> Regenerate Group
          </button>
          <button onClick={approveAll} disabled={!versioned} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#102014', color: '#4ade80' }}><CheckCheck size={14} /> Approve All</button>
          <button onClick={sendToClient} disabled={!allApproved || !requiredImagesDone || sending} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40" style={{ background: '#c9a96e', color: '#fff' }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
          </button>
          <button onClick={copyLink} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1e1e1e', color: '#c8bfae' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
      {error && <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>}

      {!report.report_data ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: '#111111', borderColor: '#1e1e1e', color: '#6b5f4a' }}>
          {report.status === 'generating' ? stageLabel(report.progress_stage) : 'No report data yet.'}
        </div>
      ) : !versioned ? (
        <div className="rounded-2xl border p-6" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
          <p className="text-sm mb-4" style={{ color: '#c8bfae' }}>Legacy Blueprint report. It remains viewable, but page-level editing is available only for v1 reports.</p>
          <StylistBlueprintReport data={report.report_data} imageUrls={report.image_urls} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <aside className="space-y-4">
            {['Opening', 'Act 1', 'Act 2', 'Act 3', 'Closing'].map(group => (
              <div key={group}>
                <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#6b5f4a' }}>{group}</p>
                <div className="space-y-2">
                  {pages.filter(page => pageGroup(page.page_number) === group).map(page => {
                    const approved = Boolean(report.section_approvals?.[`p${page.page_number}`]);
                    return (
                      <button key={page.page_number} onClick={() => { setActivePageNumber(page.page_number); setEditing(false); }} className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm text-left" style={{ background: activePageNumber === page.page_number ? '#1e1a14' : '#111111', color: activePageNumber === page.page_number ? '#c9a96e' : '#c8bfae', border: '1px solid #1e1e1e' }}>
                        <span>{String(page.page_number).padStart(2, '0')} · {page.title}</span>
                        <span onClick={(event) => { event.stopPropagation(); void toggleApproval(page.page_number); }} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: approved ? '#102014' : '#1e1e1e', color: approved ? '#4ade80' : '#6b5f4a' }}>
                          {approved ? 'Approved' : 'Review'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {imageCounts && (
              <div className="rounded-2xl border p-4 text-xs space-y-2" style={{ background: '#111111', borderColor: '#1e1e1e', color: '#c8bfae' }}>
                {Object.entries(imageCounts).map(([key, value]) => <p key={key}>{key.replace(/_/g, ' ')}: {value.done}/{value.total}</p>)}
              </div>
            )}
          </aside>
          <main className="space-y-6">
            <div className="rounded-2xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium" style={{ color: '#f0ebe0' }}>{activePage?.title || 'Page'}</h2>
                <button onClick={editing ? savePage : startEdit} disabled={saving || !activePage} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: '#c9a96e', color: '#fff' }}>
                  {saving ? 'Saving...' : editing ? 'Save Page' : 'Edit Page'}
                </button>
              </div>
              {editing ? (
                <textarea value={editJson} onChange={event => setEditJson(event.target.value)} rows={18} className="w-full rounded-xl p-4 text-sm font-mono outline-none" style={{ background: '#0b0b0b', color: '#f0ebe0', border: '1px solid #2a2a2a' }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-7 font-sans" style={{ color: '#c8bfae' }}>{activePage ? JSON.stringify(activePage, null, 2) : 'No page selected'}</pre>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#1e1e1e' }}>
              <StylistBlueprintReport data={versioned} imageUrls={report.image_urls} />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
