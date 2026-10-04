'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Clock3, Gem, LoaderCircle, Lock, LockKeyhole,
  Palette, RotateCcw, Ruler, ScanFace, ShieldCheck, Sparkles, Sun, SwatchBook, X, Zap,
} from 'lucide-react';
import { getAttributionPayload } from '@/lib/attribution';
import type { StyleScanAnswersV1 } from '@/lib/styleScan';
import { postStyleScanJson, prepareStyleScanPhoto, StyleScanUploadError, uploadStyleScanPhoto } from '@/lib/styleScanPhotoUpload';
import type { StyleScanPhotoRole } from '@/lib/styleScanPhotoTypes';
import s from './colourScan.module.css';

type PhotoRole = StyleScanPhotoRole;
type AnswerKey = Exclude<keyof StyleScanAnswersV1, 'firstName'>;
type Option = { value: string; label: string; hint?: string; swatches?: string[] };
type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'checking' | 'done' | 'error';
type PhotoUploadState = { phase: UploadPhase; progress: number; savedBytes: number };

const PRIVACY = 'Seen only by ICONIK’s styling system and your stylist. Never shared, never used in marketing, deleted on request.';
const STEPS = ['Selfie', 'Full photo', 'Quick taps', 'Your colours'];

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

// Colour cues first: they are the quickest, most fun taps and they feed the
// colour read. The rest shape the outfit ideas and the follow-up emails.
const questions: Array<{ key: AnswerKey; eyebrow: string; prompt: string; options: Option[] }> = [
  { key: 'jewellery', eyebrow: 'Colour cue', prompt: 'Which jewellery makes your skin look brighter?', options: [
    { value: 'gold', label: 'Gold', swatches: ['#F5D98B', '#C9A227', '#8C6A1C'] },
    { value: 'silver', label: 'Silver', swatches: ['#F2F3F5', '#BFC4CA', '#7D838B'] },
    { value: 'both', label: 'Both look good', swatches: ['#E4C77A', '#C7CBD0'] },
    { value: 'unsure', label: 'Not sure' },
  ] },
  { key: 'sun', eyebrow: 'Colour cue', prompt: 'What does your skin usually do in the sun?', options: [
    { value: 'tans_easily', label: 'Tans easily', hint: 'Rarely burns' },
    { value: 'burns_then_tans', label: 'Burns a little, then tans' },
    { value: 'burns', label: 'Burns', hint: 'Rarely tans' },
    { value: 'rarely_changes', label: 'Hardly changes' },
  ] },
  { key: 'compliments', eyebrow: 'Colour cue', prompt: 'Which colours get you the most compliments?', options: [
    { value: 'earthy', label: 'Earthy', hint: 'Rust, olive, mustard', swatches: ['#A4492A', '#6B6B35', '#C9A227'] },
    { value: 'jewel', label: 'Jewel tones', hint: 'Emerald, royal blue, magenta', swatches: ['#0F7B55', '#1F48C9', '#B0175F'] },
    { value: 'soft', label: 'Soft pastels', hint: 'Blush, powder blue, mint', swatches: ['#F2C6CF', '#C7DDF0', '#BDEBD3'] },
    { value: 'contrast', label: 'Black and white', swatches: ['#111315', '#FFFFFF'] },
    { value: 'unsure', label: 'I’m not sure' },
  ] },
  { key: 'dressCode', eyebrow: 'Your life', prompt: 'What do you wear most days?', options: [
    { value: 'western_office', label: 'Western office wear' }, { value: 'ethnic_leaning', label: 'Mostly Indian wear' },
    { value: 'mixed', label: 'A mix of both' }, { value: 'mostly_home', label: 'Mostly at home' },
  ] },
  { key: 'upcoming', eyebrow: 'Your life', prompt: 'What’s coming up in the next 60 days?', options: [
    { value: 'wedding', label: 'A wedding' }, { value: 'festive', label: 'Festive season' }, { value: 'office_events', label: 'Office events' },
    { value: 'travel', label: 'A trip' }, { value: 'nothing', label: 'Nothing planned' },
  ] },
  { key: 'dressPreference', eyebrow: 'Your style', prompt: 'How do you like to dress?', options: [
    { value: 'modest', label: 'Modest', hint: 'Minimal skin' }, { value: 'balanced', label: 'Balanced' }, { value: 'fitted', label: 'I love fitted looks' },
  ] },
  { key: 'concern', eyebrow: 'Your style', prompt: 'What often feels off in an outfit?', options: [
    { value: 'tummy', label: 'My tummy stands out' }, { value: 'arms', label: 'My arms feel exposed' }, { value: 'hips', label: 'My hips look wider' },
    { value: 'height', label: 'I look shorter' }, { value: 'nothing_specific', label: 'Nothing specific' },
  ] },
  { key: 'lastFeltGreat', eyebrow: 'Last one', prompt: 'When did you last feel great in an outfit?', options: [
    { value: 'this_week', label: 'This week' }, { value: 'cant_remember', label: 'I can’t remember' }, { value: 'old_weight', label: 'At my old weight' },
  ] },
];

const sampleBest = [
  { name: 'Deep Teal', hex: '#1F6F6B' }, { name: 'Rust', hex: '#A4492A' }, { name: 'Olive', hex: '#6B6B35' },
  { name: 'Mustard', hex: '#C9A227' }, { name: 'Camel', hex: '#C19A6B' }, { name: 'Chocolate', hex: '#4E3226' },
];
const sampleSkip = [{ name: 'Icy lavender', hex: '#C9C0E3' }, { name: 'Silver grey', hex: '#B9BDC2' }, { name: 'Fuchsia', hex: '#D3166F' }];

const faqs = [
  ['Is it really free?', 'Yes. Your colour result is free and opens on this website. If you want a stylist to build outfits around it, that is a separate, optional Blueprint.'],
  ['What happens to my selfie?', PRIVACY],
  ['How accurate is a selfie?', 'Very good in daylight, facing a window, with no filter or beauty mode. If your photo is too dark or tinted, we ask for a retake instead of guessing.'],
  ['Should I take my makeup off?', 'A bare face is best because foundation can shift your undertone. Light makeup is fine; heavy makeup is not.'],
  ['Why do I need the full-body photo?', 'You don’t. It is optional: add it and we also show you the one thing making your outfits feel off.'],
];

function Wordmark() {
  return <span className="text-[17px] font-semibold tracking-[0.42em] text-[#111315]">ICONIK</span>;
}

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${s.micro} ${className}`}>{children}</div>;
}

function SwatchDot({ hex, size = 28, className = '' }: { hex: string; size?: number; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full border border-black/10 ${className}`} style={{ width: size, height: size, backgroundColor: hex }} />;
}

function StepHeader({ step, quizIndex }: { step: number; quizIndex: number }) {
  const activeIndex = Math.max(0, step - 1);
  const fraction = step === 3 ? (2 + (quizIndex + 1) / questions.length) / STEPS.length : (activeIndex + 1) / STEPS.length;
  return (
    <header className="sticky top-0 z-40 border-b border-[#111315]/10 bg-[#F5F3EE]/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Wordmark />
        <ol className="hidden items-center gap-1 md:flex">
          {STEPS.map((label, index) => <li key={label} className="flex items-center">
            <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${activeIndex === index ? 'bg-[#111315] text-[#F5F3EE]' : index < activeIndex ? 'text-[#6A1F2B]' : 'text-[#111315]/35'}`}>
              {index < activeIndex ? <Check className="h-3.5 w-3.5" /> : <span className="tabular-nums">0{index + 1}</span>}{label}
            </span>
            {index < STEPS.length - 1 && <span className={`mx-1 h-px w-5 ${index < activeIndex ? 'bg-[#6A1F2B]/50' : 'bg-[#111315]/12'}`} />}
          </li>)}
        </ol>
        <span className="text-[11px] font-semibold text-[#111315]/55 md:hidden">{STEPS[activeIndex]} · <span className="text-[#6A1F2B]">0{activeIndex + 1}/04</span></span>
      </div>
      <div className="h-[2px] bg-[#111315]/8"><div className="h-full bg-[#6A1F2B] transition-[width] duration-500" style={{ width: `${fraction * 100}%` }} /></div>
    </header>
  );
}

/** The landing hero's sample result: a typographic card, so it never shows a real client. */
function SampleResult() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-10 rounded-full bg-[#94A6AD]/25 blur-3xl" />
      <div className={`${s.glass} relative overflow-hidden rounded-[30px] p-4 sm:p-6`}>
        <div className="flex items-center justify-between">
          <Micro className="text-[#6A1F2B]">Sample result</Micro>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#111315]/60"><Lock className="h-3 w-3" /> Private</span>
        </div>
        <div className="mt-4 grid grid-cols-[112px_1fr] gap-4 sm:grid-cols-[150px_1fr] sm:gap-6">
          <div className="relative aspect-[2/3] overflow-hidden rounded-[999px_999px_28px_28px] border border-white/70 bg-[#94A6AD]">
            {/* The illustrative model from the offer-2699 Blueprint cover, with a colour drape over her top. */}
            <Image src="/style-scan/sample-model.jpg" alt="Illustrative model trying a colour drape" fill priority sizes="150px" className="object-cover object-top" />
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[20%] w-full" aria-hidden>
              <path className={s.cycleFill} d="M0 8 C 22 2, 44 2, 60 24 C 76 2, 98 2, 120 8 L120 40 L0 40 Z" />
            </svg>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-semibold text-[#111315]">Drape test</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#111315]/50">You&apos;re a</div>
            <div className={`${s.serif} text-[28px] leading-[1.02] sm:text-[38px]`}>Warm Muted Earth</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{['Warm undertone', 'Medium depth', 'Soft contrast'].map(chip => <span key={chip} className="rounded-full border border-[#111315]/10 bg-white/70 px-2.5 py-1 text-[10px] font-semibold">{chip}</span>)}</div>
            <div className="mt-4 grid grid-cols-6 gap-1.5">{sampleBest.map(swatch => <span key={swatch.hex} title={swatch.name} className="aspect-square rounded-[10px] border border-black/5" style={{ backgroundColor: swatch.hex }} />)}</div>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#111315]/45">Skip near your face {sampleSkip.map(swatch => <span key={swatch.hex} className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/10" style={{ backgroundColor: swatch.hex }}><X className="h-3 w-3 text-[#111315]/55" /></span>)}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#111315]/8 pt-4 text-center">
          {[['Metals', 'Gold & brass'], ['Lips', 'Terracotta'], ['Rule', 'Tonal outfits']].map(([label, value]) => <div key={label}><Micro className="text-[#111315]/40">{label}</Micro><div className="mt-1 text-xs font-semibold">{value}</div></div>)}
        </div>
      </div>
      <div className={`${s.glassStrong} absolute -bottom-14 right-6 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111315] text-[#F5F3EE]"><Sparkles className="h-4 w-4" /></span>
        <div><div className="text-xs font-bold">Ready in about 2 minutes</div><div className="text-[10px] text-[#111315]/50">Opens right here, free</div></div>
      </div>
    </div>
  );
}

function Landing({ onStart, starting, error }: { onStart: () => void; starting: boolean; error: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#111315]/8 bg-[#F5F3EE]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="hidden w-32 sm:block" />
          <Wordmark />
          <span className="flex w-32 items-center justify-end gap-1.5 text-[11px] font-semibold text-[#111315]/50"><LockKeyhole className="h-3.5 w-3.5 text-[#6A1F2B]" /> <span className="hidden sm:inline">Private by design</span></span>
        </div>
      </header>

      <section className={`${s.grid} relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20`}>
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <div className={`${s.fadeUp} text-center lg:text-left`}>
            <Micro className="text-[#111315]/55">Free colour analysis · made for Indian skin</Micro>
            <h1 className={`${s.display} mt-5 text-[46px] sm:text-[72px] lg:text-[84px]`}>
              Find the colours that make you <span className={s.serif}>glow.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-7 text-[#111315]/62 sm:text-lg sm:leading-8 lg:mx-0">
              One selfie and eight quick taps. See your undertone, your <span className="font-semibold text-[#6A1F2B]">best shades</span>, and the colours quietly making you look tired, tried on your own photo.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
              <button onClick={onStart} disabled={starting} className={`${s.cta} group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-7 text-[15px] font-semibold sm:min-h-16 sm:w-auto sm:px-9`}>
                {starting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Starting your private scan…</> : <>Start my free colour analysis <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#6A1F2B]/12 bg-[#6A1F2B]/[.06] px-4 py-2 text-[12px] font-semibold text-[#6A1F2B]"><Clock3 className="h-3.5 w-3.5" /> About 2 minutes · no payment · no app</span>
            </div>
            {error && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 lg:mx-0">{error}</p>}
            <div className="mx-auto mt-10 grid max-w-md grid-cols-3 divide-x divide-[#111315]/10 lg:mx-0">
              {([[Camera, 'One selfie', 'in daylight'], [SwatchBook, 'Your shades', 'to wear & skip'], [ShieldCheck, 'Private', 'deleted on request']] as const).map(([Icon, title, sub]) => (
                <div key={title} className="px-2 text-center"><span className={`${s.glassStrong} mx-auto flex h-10 w-10 items-center justify-center rounded-full`}><Icon className="h-4 w-4 text-[#6A1F2B]" /></span><div className="mt-2 text-[12px] font-bold">{title}</div><div className="text-[11px] text-[#111315]/50">{sub}</div></div>
              ))}
            </div>
          </div>
          <div className={s.fadeUp} style={{ animationDelay: '160ms' }}><SampleResult /></div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <Micro className="text-[#6A1F2B]">What you get, free</Micro>
              <h2 className={`${s.display} mt-4 max-w-2xl text-[38px] sm:text-6xl`}>Your colours, <span className={s.serif}>decoded.</span></h2>
            </div>
            <div className={`${s.ticks} mb-3 hidden text-[#111315] sm:block`} />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Palette, title: 'Your undertone', copy: 'Warm, cool, neutral or olive, plus your depth and contrast, in plain words.', visual: <div className="flex gap-1.5">{['Warm', 'Medium', 'Soft'].map(chip => <span key={chip} className="rounded-full border border-[#111315]/10 bg-white px-2.5 py-1 text-[10px] font-semibold">{chip}</span>)}</div> },
              { icon: SwatchBook, title: 'Shades that light you up', copy: 'Six colours to wear near your face, with the exact shade codes for shopping.', visual: <div className="flex gap-1">{sampleBest.map(swatch => <SwatchDot key={swatch.hex} hex={swatch.hex} size={24} />)}</div> },
              { icon: X, title: 'Colours to skip', copy: 'The shades casting shadows on your skin, and what to wear instead.', visual: <div className="flex gap-1.5">{sampleSkip.map(swatch => <span key={swatch.hex} className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10" style={{ backgroundColor: swatch.hex }}><X className="h-3 w-3 text-[#111315]/50" /></span>)}</div> },
              { icon: Gem, title: 'Metals and lips', copy: 'Gold or silver, and the everyday lip shades that suit your skin.', visual: <div className="flex gap-1.5"><SwatchDot hex="#D4AF37" size={24} /><SwatchDot hex="#C0C4C9" size={24} /><SwatchDot hex="#B4533A" size={24} /></div> },
            ].map(({ icon: Icon, title, copy, visual }, index) => (
              <article key={title} className={`${s.glass} flex flex-col rounded-[26px] p-6`}>
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold tabular-nums text-[#6A1F2B]">0{index + 1}</span><Icon className="h-4 w-4 text-[#111315]/35" /></div>
                <h3 className="mt-8 text-xl font-bold tracking-[-0.03em]">{title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-6 text-[#111315]/58">{copy}</p>
                <div className="mt-6">{visual}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#111315]/8 bg-[#AEBBC1]/20 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <Micro className="text-[#6A1F2B]">How it works</Micro>
            <h2 className={`${s.display} mt-4 text-[38px] sm:text-6xl`}>See it on <span className={s.serif}>your own face.</span></h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[#111315]/60">Most colour quizzes guess from a few answers. Ours reads your selfie, then lets you drape each colour against your own photo, so you can see the difference for yourself.</p>
          </div>
          <ol className="grid gap-3">
            {[
              { icon: Sun, title: 'Take a selfie by a window', copy: 'Daylight on your face, no filter. Your photo stays private.' },
              { icon: Sparkles, title: 'Tap through eight quick questions', copy: 'Jewellery, sun and compliments tell us a lot about your undertone.' },
              { icon: SwatchBook, title: 'Try your colours on your photo', copy: 'Tap a shade to drape it under your chin. Your result is also emailed to you.' },
            ].map(({ icon: Icon, title, copy }, index) => (
              <li key={title} className={`${s.glass} flex items-start gap-5 rounded-[24px] p-5 sm:p-6`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111315] text-[#F5F3EE]"><Icon className="h-4 w-4" /></span>
                <div><div className="text-[11px] font-bold text-[#6A1F2B]">Step 0{index + 1}</div><h3 className="mt-1 text-lg font-bold tracking-[-0.02em]">{title}</h3><p className="mt-1 text-[13px] leading-6 text-[#111315]/58">{copy}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Micro className="text-[#6A1F2B]">Why most colour tests get it wrong</Micro>
            <h2 className={`${s.display} mt-4 text-[34px] sm:text-5xl`}>Indian skin needs an <span className={s.serif}>Indian read.</span></h2>
            <div className="mt-8 grid gap-5">
              {[
                ['Depth matters as much as undertone', 'Two women can both be warm and still need very different shades, because one has deeper skin.'],
                ['Olive undertones are common here', 'Many Indian women look neutral in a mirror but glow in muted, slightly green-leaning colours.'],
                ['Western seasons were not built for us', '“Autumn” and “Winter” palettes were made for lighter skin. We read your real skin, eyes and hair instead.'],
              ].map(([title, copy]) => <div key={title} className="flex gap-4"><Check className="mt-1 h-4 w-4 shrink-0 text-[#6A1F2B]" /><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-[14px] leading-6 text-[#111315]/58">{copy}</p></div></div>)}
            </div>
          </div>
          <div>
            <Micro className="text-[#111315]/45">Questions</Micro>
            <div className="mt-4 divide-y divide-[#111315]/10 border-y border-[#111315]/10">
              {faqs.map(([q, a], index) => (
                <div key={q}>
                  <button type="button" onClick={() => setOpenFaq(current => current === index ? null : index)} aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-bold">
                    {q}<ChevronDown className={`h-4 w-4 shrink-0 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && <p className="-mt-1 pb-5 text-[14px] leading-6 text-[#111315]/60">{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#111315] px-6 py-14 text-center text-[#F5F3EE] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 18% 10%, rgba(148,166,173,.35), transparent 22rem), radial-gradient(circle at 85% 90%, rgba(106,31,43,.55), transparent 24rem)' }} />
          <div className="relative">
            <div className="mx-auto flex w-fit gap-1.5">{sampleBest.map(swatch => <SwatchDot key={swatch.hex} hex={swatch.hex} size={18} className="border-white/20" />)}</div>
            <h2 className={`${s.display} mx-auto mt-6 max-w-3xl text-[36px] sm:text-6xl`}>Stop guessing. Start <span className="font-[family-name:var(--font-bodoni-moda)] italic tracking-[-0.045em] text-[#E7C9A0]">glowing.</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-7 text-[#F5F3EE]/62">Two minutes and one selfie, and you will never stand in a shop wondering whether a colour suits you again.</p>
            <button onClick={onStart} disabled={starting} className="group mt-9 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#F5F3EE] px-8 text-[15px] font-semibold text-[#111315] transition hover:-translate-y-0.5 disabled:opacity-60 sm:min-h-16 sm:w-auto">
              {starting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Starting…</> : <>Find my colours, free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#111315]/8 px-4 py-8 text-center text-[12px] text-[#111315]/45 sm:px-6">
        © {new Date().getFullYear()} ICONIK · <Link href="/privacy-policy" className="underline underline-offset-2">Privacy</Link> · <Link href="/terms" className="underline underline-offset-2">Terms</Link>
      </footer>
    </>
  );
}

function PhotoStep({ role, preview, uploadState, error, onChoose, onRetry, onSkip }: {
  role: PhotoRole;
  preview: string;
  uploadState: PhotoUploadState;
  error: string;
  onChoose: (file: File) => void;
  onRetry: () => void;
  onSkip?: () => void;
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
    ? [
      { icon: Sun, title: 'Face a window', copy: 'Daylight on your face. Never the window behind you.' },
      { icon: X, title: 'No filter or beauty mode', copy: 'Turn off portrait blur, filters and skin smoothing.' },
      { icon: ScanFace, title: 'Hairline to shoulders', copy: 'A bare face is best. Light makeup is fine.' },
    ]
    : [
      { icon: Ruler, title: 'Head to toe', copy: 'Your complete outline, standing straight.' },
      { icon: Camera, title: 'Camera at waist height', copy: 'Not from above, which makes you look shorter.' },
      { icon: Check, title: 'Fitted clothes', copy: 'Not an oversized layer that hides your shape.' },
    ];
  return (
    <section className="mx-auto grid max-w-6xl gap-6 py-8 sm:gap-10 sm:py-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-14">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#6A1F2B]/15 bg-[#6A1F2B]/[.06] px-3 py-1.5 text-[11px] font-semibold text-[#6A1F2B]">
          {headshot ? <Palette className="h-3.5 w-3.5" /> : <Ruler className="h-3.5 w-3.5" />}{headshot ? 'Step 01 · Your selfie' : 'Step 02 · Optional bonus'}
        </span>
        <h1 className={`${s.display} mt-5 text-[40px] sm:text-6xl`}>
          {headshot ? <>Start with a <span className={s.serif}>daylight selfie.</span></> : <>Want your <span className={s.serif}>shape read</span> too?</>}
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#111315]/60 sm:mt-5">{headshot
          ? 'Your skin, eyes and hair in natural light are all we need to read your colours.'
          : 'Add a full-body photo and we will also show you the one thing making your outfits feel off. Your colour result does not need it.'}</p>
        {/* Three across on a phone, so the upload box stays near the top of the screen. */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:grid-cols-1 sm:gap-2.5">
          {tips.map(({ icon: Icon, title, copy }) => (
            <div key={title} className={`${s.glass} flex flex-col items-center gap-2 rounded-2xl p-3 text-center sm:flex-row sm:gap-4 sm:p-4 sm:text-left`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6A1F2B] shadow-sm"><Icon className="h-4 w-4" /></span>
              <div><div className="text-[11px] font-bold leading-4 sm:text-[13px] sm:leading-5">{title}</div><div className="hidden text-[12px] leading-5 text-[#111315]/55 sm:block">{copy}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={`${s.glassStrong} rounded-[28px] p-2.5 sm:p-4`}>
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
            <div><div className="text-[13px] font-bold">{headshot ? 'Your selfie' : 'Full-body photo'}</div><div className="mt-0.5 text-[11px] text-[#111315]/45">Private · quality checked automatically</div></div>
            <span className="text-[11px] font-bold text-[#6A1F2B]">{headshot ? 'Required' : 'Optional'}</span>
          </div>
          <label className={`relative block cursor-pointer overflow-hidden rounded-[22px] border-2 transition ${uploadState.phase === 'done' ? 'border-[#4F6B57]/40 bg-[#EAF0EB]' : 'border-dashed border-[#111315]/15 bg-[#F5F3EE]/70 hover:border-[#6A1F2B]/45 hover:bg-white'}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" disabled={uploading} onChange={event => {
              const file = event.target.files?.[0]; if (file) onChoose(file); event.currentTarget.value = '';
            }} />
            {preview ? (
              <div className="relative aspect-[4/5] min-h-[340px] w-full bg-[#E9E6E0] sm:min-h-[460px]">
                <Image src={preview} alt={`${headshot ? 'Selfie' : 'Full-body photo'} preview`} fill unoptimized className="object-contain" />
                {uploading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111315]/75 px-8 text-center text-white backdrop-blur-[3px]">
                  <LoaderCircle className="mb-5 h-8 w-8 animate-spin text-[#E7C9A0]" />
                  <div className="text-xl font-bold tracking-[-0.03em]">{statusLabel}</div>
                  <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#E7C9A0] transition-[width] duration-300" style={{ width: `${uploadState.progress}%` }} /></div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[.16em] text-white/50">Encrypted in transit · keep this page open</div>
                </div>}
                {!uploading && <div className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#111315] px-5 py-3 text-xs font-semibold text-white shadow-xl">{uploadState.phase === 'done' && <Check className="h-3.5 w-3.5 text-[#E7C9A0]" />}{uploadState.phase === 'done' ? 'Photo ready · tap to replace' : 'Replace photo'}</div>}
              </div>
            ) : (
              <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden px-6 text-center sm:min-h-[500px]">
                {headshot
                  ? <div className="absolute left-1/2 top-1/2 h-[62%] w-[46%] max-w-[220px] -translate-x-1/2 -translate-y-[58%] rounded-[50%] border-2 border-dashed border-[#6A1F2B]/25" />
                  : <div className="absolute left-1/2 top-1/2 h-[78%] w-[30%] max-w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-[60px] border-2 border-dashed border-[#6A1F2B]/20" />}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#111315] text-white shadow-xl sm:h-20 sm:w-20"><Camera className="h-6 w-6 sm:h-7 sm:w-7" /><span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#6A1F2B] text-white"><Zap className="h-3 w-3" /></span></div>
                <div className="relative mt-5 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{headshot ? 'Take or choose a selfie' : 'Take or choose a photo'}</div>
                <p className="relative mt-3 max-w-sm text-[12px] leading-6 text-[#111315]/50">JPG, PNG, WEBP or HEIC · up to 12MB<br />Large photos are compressed before they leave your phone.</p>
              </div>
            )}
          </label>
        </div>
        {uploadState.phase === 'done' && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#4F6B57]/20 bg-[#EAF0EB] p-4 text-xs text-[#3F5546]"><span className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4" /> Photo passed the quality check</span>{uploadState.savedBytes > 0 && <span className="text-[#3F5546]/65">Upload reduced by {formatBytes(uploadState.savedBytes)}</span>}</div>}
        {error && <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><p>{error}</p>{uploadState.phase === 'error' && <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold"><RotateCcw className="h-3.5 w-3.5" /> Retry this photo</button>}</div>}
        {onSkip && uploadState.phase !== 'done' && !uploading && (
          <button type="button" onClick={onSkip} className={`${s.ghost} mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[13px] font-semibold`}>
            Skip this. Just show me my colours <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#111315]/8 bg-white/50 p-4 text-[12px] leading-5 text-[#111315]/55"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#6A1F2B]" /><span>{PRIVACY}</span></div>
      </div>
    </section>
  );
}

function QuizStep({ index, answers, onAnswer }: {
  index: number;
  answers: Partial<StyleScanAnswersV1>;
  onAnswer: (key: AnswerKey, value: string) => void;
}) {
  const question = questions[index];
  const selected = answers[question.key];
  return (
    <section key={question.key} className={`${s.fadeUp} mx-auto max-w-3xl py-10 sm:py-16`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#6A1F2B]/15 bg-[#6A1F2B]/[.06] px-3 py-1.5 text-[11px] font-semibold text-[#6A1F2B]"><Sparkles className="h-3.5 w-3.5" /> {question.eyebrow}</span>
        <span className="text-[12px] font-semibold tabular-nums text-[#111315]/45">{index + 1} of {questions.length}</span>
      </div>
      <div className="mt-4 flex gap-1">{questions.map((item, itemIndex) => <span key={item.key} className={`h-1 flex-1 rounded-full transition ${itemIndex < index || answers[item.key] ? 'bg-[#6A1F2B]' : itemIndex === index ? 'bg-[#111315]/30' : 'bg-[#111315]/10'}`} />)}</div>
      <h1 className={`${s.display} mt-8 text-[34px] sm:text-[54px]`}>{question.prompt}</h1>
      <div className={`mt-8 grid gap-2.5 ${question.options.length > 3 ? 'sm:grid-cols-2' : ''}`}>
        {question.options.map(option => {
          const isSelected = selected === option.value;
          return (
            <button key={option.value} type="button" onClick={() => onAnswer(question.key, option.value)} aria-pressed={isSelected}
              className={`${s.option} ${isSelected ? s.optionSelected : ''} flex min-h-[64px] items-center gap-4 rounded-2xl px-5 py-4 text-left`}>
              {option.swatches && <span className="flex shrink-0 -space-x-2">{option.swatches.map(hex => <SwatchDot key={hex} hex={hex} size={26} className={isSelected ? 'border-white/40' : 'border-white'} />)}</span>}
              <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{option.label}</span>{option.hint && <span className={`block text-[12px] ${isSelected ? 'text-white/60' : 'text-[#111315]/50'}`}>{option.hint}</span>}</span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[#E7C9A0] bg-[#E7C9A0] text-[#111315]' : 'border-[#111315]/15'}`}>{isSelected && <Check className="h-3.5 w-3.5" />}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function StyleScanClient({ resumeToken }: { resumeToken: string }) {
  const [step, setStep] = useState(resumeToken ? 1 : 0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [token, setToken] = useState(resumeToken);
  const [busyRole, setBusyRole] = useState<PhotoRole | null>(null);
  const [previews, setPreviews] = useState<Record<PhotoRole, string>>({ headshot: '', full_body: '' });
  const [uploaded, setUploaded] = useState<Record<PhotoRole, boolean>>({ headshot: false, full_body: false });
  const [uploadStates, setUploadStates] = useState<Record<PhotoRole, PhotoUploadState>>({ headshot: EMPTY_UPLOAD_STATE, full_body: EMPTY_UPLOAD_STATE });
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Partial<StyleScanAnswersV1>>({});
  const selectedFiles = useRef<Record<PhotoRole, File | null>>({ headshot: null, full_body: null });
  const previewUrls = useRef<Record<PhotoRole, string>>({ headshot: '', full_body: '' });
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (resumeToken) window.sessionStorage.setItem('iconik_style_scan_token', resumeToken);
  }, [resumeToken]);

  useEffect(() => () => {
    Object.values(previewUrls.current).forEach(url => { if (url) URL.revokeObjectURL(url); });
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step, quizIndex]);

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

  const answer = useCallback((key: AnswerKey, value: string) => {
    setAnswers(current => ({ ...current, [key]: value }));
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    // A short pause lets her see the tick land before the next question slides in.
    advanceTimer.current = window.setTimeout(() => {
      const index = questions.findIndex(question => question.key === key);
      if (index < questions.length - 1) setQuizIndex(index + 1);
      else setStep(4);
    }, 320);
  }, []);

  const skipFullBody = useCallback(() => {
    trackScanEvent('style_scan_full_body_skipped');
    setError('');
    setStep(3);
  }, []);

  const goBack = useCallback(() => {
    setError('');
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    if (step === 3 && quizIndex > 0) { setQuizIndex(current => current - 1); return; }
    setStep(current => Math.max(0, current - 1));
  }, [quizIndex, step]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = useCallback(async () => {
    if (!token || !allAnswered || !consent || !emailValid) return;
    setSubmitting(true); setError('');
    try {
      const data = await postStyleScanJson<{ resultUrl: string; success: true }>(`/api/style-scan/${encodeURIComponent(token)}/submit`, {
        phone, email: email.trim(), firstName: firstName.trim() || undefined, whatsappOptIn: consent, answers,
      });
      trackScanEvent('style_scan_submitted', { full_body: uploaded.full_body });
      window.location.assign(data.resultUrl);
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Please try again.'); setSubmitting(false); }
  }, [allAnswered, answers, consent, email, emailValid, firstName, phone, token, uploaded.full_body]);

  // The full-body photo is optional, so on that step the button skips it until a photo is added.
  const nextDisabled = (step === 1 && !uploaded.headshot) || (step === 3 && !answers[questions[quizIndex].key]) || Boolean(busyRole);
  const onNext = () => {
    setError('');
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    if (step === 2 && !uploaded.full_body) { skipFullBody(); return; }
    if (step === 3) {
      if (quizIndex < questions.length - 1) setQuizIndex(current => current + 1);
      else setStep(4);
      return;
    }
    setStep(current => current + 1);
  };

  return (
    <div className={s.shell}>
      {step === 0 && <Landing onStart={() => void start()} starting={starting} error={error} />}
      {step > 0 && <StepHeader step={step} quizIndex={quizIndex} />}
      <main>
        {step === 1 && <div className="px-4 sm:px-6"><PhotoStep role="headshot" preview={previews.headshot} uploadState={uploadStates.headshot} error={error} onChoose={file => void upload('headshot', file)} onRetry={() => retryUpload('headshot')} /></div>}
        {step === 2 && <div className="px-4 sm:px-6"><PhotoStep role="full_body" preview={previews.full_body} uploadState={uploadStates.full_body} error={error} onChoose={file => void upload('full_body', file)} onRetry={() => retryUpload('full_body')} onSkip={skipFullBody} /></div>}
        {step === 3 && <div className="px-4 sm:px-6"><QuizStep index={quizIndex} answers={answers} onAnswer={answer} /></div>}
        {step === 4 && (
          <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-10">
            {/* On a phone the form comes first; the summary card follows it. */}
            <div className="relative order-2 overflow-hidden rounded-[28px] bg-[#111315] p-6 text-[#F5F3EE] sm:p-10 lg:order-1">
              <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 90% 0%, rgba(106,31,43,.6), transparent 20rem), radial-gradient(circle at 0% 100%, rgba(148,166,173,.3), transparent 18rem)' }} />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-[#E7C9A0]"><Sparkles className="h-3.5 w-3.5" /> Selfie and answers ready</span>
                <h1 className={`${s.display} mt-6 text-[40px] sm:text-[56px]`}>Your colours are <span className="font-[family-name:var(--font-bodoni-moda)] italic tracking-[-0.045em] text-[#E7C9A0]">one tap away.</span></h1>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-white/60">Your result opens right here in about two minutes. We also email you a copy so you can shop with it later.</p>
                <ul className="mt-8 grid gap-2.5">
                  {['Your undertone, depth and contrast', 'Six shades that light up your face', 'Colours to skip, and what to wear instead', 'Your metals, lip shades and colour rules', ...(uploaded.full_body ? ['Bonus: the one thing making outfits feel off'] : [])].map(item => (
                    <li key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-[13px] font-medium"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7C9A0] text-[#111315]"><Check className="h-3 w-3" /></span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={`${s.glassStrong} order-1 rounded-[28px] p-6 sm:p-9 lg:order-2`}>
              <Micro className="text-[#6A1F2B]">Final step</Micro>
              <h2 className={`${s.display} mt-3 text-[32px] sm:text-[42px]`}>Where should we send your colours?</h2>
              <p className="mt-3 text-[13px] leading-6 text-[#111315]/50">No payment. Your result opens on this page as well.</p>
              <label htmlFor="scan-first-name" className="mt-8 block text-[12px] font-bold">First name <span className="font-normal text-[#111315]/40">(optional)</span></label>
              <input id="scan-first-name" value={firstName} onChange={event => setFirstName(event.target.value.slice(0, 30))} autoComplete="given-name" placeholder="Priya" className="mt-2 w-full rounded-2xl border border-[#111315]/12 bg-white/70 px-4 py-3.5 text-[15px] outline-none transition focus:border-[#6A1F2B] focus:bg-white sm:py-4" />
              <label htmlFor="scan-email" className="mt-5 block text-[12px] font-bold">Email</label>
              <input id="scan-email" type="email" value={email} onChange={event => setEmail(event.target.value.slice(0, 254))} autoComplete="email" inputMode="email" placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-[#111315]/12 bg-white/70 px-4 py-3.5 text-[15px] outline-none transition focus:border-[#6A1F2B] focus:bg-white sm:py-4" />
              <label htmlFor="scan-phone" className="mt-5 block text-[12px] font-bold">WhatsApp number</label>
              <div className="mt-2 flex overflow-hidden rounded-2xl border border-[#111315]/12 bg-white/70 transition focus-within:border-[#6A1F2B] focus-within:bg-white"><span className="border-r border-[#111315]/10 px-4 py-3.5 text-[15px] text-[#111315]/45 sm:py-4">+91</span><input id="scan-phone" value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[15px] outline-none sm:py-4" /></div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#111315]/10 bg-white/55 p-4 transition hover:border-[#6A1F2B]/30"><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); if (event.target.checked) trackScanEvent('style_scan_consent_completed'); }} className="mt-1 h-4 w-4 accent-[#6A1F2B]" /><span className="text-[12px] leading-5 text-[#111315]/60">Send my result and a few colour tips by email and WhatsApp. I can unsubscribe at any time.</span></label>
              {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
              <button onClick={() => void submit()} disabled={submitting || phone.length !== 10 || !consent || !emailValid} className={`${s.cta} group mt-7 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full px-8 text-[15px] font-semibold`}>
                {submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Reading your colours…</> : <>Reveal my colours <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#111315]/40"><ShieldCheck className="h-3.5 w-3.5" /> Secure · free · no card needed</div>
            </div>
          </section>
        )}
      </main>
      {step > 0 && step < 4 && (
        <div className="sticky bottom-0 z-40 border-t border-[#111315]/8 bg-[#F5F3EE]/85 p-3 backdrop-blur-2xl sm:p-4"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button onClick={goBack} className={`${s.ghost} inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[13px] font-semibold`}><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="hidden text-center md:block"><div className="text-[12px] font-semibold text-[#111315]/55">{step === 1 ? 'Next: an optional full-body photo' : step === 2 ? 'Next: eight quick taps' : `Question ${quizIndex + 1} of ${questions.length}`}</div><div className="mt-0.5 text-[11px] text-[#111315]/35">Your progress is kept in this private session</div></div>
          <button onClick={onNext} disabled={nextDisabled} className={`${s.cta} inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[13px] font-semibold`}>
            {step === 2 ? (uploaded.full_body ? 'Next · Questions' : 'Skip this step') : step === 3 && quizIndex === questions.length - 1 ? 'Almost done' : 'Next'} <ArrowRight className="h-4 w-4" />
          </button>
        </div></div>
      )}
    </div>
  );
}
