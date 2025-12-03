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
  Zap,
  Target,
  Menu,
  X,
  Star,
  Sparkles,
  Gem,
  Shield,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function MonthlyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDoubtClearingPopup, setShowDoubtClearingPopup] = useState(false);
  const [hasScrolledHalfway, setHasScrolledHalfway] = useState(false);
  const [hasClickedCTA, setHasClickedCTA] = useState(false);

  // Track page view and product view on mount
  useEffect(() => {
    trackPageView();
    trackViewContent('ICONIK Monthly Subscription', 499, ['iconik_monthly_subscription']);
  }, []);

  // Transformation images data for monthly service
  const transformationImages = useMemo(() => [
    {
      src: '/transformation-1.webp',
      testimonial: 'I wake up to styled outfits every Monday. No more wardrobe stress!',
      name: 'Anjali, Mumbai'
    },
    {
      src: '/transformation-2.webp',
      testimonial: 'The AI images help me see myself styled before buying anything.',
      name: 'Kavya, Delhi'
    },
    {
      src: '/transformation-3.webp',
      testimonial: 'Week 12 and still obsessed. My stylist just gets me.',
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
      name: 'Anjali, 28',
      story: 'I\'ve been getting styled for 12 weeks now. Every Monday feels like a mini fashion show!',
      image: '/testimonial-ananya.webp',
      weeks: 12
    },
    {
      name: 'Kavya, 32', 
      story: 'No more scrolling Myntra for hours. My stylist just gets me.',
      image: '/testimonial-kavya.webp',
      weeks: 8
    },
    {
      name: 'Priya, 26',
      story: 'The AI images made me see myself differently. Game changer!',
      image: '/testimonial-priya.webp',
      weeks: 4
    }
  ];

  const faqs = [
    {
      question: 'How does the ₹99 trial work?',
      answer: 'Pay ₹99 to get your first week (3 styled outfits delivered Mon/Wed/Fri). After the trial, continue for ₹499/month or cancel anytime with no charges.'
    },
    {
      question: 'Do I need to download an app?',
      answer: 'No! Everything happens on WhatsApp. You\'ll receive styled outfits directly as messages with AI-generated images of you in each look.'
    },
    {
      question: 'What if I don\'t like an outfit?',
      answer: 'Just reply to your stylist on WhatsApp and we\'ll send you alternative looks within 24 hours. Unlimited revisions included.'
    },
    {
      question: 'How are the AI images created?',
      answer: 'You upload 2 photos during the quiz. Our AI technology uses your photos to show you styled in each outfit recommendation, so you can visualize how it looks on YOUR body before committing.'
    },
    {
      question: 'Can I pause or cancel my subscription?',
      answer: 'Yes! Cancel or pause anytime by replying "PAUSE" or "CANCEL" to your stylist on WhatsApp. No contracts, no penalties.'
    },
    {
      question: 'What\'s the difference between Monthly and Monthly + Consultation?',
      answer: 'Monthly gives you ongoing weekly styling. Monthly + Consultation adds a one-time 90-minute video call with a comprehensive style guide, color analysis, and wardrobe strategy—perfect if you want deep personalization upfront.'
    },
    {
      question: 'How do you know my style preferences?',
      answer: 'You take a 2-minute quiz covering body type, style vibes, budget, and lifestyle. Your stylist uses this to curate outfits tailored specifically to you. Plus, your preferences are refined over time based on your feedback.'
    },
    {
      question: 'Do you provide shopping links?',
      answer: 'Currently, we focus on styling curation and outfit recommendations. You\'ll see exactly what pieces make up each look, which you can find on your own or we can guide you to similar options.'
    }
  ];

  return (
    <>
      <Head>
        <title>ICONIK Monthly - Your Personal Stylist on WhatsApp | ₹499/month</title>
        <meta name="description" content="Get 3 personalized outfits delivered to WhatsApp every week. AI-styled images show YOU in each look. Starting at ₹499/month. Try first week for ₹99." />
        <meta name="keywords" content="personal stylist subscription, whatsapp styling, AI outfit recommendations, monthly fashion service, personal styling India" />
        <meta property="og:title" content="ICONIK Monthly - Your Personal Stylist on WhatsApp" />
        <meta property="og:description" content="Get 3 personalized outfits delivered to WhatsApp every week. AI-styled images show YOU in each look. Try first week for ₹99." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://iconik.pro/monthly" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ICONIK Monthly - Your Personal Stylist on WhatsApp" />
        <meta name="twitter:description" content="Get 3 personalized outfits delivered to WhatsApp every week. Try first week for ₹99." />
        <link rel="canonical" href="https://iconik.pro/monthly" />
      </Head>
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Link href="/" className="text-3xl luxury-heading text-luxury-charcoal tracking-wider">ICONIK</Link>
              </div>
              <div className="hidden md:flex items-center space-x-12">
                <a href="#how-it-works" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">How It Works</a>
                <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Testimonials</a>
                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Pricing</a>
                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
                <Link
                  href="/checkout-monthly"
                  className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                >
                  Start Your Style Journey
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
                <a href="#how-it-works" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">How It Works</a>
                <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Testimonials</a>
                <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Pricing</a>
                <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                <Link
                  href="/checkout-monthly"
                  className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                >
                  Start Your Style Journey
                </Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 lg:px-8 relative" id="hero">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-[0.9] tracking-tight"
              >
                Your Personal Stylist. 
                <span className="text-luxury-green"> Every Week.</span> 
                On <span className="text-luxury-accent">WhatsApp.</span>
              </motion.h1>

              {/* Hero Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl lg:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-8 leading-relaxed"
              >
                Get <span className="font-semibold text-luxury-accent">3 personalized outfits</span> every week delivered to your WhatsApp. 
                See yourself in each outfit with <span className="font-semibold text-luxury-green">AI-styled images</span>. 
                Starting at just <span className="font-semibold text-luxury-accent">₹499/month</span>.
              </motion.p>

              {/* Social Proof Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8 text-luxury-charcoal/70 luxury-body text-sm md:text-base"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-luxury-green" />
                  <span>1,200+ women styled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-luxury-gold fill-current" />
                  <span>4.8/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-luxury-accent" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>

              {/* Transformation Slideshow */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="max-w-4xl mx-auto mb-4 md:mb-6"
              >
                <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-luxury-cream">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal">
                      ICONIK Monthly Transformations
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
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                          index === currentImageIndex ? 'bg-luxury-accent' : 'bg-luxury-accent/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
          
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <Link 
                  href="/checkout-monthly" 
                  onClick={() => {
                    trackCTAClick('Start Your Style Journey', 'Hero Section', 499);
                    setHasClickedCTA(true);
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                >
                  Start Your Style Journey <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </motion.div>

              {/* Trust Line */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-4 luxury-body text-luxury-charcoal/60 text-sm"
              >
                ✓ First week for ₹99 • ✓ Cancel anytime • ✓ No contracts
              </motion.p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-20 bg-luxury-cream/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  1,200+
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Women Styled Weekly</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  12
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Outfits Per Month</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl md:text-6xl luxury-heading text-luxury-green">4.8</span>
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Average Rating</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  ₹42
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Cost Per Outfit</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-warm-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">
              How ICONIK Monthly Works
            </h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              From quiz to styled—your weekly transformation in 3 simple steps
            </p>
          </div>
                
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-luxury-accent/10 rounded-full flex items-center justify-center">
                <span className="text-2xl md:text-3xl luxury-heading text-luxury-accent">1</span>
              </div>
              <div className="mb-6 relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border-2 border-luxury-cream">
                <Image 
                  src="/step1-assessment.webp" 
                  alt="Take style quiz"
                  width={400} 
                  height={400} 
                  className="object-cover w-full h-full" 
                />
              </div>
              <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4">
                Take Your Style Quiz
              </h3>
              <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                2-minute quiz about your body type, style preferences, and lifestyle. 
                Upload 2 photos so we can show you in the outfits.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-luxury-green/10 rounded-full flex items-center justify-center">
                <span className="text-2xl md:text-3xl luxury-heading text-luxury-green">2</span>
              </div>
              <div className="mb-6 relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border-2 border-luxury-cream">
                <Image 
                  src="/step2-consultation.webp" 
                  alt="Stylist curates looks"
                  width={400} 
                  height={400} 
                  className="object-cover w-full h-full" 
                />
              </div>
              <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4">
                Your Stylist Curates
              </h3>
              <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                Our expert stylists analyze your profile and curate 3 outfits tailored 
                to your body type, budget, and vibe.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                <span className="text-2xl md:text-3xl luxury-heading text-luxury-gold">3</span>
              </div>
              <div className="mb-6 relative w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border-2 border-luxury-cream">
                <Image 
                  src="/step3-plan.webp" 
                  alt="Receive on WhatsApp"
                  width={400} 
                  height={400} 
                  className="object-cover w-full h-full" 
                />
              </div>
              <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4">
                Get Styled on WhatsApp
              </h3>
              <p className="luxury-body text-luxury-charcoal/70 text-sm md:text-base">
                Every Monday, Wednesday, Friday: Receive 1 styled outfit with AI images 
                of YOU in it. Save, share, or ask for tweaks.
              </p>
            </div>
          </div>
        </section>

        {/* WhatsApp Preview Section */}
        <section className="py-16 md:py-24 bg-luxury-warm-white">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl md:text-6xl luxury-heading text-luxury-charcoal mb-4 md:mb-6">
                Your Weekly Outfits, Delivered
              </h2>
              <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl max-w-3xl mx-auto">
                Here&apos;s exactly what you&apos;ll receive every week on WhatsApp
              </p>
            </div>

            {/* WhatsApp Mockup */}
            <div className="relative max-w-sm md:max-w-md mx-auto">
              {/* Phone frame */}
              <div className="bg-luxury-cream/30 rounded-[2.5rem] md:rounded-[3rem] p-3 md:p-4 border-4 md:border-8 border-luxury-charcoal/10 shadow-2xl">
                
                {/* WhatsApp header */}
                <div className="bg-luxury-green text-luxury-warm-white p-3 md:p-4 rounded-t-2xl md:rounded-t-3xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-luxury-warm-white/20 flex items-center justify-center">
                    <span className="text-lg">👩</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm md:text-base">Meera - Your ICONIK Stylist</div>
                    <div className="text-xs opacity-80">Online</div>
                  </div>
                </div>

                {/* Message bubbles */}
                <div className="bg-white p-4 md:p-6 space-y-4 min-h-[400px] md:min-h-[500px]">
                  <div className="bg-luxury-cream/50 rounded-2xl rounded-tl-none p-3 md:p-4 max-w-[85%]">
                    <p className="luxury-body text-xs md:text-sm mb-3">
                      Good morning Priya! ☀️
                    </p>
                    <p className="luxury-body text-xs md:text-sm mb-4">
                      Here&apos;s your Monday look—perfect for your work meetings today:
                    </p>
                    
                    {/* Outfit image placeholder */}
                    <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl mb-3 aspect-square relative overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-luxury-charcoal/40">
                        Outfit Image
                      </div>
                    </div>

                    <p className="luxury-body text-xs md:text-sm mb-2 font-semibold text-luxury-charcoal">
                      Today&apos;s Look:
                    </p>
                    <ul className="luxury-body text-xs md:text-sm space-y-1 mb-3 text-luxury-charcoal/80">
                      <li>• Beige blazer paired with black trousers</li>
                      <li>• Pointed toe heels in nude</li>
                      <li>• Minimal gold jewelry</li>
                    </ul>
                    
                    <p className="luxury-body text-xs text-luxury-charcoal/60 mb-3">
                      💡 Style Tip: The neutral palette keeps it professional while the tailored fit shows confidence.
                    </p>
                    
                    <p className="luxury-body text-xs md:text-sm text-luxury-green">
                      Love it? 💚 Want tweaks? Just reply!
                    </p>
                  </div>

                  {/* User reply */}
                  <div className="flex justify-end">
                    <div className="bg-luxury-accent/10 rounded-2xl rounded-tr-none p-3 max-w-[70%]">
                      <p className="luxury-body text-xs md:text-sm text-luxury-charcoal">
                        Love this! Can you show me similar looks for next week?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -right-2 md:-right-4 top-1/4 bg-luxury-accent text-luxury-warm-white px-3 md:px-4 py-1.5 md:py-2 rounded-full luxury-body text-xs md:text-sm shadow-lg">
                3x per week
              </div>
              <div className="absolute -left-2 md:-left-4 top-2/3 bg-luxury-green text-luxury-warm-white px-3 md:px-4 py-1.5 md:py-2 rounded-full luxury-body text-xs md:text-sm shadow-lg">
                AI-styled
              </div>
            </div>

            {/* Key benefits below mockup */}
            <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-accent/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-luxury-accent" />
                </div>
                <h4 className="luxury-heading text-luxury-charcoal mb-2 text-base md:text-lg">No App Required</h4>
                <p className="luxury-body text-luxury-charcoal/70 text-sm">Everything happens in WhatsApp—where you already are</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-green/10 rounded-full flex items-center justify-center">
                  <Gem className="w-6 h-6 text-luxury-green" />
                </div>
                <h4 className="luxury-heading text-luxury-charcoal mb-2 text-base md:text-lg">See Yourself Styled</h4>
                <p className="luxury-body text-luxury-charcoal/70 text-sm">AI-generated images show YOU in each outfit</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-luxury-gold" />
                </div>
                <h4 className="luxury-heading text-luxury-charcoal mb-2 text-base md:text-lg">Unlimited Revisions</h4>
                <p className="luxury-body text-luxury-charcoal/70 text-sm">Don&apos;t like a look? Just reply and we&apos;ll adjust</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features/Benefits Grid */}
        <section className="py-16 md:py-24 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">
              What You Get Every Week
            </h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Everything you need to look stylish, feel confident, and save time
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            {[
              { 
                icon: Sparkles, 
                title: "3 Personalized Outfits", 
                description: "Monday, Wednesday, Friday—styled for your week ahead"
              },
              { 
                icon: Gem, 
                title: "AI-Styled Images", 
                description: "See yourself in each outfit before committing"
              },
              { 
                icon: Heart, 
                title: "WhatsApp Support", 
                description: "Ask styling questions anytime (24h response)"
              },
              { 
                icon: Zap, 
                title: "Budget-Matched", 
                description: "Outfits curated within your ₹2-8k range"
              },
              { 
                icon: Target, 
                title: "Body Type Analysis", 
                description: "Every look flatters your unique shape"
              },
              { 
                icon: Shield, 
                title: "Cancel Anytime", 
                description: "No contracts, pause or cancel with one message"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-5 md:p-6 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-xl hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-center space-y-3">
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-luxury-green group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-sm md:text-base luxury-heading text-center text-luxury-charcoal">
                    {feature.title}
                  </h3>
                  <p className="luxury-body text-luxury-charcoal/70 text-xs md:text-sm text-center">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Client Stories</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Hear from women who transformed their confidence with weekly styling.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 rounded-2xl hover:-translate-y-2 group relative"
              >
                {/* Week badge */}
                <div className="absolute top-4 right-4 bg-luxury-accent text-luxury-warm-white px-3 py-1 rounded-full text-xs luxury-body font-medium">
                  Week {testimonial.weeks}
                </div>
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
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Choose Your Plan</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Start with the base subscription, add the consultation if you want deeper personalization
            </p>
          </div>

          {/* Base Subscription Card */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 mb-8">
            <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl border-2 border-luxury-accent/30 hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-1 relative">
              
              {/* Popular Badge */}
              <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-luxury-accent text-luxury-warm-white px-3 md:px-4 py-1 rounded-full luxury-body text-xs md:text-sm font-medium">
                Most Popular
              </div>

              <div className="p-6 md:p-10">
                <div className="text-center mb-6 md:mb-8">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading mb-3 text-luxury-charcoal">
                    ICONIK Monthly
                  </h3>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl md:text-5xl font-bold text-luxury-green">₹499</span>
                      <span className="text-luxury-charcoal/60 luxury-body text-base md:text-lg">/month</span>
                    </div>
                    <p className="luxury-body text-luxury-charcoal/50 text-xs md:text-sm mt-2">
                      Only ₹42 per outfit
                    </p>
                  </div>

                  <p className="text-base md:text-lg luxury-body text-luxury-charcoal/70 mb-4 md:mb-6">
                    Your personal stylist, delivered to WhatsApp
                  </p>

                  {/* Trial Badge */}
                  <div className="inline-block bg-luxury-pink-bg border border-luxury-accent/20 rounded-full px-4 py-2 mb-6">
                    <span className="luxury-body text-luxury-accent text-sm md:text-base font-medium">
                      ✨ Try first week for ₹99
                    </span>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:mb-8">
                  <div>
                    <h4 className="text-base md:text-lg luxury-heading mb-4 text-luxury-charcoal">
                      What&apos;s Included:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          3 styled outfits per week (12/month)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          AI-generated images of YOU in each outfit
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Quiz-based personalization (body type, style, budget)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Outfit descriptions & styling notes
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          WhatsApp styling support (24h response)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Cancel anytime, no contracts
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Value Prop Card */}
                  <div className="bg-luxury-pink-bg border border-luxury-accent/20 rounded-xl p-5 md:p-6 text-center self-start">
                    <div className="text-3xl md:text-4xl mb-3">💃</div>
                    <h4 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-2">
                      Perfect For You If:
                    </h4>
                    <ul className="luxury-body text-luxury-charcoal/70 text-sm space-y-2 text-left">
                      <li>✓ You want effortless daily styling</li>
                      <li>✓ Shopping feels overwhelming</li>
                      <li>✓ You love trying new looks</li>
                      <li>✓ You&apos;re ready for ongoing support</li>
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Link
                    href="/checkout-monthly"
                    onClick={() => trackCTAClick('ICONIK Monthly', 'Pricing Section', 499)}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 md:px-12 py-3 md:py-4 rounded-full text-base md:text-lg luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Start Your ₹99 Trial <ArrowRight className="ml-3 h-5 w-5" />
                  </Link>
                  <p className="luxury-body text-luxury-charcoal/50 text-xs md:text-sm mt-4">
                    Then ₹499/month • Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Add-On Card */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="p-6 md:p-10">
                <div className="text-center mb-6 md:mb-8">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading mb-3 text-luxury-charcoal">
                    ICONIK Monthly + Consultation
                  </h3>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-2 flex-wrap">
                      <span className="text-3xl md:text-4xl font-bold text-luxury-green">₹499</span>
                      <span className="text-luxury-charcoal/60 luxury-body text-sm md:text-base">/month</span>
                      <span className="luxury-body text-luxury-charcoal/40 mx-2">+</span>
                      <span className="text-3xl md:text-4xl font-bold text-luxury-accent">₹1,999</span>
                      <span className="text-luxury-charcoal/60 luxury-body text-xs md:text-sm">one-time</span>
                    </div>
                    <p className="luxury-body text-luxury-charcoal/50 text-xs md:text-sm mt-2">
                      Total first month: ₹2,498 (then ₹499/month)
                    </p>
                  </div>

                  <p className="text-base md:text-lg luxury-body text-luxury-charcoal/70">
                    Weekly styling + deep-dive personalization
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:mb-8">
                  <div>
                    <h4 className="text-base md:text-lg luxury-heading mb-4 text-luxury-charcoal">
                      Everything in Monthly, PLUS:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          90-minute 1-on-1 video consultation
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Comprehensive style guide PDF (30+ pages)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Personalized color palette analysis
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Wardrobe audit + shopping strategy
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Body shape analysis & flattering silhouettes
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-0.5" />
                        <span className="luxury-body text-luxury-charcoal/80 text-sm">
                          Hair, makeup & grooming recommendations
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Value Prop Card */}
                  <div className="bg-luxury-accent/5 border border-luxury-accent/20 rounded-xl p-5 md:p-6 text-center self-start">
                    <div className="text-3xl md:text-4xl mb-3">✨</div>
                    <h4 className="text-lg md:text-xl luxury-heading text-luxury-charcoal mb-2">
                      Best For You If:
                    </h4>
                    <ul className="luxury-body text-luxury-charcoal/70 text-sm space-y-2 text-left">
                      <li>✓ You want expert 1-on-1 guidance</li>
                      <li>✓ You&apos;re starting from scratch</li>
                      <li>✓ You want deep personalization</li>
                      <li>✓ You&apos;re ready for transformation</li>
                    </ul>

                    <div className="mt-6 p-4 bg-luxury-accent/10 rounded-lg">
                      <p className="luxury-body text-luxury-accent text-sm font-medium">
                        💰 Save vs buying separately
                      </p>
                      <p className="luxury-body text-luxury-charcoal/60 text-xs mt-1">
                        Consultation alone is worth ₹2,999
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Link
                    href="/checkout-monthly?plan=with-consultation"
                    onClick={() => trackCTAClick('Monthly + Consultation', 'Pricing Section', 2498)}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-10 md:px-12 py-3 md:py-4 rounded-full text-base md:text-lg luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Get Complete Package <ArrowRight className="ml-3 h-5 w-5" />
                  </Link>
                  <p className="luxury-body text-luxury-charcoal/50 text-xs md:text-sm mt-4">
                    One-time consultation + ongoing monthly styling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Transformation Section */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-luxury-cream/20 to-luxury-warm-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-6 md:mb-8 text-luxury-charcoal">
                Real Transformations
              </h2>
              <p className="text-lg md:text-2xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto">
                See how weekly styling transformed their confidence
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {[
                {
                  before: '/style-before.webp',
                  after: '/style-after.webp',
                  title: 'Week 1 vs Week 12',
                  description: 'From style confusion to signature looks'
                },
                {
                  before: '/wardrobe-before.webp',
                  after: '/wardrobe-after.webp',
                  title: 'Wardrobe Evolution',
                  description: 'From cluttered closet to curated style'
                }
              ].map((comparison, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="group relative"
                >
                  <div className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-12 border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-2">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-6 md:mb-8 text-center">
                      {comparison.title}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="text-center">
                        <div className="luxury-body text-luxury-charcoal/60 mb-3 md:mb-4 text-sm md:text-base">Before</div>
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
                        <div className="luxury-body text-luxury-charcoal/60 mb-3 md:mb-4 text-sm md:text-base">After</div>
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
                    
                    <p className="text-base md:text-lg lg:text-xl luxury-body text-luxury-charcoal/70 text-center leading-relaxed">
                      {comparison.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem/Pain Points Section */}
        <section className="py-16 md:py-24 px-4 bg-luxury-warm-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="text-4xl md:text-6xl luxury-heading mb-6 md:mb-8 text-luxury-charcoal">
                Sound Familiar?
              </h2>
              <p className="text-lg md:text-2xl luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto">
                These are the exact problems ICONIK Monthly solves
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                {
                  icon: Clock, 
                  text: 'Spend hours scrolling fashion apps with no results?', 
                  color: 'orange',
                  image: '/style-confusion.webp',
                  imageAlt: 'Woman scrolling phone frustrated'
                },
                { 
                  icon: Users, 
                  text: 'Wear the same 5 outfits on repeat every week?', 
                  color: 'red',
                  image: '/feeling-overlooked.webp',
                  imageAlt: 'Same outfit again'
                },
                { 
                  icon: Heart, 
                  text: 'Feel lost about what actually suits your body?', 
                  color: 'rose',
                  image: '/confidence-issues.webp',
                  imageAlt: 'Style confusion'
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
                  
                  <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${
                    item.color === 'red' ? 'bg-red-100' :
                    item.color === 'orange' ? 'bg-orange-100' : 'bg-rose-100'
                  }`}>
                    <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${
                      item.color === 'red' ? 'text-red-600' :
                      item.color === 'orange' ? 'text-orange-600' : 'text-rose-600'
                    }`} />
                  </div>
                  <p className="text-lg md:text-xl lg:text-2xl luxury-heading text-luxury-charcoal text-center leading-relaxed">
                    {item.text}
                  </p>
                  
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl lg:text-6xl luxury-heading mb-4 md:mb-6 text-luxury-charcoal">
              Frequently Asked Questions
            </h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-base md:text-lg">
              Everything you need to know about ICONIK Monthly
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="text-left p-5 md:p-6 bg-luxury-warm-white/80 backdrop-blur-sm rounded-xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-base md:text-lg luxury-heading mb-2 text-luxury-charcoal">
                  {faq.question}
                </h3>
                <p className="luxury-body text-luxury-charcoal/80 text-sm md:text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 lg:py-32 px-4 bg-luxury-accent">
          <div className="max-w-4xl mx-auto text-center text-luxury-warm-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl luxury-heading mb-6 md:mb-8 text-luxury-warm-white leading-tight">
                Ready to Get Styled Every Week?
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl luxury-body mb-8 md:mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
                Join 1,200+ women who wake up to personalized outfits every week
              </p>
              
              <div className="space-y-6 md:space-y-8">
                <Link
                  href="/checkout-monthly"
                  onClick={() => {
                    trackCTAClick('Final CTA', 'Bottom Section', 499);
                    setHasClickedCTA(true);
                  }}
                  className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-10 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
                >
                  <span className="relative z-10">✨ Start Your ₹99 Trial Today</span>
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-luxury-warm-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                {/* Trust & Urgency */}
                <div className="max-w-lg mx-auto space-y-4">
                  <div className="bg-luxury-warm-white/10 backdrop-blur-xl border border-luxury-warm-white/20 rounded-2xl p-4 md:p-6 text-center">
                    <p className="luxury-body text-luxury-warm-white text-base md:text-lg font-medium">
                      ⏰ Limited Spots Available
                    </p>
                    <p className="luxury-body text-luxury-warm-white/80 text-sm md:text-base">
                      Only 50 new members accepted this week
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 luxury-body text-luxury-warm-white/80 text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-luxury-gold rounded-full"></div>
                      <span>Cancel Anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-luxury-gold rounded-full"></div>
                      <span>1,200+ Success Stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-luxury-gold rounded-full"></div>
                      <span>4.8★ Rated</span>
                    </div>
                  </div>
                </div>

                <p className="luxury-body opacity-75 text-center text-sm md:text-base">
                  ₹99 trial, then ₹499/month • No contracts
                </p>
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
                      href="#how-it-works"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#testimonials"
                      className="luxury-body text-luxury-charcoal/70 hover:text-luxury-green transition-colors"
                    >
                      Testimonials
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
                <div className="luxury-body text-luxury-charcoal/70 text-xs">ICONIK Monthly</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-luxury-green">₹499</span>
                  <span className="text-luxury-charcoal/60 text-xs">/month</span>
                </div>
                <div className="text-luxury-accent text-xs font-medium">Try first week ₹99</div>
              </div>
              <div className="text-right ml-2">
                <div className="luxury-body text-luxury-charcoal/60 text-xs">50 spots left</div>
                <div className="luxury-body text-luxury-green text-sm font-medium">
                  This week
                </div>
              </div>
            </div>
            <Link
              href="/checkout-monthly"
              onClick={() => {
                trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 99);
                setHasClickedCTA(true);
              }}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-base md:text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
            >
              Start ₹99 Trial
            </Link>
          </div>
        </div>

        {/* Exit Intent Popup */}
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
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-3">
                  Still have questions?
                </h3>
                <p className="luxury-body text-luxury-charcoal/80 text-base md:text-lg mb-2">
                  <span className="text-luxury-accent font-semibold">Chat with us on WhatsApp</span> — we&apos;ll answer everything!
                </p>
                <p className="luxury-body text-luxury-charcoal/60 text-sm">
                  No pressure. Just honest style advice.
                </p>
              </div>

              <a
                href="https://api.whatsapp.com/send/?phone=919130048899&text=Hi+ICONIK%21+I%27m+interested+in+the+monthly+styling+subscription.+Can+you+tell+me+more%3F&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackCTAClick('WhatsApp Chat', 'Exit Intent Popup');
                  setShowDoubtClearingPopup(false);
                }}
                className="flex items-center justify-center gap-2 w-full bg-luxury-accent hover:bg-luxury-accent/90 text-luxury-warm-white px-8 py-4 rounded-full text-lg luxury-body font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-3"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Chat on WhatsApp
              </a>

              <button
                onClick={() => setShowDoubtClearingPopup(false)}
                className="w-full luxury-body text-luxury-charcoal/60 hover:text-luxury-charcoal text-sm transition-colors"
              >
                No thanks, I&apos;ll browse more
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}



