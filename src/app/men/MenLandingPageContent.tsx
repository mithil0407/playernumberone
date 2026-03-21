'use client';

import Head from 'next/head';
import { trackCTAClick, trackPageView, trackViewContent } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Users,
  Heart,
  Menu,
  X,
  Star,
  Sparkles,
  Gem,
  Shield,
  Trophy,
  Award
} from 'lucide-react';
import { useState, useEffect, useMemo, type ReactNode } from 'react';

interface MenLandingPageContentProps {
  headline: ReactNode;
  subheadline: ReactNode;
  headlineClassName?: string;
}

export default function MenLandingPageContent({ headline, subheadline, headlineClassName }: MenLandingPageContentProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });

  // Track page view and product view on mount
  useEffect(() => {
    trackPageView('India');
    trackViewContent('ICONIK Men Style Consultation', 2499, ['iconik_men_style_consultation'], 'INR', 'India');
  }, []);

  // Transformation images data
  const transformationImages = useMemo(() => [
    {
      src: '/men-transformation-1.webp',
      testimonial: 'Finally know exactly what to wear. I walk into meetings differently now.',
      name: 'Rahul, Mumbai'
    },
    {
      src: '/men-transformation-2.webp',
      testimonial: 'The colour palette was a game changer. I get noticed for the right reasons.',
      name: 'Arjun, Delhi'
    },
    {
      src: '/men-transformation-3.webp',
      testimonial: 'Shopping used to feel random. Now every purchase makes sense.',
      name: 'Vikram, Bangalore'
    }
  ], []);

  // Navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % transformationImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + transformationImages.length) % transformationImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // 5-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.minutes === 0 && prevTime.seconds === 0) {
          return { minutes: 5, seconds: 0 };
        }
        if (prevTime.seconds === 0) {
          return { minutes: prevTime.minutes - 1, seconds: 59 };
        }
        return { minutes: prevTime.minutes, seconds: prevTime.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: 'Karan, 29',
      story: 'Finally have a wardrobe that actually works. I look sharp without overthinking it.',
      image: '/men-review-karan.webp'
    },
    {
      name: 'Siddharth, 33',
      story: 'The colour analysis alone was worth it. My skin looks better in photos than ever.',
      image: '/men-review-siddharth.webp'
    },
    {
      name: 'Nikhil, 27',
      story: 'Stopped buying clothes that just sit in my wardrobe. I know my system now.',
      image: '/men-review-nikhil.webp'
    }
  ];

  const faqs = [
    {
      question: 'Is this actually useful for men or just a women\'s service repackaged?',
      answer: 'ICONIK for men was built specifically around how men\'s bodies, wardrobes, and style goals work. The Blueprint covers your frame geometry, face shape, undertone, grooming, and real outfit formulas for office, casual, and Indian occasions — all through a male lens.'
    },
    {
      question: 'What if I just want to look sharp, not stylish?',
      answer: 'That\'s exactly the goal. The Blueprint isn\'t about trends or fashion — it\'s about identifying what fits your body well, what colours make you look healthy, and what silhouettes project authority. Sharp and unfussy is the outcome.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most men notice a difference the first time they apply the Blueprint to a purchase or a morning routine. The full confidence shift — where dressing no longer requires effort — typically settles in over 2–3 weeks of consistent application.'
    }
  ];

  return (
    <>
      <Head>
        <title>ICONIK Men — Discover Your Signature Style & Command the Room</title>
        <meta name="description" content="ICONIK for men: Your complete style transformation. Discover your frame type, personal colour palette, and sharp outfit formulas. Join 200+ men who dress with intention." />
        <meta name="keywords" content="men style transformation, personal style men India, colour palette men, men fashion India, confidence dressing men, style consultation men, wardrobe overhaul" />
        <meta property="og:title" content="ICONIK Men — Discover Your Signature Style & Command the Room" />
        <meta property="og:description" content="ICONIK for men: Your complete style transformation. Discover your frame type, personal colour palette, and sharp outfit formulas." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playernumberone.com/men" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ICONIK Men — Discover Your Signature Style & Command the Room" />
        <meta name="twitter:description" content="ICONIK for men: Your complete style transformation. Discover your frame type, personal colour palette, and sharp outfit formulas." />
        <link rel="canonical" href="https://playernumberone.com/men" />
      </Head>
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <span className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</span>
              </div>
              <div className="hidden md:flex items-center space-x-12">
                <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Features</a>
                <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Stories</a>
                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Investment</a>
                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
                <Link
                  href="/men/checkout"
                  className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                >
                  Begin Journey
                </Link>
              </div>
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-luxury-charcoal/60 hover:text-luxury-charcoal p-2"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream"
            >
              <div className="px-6 py-6 space-y-4">
                <a href="#features" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Features</a>
                <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Stories</a>
                <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Investment</a>
                <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                <Link
                  href="/men/checkout"
                  className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                >
                  Begin Journey
                </Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 lg:px-8 relative" id="hero">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8">
              {/* Press Logos */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-2 md:mt-4 mb-3 md:mb-4"
              >
                <p className="luxury-body text-luxury-charcoal/60 mb-4">Featured in</p>
                <div className="flex items-center justify-center gap-8 md:gap-12">
                  <Image
                    src="/times-of-india-logo.png"
                    alt="Times of India"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                  <Image
                    src="/femina-logo.png"
                    alt="Femina"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                  <Image
                    src="/vogue-india-logo.png"
                    alt="Vogue India"
                    width={120}
                    height={40}
                    className="opacity-40 hover:opacity-70 transition-opacity h-[40px] w-auto md:h-[50px]"
                  />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={headlineClassName || "text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.9] tracking-tight"}
              >
                {headline}
              </motion.h1>

              {/* Hero Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl lg:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-8 leading-relaxed"
              >
                {subheadline}
              </motion.p>

              {/* Testimonial Slideshow Above the Fold */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-4xl mx-auto mb-4 md:mb-6"
              >
                <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal">
                      ICONIK Transformations
                    </h3>
                  </div>

                  {/* Single Transformation Image with Arrow */}
                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    {/* Left Arrow */}
                    <button
                      onClick={prevImage}
                      className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                    >
                      <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                    </button>

                    {/* 1:1 Square Image */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 bg-luxury-cream/30 rounded-2xl overflow-hidden border-2 border-luxury-cream">
                      <Image
                        src={transformationImages[currentImageIndex].src}
                        alt="Style Transformation"
                        width={320}
                        height={320}
                        sizes="(max-width: 768px) 256px, 320px"
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={nextImage}
                      className="p-2 md:p-3 bg-luxury-accent/10 hover:bg-luxury-accent/20 rounded-full transition-all duration-300 group"
                    >
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-luxury-charcoal group-hover:text-luxury-green" />
                    </button>
                  </div>

                  {/* Testimonial Text Below Image */}
                  <div className="text-center mt-6 px-4">
                    <p className="text-luxury-charcoal text-sm md:text-base luxury-body leading-relaxed mb-2">
                      &quot;{transformationImages[currentImageIndex].testimonial}&quot;
                    </p>
                    <p className="text-luxury-green text-xs md:text-sm luxury-body font-medium">
                      - {transformationImages[currentImageIndex].name}
                    </p>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 mt-6">
                    {transformationImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-luxury-accent' : 'bg-luxury-accent/30'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link
                  href="/men/checkout"
                  onClick={() => {
                    trackCTAClick('Begin Your Transformation', 'Hero Section', undefined, 'INR', 'India');
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                >
                  Build Your Blueprint <ArrowRight className="ml-3 h-5 w-5 inline" />
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Elegant Stats */}
        <section className="py-12 md:py-20 bg-luxury-cream/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  200+
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Transformations</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  93%
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Look More Authoritative</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl md:text-6xl luxury-heading text-luxury-green">4.9</span>
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Client Satisfaction</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  2-3
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Weeks to Sharp</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-warm-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What You Receive</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Every Blueprint is built around your specific frame, face, and lifestyle — not generic menswear advice.
            </p>
          </div>

          {/* Report Preview — Interactive Lookbook Mockup */}
          <div className="mb-20 md:mb-32 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Your Deliverable</p>
              <h3 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">What Your Blueprint Actually Looks Like</h3>
            </div>

            {/* Browser Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-luxury-cream shadow-2xl">
              {/* macOS-style title bar */}
              <div className="bg-[#f0ede8] px-5 py-3 flex items-center gap-3 border-b border-[#e8e4de]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white/70 rounded-full px-5 py-1.5 text-[10px] text-luxury-charcoal/40 luxury-body tracking-wide">
                    iconik.playernumberone.com/your-blueprint
                  </div>
                </div>
              </div>

              {/* Scrollable Report Content */}
              <div className="h-[640px] overflow-y-auto overflow-x-hidden bg-[#faf9f6]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8e4de transparent' }}>

                {/* Report Nav */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#f0ede8] px-6 md:px-10 h-14 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-black flex items-center justify-center">
                      <Sparkles className="text-[#b58e4d]" size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Iconik <span className="text-[#b58e4d]">Blueprint</span></span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">Pro Edition // 2025</span>
                </div>

                {/* Report Header */}
                <div className="px-6 md:px-10 py-10 border-b border-[#f0ede8] bg-white">
                  <div className="flex items-center gap-3 text-[#b58e4d] text-[9px] font-black uppercase tracking-[0.4em] mb-3">
                    <CheckCircle className="w-4 h-4" /> Analysis Verified
                  </div>
                  <h2 className="text-4xl md:text-6xl luxury-heading text-black italic tracking-tighter leading-none">The Lookbook</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="px-4 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Athletic Build</span>
                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">Oval Face</span>
                    <span className="px-4 py-2 bg-[#faf9f6] border border-[#f0ede8] text-gray-400 text-[9px] font-black uppercase tracking-widest">14 Ensembles</span>
                  </div>
                </div>

                {/* ── Slide 1: Body Shape Analysis ── */}
                <div className="bg-white border-b border-[#f0ede8]">
                  <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#f0ede8]" />
                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 01 — Geometric Frame Profile™</span>
                    <div className="h-px flex-1 bg-[#f0ede8]" />
                  </div>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 border-r border-[#f0ede8]">
                      <Image src="/men-report-body-shape.webp" alt="Body Frame Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 p-6 md:p-10">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Athletic Build</span>
                        <span className="text-xs text-gray-400 font-light">Your dominant body geometry</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                          { label: 'Shoulder–Hip Ratio', value: 'Broader shoulders — inverted V frame' },
                          { label: 'Torso Length', value: 'Average — standard proportions' },
                          { label: 'Waist Definition', value: 'Moderate — slight taper visible' },
                          { label: 'Vertical Line', value: 'Elongated — favours clean verticals' },
                        ].map((row, idx) => (
                          <div key={idx}>
                            <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{row.label}</span>
                            <span className="text-xs text-black font-light">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-l-2 border-[#b58e4d]/20 pl-5 py-1">
                        <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-2 italic">Styling Directive</p>
                        <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;Lean into the V-taper. Avoid boxy oversized fits. Slim-straight trousers and fitted shirts maintain proportional balance without looking overdressed.&rdquo;</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Slide 2: Face Shape Analysis ── */}
                <div className="bg-[#faf9f6] border-b border-[#f0ede8]">
                  <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#e8e4de]" />
                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 02 — Facial Architecture Analysis™</span>
                    <div className="h-px flex-1 bg-[#e8e4de]" />
                  </div>
                  <div className="flex flex-col md:flex-row bg-white">
                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 border-r border-[#f0ede8]">
                      <Image src="/men-report-face-shape.webp" alt="Face Shape Analysis" width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 p-6 md:p-10">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Oval Face</span>
                        <span className="text-xs text-gray-400 font-light">Your facial geometry</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Recommended For You</p>
                          <div className="space-y-3">
                            {[
                              { label: 'Collar', value: 'Spread, button-down, open notch — all work' },
                              { label: 'Eyewear', value: 'Square, aviator, round — versatile' },
                              { label: 'Neckwear', value: 'Both ties and open-collar suit equally' },
                              { label: 'Hairstyle', value: 'Most cuts — textured, side-part, undercut' },
                            ].map((item, idx) => (
                              <div key={idx}>
                                <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{item.label}</span>
                                <span className="text-xs text-black font-light">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Avoid</p>
                          <div className="space-y-2">
                            {['Turtlenecks that compress the neck', 'Very wide lapels that widen the jaw', 'Round wire frames that echo face shape'].map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-300 mt-1.5 flex-shrink-0" />
                                <span className="text-xs text-gray-500 font-light">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Slide 3: Chromatic Harmony Map ── */}
                <div className="bg-white border-b border-[#f0ede8]">
                  <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#f0ede8]" />
                    <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 03 — Chromatic Harmony Map™</span>
                    <div className="h-px flex-1 bg-[#f0ede8]" />
                  </div>
                  <div className="p-6 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="px-5 py-2 bg-black text-[#b58e4d] text-[9px] font-black uppercase tracking-widest">Warm Undertone · Medium Depth</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                      {/* Your Palette */}
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Your 10 Colours</p>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {['#C4956A','#8B6914','#D4A853','#7C4A1E','#E8C99A','#5C3D2E','#F0E0C8','#9E6B3F','#3D2B1F','#B8860B'].map((hex, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5">
                              <div className="w-full aspect-square rounded-lg border border-[#f0ede8] shadow-sm" style={{ backgroundColor: hex }} />
                              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wide">{hex}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-400 font-light italic">Warm earthy tones, camel, olive — all deepen and sharpen your natural complexion</p>
                      </div>
                      {/* Eliminate */}
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5">Eliminate These 4</p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {['#E8E8F0','#C8D8E8','#F0E8F8','#D0E8D0'].map((hex, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5">
                              <div className="w-full aspect-square rounded-lg border-2 border-red-200 relative shadow-sm" style={{ backgroundColor: hex }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-px bg-red-300 rotate-45 absolute" />
                                  <div className="w-full h-px bg-red-300 -rotate-45 absolute" />
                                </div>
                              </div>
                              <span className="text-[7px] font-bold text-red-300 uppercase tracking-wide">{hex}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-400 font-light italic">Cool pastels and icy greys wash out warm undertones and make the complexion appear dull</p>
                        <div className="mt-6 border-l-2 border-[#b58e4d]/20 pl-4">
                          <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-1 italic">Shopping Note</p>
                          <p className="text-xs text-gray-500 font-light italic">Real examples from Myntra &amp; Ajio included in your full Blueprint</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Slide 4: Outfit Cards ── */}
                <div className="px-6 md:px-10 py-6 border-b border-[#f0ede8] bg-[#faf9f6] flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#e8e4de]" />
                  <span className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.5em]">Section 04 — Your 14 Outfit Formulas</span>
                  <div className="h-px flex-1 bg-[#e8e4de]" />
                </div>

                {[
                  {
                    category: 'Business',
                    title: 'The Command Look',
                    img: '/men-report-preview-1.webp',
                    items: [
                      { label: 'Top', value: 'Slim-fit Oxford shirt in white — clean, no pattern noise' },
                      { label: 'Bottom', value: 'Slim-straight trousers in charcoal grey, tapered ankle' },
                      { label: 'Footwear', value: 'Derby shoes in dark tan — grounded authority' },
                      { label: 'Outerwear', value: 'Unstructured blazer in camel — soft but sharp' },
                      { label: 'Watch', value: 'Minimalist dial — no loud complications' },
                    ],
                    rationale: 'The monochromatic grey-white axis reads as quietly powerful. The blazer adds structure without formality. Camel grounds the warm undertone and elevates the complexion.',
                    tags: ['100% Cotton Poplin', 'Wool Blend', 'Full Canvas'],
                  },
                  {
                    category: 'Indian Occasion',
                    title: 'The Festive Presence',
                    img: '/men-report-preview-2.webp',
                    items: [
                      { label: 'Top', value: 'Nehru-collar kurta in deep terracotta — warm undertone perfect' },
                      { label: 'Bottom', value: 'Slim churidar in off-white — elongates the leg' },
                      { label: 'Footwear', value: 'Kolhapuris in cognac leather — grounded' },
                      { label: 'Accessory', value: 'Minimal pocket square or no accessory' },
                      { label: 'Fabric', value: 'Raw silk or cotton-silk blend for depth' },
                    ],
                    rationale: 'Deep terracotta pulls warm undertones forward and makes the complexion appear richer. Slim churidar maintains a clean vertical from waist to ankle — the most flattering cut for Indian formalwear.',
                    tags: ['Raw Silk', 'Cotton Silk', 'Zari Weave'],
                  },
                ].map((look, i) => (
                  <div key={i} className="flex flex-col md:flex-row bg-white border-b border-[#f0ede8]">
                    <div className="w-full md:w-[220px] aspect-[4/5] md:aspect-auto bg-[#f5f3ef] flex-shrink-0 overflow-hidden border-r border-[#f0ede8]">
                      <Image src={look.img} alt={look.title} width={220} height={275} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 p-6 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[#b58e4d] text-[9px] font-black uppercase tracking-[0.4em]">{look.category} Ensemble</span>
                        <div className="h-px w-8 bg-[#b58e4d]/30" />
                      </div>
                      <h3 className="text-2xl md:text-3xl luxury-heading text-black italic mb-6 leading-tight">{look.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Composition</p>
                          <div className="space-y-3">
                            {look.items.map((item, idx) => (
                              <div key={idx}>
                                <span className="text-[#b58e4d] font-black uppercase text-[8px] tracking-[0.2em] block mb-0.5">{item.label}</span>
                                <span className="text-xs text-black font-light leading-relaxed">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="border-l-2 border-[#b58e4d]/20 pl-5 py-1">
                            <p className="text-[9px] font-black text-[#b58e4d] uppercase tracking-[0.3em] mb-2 italic">Stylist Rationale</p>
                            <p className="text-xs text-gray-500 font-light italic leading-relaxed">&ldquo;{look.rationale}&rdquo;</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Fabric & Texture</p>
                            <div className="flex flex-wrap gap-2">
                              {look.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1.5 border border-[#f0ede8] text-gray-400 text-[8px] font-black uppercase tracking-widest rounded-full bg-[#faf9f6]">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* More outfits teaser */}
                <div className="bg-white px-6 md:px-10 py-10 text-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">+ 12 More Ensembles in Your Blueprint</p>
                </div>

              </div>

              {/* Bottom fade + scroll cue */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#faf9f6] to-transparent pointer-events-none rounded-b-2xl" />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-luxury-charcoal/30">
                <span>Scroll to explore</span>
                <ArrowRight size={10} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-10 md:mb-16">
            <p className="text-xs luxury-body text-luxury-charcoal/40 uppercase tracking-[0.3em] mb-3">Everything Inside</p>
            <h3 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal">The 6 Sections of Your Blueprint</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            {[
              {
                icon: '/icon1.webp',
                title: "Geometric Frame Profile™",
                description: "Your shoulder-to-hip ratio, torso length, and vertical line mapped to fits and silhouettes that create sharp optical balance — no guesswork"
              },
              {
                icon: '/icon2.webp',
                title: "16 Outfit Formulas",
                description: "Complete looks (shirt, trouser, footwear, outerwear) built for your exact frame — office, smart casual, Indian occasion, weekend"
              },
              {
                icon: '/icon3.webp',
                title: "Facial Architecture Analysis™",
                description: "Your face geometry mapped to collar styles, lapel widths, eyewear, and hairstyles that create visual proportion and presence"
              },
              {
                icon: '/icon4.webp',
                title: "Chromatic Harmony Map™",
                description: "10 exact colours that sharpen your complexion + 4 to cut entirely, with real shopping examples from Myntra and Ajio"
              },
              {
                icon: '/icon5.webp',
                title: "Fit & Proportion Solutions",
                description: "Your specific concern — broad shoulders, narrow frame, height, belly — addressed with the exact cuts and structures that solve it, with the reasoning behind each"
              },
              {
                icon: '/icon6.webp',
                title: "30-Minute Stylist Call",
                description: "A 1:1 video call with your dedicated ICONIK stylist before the Blueprint is built. Your wardrobe, your lifestyle, your goals — understood by a human first"
              }
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 md:p-6 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-xl hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-start space-y-3">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <Image src={item.icon} alt={item.title} width={40} height={40} className="w-10 h-10 object-contain" />
                  </div>
                  <h3 className="text-sm md:text-base luxury-heading text-luxury-charcoal">{item.title}</h3>
                  <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/70 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* Book Image Card */}
        <section className="py-20 md:py-32 bg-luxury-warm-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 lg:p-16 border border-luxury-cream"
            >
              <div className="text-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-4 md:mb-6">
                  <Image
                    src="/book.png"
                    alt="ICONIK Men Style Guide Preview"
                    width={400}
                    height={400}
                    sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                    loading="lazy"
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-4">
                  Your Personal Style Blueprint
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl">
                  A complete system for dressing with intention
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Micro Case Studies Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What the Blueprint actually found</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Three men. Three different frames. Three specific solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {[
              {
                name: 'Rohan',
                age: '31',
                city: 'Mumbai',
                image: '/men-case-rohan.webp',
                concern: ['Broad shoulders, always looked', 'too formal or too casual'],
                finding: ['Athletic inverted-V frame', 'Warm autumn undertone'],
                changed: ['Unstructured blazers replaced stiff jackets', 'Slim-straight replaced skinny', 'Warm palette — camel, olive, rust introduced'],
                quote: 'I walk into meetings and the room shifts.',
                stars: 5,
              },
              {
                name: 'Dev',
                age: '28',
                city: 'Delhi',
                finding: ['Rectangle frame — minimal taper', 'Cool neutral undertone'],
                image: '/men-case-dev.webp',
                concern: ['Slim frame, clothes', 'always looked borrowed'],
                changed: ['Structured shoulders introduced', 'Layering system built for depth', 'Jewel tones replaced all-black uniform'],
                quote: 'I look like I dressed on purpose now.',
                stars: 5,
              },
              {
                name: 'Amit',
                age: '35',
                city: 'Bangalore',
                image: '/men-case-amit.webp',
                concern: ['Post-30 belly — avoided', 'anything fitted for years'],
                finding: ['Rectangle frame, medium vertical', 'Warm neutral undertone'],
                changed: ['Straight-cut kurtas replaced baggy shirts', 'Dark warm palette — no more grey everywhere', 'Fit calibrated to shoulder, not belly'],
                quote: 'Shopping is no longer trial and error.',
                stars: 4,
              },
            ].map((c, index) => (
              <div
                key={index}
                className="bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-2 group"
              >
                {/* Photo */}
                <div className="aspect-square bg-luxury-cream/50 overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.name}
                    width={300}
                    height={300}
                    sizes="(max-width: 768px) 90vw, 300px"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-8 space-y-5">
                  {/* Name */}
                  <div>
                    <p className="luxury-heading text-luxury-charcoal text-lg leading-none">{c.name} · {c.age} · {c.city}</p>
                    <div className="mt-3 h-px bg-luxury-cream" />
                  </div>

                  {/* Concern */}
                  <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Concern</span>
                    <span className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{c.concern.join(' ')}</span>
                  </div>

                  {/* Finding */}
                  <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Finding</span>
                    <div className="space-y-0.5">
                      {c.finding.map((f, i) => (
                        <p key={i} className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{f}</p>
                      ))}
                    </div>
                  </div>

                  {/* Changed */}
                  <div className="grid grid-cols-[80px_1fr] gap-x-3 items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-charcoal/40 pt-0.5">Changed</span>
                    <div className="space-y-1">
                      {c.changed.map((ch, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-luxury-green mt-1.5 flex-shrink-0" />
                          <p className="luxury-body text-luxury-charcoal/80 text-sm leading-snug">{ch}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-luxury-cream" />

                  {/* Quote + Stars */}
                  <div>
                    <p className="luxury-body text-luxury-charcoal italic text-sm leading-relaxed mb-3">&ldquo;{c.quote}&rdquo;</p>
                    <div className="flex gap-1">
                      {[...Array(c.stars)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-luxury-gold fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32 bg-luxury-warm-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Investment</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              One Blueprint. A permanent system for how you dress.
            </p>
          </div>

          {/* Main Product */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 mb-8 md:mb-12">
            <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl md:text-3xl luxury-heading mb-3 text-luxury-charcoal">
                    ICONIK Men Style Blueprint
                  </h3>
                  <div className="text-2xl md:text-3xl font-semibold mb-2 text-luxury-green">₹2,499</div>
                  <p className="text-base md:text-lg luxury-subheading text-luxury-charcoal/70">
                    Your complete personal style system
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg luxury-heading mb-6 text-luxury-charcoal text-center">What&apos;s Included:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 max-w-2xl mx-auto">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        Complete frame analysis — fits and silhouettes for your exact build
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        Personal colour palette — 10 that work, 4 to eliminate
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        Face shape analysis — collar, eyewear, hairstyle mapped
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        Grooming & hair direction for your facial architecture
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        30-minute 1-on-1 call with your dedicated ICONIK stylist
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        16 complete outfit formulas — office, casual, Indian occasion
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                      <span className="luxury-body text-luxury-charcoal/80 text-sm">
                        Fit & proportion solutions for your specific concern
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <Link
                    href="/men/checkout"
                    onClick={() => {
                      trackCTAClick('Men Style Blueprint', 'Pricing Section', 2499, 'INR', 'India');
                    }}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-3 rounded-full text-base luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    ✨ Get Your Men&apos;s Blueprint
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Before/After Visual Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ willChange: 'transform' }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-4 text-luxury-charcoal">
                The Blueprint in practice
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 max-w-3xl mx-auto">
                Real clients. Specific findings. Measurable change.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {[
                {
                  before: '/men-style-before.webp',
                  after: '/men-style-after.webp',
                  beforeLabel: 'Before — ill-fitting silhouette, wrong palette',
                  afterLabel: 'After — Geometric Frame Profile™ applied',
                  caption: 'Rohan, 31, Mumbai · Athletic inverted-V frame · Warm autumn undertone · Blueprint prescribed unstructured blazers, slim-straight, warm camel-olive palette'
                },
                {
                  before: '/men-wardrobe-before.webp',
                  after: '/men-wardrobe-after.webp',
                  beforeLabel: 'Before — dressing to disappear',
                  afterLabel: 'After — Fit & Proportion Solutions applied',
                  caption: 'Amit, 35, Bangalore · Rectangle frame · Warm neutral undertone · Blueprint prescribed straight-cut kurtas, structured shoulders, dark warm palette'
                }
              ].map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  style={{ willChange: 'transform' }}
                  className="group relative"
                >
                  <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2">
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
                      <div>
                        <p className="text-[10px] font-semibold text-luxury-charcoal/50 uppercase tracking-widest mb-3 leading-tight">{comparison.beforeLabel}</p>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                          <Image
                            src={comparison.before}
                            alt={comparison.beforeLabel}
                            width={250}
                            height={250}
                            sizes="(max-width: 768px) 45vw, 250px"
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold text-luxury-green uppercase tracking-widest mb-3 leading-tight">{comparison.afterLabel}</p>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50">
                          <Image
                            src={comparison.after}
                            alt={comparison.afterLabel}
                            width={250}
                            height={250}
                            sizes="(max-width: 768px) 45vw, 250px"
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-200/30 via-transparent to-transparent" />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm luxury-body text-luxury-charcoal/60 leading-relaxed border-t border-luxury-cream pt-4">{comparison.caption}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 md:py-32 px-4 bg-luxury-warm-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-charcoal">
                Sound Familiar?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                {
                  num: '01',
                  text: 'You get dressed every morning and it still feels like you\'re guessing. Not wrong exactly. Just never sharp.',
                  image: '/men-feeling-overlooked1.webp',
                  imageAlt: 'Man at mirror'
                },
                {
                  num: '02',
                  text: "You've read the guides. Watched the videos. Tried the capsule wardrobe. Nothing has actually stuck.",
                  image: '/men-style-confusion1.webp',
                  imageAlt: 'Man with clothes'
                },
                {
                  num: '03',
                  text: "The budget is fine. The clothes are fine. But every outfit still feels like you could have done better.",
                  image: '/men-confidence-issues1.webp',
                  imageAlt: 'Man looking at himself'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 lg:p-10 border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, 300px"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>

                  <span className="block luxury-heading text-2xl mb-4 leading-none" style={{ color: '#b58e4d' }}>{item.num}</span>
                  <p className="luxury-body text-luxury-charcoal/80 text-base md:text-lg leading-relaxed">{item.text}</p>

                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl luxury-heading mb-4 text-luxury-charcoal">
              Frequently Asked Questions
            </h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-base md:text-lg">
              Everything you need to know before you start.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="text-left p-5 md:p-6 bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-base md:text-lg luxury-heading mb-2 text-luxury-charcoal">{faq.question}</h3>
                <p className="luxury-body text-luxury-charcoal/80 text-sm md:text-base leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 px-4 bg-luxury-accent">
          <div className="max-w-4xl mx-auto text-center text-luxury-warm-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-warm-white">
                Ready to Dress With Intention?
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading mb-12 opacity-90 max-w-2xl mx-auto">
                Join 200+ men who stopped guessing and built a style that actually works for them
              </p>
              <div className="space-y-8">
                <Link
                  href="/men/checkout"
                  onClick={() => {
                    trackCTAClick('Final CTA Men', 'Bottom Section', 2499, 'INR', 'India');
                  }}
                  className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-12 py-5 rounded-full text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
                >
                  <span className="relative z-10">✨ Get Your ICONIK Men&apos;s Blueprint</span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-luxury-warm-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>

                {/* Trust & Urgency */}
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="bg-luxury-warm-white/10 backdrop-blur-xl border border-luxury-warm-white/20 rounded-2xl p-6 text-center">
                    <p className="luxury-body text-luxury-warm-white text-lg">⏰ Limited Time Offer</p>
                    <p className="luxury-body text-luxury-warm-white/80">Only 15 slots available this week</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 luxury-body text-luxury-warm-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>7-Day Money Back</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>200+ Success Stories</span>
                    </div>
                  </div>
                </div>

                <p className="luxury-body opacity-75 text-center">₹2,499 + GST • Limited slots available</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 bg-luxury-cream/30 border-t border-luxury-cream">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="text-3xl luxury-heading text-luxury-charcoal mb-6">ICONIK</div>
                <p className="luxury-body text-luxury-charcoal/70 mb-6 max-w-md leading-relaxed">
                  Dress with intention. Build a wardrobe that works every single time.
                </p>
                <div className="flex gap-4">
                  <a
                    href="mailto:support@playernumberone.com"
                    className="luxury-body text-luxury-charcoal/60 hover:text-luxury-green transition-colors"
                  >
                    support@playernumberone.com
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-6">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#features" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Features</a>
                  </li>
                  <li>
                    <a href="#testimonials" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Stories</a>
                  </li>
                  <li>
                    <a href="#pricing" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Pricing</a>
                  </li>
                  <li>
                    <a href="#faq" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">FAQ</a>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-6">Legal & Support</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/about" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">About Us</Link>
                  </li>
                  <li>
                    <Link href="/contact" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Contact Us</Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Shipping & Delivery</Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Refund Policy</Link>
                  </li>
                  <li>
                    <Link href="/terms" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Terms of Service</Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors">Privacy Policy</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-luxury-cream pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="luxury-body text-luxury-charcoal/50 text-sm">
                © {new Date().getFullYear()} ICONIK. All rights reserved.
              </p>
              <p className="luxury-body text-luxury-charcoal/40 text-xs">
                Personal styling for Indian men who dress with purpose.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
