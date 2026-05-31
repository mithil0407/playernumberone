'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2, Zap } from 'lucide-react';

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
  customer_email: string;
  customer_phone: string | null;
  full_name: string | null;
  country: string | null;
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

function fmt(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  return JSON.stringify(value, null, 2);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border p-6" style={{ background: '#111111', borderColor: '#1e1e1e' }}><p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#c9a96e' }}>{title}</p>{children}</div>;
}

function DataRow({ label, value }: { label: string; value: unknown }) {
  return <div className="grid md:grid-cols-[180px_1fr] gap-3 py-2.5 border-b" style={{ borderColor: '#181818' }}><span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6b5f4a' }}>{label}</span><pre className="text-sm whitespace-pre-wrap font-sans" style={{ color: '#c8bfae' }}>{fmt(value)}</pre></div>;
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
      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }
      router.push(`/stylist/admin/report/${data.reportId}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" style={{ color: '#c9a96e' }} /></div>;
  if (!submission) return <p style={{ color: '#6b5f4a' }}>Submission not found.</p>;
  const latest = reports[0] ?? null;

  return (
    <div className="max-w-5xl">
      <Link href="/stylist/admin/dashboard" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#6b5f4a' }}><ArrowLeft size={14} /> Back to submissions</Link>
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#c9a96e' }}>Women Blueprint Intake</p>
        <h1 className="text-2xl font-light" style={{ color: '#f0ebe0' }}>{submission.full_name || submission.customer_email}</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5f4a' }}>{submission.customer_email}</p>
      </div>

      <div className="rounded-2xl border p-5 mb-6 flex items-center justify-between gap-4" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
        <div>
          <p className="text-sm font-medium" style={{ color: '#f0ebe0' }}>{latest ? latest.status.replace(/_/g, ' ') : 'No report generated yet'}</p>
          {latest?.progress_stage && <p className="text-xs mt-1" style={{ color: '#c9a96e' }}>{latest.progress_stage}</p>}
          {latest?.error_message && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{latest.error_message}</p>}
        </div>
        <div className="flex gap-2">
          {latest && ['draft_ready', 'in_review', 'approved', 'sent'].includes(latest.status) && (
            <Link href={`/stylist/admin/report/${latest.id}`} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: '#c9a96e', color: '#fff' }}>Review Report</Link>
          )}
          {latest?.status === 'sent' && <Link href={`/stylist/report/${latest.share_token}`} target="_blank" className="px-3 py-2 rounded-xl text-sm" style={{ background: '#1e1e1e', color: '#c8bfae' }}><ExternalLink size={14} /></Link>}
          {(!latest || latest.status === 'error') && (
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #8a6820 100%)', color: '#fff' }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {generating ? 'Starting...' : 'Generate Report'}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>}

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {Object.entries(submission.photo_urls ?? {}).map(([key, url]) => (
          <div key={key} className="rounded-2xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <p className="text-[10px] uppercase tracking-widest px-4 py-3 border-b" style={{ color: '#c9a96e', borderColor: '#1e1e1e' }}>{key.replace(/_/g, ' ')}</p>
            {url ? <img src={url} alt={key} className="w-full h-56 object-cover" /> : <div className="h-56 flex items-center justify-center text-xs" style={{ color: '#6b5f4a' }}>No photo</div>}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Section title="Profile"><DataRow label="Phone" value={submission.customer_phone} /><DataRow label="Country" value={submission.country} /><DataRow label="Moodboard" value={submission.selected_moodboard_label} /></Section>
        <Section title="Body & Focus"><DataRow label="Measurements" value={submission.body_measurements} /><DataRow label="Focus Areas" value={submission.focus_areas} /><DataRow label="Coverage" value={submission.coverage_requirements} /></Section>
        <Section title="Lifestyle & Taste"><DataRow label="Lifestyle" value={submission.lifestyle_context} /><DataRow label="Piece Preferences" value={submission.piece_preferences} /><DataRow label="Secondary Mood" value={submission.secondary_moodboard_elements} /></Section>
        <Section title="Hair & Shopping"><DataRow label="Hair" value={submission.hair_context} /><DataRow label="Shopping Relationship" value={submission.shopping_relationship} /><DataRow label="Prior Styling" value={submission.prior_styling_experience} /></Section>
      </div>
    </div>
  );
}
