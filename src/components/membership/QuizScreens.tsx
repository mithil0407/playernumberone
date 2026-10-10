'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { PROOF } from '@/lib/styleMembershipConfig';
import {
  SKIN_TONES,
  dnaChips,
  mirrorFor,
  type QuizAnswers,
} from '@/lib/styleMembershipLogic';
import {
  chapterProgress,
  screenAnswered,
  screenById,
  visibleScreens,
  type QuizOption,
  type QuizScreen,
} from '@/lib/styleMembershipQuiz';
import { attribution, newEventId, postJson, sessionId, tapFeedback, trackAction, trackLeadPixel, trackScreen } from './client';
import { useQuiz, type PublicLead } from './QuizProvider';
import { ChapterProgress, CtaBar, DnaCard, DnaStrip, Icon, Monogram, Overlay, Photo, Spinner, StyleDetail, Swatches, TopBar, cx } from './ui';
import s from './membership.module.css';

let lastChipKeys: string[] | null = null;

export function QuizScreenView({ id }: { id: string }) {
  const quiz = useQuiz();
  const screen = screenById(id);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const screens = useMemo(() => visibleScreens(quiz.context), [quiz.context]);
  const step = Math.max(0, screens.findIndex(item => item.id === id)) + 1;
  const chips = useMemo(() => dnaChips(quiz.answers, quiz.lead?.selfieSeason?.name), [quiz.answers, quiz.lead]);
  const newest = lastChipKeys ? chips.find(chip => !lastChipKeys!.includes(chip.key))?.key ?? null : null;

  useEffect(() => {
    lastChipKeys = chips.map(chip => chip.key);
  }, [chips]);

  useEffect(() => {
    if (!quiz.ready || !screen) return;
    quiz.markShown();
    trackScreen(screen.id, step, screen.chapter, quiz.lead?.id);
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.ready, screen?.id]);

  if (!screen) return null;
  if (!quiz.ready) return <div className={s.page} style={{ minHeight: '100dvh' }} aria-busy="true" />;

  const showProgress = Boolean(screen.chapter) || screen.kind === 'gate';
  const back = screen.kind === 'welcome' ? null : () => quiz.goBack(screen.id);

  return (
    <>
      <TopBar onBack={back}>
        {showProgress ? <ChapterProgress chapters={chapterProgress(screen.id, quiz.context)} finished={screen.kind === 'gate'} /> : null}
        {screen.kind !== 'welcome' && screen.kind !== 'gate' ? <DnaStrip chips={chips} newest={newest} /> : null}
      </TopBar>
      <main className={s.page}>
        <div className={s.screen} key={screen.id}>
          <ScreenBody screen={screen} headingRef={headingRef} />
        </div>
      </main>
    </>
  );
}

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function ScreenBody({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  switch (screen.kind) {
    case 'welcome': return <WelcomeScreen screen={screen} headingRef={headingRef} />;
    case 'proof': return <ProofScreen screen={screen} headingRef={headingRef} />;
    case 'choice': return <ChoiceScreen screen={screen} headingRef={headingRef} />;
    case 'height': return <HeightScreen screen={screen} headingRef={headingRef} />;
    case 'metal': return <MetalScreen screen={screen} headingRef={headingRef} />;
    case 'swipe': return <SwipeScreen screen={screen} headingRef={headingRef} />;
    case 'mirror': return <MirrorScreen screen={screen} headingRef={headingRef} />;
    case 'loading': return <LoadingScreen screen={screen} headingRef={headingRef} />;
    case 'gate': return <GateScreen screen={screen} headingRef={headingRef} />;
    case 'selfie': return <SelfieScreen screen={screen} headingRef={headingRef} />;
  }
}

function Heading({ screen, headingRef, title, subtitle }: { screen?: QuizScreen; headingRef: HeadingRef; title?: string; subtitle?: string }) {
  return (
    <>
      <h1 className={s.h1} ref={headingRef} tabIndex={-1}>{title ?? screen?.title}</h1>
      {(subtitle ?? screen?.subtitle) ? <p className={s.lede}>{subtitle ?? screen?.subtitle}</p> : null}
    </>
  );
}

/** Single answers move on by themselves after a beat, so the tick is seen. */
function useAutoAdvance(screen: QuizScreen) {
  const quiz = useQuiz();
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  return useCallback((answers?: QuizAnswers) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => quiz.goNext(screen.id, answers), 320);
  }, [quiz, screen.id]);
}

// ── Entry ───────────────────────────────────────────────────────────────────

function WelcomeScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const advance = useAutoAdvance(screen);
  return (
    <>
      <div className={s.row} style={{ marginBottom: 18 }}>
        <Monogram size={44} />
        <div>
          <p className={s.h3} style={{ margin: 0 }}>Free 3-minute style quiz</p>
          <p className={s.small} style={{ margin: 0 }}>Made for Indian women</p>
        </div>
      </div>
      <Photo src="/membership/hero-trio.webp" alt="Three Indian women in a camel blazer, a rust kurta set and a black co-ord" ratio="11" priority />
      <div style={{ marginTop: 24 }}>
        <Heading screen={screen} headingRef={headingRef} />
      </div>
      <div className={cx(s.options, s.grid2)} role="radiogroup" aria-label="Your age">
        {screen.options!.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={quiz.answers.age === option.value}
            className={cx(s.option, s.tileOption)}
            onClick={() => {
              if (!quiz.settled()) return;
              tapFeedback();
              quiz.setAnswer('age', option.value as QuizAnswers['age']);
              trackAction('answer', { screen: screen.id, value: option.value });
              advance();
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className={s.fine} style={{ marginTop: 18, textAlign: 'center' }}>
        By continuing you agree to our <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link> and <Link href="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link>.
      </p>
    </>
  );
}

const AGE_PROOF: Record<string, string> = {
  '18-24': 'From first jobs to first weddings in the friend group.',
  '25-34': 'Many of them juggle work, weddings and a packed social calendar.',
  '35-44': 'Many of them juggle work, family and functions, just like you.',
  '45+': 'Women who want to look current and elegant, never “dressed old”.',
};

function ProofScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  return (
    <>
      <p className={s.eyebrow}>Real clients, real numbers</p>
      <Heading headingRef={headingRef} title={`${PROOF.womenStyledLabel} Indian women styled by ICONIK`} subtitle={AGE_PROOF[quiz.answers.age ?? '25-34']} />
      <figure className={s.card} style={{ margin: '24px 0 0', padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--soft)' }}>
          <Image src="/testimonial-priya.webp" alt="Priya, an ICONIK client from Mumbai" fill sizes="480px" style={{ objectFit: 'cover' }} />
        </div>
        <figcaption style={{ padding: 18 }}>
          <blockquote className={s.quote}>“Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.”</blockquote>
          <p className={s.small} style={{ margin: '10px 0 0' }}>Priya, 28, Mumbai · ICONIK client</p>
        </figcaption>
      </figure>
      <CtaBar>
        <button type="button" className={s.cta} onClick={() => quiz.goNext(screen.id)}>Continue</button>
      </CtaBar>
    </>
  );
}

// ── Questions ───────────────────────────────────────────────────────────────

function OptionContent({ option, screen, selected, multi }: { option: QuizOption; screen: QuizScreen; selected: boolean; multi: boolean }) {
  if (screen.layout === 'images' && option.image) {
    return (
      <>
        <span className={s.imageOptionMedia}>
          <Image src={option.image} alt="" fill sizes="(max-width: 520px) 50vw, 240px" />
        </span>
        <span className={s.optionText}>
          <span>{option.label}</span>
          {option.hint ? <span className={s.optionHint}>{option.hint}</span> : null}
        </span>
      </>
    );
  }
  if (screen.layout === 'swatches' && option.image) {
    return (
      <>
        <span className={s.toneThumb}><Image src={option.image} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} /></span>
        <span className={s.optionText}>{option.label}</span>
        <span className={s.swatchDot} style={{ background: option.swatch }} aria-hidden />
      </>
    );
  }
  return (
    <>
      {option.swatch ? <span className={s.swatchDot} style={{ background: option.swatch }} aria-hidden /> : null}
      <span className={s.optionText}>
        <span>{option.label}</span>
        {option.hint ? <span className={s.optionHint}>{option.hint}</span> : null}
      </span>
      {screen.layout !== 'tiles' ? (
        <span className={cx(s.check, multi && s.checkSquare)} aria-hidden>{selected ? <Icon name="check" size={14} /> : null}</span>
      ) : null}
    </>
  );
}

function ChoiceScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const advance = useAutoAdvance(screen);
  const field = screen.field!;
  const multi = Boolean(screen.multi);
  const value = quiz.answers[field];
  const selected = multi ? (Array.isArray(value) ? value as string[] : []) : value;

  const choose = (option: QuizOption) => {
    if (!quiz.settled()) return;
    tapFeedback();
    if (!multi) {
      quiz.setAnswer(field, option.value as never);
      trackAction('answer', { screen: screen.id, value: option.value });
      advance({ ...quiz.answers, [field]: option.value });
      return;
    }
    const current = selected as string[];
    let next: string[];
    if (current.includes(option.value)) next = current.filter(item => item !== option.value);
    else if (screen.exclusive && option.value === screen.exclusive) next = [option.value];
    else {
      next = [...current.filter(item => item !== screen.exclusive), option.value];
      if (screen.maxSelect && next.length > screen.maxSelect) next = next.slice(next.length - screen.maxSelect);
    }
    quiz.setAnswer(field, next as never);
  };

  const layoutClass = screen.layout === 'grid' || screen.layout === 'images' ? s.grid2 : screen.layout === 'tiles' ? s.tiles : screen.layout === 'swatches' && multi ? s.grid2 : undefined;
  const answered = screenAnswered(screen, quiz.answers);

  return (
    <>
      {screen.id === 'vein-check' ? (
        <div style={{ marginBottom: 20 }}>
          <Photo src="/membership/vein-check.webp" alt="An inner wrist, palm up, in daylight" ratio="11" />
        </div>
      ) : null}
      <Heading screen={screen} headingRef={headingRef} />
      <div
        className={cx(s.options, layoutClass)}
        role={multi ? 'group' : 'radiogroup'}
        aria-label={screen.title}
      >
        {screen.options!.map(option => {
          const isSelected = multi ? (selected as string[]).includes(option.value) : selected === option.value;
          const className = cx(
            s.option,
            screen.layout === 'tiles' && s.tileOption,
            screen.layout === 'images' && option.image && s.imageOption,
            screen.layout === 'images' && !option.image && s.notSure,
            screen.layout === 'swatches' && option.image && s.toneOption,
          );
          return (
            <button
              key={option.value}
              type="button"
              className={className}
              {...(multi ? { 'aria-pressed': isSelected } : { role: 'radio', 'aria-checked': isSelected })}
              onClick={() => choose(option)}
            >
              <OptionContent option={option} screen={screen} selected={isSelected} multi={multi} />
            </button>
          );
        })}
      </div>
      {multi || screen.optional ? (
        <CtaBar>
          <button
            type="button"
            className={s.cta}
            disabled={!answered}
            onClick={() => {
              trackAction('answer', { screen: screen.id, value: Array.isArray(selected) ? selected.join(',') : String(selected ?? 'skipped') });
              quiz.goNext(screen.id);
            }}
          >
            {screen.optional && !value ? 'Skip' : 'Continue'}
          </button>
        </CtaBar>
      ) : null}
    </>
  );
}

function HeightScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const [unit, setUnit] = useState<'ft' | 'cm'>('ft');
  const cm = quiz.answers.heightCm ?? 160;
  const inches = Math.round(cm / 2.54);
  const label = unit === 'cm' ? `${cm} cm` : `${Math.floor(inches / 12)}′ ${inches % 12}″`;
  return (
    <>
      <Heading screen={screen} headingRef={headingRef} subtitle="It changes which kurta and hem lengths we pick." />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
        <div className={s.segmented} role="group" aria-label="Units">
          <button type="button" aria-pressed={unit === 'ft'} onClick={() => setUnit('ft')}>ft / in</button>
          <button type="button" aria-pressed={unit === 'cm'} onClick={() => setUnit('cm')}>cm</button>
        </div>
      </div>
      <p className={s.heightValue} aria-live="polite">{label}</p>
      <input
        className={s.range}
        type="range"
        min={140}
        max={190}
        step={1}
        value={cm}
        aria-label="Your height"
        aria-valuetext={label}
        onChange={event => quiz.setAnswer('heightCm', Number(event.target.value))}
      />
      <div className={s.row} style={{ justifyContent: 'space-between' }}>
        <span className={s.small}>{unit === 'cm' ? '140 cm' : '4′7″'}</span>
        <span className={s.small}>{unit === 'cm' ? '190 cm' : '6′3″'}</span>
      </div>
      <CtaBar>
        <button
          type="button"
          className={s.cta}
          onClick={() => {
            if (!quiz.answers.heightCm) quiz.setAnswer('heightCm', cm);
            trackAction('answer', { screen: screen.id, value: cm });
            quiz.goNext(screen.id);
          }}
        >
          Continue
        </button>
      </CtaBar>
    </>
  );
}

function MetalScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const advance = useAutoAdvance(screen);
  const tone = quiz.answers.skinTone ?? 'wheatish';
  const toneLabel = SKIN_TONES.find(item => item.id === tone)?.label.toLowerCase();
  const pick = (value: 'gold' | 'silver' | 'both') => {
    if (!quiz.settled()) return;
    tapFeedback();
    quiz.setAnswer('metal', value);
    trackAction('answer', { screen: screen.id, value });
    advance({ ...quiz.answers, metal: value });
  };
  return (
    <>
      <Heading screen={screen} headingRef={headingRef} subtitle={`Shown on a model with ${toneLabel} skin, like yours.`} />
      <div className={cx(s.options, s.grid2)} role="radiogroup" aria-label="Gold or silver">
        {(['gold', 'silver'] as const).map(metal => (
          <button
            key={metal}
            type="button"
            role="radio"
            aria-checked={quiz.answers.metal === metal}
            className={cx(s.option, s.imageOption)}
            onClick={() => pick(metal)}
          >
            <span className={s.imageOptionMedia}>
              <Image src={`/membership/jewel-${tone}-${metal}.webp`} alt={`${metal === 'gold' ? 'Gold' : 'Silver'} earrings and chain on ${toneLabel} skin`} fill sizes="(max-width: 520px) 50vw, 240px" />
            </span>
            <span className={s.optionText} style={{ textAlign: 'center' }}>{metal === 'gold' ? 'Gold' : 'Silver'}</span>
          </button>
        ))}
        <button type="button" role="radio" aria-checked={quiz.answers.metal === 'both'} className={cx(s.option, s.notSure)} onClick={() => pick('both')}>
          Both look the same on me
        </button>
      </div>
    </>
  );
}

const SWIPE_THRESHOLD = 90;

function SwipeScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const look = screen.look!;
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'love' | 'skip' | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  const decide = (verdict: 'love' | 'skip') => {
    if (leaving || !quiz.settled()) return;
    tapFeedback();
    setLeaving(verdict);
    const swipes = { ...(quiz.answers.swipes ?? {}), [look.id]: verdict };
    quiz.setAnswer('swipes', swipes);
    trackAction('swipe', { screen: screen.id, look: look.id, value: verdict });
    window.setTimeout(() => quiz.goNext(screen.id, { ...quiz.answers, swipes }), 300);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || leaving) return;
    setDx(event.clientX - start.current.x);
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (dx > SWIPE_THRESHOLD) decide('love');
    else if (dx < -SWIPE_THRESHOLD) decide('skip');
    else setDx(0);
  };

  const offset = leaving === 'love' ? 520 : leaving === 'skip' ? -520 : dx;
  const rotation = offset / 22;
  const current = quiz.answers.swipes?.[look.id];

  return (
    <>
      <Heading screen={screen} headingRef={headingRef} subtitle="" />
      <p className={s.small} style={{ margin: '6px 0 0' }}>{screen.subtitle} · swipe right if you love it</p>
      <div className={s.swipeStage}>
        <div
          className={s.swipeCard}
          style={{
            transform: `translateX(${offset}px) rotate(${rotation}deg)`,
            opacity: leaving ? 0 : 1,
            transition: start.current ? 'none' : undefined,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div style={{ position: 'relative', height: 'min(50dvh, 430px)', background: 'var(--soft)' }}>
            <Image src={look.image} alt={`${look.label}: ${look.detail}`} fill sizes="(max-width: 520px) 100vw, 440px" priority draggable={false} style={{ objectFit: 'cover', objectPosition: 'center 20%', pointerEvents: 'none' }} />
            <span className={s.swipeStamp} style={{ left: 18, color: 'var(--good)', opacity: Math.max(0, Math.min(1, dx / SWIPE_THRESHOLD)) }} aria-hidden>Love it</span>
            <span className={s.swipeStamp} style={{ right: 18, color: 'var(--muted)', opacity: Math.max(0, Math.min(1, -dx / SWIPE_THRESHOLD)) }} aria-hidden>Not me</span>
          </div>
          <div className={s.swipeCaption}>
            <p className={s.h3} style={{ margin: 0 }}>{look.label}</p>
            <p className={s.small} style={{ margin: '2px 0 0' }}>{look.detail}</p>
          </div>
        </div>
      </div>
      <div className={s.swipeButtons}>
        <button type="button" className={s.swipeButton} aria-pressed={current === 'skip'} onClick={() => decide('skip')}>
          <Icon name="x" size={18} /> Not me
        </button>
        <button type="button" className={cx(s.swipeButton, s.swipeLove)} aria-pressed={current === 'love'} onClick={() => decide('love')}>
          <Icon name="heart" size={18} /> Love it
        </button>
      </div>
    </>
  );
}

// ── Mirrors ─────────────────────────────────────────────────────────────────

function MirrorScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const mirror = mirrorFor(screen.mirror!, quiz.answers);
  return (
    <>
      <p className={s.eyebrow}>{mirror.eyebrow}</p>
      <Heading headingRef={headingRef} title={mirror.title} subtitle={mirror.body} />
      {mirror.pair ? (
        <div className={s.pairGrid}>
          <figure style={{ margin: 0 }}>
            <Photo src={mirror.pair.before.image} alt={`Before: ${mirror.pair.before.caption}`} sizes="(max-width: 520px) 50vw, 240px" />
            <figcaption className={s.pairLabel}><span className={s.tagBad} aria-hidden>✕</span>{mirror.pair.before.caption}</figcaption>
          </figure>
          <figure style={{ margin: 0 }}>
            <Photo src={mirror.pair.after.image} alt={`After: ${mirror.pair.after.caption}`} sizes="(max-width: 520px) 50vw, 240px" />
            <figcaption className={s.pairLabel}><span className={s.tagGood} aria-hidden>✓</span>{mirror.pair.after.caption}</figcaption>
          </figure>
        </div>
      ) : mirror.style ? (
        <div className={s.stack} style={{ marginTop: 20 }}>
          <StyleDetail profile={mirror.style} />
          {mirror.style.loved.length ? (
            <div className={s.pairGrid} style={{ marginTop: 0 }}>
              {mirror.style.loved.slice(0, 2).map(look => (
                <Photo key={look.id} src={look.image} alt={look.label} sizes="(max-width: 520px) 50vw, 240px" />
              ))}
            </div>
          ) : null}
        </div>
      ) : mirror.image ? (
        <div style={{ marginTop: 22 }}>
          <Photo src={mirror.image} alt={mirror.imageAlt ?? ''} />
        </div>
      ) : null}
      {mirror.swatches ? (
        <div style={{ marginTop: 18 }}>
          <p className={s.small} style={{ margin: '0 0 10px' }}>Colours to try near your face</p>
          <Swatches swatches={mirror.swatches} size="sm" />
        </div>
      ) : null}
      {mirror.pair ? <p className={s.fine} style={{ marginTop: 12 }}>Illustrative images generated for ICONIK.</p> : null}
      <CtaBar>
        <button type="button" className={s.cta} onClick={() => quiz.goNext(screen.id)}>Continue</button>
      </CtaBar>
    </>
  );
}

// ── Loading, with the mid-load question and real client stories ────────────

const LOAD_STEPS = ['Reading your body shape', 'Matching your colours', 'Planning your occasions'];
const LOAD_MS = 7000;

const STORIES = [
  { name: 'Priya, 28, Mumbai', quote: 'Earlier I would change three or four times before going out. Now I know what to pick.' },
  { name: 'Shreya, 26, Bangalore', quote: 'I used to save so many outfits and then buy nothing because I was confused. Now shopping feels much more straightforward.' },
  { name: 'Tina', quote: 'Thanks to ICONIK’s stylists. They helped me get styled for my events. It was absolutely worth it.' },
];

function LoadingScreen({ screen, headingRef }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const [progress, setProgress] = useState(0);
  const [asking, setAsking] = useState(false);
  const askedRef = useRef(Boolean(quiz.answers.extras));
  const pausedRef = useRef(false);
  const [story, setStory] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const tick = window.setInterval(() => {
      if (pausedRef.current) return;
      elapsed += 100;
      const value = Math.min(1, elapsed / LOAD_MS);
      setProgress(value);
      if (value >= 0.45 && !askedRef.current) {
        askedRef.current = true;
        pausedRef.current = true;
        setAsking(true);
      }
      if (value >= 1) window.clearInterval(tick);
    }, 100);
    const rotate = window.setInterval(() => setStory(index => (index + 1) % STORIES.length), 3200);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(rotate);
    };
  }, []);

  useEffect(() => {
    if (progress < 1) return;
    // Members who paid first save their answers to their lead now.
    if (quiz.member && quiz.leadToken) {
      void postJson('/api/style-membership/lead/answers', { answers: quiz.answers }, { 'x-lead-token': quiz.leadToken }).catch(() => undefined);
    }
    const timer = window.setTimeout(() => quiz.goNext(screen.id), 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress >= 1]);

  const answerExtras = (value: 'yes' | 'no') => {
    quiz.setAnswer('extras', value);
    trackAction('answer', { screen: 'jewellery-help', value });
    setAsking(false);
    pausedRef.current = false;
  };

  return (
    <>
      <Heading headingRef={headingRef} title="Building your Style Plan" subtitle={`${Math.round(progress * 100)}%`} />
      <div className={s.stack} style={{ marginTop: 24 }} aria-live="polite">
        {LOAD_STEPS.map((label, index) => {
          const value = Math.max(0, Math.min(1, progress * LOAD_STEPS.length - index));
          return (
            <div key={label}>
              <div className={s.row} style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
                <span className={s.small}>{value >= 1 ? <Icon name="check" size={16} /> : `${Math.round(value * 100)}%`}</span>
              </div>
              <div className={s.loadBar}><div className={s.loadFill} style={{ width: `${value * 100}%` }} /></div>
            </div>
          );
        })}
      </div>
      <figure className={s.card} style={{ margin: '32px 0 0' }} aria-live="polite">
        <p className={s.eyebrow} style={{ marginBottom: 8 }}>★★★★★ · ICONIK client</p>
        <blockquote className={s.quote} style={{ fontSize: 18 }}>“{STORIES[story].quote}”</blockquote>
        <figcaption className={s.small} style={{ marginTop: 10 }}>{STORIES[story].name}</figcaption>
      </figure>
      {asking ? (
        <Overlay>
        <div className={s.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="extras-title">
          <div className={s.sheet}>
            <p className={s.eyebrow}>Quick question</p>
            <h2 id="extras-title" className={s.h2}>Want help pairing jewellery and dupattas too?</h2>
            <div className={s.stack} style={{ marginTop: 20 }}>
              <button type="button" className={s.cta} onClick={() => answerExtras('yes')} autoFocus>Yes, please</button>
              <button type="button" className={cx(s.cta, s.ctaSecondary)} onClick={() => answerExtras('no')}>Just the outfits</button>
            </div>
          </div>
        </div>
        </Overlay>
      ) : null}
    </>
  );
}

// ── The WhatsApp gate ───────────────────────────────────────────────────────

function GateScreen({ headingRef, screen }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const chips = dnaChips(quiz.answers);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const digits = phone.replace(/\D+/g, '').slice(-10);
  const valid = /^[6-9]\d{9}$/.test(digits) && consent;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || busy || !quiz.settled()) return;
    setBusy(true);
    setError(null);
    const eventId = newEventId('Lead');
    try {
      const result = await postJson<{ token: string; lead: PublicLead }>('/api/style-membership/lead', {
        phone: digits,
        firstName,
        email,
        consent,
        answers: quiz.answers,
        sessionId: sessionId(),
        attribution: attribution(),
        eventId,
      });
      quiz.setLead(result.token, result.lead);
      trackLeadPixel(eventId);
      trackAction('gate_submit', { screen: screen.id, email: Boolean(email) }, result.lead.id);
      quiz.goNext(screen.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
      setBusy(false);
    }
  };

  return (
    <form id="sm-gate-form" onSubmit={submit} noValidate>
      <DnaCard chips={chips} title="Your Style DNA is ready" />
      <div style={{ marginTop: 26 }}>
        <Heading headingRef={headingRef} title="Where should we send it?" subtitle="Get your Style DNA and first look on WhatsApp." />
      </div>
      <div className={s.stack} style={{ marginTop: 22 }}>
        <label className={s.field}>
          <span className={s.fieldLabel}>WhatsApp number</span>
          <span className={s.phoneField}>
            <span className={s.phonePrefix}>+91</span>
            <input className={s.input} aria-label="WhatsApp number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={event => setPhone(event.target.value)} required aria-required="true" />
          </span>
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>First name <span className={s.small} style={{ fontWeight: 400 }}>(so your stylist can greet you)</span></span>
          <input className={s.input} aria-label="First name" type="text" autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} maxLength={40} />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Email <span className={s.small} style={{ fontWeight: 400 }}>(optional)</span></span>
          <input className={s.input} aria-label="Email (optional)" type="email" autoComplete="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <label className={s.consent}>
          <input type="checkbox" aria-label="Send my Style DNA and style tips on WhatsApp" checked={consent} onChange={event => setConsent(event.target.checked)} />
          <span>Yes, send my Style DNA and style tips on WhatsApp. I can stop anytime by replying STOP.</span>
        </label>
        <p className={s.fine} style={{ margin: 0 }}><Icon name="lock" size={13} /> We never share your number. <Link href="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link></p>
        {error ? <p className={s.error} role="alert">{error}</p> : null}
      </div>
      <CtaBar>
        <button type="submit" form="sm-gate-form" className={s.cta} disabled={!valid || busy}>
          {busy ? <Spinner /> : null} Send my Style DNA
        </button>
      </CtaBar>
    </form>
  );
}

// ── Optional selfie ─────────────────────────────────────────────────────────

function SelfieScreen({ headingRef, screen }: { screen: QuizScreen; headingRef: HeadingRef }) {
  const quiz = useQuiz();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const season = quiz.lead?.selfieSeason;

  const upload = async (file: File) => {
    if (!quiz.leadToken) {
      setError('Your session expired. Please go back and enter your number again.');
      setStatus('error');
      return;
    }
    setStatus('reading');
    setError(null);
    const form = new FormData();
    form.append('selfie', file);
    try {
      const response = await fetch('/api/style-membership/selfie', { method: 'POST', body: form, headers: { 'x-lead-token': quiz.leadToken } });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Please try another photo.');
      quiz.setLead(quiz.leadToken, data.lead);
      trackAction('selfie_read', { screen: screen.id, season: data.lead.selfieSeason?.name }, data.lead.id);
      setStatus('done');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try another photo.');
      setStatus('error');
    }
  };

  if (status === 'done' && season) {
    return (
      <>
        <p className={s.eyebrow}>Read from your selfie</p>
        <Heading headingRef={headingRef} title={`You’re a ${season.name}`} subtitle={season.line} />
        <div className={s.card} style={{ marginTop: 22 }}>
          <p className={s.h3} style={{ margin: '0 0 12px' }}>Your 6 best colours</p>
          <Swatches swatches={season.best} />
        </div>
        <CtaBar>
          <button type="button" className={s.cta} onClick={() => quiz.finish()}>{quiz.member ? 'Continue' : 'See my result'}</button>
        </CtaBar>
      </>
    );
  }

  return (
    <>
      <p className={s.eyebrow}>Optional · free</p>
      <Heading headingRef={headingRef} title="See your exact colour season" subtitle="One selfie in daylight, no filter. A photo reads your undertone far better than any quiz." />
      <div className={s.pairGrid} style={{ marginTop: 22 }}>
        <Photo src="/membership/skin-wheatish.webp" alt="Example: soft daylight on skin" ratio="11" sizes="240px" />
        <div className={s.card} style={{ display: 'grid', alignContent: 'center', gap: 8, fontSize: 14 }}>
          <span>☀️ Face a window</span>
          <span>🚫 No filter or makeup</span>
          <span>🙂 Face and neck in frame</span>
        </div>
      </div>
      <div className={s.notice} style={{ marginTop: 18 }}>
        <Icon name="shield" size={16} /> <strong>Your photo stays private.</strong> It is used only to read your colouring, kept privately, never shown to anyone or used in ads, and deleted after 30 days.
      </div>
      {error ? <p className={s.error} role="alert" style={{ marginTop: 12 }}>{error}</p> : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="user"
        className={s.srOnly}
        aria-label="Choose a selfie"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
      <CtaBar>
        <button type="button" className={s.cta} onClick={() => input.current?.click()} disabled={status === 'reading'}>
          {status === 'reading' ? <><Spinner /> Reading your undertone…</> : <><Icon name="camera" size={20} /> Take a selfie</>}
        </button>
        <button
          type="button"
          className={s.textButton}
          onClick={() => {
            trackAction('selfie_skipped', { screen: screen.id }, quiz.lead?.id);
            quiz.finish();
          }}
        >
          I’ll do it later
        </button>
      </CtaBar>
    </>
  );
}
