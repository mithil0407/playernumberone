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
import CountdownTimer from '../components/CountdownTimer';
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
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-rose-50 text-gray-900 scroll-smooth overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-rose-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-light tracking-wide text-gray-900 font-display">ICONIK</span>
            </div>
            <div className="hidden md:flex items-center space-x-10 font-['Inter',sans-serif]">
              <a href="#features" className="text-gray-700 hover:text-rose-600 transition-colors font-light tracking-wide">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-rose-600 transition-colors font-light tracking-wide">Stories</a>
              <a href="#pricing" className="text-gray-700 hover:text-rose-600 transition-colors font-light tracking-wide">Investment</a>
              <a href="#faq" className="text-gray-700 hover:text-rose-600 transition-colors font-light tracking-wide">FAQ</a>
              <Link
                href="/checkout"
                className="bg-brand-cta hover:opacity-90 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-light tracking-wide"
              >
                Begin Journey
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
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
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-rose-100"
          >
            <div className="px-6 py-6 space-y-4">
              <a href="#features" className="block text-gray-700 hover:text-rose-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-rose-50 transition-colors">Features</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-rose-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-rose-50 transition-colors">Stories</a>
              <a href="#pricing" className="block text-gray-700 hover:text-rose-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-rose-50 transition-colors">Investment</a>
              <a href="#faq" className="block text-gray-700 hover:text-rose-600 px-4 py-3 text-base font-light tracking-wide rounded-lg hover:bg-rose-50 transition-colors">FAQ</a>
              <Link
                href="/checkout"
                className="block bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 py-4 rounded-full text-base font-light tracking-wide text-center mt-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Begin Journey
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 md:pt-40 pb-16 md:pb-32 px-4 md:px-6 lg:px-8 relative overflow-hidden" id="hero">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* Press Logos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 md:mt-8 mb-4 md:mb-8"
            >
              <p className="text-sm md:text-base text-gray-500 mb-4 font-medium text-center">Featured on:</p>
              <div className="flex items-center justify-center gap-3 md:gap-6 lg:gap-8">
                <Image
                  src="/times-of-india-logo.png"
                  alt="Times of India"
                  width={120}
                  height={40}
                  className="opacity-70 hover:opacity-100 transition-opacity h-[30px] w-auto md:h-[70px]"
                />
                <Image
                  src="/femina-logo.png"
                  alt="Femina"
                  width={120}
                  height={40}
                  className="opacity-70 hover:opacity-100 transition-opacity h-[30px] w-auto md:h-[70px]"
                />
                <Image
                  src="/vogue-india-logo.png"
                  alt="Vogue India"
                  width={120}
                  height={40}
                  className="opacity-70 hover:opacity-100 transition-opacity h-[30px] w-auto md:h-[70px]"
                />
              </div>
            </motion.div>
            <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-8xl font-light text-gray-900 mb-6 md:mb-8 leading-tight tracking-tight font-display"
            >
              Bespoke Fashion
              <br />
              <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent font-semibold">Consultations</span>
              <br />
              <span className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-600 font-display">for the Modern Indian Woman</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light font-['Inter',sans-serif] px-4"
            >
              Elevate your presence. Transform your confidence. Discover the artistry of personal style 
              with our curated fashion expertise.
            </motion.p>
            
            {/* Book Image Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="max-w-4xl mx-auto mb-8 md:mb-12"
            >
              <div className="bg-gradient-to-br from-pink-100 via-white to-rose-100 rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl border border-pink-100">
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
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-light text-gray-800 mb-2 font-display">Your Personal Style Guide</h3>
                  <p className="text-gray-600 font-light text-base md:text-lg font-['Inter',sans-serif]">Comprehensive style transformation roadmap</p>
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
                className="inline-block bg-brand-cta hover:opacity-90 text-white px-8 md:px-12 py-4 md:py-6 text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 font-light tracking-wide"
            >
                Begin Your Transformation <ArrowRight className="ml-3 h-5 w-5 inline" />
            </Link>
          </motion.div>

          </div>
        </div>
      </section>

      {/* Elegant Stats */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-rose-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-12 md:mb-20">
            <div className="text-center group">
              <div className="text-3xl md:text-5xl font-light text-rose-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">200+</div>
              <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Transformations</div>
                      </div>
            <div className="text-center group">
              <div className="text-3xl md:text-5xl font-light text-rose-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">95%</div>
              <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Confidence Elevation</div>
                    </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl md:text-5xl font-light text-rose-600">4.9</span>
                <Star className="h-5 w-5 md:h-7 md:w-7 text-amber-400 fill-current ml-1 md:ml-2" />
                      </div>
              <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Client Satisfaction</div>
                    </div>
            <div className="text-center group">
              <div className="text-3xl md:text-5xl font-light text-rose-600 mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">2-3</div>
              <div className="text-sm md:text-base text-gray-600 font-light tracking-wide font-['Inter',sans-serif]">Weeks to Elegance</div>
                  </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-display">What You Receive</h2>
          <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif] text-base md:text-lg px-4">Every consultation is tailored to celebrate your individuality and elevate your personal style.</p>
                </div>
                
        <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {[
            { icon: <Sparkles className="h-8 w-8 text-rose-500" />, title: "Personal Style Assessment" },
            { icon: <Gem className="h-8 w-8 text-rose-500" />, title: "Curated Outfit Planning" },
            { icon: <Heart className="h-8 w-8 text-rose-500" />, title: "Makeup & Grooming Guidance" },
            { icon: <Shield className="h-8 w-8 text-rose-500" />, title: "Wardrobe Strategy" },
            { icon: <Award className="h-8 w-8 text-rose-500" />, title: "Confidence Coaching" },
            { icon: <Trophy className="h-8 w-8 text-rose-500" />, title: "Event-Specific Styling" }
          ].map((item, i) => (
            <div key={i} className="p-6 md:p-8 shadow-lg border-rose-100 hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl hover:-translate-y-1 transition-transform duration-300">
              <div className="flex flex-col items-center space-y-3 md:space-y-4">
                {item.icon}
                <h3 className="text-lg md:text-2xl font-light font-display text-center">{item.title}</h3>
              </div>
            </div>
              ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-display">Client Stories</h2>
          <p className="text-gray-600 font-light max-w-3xl mx-auto text-base md:text-lg px-4">Hear from women who transformed their confidence and presence with ICONIK.</p>
                </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 md:p-8 shadow-lg border-rose-100 hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl hover:-translate-y-1 transition-transform duration-300">
              <div className="space-y-3 md:space-y-4">
                <div className="aspect-square bg-gradient-to-br from-pink-100 via-white to-rose-100 flex items-center justify-center rounded-lg overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-gray-700 font-light font-['Inter',sans-serif] text-center text-sm md:text-base">&ldquo;{testimonial.story}&rdquo;</p>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">{testimonial.name}</p>
                  <div className="flex justify-center gap-1">
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-400 fill-current" />
                  </div>
                </div>
              </div>
            </div>
            ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-light mb-4 md:mb-6 font-display">Investment</h2>
          <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif] text-base md:text-lg px-4">Select a package that aligns with your journey to elegance.</p>
                  </div>

          {/* Main Product */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 mb-8 md:mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-rose-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6 md:p-8 lg:p-12">
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-light mb-3 md:mb-4 font-display text-gray-900">ICONIK Style Consultation</h3>
                <div className="text-4xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-4 font-['Cormorant Garamond',serif] text-gradient-brand">₹1,199</div>
                <p className="text-base md:text-lg lg:text-xl font-light text-gray-600 font-['Inter',sans-serif]">Complete personal style transformation</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xl font-light mb-6 text-gray-900 font-display">What&apos;s Included:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">Complete style assessment tailored to your features</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">Personalized color palette that makes your skin glow</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">Body-flattering silhouettes that work with your shape</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">Hair & beauty advice for your unique features</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-light font-['Inter',sans-serif]">20-minute one-on-one call with expert stylist</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6 text-center">
                  <div className="text-center">
                    <div className="text-3xl mb-4">✨</div>
                    <h4 className="text-xl font-light text-gray-900 mb-3 font-['Cormorant Garamond',serif]">Personal Touch</h4>
                    <p className="text-gray-600 font-light font-['Inter',sans-serif]">Tailored specifically for you</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Style Consultation CTA Click',
                        content_category: 'Style Consultation',
                        value: 1199,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="inline-block bg-brand-cta hover:opacity-90 text-white px-12 py-4 rounded-full text-lg font-light hover:shadow-xl transition-all duration-300"
                >
                  ✨ Get Your Style Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Plan */}
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border-rose-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="p-8 md:p-12">
                <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl font-light mb-4 font-display text-gray-900">Complete ICONIK Package</h3>
                <div className="text-5xl md:text-6xl font-light mb-4 font-['Cormorant Garamond',serif] text-gradient-brand">₹2,297</div>
                <p className="text-lg md:text-xl font-light text-gray-600 font-['Inter',sans-serif]">Style + Shopping + Wellness Bundle</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xl font-light mb-6 text-gray-900 font-['Cormorant Garamond',serif]">What&apos;s Included:</h4>
                  <ul className="space-y-4">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-light font-['Inter',sans-serif]">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 text-center">
                  <div className="text-center">
                    <div className="text-3xl mb-4">💰</div>
                    <h4 className="text-xl font-light text-gray-900 mb-3 font-display">Bundle Savings</h4>
                    <p className="text-gray-600 font-light font-['Inter',sans-serif] mb-3">Individual Price: ₹2,197</p>
                    <div className="text-3xl font-light text-orange-600 mb-2 font-['Cormorant Garamond',serif]">Save ₹800</div>
                    <p className="text-sm text-orange-600 font-light font-['Inter',sans-serif]">(Limited time bundle)</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
                <p className="text-red-700 font-light text-lg font-['Inter',sans-serif]">
                  ⚠️ Only 15 slots available this week
                </p>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/checkout" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.fbq) {
                      window.fbq('track', 'Lead', {
                        content_name: 'Complete Package CTA Click',
                        content_category: 'Style Transformation Package',
                        value: 2297,
                        currency: 'INR'
                      });
                    }
                  }}
                  className="inline-block bg-brand-cta hover:opacity-90 text-white px-12 py-4 rounded-full text-lg font-light hover:shadow-xl transition-all duration-300"
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
            <h2 className="text-5xl font-light mb-6 font-display text-gray-900">
              See the Transformation
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
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
                <div className="bg-white rounded-2xl shadow-lg border-rose-100 p-6 md:p-8 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform duration-300">
                <h3 className="text-2xl md:text-3xl font-light text-gray-900 mb-6 md:mb-8 text-center font-display">{comparison.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="text-center">
                      <div className="text-sm md:text-base font-light text-gray-600 mb-3">Before</div>
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
                      <div className="text-sm md:text-base font-light text-gray-600 mb-3">After</div>
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
                  
                  <p className="text-base md:text-lg text-gray-600 text-center leading-relaxed font-light font-['Inter',sans-serif]">{comparison.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-8 md:py-16 lg:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-5xl font-light mb-6 font-display text-gray-900">
              Sound Familiar?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
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
                className="group relative bg-white rounded-2xl shadow-lg border-rose-100 p-4 md:p-6 lg:p-8 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1 transition-transform duration-300"
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
                <p className="text-lg md:text-xl font-light text-gray-900 text-center leading-relaxed">{item.text}</p>
                  
                  {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center mb-16">
          <h2 className="text-5xl font-light mb-6 font-display">Frequently Asked Questions</h2>
          <p className="text-gray-600 font-light max-w-3xl mx-auto font-['Inter',sans-serif]">Everything you need to know about our consultations.</p>
                </div>
        <div className="max-w-4xl mx-auto space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="text-left p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-rose-100 hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-xl font-light mb-3 font-display text-gray-900">{faq.question}</h3>
              <p className="text-gray-600 font-light font-['Inter',sans-serif]">{faq.answer}</p>
              </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-8 md:py-16 lg:py-20 px-4 bg-brand-cta">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-light mb-6 font-display">
              Ready to Discover Your Signature Style?
            </h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto px-4 font-light font-['Inter',sans-serif]">
              Join 200+ women who have already transformed their confidence and discovered their elegant style
            </p>
            <div className="space-y-6">
          <Link 
                href="/checkout" 
                onClick={() => {
                  // Track final CTA click with Meta Pixel
                  if (typeof window !== 'undefined' && window.fbq) {
                    window.fbq('track', 'Lead', {
                      content_name: 'Final CTA Click',
                      content_category: 'Style Transformation Program',
                      value: 1199,
                      currency: 'INR'
                    });
                  }
                }}
                className="group relative w-full max-w-sm mx-auto bg-white/90 backdrop-blur-xl text-gradient-brand px-8 py-4 rounded-full text-xl font-light hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/30 flex items-center justify-center gap-3"
              >
                <span className="relative z-10">✨ Start Your ICONIK Transformation Today</span>
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              
              {/* Mobile Trust & Urgency */}
              <div className="max-w-sm mx-auto space-y-3">
                <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 text-center">
                  <p className="text-white font-light text-lg font-['Inter',sans-serif]">⏰ Limited Time Offer</p>
                  <p className="text-white/80 text-sm font-light font-['Inter',sans-serif]">Only 15 slots available this week</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/80 font-light font-['Inter',sans-serif]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>7-Day Money Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>200+ Success Stories</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm opacity-75 text-center">₹1,199 + GST • Limited slots available</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gradient-to-b from-white to-rose-50 border-t border-rose-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-3xl font-light bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-4 font-display">
                ICONIK
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Discover your signature style, boost your confidence, and embrace your elegant, authentic self.
              </p>
              <div className="flex gap-4">
                <a href="mailto:support@playernumberone.com" className="text-gray-400 hover:text-white transition-colors">
                  support@playernumberone.com
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Stories</a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
                </li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal & Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping & Delivery</Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 PlayerNumberOne ICONIK. All rights reserved. | Transform with elegance.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Business Legal Name: MITHIL NILESH NAVALAKHA
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Results may vary. Individual success depends on effort and commitment to the program.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-rose-100 p-4 md:hidden z-50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-light text-gray-600 font-['Inter',sans-serif]">Complete Package</div>
              <div className="text-xl font-light text-gray-900 font-['Cormorant Garamond',serif]">₹1,199</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-light text-gray-500 font-['Inter',sans-serif]">Offer Expires In:</div>
              <div className="text-sm font-light text-rose-600 font-['Cormorant Garamond',serif]">14:59:23</div>
            </div>
          </div>
          <Link
            href="/checkout"
            onClick={() => {
              // Track CTA click with Meta Pixel
              if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'Lead', {
                  content_name: 'Mobile Sticky CTA Click',
                  content_category: 'Transformation Program'
                });
              }
            }}
            className="w-full bg-brand-cta hover:opacity-90 text-white px-6 py-3 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-light tracking-wide text-center block"
          >
            Begin Your Transformation
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
