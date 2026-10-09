'use client';

// The warm, price-first sales page for the Instagram bio link (/sm/bio). Prices
// are on the first screen; she pays, then takes the quiz and meets her stylist
// on WhatsApp (the Findies "bio funnel" order, with India's dark-pattern rules).

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_PLANS, STYLIST, perDay, rupees } from '@/lib/styleMembershipConfig';
import { postJson, trackAction, trackScreen } from './client';
import { ChatDemo, ClientProof, CohortLine, Guarantee, MembershipFaq, PlanPicker, PriceCompare, usePaywall, type CheckoutContact } from './Paywall';
import { Icon, Photo, TopBar, cx } from './ui';
import s from './membership.module.css';

const STEPS = [
  { title: 'Join, then a 3-minute quiz and a selfie', body: 'Your life, your shape, your occasions. One daylight selfie reads your colour season.', image: '/membership/whatsapp-lifestyle.webp' },
  { title: 'Your Style Plan within 24 hours', body: 'Your colours, what flatters your shape, and about 20 outfits for your real calendar, checked by an ICONIK stylist.', image: '/membership/flat-office-kurta.webp' },
  { title: 'Ask anything, any day, on WhatsApp', body: 'Outfit checks before you leave, “should I buy this?”, wedding functions, sale picks. A new drop of 8 looks every month.', image: '/membership/chat-outfit-check.webp' },
];

export function JoinView() {
  const [founding, setFounding] = useState(false);
  const [contact, setContact] = useState<CheckoutContact>({ phone: '', firstName: '', email: '', consent: false });
  const offerFounding = useRef(false);
  const paywall = usePaywall({ leadToken: null, foundingEligible: founding, source: 'sales' });
  const plansRef = useRef<HTMLElement>(null);
  const [plansVisible, setPlansVisible] = useState(false);
  const subscribe = MEMBERSHIP_PLANS.subscribe;

  useEffect(() => {
    offerFounding.current = new URLSearchParams(window.location.search).get('offer') === 'founding';
    trackScreen('join', 0, null);
  }, []);

  // Past clients arriving from the founding email see their price once their number matches an order.
  useEffect(() => {
    if (!offerFounding.current) return;
    const digits = contact.phone.replace(/\D+/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) return;
    const timer = window.setTimeout(() => {
      postJson<{ eligible: boolean }>('/api/style-membership/eligibility', { phone: digits, email: contact.email })
        .then(data => setFounding(data.eligible))
        .catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [contact.phone, contact.email]);

  useEffect(() => {
    const target = plansRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPlansVisible(entry.isIntersecting);
      if (entry.isIntersecting) trackScreen('join_plans', 1, null);
    }, { threshold: 0.15 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const toPlans = (from: string) => {
    trackAction('join_cta', { screen: 'join', from });
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <TopBar />
      <main className={s.page}>
        <div className={s.screen} style={{ paddingBottom: 120 }}>
          <p className={s.eyebrow}>ICONIK Style Membership</p>
          <h1 className={s.h1}>Your personal stylist, on WhatsApp</h1>
          <p className={s.lede}>Your colours, your body shape and outfits for your real calendar, starting from what’s already in your almirah. Then ask anything, any day.</p>
          <div style={{ marginTop: 18 }}>
            <Photo src="/membership/sales-hero.webp" alt="An Indian woman in an ivory linen co-ord smiling at her phone" ratio="11" priority />
          </div>
          <div className={s.card} style={{ marginTop: 16 }}>
            <div className={s.row} style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className={s.h3}>Membership</span>
              <span><span className={s.h2} style={{ fontSize: 26 }}>{rupees(subscribe.pricePaise)}</span> <span className={s.small}>/ 3 months</span></span>
            </div>
            <p className={s.small} style={{ margin: '4px 0 14px' }}>About {perDay(subscribe.pricePaise)} a day · or {rupees(MEMBERSHIP_PLANS.one_time.pricePaise)} once, no renewal</p>
            <button type="button" className={s.cta} onClick={() => toPlans('hero')}>Choose my plan</button>
            <p className={s.fine} style={{ margin: '10px 0 0', textAlign: 'center' }}>Love your first 3 looks or a full refund within 7 days</p>
          </div>
          <div style={{ marginTop: 16 }}><CohortLine /></div>

          <section className={s.section} aria-labelledby="stylist-title">
            <div className={s.row} style={{ alignItems: 'flex-start' }}>
              <span style={{ position: 'relative', width: 72, height: 72, borderRadius: 999, overflow: 'hidden', flex: 'none', background: 'var(--soft)' }}>
                <Image src={STYLIST.portrait} alt={`${STYLIST.name}, ICONIK stylist`} fill sizes="72px" style={{ objectFit: 'cover', objectPosition: 'top' }} />
              </span>
              <div>
                <h2 id="stylist-title" className={s.h2} style={{ fontSize: 24 }}>Hi, I’m {STYLIST.name}</h2>
                <p className={s.small} style={{ margin: '4px 0 0' }}>{STYLIST.role}</p>
              </div>
            </div>
            <p style={{ margin: '14px 0 0' }}>
              Most women I style don’t need more clothes. They need to know which of their clothes work, and why. I’ll never push you into trends that aren’t you, or into dressing “older” or “safer” than you want.
            </p>
            <p className={s.small} style={{ margin: '10px 0 0' }}>
              Your day-to-day stylist on WhatsApp is an AI trained on the ICONIK method, so she answers in minutes. Our human stylists check your Style Plan and step in whenever you need a person.
            </p>
          </section>

          <section className={s.section} aria-labelledby="how-title">
            <h2 id="how-title" className={s.h2} style={{ marginBottom: 16 }}>How it works</h2>
            <ol className={s.stack} style={{ listStyle: 'none', margin: 0, padding: 0, gap: 14 }}>
              {STEPS.map((step, index) => (
                <li key={step.title} className={s.card} style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 14, alignItems: 'center', padding: 12 }}>
                  <span style={{ position: 'relative', width: 84, height: 84, borderRadius: 12, overflow: 'hidden', background: 'var(--soft)' }}>
                    <Image src={step.image} alt="" fill sizes="84px" style={{ objectFit: 'cover' }} />
                  </span>
                  <span>
                    <span className={s.small} style={{ display: 'block' }}>Step {index + 1}</span>
                    <span className={s.h3} style={{ display: 'block' }}>{step.title}</span>
                    <span className={s.small} style={{ display: 'block', marginTop: 4 }}>{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className={s.section} aria-labelledby="get-title">
            <h2 id="get-title" className={s.h2} style={{ marginBottom: 14 }}>What you get</h2>
            <div className={s.stack}>
              <div className={s.card}>
                <h3 className={s.h3}>Day 1: your Style Plan</h3>
                <ul className={s.small} style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  <li>Your colour season from a selfie, with best and worst colours</li>
                  <li>Your body shape: sleeves, necklines, kurta lengths and trouser rises that flatter it</li>
                  <li>About 20 outfits for your real calendar, the first 3 shown on you</li>
                  <li>A shopping list in your size and budget, starting from what you own</li>
                </ul>
              </div>
              <div className={s.card}>
                <h3 className={s.h3}>Every month after that</h3>
                <ul className={s.small} style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  <li>A drop of 8 looks for what’s coming up: festivals, weddings, office, travel</li>
                  <li>Unlimited “ask before you buy”: send a link, get a yes or a better option</li>
                  <li>Outfit checks before you leave the house</li>
                  <li>Sale picks during the big Myntra and AJIO sales, filtered to you</li>
                </ul>
              </div>
            </div>
          </section>

          <section className={s.section} aria-labelledby="chat-title">
            <h2 id="chat-title" className={s.h2} style={{ marginBottom: 14 }}>What it feels like</h2>
            <ChatDemo />
          </section>

          <section className={s.section} ref={plansRef} id="plans" aria-labelledby="plans-title">
            <h2 id="plans-title" className={s.h2} style={{ marginBottom: 16 }}>Choose your plan</h2>
            <PlanPicker state={paywall} id="join-plans" contact={{ value: contact, onChange: setContact }} ctaLabel="Join" />
            <p className={s.fine} style={{ marginTop: 10 }}>After paying you’ll take the 3-minute quiz, then meet your stylist on WhatsApp.</p>
          </section>

          <section className={s.section}><Guarantee /></section>
          <section className={s.section} aria-labelledby="money-title">
            <h2 id="money-title" className={s.h2} style={{ marginBottom: 14 }}>Less than one stylist session, all year</h2>
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
        </div>
      </main>
      <div className={cx(s.stickyUnlock, plansVisible && s.stickyHidden)} aria-hidden={plansVisible}>
        <div className={s.ctaBarInner}>
          <button type="button" className={s.cta} tabIndex={plansVisible ? -1 : 0} onClick={() => toPlans('sticky')}>
            Join · {rupees(subscribe.pricePaise)} / 3 months <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
