'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Check, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import type { StyleScanAnswersV1 } from '@/lib/styleScan';

type PhotoRole = 'headshot' | 'full_body';
type Option<T extends string> = { value: T; label: string };

const PRIVACY = 'Seen only by ICONIK’s styling system and your stylist. Never shared, never used in marketing, deleted on request.';
const STEPS = ['Welcome', 'Headshot', 'Full body', 'Five questions', 'Delivery'];

function trackScanEvent(name: string, details: Record<string, string | number | boolean> = {}) {
  if (typeof window === 'undefined') return;
  // No answers, contact fields, or asset references are included.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq?.('trackCustom', name, { funnel: 'style_scan_v1', ...details });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).dataLayer?.push({ event: name, funnel: 'style_scan_v1', ...details });
}

const questions: Array<{
  key: keyof StyleScanAnswersV1;
  prompt: string;
  options: Option<string>[];
}> = [
  { key: 'concern', prompt: 'What do you most want to camouflage?', options: [
    { value: 'tummy', label: 'Tummy' }, { value: 'arms', label: 'Arms' }, { value: 'hips', label: 'Hips' },
    { value: 'height', label: 'Height' }, { value: 'nothing_specific', label: 'Nothing specific' },
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
  { key: 'lastFeltGreat', prompt: 'When did you last feel great in an outfit?', options: [
    { value: 'this_week', label: 'This week' }, { value: 'cant_remember', label: 'I can’t remember' }, { value: 'old_weight', label: 'At my old weight' },
  ] },
];

function Logo() {
  return <span className="iconik-display text-[17px] tracking-[0.32em] text-[#2C2622]">I C O N I K</span>;
}

function StepHeader({ step }: { step: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2C2622]/10 bg-[#F8F3E9]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <div className="hidden gap-1 sm:flex">{STEPS.slice(1).map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${step > index ? 'w-6 bg-[#2C2622]' : step === index ? 'w-10 bg-[#B68C52]' : 'w-4 bg-[#2C2622]/15'}`} />)}</div>
          <span className="iconik-mono text-[9px] text-[#2C2622]/45">{Math.min(step + 1, 5)} / 5</span>
        </div>
      </div>
    </header>
  );
}

function PhotoStep({ role, preview, uploading, error, onChoose }: {
  role: PhotoRole; preview: string; uploading: boolean; error: string; onChoose: (file: File) => void;
}) {
  const headshot = role === 'headshot';
  return (
    <section className="mx-auto max-w-2xl py-8 sm:py-14">
      <div className="iconik-micro mb-3 text-[#B68C52]">{headshot ? 'Photo 1 of 2' : 'Photo 2 of 2'}</div>
      <h1 className="iconik-display text-4xl leading-[1.04] text-[#2C2622] sm:text-6xl">{headshot ? 'Your face, in natural light.' : 'Your full outline, clearly visible.'}</h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-[#2C2622]/62 sm:text-base">{headshot
        ? 'Face a window, remove colour filters, and keep your face, neck and hairline visible.'
        : 'Stand straight facing the camera. Show your full body from head to toe in clothes that let us read your natural proportions.'}</p>

      <label className="mt-8 block cursor-pointer overflow-hidden rounded-[28px] border border-dashed border-[#2C2622]/25 bg-white transition hover:border-[#B68C52]">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" disabled={uploading} onChange={event => {
          const file = event.target.files?.[0]; if (file) onChoose(file); event.currentTarget.value = '';
        }} />
        {preview ? (
          <div className="relative aspect-[4/5] max-h-[560px] w-full bg-[#EEE5D5]">
            <Image src={preview} alt={`${role} preview`} fill unoptimized className="object-contain" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#2C2622] px-5 py-3 text-xs font-medium text-white shadow-lg">Replace photo</div>
          </div>
        ) : (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1E8D8]"><Camera className="h-6 w-6 text-[#2C2622]" /></div>
            <div className="font-medium text-[#2C2622]">{uploading ? 'Checking and securing your photo…' : 'Take a photo or choose one'}</div>
            <div className="mt-2 text-xs text-[#2C2622]/45">JPG, PNG, WEBP, HEIC · maximum 12MB</div>
          </div>
        )}
      </label>
      {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#EFE7D8] p-4 text-xs leading-5 text-[#2C2622]/65"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />{PRIVACY}</div>
    </section>
  );
}

export default function StyleScanClient({ resumeToken }: { resumeToken: string }) {
  const [step, setStep] = useState(resumeToken ? 1 : 0);
  const [token, setToken] = useState(resumeToken);
  const [busyRole, setBusyRole] = useState<PhotoRole | null>(null);
  const [previews, setPreviews] = useState<Record<PhotoRole, string>>({ headshot: '', full_body: '' });
  const [uploaded, setUploaded] = useState<Record<PhotoRole, boolean>>({ headshot: false, full_body: false });
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Partial<StyleScanAnswersV1>>({});

  useEffect(() => {
    if (resumeToken) window.sessionStorage.setItem('iconik_style_scan_token', resumeToken);
  }, [resumeToken]);

  const ensureDraft = useCallback(async () => {
    if (token) return token;
    const response = await fetch('/api/style-scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribution: getAttributionPayload() }),
    });
    const data = await response.json();
    if (!response.ok || !data.token) throw new Error(data.error || 'Could not start the scan.');
    setToken(data.token);
    window.sessionStorage.setItem('iconik_style_scan_token', data.token);
    return String(data.token);
  }, [token]);

  const start = useCallback(async () => {
    setError('');
    try { await ensureDraft(); trackScanEvent('style_scan_started'); setStep(1); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); }
  }, [ensureDraft]);

  const upload = useCallback(async (role: PhotoRole, file: File) => {
    setError(''); setBusyRole(role);
    const localPreview = URL.createObjectURL(file);
    setPreviews(current => ({ ...current, [role]: localPreview }));
    try {
      const draftToken = await ensureDraft();
      const form = new FormData(); form.append('token', draftToken); form.append('role', role); form.append('file', file);
      const response = await fetch('/api/style-scan/upload-url', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Photo upload failed.');
      setUploaded(current => ({ ...current, [role]: true }));
      trackScanEvent('style_scan_photo_uploaded', { role });
    } catch (issue) {
      setUploaded(current => ({ ...current, [role]: false }));
      setError(issue instanceof Error ? issue.message : 'Photo upload failed.');
    } finally { setBusyRole(null); }
  }, [ensureDraft]);

  const allAnswered = useMemo(() => questions.every(question => Boolean(answers[question.key])), [answers]);

  const submit = useCallback(async () => {
    if (!token || !allAnswered || !consent) return;
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`/api/style-scan/${encodeURIComponent(token)}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, whatsappOptIn: consent, answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit your scan.');
      trackScanEvent('style_scan_submitted');
      window.location.assign(data.resultUrl);
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setSubmitting(false); }
  }, [allAnswered, answers, consent, phone, token]);

  return (
    <div className="min-h-screen bg-[#F8F3E9] text-[#2C2622]">
      {step > 0 && <StepHeader step={step} />}
      <main className="px-4 sm:px-6">
        {step === 0 && (
          <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center py-16">
            <div className="mb-12 flex items-center justify-between"><Logo /><Link href="/privacy-policy" className="text-xs text-[#2C2622]/50">Privacy</Link></div>
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="iconik-micro mb-6 text-[#B68C52]">THE ICONIK STYLE SCAN · FREE</div>
                <h1 className="iconik-display max-w-4xl text-5xl leading-[.96] sm:text-7xl lg:text-[88px]">What is working against you?</h1>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#2C2622]/65 sm:text-lg">Upload two photos. Answer 5 questions. In minutes, know your body geometry, your undertone, and the 3 things in your wardrobe working against you. Free.</p>
                <button onClick={() => void start()} className="mt-9 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#2C2622] px-8 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-xl">Start My Free Scan <ArrowRight className="h-4 w-4" /></button>
                {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
                <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#2C2622]/52"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Private photos</span><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Personal analysis</span><span className="flex items-center gap-2"><Check className="h-4 w-4" /> Under 3 minutes</span></div>
              </div>
              <div className="rounded-[32px] border border-[#2C2622]/10 bg-[#EFE7D8] p-6 sm:p-9">
                <div className="iconik-micro mb-6 text-[#2C2622]/45">Your preliminary scan</div>
                {['Your geometry', 'Your undertone', 'The 3 Don’ts', 'The 1 Do'].map((item, index) => <div key={item} className="mb-3 flex items-center justify-between rounded-2xl bg-white p-5"><span className="font-medium">{item}</span><span className="iconik-mono text-[10px] text-[#B68C52]">0{index + 1}</span></div>)}
              </div>
            </div>
          </section>
        )}
        {step === 1 && <PhotoStep role="headshot" preview={previews.headshot} uploading={busyRole === 'headshot'} error={error} onChoose={file => void upload('headshot', file)} />}
        {step === 2 && <PhotoStep role="full_body" preview={previews.full_body} uploading={busyRole === 'full_body'} error={error} onChoose={file => void upload('full_body', file)} />}
        {step === 3 && (
          <section className="mx-auto max-w-3xl py-8 sm:py-14">
            <div className="iconik-micro mb-3 text-[#B68C52]">Five quick questions</div>
            <h1 className="iconik-display text-4xl text-[#2C2622] sm:text-6xl">Make the scan about your real life.</h1>
            <div className="mt-10 space-y-9">{questions.map((question, index) => <fieldset key={question.key}>
              <legend className="mb-4 text-base font-medium"><span className="mr-3 text-[#B68C52]">0{index + 1}</span>{question.prompt}</legend>
              <div className="flex flex-wrap gap-2">{question.options.map(option => <button key={option.value} type="button" onClick={() => setAnswers(current => ({ ...current, [question.key]: option.value }))} className={`min-h-11 rounded-full border px-5 text-sm transition ${answers[question.key] === option.value ? 'border-[#2C2622] bg-[#2C2622] text-white' : 'border-[#2C2622]/15 bg-white hover:border-[#2C2622]/45'}`}>{option.label}</button>)}</div>
            </fieldset>)}</div>
          </section>
        )}
        {step === 4 && (
          <section className="mx-auto max-w-2xl py-8 sm:py-14">
            <div className="iconik-micro mb-3 text-[#B68C52]">One last step</div>
            <h1 className="iconik-display text-4xl text-[#2C2622] sm:text-6xl">Where should we keep your scan connected?</h1>
            <p className="mt-5 text-sm leading-6 text-[#2C2622]/62">Your result opens here on the website. Your number connects this scan to your next step and lets ICONIK follow up on WhatsApp.</p>
            <label className="mt-8 block text-sm font-medium">Indian WhatsApp number</label>
            <div className="mt-2 flex overflow-hidden rounded-2xl border border-[#2C2622]/15 bg-white focus-within:border-[#2C2622]"><span className="border-r border-[#2C2622]/10 px-4 py-4 text-sm text-[#2C2622]/55">+91</span><input value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-4 py-4 outline-none" /></div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#2C2622]/12 bg-white p-4"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (event.target.checked) trackScanEvent('style_scan_consent_completed'); }} className="mt-1 h-4 w-4 accent-[#2C2622]" /><span className="text-xs leading-5 text-[#2C2622]/66">I agree to receive my ICONIK follow-up and product updates on WhatsApp. I can opt out at any time.</span></label>
            {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            <button onClick={() => void submit()} disabled={submitting || phone.length !== 10 || !consent} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#2C2622] px-8 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? 'Securing your scan…' : 'Reveal My Style Scan'} <ArrowRight className="h-4 w-4" /></button>
          </section>
        )}
      </main>
      {step > 0 && step < 4 && (
        <div className="sticky bottom-0 border-t border-[#2C2622]/10 bg-[#F8F3E9]/95 p-4 backdrop-blur-xl"><div className="mx-auto flex max-w-3xl justify-between gap-3">
          <button onClick={() => setStep(current => Math.max(0, current - 1))} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#2C2622]/15 px-5 text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
          <button onClick={() => setStep(current => current + 1)} disabled={(step === 1 && !uploaded.headshot) || (step === 2 && !uploaded.full_body) || (step === 3 && !allAnswered) || Boolean(busyRole)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2C2622] px-7 text-sm text-white disabled:opacity-35">Continue <ArrowRight className="h-4 w-4" /></button>
        </div></div>
      )}
    </div>
  );
}
