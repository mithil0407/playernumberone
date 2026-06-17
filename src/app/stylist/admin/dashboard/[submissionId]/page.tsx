'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2, Zap } from 'lucide-react';

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

interface Report {
  id: string;
  status: string;
  progress_stage: string | null;
  share_token: string;
  error_message: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  customer_email: string | null;
  customer_phone: string | null;
  full_name: string | null;
  country: string | null;
  intake_source?: string | null;
  raw_consultation_notes?: string | null;
  body_measurements: Record<string, unknown>;
  photo_urls: Record<string, string | null>;
  focus_areas: string[];
  coverage_requirements: Record<string, unknown>;
  lifestyle_context: Record<string, unknown>;
  piece_preferences: Record<string, unknown>;
  selected_moodboard_label: string | null;
  secondary_moodboard_elements: string[];
  hair_context: Record<string, unknown>;
  shopping_relationship: string | null;
  prior_styling_experience: Record<string, unknown>;
  one_outfit_image_url: string | null;
  created_at: string;
}

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const items = value.filter(item => item !== null && item !== undefined && item !== '');
    return items.length ? items.map(fmt).join(', ') : '—';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => {
        if (item === null || item === undefined || item === '') return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object') return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    if (!entries.length) return '—';
    return entries
      .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${fmt(item)}`)
      .join('\n');
  }
  return String(value);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: S.card, borderColor: S.border }}>
      <div className="iconik-micro mb-5" style={{ color: S.muted }}>{title}</div>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid md:grid-cols-[180px_1fr] gap-3 py-2.5 border-b" style={{ borderColor: S.rowBorder }}>
      <span className="iconik-micro" style={{ color: S.muted }}>{label}</span>
      <pre className="luxury-body text-sm whitespace-pre-wrap" style={{ color: S.ink, fontWeight: 300 }}>{fmt(value)}</pre>
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: S.bg, borderColor: S.rowBorder }}>
      <p className="iconik-micro mb-2" style={{ color: S.muted }}>{label}</p>
      <p className="luxury-body text-sm leading-6 whitespace-pre-line" style={{ color: S.ink, fontWeight: 300 }}>{fmt(value)}</p>
    </div>
  );
}

export default function StylistSubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/stylist-admin/submissions/${submissionId}`, { cache: 'no-store' });
    const data = await res.json();
    setSubmission(data.submission ?? null);
    setReports(data.reports ?? []);
    setLoading(false);
  }, [submissionId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (reports[0]?.status !== 'generating') return;
    const interval = setInterval(() => { void load(); }, 4000);
    return () => clearInterval(interval);
  }, [reports, load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/stylist-blueprint/generate/${submissionId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Generation failed'); return; }
      router.push(`/stylist/admin/report/${data.reportId}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin" style={{ color: S.muted }} />
    </div>
  );
  if (!submission) return <p className="luxury-body" style={{ color: S.muted }}>Submission not found.</p>;
  const latest = reports[0] ?? null;
  const clientLabel = submission.full_name || submission.customer_email || submission.customer_phone || 'Manual client';
  const contactLabel = submission.customer_email || submission.customer_phone || 'No email';

  return (
    <div className="max-w-5xl">
      <Link href="/stylist/admin/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 luxury-body transition" style={{ color: S.muted }}>
        <ArrowLeft size={14} /> Back to submissions
      </Link>

      <div className="mb-6">
        <div className="iconik-micro mb-2" style={{ color: S.muted }}>Women Blueprint Intake</div>
        <h1 className="iconik-display" style={{ fontSize: '26px', color: S.ink }}>{clientLabel}</h1>
        <p className="luxury-body text-sm mt-1" style={{ color: S.muted, fontWeight: 300 }}>{contactLabel}</p>
      </div>

      <div className="rounded-2xl border p-5 mb-6 flex items-center justify-between gap-4" style={{ background: S.card, borderColor: S.border }}>
        <div>
          <p className="luxury-body text-sm" style={{ color: S.ink, fontWeight: 500 }}>
            {latest ? latest.status.replace(/_/g, ' ') : 'No report generated yet'}
          </p>
          {latest?.progress_stage && <p className="iconik-mono mt-1" style={{ fontSize: '10px', color: S.gold }}>{latest.progress_stage}</p>}
          {latest?.error_message && <p className="luxury-body text-xs mt-1" style={{ color: S.error }}>{latest.error_message}</p>}
        </div>
        <div className="flex gap-2">
          {latest && (
            <Link
              href={`/stylist/admin/report/${latest.id}`}
              className="px-4 py-2 rounded-xl text-sm luxury-body transition"
              style={{ background: S.ink, color: S.bg }}
            >
              Open Report
            </Link>
          )}
          {latest?.status === 'sent' && (
            <Link
              href={`/stylist/report/${latest.share_token}`}
              target="_blank"
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
            >
              <ExternalLink size={14} />
            </Link>
          )}
          {(!latest || latest.status === 'error') && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
              style={{ background: S.slateDeep, color: S.bg }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {generating ? 'Starting…' : 'Generate Report'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="luxury-body text-sm mb-4" style={{ color: S.error }}>{error}</p>}

      <div className="mb-6">
        <Section title="Review Context">
          <div className="grid md:grid-cols-4 gap-3">
            <ContextCard label="Moodboard" value={submission.selected_moodboard_label} />
            <ContextCard label="Focus" value={(submission.focus_areas ?? []).join(', ') || '—'} />
            <ContextCard label="Coverage" value={submission.coverage_requirements} />
            <ContextCard label="Lifestyle" value={submission.lifestyle_context} />
          </div>
        </Section>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {Object.entries(submission.photo_urls ?? {}).map(([key, url]) => (
          <div key={key} className="rounded-2xl border overflow-hidden" style={{ background: S.card, borderColor: S.border }}>
            <p className="iconik-micro px-4 py-3 border-b" style={{ color: S.muted, borderColor: S.rowBorder }}>{key.replace(/_/g, ' ')}</p>
            {url
              ? <img src={url} alt={key} className="w-full h-56 object-cover" />
              : <div className="h-56 flex items-center justify-center iconik-micro" style={{ color: S.muted }}>No photo</div>
            }
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Section title="Profile">
          <DataRow label="Phone" value={submission.customer_phone} />
          <DataRow label="Email" value={submission.customer_email} />
          <DataRow label="Country" value={submission.country} />
          <DataRow label="Source" value={submission.intake_source} />
          <DataRow label="Moodboard" value={submission.selected_moodboard_label} />
        </Section>
        {submission.raw_consultation_notes && (
          <Section title="Raw Consultation Notes">
            <pre className="luxury-body text-sm whitespace-pre-wrap" style={{ color: S.ink, fontWeight: 300 }}>{submission.raw_consultation_notes}</pre>
          </Section>
        )}
        <Section title="Body & Focus">
          <DataRow label="Measurements" value={submission.body_measurements} />
          <DataRow label="Focus Areas" value={submission.focus_areas} />
          <DataRow label="Coverage" value={submission.coverage_requirements} />
        </Section>
        <Section title="Lifestyle & Taste">
          <DataRow label="Lifestyle" value={submission.lifestyle_context} />
          <DataRow label="Piece Preferences" value={submission.piece_preferences} />
          <DataRow label="Secondary Mood" value={submission.secondary_moodboard_elements} />
        </Section>
        <Section title="Hair & Shopping">
          <DataRow label="Hair" value={submission.hair_context} />
          <DataRow label="Shopping Relationship" value={submission.shopping_relationship} />
          <DataRow label="Prior Styling" value={submission.prior_styling_experience} />
        </Section>
      </div>
    </div>
  );
}
