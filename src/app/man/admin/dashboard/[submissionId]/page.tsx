'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertCircle, Loader2, Zap } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ManReport {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  generated_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  section_approvals: Record<string, boolean> | null;
  created_at: string;
}

interface ManSubmission {
  id: string;
  customer_email: string;
  customer_phone: string | null;
  photo_fullbody_url: string | null;
  photo_headshot_url: string | null;
  primary_goal: string | null;
  style_relationship: string | null;
  dressing_context: string | null;
  location_tier: string | null;
  height_category: string | null;
  body_shape: string | null;
  fat_storage_zone: string | null;
  highlight_zone: string | null;
  minimise_zone: string | null;
  fit_preference: string | null;
  wardrobe_composition: string | null;
  skin_tone: string | null;
  vein_undertone: string | null;
  white_test: string | null;
  hair_colour: string | null;
  eye_colour: string | null;
  derived_colour_season: string | null;
  face_shape: string | null;
  facial_feature_type: string | null;
  primary_style_goal: string | null;
  branch_answer: string | null;
  style_tribes: string | null;
  style_pole_structure: string | null;
  style_pole_expression: string | null;
  style_pole_tone: string | null;
  style_pole_register: string | null;
  style_blocker: string | null;
  style_anti_pref: string | null;
  style_anti_pref_note: string | null;
  free_text_note: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: string | null | undefined) {
  if (!val) return '—';
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtMulti(val: string | null | undefined) {
  if (!val) return '—';
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(v => fmt(v)).join(', ');
  } catch { /* not JSON */ }
  return val.split(',').map(v => fmt(v.trim())).join(', ');
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b" style={{ borderColor: '#181818' }}>
      <span className="text-[11px] font-semibold uppercase tracking-widest w-44 flex-shrink-0 pt-0.5" style={{ color: '#6b5f4a' }}>
        {label}
      </span>
      <span className="text-sm flex-1" style={{ color: '#c8bfae' }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#c9a96e' }}>{title}</p>
      {children}
    </div>
  );
}

function ReportStatusBanner({ report, onGenerate, generating }: {
  report: ManReport | null;
  onGenerate: () => void;
  generating: boolean;
}) {
  if (!report) {
    return (
      <div className="rounded-2xl border p-5 flex items-center justify-between"
        style={{ background: '#111111', borderColor: '#1e1e1e' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#f0ebe0' }}>No report generated yet</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b5f4a' }}>Trigger the AI pipeline to create a draft</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {generating ? 'Starting…' : 'Generate Report'}
        </button>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    generating:  { bg: '#2a2010', color: '#c9a96e' },
    draft_ready: { bg: '#2a2010', color: '#e8c17a' },
    in_review:   { bg: '#0e1e2a', color: '#60a5fa' },
    approved:    { bg: '#0e2010', color: '#4ade80' },
    sent:        { bg: '#0e2010', color: '#22c55e' },
    error:       { bg: '#2a0e0e', color: '#f87171' },
  };
  const cfg = statusColors[report.status] ?? { bg: '#1e1e1e', color: '#6b5f4a' };

  return (
    <div className="rounded-2xl border p-5 flex items-center justify-between gap-4"
      style={{ background: cfg.bg, borderColor: '#1e1e1e' }}>
      <div className="flex items-center gap-3">
        {report.status === 'generating' && <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: cfg.color }} />}
        {report.status === 'error' && <AlertCircle size={16} className="flex-shrink-0" style={{ color: cfg.color }} />}
        <div>
          <p className="text-sm font-medium" style={{ color: cfg.color }}>
            {report.status === 'generating'
              ? (report.progress_stage ? fmt(report.progress_stage) + '…' : 'Generating report…')
              : fmt(report.status)}
          </p>
          {report.error_message && (
            <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>{report.error_message}</p>
          )}
          {report.generated_at && (
            <p className="text-xs mt-0.5" style={{ color: '#6b5f4a' }}>
              Generated {new Date(report.generated_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {['draft_ready', 'in_review', 'approved', 'sent'].includes(report.status) && (
          <Link
            href={`/man/admin/report/${report.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#c9a96e', color: '#fff' }}
          >
            Review Report
          </Link>
        )}
        {report.status === 'sent' && (
          <Link
            href={`/man/report/${report.share_token}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: '#1e1e1e', color: '#c8bfae' }}
          >
            Client Link <ExternalLink size={11} />
          </Link>
        )}
        {['error', 'pending'].includes(report.status) && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {generating ? 'Starting…' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);

  const [submission, setSubmission] = useState<ManSubmission | null>(null);
  const [reports, setReports]       = useState<ManReport[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/man-admin/submissions/${submissionId}`);
      const data = await res.json();
      setSubmission(data.submission ?? null);
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [submissionId]);

  // Poll while a report is generating
  useEffect(() => {
    const latest = reports[0];
    if (latest?.status !== 'generating') return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [reports]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res  = await fetch(`/api/man-report/generate/${submissionId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? 'Generation failed'); return; }
      await load();
    } catch {
      setGenError('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={22} className="animate-spin" style={{ color: '#c9a96e' }} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20" style={{ color: '#6b5f4a' }}>
        Submission not found.
      </div>
    );
  }

  const latestReport = reports[0] ?? null;

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/man/admin/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: '#6b5f4a' }}
      >
        <ArrowLeft size={14} />
        Back to submissions
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>
          Submission · {new Date(submission.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-light" style={{ color: '#f0ebe0' }}>{submission.customer_email}</h1>
        {submission.customer_phone && (
          <p className="text-sm mt-1" style={{ color: '#6b5f4a' }}>{submission.customer_phone}</p>
        )}
      </div>

      {/* Report status banner */}
      <div className="mb-6">
        <ReportStatusBanner report={latestReport} onGenerate={handleGenerate} generating={generating} />
        {genError && (
          <p className="text-xs mt-2 px-4 py-2 rounded-xl" style={{ color: '#f87171', background: '#1a0a0a', border: '1px solid #3a1010' }}>
            {genError}
          </p>
        )}
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Headshot', url: submission.photo_headshot_url },
          { label: 'Full Body', url: submission.photo_fullbody_url },
        ].map(({ label, url }) => (
          <div key={label} className="rounded-2xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-4 py-3 border-b" style={{ color: '#c9a96e', borderColor: '#1e1e1e' }}>{label}</p>
            {url ? (
              <img src={url} alt={label} className="w-full object-cover" style={{ maxHeight: 320 }} />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#4a4030' }}>No photo uploaded</div>
            )}
          </div>
        ))}
      </div>

      {/* Form data sections */}
      <div className="space-y-4">
        <Section title="Contact">
          <DataRow label="Email"  value={submission.customer_email} />
          <DataRow label="Phone"  value={submission.customer_phone ?? '—'} />
          <DataRow label="Location" value={fmt(submission.location_tier)} />
        </Section>

        <Section title="Section 1 — Basics">
          <DataRow label="Primary Goal"       value={fmt(submission.primary_goal)} />
          <DataRow label="Style Relationship" value={fmt(submission.style_relationship)} />
          <DataRow label="Dressing Context"   value={fmtMulti(submission.dressing_context)} />
          <DataRow label="Wardrobe"           value={fmtMulti(submission.wardrobe_composition)} />
        </Section>

        <Section title="Section 2 — Body">
          <DataRow label="Height"         value={fmt(submission.height_category)} />
          <DataRow label="Body Shape"     value={fmt(submission.body_shape)} />
          <DataRow label="Fat Storage"    value={fmt(submission.fat_storage_zone)} />
          <DataRow label="Highlight Zone" value={fmt(submission.highlight_zone)} />
          <DataRow label="Minimise Zone"  value={fmt(submission.minimise_zone)} />
          <DataRow label="Fit Preference" value={fmt(submission.fit_preference)} />
        </Section>

        <Section title="Section 3 — Colour">
          <DataRow label="Skin Tone"      value={fmt(submission.skin_tone)} />
          <DataRow label="Undertone"      value={fmt(submission.vein_undertone)} />
          <DataRow label="White Test"     value={fmt(submission.white_test)} />
          <DataRow label="Hair Colour"    value={fmt(submission.hair_colour)} />
          <DataRow label="Eye Colour"     value={fmt(submission.eye_colour)} />
          <DataRow label="Colour Season"  value={fmt(submission.derived_colour_season)} />
        </Section>

        <Section title="Section 4 — Face">
          <DataRow label="Face Shape"     value={fmt(submission.face_shape)} />
          <DataRow label="Feature Type"   value={fmt(submission.facial_feature_type)} />
        </Section>

        <Section title="Section 5 — Style Identity">
          <DataRow label="Style Goal"     value={fmt(submission.primary_style_goal)} />
          <DataRow label="Branch Answer"  value={fmt(submission.branch_answer)} />
          <DataRow label="Style Tribes"   value={fmtMulti(submission.style_tribes)} />
          <DataRow label="Structure"      value={fmt(submission.style_pole_structure)} />
          <DataRow label="Expression"     value={fmt(submission.style_pole_expression)} />
          <DataRow label="Tone"           value={fmt(submission.style_pole_tone)} />
          <DataRow label="Register"       value={fmt(submission.style_pole_register)} />
          <DataRow label="Style Blocker"  value={fmt(submission.style_blocker)} />
          <DataRow label="Anti-Pref"      value={fmt(submission.style_anti_pref)} />
          {submission.style_anti_pref_note && (
            <DataRow label="Anti-Pref Note" value={submission.style_anti_pref_note} />
          )}
          {submission.free_text_note && (
            <DataRow label="Free Note"      value={submission.free_text_note} />
          )}
        </Section>
      </div>
    </div>
  );
}
