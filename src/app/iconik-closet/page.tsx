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
  Star
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function IconikClosetLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });

  // Track page view and product view on mount
  useEffect(() => {
    trackPageView('India');
    trackViewContent('Iconik Closet Subscription', 1699, ['iconik_closet_subscription'], 'INR', 'India');
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
      answer: 'Absolutely! Iconik Closet delivers complete outfit sets every month with shopping links. You\'ll always know exactly what to wear and where to buy it - no more guesswork.'
    },
    {
      question: 'What if the style suggestions don\'t feel like me?',
      answer: 'We work based on your personal style DNA from your initial consultation. Every outfit is tailored to your body type, lifestyle and preferences. You can also send feedback via WhatsApp anytime.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! You can cancel your subscription anytime with no questions asked. We believe in earning your subscription every month with amazing outfits.'
    }
  ];

  return (
    <>
      <Head>
        <title>Iconik Closet - Never Waste Time Shopping Again</title>
        <meta name="description" content="Get 6 complete outfit sets delivered monthly with direct shopping links. Styled for your body type, curated for your lifestyle. Cancel anytime." />
        <meta name="keywords" content="monthly outfit subscription, personal styling service, outfit sets, shopping links, wardrobe subscription india" />
        <meta property="og:title" content="Iconik Closet - Never Waste Time Shopping Again" />
        <meta property="og:description" content="Get 6 complete outfit sets delivered monthly with direct shopping links. Styled for your body type, curated for your lifestyle." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://playernumberone.com/iconik-closet" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Iconik Closet - Never Waste Time Shopping Again" />
        <meta name="twitter:description" content="Get 6 complete outfit sets delivered monthly with direct shopping links." />
        <link rel="canonical" href="https://playernumberone.com/iconik-closet" />
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
                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">Pricing</a>
                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-green transition-colors">FAQ</a>
                <Link
                  href="/iconik-closet/checkout"
                  className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                >
                  Get Started
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
                <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Pricing</a>
                <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-green px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                <Link
                  href="/iconik-closet/checkout"
                  className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                >
                  Get Started
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
                Discover Your <span className="text-luxury-green">Signature Style</span> <span className="text-luxury-charcoal">in 24 hours</span>
              </motion.h1>

              {/* Hero Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl lg:text-2xl luxury-body text-luxury-charcoal/80 max-w-4xl mx-auto mb-8 leading-relaxed"
              >
                Get <span className="font-semibold text-luxury-accent">16 personalized outfits</span>, your <span className="font-semibold text-luxury-green">color palette</span>, and a <span className="font-semibold text-luxury-accent">1-on-1 stylist call</span> with shopping recommendations every month
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
                      Iconik Closet Transformations
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
                  href="/iconik-closet/checkout"
                  onClick={() => {
                    // Track CTA click with Meta Pixel
                    trackCTAClick('Start Subscription', 'Hero Section', undefined, 'INR', 'India');
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
                >
                  Start Your Subscription <ArrowRight className="ml-3 h-5 w-5 inline" />
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
                  268+
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Happy Subscribers</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  12+
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Hours Saved Monthly</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl md:text-6xl luxury-heading text-luxury-green">4.9</span>
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Subscriber Rating</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-6xl luxury-heading text-luxury-green mb-4 group-hover:scale-105 transition-transform duration-300">
                  ₹8.4K
                </div>
                <div className="luxury-body text-luxury-charcoal/70">Saved Yearly</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="pt-8 pb-20 md:pt-12 md:pb-32 bg-luxury-warm-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-4 text-luxury-charcoal">What You Get With Iconik Closet</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-base md:text-lg">
              Complete style transformation in Month 1, then shopping done for you every month after.
            </p>
          </div>

          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Month 1 */}
              <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-luxury-cream">
                <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-6 text-center">
                  Month 1: Your Complete Transformation
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">16 Outfit Recommendations</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">All occasions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">Hair & Makeup Styling Guide</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">For your features</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">Style DNA Blueprint</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">Body, colors, silhouettes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">20-min Private Consultation Call</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">One-on-one with expert stylist</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Every Month After */}
              <div className="bg-luxury-accent/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-luxury-accent">
                <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-6 text-center">
                  Every Month After: Shopping Solved
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">6 Shoppable Outfit Sets</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">With direct buy links</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">Styled for YOUR Body Type</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">Based on blueprint</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">WhatsApp Styling Support</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">Quick answers</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">Seasonal Updates</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">Wardrobe refresh every 3 months</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-green flex-shrink-0 mt-1" />
                    <div>
                      <p className="luxury-body text-luxury-charcoal font-semibold mb-1">Cancel Anytime</p>
                      <p className="luxury-body text-luxury-charcoal/60 text-sm">No questions asked</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
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
                    alt="Iconik Closet Monthly Outfit Guide"
                    width={400}
                    height={400}
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-4">
                  Your Monthly Outfit Guide
                </h3>
                <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl">
                  6 complete looks delivered on the 1st of every month
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-luxury-cream/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">Subscriber Stories</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
              Hear from women who save hours every month with Iconik Closet.
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
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-6xl luxury-heading mb-4 text-luxury-charcoal">Choose Your Plan</h2>
            <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-base md:text-lg">
              Select a plan that works for you. Cancel anytime, no questions asked.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 grid md:grid-cols-2 gap-8 mb-12">
            {/* Monthly Plan */}
            <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl luxury-heading mb-3 text-luxury-charcoal text-center">
                    Monthly Subscription
                  </h3>

                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className="text-2xl md:text-3xl font-bold text-luxury-green">₹1,699</span>
                      <span className="text-base luxury-body text-luxury-charcoal/70">/month</span>
                    </div>
                    <p className="text-sm luxury-body text-luxury-charcoal/50 line-through">₹2,199 per month</p>
                    <p className="text-sm luxury-body text-luxury-charcoal/70 mt-1">Cancel anytime</p>
                  </div>

                  <div className="bg-luxury-warm-white/60 rounded-xl p-4 mb-4">
                    <p className="text-xs luxury-body text-luxury-charcoal/70 font-semibold mb-3">What&apos;s Included:</p>

                    <div className="mb-3">
                      <p className="text-xs luxury-body text-luxury-charcoal font-semibold mb-2">Month 1: Complete Transformation</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">16 personalized outfit looks</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">Hair & makeup styling guide</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">Style DNA blueprint</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">20-min consultation call</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs luxury-body text-luxury-charcoal font-semibold mb-2">Every Month After:</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">6 outfit sets with shopping links</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">Styled for your body type</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">WhatsApp styling support</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-luxury-green text-xs">•</span>
                          <span className="luxury-body text-luxury-charcoal/80 text-xs">Seasonal wardrobe updates</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/iconik-closet/checkout"
                    onClick={() => {
                      trackCTAClick('Monthly Plan', 'Pricing Section', 1699, 'INR', 'India');
                    }}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full text-sm luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    ✨ Start Monthly Subscription
                  </Link>
                </div>
              </div>
            </div>

            {/* Quarterly Plan */}
            <div className="bg-luxury-accent/10 backdrop-blur-sm rounded-2xl border-2 border-luxury-accent hover:bg-luxury-accent/20 transition-all duration-300 overflow-hidden hover:-translate-y-1 relative">
              <div className="absolute top-4 right-4 bg-luxury-accent text-luxury-warm-white px-3 py-1 rounded-full text-[10px] luxury-body font-medium shadow-sm">
                Best Value
              </div>
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-lg md:text-xl luxury-heading mb-3 text-luxury-charcoal text-center">
                    Quarterly Subscription 🔥
                  </h3>

                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className="text-2xl md:text-3xl font-bold text-luxury-green">₹4,599</span>
                      <span className="text-base luxury-body text-luxury-charcoal/70">for 3 months</span>
                    </div>
                    <p className="text-sm luxury-body text-luxury-charcoal/50 line-through">₹6,599</p>
                    <p className="text-sm luxury-body text-luxury-accent font-semibold mt-1">Save ₹2,000 • Just ₹1,533/month</p>
                  </div>

                  <div className="bg-luxury-warm-white/60 rounded-xl p-4 mb-4">
                    <p className="text-xs luxury-body text-luxury-charcoal/70 font-semibold mb-3">Everything in Monthly Plan PLUS:</p>

                    <ul className="space-y-2">
                      <li className="flex items-start gap-1.5">
                        <span className="text-luxury-green text-xs">•</span>
                        <span className="luxury-body text-luxury-charcoal/80 text-xs">Save ₹2,000 vs monthly billing</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-luxury-green text-xs">•</span>
                        <span className="luxury-body text-luxury-charcoal/80 text-xs">Priority WhatsApp support</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-luxury-green text-xs">•</span>
                        <span className="luxury-body text-luxury-charcoal/80 text-xs">Seasonal wardrobe refresh</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-luxury-green text-xs">•</span>
                        <span className="luxury-body text-luxury-charcoal/80 text-xs">Lock in this rate forever</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/iconik-closet/checkout"
                    onClick={() => {
                      trackCTAClick('Quarterly Plan', 'Pricing Section', 4599, 'INR', 'India');
                    }}
                    className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full text-sm luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    ✨ Start Quarterly Subscription
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
                Real results from real women who transformed their style with Iconik Closet
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
                  icon: Clock,
                  text: 'Spending hours shopping but finding nothing?',
                  color: 'red',
                  image: '/feeling-overlooked.webp',
                  imageAlt: 'Woman shopping'
                },
                {
                  icon: Users,
                  text: 'Always wearing the same 3 outfits?',
                  color: 'orange',
                  image: '/style-confusion.webp',
                  imageAlt: 'Style confusion'
                },
                {
                  icon: Heart,
                  text: 'Buying wrong pieces that don\'t work?',
                  color: 'rose',
                  image: '/confidence-issues.webp',
                  imageAlt: 'Shopping mistakes'
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
              Everything you need to know about Iconik Closet subscription.
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-4 px-4">
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
                Ready to Never Waste Time Shopping?
              </h2>
              <p className="text-xl md:text-2xl luxury-subheading mb-12 opacity-90 max-w-2xl mx-auto">
                Join 268+ women who save 12+ hours every month with Iconik Closet
              </p>
              <div className="space-y-8">
                <Link
                  href="/iconik-closet/checkout"
                  onClick={() => {
                    // Track final CTA click with Meta Pixel
                    trackCTAClick('Final CTA', 'Bottom Section', 1699, 'INR', 'India');
                  }}
                  className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-12 py-5 rounded-full text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
                >
                  <span className="relative z-10">✨ Start Your Subscription Today</span>
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-luxury-warm-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>

                {/* Trust & Urgency */}
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="bg-luxury-warm-white/10 backdrop-blur-xl border border-luxury-warm-white/20 rounded-2xl p-6 text-center">
                    <p className="luxury-body text-luxury-warm-white text-lg">⏰ Limited Slots</p>
                    <p className="luxury-body text-luxury-warm-white/80">Cancel anytime, no questions asked</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 luxury-body text-luxury-warm-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>Cancel Anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
                      <span>268+ Happy Subscribers</span>
                    </div>
                  </div>
                </div>

                <p className="luxury-body opacity-75 text-center">Starting at ₹1,699/month + GST</p>
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
                  Never waste time shopping again. Get 6 complete outfit sets monthly with direct shopping links.
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
                © 2024 PlayerNumberOne ICONIK. All rights reserved.
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
                <div className="luxury-body text-luxury-charcoal/70 text-xs">Monthly Subscription</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-luxury-green">₹1,699/mo</span>
                  <span className="line-through text-luxury-charcoal/40 text-xs">₹2,199</span>
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="luxury-body text-luxury-charcoal/60 text-xs">Offer Expires:</div>
                <div className="luxury-body text-luxury-green text-sm font-medium">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
            <Link
              href="/iconik-closet/checkout"
              onClick={() => {
                // Track CTA click with Meta Pixel
                trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 1699, 'INR', 'India');
              }}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
            >
              Start Subscription
            </Link>
          </div>
        </div>

        {/* Floating WhatsApp Button */}
        <a
          href="https://api.whatsapp.com/send/?phone=919130048899&text=Hi+ICONIK%21+I%27m+interested+in+Iconik+Closet+subscription.+Can+you+help+me%3F&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackCTAClick('Floating WhatsApp', 'WhatsApp Button', undefined, 'INR', 'India');
          }}
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 bg-[#25D366] hover:bg-[#20BA5A] text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-40 hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>
    </>
  );
}
