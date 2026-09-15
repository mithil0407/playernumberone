'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Heart,
  Layers,
  MessageCircle,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import {
  BUSINESS_HOURS,
  CLIENT_PROOF,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from '@/lib/siteFacts';
import VideoCard, { type TestimonialVideo } from './VideoCard';
import { MEMBERSHIP, formatINR, membershipIncludes, monthlyLooks, pricePerDay, priorities, type Priority } from './offer';
import s from './membership.module.css';

const heroSlides = ['/transformation-1.webp', '/transformation-2.webp', '/transformation-3.webp'];

const steps = [
  { when: '01 · Day one', title: 'Tell us what’s coming up', text: 'Share a few photos, your budget and the one thing you’d most like help with. It takes about ten minutes.' },
  { when: `02 · Within ${MEMBERSHIP.firstLookWorkingDays} working days`, title: 'Get your first two looks', text: 'Your stylist sends two complete outfits for your first priority, built around clothes you already own.' },
  { when: '03 · All month', title: 'Message before you wear or buy', text: 'Send an outfit photo or a shopping link on WhatsApp. Get a clear yes, no or “try this instead”.' },
  { when: '04 · Every month', title: 'Plan the next month together', text: 'On your monthly call, review what you actually wore and choose the next occasion or goal.' },
];

const videos: TestimonialVideo[] = [
  { src: '/testimonialvideo2.mp4', poster: '/testimonialvideo2-poster.jpg', name: 'Tina', rating: 5, quote: 'Thanks to ICONIK’s stylists. They helped me get styled for my events. It was absolutely worth it.' },
  { src: '/testimonialvideo1.mp4', poster: '/testimonialvideo1-poster.jpg', name: 'Priya', rating: 5, faceBlur: { left: '40.5%', top: '32.3%', width: '22.5%', height: '20.3%' }, quote: 'I was very insecure about my tummy. Thanks to ICONIK for actually suggesting outfits that helped me get my confidence back.' },
  { src: '/testimonialvideo3.mp4', poster: '/testimonialvideo3-poster.jpg', name: 'Gayathri', rating: 4, faceBlur: { left: '28.5%', top: '34.3%', width: '23%', height: '18.5%' }, quote: 'I found ICONIK on Instagram, and Jazz was very helpful in finding what actually suited me. It was a very good experience.' },
];

const includes = [
  { icon: Layers, title: `${monthlyLooks} personalised looks`, text: `${MEMBERSHIP.requests} styling requests a month, each with ${MEMBERSHIP.looksPerRequest} complete outfits and one round of adjustments.` },
  { icon: Video, title: `A ${MEMBERSHIP.callMinutes}-minute video call`, text: 'Plan the month with your stylist: upcoming occasions, goals and what’s working.' },
  { icon: MessageCircle, title: `${MEMBERSHIP.quickChecks} WhatsApp second opinions`, text: `Outfit photo or shopping link. Replies within ${MEMBERSHIP.responseWorkingDays} working days, Monday to Friday.` },
  { icon: CalendarDays, title: `${MEMBERSHIP.checkIns} check-ins from your stylist`, text: 'Your stylist reaches out first, so nothing important sneaks up on you.' },
  { icon: BookOpen, title: 'A Style Profile that grows', text: 'Your fit, colours, budget and feedback are saved, so every look gets more accurate.' },
  { icon: Sparkles, title: 'Member toolkit', text: 'Outfit Library, Packing Planner and Buy Better Checklist for the days in between.' },
];

const sampleLooks = [
  { tag: 'Look A', name: 'Soft tailoring', image: '/stylist-intake/moodboard-relaxed-professional-02.webp', items: ['Ivory wrap blouse', 'Long cream cardigan', 'Camel wide-leg trousers', 'Tan block-heel mules'] },
  { tag: 'Look B', name: 'Colour, done quietly', image: '/stylist-intake/moodboard-elevated-expressive-02.webp', items: ['Emerald wrap blouse', 'Camel blazer', 'Ivory trousers', 'Gold hoops + tan bag'] },
];

const comparison = [
  { label: 'A stylist you can message all month', member: 'Yes', blueprint: 'No' },
  { label: 'New looks for new occasions', member: `${monthlyLooks} / month`, blueprint: 'No' },
  { label: 'Second opinion before you buy', member: 'Yes', blueprint: 'No' },
  { label: 'Video call with your stylist', member: 'Monthly', blueprint: 'Once' },
  { label: 'Advice that updates as your life changes', member: 'Yes', blueprint: 'No' },
  { label: '20-outfit reference document', member: 'No', blueprint: 'Yes' },
];

const clients = [
  { name: 'Priya', age: '28', city: 'Mumbai', image: '/testimonial-priya.webp', concern: 'After my delivery, I felt conscious about my tummy and kept choosing loose tops.', changed: 'Straight-cut kurtas, warmer colours near the face, structured layers for occasions.', quote: 'Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.', stars: 5 },
  { name: 'Ananya', age: '32', city: 'Delhi', image: '/testimonial-ananya.webp', concern: 'I felt conscious about my arms and wore full sleeves even in Delhi summer.', changed: 'Cap and flutter sleeves, raglan cuts, more colour instead of only black.', quote: 'I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me.', stars: 5 },
  { name: 'Shreya', age: '26', city: 'Bangalore', image: '/testimonial-shreya.webp', concern: 'On my petite frame, too much fabric made most outfits feel overwhelming.', changed: 'Cleaner monochrome combinations, better hem lengths, smaller accessories.', quote: 'I used to save so many outfits and then buy nothing because I was confused. Now shopping feels much more straightforward.', stars: 4 },
];

const assurances = [
  { icon: ShieldCheck, title: 'Cancel before any renewal', text: 'No minimum term. Cancel before your next billing date and you won’t be charged again.' },
  { icon: RefreshCw, title: 'Adjustments on every request', text: 'If a look doesn’t feel like you, tell your stylist. One round of changes is included each time.' },
  { icon: Heart, title: 'Keep everything we create', text: 'Your looks and Style Profile stay yours, even if you cancel.' },
];

const faqs = [
  ['How is this different from the ₹2,699 Style Blueprint?', `The Blueprint is a one-time guide with 20 outfit formulas. Membership gives you a stylist every month: ${monthlyLooks} new looks, a monthly call and WhatsApp second opinions for real decisions as they come up. The full 20-outfit Blueprint document is not included.`],
  ['How quickly will I get help?', `Your first two looks arrive within ${MEMBERSHIP.firstLookWorkingDays} working days of your completed intake. Quick checks are answered within ${MEMBERSHIP.responseWorkingDays} working days, Monday to Friday.`],
  ['What counts as a styling request?', `One situation or brief, such as a client meeting, family dinner or everyday work outfit. You receive ${MEMBERSHIP.looksPerRequest} complete outfit options and one round of adjustments. ${MEMBERSHIP.requests} requests are included each billing month, including your first one.`],
  ['Will I need to buy new clothes?', 'No. Share pieces you own and your shopping budget. Your stylist works with those first and suggests purchases only where they genuinely help. Clothing is not included in the price.'],
  ['Is it unlimited WhatsApp chat?', `No. You get ${MEMBERSHIP.quickChecks} quick checks and ${MEMBERSHIP.checkIns} check-ins each month, so every reply gets real attention. It is scheduled, personal support rather than an instant chat line.`],
  ['What if I can’t make my monthly call?', 'Send your priorities as a short form or voice notes instead. Your stylist reviews them in the same slot and replies with a plan.'],
  ['How do I cancel or pause?', `Membership renews at ${formatINR(MEMBERSHIP.price)} each calendar month. Cancel before your next billing date to stop future charges; service continues to the end of the paid month. A pause stops billing and service for one cycle. Unused requests do not roll over.`],
] as const;

function Value({ value }: { value: string }) {
  const tone = value === 'Yes' ? s.valYes : value === 'No' ? s.valNo : s.valText;
  return <span className={`${s.val} ${tone}`}>{value}</span>;
}

export default function PersonalStylistPreview() {
  const [slide, setSlide] = useState(0);
  const [priority, setPriority] = useState<Priority>('fit');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const heroCta = useRef<HTMLAnchorElement>(null);

  const price = formatINR(MEMBERSHIP.price);
  const monthlyHref = `/personal-stylist-preview/checkout?plan=monthly&priority=${priority}`;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setSlide(current => (current + 1) % heroSlides.length), 4500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const element = heroCta.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setShowMobileBar(!entry.isIntersecting), { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={s.page}>
      <div className={s.top}>
        <div className={s.previewBar}><strong>Design preview</strong><span>· Payments and subscriptions are not enabled</span></div>
        <nav className={s.nav} aria-label="ICONIK">
          <div className={`${s.container} ${s.navInner}`}>
            <Link href="/personal-stylist-preview" className={s.wordmark}>ICONIK</Link>
            <a href="#pricing" className={s.navCta}>{price}/month <ArrowRight size={14} /></a>
          </div>
        </nav>
      </div>

      <main>
        {/* Hero */}
        <section className={s.hero}>
          <div className={s.container}>
            <div className={`${s.micro} ${s.heroEyebrow}`}>Your personal stylist · On call every month</div>
            <h1 className={s.heroTitle}>
              <span><span className={s.accent}>Stop Guessing</span> What to Wear.</span>
              <span><span className={s.serif}>Keep a Stylist</span> On Call.</span>
            </h1>
            <p className={s.heroSub}>
              Your own ICONIK stylist on WhatsApp — <strong>{monthlyLooks} personalised looks a month</strong>, a monthly video call and a second opinion before you wear or buy. Your first two looks arrive within {MEMBERSHIP.firstLookWorkingDays} working days.
            </p>
            <Link ref={heroCta} href={monthlyHref} className={s.cta}>
              <span className={s.ctaLong}>Start My Personal Stylist — {price}/month</span>
              <span className={s.ctaShort}>Start My Stylist — {price}/mo</span>
              <ArrowRight size={17} />
            </Link>
            <div className={s.trust}>
              <span><Check size={14} /> Cancel before any renewal</span>
              <span><Check size={14} /> No minimum term</span>
              <span><Check size={14} /> First looks in {MEMBERSHIP.firstLookWorkingDays} working days</span>
            </div>

            <div className={s.heroMedia}>
              <div className={s.heroFrame}>
                <div className={s.slides}>
                  {heroSlides.map((src, index) => (
                    <div key={src} className={`${s.slide} ${index === slide ? s.slideOn : ''}`} aria-hidden={index !== slide}>
                      <Image src={src} alt="ICONIK client styling transformation" fill sizes="(max-width: 767px) 90vw, 400px" priority={index === 0} />
                    </div>
                  ))}
                  <button type="button" className={`${s.slideBtn} ${s.slidePrev}`} onClick={() => setSlide((slide - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous transformation"><ArrowLeft size={16} /></button>
                  <button type="button" className={`${s.slideBtn} ${s.slideNext}`} onClick={() => setSlide((slide + 1) % heroSlides.length)} aria-label="Next transformation"><ArrowRight size={16} /></button>
                </div>
                <div className={s.dots}>
                  {heroSlides.map((src, index) => (
                    <button key={src} type="button" className={`${s.dot} ${index === slide ? s.dotOn : ''}`} onClick={() => setSlide(index)} aria-label={`Show transformation ${index + 1}`}><span /></button>
                  ))}
                </div>
              </div>

              <div className={`${s.chat} ${s.chatClient}`}>
                <div className={s.chatHead}><span className={s.chatAvatar}>You</span> WhatsApp</div>
                <p>Client dinner on Friday. Is my black blazer too formal?</p>
                <div className={s.chatMeta}>4:12 PM</div>
              </div>
              <div className={`${s.chat} ${s.chatStylist}`}>
                <div className={s.chatHead}><span className={s.chatAvatar}>i.</span> Your ICONIK stylist</div>
                <p>Keep the blazer. Add a wine satin shirt and pointed heels — two full looks are in your lookbook.</p>
                <div className={s.chatMeta}>4:31 PM <CheckCheck size={14} /></div>
              </div>
              <p className={s.mediaCaption}>ICONIK client transformations · Illustrative stylist conversation</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={`${s.stats} ${s.steel}`}>
          <div className={`${s.container} ${s.statsGrid}`}>
            {[
              { num: `${CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+`, label: 'Clients styled' },
              { num: `${CLIENT_PROOF.countriesServed}+`, label: 'Countries served' },
              { num: `${monthlyLooks}`, label: 'Looks every month' },
              { num: `${MEMBERSHIP.firstLookWorkingDays} days`, label: 'To your first looks' },
            ].map(stat => (
              <div key={stat.label}>
                <div className={s.statNum}>{stat.num}</div>
                <div className={`${s.micro} ${s.statLabel}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className={`${s.section} ${s.bone}`}>
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div className={s.micro}>How your membership works</div>
              <h2 className={s.h2}>A stylist who stays <span className={s.serif}>after the first outfit.</span></h2>
              <p className={s.lede}>Most styling ends when the call does. Yours keeps going — every occasion, every shopping doubt, every new season.</p>
            </div>
            <div className={s.stepsGrid}>
              {steps.map(step => (
                <article key={step.title} className={`${s.glass} ${s.step}`}>
                  <div className={s.stepNum}>{step.when}</div>
                  <h3 className={s.stepTitle}>{step.title}</h3>
                  <p className={s.stepText}>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Video testimonials */}
        <section className={`${s.section} ${s.dark}`}>
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div className={s.micro}>Real clients · Real experiences</div>
              <h2 className={s.h2}>Hear it in their own words.</h2>
              <p className={s.lede}>ICONIK clients on working with our stylists. Membership is delivered by the same styling team.</p>
            </div>
            <div className={s.videoGrid}>
              {videos.map((video, index) => <VideoCard key={video.src} video={video} number={index + 1} />)}
            </div>
          </div>
        </section>

        {/* What's included + sample request */}
        <section className={`${s.section} ${s.steel}`}>
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div className={s.micro}>Every month, included</div>
              <h2 className={s.h2}>Everything your stylist <span className={s.serif}>does for you.</span></h2>
              <p className={s.lede}>Real outfits for real plans, delivered to your WhatsApp and saved to your lookbook.</p>
            </div>
            <div className={s.includeGrid}>
              <ul className={`${s.glass} ${s.includeList}`}>
                {includes.map(({ icon: Icon, title, text }) => (
                  <li key={title} className={s.includeItem}>
                    <span className={s.includeIcon}><Icon size={18} /></span>
                    <div>
                      <div className={s.includeTitle}>{title}</div>
                      <p className={s.includeText}>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <article className={`${s.glass} ${s.sample}`} aria-label="Example styling request">
                <div className={s.sampleHead}>
                  <span className={s.micro}>Request 01 of {MEMBERSHIP.requests}</span>
                  <span className={s.badge}>Example</span>
                </div>
                <h3 className={s.sampleTitle}>Client dinner, Friday</h3>
                <p className={s.sampleBrief}>“Polished, but not stiff. I want to feel like myself.”</p>
                <div className={s.looks}>
                  {sampleLooks.map(look => (
                    <div key={look.tag} className={s.look}>
                      <div className={s.lookImage}>
                        <Image src={look.image} alt={`${look.tag}: ${look.name}`} fill sizes="(max-width: 767px) 45vw, 260px" />
                      </div>
                      <div className={s.lookBody}>
                        <div className={s.micro}>{look.tag}</div>
                        <div className={s.lookName}>{look.name}</div>
                        <ul className={s.lookItems}>{look.items.map(item => <li key={item}>{item}</li>)}</ul>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={s.stylistNote}>
                  <div className={s.micro}>Stylist note</div>
                  <p>“The wrap neckline defines your waist without feeling tight. Start with Look A if you already own camel trousers.”</p>
                </div>
                <div className={s.sampleFoot}><MessageCircle size={14} /> Delivered on WhatsApp · One round of adjustments included</div>
              </article>
            </div>
            <div className={s.ctaRow}>
              <Link href={monthlyHref} className={s.cta}>
                <span className={s.ctaLong}>Get My First Two Looks — {price}/month</span>
                <span className={s.ctaShort}>Get My First Looks — {price}/mo</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className={`${s.section} ${s.bone}`}>
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div className={s.micro}>Monthly vs one-time</div>
              <h2 className={s.h2}>A guide is a snapshot. <span className={s.serif}>A stylist keeps up.</span></h2>
              <p className={s.lede}>The Style Blueprint is a one-time reference. Membership is for everything that comes after — new occasions, new purchases, new seasons.</p>
            </div>
            <div className={s.compare} role="table" aria-label="Personal Stylist membership compared with the Style Blueprint">
              <div className={`${s.compareRow} ${s.compareHead}`} role="row">
                <div role="columnheader">What you get</div>
                <div role="columnheader">Personal Stylist<small>{price}/month</small></div>
                <div role="columnheader">Style Blueprint<small>{formatINR(MEMBERSHIP.blueprintPrice)} once</small></div>
              </div>
              {comparison.map(row => (
                <div key={row.label} className={s.compareRow} role="row">
                  <div className={s.compareLabel} role="rowheader">{row.label}</div>
                  <div role="cell"><Value value={row.member} /></div>
                  <div role="cell"><Value value={row.blueprint} /></div>
                </div>
              ))}
            </div>
            <p className={s.comparePunch}>Most of us don’t need more style rules. We need someone to ask on a Tuesday morning.</p>
          </div>
        </section>

        {/* Client stories */}
        <section className={`${s.section} ${s.steel}`}>
          <div className={s.container}>
            <div className={s.sectionHead}>
              <div className={s.micro}>Client stories</div>
              <h2 className={s.h2}>What changed for three ICONIK clients</h2>
              <p className={s.lede}>Different concerns, from our existing styling service. The advice had to fit their bodies, comfort and real lives.</p>
            </div>
            <div className={s.clientGrid}>
              {clients.map(client => (
                <article key={client.name} className={`${s.glass} ${s.clientCard}`}>
                  <div className={s.clientImage}>
                    <Image src={client.image} alt={client.name} fill sizes="(max-width: 767px) 90vw, 360px" />
                  </div>
                  <div className={s.clientBody}>
                    <h3 className={s.clientName}>{client.name} · {client.age} · {client.city}</h3>
                    <div className={s.clientRow}><span>Concern</span><span>{client.concern}</span></div>
                    <div className={s.clientRow}><span>Changed</span><span>{client.changed}</span></div>
                    <p className={s.clientQuote}>“{client.quote}”</p>
                    <div className={s.clientStars} aria-label={`${client.stars} out of 5 stars`}>
                      {Array.from({ length: client.stars }, (_, i) => <Star key={i} size={13} fill="currentColor" strokeWidth={0} />)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={`${s.section} ${s.dark}`}>
          <div className={`${s.container} ${s.priceWrap}`}>
            <div className={s.micro}>Membership</div>
            <h2 className={s.h2}>Less than one outfit <span className={s.serif}>you never wear.</span></h2>
            <p className={s.priceIntro}>Every month: a stylist who knows your body, your budget and your plans — and helps before you get it wrong.</p>

            <div className={s.priceCard}>
              <div className={s.priceTop}>
                <div>
                  <div className={s.micro}>Recommended</div>
                  <div className={s.priceName}>{MEMBERSHIP.name}</div>
                </div>
                <div>
                  <div className={s.priceAmount}>{price}<small>/month</small></div>
                  <p className={s.priceDaily}>About ₹{pricePerDay} a day</p>
                </div>
              </div>
              <ul className={s.priceList}>
                {membershipIncludes.map(item => <li key={item}><Check size={16} />{item}</li>)}
              </ul>
              <div className={s.focus}>
                <div className={s.micro}>Where should your stylist start?</div>
                <div className={s.chips}>
                  {priorities.map(p => (
                    <button key={p.id} type="button" aria-pressed={priority === p.id} className={`${s.chip} ${priority === p.id ? s.chipOn : ''}`} onClick={() => setPriority(p.id)}>{p.short}</button>
                  ))}
                </div>
              </div>
              <Link href={monthlyHref} className={`${s.cta} ${s.priceCta}`}>Start My Personal Stylist <ArrowRight size={17} /></Link>
              <p className={s.priceTerms}>{price} today, then {price} every month until you cancel. No minimum term.</p>
            </div>

            <p className={s.altOffer}>
              Prefer a one-time guide instead? <Link href="/personal-stylist-preview/checkout?plan=blueprint">Style Blueprint — {formatINR(MEMBERSHIP.blueprintPrice)} once</Link>
            </p>
          </div>
        </section>

        {/* Assurance + FAQ */}
        <section className={`${s.section} ${s.bone}`}>
          <div className={s.container}>
            <div className={s.assuranceGrid}>
              {assurances.map(({ icon: Icon, title, text }) => (
                <article key={title} className={`${s.glass} ${s.assurance}`}>
                  <Icon size={22} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className={s.sectionHead}>
              <div className={s.micro}>Questions</div>
              <h2 className={s.h2}>Frequently asked questions</h2>
            </div>
            <div className={s.faqList}>
              {faqs.map(([question, answer], index) => (
                <div key={question} className={s.faqItem}>
                  <button type="button" className={s.faqBtn} aria-expanded={openFaq === index} aria-controls={`faq-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    {question}
                    {openFaq === index ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                  <div id={`faq-${index}`} hidden={openFaq !== index}>
                    <p className={s.faqAnswer}>{answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`${s.section} ${s.dark} ${s.final}`}>
          <div className={s.container}>
            <h2 className={s.h2}>Stop guessing <span className={s.serif}>every morning.</span></h2>
            <p className={s.lede}>Your first two looks within {MEMBERSHIP.firstLookWorkingDays} working days. Then a stylist on call, all month.</p>
            <Link href={monthlyHref} className={`${s.cta} ${s.finalCta}`}>
              <span className={s.finalPrice}>{price}<span style={{ fontSize: '0.75em', opacity: 0.7 }}>/mo</span></span>
              <span className={s.finalDivider} />
              <span>Start My Personal Stylist</span>
              <ArrowRight size={17} />
            </Link>
            <div className={s.trust}>
              <span>{CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ clients</span>
              <span>· {CLIENT_PROOF.countriesServed}+ countries</span>
              <span>· Cancel before any renewal</span>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerTop}>
            <div className={s.footerBrand}>
              <span className={s.wordmark}>ICONIK</span>
              <p>Personal styling for the life you actually live.</p>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              <a href={SUPPORT_WHATSAPP_URL}>WhatsApp {SUPPORT_WHATSAPP_DISPLAY}</a>
              <p>{BUSINESS_HOURS.display}</p>
            </div>
            <div className={s.footerCols}>
              <div className={s.footerCol}>
                <div className={s.micro}>Legal</div>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/refund-policy">Refund Policy</Link>
                <Link href="/terms">Terms of Service</Link>
              </div>
              <div className={s.footerCol}>
                <div className={s.micro}>Company</div>
                <Link href="/about">About Us</Link>
                <Link href="/contact">Contact</Link>
              </div>
            </div>
          </div>
          <p className={s.footerBottom}>© {new Date().getFullYear()} ICONIK · {LEGAL_ENTITY_NAME} · Membership design preview</p>
        </div>
      </footer>

      <div className={`${s.mobileBar} ${showMobileBar ? s.mobileBarOn : ''}`}>
        <div>
          <strong>{price}/mo</strong>
          <small>Cancel before renewal</small>
        </div>
        <Link href={monthlyHref} className={s.cta}>Start My Stylist <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}
