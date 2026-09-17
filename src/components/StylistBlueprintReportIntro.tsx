'use client';

import { useEffect, useRef, useState } from 'react';
import StylistBlueprintCoverLoader from '@/components/StylistBlueprintCoverLoader';

const MAX_WAIT_MS = 10_000;
const PARALLEL_DOWNLOADS = 6;

/**
 * Holds the cover-style loader over the report while its images download, so a
 * reader scrolls through pictures that are already there instead of empty
 * frames filling in. It lifts as soon as every image is ready, and after ten
 * seconds at most; anything still loading carries on in the background.
 */
export default function StylistBlueprintReportIntro({ clientName }: { clientName: string }) {
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'done'>('loading');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [canSkip, setCanSkip] = useState(false);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      root.style.overflow = previousOverflow;
      setPhase('leaving');
      window.setTimeout(() => setPhase('done'), 450);
    };
    finishRef.current = finish;

    // Page order, so the first pages a reader reaches are ready first.
    const sources = [...new Set(
      Array.from(document.querySelectorAll<HTMLImageElement>('.iconik-report img'))
        .map(image => image.getAttribute('src'))
        .filter((src): src is string => Boolean(src)),
    )];
    setProgress({ loaded: 0, total: sources.length });
    if (!sources.length) { finish(); return; }

    let loaded = 0;
    let active = 0;
    const queue = [...sources];
    const pump = () => {
      while (active < PARALLEL_DOWNLOADS && queue.length) {
        const image = new Image();
        image.decoding = 'async';
        active += 1;
        image.onload = image.onerror = () => {
          active -= 1;
          loaded += 1;
          setProgress({ loaded, total: sources.length });
          if (loaded === sources.length) finish();
          pump();
        };
        image.src = queue.shift()!;
      }
    };
    pump();

    const timeout = window.setTimeout(finish, MAX_WAIT_MS);
    const skip = window.setTimeout(() => setCanSkip(true), 3000);
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(skip);
      root.style.overflow = previousOverflow;
    };
  }, []);

  if (phase === 'done') return null;
  const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div
      className="bp-intro fixed inset-0 z-[100] overflow-hidden"
      style={{ opacity: phase === 'leaving' ? 0 : 1, transition: 'opacity 420ms ease', pointerEvents: phase === 'leaving' ? 'none' : 'auto' }}
      role="status"
      aria-live="polite"
      aria-busy={phase === 'loading'}
    >
      <noscript><style>{'.bp-intro{display:none!important}'}</style></noscript>
      <style>{'@media print{.bp-intro{display:none!important}}'}</style>
      <StylistBlueprintCoverLoader>
        <p className="mt-8 text-[clamp(30px,7vw,52px)] font-medium tracking-[-0.04em] leading-none">{clientName || 'Your Blueprint'}</p>
        <p className="mt-4 text-sm" style={{ opacity: 0.8 }}>Preparing your report</p>
        <div className="mx-auto mt-8 w-[min(70%,280px)]">
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(244,239,229,0.22)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(4, percent)}%`, background: '#F4EFE5', transition: 'width 300ms ease' }} />
          </div>
          <p className="mt-3 text-[11px] tracking-[0.14em] uppercase tabular-nums" style={{ opacity: 0.7 }}>
            {progress.total ? `Loading images · ${progress.loaded} of ${progress.total}` : 'Loading'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => finishRef.current()}
          className="mt-8 text-xs underline underline-offset-4 transition-opacity"
          style={{ opacity: canSkip ? 0.8 : 0, pointerEvents: canSkip ? 'auto' : 'none', color: '#F4EFE5' }}
          tabIndex={canSkip ? 0 : -1}
        >
          Open the report now
        </button>
      </StylistBlueprintCoverLoader>
    </div>
  );
}
