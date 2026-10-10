'use client';

// The Style Membership paywall pieces, in the blueprint's order: real cohort
// line, plan picker (subscription pre-selected) with plain renewal terms next
// to the button, order bumps ticked before payment, the guarantee, a WhatsApp
// chat demo, the price comparison, real client proof and the FAQ. Every price
// comes from styleMembershipConfig.ts.

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { trackPurchase } from '@/lib/metaPixel';
import {
  DEFAULT_PLAN,
  FOUNDING_COHORT,
  GUARANTEE,
  MEMBERSHIP_BUMPS,
  MEMBERSHIP_BUMP_ORDER,
  MEMBERSHIP_CONTENT_NAME,
  MEMBERSHIP_FUNNEL_CATEGORY,
  MEMBERSHIP_NOTES_PRODUCT,
  MEMBERSHIP_PLANS,
  STYLIST_SESSION_RANGE,
  cohortOpen,
  membershipContentIds,
  perDay,
  priceMembershipOrder,
  renewalTerms,
  rupees,
  subscriptionSavingPercent,
  type MembershipBumpId,
  type MembershipPlanId,
} from '@/lib/styleMembershipConfig';
import { attribution, newEventId, openRazorpay, postJson, trackAction, trackInitiateCheckoutPixel, writeStore } from './client';
import { Icon, Monogram, Spinner, cx } from './ui';
import s from './membership.module.css';

export interface CheckoutContact {
  phone: string;
  firstName: string;
  email: string;
  consent: boolean;
}

export interface PaywallState {
  plan: MembershipPlanId;
  setPlan: (plan: MembershipPlanId) => void;
  bumps: MembershipBumpId[];
  toggleBump: (bump: MembershipBumpId) => void;
  plans: MembershipPlanId[];
  busy: boolean;
  error: string | null;
  checkout: (contact?: CheckoutContact) => Promise<void>;
}

/** Shared state for the two plan pickers on a page, and the checkout itself. */
export function usePaywall(options: { leadToken: string | null; foundingEligible: boolean; source: 'result' | 'sales'; leadId?: string | null }): PaywallState {
  const router = useRouter();
  const plans: MembershipPlanId[] = options.foundingEligible && cohortOpen() ? ['founding', 'one_time'] : ['subscribe', 'one_time'];
  const [plan, setPlanState] = useState<MembershipPlanId>(options.foundingEligible && cohortOpen() ? 'founding' : DEFAULT_PLAN);
  const [bumps, setBumps] = useState<MembershipBumpId[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activePlan = plans.includes(plan) ? plan : plans[0];

  const setPlan = (next: MembershipPlanId) => {
    setPlanState(next);
    trackAction('plan_selected', { screen: 'paywall', plan: next, source: options.source }, options.leadId);
  };
  const toggleBump = (bump: MembershipBumpId) => {
    setBumps(current => {
      const next = current.includes(bump) ? current.filter(item => item !== bump) : [...current, bump];
      trackAction('bump_toggled', { screen: 'paywall', bump, on: next.includes(bump) }, options.leadId);
      return next;
    });
  };

  const checkout = async (contact?: CheckoutContact) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const order = priceMembershipOrder(activePlan, bumps);
    const eventId = newEventId('InitiateCheckout');
    try {
      const data = await postJson<{
        key: string;
        razorpayOrderId: string;
        amountPaise: number;
        membershipId: string;
        memberCode: string;
        leadToken: string | null;
        prefill: Record<string, string>;
      }>('/api/style-membership/checkout', {
        plan: activePlan,
        bumps,
        expectedTotalPaise: order.totalPaise,
        attribution: attribution(),
        eventId,
        ...(contact ? { phone: contact.phone, firstName: contact.firstName, email: contact.email, consent: contact.consent } : {}),
      }, options.leadToken ? { 'x-lead-token': options.leadToken } : {});

      const contentIds = membershipContentIds(activePlan, bumps);
      trackInitiateCheckoutPixel(eventId, {
        value: order.totalPaise / 100,
        currency: 'INR',
        content_type: 'product',
        content_name: MEMBERSHIP_CONTENT_NAME,
        content_ids: contentIds,
        num_items: contentIds.length,
        content_category: MEMBERSHIP_FUNNEL_CATEGORY,
      });
      trackAction('checkout_open', { screen: 'paywall', plan: activePlan, bumps: bumps.join(','), total: order.totalPaise, source: options.source }, options.leadId);
      const session = { membershipId: data.membershipId, code: data.memberCode, leadToken: data.leadToken ?? options.leadToken };
      writeStore('member', session);
      if (data.leadToken) writeStore('lead', data.leadToken);

      const response = await openRazorpay({
        key: data.key,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: 'INR',
        name: 'ICONIK',
        description: order.plan.name,
        prefill: data.prefill,
        notes: { product: MEMBERSHIP_NOTES_PRODUCT, membership_id: data.membershipId },
      });
      await postJson('/api/style-membership/confirm', { ...response, membershipId: data.membershipId });
      trackPurchase(order.totalPaise / 100, MEMBERSHIP_CONTENT_NAME, contentIds, contentIds.length, 'INR', MEMBERSHIP_FUNNEL_CATEGORY, response.razorpay_payment_id, response.razorpay_payment_id);
      trackAction('purchase', { screen: 'paywall', plan: activePlan, total: order.totalPaise, source: options.source }, options.leadId);
      router.push(`/style-membership/welcome?m=${encodeURIComponent(data.membershipId)}&c=${encodeURIComponent(data.memberCode)}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Please try again.';
      if (message !== 'dismissed') setError(message);
      else trackAction('checkout_dismissed', { screen: 'paywall', plan: activePlan }, options.leadId);
      setBusy(false);
    }
  };

  return { plan: activePlan, setPlan, bumps, toggleBump, plans, busy, error, checkout };
}

export function CohortLine() {
  if (!cohortOpen()) return null;
  return (
    <p className={s.cohort}>
      <span className={s.cohortDot} aria-hidden />
      {FOUNDING_COHORT.name} · joining closes {FOUNDING_COHORT.closesLabel}
    </p>
  );
}

export function PlanPicker({ state, id, showBumps = true, contact, ctaLabel = 'Start my membership' }: {
  state: PaywallState;
  id: string;
  showBumps?: boolean;
  /** The sales page collects her number here (the quiz already has it). */
  contact?: { value: CheckoutContact; onChange: (next: CheckoutContact) => void };
  ctaLabel?: string;
}) {
  const order = priceMembershipOrder(state.plan, state.bumps);
  const saving = subscriptionSavingPercent();
  const contactValid = !contact || (/^[6-9]\d{9}$/.test(contact.value.phone.replace(/\D+/g, '').slice(-10)) && contact.value.consent);

  return (
    <div className={s.stack} style={{ gap: 14 }}>
      <div className={s.stack} role="radiogroup" aria-label="Choose your plan" style={{ gap: 16 }}>
        {state.plans.map(planId => {
          const plan = MEMBERSHIP_PLANS[planId];
          const selected = state.plan === planId;
          const badge = planId === 'subscribe' ? `Save ${saving}%` : plan.badge;
          return (
            <button key={planId} type="button" role="radio" aria-checked={selected} className={s.plan} onClick={() => state.setPlan(planId)}>
              {badge ? <span className={s.planBadge}>{badge}</span> : null}
              <span className={cx(s.check)} aria-hidden style={selected ? { borderColor: 'var(--ink)', background: 'var(--ink)', color: '#fff' } : undefined}>
                {selected ? <Icon name="check" size={14} /> : null}
              </span>
              <span>
                <span className={s.h3} style={{ display: 'block' }}>{planId === 'subscribe' ? 'Subscribe and save' : plan.name}</span>
                <span className={s.small} style={{ display: 'block', marginTop: 2 }}>{plan.summary}</span>
                <span className={s.perDay}>about {perDay(plan.pricePaise)} a day</span>
              </span>
              <span className={s.planPrice}>
                {rupees(plan.pricePaise)}
                <span className={s.small} style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 12, marginTop: 4 }}>{plan.renewalPaise ? '/ 3 months' : 'once'}</span>
              </span>
            </button>
          );
        })}
      </div>

      {showBumps ? (
        <fieldset className={s.stack} style={{ border: 0, padding: 0, margin: '6px 0 0', gap: 10 }}>
          <legend className={s.h3} style={{ marginBottom: 10 }}>Add to your membership <span className={s.small} style={{ fontWeight: 400 }}>(optional)</span></legend>
          {MEMBERSHIP_BUMP_ORDER.map(bumpId => {
            const bump = MEMBERSHIP_BUMPS[bumpId];
            return (
              <label key={bumpId} className={s.bump}>
                <input type="checkbox" checked={state.bumps.includes(bumpId)} onChange={() => state.toggleBump(bumpId)} aria-label={`Add ${bump.name} for ${rupees(bump.pricePaise)}`} />
                <span>
                  <span style={{ display: 'block', fontWeight: 600 }}>{bump.name}</span>
                  <span className={s.small} style={{ display: 'block' }}>{bump.description}</span>
                </span>
                <span style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  +{rupees(bump.pricePaise)}
                  {bump.regularPaise ? <span className={cx(s.small, s.strike)} style={{ display: 'block', fontWeight: 400 }}>{rupees(bump.regularPaise)}</span> : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {contact ? <ContactFields id={id} value={contact.value} onChange={contact.onChange} /> : null}

      <div className={s.row} style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <span className={s.h3}>Today</span>
        <span className={s.h3}>{rupees(order.totalPaise)}</span>
      </div>
      {state.error ? <p className={s.error} role="alert">{state.error}</p> : null}
      <button
        type="button"
        className={s.cta}
        disabled={state.busy || !contactValid}
        onClick={() => void state.checkout(contact?.value)}
        aria-describedby={`${id}-terms`}
      >
        {state.busy ? <Spinner /> : null}
        {ctaLabel} · {rupees(order.totalPaise)}
      </button>
      <p id={`${id}-terms`} className={s.fine} style={{ margin: 0 }}>{renewalTerms(order.plan)}</p>
      <p className={s.fine} style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="shield" size={14} /> {GUARANTEE.headline}. Secure payment by Razorpay: UPI, cards, netbanking.
      </p>
    </div>
  );
}

function ContactFields({ id, value, onChange }: { id: string; value: CheckoutContact; onChange: (next: CheckoutContact) => void }) {
  return (
    <div className={s.stack} style={{ marginTop: 6 }}>
      <p className={s.h3} style={{ margin: 0 }}>Where should your stylist message you?</p>
      <label className={s.field}>
        <span className={s.fieldLabel}>WhatsApp number</span>
        <span className={s.phoneField}>
          <span className={s.phonePrefix}>+91</span>
          <input className={s.input} id={`${id}-phone`} aria-label="WhatsApp number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={value.phone} onChange={event => onChange({ ...value, phone: event.target.value })} />
        </span>
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>First name</span>
        <input className={s.input} aria-label="First name" type="text" autoComplete="given-name" value={value.firstName} onChange={event => onChange({ ...value, firstName: event.target.value })} maxLength={40} />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>Email <span className={s.small} style={{ fontWeight: 400 }}>(optional, for your receipt)</span></span>
        <input className={s.input} aria-label="Email (optional)" type="email" autoComplete="email" value={value.email} onChange={event => onChange({ ...value, email: event.target.value })} />
      </label>
      <label className={s.consent}>
        <input type="checkbox" aria-label="My stylist can message me on WhatsApp" checked={value.consent} onChange={event => onChange({ ...value, consent: event.target.checked })} />
        <span>Yes, my stylist can message me on WhatsApp. I can stop anytime by replying STOP.</span>
      </label>
    </div>
  );
}

export function Guarantee() {
  return (
    <div className={s.card} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14, alignItems: 'start' }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 999, background: 'var(--good-soft)', color: 'var(--good)' }}><Icon name="shield" size={22} /></span>
      <div>
        <h3 className={s.h3} style={{ margin: 0 }}>{GUARANTEE.headline}</h3>
        <p className={s.small} style={{ margin: '4px 0 0' }}>{GUARANTEE.body}</p>
      </div>
    </div>
  );
}

export function ChatDemo() {
  return (
    <div>
      <div className={s.row} style={{ marginBottom: 10 }}>
        <Monogram size={36} />
        <span>
          <span className={s.h3} style={{ display: 'block', fontSize: 15 }}>ICONIK</span>
          <span className={s.small} style={{ display: 'block', fontSize: 12 }}>WhatsApp</span>
        </span>
      </div>
      <div className={s.chat} aria-label="Example WhatsApp chat with your stylist">
        <p className={cx(s.bubble, s.bubbleMe)} style={{ margin: 0 }}>My cousin’s sangeet is Saturday 😩 nothing to wear</p>
        <div className={s.bubble}>
          <div className={s.bubbleImage}><Image src="/membership/chat-mustard-kurta.webp" alt="Her mustard kurta" fill sizes="180px" style={{ objectFit: 'cover' }} /></div>
          You already own the perfect base: your mustard kurta 💛
        </div>
        <div className={s.bubble}>
          <div className={s.bubbleImage}><Image src="/membership/chat-jhumkas.webp" alt="Gold jhumkas with pearl drops" fill sizes="180px" style={{ objectFit: 'cover' }} /></div>
          Add these jhumkas (₹649, in stock in your city) and an ivory dupatta. Done.
        </div>
        <p className={cx(s.bubble, s.bubbleMe)} style={{ margin: 0 }}>Wait that’s so good. Ordering now</p>
      </div>
      <p className={s.fine} style={{ marginTop: 8 }}>An example chat. ICONIK on WhatsApp is AI trained by our stylists, and a real ICONIK stylist checks your Style Plan.</p>
    </div>
  );
}

export function PriceCompare({ planId }: { planId: MembershipPlanId }) {
  const plan = MEMBERSHIP_PLANS[planId];
  return (
    <div className={s.compare}>
      <div>
        <p className={s.small} style={{ margin: 0 }}>A personal stylist</p>
        <p className={s.h2} style={{ margin: '6px 0 0', fontSize: 22 }}>{STYLIST_SESSION_RANGE}</p>
        <p className={s.small} style={{ margin: '4px 0 0' }}>for one session</p>
      </div>
      <div style={{ borderColor: 'var(--ink)' }}>
        <p className={s.small} style={{ margin: 0 }}>ICONIK membership</p>
        <p className={s.h2} style={{ margin: '6px 0 0', fontSize: 22 }}>{perDay(plan.pricePaise)} a day</p>
        <p className={s.small} style={{ margin: '4px 0 0' }}>every day, on WhatsApp</p>
      </div>
    </div>
  );
}

const CLIENT_CARDS = [
  { name: 'Priya, 28, Mumbai', image: '/testimonial-priya.webp', quote: 'Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.', stars: 5 },
  { name: 'Ananya, 32, Delhi', image: '/testimonial-ananya.webp', quote: 'I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me.', stars: 5 },
  { name: 'Shreya, 26, Bangalore', image: '/testimonial-shreya.webp', quote: 'I used to save so many outfits and then buy nothing because I was confused. Now shopping feels much more straightforward.', stars: 4 },
];

interface ClientVideo {
  name: string;
  src: string;
  poster: string;
  quote: string;
  /** Same face blur as the landing page, for clients who asked for it. */
  faceBlur?: { left: string; top: string; width: string; height: string };
}

const CLIENT_VIDEOS: ClientVideo[] = [
  { name: 'Tina', src: '/testimonialvideo2.mp4', poster: '/testimonialvideo2-poster.webp', quote: 'They helped me get styled for my events. Absolutely worth it.' },
  { name: 'Priya', src: '/testimonialvideo1.mp4', poster: '/testimonialvideo1-poster.webp', quote: 'I was insecure about my tummy. ICONIK’s outfits got my confidence back.', faceBlur: { left: '40.5%', top: '32.3%', width: '22.5%', height: '20.3%' } },
  { name: 'Gayathri', src: '/testimonialvideo3.mp4', poster: '/testimonialvideo3-poster.webp', quote: 'They found what actually suited me.', faceBlur: { left: '28.5%', top: '34.3%', width: '23%', height: '18.5%' } },
];

/**
 * A quiet player: poster, one frosted play button, a thin progress line. No
 * native controls, no download, no picture-in-picture, no right-click menu.
 */
function VideoCard({ video }: { video: ClientVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const element = ref.current;
    if (!element) return;
    if (element.paused) {
      document.querySelectorAll<HTMLVideoElement>('video[data-sm-testimonial]').forEach(other => { if (other !== element) other.pause(); });
      void element.play();
      trackAction('testimonial_play', { screen: 'proof', name: video.name });
    } else {
      element.pause();
    }
  };

  return (
    <figure className={s.videoCard}>
      <div className={s.videoFrame} onContextMenu={event => event.preventDefault()}>
        <video
          ref={ref}
          data-sm-testimonial
          className={s.video}
          poster={video.poster}
          preload="none"
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setProgress(0); }}
          onTimeUpdate={event => {
            const element = event.currentTarget;
            if (element.duration) setProgress(element.currentTime / element.duration);
          }}
          onClick={toggle}
          aria-label={`${video.name}, ICONIK client`}
        >
          <source src={video.src} type="video/mp4" />
        </video>
        {video.faceBlur ? <span aria-hidden className={s.faceBlur} style={video.faceBlur} /> : null}
        <button type="button" className={cx(s.videoPlay, playing && s.videoPlayHidden)} onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${video.name}’s story`}>
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </button>
        <span className={s.videoProgress} aria-hidden><span style={{ transform: `scaleX(${progress})` }} /></span>
      </div>
      <figcaption className={s.videoCaption}>
        <span className={s.videoQuote}>“{video.quote}”</span>
        <span className={s.small}>{video.name} · ICONIK client</span>
      </figcaption>
    </figure>
  );
}

function PlayGlyph() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" /></svg>;
}

function PauseGlyph() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>;
}

export function ClientVideos() {
  return (
    <div className={s.scroller} aria-label="Client videos">
      {CLIENT_VIDEOS.map(video => <VideoCard key={video.name} video={video} />)}
    </div>
  );
}

/** Client stories (photos and quotes) from the ₹2,699 page. */
export function ClientProof() {
  return (
    <div className={s.stack} style={{ gap: 12 }}>
      <div className={s.scroller} aria-label="Client stories">
        {CLIENT_CARDS.map(card => (
          <figure key={card.name} className={s.testimonial} style={{ margin: 0 }}>
            <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--soft)' }}>
              <Image src={card.image} alt={`${card.name}, ICONIK client`} fill sizes="300px" style={{ objectFit: 'cover' }} />
            </div>
            <figcaption style={{ padding: 16 }}>
              <p className={s.small} style={{ margin: '0 0 6px', color: 'var(--gold)' }} aria-label={`${card.stars} out of 5 stars`}>{'★'.repeat(card.stars)}{'☆'.repeat(5 - card.stars)}</p>
              <blockquote className={s.quote} style={{ fontSize: 17 }}>“{card.quote}”</blockquote>
              <p className={s.small} style={{ margin: '8px 0 0' }}>{card.name}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className={s.fine} style={{ margin: 0 }}>Real ICONIK clients from our Blueprint service. Some faces are blurred at their request.</p>
    </div>
  );
}

export const MEMBERSHIP_FAQ = [
  { q: 'Is it a real stylist?', a: 'ICONIK on WhatsApp is AI trained by our stylists, so it replies in minutes, any time. Real ICONIK stylists check your Style Plan and step in when you need a person.' },
  { q: 'What happens to my photos?', a: 'Your selfie is used only to read your colouring. It is stored privately, never shown to anyone or used in ads, and deleted after 30 days. Photos you send in WhatsApp are used only to style you.' },
  { q: 'How does renewal work?', a: 'The subscription renews every 3 months. After paying, you can choose to set up autopay; if you don’t, we send a payment link on WhatsApp before your renewal. Either way you get a WhatsApp reminder 3 days before.' },
  { q: 'How do I cancel?', a: 'Message “cancel” to us on WhatsApp. No calls, no forms. You keep your looks and the rest of the quarter you paid for.' },
  { q: 'What if I don’t like my looks?', a: `${GUARANTEE.body}` },
  { q: 'Do I need to buy new clothes?', a: 'No. We start with what’s already in your cupboard. We only suggest new pieces when you really need them, in your size, budget and favourite shops.' },
];

export function MembershipFaq() {
  return (
    <div className={s.faq}>
      {MEMBERSHIP_FAQ.map(item => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
