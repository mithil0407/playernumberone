'use client';

import Head from 'next/head';
import { trackCTAClick } from '@/lib/metaPixel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  Heart,
  Zap,
  Target,
  TrendingUp,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GuidePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    minutes: 5,
    seconds: 0
  });

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

  const features = [
    { 
      icon: CheckCircle, 
      title: 'Body Shape Discovery', 
      description: 'Learn what flatters your unique figure',
      color: 'pink'
    },
    { 
      icon: Heart, 
      title: 'Face Shape & Color Palette', 
      description: 'Find your best colors and jewelry tones',
      color: 'pink'
    },
    { 
      icon: Zap, 
      title: 'Wardrobe Foundation', 
      description: 'The must-have pieces for every Indian woman',
      color: 'pink'
    },
    { 
      icon: Target, 
      title: 'Style Archetype Quiz', 
      description: 'Discover your true fashion identity',
      color: 'pink'
    },
    { 
      icon: TrendingUp, 
      title: 'Mix & Match System', 
      description: 'Create 30+ outfits from 10 pieces',
      color: 'pink'
    },
    { 
      icon: Shield, 
      title: 'Smart Shopping Framework', 
      description: 'Avoid impulsive buys forever',
      color: 'pink'
    }
  ];

  const bonuses = [
    {
      title: 'Posing & Confidence Guide',
      value: '₹1,500',
      description: 'Learn how to pose and move in front of the camera like a natural. Perfect for photos, reels, or your first fashion shoot.'
    },
    {
      title: 'Shopping Masterlist',
      value: '₹2,000',
      description: 'Every essential piece to build your Iconik wardrobe — on a real Indian budget.'
    }
  ];

  return (
    <>
      <Head>
        <title>ICONIK - Your Personal Styling Transformation Guide for Indian Women</title>
        <meta name="description" content="Transform your style with ICONIK - the ultimate styling guide for Indian women. Learn body shape analysis, color palettes, and confident styling techniques." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-luxury-warm-white text-luxury-charcoal scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-luxury-warm-white/95 backdrop-blur-xl border-b border-luxury-cream z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-luxury-accent">ICONIK</Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Features</a>
                <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Stories</a>
                <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Investment</a>
                <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">FAQ</a>
                <Link
                  href="/guide/checkout"
                  className="bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
                >
                  Get Guide
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-luxury-charcoal hover:text-luxury-accent transition-colors"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:hidden bg-luxury-warm-white/95 backdrop-blur-xl border-t border-luxury-cream"
              >
                <div className="px-6 py-6 space-y-4">
                  <a href="#features" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Features</a>
                  <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Stories</a>
                  <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Investment</a>
                  <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
                  <Link
                    href="/guide/checkout"
                    className="block bg-luxury-accent text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
                  >
                    Get Guide
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl luxury-heading text-luxury-charcoal mb-6 leading-tight">
                ICONIK – Your Personal Styling Transformation Guide for Indian Women
              </h1>
              
              <p className="text-xl md:text-2xl luxury-body text-luxury-charcoal/80 mb-8 leading-relaxed">
                Attention, ambitious Indian women!
              </p>
              
              <p className="text-lg md:text-xl luxury-body text-luxury-charcoal/70 mb-8 leading-relaxed">
                If you&apos;ve ever looked at a well-dressed woman and thought,<br />
                <span className="italic">&quot;Wish I could look like that — but I don&apos;t even know where to start,&quot;</span><br />
                then keep reading…
              </p>

              <div className="bg-luxury-pink-bg/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-8 border border-luxury-cream">
                <h2 className="text-2xl md:text-3xl luxury-heading text-luxury-charcoal mb-4">
                  You Don&apos;t Need a Huge Wardrobe. You Don&apos;t Need to Be Skinny. You Don&apos;t Need to Copy Influencers.
                </h2>
                <p className="text-lg luxury-body text-luxury-charcoal/80 mb-6">
                  You&apos;ll be shocked when you realize how simple it is to look effortlessly stylish once you learn the Iconik System — a framework used by stylists to turn everyday women into fashion icons.
                </p>
                <p className="text-lg luxury-body text-luxury-charcoal/80">
                  Skip the endless YouTube styling videos, trial-and-error shopping, and outfit confusion.
                </p>
              </div>

              <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-8 border border-luxury-cream">
                <h3 className="text-xl md:text-2xl luxury-heading text-luxury-charcoal mb-4">
                  Our budget-friendly, Indian-woman-focused Iconik Styling Guide shows you exactly:
                </h3>
                <ul className="text-left space-y-3 luxury-body text-luxury-charcoal/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                    What suits your body shape
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                    What colors bring out your natural glow
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                    How to mix and match clothes you already have
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                    And how to look classy and confident on any budget
                  </li>
                </ul>
              </div>

              <Link 
                href="/guide/checkout" 
                onClick={() => {
                  trackCTAClick('Begin Your Transformation', 'Hero Section');
                }}
                className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
              >
                ✨ Begin Your Transformation <ArrowRight className="ml-3 h-5 w-5 inline" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Real Transformations Section */}
        <section id="testimonials" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">
                Real Indian Transformations
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 border border-luxury-cream text-center"
              >
                <div className="w-16 h-16 bg-luxury-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👩</span>
                </div>
                <h3 className="text-xl luxury-heading text-luxury-charcoal mb-2">Ananya – 27, Bangalore</h3>
                <p className="luxury-body text-luxury-charcoal/80">
                  From corporate formals to effortless chic. Says she finally enjoys dressing up again.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 border border-luxury-cream text-center"
              >
                <div className="w-16 h-16 bg-luxury-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👩</span>
                </div>
                <h3 className="text-xl luxury-heading text-luxury-charcoal mb-2">Kritika – 34, Pune</h3>
                <p className="luxury-body text-luxury-charcoal/80">
                  Discovered her true color palette — now gets daily compliments for her glow-up.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl p-6 border border-luxury-cream text-center"
              >
                <div className="w-16 h-16 bg-luxury-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👩</span>
                </div>
                <h3 className="text-xl luxury-heading text-luxury-charcoal mb-2">Riya – 29, Mumbai</h3>
                <p className="luxury-body text-luxury-charcoal/80">
                  Always thought fashion was &quot;not for her.&quot; After Iconik, she gets DMs asking where she shops.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Before / After Transformations */}
        <section className="py-20 px-4 bg-luxury-cream/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-4">
                Real Style Transformations
              </h2>
              <p className="luxury-body text-luxury-charcoal/70">
                See how the ICONIK approach elevates everyday looks into confident, elegant style.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Transformation 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-4 border border-luxury-cream"
              >
                <div className="rounded-2xl overflow-hidden mb-3">
                  <img src="/style-before.webp" alt="Before" className="w-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img src="/style-after.webp" alt="After" className="w-full object-cover" />
                </div>
              </motion.div>

              {/* Transformation 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-4 border border-luxury-cream"
              >
                <div className="rounded-2xl overflow-hidden mb  -3">
                  <img src="/wardrobe-before.webp" alt="Before" className="w-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img src="/wardrobe-after.webp" alt="After" className="w-full object-cover" />
                </div>
              </motion.div>

              {/* Transformation 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-4 border border-luxury-cream"
              >
                <div className="rounded-2xl overflow-hidden mb-3">
                  <img src="/ethnic-traditional-before.webp" alt="Before" className="w-full object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img src="/ethnic-traditional-after.webp" alt="After" className="w-full object-cover" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-luxury-cream/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">
                With Iconik, You&apos;ll Learn To:
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-luxury-warm-white/80 backdrop-blur-sm rounded-3xl p-6 border border-luxury-cream hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-luxury-pink-bg rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-luxury-accent" />
                  </div>
                  <h3 className="text-xl luxury-heading text-luxury-charcoal mb-3">
                    ✅ {feature.title}
                  </h3>
                  <p className="luxury-body text-luxury-charcoal/80">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">
                💎 What You Get Inside Iconik
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Body Shape Discovery – Learn what flatters your unique figure',
                'Face Shape & Color Palette – Find your best colors and jewelry tones',
                'Wardrobe Foundation – The must-have pieces for every Indian woman',
                'Style Archetype Quiz – Discover your true fashion identity',
                'Mix & Match System – Create 30+ outfits from 10 pieces',
                'Styling for Occasions – Office, casual, festive, and date-ready looks',
                'Accessories & Footwear Guide – How to complete your look smartly',
                'Confidence Blueprint – How to walk, pose, and carry your style',
                'Smart Shopping Framework – Avoid impulsive buys forever',
                'Bonus: Outfit Inspiration Library – 100+ look ideas curated by stylists'
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-luxury-cream/30 rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 text-luxury-accent flex-shrink-0 mt-1" />
                  <span className="luxury-body text-luxury-charcoal/80">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 bg-luxury-cream/20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-8">
                Get Your Transformation Guide
              </h2>
              
              <div className="bg-luxury-warm-white/90 backdrop-blur-sm rounded-3xl p-8 border border-luxury-cream shadow-lg">
                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-semibold mb-2 text-luxury-accent">₹499 + GST</div>
                  <div className="text-lg luxury-body text-luxury-charcoal/60 mb-4">
                    Total Value: ₹25,000 • 97% Off
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm luxury-body text-luxury-charcoal/70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Instant Access
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Lifetime Use
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      100% Actionable
                    </span>
                  </div>
                </div>

                <Link
                  href="/guide/checkout"
                  onClick={() => {
                    trackCTAClick('Get Iconik Guide', 'Pricing Section', 499);
                  }}
                  className="inline-flex items-center bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-16 py-5 rounded-full text-xl luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  🔥 Get Your Iconik Guide Now
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Fast Action Bonuses */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl luxury-heading text-luxury-charcoal mb-6">
                🔥 Fast Action Bonuses for First 10 Buyers
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bonuses.map((bonus, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="bg-luxury-pink-bg/50 backdrop-blur-sm rounded-3xl p-6 border border-luxury-cream"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl luxury-heading text-luxury-charcoal mb-2">
                      Bonus #{index + 1}: {bonus.title}
                    </h3>
                    <div className="text-lg font-semibold text-luxury-accent">
                      ({bonus.value} Value)
                    </div>
                  </div>
                  <p className="luxury-body text-luxury-charcoal/80 text-center">
                    {bonus.description}
                  </p>
                </motion.div>
              ))}
            </div>
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
              <h2 className="text-3xl md:text-5xl luxury-heading mb-6">
                ❤️ Imagine This…
              </h2>
              <p className="text-lg md:text-xl luxury-body mb-8 opacity-90">
                A week from today — you open your wardrobe and every outfit fits, flatters, and feels like you.<br />
                One month later — compliments become your daily routine.<br />
                Six months later — your style, your posture, your confidence… all transformed.
              </p>
              <p className="text-lg md:text-xl luxury-body mb-8 opacity-90">
                You didn&apos;t need expensive clothes. You just needed Iconik.
              </p>
              <Link
                href="/guide/checkout"
                onClick={() => {
                  trackCTAClick('Final CTA', 'Bottom Section', 499);
                }}
                className="group relative inline-flex items-center justify-center bg-luxury-warm-white/95 backdrop-blur-xl text-luxury-charcoal px-12 py-5 rounded-full text-xl luxury-body hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-luxury-warm-white/30"
              >
                ✅ Start Your Transformation Now
              </Link>
              <p className="text-sm luxury-body opacity-75 mt-4">
                Get Iconik Styling Guide – ₹499 + GST • Guaranteed Safe Checkout
              </p>
            </motion.div>
          </div>
        </section>

        {/* Sticky Mobile CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-3 md:hidden z-50">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-sm luxury-body text-luxury-charcoal/70">Limited Time Offer</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-luxury-accent">₹499 + GST</span>
                  <span className="line-through text-luxury-charcoal/40 text-sm">₹25,000</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs luxury-body text-luxury-charcoal/60">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs luxury-body text-luxury-charcoal/60">left</div>
              </div>
            </div>
            <Link
              href="/guide/checkout"
              onClick={() => {
                trackCTAClick('Mobile Sticky CTA', 'Mobile Sticky', 499);
              }}
              className="w-full bg-luxury-accent hover:bg-luxury-accent/80 text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block font-semibold shadow-lg hover:shadow-xl"
            >
              Get Your Guide Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
