'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Lock, Ruler, ShieldCheck, TriangleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  CLIENT_UPLOAD_MEASUREMENTS,
  CLIENT_UPLOAD_PHOTOS,
  type ClientUploadMeasurementKey,
  type ClientUploadPhotoKey,
  type MeasurementUnit,
} from '@/lib/consultationMeasurements';

const BUCKET = 'consultation-client-uploads';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const C = { bg: '#f4f2ee', card: '#ffffff', ink: '#1c1917', muted: '#6b6560', line: '#e7e2db', wine: '#6b1d2a', wineSoft: '#f6ecec', green: '#2f6b45', greenSoft: '#e8f2ea', red: '#a3272a' };
const serif = { fontFamily: 'var(--font-bodoni-moda), Georgia, serif' };

type PhotoState = { status: 'idle' | 'uploading' | 'done' | 'error'; preview?: string; path?: string; error?: string };
type Props = { token: string; state: 'ready' | 'submitted' | 'expired' | 'invalid' | 'error'; firstName: string; expiresAt: string | null };

async function post(token: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/consultation-upload/${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Something went wrong. Please try again.');
  return result;
}

/** Phone photos are often 5–12 MB. Shrink to a sharp 2400px JPEG when the browser can decode it. */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (blob && blob.size > 0) return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch { /* fall back to the original file */ }
  return file;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen px-4 py-10" style={{ background: C.bg, color: C.ink }}>
    <div className="mx-auto w-full max-w-xl">
      <p className="mb-8 text-center text-[12px] tracking-[0.45em]" style={{ color: C.ink }}>ICONIK</p>
      {children}
    </div>
  </main>;
}

function Notice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <Shell><div className="rounded-3xl p-8 text-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.wineSoft, color: C.wine }}>{icon}</div>
    <h1 className="text-[30px] leading-tight" style={serif}>{title}</h1>
    <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6" style={{ color: C.muted }}>{text}</p>
  </div></Shell>;
}

export default function ClientUploadForm({ token, state, firstName, expiresAt }: Props) {
  const [status, setStatus] = useState(state);
  const [photos, setPhotos] = useState<Partial<Record<ClientUploadPhotoKey, PhotoState>>>({});
  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [values, setValues] = useState<Partial<Record<ClientUploadMeasurementKey, string>>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach(url => URL.revokeObjectURL(url)), []);

  const setPhoto = (key: ClientUploadPhotoKey, next: PhotoState) => setPhotos(current => ({ ...current, [key]: next }));

  async function choose(key: ClientUploadPhotoKey, original: File | undefined) {
    if (!original) return;
    const preview = URL.createObjectURL(original);
    previews.current.push(preview);
    setPhoto(key, { status: 'uploading', preview });
    try {
      const file = await shrink(original);
      const contentType = (file.type || 'image/jpeg').toLowerCase();
      if (!ALLOWED.includes(contentType)) throw new Error('Please choose a JPG, PNG or HEIC photo.');
      if (file.size > MAX_BYTES) throw new Error('This photo is too large. Please choose one under 10 MB.');
      const prepared = await post(token, { action: 'prepare', photo: key, contentType, size: file.size });
      const { error: uploadError } = await supabase.storage.from(BUCKET)
        .uploadToSignedUrl(String(prepared.path), String(prepared.uploadToken), file, { contentType });
      if (uploadError) throw new Error('Upload failed. Please check your connection and try again.');
      setPhoto(key, { status: 'done', preview, path: String(prepared.path) });
    } catch (caught) {
      setPhoto(key, { status: 'error', preview, error: caught instanceof Error ? caught.message : 'Upload failed. Please try again.' });
    }
  }

  const uploading = Object.values(photos).some(photo => photo?.status === 'uploading');
  const missingPhotos = CLIENT_UPLOAD_PHOTOS.filter(photo => photo.required && photos[photo.key]?.status !== 'done');
  const missingMeasurements = CLIENT_UPLOAD_MEASUREMENTS.filter(item => !values[item.key]?.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || uploading) return;
    if (missingPhotos.length) return setError(`Please add your ${missingPhotos[0].label.toLowerCase()}.`);
    if (missingMeasurements.length) return setError(`Please enter your ${missingMeasurements[0].label.toLowerCase()} measurement.`);
    setSubmitting(true); setError('');
    try {
      const photoPaths = Object.fromEntries(CLIENT_UPLOAD_PHOTOS.flatMap(photo => photos[photo.key]?.path ? [[photo.key, photos[photo.key]!.path]] : []));
      await post(token, { action: 'submit', photoPaths, measurements: { unit, ...values } });
      setStatus('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit. Please try again.');
    } finally { setSubmitting(false); }
  }

  if (status === 'submitted') return <Notice icon={<Check size={22} />} title="Thank you, we have everything" text="Your photos and measurements are with your ICONIK stylist. Your Blueprint will be ready within 4 days." />;
  if (status === 'expired') return <Notice icon={<Lock size={20} />} title="This link has expired" text="For your privacy, upload links work for 30 days. Please message your stylist on WhatsApp for a new link." />;
  if (status === 'invalid') return <Notice icon={<Lock size={20} />} title="This link isn't valid" text="Please check you opened the full link your stylist sent you, or message them for a new one." />;
  if (status === 'error') return <Notice icon={<TriangleAlert size={20} />} title="Something went wrong" text="We couldn't open your upload page. Please refresh in a minute." />;

  return <Shell>
    <h1 className="text-center text-[34px] leading-tight sm:text-[40px]" style={serif}>{firstName ? <>Hi {firstName}, <em>almost there</em></> : <em>Almost there</em>}</h1>
    <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-6" style={{ color: C.muted }}>Add 3 photos and 5 measurements so your stylist can build your Blueprint.</p>
    <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[12px]" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
      <ShieldCheck size={14} style={{ color: C.green }} /> Private. Only your ICONIK stylist sees these{expiresAt ? ` · link works until ${new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
    </p>

    <form onSubmit={submit} className="mt-8 space-y-5">
      <section className="rounded-3xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <h2 className="mb-1 flex items-center gap-2 text-[20px]" style={serif}><Camera size={18} /> Photos</h2>
        <p className="mb-4 text-[13px]" style={{ color: C.muted }}>Fitted clothes, plain background, good light. No filters.</p>
        <div className="grid grid-cols-2 gap-3">
          {CLIENT_UPLOAD_PHOTOS.map(photo => {
            const current = photos[photo.key];
            return <label key={photo.key} className="block cursor-pointer overflow-hidden rounded-2xl" style={{ border: `1px solid ${current?.status === 'error' ? C.red : C.line}`, background: C.bg }}>
              <input type="file" accept="image/*" className="sr-only" disabled={current?.status === 'uploading' || submitting} onChange={event => { void choose(photo.key, event.target.files?.[0]); event.target.value = ''; }} />
              <div className="relative flex aspect-[3/4] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {current?.preview ? <img src={current.preview} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-[12px]" style={{ color: C.muted }}><Camera size={22} />Tap to add</span>}
                {current?.status === 'uploading' && <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}><Loader2 size={22} className="animate-spin" style={{ color: C.wine }} /></span>}
                {current?.status === 'done' && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: C.green }}><Check size={15} /></span>}
              </div>
              <div className="p-3">
                <p className="text-[13px]" style={{ fontWeight: 600 }}>{photo.label}{photo.required ? '' : ' (optional)'}</p>
                <p className="mt-0.5 text-[12px] leading-4" style={{ color: current?.status === 'error' ? C.red : C.muted }}>{current?.status === 'error' ? current.error : current?.status === 'done' ? 'Uploaded · tap to change' : photo.hint}</p>
              </div>
            </label>;
          })}
        </div>
      </section>

      <section className="rounded-3xl p-5 sm:p-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[20px]" style={serif}><Ruler size={18} /> Measurements</h2>
          <div className="flex rounded-full p-1 text-[13px]" style={{ background: C.bg }} role="group" aria-label="Measurement unit">
            {(['in', 'cm'] as const).map(option => <button key={option} type="button" aria-pressed={unit === option} onClick={() => setUnit(option)} className="rounded-full px-3 py-1" style={unit === option ? { background: C.ink, color: '#fff' } : { color: C.muted }}>{option === 'in' ? 'inches' : 'cm'}</button>)}
          </div>
        </div>
        <p className="mb-4 text-[13px]" style={{ color: C.muted }}>Use a soft tape, snug but not tight, over light clothing.</p>
        <div className="space-y-3">
          {CLIENT_UPLOAD_MEASUREMENTS.map(item => <label key={item.key} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: C.bg }}>
            <span className="min-w-0 flex-1"><span className="block text-[14px]" style={{ fontWeight: 600 }}>{item.label}</span><span className="block text-[12px] leading-4" style={{ color: C.muted }}>{item.hint}</span></span>
            <input type="text" inputMode="decimal" autoComplete="off" value={values[item.key] ?? ''} onChange={event => setValues(current => ({ ...current, [item.key]: event.target.value.replace(/[^0-9.]/g, '') }))} className="w-20 rounded-xl px-3 py-2 text-right text-[16px] outline-none" style={{ background: C.card, border: `1px solid ${C.line}` }} aria-label={`${item.label} in ${unit === 'in' ? 'inches' : 'centimetres'}`} />
            <span className="w-6 text-[12px]" style={{ color: C.muted }}>{unit}</span>
          </label>)}
        </div>
      </section>

      {error && <p role="alert" className="rounded-2xl p-4 text-[14px]" style={{ background: C.wineSoft, color: C.red }}>{error}</p>}
      <button type="submit" disabled={submitting || uploading} className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] text-white disabled:opacity-60" style={{ background: C.wine, fontWeight: 600 }}>
        {submitting ? <><Loader2 size={17} className="animate-spin" /> Sending securely…</> : uploading ? <><Loader2 size={17} className="animate-spin" /> Uploading photos…</> : 'Send to my stylist'}
      </button>
      <p className="pb-6 text-center text-[12px]" style={{ color: C.muted }}>Once sent, this link closes so nobody else can use it.</p>
    </form>
  </Shell>;
}
