'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_PLANS, rupees } from '@/lib/styleMembershipConfig';
import {
  SHAPES,
  dnaChips,
  likelySeason,
  resolveShape,
  resultLooks,
  styleArchetype,
  weddingFunctionCount,
} from '@/lib/styleMembershipLogic';
import { postJson, readStore, trackAction, trackScreen } from './client';
import type { PublicLead } from './QuizProvider';
import { Icon, Photo, Swatches, TopBar, cx } from './ui';
import { ChatDemo, ClientProof, CohortLine, Guarantee, MembershipFaq, PlanPicker, PriceCompare, usePaywall } from './Paywall';
import s from './membership.module.css';

export function ResultView() {
  const [token, setToken] = useState<string | null>(null);
  const [lead, setLead] = useState<PublicLead | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [foundingEligible, setFoundingEligible] = useState(false);

  useEffect(() => {
    const stored = readStore<string | null>('lead', null);
    if (!stored) {
      setState('missing');
      return;
    }
    setToken(stored);
    fetch('/api/style-membership/lead', { headers: { 'x-lead-token': stored } })
      .then(response => response.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error);
        setLead(data.lead);
        setState('ready');
      })
      .catch(() => setState('missing'));
    postJson<{ eligible: boolean }>('/api/style-membership/eligibility', {}, { 'x-lead-token': stored })
      .then(data => setFoundingEligible(data.eligible))
      .catch(() => undefined);
  }, []);

  // Her own look 1 is generated now, once, and only because she reached this page.
  useEffect(() => {
    if (!token || !lead || lead.lookStatus !== 'none') return;
    postJson<{ lead: PublicLead }>('/api/style-membership/look', {}, { 'x-lead-token': token })
      .then(data => setLead(data.lead))
      .catch(() => undefined);
    setLead(current => (current ? { ...current, lookStatus: 'generating' } : current));
  }, [token, lead]);

  useEffect(() => {
    if (state === 'ready') trackScreen('result', 0, null, lead?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === 'loading') return <div className={s.page} style={{ minHeight: '100dvh' }} aria-busy="true" />;
  if (state === 'missing' || !lead) {
    return (
      <>
        <TopBar />
        <main className={s.page}>
          <div className={s.screen}>
            <h1 className={s.h1}>Let’s find your style</h1>
            <p className={s.lede}>We couldn’t find your quiz on this device. It takes 3 minutes.</p>
            <Link href="/style-membership" className={s.cta} style={{ marginTop: 24 }}>Start the quiz</Link>
          </div>
        </main>
      </>
    );
  }
  return <Result lead={lead} token={token} foundingEligible={foundingEligible} />;
}

function Result({ lead, token, foundingEligible }: { lead: PublicLead; token: string | null; foundingEligible: boolean }) {
  const answers = lead.answers;
  const name = lead.firstName;
  const season = lead.selfieSeason ?? likelySeason(answers);
  const fromSelfie = Boolean(lead.selfieSeason);
  const shape = resolveShape(answers);
  const archetype = styleArchetype(answers);
  const looks = resultLooks(answers);
  const chips = dnaChips(answers, lead.selfieSeason?.name);
  const functions = weddingFunctionCount(answers);
  const paywall = usePaywall({ leadToken: token, foundingEligible, source: 'result', leadId: lead.id });
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const seenPaywall = useRef(false);

  useEffect(() => {
    const target = pickerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPickerVisible(entry.isIntersecting);
      if (entry.isIntersecting && !seenPaywall.current) {
        seenPaywall.current = true;
        trackScreen('paywall', 0, null, lead.id);
      }
    }, { threshold: 0.2 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [lead.id]);

  const firstLook = looks[0];
  const lookImage = lead.lookStatus === 'ready' && lead.lookUrl ? lead.lookUrl : firstLook.image;
  const plan = MEMBERSHIP_PLANS[paywall.plan];

  return (
    <>
      <TopBar />
      <main className={s.page}>
        <div className={s.screen} style={{ paddingBottom: 120 }}>
          <CohortLine />

          <section style={{ marginTop: 22 }} aria-labelledby="season-title">
            <p className={s.eyebrow}>{fromSelfie ? 'Read from your selfie' : 'From your answers'}</p>
            <h1 id="season-title" className={s.h1}>
              {name ? `${name}, you’re ` : 'You’re '}{fromSelfie ? 'a' : 'most likely a'} {season?.name ?? 'warm season'}
            </h1>
            {season ? <p className={s.lede}>{season.line}</p> : null}
            {season ? (
              <div className={s.card} style={{ marginTop: 18 }}>
                <p className={s.h3} style={{ margin: '0 0 12px' }}>Your best colours</p>
                <Swatches swatches={season.best} />
                <p className={s.h3} style={{ margin: '18px 0 10px', fontSize: 15 }}>Keep away from your face</p>
                <Swatches swatches={season.avoid} size="sm" />
                <p className={s.small} style={{ margin: '14px 0 0' }}>
                  Metal: <strong>{season.metal === 'both' ? 'gold and silver both work' : season.metal}</strong>
                  {!fromSelfie ? ' · a selfie in WhatsApp confirms your exact season.' : ''}
                </p>
              </div>
            ) : null}
            <div className={s.pairGrid}>
              {shape ? (
                <div className={s.card}>
                  <p className={s.small} style={{ margin: 0 }}>Body shape</p>
                  <p className={s.h3} style={{ margin: '4px 0 6px' }}>{SHAPES[shape].label}</p>
                  <p className={s.small} style={{ margin: 0 }}>{SHAPES[shape].rule}</p>
                </div>
              ) : null}
              <div className={s.card}>
                <p className={s.small} style={{ margin: 0 }}>Your style</p>
                <p className={s.h3} style={{ margin: '4px 0 6px' }}>{archetype.name}</p>
                <p className={s.small} style={{ margin: 0 }}>{archetype.line.split('.')[0]}.</p>
              </div>
            </div>
          </section>

          <section className={s.section} aria-labelledby="look-title">
            <p className={s.eyebrow}>Look 1 of 20 · unlocked</p>
            <h2 id="look-title" className={s.h2}>{firstLook.title}</h2>
            <div style={{ marginTop: 14 }}>
              <Photo
                src={lookImage}
                alt={lead.lookStatus === 'ready' ? `Your look 1, ${firstLook.title}, generated for your tone and shape` : `Look 1: ${firstLook.detail}`}
                className={lead.lookStatus === 'generating' ? s.shimmer : undefined}
                priority
              />
            </div>
            <p className={s.small} style={{ margin: '10px 0 0' }}>
              {lead.lookStatus === 'ready'
                ? 'Made for your skin tone, shape and colours. In WhatsApp we show looks on you.'
                : lead.lookStatus === 'generating'
                  ? 'Making this look in your colours, on a model with your tone and shape…'
                  : firstLook.detail}
            </p>
          </section>

          <section className={s.section} aria-labelledby="plan-title">
            <p className={s.eyebrow}>{name ? `${name}’s` : 'Your'} Style Plan · 20 looks</p>
            <h2 id="plan-title" className={s.h2}>Already built. It just needs you to walk in.</h2>
            <div className={s.chips} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0 16px' }}>
              {chips.map(chip => <span key={chip.key} className={s.chip}>{chip.label}</span>)}
            </div>
            <div className={s.lookGrid}>
              {looks.slice(1).map(look => (
                <div key={look.id} className={s.lookTile}>
                  <Image src={look.image} alt="" fill sizes="33vw" className={s.blur} style={{ objectFit: 'cover' }} />
                  <span className={s.lock}><span className={s.lockBadge}><Icon name="lock" size={12} /></span></span>
                  <span className={s.lookTitle}>{look.title}</span>
                </div>
              ))}
            </div>
            {functions > 1 ? (
              <div className={cx(s.card)} style={{ marginTop: 14, position: 'relative', overflow: 'hidden' }}>
                <p className={s.h3} style={{ margin: 0 }}>Your wedding plan: {functions === 4 ? '4+' : functions} functions, 0 repeats</p>
                <p className={cx(s.small, s.blur)} style={{ margin: '6px 0 0' }} aria-hidden>Mehendi: mustard sharara with mirror work · Sangeet: emerald saree, gold temple jhumkas · Wedding: rani pink lehenga</p>
                <span className={s.srOnly}>Locked until you join.</span>
              </div>
            ) : null}
          </section>

          <section className={s.section} ref={pickerRef} id="plans" aria-labelledby="join-title">
            <h2 id="join-title" className={s.h2}>Unlock all 20 looks and your stylist on WhatsApp</h2>
            <p className={s.lede} style={{ marginBottom: 20 }}>Your colours and shape in every look, a new drop every month, and “ask before you buy” whenever you shop.</p>
            <PlanPicker state={paywall} id="plans-top" />
          </section>

          <section className={s.section}><Guarantee /></section>

          <section className={s.section} aria-labelledby="chat-title">
            <h2 id="chat-title" className={s.h2} style={{ marginBottom: 14 }}>What having a stylist on WhatsApp feels like</h2>
            <ChatDemo />
          </section>

          <section className={s.section} aria-labelledby="money-title">
            <h2 id="money-title" className={s.h2} style={{ marginBottom: 14 }}>Let’s talk money</h2>
            <PriceCompare planId={paywall.plan} />
          </section>

          <section className={s.section} aria-labelledby="proof-title">
            <h2 id="proof-title" className={s.h2} style={{ marginBottom: 14 }}>Real ICONIK clients</h2>
            <ClientProof />
          </section>

          <section className={s.section} aria-labelledby="faq-title">
            <h2 id="faq-title" className={s.h2} style={{ marginBottom: 6 }}>Questions</h2>
            <MembershipFaq />
          </section>

          <section className={s.section} aria-labelledby="join-again-title">
            <h2 id="join-again-title" className={s.h2} style={{ marginBottom: 16 }}>Your plan is ready</h2>
            <PlanPicker state={paywall} id="plans-bottom" showBumps={false} />
          </section>
        </div>
      </main>
      <div className={cx(s.stickyUnlock, pickerVisible && s.stickyHidden)} aria-hidden={pickerVisible}>
        <div className={s.ctaBarInner}>
          <button
            type="button"
            className={s.cta}
            tabIndex={pickerVisible ? -1 : 0}
            onClick={() => {
              trackAction('unlock_tap', { screen: 'result' }, lead.id);
              document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Unlock all 20 looks · {rupees(plan.pricePaise)}
          </button>
        </div>
      </div>
    </>
  );
}
