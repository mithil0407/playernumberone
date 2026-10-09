'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DnaChip } from '@/lib/styleMembershipLogic';
import s from './membership.module.css';

export function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}

// ── Icons (inline, 1.6px strokes like SF Symbols) ───────────────────────────

export function Icon({ name, size = 20 }: { name: 'back' | 'check' | 'heart' | 'x' | 'lock' | 'whatsapp' | 'camera' | 'shield' | 'spark' | 'arrow'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'back': return <svg {...common}><path d="M15 5l-7 7 7 7" /></svg>;
    case 'check': return <svg {...common} strokeWidth={2.4}><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
    case 'heart': return <svg {...common}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>;
    case 'x': return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'lock': return <svg {...common}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;
    case 'camera': return <svg {...common}><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case 'shield': return <svg {...common}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'spark': return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>;
    case 'arrow': return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'whatsapp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
          <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.4-.3z" />
        </svg>
      );
  }
}

// ── Header ──────────────────────────────────────────────────────────────────

export function TopBar({
  onBack,
  backLabel = 'Back',
  children,
  right,
}: {
  onBack?: (() => void) | null;
  backLabel?: string;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className={s.top}>
      <div className={s.page}>
        <div className={s.topRow}>
          {onBack ? (
            <button type="button" className={s.iconButton} onClick={onBack} aria-label={backLabel}>
              <Icon name="back" size={22} />
            </button>
          ) : <span />}
          <Link href="/style-membership" className={s.brand} aria-label="ICONIK home">ICONIK</Link>
          <span style={{ justifySelf: 'end' }}>{right}</span>
        </div>
        {children}
      </div>
    </header>
  );
}

export function ChapterProgress({ chapters, finished = false }: { chapters: Array<{ id: string; label: string; value: number }>; finished?: boolean }) {
  // The chapter she is in is the last one with any progress.
  const current = Math.max(0, chapters.reduce((last, chapter, index) => (chapter.value > 0 ? index : last), -1));
  const lastDone = chapters.reduce((last, chapter, index) => (chapter.value === 1 ? index : last), -1);
  const allDone = finished && chapters.every(chapter => chapter.value === 1);
  const label = allDone ? 'Almost there' : chapters[current]?.label;
  return (
    <div>
      <div className={s.chapterLabels} aria-hidden>
        <span data-active="true">{label}</span>
        <span>{allDone ? 'Done' : `${current + 1} of ${chapters.length}`}</span>
      </div>
      <div
        className={s.progress}
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={chapters.length}
        aria-valuenow={lastDone + 1}
        aria-valuetext={allDone ? 'All chapters done' : `${label}, chapter ${current + 1} of ${chapters.length}`}
      >
        {chapters.map(chapter => (
          <span key={chapter.id} className={s.progressSegment}>
            <span className={s.progressFill} style={{ transform: `scaleX(${chapter.value})` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** The live Style DNA card in the header: chips build up as she answers. */
export function DnaStrip({ chips, newest }: { chips: DnaChip[]; newest?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  // Keep the newest chip in view as the card grows.
  useEffect(() => {
    const strip = ref.current;
    if (strip) strip.scrollTo({ left: strip.scrollWidth, behavior: newest ? 'smooth' : 'auto' });
  }, [chips.length, newest]);
  if (!chips.length) return null;
  return (
    <div className={s.dna} aria-label="Your Style DNA so far" role="group" ref={ref}>
      <span className={s.dnaLabel}>Style DNA</span>
      {chips.map(chip => (
        <span key={chip.key} className={cx(s.chip, chip.key === newest && s.chipNew)}>{chip.label}</span>
      ))}
    </div>
  );
}

export function DnaCard({ chips, title, children }: { chips: DnaChip[]; title: string; children?: ReactNode }) {
  return (
    <div className={s.dnaCard}>
      <p className={s.eyebrow} style={{ margin: 0, color: 'var(--gold)' }}>Your Style DNA</p>
      <h2 className={s.h3} style={{ marginTop: 6 }}>{title}</h2>
      <div className={s.chips}>
        {chips.map(chip => <span key={chip.key} className={s.chip}>{chip.label}</span>)}
      </div>
      {children}
    </div>
  );
}

// ── CTA ─────────────────────────────────────────────────────────────────────

/**
 * Fixed layers (the CTA bar, sheets) render into #sm-overlay at the root: the
 * screen's enter animation uses a transform, which would otherwise make
 * "position: fixed" stick to the screen instead of the viewport.
 */
export function Overlay({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.getElementById('sm-overlay')), []);
  return target ? createPortal(children, target) : null;
}

export function CtaBar({ children }: { children: ReactNode }) {
  return (
    <Overlay>
      <div className={s.ctaBar}>
        <div className={s.ctaBarInner}>{children}</div>
      </div>
    </Overlay>
  );
}

export function Spinner() {
  return <span className={s.spinner} aria-hidden />;
}

// ── Media ───────────────────────────────────────────────────────────────────

export function Photo({
  src,
  alt,
  ratio = '45',
  priority,
  sizes = '(max-width: 520px) 100vw, 480px',
  className,
  children,
  blur,
}: {
  src: string;
  alt: string;
  ratio?: '45' | '11';
  priority?: boolean;
  sizes?: string;
  className?: string;
  children?: ReactNode;
  blur?: boolean;
}) {
  const unoptimized = src.startsWith('/api/');
  return (
    <div className={cx(s.media, ratio === '45' ? s.ratio45 : s.ratio11, className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={blur ? s.blur : undefined} unoptimized={unoptimized} />
      {children}
    </div>
  );
}

export function Swatches({ swatches, size = 'md' }: { swatches: Array<{ name: string; hex: string }>; size?: 'sm' | 'md' }) {
  return (
    <ul className={s.swatches} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {swatches.map(swatch => (
        <li key={swatch.name} className={s.swatch} style={size === 'sm' ? { width: 52 } : undefined}>
          <span style={{ background: swatch.hex, ...(size === 'sm' ? { width: 32, height: 32 } : {}) }} />
          <span>{swatch.name}</span>
        </li>
      ))}
    </ul>
  );
}
