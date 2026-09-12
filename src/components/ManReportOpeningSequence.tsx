'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import type { ClassificationResult } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';

const INK = '#16130F';
const IVORY = '#F4EFE5';
const BRASS = '#C89B62';
const SLATE = '#91A8B0';

const STORAGE_PREFIX = 'iconik-man-opening:v1:';
const EXIT_MS = 720;

type OpeningPhase = 'checking' | 'playing' | 'exiting' | 'done';

interface ManReportOpeningSequenceProps {
  shareToken: string;
  classification: ClassificationResult;
  imageUrls?: ResolvedImageUrls | null;
  stylistReviewed?: boolean;
  children: ReactNode;
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function ManReportOpeningSequence({
  shareToken,
  classification,
  imageUrls,
  stylistReviewed = false,
  children,
}: ManReportOpeningSequenceProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<OpeningPhase>('checking');
  const [beat, setBeat] = useState(0);
  const [revealWaiting, setRevealWaiting] = useState(false);
  const completionStarted = useRef(false);
  const revealReady = useRef(false);
  const revealRequested = useRef(false);
  const revealFallbackTimer = useRef<number | null>(null);

  const profile = useMemo(() => [
    { number: '01', label: 'Frame', value: titleCase(classification.body.silhouette_type || 'Profiled') },
    { number: '02', label: 'Face', value: titleCase(classification.face.face_shape || 'Mapped') },
    { number: '03', label: 'Palette', value: titleCase(classification.colour.season || 'Calibrated') },
  ], [classification]);

  const revealImage = imageUrls?.deliverables?.afterImage
    ?? imageUrls?.deliverables?.beforeAfter
    ?? imageUrls?.deliverables?.linkedinHeadshot
    ?? imageUrls?.diagnostic?.frameFront
    ?? imageUrls?.outfitCards?.find(Boolean)
    ?? null;

  const markRevealReady = useCallback(() => {
    revealReady.current = true;
    if (revealRequested.current) {
      if (revealFallbackTimer.current) window.clearTimeout(revealFallbackTimer.current);
      setRevealWaiting(false);
      setBeat(3);
    }
  }, []);

  const advance = useCallback(() => {
    if (phase !== 'playing') return;
    if (beat < 2) {
      setBeat(current => current + 1);
      return;
    }
    if (beat !== 2 || revealWaiting) return;

    revealRequested.current = true;
    if (!revealImage || revealReady.current) {
      setBeat(3);
      return;
    }

    setRevealWaiting(true);
    // A failed image request should never trap the client on this screen.
    revealFallbackTimer.current = window.setTimeout(() => {
      setRevealWaiting(false);
      setBeat(3);
    }, 4500);
  }, [beat, phase, revealImage, revealWaiting]);

  const finish = useCallback(() => {
    if (completionStarted.current) return;
    completionStarted.current = true;
    try {
      localStorage.setItem(STORAGE_PREFIX + shareToken, new Date().toISOString());
    } catch {
      // A private report still works when browser storage is unavailable.
    }
    setPhase('exiting');
    window.setTimeout(() => setPhase('done'), reduceMotion ? 80 : EXIT_MS);
  }, [reduceMotion, shareToken]);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get('opening');
    const force = mode === '1' || mode === 'always' || mode === 'replay';
    const skip = mode === '0' || mode === 'skip';
    let hasSeen = false;
    try {
      hasSeen = Boolean(localStorage.getItem(STORAGE_PREFIX + shareToken));
    } catch {
      // Default to showing the ceremony when storage is unavailable.
    }

    if (skip || (hasSeen && !force)) {
      setPhase('done');
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
    setBeat(0);
    setPhase('playing');
  }, [shareToken]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    revealRequested.current = false;

    return () => {
      if (revealFallbackTimer.current) window.clearTimeout(revealFallbackTimer.current);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [phase]);

  const active = phase !== 'done';

  return (
    <>
      <div aria-hidden={active || undefined} style={active ? { pointerEvents: 'none' } : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {active && (
          <motion.section
            className="man-opening-root"
            aria-label="Your ICONIK Blueprint is ready"
            initial={false}
            animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.68, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="man-opening-grain" aria-hidden="true" />
            <div className="man-opening-rule man-opening-rule-top" aria-hidden="true" />

            <header className="man-opening-header">
              <span className="man-opening-wordmark">ICONIK</span>
              {phase === 'playing' && (
                <button type="button" className="man-opening-skip" onClick={finish} aria-label="Skip opening sequence">
                  Skip <X size={13} />
                </button>
              )}
            </header>

            {revealImage && (
              // Start the only cinematic image request immediately. The visible
              // reveal mounts several beats later and reuses this warmed response.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="man-opening-image-preload"
                src={revealImage}
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={markRevealReady}
              />
            )}

            <main className="man-opening-stage">
              <AnimatePresence mode="wait" initial={false}>
                {phase === 'checking' && (
                  <motion.div key="checking" className="man-opening-beat man-opening-brand" exit={{ opacity: 0 }}>
                    <span className="man-opening-brand-name">ICONIK</span>
                  </motion.div>
                )}

                {phase === 'playing' && beat === 0 && (
                  <motion.div
                    key="brand"
                    className="man-opening-beat man-opening-brand"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.025 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.span
                      className="man-opening-brand-name"
                      initial={{ opacity: 0, letterSpacing: '0.42em', y: 10 }}
                      animate={{ opacity: 1, letterSpacing: '0.24em', y: 0 }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    >
                      ICONIK
                    </motion.span>
                    <motion.i
                      className="man-opening-brand-line"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: reduceMotion ? 0 : 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.span
                      className="man-opening-brand-caption"
                      initial={{ opacity: 0, letterSpacing: '0.44em' }}
                      animate={{ opacity: 0.7, letterSpacing: '0.3em' }}
                      transition={{ delay: 0.22, duration: 0.55 }}
                    >
                      Personal architecture
                    </motion.span>
                    <motion.button
                      type="button"
                      className="man-opening-continue"
                      onClick={advance}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.5, duration: 0.4 }}
                    >
                      Tap to begin <ArrowRight size={14} />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'playing' && beat === 1 && (
                  <motion.div
                    key="complete"
                    className="man-opening-beat man-opening-complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <motion.div
                      className="man-opening-check"
                      initial={{ scale: 0.72, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 210, damping: 22 }}
                    >
                      <Check size={21} strokeWidth={1.7} />
                    </motion.div>
                    <motion.p
                      className="man-opening-kicker"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.42 }}
                    >
                      Analysis complete
                    </motion.p>
                    <motion.h1
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                    >
                      Your visual system<br /><em>has been resolved.</em>
                    </motion.h1>
                    <motion.button
                      type="button"
                      className="man-opening-continue"
                      onClick={advance}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.48, duration: 0.4 }}
                    >
                      Tap to continue <ArrowRight size={14} />
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'playing' && beat === 2 && (
                  <motion.div
                    key="profile"
                    className="man-opening-beat man-opening-profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.35 }}
                  >
                    <motion.p
                      className="man-opening-kicker"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35 }}
                    >
                      Three coordinates. One identity.
                    </motion.p>
                    <div className="man-opening-coordinates">
                      {profile.map((item, index) => (
                        <motion.div
                          key={item.label}
                          className="man-opening-coordinate"
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.16 + index * 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span>{item.number} · {item.label}</span>
                          <strong>{item.value}</strong>
                        </motion.div>
                      ))}
                    </div>
                    <motion.button
                      type="button"
                      className="man-opening-continue"
                      onClick={advance}
                      disabled={revealWaiting}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.78, duration: 0.4 }}
                    >
                      {revealWaiting ? 'Preparing your reveal…' : 'Tap to reveal'}
                      {!revealWaiting && <ArrowRight size={14} />}
                    </motion.button>
                  </motion.div>
                )}

                {phase === 'playing' && beat === 3 && (
                  <motion.div
                    key="reveal"
                    className="man-opening-beat man-opening-reveal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0.08 : 0.65 }}
                  >
                    {revealImage && (
                      <motion.div
                        className="man-opening-reveal-image"
                        initial={{ opacity: 0, scale: 1.045 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={revealImage}
                          alt="Your ICONIK transformation preview"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      </motion.div>
                    )}
                    <div className="man-opening-reveal-wash" aria-hidden="true" />
                    <motion.div
                      className="man-opening-reveal-copy"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.38, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="man-opening-kicker">Your Blueprint is ready</p>
                      <h1><span>Same man.</span><em>Different science.</em></h1>
                      <p className="man-opening-aspiration">{classification.style_brief.key_aspiration || classification.style_brief.primary_brief}</p>
                      <button type="button" className="man-opening-enter" onClick={finish}>
                        Open the Blueprint <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <footer className="man-opening-footer">
              <span>Personal</span>
              <i />
              <span>Confidential</span>
              <i />
              <span>{stylistReviewed ? 'Stylist reviewed' : 'Blueprint prepared'}</span>
            </footer>
            <div className="man-opening-rule man-opening-rule-bottom" aria-hidden="true" />

            <style jsx global>{`
              .man-opening-root {
                position: fixed;
                inset: 0;
                z-index: 1000;
                min-height: 100dvh;
                overflow: hidden;
                background: ${INK};
                color: ${IVORY};
                isolation: isolate;
              }
              .man-opening-root::before {
                content: '';
                position: absolute;
                inset: -25%;
                z-index: -3;
                background:
                  radial-gradient(circle at 18% 20%, rgba(145,168,176,0.12), transparent 30%),
                  radial-gradient(circle at 82% 74%, rgba(200,155,98,0.1), transparent 28%),
                  ${INK};
              }
              .man-opening-grain {
                position: absolute;
                inset: 0;
                z-index: 4;
                pointer-events: none;
                opacity: 0.075;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.46'/%3E%3C/svg%3E");
                mix-blend-mode: soft-light;
              }
              .man-opening-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 8;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: calc(22px + env(safe-area-inset-top)) clamp(22px, 5vw, 64px) 18px;
              }
              .man-opening-wordmark {
                font-family: var(--font-fraunces), Fraunces, Georgia, serif;
                font-size: 15px;
                letter-spacing: 0.34em;
              }
              .man-opening-skip {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                min-height: 36px;
                padding: 8px 4px 8px 12px;
                color: rgba(244,239,229,0.58);
                font-family: var(--font-jetbrains-mono), monospace;
                font-size: 9px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
              }
              .man-opening-stage {
                position: absolute;
                inset: 0;
                z-index: 2;
              }
              .man-opening-image-preload {
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip-path: inset(50%);
                opacity: 0;
                pointer-events: none;
              }
              .man-opening-beat {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 90px clamp(22px, 6vw, 72px) 78px;
                text-align: center;
              }
              .man-opening-brand { gap: 22px; }
              .man-opening-brand-name {
                display: block;
                font-family: var(--font-fraunces), Fraunces, Georgia, serif;
                font-size: clamp(44px, 9vw, 92px);
                font-weight: 400;
                letter-spacing: 0.24em;
                line-height: 1;
                text-indent: 0.24em;
              }
              .man-opening-brand-line {
                width: min(220px, 54vw);
                height: 1px;
                display: block;
                margin: -2px 0 0;
                background: linear-gradient(90deg, transparent, ${BRASS}, transparent);
                transform-origin: center;
              }
              .man-opening-brand-caption,
              .man-opening-kicker {
                color: ${BRASS};
                font-family: var(--font-jetbrains-mono), monospace;
                font-size: 9px;
                letter-spacing: 0.3em;
                text-transform: uppercase;
              }
              .man-opening-check {
                width: 52px;
                height: 52px;
                display: grid;
                place-items: center;
                margin-bottom: 22px;
                border: 1px solid rgba(244,239,229,0.27);
                border-radius: 999px;
                color: ${BRASS};
                box-shadow: 0 0 0 12px rgba(244,239,229,0.025);
              }
              .man-opening-complete h1,
              .man-opening-reveal h1 {
                margin: 18px 0 0;
                font-family: var(--font-fraunces), Fraunces, Georgia, serif;
                font-size: clamp(38px, 7vw, 76px);
                font-weight: 400;
                line-height: 0.98;
                letter-spacing: -0.035em;
              }
              .man-opening-complete h1 em,
              .man-opening-reveal h1 em {
                font-weight: 400;
              }
              .man-opening-coordinates {
                width: min(880px, 100%);
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                margin-top: 34px;
                border-top: 1px solid rgba(244,239,229,0.15);
                border-bottom: 1px solid rgba(244,239,229,0.15);
              }
              .man-opening-coordinate {
                min-width: 0;
                padding: clamp(22px, 4vw, 42px) clamp(12px, 3vw, 32px);
              }
              .man-opening-coordinate + .man-opening-coordinate { border-left: 1px solid rgba(244,239,229,0.15); }
              .man-opening-coordinate span {
                display: block;
                margin-bottom: 13px;
                color: rgba(244,239,229,0.45);
                font-family: var(--font-jetbrains-mono), monospace;
                font-size: 9px;
                letter-spacing: 0.2em;
                text-transform: uppercase;
              }
              .man-opening-coordinate strong {
                display: block;
                overflow: hidden;
                font-family: var(--font-fraunces), Fraunces, Georgia, serif;
                font-size: clamp(25px, 4vw, 43px);
                font-weight: 400;
                line-height: 1.05;
                text-overflow: ellipsis;
              }
              .man-opening-reveal { align-items: flex-start; text-align: left; }
              .man-opening-reveal-image {
                position: absolute;
                inset: 0 0 0 42%;
                z-index: -2;
                overflow: hidden;
              }
              .man-opening-reveal-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: 50% 18%;
                filter: saturate(0.82) contrast(1.04);
              }
              .man-opening-reveal-wash {
                position: absolute;
                inset: 0;
                z-index: -1;
                background:
                  linear-gradient(90deg, ${INK} 0%, rgba(22,19,15,0.98) 34%, rgba(22,19,15,0.54) 66%, rgba(22,19,15,0.22) 100%),
                  linear-gradient(0deg, rgba(22,19,15,0.82), transparent 46%);
              }
              .man-opening-reveal-copy { width: min(620px, 60vw); }
              .man-opening-reveal h1 { margin-top: 20px; font-size: clamp(48px, 8vw, 94px); }
              .man-opening-reveal h1 span,
              .man-opening-reveal h1 em { display: block; }
              .man-opening-reveal h1 em { color: ${SLATE}; }
              .man-opening-aspiration {
                max-width: 510px;
                margin: 25px 0 0;
                color: rgba(244,239,229,0.66);
                font-size: 14px;
                line-height: 1.7;
              }
              .man-opening-continue {
                min-height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-top: 30px;
                padding: 11px 17px 12px;
                border: 1px solid rgba(244,239,229,0.26);
                border-radius: 999px;
                color: rgba(244,239,229,0.78);
                background: rgba(244,239,229,0.035);
                font-family: var(--font-jetbrains-mono), monospace;
                font-size: 9px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                backdrop-filter: blur(10px);
                transition: color 180ms ease, border-color 180ms ease, background 180ms ease;
              }
              .man-opening-continue:hover,
              .man-opening-continue:focus-visible {
                color: ${IVORY};
                border-color: rgba(244,239,229,0.58);
                background: rgba(244,239,229,0.08);
              }
              .man-opening-continue:disabled { cursor: wait; opacity: 0.55; }
              .man-opening-enter {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 14px;
                margin-top: 30px;
                padding: 15px 22px 16px;
                border: 1px solid rgba(244,239,229,0.42);
                border-radius: 999px;
                color: ${INK};
                background: ${IVORY};
                font-family: var(--font-fraunces), Fraunces, Georgia, serif;
                font-size: 14px;
              }
              .man-opening-footer {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 8;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 13px;
                padding: 18px 22px calc(21px + env(safe-area-inset-bottom));
                color: rgba(244,239,229,0.35);
                font-family: var(--font-jetbrains-mono), monospace;
                font-size: 8px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
              }
              .man-opening-footer i {
                width: 3px;
                height: 3px;
                border-radius: 999px;
                background: ${BRASS};
              }
              .man-opening-rule {
                position: absolute;
                left: clamp(22px, 5vw, 64px);
                right: clamp(22px, 5vw, 64px);
                z-index: 7;
                height: 1px;
                background: rgba(244,239,229,0.12);
              }
              .man-opening-rule-top { top: calc(66px + env(safe-area-inset-top)); }
              .man-opening-rule-bottom { bottom: calc(58px + env(safe-area-inset-bottom)); }

              @media (max-width: 700px) {
                .man-opening-header { padding-left: 18px; padding-right: 14px; }
                .man-opening-wordmark { font-size: 13px; }
                .man-opening-beat { padding: 86px 18px 74px; }
                .man-opening-complete h1 { font-size: clamp(38px, 11vw, 52px); }
                .man-opening-profile { justify-content: center; }
                .man-opening-profile > .man-opening-kicker { max-width: 260px; line-height: 1.7; }
                .man-opening-coordinates {
                  grid-template-columns: 1fr;
                  width: 100%;
                  max-width: 360px;
                  margin-top: 25px;
                }
                .man-opening-coordinate {
                  display: grid;
                  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
                  align-items: baseline;
                  gap: 16px;
                  padding: 18px 4px;
                  text-align: left;
                }
                .man-opening-coordinate + .man-opening-coordinate {
                  border-left: 0;
                  border-top: 1px solid rgba(244,239,229,0.15);
                }
                .man-opening-coordinate span { margin: 0; }
                .man-opening-coordinate strong { text-align: right; font-size: clamp(25px, 8vw, 34px); }
                .man-opening-profile .man-opening-continue { margin-top: 22px; }
                .man-opening-reveal { justify-content: flex-end; padding-bottom: 104px; }
                .man-opening-reveal-image { inset: 0; }
                .man-opening-reveal-wash {
                  background:
                    linear-gradient(0deg, ${INK} 0%, rgba(22,19,15,0.92) 28%, rgba(22,19,15,0.18) 72%, rgba(22,19,15,0.5) 100%),
                    linear-gradient(90deg, rgba(22,19,15,0.36), transparent 80%);
                }
                .man-opening-reveal-copy { width: 100%; }
                .man-opening-reveal h1 { font-size: clamp(46px, 14vw, 64px); }
                .man-opening-aspiration {
                  display: -webkit-box;
                  margin-top: 18px;
                  overflow: hidden;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  font-size: 12px;
                }
                .man-opening-enter { margin-top: 22px; }
                .man-opening-footer { gap: 8px; font-size: 6.5px; letter-spacing: 0.11em; }
                .man-opening-rule { left: 18px; right: 18px; }
              }

              @media (prefers-reduced-motion: reduce) {
                .man-opening-root *, .man-opening-root *::before, .man-opening-root *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `}</style>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
