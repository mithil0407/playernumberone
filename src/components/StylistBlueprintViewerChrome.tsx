'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Reader-side chrome for the shared report link: a read-progress line, a
 * floating "where am I" pill that opens a contents sheet, a scroll-reveal for
 * the pages after the cover, and a lightbox for the outfit and analysis
 * images. It renders nothing into the report itself — it only observes the
 * `[data-blueprint-page-number]` sections the report already emits — so the
 * editor and the print path are untouched.
 */

export type BlueprintOutlineEntry = {
  pageNumber: number;
  display: number;
  title: string;
  section: string;
  /** 1-based outfit number for the outfit pages, so the contents can show them as a grid. */
  outfitNumber?: number;
};

const INK = '#2C2622';
const IVORY = '#F4EFE5';
const PAPER = '#F8F3E9';
const GOLD = '#C9A96E';

const LIGHTBOX_MEDIA_SELECTOR = [
  '.flatlay-media img',
  '.transformation-media img',
  '.diagram-media img',
  '.secondary-strip img',
  '.axis-portrait img',
  '.visual-direction-media img',
  '.colour-drape-hero-frame img',
  '.rule-proof-media img',
  '.continuation-image img',
].join(', ');

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function pageElement(pageNumber: number) {
  return document.querySelector<HTMLElement>(`[data-blueprint-page-number="${pageNumber}"]`);
}

export default function StylistBlueprintViewerChrome({
  outline,
  clientName,
}: {
  outline: BlueprintOutlineEntry[];
  clientName: string;
}) {
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(outline[0]?.pageNumber ?? 1);
  const [pastCover, setPastCover] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const total = outline.length;
  const current = useMemo(() => outline.find(entry => entry.pageNumber === currentPage) ?? outline[0], [outline, currentPage]);
  const sections = useMemo(() => {
    const groups: Array<{ label: string; entries: BlueprintOutlineEntry[] }> = [];
    for (const entry of outline) {
      // The transformation preview carries its own corner label but sits
      // between the cover and the summary, so in the contents it is simply
      // part of the opening rather than a one-page section of its own.
      const label = entry.section === 'Three looks' ? 'Start here' : entry.section;
      const last = groups.at(-1);
      if (last && last.label === label) last.entries.push(entry);
      else groups.push({ label, entries: [entry] });
    }
    return groups;
  }, [outline]);

  // Read progress + "past the cover" — one passive scroll listener, coalesced
  // into a frame so a long fling on a phone does not re-render per event.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setPastCover(window.scrollY > window.innerHeight * 0.55);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Which page is under the reader, and the scroll-reveal for pages after the
  // cover. Both are IntersectionObservers on the same sections; the reveal
  // class is only ever added to the report once we are actually observing, so
  // a page cannot be hidden without something in place to show it again.
  useEffect(() => {
    const report = document.querySelector<HTMLElement>('.iconik-report');
    const pages = Array.from(document.querySelectorAll<HTMLElement>('.iconik-page[data-blueprint-page-number]'));
    if (!report || !pages.length || typeof IntersectionObserver === 'undefined') return;

    report.classList.add('iconik-report-interactive');

    const currentObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const pageNumber = Number((entry.target as HTMLElement).dataset.blueprintPageNumber);
        if (Number.isFinite(pageNumber)) setCurrentPage(pageNumber);
      }
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let revealObserver: IntersectionObserver | null = null;
    if (!reduceMotion) {
      // Anything already on screen is released before the hidden state is
      // applied, so the first paint never flashes.
      const viewportBottom = window.innerHeight;
      for (const page of pages) {
        const rect = page.getBoundingClientRect();
        if (rect.top < viewportBottom && rect.bottom > 0) page.classList.add('is-in-view');
      }
      revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in-view');
          revealObserver?.unobserve(entry.target);
        }
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
      report.classList.add('iconik-report-reveal');
    }

    for (const page of pages) {
      currentObserver.observe(page);
      revealObserver?.observe(page);
    }
    return () => {
      currentObserver.disconnect();
      revealObserver?.disconnect();
      report.classList.remove('iconik-report-reveal', 'iconik-report-interactive');
    };
  }, []);

  // Lightbox: one delegated listener on the report rather than a handler per
  // image, so it also covers images inside content-visibility: auto shells.
  useEffect(() => {
    const report = document.querySelector<HTMLElement>('.iconik-report');
    if (!report) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const image = target?.closest<HTMLImageElement>(LIGHTBOX_MEDIA_SELECTOR);
      if (!image || !image.currentSrc && !image.src) return;
      if (target?.closest('a, button, [contenteditable="true"]')) return;
      event.preventDefault();
      const page = image.closest<HTMLElement>('.iconik-page');
      const title = page?.querySelector('.corner-title')?.textContent?.trim() ?? '';
      const kicker = page?.querySelector('.figure-label, .transformation-label')?.textContent?.trim() ?? '';
      setLightbox({ src: image.currentSrc || image.src, caption: [title, kicker].filter(Boolean).join(' · ') });
    };
    report.addEventListener('click', onClick);
    return () => report.removeEventListener('click', onClick);
  }, []);

  // Escape closes whichever layer is open; the body stops scrolling under it.
  const anyOverlay = sheetOpen || Boolean(lightbox);
  useEffect(() => {
    if (!anyOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setLightbox(null);
      setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [anyOverlay]);

  useEffect(() => {
    if (sheetOpen) {
      window.setTimeout(() => sheetRef.current?.querySelector<HTMLElement>('[data-current="true"]')?.focus(), 30);
    } else {
      pillRef.current?.blur();
    }
  }, [sheetOpen]);

  const jumpTo = useCallback((pageNumber: number) => {
    setSheetOpen(false);
    const element = pageElement(pageNumber);
    if (!element) return;
    // Pages skipped over by the jump are released, so scrolling back up
    // afterwards does not replay a reveal for every one of them. The target
    // itself is left to the observer, so it settles in like any other page.
    for (const page of document.querySelectorAll<HTMLElement>('.iconik-page[data-blueprint-page-number]')) {
      if (page === element) break;
      page.classList.add('is-in-view');
    }
    // The distant pages sit in content-visibility: auto shells with an
    // estimated height, so a plain scrollIntoView lands where the page *was
    // thought* to be and then drifts, by thousands of pixels on a phone, as the
    // real pages around it are laid out. Rendering every shell once first
    // gives each its true size (which `contain-intrinsic-size: auto` then
    // remembers), so the jump lands exactly and later jumps stay exact.
    // The destination's images were lazy; start them now rather than after
    // the browser notices the page is on screen.
    for (const image of element.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) image.loading = 'eager';
    const shells = Array.from(document.querySelectorAll<HTMLElement>('.blueprint-deferred-shell'));
    for (const shell of shells) shell.style.contentVisibility = 'visible';
    void element.offsetTop; // force the full layout before scrolling
    // 'instant', not 'auto': the page sets scroll-behavior: smooth, and 'auto'
    // defers to it — a two-second glide across fifty pages that lands short.
    element.scrollIntoView({ behavior: 'instant', block: 'start' });
    // Two frames, not one: the remembered size is recorded when a frame is
    // actually rendered with the shells visible, and the first rAF callback
    // runs *before* that frame's rendering steps.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      for (const shell of shells) shell.style.contentVisibility = '';
      // A short settle pass in case anything still moved under the target.
      let tries = 0;
      const settle = () => {
        if (Math.abs(element.getBoundingClientRect().top) > 1) element.scrollIntoView({ behavior: 'instant', block: 'start' });
        if (tries++ < 20) window.requestAnimationFrame(settle);
      };
      settle();
      window.setTimeout(settle, 400);
    }));
  }, []);

  const backToTop = useCallback(() => {
    setSheetOpen(false);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Smooth only over a short distance: gliding back through fifty pages of
    // estimated-height shells takes seconds and drifts.
    const smooth = !reduceMotion && window.scrollY < window.innerHeight * 3;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const print = useCallback(() => {
    setSheetOpen(false);
    window.setTimeout(() => window.print(), 80);
  }, []);

  if (!total) return null;

  return (
    <>
      <style jsx global>{`
        .bpv-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          z-index: 60;
          background: linear-gradient(90deg, ${GOLD}, #E4D5BC);
          transform-origin: 0 50%;
          transform: scaleX(var(--bpv-progress, 0));
          transition: transform 120ms linear;
          pointer-events: none;
        }
        .bpv-pill {
          position: fixed;
          left: 50%;
          bottom: calc(18px + env(safe-area-inset-bottom));
          z-index: 55;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          max-width: calc(100vw - 32px);
          padding: 10px 12px 10px 16px;
          border-radius: 999px;
          border: 1px solid rgba(244, 239, 229, 0.16);
          background: rgba(44, 38, 34, 0.84);
          color: ${IVORY};
          box-shadow: 0 18px 44px rgba(20, 16, 14, 0.35);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          transform: translate(-50%, 0);
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1), opacity 360ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .bpv-pill[data-hidden="true"] {
          transform: translate(-50%, 140%);
          opacity: 0;
          pointer-events: none;
        }
        .bpv-pill:focus-visible {
          outline: 2px solid ${GOLD};
          outline-offset: 3px;
        }
        .bpv-pill-where {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }
        .bpv-pill-section {
          opacity: 0.62;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bpv-pill-count {
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .bpv-pill-divider {
          width: 1px;
          height: 16px;
          background: rgba(244, 239, 229, 0.22);
        }
        .bpv-pill-action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          margin: -6px -4px -6px 0;
          border-radius: 999px;
          background: rgba(244, 239, 229, 0.1);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .bpv-pill-action svg {
          width: 12px;
          height: 12px;
        }
        .bpv-scrim {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(20, 16, 14, 0.58);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: bpv-fade 220ms ease-out both;
        }
        @keyframes bpv-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bpv-sheet-up {
          from { transform: translate3d(0, 28px, 0); opacity: 0; }
          to { transform: none; opacity: 1; }
        }
        .bpv-sheet {
          width: 100%;
          max-width: 560px;
          max-height: min(84dvh, 760px);
          display: flex;
          flex-direction: column;
          background: ${PAPER};
          color: ${INK};
          border-radius: 26px 26px 0 0;
          box-shadow: 0 -20px 70px rgba(20, 16, 14, 0.35);
          font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
          animation: bpv-sheet-up 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
          overflow: hidden;
        }
        @media (min-width: 700px) {
          .bpv-scrim { align-items: center; padding: 24px; }
          .bpv-sheet { border-radius: 26px; max-height: min(80vh, 760px); }
        }
        .bpv-sheet-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 14px 26px;
        }
        .bpv-sheet-head .bpv-micro {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.5;
        }
        .bpv-sheet-head h2 {
          margin: 6px 0 0;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .bpv-close {
          flex: none;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(44, 38, 34, 0.14);
          background: transparent;
          color: ${INK};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bpv-close svg { width: 14px; height: 14px; }
        .bpv-close:hover { background: rgba(44, 38, 34, 0.06); }
        .bpv-sheet-body {
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 4px 14px 14px;
          -webkit-overflow-scrolling: touch;
        }
        .bpv-section {
          padding: 12px 12px 6px;
        }
        .bpv-section + .bpv-section {
          border-top: 1px solid rgba(44, 38, 34, 0.08);
        }
        .bpv-section-label {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.5;
          margin-bottom: 6px;
          padding: 0 8px;
        }
        .bpv-entry {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 10px 8px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: background 140ms ease;
        }
        .bpv-entry:hover, .bpv-entry:focus-visible {
          background: rgba(44, 38, 34, 0.06);
          outline: none;
        }
        .bpv-entry[data-current="true"] {
          background: ${INK};
          color: ${IVORY};
        }
        .bpv-entry-number {
          flex: none;
          width: 26px;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          opacity: 0.5;
          letter-spacing: 0.06em;
        }
        .bpv-entry-title {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bpv-outfit-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px;
          padding: 2px 8px 6px;
        }
        .bpv-outfit {
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(44, 38, 34, 0.12);
          background: rgba(255, 255, 255, 0.5);
          color: inherit;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease;
        }
        .bpv-outfit:hover, .bpv-outfit:focus-visible {
          background: rgba(44, 38, 34, 0.08);
          outline: none;
        }
        .bpv-outfit[data-current="true"] {
          background: ${INK};
          border-color: ${INK};
          color: ${IVORY};
        }
        .bpv-sheet-foot {
          display: flex;
          gap: 8px;
          padding: 12px 18px calc(16px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(44, 38, 34, 0.08);
          background: ${PAPER};
        }
        .bpv-foot-button {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(44, 38, 34, 0.14);
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 140ms ease;
        }
        .bpv-foot-button:hover { background: rgba(44, 38, 34, 0.06); }
        .bpv-foot-button svg { width: 14px; height: 14px; }
        .bpv-lightbox {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom));
          background: rgba(20, 16, 14, 0.92);
          cursor: zoom-out;
          animation: bpv-fade 200ms ease-out both;
        }
        .bpv-lightbox img {
          max-width: 100%;
          max-height: calc(100% - 44px);
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 14px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5);
          animation: bpv-sheet-up 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .bpv-lightbox-caption {
          margin-top: 16px;
          color: ${IVORY};
          font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.6;
          text-align: center;
        }
        .bpv-lightbox-close {
          position: absolute;
          top: max(14px, env(safe-area-inset-top));
          right: 14px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(244, 239, 229, 0.24);
          background: rgba(44, 38, 34, 0.6);
          color: ${IVORY};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bpv-lightbox-close svg { width: 14px; height: 14px; }
        @media (prefers-reduced-motion: reduce) {
          .bpv-pill, .bpv-scrim, .bpv-sheet, .bpv-lightbox, .bpv-lightbox img { animation: none; transition: none; }
        }
        @media print {
          .bpv-progress, .bpv-pill, .bpv-scrim, .bpv-lightbox { display: none !important; }
        }
      `}</style>

      <div className="bpv-progress" aria-hidden="true" style={{ ['--bpv-progress' as string]: progress }} />

      <button
        ref={pillRef}
        type="button"
        className="bpv-pill"
        data-hidden={!pastCover || anyOverlay ? 'true' : 'false'}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
      >
        <span className="bpv-pill-where">
          <span className="bpv-pill-section">{current?.section}</span>
          <span className="bpv-pill-count">{pad(current?.display ?? 1)} / {total}</span>
        </span>
        <span className="bpv-pill-divider" aria-hidden="true" />
        <span className="bpv-pill-action">
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M1.5 3h9M1.5 6h9M1.5 9h6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Contents
        </span>
      </button>

      {sheetOpen && (
        <div className="bpv-scrim" onClick={() => setSheetOpen(false)}>
          <div
            ref={sheetRef}
            className="bpv-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Report contents"
            onClick={event => event.stopPropagation()}
          >
            <div className="bpv-sheet-head">
              <div>
                <div className="bpv-micro">{clientName ? `${clientName}'s Blueprint` : 'Your Blueprint'}</div>
                <h2>Contents</h2>
              </div>
              <button type="button" className="bpv-close" aria-label="Close contents" onClick={() => setSheetOpen(false)}>
                <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="bpv-sheet-body">
              {sections.map(section => {
                // The twenty outfit pages are a numbered grid; anything else in
                // the section (the outfit-system page) is listed by title above it.
                const listed = section.entries.filter(entry => !entry.outfitNumber);
                const outfits = section.entries.filter(entry => entry.outfitNumber);
                return (
                  <div key={section.entries[0].pageNumber} className="bpv-section">
                    <div className="bpv-section-label">
                      <span>{section.label}</span>
                      <span>{pad(section.entries[0].display)}–{pad(section.entries.at(-1)!.display)}</span>
                    </div>
                    {listed.map(entry => (
                      <button
                        key={entry.pageNumber}
                        type="button"
                        className="bpv-entry"
                        data-current={entry.pageNumber === currentPage ? 'true' : 'false'}
                        onClick={() => jumpTo(entry.pageNumber)}
                      >
                        <span className="bpv-entry-number">{pad(entry.display)}</span>
                        <span className="bpv-entry-title">{entry.title}</span>
                      </button>
                    ))}
                    {outfits.length > 0 && (
                      <div className="bpv-outfit-grid">
                        {outfits.map(entry => (
                          <button
                            key={entry.pageNumber}
                            type="button"
                            className="bpv-outfit"
                            data-current={entry.pageNumber === currentPage ? 'true' : 'false'}
                            aria-label={`${entry.title}, page ${entry.display}`}
                            onClick={() => jumpTo(entry.pageNumber)}
                          >
                            {pad(entry.outfitNumber!)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bpv-sheet-foot">
              <button type="button" className="bpv-foot-button" onClick={backToTop}>
                <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  <path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to top
              </button>
              <button type="button" className="bpv-foot-button" onClick={print}>
                <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  <path d="M6 1.5v6M3.5 5L6 7.5 8.5 5M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="bpv-lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setLightbox(null)}>
          <button type="button" className="bpv-lightbox-close" aria-label="Close preview" onClick={() => setLightbox(null)}>
            <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
              <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.src} alt="" onClick={event => event.stopPropagation()} style={{ cursor: 'default' }} />
          {lightbox.caption && <div className="bpv-lightbox-caption">{lightbox.caption}</div>}
        </div>
      )}
    </>
  );
}
