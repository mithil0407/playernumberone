'use client';

import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';
import Link from 'next/link';
import Image from 'next/image';
import ExploreLinksSection from '@/components/ExploreLinksSection';
import { footerExploreGroups } from '@/lib/seoContent';
import { SUPPORT_EMAIL } from '@/lib/seo';
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
import { useState, useEffect, useMemo, type ReactNode } from 'react';

interface LandingPageContentProps {
  headline: ReactNode;
  subheadline: ReactNode;
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
  checkoutHref = '/checkout',
  basePrice = 3299,
  originalPrice = 5999,
  displayBasePrice,
  displayOriginalPrice,
}: LandingPageContentProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ minutes: 5, seconds: 0 });

  const formattedBasePrice = displayBasePrice ?? `₹${basePrice.toLocaleString('en-IN')}`;
  const formattedOriginalPrice = displayOriginalPrice ?? `₹${originalPrice.toLocaleString('en-IN')}`;

  useEffect(() => {
    trackPageView('India');
    trackViewContent('ICONIK Style Consultation', basePrice, ['iconik_style_consultation'], 'INR', 'India');
  }, [basePrice]);

  const transformationImages = useMemo(() => [
    { src: '/transformation-1.webp', testimonial: 'Finally found my signature style! I feel confident every day.', name: 'Shreya, Mumbai' },
    { src: '/transformation-2.webp', testimonial: 'The color palette changed everything. I get compliments daily!', name: 'Kavya, Delhi' },
    { src: '/transformation-3.webp', testimonial: 'Shopping is no longer overwhelming. I know exactly what works for me.', name: 'Priya, Bangalore' },
  ], []);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.minutes === 0 && prevTime.seconds === 0) return { minutes: 5, seconds: 0 };
        if (prevTime.seconds === 0) return { minutes: prevTime.minutes - 1, seconds: 59 };
        return { minutes: prevTime.minutes, seconds: prevTime.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextImage, 4000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const faqs = [
    { question: 'Will this really help me look more elegant and confident?', answer: "Absolutely! ICONIK focuses on your complete style transformation - personalized colors, flattering silhouettes, and confidence-building. We've helped 200+ women discover their signature style." },
    { question: "What if the style suggestions don't feel like me?", answer: "We work 1-on-1 with you to ensure the style feels authentically you. Your stylist will adapt all recommendations to match your personality and comfort level." },
    { question: 'How quickly will I see results?', answer: 'Most women see immediate improvements in how they feel about their appearance within the first week. The complete transformation and confidence boost typically develops over 2-3 weeks.' },
  ];

  const blueprintItems = [
    { icon: <Trophy className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Geometric Silhouette Profile™', desc: 'Your exact shoulder-to-hip ratio, torso length, and vertical line mapped to silhouettes that create optical balance for your frame.' },
    { icon: <Award className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Facial Architecture Analysis™', desc: 'Your face geometry mapped to exact necklines, earring shapes, collar structures, and eyewear that create visual balance.' },
    { icon: <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: 'Chromatic Harmony Map™', desc: '10 exact colours that work for your undertone depth + 4 colours to eliminate entirely, with real shopping examples from Myntra and Ajio.' },
    { icon: <Gem className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#94A6AD' }} />, title: '16 Outfit Formulas', desc: 'Complete looks (top, bottom, footwear, bag) built specifically for your geometry and lifestyle — office, family events, occasions.' },
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

          {/* Featured in */}
          <div className="mb-6">
            <div className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>Featured in</div>
            <div className="flex items-center justify-center gap-8">
              <Image src="/times-of-india-logo.png" alt="Times of India" width={100} height={30} className="opacity-35 hover:opacity-60 transition-opacity h-[30px] w-auto" />
              <Image src="/femina-logo.png" alt="Femina" width={80} height={25} className="opacity-35 hover:opacity-60 transition-opacity h-[25px] w-auto" />
              <Image src="/vogue-india-logo.png" alt="Vogue India" width={60} height={20} className="opacity-35 hover:opacity-60 transition-opacity h-[20px] w-auto md:h-[25px]" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="iconik-display mb-5 leading-none" style={{ fontSize: 'clamp(32px, 7vw, 72px)', color: '#2C2622' }}>
            {headline}
          </h1>

          {/* Subheadline */}
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#2C2622', opacity: 0.65, maxWidth: '600px', margin: '0 auto 32px' }}>
            {subheadline}
          </p>

          {/* Carousel */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="rounded-3xl p-4 md:p-6" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <button onClick={prevImage} className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:-translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Previous image">
                  <ArrowLeft className="w-4 h-4" style={{ color: '#2C2622' }} />
                </button>
                <div className="relative w-52 md:w-64" style={{ aspectRatio: '1/1' }}>
                  <div className="w-full h-full rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(44,38,34,0.1)' }}>
                    <Image src={transformationImages[currentImageIndex].src} alt="Style Transformation" fill className="object-cover" priority={currentImageIndex === 0} />
                  </div>
                </div>
                <button onClick={nextImage} className="p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0 hover:translate-x-0.5" style={{ background: '#F8F3E9', border: '1px solid rgba(44,38,34,0.1)' }} aria-label="Next image">
                  <ArrowRight className="w-4 h-4" style={{ color: '#2C2622' }} />
                </button>
              </div>
              <div className="mt-4 text-center">
                <p style={{ fontSize: '13px', color: '#2C2622', opacity: 0.65, lineHeight: 1.6 }}>&ldquo;{transformationImages[currentImageIndex].testimonial}&rdquo;</p>
                <p className="iconik-mono mt-1" style={{ fontSize: '10px', color: '#94A6AD' }}>— {transformationImages[currentImageIndex].name}</p>
              </div>
              <div className="flex justify-center gap-2 mt-3">
                {transformationImages.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className="h-1.5 rounded-full transition-all duration-300" style={{ width: idx === currentImageIndex ? '16px' : '6px', background: idx === currentImageIndex ? '#2C2622' : 'rgba(44,38,34,0.2)' }} aria-label={`Go to slide ${idx + 1}`} />
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Begin Your Transformation', 'Hero Section', basePrice, 'INR', 'India')}
            className="inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-10 py-5 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform mb-8"
          >
            <span className="iconik-display" style={{ fontSize: '15px' }}>Begin Your Transformation</span>
            <ArrowRight className="h-4 w-4 opacity-60" />
          </Link>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: '#9a7d4a' }} />)}
            </div>
            <span className="iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>Trusted by 200+ women across India</span>
            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>24-Hour Delivery</span>
            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.3 }}>·</span>
            <span className="hidden md:inline iconik-mono" style={{ fontSize: '11px', color: '#2C2622', opacity: 0.6 }}>7-Day Guarantee</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Stats ────────────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '200+', label: 'Transformations' },
              { num: '95%', label: 'Confidence Elevation' },
              { num: '4.9', label: 'Client Satisfaction', star: true },
              { num: '2-3', label: 'Weeks to Elegance' },
            ].map((s) => (
              <div key={s.label}>
                <div className="iconik-display flex items-center justify-center gap-1.5" style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: '#2C2622' }}>
                  {s.num}
                  {s.star && <Star className="h-5 w-5 fill-current" style={{ color: '#9a7d4a' }} />}
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

            <div className="h-[640px] overflow-y-auto overflow-x-hidden" style={{ background: '#faf9f6', scrollbarWidth: 'thin' }}>

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
                  <span className="iconik-mono px-4 py-2" style={{ background: '#faf9f6', border: '1px solid rgba(44,38,34,0.08)', color: '#2C2622', opacity: 0.45, fontSize: '9px', letterSpacing: '0.2em', fontWeight: 700 }}>14 Ensembles</span>
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
                <span className="iconik-mono" style={{ fontSize: '9px', color: '#9a7d4a', letterSpacing: '0.5em', fontWeight: 700 }}>SECTION 04 — YOUR 14 OUTFIT FORMULAS</span>
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
                <span className="iconik-mono opacity-25" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.5em', fontWeight: 700 }}>+ 12 More Ensembles in Your Blueprint</span>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none rounded-b-2xl" style={{ background: 'linear-gradient(to top, #faf9f6, transparent)' }} />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="iconik-mono opacity-30" style={{ fontSize: '9px', color: '#2C2622', letterSpacing: '0.3em' }}>Scroll to explore</span>
              <ArrowRight size={10} className="rotate-90 opacity-30" style={{ color: '#2C2622' }} />
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
              onClick={() => trackCTAClick('Style Consultation', 'Whats Inside Section', basePrice, 'INR', 'India')}
              className="inline-flex items-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              <span className="iconik-display" style={{ fontSize: '15px' }}>Get Your Style Consultation</span>
              <ArrowRight className="h-4 w-4 opacity-60" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Personal Style Guide ─────────────────────────────── */}
      <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-8 md:p-12" style={{ background: 'rgba(237,229,210,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
            <div className="text-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-6">
                <Image src="/book.png" alt="ICONIK Style Guide Preview" width={400} height={400} className="object-contain drop-shadow-2xl" loading="lazy" />
              </div>
              <div className="iconik-display mb-3" style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#2C2622' }}>Your Personal Style Guide</div>
              <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.6, lineHeight: 1.8 }}>Comprehensive style transformation roadmap</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Case Studies ──────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>Real Findings</div>
            <div className="iconik-display mb-3" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>What the Blueprint actually found</div>
            <p style={{ fontSize: '15px', color: '#2C2622', opacity: 0.55 }}>Three women. Three different geometries. Three specific solutions.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Priya', age: '28', city: 'Mumbai', image: '/testimonial-priya.webp', concern: ['Post-partum tummy, avoided', 'fitted anything for 2 years'], finding: ['Rectangle frame', 'Deep warm autumn undertone'], changed: ['Straight kurtas replaced flowy tops', 'Dark autumn palette introduced', 'Peplum added for occasions'], quote: 'I stopped hiding. I started showing up.', stars: 5 },
              { name: 'Ananya', age: '32', city: 'Delhi', image: '/testimonial-ananya.webp', concern: ['Heavy arms, wore full', 'sleeves in 35° heat'], finding: ['Inverted triangle frame', 'Cool neutral undertone'], changed: ['Cap sleeves + flutter sleeves introduced', 'Raglan cuts for shoulder balance', 'Eliminated black-only dressing'], quote: 'Everyone keeps asking if I lost weight', stars: 5 },
              { name: 'Shreya', age: '26', city: 'Bangalore', image: '/testimonial-shreya.webp', concern: ['Petite frame, felt', 'overwhelmed by fabric'], finding: ['Rectangle frame, short vertical line', 'Warm neutral undertone'], changed: ['Monochromatic dressing introduced', 'Hem lengths calibrated precisely', 'Accessories scaled to frame'], quote: 'Shopping is no longer overwhelming.', stars: 4 },
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

      {/* ── SECTION 7: Price Anchor ───────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6 me-slate">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p style={{ fontSize: '17px', lineHeight: 1.85, color: '#F4EFE5', opacity: 0.75, marginBottom: '32px', maxWidth: '520px', margin: '0 auto 32px' }}>
            A personal styling session in India costs ₹15,000–50,000+. They give you one day. You forget half of it. You still don&apos;t know your colours or your frame.
          </p>
          <div className="rounded-2xl p-10 mb-10 me-glass-light">
            <div className="iconik-micro mb-3 opacity-55" style={{ color: '#F4EFE5' }}>ICONIK Style Consultation</div>
            <div className="iconik-display mb-3" style={{ fontSize: 'clamp(40px, 8vw, 72px)', color: '#F4EFE5' }}>{formattedBasePrice}</div>
            <p style={{ fontSize: '16px', color: '#F4EFE5', opacity: 0.7, lineHeight: 1.8 }}>Yours forever. Built on your specific frame, face, and colour profile.</p>
          </div>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Style Consultation', 'Price Section', basePrice, 'INR', 'India')}
            className="inline-flex items-center gap-4 px-10 py-5 rounded-full transition-all duration-300 hover:opacity-75 me-glass-light"
          >
            <span className="iconik-display" style={{ fontSize: '16px', color: '#F4EFE5' }}>Get Your Style Consultation — {formattedBasePrice}</span>
            <ArrowRight className="h-4 w-4 opacity-60" style={{ color: '#F4EFE5' }} />
          </Link>
        </div>
      </section>

      {/* ── SECTION 8: Before / After ─────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6" style={{ background: '#EDE5D2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-micro mb-4 opacity-45" style={{ color: '#2C2622' }}>The Blueprint in Practice</div>
            <div className="iconik-display" style={{ fontSize: 'clamp(28px, 5vw, 52px)', color: '#2C2622' }}>Real clients. Specific findings. Measurable change.</div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { before: '/style-before.webp', after: '/style-after.webp', beforeLabel: 'Before — avoiding structure entirely', afterLabel: 'After — Geometric Silhouette Profile™ applied', caption: 'Rekha, 34, Bangalore · Rectangle frame · Warm autumn undertone · Blueprint prescribed vertical seams, cap sleeves, dark palette' },
              { before: '/wardrobe-before.webp', after: '/wardrobe-after.webp', beforeLabel: 'Before — dressing to hide', afterLabel: 'After — Concern Zone Solutions applied', caption: 'Ananya, 29, Mumbai · Apple frame · Cool neutral undertone · Blueprint prescribed empire cuts, A-line kurtas, deep cool palette' },
            ].map((comparison) => (
              <div key={comparison.caption} className="rounded-3xl p-6 md:p-8 hover:-translate-y-1 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="iconik-micro mb-3 opacity-45" style={{ color: '#2C2622' }}>{comparison.beforeLabel}</p>
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden"><Image src={comparison.before} alt={comparison.beforeLabel} fill className="object-cover" /></div>
                  </div>
                  <div>
                    <p className="iconik-micro mb-3" style={{ color: '#94A6AD' }}>{comparison.afterLabel}</p>
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden"><Image src={comparison.after} alt={comparison.afterLabel} fill className="object-cover" /></div>
                  </div>
                </div>
                <div className="me-rule-thin mb-4" />
                <p style={{ fontSize: '12px', color: '#2C2622', opacity: 0.55, lineHeight: 1.8 }}>{comparison.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: Sound Familiar ─────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #F8F3E9 0%, #F1E9D8 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="iconik-display" style={{ fontSize: 'clamp(32px, 6vw, 60px)', color: '#2C2622' }}>Sound Familiar?</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { num: '01', text: 'You get dressed every morning and something still feels off. Not wrong exactly. Just never quite right.', image: '/feeling-overlooked1.webp', imageAlt: 'Woman at mirror' },
              { num: '02', text: "You've tried the body type guides. The Pinterest boards. The 'flattering for pears' articles. Nothing has stuck.", image: '/style-confusion1.webp', imageAlt: 'Woman with clothes' },
              { num: '03', text: "The weight hasn't changed. The budget hasn't changed. But every outfit still feels like a compromise.", image: '/confidence-issues1.webp', imageAlt: 'Woman looking at mirror side-on' },
            ].map((item) => (
              <div key={item.num} className="rounded-3xl p-6 md:p-8 hover:-translate-y-1 transition-all duration-300" style={{ background: '#EDE5D2', border: '1px solid rgba(44,38,34,0.08)' }}>
                <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden">
                  <Image src={item.image} alt={item.imageAlt} fill className="object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(44,38,34,0.3), transparent)' }} />
                </div>
                <div className="iconik-display mb-4" style={{ fontSize: '24px', color: '#94A6AD' }}>{item.num}</div>
                <p style={{ fontSize: '14px', color: '#2C2622', opacity: 0.75, lineHeight: 1.75 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 10: FAQ ───────────────────────────────────────────────── */}
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
            Ready to Discover Your{' '}
            <span className="iconik-display-it opacity-55">Signature Style?</span>
          </div>
          <p style={{ fontSize: '17px', color: '#F4EFE5', opacity: 0.75, marginTop: '16px', marginBottom: '40px', lineHeight: 1.85 }}>
            Join 200+ women who have already transformed their confidence and discovered their elegant style.
          </p>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Final CTA', 'Bottom Section', basePrice, 'INR', 'India')}
            className="inline-flex items-center gap-5 px-10 py-5 rounded-full mb-6 hover:opacity-75 transition-opacity me-glass-light"
          >
            <span className="iconik-display" style={{ fontSize: '28px', color: '#F4EFE5' }}>{formattedBasePrice}</span>
            <div className="w-px h-7" style={{ background: 'rgba(244,239,229,0.25)' }} />
            <span className="iconik-display-it" style={{ fontSize: '18px', color: '#F4EFE5' }}>Start Your Transformation →</span>
          </Link>
          <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginTop: '16px' }}>
            <span className="iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>★★★★★ Trusted by 200+ women across India</span>
            <span className="hidden md:inline iconik-mono opacity-30" style={{ fontSize: '11px', color: '#F4EFE5' }}>·</span>
            <span className="hidden md:inline iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>24-Hour Delivery</span>
            <span className="hidden md:inline iconik-mono opacity-30" style={{ fontSize: '11px', color: '#F4EFE5' }}>·</span>
            <span className="hidden md:inline iconik-mono opacity-50" style={{ fontSize: '11px', color: '#F4EFE5' }}>7-Day Money-Back Guarantee</span>
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
            <p className="iconik-micro opacity-25 mt-1" style={{ color: '#2C2622' }}>Business Legal Name: MITHIL NILESH NAVALAKHA · Results may vary.</p>
          </div>
        </div>
      </footer>

      {/* ── Sticky Mobile CTA ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t p-3 md:hidden z-50" style={{ background: 'rgba(248,243,233,0.98)', borderColor: 'rgba(44,38,34,0.08)' }}>
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.5 }}>Complete Package</div>
              <div className="flex items-baseline gap-1">
                <span className="iconik-display" style={{ fontSize: '16px', color: '#2C2622' }}>{formattedBasePrice}</span>
                <span className="line-through" style={{ fontSize: '12px', color: '#2C2622', opacity: 0.35 }}>{formattedOriginalPrice}</span>
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="iconik-mono" style={{ fontSize: '10px', color: '#2C2622', opacity: 0.5 }}>Expires:</div>
              <div className="iconik-display" style={{ fontSize: '14px', color: '#2C2622' }}>
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
          <Link
            href={checkoutHref}
            onClick={() => trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', basePrice, 'INR', 'India')}
            className="w-full inline-flex items-center justify-center gap-3 bg-[#2C2622] hover:bg-[#3d3430] text-[#F4EFE5] px-6 py-4 rounded-full transition-all duration-300 block"
          >
            <span className="iconik-display" style={{ fontSize: '15px' }}>Begin Your Transformation</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
