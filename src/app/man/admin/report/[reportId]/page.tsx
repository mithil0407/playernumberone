'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Send, Loader2, Copy, CheckCheck, AlertCircle, Pencil, X, Zap, Ban, RotateCcw } from 'lucide-react';
import ManReport from '@/components/ManReport';
import type { ReportData, ReportSections } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';

// ── Types ──────────────────────────────────────────────────────────────────

interface SectionApprovals {
  s1: boolean; s2: boolean; s3: boolean;
  s4: boolean; s5: boolean; s6: boolean;
}

interface Report {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: ReportData | null;
  image_urls: ResolvedImageUrls | null;
  share_token: string;
  section_approvals: SectionApprovals;
  submission_id: string;
  created_at: string;
  error_message: string | null;
  sent_at: string | null;
  man_intake_submissions: { id: string; customer_email: string; customer_phone: string | null } | null;
}

const SECTIONS = [
  { key: 's1', label: 'Face Architecture',  field: 's1_face'     },
  { key: 's2', label: 'Body Geometry',       field: 's2_body'     },
  { key: 's3', label: 'Chromatic Harmony',   field: 's3_colour'   },
  { key: 's4', label: '16 Outfits',          field: 's4_outfits'  },
  { key: 's5', label: 'Style Rules',         field: 's5_rules'    },
  { key: 's6', label: 'Identity Statement',  field: 's6_identity' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];
type SectionField = typeof SECTIONS[number]['field'];

const STAGE_LABELS: Record<string, string> = {
  classifying:       'Classifying profile…',
  generating_s1:     'Writing Face Architecture…',
  generating_s2:     'Writing Body Geometry…',
  generating_s3:     'Writing Chromatic Harmony…',
  generating_s4:     'Writing 16 Outfits…',
  generating_s5:     'Writing Style Rules…',
  generating_s6:     'Writing Identity Statement…',
  generating_images: 'Generating images…',
  finalising:        'Finalising…',
};

const SECTION_FIELD_MAP: Record<SectionKey, SectionField> = {
  s1: 's1_face', s2: 's2_body', s3: 's3_colour',
  s4: 's4_outfits', s5: 's5_rules', s6: 's6_identity',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function allApproved(approvals: SectionApprovals): boolean {
  return Object.values(approvals).every(Boolean);
}

function buildSafeReportData(reportData: ReportData): ReportData {
  return {
    classification: reportData.classification,
    sections: {
      s1_face:     reportData.sections?.s1_face     ?? '',
      s2_body:     reportData.sections?.s2_body     ?? '',
      s3_colour:   reportData.sections?.s3_colour   ?? '',
      s4_outfits:  reportData.sections?.s4_outfits  ?? '',
      s5_rules:    reportData.sections?.s5_rules    ?? '',
      s6_identity: reportData.sections?.s6_identity ?? '',
    } as ReportSections,
    generated_at: reportData.generated_at,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const router = useRouter();

  const [report, setReport]               = useState<Report | null>(null);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>('s1');
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editText, setEditText]           = useState('');
  const [saving, setSaving]               = useState(false);
  const [sending, setSending]             = useState(false);
  const [copied, setCopied]               = useState(false);
  const [error, setError]                 = useState('');
  const [terminating, setTerminating]     = useState(false);
  const [retrying, setRetrying]           = useState(false);
  const [elapsedSecs, setElapsedSecs]     = useState(0);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/man-report/${reportId}`);
    const data = await res.json();
    if (data.report) {
      setReport(data.report);
      // Auto-transition draft_ready → in_review on first open (skip if still generating)
      if (data.report.status === 'draft_ready') {
        await fetch(`/api/man-report/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_review' }),
        });
      }
    }
    setLoading(false);
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  // Poll every 3s while generation is in progress
  useEffect(() => {
    if (report?.status !== 'generating') return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [report?.status, load]);

  // Elapsed-time ticker while generating
  useEffect(() => {
    if (report?.status !== 'generating' || !report.created_at) {
      setElapsedSecs(0);
      return;
    }
    const tick = () => {
      setElapsedSecs(Math.floor((Date.now() - new Date(report.created_at).getTime()) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [report?.status, report?.created_at]);

  // ── Section approval ──────────────────────────────────────────────────

  const toggleApproval = async (key: SectionKey) => {
    if (!report) return;
    const next = {
      ...report.section_approvals,
      [key]: !report.section_approvals[key],
    };
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });
  };

  const approveAll = async () => {
    if (!report) return;
    const next: SectionApprovals = { s1: true, s2: true, s3: true, s4: true, s5: true, s6: true };
    setReport(r => r ? { ...r, section_approvals: next } : r);
    await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_approvals: next }),
    });
  };

  // ── Inline section edit ────────────────────────────────────────────────

  const startEdit = (key: SectionKey) => {
    if (!report?.report_data) return;
    const field = SECTION_FIELD_MAP[key];
    setEditText(report.report_data.sections?.[field] ?? '');
    setEditingSection(key);
  };

  const saveEdit = async () => {
    if (!report?.report_data || !editingSection) return;
    setSaving(true);
    const field   = SECTION_FIELD_MAP[editingSection];
    const newData = {
      ...report.report_data,
      sections: { ...report.report_data.sections, [field]: editText },
    };
    const res  = await fetch(`/api/man-report/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_data: newData }),
    });
    const data = await res.json();
    if (data.report) setReport({ ...report, report_data: data.report.report_data });
    setSaving(false);
    setEditingSection(null);
  };

  // ── Send to client ─────────────────────────────────────────────────────

  const sendToClient = async () => {
    if (!report || !allApproved(report.section_approvals)) return;
    setSending(true);
    setError('');
    try {
      const res  = await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      const data = await res.json();
      if (data.report) setReport(prev => prev ? { ...prev, status: 'sent', sent_at: data.report.sent_at } : prev);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!report) return;
    const url = `${window.location.origin}/man/report/${report.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Terminate (kill generating pipeline) ──────────────────────────────
  const handleTerminate = async () => {
    if (!report || terminating) return;
    setTerminating(true);
    setError('');
    try {
      await fetch(`/api/man-report/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          progress_stage: null,
          error_message: 'Manually cancelled by admin',
        }),
      });
      await load();
    } catch {
      setError('Failed to cancel. Try again.');
    } finally {
      setTerminating(false);
    }
  };

  // ── Retry (regenerate from scratch) ───────────────────────────────────
  const handleRetry = async () => {
    if (!report || retrying) return;
    const submissionId = report.submission_id;
    if (!submissionId) { setError('Missing submission ID — cannot retry.'); return; }
    setRetrying(true);
    setError('');
    try {
      const res  = await fetch(`/api/man-report/generate/${submissionId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Retry failed'); return; }
      if (data.reportId && data.reportId !== reportId) {
        router.push(`/man/admin/report/${data.reportId}`);
      } else {
        await load();
      }
    } catch {
      setError('Retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#6b5f4a' }}>Report not found.</p>
        <Link href="/man/admin/dashboard" className="text-sm mt-4 inline-block" style={{ color: '#c9a96e' }}>
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const approvals    = report.section_approvals ?? { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false };
  const ready        = allApproved(approvals);
  const isGenerating = report.status === 'generating';
  const isError      = report.status === 'error';
  const isStuck      = isGenerating && elapsedSecs > 600;
  const safeData     = report.report_data ? buildSafeReportData(report.report_data) : null;

  const elapsedLabel = (() => {
    if (elapsedSecs < 60) return `${elapsedSecs}s`;
    const m = Math.floor(elapsedSecs / 60);
    const s = elapsedSecs % 60;
    return `${m}m ${s}s`;
  })();

  return (
    <div className="flex gap-0 h-[calc(100vh-4rem)] -m-5 lg:-m-8 overflow-hidden">
      {/* ── Left: Report Preview ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: '#f5f5f5' }}>
        {/* Stuck banner */}
        {isStuck && (
          <div className="flex items-center justify-between gap-4 px-5 py-3 flex-shrink-0"
            style={{ background: '#1a0f00', borderBottom: '1px solid #3a2000' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={14} style={{ color: '#fb923c' }} />
              <span className="text-xs font-medium" style={{ color: '#fb923c' }}>
                Generation has been running for {elapsedLabel} — it may be stuck.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#2a0e0e', color: '#f87171', border: '1px solid #3a1010' }}
              >
                {terminating ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
                Cancel
              </button>
              <button
                onClick={async () => { await handleTerminate(); await handleRetry(); }}
                disabled={terminating || retrying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
              >
                {(terminating || retrying) ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                Force Restart
              </button>
            </div>
          </div>
        )}

        {safeData ? (
          <ManReport data={safeData} imageUrls={report.image_urls} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
            <p className="text-xs" style={{ color: '#6b5f4a' }}>
              {STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating…'}
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Edit Panel ────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-l overflow-hidden" style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}>

        {/* Panel header */}
        <div className="px-4 py-4 border-b" style={{ borderColor: '#1e1e1e' }}>
          <Link
            href="/man/admin/dashboard"
            className="flex items-center gap-1.5 text-xs mb-3 transition-opacity hover:opacity-70"
            style={{ color: '#6b5f4a' }}
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#c9a96e' }}>Review Panel</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#6b5f4a' }}>
            {report.man_intake_submissions?.customer_email ?? reportId}
          </p>
          {isGenerating && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: isStuck ? '#fb923c' : '#c9a96e' }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: isStuck ? '#fb923c' : '#c9a96e' }}>
                  {isStuck ? `STUCK · ${elapsedLabel}` : `LIVE · ${elapsedLabel}`}
                </span>
              </div>
              <p className="text-[9px]" style={{ color: '#6b5f4a' }}>
                {STAGE_LABELS[report.progress_stage ?? ''] ?? 'Generating…'}
              </p>
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: '#2a0e0e', color: '#f87171', border: '1px solid #3a1010' }}
              >
                {terminating ? <Loader2 size={9} className="animate-spin" /> : <Ban size={9} />}
                {terminating ? 'Cancelling…' : 'Cancel Generation'}
              </button>
            </div>
          )}
        </div>

        {/* Section tabs + approvals */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {SECTIONS.map(({ key, label, field }) => {
            const approved   = approvals[key];
            const active     = activeSection === key;
            const hasContent = !!report.report_data?.sections?.[field];

            return (
              <div
                key={key}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: active ? '#1e1a14' : 'transparent',
                  border: `1px solid ${active ? '#2a2010' : 'transparent'}`,
                }}
                onClick={() => setActiveSection(key)}
              >
                {/* Approve toggle / skeleton circle */}
                {hasContent ? (
                  <button
                    onClick={e => { e.stopPropagation(); toggleApproval(key); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: approved ? '#16a34a' : '#1e1e1e',
                      border: `1px solid ${approved ? '#16a34a' : '#2a2a2a'}`,
                    }}
                    title={approved ? 'Approved — click to un-approve' : 'Click to approve'}
                  >
                    {approved && <Check size={10} className="text-white" />}
                  </button>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 animate-pulse"
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
                  />
                )}

                <span className="flex-1 text-xs font-medium" style={{ color: hasContent ? (active ? '#c9a96e' : '#6b5f4a') : '#3a3028' }}>
                  {label}
                </span>

                {/* Edit button — only when content exists */}
                {hasContent && (
                  <button
                    onClick={e => { e.stopPropagation(); startEdit(key); }}
                    className="p-1 rounded transition-opacity hover:opacity-100 opacity-0 group-hover:opacity-100"
                    style={{ color: '#6b5f4a' }}
                    title="Edit section text"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Approve all — disabled while generating */}
          {!isGenerating && (
            <button
              onClick={approveAll}
              className="w-full mt-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: '#1e1a14', color: '#c9a96e', border: '1px solid #2a2010' }}
            >
              Approve All Sections
            </button>
          )}
        </div>

        {/* Send controls */}
        <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: '#1e1e1e' }}>
          {report.status === 'sent' ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCheck size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">Sent to client</span>
              </div>
              <button
                onClick={copyLink}
                className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#c8bfae', border: '1px solid #2a2a2a' }}
              >
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy Client Link'}
              </button>
            </div>
          ) : isError ? (
            <>
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1" style={{ background: '#1a0a0a', border: '1px solid #3a1010' }}>
                <AlertCircle size={12} style={{ color: '#f87171', flexShrink: 0 }} />
                <p className="text-[10px] leading-tight" style={{ color: '#f87171' }}>
                  {report.error_message ?? 'Generation failed'}
                </p>
              </div>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
              >
                {retrying ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {retrying ? 'Starting…' : 'Retry Generation'}
              </button>
            </>
          ) : (
            <>
              {!ready && !isGenerating && (
                <p className="text-[10px] text-center" style={{ color: '#4a4030' }}>
                  Approve all {Object.values(approvals).filter(Boolean).length}/6 sections to send
                </p>
              )}
              {isGenerating && (
                <p className="text-[10px] text-center" style={{ color: '#4a4030' }}>
                  Generation in progress — approve sections as they appear
                </p>
              )}
              <button
                onClick={sendToClient}
                disabled={!ready || sending || isGenerating}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                style={{ background: ready && !isGenerating ? 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)' : '#1e1e1e', color: '#fff' }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending…' : 'Send to Client'}
              </button>
              <button
                onClick={copyLink}
                className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#6b5f4a', border: '1px solid #2a2a2a' }}
              >
                <Copy size={12} /> Preview Link
              </button>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs rounded-lg p-2" style={{ color: '#f87171', background: '#1a0a0a' }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Inline section editor modal ───────────────────────────────────── */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border w-full max-w-2xl mx-4 flex flex-col" style={{ background: '#111111', borderColor: '#2a2a2a', maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e1e1e' }}>
              <p className="text-sm font-medium" style={{ color: '#f0ebe0' }}>
                Edit — {SECTIONS.find(s => s.key === editingSection)?.label}
              </p>
              <button onClick={() => setEditingSection(null)} style={{ color: '#6b5f4a' }}>
                <X size={16} />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 p-5 text-sm font-light outline-none resize-none min-h-[400px]"
              style={{ background: '#111111', color: '#c8bfae', lineHeight: 1.7 }}
            />
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: '#1e1e1e' }}>
              <button
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-70"
                style={{ color: '#6b5f4a' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
