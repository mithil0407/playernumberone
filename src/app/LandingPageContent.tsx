'use client';

import {
  INDIA_BLUEPRINT_PRODUCT_ID,
  INDIA_OFFER_2699_FUNNEL_CATEGORY,
  INDIA_ROOT_FUNNEL_CATEGORY,
  trackCTAClick,
  trackViewContent,
} from '@/lib/metaPixel';
import { INDIA_FUNNEL_ENTRY_STORAGE_KEY, type IndiaFunnelEntry } from '@/lib/metaTrackingContract';
import Link from 'next/link';
import Image from 'next/image';
import ExploreLinksSection from '@/components/ExploreLinksSection';
import { footerExploreGroups } from '@/lib/seoContent';
import { SUPPORT_EMAIL } from '@/lib/seo';
import {
  BLUEPRINT_OFFER,
  BUSINESS_HOURS,
  CLIENT_PROOF,
  LEGAL_ENTITY_NAME,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from '@/lib/siteFacts';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Sparkles,
  Gem,
  Shield,
  Trophy,
  Award
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';

interface LandingPageContentProps {
  headline: ReactNode;
  subheadline: ReactNode;
  variant?: 'default' | 'offer2699';
  headlineClassName?: string;
  checkoutHref?: string;
  basePrice?: number;
  originalPrice?: number;
  displayBasePrice?: string;
  displayOriginalPrice?: string;
}

export default function LandingPageContent({
  headline,
  subheadline,
  variant = 'default',
  checkoutHref = BLUEPRINT_OFFER.checkoutPath,
  basePrice = BLUEPRINT_OFFER.currentPriceInr,
  originalPrice = BLUEPRINT_OFFER.referencePriceInr,
  displayBasePrice,
  displayOriginalPrice,
}: LandingPageContentProps) {
  const isOffer2699 = variant === 'offer2699';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const heroCtaRef = useRef<HTMLAnchorElement>(null);

  const formattedBasePrice = displayBasePrice ?? `₹${basePrice.toLocaleString('en-IN')}`;
  const formattedOriginalPrice = displayOriginalPrice ?? `₹${originalPrice.toLocaleString('en-IN')}`;

  // The root price test and the established /offer-2699 funnel share the visual
  // component but have separate prices, checkout routes, and Meta categories.
  const funnelEntry: IndiaFunnelEntry = isOffer2699 ? 'offer2699' : 'root';
  const contentCategory = isOffer2699 ? INDIA_OFFER_2699_FUNNEL_CATEGORY : INDIA_ROOT_FUNNEL_CATEGORY;

  useEffect(() => {
    // Retained for attribution continuity in the wider funnel. Each checkout
    // route also declares its entry explicitly, so direct checkout visits cannot
    // inherit a stale category from another offer.
    try {
      window.sessionStorage.setItem(INDIA_FUNNEL_ENTRY_STORAGE_KEY, funnelEntry);
    } catch {
      // Analytics must never block the user journey.
    }
    trackViewContent(BLUEPRINT_OFFER.name, basePrice, [INDIA_BLUEPRINT_PRODUCT_ID], 'INR', contentCategory);
  }, [basePrice, contentCategory, funnelEntry]);

  const transformationImages = useMemo(() => [
    { src: '/transformation-1.webp', testimonial: 'Finally found my signature style! I feel confident every day.', name: 'Shreya, Mumbai' },
    { src: '/transformation-2.webp', testimonial: 'The color palette changed everything. I get compliments daily!', name: 'Kavya, Delhi' },
    { src: '/transformation-3.webp', testimonial: 'Shopping is no longer overwhelming. I know exactly what works for me.', name: 'Priya, Bangalore' },
  ], []);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);

  useEffect(() => {
    const timer = setInterval(nextImage, 4000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const heroCta = heroCtaRef.current;
    if (!heroCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileCta(!entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(heroCta);
    return () => observer.disconnect();
  }, []);

  const faqs = [
    { question: 'Will this really help me look more elegant and confident?', answer: `Your Blueprint turns your proportions, colouring, facial architecture, lifestyle and preferences into specific styling decisions. ICONIK has worked with ${CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ women and men across ${CLIENT_PROOF.countriesServed}+ countries.` },
    { question: "What if the style suggestions don't feel like me?", answer: "We work 1-on-1 with you to ensure the style feels authentically you. Your stylist will adapt all recommendations to match your personality and comfort level." },
    {
      question: isOffer2699 ? 'What will I receive?' : 'How quickly will I see results?',
      answer: isOffer2699
        ? 'You receive 20 personalised outfit formulas, colour analysis, hairstyle and eyewear guidance, body-shape and concern-zone guidance, plus a 30-minute video consultation.'
        : `Your ICONIK Blueprint is delivered within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after your 30-minute consultation.`,
    },
    { question: 'What if I want changes after delivery?', answer: `${BLUEPRINT_OFFER.revisionPromise} ${BLUEPRINT_OFFER.refundSummary}` },
  ];

  const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Geometric Silhouette Profile™', desc: 'Your exact shoulder-to-hip ratio, torso length, and vertical line mapped to silhouettes that create optical balance for your frame.' },
    { icon: <Award className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Facial Architecture Analysis™', desc: 'Your face geometry mapped to exact necklines, earring shapes, collar structures, and eyewear that create visual balance.' },
    { icon: <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Chromatic Harmony Map™', desc: '10 exact colours that work for your undertone depth + 4 colours to eliminate entirely, with real shopping examples from Myntra and Ajio.' },
    { icon: <Gem className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: `${BLUEPRINT_OFFER.outfitFormulas} Personalised Outfit Formulas`, desc: 'Complete looks (top, bottom, footwear, bag) built specifically for your geometry and lifestyle — office, family events, occasions.' },
    { icon: <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Concern Zone Solutions', desc: 'Your specific insecurity (arms, tummy, height, bust) addressed with the exact garment structures and cuts that solve it.' },
    { icon: <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: '30-Minute Stylist Consultation', desc: 'A 1:1 video call with your dedicated ICONIK stylist before your Blueprint is built. Your preferences, your lifestyle, your goals — understood by a human first.' },
  ];

  return (
    <div className="man-editorial min-h-screen overflow-x-hidden pb-20 md:pb-0">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl" style={{ background: 'rgba(248,243,233,0.95)', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <span className="iconik-display" style={{ fontSize: '22px', letterSpacing: '0.12em', color: '#2C2622' }}>ICONIK</span>
        </div>
      </nav>

      {/* ── SECTION 1: Hero ─────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
        <div className="max-w-5xl mx-auto text-center">

          <div className="iconik-micro mb-6 opacity-55" style={{ color: '#2C2622' }}>
            {CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ CLIENTS · {CLIENT_PROOF.countriesServed}+ COUNTRIES · {BLUEPRINT_OFFER.weeklyClientCapacity} PLACES EACH WEEK
          </div>

          {/* Headline */}
          {isOffer2699 && (
            <div className="iconik-micro mb-4" style={{ color: '#2C2622', opacity: 0.6 }}>
              SCIENTIFIC PERSONAL STYLING FOR INDIAN WOMEN
            </div>
          )}
          <h1 className="iconik-display mb-5 leading-none" style={{ fontSize: 'clamp(32px, 7vw, 72px)', color: '#2C2622' }}>
            {headline}
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.65, maxWidth: '600px', margin: '0 auto 32px' }}>
            {subheadline}
          </p>

          {/* Primary CTA */}
          <Link
            ref={heroCtaRef}
            href={checkoutHref}
            onClick={() => trackCTAClick(isOffer2699 ? 'Get My Style Blueprint' : 'Begin Your Transformation', 'Hero Section', basePrice, 'INR', contentCategory)}
            className="inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            <span className="iconik-display" style={{ fontSize: '15px' }}>{isOffer2699 ? `Get My Style Blueprint — ${formattedBasePrice}` : 'Begin Your Transformation'}</span>
            <ArrowRight className="h-4 w-4 opacity-60" />
          </Link>

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <CheckCircle className="h-3.5 w-3.5" style={{ color: '#9a7d4a' }} />
            <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.6 }}>
              Secure checkout · {BLUEPRINT_OFFER.deliveryWorkingDays} working-day delivery · In-scope revisions included
            </span>
          </div>

          {/* Client transformation preview */}
          <div className="max-w-sm mx-auto mt-9 mb-2">
            <div className="rounded-3xl p-4 md:p-6" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <button onClick={prevImage} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:-translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Previous image">
                  <ArrowLeft className="w-4 h-4" style={{ color: '#2C2622' }} />
                </button>
                <div className="relative w-52 md:w-64" style={{ aspectRatio: '1/1' }}>
                  <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
                    <Image src={transformationImages[currentImageIndex].src} alt="Style Transformation" fill sizes="(max-width: 640px) 208px, 256px" className="object-cover" priority={currentImageIndex === 0} />
                  </div>
                </div>
                <button onClick={nextImage} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Next image">
                  <ArrowRight className="w-4 h-4" style={{ color: '#2C2622' }} />
                </button>
              </div>
              <div className="mt-4 text-center">
                <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.65, lineHeight: 1.6 }}>&ldquo;{transformationImages[currentImageIndex].testimonial}&rdquo;</p>
                <p className="iconik-mono mt-1" style={{ fontSize: '10px', color: '#94A6AD' }}>— {transformationImages[currentImageIndex].name}</p>
              </div>
              <div className="flex justify-center mt-1">
                {transformationImages.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className="flex h-11 w-11 items-center justify-center" aria-label={`Go to slide ${idx + 1}`}>
                    <span className="h-1.5 rounded-full transition-all duration-300" style={{ width: idx === currentImageIndex ? '16px' : '6px', background: idx === currentImageIndex ? '#2C2622' : 'rgba(44,38,34,0.2)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: Stats ────────────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: `${CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+`, label: 'Clients Styled' },
              { num: `${CLIENT_PROOF.countriesServed}+`, label: 'Countries Served' },
              { num: `${BLUEPRINT_OFFER.outfitFormulas}`, label: 'Outfit Formulas' },
              { num: `${BLUEPRINT_OFFER.weeklyClientCapacity}`, label: 'Clients Per Week' },
            ].map((s) => (
              <div key={s.label}>
                <div className="iconik-display flex items-center justify-center gap-1.5" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>
                  {s.num}
                </div>
                <div className="iconik-micro mt-2 opacity-50" style={{ color: '#2C2622' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Report Preview ────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>Your Deliverable</div>
            <div className="iconik-display" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#2C2622' }}>What Your Blueprint Actually Looks Like</div>
          </div>

          {/* Browser frame */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
            <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#EDE5D2', borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="rounded-full px-5 py-1.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <span className="iconik-mono opacity-40" style={{ fontSize: '10px', color: '#2C2622' }}>iconik.pro/your-blueprint</span>
                </div>
              </div>
            </div>

            <div className="relative h-[520px] overflow-hidden md:h-[640px]" style={{ background: '#faf9f6' }}>

              {/* Report nav */}
              <div className="sticky top-0 z-10 px-6 md:px-10 h-14 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#2C2622] flex items-center justify-center">
                    <Sparkles className="text-[#9a7d4a]" size={14} />
                  </div>
                  <span className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', letterSpacing: '0.4em', fontWeight: 700 }}>Iconik <span style={{ color: '#9a7d4a' }}>Blueprint</span></span>
                </div>
                <span className="iconik-mono opacity-25" style={{ fontSize: '9px', color: '#2C2622' }}>Pro Edition // 2025</span>
              </div>

              {/* Report header */}
              <div className="px-6 md:px-10 py-10" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)', background: '#fff' }}>
                <div className="flex items-center gap-3 mb-3" style={{ color: '#9a7d4a' }}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="iconik-mono" style={{ fontSize: '9px', letterSpacing: '0.4em', fontWeight: 700 }}>ANALYSIS VERIFIED</span>
                </div>
                <div className="iconik-display-it" style={{ fontSize: 'clamp(32px, 6vw, 56px)', color: '#2C2622', lineHeight: 1 }}>The Lookbook</div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Hourglass Profile</span>
                  <span className="iconik-mono px-4 py-2" style={{ background: '#faf9f6', border: '1px solid rgba(44,38,34,0.08)', color: '#2C2622', opacity: 0.45, fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Oval Face</span>
                  <span className="iconik-mono px-4 py-2" style={{ background: '#faf9f6', border: '1px solid rgba(44,38,34,0.08)', color: '#2C2622', opacity: 0.45, fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>{BLUEPRINT_OFFER.outfitFormulas} Outfits</span>
                </div>
              </div>

              {/* Section 01: Body Shape */}
              <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                  <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 01 — GEOMETRIC SILHOUETTE PROFILE™</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                    <Image src="/report-body-shape.webp" alt="Body Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 p-6 md:p-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Hourglass</span>
                      <span style={{ fontSize: '12px', color: '#2C2622', opacity: 0.4 }}>Your dominant body geometry</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { label: 'Shoulder–Hip Balance', value: 'Symmetrical — balanced frame' },
                        { label: 'Waist Definition', value: 'Naturally defined — visible curve' },
                        { label: 'Torso Length', value: 'Average — standard proportions' },
                        { label: 'Vertical Line', value: 'Elongated — good height ratio' },
                      ].map((row) => (
                        <div key={row.label}>
                          <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{row.label}</span>
                          <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pl-5 py-1" style={{ borderLeft: '2px solid rgba(154,125,74,0.2)' }}>
                      <p className="iconik-mono mb-2" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.3em', fontWeight: 700, fontStyle: 'italic' }}>Styling Directive</p>
                      <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, fontStyle: 'italic', lineHeight: 1.7, fontWeight: 300 }}>&ldquo;Celebrate the natural waist. Avoid boxy, shapeless silhouettes. Always define the middle — belted, wrap, or fitted waistbands are your friend.&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 02: Face Shape */}
              <div style={{ background: '#faf9f6', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                  <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 02 — FACIAL ARCHITECTURE ANALYSIS™</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                </div>
                <div className="flex flex-col md:flex-row" style={{ background: '#fff' }}>
                  <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                    <Image src="/report-face-shape.webp" alt="Face Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 p-6 md:p-10">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Oval Face</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Recommended For You</p>
                        <div className="space-y-3">
                          {[
                            { label: 'Necklines', value: 'V-neck, scoop, off-shoulder — all work' },
                            { label: 'Earrings', value: 'Any shape — studs to chandeliers' },
                            { label: 'Collar', value: 'Open collars, notch lapels, boat neck' },
                            { label: 'Eyewear', value: 'Square, cat-eye, aviator frames' },
                          ].map((item) => (
                            <div key={item.label}>
                              <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{item.label}</span>
                              <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Avoid</p>
                        <div className="space-y-2">
                          {['Overly round or circular earrings', 'Heavy turtlenecks that shorten neck', 'Round wire-frame glasses'].map((item) => (
                            <div key={item} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-red-300" />
                              <span style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, fontWeight: 300 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 03: Chromatic */}
              <div style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                  <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 03 — CHROMATIC HARMONY MAP™</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                </div>
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="iconik-mono px-4 py-2" style={{ background: '#2C2622', color: '#9a7d4a', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>Warm Undertone · Medium Depth</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="iconik-mono mb-5" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Your 10 Colours</p>
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {['#C4956A','#8B6914','#D4A853','#7C4A1E','#E8C99A','#5C3D2E','#F0E0C8','#9E6B3F','#3D2B1F','#B8860B'].map((hex) => (
                          <div key={hex} className="aspect-square rounded-lg shadow-sm" style={{ background: hex, border: '1px solid rgba(44,38,34,0.06)' }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="iconik-mono mb-5" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Eliminate These 4</p>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {['#E8E8F0','#C8D8E8','#F0E8F8','#D0E8D0'].map((hex) => (
                          <div key={hex} className="aspect-square rounded-lg relative shadow-sm" style={{ background: hex, border: '2px solid rgba(239,68,68,0.3)' }}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                              <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 04: Outfit teaser */}
              <div className="px-6 md:px-10 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(44,38,34,0.06)', background: '#faf9f6' }}>
                <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
                <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 04 — YOUR {BLUEPRINT_OFFER.outfitFormulas} PERSONALISED OUTFIT FORMULAS</span>
                <div className="h-px flex-1" style={{ background: 'rgba(44,38,34,0.08)' }} />
              </div>
              {[
                {
                  category: 'Corporate',
                  title: 'The Power Silhouette',
                  img: '/report-preview-1.webp',
                  items: [
                    { label: 'Top', value: 'Structured blazer in ivory — strong shoulders, nipped waist' },
                    { label: 'Bottom', value: 'Straight-cut trousers in slate grey, ankle-length' },
                    { label: 'Footwear', value: 'Block heel mules in nude — elongates the leg line' },
                    { label: 'Handbag', value: 'Structured tote in cognac leather' },
                    { label: 'Jewelry', value: 'Gold bar earrings + thin watch — clean authority' },
                  ],
                  rationale: 'The vertical line created by the blazer lapel draws the eye upward and visually lengthens the torso. Straight trousers maintain the hourglass definition without adding bulk at the hip.',
                },
                {
                  category: 'Occasion',
                  title: 'The Festive Edit',
                  img: '/report-preview-2.webp',
                  items: [
                    { label: 'Top', value: 'Draped kurta in deep teal silk — V-neck to elongate' },
                    { label: 'Bottom', value: 'Flared palazzo in matching teal — continuous vertical line' },
                    { label: 'Footwear', value: 'Heeled kolhapuris in antique gold' },
                    { label: 'Handbag', value: 'Embroidered clutch in bronze' },
                    { label: 'Jewelry', value: 'Statement jhumkas + minimal neckpiece' },
                  ],
                  rationale: 'A monochromatic head-to-toe in a deep tone creates a clean, unbroken vertical that flatters the hourglass by not interrupting the waist definition.',
                },
              ].map((look, i) => (
                <div key={i} style={{ background: '#fff', borderBottom: '1px solid rgba(44,38,34,0.06)' }}>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto flex-shrink-0 overflow-hidden" style={{ borderRight: '1px solid rgba(44,38,34,0.06)', background: '#f5f3ef' }}>
                      <Image src={look.img} alt={look.title} width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 p-6 md:p-10">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.4em', fontWeight: 700 }}>{look.category} Ensemble</span>
                      </div>
                      <div className="iconik-display-it mb-5" style={{ fontSize: 'clamp(22px, 3vw, 30px)', color: '#2C2622' }}>{look.title}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="iconik-mono mb-4" style={{ fontSize: '9px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.3em', fontWeight: 700 }}>Composition</p>
                          <div className="space-y-3">
                            {look.items.map((item) => (
                              <div key={item.label}>
                                <span className="iconik-mono block mb-0.5" style={{ fontSize: '8px', color: '#9a7d4a', letterSpacing: '0.2em', fontWeight: 700 }}>{item.label}</span>
                                <span style={{ fontSize: '12px', color: '#2C2622', fontWeight: 300 }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pl-5 py-1 self-start" style={{ borderLeft: '2px solid rgba(154,125,74,0.2)' }}>
                          <p className="iconik-mono mb-2" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.3em', fontWeight: 700, fontStyle: 'italic' }}>Stylist Rationale</p>
                          <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.5, fontStyle: 'italic', lineHeight: 1.7, fontWeight: 300 }}>&ldquo;{look.rationale}&rdquo;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="px-6 md:px-10 py-10 text-center" style={{ background: '#fff' }}>
                <span className="iconik-mono opacity-25" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.5em', fontWeight: 700 }}>+ {BLUEPRINT_OFFER.outfitFormulas - 2} More Outfits in Your Blueprint</span>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none rounded-b-2xl" style={{ background: 'linear-gradient(to top, #faf9f6, transparent)' }} />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="iconik-mono opacity-45" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.3em' }}>Sample Blueprint Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: What's Inside ──────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>Everything Inside</div>
            <div className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>The 6 Sections of Your Blueprint</div>
          </div>
          <div className="max-w-2xl mx-auto">
            {blueprintItems.map((item, i) => (
              <div key={i} className="flex items-start gap-5 py-5 transition-all duration-300" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }}>
                {item.icon}
                <div>
                  <div className="iconik-display mb-1" style={{ fontSize: '17px', color: '#2C2622' }}>{item.title}</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.75, color: '#2C2622', opacity: 0.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href={checkoutHref}
              onClick={() => trackCTAClick('Style Consultation', 'Whats Inside Section', basePrice, 'INR', contentCategory)}
              className="inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              <span className="iconik-display" style={{ fontSize: '15px' }}>{isOffer2699 ? `Get My Style Blueprint — ${formattedBasePrice}` : 'Get Your Style Consultation'}</span>
              <ArrowRight className="h-4 w-4 opacity-60" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Client Results ───────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>Client Stories</div>
            <div className="iconik-display mb-3" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>What changed for three ICONIK clients</div>
            <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55 }}>Their concerns were different. The advice had to fit their bodies, comfort and real lives.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Priya', age: '28', city: 'Mumbai', image: '/testimonial-priya.webp', concern: ['After my delivery, I felt conscious about my tummy and kept choosing loose tops.'], finding: ['Rectangle frame', 'Deep warm autumn undertone'], changed: ['Straight-cut kurtas instead of shapeless tops', 'Warmer, deeper colours near the face', 'Peplum and structured layers for occasions'], quote: 'Earlier I would change three or four times before going out. Now I know what to pick, and I still feel comfortable in it.', stars: 5 },
              { name: 'Ananya', age: '32', city: 'Delhi', image: '/testimonial-ananya.webp', concern: ['I felt conscious about my arms and wore full sleeves even in Delhi summer.'], finding: ['Inverted triangle frame', 'Cool neutral undertone'], changed: ['Cap and flutter sleeves that still felt comfortable', 'Raglan cuts to soften the shoulder line', 'More colour instead of wearing only black'], quote: 'I always thought covering my arms was the only option. The sleeve suggestions were practical, and the outfits still felt like me.', stars: 5 },
              { name: 'Shreya', age: '26', city: 'Bangalore', image: '/testimonial-shreya.webp', concern: ['On my petite frame, too much fabric made most outfits feel overwhelming.'], finding: ['Rectangle frame, short vertical line', 'Warm neutral undertone'], changed: ['Cleaner monochromatic combinations', 'Hem lengths that suited her height', 'Smaller accessories scaled to her frame'], quote: 'I used to save so many outfits and then buy nothing because I was confused. Now shopping feels much more straightforward.', stars: 4 },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="aspect-square overflow-hidden" style={{ background: 'rgba(237,229,210,0.5)' }}>
                  <Image src={c.image} alt={c.name} width={300} height={300} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="iconik-display" style={{ fontSize: '18px', color: '#2C2622' }}>{c.name} · {c.age} · {c.city}</div>
                    <div className="mt-3 me-rule-thin" />
                  </div>
                  {[
                    { label: 'Concern', val: c.concern.join(' ') },
                    { label: 'Finding', val: c.finding.join(' · ') },
                  ].map((row) => (
                    <div key={row.label} className="grid gap-x-3" style={{ gridTemplateColumns: '70px 1fr' }}>
                      <span className="iconik-mono pt-0.5" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.2em', fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontSize: '13px', color: '#2C2622', opacity: 0.75, lineHeight: 1.6 }}>{row.val}</span>
                    </div>
                  ))}
                  <div className="grid gap-x-3" style={{ gridTemplateColumns: '70px 1fr' }}>
                    <span className="iconik-mono pt-0.5" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.35, letterSpacing: '0.2em', fontWeight: 700 }}>Changed</span>
                    <div className="space-y-1">
                      {c.changed.map((ch) => (
                        <div key={ch} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#94A6AD' }} />
                          <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.75, lineHeight: 1.6 }}>{ch}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="me-rule-thin" />
                  <div>
                    <div className="iconik-display-it mb-3" style={{ fontSize: '14px', color: '#2C2622', opacity: 0.7, lineHeight: 1.6 }}>&ldquo;{c.quote}&rdquo;</div>
                    <div className="flex gap-1">
                      {[...Array(c.stars)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" style={{ color: '#9a7d4a' }} />)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Price ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6 me-slate">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p style={{ fontSize: '17px', lineHeight: 1.85, color: '#F4EFE5', opacity: 0.75, marginBottom: '32px', maxWidth: '520px', margin: '0 auto 32px' }}>
            A styling session can end when the call does. Your ICONIK Blueprint remains as a practical reference for getting dressed, shopping, hair, eyewear and colour decisions.
          </p>
          <div className="rounded-2xl p-10 mb-10 me-glass-light">
            <div className="iconik-micro mb-3 opacity-55" style={{ color: '#F4EFE5' }}>ICONIK Style Consultation</div>
            <div className="iconik-display mb-3" style={{ fontSize: 'clamp(40px, 8vw, 72px)', color: '#F4EFE5' }}>{formattedBasePrice}</div>
            <p style={{ fontSize: '16px', color: '#F4EFE5', opacity: 0.7, lineHeight: 1.8 }}>Yours forever. Built on your specific frame, face, and colour profile.</p>
          </div>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Style Consultation', 'Price Section', basePrice, 'INR', contentCategory)}
            className="inline-flex items-center gap-4 px-10 py-5 rounded-full transition-all duration-300 hover:opacity-75 me-glass-light"
          >
            <span className="iconik-display" style={{ fontSize: '16px', color: '#F4EFE5' }}>{isOffer2699 ? `Get My Style Blueprint — ${formattedBasePrice}` : `Get Your Style Consultation — ${formattedBasePrice}`}</span>
            <ArrowRight className="h-4 w-4 opacity-60" style={{ color: '#F4EFE5' }} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-display mb-3" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>Frequently Asked Questions</div>
            <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55, maxWidth: '380px', margin: '0 auto' }}>Everything you need to know about our consultations.</p>
          </div>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="cursor-pointer py-5" style={{ borderBottom: '1px solid rgba(44,38,34,0.08)' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex justify-between items-center gap-4">
                  <div className="iconik-display" style={{ fontSize: '17px', color: '#2C2622', lineHeight: 1.4 }}>{faq.question}</div>
                  <span className="iconik-mono flex-shrink-0 opacity-35" style={{ fontSize: '18px', color: '#2C2622' }}>{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.65, lineHeight: 1.8, marginTop: '12px' }}>{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11: Final CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6 text-center me-slate relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="iconik-display mb-3" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#F4EFE5', lineHeight: 1.1 }}>
            {isOffer2699 ? (
              'Stop Guessing What Flatters You.'
            ) : (
              <>Ready to Discover Your <span className="iconik-display-it opacity-55">Signature Style?</span></>
            )}
          </div>
          <p style={{ fontSize: '17px', color: '#F4EFE5', opacity: 0.75, marginTop: '16px', marginBottom: '40px', lineHeight: 1.85 }}>
            Get {BLUEPRINT_OFFER.outfitFormulas} personalised outfit formulas, your colour palette, hairstyle and eyewear guidance, plus a {BLUEPRINT_OFFER.consultationMinutes}-minute video consultation.
          </p>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Final CTA', 'Bottom Section', basePrice, 'INR', contentCategory)}
            className="inline-flex items-center gap-5 px-10 py-5 rounded-full mb-6 hover:opacity-75 transition-opacity me-glass-light"
          >
            <span className="iconik-display" style={{ fontSize: '28px', color: '#F4EFE5' }}>{formattedBasePrice}</span>
            <div className="w-px h-7" style={{ background: 'rgba(244,239,229,0.25)' }} />
            <span className="iconik-display-it" style={{ fontSize: '18px', color: '#F4EFE5' }}>{isOffer2699 ? 'Get My Style Blueprint →' : 'Start Your Transformation →'}</span>
          </Link>
          <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginTop: '16px' }}>
            <span className="iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>
              {CLIENT_PROOF.totalClients.toLocaleString('en-IN')}+ clients · {CLIENT_PROOF.countriesServed}+ countries · {BLUEPRINT_OFFER.deliveryWorkingDays} working-day delivery
            </span>
          </div>
        </div>
      </section>

      <ExploreLinksSection
        eyebrow="Knowledge Hub"
        title="Learn Before You Buy"
        description="Use the pages below to understand how Iconik works, what it costs, and the methodology behind the recommendations."
        groups={footerExploreGroups}
        className="bg-[#EDE5D2]/40"
      />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ background: '#EDE5D2', borderTop: '1px solid rgba(44,38,34,0.08)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Brand */}
            <div className="md:max-w-xs">
              <span className="iconik-display block mb-4" style={{ fontSize: '20px', letterSpacing: '0.08em', color: '#2C2622' }}>ICONIK</span>
              <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.6, lineHeight: 1.75 }}>
                Discover your signature style, boost your confidence, and embrace your elegant, authentic self.
              </p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="block mt-3 hover:opacity-100 transition-opacity" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5 }}>{SUPPORT_EMAIL}</a>
              <a href={SUPPORT_WHATSAPP_URL} className="block mt-1 hover:opacity-100 transition-opacity" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.5 }}>WhatsApp {SUPPORT_WHATSAPP_DISPLAY}</a>
              <p className="mt-2" style={{ fontSize: '12px', color: '#2C2622', opacity: 0.45 }}>{BUSINESS_HOURS.display}</p>
            </div>
            {/* Links */}
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <div className="iconik-mono mb-3" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.4, letterSpacing: '0.2em', fontWeight: 700 }}>NAVIGATE</div>
                <div className="space-y-2">
                  {['features', 'testimonials', 'pricing', 'faq'].map((anchor) => (
                    <a key={anchor} href={`#${anchor}`} className="block hover:opacity-100 transition-opacity capitalize" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.6 }}>{anchor.charAt(0).toUpperCase() + anchor.slice(1)}</a>
                  ))}
                </div>
              </div>
              <div>
                <div className="iconik-mono mb-3" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.4, letterSpacing: '0.2em', fontWeight: 700 }}>LEGAL</div>
                <div className="space-y-2">
                  {[{ label: 'Privacy Policy', href: '/privacy-policy' }, { label: 'Refund Policy', href: '/refund-policy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'About Us', href: '/about' }, { label: 'Contact', href: '/contact' }].map((link) => (
                    <Link key={link.href} href={link.href} className="block hover:opacity-100 transition-opacity" style={{ fontSize: '13px', color: '#2C2622', opacity: 0.6 }}>{link.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 text-center" style={{ borderTop: '1px solid rgba(44,38,34,0.08)' }}>
            <p className="iconik-micro opacity-35" style={{ color: '#2C2622' }}>© {new Date().getFullYear()} ICONIK. All rights reserved. Scientific personal styling for Indian women.</p>
            <p className="iconik-micro opacity-25 mt-1" style={{ color: '#2C2622' }}>Business Legal Name: {LEGAL_ENTITY_NAME} · Results may vary.</p>
          </div>
        </div>
      </footer>

      {/* ── Compact mobile CTA, shown only after the hero CTA leaves view ──── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl transition-all duration-300 md:hidden ${showMobileCta ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}
        style={{ background: 'rgba(248,243,233,0.98)', borderColor: 'rgba(44,38,34,0.08)' }}
      >
        <div className="mx-auto flex max-w-sm items-center gap-3">
          <div className="shrink-0">
            <div className="iconik-display" style={{ fontSize: '17px', color: '#2C2622' }}>{formattedBasePrice}</div>
            <div className="line-through" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.35 }}>{formattedOriginalPrice}</div>
          </div>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', basePrice, 'INR', contentCategory)}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#2C2622] px-4 py-3 text-[#F4EFE5] transition-colors duration-300 hover:bg-[#3d3430]"
          >
            <span className="iconik-display text-center" style={{ fontSize: '14px' }}>{isOffer2699 ? 'Get My Style Blueprint' : 'Begin Your Transformation'}</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
