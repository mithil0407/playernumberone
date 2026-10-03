'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, Loader2, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { Avatar, Button, ReportStatusPill, clientDisplayName } from '@/components/manAdmin/ui';

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
  updated_at?: string | null;
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
  if (!value) return null;
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function fmtMulti(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => fmt(String(item))).join(', ');
  } catch {
    // Plain comma-separated intake values are expected for older submissions.
  }
  return value.split(',').map(item => fmt(item.trim())).join(', ');
}

function getMissingPhotoLabels(submission: Pick<ManSubmission, 'photo_fullbody_url' | 'photo_headshot_url'>) {
  return [
    submission.photo_fullbody_url ? null : 'full body photo',
    submission.photo_headshot_url ? null : 'headshot photo',
  ].filter(Boolean) as string[];
}

/** Only answered questions are shown; empty answers are noise when styling. */
function AnswerGroup({ title, rows }: { title: string; rows: Array<[string, string | null]> }) {
  const answered = rows.filter(([, value]) => value);
  if (answered.length === 0) return null;
  return (
    <div className="ma-card ma-card--flat p-6">
      <div className="ma-eyebrow mb-3">{title}</div>
      <dl>
        {answered.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[170px_1fr] sm:gap-4" style={{ borderTop: '1px solid var(--ma-line-2)' }}>
            <dt className="ma-faint text-[13px]">{label}</dt>
            <dd className="text-[14px] whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PhotoCard({ label, field, url, submissionId, onUploaded }: {
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
      const res = await fetch(`/api/man-admin/submissions/${submissionId}`, { method: 'PATCH', body: formData });
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
      className="group relative overflow-hidden rounded-[22px]"
      style={{
        aspectRatio: '3 / 4',
        background: dragging ? 'var(--ma-accent-soft)' : 'var(--ma-surface)',
        border: `1px ${url ? 'solid' : 'dashed'} ${dragging ? 'var(--ma-accent)' : 'var(--ma-line)'}`,
      }}
      onDragEnter={event => { event.preventDefault(); setDragging(true); }}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={event => { event.preventDefault(); setDragging(false); }}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        void uploadFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
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
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3" style={{ background: 'linear-gradient(transparent, rgba(17,19,21,0.55))' }}>
            <span className="text-[13px] font-semibold text-white">{label}</span>
            <label htmlFor={inputId} className="ma-btn ma-btn--secondary ma-btn--sm cursor-pointer">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Replace
            </label>
          </div>
        </>
      ) : (
        <label htmlFor={inputId} className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
          {uploading ? <Loader2 size={22} className="animate-spin ma-faint" /> : <Upload size={22} className="ma-faint" />}
          <span className="text-[14px] font-semibold">{label}</span>
          <span className="ma-faint text-[13px]">{uploading ? 'Uploading…' : dragging ? 'Release to upload' : 'Drop a photo or click'}</span>
        </label>
      )}
      {error && <p className="absolute inset-x-3 top-3 rounded-xl px-3 py-2 text-[12px]" style={{ background: 'var(--ma-surface)', color: 'var(--ma-red)' }}>{error}</p>}
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin ma-faint" />
      </div>
    );
  }

  if (!submission) {
    return <p className="ma-muted">Submission not found.</p>;
  }

  const latestReport = reports[0] ?? null;
  const missingPhotos = getMissingPhotoLabels(submission);
  const canGenerate = missingPhotos.length === 0;
  const name = clientDisplayName(submission.customer_email, submission.customer_phone);
  const canRetry = latestReport && ['error', 'pending'].includes(latestReport.status);
  const reportOpenable = latestReport && ['generating', 'draft_ready', 'in_review', 'approved', 'sent'].includes(latestReport.status);

  const snapshot: Array<[string, string | null]> = [
    ['Colour season', fmt(submission.derived_colour_season)],
    ['Face', fmt(submission.face_shape)],
    ['Body', fmt(submission.body_shape)],
    ['Height', fmt(submission.height_category)],
    ['Fit', fmt(submission.fit_preference)],
    ['Location', fmt(submission.location_tier)],
  ];
  const clientWords = [submission.style_anti_pref_note, submission.free_text_note].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-[1080px]">
      <Link href="/man/admin/dashboard" className="ma-btn ma-btn--ghost ma-btn--sm -ml-3 mb-6">
        <ArrowLeft size={14} /> Clients
      </Link>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={submission.photo_headshot_url} size={56} />
          <div className="min-w-0">
            <h1 className="ma-title" style={{ fontSize: 28 }}>{name}</h1>
            <p className="ma-faint mt-1 truncate text-[14px]">
              {[submission.customer_email, submission.customer_phone].filter(Boolean).join(' · ')}
              {' · '}Submitted {new Date(submission.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {latestReport && <ReportStatusPill report={latestReport} />}
          {latestReport?.status === 'sent' && (
            <Button size="sm" icon={<ExternalLink size={13} />} onClick={() => window.open(`/man/report/${latestReport.share_token}`, '_blank')}>Client link</Button>
          )}
          {reportOpenable && (
            <Button variant="dark" onClick={() => router.push(`/man/admin/report/${latestReport.id}`)}>Open report</Button>
          )}
          {!latestReport && (
            <Button variant="primary" icon={<Sparkles size={15} />} loading={generating} disabled={!canGenerate} onClick={handleGenerate}>
              Generate Blueprint
            </Button>
          )}
          {canRetry && (
            <Button variant="primary" icon={<RotateCcw size={15} />} loading={generating} disabled={!canGenerate} onClick={handleGenerate}>
              Retry generation
            </Button>
          )}
        </div>
      </div>

      {(genError || (!canGenerate && (!latestReport || canRetry)) || latestReport?.error_message) && (
        <div className="mb-6 rounded-2xl px-5 py-3.5 text-[14px]" style={{ background: 'var(--ma-red-soft)', color: 'var(--ma-red)' }}>
          {genError || latestReport?.error_message || `Upload the ${missingPhotos.join(' and ')} to generate this Blueprint.`}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="grid grid-cols-2 gap-4 self-start">
          <PhotoCard label="Headshot" field="photo_headshot" url={submission.photo_headshot_url} submissionId={submission.id} onUploaded={setSubmission} />
          <PhotoCard label="Full body" field="photo_fullbody" url={submission.photo_fullbody_url} submissionId={submission.id} onUploaded={setSubmission} />
        </div>

        <div className="space-y-4">
          <div className="ma-card p-6">
            <div className="ma-eyebrow mb-4">At a glance</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {snapshot.filter(([, value]) => value).map(([label, value]) => (
                <div key={label}>
                  <div className="ma-faint text-[12px]">{label}</div>
                  <div className="mt-0.5 text-[15px]" style={{ fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            {submission.primary_goal && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--ma-line-2)' }}>
                <div className="ma-faint text-[12px]">Goal</div>
                <div className="mt-0.5 text-[15px]">{fmt(submission.primary_goal)}</div>
              </div>
            )}
          </div>

          {clientWords.length > 0 && (
            <div className="ma-card p-6" style={{ background: 'var(--ma-accent-soft)', borderColor: 'transparent', boxShadow: 'none' }}>
              <div className="ma-eyebrow mb-3" style={{ color: 'var(--ma-accent)' }}>In his words</div>
              {clientWords.map(note => (
                <p key={note} className="ma-serif text-[19px] leading-snug" style={{ color: 'var(--ma-ink)' }}>&ldquo;{note}&rdquo;</p>
              ))}
            </div>
          )}

          {latestReport?.generated_at && (
            <p className="ma-faint flex items-center gap-1.5 text-[13px]">
              <Check size={13} /> Generated {new Date(latestReport.generated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 mb-4 ma-h2">All answers</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnswerGroup title="Life and wardrobe" rows={[
          ['Primary goal', fmt(submission.primary_goal)],
          ['Style relationship', fmt(submission.style_relationship)],
          ['Dressing context', fmtMulti(submission.dressing_context)],
          ['Wardrobe', fmtMulti(submission.wardrobe_composition)],
        ]} />
        <AnswerGroup title="Body" rows={[
          ['Height', fmt(submission.height_category)],
          ['Body shape', fmt(submission.body_shape)],
          ['Carries weight', fmt(submission.fat_storage_zone)],
          ['Wants to highlight', fmt(submission.highlight_zone)],
          ['Wants to minimise', fmt(submission.minimise_zone)],
          ['Fit preference', fmt(submission.fit_preference)],
        ]} />
        <AnswerGroup title="Colour" rows={[
          ['Skin tone', fmt(submission.skin_tone)],
          ['Undertone', fmt(submission.vein_undertone)],
          ['White test', fmt(submission.white_test)],
          ['Hair colour', fmt(submission.hair_colour)],
          ['Eye colour', fmt(submission.eye_colour)],
          ['Colour season', fmt(submission.derived_colour_season)],
          ['Face shape', fmt(submission.face_shape)],
          ['Feature type', fmt(submission.facial_feature_type)],
        ]} />
        <AnswerGroup title="Style identity" rows={[
          ['Style goal', fmt(submission.primary_style_goal)],
          ['Branch answer', fmt(submission.branch_answer)],
          ['Style tribes', fmtMulti(submission.style_tribes)],
          ['Structure', fmt(submission.style_pole_structure)],
          ['Expression', fmt(submission.style_pole_expression)],
          ['Tone', fmt(submission.style_pole_tone)],
          ['Register', fmt(submission.style_pole_register)],
          ['Holding him back', fmt(submission.style_blocker)],
          ['Won’t wear', fmt(submission.style_anti_pref)],
        ]} />
      </div>
    </div>
  );
}
