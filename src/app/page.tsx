'use client';

import Head from 'next/head';

// Facebook Pixel types
interface FacebookPixel {
  (command: 'init', pixelId: string): void;
  (command: 'track', eventName: string, parameters?: Record<string, unknown>): void;
  (command: 'trackCustom', eventName: string, parameters?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    fbq: FacebookPixel;
  }
}

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  Users,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Menu,
  X,
  Star,
  Sparkles,
  Gem,
  Shield,
  Trophy,
  Award
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { 
      icon: CheckCircle, 
      title: 'Personal Style Assessment', 
      description: 'Discover your unique style based on body shape, lifestyle & personality',
      image: '/style-assessment.webp',
      imageAlt: 'Style assessment'
    },
    { 
      icon: Target, 
      title: 'Personalized Color Palette', 
      description: 'Colors that make your skin glow and enhance your natural beauty',
      image: '/color-palette.webp',
      imageAlt: 'Color palette'
    },
    { 
      icon: TrendingUp, 
      title: 'Wardrobe Blueprint', 
      description: 'Mix-and-match formulas for effortless, elegant looks',
      image: '/wardrobe-blueprint.webp',
      imageAlt: 'Wardrobe blueprint'
    },
    { 
      icon: Heart, 
      title: 'Beauty & Wellness Plan', 
      description: 'Confidence-building rituals for inner and outer radiance',
      image: '/beauty-wellness.webp',
      imageAlt: 'Wellness plan'
    },
    { 
      icon: Zap, 
      title: 'Expert Style Consultation', 
      description: '20-minute personalized call with our leading stylist',
      image: '/expert-consultation.webp',
      imageAlt: 'Style consultation'
    }
  ];

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
      answer: 'Absolutely! IconOne focuses on your complete style transformation - personalized colors, flattering silhouettes, and confidence-building. We\'ve helped 200+ women discover their signature style.'
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
              <a href="#features" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Features</a>
              <a href="#testimonials" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Stories</a>
              <a href="#pricing" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">Investment</a>
              <a href="#faq" className="luxury-body text-luxury-charcoal/80 hover:text-luxury-accent transition-colors">FAQ</a>
              <Link
                href="/checkout"
                className="bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-8 py-3 rounded-full transition-all duration-300 luxury-body"
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
              <a href="#features" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Features</a>
              <a href="#testimonials" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Stories</a>
              <a href="#pricing" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">Investment</a>
              <a href="#faq" className="block luxury-body text-luxury-charcoal/80 hover:text-luxury-accent px-4 py-3 rounded-lg hover:bg-luxury-cream transition-colors">FAQ</a>
              <Link
                href="/checkout"
                className="block bg-luxury-charcoal text-luxury-warm-white px-8 py-4 rounded-full luxury-body text-center mt-6 transition-all duration-300"
              >
                Begin Journey
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-4 md:px-6 lg:px-8 relative" id="hero">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* Press Logos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 md:mt-8 mb-4 md:mb-8"
            >
              <p className="luxury-body text-luxury-charcoal/60 mb-8">Featured in</p>
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
              className="text-5xl md:text-7xl lg:text-8xl luxury-heading text-luxury-charcoal mb-8 leading-[0.9] tracking-tight"
            >
              Bespoke Fashion
              <br />
              <span className="text-luxury-accent">Consultations</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70 mb-4 max-w-2xl mx-auto"
            >
              for the Modern Indian Woman
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg md:text-xl luxury-body text-luxury-charcoal/60 mb-16 max-w-3xl mx-auto leading-relaxed"
            >
              Elevate your presence. Transform your confidence. Discover the artistry of personal style with our
              curated fashion expertise.
            </motion.p>
            
            {/* Book Image Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="max-w-4xl mx-auto mb-8 md:mb-12"
            >
              <div className="bg-luxury-cream/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 lg:p-16 border border-luxury-cream">
              <div className="text-center">
                  <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-4 md:mb-6">
                  <Image
                    src="/book.png"
                    alt="IconOne Style Guide Preview"
                      width={400}
                      height={400}
                      className="object-contain drop-shadow-2xl"
                    priority
                  />
                  </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl luxury-heading text-luxury-charcoal mb-4">
                      Your Personal Style Guide
                    </h3>
                    <p className="luxury-body text-luxury-charcoal/70 text-lg md:text-xl">
                      Comprehensive style transformation roadmap
                    </p>
                </div>
              </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
          >
              <Link 
              href="/checkout" 
              onClick={() => {
                // Track CTA click with Meta Pixel
                if (typeof window !== 'undefined' && window.fbq) {
                  window.fbq('track', 'Lead', {
                    content_name: 'Hero CTA Click',
                    content_category: 'Transformation Program'
                  });
                }
              }}
                className="inline-flex items-center bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl rounded-full transition-all duration-500 transform hover:-translate-y-1 luxury-body"
            >
                Begin Your Transformation <ArrowRight className="ml-3 h-5 w-5 inline" />
            </Link>
          </motion.div>

          </div>
        </div>
      </section>

      {/* Elegant Stats */}
      <section className="py-20 md:py-32 bg-luxury-cream/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <div className="text-center group">
              <div className="text-4xl md:text-6xl luxury-heading text-luxury-accent mb-4 group-hover:scale-105 transition-transform duration-300">
                200+
              </div>
              <div className="luxury-body text-luxury-charcoal/70">Transformations</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-6xl luxury-heading text-luxury-accent mb-4 group-hover:scale-105 transition-transform duration-300">
                95%
              </div>
              <div className="luxury-body text-luxury-charcoal/70">Confidence Elevation</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                <span className="text-4xl md:text-6xl luxury-heading text-luxury-accent">4.9</span>
                <Star className="h-6 w-6 md:h-8 md:w-8 text-luxury-gold fill-current ml-2" />
              </div>
              <div className="luxury-body text-luxury-charcoal/70">Client Satisfaction</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-6xl luxury-heading text-luxury-accent mb-4 group-hover:scale-105 transition-transform duration-300">
                2-3
              </div>
              <div className="luxury-body text-luxury-charcoal/70">Weeks to Elegance</div>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-luxury-warm-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">What You Receive</h2>
          <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
            Every consultation is tailored to celebrate your individuality and elevate your personal style.
          </p>
        </div>
                
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {[
            { icon: <Sparkles className="h-8 w-8 text-luxury-accent" />, title: "Personal Style Assessment" },
            { icon: <Gem className="h-8 w-8 text-luxury-accent" />, title: "Curated Outfit Planning" },
            { icon: <Heart className="h-8 w-8 text-luxury-accent" />, title: "Makeup & Grooming Guidance" },
            { icon: <Shield className="h-8 w-8 text-luxury-accent" />, title: "Wardrobe Strategy" },
            { icon: <Award className="h-8 w-8 text-luxury-accent" />, title: "Confidence Coaching" },
            { icon: <Trophy className="h-8 w-8 text-luxury-accent" />, title: "Event-Specific Styling" }
          ].map((item, i) => (
            <div
              key={i}
              className="p-8 md:p-10 bg-luxury-cream/40 backdrop-blur-sm border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 rounded-2xl hover:-translate-y-2 group"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <h3 className="text-xl md:text-2xl luxury-heading text-center text-luxury-charcoal">{item.title}</h3>
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 mb-12 md:mb-16">
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-2">
            <div className="p-8 md:p-12 lg:p-16">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl lg:text-5xl luxury-heading mb-6 text-luxury-charcoal">
                  ICONIK Style Consultation
                </h3>
                <div className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 text-luxury-accent">₹1,199</div>
                <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70">
                  Complete personal style transformation
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-2xl luxury-heading mb-8 text-luxury-charcoal">What&apos;s Included:</h4>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Complete style assessment tailored to your features
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Personalized color palette that makes your skin glow
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Body-flattering silhouettes that work with your shape
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        Hair & beauty advice for your unique features
                      </span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                      <span className="luxury-body text-luxury-charcoal/80 text-lg">
                        20-minute one-on-one call with expert stylist
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-luxury-gold/10 border border-luxury-gold/20 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-6">✨</div>
                  <h4 className="text-2xl luxury-heading text-luxury-charcoal mb-4">Personal Touch</h4>
                  <p className="luxury-body text-luxury-charcoal/70 text-lg">Tailored specifically for you</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link
                  href="/checkout"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.fbq) {
                      window.fbq("track", "Lead", {
                        content_name: "Style Consultation CTA Click",
                        content_category: "Style Consultation",
                        value: 1199,
                        currency: "INR",
                      })
                    }
                  }}
                  className="inline-flex items-center bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-16 py-5 rounded-full text-xl luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  ✨ Get Your Style Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Plan */}
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="bg-luxury-cream/40 backdrop-blur-sm rounded-3xl border border-luxury-cream hover:bg-luxury-cream/60 transition-all duration-300 overflow-hidden hover:-translate-y-2">
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl luxury-heading mb-4 text-luxury-charcoal">
                  Complete ICONIK Package
                </h3>
                <div className="text-5xl md:text-6xl font-semibold mb-4 text-luxury-accent">₹2,297</div>
                <p className="text-xl md:text-2xl luxury-subheading text-luxury-charcoal/70">
                  Style + Shopping + Wellness Bundle
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-2xl luxury-heading mb-8 text-luxury-charcoal">What&apos;s Included:</h4>
                  <ul className="space-y-6">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <CheckCircle className="w-6 h-6 text-luxury-accent flex-shrink-0 mt-1" />
                        <span className="luxury-body text-luxury-charcoal/80 text-lg">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-luxury-gold/10 border border-luxury-gold/20 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-6">💰</div>
                  <h4 className="text-2xl luxury-heading text-luxury-charcoal mb-4">Bundle Savings</h4>
                  <p className="luxury-body text-luxury-charcoal/70 mb-3 text-lg">Individual Price: ₹2,197</p>
                  <div className="text-3xl font-semibold text-luxury-accent mb-2">Save ₹800</div>
                  <p className="luxury-body text-luxury-accent text-sm">Limited time bundle</p>
                </div>
              </div>
              
              <div className="bg-luxury-red/10 border border-luxury-red/20 rounded-2xl p-6 mb-8 text-center">
                <p className="luxury-body text-luxury-red-700 text-lg">⚠️ Only 15 slots available this week</p>
              </div>
              
              <div className="text-center">
                <Link
                  href="/checkout"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.fbq) {
                      window.fbq("track", "Lead", {
                        content_name: "Complete Package CTA Click",
                        content_category: "Style Transformation Package",
                        value: 2297,
                        currency: "INR",
                      })
                    }
                  }}
                  className="inline-flex items-center bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-16 py-5 rounded-full text-xl luxury-body hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  ✨ Transform Now
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
                  
                <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center ${
                  item.color === 'red' ? 'bg-red-100' :
                  item.color === 'orange' ? 'bg-orange-100' : 'bg-rose-100'
                }`}>
                  <item.icon className={`w-6 h-6 md:w-8 md:h-8 ${
                    item.color === 'red' ? 'text-red-600' :
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-6xl luxury-heading mb-6 text-luxury-charcoal">
            Frequently Asked Questions
          </h2>
          <p className="luxury-body text-luxury-charcoal/70 max-w-3xl mx-auto text-lg md:text-xl">
            Everything you need to know about our consultations.
          </p>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="text-left p-8 md:p-10 bg-luxury-warm-white/80 backdrop-blur-sm rounded-2xl border border-luxury-cream hover:bg-luxury-warm-white transition-all duration-300 hover:-translate-y-1"
            >
              <h3 className="text-xl md:text-2xl luxury-heading mb-4 text-luxury-charcoal">{faq.question}</h3>
              <p className="luxury-body text-luxury-charcoal/80 text-lg leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 px-4 bg-luxury-charcoal">
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
                  if (typeof window !== "undefined" && window.fbq) {
                    window.fbq("track", "Lead", {
                      content_name: "Final CTA Click",
                      content_category: "Style Transformation Program",
                      value: 1199,
                      currency: "INR",
                    })
                  }
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

              <p className="luxury-body opacity-75 text-center">₹1,199 + GST • Limited slots available</p>
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
                  className="luxury-body text-luxury-charcoal/60 hover:text-luxury-accent transition-colors"
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
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Stories
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
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
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Shipping & Delivery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="luxury-body text-luxury-charcoal/70 hover:text-luxury-accent transition-colors"
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
      <div className="fixed bottom-0 left-0 right-0 bg-luxury-warm-white/98 backdrop-blur-xl border-t border-luxury-cream p-4 md:hidden z-50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="luxury-body text-luxury-charcoal/70">Complete Package</div>
              <div className="text-2xl font-semibold text-luxury-charcoal">₹1,199</div>
            </div>
            <div className="text-right">
              <div className="luxury-body text-luxury-charcoal/60 text-sm">Offer Expires In:</div>
              <div className="luxury-body text-luxury-accent">14:59:23</div>
            </div>
          </div>
          <Link
            href="/checkout"
            onClick={() => {
              // Track CTA click with Meta Pixel
              if (typeof window !== "undefined" && window.fbq) {
                window.fbq("track", "Lead", {
                  content_name: "Mobile Sticky CTA Click",
                  content_category: "Transformation Program",
                })
              }
            }}
            className="w-full bg-luxury-charcoal hover:bg-luxury-accent text-luxury-warm-white px-6 py-4 text-lg rounded-full transition-all duration-300 luxury-body text-center block"
          >
            Begin Your Transformation
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
