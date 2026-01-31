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
import { useState, useEffect, useMemo } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });
  const [showDoubtClearingPopup, setShowDoubtClearingPopup] = useState(false);
  const [hasScrolledHalfway, setHasScrolledHalfway] = useState(false);
  const [hasClickedCTA, setHasClickedCTA] = useState(false);

  // Track page view and product view on mount
  useEffect(() => {
    trackPageView('India');
    trackViewContent('ICONIK Style Consultation', 1999, ['iconik_style_consultation'], 'INR', 'India');
  }, []);

  // Transformation images data
  const transformationImages = useMemo(() => [
    {
      src: '/transformation-1.webp',
      testimonial: 'Finally found my signature style! I feel confident every day.',
      name: 'Shreya, Mumbai'
    },
    {
      src: '/transformation-2.webp',
      testimonial: 'The color palette changed everything. I get compliments daily!',
      name: 'Kavya, Delhi'
    },
    {
      src: '/transformation-3.webp',
      testimonial: 'Shopping is no longer overwhelming. I know exactly what works for me.',
      name: 'Priya, Bangalore'
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

  // Preload all images for faster transitions
  useEffect(() => {
    transformationImages.forEach((image) => {
      const img = new window.Image();
      img.src = image.src;
    });
  }, [transformationImages]);

  // 5-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.minutes === 0 && prevTime.seconds === 0) {
          // Reset to 5 minutes when timer reaches 0
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

  // Detect scroll halfway down the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50 && !hasScrolledHalfway && !hasClickedCTA) {
        setHasScrolledHalfway(true);
        setShowDoubtClearingPopup(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolledHalfway, hasClickedCTA]);

  // Detect exit intent (mouse leaving viewport)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showDoubtClearingPopup && !hasClickedCTA) {
        setShowDoubtClearingPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showDoubtClearingPopup, hasClickedCTA]);

  const testimonials = [
    {
      name: 'Priya, 28',
      story: 'Finally discovered my signature style. I feel confident and elegant in my own skin.',
      image: '/testimonial-priya.webp'
    },
    {
      name: 'Ananya, 32',
      story: 'The color palette changed everything! People keep asking what I did differently.',
      image: '/testimonial-ananya.webp'
    },
    {
      name: 'Shreya, 26',
      story: 'Shopping is no longer overwhelming. I know exactly what works for me.',
      image: '/testimonial-shreya.webp'
    }
  ];

  const faqs = [
    {
      question: 'Will this really help me look more elegant and confident?',
      answer: 'Absolutely! ICONIK focuses on your complete style transformation - personalized colors, flattering silhouettes, and confidence-building. We\'ve helped 200+ women discover their signature style.'
    },
    {
      question: 'What if the style suggestions don\'t feel like me?',
      answer: 'We work 1-on-1 with you to ensure the style feels authentically you. Your stylist will adapt all recommendations to match your personality and comfort level.'
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most women see immediate improvements in how they feel about their appearance within the first week. The complete transformation and confidence boost typically develops over 2-3 weeks.'
    }
  ];

  return (
    <>
      <Head>
        <title>ICONIK - Discover Your Signature Style & Transform Your Confidence</title>
        <meta name="description" content="ICONIK: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence. Join 200+ women who transformed their lives." />
        <meta name="keywords" content="style transformation, personal style, color palette, women fashion, confidence building, style consultation, wardrobe makeover" />
        <meta property="og:title" content="ICONIK - Discover Your Signature Style & Transform Your Confidence" />
        <meta property="og:description" content="ICONIK: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playernumberone.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ICONIK - Discover Your Signature Style & Transform Your Confidence" />
        <meta name="twitter:description" content="ICONIK: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence." />
        <link rel="canonical" href="https://playernumberone.com" />
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
                  href="/checkout"
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
                  href="/checkout"
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
                className="text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.9] tracking-tight"
              >
                Discover Your <span className="text-luxury-green">Signature Style</span> in <span className="text-luxury-charcoal">24 hours</span>
              </motion.h1>

              {/* Hero Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl lg:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-8 leading-relaxed"
              >
                Get <span className="font-semibold text-luxury-accent">16 personalized outfits</span>, your <span className="font-semibold text-luxury-green">color palette</span>, and a <span className="font-semibold text-luxury-accent">1-on-1 stylist call</span>
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

                    {/* 1:1 Square Image Placeholder */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 bg-luxury-cream/30 rounded-2xl overflow-hidden border-2 border-luxury-cream">
                      <Image
                        src={transformationImages[currentImageIndex].src}
                        alt="Style Transformation"
                        width={320}
                        height={320}
                        className="w-full h-full object-cover"
                        priority
                        loading="eager"
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
                  href="/checkout"
                  onClick={() => {
                    // Track CTA click with Meta Pixel
                    trackCTAClick('Begin Your Transformation', 'Hero Section', undefined, 'INR', 'India');
                    setHasClickedCTA(true);
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                >
                  Begin Your Transformation <ArrowRight className="ml-3 h-5 w-5 inline" />
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
                  95%
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Confidence Elevation</div>
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
                <div className="luxury-body text-luxury-charcoal/70">Weeks to Elegance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-warm-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What You Receive</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Every consultation is tailored to celebrate your individuality and elevate your personal style.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            {[
              { icon: <Sparkles className="h-6 w-6 text-luxury-green" />, title: "Personal Style Assessment" },
              { icon: <Gem className="h-6 w-6 text-luxury-green" />, title: "Curated Outfit Planning" },
              { icon: <Heart className="h-6 w-6 text-luxury-green" />, title: "Makeup & Grooming Guidance" },
              { icon: <Shield className="h-6 w-6 text-luxury-green" />, title: "Wardrobe Strategy" },
              { icon: <Award className="h-6 w-6 text-luxury-green" />, title: "Confidence Coaching" },
              { icon: <Trophy className="h-6 w-6 text-luxury-green" />, title: "Event-Specific Styling" }
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 md:p-6 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-xl hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-sm md:text-base luxury-heading text-center text-luxury-charcoal">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Book Image Card - Moved Lower */}
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
                    alt="ICONIK Style Guide Preview"
                    width={400}
                    height={400}
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-4">
                  Your Personal Style Guide
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl">
                  Comprehensive style transformation roadmap
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Client Stories</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Hear from women who transformed their confidence and presence with ICONIK.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2 group"
              >
                <div className="space-y-6">
                  <div className="aspect-square bg-luxury-cream/50 flex items-center justify-center rounded-xl overflow-hidden">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <p className="luxury-body text-luxury-charcoal/80 text-center text-lg leading-relaxed">
                    &ldquo;{testimonial.story}&rdquo;
                  </p>
                  <div className="text-center">
                    <p className="luxury-body text-luxury-charcoal/60 mb-3">{testimonial.name}</p>
                    <div className="flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-luxury-gold fill-current" />
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
              Select a package that aligns with your journey to elegance.
            </p>
          </div>

          {/* Main Product */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 mb-8 md:mb-12">
            <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl md:text-3xl luxury-heading mb-3 text-luxury-charcoal">
                    ICONIK Style Consultation
                  </h3>
                  <div className="text-2xl md:text-3xl font-semibold mb-2 text-luxury-green">₹1,999</div>
                  <p className="text-base md:text-lg luxury-subheading text-luxury-charcoal/70">
                    Complete personal style transformation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-lg luxury-heading mb-4 text-luxury-charcoal">What&apos;s Included:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Complete style assessment tailored to your features
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Personalized color palette that makes your skin glow
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Body-flattering silhouettes that work with your shape
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Hair & beauty advice for your unique features
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          20-minute one-on-one call with expert stylist
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          16 Styled Looks for every occasion
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Beauty and Makeup Plan personalized for you
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-luxury-pink-bg border border-luxury-accent/20 rounded-xl p-5 text-center">
                    <div className="text-3xl mb-3">✨</div>
                    <h4 className="text-lg luxury-heading text-luxury-charcoal mb-2">Personal Touch</h4>
                    <p className="luxury-body text-luxury-charcoal/70 text-sm">Tailored specifically for you</p>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/checkout"
                    onClick={() => {
                      trackCTAClick('Style Consultation', 'Pricing Section', 1999, 'INR', 'India');
                    }}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 py-3 rounded-full text-base luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    ✨ Get Your Style Consultation
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
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-8 text-luxury-charcoal">
                See the Transformation
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 max-w-3xl mx-auto">
                Real results from real women who transformed their style with ICONIK
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {[
                {
                  before: '/style-before.webp',
                  after: '/style-after.webp',
                  title: 'Style Confidence',
                  description: 'From feeling invisible to radiating elegance'
                },
                {
                  before: '/wardrobe-before.webp',
                  after: '/wardrobe-after.webp',
                  title: 'Wardrobe Mastery',
                  description: 'From style confusion to effortless chic'
                }
              ].map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative"
                >
                  <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2">
                    <h3 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-8 text-center">{comparison.title}</h3>

                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="text-center">
                        <div className="luxury-body text-luxury-charcoal/60 mb-4">Before</div>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                          <Image
                            src={comparison.before}
                            alt={`Before ${comparison.title}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="luxury-body text-luxury-charcoal/60 mb-4">After</div>
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100">
                          <Image
                            src={comparison.after}
                            alt={`After ${comparison.title}`}
                            width={250}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-rose-200/30 via-transparent to-transparent"></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 text-center leading-relaxed">{comparison.description}</p>
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
              <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 max-w-3xl mx-auto">
                Many women feel the same way. You&apos;re not alone in this journey.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                {
                  icon: Users,
                  text: 'Feel overlooked or invisible in social settings?',
                  color: 'red',
                  image: '/feeling-overlooked.webp',
                  imageAlt: 'Woman feeling overlooked'
                },
                {
                  icon: Clock,
                  text: 'Confused about what styles actually suit you?',
                  color: 'orange',
                  image: '/style-confusion.webp',
                  imageAlt: 'Style confusion'
                },
                {
                  icon: Heart,
                  text: 'Lost confidence in your appearance?',
                  color: 'rose',
                  image: '/confidence-issues.webp',
                  imageAlt: 'Confidence building'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 lg:p-10 border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Problem Image */}
                  <div className="relative w-full aspect-square mb-4 md:mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </div>

                  <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${item.color === 'red' ? 'bg-red-100' :
                    item.color === 'orange' ? 'bg-orange-100' : 'bg-rose-100'
                    }`}>
                    <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${item.color === 'red' ? 'text-red-600' :
                      item.color === 'orange' ? 'text-orange-600' : 'text-rose-600'
                      }`} />
                  </div>
                  <p className="text-xl md:text-2xl luxury-heading text-luxury-charcoal text-center leading-relaxed">{item.text}</p>

                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              Everything you need to know about our consultations.
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
                Ready to Discover Your Signature Style?
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading mb-12 opacity-90 max-w-2xl mx-auto">
                Join 200+ women who have already transformed their confidence and discovered their elegant style
              </p>
              <div className="space-y-8">
                <Link
                  href="/checkout"
                  onClick={() => {
                    // Track final CTA click with Meta Pixel
                    trackCTAClick('Final CTA', 'Bottom Section', 1699, 'INR', 'India');
                  }}
                  className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-12 py-5 rounded-full text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
                >
                  <span className="relative z-10">✨ Start Your ICONIK Transformation Today</span>
                  {/* Glass shine effect */}
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

                <p className="luxury-body opacity-75 text-center">₹1,699 + GST • Limited slots available</p>
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
                  Discover your signature style, boost your confidence, and embrace your elegant, authentic self.
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
                    <a
                      href="#features"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#testimonials"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Stories
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="luxury-heading text-luxury-charcoal mb-6">Legal & Support</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/about"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shipping"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refund-policy"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-luxury-cream pt-8 text-center">
              <p className="luxury-body text-luxury-charcoal/60">
                © 2024 PlayerNumberOne ICONIK. All rights reserved. | Transform with elegance.
              </p>
              <p className="luxury-body text-luxury-charcoal/50 text-sm mt-2">
                Business Legal Name: MITHIL NILESH NAVALAKHA
              </p>
              <p className="luxury-body text-luxury-charcoal/50 text-sm mt-1">
                Results may vary. Individual success depends on effort and commitment to the program.
              </p>
            </div>
          </div>
        </footer>

        {/* Sticky Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="luxury-body text-luxury-charcoal/70 text-xs">Complete Package</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-luxury-green">₹1,699</span>
                  <span className="line-through text-luxury-charcoal/40 text-xs">₹5,999</span>
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="luxury-body text-luxury-charcoal/60 text-xs">Expires:</div>
                <div className="luxury-body text-luxury-green text-sm font-medium">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => {
                // Track CTA click with Meta Pixel
                trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 1699, 'INR', 'India');
                setHasClickedCTA(true);
              }}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
            >
              Begin Your Transformation
            </Link>
          </div>
        </div>

        {/* Clear Doubts Exit Intent Popup */}
        {showDoubtClearingPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-luxury-warm-white rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl"
            >
              <button
                onClick={() => setShowDoubtClearingPopup(false)}
                className="absolute top-4 right-4 text-luxury-charcoal/60 hover:text-luxury-charcoal transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🎁</div>
                <h3 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">
                  Not ready yet?
                </h3>
                <p className="luxury-body text-luxury-charcoal/80 text-base md:text-lg mb-2">
                  <span className="text-luxury-accent font-semibold">Still have doubts? Chat with us on WhatsApp</span> — we can help!
                </p>
                <p className="luxury-body text-luxury-charcoal/60 text-sm">
                  No sign-up. Just pure style advice.
                </p>
              </div>

              <a
                href="https://api.whatsapp.com/send/?phone=919130048899&text=Hi+ICONIK%21+I%27m+interested+in+your+style+consultation+but+have+some+doubts.+Can+you+help+me%3F&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackCTAClick('Clear Doubts - WhatsApp', 'Exit Intent Popup - WhatsApp', undefined, 'INR', 'India');
                  setShowDoubtClearingPopup(false);
                }}
                className="flex items-center justify-center gap-2 w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white px-8 py-4 rounded-full text-lg luxury-body font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-3"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Clear My Doubts
              </a>

              <button
                onClick={() => setShowDoubtClearingPopup(false)}
                className="w-full luxury-body text-luxury-charcoal/60 hover:text-luxury-charcoal text-sm transition-colors"
              >
                No thanks, I&apos;ll decide later
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
