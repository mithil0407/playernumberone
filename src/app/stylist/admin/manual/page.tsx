'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardPaste, ImageIcon, Loader2, Upload, Zap } from 'lucide-react';

const S = {
  bg: '#F4EFE5',
  card: '#EDE5D2',
  border: 'rgba(44,38,34,0.1)',
  rowBorder: 'rgba(44,38,34,0.07)',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.45)',
  slateDeep: '#7E9098',
  gold: '#C9A96E',
  error: '#C4645A',
  success: '#5A8B6A',
};

const PHOTO_FIELDS = [
  { key: 'headshot', label: 'Headshot', hint: 'Face-forward selfie or headshot' },
  { key: 'full_body_front', label: 'Full Body Front', hint: 'Front full-length photo' },
  { key: 'full_body_side', label: 'Side Profile', hint: 'Side full-length photo' },
] as const;

type PhotoKey = typeof PHOTO_FIELDS[number]['key'];

const SAMPLE_NOTES = `=== Shalini - Consultation Notes ===
Phone:
Date:

--- Profile ---
Age:
Occupation:
Height (cm):
Weight (kg):
Body Shape:
Undertone:
Skin Type:
Hair Type:
Footwear Preference:
White T-shirt/Kurta without makeup:
Natural skin tint:

--- Style Goals & Motivations ---
What prompted this consultation:
Main Style Goal:
How they want to feel:
Aesthetics:

--- Body Concerns ---
Self-Conscious Areas:

--- Restrictions & Boundaries ---
Fit Restrictions:
Style Boundaries:

--- Wardrobe Preferences ---
Items/Styles She LOVES:`;

function FileDrop({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label
      className="block rounded-2xl border p-4 cursor-pointer transition"
      style={{ background: S.card, borderColor: S.border }}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={event => onChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="luxury-body text-sm" style={{ color: S.ink, fontWeight: 500 }}>{label}</p>
          <p className="luxury-body text-xs mt-1" style={{ color: S.muted, fontWeight: 300 }}>{hint}</p>
          {file && <p className="iconik-mono mt-3 truncate max-w-[220px]" style={{ fontSize: '10px', color: S.success }}>{file.name}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: S.bg, color: file ? S.success : S.muted }}>
          {file ? <ImageIcon size={17} /> : <Upload size={17} />}
        </div>
      </div>
    </label>
  );
}

export default function ManualStylistBlueprintPage() {
  const router = useRouter();
  const [rawNotes, setRawNotes] = useState('');
  const [fullName, setFullName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [photos, setPhotos] = useState<Record<PhotoKey, File | null>>({
    headshot: null,
    full_body_front: null,
    full_body_side: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const missingPhotoCount = useMemo(
    () => PHOTO_FIELDS.filter(field => !photos[field.key]).length,
    [photos],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setStatus('');
    if (rawNotes.trim().length < 20) {
      setError('Paste the consultation notes before creating a report.');
      return;
    }
    if (missingPhotoCount) {
      setError('Upload the headshot, front full body, and side profile photos.');
      return;
    }

    setSubmitting(true);
    try {
      setStatus('Creating manual intake...');
      const formData = new FormData();
      formData.set('raw_notes', rawNotes);
      if (fullName.trim()) formData.set('full_name', fullName.trim());
      if (customerPhone.trim()) formData.set('customer_phone', customerPhone.trim());
      for (const field of PHOTO_FIELDS) {
        const file = photos[field.key];
        if (file) formData.set(field.key, file);
      }

      const intakeRes = await fetch('/api/stylist-admin/manual-submissions', {
        method: 'POST',
        body: formData,
      });
      const intakeData = await intakeRes.json();
      if (!intakeRes.ok) throw new Error(intakeData.error || 'Manual intake creation failed.');

      setStatus('Starting report generation...');
      const generateRes = await fetch(`/api/stylist-blueprint/generate/${intakeData.submissionId}`, {
        method: 'POST',
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error || 'Report generation failed.');

      router.push(`/stylist/admin/report/${generateData.reportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create manual report.');
      setSubmitting(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
        <div>
          <div className="iconik-micro mb-2" style={{ color: S.muted }}>ICONIK Stylist</div>
          <h1 className="iconik-display" style={{ fontSize: '28px', color: S.ink }}>Manual Indian Blueprint</h1>
          <p className="luxury-body text-sm mt-2 max-w-2xl" style={{ color: S.muted, fontWeight: 300 }}>
            Paste consultation notes, upload the three client images, and generate the same 36-page report with 20 outfits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRawNotes(current => current || SAMPLE_NOTES)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body transition"
          style={{ background: S.card, color: S.muted, border: `1px solid ${S.border}` }}
        >
          <ClipboardPaste size={14} /> Insert Template
        </button>
      </div>

      <form onSubmit={submit} className="grid xl:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border p-5" style={{ background: S.card, borderColor: S.border }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <label htmlFor="raw-notes" className="iconik-micro" style={{ color: S.muted }}>Consultation Notes</label>
            <span className="iconik-mono" style={{ fontSize: '10px', color: S.gold }}>{rawNotes.trim().length} chars</span>
          </div>
          <textarea
            id="raw-notes"
            value={rawNotes}
            onChange={event => setRawNotes(event.target.value)}
            placeholder="Paste the free-text consultation notes here..."
            className="w-full min-h-[640px] rounded-xl p-4 outline-none luxury-body text-sm leading-6 resize-y"
            style={{ background: S.bg, color: S.ink, border: `1px solid ${S.rowBorder}`, fontWeight: 300 }}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: S.card, borderColor: S.border }}>
            <div>
              <div className="iconik-micro mb-2" style={{ color: S.muted }}>Optional Overrides</div>
              <p className="luxury-body text-xs leading-5" style={{ color: S.muted, fontWeight: 300 }}>
                Use these only if the notes do not contain a clear name or phone.
              </p>
            </div>
            <input
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              placeholder="Client name"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none luxury-body"
              style={{ background: S.bg, border: `1px solid ${S.rowBorder}`, color: S.ink }}
            />
            <input
              value={customerPhone}
              onChange={event => setCustomerPhone(event.target.value)}
              placeholder="Client phone"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none luxury-body"
              style={{ background: S.bg, border: `1px solid ${S.rowBorder}`, color: S.ink }}
            />
          </div>

          <div className="space-y-3">
            {PHOTO_FIELDS.map(field => (
              <FileDrop
                key={field.key}
                label={field.label}
                hint={field.hint}
                file={photos[field.key]}
                onChange={file => setPhotos(current => ({ ...current, [field.key]: file }))}
              />
            ))}
          </div>

          {error && <p className="luxury-body text-sm" style={{ color: S.error }}>{error}</p>}
          {status && <p className="luxury-body text-sm" style={{ color: S.slateDeep }}>{status}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm luxury-body disabled:opacity-50 transition"
            style={{ background: S.ink, color: S.bg }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {submitting ? 'Creating Report...' : 'Create Report'}
          </button>
        </aside>
      </form>
    </div>
  );
}
