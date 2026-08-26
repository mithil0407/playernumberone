'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Check, Clock3, Eye, LoaderCircle, Lock, LockKeyhole, Palette, RotateCcw, Ruler, ScanFace, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import type { StyleScanAnswersV1 } from '@/lib/styleScan';
import { postStyleScanJson, prepareStyleScanPhoto, StyleScanUploadError, uploadStyleScanPhoto } from '@/lib/styleScanPhotoUpload';
import type { StyleScanPhotoRole } from '@/lib/styleScanPhotoTypes';

type PhotoRole = StyleScanPhotoRole;
type Option<T extends string> = { value: T; label: string };
type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'checking' | 'done' | 'error';
type PhotoUploadState = { phase: UploadPhase; progress: number; savedBytes: number };

const PRIVACY = 'Seen only by ICONIK’s styling system and your stylist. Never shared, never used in marketing, deleted on request.';
const STEPS = [
  { label: 'Face photo', short: 'Face' },
  { label: 'Full photo', short: 'Full photo' },
  { label: 'Quick answers', short: 'Questions' },
  { label: 'Your result', short: 'Result' },
];

function trackScanEvent(name: string, details: Record<string, string | number | boolean> = {}) {
  if (typeof window === 'undefined') return;
  // Analytics is optional. A blocked Signals Gateway must never interrupt the scan.
  try {
    // No answers, contact fields, or asset references are included.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq?.('trackCustom', name, { funnel: 'style_scan_v1', ...details });
  } catch { /* Third-party analytics failures are intentionally isolated. */ }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer?.push({ event: name, funnel: 'style_scan_v1', ...details });
  } catch { /* Third-party analytics failures are intentionally isolated. */ }
}

const EMPTY_UPLOAD_STATE: PhotoUploadState = { phase: 'idle', progress: 0, savedBytes: 0 };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const questions: Array<{
  key: keyof StyleScanAnswersV1;
  prompt: string;
  options: Option<string>[];
}> = [
  { key: 'concern', prompt: 'What often feels wrong in an outfit?', options: [
    { value: 'tummy', label: 'My tummy stands out' }, { value: 'arms', label: 'My arms feel exposed' }, { value: 'hips', label: 'My hips look wider' },
    { value: 'height', label: 'I look shorter' }, { value: 'nothing_specific', label: 'Nothing specific' },
  ] },
  { key: 'dressCode', prompt: 'What is your daily dress code?', options: [
    { value: 'western_office', label: 'Western office' }, { value: 'ethnic_leaning', label: 'Ethnic-leaning' },
    { value: 'mixed', label: 'Mixed' }, { value: 'mostly_home', label: 'Mostly home' },
  ] },
  { key: 'dressPreference', prompt: 'How do you prefer to dress?', options: [
    { value: 'modest', label: 'Modest — minimal skin' }, { value: 'balanced', label: 'Balanced' }, { value: 'fitted', label: 'Love fitted looks' },
  ] },
  { key: 'upcoming', prompt: 'What is coming up in the next 60 days?', options: [
    { value: 'office_events', label: 'Office events' }, { value: 'wedding', label: 'Wedding' }, { value: 'festive', label: 'Festive' },
    { value: 'travel', label: 'Travel' }, { value: 'nothing', label: 'Nothing planned' },
  ] },
  { key: 'lastFeltGreat', prompt: 'When did you last feel good in an outfit?', options: [
    { value: 'this_week', label: 'This week' }, { value: 'cant_remember', label: 'I can’t remember' }, { value: 'old_weight', label: 'At my old weight' },
  ] },
];

function Logo({ light = false }: { light?: boolean }) {
  return <span className={`iconik-display whitespace-nowrap text-[17px] tracking-[0.32em] ${light ? 'text-[#F8F3E9]' : 'text-[#2C2622]'}`}>I C O N I K</span>;
}

function StepHeader({ step }: { step: number }) {
  const activeIndex = Math.max(0, step - 1);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#211C19]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Logo light />
        <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
          {STEPS.map((item, index) => <div key={item.label} className="flex items-center">
            <div className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${activeIndex === index ? 'bg-white text-[#211C19]' : index < activeIndex ? 'text-[#D9B98A]' : 'text-white/35'}`}>
              <span className="iconik-mono text-[8px]">0{index + 1}</span><span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </div>
            {index < STEPS.length - 1 && <span className={`mx-1 h-px w-5 ${index < activeIndex ? 'bg-[#D9B98A]' : 'bg-white/12'}`} />}
          </div>)}
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <span className="text-[10px] text-white/50">{STEPS[activeIndex]?.short}</span>
          <span className="iconik-mono text-[9px] text-[#D9B98A]">0{activeIndex + 1} / 04</span>
        </div>
      </div>
      <div className="h-[2px] bg-white/8"><div className="h-full bg-[#D9B98A] transition-[width] duration-500" style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }} /></div>
    </header>
  );
}

const scanDeliverables = [
  { number: '01', icon: ScanFace, title: 'Your main style blocker', copy: 'The biggest reason your outfits do not feel right.' },
  { number: '02', icon: Eye, title: 'Where it shows up', copy: 'The part of your outfit that is causing the problem.' },
  { number: '03', icon: RotateCcw, title: 'Why it keeps happening', copy: 'The pattern that follows you from one outfit to the next.' },
  { number: '04', icon: Check, title: 'What matters first', copy: 'The one issue to understand before you buy more clothes.' },
];

function ScanPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mr-0">
      <div className="absolute -inset-8 rounded-full bg-[#B68C52]/18 blur-3xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#2D2723] p-2 shadow-[0_28px_70px_rgba(0,0,0,.34)] sm:rounded-[32px] sm:p-4 sm:shadow-[0_36px_100px_rgba(0,0,0,.38)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-[#6D5A48] sm:rounded-[24px]">
          <Image src="/images/style-scan-blocker-hero.webp" alt="A woman checking how her outfit looks in a mirror" fill priority sizes="(min-width: 1024px) 46vw, 92vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#211C19]/85 via-transparent to-[#211C19]/15" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#211C19]/75 px-3 py-2 text-[8px] uppercase tracking-[.13em] text-white backdrop-blur-md sm:left-6 sm:top-6 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[.16em]"><Sparkles className="h-3 w-3 text-[#D9B98A] sm:h-3.5 sm:w-3.5" /> One style blocker found</div>
          <div className="absolute bottom-3 left-3 right-3 rounded-[18px] border border-white/15 bg-[#F8F3E9]/95 p-4 text-[#211C19] shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-6 sm:rounded-[22px] sm:p-6">
            <div className="iconik-micro text-[#A77A43]">SAMPLE RESULT</div>
            <div className="mt-2.5 flex items-start gap-2.5 sm:mt-3 sm:gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211C19] text-white sm:h-10 sm:w-10"><ScanFace className="h-4 w-4" /></div><div><h2 className="iconik-display text-xl sm:text-3xl">Main issue: outfit balance</h2><p className="mt-1.5 text-[10px] leading-4 text-[#211C19]/58 sm:mt-2 sm:text-xs sm:leading-5">The pieces may fit. But too many parts of the outfit are pulling the eye.</p></div></div>
            <div className="mt-4 hidden items-center justify-between border-t border-[#211C19]/10 pt-4 text-[9px] uppercase tracking-[.13em] text-[#211C19]/45 sm:flex"><span>We find the problem</span><span className="flex items-center gap-1.5 text-[#6D846B]"><Check className="h-3.5 w-3.5" /> Personal result</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoStep({ role, preview, uploadState, error, onChoose, onRetry }: {
  role: PhotoRole;
  preview: string;
  uploadState: PhotoUploadState;
  error: string;
  onChoose: (file: File) => void;
  onRetry: () => void;
}) {
  const headshot = role === 'headshot';
  const uploading = ['preparing', 'uploading', 'checking'].includes(uploadState.phase);
  const statusLabel = uploadState.phase === 'preparing'
    ? 'Making your photo upload faster…'
    : uploadState.phase === 'uploading'
      ? `Uploading securely · ${uploadState.progress}%`
      : uploadState.phase === 'checking'
        ? 'Checking light and clarity…'
        : '';
  const tips = headshot
    ? ['Face a window—never put the window behind you', 'Keep filters, portrait blur and heavy makeup off', 'Include your hairline, face, neck and upper shoulders']
    : ['Show your complete outline from head to toe', 'Place the camera around waist height, not from above', 'Wear straight or fitted clothing—not an oversized layer'];
  return (
    <section className="mx-auto grid max-w-6xl gap-6 py-6 sm:gap-8 sm:py-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-14 lg:py-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#A77A43]/25 bg-[#E9DCC8] px-3 py-2 text-[9px] uppercase tracking-[.2em] text-[#8E6335]">{headshot ? <Palette className="h-3.5 w-3.5" /> : <Ruler className="h-3.5 w-3.5" />}{headshot ? 'Step 01 · Face photo' : 'Step 02 · Full photo'}</div>
        <h1 className="iconik-display mt-4 text-[40px] leading-[.98] text-[#211C19] sm:mt-6 sm:text-6xl lg:text-7xl">{headshot ? 'Start with a clear face photo.' : 'Now add a full-body photo.'}</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-[#211C19]/62 sm:mt-6 sm:text-base sm:leading-7">{headshot
          ? 'Natural light helps us see which colours work with your face. Please do not use a filter.'
          : 'A clear photo from head to toe helps us see how clothes sit on your frame.'}</p>

        <div className="mt-5 overflow-hidden rounded-[20px] bg-[#211C19] p-4 text-white sm:mt-8 sm:rounded-[24px] sm:p-6">
          <div className="iconik-micro text-[#D9B98A]">WHY WE NEED THIS PHOTO</div>
          {headshot ? <>
            <div className="mt-4 flex gap-2 sm:mt-5">{['#D0A07B','#8F5F49','#E2C4A7','#735447','#C69872'].map(hex => <span key={hex} className="h-8 flex-1 rounded-full border border-white/10 sm:h-10" style={{ backgroundColor: hex }} />)}</div>
            <p className="mt-4 text-xs leading-6 text-white/58">It helps us check if colour is one of the reasons your outfits feel wrong.</p>
          </> : <>
            <div className="relative mt-5 h-20 overflow-hidden rounded-xl border border-white/10 bg-white/[.03]">
              <div className="absolute left-[18%] right-[18%] top-5 border-t border-dashed border-[#D9B98A]" /><div className="absolute left-[12%] right-[12%] top-12 border-t border-dashed border-white/40" />
              <span className="absolute left-[18%] top-[17px] h-2 w-2 -translate-x-1/2 rounded-full bg-[#D9B98A]" /><span className="absolute right-[18%] top-[17px] h-2 w-2 translate-x-1/2 rounded-full bg-[#D9B98A]" />
              <span className="absolute left-[12%] top-[45px] h-2 w-2 -translate-x-1/2 rounded-full bg-white/70" /><span className="absolute right-[12%] top-[45px] h-2 w-2 translate-x-1/2 rounded-full bg-white/70" />
            </div>
            <p className="mt-4 text-xs leading-6 text-white/58">It helps us check if outfit balance is the main problem.</p>
          </>}
        </div>

        <div className="mt-5 space-y-2.5 sm:mt-7 sm:space-y-3">{tips.map((tip, index) => <div key={tip} className="flex items-start gap-3 text-[11px] leading-5 text-[#211C19]/62 sm:text-xs"><span className="iconik-mono mt-0.5 text-[8px] text-[#A77A43]">0{index + 1}</span><span>{tip}</span></div>)}</div>
      </div>

      <div>
        <div className="rounded-[22px] border border-[#211C19]/10 bg-white p-2.5 shadow-[0_18px_50px_rgba(55,43,32,.09)] sm:rounded-[30px] sm:p-5 sm:shadow-[0_24px_70px_rgba(55,43,32,.10)]">
          <div className="mb-4 flex items-center justify-between px-2 pt-1"><div><div className="text-xs font-semibold text-[#211C19]">{headshot ? 'Face photograph' : 'Full-body photograph'}</div><div className="mt-1 text-[10px] text-[#211C19]/40">Private · quality checked automatically</div></div><span className="iconik-mono text-[9px] text-[#A77A43]">{headshot ? '01 / 02' : '02 / 02'}</span></div>
          <label className={`relative block overflow-hidden rounded-[24px] border-2 transition ${uploadState.phase === 'done' ? 'cursor-pointer border-[#6F8467]/45 bg-[#E9EFE6]' : 'cursor-pointer border-dashed border-[#211C19]/18 bg-[#F6F0E6] hover:border-[#A77A43]/65 hover:bg-[#F3EBDD]'}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" disabled={uploading} onChange={event => {
              const file = event.target.files?.[0]; if (file) onChoose(file); event.currentTarget.value = '';
            }} />
            {preview ? (
              <div className="relative aspect-[4/5] min-h-[360px] w-full bg-[#E8DDCC] sm:min-h-[480px]">
                <Image src={preview} alt={`${role} preview`} fill unoptimized className="object-contain" />
                <div className="pointer-events-none absolute inset-5 rounded-[20px] border border-white/50"><span className="absolute -left-px -top-px h-8 w-8 border-l-2 border-t-2 border-[#D9B98A]" /><span className="absolute -right-px -top-px h-8 w-8 border-r-2 border-t-2 border-[#D9B98A]" /><span className="absolute -bottom-px -left-px h-8 w-8 border-b-2 border-l-2 border-[#D9B98A]" /><span className="absolute -bottom-px -right-px h-8 w-8 border-b-2 border-r-2 border-[#D9B98A]" /></div>
                {uploading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#211C19]/78 px-8 text-center text-white backdrop-blur-[3px]">
                  <LoaderCircle className="mb-5 h-8 w-8 animate-spin text-[#D9B98A]" />
                  <div className="iconik-display text-2xl">{statusLabel}</div>
                  <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#D9B98A] transition-[width] duration-300" style={{ width: `${uploadState.progress}%` }} /></div>
                  <div className="mt-3 text-[10px] uppercase tracking-[.16em] text-white/45">Encrypted in transit · keep this page open</div>
                </div>}
                {!uploading && <div className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#211C19] px-5 py-3 text-xs font-medium text-white shadow-xl">{uploadState.phase === 'done' && <Check className="h-3.5 w-3.5 text-[#D9B98A]" />}{uploadState.phase === 'done' ? 'Photo ready · tap to replace' : 'Replace photo'}</div>}
              </div>
            ) : (
              <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden px-6 text-center sm:min-h-[520px] sm:px-8">
                <div className="absolute inset-5 rounded-[18px] border border-[#211C19]/8 sm:inset-8 sm:rounded-[22px]"><span className="absolute -left-px -top-px h-10 w-10 border-l-2 border-t-2 border-[#A77A43]/60" /><span className="absolute -right-px -top-px h-10 w-10 border-r-2 border-t-2 border-[#A77A43]/60" /><span className="absolute -bottom-px -left-px h-10 w-10 border-b-2 border-l-2 border-[#A77A43]/60" /><span className="absolute -bottom-px -right-px h-10 w-10 border-b-2 border-r-2 border-[#A77A43]/60" /></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#211C19] text-white shadow-xl sm:h-20 sm:w-20"><Camera className="h-6 w-6 sm:h-7 sm:w-7" /><span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#D9B98A] text-[#211C19]"><Zap className="h-3 w-3" /></span></div>
                <div className="relative mt-5 iconik-display text-2xl text-[#211C19] sm:mt-6 sm:text-3xl">Take or choose your photo</div>
                <p className="relative mt-3 max-w-sm text-xs leading-6 text-[#211C19]/50">JPG, PNG, WEBP or HEIC · up to 12MB<br />Large files are compressed before they leave your device.</p>
                <div className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-[#211C19]/10 bg-white px-4 py-2 text-[10px] text-[#211C19]/55"><Zap className="h-3.5 w-3.5 text-[#A77A43]" /> Fast, private upload</div>
              </div>
            )}
          </label>
        </div>
        {uploadState.phase === 'done' && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#6F8467]/20 bg-[#E7EFE3] p-4 text-xs text-[#465442]"><span className="flex items-center gap-2 font-medium"><Check className="h-4 w-4" /> Photo passed the quality check</span>{uploadState.savedBytes > 0 && <span className="text-[#465442]/65">Upload reduced by {formatBytes(uploadState.savedBytes)}</span>}</div>}
        {error && <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><p>{error}</p>{uploadState.phase === 'error' && <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-medium"><RotateCcw className="h-3.5 w-3.5" /> Retry this photo</button>}</div>}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#211C19]/8 bg-[#E9DCC8]/65 p-4 text-xs leading-5 text-[#211C19]/60"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><span>{PRIVACY}</span></div>
      </div>
    </section>
  );
}

export default function StyleScanClient({ resumeToken }: { resumeToken: string }) {
  const [step, setStep] = useState(resumeToken ? 1 : 0);
  const [token, setToken] = useState(resumeToken);
  const [busyRole, setBusyRole] = useState<PhotoRole | null>(null);
  const [previews, setPreviews] = useState<Record<PhotoRole, string>>({ headshot: '', full_body: '' });
  const [uploaded, setUploaded] = useState<Record<PhotoRole, boolean>>({ headshot: false, full_body: false });
  const [uploadStates, setUploadStates] = useState<Record<PhotoRole, PhotoUploadState>>({ headshot: EMPTY_UPLOAD_STATE, full_body: EMPTY_UPLOAD_STATE });
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Partial<StyleScanAnswersV1>>({});
  const selectedFiles = useRef<Record<PhotoRole, File | null>>({ headshot: null, full_body: null });
  const previewUrls = useRef<Record<PhotoRole, string>>({ headshot: '', full_body: '' });

  useEffect(() => {
    if (resumeToken) window.sessionStorage.setItem('iconik_style_scan_token', resumeToken);
  }, [resumeToken]);

  useEffect(() => () => {
    Object.values(previewUrls.current).forEach(url => { if (url) URL.revokeObjectURL(url); });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  const ensureDraft = useCallback(async () => {
    if (token) return token;
    const data = await postStyleScanJson<{ token: string; success: true }>('/api/style-scan', { attribution: getAttributionPayload() });
    if (!data.token) throw new Error('Could not start the scan.');
    setToken(data.token);
    window.sessionStorage.setItem('iconik_style_scan_token', data.token);
    return String(data.token);
  }, [token]);

  const start = useCallback(async () => {
    setError(''); setStarting(true);
    try { await ensureDraft(); trackScanEvent('style_scan_started'); setStep(1); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setStarting(false); }
  }, [ensureDraft]);

  const upload = useCallback(async (role: PhotoRole, file: File, keepPreview = false) => {
    setError(''); setBusyRole(role);
    selectedFiles.current[role] = file;
    if (!keepPreview) {
      if (previewUrls.current[role]) URL.revokeObjectURL(previewUrls.current[role]);
      const localPreview = URL.createObjectURL(file);
      previewUrls.current[role] = localPreview;
      setPreviews(current => ({ ...current, [role]: localPreview }));
    }
    setUploaded(current => ({ ...current, [role]: false }));
    setUploadStates(current => ({ ...current, [role]: { phase: 'preparing', progress: 8, savedBytes: 0 } }));
    try {
      const draftToken = await ensureDraft();
      const prepared = await prepareStyleScanPhoto(file);
      setUploadStates(current => ({ ...current, [role]: { phase: 'uploading', progress: 20, savedBytes: prepared.originalBytes - prepared.uploadBytes } }));
      await uploadStyleScanPhoto({
        token: draftToken,
        role,
        file: prepared.file,
        onProgress: fraction => setUploadStates(current => ({
          ...current,
          [role]: { ...current[role], phase: 'uploading', progress: 20 + Math.round(fraction * 68) },
        })),
        onUploadComplete: () => setUploadStates(current => ({
          ...current,
          [role]: { ...current[role], phase: 'checking', progress: 92 },
        })),
      });
      setUploaded(current => ({ ...current, [role]: true }));
      setUploadStates(current => ({ ...current, [role]: { ...current[role], phase: 'done', progress: 100 } }));
      trackScanEvent('style_scan_photo_uploaded', { role, optimized: prepared.optimized });
    } catch (issue) {
      setUploaded(current => ({ ...current, [role]: false }));
      setUploadStates(current => ({ ...current, [role]: { ...current[role], phase: 'error', progress: 0 } }));
      const message = issue instanceof Error ? issue.message : 'Photo upload failed.';
      setError(issue instanceof StyleScanUploadError && issue.status === 413
        ? 'This photo is too large for the connection. Choose a smaller photo and retry.'
        : message);
    } finally { setBusyRole(null); }
  }, [ensureDraft]);

  const retryUpload = useCallback((role: PhotoRole) => {
    const file = selectedFiles.current[role];
    if (file) void upload(role, file, true);
  }, [upload]);

  const allAnswered = useMemo(() => questions.every(question => Boolean(answers[question.key])), [answers]);
  const answeredCount = useMemo(() => questions.filter(question => Boolean(answers[question.key])).length, [answers]);

  const submit = useCallback(async () => {
    if (!token || !allAnswered || !consent) return;
    setSubmitting(true); setError('');
    try {
      const data = await postStyleScanJson<{ resultUrl: string; success: true }>(`/api/style-scan/${encodeURIComponent(token)}/submit`, {
        phone, firstName: firstName.trim() || undefined, whatsappOptIn: consent, answers,
      });
      trackScanEvent('style_scan_submitted');
      window.location.assign(data.resultUrl);
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setSubmitting(false); }
  }, [allAnswered, answers, consent, firstName, phone, token]);

  return (
    <div className="min-h-screen bg-[#EFE7D8] text-[#211C19]">
      {step > 0 && <StepHeader step={step} />}
      <main>
        {step === 0 && (
          <div className="overflow-hidden bg-[#211C19] text-[#F8F3E9]">
            <section className="relative lg:min-h-screen">
              <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(217,185,138,.38), transparent 28%), radial-gradient(circle at 82% 70%, rgba(166,115,75,.26), transparent 26%)' }} />
              <div className="pointer-events-none absolute inset-0 opacity-[.055]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
              <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6 lg:px-10"><Logo light /><div className="flex items-center gap-5"><Link href="/privacy-policy" className="hidden text-[10px] uppercase tracking-[.18em] text-white/45 transition hover:text-white sm:block">Privacy</Link><span className="flex items-center gap-1.5 text-[9px] text-white/55 sm:gap-2 sm:text-[10px]"><Lock className="h-3.5 w-3.5 text-[#D9B98A]" /> Private by design</span></div></nav>
              <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-5 sm:gap-12 sm:px-8 sm:pb-16 sm:pt-10 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.03fr_.97fr] lg:gap-14 lg:px-10 lg:pb-24 lg:pt-12">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9B98A]/30 bg-[#D9B98A]/10 px-3 py-2 text-[8px] uppercase tracking-[.18em] text-[#E8CCA2] sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[.22em]"><Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Free 3-minute style check</div>
                  <h1 className="iconik-display mt-5 text-[44px] leading-[.92] tracking-[-.035em] sm:mt-7 sm:text-7xl lg:text-[86px] xl:text-[98px]">Your clothes fit. Why does the outfit still feel wrong?</h1>
                  <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/62 sm:mt-7 sm:text-lg sm:leading-8">Upload two private photos and answer five quick questions. <span className="text-white">We will show you the main reason your outfits feel off.</span></p>
                  <div className="mt-7 flex w-full flex-col items-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                    <button onClick={() => void start()} disabled={starting} className="group inline-flex min-h-14 w-full items-center justify-between gap-4 rounded-full bg-[#F8F3E9] px-6 text-sm font-semibold text-[#211C19] shadow-[0_18px_40px_rgba(0,0,0,.22)] transition hover:-translate-y-1 hover:bg-white disabled:cursor-wait disabled:opacity-70 sm:min-h-16 sm:w-auto sm:px-8">{starting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Starting your private scan…</> : <>Find My Style Blocker — Free <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#211C19] text-white"><ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span></>}</button>
                    <span className="flex items-center justify-center gap-2 text-[10px] text-white/42 sm:text-[11px]"><Clock3 className="h-3.5 w-3.5 text-[#D9B98A] sm:h-4 sm:w-4" /> About 3 minutes · no payment</span>
                  </div>
                  {error && <p role="alert" className="mt-5 max-w-xl rounded-2xl border border-red-300/25 bg-red-950/20 p-4 text-sm text-red-100">{error}</p>}
                  <div className="mt-7 grid grid-cols-3 border-t border-white/10 pt-5 text-center text-[8px] uppercase tracking-[.1em] text-white/45 sm:mt-9 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-3 sm:pt-6 sm:text-left sm:text-[10px] sm:tracking-[.13em]"><span className="flex flex-col items-center gap-2 sm:flex-row"><ShieldCheck className="h-4 w-4 text-[#D9B98A]" /> Photos private</span><span className="flex flex-col items-center gap-2 sm:flex-row"><Eye className="h-4 w-4 text-[#D9B98A]" /> Made for you</span><span className="flex flex-col items-center gap-2 sm:flex-row"><Check className="h-4 w-4 text-[#D9B98A]" /> Clear result</span></div>
                </div>
                <ScanPreview />
              </div>
            </section>

            <section className="border-t border-white/10 bg-[#F3EBDD] py-14 text-[#211C19] sm:py-28">
              <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
                  <div><div className="iconik-micro text-[#A77A43]">WHAT YOU WILL FIND OUT</div><h2 className="iconik-display mt-4 text-4xl leading-[.98] sm:mt-5 sm:text-6xl">First, find<br /><span className="italic text-[#9A7042]">the problem.</span></h2><p className="mt-4 max-w-md text-sm leading-6 text-[#211C19]/58 sm:mt-6 sm:leading-7">The scan finds the main issue behind outfits that feel wrong. It gives you a clear starting point. Your stylist builds the solution.</p></div>
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-[#211C19]/10 bg-[#211C19]/10 sm:rounded-[28px]">{scanDeliverables.map(item => <article key={item.number} className="group bg-[#FAF7F0] p-4 transition hover:bg-white sm:p-8"><div className="flex items-center justify-between"><span className="iconik-mono text-[8px] text-[#A77A43] sm:text-[9px]">{item.number}</span><item.icon className="h-4 w-4 text-[#211C19]/35 transition group-hover:text-[#A77A43] sm:h-5 sm:w-5" /></div><h3 className="iconik-display mt-5 text-xl leading-tight sm:mt-8 sm:text-3xl">{item.title}</h3><p className="mt-2 text-[10px] leading-4 text-[#211C19]/52 sm:mt-3 sm:text-xs sm:leading-6">{item.copy}</p></article>)}</div>
                </div>
                <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[22px] bg-[#211C19] p-6 text-white sm:mt-14 sm:flex-row sm:items-center sm:rounded-[28px] sm:p-9"><div><div className="iconik-micro text-[#D9B98A]">TWO PHOTOS · FIVE ANSWERS</div><p className="iconik-display mt-3 text-2xl leading-tight sm:text-4xl">Find out what is making your outfits feel wrong.</p></div><button onClick={() => void start()} disabled={starting} className="inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-3 rounded-full bg-[#D9B98A] px-7 text-sm font-semibold text-[#211C19] disabled:opacity-60 sm:w-auto">Find my style blocker <ArrowRight className="h-4 w-4" /></button></div>
              </div>
            </section>
          </div>
        )}
        {step === 1 && <div className="px-4 sm:px-6"><PhotoStep role="headshot" preview={previews.headshot} uploadState={uploadStates.headshot} error={error} onChoose={file => void upload('headshot', file)} onRetry={() => retryUpload('headshot')} /></div>}
        {step === 2 && <div className="px-4 sm:px-6"><PhotoStep role="full_body" preview={previews.full_body} uploadState={uploadStates.full_body} error={error} onChoose={file => void upload('full_body', file)} onRetry={() => retryUpload('full_body')} /></div>}
        {step === 3 && (
          <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-9 sm:px-6 sm:py-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:py-16">
            <div className="lg:sticky lg:top-28 lg:self-start"><div className="inline-flex items-center gap-2 rounded-full border border-[#A77A43]/25 bg-[#E9DCC8] px-3 py-2 text-[8px] uppercase tracking-[.16em] text-[#8E6335] sm:text-[9px] sm:tracking-[.2em]"><ScanFace className="h-3.5 w-3.5" /> Step 03 · Quick answers</div><h1 className="iconik-display mt-4 text-[40px] leading-[.98] sm:mt-6 sm:text-6xl lg:text-7xl">Now tell us about your real life.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#211C19]/60 sm:mt-6 sm:leading-7">An office outfit has a different job from a wedding or travel outfit. These five answers help us find the right problem.</p>
              <div className="mt-5 rounded-[20px] bg-[#211C19] p-5 text-white sm:mt-8 sm:rounded-[24px] sm:p-6"><div className="flex items-end justify-between"><div><div className="iconik-micro text-[#D9B98A]">QUESTIONS ANSWERED</div><div className="iconik-display mt-2 text-3xl sm:text-4xl">{answeredCount} of 5</div></div><span className="text-[10px] text-white/40">{allAnswered ? 'Complete' : 'Keep going'}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10 sm:mt-5"><div className="h-full rounded-full bg-[#D9B98A] transition-[width] duration-300" style={{ width: `${answeredCount * 20}%` }} /></div><p className="mt-4 text-[11px] leading-5 text-white/50 sm:mt-5 sm:text-xs sm:leading-6">Your answers help us find the problem that matters most.</p></div>
            </div>
            <div className="space-y-4">{questions.map((question, index) => <fieldset key={question.key} className={`rounded-[28px] border p-5 transition sm:p-7 ${answers[question.key] ? 'border-[#6D846B]/30 bg-[#F7FAF5]' : 'border-[#211C19]/10 bg-white'}`}>
              <legend className="sr-only">{question.prompt}</legend>
              <div className="flex items-start gap-4"><span className={`iconik-mono flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] ${answers[question.key] ? 'bg-[#6D846B] text-white' : 'bg-[#E9DCC8] text-[#8E6335]'}`}>{answers[question.key] ? <Check className="h-4 w-4" /> : `0${index + 1}`}</span><div className="min-w-0 flex-1"><h2 className="iconik-display text-2xl leading-tight sm:text-3xl">{question.prompt}</h2><div className="mt-5 grid gap-2 sm:grid-cols-2">{question.options.map(option => { const selected = answers[question.key] === option.value; return <button key={option.value} type="button" onClick={() => setAnswers(current => ({ ...current, [question.key]: option.value }))} className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs transition ${selected ? 'border-[#211C19] bg-[#211C19] text-white shadow-lg' : 'border-[#211C19]/10 bg-[#F8F3E9]/55 text-[#211C19]/68 hover:border-[#A77A43]/45 hover:bg-[#F3EBDD]'}`}><span>{option.label}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#D9B98A] bg-[#D9B98A] text-[#211C19]' : 'border-[#211C19]/15'}`}>{selected && <Check className="h-3 w-3" />}</span></button>; })}</div></div></div>
            </fieldset>)}</div>
          </section>
        )}
        {step === 4 && (
          <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:py-16">
            <div className="relative overflow-hidden rounded-[22px] bg-[#211C19] p-5 text-white sm:rounded-[32px] sm:p-10"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#A77A43]/20 blur-3xl" /><div className="relative"><div className="inline-flex items-center gap-2 rounded-full border border-[#D9B98A]/25 px-3 py-2 text-[8px] uppercase tracking-[.16em] text-[#D9B98A] sm:text-[9px] sm:tracking-[.2em]"><Sparkles className="h-3.5 w-3.5" /> Photos and answers ready</div><h1 className="iconik-display mt-5 text-[40px] leading-[.95] sm:mt-7 sm:text-6xl">Now we can find your main style blocker.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/58 sm:mt-6 sm:leading-7">Add your name and WhatsApp number. Your private result will open here when it is ready.</p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-9 sm:block sm:space-y-2.5">{scanDeliverables.map(item => <div key={item.number} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-3 sm:gap-4 sm:rounded-2xl sm:p-4"><item.icon className="h-4 w-4 shrink-0 text-[#D9B98A] sm:text-white/55" /><span className="text-[10px] font-medium leading-4 sm:text-xs">{item.title}</span><span className="ml-auto hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9B98A] text-[#211C19] sm:flex"><Check className="h-3.5 w-3.5" /></span></div>)}</div>
              <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-5 text-[10px] leading-5 text-white/45 sm:mt-8 sm:pt-6 sm:text-[11px]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#D9B98A]" />Your result is private and accessible through its secure link.</div></div></div>
            <div className="rounded-[22px] border border-[#211C19]/10 bg-white p-5 shadow-[0_18px_50px_rgba(55,43,32,.08)] sm:rounded-[32px] sm:p-9 sm:shadow-[0_24px_70px_rgba(55,43,32,.09)]"><div className="iconik-micro text-[#A77A43]">FINAL STEP · YOUR RESULT</div><h2 className="iconik-display mt-3 text-[32px] leading-tight sm:mt-4 sm:text-4xl">Where should we save your result?</h2><p className="mt-3 text-xs leading-5 text-[#211C19]/50 sm:mt-4 sm:leading-6">No payment. Your result will open on this website.</p>
              <label className="mt-8 block text-xs font-semibold">Your first name <span className="font-normal text-[#211C19]/38">(optional)</span></label>
              <input value={firstName} onChange={event => setFirstName(event.target.value.slice(0, 30))} autoComplete="given-name" placeholder="Priya" className="mt-2 w-full rounded-2xl border border-[#211C19]/12 bg-[#F8F3E9]/65 px-4 py-3.5 outline-none transition focus:border-[#A77A43] focus:bg-white sm:py-4" />
              <label className="mt-5 block text-xs font-semibold">Indian WhatsApp number</label>
              <div className="mt-2 flex overflow-hidden rounded-2xl border border-[#211C19]/12 bg-[#F8F3E9]/65 transition focus-within:border-[#A77A43] focus-within:bg-white"><span className="border-r border-[#211C19]/10 px-4 py-3.5 text-sm text-[#211C19]/48 sm:py-4">+91</span><input value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-4 py-3.5 outline-none sm:py-4" /></div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#211C19]/10 bg-[#F8F3E9]/55 p-4 transition hover:border-[#A77A43]/35"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (event.target.checked) trackScanEvent('style_scan_consent_completed'); }} className="mt-1 h-4 w-4 accent-[#211C19]" /><span className="text-[11px] leading-5 text-[#211C19]/58">I agree to receive my ICONIK follow-up and product updates on WhatsApp. I can opt out at any time.</span></label>
              {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
              <button onClick={() => void submit()} disabled={submitting || phone.length !== 10 || !consent} className="group mt-7 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-[#211C19] px-8 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Finding your style blocker…</> : <>Show My Style Blocker <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D9B98A] text-[#211C19]"><ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span></>}</button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[.14em] text-[#211C19]/35"><ShieldCheck className="h-3.5 w-3.5" /> Secure · free · no card required</div>
            </div>
          </section>
        )}
      </main>
      {step > 0 && step < 4 && (
        <div className="sticky bottom-0 z-40 border-t border-[#211C19]/10 bg-[#F5EFE5]/94 p-3 shadow-[0_-12px_45px_rgba(50,40,30,.08)] backdrop-blur-xl sm:p-4"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button onClick={() => setStep(current => Math.max(0, current - 1))} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#211C19]/15 bg-white/60 px-5 text-xs font-medium transition hover:bg-white"><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="hidden text-center md:block"><div className="text-[10px] font-medium text-[#211C19]/58">{step === 1 ? 'Next: we read your body geometry' : step === 2 ? 'Next: five answers make the scan personal' : `${answeredCount} of 5 answers captured`}</div><div className="mt-1 text-[9px] text-[#211C19]/32">Your progress is kept in this private session</div></div>
          <button onClick={() => setStep(current => current + 1)} disabled={(step === 1 && !uploaded.headshot) || (step === 2 && !uploaded.full_body) || (step === 3 && !allAnswered) || Boolean(busyRole)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#211C19] px-5 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 sm:px-6">{step === 1 ? 'Next · Full photo' : step === 2 ? 'Next · Questions' : 'See my result'} <ArrowRight className="h-4 w-4" /></button>
        </div></div>
      )}
    </div>
  );
}
