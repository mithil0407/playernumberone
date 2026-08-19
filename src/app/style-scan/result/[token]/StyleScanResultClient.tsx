'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { StyleScanAnalysisV1, StyleScanStatus } from '@/lib/styleScan';

interface StatusPayload {
  status: StyleScanStatus;
  analysis: StyleScanAnalysisV1 | null;
  visualUrl: string | null;
  retakeReason?: string | null;
}
type TrackingWindow = Window & { fbq?: (command: string, event: string, details: Record<string, string>) => void };

function trackProductClick(product: 'instant_999' | 'personal_2699') {
  if (typeof window !== 'undefined') (window as TrackingWindow).fbq?.('trackCustom', 'style_scan_cta_clicked', { product });
}

const stageCopy: Partial<Record<StyleScanStatus, string>> = {
  submitted: 'Securing your photos', analyzing: 'Reading your geometry and colouring', generating_visual: 'Building your first outfit formula', failed: 'Preparing a safe retry',
};

export default function StyleScanResultClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [error, setError] = useState('');
  const processing = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/style-scan/${encodeURIComponent(token)}/status`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load your scan.');
    setPayload(data);
    return data as StatusPayload;
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

  useEffect(() => {
    let active = true;
    void load().then(data => { if (active && ['submitted', 'failed'].includes(data.status)) void process(); }).catch(issue => setError(issue.message));
    const timer = window.setInterval(() => void load().catch(() => undefined), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [load, process]);

  useEffect(() => {
    if (payload?.status === 'submitted' || payload?.status === 'failed') void process();
    if (payload?.status === 'ready' && typeof window !== 'undefined') {
      // No personal values are sent to analytics.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).fbq?.('trackCustom', 'style_scan_result_viewed', { funnel: 'style_scan_v1' });
    }
  }, [payload?.status, process]);

  if (!payload || !['ready', 'retake_required'].includes(payload.status)) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-5 text-[#2C2622]"><div className="w-full max-w-xl text-center">
      <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEE5D5]"><Sparkles className="h-6 w-6 animate-pulse" /></div>
      <div className="iconik-micro mb-4 text-[#B68C52]">ICONIK STYLE SCAN</div>
      <h1 className="iconik-display text-4xl sm:text-6xl">We’re reading the details that change everything.</h1>
      <p className="mt-5 text-sm leading-6 text-[#2C2622]/60">{stageCopy[payload?.status || 'submitted'] || 'Preparing your private result'}… This page saves your place and updates automatically.</p>
      <div className="mx-auto mt-8 h-1.5 max-w-sm overflow-hidden rounded-full bg-[#2C2622]/10"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#B68C52]" /></div>
      {error && <div className="mt-6 text-sm text-red-700">{error} <button onClick={() => void process()} className="ml-2 underline">Retry</button></div>}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#2C2622]/42"><Clock3 className="h-4 w-4" /> Usually ready in a few minutes</div>
    </div></div>;
  }

  if (payload.status === 'retake_required') {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-5"><div className="max-w-xl rounded-[28px] border border-[#2C2622]/10 bg-white p-8 text-center sm:p-12">
      <RefreshCw className="mx-auto mb-5 h-8 w-8 text-[#B68C52]" /><div className="iconik-micro mb-4 text-[#B68C52]">One quick retake</div>
      <h1 className="iconik-display text-4xl text-[#2C2622]">Accuracy first.</h1><p className="mt-5 text-sm leading-6 text-[#2C2622]/62">{payload.retakeReason}</p>
      <Link href={`/style-scan?resume=${encodeURIComponent(token)}`} className="mt-8 inline-flex min-h-13 items-center gap-2 rounded-full bg-[#2C2622] px-7 text-sm text-white">Replace My Photos <ArrowRight className="h-4 w-4" /></Link>
    </div></div>;
  }

  const analysis = payload.analysis!;
  const scanParam = encodeURIComponent(token);
  return <div className="min-h-screen bg-[#F8F3E9] text-[#2C2622]">
    <header className="border-b border-[#2C2622]/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><span className="iconik-display tracking-[.3em]">I C O N I K</span><span className="iconik-micro text-[#2C2622]/45">Private result</span></div></header>
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">
      <section className="mx-auto max-w-3xl text-center"><div className="iconik-micro mb-5 text-[#B68C52]">YOUR PRELIMINARY STYLE SCAN</div><h1 className="iconik-display text-5xl leading-none sm:text-7xl">Your starting point, revealed.</h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#2C2622]/62">Preliminary Scan — your stylist confirms the analysis in your full report or consultation.</p></section>
      <div className="mt-12 grid gap-5">
        <section className="rounded-[28px] border border-[#2C2622]/10 bg-white p-7 sm:p-10"><div className="iconik-micro mb-5 text-[#B68C52]">01 · Your Geometry</div><h2 className="iconik-display text-3xl sm:text-5xl">{analysis.geometry.shape} · {analysis.geometry.verticalLine}</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-[#2C2622]/65">{analysis.geometry.interpretation}</p></section>
        <section className="rounded-[28px] bg-[#2C2622] p-7 text-white sm:p-10"><div className="iconik-micro mb-5 text-white/45">02 · Your Undertone</div><h2 className="iconik-display text-3xl sm:text-5xl">{analysis.undertone.direction} undertone · {analysis.undertone.depth} depth</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">{analysis.undertone.wardrobeConflict}</p></section>
        <section className="rounded-[28px] border border-[#2C2622]/10 bg-[#EFE7D8] p-7 sm:p-10"><div className="iconik-micro mb-6 text-[#B68C52]">03 · The 3 Don’ts</div><div className="grid gap-3 md:grid-cols-3">{analysis.donts.map(item => <article key={item.title} className="rounded-2xl bg-white p-6"><X className="mb-5 h-5 w-5 text-[#A34D3F]" /><h3 className="font-medium leading-6">{item.title}</h3><p className="mt-3 text-xs leading-6 text-[#2C2622]/60">{item.why}</p></article>)}</div></section>
        <section className="overflow-hidden rounded-[28px] border border-[#2C2622]/10 bg-white"><div className="grid md:grid-cols-2">{payload.visualUrl && <div className="relative min-h-[430px] bg-[#EFE7D8]"><Image src={payload.visualUrl} alt={analysis.do.title} fill unoptimized className="object-cover" /></div>}<div className="flex flex-col justify-center p-7 sm:p-10"><div className="iconik-micro mb-5 text-[#B68C52]">04 · The 1 Do</div><h2 className="iconik-display text-4xl">{analysis.do.title}</h2><p className="mt-5 text-sm leading-7 text-[#2C2622]/70">{analysis.do.formula}</p><div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F8F3E9] p-4 text-xs leading-6 text-[#2C2622]/60"><Check className="mt-1 h-4 w-4 shrink-0 text-[#66806B]" />{analysis.do.why}</div></div></div></section>
      </div>
      <section className="mt-12 rounded-[32px] bg-[#2C2622] p-7 text-white sm:p-12"><div className="mx-auto max-w-3xl text-center"><div className="iconik-micro mb-5 text-white/45">This scan found your starting point</div><h2 className="iconik-display text-4xl sm:text-6xl">Now build the wardrobe around it.</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65">Choose 10 ready-to-use outfit directions in a stylist-signed report, or build 20 consultation-led looks with revisions.</p></div><div className="mt-9 grid gap-4 md:grid-cols-2">
        <Link onClick={() => trackProductClick('instant_999')} href={`/instant-report?scan=${scanParam}`} className="group rounded-2xl bg-[#F8F3E9] p-7 text-[#2C2622]"><div className="iconik-micro mb-4 text-[#B68C52]">INSTANT REPORT · ₹999</div><h3 className="iconik-display text-3xl">10 complete visual outfits.</h3><p className="mt-3 text-xs leading-6 text-[#2C2622]/60">Stylist-signed · ready within 24 hours after your refinement.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">See the Instant Report <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>
        <Link onClick={() => trackProductClick('personal_2699')} href={`/offer-2699?scan=${scanParam}`} className="group rounded-2xl border border-white/18 p-7"><div className="iconik-micro mb-4 text-white/45">PERSONAL STYLIST · ₹2,699</div><h3 className="iconik-display text-3xl">20 outfits built with you.</h3><p className="mt-3 text-xs leading-6 text-white/60">30-minute consultation · personal stylist · revisions included.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">Meet Your Stylist <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>
      </div></section>
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#2C2622]/42"><ShieldCheck className="h-4 w-4" /> For your eyes only · private result link</div>
    </main>
  </div>;
}
