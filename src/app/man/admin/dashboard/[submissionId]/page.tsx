'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Loader2, Upload, Zap } from 'lucide-react';
import { reviewTheme as S } from '@/components/AdminReviewWorkspace';

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
  customer_email: string | null;
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

function fmt(value: string | null | undefined) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function fmtMulti(value: string | null | undefined) {
  if (!value) return '-';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => fmt(String(item))).join(', ');
  } catch {
    // Plain comma-separated intake values are expected for older submissions.
  }
  return value.split(',').map(item => fmt(item.trim())).join(', ');
}

function stageLabel(stage: string | null) {
  return stage ? stage.replace(/_/g, ' ') : 'Generating report';
}

function statusTone(status: string): 'muted' | 'success' | 'error' | 'gold' | 'slate' {
  if (status === 'sent' || status === 'approved') return 'success';
  if (status === 'error') return 'error';
  if (status === 'generating' || status === 'draft_ready') return 'gold';
  if (status === 'in_review') return 'slate';
  return 'muted';
}

function toneColor(tone: ReturnType<typeof statusTone>) {
  if (tone === 'success') return S.success;
  if (tone === 'error') return S.error;
  if (tone === 'gold') return S.gold;
  if (tone === 'slate') return S.slate;
  return S.muted;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid md:grid-cols-[180px_1fr] gap-3 py-2.5 border-b" style={{ borderColor: S.rowBorder }}>
      <span className="iconik-micro" style={{ color: S.muted }}>{label}</span>
      <span className="luxury-body text-sm whitespace-pre-wrap" style={{ color: S.ink, fontWeight: 300 }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: S.card, borderColor: S.border }}>
      <div className="iconik-micro mb-5" style={{ color: S.muted }}>{title}</div>
      {children}
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: S.bg, borderColor: S.rowBorder }}>
      <p className="iconik-micro mb-2" style={{ color: S.muted }}>{label}</p>
      <p className="luxury-body text-sm leading-6" style={{ color: S.ink, fontWeight: 300 }}>{value}</p>
    </div>
  );
}

function PhotoUploadCard({
  label,
  field,
  url,
  submissionId,
  onUploaded,
}: {
  label: string;
  field: 'photo_headshot' | 'photo_fullbody';
  url: string | null;
  submissionId: string;
  onUploaded: (submission: ManSubmission) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append(field, file);

      const res = await fetch(`/api/man-admin/submissions/${submissionId}`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Photo upload failed');
        return;
      }

      onUploaded(data.submission);
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [field, onUploaded, submissionId]);

  const inputId = `${field}-${submissionId}`;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: S.card, borderColor: dragging ? S.gold : S.border }}
      onDragEnter={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={event => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        void uploadFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: S.rowBorder }}>
        <div className="flex items-center gap-2">
          <p className="iconik-micro" style={{ color: S.muted }}>{label}</p>
          {url && <CheckCircle size={13} style={{ color: S.success }} />}
        </div>
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs luxury-body cursor-pointer transition"
          style={{ background: S.bg, color: S.muted, border: `1px solid ${S.border}` }}
        >
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
          {url ? 'Replace' : 'Upload'}
        </label>
        <input
          id={inputId}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          disabled={uploading}
          onChange={event => {
            void uploadFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = '';
          }}
        />
      </div>

      {url ? (
        <img src={url} alt={label} className="w-full object-cover" style={{ maxHeight: 320 }} />
      ) : (
        <label
          htmlFor={inputId}
          className="h-48 flex flex-col items-center justify-center gap-3 text-sm cursor-pointer luxury-body"
          style={{ color: dragging ? S.gold : S.muted, background: dragging ? `${S.gold}10` : S.bg }}
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
          <span>{uploading ? 'Uploading...' : dragging ? 'Release to upload' : 'Drag and drop or click to upload'}</span>
        </label>
      )}

      {error && (
        <p className="m-3 rounded-xl px-3 py-2 text-xs luxury-body" style={{ color: S.error, background: `${S.error}12`, border: `1px solid ${S.error}25` }}>
          {error}
        </p>
      )}
    </div>
  );
}

function getMissingPhotoLabels(submission: Pick<ManSubmission, 'photo_fullbody_url' | 'photo_headshot_url'>) {
  return [
    submission.photo_fullbody_url ? null : 'full body photo',
    submission.photo_headshot_url ? null : 'headshot photo',
  ].filter(Boolean) as string[];
}

function ReportStatusBanner({ report, onGenerate, generating, canGenerate, missingPhotoText }: {
  report: ManReport | null;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
  missingPhotoText: string;
}) {
  if (!report) {
    return (
      <div className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: S.card, borderColor: S.border }}>
        <div>
          <p className="luxury-body text-sm" style={{ color: S.ink, fontWeight: 500 }}>No report generated yet</p>
          <p className="luxury-body text-xs mt-0.5" style={{ color: S.muted, fontWeight: 300 }}>Trigger the AI pipeline to create a draft.</p>
          {!canGenerate && <p className="luxury-body text-xs mt-2" style={{ color: S.error }}>{missingPhotoText}</p>}
        </div>
        <button
          onClick={onGenerate}
          disabled={generating || !canGenerate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
          style={{ background: S.slateDeep, color: S.bg }}
          title={!canGenerate ? missingPhotoText : undefined}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {generating ? 'Starting...' : 'Generate Report'}
        </button>
      </div>
    );
  }

  const tone = statusTone(report.status);
  const color = toneColor(tone);
  const canRetry = ['error', 'pending'].includes(report.status);

  return (
    <div className="rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4" style={{ background: `${color}10`, borderColor: `${color}28` }}>
      <div className="flex items-start gap-3">
        {report.status === 'generating' && <Loader2 size={16} className="animate-spin mt-0.5 flex-shrink-0" style={{ color }} />}
        {report.status === 'error' && <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color }} />}
        <div>
          <p className="luxury-body text-sm capitalize" style={{ color, fontWeight: 500 }}>
            {report.status === 'generating' ? `${stageLabel(report.progress_stage)}...` : report.status.replace(/_/g, ' ')}
          </p>
          {report.error_message && <p className="luxury-body text-xs mt-0.5" style={{ color: S.error }}>{report.error_message}</p>}
          {report.generated_at && (
            <p className="iconik-mono mt-1" style={{ fontSize: '10px', color: S.muted }}>
              Generated {new Date(report.generated_at).toLocaleString()}
            </p>
          )}
          {!canGenerate && canRetry && <p className="luxury-body text-xs mt-2" style={{ color: S.error }}>{missingPhotoText}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {['generating', 'draft_ready', 'in_review', 'approved', 'sent'].includes(report.status) && (
          <Link
            href={`/man/admin/report/${report.id}`}
            className="px-4 py-2 rounded-xl text-sm luxury-body transition"
            style={{ background: S.ink, color: S.bg }}
          >
            Open Report
          </Link>
        )}
        {report.status === 'sent' && (
          <Link
            href={`/man/report/${report.share_token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm luxury-body transition"
            style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
          >
            Client Link <ExternalLink size={12} />
          </Link>
        )}
        {canRetry && (
          <button
            onClick={onGenerate}
            disabled={generating || !canGenerate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
            style={{ background: S.slateDeep, color: S.bg }}
            title={!canGenerate ? missingPhotoText : undefined}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {generating ? 'Starting...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<ManSubmission | null>(null);
  const [reports, setReports] = useState<ManReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/man-admin/submissions/${submissionId}`, { cache: 'no-store' });
      const data = await res.json();
      setSubmission(data.submission ?? null);
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const latest = reports[0];
    if (latest?.status !== 'generating') return;
    const interval = setInterval(() => { void load(); }, 4000);
    return () => clearInterval(interval);
  }, [load, reports]);

  const handleGenerate = async () => {
    if (submission) {
      const missingPhotos = getMissingPhotoLabels(submission);
      if (missingPhotos.length > 0) {
        setGenError(`Upload ${missingPhotos.join(' and ')} before generating this report.`);
        return;
      }
    }

    setGenerating(true);
    setGenError('');
    try {
      const latest = reports[0] ?? null;
      const res = await fetch(
        latest?.id ? `/api/man-report/${latest.id}/resume-text` : `/api/man-report/generate/${submissionId}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? 'Generation failed');
        return;
      }
      if (data.reportId) router.push(`/man/admin/report/${data.reportId}`);
    } catch {
      setGenError('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !submission) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  if (!submission) {
    return <p className="luxury-body" style={{ color: S.muted }}>Submission not found.</p>;
  }

  const latestReport = reports[0] ?? null;
  const missingPhotos = getMissingPhotoLabels(submission);
  const canGenerate = missingPhotos.length === 0;
  const missingPhotoText = missingPhotos.length
    ? `Upload ${missingPhotos.join(' and ')} before generating this report.`
    : '';
  const clientLabel = submission.customer_email || submission.customer_phone || 'Man blueprint client';

  return (
    <div className="max-w-5xl">
      <Link href="/man/admin/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 luxury-body transition" style={{ color: S.muted }}>
        <ArrowLeft size={14} /> Back to submissions
      </Link>

      <div className="mb-6">
        <div className="iconik-micro mb-2" style={{ color: S.muted }}>Man Blueprint Intake</div>
        <h1 className="iconik-display" style={{ fontSize: '26px', color: S.ink }}>{clientLabel}</h1>
        <p className="luxury-body text-sm mt-1" style={{ color: S.muted, fontWeight: 300 }}>
          Submitted {new Date(submission.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="mb-6">
        <ReportStatusBanner
          report={latestReport}
          onGenerate={handleGenerate}
          generating={generating}
          canGenerate={canGenerate}
          missingPhotoText={missingPhotoText}
        />
        {genError && (
          <p className="luxury-body text-sm mt-3 rounded-xl px-4 py-2" style={{ color: S.error, background: `${S.error}12`, border: `1px solid ${S.error}25` }}>
            {genError}
          </p>
        )}
      </div>

      <div className="mb-6">
        <Section title="Review Context">
          <div className="grid md:grid-cols-4 gap-3">
            <ContextCard label="Primary goal" value={fmt(submission.primary_goal)} />
            <ContextCard label="Location" value={fmt(submission.location_tier)} />
            <ContextCard label="Body" value={fmt(submission.body_shape)} />
            <ContextCard label="Colour" value={fmt(submission.derived_colour_season)} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PhotoUploadCard
          label="Headshot"
          field="photo_headshot"
          url={submission.photo_headshot_url}
          submissionId={submission.id}
          onUploaded={next => setSubmission(next)}
        />
        <PhotoUploadCard
          label="Full Body"
          field="photo_fullbody"
          url={submission.photo_fullbody_url}
          submissionId={submission.id}
          onUploaded={next => setSubmission(next)}
        />
      </div>

      <div className="space-y-4">
        <Section title="Contact">
          <DataRow label="Email" value={submission.customer_email ?? '-'} />
          <DataRow label="Phone" value={submission.customer_phone ?? '-'} />
          <DataRow label="Location" value={fmt(submission.location_tier)} />
        </Section>

        <Section title="Section 1 - Basics">
          <DataRow label="Primary Goal" value={fmt(submission.primary_goal)} />
          <DataRow label="Style Relationship" value={fmt(submission.style_relationship)} />
          <DataRow label="Dressing Context" value={fmtMulti(submission.dressing_context)} />
          <DataRow label="Wardrobe" value={fmtMulti(submission.wardrobe_composition)} />
        </Section>

        <Section title="Section 2 - Body">
          <DataRow label="Height" value={fmt(submission.height_category)} />
          <DataRow label="Body Shape" value={fmt(submission.body_shape)} />
          <DataRow label="Fat Storage" value={fmt(submission.fat_storage_zone)} />
          <DataRow label="Highlight Zone" value={fmt(submission.highlight_zone)} />
          <DataRow label="Minimise Zone" value={fmt(submission.minimise_zone)} />
          <DataRow label="Fit Preference" value={fmt(submission.fit_preference)} />
        </Section>

        <Section title="Section 3 - Colour">
          <DataRow label="Skin Tone" value={fmt(submission.skin_tone)} />
          <DataRow label="Undertone" value={fmt(submission.vein_undertone)} />
          <DataRow label="White Test" value={fmt(submission.white_test)} />
          <DataRow label="Hair Colour" value={fmt(submission.hair_colour)} />
          <DataRow label="Eye Colour" value={fmt(submission.eye_colour)} />
          <DataRow label="Colour Season" value={fmt(submission.derived_colour_season)} />
        </Section>

        <Section title="Section 4 - Face">
          <DataRow label="Face Shape" value={fmt(submission.face_shape)} />
          <DataRow label="Feature Type" value={fmt(submission.facial_feature_type)} />
        </Section>

        <Section title="Section 5 - Style Identity">
          <DataRow label="Style Goal" value={fmt(submission.primary_style_goal)} />
          <DataRow label="Branch Answer" value={fmt(submission.branch_answer)} />
          <DataRow label="Style Tribes" value={fmtMulti(submission.style_tribes)} />
          <DataRow label="Structure" value={fmt(submission.style_pole_structure)} />
          <DataRow label="Expression" value={fmt(submission.style_pole_expression)} />
          <DataRow label="Tone" value={fmt(submission.style_pole_tone)} />
          <DataRow label="Register" value={fmt(submission.style_pole_register)} />
          <DataRow label="Style Blocker" value={fmt(submission.style_blocker)} />
          <DataRow label="Anti-Pref" value={fmt(submission.style_anti_pref)} />
          {submission.style_anti_pref_note && <DataRow label="Anti-Pref Note" value={submission.style_anti_pref_note} />}
          {submission.free_text_note && <DataRow label="Free Note" value={submission.free_text_note} />}
        </Section>
      </div>
    </div>
  );
}
