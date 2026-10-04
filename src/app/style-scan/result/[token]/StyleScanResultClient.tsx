'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, Check, Copy, Download, Lock, LockKeyhole, Mail, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { StyleScanAnalysisV1, StyleScanColourProfileV1, StyleScanStatus, StyleScanSwatchV1 } from '@/lib/styleScan';
import { buildAvoidSwatches, colourOutfitIdeas, contrastRule, hexLightness, metalsAdvice, nearFaceRule, swapSuggestions, titleCaseWords } from '@/lib/styleScanColour';
import s from '../../colourScan.module.css';

interface StatusPayload {
  status: StyleScanStatus;
  analysis: StyleScanAnalysisV1 | null;
  visualUrl: string | null;
  headshotUrl?: string | null;
  retakeReason?: string | null;
  contact?: { phone?: string | null; email?: string | null } | null;
  dressCode?: string | null;
}
type TrackingWindow = Window & { fbq?: (command: string, event: string, details: Record<string, string>) => void };

function trackProductClick() {
  if (typeof window !== 'undefined') (window as TrackingWindow).fbq?.('trackCustom', 'style_scan_cta_clicked', { product: 'personal_2699' });
}

function trackResultEvent(name: string) {
  if (typeof window !== 'undefined') (window as TrackingWindow).fbq?.('trackCustom', name, { funnel: 'style_scan_v1' });
}

const STAGES = ['Reading your skin in daylight', 'Finding your undertone', 'Measuring your contrast', 'Choosing your best shades', 'Checking the colours to skip'];

/** Scans from before the colour-first result only stored five shades and the avoid names. */
function legacyColourProfile(analysis: StyleScanAnalysisV1): StyleScanColourProfileV1 | null {
  const wear = analysis.palette?.wear ?? [];
  if (!wear.length) return null;
  const best = wear.map(swatch => ({ name: swatch.name, hex: swatch.hex }));
  const avoid = buildAvoidSwatches(analysis.palette?.avoid ?? []);
  return {
    paletteName: titleCaseWords(`${analysis.undertone.depth} ${analysis.undertone.direction}`),
    undertone: titleCaseWords(analysis.undertone.direction),
    depth: titleCaseWords(analysis.undertone.depth),
    contrast: 'Medium',
    best,
    accents: [],
    avoid,
    lockedCount: 0,
    lockedPreview: [],
    metals: metalsAdvice(analysis.undertone.direction),
    lips: [],
    rules: [nearFaceRule(best, avoid), contrastRule('medium')],
  };
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`;
}

function inkOn(hex: string) {
  return hexLightness(hex) > 0.62 ? '#111315' : '#F5F3EE';
}

function Wordmark() {
  return <span className="text-[17px] font-semibold tracking-[0.42em] text-[#111315]">ICONIK</span>;
}

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${s.micro} ${className}`}>{children}</div>;
}

function ResultHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#111315]/8 bg-[#F5F3EE]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Wordmark />
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#111315]/50"><LockKeyhole className="h-3.5 w-3.5 text-[#6A1F2B]" /> Private result</span>
      </div>
    </header>
  );
}

function Loading({ status, error, onRetry }: { status?: StyleScanStatus; error: string; onRetry: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStage(current => Math.min(STAGES.length - 1, current + 1)), 9000);
    return () => window.clearInterval(timer);
  }, []);
  const orbit = ['#1F6F6B', '#A4492A', '#C9A227', '#6B6B35', '#5B2A4B', '#C19A6B'];
  return (
    <div className={s.shell}>
      <ResultHeader />
      <main className={`${s.grid} flex min-h-[calc(100vh-61px)] items-center justify-center px-4 py-16`}>
        <div className="w-full max-w-xl text-center">
          <div className="relative mx-auto h-40 w-40">
            <div className={`${s.orbit} absolute inset-0`}>
              {orbit.map((hex, index) => {
                const angle = (index / orbit.length) * Math.PI * 2;
                return <span key={hex} className={`${s.orbitItem} absolute h-9 w-9 rounded-full border-2 border-white shadow-md`} style={{ backgroundColor: hex, left: `${(50 + Math.cos(angle) * 42).toFixed(1)}%`, top: `${(50 + Math.sin(angle) * 42).toFixed(1)}%`, marginLeft: -18, marginTop: -18 }} />;
              })}
            </div>
            <div className={`${s.glassStrong} ${s.pulse} absolute inset-[30%] flex items-center justify-center rounded-full`}><Sparkles className="h-6 w-6 text-[#6A1F2B]" /></div>
          </div>
          <Micro className="mt-10 text-[#6A1F2B]">Your colour analysis</Micro>
          <h1 className={`${s.display} mt-4 text-[40px] sm:text-6xl`}>Reading your <span className={s.serif}>colours.</span></h1>
          <ul className="mx-auto mt-8 grid max-w-sm gap-2 text-left">
            {STAGES.map((label, index) => (
              <li key={label} className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition ${index < stage ? 'text-[#111315]/55' : index === stage ? `${s.glassStrong} text-[#111315]` : 'text-[#111315]/25'}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index < stage ? 'bg-[#6A1F2B] text-white' : index === stage ? 'border-2 border-[#6A1F2B]' : 'border border-[#111315]/15'}`}>{index < stage && <Check className="h-3 w-3" />}</span>
                {label}{index === stage && <span className={`${s.shimmer} ml-auto h-1.5 w-10 rounded-full bg-[#111315]/8`} />}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[13px] text-[#111315]/45">{status === 'failed' ? 'Getting ready to try again…' : 'Usually ready in about two minutes. This page updates on its own, and we email you a copy.'}</p>
          {error && <div className="mt-5 text-sm text-red-700">{error} <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button></div>}
        </div>
      </main>
    </div>
  );
}

/** Her own selfie framed in a colour, with a drape under the chin, like an in-person drape test. */
function DrapeFrame({ hex, photo, label, skip = false, compact = false }: { hex: string; photo: string | null; label: string; skip?: boolean; compact?: boolean }) {
  return (
    <figure className="min-w-0">
      <div className={`${s.drape} relative overflow-hidden ${compact ? 'rounded-[22px] p-2' : 'rounded-[30px] p-3 sm:p-4'}`} style={{ backgroundColor: hex }}>
        <div className={`relative aspect-[4/5] overflow-hidden bg-[#E9E6E0] ${compact ? 'rounded-[16px]' : 'rounded-[22px]'}`}>
          {photo
            ? <Image src={photo} alt="Your selfie" fill unoptimized sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover object-top" />
            : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#E9E6E0] px-4 text-center text-[11px] font-semibold text-[#111315]/45"><Camera className="h-5 w-5" />Reload to see your selfie</div>}
          <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[24%] w-full" aria-hidden>
            <path className={s.drape} d="M0 34 C 70 8, 150 6, 200 62 C 250 6, 330 8, 400 34 L400 160 L0 160 Z" style={{ fill: hex }} />
          </svg>
        </div>
        <figcaption className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 font-semibold text-[#111315] shadow-sm backdrop-blur ${compact ? 'bottom-4 px-2.5 py-1 text-[10px]' : 'bottom-6 px-3.5 py-1.5 text-[12px]'}`}>
          {skip ? <X className="mr-1 inline h-3 w-3 text-[#6A1F2B]" /> : <Check className="mr-1 inline h-3 w-3 text-[#4F6B57]" />}{label}
        </figcaption>
      </div>
    </figure>
  );
}

function DrapeStudio({ colour, photo }: { colour: StyleScanColourProfileV1; photo: string | null }) {
  const wearList = [...colour.best, ...colour.accents];
  const [mode, setMode] = useState<'wear' | 'skip' | 'compare'>('wear');
  const [wearIndex, setWearIndex] = useState(0);
  const [skipIndex, setSkipIndex] = useState(0);
  const wear = wearList[wearIndex] ?? wearList[0];
  const skip = colour.avoid[skipIndex] ?? colour.avoid[0];
  const active = mode === 'skip' && skip ? skip : wear;
  const list = mode === 'skip' ? colour.avoid : wearList;
  const selectedIndex = mode === 'skip' ? skipIndex : wearIndex;
  const pick = (index: number) => (mode === 'skip' ? setSkipIndex(index) : setWearIndex(index));

  return (
    <section className={`${s.glass} rounded-[32px] p-4 sm:p-8`}>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-10">
        <div>
          {mode === 'compare' && skip
            ? <div className="grid grid-cols-2 gap-3"><DrapeFrame hex={skip.hex} photo={photo} label={skip.name} skip compact /><DrapeFrame hex={wear.hex} photo={photo} label={wear.name} compact /></div>
            : <DrapeFrame hex={active.hex} photo={photo} label={active.name} skip={mode === 'skip'} />}
        </div>
        <div>
          <Micro className="text-[#6A1F2B]">The drape test</Micro>
          <h2 className={`${s.display} mt-3 text-[32px] sm:text-5xl`}>See the difference <span className={s.serif}>on you.</span></h2>
          <p className="mt-4 text-[14px] leading-6 text-[#111315]/60">Tap a colour to drape it under your chin. Watch your skin, not the fabric: your best shades even it out, while skip shades cast a shadow under your eyes.</p>
          <div className="mt-6 inline-flex rounded-full border border-[#111315]/10 bg-white/60 p-1" role="tablist">
            {([['wear', 'Wear'], ['skip', 'Skip'], ['compare', 'Compare']] as const).filter(([value]) => value === 'wear' || colour.avoid.length).map(([value, label]) => (
              <button key={value} role="tab" aria-selected={mode === value} onClick={() => { setMode(value); if (value === 'compare') trackResultEvent('style_scan_drape_compare'); }} className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${mode === value ? 'bg-[#111315] text-[#F5F3EE]' : 'text-[#111315]/55 hover:text-[#111315]'}`}>{label}</button>
            ))}
          </div>
          {mode === 'compare' ? (
            <p className="mt-5 rounded-2xl bg-white/60 p-4 text-[13px] leading-6 text-[#111315]/65">Left: <strong>{skip?.name}</strong>, one of your skip colours. Right: <strong>{wear.name}</strong>, one of your best. Switch to Wear or Skip to change either side.</p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {list.map((swatch, index) => (
                <button key={`${swatch.hex}-${index}`} onClick={() => pick(index)} aria-label={`Drape ${swatch.name}`} aria-pressed={selectedIndex === index}
                  className={`relative h-12 w-12 rounded-full border-2 transition sm:h-14 sm:w-14 ${selectedIndex === index ? 'scale-110 border-[#111315] shadow-lg' : 'border-white shadow-sm hover:scale-105'}`} style={{ backgroundColor: swatch.hex }}>
                  {mode === 'skip' && <X className="absolute inset-0 m-auto h-4 w-4" style={{ color: inkOn(swatch.hex) }} />}
                </button>
              ))}
            </div>
          )}
          {mode !== 'compare' && <div className="mt-5 min-h-[48px] text-[13px] leading-6 text-[#111315]/65"><strong className="text-[#111315]">{active.name}</strong>{mode === 'skip' ? ' · keep it away from your face, or wear it below the waist.' : active.usage ? ` · ${active.usage}` : ' · wear it near your face: tops, kurtas, dupattas and scarves.'}</div>}
          {!photo && <p className="mt-3 text-[11px] text-[#111315]/40">Your selfie link has expired. Reload the page to see your colours on your own photo.</p>}
        </div>
      </div>
    </section>
  );
}

function SwatchTile({ swatch, onCopy, copied }: { swatch: StyleScanSwatchV1; onCopy: (hex: string) => void; copied: boolean }) {
  return (
    <button onClick={() => onCopy(swatch.hex)} className="group text-left" aria-label={`Copy ${swatch.name} shade code ${swatch.hex}`}>
      <span className="relative block aspect-[4/5] overflow-hidden rounded-[22px] border border-black/5 shadow-[0_12px_30px_rgba(17,19,21,0.08)] transition group-hover:-translate-y-1" style={{ backgroundColor: swatch.hex }}>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-bold tabular-nums text-[#111315] backdrop-blur">
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" />{swatch.hex}</>}
        </span>
      </span>
      <span className="mt-2.5 block text-[14px] font-bold leading-5">{swatch.name}</span>
      {swatch.usage && <span className="mt-0.5 line-clamp-2 block text-[12px] leading-5 text-[#111315]/50">{swatch.usage}</span>}
    </button>
  );
}

async function fontFamily(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

async function renderPaletteCard(input: { name: string | null; colour: StyleScanColourProfileV1 }): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const sans = await fontFamily('--font-manrope', 'system-ui, sans-serif');
  const serif = await fontFamily('--font-bodoni-moda', 'Georgia, serif');
  try {
    await Promise.all([document.fonts.load(`700 40px ${sans}`), document.fonts.load(`italic 480 40px ${serif}`)]);
  } catch { /* Canvas falls back to system fonts. */ }

  ctx.fillStyle = '#F5F3EE';
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = 'rgba(17,19,21,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1080; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1350); ctx.stroke(); }
  for (let y = 0; y <= 1350; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#111315';
  ctx.font = `600 34px ${sans}`;
  ctx.fillText('I  C  O  N  I  K', 540, 112);
  ctx.fillStyle = '#6A1F2B';
  ctx.font = `700 22px ${sans}`;
  ctx.fillText((input.name ? `${input.name}’s colours` : 'My colours').toUpperCase().split('').join(' '), 540, 210);

  ctx.fillStyle = '#6A1F2B';
  let size = 104;
  ctx.font = `italic 480 ${size}px ${serif}`;
  while (ctx.measureText(input.colour.paletteName).width > 940 && size > 56) { size -= 6; ctx.font = `italic 480 ${size}px ${serif}`; }
  ctx.fillText(input.colour.paletteName, 540, 330);

  ctx.fillStyle = 'rgba(17,19,21,0.6)';
  ctx.font = `600 28px ${sans}`;
  ctx.fillText(`${input.colour.undertone} undertone  ·  ${input.colour.depth} depth  ·  ${input.colour.contrast} contrast`, 540, 400);

  const best = input.colour.best.slice(0, 6);
  const tile = 270;
  const gap = 36;
  const startX = (1080 - (tile * 3 + gap * 2)) / 2;
  best.forEach((swatch, index) => {
    const x = startX + (index % 3) * (tile + gap);
    const y = 470 + Math.floor(index / 3) * (tile + 90);
    ctx.fillStyle = swatch.hex;
    ctx.beginPath();
    ctx.roundRect(x, y, tile, tile, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(17,19,21,0.08)';
    ctx.stroke();
    ctx.fillStyle = '#111315';
    ctx.font = `700 28px ${sans}`;
    ctx.fillText(swatch.name, x + tile / 2, y + tile + 46);
  });

  const avoid = input.colour.avoid.slice(0, 3);
  if (avoid.length) {
    ctx.fillStyle = 'rgba(17,19,21,0.5)';
    ctx.font = `700 22px ${sans}`;
    ctx.fillText('SKIP NEAR MY FACE', 540, 1195);
    avoid.forEach((swatch, index) => {
      const cx = 540 + (index - (avoid.length - 1) / 2) * 92;
      ctx.fillStyle = swatch.hex;
      ctx.beginPath();
      ctx.arc(cx, 1250, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = inkOn(swatch.hex);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 11, 1239); ctx.lineTo(cx + 11, 1261); ctx.moveTo(cx + 11, 1239); ctx.lineTo(cx - 11, 1261); ctx.stroke();
      ctx.lineWidth = 1;
    });
  }
  ctx.fillStyle = 'rgba(17,19,21,0.45)';
  ctx.font = `600 22px ${sans}`;
  ctx.fillText('Find yours free at iconik.pro/style-scan', 540, 1322);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export default function StyleScanResultClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [sharing, setSharing] = useState(false);
  const processing = useRef(false);

  const load = useCallback(async (): Promise<StatusPayload | null> => {
    try {
      const response = await fetch(`/api/style-scan/${encodeURIComponent(token)}/status`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load your scan.');
      setPayload(data);
      setError('');
      return data as StatusPayload;
    } catch (issue) {
      // A local restart or a short network interruption should not create an
      // unhandled polling error. Keep the private result page in place and let
      // the next poll reconnect automatically.
      if (issue instanceof TypeError) {
        setError('Connection paused. Keep this page open — we’ll reconnect automatically.');
        return null;
      }
      throw issue;
    }
  }, [token]);

  const process = useCallback(async () => {
    if (processing.current) return;
    processing.current = true;
    try {
      await fetch(`/api/style-scan/${encodeURIComponent(token)}/process`, { method: 'POST' });
      await load();
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Your scan is still processing.'); }
    finally { processing.current = false; }
  }, [load, token]);

  const resultComplete = payload?.status === 'ready' || payload?.status === 'retake_required';

  useEffect(() => {
    if (resultComplete) return;
    let active = true;
    void load().then(data => { if (active && data && ['submitted', 'failed'].includes(data.status)) void process(); }).catch(issue => setError(issue.message));
    const timer = window.setInterval(() => void load().catch(issue => setError(issue.message)), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [load, process, resultComplete]);

  useEffect(() => {
    if (payload?.status === 'submitted' || payload?.status === 'failed') void process();
    if (payload?.status === 'ready' && typeof window !== 'undefined') {
      // No personal values are sent to analytics.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).fbq?.('trackCustom', 'style_scan_result_viewed', { funnel: 'style_scan_v1' });
    }
  }, [payload?.status, process]);

  const analysis = payload?.status === 'ready' ? payload.analysis : null;
  const colour = useMemo(() => analysis ? analysis.colour ?? legacyColourProfile(analysis) : null, [analysis]);
  const swaps = useMemo(() => colour ? swapSuggestions(colour) : [], [colour]);
  const ideas = useMemo(() => colour ? colourOutfitIdeas(colour, payload?.dressCode) : [], [colour, payload?.dressCode]);

  const copyHex = useCallback((hex: string) => {
    void navigator.clipboard?.writeText(hex).catch(() => undefined);
    setCopied(hex);
    window.setTimeout(() => setCopied(current => current === hex ? '' : current), 1600);
  }, []);

  const savePalette = useCallback(async () => {
    if (!colour) return;
    setSharing(true);
    try {
      const blob = await renderPaletteCard({ name: analysis?.firstName ?? null, colour });
      if (!blob) return;
      const file = new File([blob], 'my-iconik-colours.png', { type: 'image/png' });
      trackResultEvent('style_scan_palette_saved');
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My ICONIK colours' }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } finally { setSharing(false); }
  }, [analysis?.firstName, colour]);

  if (!payload || !resultComplete) {
    return <Loading status={payload?.status} error={error} onRetry={() => void process()} />;
  }

  if (payload.status === 'retake_required') {
    return (
      <div className={s.shell}>
        <ResultHeader />
        <main className={`${s.grid} flex min-h-[calc(100vh-61px)] items-center justify-center px-4 py-16`}>
          <div className={`${s.glassStrong} max-w-xl rounded-[30px] p-8 text-center sm:p-12`}>
            <RefreshCw className="mx-auto mb-5 h-8 w-8 text-[#6A1F2B]" />
            <Micro className="text-[#6A1F2B]">One quick retake</Micro>
            <h1 className={`${s.display} mt-4 text-[40px]`}>Accuracy <span className={s.serif}>first.</span></h1>
            <p className="mt-5 text-[14px] leading-6 text-[#111315]/62">{payload.retakeReason}</p>
            <Link href={`/style-scan?resume=${encodeURIComponent(token)}`} className={`${s.cta} mt-8 inline-flex min-h-14 items-center gap-2 rounded-full px-7 text-[14px] font-semibold`}>Retake my selfie <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </main>
      </div>
    );
  }

  const result = payload.analysis!;
  const plain = result.plain;
  const scanParam = encodeURIComponent(token);
  const lowConfidence = result.confidence.overall < 0.65;
  const showBody = result.bodyRead !== false && Boolean(plain?.geometry?.body);
  const reveal = (index: number) => ({ animationDelay: `${index * 120}ms` });

  return (
    <div className={s.shell}>
      <ResultHeader />
      <main>
        <section className={`${s.grid} px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-20`}>
          <div className={`${s.fadeUp} mx-auto max-w-4xl text-center`}>
            <Micro className="text-[#111315]/55">Your colour analysis</Micro>
            <h1 className={`${s.display} mt-5 text-[44px] sm:text-[76px]`}>
              {result.firstName ? `${result.firstName}, you’re a` : 'You’re a'}{' '}
              <span className={s.serif}>{colour?.paletteName ?? titleCaseWords(result.undertone.direction)}.</span>
            </h1>
            {colour && <div className="mt-6 flex flex-wrap justify-center gap-2">{[`${colour.undertone} undertone`, `${colour.depth} depth`, `${colour.contrast} contrast`].map(chip => <span key={chip} className={`${s.glassStrong} rounded-full px-4 py-2 text-[12px] font-bold`}>{chip}</span>)}</div>}
            {plain?.undertone && <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-7 text-[#111315]/62 sm:text-lg sm:leading-8"><strong className="text-[#111315]">{plain.undertone.verdict}</strong> {plain.undertone.body}</p>}
            {lowConfidence && <p className="mx-auto mt-4 max-w-xl text-[12px] leading-5 text-[#111315]/45">Your light made this a close call between two colour families. A stylist confirms it on a call.</p>}
            {colour && <div className="mx-auto mt-9 flex w-fit gap-2">{colour.best.map(swatch => <span key={swatch.hex} className="h-10 w-10 rounded-full border-2 border-white shadow-md sm:h-12 sm:w-12" style={{ backgroundColor: swatch.hex }} />)}</div>}
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-20 sm:gap-8 sm:px-6">
          {colour && <div className={s.fadeUp} style={reveal(1)}><DrapeStudio colour={colour} photo={payload.headshotUrl ?? null} /></div>}

          {colour && (
            <section className={`${s.fadeUp} pt-8`} style={reveal(2)}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Micro className="text-[#6A1F2B]">01 · Wear these near your face</Micro>
                  <h2 className={`${s.display} mt-3 text-[34px] sm:text-5xl`}>Your best <span className={s.serif}>shades.</span></h2>
                </div>
                <p className="max-w-xs text-[13px] leading-6 text-[#111315]/55">Tap a colour to copy its shade code, then search it on Myntra, Ajio or any store.</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {colour.best.map(swatch => <SwatchTile key={swatch.hex} swatch={swatch} onCopy={copyHex} copied={copied === swatch.hex} />)}
              </div>
              {(colour.accents.length > 0 || colour.lockedCount > 0) && (
                <div className="mt-8 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
                  {colour.accents.length > 0 && (
                    <div className={`${s.glass} rounded-[26px] p-5 sm:p-6`}>
                      <Micro className="text-[#111315]/45">Accent colours · in small doses</Micro>
                      <div className="mt-4 grid grid-cols-2 gap-4">{colour.accents.map(swatch => (
                        <button key={swatch.hex} onClick={() => copyHex(swatch.hex)} className="flex items-center gap-3 text-left">
                          <span className="h-12 w-12 shrink-0 rounded-2xl border border-black/5" style={{ backgroundColor: swatch.hex }} />
                          <span><span className="block text-[14px] font-bold">{swatch.name}</span><span className="text-[11px] font-semibold tabular-nums text-[#111315]/45">{copied === swatch.hex ? 'Copied' : swatch.hex}</span></span>
                        </button>
                      ))}</div>
                      <p className="mt-4 text-[12px] leading-5 text-[#111315]/50">A scarf, a clutch, earrings or one statement top. Not a whole outfit.</p>
                    </div>
                  )}
                  {colour.lockedCount > 0 && (
                    <Link href={`/offer-2699?scan=${scanParam}`} onClick={trackProductClick} className="group relative overflow-hidden rounded-[26px] border border-[#111315]/10 bg-white/50 p-5 sm:p-6">
                      <div className={`${s.locked} grid grid-cols-7 gap-2`}>{colour.lockedPreview.slice(0, 14).map((hex, index) => <span key={`${hex}-${index}`} className="aspect-square rounded-xl" style={{ backgroundColor: hex }} />)}</div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F3EE]/45 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111315] text-[#F5F3EE]"><Lock className="h-4 w-4" /></span>
                        <div className="mt-3 text-[15px] font-bold">+{colour.lockedCount} more shades found for you</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#6A1F2B]">Unlocked in your Blueprint <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {colour && colour.avoid.length > 0 && (
            <section className={`${s.fadeUp} ${s.glass} rounded-[32px] p-5 sm:p-10`} style={reveal(3)}>
              <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
                <div>
                  <Micro className="text-[#6A1F2B]">02 · Skip these near your face</Micro>
                  <h2 className={`${s.display} mt-3 text-[34px] sm:text-5xl`}>Why you sometimes look <span className={s.serif}>tired.</span></h2>
                  <p className="mt-4 text-[14px] leading-6 text-[#111315]/60">These shades bounce a grey or yellow cast onto your skin. Love one of them? Keep it, and wear it below the waist.</p>
                </div>
                <div className="grid gap-3">
                  {swaps.map(({ skip, wear }) => (
                    <div key={skip.hex} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 sm:gap-5 sm:p-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/5" style={{ backgroundColor: skip.hex }}><X className="h-4 w-4" style={{ color: inkOn(skip.hex) }} /></span>
                      <div className="min-w-0 flex-1"><div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#111315]/40">Skip</div><div className="truncate text-[14px] font-bold text-[#111315]/55 line-through">{skip.name}</div></div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#6A1F2B]" />
                      <div className="min-w-0 flex-1 text-right"><div className="text-[11px] font-bold uppercase tracking-[.12em] text-[#4F6B57]">Wear instead</div><div className="truncate text-[14px] font-bold">{wear.name}</div></div>
                      <span className="h-12 w-12 shrink-0 rounded-2xl border border-black/5" style={{ backgroundColor: wear.hex }} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {colour && (
            <section className={`${s.fadeUp} grid gap-4 lg:grid-cols-3`} style={reveal(4)}>
              <div className="lg:col-span-3"><Micro className="text-[#6A1F2B]">03 · Your colour rules</Micro></div>
              {colour.rules.map((rule, index) => (
                <article key={rule.title} className={`${s.glass} rounded-[26px] p-6`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111315] text-[12px] font-bold text-[#F5F3EE]">{index + 1}</span>
                  <h3 className="mt-6 text-[19px] font-bold leading-6 tracking-[-0.02em]">{rule.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#111315]/60">{rule.body}</p>
                </article>
              ))}
              {colour.lips.length > 0 && (
                <div className={`${s.glass} flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[22px] px-6 py-4 lg:col-span-3`}>
                  <Micro className="text-[#111315]/45">Everyday lips</Micro>
                  {colour.lips.map(lip => <span key={lip} className="text-[14px] font-semibold">{lip}</span>)}
                </div>
              )}
            </section>
          )}

          {ideas.length > 0 && (
            <section className={`${s.fadeUp} pt-8`} style={reveal(5)}>
              <Micro className="text-[#6A1F2B]">04 · Try this week</Micro>
              <h2 className={`${s.display} mt-3 text-[34px] sm:text-5xl`}>Three outfits in <span className={s.serif}>your colours.</span></h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {ideas.map(idea => (
                  <article key={idea.title} className={`${s.glass} flex flex-col rounded-[26px] p-6`}>
                    <div className="flex -space-x-2">{idea.swatches.map(swatch => <span key={swatch.hex} className="h-10 w-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: swatch.hex }} />)}</div>
                    <h3 className="mt-6 text-[19px] font-bold tracking-[-0.02em]">{idea.title}</h3>
                    <p className="mt-2 text-[13px] leading-6 text-[#111315]/62">{idea.formula}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {showBody && plain?.geometry && (
            <section className={`${s.fadeUp} rounded-[32px] border border-[#111315]/10 bg-[#AEBBC1]/25 p-6 sm:p-10`} style={reveal(6)}>
              <Micro className="text-[#6A1F2B]">Bonus · from your full-body photo</Micro>
              <h2 className={`${s.display} mt-3 max-w-3xl text-[30px] sm:text-[44px]`}>{plain.geometry.action}</h2>
              <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[#111315]/62">{plain.geometry.body}</p>
              <div className="mt-6 inline-flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-[13px] font-semibold leading-5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4F6B57]" />Nothing is wrong with your body. The clothes need to work together more clearly.</div>
            </section>
          )}

          {colour && (
            <section className={`${s.fadeUp} flex flex-col items-start justify-between gap-5 rounded-[28px] border border-[#111315]/10 bg-white/60 p-6 sm:flex-row sm:items-center sm:p-8`} style={reveal(7)}>
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-3 gap-1">{colour.best.slice(0, 6).map(swatch => <span key={swatch.hex} className="h-5 w-5 rounded-md" style={{ backgroundColor: swatch.hex }} />)}</div>
                <div><h2 className="text-[18px] font-bold tracking-[-0.02em]">Keep your colours on your phone</h2><p className="text-[13px] text-[#111315]/55">Save your palette card and pull it up when you shop.</p></div>
              </div>
              <button onClick={() => void savePalette()} disabled={sharing} className={`${s.ghost} inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[13px] font-bold sm:w-auto`}><Download className="h-4 w-4" /> {sharing ? 'Preparing…' : 'Save my palette'}</button>
            </section>
          )}

          <section className={`${s.fadeUp} relative overflow-hidden rounded-[32px] bg-[#111315] text-[#F5F3EE]`} style={reveal(8)}>
            <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 10% 0%, rgba(148,166,173,.32), transparent 24rem), radial-gradient(circle at 100% 100%, rgba(106,31,43,.6), transparent 26rem)' }} />
            <div className="relative grid gap-8 p-6 sm:p-12 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                {plain?.callback && <p className="mb-6 font-[family-name:var(--font-bodoni-moda)] text-xl italic leading-snug text-[#E7C9A0] sm:text-2xl">“{plain.callback}”</p>}
                <Micro className="text-white/50">Your colours are the start</Micro>
                <h2 className={`${s.display} mt-4 text-[36px] sm:text-[54px]`}>Now let a stylist build <span className="font-[family-name:var(--font-bodoni-moda)] italic tracking-[-0.045em] text-[#E7C9A0]">the rest.</span></h2>
                <ul className="mt-7 grid gap-3">
                  {['A 30-minute video call with your own stylist', '20 complete outfits in your colours, made for your body', `All your shades${colour?.lockedCount ? `, including the ${colour.lockedCount} still locked` : ''}`, 'Hairstyle, makeup, hair colour and glasses guides, free'].map(item => (
                    <li key={item} className="flex items-start gap-3 text-[14px] leading-6 text-white/80"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7C9A0] text-[#111315]"><Check className="h-3 w-3" /></span>{item}</li>
                  ))}
                </ul>
                <Link onClick={trackProductClick} href={`/offer-2699?scan=${scanParam}`} className="group mt-9 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#F5F3EE] px-8 text-[15px] font-semibold text-[#111315] transition hover:-translate-y-0.5 sm:min-h-16 sm:w-auto">
                  Build my Style Blueprint · ₹2,699 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <p className="mt-3 text-[12px] text-white/45">One-time payment · free changes until it matches what you asked for</p>
              </div>
              <div className="relative overflow-hidden rounded-[24px] border border-white/10">
                <Image src="/offer-2699/sample/blueprint-colours.webp" alt="A sample Blueprint colours page: ten colours to wear and four to skip, shown side by side on a model" width={1080} height={1080} className="h-auto w-full" />
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-2 pt-2 text-center text-[12px] text-[#111315]/45">
            {payload.contact?.email && <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#6A1F2B]" /> A copy of your colours is on its way to {maskEmail(payload.contact.email)}</span>}
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> For your eyes only · private result link</span>
          </div>
        </div>
      </main>
    </div>
  );
}
