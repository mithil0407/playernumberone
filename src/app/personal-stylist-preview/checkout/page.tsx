'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { CLIENT_PROOF } from '@/lib/siteFacts';
import {
  MEMBERSHIP,
  blueprintIncludes,
  formatINR,
  membershipIncludes,
  monthlyLooks,
  priorities,
  validPlan,
  validPriority,
  type Plan,
  type Priority,
} from '../offer';
import s from '../membership.module.css';

const proofShots = [1, 2, 3, 4, 5].map(n => `/text${n}.webp`);

function nextBillingDate() {
  const today = new Date();
  const next = new Date(today);
  next.setMonth(today.getMonth() + 1);
  // Clamp 31 Jan → 28/29 Feb rather than rolling into March.
  if (next.getDate() !== today.getDate()) next.setDate(0);
  return next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function CheckoutContent() {
  const query = useSearchParams();
  const [plan, setPlan] = useState<Plan>(validPlan(query.get('plan')));
  const [priority, setPriority] = useState<Priority>(validPriority(query.get('priority')));
  const [consent, setConsent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [shot, setShot] = useState(0);
  const [renewalDate, setRenewalDate] = useState('');

  const monthly = plan === 'monthly';
  const selected = priorities.find(p => p.id === priority)!;
  const due = formatINR(monthly ? MEMBERSHIP.price : MEMBERSHIP.blueprintPrice);
  const price = formatINR(MEMBERSHIP.price);
  const blueprintPrice = formatINR(MEMBERSHIP.blueprintPrice);

  useEffect(() => setRenewalDate(nextBillingDate()), []);

  const choosePlan = (next: Plan) => {
    setPlan(next);
    setConsent(false);
  };

  const header = (
    <div className={s.top}>
      <div className={s.previewBar}><strong>Design preview</strong><span>· No payment or subscription will be created</span></div>
      <nav className={s.nav} aria-label="Checkout">
        <div className={`${s.container} ${s.navInner}`}>
          <Link href="/personal-stylist-preview" className={s.navBack}><ArrowLeft size={15} /> Back</Link>
          <span className={s.wordmark}>ICONIK</span>
        </div>
      </nav>
    </div>
  );

  if (complete) {
    const successSteps = monthly
      ? [
          ['01', 'Share a little about you', 'A short intake: a few photos, your budget, comfort preferences and what’s coming up.'],
          ['02', 'Get your first two looks', `Within ${MEMBERSHIP.firstLookWorkingDays} working days of your intake — ${selected.first.toLowerCase()}.`],
          ['03', 'Meet your stylist', `Book your monthly call, then use your remaining requests, ${MEMBERSHIP.quickChecks} quick checks and ${MEMBERSHIP.checkIns} check-ins.`],
        ]
      : [
          ['01', 'Share your preferences', 'Complete your intake and schedule your consultation.'],
          ['02', 'Talk to your stylist', `Spend ${MEMBERSHIP.callMinutes} minutes discussing your needs, comfort and goals.`],
          ['03', 'Receive your Blueprint', `Your 20-outfit guide arrives within ${MEMBERSHIP.blueprintDeliveryWorkingDays} working days of the call.`],
        ];

    return (
      <div className={s.page}>
        {header}
        <main className={`${s.container} ${s.checkoutMain}`}>
          <div className={s.success}>
            <div className={s.successIcon}><Check size={26} /></div>
            <div className={s.micro}>{monthly ? 'Your first month' : 'Your Blueprint'} · Preview</div>
            <h1 className={s.checkoutTitle} style={{ marginTop: '0.9rem' }}>
              {monthly ? <>Your stylist is <span className={s.serif}>on the way.</span></> : <>Your Blueprint <span className={s.serif}>starts here.</span></>}
            </h1>
            <div className={`${s.glass} ${s.successSteps}`}>
              {successSteps.map(([n, title, text]) => (
                <div key={n} className={s.successStep}>
                  <span>{n}</span>
                  <div><h2>{title}</h2><p>{text}</p></div>
                </div>
              ))}
            </div>
            <p className={s.notice}>This is a design preview. No payment was taken, no subscription was created and your details were not saved or sent.</p>
            <Link href="/personal-stylist-preview" className={s.cta}>Back to the membership <ArrowRight size={17} /></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {header}
      <main className={`${s.container} ${s.checkoutMain}`}>
        <div className={s.checkoutIntro}>
          <div className={s.micro}>Secure checkout · Preview</div>
          <h1 className={s.checkoutTitle}>
            {monthly ? <>Start Your <span className={s.serif}>Personal Stylist</span></> : <>Complete Your <span className={s.serif}>Style Blueprint</span></>}
          </h1>
          <p>{monthly ? `Two looks within ${MEMBERSHIP.firstLookWorkingDays} working days, then a stylist on call all month.` : 'A one-time consultation and 20-outfit guide.'}</p>
        </div>

        <section className={`${s.glass} ${s.proof}`} aria-label="Client WhatsApp messages">
          <div className={s.proofShot} aria-live="polite">
            {proofShots.map((src, index) => (
              <div key={src} style={{ opacity: index === shot ? 1 : 0 }} aria-hidden={index !== shot}>
                <Image src={src} alt="WhatsApp feedback from an ICONIK client" fill sizes="120px" priority={index === 0} />
              </div>
            ))}
          </div>
          <div>
            <div className={s.micro}>Client messages</div>
            <h2 className={s.proofTitle}>What our clients sent us</h2>
            <p className={s.proofText}>WhatsApp feedback from women after working with ICONIK stylists.</p>
            <div className={s.proofNav}>
              <button type="button" className={s.iconBtn} onClick={() => setShot((shot - 1 + proofShots.length) % proofShots.length)} aria-label="Previous client message"><ChevronLeft size={16} /></button>
              <span>{shot + 1}/{proofShots.length}</span>
              <button type="button" className={s.iconBtn} onClick={() => setShot((shot + 1) % proofShots.length)} aria-label="Next client message"><ChevronRight size={16} /></button>
            </div>
          </div>
        </section>

        <form
          className={s.checkoutGrid}
          onSubmit={event => {
            event.preventDefault();
            setComplete(true);
            window.scrollTo({ top: 0 });
          }}
        >
          <div className={s.formStack}>
            <section className={`${s.glass} ${s.panel}`}>
              <div className={s.panelHead}>
                <div className={s.micro}>Step 1</div>
                <h2 className={s.panelTitle}>Your plan</h2>
              </div>
              {monthly ? (
                <>
                  <div className={s.planCard}>
                    <span className={s.planCheck}><Check size={14} /></span>
                    <span className={s.planInfo}>
                      <span className={s.badge}>Recommended</span>
                      <strong>{MEMBERSHIP.name}</strong>
                      <span>{monthlyLooks} looks · monthly call · WhatsApp second opinions</span>
                    </span>
                    <span className={s.planPrice}>{price}<small>per month</small></span>
                  </div>
                  <button type="button" className={s.switchLink} onClick={() => choosePlan('blueprint')}>
                    Only need a one-time guide? Switch to Style Blueprint ({blueprintPrice} once)
                  </button>
                </>
              ) : (
                <>
                  <div className={s.planCard}>
                    <span className={s.planCheck}><Check size={14} /></span>
                    <span className={s.planInfo}>
                      <strong>Style Blueprint</strong>
                      <span>One consultation · 20 outfit formulas · no ongoing support</span>
                    </span>
                    <span className={s.planPrice}>{blueprintPrice}<small>one payment</small></span>
                  </div>
                  <div className={s.nudge}>
                    <strong>Pay {formatINR(MEMBERSHIP.blueprintPrice - MEMBERSHIP.price)} less today and get a stylist for the month</strong>
                    <p>{monthlyLooks} looks made for your plans, a monthly video call and WhatsApp second opinions. {price} for your first month; cancel before renewal.</p>
                    <button type="button" className={s.nudgeBtn} onClick={() => choosePlan('monthly')}>Switch to Personal Stylist <ArrowRight size={14} /></button>
                  </div>
                </>
              )}
            </section>

            <section className={`${s.glass} ${s.panel}`}>
              <div className={s.panelHead}>
                <div className={s.micro}>Step 2</div>
                <h2 className={s.panelTitle}>Where should your stylist reach you?</h2>
              </div>
              <div className={s.fields}>
                <label className={`${s.field} ${s.fieldFull}`}>
                  Your name
                  <input className={s.input} name="name" autoComplete="name" required maxLength={100} />
                </label>
                <label className={s.field}>
                  Email address
                  <input className={s.input} name="email" type="email" autoComplete="email" required maxLength={254} />
                </label>
                <label className={s.field}>
                  WhatsApp number
                  <span className={s.phoneWrap}>
                    <span className={s.phonePrefix}>+91</span>
                    <input className={s.input} name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" pattern="[0-9]{10}" maxLength={10} required />
                  </span>
                </label>
              </div>
              <p className={s.fieldNote}>Used only for your intake, scheduling and styling support.</p>
            </section>

            {monthly && (
              <section className={`${s.glass} ${s.panel}`}>
                <div className={s.panelHead}>
                  <div className={s.micro}>Step 3</div>
                  <h2 className={s.panelTitle}>What should we work on first?</h2>
                </div>
                <div className={s.chips}>
                  {priorities.map(p => (
                    <button key={p.id} type="button" aria-pressed={priority === p.id} className={`${s.chip} ${priority === p.id ? s.chipOn : ''}`} onClick={() => setPriority(p.id)}>{p.short}</button>
                  ))}
                </div>
                <p className={s.focusNote}><strong>Your first win:</strong> {selected.first.toLowerCase()}, within {MEMBERSHIP.firstLookWorkingDays} working days of intake.</p>
              </section>
            )}

            <section className={`${s.glass} ${s.panel}`}>
              <div className={s.totalRows}>
                <div className={`${s.totalRow} ${s.totalDue}`}><span>Due today</span><strong>{due}</strong></div>
                {monthly
                  ? <div className={s.totalRow}><span>Then</span><strong>{price} on {renewalDate || 'the same date next month'}</strong></div>
                  : <div className={s.totalRow}><span>Recurring charges</span><strong>None</strong></div>}
              </div>
              <label className={s.consent}>
                <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required />
                {monthly
                  ? <span>I understand membership is {price} today and {price} each calendar month until I cancel, and that I can cancel before my next billing date. This preview does not authorise a payment.</span>
                  : <span>I understand the Style Blueprint is a one-time {blueprintPrice} purchase with no recurring charges. This preview does not authorise a payment.</span>}
              </label>
              <button type="submit" className={`${s.cta} ${s.submit}`}>
                <Lock size={16} /> {monthly ? `Start My Membership — ${price}` : `Get My Blueprint — ${blueprintPrice}`}
              </button>
              <div className={s.trustGrid}>
                <span><ShieldCheck size={13} /> Preview only · no charge</span>
                <span><ShieldCheck size={13} /> {monthly ? 'No minimum term' : 'One-time payment'}</span>
                <span><ShieldCheck size={13} /> {monthly ? 'Cancel before any renewal' : 'Revisions within your brief'}</span>
                <span><ShieldCheck size={13} /> Replies Monday to Friday</span>
              </div>
            </section>
          </div>

          <aside className={`${s.glass} ${s.summary}`}>
            <div className={s.summaryProduct}>
              <div className={s.summaryImage}>
                <Image src={monthly ? selected.image : '/report-preview-1.webp'} alt="" fill sizes="84px" />
              </div>
              <div>
                <div className={s.micro}>Your {monthly ? 'membership' : 'package'}</div>
                <h2 className={s.summaryName}>{monthly ? MEMBERSHIP.name : 'ICONIK Style Blueprint'}</h2>
                <p className={s.summaryPrice}><strong>{due}</strong> {monthly ? '/ month' : 'once'}</p>
              </div>
            </div>
            <ul className={s.summaryList}>
              {(monthly ? membershipIncludes : blueprintIncludes).map(item => <li key={item}><Check size={15} />{item}</li>)}
            </ul>
            <div className={s.summaryProof}>
              <strong>Trusted by {CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ clients</strong>
              <span>Personal styling across {CLIENT_PROOF.countriesServed}+ countries</span>
            </div>
            <div className={s.nextSteps}>
              <div className={s.micro}>What happens next</div>
              <ol>
                {(monthly
                  ? ['Share your photos, budget and first priority.', `Receive your first two looks within ${MEMBERSHIP.firstLookWorkingDays} working days.`, 'Meet your stylist and plan the month.']
                  : ['Complete your personal intake.', `Schedule your ${MEMBERSHIP.callMinutes}-minute stylist call.`, 'Receive your full Style Blueprint.']
                ).map(step => <li key={step}>{step}</li>)}
              </ol>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}

export default function MembershipCheckoutPreview() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
