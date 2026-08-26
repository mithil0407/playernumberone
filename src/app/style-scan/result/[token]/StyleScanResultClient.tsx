'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock3, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import type { StyleScanAnalysisV1, StyleScanStatus } from '@/lib/styleScan';

interface StatusPayload {
  status: StyleScanStatus;
  analysis: StyleScanAnalysisV1 | null;
  visualUrl: string | null;
  retakeReason?: string | null;
}
type TrackingWindow = Window & { fbq?: (command: string, event: string, details: Record<string, string>) => void };

function trackProductClick() {
  if (typeof window !== 'undefined') (window as TrackingWindow).fbq?.('trackCustom', 'style_scan_cta_clicked', { product: 'personal_2699' });
}

const stageCopy: Partial<Record<StyleScanStatus, string>> = {
  submitted: 'Saving your photos', analyzing: 'Finding your main style blocker', generating_visual: 'Finishing your result', failed: 'Getting ready to try again',
};

export default function StyleScanResultClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [error, setError] = useState('');
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

  if (!payload || !['ready', 'retake_required'].includes(payload.status)) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-5 text-[#2C2622]"><div className="w-full max-w-xl text-center">
      <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEE5D5]"><Sparkles className="h-6 w-6 animate-pulse" /></div>
      <div className="iconik-micro mb-4 text-[#B68C52]">ICONIK STYLE SCAN</div>
      <h1 className="iconik-display text-4xl sm:text-6xl">We’re finding the main problem.</h1>
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
  const plain = analysis.plain;
  const lowConfidence = analysis.confidence.overall < 0.65;
  const reveal = (index: number) => ({ animation: 'iconikFadeUp .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${index * 140}ms` });
  return <div className="min-h-screen bg-[#F8F3E9] text-[#2C2622]">
    <style>{`@keyframes iconikFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}`}</style>
    <header className="border-b border-[#2C2622]/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><span className="iconik-display tracking-[.3em]">I C O N I K</span><span className="iconik-micro text-[#2C2622]/45">Private result</span></div></header>
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
      <section className="mx-auto max-w-3xl text-center" style={reveal(0)}><div className="iconik-micro mb-4 text-[#B68C52] sm:mb-5">YOUR STYLE BLOCKER SCAN</div><h1 className="iconik-display text-[42px] leading-[.98] sm:text-7xl sm:leading-none">{analysis.firstName ? `${analysis.firstName}, we found the main problem.` : 'We found the main problem.'}</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#2C2622]/62 sm:mt-5">This is your starting point. Your stylist confirms the details and builds the solution.</p></section>
      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5">
        <section className="rounded-[22px] border border-[#2C2622]/10 bg-white p-5 sm:rounded-[28px] sm:p-10" style={reveal(1)}><div className="iconik-micro mb-4 text-[#B68C52] sm:mb-5">01 · YOUR MAIN STYLE BLOCKER</div><h2 className="iconik-display text-[32px] leading-tight sm:text-5xl">Your outfits need a clearer balance.</h2><p className="mt-4 max-w-3xl text-sm leading-6 text-[#2C2622]/65 sm:mt-5 sm:leading-7">{plain?.geometry?.body || 'The clothes may fit on their own, but the full outfit is not working as one clear look.'}</p><div className="mt-5 inline-flex items-start gap-3 rounded-2xl bg-[#F8F3E9] px-4 py-4 text-xs font-medium leading-5 sm:mt-6 sm:px-5 sm:text-sm sm:leading-6"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#66806B]" />Nothing is wrong with your body. The clothes need to work together more clearly.</div>{lowConfidence && <p className="mt-5 text-xs leading-6 text-[#2C2622]/45">Your result is close between two patterns. Your stylist will confirm this with you.</p>}</section>
        <section className="rounded-[22px] bg-[#2C2622] p-5 text-white sm:rounded-[28px] sm:p-10" style={reveal(2)}><div className="iconik-micro mb-4 text-white/45 sm:mb-5">02 · WHAT WE ALSO NOTICED</div><h2 className="iconik-display text-[32px] leading-tight sm:text-5xl">Colour may be adding to the problem.</h2><p className="mt-4 max-w-3xl text-sm leading-6 text-white/68 sm:mt-5 sm:leading-7">Some colours close to your face may make an outfit feel dull, even when the clothes fit well. Your full colour plan needs a closer check from your stylist.</p></section>
        <section className="rounded-[22px] border border-[#2C2622]/10 bg-[#EFE7D8] p-5 sm:rounded-[28px] sm:p-10" style={reveal(3)}><div className="iconik-micro mb-5 text-[#B68C52] sm:mb-6">03 · WHY IT KEEPS HAPPENING</div><div className="grid gap-3 md:grid-cols-3">{[
          ['Good pieces do not always make a good outfit', 'Each item may look fine alone. The problem starts when the full outfit has no clear focus.'],
          ['The eye is pulled in too many directions', 'Different lengths, shapes and details can fight for attention.'],
          ['Colour and shape are being solved separately', 'A good colour cannot fix the wrong outfit balance, and the reverse is also true.'],
        ].map(([title, copy], index) => <article key={title} className="rounded-2xl bg-white p-6"><span className="iconik-mono text-[9px] text-[#B68C52]">0{index + 1}</span><h3 className="mt-5 font-medium leading-6">{title}</h3><p className="mt-3 text-xs leading-6 text-[#2C2622]/60">{copy}</p></article>)}</div></section>
        <section className="rounded-[22px] border border-[#B68C52]/25 bg-white p-5 sm:rounded-[28px] sm:p-10" style={reveal(4)}><div className="iconik-micro mb-5 text-[#B68C52] sm:mb-6">WHAT THIS FREE SCAN DOES NOT DO</div><h2 className="iconik-display text-[32px] leading-tight sm:text-5xl">The scan finds the problem. It does not build the wardrobe.</h2><div className="mt-5 grid gap-2.5 sm:mt-7 sm:gap-3 md:grid-cols-3">{['Your exact colours and fit rules', 'The right lengths, necklines and fabrics', 'Complete outfits for your real life'].map(item => <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#F8F3E9] p-4 text-xs leading-5 sm:p-5 sm:text-sm sm:leading-6"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B68C52] sm:mt-1" />{item}</div>)}</div></section>
      </div>
      <section className="mt-8 rounded-[22px] bg-[#2C2622] p-5 text-white sm:mt-12 sm:rounded-[32px] sm:p-12" style={reveal(5)}><div className="mx-auto max-w-3xl text-center">
        {plain?.callback && <p className="iconik-display mx-auto mb-7 max-w-2xl text-xl italic leading-snug text-[#D9B98A] sm:text-2xl">“{plain.callback}”</p>}
        <div className="iconik-micro mb-4 text-white/45 sm:mb-5">THE SCAN FOUND THE PROBLEM</div><h2 className="iconik-display text-[36px] leading-tight sm:text-6xl">Now let your stylist build the fix.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:mt-5 sm:leading-7">Talk to your stylist for 30 minutes. Then get your personal colours, fit rules and 20 complete outfits. Revisions are included.</p>
        <Link onClick={trackProductClick} href={`/offer-2699?scan=${scanParam}`} className="group mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#F8F3E9] px-4 text-center text-xs font-semibold text-[#2C2622] sm:mt-9 sm:min-h-16 sm:w-auto sm:gap-4 sm:px-8 sm:text-sm">Build My Style Blueprint · ₹2,699 <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" /></Link>
      </div></section>
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#2C2622]/42"><ShieldCheck className="h-4 w-4" /> For your eyes only · private result link</div>
    </main>
  </div>;
}
