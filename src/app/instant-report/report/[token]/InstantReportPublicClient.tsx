'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import InstantReportDocument from '@/components/InstantReportDocument';
import type { InstantReportV1 } from '@/lib/styleScan';

interface Payload { order?: { paid: boolean; refinementComplete: boolean; dueAt?: string }; report?: { status: string; progress_stage?: string; report_data?: InstantReportV1; imageUrls?: Array<string | null>; error_message?: string } }

export default function InstantReportPublicClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<Payload | null>(null); const [error, setError] = useState(''); const running = useRef(false);
  const load = useCallback(async () => { const response = await fetch(`/api/instant-report/${encodeURIComponent(token)}/status`, { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load report.'); setPayload(data); return data as Payload; }, [token]);
  const process = useCallback(async () => { if (running.current) return; running.current = true; try { await fetch(`/api/instant-report/${encodeURIComponent(token)}/process`, { method: 'POST' }); await load(); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Generation is still running.'); } finally { running.current = false; } }, [load, token]);
  useEffect(() => { void load().then(data => { if (['queued','failed'].includes(data.report?.status || '')) void process(); }).catch(issue => setError(issue.message)); const timer = window.setInterval(() => void load().catch(() => undefined), 10000); return () => window.clearInterval(timer); }, [load, process]);
  useEffect(() => { if (['queued','failed'].includes(payload?.report?.status || '')) void process(); }, [payload?.report?.status, process]);
  if (payload?.report?.status === 'published' && payload.report.report_data) return <InstantReportDocument data={payload.report.report_data} imageUrls={payload.report.imageUrls || []} />;
  const stage = payload?.report?.status === 'review_required' ? 'Your report is complete and with the ICONIK Styling Team for its final check.' : payload?.report?.progress_stage === 'generating_outfit_visuals' ? 'Your ten outfit visuals are being created.' : 'Your personal report is being written.';
  return <div className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-5 text-[#2C2622]"><div className="max-w-xl text-center"><div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE7D8]"><Sparkles className="h-6 w-6 animate-pulse" /></div><div className="iconik-micro mb-4 text-[#B68C52]">ICONIK INSTANT REPORT</div><h1 className="iconik-display text-4xl sm:text-6xl">Your wardrobe system is in production.</h1><p className="mt-5 text-sm leading-7 text-[#2C2622]/62">{stage}</p><div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-[#2C2622]/45"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Due within 24 hours of refinement</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Human approval required</span></div>{error && <div className="mt-6 text-xs text-red-700">{error} <button onClick={() => void process()} className="ml-2 inline-flex items-center gap-1 underline"><RefreshCw className="h-3 w-3" /> Retry</button></div>}</div></div>;
}
