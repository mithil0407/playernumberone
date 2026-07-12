'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import ManReport, { getManReportSlideMeta } from '@/components/ManReport';
import ManEditPanel from '@/components/ManEditPanel';

type ManReportProps = ComponentProps<typeof ManReport>;

interface PublicManReportExperienceProps {
  shareToken: string;
  data: ManReportProps['data'];
  imageUrls: ManReportProps['imageUrls'];
  shopping: ManReportProps['shopping'];
}

const MOBILE_QUERY = '(max-width: 900px)';
const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,summary,label,[role="button"],[role="slider"],[contenteditable="true"]';

export default function PublicManReportExperience({ shareToken, data, imageUrls, shopping }: PublicManReportExperienceProps) {
  const slides = useMemo(() => getManReportSlideMeta(data), [data]);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(query.matches);
    sync();
    setViewportReady(true);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    setActiveIndex(bounded);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  }, [slides.length]);

  useEffect(() => {
    if (!isMobile || finished) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as Element | null)?.closest?.(INTERACTIVE_SELECTOR)) return;
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (event.key === 'ArrowRight') {
        if (activeIndex === slides.length - 1) setFinished(true);
        else goTo(activeIndex + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, finished, goTo, isMobile, slides.length]);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest(INTERACTIVE_SELECTOR)) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 54 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;
    if (deltaX > 0) goTo(activeIndex - 1);
    else if (activeIndex < slides.length - 1) goTo(activeIndex + 1);
    else setFinished(true);
  };

  if (!viewportReady) {
    return (
      <>
        <div className="public-report-initial-desktop">
          <ManReport data={data} imageUrls={imageUrls} viewerMode="public" motionMode="reduced" deferSections shopping={shopping} />
        </div>
        <div className="public-report-initial-mobile" aria-label="Preparing your report">
          <span>I C O N I K</span>
          <i />
          <small>Preparing your Blueprint</small>
        </div>
        <style jsx global>{`
          .public-report-initial-mobile { display: none; }
          @media (max-width: 900px) {
            .public-report-initial-desktop { display: none; }
            .public-report-initial-mobile {
              height: 100dvh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 16px;
              background: #1B1815;
              color: #F4EFE5;
            }
            .public-report-initial-mobile span { font-family: var(--font-fraunces), serif; font-size: 22px; letter-spacing: 0.28em; }
            .public-report-initial-mobile i { width: 42px; height: 1px; background: rgba(244,239,229,0.42); }
            .public-report-initial-mobile small { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.62; }
          }
        `}</style>
      </>
    );
  }

  if (!isMobile) {
    return (
      <>
        <ManReport data={data} imageUrls={imageUrls} viewerMode="public" motionMode="standard" deferSections shopping={shopping} />
        <ManEditPanel shareToken={shareToken} reportData={data} />
        <ConfidentialityFootnote />
      </>
    );
  }

  if (finished) {
    return (
      <div className="min-h-dvh" style={{ background: '#FBF8F4' }}>
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3 border-b" style={{ background: 'rgba(251,248,244,0.96)', borderColor: '#E6DAC5' }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#8C5621' }}>Blueprint complete</p>
            <p className="font-serif text-lg" style={{ color: '#1B1815' }}>Continue with Iconik Edit</p>
          </div>
          <button type="button" onClick={() => { setFinished(false); goTo(slides.length - 1); }} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs" style={{ border: '1px solid #E6DAC5', color: '#5A524A' }}>
            <RotateCcw size={13} /> Back to report
          </button>
        </div>
        <ManEditPanel shareToken={shareToken} reportData={data} />
        <ConfidentialityFootnote />
      </div>
    );
  }

  const activeSlide = slides[activeIndex];
  return (
    <div className="public-man-deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div ref={scrollRef} className="public-man-deck-scroll" key={activeSlide?.approvalKey}>
        <ManReport
          data={data}
          imageUrls={imageUrls}
          viewerMode="public"
          motionMode="reduced"
          deferSections={false}
          focusPageNumber={activeSlide?.pageNumber}
          shopping={shopping}
        />
      </div>
      <nav className="public-man-deck-nav" aria-label="Report slide navigation">
        <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous report slide">
          <ChevronLeft size={18} /> <span>Previous</span>
        </button>
        <div className="public-man-deck-progress" aria-live="polite">
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <i><b style={{ width: `${((activeIndex + 1) / Math.max(slides.length, 1)) * 100}%` }} /></i>
        </div>
        <button type="button" onClick={() => activeIndex === slides.length - 1 ? setFinished(true) : goTo(activeIndex + 1)} aria-label={activeIndex === slides.length - 1 ? 'Finish report' : 'Next report slide'}>
          <span>{activeIndex === slides.length - 1 ? 'Finish' : 'Next'}</span> <ChevronRight size={18} />
        </button>
      </nav>
      <style jsx global>{`
        .public-man-deck {
          height: 100dvh;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          overflow: hidden;
          background: #1B1815;
          overscroll-behavior: none;
          touch-action: pan-y;
        }
        .public-man-deck-scroll {
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior-y: contain;
          scrollbar-width: none;
          animation: publicManDeckIn 180ms ease-out;
        }
        .public-man-deck-scroll::-webkit-scrollbar { display: none; }
        .public-man-deck-scroll .man-report { min-height: 100%; }
        .public-man-deck-scroll .iconik-page-frame { margin-bottom: 0; }
        .public-man-deck-nav {
          z-index: 30;
          min-height: 66px;
          display: grid;
          grid-template-columns: minmax(88px, 1fr) minmax(92px, 1fr) minmax(88px, 1fr);
          align-items: center;
          gap: 8px;
          padding: 9px 12px calc(9px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255,255,255,0.12);
          background: rgba(27,24,21,0.97);
          color: #F4EFE5;
          backdrop-filter: blur(16px);
        }
        .public-man-deck-nav button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 999px;
          color: #F4EFE5;
          font-size: 12px;
          font-weight: 600;
        }
        .public-man-deck-nav button:last-child { background: #F4EFE5; color: #1B1815; }
        .public-man-deck-nav button:disabled { opacity: 0.28; }
        .public-man-deck-progress { display: flex; flex-direction: column; align-items: center; gap: 7px; font-family: var(--font-jetbrains-mono), monospace; font-size: 9px; letter-spacing: 0.12em; }
        .public-man-deck-progress i { width: 72px; height: 2px; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,0.18); }
        .public-man-deck-progress b { display: block; height: 100%; border-radius: inherit; background: #F4EFE5; transition: width 180ms ease; }
        @keyframes publicManDeckIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .public-man-deck-scroll { animation: none; }
          .public-man-deck-progress b { transition: none; }
        }
      `}</style>
    </div>
  );
}

function ConfidentialityFootnote() {
  return (
    <div className="px-5 md:px-12 py-6 text-center" style={{ background: '#FBF8F4' }}>
      <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#5A524A' }}>For your eyes only</p>
    </div>
  );
}
