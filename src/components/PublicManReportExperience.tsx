'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode, type TouchEvent } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import ManReport, {
  getManReportChapters,
  getManReportSlideMeta,
  type ManReportChapter,
  type ManReportSlideMeta,
} from '@/components/ManReport';
import ManEditPanel from '@/components/ManEditPanel';
import ManReportOpeningSequence from '@/components/ManReportOpeningSequence';
import ManReportMobileV2 from '@/components/ManReportMobileV2';
import ManReportCinematicPrototype from '@/components/ManReportCinematicPrototype';

type ManReportProps = ComponentProps<typeof ManReport>;

interface PublicManReportExperienceProps {
  shareToken: string;
  data: ManReportProps['data'];
  imageUrls: ManReportProps['imageUrls'];
  shopping: ManReportProps['shopping'];
  /** Escape hatch: `?view=deck` restores the previous slide-deck experience on mobile. */
  forceDeck?: boolean;
  /** Temporary support route for comparing the retired mobile scroll experience. */
  forceLegacyMobile?: boolean;
  /** Reversible prototype of the scroll-directed report experience. */
  cinematic?: boolean;
  /** `?experience=v2` — the rebuilt mobile Blueprint (Reveal + Reference). */
  mobileV2?: boolean;
  /** True only after the report has been approved or sent. */
  stylistReviewed?: boolean;
}

const MOBILE_QUERY = '(max-width: 900px)';
const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,summary,label,[role="button"],[role="slider"],[contenteditable="true"]';

const INK = '#1B1815';
const INK_DEEP = '#16130F';
const IVORY = '#F4EFE5';
const BRASS = '#C89B62';

const POSITION_STORAGE_PREFIX = 'iconik-man-report-pos:';

interface StoredPosition {
  approvalKey: string;
  pageNumber: number;
  title: string;
  ts: number;
}

export default function PublicManReportExperience({
  shareToken,
  data,
  imageUrls,
  shopping,
  forceDeck = false,
  forceLegacyMobile = false,
  cinematic = false,
  mobileV2 = false,
  stylistReviewed = false,
}: PublicManReportExperienceProps) {
  const [{ isMobile, viewportReady }, setViewport] = useState({
    isMobile: false,
    viewportReady: false,
  });

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const sync = () => setViewport({ isMobile: query.matches, viewportReady: true });
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // The explicit prototype route can still force V2 at any width for review.
  if (mobileV2) {
    return <ManReportMobileV2 shareToken={shareToken} data={data} imageUrls={imageUrls} stylistReviewed={stylistReviewed} />;
  }

  // Reveal + Reference is now the primary phone/tablet product. The legacy
  // deck and scroll views remain available as explicit comparison routes.
  if (isMobile && !cinematic && !forceDeck && !forceLegacyMobile) {
    return <ManReportMobileV2 shareToken={shareToken} data={data} imageUrls={imageUrls} stylistReviewed={stylistReviewed} />;
  }

  if (!viewportReady) {
    return (
      <>
        <div className="public-report-initial-shell" aria-label="Preparing your report">
          <span>I C O N I K</span>
          <i />
          <small>Preparing your Blueprint</small>
        </div>
        <style jsx global>{`
          .public-report-initial-shell {
            height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #1B1815;
            color: #F4EFE5;
          }
          .public-report-initial-shell span { font-family: var(--font-fraunces), serif; font-size: 22px; letter-spacing: 0.28em; }
          .public-report-initial-shell i { width: 42px; height: 1px; background: rgba(244,239,229,0.42); }
          .public-report-initial-shell small { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.62; }
        `}</style>
      </>
    );
  }

  let reportExperience: ReactNode;

  if (cinematic) {
    reportExperience = <ManReportCinematicPrototype data={data} imageUrls={imageUrls} />;
  } else if (!isMobile) {
    reportExperience = (
      <>
        <ManReport data={data} imageUrls={imageUrls} viewerMode="public" motionMode="standard" deferSections shopping={shopping} />
        <DeferredManEditPanel shareToken={shareToken} reportData={data} />
        <ConfidentialityFootnote />
      </>
    );
  } else if (forceDeck) {
    reportExperience = <MobileDeckExperience shareToken={shareToken} data={data} imageUrls={imageUrls} shopping={shopping} />;
  } else {
    reportExperience = <MobileScrollExperience shareToken={shareToken} data={data} imageUrls={imageUrls} shopping={shopping} />;
  }

  return (
    <ManReportOpeningSequence
      shareToken={shareToken}
      classification={data.classification}
      imageUrls={imageUrls}
      stylistReviewed={stylistReviewed}
    >
      {reportExperience}
    </ManReportOpeningSequence>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile scroll experience — one continuous vertical read with a
// sticky chapter nav, contents sheet, resume chip, and a recap
// that flows into Iconik Edit.
// ─────────────────────────────────────────────────────────────

function MobileScrollExperience({ shareToken, data, imageUrls, shopping }: Omit<PublicManReportExperienceProps, 'forceDeck'>) {
  const slides = useMemo(() => getManReportSlideMeta(data), [data]);
  const chapters = useMemo(() => getManReportChapters(slides), [slides]);
  const totalSlides = slides.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteracted = useRef(false);

  const [activePage, setActivePage] = useState(1);
  const [tocState, setTocState] = useState<'closed' | 'open' | 'closing'>('closed');
  const [resume, setResume] = useState<ManReportSlideMeta | null>(null);

  const activeSlide = slides.find(slide => slide.pageNumber === activePage) ?? slides[0];
  const activeChapter = chapters.find(chapter => chapter.slides.some(slide => slide.pageNumber === activePage)) ?? chapters[0];

  // ── Track which page is crossing the upper-middle of the viewport ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const page = Number(entry.target.getAttribute('data-blueprint-page-number'));
        if (Number.isFinite(page) && page > 0) setActivePage(page);
      }
    }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const observeAll = () => {
      io.disconnect();
      container.querySelectorAll('[data-blueprint-page-number]').forEach(el => io.observe(el));
    };
    observeAll();

    // Deferred sections replace their placeholder DOM node when they mount,
    // so re-collect observer targets whenever the tree changes.
    const mo = new MutationObserver(() => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(observeAll, 180);
    });
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      io.disconnect();
      mo.disconnect();
    };
  }, [slides]);

  const cancelPendingJump = useCallback(() => {
    if (jumpTimer.current) {
      clearTimeout(jumpTimer.current);
      jumpTimer.current = null;
    }
  }, []);

  // Jump to a page. Lazy sections above the target keep settling their real
  // heights after they mount, so re-align in short corrective passes until
  // the target sits flush under the nav (or the user takes over).
  const jumpToPage = useCallback((pageNumber: number) => {
    const container = containerRef.current;
    if (!container) return;
    cancelPendingJump();
    let attempts = 0;

    const attempt = () => {
      jumpTimer.current = null;
      attempts += 1;
      const navHeight = navRef.current?.offsetHeight ?? 60;
      const el = container.querySelector<HTMLElement>(`[data-blueprint-page-number="${pageNumber}"]`);
      if (el) {
        const offset = el.getBoundingClientRect().top - navHeight;
        if (Math.abs(offset) < 3) return; // settled
        window.scrollTo({ top: Math.max(window.scrollY + offset, 0), behavior: 'instant' as ScrollBehavior });
        if (attempts < 10) jumpTimer.current = setTimeout(attempt, 150);
      } else {
        // Target lives inside a deferred section that hasn't mounted yet —
        // scroll to the closest preceding page to trigger mounting, then retry.
        const nodes = [...container.querySelectorAll<HTMLElement>('[data-blueprint-page-number]')];
        const preceding = nodes.filter(node => Number(node.getAttribute('data-blueprint-page-number')) < pageNumber).pop();
        preceding?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'end' });
        if (attempts < 10) jumpTimer.current = setTimeout(attempt, 180);
      }
    };
    attempt();
  }, [cancelPendingJump]);

  // The user touching the page takes priority over any pending corrective pass.
  useEffect(() => {
    const onUserScrollIntent = () => {
      hasInteracted.current = true;
      cancelPendingJump();
    };
    window.addEventListener('touchstart', onUserScrollIntent, { passive: true });
    window.addEventListener('wheel', onUserScrollIntent, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onUserScrollIntent);
      window.removeEventListener('wheel', onUserScrollIntent);
      cancelPendingJump();
    };
  }, [cancelPendingJump]);

  // ── Restore position: URL hash wins, then saved progress as a chip ──
  useEffect(() => {
    const hashMatch = window.location.hash.match(/^#p(\d+)$/);
    if (hashMatch) {
      const page = Number(hashMatch[1]);
      if (page > 1 && page <= totalSlides) {
        requestAnimationFrame(() => jumpToPage(page));
      }
      return;
    }
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_PREFIX + shareToken);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredPosition;
      const slide = slides.find(item => item.approvalKey === stored.approvalKey)
        ?? slides.find(item => item.pageNumber === stored.pageNumber);
      if (slide && slide.pageNumber >= 3) setResume(slide);
    } catch {
      // Corrupted or unavailable storage — start from the top.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save position + keep the URL hash shareable ──
  useEffect(() => {
    if (!hasInteracted.current) return;
    const slide = slides.find(item => item.pageNumber === activePage);
    if (!slide) return;
    try {
      const stored: StoredPosition = { approvalKey: slide.approvalKey, pageNumber: slide.pageNumber, title: slide.title, ts: Date.now() };
      localStorage.setItem(POSITION_STORAGE_PREFIX + shareToken, JSON.stringify(stored));
    } catch {
      // Storage unavailable — resume just won't work.
    }
    const { pathname, search } = window.location;
    history.replaceState(null, '', activePage > 1 ? `#p${activePage}` : pathname + search);
  }, [activePage, slides, shareToken]);

  // Once the reader is past the opening on their own, the chip has done its job.
  useEffect(() => {
    if (resume && activePage >= 3) setResume(null);
  }, [activePage, resume]);

  // ── Contents sheet open/close (with exit animation + scroll lock) ──
  const openToc = useCallback(() => setTocState('open'), []);
  const closeToc = useCallback(() => {
    setTocState('closing');
    window.setTimeout(() => setTocState(current => (current === 'closing' ? 'closed' : current)), 240);
  }, []);

  useEffect(() => {
    if (tocState === 'closed') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [tocState]);

  const onTocSelect = useCallback((pageNumber: number) => {
    hasInteracted.current = true;
    jumpToPage(pageNumber);
    closeToc();
  }, [closeToc, jumpToPage]);

  return (
    <div ref={containerRef} className="man-scroll-shell">
      <header ref={navRef} className="man-scroll-nav">
        <button type="button" className="man-scroll-nav-main" onClick={openToc} aria-label="Open report contents">
          <span className="man-scroll-nav-mark" aria-hidden="true">I</span>
          <span className="man-scroll-nav-meta" key={activeSlide?.pageNumber}>
            <span className="man-scroll-nav-chapter">{activeChapter?.label}</span>
            <span className="man-scroll-nav-title">{activeSlide?.title}</span>
          </span>
          <span className="man-scroll-nav-count">
            {String(activePage).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            <ChevronDown size={13} strokeWidth={2.4} />
          </span>
        </button>
        <div
          className="man-scroll-nav-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSlides}
          aria-valuenow={activePage}
          aria-label={`Slide ${activePage} of ${totalSlides}`}
        >
          {chapters.map((chapter, index) => {
            const done = chapter.slides.filter(slide => slide.pageNumber <= activePage).length;
            return (
              <i key={`${chapter.id}-${index}`} style={{ flexGrow: chapter.slides.length }}>
                <b style={{ width: `${(done / chapter.slides.length) * 100}%` }} />
              </i>
            );
          })}
        </div>
      </header>

      <ManReport
        data={data}
        imageUrls={imageUrls}
        viewerMode="public"
        motionMode="reduced"
        deferSections
        suppressStickyHeader
        chapterMarkers
        shopping={shopping}
      />

      <RecapBand data={data} onBrowse={openToc} />
      <DeferredManEditPanel shareToken={shareToken} reportData={data} />
      <ConfidentialityFootnote />

      {resume && (
        <div className="man-scroll-resume">
          <button
            type="button"
            className="man-scroll-resume-main"
            onClick={() => { hasInteracted.current = true; setResume(null); jumpToPage(resume.pageNumber); }}
          >
            <span className="man-scroll-resume-kicker">Continue where you left off</span>
            <span className="man-scroll-resume-title">{String(resume.pageNumber).padStart(2, '0')} · {resume.title}</span>
          </button>
          <button type="button" className="man-scroll-resume-dismiss" onClick={() => setResume(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {tocState !== 'closed' && (
        <TocSheet
          chapters={chapters}
          activePage={activePage}
          closing={tocState === 'closing'}
          onClose={closeToc}
          onSelect={onTocSelect}
        />
      )}

      <style jsx global>{`
        .man-scroll-shell {
          min-height: 100dvh;
          background: ${INK};
        }
        .man-scroll-shell .man-report [data-blueprint-page-number] {
          scroll-margin-top: 64px;
        }
        /* Skip layout + paint for far-offscreen pages; 'auto' remembers the
           real height once a page has rendered, keeping the scrollbar stable. */
        .man-scroll-shell .iconik-page-frame,
        .man-scroll-shell .man-outfit-slide {
          content-visibility: auto;
          contain-intrinsic-size: auto 820px;
        }

        /* ── Sticky nav ─────────────────────────────────────── */
        .man-scroll-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          padding: calc(6px + env(safe-area-inset-top)) 14px 0;
          background: rgba(22, 19, 16, 0.9);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(244, 239, 229, 0.1);
          color: ${IVORY};
        }
        .man-scroll-nav-main {
          width: 100%;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 11px;
          padding: 6px 2px 9px;
          text-align: left;
          color: inherit;
        }
        .man-scroll-nav-mark {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(244, 239, 229, 0.28);
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-style: italic;
          font-size: 15px;
          line-height: 1;
        }
        .man-scroll-nav-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          animation: manNavMetaIn 220ms ease;
        }
        .man-scroll-nav-chapter {
          font-size: 9px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: ${BRASS};
        }
        .man-scroll-nav-title {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-size: 15px;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .man-scroll-nav-count {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          opacity: 0.72;
          white-space: nowrap;
        }
        .man-scroll-nav-progress {
          display: flex;
          gap: 3px;
          padding-bottom: 8px;
        }
        .man-scroll-nav-progress i {
          display: block;
          flex-basis: 0;
          height: 2px;
          border-radius: 99px;
          background: rgba(244, 239, 229, 0.16);
          overflow: hidden;
        }
        .man-scroll-nav-progress b {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: ${IVORY};
          transition: width 240ms ease;
        }
        @keyframes manNavMetaIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: none; }
        }

        /* ── Resume chip ────────────────────────────────────── */
        .man-scroll-resume {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(18px + env(safe-area-inset-bottom));
          z-index: 45;
          display: flex;
          align-items: center;
          max-width: calc(100vw - 32px);
          background: rgba(22, 19, 16, 0.94);
          border: 1px solid rgba(244, 239, 229, 0.2);
          border-radius: 999px;
          color: ${IVORY};
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: manResumeIn 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .man-scroll-resume-main {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
          padding: 9px 4px 10px 18px;
          text-align: left;
          color: inherit;
        }
        .man-scroll-resume-kicker {
          font-size: 8px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: ${BRASS};
        }
        .man-scroll-resume-title {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-size: 14px;
          max-width: 62vw;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .man-scroll-resume-dismiss {
          flex-shrink: 0;
          padding: 12px 14px 12px 10px;
          color: rgba(244, 239, 229, 0.6);
        }
        @keyframes manResumeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(14px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Contents sheet ─────────────────────────────────── */
        .man-toc-root {
          position: fixed;
          inset: 0;
          z-index: 60;
        }
        .man-toc-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(12, 10, 8, 0.55);
          animation: manTocFade 200ms ease-out;
        }
        .man-toc-sheet {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          max-height: 80dvh;
          display: flex;
          flex-direction: column;
          background: ${INK_DEEP};
          color: ${IVORY};
          border-radius: 22px 22px 0 0;
          border-top: 1px solid rgba(244, 239, 229, 0.14);
          padding-bottom: env(safe-area-inset-bottom);
          animation: manTocUp 300ms cubic-bezier(0.32, 0.72, 0, 1);
        }
        .man-toc-root.closing .man-toc-sheet { animation: manTocDown 220ms ease-in forwards; }
        .man-toc-root.closing .man-toc-backdrop { animation: manTocFadeOut 220ms ease-in forwards; }
        .man-toc-grip {
          width: 40px;
          height: 4px;
          border-radius: 99px;
          background: rgba(244, 239, 229, 0.22);
          margin: 10px auto 2px;
          flex-shrink: 0;
        }
        .man-toc-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 20px 10px;
          border-bottom: 1px solid rgba(244, 239, 229, 0.1);
          flex-shrink: 0;
        }
        .man-toc-heading {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-style: italic;
          font-size: 19px;
          margin: 0;
        }
        .man-toc-head button {
          padding: 8px;
          color: rgba(244, 239, 229, 0.65);
        }
        .man-toc-body {
          overflow-y: auto;
          padding: 6px 8px 18px;
          overscroll-behavior: contain;
        }
        .man-toc-chapter { padding: 12px 12px 4px; }
        .man-toc-chapter + .man-toc-chapter { border-top: 1px solid rgba(244, 239, 229, 0.07); }
        .man-toc-chapter-label {
          display: flex;
          gap: 8px;
          align-items: baseline;
          font-size: 9px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: ${BRASS};
          margin: 0 0 6px;
        }
        .man-toc-chapter-label span {
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          opacity: 0.7;
        }
        .man-toc-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          color: rgba(244, 239, 229, 0.78);
          text-align: left;
        }
        .man-toc-row.active {
          background: rgba(244, 239, 229, 0.08);
          color: ${IVORY};
        }
        .man-toc-row.active .man-toc-row-title::before {
          content: '';
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 99px;
          background: ${BRASS};
          margin-right: 8px;
          vertical-align: 2px;
        }
        .man-toc-row-title {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-size: 15px;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .man-toc-row-page {
          flex-shrink: 0;
          font-family: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          opacity: 0.5;
        }
        @keyframes manTocUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes manTocDown { to { transform: translateY(100%); } }
        @keyframes manTocFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes manTocFadeOut { to { opacity: 0; } }

        /* ── Recap band ─────────────────────────────────────── */
        .man-scroll-recap {
          padding: 26px 24px 72px;
          text-align: center;
          color: ${IVORY};
          background: ${INK};
        }
        .man-scroll-recap-kicker {
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${BRASS};
          margin: 0;
        }
        .man-scroll-recap-title {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-style: italic;
          font-size: clamp(30px, 9vw, 44px);
          line-height: 1.02;
          margin: 12px 0 0;
        }
        .man-scroll-recap-palette {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 26px;
        }
        .man-scroll-recap-palette i {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          border: 1px solid rgba(244, 239, 229, 0.25);
        }
        .man-scroll-recap-facts {
          display: grid;
          gap: 10px;
          margin: 28px auto 0;
          max-width: 420px;
          text-align: left;
        }
        .man-scroll-recap-facts > div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(244, 239, 229, 0.12);
          padding-bottom: 9px;
        }
        .man-scroll-recap-facts span {
          flex-shrink: 0;
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .man-scroll-recap-facts strong {
          font-family: var(--font-fraunces), Fraunces, Georgia, serif;
          font-weight: 400;
          font-size: 16px;
          line-height: 1.3;
          text-align: right;
        }
        .man-scroll-recap-browse {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 34px;
          padding: 11px 22px;
          border: 1px solid rgba(244, 239, 229, 0.28);
          border-radius: 999px;
          color: ${IVORY};
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        @media (prefers-reduced-motion: reduce) {
          .man-scroll-nav-progress b { transition: none; }
          .man-scroll-nav-meta,
          .man-scroll-resume,
          .man-toc-sheet,
          .man-toc-backdrop,
          .man-toc-root.closing .man-toc-sheet,
          .man-toc-root.closing .man-toc-backdrop { animation: none; }
        }
      `}</style>
    </div>
  );
}

function TocSheet({
  chapters,
  activePage,
  closing,
  onClose,
  onSelect,
}: {
  chapters: ManReportChapter[];
  activePage: number;
  closing: boolean;
  onClose: () => void;
  onSelect: (pageNumber: number) => void;
}) {
  return (
    <div className={`man-toc-root${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label="Report contents">
      <div className="man-toc-backdrop" onClick={onClose} />
      <div className="man-toc-sheet">
        <div className="man-toc-grip" aria-hidden="true" />
        <div className="man-toc-head">
          <p className="man-toc-heading">Contents</p>
          <button type="button" onClick={onClose} aria-label="Close contents">
            <X size={16} />
          </button>
        </div>
        <div className="man-toc-body">
          {chapters.map((chapter, chapterIndex) => (
            <section key={`${chapter.id}-${chapterIndex}`} className="man-toc-chapter">
              <p className="man-toc-chapter-label">
                <span>{String(chapterIndex + 1).padStart(2, '0')}</span> {chapter.label}
              </p>
              {chapter.slides.map(slide => (
                <button
                  key={`${slide.approvalKey}-${slide.pageNumber}`}
                  type="button"
                  className={`man-toc-row${slide.pageNumber === activePage ? ' active' : ''}`}
                  onClick={() => onSelect(slide.pageNumber)}
                >
                  <span className="man-toc-row-title">{slide.title}</span>
                  <span className="man-toc-row-page">{String(slide.pageNumber).padStart(2, '0')}</span>
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// A closing beat after the last page: the blueprint in one glance.
// When Iconik Edit is active for this report, its panel renders below.
function RecapBand({ data, onBrowse }: { data: ManReportProps['data']; onBrowse: () => void }) {
  const cls = data.classification;
  const palette = (cls.colour.primary_palette ?? []).slice(0, 5);
  const facts = [
    { label: 'Build', value: cls.body.silhouette_type },
    { label: 'Season', value: cls.colour.season },
    { label: 'Directive', value: cls.body.fit_directive },
  ].filter(fact => fact.value);

  return (
    <section className="man-scroll-recap">
      <p className="man-scroll-recap-kicker">Blueprint complete</p>
      <p className="man-scroll-recap-title">Wear it into the world.</p>
      {palette.length > 0 && (
        <div className="man-scroll-recap-palette" aria-label="Your primary palette">
          {palette.map((colour, index) => (
            <i key={`${colour.name}-${index}`} style={{ background: colour.hex }} title={colour.name} />
          ))}
        </div>
      )}
      {facts.length > 0 && (
        <div className="man-scroll-recap-facts">
          {facts.map(fact => (
            <div key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="man-scroll-recap-browse" onClick={onBrowse}>
        Revisit a chapter
      </button>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Legacy mobile deck — kept behind `?view=deck` while the scroll
// experience bakes; delete once it has proven itself.
// ─────────────────────────────────────────────────────────────

function MobileDeckExperience({ shareToken, data, imageUrls, shopping }: Omit<PublicManReportExperienceProps, 'forceDeck'>) {
  const slides = useMemo(() => getManReportSlideMeta(data), [data]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback((nextIndex: number) => {
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    setActiveIndex(bounded);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  }, [slides.length]);

  useEffect(() => {
    if (finished) return;
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
  }, [activeIndex, finished, goTo, slides.length]);

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

function DeferredManEditPanel({
  shareToken,
  reportData,
}: {
  shareToken: string;
  reportData: ManReportProps['data'];
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || ready) return;
    if (!('IntersectionObserver' in window)) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: '1000px 0px' });

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div ref={anchorRef} style={{ minHeight: 1 }}>
      {ready && <ManEditPanel shareToken={shareToken} reportData={reportData} />}
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
